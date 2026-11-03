// NotScape · R3D · PEINADOS (lote N0.5-PELO-REWORK, 3 nov 2026; el dueño: «los peinados son varias formas pegadas y se ven raros en algunos ángulos: rework completo, más bonito, con físicas ligeras»).
// Sustituye al `hairFn` de piezas sueltas (esferas/cápsulas/conos fusionados). Cada peinado se ESCULPE como superficies continuas, en el espacio de la cabeza de mini3d.js
// (cráneo: esfera r .19 en (0,0,.04); frente +z, nuca −z, coronilla +y):
//  · CASQUETE (`shell`): UNA superficie polar desde la coronilla hasta la línea del pelo (frente `f`, lados `s`, nuca `b`, en radianes desde arriba), con MECHONES
//    (surcos `n`/`dep` que nacen en la coronilla), PUNTAS en el borde (`tip`, `tipM` = peso frente/lados/nuca), raya (`part`), flequillo ladeado (`fr`), volumen (`vol(d)`),
//    rizos por ruido (`nz`), púas barridas (`spk`) y un borde con grosor que se mete bajo la piel (sin escalones ni costuras).
//  · MELENA (`hang`): lo que cuelga por debajo de `tH` se reparte en MECHONES-PANEL (ancho ≈ un mechón, sección en lente, cerrados) que cuelgan del borde del casquete
//    y oscilan cada uno con su muelle → física ligera sin huecos (se separan como mechones de verdad).
//  · COLAS / TRENZAS / RASTAS / TIRABUZONES (`tails`): tubos barridos por una curva (sección elíptica, surcos de mechón, trenza `braid`, espiral `spiral`) partidos en
//    1–3 segmentos articulados con física (bola en cada articulación); `segs:0` = fijos. MOÑOS (`knots`) con remolino y GOMAS (`ties`) más oscuras.
//  · Color por vértice (multiplica el color del pelo): crestas más claras, surcos y bajos más oscuros, brillo en la coronilla.
// FÍSICA (`HairPhys`): cada articulación es un Object3D (Group en el héroe, Bone en los PNJ horneados de actors3d.js). Gravedad efectiva = abajo − aceleración·INR −
// velocidad·DRAG + brisa, llevada al marco del padre → giro objetivo (sin torsión) × `fol` → muelle amortiguado (K, D) con límites (no entra en la cabeza ni en la espalda).
// PEINADO NUEVO = una entrada en `STY` (y su fila en creator.js `HAIRS`). Resolución: escala con `Mini.detail` (PNJ ≈ .62 → menos caras y menos mechones físicos).
import * as THREE from 'three';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
const V3=THREE.Vector3,QT=THREE.Quaternion,TAU=Math.PI*2;
const cl=(x,a,b)=>x<a?a:x>b?b:x,ss=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t)},adiff=(a,b)=>((a-b+Math.PI)%TAU+TAU)%TAU-Math.PI;
const fr=x=>x-Math.floor(x),h3=(x,y,z)=>fr(Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453);
function vn(x,y,z){const X=Math.floor(x),Y=Math.floor(y),Z=Math.floor(z),u=x-X,v=y-Y,w=z-Z,a=u*u*(3-2*u),b=v*v*(3-2*v),c=w*w*(3-2*w);let r=0;
 for(let i=0;i<8;i++){const p=i&1,q=i>>1&1,s=i>>2;r+=h3(X+p,Y+q,Z+s)*(p?a:1-a)*(q?b:1-b)*(s?c:1-c)}return r}
const dirOf=(a,t)=>{const s=Math.sin(t);return[s*Math.sin(a),Math.cos(t),s*Math.cos(a)]};
const O=[0,0,.035],R0=.197;   // centro y radio base del casquete (justo por fuera de la piel)

// ── geometría: arrays → BufferGeometry indexada (position, normal, color); `chk(geo)` = true si hay que invertir el sentido de las caras ──
function mk(P,K,I,chk){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(K,3));g.setIndex(I);g.computeVertexNormals();
 if(chk&&chk(g)){for(let i=0;i<I.length;i+=3){const t=I[i+1];I[i+1]=I[i+2];I[i+2]=t}g.setIndex(I);g.computeVertexNormals()}return g}
const outward=(vi,ref)=>g=>{const n=g.attributes.normal,p=g.attributes.position,r=ref(p.getX(vi),p.getY(vi),p.getZ(vi));return n.getX(vi)*r[0]+n.getY(vi)*r[1]+n.getZ(vi)*r[2]<0};
function tint(g,k){const n=g.attributes.position.count,K=new Float32Array(n*3).fill(k);g.setAttribute('color',new THREE.BufferAttribute(K,3));return g}
function clean(g){for(const k of Object.keys(g.attributes))if(k!=='position')g.deleteAttribute(k);return mergeVertices(g)}

