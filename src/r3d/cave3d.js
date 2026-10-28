// NotScape · R3D · CUEVAS REALES (27 oct 2026) · MALLA de una cueva a partir de la planta de `CAVEGEN` (src/cavegen.js). Lo usa `Rooms3D.enterCave` (interiors3d.js).
// Unidades: 1 tile = 1 unidad ≈ 1,75 m; el origen es el CENTRO de la rejilla (x,z en tiles = celda − W/2). Todo se construye con `B` (propsdark3d) → atributos position/normal/color/aEmit, sin UV: mismo material
// `toon` que las salas (sin programas nuevos).
//   · SUELO: una malla; los vértices del contorno se DESPLAZAN hacia la roca con un hash por esquina (el mismo desplazamiento en suelo y pared ⇒ sin rendijas) y el suelo tiene un relieve mínimo.
//   · PAREDES: 4 mallas, una por orientación (normal hacia +x, −x, +z, −z). `Rooms3D.update` escala en Y (casi a ras) las que dan la espalda a la cámara y deja altas las del fondo
//     (corte de maqueta como en las casas: el héroe nunca queda tapado). Tres bandas con abultamientos y una repisa de roca arriba.
//   · TECHO: una losa oscura a WALL_H+.4 sobre la planta; por arriba es lo único que se ve de la roca, así que `Rooms3D` le abre un agujero con trama (discard con ruido) centrado donde el rayo de cámara atraviesa el techo sobre el héroe.
//   · ESTALACTITAS: cuelgan del labio del voladizo de cada pared (el borde alto de la pared se adelanta hacia la sala) y se bajan con la pared que las lleva.
//   · DECORADO: estalagmitas, rocas sueltas, cristales y setas luminosas (aEmit) en UNA malla; las luces reales (PointLight + halo) las pone Rooms3D con `lights`.
// Cueva de otro bioma = una fila en `PAL`. REGLA DE SENTIDO: pared 3,4 de alto (≈ 6 m), pasillo 3 de ancho (≈ 5 m), estalagmitas ≤ 1,5.
import * as THREE from 'three';
import {B,col,mul,mix} from './propsdark3d.js';
import {ORECOL} from './nature3d.js';

const hash=(a,b,c)=>{const h=Math.sin(a*127.1+b*311.7+c*74.7)*43758.5453;return h-Math.floor(h)};
export const WALL_H=3.4;
// paleta por bioma (0 Pradera … 8 Costa): roca, roca 2, suelo, musgo, color de los cristales/setas
export const PAL=[
 {rock:'#7a7468',rock2:'#8a7e66',floor:'#6a6050',moss:'#5a6a3a',glow:'#9ee07a',torch:'#ffb868',tp:{hemS:'#7a8a96',sun:'#9aa8b8',rim:'#b8c8d8',lift:'#030406'}},
 {rock:'#5e6250',rock2:'#6e7258',floor:'#4e5238',moss:'#4a7a3a',glow:'#a8f08a',torch:'#ffc878',tp:{hemS:'#6a9a82',sun:'#8ac0a0',rim:'#a8e8b8',lift:'#020604',sky:'#020805'}},
 {rock:'#4e5444',rock2:'#5a604a',floor:'#3e4634',moss:'#4a6a3a',glow:'#78e8b0',torch:'#ffc070',tp:{hemS:'#5a8a78',sun:'#78b098',rim:'#88e0b8',lift:'#020605',sky:'#02080a',hemI:.55}},
 {rock:'#6e7480',rock2:'#80868f',floor:'#5a5e68',moss:'#5a7a6a',glow:'#9ad4ff',torch:'#ffd8a0',tp:{hemS:'#7a9ad0',sun:'#a8c4f0',rim:'#c8e4ff',lift:'#020410',sky:'#02050e',hemI:.7}},
 {rock:'#6a6258',rock2:'#7a6e60',floor:'#5a5248',moss:'#5a6a4a',glow:'#ffa8c8',torch:'#ffb070',tp:{hemS:'#9a7a88',sun:'#d0a0b0',rim:'#ffc0d8',lift:'#060306'}},
 {rock:'#3c302e',rock2:'#4c3a34',floor:'#2e2422',moss:'#4a3a2a',glow:'#ff7a3a',torch:'#ff8a3a',tp:{hemS:'#a05a3a',sun:'#ff8a50',rim:'#ffa860',lift:'#0a0302',sky:'#0a0402',hemI:.66,sunI:.5}},
 {rock:'#5a5470',rock2:'#6a6482',floor:'#463e5a',moss:'#4a4a6a',glow:'#c09aff',torch:'#d0a8ff',tp:{hemS:'#7a6aa8',sun:'#a890e0',rim:'#d0b8ff',lift:'#050310',sky:'#04020c'}},
 {rock:'#9a8460',rock2:'#aa9470',floor:'#8a7450',moss:'#8a8a4a',glow:'#ffd870',torch:'#ffc060',tp:{hemS:'#b09a68',sun:'#e8c888',rim:'#ffe0a0',lift:'#080602',hemI:.7}},
 {rock:'#6a7480',rock2:'#7a8490',floor:'#505a66',moss:'#4a7a6a',glow:'#80e8e8',torch:'#ffd090',tp:{hemS:'#5a9aa8',sun:'#80d0d8',rim:'#a0f0f0',lift:'#020608'}}];
