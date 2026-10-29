// NotScape · R3D · MONTURA DEL HÉROE (lotes DOMAR-D1 y DOMAR-D3-MODELOS, 29 oct 2026) · modelo 3D de la especie montada y su animación procedural.
// El MODELO sale de mountmodels3d.js (`makeSpecies(sp, silla=true, cultura)`): el mismo que el animal salvaje (actors3d.js) + silla y bridas de la cultura de su bioma.
// Se crea al montar una especie por primera vez y se cachea en `MiniHero` (herom3d.js); cuelga de `hero.obj`, así pasa por los mismos pases (oclusión, grado óleo, sombra) que el
// jinete y solo cuesta algo montado (`obj.visible=false` el resto). Material `toon` de los actores (`chr+vc+emit`: sin programa nuevo) y contorno `hull` HIJO de cada malla.
// Una malla por hueso (cuerpo, cabeza, 4 patas, cola, [cola2, alas]) + su contorno = 16–22 llamadas por pase. `seat` = lo que sube el jinete; `fw` = separación de sus pies (estribos).
import * as THREE from 'three';
import {toon,hull} from './materials3d.js';
import {makeSpecies,groupsOf,MSPEC,MBIO} from './mountmodels3d.js';

const ss=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
const VC={chr:1,vc:1,emit:1};let MAT=null;
const SEAT=.64;   // asiento del caballo de referencia (lo exporta para compatibilidad)
export class Mount3D{
 constructor(sp='caballo',cul,sad=true){if(!MSPEC[sp])sp='caballo';this.sp=sp;if(cul==null)cul=MBIO[sp]|0;if(!MAT)MAT=toon('#ffffff',VC);const d=makeSpecies(sp,sad,cul),g=groupsOf(d,MAT,hull,.012,false);
  this.obj=g.grp;this.R=g.R;this.meta=d.meta;this.seat=d.meta.seat;this.fw=d.meta.fw;this.sz=Math.max(.7,d.meta.len/1.6);this.obj.name='mount_'+sp;this.obj.visible=false;this.ph=0;this.gait=0;this.k=0;this.wf=0}
 // k: rampa de montar (0..1) · gait: 0 quieto, 1 trote, 2 galope (suavizado) · dist: distancia recorrida este fotograma (unidades three) · t: reloj
 update(k,gaitT,dist,dt,t,pos,face){const o=this.obj;this.k=k;if(k<=.001){o.visible=false;return}o.visible=true;o.position.copy(pos);o.rotation.y=face;
  this.gait+=(gaitT-this.gait)*(1-Math.exp(-dt*8));const g=this.gait,gal=ss(1.1,1.9,g),mv=ss(.05,.6,g),M=this.meta,R=this.R;
  this.ph+=dist*(.67*(1-gal)+.38*gal)*(2.05/(M.cyc||2.05));const ph=this.ph*Math.PI*2;   /* ciclos por unidad: el de referencia (caballo) da ≈ 1,5 u por zancada al trote y 2,6 u al galope */
  o.scale.setScalar(.8+.2*ss(0,.6,k));
  const A=(M.biped?.55:.38*(1-gal)+.62*gal)*mv*(M.tilt?.8:1);
  const trot=[0,.5,.5,0],gall=[0,.1,.55,.65],N=['legFL','legFR','legBL','legBR'];
  for(let i=0;i<4;i++){const L=R[N[i]];if(!L)continue;if(M.biped&&i<2){L.rotation.x=0;continue}const p=ph+Math.PI*2*(M.biped?(i===2?0:.5):trot[i]*(1-gal)+gall[i]*gal);L.rotation.x=-Math.sin(p)*A}
  const bob=Math.sin(ph*2)*.016*mv*(1-gal)+Math.sin(ph)*.03*gal;o.position.y+=bob;R.body.rotation.x=-Math.sin(ph)*.05*gal;R.body.rotation.y=M.tilt?Math.sin(ph)*.1*mv:0;
  const br=Math.sin(t*1.6)*.012;if(R.head){R.head.rotation.x=.04*gal+.05*Math.sin(ph*(1+gal))*mv+br;R.head.rotation.y=M.tilt?-Math.sin(ph)*.08*mv:0}
  if(R.tail){R.tail.rotation.x=(M.tilt?0:.25*gal)+Math.sin(ph*.5+1)*.12*mv+Math.sin(t*1.2)*.04;R.tail.rotation.y=M.tilt?-Math.sin(ph)*.25*mv:0;R.tail.rotation.z=M.tilt?0:Math.sin(t*.9)*.05+Math.sin(ph)*.08*mv}
  if(R.tail2)R.tail2.rotation.y=-Math.sin(ph-.8)*.3*mv+Math.sin(t*.7)*.06;
  if(R.wingL){this.wf+=((gal>.3?1:0)-this.wf)*(1-Math.exp(-dt*3));const f=this.wf,fl=Math.sin(t*7)*.55*f;R.wingL.rotation.z=.15*f+fl;R.wingR.rotation.z=-.15*f-fl;R.wingL.rotation.y=-.5*f;R.wingR.rotation.y=.5*f}}
 dispose(){this.obj.traverse(m=>{if(m.geometry)m.geometry.dispose()})}
}
export {SEAT};
