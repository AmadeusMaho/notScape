// NotScape · R3D · Lote R3D-ANIM (17 oct 2026) · ANIMACIONES DEL HÉROE «DIORAMA» (mini3d.js). Sustituye al PLACEHOLDER de MiniHero.update.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// IDEA: cada fotograma se calcula una POSE = vector plano de N números (canales CH) → se funde con la anterior si cambia el estado → se aplica al rig:
//   · pelvis (altura, avance, giro), torso (inclinación, torsión), cabeza (compensa el giro para seguir mirando al objetivo);
//   · PIES por IK de dos huesos (muslo .2 + espinilla .19) con objetivos en el marco del SUELO (pies plantados; la pelvis baja sola si no llegan);
//   · MANOS por IK de dos huesos (brazo .18 + antebrazo .18) hacia el «marco del objeto» que sostienen: punto de agarre + dirección (+y local del
//     arma = hoja/mango) + filo (+x local = hacia donde corta). Así se ANIMA EL ARMA y los brazos la siguen (como en un ARPG de verdad);
//     a dos manos (mandoble, hacha, pico, caña, ballesta) la mano izquierda va sola al mango (canal two/lh) y nunca se despega.
//   · Los objetos se cuelgan de m.grips[i] (centro de la mano). Mano principal = 0 (derecha, x−), secundaria = 1 (izquierda, x+).
// CLIPS: pistas de fotogramas clave (Catmull-Rom + curva de tiempo por tramo). Ataques: u∈[0,1] = ph del juego (0 guardia → 1 IMPACTO, el golpe del
// juego cae en ph=1); u∈[1,2] = seguimiento + vuelta a la guardia, medido con reloj propio desde el impacto (pesado en mandoble/hacha/pico).
// Ventana de anticipación ≈60 %, golpe acelerado ≈30 % (curva i2/i3), impacto con «mordida» y seguimiento que deja ver el PESO del arma.
// GUARDIA DE COMBATE por arma (st.cb o acción f/sp): puños, espada, espada+escudo, daga, mandoble, arco, ballesta, bastón y cetro.
// Fuera de combate: reposo relajado con el arma (espada abajo, mandoble al hombro, bastón como cayado, arco en la mano izquierda).
// Herramientas (hacha, pico, martillo+tenazas, caña, cucharón, sierra, pluma+libro, comida) aparecen en la mano; el arma se ENVAINA (cadera/espalda).
// Para añadir un arma/acción: una fila en STANCE/RELAX + una función de clip; nada de `if` sueltos en apply(). Herramienta de revisión:
// docs/style-reference/r3d/anim-diorama.html (?sheet=… tira de fotogramas) + tools/r3d/anim_check.py (capturas) + tools/r3d/anim_lint.mjs (números).
import * as THREE from 'three';
import {glow} from './materials3d.js';
import {shield as armorShield} from './armor3d.js';
import {cultWeapon,SCAB_COL} from './weapons3d.js';

const V3=THREE.Vector3,QT=THREE.Quaternion,M4=THREE.Matrix4,EU=THREE.Euler;
const cl=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,u)=>a+(b-a)*u,TAU=Math.PI*2,ss=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t)};
export const EASE={l:u=>u,io:u=>u*u*(3-2*u),i2:u=>u*u,i3:u=>u*u*u,o2:u=>1-(1-u)*(1-u),o3:u=>1-(1-u)*(1-u)*(1-u),
 io3:u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2};
// ── canales de la pose ── fl/fr = pie izq./der. [x, z, alzada, cabeceo (+ = talón arriba), giro]; rp/rd/re = mano derecha: punto, dirección y filo
// del objeto; lp/ld/le = izquierda; two = la izquierda va al mango del objeto derecho (lh = distancia bajo la mano derecha; negativo = por delante);
// pr/pl = polos de codo; draw = tensado (arco); glow/glowL = brillo del báculo y de la mano; aux = cuerda enganchada (arco) / ballesta armada;
// spin = giro del objeto sobre su eje; aim = 1 → manos y polos en el marco del SUELO (apuntar al objetivo) en vez del torso; arw = flecha/virote visible.
export const CH={py:0,px:1,pz:2,yaw:3,pit:4,rol:5,cx:6,cy:7,cz:8,hx:9,hy:10,hz:11,fl:12,fr:17,rp:22,rd:25,re:28,lp:31,ld:34,le:37,two:40,lh:41,pr:42,pl:45,
 draw:48,glow:49,glowL:50,aux:51,spin:52,aim:53,arw:54,mouth:55};
export const N=56;
const C=CH;
function set(v,o){for(const k in o){const i=C[k],x=o[k];if(i==null)throw new Error('canal '+k);if(typeof x==='number')v[i]=x;else for(let j=0;j<x.length;j++)v[i+j]=x[j]}return v}
export const P=(b,o)=>set(new Float32Array(b),o||{});
const nrm=a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l]};
const crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const edge=(ax,d)=>nrm(crs(ax,nrm(d)));           // filo = dirección del movimiento en un barrido alrededor del eje ax
const axisOf=(a,b)=>nrm(crs(nrm(a),nrm(b)));       // eje que lleva a → b por el camino corto
const b2o=(a,yw)=>[a[0]*Math.cos(yw)+a[2]*Math.sin(yw),a[1],-a[0]*Math.sin(yw)+a[2]*Math.cos(yw)];   // torso → suelo (giro total yw), para escribir poses «aim» pensando en el torso
const ft=(b,i,o)=>{const a=Array.from(b.slice(i,i+5));o.forEach((x,j)=>{if(x!=null)a[j]=x});return a};   // pie con cambios sueltos: ft(S,C.fl,[,z,alzada])

// pose neutra: de pie, brazos colgando, pies bajo la cadera
export const DEF=set(new Float32Array(N),{py:-.012,fl:[.1,.005,0,0,.14],fr:[-.1,.005,0,0,-.14],rp:[-.222,.44,.015],rd:[0,0,1],re:[0,-1,0],lp:[.222,.44,.015],ld:[0,0,1],le:[0,-1,0],
 lh:.12,pr:[-.45,-.2,-1],pl:[.45,-.2,-1]});

// ════════════════════════════ GUARDIAS DE COMBATE (cuerpo en el sitio, se les suma respiración) ════════════════════════════
// Medidas útiles (marco del torso = el del modelo en reposo): hombros (∓.19,.78,0), cintura (0,.42,0), cabeza (0,1.06,0), alcance de la mano .36.
const SHIELD={lp:[.07,.66,.27],ld:nrm([.05,1,-.12]),le:[1,0,-.1],pl:[.9,-.4,0],glowL:0};
export const STANCE={
 fist:P(DEF,{py:-.05,yaw:-.3,cy:.12,cx:.1,hx:.04,fl:[.13,.11,0,0,.25],fr:[-.11,-.12,0,.0,-.45],rp:[-.11,.88,.12],lp:[.07,.9,.17],pr:[-.4,-1,-.1],pl:[.4,-1,-.1]}),
 sword:P(DEF,{py:-.045,yaw:-.28,cy:.12,cx:.08,fl:[.12,.1,0,0,.25],fr:[-.11,-.12,0,0,-.4],rp:[-.14,.62,.24],rd:nrm([.15,.72,.68]),re:[0,0,1],lp:[.2,.63,.15],pr:[-.7,-.4,-.5],pl:[.7,-.5,-.4]}),
 swordSh:P(DEF,{py:-.05,yaw:-.3,cy:.1,cx:.08,fl:[.12,.12,0,0,.25],fr:[-.12,-.12,0,0,-.4],rp:[-.24,.84,.08],rd:nrm([.25,.75,.6]),re:[0,0,1],pr:[-.9,-.2,-.2],...SHIELD}),
 dagger:P(DEF,{py:-.07,yaw:-.25,cy:.1,cx:.2,fl:[.13,.13,0,0,.25],fr:[-.12,-.13,0,.2,-.4],rp:[-.13,.62,.22],rd:nrm([.1,.35,.93]),re:[0,1,0],lp:[.15,.72,.2],pr:[-.6,-.6,-.4],pl:[.6,-.6,-.3]}),
 great:P(DEF,{py:-.07,yaw:-.3,cy:.08,cx:.1,fl:[.15,.14,0,0,.3],fr:[-.13,-.15,0,0,-.45],rp:[-.01,.65,.24],rd:nrm([.12,.78,.62]),re:[0,0,1],two:1,lh:.11,pr:[-.6,-.6,-.3],pl:[.7,-.6,-.2]}),
 bow:P(DEF,{aim:1,aux:1,arw:1,draw:.06,py:-.04,yaw:-.45,cy:-.35,cx:.04,hy:.12,fl:[.1,.14,0,0,.1],fr:[-.1,-.1,0,0,-1.0],
  lp:b2o([.1,.64,.26],-.8),ld:b2o(nrm([1,.35,.05]),-.8),le:b2o(nrm([.35,-1,0]),-.8),rp:[.07,.86,.06],pr:[-.5,-.2,-1],pl:[.6,-.6,0]}),   // arco cruzado delante de la barriga, flecha encochada
 xbow:P(DEF,{aim:1,aux:1,arw:1,py:-.04,yaw:-.4,cy:-.3,cx:.05,fl:[.1,.13,0,0,.15],fr:[-.11,-.1,0,0,-.7],rp:[-.07,.66,.12],rd:nrm([0,-.3,.95]),re:[-1,0,0],two:1,lh:-.2,
  pr:[-.6,-.6,-.4],pl:[.6,-.7,.1]}),
 staff:P(DEF,{py:-.04,yaw:-.22,cy:.1,cx:.06,fl:[.12,.1,0,0,.2],fr:[-.11,-.1,0,0,-.35],rp:[-.22,.66,.18],rd:nrm([-.04,1,.15]),re:[0,0,1],lp:[.17,.74,.22],glowL:.25,pr:[-.8,-.4,-.3],pl:[.6,-.6,-.2]}),
 scepter:P(DEF,{py:-.04,yaw:-.25,cy:.1,cx:.06,fl:[.12,.1,0,0,.2],fr:[-.11,-.11,0,0,-.35],rp:[-.17,.66,.2],rd:nrm([.05,.75,.65]),re:[0,0,1],lp:[.16,.72,.2],glowL:.2,pr:[-.8,-.4,-.3],pl:[.6,-.6,-.2]})};
// DOBLE EMPUÑE (Lote R3D-ANIM-2): un arma de una mano en cada mano. Derecha alta, izquierda baja y adelantada (cubre mientras la otra carga)
STANCE.dualsword=P(STANCE.sword,{rp:[-.16,.66,.22],rd:nrm([.1,.75,.65]),re:[0,0,1],lp:[.17,.58,.23],ld:nrm([-.12,.4,.9]),le:[0,0,1],pl:[.7,-.5,-.3]});
STANCE.dualdagger=P(STANCE.dagger,{lp:[.16,.64,.22],ld:nrm([-.1,.35,.93]),le:[0,1,0],pl:[.6,-.6,-.3]});
// variantes con escudo (el escudo manda en la mano izquierda)
['dagger','scepter','staff','fist'].forEach(k=>{STANCE[k+'Sh']=P(STANCE[k],SHIELD)});
// ════════════════════════════ REPOSO FUERA DE COMBATE (relajado; el arma se lleva, no se empuña) ════════════════════════════
const RSH={lp:[.27,.5,.05],ld:[0,1,0],le:[0,0,-1]};
export const RELAX={
 fist:P(DEF,{}),
 sword:P(DEF,{rp:[-.24,.48,.07],rd:nrm([0,-.42,.9]),re:[0,-1,-.4]}),
 dagger:P(DEF,{rp:[-.24,.48,.07],rd:nrm([0,-.3,.95]),re:[0,1,0]}),
 scepter:P(DEF,{rp:[-.24,.5,.08],rd:nrm([0,.25,.97]),re:[0,1,0]}),
 great:P(DEF,{rp:[-.21,.72,.19],rd:nrm([-.12,.45,-.88]),re:[0,.88,.45],pr:[-.6,-.8,.2]}),
 bow:P(DEF,{lp:[.27,.48,.06],ld:nrm([0,.95,.3]),le:[1,0,0]}),
 xbow:P(DEF,{rp:[-.24,.5,.08],rd:nrm([0,-.4,.92]),re:[-1,0,0]}),
 staff:P(DEF,{rp:[-.25,.62,.14],rd:nrm([0,1,.06]),re:[0,0,1]})};
['sword','dagger','scepter','staff','fist'].forEach(k=>{RELAX[k+'Sh']=P(RELAX[k],RSH)});
RELAX.dualsword=P(RELAX.sword,{lp:[.24,.48,.07],ld:nrm([0,-.42,.9]),le:[0,-1,-.4]});
RELAX.dualdagger=P(RELAX.dagger,{lp:[.24,.48,.07],ld:nrm([0,-.3,.95]),le:[0,1,0]});

// ════════════════════════════ CLIPS ════════════════════════════
const K=(t,v,e,lin)=>({t,v,e:e||'io',lin});
const T=(i0,i1,keys)=>({i0,i1,keys});
function sampleTrack(tr,u,out){const ks=tr.keys,n=ks.length,i0=tr.i0,i1=tr.i1;
 if(u<=ks[0].t){for(let c=i0;c<i1;c++)out[c]=ks[0].v[c];return}
 if(u>=ks[n-1].t){for(let c=i0;c<i1;c++)out[c]=ks[n-1].v[c];return}
 let i=0;while(i<n-2&&u>ks[i+1].t)i++;
 const k1=ks[i],k2=ks[i+1],k0=ks[i-1]||k1,k3=ks[i+2]||k2;let s=(u-k1.t)/(k2.t-k1.t);s=EASE[k2.e](s);
 const A=k0.v,B=k1.v,Cc=k2.v,D=k3.v,s2=s*s,s3=s2*s;
 if(k2.lin){for(let c=i0;c<i1;c++)out[c]=B[c]+(Cc[c]-B[c])*s;return}
 for(let c=i0;c<i1;c++){const p0=A[c],p1=B[c],p2=Cc[c],p3=D[c];out[c]=.5*(2*p1+(-p0+p2)*s+(2*p0-5*p1+4*p2-p3)*s2+(-p0+3*p1-3*p2+p3)*s3)}}
export function sampleClip(cl_,u,out){for(const tr of cl_.tracks)sampleTrack(tr,u,out);return out}
const full=keys=>({tracks:[T(0,N,keys)]});
// pista que sobrescribe la mano izquierda con el escudo (guardia → se adelanta al cargar → se aparta en el impacto)
const L0=C.lp,L1=C.two;   // lp..le
function shieldTrack(S,times){const a=P(S,SHIELD),b=P(S,Object.assign({},SHIELD,{lp:[.09,.71,.29]})),c=P(S,Object.assign({},SHIELD,{lp:[.13,.62,.24],ld:nrm([.2,1,-.1])}));
 return T(L0,L1,[K(0,a),K(times[0],b),K(times[1],c,'i2'),K(times[2],c,'o2'),K(2,a)])}
const withSh=(clip,S,sh,times)=>sh?{tracks:[...clip.tracks,shieldTrack(S,times||[.6,1,1.35]),T(C.pl,C.pl+3,[K(0,P(S,SHIELD))])]}:clip;

