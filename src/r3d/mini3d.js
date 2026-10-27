// NotScape · R3D · FIGURAS «DIORAMA» (17 oct 2026): personajes simples, redondeados y con cel shading, como el de la demo de diorama que le gustó al dueño
// (túnica en cono, cabeza redonda con capucha, contorno oscuro, UN acento de color, objeto en la mano). Todo por código: lathe + esferas, formas SUAVES
// (normales suaves; el cel lo hacen las bandas de `toon`), contorno = casco invertido (`hull`). Un diseño = datos + 1 función de accesorios.
import * as THREE from 'three';
import {toon,hull,hash,glow} from './materials3d.js';
import {SkirtPhys,flapRig,splitProfile,radAt,SK_N,SK_OV} from './skirt3d.js';
const V=THREE.Vector3;
const T=(c,o)=>toon(c,Object.assign({chr:1,rim:1.4},o||{}));
// Mini.detail (1 por defecto = el héroe): factor de teselación para figuras secundarias (actors3d.js lo baja a ~.62 al hornear enemigos: −55 % de triángulos, imperceptible a su tamaño)
const DET=()=>Mini.detail||1;
// FACETADO opt-in (Lote R3D-FASE2, 19 oct 2026): `spec.facet:true` (solo el héroe, ver lookToSpec) pinta botas, cinturón, manos y hombreras con pocas caras y normales PLANAS (chaflán),
// para que el héroe «hable el mismo idioma duro» que los props oscuros SIN tocar la cabeza ni la cara. Sin la opción todo sale igual que antes (enemigos, PNJ).
const fct=g=>{const n=g.index?g.toNonIndexed():g;n.computeVertexNormals();return n};
const fsph=(r,sx=1,sy=1,sz=1,w=7,h=5)=>fct(new THREE.SphereGeometry(r,w,h).scale(sx,sy,sz));
function lathe(pts,n=20){return new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),Math.max(10,Math.round(n*DET())))}
const sph=(r,sx=1,sy=1,sz=1)=>new THREE.SphereGeometry(r,Math.max(10,Math.round(18*DET())),Math.max(7,Math.round(14*DET()))).scale(sx,sy,sz);
// RIG (Lote R3D-ANIM, 17 oct 2026): root (escala k, marco del SUELO) → pelvis (cadera, y=.42) → [piernas: cadera→rodilla→tobillo] y chest (cintura, gira y se
// inclina) → body (desplazado −.42: todo lo de dentro usa las coordenadas de siempre) → túnica, cinturón, cabeza, brazos (hombro→codo→muñeca/grip) y accesorios.
// Mano principal = arms[0] (x−, DERECHA del personaje, que mira a +z); mano secundaria = arms[1] (x+, izquierda). Medidas: muslo .2, espinilla .19 (tobillo),
// brazo .18 + antebrazo .18 (centro de la mano). Las cápsulas tienen la semiesfera centrada en cada articulación → codo/rodilla redondos a cualquier ángulo.
// grips[i] (orden 'YXZ') = punto de agarre en el centro de la mano: las armas y herramientas cuelgan de ahí (su +y local = hoja/mango).
// R3D-FIX-VIGAS (20 oct 2026): cinta en diagonal que sigue el perfil REAL del torso (`prof` = [[y,radio],…] de la lathe de la camisa), de un hombro a la cadera opuesta, +1,6 cm sobre la superficie.
function sash(w,prof,off=.016){const N=40,P=[],I=[],V=THREE.Vector3,R=y=>{for(let i=1;i<prof.length;i++)if(y<=prof[i][0]||i===prof.length-1){const a=prof[i-1],b=prof[i],t=Math.max(0,Math.min(1,(y-a[0])/Math.max(1e-4,b[0]-a[0])));return a[1]+(b[1]-a[1])*t}return prof[0][1]};
 for(let i=0;i<=N;i++){const ph=i/N*Math.PI*2,y=.645-.14*Math.sin(ph),r=R(y)+off,rx=Math.sin(ph),rz=Math.cos(ph),t=new V(r*rz,-.14*Math.cos(ph),-r*rx).normalize(),n=new V(rx,0,rz),u=new V().crossVectors(t,n).normalize();
  for(const q of[-1,1]){const ww=w/2*q;P.push(r*rx+u.x*ww,y+u.y*ww,r*rz+u.z*ww)}}
 for(let i=0;i<N;i++){const a=i*2;I.push(a,a+2,a+1,a+1,a+2,a+3)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setIndex(I);g.computeVertexNormals();return g}

export class Mini{
 static DRESS_OK=['ru','anciano','aldeana','hechicera','bruja','b2','k2','heroe-mago'];   // 'heroe-mago' = héroe con peto de TELA (túnica, armor3d.js)   // PNJ femeninos (Ru, Aldeana) y MAGOS (túnica larga): decisión del dueño, 18 oct 2026
 constructor(s){this.spec=s;this.hulls=[];this.obj=new THREE.Group();const g=this.root=new THREE.Group();this.obj.add(g);this.ph=s.ph||0;
  const FC=!!s.facet,k=s.k||1,robe=s.robe,skin=shade(s.skin||'#e2b890',.76),W=s.w||1;this.k=k;this.W=W;
  const pelvis=this.pelvis=new THREE.Group();pelvis.position.set(0,.42,0);g.add(pelvis);
  const chest=this.chest=new THREE.Group();pelvis.add(chest);
  const body=this.body=new THREE.Group();body.position.set(0,-.42,0);chest.add(body);
  const part=(geo,col,x,y,z,o={})=>{const m=new THREE.Mesh(geo,o.mat||T(col,col===skin?Object.assign({rim:.3},o.t):o.t));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=col!==skin;(o.p||body).add(m);
   if(o.ink!==0){const h=hull(geo,(o.ink||.022)*(s.inkK||1));h.visible=!!this.inkOn;h.position.copy(m.position);h.rotation.copy(m.rotation);h.scale.copy(m.scale);(o.p||body).add(h);this.hulls.push(h);m.userData.h=h}return m};
  this.part=part;this.skinC=skin;
  // TORSO (Lote R3D-SINVESTIDO, 18 oct 2026, pedido del dueño: «el vestidito se ve horrible»): camisa/chaleco hasta la cintura + abdomen y cadera en color de pantalón, con las
  // piernas visibles desde la cadera. El VESTIDO (cono hasta la rodilla/tobillo) solo existe con `s.dress:true` — reservado a contados PNJ femeninos (Ru, Aldeana). Ningún héroe ni enemigo lo usa.
  // Complexión por spec: chestW (pecho/hombros), waist (cintura), belly (barriga), legW/armW (grosor), stance (separación de piernas), headK (cabeza), lean (encorvado, rad), pauld/spikes (hombreras), strap (bandolera).
  const dress=!!s.dress&&Mini.DRESS_OK.includes(s.id);   // GUARDIA anti-vestido: solo los id de la lista blanca (decisión del dueño, 18 oct 2026)
  if(s.dress&&!dress)console.warn('[Mini] el vestido está prohibido para «'+s.id+'» (lista blanca Mini.DRESS_OK)');
  const pc=s.pants||shade(robe,.42),bc=s.boot||'#3a2a20',cw=s.chestW||1,ww=s.waist||1,bel=s.belly||0;
  const lw=Math.min(W,1.4)*(s.legW||1),aw=Math.max(1,Math.min(W,1.5))*(s.armW||1),tw=.072*lw,rw=.15*W*ww+bel*.5;this.lean=s.lean||0;this.rw=rw;this.cw=cw;this.dress=dress;
  if(dress){
   const f=s.flare||1,hem=s.hem==null?.3:s.hem,PF=[[.3,0],[.31,.04],[.24,.3],[.19,.55],[.17,.74],[.12,.84],[0,.86]],rad=y=>{for(let i=0;i<PF.length-1;i++){const a=PF[i],b=PF[i+1];if(y>=a[1]&&y<=b[1])return a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1])}return .1},
    fl=y=>1+(f-1)*Math.max(0,Math.min(1,(.6-y)/.5)),prof=[[0,hem],[rad(hem)*W*fl(hem)*1.12,hem],[rad(hem+.03)*W*fl(hem+.03)*1.06,hem+.03]];
   PF.forEach(p=>{if(p[1]>hem+.06)prof.push([p[0]*W*fl(p[1]),p[1]])});prof[prof.length-1][0]=0;
   // FALDA LIGERA (skirt3d.js): parte alta fija + 8 cuñas articuladas en la cintura que se abren cuando las piernas las empujan
   {const y0=.52,[lo,hi]=splitProfile(prof,y0),LT=(pts,seg,ps,pl)=>new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),seg,ps,pl);
    part(LT(hi,24),robe,0,0,0);this.skG=[];this.skPhi=[];this.skY0=y0;this.skHem=hem;this.skRad=radAt(prof);const dphi=Math.PI*2/SK_N;
    const tr=s.trim?[[prof[1][0]*1.005,hem],[prof[1][0]*1.012,hem+.03],[prof[2][0]*1.01,hem+.06],[prof[2][0]*.99,hem+.02]]:null;
    for(let i=0;i<SK_N;i++){const grp=new THREE.Group();grp.position.set(0,y0,0);body.add(grp);this.skG.push(grp);this.skPhi.push(i*dphi+dphi/2);const ps=i*dphi-SK_OV/2,pl=dphi+SK_OV;
     part(LT(lo.map(p=>[p[0],p[1]-y0]),5,ps,pl),robe,0,0,0,{p:grp});if(tr)part(LT(tr.map(p=>[p[0],p[1]-y0]),5,ps,pl),s.trim,0,0,0,{p:grp,ink:0})}}
  }else{
   const rc=.19*W*cw;
   part(lathe([[0,.36],[.13*W,.365],[.155*W*ww+bel,.42],[rw,.5],[rw,.52]]),pc,0,0,0);                                                       // abdomen + cadera (pantalón)
   part(lathe([[rw*1.012,.5],[rw*1.012,.52],[rw*1.1+bel*.4,.6],[rc,.7],[rc*.99,.79],[rc*.62,.845],[.05,.865],[0,.87]]),robe,0,0,0);          // camisa/chaleco: cintura → pecho → hombros
   if(s.trim)part(new THREE.TorusGeometry(.105*Math.max(.8,W*cw*.9),.018,6,18).rotateX(Math.PI/2),s.trim,0,.835,0,{ink:0});                       // cuello/ribete
   part(sph(.12*W,1.2,.82,.95),pc,0,0,0,{p:pelvis,ink:.016});                                                                                  // cadera: une el torso con las piernas (no gira con el pecho)
   if(s.strap)part(sash(.06,[[.5,rw*1.012],[.6,rw*1.1+bel*.4],[.7,rc],[.79,rc*.99]]),s.strap,0,0,0,{ink:.01,t:{side:THREE.DoubleSide}});   // bandolera: cinta CURVA que abraza el torso (REGLA: nunca una caja recta que cuelgue del pecho; ver AGENTS.md «Accesorios del cuerpo»)
   if(s.plate)part(lathe([[rc*1.04,.58],[rc*1.06,.7],[rc*1.0,.8],[rc*.7,.84],[rc*.68,.82],[rc*.98,.77],[rc*1.0,.7],[rc*.96,.58]]),s.plate,0,0,0,{t:{side:THREE.DoubleSide}})}   // peto
  // piernas: cadera (en la pelvis) → rodilla → tobillo. Pantalón + rodillera redonda + bota + pie
  this.knees=[];this.ankles=[];
  this.legs=[-1,1].map(q=>{const l=new THREE.Group();l.position.set(.09*q*W*(s.stance||1),0,0);pelvis.add(l);
   part(new THREE.CylinderGeometry(tw,.064*lw,.2,12).translate(0,-.1,0),pc,0,0,0,{p:l,ink:.016});
   const kn=new THREE.Group();kn.position.set(0,-.2,0);l.add(kn);this.knees.push(kn);
   part(sph(.064*lw),pc,0,0,0,{p:kn,ink:.015});
   part(new THREE.CylinderGeometry(.062*lw,.058*lw,.08,12).translate(0,-.04,0),pc,0,0,0,{p:kn,ink:.015});
   part(FC?fct(new THREE.CylinderGeometry(.062*lw,.075*lw,.1,7).translate(0,-.1,0)):new THREE.CylinderGeometry(.062*lw,.07*lw,.1,12).translate(0,-.1,0),bc,0,0,0,{p:kn,ink:.014});
   const an=new THREE.Group();an.position.set(0,-.19,0);kn.add(an);this.ankles.push(an);
   l.userData.foot=part(FC?fsph(.074*lw,1,.62,1.5,7,4):sph(.07*lw,1,.65,1.5),bc,0,0,.04,{p:an,ink:.014});return l});
  this.feet=this.ankles;
  if(this.skG)this.skp=new SkirtPhys({pelvis:this.pelvis,chest:this.chest,body:this.body,legs:this.legs,knees:this.knees,ankles:this.ankles,groups:this.skG,phi:this.skPhi,y0:this.skY0,rad:this.skRad,hem:this.skHem,seed:this.ph});
  if(s.belt)part(FC?fct(new THREE.TorusGeometry(dress?.19*W:rw*1.04,.03,4,14).rotateX(Math.PI/2)):new THREE.TorusGeometry(dress?.19*W:rw*1.04,.025,8,24).rotateX(Math.PI/2),s.belt,0,dress?.52:.515,0,{ink:.012});
  // cabeza
  const hy=1.06,head=this.head=new THREE.Group();head.position.set(0,hy,0);if(s.headK)head.scale.setScalar(s.headK);body.add(head);
  if(!s.skull){part(sph(.19,1,1.02,1),skin,0,0,.04,{p:head,ink:.016});
   [-1,1].forEach(q=>{part(sph(.034,1,s.enemy?.85:1.2,.7),s.enemy&&s.eye?s.eye:(s.irisC||'#1c1410'),.07*q,.012,.212,{p:head,ink:0,t:{flat:0},mat:s.enemy&&s.eye?glow(s.eye,1.6):undefined});part(sph(.011),'#fff6e0',.07*q+.01,.026,.232,{p:head,ink:0});
    part(new THREE.BoxGeometry(.09,s.enemy?.026:.02,.02),s.brow||'#3a2a20',.07*q,s.enemy?.066:.075,.2,{p:head,ink:0}).rotation.z=(s.enemy?.42:(s.browT==null?.12:s.browT))*q;if(s.blush)part(sph(.02,1.2,.7,.5),'#e29a86',.115*q,-.04,.19,{p:head,ink:0})});
   part(sph(.026,.9,.9,1.2),shade(skin,.93),0,-.015,.225,{p:head,ink:0});this.mouth=part(new THREE.BoxGeometry(s.enemy?.09:.07,.014,.02),'#5a2a24',0,-.08,.205,{p:head,ink:0})}
  if(s.freckles)[-1,1].forEach(q=>[0,1,2].forEach(i=>part(sph(.006),shade(skin,.7),(.075+i*.016)*q,-.035+(i%2)*.014,.195,{p:head,ink:0})));
  if(s.skull){part(sph(.19,1,1.05,1.05),'#e6dcc0',0,0,.03,{p:head,ink:.016});[-1,1].forEach(q=>{part(sph(.045,1,1.15,.5),'#100c0c',.075*q,.02,.185,{p:head,ink:0,t:{flat:0}});part(sph(.014),s.eye||'#8ae0ff',.075*q,.02,.2,{p:head,ink:0,mat:glow(s.eye||'#8ae0ff',2)})});
   part(new THREE.BoxGeometry(.14,.05,.03),'#c8bea0',0,-.1,.17,{p:head,ink:.008})}
  // capucha / pelo / casco / sombrero (según diseño)
  s.top&&s.top(this,head,part);
  // brazos: hombro → codo → mano (grip). Cápsulas con la semiesfera centrada en la articulación
  this.elbows=[];this.grips=[];this.hands=[];
  this.arms=[-1,1].map(q=>{const a=new THREE.Group();a.position.set(.19*q*W*(dress||!s.chestW?1:Math.max(1,cw*1.04)),.78,0);body.add(a);const sc=s.sleeve||robe;
   part(new THREE.CapsuleGeometry(.055*aw,.18,6,10).translate(0,-.09,0),sc,0,0,0,{p:a,ink:.016});
   const el=new THREE.Group();el.position.set(0,-.18,0);a.add(el);this.elbows.push(el);
   part(new THREE.CapsuleGeometry(.05*aw,.15,6,10).translate(0,-.075,0),sc,0,0,0,{p:el,ink:.015});
   this.hands.push(part(FC?fsph(.056*Math.pow(aw,.8),1,1,1,7,5):sph(.052*Math.pow(aw,.8)),skin,0,-.18,0,{p:el,ink:.012}));
   const gr=new THREE.Group();gr.position.set(0,-.18,0);gr.rotation.order='YXZ';el.add(gr);this.grips.push(gr);
   if(s.pauld){const pr=.1*aw;part(FC?fsph(pr,1.2,.8,1.1,8,5):sph(pr,1.2,.8,1.1),s.pauld,.02*q,.03,0,{p:a,ink:.016});for(let i=0;i<(s.spikes||0);i++){const sp=part(new THREE.ConeGeometry(.025*aw,.1*aw,6),s.spikeC||shade(s.pauld,1.5),.02*q+(i-(s.spikes-1)/2)*.05*q,.03+pr*.78,(i-(s.spikes-1)/2)*.04,{p:a,ink:.01});sp.rotation.z=-.5*q}}
   a.rotation.z=.22*q;return a});
  s.acc&&s.acc(this,body,part);g.scale.setScalar(k);this.base=this.arms.map(a=>a.rotation.z)}
 // agarra un objeto con la MANO i (0 = derecha/principal, 1 = izquierda): grupo en el grip (centro de la mano), rotado rx. Con el brazo colgando,
 // rx=0 → el +y del objeto apunta hacia el codo (arriba); rx=π/2 → hacia delante. fn(F,grupo,part) construye con part(...,{p:grupo})
 hold(i,rx,fn){const h=new THREE.Group();h.rotation.x=rx;this.grips[i].add(h);fn(this,h,this.part);return h}
 setInk(on){this.inkOn=!!on;this.hulls.forEach(h=>h.visible=!!on)}
 tickSkirt(dt){if(this.skp)this.skp.update(dt);if(this.flaps&&this.flaps.length){if(!this.fkp)this.fkp=new SkirtPhys(flapRig({pelvis:this.pelvis,chest:this.chest,body:this.body,legs:this.legs,knees:this.knees,ankles:this.ankles,seed:this.ph},this.flaps,this.skRad));this.fkp.update(dt)}}   // falda ligera: la llaman MiniHero.update y (con huesos) actors3d.js
 update(t){const b=Math.sin(t*1.9+this.ph),root=this.root;root.position.y=Math.abs(b)*.006*this.k;this.head.rotation.y=Math.sin(t*.4+this.ph)*.14;this.head.rotation.x=Math.sin(t*.6+this.ph)*.03;
  this.arms.forEach((a,i)=>a.rotation.z=this.base[i]+(i?-1:1)*b*.012)}
}
const shade=(c,k)=>'#'+new THREE.Color(c).multiplyScalar(k).getHexString();
// ═══ catálogo ═══
// armas y escudo AGARRADOS (el grupo `h` está en la palma). Hoja hacia +y local.
export const sword=(p,h,blade,guard,len)=>{p(new THREE.CylinderGeometry(.02,.02,.14,6),'#5a3e2c',0,0,0,{p:h,ink:.01});p(new THREE.BoxGeometry(.2,.03,.05),guard,0,.08,0,{p:h,ink:.01});p(new THREE.BoxGeometry(.045,len,.016),blade,0,.08+len/2,0,{p:h,ink:.012})};
// escudo redondo AGARRADO por el centro con la mano secundaria (grip 1): cara hacia el +z local del grip (delante con el brazo colgando)
export const shieldMesh=(part,h,c,e)=>{part(sph(.2,1,1.15,.28),c,0,.02,.07,{p:h,ink:.016});part(sph(.05,1,1,.6),e,0,.02,.13,{p:h,ink:0});part(new THREE.TorusGeometry(.2,.014,6,24).scale(1,1.15,1),shade(c,.6),0,.02,.075,{p:h,ink:0})};
export const shield=(F,part,c,e)=>F.hold(1,0,(F,h,p)=>shieldMesh(p,h,c,e));
const p_quiver=(part,g)=>{part(new THREE.CylinderGeometry(.05,.045,.4,8),'#5a3e2c',-.08,.62,-.22,{p:g,ink:.012}).rotation.z=.25;[0,1,2].forEach(i=>part(new THREE.CylinderGeometry(.006,.006,.15,4),'#e8e0c8',-.13+i*.02,.86,-.22,{p:g,ink:0}))};
const hood=(c,o={})=>(F,head,part)=>{part(sph(.235,1.02,1.0,1.0),c,0,.025,-.035,{p:head,ink:.018});   // casco de la capucha
 part(new THREE.TorusGeometry(.17,.032,8,22).rotateY(0),c,0,0,.15,{p:head,ink:.012}).scale.set(1,1.1,1);                    // borde alrededor de la cara
 part(new THREE.ConeGeometry(.1,.2,10).rotateX(-.6),c,0,.2,-.17,{p:head,ink:.014});                                          // punta
 part(new THREE.SphereGeometry(.2,14,10,0,6.3,0,1.2).scale(1,.9,1),c,0,.01,-.045,{p:head,ink:0})};
