#!/usr/bin/env python3
"""NotScape · sesión de navegador PERSISTENTE para probar rápido sin GPU (ver tools/fast/README.md).
El juego tarda minutos en cargar con SwiftShader; aquí se carga UNA vez y luego cada comando tarda segundos.
  python3 tools/fast/ns.py start [--url '?r3d=1&test=1&noedit'] [--w 800 --h 500] [--q 4] [--no3d]   # arranca el demonio y espera a que el juego cargue
  python3 tools/fast/ns.py eval "NSTEST.tp(1200,900)"        # ejecuta JS en la página (devuelve JSON)
  python3 tools/fast/ns.py shot out.png [--sel '#hs'] [--wait 8]   # captura (pantalla completa o de un elemento/clip DOM)
  python3 tools/fast/ns.py reload ['?r3d=1&test=1']           # recarga (tras editar JS/CSS; vuelve a tardar la carga)
  python3 tools/fast/ns.py css                                # recarga SOLO las hojas CSS sin recargar el juego (instantáneo)
  python3 tools/fast/ns.py logs                               # errores/avisos de consola desde el último `logs`
  python3 tools/fast/ns.py mouse '[{"t":"move","x":100,"y":100},{"t":"down"},{"t":"move","x":300,"y":200,"steps":8},{"t":"up"}]'   # ratón real
  python3 tools/fast/ns.py status | stop
Sin dependencias fuera de playwright (ya instalado). Puerto de control 8899, servidor del juego 8811."""
import asyncio,json,sys,os,subprocess,time,urllib.request,argparse
ROOT=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CTL='http://127.0.0.1:8899';GAME='http://127.0.0.1:8811/index.html'
def call(cmd,**kw):
  r=urllib.request.Request(CTL,data=json.dumps(dict(cmd=cmd,**kw)).encode(),method='POST')
  try:return json.load(urllib.request.urlopen(r,timeout=kw.get('timeout',900)))
  except Exception as e:return {'ok':False,'err':'demonio no responde ('+str(e)+'). ¿Hiciste `ns.py start`?'}
def up():
  try:urllib.request.urlopen(CTL,timeout=2);return True
  except Exception as e:return isinstance(e,urllib.error.HTTPError) or False
def game_up():
  try:urllib.request.urlopen('http://127.0.0.1:8811/index.html',timeout=2);return True
  except Exception:return False
