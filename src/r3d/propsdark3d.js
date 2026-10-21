// NotScape · R3D · F2-C (Q02, 18 oct 2026) · PROPS DE ALDEA REDISEÑADOS EN EL LENGUAJE OSCURO (dark fantasy / óleo oscuro).
// Los props de `ORG.U` (casa, taberna, granero, cabaña, pozo, farola, barril, caja, heno, valla) se dibujaron para el juego pintado pastel («cozy»).
// Aquí se REHACEN como geometría three propia: piedra tosca, entramado de madera oscura, tejados de pizarra o paja, musgo, hierro y luz cálida.
// ESTADO: SOLO HOJA DE CONTACTO (docs/style-reference/r3d/props-oscuros.html). El juego NO usa este módulo todavía: sustituirlos es Q03.
//
// CÓMO SE SUSTITUYE EN Q03 (una línea): en `props3d.js`, `propGeo(n,o,th)` → probar primero `darkGeo(n,o,th)`; si devuelve null se sigue con ORG.
//   import {darkGeo} from './propsdark3d.js';  …  const G=darkGeo(n,o,th)||(clásico). Misma forma de retorno {g,key} y mismas unidades.
//
// CONTRATO (lo que garantiza `tools/r3d/props_sheet.py`, no negociar):
//  · MISMAS UNIDADES Y EJES que `orgGeometry`: 1 tile = 1 unidad, y arriba, origen = centro de la huella en el suelo; puerta/frente hacia +z, ventanas laterales hacia +x.
//  · `o.rot` (espejo diagonal x↔z, como `ORG.rot`) funciona en todos los modelos.
//  · HUELLA Y ALTURA: dentro de FOOT (±TOL) de la malla actual → la colisión `fp` de PROPS (px de mundo) no cambia y no hace falta tocar layouts.
//  · Atributos: position, normal (plana), color (sRGB→lineal lo hace three al leer Color), aEmit (0 nada · 1 ventana/farol que se enciende de noche · 2 fuego · 4 brasa de chimenea, casi apagada de día).
//  · ANTI-CLIPPING DE TEJADOS (20 oct 2026, regla obligatoria; ver AGENTS.md «Lote R3D-ANTICLIP»): NADA pegado a un muro puede asomar por encima del faldón. El faldón pasa por el borde SUPERIOR del
//    muro y BAJA hacia afuera, por eso una viga/poste/farol/cartel cuya cima llegue a la altura del muro asoma por el tejado. Usa `capY(yMuro, saliente, pendiente)` para el tope de lo pegado a caras con alero,
//    y envuelve en `b.exempt(()=>…)` solo lo que atraviesa el tejado A PROPÓSITO (chimeneas, buhardillas). Todo tejado debe pasar por `B.gable` (o registrarse con `b.mode=1` + `b.R.push({cx,cz,hw,hd,y0,ye,h2,top,slope})`).
//    Comprobación obligatoria antes de entregar: `python3 tools/r3d/roof_clip_check.py` (debe decir TODO OK).
//  · DETERMINISTA: todo el azar sale de `hash` con semillas por modelo (nunca Math.random).
//  · COLOR: superficies SUCIAS (`dirty`): los colores pastel que ya traen los datos (`o.roof`, `o.wall`…) se ensucian aquí, así que NO hay que tocar `biomes.js`.
//    El único acento saturado de un prop es la luz (ventanas, farol) — guía 3D §4.9.
//  · Material y casco de contorno: los mismos de `props3d.js` (toon vc+moss+emit+tex auto, hull fino). La malla no lleva UV.
import * as THREE from 'three';

// GROSOR (Lote R3D-FASE2, 19 oct 2026, sugerencia héroe↔props aceptada): vigas, marcos de ventana, tablones y herrajes un ~18 % más gruesos para igualar la frecuencia de detalle
// del héroe (antes los props tenían detalle mucho más fino que cualquier rasgo suyo). TK es el factor de las vigas; marcos/alféizar/postigos/puerta llevan sus números ya engordados.
export const TK=1.18;
// ALTURA DE PUERTA (Lote R3D-FASE2, punto 6): la puerta de la casa llega a la cintura del héroe (escala OSRS, ya era así con ORG). DECISIÓN PENDIENTE DEL DUEÑO: por defecto NO cambia (DK=1);
// para verla +20 % abre el juego con `?r3d=1&puerta=1.2` (admite 1–1.4; solo las puertas de `doorZ`: casa, taberna, cabaña; la huella y la colisión no cambian). Si la aprueba, pon DK_DEF=1.2.
const DK_DEF=1,DK=(()=>{try{const m=/[?&]puerta=([\d.]+)/.exec(location.search);return m?Math.max(1,Math.min(1.4,+m[1]||1)):DK_DEF}catch(e){return DK_DEF}})();
const hash=(a,b,c)=>{const h=Math.sin(a*127.1+b*311.7+c*74.7)*43758.5453;return h-Math.floor(h)};
const _c=new THREE.Color(),_h={};
// ensucia un color: baja la saturación (k) y el valor (v); `warm` empuja a tierra. Devuelve THREE.Color nuevo.
export function dirty(hex,s=.5,v=.74,warm=.12){_c.set(hex);_c.getHSL(_h);const c=new THREE.Color().setHSL(_h.h,_h.s*s,_h.l*v);return c.lerp(new THREE.Color('#5a4a3a'),warm)}
const col=(hex)=>new THREE.Color(hex);
const mul=(c,k)=>new THREE.Color(c.r*k,c.g*k,c.b*k);
const mix=(a,b,t)=>a.clone().lerp(b,t);
const vary=(c,a,i,j)=>{const k=1+(hash(i,j,7)-.5)*2*a;return new THREE.Color(c.r*k,c.g*k,c.b*k)};

