// NotScape · R3D · ASPECTO de las armas ENCANTADAS — REHECHO DE CERO (Lote ENCANT-VFX-2, 28 oct 2026; el anterior no gustó al dueño).
// `EnchFx` cuelga de un `HeroAnim` (heroanim3d.js lo actualiza cada fotograma) y, si el arma en mano lleva un encantamiento (`ENCH.cur()`, src/enchant.js), dibuja 2 cosas (2 llamadas, sin luces):
//   · FUNDA (`shell`): UN quad orientado a cámara que envuelve la hoja (de `A` = arranque a `B` = punta) y cuyo shader pinta el efecto de forma PROCEDURAL (ruido fbm, sin texturas):
//       fuego = lenguas de llama que SUBEN en el eje del mundo (aunque la hoja esté tumbada) con núcleo blanco y metal al rojo · escarcha = hoja helada, vaho frío que BAJA y destellos de hielo ·
//       sangre = aura carmesí suave con latido y venas que laten (ligero, sin chorreo) · veneno = baba verde que cubre la punta, con burbujas · físico = destello que recorre el filo y estrellitas ·
//       rayo = arcos eléctricos que saltan alrededor de la hoja (se regeneran ~12 veces/s) · vacío = humo oscuro arremolinado con hebras violetas.
//     La funda sale el doble de alta del lado de ARRIBA del mundo (las llamas suben, el vaho cae) y se adelanta 4 cm hacia la cámara para verse sobre la hoja sin dejar de ocultarse tras el cuerpo.
//   · PARTÍCULAS (`Points`, ≤ 96, simuladas en MUNDO en la CPU, forma procedural por tipo): ascuas, chispas, copos, vaho, humo, burbujas y GOTAS con física.
//     GOTAS (veneno y, rara vez, sangre): «colgadores» que nacen en el borde de abajo de la hoja, crecen (cuello que se estira + gota que engorda), se SUELTAN con gravedad y la velocidad del arma
//     (al blandirla salen despedidas) y se rompen al llegar al suelo. Cada colgador tiene tiempos y tamaños al azar: no hay ciclo que se repita.
// Mezcla: todo sale PREMULTIPLICADO con `ONE, ONE_MINUS_SRC_ALPHA` (lo material —baba, gotas, humo— tapa como normal y lo luminoso escribe alfa = su brillo máximo, como luz emisiva),
// en la MISMA llamada. OJO: el render del héroe pasa por `herograde3d.js`, que divide por alfa y DESECHA alfa < 0,002: lo aditivo puro (alfa 0) no se vería.
// Un efecto nuevo = una fila en `FX` (modo del shader + colores + tamaños + emisores + gotas) y, si su aspecto es nuevo, una rama `M==n` en `SHELL_FS`.
import * as THREE from 'three';
const V3=THREE.Vector3,TAU=Math.PI*2;
const col=h=>new THREE.Color(h);   // hex sRGB → lineal (ColorManagement)
// ── tabla de efectos ── m = modo del shader · c1/c2/c3 = colores · R = alcance del efecto (× ancho de hoja `bw`) · up/dn/sym = alto de la funda arriba/abajo/simétrica (× R) · tip = extra en las puntas (× R)
//    rise = cuánto se alarga la funda por el extremo que apunta ARRIBA (llamas que suben sobre la punta) · em = emisores [tipo, por segundo, opciones] · drip = gotas colgantes
const FX={
 fuego:   {m:0,c1:'#ff4a08',c2:'#ffc860',c3:'#5a0a00',R:4.6,up:3,dn:.95,sym:1.6,tip:.9,rise:1.6,em:[['ember',16,{v:[.5,1.1],l:[.5,1.1],s:[.022,.04],g:-.4}],['spark',3,{v:[.8,1.6],l:[.15,.3],s:[.03,.05],g:2}]]},
 escarcha:{m:1,c1:'#3a9cff',c2:'#dcf4ff',c3:'#0a2a5a',R:3.6,up:1.1,dn:1.9,sym:1.3,tip:.5,rise:0,em:[['flake',7,{v:[-.05,-.2],l:[.9,1.6],s:[.03,.05],g:.12}],['mist',3.5,{v:[-.08,-.18],l:[1.2,1.9],s:[.12,.2],g:.05}]]},
 sangre:  {m:2,c1:'#b0080e',c2:'#ff3a2a',c3:'#200002',R:2.6,up:1.2,dn:1.2,sym:1.2,tip:.4,rise:0,em:[],drip:{n:1,u:[.86,.98],T:[2.6,5.2],S:[.05,.075],w:[1.5,4.5],c:'#7a0a0c'}},
 veneno:  {m:3,c1:'#46b414',c2:'#c4ff4a',c3:'#14420a',R:2.4,up:1.1,dn:1.5,sym:1.2,tip:.5,rise:0,em:[['bubble',1.6,{v:[.08,.2],l:[.6,1.1],s:[.025,.04],g:-.05}]],drip:{n:3,u:[.5,.96],T:[1.4,3.4],S:[.065,.11],w:[.3,1.6],c:'#4fbf16'}},
 fisico:  {m:4,c1:'#f2dca0',c2:'#ffffff',c3:'#806a40',R:2,up:1,dn:1,sym:1,tip:.3,rise:0,em:[['glint',2.6,{v:[0,0],l:[.3,.5],s:[.05,.085],g:0,edge:1}]]},
 rayo:    {m:5,c1:'#ffd23a',c2:'#fffbe8',c3:'#806000',R:3.4,up:1.6,dn:1.6,sym:1.6,tip:.8,rise:0,em:[['spark',9,{v:[.9,2],l:[.12,.28],s:[.025,.045],g:1.5}]]},
 vampirica: {m:7,c1:'#8a0014',c2:'#ff3a50',c3:'#140006',R:3,up:1.4,dn:1.4,sym:1.4,tip:.5,rise:0,em:[['mote',4,{v:[.05,.15],l:[.6,1],s:[.018,.03],g:0}]],drip:{n:1,u:[.8,.97],T:[3,6],S:[.045,.065],w:[2,5],c:'#6a0010'}},
 sagrada:   {m:8,c1:'#ffc030',c2:'#fffbe0',c3:'#806020',R:4,up:1.8,dn:1.4,sym:1.6,tip:.7,rise:.6,em:[['mote',6,{v:[.15,.35],l:[.8,1.4],s:[.02,.035],g:-.1}],['glint',1.5,{v:[0,0],l:[.3,.5],s:[.04,.07],g:0,edge:1}]]},
 cazadora:  {m:9,c1:'#4ac030',c2:'#eaffb8',c3:'#103a08',R:3.2,up:1.6,dn:1.6,sym:1.6,tip:.6,rise:0,em:[['mote',3,{v:[.05,.2],l:[.6,1.1],s:[.018,.03],g:0}]]},
 arcana:    {m:10,c1:'#5a78ff',c2:'#e4ecff',c3:'#0a1040',R:5,up:1.6,dn:1.6,sym:1.6,tip:1.2,rise:0,em:[['spark',3,{v:[.3,.7],l:[.2,.4],s:[.025,.04],g:0}],['mote',3,{v:[.1,.3],l:[.6,1],s:[.02,.03],g:-.1}]]},
 aplastante:{m:11,c1:'#ff9a3a',c2:'#fff0d0',c3:'#6a5040',R:5,up:1.6,dn:1.6,sym:1.6,tip:.8,rise:0,em:[['smoke',1.6,{v:[.05,.15],l:[.8,1.3],s:[.06,.12],g:-.03}],['spark',2,{v:[.6,1.2],l:[.15,.3],s:[.025,.04],g:2}]]},
 vacio:   {m:6,c1:'#9a48ff',c2:'#ffa8f4',c3:'#1a0630',R:4,up:2.6,dn:1.1,sym:1.5,tip:.8,rise:1.2,em:[['smoke',5,{v:[.12,.3],l:[1,1.7],s:[.1,.2],g:-.05}],['mote',4,{v:[.15,.4],l:[.7,1.2],s:[.02,.035],g:-.1}]]}};
