// NotScape · R3D · SHADERS PROPIOS DE LAS HABILIDADES DE COMBATE (lote N0-FX-SHADERS, 2 nov 2026; el dueño: «¿no puedes crear shaders nuevos para las habilidades?»).
// `SkillFx` (r3d.js lo crea, `R3D.skill`) dibuja con UNA llamada y UN programa (InstancedBufferGeometry de un quad, ≤ NMAX instancias) siete efectos procedurales:
//   0 TAJO: media luna horizontal a la altura del pecho que BARRE (cabeza brillante, estela que se deshilacha con ruido, chispas a lo largo del filo).
//   1 REMOLINO: vórtice horizontal alrededor del héroe (3 brazos en espiral que giran, polvo; para Torbellino/Barrido/áreas de golpe).
//   2 GRIETAS: grietas radiales incandescentes en el suelo con un destello central (aturdir, golpes aplastantes, ejecuciones). NO es un anillo que se expande (el dueño los descartó).
//   3 COLUMNA: columna vertical de energía con vetas que suben (mejoras propias: furia, escudo, celeridad, regeneración…), siempre de cara a la cámara.
//   4 ORBE: estallido esférico de energía con crepitar de ruido que se hincha y se disipa (magia de área / impacto mágico fuerte), de cara a la cámara.
//   5 HENDIDURA: media luna VERTICAL de cara a la cámara que cae sobre el objetivo (ejecutar, golpes pesados).
//   6 ESTELA: haz que viaja de A a B con cabeza brillante y cola que se apaga (disparos y proyectiles fuertes), tumbado sobre el plano del suelo.
// Todo es procedural (fbm + hash), colores en LINEAL, materia + luz premultiplicadas (`ONE, ONE_MINUS_SRC_ALPHA`, como bodyfx/enchfx): no pinta un rectángulo nunca.
// API (coordenadas de MUNDO en px, como el resto del juego): `play(modo,{x,y,tx,ty,ang,r,h,col,col2,life,dir,k,z})`. Un efecto nuevo = una rama `M==n` en FS + su orientación en `play`.
import * as THREE from 'three';
const NMAX=48,MODES={tajo:0,remolino:1,grietas:2,columna:3,orbe:4,hendidura:5,estela:6};
const VS=`
attribute vec2 aQ;
attribute vec3 iC,iU,iV;attribute vec4 iP,iX;attribute vec3 iC1,iC2;
varying vec2 vQ;varying vec4 vP,vX;varying vec3 vC1,vC2;
void main(){vQ=aQ;vP=iP;vX=iX;vC1=iC1;vC2=iC2;
 vec3 U=iU,V=iV,push=vec3(0.);
 if(iX.w>.5){vec3 fw=normalize(vec3(viewMatrix[0][2],viewMatrix[1][2],viewMatrix[2][2]));vec3 rt=normalize(cross(vec3(0.,1.,0.),fw));
  if(iX.w>1.5){vec3 up=normalize(cross(fw,rt));U=rt*length(iU);V=up*length(iV);push=fw*length(iU);}else{U=rt*length(iU);V=vec3(0.,1.,0.)*length(iV);}}
 vec3 wp=iC+U*aQ.x+V*aQ.y+push;   // los de cara a la cámara se adelantan (solo cambia la profundidad): el suelo no los corta
 gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.);}`;
