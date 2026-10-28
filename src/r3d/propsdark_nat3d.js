// NotScape · R3D · FASE 4 (20 oct 2026) · NATURALEZA OSCURA POR BIOMA: roca, piedra, arbusto, tocón, seta, tronco, huesos, charco y carpa.
// Módulo hermano de `propsdark3d.js` (mismo colector `B`, misma técnica, mismo contrato): geometría three por código, sin UV, sin assets.
// Rehace los ≈ 7 800 props de naturaleza que seguían saliendo de ORG en pastel (roca 3 989 · arbusto 2 003 · tocón 1 091 · seta 637 · huesos 74 · piedra 72 · tronco 57 · carpa 70 · charco 9).
//
// CONTRATO (igual que propsdark3d.js; lo mide `tools/r3d/nat_sheet.py --medir`):
//  · unidades y ejes de ORG: 1 tile = 1 unidad, y arriba, origen = centro de la huella en el suelo, frente/puerta hacia +z. `o.rot` NO se usa en estos modelos.
//  · huella y altura dentro de NAT_FOOT ±TOL (22 %) en CADA bioma → la colisión `fp` no cambia y no hay que tocar layouts.
//  · atributos position/normal(plana)/color/aEmit (2 = brasa/lava siempre encendida; aquí SOLO grietas del Volcán y puntas de matorral quemado). Determinista (`hash`).
//  · VARIANTE POR BIOMA: `o.bk` (0..8) = índice del bioma donde está la instancia; lo inyecta `props3d.js` (no existe en los datos). Cada bioma trae SU paleta y, en el arbusto, SU forma:
//      0 Pradera brezo/espino · 1 Bosque helecho · 2 Pantano zarzal · 3 Cumbres pino enano con nieve · 4 Oriental azalea · 5 Volcán matorral calcinado · 6 Páramo arbusto arcano · 7 Desierto salvia seca · 8 Costa mata de dunas.
//  · Todo es DATOS (tabla NAT); nunca un `if` por bioma dentro de un modelo salvo por campos de la tabla.
import * as THREE from 'three';
import {B,hash,vary,mix,mul,col,dirty} from './propsdark3d.js';

export const TOL=.22;
// huella y altura de la malla ORG ACTUAL (medida con Chromium el 20 oct 2026 con `?props=old`, PROP_K aparte): [ancho x, alto y, fondo z]
export const NAT_FOOT={roca:[.70,.27,.47],piedra:[1.06,.46,.78],arbusto:[.85,.56,.81],tocon:[.43,.25,.44],seta:[.65,.39,.54],huesos:[.74,.32,.6],charco:[1.13,.06,.75],carpa:[1.09,1.25,.98],tronco:[1.06,.33,.3],mena:[.79,.36,.59],bocaCueva:[2.48,1.44,1.9]};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// cuadrilátero con 4 colores de vértice (B.quad repite los 3 primeros en el segundo triángulo)
const Q=(b,p,q,r,s,cs,em,ctr)=>{b.tri(p,q,r,[cs[0],cs[1],cs[2]],em,ctr);b.tri(p,r,s,[cs[0],cs[2],cs[3]],em,ctr)};

// ───────────────── paleta por bioma (DATOS) ─────────────────
// rock/rockL = piedra en sombra/luz · moss = fracción de caras superiores con musgo/liquen/alga · mossC = color de ese musgo · snow = nieve sucia sobre caras altas · ember = grietas de brasa (aEmit 2)
// shrub = forma del arbusto · leaf = 3 tonos de hoja/caña · acc/accN = acento pequeño (flor, baya, brasa, cristal) · bark/cut = corteza y madera cortada (tocón, tronco) · cap/spot = sombrero y motas de seta · bone = hueso
const NAT=[
 {id:'pradera', rock:'#77715f',rockL:'#979180',moss:.55,mossC:'#4e6234',snow:0,ember:0,shrub:'bush',  leaf:['#3d5a2c','#4d6b33','#33502a'],acc:'#a283a8',accN:7, bark:'#3a2c20',cut:'#a07f56',cap:['#7a4a34','#6a3a2c'],spot:'#d8cdb0',bone:'#a89f88',wsnow:0,char:0},
 {id:'bosque',  rock:'#5f6355',rockL:'#7f8270',moss:.85,mossC:'#3f5a2e',snow:0,ember:0,shrub:'fern',  leaf:['#2f5a34','#3e6e3a','#265030'],acc:'#c8d08a',accN:0, bark:'#2e251d',cut:'#8a6c48',cap:['#6a2f2a','#7a4a30'],spot:'#e0d6b8',glow:'#c6d4b2',bone:'#9c9580',wsnow:0,char:0},
 {id:'pantano', rock:'#4f5148',rockL:'#6c6e5d',moss:.9, mossC:'#4a5a2a',snow:0,ember:0,shrub:'bramble',leaf:['#3a4a26','#4a5a2c','#2c3a20'],acc:'#7a4478',accN:9, bark:'#2a2218',cut:'#6e5a40',cap:['#5a6a58','#6a7060'],spot:'#c8d4c0',glow:'#b6d0c4',bone:'#8f8a74',wsnow:0,char:0},
 {id:'cumbres', rock:'#6b7078',rockL:'#929aa2',moss:.1, mossC:'#58684a',snow:.5,ember:0,shrub:'conifer',leaf:['#2a4a38','#335a42','#233e30'],acc:'#d4dce0',accN:0, bark:'#33291f',cut:'#9a8466',cap:['#8a8678','#7a766a'],spot:'#e8e6dc',bone:'#b4b09c',wsnow:.6,char:0},
 {id:'oriental',rock:'#78756c',rockL:'#9a968a',moss:.45,mossC:'#4a6238',snow:0,ember:0,shrub:'azalea',leaf:['#34542f','#40623a','#2c4828'],acc:'#b04c62',accN:16,bark:'#352a22',cut:'#a4845c',cap:['#7a4a34','#6a3a2c'],spot:'#d8cdb0',bone:'#a89f88',wsnow:0,char:0},
 {id:'volcan',  rock:'#3a3638',rockL:'#5c5352',moss:0,  mossC:'#3a3a30',snow:0,ember:1,shrub:'scrub', leaf:['#3a3532','#2c2826','#4a4440'],acc:'#ff6a22',accN:3, bark:'#241f1e',cut:'#4a3a30',cap:['#5a3a34','#4a2e2a'],spot:'#b8a898',bone:'#8a8076',wsnow:0,char:1},
 {id:'paramo',  rock:'#5f5a78',rockL:'#8a84aa',moss:.15,mossC:'#4a4a78',snow:0,ember:0,shrub:'bush',  leaf:['#4a4488','#5a52a0','#3c3674'],acc:'#bcd0ff',accN:9, bark:'#2c2630',cut:'#8a7aa8',cap:['#6a5a8a','#5a4a78'],spot:'#d0c8f0',bone:'#b0a8c0',wsnow:0,char:0},
 {id:'desierto',rock:'#a08a64',rockL:'#c4ae84',moss:0,  mossC:'#8a8a54',snow:0,ember:0,shrub:'scrub', leaf:['#8a7a52','#a08c5c','#6e6444'],acc:'#c8a850',accN:0, bark:'#4a3a28',cut:'#c4aa80',cap:['#8a6a48','#7a5a3c'],spot:'#e0d4b0',bone:'#cfc4a6',wsnow:0,char:0,dry:1},
 {id:'costa',   rock:'#5e6468',rockL:'#848a8c',moss:.35,mossC:'#3e5a40',snow:0,ember:0,shrub:'tuft',  leaf:['#7a8a50','#8a9a5c','#66763e'],acc:'#d8d0b8',accN:0, bark:'#6a5e50',cut:'#bba98a',cap:['#7a6a58','#6a5a4a'],spot:'#e0d8c4',bone:'#d2c8ae',wsnow:0,char:0}];
// Fase 4c · CULTURA por bioma (carpa y huesos): tent = forma de la tienda (a dos aguas · tipi · yurta · pabellón · toldo) · tusk = colmillos cruzados en la cumbrera · bones = tipo de osamenta (costillar · montón de cráneos · bestia con cuernos · costillas de ballena)
const CULT=[{tent:'a',tusk:1,bones:'pile'},{tent:'tipi',bones:'ribs'},{tent:'tipi',bones:'ribs'},{tent:'yurt',bones:'beast'},{tent:'pav',bones:'ribs'},{tent:'a',tusk:1,bones:'beast'},{tent:'yurt',bones:'pile'},{tent:'lean',bones:'beast'},{tent:'lean',bones:'whale'}];
NAT.forEach((p,i)=>Object.assign(p,CULT[i]));
const PB=o=>NAT[clamp((o&&o.bk)|0,0,NAT.length-1)];
const C=h=>new THREE.Color(h);

// ───────────────── ayudantes de forma ─────────────────
// LUMP: elipsoide facetado (R anillos × S lados) con vértices desplazados. `paint(ny,yn,i)` devuelve un Color (o [Color,aEmit]); `clip` = y mínima (por debajo todo se aplana y se omite: la roca se HUNDE en el suelo).
function lump(b,cx,cy,cz,rx,ry,rz,sd,paint,o={}){
 const R=o.R||3,S=o.S||7,amp=o.amp??.25,clip=o.clip,V=[],ctr=[cx,cy,cz];
 for(let j=0;j<=R;j++){const ph=Math.PI*j/R,sn=Math.sin(ph),cs=Math.cos(ph),n=(j===0||j===R)?1:S,row=[];
  for(let k=0;k<n;k++){const a=k/S*Math.PI*2,d=1+(hash(sd,j*13+k,1)-.5)*2*amp;let y=cy+cs*ry*(1+(hash(sd,j*13+k,2)-.5)*amp);if(clip!==undefined&&y<clip)y=clip;
   row.push([cx+Math.cos(a)*sn*rx*d,y,cz+Math.sin(a)*sn*rz*d])}V.push(row)}
 let idx=0;
 const T=(p,q,r)=>{const i=idx++;if(clip!==undefined&&p[1]<=clip+1e-4&&q[1]<=clip+1e-4&&r[1]<=clip+1e-4)return;
  const ux=q[0]-p[0],uy=q[1]-p[1],uz=q[2]-p[2],vx=r[0]-p[0],vy=r[1]-p[1],vz=r[2]-p[2];let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const l=Math.hypot(nx,ny,nz);if(l<1e-9)return;
  const mx=(p[0]+q[0]+r[0])/3-cx,my=(p[1]+q[1]+r[1])/3-cy,mz=(p[2]+q[2]+r[2])/3-cz;if(nx*mx+ny*my+nz*mz<0)ny=-ny;   // ny hacia fuera
  const yn=clamp(((p[1]+q[1]+r[1])/3-(cy-ry))/(2*ry),0,1),c=paint(ny/l,yn,i);b.tri(p,q,r,Array.isArray(c)?c[0]:c,Array.isArray(c)?c[1]:0,ctr)};
 const top=V[0][0],bot=V[R][0];
 for(let k=0;k<S;k++)T(top,V[1][(k+1)%S],V[1][k]);
 for(let j=1;j<R-1;j++)for(let k=0;k<S;k++){const a=V[j][k],bb=V[j][(k+1)%S],c=V[j+1][(k+1)%S],d=V[j+1][k];T(a,bb,c);T(a,c,d)}
 if(R>=2){for(let k=0;k<S;k++)T(V[R-1][k],V[R-1][(k+1)%S],bot)}}

