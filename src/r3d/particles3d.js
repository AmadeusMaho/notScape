// NotScape · R3D · F3e · PARTÍCULAS Y CLIMA EN 3D (sustituyen en ?r3d=1 a lo que AMBI dibujaba en el canvas 2D: luciérnagas, hojas, pétalos, nieve, brasas, ceniza, lluvia).
// COSTE: 3 draw calls en total (flotantes = 1 Points, lluvia = 1 LineSegments, chapoteos = 1 Points) y CERO trabajo de CPU por partícula: todo el movimiento se calcula en el
// vertex shader a partir de un «semilla» fija por partícula (aS) y del tiempo, y el volumen se ENVUELVE alrededor del héroe (mod), así hay densidad constante sin crear ni borrar nada.
// Las partículas viven en la escena principal: reciben el bloom (luciérnagas y brasas brillan de verdad) y el grado óleo; se ocultan tras casas y árboles por profundidad.
// La RECETA por bioma está en BIOME_W (pesos 0–1 por tipo): un bioma nuevo = una fila. Los pesos se suavizan (~1,5 s) al cruzar fronteras y de día/noche.
// Las mariposas y la niebla/sombras de nubes siguen en 2D (AMBI 'bf', 'fog', 'ground'): son pocas y no merecen un pase.
import * as THREE from 'three';
import {G} from './materials3d.js';

// tipos: 0 luciérnaga · 1 polvo/polen · 2 hoja · 3 pétalo · 4 nieve · 5 brasa · 6 ceniza
const NK=[90,70,50,50,170,70,60];                               // partículas por tipo (máximo; el peso decide cuántas se ven)
const BIOME_W=[
 /*0 Pradera */{ff:.55,dust:.55,leaf:.14,pet:0,sn:0,em:0,as:0,leafA:'#8ac85a',leafB:'#d8d84a'},
 /*1 Bosque  */{ff:.8,dust:.35,leaf:.7,pet:0,sn:0,em:0,as:0,leafA:'#d8802a',leafB:'#8ac85a'},
 /*2 Pantano */{ff:.8,dust:.2,leaf:0,pet:0,sn:0,em:0,as:0,leafA:'#8ac85a',leafB:'#b6dc6a'},
 /*3 Cumbres */{ff:0,dust:0,leaf:0,pet:0,sn:1,em:0,as:0,leafA:'#fff',leafB:'#fff'},
 /*4 Oriental*/{ff:.45,dust:.3,leaf:0,pet:.8,sn:0,em:0,as:0,leafA:'#ffc2d6',leafB:'#ff9ec0'},
 /*5 Volcán  */{ff:0,dust:0,leaf:0,pet:0,sn:0,em:1,as:1,leafA:'#9a8a8a',leafB:'#6a5a5a'}];
const KEYS=['ff','dust','leaf','pet','sn','em','as'];

const COMMON=`
 float hh(float x){return fract(sin(x*127.1+3.7)*43758.5453);}
 vec2 wrapXZ(vec2 q,vec2 c,float S,out float edge){vec2 r=q-c;r=mod(r+S*.5,S)-S*.5;edge=1.-smoothstep(.40,.5,max(abs(r.x),abs(r.y))/S);return c+r;}`;

