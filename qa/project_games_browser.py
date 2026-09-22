"""Browser smoke tests and screenshot evidence for the two imported builds."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
import re
from PIL import Image, ImageStat
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / 'evidence/project-games'
EVIDENCE.mkdir(parents=True, exist_ok=True)
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass
server = ThreadingHTTPServer(('127.0.0.1', 8765), partial(QuietHandler, directory=str(ROOT.parent)))
Thread(target=server.serve_forever, daemon=True).start()
BASE = 'http://127.0.0.1:8765/' + ROOT.name + '/'
results = []
completed = False
failure = None

def check(name, passed, detail=''):
    results.append({'check': name, 'pass': bool(passed), 'detail': detail})
    print(('PASS ' if passed else 'FAIL ') + name + (' — ' + str(detail) if detail else ''), flush=True)
    assert passed, name + ': ' + str(detail)

def watch(context):
    errors, requests = [], []
    context.on('page', lambda p: p.on('pageerror', lambda e: errors.append(str(e))))
    def response(r):
        if r.status >= 400 and 'favicon.ico' not in r.url:
            requests.append(str(r.status) + ' ' + r.url)
    context.on('response', response)
    context.on('requestfailed', lambda r: requests.append(str(r.failure) + ' ' + r.url))
    return errors, requests

def nonblank(path):
    im = Image.open(path).convert('RGB')
    return max(ImageStat.Stat(im).stddev) > 8

try:
    with sync_playwright() as pw:
        browser = pw.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'])
        for mode, options in [
            ('desktop', {'viewport': {'width': 1365, 'height': 900}}),
            ('mobile', {'viewport': {'width': 390, 'height': 844}, 'is_mobile': True, 'has_touch': True, 'device_scale_factor': 1}),
        ]:
            context = browser.new_context(**options)
            errors, requests = watch(context)
            page = context.new_page()
            page.goto(BASE + 'games/first-kin/', wait_until='networkidle')
            page.get_by_role('button', name=re.compile('Light the first hearth')).click()
            page.wait_for_timeout(700)
            check(mode + ': First Kin starts', page.locator('#intro').evaluate("e=>getComputedStyle(e).display==='none'"))
            check(mode + ': First Kin resources rendered', len(page.locator('#resourceBar').inner_text()) > 10)
            page.get_by_role('button', name='Build', exact=True).click()
            check(mode + ': First Kin construction opens', 'shelter' in page.locator('#sideContent').inner_text().lower())
            page.get_by_role('button', name='People', exact=True).click()
            page.screenshot(path=str(EVIDENCE / f'first-kin-{mode}.png'), full_page=True)
            if mode == 'desktop':
                cover = ROOT / 'assets/arcade-covers/cards/29-first-kin.png'
                page.locator('#worldCanvas').screenshot(path=str(cover))
                check('First Kin cover contains rendered gameplay', nonblank(cover))
            check(mode + ': First Kin has no runtime or asset errors', not errors and not requests, {'errors': errors, 'requests': requests})
            context.close()

            context = browser.new_context(**options)
            errors, requests = watch(context)
            page = context.new_page()
            page.goto(BASE + 'games/swarm-attack/', wait_until='networkidle')
            page.wait_for_selector('#begin', state='visible')
            check(mode + ': Swarm nested entry resolves to dist', page.url.endswith('/games/swarm-attack/dist/'))
            page.locator('#begin').click()
            # The HUD container has only positioned children and no own box.
            # Check a visible child and the actual hidden attribute instead.
            page.wait_for_selector('#health', state='visible')
            page.wait_for_timeout(1000)
            check(mode + ': Swarm starts alive', not page.locator('#hud').evaluate('e=>e.hidden') and int(page.locator('#health').inner_text()) > 0)
            page.locator('#view-button').click()
            page.wait_for_timeout(200)
            check(mode + ': Swarm camera switch responds', page.locator('#view-button').inner_text() != 'ISO')
            page.locator('#view-button').click()
            if mode == 'mobile':
                check('Mobile Swarm touch attack visible', page.locator('#touch-attack').is_visible())
                check('Mobile Swarm movement joystick visible', page.locator('#joystick').is_visible())
                page.locator('#touch-attack').tap()
            else:
                page.keyboard.press('Space')
            page.wait_for_timeout(400)
            page.screenshot(path=str(EVIDENCE / f'swarm-attack-{mode}.png'), full_page=True)
            if mode == 'desktop':
                cover = ROOT / 'assets/arcade-covers/cards/30-swarm-attack.png'
                page.locator('#world').screenshot(path=str(cover))
                check('Swarm cover contains rendered gameplay', nonblank(cover))
            check(mode + ': Swarm has no runtime or asset errors', not errors and not requests, {'errors': errors, 'requests': requests})
            context.close()

        for mode, options in [('desktop', {'viewport': {'width': 1365, 'height': 900}}), ('mobile', {'viewport': {'width': 390, 'height': 844}, 'is_mobile': True, 'has_touch': True})]:
            context = browser.new_context(**options)
            errors, requests = watch(context)
            page = context.new_page()
            page.goto(BASE, wait_until='networkidle')
            audit = page.evaluate('window.__arcadeAudit')
            manifest = json.loads((ROOT / 'qa/project-games-import.json').read_text())
            check(mode + ': catalog increases by exactly two', audit['cardCount'] == manifest['catalog']['before'] + 2)
            check(mode + ': no coming-soon placeholders', audit['comingSoonCount'] == 0)
            check(mode + ': both new games in first lineup', page.locator('#ug-grid .ug-card').evaluate_all("els=>els.slice(0,2).map(e=>e.dataset.game)") == ['first-kin', 'swarm-attack'])
            for slug, title in [('first-kin', 'FIRST KIN'), ('swarm-attack', 'SWARM ATTACK')]:
                card = page.locator(f'[data-game="{slug}"]')
                card.scroll_into_view_if_needed()
                card.locator('img').wait_for()
                page.wait_for_function("s=>{const i=document.querySelector('[data-game=\"'+s+'\"] img');return i.complete&&i.naturalWidth>0}", arg=slug)
                check(mode + ': ' + slug + ' cover loads', card.locator('img').evaluate('e=>e.naturalWidth>0'))
                card.get_by_role('button', name='Details for ' + title).click()
                check(mode + ': ' + slug + ' details link correct', page.locator('#ug-detail-play').get_attribute('href').endswith('/games/' + slug + '/'))
                page.locator('#ug-close-details').click()
            page.locator('[data-filter="Simulation"]').click()
            check(mode + ': simulation filter includes First Kin', page.locator('#ug-grid .ug-card').count() == 1 and page.locator('[data-game="first-kin"]').count() == 1)
            page.locator('[data-filter="All"]').click()
            page.locator('#ug-query').fill('Hollow Wake')
            check(mode + ': search finds Swarm Attack', page.locator('#ug-grid .ug-card').count() == 1 and page.locator('[data-game="swarm-attack"]').count() == 1)
            page.locator('#ug-query').fill('')
            page.locator('[data-game="first-kin"] .ug-star').click()
            page.reload(wait_until='networkidle')
            check(mode + ': favorites persist', page.locator('[data-game="first-kin"] .ug-star').get_attribute('aria-pressed') == 'true')
            while page.locator('#ug-more').is_visible():
                page.locator('#ug-more').click()
            for image in page.locator('#ug-grid img').all():
                image.scroll_into_view_if_needed()
            page.wait_for_timeout(500)
            check(mode + ': all catalog covers load', page.locator('#ug-grid img').evaluate_all('els=>els.every(e=>e.complete&&e.naturalWidth>0)'))
            check(mode + ': arcade has no horizontal overflow', page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'))
            check(mode + ': arcade has no runtime or asset errors', not errors and not requests, {'errors': errors, 'requests': requests})
            page.locator('#ug-library').scroll_into_view_if_needed()
            page.screenshot(path=str(EVIDENCE / f'arcade-{mode}.png'), full_page=True)
            context.close()
        browser.close()
        completed = True
except Exception as error:
    failure = str(error)
    print('BROWSER_CHECK_FAILURE:', failure, flush=True)
    print('LAST_PAGE_ERRORS:', errors, 'LAST_REQUEST_ERRORS:', requests, flush=True)
    raise
finally:
    server.shutdown()
    (ROOT / 'qa/project-games-browser.json').write_text(json.dumps({'completed': completed, 'failure': failure, 'checks': results, 'passed': sum(r['pass'] for r in results), 'total': len(results), 'scope': 'Chromium desktop and mobile emulation, not physical-device certification.'}, indent=2) + '\n')