// pintor de ROCA: gris por bioma, más claro arriba, AO hacia el suelo, musgo/liquen en caras altas, nieve sucia, grietas de brasa (Volcán)
const rockPaint=(P,sd)=>(ny,yn,i)=>{let c=vary(mix(C(P.rock),C(P.rockL),clamp(ny*.9,0,1)*.75),.13,sd,i);c=mul(c,.66+.34*Math.min(1,yn*1.5));
 if(ny>.45&&hash(sd,i,5)<P.moss*(.5+ny*.5))c=mix(c,vary(C(P.mossC),.2,sd,i),.5+.35*hash(sd,i,6));
 else if(ny<.45&&yn<.5&&hash(sd,i,7)<P.moss*.3)c=mix(c,C(P.mossC),.35);
 if(P.snow&&ny>.3&&hash(sd,i,8)<P.snow)c=mix(c,C('#a2acb2'),.6);
 if(P.ember&&ny<.5&&yn<.55&&hash(sd,i,9)<.11)return[col('#ff5a1a'),2];
 return c};
// pintor de HOJAS: tres tonos de la paleta, oscuro abajo, algo más claro arriba
const leafPaint=(P,sd,k=1)=>(ny,yn,i)=>{const base=C(P.leaf[Math.floor(hash(sd,i,11)*P.leaf.length)]);return mul(vary(base,.16,sd,i),(.5+.42*yn+.12*clamp(ny,0,1))*k)};

// varilla/caña fina: prisma TRIANGULAR sin tapas (6 triángulos en vez de los 12 de una viga) para zarzas, matorral y ramas
function cane(b,p,q,t,c){const d=new THREE.Vector3(q[0]-p[0],q[1]-p[1],q[2]-p[2]),L=d.length();if(L<1e-6)return;d.normalize();
 const up=Math.abs(d.y)>.95?new THREE.Vector3(1,0,0):new THREE.Vector3(0,1,0),u=new THREE.Vector3().crossVectors(d,up).normalize(),w=new THREE.Vector3().crossVectors(d,u).normalize(),h=t/2,ctr=[(p[0]+q[0])/2,(p[1]+q[1])/2,(p[2]+q[2])/2];
 const S=[0,1,2].map(k=>{const a=k/3*Math.PI*2+Math.PI/2;return[Math.cos(a),Math.sin(a)]}),A=S.map(([a,e])=>[p[0]+u.x*a*h+w.x*e*h,p[1]+u.y*a*h+w.y*e*h,p[2]+u.z*a*h+w.z*e*h]),Bq=S.map(([a,e])=>[q[0]+u.x*a*h+w.x*e*h,q[1]+u.y*a*h+w.y*e*h,q[2]+u.z*a*h+w.z*e*h]);
 for(let i=0;i<3;i++){const k=(i+1)%3;b.quad(A[i],A[k],Bq[k],Bq[i],c,0,ctr)}}
// cinta de hoja/brizna: de `base` hacia `dir` (ángulo a en xz), largo len, ancho w, arco `arch`; dos facetas (pliegue central) por tramo
function frond(b,base,a,len,rise,w,c0,c1,segs,droop=.1){
 const nx=-Math.sin(a),nz=Math.cos(a),pt=u=>{const r=len*u;return[base[0]+Math.cos(a)*r,base[1]+len*rise*Math.sin(u*Math.PI*.78)-droop*u*u,base[2]+Math.sin(a)*r]};
 for(let s=0;s<segs;s++){const u0=s/segs,u1=(s+1)/segs,p0=pt(u0),p1=pt(u1),w0=w*(1-u0*.82)+.006,w1=w*(1-u1*.82)+.006,k0=mix(c0,c1,u0),k1=mix(c0,c1,u1);
  const L0=[p0[0]+nx*w0,p0[1]-.004,p0[2]+nz*w0],R0=[p0[0]-nx*w0,p0[1]-.004,p0[2]-nz*w0],M0=[p0[0],p0[1]+w0*.45,p0[2]],L1=[p1[0]+nx*w1,p1[1]-.004,p1[2]+nz*w1],R1=[p1[0]-nx*w1,p1[1]-.004,p1[2]-nz*w1],M1=[p1[0],p1[1]+w1*.45,p1[2]];
  const ctr=[(p0[0]+p1[0])/2,(p0[1]+p1[1])/2-1,(p0[2]+p1[2])/2];   // la cinta mira hacia arriba
  Q(b,L0,M0,M1,L1,[k0,k0,k1,k1],0,ctr);Q(b,M0,R0,R1,M1,[k0,k0,k1,k1],0,ctr)}}
// cilindro tumbado a lo largo de x (troncos): n lados, radios r0 (x−) y r1 (x+), tapas con anillo de crecimiento
function logX(b,L,r0,r1,y,n,bark,cutC,sd,o={}){const ring=(x,r,sg)=>Array.from({length:n},(_,k)=>{const a=k/n*Math.PI*2,d=1+(hash(sd,k,sg)-.5)*(o.j||.12);return[x,y+Math.sin(a)*r*d,Math.cos(a)*r*d]});
 const A=ring(-L/2,r0,1),Bq=ring(L/2,r1,2),ctr=[0,y,0];
 for(let k=0;k<n;k++){const k2=(k+1)%n,am=(k+.5)/n*Math.PI*2;let c=vary(bark,.2,sd,k);const up=Math.sin(am);if(up>.45&&o.top&&hash(sd,k,5)<o.topP)c=mix(c,o.top,.75);const c2=mul(c,.78);Q(b,A[k],A[k2],Bq[k2],Bq[k],[c,c,c2,c2],0,ctr)}
 [[-L/2,r0,A,-1],[L/2,r1,Bq,1]].forEach(([x,r,R,sg],e)=>{const cc=o.capC&&e===1?o.capC:cutC,c=[x+sg*.004,y,0];for(let k=0;k<n;k++)b.tri(c,R[(k+1)%n],R[k],mix(cc,bark,.18),0,[x-sg*1,y,0]);
  const ri=Array.from({length:n},(_,k)=>{const a=k/n*Math.PI*2;return[x+sg*.01,y+Math.sin(a)*r*.52,Math.cos(a)*r*.52]});for(let k=0;k<n;k++)b.tri([x+sg*.012,y,0],ri[(k+1)%n],ri[k],mul(cc,.74),0,[x-sg*1,y,0])})}   // anillo interior = duramen más oscuro

