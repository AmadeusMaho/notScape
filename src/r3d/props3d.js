// NotScape · R3D · F2-A · PROPS ESTÁTICOS EN 3D (casas, farolas, vallas, barriles, pozos, puestos… = PROPS.list de props.js).
// Q03 (18 oct 2026): 10 modelos salen de propsdark3d.js (darkGeo, estilo oscuro; ?props=old los desactiva); el resto, del catálogo 2D. Las mallas salen del catálogo 2D ya existente: ORG.capture(() => ORG.U[n](ctxFalso,0,0,0,o)) con el tema de la aldea y el espejo (o.rot), igual que
// PROPS.bake → tools/r3d/org3d_adapter.mjs (orgGeometry). Se agrupan por modelo+opciones+tema y se dibujan INSTANCIADAS (una llamada por modelo
// distinto + su contorno), con sombras reales y musgo en la base. Contorno de escenario fino y del color del objeto oscurecido (guía §4.3).
// Para el héroe (que se dibuja aparte, ver r3d.js) se exporta una copia «solo profundidad» de todo (capa 3): así una casa delante lo tapa y se ve
// su silueta en rayos X. Si PROPS.list cambia (editor de aldea), se reconstruye solo.
import * as THREE from 'three';
import {toon,hull,inkFor,depthI} from './materials3d.js';
import {orgGeometry,EMIT} from '../../tools/r3d/org3d_adapter.mjs';
import {deadTreeGeo,treeGeo,cardGeo,folMat} from './nature3d.js';
import {darkGeo} from './propsdark3d.js';   // Q03 (F2-C): props de aldea en el lenguaje oscuro (casa, taberna, granero, cabaña, pozo, farola, barril, caja, heno, valla); el resto sigue con ORG. `?props=old` los desactiva (comparar)
// R3D-TG-SUAVE (20 oct 2026): sombreado continuo (sin las 3 bandas toon) y bump más suave en props y rocas; `?soft=0` = como antes. Las rocas pierden además la textura procedural de grietas (ruido de píxeles).
const SOFT=!/[?&]soft=0/.test(location.search);
const DARK_ON=!/[?&]props=old\b/.test(location.search);
// Fase 4 (20 oct 2026): NATURALEZA oscura por bioma (roca, piedra, arbusto, tocón, seta, tronco, huesos, charco, carpa) → propsdark_nat3d.js. `?nat=old` (o `?props=old`) la desactiva para comparar.
// Cada instancia recibe `bk` (bioma donde está) para elegir paleta y forma, y un giro/escala propios (NAT_INST) en su matriz: variedad sin mallas ni draw calls nuevos.
import {natGeo,NAT_NAMES,NAT_INST,NAT_VAR,initNat} from './propsdark_nat3d.js';
initNat({treeGeo,cardGeo});   // Fase 4b: arbustos y pinos enanos con las láminas de los árboles (nature3d.js)
// Fase 5 (20 oct 2026): molino, iglesia (4 estilos) y 25 props de oficio/aldea/ruina en oscuro (propsdark_pradera3d.js). `?pr=old` (o `?props=old`) lo desactiva. Reciben `bk` (bioma) como la naturaleza.
import {praderaGeo,PR_NAMES,PR_BK} from './propsdark_pradera3d.js';
const PR_ON=DARK_ON&&!/[?&]pr=old\b/.test(location.search),PRS=new Set(PR_NAMES);
// Fase 5b (20 oct 2026): estaciones (banco, tienda, horno, yunque, taller, escritorio, armero, curtidor, altar, tablón, fogata) y props sueltos (lanzas, tótem, arco en ruinas, brasero, tinajas, monumento) en oscuro.
// `propsdark_estaciones3d.js`; las estaciones llegan con `{arch:k}` desde stations3d.js. `?st=old` (o `?props=old`) lo desactiva.
import {ofGeo,OF_NAMES,OF_BK} from './propsdark_estaciones3d.js';
const OF_ON=DARK_ON&&!/[?&]st=old\b/.test(location.search),OFS=new Set(OF_NAMES);
const NAT_ON=DARK_ON&&!/[?&]nat=old\b/.test(location.search),NATS=new Set(NAT_NAMES);
// Fase 7 (20 oct 2026): BOSQUE de los guardianes en oscuro (cabañas de troncos con 5 variantes, casa en el árbol con copa de láminas, leñera por bioma y taberna del Bosque) → propsdark_bosque3d.js.
// `?bo=old` (o `?props=old`) lo desactiva para comparar. La taberna solo se rehace con bk 1; `lenera` recibe `bk` y sigue la tabla ARQ de los 9 biomas.
import {bosqueGeo,initBosque,BO_NAMES,BO_BK} from './propsdark_bosque3d.js';
initBosque({cardGeo});
const BO_ON=DARK_ON&&!/[?&]bo=old\b/.test(location.search),BOS=new Set(BO_NAMES);
// ISLA-3 (21 oct 2026): arquitectura GRIEGA de MÁRMOL del Cielo (propsdark_cielo3d.js). Material de las rocas (sombreado continuo, sin textura procedural); `?ci=old` los desactiva (caen al ORG genérico).
import {cieloGeo,CI_NAMES,CI_ROCK} from './propsdark_cielo3d.js';
const CI_ON=DARK_ON&&!/[?&]ci=old/.test(location.search),CIS=new Set(CI_NAMES);
const nhash=(a,b,c)=>{const h=Math.sin(a*127.1+b*311.7+c*74.7)*43758.5453;return h-Math.floor(h)};

