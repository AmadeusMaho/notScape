// NotScape · R3D · ICONOS 3D DE OBJETOS (Lote R3D-HUD-H3, 20 oct 2026) — pipeline de `docs/PLAN_HUD_SUSURRO.md` §4-H3, con los MODELOS REALES del juego.
// ───────────────────────────────────────────────────────────────────────────────────────────────────
// QUÉ HACE: convierte un id de objeto en un dataURL PNG 128×128 (fondo transparente) renderizado con three.js y lo cachea. `ITEMICON.url(id)` (src/item-icons.js) lo usa en
// cuanto está listo; mientras tanto (y para todo lo que aquí no tiene modelo) sigue saliendo el icono pintado 2D, y al terminar el render se cambia el `src` de las <img data-i3="id">.
// MODELOS (nada se duplica; todo viene del juego):
//  · armas y herramientas  → `cultWeapon` (weapons3d.js, por cultura) o `BUILD` (heroanim3d.js): LA MISMA malla que lleva el héroe en la mano.
//  · armaduras (peto, pantalón, guantes, botas, casco, capa) → un `Mini` real con `armorHooks` (armor3d.js) cuyo cuerpo base se OCULTA: queda solo la pieza en su sitio (maniquí invisible).
//    Escudo → `BUILD.shield` con `sh` (armor3d `shield`). Carcaj/flechas/virotes y los objetos genéricos (mena, barra, tronco, poción, gema, anillo, amuleto, monedas) se modelan aquí.
//  · SIN modelo todavía (siguen en 2D): comida, pescado, runas, pergaminos, botín de criaturas, plumas, cuero, lana, tela… (ver AGENTS.md → «Lote R3D-HUD-H3»).
// ESTILO: el del juego (toon + contorno de casco invertido, `chr:1`), luz de estudio fija (clave cálida arriba-izquierda + relleno hemisférico) y un contraluz del color de la RAREZA (como la demo del HUD).
// UN SOLO WebGLRenderer, creado perezosamente al primer pedido y LIBERADO tras `IDLE` ms sin trabajo (el contexto WebGL es escaso: principal, retrato, muñeco, cabeza de diálogo…).
// RENDIMIENTO: un icono por turno de `setTimeout` (≈ 5–40 ms cada uno según GPU), nunca dentro del fotograma. La caché sobrevive a la liberación del renderer.
// API (global `ICON3D`):  url(id, thunk) → dataURL | null   (null = aún no / no soportado; el thunk `()=>({kind,c,o,id,tier,cu,rc})` lo da item-icons.js solo la primera vez)
//                         ok · on (interruptor, `?icons3d=0` lo apaga) · stats() · sheet(ids) → canvas con una hoja de contacto (herramientas de prueba) · clear().
import * as THREE from 'three';
import {toon,hull,glow,jit,G} from './materials3d.js';
import {BUILD} from './heroanim3d.js';
import {cultWeapon} from './weapons3d.js';
import {armorHooks} from './armor3d.js';
import {Mini} from './mini3d.js';
import {GEN2,POSE2,DPOSE2} from './itemgen3d.js';   // Lote R3D-DROPS-3D: comida, botín, runas, pergaminos… (antes solo 2D)

const IDLE=6000,PI=Math.PI;let SIZE=128;
const shade=(c,k)=>'#'+new THREE.Color(c).multiplyScalar(k).getHexString(),mixc=(a,b,t)=>'#'+new THREE.Color(a).lerp(new THREE.Color(b),t).getHexString();
const sph=(r,x=1,y=1,z=1)=>new THREE.SphereGeometry(r,14,10).scale(x,y,z),cyl=(a,b,h,n=10)=>new THREE.CylinderGeometry(a,b,h,n),box=(x,y,z)=>new THREE.BoxGeometry(x,y,z);
const flat=g=>{const n=g.index?g.toNonIndexed():g;n.computeVertexNormals();return n};
const GOLD='#d8a24a',WOOD='#5a3e2c',LEATH='#4a3424';