// ───────────────── ROCA SUAVE (Fase 4b, 20 oct 2026) ─────────────────
// El dueño: las rocas facetadas de 50 triángulos «se ven muy lowpoly y cartoon» junto a las casas. Ahora cada roca es una icosfera subdividida con relieve de ruido en 3 octavas
// (cantos redondeados pero con bloque), NORMALES SUAVIZADAS (con un 30 % de faceta para que las bandas toon aún dibujen planos) y color POR VÉRTICE: estratos, grietas oscuras (AO por ruido),
// musgo/nieve en manchas suaves según la normal, venas de brasa en el Volcán. Mismo material y mismo contorno que los edificios.
const vn3=(x,y,z,s)=>{const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),fx=x-ix,fy=y-iy,fz=z-iz,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),w=fz*fz*(3-2*fz),h=(a,b,c)=>hash(ix+a+s*17,iy+b,iz+c),l=(a,b,t)=>a+(b-a)*t;
 return l(l(l(h(0,0,0),h(1,0,0),u),l(h(0,1,0),h(1,1,0),u),v),l(l(h(0,0,1),h(1,0,1),u),l(h(0,1,1),h(1,1,1),u),v),w)};
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const FACET=.3;   // fracción de normal plana mezclada con la suave
function rockGeo(parts,P,sd){const POS=[],NOR=[],COL=[],EM=[];
 parts.forEach(([cx,cy,cz,rx,ry,rz,det,clip=0,fx={}],pi)=>{const ico=new THREE.IcosahedronGeometry(1,det),pa=ico.attributes.position,N=pa.count,V=new Array(N),s0=sd+pi*5;
  for(let i=0;i<N;i++){let x=pa.getX(i),y=pa.getY(i),z=pa.getZ(i);const l=Math.hypot(x,y,z);x/=l;y/=l;z/=l;
   const n1=vn3(x*1.4+3,y*1.4,z*1.4,s0),n2=vn3(x*3.2,y*3.2+5,z*3.2,s0+1),n3=vn3(x*7.5,y*7.5,z*7.5+9,s0+2),q=.45,cb=v=>Math.sign(v)*Math.pow(Math.abs(v),.74),bx=x*(1-q)+cb(x)*q,by=y*(1-q)+cb(y)*q,bz=z*(1-q)+cb(z)*q,
    rad0=1+.3*(n1-.5)+.13*(n2-.5)+.05*(n3-.5);let rad=rad0,by2=by,fr=0,crk=0,cl=0;
   if(fx.st){const[K,amt,sa]=fx.st,t=(by*.5+.5)*K,fl=Math.floor(t);fr=t-fl;by2=by*(1-amt)+((fl+sstep(.3,.7,fr))/K*2-1)*amt;rad*=1+sa*Math.sin(fr*Math.PI)}   // ESTRATOS: el y se cuantiza en lajas apiladas (escalón real) y cada laja abulta a media altura
   if(fx.cr){const nc=vn3(x*2.6+7,y*2.6,z*2.6+3,s0+3);crk=sstep(fx.cr[0],0,Math.abs(nc-.5));rad*=1-fx.cr[1]*crk}   // GRIETAS: surco real donde el ruido cruza .5
   if(fx.cl){const[a,off,w,dp]=fx.cl,dd=x*Math.cos(a)+z*Math.sin(a)+(n2-.5)*.3-off;cl=sstep(w,0,Math.abs(dd))*sstep(-.7,.5,by);rad*=1-dp*cl}   // HENDIDURA: cuña en V que parte el peñasco
   let py=cy+by2*ry*rad;if(py<clip)py=clip;V[i]=[cx+bx*rx*rad,py,cz+bz*rz*rad,n1,n2,n3,crk,fr,cl]}
  // normales suaves por posición (suma de normales de cara ponderada por área)
  const key=v=>Math.round(v[0]*2e3)+','+Math.round(v[1]*2e3)+','+Math.round(v[2]*2e3),acc=new Map(),FN=[];
  for(let i=0;i<N;i+=3){const a=V[i],b=V[i+1],c=V[i+2],ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
   const mx=(a[0]+b[0]+c[0])/3-cx,my=(a[1]+b[1]+c[1])/3-(cy-.02),mz=(a[2]+b[2]+c[2])/3-cz,flip=nx*mx+ny*my+nz*mz<0;if(flip){nx=-nx;ny=-ny;nz=-nz}
   FN.push([nx,ny,nz,flip]);for(const v of [a,b,c]){const k=key(v),o=acc.get(k)||[0,0,0];o[0]+=nx;o[1]+=ny;o[2]+=nz;acc.set(k,o)}}
  for(let t=0;t<N/3;t++){const i=t*3,vs=[V[i],V[i+1],V[i+2]];if(vs.every(v=>v[1]<=clip+1e-4))continue;const f=FN[t],fl=Math.hypot(f[0],f[1],f[2])||1;
   const tri=f[3]?[vs[0],vs[2],vs[1]]:vs;
   for(const v of tri){const o=acc.get(key(v)),ol=Math.hypot(o[0],o[1],o[2])||1;let nx=o[0]/ol*(1-FACET)+f[0]/fl*FACET,ny=o[1]/ol*(1-FACET)+f[1]/fl*FACET,nz=o[2]/ol*(1-FACET)+f[2]/fl*FACET;const nl=Math.hypot(nx,ny,nz)||1;nx/=nl;ny/=nl;nz/=nl;
    POS.push(v[0],v[1],v[2]);NOR.push(nx,ny,nz);
    const yn=clamp((v[1]-cy+ry*.2)/(ry*1.5),0,1);let c=mix(C(P.rock),C(P.rockL),clamp(ny*.55+(v[3]-.5)*.9,0,1));
    c=mul(c,(.9+.14*(.5+.5*Math.sin(v[1]*(14/(ry+.12))+v[3]*6)))*(.7+.38*sstep(.15,.85,v[3]*.7+v[4]*.5))*(.8+.28*yn));
    if(fx.st){const g=1-Math.sin(v[7]*Math.PI);c=mul(c,1-.42*g*g)}   // junta oscura entre lajas
    if(v[6]>0)c=mul(c,1-.55*v[6]);if(v[8]>0)c=mul(c,1-.5*v[8]);   // fondo de grieta / hendidura
    if(P.moss>0){const mm=sstep(.5,.85,(ny-.25)*1.4+(v[4]-.5)*1.6+(P.moss-.5)*.5);c=mix(c,mul(C(P.mossC),.8+.4*v[5]),mm*.55*Math.min(1,P.moss*1.4))}
    if(P.snow>0){const sn=sstep(.35,.7,(ny-.25)*1.7+(v[4]-.5)*.9)*P.snow*1.25;c=mix(c,C('#a6b0b6'),Math.min(.85,sn))}
    let em=0;if(P.ember){const vein=sstep(.025,.0,Math.abs(v[4]-.5))*(ny<.7?1:0);if(vein>.5){c=col('#ff5a1a');em=2}}
    COL.push(c.r,c.g,c.b);EM.push(em)}}});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(POS,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(NOR,3));g.setAttribute('color',new THREE.Float32BufferAttribute(COL,3));g.setAttribute('aEmit',new THREE.Float32BufferAttribute(EM,1));
 g.computeBoundingBox();g.computeBoundingSphere();return {geo:()=>g}}


// ───────────────── ROCA «TINY GLADE» (Lote R3D-TG-PROTO, 20 oct 2026) ─────────────────
// El dueño: las rocas «parecen PS1»; quiere la FORMA de Tiny Glade (no su paleta: se conservan nuestros colores). Diagnóstico: `rockGeo` da un blob con ruido (grumos redondos) que se lee derretido/low-poly.
// Las rocas de Tiny Glade son POLIEDROS DE CARAS GRANDES Y PLANAS con aristas suaves y poco relieve. Aquí: icosfera de alta resolución recortada por 6–9 PLANOS aleatorios (cada vértice por encima de un plano se proyecta
// sobre él → facetas amplias y planas), un poco de ruido de baja frecuencia en el tamaño y de alta amplitud mínima en la superficie, NORMALES SUAVES por posición (las caras amplias salen planas y las aristas se suavizan
// solas en 1–2 triángulos = «bisel») y COLOR POR FACETA (cada plano lleva su tono: variación tonal por cara como en las rocas de la referencia) + musgo en lo alto y oscurecido en la base.
// Misma firma que `rockGeo` (parts = [cx,cy,cz,rx,ry,rz,det,clip,fx]); `?rock=old` vuelve a rockGeo para comparar.
const TG_ROCK=typeof location==='undefined'||!/[?&]rock=old\b/.test(location.search);
function slabGeo(parts,P,sd){const POS=[],NOR=[],COL=[],EM=[];
 parts.forEach(([cx,cy,cz,rx,ry,rz,det,clip=0,fx={}],pi)=>{const s0=sd+pi*5,dt=Math.min(4,det+(pi===0?1:0)),ico=new THREE.IcosahedronGeometry(1,dt),pa=ico.attributes.position,N=pa.count,V=new Array(N);
  // planos de corte: normales repartidas (mitad hacia los lados, 1–2 hacia arriba) y distancia .6–.82 del centro
  const K=6+((hash(s0,1,1)*4)|0),cuts=[];for(let k=0;k<K;k++){const a=hash(s0,k,2)*Math.PI*2,el=k<2?.75+.2*hash(s0,k,3):(hash(s0,k,4)-.3)*1.1,cy2=Math.cos(el),n=[Math.cos(a)*cy2,Math.sin(el),Math.sin(a)*cy2],l=Math.hypot(n[0],n[1],n[2]);cuts.push([n[0]/l,n[1]/l,n[2]/l,.58+.24*hash(s0,k,5)])}
  for(let i=0;i<N;i++){let x=pa.getX(i),y=pa.getY(i),z=pa.getZ(i);const l=Math.hypot(x,y,z);x/=l;y/=l;z/=l;
   const n1=vn3(x*1.2+3,y*1.2,z*1.2,s0),n2=vn3(x*3.1,y*3.1+5,z*3.1,s0+1),r0=1.08+.22*(n1-.5);let px=x*r0,py=y*r0,pz=z*r0,pk=-1;
   for(let k=0;k<K;k++){const c=cuts[k],sd2=px*c[0]+py*c[1]+pz*c[2]-c[3];if(sd2>0){px-=c[0]*sd2;py-=c[1]*sd2;pz-=c[2]*sd2;pk=k}}
   const bump=.012*(n2-.5);px+=x*bump;py+=y*bump;pz+=z*bump;   // grano muy fino: la cara sigue plana a la vista
   let wy=cy+py*ry;if(wy<clip)wy=clip;V[i]=[cx+px*rx,wy,cz+pz*rz,n1,n2,pk]}
  const key=v=>Math.round(v[0]*2e3)+','+Math.round(v[1]*2e3)+','+Math.round(v[2]*2e3),acc=new Map(),FN=[];
  for(let i=0;i<N;i+=3){const a=V[i],b=V[i+1],c=V[i+2],ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
   const mx=(a[0]+b[0]+c[0])/3-cx,my=(a[1]+b[1]+c[1])/3-(cy-.02),mz=(a[2]+b[2]+c[2])/3-cz,flip=nx*mx+ny*my+nz*mz<0;if(flip){nx=-nx;ny=-ny;nz=-nz}
   FN.push([nx,ny,nz,flip]);for(const v of [a,b,c]){const k=key(v),o=acc.get(k)||[0,0,0];o[0]+=nx;o[1]+=ny;o[2]+=nz;acc.set(k,o)}}
  for(let t=0;t<N/3;t++){const i=t*3,vs=[V[i],V[i+1],V[i+2]];if(vs.every(v=>v[1]<=clip+1e-4))continue;const f=FN[t],fl=Math.hypot(f[0],f[1],f[2])||1;
   const tri=f[3]?[vs[0],vs[2],vs[1]]:vs;
   for(const v of tri){const o=acc.get(key(v)),ol=Math.hypot(o[0],o[1],o[2])||1,FA=.1;let nx=o[0]/ol*(1-FA)+f[0]/fl*FA,ny=o[1]/ol*(1-FA)+f[1]/fl*FA,nz=o[2]/ol*(1-FA)+f[2]/fl*FA;const nl=Math.hypot(nx,ny,nz)||1;nx/=nl;ny/=nl;nz/=nl;
    POS.push(v[0],v[1],v[2]);NOR.push(nx,ny,nz);
    const yn=clamp((v[1]-cy+ry*.2)/(ry*1.5),0,1),tone=v[5]>=0?.86+.28*hash(s0,v[5],9):1;
    let c=mix(C(P.rock),C(P.rockL),clamp(ny*.6+(v[3]-.5)*.5,0,1));c=mul(c,tone*(.74+.3*yn)*(.92+.16*v[4]));
    if(P.moss>0){const mm=sstep(.5,.85,(ny-.3)*1.4+(v[4]-.5)*1.5+(P.moss-.5)*.5);c=mix(c,mul(C(P.mossC),.8+.4*v[4]),mm*.5*Math.min(1,P.moss*1.4))}
    if(P.snow>0){const sn=sstep(.35,.7,(ny-.25)*1.7+(v[4]-.5)*.9)*P.snow*1.25;c=mix(c,C('#a6b0b6'),Math.min(.85,sn))}
    let em=0;if(P.ember){const vein=sstep(.025,.0,Math.abs(v[4]-.5))*(ny<.7?1:0);if(vein>.5){c=col('#ff5a1a');em=2}}
    COL.push(c.r,c.g,c.b);EM.push(em)}}});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(POS,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(NOR,3));g.setAttribute('color',new THREE.Float32BufferAttribute(COL,3));g.setAttribute('aEmit',new THREE.Float32BufferAttribute(EM,1));
 g.computeBoundingBox();g.computeBoundingSphere();return {geo:()=>g}}
const rockOf=(parts,P,sd)=>(TG_ROCK?slabGeo:rockGeo)(parts,P,sd);

