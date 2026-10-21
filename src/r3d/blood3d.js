// NotScape · R3D · Lote R3D-SANGRE (18 oct 2026) · SANGRE: salpicaduras en el aire y MANCHAS EN EL SUELO que se adaptan a cómo golpea la animación.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// QUÉ HACE
//   · Cada golpe FÍSICO que hace daño (espada, maza, hacha, puños, flechas…) lanza gotas con física (gravedad + algo de rozamiento). Cada gota que toca el suelo
//     deja una MANCHA (decal) que se seca (rojo vivo → granate → casi marrón) y se desvanece en ~70 s. Los hechizos NO sangran (los filtra el juego: sk='mg').
//   · El ORIGEN y la DIRECCIÓN salen de la animación real: heroanim3d.js (`HeroAnim.strike()`) guarda la posición mundial de la punta/cabeza del arma (o de la mano
//     en los puños) y su velocidad. Con eso `styleOf()` clasifica el golpe: TAJO (barrido lateral → abanico de gotas por la tangente del arco y manchas alargadas
//     en esa dirección), HACHAZO (golpe vertical → salpica hacia abajo y delante, mancha grande), ESTOCADA (empuje frontal → chorro estrecho con pequeño retardo
//     entre gotas) y GOLPE ROMO (maza/puños → estallido radial corto, gotas gordas, mancha redonda). Los tajos alternan solos de lado porque el clip alterna.
//   · FLECHAS (arco/ballesta): al llegar el proyectil hay un chorrito pequeño hacia el arquero (entrada) y un rocío mayor al otro lado, en la línea del disparo
//     (salida), con la mancha alargada en esa línea.
//   · Muerte: charco que crece 2 s bajo el cuerpo + salpicaduras bajas.
//   · COLOR por criatura (tabla OF → KINDS): rojo (por defecto), baba verde (slime), icor oscuro (rana, Rey Ciénaga), violeta (demonio), magma (lagarto de lava,
//     Señor del Fuego, Coloso, golem: brilla y se enfría) y «hueso» (esqueleto: solo astillas/polvo, SIN mancha). Un tipo nuevo = una fila en KINDS (+ OF).
// ESTILO (guía 3D §4.9, óleo oscuro): manchas de COLOR PLANO por bandas con CONTORNO oscuro pintado (como los modelos), núcleo más profundo donde es «grueso» y un
//   brillo húmedo en media luna que se apaga al secarse; sin grano ni trama. Las gotas llevan el mismo contorno oscuro y un punto de luz. De noche se oscurecen
//   y se encienden con la linterna del héroe.
// COSTE: 2 draw calls en total (manchas = 1 InstancedBufferGeometry de quads planos con shader; gotas = 1 más con quads estirados en pantalla). Cero trabajo si no
//   hay nada vivo. Presupuestos: DECAL_CAP manchas (anillo: la más vieja se reutiliza) y DROP_CAP gotas; se reducen según la calidad del juego (QL).
// AJUSTES: R3D.blood.level = 0 apagado · 1 poca · 2 normal (guardado en localStorage `ns_sangre`; `?sangre=N` en la URL manda sobre lo guardado). Botón #sgb del HUD.
// INTEGRACIÓN (hecha al terminar el lote): r3d.js crea `new Blood(scene,W3,{actors,hero})`, llama a `blood.update()` cada fotograma y lo expone como `R3D.blood`; game.js llama a
//   `R3D.blood.hit(m,d,now,{wt,mx})` desde hitM() (solo golpes físicos directos: ni hechizos sk='mg', ni espinas ni sangrado por turnos mxv=99) y a `R3D.blood.death(m,now)` desde kill().
//   `HeroAnim.track()/strike()` (heroanim3d.js) anota cada fotograma la punta del arma/mano en coordenadas three; al caer el daño (= impacto de la animación) hit() la lee.
//   Además de las gotas hay UNA mancha de «trayectoria» (raya en el suelo delante del objetivo, orientada por la velocidad horizontal medida del arma; usa `dc` del estilo).
// AÑADIR: estilo de golpe = fila en STYLE (+ STYLE_OF si es un arma nueva); criatura nueva con otra sangre = fila en OF. Ver AGENTS.md «Lote R3D-SANGRE».
import * as THREE from 'three';
import {G} from './materials3d.js';

const V3=THREE.Vector3,TAU=Math.PI*2;
const cl=(v,a,b)=>v<a?a:v>b?b:v,rnd=(a,b)=>a+Math.random()*(b-a);   // Math.random es correcto aquí: son efectos efímeros que no se guardan ni afectan al layout