// ─────────── colector de triángulos con normal plana ───────────
class B{
 constructor(seed){this.P=[];this.C=[];this.E=[];this.N=[];this.seed=seed||1;this.n=0;this.M=[];this.R=[];this.mode=0}
 // ANTI-CLIPPING (20 oct 2026): modo por triángulo (0 normal · 1 tejado · 2 exento a propósito, p. ej. chimenea) y planos de tejado de cada `gable`.
 exempt(fn){const m=this.mode;this.mode=2;fn();this.mode=m}
 // altura del faldón en (x,z) o null si está fuera de la huella de ese tejado
 roofAt(x,z){for(const r of this.R){if(Math.abs(x-r.cx)<=r.hw&&Math.abs(z-r.cz)<=r.hd)return r.ye+r.h2*(1-Math.abs(z-r.cz)/r.hd)}return null}
 // vértices de piezas NO-tejado que quedan por encima del faldón (= asoman por el tejado). Devuelve [{tri,x,y,z,sobra}] (vacío = correcto)
 clips(eps=.012){const out=[];for(let k=0;k<this.M.length;k++){if(this.M[k]!==0)continue;for(let v=0;v<3;v++){const i=k*9+v*3,x=this.P[i],y=this.P[i+1],z=this.P[i+2],ry=this.roofAt(x,z);if(ry!==null&&y>ry+eps&&y<ry+1.2)out.push({tri:k,x,y,z,sobra:y-ry})}}return out}
 // triángulo (a,b,c = [x,y,z]); `ctr` = punto interior del sólido para orientar la cara hacia fuera (todos los sólidos son convexos o casi)
 tri(a,b,c,cc,em,ctr,nn){let[i0,i1,i2]=[a,b,c],[m0,m1,m2]=nn||[];const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
  let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const l=Math.hypot(nx,ny,nz);if(l<1e-9)return;
  if(ctr){const mx=(a[0]+b[0]+c[0])/3-ctr[0],my=(a[1]+b[1]+c[1])/3-ctr[1],mz=(a[2]+b[2]+c[2])/3-ctr[2];if(nx*mx+ny*my+nz*mz<0){[i1,i2]=[i2,i1];[m1,m2]=[m2,m1];nx=-nx;ny=-ny;nz=-nz}}
  this.M.push(this.mode);nx/=l;ny/=l;nz/=l;const cs=Array.isArray(cc)?cc:[cc,cc,cc];
  const NV=nn?[m0,m1,m2]:null;[i0,i1,i2].forEach((p,k)=>{this.P.push(p[0],p[1],p[2]);if(NV)this.N.push(NV[k][0],NV[k][1],NV[k][2]);else this.N.push(nx,ny,nz);const q=cs[k];this.C.push(q.r,q.g,q.b);this.E.push(em||0)});this.n++}
 quad(a,b,c,d,cc,em,ctr,nn){this.tri(a,b,c,cc,em,ctr,nn&&[nn[0],nn[1],nn[2]]);this.tri(a,c,d,cc,em,ctr,nn&&[nn[0],nn[2],nn[3]])}
 // caja alineada con ejes, base en y0. o: g = oscurecimiento de la base (0..1), v = variación por cara, t = estrechamiento de la tapa (1 = recto), nb = sin base, em, jit = desplome aleatorio de la tapa, my = rotación Y
 box(cx,y0,cz,w,h,d,c,o={}){const t=o.t??1,hw=w/2,hd=d/2,j=o.jit||0,sd=this.seed*13+this.n,jx=(hash(sd,1,2)-.5)*j,jz=(hash(sd,3,4)-.5)*j,cb=o.g?mul(c,1-o.g):c,ry=o.my||0,cr=Math.cos(ry),sr=Math.sin(ry);
  const T=(x,y,z)=>[cx+x*cr+z*sr,y0+y,cz-x*sr+z*cr];
  const b=[T(-hw,0,-hd),T(hw,0,-hd),T(hw,0,hd),T(-hw,0,hd)],tp=[T(-hw*t+jx,h,-hd*t+jz),T(hw*t+jx,h,-hd*t+jz),T(hw*t+jx,h,hd*t+jz),T(-hw*t+jx,h,hd*t+jz)],ctr=T(0,h/2,0),v=o.v||0,V=(i)=>v?vary(c,v,sd,i):c;
  const side=(i,k,cl)=>{const a=b[i],b2=b[k],c2=tp[k],d=tp[i];this.tri(a,b2,c2,[cb,cb,cl],o.em,ctr);this.tri(a,c2,d,[cb,cl,cl],o.em,ctr)};
  side(0,1,V(0));side(1,2,V(1));side(2,3,V(2));side(3,0,V(3));this.quad(tp[0],tp[1],tp[2],tp[3],mul(V(4),1.04),o.em,ctr);if(!o.nb)this.quad(b[0],b[1],b[2],b[3],cb,o.em,ctr)}
 // viga entre dos puntos (sección cuadrada de lado t)
 beam(p,q,t,c,o={}){const d=new THREE.Vector3(q[0]-p[0],q[1]-p[1],q[2]-p[2]),L=d.length();if(L<1e-6)return;d.normalize();
  const up=Math.abs(d.y)>.95?new THREE.Vector3(1,0,0):new THREE.Vector3(0,1,0),u=new THREE.Vector3().crossVectors(d,up).normalize(),w=new THREE.Vector3().crossVectors(d,u).normalize(),h=t/2;
  const S=[[-1,-1],[1,-1],[1,1],[-1,1]],A=S.map(([a,b])=>[p[0]+u.x*a*h+w.x*b*h,p[1]+u.y*a*h+w.y*b*h,p[2]+u.z*a*h+w.z*b*h]),Bq=S.map(([a,b])=>[q[0]+u.x*a*h+w.x*b*h,q[1]+u.y*a*h+w.y*b*h,q[2]+u.z*a*h+w.z*b*h]),ctr=[(p[0]+q[0])/2,(p[1]+q[1])/2,(p[2]+q[2])/2];
  for(let i=0;i<4;i++){const k=(i+1)%4;this.quad(A[i],A[k],Bq[k],Bq[i],o.v?vary(c,o.v,this.seed+this.n,i):c,o.em,ctr)}this.quad(A[0],A[1],A[2],A[3],c,o.em,ctr);this.quad(Bq[0],Bq[1],Bq[2],Bq[3],c,o.em,ctr)}
 // cilindro facetado (n lados), radio r0 abajo y r1 arriba; bulge = vientre central (barril); j = rugosidad
 cyl(cx,y0,cz,r0,r1,h,n,c,o={}){const j=o.j||0,seg=o.seg||1,bu=o.bulge||0,ctr=[cx,y0+h/2,cz],cb=o.g?mul(c,1-o.g):c,sd=this.seed*7+this.n;
  const R=(k,s)=>{const f=s/seg,r=r0+(r1-r0)*f+bu*Math.sin(f*Math.PI);return r*(1+(hash(sd,k,s)-.5)*j)},Pn=(k,s)=>{const a=k/n*Math.PI*2+(o.ph||0),r=R(k%n,s);return[cx+Math.cos(a)*r,y0+h*s/seg,cz+Math.sin(a)*r]};
  for(let s=0;s<seg;s++)for(let k=0;k<n;k++){const a=Pn(k,s),b=Pn(k+1,s),c2=Pn(k+1,s+1),d=Pn(k,s+1),cl=o.v?vary(c,o.v,sd,k):c,cs=s?cl:mix(cb,cl,.4);this.quad(a,b,c2,d,[cs,cs,cl,cl].slice(0,3).length?cl:cl,o.em,ctr)}
  if(!o.open){const top=[],bot=[];for(let k=0;k<n;k++){top.push(Pn(k,seg));bot.push(Pn(k,0))}for(let k=1;k<n-1;k++){this.tri(top[0],top[k],top[k+1],mul(c,1.06),o.em,ctr);if(!o.nb)this.tri(bot[0],bot[k],bot[k+1],cb,o.em,ctr)}}}
 // tejado a dos aguas con CUMBRERA a lo largo de x (w = largo de la cumbrera, d = ancho que cubre, h = altura), ov = alero. rows = hiladas de pizarra escalonadas; ragged = alero deshilachado (paja)
 gable(cx,y0,cz,w,d,h,ov,c,o={}){const _m=this.mode;this.mode=1;const rows=o.rows||5,led=o.ledge??.018,hw=w/2+ov,hd=d/2+ov,sd=this.seed*5+this.n,ctr=[cx,y0+h*.4,cz],em=0,sag=o.sag||0,
  // Q00c (18 oct 2026): el faldón nacía en el alero a la altura del muro, así que sobre el muro quedaba un hueco (h·ov/hd ≈ .17) y el tejado «flotaba». Ahora el plano pasa por el borde
  // superior del muro (zs = media profundidad del apoyo, por defecto d/2): misma cumbrera (y0+h), alero más bajo (ye) y faldón más empinado (h2).
  zs=o.sup??d/2,ye=y0-h*(hd-zs)/zs,h2=h*hd/zs;
  // TEJAS INDIVIDUALES (Lote R3D-TG-TEJAS, 20 oct 2026, forma Tiny Glade con NUESTROS colores): cada hilada es una fila de tejas sueltas (0,15–0,26 de ancho, tresbolillo), con su tono, un poco de desorden en la punta y un
  // canto con grosor que proyecta línea de sombra; debajo va un fondo oscuro de toda la hilada (las juntas). Altura de hilada `o.th` (def. .17 de pendiente); `rows` sigue siendo el MÍNIMO de hiladas. El plano del faldón (y la regla ANTICLIP) no cambia.
  const Ls=Math.hypot(hd,h2),nr=Math.max(rows,Math.round(Ls/(o.th||.17)));
  [1,-1].forEach(sg=>{for(let r=0;r<nr;r++){const f0=r/nr,f1=(r+1)/nr,zz=f=>cz+sg*hd*(1-f),yy=f=>ye+h2*f,rs=sd*7+r*13+(sg>0?0:97);
    this.quad([cx-hw,yy(f0),zz(f0)],[cx+hw,yy(f0),zz(f0)],[cx+hw,yy(f1),zz(f1)],[cx-hw,yy(f1),zz(f1)],mul(c,.34),em,ctr);   // fondo oscuro = juntas
    let x=cx-hw-(r%2?.1:0)*(.5+hash(rs,1,1)),i2=0;
    while(x<cx+hw-.01){const tw=.15+.11*hash(rs,i2,2),xa=Math.max(cx-hw,x),xb=Math.min(cx+hw,x+tw),wd=xb-xa;
     if(wd>.04){const th=led*.9*(.8+.6*hash(rs,i2,3)),jx=(hash(rs,i2,4)-.5)*.03,gap=.012,xa2=xa+gap,xb2=xb-gap,cl=mul(vary(c,o.v??.18,rs,i2),.86+.22*f1+.06*(hash(rs,i2,5)-.5));
      const a=[xa2,yy(f0)+th,zz(f0)],b2=[xb2,yy(f0)+th,zz(f0)],c3=[xb2+jx,yy(f1)+th*.15,zz(f1)],d3=[xa2+jx,yy(f1)+th*.15,zz(f1)];
      this.quad(a,b2,c3,d3,cl,em,ctr);   // cara de la teja
      this.quad([xa2,yy(f0),zz(f0)],[xb2,yy(f0),zz(f0)],b2,a,mul(cl,.5),em,ctr)}   // canto (grosor): línea de sombra bajo cada teja
     x+=tw;i2++}
   }
   const e0=[cx-hw,ye,cz+sg*hd],e1=[cx+hw,ye,cz+sg*hd],ri=[cx+hw,y0+h,cz],le=[cx-hw,y0+h,cz];this.quad([e0[0],e0[1]-.05,e0[2]],[e1[0],e1[1]-.05,e1[2]],[e1[0],e1[1],e1[2]],[e0[0],e0[1],e0[2]],mul(c,.4),em,ctr);   // canto del alero
  });
  const hs=hw-ov*.55;   // hastiales (triángulos de pared bajo el alero) los pone el edificio, aquí solo la cara inferior oscura
  this.tri([cx-hs,y0,cz-hd*.0-d/2],[cx-hs,y0,cz+d/2],[cx-hs,y0+h*.92,cz],mul(c,.35),em);this.tri([cx+hs,y0,cz+d/2],[cx+hs,y0,cz-d/2],[cx+hs,y0+h*.92,cz],mul(c,.35),em);
  if(o.ridge!==0)this.box(cx,y0+h-.01,cz,w+ov*2+.06,.07,.13,mul(c,.62),{v:.1});this.R.push({cx,cz,hw:w/2+ov,hd,y0,ye,h2,top:y0+h,slope:h2/hd});this.mode=_m}
 // roca/piedra suelta: caja con las esquinas rotas (8 vértices con desplazamiento) — la «piedra tosca» de cimientos y brocales
 // BLOQUE CON BISEL (Lote R3D-TG-PROTO, 20 oct 2026): bloque con las 12 aristas achaflanadas (6 caras + 12 bandas + 8 esquinas = 44 triángulos; con `nb` sin la base y sus bandas inferiores = 29). Es la pieza de la mampostería
 // «Tiny Glade» (bloques sueltos de bordes suaves que cazan la luz). `o.r` = bisel, `o.my` = giro Y, `o.g` = oscurecimiento de la base (AO barato en el color de las bandas bajas), `o.em`.
 bevel(cx,y0,cz,w,h,d,c,o={}){const r=Math.max(.004,Math.min(o.r??.03,w*.3,h*.3,d*.3)),hw=w/2,hh=h/2,hd=d/2,ry=o.my||0,cr=Math.cos(ry),sr=Math.sin(ry),cy=y0+hh,H=[hw,hh,hd],
  T=(x,y,z)=>[cx+x*cr+z*sr,cy+y,cz-x*sr+z*cr],ctr=T(0,0,0),dk=mul(c,1-(o.g??.22)),top=mul(c,1.08),lo=mul(c,.86);
  const V=(sx,sy,sz,a)=>{const sg=[sx,sy,sz],p=[0,0,0];for(let i=0;i<3;i++)p[i]=sg[i]*(i===a?H[i]:H[i]-r);return T(p[0],p[1],p[2])},em=o.em,
   ND=(a,sn)=>{const v=[0,0,0];v[a]=sn;return[v[0]*cr+v[2]*sr,v[1],-v[0]*sr+v[2]*cr]};   // normal de cada cara en el mundo (giro Y); las BANDAS y las ESQUINAS la reparten entre las dos caras vecinas → arista REDONDEADA al sombrear (no un chaflán duro)
  for(let a=0;a<3;a++)for(const sn of[-1,1]){if(o.nb&&a===1&&sn===-1)continue;const o1=(a+1)%3,o2=(a+2)%3,pts=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>{const sg=[0,0,0];sg[a]=sn;sg[o1]=u;sg[o2]=v;return V(sg[0],sg[1],sg[2],a)});
   this.quad(pts[0],pts[1],pts[2],pts[3],a===1&&sn===1?top:(a===1?dk:c),em,ctr)}
  for(const[a,b]of[[0,1],[0,2],[1,2]]){const c3=3-a-b;for(const sa of[-1,1])for(const sb of[-1,1]){if(o.nb&&((a===1&&sa===-1)||(b===1&&sb===-1)))continue;
   const e=[-1,1].map(sc=>{const sg=[0,0,0];sg[a]=sa;sg[b]=sb;sg[c3]=sc;return[V(sg[0],sg[1],sg[2],a),V(sg[0],sg[1],sg[2],b)]}),low=(a===1&&sa===-1)||(b===1&&sb===-1),hi=(a===1&&sa===1)||(b===1&&sb===1),NA=ND(a,sa),NB=ND(b,sb);
   this.quad(e[0][0],e[1][0],e[1][1],e[0][1],low?lo:(hi?top:mul(c,.97)),em,ctr,[NA,NA,NB,NB])}}
  for(const sx of[-1,1])for(const sy of[-1,1])for(const sz of[-1,1]){if(o.nb&&sy===-1)continue;this.tri(V(sx,sy,sz,0),V(sx,sy,sz,1),V(sx,sy,sz,2),sy>0?top:lo,em,ctr,[ND(0,sx),ND(1,sy),ND(2,sz)])}}
 // piedra suelta: bloque achaflanado, algo girado y con el techo menor que la base (ya no un cubo con vértices movidos)
 stone(cx,y0,cz,w,h,d,c,o={}){const sd=this.seed*31+this.n*3+(o.s||0),j=o.j??.18;this.bevel(cx,y0,cz,w,h,d,vary(c,o.v??.18,sd,0),{my:(hash(sd,5,1)-.5)*Math.min(1.2,j*5),r:Math.min(.035,Math.min(w,h,d)*.2),em:o.em,g:.2})}
 // HILADAS DE PIEDRA (mampostería de bloques sueltos): de p a q en el plano xz, de y0 a y0+h, en varias filas aparejadas a tresbolillo, bloques de 0,16–0,36 de largo, altura y fondo variables, ligeramente
 // girados y con bisel; cada bloque con su tono (`o.v`). `o.rh` = altura de fila (por defecto .11): más filas = más detalle y más triángulos (44 por bloque).
 course(p,q,y0,h,thick,c,o={}){const L=Math.hypot(q[0]-p[0],q[1]-p[1]),ux=(q[0]-p[0])/L,uz=(q[1]-p[1])/L,sd=this.seed*17+this.n,rows=Math.max(1,Math.round(h/(o.rh||.11))),gr=Math.atan2(-uz,ux);
  for(let r=0;r<rows;r++){const rh=h/rows;let s=r%2?-(.07+hash(sd,r,7)*.12):0,i=0;
   while(s<L-.02){const bl=.16+hash(sd,i+r*41,1)*.2,s0=Math.max(0,s),s1=Math.min(L,s+bl),len=s1-s0;
    if(len>.05){const mid=(s0+s1)/2,hh=rh*(.9+hash(sd,i+r*41,2)*.18),dn=(hash(sd,i+r*41,3)-.5)*.035,cx=p[0]+ux*mid+(-uz)*dn,cz=p[1]+uz*mid+ux*dn,th=thick*(.9+hash(sd,i+r*41,4)*.2);
     this.bevel(cx,y0+r*rh+(rh-hh)*.25,cz,len*.96,hh*.97,th,vary(c,o.v??.2,sd,i+r*41),{my:gr+(hash(sd,i+r*41,5)-.5)*.07,r:Math.min(.024,rh*.22),nb:r===0,g:r===0?.3:.2})}
    s+=bl;i++}}}
 geo(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(this.N,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(this.C,3));g.setAttribute('aEmit',new THREE.Float32BufferAttribute(this.E,1));g.computeBoundingBox();g.computeBoundingSphere();return g}
}

