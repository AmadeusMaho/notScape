// NotScape · R3D · F2 (cierre) · ESTACIONES y PUNTOS DE INTERÉS (cofres, santuarios) EN 3D.
// Igual que props3d.js: la malla sale del modelo ORG.U (propGeo) con el tema del bioma. Son pocas entidades, así que cada una es una Mesh propia
// (con contorno y copia de solo profundidad para el héroe, capa 3). Estaciones: PROPS.ST[id].n (sin 'ru', sin 'door'/'exit', sin las de interior).
// PO: n = cofre | cofreAbierto | santuario (o = {col,used}); se reconstruyen si cambia su estado. Horno: dos mallas (on/off) que se alternan.
// Fogata: llamas 3D animadas (conos emisivos). Resalte bajo el puntero: copia aditiva (como Resources).
// Los marcadores/etiquetas («!», nombre) siguen en 2D (game.js dS). Las fachadas (facades.js) se portan en otra entrega.
import * as THREE from 'three';
import {hull,inkFor} from './materials3d.js';
import {propGeo} from './props3d.js';

export class Stations{
 constructor(scene,occScene,W3,mat,ink){this.scene=scene;this.W3=W3;this.mat=mat;this.ink=ink;this.grp=new THREE.Group();this.grp.name='estaciones3d';scene.add(this.grp);
  this.ogrp=new THREE.Group();occScene.add(this.ogrp);this.dmat=new THREE.MeshBasicMaterial({colorWrite:false});this.sig='';this.on=false;this.poOn=false;this.ent=new Map();this.flames=[];
  this.hlMat=new THREE.MeshBasicMaterial({color:'#fff0c8',transparent:true,opacity:.28,blending:THREE.AdditiveBlending,depthWrite:false});this.hl=new THREE.Group();scene.add(this.hl);this.hlE=null;
  this.fm=[new THREE.MeshBasicMaterial({color:'#ff7a1a',transparent:true,opacity:.92,depthWrite:false}),new THREE.MeshBasicMaterial({color:'#ffd23a',transparent:true,opacity:.95,depthWrite:false})]}
 theme(k){const b=BIOMES.list[k];return b&&b.village&&b.village.theme||null}
 stList(){return ST.filter(e=>PROPS.ST[e.id]&&PROPS.ST[e.id].n&&e.id!=='ru'&&!e.inroom&&!e.nodraw)}
 sign(){let h=0;const s=this.stList();s.forEach(e=>h+=e.x*.37+e.y*.11);PO.forEach(e=>h+=e.x*.13+e.y*.29+e.n.length*7+(e.o&&e.o.used?5:0));return s.length+'|'+PO.length+'|'+h.toFixed(1)}
 mesh(G,e,vis){const g=new THREE.Group(),m=new THREE.Mesh(G.g,this.mat);m.castShadow=m.receiveShadow=true;if(!G.hull)G.hull=hull(G.g,.022).geometry;const h=new THREE.Mesh(G.hull,this.ink),d=new THREE.Mesh(G.g,this.dmat);d.layers.set(3);
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

// ═══ FACHADAS (facades.js dDoor) EN 3D ═══ porche (peldaño, jambas, dintel, tejadillo con remate), objetos de oficio, anillo de la puerta y medallón flotante.
// Marco local de cada puerta: u a lo largo de la pared, o hacia fuera, h arriba (unidades de fachada). x=u·fs/32, z=(o·fs−14)/32, y=h·HU; grupo girado π/2 si e.rot.
const sh3=(c,f)=>{const k=new THREE.Color(c);return f<0?k.multiplyScalar(1+f):k.lerp(new THREE.Color('#ffffff'),f)};
class Acc{constructor(){this.P=[];this.N=[];this.C=[];this.E=[]}
 solid(p,col,em=0){const c=new THREE.Color(col),V=p.map(q=>new THREE.Vector3(...q)),ce=new THREE.Vector3();V.forEach(v=>ce.add(v));ce.multiplyScalar(1/8);
  [[0,1,2,3],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]].forEach(f=>{const q=f.map(i=>V[i]);[[0,1,2],[0,2,3]].forEach(t=>{let [a,b,d]=t.map(i=>q[i]);const n=new THREE.Vector3().subVectors(b,a).cross(new THREE.Vector3().subVectors(d,a));if(n.lengthSq()<1e-12)return;
    const fc=a.clone().add(b).add(d).multiplyScalar(1/3).sub(ce);if(n.dot(fc)<0){[b,d]=[d,b];n.negate()}n.normalize();[a,b,d].forEach(v=>{this.P.push(v.x,v.y,v.z);this.N.push(n.x,n.y,n.z);this.C.push(c.r,c.g,c.b);this.E.push(em)})})})}
 geo(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(this.N,3));g.setAttribute('color',new THREE.Float32BufferAttribute(this.C,3));g.setAttribute('aEmit',new THREE.Float32BufferAttribute(this.E,1));g.computeBoundingSphere();return g}}
