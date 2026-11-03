// NotScape · R3D · ATUENDOS INICIALES DEL HÉROE (lote N0.5-ATUENDOS-2, 3 nov 2026; el dueño: «rehaz la ropa inicial de todos los skins, más bonita y detallada, con mejores texturas
// y que sigan una estructura distinta cada una»). `kitWear(kit,F,g,part,C)` dibuja el atuendo `O.kit` (outfits3d.js) sobre el cuerpo de mini3d.js. Cada uno tiene SILUETA PROPIA:
//  · errante    = túnica CRUZADA (solapa diagonal de lino) + faldón partido delante/detrás (se mueve con las piernas) + fajín anudado + petate a la espalda + vendas en las espinillas.
//  · penitente  = túnica larga + capelina de bajo DESGARRADO + capucha caída + cordón con nudos y borla + rosario con medalla + vendas en los antebrazos + cenefa del bajo.
//  · mercenario = brigantina de cuero con LÁMINAS remachadas + gorjal + cinturón de tachuelas + faldar de cuero + escarcelas en los muslos + hombrera de 3 lamas + manto de piel + brazales.
//  · cazadora   = corsé de cuero ABIERTO con lazada en X + capelina de hojas con capucha caída + brazal largo de arquera + paño de cadera + funda de cuchillo + polainas.
// Texturas: las de clase de `toon` (tela/lino/cuero/metal/pelo, procedurales en el shader) a escala de personaje (`TX`). Brazos y piernas: las piezas cuelgan de su articulación
// (F.arms/F.elbows/F.legs/F.knees) y se mueven con la animación; los faldones van en F.flaps (física de skirt3d.js). Nada de cajas: lathe, cintas curvas (`ribbon`) y capas.
// C = {Rf (radio del torso a la altura y), W, aw (grosor de brazo), lw (de pierna), robe, DRf (radio del vestido largo, penitente), sash/cape/lea (colores del atuendo)}.
// ATUENDO NUEVO = una función aquí + su fila en OUTFITS (outfits3d.js) con `outfit.kit`.
import * as THREE from 'three';
import {ribbon,arc,shell,shade,mixc} from './outfitwear3d.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const TXP={tela:{tex:'cuero',texS:10,texA:.08,texB:0},lino:{tex:'cuero',texS:12,texA:.06,texB:0},cuero:{tex:'cuero',texS:11,texA:.16,texB:.015},metal:{tex:'metal',texS:11,texA:.18,texB:.02},pelo:{tex:'cuero',texS:30,texA:.3,texB:.04}};   /* la «tela» del shader (k1) es un punteado que parece semitono a escala de personaje: la tela usa el moteado suave del cuero, más fino y con menos contraste */   /* amplitudes bajas: el cuero/metal con más contraste se leían como camuflaje */
export const TX=(k,ds)=>({t:Object.assign({},TXP[k],ds?{side:THREE.DoubleSide}:{})});
const lathe=(pts,n=28,p0=0,pl=Math.PI*2)=>new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),n,p0,pl);
const band=(r,y,w,t=.007,n=28)=>lathe([[r,y-w/2],[r+t,y-w/2+.003],[r+t,y+w/2-.003],[r,y+w/2]],n);
const cuff=(r0,r1,y0,y1,t=.006,n=14)=>lathe([[r0-.002,y0],[r0+t,y0-.004],[r1+t,y1+.004],[r1-.002,y1]],n);   // brazal / polaina (ejes del hueso: el miembro baja por −y)
function helix(r,y0,y1,turns,w,n=40){const P=[],I=[];for(let i=0;i<=n;i++){const s=i/n,f=s*turns*Math.PI*2,y=y0+(y1-y0)*s,c=Math.cos(f),sn=Math.sin(f);P.push(r*sn,y-w/2,r*c,r*sn,y+w/2,r*c)}
 for(let i=0;i<n;i++){const a=i*2;I.push(a,a+2,a+1,a+1,a+2,a+3)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setIndex(I);g.computeVertexNormals();return g}
function dots(list,r=.006){const P=[];list.forEach(p=>{const q=new THREE.IcosahedronGeometry(r,0).translate(p[0],p[1],p[2]).attributes.position.array;for(const x of q)P.push(x)});const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.computeVertexNormals();return g}   // remaches, cuentas, tachuelas: UNA malla
const onT=(Rf,ph,y,off=.02)=>{const R=Rf(y)+off;return[R*Math.sin(ph),y,R*Math.cos(ph)]};
// capa/capelina de revolución: perfil [[r,y],…] de arriba abajo; el bajo se recorta con `jag(φ)` (desgarrado, hojas…)
function cape(prof,jag,n=40){const R=prof.length,P=[],I=[];for(let j=0;j<=n;j++){const f=Math.PI*2*j/n,c=Math.cos(f),s=Math.sin(f);for(let i=0;i<R;i++){let [r,y]=prof[i];if(i===R-1)y+=jag(f);else if(i===R-2)y+=jag(f)*.35;P.push(r*s,y,r*c)}}
 for(let j=0;j<n;j++)for(let i=0;i<R-1;i++){const a=j*R+i,b=a+1,cc=a+R,d=cc+1;I.push(a,b,cc,b,d,cc)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setIndex(I);g.computeVertexNormals();return g}
// paño con pivote (faldones): F.flaps → skirt3d.js lo aparta con las piernas
function sheet(w,h,dir,curl=1.4){const nx=10,ny=7,P=[],I=[];for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const u=i/nx-.5,t=j/ny,x=u*w*(1+.12*t),z=dir*(-(x*x)*curl+t*t*.035);P.push(x,-t*h,z)}   /* liso: el dueño no quiere pliegues pequeños */
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;I.push(a,c,b,b,c,d)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setIndex(I);g.computeVertexNormals();return g}
function hang(F,g,part,w,h,col,y,z,dir,tx){const pv=new THREE.Group();pv.position.set(0,y,z);g.add(pv);(F.flaps||(F.flaps=[])).push({g:pv,dir,y0:y,z0:Math.abs(z),h});return part(sheet(w,h,dir),col,0,0,0,Object.assign({p:pv,ink:.01},tx))}
const fur=(R,r,a)=>{const g=new THREE.TorusGeometry(R,r,8,24,a),p=g.attributes.position,v=new THREE.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const k=1+.25*(Math.sin(v.x*90+v.y*30)*Math.sin(v.y*70+v.z*60)*.5+.5);p.setXYZ(i,v.x,v.y,v.z*k)}g.computeVertexNormals();return g};   // piel con mechones (abultada en el grosor)

