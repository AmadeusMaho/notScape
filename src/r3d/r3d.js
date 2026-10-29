// NotScape · R3D · núcleo (F0/F1). Solo se carga con ?r3d=1 (boot.mjs). El mundo lógico NO cambia.
// MODO HÍBRIDO (F1 → F2): el canvas 3D (#r3d) va DEBAJO del 2D (#c, transparente). En 3D: terreno, agua, pradera y HÉROE. En 2D, como siempre: props,
// recursos, estaciones, monstruos, HUD, luz nocturna (lighting) y efectos. Funciona porque la cámara ortográfica a 30° de elevación y 45° de acimut
// coincide EXACTAMENTE con ISO.proj (39,6 px lógicos por unidad, nivel = 0,6415): a 45° los sprites 2D caen en su sitio al píxel.
// · Héroe: se dibuja en un renderer propio (fondo transparente) y se copia al canvas 2D EN SU HUECO DE PROFUNDIDAD (drawHero), así los árboles o casas
//   que tiene delante lo tapan y los de detrás no. Un clon invisible (capa 2, solo lo ve la cámara de sombras) proyecta su sombra sobre el terreno.
// · Giro de cámara (rueda pulsada y arrastrar, o teclas , . — Inicio vuelve a 45°): se parchean ISO.toCanvas/toWorld/depth/keyDir, así los sprites 2D
//   se recolocan como billboards, los LMB van por rayo y las flechas siguen los ejes de pantalla. Al soltar cerca de 45° se encaja exacto.
import * as THREE from 'three';
import {G,TOD,TODH,OIL,OIL_GLSL,setOil,setInk,mixTod,oilK,twin,INK,INKS,INKX,INK_H} from './materials3d.js';
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
import {Stations,DoorGlow} from './stations3d.js';
import {Resources} from './nature3d.js';
import {Actors} from './actors3d.js';
import {Particles} from './particles3d.js';
import {Water} from './water3d.js';   // Lote R3D-AGUA-IMPL: agua D con física + peces + flotador 3D
import {SunRays} from './rays3d.js';
import {LampGlow} from './lampglow3d.js';
import {DynLight} from './dynlight3d.js';   // Lote R3D-LUZ-DIN: luces con oclusión por altura (sustituye a las PointLight)   // Lote R3D-LUZ: halos y charcos de luz de faroles/fuegos   // Lote R3D-F7-RAYOS: haces de sol del Bosque
import {Rooms3D,INT_TP,CAVE_TP} from './interiors3d.js';   // Lote R3D-F15b: interiores en 3D
import {Drops} from './drops3d.js';   // Lote R3D-DROPS-3D: objetos del suelo en 3D, recogida por LMB y estela de luz en los raros
import {SkyZone} from './skyzone3d.js';   // Lote ISLA-2: acantilado, mar de nubes, anillo de nubes y cascadas de la zona del Cielo
import {Fragment,Debris,Embers} from './cinefx3d.js';
import {SkyFire} from './skyfire3d.js';   // 22 oct 2026: llamaradas alrededor de la isla mientras arde el cielo
import {Impact,Aura} from './impact3d.js';   // lote ENCANT-IMPACTO: efectos de impacto de los encantamientos (R3D.impact)
import {BodyFx} from './bodyfx3d.js';   // lote ENCANT-VFX-CUERPO: funda procedural sobre el cuerpo (estados, impactos y reacciones) (R3D.body)
import {SpellFX} from './spellfx3d.js';import {FX} from './fx3d.js';   // 21 oct 2026: partículas suaves (R3D.fx)
   // 21 oct 2026: bola de fuego (R3D.spell)   // Lote CINE-3: fragmento del tiempo, escombros, brasas
import {Gabriel} from './gabriel3d.js';   // Lote CINE-2: ángel caído de la cinemática (R3D.gabriel)
import {Blood} from './blood3d.js';   // Lote R3D-SANGRE: salpicaduras + manchas en el suelo
import {OUTFITS,outfitOf,outfitUnlocked,resolveLook} from './outfits3d.js';
import {HeroPreview} from './preview3d.js';
import {TalkHead} from './portrait3d.js';
import {ShaderGate} from './shadergate3d.js';   // Lote ANTI-TIRONES (25 oct 2026): lo que nace en juego compila sus shaders en segundo plano, oculto, en vez de congelar

const PXU=ISO.HW*2/Math.SQRT2/ISO.TILE*ISO.TILE/1;   // px lógicos por unidad = 28/0.7071 = 39.6
const LVY=ISO.LV/(PXU*Math.cos(Math.PI/6));          // unidades por nivel de altura (0.6415)
const EL=Math.PI/6,A45=Math.PI/4;
const W3=(wx,wy,z)=>new THREE.Vector3(wx/ISO.TILE,(z-1)*LVY,wy/ISO.TILE);

// OPT-RENDIMIENTO (22 oct 2026): el PASTO era ~50 % de los triángulos de la vista (745 000 en Alta). Densidad por calidad (Máx…Mín) y radio de la brizna completa (`lodR`, arriba) más cortos.
const GRASS_Q=[1.15,1,.5,.25,0];   // PASTO-FRONDOSO (22 oct 2026, APROBADO por el dueño): más densidad SOLO en Máxima/Alta (antes [1,.8,…]); Media/Baja/Mínima (integradas y móvil) sin cambios. Subirlo más = permiso del dueño (rules_check lo vigila)
let shF=0;
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
 const terr=new Terrain(scene,{grass:GRASS_Q[typeof QL!=='undefined'?QL:2]});
 // héroe (escena propia) + clon de sombra en la escena principal
 const hero=new Hero(),aScene=new THREE.Scene(),aHemi=new THREE.HemisphereLight(),aSun=new THREE.DirectionalLight();aSun.castShadow=true;aSun.shadow.mapSize.set(1024,1024);aSun.shadow.bias=-.0008;aSun.shadow.normalBias=.01;
 Object.assign(aSun.shadow.camera,{left:-1.6,right:1.6,top:1.6,bottom:-1.6,near:.1,far:30});aScene.add(aHemi,aSun,aSun.target,hero.obj);terr.occ=aScene;   // Fase 49c: las cordilleras entran en el pase de oclusión del héroe

 // FLUIDEZ F4 (26 oct 2026): el héroe YA NO tiene un 2.º renderer/contexto WebGL (`ar` + lienzo `acv` copiado a la capa 2D con drawImage = 2,5–4 ms de CPU fijos por fotograma).
 // Sus 3 pases (oclusión, héroe con stencil, rayos X) los pinta el renderer PRINCIPAL en el render target de HeroGrade, el grado óleo va a `hgrade.out` y se COMPONE en el
 // propio lienzo 3D tras el mundo (hgrade.composite, mezcla premultiplicada). Mismo aspecto: mismas luces (las de aScene), mismo grado, misma sombra propia (aSun).
 const ar=r;aScene.matrixWorldAutoUpdate=false;   // `ar` queda como alias del renderer principal (código antiguo); la escena del héroe se actualiza UNA vez por fotograma, no en cada uno de sus 3 pases
 const acam=new THREE.OrthographicCamera(-1,1,1,-1,.1,200);let proxy=null,pA=[],pB=[];
 const hgrade=new HeroGrade(),HERO_BRUSH=.45,HERO_K=.85;   // HERO_K: el héroe recibe el grado al 85 % del mundo (legibilidad manda: no se funde con el fondo)