export class Facades{
 constructor(scene,occScene,W3,mat,ink){this.scene=scene;this.W3=W3;this.mat=mat;this.ink=ink;this.grp=new THREE.Group();this.grp.name='fachadas3d';scene.add(this.grp);this.ogrp=new THREE.Group();occScene.add(this.ogrp);this.dmat=new THREE.MeshBasicMaterial({colorWrite:false});
  this.sig='';this.on=false;this.ent=new Map();this.rings=[];this.meds=[];this.MC=new Map();
  this.hlMat=new THREE.MeshBasicMaterial({color:'#fff0c8',transparent:true,opacity:.28,blending:THREE.AdditiveBlending,depthWrite:false});this.hl=new THREE.Group();scene.add(this.hl);this.hlE=null}
 list(){return typeof ST==='undefined'?[]:ST.filter(e=>e.id==='door'&&e.room&&window.FACADE&&FACADE.TR[e.room])}
 sign(){let h=0;const l=this.list();l.forEach(e=>h+=e.x*.31+e.y*.17+(e.rot?3:0));return l.length+'|'+h.toFixed(1)}
 medal(room,k){const key=room+k;if(this.MC.has(key))return this.MC.get(key);const fa=FACADE.TR[room],W=96,r=44,c=document.createElement('canvas');c.width=c.height=W;const g=c.getContext('2d'),cx=W/2,col=new THREE.Color(fa.c),hx=x=>'#'+x.getHexString();
  const gr=g.createRadialGradient(cx-r*.35,cx-r*.4,r*.1,cx,cx,r);gr.addColorStop(0,hx(sh3(fa.c,.38)));gr.addColorStop(.6,fa.c);gr.addColorStop(1,hx(sh3(fa.c,-.3)));g.beginPath();g.arc(cx,cx,r,0,7);g.fillStyle=gr;g.fill();
  g.globalAlpha=.65;g.lineWidth=3;g.strokeStyle=hx(sh3(fa.c,.55));g.beginPath();g.arc(cx,cx,r*.8,0,7);g.stroke();g.globalAlpha=1;
  const mk=typeof ITEMICON!=='undefined'&&FACADE.MKE&&ITEMICON.marker(FACADE.MKE[room]);if(mk){const z=r*1.5;g.drawImage(mk,cx-z/2,cx-z/2+2,z,z)}
  g.lineWidth=5;g.strokeStyle='#5b3a29';g.beginPath();g.arc(cx,cx,r,0,7);g.stroke();const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;this.MC.set(key,t);return t}
 build(){[this.grp,this.ogrp,this.hl].forEach(x=>{while(x.children.length)x.remove(x.children[0])});this.ent.clear();this.rings=[];this.meds=[];this.hlE=null;
  const {TR,MAT,FH}=FACADE,fs=(window.ORG&&ORG.HK)||1,HU=1.5*fs/34.29,UH=px=>px/1.5;let n=0;
  for(const e of this.list()){const k=e.k||0,M=MAT[k]||MAT[0],fa=TR[e.room],F=FH[e.hn]||FH.casa,hb=UH(F.b),h0=hb+UH(Math.min(F.E-2,F.D+7)),A=new Acc();
   const L=(u,o,h)=>[u*fs/32,h*HU,(o*fs-14)/32];
   const bx=(u0,u1,o0,o1,h0_,h1_,col,em)=>A.solid([L(u0,o0,h0_),L(u1,o0,h0_),L(u1,o1,h0_),L(u0,o1,h0_),L(u0,o0,h1_),L(u1,o0,h1_),L(u1,o1,h1_),L(u0,o1,h1_)],col,em||0);
   const ex={herreria(){bx(-40,-28,2,12,0,8,'#6a4a2a');bx(-38,-30,4,10,8,12.5,'#4a4e58');bx(-36,-27,4.5,9.5,12.5,15,'#4a4e58');bx(30,44,2,10,0,5,'#3a3636');bx(33,41,3,9,5,8,'#262222');bx(35,37.5,4,6.5,8,10.5,'#ff8a2a',2)},
    taberna(){bx(-44,-32,2,12,0,11,'#9a6a3a');bx(-30,-19,3,12,0,10,'#8a5a30');bx(21.6,22.4,5.6,6.4,h0-2,h0+3,'#4a2a14');bx(20,24,4,8,h0-6,h0-2,'#ffdc86',2);bx(-18,-8,8,13,0,6,M.b)},
    banco(){bx(18,30,3,12,0,6,'#7a4a24');bx(18,30,3,12,3,4.6,'#e8b84a');bx(22,26,11.2,12.4,2,4.2,'#e8b84a')},
    tienda(){bx(-44,-30,2,13,0,9,'#a8783f');bx(-43,-31,3,12,9,10.5,'#d44a3a');bx(30,42,3,13,0,8,'#b8883f');bx(31,41,4,12,8,9.5,'#e8c040');bx(-26,-22,10,13,0,5,'#c98a4a');bx(34,38,-1,3,0,3,'#e58aa8')},
    taller(){bx(-42,-26,2,9,0,3,'#c89860');bx(-41,-27,3,8,3,6,'#d8a870');bx(-40,-28,4,7,6,9,'#c89860');bx(24,28,2,5,0,14,'#8a5a30');bx(36,40,2,5,0,14,'#8a5a30');bx(22,42,3,4,12,15,'#a8783f')}};
   (ex[e.room]||(()=>0))();
   if(e.room!=='templo'){const W0=15.5,oo=11,t=1.5,h1=h0-UH(6),hD=hb+UH(F.D),wd=sh3(M.b,-.36),wl=sh3(M.b,-.14),stn=k===5?'#6c5c58':k===3?'#b8c0ca':k===4?'#bdb4a6':'#c9c4b6',c=fa.c;
    bx(-12,12,0,12,hb,hb+UH(1.6),stn);bx(-10.2,-8,0,2.4,hb,hD,wd);bx(8,10.2,0,2.4,hb,hD,wd);bx(-10.8,10.8,0,2.6,hD-.4,hD+UH(2.4),wd);
    for(const u of[-1,1]){const x=u*12.4,q=(dx)=>[L(x+dx,0,h0-UH(1)),L(x+dx,0,h0-UH(9)),L(x+dx,oo*.8,h1-.2)];const a=q(-.9),b=q(.9);A.solid([a[0],a[1],a[2],a[2],b[0],b[1],b[2],b[2]],wl)}
    A.solid([L(-W0,0,h0),L(W0,0,h0),L(W0,oo,h1),L(-W0,oo,h1),L(-W0,0,h0+t),L(W0,0,h0+t),L(W0,oo,h1+t),L(-W0,oo,h1+t)],'#'+sh3(c,-.1).getHexString());
    A.solid([L(-W0,oo-.6,h1+t),L(W0,oo-.6,h1+t),L(W0,oo,h1+t),L(-W0,oo,h1+t),L(-W0,oo-.6,h1+t+.7),L(W0,oo-.6,h1+t+.7),L(W0,oo,h1+t+.7),L(-W0,oo,h1+t+.7)],M.cr)}
   const G=A.geo(),grp=new THREE.Group(),m=new THREE.Mesh(G,this.mat);m.castShadow=m.receiveShadow=true;const hu=new THREE.Mesh(hull(G,.02).geometry,this.ink),d=new THREE.Mesh(G,this.dmat);d.layers.set(3);
   grp.add(m,hu);const p=this.W3(e.x,e.y,TER.standZ(e.x,e.y));grp.position.copy(p);d.position.copy(p);if(e.rot){grp.rotation.y=d.rotation.y=Math.PI/2}this.grp.add(grp);this.ogrp.add(d);
   const ring=new THREE.Mesh(new THREE.RingGeometry(.36,.43,32).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#ffd88a',transparent:true,opacity:.3,blending:THREE.AdditiveBlending,depthWrite:false}));ring.position.copy(p);ring.position.y+=.05;ring.renderOrder=2;this.grp.add(ring);this.rings.push({ring,e});
   const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:this.medal(e.room,k),transparent:true}));const pt=L(0,-10,UH(F.T||F.E+24));sp.scale.set(.78,.78,1);sp.userData.base=p.y+pt[1]+.45;
   const off=new THREE.Vector3(pt[0],0,pt[2]);if(e.rot)off.applyAxisAngle(new THREE.Vector3(0,1,0),Math.PI/2);sp.position.set(p.x+off.x,sp.userData.base,p.z+off.z);this.grp.add(sp);this.meds.push({sp,e});
   this.ent.set(e,{G,p,rot:!!e.rot});n++}
  this.on=n>0;console.info('[R3D fachadas]',{puertas:n})}
 update(now,t,hov){const s=this.sign();if(s!==this.sig){this.sig=s;this.build()}
  this.rings.forEach(({ring,e})=>{const near=typeof P!=='undefined'&&Math.hypot(P.x-e.x,P.y-e.y)<90;ring.material.opacity=(near?.5:.18)+.08*Math.sin(t*3+e.x)});
  this.meds.forEach(({sp,e})=>{sp.position.y=sp.userData.base+Math.sin(t*1.8+e.x)*.04});
  const he=hov&&this.ent.has(hov)?hov:null;if(he!==this.hlE){this.hlE=he;this.hl.clear();if(he){const r=this.ent.get(he),m=new THREE.Mesh(r.G,this.hlMat);m.renderOrder=3;m.position.copy(r.p);if(r.rot)m.rotation.y=Math.PI/2;this.hl.add(m)}}}
}