export const MINI=[
 {id:'errante',name:'Errante',role:'héroe · cuerpo a cuerpo',blush:0,robe:'#8a2e30',trim:'#5a1c20',belt:'#3a2a20',skin:'#e2b890',ph:0,
  top:hood('#8a2e30'),acc(F,g,part){F.hold(0,-1.15,(F,h,p)=>sword(p,h,'#cfd4dc','#d8a24a',.5));
   F.hold(1,0,(F,h,p)=>{p(new THREE.CylinderGeometry(.008,.008,.12,4),'#3a2a20',0,-.04,0,{p:h,ink:0});p(new THREE.BoxGeometry(.09,.12,.09),'#ffd56a',0,-.16,0,{p:h,ink:.01,mat:glow('#ffb84a',1.8)})})}},
 {id:'hechicera',name:'Hechicera',role:'héroe · magia',dress:1,hem:.08,flare:1.15,robe:'#2e3a78',trim:'#d8b050',belt:'#d8b050',skin:'#ecc8a8',ph:1.3,
  top(F,head,part){hood('#2e3a78')(F,head,part);part(new THREE.CylinderGeometry(.2,.2,.02,16),'#2e3a78',0,.22,-.02,{p:head,ink:.01})},
  acc(F,g,part){F.hold(0,0,(F,h,p)=>{p(new THREE.CylinderGeometry(.02,.02,1.4,6),'#6a4a2e',0,.4,0,{p:h,ink:.012});p(sph(.07),'#8ad0ff',0,1.14,0,{p:h,ink:0,mat:glow('#8ad0ff',2)});p(new THREE.TorusGeometry(.07,.016,6,14),'#d8b050',0,1.07,0,{p:h,ink:.008})})}},
 {id:'exploradora',name:'Exploradora',role:'héroe · a distancia',robe:'#4a6a3a',trim:'#3a4a2a',belt:'#6a4a30',skin:'#e6b894',ph:2.1,
  top:hood('#4a6a3a'),acc(F,g,part){F.hold(1,0,(F,h,p)=>{p(new THREE.TorusGeometry(.36,.016,6,18,Math.PI).rotateZ(-Math.PI/2).rotateY(Math.PI/2),'#7a5030',0,0,0,{p:h,ink:.01});p(new THREE.CylinderGeometry(.005,.005,.72,4),'#e8e0c8',0,0,-.02,{p:h,ink:0})});
   p_quiver(part,g)}},
 {id:'guardia',name:'Guardia',role:'PNJ · aldea',robe:'#7a2e2e',trim:'#d8b050',belt:'#3a2a20',skin:'#d8aa80',sleeve:'#8a8e96',ph:3,boot:'#4a4e56',w:1.05,
  top(F,head,part){part(new THREE.SphereGeometry(.215,16,10,0,6.3,0,1.65).scale(1,1.05,1),'#9a9ea6',0,.04,.0,{p:head,ink:.018});part(new THREE.BoxGeometry(.03,.14,.03),'#8a8e96',0,.0,.22,{p:head,ink:.01});part(new THREE.CylinderGeometry(.24,.24,.03,18),'#8a8e96',0,.045,0,{p:head,ink:.014})},
  acc(F,g,part){F.hold(0,0,(F,h,p)=>{p(new THREE.CylinderGeometry(.017,.017,1.7,6),'#6a4a2e',0,.5,0,{p:h,ink:.012});p(new THREE.ConeGeometry(.045,.22,6),'#cfd4dc',0,1.45,0,{p:h,ink:.01})});
   shield(F,part,'#7a2e2e','#d8b050')}},
 {id:'aldeana',name:'Aldeana',role:'PNJ · aldea',dress:1,hem:.22,blush:1,smile:1,robe:'#6a82a8',trim:'#d8ccb0',belt:'#8a6a40',skin:'#e6bc98',ph:4,flare:1.2,
  top(F,head,part){part(sph(.205,1,1,1).translate(0,.04,-.05),'#6a4a30',0,0,0,{p:head,ink:.016});part(sph(.07),'#6a4a30',0,.2,-.1,{p:head,ink:.012})},
  acc(F,g,part){part(new THREE.BoxGeometry(.34,.5,.02).translate(0,.3,0),'#e6dcc0',0,.1,.28,{ink:.01})}},
 {id:'bandido',name:'Bandido',role:'enemigo · humano',enemy:1,eye:'#e8b040',robe:'#3a2e2c',trim:'#2a2018',belt:'#2a2018',skin:'#c89868',ph:5,w:.92,
  top(F,head,part){hood('#2e2a28')(F,head,part);part(new THREE.SphereGeometry(.2,20,8,0,6.2832,1.95,.9).scale(1,1.02,1),'#3e3438',0,0,.04,{p:head,ink:.012});part(new THREE.TorusGeometry(.197,.01,6,24).rotateX(Math.PI/2),'#6a5a58',0,-.062,.04,{p:head,ink:0})},
  acc(F,g,part){F.hold(0,-1.1,(F,h,p)=>sword(p,h,'#b8c0c8','#6a5a3a',.42))}},
 {id:'orco',name:'Orco',role:'enemigo · humanoide',enemy:1,eye:'#ffcc30',robe:'#6a8a4a',trim:'#2a2018',belt:'#2a2018',skin:'#6a8a4a',brow:'#10100c',ph:6,k:1.12,w:1.25,sleeve:'#5a7a3c',pants:'#4a3a2c',chestW:1.2,waist:.85,armW:1.3,legW:1.15,pauld:'#4a4e56',spikes:3,strap:'#3a2a1e',
  top(F,head,part){[-1,1].forEach(q=>{part(new THREE.ConeGeometry(.03,.09,6),'#e8e0c0',.08*q,-.08,.19,{p:head,ink:.008}).rotation.x=-.3;part(new THREE.ConeGeometry(.04,.14,6),'#6a8a4a',.2*q,.04,0,{p:head,ink:.012}).rotation.z=-1.2*q});
   part(new THREE.BoxGeometry(.04,.12,.3),'#1a1a18',0,.2,-.0,{p:head,ink:.008})},
  acc(F,g,part){F.hold(0,-.8,(F,h,p)=>{p(new THREE.CylinderGeometry(.03,.034,.85,6),'#5a3e2c',0,.3,0,{p:h,ink:.012});p(new THREE.BoxGeometry(.2,.3,.14),'#7a7e86',0,.78,0,{p:h,ink:.012})})}},
 {id:'esqueleto',name:'Esqueleto',role:'enemigo · no muerto',enemy:1,robe:'#d6cdb2',trim:'#2a2018',belt:'#2a2018',skin:'#e6dcc0',skull:1,sleeve:'#d8cfb4',ph:7,w:.85,waist:.7,pants:'#cfc6aa',boot:'#d8cfb4',eye:'#8ae0ff',
  top(F,head,part){part(new THREE.SphereGeometry(.2,14,10,0,6.3,0,1.45).scale(1,1,1.05),'#7a6a5a',0,.04,.02,{p:head,ink:.016})},
  acc(F,g,part){F.hold(0,-1.1,(F,h,p)=>sword(p,h,'#a89a88','#6a5e50',.5));shield(F,part,'#6a4a32','#8a7a68');
   for(let i=0;i<4;i++)part(new THREE.TorusGeometry(.14-i*.008,.012,6,16).rotateX(Math.PI/2),'#6a5e48',0,.6+i*.06,0,{p:g,ink:0})}}
];
