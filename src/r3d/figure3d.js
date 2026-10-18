// NotScape · R3D · FIGURAS ESTILIZADAS POR CÓDIGO (prototipo, 17 oct 2026). Sustituto PROPUESTO del héroe facetado de hero3d.js (al dueño no le gustó ese diseño).
// Objetivo (pedido del dueño): personajes ADULTOS y estilizados, NO chibi, con el aspecto «low-poly pintado» de un pack medieval (facetas planas con color
// variado cara a cara, caras con rasgos, ropa con volumen: faldas con pliegues, tabardos, capuchas, armaduras), todo GENERADO POR CÓDIGO y con el mismo estilo.
// ── Cómo funciona ──
//  · Esqueleto = el MISMO de Hero (pelvis → columna → pecho → cuello → cabeza, hombro → codo → muñeca, cadera → rodilla → tobillo) y las mismas longitudes
//    (muslo .44, espinilla .44, brazo .29, antebrazo .25, tobillo .078): las animaciones de hero3d.js se podrán reutilizar tal cual si se integra en el juego.
//  · Todo se construye con `loft()` (anillos apilados; admite sección superelíptica `e` y PLIEGUES `fold` para faldas y capas) + primitivas. Cada pieza se PINTA por
//    triángulo (`paint()`: color base × variación por cara × degradado vertical = «pintado a mano») y se FUSIONA por hueso (1 malla por hueso, ≈ 20 draw calls por figura).
//  · Material único `FM` (Lambert facetado con color por vértice + rim de contraluz + relleno desde la cámara). Contorno opcional (casco invertido) apagado por defecto:
//    WoW/Valheim/Dragonwilds no llevan contorno; la silueta la separa la luz.
//  · Un personaje = una función de DISEÑO `build(F)` que llama a los métodos de vestuario (F.tunic, F.pants, F.boots, F.skirt, F.hair…) con colores y medidas.
//    Una especie nueva (orco, esqueleto) = otra cabeza y otro torso; el resto del vestuario se reutiliza.
//  · La cara se construye por estructura de valores (cuencas, ceja, nariz, labios, mentón) apoyando cada rasgo en la superficie de la cabeza con `hz()`/`on()`.
// API: const f=new Figure(CATALOG[i]); scene.add(f.obj); cada fotograma f.update(t). f.setInk(true|false) activa el contorno.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {hash,hull,INK,G} from './materials3d.js';

const V3=THREE.Vector3,lerp=(a,b,u)=>a+(b-a)*u,cl=(v,a,b)=>Math.max(a,Math.min(b,v));
const shade=(c,k)=>'#'+new THREE.Color(c).multiplyScalar(k).getHexString();
const mixc=(a,b,t)=>'#'+new THREE.Color(a).lerp(new THREE.Color(b),t).getHexString();
export const LEN={TH:.44,SH:.44,UA:.29,FA:.25,ANK:.078};LEN.PEL=LEN.ANK+LEN.TH+LEN.SH+.04;

// ───────── geometría ─────────
// loft: anillos [y, rx, rz, ox, oz, e] (e = exponente de la superelipse: 2 elipse, >2 más cuadrado). o: rot, cap (true/false), fold {a,k,ph,p}, e (por defecto).
// Sin índice → normales planas (facetado). Cada triángulo se orienta hacia fuera.
export function loft(S,n=10,o={}){const rot=o.rot??0,rings=[];
 for(let i=0;i<S.length;i++){const s=S[i],e=s[5]??o.e??2,t=i/Math.max(1,S.length-1),r=[];
  for(let j=0;j<n;j++){const a=rot+j/n*Math.PI*2,c=Math.cos(a),sn=Math.sin(a);let m=1;if(o.fold)m=1+o.fold.a*Math.pow(t,o.fold.p??1)*Math.sin(a*o.fold.k+(o.fold.ph||0));
   const sx=e===2?c:Math.sign(c)*Math.pow(Math.abs(c),2/e),sz=e===2?sn:Math.sign(sn)*Math.pow(Math.abs(sn),2/e);
   r.push([(s[3]||0)+sx*s[1]*m,s[0],(s[4]||0)+sz*s[2]*m])}rings.push(r)}
 const cen=S.map(s=>[s[3]||0,s[0],s[4]||0]),gc=[0,0,0];cen.forEach(c=>{gc[0]+=c[0]/cen.length;gc[1]+=c[1]/cen.length;gc[2]+=c[2]/cen.length});
 const P=[],tri=(a,b,c,ref)=>{const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2],nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,
  mx=(a[0]+b[0]+c[0])/3-ref[0],my=(a[1]+b[1]+c[1])/3-ref[1],mz=(a[2]+b[2]+c[2])/3-ref[2];if(nx*mx+ny*my+nz*mz<0)P.push(...a,...c,...b);else P.push(...a,...b,...c)};
 for(let i=0;i<S.length-1;i++){const A=rings[i],B=rings[i+1],ref=[(cen[i][0]+cen[i+1][0])/2,(cen[i][1]+cen[i+1][1])/2,(cen[i][2]+cen[i+1][2])/2];
  for(let j=0;j<n;j++){const k=(j+1)%n;tri(A[j],A[k],B[k],ref);tri(A[j],B[k],B[j],ref)}}
 if(o.cap!==false)[0,S.length-1].forEach(i=>{if(S[i][1]<1e-4&&S[i][2]<1e-4)return;const R=rings[i],c=cen[i];for(let j=0;j<n;j++)tri(c,R[j],R[(j+1)%n],gc)});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.computeVertexNormals();return g}
const prep=g=>{if(g.index)g=g.toNonIndexed();if(g.attributes.uv)g.deleteAttribute('uv');g.computeVertexNormals();return g};
const box=(w,h,d,x=0,y=0,z=0)=>prep(new THREE.BoxGeometry(w,h,d)).translate(x,y,z);
const ico=(r,sx=1,sy=1,sz=1,j=0,seed=1)=>{let g=prep(new THREE.IcosahedronGeometry(r,0));const p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=1+(hash(x*7+seed,y*7,z*7)-.5)*j;p.setXYZ(i,x*sx*k,y*sy*k,z*sz*k)}g.computeVertexNormals();return g};
const cone=(r,h,n=5)=>prep(new THREE.ConeGeometry(r,h,n));
// aro elíptico (rx,rz) con tubo de radio t, en el plano XZ a altura 0
const ering=(rx,rz,t,n=14,tn=4)=>{const pts=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2;pts.push(new V3(Math.cos(a)*rx,0,Math.sin(a)*rz))}return prep(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,true),n*2,t,tn,true))};
// pintado a mano: color base × variación por CARA × degradado vertical de la pieza (g0 abajo → g1 arriba)
function paint(g,c,o={}){const col=new THREE.Color(c),p=g.attributes.position,n=p.count,arr=new Float32Array(n*3),jit=o.jit??.05,g0=o.g0??.9,g1=o.g1??1.06,seed=o.seed||1;
 g.computeBoundingBox();const bb=g.boundingBox,h=Math.max(1e-4,bb.max.y-bb.min.y);
 for(let f=0;f<n;f+=3){const cy=(p.getY(f)+p.getY(f+1)+p.getY(f+2))/3,cx=(p.getX(f)+p.getX(f+1)+p.getX(f+2))/3,t=(cy-bb.min.y)/h,k=(g0+(g1-g0)*t)*(1+(hash(cx*91+f*.13,cy*57,seed)-.5)*2*jit);
  for(let q=0;q<3;q++){arr[(f+q)*3]=col.r*k;arr[(f+q)*3+1]=col.g*k;arr[(f+q)*3+2]=col.b*k}}
 g.setAttribute('color',new THREE.Float32BufferAttribute(arr,3));return g}
// material único
export const FM=new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true});
FM.onBeforeCompile=s=>{s.uniforms.uRimCol=G.uRimCol;s.uniforms.uNight=G.uNight;
 s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 uRimCol;uniform float uNight;')
  .replace('#include <opaque_fragment>',`vec3 vdir=isOrthographic?vec3(0.,0.,1.):normalize(vViewPosition);float fv=max(dot(normal,vdir),0.);
   outgoingLight+=uRimCol*smoothstep(.5,.85,1.-fv)*(.18+.5*uNight)*.5;   // contraluz
   outgoingLight+=diffuseColor.rgb*.1*(.35+.65*fv);                        // relleno desde la cámara: lo que mira al jugador (la cara) no cae en negro
   #include <opaque_fragment>`)};
