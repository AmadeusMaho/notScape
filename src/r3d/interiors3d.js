// NotScape · R3D · Lote R3D-F15b (20 oct 2026) · INTERIORES EN 3D (Fase 15b): las salas de las instalaciones (herrería, taller, banco, tienda, taberna, templo) en malla, por CIVILIZACIÓN.
// ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// QUÉ HACE
//   · `Rooms3D.enter(INT)` construye la sala a partir de los MISMOS DATOS de interiors.js (`INT.R.it` muebles, `INT.R.st` estaciones, `INT.R.lt` luces, `INT.so` paleta/estilo de la cultura) y la coloca en el
//     mundo 3D en IRC (6000,6000), donde interiors.js ya sitúa al héroe y la colisión (`intBlk`). Se ve con la cámara de siempre (isométrica giratoria) y el héroe real (HeroSel) con oclusión por mobiliario.
//   · CARCASA por estilo de cultura (`so.style`): `enlucido` (Pradera/Cumbres: yeso con entramado de vigas) · `troncos` (Bosque) · `cana` (Pantano) · `shoji` (Oriental: papel y tatami) · `basalto` (Volcán).
//     Dos paredes de fondo (derecha z=−D/2 con la PUERTA, izquierda x=−W/2), suelo, ventanas con luz cálida, rodapié. Las dos de delante no existen (corte de maqueta, como el 2D).
//   · LUZ CÁLIDA (pedido del dueño: «que se vea agradable entrar»): hemisférica ámbar + «sol» dorado bajo para dar forma (cel shading), luces de `R.lt` con parpadeo (4 PointLights FIJAS creadas al arrancar:
//     añadir luces en caliente recompila todos los materiales), hogar y farolillos emisivos, charcos de luz de las ventanas sobre el suelo y motas de polvo doradas. El grado (óleo, bloom, viñeta) usa la fila `INT_TP`.
//   · Mientras hay sala se ocultan terreno, props, actores, agua y partículas del exterior (restaurados al salir) y no se actualizan (ahorro).
// DATOS / AÑADIR: un mueble nuevo = una función en `ITEM` (modelo local: y arriba, frente +z, origen = pie) y su colisión `FPT` (ya está en interiors.js); una cultura nueva = una fila en `PALS` de interiors.js
//   (+ un estilo en `wallFace`/`floorOf` si no es de los cinco). Las estaciones usan los modelos de `propsdark_estaciones3d.js` (`propGeo`) con `arch:k`.
// REGLA DE SENTIDO: 1 tile = 1 unidad ≈ 1,75 m. Mesa .6 de alto (≈1 m), silla asiento .3, puerta 1,0 de alto×.5 (como las de las casas: llega a la cintura×1,5), pared 2,6 (≈4,5 m: techo alto de maqueta para ver dentro).
import * as THREE from 'three';
import {B,dirty,col,mul,mix} from './propsdark3d.js';
import {toon,hull,inkFor,G} from './materials3d.js';
import {propGeo} from './props3d.js';
import {buildCave,WALL_H} from './cave3d.js';   // CUEVAS REALES (27 oct 2026)
import {makeActor,ANIM} from './actors3d.js';   // cajeros y tenderos 3D (`cajero@k`, `tendero@k`)

const U=2/32,WH=2.6,PI=Math.PI,hash=(a,b,c)=>{const h=Math.sin(a*127.1+b*311.7+c*74.7)*43758.5453;return h-Math.floor(h)};
const warm=(h,s=.8,v=.96)=>dirty(h,s,v,.03);
const radTex=(r,g,b,a=1)=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),gr=x.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,`rgba(${r},${g},${b},${a})`);gr.addColorStop(.5,`rgba(${r},${g},${b},${a*.4})`);gr.addColorStop(1,`rgba(${r},${g},${b},0)`);x.fillStyle=gr;x.fillRect(0,0,64,64);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t};   // sucio MUY leve: aquí manda la calidez

// ── paleta de un objeto a partir de sus opciones `o` (los datos de interiors.js) ──
const PL=o=>({W:warm(o.wood||'#9a6a3a'),WL:warm(o.woodL||'#b9803f'),WD:warm(o.woodD||'#5a3e28'),CL:warm(o.cloth||'#c0392b',.9),CL2:warm(o.cloth2||'#f7f1e1',.7,1),ST:warm(o.stone||'#b4b0a4',.6,.85),PL:warm(o.plant||'#6fb048',.8,.9),FL:warm(o.flower||'#ff9ac0',.9,1),PT:warm(o.pot||'#c9885a'),FE:col('#3a3633'),FI:col('#ffb04a')});
const leg=(b,x,z,h,t,c)=>b.box(x,0,z,t,h,t,c);

