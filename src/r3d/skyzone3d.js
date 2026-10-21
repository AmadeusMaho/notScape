// ZONA DEL CIELO EN 3D (Lote ISLA-2, 21 oct 2026): lo que hace de la isla una ISLA DIVINA flotando sobre nubes (docs/PLAN_ISLA_CIELO.md, demo docs/style-reference/r3d/isla-cielo.html).
//   · ACANTILADO: una falda de roca de estratos claros que sigue la costa de `coast.js` (contorno por marcha angular sobre `BIOMES.coast.D`) y cae ≈ 9,8 unidades hasta el mar de nubes.
//   · MAR DE NUBES: lámina enorme (textura de nubes procedural, deriva lenta) bajo la isla + anillos de racimos de «puffs» (UN InstancedMesh, color por altura, deriva/respiración) pegados al acantilado.
//   · CASCADAS CELESTIALES: cintas de agua con shader propio (hebras, espuma en el labio, bruma al pie) que caen del borde de la isla hasta las nubes, con un riachuelo que llega desde el estanque.
//   · `weight(x,z)` (0..1) = cuánto «estás en el Cielo» (cámara dentro de la columna de la zona, con fundido): r3d.js lo usa para la hora dorada permanente y el agua cristalina; terrain3d.js baja su plano base.
// Todo determinista (hash, nunca Math.random). Unidades three: x = px/32, z = py/32; el suelo llano de la isla está a y = 0 (h=1 → (1−1)·LVY).
import * as THREE from 'three';
import {hash,TOD,toon,hull,INK} from './materials3d.js';
import {treeGeo,folMat} from './nature3d.js';
import {WU} from './water3d.js';   // los colores del agua cristalina (uCA/uCB) se COMPARTEN con el río: el aliviadero y las caídas son del mismo color   // técnica de vegetación del juego (follaje de láminas con viento)

const ppx=w=>Math.max(2,w*36*ISO.scale());   // cámara ortográfica: tamaño de punto en píxeles = unidades de mundo × px/unidad
const T=32,DROP=9.8,SEA_Y=-9.8,cl=(v,a,b)=>v<a?a:v>b?b:v,sm=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const vn=(x,y,s)=>{const i=Math.floor(x),j=Math.floor(y),u=x-i,v=y-j,a=u*u*(3-2*u),b=v*v*(3-2*v),A=hash(i,j,s),B=hash(i+1,j,s),C=hash(i,j+1,s),D=hash(i+1,j+1,s);return A+(B-A)*a+(C-A)*b+(A-B-C+D)*a*b};
const GRAD=(()=>{const d=new Uint8Array([150,150,150,255,205,205,205,255,236,236,236,255,255,255,255,255]);const t=new THREE.DataTexture(d,4,1,THREE.RGBAFormat);t.needsUpdate=true;t.minFilter=t.magFilter=THREE.NearestFilter;return t})();

// ── cintas de agua (cascadas y riachuelos): hebras que fluyen a lo largo de v (cascada: de arriba abajo; riachuelo: del estanque al labio) ──
const WF_V=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const WF_F=`uniform float uT,uFall;uniform vec3 uA,uB;varying vec2 vUv;
float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1.,0.)),f.x),mix(h2(i+vec2(0.,1.)),h2(i+vec2(1.,1.)),f.x),f.y);}
void main(){float x=vUv.x,y=vUv.y;                       // x 0..1 ancho · y 1 = arriba (cascada) / origen (riachuelo)
 float side=smoothstep(0.,.16,x)*smoothstep(1.,.84,x);
 float sp=uFall>.5?2.6:1.1,fl=uT*sp;
 float s1=n2(vec2(x*9.,y*(uFall>.5?4.:7.)+fl)),s2=n2(vec2(x*21.+3.,y*(uFall>.5?7.:12.)+fl*1.7)),st=smoothstep(.45,.85,s1*.6+s2*.5);
 vec3 c=mix(uA,uB,st);
 float foam=uFall>.5?smoothstep(.93,1.,y)*.7+smoothstep(.12,0.,y)*.5:0.;c=mix(c,vec3(.80,.96,.98),clamp(foam,0.,1.));
 float a=side*(.5+.4*st)*(uFall>.5?smoothstep(0.,.1,y)*(1.-.35*smoothstep(.2,0.,y)):1.);
 a=max(a,foam*side*.9);gl_FragColor=vec4(c,a*.92);\n#include <colorspace_fragment>\n}`;
const wfMat=fall=>new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{uT:{value:0},uFall:{value:fall},uA:{value:new THREE.Color('#12b4dc')},uB:{value:new THREE.Color('#c9f6ff')}},vertexShader:WF_V,fragmentShader:WF_F});

