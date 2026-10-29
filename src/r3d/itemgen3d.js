// NotScape · R3D · Lote R3D-DROPS-3D (20 oct 2026) · MODELOS 3D de los objetos que antes solo existían como icono 2D pintado (src/item-icons.js).
// Comida, pescado, botín de criaturas (cuero, lana, tela, hueso, diente, cuerno, pluma, nido, perla…), runas, pergaminos, coronas, máscaras, sombreros, shuriken, núcleos…
// Misma firma que `GEN` de icons3d.js: fn(p, g, c, o) con p = pieza (geo,col,x,y,z,{p,ink,t,mat}), g = grupo, c = color principal del icono 2D, o = opciones del icono 2D.
// Tamaño ≈ .5 unidades (como GEN) para que el contorno pese igual; el tamaño REAL en el suelo lo fija drops3d.js (tabla SIZE por kind). `icons3d.js` los mezcla en su GEN
// (los iconos de inventario de estos objetos pasan a ser 3D) y `drops3d.js` los usa para los objetos del suelo. Un objeto nuevo = una función aquí + su fila en POSE/DPOSE (icons3d.js).
// Estilo: toon + contorno (mkPart), formas facetadas pocas (flat/jit), colores ensuciados, brillo (glow) solo en lo mágico (runas, núcleos, perlas, remolinos).
import * as THREE from 'three';
import {glow,jit} from './materials3d.js';
import {GEN3,POSE3,DPOSE3} from './craftgen3d.js';   // OFICIOS-D4: herramientas, ropa e intermedios de oficio

const PI=Math.PI,TAU=PI*2;
const shade=(c,k)=>'#'+new THREE.Color(c).multiplyScalar(k).getHexString(),mixc=(a,b,t)=>'#'+new THREE.Color(a).lerp(new THREE.Color(b),t).getHexString();
const sph=(r,x=1,y=1,z=1,n=12)=>new THREE.SphereGeometry(r,n,Math.max(6,n-4)).scale(x,y,z),cyl=(a,b,h,n=10)=>new THREE.CylinderGeometry(a,b,h,n),box=(x,y,z)=>new THREE.BoxGeometry(x,y,z);
const flat=g=>{const n=g.index?g.toNonIndexed():g;n.computeVertexNormals();return n};
const cc=(c,d)=>(typeof c==='string'&&c[0]==='#')?c:d;

// pieza de comida/botín tosca: esfera achatada con vértices movidos (jit) → silueta orgánica pero facetada
const blobG=(r,x,y,z,a=.03)=>jit(new THREE.IcosahedronGeometry(r,1).scale(x,y,z),a);

