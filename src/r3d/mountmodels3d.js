// NotScape · R3D · MODELOS DE MONTURA (lote DOMAR-D3-MODELOS, 29 oct 2026) · 36 especies domables (4 por bioma) + 3 monturas únicas raras.
// ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// UNA SOLA FUENTE: cada especie se describe UNA vez (función de `SPEC`) y de ahí salen el ANIMAL SALVAJE (actors3d.js, plantilla horneada) y la MONTURA (mount3d.js, con silla
// y bridas de la cultura de su bioma). Regla «montura = salvaje + silla» (docs/PLAN_DOMAR.md): nunca un segundo modelo.
// CONSTRUCTOR (`Bld`): huesos con nombre (root, body, head, legFL/FR/BL/BR, tail, tail2, wingL/wingR) y primitivas en COORDENADAS DE MODELO (suelo y=0, +z = hacia delante,
// 1 unidad ≈ 1,75 m = el héroe). Cada primitiva se asigna al hueso activo (`S.on(nombre)`) y se pasa a su espacio local. Cada hueso = UNA geometría con normal PLANA por cara
// (pintado facetado), color por vértice con DEGRADADO opcional (`lo` = color de abajo: contrasombreado del vientre) y variación ±6 % por cara; `em` = aEmit (2 = brillo de fuego/runa).
// Las FAMILIAS (`ungulate`, `carnivore`, `saurian`, `avian` y piezas sueltas) son código compartido como los `seg/hornC/leg4` de la fauna; cada especie tiene proporciones,
// cabeza, marcas y extras propios (silueta distinta). Especie nueva = una función en SPEC + su fila en src/mountdata.js. Visor: docs/style-reference/r3d/monturas-3d.html.
import * as THREE from 'three';

const PI=Math.PI,_q=new THREE.Quaternion(),_m=new THREE.Matrix4(),_e=new THREE.Euler(),_v=new THREE.Vector3(),_s=new THREE.Vector3(),_d=new THREE.Vector3(),UP=new THREE.Vector3(0,1,0);
const GEO={hi:new THREE.SphereGeometry(1,12,8),md:new THREE.SphereGeometry(1,8,6),lo:new THREE.SphereGeometry(1,6,4),bx:new THREE.BoxGeometry(1,1,1)};
const hs=(a,b,c)=>{const h=Math.sin(a*127.1+b*311.7+c*74.7)*43758.5453;return h-Math.floor(h)};
// ruido de valor 3D (determinista) para las marcas pintadas
const vn=(x,y,z)=>{const X=Math.floor(x),Y=Math.floor(y),Z=Math.floor(z),fx=x-X,fy=y-Y,fz=z-Z,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),w=fz*fz*(3-2*fz),L=(i,j,k)=>hs(X+i,Y+j,Z+k),
 a=L(0,0,0)+(L(1,0,0)-L(0,0,0))*u,b=L(0,1,0)+(L(1,1,0)-L(0,1,0))*u,c=L(0,0,1)+(L(1,0,1)-L(0,0,1))*u,d=L(0,1,1)+(L(1,1,1)-L(0,1,1))*u,e=a+(b-a)*v,f=c+(d-c)*v;return e+(f-e)*w};
const fb=(x,y,z)=>.65*vn(x,y,z)+.35*vn(x*2.1+5.3,y*2.1+3.1,z*2.1+1.7),sm=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
// fábricas de pintura (ver Gm.paint)
const PNT={
 pinto:(c,k,th)=>(x,y,z)=>{const n=fb(x*k+11,y*k+2,z*k);return n>th?[c,sm(th,th+.035,n)]:null},
 stripe:(c,wd,ymin)=>(x,y,z,nx,ny)=>Math.abs(x)<wd&&y>ymin&&ny>.3?[c,1-Math.abs(x)/wd*.4]:null,
 spots:(c,k,r,ymin)=>(x,y,z,nx,ny)=>{if(y<ymin||ny<-.4)return null;const X=x*k,Y=y*k,Z=z*k,cx=Math.floor(X),cy=Math.floor(Y),cz=Math.floor(Z),px=cx+.2+hs(cx,cy,cz)*.6,py=cy+.2+hs(cy,cz,cx)*.6,pz=cz+.2+hs(cz,cx,cy)*.6,d=Math.hypot(X-px,Y-py,Z-pz);return d<r?[c,sm(r,r*.6,d)]:null},
 tiger:(c,f,ymin)=>(x,y,z,nx,ny)=>{if(ny<-.45||y<ymin)return null;const v=Math.sin(z*f+fb(x*3,y*3,z*3)*6.5+Math.abs(x)*5+y*7);return v>.6?[c,sm(.6,.7,v)]:null},
 veins:(c,k,th,em)=>(x,y,z)=>{const n=Math.abs(fb(x*k+3,y*k,z*k+7)-.5);return n<th?[c,sm(th,th*.35,n),em]:null},
 bands:(c,f,ymin)=>(x,y,z,nx,ny)=>ny>-.2&&y>ymin&&Math.sin(z*f)>.45?[c,.85]:null};
const CC=new Map(),cc=h=>{if(h&&h.isColor)return h;let c=CC.get(h);if(!c){c=new THREE.Color(h);CC.set(h,c)}return c};
const sh=(h,k)=>'#'+cc(h).clone().multiplyScalar(k).getHexString(),mx=(a,b,t)=>'#'+cc(a).clone().lerp(cc(b),t).getHexString();
const _a=new THREE.Color(),_b=new THREE.Color();

// ── colector por hueso ──
class Gm{
 constructor(sd,o){this.P=[];this.N=[];this.C=[];this.E=[];this.F=[];this.sd=sd;this.n=0;this.o=o}
 push(geo,c,m,o){const g=geo.index?geo.toNonIndexed():geo.clone();if(!g.boundingBox)g.computeBoundingBox();const bb=g.boundingBox,y0=bb.min.y,yr=Math.max(1e-6,bb.max.y-y0),src=g.attributes.position.array,ty=new Float32Array(src.length/3);
  for(let i=0;i<ty.length;i++)ty[i]=(src[i*3+1]-y0)/yr;g.applyMatrix4(m);g.computeVertexNormals();const p=g.attributes.position.array,n=g.attributes.normal.array,top=cc(c),lo=o.lo?cc(o.lo):null,em=o.em||0,J=o.j==null?.08:o.j;
  for(let i=0;i<p.length;i+=9){const k=1+(hs(this.sd,this.n++,i)-.5)*J;for(let j=0;j<9;j+=3){const vi=(i+j)/3;this.P.push(p[i+j],p[i+j+1],p[i+j+2]);this.N.push(n[i],n[i+1],n[i+2]);
   if(lo){_a.copy(lo).lerp(top,Math.min(1,ty[vi]*1.15));this.C.push(_a.r*k,_a.g*k,_a.b*k)}else this.C.push(top.r*k,top.g*k,top.b*k);this.E.push(em);this.F.push(o.np?0:1)}}g.dispose()}
 // PINTURA (manchas, rayas, grietas): fn(x,y,z,nx,ny,nz) en coordenadas de modelo → null | [color, cantidad 0..1, aEmit?]; solo en lo marcado como piel (no en la silla)
 paint(L){if(!L.length)return;const o=this.o,P=this.P;for(let f=0;f<this.F.length;f+=3){if(!this.F[f])continue;const x=(P[f*3]+P[f*3+3]+P[f*3+6])/3+o[0],y=(P[f*3+1]+P[f*3+4]+P[f*3+7])/3+o[1],z=(P[f*3+2]+P[f*3+5]+P[f*3+8])/3+o[2];
  for(const fn of L){const r=fn(x,y,z,this.N[f*3],this.N[f*3+1],this.N[f*3+2]);if(!r||!(r[1]>0))continue;const c=cc(r[0]),a=Math.min(1,r[1]),k=1+(hs(f,this.sd,3)-.5)*.08;
   for(let v=f;v<f+3;v++){this.C[v*3]+=(c.r*k-this.C[v*3])*a;this.C[v*3+1]+=(c.g*k-this.C[v*3+1])*a;this.C[v*3+2]+=(c.b*k-this.C[v*3+2])*a;if(r[2]&&a>.5)this.E[v]=r[2]}}}}
 geo(){if(!this.P.length)return null;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(this.N,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(this.C,3));g.setAttribute('aEmit',new THREE.Float32BufferAttribute(this.E,1));g.computeBoundingSphere();return g}
}
// ── constructor de especie (independiente del motor: mount3d.js hace grupos, actors3d.js hornea un SkinnedMesh) ──
class Bld{
 constructor(seed,sad,cul){this.B=[];this.G={};this.g=null;this.sad=sad;this.cul=cul;this.seed=seed;this.top=0;this.zmin=0;this.zmax=0;this.PT=[];this.np=0}
 paint(fn){this.PT.push(fn);return this}
 // altura REAL del lomo: el punto más alto de la malla del cuerpo cerca de (x≈0, z) (jorobas, cuellos y pechos altos incluidos); la silla y el jinete se apoyan ahí
 topAt(z,dz=.12,dx=.07){const g=this.G.body;if(!g)return 0;const o=g.o;let t=-1e9;for(let i=0;i<g.P.length;i+=3){const x=g.P[i]+o[0],y=g.P[i+1]+o[1],zz=g.P[i+2]+o[2];if(Math.abs(x)<dx&&Math.abs(zz-z)<dz&&y>t)t=y}return t}
 bone(n,p,x,y,z){this.B.push({n,p,o:[x,y,z]});this.G[n]=new Gm(this.seed*13+this.B.length*7,[x,y,z]);return this}
 on(n){this.g=this.G[n];return this}
 _t(x,y,z){const o=this.g.o;if(y>this.top)this.top=y;if(z<this.zmin)this.zmin=z;if(z>this.zmax)this.zmax=z;return _v.set(x-o[0],y-o[1],z-o[2])}
 // elipsoide: centro, semiejes, color; o.r = giro [x,y,z], o.lo = color inferior, o.em, o.d = detalle (hi|md|lo)
 e(x,y,z,rx,ry,rz,c,o={}){const r=o.r||[0,0,0];_e.set(r[0],r[1],r[2]);_q.setFromEuler(_e);const M=Math.max(rx,ry,rz);_m.compose(this._t(x,y+ry*.0,z),_q,_s.set(rx,ry,rz));
  if(y+ry>this.top)this.top=y+ry;this.g.push(GEO[o.d||(M>.11?'hi':M>.045?'md':'lo')],c,_m,this.np?Object.assign({np:1},o):o);return this}
 // miembro ahusado de p a q (radios r0→r1); o.n = lados, o.j = esfera en la articulación p
 l(p,q,r0,r1,c,o={}){_d.set(q[0]-p[0],q[1]-p[1],q[2]-p[2]);const L=_d.length();if(L<1e-5)return this;_q.setFromUnitVectors(UP,_d.normalize());
  _m.compose(this._t((p[0]+q[0])/2,(p[1]+q[1])/2,(p[2]+q[2])/2),_q,_s.set(1,1,1));const g=new THREE.CylinderGeometry(r1,r0,L,o.n||8,1);this.g.push(g,c,_m,this.np?Object.assign({np:1},o):o);g.dispose();
  if(o.jt)this.e(q[0],q[1],q[2],r1*1.02,r1*1.02,r1*1.02,c,{d:'lo',lo:o.lo&&c});return this}
 // cono: base en p (radio r), punta en q
 k(p,q,r,c,o={}){_d.set(q[0]-p[0],q[1]-p[1],q[2]-p[2]);const L=_d.length();if(L<1e-5)return this;_q.setFromUnitVectors(UP,_d.normalize());
  _m.compose(this._t((p[0]+q[0])/2,(p[1]+q[1])/2,(p[2]+q[2])/2),_q,_s.set(1,1,1));const g=new THREE.ConeGeometry(r,L,o.n||7,1);this.g.push(g,c,_m,this.np?Object.assign({np:1},o):o);g.dispose();if(q[1]>this.top)this.top=q[1];return this}
 // cuerno/rama curva: cadena de puntos con radio que se afila
 hn(pts,r0,c,o={}){const n=pts.length-1,tp=o.tip||c;for(let i=0;i<n;i++){const a=r0*(1-i/n*.85),b=r0*(1-(i+1)/n*.85);if(i===n-1&&o.sharp!==false)this.k(pts[i],pts[i+1],a,tp,o);else this.l(pts[i],pts[i+1],a,b,i>=n-2?tp:c,Object.assign({jt:1},o))}return this}
 b(x,y,z,w,h,d,c,o={}){const r=o.r||[0,0,0];_e.set(r[0],r[1],r[2]);_q.setFromEuler(_e);_m.compose(this._t(x,y,z),_q,_s.set(w,h,d));this.g.push(GEO.bx,c,_m,this.np?Object.assign({np:1},o):o);return this}
 t(x,y,z,R,r,c,o={}){const rr=o.r||[0,0,0];_e.set(rr[0],rr[1],rr[2]);_q.setFromEuler(_e);_m.compose(this._t(x,y,z),_q,_s.set(1,1,1));const g=new THREE.TorusGeometry(R,r,5,o.n||12,o.arc||PI*2);this.g.push(g,c,_m,this.np?Object.assign({np:1},o):o);g.dispose();return this}
 // arco (tela que abraza el cuerpo): cilindro abierto alrededor del eje z, centrado arriba; sx/sy = semiejes del cuerpo, span = medio ángulo, len = largo en z
 arc(x,y,z,sx,sy,len,span,c,o={}){_m.compose(this._t(x,y,z),_q.setFromEuler(_e.set(PI/2,0,0)),_s.set(sx,1,sy));const g=new THREE.CylinderGeometry(1,1,len,o.n||14,1,true,PI-span,span*2);this.g.push(g,c,_m,this.np?Object.assign({np:1},o):o);g.dispose();return this}
 // polígono en abanico (desde pts[0]) con las dos caras: membranas de ala y plumajes
 poly(pts,c,o={}){const g=new THREE.BufferGeometry(),A=[],b=this.g.o;for(let i=1;i<pts.length-1;i++){const t=[pts[0],pts[i],pts[i+1]];for(const q of t)A.push(q[0]-b[0],q[1]-b[1],q[2]-b[2]);for(const q of[t[0],t[2],t[1]])A.push(q[0]-b[0],q[1]-b[1],q[2]-b[2]);for(const q of t)if(q[1]>this.top)this.top=q[1]}
  g.setAttribute('position',new THREE.Float32BufferAttribute(A,3));this.g.push(g,c,_m.identity(),this.np?Object.assign({np:1},o):o);g.dispose();return this}
 // faldón de pelo: anillo elíptico alrededor del cuerpo (centro x,z; semiejes sx,sz) de y0 a y1 con el borde de abajo deshilachado (mechones)
 fringe(x,z,sx,sz,y0,y1,c,o={}){const n=o.n||36,A=[],b=this.g.o,rag=o.rag||.08,fl=o.flare||1.12,P=(a,y,k)=>[x+Math.sin(a)*sx*k-b[0],y-b[1],z+Math.cos(a)*sz*k-b[2]];
  for(let i=0;i<n;i++){const a0=i/n*PI*2,a1=(i+1)/n*PI*2,am=(a0+a1)/2,d=y1-rag*(.4+hs(i,7,this.seed)*.9),t0=P(a0,y0,1),t1=P(a1,y0,1),bm=P(am,d,fl),b0=P(a0,y1+rag*.3,fl*.98),b1=P(a1,y1+rag*.3,fl*.98);
   for(const t of[[t0,b0,bm],[t0,bm,t1],[t1,bm,b1]]){A.push(...t[0],...t[1],...t[2]);A.push(...t[0],...t[2],...t[1])}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(A,3));this.g.push(g,c,_m.identity(),this.np?Object.assign({np:1},o):o);g.dispose();return this}
 // TUBO continuo por secciones [{p, n (normal arriba), rx (lado), rd (alto)}]: cuellos sin aros; abierto por los extremos (quedan dentro del pecho y la cabeza)
 tube(L,c,o={}){const R=o.r||12,b=this.g.o,V=(q,a)=>[q.p[0]+Math.cos(a)*q.rx-b[0],q.p[1]+q.n[1]*Math.sin(a)*q.rd-b[1],q.p[2]+q.n[2]*Math.sin(a)*q.rd-b[2]],A=[];
  for(let i=0;i<L.length-1;i++)for(let j=0;j<R;j++){const a0=j/R*PI*2,a1=(j+1)/R*PI*2,p00=V(L[i],a0),p01=V(L[i],a1),p10=V(L[i+1],a0),p11=V(L[i+1],a1);A.push(...p00,...p01,...p10,...p01,...p11,...p10)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(A,3));this.g.push(g,c,_m.identity(),this.np?Object.assign({np:1},o):o);g.dispose();return this}
 gl(x,y,z,r,c){return this.e(x,y,z,r,r,r,c,{em:2,d:'lo',j:0,np:1})}
 eye(x,y,z,r,c,glow){for(const s of[-1,1]){if(glow)this.gl(s*x,y,z,r,c);else{this.e(s*x,y,z,r,r*1.1,r*.8,c||'#15100c',{d:'lo',j:0,np:1});this.e(s*(x+r*.25),y+r*.4,z+r*.4,r*.3,r*.3,r*.3,'#fff6e0',{d:'lo',j:0,np:1})}}return this}
}
// CUELLO CURVO: cadena de elipsoides a lo largo de una Bézier cuadrática nb→nt con el control desplazado (arco); sección más profunda en la base (rd) que de lado (rx).
// Devuelve la lista de puntos {p, d (tangente), n (normal de la cresta), rd} para colgar crines y papada.
function neck(S,nb,nt,o,C,B){const n=Math.max(10,o.n||10),cp=[0,(nb[1]+nt[1])/2+(o.arch||0),(nb[2]+nt[2])/2-(o.arch||0)*.7],L=[];
 for(let i=0;i<=n;i++){const t=i/n,u=1-t,p=[0,u*u*nb[1]+2*u*t*cp[1]+t*t*nt[1],u*u*nb[2]+2*u*t*cp[2]+t*t*nt[2]],d=[0,2*u*(cp[1]-nb[1])+2*t*(nt[1]-cp[1]),2*u*(cp[2]-nb[2])+2*t*(nt[2]-cp[2])],l=Math.hypot(d[1],d[2])||1;d[1]/=l;d[2]/=l;
  const rx=o.rx0+(o.rx1-o.rx0)*t,rd=o.rd0+(o.rd1-o.rd0)*t,th=Math.atan2(d[2],d[1]),seg=Math.hypot(nt[1]-nb[1],nt[2]-nb[2])/n;
  const nn=[0,d[2],-d[1]],up=rd*.28*(1-t);p[1]+=nn[1]*up;p[2]+=nn[2]*up;   /* sin papada: la sección se desplaza hacia la cresta (el borde inferior sube y queda recto hasta el pecho) */
  L.push({p,d,n:nn,rd,rx})}
 S.tube(L,C,{lo:B&&mx(C,B,.35)});return L}   /* UNA malla continua (antes elipsoides encadenados: con el contorno parecían neumáticos apilados) */
