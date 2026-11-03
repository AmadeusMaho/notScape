// NotScape · hoja de contacto de PEINADOS en primer plano (lote N0.5-PELO-REWORK). Uso: sh tools/r3d/look_sheet.sh hair "window.__SG='f';window.__ONLY=['long','pony']" salida.jpg
// Variables: __SG (género m/f), __ONLY (ids; por defecto todos los del creador), __DIRS, __HH/__CY, __HC (color). Resolución de PNJ: antes R3D.hero.m.constructor.detail=.62 (y luego 0).
(async()=>{const G=window.__SG||'m',DIRS=window.__DIRS||[2,0,5],only=window.__ONLY,CY=window.__CY||.86,HH=window.__HH||.2,T=window.__T;
 let cv=document.getElementById('__hcv');if(!cv){cv=document.createElement('canvas');cv.id='__hcv';cv.style.cssText='position:fixed;left:0;top:0;width:260px;height:260px;z-index:99999;background:#555';document.body.appendChild(cv);window.__pv=R3D.preview(cv)}
 const pv=window.__pv,raf=()=>new Promise(r=>requestAnimationFrame(()=>r()));
 const L=(only||CREATOR.HAIRS[G].map(h=>h[0])),cols=DIRS.length*2,sz=260,sh=document.createElement('canvas');sh.width=sz*cols;sh.height=Math.ceil(L.length*DIRS.length/cols)*sz;const g=sh.getContext('2d');g.fillStyle='#444';g.fillRect(0,0,sh.width,sh.height);
 let n=0;for(const hr of L)for(const d of DIRS){const look={app:{g:G,hair:hr,hc:window.__HC||'#6a4426',skin:'#e0b48a',col:'#7a5a3a',eye:'#2a1a14',face:0}};
  for(let k=0;k<4;k++){pv.draw(look,{dir:d,H:HH,cy:CY,t:T});await raf()}
  pv.draw(look,{dir:d,H:HH,cy:CY,t:T});g.drawImage(cv,(n%cols)*sz,Math.floor(n/cols)*sz,sz,sz);g.fillStyle='#fff';g.font='15px sans-serif';g.fillText(hr+' d'+d,(n%cols)*sz+4,Math.floor(n/cols)*sz+16);n++}
 return sh.toDataURL('image/jpeg',.88)})()
