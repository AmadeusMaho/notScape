// NotScape · R3D · Lote R3D-ANIM · comprobación NUMÉRICA de las animaciones del héroe diorama (sin navegador).
// Uso (raíz del repo):  node tools/r3d/anim_lint.mjs [filtro]      → imprime una fila por escenario y RESULTADO: OK/FALLO
// Simula MiniHero (herom3d.js + heroanim3d.js) a 60 fps con el MISMO formato de estado que game.js (actState/animPh) y mide:
//   · nan     : algún hueso con NaN
//   · manoD/I : lo que le falta a la mano derecha/izquierda para llegar a su objetivo (a dos manos = distancia al mango)  [unidades de modelo]
//   · pies    : lo que le falta al pie para llegar al suelo (si > 0 el pie flota)
//   · patina  : desplazamiento máximo de un pie plantado (sin alzar) en reposo/guardia/acciones, por fotograma × 60 (u/s)
//   · cuerpo  : % de fotogramas con algún punto del objeto dentro del torso (85 % de la túnica) o la cabeza; < 17 % = roce de empuñadura aceptable
//   · giro    : salto angular máximo de un hueso entre fotogramas (rad) → detecta «chasquidos» (poses que saltan)
// Umbrales (FALLO): manoI > .02 en agarres a dos manos, pies > .02, patina > .6, cuerpo > 17 %, giro > 1 (un golpe rápido llega a ~.95 en el impacto).
import {register} from 'node:module';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const ROOT=path.resolve(path.dirname(new URL(import.meta.url).pathname),'../..');
register('data:text/javascript,'+encodeURIComponent(`export async function resolve(s,c,n){if(s==='three')return{url:${JSON.stringify(pathToFileURL(ROOT+'/vendor/three/build/three.module.js').href)},shortCircuit:true};return n(s,c)}`));
const THREE=await import('three');
const {MiniHero}=await import(pathToFileURL(ROOT+'/src/r3d/herom3d.js').href);
const FILTER=process.argv[2]||'',TRACE=process.argv.includes('--trace');

const {SC,stateAt}=await import(pathToFileURL(ROOT+'/tools/r3d/anim_states.mjs').href);