// punto a lo largo del eje de la cabeza: base p, inclinación a (0 = horizontal, + = hacia abajo); `up` = normal superior
const HD=(p,a)=>{const f=[0,-Math.sin(a),Math.cos(a)],u=[0,Math.cos(a),Math.sin(a)];return{P:(t,uu=0,x=0)=>[p[0]+x,p[1]+f[1]*t+u[1]*uu,p[2]+f[2]*t+u[2]*uu],r:[a,0,0]}};

// ═════════════════════ PIEZAS DE CULTURA: silla, bridas (solo en la montura) ═════════════════════
// cul = índice de bioma (0 Pradera … 8 Costa) o 9 = rara. Colores y adornos por cultura (no es un modelo de animal: es el aparejo, como el equipo del héroe).
const TACK=[
 {bl:'#8a2e2a',tr:'#c8a060',le:'#6a3e24',me:'#9a9aa2'},{bl:'#3f6a3a',tr:'#c8b070',le:'#5a4a2a',me:'#b08a4a',leaf:'#6a9a3a'},{bl:'#7a6a3a',tr:'#d8ceb0',le:'#4a3a24',me:'#d8ceb0',bone:1},
 {bl:'#d8d0c0',tr:'#7a5a3a',le:'#5a3e2a',me:'#7a7e86',fur:1},{bl:'#9a2a22',tr:'#d8b050',le:'#2a1a18',me:'#d8b050',tas:'#d8b050'},{bl:'#3a3434',tr:'#ff7a2a',le:'#3a2620',me:'#4a4444',spike:1,glow:'#ff7a2a'},
 {bl:'#4a3a6a',tr:'#d8d0bc',le:'#2e2a34',me:'#d8d0bc',bone:1,glow:'#b890ff'},{bl:'#b8502a',tr:'#e8c060',le:'#7a4a2a',me:'#e8c060',tas:'#e8c060',rug:1},{bl:'#2a3a5a',tr:'#c8a870',le:'#5a3a24',me:'#c89a4a',rope:1},
 {bl:'#3a1a4a',tr:'#e8cf94',le:'#2a1a20',me:'#e8cf94',tas:'#e8cf94',glow:'#e8cf94'}];
// aparejo por TIER (silla `sd<i>` y brida `br<i>` equipadas): cuero y metal del tier; los adornos de cultura se conservan
const TLE=['#9a6a34','#8a5a2a','#7a4a22','#6a4a3a','#8a8a9a','#6b4a32','#4a3a2a','#8a3a3a','#5a3a6a','#c8742a','#e8e0c8','#d8c8ff'],TME=['#c8742a','#c8842a','#8a8a98','#c8d4de','#e8e8f0','#f1e6c4','#4a7aff','#3adf6a','#3ad0d8','#e89a3a','#b8301c','#c8a0ff'];
const tackOf=(S,k)=>{const T=TACK[S.cul]||TACK[0],t=S.tk&&S.tk[k];return t==null?T:Object.assign({},T,{le:TLE[t],me:TME[t],tr:t>=5?TME[t]:T.tr})};
function saddle(S,m){{const tp=S.topAt(m.sz);if(tp>m.back){m.back=tp-.012;m.seat=m.back+.045-.04}}if(!S.sad)return;S.np=1;const T=tackOf(S,'sd'),y=m.back,z=m.sz,w=m.bw,fw=m.fw,sy=m.seat-.075,bh=m.bh||.24;S.on('body');
 const cy=y-bh;S.arc(0,cy,z-.02,w*1.05,bh*1.05,.4,1.05,T.bl,{lo:sh(T.bl,.7)});S.arc(0,cy,z-.02,w*1.045,bh*1.045,.43,1.1,T.tr,{n:16});S.arc(0,cy,z-.01,w*1.08,bh*1.08,.2,.85,T.le,{lo:sh(T.le,.7)});
 if(T.rug)for(const s of[-1,1])for(let i=-2;i<=2;i++){const q=[s*w*Math.sin(1.05)*1.05,y-bh+bh*1.05*Math.cos(PI-1.05)*-1,z-.02+i*.08];S.l(q,[q[0]*1.01,q[1]-.04,q[2]],.004,.004,T.tas,{n:4});S.e(q[0]*1.01,q[1]-.05,q[2],.009,.016,.009,T.tas,{d:'lo'})}
 if(T.fur){S.arc(0,y-bh,z-.02,w*1.075,bh*1.075,.46,.9,'#e0d8c8',{lo:'#b8b0a0',j:.25});S.e(0,y+.03,z-.19,w*.6,.035,.04,'#e8e0d0',{d:'md',j:.25})}
 S.e(0,y+.026,z-.03,w*.6,.03,.14,T.le,{lo:sh(T.le,.7)});S.e(0,y+.06,z-.14,w*.5,.04,.026,T.le);S.e(0,y+.05,z+.1,.036,.04,.034,T.le);S.l([0,y+.075,z+.11],[0,y+.11,z+.125],.012,.017,T.me);

 for(const s of[-1,1]){S.l([s*w*.98,y-.06,z+.07],[s*w*.55,y-2*bh+.02,z+.07],.016,.016,T.le,{n:5});S.l([s*w*.98,y-.01,z-.02],[s*fw,sy+.03,z-.0],.008,.008,T.le,{n:4});
  S.t(s*fw,sy,z,.032,.008,T.me,{r:[0,PI/2,0],n:10});S.b(s*fw,sy-.03,z,.03,.012,.07,T.me)}
 S.l([-.6*w,y-2*bh+.03,z+.07],[.6*w,y-2*bh+.03,z+.07],.016,.016,T.le,{n:5});
 if(T.leaf)for(const s of[-1,1])for(let i=0;i<4;i++)S.e(s*w*.9,y-.15,z-.17+i*.1,.006,.04,.022,T.leaf,{r:[.3,0,s*.45],d:'lo'});
 if(T.bone){for(const s of[-1,1])S.k([s*w*.45,y+.04,z-.16],[s*w*.52,y+.1,z-.21],.009,T.me,{n:5});S.e(0,y+.055,z+.15,.018,.016,.018,'#e8e0c8',{d:'lo'})}
 if(T.tas)for(const s of[-1,1]){S.l([s*w*.95,y-.12,z-.24],[s*w*.98,y-.25,z-.25],.006,.006,T.tas,{n:4});S.e(s*w*.98,y-.27,z-.25,.015,.03,.015,'#b8302a',{d:'lo'})}
 if(T.spike)for(const s of[-1,1])S.k([s*w*.45,y+.06,z-.15],[s*w*.55,y+.12,z-.2],.011,T.me);
 if(T.glow){S.gl(0,y+.06,z+.18,.018,T.glow);for(const s of[-1,1])S.gl(s*w*.95,y-.12,z-.02,.012,T.glow)}
 if(T.rope)for(const s of[-1,1])S.t(s*w*.92,y-.05,z-.17,.028,.008,T.tr,{r:[0,PI/2,0],n:10});S.np=0}
// brida: muserola, carrilleras y riendas hasta la perilla de la silla (en el hueso de la cabeza: se mueven con ella)
function bridle(S,m,h){if(!S.sad||!h)return;S.np=1;const T=tackOf(S,'br'),{P,r}=h.hd,mz=h.mz,mr=h.mr;S.on('head');
 S.t(...P(mz,0),mr*1.05,.009,T.le,{r:[r[0],0,0],n:12});for(const s of[-1,1]){const bt=P(mz,-mr*.3,s*mr*1.05);S.t(bt[0],bt[1],bt[2],.016,.005,T.me,{r:[0,PI/2,0],n:8});
  S.l(bt,P(h.poll||0,mr*.6,s*mr*1.1),.008,.008,T.le,{n:4});S.l(bt,[s*m.bw*.45,m.back+.08,m.sz+.11],.005,.005,T.le,{n:4})}S.np=0}

// ═════════════════════ FAMILIAS ═════════════════════
// ── UNGULADOS (caballos, asnos, bóvidos, cérvidos, camélidos, antílopes, rinoceronte, mamut): cuerpo, patas de casco y cola; la CABEZA va por tipo (o.head) ──
function ungulate(S,o){
 const lg=o.lg||1,ln=o.ln||1,w=o.w||1,hh=o.h||1,LH=.64*lg,by=LH+.1*hh,bw=.215*w,bh=.24*hh,zf=.4*ln,zb=-.4*ln,C=o.col,B=o.bel||sh(C,.8),D=o.dk||sh(C,.45),Hf=o.hoof||'#2a2420',sock=o.sock||[0,0,0,0],W=o.sockC||'#ece4d4',pad=o.pad;
 S.bone('root',null,0,0,0).bone('body','root',0,by,0);
 const lx=bw*.62,fz=zf+.02,bz=zb-.02;S.bone('legFL','body',lx,LH,fz).bone('legFR','body',-lx,LH,fz).bone('legBL','body',lx,LH+.03,bz).bone('legBR','body',-lx,LH+.03,bz);
 S.on('body');
 S.e(0,by,0,bw,bh,.47*ln,C,{lo:B});S.e(0,by+.02*hh,zf,bw*.96*(o.chest||1),bh*1.04*(o.chest||1),.26,C,{lo:B});S.e(0,by+.03,zb,bw*1.05*(o.hip||1),bh*(o.hip||1),.27,C,{lo:B});
 S.e(0,by+bh*.72,zb+.06,bw*.7,bh*.3,.2,C);S.e(0,by+bh*.8,zf-.1,bw*.5,bh*.32,.17,o.wcol||C);S.e(0,by-bh*.5,.02,bw*.8,bh*.5,.4*ln,B);
 for(const s of[-1,1]){S.e(s*bw*.62,by-.03,zf+.03,.085*w,.17*hh,.13,C,{r:[.35,0,0],lo:B});S.e(s*bw*.7,by+.01,zb-.03,.1*w,.2*hh,.17,C,{lo:B})}
 if(o.pinto)S.paint(PNT.pinto(...o.pinto));if(o.stripe)S.paint(PNT.stripe(o.stripe,.035,by+bh*.6));if(o.pnt)o.pnt.forEach(f=>S.paint(f));
 // patas
 const leg=(n,x,z,rear,sk)=>{S.on(n);const k=sk?W:C,F=o.lc||C,y0=LH;
  if(!rear){S.e(x,y0-.04,z,.075*w,.13,.085,C,{lo:F});S.l([x,y0,z],[x,y0*.52,z+.01],.068*w*(o.lt||1),.046*(o.lt||1),F,{jt:1});S.l([x,y0*.52,z+.01],[x,y0*.18,z+.02],.036*(o.lt||1),.031*(o.lt||1),k)}
  else{S.l([x,y0+.03,z+.05],[x,y0*.5,z-.08],.075*w*(o.lt||1),.045*(o.lt||1),F,{jt:1});S.l([x,y0*.5,z-.08],[x,y0*.18,z-.05],.036*(o.lt||1),.031*(o.lt||1),k);z=z-.05+.02-.01}
  const zz=rear?z:z+.02;S.e(x,y0*.17,zz,.042*(o.lt||1),.042,.046,k,{d:'md'});
  if(o.feather)S.e(x,.1,zz+.02,.05,.06,.055,W,{j:.25});
  if(pad){S.l([x,y0*.17,zz],[x,.05,zz+.02],.034,.05,k);S.e(x,.035,zz+.03,.075,.035,.085,pad,{d:'md'});return}
  S.l([x,y0*.17,zz],[x,.065,zz+.035],.033*(o.lt||1),.033*(o.lt||1),k);
  if(o.cloven){for(const s of[-1,1])S.l([x+s*.016,.065,zz+.035],[x+s*.02,0,zz+.06],.022,.028,Hf,{n:6,np:1})}else S.l([x,.07,zz+.035],[x,0,zz+.055],.04,.056,Hf,{n:9,np:1})};
 leg('legFL',lx,fz,0,sock[0]);leg('legFR',-lx,fz,0,sock[1]);leg('legBL',lx,bz,1,sock[2]);leg('legBR',-lx,bz,1,sock[3]);
 // cuello y cabeza (hueso `head` en la base del cuello)
 const na=o.na==null?.55:o.na,nl=(o.nl||1)*.5,nb=[0,by+bh*.55,zf+.15],nt=[0,nb[1]+Math.cos(na)*nl,nb[2]+Math.sin(na)*nl],nr=(o.nr||1)*.15;
 S.bone('head','body',nb[0],nb[1],nb[2]);S.on('head');const NL=neck(S,nb,nt,{arch:(o.arch==null?.06:o.arch)*nl/.5,rx0:nr*.85,rx1:nr*.5,rd0:nr*1.12,rd1:nr*.582,throat:o.throat,n:o.nn||6},C,B);S.NL=NL;
 const h=HEADS[o.head||'equine'](S,nt,o,C,B,D,nb);
 // cola
 const tb=[0,by+bh*.72,zb-.26*(o.hip||1)];S.bone('tail','body',...tb);S.on('tail');TAILS[o.tail||'hair'](S,tb,o,C,D,by);
 const m={back:by+bh,sz:o.sz||0,bw,bh,fw:bw+.055,LH,by,hd:h&&h.hd,cyc:2.05*lg*ln,rad:.7*ln,eye:h&&h.eye};m.seat=m.back+.045-.04;if(o.x)o.x(S,{by,bh,bw,zf,zb,LH,nb,nt,h,C,B,D});saddle(S,m);bridle(S,m,h);return m}