// ── ids → descripción de la pieza de armadura (misma lógica que armorInfo() de game.js) ──
const TI=['cobre','bronce','hierro','acero','plata','alba','mitril','adam','runita','oricalco','infernita','celestita'];
const cl=t=>TI.includes(t)?t:t==='cuero'?'bronce':t==='madera'?'cobre':'hierro';
function armorOf(kind,info){const id=(info.id||'').split('~')[0];let m;
 if(m=/^lt_(\d)([a-z])(\d)$/.exec(id)){const k=+m[1],s=m[2],q=+m[3];
  if(s==='h'||s==='f'||s==='c')return{slot:s,arm:{[s]:{k,q}}};
  const pc={f:['m','cu','tu'][k%3],t:TI[Math.min(11,k*2+q-1)],cu:k};if(s==='l'||s==='g'||s==='s')return{slot:s,arm:{[s]:pc}};return null}
 if(id==='lg_helm')return{slot:'h',arm:{h:{k:5,q:4,leg:1}}};if(id==='lg_boots')return{slot:'f',arm:{f:{k:5,q:4,leg:1}}};
 const sl={chest:'a',legs:'l',gloves:'g',shield:'s'}[kind];if(!sl)return null;
 const fm=/^(?:ar|sh|lg|gl)_(cu|tu)_/.exec(id),f=fm?fm[1]:id==='ar_cuero'?'cu':'m';
 return{slot:sl,arm:{[sl]:{f,t:cl(info.tier),cu:info.cu||0}}}}

// ── constructor de piezas para modelos sueltos (igual que Mini.part: toon de personaje + casco de contorno) ──
function mkPart(root,keep){return(geo,col,x,y,z,o={})=>{const m=new THREE.Mesh(geo,o.mat||toon(col,Object.assign({chr:1,rim:1.4},o.t)));m.position.set(x,y,z);(o.p||root).add(m);keep.push(m);
 if(o.ink!==0){const h=hull(geo,o.ink||.016);m.add(h);   /* hijo de la malla: sigue sus giros posteriores (ver mini3d.js) */keep.push(h);m.userData.h=h}return m}}