// ═══ CASQUETE + MELENA ═══
function shell(S,det,Hg){
 const C=Math.max(20,Math.round(56*det)),R=Math.max(8,Math.round(18*det)),n=S.n==null?14:S.n,tN=S.tipN||n||14,th=S.th==null?.028:S.th,te=S.te==null?.012:S.te,dep=S.dep==null?.007:S.dep,
  tip=S.tip==null?.12:S.tip,tm=S.tipM||[1,.6,.7],sw=S.sw||0,tH=S.tH==null?2.3:S.tH,K0=S.k||1;
 /* los mechones nacen de un REMOLINO en la coronilla (eje `cw`, inclinado hacia la nuca) y bajan hacia la frente, los lados y la nuca; fase irregular (`wob`) = mechones de ancho distinto */
 const ca=S.cw==null?.45:S.cw,CW=[0,Math.cos(ca),-Math.sin(ca)],E2=[0,-Math.sin(ca),-Math.cos(ca)],phi=d=>Math.atan2(d[1]*E2[1]+d[2]*E2[2],d[0]),psi=d=>Math.acos(cl(d[1]*CW[1]+d[2]*CW[2],-1,1));
 const wob=f=>.8*Math.sin(f*3+1.3)+.45*Math.sin(f*5+.4)+.25*Math.sin(f*8+2.1),lockS=d=>{const f=phi(d);return .5+.5*Math.cos(n*f+sw*psi(d)*2+wob(f))};
 const e0=a=>{const c=Math.cos(a),s2=Math.sin(a)**2;return S.f*(c>0?c*c:0)+S.s*s2+S.b*(c<0?c*c:0)},tipS=a=>{const f=phi(dirOf(a,e0(a)));return Math.pow(.5+.5*Math.cos(tN*f+wob(f)+(S.tipPh||0)),S.tipP||3)};
 const NZ=S.nz0||null;   /* ruido de silueta: solo si el peinado lo pide (el dueño: «la base tiene ondulaciones extrañas») */
 const W=a=>{const c=Math.cos(a),s2=Math.sin(a)**2;return[c>0?c*c:0,s2,c<0?c*c:0]};
 const edge=a=>{const w=W(a);let e=S.f*w[0]+S.s*w[1]+S.b*w[2];if(S.fr){const F=S.fr;e+=F.drop*Math.exp(-((adiff(a,F.a)/F.w)**2))}return e+tip*(tm[0]*w[0]+tm[1]*w[1]+tm[2]*w[2])*tipS(a)};
 const Hof=a=>{if(!Hg)return 0;const w=W(a),H=Hg.H;return(H[0]*w[0]+H[1]*w[1]+H[2]*w[2])*ss(tH-.3,tH,edge(a))};
 const pt=(a,t,v,spk=true)=>{const d=dirOf(a,t),ls=n?lockS(d):1;let r=R0+th+(te-th)*v*v+(S.vol?S.vol(d,a,t,v):0);
  if(n)r-=dep*.45*ss(.55,1,v)*Math.pow(1-ls,3);   /* surcos SUAVES y solo cerca del borde: la base del pelo queda lisa */
  if(NZ)r+=NZ[0]*(vn(d[0]*NZ[1]+1.7,d[1]*NZ[1]+5.3,d[2]*NZ[1]+2.9)*2-1);
  if(S.nz){const f=S.nz[1];r+=S.nz[0]*(vn(d[0]*f+7.3,d[1]*f+3.1,d[2]*f+11.7)*2-1)*(.5+.5*v)}
  if(S.part!=null)r-=.012*Math.exp(-((adiff(a,S.part)*Math.max(Math.sin(t),.12)/.03)**2))*ss(.12,.45,t)*(1-ss(.75,1,v));
  let x=O[0]+d[0]*r,y=O[1]+d[1]*r,z=O[2]+d[2]*r;
  if(spk&&S.spk)for(const s of S.spk){const q=d[0]*s.d[0]+d[1]*s.d[1]+d[2]*s.d[2];if(q>0){const b=s.h*Math.pow(q,s.k);x+=(d[0]+s.sw[0])*b;y+=(d[1]+s.sw[1])*b;z+=(d[2]+s.sw[2])*b}}
  let k=(n?.88+.12*ls*ss(.4,1,v)+.06*(1-ss(.4,1,v)):.86+(S.nz?.0:.1))*(1+.13*Math.max(0,d[1])*(1-v));if(S.nz)k*=.9+.25*vn(d[0]*S.nz[1]+7.3,d[1]*S.nz[1]+3.1,d[2]*S.nz[1]+11.7);
  return[x,y,z,k*K0,r]};
 const P=[],K=[],I=[],put=(q,k)=>{P.push(q[0],q[1],q[2]);K.push(k,k,k);return P.length/3-1};
 const p0=pt(0,0,0);put(p0,p0[3]);
 const tS=[],hang=[];for(let j=0;j<C;j++){const a=j/C*TAU,e=edge(a),H=Hof(a);hang.push(H>.012?H:0);tS.push(H>.012?Math.min(e,tH):e)}
 for(let i=1;i<=R;i++)for(let j=0;j<C;j++){const a=j/C*TAU,v=i/R,q=pt(a,tS[j]*Math.pow(v,.92),v);put(q,q[3])}
 for(let j=0;j<C;j++){const a=j/C*TAU,d=dirOf(a,tS[j]+.03);put([O[0]+d[0]*(R0-.022),O[1]+d[1]*(R0-.022),O[2]+d[2]*(R0-.022)],.5*K0)}
 for(let j=0;j<C;j++){const a=j/C*TAU,d=dirOf(a,tS[j]+.08);put([O[0]+d[0]*.15,O[1]+d[1]*.15,O[2]+d[2]*.15],.45*K0)}
 const row=i=>1+(i-1)*C;for(let j=0;j<C;j++)I.push(0,row(1)+j,row(1)+(j+1)%C);
 for(let i=1;i<R+2;i++)for(let j=0;j<C;j++){const a=row(i)+j,b=row(i)+(j+1)%C,c=row(i+1)+j,d=row(i+1)+(j+1)%C;I.push(a,c,b,b,c,d)}
 const geo=mk(P,K,I,g=>g.attributes.normal.getY(0)<0);
 {const nn=geo.attributes.normal,pp=geo.attributes.position;for(let i=0;i<=2*C;i++){const x=pp.getX(i)-O[0],y=pp.getY(i)-O[1],z=pp.getZ(i)-O[2],l=Math.hypot(x,y,z)||1,w=i===0?1:i<=C?.7:.35;nn.setXYZ(i,nn.getX(i)*(1-w)+x/l*w,nn.getY(i)*(1-w)+y/l*w,nn.getZ(i)*(1-w)+z/l*w)}nn.needsUpdate=true}   /* coronilla sin «asterisco»: normales radiales donde converge la malla */
 // MELENA en mechones-panel
 const panels=[];if(Hg&&hang.some(h=>h>0)){
  const Rh=Math.max(4,Math.round(9*det)),fl=Hg.fl==null?.15:Hg.fl,tp=Hg.tip==null?.25:Hg.tip,thk=Hg.thk==null?.026:Hg.thk;
  let st=hang.findIndex((h,j)=>h>0&&!(hang[(j-1+C)%C]>0));if(st<0)st=0;const cols=[];for(let q=0;q<C;q++){const j=(st+q)%C;if(hang[j]>0)cols.push(j);else if(cols.length)break}
  const cpp=det<1?Math.max(3,Math.ceil(cols.length/3)):Math.max(3,Math.round(C/(tN||14))),np=Math.max(1,Math.round((cols.length-1)/(cpp-1))),step=(cols.length-1)/np;
  for(let p=0;p<np;p++){const c0=Math.round(p*step),c1=Math.round((p+1)*step),cs=cols.slice(c0,c1+1);if(cs.length<2)continue;
   const PP=[],KK=[],II=[],L=(Rh+2)*2,mid=cs[cs.length>>1],am=mid/C*TAU,jt=pt(am,tS[mid]-.07,.95,false),J=[jt[0],jt[1],jt[2]];
   cs.forEach((j,ci)=>{const a=j/C*TAU,hz=[Math.sin(a),0,Math.cos(a)],ls=n?lockS(dirOf(a,tS[j])):1,Hc=hang[j]*(1+tp*tipS(a)),shp=Math.pow(Math.sin(Math.PI*ci/(cs.length-1)),.6),b0=pt(a,tS[j]-.07,.95,false),dd=dirOf(a,tS[j]-.07),base=[b0[0]+dd[0]*.005,b0[1]+dd[1]*.005,b0[2]+dd[2]*.005],
     dt=dirOf(a,tS[j]-.2),top=[O[0]+dt[0]*(R0+.004),O[1]+dt[1]*(R0+.004),O[2]+dt[2]*(R0+.004)],gr=dep*1.4*(1-ls)*(1-ls),ko=(.8+.24*ls)*K0;
    const out=[],inn=[];out.push([top,ko*.8]);
    for(let k=0;k<=Rh;k++){const u=k/Rh,uh=u*Hc,wv=Hg.wave?Hg.wave[0]*Math.sin(uh*Hg.wave[1]+a*2.3)*ss(0,.25,u):0,cin=(Hg.cin||0)*.045*ss(.55,1,u),o=fl*uh+wv-cin-gr;
     const q=[base[0]+hz[0]*o,base[1]-uh,base[2]+hz[2]*o];out.push([q,ko*(1+.06*u)]);const tk=thk*(1-.75*u*u)*shp;inn.push([[q[0]-hz[0]*tk,q[1]+(k===Rh?.006:0),q[2]-hz[2]*tk],.55*K0])}
    inn.reverse();inn.push([[top[0]-hz[0]*.012*shp,top[1],top[2]-hz[2]*.012*shp],.5*K0]);
    for(const [q,k] of out.concat(inn)){PP.push(q[0]-J[0],q[1]-J[1],q[2]-J[2]);KK.push(k,k,k)}});
   for(let ci=0;ci<cs.length-1;ci++)for(let k=0;k<L-1;k++){const a=ci*L+k,b=a+1,c=a+L,d=c+1;II.push(a,b,c,b,d,c)}
   const ref=(cs.length>>1)*L+(Rh>>1)+1,hz=[Math.sin(am),0,Math.cos(am)];
   panels.push({geo:mk(PP,KK,II,outward(ref,()=>hz)),j:J,out:hz})}}
 return{geo,panels}}

