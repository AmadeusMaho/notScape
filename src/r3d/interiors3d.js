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
function floorOf(b,so,W,D){const f=warm(so.floor||'#b98a52',.85,.95);
 if(so.style==='shoji'){for(let i=0;i<4;i++)for(let j=0;j<4;j++){const x=-W/2+(i+.5)*W/4,z=-D/2+(j+.5)*D/4;b.box(x,-.04,z,W/4-.04,.05,D/4-.04,warm(i+j&1?'#d6d29a':'#cfca90',.7,1),{nb:1});b.box(x,0,z,W/4-.03,.012,.05,col('#3a2a1a'),{nb:1})}return}
 if(so.style==='basalto'){for(let i=0;i<5;i++)for(let j=0;j<4;j++){const x=-W/2+(i+.5)*W/5,z=-D/2+(j+.5)*D/4;b.box(x,-.04,z,W/5-.05,.06,D/4-.05,mul(f,.9+hash(i,j,3)*.3),{nb:1,jit:.02})}b.box(0,-.05,0,W,.02,D,col('#ff6a1a'),{em:2,nb:1});return}
 const n=Math.ceil(D/.3);for(let j=0;j<n;j++){const z=-D/2+(j+.5)*D/n;b.box(0,-.04,z,W,.06,D/n-.012,mul(f,.86+hash(j,4,2)*.3),{nb:1,v:.03})}}
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
  this.mat=toon('#ffffff',{vc:1,emit:1,tex:'auto',texS:7,texB:.3});this.ink=inkFor('#4a3220');this.dmat=new THREE.MeshBasicMaterial({colorWrite:false});this.lights=[0,1,2,3].map(()=>{const l=new THREE.PointLight(0xffb060,0,6,1.2);scene.add(l);return l});
  this.ok=!/[?&]int3d=0/.test(location.search);this.tSmoke=radTex(214,198,182,.85);this.tHalo=radTex(255,190,100,1);this.fm=[new THREE.MeshBasicMaterial({color:new THREE.Color('#ff7a1a').multiplyScalar(1.5)}),new THREE.MeshBasicMaterial({color:new THREE.Color('#ffd23a').multiplyScalar(1.7)})];this.emit=[];this.puffs=[];this.act=[];this.halos=[];this.t0=0;
  this.hidden=[];this.flames=[];this.glows=[];this.fx=[];this.lt=[];this.dust=null;this.mw=new THREE.MeshBasicMaterial({color:'#ffd890',transparent:true,opacity:.0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})}
 // un mesh con contorno y copia de profundidad para el héroe
 mesh(g,x,y,z,ry,vis){const gr=new THREE.Group(),m=new THREE.Mesh(g,this.mat);m.castShadow=m.receiveShadow=true;if(!g.userData.hull)g.userData.hull=hull(g,.014).geometry;const h=new THREE.Mesh(g.userData.hull,this.ink),d=new THREE.Mesh(g,this.dmat);d.layers.set(3);
  gr.add(m,h);gr.position.set(x,y,z);gr.rotation.y=ry||0;this.grp.add(gr);d.position.copy(gr.position);d.rotation.y=gr.rotation.y;this.ogrp.add(d);return gr}
 flame(x,y,z,sc){const g=new THREE.Group();for(let i=0;i<3;i++){const c=new THREE.Mesh(new THREE.ConeGeometry(.09-i*.012,.4,6).translate(0,.2,0),this.fm[i===1?1:0]);c.position.set((i-1)*.12,0,(i%2)*.05);g.add(c)}g.position.set(x,y,z);g.scale.setScalar(sc);this.grp.add(g);this.flames.push({g,ph:x+z,sc})}
 enter(I){this.leave();const so=I.so,RW=INTROOMS.RW,RD=INTROOMS.RD;
  const Wd=RW*IK/32,Dd=RD*IK/32,base=this.W3(IRC.x,IRC.y,0);this.grp.position.copy(base);this.ogrp.position.copy(base);this.flames=[];this.glows=[];this.lt=[];this.fx=[];this.emit=[];this.puffs=[];this.act=[];this.halos=[];
  // suelo y paredes (una sola malla de carcasa por pieza)
  {const b=new B(3);floorOf(b,so,Wd,Dd);this.mesh(b.geo(),0,0,0,0)}
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
   pat(-2.7+.5,-Dd/2+1.3,0);pat(-.9+.5,-Dd/2+1.3,0);pat(1.0+.5,-Dd/2+1.3,0);pat(-Wd/2+1.3,-1.1+.2,PI/2);pat(-Wd/2+1.3,1.1+.2,PI/2)}
  // muebles (y moldura de pared)
  const tables=I.items.filter(i=>i.n==='mesa'||i.n==='mesaBaja').map(i=>[(i.wx-IRC.x)/32,(i.wy-IRC.y)/32]);
  for(const it of I.items){const f=ITEM[it.n];if(!f)continue;const o=it.o||{},p=PL(o),b=new B(Math.round(it.wx+it.wy)%97+1),x=(it.wx-IRC.x)/32,z=(it.wy-IRC.y)/32;f(b,o,p,it,I.id);
   let ry=0;if(it.n==='silla'&&tables.length){let bd=1e9,t=null;for(const q of tables){const d=Math.hypot(q[0]-x,q[1]-z);if(d<bd){bd=d;t=q}}if(t)ry=Math.atan2(t[0]-x,t[1]-z)}   // la silla mira a su mesa
   else if(o.rot)ry=PI/2;   // pegado a la pared izquierda: el frente (+z) pasa a +x
   const gr=this.mesh(b.geo(),x,it.fl?.0:0,z,ry);void gr;
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
   const x=(e.x-IRC.x)/32,z=(e.y-IRC.y)/32;this.mesh(Gm.g,x,0,z,0);if(e.id==='furnace'||e.id==='anvil'||e.id==='armero')this.glows.push({x,y:.8,z,r:1.6,ph:z,fire:1});
   if(e.id==='furnace'){this.emit.push({x,y:1.5,z,rate:5,r:.14,h:1.9,op:.5,sz:.55,drift:.12});this.glows.push({x,y:.5,z:z+.5,r:2.4,ph:1,fire:1})}
   if(e.id==='cocina'){this.glows.push({x:x-.55,y:.75,z:z+.15,r:1.9,ph:x,fire:1});this.emit.push({x:x-.55,y:1.25,z,rate:2.5,r:.1,h:1.4,op:.3,sz:.4,drift:.08})}   // fuego y vapor del fogón de la cocina (lado izquierdo del modelo)
   if(e.id==='shrine')this.emit.push({x,y:.85,z,rate:2.2,r:.05,h:1.6,op:.16,sz:.28,drift:.07})}
  // personal 3D tras el mostrador: cajeros del banco (ventanillas 1 y 3) y tendero de la tienda (misma paleta de cultura que la sala)
  {const kk=INTROOMS.PALS[I.k]?I.k:({6:3,7:4,8:0})[I.k]||0,bk=ST.find(e=>e.inroom&&e.id==='bank'),sh=ST.find(e=>e.inroom&&e.id==='shop');
   const staff=(key,x,z,y)=>{const A=makeActor(key,this.W3);if(!A)return;A.grp.position.set(x,y||0,z);this.grp.add(A.grp);this.act.push({A,x,z})};
   if(bk){const bx=(bk.x-IRC.x)/32,bz=(bk.y-IRC.y)/32;staff('cajero@'+kk,bx-.5,bz-.22);staff('tendero@'+kk,bx+.5,bz-.22)}   // el mostrador mide ±.98 × ±.7 (propGeo banco): se está DENTRO de su huella, tras el frente con rejas
  
   if(sh){const sx=(sh.x-IRC.x)/32,sz=(sh.y-IRC.y)/32;staff('tendero@'+kk,sx,sz-.26)}}   // Fase 28b: tras el mostrador de la tienda (hueco entre la estantería y el tablero)
  // halos aditivos (llama, farolillo, horno) y volutas de humo (pool por emisor)
  for(const g of this.glows){const m=new THREE.SpriteMaterial({map:this.tHalo,color:g.fire?'#ff8a30':'#ffc070',transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}),sp=new THREE.Sprite(m);sp.position.set(g.x,g.y,g.z);sp.scale.setScalar(g.r);sp.renderOrder=5;this.grp.add(sp);this.halos.push({sp,g})}
  for(const e of this.emit){const life=4.2,n=Math.ceil(e.rate*life);for(let i=0;i<n;i++){const m=new THREE.SpriteMaterial({map:this.tSmoke,color:'#9a8a7a',transparent:true,opacity:0,depthWrite:false}),sp=new THREE.Sprite(m);sp.renderOrder=6;this.grp.add(sp);this.puffs.push({sp,e,life,age:i/n*life,ox:(hash(i,e.x*9,3)-.5)*e.r*2,oz:(hash(i,e.z*7,5)-.5)*e.r*2,ph:hash(i,2,e.x)*6.28})}}
  // luces de la sala (R.lt = [x,y,alto,radio,color] en unidades de sala) → 4 PointLights fijas + halo aditivo
  I.R.lt.slice(0,4).forEach((l,i)=>{const L=this.lights[i];L.color.set(l[4]);L.position.set(l[0]*U,l[2]*U*.9+.7,l[1]*U).add(base);L.distance=Math.max(4,l[3]*U*1.9);L.userData={x:l[0],i,k:1.0};this.lt.push(L)});
  this.grp.visible=true;this.on=true;
  // se oculta el exterior
  this.hidden=[];for(const c of this.scene.children){if(c===this.grp||c.isLight||c.layers.mask===4||c.userData.keepInt)continue;if(c.visible){c.visible=false;this.hidden.push(c)}}
  console.info('[R3D interior]',{k:I.k,sala:I.id,muebles:I.items.length,mallas:this.grp.children.length})}
 leave(){if(!this.on)return;this.on=false;this.grp.visible=false;for(const c of this.hidden)c.visible=true;this.hidden=[];
  const kill=g=>{while(g.children.length){const c=g.children.pop();c.traverse(o=>{if(o.geometry){if(o.geometry.userData&&o.geometry.userData.hull)o.geometry.userData.hull.dispose();o.geometry.dispose()}if(o.material&&o.material.isMaterial&&o.material!==this.mat&&o.material!==this.ink&&o.material!==this.dmat)o.material.dispose()})}};
  kill(this.grp);kill(this.ogrp);this.lights.forEach(l=>l.intensity=0);this.lt=[];this.fx=[]}
 update(t){if(!this.on)return;const dt=Math.min(.1,Math.max(0,t-(this.last||t)))||.016;this.last=t;
  this.lt.forEach(L=>{const fl=.9+.1*Math.sin(t*9+L.userData.x)+.06*Math.sin(t*23+L.userData.i);L.intensity=2.1*fl});
  this.fx.forEach((m,i)=>{m.material.opacity=.2+.05*Math.sin(t*.7+i)});
  for(const f of this.flames){f.g.children.forEach((c,i)=>c.scale.set(1,.8+.3*Math.sin(t*14+f.ph+i*2)+.12*Math.sin(t*31+i),1))}
  for(const h of this.halos){const fl=h.g.fire?.8+.2*Math.sin(t*9+h.g.ph)+.08*Math.sin(t*23+h.g.ph*2):.85+.15*Math.sin(t*3+h.g.ph);h.sp.material.opacity=(h.g.fire?.5:.34)*fl}
  for(const p of this.puffs){p.age+=dt;if(p.age>p.life)p.age-=p.life;const u=p.age/p.life,e=p.e;p.sp.position.set(e.x+p.ox+Math.sin(t*.6+p.ph)*e.drift*u*3,e.y+u*e.h,e.z+p.oz+Math.cos(t*.5+p.ph)*e.drift*u*2);p.sp.scale.setScalar(e.sz*(.45+1.5*u));p.sp.material.opacity=e.op*Math.pow(Math.sin(Math.PI*u),1.3)}
  if(this.act.length&&typeof P!=='undefined'){const hx=(P.x-IRC.x)/32,hz=(P.y-IRC.y)/32;for(const a of this.act){const look=Math.max(-.9,Math.min(.9,Math.atan2(hx-a.x,hz-a.z)));ANIM.human(a.A,{t,dt,mv:0,at:-1,wave:0,look})}}}
}
export const INT_TP={sky:'#0f0804',hemS:'#ffe2b8',hemG:'#9a6a3c',hemI:1.9,sun:'#ffc27a',sunI:2.3,sunP:[-6,8,5],sat:1.08,night:.55,live:.95,inkK:.8,ink:'#2a1608',rim:'#ffc890',wDeep:'#0a6670',wShal:'#48c8b4',bloom:.42,lift:'#080402',vig:.75,fire:1,win:1,nt:0};
