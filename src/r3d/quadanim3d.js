// NotScape · R3D · ESQUELETO Y ANIMACIÓN DE CUADRÚPEDOS Y BESTIAS (Lote N0-ESQUELETOS-2, 2 nov 2026; el dueño: «anima los cuadrúpedos»).
// ESQUELETO: todas las criaturas de cuatro patas (QUADS, PRA de la Pradera y los modelos de monturas salvajes de mountmodels3d.js) nacían con 8 huesos (root, body, 4 patas, head, tail).
// `autoRig(t)` AMPLÍA cualquiera de ellas al hornearla, sin tocar sus modelos: añade huesos y REPARTE LOS PESOS DE PIEL con transiciones suaves (no hay costuras que se abran):
//   · columna: body (delantero) + `hind` (trasero; las patas traseras y la cola cuelgan de él) → la espalda ondula al andar y se encoge al saltar;
//   · cuello `neck` (el antiguo `head`) + cabeza `head` + mandíbula `jaw` (abre la boca para morder);
//   · patas de 3 tramos: `legXX` (muslo) → `kneeXX` (rodilla/corvejón) → `pawXX` (casco/zarpa); cola de 3 tramos `tail` → `tailA` → `tailB` (látigo con retardo);
//   · alas con codo `wingL2/R2` (si tienen). Total ≈ 25–28 huesos. Si una criatura no tiene esas piezas (slime, gallina, rana) no se toca y sigue con `animQuad`.
// ANIMACIÓN (`animQuad2`): marcha→trote→galope con diagonales, ondulación de columna, rebote, cola con retardo, respiración, pastar/olfatear/barrer la cabeza en reposo, postura de acecho al
//   perseguir y UN ATAQUE por comportamiento (`ATK`: mordisco, embestida, zarpazo en pie, coz, salto, mordisco lateral de reptil, cabezazo, picotazo) por fotogramas clave en u = .17 anticipación (se
//   congela durante el aviso) · .21 golpe · seguimiento, más reacciones al golpe, aturdimiento y muerte. Cada criatura tiene un arquetipo (`QARCH`, mapa `QA_OF`): por defecto `bite`.
// CRIATURA NUEVA: añade su id a `QA_OF` (o `ani:` en su definición) con el arquetipo que toque; si ataca de forma única, crea un arquetipo/ataque nuevo copiando uno.
import * as THREE from 'three';
const V3=THREE.Vector3,M4=THREE.Matrix4,QT=THREE.Quaternion;
const cl=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,u)=>a+(b-a)*u,ss=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t)};

