"""Desktop/mobile smoke tests for the approved game copies, locally or live."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import hashlib
import json
import os
import time
import urllib.request
from PIL import Image, ImageOps, ImageStat
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'evidence/kingdom-night'
OUT.mkdir(parents=True, exist_ok=True)
LIVE = os.environ.get('ARCADE_BASE', '')
SERVER = None
if LIVE:
    BASE = LIVE.rstrip('/') + '/'
else:
    class Quiet(SimpleHTTPRequestHandler):
        def log_message(self, *_):
            pass
    SERVER = ThreadingHTTPServer(('127.0.0.1', 8765), partial(Quiet, directory=str(ROOT.parent)))
    Thread(target=SERVER.serve_forever, daemon=True).start()
    BASE = 'http://127.0.0.1:8765/' + ROOT.name + '/'
results, completed, failure = [], False, None

def check(name, ok, detail=''):
    results.append({'check': name, 'pass': bool(ok), 'detail': detail})
    print(('PASS ' if ok else 'FAIL ') + name + (' ' + str(detail) if detail else ''), flush=True)
    assert ok, name + ': ' + str(detail)

def get(path):
    request = urllib.request.Request(BASE + path, headers={'Cache-Control': 'no-cache', 'User-Agent': 'SKAB-Arcade-release-check/1.0'})
    with urllib.request.urlopen(request, timeout=25) as response:
        assert response.status == 200, (path, response.status)
        return response.read()

def watch(context):
    errors, bad = [], []
    context.on('page', lambda p: p.on('pageerror', lambda e: errors.append(str(e))))
    context.on('response', lambda r: bad.append(str(r.status) + ' ' + r.url) if r.status >= 400 and 'favicon.ico' not in r.url else None)
    context.on('requestfailed', lambda r: bad.append(str(r.failure) + ' ' + r.url))
    return errors, bad

def capture(page, slug, mode, canvas):
    page.screenshot(path=str(OUT / f'{slug}-{mode}.png'), full_page=True, timeout=45000)
    if mode == 'desktop' and not LIVE:
        image_path = OUT / f'{slug}-canvas.png'
        page.locator(canvas).screenshot(path=str(image_path), timeout=45000)
        image = Image.open(image_path).convert('RGB')
        check(slug + ': rendered screenshot is not blank', max(ImageStat.Stat(image).stddev) > 8)
        number = 31 if slug == 'kingdom-maker' else 32
        ImageOps.fit(image, (768, 576)).save(ROOT / f'assets/arcade-covers/cards/{number}-{slug}.png', optimize=True)

try:
    if LIVE:
        for attempt in range(30):
            try:
                if json.loads(get('site-version.json'))['version'] == '2026.09.21.002':
                    break
            except Exception as error:
                print('Waiting for Pages deployment:', str(error), flush=True)
            time.sleep(6)
        else:
            raise AssertionError('New Pages release did not become available')
        check('Live release version', True, '2026.09.21.002')
        for slug in ('kingdom-maker', 'night-hunt', 'first-kin', 'swarm-attack'):
            manifest = json.loads((ROOT / 'games' / slug / 'ARCADE-SOURCE.json').read_text())
            for entry in manifest['files']:
                actual = hashlib.sha256(get('games/' + slug + '/' + entry['path'])).hexdigest()
                assert actual == entry['sha256'], (slug, entry['path'])
            check('Live source bytes verified: ' + slug, True, len(manifest['files']))

    with sync_playwright() as pw:
        browser = pw.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'])
        modes = [('desktop', {'viewport': {'width': 1365, 'height': 900}}), ('mobile', {'viewport': {'width': 390, 'height': 844}, 'is_mobile': True, 'has_touch': True, 'device_scale_factor': 1})]
        for mode, options in modes:
            ctx = browser.new_context(**options)
            errors, bad = watch(ctx)
            page = ctx.new_page()
            page.goto(BASE + 'games/kingdom-maker/', wait_until='networkidle')
            page.wait_for_selector('#loading', state='hidden', timeout=45000)
            if page.locator('#modal').evaluate('e=>e.open'):
                page.locator('#close-modal').click()
            check(mode + ': Kingdom Maker starts with resources and population', page.locator('#stockbar [data-resource]').count() == 5 and int(page.locator('#people-count').inner_text()) > 0)
            before = page.locator('#pause').get_attribute('aria-label')
            page.locator('#pause').click()
            page.wait_for_function('old=>document.querySelector("#pause").getAttribute("aria-label")!==old', arg=before)
            check(mode + ': Kingdom pause control responds', True)
            for selector in ('#council-button', '#army-button', '#trade-button', '#chronicle-button'):
                page.locator(selector).click()
                page.wait_for_selector('#modal[open]')
                check(mode + ': Kingdom management opens ' + selector, len(page.locator('#modal-content').inner_text()) > 80)
                if selector == '#council-button':
                    page.locator('#tax-policy').select_option('low')
                    page.wait_for_function("JSON.parse(localStorage.getItem('kingdom-maker-realm-v1')||'{}').policies?.tax==='low'")
                    check(mode + ': Kingdom policy saves', True)
                page.locator('#close-modal').click()
            page.locator('#catalog [data-build]').first.click()
            check(mode + ': Kingdom construction selection opens inspector', page.locator('#inspector').is_visible() and page.locator('#map-mode').inner_text() == 'CONSTRUCTION VIEW')
            page.locator('#inspect-tool').click()
            page.locator('#expand-button').click()
            check(mode + ': Kingdom territory tool opens', page.locator('#map-mode').inner_text() == 'TERRITORY VIEW')
            page.locator('#inspect-tool').click()
            page.locator('#rotate-right').click()
            page.locator('#zoom-in').click()
            page.locator('#recenter').click()
            page.reload(wait_until='networkidle')
            page.wait_for_selector('#loading', state='hidden', timeout=45000)
            check(mode + ': Kingdom saved policy survives reload', page.evaluate("JSON.parse(localStorage.getItem('kingdom-maker-realm-v1')).policies.tax") == 'low')
            check(mode + ': Kingdom restored game starts paused', 'Resume' in page.locator('#pause').get_attribute('aria-label'))
            check(mode + ': Kingdom has no horizontal overflow', page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
            page.wait_for_timeout(700)
            capture(page, 'kingdom-maker', mode, '#world')
            check(mode + ': Kingdom has no runtime or asset errors', not errors and not bad, {'errors': errors, 'requests': bad})
            ctx.close()

            ctx = browser.new_context(**options)
            errors, bad = watch(ctx)
            page = ctx.new_page()
            page.goto(BASE + 'games/night-hunt/', wait_until='networkidle')
            check(mode + ': Night Hunt starts without test mode', page.evaluate('typeof window.__nightHuntTest') == 'undefined')
            if mode == 'desktop':
                page.keyboard.press('z', delay=120)
            else:
                page.locator('.controls').scroll_into_view_if_needed()
                rect = page.locator('[data-input=attack]').bounding_box()
                session = ctx.new_cdp_session(page)
                session.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': rect['x'] + rect['width']/2, 'y': rect['y'] + rect['height']/2, 'id': 1}]})
                page.wait_for_timeout(150)
                session.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
            page.wait_for_function("document.querySelector('.mast span').textContent.includes('Level I')")
            check(mode + ': Night Hunt starts through real controls', True)
            capture(page, 'night-hunt', mode, '#game')
            check(mode + ': Night Hunt has no horizontal overflow', page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
            # Existing opt-in diagnostics observe the original engine; no code is injected.
            page.goto(BASE + 'games/night-hunt/#test', wait_until='networkidle')
            page.wait_for_function('()=>{try{window.__nightHuntTest.startAs(0);return window.__nightHuntTest.snapshot().state==="play"}catch{return false}}')
            initial = page.evaluate('window.__nightHuntTest.snapshot()')
            page.wait_for_timeout(800)
            current = page.evaluate('window.__nightHuntTest.snapshot()')
            check(mode + ': Night Hunt arrival remains alive and protected', current['hp'] == initial['max'] and current['state'] == 'play')
            if mode == 'desktop':
                page.keyboard.down('ArrowRight')
                page.wait_for_function('x=>window.__nightHuntTest.snapshot().x>x+5', arg=current['x'])
                page.keyboard.up('ArrowRight')
                check('Desktop Night Hunt keyboard moves the monster', True)
            else:
                page.locator('.controls').scroll_into_view_if_needed()
                sizes = page.locator('[data-input]').evaluate_all('bs=>bs.map(b=>({key:b.dataset.input,w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height}))')
                check('Mobile Night Hunt large separated controls', all(s['h'] >= 48 and s['w'] >= (88 if s['key'] in ('attack', 'jump') else 48) for s in sizes))
                points = []
                for i, key in enumerate(('up', 'attack'), 1):
                    box = page.locator(f'[data-input={key}]').bounding_box()
                    points.append({'x': box['x'] + box['width']/2, 'y': box['y'] + box['height']/2, 'id': i})
                session = ctx.new_cdp_session(page)
                session.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': points})
                page.wait_for_function('window.__nightHuntTest.snapshot().special>0')
                session.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
                check('Mobile Night Hunt two-finger special works', True)
            campaign = page.evaluate('''()=>{const api=window.__nightHuntTest;api.startAs(1);const reached=[];for(let target=0;target<4;target++){let n=0;while(api.snapshot().levelIndex<target&&api.snapshot().state==='play'&&n++<3000)api.step(1,{right:true,attack:true});reached.push(api.snapshot());}let n=0;while(api.snapshot().state==='play'&&n++<3000)api.step(1,{right:true,attack:true});return {reached,final:api.snapshot()}}''')
            check(mode + ': Night Hunt traverses all four levels and finishes', [s['levelIndex'] for s in campaign['reached']] == [0,1,2,3] and all(s['state'] == 'play' for s in campaign['reached']) and campaign['final']['state'] == 'win')
            check(mode + ': Night Hunt has no runtime or asset errors', not errors and not bad, {'errors': errors, 'requests': bad})
            ctx.close()

        for mode, options in modes:
            ctx = browser.new_context(**options)
            errors, bad = watch(ctx)
            page = ctx.new_page()
            page.goto(BASE, wait_until='networkidle')
            check(mode + ': Arcade has 28 titles', page.evaluate('window.__arcadeAudit.cardCount') == 28)
            check(mode + ': Both new games lead the lineup', page.locator('#ug-grid .ug-card').evaluate_all('els=>els.slice(0,2).map(e=>e.dataset.game)') == ['kingdom-maker','night-hunt'])
            for slug in ('kingdom-maker', 'night-hunt', 'first-kin', 'swarm-attack'):
                card = page.locator(f'[data-game="{slug}"]')
                card.scroll_into_view_if_needed()
                page.wait_for_function('s=>{const i=document.querySelector(`[data-game="${s}"] img`);return i&&i.complete&&i.naturalWidth>0}', arg=slug)
                card.locator('.ug-card-links button').click()
                check(mode + ': Card and details link work: ' + slug, page.locator('#ug-detail-play').get_attribute('href').endswith('/games/' + slug + '/'))
                if LIVE and slug in ('kingdom-maker', 'night-hunt'):
                    with page.expect_popup() as popup_event:
                        page.locator('#ug-detail-play').click()
                    popup = popup_event.value
                    popup.wait_for_load_state('networkidle')
                    if slug == 'kingdom-maker':
                        popup.wait_for_selector('#loading', state='hidden', timeout=45000)
                    else:
                        popup.wait_for_selector('#game')
                    check(mode + ': Live Play opens ' + slug, popup.url.rstrip('/').endswith('/games/' + slug))
                    popup.close()
                page.locator('#ug-close-details').click()
            page.locator('[data-filter="Simulation"]').click()
            check(mode + ': Simulation filter includes both builders', set(page.locator('#ug-grid .ug-card').evaluate_all('els=>els.map(e=>e.dataset.game)')) == {'first-kin','kingdom-maker'})
            page.locator('[data-filter="All"]').click()
            page.locator('#ug-query').fill('Night Hunt')
            check(mode + ': Night Hunt search works', page.locator('#ug-grid .ug-card').count() == 1 and page.locator('[data-game="night-hunt"]').count() == 1)
            page.locator('#ug-query').fill('')
            page.locator('[data-game="kingdom-maker"] .ug-star').click()
            page.reload(wait_until='networkidle')
            check(mode + ': New-game favorites persist', page.locator('[data-game="kingdom-maker"] .ug-star').get_attribute('aria-pressed') == 'true')
            while page.locator('#ug-more').is_visible():
                page.locator('#ug-more').click()
            for image in page.locator('#ug-grid img').all():
                image.scroll_into_view_if_needed()
            page.wait_for_function('Array.from(document.querySelectorAll("#ug-grid img")).every(i=>i.complete&&i.naturalWidth>0)')
            check(mode + ': All 28 cards and covers load', page.locator('#ug-grid .ug-card').count() == 28)
            check(mode + ': Arcade has no horizontal overflow', page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
            check(mode + ': Arcade has no runtime or asset errors', not errors and not bad, {'errors': errors, 'requests': bad})
            page.locator('#ug-library').scroll_into_view_if_needed()
            page.screenshot(path=str(OUT / f'arcade-{mode}.png'), timeout=45000)
            ctx.close()
        browser.close()
    completed = True
except Exception as error:
    failure = str(error)
    print('VALIDATION_FAILED', failure, flush=True)
    raise
finally:
    if SERVER:
        SERVER.shutdown()
    report = {'completed': completed, 'failure': failure, 'passed': sum(r['pass'] for r in results), 'total': len(results), 'scope': ('Live GitHub Pages' if LIVE else 'Nested local Pages-equivalent paths') + '; Chromium desktop and mobile emulation, not physical-device certification.', 'checks': results}
    (ROOT / 'qa' / ('kingdom-night-live.json' if LIVE else 'kingdom-night-browser.json')).write_text(json.dumps(report, indent=2) + '\n')
    print('VALIDATION_SUMMARY', json.dumps({k:v for k,v in report.items() if k!='checks'}), flush=True)
