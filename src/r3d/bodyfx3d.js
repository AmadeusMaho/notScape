// NotScape · R3D · FUNDA DEL CUERPO de los enemigos (lote ENCANT-VFX-CUERPO, 28 oct 2026; el dueño: «el quemado podría ser el shader del arma de fuego y el incinerado el mismo más rojizo»).
// `BodyFx` (r3d.js lo crea, `R3D.body`) dibuja con UNA llamada (InstancedBufferGeometry de un quad, ≤ 64 instancias) el MISMO lenguaje que la funda de las armas encantadas (enchfx3d.js):
// ruido fbm procedural, rampa oscuro→color→claro→blanco, lo material tapa y lo luminoso suma (premultiplicado `ONE, ONE_MINUS_SRC_ALPHA`).
// Cada instancia es un quad orientado a cámara a lo largo de un EJE (arranque `A`, dirección `D`, largo `L`): para un cuerpo el eje es vertical (pies → cabeza, así las llamas SUBEN),
// para un ARCO entre dos enemigos el eje va de uno a otro. El cuerpo se aproxima con una cápsula de radio `rb` (sd = distancia con signo a la cápsula; < 0 dentro).
// Se adelanta hacia la cámara a lo largo de la vista (en ortográfica eso NO mueve la imagen, solo la profundidad): queda sobre el enemigo pero se oculta tras muros y árboles.
// DOS usos: (1) ESTADOS persistentes: cada fotograma `scan()` recorre los actores vivos y visibles con `e.sts` y pide una funda por estado con aspecto (`ST`);
// (2) DESTELLOS de un solo uso (`shot()`): impactos de encantamiento y REACCIONES (impact3d.js los pide), con vida `life` y envolvente (sube rápido, cae lento).
// MODOS del shader (`M`): 0 fuego · 1 costra de hielo · 2 escarcha que sube · 3 veneno · 4 electricidad · 5 humo del vacío · 6 ácido · 7 luz sagrada · 8 mojado · 9 sangre
//   · 10 vapor (nube que se hincha) · 11 nube tóxica · 12 columna de luz · 13 ARCO entre dos puntos · 14 estallido del vacío (implosión → explosión) · 15 destello de impacto.
// Un estado nuevo con aspecto = una fila en `ST` (modo + colores + ancho); un modo nuevo = una rama `M==n` en `FS`. Guía: docs/GUIA_VFX_ENCANTAMIENTOS.md §11.
import * as THREE from 'three';
const V3=THREE.Vector3,NMAX=64;
const VS=`
attribute vec2 aQ;                                  // x: 0 arranque · 1 punta ; y: -1 / +1 lado
attribute vec3 iA;attribute vec4 iD,iW,iP,iB;attribute vec3 iC1,iC2,iC3;
varying float vX,vY;varying vec2 vQ;varying vec4 vW,vP,vB;varying vec3 vC1,vC2,vC3;
void main(){
 vQ=aQ;vW=iW;vP=iP;vB=iB;vC1=iC1;vC2=iC2;vC3=iC3;
 vec3 fw=normalize(vec3(viewMatrix[0][2],viewMatrix[1][2],viewMatrix[2][2]));   // hacia la cámara, en mundo
 vec3 D=iD.xyz;vec3 s=cross(D,fw);float sl=length(s);s=sl>1e-4?s/sl:vec3(1.,0.,0.);
 float al=mix(-iW.y,iD.w+iW.z,aQ.x),off=aQ.y*iW.x;
 vX=al;vY=off;
 vec3 wp=iA+D*al+s*off+fw*iB.z;                     // iB.z = adelanto hacia la cámara (solo profundidad)
 gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.);}`;
