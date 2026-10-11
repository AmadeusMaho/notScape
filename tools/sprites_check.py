#!/usr/bin/env python3
"""Comprobación SIN pantalla de la Fase 3 (panadería de sprites, src/sprites.js). Complementa, no reemplaza, el checklist manual de AGENTS.md.
Uso: python3 tools/sprites_check.py [carpeta_de_capturas]      (por defecto /tmp/notscape_shots)
Hace: (1) errores de consola con el juego nuevo y con ?old; (2) PIXEL-IGUALDAD: dibuja las mismas entidades (jugador en 3 equipos × 2 direcciones
× reposo/16 fases de paso, árboles 0-6 vivos/talados, rocas 0-3 vivas/agotadas, banco de día y de noche, yunque, taller, horno apagado/encendido,
vaca/gallina/monstruos genéricos con distintas piernas/cola/pico/mirada) con el código nuevo (caché) y con ?old (en vivo) en posiciones enteras y
compara hashes; (3) coste: tiempo por frame de dN/dS/dM/dP con una multitud sintética (≈60 monstruos + ≈60 árboles/rocas a la vista) y de draw() completo,
nuevo vs ?old, más estadísticas de la caché; (4) capturas nuevo/?old del mismo punto. Sale con código 0 si (1) y (2) están bien.
Requiere `pip install playwright` + `playwright install chromium`. Levanta su propio servidor http y lo cierra al terminar."""
import base64, os, subprocess, sys, time, socket, json
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/notscape_shots'
os.makedirs(OUT, exist_ok=True)
s = socket.socket(); s.bind(('127.0.0.1', 0)); PORT = s.getsockname()[1]; s.close()
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
BASE = f'http://127.0.0.1:{PORT}/'

def open_page(b, url):
    pg = b.new_page(viewport={'width': 1100, 'height': 800}); errs = []
    pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load' not in m.text else None)
    for pat in ('**/fonts.googleapis.com/**', '**/fonts.gstatic.com/**'): pg.route(pat, lambda r: r.abort())
    pg.goto(url, wait_until='domcontentloaded'); pg.wait_for_timeout(2500)
    return pg, errs

# Se ejecuta IGUAL en ambas páginas; devuelve {caso: "hash/píxeles opacos"}. Posiciones enteras (x=60,y=80) → la caché debe ser idéntica al dibujo en vivo.
EQUALITY_JS = r"""()=>{
 const realNow=performance.now.bind(performance);performance.now=()=>5000;SHD.dx=0;SHD.dy=2;SHD.a=.26;A=null;
 const out={},hash=d=>{let h=2166136261>>>0,n=0;for(let i=0;i<d.length;i+=4){if(d[i+3]){n++}h=Math.imul(h^d[i],16777619)^d[i+1];h=Math.imul(h^d[i+2],16777619)^d[i+3]}return (h>>>0).toString(16)+'/'+n};
 const run=(name,fn)=>{const c=document.createElement('canvas');c.width=c.height=120;const g=c.getContext('2d');g.imageSmoothingEnabled=false;const r=ctx;ctx=g;try{fn()}finally{ctx=r}out[name]=hash(g.getImageData(0,0,120,120).data)};
 for(const ar of [null,'#b8623a','#4a7aff'])for(const f of [1,-1]){
  run('persona reposo f'+f+' ar'+ar,()=>dPerson(60,80,ar||'#c0392b','#5a3a1a',f,0,0,ar));
  for(const k of [0,3,5,9,13])run('persona paso'+k+' f'+f+' ar'+ar,()=>dPerson(60,80,ar||'#c0392b','#5a3a1a',f,k*QW,1,ar))}
 for(let i=0;i<7;i++)for(const rt of [0,1e18])run('arbol'+i+(rt?' talado':''),()=>dN({t:'wc',i,x:60,y:80,rt},0,0));
 for(let i=0;i<4;i++)for(const rt of [0,1e18])run('roca'+i+(rt?' agotada':''),()=>dN({t:'mi',i,x:60,y:80,rt},0,0));
 for(const [nm,t] of [['dia',0],['noche',205.2]])run('banco '+nm,()=>dS({id:'bank',n:'',x:60,y:80},t));
 for(const id of ['anvil','bench'])run(id,()=>dS({id,n:'',x:60,y:80},0));
 {const e={id:'furnace',n:'',x:60,y:80};run('horno apagado',()=>dS(e,0));A={e};run('horno encendido',()=>dS(e,0));A=null}
 const ids=Object.keys(MD).filter(k=>k!=='vaca'&&k!=='gallina').slice(0,5).concat(['vaca','gallina']);
 for(const id of ids){const d=MD[id];for(const [f,mv,t,lk] of [[1,0,1.0,0],[-1,1,2.3,1],[1,1,0.4,-1],[-1,0,5.7,0]]){
  const m={f,mv:mv?1000:0,hx:7,y:80};run('monstruo '+id+' f'+f+' mv'+mv+' t'+t+' lk'+lk,()=>dSpr(m,d,60,80,d.c,d.w,d.h,lk,t,1000))}}
 performance.now=realNow;return out}"""