// ═══════════ AUTO-ESQUELETO ═══════════
export function autoRig(t){
 const n=t.names,ix=nm=>n.indexOf(nm);if(ix('body')<0||ix('head')<0||t.rig2)return false;
 const quad=ix('legFL')>=0,pos=t.geo.attributes.position,I0=t.geo.attributes.skinIndex.array,W0=t.geo.attributes.skinWeight.array,hp=t.hgeo.attributes.position,I1=t.hgeo.attributes.skinIndex.array,W1=t.hgeo.attributes.skinWeight.array;
 const W=t.inv.map(m=>new V3().setFromMatrixPosition(new M4().copy(m).invert()));
 const nv=pos.count,hv=hp.count,st={};   // st[bone] = {n, min[3], max[3]} (modelo en reposo)
 for(let i=0;i<nv;i++){const b=I0[i*4],s=st[b]||(st[b]={n:0,min:[1e9,1e9,1e9],max:[-1e9,-1e9,-1e9]});s.n++;for(let k=0;k<3;k++){const v=pos.array[i*3+k];if(v<s.min[k])s.min[k]=v;if(v>s.max[k])s.max[k]=v}}
 const S=nm=>st[ix(nm)]||{n:0,min:[0,0,0],max:[0,0,0]};
 if(quad&&(S('body').n<8||S('head').n<10))return false;   // se valida ANTES de tocar nada
 let did=0;
 const add=(name,parentName,p)=>{const i=n.length;n.push(name);t.parent.push(ix(parentName));t.local.push({p:p.clone().sub(W[ix(parentName)]),q:new QT(),s:new V3(1,1,1)});W.push(p.clone());t.inv.push(new M4().makeTranslation(-p.x,-p.y,-p.z));return i};
 const reparent=(nm,pn)=>{const i=ix(nm),p=ix(pn);t.parent[i]=p;t.local[i].p.copy(W[i]).sub(W[p])};
 const rules={};   // índice de hueso original → (x,y,z) => [b0,w0,b1,w1]
 const extra=[];   // piezas nuevas que se añaden a la malla (cavidad de la boca)
 if(quad){
  // columna: delantero / trasero (la mitad trasera gira un poco distinto; el cambio es suave en el 24 % central)
  const bs=S('body'),zm=(bs.min[2]+bs.max[2])*.5-(bs.max[2]-bs.min[2])*.04,R=bs.max[2]-bs.min[2];
  const hind=add('hind','body',new V3(W[ix('body')].x,W[ix('body')].y,zm)),bI=ix('body');
  rules[bI]=(x,y,z)=>{const w=ss(zm+.12*R,zm-.12*R,z);return[bI,1-w,hind,w]};
  ['legBL','legBR'].forEach(l=>reparent(l,'hind'));did=1;
  // cola: 3 tramos a lo largo de su eje
  const ts=S('tail'),tI=ix('tail');
  if(tI>=0&&ts.n>=6){reparent('tail','hind');const o=W[tI],zf=Math.abs(ts.min[2]-o.z)>Math.abs(ts.max[2]-o.z)?ts.min[2]:ts.max[2],yf=Math.abs(ts.min[1]-o.y)>Math.abs(ts.max[1]-o.y)?ts.min[1]:ts.max[1],dir=new V3(0,(yf-o.y)*.5,zf-o.z),D=dir.length();
   if(D>.05){dir.normalize();const A=add('tailA','tail',o.clone().addScaledVector(dir,D*.42)),B=add('tailB','tailA',o.clone().addScaledVector(dir,D*.74));
    rules[tI]=(x,y,z)=>{const s=((x-o.x)*dir.x+(y-o.y)*dir.y+(z-o.z)*dir.z)/D,w0=1-ss(.3,.52,s),w2=ss(.62,.84,s);return w2>0?[B,w2,A,1-w2]:w0<1?[tI,w0,A,1-w0]:[tI,1,tI,0]}}}
  // cuello / cabeza / mandíbula (el hueso `head` de siempre pasa a llamarse `neck`; el nuevo `head` nace donde empieza el cráneo)
  const hs=S('head'),hI=ix('head'),Rh=hs.max[2]-hs.min[2],zs=hs.min[2]+.38*Rh,ys=(hs.min[1]+hs.max[1])*.5,Wn=W[hI].clone();
  n[hI]='neck';const head=add('head','neck',new V3(Wn.x,ys,zs));['earL','earR'].forEach(e=>{if(ix(e)>=0)reparent(e,'head')});
  let jaw=-1,yj=0,zj=0,Hs=1;{let ymin=1e9,ymax=-1e9;for(let i=0;i<nv;i++){if(I0[i*4]!==hI)continue;const z=pos.array[i*3+2];if(z>zs+.5*(hs.max[2]-zs)){const y=pos.array[i*3+1];if(y<ymin)ymin=y;if(y>ymax)ymax=y}}
   if(ymax>ymin){Hs=ymax-ymin;yj=ymin+.36*Hs;zj=zs+.22*(hs.max[2]-zs);jaw=add('jaw','head',new V3(Wn.x,yj,zj));
    extra.push({c:[Wn.x,yj+.04*Hs,zj+.2*(hs.max[2]-zj)],r:[Math.max(.01,(hs.max[0]-hs.min[0])*.15),Hs*.28,(hs.max[2]-zj)*.26],bone:head})}}   // cavidad oscura: se ve al abrir la boca (la malla del hocico no tiene interior)
  const nI=hI;rules[hI]=(x,y,z)=>{const w=ss(zs-.07*Rh,zs+.07*Rh,z);if(w<=0)return[nI,1,nI,0];
   let wj=0;if(jaw>=0)wj=ss(yj+.05*Hs,yj-.05*Hs,y)*ss(zj,zj+.16*(hs.max[2]-zj),z);return wj>0?[jaw,wj,head,1-wj]:[head,w,nI,1-w]};
  // ojos (halos del aviso de golpe): cuelgan del `head` nuevo
  if(t.eye){const d=new V3(Wn.x,ys,zs).sub(Wn);t.eye=[t.eye[0],t.eye[1]-d.y,t.eye[2]-d.z,t.eye[3]]}}
 // patas: 3 tramos (cuadrúpedos) · aves y ranas también (muslo/rodilla/pie)
 for(const nm of['legFL','legFR','legBL','legBR','legL','legR']){const li=ix(nm),ls=S(nm);if(li<0||ls.n<6)continue;const p=W[li],L=p.y-ls.min[1];if(L<.04&&!(!quad&&L>.02))continue;const sf=nm.slice(3),
   kn=add('knee'+sf,nm,new V3(p.x,p.y-L*.5,p.z)),pw=add('paw'+sf,'knee'+sf,new V3(p.x,p.y-L*.85,p.z)),ky=p.y-L*.5,py=p.y-L*.85,e=.09*L;did=1;
  rules[li]=(x,y,z)=>{if(y>ky+e)return[li,1,li,0];if(y>ky-e){const w=ss(ky+e,ky-e,y);return[li,1-w,kn,w]}if(y>py+e)return[kn,1,kn,0];if(y>py-e){const w=ss(py+e,py-e,y);return[kn,1-w,pw,w]}return[pw,1,pw,0]}}
 // alas con codo
 for(const wn of['wingL','wingR']){const wi=ix(wn),ws=S(wn);if(wi<0||ws.n<6)continue;const p=W[wi],ext=Math.max(Math.abs(ws.min[0]-p.x),Math.abs(ws.max[0]-p.x)),sg=Math.abs(ws.min[0]-p.x)>Math.abs(ws.max[0]-p.x)?-1:1;
  if(ext<.02)continue;const w2=add(wn+'2',wn,new V3(p.x+sg*ext*.5,p.y,p.z));did=1;rules[wi]=(x,y,z)=>{const w=ss(.42,.6,(x-p.x)*sg/ext);return[wi,1-w,w2,w]}}
 if(!did)return false;
 // aplicar a malla y contorno
 const put=(I,Wt,i,r)=>{const w0=Math.round(cl(r[1],0,1)*255);I[i*4]=r[0];Wt[i*4]=w0;I[i*4+1]=r[2];Wt[i*4+1]=255-w0;I[i*4+2]=0;Wt[i*4+2]=0;I[i*4+3]=0;Wt[i*4+3]=0};
 for(let i=0;i<nv;i++){const f=rules[I0[i*4]];if(f)put(I0,W0,i,f(pos.array[i*3],pos.array[i*3+1],pos.array[i*3+2]))}
 for(let i=0;i<hv;i++){const f=rules[I1[i*4]];if(f)put(I1,W1,i,f(hp.array[i*3],hp.array[i*3+1],hp.array[i*3+2]))}
 if(extra.length)appendBlobs(t,extra);
 t.rig2=true;return true}