const FS=`
uniform float uT;
varying float vX,vY;varying vec2 vQ;varying vec4 vW,vP,vB;varying vec3 vC1,vC2,vC3;
float ss(float a,float b,float x){float t=clamp((x-a)/(b-a),0.,1.);return t*t*(3.-2.*t);}   // admite bordes invertidos
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*vn(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
float star(vec2 p,float r){p=abs(p)/r;return max(exp(-p.x*7.-p.y*60.),exp(-p.y*7.-p.x*60.))+exp(-dot(p,p)*14.)*.6;}
vec3 ramp(float f){return f<.35?mix(vC3,vC1,f/.35):f<.72?mix(vC1,vC2,(f-.35)/.37):mix(vC2,vec3(1.,.97,.9),(f-.72)/.28);}
// celdas de Voronoi: x = distancia a la más cercana, y = borde (F2-F1), z = id de celda
vec3 vor(vec2 g){vec2 gi=floor(g),gf=fract(g);float f1=9.,f2=9.,id=0.;for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 o=vec2(float(i),float(j));vec2 c=o+vec2(h21(gi+o),h21(gi+o+17.3))-gf;float d=dot(c,c);if(d<f1){f2=f1;f1=d;id=h21(gi+o+3.1);}else if(d<f2)f2=d;}return vec3(sqrt(f1),sqrt(f2)-sqrt(f1),id);}
float rimN(float sd,float w,vec2 p,float t){return exp(-abs(sd)/w)*ss(.35,.75,vn(p*vec2(9.,5.)+vec2(0.,-t*.8)));}
void main(){
 int M=int(vW.w+.5);float x=vX,y=vY,L=max(vB.w,.05),R=vW.x,rb=vB.x,I=vP.x,sd0=vP.y*37.1,u=vP.z,hi=vP.w,t=uT+sd0;
 float cy=clamp(x,rb*.85,L-rb*.7),tp=mix(1.,.82,ss(L*.55,L,x));
 float sd=length(vec2(y,x-cy))-rb*tp;                // cápsula del cuerpo (más estrecha arriba)
 float o=max(sd,0.),ins=ss(.04,-.06,sd);
 vec3 add=vec3(0.),mc=vec3(0.);float ma=0.;
 if(M==0){ // FUEGO (Quemadura; Incinerar = hi 1 y colores más rojos): lenguas que nacen en la silueta y SUBEN; el cuerpo se ve «al rojo» por dentro
  float top=ss(0.,L,x),above=max(x-L*.85,0.);
  float reach=rb*(.4+.55*top)*(1.+.3*hi);
  float m=length(vec2(o,above*.5));
  float gap=.45+.75*vn(vec2(y*2.6+sd0,x*1.3-t*1.7));                    // huecos que suben: la llama nunca dibuja un contorno continuo
  float shape=exp(-m/reach)*mix(1.,.72,ins)*ss(-.1,L*.15,x)*gap;          // fuerte en la silueta, más débil dentro (se sigue viendo al enemigo) y alto sobre la cabeza
  float q=fbm(vec2(y*5.,x*2.7-t*3.2))+.38*vn(vec2(y*14.,x*7.-t*6.5));   // ruido que SUBE: rompe la masa en lenguas
  float f=clamp(shape*(.5+q*1.15)-.42+top*.08+.04*hi,0.,1.);
  add=ramp(f)*ss(.1,.42,f)*.9;
  float glow=ins*ss(.35,.75,fbm(vec2(y*7.,x*5.-t*1.5)));
  add+=vC1*glow*(.16+.07*sin(t*9.+x*14.))+vC2*exp(-abs(sd)/.02)*.16*top*(1.-hi);
  if(hi>.5){add+=vec3(1.,.55,.3)*ss(.75,.98,f)*.25;   // INCINERAR: núcleo casi blanco y humo negro que se eleva sobre la cabeza
   float sm=fbm(vec2(y*3.,x*2.2-t*1.1))*ss(L*.75,L+R*1.4,x)*exp(-abs(y)/(R*.7));ma=ss(.45,.75,sm)*.5;mc=vec3(.05,.025,.02);}
 } else if(M==1){ // COSTRA DE HIELO (Congelación): facetas de Voronoi translúcidas, aristas blancas, borde helado, vaho que cae a los pies
  float grow=u<0.?1.:ss(L*min(1.,u*3.2)+.08,L*min(1.,u*3.2)-.08,x);   // al formarse crece de los pies a la cabeza
  vec3 v=vor(vec2(y,x)*6.5+3.);
  float ice=ins*grow;
  float sh=.45+.55*v.z;
  mc=mix(vC3,mix(vC1,vC2,sh),.8);ma=ice*(.34+.14*sh)*(.75+.25*ss(L,0.,x));
  add=vC2*ice*ss(.06,0.,v.y)*.32+vC2*(exp(-abs(sd)/.02)*.4+rimN(sd,.04,vec2(y,x),t)*.6)*.3*grow+vC1*exp(-o/(R*.3))*.08;
  vec2 cg=vec2(y,x)*20.;float hh=h21(floor(cg));add+=vec3(1.)*star(fract(cg)-.5,.5)*pow(max(0.,sin(t*2.6+hh*60.)),10.)*step(.88,hh)*ice*.8;
  float mist=fbm(vec2(y*3.+t*.1,x*4.+t*.5))*ss(L*.45,0.,x)*exp(-o/(R*.6));add+=vC1*ss(.4,.85,mist)*.18;
 } else if(M==2){ // ESCARCHA (cargas 1–5): el hielo SUBE por las piernas hasta un nivel que crece con las cargas
  float lv=L*(.1+.17*vB.y)+(vn(vec2(y*9.,1.7))-.5)*.12;
  float fr=ins*ss(lv+.04,lv-.06,x);
  vec3 v=vor(vec2(y,x)*8.);
  mc=mix(vC1,vC2,.4+.5*v.z);ma=fr*.42;
  add=vC2*fr*ss(.06,0.,v.y)*.3+vC2*ins*exp(-abs(x-lv)/.025)*.4;   // frente de la escarcha brillante
  float mist=fbm(vec2(y*3.+t*.08,x*4.+t*.4))*ss(L*.35,0.,x)*exp(-o/(R*.6));add+=vC1*ss(.45,.9,mist)*.15*(.5+.15*vB.y);
 } else if(M==3){ // VENENO / TOXINA: tinte verde que late, hebras de vapor que suben y burbujas dentro
  float pu=.7+.3*sin(t*3.2);
  float aura=exp(-o/(rb*.35))*(1.-ins*.5);
  float n=fbm(vec2(y*3.2,x*2.2-t*1.1)),n2=fbm(vec2(y*6.,x*4.-t*1.8));
  float w=ss(.5,.8,n*.75+n2*.35)*exp(-o/(rb*.9))*ss(-.1,L*.35,x)*(1.-ins*.6);
  add=vC1*aura*.26*pu+vC2*w*(.22+.12*hi)+vC1*ins*.09*pu;
  mc=mix(vC3,vC1*.5,.35);ma=ins*(.22+.16*hi)*pu+w*.3;
  vec2 bg=vec2(y,x-t*.35)*9.;vec2 bi=floor(bg);float ph=fract(t*.5+h21(bi));float bd=length(fract(bg)-.5);
  add+=vC2*ss(.035,0.,abs(bd-.36*ph))*step(.72,h21(bi+5.))*ins*step(ph,.9)*.5;
  if(hi>.5){float vv=abs(fbm(vec2(y*7.,x*4.+t*.2))-.5);ma+=ss(.05,0.,vv)*ins*.35;mc=mix(mc,vec3(.02,.06,.01),.5);}
 } else if(M==4){ // ELECTRICIDAD (Electrizado / Sobrecarga = hi): arcos que reptan por el cuerpo y saltan fuera
  float fl=.6+.4*h21(vec2(floor(t*22.),1.));float lines=0.;
  for(int i=0;i<5;i++){float fi=float(i);if(fi>2.+hi*2.)break;float sdd=floor(t*10.+fi*.31)+fi*17.;
   float x0=mix(0.,L*.6,h21(vec2(sdd,1.))),x1=x0+L*(.25+.5*h21(vec2(sdd,2.)));
   float m=ss(x0,x0+.03,x)*ss(x1,x1-.03,x)*step(.2,h21(vec2(sdd,3.)));
   float amp=rb*(1.1+1.4*hi)*(h21(vec2(sdd,6.))-.5)*2.;
   float yb=(vn(vec2(x*6.,sdd))-.5)*rb*2.+amp*.4+(vn(vec2(x*24.,sdd+5.))-.5)*rb*.35;
   float d=abs(y-yb);lines+=m*(exp(-d/.008)+exp(-d/.04)*.35);}
  add=mix(vC1,vC2,clamp(lines*.7,0.,1.))*lines*1.1+vC1*ins*.05*fl+vC1*exp(-o/(rb*.4))*.07*fl;
 } else if(M==5){ // VACÍO (Maldición; Condena = hi): humo violeta oscuro arremolinado con hebras, que envuelve al enemigo
  float env=exp(-o/(rb*1.1))*(1.-ins*.25);
  vec2 p=vec2(y,x)*3.4;float w0=fbm(p*.7+vec2(t*.12,-t*.3));float n=fbm(p+vec2(0.,-t*.55)+w0*1.7);
  float pul=hi>.5?.75+.25*sin(t*(5.+9.*u)):1.;   // Condena: late cada vez más deprisa (u = fracción consumida)
  float dark=ss(.32,.64,n)*env;float fil=ss(.12,0.,abs(n-.6))*ss(.5,.62,w0)*env;   // volutas anchas y suaves, solo en parte del humo
  mc=mix(vC3,vC1*.28,.3+.3*ss(.6,.8,n));ma=dark*(.55+.2*hi)*pul;
  add=vC1*fil*.4*pul+vC1*rimN(sd,.04,vec2(y,x),t)*.25*pul+vC1*env*.04;
 } else if(M==6){ // ÁCIDO (Corrosión; Disolución = hi): brillo amarillo-verde, regueros que bajan y burbujas que revientan
  float col=floor(y*10.),hc=h21(vec2(col,4.));
  float st=ss(.12,0.,abs(fract(y*10.)-.5))*ss(0.,.25,fract(x*1.4+t*(.4+.3*hc)+hc))*step(.55,hc)*ins;
  vec2 bg=vec2(y,x)*11.;vec2 bi=floor(bg);float ph=fract(t*.8+h21(bi));float bd=length(fract(bg)-.5);
  float bub=ss(.04,0.,abs(bd-.38*ph))*step(.65,h21(bi+2.))*ins*step(ph,.85);
  add=vC2*(st*.35+bub*.5)+vC1*rimN(sd,.035,vec2(y,x),t)*.22+vC1*ins*(.04+.06*hi);
  mc=vC3;ma=ins*(.14+.22*hi);
  if(hi>.5){float vp=fbm(vec2(y*4.,x*3.-t*1.3));add+=vC1*ss(.45,.8,vp)*exp(-o/(R*.5))*ss(L*.2,L,x)*.6;}
 } else if(M==7){ // LUZ SAGRADA (Juicio): borde dorado, rayos que suben del suelo y destellos (sin anillos)
  float rim=rimN(sd,.06,vec2(y,x),t)+exp(-o/(rb*.45))*.35*(1.-ins);
  float ray=pow(abs(sin(y*11.+floor(t*.5)*1.7)),10.)*ss(L*1.25,0.,x)*exp(-o/(R*.6));
  float cr=ss(.15,0.,abs(fract(x*1.2-t*.6)-.5))*ins;   // franjas de luz que suben por el cuerpo
  vec2 cg=vec2(y,x)*14.;float hh=h21(floor(cg));float sp=star(fract(cg)-.5,.5)*pow(max(0.,sin(t*2.4+hh*50.)),8.)*step(.86,hh)*exp(-o/(R*.5));
  add=vC2*rim*.3+vC1*ray*.25+vC1*cr*.08+vec3(1.)*sp*.7;
 } else if(M==8){ // MOJADO: brillo frío en la silueta y regueros de agua que bajan; el cuerpo se ve algo más oscuro
  float col=floor(y*12.),hc=h21(vec2(col,8.));
  float ph=fract(x*2.2+t*(.7+.5*hc)+hc);float st=ss(.07,0.,abs(fract(y*12.)-.5))*ss(0.,.03,ph)*ss(.12,.03,ph)*step(.55,hc)*ins;   // gotitas cortas que resbalan (no hilos)
  add=vC2*rimN(sd,.02,vec2(y,x),t)*.12*ss(L*.2,L,x)+vC2*st*.35;
  mc=vC3;ma=ins*.14;
 } else if(M==9){ // SANGRE (Sangrado; Hemorragia = hi): venas que laten con un latido doble y un aura carmesí suave
  float b=fract(t*.75)*5.;float hb=exp(-pow(b-1.,2.)*7.)+.6*exp(-pow(b-1.75,2.)*7.);
  float vv=abs(fbm(vec2(y*7.,x*4.-t*.25))-.5);float vein=ss(.05,0.,vv)*ins;
  add=vC2*vein*(.25+.55*hb)*(1.+.5*hi)+vC1*exp(-o/(rb*.35))*(.1+.22*hb)*(1.+.6*hi);
  mc=vC3;ma=ins*.12*(1.+hi);
 } else if(M==10||M==11){ // VAPOR (blanco, sube) / NUBE TÓXICA (verde, rasante): nube que se hincha con la edad
  float tox=float(M==11);
  vec2 c=vec2(y,(x-L*mix(.5,.25,tox)-u*L*mix(.45,.1,tox))*mix(.85,1.4,tox));
  float rr=R*(.35+.75*ss(0.,.6,u))*mix(1.,1.15,tox);
  float shp=1.-length(c)/rr;
  float n=fbm(vec2(y,x)*2.3+vec2(0.,-t*mix(.9,.25,tox)))*.75+fbm(vec2(y,x)*5.2+vec2(t*.3,0.))*.4;
  float dens=ss(.2,.6,shp*.95+n*.8-.42);                               // bocanadas: el ruido rompe el contorno en grumos
  mc=mix(vC3,vC2,ss(.35,.95,n));ma=dens*mix(.42,.5,tox);
  add=vC1*dens*(.04+.08*n)*mix(1.,2.2,tox);
 } else if(M==12){ // COLUMNA DE LUZ (Purga, Sagrada, Arcana): haz que nace del suelo, se estrecha al apagarse, con chispas que suben
  float w=rb*(.55+.9*(1.-ss(0.,1.,u)));float b=exp(-y*y/(w*w*.3))*.75+exp(-y*y/(w*w*2.))*.25;
  float rise=fbm(vec2(y*6.,x*2.-t*3.));b*=(.65+.5*rise)*ss(-.1,.25,x)*exp(-max(x-L,0.)/(L*.9));   // se desvanece hacia arriba
  vec2 cg=vec2(y,x-t*1.5)*12.;float hh=h21(floor(cg));float sp=star(fract(cg)-.5,.45)*step(.85,hh)*exp(-abs(y)/(R*.5));
  add=mix(vC1,vC2,exp(-y*y/(w*w*.12)))*b*.75+vec3(1.)*exp(-y*y/(w*w*.04))*b*.25+vC2*sp*.7+vC1*exp(-o/(rb*.5))*.25*(1.-u);
 } else if(M==13){ // ARCO entre dos puntos (cadena eléctrica, salto de Incinerar, contagio de la Nube): zigzag que se regenera ~14 veces/s
  float sdd=floor(t*14.)+sd0;float e=ss(0.,L*.12,x)*ss(L,L*.88,x);
  float yb=((vn(vec2(x*5.,sdd))-.5)*.5+(vn(vec2(x*17.,sdd+3.))-.5)*.16)*e;
  float d=abs(y-yb);float br=exp(-pow((x/L-.5)*1.4,2.));
  float yb2=((vn(vec2(x*7.,sdd+9.))-.5)*.7)*e;float d2=abs(y-yb2);
  add=mix(vC1,vC2,exp(-d/.012))*(exp(-d/.01)*1.3+exp(-d/.05)*.4)+vC1*exp(-d2/.008)*.5*br*step(.5,h21(vec2(sdd,2.)));
 } else if(M==14){ // ESTALLIDO DEL VACÍO (Condena): implosión oscura con borde violeta → estallido de esquirlas de luz
  vec2 c=vec2(y,x-L*.55);float r=length(c),a=atan(c.y,c.x);
  if(u<.32){float k=u/.32,rr=R*(.95-.75*k);float n=fbm(vec2(a*2.,r*6.+t*2.));
   mc=vC3;ma=ss(rr,rr*.7,r+(n-.5)*.15)*.75;add=vC1*exp(-abs(r-rr)/.04)*(.6+.8*k);}
  else{float k=(u-.32)/.68,rr=R*(.1+1.1*ss(0.,1.,k));float sh=pow(abs(sin(a*7.+sd0*3.)),18.)*ss(rr*1.2,rr*.2,r)*(1.-k);
   add=mix(vC1,vC2,1.-k)*(sh*1.8+exp(-r/(R*.18))*(1.-k)*1.4)+vC1*exp(-abs(r-rr)/.06)*(1.-k)*.8;}
 } else { // 15 DESTELLO DE IMPACTO: estrella de rayos finos desde el punto del golpe + núcleo
  vec2 c=vec2(y,x-L*.55);float r=length(c),a=atan(c.y,c.x);float k=ss(0.,1.,u);
  float rays=0.;for(int i=0;i<6;i++){float fi=float(i),an=h21(vec2(fi,sd0))*6.283,ln=R*(.45+.55*h21(vec2(fi,sd0+2.)))*(.6+.6*k);float da=abs(sin(a-an));rays+=exp(-da*r/.012)*ss(ln,0.,r)*step(0.,cos(a-an));}
  add=mix(vC2,vec3(1.),.5)*rays*(1.-k)*1.4+mix(vC1,vC2,1.-k)*exp(-r/(R*.12))*(1.-k)*1.8+vC1*ins*.2*(1.-k);
 }
 float ef=ss(0.,.1,vQ.x)*ss(1.,.9,vQ.x)*ss(1.,.72,abs(vQ.y));   // se apaga ANTES del borde del quad: nunca se ve el rectángulo
 add*=ef*I;ma*=ef*I;
 float ga=clamp(max(add.r,max(add.g,add.b)),0.,1.);
 vec3 pc=add+mc*ma;float aa=1.-(1.-ma)*(1.-ga);if(aa<.003)discard;
 gl_FragColor=vec4(pc,ma);   // lo material tapa (alfa = ma); lo luminoso SUMA (alfa 0): es la escena principal, sin el grado del héroe
 #include <colorspace_fragment>
}`;
const col=h=>new THREE.Color(h);
// ── ESTADOS con funda: modo, colores [c1 principal, c2 claro, c3 oscuro], R = alcance (× radio del cuerpo), hi = versión fuerte. Clave = clave de STS.D.
const ST={
 burn:{m:0,c:['#ff4a08','#ffc860','#5a0a00'],R:2.6},
 incinerate:{m:0,c:['#c80c04','#ff3a14','#2a0000'],R:3,hi:1},   // el mismo fuego, más rojo, más alto y con humo negro
 freeze:{m:1,c:['#5ab4ff','#e8f8ff','#16406a'],R:2.2},
 chill:{m:2,c:['#7ac4ff','#eaf8ff','#2a5a8a'],R:2},
 poison:{m:3,c:['#4ac018','#c8ff5a','#0e3a08'],R:2.4},
 toxin:{m:3,c:['#2aff5a','#d8ff6a','#04260a'],R:2.8,hi:1},
 shock:{m:4,c:['#ffd23a','#fffbe8','#806000'],R:2.2},
 overload:{m:4,c:['#ffe85a','#ffffff','#806000'],R:2.8,hi:1},
 curse:{m:5,c:['#9a48ff','#ffa8f4','#1a0630'],R:2.6},
 doom:{m:5,c:['#c050ff','#ffb8ff','#0e0220'],R:3,hi:1},
 corrode:{m:6,c:['#c8e020','#f4ff90','#2a3204'],R:2},
 dissolve:{m:6,c:['#e0ff30','#ffffb0','#202a00'],R:2.6,hi:1},
 judgement:{m:7,c:['#ffc030','#fffbe0','#806020'],R:2.4},
 wet:{m:8,c:['#5aa8ff','#dff2ff','#0a2038'],R:1.6},
 bleed:{m:9,c:['#b0080e','#ff3a2a','#200002'],R:2},
 hemorrhage:{m:9,c:['#e0100e','#ff5a3a','#280002'],R:2.4,hi:1}};
