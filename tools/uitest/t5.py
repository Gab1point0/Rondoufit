import asyncio, datetime
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
            t=await pg.inner_text('main'); i=t.find('Semaine du'); print(t[i:i+700].replace('\n\n','\n').replace('\n',' | ')); 
        await week()
        await pg.get_by_role('button',name='🏐 Jeudi 22/10').click()
        await pg.wait_for_timeout(300)
        await week()
        print(errs)
        await b.close()
asyncio.run(main())