// añade elipsoides oscuros (peso rígido a un hueso) a la malla horneada: cavidad de la boca
function appendBlobs(t,list){const g=t.geo,A=g.attributes,old=A.position.count,idx=g.index,P=[],N=[],K=[],E=[],SI=[],SW=[],I=[];
 for(const o of list){const sg=new THREE.SphereGeometry(1,8,5),sp=sg.attributes.position,sn=sg.attributes.normal,base=old+P.length/3;
  for(let i=0;i<sp.count;i++){P.push(o.c[0]+sp.getX(i)*o.r[0],o.c[1]+sp.getY(i)*o.r[1],o.c[2]+sp.getZ(i)*o.r[2]);N.push(sn.getX(i),sn.getY(i),sn.getZ(i));K.push(.05,.012,.02);E.push(0);SI.push(o.bone,0,0,0);SW.push(255,0,0,0)}
  const ii=sg.index;for(let i=0;i<ii.count;i++)I.push(base+ii.getX(i))}
 const cat=(a,extra,Ctor)=>{const arr=new Ctor(a.array.length+extra.length);arr.set(a.array);arr.set(extra,a.array.length);return arr};
 const mk=(a,extra,Ctor,sz,nm)=>new THREE.BufferAttribute(cat(a,extra,Ctor),sz,nm);
 g.setAttribute('position',mk(A.position,P,Float32Array,3));g.setAttribute('normal',mk(A.normal,N,Float32Array,3));g.setAttribute('color',mk(A.color,K,Float32Array,3));g.setAttribute('aEmit',mk(A.aEmit,E,Float32Array,1));
 g.setAttribute('skinIndex',new THREE.BufferAttribute(cat(A.skinIndex,SI,Uint8Array),4));g.setAttribute('skinWeight',new THREE.BufferAttribute(cat(A.skinWeight,SW,Uint8Array),4,true));
 /* los índices nuevos entran DENTRO del grupo 0 (misma tela): un grupo aparte costaría una llamada de dibujo más por criatura */
 const gr=g.groups,g0=gr.find(q=>q.materialIndex===0)||gr[0],oc=idx.count,all=new Uint32Array(oc+I.length),e0=g0.start+g0.count;
 for(let i=0;i<e0;i++)all[i]=idx.getX(i);for(let i=0;i<I.length;i++)all[e0+i]=I[i];for(let i=e0;i<oc;i++)all[i+I.length]=idx.getX(i);
 gr.forEach(q=>{if(q===g0)q.count+=I.length;else if(q.start>=e0)q.start+=I.length});g.setIndex(new THREE.BufferAttribute(all,1))}