for(const k in ST)ST[k].cc=ST[k].c.map(col);
// ── DESTELLOS de un solo uso (impact3d.js): modo, colores, R (× radio), vida (s), alto extra sobre la cabeza (× alto)
const SHOT={
 fuego:{m:0,c:['#ff4a08','#ffd070','#5a0a00'],R:3.4,life:.75,up:.6},
 infernal:{m:0,c:['#c80c04','#ff4a1a','#2a0000'],R:4,life:.9,up:.8,hi:1},
 hielo:{m:1,c:['#5ab4ff','#f0faff','#16406a'],R:2.4,life:.8,up:.15},
 veneno:{m:3,c:['#4ac018','#d8ff6a','#0e3a08'],R:3,life:.8,up:.4},
 toxica:{m:3,c:['#2aff5a','#e0ff7a','#04260a'],R:3.4,life:1,up:.5,hi:1},
 rayo:{m:4,c:['#ffd23a','#ffffff','#806000'],R:2.8,life:.45,up:.3,hi:1},
 vacio:{m:5,c:['#9a48ff','#ffa8f4','#1a0630'],R:3,life:.9,up:.5},
 acido:{m:6,c:['#e0ff30','#ffffb0','#202a00'],R:2.6,life:.8,up:.3,hi:1},
 sangre:{m:9,c:['#d00c10','#ff5a3a','#280002'],R:2.6,life:.55,up:.2,hi:1},
 vapor:{m:10,c:['#c8d8e8','#ffffff','#8898a8'],R:4.2,life:1.4,up:1.3},
 humo:{m:10,c:['#5a5a5a','#b8b8b8','#2a2a2a'],R:3,life:1.1,up:.9},
 nube:{m:11,c:['#7aff3a','#b8ff7a','#1a4a0a'],R:6,life:2.2,up:.4},
 pilar:{m:12,c:['#ffc030','#fffbe0','#806020'],R:2.4,life:.85,up:1.6},
 arcana:{m:12,c:['#5a78ff','#e4ecff','#0a1040'],R:2.2,life:.8,up:1.3},
 condena:{m:14,c:['#c050ff','#ffd8ff','#08000f'],R:4.2,life:1.1,up:.6},
 flash:{m:15,c:['#ffe0a0','#ffffff','#806040'],R:3,life:.26,up:.3},
 flashRayo:{m:15,c:['#ffe060','#ffffff','#806000'],R:3.4,life:.24,up:.3},
 flashHielo:{m:15,c:['#9ad8ff','#ffffff','#2a5a8a'],R:3.2,life:.3,up:.3},
 arcoRayo:{m:13,c:['#ffd23a','#ffffff','#806000'],life:.35},
 arcoFuego:{m:13,c:['#e0200a','#ffa060','#3a0000'],life:.45},
 arcoVeneno:{m:13,c:['#4ac018','#d8ff6a','#0e3a08'],life:.5}};