# Fase 3 paso 2 (src/stations.js): cada estación × {reposo, en uso} × 8 fotogramas; devuelve hash de píxeles y errores. Se comprueba que no haya errores, que nada salga vacío
# y que las estaciones que se animan cambien entre fotogramas. (La igualdad con ?old NO aplica a las estaciones: se rediseñaron a propósito.)
STATIONS_JS = r"""()=>{const ids=['bank','shop','fire','anvil','altar','bench','furnace'],out={},err=[],real=performance.now.bind(performance),r=ctx;performance.now=()=>5000;SHD.dx=0;SHD.dy=2;SHD.a=.26;
 const hash=d=>{let h=2166136261>>>0,n=0;for(let i=0;i<d.length;i+=4){if(d[i+3])n++;h=Math.imul(h^d[i],16777619)^d[i+1];h=Math.imul(h^d[i+2],16777619)^d[i+3]}return (h>>>0).toString(16)+'/'+n};
 for(const id of ids)for(const on of [0,1])for(let fr=0;fr<8;fr++){const c=document.createElement('canvas');c.width=c.height=140;const g=c.getContext('2d');g.imageSmoothingEnabled=false;ctx=g;
  const e={id,n:'',x:70,y:100};if(on)A={e,ty:'c',per:900,t0:5000-fr/8*900-20,lp:0,sk:'sm'};else A=null;
  try{dS(e,fr/8+.01)}catch(x){err.push(id+on+fr+':'+x)}out[id+'|'+on+'|'+fr]=hash(g.getImageData(0,0,140,140).data)}
 A=null;ctx=r;performance.now=real;return {out,err}}"""

# Fase 3 paso 3 (src/characters.js): el personaje se rediseñó a propósito, así que la igualdad con ?old NO aplica a 'persona*'. En su lugar: cada armadura × dirección × {16 pasos, reposo, parpadeo}
# sin errores ni vacíos, que el paso se anime, que el parpadeo cambie algo y que cada armadura/dirección se vea distinta.
CHARS_JS = r"""()=>{const out={},err=[],real=performance.now.bind(performance),r=ctx;performance.now=()=>5000;SHD.dx=0;SHD.dy=2;SHD.a=.26;
 const hash=d=>{let h=2166136261>>>0,n=0;for(let i=0;i<d.length;i+=4){if(d[i+3])n++;h=Math.imul(h^d[i],16777619)^d[i+1];h=Math.imul(h^d[i+2],16777619)^d[i+3]}return (h>>>0).toString(16)+'/'+n};
 const run=(name,fn)=>{const c=document.createElement('canvas');c.width=c.height=120;const g=c.getContext('2d');g.imageSmoothingEnabled=false;ctx=g;try{fn()}catch(x){err.push(name+':'+x)}out[name]=hash(g.getImageData(0,0,120,120).data)};
 for(const ar of [null,TCOL.cuero,TCOL.bronce,TCOL.hierro,TCOL.mitril,TCOL.adam])for(const f of [1,-1]){const k=(ar||'x')+'|'+f,sh=ar||'#c0392b';
  for(let i=0;i<16;i++)run('paso|'+k+'|'+i,()=>dPerson(60,80,sh,'#5a3a1a',f,i*QW,1,ar));
  run('reposo|'+k,()=>pBody(60,80,sh,'#5a3a1a',f,0,0,ar,0,0));run('parpadeo|'+k,()=>pBody(60,80,sh,'#5a3a1a',f,0,0,ar,1,0))}
 ctx=r;performance.now=real;return {out,err}}"""

