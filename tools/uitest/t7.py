import asyncio, json, datetime
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
        pg=await b.new_page(viewport={'width':430,'height':900})
        errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.route('**/script.google.com/**',lambda r:r.abort())
        await pg.goto('file:///tmp/uitest/page.html')
        await pg.wait_for_timeout(1000)
        st=json.loads(await pg.evaluate("localStorage.getItem('rondoudou_save_v1')"))
        d1=(datetime.date.today()-datetime.timedelta(days=9)).isoformat()
        d2=(datetime.date.today()-datetime.timedelta(days=3)).isoformat()
        st['quests'].insert(0,{"id":"q_plank","catalogId":"fp_plank","name":"Gainage Planche (en secondes)","category":"Abdominaux","type":"strength","unit":"reps","goalMode":"sets_reps","level":1,"icon":"🧱","startValue":30,"currentValue":40,"goalValue":60,"goalSets":3,"goalReps":60,"setDetails":[40,40,35],"startAssistanceKg":0,"currentAssistanceKg":0,"goalAssistanceKg":0,
          "history":[{"id":"h0","date":d1,"value":30,"sets":3,"reps":30,"setDetails":[30,30,30],"assistanceKg":0,"rpe":7,"calories":20,"note":"Point de départ — Niveau 1"},
                     {"id":"h1","date":d1,"value":35,"sets":3,"reps":35,"setDetails":[35,35,30],"assistanceKg":0,"rpe":7,"calories":20,"note":"x"},
                     {"id":"h2","date":d2,"value":40,"sets":3,"reps":40,"setDetails":[40,40,35],"assistanceKg":0,"rpe":7,"calories":20,"note":"x"}]})
        await pg.evaluate("s=>localStorage.setItem('rondoudou_save_v1',s)", json.dumps(st))
        await pg.reload(); await pg.wait_for_timeout(1000)
        t=await pg.inner_text('main'); i=t.find('Gainage Planche'); print(t[i:i+700].replace('\n\n','\n'))
        print('=== coach')
        await pg.get_by_text('🧠 Coach').first.click(); await pg.wait_for_timeout(400)
        t=await pg.inner_text('main'); i=t.find('Gainage Planche'); print(t[i:i+450].replace('\n\n','\n'))
        print('=== form')
        await pg.get_by_text('Quêtes & Objectifs').first.click(); await pg.wait_for_timeout(300)
        nb=pg.get_by_role('button').filter(has_text='Nouvel').first
        print('new btn', await nb.count())
        await b.close()
        print(errs)
asyncio.run(main())