const FAKE=new Proxy({},{get:(t,k)=>k in t?t[k]:(/^create(Linear|Radial)Gradient$/.test(k)?()=>({addColorStop(){}}):k==='measureText'?()=>({width:10}):k==='getImageData'?()=>({data:new Uint8ClampedArray(4)}):k==='canvas'?{width:1,height:1}:()=>{}),set:(t,k,v)=>{t[k]=v;return true}});
const GEO=new Map(),CELL=24;
// R3D-ESCALA-2: todos los props se escalan ×PK (props.js `PROP_K`, `?pk=`). Los modelos ORG de edificios ya vienen ×ORG.HK del 2D (V5): se divide para no duplicar. El árbol seco es naturaleza: no se escala.
const HOUSE_ORG=/^(casa|troncos|cabana|palafito|casaJp|casaMaya|casaLarga|salon|stabbur|taberna|casaArbol)$/;
const scaleOf=(n,G)=>{const PK=window.PROP_K||1;if(n==='arbolSeco')return 1;return G.key.startsWith('dk:')?PK:PK/(HOUSE_ORG.test(n)?(ORG.HK||1):1)};
export function propGeo(n,o,th){const key=n+'|'+JSON.stringify(o||{})+'|'+(th?JSON.stringify(th):'');if(GEO.has(key))return GEO.get(key);let g=null;
 if(n==='arbolSeco'){g=deadTreeGeo(o&&o.rot?2:1);const c=new THREE.Color('#3a2f2a'),C=new Float32Array(g.attributes.position.count*3);for(let i=0;i<C.length;i+=3){C[i]=c.r;C[i+1]=c.g;C[i+2]=c.b}g.setAttribute('color',new THREE.BufferAttribute(C,3));g.setAttribute('aEmit',new THREE.BufferAttribute(new Float32Array(C.length/3),1));GEO.set(key,{g,key});return GEO.get(key)}   // árbol seco rehecho (guía §4.5)
 if(BO_ON&&BOS.has(n)){const D=bosqueGeo(n,o,th);if(D){GEO.set(key,D);return D}}
 if(CI_ON&&CIS.has(n)){const D=cieloGeo(n,o,th);if(D){GEO.set(key,D);return D}}
 if(DARK_ON){const D=darkGeo(n,o,th);if(D){GEO.set(key,D);return D}}
 if(NAT_ON&&NATS.has(n)){const D=natGeo(n,o,th);if(D){GEO.set(key,D);return D}}
 if(PR_ON&&PRS.has(n)){const D=praderaGeo(n,o,th);if(D){GEO.set(key,D);return D}}
 if(OF_ON&&OFS.has(n)){const D=ofGeo(n,o,th);if(D){GEO.set(key,D);return D}}
 try{const parts=ORG.capture(()=>{ORG.theme(th||null);ORG.rot(!!(o&&o.rot));try{ORG.U[n](FAKE,0,0,0,o||{})}finally{ORG.theme(null);ORG.rot(false)}});
  if(parts.length){g=orgGeometry(THREE,parts,n==='santuario'?{seed:n.length,emit:{...EMIT,'#7ad0ff':3}}:{seed:n.length});   // F3f·P6: la gema del santuario es aEmit=3 (brillo normal de fuego × uShrK, que baja cuando el héroe se acerca)
  g.computeBoundingBox();g.computeBoundingSphere()}}catch(e){console.warn('[R3D props]',n,e)}
 GEO.set(key,g?{g,key}:null);return GEO.get(key)}

