// NotScape · R3D · F2 (cierre) · ESTACIONES y PUNTOS DE INTERÉS (cofres, santuarios) EN 3D.
// Igual que props3d.js: la malla sale del modelo ORG.U (propGeo) con el tema del bioma. Son pocas entidades, así que cada una es una Mesh propia
// (con contorno y copia de solo profundidad para el héroe, capa 3). Estaciones: PROPS.ST[id].n (sin 'ru', sin 'door'/'exit', sin las de interior).
// PO: n = cofre | cofreAbierto | santuario (o = {col,used}); se reconstruyen si cambia su estado. Horno: dos mallas (on/off) que se alternan.
// Fogata: llamas 3D animadas (conos emisivos). Resalte bajo el puntero: copia aditiva (como Resources).
// Los marcadores/etiquetas («!», nombre) siguen en 2D (game.js dS). Las fachadas de las puertas (porche, medallón, anillo) YA NO EXISTEN en 3D: ver DoorGlow al final (R3D-F2C-PUERTAS).
import * as THREE from 'three';
import {hull,inkFor} from './materials3d.js';
import {propGeo} from './props3d.js';
import {DOOR_AT as DOOR_AT0} from './propsdark3d.js';
import {PR_DOOR,PR_DOORY} from './propsdark_pradera3d.js';   // Fase 5: puertas del molino y las iglesias
import {BO_DOOR} from './propsdark_bosque3d.js';   // Fase 7: puertas de las cabañas de troncos y de la taberna del Bosque (clave `taberna@1` = solo en el bioma 1)
const DOOR_AT=Object.assign({},DOOR_AT0,PR_DOOR,BO_DOOR);
import {G as GU} from './materials3d.js';