const FS=`
uniform float uT;
varying vec2 vQ;varying vec4 vP,vX;varying vec3 vC1,vC2;
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*vn(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
float sst(float a,float b,float x){float t=clamp((x-a)/(b-a),0.,1.);return t*t*(3.-2.*t);}
vec3 ramp(float f){f=clamp(f,0.,1.);return f<.5?mix(vC2*.55,vC1,f/.5):mix(vC1,vec3(1.,.97,.9),(f-.5)/.5);}
const float PI=3.14159265;
float trail0(float rel){return sst(-.25,0.,rel);}
void main(){
 int M=int(vP.x+.5);float u=clamp(vP.y,0.,1.),sd=vP.z*41.3,K=vP.w,t=uT+sd;vec2 q=vQ;
 float a=0.,lum=0.,mat=0.;   // a = opacidad de materia (oscurece), lum = luz que suma
 float fade=sst(0.,.08,u)*(1.-sst(.55,1.,u));
 if(M==0||M==5){   // TAJO / HENDIDURA: media luna que barre
  if(M==5)q=vec2(q.y,-q.x);   // hendidura: el arco pasa por ENCIMA del objetivo y cae
  float r=length(q),an=atan(q.y,q.x)*(vX.z>0.?1.:-1.);
  float span=vX.y,hd=mix(-span,span,1.-pow(1.-sst(0.,.55,u),2.));
  float rel=hd-an;                                   // > 0 detrás de la cabeza
  float trail=sst(-.05,0.,rel)*(1.-sst(0.,span*1.4,rel))*sst(-span-.25,-span+.15,an)*(1.-sst(span-.05,span+.3,an));
  float w=vX.x*(.75+.55*exp(-rel*2.2));
  float band=exp(-pow((r-.72)/w,2.));
  float n=fbm(vec2(an*5.-t*3.,r*7.));
  float edge=mix(.55,1.,sst(.3,.75,n+.35*exp(-rel*3.)))*band;
  float head=exp(-rel*rel*30.)*band;
  float spk=step(.985,h21(floor(vec2(an*60.,r*40.))+sd))*band*trail;
  float hb=head*trail0(rel);
  lum=(edge*trail*1.7+hb*.7+spk*1.4)*fade;
  a=edge*trail*.3*fade;
  vec3 c=ramp(.3+.5*min(1.,hb+edge*.3));
  gl_FragColor=vec4(c*lum+vC2*.04*a,clamp(lum*.55+a,0.,1.));return;}
 if(M==1){   // REMOLINO
  float r=length(q);if(r>1.)discard;float an=atan(q.y,q.x);
  float sw=an*3.+r*7.5-t*11.*vX.z;
  float arm=pow(.5+.5*cos(sw),6.);
  float n=fbm(vec2(an*3.+t*2.,r*6.-t*3.));
  float m=sst(.18,.35,r)*(1.-sst(.75,1.,r));
  lum=arm*m*(.6+.8*n)*fade*1.3;
  float dust=m*sst(.4,.8,n)*.35*fade;
  vec3 c=ramp(.35+.6*arm);
  gl_FragColor=vec4(c*lum+vC2*.06*dust,clamp(lum*.5+dust,0.,1.));return;}
 if(M==2){   // GRIETAS
  float r=length(q);if(r>1.)discard;float an=atan(q.y,q.x)/(2.*PI)+.5;
  float sec=floor(an*11.),fr=fract(an*11.);
  float j=(h21(vec2(sec,sd))-.5)*.5+sin(r*14.+sec)*.06;
  float lw=.035*(1.-r*.6);
  float crack=exp(-pow((fr-.5-j)/lw,2.))*step(r,.25+.75*h21(vec2(sec,sd+3.)));
  float n=fbm(q*6.+sd);
  float glow=crack*(1.-sst(.2,1.,u))*sst(.25,.6,n+.3);
  float core=exp(-r*r*14.)*(1.-sst(0.,.35,u))*1.4;
  lum=(glow*1.4+core)*sst(0.,.05,u);
  a=crack*.7*(1.-sst(.6,1.,u))+exp(-r*r*6.)*.2*(1.-u);
  vec3 c=ramp(.4+.6*min(1.,core+glow*.6));
  gl_FragColor=vec4(c*lum+vec3(.03,.02,.015)*a,clamp(lum*.5+a,0.,1.));return;}
 if(M==3){   // COLUMNA
  float x=q.x,y=q.y*.5+.5;
  float body=exp(-x*x*6.)*(1.-sst(.7,1.,abs(x)));
  float n=fbm(vec2(x*5.,y*3.-t*2.2));
  float streak=pow(vn(vec2(x*18.+sd,y*2.-t*3.5)),5.)*body*2.2;
  float top=(1.-sst(.5,1.,y))*sst(0.,.06,y),base=exp(-y*7.)*exp(-x*x*8.)*1.3;
  lum=(body*.35*(.5+n)+streak+base)*top*fade;
  vec3 c=ramp(.35+.65*min(1.,streak+base));
  gl_FragColor=vec4(c*lum,clamp(lum*.5,0.,1.));return;}
 if(M==4){   // ORBE
  float r=length(q);if(r>1.)discard;float R=.25+.7*sst(0.,.5,u);
  float n=fbm(q*4.+vec2(t*1.5,-t*1.1));
  float shell=exp(-pow((r-R*(.85+.25*n))/.16,2.));
  float inner=exp(-r*r/(R*R*.35))*(1.-sst(0.,.45,u));
  float cr=pow(1.-abs(fbm(q*5.+vec2(t*.9,-t*.7))*2.-1.),14.)*sst(R+.1,R-.35,r)*2.2;
  lum=(shell*(.45+.5*n)+inner*.7+cr*.6)*fade*.75;
  vec3 c=ramp(.25+.5*min(1.,inner+shell*.5+cr*.3));
  gl_FragColor=vec4(c*lum,clamp(lum*.45,0.,1.));return;}
 if(M==6){   // ESTELA: q.x = -1 inicio … +1 final; cabeza en u
  float x=q.x*.5+.5,hd=sst(0.,.6,u)*1.02;
  float d=hd-x;float tail=sst(-.02,0.,d)*(1.-sst(0.,.45,d));
  float w=.35*(.4+.6*exp(-d*8.));
  float body=exp(-pow(q.y/w,2.));
  float n=vn(vec2(x*30.-t*14.,q.y*3.));
  float head=exp(-d*d*900.)*exp(-q.y*q.y*8.)*2.;
  lum=(tail*body*(.6+.6*n)+head)*(1.-sst(.7,1.,u));
  vec3 c=ramp(.4+.6*min(1.,head+body*.3));
  gl_FragColor=vec4(c*lum,clamp(lum*.5,0.,1.));return;}
 discard;}`;
