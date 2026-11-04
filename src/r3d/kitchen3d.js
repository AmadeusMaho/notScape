// NotScape · R3D · COCINA Y ALQUIMIA EN 3D (4 nov 2026 · lote N0.7-COCINA-ALQUIMIA-3D · el dueño: «la cocina mostraría al jugador cocinando con distintas animaciones para todo lo que se hace, igual que ahora pero en 3D con los platos en 3D;
// la alquimia, un diorama 3D donde la olla y todo sea interactuable como se interactúa ahora»).
// Mismo principio que forge3d.js: SIN contexto WebGL nuevo; se dibuja con el renderer PRINCIPAL en el hueco de pantalla del lienzo de la ventana (viewport + scissor) tras el mundo y se COPIA al lienzo 2D de la ventana
// (`out`). El mundo se congela mientras tanto (FZ de r3d.js, `on`).
// ── COCINA (`mode:'cook'`) ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
//   La lógica y los pasos siguen en cookauto.js (picar/limpiar → al fuego → cocinar → sazonar → emplatar). Cada fotograma cookauto.js llama `K.setCook({m,k,p,n,it,items,sel,res,st,cond,broth})` con el estado de la escena y
//   `K.cookFx(nombre,…)` en los momentos de cada paso (corte, raspado, caída al recipiente, volteo, salero, emplatado). Aquí: cocina de piedra con encimera, tabla de cortar, fogón con 4 recipientes (olla g · sartén s · parrilla p · horno h),
//   los INGREDIENTES (modelo 3D real del objeto: `R3D.drops.tpl`), el PLATO FINAL en 3D, y el HÉROE REAL con un clip propio por acción (wck picar · ds limpiar pescado · wtoss echar · co remover · wfl voltear · wshk sazonar · wplt emplatar).
// ── ALQUIMIA (`mode:'alch'`) ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
//   La lógica y el ratón siguen EXACTAMENTE en alchemy.js (mismos objetos, mismas coordenadas 800×460). Aquí cada objeto del laboratorio es un modelo 3D (olla con líquido, mortero con trozos y polvo, mano de mortero, frascos del estante,
//   fuelle, botella, jarra, cuchara, botellas de base, fuego) colocado por la MISMA posición 2D en una cámara ORTOGONAL inclinada 17° (la elipse de la boca de la olla coincide con la del dibujo 2D), así lo que se toca es lo que se ve.
//   `K.setAlch(view)` recibe un objeto con referencias al estado del alambique (alchemy.js `view3()`).
// COSTE: estático fusionado (color por vértice + contorno), ≈ 60–120 llamadas, SIN sombras ni PointLight; 1 Points de partículas.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {HeroSel as Hero} from './herosel3d.js';
import {toon,hull,inkFor} from './materials3d.js';
import {hearth,hash,Bx,Cy,Sp,shell,table,glowTex,cl,HX,HS,AX,ATOP,MAXS,WOODS} from './forge3d.js';

const PI=Math.PI,clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,ss=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)},ease=x=>1-Math.pow(1-clamp(x,0,1),3);
const INK=inkFor('#3a2a22');

// ── utilidades de modelado: lista de geometrías con color por vértice → 1 malla + contorno ──
function mkPart(L){return (geo,col,x,y,z,o={})=>{let g=(geo.index?geo.toNonIndexed():geo.clone());if(o.rx)g.rotateX(o.rx);if(o.ry)g.rotateY(o.ry);if(o.rz)g.rotateZ(o.rz);if(o.sx||o.sy||o.sz)g.scale(o.sx||1,o.sy||1,o.sz||1);if(o.s)g.scale(o.s,o.s,o.s);g.translate(x,y,z);g.deleteAttribute('uv');
 const c=new THREE.Color(col),n=g.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++){a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b}g.setAttribute('color',new THREE.BufferAttribute(a,3));L.push(g)}}
function bake(L,ink=.016){const G=mergeGeometries(L,false),m=new THREE.Mesh(G,toon('#ffffff',{vc:true}));if(ink)m.add(hull(G,ink,INK));return m}
const lathe=(pts,seg=18)=>new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),seg);
const lam=(c,o={})=>new THREE.MeshLambertMaterial(Object.assign({color:c},o));
const ink3=(mesh,w,col)=>{mesh.add(hull(mesh.geometry,w,col||INK));return mesh};