// ─────────── paleta oscura (datos; nunca un `if` por modelo) ───────────
const PAL={stone:col('#6a665c'),stoneD:col('#4c4942'),stoneL:col('#8a8576'),moss:col('#4a5a32'),plaster:col('#8d8571'),timber:col('#35271d'),timberL:col('#4d3828'),
 slate:col('#444a52'),slateD:col('#343941'),door:col('#3a2a1e'),iron:col('#25262a'),ironL:col('#3b3d44'),thatch:col('#76653f'),thatchD:col('#54472b'),hay:col('#9a8548'),
 plank:col('#4a3828'),plankD:col('#352719'),glass:col('#ffb84a'),lamp:col('#ffcf6a'),rope:col('#6a5a3c'),barrel:col('#4f3a27')};
// elige el color de pared/tejado de los DATOS (o.wall, o.roof: pastel) pero ensuciado; sin dato, el de la paleta
const wallOf=(o,def)=>o&&o.wall?dirty(o.wall,.42,.6,.22):def;
const roofOf=(o,def)=>o&&o.roof?dirty(o.roof,.38,.52,.18):def;

// ─────────── elementos reutilizables ───────────
// ventana: marco oscuro hundido + cristal ámbar (aEmit 1 con probabilidad `lit`) + cruz + postigos. `ax` = 'x' (cara hacia +x) o 'z' (cara hacia +z); (px,py,pz) = centro en la pared
function windowAt(b,ax,px,py,pz,w,h,sd,lit=.85,shut=1){const on=hash(sd,px*9,pz*7)<lit?1:0,em=on,g=on?PAL.glass:mix(PAL.glass,col('#1c2326'),.97),t=.035;
 if(ax==='z'){b.box(px,py-h/2-.025,pz+.005,w+.155,h+.075,.058,PAL.timber,{nb:1});b.box(px,py-h/2,pz+.035,w,h,.02,g,{em,nb:1});b.box(px,py-.012,pz+.054,w,.03,.024,PAL.timber,{nb:1});b.box(px,py-h/2,pz+.054,.03,h,.024,PAL.timber,{nb:1});
  b.box(px,py-h/2-.055,pz+.05,w+.2,.053,.105,PAL.stoneD,{nb:1,v:.1});   // alféizar
  if(shut){[-1,1].forEach((s,i)=>b.box(px+s*(w/2+.115),py-h/2-.012,pz+.034,.12,h+.03,.03,i?PAL.timberL:PAL.timber,{nb:1,v:.12}))}}
 else{b.box(px+.005,py-h/2-.025,pz,.058,h+.075,w+.155,PAL.timber,{nb:1});b.box(px+.035,py-h/2,pz,.02,h,w,g,{em,nb:1});b.box(px+.054,py-.012,pz,.024,.03,w,PAL.timber,{nb:1});b.box(px+.054,py-h/2,pz,.024,h,.03,PAL.timber,{nb:1});
  b.box(px+.05,py-h/2-.055,pz,.105,.053,w+.2,PAL.stoneD,{nb:1,v:.1});
  if(shut){[-1,1].forEach((s,i)=>b.box(px+.034,py-h/2-.012,pz+s*(w/2+.115),.03,h+.03,.12,i?PAL.timberL:PAL.timber,{nb:1,v:.12}))}}}
