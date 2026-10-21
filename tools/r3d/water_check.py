# NotScape · R3D · Lote R3D-AGUA-IMPL · prueba del AGUA D con física en el juego real (?r3d=1, Chromium sin pantalla, SwiftShader).
# Uso (raíz, con `python3 tools/serve_nocache.py 8811 &`):  python3 -I tools/r3d/water_check.py <prefijo> [hora=dia|atardecer|noche] [calidad=2] [extra_query]
# Va a un punto de pesca (N con t==='fi'), equipa caña, pesca de verdad (startG) y hace capturas: orilla, lanzamiento, espera, picada, captura. Imprime R3D.water.stats y errores.
import asyncio,sys
from playwright.async_api import async_playwright
OUT=sys.argv[1];TOD=sys.argv[2] if len(sys.argv)>2 else 'dia';Q=sys.argv[3] if len(sys.argv)>3 else '2';EXTRA=sys.argv[4] if len(sys.argv)>4 else ''
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':960,'height':600});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'ERR_NAME_NOT_RESOLVED' not in m.text and 'ERR_TUNNEL' not in m.text else None)
    await pg.goto(f'http://127.0.0.1:8811/index.html?r3d=1&noedit&q={Q}&hora={TOD}'+EXTRA,wait_until='commit')
    await pg.wait_for_function('window.R3D&&R3D.water&&typeof S!=="undefined"&&typeof N!=="undefined"&&N.length>0',timeout=90000);await pg.wait_for_timeout(3000)
    r=await pg.evaluate('''(()=>{const e=N.find(q=>q.t==='fi');if(!e)return 'sin punto de pesca';S.tool.fi=1;S.eq.fi='rd_'+WON[0];S.lv=S.lv||{};
      const dx=P.x<e.x?-1:1;let ok=0;for(let d=30;d<=160&&!ok;d+=6)for(const a of [0,1,2,3,4,5,6,7]){const x=e.x+Math.cos(a*.785)*d,y=e.y+Math.sin(a*.785)*d;if(TER.heightAt(x,y)===1&&TER.heightAt(x+10,y)===1&&TER.heightAt(x-10,y)===1){P.x=x;P.y=y;ok=1;break}}
      ISO.snap(P.x,P.y,TER.standZ(P.x,P.y));P.hp=1e6;try{setZoom(ZMS.length-1)}catch(_){}document.querySelectorAll('#hud,#side,#tabs,#goalp,#topl,#botl').forEach(q=>q.style.display='none');window.__e=e;return ok?'ok':'sin orilla'})()''')
    print('prep:',r)
    if r!='ok':await b.close();return
    await pg.wait_for_timeout(2500);await pg.screenshot(path=f'{OUT}_orilla.png',timeout=180000)
    xy=await pg.evaluate('(()=>{const q=ISO.toCanvas(window.__e.x,window.__e.y,TER.standZ(window.__e.x,window.__e.y));const r=document.getElementById("cw").getBoundingClientRect();return [r.left+q.x/ISO.V.dpr,r.top+q.y/ISO.V.dpr]})()')
    await pg.mouse.move(xy[0]-30,xy[1]-30);await pg.mouse.move(xy[0],xy[1]);await pg.wait_for_timeout(1800);await pg.screenshot(path=f'{OUT}_hover.png',timeout=180000)
    print('hover:',await pg.evaluate('HOV&&HOV.t'))
    await pg.evaluate('(()=>{const L=window.L;for(const k of ["fi"]){try{S.xp[k]=Math.max(S.xp[k]||0,1e6)}catch(_){}}startG(window.__e,performance.now());if(A){A.amt=0;A.per=2200}})()')
    print('A:',await pg.evaluate('A&&JSON.stringify({ty:A.ty,sk:A.sk})'))
    for i,ms in enumerate([700,1200,2500,3500,3500]):
      await pg.wait_for_timeout(ms);await pg.screenshot(path=f'{OUT}_pesca{i+1}.png',timeout=180000)
      print(i+1,await pg.evaluate('JSON.stringify({st:R3D.water.F.st,stats:R3D.water.stats,A:!!A})'))
    await pg.evaluate('(()=>{R3D.water.event("catch",window.__e)})()');await pg.wait_for_timeout(500);await pg.screenshot(path=f'{OUT}_captura.png',timeout=180000)
    print('errores:',errs or 'ninguno');print('RESULTADO: OK' if not errs else 'RESULTADO: FALLO');await b.close()
asyncio.run(main())