// OPT-RENDIMIENTO (22 oct 2026): los sectores son ESTÁTICOS (matrices de mundo = identidad, las posiciones van en instanceMatrix): three ya no los recorre en updateMatrixWorld (antes ≈ 62 000 nodos visitados por fotograma entre la escena y la del héroe, ~2–3 ms de CPU).
const NOUMW=function(){};
export class Props{
 constructor(scene,occScene,W3){this.scene=scene;this.occ=occScene;this.W3=W3;this.grp=new THREE.Group();this.grp.name='props3d';scene.add(this.grp);this.ogrp=new THREE.Group();occScene.add(this.ogrp);this.grp.matrixAutoUpdate=this.ogrp.matrixAutoUpdate=false;
  this.mat=toon('#ffffff',SOFT?{vc:1,moss:.7,emit:1,tex:'auto',texS:7,texB:.14,texA:.65,soft:1}:{vc:1,moss:.7,emit:1,tex:'auto',texS:7,texB:.45});this.matRock=toon('#ffffff',SOFT?{vc:1,moss:.7,emit:1,soft:1}:{vc:1,moss:.7,emit:1,tex:'auto',texS:7,texB:.45});this.ink=inkFor('#6a5a52');this.dmat=new THREE.MeshBasicMaterial({colorWrite:false});this.sig='';this.on=false;this.boxes=[]}
 sign(){const L=PROPS.list;return L.length+'|'+(L[0]?L[0].x+','+L[0].y:'')+'|'+(L.length?L[L.length-1].n+L[L.length-1].x:'')}
 update(){const s=this.sign();if(s!==this.sig){this.sig=s;this.gen=this.buildGen()}if(this.gen&&!Props.DEFER){while(!this.gen.next().done);this.gen=null}}

