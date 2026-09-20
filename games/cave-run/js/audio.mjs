/**
 * CAVE RUN audio: an original, procedural industrial score.
 * No samples, network requests, borrowed melodies, or audio before unlock().
 * Call unlock() from a real pointer/keyboard gesture, then setPlaying(true).
 */
const clamp = (n, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, Number(n) || 0));
const BPM = 96;
const STEP = 60 / BPM / 4;
const MAX_VOICES = 28;
const ROOT = 36.70809599; // Low D; voicing extends above the fundamental.
const RIFFS = [
  [0, null, 0, 1, null, 0, 3, null, 0, 0, null, 6, 3, null, 1, null],
  [0, 0, null, 0, 3, null, 1, null, 0, null, 0, 6, null, 3, 1, null],
  [0, null, 0, null, 1, 0, null, 3, 0, null, 6, null, 3, 1, null, null],
  [0, null, 3, 0, null, 1, 0, null, 6, null, 3, 1, null, 0, null, null],
];
const KICKS = [[0, 3, 6, 8, 10, 14], [0, 2, 7, 8, 11, 14]];

export class AudioEngine {
  constructor() {
    this.context = null;
    this.enabled = true;
    this.volume = 0.58;
    this.playing = false;
    this.intensity = 0.25;
    this.unlocked = false;
    this.available = true;
    this.disposed = false;
    this._timer = null;
    this._voices = new Set();
    this._step = 0;
    this._nextTime = 0;
    this._seed = 0x51ab129;
    this._fxLast = new Map();
    this._visibility = () => {
      if (this._hidden()) {
        this._stop();
        this.context?.suspend?.().catch(() => {});
      } else {
        this._sync();
      }
    };
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', this._visibility);
  }