// ── ESPADA (y cetro como arma de golpe): A = tajo diagonal de derecha-arriba a izquierda-abajo (oberhau); B = revés ascendente ──
function swordA(S,sh){
 const ax=axisOf([.22,.35,-.91],[.2,.85,.48]);
 const k1=P(S,{py:-.04,rp:[-.17,.7,.16],rd:nrm([.05,.88,.47]),cy:.05});
 const k2=P(S,{py:-.03,pz:-.03,cx:-.04,cy:-.45,yaw:-.2,rp:[-.29,.97,-.05],rd:nrm([.22,.35,-.91]),re:edge(ax,[.22,.35,-.91]),lp:[.22,.76,.27],pr:[-.7,.35,.6]});
 const k3=P(S,{py:-.05,cx:.06,cy:-.08,yaw:-.22,rp:[-.2,.95,.24],rd:nrm([.2,.85,.48]),re:edge(ax,[.2,.85,.48]),lp:[.2,.68,.12],pr:[-.85,-.1,.3]});
 const k4=P(S,{py:-.075,pz:.06,cx:.15,cy:.42,yaw:-.1,fr:ft(S,C.fr,[,,,.3]),rp:[-.07,.63,.27],rd:nrm([.38,-.25,.89]),re:edge(ax,[.38,-.25,.89]),lp:[.17,.66,.04],pr:[-.6,-.75,0]});
 const k5=P(S,{py:-.07,pz:.05,cx:.17,cy:.5,yaw:-.1,fr:ft(S,C.fr,[,,,.2]),rp:[-.08,.55,.26],rd:nrm([.75,-.45,.5]),re:edge(ax,[.75,-.45,.5]),lp:[.17,.66,.02],pr:[-.3,-.85,-.4]});
 return withSh(full([K(0,S),K(.18,k1),K(.6,k2),K(.82,k3,'i2'),K(1,k4,'i2'),K(1.35,k5,'o2'),K(2,S)]),S,sh)}
function swordB(S,sh){
 const r0=[.6,-.3,-.75],r1=[-.45,.35,.82],ax=axisOf(r0,r1);
 const k1=P(S,{py:-.05,cy:.25,rp:[-.06,.6,.2],rd:nrm([.4,.2,.9])});
 const k2=P(S,{py:-.06,pz:-.02,cx:.1,cy:.55,yaw:-.3,rp:[.04,.58,.2],rd:nrm(r0),re:edge(ax,r0),lp:[.22,.64,-.04],pr:[-.4,-.8,.3]});
 const k3=P(S,{py:-.06,cx:.12,cy:.1,rp:[-.14,.64,.3],rd:nrm([.1,.05,1]),re:edge(ax,[.1,.05,1]),lp:[.21,.66,.1],pr:[-.6,-.7,.1]});
 const k4=P(S,{py:-.05,pz:.04,cx:.1,cy:-.32,yaw:-.25,fl:ft(S,C.fl,[,,,.25]),rp:[-.25,.8,.26],rd:nrm(r1),re:edge(ax,r1),lp:[.21,.7,.18],pr:[-.9,-.3,-.2]});
 const k5=P(S,{py:-.04,cx:.06,cy:-.45,yaw:-.28,rp:[-.3,.9,.1],rd:nrm([-.7,.62,.3]),re:edge(ax,[-.7,.62,.3]),lp:[.2,.7,.18],pr:[-.8,.1,-.3]});
 return withSh(full([K(0,S),K(.2,k1),K(.6,k2),K(.82,k3,'i2'),K(1,k4,'i2'),K(1.35,k5,'o2'),K(2,S)]),S,sh)}
// golpe máximo con espada/daga: ESTOCADA a fondo (paso largo, brazo atrás para equilibrar)
function thrust(S,sh,reach){
 const k1=P(S,{py:-.08,pz:-.05,cx:.02,cy:-.5,yaw:-.3,rp:[-.27,.66,-.02],rd:[.05,.05,1],re:[1,0,0],lp:[.22,.74,.25],pr:[-.5,-.6,-.7]});
 const k2=P(S,{py:-.09,pz:-.01,cx:.08,cy:-.2,fl:ft(S,C.fl,[,S[C.fl+1]+.13,.05]),rp:[-.2,.7,.12],rd:[.06,.03,1],re:[1,0,0],lp:[.23,.72,.15],pr:[-.6,-.5,-.6]});
 const k3=P(S,{py:-.12,pz:.12,cx:.22,cy:.35,yaw:-.12,fl:ft(S,C.fl,[,S[C.fl+1]+.16,0]),fr:ft(S,C.fr,[,,,.5]),rp:[-.08,.74,.32*reach],rd:[.08,0,1],re:[1,0,0],lp:[.24,.7,-.08],pr:[-.7,-.5,-.3]});
 const k4=P(k3,{rp:[-.09,.72,.3*reach],py:-.11,cx:.2});
 const k5=P(S,{py:-.07,pz:.04,fl:ft(S,C.fl,[,S[C.fl+1]+.08,.05])});
 return withSh(full([K(0,S),K(.55,k1),K(.8,k2,'i2'),K(1,k3,'i3'),K(1.3,k4,'o2'),K(1.65,k5),K(2,S)]),S,sh,[.55,1,1.3])}
// ── DAGA: A = puñalada rápida con paso; B = tajo horizontal de revés ──
function daggerA(S,sh){
 const k1=P(S,{py:-.08,cy:-.35,cx:.15,fl:ft(S,C.fl,[,S[C.fl+1]+.03,.035]),rp:[-.25,.6,-.02],rd:nrm([.1,.1,1]),lp:[.18,.74,.24]});
 const k2=P(S,{py:-.1,pz:.07,cx:.26,cy:.3,fl:ft(S,C.fl,[,S[C.fl+1]+.06]),rp:[-.09,.72,.33],rd:nrm([.15,.05,1]),lp:[.22,.68,.02],pr:[-.7,-.5,-.2]});
 const k3=P(k2,{rp:[-.12,.68,.3]});
 return withSh(full([K(0,S),K(.5,k1),K(1,k2,'i3'),K(1.3,k3,'o2'),K(2,S)]),S,sh,[.5,1,1.3])}
function daggerB(S,sh){const ax=[0,1,0];
 const k1=P(S,{py:-.08,cy:.4,cx:.18,rp:[.04,.64,.16],rd:nrm([.9,.1,.3]),re:edge(ax,[.9,.1,.3]),lp:[.2,.7,-.02]});
 const k2=P(S,{py:-.09,pz:.05,cx:.22,cy:-.35,rp:[-.2,.66,.26],rd:nrm([-.5,.1,.86]),re:edge(ax,[-.5,.1,.86]),lp:[.2,.72,.2],pr:[-.8,-.4,-.2]});
 const k3=P(S,{py:-.08,cx:.2,cy:-.5,rp:[-.28,.68,.14],rd:nrm([-.9,.1,.2]),re:edge(ax,[-.9,.1,.2])});
 return withSh(full([K(0,S),K(.5,k1),K(1,k2,'i3'),K(1.25,k3,'o2'),K(2,S)]),S,sh,[.5,1,1.25])}
// ── PUÑOS: A = directo de derecha (gira cadera, talón de atrás arriba); B = jab de izquierda; hv = gancho cargado ──
function fistA(S,sh){
 const k1=P(S,{py:-.06,cy:-.35,cx:.04,rp:[-.15,.84,.04]});
 const k2=P(S,{py:-.07,pz:.07,cy:.6,yaw:0,cx:.2,fl:ft(S,C.fl,[,S[C.fl+1]+.05]),fr:ft(S,C.fr,[,,,.5,-.15]),rp:[-.06,.86,.31],lp:[.06,.92,.12],pr:[-.6,-.5,-.2]});
 const k3=P(k2,{rp:[-.08,.87,.27]});
 return withSh(full([K(0,S),K(.45,k1),K(1,k2,'i3'),K(1.25,k3,'o2'),K(2,S)]),S,sh,[.45,1,1.25])}
function fistB(S,sh){
 if(sh)return fistA(S,sh);
 const k1=P(S,{py:-.055,cy:.2,lp:[.08,.88,.08]});
 const k2=P(S,{py:-.06,pz:.06,cy:-.4,cx:.16,fl:ft(S,C.fl,[,S[C.fl+1]+.06]),lp:[.09,.87,.32],rp:[-.1,.9,.1],pl:[.6,-.5,-.2]});
 const k3=P(k2,{lp:[.09,.88,.27]});
 return full([K(0,S),K(.4,k1),K(1,k2,'i3'),K(1.25,k3,'o2'),K(2,S)])}
function hook(S,sh){
 const k1=P(S,{py:-.1,cy:-.55,cx:.05,rp:[-.2,.66,.02],pr:[-.5,-.8,-.3]});
 const k2=P(S,{py:-.08,pz:.05,cy:.55,cx:.18,fr:ft(S,C.fr,[,,,.5,-.2]),rp:[-.04,.95,.26],pr:[-.8,-.5,.1],lp:[.08,.9,.14]});
 return withSh(full([K(0,S),K(.6,k1),K(1,k2,'i3'),K(1.3,P(k2,{rp:[-.06,.93,.24]}),'o2'),K(2,S)]),S,sh,[.6,1,1.3])}
// ── MANDOBLE: tajo diagonal pesado (atrás «rascando la espalda» → por encima de la cabeza → cae y se hunde; paso al frente) ──
// Con estas proporciones (cabeza grande, brazos cortos) las manos NO caben por encima de la cabeza: la carga va por encima del hombro derecho y la mano
// izquierda suelta el mango un momento (two→0, se adelanta para equilibrar) y lo vuelve a coger justo antes del impacto (two→1).
function greatA(S){
 const rB=[-.15,.92,-.35],rW=[.2,-.45,-.87],rK=[.15,.3,-.94],rU=[.08,.98,.15],rI=[.2,-.25,.95],ax=axisOf(rW,rU),LF={lp:[.22,.72,.22],pl:[.7,-.5,-.2]};
 const k1=P(S,{py:-.1,pz:-.02,cx:.14,rp:[-.01,.6,.24],rd:nrm([.1,.6,.8])});
 const kB=P(S,Object.assign({py:-.07,pz:-.03,cx:.0,cy:-.35,yaw:-.2,two:.35,rp:[-.27,.9,.12],rd:nrm(rB),re:[0,0,1],pr:[-.8,-.3,.1]},LF));
 const k2=P(S,Object.assign({py:-.04,pz:-.04,cx:-.1,cy:-.6,yaw:-.15,two:0,fl:ft(S,C.fl,[,,.02]),rp:[-.3,.98,-.05],rd:nrm(rW),re:edge(ax,rW),pr:[-.8,.2,.5]},LF));
 const kK=P(S,Object.assign({py:-.05,cx:-.04,cy:-.42,two:.15,fl:ft(S,C.fl,[,S[C.fl+1]+.03,.04,-.1]),rp:[-.26,.98,.03],rd:nrm(rK),re:edge(ax,rK),pr:[-.8,.1,.5]},LF));
 const k3=P(S,{py:-.06,cx:.05,cy:-.15,two:.75,fl:ft(S,C.fl,[,S[C.fl+1]+.07,.05,-.2]),rp:[-.13,.95,.22],rd:nrm(rU),re:edge(ax,rU),lp:[.15,.8,.25],pr:[-.8,-.2,.4],pl:[.7,-.3,.3]});
 const k4=P(S,{py:-.12,pz:.07,cx:.26,cy:.35,yaw:-.1,fl:ft(S,C.fl,[,S[C.fl+1]+.11,0,0]),fr:ft(S,C.fr,[,,,.35]),rp:[-.02,.58,.24],rd:nrm(rI),re:edge(ax,rI),pr:[-.5,-.8,0],pl:[.5,-.8,0]});
 const k5=P(k4,{py:-.12,pz:.07,cx:.3,cy:.55,rp:[-.03,.54,.2],rd:nrm([.55,-.6,.58]),re:edge(ax,[.55,-.6,.58]),fr:ft(S,C.fr,[,,,.25])});
 const k6=P(S,{py:-.09,pz:.03,cx:.2,cy:.2,fl:ft(S,C.fl,[,S[C.fl+1]+.06,.035]),rp:[-.01,.6,.24],rd:nrm([.2,.4,.9]),re:[0,0,1]});
 return full([K(0,S),K(.2,k1),K(.42,kB),K(.64,k2),K(.76,kK,'i2'),K(.88,k3,'l'),K(1,k4,'i2'),K(1.38,k5,'o2'),K(1.72,k6),K(2,S)])}
// golpe máximo con mandoble: carga alta tras el hombro, saltito y mazazo vertical que se clava en el suelo
function greatH(S){
 const rW=[0,-.3,-.95],rI=[0,-.45,.89],ax=[1,0,0],LF={lp:[.22,.74,.2],pl:[.7,-.5,-.2]};
 const k1=P(S,{py:-.12,cx:.2,rp:[-.01,.58,.24],rd:nrm([0,.5,.86])});
 const kU=P(S,Object.assign({py:-.06,cx:.0,cy:-.2,two:.3,rp:[-.26,.92,.14],rd:nrm([-.1,.95,-.2]),re:edge(ax,[-.1,.95,-.2]),pr:[-.8,-.2,.2]},LF));
 const k2=P(S,Object.assign({py:-.02,cx:-.15,cy:-.3,yaw:-.15,two:0,fl:ft(S,C.fl,[,,.03]),fr:ft(S,C.fr,[,,.02]),rp:[-.28,1.0,-.04],rd:nrm(rW),re:edge(ax,rW),pr:[-.8,.3,.5]},LF));
 const kB=P(S,Object.assign({py:-.03,cx:-.08,cy:-.2,two:.1,fl:ft(S,C.fl,[,S[C.fl+1]+.03,.05]),rp:[-.25,1.0,.04],rd:nrm([0,.25,-.97]),re:edge(ax,[0,.25,-.97]),pr:[-.8,.2,.5]},LF));
 const k3=P(S,{py:-.04,cx:.05,cy:-.05,two:.6,fl:ft(S,C.fl,[,S[C.fl+1]+.06,.04]),rp:[-.12,.97,.2],rd:[0,1,.08],re:edge(ax,[0,1,.08]),lp:[.15,.8,.25],pr:[-.7,-.2,.4],pl:[.7,-.3,.3]});
 const kF=P(S,{py:-.1,cx:.25,two:.9,fl:ft(S,C.fl,[,S[C.fl+1]+.09,.015]),rp:[-.04,.84,.27],rd:nrm([0,.6,.8]),re:edge(ax,[0,.6,.8])});
 const k4=P(S,{py:-.15,pz:.06,cx:.34,cy:.08,yaw:-.12,fl:ft(S,C.fl,[,S[C.fl+1]+.1,0]),fr:ft(S,C.fr,[,,,.3]),rp:[-.02,.6,.25],rd:nrm(rI),re:edge(ax,rI),pr:[-.5,-.8,0],pl:[.5,-.8,0]});
 const k5=P(k4,{py:-.15,cx:.36,rp:[-.02,.57,.23],rd:nrm([0,-.6,.8]),re:edge(ax,[0,-.6,.8])});
 return full([K(0,S),K(.22,k1),K(.45,kU),K(.66,k2),K(.76,kB,'i2'),K(.86,k3,'l'),K(.93,kF,'l'),K(1,k4,'l'),K(1.45,k5,'o2'),K(2,S)])}