// ── NUBES ESTILO «MAR DE NUBES» (referencia del dueño: Xenoblade Chronicles 2) ──
// Cel shading PINTADO, sin emisivo ni bloom: 3 tonos (luz cálida marfil · medio lila-azulado · sombra azul violeta) con transiciones cortas y rebote rosado en la cara de abajo; los montículos del mar
// se ven por la normal de un campo de ondas (fbm) en coordenadas de MUNDO, hebras de viento estiradas y perspectiva aérea hacia el horizonte dorado. Ningún color pasa de ≈ .93 (no dispara el bloom).
const CU={uT:{value:0},uL:{value:new THREE.Vector3(-.5,.8,-.35)},uCam:{value:new THREE.Vector2()},uHi:{value:new THREE.Color('#eadfd0')},uMid:{value:new THREE.Color('#c4d2ee')},uLo:{value:new THREE.Color('#8798c6')},uBn:{value:new THREE.Color('#dba7b6')},uHor:{value:new THREE.Color('#e9d6c0')},uSea:{value:new THREE.Color('#aab9dc')},uB:{value:new THREE.Vector2(.2,.95)},uM:{value:new THREE.Vector2(-.3,.5)},uHK:{value:.6},uHS:{value:.78},uFB:{value:Array.from({length:8},()=>new THREE.Vector2(1e5,1e5))}};   // uFB = bases de las cascadas (el mar se aplana ahí)   // uB/uM = bordes de las bandas de luz y medio tono; uHK/uHS = fuerza e inicio de la perspectiva aérea (ajustables en vivo: R3D.sky.cu.uB.value.set(…))
const CNZ=`float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1.,0.)),f.x),mix(h2(i+vec2(0.,1.)),h2(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*n2(p);p=p*2.03+vec2(7.1,3.7);a*=.5;}return s;}`;
const CEL=`uniform vec2 uB,uM;uniform float uHK,uHS;vec3 cel(float ndl,float up,float dep){vec3 c=mix(uLo,uMid,smoothstep(uM.x,uM.y,ndl));c=mix(c,uHi,smoothstep(uB.x,uB.y,ndl));
 c=mix(c,uBn,smoothstep(-.35,-.85,ndl)*.55*(1.-dep));   // rebote rosado en la cara de abajo
 c=mix(c,uHi,smoothstep(.5,1.,up)*.18);return c;}`;
const PUFF_V=`uniform float uT;varying vec3 vN;varying vec3 vW;void main(){
 #ifdef USE_INSTANCING
  mat4 im=instanceMatrix;
 #else
  mat4 im=mat4(1.);
 #endif
 mat3 M=mat3(im);vec3 sc=vec3(length(M[0]),length(M[1]),length(M[2]));mat3 R=mat3(M[0]/sc.x,M[1]/sc.y,M[2]/sc.z);vN=normalize(mat3(modelMatrix)*(R*(normal/sc)));
 vec4 w=modelMatrix*im*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`;
const PUFF_F=`uniform vec3 uL,uHi,uMid,uLo,uBn,uHor;uniform vec2 uCam;varying vec3 vN;varying vec3 vW;`+CNZ+CEL+`
void main(){vec3 N=normalize(vN);float ndl=dot(N,normalize(uL));float dep=smoothstep(-2.,-9.,vW.y);vec3 V=normalize(cameraPosition-vW);float ndv=abs(dot(N,V));
 vec3 c=cel(ndl+.12*(n2(vW.xz*.9+vW.y)-.5),N.y,dep);
 c=mix(c,uLo*.92+vec3(.02,.03,.08),dep*.42);                                   // las nubes más bajas se azulan (más lejos de la luz)
 float d=length(vW.xz-uCam)/110.;c=mix(c,uHor,smoothstep(uHS,1.1,d)*uHK);
 c=mix(c,uHi,pow(max(1.-ndv,0.),2.4)*max(ndl,0.)*.3);                                    // luz de borde cálida en el lado del sol
 float er=n2(vW.xz*1.7+vW.y*2.3)*.6+n2(vW.xz*4.3-vW.y*3.1)*.4;                  // BORDES DIFUMINADOS: la silueta se deshace (perfil + erosión por ruido), no corta seca
 float al=pow(max(smoothstep(.02,.62,ndv+(er-.5)*.42),0.),.85);
 if(!(al>=0.)||any(isnan(c)))al=0.;   // un NaN aquí lo extiende el bloom como un parche negro
 gl_FragColor=vec4(clamp(c,0.,1.),al);\n#include <colorspace_fragment>\n}`;
const SEA_V=`uniform float uT;uniform vec2 uFB[8];varying vec3 vN;varying vec3 vW;varying float vH;`+CNZ+`
float H0(vec2 w){vec2 q=w*.04+vec2(uT*.0035,uT*.002);float b=fbm(q)*1.1+.3*fbm(q*3.3+4.);float m=smoothstep(.26,.82,b);return m*m*3.4+.35*n2(w*.33)*m;}
float H(vec2 w){float k=1.;for(int i=0;i<8;i++)k=min(k,smoothstep(2.2,6.5,length(w-uFB[i])));return H0(w)*k;}   // balsa plana en la base de cada cascada
void main(){vec3 p=position;vec2 w=(modelMatrix*vec4(p,1.)).xz;float h=H(w),e=.8,hx=H(w+vec2(e,0.)),hz=H(w+vec2(0.,e));
 vN=normalize(vec3(-(hx-h)/e*3.2,1.,-(hz-h)/e*3.2));vH=h;p.y+=h;vec4 wp=modelMatrix*vec4(p,1.);vW=wp.xyz;gl_Position=projectionMatrix*viewMatrix*wp;}`;
