// NotScape · R3D · N0.7 · FORGE3D (3 nov 2026 · el dueño: «pasar a 3D el minijuego de cada oficio: el entorno, el martillo, todo, sin consumir muchos recursos» → prototipo de la fragua → «hazlo para los demás»)
// DIORAMAS 3D de los 8 oficios con hoja (fragua, carpintería, curtiduría, sastrería, cantería, joyería, ingeniería, encantamiento), TODOS a escala del héroe (≈ 0,9 u de alto real; se dibuja ×HS):
// la estación de trabajo (cara a la cintura, a la derecha del héroe), el HÉROE REAL con la animación de la hoja (clips `sm`, `wcr`, `wpe`… del lote ANIM-OFICIOS y sus herramientas), la PIEZA 3D que se
// está haciendo (el modelo real del objeto: se «forma» con el Avance, brilla con la Condición, y en los oficios de fuego —`hot`— se calienta y ARDE con el MISMO SHADER DE FUEGO de las armas encantadas,
// `makeShell('fuego')` de enchfx3d.js; el héroe la alza al terminar), chispas/virutas/gotas/motas por tipo de acción y un taller propio por oficio.
// COMPOSICIÓN COMÚN (cámara FIJA a propósito, es un minijuego): héroe de perfil a la izquierda de la estación, la pieza a su derecha (nunca le tapa cabeza ni torso), margen para el martillo en alto.
// SIN CONTEXTO WEBGL NUEVO (trinquete de rules_check): se dibuja con el renderer PRINCIPAL en el hueco de pantalla del lienzo de la hoja (viewport + scissor), justo después del mundo (hook en
// r3d.js `frame`), y se COPIA al lienzo 2D de forge.js (`out`) en la misma tarea. Una escena por tema, construida UNA vez y cacheada; solo se dibuja la del oficio abierto.
// COSTE: lo estático de cada taller se FUSIONA en UNA malla con color por vértice + contorno (≈ 2 llamadas); ≈ 15–25 objetos dinámicos; SIN sombras ni PointLight (direccionales); 1 Points de partículas.
// AÑADIR UN OFICIO/TEMA: una función `bXxx(c)` (atrezo estático con `c.part(geo,color,x,y,z,{rx,ry,rz,s})` + dinámico con `c.add(obj,x,y,z)`; devuelve `{upd(F,now,dt,k)}` y opcional `burst`) y una fila en `TH3`.
// Contrato con forge.js: R3D.forge3d.open({theme,outId,look,out,rectFn}) · setAct(act) · setSt(st) · burst(spr,pow,exc,cols,k) · close(). `?forge3d=0` = lienzo 2D antiguo.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {HeroSel as Hero} from './herosel3d.js';
import {toon,hull,inkFor} from './materials3d.js';
import {makeShell} from './enchfx3d.js';

const PI=Math.PI,clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,ss=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
/* N0.7 (3 nov 2026; el dueño: «rehaz el fuego de las instalaciones: más suave y uniforme»): LLAMA CONTINUA en un solo plano (antes 5 fundas separadas del shader de las armas
   + una lámina de brasas = lenguas sueltas que parpadeaban). Ruido de baja frecuencia que sube despacio, altura de la llama que varía suave a lo ancho, bordes difuminados
   y degradado blanco-amarillo → naranja → rojo; aditivo, sin escribir profundidad. `hearth(w,h)` → {mesh, set(intensidad 0..1.6, t)}; 1 llamada. */
const HF_V='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
const HF_F='uniform float uT,uI;varying vec2 vUv;\nfloat h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\nfloat n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1.,0.)),f.x),mix(h2(i+vec2(0.,1.)),h2(i+vec2(1.,1.)),f.x),f.y);}\nvoid main(){vec2 u=vUv;float x=u.x,y=u.y;\n float side=smoothstep(0.,.14,x)*smoothstep(1.,.86,x);\n float n=n2(vec2(x*3.2,y*2.2-uT*.9))*.65+n2(vec2(x*7.+3.,y*4.5-uT*1.6))*.35;\n float top=.42+.22*n2(vec2(x*2.4+uT*.25,uT*.35))+.18*uI;\n float f=smoothstep(top,top-.42,y+(n-.5)*.28)*side;\n f*=smoothstep(0.,.22,y)*.75+.25*smoothstep(0.,.06,y);\n float core=smoothstep(.55,1.,f)*smoothstep(.55,.0,y);\n vec3 c=mix(vec3(.55,.08,.02),vec3(1.,.42,.08),smoothstep(.0,.55,f));c=mix(c,vec3(1.,.8,.45),core*.6);\n float a=f*(.55+.35*uI);gl_FragColor=vec4(c*a,a);\n#include <colorspace_fragment>\n}';
const hearth=(w,h)=>{const m=new THREE.ShaderMaterial({uniforms:{uT:{value:0},uI:{value:1}},vertexShader:HF_V,fragmentShader:HF_F,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,premultipliedAlpha:true});
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);mesh.renderOrder=3;return{mesh,set(I,t){m.uniforms.uI.value=I;m.uniforms.uT.value=t}}};
const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)};
const Bx=(x,y,z)=>new THREE.BoxGeometry(x,y,z),Cy=(a,b,h,n=10)=>new THREE.CylinderGeometry(a,b,h,n),Sp=(r,sx=1,sy=1,sz=1)=>new THREE.SphereGeometry(r,8,6).scale(sx,sy,sz),Fr=(a,b,h)=>new THREE.CylinderGeometry(a,b,h,4).rotateY(PI/4);
const MAXS=120;   // chispas/virutas/gotas/motas simultáneas (1 Points por escena)
const HX=-.64,HS=1.5;                 // héroe (x) y escala (mide ≈ .9 u de verdad); mira hacia +x
const AX=.12,AZ=0,ATOP=.71;           // estación: centro y altura de su cara de trabajo (a la cintura del héroe)
const STONE=['#5a4d44','#4a3f38','#53463d','#3e342f','#605248'],WOODS=['#6a4a30','#7a5636','#5e4028','#86603c'];