for(const k in SHOT)SHOT[k].cc=SHOT[k].c.map(col);
const _bx=new THREE.Box3(),_d=new V3();
export class BodyFx{
 constructor(scene,W3,refs){this.W3=W3;this.refs=refs||{};this.t=0;this.ts=1;this.shots=[];this.n=0;
  const g=new THREE.InstancedBufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(12),3));g.setAttribute('aQ',new THREE.BufferAttribute(new Float32Array([0,-1,1,-1,1,1,0,1]),2));g.setIndex([0,1,2,0,2,3]);
  const ia=(n)=>{const a=new THREE.InstancedBufferAttribute(new Float32Array(NMAX*n),n);a.setUsage(THREE.DynamicDrawUsage);return a};
  this.A={iA:ia(3),iD:ia(4),iW:ia(4),iP:ia(4),iB:ia(4),iC1:ia(3),iC2:ia(3),iC3:ia(3)};for(const k in this.A)g.setAttribute(k,this.A[k]);
  g.instanceCount=0;g.boundingSphere=new THREE.Sphere(new V3(),1e6);   // la posición real sale del shader: esfera enorme para que nunca se descarte
  this.u={uT:{value:0}};
  const m=new THREE.ShaderMaterial({uniforms:this.u,vertexShader:VS,fragmentShader:FS,transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,
   blending:THREE.CustomBlending,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor,blendSrcAlpha:THREE.OneFactor,blendDstAlpha:THREE.OneMinusSrcAlphaFactor});
  this.obj=new THREE.Mesh(g,m);this.obj.renderOrder=38;this.obj.visible=false;this.obj.matrixAutoUpdate=false;this.geo=g;scene.add(this.obj)}
 // pies, centro, alto y radio REALES del enemigo (caja del modelo, una vez por actor; tpl.h/rad no son medidas de mundo). El jugador usa la posición del héroe.
 where(m){const isP=typeof P!=='undefined'&&m===P;
  if(isP&&this.refs.hero&&this.refs.hero.obj){const b=this.refs.hero.obj.position;return{base:b.clone(),c:new V3(b.x,b.y+.6,b.z),h:1.1,rad:.28}}
  const A=this.refs.actors&&this.refs.actors.map.get(m);
  if(A){if(A._ah==null){const b=_bx.setFromObject(A.grp);A._ah=Math.max(.5,Math.min(3.5,b.max.y-b.min.y));A._ar=Math.max(.2,Math.min(1.3,Math.max(b.max.x-b.min.x,b.max.z-b.min.z)*.45))}
   const b=A.grp.position;return{base:b.clone(),c:new V3(b.x,b.y+A._ah*.55,b.z),h:A._ah,rad:A._ar}}
  const b=this.W3(m.x,m.y,typeof TER!=='undefined'?TER.standZ(m.x,m.y):1);return{base:b,c:new V3(b.x,b.y+.5,b.z),h:.9,rad:.32}}
 // escribe una instancia: A = arranque, D = dirección unitaria, L = largo, R = medio ancho, e0/e1 = extra bajo/sobre el eje, rb = radio del cuerpo, push = adelanto hacia la cámara
 put(Ax,Ay,Az,Dx,Dy,Dz,L,R,e0,e1,m,cc,I,seed,u,hi,rb,n,push){if(this.n>=NMAX)return;const i=this.n++,A=this.A;
  A.iA.array.set([Ax,Ay,Az],i*3);A.iD.array.set([Dx,Dy,Dz,L],i*4);A.iW.array.set([R,e0,e1,m],i*4);A.iP.array.set([I,seed,u,hi],i*4);A.iB.array.set([rb,n,push,L],i*4);
  A.iC1.array.set([cc[0].r,cc[0].g,cc[0].b],i*3);A.iC2.array.set([cc[1].r,cc[1].g,cc[1].b],i*3);A.iC3.array.set([cc[2].r,cc[2].g,cc[2].b],i*3)}
 body(W,f,I,seed,u,n,extraUp){const R=W.rad*f.R;this.put(W.base.x,W.base.y,W.base.z,0,1,0,W.h,R+W.rad,.12,W.h*(extraUp||.45)+R*.4,f.m,f.cc,I,seed,u,f.hi||0,W.rad,n||0,W.rad+.5)}
 // DESTELLO de un solo uso sobre el enemigo `m` (sigue al enemigo mientras dura) · k = potencia (1 normal)
 shot(m,kind,k){const f=SHOT[kind];if(!f||!m)return;k=k||1;this.shots.push({m,f,t0:this.t,life:f.life*(.85+.15*k),k,seed:Math.random(),arc:null});this.obj.visible=true}
 // ARCO entre dos enemigos (cadena eléctrica, salto de Incinerar, contagio de la Nube tóxica)
 arc(a,b,kind){const f=SHOT[kind||'arcoRayo'];if(!f||!a||!b)return;this.shots.push({m:a,b,f,t0:this.t,life:f.life,k:1,seed:Math.random(),arc:1});this.obj.visible=true}
 // ESTADOS: cada fotograma, una funda por estado con aspecto (los dos de mayor prioridad por enemigo: más no se lee)
 scan(){if(typeof STS==='undefined'||!this.refs.actors)return;const mx=typeof QL!=='undefined'&&QL>=3?1:2;   // Baja/Mínima: una funda por enemigo
  for(const [e,A] of this.refs.actors.map){if(!e.sts||!A.vis||A.state!=='live')continue;const L=STS.list(e);if(!L.length)continue;let W=null,c=0;
   for(const s of L){const f=ST[s.k];if(!f)continue;if(!W)W=this.where(e);
    const el=s.tot-s.rem,I=Math.min(1,el/220)*Math.min(1,s.rem/380)*(s.k==='chill'?.75+.05*s.n:1);   // aparece en 0,22 s y se apaga en los últimos 0,38 s
    this.body(W,f,I,(e._sd||(e._sd=Math.random())),s.k==='doom'?el/s.tot:-1,s.n||1);if(++c>=mx)break}
   if(this.n>=NMAX-8)break}}
 update(dt){dt*=this.ts;this.t+=dt;   /* ts: escala de tiempo (solo PRUEBAS: R3D.body.ts=0 congela para capturar) */this.u.uT.value=this.t%1000;this.n=0;this.scan();
  for(let i=this.shots.length-1;i>=0;i--){const S=this.shots[i],u=(this.t-S.t0)/S.life;if(u>=1||!S.m){this.shots.splice(i,1);continue}
   const f=S.f,I=Math.min(1,u/.08)*Math.pow(1-u,1.2)*(f.m===12||f.m===14||f.m===15?1:Math.min(1.3,.75+.35*S.k));   // sube rápido, cae lento
   if(S.arc){const a=this.where(S.m).c,b=this.where(S.b).c;_d.subVectors(b,a);const L=_d.length();if(L<.05)continue;_d.multiplyScalar(1/L);this.put(a.x,a.y,a.z,_d.x,_d.y,_d.z,L,.55,.05,.05,f.m,f.cc,Math.min(1,u/.05)*(1-u*u),S.seed,u,0,.2,0,.6);continue}
   const W=this.where(S.m);this.body(W,{m:f.m,cc:f.cc,R:f.R*Math.min(1.25,.8+.2*S.k),hi:f.hi},I,S.seed,u,0,f.up)}
  this.geo.instanceCount=this.n;this.obj.visible=this.n>0;if(this.n)for(const k in this.A){const a=this.A[k];a.needsUpdate=true;a.clearUpdateRanges();a.addUpdateRange(0,this.n*a.itemSize)}}
}
