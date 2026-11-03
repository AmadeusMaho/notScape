// NotScape · hoja de contacto de ATUENDOS (lote N0.5-ATUENDOS-2). Uso: sh tools/r3d/look_sheet.sh outfit "window.__OUT=['errante','cazadora'];window.__APP={cazadora:{g:'f',hair:'pony'}}" salida.jpg
// Variables: __OUT (ids de OUTFITS), __APP (apariencia por id), __DIRS (vistas 0..7; 2 = frente-diagonal, 5 = espalda), __HH/__CY (encuadre), __COLS. Necesita ns.py start --gpu.
(async()=>{const DIRS=window.__DIRS||[2,0,5],L=window.__OUT||['errante','penitente','mercenario','cazadora'],CY=window.__CY||.55,HH=window.__HH||.62,sz=320;
 let cv=document.getElementById('__hcv');if(!cv){cv=document.createElement('canvas');cv.id='__hcv';cv.style.cssText='position:fixed;left:0;top:0;width:320px;height:320px;z-index:99999;background:#555';document.body.appendChild(cv);window.__pv=R3D.preview(cv)}
 cv.style.width=cv.style.height=sz+'px';const pv=window.__pv,raf=()=>new Promise(r=>requestAnimationFrame(()=>r()));
 const cols=DIRS.length*(window.__COLS||2),sh=document.createElement('canvas');sh.width=sz*cols;sh.height=Math.ceil(L.length*DIRS.length/cols)*sz;const g=sh.getContext('2d');g.fillStyle='#444';g.fillRect(0,0,sh.width,sh.height);
 let n=0;for(const o of L)for(const d of DIRS){const ap=Object.assign({g:'m',hair:'cut',hc:'#5a3a22',skin:'#e0b48a',col:'#7a4a3a',eye:'#2a1a14',face:0,outfit:o},(window.__APP||{})[o]||{});const look=R3D.outfits.resolve({app:ap,gear:{}});
  for(let k=0;k<6;k++){pv.draw(look,{dir:d,H:HH,cy:CY});await raf()}
  pv.draw(look,{dir:d,H:HH,cy:CY});g.drawImage(cv,(n%cols)*sz,Math.floor(n/cols)*sz,sz,sz);g.fillStyle='#fff';g.font='15px sans-serif';g.fillText(o+' d'+d,(n%cols)*sz+4,Math.floor(n/cols)*sz+16);n++}
 return sh.toDataURL('image/jpeg',.88)})()