// ═══════════ ATAQUES (poses absolutas por fotogramas clave; lo que no se nombra sigue con la marcha/reposo) ═══════════
// drop: baja el cuerpo · lunge: avanza · pit: cabeceo del tronco (+ = morro abajo) · byaw/hyaw: giro del delantero/trasero · hpit: cabeceo del trasero · nkx/nky: cuello · hdx/hdy: cabeza · jaw: boca (+ = abre)
// tlr/tly: cola (levantar / barrer) · fl/fk/fp: patas delanteras (muslo + = atrás, rodilla, zarpa) · bl/bk/bp: traseras · fs: separación lateral de las delanteras · wf: aleteo
export const QJ=['drop','lunge','pit','byaw','broll','hpit','hyaw','nkx','nky','hdx','hdy','jaw','tlr','tly','fl','fk','fp','bl','bk','bp','fs','wf'];
const NJ=QJ.length,IX={};QJ.forEach((k,i)=>IX[k]=i);
const vec=o=>{const v=new Float32Array(NJ),m=new Uint8Array(NJ);for(const k in o){if(!(k in IX))throw new Error('articulación desconocida: '+k);v[IX[k]]=o[k];m[IX[k]]=1}return{v,m}};
const ATK={
 bite:[[.17,{drop:.07,lunge:-.06,pit:-.1,hpit:.1,nkx:-.35,hdx:-.25,jaw:.85,tlr:.3,fl:.35,fk:.3,bl:.25,bk:.45}],
  [.22,{drop:.1,lunge:.3,pit:.26,hpit:.0,nkx:.5,hdx:.3,jaw:0,tly:.4,fl:-.75,fk:.2,bl:.45,bk:.15}],
  [.45,{drop:.06,lunge:.18,pit:.14,nkx:.3,hdx:.15,jaw:.18,hdy:.45,fl:-.4,fk:.2,bl:.3}]],
 pounce:[[.17,{drop:.14,lunge:-.08,pit:.18,hpit:.14,nkx:.12,hdx:.0,jaw:.35,tlr:.35,tly:.4,fl:.45,fk:.8,bl:.5,bk:.85,bp:.2}],
  [.23,{drop:-.05,lunge:.42,pit:.3,hpit:-.1,nkx:.4,hdx:.2,jaw:1.0,tly:-.4,fl:-1.2,fk:0,fp:.3,bl:.8,bk:0}],
  [.5,{drop:.07,lunge:.3,pit:.16,nkx:.28,jaw:.2,fl:-.6,fk:.2,bl:.45,bk:.3}]],
 claw:[[.17,{drop:-.02,lunge:-.05,pit:-.65,hpit:.28,nkx:-.3,hdx:-.2,jaw:.6,tlr:.1,fl:-2.1,fk:.5,fp:.35,fs:.4,bl:.3,bk:.5}],
  [.23,{drop:.08,lunge:.22,pit:.18,hpit:.0,nkx:.4,hdx:.25,jaw:1.0,fl:.1,fk:.1,fs:.2,bl:.1,bk:.2}],
  [.5,{drop:.06,lunge:.15,pit:.12,nkx:.3,jaw:.25,fl:-.35,fk:.3,fs:.2}]],
 ram:[[.17,{drop:.08,lunge:-.05,pit:.14,hpit:.1,nkx:.65,hdx:.3,fl:-.9,fk:1.0,fp:.5,bl:.25,bk:.55}],
  [.23,{drop:.1,lunge:.5,pit:.2,hpit:-.05,nkx:.6,hdx:.3,fl:-.5,fk:.3,bl:.55,bk:.2}],
  [.4,{drop:.04,lunge:.38,pit:-.12,nkx:-.5,hdx:-.35,fl:-.3,fk:.3,bl:.4}],
  [.6,{lunge:.2,pit:-.05,nkx:-.2,hdx:-.1}]],
 kick:[[.17,{drop:.03,lunge:-.03,pit:.22,hpit:-.18,nkx:.1,hdx:-.15,tlr:.5,fl:.3,fk:.2,bl:-.5,bk:1.0}],
  [.22,{drop:.04,lunge:.05,pit:.32,hpit:-.3,nkx:-.25,hdx:-.2,tlr:.6,fl:.4,bl:.95,bk:-.05,bp:.4}],
  [.45,{pit:.18,hpit:-.15,bl:.55,bk:.25}]],
 snap:[[.17,{drop:.05,lunge:-.05,byaw:.45,hyaw:-.5,nky:.6,hdy:.4,nkx:-.15,jaw:.7,tly:-.55,tlr:.1,fl:.3,fk:.3,bl:.2}],
  [.22,{drop:.07,lunge:.28,byaw:-.4,hyaw:.5,nky:-.6,hdy:-.4,nkx:.35,jaw:0,tly:.7,fl:-.5,fk:.2,bl:.3}],
  [.45,{drop:.05,lunge:.15,byaw:-.2,hyaw:.3,nky:-.3,jaw:.2,tly:.3}]],
 butt:[[.17,{drop:.05,lunge:-.03,pit:.1,nkx:.55,hdx:.25,fl:.2,fk:.3}],
  [.22,{drop:.04,lunge:.2,pit:.05,nkx:-.35,hdx:-.2,fl:-.3,fk:.2}],
  [.45,{lunge:.1,nkx:-.1}]],
 peck:[[.17,{drop:.03,lunge:-.04,pit:-.12,nkx:-.4,hdx:-.2,jaw:.5,wf:-.5,tlr:.3}],
  [.22,{drop:.06,lunge:.22,pit:.25,nkx:.65,hdx:.3,jaw:0,wf:.7}],
  [.45,{lunge:.12,pit:.1,nkx:.2,jaw:.15,wf:.2}]]};
// habilidades de enemigo (N0-ESQUELETOS-3): embestida, rugido (llamar refuerzos, furia, meteoro) y pisotón (onda expansiva)
ATK.lunge=[[.17,{drop:.18,lunge:-.1,pit:.15,hpit:.15,nkx:.3,hdx:.1,jaw:.4,fl:.5,fk:.8,bl:.6,bk:1.0}],[.23,{drop:-.04,lunge:.5,pit:.3,hpit:-.1,nkx:.45,hdx:.25,jaw:.9,fl:-1.2,fk:0,bl:.9,bk:0,tly:.3}],[.5,{drop:.06,lunge:.3,pit:.14,nkx:.3,jaw:.2,fl:-.5,bl:.5}]];
ATK.roar=[[.3,{drop:.02,pit:-.5,hpit:.2,nkx:-.55,hdx:-.5,jaw:1.0,tlr:.4,fl:-1.2,fk:.6,fs:.2,bl:.2,bk:.4}],[.7,{drop:.03,pit:-.4,hpit:.15,nkx:-.7,hdx:-.6,jaw:1.1,tlr:.4,fl:-1.0,fk:.6,fs:.2,bl:.2,bk:.4}]];
ATK.roar.raw=1;
ATK.stomp=[[.17,{drop:-.02,pit:-.4,hpit:.1,nkx:-.3,hdx:-.2,jaw:.5,fl:-1.7,fk:.8,fs:.3,bl:.2,bk:.4}],[.23,{drop:.14,lunge:.1,pit:.25,hpit:-.05,nkx:.4,hdx:.25,jaw:.3,fl:.3,fk:.1,fs:.1}],[.5,{drop:.08,pit:.12,nkx:.2,fl:.1}]];
for(const k in ATK)ATK[k]=Object.assign(ATK[k].map(([u,p])=>[u,vec(p)]),{raw:ATK[k].raw});

