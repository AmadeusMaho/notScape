// NotScape · R3D · COMPUERTA DE SHADERS (Lote ANTI-TIRONES, 25 oct 2026; pedido del dueño: «la gente que lo prueba tiene muchos tirones»).
// PROBLEMA: three.js compila el programa de un material la PRIMERA vez que lo dibuja, dentro del fotograma: con ANGLE/D3D (Windows) cada programa nuevo congela 50–350 ms
// (medido: un enemigo nuevo, su primer reflejo en el agua, una pieza de equipo…). `R3D.warmShaders` precompila lo que existe al cargar, pero no lo que nace DESPUÉS.
// SOLUCIÓN: todo objeto que se añade (Object3D.add) a una escena vigilada pasa por aquí ANTES de dibujarse: se piden sus programas con `renderer.compile` para cada destino
// que se va a usar (render target del composer o pantalla, y el plano de recorte del reflejo del agua) y, mientras la GPU los compila EN SEGUNDO PLANO
// (KHR_parallel_shader_compile, lo da Chrome/Edge/Firefox), sus mallas se ocultan con `layers.mask=0` (no las ve ni la cámara ni la sombra). Cuando todos sus programas
// dicen `isReady()`, se devuelven sus capas. Resultado: lo nuevo aparece 1–6 fotogramas más tarde en vez de congelar el juego.
// Sin la extensión, `isReady()` es siempre cierto: la compilación ocurre en el momento de añadir (igual que antes, sin ocultar nada).
// Coste: un objeto cuyo material ya está compilado para su tipo de malla se descarta con una búsqueda en un WeakMap (sin recompilar). `?gate=0` lo apaga.
// Lo que NO cubre: cambiar `o.material` a un material nuevo sin volver a añadir el objeto, y los programas de PROFUNDIDAD de la sombra (los vigila el aviso
// «[R3D] shaders compilados EN JUEGO» de game.js; si sale, añade el objeto a un `warmObjs`).
import * as THREE from 'three';

const OFF=/[?&]gate=0\b/.test(location.search);
const sig=o=>{const g=o.geometry,a=g&&g.attributes||{};return (o.isInstancedMesh?'i':'')+(o.isSkinnedMesh?'s':'')+(o.isPoints?'p':'')+(o.isSprite?'S':'')+(o.isLine?'l':'')+(a.color?'c':'')+(a.uv?'u':'')+(a.tangent?'t':'')+(g&&g.morphAttributes&&g.morphAttributes.position?'m':'')+(o.receiveShadow?'r':'')};
const drawable=o=>o.isMesh||o.isPoints||o.isLine||o.isSprite;