// ── MUEBLES: b = B, o = opciones del dato, p = paleta, ex = extra del dato. Frente +z. ──
const ITEM={
 mesa(b,o,p,it,room){b.box(0,.5,0,1.04,.07,.64,p.WL,{v:.05});for(const[x,z]of[[-.46,-.26],[.46,-.26],[-.46,.26],[.46,.26]])leg(b,x,z,.5,.07,p.WD);b.box(0,.43,0,.92,.05,.1,p.WD);b.box(0,.44,0,.1,.04,.64,p.WD);
  if(room==='taberna'){const mg=col('#d8c8a8');b.cyl(-.3,.57,.08,.05,.045,.1,7,mg);b.cyl(.28,.57,-.1,.05,.045,.1,7,mg);b.box(-.3,.62,.13,.03,.05,.02,mg);b.cyl(.04,.57,.14,.13,.13,.015,9,col('#efe6d4'));b.cyl(.04,.585,.14,.07,.08,.03,8,col('#c8884a'));b.cyl(.34,.57,.14,.025,.025,.1,6,col('#f0e4c0'));b.box(.34,.67,.14,.028,.05,.028,col('#ffd060'),{em:2})}
  else if(room==='tienda'){b.cyl(-.25,.57,0,.07,.06,.08,7,col('#8a6a44'));b.box(.1,.57,.1,.16,.05,.12,p.CL2);b.box(.1,.62,.1,.12,.04,.1,p.CL);b.box(.32,.57,-.1,.14,.1,.14,col('#a87a4a'))}
  else if(room==='templo'){b.cyl(0,.57,0,.04,.04,.16,6,col('#f0e4c0'));b.box(0,.73,0,.03,.05,.03,col('#ffd060'),{em:2})}},
 silla(b,o,p){b.box(0,.27,0,.34,.05,.34,p.W);b.box(0,.32,.02,.28,.03,.28,p.CL,{t:.9});for(const[x,z]of[[-.14,-.14],[.14,-.14],[-.14,.14],[.14,.14]])leg(b,x,z,.27,.045,p.WD);b.box(-.14,.32,-.15,.04,.5,.04,p.WD);b.box(.14,.32,-.15,.04,.5,.04,p.WD);for(const y of[.42,.52,.62])b.box(0,y,-.15,.28,.05,.03,p.W);b.box(0,.7,-.15,.34,.04,.05,p.WL);b.box(0,.1,0,.3,.03,.03,p.WD)},
 taburete(b,o,p){b.cyl(0,.26,0,.17,.17,.05,8,p.W);for(let i=0;i<3;i++){const a=i*2.09+.5;b.beam([Math.cos(a)*.1,0,Math.sin(a)*.1],[Math.cos(a)*.15,.27,Math.sin(a)*.15],.045,p.WD)}},
 cama(b,o,p){b.box(0,.12,0,.92,.16,1.74,p.WD);b.box(0,.28,.04,.84,.14,1.6,p.CL2);b.box(0,.34,.3,.8,.08,1.0,p.CL,{v:.04});b.box(0,.34,-.62,.5,.1,.26,p.CL2);b.box(0,.12,-.9,.96,.62,.07,p.W);b.box(0,.12,.9,.96,.32,.07,p.W)},
 hogar(b,o,p){const st=p.ST,sd=mul(st,.8);b.box(0,0,0,1.7,.14,.62,sd);b.box(-.62,.14,-.06,.4,1.15,.5,st,{v:.08});b.box(.62,.14,-.06,.4,1.15,.5,st,{v:.08});b.box(0,1.2,-.06,1.7,.22,.54,sd);b.box(0,1.4,-.14,1.2,1.2,.34,st,{t:.8,v:.06});
  b.box(0,.14,-.17,.84,.78,.2,col('#1a0e08'));b.box(-.2,.14,-.02,.4,.07,.07,col('#4a2a14'));b.box(.16,.14,.02,.42,.07,.07,col('#3a2010'));b.box(0,.2,-.1,.5,.06,.06,col('#4a2a14'));
  for(let i=0;i<3;i++){const x=(i-1)*.18;b.box(x,.2,-.08,.14,.07+(i===1?.12:0),.12,i===1?col('#ffd060'):col('#ff8a2a'),{em:2,t:.4})};
  b.beam([-.34,.9,-.16],[.34,.9,-.16],.045,p.FE);b.beam([0,.9,-.16],[0,.66,-.16],.02,p.FE);b.cyl(0,.4,-.16,.2,.15,.2,9,col('#2a2826'));b.cyl(0,.6,-.16,.19,.19,.02,9,col('#5a3a1e'));   // caldero
  for(let i=0;i<4;i++)b.beam([.72+i*.02,.15,.16-i*.12],[.76+i*.02,.15,.28-i*.12],.1,warm('#6a4a2a'));   // leños apilados a un lado
  b.beam([-.78,.14,.2],[-.78,.8,.2],.03,p.FE);b.beam([-.78,.8,.2],[-.66,.9,.2],.025,p.FE);   // atizador
  b.cyl(-.5,1.42,.1,.04,.04,.14,6,col('#f0e4c0'));b.box(-.5,1.56,.1,.028,.05,.028,col('#ffd060'),{em:2});b.cyl(.5,1.42,.1,.04,.04,.1,6,col('#f0e4c0'));b.box(.5,1.52,.1,.028,.05,.028,col('#ffd060'),{em:2})},
 alacena(b,o,p){b.box(0,0,0,.74,1.34,.42,p.WD);b.box(-.18,.1,.22,.32,1.1,.025,p.W);b.box(.18,.1,.22,.32,1.1,.025,p.W);b.box(0,1.34,0,.82,.07,.5,p.WL);b.box(.08,.65,.245,.03,.1,.02,p.FE)},
 estante(b,o,p,it,room){b.box(0,.78,0,1.1,.05,.26,p.WL);b.box(0,1.2,0,1.1,.05,.26,p.WL);b.box(-.5,.7,0,.05,.13,.2,p.WD);b.box(.5,.7,0,.05,.13,.2,p.WD);b.box(-.5,1.12,0,.05,.1,.2,p.WD);b.box(.5,1.12,0,.05,.1,.2,p.WD);b.box(0,1.62,0,1.1,.05,.26,p.WL);
  const jar=[col('#c8a060'),col('#8fa86a'),col('#b8604a'),col('#d8c898')],pot=[col('#d0443a'),col('#4a7ad0'),col('#6ad08a'),col('#b06ad8')];
  if(room==='tienda'){for(let i=0;i<4;i++){b.cyl(-.38+i*.2,.83,0,.055,.05,.12,7,pot[i]);b.cyl(-.38+i*.2,.95,0,.02,.02,.05,5,col('#a88a5a'))}for(let i=0;i<3;i++){b.box(-.3+i*.3,1.25,0,.22,.13,.16,[p.CL,p.CL2,p.WD][i]);b.box(-.3+i*.3,1.38,0,.2,.1,.15,[p.CL2,p.CL,p.W][i])}for(let i=0;i<4;i++)b.cyl(-.4+i*.27,1.67,0,.08,.08,.1,7,[col('#d8a84a'),col('#c8884a'),col('#e8c870'),col('#b8784a')][i])}
  else if(room==='taberna'){for(let i=0;i<4;i++)b.cyl(-.38+i*.2,.83,0,.06,.055,.15+(i%2)*.06,7,[col('#4a6a3a'),col('#8a3a2a'),col('#c8a060'),col('#3a5a7a')][i]);for(let i=0;i<4;i++)b.cyl(-.4+i*.26,1.25,0,.05,.045,.1,7,col('#d8c8a8'));b.box(.1,1.67,0,.9,.12,.14,col('#8a5a2a'),{t:.9})}
  else if(room==='templo'||room==='banco'){for(let i=0;i<7;i++)b.box(-.45+i*.14,1.25,0,.1,.22+(i%3)*.05,.17,[p.CL,p.W,p.CL2,p.WD,p.PL,p.CL,p.WL][i]);for(let i=0;i<3;i++){b.cyl(-.3+i*.3,.83,0,.03,.03,.1,6,col('#f0e4c0'));b.box(-.3+i*.3,.93,0,.025,.05,.025,col('#ffd060'),{em:2})}}
  else{for(let i=0;i<4;i++){b.cyl(-.38+i*.2,.83,0,.06,.055,.15+(i%2)*.04,7,jar[i])}for(let i=0;i<5;i++)b.box(-.4+i*.1,1.25,0,.07,.2+(i%3)*.04,.17,[p.CL,p.W,p.CL2,p.WD,p.PL][i])}},
 barra(b,o,p){const L=(o.w||62)*U;b.box(0,0,0,L,.62,.7,p.WD);b.box(0,.62,.02,L+.08,.07,.82,p.WL,{v:.04});b.box(0,.04,.38,L,.05,.07,p.FE);
  for(let i=0;i<4;i++){const x=-L/2+.5+i*(L-1)/3;b.cyl(x,.69,.1,.05,.045,.11,7,col('#d8c8a8'));b.cyl(x+.14,.69,.18,.04,.04,.08,6,col('#c8a050'))}
  b.cyl(L/2-.4,.69,-.1,.06,.06,.2,7,p.FE);b.box(L/2-.4,.88,-.1,.04,.12,.04,p.FE)},
 barrilTap(b,o,p){b.cyl(0,0,0,.32,.32,.7,10,p.W,{bulge:.05,seg:3});for(const y of[.1,.5])b.cyl(0,y,0,.34,.34,.05,10,p.FE);b.box(0,.38,.31,.05,.05,.12,p.FI);b.cyl(0,.68,0,.3,.3,.04,10,p.WL)},
 mesaTrabajo(b,o,p){b.box(0,.52,0,1.06,.08,.62,p.W);for(const[x,z]of[[-.48,-.25],[.48,-.25],[-.48,.25],[.48,.25]])leg(b,x,z,.52,.08,p.WD);b.box(0,.2,0,.9,.04,.5,p.WD);b.box(.34,.6,.08,.16,.07,.3,p.FE);b.box(-.28,.6,0,.34,.03,.06,p.FE);b.box(-.3,.6,.12,.05,.1,.05,p.WD)},
 mesaEscribir(b,o,p){b.box(0,.5,0,1.0,.07,.62,p.WL);for(const[x,z]of[[-.44,-.25],[.44,-.25],[-.44,.25],[.44,.25]])leg(b,x,z,.5,.07,p.WD);b.box(0,.58,.1,.5,.04,.36,mul(p.CL2,.7),{t:.97});b.cyl(.34,.58,-.12,.04,.04,.1,6,col('#2a2a3a'));b.cyl(-.3,.58,-.08,.03,.03,.14,6,col('#efe2bc'));b.box(-.3,.72,-.08,.025,.045,.025,col('#ffd060'),{em:2});b.box(.1,.6,.0,.3,.015,.2,col('#bfb08a'));b.box(.34,.58,.1,.1,.04,.14,p.CL)},
 rackArmas(b,o,p){b.box(0,.4,0,1.1,1.0,.07,p.WD);b.box(0,1.28,.02,1.18,.07,.12,p.W);b.box(0,.62,.05,1.04,.05,.06,p.W);for(let i=0;i<3;i++){const x=-.36+i*.36;b.beam([x,.45,.09],[x,1.15,.09],.05,col('#aeb4bc'));b.box(x,.62,.1,.2,.05,.05,p.WD)}b.box(.0,.4,.07,1.0,.03,.06,p.FE)},
 herramientas(b,o,p){b.box(0,.55,0,1.0,.8,.06,p.WD);b.box(-.3,.9,.05,.05,.4,.05,p.W);b.box(-.3,1.12,.06,.18,.1,.06,p.FE);b.box(0,.85,.05,.04,.5,.04,p.W);b.box(0,.62,.06,.22,.06,.05,p.FE);b.beam([.3,.7,.06],[.3,1.15,.06],.045,p.FE);b.beam([.2,1.1,.06],[.4,1.1,.06],.04,p.FE)},
 plantaGrande(b,o,p){b.cyl(0,0,0,.24,.2,.34,9,p.PT);b.cyl(0,.32,0,.25,.25,.04,9,mul(p.PT,.8));for(let i=0;i<7;i++){const a=i*.9,l=.45+hash(i,2,3)*.3;b.beam([0,.34,0],[Math.cos(a)*.34,.34+l,Math.sin(a)*.34],.07,mul(p.PL,.85+hash(i,1,5)*.3))}b.cyl(0,.5,0,.1,.02,.5,6,mul(p.PL,.8))},
 maceta(b,o,p){if(o.kind==='fuego'){b.cyl(0,0,0,.2,.14,.2,8,col('#3a3034'));b.box(0,.2,0,.18,.15,.18,col('#ff8a2a'),{em:2,t:.3});return}b.cyl(0,0,0,.14,.1,.18,8,p.PT);for(let i=0;i<4;i++){const a=i*1.6;b.beam([0,.18,0],[Math.cos(a)*.1,.34+i%2*.08,Math.sin(a)*.1],.045,p.PL)}b.box(.04,.36,0,.08,.08,.08,p.FL)},
 // OBJETOS SOBRE LAS MESAS (28 oct 2026): los PNJ de interior trabajan SOBRE algo visible. Alturas: tablero de `mesa` .57, de `mesaBaja` .31, de `barra` .69.
 vajilla(b,o,p){const y=.57;for(const[x,z]of[[.3,.02],[-.3,.04]]){b.cyl(x,y,z,.11,.09,.018,9,warm('#e8e0cc',.7,1),{nb:1});b.cyl(x,y+.018,z,.075,.075,.012,9,warm('#9a5a2a',.8,1),{nb:1})}b.cyl(0,y,.17,.045,.04,.1,8,warm('#8a6a3a',.8,.95),{nb:1});b.cyl(0,y+.1,.17,.04,.04,.012,8,warm('#f0e0a0',.8,1),{nb:1});b.box(-.05,y,-.17,.18,.05,.1,warm('#c8a060',.8,1),{nb:1})},
 vajillaBaja(b,o,p){const y=.31;b.cyl(.15,y,.03,.09,.07,.02,8,warm('#e8e0cc',.7,1),{nb:1});b.cyl(-.15,y,-.04,.05,.045,.07,8,warm('#7a5a3a',.8,.95),{nb:1})},
 hierbasMesa(b,o,p){const y=.57;b.cyl(-.3,y,.05,.09,.06,.08,9,col('#8a867c'),{nb:1});b.cyl(-.3,y+.08,.05,.075,.075,.01,9,warm('#5a8a4a',.8,1),{nb:1});['#5a8a4a','#7a5aa0','#c8a838','#4a7aa8'].forEach((c,i)=>b.box(.02+i*.1,y,-.14+(i%2)*.08,.08,.025,.2,warm(c,.7,1),{nb:1,my:i*.3}));[['#5ac864',.3],['#e0584a',.38],['#5a9ae0',.46]].forEach(([c,x],i)=>{b.cyl(x,y,.12,.024,.024,.1,6,col(c),{em:1,nb:1});b.cyl(x,y+.1,.12,.012,.012,.03,5,col('#6a4a2a'),{nb:1})})},
 jarras(b,o,p){const y=.69,L=(o.w||62)*U;for(let i=0;i<4;i++){const x=-L*.36+i*L*.24;b.cyl(x,y,.06,.045,.04,.1,8,warm('#8a6a3a',.8,.95),{nb:1});b.cyl(x,y+.1,.06,.04,.04,.012,8,warm('#f0e0a0',.8,1),{nb:1})}},
 mesaBaja(b,o,p){b.box(0,.26,0,.82,.05,.54,p.WL);for(const[x,z]of[[-.34,-.2],[.34,-.2],[-.34,.2],[.34,.2]])leg(b,x,z,.26,.06,p.WD);b.cyl(.1,.31,0,.07,.06,.09,7,col('#e8e0d0'))},
 biombo(b,o,p){for(let i=0;i<3;i++){const a=(i%2?.35:-.35),x=(i-1)*.46;b.box(x,0,i%2?.07:-.07,.46,1.5,.05,p.WD,{my:a});b.box(x,.1,i%2?.09:-.05,.4,1.3,.02,col('#f4e6c0'),{em:1,my:a})}},
 farolPapel(b,o,p){b.cyl(0,0,0,.08,.08,.05,6,p.WD);b.beam([0,.05,0],[0,1.0,0],.045,p.WD);b.box(0,1.0,0,.3,.38,.3,col('#ffc870'),{em:1,t:.92});b.box(0,1.38,0,.36,.05,.36,p.WD);b.box(0,.96,0,.34,.05,.34,p.WD)},
 arcon(b,o,p){b.box(0,0,0,.72,.34,.44,p.W,{v:.05});b.box(0,.34,0,.7,.1,.42,p.WL,{t:.82});for(const x of[-.22,.22])b.box(x,0,0,.05,.44,.46,p.FE);b.box(0,.22,.23,.07,.1,.03,p.FI)},
 hamaca(b,o,p){b.beam([-.7,0,0],[-.7,1.0,0],.07,p.WD);b.beam([.7,0,0],[.7,1.0,0],.07,p.WD);b.beam([-.7,.95,0],[0,.5,0],.04,p.WL);b.beam([.7,.95,0],[0,.5,0],.04,p.WL);b.box(-.35,.55,0,.8,.06,.6,p.CL,{my:0,t:.96});b.box(.35,.55,0,.8,.06,.6,p.CL,{t:.96});b.box(0,.52,0,.9,.06,.58,p.CL2)},
 barrilAgua(b,o,p){b.cyl(0,0,0,.26,.26,.58,10,p.W,{bulge:.04,seg:3});for(const y of[.08,.42])b.cyl(0,y,0,.28,.28,.04,10,p.FE);b.cyl(0,.56,0,.22,.22,.02,10,col('#6aa8c0'))},
 fuelle(b,o,p){b.box(0,0,0,.5,.1,.34,p.WD);b.box(0,.1,0,.42,.3,.28,p.CL2,{t:.7});b.box(0,.38,0,.4,.06,.26,p.W);b.beam([.2,.2,0],[.46,.12,0],.08,p.FE);b.beam([-.18,.44,0],[-.34,.7,0],.05,p.W)},
 cestaLena(b,o,p){b.cyl(0,0,0,.2,.24,.28,9,warm('#b88a4a'));for(let i=0;i<5;i++){b.beam([-.13+i*.065,.26,-.05],[-.1+i*.05,.38,.05],.09,warm('#6a4a2a'))}},
 cojin(b,o,p){b.box(0,0,0,.4,.08,.4,o.col?warm(o.col,.9,.85):mul(p.CL,.9),{t:.9,v:.05});b.box(0,.08,0,.28,.02,.28,mul(p.CL2,.75),{em:0})},
 alfombra(b,o,p){const w=(o.w||50)*U,d=(o.d||30)*U,c1=o.col?warm(o.col,.9,.9):p.CL,c2=o.col2?warm(o.col2,.7,1):p.CL2;b.box(0,0,0,w,.015,d,c1,{nb:1});b.box(0,.015,0,w*.84,.006,d*.82,mul(c2,.62),{nb:1});b.box(0,.021,0,w*.66,.006,d*.62,c1,{nb:1})},
 cuadro(b,o,p){b.box(0,1.05,0,.7,.52,.04,p.WD);b.box(0,1.09,.03,.6,.43,.02,col('#7aa8c8'));b.box(0,1.09,.04,.6,.18,.02,col('#8aa86a'));b.box(.12,1.2,.05,.14,.14,.01,col('#f0d890'))},
 colgante(b,o,p){b.beam([-.34,1.82,0],[.34,1.82,0],.05,p.WD);b.box(0,1.0,.01,.56,.82,.03,p.CL);b.box(0,1.0,.04,.1,.82,.015,p.CL2);for(let i=0;i<3;i++)b.box(-.2+i*.2,.92,.04,.03,.1,.02,p.CL2)},
 escudoPared(b,o,p){b.cyl(0,1.12,.02,.3,.3,.06,10,p.CL,{seg:1});b.cyl(0,1.12,.07,.12,.12,.05,8,p.FE);b.cyl(0,1.12,.06,.3,.3,.02,10,p.FE,{open:1})},
 pielPared(b,o,p){const c=warm('#8a6a48',.8,.9);b.box(0,.78,0,.62,.9,.03,c,{t:.9,v:.1});b.box(-.36,1.1,0,.2,.22,.03,c);b.box(.36,1.1,0,.2,.22,.03,c);b.box(-.3,.4,0,.2,.28,.03,c);b.box(.3,.4,0,.2,.28,.03,c);b.box(0,.22,0,.1,.3,.03,mul(c,.9))},
 boveda(b,o,p){b.box(0,0,0,.2,1.7,1.5,mul(p.ST,.85));b.cyl(0,.85,0,.6,.6,.12,12,col('#5a5f66'));b.cyl(0,.85,0,.14,.14,.2,8,col('#a8a4a0'));for(let i=0;i<4;i++){const a=i*PI/2;b.beam([Math.cos(a)*.14,.85,0.1],[Math.cos(a)*.46,.85+Math.sin(a)*.46,.1],.05,col('#8a8a90'))}}
};