// ── ARCO (marco del suelo): subir, tensar hasta la barbilla, sostener, soltar (la mano sale hacia atrás), coger flecha del carcaj y encocharla ──
function bowA(S,hv){
 const aimL={lp:[.08,.83,.47],ld:nrm([.12,1,0]),le:[1,0,0]};
 const k1=P(S,{draw:.62,cx:0,yaw:-.52,cy:-.46,lp:[.06,.78,.36],ld:nrm([.08,1,.15]),le:[1,0,0]});
 const k2=P(S,Object.assign({draw:1,cx:-.03,yaw:-.55,cy:-.48,rp:[.07,.86,.07]},aimL));
 const k3=P(k2,{});
 const k4=P(k2,{aux:0,arw:0,draw:1,rp:[.0,.9,-.05],py:-.045});
 const k6=P(S,{aux:0,arw:0,draw:1,yaw:-.52,cy:-.47,lp:[.06,.74,.4],ld:nrm([.1,.95,.3]),le:[1,0,0],rp:[-.12,.92,-.16],pr:[-.6,.4,-.4]});
 const k7=P(S,{aux:1,arw:1,draw:.1});
 const h=hv?.85:.72,r=hv?.95:.9;
 return full([K(0,S),K(.3,k1),K(h,k2),K(r,k3,'l'),K(r+.035,k4,'o2'),K(1,k4),K(1.35,k6),K(1.72,k7),K(2,S)])}
// ── BALLESTA (marco del suelo): subir al hombro y apuntar, disparo con retroceso, bajar y ARMAR con la izquierda (la cuerda sigue a la mano) ──
function xbowA(S){
 const aim={rp:[-.06,.84,.04],rd:[0,0,1],cx:-.01,hx:-.06,hy:.1};
 const k1=P(S,aim),k2=P(S,aim);
 const k3=P(S,Object.assign({},aim,{aux:0,arw:0,rp:[-.06,.88,-.02],rd:nrm([0,.3,.95]),py:-.06,cx:-.07}));
 const k5=P(S,{aux:0,arw:0,rp:[-.07,.62,.14],rd:nrm([0,-.5,.86]),lh:-.15,cx:.15,py:-.06});
 const k6=P(k5,{aux:1,rp:[-.07,.64,.1],cx:.08,py:-.05});   // armar: tira hacia sí (la cuerda vuelve a la nuez)
 const k7=P(S,{arw:1,cx:.08});
 return full([K(0,S),K(.45,k1),K(.9,k2,'l'),K(.94,k3,'o2'),K(1,k3),K(1.25,k5),K(1.6,k6),K(1.78,k7),K(2,S)])}
// ── BÁCULO: reunir energía (bastón en alto, mano libre atrás cargando) → empujar la palma y apuntar el bastón → estallido ──
function staffA(S,sh,hv){const g=hv?1.4:1;
 const k1=P(S,{py:-.035,pz:-.02,cx:-.05,cy:-.35,hy:.1,rp:[-.21,.88,.1],rd:nrm([-.1,.95,.3]),lp:[.22,.6,0],glowL:.9*g,glow:.5*g});
 const k2=P(S,{py:-.06,pz:.05,cx:.16,cy:.3,fl:ft(S,C.fl,[,S[C.fl+1]+.04]),rp:[-.17,.76,.24],rd:nrm([0,.62,.78]),lp:[.12,.84,.32],glowL:1.3*g,glow:1*g,pl:[.6,-.6,-.4]});
 const k3=P(k2,{lp:[.11,.85,.34],glowL:1.8*g,glow:1.5*g});
 const k4=P(k2,{glowL:.1,glow:.4,lp:[.15,.78,.26],cx:.12});
 return withSh(full([K(0,S),K(.5,k1),K(.82,k2,'i2'),K(1,k3,'o2'),K(1.3,k4,'o2'),K(2,S)]),S,sh,[.5,1,1.3])}
function scepterA(S,sh,hv){const g=hv?1.4:1;
 const k1=P(S,{py:-.035,cx:-.06,cy:-.25,rp:[-.17,1.0,.04],rd:nrm([0,1,-.25]),lp:[.18,.66,.06],glowL:.7*g,glow:.5*g,pr:[-.8,.3,.3]});
 const k2=P(S,{py:-.06,pz:.04,cx:.15,cy:.3,rp:[-.11,.8,.3],rd:nrm([.05,.2,.98]),glow:1.4*g,lp:[.2,.7,.12],pr:[-.7,-.5,-.2]});
 const k3=P(k2,{glow:1.7*g});
 const k4=P(k2,{glow:.3,glowL:.2,rp:[-.13,.76,.27]});
 return withSh(full([K(0,S),K(.5,k1),K(.85,k2,'i2'),K(1,k3,'o2'),K(1.3,k4,'o2'),K(2,S)]),S,sh,[.5,1,1.3])}
// ── ESPEJO (izquierda ↔ derecha): reutiliza cualquier golpe de la derecha para la mano izquierda (doble empuñe). x → −x, giros y → −y, pies y manos intercambiados ──
const SW3=[[C.rp,C.lp],[C.rd,C.ld],[C.re,C.le],[C.pr,C.pl]];
export function mirrorV(v){const o=new Float32Array(v);for(const i of[C.px,C.yaw,C.rol,C.cy,C.cz,C.hy,C.hz])o[i]=-v[i];
 for(const [a,b] of SW3){for(let j=0;j<3;j++){o[a+j]=v[b+j];o[b+j]=v[a+j]}o[a]=-o[a];o[b]=-o[b]}
 for(let j=0;j<5;j++){o[C.fl+j]=v[C.fr+j];o[C.fr+j]=v[C.fl+j]}o[C.fl]=-o[C.fl];o[C.fr]=-o[C.fr];o[C.fl+4]=-o[C.fl+4];o[C.fr+4]=-o[C.fr+4];o[C.two]=0;return o}
const mirrorClip=c=>({tracks:c.tracks.map(t=>({i0:0,i1:N,keys:t.keys.map(k=>Object.assign({},k,{v:mirrorV(k.v)}))}))});
// DOBLE EMPUÑE: A = golpe de la derecha (la izquierda acompaña como contrapeso), B = el MISMO golpe espejado con la izquierda; los golpes se alternan.
// Máximo = las dos a la vez (tajo en X / doble estocada, el torso de frente); especial = ráfaga de cuatro golpes alternos.
const dualBase=k=>k==='dagger'?daggerA:swordA;
// la mano que NO golpea sostiene un arma: no puede recogerse contra la barriga como una mano libre → se queda adelantada (z ≥ .2)
const guardOff=c=>{c.tracks[0].keys.forEach(k=>{if(k.v[C.lp+2]<.2){k.v=new Float32Array(k.v);k.v[C.lp+2]=.2;k.v[C.lp]=Math.max(k.v[C.lp],.18)}});return c};
function dualA(S,k){return guardOff(dualBase(k)(S,false))}
function dualB(S,k){return mirrorClip(guardOff(dualBase(k)(mirrorV(S),false)))}
function dualH(S,k){const a=k==='dagger'?thrust(S,false,1.05):swordA(S,false),b=mirrorClip(k==='dagger'?thrust(mirrorV(S),false,1.05):swordA(mirrorV(S),false)),ka=a.tracks[0].keys,kb=b.tracks[0].keys;
 return{tracks:[...a.tracks,T(C.lp,C.two,kb),T(C.pl,C.pl+3,kb),T(C.fl,C.fl+5,kb),T(C.cy,C.cy+1,[K(0,S)]),T(C.yaw,C.yaw+1,[K(0,S)])]}}
function dualSp(S,k){const a=dualA(S,k).tracks[0].keys,b=dualB(S,k).tracks[0].keys,w=ks=>ks.filter(x=>x.t>=.45&&x.t<1).pop(),i=ks=>ks.find(x=>x.t===1);
 return full([K(0,S),K(.1,w(a).v),K(.2,i(a).v,'i2'),K(.3,w(b).v),K(.4,i(b).v,'i2'),K(.52,w(a).v),K(.62,i(a).v,'i2'),K(.72,w(b).v),K(.82,i(b).v,'i2'),K(1,S)])}
// ── ESPECIALES (k='sp', u = ph de 0 a 1, sin seguimiento: luego vuelve la guardia) ──
function spMelee(S,cls,sh){
 if(cls==='great'){const a=greatA(S).tracks[0].keys,up=P(a[7].v,{rd:nrm([.1,.9,.42]),re:[1,0,0],rp:[-.04,.72,.24],py:-.1,fl:ft(S,C.fl,[,S[C.fl+1]+.06,.05])});   // dos tajos pesados seguidos
  const c=full([K(0,S),K(.08,a[2].v),K(.18,a[3].v),K(.24,a[4].v,'i2'),K(.29,a[5].v,'l'),K(.36,a[6].v,'i2'),K(.44,a[7].v,'o2'),K(.53,up),K(.6,a[2].v),K(.68,a[3].v),K(.73,a[4].v,'i2'),K(.78,a[5].v,'l'),K(.85,a[6].v,'i2'),K(.92,a[7].v,'o2'),K(1,S)]);
  c.tracks.push(T(C.fl,C.fl+5,[K(0,P(S,{fl:ft(S,C.fl,[,S[C.fl+1]+.05])}))]));return c}   // pies firmes en el doble tajo (sin patinar)
 if(cls==='fist'){const a=fistA(S).tracks[0].keys,b=(sh?fistA(S,sh):fistB(S)).tracks[0].keys;
  return withSh(full([K(0,S),K(.15,a[1].v),K(.3,a[2].v,'i3'),K(.45,S),K(.6,b[1].v),K(.75,b[2].v,'i3'),K(1,S)]),S,sh,[.15,.3,.75])}
 const a=swordA(S,false).tracks[0].keys,b=swordB(S,false).tracks[0].keys,lift=P(S,{rp:[-.2,.8,.16],rd:nrm([.1,.95,.2]),re:[0,0,1],cy:-.2});
 const mid=P(a[5].v,{rp:[-.02,.56,.24],rd:nrm([.85,-.2,.45]),re:edge([0,1,0],[.85,-.2,.45]),cy:.55});
 return withSh(full([K(0,S),K(.1,lift),K(.2,a[2].v),K(.3,a[3].v,'i2'),K(.4,a[4].v,'i2'),K(.5,mid,'o2'),K(.62,b[2].v),K(.73,b[3].v,'i2'),K(.84,b[4].v,'i2'),K(1,S)]),S,sh,[.2,.4,.84])}
function spBow(S){const a=bowA(S).tracks[0].keys;   // dos disparos seguidos
 return full([K(0,S),K(.12,a[1].v),K(.3,a[2].v),K(.36,a[4].v,'o2'),K(.46,a[7].v),K(.66,a[2].v),K(.74,a[4].v,'o2'),K(1,S)])}
function spXbow(S){const a=xbowA(S).tracks[0].keys;   // disparo, recarga rápida, disparo
 return full([K(0,S),K(.18,a[1].v),K(.28,a[2].v,'l'),K(.31,a[3].v,'o2'),K(.44,a[5].v),K(.56,a[6].v),K(.63,a[7].v),K(.76,a[1].v),K(.86,a[2].v,'l'),K(.89,a[3].v,'o2'),K(1,a[3].v)])}
function spStaff(S,sh,scep){   // báculo: lo alza con las dos manos y traza un círculo por encima de la cabeza cargando; cetro: lo hace girar en alto con una mano; luego descarga
 const ring=a=>nrm([Math.cos(a),.55,Math.sin(a)]);
 if(scep){const ks=[0,1,2,3,4].map(i=>P(S,{py:-.04,cy:-.15,cx:-.04,rp:[-.3,.98,.16],rd:ring(-Math.PI/2+i*Math.PI*.5),re:[0,1,0],lp:[.2,.64,.04],glowL:.4+i*.15,glow:.5+i*.2,pr:[-.8,.3,.3]}));
  const k3=P(S,{py:-.07,pz:.06,cx:.2,cy:.35,rp:[-.11,.8,.3],rd:nrm([.05,.2,.98]),lp:[.11,.84,.33],glowL:1.9,glow:1.8,fl:ft(S,C.fl,[,S[C.fl+1]+.05])});
  return withSh(full([K(0,S),K(.14,ks[0]),K(.27,ks[1],'l'),K(.4,ks[2],'l'),K(.53,ks[3],'l'),K(.66,ks[4],'l'),K(.84,k3,'i2'),K(1,P(k3,{glowL:.2,glow:.5}),'o2')]),S,sh,[.14,.84,1])}
 // báculo: lo clava en el suelo, canaliza (el bastón gira sobre su eje, la mano libre en alto cargando) y descarga con las dos manos hacia delante
 const k1=P(S,{py:-.03,rp:[-.24,.74,.14],rd:nrm([0,1,.05]),re:[0,0,1],lp:[.2,.72,.14],glow:.3});
 const k2=P(S,{py:-.09,cx:.08,rp:[-.24,.6,.16],rd:nrm([0,1,.02]),re:[0,0,1],lp:[.3,.92,.14],glow:.9,glowL:.8,pl:[.8,-.5,-.2]});
 const k3=P(k2,{py:-.07,cx:-.04,cy:-.15,lp:[.31,.98,.17],glow:1.5,glowL:1.4,spin:TAU*2});
 const k4=P(S,{py:-.08,pz:.06,cx:.2,cy:.3,rp:[-.15,.76,.26],rd:nrm([0,.42,.9]),re:[1,0,0],lp:[.11,.84,.33],glowL:1.9,glow:1.9,spin:TAU*2,fl:ft(S,C.fl,[,S[C.fl+1]+.05]),pl:[.6,-.6,-.4]});
 return withSh(full([K(0,S),K(.15,k1),K(.3,k2,'i2'),K(.66,k3,'io'),K(.85,k4,'i2'),K(1,P(k4,{glowL:.2,glow:.5}),'o2')]),S,sh,[.15,.85,1])}
// ── TRABAJOS ──
// TALA: hacha a dos manos, golpe diagonal-horizontal al tronco desde detrás del hombro derecho (filo por delante en todo el arco)
const WC0=P(DEF,{py:-.07,yaw:-.45,cy:.15,cx:.18,fl:[.13,.13,0,0,.35],fr:[-.13,-.13,0,0,-.5],two:1,lh:.16,rp:[-.03,.62,.24],rd:nrm([.12,.06,.99]),re:[1,0,0],pr:[-.6,-.7,.1],pl:[.5,-.7,.2]});
function chop(){const r0=[-.8,.4,-.45],r1=[.15,-.05,.99],ax=axisOf(r0,r1),rm=[-.71,.38,.59];
 const S=P(WC0,{re:edge(ax,WC0.slice(C.rd,C.rd+3))});
 const k1=P(S,{py:-.035,pz:-.03,cx:0,cy:-.55,yaw:-.4,rp:[-.06,.95,0],rd:nrm(r0),re:edge(ax,r0),pr:[-.8,.2,.4],pl:[.4,-.3,.8]});
 const k2=P(S,{py:-.06,cx:.1,cy:-.2,rp:[-.1,.8,.2],rd:nrm(rm),re:edge(ax,rm),pr:[-.8,-.3,.3],pl:[.4,-.5,.6]});
 const k3=P(S,{py:-.09,pz:.04,cx:.22,cy:.2,rp:[-.03,.62,.24],rd:nrm(r1),re:edge(ax,r1)});
 const k4=P(k3,{py:-.1,cx:.25});
 const k5=P(S,{rp:[-.04,.64,.2],rd:nrm([.05,.15,.99]),re:edge(ax,[.05,.15,.99])});
 return full([K(0,S),K(.62,k1),K(.84,k2,'i2'),K(1,k3,'i2'),K(1.12,k4,'o2'),K(1.55,k5),K(2,S)])}