async def daemon(a):
  from playwright.async_api import async_playwright
  logs=[]
  async with async_playwright() as p:
    # --gpu: GPU REAL del PC (ventana visible, sin SwiftShader); por defecto software (sirve en cualquier sandbox)
    b=await p.chromium.launch(headless=False,args=['--ignore-gpu-blocklist','--enable-precise-memory-info','--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding','--disable-background-timer-throttling'])   # sin estas banderas, con la ventana tapada el juego va a ~1 fps (28 oct 2026) if a.gpu else await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    ctx=await b.new_context(viewport={'width':a.w,'height':a.h})
    await ctx.add_init_script("try{localStorage.setItem('ns_q','%s')}catch(e){}"%a.q)
    pg=await ctx.new_page()
    pg.on('pageerror',lambda e:logs.append('ERR '+str(e)))
    pg.on('console',lambda m:logs.append(m.type+' '+m.text) if m.type in('error','warning') and 'ERR_NAME_NOT_RESOLVED' not in m.text and 'ERR_TUNNEL' not in m.text and 'ERR_CONNECTION' not in m.text else None)
    state={'url':a.url}
    async def load(q):
      state['url']=q;await pg.goto(GAME+q,wait_until='commit')
      await pg.wait_for_function('window.__nstestReady===true',timeout=600000)
      await pg.wait_for_timeout(2500)
      if a.no3d:await pg.evaluate('NSTEST.no3d(true)')
    async def handle(d):
      c=d['cmd']
      if c=='eval':
        r=await pg.evaluate(d['js']);return {'ok':True,'r':r}
      if c=='shot':
        await pg.wait_for_timeout(int(d.get('wait',3)*1000))
        if d.get('sel'):
          bb=await pg.locator(d['sel']).first.bounding_box()
          if not bb:return {'ok':False,'err':'selector sin caja: '+d['sel']}
          pad=d.get('pad',8);bb={'x':max(0,bb['x']-pad),'y':max(0,bb['y']-pad),'width':bb['width']+2*pad,'height':bb['height']+2*pad}
          await pg.screenshot(path=d['path'],clip=bb,timeout=300000)
        else:await pg.screenshot(path=d['path'],timeout=300000)
        return {'ok':True,'r':d['path']}
      if c=='reload':await load(d.get('url') or state['url']);return {'ok':True,'r':state['url']}
      if c=='css':
        await pg.evaluate("document.querySelectorAll('link[rel=stylesheet]').forEach(l=>{const u=new URL(l.href);u.searchParams.set('_',Date.now());l.href=u})");await pg.wait_for_timeout(500);return {'ok':True}
      if c=='logs':
        r=logs[:];logs.clear();return {'ok':True,'r':r}
      if c=='status':return {'ok':True,'r':{'url':state['url'],'info':await pg.evaluate('window.NSTEST?NSTEST.info():null')}}
      if c=='mouse':   # ratón REAL de Playwright: pasos [{t:'move',x,y,steps?},{t:'down'},{t:'up'},{t:'wait',ms}] (22 oct 2026)
        for st in json.loads(d['steps']):
          t=st['t']
          if t=='move':await pg.mouse.move(st['x'],st['y'],steps=st.get('steps',1))
          elif t=='down':await pg.mouse.down(button=st.get('b','left'))
          elif t=='up':await pg.mouse.up(button=st.get('b','left'))
          elif t=='key':await pg.keyboard.press(st['k'])   # 27 oct 2026: también teclado real (b='right' = RMB; key/kd/ku = pulsar/bajar/soltar una tecla)
          elif t=='kd':await pg.keyboard.down(st['k'])
          elif t=='ku':await pg.keyboard.up(st['k'])
          elif t=='wait':await pg.wait_for_timeout(st['ms'])
        return {'ok':True,'r':'ok'}
      if c=='stop':asyncio.get_event_loop().call_later(.3,lambda:os._exit(0));return {'ok':True}
      return {'ok':False,'err':'comando desconocido'}
    lock=asyncio.Lock()
    async def conn(r,w):
      try:
        head=await r.readuntil(b'\r\n\r\n');n=0
        for l in head.split(b'\r\n'):
          if l.lower().startswith(b'content-length'):n=int(l.split(b':')[1])
        body=await r.readexactly(n) if n else b'{}'
        try:
          async with lock:res=await handle(json.loads(body))
        except Exception as e:res={'ok':False,'err':str(e)[:600]}
        out=json.dumps(res).encode();w.write(b'HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: %d\r\n\r\n'%len(out)+out);await w.drain()
      finally:w.close()
    srv=await asyncio.start_server(conn,'127.0.0.1',8899)
    await load(a.url);print('LISTO',flush=True)
    async with srv:await srv.serve_forever()
def main():
  ap=argparse.ArgumentParser();ap.add_argument('cmd');ap.add_argument('arg',nargs='?')
  ap.add_argument('--url',default='?r3d=1&test=1&noedit');ap.add_argument('--w',type=int,default=800);ap.add_argument('--h',type=int,default=500)
  ap.add_argument('--q',default='4');ap.add_argument('--no3d',action='store_true');ap.add_argument('--gpu',action='store_true');ap.add_argument('--sel');ap.add_argument('--wait',type=float,default=3);ap.add_argument('--pad',type=int,default=8)
  a=ap.parse_args();c=a.cmd
  if c=='daemon':asyncio.run(daemon(a));return
  if c=='start':
    if up():print('ya hay una sesión; usa `stop` antes (o `reload`)');return
    if not game_up():subprocess.Popen([sys.executable,'tools/serve_nocache.py','8811'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,start_new_session=True);time.sleep(2)
    cmd=[sys.executable,__file__,'daemon','--url',a.url,'--w',str(a.w),'--h',str(a.h),'--q',a.q]+(['--no3d'] if a.no3d else [])+(['--gpu'] if a.gpu else [])
    lf=open('/tmp/ns_daemon.log','w');subprocess.Popen(cmd,stdout=lf,stderr=subprocess.STDOUT,cwd=ROOT,start_new_session=True)
    print('arrancando (la 1ª carga con SwiftShader tarda minutos; se hace UNA vez)…',flush=True)
    t=time.time()
    while time.time()-t<900:
      if 'LISTO' in open('/tmp/ns_daemon.log').read():print('LISTO en %ds'%(time.time()-t));return
      time.sleep(3)
    print('timeout; mira /tmp/ns_daemon.log');return
  if c=='eval':r=call('eval',js=a.arg)
  elif c=='shot':r=call('shot',path=os.path.abspath(a.arg or 'shot.png'),sel=a.sel,wait=a.wait,pad=a.pad)
  elif c=='mouse':r=call('mouse',steps=a.arg)
  elif c=='reload':r=call('reload',url=a.arg)
  else:r=call(c)
  print(json.dumps(r.get('r',r),ensure_ascii=False,indent=1) if r.get('ok') else 'FALLO: '+str(r.get('err')))
if __name__=='__main__':main()