function pointsMat(){return new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.CustomBlending,blendEquation:THREE.AddEquation,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor,
 uniforms:{uT:G.uTime,uNight:G.uNight,uPx:{value:3},uSZ:{value:34},uC:{value:new THREE.Vector3()},uW:{value:new Float32Array(7)},uWind:{value:new THREE.Vector2(.5,.25)},uLA:{value:new THREE.Color('#8ac85a')},uLB:{value:new THREE.Color('#d8d84a')}},
 vertexShader:`attribute vec4 aS;attribute float aK;uniform float uT,uNight,uPx,uSZ;uniform vec3 uC;uniform float uW[7];uniform vec2 uWind;uniform vec3 uLA,uLB;varying vec4 vC;varying float vK;varying float vRot;${COMMON}
  void main(){int k=int(aK+.5);float w=uW[k];vC=vec4(0.);vK=aK;vRot=0.;gl_PointSize=0.;gl_Position=vec4(9.,9.,9.,1.);if(aS.w>=w)return;
   float t=uT,edge=1.;vec2 b=aS.xy*uSZ;vec3 p=vec3(0.);float a=1.,sz=3.;vec3 col=vec3(1.);float day=1.-uNight*.8;
   if(k==0){vec2 q=b+vec2(sin(t*.45+aS.z*40.),cos(t*.38+aS.x*40.))*1.5+uWind*t*.05;p.xz=wrapXZ(q,uC.xz,uSZ,edge);p.y=.35+aS.z*1.3+sin(t*.9+aS.y*30.)*.2;
    float bl=.5+.5*sin(t*2.6+aS.y*60.);a=bl*bl*1.5;sz=9.;col=mix(vec3(1.,.82,.3),vec3(.75,1.,.35),aS.x);}
   else if(k==1){vec2 q=b+uWind*t*.25+vec2(sin(t*.3+aS.z*20.),cos(t*.27+aS.x*20.))*.8;p.xz=wrapXZ(q,uC.xz,uSZ,edge);p.y=.2+aS.z*2.4;a=(.25+.2*sin(t*1.7+aS.y*50.))*day;sz=2.6;col=vec3(1.,.93,.7);}
   else if(k==2||k==3){float L=k==2?6.5+aS.z*4.:9.+aS.z*5.,ph=fract(t/L+aS.x*7.3);vec2 q=b+uWind*t*(k==2?.35:.28)+vec2(sin(t*1.3+aS.z*40.),cos(t*1.1+aS.y*40.))*.5*(1.-ph*.3);p.xz=wrapXZ(q,uC.xz,uSZ,edge);
    p.y=3.6*(1.-ph);a=smoothstep(0.,.08,ph)*smoothstep(1.,.9,ph)*day;sz=k==2?5.5:4.;col=mix(uLA,uLB,aS.y);vRot=aS.z*6.28+t*(1.5+aS.x*2.);}
   else if(k==4){float L=8.+aS.z*5.,ph=fract(t/L+aS.x*9.1);vec2 q=b+vec2(uWind.x*.6+sin(t*.5+aS.z*30.)*.4,uWind.y*.3)*t*.5+vec2(sin(t*.9+aS.y*50.),cos(t*.7+aS.x*50.))*.35;p.xz=wrapXZ(q,uC.xz,uSZ,edge);
    p.y=8.*(1.-ph);a=smoothstep(0.,.05,ph)*(.7+.3*aS.y)*day;sz=2.4+aS.z*2.4;col=vec3(.93,.96,1.);}
   else if(k==5){float L=2.4+aS.z*3.,ph=fract(t/L+aS.x*5.);vec2 q=b+vec2(sin(t*1.6+aS.y*50.),cos(t*1.3+aS.z*50.))*.45*ph;p.xz=wrapXZ(q,uC.xz,uSZ,edge);p.y=ph*5.;
    a=(1.-ph)*(.7+.5*sin(t*14.+aS.y*80.)*.5)*1.6;sz=3.4;col=mix(vec3(1.,.55,.15),vec3(1.,.82,.35),aS.y);}
   else{float L=9.+aS.z*6.,ph=fract(t/L+aS.x*6.);vec2 q=b+vec2(uWind.x*.8,uWind.y*.5)*t*.4+vec2(sin(t*.6+aS.y*30.),cos(t*.5+aS.z*30.))*.5;p.xz=wrapXZ(q,uC.xz,uSZ,edge);p.y=5.*(1.-ph);a=smoothstep(0.,.05,ph)*.6*day;sz=2.6;col=mix(vec3(.6,.55,.55),vec3(.42,.36,.36),aS.y);}
   col=pow(col,vec3(2.2));vC=vec4(col,a*edge);gl_Position=projectionMatrix*viewMatrix*vec4(p.x,uC.y+p.y,p.z,1.);gl_PointSize=sz*uPx*(.8+aS.w*.4/max(w,.01));}`,
 fragmentShader:`varying vec4 vC;varying float vK;varying float vRot;
  void main(){if(vC.a<=.004)discard;vec2 c=gl_PointCoord-.5;float r=length(c);int k=int(vK+.5);
   if(k==0||k==5){float g=exp(-r*r*22.)+exp(-r*r*140.)*1.2;gl_FragColor=vec4(vC.rgb*g*vC.a*(k==0?2.2:2.6),0.);}                       // brillo aditivo (alfa 0): el bloom lo recoge
   else if(k==2||k==3){float s=sin(vRot),co=cos(vRot);vec2 q=vec2(co*c.x-s*c.y,s*c.x+co*c.y);float e=length(q/vec2(.46,k==2?.2:.26));float m=smoothstep(1.,.8,e)*vC.a;if(m<.01)discard;gl_FragColor=vec4(vC.rgb*m,m);}
   else{float m=smoothstep(.5,.28,r)*vC.a;if(m<.01)discard;gl_FragColor=vec4(vC.rgb*m,m*(k==1?.0:1.));}}`})}