// ═══════════ ARQUETIPOS ═══════════
// str zancada · kn rodilla · bob rebote · ys ondulación de la espalda · tl cola · nk cuello en marcha · gz pasta · sn olfatea · hn postura de acecho (cuello, bajada) · wing flota las alas
const QARCH={
 bite:{str:.58,kn:.75,bob:.02,ys:.07,tl:.3,hn:{nk:.28,dr:.04},sn:1,atk:'bite'},
 pounce:{str:.6,kn:.85,bob:.025,ys:.1,tl:.55,hn:{nk:.32,dr:.09},sn:1,atk:'pounce'},
 claw:{str:.5,kn:.65,bob:.04,ys:.06,tl:.1,hn:{nk:-.05,dr:0},sn:1,atk:'claw'},
 ram:{str:.5,kn:.6,bob:.03,ys:.05,tl:.2,hn:{nk:.55,dr:.03},gz:1,atk:'ram'},
 kick:{str:.64,kn:.8,bob:.022,ys:.05,tl:.6,hn:{nk:.12,dr:0},gz:1,atk:'kick'},
 reptile:{str:.42,kn:.7,bob:.01,ys:.32,tl:.45,hn:{nk:.1,dr:.05},atk:'snap',sp:1},
 grazer:{str:.5,kn:.62,bob:.02,ys:.05,tl:.4,hn:{nk:.3,dr:0},gz:1,atk:'butt'},
 armored:{str:.34,kn:.5,bob:.01,ys:.03,tl:.1,hn:{nk:.15,dr:0},atk:'ram'},
 bird:{str:.5,kn:.6,bob:.02,ys:.04,tl:.3,hn:{nk:.2,dr:.02},atk:'peck',wing:1},
 flyer:{str:.5,kn:.7,bob:.02,ys:.06,tl:.3,hn:{nk:.25,dr:.03},atk:'peck',wing:1}};
const L=(a,k)=>a.split(',').forEach(i=>QA_OF[i]=k);
export const QA_OF={};
L('lobo,b1,zorro,zorrorojo,sabueso,huargo,espectral,komainu,tejon','bite');L('tigre,tigreblanco,lince,esfinge','pounce');L('oso,k1,osopardo,osoblanco,osomusgo,panda,mamut','claw');
L('jabali,toro,uro,bufalo,yak,yakcarga,rino,ibice,ibicecristal,alce,ciervo,cerdo','ram');L('caballo,poni,asno,camello,orix,unicornio,pegaso,corcelinfernal,qilin,avestruz,ciervorunico,ciervolunar','kick');
L('lagarto,varano,salamandra,gola,iguana,cocodrilo,dragon,raptor','reptile');L('vaca,oveja,cordero,cabra,conejo','grazer');L('tortuga,tortugadragon,cangrejo,cangrejorey,escarabajo,escarabajosol','armored');L('aveterror,grulla,gavion,cuervo','bird');L('grifo','flyer');
const arch=A=>{const t=A.tpl;return t._qa||(t._qa=QARCH[t.ani||QA_OF[A.key]||'bite']||QARCH.bite)};