Object.assign(ITEM,{
 sconce(b,o,p){b.box(0,1.38,0,.12,.14,.04,p.FE);b.box(0,1.46,.06,.05,.05,.1,p.FE);b.cyl(0,1.5,.1,.032,.032,.1,6,col('#f0e4c0'));b.box(0,1.6,.1,.026,.05,.026,col('#ffd060'),{em:2})},
 candelabro(b,o,p){b.cyl(0,0,0,.12,.09,.05,8,p.FE);b.beam([0,.04,0],[0,.9,0],.045,p.FE);b.cyl(0,.88,0,.16,.16,.025,8,p.FE);for(let i=0;i<3;i++){const a=i*2.09,x=Math.cos(a)*.1,z=Math.sin(a)*.1;b.cyl(x,.9,z,.028,.028,.14,6,col('#f0e4c0'));b.box(x,1.04,z,.026,.05,.026,col('#ffd060'),{em:2})}},
 cajonera(b,o,p){const w=o.w||3,h=1.7;b.box(0,0,0,w,h,.34,p.WD);for(let i=0;i<Math.round(w/.5);i++)for(let j=0;j<4;j++){const x=-w/2+.27+i*.5,y=.1+j*.4;b.box(x,y,.18,.42,.34,.03,mul(p.WL,.9+((i+j)%3)*.06));b.cyl(x,y+.14,.22,.025,.025,.04,6,col('#c8a04a'));b.box(x,y+.2,.2,.18,.06,.02,col('#e8d8a8'))}b.box(0,h,0,w+.08,.06,.4,p.WL)},
 cajas(b,o,p){b.box(-.1,0,0,.6,.44,.5,p.W,{v:.05});b.box(-.1,0,.26,.6,.44,.02,p.WD);b.box(.18,.44,.05,.5,.4,.46,p.WL);b.box(-.3,.44,.02,.36,.3,.34,p.W);for(const[x,y]of[[-.1,.2],[.18,.62]])b.box(x,y,.27,.48,.05,.02,p.FE)},
 sacos(b,o,p){for(const[x,z,y,r]of[[0,0,0,.26],[.36,.05,0,.24],[.16,-.1,.34,.22]]){b.cyl(x,y,z,r,r*.8,.4,8,warm('#c8aa78',.7,.95),{bulge:.05,seg:2});b.cyl(x,y+.38,z,r*.4,r*.5,.06,6,warm('#8a6a3a'))}},
 carbonera(b,o,p){b.box(0,0,0,.9,.4,.6,p.WD);for(let i=0;i<14;i++){const x=(hash(i,1,2)-.5)*.7,z=(hash(i,2,3)-.5)*.4;b.box(x,.38,z,.14,.1,.12,col('#262424'),{my:i})}},
});
// ── CARCASA por estilo ──
function floorOf(b,so,W,D,id){   // SUELO (28 oct 2026: reescrito). TECHO DEL SUELO = y 0 (antes .02: hundía las alfombras y los pies de los muebles, que empiezan en y 0). Siempre hay una LOSA DE FONDO (W+.7 × D+.7) bajo todo el dibujo: ningún hueco puede dejar ver el vacío (lo comprueba tools/r3d/interior_check.py).
 const f=warm(so.floor||'#b98a52',.85,.95),st=warm(so.stone||'#a8a49a',.8,.95),S=hash,H=.06,Y=-H,
  tile=(x,z,w,d,c,o)=>b.box(x,Y,z,w,H,d,c,Object.assign({nb:1},o||{})),dec=(x,z,w,d,c,my)=>b.box(x,0,z,w,.003,d,c,{nb:1,my:my||0});
 b.box(0,-.12,0,W+.7,.06,D+.7,['taller','herreria','banco','templo'].includes(id)?mul(st,.5):mul(f,.42),{nb:1});
 if(so.style==='shoji'){   // tatami: la orientación de las esteras cambia con la sala
  const v=(id||'').length%2,nx=v?3:5,nz=v?5:3;for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const x=-W/2+(i+.5)*W/nx,z=-D/2+(j+.5)*D/nz;tile(x,z,W/nx-.03,D/nz-.03,warm((i+j)&1?'#d6d29a':'#cfca90',.7,1));dec(x,z,W/nx-.03,.05,col('#3a2a1a'))}return}
 if(so.style==='basalto'){   // losas de basalto con rendijas de lava; tamaño distinto por sala
  const nx=4+((id||'').length%3),nz=3+((id||'').length%2);b.box(0,-.11,0,W,.02,D,col('#ff6a1a'),{em:2,nb:1});for(let i=0;i<nx;i++)for(let j=0;j<nz;j++)tile(-W/2+(i+.5)*W/nx,-D/2+(j+.5)*D/nz,W/nx-.03,D/nz-.03,mul(f,.8+S(i,j,3)*.4),{jit:.012});return}
 if(id==='taberna'){   // tablones anchos con juntas a tope escalonadas, camino gastado, paja suelta y manchas de cerveza
  const n=Math.ceil(D/.34);for(let j=0;j<n;j++){const z=-D/2+(j+.5)*D/n;let x0=-W/2,i=0;while(x0<W/2-.01){const len=Math.min(W/2-x0,.9+S(j,i,7)*1.3),len2=W/2-(x0+len)<.4?W/2-x0:len;tile(x0+len2/2,z,len2-.018,D/n-.02,mul(f,.74+S(j,i,3)*.34),{v:.04});x0+=len2;i++}}
  dec(.5,.6,W*.62,.7,mul(f,1.22));for(let i=0;i<9;i++)dec((S(i,1,2)-.5)*W*.8,(S(i,2,3)-.5)*D*.8,.28+S(i,3,4)*.3,.1+S(i,4,5)*.08,warm('#c8b070',.8,1),S(i,5,6)*3);for(let i=0;i<4;i++)dec((S(i,8,1)-.5)*W*.7,(S(i,9,2)-.5)*D*.7,.34,.26,mul(f,.5),S(i,2,2)*3);return}
 if(id==='taller'){   // losas de piedra irregulares con virutas de madera
  const nx=5,nz=Math.ceil(D/.95);for(let j=0;j<nz;j++)for(let i=0;i<nx;i++)tile(-W/2+(i+.5)*W/nx,-D/2+(j+.5)*D/nz,W/nx-.025,D/nz-.025,mul(st,.8+S(i,j,5)*.36),{jit:.012});
  for(let i=0;i<12;i++)dec((S(i,3,2)-.5)*W*.8,(S(i,4,3)-.5)*D*.8,.16+S(i,5,4)*.14,.05,warm('#d8bd88',.8,1),S(i,6,7)*3);return}
 if(id==='botica'){   // parquet de cestería (tablones alternos en cruz), hojas y pétalos caídos
  const c=.6,nx=Math.ceil(W/c),nz=Math.ceil(D/c);for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const x=-W/2+(i+.5)*W/nx,z=-D/2+(j+.5)*D/nz,w=W/nx,d=D/nz,fl=(i+j)&1;for(let k=-1;k<=1;k++){if(fl)tile(x+k*w/3,z,w/3-.012,d-.012,mul(f,(k?.92:1.08)*(.9+S(i,j,k+4)*.2)));else tile(x,z+k*d/3,w-.012,d/3-.012,mul(f,(k?1.04:.88)*(.9+S(i,j,k+9)*.2)))}}
  for(let i=0;i<10;i++)dec((S(i,5,2)-.5)*W*.85,(S(i,6,3)-.5)*D*.85,.1,.05,i%3?warm('#5a8a4a',.8,1):warm('#a85a8a',.8,1),S(i,7,8)*3);return}
 if(id==='herreria'){   // losas negras de hollín con rendijas de brasa y una reja de hierro
  const nx=5,nz=Math.ceil(D/.9);for(let j=0;j<nz;j++)for(let i=0;i<nx;i++)tile(-W/2+(i+.5)*W/nx,-D/2+(j+.5)*D/nz,W/nx-.015,D/nz-.015,mul(st,.42+S(i,j,3)*.3),{jit:.008});
  for(let i=0;i<7;i++)dec((S(i,2,1)-.5)*W*.8,(S(i,3,2)-.5)*D*.8,.4+S(i,4,3)*.3,.3,col('#0e0a08'),S(i,5,4)*3);b.box(0,0,-D*.28,W*.5,.008,.5,col('#2a2624'),{nb:1});for(let i=0;i<9;i++)b.box(-W*.22+i*W*.055,.008,-D*.28,.018,.004,.46,col('#ff7a2a'),{em:2,nb:1});return}
 if(id==='banco'){   // damero de mármol claro y oscuro con orla de latón
  const c=.62,nx=Math.ceil(W/c),nz=Math.ceil(D/c);for(let i=0;i<nx;i++)for(let j=0;j<nz;j++)tile(-W/2+(i+.5)*W/nx,-D/2+(j+.5)*D/nz,W/nx-.014,D/nz-.014,mul((i+j)&1?mul(st,1.18):mul(st,.7),.92+S(i,j,2)*.16));
  const br=col('#c8a24a');dec(0,-D/2+.1,W,.05,br);dec(0,D/2-.1,W,.05,br);dec(-W/2+.1,0,.05,D,br);dec(W/2-.1,0,.05,D,br);return}
 if(id==='tienda'){   // tablones atravesados claros con senda central gastada y huellas de arena
  const n=Math.ceil(W/.3);for(let i=0;i<n;i++)tile(-W/2+(i+.5)*W/n,0,W/n-.015,D,mul(f,.95+S(i,2,8)*.32),{v:.03});
  dec(0,.2,W*.78,.6,mul(f,1.3));for(let i=0;i<8;i++)dec((S(i,4,1)-.5)*W*.75,(S(i,5,2)-.5)*D*.75,.22,.16,warm('#c8b890',.8,1),S(i,6,3)*3);return}
 if(id==='templo'){   // losas de pizarra con círculo de piedra clara y cruz de juntas
  const c=.7,nx=Math.ceil(W/c),nz=Math.ceil(D/c);for(let i=0;i<nx;i++)for(let j=0;j<nz;j++)tile(-W/2+(i+.5)*W/nx,-D/2+(j+.5)*D/nz,W/nx-.02,D/nz-.02,mul(st,.62+S(i,j,3)*.26));
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2;dec(Math.cos(a)*1.5,Math.sin(a)*1.1-.3,.5,.14,mul(st,1.25),-a)}dec(0,-.3,.18,2.4,mul(st,1.1));dec(0,-.3,3.2,.12,mul(st,1.1));return}
 const n=Math.ceil(D/.3);for(let j=0;j<n;j++)tile(0,-D/2+(j+.5)*D/n,W,D/n-.012,mul(f,.86+S(j,4,2)*.3),{v:.03})}
