// NotScape · R3D · EFECTOS DE IMPACTO de los encantamientos (lote ENCANT-IMPACTO, 28 oct 2026; el dueño pidió rehacerlos tras el VFX de la hoja).
// `Impact` vive en la escena PRINCIPAL (r3d.js lo crea, `R3D.impact`) y dibuja TODO con UN `THREE.Points` (≤ 260 partículas, 1 llamada) cuya forma la pinta el fragment shader según el TIPO:
//   0 ascua · 1 chispa en estrella · 2 ANILLO EN EL SUELO (elipse 2:1 = círculo visto a 30°) · 3 anillo de pantalla (estallido / implosión) · 4 esquirla de hielo (rombo orientado)
//   5 gota (materia: sangre, veneno) · 6 bocanada luminosa · 7 humo oscuro (materia) · 8 COLUMNA DE LUZ · 9 RAYO desde el cielo (zigzag con semilla) · 10 retícula de caza · 11 círculo de runas en el suelo.
// Cada partícula se simula en la CPU en coordenadas de MUNDO (posición, velocidad, gravedad, rozamiento, tamaño inicial→final, color caliente→frío, alfa) y se escribe premultiplicada
// (`ONE, ONE_MINUS_SRC_ALPHA`: lo luminoso con alfa 0 suma, lo material tapa). El tamaño de punto se mide en `onBeforeRender` (píxeles por unidad de la cámara ortográfica).
// API (la llama src/enchant.js): `burst(m, efecto, k)` al aplicarse el encantamiento (k = potencia ENCH.vk) · `touch(m, efecto, k)` chispa pequeña en CADA golpe con arma encantada
// · `drain(m)` motas de vida que vuelan del enemigo al héroe (Vampírica). Receta de cada efecto: tabla `RECIPE` (un efecto nuevo = una función ahí). Guía: docs/GUIA_VFX_ENCANTAMIENTOS.md §10.
import * as THREE from 'three';
const V3=THREE.Vector3,TAU=Math.PI*2;
const VS=`attribute vec3 aCol;attribute vec4 aP;varying vec3 vC;varying vec4 vP;uniform float uPpu;
void main(){vC=aCol;vP=aP;gl_PointSize=max(1.,aP.x*uPpu);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
// aP = (tamaño en mundo, alfa, tipo, aux) · aux: grosor del anillo / ángulo de la esquirla / semilla del rayo / giro de las runas
const FS=`varying vec3 vC;varying vec4 vP;
float h1(float n){return fract(sin(n*127.1)*43758.5453);}
void main(){vec2 p=gl_PointCoord-.5;p.y=-p.y;float d=length(p),a=0.;vec3 c=vC;bool op=false;int ty=int(vP.z+.5);float ax=vP.w;
 if(ty==0){a=exp(-d*d*40.)+exp(-d*d*200.)*.8;c=mix(vC,vec3(1.,.95,.85),exp(-d*d*220.));}
 else if(ty==1){vec2 q=abs(p)*2.;a=max(exp(-q.x*5.-q.y*40.),exp(-q.y*5.-q.x*40.))+exp(-dot(q,q)*16.);c=mix(vC,vec3(1.),exp(-dot(q,q)*30.));}
 else if(ty==2){float e=length(vec2(p.x,p.y*2.));a=exp(-pow((e-.42)/max(ax,.01),2.))*step(abs(p.y),.25);}
 else if(ty==3){a=exp(-pow((d-.42)/max(ax,.01),2.));}
 else if(ty==4){float cs=cos(ax),sn=sin(ax);vec2 q=vec2(cs*p.x-sn*p.y,sn*p.x+cs*p.y);float k=abs(q.x)*3.2+abs(q.y)*1.1;a=1.-smoothstep(.42,.5,k);c=mix(vC,vec3(1.),smoothstep(.3,0.,abs(q.x)*3.2)*.7);}
 else if(ty==5){float k=.55+ax*.9,cy=-.12,rb=.24-ax*.05;float yy=p.y-cy;float w=yy<0.?sqrt(max(0.,rb*rb-yy*yy)):rb*max(0.,1.-yy/(k*.5));   /* GOTA: lágrima que se estira al caer (aux = rapidez) */
  a=1.-smoothstep(w-.04,w,abs(p.x));a*=step(-rb-.02,yy);float sh=clamp(1.-length(vec2(p.x,yy))/(rb+.1),0.,1.);c=vC*(.5+.5*sh)+vec3(1.)*exp(-pow(length(p-vec2(-.07,cy+.06))/.06,2.))*.65;op=true;}
 else if(ty==6){a=exp(-d*d*9.)*.5;}
 else if(ty==7){a=(1.-smoothstep(.15,.5,d))*.6;op=true;}
 else if(ty==8){float x=abs(p.x);a=(exp(-x*x*140.)*.8+exp(-x*x*22.)*.25)*smoothstep(.5,.25,abs(p.y))*(1.-smoothstep(.3,.48,abs(p.x)));c=mix(vC,vec3(1.,.98,.9),exp(-x*x*300.));}
 else if(ty==9){float y=p.y+.5,o=0.,f=1.;for(int i=0;i<4;i++){float yy=y*(5.+f*5.),fi=floor(yy);o+=(mix(h1(fi+ax+f),h1(fi+1.+ax+f),fract(yy))-.5)*.2/f;f*=2.;}float dd=abs(p.x-o*smoothstep(0.,.15,1.-y));a=(exp(-dd/.012)+exp(-dd/.04)*.3)*(1.-smoothstep(.3,.48,abs(p.x)))*smoothstep(0.,.08,y)*smoothstep(1.,.85,y);c=mix(vC,vec3(1.),exp(-dd/.008));}   /* se apaga antes del borde del sprite */
 else if(ty==10){float r1=exp(-pow((d-.36)/.025,2.)),tk=0.;vec2 q=abs(p);tk=step(q.y,.03)*step(.2,q.x)*step(q.x,.48)+step(q.x,.03)*step(.2,q.y)*step(q.y,.48);a=r1+tk;}
 else if(ty==12){float y=p.y+.5,w=.26*pow(max(0.,1.-y),.8)*smoothstep(0.,.18,y)*(1.+.25*sin(y*14.+ax*7.));float sx=p.x+sin(y*9.+ax*5.)*.06*y;a=1.-smoothstep(w*.7,w,abs(sx));c=mix(vC,vec3(1.,.95,.8),(1.-smoothstep(0.,w*.8,abs(sx)))*(1.-y)*.9);}   /* LENGUA DE LLAMA (sube y ondula) */
 else if(ty==13){a=exp(-pow((d-.36)/.035,2.))*.9+exp(-pow(length(p-vec2(-.13,.13))/.07,2.))*.8;}   /* BURBUJA */
 else if(ty==14){float cs=cos(ax),sn=sin(ax);vec2 q=vec2(cs*p.x-sn*p.y,sn*p.x+cs*p.y);float rr=length(q-vec2(0.,-.3)),ang=atan(q.x,q.y+.3);float th=.05*(1.-smoothstep(.3,.9,abs(ang)));a=exp(-pow((rr-.55)/max(th,.004),2.))*step(abs(ang),.95);c=mix(vC,vec3(1.),.6);}   /* TAJO en media luna */
 else if(ty==15){vec2 g=(p+.5)*3.;float best=9.;for(int i=0;i<4;i++){float fi=float(i);vec2 A=floor(vec2(h1(ax+fi*3.1),h1(ax+fi*7.7))*3.)+.5,B=floor(vec2(h1(ax+fi*5.3),h1(ax+fi*2.9))*3.)+.5;vec2 pa=g-A,ba=B-A;float t2=clamp(dot(pa,ba)/max(dot(ba,ba),.001),0.,1.);best=min(best,length(pa-ba*t2));}a=exp(-best/.07)*step(d,.48)+exp(-best/.25)*.25;}   /* GLIFO RÚNICO (trazos con semilla) */
 else if(ty==16){vec2 q=vec2(p.x,p.y*2.);float e=length(q),an=atan(q.y,q.x),cr=0.;for(int i=0;i<7;i++){float fi=float(i),a0=fi*.8976+h1(ax+fi)*.5,wob=sin(e*22.+fi*3.)*.12;float dd=abs(sin(an-a0-wob*e))*e;cr+=exp(-dd/.012)*step(e,.2+.28*h1(ax+fi*2.))*smoothstep(.02,.08,e);}a=min(1.,cr)*step(abs(p.y),.25);op=true;c=vC;}   /* GRIETAS EN EL SUELO (materia oscura) */
 else {float e=length(vec2(p.x,p.y*2.));float an=atan(p.y*2.,p.x)+ax;a=(exp(-pow((e-.42)/.02,2.))+exp(-pow((e-.32)/.012,2.))*.7+step(.82,fract(an*1.9))*exp(-pow((e-.37)/.03,2.)))*step(abs(p.y),.25);}
 a*=vP.y;if(a<.003)discard;vec3 pc=c*a;gl_FragColor=op?vec4(pc,a):vec4(pc,0.);
 #include <colorspace_fragment>
}`;
const T={ember:0,star:1,gring:2,ring:3,shard:4,drop:5,puff:6,smoke:7,beam:8,bolt:9,reticle:10,rune:11,flame:12,bubble:13,slash:14,glyph:15,crack:16};
const C=h=>new THREE.Color(h),rnd=(a,b)=>a+Math.random()*(b-a),_v=new V3(),_w=new V3(),_c=new THREE.Color(),_vp=new THREE.Vector4();
export class Impact{
 constructor(scene,W3,refs,nMax){const N=this.N=nMax||260;this.am=new Float32Array(N).fill(1);this.W3=W3;this.refs=refs||{};this.B=this.refs.body||null;this.k=0;this.ts=1;
  this.pos=new Float32Array(N*3);this.vel=new Float32Array(N*3);this.col=new Float32Array(N*3);this.c0=new Float32Array(N*3);this.c1=new Float32Array(N*3);this.p=new Float32Array(N*4);
  this.age=new Float32Array(N).fill(9);this.life=new Float32Array(N).fill(1);this.s0=new Float32Array(N);this.s1=new Float32Array(N);this.g=new Float32Array(N);this.dr=new Float32Array(N);this.ty=new Uint8Array(N);this.fd=new Uint8Array(N);this.fl=new Float32Array(N).fill(-1e9);this.ns=new Uint8Array(N);this._fl=-1e9;this.cr=new V3(1,0,0);this.tg=new Array(N).fill(null);
  const g=new THREE.BufferGeometry(),dy=(a,n)=>new THREE.BufferAttribute(a,n).setUsage(THREE.DynamicDrawUsage);g.setAttribute('position',dy(this.pos,3));g.setAttribute('aCol',dy(this.col,3));g.setAttribute('aP',dy(this.p,4));g.boundingSphere=new THREE.Sphere(new V3(),1e6);
  this.u={uPpu:{value:60}};const m=new THREE.ShaderMaterial({uniforms:this.u,vertexShader:VS,fragmentShader:FS,transparent:true,depthWrite:false,depthTest:false,blending:THREE.CustomBlending,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor,blendSrcAlpha:THREE.OneFactor,blendDstAlpha:THREE.OneMinusSrcAlphaFactor});
  this.obj=new THREE.Points(g,m);this.obj.renderOrder=40;this.obj.visible=false;this.obj.matrixAutoUpdate=false;this.live=0;
  this.obj.onBeforeRender=(r,s,cam)=>{r.getCurrentViewport(_vp);this.u.uPpu.value=_vp.w*cam.projectionMatrix.elements[5]*.5;const e=cam.matrixWorld.elements;this.cr.set(e[0],0,e[2]).normalize()};   /* cr = derecha de la cámara (horizontal): las gotas nacen a los LADOS de la silueta */
  scene.add(this.obj)}
 // centro, base (pies) y radio/altura del enemigo, como blood3d.js
 where(m){if(this.B)return this.B.where(m);const A=this.refs.actors&&this.refs.actors.map.get(m);const base=A?A.grp.position.clone():this.W3(m.x,m.y,typeof TER!=='undefined'?TER.standZ(m.x,m.y):1);
  const rad=A?Math.min(1.3,Math.max(.22,(A.tpl.rad||.4)*(A.sc||1))):.35,h=A?Math.min(3.5,Math.max(.5,(A.tpl.h||1)*(A.sc||1))):.9;return{base,c:new V3(base.x,base.y+h*.55,base.z),rad,h}}
 // nace una partícula · o = {life, s0, s1, g (gravedad, + = cae), dr (rozamiento/s), c0, c1 (hex), a (aux), fd (1 = se encoge el alfa al final; 2 = brilla y se apaga rápido)}
 add(ty,p,v,o){const N=this.N,i=this.k=(this.k+1)%N,j=i*3;this.pos[j]=p.x;this.pos[j+1]=p.y;this.pos[j+2]=p.z;this.vel[j]=v?v.x:0;this.vel[j+1]=v?v.y:0;this.vel[j+2]=v?v.z:0;
  this.am[i]=o.al||1;this.age[i]=0;this.life[i]=o.life||.6;this.s0[i]=o.s0||.1;this.s1[i]=o.s1!=null?o.s1:this.s0[i];this.g[i]=o.g||0;this.dr[i]=o.dr||0;this.ty[i]=ty;this.fd[i]=o.fd||1;this.fl[i]=o.fl!=null?o.fl:(ty===T.drop?this._fl:-1e9);this.ns[i]=o.ns?1:0;this.tg[i]=o.tg||null;
  _c.set(o.c0||'#ffffff');this.c0[j]=_c.r;this.c0[j+1]=_c.g;this.c0[j+2]=_c.b;_c.set(o.c1||o.c0||'#ffffff');this.c1[j]=_c.r;this.c1[j+1]=_c.g;this.c1[j+2]=_c.b;this.p[i*4+3]=o.a||0;this.obj.visible=true;return i}
 // n partículas en abanico esférico desde `p` con rapidez [a,b] (`up` sesga hacia arriba)
 spray(n,ty,p,sp,up,o){for(let q=0;q<n;q++){const th=Math.random()*TAU,ph=Math.acos(rnd(-1,1)),s=rnd(sp[0],sp[1]);_v.set(Math.sin(ph)*Math.cos(th)*s,Math.cos(ph)*s*.6+up*s,Math.sin(ph)*Math.sin(th)*s);
  const oo=Object.assign({},o);if(o.s0r)oo.s0=rnd(o.s0r[0],o.s0r[1]);if(ty===T.shard)oo.a=Math.atan2(_v.y,_v.x);
  if(o.out){const l=Math.hypot(_v.x,_v.z)||1;this.add(ty,_w.set(p.x+_v.x/l*o.out,p.y,p.z+_v.z/l*o.out),_v,oo)}else this.add(ty,p,_v,oo)}}
 burst(m,e,k){if(!m)return;const R=RECIPE[e];if(!R)return;try{const W=this.where(m);this._fl=W.base.y+.02;R(this,W,Math.max(.6,k||1),m)}catch(x){console.warn('[IMPACT]',e,x)}}
 // REACCIÓN entre estados (nombre de `REACT`): e = quien reacciona, ts = enemigos a los que salta (arcos)
 react(n,e,ts){if(!e)return;const R=REACT[n];if(!R)return;try{const W=this.where(e);this._fl=W.base.y+.02;R(this,W,e,ts)}catch(x){console.warn('[IMPACT react]',n,x)}}
 // en CADA golpe con arma encantada: 3–5 chispas del color (barato; la receta grande sale solo cuando el encantamiento se aplica)
 touch(m,e,k){const W=this.where(m);this._fl=W.base.y+.02;const c=TOUCH[e]||['#ffffff','#ffffff'];this.spray(Math.round(3+2*(k||1)),T.ember,W.c,[.8,1.8],.3,{life:.35,s0r:[.05,.09],s1:.01,g:2,dr:2,c0:c[1],c1:c[0]})}
 // VAMPÍRICA: motas que vuelan del enemigo al héroe
 drain(m){const W=this.where(m),hp=this.refs.hero&&this.refs.hero.obj?this.refs.hero.obj.position:null;for(let q=0;q<6;q++){_v.set(rnd(-.6,.6),rnd(.4,1.2),rnd(-.6,.6));const i=this.add(T.ember,W.c,_v,{life:.7,s0:.09,s1:.04,dr:1.5,c0:'#ff5a6a',c1:'#7a0010'});this.tg[i]=hp}}
 update(dt){const N=this.N;if(!this.obj.visible)return;dt*=this.ts;let live=0;   /* ts: escala de tiempo (solo PRUEBAS: R3D.impact.ts=0 congela para capturar) */
  for(let i=0;i<N;i++){const j=i*3;let a=this.age[i];if(a>=this.life[i]){this.p[i*4]=0;this.p[i*4+1]=0;continue}a+=dt;this.age[i]=a;live++;const u=Math.min(1,a/this.life[i]);
   const t=this.tg[i];if(t){const sx=t.x-this.pos[j],sy=t.y+.55-this.pos[j+1],sz=t.z-this.pos[j+2],w=Math.min(1,dt*6*u);this.vel[j]+=sx*w*8;this.vel[j+1]+=sy*w*8;this.vel[j+2]+=sz*w*8}   // atraída al héroe (drenaje)
   const dr=Math.exp(-this.dr[i]*dt);this.vel[j]*=dr;this.vel[j+2]*=dr;this.vel[j+1]=this.vel[j+1]*dr-this.g[i]*dt;
   this.pos[j]+=this.vel[j]*dt;this.pos[j+1]+=this.vel[j+1]*dt;this.pos[j+2]+=this.vel[j+2]*dt;
   const ty=this.ty[i];
   if(this.pos[j+1]<this.fl[i]){this.age[i]=this.life[i];this.p[i*4+1]=0;   /* llega al SUELO: desaparece y (si es una gota grande) salpica en 2–3 gotitas */
    if(ty===T.drop&&!this.ns[i]){_w.set(this.pos[j],this.fl[i]+.01,this.pos[j+2]);_c.setRGB(this.c0[j],this.c0[j+1],this.c0[j+2]);const hx='#'+_c.getHexString(),n=2+(Math.random()<.5?1:0);
     for(let q=0;q<n;q++){const an=Math.random()*TAU,sp=rnd(.5,1.1);this.add(T.drop,_w,_v.set(Math.cos(an)*sp,rnd(.8,1.4),Math.sin(an)*sp),{life:.3,s0:this.s0[i]*.38,s1:this.s0[i]*.25,g:9,dr:.5,c0:hx,c1:hx,fl:this.fl[i],ns:1})}}continue}
   if(ty===T.drop)this.p[i*4+3]=Math.min(1,Math.abs(this.vel[j+1])/5);let al=this.fd[i]===2?(u<.15?u/.15:Math.pow(1-u,1.5)):(u<.08?u/.08:1-Math.pow(u,2.2));if(ty===T.smoke||ty===T.puff)al=Math.sin(Math.PI*u);
   const kc=Math.min(1,u*1.4);this.col[j]=this.c0[j]+(this.c1[j]-this.c0[j])*kc;this.col[j+1]=this.c0[j+1]+(this.c1[j+1]-this.c0[j+1])*kc;this.col[j+2]=this.c0[j+2]+(this.c1[j+2]-this.c0[j+2])*kc;
   this.p[i*4]=this.s0[i]+(this.s1[i]-this.s0[i])*(ty===T.ring||ty===T.gring?1-Math.pow(1-u,2.5):u);this.p[i*4+1]=Math.max(0,al)*this.am[i];this.p[i*4+2]=ty;
   if(ty===T.rune)this.p[i*4+3]+=dt*1.5;if(ty===T.flame)this.p[i*4+3]+=dt}
  const A=this.obj.geometry.attributes;A.position.needsUpdate=A.aCol.needsUpdate=A.aP.needsUpdate=true;if(!live)this.obj.visible=false;this.live=live}
}
// chispa de cada golpe: [color frío, color caliente]
const TOUCH={fuego:['#ff4a08','#ffe080'],escarcha:['#4aa8ff','#e8f8ff'],sangre:['#8a0008','#ff5040'],veneno:['#3a9a12','#c8ff6a'],fisico:['#d8c8a0','#ffffff'],rayo:['#ffd23a','#ffffff'],vacio:['#6a2ac0','#ffa8f4'],
 vampirica:['#6a0010','#ff4a5a'],sagrada:['#ffb020','#fffbe0'],cazadora:['#3a9a20','#e8ffb0'],arcana:['#3a5aff','#e0e8ff'],aplastante:['#c87a3a','#fff0d0']};
['infernal:fuego','glacial:escarcha','toxica:veneno','hemorragica:sangre','tempestad:rayo','abisal:vacio','implacable:fisico'].forEach(s=>{const[a,b]=s.split(':');TOUCH[a]=TOUCH[b]});
// RECETAS de cada encantamiento (I = Impact, W = {base, c centro, rad, h}, k = potencia por nivel; las superiores llaman a su base con k mayor y añaden su detalle)
const up=(v,y)=>{const o=v.clone();o.y+=y;return o},rot=()=>Math.random()*TAU;
// RECETAS (lote ENCANT-VFX-CUERPO, 28 oct 2026): la parte grande la pinta la FUNDA del cuerpo (bodyfx3d.js, `I.B` = R3D.body) con el lenguaje de las armas; aquí solo quedan
// las partículas que la acompañan (ascuas, esquirlas, gotas, glifos…). Sin anillos expansivos (descartados por el dueño); la retícula de la Cazadora sí le gustó.
const sh=(I,m,kind,k)=>{if(I.B)I.B.shot(m,kind,k)};
const RECIPE={
 fuego:(I,W,k,m)=>{sh(I,m,'fuego',k);I.spray(Math.round(9*k),T.ember,W.c,[.8,2],.8,{life:.9,s0r:[.05,.09],s1:.015,g:-1.2,dr:1.6,c0:'#fff0a0',c1:'#ff3a00'})},
 escarcha:(I,W,k,m)=>{sh(I,m,'hielo',k);sh(I,m,'flashHielo',k);I.spray(Math.round(7*k),T.shard,W.c,[1.2,2.6],.25,{life:.5,s0r:[.09,.14],s1:.04,g:4,dr:1,c0:'#ffffff',c1:'#7ac8ff'})},
 sangre:(I,W,k,m)=>{sh(I,m,'sangre',k);I.spray(Math.round(12*k),T.drop,W.c,[1.2,2.8],.55,{out:W.rad,life:.8,s0r:[.05,.09],s1:.035,g:9,dr:.5,c0:'#a00818',c1:'#4a0006'})},
 veneno:(I,W,k,m)=>{sh(I,m,'veneno',k);I.spray(Math.round(8*k),T.drop,W.c,[.8,1.8],.6,{out:W.rad,life:.8,s0r:[.05,.09],s1:.035,g:8,dr:.6,c0:'#7ae02a',c1:'#2a7a0a'})},
 fisico:(I,W,k,m)=>{sh(I,m,'flash',k);const a=rot();I.add(T.slash,W.c,null,{life:.26,s0:W.h*.85*k,s1:W.h*1.05*k,a,c0:'#ffffff',c1:'#e8d0a0',fd:2});
  I.spray(Math.round(5*k),T.star,W.c,[1,2.2],.2,{life:.3,s0r:[.06,.11],s1:.02,dr:3,c0:'#ffffff',c1:'#e8d0a0',fd:2})},
 rayo:(I,W,k,m)=>{sh(I,m,'rayo',k);sh(I,m,'flashRayo',k);I.add(T.bolt,up(W.c,1.8),null,{life:.2,s0:4.2,s1:4.2,a:Math.random()*99,c0:'#ffffff',c1:'#ffe060',fd:2});
  I.spray(Math.round(8*k),T.star,W.c,[1.4,3],.3,{life:.28,s0r:[.05,.09],s1:.02,g:3,dr:2,c0:'#ffffff',c1:'#ffd23a',fd:2})},
 vacio:(I,W,k,m)=>{sh(I,m,'vacio',k);for(let q=0;q<Math.round(9*k);q++){const a=rot(),rr=W.rad*rnd(1.4,2.2);const i=I.add(T.ember,new V3(W.c.x+Math.cos(a)*rr,W.c.y+rnd(-.3,.4),W.c.z+Math.sin(a)*rr),new V3(-Math.sin(a)*2,0,Math.cos(a)*2),{life:.6,s0:.09,s1:.03,dr:1,c0:'#ffa8f4',c1:'#6a2ac0'});I.tg[i]=W.c.clone().setY(W.c.y-.55)}},   /* motas en espiral hacia el enemigo */
 vampirica:(I,W,k,m)=>{sh(I,m,'sangre',k*.8);I.spray(Math.round(5*k),T.drop,W.c,[.8,1.6],.4,{out:W.rad,life:.5,s0r:[.05,.08],s1:.03,g:6,dr:1,c0:'#c0102a',c1:'#5a0010'});I.drain(m)},
 sagrada:(I,W,k,m)=>{sh(I,m,'pilar',k);I.spray(Math.round(8*k),T.star,W.c,[.5,1.4],.7,{life:.8,s0r:[.07,.12],s1:.02,g:-.5,dr:2,c0:'#ffffff',c1:'#ffd060',fd:2})},
 cazadora:(I,W,k)=>{I.add(T.reticle,up(W.c,W.h*.25),null,{life:1.3,s0:W.rad*2.4,s1:W.rad*1.6,c0:'#eaffb8',c1:'#5ac03a'});I.spray(Math.round(5*k),T.ember,W.c,[.4,1],.4,{life:.6,s0r:[.05,.08],s1:.01,dr:2,c0:'#eaffb8',c1:'#4ac030'})},
 arcana:(I,W,k,m)=>{sh(I,m,'arcana',k);const n=Math.round(3+2*k);for(let q=0;q<n;q++){const a=q/n*TAU;I.add(T.glyph,new V3(W.c.x+Math.cos(a)*W.rad*1.3,W.c.y+rnd(-.1,.3),W.c.z+Math.sin(a)*W.rad*1.3),new V3(0,.35,0),{life:1,s0:.22,s1:.3,a:rnd(0,99),c0:'#e4ecff',c1:'#5a78ff',fd:2})}},   /* glifos que flotan alrededor */
 aplastante:(I,W,k,m)=>{sh(I,m,'flash',k);I.add(T.crack,up(W.base,.02),null,{life:1.6,s0:W.rad*4*k,s1:W.rad*4*k,a:rnd(0,9),c0:'#2a1a10',c1:'#2a1a10'});   /* GRIETAS en el suelo */
  I.spray(Math.round(6*k),T.shard,up(W.base,.1),[1.2,2.2],1,{life:.7,s0r:[.08,.13],s1:.06,g:7,dr:.5,c0:'#a08060',c1:'#5a4030'});I.spray(Math.round(5*k),T.smoke,W.base,[.5,1.2],.3,{life:.9,s0r:[.25,.45],s1:.6,g:-.2,dr:2.5,c0:'#8a7058',c1:'#5a4838'})}};
// superiores: su propio destello (más rojo, más grande) + el detalle de la base
RECIPE.infernal=(I,W,k,m)=>{sh(I,m,'infernal',k);I.spray(Math.round(14*k),T.ember,W.c,[1,2.6],.9,{life:1,s0r:[.06,.1],s1:.015,g:-1.4,dr:1.4,c0:'#fff4c0',c1:'#d01000'});I.spray(4,T.smoke,up(W.c,W.h*.4),[.2,.5],.9,{life:1.2,s0r:[.3,.45],s1:.8,g:-.5,dr:2,c0:'#2a1410',c1:'#0e0806'})};
RECIPE.glacial=(I,W,k,m)=>{RECIPE.escarcha(I,W,k*1.4,m)};
RECIPE.toxica=(I,W,k,m)=>{sh(I,m,'toxica',k);I.spray(Math.round(10*k),T.drop,W.c,[.8,2],.6,{out:W.rad,life:.8,s0r:[.06,.1],s1:.035,g:8,dr:.6,c0:'#8aff3a',c1:'#1a6a0a'})};
RECIPE.hemorragica=(I,W,k,m)=>{RECIPE.sangre(I,W,k*1.5,m);I.spray(6,T.drop,up(W.c,.3),[2,3.4],.8,{out:W.rad,life:.9,s0r:[.09,.14],s1:.05,g:9,dr:.4,c0:'#ff1a10',c1:'#5a0004'})};
RECIPE.tempestad=(I,W,k,m)=>{RECIPE.rayo(I,W,k*1.3,m);for(let q=0;q<2;q++){const t=W.c.clone();t.x+=rnd(-.8,.8);t.z+=rnd(-.8,.8);t.y+=1.8;I.add(T.bolt,t,null,{life:.2,s0:3.6,s1:3.6,a:Math.random()*99,c0:'#ffffff',c1:'#fff07a',fd:2})}};
RECIPE.abisal=(I,W,k,m)=>{RECIPE.vacio(I,W,k*1.5,m);I.spray(5,T.smoke,W.base,[.3,.7],.2,{life:1.3,s0r:[.5,.7],s1:1,g:-.3,dr:2,c0:'#1a0628',c1:'#0a0212'})};
RECIPE.implacable=(I,W,k,m)=>{RECIPE.fisico(I,W,k*1.4,m);I.add(T.slash,W.c,null,{life:.32,s0:W.h*1.05,s1:W.h*1.25,a:rot(),c0:'#ffffff',c1:'#ffffff',fd:2})};
// REACCIONES entre estados (status.js `react`/`inM`/`onKill`/`thaw`/`tick` las piden con R3D.impact.react(nombre, e, objetivos)). `ts` = enemigos a los que salta (arcos).
const REACT={
 apagado:(I,W,m)=>{sh(I,m,'vapor',.7);sh(I,m,'humo',1);I.spray(6,T.ember,W.c,[.4,1],.5,{life:.5,s0r:[.04,.07],s1:.01,g:1,dr:2,c0:'#ffb060',c1:'#401000'})},   /* el fuego se ahoga: vaho, humo gris y ascuas que caen */
 electrocutado:(I,W,m,ts)=>{sh(I,m,'rayo',2);sh(I,m,'flashRayo',1.6);I.add(T.bolt,up(W.c,1.8),null,{life:.24,s0:4.4,s1:4.4,a:Math.random()*99,c0:'#ffffff',c1:'#ffe060',fd:2});I.add(T.bolt,up(W.c,1.7),null,{life:.2,s0:3.8,s1:3.8,a:Math.random()*99,c0:'#ffffff',c1:'#bfe8ff',fd:2});
  I.spray(12,T.drop,W.c,[1,2.2],.6,{out:W.rad,life:.6,s0r:[.04,.07],s1:.03,g:7,dr:.6,c0:'#dff2ff',c1:'#4a90e0'});I.spray(10,T.star,W.c,[1.6,3.2],.3,{life:.3,s0r:[.05,.09],s1:.02,g:3,dr:2,c0:'#ffffff',c1:'#ffd23a',fd:2});(ts||[]).forEach(o=>I.B&&I.B.arc(m,o,'arcoRayo'))},
 cadena:(I,W,m,ts)=>{sh(I,m,'flashRayo',1);(ts||[]).forEach(o=>{if(I.B){I.B.arc(m,o,'arcoRayo');I.B.shot(o,'rayo',1)}})},
 congelado:(I,W,m)=>{sh(I,m,'hielo',1.4);sh(I,m,'flashHielo',1.4);for(let q=0;q<7;q++){const a=q/7*TAU+rnd(-.3,.3),rr=W.rad*rnd(.8,1.2);I.add(T.shard,new V3(W.base.x+Math.cos(a)*rr,W.base.y+.1,W.base.z+Math.sin(a)*rr),new V3(0,.5,0),{life:.9,s0:.12,s1:.42,g:1,a:Math.PI/2+rnd(-.35,.35),c0:'#ffffff',c1:'#8ad0ff'})}
  I.spray(8,T.shard,W.c,[1.2,2.4],.3,{life:.5,s0r:[.08,.13],s1:.04,g:4,dr:1,c0:'#ffffff',c1:'#7ac8ff'})},
 deshielo:(I,W,m)=>{sh(I,m,'flashHielo',1.2);I.spray(16,T.shard,W.c,[1.6,3.4],.45,{life:.65,s0r:[.09,.16],s1:.04,g:7,dr:.6,c0:'#ffffff',c1:'#8ad0ff'});I.spray(4,T.smoke,W.c,[.3,.7],.3,{life:.8,s0r:[.2,.32],s1:.5,dr:2,c0:'#dff2ff',c1:'#8ab8e0',al:.5})},   /* la congelación se ROMPE con el golpe: estalla en esquirlas */
 vapor:(I,W,m)=>{sh(I,m,'vapor',1.3);I.spray(6,T.smoke,W.c,[.4,1],.9,{life:1.3,s0r:[.3,.5],s1:.9,g:-.6,dr:1.6,c0:'#e8eef4',c1:'#9aa8b4',al:.55});I.spray(6,T.star,W.c,[1,2],.4,{life:.25,s0r:[.05,.08],s1:.02,dr:3,c0:'#ffffff',c1:'#bfe8ff',fd:2})},
 nube:(I,W,m,ts)=>{sh(I,m,'nube',1);I.spray(10,T.smoke,up(W.base,.3),[.6,1.6],.1,{life:1.8,s0r:[.4,.7],s1:1.3,g:-.15,dr:1.4,c0:'#3a7a18',c1:'#14320a'});I.spray(8,T.bubble,W.c,[.3,.9],.6,{life:1,s0r:[.08,.14],s1:.2,dr:1,c0:'#d8ff6a',c1:'#5ac020'});(ts||[]).forEach(o=>I.B&&I.B.arc(m,o,'arcoVeneno'))},
 purga:(I,W,m)=>{sh(I,m,'pilar',1.6);sh(I,m,'flash',1.4);I.spray(14,T.star,W.c,[.8,2],.8,{life:.9,s0r:[.08,.13],s1:.02,g:-.6,dr:2,c0:'#ffffff',c1:'#ffd060',fd:2});I.spray(5,T.smoke,up(W.c,W.h*.3),[.6,1.3],.9,{life:.9,s0r:[.2,.32],s1:.55,g:-.7,dr:2,c0:'#3a1460',c1:'#100420',al:.6})},   /* la maldición sale expulsada en humo violeta */
 disolucion:(I,W,m)=>{sh(I,m,'acido',1.3);I.spray(12,T.drop,W.c,[1,2.4],.6,{out:W.rad,life:.8,s0r:[.05,.09],s1:.035,g:8,dr:.6,c0:'#f4ff60',c1:'#7a8a10'});I.spray(4,T.smoke,W.c,[.3,.8],.8,{life:1.1,s0r:[.25,.4],s1:.7,g:-.4,dr:2,c0:'#a8b830',c1:'#3a4208',al:.55})},
 condena:(I,W,m)=>{sh(I,m,'condena',1);RECIPE.vacio(I,W,1.3,m);I.spray(10,T.star,W.c,[1.6,3.2],.3,{life:.4,s0r:[.06,.1],s1:.02,dr:2.5,c0:'#ffd8ff',c1:'#9a48ff',fd:2})},
 juicio:(I,W,m)=>{sh(I,m,'pilar',.9);sh(I,m,'flash',1.1);I.spray(8,T.star,W.c,[.6,1.6],.6,{life:.6,s0r:[.06,.1],s1:.02,g:-.4,dr:2,c0:'#ffffff',c1:'#ffd060',fd:2})},   /* el Juicio se consume con un golpe crítico */
 incinerar:(I,W,m,ts)=>{sh(I,m,'infernal',1.4);(ts||[]).forEach(o=>{if(I.B){I.B.arc(m,o,'arcoFuego');I.B.shot(o,'infernal',1)}});I.spray(16,T.ember,W.c,[1.4,3],.8,{life:1,s0r:[.06,.1],s1:.015,g:-1,dr:1.4,c0:'#fff4c0',c1:'#d01000'})}};

// ESTADOS VISIBLES EN EL ENEMIGO (lote ENCANT-ESTADOS-VISIBLES, 28 oct 2026): un segundo `Points` (mismo shader/material → ningún programa nuevo, +1 llamada) con un aspecto PERSISTENTE por estado mientras dure.
// Cada fotograma recorre solo los actores vivos y visibles con `e.sts`, lee `STS.list(e)` y emite a ritmo bajo (probabilidad = ritmo·dt) las partículas de su receta `AUR[kind]`; ≤ 140 partículas en total.
// El «tinte» del cuerpo es un vaho grande y muy tenue del color del estado centrado en el cuerpo (sin tocar el material del actor: así no hay recompilaciones). Un estado nuevo = una función en `AUR` (clave = clave de STS.D).
const _bx=new THREE.Box3(),jit=(W,f)=>_v.set(rnd(-f,f)*W.rad,0,rnd(-f,f)*W.rad);
const AUR={
 burn:(I,W,s,dt,hi)=>{if(I.em(hi?7:4,dt))I.add(T.ember,up(W.c,rnd(-.1,.5)).add(jit(W,.5)),new V3(rnd(-.3,.3),rnd(.7,1.4),rnd(-.3,.3)),{life:rnd(.6,1),s0:rnd(.05,.08),s1:.015,g:-.6,dr:1,c0:hi?'#ffd0a0':'#ffd060',c1:hi?'#c00800':'#ff3a00'});   /* las llamas las pinta la funda (bodyfx3d.js): aquí solo ascuas */
  if(hi&&I.em(1.6,dt))I.add(T.smoke,up(W.base,W.h*rnd(.9,1.1)).add(jit(W,.3)),new V3(0,rnd(.4,.7),0),{life:1.3,s0:.22,s1:.5,g:-.1,dr:1.5,c0:'#2a1410',c1:'#0e0806',al:.7})},
 freeze:(I,W,s,dt)=>{if(I.em(7,dt)){const a=rnd(0,TAU),rr=W.rad*rnd(.9,1.3);I.add(T.shard,new V3(W.base.x+Math.cos(a)*rr,W.base.y+.1,W.base.z+Math.sin(a)*rr),new V3(0,.25,0),{life:.9,s0:.16,s1:.42,a:Math.PI/2+rnd(-.4,.4),c0:'#ffffff',c1:'#8ad0ff'})}
  if(I.em(3,dt))I.add(T.star,up(W.c,rnd(-.3,.4)).add(jit(W,.4)),null,{life:.4,s0:.12,s1:.02,c0:'#ffffff',c1:'#bfeaff',fd:2})},
 chill:(I,W,s,dt)=>{const n=s.n||1;if(I.em(.6+n*.5,dt))I.add(T.puff,up(W.base,rnd(.02,.12)).add(jit(W,.6)),new V3(0,.12,0),{life:1,s0:.18,s1:.36,dr:2,c0:'#e8f8ff',c1:'#7ab8ff',al:.6});
  if(I.em(.6*n,dt))I.add(T.star,up(W.base,W.h*(.1+.17*n)*rnd(.3,1)).add(jit(W,.5)),null,{life:.35,s0:.1,s1:.02,c0:'#ffffff',c1:'#9ad8ff',fd:2})},
 poison:(I,W,s,dt,hi)=>{if(I.em(hi?3:1.6,dt))I.add(T.bubble,up(W.base,W.h*rnd(.15,.7)).add(jit(W,.4)),new V3(0,rnd(.3,.6),0),{life:rnd(.7,1.1),s0:rnd(.12,.2),s1:.26,dr:1,c0:'#f0ffa0',c1:'#9aff40'});if(I.em(2.5,dt))I.add(T.smoke,up(W.base,W.h*rnd(.2,.8)).add(jit(W,.5)),new V3(0,rnd(.2,.4),0),{life:1,s0:.22,s1:.42,dr:2,c0:'#1e6a10',c1:'#0e3a08',al:.6})},
 bleed:(I,W,s,dt,hi,e)=>{const mv=hi&&e.mv?2:1;if(I.em((hi?3:1.8)*mv,dt))I.edge(W,rnd(.25,.75),{life:1.2,s0:.11,s1:.09,g:6,dr:.4,c0:hi?'#ff2a18':'#c0101e',c1:'#5a0006'})},
 shock:(I,W,s,dt,hi)=>{if(hi&&I.em(1.2,dt))I.add(T.bolt,up(W.c,W.h*.4),null,{life:.18,s0:W.h*1.6,s1:W.h*1.6,a:Math.random()*99,c0:'#ffffff',c1:'#ffe060',fd:2});if(I.em(hi?4:2.4,dt))I.add(T.star,up(W.c,rnd(-.3,.4)).add(jit(W,.4)),null,{life:.2,s0:.34,s1:.1,c0:'#ffffff',c1:'#ffd23a',fd:2})},
 curse:(I,W,s,dt,hi)=>{if(I.em(hi?5:3,dt))I.add(T.smoke,up(W.base,W.h*rnd(.2,.6)).add(jit(W,.4)),new V3(0,rnd(.2,.5),0),{life:1.1,s0:.28,s1:.55,g:-.1,dr:2,c0:'#8a40d8',c1:'#2a0a48'});
  if(hi){const u=1-Math.min(1,s.rem/(s.tot||1));if(I.em(2+u*7,dt))I.add(T.glyph,up(W.base,.03),null,{life:.5,s0:W.rad*2.2,s1:W.rad*2.2,a:rnd(0,99),c0:'#d070ff',c1:'#6a2ac0',fd:2})}},   /* Condena: el sello late más y más deprisa antes de estallar */
 corrode:(I,W,s,dt,hi)=>{if(I.em(hi?3:1.4,dt))I.add(T.bubble,up(W.base,W.h*rnd(.1,.6)).add(jit(W,.4)),new V3(0,rnd(.2,.4),0),{life:rnd(.5,.9),s0:rnd(.12,.2),s1:.24,dr:1,c0:'#f4ff80',c1:'#c8e020'})},
 rend:(I,W,s,dt)=>{if(I.em(1.4+(s.n||1),dt))I.add(T.slash,up(W.c,rnd(-.3,.3)),null,{life:.3,s0:W.h*.8,s1:W.h*.95,a:rnd(0,TAU),c0:'#ffffff',c1:'#e8d0b0',fd:2})},
 fear:(I,W,s,dt)=>{if(I.em(5,dt))I.add(T.ember,up(W.base,W.h*1.1).add(jit(W,.3)),new V3(0,.5,0),{life:.6,s0:.08,s1:.02,c0:'#e0d0ff',c1:'#8a60e0'})},
 silence:(I,W,s,dt)=>{if(I.em(1.5,dt))I.add(T.glyph,up(W.base,W.h*1.15),null,{life:.7,s0:.5,s1:.5,a:3,c0:'#cfe0ff',c1:'#5a78ff',fd:2})},
 mark:(I,W,s,dt)=>{if(I.em(2.4,dt))I.add(T.reticle,up(W.c,W.h*.25),null,{life:.55,s0:W.rad*1.8,s1:W.rad*1.7,c0:'#ffe0a0',c1:'#ff9a30'})},
 judgement:(I,W,s,dt)=>{if(I.em(3,dt))I.add(T.star,up(W.base,rnd(.02,.3)).add(jit(W,.9)),new V3(0,rnd(.3,.6),0),{life:.7,s0:.1,s1:.02,c0:'#ffffff',c1:'#ffc030',fd:2});   /* motas doradas que suben del suelo (sin anillo: el dueño los descartó) */if(I.em(2,dt))I.add(T.beam,up(W.base,W.h*.7),null,{life:.7,s0:W.h*1.7,s1:W.h*1.7,c0:'#fffbe0',c1:'#ffc030',fd:2,al:.3})},
 wet:(I,W,s,dt)=>{if(I.em(3.2,dt))I.edge(W,rnd(.2,.85),{life:1.2,s0:.09,s1:.08,g:6,dr:.4,c0:'#dff4ff',c1:'#5a9ae0'})},
 root:(I,W,s,dt)=>{if(I.em(7,dt)){const a=rnd(0,TAU),rr=W.rad*rnd(.6,1.1);I.add(T.shard,new V3(W.base.x+Math.cos(a)*rr,W.base.y+.05,W.base.z+Math.sin(a)*rr),new V3(0,.2,0),{life:.9,s0:.2,s1:.55,a:Math.PI/2+rnd(-.5,.5),c0:'#c8f080',c1:'#5a9a30'})}},
 blind:(I,W,s,dt)=>{if(I.em(3,dt))I.add(T.smoke,up(W.base,W.h*1.05).add(jit(W,.2)),new V3(0,.1,0),{life:.9,s0:.25,s1:.4,dr:2,c0:'#4a3a68',c1:'#1a1028'})}};
// versiones fuertes → receta de su base con hi=1 (null = sin aspecto propio)
const ALIAS={incinerate:['burn',1],hemorrhage:['bleed',1],toxin:['poison',1],overload:['shock',1],doom:['curse',1],dissolve:['corrode',1]};
export class Aura extends Impact{
 constructor(scene,W3,refs){super(scene,W3,refs,140);this.obj.renderOrder=39;this.dtF=.016}
 /* tamaño REAL del cuerpo (caja del modelo, una vez por actor): tpl.h/rad de `where` no son medidas en mundo */
 where(m){const W=super.where(m),A=this.refs.actors&&this.refs.actors.map.get(m);if(A){if(A._ah==null){const b=_bx.setFromObject(A.grp);A._ah=Math.max(.5,Math.min(3.5,b.max.y-b.min.y));A._ar=Math.max(.2,Math.min(1.3,Math.max(b.max.x-b.min.x,b.max.z-b.min.z)*.45))}W.h=A._ah;W.rad=A._ar;W.c.y=W.base.y+W.h*.55}return W}
 em(rate,dt){return Math.random()<rate*dt*1.7}
 /* gota en el BORDE de la silueta (a la altura h·alto), a la izquierda o derecha de la cámara: resbala hacia fuera y cae al suelo por fuera del cuerpo */
 edge(W,h,o){const sd=Math.random()<.5?-1:1,r=W.rad*rnd(.75,.95)*(1-.25*h);_w.set(W.base.x+this.cr.x*sd*r,W.base.y+W.h*h,W.base.z+this.cr.z*sd*r);o.fl=W.base.y+.02;this.add(T.drop,_w,_v.set(this.cr.x*sd*rnd(.08,.22),rnd(-.1,.05),this.cr.z*sd*rnd(.08,.22)),o)}   /* ¿emite en este fotograma? */
 haze(W,col,al){if(this.em(2.4,this.dtF))this.add(T.puff,W.c,null,{life:.8,s0:W.h*1.1,s1:W.h*1.3,c0:col,c1:col,al})}
 scan(dt){this.dtF=dt;if(typeof STS==='undefined'||!this.refs.actors)return;let n=0;
  for(const [e,A] of this.refs.actors.map){if(!e.sts||!A.vis||A.state!=='live')continue;const L=STS.list(e);if(!L.length)continue;
   const W=this.where(e);this._fl=W.base.y+.02;for(const s of L){let k=s.k,hi=0;const al=ALIAS[k];if(al)[k,hi]=al;const f=AUR[k];if(f&&++n<24)try{f(this,W,s,dt,hi,e)}catch(x){}}}}
 update(dt){this.scan(Math.min(.1,dt));super.update(dt)}
}