// cabezas de ungulado
const HEADS={
 equine(S,nt,o,C,B,D,nb0){const a=o.ha==null?.95:o.ha,H=HD(nt,a),{P,r}=H,s=o.hs||1,M=o.muz||sh(C,.62);
  S.e(...P(.06*s,.01),.08*s,.088*s,.11*s,C,{r});for(const x of[-1,1])S.e(...P(.07*s,-.05*s,x*.042*s),.045*s,.08*s,.085*s,C,{r,lo:B});S.l(P(.08*s,.02*s),P(.29*s,.0),.07*s,.054*s,C,{lo:B});
  S.e(...P(.2*s,-.035*s),.058*s,.035*s,.12*s,B,{r,d:'md'});S.e(...P(.31*s,-.012*s),.06*s,.058*s,.07*s,M,{r});
  S.e(...P(.325*s,-.045*s),.04*s,.022*s,.04*s,sh(M,.75),{r,d:'lo'});for(const x of[-1,1])S.e(...P(.34*s,.012,x*.026*s),.012,.016,.012,'#1a120e',{r,d:'lo',j:0});
  if(o.blaze)S.l(P(.03*s,.075*s),P(.3*s,.05*s),.022*s,.026*s,'#efe8dc',{n:6});if(o.star)S.e(...P(.08*s,.08*s),.025,.025,.012,'#efe8dc',{r,d:'lo'});
  const er=o.ear||1;for(const x of[-1,1]){const b=P(-.0,.07*s,x*.042*s);S.l(b,[b[0]+x*.02*er,b[1]+.11*s*er,b[2]-.02],.03*s*Math.sqrt(er),.006,C,{n:6});S.e(b[0]+x*.012,b[1]+.04*s*er,b[2]+.006,.012*Math.sqrt(er),.04*s*er,.006,sh(C,.5),{d:'lo'})}
  S.eye(.064*s,...P(.09*s,.034*s).slice(1),.017*s,o.eyeC,o.eyeG);
  if(o.mane!=='none'&&S.NL){for(const q of S.NL){const c=[q.p[0],q.p[1]+q.n[1]*q.rd*.9,q.p[2]+q.n[2]*q.rd*.9],th=Math.atan2(q.d[2],q.d[1]);
    if(o.mane==='roach')S.e(0,c[1],c[2],.022,.05,.04,D,{r:[th,0,0],d:'md',np:1});else{S.e(.03,c[1]-.03,c[2]-.01,.03,.075,.045,D,{r:[th-.3,0,.5],d:'md',j:.3,np:1});S.e(.055,c[1]-.09,c[2]-.02,.02,.06,.035,D,{r:[th-.5,0,.25],d:'lo',j:.3,np:1})}}
   for(let i=0;i<3;i++)S.e((i-1)*.022,...P(.04*s,.08*s).slice(1),.02,.055,.02,D,{r:[a+.6,0,(i-1)*.25],d:'lo',np:1})}
  return{hd:H,mz:.3*s,mr:.06*s,poll:.0,eye:[.064*s,...P(.09*s,.034*s).slice(1),.02]}},
 bovine(S,nt,o,C,B,D){const a=o.ha==null?.35:o.ha,H=HD(nt,a),{P,r}=H,s=o.hs||1,M=o.muz||'#4a3a34';
  S.e(...P(.06*s,.02),.105*s,.1*s,.11*s,C,{r});S.e(...P(.04*s,-.07*s),.085*s,.07*s,.09*s,B,{r});S.l(P(.08*s,0),P(.24*s,-.02),.09*s,.075*s,C,{lo:B});S.e(...P(.27*s,-.025*s),.078*s,.066*s,.06*s,M,{r});
  for(const x of[-1,1])S.e(...P(.31*s,0,x*.035*s),.014,.018,.012,'#1a120e',{r,d:'lo',j:0});if(o.ring)S.t(...P(.32*s,-.04*s),.035*s,.008,'#d8b050',{r:[a,0,0]});
  for(const x of[-1,1]){const b=P(.03*s,.03*s,x*.1*s);S.e(b[0]+x*.04,b[1],b[2],.065*s,.022*s,.035*s,C,{r:[0,0,x*.3]});S.e(b[0]+x*.045,b[1]-.004,b[2]+.005,.045*s,.012*s,.02*s,sh(C,.55),{d:'lo'})}
  S.eye(.085*s,...P(.11*s,.04*s).slice(1),.018*s,o.eyeC,o.eyeG);if(o.forelock)S.e(...P(.02*s,.1*s),.08*s,.05*s,.06*s,D,{r,j:.3});
  return{hd:H,mz:.26*s,mr:.08*s,poll:.0,eye:[.085*s,...P(.11*s,.04*s).slice(1),.02]}},
 cervid(S,nt,o,C,B,D){const a=o.ha==null?.75:o.ha,H=HD(nt,a),{P,r}=H,s=o.hs||1,M=o.muz||'#2a201c';
  S.e(...P(.06*s,.01),.07*s,.072*s,.09*s,C,{r});S.l(P(.07*s,.0),P(.24*s,-.012),.058*s,.034*s,C,{lo:B});S.e(...P(.25*s,-.015),.036*s,.034*s,.04*s,M,{r});S.e(...P(.12*s,-.045*s),.04*s,.025*s,.08*s,B,{r});
  const er=o.ear||1;for(const x of[-1,1]){const b=P(.02*s,.05*s,x*.05*s);S.e(b[0]+x*.05*er,b[1]+.015,b[2]-.01,.06*s*er,.022*s,.028*s*er,C,{r:[0,.3*x,x*.45]});S.e(b[0]+x*.052*er,b[1]+.02,b[2]-.004,.045*s*er,.012,.016*er,o.earIn||'#e8d8c4',{r:[0,.3*x,x*.45],d:'lo'})}
  S.eye(.06*s,...P(.1*s,.03*s).slice(1),.018*s,o.eyeC,o.eyeG);if(o.mask)S.e(...P(.14*s,.035*s),.062*s,.03*s,.1*s,o.mask,{r,d:'md'});
  return{hd:H,mz:.21*s,mr:.045*s,poll:0,eye:[.06*s,...P(.1*s,.03*s).slice(1),.02]}},
 camel(S,nt,o,C,B,D){const a=.15,H=HD(nt,a),{P,r}=H,s=o.hs||1;S.e(...P(.06*s,.01),.07*s,.07*s,.095*s,C,{r});S.l(P(.06*s,-.005),P(.25*s,-.02),.06*s,.05*s,C,{lo:B});S.e(...P(.27*s,-.03*s),.052*s,.05*s,.045*s,sh(C,.85),{r});
  S.e(...P(.26*s,-.065*s),.04*s,.02*s,.035*s,sh(C,.6),{r,d:'lo'});for(const x of[-1,1]){S.e(...P(.0,.06*s,x*.05*s),.016,.03,.012,C,{d:'lo'});S.e(...P(.3*s,-.015,x*.03*s),.008,.012,.008,'#1a120e',{d:'lo',j:0})}
  S.eye(.06*s,...P(.08*s,.035*s).slice(1),.016*s);S.e(...P(.08*s,.05*s),.065*s,.025*s,.035*s,sh(C,.6),{r,d:'lo'});return{hd:H,mz:.24*s,mr:.055*s,poll:0,eye:[.06*s,...P(.08*s,.035*s).slice(1),.02]}},
 rhino(S,nt,o,C,B,D){const a=.42,H=HD(nt,a),{P,r}=H,s=o.hs||1;S.e(...P(.08*s,0),.11*s,.1*s,.14*s,C,{r});S.l(P(.1*s,-.01),P(.3*s,-.03),.095*s,.07*s,C,{lo:B});S.e(...P(.32*s,-.045*s),.07*s,.06*s,.05*s,sh(C,.85),{r});
  S.hn([P(.29*s,.04*s),P(.37*s,.17*s),P(.4*s,.3*s)],.05*s,o.horn||'#3a3430',{tip:o.hornT});S.hn([P(.17*s,.08*s),P(.2*s,.16*s)],.035*s,o.horn||'#3a3430',{tip:o.hornT});
  for(const x of[-1,1]){S.e(...P(.0,.1*s,x*.07*s),.025,.05,.018,C,{d:'lo'})}S.eye(.09*s,...P(.15*s,.03*s).slice(1),.014*s,o.eyeC,o.eyeG);return{hd:H,mz:.3*s,mr:.075*s,poll:0,eye:[.09*s,...P(.15*s,.03*s).slice(1),.02]}},
 probo(S,nt,o,C,B,D){const a=.2,H=HD(nt,a),{P,r}=H,s=o.hs||1;S.e(...P(.06*s,.06*s),.15*s,.17*s,.14*s,C,{r,lo:B});S.e(...P(.02*s,.17*s),.1*s,.08*s,.1*s,C,{r});
  const tr=[P(.17*s,-.02),P(.22*s,-.14*s),P(.21*s,-.3*s),P(.25*s,-.43*s),P(.31*s,-.47*s)];S.hn(tr,.07*s,C,{sharp:false});S.e(...tr[4],.04*s,.03*s,.04*s,sh(C,.8),{d:'md'});
  for(const x of[-1,1]){S.hn([P(.12*s,-.1*s,x*.1*s),P(.25*s,-.25*s,x*.17*s),P(.42*s,-.22*s,x*.18*s),P(.53*s,-.02,x*.1*s)],.04*s,'#efe6d0',{tip:'#fff8e8'});S.e(...P(-.02,.0,x*.15*s),.035*s,.11*s,.09*s,sh(C,.85),{r:[0,0,x*.2]})}
  S.eye(.12*s,...P(.1*s,.06*s).slice(1),.014*s);return{hd:H,mz:.12*s,mr:.12*s,poll:0,eye:[.12*s,...P(.1*s,.06*s).slice(1),.02]}}};
const TAILS={
 hair(S,tb,o,C,D,by){const L=o.tl||1;S.l(tb,[0,tb[1]-.06,tb[2]-.08],.045,.04,D,{np:1});S.e(0,tb[1]-.02,tb[2]-.05,.05,.06,.05,D,{np:1,j:.3});for(let i=0;i<7;i++){const t=i/6;S.e((hs(i,1,9)-.5)*.03,tb[1]-.08-t*.36*L,tb[2]-.1-.04*Math.sin(t*2.4),.045+.02*Math.sin(t*3),.09,.042,D,{r:[-.18,0,(hs(i,2,9)-.5)*.3],j:.3,np:1})}},
 tuft(S,tb,o,C,D,by){const L=o.tl||1;S.l(tb,[0,tb[1]-.36*L,tb[2]-.06],.025,.015,C,{n:6});S.e(0,tb[1]-.4*L,tb[2]-.065,.035,.07,.035,D,{j:.3})},
 short(S,tb,o,C,D){S.e(0,tb[1]+.02,tb[2]-.02,.04,.065,.035,C,{r:[-.8,0,0]});if(o.rump)S.e(0,tb[1]-.08,tb[2]+.05,.11,.12,.06,o.rump,{d:'md'})},
 none(){} };

// ── CARNÍVOROS / PLANTÍGRADOS (felinos, cánidos, osos, tejón, grifo, león guardián) ──
function carnivore(S,o){
 const lg=o.lg||1,ln=o.ln||1,w=o.w||1,hh=o.h||1,LH=.5*lg,by=LH+.1*hh,bw=.2*w,bh=.2*hh,zf=.36*ln,zb=-.36*ln,C=o.col,B=o.bel||sh(C,.85),D=o.dk||sh(C,.45),plant=o.plant;
 S.bone('root',null,0,0,0).bone('body','root',0,by,0);const lx=bw*.62,fz=zf+.02,bz=zb;
 S.bone('legFL','body',lx,LH,fz).bone('legFR','body',-lx,LH,fz).bone('legBL','body',lx,LH+.02,bz).bone('legBR','body',-lx,LH+.02,bz);S.on('body');
 S.e(0,by,0,bw,bh,.42*ln,C,{lo:B});S.e(0,by+.03*hh,zf,bw*(o.chest||1.05),bh*1.1*(o.chest||1),.24,C,{lo:B});S.e(0,by+.01,zb,bw*1.0*(o.hip||1),bh*(o.hip||1),.24,C,{lo:B});
 if(o.hump)S.e(0,by+bh*.85,zf-.06,bw*.75,bh*.5*o.hump,.2,C);S.e(0,by-bh*.55,.0,bw*.7,bh*.45,.34*ln,B);
 if(o.ruff)S.e(0,by+.04,zf+.1,bw*1.15,bh*1.2,.14,o.ruff,{j:.3});
 if(o.stripes)S.paint(PNT.tiger(o.stripes,26,.08));if(o.spots)S.paint(PNT.spots(o.spots,14,.3,LH*.5));if(o.pnt)o.pnt.forEach(f=>S.paint(f));
 for(const s of[-1,1]){S.e(s*bw*.6,by-.02,zf+.02,.08*w,.14*hh,.11,C,{r:[.3,0,0],lo:B});S.e(s*bw*.65,by+.0,zb-.03,.09*w,.15*hh,.14,C,{lo:B})}
 const pw=o.paw||C,leg=(n,x,z,rear)=>{S.on(n);const y0=LH,t=o.lt||1;
  if(!rear||plant){S.l([x,y0,z],[x,y0*.45,z+(plant?0:.01)],.07*w*t,.05*t,C,{jt:1,lo:B});S.l([x,y0*.45,z+.01],[x,.06,z+.02],.05*t,.042*t,o.lc||C)}
  else{S.l([x,y0+.02,z+.04],[x,y0*.45,z-.09],.08*w*t,.05*t,C,{jt:1,lo:B});S.l([x,y0*.45,z-.09],[x,.06,z-.02],.045*t,.04*t,o.lc||C);z=z-.04}
  S.e(x,.04,z+.05,.06*t,.04,.075*t,pw,{lo:sh(pw,.8)});for(let i=-1;i<=1;i++){S.e(x+i*.028*t,.03,z+.115*t,.019*t,.022,.024,pw,{d:'lo'});if(o.claw)S.k([x+i*.028*t,.03,z+.13*t],[x+i*.028*t,.0,z+.17*t],.009,o.claw,{n:5})}};
 leg('legFL',lx,fz,0);leg('legFR',-lx,fz,0);leg('legBL',lx,bz,1);leg('legBR',-lx,bz,1);
 const na=o.na==null?.95:o.na,nl=(o.nl||1)*.22,nb=[0,by+bh*.45,zf+.12],nt=[0,nb[1]+Math.cos(na)*nl,nb[2]+Math.sin(na)*nl];
 S.bone('head','body',...nb);S.on('head');S.l(nb,nt,.13*w,.1*w,C,{lo:B});if(o.mane)for(let i=0;i<12;i++){const a=i/12*PI*2;S.e(Math.cos(a)*.11*w,nt[1]+Math.sin(a)*.1-.02,nt[2]-.02,.06,.085,.05,o.mane,{r:[0,0,a+PI/2],j:.3,d:'md'})}
 const h=CHEADS[o.head||'feline'](S,nt,o,C,B,D);
 const tb=[0,by+bh*.5,zb-.22*(o.hip||1)];S.bone('tail','body',...tb);S.on('tail');CTAILS[o.tail||'long'](S,tb,o,C,D);
 const m={back:by+bh,sz:o.sz||-.02,bw,bh,fw:bw+.06,LH,by,hd:h.hd,cyc:1.7*lg*ln,rad:.6*ln,eye:h.eye};m.seat=m.back+.045-.04;if(o.x)o.x(S,{by,bh,bw,zf,zb,LH,nb,nt,h,C,B,D});saddle(S,m);bridle(S,m,h);return m}