// puerta de tablones con herrajes, dintel y escalón de piedra, en la cara +z
function doorZ(b,px,pz,w,h,sd){h*=DK;b.box(px,0,pz+.045,w+.25,h+.13,.07,PAL.timber,{nb:1,v:.08});b.box(px,0,pz+.075,w,h,.03,PAL.door,{nb:1,v:.15});
 for(let i=1;i<4;i++)b.box(px-w/2+i*w/4,0,pz+.092,.012,h,.01,PAL.plankD,{nb:1});[.28,.7].forEach(f=>b.box(px,h*f,pz+.098,w*.92,.054,.014,PAL.iron,{nb:1}));
 b.box(px+w*.3,h*.5,pz+.105,.05,.05,.02,PAL.ironL,{nb:1});b.box(px,h+.09,pz+.075,w+.4,.12,.14,PAL.stoneD,{nb:1,v:.15});b.stone(px,0,pz+.2,w+.3,.07,.26,PAL.stone,{s:5});b.stone(px,0,pz+.34,w+.5,.045,.16,PAL.stoneD,{s:6})}
// farol colgante de hierro con luz (cristal aEmit=1)
function lanternAt(b,x,y,z,s=1){b.box(x,y,z,.075*s,.02*s,.075*s,PAL.iron);b.box(x,y+.02*s,z,.055*s,.1*s,.055*s,PAL.lamp,{em:1,nb:1});b.box(x,y+.12*s,z,.085*s,.02*s,.085*s,PAL.iron);b.box(x,y+.14*s,z,.04*s,.03*s,.04*s,PAL.iron,{t:.5})}
// chimenea de piedra con brasa (aEmit=2) en lo alto
function chimney(b,x,y0,z,h,sd,ember=true){b.box(x,y0,z,.3,h,.3,PAL.stone,{t:.88,v:.12,g:.2});for(let i=0;i<4;i++)b.stone(x,y0+h*(.2+.22*i),z,.34,.05,.34,PAL.stoneD,{s:i,j:.1});b.box(x,y0+h,z,.4,.07,.4,PAL.stoneD,{nb:1,v:.1});b.box(x,y0+h+.07,z,.15,.025,.15,ember?col('#ff7a2a'):PAL.iron,{em:ember?4:0,nb:1})}   // aEmit 4 = brasa de chimenea: se apaga de día (materials3d.js, R3D-FASE2); 2 sigue siendo fuego/lava que brilla siempre
// entramado: postes + soleras + riostras en una cara. ax 'z' (cara +z, ancho w) o 'x' (cara +x, ancho d). y0..y1 altura del paño. Los paneles de yeso los pone el muro (caja)
// REGLA ANTI-CLIPPING (20 oct 2026): el faldón pasa por el borde SUPERIOR del muro y BAJA hacia afuera, así que todo lo pegado a una cara que mire al alero (eje 'z') debe terminar
// por debajo de `capY(y1, saliente)`; antes la solera llegaba a y1+.02 y asomaba por el tejado en TODAS las casas. En caras de hastial (eje 'x') no hay problema: el muro sube en triángulo.
// `sl` = pendiente del faldón (h/zs de B.gable; conservador 1.3). Comprobación: `clipReport(n)` / tools/r3d/roof_clip_check.py.
const capY=(y1,prot,sl=1.3)=>y1-sl*prot-.012;
function timberFace(b,ax,fixed,half,y0,y1o,sd,braces=true,sl=1.3){const A=(u,y)=>ax==='z'?[u,y,fixed]:[fixed,y,u],t=.085*TK,y1=ax==='z'?capY(y1o,.005+t/2,sl)+.03-t/2:y1o;   // solera: su borde superior = capY
 for(const u of [-half+.04,half-.04])b.beam(A(u,y0),A(u,y1),t,PAL.timber,{v:.12});b.beam(A(-half,y0+.02),A(half,y0+.02),t,PAL.timber);b.beam(A(-half,y1-.03),A(half,y1-.03),t,PAL.timber);
 b.beam(A(-half,(y0+y1)/2),A(half,(y0+y1)/2),t*.8,PAL.timberL);
 const n=Math.max(2,Math.round(half*2/.75));for(let i=1;i<n;i++){const u=-half+i*(half*2/n);b.beam(A(u,y0),A(u,y1),t*.8,PAL.timber)}
 if(braces)for(let i=0;i<n;i++){const u0=-half+i*(half*2/n),u1=u0+half*2/n,fl=hash(sd,i,ax==='z'?1:2)<.5;b.beam(A(fl?u0:u1,y0+.02),A(fl?u1:u0,(y0+y1)/2),t*.7,PAL.timberL)}}