// ═══ TUBOS (colas, trenzas, rastas, tirabuzones) ═══
function tube(T,det){const cv=new THREE.CatmullRomCurve3(T.pts.map(p=>new V3(...p)),!!T.closed,'centripetal'),N=Math.max(6,Math.round((T.n||18)*det)),M=Math.max(6,Math.round((T.m||10)*det)),ref=new V3(...(T.up||[1,0,0])),k0=T.k0==null?.75:T.k0;
 const rings=[];for(let i=0;i<=N;i++){const u=i/N,c=cv.getPointAt(T.closed?u%1:u),tg=cv.getTangentAt(T.closed?u%1:u).normalize();let B=new V3().crossVectors(tg,ref);if(B.lengthSq()<1e-6)B.set(0,0,1).cross(tg);B.normalize();const Nn=new V3().crossVectors(B,tg).normalize();
  let r=T.r*(T.closed?1:(k0+(1-k0)*ss(0,.2,u))*(1-(1-(T.tipR||0))*ss(T.te==null?.62:T.te,1,u)));const bs=T.braid?Math.sin(Math.PI*T.braid*u):0;
  if(T.braid){r*=.8+.3*Math.abs(bs);c.addScaledVector(B,r*.2*bs)}
  if(T.bump)r*=1+T.bump*Math.sin(u*(T.bf||26));
  if(T.spiral){const w=TAU*T.spiral*u,A=T.amp*ss(0,.12,u);c.addScaledVector(Nn,Math.cos(w)*A).addScaledVector(B,Math.sin(w)*A)}
  const pts=[],ks=[];for(let j=0;j<M;j++){const th=j/M*TAU;let rr=r,g=1;
   if(T.braid){g=.5+.5*Math.cos(2*th+(bs>0?1:-1)*TAU*.5+Math.PI*T.braid*u*2);rr*=1-.2*ss(.3,1,1-g)}
   else if(T.gro!==0){g=.5+.5*Math.cos((T.gk||5)*th+u*1.6);rr*=1-(T.gro==null?.13:T.gro)*(1-g)*(1-g)}
   pts.push(c.clone().addScaledVector(B,Math.cos(th)*rr).addScaledVector(Nn,Math.sin(th)*rr*(T.flat||1)));ks.push((.78+.26*g)*(T.braid?.9+.15*Math.abs(bs):1)*(1+.05*u))}
  rings.push({c,u,pts,ks,r})}
 return{rings,M,N}}
