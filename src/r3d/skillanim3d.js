// NotScape · R3D · ANIMACIONES DE LAS HABILIDADES DEL JUGADOR (Lote N0-HABILIDADES-ANIM, 2 nov 2026; el dueño: «anima el jugador con todas las habilidades haciendo lo que diga la descripción de cada hechizo»).
// Cada habilidad de `CSK` (src/combatskills.js: 48 del kit por arma + 30 de los Caminos) tiene su CLIP de HeroAnim (heroanim3d.js: pose = 56 canales, fotogramas clave Catmull-Rom, manos por IK):
//   `k:'ck'` (acción del héroe) = {id, ph 0..1} → HeroAnim.skillClip(id, S, cls, sh, dualK) → clip sobre u∈[0,1] que TERMINA en la guardia. Un clip por HABILIDAD (tabla SKILLS),
//   construido con una «palabra de movimiento» parametrizada (BUILD: giro, grito, golpe de escudo, ejecución, estocada, ráfaga, patada, meditar, apuntar hacia arriba, lanzar, conjurar…).
// TIEMPOS: `window.SKA[id] = {d, ip, gap}` (ms de la animación, fracción en que cae el golpe, separación entre golpes sucesivos como fracción) lo lee combatskills.js para que el daño caiga
//   en el IMPACTO del clip (antes caía a los 60 ms, sin animación). HABILIDAD NUEVA: una fila en SKILLS (palabra + duración + fracción del impacto + opciones) y, si hace falta, una palabra nueva en BUILD.
// Coordenadas (marco del torso): x− = derecha del héroe, y arriba, z delante; rd = hacia dónde apunta el arma; ángulos en rad (ver las guías de heroanim3d.js).
import * as H from './heroanim3d.js';

const {HeroAnim}=H;
const TAU=Math.PI*2;
export const SKILLS={};   // id → {b, d, ip, o}
const sk=(b,d,ip,o)=>({b,d,ip,o:o||{}});

// ═══════════ utilidades de clip ═══════════
let HX2=null;
function X(){if(HX2)return HX2;const o={};for(const k in H.HX)o[k]=H.HX[k];o.C=H.CH;const P0=H.HX.P;o.P=(b,q)=>{const r={};for(const k in q||{})if(q[k]!==undefined)r[k]=q[k];return P0(b,r)};return HX2=o}
// escala los tiempos de un clip clásico (que acaba con la vuelta a la guardia en t=2) para que su última clave real caiga en `end` y vuelva a la guardia en 1
function fit(c,end){const cut=Math.max(...c.tracks.flatMap(t=>t.keys.map(k=>k.t).filter(t=>t<2)));const f=end/cut;
 return{tracks:c.tracks.map(t=>({i0:t.i0,i1:t.i1,keys:[...t.keys.filter(k=>k.t<=cut).map(k=>Object.assign({},k,{t:k.t*f})),Object.assign({},t.keys[0],{t:1})]}))}}
// concatena clips de pista única (cada uno ya con «fit»): el siguiente empieza donde acaba el anterior sin pasar por la guardia
function cat(parts,ws){const {K}=X(),tot=ws.reduce((a,b)=>a+b,0);let o=0;const ks=[];
 parts.forEach((p,i)=>{const w=ws[i]/tot,keys=p.tracks[0].keys;keys.forEach((k,j)=>{if(i>0&&j===0)return;if(i<parts.length-1&&j===keys.length-1)return;ks.push(Object.assign({},k,{t:o+k.t*w}))});o+=w});
 ks[ks.length-1].t=1;return{tracks:[{i0:0,i1:H.N,keys:ks}]}}
const SHIELD_LP=[.07,.66,.27];