const QSK={lunge:'lunge',slam:'claw',meteor:'roar',nova:'stomp',call:'roar',roar:'roar'};   // habilidad de enemigo → ataque de cuadrúpedo
const B=new Float32Array(NJ),J=new Float32Array(NJ);
export function animQuad2(A,s){
 const {t,dt=.016,mv=0,at=-1,hunt,hurt=0,stun=0,die=0,ak=null,charge=0}=s,a=mv,ph=A.ph,seed=A.seed,R=arch(A),bs=A.b,rp=A.restP,tpl=A.tpl;
 A.hw=(A.hw||0)+(((hunt||at>=0)?1:0)-(A.hw||0))*Math.min(1,dt*5);const hw=A.hw*(1-.5*Math.min(1,a));
 B.fill(0);const g=ss(.55,1.05,a),idl=1-Math.min(1,a*2.5),br=Math.sin(t*1.9+seed),sw=R.str,sp=R.sp?1:0;
 // fases de cada pata: trote en diagonales (FL+BR / FR+BL) → galope (delanteras juntas y traseras juntas, desfasadas)
 const pFL=0,pFR=lerp(Math.PI,.35,g),pBR=lerp(0,Math.PI*.85,g),pBL=lerp(Math.PI,Math.PI*.95,g);
 const leg=(p,front)=>{const c=Math.cos(ph+p),sn=Math.sin(ph+p),lift=Math.max(0,c);return{up:sn*sw*a*(1+g*.5),kn:lift*R.kn*a*(front?1:.8)+.05,pw:-.55*lift*a+Math.max(0,sn)*.3*a}};
 const lFL=leg(pFL,1),lFR=leg(pFR,1),lBR=leg(pBR,0),lBL=leg(pBL,0);
 // tronco: ondulación (los reptiles reptan), rebote, galope con la espalda que se encoge y se estira
 B[IX.byaw]=Math.sin(ph)*R.ys*a;B[IX.hyaw]=-Math.sin(ph)*R.ys*1.3*a;B[IX.broll]=Math.cos(ph)*.03*a*(1+sp);
 B[IX.pit]=Math.sin(ph*2+.4)*.035*a+g*Math.sin(ph+.6)*.13+br*.012*idl;B[IX.hpit]=-g*Math.sin(ph+.6)*.12;
 B[IX.drop]=Math.abs(Math.cos(ph))*R.bob*a+g*Math.abs(Math.sin(ph+.3))*.05;
 // cuello y cabeza: cabeceo con el paso, barrido de cabeza, olfateo y pasto
 const sc=Math.sin(t*.45+seed)+Math.sin(t*1.1+seed*1.7)*.4;B[IX.nkx]=Math.sin(ph*2)*.07*a+br*.02*idl+.05;B[IX.nky]=sc*.28*idl;B[IX.hdy]=sc*.18*idl;B[IX.hdx]=-.03*a+Math.sin(t*.8+seed)*.03*idl;
 if(R.sn){const sn=ss(.8,.95,Math.sin(t*.31+seed*2.3))*idl;B[IX.nkx]+=sn*(.2+Math.sin(t*9)*.07);B[IX.hdx]+=sn*.15}
 if(R.gz){const gz=ss(.55,.7,Math.sin(t*.17+seed*3))*idl*(1-A.hw);B[IX.nkx]+=gz*.85;B[IX.hdx]+=gz*.3;B[IX.jaw]=gz*(.12+.1*Math.sin(t*6));B[IX.fl]-=gz*.15;B[IX.drop]+=gz*.03}
 // cola con retardo en cada tramo
 const tf=a>.2?7+a*3:2.2,tw=R.tl*(.4+a*.6);B[IX.tlr]=.1+Math.sin(t*tf+seed)*.12*tw+(hw>.1?.25*hw:0);B[IX.tly]=Math.sin(t*tf*.8+seed)*tw;
 // acecho: cuello bajo, cuerpo agazapado
 if(hw>.01){B[IX.nkx]=lerp(B[IX.nkx],R.hn.nk,hw);B[IX.drop]+=R.hn.dr*hw;B[IX.pit]+=R.hn.dr*1.5*hw;B[IX.fk]+=.2*hw;B[IX.bk]+=.25*hw}
 // aleteo (aves y bestias aladas): pliegue que respira; abiertos y batiendo al correr
 B[IX.wf]=R.wing?Math.sin(t*(a>.3?16:1.4)+seed)*(a>.3?.35:.05):0;
 if(charge>0){B[IX.pit]+=.25*charge;B[IX.nkx]+=.35*charge;B[IX.drop]+=.05*charge;B[IX.jaw]+=.4*charge}   /* embestida */
 J.set(B);
 // ── ataque ──
 let wa=0;
 if(at>=0){const kk=QSK[ak]||R.atk,ks=ATK[kk]||ATK.bite,raw=!!ks.raw,u=at;wa=ss(0,.15,u)*(1-ss(raw?.75:.5,1,u));
  let i=0;while(i<ks.length-1&&u>ks[i+1][0])i++;const k0=ks[i],k1=ks[Math.min(ks.length-1,i+1)],f=u<=ks[0][0]?0:i>=ks.length-1?1:ss(k0[0],k1[0],u),pa=u<=ks[0][0]?ks[0][1]:k0[1],pb=u<=ks[0][0]?ks[0][1]:k1[1];
  for(let j=0;j<NJ;j++){if(!(pa.m[j]|pb.m[j]))continue;const va=pa.m[j]?pa.v[j]:B[j],vb=pb.m[j]?pb.v[j]:B[j];J[j]=lerp(B[j],lerp(va,vb,f),wa)}}
 // ── reacciones ──
 if(hurt>.01){const h=hurt*(1-wa*.5);J[IX.pit]-=.25*h;J[IX.hpit]+=.15*h;J[IX.nkx]-=.45*h;J[IX.hdx]-=.3*h;J[IX.jaw]+=.5*h;J[IX.tlr]+=.4*h;J[IX.byaw]+=.25*h*Math.sin(seed);J[IX.fk]+=.3*h;J[IX.drop]+=.04*h}
 if(stun>0){J[IX.nkx]+=.5*stun;J[IX.hdx]+=.3*stun;J[IX.nky]+=Math.sin(t*2.3)*.3*stun;J[IX.byaw]+=Math.sin(t*3)*.15*stun;J[IX.fk]+=.15*stun;J[IX.bk]+=.15*stun}
 if(die>0){const d=die;J[IX.drop]+=.35*d;J[IX.fk]=lerp(J[IX.fk],1.2,d);J[IX.bk]=lerp(J[IX.bk],1.1,d);J[IX.fl]=lerp(J[IX.fl],-.4,d);J[IX.bl]=lerp(J[IX.bl],.5,d);J[IX.nkx]+=.5*d;J[IX.hdx]+=.3*d;J[IX.jaw]=lerp(J[IX.jaw],.4,d);J[IX.tlr]=lerp(J[IX.tlr],-.3,d)}
 // ── aplicar ──
 const j=IX,spread=J[j.fs];
 bs.body.position.y=rp.body.y-J[j.drop];bs.root.position.z=rp.root.z+J[j.lunge]*tpl.rad*.5;
 A.rot('body',J[j.pit],J[j.byaw],J[j.broll]);A.rot('hind',J[j.hpit],J[j.hyaw],-J[j.broll]*.8);A.rot('neck',J[j.nkx],J[j.nky],0);A.rot('head',J[j.hdx],J[j.hdy],0);A.rot('jaw',J[j.jaw],0,0);
 A.rot('tail',-J[j.tlr]*.4,J[j.tly]*.5,0);A.rot('tailA',-J[j.tlr]*.3,J[j.tly]*.55,0);A.rot('tailB',-J[j.tlr]*.3,J[j.tly]*.6,0);if(bs.tail2)A.rot('tail2',Math.sin(t*3+1)*.3,Math.sin(t*2.5+2)*.35,0);
 const fl=(n,l,sx)=>{A.rot('leg'+n,(l.up+J[j.fl])*(n[0]==='F'?1:0),0,sx*spread);A.rot('knee'+n,l.kn+J[j.fk],0,0);A.rot('paw'+n,l.pw+J[j.fp],0,0)};
 const bl=(n,l)=>{A.rot('leg'+n,l.up+J[j.bl],0,0);A.rot('knee'+n,l.kn+J[j.bk],0,0);A.rot('paw'+n,l.pw+J[j.bp],0,0)};
 fl('FL',lFL,-1);fl('FR',lFR,1);bl('BL',lBL);bl('BR',lBR);
 {const fk=ss(.94,1,Math.sin(t*1.7+seed*5)),fk2=ss(.94,1,Math.sin(t*1.3+seed*9)),back=-.6*A.hw-.5*stun-.4*hurt;   /* orejas: sacuden de vez en cuando, se echan atrás al acechar */
  A.rot('earL',back+fk*.5,0,Math.sin(t*.6+seed)*.06+fk*.15);A.rot('earR',back+fk2*.5,0,-Math.sin(t*.6+seed*1.3)*.06-fk2*.15)}
 if(bs.wingL){A.rot('wingL',0,0,J[j.wf]);A.rot('wingR',0,0,-J[j.wf]);A.rot('wingL2',0,0,J[j.wf]*.6);A.rot('wingR2',0,0,-J[j.wf]*.6)}}