// musgo: manchas verdes en cimientos y tejado (cajas planas, color musgo); `list` = [[x,y,z,w,d]]
function mossPatch(b,list,y){list.forEach(([x,z,w,d],i)=>b.box(x,y,z,w,.025,d,vary(PAL.moss,.25,b.seed,i),{nb:1,t:.7,jit:.02}))}

// musgo SOBRE UN TEJADO — YA NO SE USA (Lote R3D-ESCALA): los parches de musgo en los tejados se leían como «agujeros verdes» (el shader `toon` realza los verdes de día: `uLive`), el dueño los rechazó. Se deja el ayudante por si algún día se quiere musgo apagado. Cada mancha es un cuadrilátero
// cuyas 4 esquinas se apoyan en el plano del faldón: roofY(y0,d,h,ov,z) = misma fórmula que `B.gable` (plano que pasa por el borde del muro). Las manchas NO deben cruzar la cumbrera (z=0).
const roofY=(y0,d,h,ov,z)=>{const hd=d/2+ov,zs=d/2,ye=y0-h*(hd-zs)/zs,h2=h*hd/zs;return ye+h2*(1-Math.min(Math.abs(z),hd)/hd)};
function roofMoss(b,list,fy,lift=.014){list.forEach(([x,z,w,d],i)=>{const c=vary(PAL.moss,.25,b.seed,i+40),P=(px,pz)=>[px,fy(pz)+lift,pz];
 b.quad(P(x-w/2,z-d/2),P(x+w/2,z-d/2),P(x+w/2,z+d/2),P(x-w/2,z+d/2),c,0,[x,fy(z)-1,z])})}

