import asyncio, json
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
        await pg.wait_for_timeout(400)
        async def sec(title,n=1500):
            t=await pg.inner_text('main'); i=t.find(title); print(t[i:i+n].replace('\n\n','\n')); print('-----')
        await sec('🏅 Objectifs',700)
        await pg.get_by_text('😵 Cuit').click()
        await pg.wait_for_timeout(300)
        await sec('🏋️ Prochaine séance',900)
        await pg.get_by_text('😵 Cuit').click()
        await pg.get_by_text('⏱ Version courte').click()
        await pg.wait_for_timeout(300)
        await sec('🏋️ Prochaine séance',700)
        await pg.get_by_text('⏱ Version courte').click()
        # swap
        await pg.get_by_title('Remplacer cet exercice').nth(2).click()
        await sec('Remplacer par',500)
        btns=pg.locator('button:has-text("+ créer")')
        print('create btns',await btns.count())
        await btns.first.click()
        await pg.wait_for_timeout(400)
        await sec('🏋️ Prochaine séance · personnalisée',800)
        await pg.get_by_text('↩ Revenir').click()
        # cycle
        await pg.get_by_text('Cycle de 5 semaines').click()
        await pg.wait_for_timeout(300)
        await sec('🔁 Cycle',400)
        # nutrition
        await pg.get_by_placeholder('Taille (cm)').fill('180')
        await pg.get_by_placeholder('Âge').fill('35')
        await pg.wait_for_timeout(300)
        await sec('🔥 Calories',900)
        await sec('💪 Ta force',300)
        print(errs)
        await b.close()
asyncio.run(main())