// ═══════════ PALABRAS DE MOVIMIENTO ═══════════
const BUILD={
 // golpe básico del arma (el de siempre, ajustado a u∈[0,1]): v = 'A' | 'B' | 'H'
 atk(S,o,sh){const x=X(),c=o.cls,v=o.v||'A';let cl;
  if(c==='sword')cl=v==='H'?x.thrust(S,sh,1):v==='B'?x.swordB(S,sh):x.swordA(S,sh);else if(c==='dagger')cl=v==='H'?x.thrust(S,sh,1.05):v==='B'?x.daggerB(S,sh):x.daggerA(S,sh);
  else if(c==='great')cl=v==='H'?x.greatH(S):x.greatA(S);else if(c==='fist')cl=v==='H'?x.hook(S,sh):v==='B'&&!sh?x.fistB(S,sh):x.fistA(S,sh);
  else if(c==='bow')cl=x.bowA(S,v==='H');else if(c==='xbow')cl=x.xbowA(S);else if(c==='staff')cl=x.staffA(S,sh,v==='H');else cl=x.scepterA(S,sh,v==='H');
  return fit(cl,o.end||.93)},
 // dos golpes seguidos (A+B)
 twice(S,o,sh){const x=X(),c=o.cls,a=c==='dagger'?x.daggerA(S,false):x.swordA(S,false),b=c==='dagger'?x.daggerB(S,false):x.swordB(S,false);return cat([fit(a,.9),fit(b,.9)],[1,1])},
 // giro de cuerpo entero (Torbellino, Barrido): agacha, se retuerce y gira con el arma extendida a un lado
 spin(S,o,sh){const {K,full,P,ft,nrm,edge,C}=X(),two=o.two?1:0,y0=S[C.yaw],lo=o.low?.35:.8,
  base=(e)=>P(S,Object.assign({two,lh:.16,cx:.06,pr:[-.9,0,.1],pl:[.9,0,.1],rp:[two?-.2:-.3,lo,.28],rd:nrm([-.95,.05,.25]),re:edge([0,1,0],[-.95,.05,.25]),lp:[.3,lo-.05,.2],ld:nrm([.9,.1,.3])},e));
  const wind=base({two:0,py:-.12,yaw:y0-.55,cy:-.55,cx:.12,rp:[-.38,.86,-.2],rd:nrm([-.5,.05,-.85]),fl:ft(S,C.fl,[,,.0]),fr:ft(S,C.fr,[,,.0])});
  const a1=base({py:-.04,yaw:y0+TAU*.4,fl:ft(S,C.fl,[,,.06]),fr:ft(S,C.fr,[,,.06])}),a2=base({py:-.03,yaw:y0+TAU*.8,fl:ft(S,C.fl,[,,.06]),fr:ft(S,C.fr,[,,.06])}),a3=base({py:-.07,yaw:y0+TAU,cx:.14,rp:[-.2,lo,.3],fl:ft(S,C.fl,[,,.01]),fr:ft(S,C.fr,[,,.01])});
  const hy=q=>{q[C.hy]=.8*(q[C.yaw]-y0);return q};   // la cabeza compensa el 80 % del giro de la pelvis: aquí gira CON el cuerpo
  const lift=P(S,{py:-.06,rp:[-.22,.9,.1],rd:nrm([-.15,1,.1]),two:0,lp:[.2,.7,.12]});
  return full([K(0,S),K(.1,hy(lift)),K(.24,hy(wind)),K(.46,hy(a1),'l'),K(.65,hy(a2),'l'),K(.8,hy(a3),'o2'),K(1,hy(P(S,{yaw:y0+TAU})))])},
 // grito / furia / provocar: se encoge, se yergue echando la cabeza atrás con la boca abierta y el arma en alto, y la clava en el suelo de un pisotón
 roar(S,o,sh){const {K,full,P,ft,nrm,C}=X(),two=o.two?1:0,ex=o.pt;
  const k1=P(S,{py:-.12,cx:.25,hx:.1,two:0,lh:.14,rp:[-.2,.55,.15],rd:nrm([.1,.6,.8]),lp:[.18,.8,.16],ld:nrm([0,1,.3])});
  const k2=P(S,{py:.0,cx:-.22,hx:-.3,mouth:1,two:0,lh:.14,fl:ft(S,C.fl,[.16]),fr:ft(S,C.fr,[-.16]),rp:[-.32,1.0,.14],rd:nrm([-.25,1,.12]),re:[1,0,0],lp:[.28,1.0,.14],ld:nrm([.1,1,.2]),pr:[-.8,.3,.3],pl:[.8,.3,.3]});
  const k3=P(k2,{cx:-.26,hx:-.34,py:.01});
  const k4=P(S,{py:-.14,cx:.34,hx:.12,pz:.06,two:0,lh:.14,fl:ft(S,C.fl,[,S[C.fl+1]+.06,.05]),rp:[-.2,.5,.34],rd:nrm([.1,-.4,.9]),lp:[.1,.62,.18],pr:[-.5,-.8,0]});
  const hl=o.hold?[K(.62,k3,'l')]:[];
  return full([K(0,S),K(.22,k1),K(.42,k2,'o2'),...hl,K(.7,k3,'l'),K(.8,k4,'i3'),K(.9,P(k4,{py:-.12})),K(1,S)])},
 // golpe de escudo / codazo (Golpe aturdidor, Embestida de escudo): se retuerce y empuja con el brazo izquierdo mientras el arma se aparta
 bash(S,o,sh){const {K,full,P,ft,nrm,C}=X();
  const k1=P(S,{py:-.1,cy:-.45,cx:.12,rp:[-.26,.62,.04],lp:[.32,.7,.1],pl:[.9,-.4,-.2]});
  const k2=P(S,{py:-.11,pz:.14,cy:.55,cx:.26,fl:ft(S,C.fl,[,S[C.fl+1]+.14,.0]),fr:ft(S,C.fr,[,,,.4]),rp:[-.26,.6,.06],lp:[.14,.76,.3],pl:[.9,-.3,-.1],pr:[-.6,-.5,-.3]});
  return full([K(0,S),K(.34,k1),K(.62,k2,'i2'),K(.76,P(k2,{pz:.12}),'o2'),K(.9,P(S,{py:-.05})),K(1,S)])},
 // embestida a dos manos (Embestida del mandoble): el arma cruzada al frente a la altura de la cadera y el hombro por delante
 charge(S,o,sh){const {K,full,P,nrm,ft,edge,C}=X();
  const k1=P(S,{py:-.12,cx:.2,cy:-.3,two:1,lh:.18,rp:[-.04,.6,.26],rd:nrm([-.9,.12,.25]),re:edge([0,1,0],[-.9,.12,.25]),lp:[.14,.64,.14],pr:[-.7,-.4,-.2]});
  const k2=P(S,{py:-.14,pz:.18,cx:.34,cy:.25,two:1,lh:.18,fl:ft(S,C.fl,[,S[C.fl+1]+.2,0]),fr:ft(S,C.fr,[,-.1,.06,.3]),rp:[-.02,.62,.3],rd:nrm([-.95,.1,.3]),re:edge([0,1,0],[-.95,.1,.3]),pr:[-.5,-.5,0]});
  return full([K(0,S),K(.3,k1),K(.52,k2,'i3'),K(.7,P(k2,{pz:.2}),'o2'),K(.88,P(S,{py:-.06})),K(1,S)])},
 // ejecución (Ejecución, Decapitar a dos manos, Guillotina): sube el arma, SE QUEDA arriba un instante y la hunde con todo el cuerpo
 chop(S,o,sh){const {K,full,P,ft,nrm,edge,C}=X(),two=o.two?1:0,ax=[1,0,0];
  const k1=P(S,{py:-.12,cx:.14,two,rp:[-.05,.6,.24],rd:nrm([0,.5,.86])});
  const k2=P(S,{py:.0,cx:-.18,hx:-.12,two:0,lh:.16,fl:ft(S,C.fl,[,,.02]),rp:[-.28,1.02,.06],rd:nrm([0,1,-.12]),re:edge(ax,[0,1,-.12]),lp:[.2,.92,.05],pr:[-.8,.3,.4],pl:[.7,.3,.3]});
  const k3=P(k2,{cx:-.22,hx:-.16,py:.01});
  const k4=P(S,{py:-.16,pz:.1,cx:.4,hx:.1,two,lh:.16,fl:ft(S,C.fl,[,S[C.fl+1]+.12,0]),fr:ft(S,C.fr,[,,,.3]),rp:[-.04,.52,.28],rd:nrm([.05,-.6,.8]),re:edge(ax,[.05,-.6,.8]),lp:[.14,.62,.22],pr:[-.5,-.8,0],pl:[.5,-.8,0]});
  return full([K(0,S),K(.25,k1),K(.45,k2,'o2'),K(.58,k3,'l'),K(.74,k4,'i2'),K(.88,P(k4,{py:-.15,cx:.42}),'o2'),K(1,S)])},
 // tajo horizontal a todo el cuerpo con pausa final (Decapitar, Quebrantar): de atrás a delante en un solo arco
 sweep(S,o,sh){const {K,full,P,ft,nrm,edge,C}=X(),two=o.two?1:0,ax=[0,1,0];
  const k1=P(S,{py:-.12,yaw:S[C.yaw]-.5,cy:-.7,cx:.12,two:0,lh:.16,rp:[-.36,.84,-.18],rd:nrm([-.65,.1,-.75]),re:edge(ax,[-.65,.1,-.75]),lp:[.18,.8,.0],pr:[-.9,0,.3]});
  const k2=P(S,{py:-.1,yaw:S[C.yaw]+.1,cy:.1,cx:.2,two:0,lh:.16,rp:[-.2,.82,.26],rd:nrm([-.2,.05,1]),re:edge(ax,[-.2,.05,1]),lp:[.14,.8,.2],pr:[-.7,0,0]});
  const k3=P(S,{py:-.13,pz:.1,yaw:S[C.yaw]+.5,cy:.7,cx:.3,fl:ft(S,C.fl,[,S[C.fl+1]+.1,0]),two,lh:-.16,rp:[-.04,.8,.3],rd:nrm([.9,.05,.4]),re:edge(ax,[.9,.05,.4]),lp:[.14,.78,.2],pr:[-.5,-.2,0]});
  const lift=P(S,{py:-.06,two:0,rp:[-.22,.9,.1],rd:nrm([-.15,1,.1]),lp:[.2,.7,.12]});
  return full([K(0,S),K(.12,lift),K(.34,k1),K(.54,k2,'i2'),K(.68,k3,'i3'),K(.84,P(k3,{cy:.75,yaw:S[C.yaw]+.55}),'o2'),K(1,S)])},
 // estocada a fondo agachado (Estocada letal, Marca de muerte, Tajo de sombra) con giro de muñeca al final: rip=1 → desgarra hacia arriba (Hemorragia)
 stab(S,o,sh){const {K,full,P,ft,nrm,C}=X();
  const k1=P(S,{py:-.17,pz:-.04,cx:.3,cy:-.5,yaw:S[C.yaw]-.2,rp:[-.24,.52,-.02],rd:nrm([.05,.1,1]),lp:[.2,.62,.26]});
  const k2=P(S,{py:-.19,pz:.16,cx:.36,cy:.4,yaw:S[C.yaw]-.1,fl:ft(S,C.fl,[,S[C.fl+1]+.18,0]),fr:ft(S,C.fr,[,,,.5]),rp:[-.1,.58,.4],rd:nrm([.04,.05,1]),lp:[.24,.62,-.06],pr:[-.6,-.5,-.2]});
  const rip=o.rip?P(k2,{cx:.28,rp:[-.12,.82,.3],rd:nrm([.1,.8,.55]),pz:.14}):P(k2,{rp:[-.1,.6,.36]});
  return full([K(0,S),K(.38,k1),K(.56,k2,'i3'),K(.7,rip,'o2'),K(.86,P(rip,{py:-.1})),K(1,S)])},
 // ráfaga de golpes alternos con cada mano (Danza de dagas n=4, Ráfaga n=4, Mil puños n=8): cuerpo que se mece de un lado a otro
 flurry(S,o,sh){const {K,full,P,ft,nrm,edge,C}=X(),n=o.n||4,c=o.cls,dg=c==='dagger',ks=[K(0,S)];const t0=.16,t1=.84;
  for(let i=0;i<n;i++){const t=t0+(t1-t0)*(i+.5)/n,r=i%2===0,s=r?1:-1;
   const R=dg?{rd:nrm([-.5*s,.1,.86]),re:edge([0,1,0],[-.5*s,.1,.86])}:{};
   ks.push(K(t-.62*(t1-t0)/n,P(S,{py:-.08,cy:-.3*s,yaw:S[C.yaw]-.25*s*0,cx:.18,rp:r?[-.2,.7,.05]:[-.1,.88,.1],lp:r?[.08,.88,.1]:[.2,.7,.05]})));
   ks.push(K(t,P(S,Object.assign({py:-.09,pz:.07,cy:.42*s,cx:.24,fl:ft(S,C.fl,[,S[C.fl+1]+.05,r?0:.03]),fr:ft(S,C.fr,[,,r?.04:0]),rp:r?[-.07,.86,.34]:[-.12,.84,.1],lp:r?[.08,.86,.1]:[.09,.88,.34],pl:[.6,-.5,-.2]},R)),'io'))}
  ks.push(K(1,S));return full(ks)},
 // patada baja: carga el peso en la pierna de atrás y barre con la delantera a ras de suelo
 kick(S,o,sh){const {K,full,P,ft,C}=X();
  const k1=P(S,{py:-.08,cx:-.12,cy:-.4,yaw:S[C.yaw]-.2,fr:[-.11,-.3,.05,.3,-.5],rp:[-.2,.9,.05],lp:[.1,.86,.14]});
  const k2=P(S,{py:-.04,pz:.05,cx:-.16,cy:.5,yaw:S[C.yaw]+.15,fr:[-.1,.36,.12,-.35,-.25],rp:[-.17,.74,.2],lp:[.17,.84,.04],pl:[.7,-.4,-.3]});
  return full([K(0,S),K(.3,k1),K(.52,k2,'i3'),K(.68,P(k2,{fr:[-.1,.34,.1,-.3,-.25]}),'o2'),K(.88,P(S,{py:-.05})),K(1,S)])},
 // meditar / postura: agachado, manos juntas, cabeza baja, respirando (los buffs de calma)
 meditate(S,o,sh){const {K,full,P,ft,nrm,C}=X();
  const k1=P(S,{py:-.2,cx:.18,hx:.28,fl:[.15,.05,0,0,.3],fr:[-.15,.05,0,0,-.3],rp:[-.05,.74,.24],rd:[0,1,0],lp:[.05,.74,.24],ld:[0,1,0],pr:[-.7,-.6,-.2],pl:[.7,-.6,-.2]});
  const k2=P(k1,{py:-.22,cx:.22,hx:.34,rp:[-.04,.72,.26],lp:[.04,.72,.26]}),k3=P(S,{py:-.04,cx:-.12,hx:-.12,rp:[-.36,.78,.12],rd:nrm([-.9,.3,.2]),lp:[.36,.78,.12],ld:nrm([.9,.3,.2]),fl:[.15,.05,0,0,.3],fr:[-.15,.05,0,0,-.3],pr:[-.9,0,.1],pl:[.9,0,.1]});
  return full([K(0,S),K(.22,k1),K(.5,k2),K(.7,k3,'o2'),K(.86,P(k3,{hx:-.14})),K(1,S)])},
 // palma abierta: giro y empuje con la mano derecha plana (Palma, Palma de trueno); big = lanza el cuerpo
 palm(S,o,sh){const {K,full,P,ft,nrm,C}=X(),b=o.big?.06:0;
  const k1=P(S,{py:-.12,cy:-.55,cx:.1,rp:[-.2,.7,.0],rd:nrm([0,.5,.86]),lp:[.15,.84,.14],glow:o.glow?.8:0});
  const k2=P(S,{py:-.12,pz:.13+b,cy:.6,cx:.24,fl:ft(S,C.fl,[,S[C.fl+1]+.14,0]),fr:ft(S,C.fr,[,,,.45]),rp:[-.07,.88,.44],rd:nrm([0,.9,.4]),lp:[.2,.76,.02],pr:[-.4,-.6,-.2],glow:o.glow?1.8:0});
  return full([K(0,S),K(.34,k1),K(.55,k2,'i3'),K(.72,P(k2,{rp:[-.07,.88,.4],glow:o.glow?.9:0}),'o2'),K(.9,P(S,{py:-.06})),K(1,S)])},
 // salto con gancho ascendente (Golpe del dragón): acumula en cuclillas y salta con el puño por delante y hacia arriba
 uppercut(S,o,sh){const {K,full,P,ft,C}=X();
  const k1=P(S,{py:-.22,cy:-.6,cx:.3,hx:.1,rp:[-.16,.36,.0],lp:[.1,.9,.14],fl:[.14,.1,0,0,.3],fr:[-.12,-.1,0,0,-.4]});
  const k2=P(S,{py:.1,pz:.12,cy:.5,cx:-.12,hx:-.1,fl:[.13,.2,.16,.2,.2],fr:[-.1,.04,.12,.3,-.3],rp:[-.1,1.16,.32],rd:[0,1,0],lp:[.08,.86,.1],pr:[-.5,.5,-.1]});
  return full([K(0,S),K(.4,k1),K(.62,k2,'i2'),K(.76,P(k2,{py:.12}),'o2'),K(.9,P(S,{py:-.1,cx:.15}),'i2'),K(1,S)])},
 // ponerse en guardia reforzado (Postura del tigre, Muro inamovible): piernas muy abiertas, agachado, y se balancea
 stance(S,o,sh){const {K,full,P,ft,nrm,C}=X(),sg=!!o.shield;
  const k1=P(S,{py:-.2,cx:.28,hx:.08,fl:[.2,.05,0,0,.5],fr:[-.2,.05,0,0,-.5],rp:[-.22,.72,.3],rd:o.guard?nrm([.2,.7,.7]):nrm([0,.4,.9]),lp:[.22,.72,.3],pr:[-.8,-.3,-.3],pl:[.8,-.3,-.3]});
  const k2=P(k1,{py:-.22,cx:.32,cy:.12}),k3=P(k1,{py:-.19,cy:-.12});
  return full([K(0,S),K(.28,k1,'o2'),K(.52,k2),K(.74,k3),K(.9,P(S,{py:-.08})),K(1,S)])},
 // plantar y cubrirse (Muro): las piernas firmes y el escudo/arma cruzados ante el pecho
 brace(S,o,sh){const {K,full,P,nrm}=X();
  const k1=P(S,{py:-.15,cx:.2,fl:[.19,.08,0,0,.4],fr:[-.19,-.06,0,0,-.4],rp:[-.07,.84,.31],rd:nrm([.96,.28,.1]),re:[0,0,1],lp:[.0,.8,.37],ld:nrm([0,.95,.12]),le:[1,0,0],pl:[.9,-.25,.1],pr:[-.8,-.2,-.3]});
  const k2=P(k1,{py:-.17,lp:[.0,.82,.4]});
  return full([K(0,S),K(.3,k1,'o2'),K(.6,k2),K(.8,k1),K(.92,P(S,{py:-.06})),K(1,S)])},
 // señalar y marcar (Marca de muerte, Marca de presa): apunta con el arma y traza dos cortes en X
 mark(S,o,sh){const {K,full,P,nrm,edge,C}=X();
  const k1=P(S,{py:-.06,cy:-.3,cx:.08,rp:[-.14,.78,.3],rd:nrm([0,.1,1]),lp:[.18,.66,.1]});
  const k2=P(S,{py:-.08,cy:.1,cx:.12,rp:[-.3,.98,.22],rd:nrm([.3,.5,.8]),re:edge([0,0,1],[.3,.5,.8])});
  const k3=P(S,{py:-.1,pz:.06,cy:.3,cx:.2,rp:[-.05,.6,.34],rd:nrm([-.4,-.3,.85])});
  const k4=P(S,{py:-.1,pz:.05,cy:-.1,cx:.2,rp:[-.3,.62,.3],rd:nrm([.4,-.3,.85])});
  return full([K(0,S),K(.22,k1),K(.42,k2),K(.56,k3,'i3'),K(.66,P(k3,{}),'l'),K(.78,k4,'i3'),K(.9,P(k4,{py:-.06})),K(1,S)])},
 // paso ligero (Paso ligero, Disparo ágil, Paso sombrío): se lanza adelante con un paso largo y vuelve en cuclillas veloz (la estocada va en `then`)
 dashstep(S,o,sh){const {K,full,P,ft,nrm,C}=X();
  const k1=P(S,{py:-.14,cx:.3,cy:-.3,fl:ft(S,C.fl,[,,.0]),rp:[-.2,.6,.05],rd:nrm([.05,.15,1]),lp:[.18,.7,.14]});
  const k2=P(S,{py:-.12,pz:.2,cx:.34,cy:.2,fl:ft(S,C.fl,[,S[C.fl+1]+.22,.0]),fr:ft(S,C.fr,[,-.22,.12,.4]),rp:[-.14,.64,.35],rd:nrm([.05,.1,1]),lp:[.18,.7,-.08]});
  return full([K(0,S),K(.3,k1),K(.5,k2,'i3'),K(.7,P(S,{py:-.12,cx:.2,pz:.1}),'o2'),K(.9,P(S,{py:-.06})),K(1,S)])},

 // ═══ DISTANCIA ═══
 // disparo con variantes: aim = 'high' (lluvia: hacia el cielo), 'low' (al suelo), 'long' (apunta y sostiene), kneel = rodilla en tierra; n = disparos seguidos
 shoot(S,o,sh){const x=X(),{K,full,P,nrm,ft,C}=x,c=o.cls,a=c==='xbow'?x.xbowA(S).tracks[0].keys:x.bowA(S,!!o.heavy).tracks[0].keys;
  const mod=(v)=>{let q=v;if(o.aim==='high')q=P(v,{cx:-.14,hx:-.28,py:-.02,ld:nrm([.1,.85,-.35]),rd:c==='xbow'?nrm([0,.8,.6]):v.slice(C.rd,C.rd+3)});
   if(o.aim==='low')q=P(v,{cx:.18,hx:.2,rd:c==='xbow'?nrm([0,-.7,.7]):v.slice(C.rd,C.rd+3),lp:c==='xbow'?undefined:[.08,.62,.46],ld:c==='xbow'?undefined:nrm([.12,.7,.4]),rp:c==='xbow'?[-.06,.7,.12]:[.07,.72,.07]});
   if(o.kneel&&c!=='xbow')q=P(q,{py:-.14,fl:[.1,.14,0,.0,.1],fr:[-.1,-.16,-.04,.4,-1.0]});if(o.lean)q=P(q,{py:-.08,pz:-.03});return q};
  const rel=c==='xbow'?[a[4],a[5],a[6],a[7]]:[a[6],a[7]],fire=c==='xbow'?[a[1],a[2],a[3],a[4]]:[a[1],a[2],a[3],a[4]],n=o.n||1;
  const ks=[K(0,S)];let t=.14;const span=o.span||.62,per=span/n;
  for(let i=0;i<n;i++){const t0=.12+i*per,hold=o.hold||.4;
   ks.push(K(t0+per*.28,mod(c==='xbow'?a[1].v:a[1].v)),K(t0+per*(.28+hold*.5),mod(a[2].v),'l'),K(t0+per*(.28+hold),mod(c==='xbow'?a[3].v:a[3].v),'o2'));
   if(c!=='xbow')ks.push(K(t0+per*(.3+hold+.04),mod(a[4].v),'o2'));if(i<n-1&&c!=='xbow')ks.push(K(t0+per*.94,P(mod(a[1].v),{draw:.7}),'l'))}
  ks.push(K(.84,mod(P(S,{aux:1,arw:1,draw:.1,py:-.05})),'o2'),K(1,S));ks.sort((p,q)=>p.t-q.t);for(let i=1;i<ks.length;i++)if(ks[i].t<=ks[i-1].t)ks[i].t=ks[i-1].t+.004;ks[ks.length-1].t=1;return full(ks)},
 // saludo al cielo con el arma (Ojo de halcón): levanta el arco en alto, mira arriba y se concentra
 focus(S,o,sh){const x=X(),{K,full,P,nrm}=x,a=x.bowA(S).tracks[0].keys;
  const hi=P(a[1].v,{cx:-.12,hx:-.3,py:-.03,glow:.8}),hi2=P(hi,{hx:-.34,glow:1.2});
  return full([K(0,S),K(.3,hi,'o2'),K(.62,hi2),K(.82,P(S,{py:-.04,hx:.06})),K(1,S)])},
 // recargar a toda prisa (Recarga rápida): arma y arma otra vez con las manos aceleradas
 reload(S,o,sh){const x=X(),{K,full,P,nrm}=x,a=x.xbowA(S).tracks[0].keys;
  const r1=a[6].v,r0=a[5].v;return full([K(0,S),K(.16,r0),K(.32,r1),K(.46,r0),K(.62,r1),K(.74,a[7].v),K(.88,P(S,{cx:-.1,hx:-.1})),K(1,S)])},

 // ═══ MAGIA ═══
 // conjuro básico (Orbe, Bola de fuego): el de siempre del arma
 cast(S,o,sh){return BUILD.atk(S,Object.assign({v:o.heavy?'H':'A'},o),sh)},
 // barrido de escarcha: la mano libre arrastra el frío por delante mientras el báculo apunta
 sweepFrost(S,o,sh){const {K,full,P,nrm,ft,C}=X();
  const k1=P(S,{py:-.06,cx:-.06,cy:-.4,hx:.06,rp:[-.2,.7,.15],rd:nrm([0,.9,.3]),lp:[.34,.74,.06],glowL:1.1,glow:.5});
  const k2=P(S,{py:-.08,pz:.06,cx:.16,cy:.3,fl:ft(S,C.fl,[,S[C.fl+1]+.1,.02]),rp:[-.16,.76,.28],rd:nrm([0,.5,.86]),lp:[.14,.8,.46],glowL:1.9,glow:1.2,pl:[.7,-.3,-.3]});
  return full([K(0,S),K(.3,k1),K(.56,k2,'i2'),K(.74,P(k2,{lp:[.28,.78,.4],glowL:1.2}),'o2'),K(.9,P(S,{py:-.04})),K(1,S)])},
 // clavar y explotar (Nova, Abismo): alza el arma a dos manos y la clava en el suelo: la onda sale del golpe
 slam(S,o,sh){const {K,full,P,nrm,ft,C}=X(),g=o.g||1;
  const k1=P(S,{py:-.03,cx:-.2,hx:-.28,rp:[-.2,1.02,.05],rd:nrm([0,1,-.1]),lp:[.2,1.0,.06],glowL:.8*g,glow:.6*g,pr:[-.8,.3,.3],pl:[.8,.3,.3]});
  const k2=P(S,{py:-.16,pz:.08,cx:.38,hx:.1,fl:ft(S,C.fl,[,S[C.fl+1]+.1,0]),fr:ft(S,C.fr,[,,,.3]),rp:[-.1,.46,.32],rd:nrm([0,-1,.35]),re:[1,0,0],lp:[.14,.5,.26],glowL:2.2*g,glow:2*g,pr:[-.5,-.8,0],pl:[.5,-.8,0]});
  const mid=P(S,{py:-.08,cx:.14,hx:-.1,rp:[-.12,.8,.38],rd:nrm([0,.3,1]),re:[1,0,0],lp:[.12,.82,.34],glowL:1.6*g,glow:1.5*g});
  return full([K(0,S),K(.36,k1,'o2'),K(.5,P(k1,{glowL:1.2*g,glow:1.1*g,hx:-.32}),'l'),K(.62,mid,'i2'),K(.76,k2,'i2'),K(.86,P(k2,{glowL:.8,glow:.8}),'l'),K(.94,P(mid,{glowL:.6,glow:.6}),'o2'),K(1,S)])},
 // ventana de protección (Barrera de maná, Muro de sombras): se echa atrás y empuja la palma hacia delante creando el escudo
 ward(S,o,sh){const {K,full,P,nrm,ft,C}=X();
  const k1=P(S,{py:-.06,cx:-.06,rp:[-.22,.7,.14],rd:nrm([0,1,.1]),lp:[.1,.84,.1],glowL:.9,glow:.4});
  const k2=P(S,{py:-.08,cx:.1,fl:ft(S,C.fl,[,S[C.fl+1]+.05,0]),lp:[.12,.9,.46],ld:nrm([0,.2,1]),glowL:2,glow:1.2,pl:[.8,-.2,-.3]});
  return full([K(0,S),K(.26,k1),K(.46,k2,'o2'),K(.7,P(k2,{glowL:2.3,lp:[.12,.9,.48]}),'l'),K(.88,P(S,{py:-.04})),K(1,S)])},
 // invocar (Rayo, Relámpago, Descarga, Meteoro, Tormenta): alza el arma al cielo con la cabeza atrás, sostiene cargando y la descarga hacia delante; sky = brazos abiertos; hop = salta
 summon(S,o,sh){const {K,full,P,nrm,ft,C}=X(),g=o.g||1,big=!!o.sky;
  const k1=P(S,{py:big?.02:-.02,cx:-.22,hx:-.34,rp:[-.2,1.1,.0],rd:nrm([0,1,-.15]),lp:big?[.22,1.08,.0]:[.2,.78,.06],ld:nrm([0,1,0]),glowL:1*g,glow:.9*g,fl:big?ft(S,C.fl,[.14]):undefined,fr:big?ft(S,C.fr,[-.14]):undefined,pr:[-.8,.4,.3],pl:[.8,.4,.3]});
  const k2=P(k1,{py:big?.1:.0,glowL:1.8*g,glow:1.8*g,hx:-.38,cx:-.26,fl:big?ft(S,C.fl,[.14,,.1]):undefined,fr:big?ft(S,C.fr,[-.14,,.1]):undefined});
  const k3=P(S,{py:-.12,pz:.1,cx:.34,hx:.08,fl:ft(S,C.fl,[,S[C.fl+1]+.12,0]),fr:ft(S,C.fr,[,,,.3]),rp:[-.1,.78,.38],rd:nrm([0,-.15,1]),lp:[.1,.84,.34],glowL:2.4*g,glow:2.4*g,pl:[.6,-.5,-.3]});
  return full([K(0,S),K(.3,k1,'o2'),K(o.long?.6:.5,k2,'l'),K(o.long?.74:.66,k3,'i3'),K(.88,P(k3,{glowL:.6,glow:.8}),'o2'),K(1,S)])},
 // anillo a su alrededor (Muro de llamas, Nube tóxica): el arma traza un círculo bajo mientras gira sobre sí
 ring(S,o,sh){return BUILD.spin(S,Object.assign({low:1},o),sh)},
 // brazos abiertos barriendo el frío (Ventisca): ambos brazos describen arcos amplios y empuja hacia delante
 blizzard(S,o,sh){const {K,full,P,nrm,ft,C}=X();
  const a=P(S,{py:-.04,cx:-.08,hx:-.1,rp:[-.34,.9,.14],rd:nrm([-.5,.4,.75]),lp:[.34,.9,.14],ld:nrm([.5,.4,.75]),glowL:1.2,glow:.9,pr:[-.9,0,.1],pl:[.9,0,.1]});
  const b=P(S,{py:-.04,cx:-.05,hx:-.1,rp:[-.3,.5,.12],rd:nrm([-.5,.2,.6]),lp:[.3,.5,.12],ld:nrm([.5,.2,.6]),glowL:1.8,glow:1.4,pr:[-.9,-.4,.1],pl:[.9,-.4,.1]});
  const c=P(S,{py:-.1,pz:.1,cx:.26,fl:ft(S,C.fl,[,S[C.fl+1]+.1,0]),rp:[-.12,.8,.42],rd:nrm([0,.2,1]),lp:[.1,.84,.4],glowL:2.4,glow:2,pl:[.6,-.4,-.3]});
  return full([K(0,S),K(.2,b),K(.4,a,'o2'),K(.55,b),K(.7,a),K(.84,c,'i3'),K(.94,P(c,{glowL:1})),K(1,S)])},
 // cerrar el puño (Prisión de hielo, Marchitar, Condena): extiende la mano abierta hacia el objetivo y la cierra de golpe tirando hacia sí
 clamp(S,o,sh){const {K,full,P,nrm,ft,C}=X(),g=o.g||1;
  const k1=P(S,{py:-.05,cx:.08,rp:[-.18,.78,.24],rd:nrm([0,.6,.8]),lp:[.12,.84,.46],ld:nrm([0,.2,1]),glowL:1.2*g,glow:.8*g,pl:[.7,-.3,-.3]});
  const k2=P(k1,{lp:[.13,.86,.5],glowL:1.9*g,glow:1.2*g}),k3=P(S,{py:-.1,cx:.22,hx:.1,rp:[-.14,.7,.22],rd:nrm([0,.5,.85]),lp:[.09,.72,.14],ld:nrm([0,.6,.8]),glowL:2.6*g,glow:2*g,pl:[.5,-.6,-.2]});
  const dn=o.slam?[K(.82,P(k3,{py:-.15,cx:.4,rp:[-.1,.44,.34],rd:nrm([0,-1,.4]),re:[1,0,0]}),'i2')]:[];
  return full([K(0,S),K(.28,k1),K(.5,k2,'l'),K(.62,k3,'i3'),...dn,K(.9,P(k3,{glowL:.8,glow:.8})),K(1,S)])},
 // absorber hacia sí (Drenar vida): el cetro apunta y la mano libre tira de lo absorbido hasta el pecho
 drain(S,o,sh){const {K,full,P,nrm,ft,C}=X();
  const k1=P(S,{py:-.06,pz:.04,cx:.1,rp:[-.14,.8,.4],rd:nrm([0,.2,1]),lp:[.14,.8,.4],ld:nrm([0,.2,1]),glowL:1.4,glow:1.2});
  const k2=P(S,{py:-.08,cx:.26,hx:.06,rp:[-.1,.74,.2],rd:nrm([0,.7,.7]),lp:[.07,.74,.16],ld:nrm([0,.8,.4]),glowL:2,glow:1.6}),k3=P(k1,{lp:[.14,.8,.42],glowL:2}),k4=P(k2,{py:-.1,cx:.3});
  return full([K(0,S),K(.2,k1,'o2'),K(.4,k2),K(.5,k3),K(.7,k4),K(.88,P(S,{cx:.04})),K(1,S)])},
 // arrancar almas (Cadena de almas, Cosecha de almas): la mano libre sube con los dedos engarfiados mientras el cetro asciende
 souls(S,o,sh){const {K,full,P,nrm,ft,C}=X();
  const k1=P(S,{py:-.1,cx:.2,hx:.15,rp:[-.18,.62,.2],rd:nrm([0,.6,.8]),lp:[.14,.5,.4],ld:nrm([0,.3,1]),glowL:1,glow:.8});
  const k2=P(S,{py:-.02,cx:-.2,hx:-.3,rp:[-.22,1.02,.1],rd:nrm([0,1,-.1]),lp:[.18,1.04,.26],ld:nrm([0,1,.2]),glowL:2.2,glow:2,fl:ft(S,C.fl,[.14]),fr:ft(S,C.fr,[-.14]),pr:[-.8,.4,.3],pl:[.8,.4,.3]});
  return full([K(0,S),K(.28,k1,'o2'),K(.55,k2,'i2'),K(.7,P(k2,{glowL:2.6,glow:2.4}),'l'),K(.88,P(S,{py:-.04,hx:.04}),'o2'),K(1,S)])},
 // tocar (Toque fúnebre): estira la mano libre hacia el objetivo, lo roza y la retira
 touch(S,o,sh){const {K,full,P,nrm,ft,C}=X();
  const k1=P(S,{py:-.08,cx:.14,cy:-.3,lp:[.2,.72,.1],rp:[-.2,.7,.12],rd:nrm([0,.8,.5]),glowL:.8});
  const k2=P(S,{py:-.1,pz:.1,cx:.26,cy:.2,fl:ft(S,C.fl,[,S[C.fl+1]+.1,0]),lp:[.1,.86,.5],ld:nrm([0,.1,1]),glowL:2,glow:1.2,pl:[.7,-.3,-.3]});
  return full([K(0,S),K(.3,k1),K(.5,k2,'i3'),K(.66,P(k2,{lp:[.1,.86,.52]}),'l'),K(.86,P(S,{py:-.04}),'o2'),K(1,S)])},
 // lanzar (Lanza de hielo, Bola de fuego): brazo atrás, se arquea y proyecta hacia delante con todo el cuerpo
 heave(S,o,sh){const {K,full,P,nrm,ft,C}=X(),g=o.g||1;
  const k1=P(S,{py:-.08,cx:-.14,cy:-.55,yaw:S[C.yaw]-.2,rp:[-.28,.96,-.18],rd:nrm([-.2,.7,-.7]),lp:[.18,.78,.3],ld:nrm([0,.6,.8]),glowL:1.4*g,glow:1.1*g,pr:[-.8,.3,.5]});
  const k2=P(S,{py:-.12,pz:.12,cx:.34,cy:.5,fl:ft(S,C.fl,[,S[C.fl+1]+.14,0]),fr:ft(S,C.fr,[,,,.4]),rp:[-.1,.74,.46],rd:nrm([0,.1,1]),lp:[.24,.7,.0],glowL:2*g,glow:2.2*g,pr:[-.6,-.5,-.3]});
  return full([K(0,S),K(.34,k1,'o2'),K(.46,P(k1,{cx:-.18}),'l'),K(.58,k2,'i2'),K(.74,P(k2,{glowL:.8,glow:.9}),'o2'),K(.9,P(S,{py:-.05})),K(1,S)])}
};