// MINERÍA: pico por encima de la cabeza y golpe vertical a la roca (al suelo, delante)
const MI0=P(DEF,{py:-.08,cx:.25,yaw:-.15,cy:.05,fl:[.14,.08,0,0,.25],fr:[-.14,-.08,0,0,-.3],two:1,lh:.18,rp:[-.03,.62,.24],rd:nrm([0,-.4,.92]),re:[0,-1,0],pr:[-.6,-.7,0],pl:[.6,-.7,0]});
function mine(){const ax=[1,0,0],r0=[-.05,.72,-.69];
 const S=P(MI0,{re:edge(ax,MI0.slice(C.rd,C.rd+3))});
 const k1=P(S,{py:-.03,pz:-.03,cx:-.1,cy:-.35,two:.25,lp:[.2,.74,.16],rp:[-.26,.98,.04],rd:nrm(r0),re:edge(ax,r0),pr:[-.8,.2,.4],pl:[.7,-.4,0]});
 const k2=P(S,{py:-.06,cx:.1,cy:-.12,two:.75,lp:[.15,.8,.22],rp:[-.12,.95,.22],rd:nrm([0,.95,.3]),re:edge(ax,[0,.95,.3]),pr:[-.7,-.2,.4],pl:[.7,-.3,.3]});
 const k3=P(S,{py:-.14,pz:.03,cx:.38,cy:.05,rp:[-.02,.62,.24],rd:nrm([0,-.55,.83]),re:edge(ax,[0,-.55,.83])});
 const k4=P(k3,{py:-.15,cx:.4});
 return full([K(0,S),K(.62,k1),K(.84,k2,'i2'),K(1,k3,'i2'),K(1.12,k4,'o2'),K(1.6,S),K(2,S)])}
// HERRERÍA (yunque): martillo a una mano, tenazas con la pieza en la izquierda
const SM0=P(DEF,{py:-.06,cx:.25,yaw:-.1,fl:[.12,.08,0,0,.25],fr:[-.12,-.08,0,0,-.3],rp:[-.15,.62,.28],rd:nrm([0,.3,.95]),re:[0,-1,0],lp:[.08,.62,.29],ld:nrm([-.25,-.35,.9]),le:[0,1,0],pr:[-.7,-.5,-.3],pl:[.6,-.6,-.2]});
function smith(){const ax=[1,0,0];
 const S=P(SM0,{re:edge(ax,SM0.slice(C.rd,C.rd+3))});
 const k1=P(S,{py:-.04,cx:.12,cy:-.15,rp:[-.22,.95,.12],rd:nrm([0,.8,-.6]),re:edge(ax,[0,.8,-.6]),pr:[-.8,.1,.3]});
 const k2=P(S,{cx:.2,rp:[-.2,.88,.26],rd:nrm([0,.85,.5]),re:edge(ax,[0,.85,.5])});
 const k3=P(S,{py:-.08,cx:.3,cy:.08,rp:[-.14,.61,.3],rd:[0,.05,1],re:edge(ax,[0,.05,1])});
 const k4=P(S,{rp:[-.15,.66,.29],rd:nrm([0,.35,.94]),re:edge(ax,[0,.35,.94])});
 return full([K(0,S),K(.65,k1),K(.86,k2,'i2'),K(1,k3,'i2'),K(1.15,k4,'o2'),K(2,S)])}
// PESCA (u = ph del juego, 0→.99 en 2,4 s): echar la caña atrás, latigazo adelante, esperar (los tirones van aparte)
const FI0=P(DEF,{py:-.03,yaw:-.25,cy:.05,cx:.05,fl:[.11,.08,0,0,.2],fr:[-.11,-.08,0,0,-.35],two:1,lh:.14,rp:[-.08,.7,.22],rd:nrm([0,.55,.83]),re:[1,0,0],pr:[-.7,-.6,-.2],pl:[.6,-.7,.1]});
function fishC(){const k1=P(FI0,{cy:-.35,cx:-.06,pz:-.02,rp:[-.12,.94,.06],rd:nrm([-.15,.8,-.58])});
 const k2=P(FI0,{cy:.15,cx:.12,pz:.03,rp:[-.06,.76,.24],rd:nrm([0,.42,.9])});
 const k3=P(FI0,{rp:[-.07,.7,.22],rd:nrm([0,.5,.87]),cx:.06});
 return full([K(0,FI0),K(.1,k1),K(.26,k2,'i2'),K(.42,k3,'o2'),K(1,k3)])}
// COMER (u 0→1 en 1 s): llevar a la boca y masticar
function eatC(L){const q=L?-1:1,h=(x,y,z)=>L?{lp:[-x,y,z],ld:nrm([-.3,.8,.3]),pl:[.5,-.8,0]}:{rp:[x,y,z],rd:nrm([.3,.8,.3]),pr:[-.5,-.8,0]};   // L = come con la izquierda (la derecha empuña el arma)
 const k1=P(DEF,Object.assign({hx:.08,cy:.08*q},h(-.05,.95,.25)));
 return full([K(0,P(DEF,h(-.22,.55,.15))),K(.25,k1),K(.9,P(k1,h(-.06,.93,.24))),K(1,P(DEF,h(-.22,.6,.15)))])}
// RECOGER (u 0→1 en .42 s): agacharse con la espalda y las rodillas y alargar la mano al suelo (marco del suelo)
function pickC(L){const m=(x,y,z)=>L?[-x,y,z]:[x,y,z],F={fl:[.12,.1,0,0,.15],fr:[-.11,-.06,0,0,-.2]};   // L = recoge con la izquierda (la derecha empuña el arma)
 const d=P(DEF,Object.assign({aim:1,py:-.26,cx:.66,hx:.2,[L?'lp':'rp']:m(-.1,.12,.33),[L?'rp':'lp']:m(.26,.24,.18),pr:[-.6,.4,-.3],pl:[.6,.4,-.3]},F));
 const s=P(DEF,Object.assign({aim:1,[L?'lp':'rp']:m(-.24,.46,.03),[L?'rp':'lp']:m(.24,.46,.03)},F));
 return full([K(0,s),K(.5,d,'o2'),K(1,s)])}
// trabajos en bucle (cocinar, fundir, artesanía, escultor, inscripción): pose + oscilación por tiempo
const CROUCH={py:-.12,cx:.32,yaw:-.1,hx:.2,fl:[.13,.1,0,0,.3],fr:[-.12,-.06,0,.25,-.3],lp:[.17,.52,.2],pl:[.6,-.7,.1]};
export const LOOPS={
 co:t=>P(DEF,Object.assign({},CROUCH,{rp:[-.12+.035*Math.cos(t*5),.58,.23+.035*Math.sin(t*5)],rd:nrm([.1*Math.cos(t*5),-.85,.5]),re:[1,0,0],cy:.04*Math.sin(t*5)})),
 fu:t=>P(DEF,Object.assign({},CROUCH,{rp:[-.1,.6,.26+.04*Math.sin(t*2.2)],rd:nrm([0,-.15,1]),re:[1,0,0],cx:.28+.03*Math.sin(t*2.2)})),
 cr:(t,ph)=>{const s=Math.sin(ph*Math.PI*6);return P(DEF,{py:-.07,cx:.3,yaw:-.1,hx:.25,fl:[.12,.1,0,0,.25],fr:[-.12,-.08,0,0,-.3],rp:[-.12,.6,.27+.05*s],rd:nrm([.05,-.35,.94]),re:[0,-1,0],
  lp:[.1,.58,.29],ld:[0,0,1],cy:.05*s,pz:.01*s})},
 ins:t=>P(DEF,{hx:.35,cx:.08,lp:[.06,.7,.24],ld:nrm([0,.35,.94]),le:[-1,0,0],rp:[-.02+.015*Math.cos(t*7),.73,.25+.012*Math.sin(t*9)],rd:nrm([.1,.7,-.5]),re:[1,0,0],pl:[.7,-.6,.1]})};

// golpes de trabajo: clave → constructor (se cachean)
const WORK={wc:chop,mi:mine,sm:smith};
// tiempos del seguimiento (s) tras el impacto: pesado = más largo
const FOLLOW={dual:.36,fist:.3,sword:.4,dagger:.26,great:.7,scepter:.45,staff:.5,bow:.6,xbow:.85,wc:.45,mi:.5,sm:.35};

// ════════════════════════════ IK ════════════════════════════
const _d=new V3(),_p=new V3(),_u=new V3(),_f=new V3(),_X=new V3(),_Y=new V3(),_Z=new V3(),_m=new M4(),_q=new QT(),_q2=new QT(),_v=new V3(),_w=new V3(),_sp=new V3();
// IK de dos huesos analítico. S = grupo de la raíz (hombro/cadera; su padre es el espacio de T y pole), el = grupo de la articulación media.
// Hueso en reposo a lo largo de −y local; la articulación dobla en su x local. sgn=+1 (brazo: el antebrazo dobla hacia +z del hombro y el CODO va hacia el polo),
// sgn=−1 (pierna: la rodilla apunta al polo). Devuelve el alcance que faltó (0 = llega).
// mem (opcional) = {p} memoria del plano del codo/rodilla del fotograma anterior: el «swivel» (giro del codo alrededor de la línea hombro→mano) no puede
// cambiar más de maxA rad por fotograma. Evita que el codo dé la vuelta cuando la mano pasa cerca del hombro o del polo (IK mal condicionado).
const _pq=new V3();
export function ik2(S,el,T,pole,a,b,sgn,mem,maxA){
 _d.subVectors(T,S.position);const L0=_d.length();_d.multiplyScalar(1/Math.max(L0,1e-6));const L=cl(L0,Math.abs(a-b)+1e-4,(a+b)*.9995);
 _p.copy(pole).addScaledVector(_d,-pole.dot(_d));if(_p.lengthSq()<1e-8){_p.set(0,0,1).addScaledVector(_d,-_d.z);if(_p.lengthSq()<1e-8)_p.set(1,0,0)}_p.normalize();
 if(mem){if(mem.p){_pq.copy(mem.p).addScaledVector(_d,-mem.p.dot(_d));if(_pq.lengthSq()>.01){_pq.normalize();const ang=Math.acos(cl(_pq.dot(_p),-1,1));
   if(ang>maxA){_v.crossVectors(_pq,_p);if(_v.lengthSq()<1e-10)_v.copy(_d);_v.normalize();_p.copy(_pq).applyAxisAngle(_v,maxA)}}}else mem.p=new V3();mem.p.copy(_p)}
 const ca=cl((a*a+L*L-b*b)/(2*a*L),-1,1),sa=Math.sqrt(1-ca*ca);
 _u.copy(_d).multiplyScalar(ca).addScaledVector(_p,sa);
 _f.copy(_d).multiplyScalar(L).addScaledVector(_u,-a).multiplyScalar(1/b);
 const bend=Math.acos(cl(_u.dot(_f),-1,1));
 _Y.copy(_u).negate();_Z.copy(_f).addScaledVector(_u,-_f.dot(_u));
 if(_Z.lengthSq()<1e-8)_Z.copy(_p).multiplyScalar(-sgn);else _Z.multiplyScalar(sgn);
 _Z.normalize();_X.crossVectors(_Y,_Z);_m.makeBasis(_X,_Y,_Z);S.quaternion.setFromRotationMatrix(_m);
 el.quaternion.setFromAxisAngle(_X.set(1,0,0),-sgn*bend);return Math.max(0,L0-L)}
// marco de un objeto: +y = d, +x = filo e (ortogonalizado), +z = x × y
// prevX (opcional, V3): filo del fotograma anterior; si el filo pedido casi coincide con la dirección (marco mal definido) se mantiene el anterior → sin vueltas.
export function frameQ(dx,dy,dz,ex,ey,ez,q,prevX,maxR=.3){_Y.set(dx,dy,dz);if(_Y.lengthSq()<1e-10)_Y.set(0,1,0);_Y.normalize();_X.set(ex,ey,ez);_X.addScaledVector(_Y,-_X.dot(_Y));
 const weak=_X.lengthSq()<.02;if(weak&&prevX&&prevX.lengthSq()>.5)_X.copy(prevX).addScaledVector(_Y,-prevX.dot(_Y));
 if(_X.lengthSq()<1e-8){_X.set(1,0,0).addScaledVector(_Y,-_Y.x);if(_X.lengthSq()<1e-8)_X.set(0,0,1)}_X.normalize();
 if(prevX&&prevX.lengthSq()>.5){_pq.copy(prevX).addScaledVector(_Y,-prevX.dot(_Y));if(_pq.lengthSq()>1e-4){_pq.normalize();const ang=Math.acos(cl(_pq.dot(_X),-1,1));   // el filo gira como mucho maxR rad por fotograma
   if(ang>maxR){const sg=_v.crossVectors(_pq,_X).dot(_Y)<0?-1:1;_X.copy(_pq).applyAxisAngle(_Y,sg*maxR)}}}
 if(prevX)prevX.copy(_X);_Z.crossVectors(_X,_Y);_m.makeBasis(_X,_Y,_Z);return q.setFromRotationMatrix(_m)}

