// NotScape · R3D · RETRATO DE PNJ HABLANDO (Fase 14 · diálogos, 20 oct 2026) — la «cabeza de charla» de OSRS: el PNJ en primer plano dentro del cuadro de diálogo, en 3D vivo.
// Reusa el MISMO modelo que el mundo (`makeActor(key)` de actors3d.js: plantilla horneada + esqueleto) y su animación humanoide (respira, mira alrededor), con un renderer propio sobre
// el <canvas> que le pasen (fondo transparente) y el mismo grado «óleo oscuro» del héroe (HeroGrade), igual que HeroPreview (preview3d.js).
// HABLAR (`talk` = true): la cabeza asiente al ritmo de las sílabas (cabeceo + giro leve), el torso se infla un poco con cada frase y una BOCA superpuesta (óvalo oscuro delante de la
// boca horneada) se abre y se cierra con una envolvente de habla. Al terminar (`talk` = false) la boca se cierra y la cabeza vuelve a su respiración.
// Uso: const th=new TalkHead(canvas); th.setNpc('guardia'); cada fotograma: th.draw({talk:true}); th.dispose() libera el contexto WebGL.
import * as THREE from 'three';
import {makeActor,ANIM} from './actors3d.js';
import {TODH,TOD,OIL} from './materials3d.js';
import {HeroGrade} from './herograde3d.js';

const cl=(v,a,b)=>v<a?a:v>b?b:v;
export class TalkHead{
 constructor(canvas){this.cv=canvas;
  this.r=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,premultipliedAlpha:true,stencil:true});this.r.setClearColor(0,0);this.r.toneMapping=THREE.NoToneMapping;this.r.autoClear=false;
  this.scene=new THREE.Scene();this.hemi=new THREE.HemisphereLight();this.sun=new THREE.DirectionalLight();this.back=new THREE.DirectionalLight('#7fa3ad',.85);
  this.scene.add(this.hemi,this.sun,this.sun.target,this.back,this.back.target);
  this.cam=new THREE.OrthographicCamera(-1,1,1,-1,.1,60);this.grade=new HeroGrade();
  this.A=null;this.key='';this.last=0;this.w=0;this.h=0;this.dpr=1;this.env=0;this.mouth=0;this.t0=performance.now()/1000;this.hp=new THREE.Vector3()}
 setNpc(key,mob){if(key===this.key&&this.A&&!!mob===!!this.mob)return !!this.A;this.key=key;this.mob=!!mob;
  if(this.A){this.scene.remove(this.A.grp);this.mm&&this.mm.removeFromParent();this.A.dispose();this.A=null;this.mm=null}
  let A=null;try{A=makeActor(key)}catch(e){console.warn('[TalkHead]',key,e)}
  if(!A)return false;this.A=A;this.scene.add(A.grp);A.grp.rotation.y=.5;                 // 3/4 hacia la cámara
  // boca superpuesta (la horneada no se puede animar): óvalo oscuro delante de la cara, en el espacio del hueso de la cabeza
  const m=new THREE.Mesh(new THREE.SphereGeometry(.5,12,8),new THREE.MeshBasicMaterial({color:'#3a1410'}));m.position.set(0,-.082,.212);m.scale.set(.075,.012,.016);
  if(A.b.head&&!mob){A.b.head.add(m);this.mm=m}
  return true}
 size(){const w=this.cv.clientWidth||this.cv.width,h=this.cv.clientHeight||this.cv.height,dpr=Math.min(2,window.devicePixelRatio||1);
  if(w!==this.w||h!==this.h||dpr!==this.dpr){this.w=w;this.h=h;this.dpr=dpr;this.r.setPixelRatio(dpr);this.r.setSize(w,h,false)}}
 draw(o={}){if(!this.A)return;this.size();const A=this.A,now=performance.now()/1000,dt=this.last?Math.min(.1,now-this.last):1/60;this.last=now;const t=now-this.t0;
  // envolvente de habla: sílabas ~6 Hz moduladas por frases (pausas cortas); suavizada para que la boca no «parpadee»
  const talk=!!o.talk,syl=Math.abs(Math.sin(t*10.2)),phr=cl(.45+.9*Math.sin(t*2.3)+.35*Math.sin(t*5.1+1),0,1),tgt=talk?syl*phr:0;this.env+=(tgt-this.env)*Math.min(1,dt*(talk?22:10));
  const hum=A.tpl.kind==='human',body=this.mob&&!hum;   // enemigos (setNpc(key,true)): humanoides = cabeza como un PNJ; bestias/aves/ranas = cuerpo entero con su animación propia
  (ANIM[A.tpl.kind]||ANIM.human)(A,{t,dt,mv:0,at:o.at==null?-1:o.at,wave:0,look:0});
  // cabeceo y giro al hablar (se suman sobre la pose de respiración)
  const e=this.env,nod=talk?.07*Math.sin(t*10.2+.6)*phr+.05*e:0,sway=talk?.1*Math.sin(t*2.3):0;
  if(hum)A.rot('head',-.04+nod+Math.sin(t*.6+A.seed)*.03,sway+Math.sin(t*.4+A.seed)*.1*(talk?.3:1),talk?.03*Math.sin(t*3.1):0);
  if(hum)A.rot('chest',(A.tpl.lean||0)+(talk?.025*Math.sin(t*2.3):0),0,0);
  if(this.mm){this.mm.scale.y=.012+.05*e;this.mm.scale.x=.075*(1-.18*e)}
  const D=TODH.dia;this.hemi.color.set(D.hemS);this.hemi.groundColor.set(D.hemG);this.hemi.intensity=D.hemI*.78;this.sun.color.set(D.sun);this.sun.intensity=D.sunI*.78;
  A.grp.updateMatrixWorld(true);if(body){const bb=new THREE.Box3().setFromObject(A.grp);bb.getCenter(this.hp);this.hp.y=bb.min.y+(bb.max.y-bb.min.y)*.5}else A.b.head.getWorldPosition(this.hp);const cy=this.hp.y+(body?0:.02),cx=this.hp.x,cz=this.hp.z;
  const az=.55,EL=.28,asp=this.w/this.h,H=o.H||(body?Math.max(.45,this.A.tpl.h*.62):this.A.tpl.h*.3);
  this.cam.left=-H*asp;this.cam.right=H*asp;this.cam.top=H;this.cam.bottom=-H;this.cam.updateProjectionMatrix();
  this.cam.position.set(cx+Math.sin(az)*Math.cos(EL)*20,cy+Math.sin(EL)*20,cz+Math.cos(az)*Math.cos(EL)*20);this.cam.lookAt(cx,cy-.02,cz);
  this.sun.position.set(cx-5,cy+10,cz+3).normalize().multiplyScalar(12);this.sun.target.position.set(cx,cy,cz);
  this.back.position.set(cx-Math.sin(az)*6,cy+4,cz-Math.cos(az)*6);this.back.target.position.set(cx,cy,cz);
  const W=Math.round(this.w*this.dpr),Hh=Math.round(this.h*this.dpr),K=OIL.K;
  this.grade.begin(this.r,W,Hh);this.r.render(this.scene,this.cam);
  this.grade.end(this.r,{K:K*.85,brush:.85*Math.pow(K,1.6)*.5,lift:(TOD.dia||{}).lift||'#000000',vig:0,sc:Math.max(1,Hh/620)})}
 dispose(){try{if(this.A){this.mm&&this.mm.removeFromParent();this.A.dispose()}this.grade.dispose();this.r.dispose();this.r.forceContextLoss()}catch(e){}}
}