FM.customProgramCacheKey=()=>'figfm';
const basic=c=>new THREE.MeshBasicMaterial({color:c});

// ───────── cuerpo ─────────
// perfiles del torso (y relativa a la pelvis). Hombro a h≈.42, base del cuello h≈.49. oz = desplazamiento hacia delante (pecho).
const TH=[-.14,-.08,0,.08,.15,.22,.29,.36,.42,.46,.49];
const BODY={
 m:{k:1,sh:.205,hd:1.14,neck:.062,leg:[.09,.072,.059,.046],arm:[.058,.05,.044,.036],
  rx:[.118,.164,.17,.142,.138,.158,.18,.196,.2,.135,.07],rz:[.09,.114,.118,.106,.102,.108,.12,.126,.116,.082,.064],oz:[0,0,0,0,.004,.008,.012,.012,.006,-.004,-.01]},
 f:{k:.955,sh:.172,hd:1.1,neck:.05,leg:[.088,.067,.054,.042],arm:[.049,.043,.039,.032],
  rx:[.112,.158,.172,.12,.112,.13,.152,.164,.166,.116,.056],rz:[.085,.11,.118,.086,.082,.098,.122,.138,.114,.078,.054],oz:[0,0,0,0,.004,.01,.022,.026,.01,-.004,-.01]}};
BODY.big={...BODY.m,k:1.04,sh:.245,hd:1.12,neck:.088,leg:BODY.m.leg.map(v=>v*1.16),arm:BODY.m.arm.map(v=>v*1.22),rx:BODY.m.rx.map((v,i)=>v*(i>=6?1.2:1.12)),rz:BODY.m.rz.map(v=>v*1.2),oz:BODY.m.oz.map((v,i)=>i>=3&&i<=6?v+.02:v)};
BODY.lean={...BODY.m,k:1.0,sh:.175,hd:1.1,neck:.05,leg:BODY.m.leg.map(v=>v*.86),arm:BODY.m.arm.map(v=>v*.8),rx:BODY.m.rx.map(v=>v*.8),rz:BODY.m.rz.map(v=>v*.8)};
const rowAt=(B,h)=>{h=cl(h,TH[0],TH[TH.length-1]);let i=0;while(i<TH.length-2&&h>TH[i+1])i++;const u=(h-TH[i])/(TH[i+1]-TH[i]);return{rx:lerp(B.rx[i],B.rx[i+1],u),rz:lerp(B.rz[i],B.rz[i+1],u),oz:lerp(B.oz[i],B.oz[i+1],u)}};

// ───────── cabeza ─────────
// anillos de la cabeza en el hueso `head` (y desde el mentón −.04 hasta la coronilla .195). Cara hacia +z.
const HR=[[-.04,.028,.036,0,.058],[-.02,.052,.066,0,.036],[.015,.068,.088,0,.012],[.055,.074,.097,0,.003],[.095,.077,.1,0,-.002],[.135,.074,.098,0,-.006],[.17,.06,.08,0,-.012],[.195,.03,.045,0,-.014]];
function ringAt(y){y=cl(y,HR[0][0],HR[HR.length-1][0]);for(let i=0;i<HR.length-1;i++){const p=HR[i],q=HR[i+1];if(y>=p[0]&&y<=q[0]){const u=(y-p[0])/(q[0]-p[0]);return[lerp(p[1],q[1],u),lerp(p[2],q[2],u),lerp(p[4],q[4],u)]}}return[HR[0][1],HR[0][2],HR[0][4]]}
const hz=(x,y)=>{const[rx,rz,oz]=ringAt(y),u=Math.min(.98,Math.abs(x)/rx);return oz+rz*Math.sqrt(1-u*u)};
const hyaw=(x,y)=>{const[rx,rz,oz]=ringAt(y),z=hz(x,y)-oz;return Math.atan2(x/(rx*rx),z/(rz*rz))};