function errante(F,g,part,C){const {Rf,robe}=C,lin=mixc(robe,'#e6dac0',.6),dk=shade(robe,.58),sash=C.sash||mixc('#8a3a2a',robe,.25),lea='#5e4230';
 const lap=[];for(let i=0;i<=14;i++){const u=i/14;lap.push([-.62+1.3*u,.81-.3*u])}
 part(ribbon(lap,.08,Rf,.012),lin,0,0,0,{p:g,ink:.006,...TX('lino',1)});part(ribbon(lap.map(([f,y])=>[f+.06,y+.045]),.01,Rf,.016),dk,0,0,0,{p:g,ink:0,...TX('tela',1)});   // solapa cruzada + pespunte
 part(band(Rf(.8)+.004,.805,.035,.012),lin,0,0,0,{p:g,ink:.008,...TX('lino')});   // cuello de lino
 hang(F,g,part,.27,.2,robe,.5,Rf(.5)+.014,1,TX('tela',1));hang(F,g,part,.27,.22,robe,.5,-(Rf(.5)+.014),-1,TX('tela',1));   // faldón partido
 part(ribbon(arc(0,Math.PI*2,.505,.505,30),.07,Rf,.02),sash,0,0,0,{p:g,ink:.008,...TX('tela',1)});   // fajín
 {const k=onT(Rf,1.05,.5,.035);part(new THREE.SphereGeometry(.03,10,8).scale(1.2,.9,.8),shade(sash,.9),k[0],k[1],k[2],{p:g,ink:.008,...TX('tela')});
  [[-.02,.15],[.025,.12]].forEach(([dx,l])=>part(ribbon(arc(1.05+dx*4,1.12+dx*4,.49,.49-l,6),.03,Rf,.036),shade(sash,.82),0,0,0,{p:g,ink:.005,...TX('tela',1)}))}   // nudo + dos puntas
 {const bg=new THREE.Group();bg.position.set(0,.74,-(Rf(.72)+.055));g.add(bg);part(new THREE.CylinderGeometry(.052,.052,.3,14).rotateZ(Math.PI/2),'#7a6a52',0,0,0,{p:bg,ink:.01,...TX('tela')});   // petate enrollado
  part(new THREE.TorusGeometry(.046,.005,6,14).rotateY(Math.PI/2),'#6a5040',0,0,0,{p:bg,ink:0});[-.1,.1].forEach(x=>part(new THREE.TorusGeometry(.055,.009,6,16).rotateY(Math.PI/2),lea,x,0,0,{p:bg,ink:.004,...TX('cuero')}))}
 F.knees.forEach(k=>{part(helix(.067*C.lw,-.005,-.062,2.2,.018),lin,0,0,0,{p:k,ink:0,...TX('lino',1)});part(band(.072*C.lw,-.055,.022,.008,16),lea,0,0,0,{p:k,ink:.006,...TX('cuero')})});   // vendas de viaje + caña de la bota
 {const e=F.elbows[1];part(cuff(.056*C.aw,.06*C.aw,-.03,-.13),lea,0,0,0,{p:e,ink:.008,...TX('cuero')});part(helix(.064*C.aw,-.04,-.12,1.5,.006,24),'#c8b088',0,0,0,{p:e,ink:0,...TX('lino',1)})}}   // brazal izquierdo con cordón