// ═══════════ SLIME, GALLINA Y RANA (lote N0-ESQUELETOS-3) ═══════════
// SLIME: gelatina por ESCALA de huesos (aplastar/estirar): salta al andar, se aplasta antes de lanzarse, se estira al golpear y tiembla como flan al recibir daño
export function animSlime(A,s){
 const {t,dt=.016,mv=0,at=-1,hurt=0,stun=0,die=0}=s,ph=A.ph,seed=A.seed,b=A.b,rp=A.restP,tpl=A.tpl,hs=Math.sin(ph),air=Math.max(0,hs),a=mv;
 let sy=1+.045*Math.sin(t*2.4+seed),sh=1-.03*Math.sin(t*2.4+seed),lift=0,lunge=0,rx=0;
 if(a>.05){sy=lerp(sy,hs>0?1+.28*hs:1+.2*hs,Math.min(1,a*1.4));sh=lerp(sh,hs>0?1-.14*hs:1-.12*hs,Math.min(1,a*1.4));lift=air*.2*a*tpl.h}
 if(at>=0){const u=at,wind=ss(0,.15,u)*(1-ss(.18,.24,u)),hit=ss(.17,.23,u)*(1-ss(.23,.5,u)),w=Math.exp(-Math.max(0,u-.3)*6)*Math.sin(Math.max(0,u-.3)*34);
  sy=lerp(sy,.55,wind);sh=lerp(sh,1.3,wind);sy=lerp(sy,1.35,hit);sh=lerp(sh,.82,hit);sy+=w*.12;sh-=w*.07;lunge=hit*.55;lift=hit*.18*tpl.h;rx=-.25*hit+.2*wind}
 if(hurt>.01){const h=hurt;sy=lerp(sy,.62,h);sh=lerp(sh,1.28,h);sy+=Math.sin(t*38)*.06*h}
 if(stun>0){sy+=Math.sin(t*9)*.08*stun;sh-=Math.sin(t*9)*.05*stun;rx+=Math.sin(t*5)*.1*stun}
 if(die>0){sy=lerp(sy,.22,die);sh=lerp(sh,1.7,die)}
 b.body.scale.set(sh,sy,sh);b.body.position.y=rp.body.y+lift*(1-die);b.root.position.z=rp.root.z+lunge*tpl.rad*.5;A.rot('body',rx,0,0);A.rot('head',Math.sin(t*.8+seed)*.08,Math.sin(t*.5+seed)*.12,0)}