// ───────────────── FOLLAJE DE LÁMINAS (misma técnica que los árboles) ─────────────────
// Dependencias de nature3d.js inyectadas por props3d.js (initNat): así este módulo sigue cargándose en Node para `nat_sheet.py --medir` (sin cards).
let DEP=null;export function initNat(d){DEP=d}
// racimos de láminas «mata» (receta de nature3d.treeGeo para frondosos): clusters = [[x,y,z,radio,nº láminas]]
function cardFoliage(P,sd,clusters,pal,R,fl){if(!DEP)return null;const V=THREE.Vector3,cards=[],cen=new V(0,.2,0);
 clusters.forEach(([x,y,z,rr,n],ci)=>{const c=new V(x,y,z);for(let i=0;i<n;i++){const u=hash(i,1,sd+ci*7),v=hash(i,2,sd+ci*7),th=u*6.283,ph=Math.acos(1-v*1.6),nn=new V(Math.sin(ph)*Math.cos(th),Math.cos(ph),Math.sin(ph)*Math.sin(th));
  let s=new V(0,1,0).cross(nn);if(s.lengthSq()<1e-3)s.set(1,0,0);s.normalize();const d=nn.clone().cross(s).normalize(),sz=rr*(.95+hash(i,3,sd)*.5);nn.y*=.8;
  cards.push({p0:c.clone().addScaledVector(nn,rr*.6).addScaledVector(d,-sz*.5),d,s,L:sz,H:sz,droop:0})}});
 if(!fl)return{g:DEP.cardGeo(cards,pal,()=>cen,()=>R),tex:'mata'};
 // FLORES / BAYAS como láminas con su propia celda del atlas 'matafl' (Fase 4c; antes cajitas de 4,5 cm): 1/3 = hojas, 2/3 = flores, 3/3 = bayas
 const fc=[],A=C(P.acc),n=fl.n??P.accN,sz0=fl.size||.13;
 for(let i=0;i<n;i++){const s=fl.spots[Math.floor(hash(sd,i,21)*fl.spots.length)],a=hash(sd,i,22)*Math.PI*2,e=(fl.lo??.3)+hash(sd,i,23)*(fl.hi??.95),r=s[3]*fl.k,
   nn=new V(Math.cos(a)*Math.cos(e),Math.sin(e)*.85,Math.sin(a)*Math.cos(e)).normalize(),pos=new V(s[0],s[1],s[2]).addScaledVector(nn,r);
  let sv=new V(0,1,0).cross(nn);if(sv.lengthSq()<1e-3)sv.set(1,0,0);sv.normalize();let d=nn.clone().cross(sv).normalize();const roll=hash(sd,i,24)*6.283;d.applyAxisAngle(nn,roll);sv.applyAxisAngle(nn,roll);
  const sz=sz0*(.85+hash(sd,i,25)*.4);fc.push({p0:pos.clone().addScaledVector(d,-sz*.5),d,s:sv,L:sz,H:sz,droop:0})}
 const fpal=[mul(A,.78),A,mix(A,C('#ffffff'),.22)],uv=fl.kind==='baya'?[2/3,1]:[1/3,2/3];
 return{g:cat([DEP.cardGeo(cards,pal,()=>cen,()=>R,{uv:[0,1/3]}),DEP.cardGeo(fc,fpal,()=>cen,()=>R,{uv,seg:2})],['position','normal','color','uv']),tex:'matafl'}}
const palOf=P=>[mul(C(P.leaf[2]),.75),C(P.leaf[0]),mix(C(P.leaf[1]),C('#a4b060'),.3)];
// concatena geometrías (no indexadas) con los mismos atributos
function cat(gs,attrs){const o={};for(const a of attrs)o[a]=[];let n=0;for(let g of gs){if(g.index)g=g.toNonIndexed();for(const a of attrs){const at=g.attributes[a];if(!at)continue;for(let i=0;i<at.array.length;i++)o[a].push(at.array[i])}}
 const r=new THREE.BufferGeometry();for(const a of attrs){const sz=a==='uv'?2:3;if(o[a].length)r.setAttribute(a,new THREE.Float32BufferAttribute(o[a],sz))}r.computeBoundingBox();r.computeBoundingSphere();return r}