const SEA_F=`uniform float uT;uniform vec3 uL,uHi,uMid,uLo,uBn,uHor,uSea;uniform vec2 uCam;varying vec3 vN;varying vec3 vW;varying float vH;`+CNZ+CEL+`
void main(){vec3 N=normalize(vN);float ndl=dot(N,normalize(uL));float hh=clamp(vH/3.4,0.,1.);
 vec3 c=cel(ndl*1.4,N.y,.0);
 c=mix(uSea,c,smoothstep(.0,.35,hh)*.85+.15);                                  // los valles son más azules y planos
 c=mix(c,uHi,smoothstep(.62,1.,hh)*.28);                                       // las cimas cogen la luz
 float wsp=n2(vec2(vW.x*.05+vW.z*.012+uT*.012,vW.z*.3));c=mix(c,uHi,smoothstep(.6,.88,wsp)*.16*smoothstep(.15,.6,hh));   // hebras de viento estiradas
 float d=length(vW.xz-uCam)/105.;c=mix(c,uHor,smoothstep(uHS-.1,1.1,d)*uHK);
 gl_FragColor=vec4(c,1.);\n#include <colorspace_fragment>\n}`;
const seaMat=()=>new THREE.ShaderMaterial({uniforms:CU,vertexShader:SEA_V,fragmentShader:SEA_F}),puffMat=()=>new THREE.ShaderMaterial({uniforms:CU,vertexShader:PUFF_V,fragmentShader:PUFF_F,transparent:true,depthWrite:false});
const SPILL_F=`uniform float uT;uniform vec3 uCA,uCB;varying vec2 vUv;
float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1.,0.)),f.x),mix(h2(i+vec2(0.,1.)),h2(i+vec2(1.,1.)),f.x),f.y);}
void main(){float x=vUv.x,y=vUv.y;                         // y: 1 = empieza en el río · 0 = labio (se funde con la caída)
 float side=smoothstep(0.,.24,x)*smoothstep(1.,.76,x);float sp=uT*(1.1+1.6*(1.-y));
 float ln=n2(vec2(x*8.,y*10.+sp)),ln2=n2(vec2(x*15.+3.,y*18.+sp*1.5));
 vec3 c=mix(uCA,uCB,smoothstep(.2,.7,ln*.6+(1.-y)*.4));c+=vec3(.5,.9,.92)*(smoothstep(.62,.85,ln)+smoothstep(.64,.86,ln2))*.28;
 c=mix(c,vec3(.82,.98,1.),smoothstep(.55,0.,y)*.35);       // la espuma clara aparece al acelerar hacia el labio
 float a=side*smoothstep(1.,.62,y)*.92;gl_FragColor=vec4(c,a);\n#include <colorspace_fragment>\n}`;
const spillMat=()=>new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{uT:{value:0},uCA:WU.uCA,uCB:WU.uCB},vertexShader:WF_V,fragmentShader:SPILL_F});
const POOL_F=`uniform float uT;varying vec2 vUv;
void main(){vec2 d=vUv-.5;float r=length(d)*2.;if(r>1.)discard;float ph=r*16.-uT*2.6,ring=smoothstep(.55,.95,sin(ph)*.5+.5)*(1.-smoothstep(.15,1.,r));float core=1.-smoothstep(0.,.5,r);
 vec3 c=mix(vec3(.18,.72,.82),vec3(.80,.97,.98),ring*.85+core*.2);float a=(1.-smoothstep(.62,1.,r))*(.42+.4*ring+.3*core);gl_FragColor=vec4(c,a);\n#include <colorspace_fragment>\n}`;
