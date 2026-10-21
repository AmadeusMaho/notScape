// NotScape · R3D · Lote R3D-F7-RAYOS (20 oct 2026) · RAYOS DE SOL del Bosque (resto «P5» de la Fase 7): haces de luz dorada que bajan entre la copa de los árboles.
// QUÉ HACE: una malla instanciada (1 draw call) de «cartas» aditivas: cada rayo son dos cuadrantes cruzados (X) cuyo eje sigue la dirección REAL del sol (TOD.dia.sunP), con degradado
//   vertical (más fuerte arriba, se apaga en el suelo) y borde suave. Se reparten de forma DETERMINISTA por una rejilla de celdas de 5 tiles anclada al mundo (hash de la celda), SOLO donde el bioma
//   es el Bosque (`TER.biomeOf(tx,tz)===BOSQUE`), con un peso suave en la frontera (se cuentan los vecinos). Respiran despacio (cada rayo con su fase) y se apagan de noche, con lluvia/tormenta
//   y a calidad Mínima. Anclados a la altura real del suelo (`TER.standZ`).
// COSTE: ≤ MAXR instancias (24; 12 en calidad Media o inferior), 1 draw call, sin sombras; si el héroe no está cerca de un bosque no hay trabajo (se vacía el conjunto).
// AJUSTES: `R3D.rays.k` = intensidad (1 = defecto); `?rays=0` lo apaga; `?rays=2` intensidad ×2. Un bioma con rayos nuevo = una fila en BIOMA_K (peso por índice de BIOMES).
// MATERIAL: MeshBasicMaterial (NO ShaderMaterial: rompe la pasada de reflejo del agua con planos de recorte globales, ver lote R3D-DROPS-3D).
import * as THREE from 'three';
import {TOD} from './materials3d.js';

const CELL=5,MAXR=24,TAU=Math.PI*2,hash=(a,b,c)=>{let h=(a*374761393+b*668265263+c*2147483647)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967295};
const BIOMA_K={1:1};   // índice de BIOMES → intensidad (Bosque = 1)