// ───────────────── MODELOS ─────────────────
const MODELS={
 // ROCA (≈0,67 × 0,31 × 0,5): un bloque principal + dos satélites, hundidos en el suelo; color/musgo/nieve/brasa por bioma.
 roca(o){const P=PB(o),sd=201+(o.bk|0)*7,v=(o.v|0)%2;
  // v0 canto redondeado · v1 laja baja de estratos (3 lajas apiladas)
  return rockOf(v===1?[[-.04,.085,0,.3,.16,.22,2,0,{st:[3,.9,.12],cr:[.05,.06]}],[.23,.035,.1,.15,.08,.11,1,0,{st:[2,.7,.06]}],[-.24,.025,-.15,.1,.06,.08,1]]
   :[[-.04,.1,0,.28,.2,.21,2],[.21,.04,.1,.14,.11,.11,1],[-.22,.03,-.15,.1,.08,.08,1]],P,sd+v*3)},
 // PIEDRA (≈1,06 × 0,46 × 0,78): peñasco grande con dos satélites. v0 con grietas reales · v1 lajas apiladas con repisas · v2 hendido por la mitad (cuña en V).
 piedra(o){const P=PB(o),sd=231+(o.bk|0)*7,v=(o.v|0)%3,a=hash(sd,7,3)*Math.PI;
  const S=[[.4,.05,.2,.2,.14,.16,2],[-.42,.04,.22,.16,.11,.13,1]];
  if(v===1)return rockOf([[-.06,.135,-.02,.46,.31,.34,4,0,{st:[5,.95,.15],cr:[.05,.07]}],[.4,.05,.2,.2,.14,.16,2,0,{st:[3,.85,.11]}],S[1]],P,sd+3);
  if(v===2)return rockOf([[-.08,.13,-.02,.46,.3,.34,4,0,{cl:[a,.02,.17,.62],cr:[.045,.08]}],S[0],S[1]],P,sd+6);
  return rockOf([[-.08,.13,-.02,.46,.3,.34,4,0,{cr:[.07,.13]}],S[0],S[1]],P,sd)},
 // MENA (Lote MINERIA-SUAVE, 21 oct 2026): recurso de minería. Misma técnica que `roca` (planos de corte, normales suaves, tono por faceta) en lugar del blob pastel de ORG:
 //  · normal = peñasco de lajas con 4 vetas de mena (rocas más claras y de color de la mena, asomando) · o.crystal = base baja + racimo de prismas hexagonales de cristal · o.dead = escombro agotado (sin mena).
 //  o.base = color de la roca, o.ore = color de la mena (los pone nature3d.js por mena/tier; en el Cielo la base es mármol claro). Determinista: la semilla sale del color de la base.
 mena(o){const base=o.base||'#8a5a3a',ore=o.ore||'#c8742a',sd=601+(parseInt(base.slice(1,3),16)%23)*3,hx=(c,k)=>'#'+C(c).multiplyScalar(k).getHexString(),marble=base==='#d6cfbb';
  const PR={rock:hx(base,.78),rockL:hx(base,1.18),moss:marble?0:.18,mossC:'#44583a',snow:0,ember:0};
  if(o.dead)return rockOf([[0,.07,0,.3,.13,.24,2,0,{cr:[.05,.07]}],[.26,.03,.1,.12,.06,.1,1],[-.2,.025,-.14,.09,.05,.08,1]],{...PR,rock:hx(base,.6),rockL:hx(base,.9)},sd);
  const G=[];
  const oc=C(ore),h=(k,m)=>hash(sd,k,m);
  // pintor de mineral: tono del mineral, más claro en las caras que miran arriba (reflejo), oscuro abajo; `em` = brillo propio
  const mp=(c,em,sd2)=>(ny,yn,i)=>{const k=.62+.5*yn+.25*clamp(ny,0,1),t=mul(vary(mix(c,C('#ffffff'),.1+.28*clamp(ny,0,1)*hash(sd2,i,3)),.1,sd2,i),k);return em?[t,em]:t};
  if(o.crystal){   // GEMAS: gemas en bruto de contorno orgánico y caras facetadas irregulares (nada de prismas): matriz de roca + 7 nódulos alargados e inclinados que brillan
   G.push(rockOf([[0,.07,0,.36,.15,.3,2,0,{cr:[.05,.06]}],[.3,.03,.12,.13,.07,.1,1],[-.28,.03,-.1,.1,.06,.09,1]],PR,sd).geo());
   const b=new B(sd+9);[[0,.1,0,.1,.3,.09,0],[-.15,.07,.05,.075,.2,.07,.35],[.16,.07,.03,.08,.23,.075,-.3],[.04,.06,-.15,.065,.15,.06,.2],[-.08,.05,-.12,.055,.12,.05,-.25],[.2,.05,-.1,.05,.1,.05,.4],[-.2,.05,-.05,.05,.11,.05,-.4]].forEach(([x,y,z,rx,ry,rz,tl],i)=>{
    lump(b,x,y+ry*.9,z,rx,ry,rz,sd+30+i,mp(oc,1.5+.5*(i%2),sd+i),{R:4,S:6,amp:.3,clip:.04});   // núcleo facetado
    lump(b,x+tl*.1,y+ry*1.55,z,rx*.55,ry*.5,rz*.55,sd+50+i,mp(mix(oc,C('#ffffff'),.3),2.4,sd+i),{R:3,S:5,amp:.22})});   // punta más clara y luminosa
   for(let i=0;i<4;i++){const a2=i*1.6+h(i,1)*2;lump(b,Math.cos(a2)*.3,.03,Math.sin(a2)*.3,.04,.045,.04,sd+70+i,mp(oc,1.1,sd+i),{R:3,S:5,amp:.3,clip:.0})}
   G.push(b.geo());return {geo:()=>cat(G,['position','normal','color','aEmit'])}}
  if(o.stone){   // PIEDRAS DE ESCULTOR: peñasco grande de roca CLARA en estratos (lajas redondeadas apiladas, cada una de otro tono), una cara pulida y cascotes
   const L=C(ore),l2=hx(ore,1.0),Pl={rock:hx(ore,.72),rockL:hx(ore,1.22),moss:0,mossC:'#000000',snow:0,ember:0},k=1.25;
   G.push(rockOf([[0,.2*k,0,.4*k,.3*k,.36*k,3,0,{st:[6,.9,.1],cr:[.05,.08]}],[.06*k,.46*k,-.02,.27*k,.2*k,.25*k,2,0,{st:[4,.85,.08]}],[.3*k,.06,.14*k,.17*k,.11*k,.14*k,2,0,{st:[3,.8,.08]}],[-.32*k,.05,-.1*k,.13*k,.09*k,.11*k,1],[.0,.05,.34*k,.12*k,.07*k,.1*k,1]],Pl,sd).geo());
   const b=new B(sd+4);lump(b,-.08*k,.26*k,.26*k,.17*k,.2*k,.07*k,sd+8,mp(mix(L,C('#ffffff'),.12),0,sd),{R:3,S:6,amp:.1});   // cara pulida, más clara
   G.push(b.geo());return {geo:()=>cat(G,['position','normal','color','aEmit'])}}
  // METALES: peñasco con un FILÓN: pepitas de contorno irregular y brillo metálico incrustadas en la cara delantera y ramales de veta; el oro brilla más
  const OP={rock:hx(ore,.74),rockL:hx(ore,1.28),moss:0,mossC:'#000000',snow:0,ember:0},em=o.gold?1.6:.5;
  G.push(rockOf([[0,.14,-.04,.4,.27,.32,2,0,{st:[3,.55,.08]}],[.32,.05,.1,.15,.11,.12,1],[-.3,.04,-.14,.11,.08,.1,1],[.04,.28,-.1,.2,.14,.17,1]],PR,sd).geo());
  {const b=new B(sd+21);[[-.16,.2,.15,.13,.1,.11],[.15,.15,.14,.11,.09,.1],[.02,.3,.12,.09,.075,.085],[-.05,.1,.2,.1,.07,.09],[.22,.27,.05,.07,.06,.07],[-.24,.1,.02,.06,.05,.06]].forEach(([x,y,z,rx,ry,rz],i)=>
    lump(b,x,y,z,rx,ry,rz,sd+17+i,mp(oc,em,sd+i),{R:3,S:6,amp:.28}));
   for(let i=0;i<7;i++)lump(b,-.25+.5*hash(sd,i,31),.08+.26*hash(sd,i,32),.16+.08*hash(sd,i,33),.022,.018,.02,sd+90+i,mp(mix(oc,C('#ffffff'),.5),o.gold?3:1.2,sd+i),{R:2,S:5,amp:.2});   // destellos
   [[-.16,.2,.2],[.15,.15,.2],[.02,.3,.18],[-.05,.1,.26]].forEach(([x,y,z],i)=>b.beam([x,y,z],[x+(i%2?.1:-.08),y+.06,z-.02],.014,mul(oc,1.1),{em}));
   G.push(b.geo())}
  return {geo:()=>cat(G,['position','normal','color','aEmit'])}},
 // BOCA DE CUEVA (Lote CUEVAS-BOCA, 27 oct 2026; ≈2,5 × 1,45 × 1,9 → ×1,5 de PROP_K = 3,7 × 2,2 × 2,9 tiles ≈ 6 m de ancho): farallón de roca con un ARCO de dovelas y la entrada a oscuras, hacia +z (sur).
 //  Macizo trasero + dos jambas + 7 dovelas + tapón oscuro recesado dentro del hueco (el hueco libre mide ≈ 0,86 × 0,98 → 1,3 × 1,5 tiles, más que el héroe) + dientes de estalactita bajo el arco.
 //  Misma técnica y paleta de bioma que `roca` (se dibuja con `matRock`: props3d.js lo cuenta como roca). La mena y la veta de la cueva no se ven aquí: dentro es otra sala (cave3d.js).
 bocaCueva(o){const P=PB(o),sd=701+(o.bk|0)*13,Z=.43,G=[],hx=(c,k)=>'#'+C(c).multiplyScalar(k).getHexString();
  const RP={rock:P.rock,rockL:P.rockL,moss:Math.max(.3,P.moss),mossC:P.mossC,snow:P.snow,ember:0};
  const zs=a=>a.map(q=>{const r=q.slice();r[2]+=Z;return r});
  G.push(rockOf(zs([[0,.62,-.74,1.1,.8,.64,3],[-.86,.34,-.3,.38,.4,.44,2],[.86,.32,-.28,.4,.38,.44,2]]),RP,sd).geo());   // macizo y contrafuertes
  G.push(rockOf(zs([[-.78,.52,.12,.37,.6,.46,2],[.78,.5,.14,.37,.56,.44,2]]),RP,sd+5).geo());                              // jambas
  const arc=[];for(let i=0;i<7;i++){const a=Math.PI*i/6,x=Math.cos(a)*.6,y=.55+Math.sin(a)*.6;arc.push([x,y,.13,.17,.17,.42,1,0,{}])}
  G.push(rockOf(zs(arc),{...RP,rock:hx(P.rock,.9),rockL:hx(P.rockL,.92)},sd+9).geo());                                      // dovelas del arco
  const b=new B(sd+3);
  {const f=.34+Z,bk=-.02+Z,hw=.4,y0=.26,tp=.94,d0=mul(C(P.rock),.07),d1=mul(C(P.rock),.008),fl=mul(C(P.rock),.05),mid=(f+bk)/2;   // TÚNEL oscuro hacia dentro (suelo a y .26: por debajo el musgo del material de roca lo teñía de verde)
   Q(b,[-hw,y0,f],[hw,y0,f],[hw,y0,bk],[-hw,y0,bk],[fl,fl,d1,d1],0,[0,-1,mid]);
   Q(b,[-hw,tp,f],[hw,tp,f],[hw,tp,bk],[-hw,tp,bk],[d0,d0,d1,d1],0,[0,tp+1,mid]);
   Q(b,[-hw,y0,f],[-hw,y0,bk],[-hw,tp,bk],[-hw,tp,f],[d0,d1,d1,d0],0,[-hw-1,.5,mid]);
   Q(b,[hw,y0,f],[hw,y0,bk],[hw,tp,bk],[hw,tp,f],[d0,d1,d1,d0],0,[hw+1,.5,mid]);
   Q(b,[-hw,y0,bk],[hw,y0,bk],[hw,tp,bk],[-hw,tp,bk],[d1,d1,d1,d1],0,[0,.5,bk-1])}   // (frente en z=.34+Z, tapado por las jambas y el arco; colores casi negros: lo que se lee es un hueco)
  for(let i=0;i<7;i++){const x=-.36+i*.12+(hash(sd,i,1)-.5)*.05,top=.55+Math.sqrt(Math.max(.01,.43*.43-x*x))-.02,h=.1+.13*hash(sd,i,2);b.cyl(x,top-h,.2+Z,.0,.03+.015*hash(sd,i,3),h,5,mul(mix(C(P.rock),C(P.rockL),.5),.9),{v:.08})}   // dientes bajo el arco
  G.push(b.geo());
  return {geo:()=>cat(G,['position','normal','color','aEmit'])}},
 // ARBUSTO (≈0,85 × 0,56 × 0,81): una forma por bioma (ver cabecera). Siempre oscuro, el acento (flor/baya/brasa/cristal) es pequeño.
 arbusto(o){const P=PB(o),b=new B(251+(o.bk|0)*11),sd=b.seed;SHRUB[P.shrub](b,P,sd);return b},
 // TOCÓN (≈0,43 × 0,25 × 0,44): raíces en abanico, tronco acampanado con corteza, corte con anillo oscuro, musgo / nieve / carbón según bioma.
 tocon(o){const P=PB(o),b=new B(301+(o.bk|0)*5),sd=b.seed,bark=C(P.bark),cut=C(P.cut);
  for(let i=0;i<4;i++){const a=i/4*Math.PI*2+hash(sd,i,1)*.8,r1=.13,r2=.2+hash(sd,i,2)*.025;b.beam([Math.cos(a)*r1,.09,Math.sin(a)*r1],[Math.cos(a)*r2,.0,Math.sin(a)*r2],.07,mul(bark,.9),{v:.1})}
  b.cyl(0,0,0,.185,.155,.22,7,bark,{seg:2,v:.2,j:.07});
  const top=P.wsnow?mix(cut,C('#a8b2b8'),P.wsnow):P.char?C('#2a2220'):cut;b.cyl(0,.215,0,.158,.158,.03,7,top,{nb:1,v:.08,j:.04});b.cyl(0,.24,0,.095,.095,.012,7,mul(top,.72),{nb:1,j:.05});
  for(let i=0;i<3;i++){const a=hash(sd,i,3)*Math.PI*2;b.beam([Math.cos(a)*.02,.246,Math.sin(a)*.02],[Math.cos(a)*.14,.246,Math.sin(a)*.14],.012,mul(top,.55))}   // grietas radiales
  if(P.char){b.cyl(0,.247,0,.05,.05,.01,6,col('#ff6a22'),{nb:1,em:2})}   // brasa en el corazón del tocón calcinado
  else if(P.moss>.2){lump(b,.09,.1,.14,.09,.06,.07,sd+4,leafPaint({leaf:[P.mossC,P.mossC,P.mossC]},sd,.85),{R:2,S:6,clip:.02,amp:.2})}
  return b},
 // SETAS (≈0,65 × 0,39 × 0,54): corrillo de tres + una pequeña; sombrero facetado con motas, pie pálido. Colores por bioma (Bosque pardo-rojizo, Pantano gris enfermizo…).
 seta(o){const P=PB(o),b=new B(351+(o.bk|0)*3),sd=b.seed,stalk=mix(C('#b9b09a'),C(P.spot),.35),GL=P.glow?C(P.glow):null;
  // Fase 4c · BIOLUMINISCENCIA (Bosque y Pantano): las motas y la setita pequeña llevan aEmit 6 → de día son pálidas, de noche brillan verde-blanco (no ámbar: el ámbar es solo del fuego/ventanas)
  const M=(x,z,h,rc,i,whole)=>{const cap=vary(C(P.cap[i%2]),.12,sd,i);b.cyl(x,0,z,.032*(rc/.15),.04*(rc/.15),h,5,whole?mix(stalk,GL,.5):stalk,{v:.1,j:.05,...(whole?{em:6}:{})});
   lump(b,x,h-.005,z,rc,rc*.72,rc,sd+i,(ny,yn,k)=>whole?[mul(vary(GL,.08,sd,k),.78+.4*yn),6]:mul(vary(cap,.12,sd,k),.62+.5*yn),{R:3,S:7,clip:h-.01,amp:.1});
   if(!whole)for(let k=0;k<(GL?6:4);k++){const a=hash(sd,i*9+k,1)*Math.PI*2,e=.25+hash(sd,i*9+k,2)*.8,rr=rc*Math.cos(e)*.93,w=GL?.042:.036;b.box(x+Math.cos(a)*rr,h-.005+rc*.72*Math.sin(e)*.95,z+Math.sin(a)*rr,w,w*.62,w,C(GL?P.glow:P.spot),{nb:1,...(GL?{em:6}:{})})}};
  M(-.15,.05,.24,.15,0);M(.13,-.1,.27,.17,1);M(.18,.14,.15,.1,2);M(-.02,-.17,.1,.07,3,!!GL);return b},
 // TRONCO caído (≈1,06 × 0,33 × 0,3; `len` px → largo): cilindro tumbado a lo largo de x con muñones de rama, musgo/nieve encima y extremos cortados con anillo.
 tronco(o){const P=PB(o),b=new B(401+(o.bk|0)*3),sd=b.seed,L=Math.max(.5,((o&&o.len)||24)/22.8),bark=C(P.bark);
  logX(b,L,.14,.135,.15,10,bark,C(P.cut),sd,{j:.1,capC:P.wsnow?mix(C(P.cut),C('#a8b2b8'),.5):null,top:P.wsnow?C('#a8b2b8'):P.moss>.15?C(P.mossC):null,topP:P.wsnow?.95:Math.min(.95,P.moss*1.1)});
  [[-.25,1],[.22,-1]].forEach(([x,sg],i)=>b.beam([x*L,.2,sg*.1],[x*L+(i?.06:-.05),.3,sg*.15],.04,mul(bark,.9)));
  return b},
 // HUESOS (≈0,74 × 0,32 × 0,6): costillar medio hundido con espinazo, cráneo con cuencas y un hueso largo suelto.
 huesos(o){const P=PB(o),b=new B(451+(o.bk|0)*3),sd=b.seed,bn=C(P.bone),bd=mul(bn,.78);return(BONES[P.bones]||BONES.ribs)(b,P,sd,bn,bd)},
 // CHARCO (≈1,13 × 0,06 × 0,75): orilla de barro oscuro con borde irregular y agua negra encima; dos piedrecillas.
 charco(o){const P=PB(o),b=new B(501),sd=b.seed,mud=dirty(o.col||'#4a3a28',.55,.5,.25),wat=mix(dirty(o.water||'#6a8a80',.45,.3,.05),col('#1d2b30'),.5),N=14,ctr=[0,-1,0];
  const ring=(rx,rz,y,s)=>Array.from({length:N},(_,k)=>{const a=k/N*Math.PI*2,d=1+(hash(sd+s,k,1)-.5)*.3;return[Math.cos(a)*rx*d,y,Math.sin(a)*rz*d]});
  const O=ring(.58,.38,.012,1),I=ring(.44,.28,.034,2),W=ring(.4,.255,.042,3);
  for(let k=0;k<N;k++){const k2=(k+1)%N;Q(b,O[k],O[k2],I[k2],I[k],[mul(mud,.7),mul(mud,.7),mud,mud],0,ctr)}
  for(let k=0;k<N;k++){const k2=(k+1)%N;b.tri([0,.044,0],W[k2],W[k],mix(wat,col('#9fb4b0'),hash(sd,k,3)*.14),0,ctr)}
  for(let k=0;k<N;k++){const k2=(k+1)%N;Q(b,I[k],I[k2],W[k2],W[k],[mud,mud,mul(mud,.6),mul(mud,.6)],0,ctr)}
  lump(b,.38,0,.2,.07,.05,.06,sd+4,rockPaint(P,sd),{R:2,S:5,clip:0,amp:.2});lump(b,-.4,0,-.12,.06,.04,.05,sd+5,rockPaint(P,sd),{R:2,S:5,clip:0,amp:.2});return b},
 // CARPA (≈1,09 × 1,25 × 0,98): tienda de campaña a dos aguas, lona ensuciada con franja del color de `trim`, entrada oscura al frente (+z), mástil, estacas y cuerdas, suelo pisado.
 carpa(o){const P=PB(o),b=new B(551),sd=b.seed,cv=dirty(o.col||'#8a5a38',.6,.8,.14),tr=dirty(o.trim||'#3a2a22',.5,.8,.1);return(TENT[P.tent]||TENT.a)(b,P,sd,cv,tr)}};