// ── modelos genéricos (tamaño ≈ .5 para que el contorno de .012–.02 pese igual que en las armas) ──
const GEN={
 ore(p,g,c){const base='#7a7a84';p(jit(new THREE.IcosahedronGeometry(.22,1).scale(1.25,.9,1),.05),base,0,0,0,{p:g,ink:.014});
  p(jit(new THREE.IcosahedronGeometry(.12,0).scale(1,.8,1),.03),mixc(base,'#ffffff',.18),-.1,.13,.06,{p:g,ink:.01});
  [[.1,.04,.19,.06],[-.15,-.02,.16,.05],[.05,.17,.09,.045],[.17,.12,.1,.04]].forEach(([x,y,z,r])=>p(flat(new THREE.OctahedronGeometry(r,0)),c,x,y,z,{p:g,ink:.008,t:{rim:2}}))},
 bar(p,g,c){const body=flat(new THREE.CylinderGeometry(.14,.21,.12,4,1).rotateY(PI/4).scale(1.9,1,1.05));p(body,c,0,0,0,{p:g,ink:.014,t:{rim:2}});
  p(flat(new THREE.CylinderGeometry(.115,.15,.012,4,1).rotateY(PI/4).scale(1.9,1,1.05)),mixc(c,'#ffffff',.35),0,.066,0,{p:g,ink:0})},
 log(p,g,c){const bark=shade(c,.78),end=mixc(c,'#f0d49a',.55);p(cyl(.105,.105,.5,12).rotateZ(PI/2),bark,0,0,0,{p:g,ink:.014});
  [-1,1].forEach(s=>{p(cyl(.099,.099,.012,12).rotateZ(PI/2),end,s*.254,0,0,{p:g,ink:0});p(new THREE.TorusGeometry(.06,.006,5,14).rotateY(PI/2),shade(end,.7),s*.262,0,0,{p:g,ink:0});p(new THREE.TorusGeometry(.03,.005,5,12).rotateY(PI/2),shade(end,.7),s*.262,0,0,{p:g,ink:0})});
  for(let i=0;i<4;i++)p(box(.012,.01,.1),shade(bark,.7),-.15+i*.1,.1,(i%2?.02:-.02),{p:g,ink:0,t:{rim:0}}).rotation.y=i*.7},
 potion(p,g,c){const prof=[[0,0],[.1,.008],[.16,.05],[.185,.12],[.16,.2],[.08,.25],[.06,.27],[.06,.35],[.075,.37],[.075,.4],[0,.4]].map(a=>new THREE.Vector2(a[0],a[1]));
  const bodyG=new THREE.LatheGeometry(prof.slice(0,6),18),neckG=new THREE.LatheGeometry(prof.slice(5),18);
  p(bodyG,c,0,0,0,{p:g,ink:.012,t:{rim:2}});p(neckG,'#dcecf0',0,0,0,{p:g,ink:.012});p(cyl(.07,.058,.07,10),'#8a5a32',0,.42,0,{p:g,ink:.01});
  p(new THREE.TorusGeometry(.066,.012,5,14).rotateX(PI/2),'#c8a060',0,.33,0,{p:g,ink:0});p(sph(.028,1,1.5,.5),'#ffffff',-.07,.12,.15,{p:g,ink:0,mat:glow('#ffffff',1.1)})},
 gem(p,g,c){p(flat(new THREE.OctahedronGeometry(.2,0).scale(1,1.3,1)),c,0,0,0,{p:g,ink:.012,t:{rim:2.4}});p(flat(new THREE.OctahedronGeometry(.07,0).scale(1,1.3,1)),mixc(c,'#ffffff',.7),-.05,.08,.1,{p:g,ink:0,mat:glow(mixc(c,'#ffffff',.55),1.25)})},
 ring(p,g,c,o){const gm=(o&&o.gem)||'#6ad8ff';p(new THREE.TorusGeometry(.17,.034,8,24),c,0,0,0,{p:g,ink:.012,t:{rim:2}});p(box(.07,.05,.05),c,0,.185,0,{p:g,ink:.01});p(flat(new THREE.OctahedronGeometry(.062,0).scale(1,1.2,1)),gm,0,.23,0,{p:g,ink:.008,mat:glow(gm,1.5)})},
 amulet(p,g,c,o){const gm=(o&&o.gem)||'#ff6a8a';p(new THREE.TorusGeometry(.23,.013,6,26,PI).rotateZ(PI),GOLD,0,.17,0,{p:g,ink:.01});
  p(sph(.085,1,1.1,.5),c,0,-.1,0,{p:g,ink:.012,t:{rim:2}});p(new THREE.TorusGeometry(.085,.014,6,16),GOLD,0,-.1,.0,{p:g,ink:0});p(flat(new THREE.OctahedronGeometry(.05,0)),gm,0,-.1,.045,{p:g,ink:0,mat:glow(gm,1.5)})},
 coins(p,g){[[0,0,0],[.02,.034,.01],[-.01,.068,-.01]].forEach(([x,y,z],i)=>p(cyl(.15,.15,.03,20),i%2?'#d8b030':'#f0c840',x,y,z,{p:g,ink:.01,t:{rim:2}}));p(cyl(.1,.1,.012,20),'#f8e070',0,.092,0,{p:g,ink:0})},
 arrows(p,g,c,o){const bolt=o&&o.bolt;for(const [dx,dz,r] of [[-.07,-.02,-.12],[0,0,0],[.07,.02,.12]]){const a=new THREE.Group();a.rotation.z=r;g.add(a);a.position.x=dx;a.position.z=dz;
   p(cyl(.008,.008,.52,5),bolt?'#b08850':'#c8a070',0,0,0,{p:a,ink:.006});p(new THREE.ConeGeometry(.032,.09,4).translate(0,.3,0),c,0,0,0,{p:a,ink:.008,t:{rim:2}});
   [0,1,2].forEach(i=>p(box(.003,.08,.05).rotateY(i*PI/3).translate(0,-.2,0),bolt?'#6a4a2a':'#e5453a',0,0,0,{p:a,ink:0}))}},
 quiver(p,g,c){p(new THREE.CylinderGeometry(.1,.07,.5,10),c,0,0,0,{p:g,ink:.014});p(new THREE.TorusGeometry(.1,.015,5,14).rotateX(PI/2),shade(c,.7),0,.22,0,{p:g,ink:0});
  [[-.04,.02],[.03,.0],[.0,-.04]].forEach(([x,z],i)=>{p(cyl(.007,.007,.3,5),'#c8a070',x,.33,z,{p:g,ink:.005});p(box(.003,.06,.04).rotateY(i),'#e5453a',x,.46,z,{p:g,ink:0})});p(box(.2,.025,.01),'#c8a060',0,-.05,.085,{p:g,ink:0})}};