// ── DATOS ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// índice `i` = posición en los arrays del shader (no cambiar los existentes). fresh/mid/dry = color recién caído / a los ~10 s / seco; hi = brillo húmedo;
// glow = emisión (solo magma/violeta); life = segundos hasta desvanecerse; stain = 0 → no deja mancha en el suelo.
export const KINDS={
 red:   {i:0,fresh:'#b3121e',mid:'#790f1b',dry:'#3a0a12',hi:'#f0606a',glow:0,   life:70,stain:1},
 green: {i:1,fresh:'#6cd855',mid:'#3f9a3a',dry:'#2a5a2c',hi:'#d4ffb4',glow:0,   life:40,stain:1},
 ichor: {i:2,fresh:'#3f6c2a',mid:'#28421f',dry:'#16261a',hi:'#9ac86a',glow:0,   life:60,stain:1},
 violet:{i:3,fresh:'#7a2a9a',mid:'#4a1a62',dry:'#25102f',hi:'#d09aff',glow:.25, life:60,stain:1},
 magma: {i:4,fresh:'#ff8a22',mid:'#a8300c',dry:'#2a1a16',hi:'#ffe08a',glow:1.5, life:45,stain:1},
 bone:  {i:5,fresh:'#d8d0b8',mid:'#a89f88',dry:'#7a725f',hi:'#f2ecd8',glow:0,   life:0, stain:0}};
const KN=Object.keys(KINDS);
export const OF={slime:'green',esqueleto:'bone',rana:'ichor',b2:'ichor',demonio:'violet',lagarto:'magma',b5:'magma',k5:'magma',golem:'magma'};   // id de MD → tipo (el resto: red)

// Estilos de golpe. n = multiplicador de gotas · cone = semiángulo del abanico (rad; π = radial) · spd = velocidad [mín,máx] u/s · up = componente vertical [mín,máx]
// (fracción de la velocidad) · sz = radio de gota [mín,máx] (unidades; 1 unidad ≈ 80 px en pantalla) · arc = cuánto se reparte el origen hacia atrás por la trayectoria
// del arma · rad = 1 → direcciones radiales · dl = retardo máximo entre gotas (s) · dc = mancha de suelo: estiramiento [mín,máx] y radio [mín,máx] · spill = mancha
// bajo el objetivo (prob./tamaño).
export const STYLE={
 slash:{n:1,   cone:.5,     spd:[3,6.5],   up:[.05,.6],  sz:[.04,.085],arc:.6, rad:0,dl:0,   dc:{st:[1.7,3.3],r:[.11,.24]},spill:1},
 chop: {n:1.25,cone:.85,    spd:[1.8,4.8], up:[-.2,.7],  sz:[.05,.1],  arc:.3, rad:0,dl:0,   dc:{st:[1.1,2.1],r:[.16,.32]},spill:1.5},
 stab: {n:.7,  cone:.16,    spd:[3.8,8],   up:[0,.3],    sz:[.035,.065],arc:.05,rad:0,dl:.07, dc:{st:[2.2,4],r:[.09,.17]}, spill:.8},
 blunt:{n:1,   cone:Math.PI,spd:[1.1,3.4], up:[.4,1.15], sz:[.055,.11], arc:0,  rad:1,dl:0,   dc:{st:[1,1.5],r:[.18,.38]},  spill:1.4}};
// arma (kind de HeroAnim.it.main / 'fist') → estilo base; K = multiplicador por peso del arma. La animación REAL puede cambiarlo (ver styleOf).
export const STYLE_OF={sword:'slash',great:'slash',dagger:'stab',hatchet:'chop',greataxe:'chop',mace:'blunt',fist:'blunt'};
export const KIND_MUL={great:1.4,greataxe:1.5,hatchet:1.1,dagger:.8,fist:.6,mace:1.1,sword:1};
const LEVEL_MUL=[0,.55,1],QL_MUL=[1,1,.8,.55,.3],GRAV=11,DECAL_CAP=360,DROP_CAP=260;

// ── SHADERS ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const U_KIND=()=>{const f=[],m=[],d=[],h=[],g=[];for(const k of KN){const o=KINDS[k],c=x=>{const q=new THREE.Color(x);return new V3(q.r,q.g,q.b)};f.push(c(o.fresh));m.push(c(o.mid));d.push(c(o.dry));h.push(c(o.hi));g.push(o.glow)}
 return{uFresh:{value:f},uMid:{value:m},uDry:{value:d},uHi:{value:h},uGlow:{value:g}}};   // THREE.Color ya guarda LINEAL: el shader trabaja en lineal (igual que particles3d.js)

