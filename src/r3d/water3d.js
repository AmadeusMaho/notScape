// NotScape · R3D · Lote R3D-AGUA-IMPL (19 oct 2026) · AGUA «D» (óleo híbrido) CON FÍSICA, portada de tools/r3d/agua_fisica_demo.html (referencia aprobada por el dueño).
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// QUÉ HAY AQUÍ (todo lo del agua 3D; terrain3d.js solo construye la malla y le pone `WaterMat`)
//   · WU            uniformes compartidos del agua (r3d.js pone los colores por hora: WU.uDeep/uShal; la luz sale de TOD en `Water.update`).
//   · waterMat()    material D: bandas por profundidad con la pincelada rota, cáusticas finas, orilla translúcida, espuma con swash, brillo del sol y del cielo,
//                   posterizado suave. ESTANQUES Y LAGOS EN CALMA (sin oleaje ambiental); el OLEAJE (3 olas Gerstner en los vértices) solo existe donde aSwell>0 (el MAR).
//   · WaterSim      ecuación de onda amortiguada en una VENTANA de 20×20 tiles (160×160 celdas) que sigue al jugador: c² ∝ profundidad, orilla amortiguadora, tierra = pared.
//                   Se vuelca a una textura RGBA8 (pendiente, altura, energía) que lee el FRAGMENTO. Se duerme sola (coste 0 sin movimiento).
//   · Water         el «director»: chapuzones (`splash`), peces ambientales que MUEVEN el agua al nadar y saltar, gotas balísticas que vuelven a caer en el agua, y la PESCA
//                   (flotador 3D que lee la altura real, lanzamiento en arco, picadas, captura).  API para game.js:  R3D.water.splash(x,y,kind) · R3D.water.event(kind,e).
// REGLAS DE ESCALA (docs/PLAN_AGUA_D.md §3): 1 tile = 1 unidad; profundidad máxima del juego ≈ 0,28 (la demo ≈ 0,9 → uDepthK 3,2); las cifras de la demo se multiplican por
//   SC=1,7 (1 unidad de demo ≈ 1,7 tiles). TAMAÑOS DE LOS ANIMALES: el héroe mide ≈ 1 unidad (≈ 1,75 m) → un pez de 25–45 cm = 0,15–0,26 (ver `FISH_LEN`); NO usar SC en tamaños de cuerpos.
// CALIDAD (QL de r3d.js): 0–2 simulación + peces + gotas completos · 3–4 sin simulación ni peces (solo el color D y las gotas de pesca).
// COLORES: la demo trabajaba en sRGB con ColorManagement apagado; aquí el shader trabaja en LINEAL (como el resto del juego) y termina con `colorspace_fragment`.
import * as THREE from 'three';
import {G,INK,INKS} from './materials3d.js';

const V3=THREE.Vector3,TAU=Math.PI*2;
const cl=(v,a,b)=>v<a?a:v>b?b:v,rnd=(a,b)=>a+Math.random()*(b-a),lerp=(a,b,k)=>a+(b-a)*Math.min(1,Math.max(0,k)),sstep=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const SC=1.7,LVY=.6415,WY=(.75-1)*LVY,DEPTH_K=3.2;   // altura de la lámina de agua y factor profundidad juego → demo

// ── texturas compartidas (256²): R/B ruido, G red de cáusticas (Voronoi), A chispas; normales aparte. Se generan al arrancar (~100 ms), sin archivos. ──
function makeTextures(){
 const S=256,data=new Uint8Array(S*S*4),nd=new Uint8Array(S*S*4);
 const hs=(x,y,s)=>{let h=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,1442695041);h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return(h>>>0)/4294967296};
 const vn=(x,y,per,s)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);const g=(i,j)=>hs(((i%per)+per)%per,((j%per)+per)%per,s);
  return(g(xi,yi)*(1-u)+g(xi+1,yi)*u)*(1-v)+(g(xi,yi+1)*(1-u)+g(xi+1,yi+1)*u)*v};
 const fbm=(px,py,s)=>{let a=.5,t=0,n=0;for(let o=0;o<4;o++){const per=8<<o;t+=a*vn(px/S*per,py/S*per,per,s+o);n+=a;a*=.5}return t/n};
 const CN=8,pts=[];for(let j=0;j<CN;j++)for(let i=0;i<CN;i++)pts.push([hs(i,j,91),hs(i,j,92)]);
 const vor=(px,py)=>{const x=px/S*CN,y=py/S*CN,xi=Math.floor(x),yi=Math.floor(y);let f1=9,f2=9;
  for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const ci=xi+di,cj=yi+dj,w=pts[((cj%CN+CN)%CN)*CN+((ci%CN+CN)%CN)];const d=Math.hypot(ci+w[0]-x,cj+w[1]-y);if(d<f1){f2=f1;f1=d}else if(d<f2)f2=d}return f2-f1};
 const H=new Float32Array(S*S);
 for(let y=0;y<S;y++)for(let x=0;x<S;x++){const i=(y*S+x)*4,ed=vor(x,y),line=Math.pow(1-sstep(0,.3,ed),2);
  data[i]=fbm(x,y,1)*255;data[i+1]=line*255;data[i+2]=fbm(x,y,7)*255;data[i+3]=hs(x,y,5)>.975?255:0;H[y*S+x]=fbm(x,y,31)*.75+vn(x/S*128,y/S*128,128,40)*.25}
 const at=(x,y)=>H[((y+S)%S)*S+((x+S)%S)];
 for(let y=0;y<S;y++)for(let x=0;x<S;x++){const i=(y*S+x)*4,nx=(at(x-1,y)-at(x+1,y))*14,ny=(at(x,y-1)-at(x,y+1))*14;
  nd[i]=cl((nx*.5+.5)*255,0,255);nd[i+1]=cl((ny*.5+.5)*255,0,255);nd[i+2]=H[y*S+x]*255;nd[i+3]=255}
 const mk=d=>{const t=new THREE.DataTexture(d,S,S,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t};
 return{tex:mk(data),nrm:mk(nd)}}

