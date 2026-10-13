// NotScape · ARTE DE INTERIORES (lote 5, oct 2026). Modelos para ORG.U (mismo lenguaje de formas que style-organic.js / spots.js): la CÁSCARA de la sala (suelo + dos paredes de fondo, estilo por bioma)
// y el mobiliario / decoración / plantas. Se hornean una vez (src/interiors.js) y el tema de bioma (ORG.theme) recolorea piedra, tela y tejas como en las aldeas.
// Convención de ejes: la cámara ve las caras +x y +y y la cara de arriba. Las paredes del fondo son la IZQUIERDA (plano x=−w/2, mira a +x) y la DERECHA (plano y=−d/2, mira a +y).
// Los modelos «de pared» se dibujan apoyados en y=−… (pared derecha); con la opción rot:true el motor los espeja (x↔y) y quedan en la pared izquierda.
// Opciones comunes (las pone el motor desde la paleta del estilo): wood, woodL, woodD (maderas), cloth, cloth2 (tela principal y clara), stone, plant, flower, lava.
(()=>{
 const {add,M,soft,RG,box,lathe,blob,cone,gable,tilt}=ORG,mix=(a,b,t)=>PAINT.mix(a,b,t);
 const NP={crease:0,paint:false,ij:.3},NI={crease:0,paint:false,ij:.25,ink:false};
 const pal=o=>Object.assign({wood:'#9a6a3a',woodL:'#b9803f',woodD:'#5a3e28',cloth:'#c0392b',cloth2:'#f7f1e1',stone:'#b4b0a4',plant:'#6fb048',flower:'#ff9ac0',lava:'#ff8a2a'},o||{});
 // tablón de madera con vetas sencillas
 const plank=(g,x,y,w,d,h,at,c,seed,sm)=>M(g,x,y,box(w,d,h,at),c,sm,seed,RG);

 // ═════════ CÁSCARA DE LA SALA ═════════
 // o: {w,d,h,style:'enlucido'|'troncos'|'cana'|'piedra'|'shoji'|'basalto', wall,wall2,beam,floor,floor2,glass,door:'R'|'L',doorAt}. Origen = centro del suelo (z=0 = superficie).
 add('sala',(g,x,y,sm,o)=>{o=o||{};const P=pal(o),w=o.w||160,d=o.d||120,h=o.h||56,t=7,st=o.style||'enlucido',WC=o.wall||'#e6d2a6',WC2=o.wall2||mix(WC,'#7a5a3a',.14),BM=o.beam||P.woodD,FL=o.floor||'#b98a52',FL2=o.floor2||mix(FL,'#3a2410',.2),GL=o.glass||'#a8dcee';let sd=1000;const S=()=>sd++;
  // ---- suelo (losa con canto visible) ----
  M(g,x,y,box(w+2*t,d+2*t,5,[0,0,-5]),mix(FL2,'#2a1a0c',.35),0,S(),{crease:0,ij:.3});
  if(st==='enlucido'||st==='troncos'||st==='cana'){const n=Math.round(w/11),pw=w/n;for(let i=0;i<n;i++){const c=i%3===0?FL2:i%2?FL:mix(FL,'#ffe2a8',.12);plank(g,x,y,pw-.5,d,1.2,[-w/2+pw*(i+.5),0,-1.2],c,S(),0)}
   if(st==='troncos')for(let i=0;i<5;i++)M(g,x,y,blob({at:[-w*.35+i*w*.18,(i%2?.18:-.2)*d,.2],r:[8+(i%3)*2,5,.9],amp:.2,flat:true,seed:S()}),o.moss||'#6f9a46',0,S(),{paint:false,ij:.3,crease:0});
   if(st==='cana')for(let i=0;i<7;i++)M(g,x,y,box(w,1,.5,[0,-d/2+d*(i+.5)/7,.1]),'#5a4a2a',0,S(),NP)}
  else if(st==='piedra'||st==='basalto'){const cols=st==='basalto'?['#4a3e3c','#3c3234','#544644']:['#9a9aa0','#8a8a92','#a8a8ae'];let k=0;for(let i=0;i<6;i++)for(let j=0;j<8;j++){const bw=w/8,bd=d/6,ox=(i%2?bw*.35:0);M(g,x,y,box(bw-1.2,bd-1.2,1.3,[-w/2+bw*(j+.5)+ox-(i%2?bw*.35:0)*(j===7?1:0),-d/2+bd*(i+.5),-1.3]),cols[(k++*7)%3],sm,S(),{crease:.1,ij:.4})}
   if(st==='basalto')for(let i=0;i<5;i++){M(g,x,y,box(w*(.25+.07*(i%3)),.9,.4,[-w*.3+i*w*.16,-d*.4+i*d*.2,.15]),P.lava,0,S(),NI);M(g,x,y,box(.9,d*.18,.4,[-w*.3+i*w*.16+w*.07,-d*.4+i*d*.2+d*.08,.15]),P.lava,0,S(),NI)}}
  else if(st==='shoji'){const nx=4,ny=3,tw=w/nx,td=d/ny;M(g,x,y,box(w+1.6,d+1.6,1,[0,0,-1.2]),mix(P.woodD,'#000',.1),0,S(),{crease:0});for(let i=0;i<nx;i++)for(let j=0;j<ny;j++)M(g,x,y,box(tw-2.4,td-2.4,1.3,[-w/2+tw*(i+.5),-d/2+td*(j+.5),-1.2]),((i+j)%2?'#cfcb92':'#c8c48a'),0,S(),{crease:0,ij:.4,paint:false});
   for(let i=0;i<nx;i++)for(let j=0;j<ny;j++)M(g,x,y,box(tw-2.4,.7,.2,[-w/2+tw*(i+.5),-d/2+td*(j+.5),.1]),'#8a8a58',0,S(),NI)}
  // ---- paredes ----
  const wallR=()=>{ // plano y=−d/2, longitud w, mira a +y
   const y0=-d/2-t/2;
   if(st==='enlucido'){M(g,x,y,box(w+t,t,h,[ -t/2,y0,0]),WC,sm,S(),RG);M(g,x,y,box(w+t-1.5,t+.5,14,[-t/2-.6,y0+.1,0]),P.wood,sm,S(),RG);[-w/2+2,-w*.12,w*.2,w/2-2].forEach(px=>M(g,x,y,box(3.4,t+1.4,h-3.6,[px,y0+.4,0]),BM,sm,S(),RG));M(g,x,y,box(w+t,t+1.6,3.6,[-t/2,y0+.4,h-3.6]),BM,sm,S(),RG)}
   else if(st==='troncos'){for(let i=0;i<Math.floor((h-2)/6.2);i++)M(g,x,y,tilt(lathe({n:7,at:[0,0,0],r:[3.5,3.6],h:w+t,top:1,seed:S(),amp:.05}),[-w/2-t,y0+.2,3.4+i*6.2],'x',1),i%2?WC:WC2,sm,S(),RG);M(g,x,y,box(w+t,t,2,[-t/2,y0,h-2]),BM,sm,S(),RG)}
   else if(st==='cana'){M(g,x,y,box(w+t,t-2,h,[-t/2,y0+1,0]),mix(WC,'#3a2a10',.35),0,S(),{crease:0});for(let i=0;i<Math.round(w/4.4);i++)M(g,x,y,lathe({n:6,at:[-w/2+2.2+i*4.4,y0+t/2,0],r:[1.7,1.7],h:h,top:.95,seed:S()}),i%3===0?WC2:WC,sm,S(),RG);[12,30,48].forEach(z=>M(g,x,y,box(w+t-1,t+.5,2,[-t/2,y0+.2,z]),P.wood,sm,S(),RG));M(g,x,y,box(w+t,t+2,3,[-t/2,y0+.6,h-3]),P.woodD,sm,S(),RG)}
   else if(st==='piedra'||st==='basalto'){const cols=st==='basalto'?['#3a3034','#463a3c','#2e262a']:['#9aa0a8','#8a9098','#a8aeb6'];M(g,x,y,box(w+t,t,h,[-t/2,y0,0]),mix(cols[0],'#000',.2),0,S(),{crease:0});let k=0;const rows=Math.floor((h-4)/9);for(let r=0;r<rows;r++){let px=-w/2-t;while(px<w/2){const bl=14+((k*13)%9);M(g,x,y,box(Math.min(bl,w/2-px+1)-1.2,t+.6,8,[px+Math.min(bl,w/2-px+1)/2,y0+.2,r*9]),cols[(k++)%3],sm,S(),{crease:.1,ij:.4});px+=bl}}
    if(st==='basalto')for(let i=0;i<4;i++)M(g,x,y,box(1,.7,h*.5,[-w*.4+i*w*.28,y0+t/2+.5,h*.22+(i%2)*8]),P.lava,0,S(),NI);
    M(g,x,y,box(w+t,t+1.4,4,[-t/2,y0+.3,h-4]),BM,sm,S(),RG);[-w/2+2,w*.2,w/2-2].forEach(px=>M(g,x,y,box(4,t+1.4,h-4,[px,y0+.3,0]),BM,sm,S(),RG))}
   else if(st==='shoji'){M(g,x,y,box(w+t,t-2,h,[-t/2,y0+1,0]),'#b9a98a',0,S(),{crease:0});const n=4,pw=w/n;for(let i=0;i<n;i++){M(g,x,y,box(pw-3.2,1.2,h-16,[-w/2+pw*(i+.5),y0+t/2+.2,8]),WC,0,S(),{crease:0,ij:.35,paint:false});[1,2,3].forEach(q=>M(g,x,y,box(pw-3.2,1.5,.9,[-w/2+pw*(i+.5),y0+t/2+.3,8+q*(h-16)/4]),BM,0,S(),NI));M(g,x,y,box(.9,1.5,h-16,[-w/2+pw*(i+.5),y0+t/2+.3,8]),BM,0,S(),NI)}
    for(let i=0;i<=n;i++)M(g,x,y,box(3.2,t+1.2,h-3.4,[-w/2+pw*i,y0+.3,0]),BM,sm,S(),RG);M(g,x,y,box(w+t,t+1.6,3.4,[-t/2,y0+.4,h-3.4]),BM,sm,S(),RG);M(g,x,y,box(w+t-6,t+.2,8,[-t/2-.6,y0,0]),P.wood,sm,S(),RG)}
  };
  const wallL=()=>{ // plano x=−w/2, longitud d, mira a +x
   const x0=-w/2-t/2;
   if(st==='enlucido'){M(g,x,y,box(t,d,h,[x0,0,0]),WC2,sm,S(),RG);M(g,x,y,box(t+.5,d-1.5,14,[x0+.1,-.2,0]),P.wood,sm,S(),RG);[-d/2+2,-d*.1,d*.25,d/2-2].forEach(py=>M(g,x,y,box(t+1.4,3.4,h-3.6,[x0+.4,py,0]),BM,sm,S(),RG));M(g,x,y,box(t+1.6,d,3.6,[x0+.4,0,h-3.6]),BM,sm,S(),RG)}
   else if(st==='troncos'){for(let i=0;i<Math.floor((h-2)/6.2);i++)M(g,x,y,tilt(lathe({n:7,at:[0,0,0],r:[3.6,3.5],h:d+t,top:1,seed:S(),amp:.05}),[x0+.2,-d/2-t,3.4+i*6.2],'y',1),i%2?WC2:WC,sm,S(),RG);M(g,x,y,box(t,d+t,2,[x0,-t/2,h-2]),BM,sm,S(),RG)}
   else if(st==='cana'){M(g,x,y,box(t-2,d,h,[x0+1,0,0]),mix(WC,'#3a2a10',.35),0,S(),{crease:0});for(let i=0;i<Math.round(d/4.4);i++)M(g,x,y,lathe({n:6,at:[x0+t/2,-d/2+2.2+i*4.4,0],r:[1.7,1.7],h:h,top:.95,seed:S()}),i%3===0?WC2:WC,sm,S(),RG);[12,30,48].forEach(z=>M(g,x,y,box(t+.5,d-1,2,[x0+.2,0,z]),P.wood,sm,S(),RG));M(g,x,y,box(t+2,d,3,[x0+.6,0,h-3]),P.woodD,sm,S(),RG)}
   else if(st==='piedra'||st==='basalto'){const cols=st==='basalto'?['#463a3c','#3a3034','#2e262a']:['#8a9098','#9aa0a8','#a8aeb6'];M(g,x,y,box(t,d,h,[x0,0,0]),mix(cols[0],'#000',.2),0,S(),{crease:0});let k=2;const rows=Math.floor((h-4)/9);for(let r=0;r<rows;r++){let py=-d/2;while(py<d/2){const bl=12+((k*11)%9);M(g,x,y,box(t+.6,Math.min(bl,d/2-py+1)-1.2,8,[x0+.2,py+Math.min(bl,d/2-py+1)/2,r*9]),cols[(k++)%3],sm,S(),{crease:.1,ij:.4});py+=bl}}
    if(st==='basalto')for(let i=0;i<3;i++)M(g,x,y,box(.7,1,h*.5,[x0+t/2+.5,-d*.35+i*d*.3,h*.2+(i%2)*10]),P.lava,0,S(),NI);
    M(g,x,y,box(t+1.4,d,4,[x0+.3,0,h-4]),BM,sm,S(),RG);[-d/2+2,d*.15,d/2-2].forEach(py=>M(g,x,y,box(t+1.4,4,h-4,[x0+.3,py,0]),BM,sm,S(),RG))}
   else if(st==='shoji'){M(g,x,y,box(t-2,d,h,[x0+1,0,0]),'#b9a98a',0,S(),{crease:0});const n=3,pd=d/n;for(let i=0;i<n;i++){M(g,x,y,box(1.2,pd-3.2,h-16,[x0+t/2+.2,-d/2+pd*(i+.5),8]),WC2,0,S(),{crease:0,ij:.35,paint:false});[1,2,3].forEach(q=>M(g,x,y,box(1.5,pd-3.2,.9,[x0+t/2+.3,-d/2+pd*(i+.5),8+q*(h-16)/4]),BM,0,S(),NI));M(g,x,y,box(1.5,.9,h-16,[x0+t/2+.3,-d/2+pd*(i+.5),8]),BM,0,S(),NI)}
    for(let i=0;i<=n;i++)M(g,x,y,box(t+1.2,3.2,h-3.4,[x0+.3,-d/2+pd*i,0]),BM,sm,S(),RG);M(g,x,y,box(t+1.6,d,3.4,[x0+.4,0,h-3.4]),BM,sm,S(),RG);M(g,x,y,box(t+.2,d-6,8,[x0,-.2,0]),P.wood,sm,S(),RG)}
  };
  wallL();wallR();
  // esquina: poste y capitel
  M(g,x,y,box(t+1.6,t+1.6,h,[-w/2-t/2,-d/2-t/2,0]),BM,sm,S(),RG);
  // ---- ventanas ----
  const winR=(px,pz,ww,wh)=>{const yy=-d/2+.2;M(g,x,y,box(ww+4,1.8,wh+4,[px,yy-.2,pz-2]),P.woodD,sm,S(),RG);M(g,x,y,box(ww,1,wh,[px,yy+.9,pz]),GL,0,S(),{crease:0,paint:false,ij:.3});M(g,x,y,box(1.1,1.2,wh,[px,yy+1,pz]),P.woodD,0,S(),NP);M(g,x,y,box(ww,1.2,1.1,[px,yy+1,pz+wh/2]),P.woodD,0,S(),NP);
   if(st!=='shoji'){M(g,x,y,box(ww+5,2.2,1.8,[px,yy+.5,pz-3.6]),P.woodL,sm,S(),RG)}};
  const winL=(py,pz,ww,wh)=>{const xx=-w/2+.2;M(g,x,y,box(1.8,ww+4,wh+4,[xx-.2,py,pz-2]),P.woodD,sm,S(),RG);M(g,x,y,box(1,ww,wh,[xx+.9,py,pz]),GL,0,S(),{crease:0,paint:false,ij:.3});M(g,x,y,box(1.2,1.1,wh,[xx+1,py,pz]),P.woodD,0,S(),NP);M(g,x,y,box(1.2,ww,1.1,[xx+1,py,pz+wh/2]),P.woodD,0,S(),NP);
   if(st!=='shoji')M(g,x,y,box(2.2,ww+5,1.8,[xx+.5,py,pz-3.6]),P.woodL,sm,S(),RG)};
  if(st!=='shoji'){winR(-w*.3,22,17,19);winR(w*.1,22,17,19);winL(-d*.18,22,17,19)}
  // ---- puerta de salida (pared derecha, a la derecha) ----
  {const px=o.doorAt!=null?o.doorAt:w*.34,yy=-d/2+.2,dw=17,dh=36;M(g,x,y,box(dw+6,2.4,dh+5,[px,yy-.3,0]),P.woodD,sm,S(),RG);M(g,x,y,box(dw,1.4,dh,[px,yy+1,0]),P.wood,sm,S(),RG);
   for(let i=0;i<4;i++)M(g,x,y,box(.7,1.6,dh-2,[px-dw/2+3+i*(dw-6)/3,yy+1.2,1]),mix(P.wood,'#2a1a0c',.35),0,S(),NP);
   M(g,x,y,box(dw,1.6,1.4,[px,yy+1.1,dh*.52]),P.woodD,0,S(),NP);M(g,x,y,blob({at:[px+dw*.3,yy+2,dh*.45],r:[1.5,1.2,1.5],amp:.05,seed:S()}),'#e8c050',0,S(),{paint:false,ink:false});
   M(g,x,y,box(dw+8,6,1.6,[px,yy+3.4,0]),mix(P.woodD,'#000',.15),sm,S(),RG)}   // umbral
 },2);

 // ═════════ MOBILIARIO ═════════
 const leg=(g,x,y,px,py,h,c,sd,r)=>M(g,x,y,lathe({n:5,at:[px,py,0],r:[r||1.1,r||1.1],h,top:.85,seed:sd}),c,0,sd,RG);
 add('mesa',(g,x,y,sm,o)=>{const P=pal(o),w=o.w||26,d=o.d||16,h=o.h||9;soft(g,x,y,Math.max(w,d)*.62);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b],i)=>leg(g,x,y,a*(w/2-1.8),b*(d/2-1.8),h,P.woodD,1500+i));
  M(g,x,y,box(w,d,1.8,[0,0,h]),P.wood,sm,1505,RG);M(g,x,y,box(w-3,d-3,.5,[0,0,h+1.8]),P.woodL,0,1506,NP);
  if(o.cloth!==false&&o.runner)M(g,x,y,box(w*.55,d+.6,.5,[0,0,h+1.9]),o.runner===true?P.cloth:o.runner,0,1507,NP);
  if(o.set){M(g,x,y,lathe({n:7,at:[w*.2,0,h+2],r:[2.4,2.4],h:1.6,top:1.2,seed:1508}),'#e8e0d0',0,1508,{crease:0,paint:false});M(g,x,y,lathe({n:6,at:[-w*.2,d*.12,h+2],r:[1.4,1.4],h:3,top:1,seed:1509}),P.cloth,0,1509,{crease:0,paint:false})}},1.8);
 add('silla',(g,x,y,sm,o)=>{const P=pal(o);soft(g,x,y,5);[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b],i)=>leg(g,x,y,a*2.2,b*2.2,4.4,P.woodD,1520+i,.7));
  M(g,x,y,box(6.4,6.4,1.4,[0,0,4.4]),P.wood,sm,1525,RG);if(o.cushion)M(g,x,y,box(5,5,1,[0,0,5.8]),o.cushion,0,1526,NP);M(g,x,y,box(1.2,6.4,7.5,[-3.1,0,5.8]),P.woodL,sm,1527,RG);M(g,x,y,box(1,5,1.2,[-3.1,0,10.4]),P.wood,0,1528,NP)},1.8);
 add('taburete',(g,x,y,sm,o)=>{const P=pal(o);soft(g,x,y,5);M(g,x,y,lathe({n:7,at:[0,0,0],r:[3.4,3.4],h:5.4,top:.8,seed:1530}),P.wood,sm,1530,RG);M(g,x,y,lathe({n:7,at:[0,0,5.2],r:[3.8,3.8],h:1.2,top:1,seed:1531}),P.woodL,sm,1531,RG);if(o.cushion)M(g,x,y,lathe({n:7,at:[0,0,6.2],r:[3.2,3.2],h:.9,top:.95,seed:1532}),o.cushion,0,1532,NP)},1.8);
 add('cama',(g,x,y,sm,o)=>{const P=pal(o),w=o.w||34,d=o.d||19;soft(g,x,y,w*.6);
  M(g,x,y,box(w,d,3.2,[0,0,1.6]),P.woodD,sm,1540,RG);[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b],i)=>leg(g,x,y,a*(w/2-1.4),b*(d/2-1.4),1.8,P.woodD,1541+i,1.2));
  M(g,x,y,box(w-2,d-2,3,[0,0,4.8]),o.sheet||P.cloth2,sm,1546,RG);M(g,x,y,box(w*.64,d-1.2,3.6,[w*.14,0,5.6]),o.blanket||P.cloth,sm,1547,RG);
  M(g,x,y,blob({at:[-w*.36,0,9],r:[3.6,d*.32,2.2],amp:.1,seed:1548}),o.pillow||'#f4efe0',sm,1548);M(g,x,y,box(2,d,12,[-w/2-.4,0,0]),P.wood,sm,1549,RG);M(g,x,y,box(2,d,5,[w/2+.4,0,0]),P.wood,sm,1550,RG)},1.8);
 add('alfombra',(g,x,y,sm,o)=>{const P=pal(o),w=o.w||34,d=o.d||24,c=o.col||P.cloth,c2=o.col2||P.cloth2;
  if(o.round){M(g,x,y,lathe({n:12,at:[0,0,0],r:[w/2,d/2],h:.6,top:1,seed:1560,amp:.05}),c,0,1560,{crease:0,ij:.3});M(g,x,y,lathe({n:12,at:[0,0,.6],r:[w*.36,d*.36],h:.3,top:1,seed:1561}),c2,0,1561,NP);M(g,x,y,lathe({n:12,at:[0,0,.9],r:[w*.2,d*.2],h:.3,top:1,seed:1562}),c,0,1562,NP);return}
  if(o.fur){M(g,x,y,blob({at:[0,0,.6],r:[w/2,d/2,.9],amp:.16,flat:true,seed:1563}),o.fur,sm,1563);M(g,x,y,blob({at:[-w*.34,d*.1,.9],r:[4,3.6,.8],amp:.1,flat:true,seed:1564}),mix(o.fur,'#3a2a1a',.4),0,1564,NP);return}
  M(g,x,y,box(w,d,.6,[0,0,0]),c,0,1565,{crease:0,ij:.3});M(g,x,y,box(w-4,d-4,.5,[0,0,.6]),c2,0,1566,NP);M(g,x,y,box(w-9,d-9,.4,[0,0,1.1]),c,0,1567,NP);for(let i=0;i<4;i++)M(g,x,y,box(1,d-2,.4,[-w/2+4+i*(w-8)/3,0,.7]),'#e8c050',0,1568+i,NI)},1.8);
 // hogar de piedra con campana (contra la pared del fondo; abertura en +y). La llama la pone el motor.
 add('hogar',(g,x,y,sm,o)=>{const P=pal(o),w=o.w||30,S0=o.stone||'#b4b0a4',S1=mix(S0,'#000',.18);soft(g,x,y,w*.7);
  M(g,x,y,box(w,10,5,[0,0,0]),S1,sm,1580,RG);M(g,x,y,box(5,10,20,[-w/2+2.5,0,5]),S0,sm,1581,RG);M(g,x,y,box(5,10,20,[w/2-2.5,0,5]),S0,sm,1582,RG);M(g,x,y,box(w-10,7,17,[0,-1.6,5]),'#1e1410',0,1583,{crease:0,paint:false});
  M(g,x,y,box(w+4,11,3,[0,0,25]),P.woodD,sm,1584,RG);M(g,x,y,box(w-3,8,14,[0,-1,28]),S0,sm,1585,RG);M(g,x,y,box(w-9,6,14,[0,-1.6,42]),S1,sm,1586,RG);M(g,x,y,box(7,6,10,[0,-2,56]),S0,sm,1587,RG);
  for(let i=0;i<3;i++)M(g,x,y,lathe({n:5,at:[-4+i*4,.4,5.4],r:[2.2,1.4],h:2,top:.8,seed:1588+i}),'#3a2a1a',0,1588+i,{crease:0,paint:false})},1.8);
 // alacena / aparador
 add('alacena',(g,x,y,sm,o)=>{const P=pal(o),w=o.w||20;soft(g,x,y,w*.7);M(g,x,y,box(w,9,26,[0,0,0]),P.wood,sm,1600,RG);M(g,x,y,box(w+2,10,2,[0,0,26]),P.woodD,sm,1601,RG);
  [-1,1].forEach((s,i)=>{M(g,x,y,box(w/2-2,.8,19,[s*(w/4),5,4]),P.woodL,0,1602+i,{crease:0,ij:.3});M(g,x,y,blob({at:[s*1.6,5.8,13],r:[.9,.7,.9],amp:.04,seed:1604+i}),'#e8c050',0,1604+i,{paint:false,ink:false})});
  M(g,x,y,box(w-3,.8,3,[0,5,24]),P.cloth,0,1606,NP);if(o.jars)[-1,0,1].forEach((s,i)=>M(g,x,y,lathe({n:6,at:[s*5,0,28],r:[1.8,1.8],h:4,top:.9,seed:1607+i}),['#d8a050','#9ac07a','#d87a6a'][i],0,1607+i,{crease:0,paint:false}))},1.8);
 // estantería baja de pared con objetos (variante de decoración)
 add('estante',(g,x,y,sm,o)=>{const P=pal(o),w=o.w||26;soft(g,x,y,w*.4);M(g,x,y,box(w,3.4,1.6,[0,0,0]),P.wood,sm,1620,RG);[-1,1].forEach((s,i)=>M(g,x,y,box(1.4,3,5,[s*(w/2-2),0,-5]),P.woodD,0,1621+i,NP));
  (o.things||['jar','jar','book']).forEach((t,i)=>{const px=-w/2+5+i*(w-10)/Math.max(1,(o.things||[1,1,1]).length-1||1);if(t==='book')M(g,x,y,box(2.2,3,5,[px,0,1.6]),P.cloth,0,1623+i,NP);else if(t==='pot')M(g,x,y,lathe({n:7,at:[px,0,1.6],r:[2.4,2.4],h:3,top:1.1,seed:1630+i}),'#c9885a',0,1630+i,{crease:0,paint:false});else M(g,x,y,lathe({n:6,at:[px,0,1.6],r:[1.9,1.9],h:4.2,top:.9,seed:1640+i}),['#d8a050','#9ac07a','#d87a6a','#8ab0d8'][i%4],0,1640+i,{crease:0,paint:false})})},1.8);
 // barra de taberna (mostrador largo, a lo largo de x)
 add('barra',(g,x,y,sm,o)=>{const P=pal(o),w=o.w||48,d=o.d||9;soft(g,x,y,w*.55);M(g,x,y,box(w,d,13,[0,0,0]),P.wood,sm,1650,RG);for(let i=0;i<Math.round(w/8);i++)M(g,x,y,box(w/Math.round(w/8)-.8,.8,10,[-w/2+(i+.5)*w/Math.round(w/8),d/2+.2,1.5]),i%2?P.woodL:mix(P.wood,'#000',.1),0,1651+i,NP);
  M(g,x,y,box(w+3,d+3,2,[0,0,13]),P.woodD,sm,1670,RG);M(g,x,y,box(w+2,.8,1.2,[0,d/2+1.4,5]),'#c8a050',0,1671,NI);
  [-1,0,1].forEach((s,i)=>M(g,x,y,lathe({n:6,at:[s*w*.28,-.5,15],r:[1.5,1.5],h:4,top:.9,seed:1672+i}),['#c9885a','#e8e0d0','#8ab0d8'][i],0,1672+i,{crease:0,paint:false}))},1.8);
 // barril de taberna tumbado con grifo
 add('barrilTap',(g,x,y,sm,o)=>{const P=pal(o);soft(g,x,y,9);M(g,x,y,box(14,9,2.4,[0,0,0]),P.woodD,sm,1690,RG);M(g,x,y,tilt(lathe({n:9,at:[0,0,0],r:[5.6,5.6],h:13,top:1.08,seed:1691}),[-6.5,0,7],'x',1),P.wood,sm,1691,RG);
  [-3,3].forEach((px,i)=>M(g,x,y,tilt(lathe({n:9,at:[0,0,0],r:[5.9,5.9],h:1.3,top:1,seed:1692+i}),[px-.6,0,7],'x',1),P.woodD,0,1692+i,{crease:0,paint:false}));M(g,x,y,box(1.2,1.2,2.6,[6.8,0,5.4]),'#c8a050',0,1694,NI)},1.8);
 // mesa de trabajo con tornillo de banco y herramientas
 add('mesaTrabajo',(g,x,y,sm,o)=>{const P=pal(o),w=o.w||30,d=o.d||14;soft(g,x,y,w*.6);[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b],i)=>M(g,x,y,box(2.6,2.6,9,[a*(w/2-2),b*(d/2-2),0]),P.woodD,sm,1700+i,RG));
  M(g,x,y,box(w,d,2.4,[0,0,9]),P.wood,sm,1705,RG);M(g,x,y,box(w-4,2,3,[0,d/2-2,3.4]),P.woodD,0,1706,NP);M(g,x,y,box(4.4,3.2,4,[w/2-4,d/2-3,11.4]),'#6a6a70',sm,1707,RG);M(g,x,y,box(1.2,4.8,1.2,[w/2-4,d/2+.6,14.6]),'#3a3a40',0,1708,NP);
  M(g,x,y,box(7,1.6,.8,[-w*.2,0,11.4]),'#8a8f98',0,1709,NI);M(g,x,y,box(1.6,7,.8,[-w*.05,-1,11.4]),P.woodL,0,1710,NI);M(g,x,y,lathe({n:6,at:[w*.12,-2,11.4],r:[1.6,1.6],h:2.6,top:1,seed:1711}),'#c9885a',0,1711,{crease:0,paint:false})},1.8);
 // escritorio de estudio (mesa con papeles, pluma y vela)
 add('mesaEscribir',(g,x,y,sm,o)=>{const P=pal(o),w=o.w||28,d=o.d||14;soft(g,x,y,w*.6);[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b],i)=>leg(g,x,y,a*(w/2-1.8),b*(d/2-1.8),9,P.woodD,1720+i));M(g,x,y,box(w,d,1.8,[0,0,9]),P.wood,sm,1725,RG);M(g,x,y,box(w*.4,d*.62,1.2,[w*.18,0,10.8]),'#e6dcb8',0,1726,NP);M(g,x,y,box(w*.3,d*.5,.6,[-w*.2,-1,10.8]),P.cloth2,0,1727,NP);
  M(g,x,y,tilt(lathe({n:5,at:[0,0,0],r:[.45,.45],h:6,top:.6,seed:1728}),[w*.1,-2,12.4],'x',1),'#f4efe0',0,1728,NP);M(g,x,y,lathe({n:6,at:[-w*.34,2,10.8],r:[1.1,1.1],h:3,top:1,seed:1729}),'#f4efe0',0,1729,{crease:0,paint:false});M(g,x,y,blob({at:[-w*.34,2,14.4],r:[.8,.8,1.3],amp:.05,seed:1730}),'#ffd070',0,1730,{paint:false,ink:false})},1.8);
 // armero de pared: tres armas colgadas
 add('rackArmas',(g,x,y,sm,o)=>{const P=pal(o),w=o.w||24;soft(g,x,y,w*.3);M(g,x,y,box(w,2.2,3,[0,0,16]),P.woodD,sm,1740,RG);M(g,x,y,box(w,2.2,2.4,[0,0,6]),P.woodD,sm,1741,RG);[-1,0,1].forEach((s,i)=>{const c=['#cfd8e0','#b8c4d0','#d8d0c0'][i],hx=s*w*.3;M(g,x,y,box(1.4,1,18,[hx,1.8,8]),c,0,1742+i,{crease:0,ij:.4,paint:false});M(g,x,y,box(5,1,1.1,[hx,1.9,8]),'#d8b050',0,1745+i,NI);M(g,x,y,box(1.1,1,5,[hx,1.9,3.4]),P.woodD,0,1748+i,NI)});
  M(g,x,y,box(7,1.4,.9,[w*.0,2.4,19.6]),'#8a8f98',0,1751,NI)},1.8);
 // tablón de herramientas (martillo, tenazas) colgado
 add('herramientas',(g,x,y,sm,o)=>{const P=pal(o),w=o.w||24;soft(g,x,y,w*.3);M(g,x,y,box(w,1.8,14,[0,0,5]),P.wood,sm,1760,RG);M(g,x,y,box(1.1,1.2,9,[-w*.3,1.6,7]),P.woodL,0,1761,NP);M(g,x,y,box(5,1.2,2.6,[-w*.3,1.6,15]),'#6a6a70',0,1762,NP);
  M(g,x,y,box(1,1.2,10,[0,1.6,7]),'#8a8f98',0,1763,NP);M(g,x,y,box(1,1.2,10,[2,1.6,7]),'#8a8f98',0,1764,NP);M(g,x,y,box(6,1.2,1,[w*.3,1.6,12]),'#8a8f98',0,1765,NP);M(g,x,y,box(1,1.2,8,[w*.3-2.4,1.6,5]),P.woodL,0,1766,NP)},1.8);
 add('escudoPared',(g,x,y,sm,o)=>{const P=pal(o),c=o.col||P.cloth;soft(g,x,y,5);M(g,x,y,lathe({n:8,at:[0,.6,3],r:[6,.9],h:12,top:.2,seed:1770,rot:0}),P.woodD,sm,1770,RG);
  M(g,x,y,box(9.4,1,11,[0,1.2,4]),c,sm,1771,RG);M(g,x,y,box(9.8,1.1,1.4,[0,1.3,9.4]),'#d8b050',0,1772,NI);M(g,x,y,box(1.8,1.1,10,[0,1.4,4.4]),P.cloth2,0,1773,NI);M(g,x,y,box(7,1.1,1.8,[0,1.4,8]),P.cloth2,0,1774,NI)},1.8);
 add('cuadro',(g,x,y,sm,o)=>{const P=pal(o),w=o.w||12,h=o.h||9;soft(g,x,y,4);M(g,x,y,box(w+1.6,1.2,h+1.6,[0,0,10]),P.woodD,sm,1780,RG);M(g,x,y,box(w,1,h,[0,.6,10.8]),o.sky||'#9fd0e8',0,1781,NP);M(g,x,y,blob({at:[-w*.2,1.3,11.4],r:[w*.35,.3,h*.28],amp:.1,seed:1782,flat:true}),o.hill||'#7fb060',0,1782,{paint:false,ink:false});M(g,x,y,blob({at:[w*.25,1.4,14.6],r:[2,.2,1.6],amp:.05,seed:1783}),'#ffe27a',0,1783,{paint:false,ink:false})},1.8);
 // plantas y jarrones
 add('maceta',(g,x,y,sm,o)=>{const P=pal(o),k=o.kind||'flores',pc=o.pot||'#c9885a';soft(g,x,y,6.4);M(g,x,y,lathe({n:8,at:[0,0,0],r:[3.6,3.6],h:5,top:1.18,seed:1790}),pc,sm,1790,RG);M(g,x,y,lathe({n:8,at:[0,0,4.6],r:[4.2,4.2],h:1.2,top:1,seed:1791}),mix(pc,'#000',.18),0,1791,{crease:0,paint:false});M(g,x,y,lathe({n:8,at:[0,0,5.6],r:[3.4,3.4],h:.5,top:1,seed:1792}),'#4a3220',0,1792,{crease:0,paint:false,ink:false});
  if(k==='flores'){[-3,0,3].forEach((s,i)=>{M(g,x,y,blob({at:[s,(i-1)*1.2,9+i%2*2],r:[3.6,3.6,3],amp:.25,seed:1793+i}),P.plant,sm,1793+i);M(g,x,y,blob({at:[s+.6,(i-1)*1.2+1,12+i%2*2],r:[1.4,1.4,1.2],amp:.1,seed:1796+i}),[P.flower,'#ffd75a','#ffffff'][i],0,1796+i,{paint:false,ink:false})})}
  else if(k==='helecho'){for(let i=0;i<7;i++){const a=i*.9;M(g,x,y,tilt(cone({at:[0,0,0],r:[1,.5],h:11,n:4,amp:.05,seed:1800+i}),[Math.cos(a)*1.2,Math.sin(a)*1.2,5.6],i%2?'x':'y',i%3?1:-1),i%2?P.plant:mix(P.plant,'#ffffff',.18),sm,1800+i,{crease:0})}M(g,x,y,blob({at:[0,0,8],r:[3,3,3],amp:.2,seed:1810}),P.plant,sm,1810)}
  else if(k==='bonsai'){M(g,x,y,lathe({n:5,at:[0,0,5.6],r:[.9,.9],h:7,top:.6,seed:1811}),'#6a4a30',sm,1811,RG);M(g,x,y,tilt(lathe({n:5,at:[0,0,0],r:[.7,.7],h:6,top:.6,seed:1812}),[0,0,10.6],'x',1),'#6a4a30',0,1812,RG);[[0,0,15,5,3.2],[6,0,13,4,2.6],[-3,1,12.4,3.4,2.4]].forEach((q,i)=>M(g,x,y,blob({at:[q[0],q[1],q[2]],r:[q[3],q[3],q[4]],amp:.2,seed:1813+i}),i%2?P.plant:mix(P.plant,'#2a5a2a',.2),sm,1813+i))}
  else if(k==='bambu'){for(let i=0;i<4;i++){M(g,x,y,lathe({n:6,at:[-2.2+i*1.5,(i%2)*1.4,5.6],r:[.8,.8],h:20+i*4,top:.9,seed:1820+i}),i%2?'#9ac060':'#7fb050',0,1820+i,{crease:0,ij:.3});for(let j=1;j<3;j++)M(g,x,y,lathe({n:6,at:[-2.2+i*1.5,(i%2)*1.4,5.6+j*7],r:[1,1],h:.7,top:1,seed:1830+i*3+j}),'#5a8a3a',0,1830+i*3+j,{crease:0,paint:false})}M(g,x,y,blob({at:[0,0,26],r:[5,4,3],amp:.3,seed:1840}),P.plant,sm,1840)}
  else if(k==='fuego'){for(let i=0;i<5;i++){const a=i*1.26;M(g,x,y,tilt(cone({at:[0,0,0],r:[1.4,.8],h:9+i%2*3,n:4,amp:.05,seed:1850+i}),[Math.cos(a)*1.4,Math.sin(a)*1.4,5.4],i%2?'x':'y',i%2?1:-1),i%2?'#d8501a':'#ff8a2a',0,1850+i,{crease:0,paint:false})}M(g,x,y,blob({at:[0,0,9],r:[2.4,2.4,2.6],amp:.2,seed:1860}),'#ffb040',0,1860,{paint:false,ink:false})}
  else if(k==='abeto'){M(g,x,y,lathe({n:5,at:[0,0,5.6],r:[.8,.8],h:5,top:.8,seed:1861}),'#6a4a30',0,1861,RG);[[5.2,13,5],[7.6,10,4],[10,8,3]].forEach((q,i)=>M(g,x,y,cone({at:[0,0,5.6+i*5],r:[q[0],q[0]],h:q[1],n:6,amp:.1,seed:1862+i}),i%2?P.plant:mix(P.plant,'#ffffff',.14),sm,1862+i,{crease:.1}))}
  else if(k==='lirio'){for(let i=0;i<3;i++)M(g,x,y,blob({at:[-3+i*3,(i%2)*1.5,6.4],r:[3.4,2.6,.7],amp:.1,flat:true,seed:1870+i}),P.plant,sm,1870+i);M(g,x,y,blob({at:[0,0,7.6],r:[1.8,1.8,1.4],amp:.1,seed:1873}),P.flower,0,1873,{paint:false,ink:false})}},1.6);
 // planta grande de suelo (arbusto interior) y planta colgante
 add('plantaGrande',(g,x,y,sm,o)=>{const P=pal(o),pc=o.pot||'#a8784a';soft(g,x,y,9);M(g,x,y,lathe({n:9,at:[0,0,0],r:[5.4,5.4],h:8,top:1.15,seed:1880}),pc,sm,1880,RG);M(g,x,y,lathe({n:9,at:[0,0,7.6],r:[6,6],h:1.6,top:1,seed:1881}),mix(pc,'#000',.18),0,1881,{crease:0,paint:false});
  for(let i=0;i<7;i++){const a=i*.9;M(g,x,y,blob({at:[Math.cos(a)*4,Math.sin(a)*4,14+(i%3)*5],r:[5.4,5.4,6],amp:.25,seed:1882+i}),i%2?P.plant:mix(P.plant,'#ffffff',.16),sm,1882+i)}M(g,x,y,blob({at:[0,0,26],r:[5.4,5.4,5],amp:.25,seed:1890}),mix(P.plant,'#ffffff',.2),sm,1890);if(o.flower)[[-4,2,24],[4,-1,29]].forEach((q,i)=>M(g,x,y,blob({at:q,r:[1.6,1.6,1.4],amp:.1,seed:1891+i}),o.flower,0,1891+i,{paint:false,ink:false}))},1.5);
 add('colgante',(g,x,y,sm,o)=>{const P=pal(o);soft(g,x,y,5);M(g,x,y,box(16,1.2,1.2,[0,0,20]),P.woodD,0,1900,NP);for(let i=0;i<4;i++){const px=-6+i*4;M(g,x,y,box(.5,.5,6,[px,1,14]),'#a8a060',0,1901+i,NP);M(g,x,y,blob({at:[px,1.4,11.6],r:[2,1.4,3.2],amp:.25,seed:1905+i}),[P.plant,'#c9a050','#d87a6a',P.plant][i],sm,1905+i)}},1.8);
 // piel de oso/lobo extendida en la pared (cuerpo plano con garras)
 add('pielPared',(g,x,y,sm,o)=>{const P=pal(o),c=o.fur||'#a8794a';soft(g,x,y,5);M(g,x,y,box(2,.8,14,[-6,.2,3]),P.woodD,0,1910,NP);M(g,x,y,box(2,.8,14,[6,.2,3]),P.woodD,0,1911,NP);M(g,x,y,blob({at:[0,.9,10],r:[8,.7,9],amp:.14,seed:1912}),c,sm,1912);M(g,x,y,blob({at:[0,1.1,15],r:[3.4,.6,3],amp:.08,seed:1913}),mix(c,'#3a2a1a',.3),0,1913,{paint:false})},1.8);
 // cojín / mesa baja / biombo / farol de papel (Oriental), y brasero está en style-organic
 add('cojin',(g,x,y,sm,o)=>{const P=pal(o);soft(g,x,y,5);M(g,x,y,box(7.4,7.4,1.8,[0,0,0]),o.col||P.cloth,sm,1920,RG);M(g,x,y,box(5,5,.5,[0,0,1.8]),P.cloth2,0,1921,NP);M(g,x,y,blob({at:[0,0,2.6],r:[1.1,1.1,.6],amp:.05,seed:1922}),'#e8c050',0,1922,{paint:false,ink:false})},1.8);
 add('mesaBaja',(g,x,y,sm,o)=>{const P=pal(o),w=o.w||22,d=o.d||14;soft(g,x,y,w*.55);[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b],i)=>M(g,x,y,box(2,2,3.6,[a*(w/2-2),b*(d/2-2),0]),P.woodD,sm,1930+i,RG));M(g,x,y,box(w,d,2,[0,0,3.6]),P.wood,sm,1935,RG);M(g,x,y,box(w-3,d-3,.5,[0,0,5.6]),P.woodL,0,1936,NP);
  M(g,x,y,lathe({n:8,at:[w*.2,0,6],r:[2.4,2.4],h:2,top:1.15,seed:1937}),'#e8e0d0',0,1937,{crease:0,paint:false});M(g,x,y,lathe({n:7,at:[-w*.2,d*.1,6],r:[1.8,1.8],h:3.4,top:.9,seed:1938}),P.cloth,0,1938,{crease:0,paint:false})},1.8);
 add('biombo',(g,x,y,sm,o)=>{const P=pal(o),w=o.w||30;soft(g,x,y,w*.5);for(let i=0;i<3;i++){const px=-w/2+w/6+i*w/3,zz=i%2?1.4:-1.4;M(g,x,y,box(w/3-.6,1.4,24,[px,zz,0]),P.woodD,sm,1940+i,RG);M(g,x,y,box(w/3-3,.8,19,[px,zz+.9,2.4]),o.paper||P.cloth2,0,1943+i,{crease:0,paint:false,ij:.35});M(g,x,y,blob({at:[px,zz+1.4,12],r:[3.4,.3,5],amp:.14,seed:1946+i,flat:true}),[P.cloth,P.plant,P.flower][i],0,1946+i,{paint:false,ink:false})}},1.8);
 add('farolPapel',(g,x,y,sm,o)=>{const P=pal(o);soft(g,x,y,5);M(g,x,y,lathe({n:6,at:[0,0,0],r:[3.4,3.4],h:1.6,top:.9,seed:1950}),P.woodD,sm,1950,RG);M(g,x,y,lathe({n:6,at:[0,0,1.6],r:[1,1],h:14,top:1,seed:1951}),P.woodD,0,1951,NP);M(g,x,y,lathe({n:8,at:[0,0,15],r:[5,5],h:9,top:.9,seed:1952}),o.paper||'#f6e8c0',0,1952,{crease:0,ij:.35,paint:false});M(g,x,y,lathe({n:8,at:[0,0,15],r:[5.3,5.3],h:1,top:1,seed:1953}),P.woodD,0,1953,NP);M(g,x,y,lathe({n:8,at:[0,0,23],r:[5.3,5.3],h:1,top:.6,seed:1954}),P.woodD,0,1954,NP)},1.8);
 // cofre de ropa / arcón (variante cerrada)
 add('arcon',(g,x,y,sm,o)=>{const P=pal(o),w=o.w||20,d=o.d||11;soft(g,x,y,w*.6);M(g,x,y,box(w,d,9,[0,0,0]),P.wood,sm,1960,RG);M(g,x,y,box(w+1,d+1,2.4,[0,0,9]),P.woodL,sm,1961,RG);[-1,1].forEach((s,i)=>M(g,x,y,box(2,d+1.4,11.4,[s*(w/2-3),0,0]),'#6a6a70',0,1962+i,{crease:0,ij:.3}));M(g,x,y,box(2.4,.8,3.4,[0,d/2+.2,6.4]),'#e8c050',0,1964,NI)},1.7);
 // hilo de pescado / redes (Pantano) y hamaca
 add('hamaca',(g,x,y,sm,o)=>{const P=pal(o),w=o.w||34;soft(g,x,y,w*.5);[-1,1].forEach((s,i)=>M(g,x,y,lathe({n:5,at:[s*w/2,0,0],r:[1.4,1.4],h:20,top:.8,seed:1970+i}),P.woodD,sm,1970+i,RG));M(g,x,y,blob({at:[0,0,10],r:[w*.46,6.4,2.4],amp:.1,seed:1972}),o.col||P.cloth,sm,1972);M(g,x,y,blob({at:[-w*.3,0,12],r:[4,4,1.6],amp:.1,seed:1973}),'#f4efe0',0,1973,{paint:false})},1.8);
 add('barrilAgua',(g,x,y,sm,o)=>{const P=pal(o);soft(g,x,y,8);M(g,x,y,lathe({n:9,at:[0,0,0],r:[5.4,5.4],h:12,top:.95,seed:1980}),P.wood,sm,1980,RG);[3,8].forEach((z,i)=>M(g,x,y,lathe({n:9,at:[0,0,z],r:[5.7,5.7],h:1.3,top:1,seed:1981+i}),'#6a6a70',0,1981+i,{crease:0,paint:false}));M(g,x,y,lathe({n:9,at:[0,0,11.6],r:[4.6,4.6],h:.6,top:1,seed:1983}),'#5a8ab8',0,1983,{paint:false,ink:false,crease:0})},1.8);
 add('fuelle',(g,x,y,sm,o)=>{const P=pal(o);soft(g,x,y,9);M(g,x,y,box(16,8,2,[0,0,0]),P.woodD,sm,1990,RG);M(g,x,y,box(14,7,5,[-1,0,2]),P.woodL,sm,1991,RG);M(g,x,y,box(14,7,1.2,[-1,0,7]),P.woodD,sm,1992,RG);M(g,x,y,blob({at:[-1,0,5.6],r:[6,4.2,2.6],amp:.1,seed:1993}),'#8a5a2a',sm,1993);M(g,x,y,tilt(cone({at:[0,0,0],r:[1.6,1.6],h:8,n:5,amp:0,seed:1994}),[7,0,4],'x',1),'#3a3a40',0,1994,{crease:0,paint:false})},1.8);
 // montón de lingotes y carbón están en style-organic; añadimos yunque pequeño de decoración y cesta de leña
 add('cestaLena',(g,x,y,sm,o)=>{const P=pal(o);soft(g,x,y,8);M(g,x,y,lathe({n:8,at:[0,0,0],r:[6,6],h:8,top:1.12,seed:2000}),'#b08a52',sm,2000,RG);for(let i=0;i<5;i++)M(g,x,y,tilt(lathe({n:6,at:[0,0,0],r:[1.5,1.5],h:9,top:1,seed:2001+i}),[-4.5,-3+i*1.6,8.6+i%2*.8],'x',1),i%2?'#8a5a34':'#a8743f',0,2001+i,RG)},1.8);
 // lámpara de techo simulada: farolillo de suelo con cadena no hace falta; luz la pone el motor.
})();