 // Fase 49a (rendimiento): las mallas se reparten en SECTORES de 4×4 celdas; `cull` oculta los sectores lejanos (three salta el subárbol entero: sin cull de frustum ni sombras por malla).
 sec(parent,cx,cy){const M=parent.userData.sec||(parent.userData.sec=new Map()),sx=Math.floor(cx/4),sy=Math.floor(cy/4),k=sx*1000+sy;let g=M.get(k);if(!g){g=new THREE.Group();g.matrixAutoUpdate=false;g.matrixWorldAutoUpdate=false;g.updateMatrixWorld=NOUMW;const S=4*CELL*32;g.userData.c=this.W3((sx+.5)*S,(sy+.5)*S,0);parent.add(g);M.set(k,g)}return g}
 cull(tx,tz,r){if(!this.gen){this.stream(tx,tz,r,this.fresh);this.fresh=false}const R=r+4*CELL*.72+14;for(const par of [this.grp,this.ogrp]){const M=par.userData.sec;if(!M)continue;M.forEach(g=>{const c=g.userData.c;g.visible=Math.hypot(c.x-tx,c.z-tz)<R})}}
 // E2 (26 oct 2026, streaming por sector): `buildGen` solo deja los datos (grupos por sector); las mallas de un sector se crean en `stream` al entrar en el radio visible y se liberan al alejarse (objetos de escena independientes del tamaño del mundo).
 mk(S){const o3=new THREE.Object3D();
  for(const {G,list,s:PS,cx,cy,isRock} of S.gr){const n=list.length,m=depthI(new THREE.InstancedMesh(G.g,isRock?this.matRock:this.mat,n));m.castShadow=m.receiveShadow=true;
   const h=new THREE.InstancedMesh(G.hull,this.ink,n),d=new THREE.InstancedMesh(G.g,this.dmat,n);d.layers.set(3);
   const fo=G.cards?new THREE.InstancedMesh(G.cards.g,folMat(G.cards.tex),n):null;if(fo){fo.castShadow=true;fo.receiveShadow=false}   // follaje de láminas (Fase 4b): mismas matrices, sin contorno
   const NI=NAT_ON&&G.key.startsWith('dk:nat:')?NAT_INST[G.key.slice(7,G.key.indexOf('|'))]:null;
   list.forEach((e,i)=>{const p=this.W3(e.x,e.y,((typeof PROPS!=='undefined'&&PROPS.ELEV&&PROPS.ELEV[e.n]&&TER.baseZ)||TER.standZ)(e.x,e.y));o3.position.copy(p);   /* los props con plataforma propia (ELEV) van sobre el TERRENO (baseZ, sin elevación) y los demás sobre standZ */
    if(NI){const u=NI[1]+(NI[2]-NI[1])*nhash(e.x,e.y,1),sy=u*(1+(nhash(e.x,e.y,3)-.5)*2*NI[3]);o3.rotation.y=NI[0]?nhash(e.x,e.y,2)*Math.PI*2:0;o3.scale.set(PS*u,PS*sy,PS*u)}else{o3.rotation.y=0;o3.scale.setScalar(PS)}
    o3.updateMatrix();m.setMatrixAt(i,o3.matrix);h.setMatrixAt(i,o3.matrix);d.setMatrixAt(i,o3.matrix);if(fo)fo.setMatrixAt(i,o3.matrix)});
   [m,h,d].concat(fo?[fo]:[]).forEach(x=>{x.instanceMatrix.needsUpdate=true;x.computeBoundingSphere();x.matrixAutoUpdate=false;x.matrixWorldAutoUpdate=false});this.sec(this.grp,cx,cy).add(m,h);if(fo)this.sec(this.grp,cx,cy).add(fo);this.sec(this.ogrp,cx,cy).add(d)}
  this.built.add(S.sk);if(this.onSec)this.onSec()}
 rm(S){for(const par of [this.grp,this.ogrp]){const M=par.userData.sec,g=M&&M.get(S.sk);if(g){g.children.forEach(o=>o.dispose&&o.dispose());par.remove(g);M.delete(S.sk)}}this.built.delete(S.sk);if(this.onSec)this.onSec()}
 stream(tx,tz,r,all){if(!this.sd)return 0;const R=r+4*CELL*.72+14+6,U=R+60;let nb=0,lim=all?1e9:2;
  this.sd.forEach(S=>{if(!this.built.has(S.sk)&&Math.hypot(S.c.x-tx,S.c.z-tz)<4*CELL*.72+10)lim=1e9});
  this.sd.forEach(S=>{const d=Math.hypot(S.c.x-tx,S.c.z-tz);if(this.built.has(S.sk)){if(d>U)this.rm(S)}else if(d<R&&nb<lim){this.mk(S);nb++}});return nb}
 // R3D-FIX-CARGA (20 oct 2026): construir los 18 000 props de golpe bloqueaba el navegador ~1 s al cargar. `buildGen` es el mismo `build` como GENERADOR (cede cada ~64 props / 32 grupos); `build()` lo agota de golpe (herramientas, editor)
 // y `update()` lo agota también salvo que `Props.DEFER` esté activo: entonces lo reparte `warm(ms)` (lo llama bootRun de game.js entre fotogramas de la pantalla de carga).
 build(){const g=this.buildGen();while(!g.next().done);}
 warm(ms){const s=this.sign();if(s!==this.sig){this.sig=s;this.gen=this.buildGen()}if(!this.gen)return 1;const t0=performance.now();while(performance.now()-t0<ms){if(this.gen.next().done){this.gen=null;return 1}}return Math.min(.99,this.prog||0)}
 *buildGen(){const T0=performance.now();this.prog=0;this.fp=[];this.fpVer=(this.fpVer||0)+1;[this.grp,this.ogrp].forEach(g=>{while(g.children.length){const c=g.children.pop();c.dispose&&c.dispose()}g.userData.sec=null});
  const groups=new Map(),o3=new THREE.Object3D();let ok=0,fail=0,TG=0,TH=0;
  let nn=0;const NL=Math.max(1,PROPS.list.length);
  for(const e of PROPS.list){if((++nn&63)===0){this.prog=nn/NL*.5;yield}const T1=performance.now(),k=e.k!=null?e.k:Math.max(0,BIOMES.at(e.x,e.y)),th=BIOMES.list[k]&&BIOMES.list[k].village.theme||null,G=propGeo(e.n,NAT_ON&&NATS.has(e.n)?Object.assign({bk:k,v:NAT_VAR[e.n]?Math.floor(nhash(e.x,e.y,5)*NAT_VAR[e.n]):0},e.o):PR_ON&&PR_BK.has(e.n)||OF_ON&&OF_BK.has(e.n)||BO_ON&&BO_BK.has(e.n)?Object.assign({bk:k},e.o):e.o,th);TG+=performance.now()-T1;if(!G){fail++;continue}
   const ck=G.key+'@'+Math.floor(e.x/(32*CELL))+','+Math.floor(e.y/(32*CELL));let a=groups.get(ck);if(!a)groups.set(ck,a={G,list:[],s:scaleOf(e.n,G),cx:Math.floor(e.x/(32*CELL)),cy:Math.floor(e.y/(32*CELL))});a.list.push(e);ok++}   // por modelo Y por zona de CELL×CELL tiles: así se descartan las zonas fuera de cámara
  this.sd=new Map();this.built=new Set();let gg=0;const NG=Math.max(1,groups.size);for(const gr of groups.values()){if((++gg&31)===0){this.prog=.5+gg/NG*.5;yield}const {G,list,s:PS,cx,cy}=gr,isRock=NAT_ON&&(list[0].n==='roca'||list[0].n==='piedra'||list[0].n==='bocaCueva')||CI_ON&&CI_ROCK.has(list[0].n);gr.isRock=isRock;
   const T2=performance.now();if(!G.hull)G.hull=hull(G.g,isRock?.012:.016).geometry;TH+=performance.now()-T2;
   {const bb=G.g.boundingBox;if(bb&&bb.max.y>.25){const sx=Math.max(.3,(bb.max.x-bb.min.x)*.5*1.35*PS),sz=Math.max(.3,(bb.max.z-bb.min.z)*.5*1.35*PS),cx=(bb.max.x+bb.min.x)*.5*PS,cz=(bb.max.z+bb.min.z)*.5*PS;list.forEach(e=>this.fp.push({x:e.x,y:e.y,cx,cz,sx:Math.min(sx,4),sz:Math.min(sz,4),h:bb.max.y*PS,n:e.n}))}}   // F3f·P3A: huella de la malla para la sombra de contacto (contact3d.js)
   const sx=Math.floor(cx/4),sy=Math.floor(cy/4),sk=sx*1000+sy;let S=this.sd.get(sk);if(!S)this.sd.set(sk,S={sk,gr:[],c:this.W3((sx+.5)*4*CELL*32,(sy+.5)*4*CELL*32,0)});S.gr.push(gr)}
  this.fresh=true;
  this.on=ok>0;this.stats={grupos:groups.size,modelos:GEO.size,props:ok,sinMalla:fail,ms:Math.round(performance.now()-T0),msGeo:Math.round(TG),msHull:Math.round(TH)};console.info('[R3D props]',this.stats)}
}