function tubeGeo(tb,i0,i1,J,ball){const P=[],K=[],I=[],M=tb.M,o=J||[0,0,0];for(let i=i0;i<=i1;i++){const r=tb.rings[i];r.pts.forEach((p,j)=>{P.push(p.x-o[0],p.y-o[1],p.z-o[2]);K.push(r.ks[j],r.ks[j],r.ks[j])})}
 for(let i=0;i<i1-i0;i++)for(let j=0;j<M;j++){const a=i*M+j,b=i*M+(j+1)%M,c=a+M,d=b+M;I.push(a,c,b,b,c,d)}
 const mid=tb.rings[Math.min(i1,i0+1)],cc=[mid.c.x-o[0],mid.c.y-o[1],mid.c.z-o[2]],vi=Math.min(i1-i0,1)*M;
 let g=mk(P,K,I,outward(vi,(x,y,z)=>[x-cc[0],y-cc[1],z-cc[2]]));
 if(ball){const b=tint(clean(new THREE.SphereGeometry(ball,8,6)),.8);b.computeVertexNormals();g=mergeGeometries([g,b],false)}return g}

// ═══ MOÑO (esfera con remolino) y GOMA (toro oscuro) ═══
function knot(o,det){const g=clean(new THREE.SphereGeometry(1,Math.max(10,Math.round(18*det)),Math.max(7,Math.round(12*det)))),p=g.attributes.position,q=new QT().setFromUnitVectors(new V3(0,1,0),new V3(...(o.ax||[0,1,0])).normalize()),c=new V3(...o.p),r=o.r,K=[],v=new V3();
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const th=Math.acos(cl(v.y,-1,1)),ph=Math.atan2(v.z,v.x),cr=.5+.5*Math.cos(5*ph+4.5*th),m=1-.13*(1-cr)*(1-cr)*Math.sin(th);
  v.set(v.x*r[0]*m,v.y*r[1]*m,v.z*r[2]*m).applyQuaternion(q).add(c);p.setXYZ(i,v.x,v.y,v.z);const k=(.8+.26*cr)*(1+.08*Math.max(0,Math.cos(th)));K.push(k,k,k)}
 g.setAttribute('color',new THREE.Float32BufferAttribute(K,3));g.computeVertexNormals();return g}
function tie(o){const g=clean(new THREE.TorusGeometry(o.R,o.tb||.013,6,16));g.applyQuaternion(new QT().setFromUnitVectors(new V3(0,0,1),new V3(...o.ax).normalize()));g.translate(...o.p);g.computeVertexNormals();return tint(g,.5)}
const tieAt=(tb,u,R)=>{const i=Math.round(u*tb.N),r=tb.rings[i],n=tb.rings[Math.min(tb.N,i+1)].c.clone().sub(tb.rings[Math.max(0,i-1)].c).normalize();return tie({p:[r.c.x,r.c.y,r.c.z],ax:[n.x,n.y,n.z],R:r.r*(R||1.08),tb:Math.max(.009,r.r*.3)})};