// ───────── el personaje ─────────
export class Figure{
 constructor(spec){this.spec=spec;const B=this.B=BODY[spec.body||'m'];this.fem=spec.body==='f';this.skin=spec.skin||'#d2a074';this.q=[];this.hulls=[];this.items=[];this.held=[];this.raw=[];this.t=0;
  this.obj=new THREE.Group();this.obj.name='fig_'+spec.id;this.root=new THREE.Group();this.root.scale.setScalar(B.k);this.obj.add(this.root);
  const Bn=(name,parent,x,y,z)=>{const b=new THREE.Group();b.name=name;b.position.set(x,y,z);parent.add(b);return b},J=this.J={},sh=B.sh-.005;
  J.pelvis=Bn('pelvis',this.root,0,LEN.PEL,0);J.spine=Bn('spine',J.pelvis,0,.08,0);J.chest=Bn('chest',J.spine,0,.21,0);J.neck=Bn('neck',J.chest,0,.2,0);J.head=Bn('head',J.neck,0,.07,0);
  [1,-1].forEach((s,i)=>{const k=i?'R':'L';J['sh'+k]=Bn('sh'+k,J.chest,sh*s,.15,0);J['el'+k]=Bn('el'+k,J['sh'+k],0,-LEN.UA,0);J['wr'+k]=Bn('wr'+k,J['el'+k],0,-LEN.FA,0);J['hd'+k]=Bn('hd'+k,J['wr'+k],0,0,0);J['grip'+k]=Bn('grip'+k,J['hd'+k],0,-.075,0);
   J['hp'+k]=Bn('hp'+k,J.pelvis,.09*s*(B.k>1?1.08:1),-.04,0);J['kn'+k]=Bn('kn'+k,J['hp'+k],0,-LEN.TH,0);J['an'+k]=Bn('an'+k,J['kn'+k],0,-LEN.SH,0);J['ft'+k]=Bn('ft'+k,J['an'+k],0,0,0)});
  J.head.scale.setScalar(B.hd);
  spec.build(this);this.bake();this.pose(spec.pose||{});this.holdFix()}
 // ── infraestructura ──
 P(bone,geo,c,o={}){if(o.pos||o.rot){const m=new THREE.Matrix4().compose(new V3(...(o.pos||[0,0,0])),new THREE.Quaternion().setFromEuler(new THREE.Euler(...(o.rot||[0,0,0]))),new V3(1,1,1));geo.applyMatrix4(m)}
  this.q.push({bone,geo:paint(prep(geo),c,o),ink:o.ink===0?0:(o.ink||.011)});return this}
 R(bone,geo,color){const m=new THREE.Mesh(geo,basic(color));bone.add(m);this.raw.push(m);return m}
 bake(){const by=new Map();this.q.forEach(p=>{if(!by.has(p.bone))by.set(p.bone,[]);by.get(p.bone).push(p)});
  by.forEach((list,bone)=>{const m=new THREE.Mesh(mergeGeometries(list.map(p=>p.geo)),FM);m.castShadow=m.receiveShadow=true;bone.add(m);
   const hs=list.filter(p=>p.ink).map(p=>hull(p.geo,p.ink).geometry);if(hs.length){const h=new THREE.Mesh(mergeGeometries(hs),INK);h.userData.hull=1;h.visible=false;bone.add(h);this.hulls.push(h)}});this.q=[]}
 setInk(on){this.hulls.forEach(h=>h.visible=!!on)}
 // objetos en la mano: grupo con malla fusionada; `up` = se mantiene vertical en el mundo (bastón, lanza) aunque el brazo esté inclinado
 prop(bone,parts,o={}){const gs=[],hs=[];parts.forEach(([g,c,po])=>{po=po||{};gs.push(paint(prep(g),c,po));if(po.ink!==0)hs.push(hull(g,po.ink||.012).geometry)});
  const grp=new THREE.Group(),m=new THREE.Mesh(mergeGeometries(gs),FM);m.castShadow=true;grp.add(m);if(hs.length){const h=new THREE.Mesh(mergeGeometries(hs),INK);h.visible=false;grp.add(h);this.hulls.push(h)}
  if(o.pos)grp.position.set(...o.pos);if(o.rot)grp.rotation.set(...o.rot);bone.add(grp);if(o.up)this.held.push({grp,rot:o.upRot||[0,0,0]});this.items.push(grp);return grp}
 holdFix(){this.root.updateMatrixWorld(true);const q=new THREE.Quaternion(),qp=new THREE.Quaternion(),qr=new THREE.Quaternion();this.root.getWorldQuaternion(qr);
  this.held.forEach(h=>{h.grp.parent.getWorldQuaternion(qp);q.copy(qp).invert().multiply(qr).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...h.rot)));h.grp.quaternion.copy(q)})}
 // ── pose estática (A-pose relajada). a* = [hombro adelante(−), hombro afuera(+L/−R), codo(−)]; legs = [cadera izq adelante, rodilla izq, cadera der, rodilla der] ──
 pose(p={}){const J=this.J,d=Object.assign({aL:[-.06,.15,-.28],aR:[-.06,-.15,-.28],legs:[.03,.06,-.02,.03],head:[0,0],pel:0,chest:0},p);
  J.shL.rotation.set(d.aL[0],0,d.aL[1],'XYZ');J.elL.rotation.set(d.aL[2],0,0);J.shR.rotation.set(d.aR[0],0,d.aR[1],'XYZ');J.elR.rotation.set(d.aR[2],0,0);
  const lg=(k,hip,kn)=>{J['hp'+k].rotation.set(-hip,0,k==='L'?.03:-.03);J['kn'+k].rotation.set(kn,0,0);J['an'+k].rotation.set(hip-kn,0,k==='L'?-.03:.03)};lg('L',d.legs[0],d.legs[1]);lg('R',d.legs[2],d.legs[3]);
  J.head.rotation.set(d.head[0],d.head[1],0);J.pelvis.rotation.y=d.pel;J.chest.rotation.y=d.chest;J.spine.rotation.y=-d.pel*.5;this.base=d}
 update(t){this.t=t;const J=this.J,d=this.base||{};J.head.rotation.y=(d.head?d.head[1]:0)+Math.sin(t*.37)*.12;J.head.rotation.x=(d.head?d.head[0]:0)+Math.sin(t*.51)*.025;
  const b=Math.sin(t*1.9+(this.spec.ph||0))*.5+.5;J.chest.scale.set(1+.006*b,1+.004*b,1+.01*b);J.shL.rotation.z=(d.aL?d.aL[1]:.15)+b*.008;J.shR.rotation.z=(d.aR?d.aR[1]:-.15)-b*.008}
 // ── rejilla del torso ──
 tr(k=0,add=0,from=-.14,to=.49,e=2){const B=this.B,hs=[from,...TH.filter(h=>h>from+1e-6&&h<to-1e-6),to],o=[];hs.forEach(h=>{const r=rowAt(B,h);o.push([h,r.rx*(1+k)+add,r.rz*(1+k)+add,0,r.oz*(1+k*.5),e])});return o}
 // ── piel: torso, cuello, brazos, manos, piernas, pies ──
 bodySkin(o={}){const B=this.B,c=this.skin,J=this.J,A=B.arm,L=B.leg;
  if(!o.noTorso)this.P(J.pelvis,loft(this.tr(),14),c,{ink:.012});
  this.neck(o);
  ['L','R'].forEach((k,i)=>{const s=i?-1:1;
   if(!o.noArms){this.P(J['sh'+k],loft([[.06,A[0]*.95,A[0]*.9],[0,A[0]*1.12,A[0]*1.06],[-.15,A[0]*1.0,A[0]*.96],[-.29,A[1],A[1]*.96]],9),c);this.P(J['el'+k],loft([[.03,A[1]*.98,A[1]*.94],[-.07,A[2]*1.12,A[2]*1.05],[-.25,A[3],A[3]*.95]],9),c)}
   this.hand(k,s,o.glove||c,o.fing);
   if(!o.noLegs){this.P(J['hp'+k],loft([[.05,L[0]*1.04,L[0]*1.0],[-.06,L[0]*1.02,L[0]*.98],[-.44,L[1],L[1]*.97]],9),c);this.P(J['kn'+k],loft([[.03,L[1]*.98,L[1]*.95],[-.12,L[2]*1.12,L[2]*1.08],[-.44,L[3],L[3]*.95]],9),c);this.foot(k,c)}});return this}
 neck(o={}){const B=this.B,n=B.neck*(o.neckK||1);this.P(this.J.neck,loft([[-.06,n*1.12,n*1.06],[.0,n,n*.97,0,.004],[.075,n*.93,n*.9,0,.014]],9),this.skin,{ink:.01});return this}
 hand(k,s,c,fing){const J=this.J,b=J['hd'+k];this.P(b,loft([[.005,.024,.034],[-.05,.027,.042,0,.004],[-.09,.02,.034,0,.008]],7),c,{ink:.008});
  [-.026,-.009,.008,.025].forEach((z,i)=>this.P(b,loft([[-.085,.011,.011],[-.125,.01,.01],[-.15-(i===1?.01:i===2?.006:0),.007,.007]],5),c,{ink:0,pos:[0,0,z+.002],rot:[.12,0,0]}));
  this.P(b,box(.014,.038,.016,-.02*s,-.04,.034),c,{ink:0,rot:[.3,0,0]})}
 foot(k,c,o={}){const f=loft([[-.065,.045,.04,0,-.01],[0,.052,.05,0,-.012],[.09,.055,.04,0,0],[.17,.042,.026,0,.012]],7).rotateX(Math.PI/2).translate(0,-.045,.012);
  this.P(this.J['ft'+k],f,c,{ink:.01});if(o.sole)this.P(this.J['ft'+k],box(.1,.016,.235,0,-.073,.05),o.sole,{ink:.007})}
 // ── cabeza y cara ──
 head(o={}){const J=this.J,fem=this.fem,sk=this.skin,H=J.head,hr=HR.map(r=>[r[0],r[1]*(fem&&r[0]<.06?.93:1)*(o.jaw&&r[0]<.06?o.jaw:1),r[2],r[3],r[4]+(o.jaw&&r[0]<.06?.012:0)]);
  this.P(H,loft(hr,16,{rot:0}),sk,{ink:.01,g0:.94,g1:1.04,jit:.03});
  const on=(m,x,y,dz=.0,tilt=0)=>{m.position.set(x,y,hz(x,y)+dz);m.rotation.set(0,hyaw(x,y),tilt);return m};
  const dark=shade(sk,.52),lipC=mixc(sk,fem?'#b04a54':'#9a5a50',fem?.5:.38),eyeC=o.eye||'#3a2a20',browC=o.brow||this.spec.hair?.c||'#3a2a20';
  // nariz
  const nz=y=>hz(0,y);this.P(H,loft([[.082,.007,.009,0,nz(.082)-.002],[.055,.011,.014,0,nz(.055)+.007],[.03,.017,.021,0,nz(.03)+.012]],4,{rot:Math.PI/4}),shade(sk,1.04),{ink:0,jit:.02});
  [1,-1].forEach(s=>this.P(H,ico(.0095,1,.8,.9),shade(sk,.94),{ink:0,pos:[.014*s,.028,nz(.028)+.004]}));
  // ojos: cuenca oscura, blanco, iris, brillo; ceja y párpado
  [1,-1].forEach(s=>{const ex=.032*s,ey=.077;
   this.P(H,box(.05,.026,.006),dark,{ink:0,jit:0,g0:1,g1:1,...{}}).q[this.q.length-1].geo.applyMatrix4(new THREE.Matrix4().compose(new V3(ex,ey-.001,hz(Math.abs(ex),ey)-.0015),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,hyaw(ex,ey),-.05*s)),new V3(1,1,1)));
   const w=this.R(H,box(.028,.013,.006),shade(mixc(sk,'#ece4d4',.7),.96));on(w,ex,ey,.0012,-.05*s);
   const ir=this.R(H,box(.0125,.0125,.006),eyeC);on(ir,ex-.0015*s,ey,.0042);
   const pu=this.R(H,box(.006,.007,.006),'#100c0a');on(pu,ex-.0015*s,ey,.0058);
   const hl=this.R(H,box(.0035,.0035,.006),'#f4ecdc');on(hl,ex+.003*s,ey+.003,.0068);
   if(fem)this.R(H,box(.034,.004,.006),'#1e1612'),on(this.raw[this.raw.length-1],ex,ey+.0105,.003,-.07*s);   // pestañas
   const br=this.R(H,box(o.brow2||.047,fem?.0085:.012,.012),browC);on(br,.034*s,.103,.0045,(o.ceño??.14)*s)});
  // boca: labios y comisura; mentón
  const mc=o.mouth??0;this.R(H,box(.034,.0055,.006),shade(sk,.4));on(this.raw[this.raw.length-1],0,.0075,.0025);
  this.R(H,box(.03,.0075,.007),lipC);on(this.raw[this.raw.length-1],0,.014,.0028);this.R(H,box(.026,.0085,.007),shade(lipC,1.06));on(this.raw[this.raw.length-1],0,-.001,.0028);
  this.P(H,box(.032,.014,.012),shade(sk,1.05),{ink:0,pos:[0,-.028,hz(0,-.028)-.002]});
  // pómulos
  [1,-1].forEach(s=>this.P(H,ico(.02,1.1,.8,.7),shade(sk,1.03),{ink:0,pos:[.05*s,.046,hz(.05,.046)-.002]}));
  // orejas
  [1,-1].forEach(s=>this.P(H,ico(.02,.5,1.15,.8,.15,s+4),shade(sk,.94),{ink:.007,pos:[.077*s,.045,-.012],rot:[0,0,.1*s]}));
  return this}
 // ── pelo (estilos como datos) ──
 hair(style,c,o={}){const H=this.J.head,hk=1,R=(y,kx=1.07,kz=1.06,dz=-.004,ax=.004)=>{const[rx,rz,oz]=ringAt(y);return[y,rx*kx+ax,rz*kz+.003,0,oz+dz]};
  if(style==='bald')return this;const cap=style==='buzz'?1.025:1.07;
  const top=o.top??.12;this.P(H,loft([R(top,cap,cap-.01),R(.145,cap,cap-.01),R(.17,cap,cap-.01),R(.195,cap,cap)],12),c,{ink:.012,jit:.08,g0:.85,g1:1.1});
  if(style==='buzz')return this;
  const back=(y0,y1,k,dz)=>{const a=ringAt(y0),b=ringAt(y1);return loft([[y0,a[0]*1.04+.004,a[1]*k,0,a[2]+dz],[(y0+y1)/2,(a[0]+b[0])/2*1.05+.004,(a[1]+b[1])/2*k,0,(a[2]+b[2])/2+dz],[y1,b[0]*1.0+.002,b[1]*k*.9,0,b[2]+dz]],12)};
  if(style==='short'||style==='side')this.P(H,back(.125,.055,1.0,-.014),c,{ink:.01,jit:.08});
  if(style==='short'){[1,-1].forEach(s=>this.P(H,box(.016,.05,.04,.077*s,.085,-.004),c,{ink:.006}));this.P(H,loft([[.125,.05,.014,0,.088],[.1,.045,.012,.012,.094]],5),c,{ink:.007,rot:[0,0,0]})}
  if(style==='side'){this.P(H,loft([[.15,.065,.02,.012,.07],[.1,.05,.012,.02,.092]],6),c,{ink:.008});[1,-1].forEach(s=>this.P(H,box(.016,.06,.04,.077*s,.08,-.004),c,{ink:.006}))}
  if(style==='long'||style==='mane'){const L=style==='long'?-.3:-.16;this.P(H,back(.125,.0,1.1,-.034),c,{ink:.01,jit:.08});this.P(H,loft([[.0,.08,.05,0,-.1],[(L)/2,.085,.045,0,-.112],[L,.075,.04,0,-.112]],9,{fold:{a:.07,k:5,ph:.5}}),c,{ink:.01,jit:.08});
   [1,-1].forEach(s=>this.P(H,loft([[.1,.02,.03,0,0],[.0,.022,.03,0,.0],[style==='long'?-.2:-.1,.018,.026]],6),c,{ink:.008,pos:[.083*s,0,0.0],jit:.08}));
   this.P(H,loft([[.15,.065,.02,.012,.07],[.1,.05,.012,.02,.092]],6),c,{ink:.008})}
  if(style==='bun'){this.P(H,back(.125,.05,1.0,-.016),c,{ink:.01});this.P(H,ico(.045,1,.9,1,.2,5),c,{ink:.01,pos:[0,.2,-.075]});this.P(H,loft([[.15,.065,.02,.012,.07],[.1,.05,.012,.02,.092]],6),c,{ink:.008})}
  if(style==='pony'){this.P(H,back(.125,.05,1.0,-.02),c,{ink:.01});this.P(H,loft([[.15,.065,.02,.012,.07],[.1,.05,.012,.02,.092]],6),c,{ink:.008});this.P(H,loft([[.14,.026,.024,0,-.1],[.06,.036,.032,0,-.15],[-.08,.028,.026,0,-.19],[-.2,.006,.006,0,-.18]],7),c,{ink:.01,jit:.08});this.P(H,box(.05,.014,.05,0,.14,-.1),shade(c,.6),{ink:0})}
  if(style==='mohawk')for(let i=0;i<7;i++)this.P(H,cone(.018,.09-.004*Math.abs(i-3),4),c,{ink:.006,pos:[0,.17-Math.abs(i-3)*.004,.07-i*.026],rot:[-.2+i*.07,0,0]});
  return this}
 beard(style,c){const H=this.J.head,lng=style==='larga';const r=(y,k,dz)=>{const[rx,rz,oz]=ringAt(Math.max(y,-.04));return[y,rx*k,rz*.55,0,oz+rz*.42+dz]};
  this.P(H,loft([r(.055,1.02,.012),r(.025,1.04,.02),r(-.01,.9,.024),lng?r(-.1,.55,.03):r(-.04,.62,.02),lng?[-.22,.012,.012,0,.09]:[-.052,.014,.014,0,.1]],10),c,{ink:.01,jit:.08,g0:.85,g1:1.05});
  this.P(H,box(.058,.014,.02,0,.032,hz(0,.032)+.004),c,{ink:.006});this.R(H,box(.0,0,0),c);this.raw.pop().parent.remove(this.raw[this.raw.length]||H);return this}
 // ── vestuario ──
 tunic(o){const J=this.J,B=this.B,A=B.arm,c=o.c,sl=o.sleeve??'long',k=o.k??.055,ad=.004,rows=this.tr(k,ad,o.from??-.02,.465,o.e??2);
  if(o.len){const r=rowAt(B,-.02),ln=o.len;rows.unshift([-.02-ln*.55,r.rx*(1+k)*(1.1+(o.flare||0)*.4)+ad,r.rz*(1+k)*(1.08+(o.flare||0)*.3)+ad,0,0],[-.02-ln,r.rx*(1+k)*(1.18+(o.flare||0)*.8)+ad,r.rz*(1+k)*(1.14+(o.flare||0)*.6)+ad,0,0])}
  rows.sort((a,b)=>b[0]-a[0]);const ord=rows.slice().reverse();
  this.P(J.pelvis,loft(rows.slice().reverse(),14,{fold:o.len?{a:o.fold??.05,k:7,ph:.3,p:1.4}:undefined,e:o.e}),c,{ink:.012,seed:o.seed});
  if(o.trim&&o.len)this.P(J.pelvis,loft([[-.02-o.len+.012,rows[0][1]*1.005,rows[0][2]*1.005],[-.02-o.len-.012,rows[0][1]*1.012,rows[0][2]*1.012]],14,{fold:{a:o.fold??.05,k:7,ph:.3,p:1.4}}),o.trim,{ink:.006});
  this.neckRing(o.collar||shade(c,.88),o.collarH);
  ['L','R'].forEach((k2,i)=>{if(sl==='none')return;const sk=sl==='short'?.55:1;
   this.P(J['sh'+k2],ico(A[0]*1.42,1.05,1.0,1.0,.12,i+3),c,{ink:.01,pos:[0,.01,0]});
   this.P(J['sh'+k2],loft([[.06,A[0]*1.0,A[0]*.97],[0,A[0]*1.2,A[0]*1.14],[-.15,A[0]*1.1,A[0]*1.06],[-.29,A[1]*1.12,A[1]*1.07]],9),c,{ink:.011});
   if(sl==='long')this.P(J['el'+k2],loft([[.04,A[1]*1.1,A[1]*1.05],[-.07,A[2]*1.22,A[2]*1.15],[-.2,A[3]*1.2,A[3]*1.14],[-.25,A[3]*1.1,A[3]*1.04]],9),c,{ink:.011});
   else if(sl==='rolled'){this.P(J['el'+k2],loft([[.04,A[1]*1.12,A[1]*1.08],[-.0,A[1]*1.15,A[1]*1.1]],9),shade(c,.86),{ink:.008})}
   if(o.cuff&&sl==='long')this.P(J['el'+k2],loft([[-.2,A[3]*1.3,A[3]*1.25],[-.248,A[3]*1.28,A[3]*1.22]],9),o.cuff,{ink:.008})});return this}
 neckRing(c,h=.48){const B=this.B,n=B.neck;this.P(this.J.pelvis,loft([[h-.035,n*2.0,n*1.9,0,-.004],[h,n*1.72,n*1.62,0,-.004],[h+.04,n*1.38,n*1.32,0,0]],10),c,{ink:.01});return this}
 pants(o){const J=this.J,B=this.B,L=B.leg,c=o.c,k=.05;this.P(J.pelvis,loft(this.tr(k,.004,-.14,.1),14),c,{ink:.012});
  ['L','R'].forEach(s=>{this.P(J['hp'+s],loft([[.05,L[0]*1.14,L[0]*1.1],[-.06,L[0]*1.12,L[0]*1.07],[-.44,L[1]*1.12,L[1]*1.07]],9),c,{ink:.011});
   this.P(J['kn'+s],loft([[.03,L[1]*1.1,L[1]*1.06],[-.12,L[2]*1.2,L[2]*1.14],[-.44,L[3]*(o.baggy?1.4:1.2),L[3]*(o.baggy?1.34:1.15)]],9),o.c2||c,{ink:.011})});return this}
 boots(o){const L=this.B.leg,c=o.c,top=o.tall??.17;
  ['L','R'].forEach(s=>{const kn=this.J['kn'+s];this.P(kn,loft([[-.44+top+.03,L[2]*1.34,L[2]*1.3],[-.44+top-.01,L[2]*1.42,L[2]*1.38],[-.44+top-.035,L[2]*1.3,L[2]*1.26],[-.3,L[3]*1.3,L[3]*1.26],[-.44,L[3]*1.32,L[3]*1.28]],9),c,{ink:.012});
   this.foot(s,c,{sole:shade(c,.55)});this.P(this.J['ft'+s],loft([[-.065,.05,.043,0,-.01],[0,.058,.054,0,-.012]],7).rotateX(Math.PI/2).translate(0,-.045,.012),c,{ink:0});
   if(o.cuff)this.P(kn,loft([[-.44+top+.05,L[2]*1.45,L[2]*1.4],[-.44+top+.02,L[2]*1.4,L[2]*1.36]],9),o.cuff,{ink:.008})});return this}
 skirt(o){const B=this.B,r=rowAt(B,.1),r2=rowAt(B,-.02),fl=o.flare??1,top=o.top??.12,floor=-LEN.PEL+.02,len=o.len==null?floor:top-o.len;
  const bot=Math.max(floor,top-(o.len??9)),R=o.R??(r2.rx*(1.5+fl*.9)),k=1.05;
  const rows=[[top,r.rx*k+.004,r.rz*k+.004,0,0],[(top-.02),r2.rx*1.14,r2.rz*1.14,0,0],[(top+bot)/2*.8+bot*.2,lerp(r2.rx*1.14,R,.55),lerp(r2.rz*1.14,R*.92,.55),0,0],[bot,R,R*.92,0,0]];
  this.P(this.J.pelvis,loft(rows,16,{fold:{a:o.fold??.06,k:8,ph:.4,p:1.2}}),o.c,{ink:.012});
  if(o.trim)this.P(this.J.pelvis,loft([[bot+.035,R*.997,R*.917],[bot,R*1.005,R*.925]],16,{fold:{a:o.fold??.06,k:8,ph:.4,p:1.2},cap:false}),o.trim,{ink:.006});return this}
 belt(c,buckle='#c8a050',h=.085){const B=this.B,r=rowAt(B,h);this.P(this.J.pelvis,loft([[h-.026,r.rx*1.09+.004,r.rz*1.1+.004,0,r.oz],[h+.026,r.rx*1.09+.004,r.rz*1.1+.004,0,r.oz]],14,{e:2.2}),c,{ink:.01});
  this.P(this.J.pelvis,box(.05,.044,.016,0,h,r.rz*1.1+.012+r.oz),buckle,{ink:.007});return this}
 bands(c,hs,k=.065){hs.forEach(h=>{const r=rowAt(this.B,h);this.P(this.J.pelvis,loft([[h,r.rx*(1+k)+.007,r.rz*(1+k)+.007,0,r.oz],[h+.01,r.rx*(1+k)+.007,r.rz*(1+k)+.007,0,r.oz]],14),c,{ink:0,jit:0})});return this}
 bandolier(c,c2){const B=this.B,r=rowAt(B,.3),t=ering(r.rx*1.12,r.rz*1.18,.016).rotateZ(.62).translate(0,.3,0);this.P(this.J.pelvis,t,c,{ink:.008});
  this.P(this.J.pelvis,box(.04,.045,.018,r.rx*.45,.23,r.rz*1.2),c2||c,{ink:.007,rot:[0,0,.3]});return this}
 apron(c,o={}){const r=rowAt(this.B,.3),h0=o.h0??.37,h1=o.h1??-.38,lw=this.B.rx[3]*(o.w||1.0);
  this.P(this.J.pelvis,loft([[h0,lw*.62,.011,0,r.rz*1.12+r.oz],[.12,lw*.7,.012,0,r.rz*1.08],[h1,lw*.95,.016,0,.118*1.2]],4,{e:7,rot:Math.PI/4}),c,{ink:.01,seed:3});
  this.P(this.J.pelvis,box(.02,.02,.25,lw*.55,h0-.02,r.oz*.3),shade(c,.82),{ink:0,rot:[0,0,-.1]});this.P(this.J.pelvis,box(.02,.02,.25,-lw*.55,h0-.02,r.oz*.3),shade(c,.82),{ink:0,rot:[0,0,.1]});return this}
 tabard(c,emb){const r=rowAt(this.B,.3),lw=this.B.rx[3]*1.35;[1,-1].forEach(f=>this.P(this.J.pelvis,loft([[.4,lw*.62,.011,0,f>0?r.rz*1.22+r.oz:-r.rz*1.2],[.1,lw*.72,.013,0,f>0?.15:-.14],[-.34,lw*.8,.014,0,f>0?.16:-.15]],4,{e:7,rot:Math.PI/4}),c,{ink:.011,seed:f+5}));
  if(emb)this.P(this.J.pelvis,loft([[.33,.045,.004],[.26,.04,.004],[.2,.0,.0]],4,{rot:Math.PI/4}),emb,{ink:.006,pos:[0,0,r.rz*1.28+r.oz+.004],jit:.02});return this}
 scarf(c,o={}){const B=this.B,n=B.neck,J=this.J;this.P(J.pelvis,loft([[.43,n*2.5,n*2.3,0,0],[.465,n*2.7,n*2.5,0,.002],[.5,n*2.0,n*1.9,0,.004]],10),c,{ink:.012});this.P(J.pelvis,ico(.045,1.1,.9,.9,.2,9),shade(c,.92),{ink:.01,pos:[n*1.3,.45,n*2.35]});
  this.P(J.pelvis,loft([[.44,.04,.012,0,0],[.28,.045,.012,0,.012],[.12,.04,.012,0,.02]],4,{e:5,rot:Math.PI/4}),shade(c,.9),{ink:.01,pos:[n*1.35,0,n*2.6],rot:[0,0,0.05]});
  this.P(J.pelvis,loft([[.44,.05,.012,0,0],[.28,.05,.012,0,-.04],[.12,.045,.012,0,-.1]],4,{e:5,rot:Math.PI/4}),shade(c,.84),{ink:.01,pos:[-n*.4,-.02,-n*2.0],rot:[0,0,-.04]});return this}
 hood(c,up=false){const H=this.J.head,hk=1;if(up){this.P(H,loft([[-.05,.085,.1,0,-.03],[.06,.105,.122,0,-.032],[.15,.102,.115,0,-.034],[.225,.065,.08,0,-.045],[.29,.0,.0,0,-.1]],12),c,{ink:.014,jit:.04});this.P(H,loft([[-.06,.09,.11,0,-.01],[-.01,.1,.12,0,-.012]],12),shade(c,.8),{ink:0})}
  else this.P(this.J.pelvis,loft([[.42,.115,.12,0,-.03],[.5,.11,.115,0,-.055],[.54,.08,.09,0,-.095]],10),c,{ink:.012});return this}
 cloak(c,o={}){const B=this.B,len=o.len??.95,sh=B.sh;this.P(this.J.pelvis,loft([[.47,sh*1.05,.018,0,-.1],[.2,sh*1.3,.02,0,-.145],[-.2,sh*1.6,.024,0,-.17],[.47-len,sh*2.0,.03,0,-.19]],12,{e:4,fold:{a:.05,k:6,ph:.2,p:1.5}}),c,{ink:.012});
  this.P(this.J.pelvis,loft([[.42,B.neck*2.9,B.neck*2.6,0,-.01],[.5,B.neck*2.5,B.neck*2.3,0,-.01]],10),shade(c,.9),{ink:.01});return this}
 capelet(c,o={}){const B=this.B;this.P(this.J.pelvis,loft([[.5,B.neck*2.2,B.neck*2.0,0,-.01],[.44,B.sh*1.18,B.rz[8]*1.45,0,-.005],[.31,B.sh*1.34,B.rz[8]*1.62,0,-.005]],12,{cap:false,fold:{a:.04,k:6}}),c,{ink:.012});return this}
 // armadura
 breastplate(c,o={}){const J=this.J,B=this.B;this.P(J.pelvis,loft(this.tr(.1,.008,.13,.465,2.5),14),c,{ink:.012,g0:.85,g1:1.12});this.P(J.pelvis,loft(this.tr(.08,.006,.05,.14,2.4),14),shade(c,.88),{ink:.01});
  const r=rowAt(B,.3);this.P(J.pelvis,box(.024,.2,.03,0,.31,r.rz*1.13+r.oz+.008),shade(c,1.15),{ink:.008,rot:[.08,0,0]});
  for(let i=0;i<3;i++){const r2=rowAt(B,-.04),w=B.rx[2]*(1.2-i*.08);this.P(J.pelvis,loft([[-.04-i*.07+.045,w*1.0+.01,r2.rz*1.2],[-.04-i*.07-.03,w*1.07+.01,r2.rz*1.28]],14,{e:2.4}),shade(c,.94-i*.03),{ink:.01})}return this}
 pauldron(k,c,big=1){const s=k==='L'?1:-1,A=this.B.arm[0];this.P(this.J['sh'+k],ico(A*2.0*big,1.25,.78,1.15,.1,s+8),c,{ink:.013,pos:[.025*s,.035,0],rot:[0,0,-.3*s]});
  this.P(this.J['sh'+k],loft([[.0,A*2.25*big,A*2.2*big],[-.03,A*2.15*big,A*2.1*big]],10,{e:2.2}),shade(c,.8),{ink:.008,pos:[.03*s,.0,0]});return this}
 bracer(c,o={}){const A=this.B.arm;['L','R'].forEach(k=>this.P(this.J['el'+k],loft([[-.07,A[2]*1.28,A[2]*1.24],[-.24,A[3]*1.3,A[3]*1.26]],9),c,{ink:.011}));return this}
 greaves(c){const L=this.B.leg;['L','R'].forEach(k=>this.P(this.J['kn'+k],loft([[-.03,L[1]*1.2,L[1]*1.16],[-.13,L[2]*1.32,L[2]*1.28],[-.38,L[3]*1.32,L[3]*1.26]],9),c,{ink:.012,g0:.85,g1:1.1}));return this}
 helm(c,style='kettle',o={}){const H=this.J.head;const R=(y,k=1.1)=>{const[rx,rz,oz]=ringAt(y);return[y,rx*k+.004,rz*k+.004,0,oz-.002]};
  if(style==='kettle'){this.P(H,loft([R(.05,1.1),R(.11,1.12),R(.16,1.1),R(.195,.9),[.215,.02,.02,0,-.014]],14),c,{ink:.014,g0:.85,g1:1.1});this.P(H,loft([[.1,.145,.155,0,-.01],[.085,.15,.16,0,-.01]],16,{e:2.2}),shade(c,.85),{ink:.012});
   this.P(H,box(.02,.09,.014,0,.07,hz(0,.07)+.012),shade(c,1.1),{ink:.008});this.P(H,loft([[.05,.1,.01,0,-.108],[.0,.1,.01,0,-.112]],10),shade(c,.9),{ink:.008})}
  if(style==='great'){this.P(H,loft([R(-.02,1.28),R(.06,1.2),R(.14,1.18),R(.195,1.0),[.215,.02,.02,0,-.014]],14),c,{ink:.014});this.P(H,box(.1,.012,.012,0,.082,hz(0,.082)+.014),'#0a0a0e',{ink:0});this.P(H,box(.012,.1,.012,0,.03,hz(0,.03)+.014),'#15151a',{ink:0})}
  if(style==='crest')this.P(H,box(.014,.08,.17,0,.235,-.01),'#a83a32',{ink:.008});return this}
 // ── objetos ──
 sword(bone,o={}){const len=o.len??.72,gc=o.guard??'#b89a50',bc=o.c??'#b8c0c8';
  return this.prop(bone,[[loft([[.01,.028,.014],[.13,.026,.014]],6),LEATHERC,{ink:.008}],[ico(.032,1,1,1,.1),gc,{pos:[0,.15,0],ink:.008}],[box(.2,.032,.04),gc,{ink:.01}],[loft([[-.01,.026,.0065],[-len*.88,.024,.006],[-len,.004,.003]],4,{rot:0}),bc,{ink:.01,g0:.95,g1:1.08}]],o)}
 staff(bone,o={}){const L=o.L??1.8;return this.prop(bone,[[loft([[L*.55,.021,.021],[-L*.45,.017,.017]],7),'#6a4a2e',{ink:.01}],[ico(.034,1,1,1,.15,2),'#8a7a5a',{pos:[0,L*.55+.01,0],ink:.008}],[loft([[L*.55-.02,.04,.04],[L*.55+.06,.06,.06],[L*.55+.11,.03,.03]],7,{cap:false}),'#8a7a5a',{ink:.008}]],{...o,up:1})}
 orb(bone,col,y){const m=new THREE.Mesh(prep(new THREE.IcosahedronGeometry(.062,1)),new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(1.9)}));m.position.y=y;bone.add(m);this.raw.push(m);return m}
}
const LEATHERC='#5a3e2c';

