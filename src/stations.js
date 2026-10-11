/* NotScape — ESTACIONES animadas (Fase 3, paso 2). Ver AGENTS.md → "Cómo funcionan las estaciones".
   Sustituye las ramas de `dSb` (game.js) de banco, tienda, fogata, yunque, escritorio, taller y horno por diseños con contorno oscuro #14100a,
   luz arriba-izquierda y una animación propia por estación. Con ?old, SX es null y `dSb` usa el código antiguo.
   CÓMO ANIMA: `dS` (game.js) calcula un fotograma entero `fr` 0..7 (8 fps; con `on` y una acción de estación se SINCRONIZA con la fase del golpe `swPh`,
   que cambia de fotograma a ~1/8 del periodo: golpe en fr 6–7 y 0) y pasa `r={fr,on,near,wave,night}`. Cada combinación se hornea UNA vez con `bk()`
   (clave 's2|id|on|fr|near|wave|noche'); `draw` es PURO: solo depende de `id` y de `r` (nada de t, performance.now ni Math.random: se congelaría).
   Lo que no se puede hornear (el '!' de misión de Ru, partículas de humo/chispas) se dibuja en vivo desde `dS`/el bucle de partículas.
   Coordenadas: (x,y) = suelo, centro de la estación; el lienzo de caché es 96×80 con ancla (48,66). Devuelve `ty` = altura de la etiqueta. */