const pal=k=>PAL[k]||PAL[0];

export function buildCave(def,bk){
 const {W,H:HH,mask}=def,P=pal(bk),C1=col(P.rock),C2=col(P.rock2),CF=col(P.floor),CM=col(P.moss),sd=def.seed|0;
 const solid=(x,z)=>x<0||z<0||x>=W||z>=HH||!mask[z*W+x],hx=W/2,hz=HH/2;
 // esquina de rejilla (gx,gz) desplazada hacia la roca (para suelo y pared por igual)
 const cache=new Map(),corner=(gx,gz)=>{const k=gx*4096+gz;let v=cache.get(k);if(v)return v;
  const cs=[[gx-1,gz-1],[gx,gz-1],[gx-1,gz],[gx,gz]];let n=0,vx=0,vz=0;for(const[cx,cz]of cs)if(solid(cx,cz)){n++;vx+=cx+.5-gx;vz+=cz+.5-gz}
  let x=gx,z=gz;if(n>0&&n<4){const l=Math.hypot(vx,vz)||1,m=.1+.32*hash(gx,gz,sd+1);x+=vx/l*m;z+=vz/l*m}
  const l2=Math.hypot(vx,vz)||1,live=n>0&&n<4;v=[x-hx,z-hz,live,live?vx/l2:0,live?vz/l2:0];cache.set(k,v);return v};   // [x,z,en la orilla, dirección HACIA la roca (x,z)]: las paredes que comparten esquina comparten también su desplazamiento → sin grietas
 const yJ=(gx,gz)=>(hash(gx,gz,sd+2)-.5)*.09;
 // ── SUELO (Lote CUEVAS-TECHO): color por ESQUINA con ruido de valor suave (sin teselas por celda) → se interpola dentro de cada celda; más oscuro y musgoso cerca de la pared ──
 const vn=(x,z,s2)=>{const xi=Math.floor(x),zi=Math.floor(z),fx=x-xi,fz=z-zi,ux=fx*fx*(3-2*fx),uz=fz*fz*(3-2*fz),h=(a,b)=>hash(a,b,s2);return(h(xi,zi)*(1-ux)+h(xi+1,zi)*ux)*(1-uz)+(h(xi,zi+1)*(1-ux)+h(xi+1,zi+1)*ux)*uz};
 const dAt=(x,z)=>x<0||z<0||x>=W||z>=HH?0:(def.D?def.D[z*W+x]:3);
 const fc=new Map(),fcol=(gx,gz)=>{const k=gx*4096+gz;let c=fc.get(k);if(c)return c;
  const d=(dAt(gx-1,gz-1)+dAt(gx,gz-1)+dAt(gx-1,gz)+dAt(gx,gz))/4,n1=vn(gx*.2,gz*.2,sd+4),n2=vn(gx*.65+9,gz*.65+3,sd+5),wet=Math.max(0,Math.min(1,(n1-.55)*3.2)),moss=Math.max(0,Math.min(1,(1.9-d)*.5))*(.35+.65*n2);
  c=mul(mix(mix(CF,mix(C1,CM,.5),wet*.7),CM,moss*.55),(.58+.42*Math.min(1,d/2.6))*(.9+.2*n2));fc.set(k,c);return c};
 const bf=new B(sd+3),up=(x,z)=>[x,-1,z];
 const Q4=(b,p,q,r,t,cs,ctr)=>{b.tri(p,q,r,[cs[0],cs[1],cs[2]],0,ctr);b.tri(p,r,t,[cs[0],cs[2],cs[3]],0,ctr)};
 for(let z=0;z<HH;z++)for(let x=0;x<W;x++){if(solid(x,z))continue;
  const a=corner(x,z),b=corner(x+1,z),c=corner(x+1,z+1),e=corner(x,z+1);
  Q4(bf,[a[0],yJ(x,z),a[1]],[b[0],yJ(x+1,z),b[1]],[c[0],yJ(x+1,z+1),c[1]],[e[0],yJ(x,z+1),e[1]],[fcol(x,z),fcol(x+1,z),fcol(x+1,z+1),fcol(x,z+1)],up((a[0]+c[0])/2,(a[1]+c[1])/2))}
 const floor=bf.geo();
 // ── PAREDES (4 orientaciones) ──
 const G=new Map(),CH=7,gkey=(nx,nz,x,z)=>nx+','+nz+','+Math.floor(x/CH)+','+Math.floor(z/CH),grab=(nx,nz,x,z)=>{const cx=Math.floor(x/CH),cz=Math.floor(z/CH),k=gkey(nx,nz,x,z);let g=G.get(k);if(!g)G.set(k,g={nx,nz,x:(cx+.5)*CH-hx,z:(cz+.5)*CH-hz,b:new B(sd+6+cx*31+cz*7+nx*3+nz)});return g.b};   // las paredes se reparten por orientación Y por trozos de 7×7 tiles: Rooms3D baja solo los que tapan al héroe
 const wc=(gx,gz,t)=>{const h=hash(gx,gz,sd+10+t),b=mix(C1,C2,h);return mul(mix(b,CM,t===0?.35*hash(gx,gz,sd+20):0),[.5,.78,.95][t])};
 const edge=(x,z,nx,nz,A,Bc,ka,kb)=>{   // pared entre la celda de suelo (x,z) y la roca en (x+... ) con normal hacia la sala (nx,nz); A,B = esquinas del borde
  const b=grab(nx,nz,x,z),ox=-nx,oz=-nz;
  const L=(p,gk,t)=>{const m=[0,.12+.34*hash(gk[0],gk[1],sd+30),-(.2+.3*hash(gk[0],gk[1],sd+31))][t],y=[0,WALL_H*.45,WALL_H][t];return[p[0]+p[3]*m,y+(t?(hash(gk[0],gk[1],sd+32+t)-.5)*.2:0),p[1]+p[4]*m]};
  const out=[[ox*3,WALL_H*.5,oz*3]];
  for(let t=0;t<2;t++){const a0=L(A,ka,t),b0=L(Bc,kb,t),a1=L(A,ka,t+1),b1=L(Bc,kb,t+1),mx=(a0[0]+b1[0])/2+ox*3,mz=(a0[2]+b1[2])/2+oz*3;
   b.quad(a0,b0,b1,a1,[wc(ka[0],ka[1],t),wc(kb[0],kb[1],t),wc(kb[0],kb[1],t+1),wc(ka[0],ka[1],t+1)],0,[mx,(a0[1]+a1[1])/2,mz])}
  // repisa superior (ancha, vista desde arriba por la cámara)
  const ta=L(A,ka,2),tb=L(Bc,kb,2),ra=[ta[0]+A[3]*1.4,ta[1]+.05,ta[2]+A[4]*1.4],rb=[tb[0]+Bc[3]*1.4,tb[1]+.05,tb[2]+Bc[4]*1.4],cap=mul(C1,.62);
  b.quad(ta,tb,rb,ra,cap,0,[(ta[0]+tb[0])/2,-1,(ta[2]+tb[2])/2]);
  // ESTALACTITAS (≤ 1,3 de largo ≈ 2,3 m) colgando del labio del voladizo; se bajan con la pared que las lleva (cortes de cámara)
  for(let i=0;i<2;i++){const r0=hash(ka[0]*7+i,ka[1]*3+nx*5+nz*2,sd+40+i*3);if(r0>(i?.18:.42))continue;const u=.2+.6*hash(ka[0]+i,kb[1],sd+41),h=.45+.85*hash(ka[1],kb[0]+i,sd+42)*(i?.6:1),rr=.07+.08*hash(ka[0],kb[1]+i,sd+43),
   px=ta[0]+(tb[0]-ta[0])*u+nx*.1,py=ta[1]+(tb[1]-ta[1])*u,pz=ta[2]+(tb[2]-ta[2])*u+nz*.1,cc=mul(mix(C1,C2,hash(px,pz,sd+44)),.74);
   b.cyl(px,py-h+.05,pz,0,rr,h,5,cc,{v:.1,j:.1})}
  // JAMBAS (arreglo 27 oct): cada trozo de pared se baja o sube por SEPARADO (corte de cámara de Rooms3D); donde el vecino de esta esquina es de OTRO trozo, se cierra el canto con una tapa de roca
  // que va de la cara de la pared hasta el fondo de la repisa (mismos puntos que la pared y la repisa) → un trozo alto junto a uno bajo ya no enseña el vacío negro por su canto abierto.
  const jamb=(p,gk,q)=>{let dx=p[3],dz=p[4];if(!dx&&!dz){dx=ox;dz=oz}const pts=[0,1,2].map(t=>L(p,gk,t)),bk=pts.map((v,t)=>[v[0]+dx*1.4,v[1]+(t===2?.05:0),v[2]+dz*1.4]),jc=mul(C1,.55);
   for(let t=0;t<2;t++)b.quad(pts[t],pts[t+1],bk[t+1],bk[t],[mul(wc(gk[0],gk[1],t),.8),mul(wc(gk[0],gk[1],t+1),.8),jc,jc],0,[q[0],WALL_H*.5,q[2]])};
  if(cut(ka))jamb(A,ka,L(Bc,kb,0));if(cut(kb))jamb(Bc,kb,L(A,ka,0))};
 // primero se apunta en qué trozos cae cada esquina de pared; una esquina compartida por trozos distintos lleva jamba
 const segs=[],CG=new Map(),seg=(...a)=>{const k=gkey(a[2],a[3],a[0],a[1]);segs.push(a);for(const c of[a[6],a[7]]){const ck=c[0]*4096+c[1];let st=CG.get(ck);if(!st)CG.set(ck,st=new Set());st.add(k)}};
 const cut=c=>{const st=CG.get(c[0]*4096+c[1]);return st&&st.size>1};
 for(let z=0;z<HH;z++)for(let x=0;x<W;x++){if(solid(x,z))continue;
  if(solid(x-1,z))seg(x,z,1,0,corner(x,z),corner(x,z+1),[x,z],[x,z+1]);
  if(solid(x+1,z))seg(x,z,-1,0,corner(x+1,z),corner(x+1,z+1),[x+1,z],[x+1,z+1]);
  if(solid(x,z-1))seg(x,z,0,1,corner(x,z),corner(x+1,z),[x,z],[x+1,z]);
  if(solid(x,z+1))seg(x,z,0,-1,corner(x,z+1),corner(x+1,z+1),[x,z+1],[x+1,z+1])}
 for(const a of segs)edge(...a);
 const walls=[...G.values()].map(g=>({nx:g.nx,nz:g.nz,x:g.x,z:g.z,geo:g.b.geo()}));
 // ── TECHO (Lote CUEVAS-TECHO): losa oscura sobre toda la planta (+2 celdas de roca, oscureciéndose hacia el vacío). Solo se ve por ARRIBA; Rooms3D le abre un agujero con trama alrededor del héroe ──
 const RH=WALL_H+.4,dl=new Uint8Array(W*HH).fill(9);for(let i=0;i<W*HH;i++)if(mask[i])dl[i]=0;
 for(let pass=1;pass<=2;pass++){const prev=dl.slice();for(let z=0;z<HH;z++)for(let x=0;x<W;x++){if(prev[z*W+x]!==9)continue;let near=false;for(let oz=-1;oz<=1&&!near;oz++)for(let ox=-1;ox<=1;ox++){const xx=x+ox,zz=z+oz;if(xx>=0&&zz>=0&&xx<W&&zz<HH&&prev[zz*W+xx]===pass-1){near=true;break}}if(near)dl[z*W+x]=pass}}
 const br=new B(sd+12),rk=[.24,.17,.08,.04],rc=new Map(),rcol=(gx,gz)=>{const k=gx*4096+gz;let c=rc.get(k);if(c)return c;let n=0,r=0,g=0,bl=0;for(const[cx,cz]of[[gx-1,gz-1],[gx,gz-1],[gx-1,gz],[gx,gz]]){const d=cx<0||cz<0||cx>=W||cz>=HH?3:Math.min(3,dl[cz*W+cx]===9?3:dl[cz*W+cx]),h=hash(cx,cz,sd+13),q=mul(mix(C1,C2,h),rk[d]*(.88+.24*hash(cz,cx,sd+14)));r+=q.r;g+=q.g;bl+=q.b;n++}
  c=new THREE.Color(r/n,g/n,bl/n);rc.set(k,c);return c};   // color por ESQUINA (media de las 4 celdas) → degradado suave en vez de teselas
 for(let z=0;z<HH;z++)for(let x=0;x<W;x++){if(dl[z*W+x]>2)continue;
  const Rq=(gx,gz)=>[gx-hx,RH+(hash(gx,gz,sd+15)-.5)*.1,gz-hz];
  br.tri(Rq(x,z),Rq(x+1,z),Rq(x+1,z+1),[rcol(x,z),rcol(x+1,z),rcol(x+1,z+1)],0,[x+.5-hx,RH-1,z+.5-hz]);br.tri(Rq(x,z),Rq(x+1,z+1),Rq(x,z+1),[rcol(x,z),rcol(x+1,z+1),rcol(x,z+1)],0,[x+.5-hx,RH-1,z+.5-hz])}
 const roof=br.geo();
 // ── DECORADO ──
 const bd=new B(sd+11),lights=[],gl=col(P.glow);
 for(const d of def.deco){const x=d.x-hx,z=d.y-hz,s=d.s,r=hash(x,z,sd+12);
  if(d.k==='estalagmita'){const h=(.35+.9*r)*s;bd.cyl(x,0,z,.2*s,.03,h,5,mul(mix(C1,C2,r),.9),{v:.1});if(r>.55)bd.cyl(x+.22*s,0,z+.1*s,.11*s,.02,h*.55,5,mul(C2,.85),{v:.08})}
  else bd.box(x,0,z,.4*s,.3*s,.34*s,mul(mix(C1,C2,r),.88),{t:.7,jit:.1,my:r*6,v:.08})}
 // ── MENAS (Lote CUEVAS-DOFUS): el nodo (nature3d `mena`) ya está pegado a la pared; aquí solo le damos una luz del color del mineral que lo hace destacar en la oscuridad ──
 for(const q of def.ores||[]){if(q.wx==null)continue;const x=q.x-hx,z=q.y-hz;lights.push({x:x-q.wx*.1,y:.7,z:z-q.wz*.1,col:ORECOL[q.oi]||'#ffd27a',k:'mena'})}
 for(const l of def.lights){const x=l.x-hx,z=l.y-hz;
  if(l.k==='cristal'){for(let i=0;i<5;i++){const a=i*1.3+hash(x,z,i)*2,rr=i?.14+.06*hash(i,x,z):0,h=(i?.35:.8)+.3*hash(x,i,z);bd.cyl(x+Math.cos(a)*rr,0,z+Math.sin(a)*rr,.07,.0,h,5,mul(gl,.8+.4*hash(i,z,x)),{em:3})}bd.cyl(x,0,z,.22,.18,.1,6,mul(C1,.8));lights.push({x,y:.55,z,col:P.glow,k:'cristal'})}
  else{bd.cyl(x,0,z,.035,.03,.28,5,col('#d8d0b8'));bd.cyl(x,.26,z,.17,.02,.1,7,mul(gl,1.0),{em:2});bd.cyl(x+.2,0,z+.1,.025,.02,.16,5,col('#d8d0b8'));bd.cyl(x+.2,.15,z+.1,.1,.02,.07,7,mul(gl,.9),{em:2});lights.push({x,y:.4,z,col:P.glow,k:'seta'})}}
 return{floor,walls,decor:bd.geo(),roof,roofY:RH,lights,P}}