const CHEADS={
 feline(S,nt,o,C,B,D){const H=HD(nt,o.ha==null?.12:o.ha),{P,r}=H,s=o.hs||1;S.e(...P(.06*s,.01),.1*s,.09*s,.095*s,C,{r,lo:B});S.e(...P(.04*s,-.035*s),.1*s,.06*s,.08*s,o.cheek||B,{r});
  S.e(...P(.14*s,-.025*s),.055*s,.045*s,.05*s,o.muzC||B,{r});S.e(...P(.18*s,-.0),.022*s,.016*s,.015*s,o.nose||'#c87a7a',{r,d:'lo'});S.e(...P(.15*s,-.06*s),.035*s,.02*s,.03*s,B,{r,d:'lo'});
  for(const x of[-1,1]){const b=P(.02*s,.075*s,x*.065*s);S.k(b,[b[0]+x*.02,b[1]+.075*s*(o.ear||1),b[2]-.01],.035*s,C,{n:5});S.k([b[0],b[1]+.01,b[2]+.006],[b[0]+x*.016,b[1]+.06*s*(o.ear||1),b[2]],.02*s,o.earIn||'#e8c8b8',{n:4});if(o.tuft)S.k([b[0]+x*.02,b[1]+.07*s,b[2]-.01],[b[0]+x*.03,b[1]+.13*s,b[2]-.015],.008,'#1a1410',{n:4})}
  S.eye(.048*s,...P(.1*s,.035*s).slice(1),.018*s,o.eyeC||'#d8b030',true);for(const x of[-1,1])S.e(x*.024*s,...P(.1*s,.035*s).slice(1),.007,.015,.006,'#0a0806',{d:'lo',j:0});
  return{hd:H,mz:.13*s,mr:.07*s,poll:0,eye:[.048*s,...P(.1*s,.035*s).slice(1),.02]}},
 canine(S,nt,o,C,B,D){const H=HD(nt,o.ha==null?.2:o.ha),{P,r}=H,s=o.hs||1;S.e(...P(.05*s,.01),.09*s,.085*s,.1*s,C,{r,lo:B});S.l(P(.08*s,-.01),P(.24*s,-.03*s),.065*s,.04*s,o.muzC||C,{lo:B});S.e(...P(.25*s,-.025*s),.022*s,.02*s,.02*s,'#1a1410',{r,d:'lo'});
  S.e(...P(.16*s,-.06*s),.04*s,.02*s,.06*s,B,{r,d:'md'});if(o.fang)for(const x of[-1,1])S.k(P(.2*s,-.05*s,x*.025*s),P(.2*s,-.1*s,x*.026*s),.008,'#efe6d0',{n:4});
  for(const x of[-1,1]){const b=P(.0,.07*s,x*.055*s);S.k(b,[b[0]+x*.025,b[1]+.11*s*(o.ear||1),b[2]-.02],.038*s,C,{n:5})}
  if(o.horn)for(const x of[-1,1])S.hn([P(.04*s,.06*s,x*.07*s),P(-.05,.15*s,x*.12*s),P(-.15*s,.2*s,x*.1*s)],.025*s,o.horn,{tip:o.hornT});
  S.eye(.05*s,...P(.1*s,.035*s).slice(1),.016*s,o.eyeC||'#f0c040',o.eyeG!==false);return{hd:H,mz:.2*s,mr:.06*s,poll:0,eye:[.05*s,...P(.1*s,.035*s).slice(1),.02]}},
 ursine(S,nt,o,C,B,D){const H=HD(nt,o.ha==null?.25:o.ha),{P,r}=H,s=o.hs||1;S.e(...P(.06*s,.01),.12*s,.11*s,.11*s,C,{r,lo:B});S.l(P(.1*s,-.02),P(.21*s,-.04*s),.07*s,.05*s,o.muzC||B,{});S.e(...P(.22*s,-.03*s),.032*s,.025*s,.022*s,'#1a1410',{r,d:'lo'});
  for(const x of[-1,1]){S.e(...P(.0,.1*s,x*.085*s),.04*s,.04*s,.022*s,o.earC||C,{d:'md'});S.e(...P(.006,.1*s,x*.085*s),.024*s,.025*s,.01,o.earIn||D,{d:'lo'})}
  if(o.patchE)for(const x of[-1,1])S.e(...P(.1*s,.02*s,x*.05*s),.035*s,.03*s,.02*s,o.patchE,{r:[0,x*.3,x*.5],d:'md'});S.eye(.05*s,...P(.11*s,.03*s).slice(1),.014*s,o.eyeC);
  return{hd:H,mz:.18*s,mr:.07*s,poll:0,eye:[.05*s,...P(.11*s,.03*s).slice(1),.02]}},
 badger(S,nt,o,C,B,D){const H=HD(nt,.3),{P,r}=H,s=o.hs||1;S.e(...P(.06*s,0),.09*s,.08*s,.11*s,'#e8e4dc',{r});S.k(P(.12*s,-.01),P(.27*s,-.05*s),.065*s,'#e8e4dc',{n:8});S.e(...P(.26*s,-.045*s),.02*s,.018*s,.018*s,'#1a1410',{d:'lo'});
  for(const x of[-1,1]){S.l(P(.0,.06*s,x*.045*s),P(.24*s,-.02,x*.02*s),.03*s,.012*s,'#1a1612',{n:6});S.e(...P(.0,.05*s,x*.08*s),.025*s,.02*s,.015,C,{d:'lo'})}S.eye(.05*s,...P(.11*s,.025*s).slice(1),.013*s,'#2a1a10');
  return{hd:H,mz:.2*s,mr:.06*s,poll:0,eye:[.05*s,...P(.11*s,.025*s).slice(1),.02]}},
 eagle(S,nt,o,C,B,D){const H=HD(nt,.1),{P,r}=H,s=o.hs||1,F=o.feat||'#efe8dc';S.e(...P(.06*s,.02),.09*s,.095*s,.1*s,F,{r,lo:sh(F,.85)});S.hn([P(.13*s,.0),P(.21*s,-.01),P(.26*s,-.06*s),P(.25*s,-.1*s)],.045*s,o.beak||'#e8b030',{tip:'#4a3a20'});
  for(const x of[-1,1])S.k(P(.0,.06*s,x*.05*s),P(-.12*s,.12*s,x*.08*s),.03*s,F,{n:5});S.eye(.055*s,...P(.1*s,.03*s).slice(1),.016*s,'#ffb020',true);return{hd:H,mz:.14*s,mr:.06*s,poll:0,eye:[.055*s,...P(.1*s,.03*s).slice(1),.02]}},
 komainu(S,nt,o,C,B,D){const H=HD(nt,.05),{P,r}=H,s=o.hs||1;S.e(...P(.06*s,.01),.12*s,.11*s,.1*s,C,{r,lo:B});S.e(...P(.15*s,-.03*s),.08*s,.06*s,.055*s,B,{r});S.e(...P(.2*s,0),.04*s,.03*s,.025*s,'#2a1a14',{d:'lo'});
  S.e(...P(.15*s,-.08*s),.07*s,.03*s,.05*s,'#a8302a',{r,d:'md'});for(const x of[-1,1])S.k(P(.17*s,-.06*s,x*.04*s),P(.17*s,-.11*s,x*.045*s),.01,'#efe6d0',{n:4});
  for(let i=0;i<10;i++){const a=i/10*PI*2;S.e(Math.cos(a)*.13*s,...P(.0,Math.sin(a)*.12*s).slice(1),.045,.045,.045,D,{d:'md'})}for(const x of[-1,1])S.e(...P(.12*s,.06*s,x*.07*s),.035,.03,.02,D,{d:'lo'});
  S.eye(.06*s,...P(.11*s,.04*s).slice(1),.022*s,'#e8b020',true);return{hd:H,mz:.15*s,mr:.08*s,poll:0,eye:[.06*s,...P(.11*s,.04*s).slice(1),.025]}}};
const CTAILS={
 long(S,tb,o,C,D){const n=6,L=o.tl||1;let p=tb;for(let i=1;i<=n;i++){const t=i/n,q=[0,tb[1]-.1*L*Math.sin(t*1.6)+.05*t*t*L,tb[2]-.42*L*t];S.l(p,q,.045*(1-t*.5),.045*(1-(t+.17)*.5),i>=n-1&&o.tipC?o.tipC:i%2&&o.ring?o.ring:C,{jt:1});p=q}},
 bush(S,tb,o,C,D){const L=o.tl||1;S.l(tb,[0,tb[1]-.08,tb[2]-.12],.05,.07,C);S.e(0,tb[1]-.17*L,tb[2]-.25*L,.085,.09,.2*L,C,{r:[-.6,0,0],lo:sh(C,.8),j:.25});if(o.tipC)S.e(0,tb[1]-.27*L,tb[2]-.38*L,.06,.06,.08,o.tipC,{r:[-.6,0,0]})},
 bob(S,tb,o,C){S.e(0,tb[1]+.02,tb[2]-.03,.04,.045,.06,C,{r:[-.5,0,0]});S.e(0,tb[1]+.04,tb[2]-.075,.03,.03,.03,'#1a1410',{d:'lo'})},
 stub(S,tb,o,C){S.e(0,tb[1],tb[2]-.02,.045,.04,.045,C,{d:'md'})},
 lion(S,tb,o,C,D){let p=tb;for(let i=1;i<=5;i++){const t=i/5,q=[0,tb[1]+.08*Math.sin(t*2.2),tb[2]-.4*t];S.l(p,q,.03,.025,C,{jt:1});p=q}S.e(0,p[1],p[2]-.03,.05,.06,.07,o.tipC||D,{j:.3})},
 plume(S,tb,o,C,D){let p=tb;for(let i=1;i<=4;i++){const t=i/4,q=[0,tb[1]+.18*t,tb[2]-.2*t];S.l(p,q,.04,.035,C,{jt:1});p=q}for(let i=0;i<7;i++)S.e(Math.sin(i)*.05,p[1]+.05+i*.012,p[2]-.03,.04,.09,.05,o.tipC||D,{r:[-.8,0,(i-3)*.3],j:.3,d:'md'})}};

// ── SAURIOS (varano, salamandra, iguana, lagarto de gola, minidragón): patas abiertas, cola larga en dos huesos, cabeza plana ──
function saurian(S,o){
 const lg=o.lg||1,ln=o.ln||1,w=o.w||1,hh=o.h||1,LH=.36*lg,by=LH+.09*hh,bw=.23*w,bh=.18*hh,zf=.34*ln,zb=-.32*ln,C=o.col,B=o.bel||sh(C,1.2),D=o.dk||sh(C,.5);
 S.bone('root',null,0,0,0).bone('body','root',0,by,0);const lx=bw*.85,fz=zf,bz=zb;
 S.bone('legFL','body',lx,LH,fz).bone('legFR','body',-lx,LH,fz).bone('legBL','body',lx,LH,bz).bone('legBR','body',-lx,LH,bz);S.on('body');
 S.e(0,by,0,bw,bh,.42*ln,C,{lo:B});S.e(0,by+.01,zf,bw*.9,bh*1.05,.2,C,{lo:B});S.e(0,by,zb,bw*.95,bh*.95,.2,C,{lo:B});
 if(o.bands)S.paint(PNT.bands(o.bands,15,.1));if(o.pnt)o.pnt.forEach(f=>S.paint(f));
 if(o.dorsal)for(let i=0;i<9;i++){const zz=zb-.05+i*(zf-zb+.15)/8,hh2=o.dorsalH||.08;S.k([0,by+bh*.85,zz],[0,by+bh+hh2*(1-Math.abs(i-4)/6),zz-.03],.03,o.dorsal,{n:5,em:o.dorsalE||0})}
 if(o.cracks)S.paint(PNT.veins(o.cracks,6,.03,2));
 if(o.scutes)for(let i=0;i<14;i++){const a=(hs(i,6,S.seed)*.9+.05)*PI,zz=(hs(i,3,S.seed)-.5)*.8*ln;S.e(Math.cos(a)*bw*.95,by+Math.sin(a)*bh*.85,zz,.03,.018,.03,o.scutes,{d:'lo'})}
 const leg=(n,x,z,rear)=>{S.on(n);const s=Math.sign(x),ex=x+s*.17*w,ey=LH*.62,y0=LH,ft=o.foot||C;S.e(x,y0,z,.075*w,.08,.09,C);S.l([x,y0,z],[ex,ey,z+(rear?-.04:.04)],.065*w,.05,C,{jt:1});S.l([ex,ey,z+(rear?-.04:.04)],[ex+s*.02,.04,z+(rear?-.02:.07)],.048,.036,C,{jt:1});
  const fz=z+(rear?-.02:.07);S.e(ex+s*.02,.025,fz+.03,.05,.025,.06,ft,{d:'md'});for(let i=-1;i<=2;i++){const a=i*.45+(s>0?.2:-.2);S.l([ex+s*.02,.02,fz+.04],[ex+s*.02+Math.sin(a)*.09,.01,fz+.04+Math.cos(a)*.08],.012,.008,ft,{n:5});S.k([ex+s*.02+Math.sin(a)*.09,.01,fz+.04+Math.cos(a)*.08],[ex+s*.02+Math.sin(a)*.12,.0,fz+.04+Math.cos(a)*.11],.008,o.claw||'#2a2018',{n:4})}};
 leg('legFL',lx,fz,0);leg('legFR',-lx,fz,0);leg('legBL',lx,bz,1);leg('legBR',-lx,bz,1);
 const nb=[0,by+.03,zf+.16],na=o.na==null?.35:o.na,nl=(o.nl||1)*.18,nt=[0,nb[1]+Math.sin(na)*nl,nb[2]+Math.cos(na)*nl];S.bone('head','body',...nb);S.on('head');S.l(nb,nt,bw*.62,bw*.5,C,{lo:B});
 const H=HD(nt,o.ha==null?.12:o.ha),{P,r}=H,s=o.hs||1;S.e(...P(.07*s,.01),.1*s*w,.07*s,.12*s,C,{r,lo:B});S.e(...P(.2*s,-.005),.075*s*w,.05*s,.1*s,C,{r,lo:B});S.e(...P(.15*s,-.04*s),.08*s*w,.025*s,.15*s,B,{r,d:'md'});
 S.e(...P(.29*s,-.0),.03*s,.025*s,.03*s,C,{d:'lo'});for(const x of[-1,1])S.e(...P(.28*s,.02*s,x*.03*s),.008,.008,.006,'#100a08',{d:'lo',j:0});
 S.eye(.075*s*w,...P(.08*s,.045*s).slice(1),.02*s,o.eyeC||'#e8c030',o.eyeG!==false);if(o.hx)o.hx(S,P,s,r);
 const tb=[0,by,zb-.18];S.bone('tail','body',...tb);S.on('tail');const L=o.tl||1,t1=[0,tb[1]-.1,tb[2]-.36*L],TR=(a,b,r0,r1,c)=>{for(let i=0;i<3;i++){const u0=i/3,u1=(i+1)/3,p=[0,a[1]+(b[1]-a[1])*u0,a[2]+(b[2]-a[2])*u0],q=[0,a[1]+(b[1]-a[1])*u1,a[2]+(b[2]-a[2])*u1];S.l(p,q,r0+(r1-r0)*u0,r0+(r1-r0)*u1,c,{jt:1})}};
 S.e(0,tb[1],tb[2]+.05,bh*.82,bh*.8,.12,C,{lo:B});TR(tb,t1,bh*.78,bh*.5,C);
 if(o.dorsal)for(let i=0;i<3;i++){const zz=tb[2]-.08-i*.1;S.k([0,tb[1]+.05-i*.02,zz],[0,tb[1]+.11-i*.03,zz-.04],.022,o.dorsal,{n:5,em:o.dorsalE||0})}
 S.bone('tail2','tail',...t1);S.on('tail2');const t2=[0,Math.max(.05,t1[1]-.12),t1[2]-.44*L];TR(t1,t2,bh*.5,.02,C);S.k([0,t2[1],t2[2]+.02],[0,t2[1]-.01,t2[2]-.08],.02,o.tipC||C);if(o.tailX)o.tailX(S,t2);
 const m={back:by+bh,sz:o.sz||-.02,bw,bh,fw:bw+.08,LH,by,hd:{P,r},cyc:1.3*lg*ln,rad:.6*ln,tilt:1,eye:[.075*s*w,...P(.08*s,.045*s).slice(1),.02]};m.seat=m.back+.045-.04;
 if(o.x)o.x(S,{by,bh,bw,zf,zb,LH,nb,nt,C,B,D});saddle(S,m);bridle(S,m,{hd:H,mz:.22*s,mr:.06*s,poll:0});return m}