// ── HIERBAS (Herbolaria): UNA planta individual por especie, con su silueta propia (27 oct 2026) ───────────────────────────────────────────────────────────────────────────────
const hPet=(len,wid,tilt,a,th=.16,n=8)=>sph(len,1,th,wid/len,n).translate(len*.92,0,0).rotateZ(tilt).rotateY(a);   // pétalo u hoja: elipsoide plano que sale del centro, inclinado `tilt` y girado `a`
const hStem=(p,g,h,col,r0=.017,r1=.011)=>p(cyl(r1,r0,h,6).translate(0,h/2,0),col,0,0,0,{p:g,ink:.006});
const hRing=(p,g,n,col,len,wid,y,tilt,off=0,th=.16,seg=8)=>{for(let i=0;i<n;i++)p(hPet(len,wid,tilt,i/n*TAU+off,th,seg),shade(col,.9+.18*(i%2)),0,y,0,{p:g,ink:.006})};
const hSeg=(p,g,a,b,r0,r1,col)=>{const d=new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]),L=d.length(),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());return p(cyl(r1,r0,L,6).translate(0,L/2,0).applyQuaternion(q),col,a[0],a[1],a[2],{p:g,ink:.005})};   // segmento de tallo entre dos puntos
const hBead=(p,g,col,r,x,y,z)=>p(sph(r,1,1,1,6),col,x,y,z,{p:g,ink:.004});
const HSP={
 manzanilla(p,g,c,lf){hStem(p,g,.4,shade(lf,.75));hRing(p,g,6,lf,.11,.012,.03,.75,0,.1,6);hRing(p,g,4,lf,.085,.01,.16,.95,.4,.1,6);hRing(p,g,12,'#f6f2e6',.085,.024,.4,.1,0,.12);hBead(p,g,'#f0c040',.036,0,.415,0);hBead(p,g,'#d8a020',.022,0,.44,0)},   // margarita: 12 pétalos blancos y botón amarillo, hojas plumosas
 ortiga(p,g,c,lf){hStem(p,g,.4,shade(lf,.7),.02,.014);for(let k=0;k<4;k++){const y=.07+k*.085;[0,Math.PI].forEach(a=>p(hPet(.11-k*.012,.06-k*.006,.55,a+k*1.1,.1,5),shade(lf,.85+k*.06),0,y,0,{p:g,ink:.006}))}
  for(let k=0;k<9;k++){const a=k*2.4,y=.05+k*.037;p(new THREE.ConeGeometry(.007,.04,4).translate(0,.02,0).rotateZ(-.9).rotateY(a),'#cfe0b0',0,y,0,{p:g,ink:.003})}   // pelos urticantes
  [-1,1].forEach(sd=>{for(let k=0;k<4;k++)hBead(p,g,'#b8d090',.016,sd*.045+sd*k*.004,.4-k*.03,0)})},   // hojas serradas en pares y amentos colgantes
 trebol(p,g,c,lf){[[0,.2],[2.1,.15],[4.2,.11]].forEach(([a,h])=>{p(cyl(.007,.009,h,5).translate(0,h/2,0).rotateZ(.35).rotateY(a),shade(lf,.7),0,0,0,{p:g,ink:.004});const tx=-Math.sin(.35)*h*Math.cos(a),tz=Math.sin(.35)*h*Math.sin(a),ty=h*Math.cos(.35)+.012;for(let k=0;k<3;k++){const aa=a+k*2.094;p(sph(.062,1,.12,.82,7).translate(.055,0,0).rotateZ(.25).rotateY(aa),shade(lf,.92+k*.06),tx,ty,tz,{p:g,ink:.005})}p(sph(.03,1,.05,.6,6).translate(.04,0,0).rotateZ(.3).rotateY(a),'#d8e8c0',tx,ty+.012,tz,{p:g,ink:0})});
  hStem(p,g,.4,shade(lf,.75),.014,.01);p(sph(.07,1,1.05,1,8),c,0,.42,0,{p:g,ink:.007});for(let k=0;k<16;k++){const a=k*2.4,e=Math.acos(1-2*((k+.5)/16));hBead(p,g,shade(c,.9+.2*(k%2)),.02,Math.sin(e)*Math.cos(a)*.065,.42+Math.cos(e)*.07,Math.sin(e)*Math.sin(a)*.065)}},   // trébol: hojas de tres lóbulos y cabezuela rosa
 lavanda(p,g,c,lf){hStem(p,g,.52,shade(lf,.7),.012,.008);hRing(p,g,7,'#8a9a88',.13,.012,.02,.8,0,.1,6);for(let i=0;i<13;i++){const y=.27+i*.021,r=.04-i*.0016;[0,Math.PI/2,Math.PI,Math.PI*1.5].forEach((a,k)=>hBead(p,g,shade(c,.8+.12*((i+k)%3)),.021-i*.0007,Math.cos(a+i*.9)*r,y,Math.sin(a+i*.9)*r))}hBead(p,g,shade(c,1.1),.014,0,.55,0)},   // lavanda: hojas finas grises y espiga morada
 salvia(p,g,c,lf){hStem(p,g,.5,shade(lf,.75));hRing(p,g,5,lf,.13,.08,.03,.55,0,.11,7);hRing(p,g,4,lf,.1,.06,.1,.7,.5,.11,7);for(let w=0;w<3;w++)hRing(p,g,6,c,.06,.026,.31+w*.07,.85,w*.5,.2,6);hBead(p,g,shade(c,1.1),.02,0,.54,0)},   // salvia: hojas anchas verde ceniza y verticilos azules
 helecho(p,g,c,lf){const N=9;for(let i=0;i<N;i++){const u=i/N,x=Math.sin(u*1.5)*.2*u*1.5,y=.04+u*.42-u*u*.12;p(cyl(.009,.011,.07,5).translate(0,.035,0).rotateZ(-.5-u*1.1).translate(x,y,0),'#5a8a8a',0,0,0,{p:g,ink:.004});[-1,1].forEach(sd=>p(hPet(.1*(1-u*.65),.03*(1-u*.4),.35,sd*Math.PI/2,.1,6).rotateZ(-u*1.2),shade(c,.9+u*.12),x,y,0,{p:g,ink:.004}))}
  p(sph(.03,1,1,1,8),'#e8f0ff',.2,.36,0,{p:g,ink:0,mat:glow('#cfe0ff',1.2)})},   // helecho lunar: fronda curvada con foliolos plateados y una perla de luz en la punta
 loto(p,g,c,lf){p(cyl(.22,.22,.022,20).translate(0,.011,0),shade(lf,.7),0,0,0,{p:g,ink:.01});p(new THREE.CylinderGeometry(.03,.03,.024,10).translate(.16,.012,0),'#2a3a28',0,.002,0,{p:g,ink:0});
  hRing(p,g,8,c,.13,.05,.05,.95,0,.16);hRing(p,g,6,shade(c,1.08),.1,.045,.07,.62,.3,.16);hRing(p,g,4,shade(c,1.15),.07,.04,.09,.3,.15,.16);for(let k=0;k<8;k++){const a=k/8*TAU;hBead(p,g,'#f0c040',.014,Math.cos(a)*.04,.12,Math.sin(a)*.04)}},   // loto: nenúfar y flor de ocho pétalos rosas
 genciana(p,g,c,lf){hStem(p,g,.44,shade(lf,.7),.016,.011);for(let k=0;k<4;k++){const y=.06+k*.08;[0,Math.PI].forEach(a=>p(hPet(.1-k*.01,.025,.5,a+k*1.57,.1,6),shade(lf,.85+k*.07),0,y,0,{p:g,ink:.005}))}
  p(new THREE.CylinderGeometry(.06,.022,.16,10,1,true).translate(0,.52,0),c,0,0,0,{p:g,ink:.006,t:{side:THREE.DoubleSide}});hRing(p,g,5,shade(c,1.08),.05,.04,.6,.45,0,.2);p(sph(.03,1,.6,1,6),'#f4f0e0',0,.57,0,{p:g,ink:0})},   // genciana: trompeta azul profundo con cinco lóbulos
 escarcha(p,g,c,lf){hStem(p,g,.38,'#9ab4c4');hRing(p,g,4,'#a8d0e0',.1,.025,.05,.7,.3,.12,5);for(let k=0;k<6;k++){const a=k/6*TAU,m=p(flatSph(.11,.025,.04).translate(.1,0,0).rotateZ(.95).rotateY(a),shade(c,.92+.12*(k%2)),0,.38,0,{p:g,ink:.005})}
  hBead(p,g,'#ffffff',.03,0,.4,0);for(let k=0;k<5;k++)p(new THREE.OctahedronGeometry(.016,0),'#ffffff',Math.cos(k*1.9)*.13,.42+(k%3)*.05,Math.sin(k*1.9)*.13,{p:g,ink:0,mat:glow('#dff4ff',1.4)})},   // flor de escarcha: pétalos de hielo facetados y destellos
 brasaflor(p,g,c,lf){hStem(p,g,.4,'#4a3424');hRing(p,g,4,'#5a4030',.1,.02,.06,.7,.3,.1,5);hRing(p,g,8,shade(c,.85),.1,.036,.4,.7,0,.14);hRing(p,g,6,c,.08,.034,.42,.35,.3,.14);p(sph(.04,1,1,1,8),'#ffd040',0,.43,0,{p:g,ink:0,mat:glow('#ffb030',1.3)});
  for(let k=0;k<5;k++)p(new THREE.OctahedronGeometry(.012,0),'#ffc060',Math.cos(k*2.1)*.1,.5+k*.03,Math.sin(k*2.1)*.1,{p:g,ink:0,mat:glow('#ff9030',1.5)})},   // brasa-flor: pétalos naranja con corazón incandescente y ascuas
 cenizaviva(p,g,c,lf){hStem(p,g,.34,'#2e2824',.02,.014);p(flatSph(.12,.1,.12),'#6a625a',0,.4,0,{p:g,ink:.008});hRing(p,g,7,c,.1,.03,.38,.55,0,.14,5);for(let k=0;k<6;k++){const a=k/6*TAU;p(box(.012,.07,.012).translate(0,.04,0).rotateZ(.7).rotateY(a),'#ff5a2a',0,.36,0,{p:g,ink:0,mat:glow('#ff4a20',1.3)})}
  for(let k=0;k<4;k++)p(new THREE.OctahedronGeometry(.012,0),'#ff8a40',Math.cos(k*1.7)*.09,.52+k*.03,Math.sin(k*1.7)*.09,{p:g,ink:0,mat:glow('#ff6a20',1.5)})},   // ceniza viva: cabeza gris agrietada con grietas de brasa
 espinainf(p,g,c,lf){const P=[];for(let i=0;i<=7;i++)P.push([Math.sin(i*1.3)*.05,i*.062,Math.cos(i*1.7)*.04]);for(let i=0;i<7;i++){hSeg(p,g,P[i],P[i+1],.016-i*.001,.013-i*.001,'#1a1214');const o=P[i],a=i*1.9;p(new THREE.ConeGeometry(.012,.07,4).translate(0,.035,0).rotateZ(-1.15).rotateY(a),'#c8281c',o[0],o[1]+.03,o[2],{p:g,ink:.003})}
  const T=P[7];p(sph(.06,1,1.15,1,7),'#7a1018',T[0],T[1]+.05,T[2],{p:g,ink:.007});for(let k=0;k<7;k++){const a=k/7*TAU;p(new THREE.ConeGeometry(.014,.075,4).translate(0,.04,0).rotateZ(1.1).rotateY(a),'#c8281c',T[0],T[1]+.05,T[2],{p:g,ink:.003})}p(sph(.026,1,1,1,6),'#ff4a30',T[0],T[1]+.06,T[2],{p:g,ink:0,mat:glow('#ff3020',1.5)})},   // espina infernal: tallo negro retorcido con espinas rojas y capullo ardiente
 flormundo(p,g,c,lf){hStem(p,g,.36,shade(lf,.8),.02,.014);hRing(p,g,5,lf,.13,.045,.05,.5,0,.12);hRing(p,g,12,c,.13,.04,.38,.95,0,.14);hRing(p,g,8,shade(c,1.12),.1,.04,.4,.55,.2,.14);hRing(p,g,5,shade(c,1.25),.07,.04,.42,.25,.1,.14);
  p(sph(.05,1,1,1,8),'#fff6c0',0,.44,0,{p:g,ink:0,mat:glow('#fff0a0',1.6)});for(let k=0;k<6;k++)p(new THREE.OctahedronGeometry(.013,0),'#ffe890',Math.cos(k*1.05)*.16,.5+(k%3)*.05,Math.sin(k*1.05)*.16,{p:g,ink:0,mat:glow('#ffe070',1.5)})}   // flor del mundo: flor dorada de capas con núcleo luminoso y motas
};
const flatSph=(a,b,c2)=>sph(a,1,b/a,c2/a,6);