// ═══════════ TABLA: una fila por habilidad ═══════════
// sk(palabra, duración ms, fracción del impacto, opciones); `n`/`gap` de la ráfaga = golpes sucesivos separados `gap` (fracción de la duración)
Object.assign(SKILLS,{
 // ESPADA
 sw_tajo:sk('atk',700,.71,{v:'A'}),sw_corte:sk('atk',760,.71,{v:'B'}),sw_giro:sk('spin',1000,.6),sw_grito:sk('roar',1150,.8),sw_aturde:sk('bash',850,.62),sw_ejec:sk('chop',1100,.74),
 // ARCO
 bw_certero:sk('shoot',1100,.45,{}),bw_veneno:sk('shoot',1200,.5,{}),bw_lluvia:sk('shoot',1700,.4,{n:3,aim:'high',hold:.1,span:.75}),bw_halcon:sk('focus',1200,.7),bw_escarcha:sk('shoot',1250,.5,{hold:.55}),bw_mortal:sk('shoot',1700,.52,{heavy:1,hold:.7,lean:1,kneel:1}),
 // BÁCULO
 st_orbe:sk('cast',950,.66),st_escarcha:sk('sweepFrost',900,.56),st_nova:sk('slam',1150,.76),st_barrera:sk('ward',950,.5),st_rayo:sk('summon',1100,.66),st_meteoro:sk('summon',1500,.66,{sky:1,long:1,g:1.3}),
 // DAGA
 dg_doble:sk('twice',900,.45,{}),dg_veneno:sk('atk',800,.7,{v:'A'}),dg_danza:sk('flurry',1450,.3,{n:4}),dg_paso:sk('dashstep',800,.5),dg_hemo:sk('stab',900,.56,{rip:1}),dg_letal:sk('stab',950,.56),
 // MANDOBLE
 gr_pesado:sk('atk',1100,.7,{v:'H',end:.95}),gr_quebrar:sk('chop',1100,.74,{two:1}),gr_barrido:sk('spin',1250,.6,{two:1}),gr_furia:sk('roar',1250,.8,{two:1,hold:1}),gr_embestida:sk('charge',850,.55),gr_decap:sk('sweep',1200,.68,{two:1}),
 // PUÑOS
 fs_jab:sk('atk',500,.7,{v:'A'}),fs_patada:sk('kick',800,.52),fs_rafaga:sk('flurry',1300,.3,{n:4}),fs_meditar:sk('meditate',1300,.7),fs_palma:sk('palm',850,.55),fs_dragon:sk('uppercut',1150,.62),
 // BALLESTA
 xb_certero:sk('shoot',1200,.5),xb_perf:sk('shoot',1300,.5,{hold:.55}),xb_anclaje:sk('shoot',1200,.5,{aim:'low'}),xb_recarga:sk('reload',950,.5),xb_salva:sk('shoot',1500,.3,{n:3,hold:.2,span:.7}),xb_franco:sk('shoot',1700,.55,{kneel:1,hold:.8}),
 // CETRO
 sc_drenar:sk('drain',1000,.4),sc_marchitar:sk('clamp',950,.58,{g:.8}),sc_nube:sk('ring',1100,.6),sc_muro:sk('ward',950,.5),sc_almas:sk('souls',1100,.6),sc_condena:sk('clamp',1250,.82,{slam:1,g:1.2}),
 // CAMINOS · Guardián
 gd_provocar:sk('roar',1150,.8,{hold:1}),gd_escudo:sk('bash',850,.62),gd_muro:sk('brace',1200,.4),
 // Asesino
 as_marca:sk('mark',900,.62),as_sombra:sk('twice',800,.45),as_sombrio:sk('stab',950,.56),
 // Verdugo
 vd_rugido:sk('roar',1250,.8,{two:1,hold:1}),vd_quebrantar:sk('atk',1000,.7,{v:'A',end:.94}),vd_guillotina:sk('chop',1200,.74,{two:1}),
 // Monje
 mj_tigre:sk('stance',1200,.5),mj_trueno:sk('palm',900,.55,{big:1,glow:1}),mj_mil:sk('flurry',2400,.15,{n:8}),
 // Cazador
 cz_marca:sk('shoot',1000,.4,{hold:.25}),cz_agil:sk('shoot',800,.38,{hold:.2,span:.5}),cz_lluvia:sk('shoot',1600,.4,{n:2,aim:'high',hold:.1,span:.75}),
 // Francotirador
 fr_gracia:sk('shoot',1300,.5,{hold:.5}),fr_debil:sk('shoot',1250,.5,{aim:'low',hold:.45}),fr_aguila:sk('shoot',1800,.55,{kneel:1,hold:.85}),
 // Piromante
 pi_bola:sk('heave',1150,.58,{g:1.3}),pi_muro:sk('ring',1100,.6,{g:1.3}),pi_incinerar:sk('clamp',1250,.82,{slam:1,g:1.6}),
 // Criomante
 cr_lanza:sk('heave',1150,.58),cr_ventisca:sk('blizzard',1250,.84),cr_prision:sk('clamp',1100,.62,{g:1.1}),
 // Tempestad
 tm_relampago:sk('summon',1000,.66,{g:1.1}),tm_descarga:sk('summon',1150,.66,{g:1.5,long:1}),tm_tormenta:sk('summon',1500,.66,{sky:1,long:1,g:1.4}),
 // Magia oscura
 os_toque:sk('touch',900,.5),os_cosecha:sk('souls',1100,.6),os_abismo:sk('slam',1300,.76,{g:1.3})});