// ───────────────── CARPAS por cultura (Fase 4c) ─────────────────  todas ≈ 1,09 × 1,25 × 0,98 (±22 %), entrada oscura al frente (+z), suelo pisado
const SNOW=col('#a8b2b8'),DK=col('#14110f');
const ground=(b,sd,rx=.6,rz=.52)=>lump(b,0,.0,.04,rx,.012,rz,sd+1,()=>col('#3b2f22'),{R:2,S:8,amp:.1});
const TENT={
 // a dos aguas (Pradera/Volcán): lona ensuciada con franja baja, mástil de cumbrera y, con `tusk`, colmillos cruzados sobre la entrada
 a(b,P,sd,cv,tr){const HW=.5,HD=.44,H=1.02,ctr=[0,.4,0],bn=C(P.bone);
  Q(b,[-HW-.03,0,-HD],[-HW-.03,0,HD],[0,H,HD],[0,H,-HD],[mul(cv,.85),mul(cv,.85),cv,cv],0,[1,.4,0]);Q(b,[HW+.03,0,HD],[HW+.03,0,-HD],[0,H,-HD],[0,H,HD],[mul(cv,.8),mul(cv,.8),mul(cv,1.08),mul(cv,1.08)],0,[-1,.4,0]);
  b.tri([-HW-.03,0,-HD],[0,H,-HD],[HW+.03,0,-HD],mul(cv,.7),0,[0,.4,-1]);b.tri([-HW-.03,0,HD],[HW+.03,0,HD],[0,H,HD],mul(cv,.74),0,[0,.4,1]);b.tri([-.2,0,HD+.004],[.2,0,HD+.004],[0,.62,HD+.004],DK,0,[0,.3,1]);
  b.beam([-.2,0,HD+.012],[0,.64,HD+.012],.04,tr);b.beam([.2,0,HD+.012],[0,.64,HD+.012],.04,tr);
  b.quad([-HW-.03,.0,-HD],[-HW-.03,.0,HD],[-HW+.0,.1,HD],[-HW+.0,.1,-HD],tr,0,[1,.4,0]);b.quad([HW+.03,.0,HD],[HW+.03,.0,-HD],[HW,.1,-HD],[HW,.1,HD],tr,0,[-1,.4,0]);
  b.beam([0,H+.03,-HD-.08],[0,H+.03,HD+.1],.05,PALW);b.beam([0,0,HD+.08],[0,H+.12,HD+.07],.04,PALW);
  for(const sx of [-1,1])for(const z of [-HD+.04,HD-.04]){b.beam([sx*(HW+.03),.08,z],[sx*(HW+.11),0,z*1.2],.012,col('#7a6a4a'));b.beam([sx*(HW+.11),.0,z*1.2],[sx*(HW+.12),.1,z*1.2],.03,PALW)}
  if(P.tusk){[-1,1].forEach(sx=>{cane(b,[sx*.16,H+.02,HD+.14],[-sx*.1,H+.3,HD+.12],.045,bn)});b.box(0,H+.04,HD+.16,.07,.07,.05,mul(bn,.8),{nb:1})}   // colmillos cruzados + cráneo pequeño: campamento orco/infernal
  ground(b,sd);return b},
 // tipi (Bosque/Pantano): cono de 9 lados con franjas alternas, palos que sobresalen por arriba y entrada oscura al frente
 tipi(b,P,sd,cv,tr){const N=9,R=.52,H=1.13,ring=(r,y)=>Array.from({length:N},(_,k)=>{const a=k/N*Math.PI*2+Math.PI/N;return[Math.cos(a)*r,y,Math.sin(a)*r]}),A=ring(R,0),Z=[0,H,0];
  for(let k=0;k<N;k++){const k2=(k+1)%N,am=(k+.5)/N*Math.PI*2,front=Math.sin(am)>.9&&Math.cos(am)<.3&&Math.cos(am)>-.7;const c=front?DK:vary(k%2?cv:mul(cv,.86),.1,sd,k);b.tri(A[k],A[k2],Z,front?DK:[mul(c,.8),mul(c,.8),mul(c,1.08)],0,[0,.4,0])}
  const B2=ring(R*.9,.12);for(let k=0;k<N;k++){const k2=(k+1)%N;Q(b,A[k],A[k2],B2[k2],B2[k],[tr,tr,tr,tr],0,[0,.4,0])}   // franja baja
  for(let i=0;i<5;i++){const a=i/5*Math.PI*2+.4;b.beam([Math.cos(a)*R*.95,0,Math.sin(a)*R*.95],[-Math.cos(a)*.07,H+.2,-Math.sin(a)*.07],.035,PALW)}   // palos cruzados
  b.beam([-.17,.0,R*.78],[0,.6,R*.4],.03,tr);b.beam([.17,.0,R*.78],[0,.6,R*.4],.03,tr);
  ground(b,sd,.6,.58);return b},
 // yurta (Cumbres/Páramo): pared baja, techo cónico (con nieve en Cumbres), banda de adorno, puerta al frente y tubo de humo
 yurt(b,P,sd,cv,tr){const N=10,R=.5,Rw=.46,HW=.46,H=1.1,ring=(r,y)=>Array.from({length:N},(_,k)=>{const a=k/N*Math.PI*2+Math.PI/N;return[Math.cos(a)*r,y,Math.sin(a)*r]}),G=ring(Rw,0),W=ring(Rw,HW),E=ring(R+.06,HW-.02),Z=[0,H,0],sn=P.wsnow?C('#a8b2b8'):null;
  for(let k=0;k<N;k++){const k2=(k+1)%N,am=(k+.5)/N*Math.PI*2,fr=Math.sin(am)>.92;Q(b,G[k],G[k2],W[k2],W[k],fr?[DK,DK,DK,DK]:[mul(cv,.8),mul(cv,.8),mul(cv,.95),mul(cv,.95)],0,[0,.4,0]);
   const roof=vary(cv,.1,sd,k+20),top=sn?mix(roof,sn,.78):mul(roof,1.1);b.tri(E[k],E[k2],Z,[mul(roof,.8),mul(roof,.8),top],0,[0,.2,0])}
  const E2=ring(R+.07,HW-.06);for(let k=0;k<N;k++){const k2=(k+1)%N;Q(b,E[k],E[k2],E2[k2],E2[k],[tr,tr,tr,tr],0,[0,.2,0])}   // banda
  b.beam([-.1,.02,Rw+.01],[-.1,.38,Rw+.01],.035,tr);b.beam([.1,.02,Rw+.01],[.1,.38,Rw+.01],.035,tr);b.beam([-.12,.4,Rw+.01],[.12,.4,Rw+.01],.035,tr);
  b.cyl(.14,.78,-.12,.04,.04,.46,5,col('#2e2824'),{nb:1});   // tubo de humo
  ground(b,sd,.62,.58);return b},
 // pabellón (Oriental): cuatro postes, techo a cuatro aguas con borde de adorno y paños de tela atrás y a los lados; frente abierto
 pav(b,P,sd,cv,tr){const X=.5,Z=.44,EX=.58,EZ=.52,YE=.52,YR=1.08,RX=.24,ctr=[0,.5,0];
  const wall=(p,q,c)=>Q(b,[p[0],0,p[1]],[q[0],0,q[1]],[q[0],YE-.04,q[1]],[p[0],YE-.04,p[1]],[mul(c,.75),mul(c,.75),c,c],0,ctr);
  wall([-X,-Z],[X,-Z],mul(cv,.8));wall([-X,Z],[-X,-Z],cv);wall([X,-Z],[X,Z],cv);
  b.quad([-X+.04,.0,-Z+.02],[X-.04,.0,-Z+.02],[X-.04,.34,-Z+.02],[-X+.04,.34,-Z+.02],mul(DK,1),0,[0,.4,1]);   // sombra del interior
  [[-X,Z],[X,Z],[-X,-Z],[X,-Z]].forEach(([x,z])=>b.beam([x,0,z],[x,YE,z],.05,PALW));
  const L=[-EX,YE,EZ],R2=[EX,YE,EZ],BL=[-EX,YE,-EZ],BR=[EX,YE,-EZ],RL=[-RX,YR,0],RR=[RX,YR,0],c1=mul(cv,1.05),c0=mul(cv,.8);
  Q(b,L,R2,RR,RL,[c0,c0,c1,c1],0,[0,1,.6]);Q(b,BR,BL,RL,RR,[c0,c0,c1,c1],0,[0,1,-.6]);b.tri(BL,L,RL,[c0,c0,c1],0,[-1,1,0]);b.tri(R2,BR,RR,[c0,c0,c1],0,[1,1,0]);
  [[L,R2],[R2,BR],[BR,BL],[BL,L]].forEach(([p,q])=>b.beam([p[0],p[1]-.02,p[2]],[q[0],q[1]-.02,q[2]],.045,tr));   // alero con adorno
  b.beam([-RX,YR+.03,0],[RX,YR+.03,0],.05,tr);ground(b,sd,.62,.56);return b},
 // toldo (Desierto/Costa): lona inclinada sobre dos postes altos delante y estacas atrás, paño trasero y alfombra
 lean(b,P,sd,cv,tr){const X=.5,ZF=.42,ZB=-.42,YF=1.12,YB=.44,ctr=[0,.4,0];
  Q(b,[-X,YF,ZF],[X,YF,ZF],[X,YB,ZB],[-X,YB,ZB],[mul(cv,1.08),mul(cv,1.08),cv,cv],0,[0,1,.5]);
  Q(b,[-X,YF,ZF],[X,YF,ZF],[X,YF-.16,ZF-.07],[-X,YF-.16,ZF-.07],[tr,tr,tr,tr],0,[0,1,.5]);   // franja de borde
  Q(b,[X,YB,ZB],[-X,YB,ZB],[-X,0,ZB],[X,0,ZB],[mul(cv,.7),mul(cv,.7),mul(cv,.55),mul(cv,.55)],0,[0,.3,-1]);   // paño trasero
  b.tri([-X,YF,ZF],[-X,YB,ZB],[-X,0,ZB],mul(cv,.6),0,[-1,.3,0]);b.tri([X,YF,ZF],[X,0,ZB],[X,YB,ZB],mul(cv,.6),0,[1,.3,0]);   // costados
  [-X,X].forEach(x=>{b.beam([x,0,ZF],[x,YF+.06,ZF],.05,PALW);b.beam([x*1.02,0,ZB],[x,YB+.02,ZB],.035,PALW);b.beam([x*1.02,YF,ZF],[x*1.12,0,ZF+.2],.012,col('#7a6a4a'));b.beam([x*1.12,0,ZF+.2],[x*1.12,.1,ZF+.2],.03,PALW)});
  lump(b,0,.0,.16,.42,.014,.3,sd+2,()=>mix(tr,cv,.35),{R:2,S:8,amp:.06});   // alfombra
  ground(b,sd,.56,.5);return b}};

