import asyncio,json
from playwright.async_api import async_playwright
async def scenario(b,name,cloud,local,fail=False):
    ctx=await b.new_context(); pg=await ctx.new_page(); posts=[]; errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    async def h(route):
        r=route.request
        if r.method=='POST': posts.append(json.loads(r.post_data)); await route.fulfill(status=200,content_type='application/json',body='{}')
        elif fail: await route.abort()
        else: await route.fulfill(status=200,content_type='application/json',body=json.dumps({'data':cloud} if cloud else {}))
    await pg.route('**/script.google.com/**',h)
    await pg.goto('file:///tmp/uitest/page.html'); await pg.wait_for_timeout(600)
    if local:
        await pg.evaluate("([k,v,t])=>{localStorage.setItem(k,v);if(t)localStorage.setItem('rondoudou_local_ts',t)}",['rondoudou_save_v1',json.dumps(local[0]),local[1]])
        await pg.reload(); await pg.wait_for_timeout(1500)
    else: await pg.wait_for_timeout(1000)
    st=json.loads(await pg.evaluate("localStorage.getItem('rondoudou_save_v1')"))
    # user edit: change weight target
    await pg.evaluate("()=>{}")
    print(name,'| quests',len(st['quests']),'| posts',[ (len(p['quests']),p.get('_savedAt')) for p in posts],errs)
    await ctx.close()
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
        ctx=await b.new_context(); pg=await ctx.new_page()
        await pg.route('**/script.google.com/**',lambda r:r.abort())
        await pg.goto('file:///tmp/uitest/page.html'); await pg.wait_for_timeout(600)
        base=json.loads(await pg.evaluate("localStorage.getItem('rondoudou_save_v1')")); await ctx.close()
        big=dict(base); big['quests']=base['quests']+[{**base['quests'][0],'id':'zz'}]
        small=dict(base); small['quests']=base['quests'][:1]
        await scenario(b,'B fresh phone, cloud has 7+ quests',{**big,'_savedAt':5},None)
        await scenario(b,'A fresh phone, cloud down',None,None,fail=True)
        await scenario(b,'C local newer than cloud',{**big,'_savedAt':5},(small,9999999999999))
        await scenario(b,'D local older than cloud',{**big,'_savedAt':9999999999999},(small,5))
        await b.close()
asyncio.run(main())