// ═══ CATÁLOGO ═══ (frente +z; a = acimut desde la frente; t = ángulo desde la coronilla)
const SP=(t,a,h,k=26,sw=[0,.2,-.5])=>({d:dirOf(a,t),h,k,sw});
const SLEEK={f:.9,s:1.55,b:2.15,th:.021,te:.01,n:20,dep:.005,tip:.06,tipM:[1,.2,.25],sw:0};
const sleek=o=>Object.assign({},SLEEK,o);
const g2=(d,c,w)=>Math.exp(-((d[0]-c[0])**2+(d[1]-c[1])**2+(d[2]-c[2])**2)/w);
const rootAt=(a,t,r=.17)=>{const d=dirOf(a,t);return[O[0]+d[0]*r,O[1]+d[1]*r,O[2]+d[2]*r]};
// mechón colgante desde la línea del pelo (rastas y tirabuzones): raíz bajo el casquete → sale → cae con algo de vuelo hacia fuera
function hangLock(a,t,len,o){const h=[Math.sin(a),0,Math.cos(a)],p1=rootAt(a,t+.12,.232),out=o.out||.05;return Object.assign({pts:[rootAt(a,t,.16),p1,[p1[0]+h[0]*out*.6,p1[1]-len*.45,p1[2]+h[2]*out*.6],[p1[0]+h[0]*out,p1[1]-len,p1[2]+h[2]*out]],dir:h},o)}
const STY={
 cut:()=>({shell:{f:.92,s:1.5,b:2.15,th:.03,n:14,dep:.008,tip:.17,tipM:[1,.45,.5],sw:.6,vol:d=>.014*ss(0,.7,d[2])*ss(-.1,.6,d[1])}}),
 spiky:det=>{const spk=[];for(let i=0;i<8;i++)spk.push(SP(.62+.12*(i%2),i/8*TAU+.25,.065,55,[0,.25,-.35]));for(let i=0;i<5;i++)spk.push(SP(.25,i/5*TAU+.6,.05,55,[0,.35,-.25]));[-.5,0,.5].forEach(a=>spk.push(SP(.98,a,.06,60,[0,.55,.1])));spk.push(SP(.0,0,.045,55,[0,.3,-.3]));
  return{shell:{f:.95,s:1.48,b:2.12,th:.02,n:12,dep:.006,tip:.13,tipM:[1,.6,.6],spk}}},
 side:()=>({shell:{f:.88,s:1.5,b:2.15,th:.032,n:14,dep:.008,tip:.18,tipM:[1,.4,.5],sw:1.3,part:.75,fr:{a:-.45,w:.7,drop:.27},vol:d=>.02*g2(d,[-.1,.55,.8],.08)}}),
 curly:()=>({shell:{f:.95,s:1.55,b:2.2,th:.05,te:.032,n:0,tipN:16,tip:.1,tipM:[1,1,1],tipP:2,nz:[.03,6.5]}}),
 mane:()=>({shell:{f:.85,s:1.72,b:2.05,th:.034,n:13,dep:.01,tip:.1,tipM:[.8,0,0],sw:.3,tH:1.95,vol:d=>.012*ss(-.2,.6,-d[2])},hang:{H:[0,.13,.21],fl:.2,tip:.35,thk:.028,phys:{fol:.5,K:60,D:6}}}),
 long:()=>({shell:{f:.9,s:1.72,b:2.05,th:.03,n:14,dep:.008,tip:.06,tipM:[1,0,0],sw:.2,part:0,tH:1.9},hang:{H:[0,.3,.42],fl:.14,tip:.3,thk:.026,phys:{fol:.55}}}),
 bun:()=>({shell:sleek({part:.5,tip:.1,sw:.4}),knots:[{p:[0,.22,-.13],r:[.085,.08,.08],ax:[0,.6,-.8]}],ties:[{p:[0,.175,-.095],ax:[0,.6,-.8],R:.062,tb:.014}]}),
 pony:()=>({shell:sleek(),tails:[{pts:[[0,.12,-.13],[0,.12,-.24],[0,.02,-.29],[0,-.14,-.3],[0,-.3,-.26]],r:.05,segs:2,tie:.07,out:[0,0,-1],fol:.6}]}),
 bob:()=>({shell:{f:.98,s:2.02,b:2.12,th:.034,te:.03,n:15,dep:.008,tip:.1,tipM:[1,.35,.35],sw:.3,vol:(d,a,t,v)=>.032*ss(.55,1,v)*(1-Math.max(0,Math.cos(a))**2)}}),
 twin:()=>({shell:sleek({part:0}),tails:[-1,1].map(q=>({pts:[[.14*q,.1,-.07],[.21*q,.09,-.09],[.245*q,-.02,-.09],[.245*q,-.21,-.07]],r:.04,segs:2,tie:.1,out:[q,0,0],up:[0,0,1],fol:.6}))}),
 // ── N0.5-PEINADOS (hombre) ──
 buzz:()=>({shell:{f:.95,s:1.5,b:2.15,th:.008,te:.005,n:0,tip:.02,k:.85,nz:[.002,20]}}),
 pomp:()=>({shell:{f:.95,s:1.5,b:2.15,th:.016,te:.008,n:12,dep:.007,tip:.04,sw:.4,vol:d=>.1*g2(d,[0,.5,.86],.1)+.02*g2(d,[0,.85,.3],.15)}}),
 mohawk:()=>{const spk=[.85,.45,.05,-.35,-.75,-1.15,-1.55].map(p=>({d:[0,Math.cos(p),Math.sin(p)],h:.045,k:90,sw:[0,.15,-.6]}));
  return{shell:{f:.95,s:1.5,b:2.15,th:.006,te:.004,n:0,tip:0,k:.9,spk,vol:d=>.035*Math.exp(-((d[0]/.1)**2))*ss(-.7,.1,d[1]+(d[2]>0?.35:0))}}},
 bowl:()=>({shell:{f:1.18,s:1.62,b:2.1,th:.038,te:.03,n:22,dep:.004,tip:.03,tipM:[1,1,1],vol:()=>.006}}),
 warrior:()=>({shell:{f:.88,s:1.45,b:2.1,th:.022,n:16,dep:.006,tip:.04,sw:0},tails:[{pts:[[0,.07,-.13],[0,.06,-.22],[0,-.03,-.25],[0,-.16,-.24]],r:.038,segs:2,tie:.1,out:[0,0,-1],fol:.55}]}),
 locs:det=>{const L=[],nl=det<1?6:11;for(let i=0;i<nl;i++){const a=Math.PI/2+.25+(i/(nl-1))*(Math.PI-.5);[a].forEach(aa=>L.push(hangLock(aa,1.72+.15*Math.abs(Math.cos(aa)),.26+.07*h3(i,3,1),{r:.024,gro:.1,gk:3,bump:.1,bf:30,te:.8,tipR:.5,n:12,m:7,segs:det<1?1:2,fol:.55})))}
  for(let i=0;i<(det<1?2:4);i++){const a=-(Math.PI/2+.25+(i/3)*(Math.PI-.5));L.push(hangLock(a,1.72+.15*Math.abs(Math.cos(a)),.26+.07*h3(i,5,2),{r:.024,gro:.1,gk:3,bump:.1,bf:30,te:.8,tipR:.5,n:12,m:7,segs:det<1?1:2,fol:.55}))}
  return{shell:{f:.9,s:1.55,b:2.1,th:.03,n:0,nz:[.01,8],tip:.06},tails:L}},
 afro:()=>({shell:{f:.8,s:1.55,b:2.1,th:.07,te:.022,n:0,tip:0,nz:[.018,8],nz0:[.012,3.5],vol:d=>.04*Math.max(0,d[1])+.02*Math.max(0,-d[2])-.03*Math.max(0,d[2])*ss(.2,.7,d[1]*-1+.6)}}),
 topknot:()=>({shell:{f:.9,s:1.5,b:2.15,th:.018,n:22,dep:.005,tip:.03,sw:0},knots:[{p:[0,.245,-.04],r:[.068,.062,.068]}],ties:[{p:[0,.205,-.035],ax:[0,1,-.1],R:.044,tb:.013}]}),
 slick:()=>({shell:{f:.86,s:1.5,b:2.22,th:.026,n:18,dep:.006,tip:.16,tipM:[0,.3,1],sw:0,cw:-1.05,vol:d=>.018*ss(-.1,.7,-d[2])*ss(-.3,.4,d[1])}}),
 messy:()=>{const spk=[];for(let i=0;i<9;i++){const a=i*2.4+.5,t=.3+.55*h3(i,1,7);spk.push(SP(t,a,.05+.03*h3(i,2,3),45,[(h3(i,4,1)-.5)*.6,.25,(h3(i,6,2)-.5)*.6]))}
  return{shell:{f:.9,s:1.5,b:2.15,th:.03,n:13,dep:.008,tip:.2,tipM:[1,.7,.8],sw:.9,nz:[.008,7],spk}}},
 // ── N0.5-PEINADOS (mujer) ──
 wavy:()=>({shell:{f:.9,s:1.72,b:2.05,th:.034,n:13,dep:.008,tip:.06,tipM:[1,0,0],sw:.5,part:.45,tH:1.9,nz:[.006,6]},hang:{H:[0,.28,.38],fl:.16,tip:.25,thk:.028,wave:[.013,22],phys:{fol:.5}}}),
 braid:()=>({shell:sleek(),tails:[{pts:[[0,-.02,-.12],[0,-.08,-.21],[0,-.22,-.26],[0,-.4,-.27],[0,-.52,-.25]],r:.042,braid:6,segs:3,tieE:.9,out:[0,0,-1],fol:.55,te:.85,tipR:.55}]}),
 pixie:()=>({shell:{f:.82,s:1.45,b:2.1,th:.026,n:16,dep:.007,tip:.2,tipM:[1,.8,.6],sw:.9,fr:{a:.4,w:.6,drop:.26},part:-.6}}),
 hipony:()=>({shell:sleek(),tails:[{pts:[[0,.15,-.08],[0,.22,-.17],[0,.16,-.27],[0,.0,-.3],[0,-.17,-.28]],r:.048,segs:2,tie:.06,out:[0,0,-1],fol:.55}]}),
 lowbun:()=>({shell:sleek({part:0}),knots:[{p:[0,-.05,-.205],r:[.105,.075,.08],ax:[0,-.2,-1]}],ties:[{p:[0,-.04,-.15],ax:[0,-.2,-1],R:.07,tb:.014}]}),
 ringlets:det=>{const L=[],A=det<1?[1.4,2.2,Math.PI,-2.2,-1.4]:[1.35,1.85,2.4,2.85,Math.PI+.25,-2.4,-1.85,-1.35];
  A.forEach((a,i)=>L.push(hangLock(a,1.72+.1*Math.abs(Math.cos(a)),.25+.04*h3(i,9,1),{r:.026,gro:0,spiral:3.5,amp:.015,n:26,m:7,te:.8,tipR:.4,segs:det<1?1:2,fol:.5,out:.005})));
  return{shell:{f:.9,s:1.65,b:2.05,th:.03,n:14,dep:.008,tip:.06,tipM:[1,0,0],part:0},tails:L}},
 sidepony:()=>({shell:sleek({part:.6}),tails:[{pts:[[.12,.08,-.11],[.2,.05,-.16],[.27,-.08,-.14],[.29,-.27,-.1]],r:.05,segs:2,tie:.08,out:[.7,0,-.7],up:[0,0,1],fol:.6}]}),
 bangs:()=>({shell:{f:1.12,s:1.72,b:2.05,th:.032,te:.02,n:20,dep:.004,tip:.03,tipM:[1,.3,.3],tH:1.9},hang:{H:[0,.3,.42],fl:.13,tip:.08,thk:.028,phys:{fol:.55}}}),
 plaits:()=>({shell:sleek({part:0,s:1.6}),tails:[-1,1].map(q=>({pts:[[.12*q,-.02,-.12],[.15*q,-.12,-.21],[.15*q,-.3,-.24],[.14*q,-.46,-.23]],r:.036,braid:5,segs:2,tieE:.88,out:[.3*q,0,-1],up:[0,0,1],fol:.55,te:.85,tipR:.55}))}),
 crown:det=>{const pts=[];for(let i=0;i<8;i++){const a=i/8*TAU;pts.push([Math.sin(a)*.2,.1+.035*Math.cos(a),.03+Math.cos(a)*.2])}
  return{shell:sleek({part:0}),tails:[{pts,closed:true,r:.024,braid:11,segs:0,n:44,k0:1,up:[0,1,0]}],knots:[{p:[0,-.04,-.19],r:[.075,.065,.065],ax:[0,-.2,-1]}]}}};