  /** Returns false for unsupported/blocked audio. Safe to call repeatedly. */
  async unlock() {
    if (this.disposed || !this.available) return false;
    try {
      if (!this.context) {
        const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!Context) { this.available = false; return false; }
        this.context = new Context({ latencyHint: 'interactive' });
        this._buildGraph();
      }
      if (this.context.state !== 'running') await this.context.resume();
      this.unlocked = this.context.state === 'running';
      if (this.unlocked) this._sync();
      return this.unlocked;
    } catch {
      // Gameplay remains usable if an OS, browser, or embed refuses audio.
      return false;
    }
  }

  setEnabled(value) {
    const next = Boolean(value);
    if (this.enabled === next) return;
    this.enabled = next;
    if (!this.enabled) {
      this._stop();
      this.context?.suspend?.().catch(() => {});
    } else this._sync();
  }

  setVolume(value) {
    this.volume = clamp(value);
    if (this._master && this.context) this._master.gain.setTargetAtTime(this.volume * 0.65, this.context.currentTime, 0.035);
  }

  setPlaying(value) {
    const next = Boolean(value);
    if (this.playing === next) return;
    this.playing = next;
    this._sync();
  }

  setIntensity(value) {
    this.intensity = clamp(value);
  }

  /** Accepts a string, {type/name/kind: string}, or an array of either. */
  events(events) {
    if (!this._ready()) return;
    for (const event of Array.isArray(events) ? events : [events]) {
      const type = typeof event === 'string' ? event : (event?.type || event?.name || event?.kind);
      if (!type) continue;
      const now = this.context.currentTime;
      const gap = type === 'land' ? 0.14 : type === 'hit' ? 0.065 : 0.035;
      if (now - (this._fxLast.get(type) ?? -Infinity) < gap) continue;
      this._fxLast.set(type, now);
      this._effect(type, now + 0.004, event);
    }
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this._stop();
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', this._visibility);
    this._fxLast.clear();
    this.context?.close?.().catch(() => {});
    this.context = null;
  }

  _hidden() { return typeof document !== 'undefined' && document.hidden; }
  _ready() { return !this.disposed && this.unlocked && this.enabled && !this._hidden() && this.context?.state === 'running'; }

  _random() {
    this._seed ^= this._seed << 13; this._seed ^= this._seed >>> 17; this._seed ^= this._seed << 5;
    return (this._seed >>> 0) / 4294967296;
  }

  _buildGraph() {
    const c = this.context;
    this._music = c.createGain(); this._music.gain.value = 0.65;
    this._fx = c.createGain(); this._fx.gain.value = 0.75;
    this._mix = c.createGain();
    this._limiter = c.createDynamicsCompressor();
    this._limiter.threshold.value = -14;
    this._limiter.knee.value = 8;
    this._limiter.ratio.value = 10;
    this._limiter.attack.value = 0.003;
    this._limiter.release.value = 0.16;
    this._master = c.createGain(); this._master.gain.value = this.volume * 0.65;
    // Remove inaudible rumble; keep low guitar and kick intact.
    this._highpass = c.createBiquadFilter(); this._highpass.type = 'highpass'; this._highpass.frequency.value = 28;
    this._music.connect(this._mix); this._fx.connect(this._mix);
    this._mix.connect(this._highpass); this._highpass.connect(this._limiter);
    this._limiter.connect(this._master); this._master.connect(c.destination);

    this._room = c.createConvolver();
    const impulse = c.createBuffer(2, Math.floor(c.sampleRate * 0.85), c.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < data.length; i++) data[i] = (this._random() * 2 - 1) * Math.pow(1 - i / data.length, 3.5) * 0.4;
    }
    this._room.buffer = impulse;
    this._roomGain = c.createGain(); this._roomGain.gain.value = 0.13;
    this._room.connect(this._roomGain); this._roomGain.connect(this._music);
    this._noiseBuffer = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const noise = this._noiseBuffer.getChannelData(0);
    for (let i = 0; i < noise.length; i++) noise[i] = this._random() * 2 - 1;
    this._drive = new Float32Array(2048);
    for (let i = 0; i < this._drive.length; i++) {
      const x = i * 2 / (this._drive.length - 1) - 1;
      this._drive[i] = Math.tanh(4 * x) / Math.tanh(4);
    }
  }

  _sync() {
    if (this.disposed || !this.enabled || this._hidden() || !this.unlocked) { this._stop(); return; }
    if (!this.playing) { this._stop(true); return; }
    if (this.context?.state === 'suspended') {
      this.context.resume().then(() => { if (this.context?.state === 'running') this._start(); }).catch(() => {});
    } else if (this._ready()) this._start();
  }

  _start() {
    if (this._timer || !this._ready() || !this.playing) return;
    // Resume on a full bar so a paused fragment never becomes a stray attack.
    this._step = Math.ceil(this._step / 16) * 16;
    this._nextTime = this.context.currentTime + 0.055;
    this._music.gain.cancelScheduledValues(this.context.currentTime);
    this._music.gain.setTargetAtTime(0.65, this.context.currentTime, 0.06);
    const tick = () => {
      if (!this._ready() || !this.playing) { this._stop(); return; }
      const now = this.context.currentTime;
      // Throttled tabs do not pile up or emit overdue notes in one burst.
      if (this._nextTime < now - STEP) this._nextTime = now + 0.03;
      while (this._nextTime < now + 0.12) {
        this._scheduleStep(this._step++, this._nextTime);
        this._nextTime += STEP;
      }
    };
    tick();
    this._timer = setInterval(tick, 25);
  }

  _stop(musicOnly = false) {
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
    if (!this.context) return;
    const now = this.context.currentTime;
    if (this._music) {
      this._music.gain.cancelScheduledValues(now);
      this._music.gain.setTargetAtTime(0.0001, now, 0.015);
    }
    for (const voice of [...this._voices]) if (!musicOnly || voice.bus !== 'fx') this._release(voice, now);
  }

  _voice(time, duration, bus, level = 1) {
    if (this._voices.size >= MAX_VOICES) {
      const oldest = this._voices.values().next().value;
      this._release(oldest, this.context.currentTime);
    }
    const gain = this.context.createGain();
    gain.gain.value = 0;
    gain.connect(bus === 'fx' ? this._fx : this._music);
    const voice = { gain, bus, nodes: [gain], sources: [], end: time + duration, done: false };
    this._voices.add(voice);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(Math.max(0.0001, level), time + Math.min(0.008, duration / 8));
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    return voice;
  }

  _source(voice, node, time, duration) {
    voice.sources.push(node); voice.nodes.push(node);
    node.onended = () => {
      node._caveEnded = true;
      if (voice.sources.every(s => s._caveEnded)) this._cleanup(voice);
    };
    node.start(time); node.stop(time + duration + 0.015);
    return node;
  }

  _cleanup(voice) {
    if (voice.done) return;
    voice.done = true; this._voices.delete(voice);
    for (const node of voice.nodes) { try { node.disconnect(); } catch {} }
  }

  _release(voice, time) {
    if (voice.done) return;
    voice.gain.gain.cancelScheduledValues(time);
    voice.gain.gain.setTargetAtTime(0.0001, time, 0.006);
    for (const source of voice.sources) { try { source.stop(time + 0.025); } catch {} }
    this._voices.delete(voice);
  }

  _osc(voice, type, frequency, time, duration, target = voice.gain, endFrequency = null) {
    const osc = this.context.createOscillator(); osc.type = type;
    osc.frequency.setValueAtTime(frequency, time);
    if (endFrequency) osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), time + duration);
    osc.connect(target); return this._source(voice, osc, time, duration);
  }

  _noise(time, duration, frequency, q, level, bus = 'music', type = 'bandpass', room = false) {
    const voice = this._voice(time, duration, bus, level);
    const filter = this.context.createBiquadFilter(); filter.type = type; filter.frequency.value = frequency; filter.Q.value = q;
    filter.connect(voice.gain); voice.nodes.push(filter);
    if (room) voice.gain.connect(this._room);
    const source = this.context.createBufferSource(); source.buffer = this._noiseBuffer;
    source.connect(filter); this._source(voice, source, time, duration);
    return voice;
  }

  _guitar(time, semitone, open = false, accent = 1) {
    const duration = open ? STEP * 1.8 : STEP * 0.8;
    const voice = this._voice(time, duration, 'music', (0.075 + this.intensity * 0.025) * accent);
    const drive = this.context.createWaveShaper(); drive.curve = this._drive; drive.oversample = '2x';
    const filter = this.context.createBiquadFilter(); filter.type = 'lowpass'; filter.Q.value = 0.65;
    filter.frequency.setValueAtTime(open ? 2600 : 1600, time);
    filter.frequency.exponentialRampToValueAtTime(open ? 850 : 360, time + duration);
    const pre = this.context.createGain(); pre.gain.value = 0.8;
    pre.connect(drive); drive.connect(filter); filter.connect(voice.gain);
    voice.nodes.push(pre, drive, filter);
    const frequency = ROOT * Math.pow(2, semitone / 12);
    this._osc(voice, 'sawtooth', frequency * 2, time, duration, pre);
    this._osc(voice, 'triangle', frequency * 3.003, time, duration, pre);
    this._osc(voice, 'triangle', frequency, time, duration, pre);
    if (open) voice.gain.connect(this._room);
  }

  _bass(time, semitone, duration = STEP * 1.7) {
    const voice = this._voice(time, duration, 'music', 0.15);
    this._osc(voice, 'sine', ROOT * Math.pow(2, semitone / 12), time, duration);
  }

  _kick(time, accent = 1, bus = 'music') {
    const voice = this._voice(time, 0.23, bus, 0.35 * accent);
    const osc = this._osc(voice, 'sine', 132, time, 0.23);
    osc.frequency.exponentialRampToValueAtTime(44, time + 0.065);
    osc.frequency.exponentialRampToValueAtTime(34, time + 0.23);
    this._noise(time, 0.019, 2700, 0.8, 0.11 * accent, bus);
  }

  _snare(time, accent = 1) {
    this._noise(time, 0.17, 1850, 0.8, 0.26 * accent, 'music', 'highpass', true);
    const voice = this._voice(time, 0.115, 'music', 0.16 * accent);
    this._osc(voice, 'triangle', 185, time, 0.115, voice.gain, 105);
  }

  _pad(time, bar) {
    // Open fifth plus a slowly changing upper color; no recognisable tune.
    const duration = STEP * 16 * 1.8;
    const voice = this._voice(time, duration, 'music', 0.026);
    voice.gain.gain.cancelScheduledValues(time);
    voice.gain.gain.setValueAtTime(0.0001, time);
    voice.gain.gain.linearRampToValueAtTime(0.026, time + 0.7);
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    const filter = this.context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 580; filter.Q.value = 0.4;
    filter.connect(voice.gain); voice.nodes.push(filter); voice.gain.connect(this._room);
    const color = [15, 14, 10, 13][Math.floor(bar / 2) % 4];
    [0, 7, color].forEach((note, i) => this._osc(voice, 'triangle', ROOT * 4 * Math.pow(2, note / 12) * (1 + (i - 1) * 0.0018), time, duration, filter));
  }

  _scheduleStep(index, time) {
    const step = index % 16, bar = Math.floor(index / 16);
    const riff = RIFFS[bar % RIFFS.length];
    const semitone = riff[step];
    const breathingBar = bar % 8 === 7;
    if (semitone !== null && !(breathingBar && step >= 12)) {
      this._guitar(time, semitone, step === 6 || step === 11, step === 0 ? 1.15 : 0.92);
      if (step % 2 === 0 || step === 3) this._bass(time, semitone);
    }
    if (KICKS[bar % 2].includes(step) && !(breathingBar && step === 14)) this._kick(time, step === 0 ? 1 : 0.8);
    if (step === 4 || step === 12) this._snare(time, 1);
    // Closed hats and sparse ghost notes keep an off-grid, human feel.
    if (step % 2 === 0 || (this.intensity > 0.65 && step % 4 === 3)) {
      const open = step === 14 && bar % 2 === 1;
      this._noise(time + (step % 4 === 2 ? 0.008 : 0), open ? 0.15 : 0.043, 6800, 0.6, open ? 0.047 : 0.036, 'music', 'highpass');
    }
    if (bar % 4 === 3 && (step === 11 || step === 15)) this._snare(time + 0.006, 0.27);
    if (step === 0 && bar % 2 === 0) this._pad(time, bar);
  }

  _tone(time, frequency, endFrequency, duration, level = 0.15, type = 'triangle') {
    const voice = this._voice(time, duration, 'fx', level);
    this._osc(voice, type, frequency, time, duration, voice.gain, endFrequency);
    return voice;
  }

  _effect(type, time) {
    switch (type) {
      case 'jump':
        this._noise(time, 0.14, 800, 0.65, 0.09, 'fx');
        this._tone(time, 95, 190, 0.115, 0.045); break;
      case 'swing':
      case 'attack':
        this._noise(time, 0.115, 1200, 0.65, 0.18, 'fx'); break;
      case 'hit':
        this._tone(time, 145, 45, 0.115, 0.2);
        this._noise(time, 0.075, 1250, 1.1, 0.2, 'fx'); break;
      case 'hurt':
      case 'damage':
        this._tone(time, 87, 38, 0.26, 0.23, 'sawtooth');
        this._noise(time, 0.2, 650, 0.8, 0.21, 'fx'); break;
      case 'pickup':
      case 'collect':
        [0, 7].forEach((n, i) => this._tone(time + i * 0.045, 330 * 2 ** (n / 12), 329 * 2 ** (n / 12), 0.24, 0.065, 'sine'));
        this._noise(time, 0.055, 4700, 0.75, 0.025, 'fx'); break;
      case 'checkpoint':
        [0, 7, 12].forEach((n, i) => this._tone(time + i * 0.095, 196 * 2 ** (n / 12), 196 * 2 ** (n / 12), 0.65, 0.09, 'sine'));
        this._noise(time, 0.25, 540, 0.8, 0.075, 'fx'); break;
      case 'boss':
        this._tone(time, 55, 35, 0.9, 0.21, 'sawtooth');
        this._tone(time + 0.045, 82, 52, 0.85, 0.09);
        this._noise(time, 0.7, 460, 1.3, 0.15, 'fx'); break;
      case 'slam-warning':
        this._tone(time, 110, 75, 0.45, 0.12, 'sawtooth');
        this._tone(time + 0.14, 165, 120, 0.3, 0.06); break;
      case 'slam':
        this._kick(time, 0.85, 'fx');
        this._noise(time, 0.45, 450, 0.8, 0.19, 'fx'); break;
      case 'hazardwarning':
        this._tone(time, 360, 240, 0.18, 0.06);
        this._noise(time, 0.24, 1700, 0.7, 0.075, 'fx'); break;
      case 'hazardactive':
        this._noise(time, 0.38, 950, 0.8, 0.15, 'fx');
        this._tone(time, 90, 45, 0.2, 0.09); break;
      case 'complete':
      case 'stageclear':
      case 'levelcomplete':
      case 'win':
        [0, 7, 10, 12].forEach((n, i) => this._tone(time + i * 0.14, 146.832 * 2 ** (n / 12), 146.832 * 2 ** (n / 12), 0.85, 0.095, 'triangle'));
        this._kick(time, 0.6, 'fx'); break;
      case 'death':
        this._tone(time, 110, 28, 0.8, 0.21, 'triangle');
        this._noise(time, 0.65, 500, 0.7, 0.19, 'fx'); break;
      case 'dodge':
        this._noise(time, 0.16, 1600, 0.5, 0.1, 'fx'); break;
      case 'land':
        this._tone(time, 80, 38, 0.095, 0.08);
        this._noise(time, 0.075, 350, 0.8, 0.09, 'fx'); break;
      default: break;
    }
  }
}
