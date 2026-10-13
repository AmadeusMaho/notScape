#!/usr/bin/env python3
"""F1-C4 / F9 · comprueba (sin pantalla) cómo encajan terreno visual, colisión, clics y bordes del mundo con el mundo de RECTÁNGULOS (F9-L0: cada bioma tiene su rect ox,oy,w,h y los pasos son BIOMES.gates).
Uso: python3 tools/cliff_check.py [carpeta_capturas]
Mide: 1) visual vs colisión (blk() vs tileH) junto a compuertas y riscos (lay.cliff); 2) paredes sólidas: empujando contra cada lado de cada rect el jugador para antes de la pared;
3) compuertas: abiertas se cruzan de punta a punta, cerradas (jefe vivo) no; 4) REQUISITO DEL DUEÑO: el borde del mapa es infranqueable (estrés con upd() real: teclas, clics, teletransporte, partida mala);
5) clics: ida y vuelta por tile cerca de compuertas y riscos. Acaba con 'OK ...' o líneas 'FALLO ...'. Captura 14_colision_vs_visual.png (rojo = bloquea blk())."""
import sys, os, subprocess, time, json
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, 'capturas'); os.makedirs(out, exist_ok=True)
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8768', '--bind', '127.0.0.1'], cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1); errs = []; fails = 0
def fail(m):
    global fails; fails += 1; print('FALLO', m)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1280, 'height': 800}, device_scale_factor=1)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('http://127.0.0.1:8768/index.html?noedit'); pg.wait_for_timeout(1800)
        pg.evaluate('S.boss=[1,1,1,1,1]')
        # 1. visual vs colisión (alrededor de cada compuerta y de los riscos)
        res = pg.evaluate('''()=>{const T=ISO.TILE,H=TER.tileH,step=4,r={tot:0,bloq_pero_suelo:0,libre_pero_cliff:0,libre_pero_agua:0,libre_pero_vacio:0,m:{bs:[],lc:[],la:[],lv:[]}};
          const pts=[];for(const g of BIOMES.gates){const cx=g.vert?g.x:(g.x0+g.x1)/2,cy=g.vert?(g.y0+g.y1)/2:g.y;for(let x=cx-90;x<=cx+90;x+=step)for(let y=cy-150;y<=cy+150;y+=step)pts.push([x,y])}
          for(const B of BI)for(const c of (B.lay.cliff||[]))for(let x=B.ox+c[0]-60;x<=B.ox+c[1]+60;x+=step*3)for(let y=B.oy+c[2]-60;y<=B.oy+c[3]+60;y+=step*3)pts.push([x,y]);
          for(const [x,y] of pts){if(x<10||y<35||x>WW-10||y>WH-30)continue;r.tot++;const bk=blk(x,y),h=H(Math.floor(x/T),Math.floor(y/T));
            if(bk&&h===1&&!lockedAt(x,y)&&!PROPS.solid(x,y)){r.bloq_pero_suelo++;if(r.m.bs.length<6)r.m.bs.push([x,y])}
            if(!bk&&h===2){r.libre_pero_cliff++;if(r.m.lc.length<6)r.m.lc.push([x,y])}
            if(!bk&&h===0){r.libre_pero_vacio++;if(r.m.lv.length<6)r.m.lv.push([x,y])}
            if(!bk&&h===.75){r.libre_pero_agua++;if(r.m.la.length<6)r.m.la.push([x,y])}}
          return r}''')
        print(json.dumps(res, ensure_ascii=False))
        if res['libre_pero_cliff'] or res['libre_pero_vacio']: fail('hay puntos pisables que son pared o vacío: %s' % res['m'])
        # 2. paredes: empujar contra cada lado de cada rect (lejos de las compuertas)
        walls = pg.evaluate('''()=>{S.boss=[1,1,1,1,1];const T=ISO.TILE,out=[];
          const run=(nombre,x,y,ax,ay)=>{P.x=x;P.y=y;for(let i=0;i<6000;i++){const ox=P.x,oy=P.y;step(ax,ay);if(P.x===ox&&P.y===oy)break}
            const k=biomeAt(P.x,P.y);out.push({nombre,parado_en:[+P.x.toFixed(1),+P.y.toFixed(1)],dentro:k>=0,z:TER.standZ(P.x,P.y),tile:TER.tileH(Math.floor(P.x/T),Math.floor(P.y/T))})};
          const onG=(x,y)=>BIOMES.gates.some(g=>g.vert?Math.abs(x-g.x)<120&&y>g.y0-120&&y<g.y1+120:Math.abs(y-g.y)<120&&x>g.x0-120&&x<g.x1+120);
          BI.forEach((B,k)=>{const cx=B.ox+B.w/2,cy=B.oy+B.h/2,tries=[['oeste',B.ox+200,cy+300,-1,0],['este',B.ox+B.w-200,cy+300,1,0],['norte',cx+300,B.oy+200,0,-1],['sur',cx+300,B.oy+B.h-200,0,1]];
            for(const [n,x,y,ax,ay] of tries){if(onG(x,y)||blk(x,y))continue;run(B.n+' '+n,x,y,ax,ay)}});
          return out}''')
        for w in walls:
            print(w)
            if not w['dentro'] or w['z'] != 1 or w['tile'] != 1: fail('pared: %s' % w)
        # 3. compuertas: abiertas se cruzan; cerradas no
        gt = pg.evaluate('''()=>{const out=[];for(const g of BIOMES.gates){const ab=[],ce=[];
            const line=g.vert?[...Array(60).keys()].map(i=>[g.x-90+i*3,(g.y0+g.y1)/2]):[...Array(60).keys()].map(i=>[(g.x0+g.x1)/2,g.y-90+i*3]);
            S.boss=[1,1,1,1,1];const open=line.every(([x,y])=>!blk(x,y));S.boss=[0,0,0,0,0];const closed=line.some(([x,y])=>blk(x,y));S.boss=[1,1,1,1,1];
            // todo el hueco: ninguna fila del paso bloqueada con la compuerta abierta (ancho completo, un paso de 8 px)
            let full=true;for(let u=(g.vert?g.y0:g.x0)+12;u<=(g.vert?g.y1:g.x1)-12;u+=8)for(let d=-60;d<=60;d+=6){const x=g.vert?g.x+d:u,y=g.vert?u:g.y+d;if(blk(x,y))full=false}
            out.push({a:g.a,b:g.b,abierta_cruza:open,cerrada_bloquea:closed,hueco_libre:full})}return out}''')
        for g in gt:
            print(g)
            if not (g['abierta_cruza'] and g['cerrada_bloquea'] and g['hueco_libre']): fail('compuerta: %s' % g)
        # 4. requisito del dueño: el borde del mapa es infranqueable (estrés con upd())
        st = pg.evaluate('''()=>{
          const T=ISO.TILE,res={frames:0,fuera:0,en_pared:0,tras_compuerta:0,ej:[]};
          const bad=(tag)=>{res.frames++;const tx=Math.floor(P.x/T),ty=Math.floor(P.y/T);let m=null;
            if(!isFinite(P.x)||!isFinite(P.y)||P.x<T||P.y<T||P.x>=(TER.NX-1)*T||P.y>=Math.floor((WH-28)/T)*T)m='fuera';
            else if(TER.tileH(tx,ty)>=2||TER.tileH(tx,ty)===0)m='en_pared';else if(lockedAt(P.x,P.y))m='tras_compuerta';
            if(m){res[m]++;if(res.ej.length<8)res.ej.push([tag,m,+P.x.toFixed(1),+P.y.toFixed(1)])}};
          let now=performance.now();const frame=(dt)=>{P.hp=maxHp();EN=enMax();now+=dt*1000;upd(dt,now)};
          const pos=[];BI.forEach(B=>{pos.push([B.ox+200,B.oy+200],[B.ox+B.w-200,B.oy+B.h-200],spawnOf(BI.indexOf(B)))});
          BIOMES.gates.forEach(g=>{const cx=g.vert?g.x:(g.x0+g.x1)/2,cy=g.vert?(g.y0+g.y1)/2:g.y;pos.push([cx-60,cy],[cx+60,cy],[cx,cy-60],[cx,cy+60])});
          const P0=pos.map(a=>Array.isArray(a)?a:[a.x,a.y]);
          for(const abierto of [[1,1,1,1,1],[0,0,0,0,0]])for(const dt of [1/60,.1])for(const run of [0,1])for(const haste of [run])
            for(const [x0,y0] of P0)for(let dir=0;dir<8;dir++){
              S.boss=abierto.slice();RUN=run;S.buf.spd=haste?Date.now()+1e9:0;P.x=x0;P.y=y0;GOOD=null;P.g=P.mv=null;
              const a=dir*Math.PI/4,kx=Math.round(Math.cos(a)),ky=Math.round(Math.sin(a));K.l=kx<0;K.r=kx>0;K.u=ky<0;K.d=ky>0;
              for(let i=0;i<140;i++){frame(dt);bad('tecla')}K.l=K.r=K.u=K.d=false}
          for(const abierto of [[1,1,1,1,1],[0,0,0,0,0]])for(const dt of [1/60,.1])for(const [x0,y0] of P0)
            for(const [tx,ty] of [[-500,300],[99999,300],[300,-500],[300,99999],[-500,-500],[99999,99999],[WW/2,WH/2],[BI[1].ox+5,BI[1].oy+700]]){
              S.boss=abierto.slice();RUN=1;P.x=x0;P.y=y0;GOOD=null;P.g=null;P.mv={x:tx,y:ty};
              for(let i=0;i<260;i++){frame(dt);bad('clic')}P.mv=null}
          for(const [x,y] of [[-50,300],[0,0],[5,5],[300,-9],[WW+99,300],[WW,WH],[2290,10],[100,WH+50],[NaN,300],[Infinity,5],[BI[1].ox+10,5],[WW/2,WH-3],[BI[2].ox-2,BI[2].oy+700]]){
            S.boss=[0,0,0,0,0];P.x=x;P.y=y;GOOD=null;P.g=P.mv=null;frame(1/60);bad('tp'+[x,y])}
          S.boss=[1,1,1,1,1];return res}''')
        print(json.dumps(st, ensure_ascii=False))
        if st['fuera'] or st['en_pared'] or st['tras_compuerta']: fail('REQUISITO: el jugador cruzó una pared, el vacío o una compuerta cerrada')
        else: print('OK requisito borde infranqueable:', st['frames'], 'frames sin cruzar')
        # 5. clics: ida y vuelta por tile cerca de compuertas y riscos
        cl = pg.evaluate('''()=>{const T=ISO.TILE,H=TER.tileH,hz=TER.heightAt,r={n:0,mal:0,ej:[]};const tiles=[];
          for(const g of BIOMES.gates){const tx0=Math.floor((g.vert?g.x:g.x0)/T),ty0=Math.floor((g.vert?g.y0:g.y)/T);for(let tx=tx0-4;tx<=tx0+6;tx++)for(let ty=ty0-3;ty<=ty0+8;ty++)tiles.push([tx,ty])}
          for(const B of BI)for(const c of (B.lay.cliff||[])){const tx=Math.floor((B.ox+c[0])/T),ty=Math.floor((B.oy+c[3])/T);for(let i=-4;i<=4;i++)for(let j=-4;j<=4;j++)tiles.push([tx+i,ty+j])}
          for(const [tx,ty] of tiles){const h=H(tx,ty);if(!h)continue;for(const[fx,fy]of[[.5,.5],[.25,.25],[.75,.75]]){const x=(tx+fx)*T,y=(ty+fy)*T;ISO.snap(x,y,h);const c=ISO.toCanvas(x,y,h),w=ISO.toWorld(c.x,c.y,hz),q=ISO.tileAt(w.x,w.y);r.n++;if(q.tx!==tx||q.ty!==ty){r.mal++;if(r.ej.length<6)r.ej.push({tile:[tx,ty],h,devuelve:[q.tx,q.ty]})}}}
          return r}''')
        print('clics (informativo: un tile de suelo junto a un risco puede devolver el tile del risco que lo tapa en pantalla):', json.dumps(cl, ensure_ascii=False))
        # captura: colisión encima del terreno junto a la primera compuerta (se recarga la página: tras el estrés el estado del juego está muy cargado)
        pg.goto('http://127.0.0.1:8768/index.html?noedit'); pg.wait_for_timeout(1800)
        g0 = pg.evaluate('(()=>{const g=BIOMES.gates[0];return [g.x,(g.y0+g.y1)/2]})()')
        pg.evaluate('([x,y])=>{S.boss=[1,1,1,1,1];P.x=x-120;P.y=y-30;P.mv=null;P.g=null;ISO.snap(P.x,P.y,1)}', g0); pg.wait_for_timeout(700)
        pg.evaluate('''window.__dbg=true;const f=draw;window.draw=function(n){f(n);if(!window.__dbg)return;ctx.setTransform(1,0,0,1,0,0);ctx.save();ctx.fillStyle='rgba(230,40,40,.35)';
          for(let x=P.x-260;x<P.x+420;x+=4)for(let y=P.y-200;y<P.y+240;y+=4){if(blk(x,y)){const c=ISO.toCanvas(x,y,TER.heightAt(x,y));ctx.fillRect(c.x-2,c.y-1,4,3)}}ctx.restore()}''')
        pg.wait_for_timeout(500); pg.screenshot(path=os.path.join(out, '14_colision_vs_visual.png'))
        b.close()
finally:
    srv.terminate()
print('errores de página:', errs or 'ninguno')
print('RESULTADO:', 'OK' if not fails and not errs else 'FALLO')
