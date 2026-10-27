// NotScape · R3D · FALDA LIGERA (26 oct 2026, pedido del dueño: «física más ligera que la de la capa, acorde a la estética; túnicas y vestidos eran sólidos y los pies sobresalían al caminar»).
// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// El vestido/túnica (mini3d.js) se parte en una parte SUPERIOR fija y N CUÑAS (por defecto 8) articuladas en la cintura. Cada cuña es un grupo con su pivote en (0,y0,0) del cuerpo.
// `SkirtPhys` hace girar cada cuña hacia FUERA lo justo para que las piernas (muslo, rodilla, tobillo, punta del pie) no la atraviesen, con un muelle amortiguado (se abre con un pequeño
// retraso y vuelve suave) + un vaivén mínimo en reposo. Sin restricciones ni integración Verlet: 8 muelles de un grado de libertad por prenda (≈ 40 operaciones de matriz por fotograma).
// Funciona igual con las mallas del héroe (Mini) y con los HUESOS de los PNJ horneados (actors3d.js): solo necesita objetos con `.matrix/.quaternion` (Group o Bone).
import * as THREE from 'three';
const M1=new THREE.Matrix4(),M2=new THREE.Matrix4(),MB=new THREE.Matrix4(),P=new THREE.Vector3(),Q=new THREE.Quaternion(),AX=new THREE.Vector3();
export const SK_N=8,SK_OV=.1;   // nº de cuñas y solape angular (rad) para que no se abran rendijas

// radio de la falda a la altura y, a partir del perfil [[r,y],…] ascendente
export const radAt=prof=>y=>{if(y<=prof[0][1])return prof[0][0];for(let i=0;i<prof.length-1;i++){const a=prof[i],b=prof[i+1];if(y<=b[1])return b[1]===a[1]?a[0]:a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1])}return prof[prof.length-1][0]};
// parte un perfil en [bajo (hasta y0), alto (desde y0)], interpolando el punto de corte
export function splitProfile(prof,y0){const r=radAt(prof),lo=[],hi=[];for(const p of prof){if(p[1]<y0-1e-4)lo.push(p);else if(p[1]>y0+1e-4)hi.push(p)}lo.push([r(y0),y0]);hi.unshift([r(y0),y0]);return[lo,hi]}

// aparejo para PAÑOS COLGANTES (delantales, tabardos, jirones): cada paño cuelga de un pivote (grupo/hueso) en su borde superior y se abre hacia delante/atrás cuando una pierna lo empuja.
// flaps = [{g,dir,y0,z0,h}] (dir +1 delante / −1 detrás); skRad/skHem = falda del mismo cuerpo si la hay (el paño debe quedar siempre POR FUERA de las cuñas: radio de la falda + 3,5 cm).
export function flapRig(host,flaps,skRad){return Object.assign({},host,{groups:flaps.map(f=>f.g),phi:flaps.map(f=>f.dir>0?0:Math.PI),y0:flaps.map(f=>f.y0),hems:flaps.map(f=>f.y0-f.h),rads:flaps.map(f=>skRad?(y=>Math.max(f.z0,skRad(y)+.035)):(()=>f.z0)),seed:(host.seed||0)+5})}
export class SkirtPhys{
 // rig = {pelvis,chest,body,legs:[a,b],knees:[a,b],ankles:[a,b],groups:[…],phi:[…],y0,rad}
 constructor(rig){this.r=rig;const n=rig.groups.length;this.a=new Float32Array(n);this.v=new Float32Array(n);this.t=(rig.seed||0)*3.7;this.pen=0;this.dir=rig.phi.map(f=>[Math.sin(f),Math.cos(f)]);this.pts=[]}
 update(dt){const R=this.r;dt=Math.min(dt||.016,.05);this.t+=dt;
  // marco del cuerpo y de cada pierna (las matrices locales se actualizan aquí: las animaciones solo tocan quaternion/position)
  R.pelvis.updateMatrix();R.chest.updateMatrix();R.body.updateMatrix();MB.copy(R.pelvis.matrix).multiply(R.chest.matrix).multiply(R.body.matrix).invert();
  const pts=this.pts;pts.length=0;
  for(let s=0;s<2;s++){R.legs[s].updateMatrix();R.knees[s].updateMatrix();R.ankles[s].updateMatrix();
   M1.copy(R.pelvis.matrix).multiply(R.legs[s].matrix);const thigh=P.set(0,-.1,0).applyMatrix4(M1).applyMatrix4(MB).clone();pts.push([thigh.x,thigh.y,thigh.z,.085]);
   M1.multiply(R.knees[s].matrix);const kn=P.set(0,0,0).applyMatrix4(M1).applyMatrix4(MB).clone();pts.push([kn.x,kn.y,kn.z,.08]);
   M2.copy(M1).multiply(R.ankles[s].matrix);const an=P.set(0,0,0).applyMatrix4(M2).applyMatrix4(MB).clone();pts.push([an.x,an.y,an.z,.075]);
   const toe=P.set(0,-.01,.11).applyMatrix4(M2).applyMatrix4(MB).clone();pts.push([toe.x,toe.y,toe.z,.07])}
  // anticipación: la falda reacciona a donde ESTARÁ la pierna en ~60 ms (velocidad del punto), así el muelle no llega tarde
  const pv=this.pv||(this.pv=[]);for(let k=0;k<pts.length;k++){const p=pts[k],q=pv[k]||(pv[k]=[p[0],p[1],p[2]]);const lx=(p[0]-q[0])/dt*.06,ly=(p[1]-q[1])/dt*.06,lz=(p[2]-q[2])/dt*.06;q[0]=p[0];q[1]=p[1];q[2]=p[2];p[0]+=Math.max(-.12,Math.min(.12,lx));p[1]+=Math.max(-.12,Math.min(.12,ly));p[2]+=Math.max(-.12,Math.min(.12,lz))}
  const n=R.groups.length,K=R.K||420,C=R.C||30;
  for(let i=0;i<n;i++){const [dx,dz]=this.dir[i],y0=Array.isArray(R.y0)?R.y0[i]:R.y0,rad=R.rads?R.rads[i]:R.rad,hem=R.hems?R.hems[i]:(R.hem||0);let need=0;
   for(const p of pts){const L=y0-p[1];if(L<.05||p[1]<hem+.01)continue;   // por debajo del dobladillo el pie asoma por debajo de la falda (normal)
    const proj=p[0]*dx+p[2]*dz,raw=proj+p[3]-rad(p[1])*.96,over=raw/L;if(over>need)need=over;const pen=raw-L*this.a[i];if(pen>this.pen){this.pen=pen;this.worst={i,raw:+raw.toFixed(3),L:+L.toFixed(3),a:+this.a[i].toFixed(3),p:p.map(x=>+x.toFixed(3))}}}   // pen = penetración máxima observada (para tools/r3d/skirt_check)
   let tg=Math.min(.7,need*1.25);tg+=.016*Math.sin(this.t*1.7+i*.8)+.01*Math.sin(this.t*3.1+i*1.9);   // vaivén mínimo en reposo
   const acc=(tg-this.a[i])*K-this.v[i]*C;this.v[i]+=acc*dt;this.a[i]+=this.v[i]*dt;
   if(this.a[i]<-.12){this.a[i]=-.12;this.v[i]=0}
   AX.set(-dz,0,dx);Q.setFromAxisAngle(AX,this.a[i]);R.groups[i].quaternion.copy(Q)}}
}