const DECAL_VS=`attribute vec4 iP;attribute vec4 iD;attribute vec4 iS;uniform float uT;
varying vec2 vQ;varying vec4 vD;varying vec4 vS;varying vec3 vWP;varying vec2 vC;
void main(){float age=uT-iS.y;vD=iD;vS=iS;vC=iP.xz;vQ=vec2(0.);vWP=vec3(0.);
 if(iS.z<=0.||age<0.||age>iS.z){gl_Position=vec4(2.,2.,2.,1.);return;}
 float st=max(iD.z,1.);vec2 ext=vec2(1.3*(1.+(st-1.)*.85),1.3);vec2 p=position.xz*2.;
 vec2 dir=normalize(iD.xy+vec2(1e-5,0.));vec2 per=vec2(-dir.y,dir.x);vec2 w=(dir*p.x*ext.x+per*p.y*ext.y)*iP.w;
 vec3 wp=vec3(iP.x+w.x,iP.y,iP.z+w.y);vQ=p*ext;vWP=wp;gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.);}`;
const DECAL_FS=`uniform float uT;uniform vec3 uFresh[6];uniform vec3 uMid[6];uniform vec3 uDry[6];uniform vec3 uHi[6];uniform float uGlow[6];
uniform vec3 uLight;uniform vec4 uHero;uniform vec2 uSun;
varying vec2 vQ;varying vec4 vD;varying vec4 vS;varying vec3 vWP;varying vec2 vC;
float h11(float x){return fract(sin(x*127.1+311.7)*43758.5453);}
float sdTap(vec2 p,float L,float r0,float r1){float t=clamp(p.x/L,0.,1.);return length(p-vec2(L*t,0.))-mix(r0,r1,t);}
float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
void main(){float seed=vS.x,age=uT-vS.y,life=vS.z;
 float gt=clamp(age/max(vS.w,.001),0.,1.),gro=1.-pow(1.-gt,3.);   // la mancha se ESPARCE al caer (ease-out)
 float st=max(vD.z,1.);vec2 q=vQ/mix(.3,1.,gro);float ang=atan(q.y,q.x);
 // cuerpo irregular: radio con armónicos sembrados + «dedos» de salpicadura (menos si la mancha es alargada)
 float wob=1.+.15*sin(3.*ang+seed*17.)+.09*sin(5.*ang+seed*31.+1.)+.06*sin(9.*ang+seed*53.+2.);
 float spk=.11*pow(abs(sin(ang*3.5+seed*23.)),5.)/(1.+(st-1.)*.6);
 float R0=.5*(1.+.1*(st-1.));float d=length(q)/(wob+spk)-R0;
 // cola hacia +x (dirección del golpe) con curva suave y gotas sueltas detrás
 if(st>1.04){float L=.3+(st-1.)*.95;vec2 tq=vec2(q.x,q.y+.07*sin(q.x*3.+seed*9.)*step(0.,q.x));d=smin(d,sdTap(tq,L,R0*.58,.035),.14);
  float bm=smoothstep(1.45,2.,st);for(int k=1;k<4;k++){float fk=float(k);float bx=L*.95+.27*fk*(1.+.3*h11(seed+fk)),by=(h11(seed*3.+fk)-.5)*.2;d=min(d,length(q-vec2(bx,by))-mix(.075,.028,fk/3.)*bm);}}
 // gotas satélite alrededor (más hacia delante cuanto más alargada)
 float fw=clamp((st-1.)/1.5,0.,1.);for(int k=0;k<5;k++){float fk=float(k);float a=mix(h11(seed+fk*7.1)*6.2832,(h11(seed+fk*7.1)-.5)*1.6,fw);float ds=R0*(1.3+.9*h11(seed*5.+fk))+(st-1.)*.45*h11(seed*9.+fk);
  d=min(d,length(q-ds*vec2(cos(a),sin(a)))-(.04+.07*h11(seed*13.+fk)));}
 float aa=fwidth(d)*.9+1e-4;float m=1.-smoothstep(-aa,aa,d);
 float fade=1.-smoothstep(life-10.,life,age);m*=fade;if(m<.01)discard;
 int ki=int(vD.w+.5);float wet=clamp(1.-age/16.,0.,1.),dry=smoothstep(3.,life*.85,age);
 vec3 base=mix(uFresh[ki],uMid[ki],smoothstep(0.,10.,age));base=mix(base,uDry[ki],dry);
 float edge=smoothstep(-.085,-.012,d),core=smoothstep(-.12,-.42,d);   // contorno oscuro pintado en el borde · núcleo más profundo donde es grueso
 vec3 col=mix(base,base*.55,core*.55);col=mix(col,col*.3,edge*.82);
 vec2 rel=vWP.xz-vC;float facing=dot(normalize(rel+vec2(1e-4)),uSun);float lite=smoothstep(.05,0.,abs(d+.2)-.026)*smoothstep(.0,.7,facing);   // media luna húmeda hacia la luz
 col=mix(col,uHi[ki],lite*wet*.85*(1.-edge));
 vec3 L=uLight;float ln=uHero.w*smoothstep(3.4,.4,distance(vWP.xz,uHero.xz));L+=vec3(1.,.62,.3)*ln*.9;col*=L;     // noche: oscuro, salvo cerca de la linterna del héroe
 col+=uFresh[ki]*uGlow[ki]*wet*wet*(1.-edge*.6);                                                                  // magma/violeta: emisión que se enfría (la recoge el bloom)
 gl_FragColor=vec4(col,m*mix(.84,.95,wet));
 #include <colorspace_fragment>
}`;