Object.assign(GEN,GEN2);   // los kinds nuevos usan la misma firma que GEN

// qué kind del 2D → modelo de arma/herramienta de BUILD
const WK={sword:'sword',dagger:'dagger',greatsword:'great',xbow:'xbow',scepter:'scepter',staff:'staff',bow:'bow',mace:'mace',axe:'axe',pick:'pick',rod:'rod',shears:'shears'};
const ARM_K=new Set(['chest','legs','gloves','boots','helm','cape','shield']);
export const supports=k=>!!(WK[k]||ARM_K.has(k)||GEN[k]||k==='arrows'||k==='bolts'||k==='quiver');

// orientación de cada modelo en el icono: [rx, ry, rz] del grupo (las armas se inclinan 45°, el resto se ve en 3/4)
const POSE={sword:[0,-.5,-.8],dagger:[0,-.5,-.8],greatsword:[0,-.5,-.8],staff:[0,-.4,-.6],scepter:[0,-.5,-.8],mace:[0,-.5,-.8],axe:[0,-.5,-.7],pick:[0,-.5,-.7],rod:[0,-.3,-.55],shears:[0,-.5,-.7],bow:[0,-.85,0],xbow:[-.95,-.35,-.7],
 ore:[0,-.5,0],bar:[0,-.55,0],log:[.25,-.5,.25],potion:[0,-.4,0],gem:[0,.5,0],ring:[-.35,-.4,0],amulet:[0,-.3,0],coins:[.3,-.4,0],arrows:[0,-.3,-.7],bolts:[0,-.3,-.7],quiver:[0,-.5,.25],shield:[0,-.45,0]};

// Pose en el SUELO (Lote R3D-DROPS-3D, drops3d.js): lo largo se tumba, lo plano queda plano. `info.ground` activa esta tabla en build().
const DPOSE=Object.assign({sword:[0,0,PI/2],dagger:[0,0,PI/2],greatsword:[0,0,PI/2],staff:[0,0,PI/2],scepter:[0,0,PI/2],mace:[0,0,PI/2],axe:[0,0,PI/2],pick:[0,0,PI/2],rod:[0,0,PI/2],shears:[0,0,PI/2],bow:[PI/2,0,0],xbow:[0,0,0],
 ore:[0,0,0],bar:[0,0,0],log:[0,0,0],potion:[0,0,PI/2],gem:[0,0,0],ring:[PI/2,0,0],amulet:[PI/2,0,0],coins:[0,0,0],arrows:[0,0,PI/2],bolts:[0,0,PI/2],quiver:[0,0,PI/2.4]},DPOSE2);
const poseOf=(kind,info)=>(info.ground&&DPOSE[kind])||POSE[kind]||POSE2[kind]||[0,0,0];