function penitente(F,g,part,C){const {DRf,W}=C,cap=C.cape||'#3e3a40',bd='#d8cfb8',gold='#c9a95e';
 const jag=f=>-.028*Math.abs(Math.sin(f*3.5))-.016*Math.abs(Math.sin(f*9+1))-.01*Math.sin(f*17);
 part(cape([[.07*W,.9],[.15*W,.865],[.235*W,.815],[.262*W,.76],[.27*W,.71]],jag,44),cap,0,0,0,{p:g,ink:.012,...TX('tela',1)});   // capelina desgarrada
 part(new THREE.SphereGeometry(.13,16,10,0,Math.PI*2,0,1.6).scale(1.05,.62,.7).rotateX(.5),cap,0,.85,-.17,{p:g,ink:.012,...TX('tela',1)});   // capucha caída
 part(new THREE.TorusGeometry(DRf(.53)+.012,.013,6,30).rotateX(Math.PI/2),'#a08a60',0,.53,0,{p:g,ink:.006,...TX('tela')});   // cordón
 {const f=.55,pts=[],R=y=>DRf(y)+.022;for(let i=0;i<=8;i++){const y=.52-.3*i/8;pts.push(new THREE.Vector3(R(y)*Math.sin(f+.02*i),y,R(y)*Math.cos(f+.02*i)))}
  part(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),16,.01,6),'#a08a60',0,0,0,{p:g,ink:.005});[3,6].forEach(i=>{const q=pts[i];part(new THREE.SphereGeometry(.018,8,6),'#8a7450',q.x,q.y,q.z,{p:g,ink:.005})});
  const e=pts[8];part(new THREE.ConeGeometry(.024,.06,8),'#8a7450',e.x,e.y-.02,e.z,{p:g,ink:.005})}   // cordón colgante con nudos y borla
 {const L=[];for(let i=0;i<=14;i++){const u=i/14,f=-.6+1.2*u,y=.71-.07*Math.sin(u*Math.PI);L.push(onT(DRf,f,y,.034))}part(dots(L,.011),'#5a3e2c',0,0,0,{p:g,ink:0});
  const m=onT(DRf,0,.615,.04);part(new THREE.CylinderGeometry(.03,.03,.008,14).rotateX(Math.PI/2),gold,m[0],m[1],m[2],{p:g,ink:.006,...TX('metal')})}   // rosario + medalla
 F.elbows.forEach(e=>part(helix(.058*C.aw,-.02,-.15,4,.022,56),bd,0,0,0,{p:e,ink:0,...TX('lino',1)}));   // vendas
 part(ribbon(arc(0,Math.PI*2,.1,.1,32),.055,DRf,.006),shade(C.robe,.7),0,0,0,{p:g,ink:.006,...TX('tela',1)})}   // cenefa del bajo

