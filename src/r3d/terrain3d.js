// NotScape · R3D · F1 · TERRENO 3D por chunks (guía 3D §4.4, §4.7) + pradera (§4.4).
// Lee las alturas de TER (las MISMAS que deciden la colisión: agua .75, suelo 1, montículos 1.3/1.6, acantilado 2, vacío 0) → nunca se ve pared donde se pisa.
// Unidades: 1 tile (32 px) = 1 unidad; x3 = wx/32, z3 = wy/32; y = (nivel − 1)·0.6415 (guía §3).
// Cada chunk = 16×16 tiles: (1) tapa con relieve suave (llano y montículos interpolados como TER.standZ, cuenca bajo el agua) y COLOR por vértice del
// campo de color GC compartido con el pasto + tierra en caminos, adoquines, arena y lecho; (2) bloques de acantilado con tapa de roca y musgo;
// (3) paredes por ESTRATOS irregulares (labio verde, tierra, roca, base) donde un tile da a otro más bajo y corte de diorama hacia el vacío;
// (4) lámina de agua simple (F1; la refracción es F3); (5) pradera instanciada (solo en los chunks cercanos, densidad por calidad).
// Todo determinista (hash). Se construye como mucho BUDGET chunks por fotograma y se liberan los lejanos (LRU).
import * as THREE from 'three';
import {toon,hash,vn2,fb2,G} from './materials3d.js';
import {WU,waterMat} from './water3d.js';

const COB_SM=location.search.indexOf('cobsm=0')<0;   // R3D-SUELO-BLEND: adoquín con muestreo bilineal (`?cobsm=0` = antes)
const PATH_SM=!/[?&]pathsm=0\b/.test(location.search);   // R3D-ESTETICA-2: borde del camino de tierra suavizado (`?pathsm=0` = antes)
// MONTAÑAS NATURALES (21 oct 2026): altura ANALÍTICA y continua de una cordillera en un punto (tiles): falda = (h−1)·LVY (rampa continua de biomes.js), núcleo = LVY+m; null fuera de ellas. La usan el suelo de la falda y la tapa del núcleo: las dos mallas comparten vértices (sin paredes de tile entre ambas = adiós a la «cuadrícula»)
const mY=(x,z)=>{const r=BIOMES.rangeAt(x*32,z*32),a=r[0];return a>=2?LVY+r[1]:a>1?(a-1)*LVY:null};
const SMM=4,CS=16,SUB=4,SUBC=12,LVY=.6415,BED=-.44,WY=(.75-1)*LVY,BUDGET=2,MAXC=70;
// colores del campo por bioma (guía §4.4/§4.8: Pradera = la de la referencia; el resto, puntos de partida de F5)
const GCOLS=[['#41582c','#5e7a38','#8c9a46'],['#2c4426','#456a34','#6f8a3e'],['#3c4a2a','#5a6a32','#7e8440'],['#5a6a6e','#7e9094','#aab8b4'],['#4a5a2e','#6a8a3a','#9aa44a'],['#6a4a2a','#8a6430','#b08a46'],['#4e4a62','#6e6a88','#9a96b4'],['#8a6a3a','#b08c52','#d2b676'],['#3e5a5e','#5c8084','#8cb0ac'],['#3f8fcb','#5fb1e6','#9ad6f6']];   // F49a: Páramo Arcano, Desierto, Costa · ISLA-1: El Cielo (pasto AZUL CLARO)
// Fase 49b · color de la PLAYA por bioma (la costa del continente la da TER.coastSand, continua; el 82 % de oscurecimiento del suelo se aplica antes). Datos, no código por bioma.
const BEACH=['#9a8761','#7a6a4a','#5e5232','#8f9ca8','#a89a78','#2e2628','#7e7aa0','#c8a45c','#b2a68c','#ebe4d2'];   // + El Cielo (mármol claro)
const SSTEP=t=>t<=0?0:t>=1?1:t*t*(3-2*t);
const strat=(y,x,z,c)=>{const w=vn2(x*2.3+z*1.7,y*3.)-.5,w2=vn2(x*7.1+z*5.3+9,y*9.)-.5,d=-y+w*.22+w2*.06;
 c.set(d<.07?'#3c5229':d<.13?'#33402a':d<.4?'#3b2b2e':d<.66?'#4f4a56':d<.74?'#3a2a2c':'#2a1f24');return c.multiplyScalar(.9+(vn2(x*11+z*13,y*17)-.5)*.25)};
const STR_L=[0,-.04,-.1,-.18,-.27,-.36,-.45,-.55,-.65,-.75,-.88,-1.05];