// ═══════════ CATÁLOGO DE DISEÑOS (datos + vestuario) ═══════════
// Paleta: colores de tela apagados (tierra, ceniza, musgo, vino, noche) y UN acento por personaje (guía de personajes 3D). Hex sRGB.
export const CATALOG=[
 {id:'errante',name:'Errante',role:'héroe · cuerpo a cuerpo',body:'m',skin:'#d2a074',hair:{style:'short',c:'#4a3524'},ph:0,pose:{legs:[.05,.09,-.02,.04],head:[0,-.05]},
  build(F){F.bodySkin({noTorso:1,noLegs:0});F.head({eye:'#3a2a20'});F.hair('short','#4a3524');F.beard('corta','#4a3524');
   F.pants({c:'#4a4338',c2:'#4a4338'});F.boots({c:'#4a3426',tall:.2,cuff:'#6a4a34'});F.tunic({c:'#7a6a4a',len:.16,sleeve:'long',collar:'#6a5a3e',cuff:'#5a4a34',fold:.04});F.bands('#5e4f36',[.14,.22,.3,.38]);
   F.belt('#4a3426');F.bandolier('#5a3e2c','#6a4a30');F.scarf('#b8862e');F.bracer('#5a3e2c');
   const sw=F.sword(F.J.pelvis,{pos:[-.19,.2,-.16],rot:[Math.PI,0,-.72]});F.pauldron('L','#6a5a42',.8)}},
 {id:'exploradora',name:'Exploradora',role:'héroe · a distancia',body:'f',skin:'#e0b08a',hair:{style:'pony',c:'#7a3a22'},ph:1.4,pose:{legs:[-.02,.04,.07,.11],aR:[-.05,-.16,-.3],head:[.02,.08]},
  build(F){F.bodySkin({noTorso:1,noLegs:0});F.head({eye:'#4a6a3a',mouth:1});F.hair('pony','#7a3a22');
   F.pants({c:'#5a4632',c2:'#5a4632'});F.boots({c:'#4a3426',tall:.22,cuff:'#7a5a3e'});F.tunic({c:'#cdbfa0',len:.1,sleeve:'long',cuff:'#8a7a5a',collar:'#b0a280'});
   F.tunic({c:'#4a5a38',len:.09,sleeve:'none',k:.1,from:.0,collar:'#3a4a2c',fold:.05});F.bands('#2e3a22',[.2,.3]);F.belt('#4a3426');F.hood('#3a4436',false);F.bracer('#5a3e2c');
   F.prop(F.J.pelvis,[[loft([[.2,.05,.05],[-.2,.045,.045]],7),'#5a3e2c',{ink:.01}],...[0,1,2].map(i=>[loft([[.0,.006,.006],[.14,.005,.005]],4),'#d8d0c0',{pos:[(i-1)*.014,.21,0],ink:0}]) ],{pos:[.06,.4,-.17],rot:[0,0,.45]});
   F.prop(F.J.pelvis,[[prepBow(),'#6a4a2a',{ink:.01}]],{pos:[-.14,.36,-.18],rot:[0,.2,-.5]})}},
 {id:'guardia',name:'Guardia',role:'PNJ · aldea',body:'m',skin:'#caa078',hair:{style:'short',c:'#3a2a20'},ph:2.5,pose:{legs:[.02,.05,.02,.05],aR:[-.18,-.2,-.5],head:[.02,0]},
  build(F){F.bodySkin({noTorso:1,noLegs:0,glove:'#8a8e96'});F.head({eye:'#3a2a20'});F.hair('short','#3a2a20',{top:.14});F.beard('corta','#3a2a20');
   F.pants({c:'#4a4a52',c2:'#4a4a52'});F.boots({c:'#3a2e26',tall:.26,cuff:'#8a8e96'});F.tunic({c:'#5a5e66',len:.2,sleeve:'long',collar:'#4a4e56'});F.breastplate('#8a8e96');F.tabard('#7a2e2e','#d8b050');F.belt('#3a2e26','#b89a50');
   F.pauldron('L','#8a8e96',.95);F.pauldron('R','#8a8e96',.95);F.bracer('#8a8e96');F.greaves('#8a8e96');F.helm('#8a8e96','kettle');
   const sp=F.prop(F.J.gripR,[[loft([[.35,.017,.017],[-1.4,.015,.015]],7),'#6a4a2e',{ink:.01}],[loft([[-1.38,.03,.012],[-1.46,.036,.012],[-1.7,.002,.002]],4,{rot:0}),'#cfd4dc',{ink:.01}],[loft([[-1.36,.024,.024],[-1.4,.024,.024]],7),LEATHERC,{ink:.008}]],{up:1});
   F.prop(F.J.pelvis,[[loft([[.2,.0,.0],[.16,.2,.03],[-.02,.22,.04],[-.2,.16,.035],[-.36,.0,.0]],6,{rot:0}).rotateY(Math.PI/2),'#7a2e2e',{ink:.012}],[ico(.045,1,1,.5),'#d8b050',{ink:.008,pos:[0,.04,.045]}]],{pos:[0,.12,-.2],rot:[0,0,0]})}},
 {id:'hechicera',name:'Hechicera',role:'héroe · magia',body:'f',skin:'#e6c4a0',hair:{style:'long',c:'#241c2a'},ph:3.6,pose:{legs:[.0,.02,.0,.02],aR:[-.2,-.22,-.55],head:[.03,.1]},
  build(F){F.bodySkin({noTorso:1,noLegs:1});F.head({eye:'#5a3a8a',mouth:0});F.hair('long','#241c2a');F.boots({c:'#2a2230',tall:.12});
   F.tunic({c:'#2e3258',len:0,sleeve:'long',cuff:'#a08a60',collar:'#a08a60',k:.045});F.skirt({c:'#2e3258',top:.12,flare:1.15,trim:'#a08a60',fold:.07});F.belt('#a08a60','#d8b050',.1);F.capelet('#3e3a58');F.neckRing('#2a2644',.5);
   const st=F.staff(F.J.gripR,{L:1.75,pos:[0,0,0]});F.orb(st,'#8ad0ff',1.75*.55+.1)}},
 {id:'herrero',name:'Herrero',role:'PNJ · aldea',body:'big',skin:'#c88a60',hair:{style:'bald',c:'#5a3a28'},ph:4.7,pose:{legs:[.03,.06,.0,.04],aR:[-.25,-.2,-1.45],aL:[-.1,.2,-.3],head:[.03,-.1]},
  build(F){F.bodySkin({noTorso:0,noLegs:0,glove:'#4a3426'});F.head({eye:'#3a2a20',jaw:1.12,brow2:.055});F.beard('corta','#5a3a28');
   F.pants({c:'#3e3c38',c2:'#3e3c38'});F.boots({c:'#3a2c24',tall:.22,cuff:'#5a4636'});F.tunic({c:'#a89c80',len:.14,sleeve:'rolled',collar:'#8a7e62',k:.05});F.apron('#4a3426',{w:1.08});F.belt('#3a2c24');F.bracer('#3a2c24');
   F.prop(F.J.gripR,[[loft([[.12,.02,.02],[-.5,.022,.022]],7),'#6a4a2e',{ink:.01}],[box(.09,.1,.2),'#7a7e86',{pos:[0,-.55,0],ink:.012}]],{rot:[0,0,0]})}},
 {id:'aldeana',name:'Aldeana',role:'PNJ · aldea',body:'f',skin:'#e2b894',hair:{style:'bun',c:'#6a4a30'},ph:5.8,pose:{legs:[.0,.02,.0,.02],aL:[-.2,.14,-.6],aR:[-.1,-.16,-.3],head:[.0,.1]},
  build(F){F.bodySkin({noTorso:1,noLegs:1});F.head({eye:'#3a2a20'});F.hair('bun','#6a4a30');F.boots({c:'#4a3426',tall:.1});
   F.tunic({c:'#6a82a8',len:0,sleeve:'long',cuff:'#d8ccb0',collar:'#d8ccb0',k:.045});F.skirt({c:'#6a82a8',top:.12,flare:.9,fold:.05,len:.7,trim:'#d8ccb0'});F.apron('#d8ccb0',{h0:.3,h1:-.6,w:1.05});F.belt('#6a4a30','#b8a070',.1);
   // pañuelo
   F.P(F.J.head,loft([[.11,.09,.1,0,-.01],[.17,.08,.096,0,-.012],[.22,.03,.04,0,-.014]],12),'#b04a3a',{ink:.012});F.P(F.J.head,ico(.034,1,.9,1,.2,3),'#b04a3a',{ink:.008,pos:[0,.13,-.1]})}},
 {id:'bandido',name:'Bandido',role:'enemigo · humano',body:'lean',skin:'#c89060',hair:{style:'short',c:'#2a1a12'},ph:6.9,pose:{legs:[.07,.12,-.04,.06],aR:[-.45,-.2,-.9],aL:[-.15,.25,-.5],head:[.05,.08]},
  build(F){F.bodySkin({noTorso:1,noLegs:0});F.head({eye:'#2a2018',ceño:.28});F.pants({c:'#34302c',c2:'#34302c'});F.boots({c:'#3a2c24',tall:.2,cuff:'#26201c'});
   F.tunic({c:'#4a3a2c',len:.2,sleeve:'long',cuff:'#cfc4a8',collar:'#3a2e26',fold:.06,seed:7});F.tunic({c:'#3a2e26',len:.14,sleeve:'none',k:.1,from:.0,fold:.06});F.belt('#2a2018','#8a7a5a');F.bandolier('#2a2018');
   F.P(F.J.head,loft([[-.01,.08,.095,0,.02],[.045,.088,.104,0,.012],[.075,.084,.1,0,.01]],12),'#6a2a26',{ink:.01,jit:.05});   // pañuelo en la cara
   F.hood('#33302c',true);F.cloak('#2e2a28',{len:.75});
   F.prop(F.J.gripR,[[loft([[.01,.02,.012],[.1,.019,.012]],6),LEATHERC,{ink:.008}],[box(.1,.02,.03),'#8a7a5a',{ink:.008}],[loft([[-.0,.021,.005],[-.28,.019,.0045],[-.34,.003,.003]],4,{rot:0}),'#b8c0c8',{ink:.008}]],{rot:[-.6,0,0]})}},
 {id:'orco',name:'Orco',role:'enemigo · humanoide',body:'big',skin:'#6a8a4a',hair:{style:'mohawk',c:'#1a1a18'},ph:8,pose:{legs:[.08,.14,-.05,.08],aR:[-.4,-.25,-.8],aL:[-.1,.3,-.4],head:[.08,.1]},
  build(F){F.bodySkin({noTorso:0,noLegs:0,glove:'#5a7a3c',neckK:1.15});F.head({eye:'#e8c040',jaw:1.3,brow2:.07,ceño:.3,brow:'#1a1a18'});
   [1,-1].forEach(s=>{F.P(F.J.head,cone(.012,.05,4),'#e8e0c0',{ink:.006,pos:[.03*s,.006,hz(.03,.006)+.002],rot:[-.3,0,.1*s]});F.P(F.J.head,cone(.018,.07,4),shade(F.skin,.9),{ink:.008,pos:[.088*s,.075,-.02],rot:[0,0,-1.2*s]})});
   F.hair('mohawk','#1a1a18');F.pants({c:'#4a3a2c',c2:'#4a3a2c'});
   F.P(F.J.pelvis,loft([[.02,.19,.14],[-.1,.205,.15],[-.32,.215,.16]],12,{fold:{a:.06,k:7}}),'#5a4a3a',{ink:.012});   // faldón de cuero
   F.boots({c:'#3a2c24',tall:.12,cuff:'#5a4a3a'});F.belt('#2a2018','#8a7a5a',.06);F.bandolier('#3a2a20');F.pauldron('L','#5a5048',1.2);
   [0,1,2].forEach(i=>F.P(F.J.shL,cone(.025,.09,4),'#8a8e96',{ink:.006,pos:[.08+i*.0,.09,(i-1)*.05],rot:[0,0,-.3]}));F.bracer('#4a3a2c');
   F.prop(F.J.gripR,[[loft([[.2,.022,.022],[-.7,.024,.024]],7),'#5a3e2c',{ink:.01}],[box(.04,.3,.2),'#7a7e86',{pos:[0,-.55,.0],ink:.012}],[box(.05,.1,.05),'#4a4e56',{pos:[0,-.38,0],ink:.01}]],{rot:[-.5,0,0]})}},
 {id:'esqueleto',name:'Esqueleto',role:'enemigo · no muerto',body:'lean',skin:'#d8cfb4',ph:9.1,pose:{legs:[.05,.09,-.03,.05],aR:[-.35,-.22,-.9],aL:[-.1,.25,-.4],head:[.06,-.08]},
  build(F){const J=F.J,bn='#d8cfb4',bd=shade(bn,.78),A=.017;
   // cráneo y mandíbula
   const hr=HR.map(r=>[r[0],r[1]*(r[0]<.06?.82:.96),r[2],r[3],r[4]]);F.P(J.head,loft(hr.filter(r=>r[0]>=.015),14),bn,{ink:.01});F.P(J.head,loft([[-.035,.024,.03,0,.062],[-.015,.044,.052,0,.04],[.02,.052,.07,0,.014]],10),shade(bn,.94),{ink:.01,pos:[0,-.004,.004]});
   for(let i=0;i<7;i++)F.P(J.head,box(.008,.012,.006),'#ece4cc',{ink:0,pos:[(i-3)*.0085,.026,hz((i-3)*.0085,.026)-.004]});
   [1,-1].forEach(s=>{F.P(J.head,ico(.024,1,1.05,.6),'#120e10',{ink:0,pos:[.032*s,.076,hz(.032,.076)-.003]});F.R(J.head,ico(.0095,1,1,1),'#8ae0ff').position.set(.032*s,.076,hz(.032,.076)+.006)});
   F.P(J.head,loft([[.05,.013,.004],[.02,.02,.004]],3),'#120e10',{ink:0,pos:[0,0,hz(0,.04)+.002]});
   // cuello, columna, costillas, pelvis
   F.P(J.neck,loft([[-.06,.016,.016],[.07,.015,.015,0,.012]],6),bn,{ink:.008});
   F.P(J.pelvis,loft([[-.02,.02,.018,0,-.04],[.49,.016,.016,0,-.06]],6),bd,{ink:.008});for(let i=0;i<9;i++)F.P(J.pelvis,ico(.02,1,.7,1,.2,i),bn,{ink:.006,pos:[0,.06+i*.047,-.05-i*.002]});
   for(let i=0;i<6;i++){const h=.2+i*.045,r=rowAt(F.B,h);F.P(J.pelvis,ering(r.rx*.92*(1-i*.012),r.rz*.95,.0085).translate(0,h,.004),bn,{ink:.005,jit:.04})}
   F.P(J.pelvis,box(.03,.2,.02,0,.31,.12),bn,{ink:.006});F.P(J.pelvis,loft([[.42,.19,.012,0,-.03],[.43,.19,.012,0,-.03]],6,{e:4}),bn,{ink:0});
   F.P(J.pelvis,loft([[-.07,.11,.07],[.0,.16,.09],[.06,.12,.07]],10),bn,{ink:.01});
   // miembros finos con articulaciones
   ['L','R'].forEach((k,i)=>{const s=i?-1:1;
    F.P(J['sh'+k],loft([[.04,A*1.3,A*1.3],[-.29,A*1.0,A*1.0]],6),bn,{ink:.007});F.P(J['sh'+k],ico(.03,1,1,1,.1,i),bn,{ink:.007});F.P(J['el'+k],loft([[.02,A*1.2,A*1.2],[-.25,A*.85,A*.85]],6),bn,{ink:.007});F.P(J['el'+k],ico(.022,1,1,1,.1,i+2),bn,{ink:.006});
    F.hand(k,s,bn);
    F.P(J['hp'+k],loft([[.05,.026,.026],[-.44,.02,.02]],7),bn,{ink:.008});F.P(J['hp'+k],ico(.036,1,1,1,.1,i),bn,{ink:.007});F.P(J['kn'+k],loft([[.02,.022,.022],[-.44,.017,.017]],7),bn,{ink:.008});F.P(J['kn'+k],ico(.03,1,1,1,.1,i+1),bn,{ink:.007});
    F.foot(k,bn)});
   // harapos, casco, escudo y espada oxidada
   F.P(J.pelvis,loft([[.05,.17,.12],[-.1,.19,.14],[-.3,.2,.15]],12,{fold:{a:.12,k:9},cap:false}),'#4a3a34',{ink:.01});
   F.helm('#7a6a5a','kettle');F.pauldron('L','#6a5e50',.9);
   F.sword(J.gripR,{c:'#8a7a68',guard:'#6a5e50',len:.6,rot:[-.5,0,0]});
   F.prop(J.wrL,[[loft([[.2,.0,.0],[.16,.17,.03],[-.0,.19,.035],[-.16,.14,.03],[-.26,.0,.0]],6,{rot:0}).rotateY(Math.PI/2),'#6a4a32',{ink:.012}],[ico(.035,1,1,.5),'#8a7a68',{ink:.008,pos:[.03,0,0]}]],{pos:[.05,-.02,.0],rot:[0,-1.2,0]})}}
];
function prepBow(){const pts=[];for(let i=0;i<=8;i++){const u=i/8-.5;pts.push(new V3(0,u*1.0,Math.cos(u*Math.PI)*-.12+.06))}return prep(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),10,.014,5))}