function mercenario(F,g,part,C){const {Rf,W}=C,lea=C.lea||'#4a3428',st='#8e9098',fr=C.fur||'#6a5a4a';
 part(lathe([[Rf(.5)+.014,.49],[Rf(.6)+.017,.6],[Rf(.7)+.018,.7],[Rf(.79)+.016,.79],[Rf(.8)*.8,.84]]),lea,0,0,0,{p:g,ink:.012,...TX('cuero',1)});   // cuerpo de cuero
 [.55,.62,.69].forEach((y,i)=>{part(ribbon(arc(-1.45,1.45,y,y,18),.06,Rf,.026),i%2?shade(st,.88):st,0,0,0,{p:g,ink:.006,...TX('metal',1)});const L=[];for(let k=0;k<=8;k++)L.push(onT(Rf,-1.35+2.7*k/8,y+.022,.032));part(dots(L,.006),'#c8b070',0,0,0,{p:g,ink:0})});   // láminas remachadas
 part(lathe([[Rf(.8)*.82,.79],[Rf(.8)*.86,.85],[Rf(.8)*.8,.88]]),shade(lea,.85),0,0,0,{p:g,ink:.01,...TX('cuero',1)});   // gorjal
 part(ribbon(arc(0,Math.PI*2,.5,.5,30),.06,Rf,.03),'#2e2018',0,0,0,{p:g,ink:.008,...TX('cuero',1)});{const L=[];for(let k=0;k<14;k++)L.push(onT(Rf,k/14*Math.PI*2,.5,.04));part(dots(L,.007),'#b8a060',0,0,0,{p:g,ink:0});
  const b=onT(Rf,0,.5,.045);part(new THREE.TorusGeometry(.024,.007,6,12),'#c8a050',b[0],b[1],b[2],{p:g,ink:.004,...TX('metal')})}   // cinturón con tachuelas y hebilla
 hang(F,g,part,.24,.17,shade(lea,1.1),.48,Rf(.48)+.03,1,TX('cuero',1));hang(F,g,part,.26,.17,shade(lea,1.1),.48,-(Rf(.48)+.03),-1,TX('cuero',1));   // faldar
 F.legs.forEach((l,i)=>{const q=i?1:-1;part(new THREE.CylinderGeometry(.094*C.lw,.1*C.lw,.12,10,1,true,q>0?Math.PI/2-.9:-Math.PI/2-.9,1.8).translate(0,-.07,0),st,0,0,0,{p:l,ink:.008,...TX('metal',1)})});   // escarcelas (lado de fuera del muslo)
 {const a=F.arms[1];[0,1,2].forEach(i=>part(new THREE.SphereGeometry(.1*C.aw-i*.006,14,8,0,Math.PI*2,0,1.25).scale(1.12,.7,1.05),i%2?shade(st,.85):st,.012,.035-i*.04,0,{p:a,ink:.01,...TX('metal',1)}))}   // hombrera de 3 lamas
 {const fm=fur(.16*W,.055,Math.PI*1.25);fm.rotateX(Math.PI/2).rotateY(-.4);part(fm,fr,0,.84,0,{p:g,ink:.012,...TX('pelo')})}   // manto de piel sobre el hombro derecho
 F.elbows.forEach(e=>{part(cuff(.058*C.aw,.064*C.aw,-.03,-.135),lea,0,0,0,{p:e,ink:.008,...TX('cuero')});part(cuff(.066*C.aw,.07*C.aw,-.05,-.11,.004,10),st,0,0,0,{p:e,ink:.004,...TX('metal')})})}   // brazales