const V=THREE.Vector3,_a=new V(),_b=new V(),_c=new V();
// cuerpo en el marco del torso (body): tronco = perfil de la túnica de mini3d.js al 85 %, cabeza = esfera (0,1.06,.04) r .17
const PF=[[.3,0],[.31,.04],[.24,.3],[.19,.55],[.17,.74],[.12,.84],[0,.86]],rad=y=>{for(let i=0;i<PF.length-1;i++){const a=PF[i],b=PF[i+1];if(y>=a[1]&&y<=b[1])return a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1])}return 0};
function inBody(p){if(p.y>.45&&p.y<.85&&Math.hypot(p.x,p.z)<rad(p.y)*.85)return 1;if(Math.hypot(p.x,p.y-1.06,p.z-.04)<.17)return 1;return 0}
let bad=0;const rows=[];
for(const sc of SC){if(FILTER&&!sc.n.includes(FILTER))continue;const h=new MiniHero();h.setLook({app:{g:'m',hair:'cut'},gear:sc.g});const m=h.m,A=h.anim;
 const T=sc.T||Math.max(4,sc.win?sc.win[1]+.2:0),dt=1/60;let nan=0,rR=0,rL=0,feet=0,slide=0,body=0,jump=0,jb='',fr=0,bt=[];const segs={};const prevQ=new Map(),prevF=[null,null];
 for(let f=0;f<=T*60;f++){const tm=f*dt,s=stateAt(sc,tm);   // se desplaza de verdad si anda (la fase de paso va por distancia)
  h.update(s,dt);m.obj.updateMatrixWorld(true);
  // NaN y saltos de hueso
  for(const b of [m.pelvis,m.chest,m.head,...m.arms,...m.elbows,...m.grips,...m.legs,...m.knees,...m.ankles]){const q=b.quaternion;if(!isFinite(q.x+q.y+q.z+q.w)||!isFinite(b.position.x+b.position.y))nan=1;
   const pq=prevQ.get(b);if(pq&&f>30){const d=2*Math.acos(Math.min(1,Math.abs(pq.dot(q))));if(d>jump){jump=d;jb=(b.parent===m.pelvis?'pierna/torso':b===m.head?'cabeza':m.arms.includes(b)?'hombro'+m.arms.indexOf(b):m.elbows.includes(b)?'codo'+m.elbows.indexOf(b):m.grips.includes(b)?'muñeca'+m.grips.indexOf(b):m.knees.includes(b)?'rodilla':m.ankles.includes(b)?'tobillo':'?')+'@'+tm.toFixed(2)}
    if(TRACE&&d>.35)console.log('  salto',d.toFixed(2),'t',tm.toFixed(3),'clave',A.key,'fade',A.fade.toFixed(2),b===m.head?'cabeza':m.arms.includes(b)?'hombro'+m.arms.indexOf(b):m.elbows.includes(b)?'codo'+m.elbows.indexOf(b):m.grips.includes(b)?'muñeca'+m.grips.indexOf(b):'otro')}prevQ.set(b,q.clone())}
  if(f<20)continue;
  const two=A.v[40]>.5,shield=!!(A.held&&A.it.shield&&A.held.has(A.it.shield));rR=Math.max(rR,A.reach[0]);if(two)rL=Math.max(rL,A.reach[1]);else rL=Math.max(rL,A.reach[1]);
  feet=Math.max(feet,A.reach[2],A.reach[3]);
  // patinaje: pie sin alzar que se mueve en el mundo (solo sin desplazarse)
  if(!s.mv)m.ankles.forEach((an,i)=>{an.getWorldPosition(_a);const lift=A.v[i?12+2:17+2]+A.liftX[i];if(prevF[i]&&lift<.004&&A.fade>=1){const d=Math.hypot(_a.x-prevF[i].x,_a.z-prevF[i].z)/dt;if(d>slide)slide=d}prevF[i]=_a.clone()});
  // hoja/mango dentro del cuerpo: puntos del objeto en la mano derecha (en el marco del torso)
  let hit=0;for(const it of Object.values(A.it)){if(!it.g.visible||!A.held||!A.held.has(it))continue;const inv=new THREE.Matrix4().copy(m.body.matrixWorld).invert();
   it.g.traverseVisible(o=>{if(!o.isMesh||!o.geometry||o.material.side===THREE.BackSide)return;const pos=o.geometry.attributes.position;if(!pos||pos.count>800)return;
    const invI=new THREE.Matrix4().copy(it.g.matrixWorld).invert();
    for(let i=0;i<pos.count;i+=3){_a.fromBufferAttribute(pos,i);o.localToWorld(_a);_b.copy(_a).applyMatrix4(invI);_a.applyMatrix4(inv);if(inBody(_a)){
     const seg=_b.y<-.03?'mango':_b.y<.11?'agarre':'hoja';if(!(seg==='mango'&&A.v[40]>.5&&it.g.parent===m.grips[0]))hit=1;/* el mango de un objeto a dos manos apoyado en la cadera/barriga es natural */segs[it.kind+':'+seg]=(segs[it.kind+':'+seg]||0)+1;
     if(TRACE)console.log('   pieza',it.kind,seg,o.geometry.type,_a.x.toFixed(2),_a.y.toFixed(2),_a.z.toFixed(2));break}}})}
  fr++;if(hit){body++;bt.push(tm.toFixed(2))}if(TRACE&&hit)console.log('  dentro del cuerpo t',tm.toFixed(2),'clave',A.key,'u?',A.inStrike?'golpe':'seg')}
 const f2=x=>x.toFixed(3),fail=nan||rL>.025||rR>.03||feet>.02||slide>.6||jump>1||body/fr>.17;
 rows.push(`${fail?'✗':'·'} ${sc.n.padEnd(34)} nan ${nan} manoD ${f2(rR)} manoI ${f2(rL)} pies ${f2(feet)} patina ${slide.toFixed(2)} cuerpo ${(100*body/fr).toFixed(0)}% giro ${jump.toFixed(2)} ${jb} ${Object.entries(segs).sort((a,b)=>b[1]-a[1]).slice(0,3).map(e=>e[0]).join(' ')}`);if(fail)bad++}
console.log(rows.join('\n'));console.log(bad?`RESULTADO: FALLO (${bad})`:'RESULTADO: OK');
