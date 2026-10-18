// NotScape · R3D · núcleo (F0/F1). Solo se carga con ?r3d=1 (boot.mjs). El mundo lógico NO cambia.
// MODO HÍBRIDO (F1 → F2): el canvas 3D (#r3d) va DEBAJO del 2D (#c, transparente). En 3D: terreno, agua, pradera y HÉROE. En 2D, como siempre: props,
// recursos, estaciones, monstruos, HUD, luz nocturna (lighting) y efectos. Funciona porque la cámara ortográfica a 30° de elevación y 45° de acimut
// coincide EXACTAMENTE con ISO.proj (39,6 px lógicos por unidad, nivel = 0,6415): a 45° los sprites 2D caen en su sitio al píxel.
// · Héroe: se dibuja en un renderer propio (fondo transparente) y se copia al canvas 2D EN SU HUECO DE PROFUNDIDAD (drawHero), así los árboles o casas
//   que tiene delante lo tapan y los de detrás no. Un clon invisible (capa 2, solo lo ve la cámara de sombras) proyecta su sombra sobre el terreno.
// · Giro de cámara (rueda pulsada y arrastrar, o teclas , . — Inicio vuelve a 45°): se parchean ISO.toCanvas/toWorld/depth/keyDir, así los sprites 2D
//   se recolocan como billboards, los clics van por rayo y las flechas siguen los ejes de pantalla. Al soltar cerca de 45° se encaja exacto.
import * as THREE from 'three';
import {G,TOD,TODH,OIL,OIL_GLSL,setOil,setInk,mixTod,oilK} from './materials3d.js';
import {HeroGrade} from './herograde3d.js';
import {WU} from './terrain3d.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {Terrain} from './terrain3d.js';
import {HeroSel as Hero} from './herosel3d.js';
import {Props} from './props3d.js';
import {Contact} from './contact3d.js';
import {Stations,Facades} from './stations3d.js';
import {Resources} from './nature3d.js';
import {Actors} from './actors3d.js';
import {Particles} from './particles3d.js';
import {OUTFITS,outfitOf,outfitUnlocked,resolveLook} from './outfits3d.js';
import {HeroPreview} from './preview3d.js';

const PXU=ISO.HW*2/Math.SQRT2/ISO.TILE*ISO.TILE/1;   // px lógicos por unidad = 28/0.7071 = 39.6
const LVY=ISO.LV/(PXU*Math.cos(Math.PI/6));          // unidades por nivel de altura (0.6415)
const EL=Math.PI/6,A45=Math.PI/4;
const W3=(wx,wy,z)=>new THREE.Vector3(wx/ISO.TILE,(z-1)*LVY,wy/ISO.TILE);