const _c=new THREE.Color();
export class SkillFx{
 constructor(scene,W3,refs){this.W3=W3;this.refs=refs||{};this.t=0;this.ts=1;this.L=[];
  const g=new THREE.InstancedBufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(12),3));g.setAttribute('aQ',new THREE.BufferAttribute(new Float32Array([-1,-1,1,-1,1,1,-1,1]),2));g.setIndex([0,1,2,0,2,3]);
  const ia=n=>{const a=new THREE.InstancedBufferAttribute(new Float32Array(NMAX*n),n);a.setUsage(THREE.DynamicDrawUsage);return a};
  this.A={iC:ia(3),iU:ia(3),iV:ia(3),iP:ia(4),iX:ia(4),iC1:ia(3),iC2:ia(3)};for(const k in this.A)g.setAttribute(k,this.A[k]);
  g.instanceCount=0;g.boundingSphere=new THREE.Sphere(new THREE.Vector3(),1e6);   // la posición sale del shader (como bodyfx)
  this.u={uT:{value:0}};
  const m=new THREE.ShaderMaterial({uniforms:this.u,vertexShader:VS,fragmentShader:FS,transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,
   blending:THREE.CustomBlending,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor,blendSrcAlpha:THREE.OneFactor,blendDstAlpha:THREE.OneMinusSrcAlphaFactor});
  this.obj=new THREE.Mesh(g,m);this.obj.renderOrder=39;this.obj.visible=false;this.obj.matrixAutoUpdate=false;this.geo=g;scene.add(this.obj)}
 // o: {x,y} centro (px de mundo) · tx,ty destino (estela) · ang ángulo en el suelo (rad, como atan2(dy,dx)) · r radio (px) · h alto (px, columna/hendidura) · col/col2 colores · life s · dir ±1 · k fuerza · delay s · z altura extra (unidades)
 play(mode,o){const M=typeof mode==='number'?mode:MODES[mode];if(M==null||!o)return;if(this.L.length>=NMAX)this.L.shift();
  this.L.push({M,o,t0:this.t+(o.delay||0),life:o.life||[.32,.6,.9,1.1,.7,.4,.45][M],sd:Math.random()})}
 update(dt){dt*=this.ts;this.t+=dt;this.u.uT.value=this.t%1000;let n=0;const T=(typeof ISO!=='undefined'?ISO.TILE:32),A=this.A;
  for(let i=this.L.length-1;i>=0;i--){const e=this.L[i],u=(this.t-e.t0)/e.life;if(u>=1){this.L.splice(i,1);continue}if(u<0)continue;if(n>=NMAX)break;
   const o=e.o,M=e.M,z0=typeof TER!=='undefined'?TER.standZ(o.x,o.y):1,C=this.W3(o.x,o.y,z0),r=(o.r||60)/T,k=o.k||1;let cx=C.x,cy=C.y,cz=C.z,U=[r,0,0],V=[0,0,r],bb=0,X=[.12,1.3,o.dir||1];
   const ca=Math.cos(o.ang||0),sa=Math.sin(o.ang||0);
   if(M===0){cy+=(o.z!=null?o.z:.5);U=[ca*r,0,sa*r];V=[-sa*r,0,ca*r];X=[.16*k,1.35,o.dir||1]}
   else if(M===1){cy+=.35;U=[r,0,0];V=[0,0,r];X=[0,0,o.dir||1]}
   else if(M===2){cy+=.04;U=[ca*r,0,sa*r];V=[-sa*r,0,ca*r]}
   else if(M===3){const hh=(o.h||70)/T;cy+=hh;U=[r,0,0];V=[0,hh,0];bb=1}
   else if(M===4){cy+=(o.z!=null?o.z:.5);U=[r,0,0];V=[0,r,0];bb=2}
   else if(M===5){const hh=(o.h||70)/T;cy+=hh*.3;U=[hh*.5,0,0];V=[0,hh*.5,0];bb=2;X=[.12*k,1.2,o.dir||1]}
   else if(M===6){const B=this.W3(o.tx,o.ty,typeof TER!=='undefined'?TER.standZ(o.tx,o.ty):z0),dx=B.x-C.x,dz=B.z-C.z,L=Math.hypot(dx,dz)||1;cx=(C.x+B.x)/2;cy=(C.y+B.y)/2+.5;cz=(C.z+B.z)/2;U=[dx/2,(B.y-C.y)/2,dz/2];const w=(o.r||14)/T;V=[-dz/L*w,0,dx/L*w]}
   A.iC.setXYZ(n,cx,cy,cz);A.iU.setXYZ(n,U[0],U[1],U[2]);A.iV.setXYZ(n,V[0],V[1],V[2]);A.iP.setXYZW(n,M,u,e.sd,k);A.iX.setXYZW(n,X[0],X[1],X[2],bb);
   _c.set(o.col||'#ffe0a0');A.iC1.setXYZ(n,_c.r,_c.g,_c.b);_c.set(o.col2||o.col||'#a06020');A.iC2.setXYZ(n,_c.r,_c.g,_c.b);n++}
  this.geo.instanceCount=n;this.obj.visible=n>0;if(n)for(const k in A){const a=A[k];a.needsUpdate=true;a.clearUpdateRanges();a.addUpdateRange(0,n*a.itemSize)}}
}