// ── una «escena de estudio» por render: se construye, se pinta y se libera ──
export function build(kind,info){const root=new THREE.Group(),keep=[],part=mkPart(root,keep),c=info.c||'#aaaaaa',o=info.o||{};let mini=null;
 if(WK[kind]){const k=WK[kind],cu=info.cu||0,oo=Object.assign({col:c,cu},o,k==='staff'||k==='scepter'?{col:o.orb||c}:{}),g=new THREE.Group();root.add(g);
  const r=cultWeapon(k,part,g,oo)||BUILD[k](part,g,oo);void r;const q=poseOf(kind,info);g.rotation.set(q[0],q[1],q[2],'ZYX')}
 else if(kind==='shield'){const a=armorOf(kind,info);if(!a)return null;const g=new THREE.Group();root.add(g);BUILD.shield(part,g,{sh:a.arm.s});g.rotation.set(0,-.45,0);g.scale.setScalar(1.1)}
 else if(ARM_K.has(kind)){const a=armorOf(kind,info);if(!a)return null;const AH=armorHooks(a.arm,{robe:'#555560'});if(!AH)return null;const kept=new Set(),wrap=p=>(geo,col,x,y,z,oo)=>{const m=p(geo,col,x,y,z,oo);kept.add(m);if(m.userData.h)kept.add(m.userData.h);return m};
  const sp=Object.assign({id:'heroe',k:1,facet:true,inkK:.8,pants:'#44444c',robe:'#555560',trim:'#777782',belt:'#333338',skin:'#8a7a70',w:1,boot:'#33333a'},AH.spec,{top:(F,h,p)=>AH.top(F,h,wrap(p)),acc:(F,g,p)=>AH.acc(F,g,wrap(p))});
  mini=new Mini(sp);root.add(mini.obj);mini.obj.updateMatrixWorld(true);
  // Se conserva del cuerpo base SOLO lo que forma parte de la prenda: la túnica de TELA (y sus mangas), el pantalón (piernas), la bota (caña y pie) o la mano (guantes).
  // Todo lo demás (piel, cabeza, pelo, ropa por defecto) se oculta: queda la pieza flotando en su sitio.
  const col=x=>new THREE.Color(x).getHexString(),want=new Set(),pairs=a.slot==='f'||a.slot==='g';
  if(a.slot==='a'&&a.arm.a.f==='tu')[sp.robe,sp.sleeve].forEach(x=>x&&want.add(col(x)));if(a.slot==='l')want.add(col(sp.pants));if(a.slot==='f')want.add(col(sp.boot));
  mini.obj.traverse(ob=>{if(!ob.isMesh||ob.userData.hull||kept.has(ob))return;if(ob.material&&ob.material.color&&want.has(col(ob.material.color))||(a.slot==='g'&&mini.hands.includes(ob))){kept.add(ob);if(ob.userData.h)kept.add(ob.userData.h)}});
  // pares (guantes, botas): UNA sola pieza, la del lado x<0, para que salga grande y legible
  if(pairs){const bx=new THREE.Box3();[...kept].forEach(ob=>{if(!ob.isMesh)return;bx.setFromObject(ob);if(bx.isEmpty())return;const cx=(bx.min.x+bx.max.x)/2;if(cx>.03)kept.delete(ob)})}
  mini.obj.traverse(ob=>{if(ob.isMesh){ob.visible=kept.has(ob);if(kept.has(ob)&&!ob.userData.hull)keep.push(ob)}});
  root.rotation.set(0,a.slot==='c'?PI-.45:a.slot==='f'?PI/2-.3:-.45,a.slot==='g'?PI:0,'ZYX')}
 else if(kind==='bolts'||kind==='arrows'){GEN.arrows(part,root,c,{bolt:kind==='bolts'});root.rotation.set(0,info.ground?0:-.3,info.ground?PI/2:-.7,'ZYX')}
 else if(GEN[kind]){const g=new THREE.Group();root.add(g);GEN[kind](part,g,GEN2[kind]?info.c:c,o);const q=poseOf(kind,info);g.rotation.set(q[0],q[1],q[2],'ZYX')}
 else return null;
 return{root,keep,mini}}