// ════════════════════════════ OBJETOS (armas y herramientas por código; +y = hoja/mango desde el agarre, +x = filo) ════════════════════════════
const sph=(r,x=1,y=1,z=1)=>new THREE.SphereGeometry(r,14,10).scale(x,y,z),cyl=(a,b,h,n=8)=>new THREE.CylinderGeometry(a,b,h,n),box=(x,y,z)=>new THREE.BoxGeometry(x,y,z);
const WOOD='#5a3e2c',DWOOD='#3e2a1e',IRON='#8a8e96',STEEL='#cfd4dc',GOLD='#d8a24a',LEATH='#4a3424';
function tube(pts,r,n=16){return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new V3(...p))),n,r,6,false)}
export const BUILD={
 sword:(p,g,o)=>{const L=o.len||.5,w=o.wid||.05;p(cyl(.021,.019,.13,6),LEATH,0,-.005,0,{p:g,ink:.009});p(sph(.03),o.gc||GOLD,0,-.08,0,{p:g,ink:.008});
  p(box(.2*(o.gw||1),.03,.05),o.gc||GOLD,0,.075,0,{p:g,ink:.009});p(box(w,L,.018).translate(0,.09+L/2,0),o.col||STEEL,0,0,0,{p:g,ink:.01});
  p(new THREE.ConeGeometry(w*.72,w*1.4,4).rotateY(Math.PI/4).scale(1,1,.36),o.col||STEEL,0,.09+L+w*.7,0,{p:g,ink:.009});
  if(L>.4)p(box(w*.22,L*.8,.022).translate(0,.1+L*.42,0),'#7a808a',0,0,0,{p:g,ink:0});return{tip:new V3(0,.09+L+w*1.2,0)}},
 great:(p,g,o)=>{const L=.86,w=.075;p(cyl(.023,.021,.28,6),LEATH,0,-.06,0,{p:g,ink:.01});p(sph(.035),o.gc||GOLD,0,-.21,0,{p:g,ink:.009});
  p(box(.34,.04,.06),o.gc||GOLD,0,.1,0,{p:g,ink:.01});[-1,1].forEach(q=>p(sph(.028),o.gc||GOLD,.17*q,.1,0,{p:g,ink:.008}));
  p(box(w,L,.022).translate(0,.12+L/2,0),o.col||STEEL,0,0,0,{p:g,ink:.012});p(box(w*.25,L*.82,.026).translate(0,.13+L*.42,0),'#6a707a',0,0,0,{p:g,ink:0});
  p(new THREE.ConeGeometry(w*.72,w*1.5,4).rotateY(Math.PI/4).scale(1,1,.36),o.col||STEEL,0,.12+L+w*.75,0,{p:g,ink:.01});return{tip:new V3(0,1.05,0)}},
 dagger:(p,g,o)=>BUILD.sword(p,g,Object.assign({},o,{len:.24,wid:.038,gw:.55})),
 scepter:(p,g,o)=>{p(cyl(.018,.022,.52,6).translate(0,.13,0),DWOOD,0,0,0,{p:g,ink:.009});p(cyl(.03,.03,.04,8),GOLD,0,.4,0,{p:g,ink:.008});
  for(let i=0;i<4;i++){const a=i/4*TAU;p(box(.012,.09,.05).rotateY(a),GOLD,Math.cos(a)*.035,.45,Math.sin(a)*.035,{p:g,ink:.006})}
  const orb=p(sph(.045),o.col||'#9cf',0,.47,0,{p:g,ink:0,mat:glow(o.col||'#9cf',1.8)});return{tip:new V3(0,.47,0),orb}},
 staff:(p,g,o)=>{p(cyl(.019,.024,1.42,6).translate(0,.25,0),WOOD,0,0,0,{p:g,ink:.011});p(cyl(.026,.026,.12,8),LEATH,0,0,0,{p:g,ink:.009});
  p(new THREE.TorusGeometry(.07,.015,6,14),GOLD,0,.96,0,{p:g,ink:.008});[0,1,2].forEach(i=>{const a=i/3*TAU;p(new THREE.ConeGeometry(.012,.12,4),WOOD,Math.cos(a)*.05,1.0,Math.sin(a)*.05,{p:g,ink:.006}).rotation.set(Math.sin(a)*.4,0,-Math.cos(a)*.4)});
  const orb=p(sph(.065),o.col||'#9cf',0,1.04,0,{p:g,ink:0,mat:glow(o.col||'#9cf',2)});return{tip:new V3(0,1.04,0),orb}},
 // arco en la izquierda: palas a lo largo de ±y, la panza hacia +z (el objetivo), cuerda entre las puntas (0,±.37,−.09)
 bow:(p,g,o)=>{p(tube([[0,-.37,-.09],[0,-.24,-.01],[0,0,.035],[0,.24,-.01],[0,.37,-.09]],.016,18),o.col||'#7a5030',0,0,0,{p:g,ink:.008});p(cyl(.024,.024,.1,8),LEATH,0,0,.03,{p:g,ink:.008});
  return{tipA:new V3(0,.37,-.09),tipB:new V3(0,-.37,-.09),rest:new V3(0,0,-.09)}},
 // ballesta en la derecha: +y = hacia el objetivo, +z = arriba, el agarre bajo la caja
 xbow:(p,g,o)=>{p(box(.045,.5,.055).translate(0,.11,.05),WOOD,0,0,0,{p:g,ink:.01});p(box(.06,.08,.09).translate(0,-.14,.03),DWOOD,0,0,0,{p:g,ink:.008});
  p(tube([[-.24,.29,.06],[-.12,.335,.06],[0,.35,.06],[.12,.335,.06],[.24,.29,.06]],.014,12),o.col||IRON,0,0,0,{p:g,ink:.008});
  return{tipA:new V3(-.24,.29,.06),tipB:new V3(.24,.29,.06),nutY:.12,relY:.32}},
 mace:(p,g,o)=>{p(cyl(.019,.022,.36,6).translate(0,.1,0),WOOD,0,0,0,{p:g,ink:.009});p(sph(.065),o.col||IRON,0,.3,0,{p:g,ink:.011});   // maza (anim espada)
  for(let i=0;i<6;i++){const a=i/6*TAU;p(new THREE.ConeGeometry(.025,.06,4).rotateZ(-Math.PI/2).rotateY(-a),o.col||IRON,Math.cos(a)*.07,.3,Math.sin(a)*.07,{p:g,ink:.006})}return{tip:new V3(0,.34,0)}},
 hatchet:(p,g,o)=>{p(cyl(.019,.022,.4,6).translate(0,.08,0),WOOD,0,0,0,{p:g,ink:.009});   // hacha de mano (anim espada): filo hacia +x
  p(new THREE.CylinderGeometry(.06,.035,.025,3,1).rotateX(Math.PI/2).rotateZ(-Math.PI/2).scale(1.3,1.6,1),o.col||IRON,.07,.26,0,{p:g,ink:.01});return{tip:new V3(.1,.26,0)}},
 greataxe:(p,g,o)=>{p(cyl(.022,.025,.9,6).translate(0,.2,0),WOOD,0,0,0,{p:g,ink:.011});   // hacha a dos manos (anim mandoble)
  p(new THREE.CylinderGeometry(.13,.07,.03,3,1).rotateX(Math.PI/2).rotateZ(-Math.PI/2).scale(1.4,1.9,1),o.col||IRON,.12,.58,0,{p:g,ink:.012});p(box(.05,.09,.04),DWOOD,-.01,.58,0,{p:g,ink:.008});return{tip:new V3(.2,.58,0)}},
 axe:(p,g,o)=>{p(cyl(.02,.023,.58,6).translate(0,-.06,0),WOOD,0,0,0,{p:g,ink:.01});
  p(new THREE.CylinderGeometry(.07,.04,.03,3,1).rotateX(Math.PI/2).rotateZ(-Math.PI/2).scale(1.45,1.8,1.1),o.col||IRON,.1,.2,0,{p:g,ink:.01});
  p(box(.05,.06,.035),DWOOD,-.01,.2,0,{p:g,ink:.008});return{}},
 pick:(p,g,o)=>{p(cyl(.02,.023,.58,6).translate(0,-.06,0),WOOD,0,0,0,{p:g,ink:.01});p(box(.06,.05,.045),DWOOD,0,.22,0,{p:g,ink:.008});
  [-1,1].forEach(q=>p(new THREE.ConeGeometry(.025,.2,5).rotateZ(-q*Math.PI/2+q*.25),o.col||IRON,q*.12,.2+.012,0,{p:g,ink:.008}));return{}},
 hammer:(p,g,o)=>{p(cyl(.017,.02,.3,6).translate(0,0,0),WOOD,0,0,0,{p:g,ink:.009});p(box(.12,.065,.065),IRON,0,.15,0,{p:g,ink:.009});return{}},
 tongs:(p,g,o)=>{[-1,1].forEach(q=>p(box(.012,.3,.012).translate(0,.15,0),'#4a4a52',.012*q,0,0,{p:g,ink:.006}).rotation.z=-q*.05);
  p(box(.07,.025,.04),'#ff8a3a',0,.31,0,{p:g,ink:0,mat:glow('#ff7a2a',1.6)});return{}},
 rod:(p,g,o)=>{p(cyl(.006,.018,1.25,6).translate(0,.44,0),'#7a5a3a',0,0,0,{p:g,ink:.008});p(cyl(.022,.022,.03,10).rotateZ(Math.PI/2),IRON,-.03,-.03,0,{p:g,ink:.006});return{tip:new V3(0,1.06,0)}},
 ladle:(p,g,o)=>{p(cyl(.011,.011,.32,6).translate(0,.1,0),'#8a8a92',0,0,0,{p:g,ink:.006});p(sph(.045,1,.55,1),'#8a8a92',0,.27,0,{p:g,ink:.007});return{}},
 saw:(p,g,o)=>{p(box(.04,.08,.03),WOOD,0,0,0,{p:g,ink:.007});p(box(.07,.32,.008).translate(.01,.2,0),'#b8bec8',0,0,0,{p:g,ink:.006});return{}},
 quill:(p,g,o)=>{p(cyl(.004,.004,.14,4).translate(0,.04,0),'#e8e0c8',0,0,0,{p:g,ink:0});p(sph(.03,.35,1.6,.12),'#f0ead8',0,.12,0,{p:g,ink:.005});return{}},
 book:(p,g,o)=>{p(box(.22,.16,.022),'#6a2a2a',0,.05,0,{p:g,ink:.008});p(box(.2,.15,.012),'#efe6cc',0,.05,.014,{p:g,ink:0});return{}},
 food:(p,g,o)=>{p(sph(.05,1,1.25,1),'#b8642a',0,.05,0,{p:g,ink:.008});p(cyl(.01,.01,.08,5),'#efe6cc',0,-.03,0,{p:g,ink:.006});return{}},
 scab:(p,g,o)=>{const cs=SCAB_COL[o.cu==null?0:o.cu],L=(o.len||.5)*(o.cu===4?1.18:1),w=o.wid||.05,y0=.1,y1=.09+L+w*1.5,h=y1-y0;   // vaina (marco de la espada): cubre la hoja; colores por cultura (weapons3d.js)
  p(box(w*1.55,h,.042).translate(0,y0+h/2,0),cs[0],0,0,0,{p:g,ink:.009});p(box(w*1.8,.032,.054).translate(0,y0+.016,0),cs[1],0,0,0,{p:g,ink:.007});
  p(box(w*1.7,.045,.048).translate(0,y1-.022,0),cs[1],0,0,0,{p:g,ink:.007});return{}},
 shield:(p,g,o)=>{if(o.sh)return armorShield(p,g,o.sh);p(sph(.2,1,1.15,.28),o.col||'#7a5a3a',0,.02,.07,{p:g,ink:.016});p(sph(.05,1,1,.6),o.e||GOLD,0,.02,.13,{p:g,ink:0});
  p(new THREE.TorusGeometry(.2,.014,6,24).scale(1,1.15,1),'#4a4a52',0,.02,.075,{p:g,ink:0});return{}}};
// FUNDAS (marco del torso) fuera de combate: {p: punto de agarre (= origen del objeto), d: dirección (+y local: hoja/mango), e: filo (+x local)}.
//  · espada, daga, cetro → cadera DERECHA (vaina con boquilla y contera; la mano derecha desenfunda sin cruzar el cuerpo); el segundo arma del doble empuñe, espejada a la izquierda;
//  · mandoble, bastón, arco, ballesta y ESCUDO → espalda (el escudo plano, cara hacia fuera, centrado entre los omóplatos).
const hipD=nrm([-.12,-.45,-.88]);
const M3=(p,d,e)=>({p,d:nrm(d),e});
const MOUNT={sword:M3([-.16,.55,0],hipD,crs([1,0,0],hipD)),dagger:M3([-.155,.545,-.01],hipD,crs([1,0,0],hipD)),scepter:M3([-.18,.62,-.02],[-.35,.45,-.82],[0,1,0]),
 great:M3([-.12,.97,-.2],[.5,-.85,-.1],[0,0,-1]),staff:M3([-.12,.8,-.215],[-.3,.95,-.05],[0,0,-1]),bow:M3([.02,.68,-.21],[.55,.83,0],[0,0,-1]),xbow:M3([0,.62,-.23],[0,1,0],[1,0,0]),
 shield:M3([0,.68,-.225],[0,1,0],[-1,0,0])};
const BACK={great:1,staff:1,bow:1,xbow:1};
// recorrido de la mano al sacar: tirón a lo largo del arma (desenvainar) antes de ir a la guardia
const PULL={sword:.42,dagger:.26,scepter:.12,great:.1,staff:.1,bow:0,xbow:.05,shield:.06};
const SWAP=.5,DRAW_T=.5,SHEATH_T=.55,DUR_K={great:1.4,staff:1.2,bow:1.1,xbow:1.15};   // duración por arma (el mandoble pesa: se saca más despacio)   // s=SWAP: la mano agarra el objeto y este cambia de sitio (funda/espalda ↔ mano)
const TOOLKIND={tongsR:'tongs'};
const TOOL={wc:['axe'],mi:['pick'],sm:['hammer','tongs'],fu:['tongsR'],co:['ladle'],fi:['rod'],cr:['saw'],es:['saw'],ins:['quill','book'],eat:['food']};

// ════════════════════════════ EL ANIMADOR ════════════════════════════
// ARMAS → ANIMACIÓN (reciclar): un arma nueva NO necesita animaciones nuevas. Añade una fila: anim = clase de animación existente
// (sword, dagger, great, scepter, staff, bow, xbow) y mesh = constructor de BUILD (uno existente o uno nuevo de 3-4 piezas); o = opciones del mesh.
// El juego elige la fila con gear.wp.wk (o gear.wp.t). Ejemplos ya listos: maza, hacha de mano, hacha a dos manos, katana, varita.
export const WEAPON={sword:{anim:'sword'},dagger:{anim:'dagger'},great:{anim:'great'},scepter:{anim:'scepter'},staff:{anim:'staff'},bow:{anim:'bow'},xbow:{anim:'xbow'},
 mace:{anim:'sword',mesh:'mace'},hatchet:{anim:'sword',mesh:'hatchet'},greataxe:{anim:'great',mesh:'greataxe'},katana:{anim:'sword',mesh:'sword',o:{len:.58,wid:.04,gw:.45}},wand:{anim:'scepter',mesh:'scepter'}};
