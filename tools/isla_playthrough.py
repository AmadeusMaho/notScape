# NotScape · JUEGA EL TUTORIAL DEL CIELO DE PUNTA A PUNTA (27 oct 2026) en la sesión rápida con GPU real:
#   python tools/fast/ns.py start --gpu --q 1 --w 1600 --h 900      (una vez)
#   PYTHONUTF8=1 python tools/isla_playthrough.py [--keep]           (--keep = no borra la partida al empezar)
# Borra la partida, recarga, inyecta tools/isla_bot.js y resuelve cada paso con la mecánica real (ver la cabecera de isla_bot.js); la COCINA y el COMBATE
# (golpe, carga LMB+RMB, esquiva, bloqueo, arco, bola de fuego, Gabriel) van con RATÓN y TECLADO REALES de Playwright. Imprime cada paso con su tiempo y acaba en
# RESULTADO: OK si el tutorial termina (S.isla.done) y el héroe llega a la playa sin errores de página nuevos.
import sys,os,json,time,random
sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'fast'));import ns
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def ev(js):
  r=ns.call('eval',js=js)
  if not r.get('ok'):raise RuntimeError(r.get('err'))
  return r.get('r')
def mouse(steps):ns.call('mouse',steps=json.dumps(steps))
def inject():ev(open(os.path.join(ROOT,'tools','isla_bot.js'),encoding='utf-8').read())
def step():return ev('ISLA.step')
def wait(js,s=20,dt=.2):
  t=time.time()
  while time.time()-t<s:
    if ev(js):return True
    time.sleep(dt)
  return False
def click(x,y,b='left',hold=60):mouse([{'t':'move','x':x,'y':y,'steps':3},{'t':'down','b':b},{'t':'wait','ms':hold},{'t':'up','b':b}])
def lambXY():return ev("(async()=>{const m=await IBOT.nearLamb();if(!m)return null;await IBOT.sl(150);return IBOT.aimAt(m)})()")
def hitsAt(n,key,b='left',gap=.75):   # pulsa LMB apuntando a un cordero hasta subir el contador S.st[key] n veces
  k0=ev(f"S.st['{key}']||0");tries=0
  while ev(f"S.st['{key}']||0")-k0<n and tries<n*6:
    tries+=1;p=lambXY()
    if not p:time.sleep(1);continue
    click(p['x']+random.gauss(0,4),p['y']-18+random.gauss(0,4),b);time.sleep(gap)
  return ev(f"S.st['{key}']||0")-k0>=n
# ── COCINA con RATÓN REAL: estación de Rafael → (camarón ya elegido) → tocar la Parrilla en la vista general → echar → voltear → SERVIR → SERVIR del emplatado
def canvasXY(x,y):return ev(f"(()=>{{const r=document.querySelector('#alq canvas').getBoundingClientRect();return {{x:r.x+{x}/800*r.width,y:r.y+{y}/460*r.height}}}})()")
def cook_once():
  ev("(()=>{const st=ST.find(s=>s.id==='cocina'&&!s.inroom);IBOT.near(st.x,st.y,40);return 1})()");time.sleep(.6)
  ev("(()=>{const st=ST.find(s=>s.id==='cocina'&&!s.inroom);S.stn=st;openIW(st);return 1})()")
  if not wait("!!(COC.G&&COC.G.stage==='pick')",8):return 'no abre la cocina'
  sel=ev("COC.G&&JSON.stringify((document.querySelector('#alq .aq-sh')||{}).innerText||'').slice(0,160)")
  # vista general: tocar la Parrilla con el ratón (centro de su celda proyectado con la cámara)
  time.sleep(1.2);p=ev("(()=>{const g=COC.G,c=g.cam,cell=KIT.CELL.parrilla,wx=cell[0]*800+400,wy=cell[1]*460+230,r=document.querySelector('#alq canvas').getBoundingClientRect();return{x:r.x+((wx-c.x)*c.s+400)/800*r.width,y:r.y+((wy-c.y)*c.s+230)/460*r.height}})()")
  click(p['x'],p['y'])
  if not wait("COC.G.stage==='cook'&&COC.G.cam.arr",10):return 'no empezó a cocinar ('+str(ev("COC.G.stage"))+') estante: '+str(sel)
  for _ in range(4):
    pos=ev("COC.G.chunks.filter(c=>c.s==='board').map(c=>[c.x,c.y])")
    if not pos:break
    q=canvasXY(*pos[0]);click(q['x'],q['y']);time.sleep(.7)
  t0=time.time()
  while not ev("COC.G.kk.parrilla.done") and time.time()-t0<60:
    ps=ev("COC.G.kk.parrilla.pcs.map(p=>({x:p.x,y:p.y,d:p.side?p.sb:p.sa,o:p.side?p.sa:p.sb,f:p.flip}))")
    if ps and all(min(q['d'],q['o'])>.62 for q in ps):b=canvasXY(676,104);click(b['x'],b['y']);break
    for q in ps:
      if q['f']==0 and q['d']>.72 and q['o']<.5:c=canvasXY(q['x'],q['y']);click(c['x'],c['y']);time.sleep(.3)
    time.sleep(.2)
  if not wait("COC.G&&COC.G.stage==='plate'",8):return 'no llegó al emplatado'
  time.sleep(1.2);b=canvasXY(690,408);click(b['x'],b['y'])
  wait("!COC.G||COC.G.res||COC.G.stage!=='plate'",8);time.sleep(1.5)
  r=ev("(()=>{const g=COC.G;return g&&g.res?JSON.stringify({id:g.res.id||g.res.out,q:g.res.q}):'(cerrada)'})()")
  ev("COC.close&&COC.close()");return 'ok '+str(r)