// ── AVES BÍPEDAS (raptor, grulla, ave del terror, avestruz, gaviotón): patas BL/BR, FL/FR vacías (las anima igual), alas plegadas ──
function avian(S,o){
 const lg=o.lg||1,ln=o.ln||1,w=o.w||1,hh=o.h||1,HY=.62*lg,by=HY+.12*hh,bw=.2*w,bh=.2*hh,C=o.col,B=o.bel||sh(C,1.1),D=o.dk||sh(C,.5),F=o.leg||'#c8a040';
 S.bone('root',null,0,0,0).bone('body','root',0,by,0);const lx=bw*.55;S.bone('legFL','body',0,HY,0).bone('legFR','body',0,HY,0).bone('legBL','body',lx,HY,0).bone('legBR','body',-lx,HY,0);S.on('body');
 S.e(0,by,0,bw,bh,.34*ln,C,{lo:B,r:[o.pitch||-.1,0,0]});S.e(0,by+.02,.2*ln,bw*.85,bh*.92,.18,C,{lo:B});S.e(0,by-bh*.4,-.04,bw*.75,bh*.6,.26*ln,B);
 if(o.scales)for(let i=0;i<10;i++)S.e((hs(i,2,S.seed)-.5)*bw*1.4,by+bh*.7,(hs(i,5,S.seed)-.5)*.5,.04,.02,.04,o.scales,{d:'lo'});
 const leg=(n,x)=>{S.on(n);const y0=HY;S.e(x,y0-.03,.02,.09*w,.15,.11,o.thigh||C,{lo:B});S.l([x,y0-.08,.02],[x,y0*.5,-.1],.055*(o.lt||1),.035*(o.lt||1),o.thigh||C,{jt:1,lo:B});S.l([x,y0*.5,-.1],[x,.05,.0],.03*(o.lt||1),.026*(o.lt||1),F,{jt:1});
  const ts=o.toes||3;for(let i=0;i<ts;i++){const a=(i-(ts-1)/2)*.45;S.l([x,.04,.0],[x+Math.sin(a)*.1,.015,Math.cos(a)*.11],.016,.011,F,{n:5});S.k([x+Math.sin(a)*.1,.015,Math.cos(a)*.11],[x+Math.sin(a)*.13,.0,Math.cos(a)*.15],.01,o.claw||'#2a2018',{n:4})}
  if(o.sickle)S.hn([[x,.06,.03],[x,.12,.09],[x,.08,.14]],.015,o.claw||'#2a2018')};
 leg('legBL',lx);leg('legBR',-lx);
 // alas plegadas
 for(const s of[-1,1]){const n=s>0?'wingL':'wingR';S.bone(n,'body',s*bw*.9,by+.06,.12);S.on(n);if(o.wing==='arm'){S.l([s*bw*.9,by+.02,.12],[s*bw*1.0,by-.08,.24],.03,.022,C,{jt:1});for(let i=0;i<3;i++)S.k([s*bw*1.0,by-.08,.24],[s*bw*1.0+s*.01,by-.16,.27+i*.02],.008,o.claw||'#2a2018',{n:4});continue}
  S.e(s*bw*.95,by+.02,0,.05*(o.wingW||1),.13,.3*(o.wingL||1),o.wingC||C,{r:[-.12,0,s*.1],lo:sh(o.wingC||C,.8)});for(let i=0;i<5;i++)S.e(s*bw*.97,by-.04+i*.015,-.22-i*.05*(o.wingL||1),.025,.06,.1,o.prim||D,{r:[-.35,0,s*.1],d:'md'})}
 // cuello y cabeza
 S.on('body');const nl=(o.nl||1)*.42,nb=[0,by+bh*.4,.26*ln];S.bone('head','body',...nb);S.on('head');const nc=o.nc||C,pts=[nb,[0,nb[1]+nl*.45,nb[2]+.05],[0,nb[1]+nl*.85,nb[2]+(o.neckS||-.02)],[0,nb[1]+nl,nb[2]+.06]];
 for(let i=0;i<3;i++)S.l(pts[i],pts[i+1],(o.nr||.075)*(1-i*.18),(o.nr||.075)*(1-(i+1)*.18),i>0?nc:C,{jt:1,lo:i===0?B:null});
 const hb=pts[3],H=HD(hb,o.ha==null?.05:o.ha),{P,r}=H,s=o.hs||1;S.e(...P(.04*s,.01),.07*s,.07*s,.085*s,o.headC||nc,{r});
 const bk=o.beak||'#e0a030',bl=o.beakL||1;if(o.hook){S.e(...P(.13*s,-.0),.05*s,.07*s,.11*s,bk,{r});S.hn([P(.15*s,.04*s),P(.25*s*bl,.03*s),P(.29*s*bl,-.03*s),P(.27*s*bl,-.08*s)],.04*s,bk,{tip:o.beakT||'#3a2a1a'});S.e(...P(.16*s,-.05*s),.04*s,.025*s,.08*s,sh(bk,.8),{r,d:'md'})}
 else if(o.toothy){S.e(...P(.12*s,-.0),.065*s,.05*s,.1*s,o.headC||nc,{r});S.e(...P(.13*s,-.05*s),.055*s,.025*s,.09*s,B,{r,d:'md'});for(let i=0;i<5;i++)for(const x of[-1,1])S.k(P(.08*s+i*.025*s,-.03*s,x*.045*s),P(.08*s+i*.025*s,-.055*s,x*.045*s),.007,'#efe6d0',{n:4})}
 else{S.k(P(.08*s,0),P(.08*s+.22*s*bl,-.02*s),.035*s,bk,{n:7});S.e(...P(.1*s,-.015*s),.03*s,.012*s,.06*s,sh(bk,.75),{r,d:'lo'})}
 if(o.crown)S.e(...P(.04*s,.065*s),.035*s,.012*s,.04*s,o.crown,{r,d:'md'});if(o.crest)for(let i=0;i<4;i++)S.k(P(-.0+i*.02,.05*s),P(-.06*s+i*.02,.15*s+i*.01),.015*s,o.crest,{n:4});
 S.eye(.05*s,...P(.05*s,.025*s).slice(1),.014*s,o.eyeC||'#e8b030',o.eyeG!==false);
 const tb=[0,by+.03,-.32*ln];S.bone('tail','body',...tb);S.on('tail');if(o.tailR){let p=tb;for(let i=1;i<=4;i++){const t=i/4,q=[0,tb[1]+.04*t,tb[2]-.45*t*(o.tl||1)];S.l(p,q,.07*(1-t*.6),.07*(1-(t+.25)*.6),C,{jt:1,lo:B});p=q}if(o.tailFeather)S.e(0,p[1],p[2],.07,.03,.15,o.tailFeather,{d:'md',j:.3})}
 else for(let i=0;i<7;i++){const a=(i-3)*.22;S.e(Math.sin(a)*.07,tb[1]+.02+(o.tailUp||0)*.1,tb[2]-.08-Math.cos(a)*.05,.035,.02,.16*(o.tl||1),o.tailC||D,{r:[(o.tailUp||0)-.2,a,0],d:'md'})}
 const m={back:by+bh,sz:o.sz||-.02,bw,bh,fw:bw+.07,LH:HY,by,hd:{P,r},cyc:1.9*lg,rad:.5,biped:1,eye:[.05*s,...P(.05*s,.025*s).slice(1),.02]};m.seat=m.back+.045-.04;if(o.x)o.x(S,{by,bh,bw,nb,hb,P,r,s,C,B,D});saddle(S,m);bridle(S,m,{hd:H,mz:.14*s,mr:.045*s,poll:0});return m}

// alas desplegables (dragón, grifo): hueso wingL/wingR en el lomo; membrana (dragón) o plumas (grifo); plegadas hacia atrás a lo largo del cuerpo
function wings(S,y,z,bw,o){for(const s of[-1,1]){const n=s>0?'wingL':'wingR',X=v=>s*(bw+v),b=[s*bw*.55,y,z];S.bone(n,'body',...b);S.on(n);const L=o.len||1;
  if(o.membrane){const el=[X(.06),y+.26*L,z-.12],wr=[X(.1),y+.2*L,z-.52*L],t1=[X(.13),y-.02,z-.82*L],t2=[X(.12),y-.1,z-.55*L],t3=[X(.08),y-.12,z-.28*L];
   S.l(b,el,.035,.028,o.bone,{jt:1});S.l(el,wr,.028,.02,o.bone,{jt:1});for(const t of[t1,t2,t3])S.l(wr,t,.014,.005,o.bone,{n:5});S.k(wr,[wr[0]+s*.01,wr[1]+.07,wr[2]+.04],.016,o.claw||'#2a2018',{n:4});
   S.poly([b,el,wr,t1,[X(.12),y-.08,z-.7*L],t2,[X(.1),y-.12,z-.42*L],t3,[X(.04),y-.04,z-.08]],o.membrane,{lo:sh(o.membrane,.6)})}
  else{const el=[X(.05),y+.12,z-.1],tip=[X(.09),y-.04,z-.85*L];S.l(b,el,.04,.03,o.col,{jt:1});
   S.poly([b,el,[X(.08),y+.08,z-.35*L],[X(.1),y-.0,z-.6*L],tip,[X(.08),y-.16,z-.55*L],[X(.05),y-.18,z-.25*L],[X(.03),y-.1,z-.02]],o.prim,{lo:sh(o.prim,.7)});
   S.poly([[X(.03),y+.02,z-.0],el,[X(.07),y+.08,z-.3*L],[X(.08),y-.02,z-.42*L],[X(.06),y-.12,z-.3*L],[X(.04),y-.12,z-.05]],o.col,{lo:sh(o.col,.85)});
   for(let i=0;i<6;i++){const u=i/5;S.e(X(.085),y-.05-.11*Math.sin(u*PI),z-.25*L-u*.55*L,.008,.035,.09,u>.4?o.prim:o.col,{r:[-.25,0,0],d:'lo'})}}}}