const DUAL_OK={sword:1,dagger:1};   // clases de una mano que se pueden llevar a pares
export class HeroAnim{
 // m = Mini (mini3d.js), look = {gear:{wp:{t,wk,col}, sh}}
 constructor(m,look){this.m=m;const GR=(look&&look.gear)||{},w=GR.wp,w2=GR.wp2,W=w?(WEAPON[w.wk]||WEAPON[w.t]||WEAPON.sword):null,W2=w2?(WEAPON[w2.wk]||WEAPON[w2.t]||WEAPON.sword):null;
  this.wk=W?W.anim:null;this.cls=this.wk||'fist';
  // doble empuñe: gear.wp2 = arma de la mano izquierda (dos de una mano: espada/daga y sus recicladas). La clase de golpes la marca la derecha.
  this.dual=!!(W&&W2&&DUAL_OK[W.anim]&&DUAL_OK[W2.anim]);if(this.dual){this.dualK=W.anim;this.cls='dual'}
  this.hasSh=!!GR.sh&&!this.dual;this.shUse=this.hasSh&&!['great','bow','xbow'].includes(this.cls);this.wcol=w&&w.col;this.hasGear=!!(this.wk||this.hasSh);this.drawn=false;this.xd=0;this.xp=0;this.pcSh=false;this.hsT=new Float32Array(N);this.hsV=new Float32Array(N);
  this.v=new Float32Array(N);this.live=new Float32Array(N);this.snap=new Float32Array(N);this.fade=1;this.fadeDur=.15;this.key='';this.prevKey='';
  this.gph=0;this.loco=0;this.runK=0;this.spd=0;this.hits=0;this.vr=0;this.impT=-1;this.lastPh=0;this.inStrike=0;this.t=0;this.tug=0;this.cache={};
  this.feetPrev=[new V3(),new V3()];this.liftX=[0,0];this.reach=[0,0,0,0];
  // objetos
  this.it={};const mk=(name,kind,o,hand)=>{const g=new THREE.Group();g.name='it_'+name;const info=cultWeapon(kind,m.part,g,o||{})||BUILD[kind](m.part,g,o||{})||{};this.it[name]=Object.assign({g,kind,hand},info);if(name==='off')this.it[name].mount='off';g.visible=false;m.body.add(g);return this.it[name]};
  if(this.wk){const o={col:this.wk==='staff'||this.wk==='scepter'?(w.col||'#9cf'):(w.col||STEEL)};if(this.wk==='bow'||this.wk==='xbow')o.col=w.col||(this.wk==='bow'?'#7a5030':IRON);o.cu=w.cu;
   const mi=mk('main',W.mesh||this.wk,Object.assign(o,W.o||{}),this.wk==='bow'?1:0);mi.mc=this.wk;
   if((W.mesh||this.wk)==='sword'||(W.mesh||this.wk)==='dagger')mi.scab=this.scabbard('scab_main',Object.assign({len:this.wk==='dagger'?.24:.5,wid:this.wk==='dagger'?.038:.05,cu:w.cu},W.o||{}))}
  if(this.dual){const oi=mk('off',W2.mesh||W2.anim,Object.assign({col:w2.col||STEEL,cu:w2.cu},W2.o||{}),1);oi.mc=W2.anim;
   if((W2.mesh||W2.anim)==='sword'||(W2.mesh||W2.anim)==='dagger')oi.scab=this.scabbard('scab_off',Object.assign({len:W2.anim==='dagger'?.24:.5,wid:W2.anim==='dagger'?.038:.05,cu:w2.cu},W2.o||{}))}
  if(this.hasSh)mk('shield','shield',{col:typeof GR.sh==='string'?GR.sh:'#7a5a3a',sh:look&&look.arm&&look.arm.s},1);
  // cuerdas (arco/ballesta), flecha/virote y orbe de la mano: sin contorno, se recolocan cada fotograma
  const lineM=new THREE.MeshBasicMaterial({color:'#e8e0c8'});const seg=()=>{const s=new THREE.Mesh(new THREE.CylinderGeometry(.0045,.0045,1,4).translate(0,.5,0),lineM);s.castShadow=false;return s};
  if(this.wk==='bow'||this.wk==='xbow'){const M=this.it.main;M.str=[seg(),seg()];M.str.forEach(s=>M.g.add(s));
   const a=new THREE.Group();const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,this.wk==='bow'?.56:.3,4).translate(0,this.wk==='bow'?.28:.15,0),new THREE.MeshBasicMaterial({color:'#d8c9a3'}));
   const head=new THREE.Mesh(new THREE.ConeGeometry(.014,.05,4).translate(0,this.wk==='bow'?.58:.32,0),new THREE.MeshBasicMaterial({color:'#9aa2b0'}));
   const fl=new THREE.Mesh(new THREE.BoxGeometry(.03,.06,.002).translate(0,.04,0),new THREE.MeshBasicMaterial({color:'#c8483a'}));a.add(shaft,head,fl);M.arrow=a;M.g.add(a)}
  const oc=w&&(this.wk==='staff'||this.wk==='scepter')?(w.col||'#9cf'):'#9cf';
  this.orbL=new THREE.Mesh(sph(.05),glow(oc,2.2));this.orbL.visible=false;m.grips[1].add(this.orbL);this.orbL.position.set(0,-.02,.06);
  this.haloM=new THREE.MeshBasicMaterial({color:new THREE.Color(oc).multiplyScalar(1.5),transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
  this.haloL=new THREE.Mesh(sph(.12),this.haloM);this.orbL.add(this.haloL);
  if(this.it.main&&this.it.main.orb){const M=this.it.main;M.orbMat=M.orb.material;M.orbBase=M.orbMat.color.clone();M.haloM=this.haloM.clone();M.halo=new THREE.Mesh(sph(.13),M.haloM);M.orb.add(M.halo)}
  this.tip=new V3();this.rodTip=null;
  m.pelvis.rotation.order='YXZ';m.chest.rotation.order='YXZ'}
 eatL(){return this.drawn&&!this.xd&&!!this.wk&&this.wk!=='bow'?1:0}   // con el arma EN la mano derecha se come con la izquierda (sin envainar); envainada, con la derecha
 scabbard(name,o){const g=new THREE.Group();g.name=name;BUILD.scab(this.m.part,g,o);this.m.body.add(g);return g}
 tool(name){if(!this.it[name]){const g=new THREE.Group();g.name='it_'+name;const kind=TOOLKIND[name]||name,info=BUILD[kind](this.m.part,g,{})||{};
   this.it[name]=Object.assign({g,kind,hand:name==='tongs'||name==='book'||(name==='food'&&this.eatL())?1:0},info);g.visible=false;this.m.body.add(g)}return this.it[name]}
 // ── estado → pose viva ──
 update(st,dt,t){dt=Math.min(.1,Math.max(1e-4,dt||1/60));this.t=t;const sw=st.mv&&st.act&&st.act.k==='f'&&st.act.mv?1:0,a=(st.mv&&!sw)?null:st.act,v=this.live;   // sw = GOLPE MIENTRAS TE MUEVES (combate dirigido): el tren superior hace el golpe y las piernas siguen caminando
  const fight=!!(a&&(a.k==='f'||a.k==='sp')),combat=!!(st.cb||fight);
  // armas guardadas fuera de combate: al entrar se DESENFUNDAN (mano → empuñadura → guardia), al salir se ENFUNDAN; con herramienta en la mano el arma queda en su sitio
  this.holster(combat,fight,a,a?(a.k==='sm'&&a.id==='furnace'?'fu':a.k):null,dt);
  const armed=this.xd>0||(this.drawn&&!this.xd),cls=armed?this.cls:'fist',sh=armed&&this.shUse;this.pcSh=sh;
  // locomoción: velocidad medida (o virtual en el visor) → zancada y cadencia propias
  const sp=st.speed!=null?st.speed:(st.dist!=null?st.dist/dt:0);this.spd+=(sp-this.spd)*(1-Math.exp(-dt*8));
  const k=this.m.k||1,vm=this.spd/k,cad=cl(1.3+.25*vm,1.5,2.6);
  if(st.mv&&vm>.15)this.gph+=dt*vm/(vm/cad);   // = dt·cadencia (la zancada = v/cadencia)
  else if(st.mv){const f=((this.gph%.5)+.5)%.5;if(f>.01&&f<.49)this.gph+=Math.min(.5-f,dt*2)}   // asentado: termina el paso hasta el doble apoyo
  this.runK+=((st.run?1:0)-this.runK)*(1-Math.exp(-dt*7));
  let key,fd=.16,feetStep=1,LB=null;
  if(sw){this.movePose(cls,sh,true,t,v);LB=Float32Array.from(v)}   // piernas y altura de la marcha, guardadas para devolverlas tras el golpe
  if(a){const ak=a.k==='sm'&&a.id==='furnace'?'fu':a.k;
   if(ak==='f'||WORK[ak]){const wkey=ak==='f'?cls:ak;
    // ph>0 = cargando/golpeando; al volver a 0 tras pasar de .5 = IMPACTO → seguimiento con reloj propio
    const ph=a.ph||0;
    if(ph>0&&!this.inStrike){this.inStrike=1;this.vr=this.hits&1;this.hvNow=!!a.hv;if(this.impT>=0&&t-this.impT<FOLLOW[wkey])this.forceFade=.12}
    if(ph===0&&this.inStrike&&this.lastPh>.5){this.inStrike=0;this.impT=t;this.hits++}
    if(ph===0&&this.lastPh<=.5)this.inStrike=0;
    this.lastPh=ph;
    const clip=this.clip(ak,cls,sh,this.hvNow,this.vr);let u;
    if(this.inStrike)u=ph;else if(this.impT>=0){const fdur=FOLLOW[wkey]*(this.hvNow?1.2:1);u=1+cl((t-this.impT)/fdur,0,1)}else u=2;
    if(u>=2&&!this.inStrike)this.stancePose(wkey,sh,t,v);else{sampleClip(clip,u,v);this.breath(v,t,.4)}
    key='act:'+ak+':'+(this.hvNow?'h':'')+this.vr;feetStep=0}
   else if(ak==='sp'){const u=a.ph||0;if(this.key==='sp'&&u<this.lastU-.3)this.forceFade=.15;this.lastU=u;sampleClip(this.clip('sp',cls,sh,0,a.wt),u,v);key='sp';feetStep=0;this.inStrike=0}
   else if(ak==='fi'){sampleClip(this.clip('fi'),a.ph||0,v);this.tug+=((a.tug||0)-this.tug)*(1-Math.exp(-dt*25));
    if(this.tug>.01){const s=this.tug;v[C.rd+1]+=.45*s;v[C.rd+2]-=.25*s;v[C.rp+1]+=.04*s;v[C.cx]-=.05*s}
    v[C.rd]+=Math.sin(t*1.3)*.03;v[C.rd+1]+=Math.sin(t*1.7)*.03;this.breath(v,t,.5);key='fi'}
   else if(ak==='eat'||ak==='pk'){if(this.key===ak&&(a.ph||0)<this.lastU-.3)this.forceFade=.12;this.lastU=a.ph||0;sampleClip(this.clip(ak,cls,sh,0,this.eatL()),a.ph||0,v);if(ak==='eat'){const c=a.ph>.25&&a.ph<.92?Math.sin((a.ph-.25)*Math.PI*10):0;v[C.mouth]=Math.max(0,c);v[C.hx]+=c*.04;v[C.rp+1]+=Math.max(0,c)*.012}key=ak;feetStep=0}
   else if(LOOPS[ak]){v.set(LOOPS[ak](t,a.ph||0));this.breath(v,t,.5);key=ak}
   else if(ak==='es'){v.set(LOOPS.cr(t,a.ph||0));key=ak}
   else{this.relaxPose(cls,sh,t,v);key='idle'}
   if(ak!=='f'&&!WORK[ak]){this.inStrike=0;this.lastPh=0}}
  else{this.inStrike=0;this.lastPh=0;
   if(st.mv){this.movePose(cls,sh,combat,t,v);key='mv'+(combat?'c':'');fd=.14}
   else if(combat){this.stancePose(cls,sh,t,v);key='st';fd=.22}
   else{this.relaxPose(cls,sh,t,v);key='idle';fd=.3}}
  if(LB){for(let i=0;i<3;i++)v[i]=LB[i];for(let i=12;i<22;i++)v[i]=LB[i];key='mvf';feetStep=0;fd=.1}
  this.mode=a?(a.k==='sm'&&a.id==='furnace'?'fu':a.k):null;
  // resolver (marco del suelo → torso, mano en la cuerda) y fundir con la pose anterior si cambió el estado
  this.resolve(v);if(this.xd)this.holsterOver(v,this.xd>0?this.xp:1-this.xp);v[C.spin]=Math.atan2(Math.sin(v[C.spin]),Math.cos(v[C.spin]));
  const ds=st.dash||0;if(ds>.001&&ds<.999){
   // QUICKSTEP estilo BLOODBORNE (21 oct 2026; el dueño descartó la voltereta): paso rápido y bajo, SIN giros. El cuerpo se agacha y se inclina hacia donde va (`env`: sube rápido, se mantiene y se suelta suave),
   // una pierna adelante y otra atrás (zancada larga, pies pegados al suelo), los brazos barridos hacia atrás y la cabeza al frente (`hx += .55·pit` anula la compensación de la cabeza). Todo se mezcla con `env`, sin saltos. Se aplica sobre la pose VIVA `v` (antes del fundido de cambio de estado): aplicarlo sobre la salida `out` sumaba el cabeceo dos veces al volver a reposo y daba el tirón final.
   const env=ss(0,.12,ds)*(1-ss(.3,1,ds)),pi=.4*env;   // la salida es LARGA (≈ 0,3 s tras parar): el cuerpo se incorpora poco a poco, sin volver de golpe
   v[C.pit]+=pi;v[C.hx]+=.55*pi;v[C.py]-=.1*env;v[C.cx]+=.12*env;
   const F=[[C.fl,.11,.3,.02],[C.fr,-.11,-.27,.05]];F.forEach(([c0,x,z,y])=>{v[c0]+=(x-v[c0])*env;v[c0+1]+=(z-v[c0+1])*env;v[c0+2]+=(y-v[c0+2])*env;v[c0+3]*=1-env;v[c0+4]*=1-env});
   const HR=[-.2,.58,-.2],HL=[.2,.58,-.2],PR=[-.8,0,-.4],PL=[.8,0,-.4];
   for(let i=0;i<3;i++){v[C.rp+i]+=(HR[i]-v[C.rp+i])*env;v[C.lp+i]+=(HL[i]-v[C.lp+i])*env;v[C.pr+i]+=(PR[i]-v[C.pr+i])*env;v[C.pl+i]+=(PL[i]-v[C.pl+i])*env;v[C.rd+i]*=1-env*.8;v[C.ld+i]*=1-env*.8}
   v[C.two]*=1-env}   // el giro se funde por el camino corto
  if(this.xd){key+='X';fd=.12}
  if(key!==this.key||this.forceFade){this.snap.set(this.v);this.fade=0;this.fadeDur=this.forceFade||(this.key==='idle'||this.key==='st'?fd:Math.max(fd,.12));this.forceFade=0;this.prevKey=this.key;this.key=key}
  const out=this.v;if(this.fade<1){this.fade=Math.min(1,this.fade+dt/this.fadeDur);const e=EASE.io(this.fade);for(let i=0;i<N;i++)out[i]=this.snap[i]+(v[i]-this.snap[i])*e}else out.set(v);
  // daño: retroceso aditivo
  const h=st.hurt||0;if(h>.01){const e=h*h*(3-2*h);out[C.cx]-=.24*e;out[C.hx]-=.18*e;out[C.pz]-=.04*e;out[C.py]-=.035*e;out[C.cy]+=.1*e;out[C.rp+1]+=.04*e;out[C.lp+1]+=.05*e;out[C.rp+2]-=.01*e;out[C.lp+2]-=.01*e}
  // CINE-4 · pose de RECIBIR (st.recv 0..1, la fija CINE): la mano derecha sube al frente con la palma abierta (hacia arriba), el torso se inclina un poco y la cabeza sigue al objeto
  // DASH (ISLA-7/COMBATE): st.dash 0..1 = fase de la esquiva; el cuerpo se LANZA hacia delante (cabeceo 0 → .85 rad → 0, sin dar la vuelta: con la vuelta completa el pelo y la cabeza se volteaban), la cabeza compensa para seguir mirando adelante y baja un poco
  const rc=st.recv||0;if(rc>.001){const e=rc*rc*(3-2*rc),T=[-.17,.86,.34],D=[.1,.95,.3],E=[-.6,-.4,-.7];for(let i=0;i<3;i++){out[C.rp+i]+=(T[i]-out[C.rp+i])*e;out[C.rd+i]+=(D[i]-out[C.rd+i])*e;out[C.re+i]+=(E[i]-out[C.re+i])*e}out[C.hx]-=.14*e;out[C.cx]+=.06*e}
  this.apply(out,dt,feetStep&&this.key!=='mv'&&this.key!=='mvc'&&this.key!=='mvf');
  this.items(st);this.fx(out)}
 clip(k,cls,sh,hv,vr){const id=k+'|'+cls+'|'+(sh?1:0)+'|'+(hv?1:0)+'|'+vr;if(this.cache[id])return this.cache[id];let c;const S=this.stanceOf(cls,sh);
  if(k==='f'&&cls==='dual'){const d=this.dualK;c=hv?dualH(S,d):vr?dualB(S,d):dualA(S,d)}
  else if(k==='f'){if(cls==='great')c=hv?greatH(S):greatA(S);else if(cls==='sword')c=hv?thrust(S,sh,1):vr?swordB(S,sh):swordA(S,sh);else if(cls==='dagger')c=hv?thrust(S,sh,1.05):vr?daggerB(S,sh):daggerA(S,sh);
   else if(cls==='fist')c=hv?hook(S,sh):vr&&!sh?fistB(S,sh):fistA(S,sh);else if(cls==='bow')c=bowA(S,hv);else if(cls==='xbow')c=xbowA(S);else if(cls==='staff')c=staffA(S,sh,hv);else c=scepterA(S,sh,hv)}
  else if(k==='sp'&&cls==='dual')c=dualSp(S,this.dualK);
  else if(k==='sp'){if(vr==='r'||cls==='bow'||cls==='xbow')c=cls==='xbow'?spXbow(S):spBow(S);else if(vr==='g'||cls==='staff'||cls==='scepter')c=spStaff(S,sh&&cls!=='staff'?sh:false,cls==='scepter');else c=spMelee(S,cls,sh)}
  else if(WORK[k])c=WORK[k]();else if(k==='fi')c=fishC();else if(k==='eat')c=eatC(vr);else if(k==='pk')c=pickC(vr);
  return this.cache[id]=c}
 stanceOf(cls,sh){if(cls==='dual')return STANCE['dual'+this.dualK];if(sh)return cls==='sword'?STANCE.swordSh:STANCE[cls+'Sh']||STANCE[cls];return STANCE[cls]}
 stancePose(k,sh,t,v){if(WORK[k])v.set(this.clip(k).tracks[0].keys[0].v);else v.set(this.stanceOf(k,sh));this.breath(v,t,1);
  // el arma «vive» en guardia: la punta oscila un poco (más lento y amplio en el mandoble = pesa)
  const sw=k==='great'?1.4:1;v[C.rd]+=Math.sin(t*1.1)*.035*sw;v[C.rd+2]+=Math.sin(t*.8+1)*.03*sw;if(this.cls==='staff'||this.cls==='scepter')v[C.glowL]+=Math.sin(t*3)*.08}
 relaxOf(cls,sh){if(cls==='dual')return RELAX['dual'+this.dualK];return sh?(RELAX[cls+'Sh']||RELAX[cls]):RELAX[cls]}
 relaxPose(cls,sh,t,v){v.set(this.relaxOf(cls,sh));this.breath(v,t,1);
  // cambio de peso lento y mirada que deriva (reposo vivo)
  const w=Math.sin(t*.45);v[C.px]+=w*.012;v[C.rol]-=w*.025;v[C.cz]+=w*.015;v[C.hy]+=Math.sin(t*.23)*.25*Math.max(0,Math.sin(t*.11));v[C.hx]+=Math.sin(t*.37)*.03}
 breath(v,t,amp){const b=Math.sin(t*2.2);v[C.py]+=b*.005*amp;v[C.cx]+=Math.sin(t*2.2+.7)*.012*amp;v[C.rp+1]+=b*.006*amp;v[C.lp+1]+=b*.006*amp}
 // ── ANDAR / CORRER: pies por fase de distancia (apoyo con pie plantado, despegue de talón, vuelo al correr), pelvis que sube y baja, cadera y hombros en
 //    contrafase, brazos pendulares (codo suelto al andar; a ~90° y bombeando al correr). En combate el torso conserva la guardia con el arma.
 movePose(cls,sh,combat,t,v){const rk=this.runK,u=this.gph,W=this.m.W||1,vm=this.spd/(this.m.k||1);
  const usesAim=cls==='bow'||cls==='xbow';const base=combat&&!usesAim?this.stanceOf(cls,sh):this.relaxOf(cls,sh);v.set(base);
  const g=cl((vm-2)/1.6,0,1),S=lerp(lerp(.58,.46,g),.28,rk),A=lerp(lerp(.16,.18,g),.165,rk),H=lerp(lerp(.05,.075,g),.12,rk),fx=.085*W;
  const foot=(ph,side,o)=>{ph=((ph%1)+1)%1;let z,l,p;
   if(ph<S){const s=ph/S;z=A-2*A*s;l=0;p=s<.15?lerp(-.35,0,s/.15):s>.72?lerp(0,.7,(s-.72)/.28):0}
   else{const s=(ph-S)/(1-S),e=s*s*(3-2*s);z=-A+2*A*e;l=H*Math.pow(Math.sin(Math.PI*Math.min(1,s*1.08)),.8)+(rk>.01?rk*H*.5*Math.sin(Math.PI*Math.min(1,s*1.8)):0);
    p=s<.35?lerp(.7,0,s/.35):s>.75?lerp(0,-.35,(s-.75)/.25):0}
   o[0]=fx*side*(1-.15*rk);o[1]=z+.015;o[2]=l;o[3]=p;o[4]=side*.06};
  const fL=[0,0,0,0,0],fR=[0,0,0,0,0];foot(u,1,fL);foot(u+.5,-1,fR);set(v,{fl:fL,fr:fR});
  // altura de marcha CONSTANTE: la pelvis va ya a la altura a la que los pies llegan con la zancada más abierta (antes bajaba de golpe en cada apoyo
  // → la cabeza subía y bajaba ~4,5 % de la altura dos veces por paso, pedido del dueño). Encima solo un balanceo mínimo.
  const R=.39*.985,Ae=lerp(A+.022,A*.8+.014,rk),hb=.03+Math.sqrt(R*R-Ae*Ae)-.42,c2=Math.cos(TAU*u),bob=lerp(.004,-.005,rk)*Math.cos(2*TAU*(u-S/2));
  // correr = masa-resorte: la pelvis va ALTA (piernas casi estiradas al pasar), se hunde al recibir el apoyo (resolve() la baja lo justo para que el pie llegue) y sube en el vuelo; al andar, péndulo invertido como antes
 
  v[C.py]=hb-.004+bob;v[C.px]=0;v[C.pz]=0;v[C.yaw]=-lerp(.12,.2,rk)*c2+(combat?-.1:0);v[C.rol]=.03*Math.sin(TAU*u)*(1-rk)+.045*rk*Math.sin(TAU*u);
  v[C.cx]=(combat?base[C.cx]*.6:0)+lerp(.05,.07,g)+.015*rk+.018*rk*Math.cos(2*TAU*(u-S/2+.25));v[C.cy]=(combat?base[C.cy]*.4:0)+lerp(.18,.3,rk)*c2;v[C.cz]=-.03*rk*Math.sin(TAU*u);v[C.pit]=.055*rk;   // correr: inclinación leve de TODO el cuerpo desde la pelvis (antes el pecho se adelantaba solo y la espalda se encorvaba)

  // brazos: libres → péndulo; con objeto → el brazo entero oscila menos (rota la mano y el objeto alrededor del hombro)
  const twoH=v[C.two]>.5,freeR=(!combat&&cls==='fist')||cls==='bow',freeL=!twoH&&!(sh)&&!(cls==='bow')&&cls!=='dual'&&!(combat&&cls!=='sword'&&cls!=='great'),
   amp=lerp(.42,.6,rk),base0=lerp(.04,.1,rk),bend0=lerp(.3,1.5,rk);
  const hang=(side,pitch)=>{const sx=.19*side*W,ab=.1+.04*rk,ux=side*Math.sin(ab),uy=-Math.cos(ab),bend=bend0+(rk<.5?.35*Math.max(0,pitch):0);
   const p1=pitch,p2=pitch+bend;return[sx+(ux*.18+ux*.18*.9),.78+uy*Math.cos(p1)*.18+uy*Math.cos(p2)*.18,-uy*Math.sin(p1)*.18-uy*Math.sin(p2)*.18]};
  const sR=base0+amp*c2+.05*rk*Math.max(0,c2),sL=base0-amp*c2+.05*rk*Math.max(0,-c2);
  if(freeR){set(v,{rp:hang(-1,sR),pr:[-.3,-.3,-1]})}else if(!combat||cls==='fist')this.swingHeld(v,C.rp,C.rd,C.re,-1,(twoH||cls==='great'?.15:cls==='staff'?.1:.45)*amp*c2);
  if(freeL){set(v,{lp:hang(1,sL),pl:[.3,-.3,-1]})}else if(!twoH&&!(combat&&cls==='dual'))this.swingHeld(v,C.lp,C.ld,C.le,1,-.4*amp*c2);
  if(combat){v[C.rp+1]+=.01*Math.cos(2*TAU*u);v[C.lp+1]+=.01*Math.cos(2*TAU*u)}
  if(cls==='staff'&&!combat){const s=.08*Math.sin(TAU*u);this.swingHeld(v,C.rp,C.rd,C.re,-1,s)}   // cayado: se adelanta y se apoya al paso
  v[C.hx]=-.04-.02*rk;v[C.hy]=0}
 // gira la mano y su objeto alrededor del eje x del hombro (péndulo del brazo que sostiene algo)
 swingHeld(v,ip,id,ie,side,ang){const c=Math.cos(ang),s=-Math.sin(ang);   // ang>0 = hacia delante
  const y=v[ip+1]-.78,z=v[ip+2];v[ip+1]=.78+y*c-z*s;v[ip+2]=y*s+z*c;
  for(const i of[id,ie]){const y2=v[i+1],z2=v[i+2];v[i+1]=y2*c-z2*s;v[i+2]=y2*s+z2*c}}
 // ── resolver: marco del suelo → torso (aim), mano derecha en la cuerda del arco, pelvis que baja si los pies no llegan ──
 resolve(v){const m=this.m,W=m.W||1;
  // pelvis: bajar lo justo para que ambos pies lleguen (muslo+espinilla .39 → 98,5 %)
  _q.setFromEuler(new EU(v[C.pit],v[C.yaw],v[C.rol],'YXZ'));let dyMin=0;
  for(const [i,side] of[[C.fl,1],[C.fr,-1]]){_v.set(.09*side*W,0,0).applyQuaternion(_q);const hx=v[C.px]+_v.x,hy=.42+v[C.py]+_v.y,hz=v[C.pz]+_v.z;
   const fx=v[i],fy=.03+v[i+2],fz=v[i+1],h=Math.hypot(fx-hx,fz-hz),R=.39*.985;if(h<R){const need=fy+Math.sqrt(R*R-h*h);if(hy>need)dyMin=Math.min(dyMin,need-hy)}else dyMin=Math.min(dyMin,fy-hy)}
  v[C.py]+=dyMin;
  this.aimToTorso(v);
  // escudo: lo mantiene hacia el enemigo aunque el torso gire al cargar (contrarresta el 75 % de la torsión respecto a la guardia)
  if(this.pcSh&&v[C.two]<.5&&!(this.mode&&TOOL[this.mode])){const a=-.75*(v[C.cy]-(this.stanceOf(this.cls,1)[C.cy])),c=Math.cos(a),sn=Math.sin(a);
   for(const i of[C.lp,C.ld,C.le,C.pl]){const x=v[i],z=v[i+2];v[i]=x*c+z*sn;v[i+2]=-x*sn+z*c}}
  // arco: la mano derecha va de la cuerda en reposo (detrás del agarre) al punto de anclaje (rp) según draw
  if(this.cls==='bow'&&v[C.aux]>.001&&this.it.main){frameQ(v[C.ld],v[C.ld+1],v[C.ld+2],v[C.le],v[C.le+1],v[C.le+2],_q2);_v.copy(this.it.main.rest).applyQuaternion(_q2).add(_w.set(v[C.lp],v[C.lp+1],v[C.lp+2]));
   const d=v[C.draw],a=v[C.aux];for(let j=0;j<3;j++){const nk=_v.getComponent(j)+(v[C.rp+j]-_v.getComponent(j))*d;v[C.rp+j]+=(nk-v[C.rp+j])*a}}}
 // manos y polos del marco del SUELO (aim=1: arco/ballesta apuntando) → marco del torso
 aimToTorso(v){const aim=v[C.aim];if(aim>.001){this.bodyFrame(v);
   const cv=(i,dir)=>{_v.set(v[i],v[i+1],v[i+2]);if(dir)_v.applyQuaternion(this.qBi);else _v.sub(this.pB).applyQuaternion(this.qBi);v[i]+=(_v.x-v[i])*aim;v[i+1]+=(_v.y-v[i+1])*aim;v[i+2]+=(_v.z-v[i+2])*aim};
   cv(C.rp);cv(C.lp);cv(C.rd,1);cv(C.re,1);cv(C.ld,1);cv(C.le,1);cv(C.pr,1);cv(C.pl,1);v[C.aim]=0}}
 bodyFrame(v){this.qP=this.qP||new QT();this.qC=this.qC||new QT();this.qB=this.qB||new QT();this.qBi=this.qBi||new QT();this.pB=this.pB||new V3();
  this.qP.setFromEuler(new EU(v[C.pit],v[C.yaw],v[C.rol],'YXZ'));this.qC.setFromEuler(new EU(v[C.cx],v[C.cy],v[C.cz],'YXZ'));this.qB.copy(this.qP).multiply(this.qC);this.qBi.copy(this.qB).invert();
  this.pB.set(0,-.42,0).applyQuaternion(this.qB).add(_v.set(v[C.px],.42+v[C.py],v[C.pz]))}
 // ── aplicar al rig ──
 apply(v,dt,stepFeet){const m=this.m,W=m.W||1;
  m.pelvis.position.set(v[C.px],.42+v[C.py],v[C.pz]);m.pelvis.rotation.set(v[C.pit],v[C.yaw],v[C.rol]);
  m.chest.rotation.set(v[C.cx],v[C.cy],v[C.cz]);
  m.head.rotation.set(v[C.hx]-.55*(v[C.cx]+v[C.pit]),v[C.hy]-.8*(v[C.cy]+v[C.yaw]),v[C.hz]-.5*(v[C.cz]+v[C.rol]));
  if(m.mouth)m.mouth.scale.y=1+v[C.mouth]*2.2;
  // brazos
  const pole=new V3(),tgt=new V3();
  const mA=dt*16;this.mem=this.mem||[{},{},{},{}];this.px=this.px||[new V3(),new V3()];
  tgt.set(v[C.rp],v[C.rp+1],v[C.rp+2]);pole.set(v[C.pr],v[C.pr+1],v[C.pr+2]);this.reach[0]=ik2(m.arms[0],m.elbows[0],tgt,pole,.18,.18,1,this.mem[0],mA);
  frameQ(v[C.rd],v[C.rd+1],v[C.rd+2],v[C.re],v[C.re+1],v[C.re+2],_q,this.px[0]);if(v[C.spin])_q.multiply(_q2.setFromAxisAngle(_v.set(0,1,0),v[C.spin]));
  this.qR=this.qR||new QT();this.qR.copy(_q);
  _q2.copy(m.arms[0].quaternion).multiply(m.elbows[0].quaternion).invert();m.grips[0].quaternion.copy(_q2).multiply(_q);
  // punto real del agarre derecho (puede no llegar) → mano izquierda al mango
  const gR=this.gripPos(0,new V3());const two=v[C.two];
  if(two>.001){_v.set(v[C.rd],v[C.rd+1],v[C.rd+2]).normalize().multiplyScalar(-v[C.lh]).add(gR);tgt.set(v[C.lp],v[C.lp+1],v[C.lp+2]).lerp(_v,two)}else tgt.set(v[C.lp],v[C.lp+1],v[C.lp+2]);
  pole.set(v[C.pl],v[C.pl+1],v[C.pl+2]);this.reach[1]=ik2(m.arms[1],m.elbows[1],tgt,pole,.18,.18,1,this.mem[1],mA);
  if(two>.001)this.reach[1]=this.gripPos(1,_w).distanceTo(tgt);
  frameQ(v[C.ld],v[C.ld+1],v[C.ld+2],v[C.le],v[C.le+1],v[C.le+2],_q,this.px[1]);_q2.copy(m.arms[1].quaternion).multiply(m.elbows[1].quaternion).invert();m.grips[1].quaternion.copy(_q2).multiply(_q);
  // piernas: objetivo en el marco del suelo (root) → espacio de la pelvis
  const qP=_q.copy(m.pelvis.quaternion),qPi=new QT().copy(qP).invert(),pp=m.pelvis.position;
  [[C.fr,0,-1],[C.fl,1,1]].forEach(([i,leg,side])=>{let fx=v[i],fz=v[i+1],lift=v[i+2];
   // pies en reposo/guardia: si el objetivo se desliza, el pie se levanta un poco (da un pasito en vez de patinar)
   const fp=this.feetPrev[leg];if(stepFeet){const sp=Math.hypot(fx-fp.x,fz-fp.z)/dt;this.liftX[leg]+=(cl(sp*.03,0,.045)-this.liftX[leg])*(1-Math.exp(-dt*18));lift+=this.liftX[leg]}else this.liftX[leg]*=.8;
   fp.set(fx,0,fz);
   tgt.set(fx,.03+lift,fz).sub(pp).applyQuaternion(qPi);const yw=v[i+4];pole.set(Math.sin(yw)+side*.15,0,Math.cos(yw)).applyQuaternion(qPi);
   this.reach[2+leg]=ik2(m.legs[leg],m.knees[leg],tgt,pole,.2,.19,-1,this.mem[2+leg],mA);
   // tobillo: pie plano en el suelo (giro yw, cabeceo = despegue de talón / punta arriba)
   _q2.copy(qP).multiply(m.legs[leg].quaternion).multiply(m.knees[leg].quaternion).invert();
   m.ankles[leg].quaternion.copy(_q2).multiply(new QT().setFromEuler(new EU(v[i+3],yw,0,'YXZ')))})}
 gripPos(i,o){const m=this.m;o.set(0,-.18,0).applyQuaternion(m.elbows[i].quaternion).add(m.elbows[i].position).applyQuaternion(m.arms[i].quaternion).add(m.arms[i].position);return o}
 // ── objetos: qué va en cada mano, qué se envaina, qué se esconde ──
 // marco de la funda/espalda de un objeto (torso). El 2.º arma del doble empuñe va espejada a la cadera izquierda; con escudo a la espalda, el bastón se echa atrás.
 mountOf(k){const it=this.it[k];if(!it)return null;const mc=k==='shield'?'shield':it.mc;const b=MOUNT[mc];if(!b)return null;
  let p=b.p.slice(),d=b.d.slice(),e=b.e.slice();
  if(k==='off'){p[0]=-p[0];d[0]=-d[0];e[0]=-e[0]}
  if(k==='main'&&this.shUse&&BACK[mc])p[2]-=.08;
  return{p,d,e}}
 // ── máquina de estados de las armas: drawn = en la mano · xd = +1 desenfundando / −1 enfundando (xp 0→1) ──
 holster(combat,fight,a,ak,dt){if(!this.hasGear)return;
  const tool=!!(ak&&TOOL[ak]),keep=ak==='eat'&&this.eatL();
  if(tool&&!keep){this.drawn=false;this.xd=0;this.xp=0;return}                       // la herramienta ocupa la mano: el arma se queda en su sitio
  if(fight&&(a.ph||0)>0&&!(this.drawn&&!this.xd)){this.drawn=true;this.xd=0;this.xp=0;return}   // golpe ya en marcha (sin tiempo de sacar): arma en la mano
  if(!this.xd){
   if((ak==='eat'||ak==='pk')&&!fight)return;                                        // comer / recoger: no se cambia lo que lleva en la mano
   if(combat&&!this.drawn){this.xd=1;this.xp=0}else if(!combat&&this.drawn){this.xd=-1;this.xp=0}}
  if(this.xd){this.xp+=dt/((this.xd>0?DRAW_T:SHEATH_T)*(DUR_K[this.cls]||1));if(this.xp>=1){this.drawn=this.xd>0;this.xd=0;this.xp=0}}}
 // ── DESENFUNDAR (s: 0→1) / ENFUNDAR (s: 1→0): mano libre → agarre del arma en su funda (s=SWAP: cambia de sitio) → tirón a lo largo de la hoja → guardia.
 // Se aplica DESPUÉS de resolve (todo en marco del torso). T = guardia destino (para enfundar se calcula con el cuerpo actual); F = mano libre.
 holsterOver(v,s){const T=this.hsT,F=this.hsV,dr=this.xd>0,S=this.stanceOf(this.cls,this.shUse);
  if(dr){T.set(v);F.set(DEF)}else{T.set(S);for(let i=0;i<12;i++)T[i]=v[i];this.aimToTorso(T);F.set(v)}
  const lerp3=(o,a,b,u)=>{for(let j=0;j<3;j++)o[j]=a[j]+(b[j]-a[j])*u},put=(i,x)=>{v[i]=x[0];v[i+1]=x[1];v[i+2]=x[2]};
  const pa=[0,0,0],da=[0,0,0],ea=[0,0,0],pb=[0,0,0],db=[0,0,0],eb=[0,0,0],px=[0,0,0],dx=[0,0,0],ex=[0,0,0];
  const tri=(R,i)=>[F[R+i],F[R+i+1],F[R+i+2]],trT=(R,i)=>[T[R+i],T[R+i+1],T[R+i+2]];
  const used=[0,0],qa=new QT(),qb=new QT();
  // interpolación de marcos (dirección + filo) por cuaternión: la mezcla lineal de direcciones casi opuestas (guardia ↔ funda) se colapsa y la muñeca da un latigazo
  const fsl=(d1,e1,d2,e2,u,od,oe)=>{frameQ(d1[0],d1[1],d1[2],e1[0],e1[1],e1[2],qa);frameQ(d2[0],d2[1],d2[2],e2[0],e2[1],e2[2],qb);qa.slerp(qb,u);
   _v.set(0,1,0).applyQuaternion(qa);od[0]=_v.x;od[1]=_v.y;od[2]=_v.z;_v.set(1,0,0).applyQuaternion(qa);oe[0]=_v.x;oe[1]=_v.y;oe[2]=_v.z};
  const hand=(h,k,cls)=>{const mt=this.mountOf(k);if(!mt)return;used[h]=1;const R=h?C.lp:C.rp,Dd=h?C.ld:C.rd,E=h?C.le:C.re,pull=PULL[cls]||0;
   const fp=tri(R,0),fd=tri(Dd,0),fe=tri(E,0),tp=trT(R,0),td=trT(Dd,0),te=trT(E,0),mp=mt.p,md=mt.d,me=mt.e;
   if(s<SWAP){const u=ss(0,SWAP,s);lerp3(px,fp,mp,u);fsl(fd,fe,md,me,u,dx,ex)}
   else{const u=(s-SWAP)/(1-SWAP),a=ss(0,.5,u),b=ss(.35,1,u);
    for(let j=0;j<3;j++)pa[j]=mp[j]-md[j]*pull*a;lerp3(px,pa,tp,b);fsl(md,me,td,te,ss(.4,1,u),dx,ex)}
   put(R,px);put(Dd,dx);put(E,ex);const P0=h?C.pl:C.pr;v[P0]=lerp(F[P0],T[P0],s);v[P0+1]=lerp(F[P0+1],T[P0+1],s);v[P0+2]=lerp(F[P0+2],T[P0+2],s)};
  const M=this.it.main,O=this.it.off,Sh=this.it.shield;
  if(M)hand(M.hand,'main',M.mc);if(O)hand(1,'off',O.mc);if(Sh&&this.shUse)hand(1,'shield','shield');
  // mano que no saca nada: de libre a su sitio de guardia (cetro, bastón, espada de una mano…)
  if(!used[1]){const u=ss(.5,1,s);for(const R of[C.lp,C.ld,C.le]){const a=tri(R,0),b=trT(R,0);lerp3(px,a,b,u);put(R,px)}
   v[C.pl]=lerp(F[C.pl],T[C.pl],s);v[C.pl+1]=lerp(F[C.pl+1],T[C.pl+1],s);v[C.pl+2]=lerp(F[C.pl+2],T[C.pl+2],s)}
  // dos manos / cuerda / flecha: se incorporan al final
  const e=ss(.62,1,s);v[C.two]=T[C.two]*e;v[C.lh]=T[C.lh];v[C.aux]=T[C.aux]*ss(.8,1,s);v[C.arw]=T[C.arw]*ss(.8,1,s);v[C.draw]=T[C.draw];v[C.glowL]=T[C.glowL]*e}
 // ── objetos: qué va en cada mano, qué se envaina, qué se esconde ──
 items(st){const md=this.mode,tl=md&&TOOL[md]||null,m=this.m,M=this.it.main,Sh=this.it.shield;const want=new Map(),keep=md==='eat'&&this.eatL();
  const sx=this.xd?(this.xd>0?this.xp:1-this.xp):(this.drawn?1:0),inH=sx>=SWAP;   // ¿las armas están ya en la mano?
  if(tl)tl.forEach(n=>{const it=this.tool(n);if(n==='food')it.hand=this.eatL()?1:0;want.set(it,it.hand)});
  if((!tl||keep)&&inH){if(M)want.set(M,M.hand);if(Sh&&this.shUse&&!keep)want.set(Sh,1);if(this.it.off&&!keep)want.set(this.it.off,1)}
  for(const k in this.it){const it=this.it[k],h=want.get(it);
   if(h!=null){if(it.g.parent!==m.grips[h]){m.grips[h].add(it.g);it.g.position.set(0,0,0);it.g.quaternion.identity()}it.g.visible=true}
   else{const mt=(k==='main'||k==='off'||k==='shield')?this.mountOf(k):null;
    if(mt){if(it.g.parent!==m.body)m.body.add(it.g);it.g.position.set(...mt.p);frameQ(...mt.d,...mt.e,it.g.quaternion);it.g.visible=true}else it.g.visible=false}
   if(it.scab){const mt=this.mountOf(k);if(mt){it.scab.position.set(...mt.p);frameQ(...mt.d,...mt.e,it.scab.quaternion);it.scab.visible=true}}}
  this.held=want}
 // ── efectos: cuerdas, flecha/virote, brillos, punta de la caña ──
 fx(v){const M=this.it.main,m=this.m;
  if(M&&M.str&&M.g.visible){const inHand=this.held&&this.held.has(M);let nock;
   if(this.wk==='bow'){nock=M.rest.clone();if(inHand&&v[C.aux]>.9){const hp=this.gripPos(0,new V3());_q.copy(m.arms[1].quaternion).multiply(m.elbows[1].quaternion).multiply(m.grips[1].quaternion);
     nock=hp.sub(this.gripPos(1,new V3())).applyQuaternion(_q.invert());if(nock.z>M.rest.z)nock.copy(M.rest)}}
   else{const y=lerp(M.relY,M.nutY,cl(v[C.aux],0,1));nock=new V3(0,y,.08);
}
   [M.tipA,M.tipB].forEach((tp,j)=>{const s=M.str[j],d=_v.subVectors(nock,tp),L=d.length();s.position.copy(tp);s.scale.set(1,L,1);s.quaternion.setFromUnitVectors(_w.set(0,1,0),d.multiplyScalar(1/L))});
   const show=inHand&&v[C.arw]>.5;M.arrow.visible=show;
   if(show){M.arrow.position.copy(nock);const dir=this.wk==='bow'?_v.set(0,.0,.035).sub(nock).normalize():_v.set(0,1,0);M.arrow.quaternion.setFromUnitVectors(_w.set(0,1,0),dir)}}
  const gL=cl(v[C.glowL],0,2.5),freeL=!(this.held&&[...this.held.values()].includes(1));
  this.orbL.visible=freeL&&gL>.04;if(this.orbL.visible){const s=.4+gL*.55;this.orbL.scale.setScalar(s);this.haloM.opacity=cl(gL*.35,0,.8)}
  if(M&&M.orb){const g=cl(v[C.glow],0,2.5);M.orbMat.color.copy(M.orbBase).multiplyScalar(1+g*.9);M.orb.scale.setScalar(1+g*.3);M.haloM.opacity=cl(g*.32,0,.75)}
  const rod=this.it.rod;if(rod&&rod.g.visible&&rod.tip){rod.g.updateWorldMatrix(true,false);this.rodTip=rod.g.localToWorld(this.tip.copy(rod.tip))}else this.rodTip=null;
  this.track()}
 // ── Lote R3D-SANGRE · PUNTO DE GOLPE ──────────────────────────────────────────────────────────────────────────────────────────────────────
 // Cada fotograma se anota dónde está la PUNTA/CABEZA del arma que golpea (espada, maza, hacha…) o la mano derecha (puños) en coordenadas de mundo three.
 // blood3d.js llama a `strike()` en el momento en que el juego aplica el daño (= IMPACTO de la animación, ph=1) y lee de dónde sale la sangre y hacia
 // dónde iba el arma. La velocidad es el desplazamiento de los últimos ~0,12 s (en el impacto el clip «muerde» y se frena: la media de la ventana
 // conserva la dirección del barrido que acaba de ocurrir). Doble empuñe: la mano que golpea es la que marca `vr` (alterna sola).
 track(){const t=this.t,H=this.sH||(this.sH=[]);let it=this.dual&&this.vr&&this.it.off?this.it.off:this.it.main,k='fist';
  if(it&&it.g.visible&&it.tip&&this.held&&this.held.has(it)){k=it.kind;it.g.updateWorldMatrix(true,false);it.g.localToWorld(_sp.copy(it.tip))}
  else{const g=this.m.grips&&this.m.grips[0];if(!g){H.length=0;return}g.updateWorldMatrix(true,false);g.getWorldPosition(_sp)}
  if(this.sK!==k){H.length=0;this.sK=k}
  H.push({t,x:_sp.x,y:_sp.y,z:_sp.z});while(H.length>14||(H.length>2&&t-H[0].t>.35))H.shift()}
 // → {k: tipo de arma (kind de BUILD: sword, great, dagger, mace, hatchet, greataxe) o 'fist', p: punto mundial, v: velocidad (u/s), sp: módulo} · null si no hay datos
 strike(){const H=this.sH;if(!H||H.length<2)return null;const e=H[H.length-1];let o=H[0];for(const s of H){if(e.t-s.t<=.12){o=s;break}}
  const dt=e.t-o.t;if(dt<.02)return{k:this.sK,p:new V3(e.x,e.y,e.z),v:new V3(),sp:0};
  const v=new V3((e.x-o.x)/dt,(e.y-o.y)/dt,(e.z-o.z)/dt);return{k:this.sK,p:new V3(e.x,e.y,e.z),v,sp:v.length()}}
}