const aBack=new THREE.DirectionalLight('#7fa3ad',1);aScene.add(aBack,aBack.target);   // contraluz frío detrás del héroe (luz dividida cálido/frío de NRftW; igual que en preview3d.js)
   // Lote R3D-HEROE-NR: grado óleo del héroe; el pincel (Kuwahara) va al 45 % del del mundo para no emborronar la cara
 // F2-A: props estáticos en 3D (y su copia de solo profundidad en la escena del héroe, capa 3)
 const props=new Props(scene,aScene,W3);
 const sta=new Stations(scene,aScene,W3,twin(props.mat),twin(props.ink)),fac=new DoorGlow(scene,W3);   // F2 cierre: estaciones y cofres/santuarios en 3D · las puertas de entrada ya no tienen fachada: solo se iluminan (DoorGlow, R3D-F2C-PUERTAS); `fac` se llama así por compatibilidad con `facOn`
 const parts=new Particles(scene);   // F3e: luciérnagas, hojas, pétalos, nieve, brasas, ceniza y lluvia en GPU (3 draw calls)
 const actors=new Actors(scene,W3,aScene);   // Lote R3D-ACTORES: enemigos, animales, jefes y Ru como SkinnedMesh en el mundo (copia de solo profundidad en aScene para que tapen al héroe)
 const res=new Resources(scene,aScene,W3),cres=new Resources(scene,aScene,W3);cres.grp.userData.keepInt=true;   // CUEVAS REALES: `cres` = las menas de la cueva en la que estás (el mundo, `res`, se oculta; ver rooms.hook)
 const rays=new SunRays(scene,W3),glow=new LampGlow(scene),dl=new DynLight(W3);
 const drops=new Drops(scene,W3);
 const rooms=new Rooms3D(scene,aScene,W3);   // R3D-F15b: `R3D.rooms.enter(INT)` lo llama interiors.js al entrar en una sala; mientras `rooms.on` el exterior se oculta y no se actualiza   // Lote R3D-DROPS-3D: lee GD (game.js) cada fotograma; game.js deja de pintar el drop en 2D cuando R3D.dropsOn
 let water=null;   // se crea tras el terreno (ver más abajo)
 const blood=new Blood(scene,W3,{actors,hero});   // Lote R3D-SANGRE: 2 draw calls; game.js llama a R3D.blood.hit()/death() (ver hitM/kill). `hero.anim.strike()` da la punta del arma
 water=new Water(scene,terr,W3,{hero,proj:v=>proj(v)});   // Lote R3D-AGUA-IMPL: R3D.water.splash(x,y,kind) · event('tug'|'catch',e); game.js lo llama en la pesca
 const cts=new Contact(scene,W3);   // F3f·P3A: sombras de contacto (1 draw call)   // F2-B: árboles talables (follaje por especie) y menas
 // RAYOS X (legibilidad tipo Diablo/PoE): lo que el héroe tiene detrás de una casa 3D se dibuja como silueta clara. El stencil marca los píxeles donde el
 // héroe SÍ se ve, para que su propio brazo de detrás no se pinte como silueta sobre su torso.
 const XRAY=new THREE.MeshBasicMaterial({color:'#ffe6b8',transparent:true,opacity:.42,depthWrite:false,depthFunc:THREE.GreaterDepth,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4,stencilWrite:true,stencilRef:1,stencilFunc:THREE.NotEqualStencilFunc,stencilZPass:THREE.KeepStencilOp,stencilFail:THREE.KeepStencilOp,stencilZFail:THREE.KeepStencilOp});
 let stKey='';const markStencil=()=>{if(stKey===hero.lookKey+hero.cloth.length)return;stKey=hero.lookKey+hero.cloth.length;hero.obj.traverse(o=>{if(!o.material)return;if(o.material===INK)o.material=INK_H;   /* F4: el héroe usa su propia copia del contorno */
 [].concat(o.material).forEach(m=>{m.stencilWrite=true;m.stencilRef=1;m.stencilFunc=THREE.AlwaysStencilFunc;m.stencilZPass=THREE.ReplaceStencilOp})})};
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
 c2d.addEventListener('pointerdown',e=>{if(e.button===1){drag={x:e.clientX,a:azT,btn:e.button,moved:true};e.preventDefault();try{c2d.setPointerCapture(e.pointerId)}catch(x){}}},true);   // rueda: gira siempre; RMB: gira si arrastras más de 6 px (si no, es «ir a ese punto», lo resuelve game.js al soltar)
 c2d.addEventListener('pointermove',e=>{if(drag){if(!drag.moved&&Math.abs(e.clientX-drag.x)>6){drag.moved=1;drag.x=e.clientX}if(drag.moved)azT=drag.a-(e.clientX-drag.x)*.008}});
 const endDrag=()=>{if(!drag)return;window.CAMD={btn:drag.btn,moved:drag.moved};drag=null;if(window.CAMD.moved)snap()};c2d.addEventListener('pointerup',endDrag);c2d.addEventListener('pointercancel',endDrag);
 c2d.addEventListener('auxclick',e=>{if(e.button===1)e.preventDefault()});
 const snap=()=>{const k=((azT-A45)%(Math.PI*2)+Math.PI*3)%(Math.PI*2)-Math.PI;if(Math.abs(k)<.12)azT=A45+(azT-A45-k)};
 addEventListener('keydown',e=>{if(/INPUT|TEXTAREA/.test((e.target||{}).tagName||''))return;if(e.key===',')keyRot=1;if(e.key==='.')keyRot=-1;if(e.key==='Home'){azT=A45+Math.round((azT-A45)/(Math.PI*2))*Math.PI*2}});
 addEventListener('keyup',e=>{if(e.key===','||e.key==='.'){keyRot=0;snap()}});
 // ── F3 · LUZ (guía §4.8): la hora del juego (sunS) mezcla las filas noche/atardecer/día de TOD → hemisférica, sol/luna con sombra, saturación, verde vivo,
 //    contorno, rim, agua, niebla, bloom, viñeta y cielo. El héroe (renderer aparte) sigue con la fila «dia»: lo oscurece la MISMA capa 2D que a los sprites
 //    (lighting() en modo source-atop, con huecos de luz de light.js), así héroe y sprites casan entre sí.
 let TODc=TOD.dia;
 // R3D-ESTETICA · TINTE DE GRADO POR BIOMA (20 oct 2026): multiplicador de color (uTint) y suma en sombras (uTLift) que se funden al cruzar fronteras. `?btint=0` lo apaga, `?btint=1` al 100 %.
 // Índices = BIOMES.list: 0 Pradera · 1 Bosque · 2 Pantano · 3 Cumbres · 4 Oriental · 5 Volcán · 6 Páramo · 7 Desierto · 8 Costa. [r,g,b multiplicador] y [r,g,b sombras]; se aplica ×BT_K.
 let TILT_K=(()=>{try{const v=new URLSearchParams(location.search).get('tilt');return v==null?.6:Math.max(0,Math.min(1.5,+v||0))}catch(e){return .6}})();   // R3D-ESTETICA-2 (P6): inclinación-desenfoque, `?tilt=0..1.5` (defecto .6)
 const CLOUD_K=(()=>{try{const v=new URLSearchParams(location.search).get('cloud');return v==null?1.35:Math.max(0,Math.min(2.5,+v||0))}catch(e){return 1.35}})();   // sombras de nubes de día, `?cloud=0..2.5` (1 = como antes, defecto 1,35)
 const BT=[[[1,1,.98],[0,0,0]],[[.95,.97,.94],[.002,.005,.002]],[[.94,1.03,.88],[0,.006,0]],[[.92,.99,1.09],[0,.002,.008]],[[1.01,.94,1.07],[.003,0,.006]],[[1.12,.93,.82],[.008,0,0]],[[.97,.93,1.09],[.004,0,.008]],[[1.09,1,.86],[.004,.002,0]],[[.95,1.02,1.05],[0,.003,.004]],[[1,1,1],[0,0,0]]];
 const BT_K=(()=>{try{const v=new URLSearchParams(location.search).get('btint');return v==null?1:Math.max(0,Math.min(1.5,+v||0))}catch(e){return 1}})();   // 21 oct 2026: .6→1 (el tinte de grado por bioma era casi imperceptible)
 const btC=new THREE.Vector3(1,1,1),btL=new THREE.Vector3(0,0,0),btT=new THREE.Vector3(),btTL=new THREE.Vector3();let btInit=false;const FT=new THREE.Vector3();
 /* LUZ DE LOS INTERIORES DINÁMICA (28 oct 2026; «los interiores tienen otra iluminación y no se ve dinámica»): la fila de interior (INT_TP) se mezcla con la HORA REAL del exterior (`todAt`): el sol entra por las ventanas con su dirección y color (día, atardecer, noche) y de noche la sala queda más oscura y solo la sostienen las lámparas. `d` = noche 0..1 se pasa a `rooms.update` (lámparas, charcos de luz de ventana). */
 const intTp=t=>{const e=todAt(t),d=e.nt||0,p=mixTod(INT_TP,e,.14-.06*d);p.hemI*=1-.45*d;p.sunI*=1-.6*d;   /* de noche la sala se oscurece (la sostienen las lámparas); de día, una fracción de la luz de fuera */{const night=(e.nt||0)>.5,ph=typeof dayP==='function'?dayP(t):.5,a=night?Math.PI/4:Math.max(0,Math.min(1,(ph-.25)/.5))*Math.PI/2,el=night?.55:Math.max(.16,typeof sunS==='function'?sunS(t):.7),h=8;p.sunP=[-Math.cos(a)*h,2+el*5,-Math.sin(a)*h]}   /* el sol (o la luna) entra SOLO por las ventanas (fondo e izquierda): de mañana por la izquierda, al atardecer por el fondo; bajo y largo al amanecer/atardecer, alto al mediodía */
  p.night=Math.min(1,.4+.55*d);p.fire=1;   /* menos luz ambiente y más sol: el recorte de las ventanas se lee sobre el suelo */p.win=1;p.nt=0;p.d=d;return p};
 function todAt(t){const s=typeof sunS==='function'?sunS(t):1,d=Math.max(typeof WXD!=='undefined'?WXD:0,Math.max(0,Math.min(1,(.15-s)/.55))),w=Math.max(0,1-Math.abs(s)*4);
  let p=mixTod(TOD.dia,TOD.noche,d);p=mixTod(p,TOD.atardecer,Math.min(.85,w*(1-d*.4)));p.nt=d;return p}
 // CINE-3 · CIELO ARDIENDO: `R3D.skyBurn` (0..1, objetivo) funde la fila del día hacia una fila de fuego (naranja-rojo, sombras de ceniza, agua rojiza, viñeta cálida); la suavizada `burn` usa el dt VIRTUAL (se congela con el tiempo detenido)
 let sky=null;try{sky=new SkyZone(scene,W3)}catch(e){console.warn('[R3D] SkyZone',e)}   // ISLA-2: solo existe si hay zona del Cielo (`?zone=0` la quita)
 // hora dorada PERMANENTE en el Cielo (decisión del dueño, 21 oct 2026): dentro de la zona el reloj del día deja de mandar (mezcla día/atardecer fija, sin noche); fuera, todo igual
 const zoneTod=p=>{const w=sky&&sky.on?sky.w||0:0;if(w<.002)return p;const g=mixTod(TOD.dia,TOD.atardecer,.28);g.nt=0;g.sat=Math.min(1.35,g.sat*1.3);return mixTod(p,g,w)};
 let burn=0,burnT=0,fireSrc=null,fireRow=null,bem=null,skyFire=null;
 const _n0=new Set(scene.children),spell=new SpellFX(scene,W3),fx=new FX(scene,W3),body=new BodyFx(scene,W3,{actors,hero}),impact=new Impact(scene,W3,{actors,hero,body}),aura=new Aura(scene,W3,{actors,hero,body});rooms.keep=[actors.grp,drops.root,blood.decals,blood.drops,cres.grp,...scene.children.filter(c=>!_n0.has(c))];rooms.hook={enter:()=>{cres.build(performance.now());cres.fresh=true},leave:()=>{cres.clear()}};   // CUEVAS: lo que se mueve (criaturas, botín, sangre, efectos) sigue visible dentro de la cueva
 // ISLA-7: ARDE EL CIELO (suelo naranja, nubes de fuego y brasas persistentes alrededor de la cámara mientras `burn` > 0); lo activa `R3D.skyBurn=1` (isla.js, paso «Escapa»)
 function burnFx(t,dt,tgt){G.uBurn.value=burn;if(burn>.02||skyFire){if(!skyFire)try{skyFire=new SkyFire(scene,W3)}catch(e){skyFire=false}if(skyFire)skyFire.update(t,dt,burn)}   // llamaradas alrededor de la isla
 if(sky&&sky.tint)sky.tint(burn);if(burn>.02||bem){if(!bem)bem=new Embers(scene,360);bem.level=burn>.02?Math.min(1,burn*1.1):0;bem.at(tgt.x,tgt.z,0);bem.update(t,dt)}}
 const FIRE=()=>{const a=TOD.atardecer;if(fireSrc!==a){fireSrc=a;fireRow=Object.assign({},a,{hemS:'#ff9a64',hemG:'#4a1c10',hemI:a.hemI*1.05,sun:'#ff6a2a',sunI:a.sunI*1.15,sat:Math.min(1.1,a.sat*1.05),lift:'#1c0804',vig:Math.min(.9,a.vig+.2),rim:'#ff7a3a',bloom:a.bloom*1.3,wDeep:'#3a1210',wShal:'#8a3a22',nt:.18})}return fireRow};
 const fireMix=(p,dt)=>{burn+=(burnT-burn)*(1-Math.exp(-dt/2.2));if(Math.abs(burnT-burn)<.002)burn=burnT;return burn>.002?mixTod(p,FIRE(),burn):p};
 // TINTE DE ILUMINACIÓN POR BIOMA (21 oct 2026; pedido del dueño: «un tinte único por bioma, que se diferencie un poco la iluminación global»): multiplica el color del SOL y de la luz HEMISFÉRICA (y un poco su intensidad) según el bioma bajo el héroe,
 // con fundido suave (~1,5 s) al cruzar fronteras. Índices = BIOMES.list. [sol r,g,b · hemi r,g,b · intensidad]; `?btint=` (BT_K) escala también este tinte. De noche se aplica igual (la fila TOD ya es oscura).
 const BL=[[1.03,1,.93, 1,1,.97, 1.02],[.9,1.03,.84, .84,1.02,.88, .93],[.9,.99,.78, .84,.96,.82, .9],[.88,.97,1.14, .88,.98,1.16, 1.02],[1.07,.93,.98, 1.05,.92,1.02, 1],[1.18,.84,.64, 1.12,.8,.72, 1.04],[.94,.88,1.16, .92,.86,1.18, .96],[1.14,1,.78, 1.1,.99,.8, 1.06],[.94,1.03,1.1, .92,1.02,1.1, 1],[1,1,1, 1,1,1, 1]];
 const blC=new Float32Array([1,1,1,1,1,1,1]),blT=new Float32Array(7);let blInit=false;
 function bioLight(dt){let kb=0;try{if(typeof P!=='undefined'&&typeof BIOMES!=='undefined')kb=Math.max(0,BIOMES.at(P.x,P.y))}catch(e){}const row=BL[kb]||BL[0],a=blInit?1-Math.exp(-dt*1.4):1;blInit=true;for(let i=0;i<7;i++){blT[i]=1+(row[i]-1)*BT_K;blC[i]+=(blT[i]-blC[i])*a}}
 function light(p){hemi.color.set(p.hemS);hemi.color.r*=blC[3];hemi.color.g*=blC[4];hemi.color.b*=blC[5];hemi.groundColor.set(p.hemG);hemi.intensity=p.hemI*blC[6];sun.color.set(p.sun);sun.color.r*=blC[0];sun.color.g*=blC[1];sun.color.b*=blC[2];sun.intensity=p.sunI*blC[6];
  const D=TODH.dia;aHemi.color.set(D.hemS);aHemi.groundColor.set(D.hemG);aHemi.intensity=D.hemI;aSun.color.set(D.sun);aSun.intensity=D.sunI;
  G.uSat.value=p.sat;G.uLive.value=p.live;setInk(p.ink,p.inkK);G.uRimCol.value.set(p.rim);G.uWinI.value=p.win;WU.uDeep.value.set(p.wDeep);WU.uShal.value.set(p.wShal);
  r.setClearColor(p.sky);TODc=p}
 light(TOD.dia);
 // ── luces prácticas (guía §4.8): de las MISMAS fuentes que light.js (props con lamp/LIGHTN y estaciones fire/furnace); las 4 más cercanas a la cámara ──
 const LK={farola:['#ffb060',1.9,4,1.25,'win'],linterna:['#ffb866',1.5,3.4,1.15,'win'],faro:['#ffc070',2.4,6,1.6,'win'],brasero:['#ff8a30',3.2,4.5,.9,'fire'],antorcha:['#ff8a30',2.6,4,1.1,'fire'],
  hoguera:['#ff8a30',5,6.5,.75,'fire'],lava:['#ff5020',3.5,5,.5,'fire'],fire:['#ff8a30',5,6.5,.75,'fire'],furnace:['#ff7030',3,4,.8,'fire'],cocina:['#ff8a30',3.6,5,.9,'fire'],braseroG:['#ff9a40',1.5,2.3,.6,'fire']};
 const LAMPK={farola:'farola',brasero:'brasero',linterna:'linterna',antorcha:'antorcha',hoguera:'hoguera',faro:'faro'},LIGHTN={hoguera:'hoguera',antorcha:'antorcha',fumarola:'lava',faroLava:'lava',estelaLava:'lava',altarDemon:'lava',lavaPozo:'lava',fogataC:'hoguera',braseroG:'braseroG',tiendaFuego:'antorcha'};
 let SRC=null,srcSig='';const pool=[0,1,2,3].map(()=>{const l=new THREE.PointLight(0xffa050,0,4,1.3);if(!dl.on)scene.add(l);return l});
 const lantern=new THREE.PointLight(0xffb866,0,3.2,1.4),aLantern=new THREE.PointLight(0xffb866,0,2.4,1.4);if(!dl.on){scene.add(lantern);aScene.add(aLantern)}let heroL=null;
 // FLUIDEZ (26 oct 2026): las luces del pase del héroe también en la CAPA 3 (la del pase de profundidad de casas/props). three r170 solo cuenta las luces de las capas que ve la
 // cámara: con la cámara en la capa 3 «desaparecían», el estado de luces cambiaba en CADA pase y three re-evaluaba el programa de todos los materiales del héroe y los actores
 // cada fotograma (~110 veces/s por material, medido). La sombra del héroe se sigue dibujando en el pase de la capa 0 (ver needsUpdate en drawHero).
 [aHemi,aSun,aBack,aLantern].forEach(l=>l.layers.enable(3));
 function sources(){const sig=PROPS.list.length+'|'+ST.length;if(SRC&&sig===srcSig)return SRC;srcSig=sig;SRC=[];
  PROPS.list.forEach(e=>{const k=e.lamp?(LAMPK[e.n]||'farola'):LIGHTN[e.n];if(!k)return;const z=TER.standZ(e.x,e.y),p=W3(e.x,e.y,z);p.y+=LK[k][3];SRC.push({p,k,ph:(e.x*.13+e.y*.07)%6.28})});
  ST.forEach(e=>{if(e.id!=='fire'&&e.id!=='furnace'&&e.id!=='cocina')return;const p=W3(e.x,e.y,TER.standZ(e.x,e.y));p.y+=LK[e.id][3];SRC.push({p,k:e.id,ph:(e.x*.11)%6.28})});return SRC}
 // Lote R3D-LUZ: las 4 luces reales ya NO saltan entre fuentes (cada hueco conserva su fuente y se funde al cambiar) y el parpadeo es lento y por fuente; el resto de fuentes llevan halo + charco de luz barato (lampglow3d.js)
 const slots=pool.map(()=>({s:null,v:0,out:0}));let lastT=0;
 const top=[],topD=[];   // FLUIDEZ (26 oct 2026): las 4 fuentes más cercanas (≤ 18 tiles) SIN ordenar todas ni crear arrays por fotograma (antes map+sort de todas las fuentes del mundo = basura → tirones del recolector)
 function lights(t,p,R){const dt=Math.min(.1,Math.max(0,t-lastT));lastT=t;top.length=topD.length=0;
  for(const s of sources()){const dx=s.p.x-tgt.x,dz=s.p.z-tgt.z,d=dx*dx+dz*dz;if(d>324)continue;let i=topD.length;if(i===4&&d>=topD[3])continue;if(i<4){top.push(s);topD.push(d)}else i=3;while(i>0&&topD[i-1]>d){top[i]=top[i-1];topD[i]=topD[i-1];i--}top[i]=s;topD[i]=d}
  G.uFireI.value=(1+Math.sin(t*1.9)*.05+Math.sin(t*3.3)*.03)*(.55+.45*p.fire);   // brillo de brasas/chimeneas: respira, no vibra
  slots.forEach(o=>{o.out=o.s&&!top.includes(o.s)?1:0});
  top.forEach(s=>{if(slots.some(o=>o.s===s&&!o.out))return;const f=slots.find(o=>!o.s);if(f){f.s=s;f.v=0;f.out=0}});
  const a=Math.min(1,dt*7);
  pool.forEach((l,i)=>{const o=slots[i];if(!o.s){l.intensity=0;return}o.v+=((o.out?0:1)-o.v)*a;if(o.out&&o.v<.01){o.s=null;l.intensity=0;return}
   const d=LK[o.s.k],ph=o.s.ph;l.position.copy(o.s.p);l.color.set(d[0]);l.distance=d[2];l.intensity=d[1]*o.v*(d[4]==='fire'?p.fire*(1+Math.sin(t*1.7+ph)*.05+Math.sin(t*3.1+ph*1.9)*.035):p.win)});
  if(rooms.on&&rooms.dyn&&dl.on)rooms.dynOn=dl.updateRoom(t,dt,rooms.dyn,p,heroL);else{rooms.dynOn=false;dl.update(t,dt,tgt,sources(),LK,p,heroL,rooms.on,props,typeof N!=='undefined'?N:null,typeof ST!=='undefined'?ST:null)}glow.update(t,dt,tgt,R,sources(),LK,p,cam,(typeof gfx==='function'&&!gfx('lights'))?4:(typeof QL!=='undefined'?QL:2),dl.on?dl.act:null)}
 // ── postproceso (guía §4.7): RenderPass → bloom → grado (sombras levantadas, viñeta) → salida. Sin grano. Calidad Baja/Mínima = sin post ──
 const composer=new EffectComposer(r,new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:({msaa2:2,msaa4:4})[typeof AA_MODE!=='undefined'?AA_MODE:'fxaa']||0}));composer.addPass(new RenderPass(scene,cam));
 // 17 oct 2026 (pedido del dueño): SIN NIEBLA. Se quitó el pase de niebla a ras de suelo (fogPass): invadía la pantalla de día. Ver «Lote R3D-NONIEBLA» en AGENTS.md.
 const bloom=new UnrealBloomPass(new THREE.Vector2(256,256),.35,.6,.85);composer.addPass(bloom);
 // F3d · grado «óleo oscuro» (guía §4.9). uK = intensidad del grado de color (tono dividido, desaturar, contraste, manchas); uBrush = mezcla del Kuwahara (el pincel, lo PRIMERO que se baja
 // por legibilidad). Con uK=0 y uBrush=0 es el grado de F3a (sombras levantadas + viñeta). Sin grano ni trama (el dueño los rechazó dos veces).
 const grade=new ShaderPass({uniforms:{tDiffuse:{value:null},uRes:{value:new THREE.Vector2(1,1)},uLift:{value:new THREE.Color('#000')},uVig:{value:.28},uFog:{value:0},uFogC:{value:new THREE.Color('#a8b0b4')},uK:{value:0},uBrush:{value:0},uTint:{value:new THREE.Vector3(1,1,1)},uTLift:{value:new THREE.Vector3(0,0,0)},uTS:{value:TILT_K}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform sampler2D tDiffuse;uniform vec2 uRes;uniform float uVig,uK,uBrush,uTS,uFog;uniform vec3 uLift,uTint,uTLift,uFogC;varying vec2 vUv;
   ${OIL_GLSL}
   // Kuwahara de 4 sectores (3×3 lecturas cada uno, gana el de menor varianza): aplana degradados en manchas de pincel y conserva bordes
   vec3 kuw(vec2 uv,float s){vec2 px=s/uRes;vec3 bm=vec3(0.);float bv=1e9;
    for(int q=0;q<4;q++){vec2 sg=vec2(q==0||q==2?-1.:1.,q<2?-1.:1.);vec3 m=vec3(0.);float l2=0.;
     for(int i=0;i<3;i++)for(int j=0;j<3;j++){vec3 c=texture2D(tDiffuse,uv+px*sg*vec2(float(i),float(j))).rgb;m+=c;float l=olum(c);l2+=l*l;}
     m/=9.;float l=olum(m);float v=l2/9.-l*l;if(v<bv){bv=v;bm=m;}}
    return bm;}
   void main(){float sc=max(1.,uRes.y/620.);vec3 c=texture2D(tDiffuse,vUv).rgb;
    if(uBrush>.01)c=mix(c,kuw(vUv,sc),uBrush);
    if(uTS>.001){float d=abs(vUv.y-.5)*2.,m=smoothstep(.5,1.,d)*uTS;   // R3D-ESTETICA-2 · INCLINACIÓN-DESENFOQUE (tilt-shift) leve: nítido en la franja central, un desenfoque de 2 anillos arriba y abajo (efecto diorama). ?tilt=0 lo apaga
     if(m>.03){vec2 px=sc*m*2.4/uRes;vec3 s=c;float w=1.;for(int i=0;i<8;i++){float an=float(i)*.7854;vec2 o=vec2(cos(an),sin(an));s+=texture2D(tDiffuse,vUv+o*px).rgb+texture2D(tDiffuse,vUv+o*px*2.).rgb;w+=2.;}c=mix(c,s/w,min(1.,m*1.5));}}
    c*=uTint;c=oilGrade(c,vUv*uRes/sc,uLift+uTLift,uK);                                                 // receta compartida con el héroe (materials3d.js OIL_GLSL)
    if(uFog>.002){float rr=length((vUv-.5)*vec2(uRes.x/uRes.y,1.))*1.2,fm=smoothstep(mix(.95,.1,uFog),mix(1.45,.62,uFog),rr)*uFog;c=mix(c,uFogC*(.55+.45*olum(c)),fm);}   // Fase B3 · NIEBLA RADIAL SUAVE (poca visibilidad): el centro (el héroe) se ve y los bordes se pierden en la bruma; sin daño ni bloqueo
    c*=oilVig(vUv,uRes,uVig);gl_FragColor=vec4(c,1.);}`});
 composer.addPass(grade);composer.addPass(new OutputPass());
 // SUAVIZADO DE BORDES (24 oct 2026, Opciones → Gráficos → «Suavizado»; global `AA_MODE` de game.js: 'fxaa' POR DEFECTO · 'smaa' · 'msaa2' · 'msaa4').
 // FXAA y SMAA son pases POSTERIORES a OutputPass (trabajan sobre color sRGB, como deben) y el render target del composer va SIN muestras (más barato que el MSAA x4 antiguo sobre HalfFloat).
 // MSAA x2/x4 = `samples` del render target del composer y los dos pases desactivados. SMAAPass se importa PEREZOSAMENTE solo la primera vez que se elige SMAA (si el archivo falta, cae a FXAA).
 // Baja/Mínima sin FSR no pasan por el composer: siguen con el MSAA nativo del lienzo (antialias:true), sea cual sea el modo.
 const aaM=()=>typeof AA_MODE!=='undefined'?AA_MODE:'fxaa',aaMs=()=>({msaa2:2,msaa4:4})[aaM()]||0;
 const fxaa=new ShaderPass({uniforms:{tDiffuse:{value:null},uRes:{value:new THREE.Vector2(1,1)}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform sampler2D tDiffuse;uniform vec2 uRes;varying vec2 vUv;
   // FXAA clásico (Lottes/NVIDIA, 9 lecturas): dirección del borde por la luma de las 4 diagonales, dos muestras a lo largo y dos más anchas; si la ancha se sale del rango de luma local se usa la corta.
   void main(){vec2 px=1./uRes;vec3 lm=vec3(.299,.587,.114);
    vec3 cNW=texture2D(tDiffuse,vUv+vec2(-1.,-1.)*px).rgb,cNE=texture2D(tDiffuse,vUv+vec2(1.,-1.)*px).rgb,cSW=texture2D(tDiffuse,vUv+vec2(-1.,1.)*px).rgb,cSE=texture2D(tDiffuse,vUv+vec2(1.,1.)*px).rgb,cM=texture2D(tDiffuse,vUv).rgb;
    float lNW=dot(cNW,lm),lNE=dot(cNE,lm),lSW=dot(cSW,lm),lSE=dot(cSE,lm),lM=dot(cM,lm);
    float lMin=min(lM,min(min(lNW,lNE),min(lSW,lSE))),lMax=max(lM,max(max(lNW,lNE),max(lSW,lSE)));
    vec2 dir=vec2(-((lNW+lNE)-(lSW+lSE)),(lNW+lSW)-(lNE+lSE));
    float dr=max((lNW+lNE+lSW+lSE)*.25*.125,1./128.),rc=1./(min(abs(dir.x),abs(dir.y))+dr);
    dir=clamp(dir*rc,vec2(-8.),vec2(8.))*px;
    vec3 a=.5*(texture2D(tDiffuse,vUv+dir*(1./3.-.5)).rgb+texture2D(tDiffuse,vUv+dir*(2./3.-.5)).rgb);
    vec3 b=a*.5+.25*(texture2D(tDiffuse,vUv+dir*-.5).rgb+texture2D(tDiffuse,vUv+dir*.5).rgb);
    float lB=dot(b,lm);gl_FragColor=vec4((lB<lMin||lB>lMax)?a:b,1.);}`});
 fxaa.enabled=false;composer.addPass(fxaa);let smaa=null,smaaTry=0;
 // REESCALADO NÍTIDO tipo FSR 1 (22 oct 2026, interruptor «Reescalado FSR» de Opciones → Gráficos, APAGADO por defecto; `FSR_ON` en game.js): el MUNDO 3D se pinta al FSR_S (75 %)
 // de la resolución del lienzo y esta pasada lo amplía a pantalla completa con un bicúbico Catmull-Rom de 5 lecturas (bordes limpios), sin halos (se limita al mín/máx de los 4
 // texeles vecinos, como EASU) y con nitidez adaptativa al contraste (CAS/RCAS). El héroe y el HUD van en el lienzo 2D a resolución completa: no se ven afectados.
 // Coste: ~9 lecturas por píxel de pantalla; ahorro: el 44 % de los píxeles de TODO el pipeline (escena, sombra de contacto, bloom, óleo). En Baja/Mínima (sin post) pasa por el composer solo con RenderPass → Output → esta pasada.
 const FSR_S=.75,fsr=new ShaderPass({uniforms:{tDiffuse:{value:null},uSrc:{value:new THREE.Vector2(1,1)},uSharp:{value:.6}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform sampler2D tDiffuse;uniform vec2 uSrc;uniform float uSharp;varying vec2 vUv;
   vec3 tx(vec2 p){return texture2D(tDiffuse,p).rgb;}
   void main(){vec2 iv=1./uSrc,sp=vUv*uSrc,tp=floor(sp-.5)+.5,f=sp-tp,f2=f*f,f3=f2*f;
    vec2 w0=f2-.5*(f3+f),w1=1.5*f3-2.5*f2+1.,w3=.5*(f3-f2),w2=1.-w0-w1-w3,s1=w1+w2;
    vec2 t0=(tp-1.)*iv,t1=(tp+w2/s1)*iv,t2=(tp+2.)*iv;
    float a=s1.x*w0.y,b=w0.x*s1.y,c0=s1.x*s1.y,d=w3.x*s1.y,e=s1.x*w3.y;
    vec3 c=(tx(vec2(t1.x,t0.y))*a+tx(vec2(t0.x,t1.y))*b+tx(t1)*c0+tx(vec2(t2.x,t1.y))*d+tx(vec2(t1.x,t2.y))*e)/(a+b+c0+d+e);
    vec2 bq=tp*iv;vec3 q0=tx(bq),q1=tx(bq+vec2(iv.x,0.)),q2=tx(bq+vec2(0.,iv.y)),q3=tx(bq+iv);
    c=clamp(c,min(min(q0,q1),min(q2,q3)),max(max(q0,q1),max(q2,q3)));
    vec3 n=tx(vUv-vec2(0.,iv.y)),s=tx(vUv+vec2(0.,iv.y)),w=tx(vUv-vec2(iv.x,0.)),ea=tx(vUv+vec2(iv.x,0.));
    vec3 mn=min(min(min(n,s),min(w,ea)),c),mx=max(max(max(n,s),max(w,ea)),c);
    vec3 amp=sqrt(clamp(min(mn,1.-mx)/max(mx,vec3(1e-4)),0.,1.));vec3 wv=-amp/mix(8.,5.,uSharp);
    c=clamp((c+(n+s+w+ea)*wv)/(1.+4.*wv),0.,1.);gl_FragColor=vec4(c,1.);}`});
 fsr.enabled=false;composer.addPass(fsr);let cSize='';
 // Tiempo REAL de GPU por pase (EXT_disjoint_timer_query_webgl2, si el navegador lo da): R3D.gpu = {mundo, heroe} en ms (media móvil). Se muestra en el panel F3.
 const mkT=rr=>{const gl=rr.getContext(),ext=gl.getExtension('EXT_disjoint_timer_query_webgl2'),qs=[];return{ok:!!ext,
  begin(n){if(!ext||qs.length>6)return null;const q=gl.createQuery();gl.beginQuery(ext.TIME_ELAPSED_EXT,q);return{q,n}},end(h){if(h){gl.endQuery(ext.TIME_ELAPSED_EXT);qs.push(h)}},
  poll(o){if(!ext)return;const dis=gl.getParameter(ext.GPU_DISJOINT_EXT);for(let i=0;i<qs.length;){const h=qs[i];if(gl.getQueryParameter(h.q,gl.QUERY_RESULT_AVAILABLE)){const ms=gl.getQueryParameter(h.q,gl.QUERY_RESULT)/1e6;if(!dis)o[h.n]=o[h.n]==null?ms:o[h.n]+(ms-o[h.n])*.08;gl.deleteQuery(h.q);qs.splice(i,1)}else i++}}}};
 const GPU={},tW=mkT(r),tH=tW;   // F4: un solo contexto = un solo medidor (el pase del héroe se mide aparte con su etiqueta)
 let tsT=1,tsK=1,vlag=0,lastR=0,frz=0;   // CINE-1 · reloj virtual: tsT = escala objetivo (1 normal, 0 tiempo detenido), tsK = suavizada, vlag = retraso acumulado respecto al reloj real, frz = 0..1 intensidad del «tiempo detenido»
 // ══ COMPUERTA DE SHADERS (Lote ANTI-TIRONES, 25 oct 2026; src/r3d/shadergate3d.js) ══ destinos de dibujo POR CALIDAD: con composer (Máx/Alta/Media, o FSR) el mundo se pinta en su
 // render target; Baja/Mínima sin FSR, en la pantalla (otro espacio de color = otro programa); Máx/Alta además el reflejo del agua (plano de recorte = otro programa).
 const gate=new ShaderGate(),GCLIP=[new THREE.Plane(new THREE.Vector3(0,1,0),0)],GV={rt:{key:'rt',get rt(){return composer.renderTarget1}},rtc:{key:'rtc',get rt(){return composer.renderTarget1},clip:GCLIP},scr:{key:'scr',rt:null}};
 const gVars=()=>{const q=typeof QL!=='undefined'?QL:2,FS=typeof FSR_ON!=='undefined'&&!!FSR_ON,po=typeof gfx==='function'?(gfx('post')||gfx('bloom')):q<=2;return (po||FS)?[GV.rt]:[GV.scr]};   // FLUIDEZ (26 oct 2026): el reflejo del agua ya no usa planos de recorte (plano cercano oblicuo, water3d.js oblique): sin la variante «rtc» de cada shader
 gate.watch(r,scene,cam,gVars);gate.watch(r,aScene,acam,()=>[{rt:hgrade.rt}]);let gFr=0,warming=false,gVk='';
 // FLUIDEZ F15 (26 oct 2026): `dry` = fotograma «en seco» (todo se actualiza y se crea, pero NADA se dibuja en la GPU). Lo usa la pantalla de carga ANTES de warmShaders:
 // el primer dibujo compilaba todos los shaders de uno en uno y bloqueando (13 s medidos en un PC sin caché, dentro del pase del reflejo); en seco, warmShaders los compila en paralelo.
 const hCC=new THREE.Color(),hOcc=[],HST={calls:0,tris:0,ms:0};let hDone=false,inkOn=true,dry=false,tlx=0,tlz=0,tvx=0,tvz=0;
 let curMs=aaMs();let cloudK=CLOUD_K,shrMin=.15;let last=0,trail=[],aBox=null,heroScreen=null,qGrass=-1,heroTap=null;
 // ══ FLUIDEZ F9 (26 oct 2026) · SOMBRA DEL SOL EN CACHÉ (fija) + PARTE MÓVIL ══ La sombra del sol se redibujaba ENTERA cada fotograma (~40 % de los triángulos: suelo, ~4 900 mallas
 // de props, ~5 700 de recursos). Ahora: (1) lo FIJO (terreno, props, estaciones, recursos) se dibuja en `sRT` solo cuando la cámara de sombra cambia de «casilla» (se ajusta a la rejilla
 // en espacio de luz, en múltiplos de 64 texels: la sombra no tiembla), cuando algo fijo cambia (árbol talado, trozos de terreno nuevos) o como mucho cada 1,2 s; (2) cada fotograma se
 // copia `sRT` al mapa real (copia nativa de color y profundidad, `blitFramebuffer`) y encima se dibuja solo lo que se MUEVE (actores, objetos…). Mismo mapa, mismas matrices,
 // mismo filtro PCF: la luz de día y de noche (faroles, linterna, luces dinámicas: no usan este mapa) se ve igual. Opción «Sombra en caché» (Ajustes avanzados); en interiores, apagada.
 let sRT=null,sKey='',sT=-1e9,sDirty=true,sChunks=-1;const sHid=[],sBasis={x:new THREE.Vector3(),y:new THREE.Vector3(),z:new THREE.Vector3()},sC=new THREE.Vector3();
 const sStatic=()=>[terr.grp,props.grp,sta.grp,res.grp];
 const shadowF9On=()=>!sBad&&!(typeof gfx==='function'&&!gfx('shcache'))&&!rooms.on&&!dry&&!!sun.shadow.map;
 // three solo deja dibujar sombras DENTRO de un render() (fuera, su estado de render es nulo): el trabajo se lanza desde el onBeforeRender de un triángulo vacío e invisible QUE VIVE EN LA
 // PROPIA ESCENA (renderOrder mínimo = se procesa el primero): mismo estado de luces → mismos programas de profundidad que la sombra normal (con una escena aparte salían 5 programas nuevos).
 // Se arma una vez por fotograma (sArm) y lo consume el primer render de la escena (el reflejo del agua o el mundo).
 let sBad=false,sNow=0,sArm=false,sF9=false;const sSt={armados:0,disparos:0,refrescos:0,clave:''};const sTrO=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:false,depthTest:false}));
 sTrO.geometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,0,0,0,0,0,0],3));sTrO.geometry.boundingSphere=new THREE.Sphere(new THREE.Vector3(),1e9);sTrO.renderOrder=-1e9;
 sTrO.onBeforeRender=()=>{if(!sArm)return;sArm=false;sSt.disparos++;try{shadowWork(sNow)}catch(e){sBad=true;console.warn('[R3D sombra en caché] desactivada por un error; se usa la sombra normal',e)}};scene.add(sTrO);
 res.onSec=props.onSec=()=>{sDirty=true};{const fl=res.fell;if(typeof fl==='function')res.fell=function(...a){sDirty=true;return fl.apply(this,a)}}   // un árbol que cae / una mena que se rompe cambian lo fijo
 function shadowF9(now){sNow=now;sArm=true;sSt.armados++;return true}
 function shadowWork(now){const sh=sun.shadow,sz=sh.mapSize.x,c=sh.camera,tex=(c.right-c.left)/sz,st=tex*64;
  sBasis.z.set(...TOD.dia.sunP).normalize();sBasis.x.set(0,1,0).cross(sBasis.z).normalize();sBasis.y.copy(sBasis.z).cross(sBasis.x);
  const u=tgt.dot(sBasis.x),v=tgt.dot(sBasis.y),w=tgt.dot(sBasis.z),iu=Math.round(u/st),iv=Math.round(v/st),iw=Math.round(w/4);sC.copy(tgt).addScaledVector(sBasis.x,iu*st-u).addScaledVector(sBasis.y,iv*st-v).addScaledVector(sBasis.z,iw*4-w);   // también en PROFUNDIDAD (eje del sol, pasos de 4 u.): si no, la profundidad de toda la caché quedaba desfasada al moverse y las sombras temblaban
  sun.position.copy(sC).addScaledVector(sBasis.z,30);sun.target.position.copy(sC);sun.updateMatrixWorld();sun.target.updateMatrixWorld();
  if(!sRT||sRT.width!==sz){if(sRT)sRT.dispose();sRT=new THREE.WebGLRenderTarget(sz,sz,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});sDirty=true}
  const key=iu+','+iv+','+iw+'|'+sz;if(terr.ch.size!==sChunks){sChunks=terr.ch.size;sDirty=true}
  const SS=sStatic(),sm=r.shadowMap;
  if(key!==sKey||sDirty||now-sT>1200){sKey=key;sDirty=false;sT=now;sSt.refrescos++;sSt.clave=key;   // 1) lo FIJO a sRT
   sHid.length=0;for(const o of scene.children)if(o.visible&&!SS.includes(o)){o.visible=false;sHid.push(o)}
   const real=sh.map;sh.map=sRT;sm.needsUpdate=true;sm.render([sun],scene,cam);sh.map=real;for(const o of sHid)o.visible=true}
  sHid.length=0;for(const o of SS)if(o&&o.visible){o.visible=false;sHid.push(o)}   // 2) cada fotograma: copia de lo fijo + lo que se MUEVE
  const oc=r.clear;r.clear=function(){oc.apply(r,arguments);r.clear=oc;const gl=r.getContext(),P=r.properties,fs=P.get(sRT).__webglFramebuffer,fd=P.get(sh.map).__webglFramebuffer;if(!fs||!fd)return;   // copia NATIVA (WebGL2 blitFramebuffer) de color + profundidad de la caché al mapa real
   r.state.bindFramebuffer(gl.READ_FRAMEBUFFER,fs);r.state.bindFramebuffer(gl.DRAW_FRAMEBUFFER,fd);gl.blitFramebuffer(0,0,sz,sz,0,0,sz,sz,gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT,gl.NEAREST);r.state.bindFramebuffer(gl.READ_FRAMEBUFFER,null)};
  try{sm.needsUpdate=true;sm.render([sun],scene,cam)}finally{r.clear=oc;for(const o of sHid)o.visible=true}}
 // FLUIDEZ F6: un esqueleto se actualiza (y su textura de huesos se sube a la GPU) UNA vez por fotograma de juego, no en cada render() (mundo, reflejo, 3 pases del héroe…)
 let SKF=0;{const su=THREE.Skeleton.prototype.update;THREE.Skeleton.prototype.update=function(){if(this._skf===SKF)return;this._skf=SKF;su.call(this)}}
 function frame(rnow){SKF++;const rd=lastR?Math.min(100,Math.max(0,rnow-lastR)):16.7;lastR=rnow;tsK+=(tsT-tsK)*(1-Math.exp(-rd/1000*(tsT<tsK?9:6)));if(Math.abs(tsT-tsK)<.002)tsK=tsT;vlag+=rd*(1-tsK);if(tsT>=1&&tsK>.98&&vlag>0)vlag=Math.max(0,vlag-rd*.25);frz=1-tsK;   /* 21 oct 2026: la parada de impacto (golpes críticos) acumulaba ≈ 75 ms de retraso del reloj virtual PARA SIEMPRE; ahora se recupera poco a poco (×1,25 de velocidad) cuando el tiempo vuelve a ser normal (las cinemáticas hacen tsync() al acabar) */   // tiempo VIRTUAL: con tsK=1 y vlag=0 `now` = reloj real (nada cambia)
  const now=rnow-vlag,t=now/1000,dt=Math.max(1e-5,last?Math.min(.1,(now-last)/1000):1/60);last=now;G.uTime.value=t;r.info.autoReset=false;r.info.reset();
  if(keyRot)azT+=keyRot*dt*1.6;az+=(azT-az)*(1-Math.exp(-dt*12));if(Math.abs(az-azT)<1e-4)az=azT;
  const V=ISO.V,cssW=V.cw/V.dpr,cssH=V.ch/V.dpr;if(r.getPixelRatio()!==V.dpr)r.setPixelRatio(V.dpr);const sz=r.getSize(new THREE.Vector2());if(sz.x!==cssW||sz.y!==cssH)r.setSize(cssW,cssH,false);
  const w=ISO.unproj(ISO.cam.x,ISO.cam.y,1);tgt.set(w.x/ISO.TILE,0,w.y/ISO.TILE);const k=ppu();placeCam(cam,tgt,V.cw/2/k,V.ch/2/k);
  if(sky&&sky.on){sky.update(t,dt,tgt,cam,water);WU.uClear.value=sky.w||0}
  // noche → rim y ojos de la capucha (el oscurecido lo hace lighting() en 2D)
  const IN=rooms.on,CV=IN&&rooms.cave,upd=!IN,tp=IN?(CV?(rooms.cvTp||CAVE_TP):intTp(t)):fireMix(zoneTod(todAt(t)),dt),nt=tp.nt;bioLight(dt);light(tp);burnFx(t,dt,tgt);spell.update(t,dt);fx.update(t,dt,tp.night,r.getPixelRatio());impact.update(dt);aura.update(dt);body.update(dt);if(typeof P!=='undefined'&&typeof curB!=='undefined')fx.ambient(P.x,P.y,curB,dt);if(frz>.002)G.uSat.value*=1-.75*frz;if(IN&&!CV){const dn=tp.d||0;aHemi.color.set(tp.hemS);aHemi.groundColor.set(tp.hemG);aHemi.intensity=1.7-.7*dn;aSun.color.set(tp.sun);aSun.intensity=2.0-1.1*dn;aBack.color.set(dn>.5?'#8a9ac8':'#ffb070')}else if(CV){aHemi.color.set('#8a9ac0');aHemi.groundColor.set('#3a3028');aHemi.intensity=.95;aSun.color.set('#a0b0d0');aSun.intensity=.7;aBack.color.set('#7a8ab0')}G.uNight.value=tp.night;lights(t,tp,Math.hypot(V.cw,V.ch)/k*.78+6);rooms.update(t,IN&&!CV?(tp.d||0):0,IN&&!CV?tp.sunP:null);
  // F3f·P6 · halo del santuario: la gema (aEmit=3) se atenúa al acercarse el héroe (si no, el haz + el bloom lo sobreexponen: mancha blanca). A ≥3,6 tiles brillo completo; a ≤1,2 tiles `shrMin`. Suavizado en el tiempo.
  {let dm=99;if(typeof PO!=='undefined'&&typeof P!=='undefined')for(const e of PO)if(e.n==='santuario'){const d=Math.hypot(e.x-P.x,e.y-P.y)/ISO.TILE;if(d<dm)dm=d}
   const u=Math.min(1,Math.max(0,(dm-1.2)/2.4)),tk=shrMin+(1-shrMin)*u*u*(3-2*u);G.uShrK.value+=(tk-G.uShrK.value)*(1-Math.exp(-dt*6))}
  // calidad del pasto según la calidad del juego (Máxima/Alta/Media/Baja/Mínima)
  const q=typeof gfx==='function'?gfx('grass'):GRASS_Q[typeof QL!=='undefined'?QL:2];if(q!==qGrass){qGrass=q;if(terr.setQuality(q)){terr.dropAll();preload()}}
  {const gk=Math.min(typeof GRASSK!=='undefined'?GRASSK:1,(typeof QL!=='undefined'?QL:2)<=1?1.25:1);if(gk!==terr.gk)terr.setDensity(gk)}   // opción «Pasto» (Opciones → Gráficos): multiplicador de densidad independiente de la calidad
  {const shQ=typeof gfx==='function'?gfx('shadow'):((typeof QL!=='undefined'&&QL>=3)||COARSE?1:2),ss=shQ>=1.5&&!COARSE?2048:1024;sun.shadow.intensity=shQ?1:0;if(sun.shadow.mapSize.x!==ss){sun.shadow.mapSize.set(ss,ss);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}}}   // OPT-RENDIMIENTO: sombra del sol 2048 → 1024 en Baja/Mínima (¼ de píxeles; mismo shader, sin recompilar)
  G.uCloud.value=(typeof gfx==='function'?!gfx('clouds'):(typeof QL!=='undefined'&&QL>=4))?0:cloudK;   // F3f·P2: sombras de nubes (apagadas en calidad Mínima)
  if(upd){const lvx=(tgt.x-tlx)/Math.max(dt,1e-3),lvz=(tgt.z-tlz)/Math.max(dt,1e-3),kv=1-Math.exp(-dt*4);tlx=tgt.x;tlz=tgt.z;if(Math.abs(lvx)<40&&Math.abs(lvz)<40){tvx+=(lvx-tvx)*kv;tvz+=(lvz-tvz)*kv}else{tvx=tvz=0}
   const la=Math.min(1,8/Math.max(1e-3,Math.hypot(tvx,tvz)*1.2));terr.update(tgt.x+tvx*1.2*la,tgt.z+tvz*1.2*la,Math.hypot(V.cw,V.ch)/k*.78+6)}   // FLUIDEZ F2: el terreno se pide ~1,2 s POR DELANTE del jugador según su velocidad (máx. 8 tiles): al correr, menos trozos «urgentes» a 9 ms
  if(upd){const hp=typeof P!=='undefined'?W3(P.x,P.y,TER.standZ(P.x,P.y)):tgt,S=Math.min(44,Math.max(22,Math.hypot(V.cw/2/k,V.ch/k)*2.2));   // volumen que envuelve la pantalla (tiles)
   parts.update(dt,tgt.x,hp.y,tgt.z,typeof curB!=='undefined'?curB:0,tp.night,typeof WXD!=='undefined'?WXD:0,ISO.scale()*V.dpr/1.9,S,typeof gfx==='function'?gfx('parts'):(typeof QL!=='undefined'?QL:2));
   blood.update(dt,t,hp,tp.night,typeof QL!=='undefined'?QL:2);rays.update(t,dt,tgt,Math.hypot(V.cw,V.ch)/k*.78+6,1-tp.night,typeof WXD!=='undefined'?WXD:0,(typeof gfx==='function'&&!gfx('rays'))?4:(typeof QL!=='undefined'?QL:2))}   // Lote R3D-SANGRE: gotas (física) + manchas; hp = posición del héroe en three (linterna de noche)
  if(upd){terr.lodR=typeof gfx==='function'?gfx('view'):[12,9,7,5,4][typeof QL!=='undefined'?QL:2];terr.lod(tgt.x,tgt.z);props.update();{const cr=Math.hypot(V.cw,V.ch)/k*.78+14;props.cull(tgt.x,tgt.z,cr);res.cull(tgt.x,tgt.z,cr)}sta.update(now,t,typeof HOV!=='undefined'?HOV:null,typeof A!=='undefined'&&A?A.e:null);fac.update(now,t,typeof HOV!=='undefined'?HOV:null);res.update(now,t,typeof HOV!=='undefined'?HOV:null,typeof A!=='undefined'&&A?A.e:null,dt)}
  if(CV){const cr=Math.hypot(V.cw,V.ch)/k*.78+14,hp0=typeof P!=='undefined'?W3(P.x,P.y,0):tgt;cres.cull(tgt.x,tgt.z,cr);cres.update(now,t,typeof HOV!=='undefined'?HOV:null,typeof A!=='undefined'&&A?A.e:null,dt);blood.update(dt,t,hp0,.6,typeof QL!=='undefined'?QL:2)}   // CUEVA: menas, sangre
  // actores 3D (antes que el héroe: su copia de profundidad en aScene tiene que estar al día cuando se dibuja el héroe)
  if(upd||CV)actors.update(now,t,dt,tgt,Math.hypot(V.cw,V.ch)/k*.78+6,typeof HOV!=='undefined'?HOV:null,typeof P!=='undefined'?P:{x:0,y:0});actors.grp.updateMatrixWorld(true);if(upd||CV)drops.update(now,t,dt,tgt,Math.hypot(V.cw,V.ch)/k*.78+6,typeof HOV!=='undefined'?HOV:null);if(upd)cts.update(props,res,actors,typeof P!=='undefined'?P:null,tp.night,(typeof gfx==='function'&&!gfx('contact'))?4:(typeof QL!=='undefined'?QL:2));
  if(!gate.on&&!warming&&++gFr>300)gate.on=true;if(gate.on){const vk=gVars().map(v=>v.key).join();if(vk!==gVk){if(gVk)gate.background(0,gVars());gVk=vk}}gate.tick(performance.now());   // al cambiar de calidad, los programas del nuevo destino se piden en segundo plano   // compuerta de shaders: lo añadido este fotograma (actores, objetos del suelo…) se compila antes de dibujarse
  // héroe
  const st=typeof heroState3D==='function'?heroState3D(now):null;
  if(st){hero.setLook(resolveLook(st.look));const p=W3(st.x,st.y,st.z);
   hero.update({x:p.x,y:p.y,z:p.z,mv:st.mv,run:st.run,w:st.w,act:st.act,hurt:st.hurt,cb:st.cb,recv:st.recv||0,dash:st.dash||0,sleep:st.sleep||0,blk:st.blk||0,bhit:st.bhit||0,jmp:st.jmp||0,back:st.back||0,ride:st.ride||0,gait:st.gait||0,msp:st.msp||'caballo',mtk:st.mtk||'',mti:st.mti||null,t,face:st.fx!=null?[st.fx,st.fy]:null,night:nt,wind:[.9,.4]},dt);
   blob.scale.setScalar(1+.9*(st.ride||0)*(hero.mount?hero.mount.sz:1));blob.position.set(p.x,p.y+.012,p.z);lantern.position.set(p.x+.15,p.y+.75,p.z+.1);lantern.intensity=1.8*nt*(1+Math.sin(t*9)*.05);heroL={x:p.x+.15,y:p.y+.75,z:p.z+.2,i:nt};aLantern.position.set(p.x+.15,p.y+.7,p.z+.25);aLantern.intensity=1.4*nt;   // linterna del héroe: se enciende sola de noche (guía §1.3)
   // rastro en el pasto (4 puntos, se recupera en ~1,6 s)
   if(!trail.length||Math.hypot(p.x-trail[0].x,p.z-trail[0].z)>.14)trail.unshift({x:p.x,z:p.z,t});if(trail.length>4)trail.length=4;
   G.uTrail.value.forEach((v,i)=>{const q=i===0?{x:p.x,z:p.z,t}:trail[i];v.set(q?q.x:99,q?q.z:99,q?(i===0?1:Math.max(0,1-(t-q.t)/1.6)*.9):0)});
   syncProxy();
   // renderer del héroe: recorte de ±HA unidades alrededor del ancla (a media altura)
   // Lote R3D-HEROE-MAXQ: el héroe SIEMPRE se pinta como en calidad Máxima. `hs` = cuánto más densa que el lienzo del juego es su resolución (dpr de Máxima / dpr actual, ≥1);
   // `px` = tamaño en px del lienzo del juego (posición y copia), `pxr` = tamaño real del render del héroe. En Máxima hs=1 (nada cambia).
   const dprMax=Math.max(V.dpr,Math.min(window.devicePixelRatio||1,Math.sqrt((typeof QCAPS!=='undefined'?QCAPS[0]:4.5e6)/(cssW*cssH)))),hs=(typeof gfx==='function'?!gfx('hero'):(typeof QL!=='undefined'&&QL>=3))?1:Math.min(2,Math.max(1,dprMax/V.dpr));   /* OPT-RENDIMIENTO (22 oct 2026): en Baja/Mínima el héroe ya NO se supermuestrea (hasta ×4 píxeles con el lienzo reducido) */
   const rdk=st.ride||0,HA=1.4+.35*rdk,anc=new THREE.Vector3(p.x,p.y+.55+rdk*(hero.mount?hero.mount.seat*.55:0),p.z),   /* DOMAR-D3: montado, el recorte del héroe sube y se agranda (mamut, camello, dragón con la cola larga) */
   px=Math.ceil(HA*2*k),pxr=Math.ceil(HA*2*k*hs);
   placeCam(acam,anc,HA,HA);aBack.position.set(anc.x-Math.sin(az)*6,anc.y+4,anc.z-Math.cos(az)*6);aBack.target.position.copy(anc);aBack.intensity=.85-.5*nt;aSun.position.copy(anc).add(new THREE.Vector3(...TOD.dia.sunP).normalize().multiplyScalar(12));aSun.target.position.copy(anc);
   gate.tick(performance.now());markStencil();const sp=proj(anc),hx0=Math.round(sp.x-px/2),hy0=Math.round(sp.y-px/2);   /* 21 oct 2026: posición ENTERA en píxeles del lienzo: con una posición fraccionaria `drawImage` remuestrea el héroe (1:1) con interpolación bilineal y se ve borroso, sobre todo a zoom mínimo */
   if(!dry){const hc0=r.info.render.calls,ht0=r.info.render.triangles,hT0=performance.now(),th=tH.begin('heroe'),ac=r.autoClear,sa=r.shadowMap.autoUpdate,cc0=r.getClearColor(hCC),ca0=r.getClearAlpha();r.autoClear=false;r.shadowMap.autoUpdate=false;
   hgrade.begin(r,pxr,pxr);aScene.updateMatrixWorld();                                                       // Lote R3D-HEROE-NR: los 3 pases van a un render target (MSAA + stencil)…
   acam.layers.set(3);r.shadowMap.needsUpdate=false;r.render(aScene,acam);                                   // 1) casas y props 3D: solo profundidad
   hOcc.length=0;for(const c of aScene.children)if(c!==hero.obj&&!c.isLight&&c.visible){c.visible=false;hOcc.push(c)}   // F4: en los pases 2 y 3 la oclusión ya está en el búfer de profundidad: sus ~10 700 objetos no se recorren otra vez
   acam.layers.set(0);r.shadowMap.needsUpdate=true;r.render(aScene,acam);                                    // 2) héroe (lo tapado no se dibuja; marca stencil) + su sombra propia (aSun)
   aScene.overrideMaterial=XRAY;r.render(aScene,acam);aScene.overrideMaterial=null;                          // 3) silueta donde está detrás de algo
   for(const c of hOcc)c.visible=true;r.shadowMap.needsUpdate=false;r.shadowMap.autoUpdate=sa;r.autoClear=ac;
   hgrade.endRT(r,{thick:0,hs,K:oilK(tp.night)*HERO_K,brush:.85*Math.pow(oilK(tp.night),1.6)*HERO_BRUSH,lift:tp.lift,vig:tp.vig,sc:Math.max(1,V.ch/620),off:[hx0,hy0],scr:[V.cw,V.ch]});r.setClearColor(cc0,ca0);hDone=true;HST.calls=r.info.render.calls-hc0;HST.tris=r.info.render.triangles-ht0;r.info.render.calls=hc0;r.info.render.triangles=ht0;HST.ms+=(performance.now()-hT0-HST.ms)*.05   // F4: lo del héroe NO cuenta en el presupuesto del mundo (antes lo dibujaba otro contexto; mismos límites); se ve aparte en R3D.stats().heroe   // …con el MISMO grado óleo que el mundo EN MÁXIMA (Lote R3D-HEROE-MAXQ: no depende de QL ni del dpr); se compone al final del fotograma
   tH.end(th)}heroScreen={x:hx0,y:hy0,w:px,h:px,rod:hero.rodTip?proj(hero.rodTip):null,hand:hero.handR?proj(hero.handR):null,aim:st.aim}}
  {const pp=st?W3(st.x,st.y,st.z):tgt;water.aim=st?st.aim:null;if(upd){water.viewR=Math.hypot(V.cw,V.ch)/k*.78+6;water.refl=typeof gfx==='function'?!!gfx('refl'):(typeof QL!=='undefined'?QL<=1:true);water.update(dt,now,t,pp,tp,typeof gfx==='function'?(gfx('water')?Math.min(2,QL):3):(typeof QL!=='undefined'?QL:2),ISO.scale()*V.dpr)}}   // Lote R3D-AGUA-IMPL: sim + peces + flotador (después de animar al héroe: usa rodTip)
  {const ik=typeof gfx==='function'?!!gfx('ink'):true;if(ik!==inkOn){inkOn=ik;[INK,...INKX,...INKS.values()].forEach(m=>m.visible=ik)}}   // FLUIDEZ F7: opción «Contornos» (los cascos de tinta son ~½ de las llamadas de dibujo); el reflejo del agua sigue ocultándolos y luego vuelve a este estado
  G.uChrB.value.set(0,0);   // el degradado pies→cabeza del material `chr` es del héroe (global): en el pase del mundo se apaga para los actores
  const f9=shadowF9On()&&(typeof gfx!=='function'||gfx('shadow')>0);if(!f9){sun.position.copy(tgt).add(new THREE.Vector3(...TOD.dia.sunP).normalize().multiplyScalar(30));sun.target.position.copy(tgt)}
  {const shQ=typeof gfx==='function'?gfx('shadow'):(typeof QL!=='undefined'&&QL>=3?1:2),lo=shQ<2;r.shadowMap.autoUpdate=!lo;if(lo)r.shadowMap.needsUpdate=shQ>=1&&((shF=(shF+1)&1)===0);if(f9&&shQ>0){r.shadowMap.autoUpdate=false;r.shadowMap.needsUpdate=false;sF9=true}}   // FLUIDEZ: «Sombras: No» = el mapa ya no se redibuja (intensidad 0 arriba)   // OPT-RENDIMIENTO (22 oct 2026): en Baja/Mínima la sombra del sol se redibuja 1 fotograma de cada 2 (su matriz se actualiza con el mapa, así que lo estático no se desliza; lo que se mueve va 1 fotograma tarde)
  const FS=typeof FSR_ON!=='undefined'&&!!FSR_ON,fs=FS?FSR_S:1,pOil=typeof gfx==='function'?!!gfx('post'):(typeof QL==='undefined'?2:QL)<=2,pBl=typeof gfx==='function'?!!gfx('bloom'):pOil,hq=pOil||pBl,post=hq||FS;   // FSR: con el reescalado activo también Baja/Mínima pasan por el composer (sin bloom ni óleo)
  if(water&&upd&&!dry)water.reflect(r,scene,cam,cssW,cssH);
  if(sF9){sF9=false;shadowF9(rnow)}   // F9: se arma DESPUÉS del reflejo del agua (que oculta pasto, contornos y el agua mientras se dibuja: si la caché se rehacía dentro de él, se guardaba sin las sombras del pasto y parpadeaban al moverse cerca del agua)   // reflejo ligero del agua (R3D-AGUA-ARTSTYLE)
  if(post){bloom.enabled=pBl;grade.enabled=pOil;fsr.enabled=FS;const lq=(typeof QL==='undefined'||QL<=1),key=cssW+'x'+cssH+'@'+V.dpr+(lq?'a':'b')+fs;{const am=aaM(),ms=aaMs();if(ms!==curMs){curMs=ms;[composer.renderTarget1,composer.renderTarget2].forEach(t=>{t.samples=ms;t.dispose()})}   // el MSAA lo elige el jugador (Opciones → Suavizado); FXAA/SMAA = 0 muestras
    if(am==='smaa'&&!smaa&&!smaaTry){smaaTry=1;import('three/addons/postprocessing/SMAAPass.js').then(m=>{smaa=new m.SMAAPass(composer.renderTarget1.width,composer.renderTarget1.height);composer.insertPass(smaa,composer.passes.indexOf(fsr));cSize=''}).catch(e=>{smaaTry=2;console.warn('[R3D] SMAA no disponible (falta SMAAPass.js en vendor/three/examples/jsm/postprocessing): se usa FXAA',e)})}
    fxaa.enabled=am==='fxaa'||(am==='smaa'&&!smaa);if(smaa)smaa.enabled=am==='smaa'}
   if(key!==cSize){cSize=key;composer.setPixelRatio(1);composer.setSize(Math.round(V.cw*fs),Math.round(V.ch*fs));bloom.resolution.set(cssW*fs/(lq?2:4),cssH*fs/(lq?2:4));grade.uniforms.uRes.value.set(composer.renderTarget1.width,composer.renderTarget1.height);fsr.uniforms.uSrc.value.set(composer.renderTarget1.width,composer.renderTarget1.height);fxaa.uniforms.uRes.value.set(composer.renderTarget1.width,composer.renderTarget1.height)}
   bloom.strength=tp.bloom;grade.uniforms.uLift.value.set(tp.lift);{const f=V.zoom*43/Math.max(240,cssH),q=Math.max(0,Math.min(1,(f-.09)/.05));grade.uniforms.uTS.value=(typeof gfx==='function'?gfx('tilt'):(typeof QL==='undefined'||QL<=1))?TILT_K*q*q*(3-2*q):0}   // 20 oct 2026: la inclinación-desenfoque se apaga al alejar el zoom (a zoom mínimo veía toda la escena borrosa arriba/abajo)
   grade.uniforms.uVig.value=tp.vig;if(typeof BR!=='undefined'){grade.uniforms.uFog.value=1-BR.vis;if(BR.vis<1){grade.uniforms.uFogC.value.set(BR.fog).multiplyScalar(1-tp.night*.8)}}if(frz>.002){grade.uniforms.uFog.value=Math.max(grade.uniforms.uFog.value,frz*.55);grade.uniforms.uFogC.value.set('#3a2c14')}   // CINE-1: viñeta oro oscuro del tiempo detenido
   {let kb=0;try{if(typeof P!=='undefined'&&typeof BIOMES!=='undefined')kb=Math.max(0,BIOMES.at(P.x,P.y))}catch(e){}const row=BT[kb]||BT[0];btT.set(1+(row[0][0]-1)*BT_K,1+(row[0][1]-1)*BT_K,1+(row[0][2]-1)*BT_K);btTL.set(row[1][0]*BT_K,row[1][1]*BT_K,row[1][2]*BT_K);
    const a=btInit?1-Math.exp(-dt*1.4):1;btInit=true;btC.lerp(btT,a);btL.lerp(btTL,a);grade.uniforms.uTint.value.copy(btC);grade.uniforms.uTLift.value.copy(btL);if(burn>.002)grade.uniforms.uTint.value.multiply(FT.set(1+.14*burn,1-.08*burn,1-.26*burn))}   // ~1,5 s de fundido al cruzar de bioma
   {const ke=oilK(tp.night);grade.uniforms.uK.value=ke;grade.uniforms.uBrush.value=(typeof gfx==='function'?gfx('brush'):(typeof QL==='undefined'||QL<=1))?.85*Math.pow(ke,1.6):0}   // F3f·P1: óleo según la hora;   // F3d: el pincel baja más rápido que el color; calidad Media o inferior = sin Kuwahara
   const tw=tW.begin('mundo');if(!dry)composer.render(dt);tW.end(tw)}else{const tw=tW.begin('mundo');if(!dry)r.render(scene,cam);tW.end(tw)}
  if(hDone&&heroScreen){hgrade.composite(r,heroScreen.x,heroScreen.y,heroScreen.w,heroScreen.h,V.cw,V.ch)}hDone=false   // F4: el héroe se compone en el lienzo 3D, encima del mundo (antes en la capa 2D)
  tW.poll(GPU);tH.poll(GPU);budgetTick(rnow)}
 // ══ PRESUPUESTO DE RENDIMIENTO (PRIORIDAD 1, lote OPT-RENDIMIENTO, 22 oct 2026; docs/REGLAS_CREACION.md §P) ══
 // El juego iba a 20 fps en una GPU integrada. Estos límites salen de medir la Pradera (la aldea más cargada) con ~20–25 % de margen. Cada 10 s se compara el PICO de
 // triángulos y llamadas de dibujo del fotograma (sombra y reflejo incluidos) y el nº de objetos de las escenas; si algo se pasa, `console.warn('[R3D PRESUPUESTO] …')` UNA vez por motivo.
 // `R3D.budget()` devuelve el informe al momento (úsalo en `ns.py eval` o en la consola antes de entregar). SUBIR UN LÍMITE = decisión del dueño (anótalo en el lote).
 const BUDGET={tris:[2.9e6,2.6e6,1.35e6,1.2e6,1.05e6],calls:[600,580,460,430,400],objs:21000,aObjs:11500,progs:300};
 let bPk={t:0,c:0},bT=0,bQ=-1;const bWarned=new Set();
 function budget(){const q=typeof QL!=='undefined'?QL:2,cnt=s=>{let n=0;s.traverse(()=>n++);return n},o={ql:q,tris:bPk.t||r.info.render.triangles,calls:bPk.c||r.info.render.calls,objs:cnt(scene),aObjs:cnt(aScene),progs:r.info.programs.length},bad=[];
  if(o.tris>BUDGET.tris[q])bad.push('triángulos/fotograma '+(o.tris/1e6).toFixed(2)+' M > '+(BUDGET.tris[q]/1e6).toFixed(2)+' M (calidad '+q+')');
  if(o.calls>BUDGET.calls[q])bad.push('llamadas de dibujo '+o.calls+' > '+BUDGET.calls[q]+' (calidad '+q+')');
  if(o.objs>BUDGET.objs)bad.push('objetos en la escena '+o.objs+' > '+BUDGET.objs+' (agrupa en InstancedMesh por sector con NOUMW)');
  if(o.aObjs>BUDGET.aObjs)bad.push('objetos en la escena del héroe '+o.aObjs+' > '+BUDGET.aObjs);
  if(o.progs>BUDGET.progs)bad.push('programas de shader '+o.progs+' > '+BUDGET.progs+' (reutiliza materiales)');
  o.ok=!bad.length;o.bad=bad;o.limits=BUDGET;return o}
 function budgetTick(now){const ri=r.info.render,ql=typeof QL!=='undefined'?QL:2;if(ql!==bQ){bQ=ql;bPk={t:0,c:0};bT=now+8000;return}   // al cambiar de calidad se espera 8 s (el suelo se reconstruye) antes de volver a medir
 if(ri.triangles>bPk.t)bPk.t=ri.triangles;if(ri.calls>bPk.c)bPk.c=ri.calls;if(!bT)bT=now+15000;if(now<bT)return;bT=now+10000;
  if(!(typeof CINE!=='undefined'&&CINE.on)&&!rooms.on&&!(typeof gfxN==='function'&&gfxN())){const b=budget();b.bad.forEach(m=>{const k=m.split(' ')[0];if(!bWarned.has(k)){bWarned.add(k);console.warn('[R3D PRESUPUESTO] '+m+' · regla de PRIORIDAD 1: docs/REGLAS_CREACION.md §P')}})}bPk={t:0,c:0}}
 // el héroe en su hueco de profundidad del 2D (lo llama draw() de game.js en lugar de dP)
 // IMÁGENES FANTASMA del PERFECT DODGE (21 oct 2026): `R3D.ghost([[x,y,z],…],color)` toma una silueta tintada del héroe (copia del lienzo propio, al dibujarse el héroe) y la deja en esas posiciones del mundo, que se desvanece y sube un poco (≈ 0,75 s).
 let pendG=null;const ghosts=[];
 function ghostDraw(ctx,now){if(pendG&&heroScreen){const hc=hgrade.toCanvas(r);if(!hc){pendG=null;return}const gc=hc,g=gc.getContext('2d');g.globalCompositeOperation='source-in';   /* F4: la silueta sale de leer el render del héroe (solo al hacer un perfect dodge) */
  g.fillStyle=pendG.c||'#bfe6ff';g.fillRect(0,0,gc.width,gc.height);
  pendG.a.forEach((q,i)=>ghosts.push({c:gc,a:W3(q[0],q[1],q[2]).add(new THREE.Vector3(0,.55,0)),t0:now+i*70,k:1-i*.18}));pendG=null;if(ghosts.length>12)ghosts.splice(0,ghosts.length-12)}
  for(let i=ghosts.length-1;i>=0;i--){const g=ghosts[i],u=(now-g.t0)/750;if(u>=1){ghosts.splice(i,1);continue}if(u<0||!heroScreen)continue;const sp=proj(g.a),w=heroScreen.w*(1+.07*u),h=heroScreen.h*(1+.07*u);ctx.globalAlpha=.6*g.k*Math.pow(1-u,1.6);ctx.globalCompositeOperation='lighter';ctx.drawImage(g.c,sp.x-w/2,sp.y-h/2-u*16,w,h)}ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1}
 function drawHero(ctx){if(!heroScreen)return;ctx.save();ctx.setTransform(1,0,0,1,0,0);ghostDraw(ctx,performance.now());ctx.globalAlpha=1;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';if(heroTap){const hc=hgrade.toCanvas(r);if(hc)heroTap(hc,heroScreen)}   /* F4: el héroe ya está compuesto en el lienzo 3D; aquí solo fantasmas, sedal y el gancho opcional de la forja (lee la GPU: solo con USE_HERO) */
  const h=heroScreen;if(h.rod&&h.aim&&water){const bs=water.bobberScreen();if(bs){const bx=bs.x,by=bs.y,u=Math.min(1,(h.aim.ph||0)/.26);   // el flotador es 3D (water3d.js); aquí solo el sedal 2D hasta su posición proyectada
   ctx.lineWidth=Math.max(1,ISO.scale()*.6);ctx.strokeStyle='rgba(255,255,255,.8)';ctx.beginPath();ctx.moveTo(h.rod.x,h.rod.y);ctx.quadraticCurveTo((h.rod.x+bx)/2,Math.max(h.rod.y,by)+(u<1?2:6)*ISO.scale()/2,bx,by);ctx.stroke()}}ctx.restore()}
 function show(on){cv.style.display=on?'block':'none'}
 // precarga: construye todos los chunks a la vista antes de quitar la pantalla de carga
 function preload(){const V=ISO.V,w=ISO.unproj(ISO.cam.x,ISO.cam.y,1),k=ppu(),R=Math.hypot(V.cw,V.ch)/k*.78+6;const cx=w.x/ISO.TILE,cz=w.y/ISO.TILE;terr.update(cx,cz,R,true);const n=terr.pending(cx,cz,R);return n}
 // F3d · perilla «Óleo» (0–100 %): guardada en localStorage (NO en S: es un ajuste del cliente, no de la partida). Slider #ov del HUD (oculto sin ?r3d=1).
 // 22 oct 2026 (dueño): Opciones ya NO ofrece óleo/inclinación/nubes/viento; el juego usa SIEMPRE los valores por defecto (los parámetros de URL ?oleo= ?tilt= ?cloud= ?wind= siguen valiendo para depurar). Se purgan los valores que otras versiones guardaron.
 try{['ns_oleo','ns_tilt','ns_cloud','ns_wind'].forEach(k=>localStorage.removeItem(k))}catch(e){}
 // R3D.shadowCompare(): HERRAMIENTA (F9) — compara el mapa de sombra compuesto (caché + móvil) con uno completo hecho ahora con la misma cámara; debe dar distintos≈0. Lee la GPU: solo para pruebas.
 function shadowCompare(){const sh=sun.shadow,sz=sh.mapSize.x,tmp=new THREE.WebGLRenderTarget(sz,sz,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});let res=null;
  const o=sTrO.onBeforeRender,T=new THREE.Scene(),q=new THREE.Mesh(sTrO.geometry,sTrO.material);q.onBeforeRender=()=>{const real=sh.map;sh.map=tmp;r.shadowMap.needsUpdate=true;r.shadowMap.render([sun],scene,cam);sh.map=real};T.add(q);const ac=r.autoClear;r.autoClear=false;r.render(T,cam);r.autoClear=ac;
  const A=new Uint8Array(sz*sz*4),B=new Uint8Array(sz*sz*4);r.readRenderTargetPixels(sh.map,0,0,sz,sz,A);r.readRenderTargetPixels(tmp,0,0,sz,sz,B);let rows=new Array(8).fill(0),cols=new Array(8).fill(0),par=[0,0,0,0],smp=[];let d=0,dm=0,lt=0,gt=0;
  for(let i=0;i<A.length;i+=4){const a=A[i]/255+A[i+1]/65025+A[i+2]/16581375,b=B[i]/255+B[i+1]/65025+B[i+2]/16581375,e=Math.abs(a-b);if(e>1e-4){d++;if(a<b)lt++;else gt++;const px=(i/4)%sz,py=Math.floor(i/4/sz);rows[Math.floor(py*8/sz)]++;cols[Math.floor(px*8/sz)]++;par[(px&1)+2*(py&1)]++;if(smp.length<6&&d%5000===1)smp.push([px,py,A[i],A[i+1],A[i+2],A[i+3],B[i],B[i+1],B[i+2],B[i+3]])}if(e>dm)dm=e}
  tmp.dispose();return {par,smp,rows,cols,sz,distintos:d,menorEnCompuesto:lt,mayor:gt,maxDif:+dm.toFixed(4),total:sz*sz}}
 return{shadowStats:()=>({...sSt,bad:sBad,on:shadowF9On()}),shadowCompare,shadowDirty:()=>{sDirty=true},set heroTap(f){heroTap=f},get dry(){return dry},set dry(v){dry=!!v},gpu:GPU,dbg:{terr,cts,composer,bloom,grade,sun,pool,lantern,aLantern,aSun,aBack,ar,hgrade,parts,scene,aScene},get water(){return water},outfits:{list:OUTFITS,of:outfitOf,unlocked:outfitUnlocked,resolve:resolveLook},preview:cvs=>new HeroPreview(cvs),talkHead:cvs=>new TalkHead(cvs),get shrineMin(){return shrMin},set shrineMin(v){shrMin=Math.max(0,Math.min(1,+v||0))},get contact(){return cts.k},set contact(v){cts.k=Math.max(0,Math.min(1.5,+v||0))},get clouds(){return cloudK},get tilt(){return TILT_K},set tilt(v){TILT_K=Math.max(0,Math.min(1.5,+v||0))},get wind(){return G.uWindK.value},set wind(v){G.uWindK.value=Math.max(0,Math.min(3,+v||0))},set clouds(v){cloudK=Math.max(0,Math.min(1.5,+v||0))},get oilDay(){return OIL.H},set oilDay(v){OIL.H=Math.max(0,Math.min(1,+v||0));setOil(OIL.K)},get oil(){return OIL.K},set oil(v){setOil(v);const sl=document.getElementById('ov');if(sl)sl.value=Math.round(OIL.K*100)},frame,drawHero,show,preload,budget,get tod(){return TODc},get propsOn(){return props.on},get parts3d(){return parts.on},parts,get resOn(){return res.on},get dropsOn(){return drops.on},drops,rays,glow,lm:dl,rooms,get intOn(){return rooms.on},get stOn(){return sta.on},get facOn(){return fac.on},get poOn(){return sta.poOn},sta,props,res,actors,blood,get az(){return az},set az(v){az=azT=v},get tscale(){return tsT},set tscale(v){tsT=Math.max(0,Math.min(1,+v||0))},get frozen(){return frz},get skyBurn(){return burnT},set skyBurn(v){burnT=Math.max(0,Math.min(1,+v||0))},get skyBurnNow(){return burn},skyBurnReset(){burnT=burn=0},get vclock(){return last},tsync(){tsT=tsK=1;vlag=0;frz=0},renderer:r,scene,W3,get sky(){return sky},get gait(){const a=hero&&hero.anim;return{g:a?a.gph:0,run:!!a&&a.runK>.5,vis:frz<.5}},   // marcha del héroe para los PASOS (footsteps.js): fase de pie `gph` (un pie toca el suelo cada vez que cambia floor(2·gph)), ¿corriendo?, ¿audible? (no en el tiempo detenido)
 async warmShaders(maxMs=30000,all=true){actors.bake();   // Lote FREEZE-SHADERS: compila de antemano TODOS los programas del mundo (tras la pantalla de carga) para que no se compilen a mitad de partida (paradas de 8 s o más)
  const hid=[];if(all)scene.traverse(o=>{if(!o.visible){o.visible=true;hid.push(o)}});
  // 22 oct 2026: llamaradas y brasas del cielo en llamas se crean ya (antes nacían al prender el cielo y compilaban sus shaders EN la cinemática = tirón); invisibles se saltan, así que se muestran un momento
  try{if(!skyFire)skyFire=new SkyFire(scene,W3);if(!bem)bem=new Embers(scene,360);[skyFire.mesh,bem.pts].forEach(o=>{if(o&&!o.visible){o.visible=true;hid.push(o)}})}catch(e){}
  // 21 oct 2026: lo que se crea bajo demanda (decals de combate, ojos de aviso, copias de árboles/menas que caen) también se precompila: si no, la PRIMERA vez que ocurre el juego se congela
  const tmp=[...spell.warmObjs(),...res.warmObjs(),...actors.warmObjs(),new THREE.Sprite(new THREE.SpriteMaterial({color:"#ffffff",transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}))];tmp.forEach(o=>scene.add(o));
  const t0=performance.now(),n0=r.info.programs.length;
  const cp=r.clippingPlanes;
  // El programa de un material depende del DESTINO de render (pantalla o render target del composer: espacio de color/tone mapping distinto) y del plano de recorte global del reflejo del agua:
  // se compila para cada combinación (21 oct 2026: antes solo se compilaba contra la pantalla, y la primera tala/telegrafía/estela aún congelaba el juego).
  // 25 oct 2026 (ANTI-TIRONES): antes se compilaban las 4 combinaciones (pantalla/RT × con/sin recorte) = carga de ~17 s; ahora solo los destinos de la calidad ACTUAL (gVars)
  // y el resto se precalienta en segundo plano tras la carga (gate.background), por si la calidad cambia en partida.
  const rt0=r.getRenderTarget(),cur=gVars();warming=true;
  const G0=gate.G[0]||{r,cam};try{for(const v of cur){gate.prime(G0,v,cp);await Promise.race([r.compileAsync(scene,cam),new Promise(ok=>setTimeout(ok,maxMs))])}}catch(e){console.warn('[R3D warmShaders]',e)}
  try{const cc=r.getClearColor(new THREE.Color()),ca=r.getClearAlpha();const hrt=hgrade.begin(r,8,8);aScene.updateMatrixWorld();const hid2=[];aScene.traverse(o=>{if(!o.visible){o.visible=true;hid2.push(o)}});await Promise.race([r.compileAsync(aScene,acam),new Promise(ok=>setTimeout(ok,maxMs))]);hid2.forEach(o=>o.visible=false);r.setClearColor(cc,ca)}catch(e){console.warn('[R3D warmShaders héroe]',e)}   // F4: la escena del héroe ahora la pinta el renderer principal (su render target)
  r.setRenderTarget(rt0);r.clippingPlanes=cp;warming=false;
  if(!all){gate.on=true;gVk=cur.map(v=>v.key).join();if(typeof QA!=='undefined'&&QA&&QL===2)gate.background(0,[GV.scr])}   // solo la calidad AUTOMÁTICA en Media puede bajar sola a Baja (pantalla sin composer); el resto de destinos se piden al cambiar de calidad (gVk en frame)
  tmp.forEach(o=>{scene.remove(o);if(o.isSprite||(o.material&&o.material.isShaderMaterial))o.material.dispose()});hid.forEach(o=>{o.visible=false});console.info('[R3D shaders]',{programas:r.info.programs.length,nuevos:r.info.programs.length-n0,ms:Math.round(performance.now()-t0)})},
 gate,ghost:(a,c)=>{pendG={a,c}},get wu(){return WU},get spell(){return spell},get fx(){return fx},get impact(){return impact},get aura(){return aura},get body(){return body},get res(){return rooms.cave?cres:res},fragment:()=>new Fragment(scene),debris:n=>new Debris(scene,n),embers:n=>new Embers(scene,n),gabriel:(x,y,z)=>new Gabriel(scene,W3,x,y,z==null?TER.standZ(x,y):z),hero,terr,stats:()=>({calls:r.info.render.calls,tris:r.info.render.triangles,chunks:terr.ch.size,heroe:{calls:HST.calls,tris:HST.tris,cpuMs:+HST.ms.toFixed(2)}})}}