// ── la simulación ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const SIM_N=160,SIM_W=20,DX=SIM_W/SIM_N,C0=2.2*SC,DT=1/120,GK=1.2,HK=4;
class WaterSim{
 constructor(terr){this.terr=terr;const n=SIM_N*SIM_N;this.h=new Float32Array(n);this.v=new Float32Array(n);this.c2=new Float32Array(n);this.dm=new Float32Array(n);this.depth=new Float32Array(n);
  this.data=new Uint8Array(n*4);this.tex=new THREE.DataTexture(this.data,SIM_N,SIM_N,THREE.RGBAFormat);this.tex.magFilter=this.tex.minFilter=THREE.LinearFilter;this.tex.wrapS=this.tex.wrapT=THREE.ClampToEdgeWrapping;this.tex.generateMipmaps=false;
  this.cx=-1e9;this.cz=-1e9;this.ox=0;this.oz=0;this.has=false;this.acc=0;this.act=0;this.ms=0;this.awake=false;this.fillMs=0;this.upload()}
 inside(x,z,m){return x>=this.ox+m&&x<=this.ox+SIM_W-m&&z>=this.oz+m&&z<=this.oz+SIM_W-m}
 // recentra la ventana (cx,cz en tiles, se ajusta a múltiplos de 2) y recalcula profundidad/velocidad/amortiguación. Solo evalúa terr.field() en tiles con agua cerca.
 recenter(cx,cz){const T0=performance.now(),t=this.terr;cx=Math.round(cx/2)*2;cz=Math.round(cz/2)*2;if(cx===this.cx&&cz===this.cz)return;this.cx=cx;this.cz=cz;this.ox=cx-SIM_W/2;this.oz=cz-SIM_W/2;
  this.h.fill(0);this.v.fill(0);this.c2.fill(0);this.dm.fill(.99);this.depth.fill(0);this.has=false;
  for(let j=0;j<SIM_N;j++){const z=this.oz+(j+.5)*DX,tz=Math.floor(z);for(let i=0;i<SIM_N;i++){const x=this.ox+(i+.5)*DX,tx=Math.floor(x);
    if(t.h(tx,tz)!==.75&&!t.near(tx,tz,.75))continue;
    const d=WY-t.field(x,z).y,k=j*SIM_N+i;this.depth[k]=d;
    if(d>.012){const dd=d*DEPTH_K;this.c2[k]=C0*C0*cl(dd/.5,.12,1);this.dm[k]=.9935*(1-.018*(1-sstep(.03,.25,dd)));this.has=true}}}
  this.acc=0;this.act=0;this.awake=false;this.fillMs=performance.now()-T0;this.upload()}
 cell(x,z){return[(x-this.ox)/DX-.5,(z-this.oz)/DX-.5]}
 // depresión gaussiana (amt>0 hunde, <0 levanta); rad en tiles
 dent(x,z,amt,rad){if(!this.has)return;const[ci,cj]=this.cell(x,z),r=Math.max(1.2,rad/DX),R=Math.ceil(r*2.2);
  for(let j=Math.max(1,Math.floor(cj-R));j<=Math.min(SIM_N-2,Math.ceil(cj+R));j++)for(let i=Math.max(1,Math.floor(ci-R));i<=Math.min(SIM_N-2,Math.ceil(ci+R));i++){
   const k=j*SIM_N+i;if(!this.c2[k])continue;const d2=((i-ci)*(i-ci)+(j-cj)*(j-cj))/(r*r);this.h[k]-=amt*Math.exp(-d2*1.6)}
  this.awake=true}
 height(x,z){const[ci,cj]=this.cell(x,z),i=Math.floor(ci),j=Math.floor(cj);if(i<0||j<0||i>=SIM_N-1||j>=SIM_N-1)return 0;const fx=ci-i,fz=cj-j,k=j*SIM_N+i,h=this.h;
  return(h[k]*(1-fx)+h[k+1]*fx)*(1-fz)+(h[k+SIM_N]*(1-fx)+h[k+SIM_N+1]*fx)*fz}
 slope(x,z,o){const e=DX;o.x=(this.height(x+e,z)-this.height(x-e,z))/(2*e);o.z=(this.height(x,z+e)-this.height(x,z-e))/(2*e);return o}
 depthAt(x,z){const[ci,cj]=this.cell(x,z),i=Math.round(ci),j=Math.round(cj);return i<0||j<0||i>=SIM_N||j>=SIM_N?0:this.depth[j*SIM_N+i]}
 step(){const N=SIM_N,h=this.h,v=this.v,c2=this.c2,dm=this.dm,k0=DT/(DX*DX);let mx=0;
  for(let j=1;j<N-1;j++){let k=j*N+1;for(let i=1;i<N-1;i++,k++){const c=c2[k];if(c)v[k]+=c*(h[k-1]+h[k+1]+h[k-N]+h[k+N]-4*h[k])*k0}}
  for(let k=0;k<N*N;k++){if(!c2[k]){h[k]=0;v[k]=0;continue}v[k]*=dm[k];h[k]+=v[k]*DT;const a=Math.abs(v[k]);if(a>mx)mx=a}
  this.act=mx}
 update(dt){const t0=performance.now();this.acc=Math.min(this.acc+dt,4*DT);
  if(this.has&&(this.awake||this.act>2e-4)){while(this.acc>=DT){this.step();this.acc-=DT}this.awake=false;this.upload();this.on=true}else{this.acc=0;if(this.on){this.on=false;this.h.fill(0);this.v.fill(0);this.upload()}}
  this.ms+=((performance.now()-t0)-this.ms)*.1}
 upload(){const N=SIM_N,h=this.h,v=this.v,d=this.data,s=1/(2*DX);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const k=j*N+i,o=k*4,l=i>0?k-1:k,r=i<N-1?k+1:k,u=j>0?k-N:k,dn=j<N-1?k+N:k;
   d[o]=cl((.5+(h[r]-h[l])*s*GK*.5)*255,0,255);d[o+1]=cl((.5+(h[dn]-h[u])*s*GK*.5)*255,0,255);d[o+2]=cl((.5+h[k]*HK)*255,0,255);d[o+3]=cl(Math.abs(v[k])*.9*255,0,255)}
  this.tex.needsUpdate=true}
}

// ── material D ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const TX=makeTextures();
export const WU={uDeep:{value:new THREE.Color('#2a7478')},uShal:{value:new THREE.Color('#6cb5a4')},uLight:{value:new THREE.Color('#b0e0cf')},uFoam:{value:new THREE.Color('#c3cdc2')},uGlint:{value:new THREE.Color('#ffd7a8')},
 uNight:G.uNight,uTime:G.uTime,uQ:{value:2},uTex:{value:TX.tex},uNrm:{value:TX.nrm},uSim:{value:null},uSimO:{value:new THREE.Vector2(-1e9,-1e9)},uSimS:{value:SIM_W},uSimOn:{value:0},uPK:{value:1},
 uSun:{value:new V3(.55,.75,.35)},uSunCol:{value:new V3(1,.95,.82)},uSunI:{value:1},uHor:{value:new THREE.Color('#cfe8f0')},uZen:{value:new THREE.Color('#6aaee0')},uSkyA:{value:.8},uTone:{value:new V3(1,1,1)},uRef:{value:null},uRefM:{value:new THREE.Matrix4()},uRefOn:{value:0},uWS:{value:1/SC},uDK:{value:DEPTH_K},uClear:{value:0},uCA:{value:new THREE.Color('#00aee6')},uCB:{value:new THREE.Color('#5eeaff')},uCK:{value:1}};   // uClear 0..1 = AGUA CRISTALINA (zona del Cielo, ISLA-2): más transparente, turquesa claro, sin tinta en la orilla
const WVS=`attribute float aDepth;attribute float aSwell;varying float vD;varying vec3 vW;varying vec3 vNw;varying float vH;uniform float uTime,uQ;
void main(){vD=aDepth;vec3 p=position;float m=smoothstep(0.,.4,aDepth*${DEPTH_K.toFixed(1)})*step(.5,uQ)*aSwell;
 // oleaje del MAR: 3 olas Gerstner que viajan hacia la costa (el mar está al sur = +z → las olas van hacia −z); el estanque/lago (aSwell=0) es plano
 vec2 d1=vec2(.34,-.94),d2=vec2(-.3,-.95),d3=vec2(.6,-.8);
 float f1=.9*dot(d1,p.xz)-uTime*1.0,f2=1.45*dot(d2,p.xz)-uTime*1.35;
 float s1=sin(f1),c1=cos(f1),s2=sin(f2),c2=cos(f2);
 float y=.075*s1+.04*s2;vec2 hz=d1*(.2/.9)*.4*c1+d2*(.2/1.45)*.3*c2;
 vec2 g=-(d1*.9*.075*c1+d2*1.45*.04*c2);float ny=1.-.07*s1-.07*s2;
 if(uQ>1.5){float f3=2.3*dot(d3,p.xz)-uTime*1.7;float s3=sin(f3),c3=cos(f3);y+=.022*s3;hz+=d3*(.2/2.3)*.3*c3;g-=d3*2.3*.022*c3;ny-=.07*s3;}
 p.y+=y*m;p.xz+=hz*m;vH=y*m;vNw=normalize(vec3(g.x*m,mix(1.,max(ny,.35),m),g.y*m));
 vec4 w=modelMatrix*vec4(p,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`;
