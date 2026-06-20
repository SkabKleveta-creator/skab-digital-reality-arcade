# OPTIONAL ROOT INDEX PATCH — NOT APPLIED

Purpose:
Add a hidden Evidence Archive Easter egg to the existing root `index.html` without adding a visible Evidence tab.

Target:
Use the existing status/version/title element if available. If there is no suitable element, add the class `evidence-easter-trigger` to the smallest existing status/title element.

Link:
`/skab-digital-reality-arcade/evidence/` for GitHub Pages project site behavior, or `evidence/` as a relative link from root.

---

## CSS to add inside the existing `<style>` block

```css
/* Evidence Archive Easter egg: subtle glitch/fire curiosity cue */
.evidence-easter-trigger{
  cursor:pointer;
  position:relative;
  user-select:none;
}
.evidence-easter-trigger::after{
  content:"";
  opacity:0;
  margin-left:.35rem;
}
.evidence-easter-trigger.evidence-glitch{
  animation:evidenceGlitch .18s steps(2,end) infinite;
  text-shadow:0 0 10px rgba(111,232,255,.55), 2px 0 rgba(255,79,216,.45), -2px 0 rgba(104,255,154,.35);
}
.evidence-easter-trigger.evidence-glitch::after{
  content:"🔥";
  opacity:1;
}
@keyframes evidenceGlitch{
  0%{transform:translate(0,0)}
  25%{transform:translate(1px,-1px)}
  50%{transform:translate(-1px,1px)}
  75%{transform:translate(1px,1px)}
  100%{transform:translate(0,0)}
}
.evidence-unlock-panel{
  display:none;
  margin:14px auto 0;
  max-width:560px;
  padding:14px;
  border:1px solid rgba(111,232,255,.35);
  border-radius:16px;
  background:rgba(11,16,32,.88);
  color:#edf7ff;
  box-shadow:0 18px 42px rgba(0,0,0,.35);
}
.evidence-unlock-panel.is-visible{display:block}
.evidence-unlock-panel strong{
  color:#ffd166;
  letter-spacing:.08em;
}
.evidence-unlock-panel a{
  display:inline-block;
  margin-top:10px;
  padding:10px 13px;
  border:1px solid rgba(111,232,255,.45);
  border-radius:12px;
  color:#edf7ff;
  text-decoration:none;
  background:rgba(16,23,43,.8);
}
```

---

## HTML to add near the trigger element

```html
<div id="evidenceUnlockPanel" class="evidence-unlock-panel" aria-live="polite">
  <strong>PROOF TRAIL UNLOCKED</strong>
  <p>The arcade is playable. The build trail is inspectable.</p>
  <p>Evidence pages are draft-state and pending Ken approval.</p>
  <a href="evidence/">ENTER EVIDENCE ARCHIVE</a>
</div>
```

---

## JavaScript to add before `</body>`

```html
<script>
/* Evidence Archive Easter egg: hidden proof trail access */
(function(){
  const trigger = document.querySelector(".evidence-easter-trigger");
  const panel = document.getElementById("evidenceUnlockPanel");
  if(!trigger || !panel) return;

  let taps = 0;
  let longPressTimer = null;
  let unlocked = false;

  function showGlitch(){
    trigger.classList.add("evidence-glitch");
    window.setTimeout(() => trigger.classList.remove("evidence-glitch"), 2500);
  }

  function unlock(){
    if(unlocked) return;
    unlocked = true;
    panel.classList.add("is-visible");
    showGlitch();
  }

  trigger.addEventListener("click", function(){
    taps += 1;
    showGlitch();
    if(taps >= 5) unlock();
    window.setTimeout(() => { if(!unlocked) taps = 0; }, 3000);
  });

  trigger.addEventListener("touchstart", function(){
    longPressTimer = window.setTimeout(unlock, 2000);
  }, {passive:true});

  trigger.addEventListener("touchend", function(){
    if(longPressTimer) window.clearTimeout(longPressTimer);
  }, {passive:true});

  window.setTimeout(showGlitch, 3000);
  window.setInterval(showGlitch, 14000);
})();
</script>
```

---

## QA

- Normal homepage loads unchanged.
- Trigger glitches briefly with 🔥 for roughly 2.5 seconds.
- Five clicks/taps reveal the panel.
- Two-second mobile long press reveals the panel.
- Button opens `/evidence/`.
- Existing game links are unchanged.