// ── renderer único perezoso ──
let R=null,scene=null,cam=null,key=null,rim=null,hemi=null,plt=null,idleT=0,failed=false;
function ensure(){if(R)return R;if(failed)return null;
 try{R=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,premultipliedAlpha:true});R.setPixelRatio(1);R.setSize(SIZE,SIZE,false);R.setClearColor(0,0);R.toneMapping=THREE.NoToneMapping;
  scene=new THREE.Scene();hemi=new THREE.HemisphereLight('#c8d2e8','#5a4634',1.05);key=new THREE.DirectionalLight('#fff0d6',2.6);key.position.set(-2.5,3,3);rim=new THREE.DirectionalLight('#ffffff',.9);rim.position.set(3,1,-3);plt=new THREE.PointLight('#ffffff',0,10,1);scene.add(hemi,key,rim,plt);   // plt = luz de rareza del hover: SIEMPRE en la escena (intensidad 0) para no recompilar shaders al primer hover
  cam=new THREE.OrthographicCamera(-1,1,1,-1,.1,60)}
 catch(e){console.warn('[ICON3D] sin WebGL, sigue el icono 2D:',e);R=null;failed=true;return null}
 return R}
function release(){if(!R)return;try{R.renderLists.dispose();R.dispose();R.forceContextLoss()}catch(e){}R=null;scene=null;cam=null;key=rim=hemi=plt=null}

function fit(b,keep,dirV){const box=new THREE.Box3(),t=new THREE.Box3();keep.forEach(m=>{if(m.isMesh&&!m.userData.hull&&m.visible!==false){t.setFromObject(m);if(isFinite(t.min.x))box.union(t)}});
 if(box.isEmpty())return null;const ct=box.getCenter(new THREE.Vector3()),ds=dirV.clone().normalize();cam.position.copy(ct).addScaledVector(ds,10);cam.up.set(0,1,0);cam.lookAt(ct);cam.updateMatrixWorld(true);
 const inv=cam.matrixWorldInverse;let mx=0;for(let i=0;i<8;i++){const v=new THREE.Vector3(i&1?box.max.x:box.min.x,i&2?box.max.y:box.min.y,i&4?box.max.z:box.min.z).applyMatrix4(inv);mx=Math.max(mx,Math.abs(v.x),Math.abs(v.y))}
 const h=Math.max(.05,mx*1.04);cam.left=-h;cam.right=h;cam.top=h;cam.bottom=-h;cam.updateProjectionMatrix();return ct}

const withG=fn=>{const sv={cb:G.uChrB.value.clone(),n:G.uNight.value,cl:G.uCloud?G.uCloud.value:0};G.uChrB.value.set(0,0);G.uNight.value=0;if(G.uCloud)G.uCloud.value=0;   // el sombreado de pies/noche/nubes del mundo NO aplica a un icono
 try{return fn()}finally{G.uChrB.value.copy(sv.cb);G.uNight.value=sv.n;if(G.uCloud)G.uCloud.value=sv.cl}};
const setRim=rcol=>{const rc=rcol&&rcol!=='#ffffff'?rcol:null;rim.color.set(rc||'#ffffff');rim.intensity=rc?2.3:.9};
const VIEW=new THREE.Vector3(0,.22,1);
function dropModel(b){if(scene)scene.remove(b.root.parent&&b.root.parent!==scene?b.root.parent:b.root);b.root.traverse(o=>{if(o.geometry)o.geometry.dispose()});R&&R.renderLists.dispose()}
function renderOne(info){const b=build(info.kind,info);if(!b)return null;if(!ensure())return null;setRim(info.rc);
 scene.add(b.root);b.root.updateMatrixWorld(true);let url=null;
 withG(()=>{try{if(fit(b,b.keep,VIEW)){R.setClearColor(0,0);R.clear();R.render(scene,cam);const ei=String(info.id||'').includes('@')&&typeof ITEMICON!=='undefined'&&ITEMICON.ench;url=(ei?ITEMICON.ench(R.domElement,info.id):R.domElement).toDataURL('image/png')}}catch(e){console.warn('[ICON3D]',info.id,e)}});
 dropModel(b);return url}

