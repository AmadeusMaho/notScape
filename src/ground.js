/* NotScape — SUELO por tiles (Fase 1 de la migración). Ver AGENTS.md.
   Cada bioma se pre-renderiza UNA vez a un canvas 2D (tile a tile, con el tileset generado por código) y luego se copia
   por frame igual que el antiguo `bgc`: mismo coste que antes, sin WebGL en el bucle de dibujo.
   Phaser se incorporará en la Fase 3 (sprites y luces). Con ?old en la URL, GR es null y se usa el suelo antiguo (comparar rendimiento). */
const GR=/[?&]old\b/.test(location.search)?null:(()=>{
 const TS=16,PAD=8,VW=640+2*PAD,VH=400+2*PAD,NT=16; // PAD = margen para el temblor de pantalla (SHK)
 const FLW=[['#e8d84a','#fff','#ff8ab0'],['#a8d8ff','#fff','#d8a0ff'],['#c8d86a','#9ad89a'],['#aee4ff','#fff'],['#ff7a2a','#ffb040']]; // flores por bioma (copiado de game.js)
 const hex=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16));
 const mix=(a,b,t)=>{const x=hex(a),y=hex(b);return '#'+x.map((v,i)=>Math.round(v+(y[i]-v)*t).toString(16).padStart(2,'0')).join('')};
 // RNG propio: NO usar rnd()/R() del juego (rnd está sembrado y otras partes dependen de su secuencia)
 const hash=(x,y,s)=>{let h=(x*374761393+y*668265263+s*1274126177)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296};
 const vnoise=(x,y,s,f)=>{const gx=x/f,gy=y/f,x0=Math.floor(gx),y0=Math.floor(gy),sm=t=>t*t*(3-2*t),tx=sm(gx-x0),ty=sm(gy-y0),
  a=hash(x0,y0,s),b=hash(x0+1,y0,s),c=hash(x0,y0+1,s),d=hash(x0+1,y0+1,s);return a+(b-a)*tx+(c-a)*ty+(a-b-c+d)*tx*ty};
 // Tileset de un bioma: 16 variantes de 16x16 en una tira. 0-3 y 4-7 pasto (tono A y B), 8-11 flores, 12-13 guijarros, 14-15 matas oscuras
 function tileset(k,b){const c=document.createElement('canvas');c.width=TS*NT;c.height=TS;const x=c.getContext('2d');
  const A=b.g[0],B=mix(b.g[0],b.g[2],.55),flw=FLW[k];let s=k*977+13;const r=()=>(s=(s*1664525+1013904223)>>>0)/4294967296;
  const dot=(i,px,py,w,h,col)=>{x.fillStyle=col;x.fillRect(i*TS+px,py,w,h)};
  for(let i=0;i<NT;i++){const tone=(i>=4&&i<8)||i==10||i==11?B:A;dot(i,0,0,TS,TS,tone);
   for(let n=0;n<4+(i%4);n++)dot(i,r()*(TS-1)|0,r()*(TS-1)|0,2,2,b.g[1+(n%2)]);
   if(i<8&&i%4>=2){const tx=3+(r()*10|0),ty=2+(r()*9|0);dot(i,tx,ty,1,3,b.g[2]);dot(i,tx+2,ty+1,1,2,b.g[2]);dot(i,tx-2,ty+1,1,2,b.g[2])}
   if(i>=8&&i<12)for(let n=0;n<2;n++)dot(i,2+(r()*11|0),2+(r()*11|0),2,2,flw[r()*flw.length|0]);
   if(i==12||i==13){dot(i,3+(r()*8|0),3+(r()*8|0),3,2,'#8a8a80');dot(i,8+(r()*5|0),9+(r()*4|0),2,2,'#a8a090')}
   if(i>=14)dot(i,2+(r()*8|0),2+(r()*8|0),5,3,mix(A,'#000000',.18))}
  return c}
 // Mapa de índices del bioma: ruido de baja frecuencia elige tono A/B (manchas orgánicas) y un hash elige la decoración
 function data(k){const cols=Math.ceil(BW/TS),rows=Math.ceil(WH/TS),d=[];
  for(let y=0;y<rows;y++){const row=[];for(let x=0;x<cols;x++){const n=vnoise(x,y,k+1,7)*.65+vnoise(x,y,k+9,3)*.35,B=n>.56,h=hash(x,y,k+31),q=(h*997|0)%4;
   row.push(h<.035?(B?10:8)+(q&1):h<.06?12+(q&1):h<.085?14+(q&1):(B?4:0)+q)}d.push(row)}return d}
 const C={};let fr=0,wi=0,wo=null;
 const build=k=>{const ts=tileset(k,BI[k]),d=data(k),c=document.createElement('canvas');c.width=BW;c.height=WH;const x=c.getContext('2d');
  for(let y=0;y<d.length;y++)for(let i=0;i<d[y].length;i++)x.drawImage(ts,d[y][i]*TS,0,TS,TS,i*TS,y*TS,TS,TS);return C[k]=c};
 return{H:{hash,vnoise,mix,hex}, // helpers compartidos con roads.js y los siguientes módulos
  /* Se llama desde draw() ANTES del overlay bgc, dentro del contexto ya trasladado a coordenadas de mundo. (cx,cy)=esquina de la cámara. */
  draw(ctx,cx,cy){
   const x0=cx-PAD,y0=cy-PAD,sy=Math.max(0,y0),sh=Math.min(WH,y0+VH)-sy;
   for(let k=Math.max(0,Math.floor(x0/BW));k<=Math.min(4,Math.floor((x0+VW-1)/BW));k++){
    const bx=k*BW,sx=Math.max(x0,bx),ex=Math.min(x0+VW,bx+BW);if(ex>sx&&sh>0)ctx.drawImage(C[k]||build(k),sx-bx,sy,ex-sx,sh,sx,sy,ex-sx,sh)}
   if(++fr>45&&wi<5){if(!wo)wo=[0,1,2,3,4].sort((a,b)=>Math.abs(a-curB)-Math.abs(b-curB));if(!C[wo[wi]])build(wo[wi]);wi++} // precarga 1 bioma por frame
  }}
})();