// ═════════════════════ ESPECIES ═════════════════════
// (k = bioma: 0 Pradera · 1 Bosque · 2 Pantano · 3 Cumbres · 4 Oriental · 5 Volcán · 6 Páramo · 7 Desierto · 8 Costa · 9 rara)
const SPEC={
 // ── PRADERA ──
 caballo:S=>ungulate(S,{col:'#9a5a32',bel:'#7a4426',dk:'#2a1a12',lc:'#7a4426',sock:[1,0,1,0],blaze:1,mane:'flow',tail:'hair'}),
 poni:S=>ungulate(S,{lg:.78,ln:.88,w:1.15,h:1.08,col:'#efe6d6',bel:'#d8cdb8',dk:'#3a2a20',pinto:['#5a3424',3.4,.55],mane:'flow',hs:.95,feather:1,sockC:'#efe6d6',tl:.85,ha:.85,
  x(S,c){S.on('head');for(let i=0;i<5;i++)S.e((i-2)*.02,c.nt[1]+.07,c.nt[2]+.07,.03,.07,.03,c.D,{r:[1.4,0,(i-2)*.3],d:'lo'})}}),
 asno:S=>ungulate(S,{lg:.85,ln:.92,w:.95,col:'#8a8580',bel:'#d0cac0',dk:'#3a3430',muz:'#e0dad0',ear:1.85,mane:'roach',tail:'tuft',stripe:'#3a3430',hs:1.05,ha:.8,na:.75,
  pnt:[(x,y,z,nx,ny)=>Math.abs(z-.34)<.03&&y>.85&&ny>-.2?['#3a3430',.9]:null,(x,y,z)=>y<.34&&y>.12&&Math.sin(y*70)>.55?['#4a4440',.8]:null]}),
 uro:S=>ungulate(S,{lg:.86,ln:1.08,w:1.25,h:1.12,col:'#3a2a20',bel:'#2a1e16',dk:'#1a120e',head:'bovine',hs:1.05,na:.32,nl:.6,nr:1.35,ha:.4,tail:'tuft',tl:1.1,cloven:1,wcol:'#4a3628',chest:1.08,
  stripe:'#b89a6a',x(S,c){const{P}=c.h.hd;S.on('head');for(const x of[-1,1])S.hn([P(.02,.08,x*.09),P(.0,.1,x*.2),P(.04,.18,x*.28),P(.12,.28,x*.27),P(.18,.36,x*.2)],.034,'#e8dcc0',{tip:'#2a2018'})}}),
 // ── BOSQUE ──
 ciervo:S=>ungulate(S,{lg:1.12,ln:.9,w:.85,h:.95,col:'#8a4e2e',bel:'#c8a684',dk:'#4a2a1a',head:'cervid',na:.35,nl:1.05,nr:.75,tail:'short',rump:'#ece2d0',lt:.82,ear:1,
  x(S,c){const{P}=c.h.hd;S.on('head');for(const x of[-1,1]){const b=P(.04,.075,x*.04),t1=[b[0]+x*.1,b[1]+.22,b[2]-.06],t2=[b[0]+x*.17,b[1]+.42,b[2]-.02],t3=[b[0]+x*.15,b[1]+.58,b[2]-.1];
   S.hn([b,t1,t2,t3],.022,'#8a7458',{tip:'#e8dcc0'});S.hn([[b[0]+x*.04,b[1]+.07,b[2]],[b[0]+x*.05,b[1]+.12,b[2]+.12]],.014,'#8a7458',{tip:'#e8dcc0'});S.hn([t1,[t1[0]+x*.03,t1[1]+.06,t1[2]+.13]],.013,'#8a7458',{tip:'#e8dcc0'});S.hn([t2,[t2[0]-x*.06,t2[1]+.12,t2[2]+.04]],.012,'#8a7458',{tip:'#e8dcc0'});S.hn([t2,[t2[0]+x*.08,t2[1]+.1,t2[2]-.04]],.011,'#8a7458',{tip:'#e8dcc0'})}
   S.on('head');for(let i=0;i<9;i++){const u=i/8;S.e(0,c.nb[1]+(c.nt[1]-c.nb[1])*u-.07,c.nb[2]+(c.nt[2]-c.nb[2])*u+.05,.07-u*.03,.08,.05,'#4a2a1a',{j:.35,d:'md'})}}}),
 alce:S=>ungulate(S,{lg:1.22,ln:1.05,w:1.0,h:1.08,col:'#3e2c22',bel:'#2a1e18',dk:'#1e1612',lc:'#8a7a6a',head:'cervid',hs:1.35,ha:.95,na:.6,nl:.78,nr:1.05,tail:'short',chest:1.12,wcol:'#4a3628',muz:'#3a2a20',ear:.75,lt:.9,earIn:'#5a4436',
  x(S,c){S.on('body');S.e(0,c.by+c.bh*1.02,c.zf-.12,c.bw*.6,c.bh*.55,.2,'#4a3628');const{P}=c.h.hd;S.on('head');S.e(...P(.24,-.03),.05,.05,.07,'#3a2a20',{d:'md'});S.l(P(.1,-.08),P(.08,-.26),.028,.012,'#2a1e18',{n:6});
   for(const x of[-1,1]){const b=P(.03,.07,x*.05),pa=[b[0]+x*.12,b[1]+.05,b[2]-.03];S.l(b,pa,.03,.026,'#c8b490',{jt:1});S.l(pa,[pa[0]+x*.08,pa[1]+.06,pa[2]-.02],.026,.03,'#c8b490');S.e(pa[0]+x*.12,pa[1]+.1,pa[2]-.02,.13,.03,.1,'#c8b490',{r:[.25,0,-x*.75],lo:'#a89470'});
    for(let i=0;i<5;i++)S.k([pa[0]+x*(.05+i*.035),pa[1]+.06+i*.025,pa[2]-.06+i*.02],[pa[0]+x*(.07+i*.045),pa[1]+.14+i*.03,pa[2]-.07+i*.03],.015,'#e0d0b0',{n:5})}}}),
 osopardo:S=>carnivore(S,{lg:1.15,ln:1.1,w:1.3,h:1.35,col:'#5a3a24',bel:'#6a4a32',dk:'#2a1a12',head:'ursine',hs:1.1,hump:1.1,tail:'stub',plant:1,lt:1.25,claw:'#1a1410',muzC:'#8a6a4a',na:1.25,nl:.8,
  pnt:[(x,y,z,nx,ny)=>{const n=fb(x*7,y*7,z*7);return ny>.2&&n>.55?['#7a5236',.7]:null}]}),
 lince:S=>carnivore(S,{lg:1.15,ln:.9,w:.95,col:'#b89068',bel:'#e8dcc8',dk:'#3a2a1a',head:'feline',tuft:1,ear:1.2,tail:'bob',spots:'#6a4a32',hs:1.05,eyeC:'#d8c030',ruff:'#d8c4a4',lt:1.1,cheek:'#e8dcc8',
}),
 // ── PANTANO ──
 varano:S=>saurian(S,{pnt:[PNT.spots('#c8c088',16,.22,.2)],ln:1.2,lg:1.15,w:1,h:1.15,col:'#4a5a34',bel:'#a8a874',dk:'#2a3420',bands:'#2e3a22',hs:1.1,tl:1.15,eyeC:'#d8b030',
  hx(S,P,s){S.l(P(.27*s,-.015),P(.42*s,-.03),.006,.006,'#c84a5a',{n:4});for(const x of[-1,1])S.l(P(.42*s,-.03),P(.47*s,-.025,x*.025),.004,.004,'#c84a5a',{n:3})}}),
 sapo:S=>{S.bone('root',null,0,0,0).bone('body','root',0,.42,0);const O=S.o||{},C=O.col||'#6a6a34',B=O.bel||'#c8c08a',D=O.dk||'#3a3a1e',lx=.24;
  S.bone('legFL','body',lx,.3,.22).bone('legFR','body',-lx,.3,.22).bone('legBL','body',lx,.32,-.2).bone('legBR','body',-lx,.32,-.2);S.on('body');
  S.e(0,.42,0,.36,.28,.42,C,{lo:B});S.e(0,.3,.02,.3,.16,.36,B);for(let i=0;i<30;i++){const a=hs(i,3,7)*PI,zz=(hs(i,5,7)-.5)*.7;S.e(Math.cos(a)*.34,.42+Math.sin(a)*.24,zz,.03,.025,.03,hs(i,9,7)>.5?'#8a7a3a':D,{d:'lo'})}
  for(const x of[-1,1])S.e(x*.25,.62,-.02,.08,.05,.18,'#7a6a3a',{r:[0,0,x*.3]});
  for(const[n,x,z,r]of[['legFL',lx,.22,0],['legFR',-lx,.22,0],['legBL',lx,-.2,1],['legBR',-lx,-.2,1]]){S.on(n);const s=Math.sign(x);if(r){S.e(x+s*.08,.22,z,.11,.14,.2,C,{r:[.3,0,s*.3],lo:B});S.l([x+s*.14,.14,z-.12],[x+s*.18,.04,z+.08],.05,.04,C,{jt:1});S.e(x+s*.18,.02,z+.14,.09,.02,.11,'#5a5a2a',{d:'md'})}
   else{S.l([x,.3,z],[x+s*.06,.03,z+.08],.06,.04,C,{jt:1,lo:B});for(let i=-1;i<=1;i++)S.e(x+s*.06+i*.04,.015,z+.13,.025,.015,.04,'#5a5a2a',{d:'lo'})}}
  S.bone('head','body',0,.48,.34);S.on('head');S.e(0,.52,.42,.3,.17,.2,C,{lo:B});S.e(0,.44,.46,.28,.08,.18,B);S.e(0,.5,.58,.22,.03,.04,'#4a3a2a',{d:'md'});
  for(const x of[-1,1]){S.e(x*.16,.66,.42,.07,.07,.07,C);S.e(x*.17,.68,.46,.045,.045,.045,'#d8a020',{em:0,d:'md'});S.e(x*.175,.68,.49,.03,.012,.012,'#100a06',{d:'lo',j:0});S.e(x*.24,.6,.36,.05,.035,.06,'#7a6a3a',{d:'lo'})}
  S.bone('tail','body',0,.4,-.4);if(O.x)O.x(S);const m={back:.7,sz:-.06,bw:.32,bh:.28,fw:.38,LH:.3,by:.42,hd:{P:HD([0,.52,.42],.0).P,r:[0,0,0]},cyc:1.4,rad:.5,eye:[.17,.68,.46,.04]};m.seat=m.back+.045-.04;saddle(S,m);bridle(S,m,{hd:HD([0,.5,.42],0),mz:.12,mr:.22,poll:0});return m},
 raptor:S=>avian(S,{lg:1.05,col:'#5a6a3a',bel:'#b8b07a',dk:'#2a3420',nc:'#5a6a3a',headC:'#5a6a3a',toothy:1,nl:.8,nr:.085,ha:.15,tailR:1,tl:1.2,wing:'arm',sickle:1,leg:'#4a5a2a',thigh:'#5a6a3a',crest:'#c84a2a',eyeC:'#e8c030',pitch:-.25,
  pnt:[PNT.tiger('#2a3420',30,.3)]}),
 bufalo:S=>ungulate(S,{lg:.85,ln:1.1,w:1.3,h:1.1,col:'#4a4a4e',bel:'#3a3a3e',dk:'#2a2a2e',head:'bovine',hs:1.08,na:.25,nl:.55,nr:1.35,ha:.3,tail:'tuft',cloven:1,lc:'#5a4a3a',sock:[1,1,1,1],sockC:'#6a5a44',muz:'#3a3a3a',
  x(S,c){const{P}=c.h.hd;S.on('head');for(const x of[-1,1])S.hn([P(.02,.07,x*.08),P(-.0,.1,x*.24),P(-.07,.1,x*.38),P(-.16,.12,x*.44),P(-.22,.16,x*.4)],.048,'#2a2a2c',{tip:'#6a6a6a'});S.e(...P(0,.1),.12,.03,.07,'#2a2a2c',{d:'md'});
   S.on('body');for(let i=0;i<10;i++)S.e((hs(i,1,4)-.5)*c.bw*1.6,c.by-c.bh*.6,(hs(i,3,4)-.5)*.8,.06,.035,.07,'#5a4a3a',{d:'lo',j:.2})}}),
 // ── CUMBRES ──
 yakcarga:S=>ungulate(S,{lg:.8,ln:1.05,w:1.3,h:1.2,col:'#3a2e26',bel:'#2a201a',dk:'#1e1612',head:'bovine',hs:1.0,na:.3,nl:.5,nr:1.3,ha:.45,tail:'hair',tl:.9,cloven:1,chest:1.1,lc:'#2a201a',muz:'#6a5a4a',forelock:1,
  x(S,c){S.on('body');S.e(0,c.by+c.bh*1.05,c.zf-.1,c.bw*.75,c.bh*.55,.22,'#3a2e26');S.fringe(0,0,c.bw*1.02,.62,c.by-c.bh*.15,c.by-c.bh*1.55,'#2e241c',{lo:'#1e1612',rag:.12,flare:1.18,n:40});const{P}=c.h.hd;S.on('head');for(const x of[-1,1])S.hn([P(.03,.07,x*.1),P(.0,.12,x*.2),P(.06,.25,x*.25),P(.04,.32,x*.18)],.032,'#e8dcc0',{tip:'#3a3028'})}}),
 ibice:S=>ungulate(S,{lg:.95,ln:.85,w:.95,col:'#9a8466',bel:'#e8dcc8',dk:'#4a3a2a',head:'cervid',hs:.95,na:.55,nl:.8,nr:.85,tail:'short',cloven:1,lc:'#5a4a3a',ear:.7,ha:.6,
  x(S,c){const{P}=c.h.hd;S.on('head');S.e(...P(.2,-.07),.025,.06,.025,'#4a3a2a',{r:[.4,0,0],j:.3});for(const x of[-1,1]){const pts=[];for(let i=0;i<=8;i++){const a=i/8*PI*1.05;pts.push(P(.03-.22*Math.sin(a)*1.0,.08+.3*Math.sin(a*.6)+.06*a,x*(.04+.03*a)))}
   S.hn(pts,.04,'#7a6a52',{tip:'#4a3a2a'});for(let i=1;i<8;i++)S.t(...pts[i],.035*(1-i/9),.007,'#5a4a3a',{r:[0,0,0],n:8,d:'lo'})}S.on('body');S.e(0,c.by+c.bh*.97,0,.03,.02,.45,'#4a3a2a',{d:'md'})}}),
 mamut:S=>ungulate(S,{lg:1.0,ln:1.15,w:1.75,h:1.6,col:'#6a4a32',bel:'#4a3222',dk:'#3a2618',head:'probo',hs:1.2,na:.2,nl:.25,nr:1.6,tail:'tuft',tl:.6,pad:'#3a3028',lc:'#5a3e2a',lt:1.8,hip:.92,chest:1.1,sz:-.05,
  x(S,c){S.on('body');S.e(0,c.by+c.bh*.9,c.zf-.12,c.bw*.65,c.bh*.38,.22,'#5a3e2a');S.fringe(0,0,c.bw*1.02,.66,c.by-c.bh*.05,c.by-c.bh*1.25,'#5a3e2a',{lo:'#3a2618',rag:.16,flare:1.15,n:44});S.on('head');S.fringe(c.nb[0],c.nb[2]+.06,.2,.18,c.nb[1]+.05,c.nb[1]-.28,'#5a3e2a',{lo:'#3a2618',rag:.1,n:20})}}),
 osoblanco:S=>carnivore(S,{lg:.95,ln:1.25,w:1.25,h:1.3,col:'#ece8dc',bel:'#d8d2c4',dk:'#a8a294',head:'ursine',hs:1.0,tail:'stub',plant:1,lt:1.2,claw:'#2a2420',muzC:'#e8e4d8',na:.85,nl:1.3,eyeC:'#1a1410',earIn:'#c8c2b4'}),
 // ── ORIENTAL ──
 tigre:S=>carnivore(S,{lg:1.1,ln:1.1,w:1.05,col:'#e07a2a',bel:'#f4ece0',dk:'#1a1410',head:'feline',stripes:'#1a1410',tail:'long',ring:'#1a1410',tipC:'#1a1410',cheek:'#f4ece0',muzC:'#f4ece0',hs:1.12,eyeC:'#e8c030',lt:1.1,
  x(S,c){const{P}=c.h.hd;S.on('head');for(const x of[-1,1])for(let i=0;i<3;i++)S.e(...P(.04+i*.03,.07,x*.07),.012,.04,.01,'#1a1410',{r:[0,0,x*.4],d:'lo',j:0});S.e(...P(.06,.09),.04,.008,.03,'#1a1410',{d:'lo'})}}),
 grulla:S=>avian(S,{lg:1.3,col:'#ece8e0',bel:'#e0dcd4',dk:'#2a2620',nc:'#1a1814',headC:'#1a1814',beak:'#c8b07a',beakL:1.2,nl:1.25,nr:.055,neckS:-.06,crown:'#c8302a',leg:'#3a3430',wingC:'#ece8e0',prim:'#1a1814',tailC:'#1a1814',tl:1.1,ha:.25,eyeG:false,eyeC:'#e8c030',w:.95,
  x(S,c){S.on('head');S.e(...c.P(.04*c.s,.0,0),.06,.04,.06,'#ece8e0',{d:'md'})}}),
 panda:S=>carnivore(S,{lg:.95,ln:1.0,w:1.35,h:1.3,col:'#efebe2',bel:'#e2ddd2',dk:'#1a1814',head:'ursine',hs:1.2,tail:'stub',plant:1,lt:1.25,claw:'#2a2420',muzC:'#efebe2',patchE:'#1a1814',earIn:'#1a1814',earC:'#1a1814',lc:'#1a1814',paw:'#1a1814',
  pnt:[(x,y,z,nx,ny)=>Math.abs(z-.37)<.1&&y>.45?['#1a1814',1]:null],x(S,c){const{P}=c.h.hd;S.on('head');for(const x of[-1,1])S.e(...P(.0,.1,x*.085),.045,.045,.03,'#1a1814',{d:'md'})}}),
 komainu:S=>carnivore(S,{lg:1.05,ln:.95,w:1.15,h:1.15,col:'#4a8a6a',bel:'#6aa88a',dk:'#2a5a44',head:'komainu',hs:1.15,tail:'plume',tipC:'#2a5a44',lt:1.15,claw:'#d8b050',na:1.2,nl:.9,
  x(S,c){S.on('body');S.t(0,c.nb[1]+.02,c.nb[2]+.06,.15,.018,'#d8b050',{r:[PI/2-.5,0,0],n:14});S.gl(0,c.nb[1]-.1,c.nb[2]+.16,.035,'#e8c050');
   for(const n of['legFL','legFR','legBL','legBR']){S.on(n)}}}),
 // ── VOLCÁN ──
 salamandra:S=>saurian(S,{ln:1.1,lg:1.05,w:1.05,h:1.1,col:'#2a1e1c',bel:'#4a2a20',dk:'#1a1010',cracks:'#ff6a1a',dorsal:'#ff8a2a',dorsalE:2,dorsalH:.07,eyeC:'#ffb020',tipC:'#ff6a1a',hs:1.05,
  hx(S,P,s){for(const x of[-1,1])for(let i=0;i<3;i++)S.k(P(.02*s,.03*s,x*.07*s),P(-.12*s,.06*s+i*.03,x*(.14+i*.03)*s),.022,'#ff7a2a',{n:4,em:2})},tailX(S,t){S.gl(t[0],t[1]+.02,t[2],.04,'#ffb02a')}}),
 rino:S=>ungulate(S,{pnt:[PNT.veins('#ff6a1a',5,.022,2),(x,y,z,nx,ny)=>Math.abs(Math.sin(z*11))<.12&&Math.abs(ny)<.7?['#3a3430',.8]:null],lg:.8,ln:1.15,w:1.55,h:1.3,col:'#5a5450',bel:'#4a4440',dk:'#2a2622',head:'rhino',hs:1.1,na:.15,nl:.35,nr:1.4,tail:'tuft',tl:.5,pad:'#3a3430',lt:1.6,horn:'#2a2422',hornT:'#ff7a2a',
  x(S,c){}}),
 escarabajo:S=>{S.bone('root',null,0,0,0).bone('body','root',0,.48,0);const O=S.o||{},C=O.col||'#2a1a1a',E=O.ely||'#4a1414',G=O.glow||'#ff5a1a',lx=.26;
  S.bone('legFL','body',lx,.36,.2).bone('legFR','body',-lx,.36,.2).bone('legBL','body',lx,.36,-.24).bone('legBR','body',-lx,.36,-.24);S.on('body');
  S.e(0,.52,-.08,.34,.24,.46,E,{lo:'#2a0a0a'});S.l([0,.74,-.5],[0,.75,.32],.008,.008,G,{em:2,n:4});for(let i=0;i<3;i++)for(const s of[-1,1])S.e(s*.18,.62+i*.03,-.35+i*.2,.06,.02,.08,'#6a2a1a',{d:'md'});
  S.e(0,.46,.32,.26,.18,.16,C);S.e(0,.36,-.05,.28,.1,.4,'#1a1010');for(let i=0;i<10;i++){const zz=-.45+i*.1;for(const s of[-1,1])S.e(s*.3,.5+Math.sin(i)*.03,zz,.015,.008,.04,G,{em:2,d:'lo',j:0})}
  for(const[n,x,z]of[['legFL',lx,.2],['legFR',-lx,.2],['legBL',lx,-.24],['legBR',-lx,-.24]]){S.on(n);const s=Math.sign(x);S.l([x,.36,z],[x+s*.2,.42,z+.04],.035,.025,C,{jt:1});S.l([x+s*.2,.42,z+.04],[x+s*.26,.02,z+.1],.025,.012,C,{jt:1});S.k([x+s*.26,.04,z+.1],[x+s*.28,0,z+.16],.012,'#5a3a2a',{n:4})}
  S.on('body');for(const s of[-1,1]){S.l([s*.25,.36,-.02],[s*.46,.4,-.02],.03,.022,C,{jt:1});S.l([s*.46,.4,-.02],[s*.52,.02,-.0],.02,.012,C)}
  S.bone('head','body',0,.48,.44);S.on('head');S.e(0,.46,.48,.16,.12,.1,C);S.hn([[0,.5,.54],[0,.62,.66],[0,.8,.7],[0,.9,.62]],.05,'#3a2222',{tip:G});S.k([0,.42,.56],[0,.38,.68],.04,'#3a2222');for(const s of[-1,1]){S.gl(s*.1,.5,.55,.022,'#ffb020');S.hn([[s*.08,.44,.55],[s*.14,.38,.64],[s*.08,.34,.7]],.018,'#3a2222')}
  S.bone('tail','body',0,.5,-.5);if(O.x)O.x(S);const m={back:.76,sz:-.08,bw:.34,bh:.24,fw:.42,LH:.36,by:.48,hd:{P:HD([0,.5,.5],0).P,r:[0,0,0]},cyc:1.2,rad:.55,eye:[.1,.5,.55,.03]};m.seat=m.back+.045-.04;saddle(S,m);
  if(S.sad){S.on('body');const T=TACK[5];for(const s of[-1,1])S.l([s*.06,.86,.12],[s*.1,.78,.3],.01,.01,T.le,{n:4});S.l([-.12,.8,.3],[.12,.8,.3],.018,.018,T.me)}return m},
 sabueso:S=>carnivore(S,{pnt:[PNT.veins('#ff5a1a',6,.022,2)],lg:1.1,ln:1.0,w:1.05,col:'#2a1e1e',bel:'#3a2626',dk:'#1a1010',head:'canine',hs:1.15,horn:'#3a2a2a',hornT:'#ff7a2a',fang:1,eyeC:'#ff6a1a',ear:.9,tail:'long',tipC:'#ff7a2a',lt:1.05,claw:'#ff7a2a',hump:.6,
  x(S,c){S.on('body');for(let i=0;i<11;i++)S.k([0,c.by+c.bh*.85,c.zb-.08+i*.065],[0,c.by+c.bh+.1+.04*Math.sin(i),c.zb-.12+i*.065],.03,i%2?'#ff7a2a':'#ffb02a',{em:2,n:5})}}),
 // ── PÁRAMO ──
 huargo:S=>carnivore(S,{lg:1.25,ln:1.15,w:1.1,h:1.1,col:'#4a4650',bel:'#6a6670',dk:'#1e1c22',head:'canine',hs:1.2,fang:1,eyeC:'#c8a0ff',ear:1.05,tail:'bush',tl:1.1,hump:.9,ruff:'#3a363e',lt:1.1,claw:'#d8d0bc',
  pnt:[(x,y,z,nx,ny)=>ny>.35&&fb(x*8,y*8,z*8)>.45?['#2a2830',.85]:null],x(S,c){S.on('body');S.gl(c.bw*.9,c.by+.02,c.zf-.05,.012,'#b890ff');S.gl(-c.bw*.9,c.by+.02,c.zf-.05,.012,'#b890ff')}}),
 aveterror:S=>avian(S,{lg:1.15,col:'#3a3240',bel:'#5a5060',dk:'#1e1a22',nc:'#3a3240',headC:'#3a3240',hook:1,beak:'#d8c8a0',beakT:'#4a3a2a',beakL:1.15,hs:1.5,nl:.9,nr:.09,leg:'#8a7a5a',wingC:'#2e2834',prim:'#1e1a22',tailC:'#1e1a22',crest:'#6a4a9a',eyeC:'#e0c060',claw:'#2a2018',
  x(S,c){S.on('body');for(let i=0;i<12;i++)S.e((hs(i,1,6)-.5)*c.bw*1.5,c.by+c.bh*.85,.15-i*.04,.03,.03,.06,'#2e2834',{d:'lo',j:.3})}}),
 ciervorunico:S=>ungulate(S,{lg:1.15,ln:.95,w:.88,col:'#4a4652',bel:'#3a3640',dk:'#1e1c22',head:'cervid',hs:1.05,na:.4,nl:1.0,nr:.75,tail:'short',lc:'#d8d0bc',sock:[1,1,1,1],sockC:'#d8d0bc',hoof:'#3a3640',eyeC:'#c8a0ff',eyeG:1,muz:'#d8d0bc',
  x(S,c){S.on('body');for(let i=0;i<5;i++)for(const s of[-1,1])S.l([s*c.bw*.6,c.by+c.bh*.6,.2-i*.11],[s*c.bw*1.0,c.by-c.bh*.2,.18-i*.11],.012,.01,'#d8d0bc',{n:5});
   for(let i=0;i<6;i++)S.gl((i%2?1:-1)*c.bw*.98,c.by+.04,.3-i*.12,.014,'#b890ff');const{P}=c.h.hd;S.on('head');S.e(...P(.12,.03),.065,.04,.11,'#d8d0bc',{r:c.h.hd.r,d:'md'});
   for(const x of[-1,1]){const b=P(.03,.07,x*.04),pts=[b,[b[0]+x*.08,b[1]+.18,b[2]-.08],[b[0]+x*.2,b[1]+.3,b[2]-.06],[b[0]+x*.24,b[1]+.46,b[2]-.14]];S.hn(pts,.022,'#d8d0bc',{tip:'#efe8d8'});S.hn([pts[1],[pts[1][0]+x*.0,pts[1][1]+.12,pts[1][2]+.1]],.014,'#d8d0bc');S.hn([pts[2],[pts[2][0]-x*.04,pts[2][1]+.16,pts[2][2]+.05]],.012,'#d8d0bc');S.gl(pts[2][0],pts[2][1],pts[2][2],.016,'#b890ff')}}}),
 tejon:S=>carnivore(S,{lg:.85,ln:1.1,w:1.45,h:1.0,col:'#7a7670',bel:'#2a2622',dk:'#1a1612',head:'badger',hs:1.25,tail:'stub',plant:1,lt:1.25,claw:'#e8e0d0',lc:'#1a1612',paw:'#1a1612',na:.3,nl:.5,
  pnt:[(x,y,z)=>{const n=fb(x*9,y*9,z*9);return n>.6?['#a8a49c',.8]:n<.35?['#4a4640',.6]:null}]}),
 // ── DESIERTO ──
 camello:S=>ungulate(S,{lg:1.25,ln:1.0,w:1.0,col:'#b88a5a',bel:'#a07448',dk:'#6a4a2a',head:'camel',hs:1.0,na:.9,nl:1.05,nr:.8,tail:'tuft',tl:.8,pad:'#8a6a4a',lt:1.05,sz:-.02,hip:.92,
  x(S,c){S.on('body');S.e(0,c.by+c.bh*1.05,c.zf+.02,c.bw*.55,c.bh*.6,.15,'#a87a4a',{lo:'#b88a5a'});S.e(0,c.by+c.bh*1.02,c.zb-.04,c.bw*.55,c.bh*.56,.15,'#a87a4a',{lo:'#b88a5a'});S.e(0,c.by+c.bh*1.6,c.zf+.02,.07,.05,.07,'#6a4a2a',{j:.3});S.e(0,c.by+c.bh*1.52,c.zb-.04,.06,.045,.06,'#6a4a2a',{j:.3});
   S.on('head');const n=c.nb,t=c.nt;for(let i=0;i<5;i++){const u=i/4;S.e(0,n[1]+(t[1]-n[1])*u-.06,n[2]+(t[2]-n[2])*u+.06,.05,.07,.04,'#8a6440',{j:.3,d:'md'})}}}),
 orix:S=>ungulate(S,{lg:1.0,ln:.92,w:.95,col:'#d8cfc0',bel:'#efe9e0',dk:'#2a2420',head:'cervid',hs:1.0,na:.45,nl:.95,nr:.8,tail:'tuft',tl:.7,cloven:1,ear:.8,mask:'#2a2420',lc:'#efe9e0',
  pnt:[(x,y,z,nx,ny)=>Math.abs(ny)<.55&&Math.abs(y-.66)<.035&&Math.abs(z)<.48?['#3a2a20',1]:null,(x,y,z)=>y<.5&&y>.36&&z>.2?['#2a2420',.9]:null],
  x(S,c){
   const{P}=c.h.hd;S.on('head');for(const x of[-1,1]){const b=P(.03,.07,x*.035);S.hn([b,[b[0]+x*.02,b[1]+.25,b[2]-.18],[b[0]+x*.035,b[1]+.48,b[2]-.38],[b[0]+x*.04,b[1]+.62,b[2]-.52]],.024,'#2a2420');for(let i=1;i<6;i++)S.t(b[0]+x*.008*i,b[1]+.05*i,b[2]-.04*i,.022,.006,'#1a1410',{r:[.6,0,0],n:8,d:'lo'})}}}),
 avestruz:S=>avian(S,{lg:1.35,w:1.15,h:1.15,col:'#1e1a18',bel:'#2a2420',dk:'#0e0c0a',nc:'#d8a898',headC:'#d8a898',beak:'#e0c890',nl:1.3,nr:.05,thigh:'#d8a898',leg:'#d8a898',wingC:'#1e1a18',prim:'#efe8dc',tailC:'#efe8dc',toes:2,tailUp:.5,eyeG:false,eyeC:'#3a2a1a',hs:1.1,
  x(S,c){S.on('body');for(let i=0;i<16;i++)S.e((hs(i,1,2)-.5)*c.bw*1.6,c.by+c.bh*(.4+hs(i,4,2)*.5),(hs(i,7,2)-.5)*.6,.05,.03,.07,'#2a2420',{d:'md',j:.3})}}),
 gola:S=>saurian(S,{ln:1.0,lg:1.35,w:.95,h:1.0,col:'#b8784a',bel:'#e0b888',dk:'#6a4a2a',eyeC:'#e8c030',hs:1.05,tl:1.3,na:.6,nl:1.4,
  hx(S,P,s){for(let i=0;i<9;i++){const a=(i/8-.5)*PI*1.4,c=i%2?'#e8a038':'#c84a2a';S.e(...P(.02*s,Math.cos(a)*.12*s,Math.sin(a)*.17*s),.03,.075,.02,c,{r:[.2,0,-a],d:'md'})}S.t(...P(.03*s,0),.17*s,.01,'#6a2a1a',{r:[.2,0,0],n:16,arc:PI*1.4})}}),
 // ── COSTA ──
 tortuga:S=>{S.bone('root',null,0,0,0).bone('body','root',0,.4,0);const O=S.o||{},C=O.col||'#5a7a6a',B=O.bel||'#c8c09a',SH=O.shell||'#4a5a3a',lx=.28;
  S.bone('legFL','body',lx,.28,.28).bone('legFR','body',-lx,.28,.28).bone('legBL','body',lx,.28,-.28).bone('legBR','body',-lx,.28,-.28);S.on('body');
  S.e(0,.48,0,.44,.3,.56,SH,{lo:'#3a4a2e'});S.e(0,.3,0,.4,.08,.5,B);for(let i=0;i<5;i++){const z=-.32+i*.16;S.e(0,.74-Math.abs(i-2)*.02,z,.11,.05,.08,'#6a7a4a',{d:'md'});for(const s of[-1,1])S.e(s*.24,.66,z+.02,.1,.04,.08,'#5a6a3e',{r:[0,0,s*.5],d:'md'})}
  for(let i=0;i<14;i++){const a=i/14*PI*2;S.e(Math.sin(a)*.44,.32,Math.cos(a)*.56,.06,.03,.06,'#3a4a2e',{d:'lo'})}for(let i=0;i<9;i++)S.e((hs(i,2,4)-.5)*.5,.68+hs(i,5,4)*.06,(hs(i,7,4)-.5)*.7,.025,.03,.025,'#e8e0c8',{d:'lo'});
  for(const[n,x,z,r]of[['legFL',lx,.28,0],['legFR',-lx,.28,0],['legBL',lx,-.28,1],['legBR',-lx,-.28,1]]){S.on(n);const s=Math.sign(x);S.l([x,.28,z],[x+s*.12,.06,z+(r?-.04:.06)],.09,.08,C,{jt:1});S.e(x+s*.13,.04,z+(r?-.05:.1),.1,.04,.12,C,{lo:'#4a6a5a'});for(let i=0;i<4;i++)S.e(x+s*.12+Math.cos(i)*.05,.05,z+Math.sin(i)*.05,.02,.01,.02,'#e8e0c8',{d:'lo',j:0})}
  S.bone('head','body',0,.36,.52);S.on('head');S.l([0,.36,.5],[0,.44,.72],.11,.09,C,{lo:'#4a6a5a'});S.e(0,.48,.8,.11,.09,.13,C,{lo:'#4a6a5a'});S.e(0,.45,.92,.06,.04,.04,'#3a4a3a',{d:'md'});S.eye(.08,.51,.84,.018,'#1a1410');for(let i=0;i<6;i++)S.e((hs(i,3,1)-.5)*.16,.55,.74+hs(i,6,1)*.12,.02,.01,.02,'#2a3a2a',{d:'lo'});
  S.bone('tail','body',0,.34,-.58);if(O.x)O.x(S);S.on('tail');S.k([0,.34,-.55],[0,.3,-.72],.05,C);const m={back:.78,sz:-.04,bw:.42,bh:.3,fw:.5,LH:.28,by:.4,hd:{P:HD([0,.48,.82],0).P,r:[0,0,0]},cyc:1.0,rad:.65,eye:[.08,.51,.84,.02]};m.seat=m.back+.045-.04;saddle(S,m);
  if(S.sad){S.on('head');const T=TACK[8];for(const s of[-1,1])S.l([s*.1,.47,.86],[s*.2,.84,.12],.007,.007,T.le,{n:4});S.t(0,.47,.86,.11,.012,T.tr,{r:[0,0,0],n:12})}return m},
 cangrejo:S=>{S.bone('root',null,0,0,0).bone('body','root',0,.46,0);const O=S.o||{},C=O.col||'#c84a2a',B=O.bel||'#e8b088',D=O.dk||'#7a2a1a',lx=.3;
  S.bone('legFL','body',lx,.42,.1).bone('legFR','body',-lx,.42,.1).bone('legBL','body',lx,.42,-.18).bone('legBR','body',-lx,.42,-.18);S.on('body');
  S.e(0,.5,0,.5,.18,.38,C,{lo:D});S.e(0,.58,-.02,.36,.12,.28,'#d8603a');for(let i=0;i<12;i++)S.e((hs(i,2,3)-.5)*.8,.6+hs(i,4,3)*.04,(hs(i,6,3)-.5)*.5,.025,.025,.025,'#a83a1a',{d:'lo'});S.e(0,.36,0,.38,.06,.3,B);
  for(const[n,x,z]of[['legFL',lx,.1],['legFR',-lx,.1],['legBL',lx,-.18],['legBR',-lx,-.18]]){S.on(n);const s=Math.sign(x);for(let j=0;j<2;j++){const zz=z+j*.12-.06;S.l([x,.42,zz],[x+s*.32,.66,zz+.03],.035,.028,C,{jt:1});S.l([x+s*.32,.66,zz+.03],[x+s*.6,0,zz+.08],.028,.008,j?D:C,{jt:1})}}
  S.bone('head','body',0,.5,.36);S.on('head');for(const s of[-1,1]){S.l([s*.08,.56,.34],[s*.09,.72,.38],.015,.012,C);S.e(s*.09,.75,.38,.035,.035,.035,'#1a1410',{d:'md'});S.l([s*.3,.44,.3],[s*.42,.48,.52],.06,.05,C,{jt:1});S.e(s*.44,.5,.66,.12,.09,.16,C,{lo:D});S.k([s*.42,.53,.76],[s*.38,.52,.92],.05,'#3a1a1a');S.k([s*.47,.46,.74],[s*.46,.44,.88],.04,'#3a1a1a')}
  S.bone('tail','body',0,.46,-.38);if(O.x)O.x(S);const m={back:.68,sz:-.05,bw:.38,bh:.18,fw:.46,LH:.42,by:.46,hd:{P:HD([0,.56,.38],0).P,r:[0,0,0]},cyc:1.0,rad:.6,eye:[.09,.75,.38,.04]};m.seat=m.back+.045-.04;saddle(S,m);
  if(S.sad){S.on('head');const T=TACK[8];for(const s of[-1,1])S.l([s*.09,.7,.38],[s*.15,.78,.14],.007,.007,T.le,{n:4})}return m},
 iguana:S=>saurian(S,{ln:1.1,lg:1.0,w:1.05,h:1.15,col:'#2a2a2c',bel:'#4a4a42',dk:'#1a1a1c',dorsal:'#5a5a52',dorsalH:.11,scutes:'#5a5850',eyeC:'#c84a2a',hs:1.0,tl:1.2,
  hx(S,P,s){for(let i=0;i<8;i++)S.e(...P(.03*s+i*.025*s,.06*s,(hs(i,1,1)-.5)*.08*s),.02,.02,.02,'#8a8a7a',{d:'lo'});S.e(...P(.06*s,-.07*s),.04,.05,.04,'#4a3a3a',{d:'md'})}}),
 gavion:S=>avian(S,{lg:.95,w:1.3,h:1.25,ln:1.1,col:'#efede8',bel:'#ffffff',dk:'#4a4c52',nc:'#efede8',headC:'#efede8',hook:1,beak:'#e8c040',beakT:'#c8402a',beakL:.95,hs:1.3,nl:.6,nr:.11,leg:'#e8a030',wingC:'#8a8e96',prim:'#1a1a1c',tailC:'#efede8',eyeG:false,eyeC:'#e8c030',wingL:1.25,
  x(S,c){S.on('body');for(const s of[-1,1])S.e(s*c.bw*.97,c.by+.06,-.1,.03,.05,.2,'#8a8e96',{d:'md'})}}),
 // ── RARAS (únicas): 2 por bioma; una sola en el mundo, aparición muy baja (src/mountdata.js) ──

 unicornio:S=>ungulate(S,{col:'#f4f2ee',bel:'#e4e0da',dk:'#e8d8a8',lc:'#f4f2ee',hoof:'#c8a050',sock:[0,0,0,0],mane:'flow',tail:'hair',tl:1.15,muz:'#e8dcd4',eyeC:'#5ab0e8',eyeG:1,
  x(S,c){const{P}=c.h.hd;S.on('head');const b=P(.07,.09),tp=P(.04,.42);S.hn([b,tp],.03,'#f0d890',{tip:'#fff8e0'});for(let i=0;i<5;i++)S.t(...P(.07-i*.006,.12+i*.06),.026-i*.004,.006,'#c8a050',{r:[c.h.hd.r[0]-PI/2+.2,0,0],n:8,d:'lo'});S.gl(...tp,.012,'#fff4c0');
   S.on('body');for(let i=0;i<8;i++)S.gl((hs(i,2,1)-.5)*.3,c.by+c.bh*(.2+hs(i,5,1)*.6),(hs(i,7,1)-.5)*.8,.008,'#ffe8a0')}}),
 pegaso:S=>ungulate(S,{lg:1.05,col:'#d8dce8',bel:'#c4c8d8',dk:'#8a9ab8',sock:[1,1,1,1],sockC:'#f4f4f8',mane:'flow',tail:'hair',tl:1.2,blaze:1,
  x(S,c){wings(S,c.by+c.bh*.7,c.zf-.06,c.bw,{col:'#f4f4f8',prim:'#c8d0e8',len:1.05})}}),
 ciervolunar:S=>ungulate(S,{lg:1.1,ln:.9,w:.85,col:'#2a3a52',bel:'#4a5a78',dk:'#1a2232',head:'cervid',na:.35,nl:1.05,nr:.75,tail:'short',rump:'#b8e8ff',lt:.82,eyeC:'#9ff0ff',eyeG:1,muz:'#1a2232',
  pnt:[PNT.spots('#9ff0ff',13,.2,.5)],x(S,c){const{P}=c.h.hd;S.on('head');for(const x of[-1,1]){const b=P(.04,.075,x*.04),t1=[b[0]+x*.12,b[1]+.24,b[2]-.06],t2=[b[0]+x*.2,b[1]+.44,b[2]-.02],t3=[b[0]+x*.16,b[1]+.6,b[2]-.12];
   S.hn([b,t1,t2,t3],.022,'#3a6a8a',{tip:'#cff8ff'});for(const t of[t1,t2,t3])S.gl(t[0],t[1],t[2],.02,'#9ff0ff');S.hn([t2,[t2[0]-x*.06,t2[1]+.12,t2[2]+.05]],.012,'#3a6a8a',{tip:'#cff8ff'})}}}),
 osomusgo:S=>carnivore(S,{lg:1.15,ln:1.15,w:1.35,h:1.4,col:'#4a3a28',bel:'#5a4a32',dk:'#2a2014',head:'ursine',hs:1.15,hump:1.2,tail:'stub',plant:1,lt:1.3,claw:'#2a2018',muzC:'#7a6a4a',na:1.2,nl:.8,eyeC:'#c8f070',
  pnt:[(x,y,z,nx,ny)=>ny>.25&&fb(x*6,y*6,z*6)>.42?['#4a7a2a',.9]:null],x(S,c){S.on('body');for(let i=0;i<6;i++){const zz=-.3+i*.12,y=c.by+c.bh*.95;S.l([0,y,zz],[(hs(i,1,4)-.5)*.1,y+.12,zz-.03],.012,.006,'#3a2a1a',{n:5});S.e(0,y+.13,zz-.03,.03,.012,.03,'#d8c070',{d:'lo'});S.gl((hs(i,3,4)-.5)*.3,y-.04,zz,.012,'#c8f070')}}}),
 cocodrilo:S=>saurian(S,{ln:1.35,lg:1.0,w:1.15,h:1.05,col:'#3a4a2e',bel:'#c8c49a',dk:'#1e281a',dorsal:'#2a3420',dorsalH:.06,scutes:'#2a3420',hs:1.35,tl:1.3,eyeC:'#e8d030',
  hx(S,P,s){S.e(...P(.3*s,-.0),.06*s,.035*s,.12*s,'#3a4a2e',{r:[0,0,0]});for(let i=0;i<7;i++)for(const x of[-1,1])S.k(P(.12*s+i*.04*s,-.02*s,x*.06*s),P(.12*s+i*.04*s,-.06*s,x*.065*s),.008,'#efe6d0',{n:4})},pnt:[PNT.bands('#2a3420',18,.1)]}),
 sapojade:S=>{S.o={col:'#2a8a6a',bel:'#b8e8c8',dk:'#1a5a44',x(S){S.on('body');for(let i=0;i<10;i++){const a=hs(i,3,9)*PI,zz=(hs(i,5,9)-.5)*.6;S.gl(Math.cos(a)*.33,.44+Math.sin(a)*.22,zz,.022,'#a8ffd0')}S.t(0,.66,.0,.12,.02,'#d8b050',{r:[PI/2,0,0],n:14})}};return SPEC.sapo(S)},
 ibicecristal:S=>ungulate(S,{lg:.98,ln:.85,w:.95,col:'#e8eef4',bel:'#ffffff',dk:'#8aa8c8',head:'cervid',hs:.95,na:.55,nl:.8,nr:.85,tail:'short',cloven:1,lc:'#c8d8e8',ear:.7,ha:.6,eyeC:'#bff4ff',eyeG:1,
  x(S,c){const{P}=c.h.hd;S.on('head');for(const x of[-1,1]){const pts=[];for(let i=0;i<=7;i++){const a=i/7*PI*1.05;pts.push(P(.03-.22*Math.sin(a),.08+.3*Math.sin(a*.6)+.06*a,x*(.04+.03*a)))}S.hn(pts,.04,'#8fd8ff',{tip:'#e8fcff',em:2});
   for(let i=1;i<7;i++)S.k(pts[i],[pts[i][0]+x*.05,pts[i][1]+.06,pts[i][2]-.02],.015,'#cff4ff',{n:4,em:2})}S.on('body');for(let i=0;i<6;i++)S.k([(hs(i,1,6)-.5)*.2,c.by+c.bh*.9,-.3+i*.12],[(hs(i,1,6)-.5)*.2,c.by+c.bh+.1,-.32+i*.12],.025,'#bff0ff',{n:5,em:2})}}),
 qilin:S=>ungulate(S,{lg:1.05,ln:.95,col:'#e8b048',bel:'#f4e0a0',dk:'#2a7a5a',head:'cervid',hs:1.05,na:.45,nl:.95,nr:.85,tail:'hair',tl:1.1,cloven:1,lc:'#c88a30',hoof:'#2a7a5a',eyeC:'#ff8a3a',eyeG:1,muz:'#c88a30',
  pnt:[PNT.spots('#c87a2a',18,.28,.5)],x(S,c){const{P}=c.h.hd;S.on('head');for(const x of[-1,1])S.hn([P(.04,.07,x*.035),P(-.04,.2,x*.06),P(-.12,.28,x*.05)],.02,'#2a7a5a',{tip:'#7ae8b8'});S.l(P(.2,-.03),P(.26,-.16,.06),.01,.004,'#2a7a5a',{n:4});S.l(P(.2,-.03),P(.26,-.16,-.06),.01,.004,'#2a7a5a',{n:4});
   if(S.NL)for(const q of S.NL)S.k([q.p[0],q.p[1]+q.n[1]*q.rd*.85,q.p[2]+q.n[2]*q.rd*.85],[q.p[0],q.p[1]+q.n[1]*q.rd*1.6,q.p[2]+q.n[2]*q.rd*1.6-.03],.03,'#ff7a2a',{n:5,em:2});
   for(const n of['legFL','legFR','legBL','legBR']){S.on(n);const xx=n.endsWith('L')?c.bw*.62:-c.bw*.62,zz=n[3]==='F'?c.zf+.04:c.zb-.04;S.k([xx,.16,zz],[xx,.24,zz-.06],.04,'#ff8a3a',{n:5,em:2})}}}),
 tigreblanco:S=>carnivore(S,{lg:1.15,ln:1.15,w:1.08,col:'#f0f2f8',bel:'#ffffff',dk:'#1a2a4a',head:'feline',stripes:'#2a3a6a',tail:'long',ring:'#2a3a6a',tipC:'#2a3a6a',cheek:'#ffffff',muzC:'#ffffff',hs:1.15,eyeC:'#7ad8ff',lt:1.1,
  pnt:[PNT.veins('#9fe0ff',5,.02,2)]}),
 corcelinfernal:S=>ungulate(S,{lg:1.05,col:'#1e1616',bel:'#2a1e1c',dk:'#ff6a1a',lc:'#1e1616',hoof:'#ff7a2a',eyeC:'#ff6a1a',eyeG:1,mane:'flow',tail:'hair',tl:1.15,muz:'#2a1e1c',
  pnt:[PNT.veins('#ff5a1a',6,.025,2)],x(S,c){if(S.NL){S.on('head');for(const q of S.NL)S.gl(q.p[0]+.04,q.p[1]+q.n[1]*q.rd*.9,q.p[2]+q.n[2]*q.rd*.9,.03,'#ff8a2a')}for(const n of['legFL','legFR','legBL','legBR']){S.on(n);const xx=n.endsWith('L')?c.bw*.62:-c.bw*.62,zz=n[3]==='F'?c.zf+.07:c.zb-.02;S.gl(xx,.04,zz,.045,'#ffa040')}}}),
 cuervo:S=>avian(S,{lg:1.1,w:1.2,h:1.15,col:'#1a1a22',bel:'#2a2a34',dk:'#0e0e14',nc:'#1a1a22',headC:'#1a1a22',hook:1,beak:'#2a2a30',beakT:'#4a4a52',beakL:.9,hs:1.3,nl:.55,nr:.1,leg:'#2a2a30',wingC:'#1e1e28',prim:'#0e0e14',tailC:'#0e0e14',tl:1.3,eyeC:'#c890ff',
  pnt:[(x,y,z,nx,ny)=>ny>.4?['#3a2a5a',.5]:null],x(S,c){S.on('body');for(let i=0;i<5;i++)S.gl(0,c.by+c.bh*.8,.1-i*.08,.012,'#b890ff')}}),
 escarabajosol:S=>{S.o={col:'#4a3410',ely:'#d8a830',glow:'#fff0a0',x(S){S.on('body');S.gl(0,.78,-.06,.06,'#ffe070');S.t(0,.78,-.06,.1,.012,'#7a2a1a',{r:[PI/2,0,0],n:16})}};return SPEC.escarabajo(S)},
 esfinge:S=>carnivore(S,{lg:1.15,ln:1.15,w:1.15,h:1.1,col:'#d8a860',bel:'#f0d8a0',dk:'#8a5a2a',head:'feline',hs:1.2,tail:'lion',tipC:'#8a5a2a',lt:1.15,claw:'#2a1a10',eyeC:'#3ac8e8',
  x(S,c){const{P}=c.h.hd;S.on('head');for(const x of[-1,1]){S.e(...P(.0,-.02,x*.13),.03,.16,.07,'#e8c040',{r:[0,0,x*.15]});for(let i=0;i<4;i++)S.e(...P(.0,.04-i*.06,x*.135),.032,.012,.072,'#2a5aa8',{d:'lo'})}S.e(...P(.02,.1),.13,.05,.1,'#e8c040',{r:c.h.hd.r});S.k(P(.08,.12),P(.12,.2),.02,'#e8c040');
   wings(S,c.by+c.bh*.7,c.zf-.06,c.bw,{col:'#e8c040',prim:'#2a5aa8',len:.9})}}),
 tortugadragon:S=>{S.o={col:'#2a6a6a',bel:'#e8d090',shell:'#c89a30',x(S){S.on('body');for(let i=0;i<5;i++)S.k([0,.74,-.32+i*.16],[0,.86,-.36+i*.16],.04,'#7a2a1a',{n:5});S.on('head');for(const x of[-1,1])S.hn([[x*.06,.54,.78],[x*.12,.64,.7],[x*.14,.7,.6]],.02,'#e8d090');S.gl(0,.48,.94,.02,'#ffb030')}};return SPEC.tortuga(S)},
 cangrejorey:S=>{S.o={col:'#2a4a9a',bel:'#c8d8f0',dk:'#1a2a5a',x(S){S.on('body');for(let i=0;i<5;i++)S.k([(i-2)*.12,.62,.02],[(i-2)*.12,.74,.0],.03,'#e8c040',{n:5});S.on('head');for(const s of[-1,1])S.gl(s*.44,.52,.7,.02,'#7ad8ff')}};return SPEC.cangrejo(S)},
 dragon:S=>saurian(S,{pnt:[(x,y,z,nx,ny)=>ny<-.4?['#e89a48',.85]:null],ln:1.2,lg:1.3,w:1.05,h:1.2,col:'#7a1e1a',bel:'#e8a04a',dk:'#3a0e0c',dorsal:'#2a0a08',dorsalH:.09,eyeC:'#ffd040',hs:1.15,tl:1.3,claw:'#2a1a14',na:.75,nl:1.6,
  hx(S,P,s){for(const x of[-1,1]){S.hn([P(.02*s,.05*s,x*.05*s),P(-.1*s,.12*s,x*.09*s),P(-.22*s,.14*s,x*.1*s),P(-.3*s,.1*s,x*.08*s)],.028,'#2a1a14',{tip:'#e8d0a0'});S.k(P(.1*s,-.03*s,x*.07*s),P(.06*s,-.08*s,x*.12*s),.02,'#2a1a14',{n:4})}S.gl(...P(.3*s,-.02*s),.025,'#ffb030')},
  tailX(S,t){S.k([t[0],t[1],t[2]],[t[0],t[1]+.12,t[2]-.08],.06,'#2a0a08',{n:4});S.k([t[0],t[1],t[2]],[t[0],t[1]-.06,t[2]-.12],.05,'#2a0a08',{n:4})},
  x(S,c){wings(S,c.by+c.bh*.65,c.zf-.06,c.bw,{bone:'#4a100c',membrane:'#a8382a',claw:'#e8d0a0',len:1.05});S.on('body');for(let i=0;i<5;i++)S.gl(0,c.by-c.bh*.7,-.25+i*.13,.025,'#ffb030')}}),
 espectral:S=>carnivore(S,{lg:1.3,ln:1.15,w:1.05,col:'#8ab0c8',bel:'#b8d8e8',dk:'#3a5a7a',head:'canine',hs:1.2,fang:1,eyeC:'#bff4ff',ear:1.15,tail:'bush',tl:1.25,tipC:'#dff8ff',ruff:'#a8d0e4',lt:1.1,claw:'#dff8ff',
  pnt:[PNT.veins('#e8fcff',4,.03,2),(x,y,z,nx,ny)=>ny>.3?['#a8cce0',.6]:null],x(S,c){S.on('body');for(let i=0;i<6;i++)S.gl(0,c.by+c.bh*.95,c.zb+i*.13,.016,'#9fe8ff');
   for(const n of['legFL','legFR','legBL','legBR']){S.on(n);const x=n.endsWith('L')?c.bw*.62:-c.bw*.62,z=n[3]==='F'?c.zf+.02:c.zb;S.e(x,.07,z+.04,.06,.05,.07,'#bff4ff',{em:2,d:'lo',j:0})}}}),
 grifo:S=>carnivore(S,{lg:1.25,ln:1.1,w:1.1,col:'#c89a5a',bel:'#e8d4a8',dk:'#6a4a2a',head:'eagle',hs:1.3,feat:'#f4f0e6',beak:'#e8b030',tail:'lion',tipC:'#6a4a2a',lt:1.1,claw:'#2a2018',na:1.0,nl:1.4,ruff:'#f4f0e6',
  x(S,c){wings(S,c.by+c.bh*.7,c.zf-.04,c.bw,{col:'#f4f0e6',prim:'#8a5a2e',len:.95});S.on('legFL');S.e(c.bw*.62,.25,c.zf+.03,.06,.12,.06,'#f4f0e6',{j:.3});S.on('legFR');S.e(-c.bw*.62,.25,c.zf+.03,.06,.12,.06,'#f4f0e6',{j:.3});S.on('head');S.l(c.nb,c.nt,.15,.12,'#f4f0e6',{j:.25})}})};