// ═══════════ API ═══════════
// clip de una habilidad para el arma `cls` (cls 'dual' → la clase de la mano derecha); si no hay fila, el especial clásico de la clase
// PULIDO automático de todo clip: (1) las manos nunca piden un punto más lejos de lo que alcanza el brazo (el IK se desquicia y el codo «chasquea»), (2) un pie que se desplaza se marca
// como alzado (paso) en vez de patinar por el suelo
function polish(c,S){const x=X(),C=x.C,R=.335;
 for(const tr of c.tracks){if(tr.i1-tr.i0<H.N)continue;tr.keys=tr.keys.map(k=>{const v=new Float32Array(k.v),aim=v[C.aim]>.5;
  for(const [pi,sg] of [[C.rp,-1],[C.lp,1]]){if(pi===C.lp&&v[C.two]>.5)continue;let sx=sg*.19,sy=.78,sz=0;
   if(aim){const yw=v[C.yaw]+v[C.cy],co=Math.cos(yw),si=Math.sin(yw);sy+=v[C.py];[sx,sz]=[sx*co,-sx*si]}
   const dx=v[pi]-sx,dy=v[pi+1]-sy,dz=v[pi+2]-sz,L=Math.hypot(dx,dy,dz);if(L>R){const f=R/L;v[pi]=sx+dx*f;v[pi+1]=sy+dy*f;v[pi+2]=sz+dz*f}}
  return Object.assign({},k,{v})});
  /* un pie que se mueve en algún momento queda «alzado» (.02) durante TODO el clip: da un paso en vez de patinar por el suelo */
  for(const fi of [C.fl,C.fr]){if(tr.keys.some(k=>Math.abs(k.v[fi]-S[fi])>.012||Math.abs(k.v[fi+1]-S[fi+1])>.012||Math.abs(k.v[fi+3]-S[fi+3])>.05||Math.abs(k.v[fi+4]-S[fi+4])>.05))tr.keys.forEach(k=>{if(k.v[fi+2]<.02)k.v[fi+2]=.02})}}
 return c}
function skillClip(id,S,cls,sh,dualK){const d=SKILLS[id];if(!d)return null;const c=cls==='dual'?dualK:cls;
 try{return polish(BUILD[d.b](S,Object.assign({cls:c},d.o),sh),S)}catch(e){console.warn('[skillanim]',id,e);return null}}
HeroAnim.skillClip=skillClip;
// tiempos para el juego (combatskills.js): d ms, ip = fracción del impacto, gap = separación entre golpes sucesivos (fracción de la duración)
const SKA={};
function hitsOf(s){const o=s.o;if(s.b==='flurry'){const n=o.n||4,r=[];for(let i=0;i<n;i++)r.push(.16+.68*(i+.5)/n);return r}
 if(s.b==='shoot'){const n=o.n||1,per=(o.span||.62)/n,r=[];for(let i=0;i<n;i++)r.push(.12+i*per+per*(.28+(o.hold||.4)));return r}
 if(s.b==='twice')return[.33,.83];return[s.ip]}
for(const id in SKILLS){const s=SKILLS[id];SKA[id]={d:s.d,ip:s.ip,hits:hitsOf(s)}}
if(typeof window!=='undefined')window.SKA=SKA;
export{SKA};