# Multitud sintética: ≈60 monstruos pacíficos + ≈60 árboles/rocas a la vista; mide solo las funciones de entidades y draw() completo.
STRESS_JS = r"""()=>{
 const peace=Object.keys(MD).filter(k=>!MD[k].ag&&!MD[k].boss);P.x=300;P.y=800;draw(performance.now());let q=12345;const rd=()=>(q=(q*1103515245+12345)&0x7fffffff)/0x7fffffff;
 for(let k=0;k<60;k++){const x=cx+20+rd()*600,y=cy+30+rd()*340,d=MD[peace[k%peace.length]];M.push({d,hx:x,hy:y,x,y,rt:0,tx:x,ty:y,wt:1e18,fl:0,lv:5,hp:5,mh:10,f:k%2?1:-1,mv:0})}
 for(let k=0;k<60;k++){const x=cx+20+rd()*600,y=cy+30+rd()*340;N.push({t:k%3?'wc':'mi',i:k%3?k%7:k%4,x,y,rt:0,z:[x,x,y,y]})}
 const vis=e=>Math.abs(e.x-cx-640/2)<640/2+60,now=performance.now(),t=now/1000,R=(f,n)=>{for(let i=0;i<20;i++)f();const a=performance.now();for(let i=0;i<n;i++)f();return +((performance.now()-a)/n).toFixed(3)};
 const ents=()=>{N.filter(vis).forEach(e=>dN(e,t,now));ST.filter(vis).forEach(e=>dS(e,t));M.filter(vis).forEach(e=>dM(e,t,now));dP(t,now)};
 const r={visibles:N.filter(vis).length+ST.filter(vis).length+M.filter(vis).length+1,ms_entidades:R(ents,300),ms_draw:R(()=>draw(performance.now()),150)};
 if(typeof SP!=='undefined'&&SP)r.cache=SP.stats();return r}"""

# Fase 4: lighting() de noche sobre fondo gris, posición fija; devuelve una muestra de píxeles para comparar nuevo (discos de luz cacheados) vs ?old (gradientes por frame)
LIGHT_JS = r"""()=>{WXD=0;WX.t='';P.x=300;P.y=790;draw(performance.now());const g=ctx;g.save();g.setTransform(1,0,0,1,0,0);g.fillStyle='#808080';g.fillRect(0,0,640,400);lighting(205200);
 const d=g.getImageData(0,0,640,400).data;g.restore();const a=[];for(let i=0;i<d.length;i+=28)a.push(d[i],d[i+1],d[i+2]);return a}"""
TIME_JS = r"""()=>{const R=(f,n)=>{for(let i=0;i<10;i++)f();const a=performance.now();for(let i=0;i<n;i++)f();return +((performance.now()-a)/n).toFixed(2)};P.x=300;P.y=800;draw(performance.now());
 return {draw_dia:R(()=>draw(0),60),draw_noche:R(()=>draw(205200),60),lighting_noche:R(()=>lighting(205200),60)}}"""