export const GEN2={
 // ── botín de criaturas ──
 hide(p,g,c){c=cc(c,'#9a6a34');p(blobG(.25,1.25,.16,.95,.035),c,0,0,0,{p:g,ink:.014});
  p(blobG(.2,1,.1,.7,.03),shade(c,1.18),0,.07,0,{p:g,ink:0});            // cara interior del pellejo, más clara
  p(new THREE.TorusGeometry(.2,.022,5,12,PI*1.2).rotateX(PI/2),shade(c,.7),.06,.1,-.02,{p:g,ink:0})},   // borde enrollado
 herbplant(p,g,c,o){c=cc(c,'#f2efe2');const lf=(o&&o.leaf)||'#5f9a4a',f=HSP[o&&o.sp]||HSP.manzanilla;f(p,g,c,lf)},
 // ALQUIMIA (27 oct 2026): frasco vacío y ELIXIR (matraz con líquido del color del tipo; el grado I/II/III añade lacre, aro de oro y destellos; el tier agranda el matraz)
 flask(p,g,c){const prof=[[0,0],[.1,.008],[.16,.05],[.185,.12],[.16,.2],[.08,.25],[.06,.27],[.06,.35],[.075,.37],[.075,.4],[0,.4]].map(a=>new THREE.Vector2(a[0],a[1]));
  p(new THREE.LatheGeometry(prof.slice(0,6),18),'#bfe0ea',0,0,0,{p:g,ink:.012,t:{rim:2}});p(new THREE.LatheGeometry(prof.slice(5),18),'#dcecf0',0,0,0,{p:g,ink:.012});p(cyl(.07,.058,.07,10),'#8a5a32',0,.42,0,{p:g,ink:.01});p(sph(.026,1,1.6,.5),'#ffffff',-.07,.12,.15,{p:g,ink:0,mat:glow('#ffffff',.9)})},
 elixir(p,g,c,o){o=o||{};const gr=o.g==null?0:o.g,ti=Math.max(1,o.ti||1),k=.88+ti*.035,prof=[[0,0],[.1,.008],[.16,.05],[.185,.12],[.16,.2],[.08,.25],[.06,.27],[.06,.35],[.075,.37],[.075,.4],[0,.4]].map(a=>new THREE.Vector2(a[0]*k,a[1]*k)),liq=gr<0?'#6a5a3a':c;
  const body=new THREE.LatheGeometry(prof.slice(0,6),18);p(body,liq,0,0,0,{p:g,ink:.012,t:{rim:2},mat:gr>=0?undefined:undefined});p(new THREE.LatheGeometry(prof.slice(5),18),'#dcecf0',0,0,0,{p:g,ink:.012});
  p(cyl(.07,.058,.07,10),gr>=2?'#d8b060':'#8a5a32',0,.42*k,0,{p:g,ink:.01});
  if(gr>=1)p(new THREE.TorusGeometry(.066*k,.014,5,14).rotateX(PI/2),gr>=2?'#e8cf94':'#a83a2a',0,.33*k,0,{p:g,ink:0});
  p(sph(.028,1,1.5,.5),'#ffffff',-.07*k,.12*k,.15*k,{p:g,ink:0,mat:glow('#ffffff',1.1)});
  if(gr>=2)[[.17,.2,.08,.03],[-.15,.3,.1,.022],[.05,.46,.12,.02]].forEach(([x,y,z,r])=>p(new THREE.OctahedronGeometry(r,0),'#fff3c0',x*k,y*k,z*k,{p:g,ink:0,mat:glow('#fff3c0',1.5)}));
  if(gr<0)p(blobG(.06,1.4,.6,1,.02),'#3a3024',0,.04,.1,{p:g,ink:0})},
 wool(p,g,c){c=cc(c,'#f1ede2');[[0,0,0,.17],[.14,-.02,.05,.13],[-.13,-.01,.07,.14],[.03,.1,-.05,.12],[-.05,.02,-.14,.12],[.1,.0,-.1,.11]].forEach(([x,y,z,r])=>p(blobG(r,1,.9,1,.02),mixc(c,'#d8d0c0',(x+z)*.5+.1),x,y,z,{p:g,ink:.012}))},
 cloth(p,g,c){c=cc(c,'#cdbfe8');for(let i=0;i<3;i++)p(box(.44-i*.03,.07,.34-i*.02).rotateY((i-1)*.12),mixc(c,'#ffffff',i*.08),i*.012,i*.07,i%2?.02:-.015,{p:g,ink:.01});
  p(box(.46,.012,.05),shade(c,.6),0,.13,0,{p:g,ink:0})},
 bone(p,g,c){c=cc(c,'#e8e0c8');const s=cyl(.045,.045,.44,8).rotateZ(PI/2);p(s,c,0,0,0,{p:g,ink:.012});
  for(const sx of[-1,1])for(const sz of[-1,1])p(sph(.065),c,sx*.22,0,sz*.04,{p:g,ink:.01})},
 tooth(p,g,c){c=cc(c,'#efe6cc');p(new THREE.ConeGeometry(.1,.42,7).translate(0,.21,0).rotateZ(.25),c,0,0,0,{p:g,ink:.014});p(cyl(.1,.1,.03,7),shade(c,.85),0,0,0,{p:g,ink:0})},
 skull(p,g,c){c=cc(c,'#ece4d0');p(sph(.2,1,.95,1.05),c,0,.05,0,{p:g,ink:.014});p(box(.2,.09,.17),shade(c,.92),0,-.12,.03,{p:g,ink:.01});
  for(const s of[-1,1])p(sph(.045,1,1.2,.6),'#1c1612',s*.07,.07,.17,{p:g,ink:0});p(box(.025,.05,.03),'#1c1612',0,-.01,.2,{p:g,ink:0})},
 club(p,g,c){c=cc(c,'#8a5a2a');p(new THREE.CylinderGeometry(.1,.035,.55,8).translate(0,.28,0),c,0,0,0,{p:g,ink:.014});
  for(let i=0;i<5;i++)p(new THREE.ConeGeometry(.025,.06,5),shade(c,1.3),Math.cos(i*1.3)*.09,.4+(i%3)*.06,Math.sin(i*1.3)*.09,{p:g,ink:0}).lookAt(0,.4,0)},
 horn(p,g,c){c=cc(c,'#d8caa0');const cv=new THREE.QuadraticBezierCurve3(new THREE.Vector3(-.05,0,0),new THREE.Vector3(.2,.2,0),new THREE.Vector3(.02,.5,0)),N=6,up=new THREE.Vector3(0,1,0);   // cuerno curvo: 6 tramos que se solapan, cada uno orientado a la tangente
  for(let k=0;k<N;k++){const t0=k/N,t1=(k+1)/N,a=cv.getPoint(t0),b=cv.getPoint(t1),m=a.clone().add(b).multiplyScalar(.5),d=b.clone().sub(a),L=d.length();d.normalize();
   const geo=new THREE.CylinderGeometry(.085*(1-t1*.88),.085*(1-t0*.88),L*1.25,8).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up,d));p(geo,mixc(c,'#3a2a1c',t0*.55),m.x,m.y,m.z,{p:g,ink:.012})}},
 nest(p,g,c){c=cc(c,'#8a6a3a');p(new THREE.TorusGeometry(.2,.06,6,14).rotateX(PI/2),c,0,.03,0,{p:g,ink:.014});p(cyl(.19,.16,.04,12),shade(c,.6),0,.02,0,{p:g,ink:0});
  for(let i=0;i<4;i++)p(new THREE.TorusGeometry(.2+(i%2)*.02,.012,4,12,PI*1.4).rotateX(PI/2),shade(c,.7+(i%3)*.2),0,.06+i*.01,0,{p:g,ink:0}).rotation.y=i*1.7;
  [[-.05,0],[.07,.03],[0,-.07]].forEach(([x,z])=>p(sph(.06,.8,1,.8),'#e6f0ee',x,.1,z,{p:g,ink:.008}))},
 pearl(p,g){p(sph(.14,1,1,1,16),'#f4eef0',0,0,0,{p:g,ink:.012,t:{rim:2}});p(sph(.04),'#ffffff',-.05,.06,.1,{p:g,ink:0,mat:glow('#ffffff',1.4)});
  p(new THREE.TorusGeometry(.17,.012,5,16),'#8ad0e0',0,-.12,0,{p:g,ink:0}).rotation.x=PI/2},
 feather(p,g,c){c=cc(c,'#cfe8ff');p(cyl(.012,.012,.5,5).translate(0,.05,0),shade(c,.7),0,0,0,{p:g,ink:.006});
  const v=sph(.06,1,5.2,.18,10);p(v,c,.04,.1,0,{p:g,ink:.01});p(v.clone().translate(-.08,0,0),mixc(c,'#ffffff',.4),.04,.1,0,{p:g,ink:0})},
 dust(p,g,c,o){c=cc(c,'#c8a860');const pure=o&&o.g>=2;   /* ESENCIA: montoncito de polvo sobre un platillo de piedra (no es un frasco: no repite las pociones). La PURA suma cristales que brillan */
  p(cyl(.25,.22,.04,14),'#6a625a',0,-.02,0,{p:g,ink:.012});p(cyl(.19,.19,.012,14),shade('#6a625a',.7),0,.003,0,{p:g,ink:0});
  const hl={};new THREE.Color(c).getHSL(hl);const m=mixc(c,'#cfc6b4',hl.l<.25?.14:.42);p(cyl(.025,.2,.17,9),m,0,.09,0,{p:g,ink:.012});p(cyl(.02,.12,.09,8),shade(m,1.12),.07,.09,.03,{p:g,ink:0});p(sph(.085,1,.5,1,8),shade(m,.92),-.1,.045,-.06,{p:g,ink:0});p(sph(.06,1,.5,1,8),shade(m,1.05),.1,.04,-.08,{p:g,ink:0});
  for(let i=0;i<7;i++){const a=i*2.4+.5,r=.2+((i*37)%5)*.012;p(sph(.016,1,.7,1,5),mixc(c,'#cfc6b4',.2+(i%3)*.15),Math.cos(a)*r,.015,Math.sin(a)*r,{p:g,ink:0})}
  p(sph(.026),'#ffffff',.03,.15,.04,{p:g,ink:0,mat:glow(c,1.3)});
  if(pure)for(let i=0;i<3;i++){const a=i*2.1+.4;p(new THREE.OctahedronGeometry(.055,0).scale(.8,1.5,.8),mixc(c,'#ffffff',.55),Math.cos(a)*.1,.14+i*.02,Math.sin(a)*.09,{p:g,ink:.008,mat:glow(mixc(c,'#ffffff',.5),1.3)})}},
 butter(p,g,c){c=cc(c,'#f2e08a');p(box(.36,.18,.26),c,0,0,0,{p:g,ink:.014});p(box(.37,.03,.27),shade(c,1.1),0,.09,0,{p:g,ink:0});p(box(.1,.02,.2),shade(c,.85),.09,.1,0,{p:g,ink:0})},
 // ── comida y pescado ──
 steak(p,g,c){c=cc(c,'#d8605a');p(blobG(.23,1.2,.38,.95,.04),c,0,0,0,{p:g,ink:.014});p(blobG(.17,.9,.14,.65,.03),shade(c,1.18),0,.06,0,{p:g,ink:0});
  p(new THREE.TorusGeometry(.2,.03,5,14).rotateX(PI/2).scale(1.15,1,.85),'#f2e2d0',0,-.02,0,{p:g,ink:0});p(sph(.05,1,1,1),'#f2e2d0',.15,.03,.08,{p:g,ink:.008})},
 drum(p,g,c){c=cc(c,'#c8803a');p(blobG(.17,1,1.15,.9,.03),c,0,.05,0,{p:g,ink:.014});p(cyl(.032,.028,.3,6).rotateZ(.15),'#f2e8d4',.02,-.2,0,{p:g,ink:.008});
  p(sph(.045),'#f2e8d4',.06,-.35,0,{p:g,ink:.008});p(sph(.04),'#f2e8d4',.0,-.35,.03,{p:g,ink:.008})},
 egg(p,g,c){c=cc(c,'#efe2c4');p(sph(.15,.82,1.12,.82,14),c,0,.06,0,{p:g,ink:.012,t:{rim:1.8}});p(sph(.035),'#ffffff',-.04,.12,.1,{p:g,ink:0})},
 mush(p,g,c){c=cc(c,'#a85ad8');p(cyl(.05,.07,.2,7),'#e8dcc4',0,.1,0,{p:g,ink:.01});p(new THREE.SphereGeometry(.2,12,8,0,TAU,0,PI/2).scale(1,.8,1),c,0,.19,0,{p:g,ink:.014});
  [[.08,.33,.06],[-.1,.3,.02],[.0,.36,-.1]].forEach(([x,y,z])=>p(sph(.03),'#f4ecd8',x,y,z,{p:g,ink:0}))},
 rice(p,g){p(blobG(.2,1.2,.55,1,.02),'#f4f0e0',0,0,0,{p:g,ink:.012});for(let i=0;i<9;i++)p(sph(.03,2,.7,.7,6),'#fffdf4',Math.cos(i*2.2)*.13,.08+(i%3)*.025,Math.sin(i*2.2)*.1,{p:g,ink:0}).rotation.y=i;},
 salt(p,g){[[0,0,0,.14],[.12,-.04,.06,.1],[-.1,-.05,.08,.09],[.02,-.04,-.12,.09]].forEach(([x,y,z,r],i)=>p(flat(new THREE.OctahedronGeometry(r,0).scale(1,1.35,1)),i%2?'#f0d8d8':'#fff0e8',x,y+r*.4,z,{p:g,ink:.01,t:{rim:2}}))},
 bread(p,g,c){c=cc(c,'#c8903a');p(blobG(.22,1.35,.6,.8,.03),c,0,0,0,{p:g,ink:.014});for(let i=0;i<3;i++)p(box(.02,.012,.12),shade(c,1.35),(i-1)*.12,.12,0,{p:g,ink:0}).rotation.y=.5},
 burger(p,g){p(new THREE.SphereGeometry(.2,12,8,0,TAU,0,PI/2).scale(1,.7,1),'#d8964a',0,.1,0,{p:g,ink:.014});p(cyl(.21,.21,.05,12),'#5a3a22',0,.06,0,{p:g,ink:.01});p(cyl(.22,.22,.025,12),'#6ab048',0,.1,0,{p:g,ink:0});
  p(cyl(.19,.2,.06,12),'#d8964a',0,0,0,{p:g,ink:.012})},
 fish(p,g,c,o){c=cc(c,'#8aa8b8');o=o||{};const body=sph(.2,1.9,.8,.55,14);p(body,c,0,0,0,{p:g,ink:.012});p(sph(.15,1.7,.4,.5,12),o.belly||mixc(c,'#ffffff',.5),0,-.05,0,{p:g,ink:0});
  p(new THREE.ConeGeometry(.12,.2,4).rotateZ(-PI/2).scale(1,1.5,.25),shade(c,.8),-.42,0,0,{p:g,ink:.01});p(new THREE.ConeGeometry(.07,.16,3).scale(1,1,.2),shade(c,.8),.0,.17,0,{p:g,ink:.008});
  p(sph(.03),'#101010',.28,.04,.1,{p:g,ink:0});if(o.stripe)p(box(.5,.035,.005),o.stripe,0,.02,.108,{p:g,ink:0})},
 shrimp(p,g,c){c=cc(c,'#f08a6a');for(let i=0;i<5;i++){const a=i*.5;p(sph(.1-i*.012,1.1,1,1),mixc(c,'#ffffff',i*.05),Math.cos(a+PI)*.2+.1,Math.sin(a+PI)*.2+.12,0,{p:g,ink:.01})}
  p(new THREE.ConeGeometry(.06,.14,4).scale(1,1,.3),shade(c,.85),-.15,.02,0,{p:g,ink:.008});[-1,1].forEach(s=>p(cyl(.004,.004,.2,4),shade(c,.7),.18,.28,s*.04,{p:g,ink:0}).rotation.z=-.6)},
 squid(p,g,c){c=cc(c,'#8a4aa0');p(new THREE.ConeGeometry(.14,.42,8).translate(0,.2,0),c,0,.05,0,{p:g,ink:.014});p(sph(.12,1,.9,1),shade(c,1.1),0,0,0,{p:g,ink:.012});
  for(let i=0;i<6;i++){const a=i*TAU/6;p(cyl(.022,.012,.28,5).translate(0,-.14,0).rotateX(Math.sin(a)*.3).rotateZ(-Math.cos(a)*.3),shade(c,.85),Math.cos(a)*.07,-.04,Math.sin(a)*.07,{p:g,ink:.008})}
  for(const s of[-1,1])p(sph(.03),'#f4f0e0',s*.07,.0,.1,{p:g,ink:0})},
 plate(p,g,c,o){c=cc(c,'#f4f0e0');o=o||{};p(cyl(.27,.2,.04,18),c,0,0,0,{p:g,ink:.012});p(cyl(.18,.18,.012,18),shade(c,.9),0,.025,0,{p:g,ink:0});
  if(o.fish)GEN2.fish(((a,b,x,y,z,oo)=>p(a,b,x,y+.1,z,oo)),g,o.fish,{});else if(o.meat)p(blobG(.15,1.2,.4,.9,.03),o.meat,0,.08,0,{p:g,ink:.01});else p(blobG(.14,1.2,.4,.9,.03),'#c8904a',0,.08,0,{p:g,ink:.01})},
 bowl(p,g,c,o){c=cc(c,'#8a6a4a');o=o||{};const prof=[[0,0],[.1,0],[.17,.04],[.24,.16],[.26,.2],[.24,.2],[.2,.12],[.12,.07],[0,.07]].map(a=>new THREE.Vector2(a[0],a[1]));
  p(new THREE.LatheGeometry(prof,14),c,0,0,0,{p:g,ink:.012});p(cyl(.23,.23,.01,14),o.food||'#9a5a30',0,.17,0,{p:g,ink:0});
  (o.bits||[]).forEach((b,i)=>p(sph(.025),b[3],(b[0]-32)*.008,.19,(b[1]-30)*.008,{p:g,ink:0}));
  if(o.steam)[-.06,.05].forEach((x,i)=>p(new THREE.TorusGeometry(.05,.008,4,10,PI*1.3),'#e8e8e8',x,.32+i*.04,0,{p:g,ink:0,mat:new THREE.MeshBasicMaterial({color:'#e8e8e8',transparent:true,opacity:.55})}))},
 // ── equipo y objetos mágicos ──
 crown(p,g,c){c=cc(c,'#e8c040');p(cyl(.2,.17,.12,14).translate(0,.06,0),c,0,0,0,{p:g,ink:.014,t:{rim:2}});for(let i=0;i<5;i++){const a=i*TAU/5;p(new THREE.ConeGeometry(.045,.14,4),c,Math.cos(a)*.19,.19,Math.sin(a)*.19,{p:g,ink:.01});
   p(sph(.025),['#e5453a','#6ad8ff','#6ad88a'][i%3],Math.cos(a)*.2,.1,Math.sin(a)*.2,{p:g,ink:0,mat:glow(['#e5453a','#6ad8ff','#6ad88a'][i%3],1.3)})}},
 mask(p,g,c){c=cc(c,'#2a2a3a');p(sph(.2,.95,1.15,.38),c,0,0,0,{p:g,ink:.014});for(const s of[-1,1])p(box(.1,.035,.03).rotateZ(s*.35),'#e8e8e8',s*.075,.04,.075,{p:g,ink:0});
  p(box(.025,.1,.03),shade(c,1.6),0,-.04,.08,{p:g,ink:0});p(box(.46,.02,.02),shade(c,.7),0,.02,-.02,{p:g,ink:0})},
 hat(p,g,c){c=cc(c,'#4a2a6a');p(cyl(.3,.3,.03,16),c,0,0,0,{p:g,ink:.014});p(new THREE.ConeGeometry(.17,.42,10).translate(0,.23,0).rotateZ(.12),c,0,0,0,{p:g,ink:.014});
  p(new THREE.TorusGeometry(.17,.02,5,14).rotateX(PI/2),'#c8a040',0,.05,0,{p:g,ink:0})},
 shuriken(p,g,c){c=cc(c,'#c8c8d0');for(let i=0;i<4;i++){const a=i*PI/2;p(flat(new THREE.ConeGeometry(.07,.28,3).translate(0,.14,0).scale(1,1,.2).rotateZ(a)),c,0,0,0,{p:g,ink:.01,t:{rim:2}})}
  p(cyl(.05,.05,.04,10).rotateX(PI/2),shade(c,.6),0,0,0,{p:g,ink:.008})},
 core(p,g,c){c=cc(c,'#ff7a2a');p(flat(new THREE.IcosahedronGeometry(.17,0)),shade(c,.35),0,0,0,{p:g,ink:.014});p(flat(new THREE.IcosahedronGeometry(.11,0)),c,0,0,0,{p:g,ink:0,mat:glow(c,1.6)});
  for(let i=0;i<4;i++){const a=i*TAU/4+.5;p(flat(new THREE.OctahedronGeometry(.05,0).scale(1,1.6,1)),shade(c,.5),Math.cos(a)*.2,.0,Math.sin(a)*.2,{p:g,ink:.008})}},
 rune(p,g,c){c=cc(c,'#cfe8ff');p(box(.3,.38,.07),'#7a766e',0,0,0,{p:g,ink:.014});p(box(.26,.34,.02),'#5a564e',0,0,.04,{p:g,ink:0});
  p(box(.025,.2,.01),c,0,0,.055,{p:g,ink:0,mat:glow(c,1.7)});p(box(.14,.025,.01),c,0,.04,.055,{p:g,ink:0,mat:glow(c,1.7)});p(box(.025,.1,.01),c,.06,-.08,.055,{p:g,ink:0,mat:glow(c,1.7)}).rotation.z=.6},
 scroll(p,g,c){c=cc(c,'#e5453a');p(cyl(.075,.075,.42,12).rotateZ(PI/2),'#efe2c0',0,0,0,{p:g,ink:.012});for(const s of[-1,1]){p(cyl(.085,.085,.03,10).rotateZ(PI/2),'#8a5a32',s*.22,0,0,{p:g,ink:.008})}
  p(cyl(.082,.082,.05,10).rotateZ(PI/2),c,0,0,0,{p:g,ink:.008,mat:glow(c,1.1)})},
 swirl(p,g,c){c=cc(c,'#c08aff');const pts=[];for(let i=0;i<=40;i++){const a=i*.4,r=.04+i*.005;pts.push(new THREE.Vector3(Math.cos(a)*r*1.4,i*.008-.16,Math.sin(a)*r*1.4))}
  p(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),48,.035,6),c,0,0,0,{p:g,ink:0,mat:glow(c,1.5)});p(sph(.05),mixc(c,'#ffffff',.6),0,.17,0,{p:g,ink:0,mat:glow('#ffffff',1.5)})},
 bag(p,g,c){c=cc(c,'#9a6a34');p(sph(.22,1,1.05,1),c,0,0,0,{p:g,ink:.014});p(cyl(.07,.1,.1,8),shade(c,.85),0,.2,0,{p:g,ink:.01});p(new THREE.TorusGeometry(.085,.013,5,12).rotateX(PI/2),'#d8c090',0,.17,0,{p:g,ink:0});
  p(box(.12,.05,.01),shade(c,1.2),0,-.02,.21,{p:g,ink:0})}
};