// ── API ──
export const MSPEC=SPEC;
// bioma de cada especie (cultura del aparejo por defecto; 9 = rara). La fuente de los DATOS de juego es src/mountdata.js (MTD): deben coincidir (rules_check lo vigila)
export const MBIO={caballo:0,poni:0,asno:0,uro:0,ciervo:1,alce:1,osopardo:1,lince:1,varano:2,sapo:2,raptor:2,bufalo:2,yakcarga:3,ibice:3,mamut:3,osoblanco:3,tigre:4,grulla:4,panda:4,komainu:4,
 salamandra:5,rino:5,escarabajo:5,sabueso:5,huargo:6,aveterror:6,ciervorunico:6,tejon:6,camello:7,orix:7,avestruz:7,gola:7,tortuga:8,cangrejo:8,iguana:8,gavion:8,dragon:9,espectral:9,grifo:9,unicornio:9,pegaso:9,ciervolunar:9,osomusgo:9,cocodrilo:9,sapojade:9,ibicecristal:9,qilin:9,tigreblanco:9,corcelinfernal:9,cuervo:9,escarabajosol:9,esfinge:9,tortugadragon:9,cangrejorey:9};
// Construye una especie: devuelve {bones:[{n,p,o}], geos:{nombre:BufferGeometry}, meta}. sad = con silla y bridas (montura); cul = cultura del aparejo
export function makeSpecies(sp,sad,cul,tk){const f=SPEC[sp];if(!f)return null;const S=new Bld(sp.length*31+sp.charCodeAt(0),!!sad,cul|0);if(tk){S.tk={};String(tk).split(',').forEach(q=>{const m=/^(sd|br)(\d+)$/.exec(q);if(m)S.tk[m[1]]=+m[2]})}const meta=f(S);
 meta.top=S.top;meta.len=S.zmax-S.zmin;const geos={};for(const b of S.B){S.G[b.n].paint(S.PT);geos[b.n]=S.G[b.n].geo()}return{bones:S.B,geos,meta}}
// En grupos de three (montura e icono): cada hueso = Group en su origen relativo; cada geometría = Mesh con contorno HIJO (regla CONTORNO-HIJO)
export function groupsOf(d,mat,hull,ink=.012,cast=true){const grp=new THREE.Group(),R={},abs={};for(const b of d.bones){const g=new THREE.Group(),pa=b.p?abs[b.p]:[0,0,0];g.position.set(b.o[0]-pa[0],b.o[1]-pa[1],b.o[2]-pa[2]);abs[b.n]=b.o;
  (b.p?R[b.p]:grp).add(g);R[b.n]=g;const geo=d.geos[b.n];if(geo){const m=new THREE.Mesh(geo,mat);m.receiveShadow=true;m.castShadow=cast;if(hull)m.add(hull(geo,ink));g.add(m)}}return{grp,R}}