export const HAIR_STYLES=Object.keys(STY);

// ═══ ENSAMBLADO ═══ (devuelve la función `top(F,head,part)` de mini3d.js). F.hairs = cadenas con física; F.hairJ = articulaciones (los PNJ las hornean como huesos 'hr<i>')
// HÉROE (detalle 1): todos los segmentos van a UNA SkinnedMesh + contorno (`skinned`): 2 objetos aunque haya 15 rastas. PNJ: una malla por segmento colgada de su articulación (bake las junta).
function chain(F,head,part,c,segs,o,sk){const js=[];let par=head,prev=[0,0,0];
 segs.forEach(s=>{const g=new THREE.Bone();g.position.set(s.j[0]-prev[0],s.j[1]-prev[1],s.j[2]-prev[2]);par.add(g);if(sk)sk.push({geo:s.geo,J:s.j,g});else part(s.geo,c,0,0,0,{p:g,ink:o.ink||.012,t:{vc:1}});js.push(g);(F.hairJ||(F.hairJ=[])).push(g);par=g;prev=s.j});
 (F.hairs||(F.hairs=[])).push({js,out:o.out,K:o.K,D:o.D,fol:o.fol,lo:o.lo,hi:o.hi,side:o.side})}
function skinned(F,head,part,c,sk){const gs=sk.map((q,i)=>{const g=q.geo.clone();g.translate(q.J[0],q.J[1],q.J[2]);const n=g.attributes.position.count,si=new Uint16Array(n*4),sw=new Float32Array(n*4);for(let v=0;v<n;v++){si[v*4]=i;sw[v*4]=1}
  g.setAttribute('skinIndex',new THREE.BufferAttribute(si,4));g.setAttribute('skinWeight',new THREE.BufferAttribute(sw,4));return g});
 const geo=mergeGeometries(gs,false);if(!geo)return false;const m=part(geo,c,0,0,0,{p:head,ink:.012,t:{vc:1}}),h=m.userData.h;head.remove(m);if(h)m.remove(h);
 const sm=new THREE.SkinnedMesh(geo,m.material);sm.castShadow=true;sm.receiveShadow=true;head.add(sm);let top=head;while(top.parent)top=top.parent;top.updateMatrixWorld(true);
 const skel=new THREE.Skeleton(sk.map(q=>q.g));sm.bind(skel);
 if(h){const sh=new THREE.SkinnedMesh(h.geometry,h.material);sh.visible=h.visible;sh.userData.hull=1;sm.add(sh);sh.updateMatrixWorld(true);sh.bind(skel);sm.userData.h=sh;if(F.hulls){const ix=F.hulls.indexOf(h);if(ix>=0)F.hulls[ix]=sh}}
 return true}
