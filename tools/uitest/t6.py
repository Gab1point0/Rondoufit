import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
        pg=await b.new_page(viewport={'width':430,'height':900})
        errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.route('**/script.google.com/**',lambda r:r.abort())
        await pg.goto('file:///tmp/uitest/page.html')
        await pg.wait_for_timeout(1200)
        await pg.get_by_text('🧠 Coach').first.click()
        async def week():
            t=await pg.inner_text('main'); i=t.find('📅 Ma semaine'); j=t.find('Les séances sont espacées')
            print(t[i:j].replace('\n\n','\n').replace('\n',' | '))
        await pg.get_by_text('3 séances : Full body + Jambes + Haut du corps').click()
        for d in ['Lundi','Mercredi','Samedi','Dimanche']:
            await pg.get_by_role('button',name=d,exact=False).filter(has_text=d).first.click()
        await pg.wait_for_timeout(400)
        await week()
        t=await pg.inner_text('main'); i=t.find('🏋️ Prochaine séance'); print(t[i:i+1500].replace('\n\n','\n'))
        print(errs)
        await b.close()
asyncio.run(main())
