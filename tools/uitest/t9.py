import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
        pg=await b.new_page(viewport={'width':430,'height':900})
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.route('**/script.google.com/**',lambda r:r.abort())
        await pg.goto('file:///tmp/uitest/page.html'); await pg.wait_for_timeout(800)
        await pg.get_by_text('📸 Souvenirs').first.click(); await pg.wait_for_timeout(300)
        import datetime; d=datetime.date.today().isoformat()
        await pg.locator(f'[data-day="{d}"]').click()
        await pg.locator('input[data-testid=photo-input]').set_input_files('/tmp/uitest/p.jpg'); await pg.wait_for_timeout(800)
        print('imgs in grid', await pg.locator('[data-testid=photo-grid] img').count())
        await pg.reload(); await pg.wait_for_timeout(800)
        await pg.get_by_text('📸 Souvenirs').first.click(); await pg.wait_for_timeout(500)
        print('after reload', await pg.locator('[data-testid=photo-grid] img').count())
        async with pg.expect_download() as dl:
            await pg.get_by_text('Télécharger le calendrier').click()
        f=await dl.value; await f.save_as('/tmp/uitest/cal.png'); print(f.suggested_filename)
        print(errs); await b.close()
asyncio.run(main())