const WFS=`uniform float uTime,uQ,uSunI,uSkyA,uPK,uSimS,uSimOn,uNight,uWS,uDK,uClear,uCK;uniform vec3 uCA,uCB;uniform sampler2D uTex,uNrm,uSim;uniform vec3 uSun,uSunCol,uTone;uniform sampler2D uRef;uniform mat4 uRefM;uniform float uRefOn;uniform vec3 uHor,uZen,uShal,uDeep,uLight,uFoam,uGlint;uniform vec2 uSimO;
varying float vD;varying vec3 vW;varying vec3 vNw;varying float vH;
void main(){
 if(vD<.0012)discard;
 float t=uTime;vec2 p=vW.xz/uWS*.5;vec2 pw=vW.xz;float d=vD*uDK;   // p = coordenadas «de la demo» (1 unidad de demo ≈ 1,7 tiles): conservan el tamaño en pantalla de la pincelada y las cáusticas
 float wr=texture2D(uTex,p*.09+vec2(t*.02,t*.014)).r;
 vec2 q=p+(wr-.5)*1.4;
 float br=wr;
 if(uQ>.5){vec2 r=vec2(p.x*.82-p.y*.57,p.x*.57+p.y*.82);br=texture2D(uTex,r*vec2(.08,.32)+vec2(t*.024,t*.006)).b;}
 // simulación: pendiente (normal), altura y energía (espuma de cresta)
 vec2 st=(pw-uSimO)/uSimS;float ins=step(0.,st.x)*step(st.x,1.)*step(0.,st.y)*step(st.y,1.)*uSimOn;
 vec4 sm=texture2D(uSim,st);vec2 sg=(sm.rg-.5)/(${GK.toFixed(1)}*.5)*ins*uPK;float sh=(sm.b-.5)/${HK.toFixed(1)}*ins*uPK;
 float e=d+(br-.5)*.18+(wr-.5)*.08;
 vec3 mid=mix(uShal,uDeep,.5);
 vec3 c=uShal;c=mix(c,mid,smoothstep(.1,.24,e));c=mix(c,uDeep,smoothstep(.34,.52,e)*.58);
 c*=.86+.28*br;
 c=mix(c,uShal*vec3(.88,1.06,.84),smoothstep(.5,.8,wr)*.3*(1.-smoothstep(.2,.6,d)*.5));
 if(uQ>.5){float cg=texture2D(uTex,q*.68+(br-.5)*.5+sg*.35+vec2(t*.035,t*.022)).g;
  float ln=smoothstep(.62,.82,cg)*(.4+.6*smoothstep(.3,.7,br))*(1.-.5*smoothstep(.2,.7,d))*(1.-uNight*.7);c=mix(c,uLight,ln*.1);}
 if(uClear>.001){vec3 cr=mix(uCA,uCB,smoothstep(.0,.4,br+.25*(1.-smoothstep(.0,.5,d))));float cs=texture2D(uTex,pw*.28+vec2(t*.03,t*.02)).g,cs2=texture2D(uTex,pw*.41-vec2(t*.025,t*.03)).g;cr+=vec3(.55,.95,.95)*(smoothstep(.6,.84,cs)+smoothstep(.62,.86,cs2))*.32;c=mix(c,cr,uClear*uCK);}   // CRISTALINO: ahora es el COLOR BASE (antes se aplicaba al FINAL y borraba la espuma/brillos de la simulación: el agua del Cielo no mostraba ondas ni chapuzones)

 vec3 N=normalize(vec3(vNw.x*1.8-sg.x*8.*.6,vNw.y,vNw.z*1.8-sg.y*8.*.6));
 if(uQ>1.5){vec2 n2=texture2D(uNrm,p*.44+vec2(t*.03,t*.02)).xy*2.-1.;N=normalize(N+vec3(n2.x,0.,n2.y)*(.22-.16*(1.-step(.001,vH+abs(vNw.x)+abs(vNw.z)))));}
 vec3 L=normalize(uSun);vec3 V=normalize(cameraPosition-vW);
 float hh=vH+sh;float sl=dot(N,L)-L.y;c*=clamp(1.+sl*2.4+hh*.6,.8,1.3);
 c=mix(c,uShal*1.3+uLight*.12,smoothstep(.06,.12,hh)*.22);
 vec3 H=normalize(L+V);float nh=max(dot(N,H),0.);
 c+=uGlint*uSunCol*(pow(nh,36.)*.1+pow(nh,220.)*.28)*uSunI;   // brillo especular suavizado (antes parecía plástico)
 float f=pow(1.-clamp(dot(N,V),0.,1.),2.5);
 c=mix(c,mix(uHor,uZen,smoothstep(0.,1.,V.y*1.3)),uSkyA*(.1+.5*f)*(.5+.5*smoothstep(.45,.7,br)));
 vec3 fc=uFoam*mix(vec3(1.),uSunCol,.6);
 float fe=e+.012*sin(d*40.-t*2.2)+.028*sin(t*1.2+pw.x*.9+pw.y*.7);
 float b1=smoothstep(0.,.012,fe)*(1.-smoothstep(.03,.045,fe));
 float b2=smoothstep(.1,.112,fe)*(1.-smoothstep(.125,.137,fe))*smoothstep(.45,.55,wr+.05*sin(pw.x*3.));
 float sk=texture2D(uTex,vec2(pw.x*.55+pw.y*.25,pw.y*1.7-pw.x*.3)+vec2(t*.008,0.)).b,stroke=step(.4,sk);   // R3D-AGUA-ARTSTYLE: la espuma son TRAZOS de pincel de borde duro, no un degradado
 float fb=max(b1*(.3+.7*stroke),b2*.8*stroke);c=mix(c,fc,smoothstep(.28,.4,fb)*.7);
 // R3D-AGUA-ARTSTYLE: línea de TINTA en el borde del agua (como el contorno de todo lo demás del juego, #2a1c1a) en trazo irregular
 float inkM=(1.-smoothstep(.004,.016+.012*wr,d))*(.55+.45*br);c=mix(c,vec3(.022,.013,.011),inkM*.62*(1.-uNight*.3)*(1.-.85*uClear));
 // REFLEJO LIGERO (planar, baja resolución, desenfocado + posterizado: árboles/rocas/casas junto a la orilla se leen como manchas de color)
 if(uRefOn>.5){vec4 rp=uRefM*vec4(vW,1.);vec2 ru=rp.xy/rp.w+sg*.05+N.xz*.018+(wr-.5)*.006;
  vec4 r0=texture2D(uRef,ru)+texture2D(uRef,ru+vec2(.012,0.))+texture2D(uRef,ru-vec2(.012,0.))+texture2D(uRef,ru+vec2(0.,.02))+texture2D(uRef,ru-vec2(0.,.02));r0/=5.;
  vec3 rc=floor(r0.rgb*6.+.5)/6.;rc=mix(vec3(dot(rc,vec3(.2126,.7152,.0722))),rc,.8)*vec3(.9,1.,1.05);
  float rk=r0.a*.24*(.45+.55*f)*(1.-smoothstep(.0,.05,.012-d))*smoothstep(.006,.05,d)*(1.-clamp(abs(vH+sh)*7.,0.,.6));c=mix(c,rc*uTone,clamp(rk,0.,.26));}
 // espuma de cresta: sim (chapuzón/salto) y rompiente del mar (la cresta cerca de la orilla se aclara en pinceladas, nunca franjas blancas)
 float brk=smoothstep(.06,.13,vH)*(1.-smoothstep(.05,.25,d))*smoothstep(.4,.7,br);
 c=mix(c,fc,(smoothstep(.62,.7,sm.a*ins+(br-.5)*.25)*.3*uPK+smoothstep(.2,.3,brk*stroke)*.42));
 if(uQ>1.5){vec4 s=texture2D(uTex,p*.3+vec2(t*.012,0.));float tw=smoothstep(.7,1.,s.a)*pow(.5+.5*sin(t*2.6+s.r*50.),3.);c+=uGlint*uSunCol*tw*1.2*uSunI*(1.-uNight*.5);}
 vec3 qz=floor(c*5.+.5+(br-.5)*.9)/5.;c=mix(c,qz,.28*(1.-.6*uClear));
 float lu=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(lu),c,.86);
   // CRISTALINO: turquesa saturado que aclara con la orilla + CÁUSTICAS que bailan (dos capas) y se ve el fondo claro (alpha bajo)   // menos saturación: encaja con la paleta óleo del terreno
 c*=uTone;
 gl_FragColor=vec4(c,mix(mix(.4,.42,uClear),mix(.84,.7,uClear),smoothstep(0.,.5,d))*smoothstep(0.,.004,d));
 #include <colorspace_fragment>
}`;
export function waterMat(){return new THREE.ShaderMaterial({uniforms:WU,transparent:true,depthWrite:false,vertexShader:WVS,fragmentShader:WFS})}