// ═════════ MODELOS ═════════
// Todos devuelven un B ya construido; `build()` aplica `rot`, genera la BufferGeometry y la cachea.
const MODELS={
 // CASA (≈2,4 × 1,93, alto 2,23; fp 32×25 px): cimiento de piedra tosca, entramado oscuro sobre yeso sucio, tejado de pizarra empinado, chimenea con brasa, puerta con herrajes, ventana con luz, postigos y farol en la puerta.
 casa(o){const b=new B(11),W=2.04,D=1.5,H=1.12,wall=wallOf(o,PAL.plaster),roof=roofOf(o,PAL.slate),z0=D/2;
  b.box(0,0,0,W+.16,.2,D+.16,PAL.stone,{v:.12,g:.25,jit:.01});[[-W/2-.04,-D/2-.04,W/2+.04,-D/2-.04],[W/2+.04,-D/2-.04,W/2+.04,D/2+.04],[W/2+.04,D/2+.04,-W/2-.04,D/2+.04],[-W/2-.04,D/2+.04,-W/2-.04,-D/2-.04]].forEach(s=>b.course([s[0],s[1]],[s[2],s[3]],0,.2,.14,PAL.stone,{v:.22}));
  b.box(0,.2,0,W,H,D,wall,{v:.05,g:.18,t:.995});
  timberFace(b,'z',z0+.005,W/2-.03,.2,.2+H,11);timberFace(b,'x',W/2+.005,D/2-.03,.2,.2+H,12);
  windowAt(b,'x',W/2+.005,.2+H*.68,-.28,.34,.4,3);windowAt(b,'x',W/2+.005,.2+H*.68,.38,.34,.4,5,.85);windowAt(b,'z',-W*.26,.2+H*.68,z0+.005,.34,.4,7);
  doorZ(b,W*.2,z0,.38,.62,9);lanternAt(b,W*.2+.36,.2+H*.6,z0+.12,1);   // H*.6: a H*.74 la cima del farol entraba en el faldón
  b.gable(0,.2+H,0,W,D,.82,.2,roof,{rows:6,v:.2});
  const gh=.2+H;   // hastiales: la pared sube en triángulo bajo el alero (cierra el volumen)
  [-1,1].forEach(s=>{const x=s*(W/2);b.tri([x,gh,-D/2],[x,gh,D/2],[x,gh+.82,0],mix(wall,PAL.timber,.18),0)});
  b.exempt(()=>chimney(b,-W*.3,gh+.3,-D*.16,.66,5));
  mossPatch(b,[[-.7,z0+.05,.34,.16],[.2,-z0-.02,.5,.2],[W/2+.02,.1,.1,.4]],.19);
  return b},
 // TABERNA (≈2,88 × 2,03, alto 3,0; fp 41×31): planta baja de piedra y entramado, piso alto en voladizo, ventanas grandes con luz, letrero colgante con farol, tejado de pizarra con buhardilla y dos chimeneas.
 taberna(o){const b=new B(21),W=2.3,D=1.64,H1=1.0,H2=.88,wall=wallOf(o,PAL.plaster),roof=roofOf(o,PAL.slateD),z0=D/2,J=.12;
  b.box(0,0,0,W+.2,.24,D+.2,PAL.stone,{v:.12,g:.25});[[-W/2-.05,-D/2-.05,W/2+.05,-D/2-.05],[W/2+.05,-D/2-.05,W/2+.05,D/2+.05],[W/2+.05,D/2+.05,-W/2-.05,D/2+.05],[-W/2-.05,D/2+.05,-W/2-.05,-D/2-.05]].forEach(s=>b.course([s[0],s[1]],[s[2],s[3]],0,.24,.16,PAL.stone,{v:.22}));
  b.box(0,.24,0,W,H1,D,mix(wall,PAL.stone,.25),{v:.05,g:.2});timberFace(b,'z',z0+.005,W/2-.03,.24,.24+H1,21);timberFace(b,'x',W/2+.005,D/2-.03,.24,.24+H1,22);
  b.box(0,.24+H1,0,W+J*2,.1,D+J*2,PAL.timber,{v:.1});for(let i=0;i<8;i++)b.beam([-W/2+i*(W/7),.24+H1-.06,z0],[-W/2+i*(W/7),.24+H1,z0+J],.07*TK,PAL.timberL);   // viguetas del voladizo
  const y2=.24+H1+.1;b.box(0,y2,0,W+J*2-.04,H2,D+J*2-.04,wall,{v:.05,g:.12});timberFace(b,'z',z0+J-.015,W/2+J-.07,y2,y2+H2,23);timberFace(b,'x',W/2+J-.015,D/2+J-.07,y2,y2+H2,24);
  windowAt(b,'x',W/2+J-.01,.24+H1*.66,-.45,.42,.46,31);windowAt(b,'x',W/2+J-.01,.24+H1*.66,.42,.42,.46,32);windowAt(b,'x',W/2+J-.01,y2+H2*.62,-.45,.34,.42,33);windowAt(b,'x',W/2+J-.01,y2+H2*.62,.42,.34,.42,34);
  windowAt(b,'z',-W*.3,.24+H1*.66,z0+.005,.5,.46,35,1);windowAt(b,'z',-W*.3,y2+H2*.62,z0+J-.01,.4,.42,36);windowAt(b,'z',W*.12,y2+H2*.62,z0+J-.01,.4,.42,37);
  doorZ(b,W*.3,z0,.44,.68,15);lanternAt(b,W*.3+.4,.24+H1*.76,z0+.12,1.15);
  // letrero: ménsula de hierro, tablón oscuro con aro y farol de ánimo
  b.beam([-W*.02,y2-.1,z0+J],[-W*.02,y2-.1,z0+J+.24],.05*TK,PAL.iron);b.box(-W*.02,y2-.46,z0+J+.1,.05,.3,.3,PAL.plank,{v:.1});b.box(-W*.02,y2-.47,z0+J+.1,.02,.22,.22,PAL.thatch,{em:0,nb:1});lanternAt(b,-W*.02,y2-.12,z0+J+.24,.8);
  const gh=y2+H2;b.gable(0,gh,0,W+J*2,D+J*2,1.0,.14,roof,{rows:7,v:.2});[-1,1].forEach(s=>{const x=s*(W/2+J-.02);b.tri([x,gh,-D/2-J],[x,gh,D/2+J],[x,gh+1.0,0],mix(wall,PAL.timber,.2),0)});
  // buhardilla en la cara +z
  b.exempt(()=>{b.box(W*.12,gh+.02,z0+J-.1,.54,.42,.4,wall,{v:.05});{const cx=W*.12,zc=z0+J-.1,ye=gh+.42,yr=gh+.44+.3,cl=roof,L=(sg)=>{const a=[cx+sg*.34,ye,zc-.22],b2=[cx+sg*.34,ye,zc+.28],c=[cx,yr,zc+.28],d=[cx,yr,zc-.22];sg>0?b.quad(b2,a,d,c,mul(cl,.95),0):b.quad(a,b2,c,d,mul(cl,.8),0)};L(1);L(-1);b.tri([cx-.27,gh+.44,zc+.2],[cx+.27,gh+.44,zc+.2],[cx,yr-.04,zc+.2],mix(wall,PAL.timber,.2),0);}   // buhardilla con cumbrera hacia +z (antes: cumbrera cruzada que tapaba la ventana y dejaba un triángulo suelto)
  windowAt(b,'z',W*.12,gh+.34,z0+J+.105,.22,.26,38,.9,0)});   // fin de la buhardilla (exenta)
  b.exempt(()=>{chimney(b,-W*.3,gh+.34,-.22,.85,6);chimney(b,W*.34,gh+.28,-.34,.7,7,false)});
  mossPatch(b,[[-.8,z0+.06,.4,.2],[.5,z0+.06,.3,.2],[-.3,-z0,.5,.22]],.23);
  return b},
 // GRANERO (≈1,8 × 2,42, alto 1,81; fp 46×34; en el juego casi siempre `rot`): tablones verticales de madera oscura, portón con aspa, ventana de heno, tejado de tablillas y heno asomando.
 granero(o){const b=new B(31),W=1.5,D=2.1,H=1.0,z0=D/2,wood=dirty(o&&o.wall||'#8a5a34',.35,.52,.25),roof=roofOf(o,PAL.slateD);
  b.box(0,0,0,W+.14,.16,D+.14,PAL.stone,{v:.12,g:.25});[[-W/2-.03,-D/2-.03,W/2+.03,-D/2-.03],[W/2+.03,-D/2-.03,W/2+.03,D/2+.03],[W/2+.03,D/2+.03,-W/2-.03,D/2+.03],[-W/2-.03,D/2+.03,-W/2-.03,-D/2-.03]].forEach(s=>b.course([s[0],s[1]],[s[2],s[3]],0,.16,.12,PAL.stone,{v:.22}));
  b.box(0,.16,0,W-.02,H,D-.02,PAL.plankD,{nb:1});
  const pk=.12,nz=Math.round(W/pk),nx=Math.round(D/pk);   // tablones verticales con altura y tono propios (silueta irregular)
  for(let i=0;i<nz;i++){const x=-W/2+pk*(i+.5),h=H*(.93+hash(31,i,1)*.05);b.box(x,.16,z0-.005,pk*.94,h,.04,vary(wood,.2,31,i),{nb:1,t:.97,jit:.01});b.box(x,.16,-z0+.005,pk*.94,h,.04,vary(wood,.2,32,i),{nb:1})}
  for(let i=0;i<nx;i++){const z=-D/2+pk*(i+.5),h=H*(.93+hash(33,i,1)*.05);b.box(W/2-.005,.16,z,.04,h,pk*.94,vary(wood,.2,33,i),{nb:1,t:.97});b.box(-W/2+.005,.16,z,.04,h,pk*.94,vary(wood,.2,34,i),{nb:1})}
  [.3,.82].forEach(f=>{b.box(0,.16+H*f,z0+.03,W+.07,.083,.058,PAL.timber,{nb:1});b.box(W/2+.03,.16+H*f,0,.058,.083,D+.07,PAL.timber,{nb:1})});[-1,1].forEach(s=>{b.beam([s*(W/2+.02),.16,z0+.03],[s*(W/2+.02),.16+H-.09,z0+.03],.09*TK,PAL.timber)});
  // portón: dos hojas con aspa y hierro; la puerta está en la cara +z (granero girado: la cara larga queda hacia +x)
  b.box(0,.16,z0+.045,.82,.78,.05,PAL.door,{nb:1,v:.1});b.beam([-.4,.18,z0+.085],[.4,.92,z0+.085],.06*TK,PAL.timberL);b.beam([.4,.18,z0+.085],[-.4,.92,z0+.085],.06*TK,PAL.timberL);b.box(0,.16,z0+.09,.02,.78,.015,PAL.iron,{nb:1});b.box(0,.16+.84,z0+.07,.98,.07,.08,PAL.stoneD,{nb:1});   // correa de hierro desde el suelo (antes base en .55 → asomaba por el tejado) y dintel por debajo del faldón
  b.box(0,.16+H*.66,z0+.04,.3,.2,.05,PAL.plankD,{nb:1});b.box(0,.16+H*.66+.02,z0+.07,.26,.16,.03,PAL.glass,{em:1,nb:1});   // trampilla del henil con luz tenue
  lanternAt(b,.62,.16+H*.62,z0+.12,.9);
  const gh=.16+H;b.gable(0,gh,0,W,D,.7,.18,roof,{rows:6,v:.2,ledge:.022});b.gable(0,gh,0,W,D,.7,.18,roof,{rows:1,ridge:0,v:0});   // (la 2.ª llamada solo refuerza la cara inferior)
  [-1,1].forEach(s=>{const x=s*(W/2-.02);b.tri([x,gh,-D/2],[x,gh,D/2],[x,gh+.7,0],mix(PAL.plankD,wood,.5),0)});
  // heno que asoma por el hastial y bala apoyada
  b.box(0,.16,z0+.22,.36,.2,.22,PAL.hay,{v:.2,t:.85,jit:.03});b.box(.34,.16,z0+.2,.3,.2,.2,mul(PAL.hay,.88),{v:.2,t:.88,jit:.03,my:.3});
  mossPatch(b,[[-.5,z0+.05,.3,.14]],.2);
  return b},
 // CABAÑA (≈2,09 × 1,81, alto 1,74; fp 24×20 px): muros de piedra seca y viga, techo de PAJA abultado, ventana pequeña con luz, puerta baja, leña apilada.
 cabana(o){const b=new B(41),W=1.5,D=1.18,H=.8,z0=D/2,wall=wallOf(o,mix(PAL.plaster,PAL.stone,.35)),thatch=o&&o.roof?mix(PAL.thatch,dirty(o.roof,.3,.55,.3),.25):PAL.thatch;
  b.box(0,0,0,W+.16,.18,D+.16,PAL.stoneD,{v:.12,g:.25});b.box(0,.18,0,W,H,D,wall,{v:.05,g:.2,t:.99});
  [[-W/2,-D/2,W/2,-D/2],[W/2,-D/2,W/2,D/2],[W/2,D/2,-W/2,D/2],[-W/2,D/2,-W/2,-D/2]].forEach((s,i)=>b.course([s[0],s[1]],[s[2],s[3]],.18,.34,.12,PAL.stone,{v:.22}));
  [-1,1].forEach(s=>{b.beam([s*(W/2-.04),.18,z0+.01],[s*(W/2-.04),.18+H-.09,z0+.01],.1*TK,PAL.timber);b.beam([W/2+.01,.18,s*(D/2-.04)],[W/2+.01,.18+H-.09,s*(D/2-.04)],.1*TK,PAL.timber)});b.beam([-W/2,.18+H-.14,z0+.01],[W/2,.18+H-.14,z0+.01],.09*TK,PAL.timber);   // solera bajo capY (el faldón de paja baja hacia afuera)b.beam([W/2+.01,.18+H-.04,-D/2],[W/2+.01,.18+H-.04,D/2],.09*TK,PAL.timber);
  windowAt(b,'x',W/2+.005,.18+H*.66,.1,.3,.34,41,.8);windowAt(b,'z',-W*.28,.18+H*.66,z0+.005,.28,.32,42,.8,0);doorZ(b,W*.22,z0,.34,.54,43);
  // techo de paja: dos faldones gruesos y abultados con alero deshilachado (tiras de largo variable) y caballete
  const gh=.18+H,hw=W/2+.22,hd=D/2+.24,rows=6,zs=D/2,ye=gh-.74*(hd-zs)/zs,h2=.74*hd/zs;   // Q00c: la paja baja hasta cubrir el borde del muro
  b.mode=1;   // paja = tejado (para el verificador)
  [1,-1].forEach(sg=>{for(let r=0;r<rows;r++){const f0=r/rows,f1=(r+1)/rows,bul=Math.sin(f1*Math.PI*.9)*.05,zz=f=>sg*hd*(1-f),yy=f=>ye+h2*f,c=vary(mix(PAL.thatchD,PAL.thatch,.4+f1*.6),.18,41,r+(sg>0?0:7));
    const ctr=[0,gh+.3,0];b.quad([-hw,yy(f0),zz(f0)],[hw,yy(f0),zz(f0)],[hw,yy(f1)+bul,zz(f1)],[-hw,yy(f1)+bul,zz(f1)],c,0,ctr)}
   const n=16;for(let i=0;i<n;i++){const x0=-hw+i*(hw*2/n),dl=.05+hash(41,i,sg)*.1;b.tri([x0,ye,sg*hd],[x0+hw*2/n,ye,sg*hd],[x0+hw/n,ye-dl-.04,sg*(hd+.03)],mul(PAL.thatchD,.8+hash(41,i,2)*.3),0,[0,gh+.3,0])}});   // flecos del alero
  b.box(0,gh+.7,0,hw*2+.04,.1,.24,PAL.thatchD,{v:.2,t:.8});[-1,1].forEach(s=>{const x=s*(W/2-.0);b.tri([x,gh,-D/2],[x,gh,D/2],[x,gh+.72,0],mix(wall,PAL.timber,.25),0)});
  b.mode=0;b.R.push({cx:0,cz:0,hw,hd,y0:gh,ye,h2,top:gh+.74,slope:h2/hd});
  b.exempt(()=>chimney(b,-W*.28,gh+.38,-D*.1,.5,9));
  // leña apilada junto a la pared +x
  for(let r=0;r<3;r++)for(let i=0;i<4-r;i++)b.cyl(W/2+.14,.04+r*.085,-.15+i*.085*2+r*.085,.045,.045,.16,6,mix(PAL.timberL,PAL.stoneD,hash(41,i,r)*.5),{ph:hash(41,r,i)});
  mossPatch(b,[[-.5,z0+.04,.4,.14],[.1,-z0,.5,.16]],.19);
  return b},
 // POZO (≈0,85 × 1,12, alto 1,64; fp 9×9 px): brocal de piedra tosca, dos postes con travesaño, tejadillo de pizarra, cubo y cuerda.
 pozo(o){const b=new B(51),R=.28;const n=10;
  for(let r=0;r<3;r++)for(let i=0;i<n;i++){const a=(i+r*.5)/n*Math.PI*2,rr=R*(1+.02*r),ax=Math.cos(a)*rr,az=Math.sin(a)*rr;b.stone(ax,r*.14,az,.23,.15,.18,vary(PAL.stone,.2,51,i+r*9),{s:i+r*11,j:.16});}
  b.cyl(0,.1,0,R-.1,R-.1,.4,10,col('#101a1c'),{open:0,j:0});b.cyl(0,.38,0,R-.08,R-.08,.02,10,mix(col('#1a3a3c'),PAL.glass,.0),{nb:1});   // agua negra al fondo del brocal
  [-1,1].forEach(s=>b.beam([s*.3,0,0],[s*.3,1.38,0],.08*TK,PAL.timber,{v:.1}));b.beam([-.34,1.12,0],[.34,1.12,0],.07*TK,PAL.timberL);b.beam([-.4,1.4,0],[.4,1.4,0],.06*TK,PAL.timber);   // Q00c: poste hasta la cumbrera + viga cumbrera (apoyo del tejadillo)
  b.gable(0,1.18,0,.66,.4,.34,.1,PAL.slate,{rows:3,v:.2});b.beam([0,1.04,0],[0,.62,.02],.012,PAL.rope);b.cyl(0,.44,.02,.07,.09,.12,7,PAL.barrel,{});b.box(0,.56,.02,.005,.06,.005,PAL.iron);
  b.box(.28,.16,.44,.2,.1,.2,PAL.stoneD,{s:2,v:.2});mossPatch(b,[[-.2,.3,.22,.14],[.15,-.3,.2,.16]],.43);
  return b},
 // FAROLA (≈0,35 × 1,87; fp 3×3 px; lleva `lamp:1`): poste de hierro con base de piedra, ménsula curva y farol enjaulado con luz cálida.
 farola(o){const b=new B(61);b.stone(0,0,0,.3,.16,.3,PAL.stone,{j:.1});b.cyl(0,.14,0,.07,.045,1.36,6,PAL.iron,{v:.08});b.cyl(0,.14,0,.1,.08,.06,6,PAL.ironL);b.cyl(0,.5,0,.065,.065,.04,6,PAL.ironL);b.cyl(0,1.0,0,.05,.05,.03,6,PAL.ironL);
  b.beam([0,1.46,0],[.12,1.58,0],.04,PAL.iron);b.beam([.12,1.58,0],[.12,1.62,0],.04,PAL.iron);
  const x=.12,y=1.34;b.box(x,y,0,.2,.03,.2,PAL.iron,{t:.9});b.box(x,y+.03,0,.14,.22,.14,PAL.lamp,{em:1,nb:1,t:.92});   // cristal con luz
  [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([a,c])=>b.beam([x+a*.075,y+.03,c*.075],[x+a*.075,y+.26,c*.075],.026,PAL.iron));
  b.box(x,y+.25,0,.22,.035,.22,PAL.iron);b.box(x,y+.28,0,.12,.07,.12,PAL.iron,{t:.55});b.cyl(x,y+.35,0,.03,.015,.05,5,PAL.iron);
  mossPatch(b,[[0,0,.2,.2]],.155);return b},
 // BARRIL (≈0,48 × 0,46): duelas oscuras con vientre, tres aros de hierro y tapa.
 barril(o){const b=new B(71);b.cyl(0,0,0,.2,.2,.46,10,PAL.barrel,{seg:3,bulge:.04,v:.16,j:.02});[.07,.23,.39].forEach(y=>b.cyl(0,y,0,.232,.232,.03,10,PAL.iron,{bulge:.0,seg:1,nb:1,open:1,j:0}));
  b.cyl(0,.44,0,.17,.17,.02,10,mix(PAL.barrel,PAL.timberL,.5),{nb:1,v:.1});b.cyl(0,.0,0,.18,.18,.02,10,PAL.plankD,{nb:1});return b},
 // CAJA (≈0,43 × 0,37): tablas con riostras en aspa y esquinas de hierro.
 caja(o){const b=new B(81);b.box(0,0,0,.4,.36,.38,PAL.plank,{v:.14,g:.18,jit:.01});[-1,1].forEach(s=>{b.box(s*.19,0,0,.042,.37,.4,PAL.timber,{nb:1});b.box(0,0,s*.18,.42,.37,.042,PAL.timber,{nb:1})});
  b.beam([-.19,.04,.2],[.19,.32,.2],.035*TK,PAL.timberL);b.beam([.19,.04,.2],[-.19,.32,.2],.035*TK,PAL.timberL);b.box(0,.36,0,.36,.025,.34,PAL.plankD,{nb:1,v:.1});
  [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([a,c])=>b.box(a*.2,.33,c*.19,.05,.05,.05,PAL.iron));return b},
 // HENO (≈0,88 × 0,84, alto 0,52 sobre 0,14): dos balas atadas con cuerda; paja apagada, no amarillo chillón.
 heno(o){const b=new B(91);b.box(0,0,0,.66,.3,.52,PAL.hay,{v:.18,g:.35,t:.96,jit:.03,my:.12});b.box(.04,.3,.02,.5,.26,.42,mul(PAL.hay,.92),{v:.18,t:.9,jit:.04,my:-.2,g:.15});
  [-.17,.17].forEach(x=>{b.box(x,0,0,.025,.31,.54,PAL.rope,{nb:1,my:.12});b.box(x+.04,.3,.02,.025,.27,.44,PAL.rope,{nb:1,my:-.2})});
  for(let i=0;i<14;i++){const a=hash(91,i,1)*Math.PI*2,r=.26+hash(91,i,2)*.12;b.beam([Math.cos(a)*r,.02,Math.sin(a)*r],[Math.cos(a)*(r+.08),.14+hash(91,i,3)*.06,Math.sin(a)*(r+.08)],.016,mul(PAL.hay,.8+hash(91,i,4)*.35))}   // briznas sueltas alrededor
  return b},
 // VALLA (≈0,88 × 0,47 × 0,1; `len` px): postes con punta, dos travesaños, algo ladeada y con musgo.
 valla(o){const b=new B(101),L=Math.max(.5,((o&&o.len)||18)/20.5);[-1,1].forEach((s,i)=>{b.box(s*L*.47,0,0,.083,.46+i*.03,.083,PAL.timber,{v:.15,t:.7,jit:.015,g:.2});b.box(s*L*.47,.45+i*.03,0,.045,.03,.045,PAL.timberL,{t:.4})});
  [.16,.32].forEach((y,i)=>b.box(0,y,.025,L*.96,.083,.042,mix(PAL.plank,PAL.timberL,i*.5),{v:.14,jit:.02,nb:1}));mossPatch(b,[[-L*.4,0,.1,.08]],.4);return b}
};
// huella y altura de referencia: tamaño de la malla ACTUAL de ORG (medida con Chromium el 18 oct 2026: ver props_sheet.py --medir) y tolerancia
export const FOOT={casa:[2.4,2.23,1.93],taberna:[2.88,3.0,2.03],granero:[1.8,1.81,2.42],cabana:[2.09,1.74,1.81],pozo:[.85,1.64,1.12],farola:[.35,1.87,.34],barril:[.48,.46,.48],caja:[.43,.37,.41],heno:[.88,.66,.84],valla:[.88,.47,.1]};
// PUERTAS de los modelos oscuros (R3D-F2C-PUERTAS, 18 oct 2026): centro de la puerta en el marco local del modelo SIN rot (x a lo largo de la fachada, z = plano de la puerta, cara hacia +z),
// ancho y alto en tiles. Lo lee DoorGlow (stations3d.js) para poner el brillo de «entrar» sobre la puerta VISIBLE. Si añades una casa nueva con puerta, añade su fila (los valores salen de su doorZ()).
// Los modelos que NO están aquí (ORG pastel: troncos, palafito, casaJp…) usan el punto ST de la puerta (ahí ORG dibuja su puerta).
export const DOOR_AT={casa:{x:2.04*.2,z:1.5/2,w:.38,h:.62*DK},taberna:{x:2.3*.3,z:1.64/2,w:.44,h:.68*DK},granero:{x:0,z:2.1/2,w:.82,h:.94},cabana:{x:1.5*.22,z:1.18/2,w:.34,h:.54*DK}};
export const TOL=.22;   // fracción: la malla nueva puede medir ±22 % que la actual (los tejados con alero y la paja se pasan un poco; la colisión `fp` es menor que la malla)
// el granero del juego se usa con `rot:1` (cara larga hacia +x): ORG ya lo trae con la cumbrera en x, así que aquí se modela con la cumbrera en z? NO: se modela con la cumbrera en x como el resto y `o.rot` lo gira (x↔z) igual que ORG.rot.
const GEO=new Map();
function swapXZ(g){const p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setX(i,z);p.setZ(i,x);const nx=n.getX(i),nz=n.getZ(i);n.setX(i,nz);n.setZ(i,nx)}
 for(let i=0;i<p.count;i+=3){for(const a of [p,n,g.attributes.color,g.attributes.aEmit]){const s=a.itemSize;for(let k=0;k<s;k++){const t=a.array[i*s+s+k];a.array[i*s+s+k]=a.array[i*s+2*s+k];a.array[i*s+2*s+k]=t}}}   // espejo → invertir el orden de los vértices de cada triángulo
 g.computeBoundingBox();g.computeBoundingSphere();return g}