export class Kitchen3D{
 constructor(r,getDrops){this.r=r;this.getDrops=getDrops;this.on=false;this.ok=true;this.mode=null;this.scenes={};this.hero=null;this.out=null;this.cx=null;this.rectFn=null;this.last=0;this.t=0;this.sp=[];
  this.cs={};this.fxq=[];this.view=null;this.shake=0;this.stats={ms:0,calls:0,tris:0};this.items=[];this.dish=null;this.dishId=null;this.tplc={}}
 // ───────── escenas (una por modo, cacheadas) ─────────
 scene(mode){if(this.scenes[mode])return this.scenes[mode];const sc=new THREE.Scene(),gt=this.gt||(this.gt=glowTex()),add=(o,x,y,z)=>{o.position.set(x,y,z);sc.add(o);return o};
  const T={mode,sc,gt,add,cam:null,dyn:null};
  if(mode==='cook'){const hemi=new THREE.HemisphereLight('#c0b8c8','#4a3a2a',1.05),key=new THREE.DirectionalLight('#ffe8c0',1.3),warm=new THREE.DirectionalLight('#ffa850',.7),rim=new THREE.DirectionalLight('#a0b0c8',.6);key.position.set(-3,5,4);warm.position.set(5,2,2);rim.position.set(-2,3,-5);sc.add(hemi,key,warm,rim);
   T.cam=new THREE.PerspectiveCamera(30,2.67,.1,60);T.dyn=this.buildCook(T)}
  else{const hemi=new THREE.HemisphereLight('#e8d8c0','#5a4a3a',1.5),key=new THREE.DirectionalLight('#ffe2b8',1.25),warm=new THREE.DirectionalLight('#ff9a48',.8),rim=new THREE.DirectionalLight('#8aa0c8',.45);key.position.set(-250,350,450);warm.position.set(120,-60,300);rim.position.set(200,300,-200);sc.add(hemi,key,warm,rim);
   const c=Math.cos(this.TH);T.cam=new THREE.OrthographicCamera(-400,400,230,-230,1,3000);T.cam.position.set(0,Math.sin(this.TH)*1200,Math.cos(this.TH)*1200);T.cam.lookAt(0,0,0);T.dyn=this.buildAlch(T)}
  // partículas (CPU, 1 draw)
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(MAXS*3),3));g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(MAXS*3),3));
  const big=mode==='alch';T.pts=new THREE.Points(g,new THREE.PointsMaterial({size:big?7:.07,map:gt,vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:!big}));g.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,0,0),2000);sc.add(T.pts);
  return this.scenes[mode]=T}
 get TH(){return .2967}   // 17°: elevación de la cámara de la alquimia (sen = ry/rx de la boca de la olla en el dibujo 2D)
 // ───────── API común ─────────
 open(o){this.mode=o.mode==='alch'?'alch':'cook';if(this.mode==='cook'&&!this.hero){this.hero=new Hero();this.hero.obj.scale.setScalar(HS);this.hero.obj.position.set(HX,0,.02)}
  const T=this.T=this.scene(this.mode);if(this.mode==='cook'){T.sc.add(this.hero.obj);this.hero.setLook(o.look||{})}
  this.out=o.out;this.cx=o.out.getContext('2d');this.rectFn=o.rectFn;this.on=true;this.sp.length=0;this.cs={};this.fxq.length=0;this.view=null;this.last=performance.now();this.dishId=null;this.H=null;this.clearItems()}
 close(){this.on=false;if(this.T&&this.hero)this.T.sc.remove(this.hero.obj)}
 spawn(n,pos,vel,col,life,g=6,k=1){for(let i=0;i<n&&this.sp.length<MAXS;i++){const a=hash(this.t*91+i*13+this.sp.length)*PI*2,e=hash(this.t*57+i*7)*PI*.5,sp=vel*(.4+hash(i*3+this.t*31)*.9);this.sp.push({x:pos[0],y:pos[1],z:pos[2],vx:Math.cos(a)*Math.cos(e)*sp*k,vy:Math.sin(e)*sp*1.1+vel*.15,vz:Math.sin(a)*Math.cos(e)*sp*k,t:0,life:life*(.6+hash(i*5+this.t*17)*.7),g,c:Array.isArray(col)?col[i%col.length]:col})}}
 // modelo 3D de un objeto (comida, plato…) normalizado a `size` de lado mayor; si no hay modelo, una esfera del color dado
 model(id,size,col){const D=this.getDrops&&this.getDrops();let t=null;try{t=D&&D.tpl?D.tpl(id):null}catch(e){}const w=new THREE.Group();
  if(t&&t.h){const it=cl(t.h);it.updateMatrixWorld(true);const bx=new THREE.Box3().setFromObject(it),sz=bx.getSize(new THREE.Vector3()),ct=bx.getCenter(new THREE.Vector3()),k=size/Math.max(sz.x,sz.y,sz.z,.01);it.position.set(-ct.x*k,-bx.min.y*k,-ct.z*k);it.scale.multiplyScalar(k);w.add(it);w.userData.h=sz.y*k;return w}
  const m=new THREE.Mesh(new THREE.SphereGeometry(size*.42,10,8),lam(col||'#c8a060'));m.position.y=size*.42;w.add(m);w.userData.h=size*.84;return w}
 clearItems(){const T=this.T;if(!T||!T.dyn||!T.dyn.itemsG)return;const G=T.dyn.itemsG;while(G.children.length)G.remove(G.children[0]);this.items.length=0;if(this.dish&&this.dish.parent)this.dish.parent.remove(this.dish);this.dish=null}
 // ═════════════════════════════════════ COCINA ═════════════════════════════════════
 buildCook(T){const {sc,add,gt}=T,L=[],part=mkPart(L);
  shell(part,{wall:'stone',floor:'flag',ws:['#5a5048','#4e453f','#625850','#443c36'],fs:['#5e544c','#4e453f','#665c52'],wb:'#2e2724',fb:'#26201c'});
  // encimera larga (cara a la cintura del héroe, como los talleres) y fogón de piedra a la derecha
  table(part,.78,0,2.1,1.1,.71,'#7a5636','#4a3220');part(Bx(2.1,.06,.12),'#3a2a1c',.78,.5,.5);
  part(Bx(1.15,.2,.78),'#5a5048',.4,.81,-.38);part(Bx(1.1,.8,.28),'#4e453f',.4,1.3,-.9);part(Bx(.34,1.2,.3),'#40382f',.4,2.2,-.9);part(Bx(.74,.16,.06),'#0d0806',.4,.8,.0);   // fogón de piedra con boca del fuego, campana y chimenea
  part(Bx(.74,.04,.46),'#b8905a',.15,.745,.25);part(Bx(.74,.02,.46),'#9a7444',.15,.77,.25);   // tabla de cortar (alcance de las manos del héroe)
  [[.1,.9],[.6,1.0],[1.0,.95]].forEach(([x,y],i)=>part(Cy(.012,.012,.5,4),'#2a2a2a',x+.4+i*.3,2.55,-.9));   // cacharros colgados detrás
  for(let i=0;i<3;i++){part(Cy(.07,.1,.14,10),['#c0a070','#a08850','#8a7a58'][i],1.15+i*.2,.78,-.45);}   // cuencos al fondo
  part(Bx(.5,.05,.34),'#6a4a30',.85,.745,.42);   // posavasos del plato
  T.bg=bake(L);sc.add(T.bg);
  // cuatro recipientes (solo uno visible según el método): olla g · sartén s · parrilla p · horno h
  const VX=.4,VZ=-.38,VY=.91,vs={};
  {const l=[],p=mkPart(l);p(Cy(.4,.34,.34,18),'#33343c',0,.17,0);p(new THREE.TorusGeometry(.4,.025,5,20).rotateX(PI/2),'#2a2a30',0,.34,0);p(Bx(.14,.05,.06),'#2a2a30',-.46,.3,0);p(Bx(.14,.05,.06),'#2a2a30',.46,.3,0);vs.g=bake(l)}
  {const l=[],p=mkPart(l);p(Cy(.46,.38,.07,20),'#2c2c32',0,.035,0);p(new THREE.TorusGeometry(.46,.018,5,22).rotateX(PI/2),'#232328',0,.07,0);p(Bx(.62,.035,.09),'#3a3030',-.78,.06,0);vs.s=bake(l)}
  {const l=[],p=mkPart(l);p(Bx(1.0,.05,.62),'#2a2a2e',0,.2,0);for(let i=0;i<9;i++)p(Cy(.012,.012,.62,5),'#44444a',-.44+i*.11,.235,0,{rx:PI/2});[[-.46,-.28],[.46,-.28],[-.46,.28],[.46,.28]].forEach(([x,z])=>p(Bx(.05,.2,.05),'#2a2a2e',x,.1,z));vs.p=bake(l)}
  {const l=[],p=mkPart(l);p(Bx(1.0,.62,.78),'#6a5e52',0,.31,0);p(Bx(.74,.4,.08),'#0d0806',0,.28,.38);p(Bx(.84,.08,.1),'#40382f',0,.5,.4);[-.4,.4].forEach(x=>p(Bx(.1,.5,.1),'#40382f',x,.28,.4));p(Bx(.9,.06,.7),'#52483e',0,.64,0,{rx:0});p(Bx(.7,.03,.34),'#33343c',0,.075,.52);p(Bx(.7,.05,.03),'#2a2a30',0,.1,.7);vs.h=bake(l)}   // bandeja extraída: las piezas se hornean sobre ella, a la vista
  const V=new THREE.Group();V.position.set(VX,VY,VZ);sc.add(V);Object.keys(vs).forEach(k=>{vs[k].visible=false;V.add(vs[k])});
  // líquido / aceite / brasas (planos dinámicos)
  const liq=add(new THREE.Mesh(new THREE.CircleGeometry(.36,22).rotateX(-PI/2),new THREE.MeshBasicMaterial({color:'#a8692e'})),VX,VY+.3,VZ);
  const oil=add(new THREE.Mesh(new THREE.CircleGeometry(.4,22).rotateX(-PI/2),new THREE.MeshBasicMaterial({color:'#c8a050',transparent:true,opacity:.7})),VX,VY+.065,VZ);
  const fire=hearth(.62,.38);fire.mesh.position.set(VX,.86,.04);sc.add(fire.mesh);
  const ember=add(new THREE.Mesh(new THREE.PlaneGeometry(1.2,1.2),new THREE.MeshBasicMaterial({map:gt,color:'#ff7a2a',transparent:true,opacity:.0,blending:THREE.AdditiveBlending,depthWrite:false})),VX,VY-.05,.1);
  // puerta del horno (se abre)
  const door=new THREE.Group();door.position.set(VX,VY+.0,VZ+.4);{const l=[],p=mkPart(l);p(Bx(.74,.4,.05),'#40382f',0,.2,0);p(Bx(.5,.18,.02),'#d8b070',0,.22,.03);p(Bx(.3,.04,.06),'#2a2a30',0,.38,.04);door.add(bake(l))}door.visible=false;sc.add(door);
  // plato (se desliza hasta la encimera al emplatar)
  const plate=new THREE.Group();{const l=[],p=mkPart(l);p(Cy(.3,.22,.035,22),'#e8e0d0',0,.0175,0);p(Cy(.2,.18,.012,22),'#d0c8b8',0,.04,0);p(new THREE.TorusGeometry(.3,.012,4,24).rotateX(PI/2),'#f0e8d8',0,.035,0);plate.add(bake(l,.008))}plate.visible=false;sc.add(plate);
  const glow=add(new THREE.Mesh(new THREE.CircleGeometry(.5,24).rotateX(-PI/2),new THREE.MeshBasicMaterial({color:'#ffe8a0',transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false})),1.0,.76,.5);
  const itemsG=new THREE.Group();sc.add(itemsG);
  const shaker=null;
  return{vs,V,liq,oil,fire,ember,door,plate,glow,itemsG,VX,VY,VZ,upd:(F,now,dt)=>F.updCook(T,now,dt)}}
 // ───────── estado de la escena de cocina (lo pone cookauto.js cada fotograma) ─────────
 setCook(s){this.cs=s||{}}
 cookFx(n,a,b){this.fxq.push([n,a,b])}
 slot3(m,i,n){const D=this.T.dyn,sp={g:.5,s:.58,p:.8,h:.54}[m]||.5,y={g:D.VY+.31,s:D.VY+.1,p:D.VY+.27,h:D.VY+.12}[m]||D.VY+.2;return[D.VX+((i+.5)/Math.max(1,n)-.5)*sp*1.1,y,D.VZ+(m==='s'?(i%2?.04:-.04):m==='h'?.52:0)]}
 rowPos(i,n){return[-.12+i*Math.min(.2,.62/Math.max(1,n-1)),.79,.32]}
 syncItems(ids,col){const D=this.T.dyn,key=ids.join('|');if(this.itemKey===key&&this.items.length===ids.length)return;this.itemKey=key;this.clearItems();
  ids.forEach((id,i)=>{const g=new THREE.Group(),a=this.model(id,.26,col&&col[i]),b=this.model(id,.26,col&&col[i]);b.visible=false;g.add(a,b);D.itemsG.add(g);this.items.push({g,a,b,id,pop:-9})})}
 updCook(T,now,dt){const D=T.dyn,s=this.cs||{},m=s.m||'g',k=s.k||'idle',p=s.p||0,ST=s.st||'pick',ids=s.ids||[],n=Math.max(1,ids.length);
  // recipiente visible
  for(const q in D.vs)D.vs[q].visible=(q===m);D.liq.visible=(m==='g');D.oil.visible=(m==='s');D.door.visible=(m==='h');
  D.liq.position.set(D.VX,D.VY+.3,D.VZ);D.oil.position.set(D.VX,D.VY+.075,D.VZ);
  const bc=s.broth||[168,105,46];D.liq.material.color.setRGB(bc[0]/255,bc[1]/255,bc[2]/255);
  const pw=k==='idle'?.55:k==='prep'?.45:k==='fire'?.5+.6*p:k==='cook'?1.2:k==='spice'?1:.7;D.fire.set(.55+pw*.6,now);D.fire.mesh.visible=m!=='h';D.fire.mesh.position.set(D.VX,.88,.06);D.ember.material.opacity=(m==='h'?.35:.12)*(.7+.3*Math.sin(now*9))*pw;
  D.door.rotation.x=m==='h'?1.3:0;
  // ingredientes
  this.syncItems(ids,s.cols);
  const its=this.items;its.forEach((o,i)=>{const it=(s.items&&s.items[i])||{},cut=!!it.cut,[sx,sy,sz]=this.slot3(m,i,n),[rx,ry,rz]=this.rowPos(i,n);let x=sx,y=sy,z=sz,sc=1,rot=0,vis=true;
   if(ST==='pick'||!s.items){const a=(s.tnow!=null?s.tnow:now)-(s.pop&&s.pop[i]!=null?s.pop[i]:-9);y+=a<.45?(1-ease(a/.45))*.5:Math.sin(now*1.7+i*1.9)*(m==='g'?.012:.003);sc=a<0?0:a<.45?.6+.4*ease(a/.45):1;rot=i*1.7}
   else if(k==='prep'){const cur=s.it===i,done=i<s.it&&it.k;if(cur){x=.15;y=.78;z=.25;sc=1.4;rot=0}else{x=rx;y=ry;z=rz;sc=done?.8:.8}}
   else if(k==='fire'){const hp=ease((p*(s.d||.75)-i*.09)/.5);x=rx+(sx-rx)*hp;z=rz+(sz-rz)*hp;y=ry+(sy-ry)*hp+Math.sin(hp*PI)*.42;sc=.8+.2*hp;rot=hp*5}
   else if(k==='plate'||ST==='res'){const q=ST==='res'?1:p;sc=1-ease(q*1.6);rot=i}
   else{const hu=s.flipT!=null&&(m==='s'||m==='p')?Math.min(1,((s.tnow!=null?s.tnow:now)-s.flipT)/.55):1;y+=Math.sin(now*2+i*1.9)*(m==='g'?.01:.002)+(hu<1?Math.sin(hu*PI)*.34:0);rot=i*1.7+(hu<1?hu*PI*2:0)+(k==='cook'?0:0)}
   o.g.position.set(x,y,z);o.g.scale.setScalar(Math.max(.001,sc));o.g.rotation.y=rot;o.g.visible=sc>.01&&vis;
   o.b.visible=cut;if(cut){o.a.position.x=-.045;o.b.position.x=.045;o.a.scale.x=o.b.scale.x=.62}else{o.a.position.x=0;o.a.scale.x=1;o.b.position.x=0}});
  // plato y plato final
  const pl=D.plate;const showP=k==='plate'||ST==='res';pl.visible=showP;const q=ST==='res'?1:ease((p||0)/.6);pl.position.set(lerp(3.2,.85,q),.77,.42);
  if(showP&&s.out&&this.dishId!==s.out){this.dishId=s.out;if(this.dish&&this.dish.parent)this.dish.parent.remove(this.dish);this.dish=this.model(s.out,.32);this.dish.position.set(0,.045,0);pl.add(this.dish)}
  if(this.dish){this.dish.visible=showP;this.dish.rotation.y=ST==='res'?now*.7:0;this.dish.scale.setScalar(ST==='res'?1+Math.sin(now*3)*.03:1)}
  D.glow.material.opacity=ST==='res'?(.25+.12*Math.sin(now*4))*(s.qn>=3?1.5:1):0;D.glow.position.set(.85,.78,.42);
  // vapor constante
  if((k==='cook'||k==='spice'||ST==='res')&&hash(Math.floor(now*14)*3.1)>.55)this.spawn(1,[D.VX+(hash(now*7)-.5)*.5,D.VY+.4,D.VZ],.12,'#b8b0a8',2.2,-.25);
  if(k==='cook'&&(m==='g'||m==='h')&&hash(Math.floor(now*20)*5.3)>.72)this.spawn(1,[D.VX+(hash(now*9)-.5)*.5,D.VY+.32,D.VZ+(hash(now*3)-.5)*.2],.3,'#fff0c8',.7,-1);
  if((m==='s'||m==='p')&&k==='cook'&&hash(Math.floor(now*18)*2.3)>.6)this.spawn(1,[D.VX+(hash(now*5)-.5)*.6,D.VY+.2,D.VZ],.9,['#ffb050','#ffe090'],.5,5);
  // eventos de los pasos
  while(this.fxq.length){const [e,a,b]=this.fxq.shift(),pp=a&&a.length?a:[.4,.8,.1];
   if(e==='chop')this.spawn(8,[.15,.8,.25],1.1,s.chip||'#c8a060',.5,7);else if(e==='scrape')this.spawn(6,[.15,.8,.25],.6,'#cfd8e0',.5,5);
   else if(e==='land'){const [x,y,z]=this.slot3(m,a,n);this.spawn(10,[x,y,z],1.0,[bc.map?'#'+bc.map(v=>Math.round(v).toString(16).padStart(2,'0')).join(''):'#a8692e','#fff0c8'],.6,7);this.shake=.12}
   else if(e==='sear'){this.spawn(14,[D.VX,D.VY+.3,D.VZ],1.2,['#ffd080','#fff0c0'],.6,4);this.shake=.2}
   else if(e==='flip'){this.spawn(10,[D.VX,D.VY+.2,D.VZ],1.3,['#ffd080'],.7,6);this.shake=.15}
   else if(e==='shake')this.spawn(2,[D.VX+(hash(now*9)-.5)*.3,D.VY+.8,D.VZ],.15,a||'#ffffff',.9,5);
   else if(e==='plate'){this.spawn(22,[.85,.9,.42],1.6,['#ffe8a0','#fff4d0'],1.0,-1);this.shake=.25}
   else if(e==='fire'){this.spawn(18,[D.VX,D.VY,D.VZ+.3],1.5,['#ffb050','#ff7a2a'],.9,3);this.shake=.2}
   else if(e==='burst'){this.spawn(20,[.85,.9,.42],1.4,a||['#ffe8a0'],1.0,-1)}}
  // héroe: acción según el paso
  this.hero_(s,now,dt,k,p,m,ST)}
 /* COREOGRAFÍA CÓMICA (el dueño: «posiciona al jugador en cada cosa que haga; el fogón está lejos, que se mueva, de forma cómica y animada»): el héroe se planta ante cada estación
    (tabla de cortar · fogón · plato), con ANTICIPACIÓN (se encoge), CARRERA con rebote y ladeo, FRENADA con derrape y polvo, ATERRIZAJE con estirón, SALTO al voltear la sartén y festejo con saltitos de cara a la cámara
    al terminar. Para ir al plato rodea la mesa por delante (nunca la atraviesa). Las animaciones de cada acción (cookAct) solo se reproducen una vez plantado. */
 hero_(s,now,dt,k,p,m,ST){dt*=this.slowMo||1;   /* gancho de prueba: R3D.kit3d.slowMo=.15 ralentiza la coreografía para capturarla */
  const ST_POS={board:[-.62,.3],stove:[-.56,-.24],plate:[.12,1.0]},FACE={board:[1,.05],stove:[.9,-.12],plate:[.6,-.8]};
  let want='board';if((k==='fire'&&p>.04)||k==='cook'||k==='spice')want='stove';else if(k==='plate'||ST==='res')want='plate';
  let H=this.H;if(!H){H=this.H={x:ST_POS.board[0],z:ST_POS.board[1],want:'board',route:[],ant:0,land:0,sq:0,dust:0,face:FACE.board.slice(),run:false,hop:0,vy:0,fx:1,fz:.05};}
  if(want!==H.want){const from=H.want;H.want=want;H.ant=.16;H.route=[];const front=[-.62,1.0];if(from==='plate'||want==='plate')H.route.push(front);H.route.push(ST_POS[want])}
  let moving=false;const wp=H.route[0];
  if(H.ant>0){H.ant-=dt;H.sq=-.3*Math.min(1,H.ant/.16)}   // anticipación: se encoge antes de salir disparado
  else if(wp){const dx=wp[0]-H.x,dz=wp[1]-H.z,d=Math.hypot(dx,dz);if(d<.04){H.route.shift();if(!H.route.length){H.land=1;this.spawn(14,[HX+(H.x-HX),.03,H.z],.9,'#a89a88',.7,1.5);this.shake=Math.max(this.shake,.12)}}
   else{const sp=Math.min(4.6,1.4+d*5);H.x+=dx/d*sp*dt;H.z+=dz/d*sp*dt;moving=true;H.fx=dx/d;H.fz=dz/d;H.dust-=dt;if(H.dust<=0){H.dust=.1;this.spawn(3,[H.x,.03,H.z],.5,'#a89a88',.5,1.2)}}}
  H.run=moving;const at=!moving&&H.ant<=0&&!H.route.length;
  // aterrizaje con estirón y rebote, carrera con rebotes y ladeo, y salto al voltear
  H.land=Math.max(0,H.land-dt*3.2);let sq=H.sq,hop=0;
  if(moving){hop=Math.abs(Math.sin(now*15))*.1;sq=.07*Math.sin(now*30)}
  else if(H.land>0){sq=-.3*H.land*Math.sin(H.land*PI*2.2)+(H.land>.7?.15:0);hop=H.land*.05*Math.sin(H.land*PI)}
  else if(H.ant<=0)sq=0;
  const flip=(m==='s'||m==='p')&&k==='cook'&&p>=.5&&p<.8;if(flip&&at){const u=(p-.5)/.3;hop+=Math.sin(u*PI)*.34;sq+=Math.sin(u*PI*2)*.1}
  if(ST==='res'&&at){hop+=Math.abs(Math.sin(now*5.2))*.2;sq+=.08*Math.sin(now*10.4)}   // festejo: saltitos
  // orientación: mirando hacia donde corre; plantado, hacia su estación (al terminar, de cara a la cámara)
  const tf=moving?[H.fx,H.fz]:ST==='res'&&at?[0,1]:FACE[H.want];
  H.face[0]+=(tf[0]-H.face[0])*Math.min(1,dt*14);H.face[1]+=(tf[1]-H.face[1])*Math.min(1,dt*14);
  const act=(at&&!(ST==='res'&&false))?this.cookAct(s,now):null;this.cs.actNow=act;
  this.hero.obj.scale.set(HS*(1-sq*.4),HS*(1+sq),HS*(1-sq*.4));
  this.hero.update({x:(H.x-HX)/HS,y:hop/HS,z:(H.z-.02)/HS,mv:moving,run:moving,t:now,face:H.face.slice(),night:0,wind:[.9,.4],hurt:0,lean:moving?.2:0,act},dt)}
 cookAct(s,now){const k=s.k||'idle',p=s.p||0,m=s.m||'g',ST=s.st||'pick',ramp=u=>u<.68?Math.max(.001,u/.68*.999):0,beats=(nb,pp)=>({n:Math.floor(pp*nb),ph:ramp((pp*nb)%1)});
  if(ST==='res')return{k:'wplt',n:0,ph:.9};
  if(k==='prep'){const it=s.itObj;if(it&&it.k==='fish')return{k:'ds',ph:p};const b=beats(3,p);return{k:'wck',n:b.n,ph:b.ph}}
  if(k==='fire'){const b=beats(Math.max(1,(s.ids||[]).length),p);return{k:'wtoss',n:b.n,ph:b.ph}}
  if(k==='cook'){if((m==='s'||m==='p')&&p>=.5&&p<.78)return{k:'wfl',n:1,ph:ramp((p-.5)/.28)};if(m==='h')return null;return{k:'co',ph:p}}
  if(k==='spice'){const b=beats(4,p);return{k:'wshk',n:b.n,ph:b.ph}}
  if(k==='plate'){const b=beats(1,p);return{k:'wplt',n:0,ph:Math.min(.999,Math.max(.001,p*1.1))}}
  return null}
 // ═════════════════════════════════════ ALQUIMIA ═════════════════════════════════════
 /* 2D (800×460) → mundo: la cámara ortogonal está elevada TH sobre el horizonte; los objetos «de pie» se escalan 1/cos en Y para conservar sus píxeles; la referencia de cada objeto va en z=0 */
 P3(x,y,z=0){return new THREE.Vector3(x-400,(230-y)/Math.cos(this.TH),z)}
 buildAlch(T){const {sc,add,gt}=T,c=Math.cos(this.TH),L=[],part=mkPart(L),Y=1/c;
  // pared de piedra oscura, estante de frascos, repisa de bases, mesa de madera, cuerdas con hierbas, viga
  const wall=(w,h,x,y,z,col)=>part(Bx(w,h,6),col,x,y,z);
  wall(860,420,0,(230-170)*Y,-70,'#2a2018');for(let r=0;r<9;r++)for(let k=0;k<14;k++){const w=48+hash(r,k)*26,xx=-420+k*62+(r%2)*30+hash(k,r)*6,yy=(230-r*46-14)*Y;if(hash(r*3,k)>.12)part(Bx(w,34,8),['#3a2e24','#33281f','#40342a','#2e241b'][(r+k)%4],xx,yy,-66)}
  part(Bx(860,10,60),'#5a3f26',0,(230-132)*Y,-30);part(Bx(860,6,60),'#6a4a2c',0,(230-129)*Y,-30);   // estante de frascos (y=132)
  part(Bx(180,8,40),'#5a3f26',(480-400),(230-208)*Y,-30);   // repisa de las 4 botellas de base (y≈208)
  part(Bx(900,150,10),'#8a6238',0,(230-405)*Y,-48);part(Bx(900,12,26),'#a07844',0,(230-338)*Y,-40);for(let i=0;i<7;i++)part(Bx(3,150,12),'#3a2815',-390+i*130,(230-405)*Y,-47);for(let i=0;i<5;i++)part(Bx(900,2,12),'#5a3f26',0,(230-352-i*24)*Y,-47);   // mesa: tablero de frente (los objetos van delante; la elipse de las bocas ya da la perspectiva)
  for(let k=0;k<5;k++){const bx=70+k*170;part(Cy(1.2,1.2,26,4),'#3a2a1a',bx-400,(230-10)*Y,-20)}
  const bg=bake(L,1.4);sc.add(bg);
  // — OLLA (lathe) + fuego + troncos —
  const CX=480,CY=290,pot=new THREE.Group();pot.position.copy(this.P3(CX,CY));pot.scale.y=Y;sc.add(pot);
  {const m=new THREE.Mesh(lathe([[0,-98],[56,-98],[86,-74],[100,-42],[97,-10],[93,0],[88,3],[86,-4],[80,-6]],22),toon('#2c2c34',{}));ink3(m,2.2);pot.add(m);   // casco
   const rim=new THREE.Mesh(new THREE.TorusGeometry(92,4,6,28).rotateX(PI/2),toon('#3a3a42',{}));ink3(rim,1.4);rim.position.y=2;pot.add(rim);
   for(const sg of[-1,1]){const h=new THREE.Mesh(new THREE.TorusGeometry(14,3,6,12,PI),toon('#2c2c34',{}));h.position.set(sg*98,-26,0);h.rotation.z=sg>0?-PI/2:PI/2;pot.add(h)}}
  const liq=new THREE.Mesh(new THREE.CircleGeometry(84,32).rotateX(-PI/2),new THREE.ShaderMaterial({uniforms:{uC:{value:new THREE.Color('#6a9ec6')},uT:{value:0},uH:{value:0},uS:{value:0},uA:{value:1}},transparent:true,
   vertexShader:'varying vec2 vP;void main(){vP=position.xz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'uniform vec3 uC;uniform float uT,uH,uS,uA;varying vec2 vP;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}void main(){float r=length(vP)/84.;float w=n(vP*.05+vec2(uT*(.3+uS),uT*.2))*.5+n(vP*.11-vec2(uT*.4,uT*(.3+uS*2.)))*.5;vec3 c=uC*(.65+w*.5);c+=vec3(1.,.9,.6)*smoothstep(.62,.9,w)*(.25+uH*.5);c=mix(c,uC*.35,smoothstep(.78,1.,r));float sw=sin(atan(vP.y,vP.x)*3.+length(vP)*.18-uT*(3.+uS*6.))*uS*.12;c+=sw;gl_FragColor=vec4(c,uA*(1.-smoothstep(.97,1.,r)));}'}));
  liq.position.y=-10;pot.add(liq);
  const logs=new THREE.Group();logs.position.copy(this.P3(366,414));logs.scale.y=Y;sc.add(logs);{const l=[],p=mkPart(l);for(let i=0;i<4;i++)p(Cy(9,9,150,8),i%2?'#5a3a22':'#4a2e1a',(i-1.5)*22+(CX-366)-10,6+(i%2)*10,(i-1.5)*8,{rz:PI/2,ry:.25+i*.2});p(Bx(220,10,70),'#3a3430',CX-366,-8,0);logs.add(bake(l,1.2))}
  const fire=hearth(210,150);fire.mesh.position.copy(this.P3(CX,380,26));fire.mesh.position.y+=50;sc.add(fire.mesh);
  const heatG=add(new THREE.Mesh(new THREE.PlaneGeometry(420,260),new THREE.MeshBasicMaterial({map:gt,color:'#ff7a2a',transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false})),CX-400,(230-360)*Y,40);
  // — MORTERO y MANO —
  const mort=new THREE.Group();sc.add(mort);{const m=new THREE.Mesh(lathe([[0,-34],[40,-34],[74,-20],[84,0],[80,2],[68,-2],[58,-6]],22),toon('#8a857a',{}));ink3(m,2);mort.add(m);const inner=new THREE.Mesh(new THREE.CircleGeometry(66,22).rotateX(-PI/2),new THREE.MeshBasicMaterial({color:'#2a2620'}));inner.position.y=-4;mort.add(inner)}
  const mortC=new THREE.Group();mort.add(mortC);   // trozos y polvo (se rehacen al vuelo)
  const pest=new THREE.Group();sc.add(pest);{const l=[],p=mkPart(l);p(Cy(7,10,70,8),'#a89c88',0,35,0);p(Sp(15,1,.9,1),'#b4a892',0,0,0);p(Sp(9),'#8a7e6a',0,72,0);pest.add(bake(l,1.4))}
  // — FUELLE —
  const bell=new THREE.Group();sc.add(bell);const bagM=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),toon('#6a4228',{}));{const l=[],p=mkPart(l);p(Bx(74,7,44),'#8a6238',0,-20,0);p(Bx(66,7,40),'#7a5430',0,26,0,{rz:-.2});p(Cy(4,3,44,6),'#3a3a40',-52,-18,0,{rz:PI/2});p(Bx(12,46,12),'#5a3f26',38,2,0);bell.add(bake(l,1.2))}bell.add(bagM);
  // — BOTELLA de salida, JARRA, BOTELLA de base y TAPÓN —
  const botG=new THREE.Group();sc.add(botG);{const gm=new THREE.MeshLambertMaterial({color:'#c8e4ee',transparent:true,opacity:.5}),b=new THREE.Mesh(lathe([[0,-46],[36,-46],[54,-26],[56,2],[46,24],[16,40],[14,102],[0,102]],18),gm);ink3(b,1.4,inkFor('#6a8a98'));botG.add(b);const fl=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,16),new THREE.MeshBasicMaterial({color:'#7ac0e0',transparent:true,opacity:.9}));fl.name='fill';botG.add(fl);const rg=new THREE.Mesh(new THREE.TorusGeometry(15,2.4,5,12).rotateX(PI/2),toon('#c8c0b0',{}));rg.position.y=100;botG.add(rg)}
  const cork=new THREE.Mesh(new THREE.CylinderGeometry(9,7,20,10),toon('#b08050',{}));ink3(cork,1.2);sc.add(cork);
  const pitch=new THREE.Group();sc.add(pitch);{const m=new THREE.Mesh(lathe([[0,-26],[22,-26],[28,0],[24,28],[0,28]],14),lam('#9aa8b8'));ink3(m,1.4);pitch.add(m);const hd=new THREE.Mesh(new THREE.TorusGeometry(14,3,5,10,PI),toon('#6a5a48',{}));hd.position.set(26,0,0);hd.rotation.z=-PI/2;pitch.add(hd);const pf=new THREE.Mesh(new THREE.CircleGeometry(20,14).rotateX(-PI/2),new THREE.MeshBasicMaterial({color:'#7ac0e0'}));pf.position.y=22;pitch.add(pf);pitch.userData.f=pf}
  const baseBots=[];for(let i=0;i<5;i++){const g=new THREE.Group();const m=new THREE.Mesh(lathe([[0,-30],[18,-30],[22,-18],[22,6],[8,20],[7,34],[0,34]],10),lam('#8ab0c8',{transparent:true,opacity:.7}));ink3(m,1.2);g.add(m);const cp=new THREE.Mesh(new THREE.CylinderGeometry(7,6,12,8),toon('#b08050',{}));cp.position.y=38;g.add(cp);g.visible=false;sc.add(g);baseBots.push(g)}
  const ladle=new THREE.Group();sc.add(ladle);{const l=[],p=mkPart(l);p(Cy(3,3,150,6),'#8a8a92',0,75,0);p(Sp(17,1,.55,1),'#9a9aa2',0,3,0);ladle.add(bake(l,1.2))}
  // — FRASCOS del estante (pool) —
  const jars=[];for(let i=0;i<22;i++){const g=new THREE.Group(),b=new THREE.Mesh(lathe([[0,-26],[16,-26],[20,-18],[20,10],[10,20],[9,28],[0,28]],10),lam('#cfe0e8',{transparent:true,opacity:.5})),f=new THREE.Mesh(new THREE.CylinderGeometry(16,18,26,10),lam('#88aa66'));f.position.y=-6;const cp=new THREE.Mesh(new THREE.CylinderGeometry(8,7,10,8),toon('#b08050',{}));cp.position.y=32;g.add(f,b,cp);ink3(b,1.1);g.userData.f=f;g.visible=false;sc.add(g);jars.push(g)}
  // — trozos del mortero (pool) y polvo —
  const chunks=[];for(let i=0;i<48;i++){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(1,0),lam('#cccccc'));m.visible=false;mortC.add(m);chunks.push(m)}
  const powder=[];for(let i=0;i<4;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(1,10,6),lam('#cccccc'));m.visible=false;mortC.add(m);powder.push(m)}
  return{pot,liq,fire,heatG,mort,mortC,pest,bell,bagM,botG,cork,pitch,baseBots,ladle,jars,chunks,powder,upd:(F,now,dt)=>F.updAlch(T,now,dt)}}
 setAlch(v){this.view=v}
 updAlch(T,now,dt){const D=T.dyn,v=this.view;if(!v||!v.g)return;const g=v.g,pt=g.pot,Y=1/Math.cos(this.TH),hot=clamp(pt.T,0,1),C=v.C;
  const rgb=a=>new THREE.Color(a[0]/255,a[1]/255,a[2]/255),p3=(x,y,z)=>this.P3(x,y,z||0);
  // olla: bamboleo, líquido (color, calor, remover), fuego
  D.pot.scale.set(1+pt.wob*.014,Y*(1-pt.wob*.03),1+pt.wob*.014);D.liq.visible=pt.fill>.02;D.liq.position.y=-6-(1-clamp(pt.fill/.9,0,1))*26;
  D.liq.material.uniforms.uC.value.copy(rgb(g.col));D.liq.material.uniforms.uT.value=now;D.liq.material.uniforms.uH.value=hot;D.liq.material.uniforms.uS.value=pt.stirring?1:.15+pt.sa*.5;
  D.fire.set(.35+pt.F*1.1+pt.boost*.5,now);D.fire.mesh.visible=pt.F>.03||pt.boost>.03;D.heatG.material.opacity=clamp(pt.F*.4+pt.boost*.3,0,.5)*(.85+.15*Math.sin(now*9));
  // mortero + trozos + polvo
  const m=g.mort,mx=m.x+(m.shake?Math.sin(g.t*70)*m.shake:0);D.mort.position.copy(p3(mx,m.y-14,m.grab?46:0));D.mort.scale.y=Y;D.mort.rotation.z=-m.tilt*1.17*.9;
  let ci=0,pi=0;m.items.forEach((it,ii)=>{const nI=m.items.length,pw=it.fine*Math.min(1,it.grains/20);if(pw>.03&&pi<4){const q=D.powder[pi++];q.visible=true;q.material.color.copy(rgb(it.col));q.scale.set(10+28*pw,2+4*pw,5+9*pw);q.position.set((ii-(nI-1)/2)*48,-2+3*pw,0)}
   it.chunks.forEach(k=>{if(k.hp<=0||ci>=48)return;const q=D.chunks[ci++];q.visible=true;q.material.color.copy(rgb(it.col));const r=(k.r||8)*.9;q.scale.set(r,r*.8,r*.9);q.position.set(k.x-C.MORT.x,-6+r*.4,(k.y-C.MORT.y)*.9);q.rotation.set(k.a||0,(k.a||0)*1.7,0)})});
  for(let i=ci;i<48;i++)D.chunks[i].visible=false;for(let i=pi;i<4;i++)D.powder[i].visible=false;
  const pe=g.pest;D.pest.position.copy(p3(pe.x,pe.y,pe.hold?58:10));D.pest.scale.y=Y;D.pest.rotation.z=pe.hold?-.32+(pe.press||0)*.1:1.35;
  // fuelle, botella, tapón, jarra
  const bp=g.bellP||0;D.bell.position.copy(p3(C.BELL.x,C.BELL.y,0));D.bell.scale.y=Y;D.bagM.scale.set(52,40-bp*22,34);D.bagM.position.set(0,2,0);
  D.botG.position.copy(p3(C.BOT.x,C.BOT.y,0));D.botG.scale.y=Y;{const f=D.botG.getObjectByName('fill'),h=Math.max(.001,clamp(g.fill,0,1.2)*132),rad=h<62?44:h<82?30:12;f.scale.set(rad,h,rad);f.position.y=-46+h/2;f.visible=g.fill>.01;f.material.color.copy(rgb(g.pcol))}
  D.cork.visible=true;D.cork.position.copy(g.cork&&g.cork.on?p3(C.BOT.x,C.BOT.ny-6,12):p3(g.cork?g.cork.x:772,g.cork?g.cork.y:344,12));D.cork.scale.y=Y;
  D.pitch.visible=!!pt.ready;if(pt.ready){const p=g.p;D.pitch.position.copy(p3(p.x,p.y,16));D.pitch.scale.y=Y;D.pitch.rotation.z=-p.tilt*1.9;D.pitch.userData.f.material.color.copy(rgb(g.col))}
  // botellas de base (en la repisa) y la que se agarra
  C.BASEV.forEach((b,i)=>{const o=D.baseBots[i];const grabbed=g.bgrab&&g.bgrab.k===b.k;o.visible=true;if(grabbed){o.position.copy(p3(g.bx,g.by+10,20));o.rotation.z=-(g.btilt||0)*1.6}else{o.position.copy(p3(b.x,b.y+14,-4));o.rotation.z=0}o.scale.y=Y;const col=v.solv&&v.solv[b.k]?v.solv[b.k].col:'#8ab0c8';o.children[0].material.color.set(col)});
  // frascos del estante
  D.jars.forEach((j,i)=>{const jj=g.jars[i];j.visible=!!jj;if(!jj)return;j.position.copy(p3(jj.x,jj.y-(jj.drag?4:0),jj.drag?30:4));j.scale.y=Y;j.rotation.z=jj.drag?.15:0;const col=v.icol?v.icol(jj.id):[136,170,102];j.userData.f.material.color.copy(rgb(col));j.children.forEach(c=>{if(c.material&&c.material.type==='MeshLambertMaterial'){c.material.transparent=true;c.material.opacity=c===j.userData.f?(jj.used?.12:1):(jj.used?.1:.5)}})});
  // cuchara
  const rm=g.pot.stirring;D.ladle.visible=!!rm;if(rm){const pr=v.ptr;D.ladle.position.copy(p3(clamp(pr.x,C.CAULD.x-C.CAULD.rx+10,C.CAULD.x+C.CAULD.rx-10),clamp(pr.y,C.CAULD.y-C.CAULD.ry+4,C.CAULD.y+C.CAULD.ry-4)+6,30));D.ladle.scale.y=Y;D.ladle.rotation.z=clamp(pr.vx/900,-.4,.4)}
  // partículas del estado 2D (vapor, motas, burbujas, polvo…) → plano z=40 de la escena; 1 solo Points
  this.alchPts(g,rgb,p3)}
 alchPts(g,rgb,p3){const out=[],add=(x,y,col,a)=>{if(out.length<MAXS)out.push([x,y,col,a])};(g.steam||[]).forEach(p=>add(p.x,p.y,'#ddd8cc',clamp(p.a*1.2,0,1)));(g.parts||[]).forEach(q=>add(q.x,q.y,q.k==='grain'||q.k==='base'?rgb(q.col||[200,200,200]):rgb(g.pcol),.95));
  (g.motes||[]).forEach(m=>add(m.x,m.y,rgb(g.col),Math.sin(m.t/m.life*PI)));(g.pf||[]).forEach(q=>add(q.x,q.y-(q.k==='puff'?q.t*20:0),q.col&&q.col[0]!==undefined?rgb(q.col):'#e8e0cc',1-q.t/q.life));
  this.alchOut=out}
 // ═════════════════════════════════════ FOTOGRAMA ═════════════════════════════════════
 frame(r){const T=this.T;if(!this.on||!T||!this.out||!this.rectFn)return;const t0=performance.now(),now=t0/1000,dt=Math.min(.05,this.last?(t0-this.last)/1000:.016);this.last=t0;this.t=now;
  const q=this.rectFn(),dom=r.domElement,cr=dom.getBoundingClientRect();if(!q||q.width<40||q.height<20||!cr.width)return;
  const sx=dom.width/cr.width,sy=dom.height/cr.height;let x=Math.round((q.left-cr.left)*sx),y=Math.round((q.top-cr.top)*sy),w=Math.round(q.width*sx),h=Math.round(q.height*sy);
  if(x<0){w+=x;x=0}if(y<0){h+=y;y=0}if(x+w>dom.width)w=dom.width-x;if(y+h>dom.height)h=dom.height-y;if(w<32||h<16)return;const yb=dom.height-(y+h),pr=r.getPixelRatio();
  this.shake=Math.max(0,this.shake-dt*6);T.dyn.upd(this,now,dt);
  // partículas
  const PT=T.pts.geometry.attributes.position,Cc=T.pts.geometry.attributes.color,col=new THREE.Color();let n=0;
  for(let i=this.sp.length-1;i>=0;i--){const p=this.sp[i];p.t+=dt;if(p.t>p.life){this.sp.splice(i,1);continue}p.vy-=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt}
  if(this.mode==='cook')for(const p of this.sp){const a=1-p.t/p.life;PT.setXYZ(n,p.x,p.y,p.z);col.set(p.c).multiplyScalar(clamp(a*1.5,0,1)*.9);Cc.setXYZ(n,col.r,col.g,col.b);n++}
  else for(const o of(this.alchOut||[])){if(n>=MAXS)break;const pp=this.P3(o[0],o[1],40);PT.setXYZ(n,pp.x,pp.y,pp.z);col.set(o[2]).multiplyScalar(clamp(o[3],0,1)*.9);Cc.setXYZ(n,col.r,col.g,col.b);n++}
  for(let i=n;i<MAXS;i++){PT.setXYZ(i,0,-5000,0);Cc.setXYZ(i,0,0,0)}T.pts.geometry.setDrawRange(0,MAXS);PT.needsUpdate=true;Cc.needsUpdate=true;
  // cámara
  const cam=T.cam;if(this.mode==='cook'){const s=this.cs||{},zp=s.zp||0,sh=this.shake*.014;cam.fov=38/(1+zp*.35+(s.st==='res'?.1:0));cam.aspect=w/h;cam.updateProjectionMatrix();cam.position.set(.62+(hash(now*60)-.5)*sh,1.85+(hash(now*60+5)-.5)*sh,4.3);cam.lookAt(.6,.84,0)}
  const ac=r.autoClear,sci=r.getScissorTest(),vp=new THREE.Vector4(),sz=new THREE.Vector4(),cc=new THREE.Color(),ca=r.getClearAlpha(),c0=r.info.render.calls,t00=r.info.render.triangles;r.getViewport(vp);r.getScissor(sz);r.getClearColor(cc);
  r.setRenderTarget(null);r.autoClear=false;r.setViewport(x/pr,yb/pr,w/pr,h/pr);r.setScissor(x/pr,yb/pr,w/pr,h/pr);r.setScissorTest(true);r.setClearColor('#0d0907',1);r.clear(true,true,true);
  r.render(T.sc,cam);
  this.stats.calls=r.info.render.calls-c0;this.stats.tris=r.info.render.triangles-t00;r.info.render.calls=c0;r.info.render.triangles=t00;
  const o=this.out;if(o.width>0&&o.height>0)this.cx.drawImage(dom,x,y,w,h,0,0,o.width,o.height);
  r.setScissorTest(sci);r.setScissor(sz);r.setViewport(vp);r.setClearColor(cc,ca);r.autoClear=ac;this.stats.ms+=(performance.now()-t0-this.stats.ms)*.1}
}