export function hairFn(style,c,helm){return(F,head,part)=>{if(helm||!style||style==='bald')return;
 const det=(F&&F.constructor&&F.constructor.detail)||1,S=(STY[style]||STY.cut)(det),stat=[],sk=det>=1?[]:null;
 if(S.shell){const r=shell(S.shell,det,S.hang);stat.push(r.geo);const ph=(S.hang&&S.hang.phys)||{};r.panels.forEach(pn=>chain(F,head,part,c,[{geo:pn.geo,j:pn.j}],Object.assign({out:pn.out,lo:-.05,hi:.55,side:.3,K:70,D:7,fol:.5,ink:.012},ph),sk))}
 (S.knots||[]).forEach(k=>stat.push(knot(k,det)));(S.ties||[]).forEach(t=>stat.push(tie(t)));
 (S.tails||[]).forEach(T=>{const tb=tube(T,det);if(T.tie!=null)stat.push(tieAt(tb,T.tie));
  if(!T.segs){stat.push(tubeGeo(tb,0,tb.N));if(T.tieE!=null)stat.push(tieAt(tb,T.tieE));return}
  const ns=T.segs,ji=[];for(let s=0;s<ns;s++)ji.push(Math.round(s/ns*tb.N*(ns>1?.92:1)));ji.push(tb.N);
  const segs=[];for(let s=0;s<ns;s++){const r=tb.rings[ji[s]],J=[r.c.x,r.c.y,r.c.z];let g=tubeGeo(tb,ji[s],ji[s+1],J,s>0?r.r*.92:0);
   if(T.tieE!=null&&Math.round(T.tieE*tb.N)>=ji[s]&&Math.round(T.tieE*tb.N)<ji[s+1]){const tg=tieAt(tb,T.tieE);tg.translate(-J[0],-J[1],-J[2]);g=mergeGeometries([g,tg],false)}segs.push({geo:g,j:J})}
  const d=T.out||T.dir||[0,0,-1];chain(F,head,part,c,segs,{out:[d[0],0,d[2]],K:T.K||75,D:T.D||7,fol:T.fol==null?.6:T.fol,lo:T.lo==null?-.08:T.lo,hi:T.hi==null?.8:T.hi,side:T.side==null?.5:T.side},sk)});
 if(sk&&sk.length)skinned(F,head,part,c,sk);
 if(!stat.length)return;let mg=null;try{mg=mergeGeometries(stat,false)}catch(x){mg=null}
 if(mg)part(mg,c,0,0,0,{p:head,ink:.014,t:{vc:1}});else stat.forEach(g=>part(g,c,0,0,0,{p:head,ink:.014,t:{vc:1}}))}}