// darkGeo(n,o,th): misma firma y retorno que `propGeo` de props3d.js → {g,key}; null si el modelo no está rediseñado (el llamador sigue con ORG).
export function darkGeo(n,o,th){if(!MODELS[n])return null;const key='dk:'+n+'|'+JSON.stringify(o||{});if(GEO.has(key))return GEO.get(key);
 let g=MODELS[n](o||{}).geo();if(o&&(o.rot||o.dir==='y'))g=swapXZ(g);const r={g,key};   // `dir:'y'` = pieza larga girada 90° (vallas de los lados N-S del rancho/huerto; ORG lo hacía con `al`): sin esto salían todas a lo largo de x («dadas vueltas»)
 GEO.set(key,r);return r}
export const DARK_NAMES=Object.keys(MODELS);
// verificador anti-clipping: devuelve los vértices que asoman por el tejado de un modelo ([] = correcto). Lo usa tools/r3d/roof_clip_check.py.
export function clipReport(n,o){const b=MODELS[n](o||{});return {clips:b.clips(),roofs:b.R.length}}
// Fase 4 (20 oct 2026): ayudantes compartidos con el módulo hermano `propsdark_nat3d.js` (naturaleza oscura por bioma): mismo colector de triángulos y misma mezcla de colores.
export {B,hash,vary,mix,mul,col};
// Fase 5 (20 oct 2026): ayudantes compartidos con `propsdark_pradera3d.js` (molino, iglesia, puestos, empalizada…): mismas piezas de ventana, puerta, farol, chimenea y paleta.
export {PAL,windowAt,doorZ,lanternAt,chimney,timberFace,mossPatch,swapXZ,wallOf,roofOf,DK};