export class ShaderGate{
 // prime(G,v) también lo usa R3D.warmShaders (compileAsync de la escena entera para cada destino)
 constructor(){this.G=[];this.q=new Set();this.on=false;this.wait=[];this.stats={objetos:0,compilados:0,ocultos:0,esperaMax:0,hechos:0};   // hechos = programas creados por la compuerta (game.js los descuenta de su aviso «compilados EN JUEGO»)
  if(OFF)return;
  const self=this,add=THREE.Object3D.prototype.add;
  THREE.Object3D.prototype.add=function(...a){const res=add.apply(this,a);if(self.on)for(const o of a)if(o&&o.isObject3D&&o!==this)self.q.add(o);return res}}
 // r = renderer, scene = escena raíz vigilada, cam = su cámara, variants = ()=>[{rt, clip}] destinos de dibujo en uso (rt null = pantalla; clip = array de planos o null)
 watch(r,scene,cam,variants){if(OFF)return;r.debug.checkShaderErrors=/[?&]shaderdebug\b/.test(location.search);   // sin el chequeo, el primer uso de un programa no lee sus registros (lectura SÍNCRONA a la GPU)
  this.G.push({r,scene,cam,variants,seen:new WeakMap()})}
 tick(now){if(OFF)return;
  if(this.q.size){const by=new Map();
   for(const o of this.q){let root=o;while(root.parent)root=root.parent;const G=this.G.find(x=>x.scene===root);if(!G)continue;
    let L=by.get(G);if(!L)by.set(G,L=[]);o.traverse(m=>{if(!drawable(m)||!m.material)return;const k=sig(m);let need=false;
     for(const mt of Array.isArray(m.material)?m.material:[m.material]){let s=G.seen.get(mt);if(!s)G.seen.set(mt,s=new Set());if(!s.has(k)){s.add(k);need=true}}
     if(need)L.push(m)})}
   this.q.clear();
   for(const [G,L] of by)if(L.length)this.compile(G,L,now)}
  if(this.bgq&&!this.wait.length)this.bgStep();
  if(this.wait.length){for(let i=this.wait.length-1;i>=0;i--){const w=this.wait[i];
    if(now-w.t0>4000||w.progs.every(p=>!p||p.isReady())){w.objs.forEach(([m,mask])=>{if(m.layers.mask===0)m.layers.mask=mask});this.stats.esperaMax=Math.max(this.stats.esperaMax,Math.round(now-w.t0));this.wait.splice(i,1)}}}}
 compile(G,L,now){const r=G.r,rt0=r.getRenderTarget(),cp0=r.clippingPlanes,P=r.properties,progs=new Set(),n0=r.info.programs.length;
  const fake={traverse(f){for(const m of L)f(m)},traverseVisible(){}};   // compile() solo recorre esta lista (no la escena entera); las luces salen de G.scene
  try{for(const v of G.variants()){this.prime(G,v,cp0);r.compile(fake,G.cam,G.scene);
    for(const m of L)for(const mt of Array.isArray(m.material)?m.material:[m.material]){const p=P.get(mt).currentProgram;if(p)progs.add(p)}}}
  catch(e){console.warn('[R3D compuerta]',e)}
  r.setRenderTarget(rt0);r.clippingPlanes=cp0;this.stats.objetos+=L.length;if(G.r===this.G[0].r)this.stats.hechos+=r.info.programs.length-n0;
  const pend=[...progs].filter(p=>!p.isReady());if(!pend.length)return;this.stats.compilados+=pend.length;
  const objs=[];for(const m of L)if(m.layers.mask!==0){objs.push([m,m.layers.mask]);m.layers.mask=0}
  this.stats.ocultos+=objs.length;this.wait.push({t0:now,progs:pend,objs})}
 // OJO (three r170): compile() NO aplica r.clippingPlanes (el nº de planos lo fija render() con clipping.init); sin esto el programa del REFLEJO del agua no salía igual y
 // se volvía a compilar en Water.reflect (medido). Un render vacío a un RT de 1×1 deja el estado de recorte del destino `v` y luego se apunta a su render target.
 prime(G,v,cp0){const r=G.r;if(!G.tiny){G.tiny=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType});G.empty=new THREE.Scene()}
  const nu=r.shadowMap.needsUpdate;r.clippingPlanes=v.clip||cp0;r.setRenderTarget(G.tiny);r.render(G.empty,G.cam);r.shadowMap.needsUpdate=nu;r.setRenderTarget(v.rt||null)}
 // PRECALENTADO DE FONDO: tras la carga solo se compilaron los destinos de la calidad ACTUAL (carga más corta); los demás (`rest`, p. ej. la pantalla sin composer de
 // Baja/Mínima o el reflejo del agua de Máxima/Alta) se piden aquí poco a poco (BG_N objetos por fotograma, la GPU los compila en paralelo) para que un cambio de calidad
 // —también el automático— no congele el juego. `G` = grupo vigilado; `rest` = lista de destinos {rt, clip}.
 background(G,rest){if(OFF||!rest.length)return;this.bgq={G:this.G[G]||G,rest,list:null,i:0,vi:0,seen:rest.map(()=>new WeakMap())}}
 bgStep(){const B=this.bgq,G=B.G,r=G.r,BG_N=350;
  if(!B.list){B.list=[];const lt=[];G.scene.traverse(o=>{if(drawable(o)&&o.material)B.list.push(o)});G.scene.traverseVisible(o=>{if(o.isLight)lt.push(o)});
   const s=G.scene;B.ls={isScene:true,fog:s.fog,environment:s.environment,environmentRotation:s.environmentRotation,traverseVisible(f){lt.forEach(f)}}}   // «escena» de solo luces: compile() no recorre los 17 000 objetos en cada tanda
  const v=B.rest[B.vi],seen=B.seen[B.vi],L=[];
  for(;B.i<B.list.length&&L.length<BG_N;B.i++){const m=B.list[B.i];if(!m.parent)continue;const k=sig(m);let need=false;
   for(const mt of Array.isArray(m.material)?m.material:[m.material]){let s=seen.get(mt);if(!s)seen.set(mt,s=new Set());if(!s.has(k)){s.add(k);need=true}}if(need)L.push(m)}
  if(L.length){const rt0=r.getRenderTarget(),cp0=r.clippingPlanes,n0=r.info.programs.length;try{this.prime(G,v,cp0);r.compile({traverse(f){for(const m of L)f(m)},traverseVisible(){}},G.cam,B.ls)}catch(e){console.warn('[R3D compuerta fondo]',e)}r.setRenderTarget(rt0);r.clippingPlanes=cp0;if(G===this.G[0])this.stats.hechos+=r.info.programs.length-n0}
  if(B.i>=B.list.length){B.i=0;B.vi++;if(B.vi>=B.rest.length){this.bgq=null;console.info('[R3D shaders] precalentado de fondo terminado',{programas:r.info.programs.length})}}}
}