export class Stations{
 constructor(scene,occScene,W3,mat,ink){this.scene=scene;this.W3=W3;this.mat=mat;this.ink=ink;this.grp=new THREE.Group();this.grp.name='estaciones3d';scene.add(this.grp);
  this.ogrp=new THREE.Group();occScene.add(this.ogrp);this.dmat=new THREE.MeshBasicMaterial({colorWrite:false});this.sig='';this.on=false;this.poOn=false;this.ent=new Map();this.flames=[];
  this.hlMat=new THREE.MeshBasicMaterial({color:'#fff0c8',transparent:true,opacity:.28,blending:THREE.AdditiveBlending,depthWrite:false});this.hl=new THREE.Group();scene.add(this.hl);this.hlE=null;
  this.fm=[new THREE.MeshBasicMaterial({color:'#ff7a1a',transparent:true,opacity:.92,depthWrite:false}),new THREE.MeshBasicMaterial({color:'#ffd23a',transparent:true,opacity:.95,depthWrite:false})]}
 theme(k){const b=BIOMES.list[k];return b&&b.village&&b.village.theme||null}
 stList(){return ST.filter(e=>PROPS.ST[e.id]&&PROPS.ST[e.id].n&&e.id!=='ru'&&!e.inroom&&!e.nodraw)}
 sign(){let h=0;const s=this.stList();s.forEach(e=>h+=e.x*.37+e.y*.11);PO.forEach(e=>h+=e.x*.13+e.y*.29+e.n.length*7+(e.o&&e.o.used?5:0));return s.length+'|'+PO.length+'|'+h.toFixed(1)}
 mesh(G,e,vis){const g=new THREE.Group(),m=new THREE.Mesh(G.g,this.mat);m.castShadow=m.receiveShadow=true;if(!G.hull)G.hull=hull(G.g,.016).geometry;const h=new THREE.Mesh(G.hull,this.ink),d=new THREE.Mesh(G.g,this.dmat);d.layers.set(3);
  g.add(m,h);g.position.copy(this.W3(e.x,e.y,TER.standZ(e.x,e.y)));g.visible=vis!==false;g.updateMatrixWorld(true);d.position.copy(g.position);d.updateMatrix();this.ogrp.add(d);d.userData.owner=g;return{g,d,G}}
 build(){[this.grp,this.ogrp].forEach(x=>{while(x.children.length)x.remove(x.children[0])});this.ent.clear();this.flames=[];this.hl.clear();this.hlE=null;
  const add=(e,vars)=>{const list=vars.map(([G,vis,tag])=>{const r=this.mesh(G,e,vis);r.tag=tag;this.grp.add(r.g);return r});this.ent.set(e,{list,e})};
  let ns=0,np=0;
  for(const e of this.stList()){const k=e.k!=null?e.k:Math.max(0,BIOMES.at(e.x,e.y)),th=this.theme(k),n=PROPS.ST[e.id].n;
   const vars=e.id==='furnace'?[[propGeo(n,{arch:k,on:false},th),true,'off'],[propGeo(n,{arch:k,on:true},th),false,'on']]:[[propGeo(n,{arch:k},th),true,'']];
   if(vars.some(v=>!v[0]))continue;add(e,vars);ns++;
   if(e.id==='fire'){const g=new THREE.Group();for(let i=0;i<3;i++){const c=new THREE.Mesh(new THREE.ConeGeometry(.07-i*.008,.34,6).translate(0,.17,0),this.fm[i===1?1:0]);c.position.set((i-1)*.09,.08,(i%2)*.04);g.add(c)}g.position.copy(this.W3(e.x,e.y,TER.standZ(e.x,e.y)));this.grp.add(g);this.flames.push({g,e})}}
  for(const e of PO){const k=e.k!=null?e.k:Math.max(0,BIOMES.at(e.x,e.y)),G=propGeo(e.n,e.o,this.theme(k));if(!G)continue;add(e,[[G,true,'']]);np++}
  this.on=ns>0;this.poOn=np>0;console.info('[R3D estaciones]',{estaciones:ns,poi:np,llamas:this.flames.length})}
 update(now,t,hov,act){const s=this.sign();if(s!==this.sig){this.sig=s;this.build()}
  this.ent.forEach(r=>{if(r.e.id==='furnace'){const on=act===r.e;r.list.forEach(x=>{const v=x.tag==='on'?on:!on;x.g.visible=v;x.d.visible=v})}});
  this.flames.forEach(({g,e})=>{const on=typeof CK!=='undefined'&&CK&&S.stn===e,k=on?1.5:1;g.children.forEach((c,i)=>{c.scale.set(1,k*(.8+.3*Math.sin(t*14+i*2)),1)})});
  const he=hov&&this.ent.has(hov)?hov:null;if(he!==this.hlE){this.hlE=he;this.hl.clear();if(he){const r=this.ent.get(he);r.list.forEach(x=>{if(!x.g.visible&&x.tag)return;const m=new THREE.Mesh(x.G.g,this.hlMat);m.renderOrder=3;m.position.copy(x.g.position);this.hl.add(m);
     const h=new THREE.Mesh(x.G.hull,new THREE.MeshBasicMaterial({color:'#ffe9b0',side:THREE.BackSide}));h.position.copy(x.g.position);h.scale.setScalar(1.02);this.hl.add(h)})}}}
}