function cl(o){const n=o.isMesh?new THREE.Mesh(o.geometry,o.material):new THREE.Group();n.position.copy(o.position);n.quaternion.copy(o.quaternion);n.scale.copy(o.scale);n.visible=o.visible;for(const c of o.children)n.add(cl(c));return n}
function glowTex(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.35,'rgba(255,255,255,.4)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)}
function shaftTex(){const c=document.createElement('canvas');c.width=32;c.height=128;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,128);g.addColorStop(0,'rgba(255,255,255,.85)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,32,128);const h=x.createLinearGradient(0,0,32,0);h.addColorStop(0,'rgba(0,0,0,.9)');h.addColorStop(.5,'rgba(0,0,0,0)');h.addColorStop(1,'rgba(0,0,0,.9)');x.globalCompositeOperation='destination-out';x.fillStyle=h;x.fillRect(0,0,32,128);return new THREE.CanvasTexture(c)}
function runeTex(){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.translate(128,128);x.strokeStyle='#fff';x.lineWidth=5;for(const r of[120,100,64]){x.beginPath();x.arc(0,0,r,0,PI*2);x.stroke()}x.lineWidth=3;for(let i=0;i<8;i++){x.save();x.rotate(i*PI/4);x.beginPath();x.moveTo(0,-64);x.lineTo(0,-100);x.moveTo(-9,-84);x.lineTo(9,-84);x.moveTo(-6,-76);x.lineTo(0,-92);x.lineTo(6,-76);x.stroke();x.restore()}
 x.beginPath();for(let i=0;i<5;i++){const a=i*PI*4/5-PI/2;x.lineTo(Math.cos(a)*62,Math.sin(a)*62)}x.closePath();x.stroke();return new THREE.CanvasTexture(c)}

// ══ SALA COMÚN: suelo, muro, vigas, ventana alta, lámpara (cada tema elige materiales) ══
function shell(part,o){const wood=o.wall==='plank';
 part(Bx(10,.3,7),o.fb||'#26201c',0,-.15,.2);
 if(o.floor==='plank')for(let i=0;i<10;i++)part(Bx(10,.05,.46),WOODS[i%4],0,.012+(i%3)*.004,-1.2+i*.42);
 else for(let i=0;i<7;i++)for(let j=0;j<4;j++){const k=i*7+j,w=.95+hash(k)*.35,d=.8+hash(k+9)*.3;part(Bx(w,.05,d),o.fs?o.fs[(i+j*2)%o.fs.length]:STONE[(i+j*2)%5],-3.3+i*1.05+hash(k+3)*.15,.012+hash(k+5)*.012,-1.0+j*.9+hash(k+7)*.12)}
 part(Bx(9.6,3.4,.4),o.wb||'#2e2724',0,1.7,-1.55);
 if(wood){for(let i=0;i<26;i++)part(Bx(.36,3.3,.07),WOODS[i%4],-4.5+i*.37,1.65,-1.33);for(const y of[.9,1.9,2.8])part(Bx(9.6,.1,.1),'#3a2a1c',0,y,-1.27)}
 else for(let r=0;r<7;r++)for(let c=0;c<8;c++){const k=r*8+c,w=.7+hash(k)*.6,off=(r%2)*.5;if(hash(k+77)<.12)continue;part(Bx(w,.38+hash(k+3)*.14,.1),o.ws?o.ws[(r+c)%o.ws.length]:STONE[(r+c)%5],-4.4+c*1.2+off+hash(k+5)*.1,.22+r*.5,-1.32)}
 part(Bx(9.6,.26,.3),'#2a1c14',0,3.2,-1.25);part(Bx(9.6,.2,.26),'#241811',0,2.92,-1.27);[-3.4,-.9,3.5].forEach(x=>part(Bx(.26,3.4,.28),'#2a1c14',x,1.7,-1.22));
 [[-3.4,-.9],[3.5,2.6]].forEach(([a,b])=>part(Bx(1.15,.14,.14),'#2a1c14',(a+b)/2,2.65,-1.2,{rz:a<b?-.7:.7}));for(let i=0;i<4;i++)part(Bx(.22,.2,3.6),'#241811',-3+i*2.1,3.1,.4);
 const WX=.95,WY=2.05;part(Bx(1.0,1.1,.12),'#1a120c',WX,WY,-1.28);for(const dx of[-.18,.18])part(Bx(.05,1.0,.06),'#0f0a07',WX+dx,WY,-1.2);part(Bx(.9,.05,.06),'#0f0a07',WX,WY,-1.2);part(Bx(1.15,.08,.2),'#3a322e',WX,WY-.6,-1.2);
 part(Cy(.012,.012,.8,4),'#2a2a2a',-.25,2.55,-.8);part(Bx(.2,.05,.2),'#2a2a30',-.25,2.12,-.8);part(Bx(.2,.05,.2),'#2a2a30',-.25,2.4,-.8);for(const [dx,dz] of[[-.09,-.09],[.09,-.09],[-.09,.09],[.09,.09]])part(Bx(.02,.28,.02),'#2a2a30',-.25+dx,2.26,-.8+dz)}
// piezas comunes: barril y mesa con patas
const barrel=(part,x,z,h=.76,col='#5a3b22')=>{part(Cy(.3,.27,h,14),col,x,h/2,z);for(const y of[h*.24,h*.76])part(Cy(.305,.29,.04,14),'#2a2a30',x,y,z)};
const table=(part,x,z,w,d,h,top,leg)=>{part(Bx(w,.09,d),top,x,h-.045,z);for(const [dx,dz] of[[-1,-1],[1,-1],[-1,1],[1,1]])part(Bx(.09,h-.09,.09),leg,x+dx*(w/2-.07),(h-.09)/2,z+dz*(d/2-.07))};

// ══ TEMAS ══
// FRAGUA (Herrería): yunque a la cintura, horno con campana y fuego del shader de las armas, fuelle, barril de temple, mesa con herramientas
function bForge(c){const {part,add,sc}=c,FX=1.95,FZ=-.8,AS=.7,gt=c.gt;
 part(new THREE.CylinderGeometry(.75,.75,.01,14).scale(1.3,1,.8),'#1c1613',FX,.052,FZ+.95);part(new THREE.CylinderGeometry(.34,.34,.01,10).scale(1.2,1,.8),'#2a2220',AX-.05,.053,AZ+.1);
 part(Bx(1.7,1.0,1.25),'#5a5048',FX,.5,FZ);part(Bx(1.85,.14,1.4),'#463d37',FX,1.07,FZ);part(Bx(1.0,.5,.9),'#4e453f',FX,1.45,FZ-.08);part(Bx(.7,.7,.7),'#473f39',FX,1.95,FZ-.14);part(Bx(.5,1.2,.5),'#40382f',FX,2.7,FZ-.2);
 part(Bx(1.0,.62,.14),'#0d0806',FX,.58,FZ+.62);part(Bx(1.14,.12,.18),'#2c2622',FX,.93,FZ+.66);for(const dx of[-.52,.52])part(Bx(.12,.62,.18),'#2c2622',FX+dx,.58,FZ+.66);
 for(let i=0;i<4;i++)part(Cy(.06,.06,.5,6),'#2a1a10',FX-.28+i*.19,.18,FZ+.5,{rz:PI/2,ry:hash(i)*.6});for(let i=0;i<14;i++)part(Bx(.1,.06,.1),i%2?'#2a2420':'#3a302a',FX-.55+hash(i)*1.1,.2+hash(i+4)*.04,FZ+.45+hash(i+9)*.12);
 // FUELLE (pulido): dos tablas en cuña con la tobera hacia el horno, palanca y bolsa de cuero que se comprime al bombear
 for(const y of[.5,.18])part(Fr(.26,.13,.7).rotateZ(PI/2),'#6a4a30',FX-1.08,y*.65+.02,FZ-.15,{s:.65});part(Cy(.025,.04,.45,6),'#2a2a30',FX-.84,.24,FZ-.15,{rz:-PI/2,s:.65});part(Bx(.05,.55,.05),'#4a3322',FX-1.3,.42,FZ-.15,{rz:.35,s:.65});
 for(let i=0;i<3;i++)part(Sp(.26,1,.8,1),i%2?'#2a2622':'#3a322c',FX+1.15+hash(i)*.3,.2+(i>1?.32:0),FZ+.1+(i%2)*.4);for(let i=0;i<2;i++)part(Bx(.5,.4,.5),'#5a4028',FX+1.2,.2+i*.4,FZ-.5,{ry:i*.3});
 const A=(geo,col,x,y,z,o={})=>part(geo,col,AX+x*AS,y*AS,AZ+z*AS,Object.assign({s:AS},o));A(Cy(.34,.4,.56,10),'#6a4a30',0,.28,0);A(Cy(.405,.405,.05,12),'#2a2a30',0,.08,0);A(Cy(.355,.355,.05,12),'#2a2a30',0,.46,0);
 A(Bx(.56,.12,.4),'#3a3a44',0,.62,0);A(Bx(.3,.22,.28),'#3a3a44',0,.79,0);A(Bx(1.0,.14,.38),'#4a4a56',0,.93,0);A(Bx(.1,.02,.1),'#16161a',-.25,1.005,0);A(new THREE.ConeGeometry(.17,.46,8).rotateZ(-PI/2),'#4a4a56',.72,.93,0);A(Bx(.1,.14,.3),'#3a3a44',-.55,.93,0);
 part(Bx(.07,.04,.5),'#6a4a30',AX-.5,.06,AZ+.55,{ry:.5});part(Bx(.16,.1,.1),'#5a5a66',AX-.34,.09,AZ+.66,{ry:.5});part(Bx(.03,.03,.6),'#5a5a66',AX+.5,.04,AZ+.62,{ry:-.3});
 barrel(part,-1.45,-.45);part(Cy(.012,.012,.5,4),'#6a6a74',-1.7,.8,-.45,{rz:.5});
 const TX=-2.25,TZ=-.95;table(part,TX,TZ,1.3,.55,.82,'#6a4a30','#4a3322');part(Bx(1.1,.05,.45),'#5a3e28',TX,.3,TZ);part(Bx(.5,.07,.14),'#5a5a66',TX-.35,.9,TZ+.1,{ry:.3});part(Bx(.5,.05,.04),'#8a8a94',TX+.3,.88,TZ+.05,{ry:.2});for(let i=0;i<3;i++)part(Bx(.34,.07,.16),'#b8623a',TX+.1,.9+i*.07,TZ-.12);
 part(Bx(.08,.34,.08),'#6a4a30',TX-.05,.99,TZ+.1,{rz:1.3});part(Bx(.18,.12,.12),'#5a5a66',TX-.2,1.0,TZ+.1);for(let i=0;i<3;i++)part(Cy(.07,.06,.16,8),['#3a6a4a','#6a3a3a','#3a4a7a'][i],TX-.55+i*.14,.95,TZ-.18);
 part(Bx(1.5,.9,.05),'#3a2a1c',TX,1.9,-1.28);for(let i=0;i<4;i++){part(Bx(.045,.34,.04),'#6a4a30',TX-.55+i*.22,1.92,-1.22);part(Bx(.15,.08,.07),'#6a6a74',TX-.55+i*.22,2.1,-1.2)}for(const dx of[-.35,.1])part(Bx(.04,.5,.03),'#8a8a94',TX+dx,1.65,-1.22,{rz:.1});
 [[-.15,.0],[.05,.05],[.25,-.04]].forEach(([dx,tl])=>{part(Bx(.07,.95,.025),'#9aa0aa',TX+1.2+dx*1.2,1.55,-1.2,{rz:tl});part(Bx(.3,.05,.05),'#b8923a',TX+1.2+dx*1.2,1.1,-1.19,{rz:tl});part(Bx(.05,.2,.05),'#4a3322',TX+1.2+dx*1.2,.97,-1.19,{rz:tl})});part(Cy(.3,.3,.06,14),'#5a3b22',TX+2.2,1.9,-1.22,{rx:PI/2});part(Cy(.07,.07,.09,8),'#8a8a94',TX+2.2,1.9,-1.17,{rx:PI/2});
 // dinámico
 const mouth=add(new THREE.Mesh(new THREE.PlaneGeometry(.92,.5),new THREE.MeshBasicMaterial({color:'#ff6a18',transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false})),FX,.5,FZ+.5);
 const bed=add(new THREE.Mesh(new THREE.PlaneGeometry(.9,.22),new THREE.MeshBasicMaterial({color:'#ffb040',transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false})),FX,.3,FZ+.78);   // cama de brasas continua bajo las llamas
 const fl=hearth(.94,.62);fl.mesh.position.set(FX,.31+.31,FZ+.8);sc.add(fl.mesh);   // llama continua de la boca del horno
 const hg=add(new THREE.Mesh(new THREE.PlaneGeometry(2.4,1.8),new THREE.MeshBasicMaterial({map:gt,color:'#ff7a2a',transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false})),FX,.7,FZ+.9);
 const water=add(new THREE.Mesh(new THREE.CircleGeometry(.27,14).rotateX(-PI/2),new THREE.MeshBasicMaterial({color:'#5a8aa8',transparent:true,opacity:.9})),-1.45,.745,-.45);
 const bag=add(new THREE.Mesh(Fr(.22,.11,.62).rotateZ(PI/2),toon('#7a5434',{})),FX-1.08,.24,FZ-.15);bag.scale.setScalar(.65);bag.add(hull(bag.geometry,.012,inkFor('#3a2a22')));
 const up=new THREE.Vector3(0,1,0);
 return{upd(F,now,dt,k){const fi=.55+k.heat*.35+F.fire*.5+Math.sin(now*2.1)*.03,pp=Math.sin(clamp(F.pump,0,1)*PI);
   mouth.material.opacity=clamp(.1+fi*.12,0,.35);bed.material.opacity=clamp(.12+fi*.12,0,.4);F.warm.intensity=.4+fi*.7;hg.material.opacity=clamp(.2+fi*.25,0,.6);
   const fI=clamp(.8+k.heat*.3+F.fire*.4,0,1.1),fR=.2+k.heat*.05+F.fire*.07;fl.set(clamp(.55+k.heat*.35+F.fire*.45,0,1.6),now);
   bag.scale.set(.65,.65*(1-.45*pp),.65);water.position.y=.745+Math.sin(now*3)*.004;
   if(F.sp.length<MAXS-40&&hash(Math.floor(now*14)*3.7)>.86)F.spawn(1,[FX+(hash(now)-.5)*.5,1.1,FZ+.3],.9,'#ff9a3a',1.4,-2.2)},
  burst(F,spr,pow,exc,x,y){if(spr==='hammer'){F.spawn(Math.round(16*pow)+(exc?12:0),[x,y,AZ],2.3,exc?['#fff1b0','#ffd36b']:['#fff1b0','#ffb347','#ff6a1a'],.6,9);F.shake=Math.max(F.shake,.5*pow);return true}
   if(spr==='bucket'){F.quenchT=1;F.spawn(14,[x,y+.1,AZ],1.1,['#d8e4ea','#9fd8ff'],1.2,-1.2);return true}
   if(spr==='bellows'){F.fire=Math.min(1.6,F.fire+.9);F.pump=1;F.spawn(14,[FX-.2,.9,FZ+.4],2.4,['#ffb347','#ff6a18'],1.0,-1);return true}return false}}}

// CARPINTERÍA: banco con tornillo de banco, caballete con tronco, tablones, serrucho/garlopa colgados, pila de leña, serrín
function bCarp(c){const {part}=c;
 table(part,AX+.4,AZ,1.25,.55,ATOP,'#8a6a44','#6a4a30');part(Bx(.14,.16,.22),'#5a5a66',AX-.18,ATOP+.04,AZ);part(Cy(.025,.025,.34,6),'#6a6a74',AX-.18,ATOP+.06,AZ+.24,{rx:PI/2});part(Bx(1.0,.04,.42),'#6a4a30',AX+.4,.3,AZ);for(let i=0;i<3;i++)part(Bx(.3,.05,.12),'#7a5636',AX+.1+i*.3,.35,AZ);
 for(const dz of[-.5,.1])part(Bx(.9,.08,.1),'#6a4a30',-1.9,.6,-.3+dz);for(const [dx,dz] of[[-.4,-.5],[.4,-.5],[-.4,.1],[.4,.1]])part(Bx(.07,.6,.07),'#4a3322',-1.9+dx,.3,-.3+dz,{rz:dx*.25});part(Cy(.13,.13,1.0,10),'#9a6a3c',-1.9,.74,-.5,{rz:PI/2});part(Cy(.131,.131,.02,10),'#c8a468',-1.4,.74,-.5,{rz:PI/2});
 for(let i=0;i<6;i++)part(Bx(.95,.05,.34),i%2?'#c8a468':'#b89258',-2.05,.03+i*.055,-.9);for(let i=0;i<3;i++)part(Bx(.3,1.55,.04),WOODS[i%4],-2.5+i*.1,.78,-1.2,{rz:.1+i*.03});
 for(const y of[1.95,1.55]){part(Bx(.7,.14,.015),'#a8aeb8',-1.7,y,-1.22);part(Bx(.12,.16,.04),'#6a4a30',-2.1,y,-1.22)}part(Bx(.34,.09,.11),'#8a6a44',-1.2,1.9,-1.22);part(Bx(.1,.12,.05),'#4a3322',-1.2,2.0,-1.22);part(Bx(.07,.3,.07),'#6a4a30',-.95,1.75,-1.22);part(Cy(.07,.07,.12,8),'#5a5a66',-.95,1.95,-1.22,{rz:PI/2});for(let i=0;i<3;i++)part(Bx(.03,.3,.03),'#8a8a94',-1.5+i*.12,1.45,-1.22);
 [[-.35,.16],[-.67,.16],[-.99,.16],[-.5,.43],[-.83,.43],[-.67,.7]].forEach(([z,y],i)=>part(Cy(.16,.16,.9,10),WOODS[i&3],1.9,y,z,{rz:PI/2}));
 barrel(part,2.55,.25,.7);for(let i=0;i<12;i++)part(Bx(.25,.012,.15),'#d8b878',-.4+hash(i)*1.9,.045,-.5+hash(i+9)*1.4,{ry:hash(i+3)*PI});for(let i=0;i<16;i++)part(Bx(.07,.02,.12),'#e8c888',-.8+hash(i+20)*2.2,.05,-.2+hash(i+40)*1.1,{ry:hash(i+5)*PI});
 return{upd(){}}}

// CURTIDURÍA: mesa pesada, bastidor con piel estirada, tinas con tinte, pieles colgadas, cuchillos y leznas
function bTan(c){const {part,add}=c;
 table(part,AX+.4,AZ,1.3,.62,ATOP,'#6a4a30','#4a3322');part(Bx(1.0,.04,.46),'#5a3e28',AX+.4,.3,AZ);
 for(const x of[1.35,2.45])part(Bx(.1,1.55,.1),'#4a3322',x,.78,-.75);for(const y of[.28,1.45])part(Bx(1.3,.08,.08),'#4a3322',1.9,y,-.75);part(Bx(1.0,1.05,.025),'#b98560',1.9,.86,-.76);for(let i=0;i<10;i++){part(Bx(.012,.1,.012),'#e8d8b0',1.4+i*.1,1.42,-.74);part(Bx(.012,.1,.012),'#e8d8b0',1.4+i*.1,.3,-.74)}
 for(const [x,z] of[[1.45,.25],[2.35,.35]]){part(Cy(.4,.36,.5,14),'#5a3b22',x,.25,z);part(Cy(.405,.37,.04,14),'#2a2a30',x,.4,z)}part(Bx(.05,.7,.05),'#4a3322',1.9,.6,.4,{rz:.4});
 part(Bx(2.4,.03,.03),'#6a5a3a',-1.6,2.6,-.6);[[-2.4,'#b98560',.95],[-1.9,'#8a5a3a',.8],[-1.45,'#a87050',.9],[-1.0,'#d8c4a0',.75]].forEach(([x,col,h],i)=>part(Fr(.22,.26,h),col,x,2.6-h/2,-.6+(i%2)*.04));
 barrel(part,-1.3,-.35,.74);barrel(part,-1.85,-.1,.66,'#4a3322');for(const dx of[0,.18,.36]){part(Bx(.045,.3,.02),'#c8d0d8',-1.9+dx,1.8,-1.22);part(Bx(.05,.14,.04),'#6a4a30',-1.9+dx,1.62,-1.22)}part(Bx(.5,.07,.2),'#8a8a94',-1.3,1.9,-1.22);
 part(Sp(.24,1,.8,1),'#d8d0c0',-.95,.2,-.9);part(Cy(.16,.14,.4,8),'#6a4a30',2.6,.2,-.2);for(let i=0;i<9;i++)part(Bx(.18+hash(i)*.1,.012,.12),['#a87050','#b98560','#8a5a3a'][i%3],-.5+hash(i+20)*2.2,.05,.4+hash(i+40)*.8,{ry:hash(i+3)*PI});
 const v1=add(new THREE.Mesh(new THREE.CircleGeometry(.36,14).rotateX(-PI/2),new THREE.MeshBasicMaterial({color:'#8a4a2a'})),1.45,.43,.25),v2=add(new THREE.Mesh(new THREE.CircleGeometry(.36,14).rotateX(-PI/2),new THREE.MeshBasicMaterial({color:'#2a6a7a'})),2.35,.43,.35);
 return{upd(F,now){v1.position.y=.43+Math.sin(now*2.4)*.004;v2.position.y=.43+Math.sin(now*2.1+1)*.004}}}

// SASTRERÍA: mesa de corte con tela y tijeras, maniquí con vestido, estantes con rollos de tela, tablero de carretes, cesta de lana, alfombra
function bSew(c){const {part}=c;
 part(Bx(2.4,.01,1.5),'#6a3a3a',AX,.015,.2);part(Bx(2.3,.012,.08),'#c8a060',AX,.018,.2);
 table(part,AX+.4,AZ,1.3,.62,ATOP,'#b89a6a','#8a6a44');part(Bx(.5,.03,.5),'#b84a5a',AX+.6,ATOP+.02,AZ+.05,{ry:.2});part(Bx(.34,.01,.02),'#8a8a94',AX-.1,ATOP+.01,AZ-.2,{ry:.4});part(Bx(.2,.03,.02),'#2a2a30',AX-.2,ATOP+.01,AZ-.2,{ry:.4});
 part(Cy(.02,.02,1.0,6),'#6a4a30',-1.8,.5,-.5);part(Bx(.42,.03,.05),'#6a4a30',-1.8,.03,-.5);part(Bx(.05,.03,.42),'#6a4a30',-1.8,.03,-.5);part(Cy(.17,.12,.42,10),'#d8c8a8',-1.8,1.05,-.5);part(Sp(.17,1.1,.5,.7),'#d8c8a8',-1.8,1.32,-.5);part(Sp(.05),'#6a4a30',-1.8,1.45,-.5);part(Cy(.1,.34,.55,10),'#8a3a5a',-1.8,.55,-.5);part(Cy(.18,.12,.2,10),'#8a3a5a',-1.8,1.0,-.5);
 for(const y of[1.0,1.5,2.0])part(Bx(1.8,.05,.32),'#6a4a30',1.85,y,-1.1);const CL=['#b84a5a','#3a5a9a','#4a8a5a','#e8dcc0','#8a5a9a','#c8a030','#5a8a9a'];for(let r=0;r<3;r++)for(let i=0;i<7;i++)part(Cy(.1,.1,.42,8),CL[(i+r*2)%7],1.12+i*.21,1.0+r*.5+.25,-1.1);
 part(Bx(1.1,.7,.04),'#4a3322',-1.7,1.95,-1.28);for(let i=0;i<5;i++)for(let j=0;j<3;j++)part(Cy(.035,.035,.07,8),CL[(i+j)%7],-2.1+i*.18,1.72+j*.18,-1.22,{rx:PI/2});
 part(Cy(.2,.17,.2,10),'#8a6a44',2.3,.1,.3);for(let i=0;i<4;i++)part(Sp(.09),CL[i],2.25+(i%2)*.1,.24,.25+(i>1?.08:0));
 part(Bx(2,.02,.02),'#6a5a3a',-.9,2.5,-.6);[[.15,'#b84a5a'],[.5,'#3a5a9a']].forEach(([dx,col],i)=>part(Fr(.2,.26,.7),col,-1.15+dx*2,2.15,-.6+i*.02));
 return{upd(){}}}

// CANTERÍA (Escultor): pedestal de piedra, estatua a medio tallar, bloques, trípode con polea, andamio, astillas de piedra
function bStone(c){const {part}=c;
 part(Bx(1.0,.22,.72),'#6a645a',AX+.1,.11,AZ);part(Bx(.8,.5,.52),'#7a746a',AX+.1,.47,AZ);
 part(Bx(.56,.2,.56),'#d8d2c6',-1.75,.1,-.45);part(Cy(.17,.2,.7,8),'#d8d2c6',-1.75,.55,-.45);part(Sp(.19,1.2,.7,.8),'#d8d2c6',-1.75,.95,-.45);part(Sp(.11),'#d8d2c6',-1.75,1.18,-.45);part(Bx(.5,.5,.5),'#9a948a',-2.35,.25,-.3,{ry:.3});for(let i=0;i<5;i++)part(Bx(.1,.02,.02),'#6a645a',-1.75+(i-2)*.07,.6+i*.08,-.27);
 [[1.9,.2,-.5,'#8a847a'],[2.5,.2,-.55,'#6a6660'],[2.2,.6,-.52,'#9a948a']].forEach(([x,y,z,col])=>part(Bx(.62,.4,.5),col,x,y,z,{ry:x*.1}));
 for(const [dx,dz,rx,rz] of[[-.25,.15,.2,-.18],[.25,.1,.2,.18],[0,-.3,-.25,0]])part(Bx(.07,2.2,.07),'#4a3322',2.15+dx*.9,1.1,.3+dz,{rx,rz});part(Cy(.012,.012,1.2,4),'#8a7a5a',2.15,1.6,.3);part(Bx(.4,.3,.4),'#9a948a',2.15,.9,.3);
 for(const y of[1.3,1.95])part(Bx(1.7,.06,.4),'#6a4a30',.1,y,-1.05);for(const x of[-.7,.9])part(Bx(.08,1.95,.08),'#4a3322',x,.98,-1.05);
 part(Bx(1.3,.8,.04),'#3a2a1c',-1.2,1.85,-1.28);for(let i=0;i<5;i++){part(Bx(.03,.32,.02),'#a8aeb8',-1.7+i*.16,1.9,-1.22);part(Bx(.05,.1,.04),'#6a4a30',-1.7+i*.16,1.7,-1.22)}
 part(Sp(.24,1,.8,1),'#d8d0c0',1.1,.2,.55);barrel(part,-.95,-.9,.7);for(let i=0;i<16;i++)part(Bx(.06+hash(i)*.06,.04,.06+hash(i+4)*.05),['#9a948a','#7a746a','#b8b2a6'][i%3],-.3+hash(i+20)*1.5,.04,-.4+hash(i+40)*1.1,{ry:hash(i)*PI});
 return{upd(F,now){if(F.sp.length<MAXS-40&&hash(Math.floor(now*3)*4.1)>.6)F.spawn(1,[AX+(hash(now)-.5)*.6,ATOP+.1,AZ],.15,'#c8c4ba',2.2,-.1)}}}

// JOYERÍA: banco con fieltro, vitrina con gemas, crisol con fuego pequeño, balanza, lupa con brazo, tablero de anillos
function bJewel(c){const {part,add,sc}=c;
 table(part,AX+.3,AZ,1.05,.5,ATOP,'#4a3322','#3a2a1c');part(Bx(.7,.012,.34),'#2a4a3a',AX+.15,ATOP+.008,AZ);part(Cy(.012,.012,.7,4),'#a8aeb8',AX+.7,ATOP+.35,AZ-.2);part(Bx(.4,.012,.012),'#a8aeb8',AX+.5,ATOP+.7,AZ-.2,{rz:.1});part(Cy(.09,.09,.014,10),'#a8c8d8',AX+.3,ATOP+.69,AZ-.2,{rx:PI/2});
 part(Cy(.02,.02,.3,5),'#c8a030',AX+.6,ATOP+.16,AZ+.1);part(Bx(.34,.012,.012),'#c8a030',AX+.6,ATOP+.31,AZ+.1);for(const dx of[-.17,.17])part(Cy(.06,.06,.01,8),'#c8a030',AX+.6+dx,ATOP+.22,AZ+.1);
 for(const x of[-2.35,-1.45])part(Bx(.05,1.8,.05),'#3a2a1c',x,.9,-.8);for(const y of[.2,.7,1.2,1.7])part(Bx(.95,.04,.4),'#4a3322',-1.9,y,-.8);part(Bx(.95,1.6,.03),'#1a120c',-1.9,.95,-1.02);const GC=['#e02a3a','#3a6aff','#3aa86a','#e8f8ff','#9a5ae0','#e8a030'];for(let r=0;r<3;r++)for(let i=0;i<6;i++)part(Sp(.034),GC[(i+r)%6],-2.25+i*.14,.25+r*.5,-.8+((i%2)*.05-.02));
 part(Bx(.8,.7,.6),'#6a4a3a',1.75,.35,-.7);part(Bx(.5,.3,.12),'#0d0806',1.75,.45,-.4);for(const dx of[-.34,.34])part(Bx(.08,.3,.14),'#4a3a30',1.75+dx,.45,-.4);part(Bx(.5,.5,.5),'#4a4a56',2.5,.25,-.7);part(Bx(.46,.1,.3),'#3a3a44',2.5,.55,-.7);
 part(Bx(1.2,.8,.04),'#1a120c',-.9,1.9,-1.28);for(let i=0;i<5;i++)for(let j=0;j<3;j++)part(Cy(.04,.04,.012,10),'#c8a030',-1.3+i*.2,1.6+j*.2,-1.24,{rx:PI/2});for(let i=0;i<5;i++)part(Sp(.025),GC[i],-1.3+i*.2,1.72,-1.22);
 const fire=hearth(.36,.3);fire.mesh.position.set(1.75,.58,-.32);sc.add(fire.mesh);const gl=add(new THREE.Mesh(new THREE.PlaneGeometry(1.2,1),new THREE.MeshBasicMaterial({map:c.gt,color:'#ff9a3a',transparent:true,opacity:.3,blending:THREE.AdditiveBlending,depthWrite:false})),1.75,.5,-.3),up=new THREE.Vector3(0,1,0);
 return{upd(F,now,dt,k){fire.set(clamp(.6+k.heat*.4+F.fire*.3,0,1.6),now);gl.material.opacity=.25+.04*Math.sin(now*2.3)+k.heat*.2;F.warm.intensity=.3+k.heat*.4;
   if(F.sp.length<MAXS-40&&hash(Math.floor(now*5)*7.7)>.7)F.spawn(1,[-2.25+hash(now)*.9,.2+hash(now*3)*1.5,-.7],.05,'#ffffff',.5,0)}}}   // destellos de las gemas

// INGENIERÍA: banco con tornillo, caldera de cobre con manómetro y vapor, engranajes (uno gira), tuberías, planos, estantes con muelles y lentes
function bTinker(c){const {part,add}=c;
 table(part,AX+.4,AZ,1.25,.55,ATOP,'#6a6a74','#4a4a52');part(Bx(.14,.18,.22),'#3a3a44',AX-.18,ATOP+.05,AZ);part(Bx(1.0,.04,.42),'#4a4a52',AX+.4,.3,AZ);part(Cy(.1,.1,.03,12),'#b8923a',AX+.6,ATOP+.02,AZ+.1);part(Bx(.3,.1,.14),'#a8341c',AX+.75,.36,AZ);
 part(Cy(.32,.32,1.1,14),'#b8623a',-1.8,.62,-.6,{rz:PI/2});for(const dx of[-.4,0,.4])part(Cy(.325,.325,.05,14),'#6a3a22',-1.8+dx,.62,-.6,{rz:PI/2});for(const dx of[-.55,.55])part(Sp(.32,.35,1,1),'#b8623a',-1.8+dx,.62,-.6);for(const dx of[-.4,.4])part(Bx(.1,.3,.5),'#3a3a44',-1.8+dx,.15,-.6);
 part(Cy(.05,.05,1.9,8),'#8a8a94',-1.4,1.55,-.6);part(Cy(.1,.1,.03,12),'#e8dcc0',-1.8,.8,-.28,{rx:PI/2});part(Bx(.01,.07,.012),'#a8341c',-1.8,.82,-.26);part(Cy(.07,.07,.05,10),'#a8341c',-1.55,.92,-.3,{rx:PI/2});
 const gear=(x,y,r,col,n)=>{part(Cy(r,r,.08,18),col,x,y,-1.22,{rx:PI/2});for(let i=0;i<n;i++){const a=i/n*PI*2;part(Bx(r*.34,r*.28,.08),col,x+Math.cos(a)*(r+.04),y+Math.sin(a)*(r+.04),-1.22,{rz:a})}part(Cy(r*.3,r*.3,.1,10),'#2a2a30',x,y,-1.22,{rx:PI/2})};gear(2.1,1.6,.5,'#b8923a',14);gear(2.6,.95,.28,'#8a8a94',9);
 part(Cy(.06,.06,3.2,8),'#7a7a84',.6,2.5,-1.15,{rz:PI/2});part(Cy(.05,.05,3,8),'#b8623a',.6,.55,-1.15,{rz:PI/2});for(const x of[-.5,1.2,2.4])part(Cy(.09,.09,.08,8),'#4a4a52',x,2.5,-1.15,{rz:PI/2});
 part(Bx(.85,.58,.02),'#2a4a6a',2.35,2.3,-1.26);for(let i=0;i<5;i++)part(Bx(.6,.012,.012),'#cfe0f0',2.35,2.1+i*.08,-1.24);part(Bx(1.0,.05,.3),'#4a3322',-.2,1.5,-1.12);for(let i=0;i<5;i++)part(Cy(.04,.04,.14,8),'#8a8a94',-.6+i*.18,1.6,-1.12);part(Cy(.06,.06,.01,10),'#a8d8f0',-.1,1.55,-1.0,{rx:PI/2});
 for(let i=0;i<3;i++)part(Bx(.45,.3,.45),i%2?'#5a4028':'#4a3a2a',2.35,.15+i*.3,-.45+i*.02,{ry:i*.4});
 const dg=new THREE.Mesh(Cy(.38,.38,.08,16).rotateX(PI/2),toon('#8a6a2a',{}));add(dg,1.3,1.45,-1.16);for(let i=0;i<10;i++){const a=i/10*PI*2,t=new THREE.Mesh(Bx(.12,.1,.08),dg.material);t.position.set(Math.cos(a)*.42,Math.sin(a)*.42,0);t.rotation.z=a;dg.add(t)}dg.add(hull(dg.geometry,.012,inkFor('#3a2a22')));
 return{upd(F,now){dg.rotation.z=now*.5;if(F.sp.length<MAXS-40&&hash(Math.floor(now*9)*2.3)>.62)F.spawn(1,[-1.4+(hash(now)-.5)*.08,2.45,-.6],.55,'#dfe4ea',1.8,-.3)}}}   // vapor de la caldera

// ENCANTAMIENTO: altar de piedra con círculo de runas que gira, cristal flotante, estantería de libros, velas, estandartes
function bArcane(c){const {part,add,gt}=c;
 part(Bx(1.0,.22,.72),'#2a2a3a',AX+.1,.11,AZ);part(Bx(.8,.5,.52),'#34344a',AX+.1,.47,AZ);for(let i=0;i<5;i++)part(Bx(.14,.02,.02),'#8a6aff',AX-.2+i*.14,ATOP-.002,AZ+.22);
 part(Bx(1.7,2.3,.4),'#2a1c14',-1.9,1.15,-1.1);for(let r=0;r<5;r++){part(Bx(1.7,.05,.42),'#4a3322',-1.9,.25+r*.46,-1.1);for(let i=0;i<9;i++)part(Bx(.12+hash(r*9+i)*.04,.34+hash(r*9+i+5)*.08,.26),['#9a3a4a','#3a5a9a','#4a8a4a','#9a8a3a','#7a4a9a'][(i+r)%5],-2.65+i*.17,.25+r*.46+.2,-.92)}
 for(let i=0;i<4;i++)part(Bx(.5,.07,.36),['#6a2a3a','#2a3a6a','#4a2a5a'][i%3],-.95,.04+i*.075,.5,{ry:i*.2});for(const x of[1.55,2.1]){part(Bx(.3,.42,.02),'#3a1a5a',x,1.55,-1.22);part(Bx(.12,.12,.02),'#c8a8ff',x,1.6,-1.2)}
 part(Cy(.2,.26,.7,8),'#34344a',1.8,.35,-.3);const CD=[[1.2,.2,.4,.2],[1.5,.2,.6,.14],[2.4,.2,.2,.28],[-.1,.2,.7,.16],[1.0,.5,-.6,.22],[2.5,.9,-.7,.3]];CD.forEach(([x,y,z,h],i)=>{part(Cy(.03,.03,h,6),'#e8dcc0',x,i===5?y+.5:h/2,z)});
 const ring=add(new THREE.Mesh(new THREE.PlaneGeometry(2.6,2.6).rotateX(-PI/2),new THREE.MeshBasicMaterial({map:runeTex(),color:'#9a6aff',transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false})),AX,.065,AZ);
 const crystal=add(new THREE.Mesh(new THREE.OctahedronGeometry(.2,0).scale(1,1.5,1),new THREE.MeshBasicMaterial({color:'#b890ff'})),1.8,1.05,-.3),cg=add(new THREE.Mesh(new THREE.PlaneGeometry(1.2,1.2),new THREE.MeshBasicMaterial({map:gt,color:'#9a6aff',transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false})),1.8,1.05,-.2);
 const fl=CD.map(([x,y,z,h],i)=>add(new THREE.Mesh(new THREE.PlaneGeometry(.18,.18),new THREE.MeshBasicMaterial({map:gt,color:'#ffd28a',transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false})),x,(i===5?y+.5:h)+.06,z));
 return{levit:.14,upd(F,now,dt,k){ring.rotation.y=now*.25;ring.material.opacity=.4+.2*Math.sin(now*1.7)+k.glowK*.2;crystal.position.y=1.05+Math.sin(now*1.3)*.06;crystal.rotation.y=now*.8;cg.material.opacity=.4+.15*Math.sin(now*2.1);fl.forEach((f,i)=>f.material.opacity=.65+.2*Math.sin(now*9+i*2.3));
   if(F.sp.length<MAXS-40&&hash(Math.floor(now*6)*3.3)>.6)F.spawn(1,[AX+(hash(now)-.5)*1.8,.05,AZ+(hash(now*2)-.5)*1.6],.25,'#b890ff',2,-.6)}}}

// tabla de temas: construcción, luces [cielo, suelo, int, llave, int, cálida, int, contraluz, posición cálida], `hot` (calienta la pieza: brillo naranja + fuego), color del brillo de calidad
const TH3={
 forge: {b:bForge,hot:1,gcol:'#ff7a22',room:{wall:'stone',floor:'flag'},lt:['#a4a8c8','#3a2a22',1.0,'#ffe2b8',1.25,'#ff8a3a',.6,'#8fb0c8',[6,1.2,1.5]]},
 carp:  {b:bCarp,hot:0,gcol:'#ffe0a0',room:{wall:'plank',floor:'plank',fb:'#2a2018'},lt:['#b8b0a0','#4a3a2a',1.05,'#ffe8c0',1.35,'#ffc070',.5,'#a0b0c0',[5,2,2]]},
 tan:   {b:bTan,hot:0,gcol:'#ffd8a0',room:{wall:'plank',floor:'flag',fs:['#5a4a3e','#4a3d34','#54463a','#3e3128']},lt:['#a8a8b0','#3e2e22',1.0,'#ffdcb0',1.25,'#e8a060',.55,'#90a0b0',[5,2,2]]},
 sew:   {b:bSew,hot:0,gcol:'#ffe8c0',room:{wall:'plank',floor:'plank',wb:'#3a2c24',fb:'#2a2018'},lt:['#c0b8c8','#4a3a3a',1.15,'#fff0d0',1.3,'#ffd0a0',.5,'#b0b8d0',[5,2,2]]},
 stone: {b:bStone,hot:0,gcol:'#e8e4d8',room:{wall:'stone',floor:'flag',ws:['#6a645a','#5a554c','#726c62','#4e4a44'],fs:['#6a645a','#5a554c','#726c62','#4e4a44']},lt:['#b0b4c0','#3a3630',1.05,'#fff0d8',1.3,'#d0b890',.45,'#a0b0c0',[5,2,2]]},
 jewel: {b:bJewel,hot:1,gcol:'#ffe090',room:{wall:'plank',floor:'plank',wb:'#2a2018',fb:'#1e1812'},lt:['#9890a8','#2a2018',.8,'#ffe0b0',1.1,'#ffb060',.7,'#8090b0',[5,2,2]]},
 tinker:{b:bTinker,hot:0,gcol:'#ffd890',room:{wall:'stone',floor:'flag',ws:['#4a4a52','#3e3e46','#525258','#36363e'],fs:['#4a4a52','#3e3e46','#52525a']},lt:['#a0a8b8','#34343a',1.0,'#ffe8c8',1.2,'#ffa040',.5,'#80a0c0',[5,2,2]]},
 arcane:{b:bArcane,hot:0,gcol:'#b890ff',room:{wall:'stone',floor:'flag',ws:['#2e2e40','#26263a','#34344a','#22222e'],fs:['#2e2e40','#26263a','#34344a'],wb:'#1e1e2c',fb:'#16161e'},lt:['#9a8ac8','#2c2a3e',1.35,'#e0d4ff',1.45,'#9a6aff',.8,'#8090e0',[5,2,2]]}};

export class Forge3D{
 constructor(r,getDrops){this.r=r;this.getDrops=getDrops;this.on=false;this.ok=true;this.scenes={};this.T=null;this.hero=null;this.out=null;this.cx=null;this.rectFn=null;this.act=null;this.st=null;this.last=0;this.t=0;this.theme='forge';
  this.sp=[];this.fire=0;this.quenchT=0;this.shake=0;this.pump=0;this.stats={ms:0,calls:0,tris:0};this.warm={intensity:0}}
 // ───────── una escena por tema (cacheada) ─────────
 scene(id){if(this.scenes[id])return this.scenes[id];const def=TH3[id]||TH3.forge,sc=new THREE.Scene(),gt=this.gt||(this.gt=glowTex()),add=(o,x,y,z)=>{o.position.set(x,y,z);sc.add(o);return o};
  const lt=def.lt,hemi=new THREE.HemisphereLight(lt[0],lt[1],lt[2]),key=new THREE.DirectionalLight(lt[3],lt[4]);key.position.set(-3,5,4);const warm=new THREE.DirectionalLight(lt[5],lt[6]);warm.position.set(...lt[8]);const rim=new THREE.DirectionalLight(lt[7],.6);rim.position.set(-2,3,-5);const win=new THREE.DirectionalLight('#b8d0ff',.3);win.position.set(.6,5,1.2);sc.add(hemi,key,warm,rim,win);
  const L=[],part=(geo,col,x,y,z,o={})=>{let g=(geo.index?geo.toNonIndexed():geo.clone());if(o.rx)g.rotateX(o.rx);if(o.ry)g.rotateY(o.ry);if(o.rz)g.rotateZ(o.rz);if(o.s)g.scale(o.s,o.s,o.s);g.translate(x,y,z);g.deleteAttribute('uv');
   const c=new THREE.Color(col),n=g.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++){a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b}g.setAttribute('color',new THREE.BufferAttribute(a,3));L.push(g)};
  shell(part,def.room);const F=this,ctx={part,add,sc,F,gt},dyn=def.b(ctx);
  {const G=mergeGeometries(L,false),mesh=new THREE.Mesh(G,toon('#ffffff',{vc:true}));mesh.add(hull(G,.016,inkFor('#3a2a22')));sc.add(mesh)}   // contorno marrón oscuro (nunca negro puro)
  // comunes dinámicos: lámpara con halo, rayo de luz de la ventana, cielo tras la ventana, partículas, sombra de contacto, resplandor sobre la estación y la pieza
  add(new THREE.Mesh(new THREE.SphereGeometry(.07,10,8),new THREE.MeshBasicMaterial({color:'#ffd28a'})),-.25,2.26,-.8);const lampGlow=add(new THREE.Mesh(new THREE.PlaneGeometry(1.4,1.4),new THREE.MeshBasicMaterial({map:gt,color:'#ffb050',transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false})),-.25,2.26,-.7);
  const shaft=add(new THREE.Mesh(new THREE.PlaneGeometry(.95,2.4),new THREE.MeshBasicMaterial({map:shaftTex(),color:'#bcd4ff',transparent:true,opacity:.2,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})),1.1,1.1,-.55);shaft.rotation.z=-.2;shaft.rotation.y=.15;
  add(new THREE.Mesh(new THREE.PlaneGeometry(.78,.9),new THREE.MeshBasicMaterial({color:id==='arcane'?'#4a4a8a':'#9cb4d8'})),.95,2.05,-1.34);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(MAXS*3),3));g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(MAXS*3),3));
  const pts=new THREE.Points(g,new THREE.PointsMaterial({size:.06,map:gt,vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true}));g.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,1,0),20);sc.add(pts);   // siempre visible sin tocar frustumCulled (trinquete de rules_check)
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.3,16).rotateX(-PI/2).scale(1.5,1,.8),new THREE.MeshBasicMaterial({color:'#000000',transparent:true,opacity:.35,depthWrite:false}));shadow.position.set(AX,ATOP+.004,AZ);sc.add(shadow);
  const pg=new THREE.Group();pg.position.set(AX,ATOP,AZ);sc.add(pg);const gd=new THREE.Mesh(new THREE.CircleGeometry(.4,18).rotateX(-PI/2),new THREE.MeshBasicMaterial({color:def.gcol,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));gd.position.set(AX,ATOP+.012,AZ);sc.add(gd);
  const pieceFire=def.hot?makeShell('fuego'):null;if(pieceFire)sc.add(pieceFire.mesh);
  const cam=new THREE.PerspectiveCamera(30,2.67,.1,60);
  return this.scenes[id]={id,def,sc,cam,pts,pg,shadow,gd,lampGlow,shaft,warm,hemi,key,dyn,pieceFire,piece:null,pk:'',plen:.5,phh:.1}}
 // ───────── pieza 3D (modelo real del objeto) ─────────
 setPiece(T,outId){if(T.pk===outId&&T.piece)return;T.pk=outId;while(T.pg.children.length)T.pg.remove(T.pg.children[0]);T.piece=null;
  const D=this.getDrops&&this.getDrops();let t=null;try{t=D&&D.tpl?D.tpl(outId):null}catch(e){}if(!t||!t.h)return;
  const root=new THREE.Group(),item=cl(t.h);item.updateMatrixWorld(true);const bx=new THREE.Box3().setFromObject(item),sz=bx.getSize(new THREE.Vector3()),ct=bx.getCenter(new THREE.Vector3());
  // la pieza se tumba sobre la estación: su dimensión mayor a lo largo de x; escala para medir ≈ .5 (cabe en la cara de trabajo, a la DERECHA del héroe)
  const mx=Math.max(sz.x,sz.y,sz.z,.01),k=(t.flat?.55:.5)/mx;item.position.set(-ct.x*k,-ct.y*k,-ct.z*k);item.scale.multiplyScalar(k);
  const wrap=new THREE.Group();wrap.add(item);if(sz.y>sz.x&&sz.y>sz.z)wrap.rotation.z=-PI/2;
  wrap.updateMatrixWorld(true);{const b2=new THREE.Box3().setFromObject(wrap),s2=b2.getSize(new THREE.Vector3());wrap.position.y=-b2.min.y+.005;T.plen=Math.max(s2.x,.2);T.phh=s2.y}
  const ghost=new THREE.Group(),heat=new THREE.Group(),gm=new THREE.MeshBasicMaterial({color:'#e8cf94',wireframe:true,transparent:true,opacity:.28,depthWrite:false}),hm=new THREE.MeshBasicMaterial({color:T.def.gcol,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
  const mkLayer=(src,mat,dst)=>{src.traverse(o=>{if(o.isMesh&&!(o.userData&&o.userData.hull)){const m=new THREE.Mesh(o.geometry,mat);o.updateWorldMatrix(true,false);m.applyMatrix4(wrap.matrixWorld.clone().invert().multiply(o.matrixWorld));dst.add(m)}})};
  wrap.updateMatrixWorld(true);mkLayer(item,gm,ghost);mkLayer(item,hm,heat);const lay=new THREE.Group();lay.add(ghost,heat);lay.scale.setScalar(1.015);wrap.add(lay);
  root.add(wrap);T.pg.add(root);T.piece={root,item:wrap,heat:hm,ghost:gm}}
 // ───────── API ─────────
 open(o){if(!this.hero){this.hero=new Hero();this.hero.obj.scale.setScalar(HS);this.hero.obj.position.set(HX,0,.02)}
  this.theme=TH3[o.theme]?o.theme:'forge';const T=this.T=this.scene(this.theme);T.sc.add(this.hero.obj);   // el héroe (único) pasa a la escena del oficio
  this.out=o.out;this.cx=o.out.getContext('2d');this.rectFn=o.rectFn;this.on=true;this.act=null;this.sp.length=0;this.last=performance.now();this.fire=0;this.quenchT=0;this.pump=0;this.warm=T.warm;
  this.hero.setLook(o.look||{});this.dress(o.ofg||{});this.setPiece(T,o.outId)}
 /* N0.7 (3 nov 2026) ROPA DE OFICIO en el héroe del taller: gorro (cabeza), mandil (cuerpo) y guantes (manos) del oficio abierto, con el color del tier
    del objeto equipado (`ofg` = {h,d,g: color}, lo arma forge.js desde S.eqt). Piezas HIJAS de los huesos de Mini (en sus coordenadas locales, las mismas que armor3d.js): siguen la animación.
    Se quitan y se vuelven a poner en cada apertura (`userData.ofg`). Solo en el diorama: en el mundo el héroe no las lleva. */
 dress(ofg){const m=this.hero&&this.hero.m;if(!m)return;const old=[];m.obj.traverse(x=>{if(x.userData&&x.userData.ofg)old.push(x)});old.forEach(x=>x.parent&&x.parent.remove(x));
  const W=m.W||1,ink=inkFor('#3a2a22'),put=(geo,col,par,x,y,z)=>{if(!par)return;const q=new THREE.Mesh(geo,toon(col,{}));q.position.set(x,y,z);q.add(hull(geo,.012,ink));q.userData.ofg=1;par.add(q);return q},dk=c=>'#'+new THREE.Color(c).multiplyScalar(.62).getHexString(),
   lea=c=>'#'+new THREE.Color('#7a5232').lerp(new THREE.Color(c),.35).getHexString();
  if(ofg.h){put(new THREE.SphereGeometry(.226,16,8,0,PI*2,0,1.18).scale(1,.78,1.02),lea(ofg.h),m.head,0,.05,-.005);put(new THREE.CylinderGeometry(.222,.232,.035,18),dk(lea(ofg.h)),m.head,0,.06,-.005)}   // gorro de oficio con banda
  if(ofg.d&&m.body){const c=lea(ofg.d),R=.205*W;put(new THREE.CylinderGeometry(R*1.06,R*1.2,.42,14,1,true,-1.05,2.1),c,m.body,0,.3,0);   // falda del mandil (arco delantero del torso a los muslos)
   put(new THREE.BoxGeometry(.2*W,.24,.014),c,m.body,0,.62,R*1.02);put(new THREE.TorusGeometry(.1,.008,4,14,PI),dk(c),m.body,0,.74,R*.55);put(new THREE.TorusGeometry(R*1.07,.012,4,20,2.3).rotateX(PI/2).rotateY(PI/2-1.15),dk(c),m.body,0,.5,0)}   // peto, tira del cuello y cinta
  if(ofg.g)(m.hands||[]).forEach(h=>put(new THREE.SphereGeometry(.047,10,8).scale(1.08,1.05,1.12),dk(lea(ofg.g)),h,0,0,0))}   // guante ajustado a la mano (un puño cilíndrico se leía como una taza)
 close(){this.on=false;this.act=null}
 setAct(a){this.act=a}
 setSt(st){this.st=st}
 spawn(n,pos,vel,col,life,g=6){for(let i=0;i<n&&this.sp.length<MAXS;i++){const a=hash(this.t*91+i*13+this.sp.length)*PI*2,e=hash(this.t*57+i*7)*PI*.5,sp=vel*(.4+hash(i*3+this.t*31)*.9);this.sp.push({x:pos[0],y:pos[1],z:pos[2],vx:Math.cos(a)*Math.cos(e)*sp,vy:Math.sin(e)*sp*1.1+vel*.15,vz:Math.sin(a)*Math.cos(e)*sp,t:0,life:life*(.6+hash(i*5+this.t*17)*.7),g,c:Array.isArray(col)?col[i%col.length]:col})}}
 // golpe/acción: cada tema puede tener su efecto (`burst` de su builder); si no, por tipo de partícula `k` (0 chispa · 1 mota · 2 humo · 3 gota · 4 viruta/astilla) y los colores de la acción
 burst(spr,pow,exc,cols,k){const T=this.T;if(!T)return;const x=AX-.12+(hash(this.t*7)-.5)*.2,y=ATOP+.1;if(T.dyn.burst&&T.dyn.burst(this,spr,pow,exc,x,y))return;
  const c=cols&&cols.length?cols:['#ffffff'];
  if(k===0)this.spawn(Math.round(16*pow)+(exc?10:0),[x,y,AZ],2.3,c,.6,9);else if(k===2)this.spawn(8,[x,y+.05,AZ],.5,c,1.4,-.8);else if(k===3)this.spawn(10,[x,y,AZ],1.3,c,.8,8);else if(k===4)this.spawn(Math.round(14*pow)+(exc?8:0),[x,y,AZ],2.0,c,.7,10);else this.spawn(Math.round(10*pow)+(exc?8:0),[x,y,AZ],1.0,c,1.0,-.5);
  if(spr==='hammer'||spr==='saw'||spr==='knife')this.shake=Math.max(this.shake,.4*pow)}
 // ───────── fotograma (lo llama R3D tras dibujar el mundo) ─────────
 frame(r){const T=this.T;if(!this.on||!T||!this.out||!this.rectFn||!this.hero||!this.hero.m&&!this.hero.look)return;const t0=performance.now(),now=t0/1000,dt=Math.min(.05,this.last?(t0-this.last)/1000:.016);this.last=t0;this.t=now;
  const q=this.rectFn(),dom=r.domElement,cr=dom.getBoundingClientRect();if(!q||q.width<40||q.height<20||!cr.width)return;
  const sx=dom.width/cr.width,sy=dom.height/cr.height;let x=Math.round((q.left-cr.left)*sx),y=Math.round((q.top-cr.top)*sy),w=Math.round(q.width*sx),h=Math.round(q.height*sy);
  if(x<0){w+=x;x=0}if(y<0){h+=y;y=0}if(x+w>dom.width)w=dom.width-x;if(y+h>dom.height)h=dom.height-y;if(w<32||h<16)return;const yb=dom.height-(y+h),pr=r.getPixelRatio();
  const st=this.st||{},def=T.def,pg=clamp(st.pg||0,0,1),heat=def.hot?clamp((st.heat||0)*.85+(st.cond==='excelente'?.15:0),0,1):0,en=st.end&&st.end.ok?st.end:null,eu=en?ss(0,.7,en.t):0,glowK=st.glow||0;
  // ── actualizar la escena ──
  this.fire=Math.max(0,this.fire-dt*.5);this.quenchT=Math.max(0,this.quenchT-dt*.9);this.shake=Math.max(0,this.shake-dt*6);this.pump=Math.max(0,this.pump-dt*1.6);
  T.lampGlow.material.opacity=.42+.1*Math.sin(now*7.3)+.06*Math.sin(now*13);T.shaft.material.opacity=.17+.04*Math.sin(now*.7);
  T.dyn.upd(this,now,dt,{heat,glowK,st,en});
  if(this.sp.length<MAXS-40&&hash(Math.floor(now*3)*9.1)>.5)this.spawn(1,[-1+hash(now*2)*3.4,.4+hash(now)*1.6,-.3+hash(now*5)*1.2],.04,'#9aa8b8',3.2,0);   // motas de polvo en el rayo de luz
  if(glowK>.3&&hash(Math.floor(now*12)*5.3)>.8)this.spawn(1,[AX+(hash(now*3)-.5)*.5,ATOP+.1,AZ],.5,st.cond==='excelente'?'#fff1b0':def.gcol,1.1,-2);
  const pcc=T.piece,lv=T.dyn.levit||0;if(pcc){const lift=(st.lift||0)*.1+eu*.3+lv*(1+Math.sin(now*1.6)*.25),sq=st.squash||0,sc=lerp(.62,1,ss(0,.9,pg))*(1+sq*.3)*(en?1.3:1);
   pcc.root.scale.set(sc,sc*(1-sq*.6),sc);pcc.root.position.set(0,lift,0);pcc.root.rotation.y=eu*now*.9+(lv?now*.4:0);pcc.heat.opacity=clamp(heat*.55+glowK*.3+(en?.3:0),0,.85)*(1-ss(.9,1,pg)*(en?0:.4));pcc.ghost.opacity=.3*(1-ss(.55,1,pg));T.gd.material.opacity=clamp(heat*.3+glowK*.2,0,.5)*(.8+.2*Math.sin(now*6));
   if(T.pieceFire){const pl=T.plen*sc,pf=clamp(Math.max(glowK*1.1,(heat-.55)*2),0,1)*(1-ss(.96,1,pg)*(en?0:.6));T.pieceFire.set(new THREE.Vector3(AX-pl/2,ATOP+T.phh*.5*sc+lift,AZ),new THREE.Vector3(1,0,0),pl,Math.max(.02,.03*sc),.1*sc,now,1.0,pf*.8)}}
  // partículas (CPU, 1 draw)
  const P=T.pts.geometry.attributes.position,Cc=T.pts.geometry.attributes.color,col=new THREE.Color();let n=0;
  for(let i=this.sp.length-1;i>=0;i--){const p=this.sp[i];p.t+=dt;if(p.t>p.life){this.sp.splice(i,1);continue}p.vy-=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;if(p.y<.02&&p.vy<0){p.y=.02;p.vy*=-.3;p.vx*=.6;p.vz*=.6}}
  for(const p of this.sp){const a=1-p.t/p.life;P.setXYZ(n,p.x,p.y,p.z);col.set(p.c).multiplyScalar(clamp(a*1.5,0,1)*(p.g===0?.35:1));Cc.setXYZ(n,col.r,col.g,col.b);n++}
  for(let i=n;i<MAXS;i++){P.setXYZ(i,0,-50,0);Cc.setXYZ(i,0,0,0)}T.pts.geometry.setDrawRange(0,MAXS);P.needsUpdate=true;Cc.needsUpdate=true;
  // héroe real, de perfil a la izquierda de la estación: mismo clip y herramientas que en el mundo (act = actState del juego)
  this.hero.update({x:0,y:0,z:0,mv:false,run:false,t:now,face:[1,.22],night:0,wind:[.9,.4],hurt:0,act:this.act||null},dt);
  // cámara FIJA (decisión del dueño: es un minijuego): llena el cuadro con el héroe; solo pulso de zoom y sacudida de los golpes; en el remate se acerca a héroe+pieza
  const cam=T.cam,zp=(st.zp||0),sh=this.shake*.012;cam.fov=30/(1+zp+eu*.1);cam.aspect=w/h;cam.updateProjectionMatrix();
  cam.position.set(lerp(.2,.15,eu)+(hash(now*60)-.5)*sh,lerp(1.25,1.2,eu)+(hash(now*60+5)-.5)*sh,lerp(3.85,3.4,eu));cam.lookAt(lerp(.1,.05,eu),lerp(.8,.85,eu),0);
  // ── dibujar en el hueco de pantalla del lienzo de la hoja y copiar ──
  const ac=r.autoClear,sci=r.getScissorTest(),vp=new THREE.Vector4(),sz=new THREE.Vector4(),cc=new THREE.Color(),ca=r.getClearAlpha(),c0=r.info.render.calls,t00=r.info.render.triangles;r.getViewport(vp);r.getScissor(sz);r.getClearColor(cc);
  r.setRenderTarget(null);r.autoClear=false;r.setViewport(x/pr,yb/pr,w/pr,h/pr);r.setScissor(x/pr,yb/pr,w/pr,h/pr);r.setScissorTest(true);r.setClearColor('#0d0907',1);r.clear(true,true,true);
  r.render(T.sc,cam);
  this.stats.calls=r.info.render.calls-c0;this.stats.tris=r.info.render.triangles-t00;r.info.render.calls=c0;r.info.render.triangles=t00;   // no cuenta contra el presupuesto del mundo
  const o=this.out;if(o.width>0&&o.height>0)this.cx.drawImage(dom,x,y,w,h,0,0,o.width,o.height);
  r.setScissorTest(sci);r.setScissor(sz);r.setViewport(vp);r.setClearColor(cc,ca);r.autoClear=ac;this.stats.ms+=(performance.now()-t0-this.stats.ms)*.1}
}