const COARSE=!!(window.matchMedia&&matchMedia('(pointer:coarse)').matches);   // móvil/tablet: sombra de 1024 y MSAA×2 (guía §8)
export function createR3D(){
 const host=document.getElementById('cw'),c2d=document.getElementById('c');
 const cv=document.createElement('canvas');cv.id='r3d';cv.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;display:block;background:#2a1f24';host.insertBefore(cv,c2d);
 c2d.style.zIndex=1;c2d.style.background='transparent';
 const r=new THREE.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFSoftShadowMap;r.toneMapping=THREE.NoToneMapping;
 r.setClearColor('#2a1f24');
 const scene=new THREE.Scene(),cam=new THREE.OrthographicCamera(-1,1,1,-1,.1,200);
 const hemi=new THREE.HemisphereLight(),sun=new THREE.DirectionalLight();sun.castShadow=true;sun.shadow.mapSize.set(COARSE?1024:2048,COARSE?1024:2048);sun.shadow.bias=-.0006;sun.shadow.normalBias=.03;
 Object.assign(sun.shadow.camera,{left:-20,right:20,top:20,bottom:-20,near:.5,far:80});sun.shadow.camera.layers.enable(2);scene.add(hemi,sun,sun.target);
 const terr=new Terrain(scene,{grass:[1,1,.6,.35,0][typeof QL!=='undefined'?QL:2]});
 // héroe (escena propia) + clon de sombra en la escena principal
 const hero=new Hero(),aScene=new THREE.Scene(),aHemi=new THREE.HemisphereLight(),aSun=new THREE.DirectionalLight();aSun.castShadow=true;aSun.shadow.mapSize.set(1024,1024);aSun.shadow.bias=-.0008;aSun.shadow.normalBias=.01;
 Object.assign(aSun.shadow.camera,{left:-1.6,right:1.6,top:1.6,bottom:-1.6,near:.1,far:30});aScene.add(aHemi,aSun,aSun.target,hero.obj);
 const acv=document.createElement('canvas'),ar=new THREE.WebGLRenderer({canvas:acv,alpha:true,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:true,stencil:true});   // stencil: desde r163 viene apagado por defecto
 ar.setClearColor(0,0);   // (Lote R3D-HEROE-NR: antes esta línea iba pegada al comentario de arriba y NO se ejecutaba: el héroe no tenía sombras propias)
 ar.shadowMap.enabled=true;ar.shadowMap.type=THREE.PCFSoftShadowMap;ar.toneMapping=THREE.NoToneMapping;
 const acam=new THREE.OrthographicCamera(-1,1,1,-1,.1,200);let proxy=null,pA=[],pB=[];ar.autoClear=false;
 const hgrade=new HeroGrade(),HERO_BRUSH=.45,HERO_K=.85;   // HERO_K: el héroe recibe el grado al 85 % del mundo (legibilidad manda: no se funde con el fondo)
const aBack=new THREE.DirectionalLight('#7fa3ad',1);aScene.add(aBack,aBack.target);   // contraluz frío detrás del héroe (luz dividida cálido/frío de NRftW; igual que en preview3d.js)
   // Lote R3D-HEROE-NR: grado óleo del héroe; el pincel (Kuwahara) va al 45 % del del mundo para no emborronar la cara
 // F2-A: props estáticos en 3D (y su copia de solo profundidad en la escena del héroe, capa 3)
 const props=new Props(scene,aScene,W3);
 const sta=new Stations(scene,aScene,W3,props.mat,props.ink),fac=new Facades(scene,aScene,W3,props.mat,props.ink);   // F2 cierre: estaciones y cofres/santuarios en 3D
 const parts=new Particles(scene);   // F3e: luciérnagas, hojas, pétalos, nieve, brasas, ceniza y lluvia en GPU (3 draw calls)
 const actors=new Actors(scene,W3,aScene);   // Lote R3D-ACTORES: enemigos, animales, jefes y Ru como SkinnedMesh en el mundo (copia de solo profundidad en aScene para que tapen al héroe)
 const res=new Resources(scene,aScene,W3);
 const cts=new Contact(scene,W3);   // F3f·P3A: sombras de contacto (1 draw call)   // F2-B: árboles talables (follaje por especie) y menas
 // RAYOS X (legibilidad tipo Diablo/PoE): lo que el héroe tiene detrás de una casa 3D se dibuja como silueta clara. El stencil marca los píxeles donde el
 // héroe SÍ se ve, para que su propio brazo de detrás no se pinte como silueta sobre su torso.
 const XRAY=new THREE.MeshBasicMaterial({color:'#ffe6b8',transparent:true,opacity:.42,depthWrite:false,depthFunc:THREE.GreaterDepth,stencilWrite:true,stencilRef:1,stencilFunc:THREE.NotEqualStencilFunc,stencilZPass:THREE.KeepStencilOp,stencilFail:THREE.KeepStencilOp,stencilZFail:THREE.KeepStencilOp});
 let stKey='';const markStencil=()=>{if(stKey===hero.lookKey+hero.cloth.length)return;stKey=hero.lookKey+hero.cloth.length;hero.obj.traverse(o=>{if(!o.material)return;[].concat(o.material).forEach(m=>{m.stencilWrite=true;m.stencilRef=1;m.stencilFunc=THREE.AlwaysStencilFunc;m.stencilZPass=THREE.ReplaceStencilOp})})};
 const blob=new THREE.Mesh(new THREE.CircleGeometry(.3,20).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.28,depthWrite:false}));blob.renderOrder=1;scene.add(blob);
 function syncProxy(){if(!proxy||proxy.userData.key!==hero.lookKey+'|'+hero.cloth.length){if(proxy)scene.remove(proxy);proxy=hero.obj.clone(true);proxy.userData.key=hero.lookKey+'|'+hero.cloth.length;
   pA=[];pB=[];hero.obj.traverse(o=>pA.push(o));proxy.traverse(o=>{pB.push(o);o.layers.set(2);if(o.userData.hull)o.visible=false});scene.add(proxy)}
  for(let i=0;i<pA.length;i++){const a=pA[i],b=pB[i];if(!b)break;b.position.copy(a.position);b.quaternion.copy(a.quaternion);b.scale.copy(a.scale);b.visible=a.visible&&!a.userData.hull}}
 // ── cámara y proyección ──
 let az=A45,azT=A45,drag=null,keyRot=0;const tgt=new THREE.Vector3(),tmp=new THREE.Vector3();
 function ppu(){return PXU*ISO.scale()}
 function placeCam(c,center,halfW,halfH){c.left=-halfW;c.right=halfW;c.top=halfH;c.bottom=-halfH;c.updateProjectionMatrix();
  c.position.set(center.x+Math.sin(az)*Math.cos(EL)*60,center.y+Math.sin(EL)*60,center.z+Math.cos(az)*Math.cos(EL)*60);c.lookAt(center);c.updateMatrixWorld()}
 const isStraight=()=>Math.abs(az-A45)<1e-4;
 const O={toCanvas:ISO.toCanvas,toWorld:ISO.toWorld,depth:ISO.depth,keyDir:ISO.keyDir};
 function proj(v){tmp.copy(v).project(cam);return{x:Math.round((tmp.x+1)/2*ISO.V.cw),y:Math.round((1-tmp.y)/2*ISO.V.ch)}}
 ISO.toCanvas=(wx,wy,z=0)=>isStraight()?O.toCanvas(wx,wy,z):proj(W3(wx,wy,z));
 ISO.toWorld=(px,py,hz,levels)=>{if(isStraight())return O.toWorld(px,py,hz,levels);const nx=px/ISO.V.cw*2-1,ny=1-py/ISO.V.ch*2,o=new THREE.Vector3(nx,ny,-1).unproject(cam),d=new THREE.Vector3();cam.getWorldDirection(d);
  const at=z=>{const y=(z-1)*LVY,t=(y-o.y)/d.y,p=o.clone().addScaledVector(d,t);return{x:p.x*ISO.TILE,y:p.z*ISO.TILE,z,t}};
  if(!hz){const w=at(0);return{x:w.x,y:w.y,z:0}}let best=null;for(const z of levels||[0,.75,1,2]){const w=at(z);if(Math.abs((hz(w.x,w.y)||0)-z)<1e-6&&(!best||w.t<best.t))best=w}
  if(best)return{x:best.x,y:best.y,z:best.z};let z=1,w=at(1);for(let i=0;i<4;i++){z=hz(w.x,w.y)||0;w=at(z)}return{x:w.x,y:w.y,z}};
 ISO.depth=(wx,wy,w=0,h=0)=>isStraight()?O.depth(wx,wy,w,h):((wx+w)*Math.sin(az)+(wy+h)*Math.cos(az))*Math.SQRT2;
 ISO.keyDir=(l,rr,u,d)=>{if(isStraight())return O.keyDir(l,rr,u,d);const hh=(rr|0)-(l|0),v=(d|0)-(u|0),x=hh*Math.cos(az)+v*Math.sin(az),y=-hh*Math.sin(az)+v*Math.cos(az),n=Math.hypot(x,y);return n?{x:x/n,y:y/n}:{x:0,y:0}};
 // ── giro: rueda pulsada + arrastrar · teclas , y . · Inicio = 45° ──
 c2d.addEventListener('pointerdown',e=>{if(e.button===1){drag={x:e.clientX,a:azT};e.preventDefault();try{c2d.setPointerCapture(e.pointerId)}catch(x){}}},true);
 c2d.addEventListener('pointermove',e=>{if(drag){azT=drag.a-(e.clientX-drag.x)*.008}});
 const endDrag=()=>{if(!drag)return;drag=null;snap()};c2d.addEventListener('pointerup',endDrag);c2d.addEventListener('pointercancel',endDrag);
 c2d.addEventListener('auxclick',e=>{if(e.button===1)e.preventDefault()});
 const snap=()=>{const k=((azT-A45)%(Math.PI*2)+Math.PI*3)%(Math.PI*2)-Math.PI;if(Math.abs(k)<.12)azT=A45+(azT-A45-k)};
 addEventListener('keydown',e=>{if(/INPUT|TEXTAREA/.test((e.target||{}).tagName||''))return;if(e.key===',')keyRot=1;if(e.key==='.')keyRot=-1;if(e.key==='Home'){azT=A45+Math.round((azT-A45)/(Math.PI*2))*Math.PI*2}});
 addEventListener('keyup',e=>{if(e.key===','||e.key==='.'){keyRot=0;snap()}});
 // ── F3 · LUZ (guía §4.8): la hora del juego (sunS) mezcla las filas noche/atardecer/día de TOD → hemisférica, sol/luna con sombra, saturación, verde vivo,
 //    contorno, rim, agua, niebla, bloom, viñeta y cielo. El héroe (renderer aparte) sigue con la fila «dia»: lo oscurece la MISMA capa 2D que a los sprites
 //    (lighting() en modo source-atop, con huecos de luz de light.js), así héroe y sprites casan entre sí.
 let TODc=TOD.dia;
 function todAt(t){const s=typeof sunS==='function'?sunS(t):1,d=Math.max(typeof WXD!=='undefined'?WXD:0,Math.max(0,Math.min(1,(.15-s)/.55))),w=Math.max(0,1-Math.abs(s)*4);
  let p=mixTod(TOD.dia,TOD.noche,d);p=mixTod(p,TOD.atardecer,Math.min(.85,w*(1-d*.4)));p.nt=d;return p}
 function light(p){hemi.color.set(p.hemS);hemi.groundColor.set(p.hemG);hemi.intensity=p.hemI;sun.color.set(p.sun);sun.intensity=p.sunI;
  const D=TODH.dia;aHemi.color.set(D.hemS);aHemi.groundColor.set(D.hemG);aHemi.intensity=D.hemI;aSun.color.set(D.sun);aSun.intensity=D.sunI;
  G.uSat.value=p.sat;G.uLive.value=p.live;setInk(p.ink,p.inkK);G.uRimCol.value.set(p.rim);G.uWinI.value=p.win;WU.uDeep.value.set(p.wDeep);WU.uShal.value.set(p.wShal);
  r.setClearColor(p.sky);TODc=p}
 light(TOD.dia);
 // ── luces prácticas (guía §4.8): de las MISMAS fuentes que light.js (props con lamp/LIGHTN y estaciones fire/furnace); las 4 más cercanas a la cámara ──
 const LK={farola:['#ffb060',1.9,4,1.25,'win'],linterna:['#ffb866',1.5,3.4,1.15,'win'],faro:['#ffc070',2.4,6,1.6,'win'],brasero:['#ff8a30',3.2,4.5,.9,'fire'],antorcha:['#ff8a30',2.6,4,1.1,'fire'],
  hoguera:['#ff8a30',5,6.5,.75,'fire'],lava:['#ff5020',3.5,5,.5,'fire'],fire:['#ff8a30',5,6.5,.75,'fire'],furnace:['#ff7030',3,4,.8,'fire']};
 const LAMPK={farola:'farola',brasero:'brasero',linterna:'linterna',antorcha:'antorcha',hoguera:'hoguera',faro:'faro'},LIGHTN={hoguera:'hoguera',antorcha:'antorcha',fumarola:'lava',faroLava:'lava',estelaLava:'lava',altarDemon:'lava',lavaPozo:'lava',fogataC:'hoguera',tiendaFuego:'antorcha'};
 let SRC=null,srcSig='';const pool=[0,1,2,3].map(()=>{const l=new THREE.PointLight(0xffa050,0,4,1.3);scene.add(l);return l});
 const lantern=new THREE.PointLight(0xffb866,0,3.2,1.4);scene.add(lantern);const aLantern=new THREE.PointLight(0xffb866,0,2.4,1.4);aScene.add(aLantern);
 function sources(){const sig=PROPS.list.length+'|'+ST.length;if(SRC&&sig===srcSig)return SRC;srcSig=sig;SRC=[];
  PROPS.list.forEach(e=>{const k=e.lamp?(LAMPK[e.n]||'farola'):LIGHTN[e.n];if(!k)return;const z=TER.standZ(e.x,e.y),p=W3(e.x,e.y,z);p.y+=LK[k][3];SRC.push({p,k,ph:(e.x*.13+e.y*.07)%6.28})});
  ST.forEach(e=>{if(e.id!=='fire'&&e.id!=='furnace')return;const p=W3(e.x,e.y,TER.standZ(e.x,e.y));p.y+=LK[e.id][3];SRC.push({p,k:e.id,ph:(e.x*.11)%6.28})});return SRC}
 function lights(t,p){const L=sources().map(s=>[s,Math.hypot(s.p.x-tgt.x,s.p.z-tgt.z)]).sort((a,b)=>a[1]-b[1]).slice(0,4);
  const fl=1+Math.sin(t*11)*.12+Math.sin(t*5)*.08+Math.sin(t*23)*.04;G.uFireI.value=fl*(.55+.45*p.fire);
  pool.forEach((l,i)=>{const e=L[i];if(!e||e[1]>18){l.intensity=0;return}const d=LK[e[0].k];l.position.copy(e[0].p);l.color.set(d[0]);l.distance=d[2];l.intensity=d[1]*(d[4]==='fire'?p.fire*(1+Math.sin(t*11+e[0].ph)*.12+Math.sin(t*5+e[0].ph)*.08):p.win)})}
 // ── postproceso (guía §4.7): RenderPass → bloom → grado (sombras levantadas, viñeta) → salida. Sin grano. Calidad Baja/Mínima = sin post ──
 const composer=new EffectComposer(r,new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:COARSE?2:4}));composer.addPass(new RenderPass(scene,cam));
 // 17 oct 2026 (pedido del dueño): SIN NIEBLA. Se quitó el pase de niebla a ras de suelo (fogPass): invadía la pantalla de día. Ver «Lote R3D-NONIEBLA» en AGENTS.md.
 const bloom=new UnrealBloomPass(new THREE.Vector2(256,256),.35,.6,.85);composer.addPass(bloom);
 // F3d · grado «óleo oscuro» (guía §4.9). uK = intensidad del grado de color (tono dividido, desaturar, contraste, manchas); uBrush = mezcla del Kuwahara (el pincel, lo PRIMERO que se baja
 // por legibilidad). Con uK=0 y uBrush=0 es el grado de F3a (sombras levantadas + viñeta). Sin grano ni trama (el dueño los rechazó dos veces).
 const grade=new ShaderPass({uniforms:{tDiffuse:{value:null},uRes:{value:new THREE.Vector2(1,1)},uLift:{value:new THREE.Color('#000')},uVig:{value:.28},uK:{value:0},uBrush:{value:0}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform sampler2D tDiffuse;uniform vec2 uRes;uniform float uVig,uK,uBrush;uniform vec3 uLift;varying vec2 vUv;
   ${OIL_GLSL}
   // Kuwahara de 4 sectores (3×3 lecturas cada uno, gana el de menor varianza): aplana degradados en manchas de pincel y conserva bordes
   vec3 kuw(vec2 uv,float s){vec2 px=s/uRes;vec3 bm=vec3(0.);float bv=1e9;
    for(int q=0;q<4;q++){vec2 sg=vec2(q==0||q==2?-1.:1.,q<2?-1.:1.);vec3 m=vec3(0.);float l2=0.;
     for(int i=0;i<3;i++)for(int j=0;j<3;j++){vec3 c=texture2D(tDiffuse,uv+px*sg*vec2(float(i),float(j))).rgb;m+=c;float l=olum(c);l2+=l*l;}
     m/=9.;float l=olum(m);float v=l2/9.-l*l;if(v<bv){bv=v;bm=m;}}
    return bm;}
   void main(){float sc=max(1.,uRes.y/620.);vec3 c=texture2D(tDiffuse,vUv).rgb;
    if(uBrush>.01)c=mix(c,kuw(vUv,sc),uBrush);
    c=oilGrade(c,vUv*uRes/sc,uLift,uK);                                                 // receta compartida con el héroe (materials3d.js OIL_GLSL)
    c*=oilVig(vUv,uRes,uVig);gl_FragColor=vec4(c,1.);}`});
 composer.addPass(grade);composer.addPass(new OutputPass());let cSize='';
 // Tiempo REAL de GPU por pase (EXT_disjoint_timer_query_webgl2, si el navegador lo da): R3D.gpu = {mundo, heroe} en ms (media móvil). Se muestra en el panel F3.
 const mkT=rr=>{const gl=rr.getContext(),ext=gl.getExtension('EXT_disjoint_timer_query_webgl2'),qs=[];return{ok:!!ext,
  begin(n){if(!ext||qs.length>6)return null;const q=gl.createQuery();gl.beginQuery(ext.TIME_ELAPSED_EXT,q);return{q,n}},end(h){if(h){gl.endQuery(ext.TIME_ELAPSED_EXT);qs.push(h)}},
  poll(o){if(!ext)return;const dis=gl.getParameter(ext.GPU_DISJOINT_EXT);for(let i=0;i<qs.length;){const h=qs[i];if(gl.getQueryParameter(h.q,gl.QUERY_RESULT_AVAILABLE)){const ms=gl.getQueryParameter(h.q,gl.QUERY_RESULT)/1e6;if(!dis)o[h.n]=o[h.n]==null?ms:o[h.n]+(ms-o[h.n])*.08;gl.deleteQuery(h.q);qs.splice(i,1)}else i++}}}};
 const GPU={},tW=mkT(r),tH=mkT(ar);
 let cloudK=1,shrMin=.15;let last=0,trail=[],aBox=null,heroScreen=null,qGrass=-1;
 function frame(now){const t=now/1000,dt=last?Math.min(.1,(now-last)/1000):1/60;last=now;G.uTime.value=t;
  if(keyRot)azT+=keyRot*dt*1.6;az+=(azT-az)*(1-Math.exp(-dt*12));if(Math.abs(az-azT)<1e-4)az=azT;
  const V=ISO.V,cssW=V.cw/V.dpr,cssH=V.ch/V.dpr;if(r.getPixelRatio()!==V.dpr)r.setPixelRatio(V.dpr);const sz=r.getSize(new THREE.Vector2());if(sz.x!==cssW||sz.y!==cssH)r.setSize(cssW,cssH,false);
  const w=ISO.unproj(ISO.cam.x,ISO.cam.y,1);tgt.set(w.x/ISO.TILE,0,w.y/ISO.TILE);const k=ppu();placeCam(cam,tgt,V.cw/2/k,V.ch/2/k);
  // noche → rim y ojos de la capucha (el oscurecido lo hace lighting() en 2D)
  const tp=todAt(t),nt=tp.nt;light(tp);G.uNight.value=tp.night;lights(t,tp);
  // F3f·P6 · halo del santuario: la gema (aEmit=3) se atenúa al acercarse el héroe (si no, el haz + el bloom lo sobreexponen: mancha blanca). A ≥3,6 tiles brillo completo; a ≤1,2 tiles `shrMin`. Suavizado en el tiempo.
  {let dm=99;if(typeof PO!=='undefined'&&typeof P!=='undefined')for(const e of PO)if(e.n==='santuario'){const d=Math.hypot(e.x-P.x,e.y-P.y)/ISO.TILE;if(d<dm)dm=d}
   const u=Math.min(1,Math.max(0,(dm-1.2)/2.4)),tk=shrMin+(1-shrMin)*u*u*(3-2*u);G.uShrK.value+=(tk-G.uShrK.value)*(1-Math.exp(-dt*6))}
  // calidad del pasto según la calidad del juego (Máxima/Alta/Media/Baja/Mínima)
  const q=[1,1,.6,.35,0][typeof QL!=='undefined'?QL:2];if(q!==qGrass){qGrass=q;terr.setQuality(q)}
  G.uCloud.value=(typeof QL!=='undefined'&&QL>=4)?0:cloudK;   // F3f·P2: sombras de nubes (apagadas en calidad Mínima)
  terr.update(tgt.x,tgt.z,Math.max(V.cw,V.ch)/k*.85+4);{const hp=typeof P!=='undefined'?W3(P.x,P.y,TER.standZ(P.x,P.y)):tgt,S=Math.min(44,Math.max(22,Math.hypot(V.cw/2/k,V.ch/k)*2.2));   // volumen que envuelve la pantalla (tiles)
   parts.update(dt,tgt.x,hp.y,tgt.z,typeof curB!=='undefined'?curB:0,tp.night,typeof WXD!=='undefined'?WXD:0,ISO.scale()*V.dpr/1.9,S,typeof QL!=='undefined'?QL:2)}
  terr.lodR=[14,12,10,8,7][typeof QL!=='undefined'?QL:2];terr.lod(tgt.x,tgt.z);props.update();sta.update(now,t,typeof HOV!=='undefined'?HOV:null,typeof A!=='undefined'&&A?A.e:null);fac.update(now,t,typeof HOV!=='undefined'?HOV:null);res.update(now,t,typeof HOV!=='undefined'?HOV:null,typeof A!=='undefined'&&A?A.e:null);
  // actores 3D (antes que el héroe: su copia de profundidad en aScene tiene que estar al día cuando se dibuja el héroe)
  actors.update(now,t,dt,tgt,Math.max(V.cw,V.ch)/k*.85+4,typeof HOV!=='undefined'?HOV:null,typeof P!=='undefined'?P:{x:0,y:0});actors.grp.updateMatrixWorld(true);cts.update(props,res,actors,typeof P!=='undefined'?P:null,tp.night,typeof QL!=='undefined'?QL:2);
  // héroe
  const st=typeof heroState3D==='function'?heroState3D(now):null;
  if(st){hero.setLook(resolveLook(st.look));const p=W3(st.x,st.y,st.z);
   hero.update({x:p.x,y:p.y,z:p.z,mv:st.mv,run:st.run,w:st.w,act:st.act,hurt:st.hurt,cb:st.cb,t,face:st.fx!=null?[st.fx,st.fy]:null,night:nt,wind:[.9,.4]},dt);
   blob.position.set(p.x,p.y+.012,p.z);lantern.position.set(p.x+.15,p.y+.75,p.z+.1);lantern.intensity=1.8*nt*(1+Math.sin(t*9)*.05);aLantern.position.set(p.x+.15,p.y+.7,p.z+.25);aLantern.intensity=1.4*nt;   // linterna del héroe: se enciende sola de noche (guía §1.3)
   // rastro en el pasto (4 puntos, se recupera en ~1,6 s)
   if(!trail.length||Math.hypot(p.x-trail[0].x,p.z-trail[0].z)>.14)trail.unshift({x:p.x,z:p.z,t});if(trail.length>4)trail.length=4;
   G.uTrail.value.forEach((v,i)=>{const q=i===0?{x:p.x,z:p.z,t}:trail[i];v.set(q?q.x:99,q?q.z:99,q?(i===0?1:Math.max(0,1-(t-q.t)/1.6)*.9):0)});
   syncProxy();
   // renderer del héroe: recorte de ±HA unidades alrededor del ancla (a media altura)
   // Lote R3D-HEROE-MAXQ: el héroe SIEMPRE se pinta como en calidad Máxima. `hs` = cuánto más densa que el lienzo del juego es su resolución (dpr de Máxima / dpr actual, ≥1);
   // `px` = tamaño en px del lienzo del juego (posición y copia), `pxr` = tamaño real del render del héroe. En Máxima hs=1 (nada cambia).
   const dprMax=Math.max(V.dpr,Math.min(window.devicePixelRatio||1,Math.sqrt((typeof QCAPS!=='undefined'?QCAPS[0]:4.5e6)/(cssW*cssH)))),hs=Math.min(2,Math.max(1,dprMax/V.dpr));
   const HA=1.4,anc=new THREE.Vector3(p.x,p.y+.55,p.z),px=Math.ceil(HA*2*k),pxr=Math.ceil(HA*2*k*hs);if(acv.width!==pxr){ar.setPixelRatio(1);ar.setSize(pxr,pxr,false)}
   placeCam(acam,anc,HA,HA);aBack.position.set(anc.x-Math.sin(az)*6,anc.y+4,anc.z-Math.cos(az)*6);aBack.target.position.copy(anc);aBack.intensity=.85-.5*nt;aSun.position.copy(anc).add(new THREE.Vector3(...TOD.dia.sunP).normalize().multiplyScalar(12));aSun.target.position.copy(anc);
   markStencil();ar.shadowMap.needsUpdate=true;ar.shadowMap.autoUpdate=false;const sp=proj(anc),hx0=sp.x-px/2,hy0=sp.y-px/2;
   const th=tH.begin('heroe');hgrade.begin(ar,pxr,pxr);                                                        // Lote R3D-HEROE-NR: los 3 pases van a un render target (MSAA + stencil)…
   acam.layers.set(3);ar.render(aScene,acam);                                     // 1) casas y props 3D: solo profundidad
   acam.layers.set(0);ar.render(aScene,acam);                                     // 2) héroe (lo tapado no se dibuja; marca stencil)
   aScene.overrideMaterial=XRAY;ar.render(aScene,acam);aScene.overrideMaterial=null;   // 3) silueta donde está detrás de algo
   hgrade.end(ar,{thick:0,hs,K:oilK(tp.night)*HERO_K,brush:.85*Math.pow(oilK(tp.night),1.6)*HERO_BRUSH,lift:tp.lift,vig:tp.vig,sc:Math.max(1,V.ch/620),off:[hx0,hy0],scr:[V.cw,V.ch]})   // …y se copian al canvas del héroe con el MISMO grado óleo que el mundo EN MÁXIMA (Lote R3D-HEROE-MAXQ: ya NO depende de QL ni del dpr)
   tH.end(th);heroScreen={x:hx0,y:hy0,w:px,h:px,rod:hero.rodTip?proj(hero.rodTip):null,aim:st.aim}}
  G.uChrB.value.set(0,0);   // el degradado pies→cabeza del material `chr` es del héroe (global): en el pase del mundo se apaga para los actores
  sun.position.copy(tgt).add(new THREE.Vector3(...TOD.dia.sunP).normalize().multiplyScalar(30));sun.target.position.copy(tgt);
  const post=(typeof QL==='undefined'?2:QL)<=2;
  if(post){const key=cssW+'x'+cssH+'@'+V.dpr;if(key!==cSize){cSize=key;composer.setPixelRatio(V.dpr);composer.setSize(cssW,cssH);bloom.resolution.set(cssW/2,cssH/2);grade.uniforms.uRes.value.set(V.cw,V.ch)}
   bloom.strength=tp.bloom;grade.uniforms.uLift.value.set(tp.lift);grade.uniforms.uVig.value=tp.vig;
   {const ke=oilK(tp.night);grade.uniforms.uK.value=ke;grade.uniforms.uBrush.value=(typeof QL==='undefined'||QL<=1)?.85*Math.pow(ke,1.6):0}   // F3f·P1: óleo según la hora;   // F3d: el pincel baja más rápido que el color; calidad Media o inferior = sin Kuwahara
   const tw=tW.begin('mundo');composer.render(dt);tW.end(tw)}else{const tw=tW.begin('mundo');r.render(scene,cam);tW.end(tw)}
  tW.poll(GPU);tH.poll(GPU)}
 // el héroe en su hueco de profundidad del 2D (lo llama draw() de game.js en lugar de dP)
 function drawHero(ctx){if(!heroScreen)return;ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(acv,heroScreen.x,heroScreen.y,heroScreen.w,heroScreen.h);
  const h=heroScreen;if(h.rod&&h.aim){const q=ISO.toCanvas(h.aim.x,h.aim.y,TER.standZ(h.aim.x,h.aim.y)),u=Math.min(1,(h.aim.ph||0)/.26),bx=h.rod.x+(q.x-h.rod.x)*u,by=h.rod.y+(q.y-h.rod.y)*u-(u<1?Math.sin(u*Math.PI)*40:0);
   ctx.lineWidth=Math.max(1,ISO.scale()*.6);ctx.strokeStyle='rgba(255,255,255,.8)';ctx.beginPath();ctx.moveTo(h.rod.x,h.rod.y);ctx.quadraticCurveTo((h.rod.x+bx)/2,Math.max(h.rod.y,by)+6,bx,by);ctx.stroke();
   ctx.fillStyle='#e33';ctx.fillRect(bx-2,by-2,4,4)}ctx.restore()}
 function show(on){cv.style.display=on?'block':'none'}
 // precarga: construye todos los chunks a la vista antes de quitar la pantalla de carga
 function preload(){const V=ISO.V,w=ISO.unproj(ISO.cam.x,ISO.cam.y,1),k=ppu(),R=Math.max(V.cw,V.ch)/k*.85+4;const cx=w.x/ISO.TILE,cz=w.y/ISO.TILE;terr.update(cx,cz,R,true);const n=terr.pending(cx,cz,R);return n}
 // F3d · perilla «Óleo» (0–100 %): guardada en localStorage (NO en S: es un ajuste del cliente, no de la partida). Slider #ov del HUD (oculto sin ?r3d=1).
 const OK_='ns_oleo';let oilV=null;try{const v=localStorage.getItem(OK_);if(v!==null&&v!==''&&isFinite(+v))oilV=Math.max(0,Math.min(100,+v))}catch(e){}
 if(oilV!==null)setOil(oilV/100);
 {const sl=document.getElementById('ov'),lb=document.getElementById('ovl');if(sl){sl.value=Math.round(OIL.K*100);if(lb)lb.hidden=false;
  sl.oninput=e=>{setOil(+e.target.value/100);try{localStorage.setItem(OK_,String(Math.round(OIL.K*100)))}catch(_){}}}}
 return{gpu:GPU,dbg:{cts,composer,bloom,grade,sun,pool,lantern,aLantern,aSun,aBack,ar,hgrade,parts,scene,aScene},outfits:{list:OUTFITS,of:outfitOf,unlocked:outfitUnlocked,resolve:resolveLook},preview:cvs=>new HeroPreview(cvs),get shrineMin(){return shrMin},set shrineMin(v){shrMin=Math.max(0,Math.min(1,+v||0))},get contact(){return cts.k},set contact(v){cts.k=Math.max(0,Math.min(1.5,+v||0))},get clouds(){return cloudK},set clouds(v){cloudK=Math.max(0,Math.min(1.5,+v||0))},get oilDay(){return OIL.H},set oilDay(v){OIL.H=Math.max(0,Math.min(1,+v||0));setOil(OIL.K)},get oil(){return OIL.K},set oil(v){setOil(v);const sl=document.getElementById('ov');if(sl)sl.value=Math.round(OIL.K*100)},frame,drawHero,show,preload,get tod(){return TODc},get propsOn(){return props.on},get parts3d(){return parts.on},parts,get resOn(){return res.on},get stOn(){return sta.on},get facOn(){return fac.on},get poOn(){return sta.poOn},sta,props,res,actors,get az(){return az},set az(v){az=azT=v},renderer:r,scene,hero,terr,stats:()=>({calls:r.info.render.calls,tris:r.info.render.triangles,chunks:terr.ch.size})}}