// GALLINA: pasos con cabeceo de gallina, picoteo y escarbar, alas que se sacuden/aletean al huir, picotazo defensivo
export function animBird2(A,s){
 const {t,dt=.016,mv=0,at=-1,hurt=0,stun=0,die=0}=s,ph=A.ph,sn=Math.sin(ph),cs=Math.cos(ph),seed=A.seed,b=A.b,rp=A.restP,a=mv;
 A.peck=Math.max(0,A.peck-dt*2.5);const idl=a<.05;if(idl&&A.peck<=0&&Math.sin(t*.7+seed)>.55&&Math.sin(t*1.9+seed*3)>.6)A.peck=1;const pk=Math.sin(Math.min(1,A.peck)*Math.PI);
 const scr=idl?ss(.5,.62,Math.sin(t*.23+seed*2))*(1-pk):0,sc=Math.sin(t*9)*scr;   // escarba con una pata
 A.rot('legL',-sn*.8*a+sc*.7,0,0);A.rot('kneeL',Math.max(0,cs)*.9*a+.05+Math.max(0,sc)*.5,0,0);A.rot('pawL',-.5*Math.max(0,cs)*a+Math.max(0,sn)*.3*a,0,0);
 A.rot('legR',sn*.8*a,0,0);A.rot('kneeR',Math.max(0,-cs)*.9*a+.05,0,0);A.rot('pawR',-.5*Math.max(0,-cs)*a+Math.max(0,-sn)*.3*a,0,0);
 b.body.position.y=rp.body.y+Math.abs(cs)*.012*a-Math.abs(sc)*.004;let hz=Math.sin(ph)*.03*a,hx=.12*Math.sin(ph*2)*a+pk*1.0+Math.sin(t*.9+seed)*.08,hy=Math.sin(t*.5+seed)*.3*(1-a),bx=pk*.35+scr*.15+.05*Math.sin(t*2.2+seed);
 let wl=-.25,wl2=0,fr=ss(.6,1,a);if(fr>0){const f=Math.sin(t*30+seed);wl=-.25-fr*(.9+f*.6);wl2=-fr*.4*f}
 if(at>=0){const u=at,w=ss(0,.15,u)*(1-ss(.5,1,u)),k=ss(.15,.23,u)*(1-ss(.23,.6,u));hx=lerp(hx,-.5*(1-k)+.8*k,w);hz=lerp(hz,-.02*(1-k)+.03*k,w);bx=lerp(bx,-.25*(1-k)+.4*k,w);wl=lerp(wl,-1.1+Math.sin(u*80)*.3*k,w)}
 if(hurt>.01){hx-=.5*hurt;bx-=.2*hurt;wl-=.5*hurt}if(stun>0){hy+=Math.sin(t*4)*.4*stun;hx+=.3*stun}
 if(die>0){A.rot('kneeL',1.2*die,0,0);A.rot('kneeR',1.2*die,0,0);bx+=.2*die;wl-=.3*die}
 b.head.position.z=rp.head.z+hz;A.rot('head',hx,hy,0);A.rot('body',bx,0,0);A.rot('wingL',0,0,wl);A.rot('wingR',0,0,-wl);A.rot('wingL2',0,0,wl2);A.rot('wingR2',0,0,-wl2);A.rot('tail',-.15+Math.sin(t*3+seed)*.05+.1*fr,0,0)}

// RANA: salto con las traseras plegándose y estirándose (muslo/rodilla/pie), delanteras amortiguando, garganta que late, salto-mordisco
export function animFrog2(A,s){
 const {t,dt=.016,mv=0,at=-1,hurt=0,stun=0,die=0}=s,ph=A.ph,seed=A.seed,b=A.b,rp=A.restP,a=mv,hh=Math.max(0,Math.sin(ph)),sq=1-hh,air=hh>.05;
 let up=hh*.22*a,pit=-.3*hh*a+.14*sq*a,thB=.9*sq*a-hh*.9*a,knB=1.5*sq*a+.1*hh*a,pwB=-.9*sq*a+.5*hh*a,thF=-hh*.7*a-(sq*.2*a),knF=.4*sq*a,lunge=0;
 if(at>=0){const u=at,w=ss(0,.15,u)*(1-ss(.5,1,u)),k=ss(.15,.23,u)*(1-ss(.23,.55,u));thB=lerp(thB,.9*(1-k)-.8*k,w);knB=lerp(knB,1.8*(1-k)+.1*k,w);pwB=lerp(pwB,-1*(1-k)+.6*k,w);pit=lerp(pit,.2*(1-k)-.35*k,w);up=lerp(up,.18*k,w);lunge=k*w*.5;thF=lerp(thF,-.3*(1-k)-1.0*k,w)}
 if(hurt>.01){pit-=.3*hurt;up+=.05*hurt}if(stun>0){pit+=Math.sin(t*4)*.1*stun}if(die>0){knB=lerp(knB,1.7,die);thB=lerp(thB,1.0,die);pit+=.2*die;up-=.05*die}
 b.root.position.y=rp.root.y+up;b.root.position.z=rp.root.z+lunge*A.tpl.rad*.5;A.rot('body',pit,0,0);
 for(const q of['BL','BR']){A.rot('leg'+q,thB,0,0);A.rot('knee'+q,knB,0,0);A.rot('paw'+q,pwB,0,0)}for(const q of['FL','FR']){A.rot('leg'+q,thF,0,0);A.rot('knee'+q,knF,0,0)}
 const br=Math.sin(t*5.2+seed)*.5+.5;b.body.scale.set(1,1+br*.05*(1-a),1+br*.04*(1-a));A.rot('head',Math.sin(t*.6+seed)*.1+(air?-.15:0),Math.sin(t*.4+seed)*.2*(1-a),0)}