export class Terrain{
 constructor(scene,o={}){this.scene=scene;
  // Fase 49c · SUELO DE RESPALDO: un plano grande bajo todo el terreno, del color del suelo del bioma, que sigue al héroe. Donde aún no hay chunk (se construyen por trozos, o la vista es más ancha que el radio) se ve él en vez del cielo claro/blanco.
  this.under=new THREE.Mesh(new THREE.PlaneGeometry(900,900).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#3a4a2a'}));this.under.position.y=-1.25;this.under.renderOrder=-10;this.under.frustumCulled=false;this.under.raycast=()=>{};this.underC=new THREE.Color('#3a4a2a');scene.add(this.under);
this.occ=o.occ||null;this.ogrp=null;   // Fase 49c: this.occ = escena de OCLUSIÓN del héroe (aScene, capa 3): las cumbres de las cordilleras le tapan; se asigna desde r3d.js
  this.grp=new THREE.Group();this.grp.name='terreno3d';scene.add(this.grp);this.ch=new Map();this.q=o.grass??1;this.tick=0;
  this.NX=TER.NX;this.NY=TER.NY;this.H=new Float32Array(this.NX*this.NY).fill(-1);const CO=BIOMES.coast;this.pad=CO&&CO.on?CO.PAD:0;this.shelf=CO&&CO.on?CO.SHELF:10;this.coastD=TER.coastD||null;   // Fase 49b: PAD = tiles de MAR que se dibujan más allá del borde del mundo (la lámina de mar sigue hasta el horizonte visible; no hay vacío ni estratos)
  this.F=TER.fields();
  this.matTop=toon('#ffffff',{vc:1,ground:1});this.matWall=toon('#ffffff',{vc:1,side:THREE.DoubleSide,tex:'piedra',texS:9,texB:.7});this.matRock=toon('#ffffff',{vc:1,mossUp:.5,tex:'piedra',texS:7,texB:.6});this.matMtn=toon('#ffffff',{vc:1,tex:'montana',texS:1,texB:.55,texA:.9});this.matDeck=toon('#ffffff',{vc:1,tex:'madera',texS:5,texB:.5});this.matMtnW=toon('#ffffff',{vc:1,side:THREE.DoubleSide,tex:'montana',texS:1,texB:.55,texA:.9});   // matMtn: cumbres de las cordilleras (Fase 44-0 ii), sin musgo en las laderas
  this.matGrass=toon('#ffffff',{meadow:1,gv:1,side:THREE.DoubleSide});this.tuft=tuftGeo(7,3,1);this.tuftLite=tuftGeo(4,2,1.4);this.lodR=9;this.water=waterMat();this._t=new THREE.Color();this._u=new THREE.Color()}
 h(tx,ty){if(tx<0||ty<0||tx>=this.NX||ty>=this.NY){const p=this.pad;return p&&tx>=-p&&ty>=-p&&tx<this.NX+p&&ty<this.NY+p?.75:0}const i=ty*this.NX+tx;let v=this.H[i];if(v<0)v=this.H[i]=TER.heightAt((tx+.5)*32,(ty+.5)*32);return v}
 land(h){return h>=1&&h<2}
 cin(i,j){const p=this.pad;return i*CS+CS>-p&&j*CS+CS>-p&&i*CS<this.NX+p&&j*CS<this.NY+p}   // ¿el chunk (i,j) está dentro del mundo o de su PAD de mar?
 // Fase 44a · FRONTERA ABIERTA: cerca de una unión abierta (BIOMES.openSeams) el color es la mezcla de la paleta del bioma y la del vecino, con el MISMO ruido (la textura no cambia, solo el tono):
 // peso = BIOMES.blendAt (0,5 exacto en la línea de unión por los dos lados, 0 a ±12 tiles, smoothstep) → sin corte de color. Lo usan la tapa del terreno y la pradera (matas).
 gc(x,z,k){const n=Math.min(1,Math.max(0,(fb2(x*.42,z*.42)-.28)/.5)),c=new THREE.Color();const pal=(C,o)=>n<.5?o.set(C[0]).lerp(this._t.set(C[1]),n*2):o.set(C[1]).lerp(this._t.set(C[2]),(n-.5)*2);
  pal(GCOLS[k]||GCOLS[0],c);const b=BIOMES.openSeams&&BIOMES.openSeams.length?BIOMES.blendAt(x*32,z*32,k):null;
  if(b&&b[1]>0){pal(GCOLS[b[0]]||GCOLS[0],this._u);c.lerp(this._u,b[1])}return c}
 // Fase 3 · SUELO · arena CONTINUA (sin escalera de tiles): máximo de la playa propia del layout (lagos/mar de la Pradera, `BIOMES.geo.sand` en px locales) y la de la costa del continente (49b).
 sandAmt(x,z,tx,tz){let s=0;const r=BIOMES.list[TER.ownerOf?TER.ownerOf(tx,tz):0];if(r&&r.lay&&(r.lay.sea||r.lay.lakes))s=BIOMES.geo.sand(r,x*32-r.ox,z*32-r.oy);const cs=TER.coastSand?TER.coastSand(x*32,z*32):0;return Math.max(s,cs)}
 // Fase 3 · SUELO · cercanía a EDIFICIOS (0..1): la hierba junto a las casas se pisa y se seca (tierra oscura) en vez de llegar verde y viva hasta la pared. Índice por celdas de 8×8 tiles,
 // reconstruido solo si cambia el nº de props (PROPS.list). Radios en tiles (círculo que cubre la huella; el centro lo tapa el edificio). Solo edificios y puestos habitados, no la naturaleza.
 bnear(x,z){const L=typeof PROPS!=='undefined'&&PROPS.list?PROPS.list:null;if(!L)return 0;if(this._bn!==L.length){this._bn=L.length;const M=this._bx=new Map();for(const e of L){const r=Terrain.BLD[e.n];if(!r)continue;const tx=e.x/32,tz=e.y/32,k=Math.floor(tx/8)+','+Math.floor(tz/8);let a=M.get(k);if(!a)M.set(k,a=[]);a.push(tx,tz,r)}}
  const M=this._bx;if(!M||!M.size)return 0;const ci=Math.floor(x/8),cj=Math.floor(z/8);let f=0;
  for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const a=M.get((ci+i)+','+(cj+j));if(!a)continue;for(let q=0;q<a.length;q+=3){const d=Math.hypot(x-a[q],z-a[q+1]),r=a[q+2];if(d<r+1.6){const t=1-SSTEP((d-r*.5)/(r*.5+1.6));if(t>f)f=t}}}
  return f}
 // ¿hay algún edificio en el rectángulo (tiles)? Sirve para saltarse `bnear` en chunks vacíos.
 bAny(x0,z0,x1,z1){this.bnear(x0,z0);const M=this._bx;if(!M||!M.size)return false;for(let j=Math.floor(z0/8);j<=Math.floor(z1/8);j++)for(let i=Math.floor(x0/8);i<=Math.floor(x1/8);i++)if(M.has(i+','+j))return true;return false}
 // altura de la tapa en un punto continuo (coordenadas de tile): llano bilineal entre centros pisables + cuenca del agua
 // máscara de agua suavizada (5 muestras): la orilla deja de seguir la escalera de tiles
 field(x,z){const f0=this.field1(x,z),o=.42;let w=f0.w*2;for(const[dx,dz]of[[o,0],[-o,0],[0,o],[0,-o]])w+=this.field1(x+dx,z+dz).w;w/=6;
  // R3D-AGUA-ORILLA (20 oct 2026): la bajada de la orilla es UNA rampa monótona y más larga (antes: caída casi vertical de .22 y luego el fondo SUBÍA a la plataforma → surco en V = «ranura oscura» y filo turquesa).
  // e va de 0 (w=.1, tierra) a 1 (w=.8) y el destino `tgt` es el fondo del lago (BED) o, junto al mar exterior, la plataforma somera (Fase 49b) ya con su pendiente, sin max() ni saltos.
  const s=Math.min(1,Math.max(0,(w-.1)/.7)),e=s*s*(3-2*s);let tgt=BED;
  if(this.coastD&&e>0){const d=-this.coastD(x*32,z*32),kc=SSTEP(1+d/64);if(kc>0)tgt=BED+(BED+(WY-.025-BED)*(1-SSTEP(Math.max(0,d)/this.shelf))-BED)*kc}
  let y=f0.yl+(tgt-f0.yl)*e;if(w<.02&&BIOMES.ranges.length){const my=mY(x,z);if(my!==null)y=my}
  return{y,w}}
 field1(x,z){const u=x-.5,v=z-.5,i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j;let hl=0,wl=0,ww=0,hw=0;
  for(const[di,dj,w]of[[0,0,(1-a)*(1-b)],[1,0,a*(1-b)],[0,1,(1-a)*b],[1,1,a*b]]){const h=this.h(i+di,j+dj);if(this.land(h)){hl+=h*w;wl+=w}else if(h===.75){ww+=w}}
  const yl=wl>1e-4?(hl/wl-1)*LVY:0;return{yl,w:ww}}
 // Fase 3 · RODERAS: distancia (en TILES) al EJE real del camino más cercano (los `routes` de cada bioma, incluidos los tramos de las uniones), con un índice de celdas de 256 px. 9 = no hay camino cerca.
 // El campo de camino de TER (PF) no sirve para esto: es una meseta ancha (6+ tiles donde se cruzan rutas) sin curvas de nivel limpias; el eje sí da dos surcos paralelos a distancia fija.
 routeD(x,z){let M=this._ri;if(!M){M=this._ri=new Map();const add=(ax,ay,bx,by)=>{const x0=Math.floor((Math.min(ax,bx)-64)/256),x1=Math.floor((Math.max(ax,bx)+64)/256),y0=Math.floor((Math.min(ay,by)-64)/256),y1=Math.floor((Math.max(ay,by)+64)/256);for(let j=y0;j<=y1;j++)for(let i=x0;i<=x1;i++){const k=i+','+j;let a=M.get(k);if(!a)M.set(k,a=[]);a.push(ax,ay,bx,by)}};
   for(const B of BIOMES.list)for(const r of B.routes)for(let i=0;i<r.length-1;i++)add(B.ox+r[i][0],B.oy+r[i][1],B.ox+r[i+1][0],B.oy+r[i+1][1])}
  const px=x*32,py=z*32,a=M.get(Math.floor(px/256)+','+Math.floor(py/256));if(!a)return 9;let best=1e9;for(let q=0;q<a.length;q+=4){const ax=a[q],ay=a[q+1],dx=a[q+2]-ax,dy=a[q+3]-ay,l2=dx*dx+dy*dy||1,u=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/l2)),d=Math.hypot(px-ax-dx*u,py-ay-dy*u);if(d<best)best=d}return Math.min(9,best/32)}
 // R3D-ESTETICA-2 (P4, 20 oct 2026): el camino de TIERRA (pf) se muestrea con interpolación bilineal entre centros de celda (SG=4 por tile). Antes `pathAt` tomaba la celda más cercana → escalones de ¼ de tile que el umbral del shader
 // convertía en «dientes» en el borde. `?pathsm=0` vuelve al muestreo antiguo. El adoquín (pc) no cambia: sigue en `pathAt`.
 pfS(x,z){const F=this.F;if(!PATH_SM||!F||!F.PF)return this.pathAt(x,z)[0];const SG=F.SG,FW=this.NX*SG,FH=this.NY*SG,u=x*SG-.5,v=z*SG-.5,i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j,g=(ii,jj)=>F.PF[Math.max(0,Math.min(FH-1,jj))*FW+Math.max(0,Math.min(FW-1,ii))]||0;
  return g(i,j)*(1-a)*(1-b)+g(i+1,j)*a*(1-b)+g(i,j+1)*(1-a)*b+g(i+1,j+1)*a*b}
 // R3D-SUELO-BLEND (20 oct 2026): el adoquín (PC) también se muestrea con interpolación bilineal entre centros de celda (antes celda más cercana = escalones de ¼ de tile → parches RECTANGULARES en el borde de plazas y calles). `?cobsm=0` vuelve al muestreo antiguo.
 pcS(x,z){const F=this.F;if(!COB_SM||!F||!F.PC)return this.pathAt(x,z)[1];const SG=F.SG,FW=this.NX*SG,FH=this.NY*SG,u=x*SG-.5,v=z*SG-.5,i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j,g=(ii,jj)=>F.PC[Math.max(0,Math.min(FH-1,jj))*FW+Math.max(0,Math.min(FW-1,ii))]||0;
  return g(i,j)*(1-a)*(1-b)+g(i+1,j)*a*(1-b)+g(i,j+1)*(1-a)*b+g(i+1,j+1)*a*b}
 pathAt(x,z){const F=this.F;if(!F||!F.PF)return[0,0];const SG=F.SG,FW=this.NX*SG,i=Math.floor(x*SG),j=Math.floor(z*SG);if(i<0||j<0||i>=FW||j>=this.NY*SG)return[0,0];return[F.PF[j*FW+i]||0,F.PC[j*FW+i]||0]}
 update(cx,cz,rTiles,force){{const ux=Math.max(0,Math.min(this.NX-1,Math.floor(cx))),uz=Math.max(0,Math.min(this.NY-1,Math.floor(cz))),uk=TER.biomeOf?TER.biomeOf(ux,uz):0,uh=TER.tileH?TER.tileH(ux,uz):1;this.under.position.x=cx;this.under.position.z=cz;this.under.position.y=uk===9?-12:-1.25;this.underC.set(uh<1?'#2f6f78':GCOLS[uk][0]);if(uh>=1)this.underC.multiplyScalar(.7);this.under.material.color.lerp(this.underC,.04)}   // Fase 49c: color suave por bioma; sobre agua, verde-azulado de mar
  const T0=performance.now(),c0=Math.floor((cx-rTiles)/CS),c1=Math.floor((cx+rTiles)/CS),r0=Math.floor((cz-rTiles)/CS),r1=Math.floor((cz+rTiles)/CS);this.tick++;let built=0;
  const want=[];for(let j=r0;j<=r1;j++)for(let i=c0;i<=c1;i++){if(!this.cin(i,j))continue;const d=Math.hypot((i+.5)*CS-cx,(j+.5)*CS-cz);want.push([d,i,j])}
  want.sort((a,b)=>a[0]-b[0]);
  // trabajo repartido: lo más cercano que falta (chunk de suelo o su pradera) se construye por trozos (generador) con ~2,5 ms por fotograma; `force` (precarga) lo hace todo de golpe
  const T1=performance.now(),needs=[];
  for(const[d,i,j]of want){const k=i+','+j;let c=this.ch.get(k);
   if(!c){if(force){c=this.build(i,j);this.ch.set(k,c);built++}else{needs.push({k,kind:0,i,j});continue}}
   c.seen=this.tick;
   if(d<CS*1.6&&!c.grass&&this.q>0){if(force){c.grass=this.meadow(i,j);if(c.grass)c.g.add(c.grass);built++}else needs.push({k,kind:1,i,j})}}
  if(!force&&needs.length){let jb=this.job&&needs.some(n=>n.k===this.job.k&&n.kind===this.job.kind)?this.job:null;
   if(!jb){const n=needs[0];jb=this.job={k:n.k,kind:n.kind,it:n.kind?this.meadowG(n.i,n.j):this.buildG(n.i,n.j)}}
   let r;do{r=jb.it.next()}while(!r.done&&performance.now()-T1<2.5);
   if(r.done){this.job=null;built++;if(jb.kind===0)this.ch.set(jb.k,Object.assign(r.value,{seen:this.tick}));else{const c=this.ch.get(jb.k);if(c&&r.value){c.grass=r.value;c.g.add(r.value)}}}}
  else if(!needs.length)this.job=null;
  const MX=Math.max(MAXC,want.length+14);   // Fase 49c: con el zoom alejado se piden más chunks que MAXC y se expulsaban y reconstruían sin parar (suelo parpadeando/blanco)
  if(this.ch.size>MX){[...this.ch.entries()].sort((a,b)=>a[1].seen-b[1].seen).slice(0,this.ch.size-MX).forEach(([k,c])=>{this.freeGrass(c);this.grp.remove(c.g);if(c.g.userData.og&&this.ogrp)this.ogrp.remove(c.g.userData.og);c.g.traverse(o=>{if(o.geometry)o.geometry.dispose()});this.ch.delete(k)})}
  return built}
 pending(cx,cz,r){let n=0;const c0=Math.floor((cx-r)/CS),c1=Math.floor((cx+r)/CS),r0=Math.floor((cz-r)/CS),r1=Math.floor((cz+r)/CS);for(let j=r0;j<=r1;j++)for(let i=c0;i<=c1;i++)if(this.cin(i,j)&&!this.ch.has(i+','+j))n++;return n}
 // build es un GENERADOR: cede el control tras cada fila de tiles (16 por chunk) para que update() lo reparta en trocitos de ~2,5 ms por fotograma
 // (antes un chunk entero eran ~34 ms de golpe = tirón cada vez que se entraba en una zona nueva, lo que se sentía como «cargando» al correr).
 build(ci,cj){const it=this.buildG(ci,cj);let r;while(!(r=it.next()).done);return r.value}
 *buildG(ci,cj){const g=new THREE.Group(),x0=ci*CS,z0=cj*CS,x1=x0+CS,z1=z0+CS,col=new THREE.Color(),c2=new THREE.Color();
const DKP=[],DKC=[],DKF=this.F&&this.F.DK;
  // Fase 3 · PASARELAS (DK de TER.fields: 1 = puente N–S, 2 = compuerta E–O, 3 = compuerta N–S): tablones oscuros (cruzan el sentido de la marcha) sobre el suelo y, en los bordes sin pasarela vecina, postes y barandilla. Hoy el mundo NO tiene ninguna (los datos `bridge`/`gates` están vacíos tras la 49a): el código está listo y probado con DK forzado.
  const dbox=(cx,cy,cz,sx,sy,sz,c,rot)=>{const hx=sx/2,hy=sy/2,hz=sz/2,cs=Math.cos(rot||0),sn=Math.sin(rot||0),V=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(([a,b,d])=>{const lx=a*hx,lz=d*hz;return[cx+lx*cs-lz*sn,cy+b*hy,cz+lx*sn+lz*cs]});
   for(const f of [[0,1,2,3],[5,4,7,6],[4,0,3,7],[1,5,6,2],[3,2,6,7],[4,5,1,0]])[0,1,2,0,2,3].forEach(i=>{const v=V[f[i]];DKP.push(v[0],v[1],v[2]);DKC.push(c.r,c.g,c.b)})};
  const deck=(tx,tz,kind)=>{const ns=kind===1||kind===3,y0=this.field(tx+.5,tz+.5).y,c=new THREE.Color();const same=(a,b)=>a>=0&&b>=0&&a<this.NX&&b<this.NY&&DKF[b*this.NX+a]===kind;
   for(let i=0;i<4;i++){const o=(i+.5)/4,jt=(hash(tx*4+i,tz,7)-.5)*.02,w=hash(tx,tz*4+i,9);c.set('#6a5238').lerp(this._t.set('#4a3828'),w*.8).multiplyScalar(.92+hash(tx+i,tz,3)*.16);
    ns?dbox(tx+.5,y0+.11+jt,tz+o,1.0,.06,.235,c,(hash(tx,tz+i,5)-.5)*.03):dbox(tx+o,y0+.11+jt,tz+.5,.235,.06,1.0,c,(hash(tx+i,tz,5)-.5)*.03)}
   for(const [dx,dz] of ns?[[-1,0],[1,0]]:[[0,-1],[0,1]]){if(same(tx+dx,tz+dz))continue;const ex=tx+.5+dx*.46,ez=tz+.5+dz*.46;c.set('#352719');
    for(const t of [.12,.88]){const px=ns?ex:tx+t,pz=ns?tz+t:ez;dbox(px,y0+.26,pz,.07,.4,.07,c)}
    c.set('#6a5238');ns?dbox(ex,y0+.42,tz+.5,.05,.05,.86,c):dbox(tx+.5,y0+.42,ez,.86,.05,.05,c)}};
  // Fase 3 · guardas por CHUNK (las funciones nuevas por vértice doblaban el coste de construcción de un chunk vacío: 15 → 30 ms): ¿hay arena o edificios cerca de este chunk? Si no, se salta el cálculo en sus ~24 000 vértices.
  // La arena es un campo suave: se muestrea en una rejilla de medio tile (33×33 por chunk, los bordes coinciden con los del chunk vecino) y los vértices la interpolan (antes 1 llamada a `BIOMES.geo.sand` por vértice: +10 ms por chunk de lago).
  const SGN=33,sg=new Float32Array(SGN*SGN);let hasSand=false;for(let b=0;b<SGN;b++)for(let a=0;a<SGN;a++){const px=x0+a*.5,pz=z0+b*.5,v=this.sandAmt(px,pz,Math.min(this.NX-1,Math.max(0,Math.floor(px))),Math.min(this.NY-1,Math.max(0,Math.floor(pz))));sg[b*SGN+a]=v;if(v>0)hasSand=true}
  const sandV=(x,z)=>{if(!hasSand)return 0;const u=(x-x0)*2,v=(z-z0)*2,i=Math.min(SGN-2,Math.max(0,Math.floor(u))),j=Math.min(SGN-2,Math.max(0,Math.floor(v))),a=Math.min(1,Math.max(0,u-i)),b=Math.min(1,Math.max(0,v-j));return sg[j*SGN+i]*(1-a)*(1-b)+sg[j*SGN+i+1]*a*(1-b)+sg[(j+1)*SGN+i]*(1-a)*b+sg[(j+1)*SGN+i+1]*a*b};
  const hasB=this.bAny(x0-8,z0-8,x1+8,z1+8);let bg=null;const BGN=49;   // la cercanía a edificios también es un campo suave: rejilla de 1/3 de tile (49×49) y los vértices la interpolan (en el chunk de la aldea hay ~37 000 vértices por la malla densa del adoquín)
  if(hasB){bg=new Float32Array(BGN*BGN);for(let b=0;b<BGN;b++)for(let a=0;a<BGN;a++)bg[b*BGN+a]=this.bnear(x0+a/3,z0+b/3)}
  const bnV=(x,z)=>{if(!bg)return 0;const u=(x-x0)*3,v=(z-z0)*3,i=Math.min(BGN-2,Math.max(0,Math.floor(u))),j=Math.min(BGN-2,Math.max(0,Math.floor(v))),a=Math.min(1,Math.max(0,u-i)),b=Math.min(1,Math.max(0,v-j));return bg[j*BGN+i]*(1-a)*(1-b)+bg[j*BGN+i+1]*a*(1-b)+bg[(j+1)*BGN+i]*(1-a)*b+bg[(j+1)*BGN+i+1]*a*b};
  // ── tapa ── rejilla SUB×SUB por tile; solo en tiles no vacíos y no acantilado
  const fal=(tx,tz)=>{if(!BIOMES.ranges.length)return false;const r=BIOMES.rangeAt((tx+.5)*32,(tz+.5)*32);return r[0]>1.08&&r[0]<2};   // ¿tile de FALDA de una montaña (centro dentro de la rampa)? Lo dibuja la malla de montaña, no el suelo
  const P=[],C=[],WP=[],WD=[],WS=[],PA=[],PB=[],PS=[],PBI=[];const VC=new Map();   // R3D-OPT: caché de vértices (cada esquina se calculaba 6 veces); rejilla común de 12 por tile (SUB=4 y SUBC=12 encajan)
  const top=(x,z)=>{const kk=Math.round(x*12)*4096+Math.round(z*12);let r=VC.get(kk);if(!r){r=top0(x,z);VC.set(kk,r)}return r};
  const top0=(x,z)=>{const f=this.field(x,z),tx=Math.max(0,Math.min(this.NX-1,Math.floor(x))),tz=Math.max(0,Math.min(this.NY-1,Math.floor(z))),k=TER.biomeOf?TER.biomeOf(tx,tz):0;
   col.copy(this.gc(x,z,k)).multiplyScalar(.82);
   if(bg){const nb=bnV(x,z);if(nb>.01){const nz=.55+.9*vn2(x*1.7+31,z*1.7+5);col.lerp(c2.set('#5a4a30'),Math.min(.62,nb*nz*.7))}}   // Fase 3: hierba pisada y seca junto a las casas (tono de tierra); el .7 se baja si el dueño la quiere más sutil
   const pc=this.pcS(x,z),pf=this.pfS(x,z);if(pf>.25)col.lerp(c2.set('#5e4a32'),Math.min(.35,(pf-.25)*.6));   // la tierra y los adoquines los pinta el shader (GROUND_*); aquí solo se oscurece un poco el pasto bajo el camino
   const sa=sandV(x,z);if(sa>.01){c2.set(BEACH[k]||BEACH[0]);if(BIOMES.openSeams&&BIOMES.openSeams.length){const bb=BIOMES.blendAt(x*32,z*32,k);if(bb&&bb[1]>0)c2.lerp(this._u.set(BEACH[bb[0]]||BEACH[0]),bb[1])}col.lerp(c2.multiplyScalar(.86),Math.min(.94,sa*1.25))}   // el color de la arena se mezcla con el del vecino en las uniones abiertas (misma mezcla que el pasto: sin corte)
     // Fase 3: UNA sola arena, continua (lago, mar propio y costa del continente 49b), con el material de cada bioma; el detalle (ondas, guijarros, humedad) lo pinta el shader con `aSh`
   if(BIOMES.ranges.length){const r=BIOMES.rangeAt(x*32,z*32);if(r[0]>1&&r[0]<2){   // Fase 49c · FALDA de la cordillera: el pasto se vuelve gravilla/roca poco a poco hacia el núcleo (sin línea recta), con manchas
     const Pl=this.rangeCol(x*32,z*32),t=Math.min(1,(r[0]-1)/.9),nz=vn2(x*1.1+3,z*1.1),sc=Math.max(0,Math.min(1,(t*1.15-.1)*(.55+.9*nz)));col.lerp(c2.set(Pl[0]).lerp(this._t.set(Pl[1]),.25+.4*vn2(x*2.3,z*2.3)),Math.min(.8,sc*.8))}}
   if(f.w>0)col.lerp(c2.set(f.y<BED*.6?'#5a4430':'#4e3a2a'),Math.min(1,f.w*1.6));
   let wet=0;if(f.y<WY+.12&&(this.h(tx,tz)===.75||this.near(tx,tz,.75))){wet=Math.min(1,(WY+.12-f.y)/.12);col.lerp(c2.set('#4a3826'),Math.min(.55,wet*.55)*(sa>.2?.55:1))}   // R3D-AGUA-ARTSTYLE: banda MOJADA junto a la línea de agua (sobre arena la remata el shader)
   return[f.y,col.clone(),f.w>.15?0:pf,f.w>.15?0:pc,Math.min(1,sa),f.w>.15?-Math.min(1,f.w):wet,f.w>.15||pf<.3||pc>.3?9:this.routeD(x,z)]};
  for(let tz=z0;tz<z1;tz++){yield;for(let tx=x0;tx<x1;tx++){if((tx&3)===0)yield;const h=this.h(tx,tz);if(h<=0||h>=2||(h>1&&fal(tx,tz)))continue;const kb=TER.biomeOf?TER.biomeOf(tx,tz):0;   // Fase 4c: bioma del tile → `aBio` (tierra distinta por bioma en el shader)
   if(DKF&&DKF[tz*this.NX+tx])deck(tx,tz,DKF[tz*this.NX+tx]);
   let cob=0;for(const[u,v]of[[.5,.5],[.1,.1],[.9,.1],[.1,.9],[.9,.9]])cob=Math.max(cob,this.pathAt(tx+u,tz+v)[1]);let S=cob>.05&&this.q>.3?SUBC:SUB;   // adoquín: malla densa para el relieve real
   if(h===.75&&S===SUB){const out=tx<0||tz<0||tx>=this.NX||tz>=this.NY,d=out||!this.coastD?(out?99:-1):-this.coastD((tx+.5)*32,(tz+.5)*32);S=d>this.shelf+3?1:d>6?2:SUB}   // Fase 49b: mar abierto = fondo casi plano (1–2 divisiones por tile); cerca de la costa se conserva la malla fina de la plataforma
   for(let b=0;b<S;b++)for(let a=0;a<S;a++){const xa=tx+a/S,xb=tx+(a+1)/S,za=tz+b/S,zb=tz+(b+1)/S,q=[[xa,za],[xa,zb],[xb,zb],[xb,za]].map(([x,z])=>{const[y,c,pf,pc,sa,wt,ps]=top(x,z);return[x,y,z,c,pf,pc,sa,wt,ps]});
    [0,1,2,0,2,3].forEach(k=>{const v=q[k];P.push(v[0],v[1],v[2]);C.push(v[3].r,v[3].g,v[3].b);PA.push(v[4]);PB.push(v[5]);PS.push(v[6],v[7],v[8]);PBI.push(kb)})}
   if(h===.75||this.near(tx,tz,.75)){const sea=TER.seaAt?TER.seaAt(tx,tz):0;let N=sea?((tx<0||tz<0||tx>=this.NX||tz>=this.NY||(this.coastD&&this.coastD((tx+.5)*32,(tz+.5)*32)<-24))?2:3):1;   // mar: rejilla 3×3 para el oleaje en vértices; estanque/lago: 1 quad
    // R3D-AGUA-ORILLA (20 oct 2026): cerca de la tierra la lámina de agua usa la MISMA rejilla (SUB=4) y las MISMAS alturas que la tapa del terreno. Antes llevaba 1 quad (lago) o 3×3 (mar) y la profundidad se interpolaba entre esquinas lejanas:
    // la línea de orilla caía donde no era (ranuras oscuras = fondo a la vista, agua que se cortaba en escalones, filo turquesa sobre la arena). Con vértices coincidentes la intersección agua/terreno es exacta. Radio 2: en la costura con la malla gruesa el agua ya es profunda (la ola es la misma).
    let shore=false;for(let j=-2;j<=2&&!shore;j++)for(let i=-2;i<=2;i++){const hh=this.h(tx+i,tz+j);if(hh>=1&&hh<3){shore=true;break}}
    if(shore)N=SUB;
    for(let b=0;b<N;b++)for(let a=0;a<N;a++){const xa=tx+a/N,xb=tx+(a+1)/N,za=tz+b/N,zb=tz+(b+1)/N;[[xa,za],[xa,zb],[xb,zb],[xa,za],[xb,zb],[xb,za]].forEach(([x,z])=>{WP.push(x,WY,z);const cv=VC.get(Math.round(x*12)*4096+Math.round(z*12));WD.push(Math.max(0,WY-(cv?cv[0]:this.field(x,z).y)));WS.push(sea)})}}}}
  yield;  if(P.length){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(P,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(C,3));geo.setAttribute('aPath',new THREE.Float32BufferAttribute(PA,1));geo.setAttribute('aCob',new THREE.Float32BufferAttribute(PB,1));geo.setAttribute('aSh',new THREE.Float32BufferAttribute(PS,3));geo.setAttribute('aBio',new THREE.Float32BufferAttribute(PBI,1));geo.computeVertexNormals();
   const m=new THREE.Mesh(geo,this.matTop);m.receiveShadow=true;m.castShadow=true;g.add(m)}
  // ── acantilados (bloques) y paredes por estratos ──
  const RP=[],RC=[],MP=[],MC=[],MN=[],WLP=[],WLC=[],SLP=[],SLC=[];const yTop=h=>h>=2?LVY:h<=0?-99:null;
  // altura de la tapa de un acantilado en un punto continuo: LVY + cumbre de la cordillera (0 fuera de ellas → igual que siempre). Se calcula con la MISMA función analítica que la colisión (BIOMES.rangeAt), así enlaza entre tiles y chunks.
  const cvm=new Map(),topV=(x,z)=>{const kk=Math.round(x*12)*4096+Math.round(z*12);let v=cvm.get(kk);if(v===undefined){const r=BIOMES.ranges.length?BIOMES.rangeAt(x*32,z*32):null;v=r&&r[0]>=2?[LVY+r[1],r[2]]:[LVY,-1];cvm.set(kk,v)}return v},topY=(x,z)=>topV(x,z)[0];
  const mcol=(x,z,m,ri,out)=>{const q=ri>=0?BIOMES.ranges[ri]:null,Pl=(q&&q.col)||['#5f5c68','#7d7885','#aaa6b0'],e=Math.min(1,m/(q?q.pk:7));out.set(Pl[0]).lerp(c2.set(Pl[1]),Math.min(1,e*1.7));if(e>.7)out.lerp(c2.set(Pl[2]),(e-.7)/.3);
   out.multiplyScalar((.8+vn2(x*1.9,z*1.9)*.32)*(.68+.42*Math.min(1,e*1.7)));   // Fase 3 (cierre de montañas): oclusión ambiental falsa por altura — las faldas se hunden y las cimas conservan la luz (más contraste sin tocar la paleta)
   // Fase 49c · BASE FUNDIDA con el suelo: junto al borde (e≈0) la roca toma el color del pasto/tierra del bioma y sube a roca desnuda con un borde irregular (ruido), sin línea de corte
   const bt=Math.max(0,1-e/.13)*(.5+.7*vn2(x*1.4+9,z*1.4)),bk=TER.biomeOf?TER.biomeOf(Math.max(0,Math.min(this.NX-1,Math.floor(x))),Math.max(0,Math.min(this.NY-1,Math.floor(z)))):0;
   if(bt>.01)out.lerp(this.gc(x,z,bk).multiplyScalar(.82),Math.min(.85,bt*.9));return out};
  // MONTAÑAS NATURALES: la FALDA se dibuja con la MISMA malla suave que el núcleo (altura analítica continua `mY`, colores que funden del suelo del bioma a la roca; sin paredes, sin material distinto = sin la costura cuadriculada)
  const rIdx=(wx,wy)=>{for(let i=0;i<BIOMES.ranges.length;i++){const b=BIOMES.ranges[i].bb;if(wx>=b[0]&&wx<=b[1]&&wy>=b[2]&&wy<=b[3])return i}return -1};
  const mH=(x,z)=>{const y=mY(x,z);return y===null?0:y};
  const mvc=(x,z,out)=>{const r=BIOMES.rangeAt(x*32,z*32);if(r[0]>=2){const v=topV(x,z);mcol(x,z,v[0]-LVY,v[1],out);return}
   const sF=Math.max(0,Math.min(1,(r[0]-1)/.97));mcol(x,z,0,rIdx(x*32,z*32),out);const bk=TER.biomeOf?TER.biomeOf(Math.max(0,Math.min(this.NX-1,Math.floor(x))),Math.max(0,Math.min(this.NY-1,Math.floor(z)))):0;
   this._t.copy(out);const w=SSTEP(sF*1.25+(vn2(x*1.3+5,z*1.3)-.5)*.4);out.copy(this.gc(x,z,bk)).multiplyScalar(.82).lerp(this._t,Math.min(1,w))};   // del color del suelo (borde exterior) al de la roca en el borde del núcleo, con manchas irregulares
  // Fase 3 · ACANTILADO: las paredes INCLINADAS de las cordilleras (sl) usan la MISMA roca pintada que la cumbre (matMtn + `mcol`, sin fusión con el pasto: es cara de roca), un poco más oscuras; antes llevaban los estratos de diorama de matWall y se veía un cambio de lenguaje entre la cima y la pared
  const pw=(p,nx,nz,sl,sIdx)=>{if(sl){SLP.push(p[0]+nx*.001,p[1],p[2]+nz*.001);const v=topV(p[0],p[2]);mcol(p[0],p[2],Math.max(p[1]-LVY,1.4),v[1],col);col.multiplyScalar(.74);SLC.push(col.r,col.g,col.b)}else{WLP.push(p[0]+nx*.001,p[1],p[2]+nz*.001);const c=strat(sIdx,p[0],p[2],col);WLC.push(c.r,c.g,c.b)}};
  const wall=(ax,az,bx,bz,ya0,ya1,yb,nx,nz,sl)=>{ // pared vertical del borde (ax,az)-(bx,bz) desde arriba (ya0 en a, ya1 en b) hasta yb
   if(sl){   // borde INCLINADO (ladera de cordillera): los estratos siguen la pendiente de la tapa (con estratos horizontales la esquina más alta quedaba recortada y se veía el cielo por un hueco triangular)
    const yt=(ya0+ya1)/2,sc=yt-yb<1.2?(yt-yb)/1.05:1;let la=null,lb=null;
    for(let s=0;s<STR_L.length-1;s++){const o0=STR_L[s]*sc,o1=STR_L[s+1]*sc,a0=ya0+o0,b0=ya1+o0;if(a0<=yb+1e-4&&b0<=yb+1e-4)break;
     const a1=Math.max(ya0+o1,yb),b1=Math.max(ya1+o1,yb),q=[[ax,Math.max(a0,yb),az],[ax,a1,az],[bx,b1,bz],[bx,Math.max(b0,yb),bz]];la=a1;lb=b1;
     [0,1,2,0,2,3].forEach(i=>pw(q[i],nx,nz,sl,(i===1||i===2)?STR_L[s+1]+.001:STR_L[s]-.001))}
    if(la!==null&&(la>yb+1e-3||lb>yb+1e-3)){const q=[[ax,la,az],[ax,yb,az],[bx,yb,bz],[bx,lb,bz]];[0,1,2,0,2,3].forEach(i=>pw(q[i],nx,nz,sl,STR_L[STR_L.length-1]+.001))}
    return}
   let lastLo=null;
   for(let s=0;s<STR_L.length-1;s++){const yt=(ya0+ya1)/2;const L0=yt+STR_L[s]*(yt-yb<1.2?(yt-yb)/1.05:1),L1=yt+STR_L[s+1]*(yt-yb<1.2?(yt-yb)/1.05:1);if(L0<=yb+1e-4)break;
    const lo=Math.max(L1,yb),q=[[ax,Math.min(ya0,L0),az],[ax,lo,az],[bx,lo,bz],[bx,Math.min(ya1,L0),bz]];lastLo=lo;
    [0,1,2,0,2,3].forEach(i=>{const p=q[i];WLP.push(p[0]+nx*.001,p[1],p[2]+nz*.001);const c=strat((i===1||i===2)?STR_L[s+1]+.001:STR_L[s]-.001,p[0],p[2],col);WLC.push(c.r,c.g,c.b)})}
   // pared más alta que los estratos (laderas de cordillera junto al vacío): se prolonga con la base oscura hasta yb
   if(lastLo!==null&&lastLo>yb+1e-3){const q=[[ax,Math.min(ya0,lastLo),az],[ax,yb,az],[bx,yb,bz],[bx,Math.min(ya1,lastLo),bz]];[0,1,2,0,2,3].forEach(i=>{const p=q[i];WLP.push(p[0]+nx*.001,p[1],p[2]+nz*.001);const c=strat(STR_L[STR_L.length-1]+.001,p[0],p[2],col);WLC.push(c.r,c.g,c.b)})}};
  for(let tz=z0;tz<z1;tz++){yield;for(let tx=x0;tx<x1;tx++){const h=this.h(tx,tz);if(h<=0)continue;
   if((h>=2&&this.nearMt(tx,tz))||(h>1&&h<2&&fal(tx,tz))){const SM=SMM;   // tapa de cordillera (núcleo Y falda): malla suave de SM×SM por tile con la altura continua
    for(let b=0;b<SM;b++)for(let a=0;a<SM;a++){const xa=tx+a/SM,xb=tx+(a+1)/SM,za=tz+b/SM,zb=tz+(b+1)/SM;
     [[xa,za],[xa,zb],[xb,zb],[xa,za],[xb,zb],[xb,za]].forEach(([x,z])=>{MP.push(x,mH(x,z),z);mvc(x,z,col);MC.push(col.r,col.g,col.b);
      const d=1/12,gx=(mH(x+d,z)-mH(x-d,z))/(2*d),gz=(mH(x,z+d)-mH(x,z-d))/(2*d),il=1/Math.hypot(gx,1,gz);MN.push(-gx*il,il,-gz*il)})}}   // normales SUAVES analíticas (Fase 49c: antes planas por triángulo → facetas)
   else if(h>=2){const yt=LVY+(hash(tx,tz,3)-.5)*.06;const q=[[tx,tz],[tx,tz+1],[tx+1,tz+1],[tx+1,tz]];
    [0,1,2,0,2,3].forEach(k=>{const[x,z]=q[k];RP.push(x,yt,z);const n=vn2(x*1.7,z*1.7);col.set('#5f5c68').lerp(c2.set('#3f5a2c'),Math.max(0,n-.35)*1.4).multiplyScalar(.9+hash(tx,tz,5)*.15);RC.push(col.r,col.g,col.b)})}
   // paredes hacia los 4 vecinos más bajos
   for(const[dx,dz,ax0,az0,bx0,bz0]of[[1,0,tx+1,tz,tx+1,tz+1],[-1,0,tx,tz+1,tx,tz],[0,1,tx+1,tz+1,tx,tz+1],[0,-1,tx,tz,tx+1,tz]]){const hn=this.h(tx+dx,tz+dz);
    if(hn>=2||(hn>0&&h<2)||(h<1&&hn<=0)||(h>=2&&hn>=1&&hn<2&&this.nearMt(tx,tz)))continue;   // sin pared entre el núcleo de una montaña y su falda: son la misma superficie continua   // solo hay pared hacia un vecino más bajo (o el vacío); Fase 49b: el MAR no lleva faldón hacia el vacío (el borde del mundo es mar abierto y continúa en el PAD)
    const NS=h>=2&&this.nearMt(tx,tz)?SMM:1;   // junto a una cordillera el borde se parte en 3 tramos, igual que la malla de la tapa (si no, quedan huecos triangulares entre tapa y pared)
    for(let sg=0;sg<NS;sg++){const t0=sg/NS,t1=(sg+1)/NS,ax=ax0+(bx0-ax0)*t0,az=az0+(bz0-az0)*t0,bx=ax0+(bx0-ax0)*t1,bz=az0+(bz0-az0)*t1;
     const ya=h>=2?topY(ax,az):this.field(ax,az).y,yb2=h>=2?topY(bx,bz):this.field(bx,bz).y;let yb;
     if(hn<=0)yb=(h>=2?LVY:Math.min(ya,yb2))-1.05;else yb=Math.min(this.field(ax,az).y,this.field(bx,bz).y)-.02;
     wall(ax,az,bx,bz,ya,yb2,yb,dx,dz,NS>1)}}}}
  yield;  if(RP.length){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(RP,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(RC,3));geo.computeVertexNormals();const m=new THREE.Mesh(geo,this.matRock);m.receiveShadow=m.castShadow=true;g.add(m)}
  yield;  if(MP.length){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(MP,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(MC,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(MN,3));const m=new THREE.Mesh(geo,this.matMtn);m.castShadow=true;m.receiveShadow=false;g.add(m)}   // Fase 3: las cumbres NO reciben sombra del mapa (en la cara opuesta al sol la pendiente rasante dibujaba franjas de acné de sombra / moiré; el sombreado toon ya oscurece esa cara); siguen proyectando sombra al suelo
  yield;  if(DKP.length){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(DKP,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(DKC,3));geo.computeVertexNormals();const m=new THREE.Mesh(geo,this.matDeck);m.receiveShadow=m.castShadow=true;g.add(m)}
  yield;  if(SLP.length){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(SLP,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(SLC,3));geo.computeVertexNormals();const m=new THREE.Mesh(geo,this.matMtnW);m.castShadow=true;m.receiveShadow=false;g.add(m)}   // Fase 3: paredes inclinadas de cordillera con la roca de la cumbre
  yield;  if(WLP.length){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(WLP,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(WLC,3));geo.computeVertexNormals();const m=new THREE.Mesh(geo,this.matWall);m.receiveShadow=m.castShadow=true;g.add(m)}
  // Fase 49c · el héroe se pinta en su propio lienzo y solo ve las copias de profundidad de aScene: sin esto, al caminar por detrás de una cordillera se dibujaba ENCIMA de la montaña.
  // Solo los chunks con cumbre (MP) aportan copias (comparten la geometría; sin color): el resto del relieve es bajo y no tapa al héroe.
  if(MP.length&&this.occ){if(!this.ogrp){this.ogrp=new THREE.Group();this.ogrp.name='terreno3d_occ';this.occ.add(this.ogrp)}const og=new THREE.Group();g.userData.og=og;
   g.children.forEach(m=>{if(m.isMesh&&(m.material===this.matMtn||m.material===this.matMtnW||m.material===this.matWall||m.material===this.matRock)){const d=new THREE.Mesh(m.geometry,Terrain.DEPTHM);d.layers.set(3);og.add(d)}});this.ogrp.add(og)}
  yield;  if(WP.length){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(WP,3));geo.setAttribute('aDepth',new THREE.Float32BufferAttribute(WD,1));geo.setAttribute('aSwell',new THREE.Float32BufferAttribute(WS,1));const m=new THREE.Mesh(geo,this.water);m.renderOrder=2;g.add(m)}
  this.grp.add(g);return{g,seen:this.tick,grass:null}}
 // cordilleras (Fase 44-0 ii): F.MTN = 1 en los tiles de NÚCLEO de una cordillera (los pinta como malla suave con altura continua; ver buildG)
 rangeCol(wx,wy){for(const q of BIOMES.ranges){const b=q.bb;if(wx>=b[0]&&wx<=b[1]&&wy>=b[2]&&wy<=b[3])return q.col||['#5f5c68','#7d7885','#aaa6b0']}return['#5f5c68','#7d7885','#aaa6b0']}
 isMt(tx,tz){const M=this.F&&this.F.MTN;return!!M&&tx>=0&&tz>=0&&tx<this.NX&&tz<this.NY&&M[tz*this.NX+tx]===1}
 nearMt(tx,tz){for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)if(this.isMt(tx+i,tz+j))return true;return false}
 near(tx,tz,v){for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)if(this.h(tx+i,tz+j)===v)return true;return false}
 // pradera del chunk (guía §4.4): matas instanciadas del mismo color que el suelo, más bajas cerca de caminos/agua, nada en caminos, agua, arena ni roca
 // R3D-OPT: el pasto del chunk se parte en 4 cuadrantes de 8×8 tiles, cada uno con DOS mallas que COMPARTEN los buffers de instancias: «full» (7 briznas, 35 tris) y «lite» (4 briznas, 12 tris).
 // lod() enseña la completa cerca del héroe y la ligera lejos (allí el óleo/Kuwahara y la viñeta ya funden el detalle) y el recorte por cámara se hace por cuadrante.
 meadow(ci,cj){const it=this.meadowG(ci,cj);let r;while(!(r=it.next()).done);return r.value}
 *meadowG(ci,cj){const x0=ci*CS,z0=cj*CS,per=Math.round(26*this.q),N=CS*CS*per;if(!per)return null;const o=new THREE.Object3D(),B=[0,1,2,3].map(()=>({m:[],c:[]}));let n=0;
  for(let i=0;i<N*1.6&&n<N;i++){if((i&255)===0)yield;const x=x0+hash(i,1,ci*7+cj*131)*CS,z=z0+hash(i,2,ci*13+cj*71)*CS,tx=Math.floor(x),tz=Math.floor(z),h=this.h(tx,tz);if(!this.land(h))continue;
   if(this.F&&this.F.DK&&this.F.DK[tz*this.NX+tx])continue;   // Fase 3: nada de matas creciendo a través de una pasarela
   const f=this.field(x,z);if(f.w>.22)continue;const[pf,pc]=this.pathAt(x,z);if(pf>.35||pc>.2)continue;if(TER.sandAt&&TER.sandAt(tx,tz)>.2)continue;{const nb=this.bnear(x,z);if(nb>.5&&hash(i,6,9)<nb*1.1-.25)continue}
   const tall=(.65+.6*fb2(x*.6+20,z*.6+7))*(1-Math.min(1,pf*2))*(f.w>.05?.6:1),hg=(.17+hash(i,3,9)*.1)*tall;if(hg<.06)continue;
   o.position.set(x,f.y,z);o.rotation.set(0,hash(i,4,9)*6.28,0);o.scale.setScalar(hg);o.updateMatrix();
   const k=TER.biomeOf?TER.biomeOf(tx,tz):0,col=this.gc(x,z,k).offsetHSL(0,0,(hash(i,5,9)-.5)*.04);{const nb=this.bnear(x,z);if(nb>.01)col.lerp(this._u.set('#7a6a3c'),Math.min(.7,nb*(.55+.9*vn2(x*1.7+31,z*1.7+5))*.85))}   // Fase 3: las matas junto a edificios se vuelven paja seca (si no, la hierba viva tapa la tierra pisada)
   const b=B[(x>=x0+8?1:0)+(z>=z0+8?2:0)];b.m.push(...o.matrix.elements);b.c.push(col.r,col.g,col.b);n++}
  if(!n)return null;yield;const grp=new THREE.Group();grp.userData.q=[];
  B.forEach((b,qi)=>{const cnt=b.c.length/3;if(!cnt)return;const cx=x0+4+(qi&1)*8,cz=z0+4+(qi>>1)*8,sph=new THREE.Sphere(new THREE.Vector3(cx,0,cz),CS*.3536+1.6);   // radio = media diagonal del cuadrante + alto de la mata + desnivel
   const full=new THREE.InstancedMesh(this.tuft,this.matGrass,cnt);full.instanceMatrix.array.set(b.m);full.instanceMatrix.needsUpdate=true;full.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(b.c),3);
   const lite=new THREE.InstancedMesh(this.tuftLite,this.matGrass,cnt);lite.instanceMatrix=full.instanceMatrix;lite.instanceColor=full.instanceColor;
   [full,lite].forEach(m=>{m.receiveShadow=true;m.boundingSphere=sph;m.frustumCulled=true;grp.add(m)});lite.visible=false;grp.userData.q.push({full,lite,cx,cz,far:false})});
  return grp}
 // distancia (tiles) a partir de la cual el cuadrante usa la brizna ligera; con histéresis de 1,5 tiles para que no parpadee al cruzar el umbral
 lod(cx,cz){const R=this.lodR;this.ch.forEach(c=>{if(!c.grass)return;c.grass.userData.q.forEach(q=>{const d=Math.hypot(q.cx-cx,q.cz-cz),far=q.far?d>R-1.5:d>R+1.5;if(far!==q.far||q.full.visible===q.lite.visible){q.far=far;q.full.visible=!far;q.lite.visible=far}})})}
 freeGrass(c){if(!c.grass)return;c.g.remove(c.grass);c.grass.userData.q.forEach(q=>{q.full.dispose();q.lite.dispose()});c.grass=null}   // dispose() libera los buffers de instancias en GPU (antes se quedaban para siempre al expulsar un chunk)
 setQuality(q){if(q===this.q)return;this.q=q;this.ch.forEach(c=>this.freeGrass(c))}
}
// mata de 7 briznas finas (4 tramos), idéntica a la referencia
function tuftGeo(NB,SEG,wk){const P=[],Nn=[],up=new THREE.Vector3(0,1,0);
 for(let b=0;b<NB;b++){const a=hash(b,1,71)*6.28,r0=hash(b,2,71)*.09,lean=.25+hash(b,3,71)*.25,hh=.7+hash(b,4,71)*.45,w=(.034+hash(b,5,71)*.014)*wk;
  const base=new THREE.Vector3(Math.cos(a)*r0,0,Math.sin(a)*r0),dir=new THREE.Vector3(Math.cos(a+1.3),0,Math.sin(a+1.3)),side=new THREE.Vector3(-dir.z,0,dir.x);
  const pt=t=>base.clone().addScaledVector(dir,lean*t*t).addScaledVector(up,hh*t),wd=t=>w*(1-t*.92);
  for(let s=0;s<SEG;s++){const t0=s/SEG,t1=(s+1)/SEG,a0=pt(t0),a1=pt(t1);   // R3D-OPT: 3 tramos (2 cuadriláteros + triángulo de punta) = 5 tris/brizna en vez de 8
   const q=[a0.clone().addScaledVector(side,-wd(t0)),a0.clone().addScaledVector(side,wd(t0)),a1.clone().addScaledVector(side,wd(t1)),a1.clone().addScaledVector(side,-wd(t1))];
   (s===SEG-1?[0,1,a1]:[0,1,2,0,2,3]).forEach(k=>{const v=k===a1?a1:q[k];P.push(v.x,v.y,v.z);Nn.push(0,1,0)})}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(Nn,3));return g}
// agua de F1: esmeralda por profundidad, ondas y destellos por ruido, orilla con espuma fina y alfa corto (la refracción real llega en F3)
export {WU};   // R3D-AGUA-IMPL: el agua D vive en water3d.js (material, simulación, peces, pesca)
Terrain.BLD={casa:2.7,cabana:2.1,taberna:3.2,granero:3.3,iglesia:4.8,molino:3.7,puesto:1.5,gallinero:1.7,pozo:1.4,secadero:1.6};   // Fase 3: radio (tiles) de la hierba pisada alrededor de cada edificio (`bnear`)
Terrain.DEPTHM=new THREE.MeshBasicMaterial({colorWrite:false,side:THREE.DoubleSide});   // Fase 49c: material de solo profundidad de las copias de oclusión