function wallFace(b,so,len,thick,y){   // pared a lo largo de x (local), centrada, cara hacia +z
 const w=warm(so.wall||'#ecd9ae',.8,.96),w2=warm(so.wall2||so.wall||'#d9bf8c',.8,.9),beam=warm(so.beam||'#7a5232',.85,.9);
 b.box(0,0,0,len,WH,thick,w,{g:.12});
 if(so.style==='troncos'){for(let i=0;i<9;i++)b.beam([-len/2,.16+i*.29,thick/2+.04],[len/2,.16+i*.29,thick/2+.04],.3,mul(warm(so.wall,.8,.85),.88+hash(i,1,1)*.22))}
 else if(so.style==='cana'){for(let i=0;i<Math.floor(len/.14);i++){const x=-len/2+.07+i*.14;b.box(x,0,thick/2+.01,.1,WH-hash(i,5,5)*.18,.04,mul(w,.88+hash(i,2,9)*.24))}for(const y2 of[.4,1.3,2.1])b.box(0,y2,thick/2+.04,len,.07,.05,beam)}
 else if(so.style==='shoji'){const cols=Math.round(len/.9);for(let i=0;i<=cols;i++)b.box(-len/2+i*len/cols,0,thick/2+.02,.07,WH,.07,beam);for(const y2 of[0,.9,1.8,WH-.07])b.box(0,y2,thick/2+.02,len,.07,.07,beam);for(let i=0;i<cols;i++)b.box(-len/2+(i+.5)*len/cols,.09,thick/2+.012,len/cols-.07,1.8,.02,col(so.paper||'#f6e8c0'),{em:.5})}
 else if(so.style==='basalto'){for(let j=0;j<8;j++)for(let i=0;i<Math.ceil(len/.9);i++){b.box(-len/2+(i+.5)*.9+(j%2?.45:0)-.0,.02+j*.32,thick/2+.02,.86,.3,.08,mul(w,.75+hash(i,j,4)*.5),{jit:.02})}b.box(0,.02,thick/2+.1,len,.05,.05,col('#ff6a1a'),{em:2})}
 else{ // enlucido + entramado de vigas
  for(let i=0;i<=Math.round(len/1.9);i++)b.box(-len/2+i*len/Math.round(len/1.9),0,thick/2+.025,.12,WH,.07,beam);for(const y2 of[0,1.0,WH-.14])b.box(0,y2,thick/2+.025,len,.12,.07,beam);b.box(0,0,thick/2+.03,len,.12,.09,mul(beam,.8))}
 b.box(0,0,thick/2+.04,len,.14,.06,mul(w2,.8));   // rodapié
}