function rainMat(){return new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.CustomBlending,blendEquation:THREE.AddEquation,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor,
 uniforms:{uT:G.uTime,uNight:G.uNight,uSZ:{value:34},uC:{value:new THREE.Vector3()},uAmt:{value:0},uWind:{value:new THREE.Vector2(-.9,-.35)},uCol:{value:new THREE.Color('#9cc4f0')}},
 vertexShader:`attribute vec4 aS;attribute float aE;uniform float uT,uNight,uSZ,uAmt;uniform vec3 uC;uniform vec2 uWind;varying float vA;${COMMON}
  void main(){vA=0.;gl_Position=vec4(9.,9.,9.,1.);if(aS.w>=uAmt)return;float H=7.5,sp=17.+aS.y*7.,ph=fract(uT*sp/H+aS.z*9.7),edge;vec2 q=wrapXZ(aS.xy*uSZ,uC.xz,uSZ,edge);
   vec3 d=normalize(vec3(.25*uWind.x,-1.,.25*uWind.y)),head=vec3(q.x,H*(1.-ph),q.y);head.xz+=uWind*(H*(1.-ph))*-.25;     // la gota viene inclinada por el viento
   vec3 pos=head-d*(aE*.9);
   if(pos.y<0.)pos.y=0.;vA=(1.-aE*.85)*edge*(.8+.35*aS.x)*(1.-uNight*.35);gl_Position=projectionMatrix*viewMatrix*vec4(pos.x,uC.y+pos.y,pos.z,1.);}`,
 fragmentShader:`uniform vec3 uCol;varying float vA;void main(){if(vA<.01)discard;vec3 c=pow(uCol,vec3(2.2));gl_FragColor=vec4(c*vA,vA);}`})}

function splashMat(){return new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.CustomBlending,blendEquation:THREE.AddEquation,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor,
 uniforms:{uT:G.uTime,uPx:{value:3},uSZ:{value:34},uC:{value:new THREE.Vector3()},uAmt:{value:0}},
 vertexShader:`attribute vec4 aS;uniform float uT,uPx,uSZ,uAmt;uniform vec3 uC;varying float vA;varying float vPh;${COMMON}
  void main(){vA=0.;vPh=0.;gl_PointSize=0.;gl_Position=vec4(9.,9.,9.,1.);if(aS.w>=uAmt*.8)return;float ph=fract(uT/.55+aS.z*13.),edge;vec2 q=wrapXZ(aS.xy*uSZ,uC.xz,uSZ,edge);
   vA=(1.-ph)*edge*.7;vPh=ph;gl_Position=projectionMatrix*viewMatrix*vec4(q.x,uC.y+.02,q.y,1.);gl_PointSize=(3.+ph*16.)*uPx;}`,
 fragmentShader:`varying float vA;varying float vPh;void main(){if(vA<.01)discard;vec2 c=gl_PointCoord-.5;c.y*=1.7;float r=length(c)*2.,ring=smoothstep(.12,0.,abs(r-(.35+vPh*.6)))*vA;if(ring<.02)discard;vec3 col=pow(vec3(.87,.94,1.),vec3(2.2));gl_FragColor=vec4(col*ring,ring);}`})}

const rnd=(n,seed)=>{const a=new Float32Array(n*4);let s=seed;for(let i=0;i<a.length;i++){s=(s*1664525+1013904223)>>>0;a[i]=s/4294967296}return a};   // determinista (nada de Math.random en el mundo)