// ── HOVER VIVO (plan H3): al pasar el ratón por una casilla con icono 3D, un lienzo FIJO (fuera del layout: ninguna casilla cambia de tamaño) muestra el modelo girando; al salir se libera todo.
// Solo ratón (no táctil: allí irá la pulsación larga, H9). El render sale del renderer único y se copia a un 2D; el modelo vive SOLO mientras dura el hover.
let live=null;
function hoverStop(){if(!live)return;cancelAnimationFrame(live.raf);if(live.pl)live.pl.intensity=0;live.cv.remove();if(live.img)live.img.style.opacity='';dropModel(live.b);live=null;clearTimeout(idleT);idleT=setTimeout(()=>{if(!Q.length&&!live)release()},IDLE)}
function hoverStart(img,id){const e=CACHE.get(id);if(!e||e.st!=='ok'||!e.i||!API.on)return;hoverStop();
 const b=build(e.i.kind,e.i);if(!b||!ensure())return;setRim(e.i.rc);const piv=new THREE.Group();scene.add(piv);piv.add(b.root);b.root.updateMatrixWorld(true);
 let ct=null;withG(()=>{ct=fit(b,b.keep,VIEW)});if(!ct){scene.remove(piv);return}
 cam.left*=1.22;cam.right*=1.22;cam.top*=1.22;cam.bottom*=1.22;cam.updateProjectionMatrix();   // margen extra: al girar, la hoja no se corta
 piv.position.copy(ct);b.root.position.sub(ct);   // gira alrededor del CENTRO del modelo, no del agarre
 const cv=document.createElement('canvas');cv.width=cv.height=SIZE;cv.style.cssText='position:fixed;pointer-events:none;z-index:30;image-rendering:auto';document.body.appendChild(cv);const x=cv.getContext('2d');
 // LUZ REAL (oct 2026): objetos azules/épicos/legendarios (`rn`≥2) llevan una PointLight del color de su rareza junto al modelo, que pulsa/parpadea mientras dura el hover; además se modula el contraluz.
 let pl=null;const rn=e.i.rn|0,hh=(cam.top-cam.bottom)/2.44;const lc=e.i.fc||e.i.rc;if(rn>=2&&lc&&plt){pl=plt;pl.color.set(lc);rim.color.set(lc);pl.distance=hh*7;pl.intensity=0;pl.position.copy(ct).add(new THREE.Vector3(hh*.7,hh*.9,hh*1.6))}
 img.style.opacity='0';const t0=performance.now();live={b,cv,img,piv,pl};
 (function loop(now){if(!live||live.cv!==cv)return;const cell=img.closest('.slot,.eqc')||img,r=cell.getBoundingClientRect(),z=Math.min(r.width,r.height)*.98;if(!img.isConnected||r.width<4){hoverStop();return}   // tamaño y centro de la CASILLA (estables aunque la <img> tenga su propia animación de hover)
  cv.style.left=(r.left+r.width/2-z/2)+'px';cv.style.top=(r.top+r.height/2-z/2)+'px';cv.style.width=cv.style.height=z+'px';
  piv.rotation.y=Math.sin((now-t0)/1000*1.7)*.75;
  if(pl){const T=(now-t0)/1000,k=rn===4?.8+.12*Math.sin(T*9.1)+.08*Math.sin(T*23.7+1):rn===3?.8+.2*Math.sin(T*3.2):.94+.06*Math.sin(T*1.8),a=Math.min(1,T*4);pl.intensity=a*k*(rn===4?9:rn===3?7:5)*hh;rim.intensity=2.3+a*k*(rn-1)*.5}
  withG(()=>{R.setClearColor(0,0);R.clear();R.render(scene,cam)});x.clearRect(0,0,SIZE,SIZE);const eid=img.dataset.i3;x.drawImage(eid&&eid.includes('@')&&typeof ITEMICON!=='undefined'&&ITEMICON.ench?ITEMICON.ench(R.domElement,eid,(now-t0)/1000):R.domElement,0,0);live.raf=requestAnimationFrame(loop)})(t0)}