export class SunRays{
 constructor(scene,W3){this.W3=W3;const q=(/[?&]rays=([\d.]+)/.exec(location.search)||[])[1];this.k=q==null?1:Math.max(0,+q);this.on=this.k>0;this.n=0;
  const c=document.createElement('canvas');c.width=32;c.height=128;const g=c.getContext('2d');
  for(let y=0;y<128;y++){const v=y/127,f=Math.pow(1-v,1.3)*Math.min(1,v*10);   // fila 0 del lienzo = punta superior del haz (v texturas=1)
   for(let x=0;x<32;x++){const e=Math.pow(Math.max(.001,Math.sin(x/31*Math.PI)),.9);g.fillStyle='rgba(255,255,255,'+(f*e*.9).toFixed(3)+')';g.fillRect(x,y,1,1)}}
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
  // dos cuadrantes cruzados de 1×1, con el origen en el centro de la cara superior (y=0 arriba → y=-1 abajo)
  const P=[],U=[],I=[];const quad=(rot)=>{const b=P.length/3,c=Math.cos(rot),s=Math.sin(rot);for(const[x,y,u,v]of[[-.5,0,0,1],[.5,0,1,1],[.5,-1,1,0],[-.5,-1,0,0]]){P.push(x*c,y,x*s);U.push(u,v)}I.push(b,b+1,b+2,b,b+2,b+3)};quad(0);quad(Math.PI/2);
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(P,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));geo.setIndex(I);
  const mat=new THREE.MeshBasicMaterial({map:tex,color:new THREE.Color('#ffe2a0').multiplyScalar(1.05),transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,fog:false});
  const m=this.mesh=new THREE.InstancedMesh(geo,mat,MAXR);m.count=0;m.frustumCulled=false;m.renderOrder=5;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  m.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(MAXR*3),3);m.instanceColor.setUsage(THREE.DynamicDrawUsage);scene.add(m);
  this.dir=new THREE.Vector3();this.mt=new THREE.Matrix4();this.q=new THREE.Quaternion();this.s=new THREE.Vector3();this.p=new THREE.Vector3();this.cells=[];this.ck='';this.up=new THREE.Vector3(0,-1,0)}
 // peso del Bosque en una celda: fracción de 4 muestras que caen en el bioma, para que el borde se desvanezca
 weight(cx,cz){let w=0,n=0;for(const[u,v]of[[.15,.15],[.85,.15],[.15,.85],[.85,.85],[.5,.5]]){const tx=Math.floor((cx+u)*CELL),tz=Math.floor((cz+v)*CELL);let b=-1;try{b=TER.biomeOf?TER.biomeOf(tx,tz):-1}catch(e){}w+=(BIOMA_K[b]||0);n++}return w/n}
 // no hay rayos sobre la aldea (los haces cruzaban las casas): radio de 24 tiles alrededor de la plaza de cada bioma con rayos
 inVillage(ci,cj){const x=(ci+.5)*CELL*32,y=(cj+.5)*CELL*32;try{for(const k in BIOMA_K){const B=BIOMES.list[k],p=B&&B.village&&B.village.plaza&&B.village.plaza[0];if(p&&Math.hypot(B.ox+p[0]-x,B.oy+p[1]-y)<24*32)return true}}catch(e){}return false}
 update(t,dt,tgt,R,day,rain,QLv){const m=this.mesh;if(!this.on||day<.04||QLv>=4){m.count=0;return}
  const cx0=Math.floor((tgt.x-R)/CELL),cx1=Math.floor((tgt.x+R)/CELL),cz0=Math.floor((tgt.z-R)/CELL),cz1=Math.floor((tgt.z+R)/CELL),key=cx0+','+cz0+','+cx1+','+cz1;
  if(key!==this.ck){this.ck=key;const L=[];for(let j=cz0;j<=cz1;j++)for(let i=cx0;i<=cx1;i++){const w=this.weight(i,j);if(w<.2||this.inVillage(i,j))continue;const h=hash(i,j,7);if(h>.3*w+.04)continue;   // ~15–35 % de las celdas del bosque llevan un rayo
    const x=(i+.2+.6*hash(i,j,1))*CELL,z=(j+.2+.6*hash(i,j,2))*CELL;L.push({x,z,w,ph:hash(i,j,3)*TAU,len:3.6+2.6*hash(i,j,4),wd:.5+.65*hash(i,j,5),d:Math.hypot(x-tgt.x,z-tgt.z)})}
   L.sort((a,b)=>a.d-b.d);this.cells=L.slice(0,QLv>=2?MAXR/2:MAXR)}
  const sp=TOD.dia.sunP,d=this.dir.set(-sp[0],-sp[1],-sp[2]).normalize();   // el haz baja en la dirección contraria a la del sol
  // matriz que alinea el eje -Y local del cuadrante con `d`
  this.q.setFromUnitVectors(this.up,d);const base=day*(1-Math.min(1,rain*2.2))*this.k*.8;let n=0;
  for(const c of this.cells){const y0=this.W3(c.x*32,c.z*32,TER.standZ(c.x*32,c.z*32)).y,L=c.len;
   this.p.set(c.x-d.x*L,y0-d.y*L,c.z-d.z*L);   // el pie del haz toca el suelo en (x,y0,z); la punta superior queda L·|dy| más alta y desplazada hacia el sol
   this.s.set(c.wd,L,c.wd);this.mt.compose(this.p,this.q,this.s);m.setMatrixAt(n,this.mt);
   const br=base*c.w*(.62+.38*Math.sin(t*.45+c.ph)*Math.sin(t*.23+c.ph*1.7));m.instanceColor.setXYZ(n,br,br,br);n++}
  m.count=n;m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true}
}