// por tipo de arma (`it.kind`): arranque A y punta B del efecto en coordenadas del arma (+y = hoja desde el agarre) y medio ancho de la hoja `bw`
function axis(M,A,B){const k=M.kind,t=M.tip;
 if(M.tipA&&M.tipB){A.copy(M.tipB);B.copy(M.tipA);return .02}
 if(!t){A.set(0,.1,0);B.set(0,.5,0);return .03}
 if(k==='staff'||k==='scepter'){A.copy(t).y-=.12;B.copy(t).y+=.05;return k==='staff'?.06:.045}
 if(k==='mace'){A.copy(t).multiplyScalar(.72);B.copy(t).y+=.03;return .06}
 if(k==='hatchet'||k==='greataxe'){A.set(0,t.y,0);B.copy(t).x+=.02;return k==='greataxe'?.07:.05}
 A.set(0,k==='great'?.13:.09,0);B.copy(t);return k==='great'?.042:k==='dagger'?.021:.029}
// ── shader de la FUNDA ──
const NOISE=`
float ss(float a,float b,float x){float t=clamp((x-a)/(b-a),0.,1.);return t*t*(3.-2.*t);}   // smoothstep que admite bordes invertidos (en GLSL es indefinido)
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*vn(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}`;
const SHELL_VS=`
attribute vec2 aQ;            // x: 0 arranque · 1 punta ; y: -1 abajo · +1 arriba
uniform vec3 uA,uD;uniform float uL,uR;uniform vec4 uW;uniform vec2 uE;
varying float vAl,vOff;varying vec3 vOv;varying vec2 vQ;
void main(){
 vQ=aQ;vec3 fw=normalize(vec3(viewMatrix[0][2],viewMatrix[1][2],viewMatrix[2][2]));      // hacia la cámara, en mundo
 vec3 s=cross(uD,fw);float sl=length(s);s=sl>1e-4?s/sl:vec3(0.,1.,0.);if(s.y<0.)s=-s;
 float k=clamp(s.y/.866,0.,1.);                                                   // 1 = hoja tumbada (la funda crece hacia arriba) · 0 = hoja vertical (simétrica)
 float wU=mix(uW.z,uW.x,k)*uR,wD=mix(uW.z,uW.y,k)*uR;
 float e0=uE.x*uR+uW.w*uR*max(-uD.y,0.),e1=uE.x*uR+uW.w*uR*max(uD.y,0.);
 float al=mix(-e0,uL+e1,aQ.x),off=aQ.y>0.?wU:-wD;
 vec3 wp=uA+uD*al+s*off+fw*.04;
 vAl=al;vOff=off;vOv=s*off;
 gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.);}`;
