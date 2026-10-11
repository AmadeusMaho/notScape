// NotScape · terreno isométrico PROVISIONAL (F1-B): rombos de color plano con 3 alturas (agua .75, suelo 1, acantilado 2).
// Sin arte final: el estilo pintado llega en F2. La colisión NO sale de aquí: sigue siendo blk()/BLK/cliff() en px de mundo.
// Usa globales de game.js solo en tiempo de ejecución (BI, BW, WW, WH, BLK, S), nunca al cargar.
const TER=(()=>{
 const T=ISO.TILE,HW=ISO.HW,HH=ISO.HH,LV=ISO.LV,HWATER=.75,HGROUND=1,HCLIFF=2,
  NX=Math.ceil(11500/T),NY=Math.ceil(1500/T),            // = WW/T, WH/T (constantes de game.js; se comprueba abajo)
  PASS=[712,826];                                         // hueco de las compuertas entre biomas (igual que cliff())
 // paleta por bioma de la guía §3 (suelo base, luz, sombra, agua); Cumbres = «Nieve». Datos, no código por bioma.
 const PAL=[{g:'#a6d24c',l:'#d4ee7a',s:'#4f9438',w:'#52d2e0'},{g:'#5f9a40',l:'#94c455',s:'#2f6e38',w:'#3fb0bf'},{g:'#9aa84a',l:'#c9d070',s:'#5a6a38',w:'#6fb59a'},
  {g:'#e9f4f8',l:'#ffffff',s:'#a9c3d6',w:'#8fd6ee'},{g:'#7a6a66',l:'#a8968f',s:'#3f3438',w:'#ff7a2a'}];
 const STONE='#9a958d',STONEL='#d0cbc0',EARTH='#a3643d',EARTHL='#c98a5a',INK='#5b3a29',PAPER='#fdf9e3';
 const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),mix=(a,b,t)=>{const A=hex(a),B=hex(b);return'rgb('+A.map((v,i)=>Math.round(v+(B[i]-v)*t)).join()+')'};
 const hash=(a,b,c)=>{let h=Math.imul(a,374761393)^Math.imul(b,668265263)^Math.imul(c,2147483647);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296};
 const inR=(r,x,y)=>x>r[0]&&x<r[1]&&y>r[2]&&y<r[3];
 const biomeOf=tx=>Math.max(0,Math.min(4,Math.floor(tx*T/BW)));
 // altura del tile por su centro. Cliff: franja de la frontera de cada bioma (salvo el hueco) y el borde del mundo.
 function tileH(tx,ty){
  if(tx<0||ty<0||tx>=NX||ty>=NY)return 0;
  const x=(tx+.5)*T,y=(ty+.5)*T;
  if(tx===0||ty===0||tx===NX-1||ty>=Math.floor((WH-28)/T))return HCLIFF;
  for(let k=1;k<=4;k++)if(tx===Math.floor(k*BW/T)&&!(y>PASS[0]&&y<PASS[1]))return HCLIFF;
  for(const b of BLK)if(inR(b,x,y))return HWATER;
  return HGROUND}
 const heightAt=(x,y)=>tileH(Math.floor(x/T),Math.floor(y/T));
 const poly=(g,pts,c)=>{g.fillStyle=c;g.beginPath();g.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)g.lineTo(pts[i].x,pts[i].y);g.closePath();g.fill()};
 function draw(g,t){
  const V=ISO.V,s=ISO.scale(),cs=[ISO.toWorld(0,0),ISO.toWorld(V.cw,0),ISO.toWorld(0,V.ch),ISO.toWorld(V.cw,V.ch)],M=5;
  const tx0=Math.max(0,Math.floor(Math.min(...cs.map(p=>p.x))/T)-M),tx1=Math.min(NX-1,Math.ceil(Math.max(...cs.map(p=>p.x))/T)+M),
   ty0=Math.max(0,Math.floor(Math.min(...cs.map(p=>p.y))/T)-M),ty1=Math.min(NY-1,Math.ceil(Math.max(...cs.map(p=>p.y))/T)+M);
  g.lineJoin='round';
  for(let sum=tx0+ty0;sum<=tx1+ty1;sum++)for(let tx=Math.max(tx0,sum-ty1);tx<=Math.min(tx1,sum-ty0);tx++){
   const ty=sum-tx,h=tileH(tx,ty),X=tx*T,Y=ty*T,n=ISO.toCanvas(X,Y,h);
   if(n.x<-HW*s*2||n.x>V.cw+HW*s*2||n.y<-HH*s*2-LV*s*3||n.y>V.ch+HH*s*2+LV*s*3)continue;
   const e=ISO.toCanvas(X+T,Y,h),so=ISO.toCanvas(X+T,Y+T,h),w=ISO.toCanvas(X,Y+T,h),k=biomeOf(tx),P=PAL[k],r=hash(tx,ty,k);
   // caras laterales solo donde el vecino es más bajo (derecha = hacia +x, izquierda = hacia +y)
   const hr=tileH(tx+1,ty),hl=tileH(tx,ty+1),cliff=h===HCLIFF,wat=h===HWATER;
   if(hr<h){const d=(h-hr)*LV*s;poly(g,[e,so,{x:so.x,y:so.y+d},{x:e.x,y:e.y+d}],wat?'rgba(110,215,235,.75)':mix(cliff?STONE:EARTH,'#6a3a3a',.28))}
   if(hl<h){const d=(h-hl)*LV*s;poly(g,[w,so,{x:so.x,y:so.y+d},{x:w.x,y:w.y+d}],wat?'rgba(110,215,235,.75)':cliff?STONE:EARTH)}
   // cara superior
   let c;if(cliff)c=mix(STONE,STONEL,r*.5);else if(wat)c=mix(P.w,'#ffffff',.12+.1*Math.sin(t*1.6+tx*.7+ty*.5)+.04*r);else c=mix(P.g,r<.5?P.l:P.s,r<.5?r*.5:(r-.5)*.5);
   poly(g,[n,e,so,w],c)}}
 // compuerta del paso entre biomas k-1 → k (provisional): postes y viga; cerrada = muro de postes
 function gate(g,k,open,t){
  const V=ISO.V,s=ISO.scale(),X=k*BW,fx=Math.floor(X/T)*T+T/2;
  g.save();g.lineWidth=Math.max(1,s*.9);g.strokeStyle=INK;
  const post=(y,hgt)=>{const p=ISO.toCanvas(fx,y,HGROUND),w=7*s;g.fillStyle='#8a5a2a';g.fillRect(p.x-w/2,p.y-hgt*s,w,hgt*s);g.strokeRect(p.x-w/2,p.y-hgt*s,w,hgt*s)};
  if(open){post(PASS[0]-4,30);post(PASS[1]+4,30);const a=ISO.toCanvas(fx,PASS[0]-4,HGROUND),b=ISO.toCanvas(fx,PASS[1]+4,HGROUND);g.strokeStyle='#bd7a45';g.lineWidth=3*s;g.beginPath();g.moveTo(a.x,a.y-30*s);g.lineTo(b.x,b.y-30*s);g.stroke()}
  else{for(let y=PASS[0];y<=PASS[1];y+=19)post(y,26);const a=ISO.toCanvas(fx,PASS[0],HGROUND),b=ISO.toCanvas(fx,PASS[1],HGROUND);g.strokeStyle='#5a3a1a';g.lineWidth=3*s;g.beginPath();g.moveTo(a.x,a.y-18*s);g.lineTo(b.x,b.y-18*s);g.stroke();
   const m=ISO.toCanvas(fx,(PASS[0]+PASS[1])/2,HGROUND);g.font=Math.round(13*s)+'px VT323, monospace';g.textAlign='center';g.fillStyle=INK;g.fillText('🔒 Derrota al jefe anterior',m.x,m.y-38*s)}
  g.restore()}
 return{PAL,PAPER,heightAt,tileH,draw,gate,NX,NY}
})();
if(typeof module!=='undefined')module.exports=TER;