// ── el módulo ──
export class Rooms3D{
 constructor(scene,aScene,W3){this.scene=scene;this.aScene=aScene;this.W3=W3;this.on=false;this.grp=new THREE.Group();this.grp.name='interior3d';this.grp.visible=false;scene.add(this.grp);this.ogrp=new THREE.Group();aScene.add(this.ogrp);
  this.mat=toon('#ffffff',{vc:1,emit:1,tex:'auto',texS:7,texB:.14,texA:.65,soft:1});this.ink=inkFor('#4a3220');this.dmat=new THREE.MeshBasicMaterial({colorWrite:false});this.lights=[0,1,2,3].map(()=>{const l=new THREE.PointLight(0xffb060,0,6,1.2);scene.add(l);return l});
  this.ok=!/[?&]int3d=0/.test(location.search);this.tSmoke=radTex(214,198,182,.85);this.tHalo=radTex(255,190,100,1);this.fm=[new THREE.MeshBasicMaterial({color:new THREE.Color('#ff7a1a').multiplyScalar(1.5)}),new THREE.MeshBasicMaterial({color:new THREE.Color('#ffd23a').multiplyScalar(1.7)})];this.emit=[];this.puffs=[];this.act=[];this.halos=[];this.t0=0;
  this.hidden=[];this.flames=[];this.glows=[];this.fx=[];this.lt=[];this.dyn=null;this.dynOn=false;this.dust=null;this.mw=new THREE.MeshBasicMaterial({color:'#ffd890',transparent:true,opacity:.0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})}
 // un mesh con contorno y copia de profundidad para el héroe
 get tPane(){if(this._tp)return this._tp;const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,128,128);g.filter='blur(3px)';g.fillStyle='#fff';for(const[x,y]of[[8,8],[68,8],[8,68],[68,68]])g.fillRect(x,y,52,52);this._tp=new THREE.CanvasTexture(c);return this._tp}   // 4 cristales con travesaño en cruz (sombra de la ventana sobre el suelo)
 mesh(g,x,y,z,ry,vis){const gr=new THREE.Group(),m=new THREE.Mesh(g,this.mat);m.castShadow=m.receiveShadow=true;if(!g.userData.hull)g.userData.hull=hull(g,.014).geometry;const h=new THREE.Mesh(g.userData.hull,this.ink),d=new THREE.Mesh(g,this.dmat);d.layers.set(3);
  gr.add(m,h);gr.position.set(x,y,z);gr.rotation.y=ry||0;this.grp.add(gr);d.position.copy(gr.position);d.rotation.y=gr.rotation.y;this.ogrp.add(d);return gr}
 updBeams(sp,dn,t){const L=Math.hypot(sp[0],sp[1],sp[2])||1,tx=-sp[0]/L,ty=-sp[1]/L,tz=-sp[2]/L;if(ty>-.05)return;for(const b of this.beams){const p=b.m.geometry.attributes.position.array,c=[[b.w[0][0],b.Y0,b.w[0][1]],[b.w[1][0],b.Y0,b.w[1][1]],[b.w[1][0],b.Y1,b.w[1][1]],[b.w[0][0],b.Y1,b.w[0][1]]];for(let i=0;i<4;i++){const q=c[i];p.set(q,i*3);const lam=q[1]/-ty;p[(i+4)*3]=q[0]+tx*lam;p[(i+4)*3+1]=.01;p[(i+4)*3+2]=q[2]+tz*lam}b.m.geometry.attributes.position.needsUpdate=true;b.m.geometry.computeBoundingSphere();const k=1-dn,fa=Math.min(1,-ty*2.2);b.m.material.opacity=(.075*k+.03*dn)*(.85+.15*Math.sin(t*.8+b.w[0][0]));
    // recorte en el suelo: las 4 esquinas inferiores proyectadas, recortadas al rectángulo de la sala
    const dp=b.dm.geometry.attributes.position.array,hx=this.hw[0],hz=this.hw[1];for(let i=0;i<4;i++){dp[i*3]=Math.max(-hx,Math.min(hx,p[(i+4)*3]));dp[i*3+1]=.012;dp[i*3+2]=Math.max(-hz,Math.min(hz,p[(i+4)*3+2]))}b.dm.geometry.attributes.position.needsUpdate=true;b.dm.geometry.computeBoundingSphere();b.dm.material.opacity=(.62*k*fa+.14*dn)*(.9+.1*Math.sin(t*.6+b.w[0][1]));b.dm.material.color.set(dn>.5?'#9ab4ff':'#ffd890')}}
 flame(x,y,z,sc){const g=new THREE.Group();for(let i=0;i<3;i++){const c=new THREE.Mesh(new THREE.ConeGeometry(.09-i*.012,.4,6).translate(0,.2,0),this.fm[i===1?1:0]);c.position.set((i-1)*.12,0,(i%2)*.05);g.add(c)}g.position.set(x,y,z);g.scale.setScalar(sc);this.grp.add(g);this.flames.push({g,ph:x+z,sc})}
 enter(I){this.leave();if(I.cave)return this.enterCave(I);const so=I.so,RW=INTROOMS.RW,RD=INTROOMS.RD;
  const Wd=RW*IK/32,Dd=RD*IK/32,base=this.W3(IRC.x,IRC.y,0);this.grp.position.copy(base);this.ogrp.position.copy(base);this.flames=[];this.glows=[];this.lt=[];this.fx=[];this.emit=[];this.puffs=[];this.act=[];this.halos=[];
  // suelo y paredes (una sola malla de carcasa por pieza)
  {const b=new B(3);floorOf(b,so,Wd,Dd,I.id);const fg=this.mesh(b.geo(),0,0,0,0);fg.userData.kind='floor'}
  {const b=new B(5);wallFace(b,so,Wd+.6,.3,0);this.mesh(b.geo(),0,0,-Dd/2-.15,0)}                 // pared derecha (fondo, z=−D/2), cara a +z
  {const b=new B(7);wallFace(b,so,Dd+.6,.3,0);this.mesh(b.geo(),-Wd/2-.15,0,0,PI/2)}             // pared izquierda (x=−W/2), cara a +x
  // marcos de ventana + luz cálida (pared derecha: 2, izquierda: 2); la puerta va en la pared derecha en x = RW·DOOR
  const dX=INTROOMS.RW*.34*IK/32;
  {const b=new B(9),fr=warm(so.beam||'#7a5232',.8,.9),gl=col(so.glass||'#ffd9a0');
   const win=(b,x,y)=>{b.box(x,y,0,1.0,.9,.08,fr);b.box(x,y+.06,.05,.86,.78,.03,gl,{em:1});b.box(x,y+.06,.07,.04,.78,.03,fr);b.box(x,y+.42,.07,.86,.04,.03,fr);b.box(x,y-.06,.04,1.1,.07,.16,mul(fr,.9))};
   win(b,-2.7,1.2);win(b,-.9,1.2);win(b,1.0,1.2);
   const door=new B(11);door.box(0,0,0,.84,1.5,.1,fr);door.box(0,0,.05,.66,1.4,.04,mul(warm(so.wood||'#9a6a3a'),.9));door.box(.16,.62,.09,.05,.05,.05,col('#caa04a'));door.box(0,1.5,0,.96,.1,.14,fr);
   const pz=({troncos:.2,basalto:.1,cana:.06,shoji:.05})[so.style]||.04;   // cuánto sobresale la decoración de la pared según el estilo (los troncos son gruesos)
   this.mesh(b.geo(),0,0,-Dd/2+pz,0);this.mesh(door.geo(),dX,0,-Dd/2+pz-.01,0);
   const b2=new B(13);win(b2,-1.1,1.2);win(b2,1.1,1.2);this.mesh(b2.geo(),-Wd/2+pz,0,0,PI/2);
   // charcos de luz de las ventanas sobre el suelo (cuadrados dorados aditivos, desplazados hacia la sala)
   const pat=(x,z,ang)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(1.0,1.5).rotateX(-PI/2),this.mw.clone());m.material.opacity=.22;m.position.set(x,.03,z);m.rotation.y=ang;m.renderOrder=2;this.grp.add(m);this.fx.push(m)};
   void pat}   // 28 oct 2026: ya NO hay cuadrados de luz pintados: la luz que entra por las ventanas es la sombra REAL del sol (carcasa de abajo)
  // muebles (y moldura de pared)
  const tables=I.items.filter(i=>i.n==='mesa'||i.n==='mesaBaja').map(i=>[(i.wx-IRC.x)/32,(i.wy-IRC.y)/32]);
  for(const it of I.items){const f=ITEM[it.n];if(!f)continue;const o=it.o||{},p=PL(o),b=new B(Math.round(it.wx+it.wy)%97+1),x=(it.wx-IRC.x)/32,z=(it.wy-IRC.y)/32;f(b,o,p,it,I.id);
   let ry=0;if(it.n==='silla'&&tables.length){let bd=1e9,t=null;for(const q of tables){const d=Math.hypot(q[0]-x,q[1]-z);if(d<bd){bd=d;t=q}}if(t)ry=Math.atan2(t[0]-x,t[1]-z)}   // la silla mira a su mesa
   else if(o.rot)ry=PI/2;   // pegado a la pared izquierda: el frente (+z) pasa a +x
   const gr=this.mesh(b.geo(),x,it.fl?.0:0,z,ry);gr.userData.item=it.n;gr.userData.fl=!!it.fl;gr.userData.ry=ry;
   if(it.n==='hogar'){this.flame(x,.26,z+.1,1.2);this.glows.push({x,y:.7,z:z+.4,r:2.6,ph:x,fire:1});this.emit.push({x,y:.7,z:z+.25,rate:6,r:.16,h:2.1,op:.55,sz:.62,drift:.14})}
   if(it.n==='farolPapel'||(it.n==='maceta'&&o.kind==='fuego'))this.glows.push({x,y:it.n==='farolPapel'?1.2:.3,z,r:it.n==='farolPapel'?1.5:1.1,ph:x})
   if(it.n==='candelabro')this.glows.push({x,y:1.05,z,r:1.3,ph:x});if(it.n==='sconce')this.glows.push({x,y:1.62,z,r:1.1,ph:x*3})}
  // decoración propia de cada oficio y candelabros/apliques de pared (datos, no `if` por bioma)
  {const pzz=({troncos:.2,basalto:.1,cana:.06,shoji:.05})[so.style]||.04,D0=-Dd/2+pzz+.02,L0=-Wd/2+pzz+.02,put=(n,x,z,ry,o2)=>{const f=ITEM[n];if(!f)return;const o=Object.assign({},I.items[0]&&I.items[0].o||{},o2||{}),p=PL(o),b=new B(Math.round((x+9)*(z+11)*7)%97+1);f(b,o,p,null,I.id);const gr=this.mesh(b.geo(),x,0,z,ry||0);void gr;
     if(n==='sconce'||n==='candelabro')this.glows.push({x,y:n==='sconce'?1.62:1.05,z,r:1.2,ph:x*3+z})};
   [-1.8,.05,2.0].forEach(x=>put('sconce',x,D0,0));[0,2.6].forEach(z=>put('sconce',L0,z,PI/2));
   if(I.id==='banco')put('cajonera',-.6,D0+.06,0,{w:3.0,wood:so.wood,woodL:so.woodL,woodD:so.woodD});
   if(I.id==='tienda'){put('cajas',3.7,-3.0,.2);put('sacos',3.5,-2.3,-.2)}
   if(I.id==='herreria')put('carbonera',3.4,-3.1,0);
   if(I.id==='templo'){put('candelabro',-1.4,-1.6,0);put('candelabro',1.2,-1.6,0)}}
  // estaciones: modelos de 5b (propsdark_estaciones3d) con la arquitectura del bioma
  for(const e of ST){if(!e.inroom)continue;const n=PROPS.ST[e.id]&&PROPS.ST[e.id].n;if(!n||e.nodraw)continue;const k=I.k,th=BIOMES.list[k]&&BIOMES.list[k].village&&BIOMES.list[k].village.theme||null,Gm=propGeo(n,e.rot?{arch:k,rot:1}:{arch:k},th);if(!Gm)continue;
   const x=(e.x-IRC.x)/32,z=(e.y-IRC.y)/32;const sg=this.mesh(Gm.g,x,0,z,0);sg.userData.st=e.id;if(e.id==='furnace'||e.id==='anvil'||e.id==='armero')this.glows.push({x,y:.8,z,r:1.6,ph:z,fire:1});
   if(e.id==='furnace'){this.emit.push({x,y:1.5,z,rate:5,r:.14,h:1.9,op:.5,sz:.55,drift:.12});this.glows.push({x,y:.5,z:z+.5,r:2.4,ph:1,fire:1})}
   if(e.id==='cocina'){this.glows.push({x:x-.55,y:.75,z:z+.15,r:1.9,ph:x,fire:1});this.emit.push({x:x-.55,y:1.25,z,rate:2.5,r:.1,h:1.4,op:.3,sz:.4,drift:.08})}   // fuego y vapor del fogón de la cocina (lado izquierdo del modelo)
   if(e.id==='shrine')this.emit.push({x,y:.85,z,rate:2.2,r:.05,h:1.6,op:.16,sz:.28,drift:.07})}
  // personal 3D tras el mostrador: cajeros del banco (ventanillas 1 y 3) y tendero de la tienda (misma paleta de cultura que la sala)
  {const kk=INTROOMS.PALS[I.k]?I.k:({6:3,7:4,8:0})[I.k]||0,bk=ST.find(e=>e.inroom&&e.id==='bank'),sh=ST.find(e=>e.inroom&&e.id==='shop');
   const staff=(key,x,z,y)=>{const A=makeActor(key,this.W3);if(!A)return;A.grp.position.set(x,y||0,z);this.grp.add(A.grp);this.act.push({A,x,z})};
   if(bk){const bx=(bk.x-IRC.x)/32,bz=(bk.y-IRC.y)/32;staff('cajero@'+kk,bx-.5,bz-.22);staff('tendero@'+kk,bx+.5,bz-.22)}   // el mostrador mide ±.98 × ±.7 (propGeo banco): se está DENTRO de su huella, tras el frente con rejas
  
   if(sh){const sx=(sh.x-IRC.x)/32,sz=(sh.y-IRC.y)/32;staff('tendero@'+kk,sx,sz-.26)}}
  // HACES DE LUZ (polvo en el aire): un prisma aditivo y muy tenue entre cada ventana y su recorte en el suelo; se recalcula con la dirección del sol (update)
  {this.beams=[];this.hw=[Wd/2,Dd/2];const WHt=2.6,Y0=1.26,Y1=2.04,wins=[];[-2.7,-.9,1.0].forEach(x=>wins.push([[x-.43,-Dd/2+.02],[x+.43,-Dd/2+.02]]));[-1.1,1.1].forEach(z=>wins.push([[-Wd/2+.02,z-.43],[-Wd/2+.02,z+.43]]));
   for(const w of wins){const g=new THREE.BufferGeometry(),pos=new Float32Array(8*3);g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setIndex([0,1,5,0,5,4,1,2,6,1,6,5,2,3,7,2,7,6,3,0,4,3,4,7]);
    const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:'#ffe2a8',transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));m.renderOrder=3;this.grp.add(m);
    const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(12),3));dg.setAttribute('uv',new THREE.BufferAttribute(new Float32Array([0,0,1,0,1,1,0,1]),2));dg.setIndex([0,1,2,0,2,3]);
    const dm=new THREE.Mesh(dg,new THREE.MeshBasicMaterial({map:this.tPane,color:'#ffe2a8',transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));dm.renderOrder=2;this.grp.add(dm);this.beams.push({m,dm,w,Y0,Y1})}}
  // oclusión de las lámparas (DynLight): cajas de muebles y paredes con su altura + fuentes de luz de la sala (las `lt` de R.lt y los fuegos); r3d.js las pasa a `dl.updateRoom`
  {const hb=this.grp.position,bx=[],ON=/^(vajilla|vajillaBaja|hierbasMesa|jarras|alfombra|cojin|maceta|farolPapel|sconce|candelabro|plantaGrande|barrilTap|cestaLena)$/;this.grp.updateMatrixWorld(true);
   for(const c of this.grp.children){const u=c.userData;if(!u||!(u.item||u.st)||u.fl||ON.test(u.item||''))continue;const m=c.children[0];if(!m||!m.geometry)continue;m.geometry.computeBoundingBox();const bb=m.geometry.boundingBox,cr=Math.cos(c.rotation.y),sr=Math.sin(c.rotation.y);let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const px of[bb.min.x,bb.max.x])for(const pz of[bb.min.z,bb.max.z]){const wx=c.position.x+px*cr+pz*sr,wz=c.position.z-px*sr+pz*cr;x0=Math.min(x0,wx);x1=Math.max(x1,wx);z0=Math.min(z0,wz);z1=Math.max(z1,wz)}
    if(bb.max.y<.45||x1-x0<.05)continue;const sh=.12*(x1-x0),sz=.12*(z1-z0);bx.push([x0+sh+hb.x,z0+sz+hb.z,x1-sh+hb.x,z1-sz+hb.z,bb.max.y+hb.y])}
   bx.push([-Wd/2-.4+hb.x,-Dd/2-.3+hb.z,Wd/2+.4+hb.x,-Dd/2+hb.z,WH+hb.y],[-Wd/2-.3+hb.x,-Dd/2+hb.z,-Wd/2+hb.x,Dd/2+.4+hb.z,WH+hb.y]);bx.sig=I.id+'|'+I.k+'|'+bx.length;
   /* TODO prop que produce luz está en `this.glows` (fuego, vela, farolillo, candelabro…) y por tanto es una FUENTE con oclusión; las `lt` de la sala son un relleno suave. Un prop nuevo que alumbre debe añadir su glow (REGLAS_CREACION §interiores). */
   const srcs=[];for(const g of this.glows)srcs.push({p:new THREE.Vector3(g.x+hb.x,g.y+hb.y,g.z+hb.z),d:g.fire?['#ff8a30',g.r>2?2.8:2,4.6,0,'fire']:[g.col||'#ffc070',g.r>1.4?1.5:1.15,Math.max(3,g.r*2.4),0,'win'],ph:g.ph||0});
   (I.R.lt||[]).slice(0,4).forEach((l,i)=>srcs.push({p:new THREE.Vector3(l[0]*U+hb.x,l[2]*U*.9+.7+hb.y,l[1]*U+hb.z),d:[l[4],.55,Math.max(3.2,l[3]*U*1.9),0,'win'],ph:i*1.7}));
   this.dyn={srcs:srcs.slice(0,16),boxes:bx,cx:hb.x,cz:hb.z}}
  // PNJ de interior (R.np = [rol, objetivo|[objetivos], lado N|S|E|W|null, tarea, {i,off,gap,seat}]): se colocan JUNTO al mueble o estación REAL en que trabajan (lado indicado, de cara a él, con las manos sobre su borde) o SENTADOS en una silla/cojín mirando a su mesa. Nunca en coordenadas sueltas.
  {const kk=INTROOMS.PALS[I.k]?I.k:({6:3,7:4,8:0})[I.k]||0,hb=this.grp.position;this.grp.updateMatrixWorld(true);const gs=this.grp.children.filter(c=>c.userData&&(c.userData.item||c.userData.st));
   for(const [role,tg,side,job,o2] of (I.R.np||[])){const o=o2||{},names=Array.isArray(tg)?tg:[tg],L=gs.filter(c=>names.includes(c.userData.item)||names.includes(c.userData.st));const g=L[Math.min(o.i||0,L.length-1)];if(!g)continue;
    const A=makeActor(role+'@'+kk,this.W3);if(!A)continue;let px,pz,yaw;
    if(!side){px=g.position.x;pz=g.position.z;let bd=1e9,tx=0,tz=0;for(const q of gs){if(q.userData.item!=='mesa'&&q.userData.item!=='mesaBaja')continue;const d=Math.hypot(q.position.x-px,q.position.z-pz);if(d<bd){bd=d;tx=q.position.x;tz=q.position.z}}yaw=bd<1e9?Math.atan2(tx-px,tz-pz):0}   // sentado en la silla/cojín, mirando a su mesa (la silla ya mira a la mesa)
    else{const bb=new THREE.Box3().setFromObject(g),cx=(bb.min.x+bb.max.x)/2-hb.x,cz=(bb.min.z+bb.max.z)/2-hb.z,gp=o.gap==null?.34:o.gap,of=o.off||0;
     if(side==='S'){px=cx+of;pz=bb.max.z-hb.z+gp;yaw=Math.PI}else if(side==='N'){px=cx+of;pz=bb.min.z-hb.z-gp;yaw=0}else if(side==='E'){px=bb.max.x-hb.x+gp;pz=cz+of;yaw=-Math.PI/2}else{px=bb.min.x-hb.x-gp;pz=cz+of;yaw=Math.PI/2}}
    px=Math.max(-Wd/2+.45,Math.min(Wd/2-.45,px));pz=Math.max(-Dd/2+.45,Math.min(Dd/2-.45,pz));
    A.grp.position.set(px,0,pz);A.grp.rotation.y=yaw;this.grp.add(A.grp);this.act.push({A,x:px,z:pz,job,yaw,seat:!!o.seat,tg:names[0],side,nolook:job==='pray'||job==='grind'||job==='sew'||job==='saw'||job==='hammer'||job==='wipe'||job==='sort'||!!o.seat})}}
  // halos aditivos (llama, farolillo, horno) y volutas de humo (pool por emisor)
  for(const g of this.glows){const m=new THREE.SpriteMaterial({map:this.tHalo,color:g.fire?'#ff8a30':'#ffc070',transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}),sp=new THREE.Sprite(m);sp.position.set(g.x,g.y,g.z);sp.scale.setScalar(g.r);sp.renderOrder=5;this.grp.add(sp);this.halos.push({sp,g})}
  for(const e of this.emit){const life=4.2,n=Math.ceil(e.rate*life);for(let i=0;i<n;i++){const m=new THREE.SpriteMaterial({map:this.tSmoke,color:'#9a8a7a',transparent:true,opacity:0,depthWrite:false}),sp=new THREE.Sprite(m);sp.renderOrder=6;this.grp.add(sp);this.puffs.push({sp,e,life,age:i/n*life,ox:(hash(i,e.x*9,3)-.5)*e.r*2,oz:(hash(i,e.z*7,5)-.5)*e.r*2,ph:hash(i,2,e.x)*6.28})}}
  // luces de la sala (R.lt = [x,y,alto,radio,color] en unidades de sala) → 4 PointLights fijas + halo aditivo
  I.R.lt.slice(0,4).forEach((l,i)=>{const L=this.lights[i];L.color.set(l[4]);L.position.set(l[0]*U,l[2]*U*.9+.7,l[1]*U).add(base);L.distance=Math.max(4,l[3]*U*1.9);L.userData={x:l[0],i,k:1.0};this.lt.push(L)});
  this.grp.visible=true;this.on=true;
  // se oculta el exterior
  this.hidden=[];for(const c of this.scene.children){if(c===this.grp||c.isLight||c.layers.mask===4||c.userData.keepInt)continue;if(c.visible){c.visible=false;this.hidden.push(c)}}
  console.info('[R3D interior]',{k:I.k,sala:I.id,muebles:I.items.length,mallas:this.grp.children.length})}

 // ═══ CUEVAS REALES (27 oct 2026): la sala es la malla de `cave3d.js` (planta de CAVEGEN). Las paredes se escalan en Y según la cámara (`update`), la luz es la del héroe + las 3 fuentes más cercanas. ═══
 // materiales de la cueva (Lote CUEVAS-TECHO): PARED = sombreado continuo + estratos pintados de «montaña» (clase 9); SUELO = sombreado continuo + moteado suave de tierra (clase 8); TECHO = sin luz, con agujero de trama (uRoof) alrededor del héroe
 caveMats(){if(this.cmat)return;this.cmat=toon('#ffffff',{vc:1,emit:1,soft:1,tex:'montana',texS:.85,texA:.8,texB:.22,side:THREE.DoubleSide});   // DoubleSide: las paredes bajadas por el corte de cámara se ven por su cara de roca y la planta nunca queda abierta al vacío
  this.fmat=toon('#ffffff',{vc:1,emit:1,soft:1,tex:'yeso',texS:2.6,texA:.85,texB:.16});
  this.rU={value:new THREE.Vector4(0,0,11,7)};const m=new THREE.MeshBasicMaterial({vertexColors:true});m.onBeforeCompile=sh=>{sh.uniforms.uRoof=this.rU;
   sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vRW;').replace('#include <project_vertex>','#include <project_vertex>\nvRW=(modelMatrix*vec4(transformed,1.)).xyz;');
   sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vRW;uniform vec4 uRoof;').replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\n {float a=smoothstep(uRoof.z,uRoof.z+uRoof.w,length(vRW.xz-uRoof.xy));if(a<fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715)))))discard;}')};
  m.customProgramCacheKey=()=>'cavroof';this.rmat=m}
 rock(g,x,y,z,depth,mat){this.caveMats();const m=new THREE.Mesh(g,mat||this.cmat);m.receiveShadow=true;const gr=new THREE.Group();gr.add(m);gr.position.set(x,y,z);this.grp.add(gr);let d=null;if(depth){d=new THREE.Mesh(g,this.dmat);d.layers.set(3);d.position.copy(gr.position);this.ogrp.add(d)}return{gr,d}}
 enterCave(I){const def=I.cave,base=this.W3(IRC.x,IRC.y,0);this.grp.position.copy(base);this.ogrp.position.copy(base);this.flames=[];this.glows=[];this.lt=[];this.fx=[];this.emit=[];this.puffs=[];this.act=[];this.halos=[];
  const cv=buildCave(def,I.k);this.cv=cv;this.cvTp=Object.assign({},CAVE_TP,cv.P.tp);this.cave=true;this.cw=[];this.cl=cv.lights;this.dd=def.W/2;
  this.rock(cv.floor,0,0,0,false,this.fmat);this.rock(cv.decor,0,0,0,true);{const rf=new THREE.Mesh(cv.roof,this.rmat);this.grp.add(rf);this.roofY=cv.roofY}
  for(const w of cv.walls){const r=this.rock(w.geo,0,0,0,true);this.cw.push({nx:w.nx,nz:w.nz,x:w.x,z:w.z,gr:r.gr,d:r.d,k:1})}
  this.glows.push({x:def.ent.x+.5-def.W/2,y:1.1,z:def.ent.y+.5-def.H/2-.4,r:4.2,ph:1,col:'#bcd8ff',cave:1});   // luz de fuera al fondo del túnel: marca la salida
  for(const l of cv.lights)this.glows.push({x:l.x,y:l.y,z:l.z,r:l.k==='cristal'?1.9:l.k==='mena'?2.6:1.3,ph:l.x*3+l.z,col:l.col,cave:1});
  for(const g of this.glows){const m=new THREE.SpriteMaterial({map:this.tHalo,color:g.col||'#ffc070',transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}),sp=new THREE.Sprite(m);sp.position.set(g.x,g.y,g.z);sp.scale.setScalar(g.r);sp.renderOrder=5;this.grp.add(sp);this.halos.push({sp,g})}
  // polvo y vapor fríos flotando (reutiliza el emisor de humo, muy tenue)
  for(let i=0;i<5;i++){const c=def.cham[i%def.cham.length];this.emit.push({x:c.x-def.W/2+(i%3-1)*1.5,y:.2,z:c.y-def.H/2,rate:1.1,r:c.r*.5,h:2.4,op:.09,sz:1.7,drift:.3})}
  for(const e of this.emit){const life=4.2,n=Math.ceil(e.rate*life);for(let i=0;i<n;i++){const m=new THREE.SpriteMaterial({map:this.tSmoke,color:'#8a9aa8',transparent:true,opacity:0,depthWrite:false}),sp=new THREE.Sprite(m);sp.renderOrder=6;this.grp.add(sp);this.puffs.push({sp,e,life,age:i/n*life,ox:(hash(i,e.x*9,3)-.5)*e.r*2,oz:(hash(i,e.z*7,5)-.5)*e.r*2,ph:hash(i,2,e.x)*6.28})}}
  this.lights.forEach((l,i)=>{l.color.set(i?cv.P.glow:cv.P.torch);l.distance=i?7:11});
  {const hb=this.grp.position,srcs=this.glows.map(g=>({p:new THREE.Vector3(g.x+hb.x,g.y+hb.y,g.z+hb.z),d:[g.col||'#ffc070',g.r>1.5?1.7:1.2,g.r>1.5?6:4.5,0,'win'],ph:g.ph||0})).slice(0,15);this.dyn={srcs,boxes:Object.assign([],{sig:'cave|'+I.k+'|'+def.W}),cx:hb.x,cz:hb.z};this.dynOn=false}   // CUEVA: luces dinámicas por fragmento (cristales, setas, antorchas) + el FAROL del héroe (r3d.js lo pasa a updateRoom)
  this.grp.visible=true;this.on=true;this.hidden=[];for(const c of this.scene.children){if(c===this.grp||c.isLight||c.layers.mask===4||c.userData.keepInt||(this.keep&&this.keep.includes(c)))continue;if(c.visible){c.visible=false;this.hidden.push(c)}}
  if(this.hook)this.hook.enter(I);
  console.info('[R3D cueva]',{bioma:I.k,tipo:def.type,celdas:def.floor,camaras:def.cham.length,luces:cv.lights.length,mallas:this.grp.children.length})}
 caveUpdate(t,dt){const az=(window.R3D&&typeof R3D.az==='number')?R3D.az:Math.PI/4,dx=Math.sin(az),dz=Math.cos(az);
  const hx=typeof P!=='undefined'?(P.x-IRC.x)/32:0,hz=typeof P!=='undefined'?(P.y-IRC.y)/32:0;
  // corte de maqueta: las paredes de cara a la cámara que están ENTRE la cámara y el héroe (en un pasillo de ~11 tiles hacia ella) se bajan; las que miran hacia otro lado no se ven (caras traseras)
  for(const w of this.cw){const vx=w.x-hx,vz=w.z-hz,along=vx*dx+vz*dz,perp=Math.abs(vx*dz-vz*dx),side=w.nx*dx+w.nz*dz,occ=side>-.18&&along>-3.5&&along<15&&perp<5.8+Math.max(0,along)*.12,tg=side<=-.18||occ?.2:1;w.k+=(tg-w.k)*(1-Math.exp(-dt*8));w.gr.scale.y=w.k;if(w.d)w.d.scale.y=w.k}
  const L=this.lights;
  {const sh=(this.roofY-.9)*1.732,b=this.grp.position;this.rU.value.set(b.x+hx+dx*sh,b.z+hz+dz*sh,11,7)}   // el rayo de cámara (elevación 30°) que pasa por la cabeza del héroe atraviesa el techo sh tiles hacia la cámara: ahí va el centro del agujero
  L[0].position.set(hx,1.5,hz).add(this.grp.position);L[0].intensity=2.3*(.94+.06*Math.sin(t*7)+.03*Math.sin(t*19));
  // las 3 luces del entorno más cercanas al héroe (sin crear arrays: selección parcial)
  let a=-1,b=-1,c=-1,da=1e9,db=1e9,dc=1e9;for(let i=0;i<this.cl.length;i++){const q=this.cl[i],d=(q.x-hx)*(q.x-hx)+(q.z-hz)*(q.z-hz);if(d<da){c=b;dc=db;b=a;db=da;a=i;da=d}else if(d<db){c=b;dc=db;b=i;db=d}else if(d<dc){c=i;dc=d}}
  [a,b,c].forEach((ix,j)=>{const l=L[j+1];if(ix<0){l.intensity=0;return}const q=this.cl[ix];l.position.set(q.x,q.y+.4,q.z).add(this.grp.position);l.intensity=1.5*(.9+.1*Math.sin(t*3+q.x))})}
 leave(){if(!this.on)return;if(this.cave){this.cave=false;this.cw=[];this.cl=[];this.cv=null;if(this.hook)this.hook.leave()}this.on=false;this.grp.visible=false;for(const c of this.hidden)c.visible=true;this.hidden=[];
  const kill=g=>{while(g.children.length){const c=g.children.pop();c.traverse(o=>{if(o.geometry){if(o.geometry.userData&&o.geometry.userData.hull)o.geometry.userData.hull.dispose();o.geometry.dispose()}if(o.material&&o.material.isMaterial&&o.material!==this.mat&&o.material!==this.cmat&&o.material!==this.fmat&&o.material!==this.rmat&&o.material!==this.ink&&o.material!==this.dmat)o.material.dispose()})}};
  kill(this.grp);kill(this.ogrp);this.lights.forEach(l=>l.intensity=0);this.lt=[];this.fx=[]}
 update(t,dn,sp){if(!this.on)return;dn=dn||0;if(sp&&this.beams)this.updBeams(sp,dn,t);const dt=Math.min(.1,Math.max(0,t-(this.last||t)))||.016;this.last=t;if(this.cave){this.caveUpdate(t,dt);if(this.dynOn)this.lights.forEach(l=>l.intensity*=.3)}   /* con luces dinámicas las PointLight de la cueva solo rellenan */
  this.lt.forEach(L=>{const fl=.9+.1*Math.sin(t*9+L.userData.x)+.06*Math.sin(t*23+L.userData.i);L.intensity=2.1*fl*(.78+.42*dn)*(this.dynOn?.22:1)});   /* de día las lámparas aportan menos (entra el sol); de noche mandan */
  this.fx.forEach((m,i)=>{m.material.opacity=(.05+.2*(1-dn))*(1+.25*Math.sin(t*.7+i));m.material.color.set(dn>.5?'#8aa0e8':'#ffd890')});   /* charcos de las ventanas: dorados de día, azul luna tenue de noche */
  for(const f of this.flames){f.g.children.forEach((c,i)=>c.scale.set(1,.8+.3*Math.sin(t*14+f.ph+i*2)+.12*Math.sin(t*31+i),1))}
  for(const h of this.halos){const fl=h.g.fire?.8+.2*Math.sin(t*9+h.g.ph)+.08*Math.sin(t*23+h.g.ph*2):.85+.15*Math.sin(t*3+h.g.ph);h.sp.material.opacity=(h.g.fire?.5:.34)*fl}
  for(const p of this.puffs){p.age+=dt;if(p.age>p.life)p.age-=p.life;const u=p.age/p.life,e=p.e;p.sp.position.set(e.x+p.ox+Math.sin(t*.6+p.ph)*e.drift*u*3,e.y+u*e.h,e.z+p.oz+Math.cos(t*.5+p.ph)*e.drift*u*2);p.sp.scale.setScalar(e.sz*(.45+1.5*u));p.sp.material.opacity=e.op*Math.pow(Math.sin(Math.PI*u),1.3)}
  if(this.act.length&&typeof P!=='undefined'){const hx=(P.x-IRC.x)/32,hz=(P.y-IRC.y)/32;for(const a of this.act){const look=Math.max(-.9,Math.min(.9,Math.atan2(hx-a.x,hz-a.z)));ANIM.human(a.A,{t,dt,mv:0,at:-1,wave:0,look:a.nolook?0:(a.yaw==null?look:Math.max(-.9,Math.min(.9,look-a.yaw))),job:a.job,seat:a.seat})}}}
}
export const INT_TP={sky:'#0f0804',hemS:'#ffe2b8',hemG:'#9a6a3c',hemI:.95,sun:'#ffc27a',sunI:.95,sunP:[-6,8,5],sat:1.08,night:.55,live:.95,inkK:.8,ink:'#2a1608',rim:'#ffc890',wDeep:'#0a6670',wShal:'#48c8b4',bloom:.42,lift:'#080402',vig:.75,fire:1,win:1,nt:0};

// CUEVAS: oscuridad fría; la luz viene del héroe y de las fuentes cercanas (PointLights de Rooms3D). `nt` alto = la linterna del héroe encendida.
export const CAVE_TP={sky:'#03050a',hemS:'#6a7a98',hemG:'#2a2420',hemI:.62,sun:'#8a9ac0',sunI:.4,sunP:[-6,8,5],sat:1.06,night:.6,live:.95,inkK:.8,ink:'#120c08',rim:'#9ab0d8',wDeep:'#0a6670',wShal:'#48c8b4',bloom:.5,lift:'#020306',vig:.92,fire:1,win:0,nt:.9};