// ───────────────── HUESOS por cultura (Fase 4c) ─────────────────  todos ≈ 0,74 × 0,32 × 0,6 (±22 %)
const skull=(b,x,y,z,s,ang,bn,bd,sd,i)=>{const ca=Math.cos(ang),sa=Math.sin(ang),R=(u,v)=>[x+ca*u-sa*v,z+sa*u+ca*v];   // cráneo mirando a +u girado `ang`
 lump(b,x,y,z,.1*s,.075*s,.085*s,sd+i,(ny,yn,k)=>mul(vary(bn,.08,sd,k),.65+.4*yn),{R:2,S:7,clip:y-.075*s*.7,amp:.12});
 const j=R(.075*s,0);b.box(j[0],y-.05*s,j[1],.09*s,.04*s,.065*s,bd,{nb:1});[-.034,.034].forEach(v=>{const e=R(.092*s,v*s);b.box(e[0],y+.012*s,e[1],.03*s,.034*s,.034*s,col('#17151a'),{nb:1})})};
const rib=(b,x,L,h,side,bn,sd,i,t=.034)=>{let pv=[x,.06,.01*side];for(let s=1;s<=4;s++){const u=s/4;const q=[x+u*.02,.06+h*Math.sin(u*Math.PI*.85),.01*side+side*L*Math.sin(u*Math.PI/2)];b.beam(pv,q,t,vary(bn,.1,sd,i*5+s));pv=q}};
const BONES={
 // costillar de humanoide (Bosque/Pantano/Oriental): espinazo, costillas, cráneo con cuencas y un hueso largo suelto
 ribs(b,P,sd,bn,bd){
  cane(b,[-.32,.05,0],[.14,.06,.02],.046,bn);for(let i=0;i<5;i++){const x=-.28+i*.1;b.box(x,.04,.0,.06,.05,.06,vary(bd,.1,sd,i),{nb:1})}
  for(let i=0;i<5;i++){const x=-.27+i*.1+hash(sd,i,1)*.02,L=.2+hash(sd,i,2)*.06;let pv=[x,.06,.02];for(let s=1;s<=4;s++){const u=s/4,q=[x+u*.02,.06+.22*Math.sin(u*Math.PI*.85)*(1-.1*i/5),.02+.27*Math.sin(u*Math.PI/2)*(L/.24)];b.beam(pv,q,.03,vary(bn,.1,sd,i*5+s));pv=q}}
  for(let i=0;i<3;i++){const x=-.22+i*.12;let pv=[x,.05,-.01];for(let s=1;s<=3;s++){const u=s/3,q=[x,.05+.09*Math.sin(u*Math.PI*.8),-.01-.17*u];b.beam(pv,q,.028,vary(bd,.1,sd,i*3+s));pv=q}}
  lump(b,.3,.065,.03,.1,.075,.085,sd+5,(ny,yn,i)=>mul(vary(bn,.08,sd,i),.65+.4*yn),{R:2,S:7,clip:.005,amp:.12});b.box(.37,.015,.03,.09,.04,.065,bd,{nb:1});[-.03,.035].forEach(z=>b.box(.318,.075,.03+z,.03,.036,.034,col('#17151a'),{nb:1}));
  cane(b,[-.24,.03,.22],[.06,.035,.26],.04,bn);[[-.255,.215],[.075,.265]].forEach(([x,z],i)=>lump(b,x,.04,z,.045,.04,.045,sd+7+i,()=>bn,{R:2,S:5,clip:.0,amp:.1}));return b},
 // montón de cráneos (Pradera orca / Páramo): tres cráneos apilados, huesos largos cruzados y dos colmillos
 pile(b,P,sd,bn,bd){
  cane(b,[-.34,.035,.2],[.3,.05,.12],.045,bn);cane(b,[-.3,.04,.1],[.32,.035,.24],.04,bd);
  skull(b,-.12,.1,.0,1.15,2.5,bn,bd,sd,1);skull(b,.14,.1,-.1,1.1,.5,bn,bd,sd,2);skull(b,.0,.24,-.04,1.0,1.6,bn,bd,sd,3);
  [-1,1].forEach((sg,i)=>{let pv=[.26+sg*.05,.03,.12-sg*.1];for(let s=1;s<=3;s++){const u=s/3,q=[.26+sg*.05+sg*.05*u,.03+.2*Math.sin(u*Math.PI*.55),.12-sg*.1+.12*u];b.beam(pv,q,.05*(1-.25*u),bn);pv=q}});
  [[-.3,.2],[.32,.12]].forEach(([x,z],i)=>lump(b,x,.04,z,.045,.04,.045,sd+7+i,()=>bn,{R:2,S:5,clip:.0,amp:.1}));return b},
 // bestia cornuda (Cumbres/Volcán/Desierto): cráneo grande con cuernos curvos, hocico y media jaula de costillas
 beast(b,P,sd,bn,bd){
  cane(b,[-.36,.045,0],[.0,.05,0],.05,bn);for(let i=0;i<4;i++){const x=-.32+i*.09;rib(b,x,.2-.02*i,.2,1,bn,sd,i,.036);rib(b,x,.2-.02*i,.2,-1,bn,sd,i+9,.036)}
  lump(b,.22,.09,0,.14,.1,.12,sd+4,(ny,yn,i)=>mul(vary(bn,.08,sd,i),.66+.4*yn),{R:2,S:7,clip:.01,amp:.1});lump(b,.38,.05,0,.1,.06,.06,sd+5,(ny,yn,i)=>mul(vary(bd,.08,sd,i),.7+.4*yn),{R:2,S:6,clip:.005,amp:.1});
  [-.05,.05].forEach(z=>b.box(.3,.1,z,.03,.036,.034,col('#17151a'),{nb:1}));
  [-1,1].forEach(sg=>{const P0=[.2,.14,sg*.1],P1=[.2,.22,sg*.22],P2=[.24,.34,sg*.26];cane(b,P0,P1,.06,bn);cane(b,P1,P2,.04,mul(bn,1.08))});return b},
 // costillas de ballena (Costa): tres arcos grandes clavados en la arena y vértebras sueltas
 whale(b,P,sd,bn,bd){
  [[-.27,.3],[-.02,.33],[.22,.27]].forEach(([x,h],i)=>{let pv=[x,.0,-.26];for(let s=1;s<=6;s++){const u=s/6,q=[x+.02*Math.sin(u*Math.PI),h*Math.sin(u*Math.PI*.98)*(1-.04*i),-.26+.52*u];b.beam(pv,q,.05*(1-.2*Math.abs(u-.5)),vary(bn,.08,sd,i*7+s));pv=q}});
  [[.33,.06,.14],[-.33,.05,-.1]].forEach(([x,y,z],i)=>{b.cyl(x,0,z,.085-i*.015,.075-i*.015,.1,7,vary(bd,.08,sd,i),{nb:0,j:.06})});
  cane(b,[-.36,.03,.18],[.2,.035,.24],.04,bd);return b}};