if(typeof document!=='undefined'){
 document.addEventListener('mouseover',ev=>{if(!API.on||ev.pointerType==='touch'||(window.matchMedia&&matchMedia('(hover:none)').matches))return;const t=ev.target;if(!t||!t.closest)return;
  const img=t.tagName==='IMG'&&t.dataset&&t.dataset.i3?t:(t.closest('.slot,.eqc')||{}).querySelector&&t.closest('.slot,.eqc').querySelector('img[data-i3]');
  if(img&&img.dataset.i3&&img!==(live&&live.img))hoverStart(img,img.dataset.i3)});
 document.addEventListener('mouseout',ev=>{if(!live)return;const to=ev.relatedTarget;if(to&&to.closest){const c=live.img.closest('.slot,.eqc');if(c&&c.contains(to))return}hoverStop()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)hoverStop()})}

// ── cola y caché ──
const CACHE=new Map(),Q=[];let timer=0,done=0,ms=0;   // CACHE: id → {u:dataURL|null, st:'pend'|'ok'|'no', i:info}
function pump(){timer=0;const t0=performance.now();
 while(Q.length&&performance.now()-t0<12){const id=Q.shift(),e=CACHE.get(id);if(!e||e.st!=='pend')continue;let u=null;
  try{u=renderOne(e.i)}catch(x){console.warn('[ICON3D]',id,x)}
  if(u){e.u=u;e.st='ok';done++;apply(id,u)}else e.st='no';}
 ms+=performance.now()-t0;
 if(Q.length)timer=setTimeout(pump,16);else{clearTimeout(idleT);idleT=setTimeout(()=>{if(!Q.length&&!live)release()},IDLE)}}
function apply(id,u){try{document.querySelectorAll('img[data-i3]').forEach(i=>{if(i.dataset.i3===id)i.src=u})}catch(e){}}

const API={ok:true,on:!/[?&]icons3d=0/.test(location.search),
 url(id,thunk){if(!API.on||failed)return null;let e=CACHE.get(id);
  if(e)return e.st==='ok'?e.u:null;
  let info=null;try{info=thunk&&thunk()}catch(x){}
  if(!info||!supports(info.kind)){CACHE.set(id,{st:'no',u:null});return null}
  info.id=info.id||id;CACHE.set(id,{st:'pend',u:null,i:info});Q.push(id);if(!timer){clearTimeout(idleT);timer=setTimeout(pump,30)}return null},
 supports,hoverStart,hoverStop,stats:()=>({cached:done,pend:Q.length,ms:Math.round(ms),ctx:!!R,failed,live:!!live,mem:R?{g:R.info.memory.geometries,t:R.info.memory.textures,p:R.info.programs?R.info.programs.length:0}:null}),clear(){CACHE.clear();Q.length=0},
 // hoja de contacto para pruebas: ids → canvas (con etiquetas); `thunkOf(id)` = como el de item-icons.js
 async sheet(ids,thunkOf,cols=6,size=128){SIZE=size;if(R)R.setSize(SIZE,SIZE,false);const cs=SIZE+8,rows=Math.ceil(ids.length/cols),cv=document.createElement('canvas');cv.width=cols*cs;cv.height=rows*(cs+14);const x=cv.getContext('2d');x.fillStyle='#2a2622';x.fillRect(0,0,cv.width,cv.height);x.font='10px sans-serif';x.fillStyle='#ddd';
  for(let i=0;i<ids.length;i++){const info=thunkOf(ids[i]);let u=null;if(info&&supports(info.kind)){info.id=info.id||ids[i];u=renderOne(info)}
   const px=(i%cols)*cs+4,py=Math.floor(i/cols)*(cs+14)+2;if(u){await new Promise(r=>{const im=new Image();im.onload=()=>{x.drawImage(im,px,py);r()};im.src=u})}else{x.fillStyle='#833';x.fillRect(px,py,SIZE,SIZE);x.fillStyle='#ddd'}
   x.fillText(ids[i].slice(0,22),px,py+SIZE+11)}
  release();SIZE=128;return cv}};
window.ICON3D=API;
