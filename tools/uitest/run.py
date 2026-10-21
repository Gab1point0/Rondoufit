import asyncio, json
from playwright.async_api import async_playwright
HTML='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="background:#020617"><div id="root"></div><script src="react_bundle.js"></script><script src="app.js"></script></body></html>'
open('/tmp/uitest/page.html','w').write(HTML)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
        pg=await b.new_page(viewport={'width':430,'height':900})
        errs=[]
        pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)))
        pg.on('console',lambda m:errs.append('CONSOLE '+m.text) if m.type=='error' else None)
        await pg.route('**/script.google.com/**',lambda r:r.abort())
        await pg.route('**/*.googleusercontent.com/**',lambda r:r.abort())
        await pg.goto('file:///tmp/uitest/page.html')
        await pg.wait_for_timeout(1500)
        await pg.get_by_text('🧠 Coach').first.click()
        await pg.wait_for_timeout(800)
        await pg.screenshot(path='coach1.png',full_page=True)
        await pg.screenshot(path='dbg.png',full_page=True)
        print(errs)
        btn=pg.get_by_text('Lancer la séance guidée').or_(pg.get_by_text('Lancer cette séance guidée maintenant'))
        print('start buttons',await btn.count())
        await btn.first.click(timeout=3000)
        await pg.wait_for_timeout(500)
        await pg.screenshot(path='guided1.png')
        # validate all sets across exercises
        for i in range(12):
            faites=pg.get_by_role('button',name='Faite',exact=True)
            n=await faites.count()
            for k in range(n):
                await faites.first.click()
            nxt=pg.get_by_text('Exercice suivant').or_(pg.get_by_text('Terminer ▶ Résumé'))
            if await pg.get_by_text('Résumé de la séance').count(): break
            await nxt.first.click()
            await pg.wait_for_timeout(150)
        await pg.screenshot(path='guided2.png')
        await pg.get_by_text('Enregistrer la séance').click()
        await pg.wait_for_timeout(800)
        t=await pg.inner_text('body'); i=t.find('Bilan de la séance'); print(t[i:i+900])
        await pg.get_by_text('Super, merci coach').click()
        await pg.get_by_text('🧠 Coach').first.click()
        await pg.wait_for_timeout(500)
        await pg.screenshot(path='coach2.png',full_page=True)
        st=await pg.evaluate("localStorage.getItem('rondoudou_save_v1')")
        d=json.loads(st)
        print([(q['name'],q['history'][-1]['date'],q['history'][-1]['note'][:40]) for q in d['quests']])
        print('ERRORS',errs)
        await b.close()
asyncio.run(main())