const PALW=col('#3f2f22');
function mul2(f,k){return(ny,yn,i)=>{const c=f(ny,yn,i);return Array.isArray(c)?[mul(c[0],k),c[1]]:mul(c,k)}}

// ───────────────── ARBUSTOS por bioma ─────────────────
const bloom=(b,P,sd,spots,k=.96)=>{for(let i=0;i<P.accN;i++){const s=spots[Math.floor(hash(sd,i,21)*spots.length)],a=hash(sd,i,22)*Math.PI*2,e=.35+hash(sd,i,23)*.95,r=s[3];
  b.box(s[0]+Math.cos(a)*Math.cos(e)*r*k,s[1]+Math.sin(e)*r*.78*k,s[2]+Math.sin(a)*Math.cos(e)*r*k,.045,.035,.045,vary(C(P.acc),.2,sd,i),{nb:1})}};
// montículo de grumos de hoja: `n` lumps pequeños repartidos en una cúpula de radio (rx,rz) y altura h; devuelve los centros para las flores
function mound(b,P,sd,n,rx,rz,h,rl,S=5){const spots=[];for(let i=0;i<n;i++){const a=i*2.399+hash(sd,i,1)*.5,f=i<n*.55?Math.sqrt((i+.5)/(n*.55))*.78:.12+hash(sd,i,2)*.45,x=Math.cos(a)*rx*f,z=Math.sin(a)*rz*f,dome=Math.sqrt(Math.max(0,1-f*f*.9)),y=.05+h*dome*(.55+.45*hash(sd,i,3)),r=rl*(.8+.5*hash(sd,i,4));
  lump(b,x,y,z,r,r*.8,r,sd+i,leafPaint(P,sd+i),{R:2,S,clip:.02,amp:.22});spots.push([x,y,z,r])}return spots}
const SHRUB={
 // brezo/espino (Pradera) y arbusto arcano (Páramo): 4 racimos de láminas «mata» (técnica de los árboles) + flores pequeñas
 bush(b,P,sd){const SP=[[-.17,.22,-.05,.2],[.19,.21,.07,.19],[0,.28,-.2,.17],[.02,.19,.2,.17]];
  b.cards=cardFoliage(P,sd,[[-.17,.2,-.05,.19,9],[.19,.19,.07,.18,9],[0,.27,-.2,.16,8],[.02,.17,.2,.16,8]],palOf(P),.4,{spots:SP,k:.92,kind:'flor',size:.16,lo:.15,hi:.8});
  cane(b,[0,0,0],[-.08,.16,.04],.05,C('#2a2018'));cane(b,[0,0,0],[.1,.14,-.03],.04,C('#2a2018'))},
 // helecho (Bosque): frondas arqueadas que salen del centro
 fern(b,P,sd){const N=8;for(let i=0;i<N;i++){const a=i/N*Math.PI*2+hash(sd,i,1)*.5,len=.34+hash(sd,i,2)*.12,c0=mul(C(P.leaf[i%3]),.8),c1=mul(C(P.leaf[(i+1)%3]),1.25);
   frond(b,[Math.cos(a)*.03,.05,Math.sin(a)*.03],a,len,.95+hash(sd,i,3)*.5,.12,c0,c1,3,.06)}},
 // zarzal (Pantano): cañas espinosas arqueadas, racimos de hoja sueltos en las puntas y bayas oscuras
 bramble(b,P,sd){const bark=C('#352f22'),tips=[];for(let i=0;i<7;i++){const a=i/7*Math.PI*2+hash(sd,i,1)*.5,L=.34+hash(sd,i,2)*.1;let pv=[0,.03,0];
   for(let s=1;s<=3;s++){const u=s/3,r=L*u,q=[Math.cos(a)*r,.03+L*1.1*Math.sin(u*Math.PI*.62)-u*u*.05,Math.sin(a)*r];cane(b,pv,q,.04*(1.1-u*.6),mul(bark,.8+.4*hash(sd,i*5+s,1)));pv=q}tips.push([pv[0],pv[1]+.02,pv[2],.11,5])}
  b.cards=cardFoliage(P,sd,tips,palOf(P),.45,{spots:tips.map(t=>[t[0],t[1]+.01,t[2],t[3]*.8]),k:.6,kind:'baya',size:.15,n:9,lo:.2,hi:.7})},
 // pinos enanos (Cumbres): tres pinos con la receta REAL de los pinos del juego (verticilos de láminas), a escala pequeña
 conifer(b,P,sd){if(!DEP)return;const T=[[-.17,-.04,.2],[.22,.14,.16],[-.02,-.26,.13]],W=[],K=[];
  T.forEach(([x,z,k],i)=>{const t=DEP.treeGeo('pino',sd+i,3);const w=t.wood.clone().scale(k,k,k).translate(x,0,z),c=t.cards.clone().scale(k,k,k).translate(x,0,z);W.push(w);K.push(c)});
  const wood=cat(W,['position','normal']),n=wood.attributes.position.count,bc=C(P.bark),CO=new Float32Array(n*3);for(let i=0;i<n;i++){CO[i*3]=bc.r;CO[i*3+1]=bc.g;CO[i*3+2]=bc.b}
  wood.setAttribute('color',new THREE.BufferAttribute(CO,3));wood.setAttribute('aEmit',new THREE.BufferAttribute(new Float32Array(n),1));b.rawGeo=wood;b.cards={g:cat(K,['position','normal','color','uv']),tex:'rama'}},
 // azalea (Oriental): racimos más redondos y flores carmesí apagadas
 azalea(b,P,sd){const L=[[-.17,.19,-.04,.21,9],[.19,.18,.06,.2,9],[0,.24,-.19,.18,8],[.01,.16,.2,.18,8]];b.cards=cardFoliage(P,sd,L,palOf(P),.4,{spots:L.map(l=>[l[0],l[1]+.02,l[2],l[3]]),k:.95,kind:'flor',size:.14,lo:.15,hi:.8});
  cane(b,[0,0,0],[-.06,.14,.03],.05,C('#2a2018'))},
 // matorral calcinado (Volcán) y salvia seca (Desierto): cañas retorcidas y bifurcadas; el Volcán lleva puntas con brasa, el Desierto racimos secos de láminas
 scrub(b,P,sd){const tips=[];for(let i=0;i<9;i++){const a=i/9*Math.PI*2+hash(sd,i,1)*.6,L=.5+hash(sd,i,2)*.16,tw=(hash(sd,i,3)-.5)*.7;let pv=[0,.0,0],ang=a;
   for(let s=1;s<=3;s++){ang+=tw*.5;const u=s/3,q=[pv[0]+Math.cos(ang)*L*.22,pv[1]+L*.3*(1-.2*u),pv[2]+Math.sin(ang)*L*.22];cane(b,pv,q,.034*(1.1-u*.55),vary(C(P.leaf[i%3]),.15,sd,i*4+s));
     if(s===2){const f=[q[0]+Math.cos(ang+.7)*.12,q[1]+.1,q[2]+Math.sin(ang+.7)*.12];cane(b,q,f,.022,vary(C(P.leaf[(i+1)%3]),.15,sd,i*4+9));tips.push([f[0],f[1],f[2],.05])}pv=q}tips.push([pv[0],pv[1],pv[2],.06])}
  if(P.dry)b.cards=cardFoliage(P,sd,tips.slice(0,6).map(t=>[t[0],t[1]-.03,t[2],.1,5]),palOf(P),.45);
  if(P.ember)for(let i=0;i<P.accN;i++){const t=tips[(i*3+1)%tips.length];b.box(t[0],t[1]+.015,t[2],.045,.04,.045,C(P.acc),{em:2,nb:1})}},
 // mata de dunas (Costa): abanico de briznas largas y arqueadas
 tuft(b,P,sd){const N=11;for(let i=0;i<N;i++){const a=i/N*Math.PI*2+hash(sd,i,1)*.5,len=.3+hash(sd,i,2)*.14,c0=mul(C(P.leaf[i%3]),.8),c1=mul(C(P.leaf[(i+1)%3]),1.25);
   frond(b,[Math.cos(a)*.02,.03,Math.sin(a)*.02],a,len,1.1+hash(sd,i,3)*.5,.06,c0,c1,3,.14)}}};

// ───────────────── API ─────────────────
const GEO=new Map();
export const NAT_NAMES=Object.keys(MODELS);
export const NAT_COUNT=NAT.length;
// natGeo(n,o,th): misma firma y retorno que `darkGeo`/`propGeo` → {g,key}; null si el modelo no es de naturaleza. `o.bk` = bioma de la instancia (lo pone props3d.js).
export function natGeo(n,o,th){if(!MODELS[n])return null;const key='dk:nat:'+n+'|'+JSON.stringify(o||{});if(GEO.has(key))return GEO.get(key);
 const m=MODELS[n](o||{});let g=m.rawGeo||m.geo();if(!g.attributes.position||!g.attributes.position.count){const q=new B(1);q.box(0,0,0,.01,.01,.01,col('#000000'));g=q.geo()}   // un arbusto solo de láminas lleva una cuña mínima de «madera»
 const r={g,key,cards:m.cards||null};GEO.set(key,r);return r}
// variación por INSTANCIA (giro y escala) sin crear mallas nuevas: props3d.js la aplica a la matriz de cada instancia (cero draw calls más). [giro libre, escala mínima, escala máxima, estiramiento vertical ±]
export const NAT_INST={roca:[1,.8,1.3,.18],piedra:[1,.85,1.2,.12],arbusto:[1,.85,1.2,.14],tocon:[1,.85,1.2,.1],seta:[1,.85,1.2,.1],huesos:[1,.9,1.1,0],charco:[1,.85,1.2,0],tronco:[0,.9,1.12,0],carpa:[0,.95,1.05,0]};
// nº de VARIANTES de forma por modelo (Fase 4c): props3d.js inyecta `v` = floor(hash(x,y)·N) junto a `bk`; cada variante es una malla más por sector
export const NAT_VAR={roca:2,piedra:3};
export const NAT_PAL=NAT;