// ── chapuzones ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// kind → amp (profundidad de la depresión, unidades), rad (tiles), drops (gotas), vy (velocidad vertical de las gotas, tiles/s). Valores de la demo × SC (docs/PLAN_AGUA_D.md §4.5).
const KINDS={cast:{amp:.14*SC,rad:.34*SC,drops:9,vy:[1.6,3]},tug:{amp:.05*SC,rad:.22*SC,drops:3,vy:[1,1.9]},catch:{amp:.1*SC,rad:.3*SC,drops:6,vy:[1.4,2.6]},wade:{amp:.02*SC,rad:.2*SC,drops:0,vy:[0,0]},
 spot:{amp:.03*SC,rad:.17*SC,drops:0,vy:[0,0]},spotjump:{amp:.06*SC,rad:.2*SC,drops:3,vy:[1,1.8]},jump:{amp:.1*SC,rad:.3*SC,drops:8,vy:[1.4,2.6]},stone:{amp:.12*SC,rad:.3*SC,drops:6,vy:[1.5,2.8]}};
const DN=96;const clamp01=v=>v<0?0:v>1?1:v,nt0=tone=>1-tone[0];
// tamaños (SENTIDO, ver AGENTS.md «Regla de sentido»): héroe ≈ 1 unidad (≈ 1,75 m). Pez 24–42 cm ⇒ 0,14–0,24. Flotador Ø ≈ 6 cm ⇒ r .04 (algo mayor que real para que se lea en pantalla).
export const FISH_LEN=[.15,.25],BOBBER_R=.045;
const FISH_COLORS=['#d9772e','#7f9a86','#b9a46a','#d9772e','#5f8a78','#c9553a'];
const SPOT_FCL=['#ff9a8a','#d8e0e8','#8ab0d8','#8ac88a','#ff8a4a','#4a8a5a','#4a6ac8','#ff6a1a','#6a8aff','#a06aff','#ff4a6a','#2ac89a'],SPOT_RCL=['#cfe8ff','#e0f0ff','#aad0ff','#b8e8c0','#ffb888','#9ad8a0','#80b0ff','#ffa040','#d0f0ff','#e0c0ff','#ffa0a0','#a0ffd0'];
const wrapA=a=>{while(a>Math.PI)a-=TAU;while(a<-Math.PI)a+=TAU;return a};

function fishMesh(len,hex,tint0){const g=new THREE.Group(),base=new THREE.Color(hex),mat=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.6,depthWrite:false});
 const tint=geo=>{const n=geo.attributes.normal,col=new Float32Array(n.count*3);for(let i=0;i<n.count;i++){const k=.62+.42*n.getY(i);col[i*3]=base.r*k;col[i*3+1]=base.g*k;col[i*3+2]=base.b*k}geo.setAttribute('color',new THREE.BufferAttribute(col,3));return geo};
 const body=new THREE.Mesh(tint(new THREE.SphereGeometry(1,12,9).scale(len*.5,len*.14,len*.1)),mat);g.add(body);
 const tail=new THREE.Group();tail.position.x=-len*.42;tail.add(new THREE.Mesh(tint(new THREE.ConeGeometry(len*.15,len*.3,4).rotateZ(-Math.PI/2).translate(-len*.14,0,0).scale(1,1,.25)),mat));g.add(tail);
 const dors=new THREE.Mesh(tint(new THREE.ConeGeometry(len*.06,len*.16,3).translate(0,len*.19,0).scale(1,1,.3)),mat);dors.position.x=-len*.05;g.add(dors);
 g.userData={mat,tail};g.traverse(o=>{o.renderOrder=3;o.frustumCulled=false;o.castShadow=false;o.receiveShadow=false;o.raycast=()=>{}});return g}