export class Particles{
 constructor(scene){this.scene=scene;this.grp=new THREE.Group();this.grp.name='particulas3d';this.grp.frustumCulled=false;scene.add(this.grp);
  // flotantes: un solo Points con todos los tipos
  const total=NK.reduce((a,b)=>a+b,0),S=rnd(total,7),K=new Float32Array(total);let o=0;NK.forEach((n,k)=>{for(let i=0;i<n;i++){K[o+i]=k;S[(o+i)*4+3]=(i+.5)/n}o+=n});   // aS.w = rango dentro de su tipo → el peso (0..1) decide cuántos se ven
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(total*3),3));g.setAttribute('aS',new THREE.BufferAttribute(S,4));g.setAttribute('aK',new THREE.BufferAttribute(K,1));
  this.fm=pointsMat();this.fl=new THREE.Points(g,this.fm);this.fl.frustumCulled=false;this.fl.renderOrder=5;this.grp.add(this.fl);
  // lluvia: segmentos (2 vértices por gota) y chapoteos
  const R=1300,RS=rnd(R*2,11),RE=new Float32Array(R*2),RP=new Float32Array(R*2*3);for(let i=0;i<R;i++){for(let e=0;e<2;e++){const j=i*2+e;RE[j]=e;RS[j*4]=RS[i*8];RS[j*4+1]=RS[i*8+1];RS[j*4+2]=RS[i*8+2];RS[j*4+3]=(i+.5)/R}}
  const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.BufferAttribute(RP,3));rg.setAttribute('aS',new THREE.BufferAttribute(RS,4));rg.setAttribute('aE',new THREE.BufferAttribute(RE,1));
  this.rm=rainMat();this.rain=new THREE.LineSegments(rg,this.rm);this.rain.frustumCulled=false;this.rain.renderOrder=6;this.grp.add(this.rain);
  const SP=260,SS=rnd(SP,23);for(let i=0;i<SP;i++)SS[i*4+3]=(i+.5)/SP;const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(SP*3),3));sg.setAttribute('aS',new THREE.BufferAttribute(SS,4));
  this.sm=splashMat();this.spl=new THREE.Points(sg,this.sm);this.spl.frustumCulled=false;this.spl.renderOrder=6;this.grp.add(this.spl);
  this.w=new Float32Array(7);this.rainAmt=0;this.k=0;this.on=true}
 snap(){this.hard=true}   // salta al estado objetivo sin suavizar (teletransporte, capturas de prueba)
 // t: tiempo (s) · dt · (cx,gy,cz): héroe (unidades three, gy = suelo bajo él) · k: bioma · night 0–1 · wet: 0 seco, .18 lluvia, .36 tormenta (WXD) · px: píxeles por «punto» (escala×dpr) · size: lado del volumen en tiles · ql: calidad
 update(dt,cx,gy,cz,k,night,wet,px,size,ql){const q=[1,1,.7,.4,0][ql==null?2:ql],B=BIOME_W[k]||BIOME_W[0],kd=1-Math.min(1,wet*3.5),tgt=[B.ff*night*kd,B.dust*(1-night)*kd,B.leaf*kd,B.pet*kd,B.sn,B.em,B.as];
  const f=this.hard?1:1-Math.exp(-dt*1.4);this.hard=false;for(let i=0;i<7;i++)this.w[i]+=(tgt[i]*q-this.w[i])*f;
  if(k!==this.k){this.k=k;this.fm.uniforms.uLA.value.set(B.leafA);this.fm.uniforms.uLB.value.set(B.leafB)}
  const rt=Math.min(1,wet/.36),ra=(wet>.01?(.35+.65*rt):0)*q;this.rainAmt+=(ra-this.rainAmt)*f;
  const u=this.fm.uniforms;u.uPx.value=px;u.uSZ.value=size;u.uC.value.set(cx,gy,cz);u.uW.value=this.w;
  const r=this.rm.uniforms;r.uSZ.value=size;r.uC.value.set(cx,gy,cz);r.uAmt.value=this.rainAmt;
  const s=this.sm.uniforms;s.uPx.value=px;s.uSZ.value=size;s.uC.value.set(cx,gy,cz);s.uAmt.value=this.rainAmt;
  this.rain.visible=this.spl.visible=this.rainAmt>.01;this.fl.visible=this.w.some(v=>v>.01)}
}
