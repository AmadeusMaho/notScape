// NotScape · R3D · Lote R3D-LUZ (20 oct 2026) · LUZ BARATA DE FAROLES, BRASEROS Y FOGATAS.
// QUÉ HACE: las únicas luces reales (PointLight) son 4 y siguen al héroe; el resto de fuentes (todos los faroles de aldea y camino, braseros, hogueras, hornos) NO tenían luz y de noche se veían apagadas
//   a pocos metros. Aquí cada fuente cercana recibe (a) un HALO aditivo que mira a la cámara en la lámpara y (b) un CHARCO de luz plano sobre el suelo. Son dos mallas instanciadas (2 draw calls,
//   MeshBasicMaterial aditivo, sin sombras), así que el coste es casi nulo y escala con el número de faroles. Aparecen y se apagan con suavidad (`on` por fuente, sin saltos al cambiar de las 4 luces reales).
// PARPADEO: lento y pequeño (≈1–2 Hz, ±6 %), con fase propia por fuente; los faroles NO parpadean (solo respiran un 2 %). Antes todo el fuego vibraba a 11–23 Hz y sincronizado (se veía «nervioso»).
// AJUSTES: `R3D.glow.k` = intensidad (1 = defecto); `?glow=0` lo apaga; `?glow=1.5` intensidad ×1,5.
import * as THREE from 'three';

const MAXG=96,TAU=Math.PI*2;
export class LampGlow{
 constructor(scene){const q=(/[?&]glow=([\d.]+)/.exec(location.search)||[])[1];this.k=q==null?1:Math.max(0,+q);this.on=this.k>0;this.n=0;this.st=new Map();
  const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);
  [[0,1],[.12,.62],[.35,.22],[.65,.06],[1,0]].forEach(([o,a])=>gr.addColorStop(o,'rgba(255,255,255,'+a+')'));g.fillStyle=gr;g.fillRect(0,0,64,64);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
  const geo=new THREE.PlaneGeometry(1,1),mk=(ro,po)=>{const m=new THREE.InstancedMesh(geo,new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,polygonOffset:po,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),MAXG);
   m.count=0;m.frustumCulled=false;m.renderOrder=ro;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(MAXG*3),3);m.instanceColor.setUsage(THREE.DynamicDrawUsage);scene.add(m);return m};
  this.halo=mk(6,false);this.pool=mk(4,true);
  this.mt=new THREE.Matrix4();this.q=new THREE.Quaternion();this.qf=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);this.s=new THREE.Vector3();this.p=new THREE.Vector3();this.c=new THREE.Color()}
 // srcs: [{p:Vector3 (cabeza de la llama/farol), k:clave, ph}], LK[k] = [color, intensidad, radio, alto, 'win'|'fire']; p = fila TOD (win/fire 0..1); cam = cámara ortográfica
 update(t,dt,tgt,R,srcs,LK,p,cam,QLv,skip){const H=this.halo,P=this.pool;if(!this.on||QLv>=4||(p.win<.02&&p.fire<.02)){H.count=P.count=0;return}
  const a=Math.min(1,dt*5),R2=R*R,lim=QLv>=3?24:MAXG;let n=0;
  for(const s of srcs){const dx=s.p.x-tgt.x,dz=s.p.z-tgt.z,d2=dx*dx+dz*dz,d=LK[s.k],fire=d[4]==='fire',lvl=fire?p.fire:p.win,want=(d2>R2||lvl<.02)?0:lvl;let o=this.st.get(s);
   if(!o){if(!want)continue;o={v:0};this.st.set(s,o)}
   o.v+=(want-o.v)*a;if(o.v<.01){this.st.delete(s);continue}if(n>=lim)break;
   const fl=fire?1+.05*Math.sin(t*1.7+s.ph)+.035*Math.sin(t*3.1+s.ph*1.9)+.02*Math.sin(t*5.3+s.ph*.7):1+.02*Math.sin(t*.9+s.ph),v=o.v*fl*this.k,r=d[2],gy=s.p.y-d[3];
   this.c.set(d[0]);
   // halo: billboard en la lámpara
   const hs=fire?(.9+r*.12):(.7+r*.05);this.p.copy(s.p);this.s.set(hs,hs,1);this.mt.compose(this.p,cam.quaternion,this.s);H.setMatrixAt(n,this.mt);
   const hk=(fire?.85:.7)*v;H.instanceColor.setXYZ(n,this.c.r*hk,this.c.g*hk,this.c.b*hk);
   // charco de luz en el suelo (diámetro ≈ 1,15× el alcance de la luz; más suave que el halo)
   this.p.set(s.p.x,gy+.035,s.p.z);const ps=r*(fire?1.25:1.05);this.s.set(ps,ps,1);this.mt.compose(this.p,this.qf,this.s);P.setMatrixAt(n,this.mt);
   const pk=skip&&skip.has(s)?0:(fire?.8:.7)*v;P.instanceColor.setXYZ(n,this.c.r*pk,this.c.g*pk,this.c.b*pk);n++}
  H.count=P.count=n;H.instanceMatrix.needsUpdate=P.instanceMatrix.needsUpdate=H.instanceColor.needsUpdate=P.instanceColor.needsUpdate=true}
}