export class Water{
 // refs: {hero, proj} · W3 = conversor mundo(px)→three de r3d.js
 constructor(scene,terr,W3,refs){this.scene=scene;this.root=new THREE.Group();scene.add(this.root);this.terr=terr;this.W3=W3;this.refs=refs||{};this.sim=new WaterSim(terr);WU.uSim.value=this.sim.tex;this.q=2;this.px=0;this.pz=0;this.t=0;this.fish=[];this.fishT=0;
  this.stats={peces:0,gotas:0,simMs:0,llenado:0,ventana:'—'};
  // gotas: una Points; el tamaño en píxeles lo da update()
  this.dpos=new Float32Array(DN*3);this.dvel=new Float32Array(DN*3);this.dlife=new Float32Array(DN);for(let i=0;i<DN;i++)this.dpos[i*3+1]=-50;
  const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.BufferAttribute(this.dpos,3).setUsage(THREE.DynamicDrawUsage));this.dg=dg;
  this.dmat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uPx:{value:5},uNight:G.uNight},vertexShader:`uniform float uPx;void main(){gl_PointSize=uPx;gl_Position=projectionMatrix*viewMatrix*vec4(position,1.);}`,
   fragmentShader:`uniform float uNight;void main(){vec2 u=gl_PointCoord*2.-1.;float r=length(u);if(r>1.)discard;vec3 c=mix(vec3(.9,.97,.95),vec3(.32,.42,.58),uNight);gl_FragColor=vec4(c*(1.-.35*smoothstep(.55,1.,r)),(1.-smoothstep(.7,1.,r))*.92);\n#include <colorspace_fragment>\n}`});
  this.drops=new THREE.Points(dg,this.dmat);this.drops.frustumCulled=false;this.drops.renderOrder=5;this.drops.raycast=()=>{};this.root.add(this.drops);
  // flotador + pez capturado (volando a la mano)
  this.bobber=new THREE.Group();const bm=(g,hex)=>new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:hex}));
  this.bobber.add(bm(new THREE.SphereGeometry(BOBBER_R,10,8),'#d8392f'),bm(new THREE.SphereGeometry(BOBBER_R*.78,10,8,0,TAU,0,Math.PI/2).translate(0,-BOBBER_R*.05,0),'#f4f1e6'),bm(new THREE.CylinderGeometry(BOBBER_R*.16,BOBBER_R*.16,BOBBER_R*2.2,5).translate(0,BOBBER_R*1.7,0),'#f4f1e6'));
  this.bobber.traverse(o=>{o.renderOrder=4;o.raycast=()=>{}});this.bobber.visible=false;this.root.add(this.bobber);
  this.caught=fishMesh(.2,'#d9772e');this.caught.visible=false;this.root.add(this.caught);
  this.aim=null;this.F={st:'idle',t:0,x:0,y:0,z:0,sx:0,sy:0,sz:0,tx:0,tz:0,T:.62,dip:0,hy:WY,a:null,e:null,fish:null,fT:0,lx:0,lz:0};
  this.tmp={x:0,z:0};
  // PUNTOS DE PESCA clickeables (N con t==='fi'): un cardumen 3D por punto + ondas reales en la sim + anillo de hover. game.js ya no dibuja estos puntos en 2D con R3D activo.
  this.spots=new Map();this.hov=null;
  this.hring=new THREE.Mesh(new THREE.RingGeometry(.3,.36,32).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#ffe9a0',transparent:true,opacity:0,depthWrite:false}));this.hring.renderOrder=4;this.hring.visible=false;this.hring.raycast=()=>{};this.root.add(this.hring)}
 get on(){return this.q<=2}
 // ── API ──
 // (x,y) en px de mundo (como el resto del juego). kind: cast|tug|catch|wade|jump|stone. k = multiplicador de amplitud.
 splash(wx,wy,kind,k){if(!this.on)return;const T=ISO.TILE;this.splashT(wx/T,wy/T,kind,k)}
 splashT(x,z,kind,k){if(!this.on)return;const K=KINDS[kind]||KINDS.tug;this.ensure(x,z);this.sim.dent(x,z,K.amp*(k||1),K.rad);for(let i=0;i<K.drops;i++)this.spawnDrop(x,z,K)}
 // el juego avisa de la pesca: 'tug' (cada picada = golpe de pesca), 'catch' (pez conseguido). e = entidad del punto de pesca (x,y en px)
 event(kind,e){const sc=e&&this.spots.get(e);if(sc){if(kind==='tug')sc.agit=1.1;else if(kind==='catch'){sc.hide=2.6;sc.agit=0;this.caughtCol=sc.col;this.caughtLen=sc.fish[0].len}}
  if(!this.on&&kind!=='tug'&&kind!=='catch')return;const F=this.F;if(kind==='tug'&&F.st==='wait'){F.dip=.06;this.splashT(F.tx,F.tz,'tug');this.nibble()}
  else if(kind==='catch'&&(F.st==='wait'||F.st==='cast')){this.splashT(F.tx,F.tz,'catch');F.st='land';F.t=0;F.lx=F.tx;F.lz=F.tz;if(this.caughtCol){this.scene.remove(this.caught);this.caught=fishMesh(this.caughtLen,this.caughtCol);this.caught.userData.mat.opacity=1;this.root.add(this.caught);this.caughtCol=null}else{const f=this.takeFish();if(f)this.caught.userData.mat.color.set(1,1,1)}}}
 ensure(x,z){const s=this.sim;if(!s.inside(x,z,2.5))s.recenter(x,z)}
 // ── puntos de pesca ──
 spotLen(i){return[.1,.16,.2,.26,.24,.19,.21,.24,.18,.2,.21,.18][i%12]}
 mkSpot(e){const T=ISO.TILE,i=e.i||0,sc={e,x:e.x/T,z:e.y/T,fish:[],pt:rnd(0,1.5),jt:rnd(6,12),agit:0,hide:0,col:SPOT_FCL[i%12],ring:SPOT_RCL[i%12]};
  for(let k=0;k<3;k++){const len=this.spotLen(i)*(k?rnd(.75,.95):1),m=fishMesh(len,sc.col);m.userData.mat.opacity=.82;this.root.add(m);sc.fish.push({m,len,a:k*TAU/3+rnd(0,.6),r:.2+.07*k,sp:.7+.1*k,ph:rnd(0,6)})}
  return sc}
 freeSpot(sc){for(const f of sc.fish){this.root.remove(f.m);f.m.traverse(o=>{if(o.geometry)o.geometry.dispose()});f.m.userData.mat.dispose()}}
 pulse(x,z,kind,k){const K=KINDS[kind]||KINDS.tug;if(this.on&&this.sim.inside(x,z,1.5))this.sim.dent(x,z,K.amp*(k||1),K.rad);for(let i=0;i<K.drops;i++)this.spawnDrop(x,z,K)}
 updSpots(dt,now,t,tone){const N_=typeof N!=='undefined'?N:null,hov=typeof HOV!=='undefined'?HOV:null,ac=typeof A!=='undefined'&&A?A.e:null,T=ISO.TILE,live=new Set();
  if(N_)for(const e of N_){if(e.t!=='fi')continue;const x=e.x/T,z=e.y/T;if(Math.abs(x-this.px)>22||Math.abs(z-this.pz)>22)continue;if(typeof alive==='function'&&!alive(e,now))continue;live.add(e);if(!this.spots.has(e))this.spots.set(e,this.mkSpot(e))}
  for(const[e,sc]of this.spots)if(!live.has(e)){this.freeSpot(sc);this.spots.delete(e)}
  let hs=null;
  for(const[e,sc]of this.spots){const hv=hov===e,act=ac===e;if(hv)hs=sc;sc.agit=Math.max(0,sc.agit-dt);if(sc.hide>0){sc.hide-=dt}
   const ag=sc.agit>0?1:0,spd=(hv?1.5:1)*(ag?2.6:1);
   sc.fish.forEach((f,k)=>{f.a+=dt*f.sp*spd/f.r*.3;f.ph+=dt*(6+4*spd);const r=ag?lerp(f.r,.07+.03*k,.15):f.r,cx=sc.x+Math.cos(f.a)*r,cz=sc.z+Math.sin(f.a)*r;
    const m=f.m,vis=sc.hide<=0||k>0;m.visible=vis;if(!vis)return;
    m.position.set(cx,WY-(hv?.045:.075)+Math.sin(t*1.3+k)*.012,cz);m.rotation.set(0,-(f.a+Math.PI/2),0,'YZX');m.userData.tail.rotation.y=Math.sin(f.ph)*(.35+.15*spd);
    const mt=m.userData.mat;mt.opacity=hv?.98:.82;mt.color.setRGB(tone[0]*(hv?1.18:1),tone[1]*(hv?1.18:1),tone[2]*(hv?1.18:1))});
   // ondas reales: pulso suave periódico (más vivo con el cursor encima / al picar); es lo que «avisa» de que hay pez
   sc.pt-=dt;if(sc.pt<=0&&!act){sc.pt=hv?.8:rnd(5,9);this.pulse(sc.x,sc.z,'spot',hv?1.7:.55)}
   sc.jt-=dt;if(sc.jt<=0&&!act){sc.jt=rnd(22,40);this.pulse(sc.x+rnd(-.2,.2),sc.z+rnd(-.2,.2),'spotjump',.7)}}
  // anillo de hover (tinta cálida, pulsa; se apaga al pescar)
  const r=this.hring,hm=hs&&ac!==hs.e;r.visible=!!hm;if(hm){r.position.set(hs.x,WY+.014,hs.z);const u=(t*1.4)%1;r.scale.setScalar(.85+.55*u);r.material.opacity=.7*(1-u)*(1-.5*clamp01(nt0(tone)));r.material.color.set(hs.ring)}}

 // ── reflejo planar ligero (R3D-AGUA-ARTSTYLE) ──  r3d.js llama a water.reflect(r,scene,cam,cssW,cssH) justo antes de renderizar el mundo. Técnica de three/Reflector adaptada a cámara ORTOGRÁFICA:
 // cámara virtual espejada respecto a y=WY, plano de corte global (solo lo que está sobre el agua), RT a ~⅓ de resolución, se refresca cada 2.º fotograma y solo con agua cerca y QL ≤ 2.
 reflect(r,scene,cam,cw,ch){const need=this.q<=2&&this.refNeed;WU.uRefOn.value=need&&this.rt?1:0;if(!need)return;
  const w=Math.max(64,Math.round(cw*.34)),h=Math.max(64,Math.round(ch*.34));
  if(!this.rt){this.rt=new THREE.WebGLRenderTarget(w,h,{type:THREE.HalfFloatType,depthBuffer:true});this.rt.texture.minFilter=this.rt.texture.magFilter=THREE.LinearFilter;this.vc=new THREE.OrthographicCamera();this.vplane=new THREE.Plane(new V3(0,1,0),-(WY+.012));WU.uRef.value=this.rt.texture;this.rf=0}
  else if(this.rt.width!==w||this.rt.height!==h)this.rt.setSize(w,h);
  if(this.noRef){WU.uRefOn.value=0;return}
  if((this.rf++&1)&&this.rdone){WU.uRefOn.value=1;return}
  const vc=this.vc;vc.copy(cam);cam.updateMatrixWorld();const cp=new V3().setFromMatrixPosition(cam.matrixWorld),dir=new V3(0,0,-1).transformDirection(cam.matrixWorld),up=new V3(0,1,0).transformDirection(cam.matrixWorld);
  const m=p=>{p.y=2*WY-p.y;return p};vc.position.copy(m(cp.clone()));const tg=m(cp.clone().add(dir));up.y=-up.y;vc.up.copy(up);vc.lookAt(tg);vc.updateMatrixWorld();vc.projectionMatrix.copy(cam.projectionMatrix);vc.projectionMatrixInverse.copy(cam.projectionMatrixInverse);
  WU.uRefM.value.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(vc.projectionMatrix).multiply(vc.matrixWorldInverse);
  const pr=r.getRenderTarget(),cc=r.getClearColor(new THREE.Color()),ca=r.getClearAlpha(),sa=r.shadowMap.autoUpdate,pcl=r.clippingPlanes;
  this.root.visible=false;this.terr.water.visible=false;r.shadowMap.autoUpdate=false;r.clippingPlanes=[this.vplane];r.setClearColor(0x000000,0);r.setRenderTarget(this.rt);r.clear();const inks=[INK,...INKS.values()];inks.forEach(m=>m.visible=false);   /* Lote R3D-OPT-1: el reflejo no necesita los contornos (casco de tinta): casi la mitad de las llamadas de dibujo */
  try{r.render(scene,vc)}catch(e){this.bad=(this.bad||0)+1;if(this.bad===1)console.warn('[R3D agua] el reflejo falló (se sigue sin él si se repite):',e&&e.message);if(this.bad>=3)this.noRef=1}   // R3D-FIX-REFLEJO (20 oct 2026): un TypeError aquí (`i.toArray is not a function`, ocurre con LLUVIA) mataba TODO el bucle de dibujo; ahora se captura, se restaura el estado y tras 3 fallos se apaga el reflejo
  
  inks.forEach(m=>m.visible=true);r.setRenderTarget(pr);r.setClearColor(cc,ca);r.shadowMap.autoUpdate=sa;r.clippingPlanes=pcl;this.root.visible=true;this.terr.water.visible=true;this.rdone=1}

 // ── gotas ──
 spawnDrop(x,z,K){const T=this;for(let i=0;i<DN;i++){if(T.dlife[i]>0)continue;const a=Math.random()*TAU,s=rnd(.2,1.1),o=i*3;
  T.dpos[o]=x+Math.cos(a)*.05;T.dpos[o+1]=WY+.03;T.dpos[o+2]=z+Math.sin(a)*.05;T.dvel[o]=Math.cos(a)*s*.6*SC;T.dvel[o+1]=rnd(K.vy[0],K.vy[1])*SC*.62;T.dvel[o+2]=Math.sin(a)*s*.6*SC;T.dlife[i]=3;return}}
 updDrops(dt){let live=0;const P=this.dpos,Vv=this.dvel,L=this.dlife;for(let i=0;i<DN;i++){if(L[i]<=0)continue;const o=i*3;Vv[o+1]-=9*dt;P[o]+=Vv[o]*dt;P[o+1]+=Vv[o+1]*dt;P[o+2]+=Vv[o+2]*dt;L[i]-=dt;
   if((P[o+1]<WY&&Vv[o+1]<0)||L[i]<=0){if(L[i]>0&&this.on)this.sim.dent(P[o],P[o+2],.0045*SC,.08*SC);L[i]=0;P[o+1]=-50}else live++}
  this.dg.attributes.position.needsUpdate=true;this.stats.gotas=live;this.drops.visible=live>0}
 // ── peces ambientales ──
 depthAt(x,z){return WY-this.terr.field(x,z).y}
 pickSpot(minD,r){for(let k=0;k<40;k++){const a=Math.random()*TAU,rr=Math.sqrt(Math.random())*r,x=this.px+Math.cos(a)*rr,z=this.pz+Math.sin(a)*rr,tx=Math.floor(x),tz=Math.floor(z);
   if(this.terr.h(tx,tz)===.75&&this.depthAt(x,z)>minD)return[x,z]}return null}
  // PEZ ENGANCHADO (minijuego de pesca, 21 oct 2026): un pez visible que tira de la línea. x,z en TILES, heading = rumbo (rad, x→z), tired 0..1 (cansado: de costado y despacio), len en unidades (25–45 cm ≈ .15–.26; aquí algo mayor para leerse).
 hook(on,x,z,heading,tired,len,col,t,dt){let m=this.hk;if(!on){if(m)m.visible=false;return}
  if(!m||this.hkc!==col||this.hkl!==len){if(m){this.root.remove(m);m.traverse(o=>{if(o.geometry)o.geometry.dispose()});m.userData.mat.dispose()}m=this.hk=fishMesh(len,col);m.userData.mat.opacity=.95;m.userData.mat.depthWrite=true;this.root.add(m);this.hkc=col;this.hkl=len}
  m.visible=true;const k=1-.7*tired;m.position.set(x,WY+.014+tired*.02+Math.max(0,Math.sin(t*5))*.006*tired,z);m.rotation.set(tired*1.15,-heading,Math.sin(t*3)*.08*tired);m.userData.tail.rotation.y=Math.sin(t*(17*k+3))*(.62-.3*tired);
  this.sim.dent(x,z,.0045*SC*(dt||.016)*60,.1*SC*.6)}   // estela de ondas
 addFish(){const sp=this.pickSpot(.16,10);if(!sp)return;const f={x:sp[0],z:sp[1],a:Math.random()*TAU,sp:.4,ph:Math.random()*6,rise:.4,y:WY-.1,pitch:0,len:rnd(FISH_LEN[0],FISH_LEN[1]),jt:rnd(8,20),jump:null,ctrl:null,id:this.fish.length};
  f.mesh=fishMesh(f.len,FISH_COLORS[(Math.random()*FISH_COLORS.length)|0]);this.root.add(f.mesh);this.fish.push(f)}
 removeFish(f){this.root.remove(f.mesh);f.mesh.traverse(o=>{if(o.geometry)o.geometry.dispose()});f.mesh.userData.mat.dispose();const i=this.fish.indexOf(f);if(i>=0)this.fish.splice(i,1)}
 takeFish(){const F=this.F;let f=F.fish;if(!f||!this.fish.includes(f)){let bd=1e9;for(const g of this.fish){const d=Math.hypot(g.x-F.tx,g.z-F.tz);if(d<bd){bd=d;f=g}}}if(f){this.caught.userData.mat.color.set(1,1,1);this.caught.scale.setScalar(f.len/.2);this.removeFish(f)}else this.caught.scale.setScalar(1);F.fish=null;return f}
 nibble(){const F=this.F;let best=null,bd=6;for(const f of this.fish){if(f.jump)continue;const d=Math.hypot(f.x-F.tx,f.z-F.tz);if(d<bd){bd=d;best=f}}
  if(best){best.ctrl={tx:F.tx,tz:F.tz,sp:.9,t:2.6,rise:.95};F.fish=best}}
 updFish(dt,t,tone){const wake=(f,k)=>{const dx=Math.cos(f.a),dz=Math.sin(f.a),sw=Math.sin(f.ph),L=f.len/.35;   // L: la estela escala con el tamaño del pez (la demo usaba 0,5 de largo)
   const q=f.rise*f.rise*Math.min(1,f.sp/(.5*SC))*k*L;this.sim.dent(f.x+dx*f.len*.4,f.z+dz*f.len*.4,-.0048*SC*q*.55,.11*SC*.7);this.sim.dent(f.x-dx*f.len*.42-dz*sw*.07*SC*.5,f.z-dz*f.len*.42+dx*sw*.07*SC*.5,sw*.008*SC*q,.1*SC*.7)};
  for(let n=this.fish.length-1;n>=0;n--){const f=this.fish[n],i=f.id;
   if(Math.hypot(f.x-this.px,f.z-this.pz)>15||this.depthAt(f.x,f.z)<.05){this.removeFish(f);continue}
   let turn=0,spT=(.35+.3*(.5+.5*Math.sin(t*.23+i*1.7)))*SC*.5;
   if(f.jump){const J=f.jump;J.t+=dt;const s=cl(J.t/J.T,0,1);f.x+=Math.cos(f.a)*J.v*dt;f.z+=Math.sin(f.a)*J.v*dt;const H=.26;f.y=WY+H*4*s*(1-s)-.02;f.pitch=Math.atan2(H*4*(1-2*s)/J.T,J.v);f.rise=1;
    if(s>=1){this.splashT(f.x,f.z,'jump',.8);f.jump=null;f.jt=rnd(28,60);f.y=WY-.08}}
   else{
    if(f.ctrl){const c=f.ctrl;c.t-=dt;if(c.t<=0)f.ctrl=null;else{const dx=c.tx-f.x,dz=c.tz-f.z,d=Math.hypot(dx,dz);f.a+=cl(wrapA(Math.atan2(dz,dx)-f.a),-4*dt,4*dt);spT=Math.min(c.sp,d*2.2+.05);f.rise=lerp(f.rise,c.rise,dt*4)}}
    if(!f.ctrl){turn=.8*Math.sin(t*.37+i*2.1)+.5*Math.sin(t*.91+i);const px=f.x+Math.cos(f.a)*.7,pz=f.z+Math.sin(f.a)*.7;
     if(this.depthAt(px,pz)<.1){const da=wrapA(Math.atan2(this.pz-f.z,this.px-f.x)-f.a);turn=cl(da*3,-2.6,2.6);spT=.35}   // cerca de la orilla: vira hacia el jugador/centro (siempre hay agua cerca de él)
     f.a+=turn*dt;f.rise=lerp(f.rise,cl(.45+.4*Math.sin(t*.31+i*1.3),.15,.9),dt*2)}
    f.sp+=(spT-f.sp)*Math.min(1,dt*2.5);f.x+=Math.cos(f.a)*f.sp*dt;f.z+=Math.sin(f.a)*f.sp*dt;const dd=this.depthAt(f.x,f.z);f.y=WY-lerp(.11,.03,f.rise)-Math.max(0,.06-dd*.4);f.pitch*=.9;
    if(!f.ctrl){f.jt-=dt;if(f.jt<=0){if(this.depthAt(f.x+Math.cos(f.a)*.6,f.z+Math.sin(f.a)*.6)>.14&&dd>.14){f.jump={t:0,T:.62,v:.7};this.splashT(f.x,f.z,'jump',.8)}else f.jt=2}}}
   f.ph+=dt*(5+f.sp*5);if(!f.jump)wake(f,dt*60);
   const m=f.mesh;m.position.set(f.x,f.y,f.z);m.rotation.set(0,-f.a,f.pitch,'YZX');m.userData.tail.rotation.y=Math.sin(f.ph)*(.3+.25*Math.min(1,f.sp));
   const sh=f.jump?0:.5*(1-f.rise);m.userData.mat.opacity=f.jump?1:.5+.35*f.rise;m.userData.mat.color.setRGB(tone[0]*(1-sh*.35),tone[1]*(1-sh*.15),tone[2]*(1-sh*.1))}
  this.stats.peces=this.fish.length}
 // ── pesca: flotador 3D ──
 updFishing(dt,now,t){const F=this.F,hero=this.refs.hero,aim=this.aim,fishing=!!(aim&&hero&&hero.rodTip);
  // aim = {x,y,ph} del juego (heroState3D): ph<.26 es el arco del lanzamiento; si ph baja de golpe empieza un lanzamiento nuevo (siguiente ciclo)
  if(fishing&&F.st!=='land'&&(F.st==='idle'||F.st==='reel'||(F.lph!=null&&aim.ph<F.lph-.05))){const rt=hero.rodTip,T=ISO.TILE;F.st='cast';F.t=0;F.dip=0;F.sx=rt.x;F.sy=rt.y;F.sz=rt.z;F.tx=aim.x/T;F.tz=aim.y/T;this.bobber.visible=true;this.bobber.position.set(F.sx,F.sy,F.sz)}
  F.lph=fishing?aim.ph:null;
  if(!fishing&&(F.st==='cast'||F.st==='wait')){F.st='reel';F.t=0}
  if(F.st==='idle'){this.bobber.visible=false;return}
  F.t+=dt;F.dip*=Math.exp(-dt*6);const b=this.bobber;
  if(F.st==='cast'){const u=cl((aim?aim.ph:1)/.26,0,1);const rt=hero.rodTip;if(rt&&u<1){F.sx=rt.x;F.sy=rt.y;F.sz=rt.z}
   const s=u*(2-u);b.position.set(F.sx+(F.tx-F.sx)*s,F.sy+(WY+.04-F.sy)*s+Math.sin(u*Math.PI)*(.25+.05*Math.hypot(F.tx-F.sx,F.tz-F.sz)),F.sz+(F.tz-F.sz)*s);b.rotation.set(0,0,0);F.x=b.position.x;F.z=b.position.z;
   if(u>=1){F.st='wait';F.t=0;F.x=F.tx;F.z=F.tz;this.splashT(F.tx,F.tz,'cast');this.nibble()}return}
  if(F.st==='wait'){const sl=this.sim.slope(F.x,F.z,this.tmp);F.x-=sl.x*dt*.5*SC;F.z-=sl.z*dt*.5*SC;const r=Math.hypot(F.x-F.tx,F.z-F.tz);if(r>.7){F.x=F.tx+(F.x-F.tx)*.7/r;F.z=F.tz+(F.z-F.tz)*.7/r}
   F.fT-=dt;if(F.fT<=0){F.fT=rnd(3.5,6);if(!F.fish||!this.fish.includes(F.fish))this.nibble()}
   const hy=this.sim.height(F.x,F.z)*WU.uPK.value;b.position.set(F.x,WY+.02+hy-F.dip,F.z);b.rotation.set(0,0,0);return}
  if(F.st==='land'){const u=cl(F.t/.7,0,1),rt=hero.rodTip||{x:F.lx,y:WY+1,z:F.lz};b.visible=false;const c=this.caught;c.visible=u<1;
   c.position.set(F.lx+(rt.x-F.lx)*u,WY+(rt.y-WY)*u+.45*4*u*(1-u),F.lz+(rt.z-F.lz)*u);c.rotation.set(0,0,u*5);
   if(F.t>.8){F.st='idle';c.visible=false}return}
  if(F.st==='reel'){const rt=hero.rodTip;if(!rt){F.st='idle';b.visible=false;return}const dx=rt.x-b.position.x,dz=rt.z-b.position.z,d=Math.hypot(dx,dz)||1,v=3;
   b.position.x+=dx/d*v*dt;b.position.z+=dz/d*v*dt;b.position.y=lerp(b.position.y,rt.y,dt*5);this.sim.dent(b.position.x,b.position.z,.006*SC*dt*60,.1*SC*.7);if(F.t>.7||d<.3){F.st='idle';b.visible=false}}}
 // posición de pantalla del flotador (para el sedal 2D que dibuja drawHero)
 bobberScreen(){return this.bobber.visible&&this.refs.proj?this.refs.proj(this.bobber.position):null}
 // ── por fotograma ──
 // tgt = centro de cámara (three) · hp = posición del héroe (three) · tp = fila de luz (TOD mezclada) · night 0..1 · ql = calidad · ppx = píxeles por unidad (para el tamaño de las gotas)
 update(dt,now,t,hp,tp,ql,ppx){this.q=typeof ql==='number'?ql:2;this.t=t;WU.uQ.value=this.q>=3?0:this.q>=2?1:2;
  if(hp){this.px=hp.x;this.pz=hp.z}
  // luz del agua desde la fila de luz vigente (TOD): sol, cielo y tono
  const nt=cl((tp&&tp.night)||0,0,1);
  if(tp){const s=new THREE.Color(tp.sun);WU.uSunCol.value.set(s.r,s.g,s.b);WU.uSunI.value=cl(tp.sunI/4.8,.18,1);WU.uHor.value.set(tp.sky);WU.uZen.value.copy(WU.uHor.value).multiplyScalar(.75);
   if(tp.sunP)WU.uSun.value.set(tp.sunP[0],Math.max(.25,tp.sunP[1]),tp.sunP[2]).normalize();
   WU.uTone.value.set(1-.5*nt,1-.4*nt,1-.15*nt);WU.uSkyA.value=.7-.3*nt}
  const tone=[1-.5*nt,1-.4*nt,1-.15*nt];this.dmat.uniforms.uPx.value=cl(.08*ppx,2,10);
  this.rnT=(this.rnT||0)-dt;if(this.rnT<=0){this.rnT=1;let n=0;const tx=Math.floor(this.px),tz=Math.floor(this.pz),RV=Math.max(9,Math.min(24,Math.ceil((this.viewR||40)*.82)));for(let j=-RV;j<=RV&&!n;j+=3)for(let i=-RV;i<=RV;i+=3)if(this.terr.h(tx+i,tz+j)===.75){n=1;break}this.refNeed=!!n}
  this.updSpots(dt,now,t,tone);this.updFishing(dt,now,t);
  if(this.on){
   // ventana: sigue al jugador cuando no hay nada en marcha (recentrar borra las ondas)
   const S=this.sim;if(!S.inside(this.px,this.pz,5)&&!S.awake&&S.act<2e-4&&this.F.st==='idle')S.recenter(this.px,this.pz);
   // peces: solo si hay agua profunda cerca; 0–4 a la vez
   this.fishT-=dt;if(this.fishT<=0){this.fishT=rnd(1.5,3);if(this.fish.length<1&&(this.terr.near(Math.floor(this.px),Math.floor(this.pz),.75)||this.pickSpot(.16,10)))this.addFish()}
   this.updFish(dt,t,tone);
   // «wade»: el jugador al borde del agua deja una onda suave cada ~.45 s si se mueve (misma idea que TER.env en 2D)
   this.wadeT=(this.wadeT||0)-dt;const mv=Math.hypot(this.px-(this.lpx||this.px),this.pz-(this.lpz||this.pz));this.lpx=this.px;this.lpz=this.pz;
   if(this.wadeT<=0&&mv>.004){const tx=Math.floor(this.px),tz=Math.floor(this.pz);let bx=0,bz=0,bd=1e9;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)if(this.terr.h(tx+i,tz+j)===.75){const cx=tx+i+.5,cz=tz+j+.5,d=Math.hypot(cx-this.px,cz-this.pz);if(d<bd){bd=d;bx=cx;bz=cz}}
    if(bd<1.6){this.wadeT=.45;const a=Math.atan2(bz-this.pz,bx-this.px);this.splashT(this.px+Math.cos(a)*Math.max(.5,bd-.5),this.pz+Math.sin(a)*Math.max(.5,bd-.5),'wade')}}
   S.update(dt);
   WU.uSimO.value.set(S.ox,S.oz);WU.uSimOn.value=S.has&&(S.on||S.awake)?1:0;
   this.stats.simMs=S.ms;this.stats.llenado=S.fillMs;this.stats.ventana=S.cx+','+S.cz}
  else{WU.uSimOn.value=0;if(this.fish.length)[...this.fish].forEach(f=>this.removeFish(f))}
  this.updDrops(dt)}
}