const SHELL_FS=`
uniform int uM;uniform float uT,uL,uR,uBw,uI,uK;uniform vec3 uD,uC1,uC2,uC3;
varying float vAl,vOff;varying vec3 vOv;varying vec2 vQ;
${NOISE}
vec3 ramp(float f){return f<.35?mix(uC3,uC1,f/.35):f<.72?mix(uC1,uC2,(f-.35)/.37):mix(uC2,vec3(1.,.97,.9),(f-.72)/.28);}
float star(vec2 p,float r){p=abs(p)/r;return max(exp(-p.x*7.-p.y*60.),exp(-p.y*7.-p.x*60.))+exp(-dot(p,p)*14.)*.6;}
void main(){
 float x=vAl,L=uL,bw=uBw,R=uR,t=uT;
 vec3 ov=vOv+uD*(x-clamp(x,0.,L));          // vector desde el punto más cercano del eje de la hoja (mundo)
 float r=length(ov),rise=ov.y,hz=length(ov-vec3(0.,rise,0.));
 float u=clamp(x/L,0.,1.);
 float taper=mix(1.,.55,ss(.75,1.,u));   // la hoja se estrecha hacia la punta
 float bwx=bw*taper;
 vec3 add=vec3(0.);vec3 mc=vec3(0.);float ma=0.;
 float ki=.22+.78*min(uK,1.),ux=clamp(uK-1.,0.,1.);   // NIVEL: ki = intensidad (I ≈.5 · II ≈.73 · III 1) · ux = extra de las versiones SUPERIORES (0 normal → 1 al máximo)
 float gw=max(bwx,.022);                  // radio mínimo del brillo (a zoom normal la hoja mide ~3 px de ancho)
 if(uM==0){ // FUEGO: base continua pegada a la hoja que se rompe en LENGUAS al subir
  float m=length(vec2(hz*1.2,rise>0.?rise*.4:rise*1.9));
  float hi=clamp(rise/R,0.,1.);
  float n=fbm(vec2(x*10.,rise*6.-t*4.2)),n2=vn(vec2(x*24.,rise*13.-t*8.));
  float f=1.-m/R+(n-.52)*(.7+1.1*hi)+(n2-.5)*.35;
  f*=ss(-R*.7,0.,x)*ss(L+R*1.6,L,x);
  f=clamp(f,0.,1.);
  float body=ss(gw*.2,gw*1.5,r);          // el CUERPO de la hoja se ve (metal al rojo), las llamas salen de los filos
  add=ramp(f)*ss(.02,.28,f)*(.45+.75*body)*1.35;
  float core=exp(-r*r/(gw*gw*1.3));
  add+=mix(uC1,uC2,.45+.25*sin(t*11.+x*25.))*core*.7;
  if(ux>0.){add+=vec3(1.,.92,.75)*ss(.5,.9,f)*ux*.9;
   float sm=fbm(vec2(x*5.,rise*4.-t*1.6))*ss(R*.5,R*1.5,rise)*exp(-hz/(R*.9))*ss(-R*.5,0.,x)*ss(L+R*1.5,L,x);
   ma=ss(.35,.7,sm)*ux*.55;mc=vec3(.06,.03,.025);}
 } else if(uM==1){ // ESCARCHA: hoja de hielo, aura fría, vaho que cae y destellos
  float core=exp(-r*r/(gw*gw*1.6));
  float aura=exp(-r/(gw*2.4));
  float m=length(vec2(hz,rise<0.?-rise*.5:rise*1.6));
  float env=exp(-m/(R*.55));
  float mist=fbm(vec2(x*6.+t*.12,rise*7.+t*.6));
  float fil=fbm(vec2(x*9.-t*.1,rise*10.+t*.9+mist*1.5));
  float mi=env*ss(.36,.82,mist)+env*ss(.07,0.,abs(fil-.5))*.6;
  vec2 cg=vec2(x,vOff)*28.;vec2 ci=floor(cg);float hh=h21(ci);
  float tw=pow(max(0.,sin(t*3.+hh*60.)),8.)*step(.8,hh);
  float sp=star(fract(cg)-.5,.55)*tw*ss(R*1.1,0.,r);
  float fr=ss(gw*1.1,gw*.7,r)*ss(.5,.75,vn(vec2(x*30.,vOff*60.)));   // escarcha cristalina sobre el metal
  add=uC1*(mi*.8+aura*.55)+uC2*(core*.9+fr*.6)+vec3(1.)*sp*1.4;
  if(ux>0.){float cx=x*26.,cc=h21(vec2(floor(cx),5.)),ln=gw*(1.+3.5*cc)*ux,dv=abs(vOff)-gw*.8;
   float sp2=step(0.,dv)*step(dv,ln)*step(abs(fract(cx)-.5)*2.,1.-dv/max(ln,1e-4))*step(.35,cc)*step(0.,x)*step(x,L);
   add+=mix(uC1,uC2,.6)*sp2*1.2+uC2*exp(-r/(gw*4.))*ux*.3;}
 } else if(uM==2){ // SANGRE (ligero): aura carmesí que late + venas
  float b=fract(t*.7)*5.;
  float hb=exp(-pow(b-1.,2.)*7.)+.6*exp(-pow(b-1.75,2.)*7.);        // latido doble
  float env=exp(-r/(gw*2.6));
  float ins=ss(gw*1.1,gw*.75,r);
  float vv=abs(fbm(vec2(x*8.-t*.3,vOff*40.+x*4.))-.5);
  float vein=ss(.06,0.,vv)*ins;
  add=uC1*env*(.7+.6*hb)+uC2*vein*(.5+.9*hb)+uC2*ins*(.12+.2*hb);
  if(ux>0.){float fl=fbm(vec2(x*7.-t*.9,vOff*25.));float rr=length(vec2(hz,rise>0.?rise*1.1:rise*.65));float ct=gw*(1.05+.5*fl);
   float co=ss(ct,ct-.006,rr)*ss(.3,.48,fl+u*.3)*ux;ma=co*.92;mc=mix(vec3(.18,0.,.01),uC1*.8,ss(.4,.8,fl))+uC2*ss(.75,.92,vn(vec2(x*30.-t,vOff*30.)))*.5;
   add+=uC1*exp(-r/(gw*4.5))*ux*1.*(.6+.6*hb);}
 } else if(uM==3){ // VENENO: baba que cubre la punta (con burbujas) + brillo tóxico
  float w=ss(.36-.34*ux,.66-.3*ux,u+(vn(vec2(x*9.,3.1))-.5)*.22)+ss(L,L+.02,x);
  w=clamp(w,0.,1.);
  float rr=length(vec2(hz,rise>0.?rise*1.05:rise*.7));
  float ct=gw*(1.1+.45*vn(vec2(x*14.,t*.35)));
  float ins=ss(ct,ct-.007,rr)*w;
  float nn=vn(vec2(x*30.+t*.15,vOff*30.));
  float hl=ss(.7,.95,nn)+ss(ct*.5,ct*.95,rr)*step(0.,rise)*.7;
  vec3 sc=mix(uC3,uC1,.35+.5*vn(vec2(x*8.,vOff*20.)))+uC2*hl*.55;   // baba espesa: fondo oscuro con brillos, no un tubo de neón
  float cx=floor(x/.05),ph=fract(t*.55+h21(vec2(cx,7.)));
  vec2 bc=vec2((cx+.5)*.05,(h21(vec2(cx,2.))-.5)*gw);
  float bd=length(vec2(x,vOff)-bc),rad=.016*ph;
  float ring=ss(.005,0.,abs(bd-rad))*step(ph,.88)*step(.45,h21(vec2(cx,9.)));
  sc+=uC2*ring;
  ma=ins*.95;mc=sc;
  add=uC1*exp(-r/(gw*2.2))*(.15+.3*w)+uC2*ins*.04;
  if(ux>0.){float vp=fbm(vec2(x*6.,rise*5.-t*1.2));float en=exp(-length(vec2(hz,max(rise,0.)*.45))/(R*.9))*step(0.,rise+gw);add+=mix(uC1,uC2,.35)*ss(.35,.75,vp)*en*ux*1.5;}
 } else if(uM==4){ // FÍSICO: destello que recorre el filo + estrellitas + leve brillo templado
  float ins=ss(gw*1.2,gw*.7,r);
  float ph=fract(t/2.1),pos=mix(-.12,L+.12,ss(0.,.45,ph));
  float g=exp(-pow((x+vOff*1.4-pos)/.045,2.))*ins*step(ph,.5);
  float cx=floor(x/.06),hh=h21(vec2(cx,4.));
  vec2 sc=vec2((cx+.5)*.06,(hh>.5?1.:-1.)*gw*.9);
  float tw=pow(max(0.,sin(t*2.6+hh*40.)),12.);
  float st=star(vec2(x,vOff)-sc,.075)*tw*step(.3,h21(vec2(cx,8.)))*step(0.,x)*step(x,L);
  add=uC2*g*1.6+mix(uC1,uC2,.6)*st*1.6+uC1*(exp(-r/(gw*1.8))*.32+ins*.12);
  if(ux>0.){float ed=exp(-pow((abs(vOff)-gw*.85)/(gw*.18),2.))*step(0.,x)*step(x,L+.02);float p2=fract(t/2.1+.5),q2=mix(-.12,L+.12,ss(0.,.45,p2));
   add+=uC2*ed*ux*.9+uC2*exp(-pow((x-vOff*1.4-q2)/.045,2.))*ins*step(p2,.5)*ux*1.4+uC1*exp(-r/(gw*3.))*ux*.3;}
 } else if(uM==5){ // RAYO: arcos que reptan por la hoja y saltan fuera
  float fl=.6+.4*h21(vec2(floor(t*24.),1.));
  float core=exp(-r*r/(gw*gw*1.5))*fl;
  float lines=0.;
  for(int i=0;i<4;i++){
   float fi=float(i),sd=floor(t*11.+fi*.29)+fi*17.;
   float x0=mix(-.04,L*.5,h21(vec2(sd,1.))),x1=x0+L*(.35+.6*h21(vec2(sd,2.)));
   float m=ss(x0,x0+.025,x)*ss(x1,x1-.025,x)*step(.25,h21(vec2(sd,3.)));
   float yb=(vn(vec2(x*11.,sd))-.5)*gw*(9.+9.*ux)+(vn(vec2(x*38.,sd+5.))-.5)*gw*3.;
   float d=abs(vOff-yb);
   lines+=m*(exp(-d/.006)+exp(-d/.028)*.4);}
  add=mix(uC1,uC2,clamp(lines*.7,0.,1.))*lines*1.7+mix(uC1,uC2,.5)*core*1.+uC1*exp(-r/(gw*2.5))*.25*fl;
 } else if(uM==6){ // VACÍO: humo violeta oscuro arremolinado, hebras brillantes y filo violeta
  float m=length(vec2(hz*1.1,rise>0.?rise*.55:rise*1.5));
  float env=exp(-m/(R*.45));
  vec2 p=vec2(x,rise)*8.;
  float w0=fbm(p*.7+vec2(t*.15,-t*.35));
  float n=fbm(p+vec2(0.,-t*.7)+w0*1.6);
  float dark=ss(.42,.72,n)*env;
  float fil=ss(.05,0.,abs(n-.56))*env;
  float rim=exp(-r/(gw*1.6));
  mc=mix(uC3,uC1*.35,.4);ma=dark*.45;
  add=mix(uC1,uC2,fil)*fil*1.3+uC1*rim*.75+uC1*env*.12;
  if(ux>0.){ma=min(1.,dark*(.45+.4*ux));vec2 cg=vec2(x,rise)*40.;float hh=h21(floor(cg));add+=uC2*exp(-dot(fract(cg)-.5,fract(cg)-.5)*60.)*step(.9,hh)*dark*ux*(.6+.4*sin(t*4.+hh*30.))*2.;}
 } else if(uM==7){ // VAMPÍRICA: filo oscuro y regueros rojos que corren hacia la EMPUÑADURA (el arma drena)
  float env=exp(-r/(gw*2.6));
  ma=ss(gw*1.2,gw*.7,r)*.45;mc=vec3(.06,0.,.015);
  float ln=floor(vOff/(gw*.7)),hl=h21(vec2(ln,3.)),sx=fract(x/max(L,.05)*2.2+t*(.7+.6*hl)+hl);
  float sk=ss(0.,.05,sx)*ss(.4,.05,sx)*step(.45,hl)*exp(-abs(vOff)/(R*.6));
  float pb=.6+.4*sin(t*3.);
  add=uC1*env*(.5+.3*pb)+uC2*sk*1.3+uC2*exp(-r*r/(gw*gw*.8))*.35*pb;
 } else if(uM==8){ // SAGRADA: núcleo dorado, halo y rayos que giran despacio + destellos
  float core=exp(-r*r/(gw*gw*1.4)),halo=exp(-r/(gw*3.2));
  vec2 q=vec2(x-L*.55,vOff);float a=atan(q.y,q.x),dq=length(q);
  float ray=pow(abs(sin(a*6.+t*.5)),14.)*exp(-dq/(R*.8))*ss(gw*.8,gw*2.,r);
  vec2 cg=vec2(x,vOff)*30.;float hh=h21(floor(cg));float sp=star(fract(cg)-.5,.5)*pow(max(0.,sin(t*2.5+hh*50.)),8.)*step(.85,hh)*halo;
  add=uC2*core*.9+uC1*halo*.55+mix(uC1,uC2,.5)*ray*.8+vec3(1.)*sp;
 } else if(uM==9){ // CAZADORA: brillo esmeralda y dos cintas de viento que recorren el arma
  float glow=exp(-r/(gw*2.4)),rb=0.;
  for(int i=0;i<2;i++){float fi=float(i)*2.-1.;float yb=fi*gw*(1.6+.6*sin(x*9.+t*3.+fi))+sin(x*14.-t*7.)*gw*.6;float d=abs(vOff-yb);float g=fract(x/max(L,.05)*1.3-t*.9+fi*.3);rb+=exp(-d/.006)*ss(0.,.2,g)*ss(1.,.6,g);}
  add=uC1*glow*.6+mix(uC1,uC2,.6)*rb*1.1+uC2*exp(-r*r/(gw*gw))*.3;
 } else if(uM==10){ // ARCANA: dos anillos de runas que giran (en sentidos opuestos) alrededor de la punta/orbe + flujo azul por el astil
  vec2 q=vec2(x-L,vOff);float dq=length(q),a=atan(q.y,q.x);
  float g1=exp(-pow((dq-R*.5)/.007,2.))*(.4+.6*step(.5,fract((a+t*1.2)*1.27)));
  float tk=step(.82,fract((a-t*.8)*2.55))*exp(-pow((dq-R*.78)/.012,2.));
  float orb=exp(-dq/(gw*1.8));
  float fl=ss(.06,0.,abs(fract(x*5.-t*1.6)-.5))*exp(-r*r/(gw*gw*1.5));
  add=uC1*(orb*.7+g1*.9+tk*1.2)+uC2*orb*exp(-dq/(gw*.8))*.8+uC1*fl*.5;
 } else { // APLASTANTE: ondas de choque que salen de la cabeza del arma
  vec2 q=vec2(x-L*.85,vOff);float dq=length(q),w=0.;
  for(int i=0;i<2;i++){float ph=fract(t*.7+float(i)*.5),rr=gw+ph*R*1.4;w+=exp(-pow((dq-rr)/.016,2.))*(1.-ph)*1.4;}
  float head=exp(-dq/(gw*2.5));
  add=mix(uC1,uC2,.5)*w*1.6+uC1*head*.6+uC2*exp(-r*r/(gw*gw))*.3;
 }
 add*=ki*(1.+.3*ux);
 float ef=ss(0.,.14,vQ.x)*ss(1.,.86,vQ.x)*ss(1.,.72,abs(vQ.y));   // se apaga ANTES del borde del quad: nunca se ve el rectángulo
 add*=ef;ma*=ef;
 float ga=clamp(max(add.r,max(add.g,add.b)),0.,1.);   // lo luminoso también escribe ALFA: el grado del héroe (herograde3d.js) desecha lo que tiene alfa ~0
 gl_FragColor=vec4((add+mc*ma)*uI,(1.-(1.-ma)*(1.-ga))*uI);
 #include <colorspace_fragment>
}`;
// ── shader de las PARTÍCULAS ── tipos: 0 ascua · 1 chispa/estrella · 2 gota colgante (aK = estiramiento 0..1) · 3 copo · 4 vaho · 5 humo (opaco) · 6 gota que cae · 7 burbuja
const PT_VS=`
attribute vec3 aCol;attribute vec3 aP;   // aP = (tamaño en mundo, alpha, aK)
attribute float aTy;uniform float uPpu;
varying vec3 vC;varying float vA,vK,vT;
void main(){vC=aCol;vA=aP.y;vK=aP.z;vT=aTy;gl_PointSize=max(1.,aP.x*uPpu);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const PT_FS=`
float ss(float a,float b,float x){float t=clamp((x-a)/(b-a),0.,1.);return t*t*(3.-2.*t);}
varying vec3 vC;varying float vA,vK,vT;
float liq(vec2 p,vec2 c,float rb,out float sh){vec2 d=p-c;float l=length(d);sh=clamp(1.-l/rb,0.,1.);return ss(rb,rb-.04,l);}
void main(){vec2 p=gl_PointCoord;vec2 q=p-.5;float a=0.;vec3 c=vC;bool op=false;int ty=int(vT+.5);
 if(ty==0){float d=length(q);a=exp(-d*d*38.)+exp(-d*d*180.)*.8;c=mix(vC,vec3(1.,.95,.8),exp(-d*d*200.));}
 else if(ty==1){q=abs(q)*2.;a=max(exp(-q.x*5.-q.y*45.),exp(-q.y*5.-q.x*45.))+exp(-dot(q,q)*20.);c=mix(vC,vec3(1.),exp(-dot(q,q)*40.));}
 else if(ty==2||ty==6){float sh;float cy,rb,inb;
  if(ty==2){cy=mix(.2,.76,vK);rb=mix(.14,.22,vK);
   float ww=mix(.06,rb*.85,pow(clamp(p.y/cy,0.,1.),3.));
   float neck=step(p.y,cy)*ss(ww,ww-.03,abs(q.x));
   inb=max(liq(p,vec2(.5,cy),rb,sh),neck);sh=max(sh,neck*.35);}
  else{cy=.64;rb=.24;float tipY=.12;float yy=clamp((cy-p.y)/(cy-tipY),0.,1.);float ww=rb*(1.-yy*yy)*step(p.y,cy);
   inb=max(liq(p,vec2(.5,cy),rb,sh),ss(ww,ww-.03,abs(q.x))*step(tipY,p.y));sh=max(sh,.3);}
  float hl=exp(-pow(length(p-vec2(.5-rb*.35,cy-rb*.4))/(rb*.28),2.));
  c=vC*(.45+.55*sh)+vec3(1.)*hl*.7;a=inb;op=true;}
 else if(ty==3){float d=length(q);float ang=atan(q.y,q.x);float arms=pow(abs(cos(ang*3.)),12.)*exp(-d*7.);a=arms*.9+exp(-d*d*120.)+exp(-d*d*18.)*.25;}
 else if(ty==4){float d=length(q);a=exp(-d*d*10.)*.35;}
 else if(ty==5){float d=length(q);a=ss(.5,.1,d)*.55;op=true;}
 else {float d=length(q);a=ss(.04,.0,abs(d-.36))*.9+exp(-pow(length(q-vec2(-.13,-.13))/.07,2.))*.8;}
 a*=vA;if(a<.003)discard;
 vec3 pc=c*a;gl_FragColor=op?vec4(pc,a):vec4(pc,clamp(max(pc.r,max(pc.g,pc.b)),0.,1.));
 #include <colorspace_fragment>
}`;
const PREMUL={blending:THREE.CustomBlending,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor,blendSrcAlpha:THREE.OneFactor,blendDstAlpha:THREE.OneMinusSrcAlphaFactor,transparent:true,depthWrite:false,premultipliedAlpha:false};
const TY={ember:0,spark:1,glint:1,hang:2,flake:3,mist:4,smoke:5,drop:6,bubble:7,mote:0};
const AUY={h:.95,c:.62,a:.58,g:.45,s:.5,l:.28,f:.05},AUY_K=Object.keys(AUY),N=96,HS=4,_a=new V3(),_b=new V3(),_d=new V3(),_v=new V3(),_w=new V3(),_c=new THREE.Color(),_x=new V3(),_c2=new THREE.Color(),_vp=new THREE.Vector4();
const rr=(a)=>a[0]+Math.random()*(a[1]-a[0]);
export class EnchFx{
 constructor(ha){this.ha=ha;this.last=performance.now();this.t=0;this.root=null;this.e=null;this.fade=0;this.tPrev=new V3();this.hasPrev=false;this.bv=new V3();
  // FUNDA: un quad (4 vértices) cuya forma la calcula el vertex shader
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(12),3));g.setAttribute('aQ',new THREE.BufferAttribute(new Float32Array([0,-1,1,-1,1,1,0,1]),2));g.setIndex([0,1,2,0,2,3]);
  g.boundingSphere=new THREE.Sphere(new V3(),1e5);   // la posición real sale del shader: esfera enorme para que nunca se descarte
  this.su={uA:{value:new V3()},uD:{value:new V3(0,1,0)},uL:{value:.5},uR:{value:.1},uBw:{value:.03},uW:{value:new THREE.Vector4(2,1,1,0)},uE:{value:new THREE.Vector2(.5,0)},uM:{value:0},uT:{value:0},uI:{value:1},uK:{value:1},
   uC1:{value:new THREE.Color()},uC2:{value:new THREE.Color()},uC3:{value:new THREE.Color()}};
  this.sm=new THREE.ShaderMaterial(Object.assign({uniforms:this.su,vertexShader:SHELL_VS,fragmentShader:SHELL_FS,side:THREE.DoubleSide},PREMUL));
  this.shell=new THREE.Mesh(g,this.sm);this.shell.renderOrder=9;this.shell.visible=false;this.shell.matrixAutoUpdate=false;
  // PARTÍCULAS
  this.pos=new Float32Array(N*3);this.vel=new Float32Array(N*3);this.colA=new Float32Array(N*3);this.pA=new Float32Array(N*3);this.ty=new Float32Array(N);this.age=new Float32Array(N).fill(9);this.life=new Float32Array(N).fill(1);
  this.s0=new Float32Array(N);this.s1=new Float32Array(N);this.gr=new Float32Array(N);this.hot=new Uint8Array(N);this.k=HS;this.acc={};
  const pg=new THREE.BufferGeometry();const dyn=(a,n)=>new THREE.BufferAttribute(a,n).setUsage(THREE.DynamicDrawUsage);
  pg.setAttribute('position',dyn(this.pos,3));pg.setAttribute('aCol',dyn(this.colA,3));pg.setAttribute('aP',dyn(this.pA,3));pg.setAttribute('aTy',dyn(this.ty,1));pg.boundingSphere=new THREE.Sphere(new V3(),1e5);
  this.pu={uPpu:{value:60}};this.pm=new THREE.ShaderMaterial(Object.assign({uniforms:this.pu,vertexShader:PT_VS,fragmentShader:PT_FS},PREMUL));
  this.pts=new THREE.Points(pg,this.pm);this.pts.renderOrder=10;this.pts.visible=false;this.pts.matrixAutoUpdate=false;
  // píxeles por unidad de mundo de la cámara ORTOGRÁFICA del héroe, medidos en el momento de dibujar
  this.pts.onBeforeRender=(r,s,cam)=>{r.getCurrentViewport(_vp);this.pu.uPpu.value=_vp.w*cam.projectionMatrix.elements[5]*.5};
  this.hang=[]}
 attach(it){let r=it.g;while(r.parent&&r.parent.parent)r=r.parent;if(this.root===r)return;if(this.root)this.detach();this.root=r;r.add(this.shell,this.pts)}
 detach(){if(this.root)this.root.remove(this.shell,this.pts);this.root=null}
 hide(){if(this.shell.visible||this.pts.visible){this.shell.visible=false;this.pts.visible=false;this.age.fill(9);this.life.fill(0);this.hang.length=0;this.e=null;this.hasPrev=false;this.fade=0}}
 // nace una partícula: tipo, posición, velocidad, vida, tamaño inicial/final, gravedad, color
 spawn(ty,p,v,life,s0,s1,g,c,hot,slot){const i=slot>=0?slot:(this.k=HS+((this.k-HS+1)%(N-HS)));this.pos.set([p.x,p.y,p.z],i*3);this.vel.set([v.x,v.y,v.z],i*3);this.age[i]=0;this.life[i]=life;this.ty[i]=ty;this.s0[i]=s0;this.s1[i]=s1;this.gr[i]=g;this.hot[i]=hot?1:0;this.colA.set([c.r,c.g,c.b],i*3);this.pA[i*3+2]=0;return i}
 // ── ARMADURA / HERRAMIENTA: lista plana [ranura, efecto, …] sin crear objetos (S.eq; la herramienta solo mientras recolectas, A.ty==='g')
 auraList(){const L=this._AL||(this._AL=[]);L.length=0;if(typeof ENCH==='undefined'||typeof S==='undefined')return L;
  for(const k of AUY_K){const id=S.eq[k],e=id&&ENCH.of(id);if(e&&ENCH.CAT(e)==='a')L.push(k,e)}
  try{if(typeof A!=='undefined'&&A&&A.ty==='g'){const t=ENCH.tool(A.sk);if(t)L.push('t',t.e)}}catch(x){}return L}
 // emite las motas: 1,6/s por pieza (4/s la herramienta), a la altura de su ranura (AUY) alrededor del héroe, o en la punta de la herramienta en la mano
 aura(dt,L){if(!L.length||!this.root)return;const R=this.root.matrixWorld.elements,ha=this.ha;
  for(let i=0;i<L.length;i+=2){const k=L[i],e=L[i+1],key='au'+k;this.acc[key]=(this.acc[key]||0)+(k==='t'?4:1.6)*dt;
   while(this.acc[key]>=1){this.acc[key]-=1;let tp=null;
    if(k==='t'&&ha.held){for(const it of ha.held.keys())if(it!==(ha.it&&ha.it.main)&&it.g&&it.g.visible&&it.tip){it.g.updateWorldMatrix(true,false);tp=it.g.localToWorld(_v.copy(it.tip));break}if(!tp)continue}
    if(!tp)_v.set(R[12]+(Math.random()-.5)*.32,R[13]+AUY[k]*.85+(Math.random()-.5)*.08,R[14]+(Math.random()-.5)*.32);
    const c=this.auC(e),g=Math.random()<.3;this.spawn(g?TY.glint:TY.mote,_v,_x.set((Math.random()-.5)*.1,.12+Math.random()*.15,(Math.random()-.5)*.1),g?.35+Math.random()*.2:.7+Math.random()*.5,g?.075:.045,g?.02:.015,-.05,c,0)}}}
 auC(e){const C=this._auc||(this._auc={});return C[e]||(C[e]=col(ENCH.D[e].col).lerp(new THREE.Color(1,1,1),.25))}
 // sin arma encantada: solo el aura (la funda se oculta; el reloj y las partículas siguen)
 auraOnly(dt,AU){let r=this.ha.m&&this.ha.m.obj;if(!r)return;while(r.parent&&r.parent.parent)r=r.parent;if(this.root!==r){if(this.root)this.detach();this.root=r;r.add(this.shell,this.pts)}
  if(this.shell.visible){this.shell.visible=false;for(const h of this.hang)if(h.i>=0){this.pA[h.i*3+1]=0;this.age[h.i]=9}this.hang.length=0;this.e=null;this.hasPrev=false}
  this.pts.visible=true;this.fade=1;this.root.updateWorldMatrix(true,false);this.pts.matrix.copy((this.inv||(this.inv=new THREE.Matrix4())).copy(this.root.matrixWorld).invert());
  this.aura(dt,AU);this.sim(dt,this.root.matrixWorld.elements[13]+.01)}
 update(){const now=performance.now(),dt=Math.min(.05,Math.max(0,(now-this.last)/1000));this.last=now;this.t+=dt;
  const e=typeof ENCH!=='undefined'?ENCH.cur():null,ha=this.ha,M=ha.it&&ha.it.main,F=e&&(FX[e]||FX[ENCH.D[e]&&ENCH.D[e].fx]);   /* superiores: aspecto de su base, potenciado */
  const wOn=!!(F&&M&&M.g.visible&&!(ha.held&&!ha.held.has(M))),AU=this.auraList();   // AU: piezas de armadura / herramienta encantadas (pares [ranura, efecto])
  if(!wOn&&!AU.length){this.hide();return}
  if(!wOn){this.auraOnly(dt,AU);return}
  this.attach(M);if(this.e!==e){this.e=e;this.age.fill(9);this.life.fill(0);this.hang.length=0;this.fade=0;this.acc={};
   this.C1=col(F.c1);this.C2=col(F.c2);this.C3=col(F.c3);this.CS=this.C3.clone().lerp(this.C1,.3);this.CD=F.drip?col(F.drip.c):null;const U=this.su;U.uM.value=F.m;U.uC1.value.set(F.c1);U.uC2.value.set(F.c2);U.uC3.value.set(F.c3);U.uW.value.set(F.up,F.dn,F.sym,F.rise);U.uE.value.set(F.tip,0)}
  this.fade=Math.min(1,this.fade+dt*2.5);
  this.shell.visible=this.pts.visible=true;M.g.updateWorldMatrix(true,false);
  const inv=(this.inv||(this.inv=new THREE.Matrix4())).copy(this.root.matrixWorld).invert();this.shell.matrix.copy(inv);this.pts.matrix.copy(inv);   // todo va en coordenadas de MUNDO
  const bw=axis(M,_a,_b);M.g.localToWorld(_a);M.g.localToWorld(_b);
  // ancho real: la escala del arma en mundo (el héroe va a HERO_SCALE)
  const sc=_w.setFromMatrixScale(M.g.matrixWorld).x||1,bww=bw*sc;
  _d.subVectors(_b,_a);let L=_d.length()||1e-3;_d.divideScalar(L);
  // VISTO DE CANTO (SOLO arcos/ballestas: el arco en reposo apunta hacia la cámara; con espadas creaba una barra vertical junto a la hoja): si el eje casi coincide con la vista, se usa un eje VERTICAL centrado en el arma para que el efecto se siga viendo
  {const az=(typeof R3D!=='undefined'&&typeof R3D.az==='number')?R3D.az:Math.PI/4;_w.set(Math.sin(az)*.866,.5,Math.cos(az)*.866);
   if(M.tipA&&M.tipB&&Math.abs(_d.dot(_w))>.8){_v.addVectors(_a,_b).multiplyScalar(.5);const h=Math.max(L,.3)*.5;_a.copy(_v).y-=h;_b.copy(_v).y+=h;_d.set(0,1,0);L=h*2}}
  const K=Math.max(.3,ENCH.vk(S.eq.w)||1),kR=(.4+.6*Math.min(K,1))*(1+.45*Math.max(K-1,0));this.K=K;   // potencia del VFX por NIVEL (ENCH.vk): tamaño, ritmo de partículas y gotas
  const U=this.su;U.uK.value=K;U.uA.value.copy(_a);U.uD.value.copy(_d);U.uL.value=L;U.uBw.value=bww;U.uR.value=bww*F.R*kR;U.uT.value=this.t;U.uI.value=this.fade;
  // velocidad de la punta (para que las gotas y ascuas salgan despedidas al blandir)
  if(this.hasPrev&&dt>0)this.bv.subVectors(_b,this.tPrev).divideScalar(dt).clampLength(0,12);else this.bv.set(0,0,0);this.tPrev.copy(_b);this.hasPrev=true;
  const groundY=this.root.matrixWorld.elements[13]+.01;
  // EMISORES
  for(const [k,rate,o] of F.em){this.acc[k]=(this.acc[k]||0)+rate*K*dt*this.fade;
   while(this.acc[k]>=1){this.acc[k]-=1;const u=k==='glint'?Math.random():.08+Math.random()*.92;
    _v.copy(_a).addScaledVector(_d,u*L);const side=(Math.random()*2-1)*bww*(o.edge?.9:1.6);_w.set(-_d.y,_d.x,0);if(_w.lengthSq()<1e-6)_w.set(1,0,0);_w.normalize();_v.addScaledVector(_w,side);
    const sp=rr(o.v),vel=_x.set((Math.random()-.5)*.25,sp,(Math.random()-.5)*.25);
    if(k==='spark'){vel.set(Math.random()-.5,Math.random()*.6,Math.random()-.5).normalize().multiplyScalar(Math.abs(sp))}
    vel.addScaledVector(this.bv,k==='mist'||k==='smoke'?.05:.18);
    const c=k==='smoke'?this.CS:k==='flake'||k==='glint'||k==='bubble'?this.C2:this.C1;
    const s=rr(o.s)*(.75+.25*K),hot=k==='ember'||k==='spark';
    this.spawn(TY[k],_v,vel,rr(o.l),s,k==='mist'||k==='smoke'?s*1.7:k==='bubble'?s*1.2:s*.25,o.g,hot?this.C2:c,hot)}}
  // GOTAS colgantes
  const Dp=F.drip;if(Dp){const dn=Math.min(HS,Math.max(1,Math.round(Dp.n*(.4+.6*K)+(K>1?1:0)))),dT=1/Math.max(.6,K);if(this.hang.length>dn){for(const h of this.hang.splice(dn))if(h.i>=0){this.pA[h.i*3+1]=0;this.age[h.i]=9}}
   while(this.hang.length<dn)this.hang.push({u:rr(Dp.u),T:rr(Dp.T)*dT,S:rr(Dp.S)*(.8+.2*K),a:-rr(Dp.w)*Math.random(),i:-1,sl:this.hang.length});
   const fling=this.bv.length()>2.6;
   for(const h of this.hang){h.a+=dt;if(h.a<0){if(h.i>=0){this.pA[h.i*3+1]=0;this.age[h.i]=9;h.i=-1}continue}
    const k=Math.min(1,h.a/h.T),kk=k*k*(3-2*k),sz=.035+(h.S-.035)*kk;
    // punto de enganche: borde de ABAJO de la hoja en u
    _v.copy(_a).addScaledVector(_d,h.u*L);_w.set(-_d.y,_d.x,0);if(_w.lengthSq()<1e-6)_w.set(1,0,0);_w.normalize();if(_w.y>0)_w.negate();_v.addScaledVector(_w,bww*.7*Math.abs(_w.y)).y-=bww*.25;
    if(h.i<0){h.i=this.spawn(TY.hang,_v,_x.set(0,0,0),1e9,sz,sz,0,this.CD,0,h.sl)}
    const i=h.i;this.pos[i*3]=_v.x;this.pos[i*3+1]=_v.y-sz*.5/.866;this.pos[i*3+2]=_v.z;this.s0[i]=this.s1[i]=sz;this.pA[i*3+2]=kk;this.age[i]=0;
    if(k>=1||(fling&&k>.25)){   // se suelta: la gota cae con gravedad y la inercia del arma
     _v.y-=sz*(.2+.56*kk)/.866;const dv=_w.copy(this.bv).multiplyScalar(.6);dv.y=Math.min(dv.y,.4);
     this.age[i]=9;this.pA[i*3+1]=0;h.i=-1;
     this.spawn(TY.drop,_v,dv,1.6,sz*.62,sz*.62,9.5,this.CD,0);
     h.u=rr(Dp.u);h.T=rr(Dp.T)*dT;h.S=rr(Dp.S)*(.8+.2*K);h.a=-rr(Dp.w)*dT}}}
  this.aura(dt,AU);this.sim(dt,groundY)}
 sim(dt,groundY){
  // simulación
  for(let i=0;i<N;i++){let a=this.age[i];if(a>=this.life[i]){this.pA[i*3]=0;this.pA[i*3+1]=0;continue}
   const ty=this.ty[i];if(ty===2){this.pA[i*3]=this.s0[i];this.pA[i*3+1]=this.fade;continue}   // colgante: lo mueve su colgador
   a+=dt;this.age[i]=a;const u=a/this.life[i],j=i*3;
   this.vel[j+1]-=this.gr[i]*dt;if(ty===4||ty===5||ty===3){const dr=Math.exp(-dt*1.5);this.vel[j]*=dr;this.vel[j+2]*=dr}
   this.pos[j]+=this.vel[j]*dt;this.pos[j+1]+=this.vel[j+1]*dt;this.pos[j+2]+=this.vel[j+2]*dt;
   if(ty===0||ty===3){this.pos[j]+=Math.sin(this.t*7+i*2.1)*.004;this.pos[j+2]+=Math.cos(this.t*6+i*1.3)*.004}
   if(ty===6&&this.pos[j+1]<=groundY){   // la gota llega al suelo: se rompe en 2–3 gotitas
    this.pos[j+1]=groundY;this.age[i]=9;const n=2+(Math.random()*2|0);_c.setRGB(this.colA[j],this.colA[j+1],this.colA[j+2]);
    for(let q=0;q<n;q++){const an=Math.random()*TAU;_v.set(this.pos[j],groundY+.005,this.pos[j+2]);this.spawn(TY.drop,_v,_x.set(Math.cos(an)*.5,.9+Math.random()*.5,Math.sin(an)*.5),.22,this.s0[i]*.35,this.s0[i]*.3,9.5,_c,0)}
    this.pA[j]=0;this.pA[j+1]=0;continue}
   const s=this.s0[i]+(this.s1[i]-this.s0[i])*u;
   let al=ty===6?1:ty===1?(1-u):ty===4||ty===5?Math.sin(Math.PI*Math.min(1,u))*(1-u*.3):ty===7?(u<.85?1:(1-u)*6.7):(1-u)*(u<.12?u/.12:1);
   if(this.hot[i]){_c.copy(this.C2).lerp(this.C1,Math.min(1,u*1.6));this.colA[j]=_c.r;this.colA[j+1]=_c.g;this.colA[j+2]=_c.b}
   this.pA[j]=s;this.pA[j+1]=al*this.fade}
  const A=this.pts.geometry.attributes;A.position.needsUpdate=A.aCol.needsUpdate=A.aP.needsUpdate=A.aTy.needsUpdate=true}
 dispose(){this.detach();this.shell.geometry.dispose();this.sm.dispose();this.pts.geometry.dispose();this.pm.dispose()}
}
