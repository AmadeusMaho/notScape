// NotScape · R3D · HÉROE 3D (rehecho desde cero, 17 oct 2026). Estilo «Diorama pintado» (guía 3D §2): low-poly FACETADO, proporciones adultas
// (≈6 cabezas, no «galleta»), bandas suaves (toon), contorno NEGRO de casco (hero:1) y rim de contraluz. La paleta del jugador (S.app) se respeta
// pero se baja un poco de saturación/brillo para el tono dark fantasy (tone()).
// ── Qué hay aquí ──
//  · Esqueleto propio (Object3D): pelvis → columna → pecho → cuello → cabeza; hombro → codo → muñeca → mano; cadera → rodilla → tobillo → pie.
//  · Apariencia: S.app {g, hair, hc, skin, col, eye, face} + equipo (gearOpts() de game.js: sh, lg, gl, pl, cp, ht, wp, two) + ar, helm, boot.
//    Peinados como datos (HAIR). Equipo visible: peto/placas, hombreras, yelmo, guantes, botas, escudo, arma en la mano o a la espalda, capa con capucha.
//  · Animación: RECICLA HERO.pose() (src/hero.js) para TODAS las acciones (tala, minería, forja, combate cuerpo a cuerpo / arco / ballesta / báculo,
//    especial, pesca, comer, recoger, cocinar, artesanía, daño): se pide la pose de PERFIL (dir 0) y sus ángulos sagitales (aN, aF, eN, eF, lean, dip,
//    lunge, item.abs) se aplican a los huesos. Pulido en 3D: sin cuantizar, filtrados con muelles (sin saltos de 3°), torsión del torso, pies plantados
//    con IK, segunda mano en armas de dos manos, cuerda del arco que sigue a la mano. Caminar/correr se rehízo en continuo con IK de pierna (los 16
//    fotogramas del 2D se veían a tirones a 60 fps), con los mismos tiempos del 2D (correr: apoyo 40 %, dos vuelos por ciclo, patada de talón).
//  · Ropa con física (cloth3d.js): CAPA (con capucha arriba/abajo), FALDONES de la túnica (delante y detrás) y COLETAS (peinados pony/twin).
//    Colisionan con cápsulas del cuerpo (torso, caderas, muslos, espinillas, cabeza) y con el suelo; viento y ráfagas deterministas.
// ── API ── const h=new Hero(); scene.add(h.obj); h.setLook(look); cada fotograma: h.update(st,dt) con
//  st={x,y,z (mundo three), mv, run, w (fase de paso de P.w), act (actState de game.js), hurt, t, face:[dx,dz] o null, night, wind:[x,z]}.
//  h.rodTip (Vector3 mundo) cuando pesca. h.HS = escala modelo→mundo (1 m de modelo = 0.63 unidades three; héroe ≈ 1.12 de alto).
import * as THREE from 'three';
import {toon,hull,inkMat,hash,glow,G} from './materials3d.js';
import {Cloth} from './cloth3d.js';

const D=Math.PI/180,V3=THREE.Vector3,lerp=(a,b,u)=>a+(b-a)*u,cl=(v,a,b)=>Math.max(a,Math.min(b,v)),es=u=>u*u*(3-2*u);
export const HS=.7;    // escala del modelo (metros) al mundo (1 tile = 1 unidad). Altura ≈ 1.78 m × .7 = 1.25 (Lote R3D-F2a: +11 % para que se lea mejor, como en un ARPG)
const INKW=.019;       // grosor del contorno negro en metros de modelo (≈ .02 unidades de mundo)
// Lote R3D-HEROE-NR (estilo No Rest for the Wicked, pedido del dueño 17 oct 2026): cabeza algo mayor para que la CARA se lea a tamaño de juego (el hueso
// de la cabeza se escala: pelo, yelmo, capucha y barba crecen con ella), manos y botas más rotundas (silueta de ARPG pintado) y material de personaje `chr`
// (materials3d.js: trazos de pincel en el borde de las bandas, pies en sombra fría y cabeza en luz, relleno desde la cámara, piel cálida).
const HEADK=1.15,HANDK=1.2,FOOTK=1.1,RIM=1.4;

// ───────── geometría low-poly ─────────
// loft: anillos de n lados [y, rx, rz, ox, oz] apilados en y (cualquier orden) con tapas. Cada triángulo se orienta hacia FUERA del eje (para que el
// casco de contorno empuje hacia fuera) y la malla sale sin índice (normales planas = facetado).
function loft(S,n=8,o={}){const rot=o.rot??Math.PI/n,P=[],rings=S.map(s=>{const r=[];for(let j=0;j<n;j++){const a=rot+j/n*Math.PI*2;r.push([(s[3]||0)+Math.cos(a)*s[1],s[0],(s[4]||0)+Math.sin(a)*s[2]])}return r});
 const cen=S.map(s=>[s[3]||0,s[0],s[4]||0]);let gc=[0,0,0];cen.forEach(c=>{gc[0]+=c[0]/cen.length;gc[1]+=c[1]/cen.length;gc[2]+=c[2]/cen.length});
 const tri=(a,b,c,ref)=>{const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2],nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,
   mx=(a[0]+b[0]+c[0])/3-ref[0],my=(a[1]+b[1]+c[1])/3-ref[1],mz=(a[2]+b[2]+c[2])/3-ref[2];if(nx*mx+ny*my+nz*mz<0)P.push(...a,...c,...b);else P.push(...a,...b,...c)};
 for(let i=0;i<S.length-1;i++){const A=rings[i],B=rings[i+1],ref=[(cen[i][0]+cen[i+1][0])/2,(cen[i][1]+cen[i+1][1])/2,(cen[i][2]+cen[i+1][2])/2];
  for(let j=0;j<n;j++){const k=(j+1)%n;tri(A[j],A[k],B[k],ref);tri(A[j],B[k],B[j],ref)}}
 if(o.cap!==false){[0,S.length-1].forEach(i=>{const R=rings[i],c=cen[i];if(S[i][1]<1e-4)return;const ref=[c[0]+(c[0]-gc[0])*-1,c[1]+(c[1]-gc[1])*-1,c[2]+(c[2]-gc[2])*-1];
  for(let j=0;j<n;j++)tri(c,R[j],R[(j+1)%n],gc)})}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.computeVertexNormals();return g}
const box=(w,h,d,x=0,y=0,z=0)=>new THREE.BoxGeometry(w,h,d).translate(x,y,z);
const ico=(r,sx=1,sy=1,sz=1,j=0,seed=1)=>{let g=new THREE.IcosahedronGeometry(r,0);if(g.index)g=g.toNonIndexed();const p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=1+(hash(x*7+seed,y*7,z*7)-.5)*j;p.setXYZ(i,x*sx*k,y*sy*k,z*sz*k)}g.computeVertexNormals();return g};
const cone=(r,h,n=5)=>{let g=new THREE.ConeGeometry(r,h,n);if(g.index)g=g.toNonIndexed();g.computeVertexNormals();return g};
// tono «adulto»: baja un 18 % la saturación y un 10 % el brillo de los colores de tela del jugador (los metales no)
export function tone(c,s=.82,v=.9){const C=new THREE.Color(c),h={};C.getHSL(h);C.setHSL(h.h,h.s*s,h.l*v);return '#'+C.getHexString()}
const shade=(c,k)=>'#'+new THREE.Color(c).multiplyScalar(k).getHexString();
const mixc=(a,b,t)=>'#'+new THREE.Color(a).lerp(new THREE.Color(b),t).getHexString();

// ───────── datos ─────────
// cuerpo por género (metros). sh = semiancho de hombros, ch/wa/hip = [rx, rz] de pecho/cintura/cadera, arm/leg = radios de arriba a abajo
const BODY={m:{k:1,sh:.205,ch:[.185,.122],wa:[.142,.104],hip:[.152,.108],hx:.09,neck:.056,arm:[.056,.048,.044,.036],leg:[.084,.068,.056,.044],head:1},
 robusto:{k:1.02,sh:.218,ch:[.2,.14],wa:[.178,.138],hip:[.166,.12],hx:.095,neck:.063,arm:[.061,.053,.049,.04],leg:[.088,.072,.059,.046],head:1},
 anciano:{k:.95,sh:.19,ch:[.17,.118],wa:[.15,.112],hip:[.148,.106],hx:.088,neck:.05,arm:[.05,.044,.04,.033],leg:[.078,.062,.05,.04],head:1.02},
 f:{k:.955,sh:.172,ch:[.162,.115],wa:[.118,.09],hip:[.162,.112],hx:.094,neck:.048,arm:[.049,.043,.039,.032],leg:[.086,.066,.053,.041],head:.97}};
const L_TH=.44,L_SH=.44,L_UA=.29,L_FA=.25,ANK=.078,PEL=ANK+L_TH+L_SH+.04;   // largos de pierna/brazo; PEL = altura de la pelvis en reposo
// peinados (mismos ids que creator.js / ORG.HAIRS). cap = casquete, back = masa trasera [alto, largo], top = extra, tails = coletas con física [x,y,z por coleta]
const HAIR={bald:{},cut:{cap:1,back:[.07,.05]},spiky:{cap:1,back:[.07,.05],top:'spiky'},side:{cap:1,back:[.07,.05],top:'fringe'},curly:{cap:1,top:'curly',back:[.08,.06]},
 mane:{cap:1,back:[.2,.08]},long:{cap:1,back:[.3,.06],locks:1},bun:{cap:1,back:[.07,.05],top:'bun'},pony:{cap:1,back:[.06,.05],tails:[[0,.13,-.1]]},
 bob:{cap:1,back:[.14,.07],locks:.5},twin:{cap:1,back:[.06,.05],tails:[[.085,.12,-.06],[-.085,.12,-.06]]},short:{cap:1,back:[.07,.05]}};
const METAL='#9aa2b0',LEATHER='#5a3e2c',DARK='#2a2230';

