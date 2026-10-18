// NotScape · R3D · F6b · VISTA PREVIA 3D DEL HÉROE para el editor de personaje (creator.js) y el selector de atuendo.
// Un `Hero` propio (el mismo modelo, la misma ropa con física y las mismas animaciones que en el mundo) en una escena mínima con su propio renderer
// sobre el <canvas> que le pasen (alfa, fondo transparente). Luz = la fila «dia» del héroe (TODH.dia), como en el mundo. Sin sombras proyectadas (un
// blob oscuro bajo los pies). Se crea una sola vez y se reutiliza; `dispose()` libera el contexto WebGL.
// Lote R3D-HEROE-NR: recibe el MISMO grado «óleo oscuro» que el héroe en el juego (herograde3d.js, perilla OIL.K) + un contraluz frío verdeazulado
// (la luz dividida cálido/frío de No Rest for the Wicked) y sombras propias, para que lo que se elige en el editor sea lo que se ve jugando.
// Uso: const pv=new HeroPreview(canvas); cada fotograma: pv.draw(look, {dir, mode:'idle'|'walk'|'run'|'wc', t}); look = {app, outfit, gear, ar, helm, boot}.
import * as THREE from 'three';
import {HeroSel as Hero} from './herosel3d.js';
import {TODH,TOD,OIL} from './materials3d.js';
import {HeroGrade} from './herograde3d.js';

export class HeroPreview{
 constructor(canvas){this.cv=canvas;
  this.r=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,premultipliedAlpha:true,stencil:true});this.r.setClearColor(0,0);this.r.toneMapping=THREE.NoToneMapping;
  this.r.shadowMap.enabled=true;this.r.shadowMap.type=THREE.PCFSoftShadowMap;this.r.autoClear=false;
  this.scene=new THREE.Scene();this.hemi=new THREE.HemisphereLight();this.sun=new THREE.DirectionalLight();this.sun.castShadow=true;this.sun.shadow.mapSize.set(1024,1024);this.sun.shadow.bias=-.0008;this.sun.shadow.normalBias=.01;
  Object.assign(this.sun.shadow.camera,{left:-1.3,right:1.3,top:1.6,bottom:-.3,near:.1,far:40});
  this.back=new THREE.DirectionalLight('#7fa3ad',.85);                                       // contraluz frío (NRftW): perfila hombros y pelo contra el fondo oscuro
  this.scene.add(this.hemi,this.sun,this.sun.target,this.back,this.back.target);
  this.hero=new Hero();this.scene.add(this.hero.obj);
  this.blob=new THREE.Mesh(new THREE.CircleGeometry(.42,24).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.32,depthWrite:false}));this.blob.position.y=.01;this.scene.add(this.blob);
  this.cam=new THREE.OrthographicCamera(-1,1,1,-1,.1,60);this.last=0;this.w=0;this.h=0;this.modeKey='';this.stepT=0;this.grade=new HeroGrade()}
 size(){const w=this.cv.clientWidth||this.cv.width,h=this.cv.clientHeight||this.cv.height,dpr=Math.min(2,window.devicePixelRatio||1);
  if(w!==this.w||h!==this.h||dpr!==this.dpr){this.w=w;this.h=h;this.dpr=dpr;this.r.setPixelRatio(dpr);this.r.setSize(w,h,false)}}
 // dir 0..7 = vuelta completa en pasos de 45° (como los botones ↺ ↻ del editor); dir 2 = de frente-diagonal, el predeterminado de creator.js
 draw(look,o={}){this.size();const now=performance.now()/1000,dt=this.last?Math.min(.1,now-this.last):1/60;this.last=now;
  const D=TODH.dia;this.hemi.color.set(D.hemS);this.hemi.groundColor.set(D.hemG);const LK=this.hero.m||this.hero.look===undefined?.72:1;this.hemi.intensity=D.hemI*LK;this.sun.color.set(D.sun);this.sun.intensity=D.sunI*LK;
  const az=(((o.dir==null?2:o.dir)-2)*Math.PI/4)+.55,EL=.42;                                 // cámara isométrica-ish (como la del juego) girable
  const asp=this.w/this.h,H=.84,cy=.7;   // encuadre algo más cerrado que antes (1.0/.62): la cara se ve mejor
  this.cam.left=-H*asp;this.cam.right=H*asp;this.cam.top=H;this.cam.bottom=-H;this.cam.updateProjectionMatrix();
  this.cam.position.set(Math.sin(az)*Math.cos(EL)*20,cy+Math.sin(EL)*20,Math.cos(az)*Math.cos(EL)*20);this.cam.lookAt(0,cy,0);
  this.sun.position.set(-5,10,3).normalize().multiplyScalar(12);this.sun.target.position.set(0,cy,0);
  this.back.position.set(-Math.sin(az)*6,4,-Math.cos(az)*6);this.back.target.position.set(0,cy,0);   // siempre detrás del personaje respecto a la cámara
  this.hero.setLook(look);const mv=o.mode==='walk'||o.mode==='run',st={x:0,y:0,z:0,mv,run:o.mode==='run',t:o.t==null?now:o.t,face:[0,1],night:0,wind:[.9,.4],hurt:0};
  if(mv)st.speed=o.mode==='run'?3.4:1.5;                                                  // velocidad virtual (el visor del héroe hace lo mismo): el paso se mueve sin desplazarse
  if(o.mode==='wc')st.act={k:'wc',ph:(now*.9)%1,col:'#9a9aa8'};
  this.hero.update(st,dt);
  const W=Math.round(this.w*this.dpr),Hh=Math.round(this.h*this.dpr),K=OIL.K;
  this.grade.begin(this.r,W,Hh);this.r.render(this.scene,this.cam);
  this.grade.end(this.r,{K:K*.85,brush:.85*Math.pow(K,1.6)*.5,lift:(TOD.dia||{}).lift||'#000000',vig:0,sc:Math.max(1,Hh/620)})}
 dispose(){try{this.hero.setLook({});this.grade.dispose();this.r.dispose();this.r.forceContextLoss()}catch(e){}}
}