def main():
  keep='--keep' in sys.argv;T0=time.time();ev("1")
  if not keep:
    ev("WIPE=1;localStorage.clear();1");ns.call('reload',url='?r3d=1&test=1&noedit');time.sleep(4)
  ev("NSTEST.quality(1)");inject();errs0=len([l for l in (ns.call('logs').get('r') or []) if l.startswith('error') and '404' not in l])
  wait("ISLA.on()&&ISLA.step===0",30)
  print('inicio: paso',step(),ev('IBOT.txt()'),flush=True)
  E=[0]   # nº de paso que le toca a la siguiente llamada (si el juego ya lo dio por hecho, se salta)
  def S_(js,label=None,to=180):
    e=E[0];E[0]+=1
    if step()>e:print('%2d %-62s (ya cumplido por el juego)'%(e,ev(f"ISLA.STEPS[{e}].txt")[:62]),flush=True);return
    ev("(()=>{if(COC.G)COC.close();return 1})()")
    t=time.time();s0=step();r=(js() if callable(js) else ev(js)) if js else None
    ok=wait(f"ISLA.step>{s0}||(ISLA.state&&ISLA.state.done)",to)
    print('%2d %-62s %-28s %5.1fs %s'%(s0,ev(f"ISLA.STEPS[{s0}].txt")[:62],str(r)[:28],time.time()-t,'OK' if ok else 'NO AVANZA'),flush=True)
    if not ok:raise SystemExit('se queda en el paso %d'%s0)
  Q=lambda id:S_(f"IBOT.quest('{id}')",to=6)
  Q('v:9:raguel')
  S_("(async()=>{const b=PO.find(p=>p.pk==='cajaIsla');IBOT.near(b.x,b.y,30);await IBOT.sl(500);openPO(b,performance.now());return 'buscando'})()",to=12)
  S_("NSTEST.tab('inv')",to=6)
  ev("NSTEST.tab(null)") if ev("typeof panelOpen==='function'&&panelOpen()") else None
  Q('v:9:raguel');Q('v:9:sariel')
  S_("IBOT.wheel(o=>o.t==='wc','logs',3)",to=120)
  S_("IBOT.wheel(o=>o.t==='mi'&&ACT.mi[o.i][1]==='cobre','cobre',2)",to=120)
  S_("IBOT.wheel(o=>o.t==='mi'&&ACT.mi[o.i][1]==='estano','estano',2)",to=120)
  Q('v:9:sariel');Q('v:9:uriel')
  S_("IBOT.craft('furnace','sm','b_cobre',2)",to=200)
  S_("IBOT.craft('anvil','sm','sw_cobre',1)",to=200)
  Q('v:9:uriel');Q('v:9:rafael')
  S_("IBOT.fish(3)",to=200)
  def cook2():
    s0=step()
    for k in range(4):
      r=cook_once();print('   cocina (ratón real):',r,flush=True)
      if step()>s0:break
    ev("COC.G&&COC.close();1")
  S_(cook2,to=5)
  Q('v:9:rafael');Q('v:9:miguel')
  ev("(()=>{const i=S.inv.indexOf('sw_cobre');if(i>=0)use(i);return 1})()")
  S_(lambda:hitsAt(3,'swing'),to=5)
  # carga: LMB y RMB mantenidos a la vez ~1,1 s y soltar
  def charge():
    p=lambXY();mouse([{'t':'move','x':p['x'],'y':p['y']-18,'steps':3},{'t':'down'},{'t':'wait','ms':60},{'t':'down','b':'right'},{'t':'wait','ms':1100},{'t':'up','b':'right'},{'t':'up'}])
  S_(charge,to=5)
  def dashes():   # como una persona: pulsa ESPACIO; si sale «sin aliento» (la carga anterior gastó resistencia), espera y vuelve a pulsar
    k0=ev("S.st.dash||0");t=time.time();n=0
    while ev("S.st.dash||0")-k0<2 and time.time()-t<20:mouse([{'t':'key','k':'Space'}]);n+=1;time.sleep(1.5)
    return 'pulsaciones %d · %.1f s'%(n,time.time()-t)
  S_(dashes,to=4)
  S_(lambda:mouse([{'t':'move','x':800,'y':420},{'t':'down','b':'right'},{'t':'wait','ms':700},{'t':'up','b':'right'}]),to=5)
  S_("(()=>{use(S.inv.indexOf('bw_pino'));return S.eq.w})()",to=5)
  S_(lambda:hitsAt(3,'shot',gap=1.1),to=6)
  S_("(()=>{use(S.inv.indexOf('st_pino'));return S.eq.w})()",to=5)
  def casts():
    k0=ev("S.st.cast||0");n=0
    while ev("S.st.cast||0")-k0<3 and n<14:
      n+=1
      mouse([{'t':'key','k':'1'}]);time.sleep(.2);p=lambXY()
      if p:click(p['x'],p['y']-18)
      time.sleep(2.2)
  S_(casts,to=8)
  def kills():
    k0=ev("S.st['kill:cordero']||0");n=0
    while ev("S.st['kill:cordero']||0")-k0<3 and n<60:
      n+=1;p=lambXY()
      if p:click(p['x'],p['y']-18)
      time.sleep(.9)
  ev("(()=>{const i=S.inv.indexOf('sw_cobre');if(i>=0)use(i);return 1})()")
  S_(kills,to=10)
  Q('v:9:miguel')
  S_("(()=>{const b=ST.find(s=>s.id==='bank'&&!s.inroom&&s.x>=BIOMES.zone.x0);IBOT.near(b.x,b.y,50);openIW(b);const it=S.inv.find(i=>!QITEM||!QITEM.has||!QITEM.has(i))||S.inv[0];bankPut(it,99);return it})()",to=6)
  S_("(()=>{['of_tronco','of_estano','of_espada','of_camaron'].forEach(k=>bankTake(k,1));closeIW&&closeIW();return S.inv.filter(i=>/^of_/.test(i)).length})()",to=6)
  ev("(()=>{const i=S.inv.indexOf('sw_cobre');if(i>=0)use(i);return S.eq.w})()") if ev("S.inv.includes('sw_cobre')") else ev("(()=>{bankTake('sw_cobre',1);const i=S.inv.indexOf('sw_cobre');if(i>=0)use(i);return S.eq.w})()")
  S_("(()=>{const q=IBOT.wp(6,31);IBOT.near(q.x,q.y,0);return 1})()",to=8)
  S_("(async()=>{for(const [it,x,y] of ISLA.OFR){const q=IBOT.wp(x,y);IBOT.near(q.x,q.y,0);await IBOT.sl(700)}return ISLA.state.off.join('')})()",to=10)
  # GABRIEL: llegar al centro de la arena → intro → combate con el ratón real
  def gabriel():
    s0=step();ev("(()=>{const q=IBOT.wp(6,35);IBOT.near(q.x,q.y,60);return 1})()")
    wait("typeof CINE!=='undefined'&&CINE.on",8);t=time.time();wait("!(CINE.on)&&ISLA.bossOn()",60)
    print('   intro de Gabriel vista (%.1fs), combate empieza'%(time.time()-t),flush=True)
    return ev("(async()=>{const g=ISLA.boss;IBOT.near(g.x,g.y,-36);await IBOT.sl(500);return await IBOT.gabriel(200)})()")
  S_(gabriel,to=8)
  S_(None,to=90)   # cinemática «caída»
  s0=step();ev("(()=>{const q=IBOT.wp(26,-.4);IBOT.near(q.x,q.y,0);return 1})()");time.sleep(1.5)
  ev("(()=>{const q=IBOT.wp(28.5,-.4);IBOT.near(q.x,q.y,0);return 1})()")
  ok=wait("ISLA.state.done==1",20);print('%2d %-62s %33s %s'%(s0,'¡Escapa! (borde este)','','OK' if ok else 'NO'),flush=True)
  ok2=wait("typeof PLAYA!=='undefined'&&curB===0&&!(CINE&&CINE.on)",90)
  info=ev("JSON.stringify({bioma:curB,inv:S.inv.length,coins:S.coins,t:ISLA.state.t,playa:typeof PLAYA!=='undefined'?(PLAYA.step!=null?PLAYA.step:'?'):'-'})")
  errs=[l for l in (ns.call('logs').get('r') or []) if l.startswith('error') and '404' not in l]
  print('playa:',ok2,info);print('errores de página nuevos:',errs[:6] or 'ninguno');print('tiempo total %.0f s'%(time.time()-T0))
  print('RESULTADO:',('OK' if ok and ok2 and not errs else 'FALLO'))
main()