const poolMat=()=>new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uT:{value:0}},vertexShader:WF_V,fragmentShader:POOL_F});
let MISTX=null;const mistTex=()=>{if(MISTX)return MISTX;const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(.45,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);MISTX=new THREE.CanvasTexture(c);return MISTX};
export class SkyZone{
 constructor(scene,W3){this.scene=scene;this.on=false;const Z=typeof BIOMES!=='undefined'&&BIOMES.zone;if(!Z||!BIOMES.coast||!BIOMES.coast.on)return;
  this.Z=Z;this.cx=Z.cx/T;this.cz=Z.cy/T;this.LIP=.85;this.fa=(Z.src||[]).filter(q=>q.fall).map(q=>({a:Math.atan2(q.ty,q.tx),w:Math.max(1.5,Math.min(3,q.rx*.75))}));this.W3=W3;this.t=0;this.grp=new THREE.Group();this.grp.visible=false;scene.add(this.grp);this.pulse=[];
  this.fb=[];this.mistA=[];this.poolM=poolMat();this.spillM=spillMat();this.contour();this.cliff();this.sea();this.puffs();this.falls();this.cu=CU;this.on=true}
 // ── contorno de la costa: radio R[i] a lo largo de N ángulos (marcha desde dentro; D>0 tierra) ──
 contour(){const N=360,R=new Float32Array(N),D=BIOMES.coast.D;for(let i=0;i<N;i++){const a=i/N*6.2832,ca=Math.cos(a),sa=Math.sin(a);let r=6,found=false;for(;r<70;r+=.25){if(D((this.cx+ca*r)*T,(this.cz+sa*r)*T)<=0){found=true;break}}
   if(found){const r0=r-.25,d0=D((this.cx+ca*r0)*T,(this.cz+sa*r0)*T),d1=D((this.cx+ca*r)*T,(this.cz+sa*r)*T);r=r0+.25*d0/Math.max(1e-6,d0-d1)}R[i]=r}
  // suavizado circular (quita dientes de 1 muestra)
  const S=new Float32Array(N);for(let k=0;k<6;k++){for(let i=0;i<N;i++)S[i]=(R[(i+N-1)%N]+2*R[i]+R[(i+1)%N])/4;R.set(S)}
  this.R=R;this.N=N}
 rAt(a){const u=((a%6.2832)+6.2832)%6.2832/6.2832*this.N,i=Math.floor(u)%this.N,f=u-Math.floor(u);return this.R[i]*(1-f)+this.R[(i+1)%this.N]*f}
 pt(a,off,y){const r=this.rAt(a)+off;return[this.cx+Math.cos(a)*r,y,this.cz+Math.sin(a)*r]}
 // ── acantilado de estratos ──
 // 1 justo sobre el cauce de un río (±1,2 tiles) → 0 a 2,4 tiles
 chn(a){let m=0;for(const f of this.fa){const d=Math.abs(((a-f.a+Math.PI)%6.2832+6.2832)%6.2832-Math.PI)*this.rAt(f.a);m=Math.max(m,1-sm(1.2,2.4,d))}return m}
 // 0 junto a una cascada (pared lisa) → 1 lejos de ellas
 calm(a){let m=1;for(const f of this.fa){let d=Math.abs(((a-f.a+Math.PI)%6.2832+6.2832)%6.2832-Math.PI)*this.rAt(f.a);m=Math.min(m,sm(f.w*.6,f.w*.6+3,d))}return m}
 cliff(){const N=this.N,J=9,pos=[],col=[],idx=[],c=new THREE.Color();
  const BAND=['#b9ab8a','#9c8f74','#b3a688','#85807a','#a89b7c','#bdb59f','#8f9bab','#a9bccf','#c4d4e4'];   // oscuros a propósito: con la luz dorada + el óleo se aclaran mucho
  const LIP=this.LIP;   // el labio sale hasta .85 tiles por fuera del contorno: tapa las esquinas/dientes de tile del terreno (que sobresalen hasta ≈ .7)
  for(let i=0;i<N;i++){const a=i/N*6.2832;for(let j=0;j<=J;j++){const t=j/J,ch=this.chn(a),y=-DROP*t-(j===0?.14*ch:0),n=(vn(i*.12,j*.7,5)-.5)*.9*this.calm(a),off=(t<.2?LIP:LIP-.25*sm(.2,.5,t)-1.95*sm(.5,1,t))+n*(.15+.45*t);
    const p=this.pt(a,off,y);pos.push(p[0],p[1],p[2]);
    const b=Math.min(BAND.length-1,Math.floor(t*BAND.length*.95+vn(i*.05,j*.4,7)*1.2));c.set(j===0?'#4b3828':j===1?'#6d5236':BAND[b]);if(j<2&&ch>0)c.lerp(new THREE.Color('#bdb59f'),ch*.85);   // mármol mojado en el cauce
       // labio y primera franja = TIERRA (con raíces), debajo los estratos
    c.offsetHSL(0,(vn(i*.2,j,8)-.5)*.05,(vn(i*.31,j*.6,9)-.5)*.1-(j<2?0:.02*(1-t)));col.push(c.r,c.g,c.b)}}
  for(let i=0;i<N;i++){const i2=(i+1)%N;for(let j=0;j<J;j++){const a=i*(J+1)+j,b=i2*(J+1)+j,d=i*(J+1)+j+1,e=i2*(J+1)+j+1;idx.push(a,b,d,b,e,d)}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();
  this.cliffM=new THREE.Mesh(g,new THREE.MeshToonMaterial({vertexColors:true,gradientMap:GRAD,side:THREE.DoubleSide}));this.cliffM.receiveShadow=true;this.cliffM.frustumCulled=false;this.grp.add(this.cliffM);
  // CAP DE TURBA: anillo plano sobre el borde del terreno (y=+.03): del pasto azul (transparente por dentro, se funde con el suelo) a un borde de hierba y luego TIERRA oscura con piedrecitas; tapa el borde triangular del terreno
  {const K=7,OFF=[-1.5,-.8,-.2,.25,.55,.78,LIP],cap=[],ci=[],cc=new THREE.Color(),COL=['#5fb1e6','#5fb1e6','#69b9e8','#4b92c4','#7a5c3c','#5a4430','#4b3828'],AL=[0,.55,1,1,1,1,1];
   for(let i=0;i<N;i++){const a=i/N*6.2832;for(let k=0;k<K;k++){const nz=(vn(i*.16,k*.9,21)-.5)*.34*(k>=3?1:.3),p=this.pt(a,OFF[k]+nz*(k===K-1?0:1),.03+(k>=4?-.005*k:0));cap.push(p[0],p[1],p[2]);
     const open=k>=3?this.chn(a):0;ci.length;cc.set(COL[k]);cc.offsetHSL(0,0,(vn(i*.3,k*1.7,22)-.5)*(k>=4?.12:.05)+(k>=4&&hash(i,k,23)<.12?.1:0));cap.push&&0;ci.push(cc.r,cc.g,cc.b,AL[k]*(1-open))}}
   const pi=[];for(let i=0;i<N;i++){const i2=(i+1)%N;for(let k=0;k<K-1;k++){const a=i*K+k,b=i2*K+k,d=i*K+k+1,e=i2*K+k+1;pi.push(a,b,d,b,e,d)}}
   const pos3=[],col4=[];for(let q=0;q<N*K;q++){pos3.push(cap[q*3],cap[q*3+1],cap[q*3+2])}
   const g2=new THREE.BufferGeometry();g2.setAttribute('position',new THREE.Float32BufferAttribute(pos3,3));g2.setAttribute('color',new THREE.Float32BufferAttribute(ci,4));g2.setIndex(pi);g2.computeVertexNormals();
   this.capM=new THREE.Mesh(g2,new THREE.MeshToonMaterial({vertexColors:true,transparent:true,gradientMap:GRAD,side:THREE.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));this.capM.renderOrder=1;this.capM.frustumCulled=false;this.grp.add(this.capM)}
  // VEGETACIÓN DEL BORDE con la técnica de los árboles del juego: el sauce bajo «colgante» (tronco + ramas + láminas de hojas con viento, `treeGeo`/`folMat` de nature3d.js), repartido por el labio y colgando hacia fuera; 3 variantes de forma
  {const V=[0,1,2].map(v=>treeGeo('colgante',v*17+3)),NV=V.length,NT=96,cnt=[0,0,0],lst=[[],[],[]];
   for(let k=0;k<NT;k++){const a=hash(k,1,31)*6.2832;if(this.calm(a)<.4)continue;const v=k%NV;lst[v].push({a,off:-.15-hash(k,2,31)*.55,sc:.85+hash(k,5,31)*.8,ry:hash(k,3,31)*6.28})}
   const m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),sc=new THREE.Vector3(),ps=new THREE.Vector3();this.veg=[];
   V.forEach((T2,v)=>{const L=lst[v];if(!L.length)return;const wm=toon(T2.tr,{moss:1,tex:'madera',texS:30,texB:.6}),wood=new THREE.InstancedMesh(T2.wood,wm,L.length),ink=new THREE.InstancedMesh(hull(T2.wood,.016).geometry,INK,L.length),fol=new THREE.InstancedMesh(T2.cards,folMat(T2.tex),L.length);
    L.forEach((o,k)=>{const p=this.pt(o.a,o.off,0);ps.set(p[0],p[1],p[2]);e.set(0,o.ry,0);q.setFromEuler(e);sc.setScalar(o.sc);m.compose(ps,q,sc);wood.setMatrixAt(k,m);ink.setMatrixAt(k,m);fol.setMatrixAt(k,m)});
    wood.castShadow=true;fol.castShadow=true;for(const o of[wood,ink,fol]){o.frustumCulled=false;this.grp.add(o)}this.veg.push(wood,ink,fol)})}
  // ROCAS en la boca de cada río (3–5 por cascada, a ambos lados del cauce): piedra clara con musgo azulado arriba
  {const rg=new THREE.DodecahedronGeometry(1,1),pr=rg.attributes.position,cc=[];for(let i=0;i<pr.count;i++){const x=pr.getX(i),y=pr.getY(i),z=pr.getZ(i),n=1+.22*(vn(x*2+3,z*2,81+y)-.5);pr.setXYZ(i,x*n,y*n*.78,z*n)}rg.computeVertexNormals();
   const NR=(this.fa||[]).length*8,rm=new THREE.InstancedMesh(rg,new THREE.MeshToonMaterial({color:'#ffffff',gradientMap:GRAD}),Math.max(1,NR)),m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),sc=new THREE.Vector3(),ps=new THREE.Vector3(),tc=new THREE.Color();let n=0;
   (this.fa||[]).forEach((f,k)=>{for(let r=0;r<5;r++){const side=r%2?1:-1,u=1.3+hash(k,r,82)*1.1,aoff=side*(f.w*.55+u*.45)/Math.max(10,this.rAt(f.a)),p=this.pt(f.a+aoff,.45+hash(k,r,83)*.35,.05),s2=.45+hash(k,r,84)*.55;ps.set(p[0],p[1],p[2]);e.set(hash(k,r,85)*.4,hash(k,r,86)*6.28,hash(k,r,87)*.4);q.setFromEuler(e);sc.set(s2*1.2,s2,s2);m.compose(ps,q,sc);rm.setMatrixAt(n,m);tc.set(['#a9a597','#c2bdae','#8f8c80','#b4c4bc'][(k+r)%4]);rm.setColorAt(n,tc);n++}});
   rm.count=n;rm.castShadow=true;rm.frustumCulled=false;this.grp.add(rm)}
  // PIEDRECITAS y GUIJARROS sobre la banda de tierra del borde (textura de tierra: no es un degradado liso)
  {const NP=520,pm=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),new THREE.MeshToonMaterial({color:'#ffffff',gradientMap:GRAD}),NP),m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),sc=new THREE.Vector3(),ps=new THREE.Vector3(),tc=new THREE.Color();
   for(let k=0;k<NP;k++){const a=hash(k,1,33)*6.2832,p=this.pt(a,.26+hash(k,2,33)*.58,.05),s2=.04+hash(k,3,33)*hash(k,3,33)*.13;ps.set(p[0],p[1],p[2]);e.set(hash(k,4,33)*6,hash(k,5,33)*6,hash(k,6,33)*6);q.setFromEuler(e);sc.set(s2*1.3,s2*.7,s2);m.compose(ps,q,sc);pm.setMatrixAt(k,m);tc.set(['#8a8174','#a39a8a','#6e655a','#b8ae9a','#5c5248','#7a6a58'][k%6]);pm.setColorAt(k,tc)}
   pm.frustumCulled=false;this.grp.add(pm)}}
 // ── mar de nubes (lámina con textura procedural) ──
 sea(){this.seaStep=260/200;const g=new THREE.PlaneGeometry(260,260,200,200).rotateX(-Math.PI/2);this.seaM=new THREE.Mesh(g,seaMat());this.seaM.position.y=SEA_Y;this.seaM.frustumCulled=false;this.seaM.renderOrder=-5;this.grp.add(this.seaM)}   // malla ondulada (montículos por fbm en coordenadas de mundo)
 // ── anillos de nubes ──
 puffs(){const geo=new THREE.IcosahedronGeometry(1,3),p=geo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=1+.22*(vn(x*1.8+4,y*1.8,60)-.5)*2+.1*(vn(x*4,z*4,61)-.5)*2;p.setXYZ(i,x*n,y*n,z*n)}{const nm=geo.attributes.normal;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),l=Math.hypot(x,y,z)||1;nm.setXYZ(i,x/l,y/l,z/l)}}   // normales de ESFERA (la icosfera es no indexada: computeVertexNormals daba caras planas = aspecto de cristal); así el sombreado cel es suave como un cúmulo
  this.cd=[];const ring=(o0,o1,n,yb,sc,seed)=>{for(let k=0;k<n;k++){const a0=(k/n)*6.2832+hash(k,seed,70)*.4;if(o0<13&&this.calm(a0)<.8)continue;const a=a0,off=o0+(o1-o0)*hash(k,seed,71),X=this.pt(a,off,0),Y=yb+(hash(k,seed,72)-.5)*2.2,np=4+Math.floor(hash(k,seed,73)*5);
    for(let j=0;j<np;j++){const s=sc*(.55+hash(k*9+j,seed,74)*.8);this.cd.push({x:X[0]+(hash(k*9+j,seed,75)-.5)*sc*2.6,y:Y+hash(k*9+j,seed,76)*sc*.7,z:X[2]+(hash(k*9+j,seed,77)-.5)*sc*2.6,sx:s*1.35,sy:s*.62,sz:s,ph:hash(k,j,78)*6.28,sp:.03+hash(k,j,79)*.05})}}};
  ring(.8,5,26,-3.6,1.9,1);ring(5,13,34,-5.4,2.7,2);ring(13,30,52,-7.4,3.7,3);ring(30,66,84,-9.2,5.2,4);ring(2,9,40,-3.0,.9,5);
  const NC=this.cd.length;this.puffMat=puffMat();this.pm=new THREE.InstancedMesh(geo,this.puffMat,NC);
  this.pm.frustumCulled=false;this.grp.add(this.pm);this.dm=new THREE.Object3D();this.pmT=0}
 sortPuffs(cam){const f=new THREE.Vector3();cam.getWorldDirection(f);const cp=cam.position,k=this.cd.map((c,i)=>[(c.x-cp.x)*f.x+(c.y-cp.y)*f.y+(c.z-cp.z)*f.z,i]);k.sort((a,b)=>b[0]-a[0]);this.ord=k.map(q=>q[1])}   // lejos → cerca (transparencia sin parpadeos)
 updPuffs(t){const d=this.dm,cd=this.cd,m=this.pm,o=this.ord;for(let ii=0;ii<cd.length;ii++){const i=o?ii:ii,c=cd[o?o[ii]:ii];d.position.set(c.x+Math.sin(t*c.sp+c.ph)*.8,c.y+Math.sin(t*c.sp*1.7+c.ph)*.25,c.z+Math.cos(t*c.sp+c.ph)*.8);d.scale.set(c.sx,c.sy,c.sz);d.rotation.y=c.ph;d.updateMatrix();m.setMatrixAt(ii,d.matrix)}m.instanceMatrix.needsUpdate=true}
 // ── cascadas: [ángulo (rad, 0 = este, +90° = sur), ancho en tiles, longitud del riachuelo en tiles] ──
 falls(){this.mats=[wfMat(1),wfMat(0)];this.pulse=this.pulse||[];const SRC=(this.Z.src||[]).filter(q=>q.fall);this.nfalls=SRC.length;this.mouth=[];
  SRC.forEach((q,k)=>{const a=Math.atan2(q.ty,q.tx),w=cl(q.rx*.75,1.5,3.0),nx=Math.cos(a),nz=Math.sin(a),tx=-nz,tz=nx,rs0=Math.hypot(q.tx,q.ty)+Math.hypot(q.rx*Math.cos(a),q.ry*Math.sin(a))*.8,wobAt=r=>Math.sin(((r-rs0)/.85)*.8+q.i)*.5,rm=this.rAt(a),wm=wobAt(rm),pp=this.pt(a,this.LIP-.1,0),p0=[pp[0]+tx*wm,pp[1],pp[2]+tz*wm],mx=this.pt(a,-.2,0);   // wm = desvío lateral REAL del cauce en la boca (el mismo meandro que sky-biome.js): la caída parte del centro del río
   // ALIVIADERO: lámina de agua cristalina (mismos colores que el río) que nace transparente SOBRE el río, sigue su meandro y cruza el labio hasta fundirse con la caída (sin suelo ni escalón entre ambos)
   {const g=new THREE.BufferGeometry(),pos=[],uv=[],idx=[],NS=14,ra=rm-2.6,rb=rm+this.LIP+.05,wc=1.15;for(let j=0;j<=NS;j++){const t=j/NS,r=ra+(rb-ra)*t,wb=wobAt(Math.min(r,rm)),cx2=this.cx+nx*r+tx*wb,cz2=this.cz+nz*r+tz*wb;for(const s2 of[-1,1]){pos.push(cx2+tx*s2*wc,-.145,cz2+tz*s2*wc);uv.push((s2+1)/2,1-t)}}
    for(let j=0;j<NS;j++){const a0=j*2;idx.push(a0,a0+1,a0+2,a0+1,a0+3,a0+2)}g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);
    const m=new THREE.Mesh(g,this.spillM);m.frustumCulled=false;m.renderOrder=2;this.grp.add(m)}
this.mouth.push({x:mx[0],z:mx[2],t:hash(k,1,90)*2});
   // CAÍDA EN DOS SALTOS: el río sale de la boca, cae a la repisa de roca (y≈−3,5), se abre en bruma y vuelve a caer hasta las nubes. Hebras: la principal y dos finas a los lados. Cada tramo es una parábola (x lineal, y cuadrática).
   const YL=-DROP*.36-.15,jump=(sh,ws,y0,y1,o0,o1,gr,ordr)=>{const g=new THREE.BufferGeometry(),pos=[],uv=[],idx=[],SG=12;
    for(let j=0;j<=SG;j++){const t=j/SG,y=y0-(y0-y1)*t*t,o=o0+(o1-o0)*t,ww=w*ws*.5*(1.08+gr*t),sh2=sh*w*.5*(1+.3*t);for(const s2 of[-.5,.5]){pos.push(p0[0]+nx*o+tx*(sh2+s2*ww*2),y,p0[2]+nz*o+tz*(sh2+s2*ww*2));uv.push(s2+.5,1-t)}}
    for(let j=0;j<SG;j++){const a0=j*2;idx.push(a0,a0+1,a0+2,a0+1,a0+3,a0+2)}g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);
    const m=new THREE.Mesh(g,this.mats[0]);m.frustumCulled=false;m.renderOrder=ordr;this.grp.add(m)};
   [[0,.78,0],[-.62,.3,.2],[.66,.26,.3]].forEach(([so,ws,dy])=>jump(so,ws,-.12-dy,-DROP-.1,.05,2.9,.9,3));   // UNA caída continua (sin repisa ni rocas debajo: el agua se pierde en las nubes)
   // POZA DE IMPACTO donde aterriza el 2.º salto (anillos de espuma turquesa que se expanden) + puntos de vapor (base y repisa)
   {const bp=this.pt(a,this.LIP+3.0,SEA_Y+.1),rd=w*1.7,pm=new THREE.Mesh(new THREE.PlaneGeometry(2*rd,2*rd).rotateX(-Math.PI/2),this.poolM);pm.position.set(bp[0],bp[1],bp[2]);pm.renderOrder=3;pm.frustumCulled=false;this.grp.add(pm);
    this.fb.push(new THREE.Vector2(bp[0],bp[2]));this.mistA.push({x:bp[0],y:SEA_Y+.2,z:bp[2],r:w*.9,n:30,h:3.6});}})
  this.fb.forEach((v,i)=>{if(i<8)CU.uFB.value[i].copy(v)});this.buildMist()}
 // VAPOR de cascada: sprites suaves (turquesa muy pálido, NUNCA blanco puro) que nacen en la poza/repisa, suben, crecen y se desvanecen
 buildMist(){const A=this.mistA,N=A.reduce((q,o)=>q+o.n,0);this.mN=N;this.mp=new Float32Array(N*3);this.mc=new Float32Array(N*4);this.mi=[];let i=0;A.forEach((o,ai)=>{for(let k=0;k<o.n;k++){this.mi.push({o,ph:hash(ai,k,60),a:hash(ai,k,61)*6.28,rr:Math.sqrt(hash(ai,k,62))});i++}});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(this.mp,3));g.setAttribute('color',new THREE.BufferAttribute(this.mc,4));this.mist=new THREE.Points(g,new THREE.PointsMaterial({size:12,sizeAttenuation:false,map:mistTex(),vertexColors:true,transparent:true,depthWrite:false}));this.mist.frustumCulled=false;this.mist.renderOrder=5;this.grp.add(this.mist)}
 updMist(t){const mi=this.mi,P=this.mp,C=this.mc;for(let i=0;i<this.mN;i++){const q=mi[i],o=q.o,u=((t*.16+q.ph)%1+1)%1,s=Math.sin(u*Math.PI);P[i*3]=o.x+Math.cos(q.a+u*1.4)*o.r*(.3+.9*q.rr*u);P[i*3+1]=o.y+u*o.h;P[i*3+2]=o.z+Math.sin(q.a+u*1.4)*o.r*(.3+.9*q.rr*u);C[i*4]=.78;C[i*4+1]=.92;C[i*4+2]=.95;C[i*4+3]=.36*s}
  this.mist.material.size=ppx(1.5+1.4*Math.sin(t*.3));const g=this.mist.geometry;g.attributes.position.needsUpdate=true;g.attributes.color.needsUpdate=true}
 // peso 0..1 de «estar en el Cielo» (x,z en tiles three): 1 dentro de la columna de la zona (con 12 tiles de fundido por el oeste)
 weight(x,z){if(!this.on)return 0;const x0=this.Z.x0/T;return sm(x0+10,x0+60,x)}   // el fundido va por el MAR que separa el continente de la isla (la costa del continente queda fuera)
 // ISLA-7 «Escapa»: tiñe nubes y mar de nubes hacia el fuego (k 0..1); guarda los colores base la primera vez
 tint(k){if(!this.b0){this.b0={};this.F={uHi:'#ffb27a',uMid:'#d96a40',uLo:'#6a2630',uBn:'#ff5a2a',uHor:'#ff8a3a',uSea:'#b5442c'};for(const n in this.F)this.b0[n]=CU[n].value.clone()}
  if(k<.002&&!this.tt)return;this.tt=k>.002;const c=new THREE.Color();for(const n in this.F)CU[n].value.copy(this.b0[n]).lerp(c.set(this.F[n]),Math.min(1,k))}
 update(t,dt,tgt,cam,water){if(!this.on)return;const w=this.weight(tgt.x,tgt.z);this.w=w;const vis=w>.001;this.grp.visible=vis;if(!vis)return;this.t=t;
  const st=this.seaStep;this.seaM.position.x=Math.round(tgt.x/st)*st;this.seaM.position.z=Math.round(tgt.z/st)*st;   // se mueve en pasos de 1 celda de la malla: el relieve (fijo en el MUNDO) no «nada»
  CU.uT.value=t;CU.uCam.value.set(tgt.x,tgt.z);{const sp=TOD.dia&&TOD.dia.sunP;if(sp)CU.uL.value.set(sp[0],sp[1],sp[2]).normalize()}   // el relieve de nubes queda fijo en el MUNDO y deriva despacio
  this.poolM.uniforms.uT.value=t;this.spillM.uniforms.uT.value=t;if(this.mist)this.updMist(t);this.mats[0].uniforms.uT.value=t;this.mats[1].uniforms.uT.value=t;if(cam&&(this.pmT%24===0||!this.ord))this.sortPuffs(cam);if((this.pmT++&1)===0)this.updPuffs(t);
  if(water&&water.on&&this.mouth)for(const m of this.mouth){if(Math.hypot(m.x-tgt.x,m.z-tgt.z)>26)continue;m.t-=dt;if(m.t<=0){m.t=.5+.5*hash(Math.floor(t),m.x,91);try{water.pulse(m.x,m.z,'tug',.5)}catch(e){}}}   // gotas y ondas del agua real al caer por el labio
  for(const p of this.pulse){const s=p.b*(1+.18*Math.sin(t*1.3+p.ph));p.m.scale.set(s,.8+.15*Math.sin(t*.9+p.ph),s)}}
 dispose(){if(!this.on)return;this.scene.remove(this.grp)}
}
