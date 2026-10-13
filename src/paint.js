// NotScape · pincel, tinta y papel (F2-B). Técnica de pintado de la guía §5, copiada de la demo diorama (sin sus formas).
// Solo dibuja en el `ctx` que se le pasa; no toca la lógica del juego. Todo el azar sale de un RNG con semilla (hash por tile/capa),
// NUNCA de Math.random ni del rnd() de game.js: el mismo mundo se pinta igual en cada carga y en cada chunk.
const PAINT=(()=>{
 const INK='#5b3a29',PAPER='#fdf9e3';
 const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
 // mezcla de dos colores '#rrggbb' → '#rrggbb' (componible). Para sombrear se mezcla hacia '#6a3a3a' o INK, nunca hacia negro puro.
 const mix=(a,b,t)=>{const A=hex(a),B=hex(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')};
 const hash=(a,b,c,d)=>{let h=Math.imul(a|0,374761393)^Math.imul(b|0,668265263)^Math.imul(c|0,2147483647)^Math.imul(d|0,1013904223);h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;h=Math.imul(h,2246822519);return((h^(h>>>13))>>>0)/4294967296};
 const seedOf=(a,b,c,d)=>Math.floor(hash(a,b,c,d)*4294967296);
 const rng=seed=>{let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
 // ruido de valor suave (bilineal sobre hash de enteros): manchas grandes de tono, sin cuadrícula
 const vnoise=(x,y,k)=>{const x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),a=hash(x0,y0,k,1),b=hash(x0+1,y0,k,1),c=hash(x0,y0+1,k,1),d=hash(x0+1,y0+1,k,1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v};
 const path=(c,pts)=>{c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.closePath()};
 // agranda un polígono convexo d px desde su centro (evita rendijas de papel entre tiles contiguos al antialias)
 const grow=(pts,d)=>{const cx=pts.reduce((s,p)=>s+p[0],0)/pts.length,cy=pts.reduce((s,p)=>s+p[1],0)/pts.length;return pts.map(p=>{const dx=p[0]-cx,dy=p[1]-cy,l=Math.hypot(dx,dy)||1;return[p[0]+dx/l*d,p[1]+dy/l*d]})};
 // relleno con pincel: color base recortado a la forma + trazos cortos de luz/sombra (efecto gouache). r = RNG con semilla.
 function paint(c,pts,base,lt,dk,n,ang,len,w,r,opt){
  opt=opt||{};c.save();if(!opt.nofill){path(c,opt.fillPts||pts);c.fillStyle=base;c.fill()}path(c,pts);c.clip();
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const p of pts){if(p[0]<x0)x0=p[0];if(p[0]>x1)x1=p[0];if(p[1]<y0)y0=p[1];if(p[1]>y1)y1=p[1]}
  const bw=x1-x0,bh=y1-y0;c.lineCap='butt';
  for(let i=0;i<n;i++){const x=x0+r()*bw,y=y0+r()*bh,a=ang+(r()-.5)*.9,l=len*(.5+r());
   c.strokeStyle=r()<.5?lt:dk;c.globalAlpha=.18+r()*.32;c.lineWidth=w*(.6+r());
   c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);c.stroke()}
  c.restore()}
 // contorno marrón irregular, como lápiz: 4 segmentos con ±0,65 px de desvío en los puntos interiores
 function ink(c,a,b,r,w,al){w=w||1.5;c.save();c.beginPath();c.moveTo(a[0],a[1]);
  for(let i=1;i<=4;i++){const t=i/4,j=i<4?1:0;c.lineTo(a[0]+(b[0]-a[0])*t+(r()-.5)*1.3*j,a[1]+(b[1]-a[1])*t+(r()-.5)*1.3*j)}
  c.strokeStyle=INK;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.globalAlpha=al==null?.85:al;c.stroke();c.restore()}
 const edges=(c,q,r,w)=>q.forEach((p,i)=>ink(c,p,q[(i+1)%q.length],r,w));
 // grano de papel: patrón 128×128 (valores 228–255 y un 4 % de manchas a 185), determinista
 let GP=null;
 function grainPattern(g){if(GP)return GP;try{const cv=document.createElement('canvas');cv.width=cv.height=128;const x=cv.getContext('2d'),d=x.createImageData(128,128),r=rng(7);
  for(let i=0;i<d.data.length;i+=4){const v=r()<.04?185:228+r()*27;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255}x.putImageData(d,0,0);GP=g.createPattern(cv,'repeat')}catch(e){GP=null}return GP}
 // aplica el grano con multiply sobre todo el canvas (px reales). dpr: el patrón se estira para que el grano no se haga microscópico a 2×.
 function grain(g,w,h,dpr,alpha){const p=grainPattern(g);if(!p)return;g.save();g.setTransform(dpr||1,0,0,dpr||1,0,0);g.globalCompositeOperation='multiply';g.globalAlpha=alpha==null?.55:alpha;g.fillStyle=p;g.fillRect(0,0,w/(dpr||1),h/(dpr||1));g.restore()}
 return{INK,PAPER,hex,mix,hash,seedOf,rng,vnoise,path,grow,paint,ink,edges,grain}
})();
if(typeof module!=='undefined')module.exports=PAINT;
