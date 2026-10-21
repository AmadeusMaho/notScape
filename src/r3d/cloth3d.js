// NotScape · R3D · físicas de ropa (capa, faldones, coletas). Verlet en espacio de MUNDO con paso fijo, restricciones de distancia
// (estructurales, de cizalla y de flexión) y colisión contra cápsulas del cuerpo y el suelo. Sin dependencias de three salvo Vector3/BufferGeometry.
// Uso: const c=new Cloth(nx,ny,rest,{...}); cada fotograma: c.pin(i,x,y,z) para los anclados → c.step(dt,colliders,env) → c.writeSlab(geo) / c.writeRope(geo).
// colliders = [{a:[x,y,z], b:[x,y,z], r}] (cápsulas; a=b para esfera). env = {g, wind:[x,y,z], gust, ground}.
// Determinista: el viento sale del tiempo y de un hash por partícula, nunca de Math.random.
import * as THREE from 'three';

const DT=1/60;
export class Cloth{
 // nx×ny partículas; rest(i,j) → [x,y,z] posición de reposo (en mundo, al crear) para medir longitudes. o.pins = índices anclados.
 constructor(nx,ny,rest,o={}){this.nx=nx;this.ny=ny;const n=nx*ny;this.n=n;this.p=new Float32Array(n*3);this.q=new Float32Array(n*3);this.w=new Float32Array(n).fill(1);
  this.damp=o.damp??.985;this.iters=o.iters??6;this.drag=o.drag??.9;this.lift=o.lift??0;this.th=o.th??.012;this.rad=o.rad??.01;this.acc=0;this.ok=false;
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const k=(j*nx+i)*3,r=rest(i,j);this.p[k]=this.q[k]=r[0];this.p[k+1]=this.q[k+1]=r[1];this.p[k+2]=this.q[k+2]=r[2]}
  (o.pins||[]).forEach(i=>this.w[i]=0);
  const C=[],L=(a,b,s)=>{const d=Math.hypot(this.p[a*3]-this.p[b*3],this.p[a*3+1]-this.p[b*3+1],this.p[a*3+2]-this.p[b*3+2]);C.push(a,b,d,s)};
  const id=(i,j)=>j*nx+i;
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
   if(i<nx-1)L(id(i,j),id(i+1,j),1);if(j<ny-1)L(id(i,j),id(i,j+1),1);                                // estructurales
   if(i<nx-1&&j<ny-1&&!o.rope){L(id(i,j),id(i+1,j+1),.7);L(id(i+1,j),id(i,j+1),.7)}                // cizalla
   if(i<nx-2)L(id(i,j),id(i+2,j),o.bendX??.25);if(j<ny-2)L(id(i,j),id(i,j+2),o.bendY??.35)}         // flexión (rigidez de la tela)
  this.C=new Float32Array(C);this.ph=new Float32Array(n);for(let i=0;i<n;i++)this.ph[i]=Math.sin(i*12.9898+nx*78.233)*43758.5453%1;}
 pin(i,x,y,z){const k=i*3;this.p[k]=x;this.p[k+1]=y;this.p[k+2]=z;if(!this.ok){this.q[k]=x;this.q[k+1]=y;this.q[k+2]=z}}
 // recoloca toda la tela (teletransporte, primer fotograma, cambio de equipo): conserva la forma relativa al ancla 0
 reset(rest){for(let j=0;j<this.ny;j++)for(let i=0;i<this.nx;i++){const k=(j*this.nx+i)*3,r=rest(i,j);this.p[k]=this.q[k]=r[0];this.p[k+1]=this.q[k+1]=r[1];this.p[k+2]=this.q[k+2]=r[2]}this.acc=0}
 step(dt,cols,env){this.acc=Math.min(this.acc+dt,DT*4);let did=0;while(this.acc>=DT){this.acc-=DT;this._sub(cols,env);did=1}this.ok=true;return did}
 _sub(cols,env){const p=this.p,q=this.q,w=this.w,n=this.n,g=env.g??-9.8*.64,dt2=DT*DT,W=env.wind||[0,0,0],T=env.t||0,gu=env.gust??1,dr=this.drag,dm=this.damp;
  for(let i=0;i<n;i++){if(!w[i])continue;const k=i*3,vx=(p[k]-q[k])*dm,vy=(p[k+1]-q[k+1])*dm,vz=(p[k+2]-q[k+2])*dm;q[k]=p[k];q[k+1]=p[k+1];q[k+2]=p[k+2];
   // viento: dirección global + ráfagas por partícula; arrastre del aire = la tela tiende a la velocidad del viento (no acelera sin fin)
   const f=gu*(.85+.2*Math.sin(T*2.3+this.ph[i]*6.28)+.12*Math.sin(T*5.1+i*.7)),ax=(W[0]*f-vx/DT)*dr,ay=(W[1]*f-vy/DT)*dr+this.lift,az=(W[2]*f-vz/DT)*dr;
   p[k]+=vx+ax*dt2;p[k+1]+=vy+(g+ay)*dt2;p[k+2]+=vz+az*dt2}
  const C=this.C,nc=C.length;
  for(let it=0;it<this.iters;it++){
   for(let c=0;c<nc;c+=4){const a=C[c]*3,b=C[c+1]*3,wa=w[C[c]],wb=w[C[c+1]],ws=wa+wb;if(!ws)continue;const dx=p[b]-p[a],dy=p[b+1]-p[a+1],dz=p[b+2]-p[a+2],d=Math.hypot(dx,dy,dz)||1e-6,
     s=(d-C[c+2])/d*C[c+3]/ws;if(C[c+3]>=.99||d>C[c+2]){p[a]+=dx*s*wa;p[a+1]+=dy*s*wa;p[a+2]+=dz*s*wa;p[b]-=dx*s*wb;p[b+1]-=dy*s*wb;p[b+2]-=dz*s*wb}
     else{const k2=.15;p[a]+=dx*s*wa*k2;p[a+1]+=dy*s*wa*k2;p[a+2]+=dz*s*wa*k2;p[b]-=dx*s*wb*k2;p[b+1]-=dy*s*wb*k2;p[b+2]-=dz*s*wb*k2}} // flexión/cizalla: resiste poco al comprimirse (la tela se pliega en vez de hacer de muelle)
   this._collide(cols,env)}}
 _collide(cols,env){const p=this.p,w=this.w,n=this.n,gy=env.ground??-1e9,R=this.rad;
  for(let i=0;i<n;i++){if(!w[i])continue;const k=i*3;let x=p[k],y=p[k+1],z=p[k+2];
   for(const c of cols){const a=c.a,b=c.b,abx=b[0]-a[0],aby=b[1]-a[1],abz=b[2]-a[2],l2=abx*abx+aby*aby+abz*abz;let u=l2?((x-a[0])*abx+(y-a[1])*aby+(z-a[2])*abz)/l2:0;u=u<0?0:u>1?1:u;
    const cx=a[0]+abx*u,cy=a[1]+aby*u,cz=a[2]+abz*u,dx=x-cx,dy=y-cy,dz=z-cz,d=Math.hypot(dx,dy,dz),r=c.r+R;
    if(d<r){if(d>1e-6){const s=r/d;x=cx+dx*s;y=cy+dy*s;z=cz+dz*s}else{x=cx+(c.out?c.out[0]:0)*r;z=cz+(c.out?c.out[2]:-1)*r}}}
   if(y<gy+R)y=gy+R;p[k]=x;p[k+1]=y;p[k+2]=z}}
 // ── mallas ── la tela se dibuja como LÁMINA CON GROSOR (cara, dorso y canto): así el casco de contorno (inkMat) funciona y se ve el canto de la capa.
 slabGeo(){const nx=this.nx,ny=this.ny,n=this.n,g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*2*3),3));g.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(n*2*3),3));
  const uv=new Float32Array(n*2*2);for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const k=j*nx+i;uv[k*2]=i/(nx-1);uv[k*2+1]=j/(ny-1);uv[(k+n)*2]=i/(nx-1);uv[(k+n)*2+1]=j/(ny-1)}g.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  const I=[],id=(i,j)=>j*nx+i;for(let j=0;j<ny-1;j++)for(let i=0;i<nx-1;i++){const a=id(i,j),b=id(i+1,j),c=id(i+1,j+1),d=id(i,j+1);I.push(a,d,b,b,d,c, a+n,b+n,d+n,b+n,c+n,d+n)}
  const edge=[];for(let i=0;i<nx-1;i++)edge.push([id(i,0),id(i+1,0)]);for(let j=0;j<ny-1;j++)edge.push([id(nx-1,j),id(nx-1,j+1)]);for(let i=nx-1;i>0;i--)edge.push([id(i,ny-1),id(i-1,ny-1)]);for(let j=ny-1;j>0;j--)edge.push([id(0,j),id(0,j-1)]);
  edge.forEach(([a,b])=>I.push(a,b,a+n,b,b+n,a+n));g.setIndex(I);g.userData.nrm=new Float32Array(n*3);return g}
 writeSlab(g){const nx=this.nx,ny=this.ny,n=this.n,p=this.p,N=g.userData.nrm,P=g.attributes.position.array,th=this.th*.5;
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const k=j*nx+i,l=(j*nx+Math.max(0,i-1))*3,r=(j*nx+Math.min(nx-1,i+1))*3,u=(Math.max(0,j-1)*nx+i)*3,d=(Math.min(ny-1,j+1)*nx+i)*3;
   const ax=p[r]-p[l],ay=p[r+1]-p[l+1],az=p[r+2]-p[l+2],bx=p[d]-p[u],by=p[d+1]-p[u+1],bz=p[d+2]-p[u+2];let x=ay*bz-az*by,y=az*bx-ax*bz,z=ax*by-ay*bx;const L=Math.hypot(x,y,z)||1;x/=L;y/=L;z/=L;N[k*3]=x;N[k*3+1]=y;N[k*3+2]=z;
   const q=k*3;P[q]=p[q]+x*th;P[q+1]=p[q+1]+y*th;P[q+2]=p[q+2]+z*th;P[(k+n)*3]=p[q]-x*th;P[(k+n)*3+1]=p[q+1]-y*th;P[(k+n)*3+2]=p[q+2]-z*th}
  g.attributes.position.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere()}
 // cuerda (coletas): anillos de `sides` lados alrededor de cada partícula de la columna 0, que se afinan hacia la punta
 ropeGeo(sides,r0,r1){const n=this.n,g=new THREE.BufferGeometry(),V=(n*sides+2);g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(V*3),3));const I=[];
  for(let j=0;j<n-1;j++)for(let s=0;s<sides;s++){const a=j*sides+s,b=j*sides+(s+1)%sides,c=a+sides,d=b+sides;I.push(a,c,b,b,c,d)}
  const t0=n*sides,t1=t0+1;for(let s=0;s<sides;s++){I.push(t0,s,(s+1)%sides);I.push(t1,(n-1)*sides+(s+1)%sides,(n-1)*sides+s)}g.setIndex(I);g.userData={sides,r0,r1};return g}
 writeRope(g,up){const n=this.n,p=this.p,{sides,r0,r1}=g.userData,P=g.attributes.position.array,U=new THREE.Vector3(...(up||[1,0,0])),T=new THREE.Vector3(),A=new THREE.Vector3(),B=new THREE.Vector3();
  for(let j=0;j<n;j++){const a=Math.max(0,j-1)*3,b=Math.min(n-1,j+1)*3;T.set(p[b]-p[a],p[b+1]-p[a+1],p[b+2]-p[a+2]).normalize();A.crossVectors(T,U);if(A.lengthSq()<1e-6)A.set(0,0,1);A.normalize();B.crossVectors(T,A).normalize();
   const r=r0+(r1-r0)*Math.pow(j/(n-1),1.2);for(let s=0;s<sides;s++){const an=s/sides*Math.PI*2,c=Math.cos(an)*r,si=Math.sin(an)*r,k=(j*sides+s)*3;P[k]=p[j*3]+A.x*c+B.x*si;P[k+1]=p[j*3+1]+A.y*c+B.y*si;P[k+2]=p[j*3+2]+A.z*c+B.z*si}}
  const t0=n*sides*3;P[t0]=p[0];P[t0+1]=p[1];P[t0+2]=p[2];const e=(n-1)*3;P[t0+3]=p[e]+T.x*r1;P[t0+4]=p[e+1]+T.y*r1;P[t0+5]=p[e+2]+T.z*r1;
  g.attributes.position.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere()}
}