// pose «en el icono» (rx, ry, rz) de cada modelo nuevo; el resto usa [0,-.4,0]
export const POSE2={dust:[.45,-.25,0],flask:[0,-.4,0],elixir:[0,-.4,0],herbplant:[.1,.3,0],hide:[.5,-.4,0],wool:[0,0,0],cloth:[.25,-.5,0],bone:[0,-.4,.5],tooth:[0,-.3,-.3],skull:[0,-.4,0],club:[0,-.4,-.7],horn:[0,-.4,.3],nest:[.45,0,0],pearl:[0,0,0],feather:[0,-.3,-.7],butter:[.2,-.5,0],
 steak:[.55,-.4,0],drum:[0,-.3,.5],egg:[0,-.3,0],mush:[0,-.4,0],rice:[.3,0,0],salt:[0,-.4,0],bread:[.3,-.4,0],burger:[.3,-.3,0],fish:[0,-.4,.35],shrimp:[0,-.3,0],squid:[0,-.4,.2],plate:[.7,-.3,0],bowl:[.55,-.3,0],
 crown:[.35,-.3,0],mask:[0,-.35,0],hat:[.2,-.4,0],shuriken:[.9,-.2,0],core:[0,.5,0],rune:[0,-.35,0],scroll:[0,-.4,.6],swirl:[0,.3,0],bag:[0,-.4,0]};
// pose en el SUELO (drops3d): lo largo se tumba; lo plano queda plano
export const DPOSE2={dust:[0,0,0],flask:[0,0,PI/2],elixir:[0,0,PI/2],herbplant:[0,0,0],hide:[0,0,0],cloth:[0,0,0],bone:[0,0,0],tooth:[0,0,PI/2],club:[0,0,PI/2],horn:[0,0,PI/2],feather:[0,0,PI/2],scroll:[0,0,0],plate:[0,0,0],bowl:[0,0,0],steak:[0,0,0],fish:[0,0,0],shrimp:[0,0,0],squid:[0,0,PI/2],mask:[-PI/2+.4,0,0],shuriken:[0,0,0],drum:[0,0,.5],rune:[-.5,0,0],nest:[0,0,0],burger:[0,0,0],bread:[0,0,0],butter:[0,0,0],wool:[0,0,0],bag:[0,0,0]};
Object.assign(GEN2,GEN3);Object.assign(POSE2,POSE3);Object.assign(DPOSE2,DPOSE3);   // los kinds de oficio usan la misma firma y las mismas tablas