ok = True
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg, errs = open_page(b, BASE); pg2, errs2 = open_page(b, BASE + '?old')
        print('Juego nuevo: SP activo =', pg.evaluate("typeof SP!=='undefined'&&SP!==null"), '| errores =', errs[:5])
        print('Con ?old:    SP =', pg2.evaluate("typeof SP!=='undefined'&&SP!==null"), '| errores =', errs2[:5]); ok &= not errs and not errs2
        a, o = pg.evaluate(EQUALITY_JS), pg2.evaluate(EQUALITY_JS)
        bad = [k for k in a if a[k] != o.get(k)]; empty = [k for k in a if a[k].endswith('/0')]
        print(f'Pixel-igualdad nuevo vs ?old: {len(a) - len(bad)}/{len(a)} casos idénticos' + (f' | DIFERENTES: {bad[:12]}' if bad else '') + (f' | VACÍOS (nada dibujado): {empty[:6]}' if empty else ''))
        stn = [k for k in bad if k.startswith(('banco', 'anvil', 'bench', 'horno'))] if pg.evaluate("typeof SX!=='undefined'&&SX!==null") else []
        if stn: print('  (diferencias ESPERADAS en estaciones rediseñadas con SX activo:', len(stn), 'casos)')
        chs = [k for k in bad if k.startswith('persona')] if pg.evaluate("typeof CH!=='undefined'&&CH!==null") else []
        if chs: print('  (diferencias ESPERADAS en el personaje rediseñado con CH activo:', len(chs), 'casos)')
        ok &= not [k for k in bad if k not in stn and k not in chs] and not [e for e in empty if not e.startswith('persona')]
        cr = pg.evaluate(CHARS_JS); co = cr['out']; cv = [k for k, v in co.items() if v.endswith('/0')]
        steps = {a: len({co[f'paso|{a}|{i}'] for i in range(16)}) for a in sorted({k.split('|', 1)[1] for k in co if k.startswith('reposo')})}
        blink = [a for a in steps if co[f'reposo|{a}'] == co[f'parpadeo|{a}']]
        same = len({co[f'reposo|{a}'] for a in steps}) < len(steps)
        print('Personaje: errores', cr['err'][:3], '| vacíos', cv[:3], '| poses distintas en los 16 pasos (mín., se esperan ≥4)', min(steps.values()), '| sin parpadeo visible', blink[:3], '| armaduras/direcciones indistinguibles', same)
        ok &= not cr['err'] and not cv and min(steps.values()) >= 4 and not blink and not same
        sr = pg.evaluate(STATIONS_JS); so = sr['out']; ids = sorted({k.split('|')[0] for k in so}); anim = []
        for i in ids:
            for on in (0, 1):
                n = len({so[f'{i}|{on}|{f}'] for f in range(8)}); anim.append(f'{i}/{"uso" if on else "reposo"}:{n}')
        vac = [k for k, v in so.items() if v.endswith('/0')]
        print('Estaciones (fotogramas distintos de 8):', ' '.join(anim)); print('  errores:', sr['err'][:3], '| vacíos:', vac[:4])
        must = [f'{i}|{o}' for i in ('fire', 'furnace', 'altar') for o in (0, 1)] + ['anvil|1', 'bench|1', 'shop|0']
        stat = [m for m in must if len({so[f'{m}|{f}'] for f in range(8)}) < 2]
        print('  estaciones que deberían animarse y no lo hacen:', stat); ok &= not sr['err'] and not vac and not stat
        la, lo = pg.evaluate(LIGHT_JS), pg2.evaluate(LIGHT_JS); dd = [abs(x - y) for x, y in zip(la, lo)]
        fn, fo = pg.evaluate("document.getElementById('c').style.filter"), pg2.evaluate("document.getElementById('c').style.filter")
        print(f'Fase 4 iluminación nuevo vs ?old: dif media {sum(dd)/len(dd):.3f} | dif máx {max(dd)} (tolerancia 8) | filtro CSS nuevo={fn!r} old={fo!r}')
        ok &= max(dd) <= 8 and bool(fn) and not fo
        for nm, page in (('nuevo', pg), ('?old ', pg2)): print('Coste draw/lighting', nm, json.dumps(page.evaluate(TIME_JS)))
        # coste (en headless el render es por software: sirve para COMPARAR, no como cifra absoluta)
        for nm, page in (('nuevo', pg), ('?old ', pg2)):
            r = page.evaluate(STRESS_JS); print('Coste', nm, json.dumps(r))
        for nm, page in (('nuevo', pg), ('old', pg2)):
            d = page.evaluate("document.getElementById('c').toDataURL('image/png')")
            open(os.path.join(OUT, f'fase3_{nm}.png'), 'wb').write(base64.b64decode(d.split(',')[1]))
        print('Errores de consola tras la multitud: nuevo =', errs[:3], '| old =', errs2[:3]); ok &= not errs and not errs2
        pg.close(); pg2.close(); b.close()
finally:
    srv.terminate()
print('Capturas en', OUT); print('RESULTADO:', 'OK' if ok else 'FALLOS')
sys.exit(0 if ok else 1)