const DROP_VS=`attribute vec4 dP;attribute vec4 dV;varying vec2 vU;varying float vK;
void main(){vK=dV.w;vU=position.xy*2.;if(dP.w<=0.){gl_Position=vec4(2.,2.,2.,1.);return;}
 vec4 vp=viewMatrix*vec4(dP.xyz,1.);vec3 vv=(viewMatrix*vec4(dV.xyz,0.)).xyz;float sp=length(vv.xy);
 vec2 dir=sp>.05?vv.xy/sp:vec2(0.,-1.);vec2 per=vec2(-dir.y,dir.x);float len=dP.w*(1.+min(sp*.16,2.6));   // la gota se ESTIRA en pantalla según su velocidad
 vp.xy+=dir*position.x*2.*len+per*position.y*2.*dP.w;gl_Position=projectionMatrix*vp;}`;
const DROP_FS=`uniform vec3 uFresh[6];uniform vec3 uHi[6];uniform float uGlow[6];uniform vec3 uLight;varying vec2 vU;varying float vK;
void main(){vec2 u=vU;float d=length(u)-1.;float aa=fwidth(d)+1e-4;float m=1.-smoothstep(-aa,aa,d);if(m<.02)discard;
 int k=int(vK+.5);vec3 col=uFresh[k];float edge=smoothstep(-.34,-.06,d);col=mix(col,col*.35,edge*.85);   // mismo contorno oscuro que las manchas
 float hl=smoothstep(.2,0.,length(u-vec2(-.25,.28))-.16);col=mix(col,uHi[k],hl*.7*(1.-edge));
 col*=uLight;col+=uFresh[k]*uGlow[k]*.8;gl_FragColor=vec4(col,m);
 #include <colorspace_fragment>
}`;