const SX=GR?(()=>{
 const{mix}=GR.H,OL='#14100a',L=(c,t)=>mix(c,'#ffffff',t==null?.2:t),D=(c,t)=>mix(c,'#000000',t==null?.25:t);
 const o=(x,y,w,h,c)=>{Rc(OL,x-1,y-1,w+2,h+2);Rc(c,x,y,w,h)};
 const gl=(x,y,r,c,a)=>{ctx.save();ctx.globalAlpha=a;ctx.fillStyle=c;ctx.beginPath();ctx.arc(Math.round(x),Math.round(y),r,0,7);ctx.fill();ctx.restore()};
 // sillería: base c con juntas oscuras, hileras desfasadas y un brillo arriba de cada hilera
 const bricks=(x,y,w,h,c,bw,bh)=>{Rc(c,x,y,w,h);const dk=D(c,.3),lt=L(c,.12);for(let j=0,r=0;j<h;j+=bh,r++){Rc(dk,x,y+j,w,1);Rc(lt,x,y+j+1,w,1);for(let i=(r&1)?bw>>1:0;i<w;i+=bw)Rc(dk,x+i,y+j,1,bh)}};
 const flame=(x,y,w,h,c1,c2,c3)=>{Rc(c1,x,y-h+2,w,h-2);Rc(c1,x+1,y-h,w-2,2);if(h>5){Rc(c2,x+1,y-(h*.7|0),w-2,h*.7|0);Rc(c3,x+1,y-(h*.4|0),Math.max(1,w-3),h*.4|0)}};
 const D8=['#ffd070','#ff9a2a','#ff5a1a'];

 function bank(x,y,r){const{fr,near,night}=r,S='#9a9a9a';Sd(x-26,y-1,52,4);
  o(x-24,y-34,48,34,S);bricks(x-24,y-34,48,34,S,8,6);Rc(L(S,.25),x-24,y-34,2,34);Rc(D(S,.25),x+21,y-34,3,34);Rc(D(S,.2),x-24,y-6,48,6);
  // cornisa con dentículos y rótulo dorado con destello que lo recorre
  o(x-28,y-43,56,9,'#b0a090');Rc(L('#b0a090',.3),x-28,y-43,56,1);for(let i=0;i<14;i++)Rc(D('#b0a090',.3),x-26+i*4,y-36,2,2);
  o(x-9,y-42,18,6,'#d8a82a');Rc(L('#d8a82a',.4),x-9,y-42,18,1);Rc('#8a6a1a',x-7,y-39,14,1);for(let i=0;i<4;i++)Rc('#fff3a0',x-6+i*4,y-41,2,1);
  const gx=x-9+fr*2.4|0;Rc('#ffffff',gx,y-42,2,6);Rc(L('#ffe070',.6),gx+2,y-42,1,6);
  // ventanas con barrotes (de noche cálidas, con halo)
  [x-20,x+11].forEach(wx=>{if(night==='#ffd070')gl(wx+4,y-23,13,'#ffd070',.16);o(wx,y-28,9,10,night);Rc(L(night,.4),wx,y-28,9,2);Rc(OL,wx+4,y-28,1,10);Rc(OL,wx,y-24,9,1);Rc(D(S,.3),wx-1,y-17,11,2)});
  // puerta con arco, bandas de hierro y escalón; entreabierta si el jugador está cerca
  o(x-6,y-21,12,21,'#5a3a1a');Rc(OL,x-6,y-21,2,2);Rc(OL,x+4,y-21,2,2);
  if(near){Rc('#1a1008',x-4,y-19,8,19);Rc('#ffd23a',x-2+(fr%3),y-4,2,1);Rc('#c8a020',x-3,y-3,5,3);o(x+3,y-20,3,20,'#6a4a2a')}
  else{for(let i=0;i<3;i++)Rc(D('#5a3a1a',.3),x-2+i*3,y-19,1,19);Rc('#3a3a42',x-5,y-14,10,2);Rc('#3a3a42',x-5,y-7,10,2);Rc('#ffd23a',x+2,y-10,2,2)}
  o(x-9,y-2,18,2,'#b8b4aa');return 52}

 function shop(x,y,r){const{fr,wave}=r;Sd(x-26,y-1,52,4);
  // postes y Ru detrás del mostrador
  o(x-24,y-27,3,27,'#7a5a3a');Rc(L('#7a5a3a',.25),x-24,y-27,1,27);o(x+21,y-27,3,27,'#7a5a3a');Rc(D('#7a5a3a',.2),x+23,y-27,1,27);
  pBody(x,y-5,'#6a3aa8','#ddd',-1,0,0,null,(fr&3)===3?1:0,0);
  if(wave)Rc('#f1c27d',x+6,y-30+((fr&1)?-2:0),2,6);
  // mostrador con frente de tablas y mercancía
  o(x-25,y-11,50,9,'#8a6a3a');Rc(L('#a0805a',.1),x-25,y-11,50,2);for(let i=0;i<7;i++)Rc(D('#8a6a3a',.3),x-22+i*7,y-8,1,6);Rc(D('#8a6a3a',.25),x-25,y-3,50,1);
  [[-20,'#d03030'],[-16,'#e04040'],[-12,'#d03030']].forEach(([dx,c])=>{o(x+dx,y-15,4,4,c);Rc('#fff',x+dx+1,y-14,1,1)});
  o(x+10,y-19,4,8,'#4a90d0');Rc(L('#4a90d0',.5),x+11,y-18,1,5);o(x+16,y-17,4,6,'#3a9a4a');Rc(L('#3a9a4a',.5),x+17,y-16,1,3);o(x-4,y-14,8,3,'#d8b070');Rc(L('#d8b070',.4),x-4,y-14,8,1);
  // toldo a rayas con el borde ondeando
  const T0=y-37;for(let i=0;i<8;i++){const c=i%2?'#f0f0f0':'#c0392b',wv=((fr+i)&3)>>1;Rc(OL,x-25+i*6,T0-1,6,1);Rc(c,x-24+i*6-1,T0,6,10);Rc(L(c,.2),x-24+i*6-1,T0,6,1);Rc(OL,x-24+i*6-1,T0+10+wv,6,1);Rc(c,x-24+i*6,T0+10,5,wv);Rc(D(c,.2),x-24+i*6+4,T0+1,1,9)}
  Rc(OL,x-26,T0,1,10);Rc(OL,x+24,T0,1,10);return 58}

 function fire(x,y,r){const{fr,on}=r;gl(x,y-6,on?36:26,'#ff9a2a',.18);
  // piedras del fondo, troncos, ceniza, llamas y piedras del frente
  const st=(a)=>{const px=x+Math.cos(a)*14,py=y-3+Math.sin(a)*5;Rc(OL,px-3,py-2,6,5);Rc('#8a8a92',px-2,py-1,4,3);Rc(L('#8a8a92',.35),px-2,py-1,2,1);Rc(D('#8a8a92',.3),px+1,py+1,1,1)};
  for(let i=0;i<=4;i++)st(Math.PI+i*.785);
  Rc('#3a3030',x-9,y-4,18,3);o(x-13,y-8,26,4,'#6b4a2a');Rc(L('#6b4a2a',.25),x-13,y-8,26,1);Rc('#c8a070',x-13,y-7,2,2);Rc('#c8a070',x+11,y-7,2,2);o(x-9,y-6,18,3,'#5a3a1a');
  for(let k=0;k<5;k++){const h=(on?15:10)+(((fr*5+k*3)%5)-2)-(k===0||k===4?4:0);flame(x-9+k*4,y-8,4,h,D8[2],D8[1],D8[0])}
  for(let i=0;i<3;i++)Rc('#ffb040',x-7+i*6+((fr+i*3)%4-2),y-24-((fr*3+i*5)%9)-(on?4:0),1,1);
  for(let i=0;i<=4;i++)st(i*.785);
  return 30}

 function anvil(x,y,r){const{fr,on}=r;Sd(x-20,y-1,40,4);
  o(x-9,y-10,18,10,'#7a5a3a');Rc(L('#7a5a3a',.2),x-9,y-10,18,2);Rc(D('#7a5a3a',.3),x-6,y-6,4,1);Rc(D('#7a5a3a',.3),x+1,y-4,5,1);Rc(D('#7a5a3a',.2),x+6,y-9,3,9);
  o(x-9,y-13,18,3,'#4a4a52');o(x-6,y-19,12,6,'#3e3e46');Rc(L('#3e3e46',.2),x-6,y-19,2,6);
  o(x-12,y-24,24,5,'#6a6a74');Rc(L('#6a6a74',.4),x-12,y-24,24,1);o(x-18,y-22,7,3,'#5a5a64');Rc(L('#5a5a64',.3),x-18,y-22,7,1);Rc('#34343c',x+8,y-22,4,3);
  // pieza sobre el yunque: fría y apagada o al rojo vivo (más brillante justo tras el golpe)
  const hot=on?(fr<2||fr>6?'#ffcf60':'#ff8a2a'):'#8a8a92';o(x-6,y-27,12,3,hot);if(on)Rc('#fff2b0',x-4,y-27,8,1);else if(fr===3)Rc('#ffffff',x-3,y-27,2,1);
  if(!on){o(x+4,y-14,5,4,'#8a8a94');Rc('#8b6a3a',x+9,y-13,8,2)} // martillo apoyado en el tocón
  else{const PHI=[.15,.4,.65,.9,1.15,1.35,.95,.45][fr],px=x+15,py=y-22;
   for(let s=2;s<=13;s++)Rc(OL,px-Math.cos(PHI)*s-1,py-Math.sin(PHI)*s-1,4,4);for(let s=2;s<=13;s++)Rc('#a0804a',px-Math.cos(PHI)*s,py-Math.sin(PHI)*s,2,2);
   const hx=px-Math.cos(PHI)*14,hy=py-Math.sin(PHI)*14;o(hx-3,hy-3,7,6,'#8a8a94');Rc(L('#8a8a94',.4),hx-3,hy-3,7,1);
   if(fr===0||fr===7){const n=fr?1:2;for(let i=0;i<4*n;i++)Rc(i%2?'#ffe070':'#ff9a2a',x-6+(i*5)%13,y-31-(i*3)%5,1+(i&1),1)}}
  return 46}

 function bench(x,y,r){const{fr,on}=r;Sd(x-22,y-1,44,4);
  o(x-16,y-10,4,10,'#5a3a1a');o(x+12,y-10,4,10,'#5a3a1a');Rc('#4a2f18',x-12,y-5,24,2);
  o(x-19,y-17,38,7,'#8a6a3a');Rc(L('#8a6a3a',.22),x-19,y-17,38,2);Rc(D('#8a6a3a',.25),x-19,y-11,38,1);Rc(D('#8a6a3a',.18),x-14,y-14,8,1);Rc(D('#8a6a3a',.18),x+2,y-13,10,1);
  o(x-18,y-23,6,6,'#555560');Rc(L('#555560',.35),x-18,y-23,6,1);Rc('#3a3a42',x-21,y-20,3,2); // torno de banco
  o(x-8,y-21,22,4,'#c8a870');Rc(L('#c8a870',.3),x-8,y-21,22,1);Rc(D('#c8a870',.3),x+3,y-21,1,4);
  if(on){const sx=[-3,-1,1,3,3,1,-1,-3][fr];o(x-2+sx,y-26,16,4,'#b8b8c0');for(let i=0;i<8;i++)Rc('#6a6a72',x-2+sx+i*2,y-22,1,1);o(x+14+sx,y-30,5,9,'#6b4a2a');Rc('#e0c890',x+2+(fr*3)%7,y-18+(fr&1),2,1);Rc('#e0c890',x-4+(fr*5)%11,y-3+(fr&1)*0,2,1)}
  else{o(x-2,y-23,16,2,'#b8b8c0');o(x+14,y-25,5,6,'#6b4a2a');o(x+8,y-25,2,2,'#8a8a94')}
  Rc('#e0c890',x-11,y-2,3,1);Rc('#e0c890',x+6,y-1,4,1);Rc('#c8a870',x+11,y-3,2,1);return 34}

 function altar(x,y,r){const{fr,on}=r;Sd(x-22,y-1,44,4);
  o(x-16,y-9,4,9,'#5a3a1a');o(x+12,y-9,4,9,'#5a3a1a');o(x-19,y-16,38,7,'#8a6a3a');Rc(L('#8a6a3a',.22),x-19,y-16,38,2);Rc(D('#8a6a3a',.25),x-19,y-10,38,1);
  // libro abierto; con `on` van apareciendo líneas escritas y runas orbitan encima
  o(x-12,y-21,10,5,'#f0e6c8');o(x-1,y-21,10,5,'#e8dcb8');Rc('#7a3a2a',x-2,y-21,2,5);
  const nl=on?1+(fr>>1):2;for(let i=0;i<3;i++){if(i<nl){Rc('#8a7a5a',x-10,y-20+i*2-(i?0:0),6,1);Rc('#8a7a5a',x+1,y-20+i*2,6,1)}}
  o(x+11,y-21,5,5,'#2a2a5a');Rc('#4a4a9a',x+12,y-20,1,1);
  const qx=on?[0,1,2,1,0,-1,-2,-1][fr]:0;for(let s=0;s<8;s++)Rc(s>4?'#f0f0f0':'#d8d8d8',x+13+(s>>1)+qx-(on?0:0),y-22-s,1,1);Rc('#ffffff',x+14+qx,y-29,2,2);if(on)Rc('#2a2a5a',x-3+qx*3,y-18,2,1);
  // vela con llama de 4 fotogramas
  o(x-17,y-25,4,9,'#e8e0c0');Rc(D('#e8e0c0',.25),x-14,y-25,1,9);const fh=[5,6,5,4][fr&3],fx=[0,1,0,-1][fr&3];gl(x-15,y-29,11,'#ffcc40',.14);Rc('#ff9a2a',x-16+fx,y-25-fh,2,fh);Rc('#ffe070',x-16+fx,y-25-fh+2,2,fh-2);Rc('#fff',x-15+fx,y-27,1,2);
  if(on)for(let k=0;k<3;k++){const a=(fr+k*2.67)*Math.PI/4;Rc(k?'#c8a0ff':'#ffe8a0',x-2+Math.cos(a)*11,y-31+Math.sin(a)*4,2,2)}
  return 40}

 function furnace(x,y,r){const{fr,on}=r,S='#6e6e76';Sd(x-22,y-1,44,4);
  o(x+6,y-47,10,20,'#7a7a82');bricks(x+6,y-47,10,20,'#7a7a82',5,4);Rc(D('#7a7a82',.25),x+14,y-47,2,20);o(x+4,y-50,14,4,'#8a8a92');Rc(L('#8a8a92',.35),x+4,y-50,14,1);
  o(x-18,y-30,36,30,S);bricks(x-18,y-30,36,30,S,9,5);Rc(L(S,.25),x-18,y-30,3,30);Rc(D(S,.25),x+15,y-30,3,30);
  o(x-20,y-35,40,6,'#8a8a92');Rc(L('#8a8a92',.35),x-20,y-35,40,1);o(x-20,y-4,40,4,'#5a5a62');
  o(x-9,y-22,18,16,'#14100a');Rc('#2a1a14',x-8,y-21,16,15);Rc('#4a4a52',x-10,y-24,20,2);
  if(on){Rc('#7a2a10',x-8,y-21,16,15);for(let k=0;k<4;k++){const h=6+((fr*5+k*3)%6);flame(x-8+k*4,y-7,4,Math.min(h,13),D8[2],D8[1],D8[0])}gl(x,y-12,28,'#ff9a2a',.14)}
  else for(let k=0;k<5;k++)Rc(((fr+k)%3===0)?'#d8501a':'#6a2a14',x-7+k*3,y-8,2,1+(((fr+k)%3===0)?1:0)*0);
  // montón de carbón
  o(x-27,y-7,9,7,'#2a2a30');Rc('#4a4a52',x-25,y-6,2,1);Rc('#4a4a52',x-22,y-3,2,1);if(on||fr%3===0)Rc('#ff7a2a',x-24+(fr%3)*2,y-4,1,1);
  return 56}

 const F={bank,shop,fire,anvil,altar,bench,furnace};
 return{draw(id,x,y,r){return(F[id]||furnace)(x,y,r)}}
})():null;