function cazadora(F,g,part,C){const {Rf,W}=C,lea=C.lea||'#5a4632',cp=C.cape||'#3e4e34',lc='#d8c08a';
 part(shell(Rf,.49,.76,.016,.28,Math.PI*2-.56),lea,0,0,0,{p:g,ink:.012,...TX('cuero',1)});   // corsé abierto por delante
 for(let y=.53;y<.75;y+=.045){part(ribbon(arc(-.26,.26,y,y+.03,6),.008,Rf,.022),lc,0,0,0,{p:g,ink:0,...TX('lino',1)});part(ribbon(arc(.26,-.26,y,y+.03,6),.008,Rf,.022),lc,0,0,0,{p:g,ink:0,...TX('lino',1)})}   // lazada en X
 [-1,1].forEach(q=>part(ribbon(arc(.28*q,.28*q,.5,.76,6),.014,Rf,.024),shade(lea,.6),0,0,0,{p:g,ink:0,...TX('cuero',1)}));   // vivos del corsé
 const leaf=f=>-.045*Math.pow(Math.abs(Math.sin(f*4.5)),.6)+.008;
 part(cape([[.07*W,.9],[.16*W,.865],[.235*W,.815],[.258*W,.775],[.264*W,.75]],leaf,54),cp,0,0,0,{p:g,ink:.012,...TX('tela',1)});   // capelina de hojas
 part(new THREE.SphereGeometry(.12,16,10,0,Math.PI*2,0,1.6).scale(1.05,.6,.7).rotateX(.5),shade(cp,.9),0,.86,-.16,{p:g,ink:.012,...TX('tela',1)});   // capucha caída
 {const e=F.elbows[1];part(cuff(.056*C.aw,.064*C.aw,-.01,-.15),lea,0,0,0,{p:e,ink:.008,...TX('cuero')});for(let y=-.03;y>-.14;y-=.028)part(band(.066*C.aw,y,.005,.003,12),lc,0,0,0,{p:e,ink:0})}   // brazal de arquera
 {const l=F.legs[1];part(new THREE.CylinderGeometry(.088*C.lw,.1*C.lw,.15,12,1,true,Math.PI/2-1.1,2.2).translate(0,-.06,0),cp,0,0,0,{p:l,ink:.008,...TX('tela',1)})}   // paño de cadera
 {const k=onT(Rf,-1.5,.47,.04),kg=new THREE.Group();kg.position.set(k[0],k[1],k[2]);kg.rotation.z=.15;g.add(kg);part(lathe([[.0,-.12],[.022,-.1],[.026,-.02],[.024,0]],10),shade(lea,.8),0,0,0,{p:kg,ink:.006,...TX('cuero')});part(new THREE.CylinderGeometry(.012,.014,.06,8),'#3a2a1e',0,.03,0,{p:kg,ink:.004,...TX('cuero')})}   // funda y mango
 part(ribbon(arc(0,Math.PI*2,.5,.5,30),.04,Rf,.024),shade(lea,.7),0,0,0,{p:g,ink:.006,...TX('cuero',1)});
 F.knees.forEach(k=>{part(cuff(.068*C.lw,.074*C.lw,.02,-.11,.008,14),lea,0,0,0,{p:k,ink:.008,...TX('cuero')});part(band(.08*C.lw,.02,.02,.008,16),shade(lea,.7),0,0,0,{p:k,ink:.004})})}   // polainas

// RENDIMIENTO: las piezas se juntan por (hueso, color, material, contorno) en UNA malla → un atuendo cuesta ~1 llamada por hueso y material, no una por remache o cinta
export function kitWear(kit,F,g,part,C){const fn={errante,penitente,mercenario,cazadora}[kit];if(!fn)return false;const B=new Map();
 const pp=(geo,col,x,y,z,o={})=>{let q=geo.index?geo.toNonIndexed():geo.clone();for(const k of Object.keys(q.attributes))if(k!=='position'&&k!=='normal')q.deleteAttribute(k);if(!q.attributes.normal)q.computeVertexNormals();q.translate(x,y,z);
  const pr=o.p||g,key=pr.uuid+'|'+col+'|'+JSON.stringify(o.t||{})+'|'+(o.ink==null?'d':o.ink);let e=B.get(key);if(!e)B.set(key,e={pr,col,o,gs:[]});e.gs.push(q);return null};
 fn(F,g,pp,C);B.forEach(e=>{const m=e.gs.length>1?mergeGeometries(e.gs,false):e.gs[0];if(m)part(m,e.col,0,0,0,Object.assign({},e.o,{p:e.pr}))});return true}