// ── CLASE ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
export class Blood{
 // refs: {actors, hero} (se leen cada golpe: nada se cachea). W3 = conversor mundo→three de r3d.js.
 constructor(scene,W3,refs){this.W3=W3;this.refs=refs||{};this.LVY=W3(0,0,2).y;this.on=true;this.stats={gotas:0,manchas:0,golpes:0};
  let lv=2;try{const v=localStorage.getItem('ns_sangre');if(v!==null&&v!==''&&isFinite(+v))lv=cl(Math.round(+v),0,2)}catch(e){}   // por defecto Normal (2); lo guardado manda…
  try{const m=/[?&]sangre=(\d)/.exec(location.search);if(m)lv=cl(+m[1],0,2)}catch(e){}                                         // …y `?sangre=N` manda sobre lo guardado (sin guardarlo: sirve para pruebas)
  this._lv=lv;this._btn();
  const U=U_KIND();this.U=U;
  // manchas de suelo: quads planos instanciados (anillo)
  const gq=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),dg=new THREE.InstancedBufferGeometry();dg.index=gq.index;dg.setAttribute('position',gq.getAttribute('position'));dg.setAttribute('uv',gq.getAttribute('uv'));
  this.dP=new Float32Array(DECAL_CAP*4);this.dD=new Float32Array(DECAL_CAP*4);this.dS=new Float32Array(DECAL_CAP*4);this.di=0;this.nDec=0;
  this.aDP=new THREE.InstancedBufferAttribute(this.dP,4);this.aDD=new THREE.InstancedBufferAttribute(this.dD,4);this.aDS=new THREE.InstancedBufferAttribute(this.dS,4);
  [this.aDP,this.aDD,this.aDS].forEach(a=>a.setUsage(THREE.DynamicDrawUsage));dg.setAttribute('iP',this.aDP);dg.setAttribute('iD',this.aDD);dg.setAttribute('iS',this.aDS);dg.instanceCount=DECAL_CAP;
  this.decMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4,
   uniforms:Object.assign({uT:G.uTime,uLight:{value:new V3(1,1,1)},uHero:{value:new THREE.Vector4(0,0,0,0)},uSun:{value:new THREE.Vector2(-.6,-.8).normalize()}},U),vertexShader:DECAL_VS,fragmentShader:DECAL_FS});
  this.decals=new THREE.Mesh(dg,this.decMat);this.decals.frustumCulled=false;this.decals.renderOrder=1;this.decals.name='blood_decals';this.decals.raycast=()=>{};this.decals.visible=false;scene.add(this.decals);
  // gotas en el aire: quads estirados en pantalla; los arrays de atributos SON el almacén de la simulación
  const pq=new THREE.PlaneGeometry(1,1),pg=new THREE.InstancedBufferGeometry();pg.index=pq.index;pg.setAttribute('position',pq.getAttribute('position'));pg.setAttribute('uv',pq.getAttribute('uv'));
  this.pP=new Float32Array(DROP_CAP*4);this.pV=new Float32Array(DROP_CAP*4);this.pDl=new Float32Array(DROP_CAP);this.pSz=new Float32Array(DROP_CAP);this.pSt=new Uint8Array(DROP_CAP);this.pOn=new Uint8Array(DROP_CAP);this.pAge=new Float32Array(DROP_CAP);this.pStr=new Float32Array(DROP_CAP);
  this.aPP=new THREE.InstancedBufferAttribute(this.pP,4);this.aPV=new THREE.InstancedBufferAttribute(this.pV,4);[this.aPP,this.aPV].forEach(a=>a.setUsage(THREE.DynamicDrawUsage));
  pg.setAttribute('dP',this.aPP);pg.setAttribute('dV',this.aPV);pg.instanceCount=DROP_CAP;
  this.dropMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:Object.assign({uLight:this.decMat.uniforms.uLight},{uFresh:U.uFresh,uHi:U.uHi,uGlow:U.uGlow}),vertexShader:DROP_VS,fragmentShader:DROP_FS});
  this.drops=new THREE.Mesh(pg,this.dropMat);this.drops.frustumCulled=false;this.drops.renderOrder=2;this.drops.name='blood_drops';this.drops.raycast=()=>{};this.drops.visible=false;scene.add(this.drops);
  this.nDrops=0;this.qk=1;this.tmp=new V3();this.tmp2=new V3();this.tmp3=new V3()}
 _btn(){const b=document.getElementById('sgb');if(b){b.hidden=false;b.textContent='🩸 Sangre: '+['NO','Poca','Normal'][this._lv];b.onclick=()=>{this.level=(this._lv+2)%3}}}   // el botón cicla Normal → NO → Poca → Normal
 get level(){return this._lv}
 set level(v){v=cl(Math.round(+v)||0,0,2);this._lv=v;try{localStorage.setItem('ns_sangre',String(v))}catch(e){}if(v===0)this.clear();this._btn()}
 clear(){this.dS.fill(0);this.pOn.fill(0);this.pP.fill(0);this.nDrops=0;this.nDec=0;this.aDS.needsUpdate=true;this.aPP.needsUpdate=true;this.decals.visible=false;this.drops.visible=false}
 // altura del suelo (unidades three) bajo (x,z); NaN si es agua (no hay mancha: la sangre se diluye)
 ground(x,z){const T=ISO.TILE,h=TER.standZ(x*T,z*T);return h<.99?NaN:(h-1)*this.LVY}
 // ── manchas ──
 // (x,y,z) = punto en el suelo · (dx,dz) = dirección de la mancha (cola hacia delante) · st = estiramiento · r = radio (unidades) · grow = s que tarda en esparcirse
 stain(x,y,z,dx,dz,st,r,kind,now,grow){const K=KINDS[kind];if(!K||!K.stain||this.level===0)return;const i=this.di;this.di=(this.di+1)%DECAL_CAP;const l=Math.hypot(dx,dz)||1;
  this.dP[i*4]=x;this.dP[i*4+1]=y+.045;this.dP[i*4+2]=z;this.dP[i*4+3]=r;this.dD[i*4]=dx/l;this.dD[i*4+1]=dz/l;this.dD[i*4+2]=st;this.dD[i*4+3]=K.i;
  this.dS[i*4]=Math.random()*40;this.dS[i*4+1]=now/1000;this.dS[i*4+2]=K.life*rnd(.85,1.1);this.dS[i*4+3]=grow||.12;
  this.nDec=Math.min(DECAL_CAP,this.nDec+1);this.aDP.needsUpdate=this.aDD.needsUpdate=this.aDS.needsUpdate=true;this.decals.visible=true}
 // ── gotas ──
 drop(p,v,sz,kind,delay,stainP){let i=-1;for(let k=0;k<DROP_CAP;k++){if(!this.pOn[k]){i=k;break}}if(i<0)return;const K=KINDS[kind];
  this.pOn[i]=1;this.pP[i*4]=p.x;this.pP[i*4+1]=p.y;this.pP[i*4+2]=p.z;this.pP[i*4+3]=delay>0?0:sz;this.pV[i*4]=v.x;this.pV[i*4+1]=v.y;this.pV[i*4+2]=v.z;this.pV[i*4+3]=K.i;
  this.pDl[i]=delay||0;this.pSz[i]=sz;this.pSt[i]=K.stain&&Math.random()<stainP?1:0;this.pAge[i]=0;this.pStr[i]=K.i;this.drops.visible=true}
 // dirección aleatoria dentro de un cono de semiángulo `cone` alrededor de D (unitario)
 cone(D,cone,out){const U=Math.abs(D.y)<.9?this.tmp2.set(0,1,0):this.tmp2.set(1,0,0),R=this.tmp3.crossVectors(D,U).normalize();U.crossVectors(R,D).normalize();
  const th=cone*Math.sqrt(Math.random()),ph=Math.random()*TAU,s=Math.sin(th);return out.copy(D).multiplyScalar(Math.cos(th)).addScaledVector(U,Math.cos(ph)*s).addScaledVector(R,Math.sin(ph)*s)}
 // estilo definitivo = estilo del arma, corregido por el movimiento MEDIDO de la animación (lo que se ve manda):
 //   barrido casi vertical hacia abajo → hachazo · empuje que sigue la línea al objetivo → estocada (p. ej. golpe pesado de espada) · el romo siempre es romo
 styleOf(kind,v,fwd){let s=STYLE_OF[kind]||'slash';if(s==='blunt'||!v)return s;const vh=Math.hypot(v.x,v.z)||1e-6,al=(v.x*fwd.x+v.z*fwd.z)/vh;
  if(v.y<-.62&&s==='slash')return'chop';if(al>.9&&Math.abs(v.y)<.38&&vh>.55&&s!=='chop')return'stab';return s}
 // ── API del juego ──
 // m = monstruo (game.js) · d = daño · now = performance.now() · o = {wt:'m'|'r' (tipo de arma del juego), mx: golpe máximo}
 hit(m,d,now,o){if(!this.on||this.level===0||!(d>0))return;const T=ISO.TILE,W3=this.W3,A=this.refs.actors&&this.refs.actors.map.get(m),mid=m.d&&m.d.id,kind=OF[mid]||'red';
  const base=A?this.tmp.copy(A.grp.position):W3(m.x,m.y,TER.standZ(m.x,m.y)),B=base.clone(),rad=A?cl((A.tpl.rad||.4)*(A.sc||1),.22,1.3):.35,h=A?cl((A.tpl.h||1)*(A.sc||1),.5,3.5):.9;
  const C=new V3(B.x,B.y+h*.55,B.z),hp=typeof P!=='undefined'?W3(P.x,P.y,TER.standZ(P.x,P.y)):new V3(B.x,B.y,B.z-1),fwd=new V3(C.x-hp.x,0,C.z-hp.z);if(fwd.lengthSq()<1e-6)fwd.set(0,0,1);fwd.normalize();
  const ql=QL_MUL[typeof QL!=='undefined'?QL:2]||1,mul=LEVEL_MUL[this.level]*ql*(o&&o.mx?1.5:1),n0=(4+Math.sqrt(d)*1.6);this.stats.golpes++;
  const wt=o&&o.wt||'m',hero=this.refs.hero,an=hero&&hero.anim;
  if(wt==='r'){this.arrow(B,C,fwd,rad,h,d,kind,now,mul,n0,an&&an.cls==='xbow');return}
  // melee: punto y velocidad de la punta del arma en la animación
  const s=an&&an.strike?an.strike():null,I=new V3(),v=new V3();let wk=s?s.k:'fist',spd=7;
  if(s&&s.sp>1.2){I.copy(s.p);v.copy(s.v).normalize();spd=s.sp}else{I.set(C.x-fwd.x*rad*.7,C.y,C.z-fwd.z*rad*.7);v.copy(fwd).setY(.15).normalize()}
  if(I.distanceTo(C)>rad*1.6+.5){const y=cl(s?s.p.y:C.y,B.y+h*.2,B.y+h*.9);I.set(C.x-fwd.x*rad*.75,y,C.z-fwd.z*rad*.75)}else I.y=cl(I.y,B.y+h*.12,B.y+h*.95);   // la punta quedó lejos o fuera del cuerpo: la sangre sale de la «piel» del objetivo
  const sn=this.styleOf(wk,v,fwd),S=STYLE[sn],km=KIND_MUL[wk]||1,n=cl(Math.round(n0*S.n*mul*km),kind==='bone'?2:3,34),sk=cl(spd/9,.7,1.4);
  const dir=new V3(),p=new V3(),vel=new V3(),hv=new V3();
  for(let k=0;k<n;k++){
   if(S.rad){const a=Math.random()*TAU,hs=rnd(S.spd[0],S.spd[1])*sk,up=rnd(S.up[0],S.up[1]),bias=.3;   // romo: estallido radial con algo de sesgo hacia donde va el golpe
    vel.set(Math.cos(a)*hs+v.x*bias*hs,up*hs*1.5,Math.sin(a)*hs+v.z*bias*hs);p.copy(I).add(hv.set(Math.cos(a),0,Math.sin(a)).multiplyScalar(.04))}
   else{this.cone(v,S.cone,dir);const sp=rnd(S.spd[0],S.spd[1])*sk;vel.copy(dir).multiplyScalar(sp);vel.y+=rnd(S.up[0],S.up[1])*sp*.6;p.copy(I).addScaledVector(v,-rnd(0,S.arc))}   // el origen se reparte por el arco del arma
   p.x+=rnd(-.03,.03);p.z+=rnd(-.03,.03);this.drop(p,vel,rnd(S.sz[0],S.sz[1])*cl(.8+d*.004,.8,1.25),kind,S.dl?rnd(0,S.dl):0,.75)}
  // mancha de la TRAYECTORIA: una raya alargada en el suelo, delante del objetivo, siguiendo la dirección horizontal real del arma (tajo → raya larga y fina; estocada → línea
  // estrecha; hachazo/romo → mancha corta y gorda). Usa `dc` del estilo. Es lo que hace que cada animación «firme» el suelo de forma distinta.
  {const gy0=this.ground(B.x,B.z),vh=Math.hypot(v.x,v.z);if(!isNaN(gy0)&&kind!=='bone'&&Math.random()<.75*mul){const dx=vh>.25?v.x/vh:fwd.x,dz=vh>.25?v.z/vh:fwd.z,rr=rad*rnd(.5,.95);
    this.stain(B.x+dx*rr,gy0,B.z+dz*rr,dx,dz,rnd(S.dc.st[0],S.dc.st[1]),rnd(S.dc.r[0],S.dc.r[1])*cl(.75+Math.sqrt(d)*.06,.75,1.35),kind,now,.12)}}
  // mancha bajo el objetivo (derrame): más grande cuanto más daño y más pesado el golpe
  const gy=this.ground(B.x,B.z);if(!isNaN(gy)&&kind!=='bone'&&Math.random()<.6*S.spill*mul){const r=(.12+.02*Math.sqrt(d))*S.spill*rnd(.8,1.2);this.stain(B.x+fwd.x*rad*.45,gy,B.z+fwd.z*rad*.45,v.x,v.z,rnd(1,1.5),r,kind,now,.16)}}
 // flecha/virote: entrada pequeña hacia el arquero, salida mayor al otro lado, línea del disparo
 arrow(B,C,fwd,rad,h,d,kind,now,mul,n0,xb){const p=new V3(),vel=new V3(),dir=new V3(),ent=new V3(C.x-fwd.x*rad*.8,C.y,C.z-fwd.z*rad*.8),ext=new V3(C.x+fwd.x*rad*.8,C.y,C.z+fwd.z*rad*.8),f=xb?1.25:1;
  const ne=cl(Math.round((2+Math.sqrt(d)*.6)*mul*f),2,9),nx=cl(Math.round((4+Math.sqrt(d)*1.4)*mul*f),3,22);
  dir.copy(fwd).multiplyScalar(-1).setY(.1).normalize();for(let k=0;k<ne;k++){const q=this.cone(dir,.5,vel.set(0,0,0)).clone();q.multiplyScalar(rnd(1.2,3));p.copy(ent);this.drop(p,q,rnd(.03,.055),kind,rnd(0,.03),.7)}
  dir.copy(fwd).setY(.08).normalize();for(let k=0;k<nx;k++){const q=this.cone(dir,.34,vel.set(0,0,0)).clone();q.multiplyScalar(rnd(3,6.5)*f);q.y+=rnd(0,1.2);p.copy(ext);this.drop(p,q,rnd(.035,.07),kind,rnd(.02,.09),.8)}
  const gy=this.ground(B.x,B.z);if(!isNaN(gy)&&kind!=='bone'){const r=(.09+.016*Math.sqrt(d))*rnd(.9,1.2);this.stain(B.x+fwd.x*rad*1.1,gy,B.z+fwd.z*rad*1.1,fwd.x,fwd.z,rnd(2.4,3.8),r,kind,now,.14);   // la línea del disparo, en el suelo detrás del blanco
   if(Math.random()<.7)this.stain(B.x+fwd.x*rad*.2,gy,B.z+fwd.z*rad*.2,fwd.x,fwd.z,rnd(1,1.4),r*.8,kind,now,.14)}}
 // muerte: charco que crece (≈2 s) bajo el cuerpo + salpicaduras bajas
 death(m,now){if(!this.on||this.level===0)return;const A=this.refs.actors&&this.refs.actors.map.get(m),mid=m.d&&m.d.id,kind=OF[mid]||'red';if(!KINDS[kind].stain&&kind!=='bone')return;
  const W3=this.W3,B=A?A.grp.position.clone():W3(m.x,m.y,TER.standZ(m.x,m.y)),rad=A?cl((A.tpl.rad||.4)*(A.sc||1),.22,1.3):.35,boss=m.d&&m.d.boss?1.35:1,gy=this.ground(B.x,B.z),mul=LEVEL_MUL[this.level]*(QL_MUL[typeof QL!=='undefined'?QL:2]||1);
  if(kind==='bone'){const p=new V3(),v=new V3();for(let k=0;k<Math.round(10*mul);k++){const a=Math.random()*TAU,s=rnd(.8,2.6);p.set(B.x,B.y+rnd(.2,.8),B.z);v.set(Math.cos(a)*s,rnd(.8,2.2),Math.sin(a)*s);this.drop(p,v,rnd(.03,.06),'bone',0,0)}return}
  if(!isNaN(gy)){const a0=Math.random()*TAU;this.stain(B.x,gy,B.z,Math.cos(a0),Math.sin(a0),rnd(1,1.25),cl(rad*.95,.28,1)*boss,kind,now,2.2);   // el charco grande, con vida más larga
   const i=(this.di+DECAL_CAP-1)%DECAL_CAP;this.dS[i*4+2]*=1.6;
   const ns=Math.round(rnd(3,6)*mul);for(let k=0;k<ns;k++){const a=Math.random()*TAU,dd=rad*rnd(.9,1.7);this.stain(B.x+Math.cos(a)*dd,gy,B.z+Math.sin(a)*dd,Math.cos(a),Math.sin(a),rnd(1,1.8),rnd(.07,.16),kind,now,.2)}}
  const p=new V3(),v=new V3(),nd=Math.round(rnd(8,13)*mul*boss);for(let k=0;k<nd;k++){const a=Math.random()*TAU,s=rnd(1.2,3.4);p.set(B.x,B.y+rnd(.15,.6),B.z);v.set(Math.cos(a)*s,rnd(.6,2),Math.sin(a)*s);this.drop(p,v,rnd(.04,.09),kind,rnd(0,.1),.8)}}
 // ── por fotograma ──
 update(dt,t,hp3,night,ql){this.qk=QL_MUL[typeof ql==='number'?ql:2]||1;const nt=cl(night||0,0,1),L=this.decMat.uniforms.uLight.value;
  L.set(1,.97,.93).multiplyScalar(1-.62*nt).lerp(new V3(.42,.5,.8),nt*.5);   // de noche, oscuro y azulado
  if(hp3)this.decMat.uniforms.uHero.value.set(hp3.x,hp3.y,hp3.z,1.6*nt);
  if(!this.nDrops&&!this.drops.visible)return;
  let live=0;const T=ISO.TILE;
  for(let i=0;i<DROP_CAP;i++){if(!this.pOn[i])continue;
   if(this.pDl[i]>0){this.pDl[i]-=dt;if(this.pDl[i]>0){live++;continue}this.pP[i*4+3]=this.pSz[i]}
   const o=i*4;this.pAge[i]+=dt;let vx=this.pV[o],vy=this.pV[o+1],vz=this.pV[o+2];vy-=GRAV*dt;const dr=Math.max(0,1-1.1*dt);vx*=dr;vz*=dr;
   this.pV[o]=vx;this.pV[o+1]=vy;this.pV[o+2]=vz;this.pP[o]+=vx*dt;this.pP[o+1]+=vy*dt;this.pP[o+2]+=vz*dt;
   const gy=this.ground(this.pP[o],this.pP[o+2]);
   if(isNaN(gy)&&this.pP[o+1]<(-.2)||(!isNaN(gy)&&this.pP[o+1]<=gy+.03)||this.pAge[i]>3){   // aterriza (o cae al agua / pasa de 3 s)
    if(this.pSt[i]&&!isNaN(gy)){const hs=Math.hypot(vx,vz),st=cl(1+hs*.3,1,3.4),r=this.pSz[i]*rnd(2.3,3.6)*(1+Math.min(1,-vy*.04));
     if(this.pSz[i]>.025){this.stain(this.pP[o],gy,this.pP[o+2],vx||1e-3,vz,st,r,KN[this.pStr[i]],performance.now(),.1)}}
    this.pOn[i]=0;this.pP[o+3]=0;continue}
   live++}
  this.nDrops=live;this.aPP.needsUpdate=true;this.aPV.needsUpdate=true;if(!live)this.drops.visible=false;
  this.stats.gotas=live;this.stats.manchas=this.nDec}
}