// ═══ PUERTAS DE ENTRADA A INTERIORES (R3D-F2C-PUERTAS, 18 oct 2026) ═══
// Antes había una «fachada» 3D (porche, objetos de oficio, anillo y medallón flotante) que no casaba con el estilo oscuro y limitaba el diseño de los props de cada bioma.
// Ahora la entrada es SOLO la puerta del propio edificio, que se ilumina un poco: un halo ámbar sobre la puerta (quad aditivo con degradado) + un charco de luz en el suelo.
// Intensidad por estado (constantes GLOW): reposo → cerca del héroe (< NEAR px) → puntero encima (hover). De noche se ve más (uNight), de día queda sutil. Sin mallas, sin contorno, sin luces puntuales (no gasta el pool de 4).
// Dónde cae el brillo: modelo oscuro → su puerta real (DOOR_AT de propsdark3d.js, con la rotación de la casa); modelo ORG (pastel) → el punto ST de la puerta (la pared queda 14 px detrás).
// `facOn` (R3D.facOn) sigue existiendo: game.js lo usa para NO pintar el anillo 2D de dDoor cuando el 3D está activo.
export const GLOW={idle:.1,near:.55,hover:.9,NEAR:90,k:7};
function glowTex(){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,2,32,32,31);r.addColorStop(0,'rgba(255,196,110,1)');r.addColorStop(.35,'rgba(255,160,70,.55)');r.addColorStop(1,'rgba(255,130,40,0)');g.fillStyle=r;g.fillRect(0,0,64,64);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
export class DoorGlow{
 constructor(scene,W3){this.scene=scene;this.W3=W3;this.grp=new THREE.Group();this.grp.name='puertas3d';scene.add(this.grp);this.sig='';this.on=false;this.items=[];this.tex=glowTex();this.last=0;
  this.dark=!/[?&]props=old\b/.test(location.search);
  this.mat=()=>new THREE.MeshBasicMaterial({map:this.tex,color:'#ffb668',transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2})}
 list(){return typeof ST==='undefined'?[]:ST.filter(e=>e.id==='door'&&e.room)}
 sign(){let h=0;const l=this.list();l.forEach(e=>h+=e.x*.31+e.y*.17+(e.rot?3:0));return l.length+'|'+h.toFixed(1)}
 // centro de la puerta en tiles-mundo (x,z) + su ancho/alto, y si la cara mira a +x (rot)
 doorOf(e){const rot=!!e.rot,D=this.dark&&(DOOR_AT[e.hn+'@'+e.k]||DOOR_AT[e.hn]),B=typeof BI!=='undefined'?BI[e.k]:null,p=e.hp;
  if(D&&B&&p){const K=window.PROP_K||1,ox=B.ox+p.x,oy=B.oy+p.y,lx=(rot?D.z:D.x)*K,lz=(rot?D.x:D.z)*K;return{x:ox/32+lx,z:oy/32+lz,w:D.w*K,h:D.h*K,rot,wx:ox,wy:oy,dark:1,dy:((e.hn==='iglesia'&&PR_DOORY[(p.o&&p.o.style)||'piedra'])||0)*K}}   // mismo giro que swapXZ en darkGeo: (x,z)→(z,x)
  return{x:e.x/32+(rot?-14/32+.05:0),z:e.y/32+(rot?0:-14/32+.05),w:.42,h:.62,rot,wx:e.x,wy:e.y,dark:0}}
 build(){while(this.grp.children.length){const c=this.grp.children.pop();c.geometry&&c.geometry.dispose();c.material&&c.material.dispose()}this.items=[];
  for(const e of this.list()){const d=this.doorOf(e),y0=this.W3(d.wx,d.wy,TER.standZ(d.wx,d.wy)).y,wall=new THREE.Mesh(new THREE.PlaneGeometry(1,1),this.mat()),floor=new THREE.Mesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),this.mat());
   wall.scale.set(d.w*2.3,d.h*1.55,1);floor.scale.set(d.w*3.2,1,1.05);wall.renderOrder=floor.renderOrder=2;
   const out=d.dark?.15:.06,fx=d.rot?1:0,fz=d.rot?0:1;   // «hacia fuera» = +x con rot, +z sin rot
   wall.position.set(d.x+fx*out,y0+(d.dy||0)+d.h*.5+.06,d.z+fz*out);floor.position.set(d.x+fx*.62,y0+(d.dy||0)+.07,d.z+fz*.62);
   if(d.rot){wall.rotation.y=Math.PI/2;floor.rotation.y=Math.PI/2}
   this.grp.add(wall,floor);this.items.push({e,wall,floor,v:GLOW.idle})}
  this.on=this.items.length>0;console.info('[R3D puertas]',{puertas:this.items.length,oscuras:this.items.filter(i=>this.dark&&(DOOR_AT[i.e.hn+'@'+i.e.k]||DOOR_AT[i.e.hn])).length})}
 update(now,t,hov){const s=this.sign();if(s!==this.sig){this.sig=s;this.build()}
  const dt=Math.min(.1,Math.max(0,(now-this.last)/1000)||.016);this.last=now;const kk=1-Math.exp(-dt*GLOW.k),night=GU.uNight?GU.uNight.value:0,gain=.55+.45*night;
  this.items.forEach(it=>{const e=it.e,near=typeof P!=='undefined'&&Math.hypot(P.x-e.x,P.y-e.y)<GLOW.NEAR,tg=(hov===e?GLOW.hover:near?GLOW.near:GLOW.idle)*(1+.07*Math.sin(t*2.4+e.x*.01));
   it.v+=(tg-it.v)*kk;const o=Math.max(0,it.v*gain);it.wall.material.opacity=o;it.floor.material.opacity=o*.8;it.wall.visible=it.floor.visible=o>.004})}
}