// ═══ FÍSICA LIGERA ═══
const DOWN=new V3(0,-1,0),INR=.007,DRAG=.042,_p=new V3(),_q=new QT(),_s=new V3(),_r=new V3(),_v=new V3(),_e=new V3(),_g=new V3(),_t=new V3(),_qp=new QT(),_qi=new QT(),_qw=new QT(),_ax=new V3();
export class HairPhys{
 constructor(head,chains,seed=0){this.head=head;this.t=seed*3.1;this.ch=chains.map((c,i)=>{const o=new V3(c.out?c.out[0]:0,0,c.out?c.out[2]:-1);if(o.lengthSq()<1e-6)o.set(0,0,-1);o.normalize();
  return{js:c.js,rest:c.js.map(j=>j.quaternion.clone()),off:c.js.map(j=>j.position.clone()),w:c.js.map(()=>new V3()),om:c.js.map(()=>new V3()),ho:o,ao:new V3(-o.z,0,o.x),K:c.K||70,D:c.D||7,fol:c.fol==null?.6:c.fol,lo:c.lo==null?-.08:c.lo,hi:c.hi==null?.8:c.hi,side:c.side==null?.45:c.side,ph:i*1.7+seed,pp:null,v:new V3(),a:new V3()}})}
 update(dt){if(!(dt>0)||!this.ch.length)return;dt=Math.min(dt,.05);this.t+=dt;const h=this.head;h.updateWorldMatrix(true,false);h.matrixWorld.decompose(_p,_q,_s);const sc=Math.abs(_s.x)||1;
  for(const c of this.ch){_r.copy(c.off[0]).multiplyScalar(sc).applyQuaternion(_q).add(_p);
   if(!c.pp||c.pp.distanceTo(_r)>3*sc){c.pp=(c.pp||new V3()).copy(_r);c.v.set(0,0,0);c.a.set(0,0,0)}
   _v.copy(_r).sub(c.pp).divideScalar(dt*sc);c.pp.copy(_r);const kv=1-Math.exp(-dt*16);_t.copy(c.v).lerp(_v,kv);_g.copy(_t).sub(c.v).divideScalar(dt);c.a.lerp(_g,1-Math.exp(-dt*10));c.v.copy(_t);if(c.a.length()>60)c.a.setLength(60);
   _e.set(Math.sin(this.t*1.3+c.ph)*.05,-1,Math.sin(this.t*.9+c.ph*1.7)*.04).addScaledVector(c.a,-INR).addScaledVector(c.v,-DRAG);{const hl=Math.hypot(_e.x,_e.z);if(hl>1.3){_e.x*=1.3/hl;_e.z*=1.3/hl}}
   _qp.copy(_q);
   for(let k=0;k<c.js.length;k++){const j=c.js[k],w=c.w[k],om=c.om[k];_qi.copy(_qp).invert();_g.copy(_e).applyQuaternion(_qi).normalize();
    _ax.crossVectors(DOWN,_g);const sn=_ax.length(),ang=Math.atan2(sn,DOWN.dot(_g));if(sn>1e-6)_ax.multiplyScalar(ang*c.fol*(k?.7:1)/sn);else _ax.set(0,0,0);
    om.x+=(c.K*(_ax.x-w.x)-c.D*om.x)*dt;om.z+=(c.K*(_ax.z-w.z)-c.D*om.z)*dt;om.y=0;w.x+=om.x*dt;w.z+=om.z*dt;w.y=0;
    let po=w.x*c.ao.x+w.z*c.ao.z,ps=w.x*c.ho.x+w.z*c.ho.z;const po2=cl(po,c.lo,c.hi),ps2=cl(ps,-c.side,c.side);
    if(po2!==po||ps2!==ps){w.set(c.ao.x*po2+c.ho.x*ps2,0,c.ao.z*po2+c.ho.z*ps2);om.multiplyScalar(.3)}
    const a=w.length();if(a>1e-6){_t.copy(w).divideScalar(a);_qw.setFromAxisAngle(_t,a)}else _qw.identity();
    j.quaternion.copy(c.rest[k]).multiply(_qw);_qp.multiply(j.quaternion)}}}}