// ───────── el héroe ─────────
export class Hero{
 constructor(){this.HS=HS;this.obj=new THREE.Group();this.obj.name='heroe3d';this.root=new THREE.Group();this.root.scale.setScalar(HS);this.obj.add(this.root);
  this.world=new THREE.Group();this.obj.add(this.world);      // la ropa simulada vive en coordenadas de mundo (fuera del root escalado)
  const B=(name,parent,x,y,z)=>{const b=new THREE.Group();b.name=name;b.position.set(x,y,z);parent.add(b);return b};
  const J=this.J={};J.pelvis=B('pelvis',this.root,0,PEL,0);J.spine=B('spine',J.pelvis,0,.08,0);J.chest=B('chest',J.spine,0,.21,0);J.neck=B('neck',J.chest,0,.2,0);J.head=B('head',J.neck,0,.07,0);
  [1,-1].forEach((s,i)=>{const k=i?'R':'L';J['sh'+k]=B('sh'+k,J.chest,.2*s,.15,0);J['el'+k]=B('el'+k,J['sh'+k],0,-L_UA,0);J['wr'+k]=B('wr'+k,J['el'+k],0,-L_FA,0);J['hd'+k]=B('hd'+k,J['wr'+k],0,0,0);
   J['hp'+k]=B('hp'+k,J.pelvis,.09*s,-.04,0);J['kn'+k]=B('kn'+k,J['hp'+k],0,-L_TH,0);J['an'+k]=B('an'+k,J['kn'+k],0,-L_SH,0);J['ft'+k]=B('ft'+k,J['an'+k],0,0,0)});   // L = +x (izquierda del personaje, que mira a +z)
  J.head.scale.setScalar(HEADK);J.grip=B('grip',J.hdR,0,-.075,.0);J.gripL=B('gripL',J.hdL,0,-.075,0);J.back=B('back',J.chest,0,.1,-.125);
  this.S={};this.vel={};this.gph=0;this.f=0;this.face=0;this.faceT=0;this.loco=0;this.last=null;this.look=null;this.cloth=[];this.rodTip=null;this.blink=0;this.t=0;this.parts=[];}
 // ── apariencia ── look = {app, ar, helm, boot, gear, hood:'up'|'down'}. Se reconstruye solo si cambia.
 setLook(look){const key=JSON.stringify(look||{});if(key===this.lookKey)return;this.lookKey=key;this.look=look||{};
  this.parts.forEach(m=>{m.parent&&m.parent.remove(m);m.traverse(o=>o.geometry&&o.geometry.dispose())});this.parts=[];this.cloth.forEach(c=>{this.world.remove(c.mesh);c.mesh.geometry.dispose()});this.cloth=[];
  const a=Object.assign({g:'m',hair:'cut',hc:'#5a3a22',skin:'#e0b48a',col:'#8a3a34',eye:'#2a1a14',face:0},this.look.app||{}),GR=this.look.gear||{},fem=a.g==='f',O=this.look.outfit||{},Bd=BODY[O.build&&BODY[O.build]?O.build:(fem?'f':'m')];this.Bd=Bd;this.fem=fem;this.O=O;this.stoop=O.build==='anciano';
  this.root.scale.setScalar(HS*Bd.k);
  const J=this.J,skin=a.skin,shirt=tone(this.look.ar||a.col),pants=tone(GR.lg||a.pants||'#4a4052',.8,.85),boot=this.look.boot?tone(this.look.boot,.9,.85):'#5a3e2c',glove=GR.gl?tone(GR.gl,.9,.9):null,
   hairC=tone(a.hc,.9,.92),eye=a.eye,plate=!!GR.pl,metal=this.look.ar?mixc(this.look.ar,METAL,.25):METAL;this.col={skin,shirt,pants,boot,hairC,metal};
  const TEXOF={[shirt]:['tela',26],[shade(shirt,.95)]:['tela',26],[shade(shirt,.88)]:['tela',26],[pants]:['tela',26],[shade(pants,.95)]:['tela',26],[boot]:['cuero',22],[LEATHER]:['cuero',22],[hairC]:['pelo',40],[metal]:['metal',18]};   // detalle de superficie por pieza (materials3d DET_*)
  const add=(bone,geo,c,o={})=>{const tx=o.mat&&o.mat.tex!=null?null:TEXOF[c];const mo={flat:1,rim:RIM,chr:1,...(c===skin?{skin:1}:{}),...(tx?{tex:tx[0],texS:tx[1]}:{}),...(o.mat||{})};if(mo.tex!=null){mo.texS=(mo.texS||14)*.28;mo.texA=.6;mo.texB=0}   // sin relieve: con bandas toon, un bump pequeño salta de banda y se ve como camuflaje   // en personajes el detalle va grande y suave (a su tamaño en pantalla, lo fino se ve como ruido)
   const m=new THREE.Mesh(geo,toon(c,mo));m.castShadow=true;m.receiveShadow=true;if(o.ink!==0)m.add(hull(geo,o.ink||INKW));
   if(o.pos)m.position.set(...o.pos);if(o.rot)m.rotation.set(...o.rot);bone.add(m);this.parts.push(m);return m};
  const raw=(bone,geo,mat,o={})=>{const m=new THREE.Mesh(geo,mat);if(o.pos)m.position.set(...o.pos);bone.add(m);this.parts.push(m);return m};
  // TORSO ── pelvis (pantalón), abdomen y pecho (túnica o peto), cinturón con hebilla, cuello de la túnica
  add(J.pelvis,loft([[-.12,Bd.hip[0]*.82,Bd.hip[1]*.8],[-.05,Bd.hip[0],Bd.hip[1]],[.03,Bd.hip[0]*.97,Bd.hip[1]*.97],[.1,Bd.wa[0]*1.02,Bd.wa[1]*1.02]],8),pants);
  add(J.spine,loft([[-.04,Bd.wa[0]*1.03,Bd.wa[1]*1.03],[.08,Bd.wa[0]*1.06,Bd.wa[1]*1.05,0,.005],[.22,Bd.ch[0]*.92,Bd.ch[1]*.95,0,.01]],8),shirt);
  const chest=[[-.03,Bd.ch[0]*.92,Bd.ch[1]*.95,0,.01],[.06,Bd.ch[0],Bd.ch[1],0,.012],[.13,Bd.ch[0]*1.03,Bd.ch[1]*1.02,0,.008],[.18,Bd.sh*.93,Bd.ch[1]*.82],[.215,Bd.neck*1.9,Bd.neck*1.6,0,-.005]];
  if(fem)chest.splice(2,0,[.1,Bd.ch[0]*1.0,Bd.ch[1]*1.16,0,.03]);
  add(J.chest,loft(chest,8),shirt);
  add(J.pelvis,loft([[.035,Bd.wa[0]*1.12,Bd.wa[1]*1.14],[.085,Bd.wa[0]*1.1,Bd.wa[1]*1.12]],10),LEATHER,{ink:.013});                  // cinturón
  add(J.pelvis,box(.055,.045,.02,0,.06,Bd.wa[1]*1.14+.004),'#c8a050',{ink:.008});                                                   // hebilla
  add(J.chest,loft([[.19,Bd.neck*1.75,Bd.neck*1.5],[.235,Bd.neck*1.35,Bd.neck*1.2]],8),shade(shirt,.82),{ink:.012});                 // cuello de la túnica
  // FALDA corta de la túnica (rígida, a los lados) — los faldones de delante/detrás son tela con física (más abajo)
  {const O2=this.look.outfit||{},LN={rodilla:.42,larga:.66}[O2.skirt]||.14,sk=O2.skirtC?tone(O2.skirtC,.85,.85):shade(shirt,.88),fl=LN>.3?1.55:1.2;   // túnica larga: falda acampanada rígida a los lados (los faldones de tela van delante y detrás)
   add(J.pelvis,loft([[.04,Bd.hip[0]*1.08,Bd.hip[1]*1.1],[-LN*.55,Bd.hip[0]*(1+fl*.15)*1.08,Bd.hip[1]*(1+fl*.12)*1.08],[-LN,Bd.hip[0]*fl,Bd.hip[1]*fl*.92]],10,{cap:false}),sk,{ink:.013,mat:{side:THREE.DoubleSide,tex:'tela',texS:26}})}
  if(plate){ // PETO de placas: carcasa algo más grande que el pecho, nervio central y faldar
   add(J.chest,loft([[-.01,Bd.ch[0]*1.0,Bd.ch[1]*1.08,0,.015],[.07,Bd.ch[0]*1.08,Bd.ch[1]*1.1,0,.02],[.14,Bd.ch[0]*1.1,Bd.ch[1]*1.06,0,.012],[.19,Bd.sh*.9,Bd.ch[1]*.9]],8),metal,{mat:{}});
   add(J.chest,box(.025,.17,.03,0,.08,Bd.ch[1]*1.1+.02),shade(metal,1.15),{ink:.008});
   add(J.spine,loft([[-.02,Bd.wa[0]*1.12,Bd.wa[1]*1.14],[.12,Bd.wa[0]*1.12,Bd.wa[1]*1.12]],8),shade(metal,.9));}
  // CUELLO y CABEZA (cara hacia +z). Lote R3D-HEROE-NR: la cara se diseña por ESTRUCTURA DE VALORES, como en los ARPG pintados (NRftW): a tamaño de juego
  // mide ~12 px, así que lo que se lee son manchas: CUENCAS oscuras bajo una ceja marcada, NARIZ y pómulos que cogen luz, BOCA oscura y mentón. El blanco
  // del ojo, el iris y el brillo solo se aprecian en el editor. La cabeza tiene una ARISTA al frente (anillo con vértice en +z): nariz sobre la arista y cada
  // ojo en su faceta inclinada; surf(x,y) da la z y el giro de la faceta para apoyar ahí cada rasgo (sin que floten).
  add(J.neck,loft([[-.03,Bd.neck,Bd.neck*.95],[.09,Bd.neck*.92,Bd.neck*.9]],7),skin,{ink:.012});
  const hk=Bd.head;const head=[[-.05,.026,.03,0,.056],[-.022,.05,.056,0,.04],[.018,.074,.08,0,.016],[.062,.082,.092,0,.005],[.115,.08,.094,0,-.006],[.168,.06,.077,0,-.01],[.2,.028,.038,0,-.01]].map(s=>[s[0],s[1]*hk,s[2]*hk,s[3],s[4]*hk]);
  add(J.head,loft(head,8,{rot:0}),skin,{ink:.011});
  const ringAt=y=>{for(let i=0;i<head.length-1;i++){const p=head[i],q=head[i+1];if(y>=p[0]&&y<=q[0]){const u=(y-p[0])/(q[0]-p[0]);return[lerp(p[1],q[1],u),lerp(p[2],q[2],u),lerp(p[4],q[4],u)]}}return[head[0][1],head[0][2],head[0][4]]};
  const surf=(x,y)=>{const[rx,rz,oz]=ringAt(y),c=Math.SQRT1_2,ax=Math.abs(x);let z,d;if(ax<=c*rx){d=-(rz-c*rz)/(c*rx);z=rz+d*ax}else{d=-(c*rz)/(rx-c*rx);z=c*rz+d*(ax-c*rx)}return{z:z+oz,yaw:Math.atan(-d)*Math.sign(x)}};
  const onF=(m,x,y,dz,tilt=0)=>{const q=surf(x,y);m.position.set(x,y,q.z+dz);m.rotation.set(0,q.yaw,tilt);return m};
  const bas=c=>new THREE.MeshBasicMaterial({color:c});
  const EY=.07,EX=.031*hk,dark=shade(skin,.58);
  [1,-1].forEach(s=>{onF(add(J.head,box(.046*hk,.026,.006),dark,{ink:0,mat:{skin:1}}),EX*s,EY-.002,-.001);                      // cuenca (mancha oscura que se lee de lejos)
   onF(add(J.head,box(.054*hk,.017,.016),skin,{ink:0}),.03*s*hk,.089,-.004,.1*s)});                                            // arco de la ceja (coge luz y sombrea la cuenca)
  this.eyes=[];const white=mixc(skin,'#ece4d4',.62);
  [1,-1].forEach(s=>{this.eyes.push(onF(raw(J.head,box(.025*hk,.012,.004),bas(shade(white,.86))),EX*s,EY,.003));
   this.eyes.push(onF(raw(J.head,box(.012*hk,.012,.004),bas(new THREE.Color(eye).multiplyScalar(.75))),(EX-.002*hk)*s,EY,.0045));
   this.eyes.push(onF(raw(J.head,box(.004,.004,.002),bas('#f4ecdc')),(EX-.005*hk)*s,EY+.003,.0062))});                          // brillo (solo se ve en el editor)
  const bt=a.face===2?-.1:a.face===3?.24:.14;                                                                                     // ceño: dulce / clásica / seria
  [1,-1].forEach(s=>onF(raw(J.head,box(.042*hk,.012,.008),bas(shade(hairC,.55))),.031*s*hk,.094,.006,bt*s));                    // cejas
  {const n=[.026,.05,.083].map((y,i)=>[y,[.017,.014,.008][i]*hk,[.015,.013,.006][i]*hk,0,surf(0,y).z+[.016,.012,.002][i]*hk]);   // nariz sobre la arista
   add(J.head,loft(n,4,{rot:Math.PI/4}),shade(skin,1.04),{ink:0,mat:{skin:1}});
   onF(raw(J.head,box(.024*hk,.005,.006),bas(shade(skin,.42))),0,.024,.012*hk)}                                                    // sombra de las aletas
  [1,-1].forEach(s=>add(J.head,box(.018,.034,.024,.081*s*hk,.06,-.004),shade(skin,.9),{ink:.007,mat:{skin:1}}));                 // orejas
  if(a.face===1)[1,-1].forEach(s=>[0,1,2].forEach(k=>onF(raw(J.head,box(.006,.006,.003),bas(shade(skin,.7))),(.026+k*.011)*s*hk,.046-k*.004,.002)));   // pecas
  onF(raw(J.head,box(.036*hk,.0065,.004),bas(shade(skin,a.face===3?.38:.48))),0,.018,.001);                                       // boca
  onF(add(J.head,box(.03*hk,.012,.01),shade(skin,1.05),{ink:0,mat:{skin:1}}),0,-.026,-.004);                                     // mentón (coge luz)
  // PELO o YELMO
  const helm=this.look.helm,HD=HAIR[a.hair]||HAIR.cut;this.tailDefs=[];
  if(helm){const hc=mixc(helm,METAL,.2);add(J.head,loft([[.035,.093*hk,.104*hk,0,-.004],[.12,.091*hk,.105*hk,0,-.008],[.18,.07*hk,.087*hk,0,-.012],[.225,.03,.04,0,-.012]],8),hc);
   add(J.head,loft([[.03,.099*hk,.11*hk,0,-.004],[.06,.099*hk,.11*hk,0,-.004]],8),shade(hc,.8),{ink:.010});                                  // ala remachada
   add(J.head,box(.018,.07,.016,0,.06,.104*hk),shade(hc,1.1),{ink:.008});                                                                      // nasal
   const tier=(this.look.gear||{}).ht||'';if(/mitril|adam|runita|oricalco|celest/.test(tier))add(J.head,box(.012,.07,.14,0,.25,-.01),'#a83a32',{ink:.008}); // cimera
   else if(/hierro|acero|plata/.test(tier))add(J.head,cone(.018,.06,4).translate(0,.255,-.01),shade(hc,1.1),{ink:.007})}
  else if(HD.cap){const hc=hairC,n0=this.parts.length;
   add(J.head,loft([[.095,.087*hk,.098*hk,0,-.01],[.15,.08*hk,.096*hk,0,-.012],[.19,.06*hk,.078*hk,0,-.014],[.222,.025*hk,.034*hk,0,-.014]],8),hc,{ink:.013});    // casquete
   add(J.head,ico(.072*hk,1.12,.9+HD.back[0],.8,.18,3).translate(0,.11-HD.back[0]*.45,-.045*hk),hc,{ink:.013});                                    // nuca
   [1,-1].forEach(s=>add(J.head,box(.016,.05,.04,.08*s*hk,.075,.0),hc,{ink:.007}));                                                                 // patillas
   if(HD.locks)[1,-1].forEach(s=>add(J.head,loft([[.11,.025,.03],[.11-.14*HD.locks,.018,.024,.005*s,.0]],5).translate(.085*s*hk,0,.01),hc,{ink:.009}));
   if(HD.top==='spiky')for(let i=0;i<7;i++){const an=i/7*Math.PI*2,r=.05*hk;add(J.head,cone(.025,.08,4).rotateX(-.5).rotateY(an+Math.PI).translate(Math.sin(an)*r,.2,Math.cos(an)*r-.015),hc,{ink:.008})}
   if(HD.top==='fringe')add(J.head,loft([[.15,.07*hk,.03,.0,.08*hk],[.085,.06*hk,.02,.025,.095*hk]],5).rotateZ(-.15),hc,{ink:.009});
   if(HD.top==='curly')for(let i=0;i<14;i++){const an=hash(i,1,4)*Math.PI*2,el=hash(i,2,4)*1.1,r=.088*hk;add(J.head,ico(.03,1,1,1,.3,i),hc,{ink:.007,pos:[Math.sin(an)*Math.cos(el)*r,.13+Math.sin(el)*.08,Math.cos(an)*Math.cos(el)*r-.02]})}
   if(HD.top==='bun')add(J.head,ico(.05,1,1,1,.2,5).translate(0,.19,-.08),hc,{ink:.009});
   (HD.tails||[]).forEach(tp=>this.tailDefs.push({at:tp,col:hc}));for(let i=n0;i<this.parts.length;i++)this.parts[i].userData.hair=1}
  // BRAZOS: manga de la túnica, brazal o guante, mano
  ['L','R'].forEach((k,i)=>{const s=i?-1:1,A=Bd.arm;
   add(J['sh'+k],loft([[.045,A[0]*.9,A[0]*.95],[0,A[0]*1.12,A[0]*1.08],[-.14,A[0]*.98,A[0]],[-.28,A[1]*1.02,A[1]*1.02]],7),shirt);
   add(J['el'+k],loft([[.03,A[1]*.95,A[1]*.95],[-.06,A[2]*1.12,A[2]*1.1],[-.23,A[3]*1.02,A[3]*1.04]],7),O.rolled?skin:shade(shirt,.95));
   if(O.rolled)add(J['el'+k],loft([[.04,A[1]*1.18,A[1]*1.18],[-.03,A[1]*1.2,A[1]*1.2]],7),shade(shirt,.85),{ink:.009});                    // manga arremangada
   if(O.wraps)[0,1,2].forEach(q=>add(J['el'+k],loft([[-.09-q*.045,A[2]*1.08,A[2]*1.08],[-.115-q*.045,A[2]*1.08,A[2]*1.08]],7),q%2?'#bdb196':'#cfc4a8',{ink:.006}));   // vendas
   if(!O.rolled&&!O.wraps||glove)add(J['el'+k],loft([[-.11,A[2]*1.16,A[2]*1.14],[-.235,A[3]*1.24,A[3]*1.24]],7),glove||LEATHER,{ink:.010});                    // brazal
   const hc=glove||skin,HK=HANDK;add(J['hd'+k],loft([[.005,.024*HK,.036*HK],[-.06*HK,.026*HK,.042*HK,0,.006],[-.095*HK,.016*HK,.03*HK,0,.01]],6),hc,{ink:.010});   // NRftW: manos rotundas    // mano (palma hacia dentro: estrecha en x)
   add(J['hd'+k],box(.014*HK,.036*HK,.016*HK,-.018*s*-1,-.035*HK,.034*HK).rotateX(.3),hc,{ink:.007});                                              // pulgar
   if(plate)add(J['sh'+k],ico(.085,1.15,.75,1.05,.15,i+2).translate(.02*s,.02,0),metal,{ink:.013})});                              // hombreras
  // PIERNAS: pantalón, caña de la bota con vuelta, pie
  ['L','R'].forEach((k,i)=>{const L=Bd.leg;
   add(J['hp'+k],loft([[.05,L[0]*1.05,L[0]*1.05],[-.06,L[0]*1.02,L[0]],[-.42,L[1],L[1]]],7),pants);
   add(J['kn'+k],loft([[.03,L[1]*.98,L[1]*.98],[-.1,L[2]*1.1,L[2]*1.12,0,-.006],[-.4,L[3],L[3]*1.04]],7),shade(pants,.95));
   add(J['kn'+k],loft([[-.2,L[2]*1.2,L[2]*1.22],[-.44,L[3]*1.32,L[3]*1.36]],7),boot,{ink:.012});                                  // caña (más ancha abajo: bota pesada)                                  // caña
   add(J['kn'+k],loft([[-.19,L[2]*1.24,L[2]*1.26],[-.23,L[2]*1.24,L[2]*1.26]],7),shade(boot,1.25),{ink:.009});                     // vuelta
   const FK=FOOTK,foot=loft([[-.065,.045*FK,.04*FK,0,-.01],[0,.052*FK,.05*FK,0,-.012],[.09,.055*FK,.04*FK,0,.0],[.17,.042*FK,.026*FK,0,.012]],6).rotateX(Math.PI/2).translate(0,-.045,.01);
   add(J['ft'+k],foot,boot,{ink:.012});add(J['ft'+k],box(.1*FOOTK,.018,.23,0,-.073,.045),shade(boot,.6),{ink:.007})});                     // pie + suela
  // EQUIPO: escudo y arma (en la mano o a la espalda; lo decide update() según la pose)
  this.weapon=null;this.weaponBack=null;this.shield=null;this.tool={};
  if(GR.wp)this.weapon=this._weapon(GR.wp);
  if(GR.sh){const sc=tone(GR.sh,.95,.95),g=new THREE.Group();const sh=loft([[.2,.0,.0],[.17,.13,.025],[.02,.15,.03],[-.14,.1,.025],[-.24,.0,.0]],6,{rot:0}).rotateY(Math.PI/2);
   sh.scale(.75,.75,.75);const m=new THREE.Mesh(sh,toon(sc,{flat:1,rim:RIM,chr:1}));m.castShadow=true;m.add(hull(sh,.016));g.add(m);const bs=new THREE.Mesh(ico(.035,1,1,.5),toon(shade(sc,1.3),{flat:1,chr:1}));bs.position.set(.03,0,0);g.add(bs);this.shield=g;this.parts.push(g)}
  // VESTUARIO (Lote R3D-F3b · propuestas de diseño): piezas como DATOS en look.outfit (héroe y PNJ comparten modelo). Ver docs/style-reference/r3d/disenos-personaje.html.
  //  build 'm'|'f'|'robusto'|'anciano' · top 'gambeson'|'brigantina'|'chaleco' · topC · skirt 'corta'|'rodilla'|'larga' · skirtC · apron col · tabard col (+emblem col)
  //  capelet col · fur col · pauldron col · bag col · pouches · knife · quiver · rolled · wraps · mask col · hood 'alta'|'baja' (+hoodC) · beard 'corta'|'larga'
  //  hat 'panuelo'|'gorro' (+hatC) · rope col (cinturón de cuerda) · amulet col · scarf false|col
  {const hk=Bd.head,ch=Bd.ch,top=O.topC?tone(O.topC,.85,.9):null;
   if(O.top==='gambeson'){const gc=top||shade(shirt,1.05);add(J.chest,loft([[-.02,ch[0]*1.06,ch[1]*1.1,0,.013],[.07,ch[0]*1.1,ch[1]*1.12,0,.015],[.15,ch[0]*1.1,ch[1]*1.06,0,.01],[.195,Bd.sh*.92,ch[1]*.9]],8),gc,{mat:{tex:'tela',texS:22}});
    add(J.spine,loft([[-.03,Bd.wa[0]*1.12,Bd.wa[1]*1.14],[.2,ch[0]*1.04,ch[1]*1.08]],8),gc,{mat:{tex:'tela',texS:22}});
    [-.0,.06,.12].forEach(y=>add(J.chest,loft([[y,ch[0]*1.12,ch[1]*1.14,0,.014],[y+.012,ch[0]*1.12,ch[1]*1.14,0,.014]],8),shade(gc,.72),{ink:0}));             // costuras del acolchado
    [.04,.12].forEach(y=>add(J.spine,loft([[y,Bd.wa[0]*1.16,Bd.wa[1]*1.18],[y+.012,Bd.wa[0]*1.16,Bd.wa[1]*1.18]],8),shade(gc,.72),{ink:0}))}
   if(O.top==='brigantina'){const bc=top||'#4a3426';add(J.chest,loft([[-.02,ch[0]*1.05,ch[1]*1.12,0,.015],[.08,ch[0]*1.1,ch[1]*1.13,0,.018],[.16,ch[0]*1.08,ch[1]*1.04,0,.01]],8),bc,{mat:{tex:'cuero',texS:18}});
    add(J.spine,loft([[-.04,Bd.wa[0]*1.14,Bd.wa[1]*1.16],[.2,ch[0]*1.04,ch[1]*1.1]],8),bc,{mat:{tex:'cuero',texS:18}});
    for(let r=0;r<3;r++)for(let c=-2;c<=2;c++)add(J.chest,ico(.009).translate(c*.05,.0+r*.06,ch[1]*1.16+.012-Math.abs(c)*.012),'#b8a070',{ink:0})}           // remaches
   if(O.top==='chaleco'){const vc=top||'#5a4a3a';[1,-1].forEach(sd=>add(J.chest,loft([[-.02,ch[0]*.56,ch[1]*1.12,ch[0]*.52*sd,.012],[.17,ch[0]*.5,ch[1]*.98,ch[0]*.46*sd,.004]],6),vc,{mat:{tex:'cuero',texS:16}}));
    add(J.spine,loft([[-.03,Bd.wa[0]*1.1,Bd.wa[1]*1.12],[.2,ch[0]*1.03,ch[1]*1.06]],8),vc,{mat:{tex:'cuero',texS:16}})}
   if(O.capelet){const cc=tone(O.capelet,.85,.85);add(J.chest,loft([[.235,Bd.neck*1.7,Bd.neck*1.6,0,-.01],[.17,Bd.sh*1.08,ch[1]*1.25,0,-.01],[.03,Bd.sh*1.25,ch[1]*1.42,0,-.02]],9,{cap:false}),cc,{mat:{tex:'tela',texS:20,side:THREE.DoubleSide},ink:.012})}
   if(O.fur){const fc=tone(O.fur,.9,.9);for(let i=0;i<11;i++){const an=i/11*Math.PI*2;add(J.chest,ico(.042,1.1,.8,1,.35,i).translate(Math.sin(an)*Bd.neck*1.9,.215,Math.cos(an)*Bd.neck*1.75-.01),fc,{ink:.008,mat:{tex:'pelo',texS:40}})}}
   if(O.pauldron){const pc=mixc(O.pauldron,METAL,.3);add(J.shL,ico(.095,1.2,.72,1.1,.12,7).translate(.02,.03,0),pc,{ink:.013,mat:{tex:'metal',texS:20}});
    add(J.chest,box(.03,.02,ch[1]*2.4,Bd.sh*.55,.17,0).rotateZ(-.5),LEATHER,{ink:.006})}
   if(O.bag){const bc=tone(O.bag,.85,.85);const st=new THREE.TorusGeometry(ch[0]*1.25,.012,4,14).scale(1,1.0,ch[1]*1.25/(ch[0]*1.25)).rotateZ(.75).translate(0,.06,.008);add(J.chest,st,shade(bc,.8),{ink:.005});
    add(J.pelvis,loft([[-.12,.06,.03],[.0,.07,.04],[.04,.06,.035]],6,{rot:Math.PI/4}).translate(-Bd.hip[0]*1.1,0,.02),bc,{ink:.01,mat:{tex:'cuero',texS:24}})}
   if(O.pouches)[[.6,1],[-.55,1],[.95,-.3]].forEach(([u,f],q)=>add(J.pelvis,box(.045,.055,.03,Bd.wa[0]*u*1.1,.03,Bd.wa[1]*1.18*f).rotateY(u*.6),q?LEATHER:shade(LEATHER,1.2),{ink:.006}));
   if(O.knife){add(J.pelvis,box(.025,.1,.02,Bd.wa[0]*.7,.0,-Bd.wa[1]*1.1).rotateZ(.4),'#3a2a20',{ink:.006})}
   if(O.quiver){const q=new THREE.CylinderGeometry(.04,.035,.42,6).rotateZ(.35).translate(.05,-.05,-ch[1]-.05);add(J.chest,q,'#5a3e2c',{ink:.01,mat:{tex:'cuero',texS:20}});
    for(let i=0;i<4;i++)add(J.chest,box(.01,.12,.01,.12+i*.012-.0,.16+i*.006,-ch[1]-.05).rotateZ(.35),'#d8d0c0',{ink:0})}
   if(O.amulet)add(J.chest,ico(.016,1,1,.5).translate(0,.11,ch[1]*1.13+.01),O.amulet,{ink:.005});
   if(O.mask){const mc=tone(O.mask,.85,.85);this.mask=add(J.head,loft([[-.02,.07*hk,.08*hk,0,.018],[.04,.083*hk,.098*hk,0,.01],[.065,.08*hk,.097*hk,0,.008]],8),mc,{ink:.01,mat:{tex:'tela',texS:30}})}
   if(O.beard){const bc2=hairC,long=O.beard==='larga';   // barba: masa en la mitad DELANTERA baja de la cara (mandíbula y mentón), bigote aparte
    add(J.head,loft([[.028,.066*hk,.036*hk,0,.072*hk],[.005,.06*hk,.04*hk,0,.076*hk],[-.025,.04*hk,.034*hk,0,.075*hk],[long?-.17:-.05,long?.012:.018,long?.012:.016,0,long?.085*hk:.08*hk]],7),bc2,{ink:.01,mat:{tex:'pelo',texS:40}});
    add(J.head,box(.06*hk,.014,.02,0,.04,.097*hk),bc2,{ink:.006})}
   if(O.hat==='panuelo'){const hc2=tone(O.hatC||'#7a3a30',.85,.85),pl=this.parts.length;add(J.head,loft([[.11,.09*hk,.1*hk,0,-.01],[.17,.08*hk,.096*hk,0,-.012],[.22,.03*hk,.04*hk,0,-.014]],8),hc2,{ink:.012,mat:{tex:'tela',texS:30}});add(J.head,ico(.03).translate(0,.13,-.1),hc2,{ink:.008})}
   if(O.hat==='gorro'){const hc2=tone(O.hatC||'#4a3a30',.85,.85);add(J.head,loft([[.1,.098*hk,.108*hk,0,-.01],[.2,.085*hk,.095*hk,0,-.015],[.26,.03,.03,-.02,-.06]],8),hc2,{ink:.012,mat:{tex:'tela',texS:24}});add(J.head,loft([[.09,.104*hk,.114*hk,0,-.01],[.125,.104*hk,.114*hk,0,-.01]],8),shade(hc2,.8),{ink:.009})}
   if(O.hood){const hc2=tone(O.hoodC||O.capelet||'#3a3440',.85,.85);
    if(O.hood==='alta'){add(J.head,loft([[-.03,.078*hk,.092*hk,0,-.045],[.06,.11*hk,.122*hk,0,-.02],[.15,.106*hk,.117*hk,0,-.02],[.23,.072*hk,.082*hk,0,-.045],[.29,.0,.0,0,-.09]],8),hc2,{ink:.014,mat:{tex:'tela',texS:22}});this.parts.forEach(m=>{if(m.userData.hair)m.visible=false})}
    else add(J.chest,loft([[.2,Bd.neck*2.4,Bd.neck*2.2,0,-.035],[.25,Bd.neck*2.2,Bd.neck*2.1,0,-.06],[.27,Bd.neck*1.4,Bd.neck*1.2,0,-.1]],8),hc2,{ink:.012,mat:{tex:'tela',texS:22}})}
   if(O.rope){add(J.pelvis,loft([[.04,Bd.wa[0]*1.14,Bd.wa[1]*1.16],[.065,Bd.wa[0]*1.14,Bd.wa[1]*1.16]],10),O.rope,{ink:.006});add(J.pelvis,box(.012,.14,.012,.05,-.03,Bd.wa[1]*1.16),O.rope,{ink:.004})}
   if(O.tabard){const tc=tone(O.tabard,.9,.9);[1,-1].forEach(f=>add(J.chest,box(ch[0]*1.15,.26,.012,0,.06,f*(ch[1]*1.16+.012)),tc,{ink:.01,mat:{tex:'tela',texS:22}}));
    if(O.emblem)add(J.chest,loft([[.14,.04,.004],[.06,.04,.004],[.02,.0,.0]],4,{rot:Math.PI/4}).translate(0,-.01,ch[1]*1.16+.022),O.emblem,{ink:.006})}
   if(O.apron){const ac=tone(O.apron,.85,.85);add(J.chest,box(ch[0]*1.2,.24,.012,0,.04,ch[1]*1.15+.014),ac,{ink:.01,mat:{tex:O.apronLeather?'cuero':'tela',texS:22}});
    add(J.chest,box(.015,.01,.2,ch[0]*.5,.17,0),shade(ac,.8),{ink:0});add(J.chest,box(.015,.01,.2,-ch[0]*.5,.17,0),shade(ac,.8),{ink:0})}}
  // ROPA CON FÍSICA
  this.wantCape=GR.cp?tone(GR.cp,.85,.85):null;this.hoodMode=this.look.hood||'down';this.hood=null;this.cowl=null;
  if(this.wantCape){const cc=this.wantCape;
   this.hood=add(J.head,loft([[-.03,.075*hk,.09*hk,0,-.045],[.06,.108*hk,.12*hk,0,-.02],[.15,.104*hk,.115*hk,0,-.02],[.23,.07*hk,.08*hk,0,-.045],[.285,.0,.0,0,-.085]],8),shade(cc,.85),{ink:.019});
   this.hoodFace=raw(J.head,loft([[.0,.07*hk,.01,0,.096*hk],[.2,.06*hk,.01,0,.09*hk]],8,{rot:0}),new THREE.MeshBasicMaterial({color:'#0e0a12'}));      // sombra dentro de la capucha
   this.hoodEyes=[1,-1].map(s=>raw(J.head,box(.022,.012,.004,.032*s*hk,.074,.104*hk),glow('#ffb04a',2.4)));
   this.cowl=add(J.chest,loft([[.15,Bd.sh*.78,Bd.ch[1]*.95,0,-.02],[.22,Bd.neck*2.3,Bd.neck*2.1,0,-.03],[.26,Bd.neck*1.9,Bd.neck*1.8,0,-.05]],8),shade(cc,.9),{ink:.016});}
  // BUFANDA por defecto (decisión del dueño, 17 oct 2026: las capas son objetos raros). Vuelta rígida al cuello + dos puntas de tela con física.
  // Si hay capa equipada, la bufanda no se ve (la capa trae su cuello/capucha). Color: S.app.scarf o mostaza apagado.
  this.scarfC=this.wantCape||O.scarf===false?null:tone((typeof O.scarf==='string'?O.scarf:null)||a.scarf||'#b8862e',.85,.9);
  if(this.scarfC){add(J.chest,loft([[.17,Bd.neck*2.05,Bd.neck*1.95,0,-.004],[.205,Bd.neck*2.15,Bd.neck*2.05,0,.0],[.25,Bd.neck*1.7,Bd.neck*1.65,0,.004]],9),this.scarfC,{ink:.014});
   add(J.chest,ico(.04,1.1,.9,.8,.2,9).translate(Bd.neck*1.25,.2,Bd.neck*1.55),shade(this.scarfC,.92),{ink:.010})}    // nudo
  this._buildCloth(shirt);this._applyHood();this.clothReset=true;}
 _applyHood(){if(!this.hood)return;const up=this.hoodMode==='up';this.hood.visible=this.hoodFace.visible=up;this.hoodEyes.forEach(e=>e.visible=up);this.cowl.visible=!up;
  this.parts.forEach(p=>{if(p.userData.hair)p.visible=!up})}
 setHood(m){if(this.hoodMode===m)return;this.hoodMode=m;this._applyHood()}
 // ── armas y herramientas: grupos con la empuñadura en el origen y la hoja hacia −y (rotar para apuntar) ──
 _weapon(wp){const g=new THREE.Group(),c=wp.col||METAL,put=(geo,col,ink=.02,o={})=>{const m=new THREE.Mesh(geo,o.mat||toon(col,{flat:1,rim:RIM,chr:1}));m.castShadow=true;if(ink)m.add(hull(geo,ink));g.add(m);return m};
  const wood='#6a4a2e',grip=LEATHER;
  if(wp.t==='bow'){const pts=[];for(let i=0;i<=8;i++){const u=i/8-.5;pts.push(new V3(0,u*1.0,Math.cos(u*Math.PI)*-.12+.06))}
   const crv=new THREE.CatmullRomCurve3(pts);put(new THREE.TubeGeometry(crv,10,.018,5),wp.wk==='xbow'?wood:c,.014);put(box(.04,.13,.04),grip,.012);
   const sg=new THREE.BufferGeometry().setFromPoints([pts[0],new V3(0,0,-.06),pts[8]]);const s=new THREE.Line(sg,new THREE.LineBasicMaterial({color:'#e8e0d0'}));g.add(s);g.userData.string=s;g.userData.tips=[pts[0],pts[8]];g.userData.kind='bow';
   if(wp.wk==='xbow'){g.clear();put(box(.05,.05,.62,0,0,.2),wood,.014);const arms=new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new V3(-.3,0,.42),new V3(0,0,.5),new V3(.3,0,.42)]),8,.016,4);put(arms,c,.012);g.userData.kind='xbow'}}
  else if(wp.t==='staff'&&wp.wk==='spear'){put(loft([[.3,.018,.018],[-1.35,.016,.016]],6),wood,.012);put(loft([[-1.33,.028,.012],[-1.42,.034,.012],[-1.6,.002,.002]],4,{rot:0}),c,.012);put(loft([[-1.3,.024,.024],[-1.34,.024,.024]],6),LEATHER,.008);g.userData.kind='staff'}   // lanza (PNJ guardia)
  else if(wp.t==='staff'){const L=wp.wk==='scepter'?.55:1.45;put(loft([[.25,.02,.02],[-L+.3,.018,.018],[-L+.22,.03,.03]],6),wood,.014);
   const orb=new THREE.Mesh(ico(.06,1,1,1,.1),glow(c,1.6));orb.position.y=-L+.16;g.add(orb);g.userData.orb=orb;put(cone(.05,.12,4).rotateX(Math.PI).translate(0,-L+.25,0),'#8a7a5a',.012);g.userData.kind='staff'}
  else{const k=wp.wk,Lb=k==='great'?.95:k==='dagger'?.3:.68,Wb=k==='great'?.07:k==='dagger'?.04:.055;g.userData.kind=k==='great'?'great':'sword';
   put(loft([[.02,.022,.022],[.13,.02,.02]],6),grip,.012);put(ico(.03,1,1,1,.1).translate(0,.15,0),'#c8a050',.012);                    // empuñadura y pomo
   put(box(k==='great'?.26:.18,.03,.04,0,0,0),'#c8a050',.014);                                                                            // guarda
   put(loft([[-.01,Wb*.5,.012],[-Lb*.85,Wb*.45,.011],[-Lb,.004,.004]],4,{rot:0}),c,.014)}                                                // hoja (sección de rombo)
  g.traverse(o=>{if(o.isMesh)o.castShadow=true});this.parts.push(g);return g}
 _tool(t,col){if(this.tool[t])return this.tool[t];const g=new THREE.Group(),put=(geo,c,ink=.016)=>{const m=new THREE.Mesh(geo,toon(c,{flat:1,rim:RIM,chr:1}));m.castShadow=true;if(ink)m.add(hull(geo,ink));g.add(m);return m},wood='#7a5232';
  if(t==='axe'||t==='pick'||t==='hammer'){put(loft([[.12,.018,.018],[-.62,.02,.02]],6),wood);
   if(t==='axe')put(loft([[0,.0,.06],[-.02,.012,.07],[-.17,.008,.09]],4).rotateZ(Math.PI/2).translate(.0,-.57,.0),col||METAL);
   else if(t==='pick')put(loft([[-.26,.004,.004],[0,.022,.025],[.26,.004,.004]],4).rotateZ(Math.PI/2).translate(0,-.58,0),col||METAL);
   else put(box(.08,.08,.18,0,-.58,0),col||METAL)}
  else if(t==='rod'){put(loft([[.15,.016,.016],[-1.3,.006,.006]],5),'#8a6a3a',.01);put(box(.04,.04,.04,0,.02,.025),'#3a3a3a',.008)}
  else if(t==='spoon'){put(loft([[.1,.012,.012],[-.3,.012,.012]],5),'#6a4a2a');put(ico(.035,1,.4,1).translate(0,-.32,0),'#a8a8b0')}
  else if(t==='saw'){put(box(.03,.12,.05,0,.02,0),wood);put(box(.008,.4,.09,0,-.2,.02),'#b8bec8')}
  else if(t==='food')put(ico(.05,1.2,.8,1,.2),col||'#c8742c');
  else if(t==='quill')put(loft([[.02,.004,.004],[-.18,.02,.004],[-.24,.0,.0]],4),'#f0ece0',.008);
  g.visible=false;this.J.grip.add(g);this.parts.push(g);this.tool[t]=g;return g}
 // ── ropa con física: capa (+ capucha), faldones de la túnica, coletas ──
 _buildCloth(shirt){const J=this.J,Bd=this.Bd,w=new V3();this.root.updateMatrixWorld(true);
  const toW=(bone,x,y,z)=>bone.localToWorld(w.set(x,y,z)).toArray();
  const mkMesh=(c,col,th)=>{const g=c.slab?c.cl.slabGeo():c.cl.ropeGeo(5,c.r0,c.r1);const m=new THREE.Mesh(g,toon(col,{flat:1,rim:RIM,chr:1,side:THREE.DoubleSide}));m.castShadow=m.receiveShadow=true;m.frustumCulled=false;
   const ink=new THREE.Mesh(g,inkMat(th));ink.frustumCulled=false;m.add(ink);c.mesh=m;this.world.add(m);this.cloth.push(c)};
  if(this.wantCape){const nx=7,ny=10;   // CAPA: fila superior anclada a los hombros por detrás del cuello; más ancha abajo; larga hasta media pantorrilla
   const rest=(i,j)=>{const u=i/(nx-1)-.5,v=j/(ny-1);return[u*lerp(Bd.sh*1.95,Bd.sh*3.1,v),.2-v*1.02,-Bd.ch[1]-.06-v*.07-Math.cos(u*Math.PI)*.02*(1-v)]};
   const anc=i=>{const u=i/(nx-1)-.5;return[u*Bd.sh*1.95,.2-Math.abs(u)*.03,-Bd.ch[1]*1.05+Math.abs(u)*.04]};
   const c={name:'capa',slab:1,nx,ny,anchor:J.chest,anc,rest,pins:[...Array(nx).keys()]};c.cl=new Cloth(nx,ny,(i,j)=>{const r=rest(i,j);return toW(J.chest,...r)},{pins:c.pins,th:.022*HS,rad:.012*HS,iters:7,damp:.982,drag:1.4,bendX:.2,bendY:.4});
   mkMesh(c,this.wantCape,.018*HS)}
  if(this.scarfC){   // puntas de la bufanda: tiras de 2×7 que salen del nudo; una cae por delante y otra se va hacia atrás por encima del hombro
   const nk=Bd.neck,K=[nk*1.25,.2,nk*1.55];
   [[.0,1,.36,.05],[.06,-1,.5,.045]].forEach(([dx,side,len,wd],q)=>{const nx=2,ny=7,rest=(i,j)=>{const v=j/(ny-1),u=i-.5;return side>0?[K[0]+dx+u*wd,K[1]-.02-v*len,K[2]+.03+v*.03]:[K[0]+.02+u*wd*.6,K[1]-.01-v*len*.25,K[2]-.02-v*(Bd.ch[1]*2.4)]};
    const c={name:'bufanda'+q,slab:1,nx,ny,anchor:J.chest,anc:i=>rest(i,0),rest,pins:[0,1]};c.cl=new Cloth(nx,ny,(i,j)=>toW(J.chest,...rest(i,j)),{pins:c.pins,th:.016*HS,rad:.012*HS,iters:6,damp:.978,drag:1.2,bendX:.6,bendY:.3});
    mkMesh(c,q?shade(this.scarfC,.88):this.scarfC,.013*HS)})}
  // FALDONES de la túnica (delante y detrás): 4×4, anclados al cinturón; los empujan los muslos al andar
  const O=this.O||{},LEN={corta:.28,rodilla:.5,larga:.72}[O.skirt]||.28;
  [1,-1].forEach(s=>{const ap=s>0&&O.apron,tb=O.tabard,len=ap?.56:tb?.52:LEN,wd=ap?1.5:tb?1.1:LEN>.4?1.75:1.25,ny=len>.4?6:4,nx=4,zz=s*(Bd.hip[1]*(ap?1.34:1.24)),rest=(i,j)=>{const u=i/(nx-1)-.5,v=j/(ny-1);return[u*Bd.hip[0]*wd*(1+v*.15),.03-v*len,zz+s*v*.03]};
   const skc=ap?tone(O.apron,.85,.85):tb?tone(O.tabard,.9,.9):O.skirtC?tone(O.skirtC,.85,.85):null;
   const c={name:s>0?'faldon_del':'faldon_tras',slab:1,nx,ny,anchor:J.pelvis,anc:i=>rest(i,0),rest,pins:[0,1,2,3]};c.cl=new Cloth(nx,ny,(i,j)=>toW(J.pelvis,...rest(i,j)),{pins:c.pins,th:.018*HS,rad:.012*HS,iters:5,damp:.975,drag:1.4,bendX:.4,bendY:.5});
   mkMesh(c,skc||shade(shirt,.82),.014*HS)});
  // COLETAS: cadena de 6 con anclaje en la cabeza
  (this.tailDefs||[]).forEach((td,k)=>{const n=6,len=.42,rest=(i,j)=>[td.at[0]*(1+j*.15),td.at[1]-j*len/(n-1),td.at[2]-j*.02];
   const c={name:'coleta'+k,rope:1,nx:1,ny:n,anchor:J.head,anc:()=>rest(0,0),rest,pins:[0],r0:.032*HS*1.0,r1:.012*HS};c.cl=new Cloth(1,n,(i,j)=>toW(J.head,...rest(i,j)),{pins:[0],rope:1,th:0,rad:.02*HS,iters:6,damp:.97,drag:.35,bendY:.5});
   mkMesh(c,td.col,.012*HS)})}
 // cápsulas del cuerpo en mundo (para la tela)
 _colliders(){const J=this.J,Bd=this.Bd,w=new V3(),P=(b,x,y,z)=>b.localToWorld(w.set(x,y,z)).toArray(),s=HS*Bd.k,C=[];
  C.push({a:P(J.pelvis,0,-.02,-.01),b:P(J.chest,0,.16,-.01),r:Bd.ch[1]*1.05*s,out:[0,0,-1]});                                   // torso
  C.push({a:P(J.chest,Bd.sh*.6,.14,-.02),b:P(J.chest,-Bd.sh*.6,.14,-.02),r:.085*s});                                              // hombros
  C.push({a:P(J.pelvis,Bd.hx,-.06,-.02),b:P(J.pelvis,-Bd.hx,-.06,-.02),r:Bd.hip[1]*1.05*s});                                      // caderas/nalgas
  ['L','R'].forEach(k=>{C.push({a:P(J['hp'+k],0,0,0),b:P(J['kn'+k],0,0,0),r:Bd.leg[0]*1.15*s});C.push({a:P(J['kn'+k],0,0,0),b:P(J['an'+k],0,0,0),r:Bd.leg[2]*1.25*s});
   C.push({a:P(J['sh'+k],0,0,0),b:P(J['el'+k],0,0,0),r:Bd.arm[0]*1.1*s})});
  C.push({a:P(J.head,0,.09,-.01),b:P(J.head,0,.09,-.01),r:.1*s*HEADK});C.push({a:P(J.neck,0,0,0),b:P(J.neck,0,.08,0),r:Bd.neck*1.4*s});
  if(this.weaponBack&&this.weaponBack.visible&&this.weapon)C.push({a:P(J.back,0,.25,-.03),b:P(J.back,0,-.45,-.03),r:.05*s});
  return C}
 // ── animación ──
 _spring(k,target,dt,rate){const S=this.S;if(S[k]==null)S[k]=target;S[k]+= (target-S[k])*(1-Math.exp(-dt*rate));return S[k]}
 update(st,dt){dt=Math.min(.1,Math.max(0,dt||1/60));this.t=st.t||0;const J=this.J,Bd=this.Bd;if(!Bd)return;
  // posición y orientación (gira suave hacia donde va o hacia el objetivo)
  const pos=new V3(st.x,st.y,st.z);let moved=0;if(this.last){const dx=pos.x-this.last.x,dz=pos.z-this.last.z,d=Math.hypot(dx,dz);if(d>2.5)this.clothReset=true;else moved=d;if(d>1e-4&&st.mv&&!st.face)this.faceT=Math.atan2(dx,dz)}
  // fase de paso por DISTANCIA (unidades de mundo / zancada): andar 1,9 m de zancada (dos pasos), correr 2,6 m. st.speed (visor) = velocidad virtual
  {const dist=st.speed!=null?st.speed*dt:moved,stride=lerp(1.9,2.6,this.runK||0)*HS*this.Bd.k;if(st.mv)this.gph=(this.gph||0)+dist/stride;else if(this.loco>.02){const f=this.gph%.5;if(f>.02&&f<.48)this.gph+=Math.min(.5-f,dt*1.6)}}   // al parar termina el paso hasta el doble apoyo
  if(st.face)this.faceT=Math.atan2(st.face[0],st.face[1]);this.last=pos.clone();
  let df=((this.faceT-this.face+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;this.face+=df*(1-Math.exp(-dt*(st.mv?11:8)));
  this.root.position.copy(pos);this.root.rotation.y=this.face;G.uChrB.value.set(pos.y,1.8*HS*this.Bd.k);   // material chr: pies→cabeza (ver «Trampas» en AGENTS: es global, un personaje por render)
  // reposo ↔ andar ↔ correr: amplitud que entra y sale suave (sin saltos al parar o arrancar)
  this.loco+=((st.mv?1:0)-this.loco)*(1-Math.exp(-dt*10));this.runK=this._spring('runK',st.run?1:0,dt,6);
  const T={},a=st.mv?null:st.act;let R=null;
  if(a&&typeof HERO!=='undefined'){R=HERO.pose({dir:0,mv:false,run:false,w:0,t:st.t,act:a,hurt:st.hurt||0,blink:0})}
  else if(!st.mv&&(st.hurt||0)>.15&&typeof HERO!=='undefined')R=HERO.pose({dir:0,t:st.t,hurt:st.hurt});
  this._idle(T,st);
  if(R)this._fromHero(T,R,a);
  if(this.loco>.01)this._gait(T,st,this.loco);
  this._apply(T,dt,R);
  this._items(R,a,dt);
  this.root.updateMatrixWorld(true);
  this._legsIK(T);
  this.root.updateMatrixWorld(true);
  this._post(R,a);
  this._clothStep(dt,st)}
 // ── reposo: respiración, peso que cambia de pierna, mirada que deriva; pies algo abiertos (postura adulta) ──
 _idle(T,st){const t=st.t,b=Math.sin(t*2.1);T.pelY=-.012+b*.006;T.pelX=Math.sin(t*.45)*.018;T.pelZ=0;T.pelRoll=Math.sin(t*.45)*-.03;T.pelYaw=Math.sin(t*.3)*.04;T.pelPitch=0;
  T.spP=.02+b*.012;T.chP=b*.015;T.chY=-T.pelYaw*.7;T.chR=-T.pelRoll*.6;T.nkP=-.03;T.hdP=-.07+Math.sin(t*.37)*.045;T.hdY=Math.sin(t*.23)*.25*Math.max(0,Math.sin(t*.11));
  T.shL=[-.06+b*.015,.08,0];T.shR=[-.06+b*.015,-.08,0];T.elL=-.22;T.elR=-.22;T.wrL=0;T.wrR=0;
  T.feet=[[Bd_hx(this)+.03,0,.03],[-Bd_hx(this)-.03,0,-.04]];T.footP=[0,0];T.twoH=0;
  if(this.stoop){T.spP+=.34;T.chP+=.24;T.nkP-=.45;T.pelY-=.03;T.elL-=.35;T.elR-=.35;T.shL[0]-=.15;T.shR[0]-=.15}}   // anciano: encorvado
 // ── acciones: ángulos sagitales de HERO.pose (perfil) → huesos. aN = brazo cercano en el perfil (derecho, el del arma), aF = el otro ──
 _fromHero(T,R,a){const P=R.pose,it=R.item;const k=a?a.k:'hurt';
  const aN=(P.aN??8)*D,aF=(P.aF??8)*D,eN=Math.max(.2,(P.eN||0)*D),eF=Math.max(.2,(P.eF||0)*D);
  T.shR=[-aN,-.06-Math.max(0,Math.sin(aN))*.05,0];T.shL=[-aF,.06+Math.max(0,Math.sin(aF))*.05,0];T.elR=-eN;T.elL=-eF;
  const lean=(P.lean||0)*D;T.spP+=lean*.45;T.chP+=lean*.45;T.nkP-=lean*.5;
  T.pelY-=(P.dip||0)*.028-(P.bob||0)*.006;T.pelZ+=(P.lunge||0)*.022;
  // postura de combate/trabajo: pie izquierdo delante, derecho atrás (el del arma); la estocada (lunge) hace avanzar la pelvis con los pies plantados
  const fight=k==='f'||k==='sp';if(fight||k==='wc'||k==='mi'){T.feet=[[Bd_hx(this)+.02,0,.13],[-Bd_hx(this)-.04,0,-.12]];T.pelYaw+=.22;T.chY-=.12}
  // torsión: al cargar el brazo arriba/atrás el pecho gira hacia atrás y en el golpe acompaña (anticipación → seguimiento)
  if(it&&(fight||k==='wc'||k==='mi'||k==='sm'))T.chY+=-(P.aN-70)*D*.22;
  // armas a dos manos (hacha, pico, martillo, mandoble, ballesta): los dos brazos al mango, codos algo doblados
  if(it&&(it.two||it.t==='great'||it.t==='xbow')){T.twoH=1;T.shL=[T.shR[0]+.12,-.3,0];T.shR=[T.shR[0],.28,0];T.elL=Math.min(T.elR,-.35);T.elR=Math.min(T.elR,-.3)}
  // arco: brazo derecho extendido con el arco, el izquierdo tensa hacia la barbilla (el codo se dobla con el tensado)
  if(it&&it.t==='bow'){const pull=cl((86-P.aF)/40,0,1);T.shR=[-86*D,-.05,-.05];T.elR=-.12;T.shL=[-lerp(80,92,pull)*D,-(.5*pull+.15),0];T.elL=-lerp(.35,2.3,pull);T.chY-=.35;T.pelYaw+=.25}
  if(it&&(it.t==='staff'||it.t==='scepter')&&!it.two){T.shL[1]=.12}
  if(k==='eat'){T.elR=-lerp(.3,2.1,cl((P.aN-10)/118,0,1));T.shR[1]=.3}
  if(k==='co'||k==='cr'||k==='es'||k==='ins'){T.elR=Math.min(T.elR,-.9);T.elL=Math.min(T.elL,-.9);T.shL[1]=-.22;T.shR[1]=.22;T.hdP+=.25}
  if(k==='fi'){T.elR=Math.min(T.elR,-.25);T.hdP+=.1}
  if(k==='pk'){T.hdP+=.35}
  if(P.blink===2)this.blink=1;
  this.itemAbs=it&&it.abs!=null?it.abs*D:null}
 // ── caminar y correr (Lote R3D-F1c, rehechos): la FASE sale de la DISTANCIA recorrida (no de P.w del 2D) con una zancada propia por modo, así el pie
 //    plantado casi no patina y la cadencia sigue sola a la velocidad (buffs, correr). Pie en el suelo durante el apoyo, talón que despega, punta arriba al pisar.
 //    Andar: péndulo invertido (la pelvis sube en mitad del apoyo y baja en el doble apoyo), cadera que gira y se balancea hacia la pierna de apoyo, brazos
 //    sueltos en contrafase. Correr: apoyo corto (33 %) con dos vuelos, rodilla que sube por delante y talón que recoge por detrás, tronco inclinado,
 //    codos fijos a ~85° y brazos que bombean adelante-atrás (sin aspavientos), hombros que giran contra la cadera.
 _gait(T,st,k){const u=this.gph%1,rk=this.runK,hx=Bd_hx(this);
  const walkF=v=>{v=(v%1+1)%1;const S=.56,A=.42;   // [avance del pie, altura del tobillo extra, cabeceo del pie]
   if(v<S){const s=v/S,heel=es(cl((s-.72)/.28,0,1));return[lerp(A,-A,s),heel*.06,s<.15?lerp(.28,0,s/.15):-heel*.55]}
   const s=(v-S)/(1-S),e=s<.5?2*s*s:1-2*(1-s)*(1-s);return[lerp(-A,A*1.02,e),Math.sin(Math.PI*Math.pow(s,.8))*.1+(1-s)*.03,lerp(-.55,.3,es(s))]};
  const runF=v=>{v=(v%1+1)%1;const S=.33;
   if(v<S){const s=v/S;return[lerp(.3,-.46,s),s>.7?(s-.7)*.2:0,s<.2?lerp(.12,0,s/.2):-es(cl((s-.55)/.45,0,1))*.7]}
   const s=(v-S)/(1-S),x=s<.35?lerp(-.46,-.38,s/.35):lerp(-.38,.3,es((s-.35)/.65)),y=s<.45?Math.sin(Math.PI*s/.9)*.4:lerp(.4,0,es((s-.45)/.55))*(s<.85?1:1);   // talón que recoge alto por detrás y luego la rodilla lleva el pie adelante
   return[x,y+.02,s<.4?lerp(-.7,-1.0,s/.4):lerp(-1.0,.15,es((s-.4)/.6))]};
  const mixF=v=>{const a=walkF(v),b=runF(v);return a.map((x,i)=>lerp(x,b[i],rk))};
  const fl=mixF(u),fr=mixF(u+.5),fw=T.feet;
  T.feet=[[lerp(fw[0][0],hx+.01,k),lerp(fw[0][1],fl[1],k),lerp(fw[0][2],fl[0],k)],[lerp(fw[1][0],-hx-.01,k),lerp(fw[1][1],fr[1],k),lerp(fw[1][2],fr[0],k)]];
  T.footP=[lerp(T.footP[0],fl[2],k),lerp(T.footP[1],fr[2],k)];
  const sw=Math.cos(2*Math.PI*u),sd=Math.sin(2*Math.PI*u);   // sw = +1 con el pie izquierdo delante (u=0), −1 con el derecho (u=.5)
  // pelvis: andar = baja en el doble apoyo (u=0,.5) y sube en mitad del apoyo; correr = baja a mitad del apoyo (u≈.16,.66) y sube en los vuelos
  const pyW=-.05-.026*Math.cos(4*Math.PI*u),pyR=-.035-.032*Math.cos(4*Math.PI*(u-.165));
  T.pelY=lerp(T.pelY,lerp(pyW,pyR,rk),k);T.pelX=lerp(T.pelX,sd*lerp(.022,.008,rk),k);T.pelZ=lerp(T.pelZ,0,k);
  T.pelYaw=lerp(T.pelYaw,-sw*lerp(.11,.09,rk),k);T.pelRoll=lerp(T.pelRoll,-sd*lerp(.035,.02,rk),k);T.pelPitch=lerp(T.pelPitch||0,lerp(.02,.08,rk),k);
  T.spP=lerp(T.spP,lerp(.03,.11,rk),k);T.chP=lerp(T.chP,lerp(.01,.06,rk),k);T.chY=lerp(T.chY,sw*lerp(.1,.2,rk),k);T.chR=lerp(T.chR,sd*.02,k);
  T.nkP=lerp(T.nkP,-lerp(.03,.15,rk),k);T.hdP=lerp(T.hdP,-lerp(0,.04,rk),k);T.hdY=lerp(T.hdY,0,k);
  // brazos: contrafase con las piernas y un pelín de retraso; andar = sueltos (codo 12-35°), correr = codo fijo ~85° y bombeo sagital
  const aw=Math.cos(2*Math.PI*(u-.05)),amp=lerp(.38,.5,rk),bias=lerp(.04,-.02,rk);
  T.shL=[lerp(T.shL[0],aw*amp+bias,k),lerp(T.shL[1],lerp(.07,.1,rk),k),lerp(0,-.18*Math.max(0,-aw),rk)*k];
  T.shR=[lerp(T.shR[0],-aw*amp+bias,k),lerp(T.shR[1],-lerp(.07,.1,rk),k),lerp(0,.18*Math.max(0,aw),rk)*k];
  const elW=s=>.22+.28*Math.max(0,-s),elR=s=>1.3+.25*(-s);   // s>0 brazo atrás: codo más abierto andando; corriendo el codo se cierra un poco al ir adelante
  T.elL=lerp(T.elL,-lerp(elW(aw),elR(aw),rk),k);T.elR=lerp(T.elR,-lerp(elW(-aw),elR(-aw),rk),k);
  this.itemAbs=null}
 _apply(T,dt,R){const J=this.J,s=(key,v,r=22)=>this._spring(key,v,dt,r);const fast=R&&R.trail?40:24;   // en el golpe rápido el muelle es más duro (no se come el impacto)
  J.pelvis.position.set(s('pX',T.pelX),PEL+s('pY',T.pelY),s('pZ',T.pelZ));J.pelvis.rotation.set(s('pP',T.pelPitch||0),s('pYw',T.pelYaw),s('pR',T.pelRoll),'YXZ');
  J.spine.rotation.set(s('sP',T.spP),s('sY',T.chY*.4),s('sR',(T.chR||0)*.5),'YXZ');J.chest.rotation.set(s('cP',T.chP),s('cY',T.chY*.6),s('cR',(T.chR||0)*.5),'YXZ');
  J.neck.rotation.set(s('nP',T.nkP),0,0);J.head.rotation.set(s('hP',T.hdP),s('hY',T.hdY-(T.chY||0)*.5-(T.pelYaw||0)*.6,8),0,'YXZ');
  ['L','R'].forEach(k=>{const sh=T['sh'+k];J['sh'+k].rotation.set(s('s'+k+'0',sh[0],fast),s('s'+k+'2',sh[2]||0,fast),s('s'+k+'1',sh[1],fast),'XYZ');J['el'+k].rotation.set(s('e'+k,T['el'+k],fast),0,0);J['wr'+k].rotation.set(s('w'+k,T['wr'+k]||0),0,0)});
  this.T=T;this.Ts={feet:T.feet.map((f,i)=>f.map((v,j)=>s('f'+i+j,v,this.loco>.5?60:16))),footP:T.footP.map((v,i)=>s('fp'+i,v,30))};
  this.blink=Math.max(0,this.blink-dt*8);const bl=(Math.sin(this.t*1.7)>.985||this.blink>0)?.12:1;this.eyes.forEach(e=>e.scale.y=bl);if(this.hoodEyes)this.hoodEyes.forEach(e=>e.scale.y=bl)}
 // IK de pierna de 2 huesos en el plano sagital del cuerpo: el pie va al objetivo (x lateral, y elevación, z avance; relativos a la proyección de la cadera en el suelo).
 _legsIK(){const J=this.J,root=this.root,inv=new THREE.Matrix4().copy(root.matrixWorld).invert(),w=new V3(),Ts=this.Ts;
  ['L','R'].forEach((k,i)=>{const hip=J['hp'+k],f=Ts.feet[i];hip.getWorldPosition(w);w.applyMatrix4(inv);   // cadera en espacio del root (metros, suelo en y=0)
   // objetivo del tobillo: pie en el suelo + altura del tobillo + elevación
   const tx=f[0],ty=ANK+f[1],tz=f[2];let dx=tx-w.x,dy=ty-w.y,dz=tz-w.z;const pr=J.pelvis.rotation;
   // pasar el vector al marco de la pelvis (solo guiñada y cabeceo): así la pierna dobla «hacia delante» aunque la pelvis gire
   const v=new V3(dx,dy,dz).applyEuler(new THREE.Euler(0,-pr.y,0)).applyEuler(new THREE.Euler(-pr.x,0,-pr.z,'ZYX'));
   const Lt=L_TH,Ls=L_SH,d=cl(v.length(),.12,Lt+Ls-.002),sag=Math.hypot(v.y,v.z)||1e-6;
   const base=Math.atan2(v.z,-v.y),ca=cl((Lt*Lt+d*d-Ls*Ls)/(2*Lt*d),-1,1),ka=cl((Lt*Lt+Ls*Ls-d*d)/(2*Lt*Ls),-1,1);
   const hipF=base+Math.acos(ca),knee=Math.PI-Math.acos(ka),roll=Math.atan2(v.x,sag)*.9;
   hip.rotation.set(-hipF,0,roll,'ZXY');J['kn'+k].rotation.set(knee,0,0);
   J['an'+k].rotation.set(hipF-knee+(J.pelvis.rotation.x||0)*-1+Ts.footP[i]*-1,0,-roll,'XYZ')})}
 // ── objetos en las manos y a la espalda ──
 _items(R,a,dt){const J=this.J,it=R&&R.item;Object.values(this.tool).forEach(g=>g.visible=false);this.rodTip=null;
  const wp=this.weapon,kind=wp&&wp.userData.kind,inHand=it&&['sword','dagger','great','bow','xbow','staff','scepter'].includes(it.t);
  if(wp){if(inHand){if(wp.parent!==J.grip)J.grip.add(wp)}else{if(wp.parent!==J.back)J.back.add(wp)}this.weaponBack=wp.parent===J.back?wp:null}
  if(this.shield){const busy=inHand&&(it.t==='bow'||it.t==='xbow'||it.two||it.t==='great'),tgt=busy||(it&&it.two)?J.back:J.wrL;if(this.shield.parent!==tgt)tgt.add(this.shield)}
  this.curItem=null;if(it&&!inHand){const tg=this._tool(it.t,it.col);tg.visible=true;this.curItem=tg}else if(inHand)this.curItem=wp;
  if(wp&&wp.userData.orb){const gl=it&&it.glow||0;wp.userData.orb.scale.setScalar(1+gl*.5)}}
 _post(R,a){const J=this.J,it=R&&R.item,root=this.root,q=new THREE.Quaternion(),qr=new THREE.Quaternion(),e=new THREE.Euler();
  // arma/herramienta en la mano: orientación ABSOLUTA respecto al cuerpo (item.abs: 0 abajo, 90 delante, 180 arriba), como en el 2D; sin abs sigue al antebrazo
  const g=this.curItem;if(g&&g.parent===J.grip){const kind=g.userData.kind;let abs=this.itemAbs;
   J.grip.updateMatrixWorld(true);J.grip.getWorldQuaternion(q);root.getWorldQuaternion(qr);
   if(kind==='bow'||kind==='xbow'){g.quaternion.identity();if(kind==='bow')g.rotation.set(0,0,0);else g.rotation.set(-Math.PI/2+.0,0,0);   // arco vertical en la mano; ballesta apuntando adelante
    const tgt=new THREE.Quaternion().setFromEuler(e.set(kind==='bow'?0:0,0,kind==='bow'?.12:0));g.quaternion.copy(q.clone().invert().multiply(qr).multiply(tgt));g.updateMatrixWorld(true);
    if(kind==='bow'){const s=g.userData.string,tp=g.userData.tips,hl=new V3();J.gripL.getWorldPosition(hl);g.worldToLocal(hl);const pull=it&&it.arrow?1:0;const mid=pull?hl:new V3(0,0,-.06);s.geometry.setFromPoints([tp[0],mid,tp[1]])}}
   else{if(abs==null)abs=(R?(R.pose.aN||0)*D:0)+.5;const pel=new THREE.Quaternion().setFromEuler(e.set(0,J.pelvis.rotation.y+(J.chest.rotation.y+J.spine.rotation.y)*.5,0,'YXZ'));
    const tgt=qr.clone().multiply(pel).multiply(new THREE.Quaternion().setFromEuler(e.set(-abs,0,0)));
    // la hoja de una espada mira hacia −y; un hacha/pico/martillo tiene la cabeza en −y: el mango sale del puño hacia la cabeza
    g.quaternion.copy(q.clone().invert().multiply(tgt));
    if(it&&it.t==='rod'){const tip=new V3(0,-1.3,0);g.localToWorld(tip);this.rodTip=tip}}}
  else if(g)g.rotation.set(0,0,0);
  if(this.weaponBack){const k=this.weaponBack.userData.kind;if(k==='staff'){this.weaponBack.rotation.set(0,0,Math.PI-.4);this.weaponBack.position.set(.12,-.55,-.02)}else if(k==='bow'||k==='xbow'){this.weaponBack.rotation.set(0,k==='xbow'?Math.PI/2:0,.45);this.weaponBack.position.set(0,-.12,-.03)}else{this.weaponBack.rotation.set(0,0,.6);this.weaponBack.position.set(-.1,.1,-.02)}}
  if(this.shield){const p=this.shield.parent;if(p===J.wrL){this.shield.position.set(.07,-.12,0);J.wrL.updateMatrixWorld(true);const qw=new THREE.Quaternion();J.wrL.getWorldQuaternion(qw);root.getWorldQuaternion(qr);   // el escudo se queda VERTICAL mirando al frente-izquierda aunque el antebrazo se levante
   const tg=qr.clone().multiply(new THREE.Quaternion().setFromEuler(e.set(0,J.pelvis.rotation.y+J.chest.rotation.y-1.07,0)));this.shield.quaternion.copy(qw.invert().multiply(tg))}else{this.shield.position.set(0,-.05,-.05);this.shield.rotation.set(0,Math.PI/2,0)}}
  // mano izquierda al mango en armas de dos manos: corrige el codo/hombro izquierdo con un IK sencillo hacia un punto del mango
  if(this.T&&this.T.twoH&&g){const tgt=new V3(0,.09,0);g.localToWorld(tgt);this._armIK('L',tgt)}}
 // IK de brazo (2 huesos) hacia un punto de mundo. El codo apunta hacia el vector polar (fuera y abajo). El antebrazo dobla hacia +z local del brazo.
 _armIK(k,tw){const J=this.J,sh=J['sh'+k],el=J['el'+k],inv=new THREE.Matrix4();sh.parent.updateMatrixWorld(true);inv.copy(sh.parent.matrixWorld).invert();
  const S=sh.position.clone(),t=tw.clone().applyMatrix4(inv).sub(S),La=L_UA,Lf=L_FA+.075,d=cl(t.length(),.08,La+Lf-.004),dir=t.clone().normalize();
  const pole=new V3(k==='L'?.8:-.8,-.6,-.2),perp=pole.sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize(),a=(La*La-Lf*Lf+d*d)/(2*d),h=Math.sqrt(Math.max(0,La*La-a*a));
  const E=dir.clone().multiplyScalar(a).add(perp.multiplyScalar(h)),Y=E.clone().normalize().negate(),Z=dir.clone().multiplyScalar(d).sub(E);Z.sub(Y.clone().multiplyScalar(Z.dot(Y))).normalize();
  const X=new V3().crossVectors(Y,Z).normalize();sh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X,Y,Z));
  const ka=Math.acos(cl((La*La+Lf*Lf-d*d)/(2*La*Lf),-1,1));el.rotation.set(-(Math.PI-ka),0,0);sh.updateMatrixWorld(true)}
 // ── paso de la tela ──
 _clothStep(dt,st){if(!this.cloth.length)return;const cols=this._colliders(),w=new V3(),wind=st.wind||[.9,.4],gy=st.y;
  const vv=st.virt||[0,0],env={g:-9.8*HS,wind:[wind[0]*.9-vv[0],0,wind[1]*.9-vv[1]],gust:1,t:st.t,ground:gy};   // virt: velocidad «virtual» (visor, el héroe no se desplaza): el aire relativo empuja la tela hacia atrás
  for(const c of this.cloth){const cl=c.cl;
   if(this.clothReset)cl.reset((i,j)=>c.anchor.localToWorld(w.set(...c.rest(i,j))).toArray());
   c.pins.forEach((pi,ii)=>{const p=c.anchor.localToWorld(w.set(...c.anc(ii)));cl.pin(pi,p.x,p.y,p.z)});
   cl.step(dt,cols,env);if(c.slab)cl.writeSlab(c.mesh.geometry);else cl.writeRope(c.mesh.geometry,[1,0,0])}
  this.clothReset=false}
}
function Bd_hx(h){return h.Bd.hx}
