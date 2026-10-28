// NotScape · R3D · Lote R3D-LUZ-DIN (20 oct 2026) · ILUMINACIÓN DINÁMICA CON OCLUSIÓN POR ALTURA (sustituye a las PointLight de farolas/fuegos/linterna).
// POR QUÉ: las PointLight de three no proyectan sombra sin cubemaps (6 renders por luz): inviable con decenas de fuentes y mal en móvil. El juego 2D bloqueaba la luz con los obstáculos; aquí se hace
//   lo mismo pero en 2,5D (con ALTURAS, así no es «2D»): un MAPA DE ALTURAS de oclusión (textura RG8 alrededor de la cámara) y las luces se evalúan POR FRAGMENTO en el shader `toon` (materials3d.js, `lampL`):
//   rayo desde el fragmento hacia la luz en 8 pasos; cada paso compara la altura del rayo (interpolada entre el fragmento y la lámpara) con la altura del obstáculo guardada en la textura.
//   Una casa alta bloquea la luz del farol del otro lado; una valla baja o un barril no. Muros, suelo, props, árboles, personajes y héroe reciben luz y sombra con el MISMO código.
// DATOS DE OCLUSIÓN (se reconstruyen al recentrar la ventana o cambiar las listas): canal R = parte superior (y) de props (huella de la malla real `props.fp` + altura `h`), árboles (`N` t='wc') y estaciones;
//   canal G = altura del terreno por tile (acantilados que tapan la luz). Valor = (y+3)/24·255. Cero = vacío.
// LUCES: hasta LMAX (16) fuentes, las más cercanas al objetivo de la cámara dentro de la ventana, con HUECOS PERSISTENTES y fundido (sin saltos) + la linterna del héroe de noche. Cada una: posición, radio y color·intensidad.
// COSTE: textura 288×288×2 (166 KB, 5–8 ms de CPU al recentrar, cada ~16 tiles de paseo); en la GPU un bucle de ≤16 sumas de distancia por fragmento y, solo dentro del radio de alguna luz, 8 muestras de textura por luz.
// AJUSTES: `R3D.lm.k` (intensidad global, 1), `R3D.lm.r` (radio ×), `?lm=0` lo apaga y vuelve a las PointLight; `R3D.lm.stats()`.
import * as THREE from 'three';
import {G} from './materials3d.js';
import {Grid} from './sector3d.js';

export const LMAX=16,WT=72,RES=4,N_=WT*RES,CS=16,YMIN=-3,YR=24;
const THIN=/^(farola|linterna|antorcha|brasero|braseroG|hoguera|valla|vallaCuerda|poste|cartel|banca|candelabro|estandarte|bandera|tendedero|espantapajaros|junco|flor|hierba|seta|alfombra|charco|huesos|arbusto)$/;
const enc=y=>Math.max(0,Math.min(255,Math.round((y-YMIN)/YR*255)));
const HERO_K=['#ffb866',.85,4.4,0,'hero'];

export class DynLight{
 constructor(W3){this.W3=W3;const q=(/[?&]lm=([\d.]+)/.exec(location.search)||[])[1];this.on=q==null||+q>0;this.k=q==null?3.4:+q;this.r=1;this.cx=1e9;this.cz=1e9;this.sig='';this.ms=0;this.n=0;this.nrb=0;
  this.data=new Uint8Array(N_*N_*2);this.tex=new THREE.DataTexture(this.data,N_,N_,THREE.RGFormat,THREE.UnsignedByteType);this.tex.minFilter=this.tex.magFilter=THREE.LinearFilter;this.tex.wrapS=this.tex.wrapT=THREE.ClampToEdgeWrapping;this.tex.unpackAlignment=1;this.tex.generateMipmaps=false;
  G.uLM.value=this.tex;this.slots=Array.from({length:LMAX},()=>({s:null,v:0,out:0}));this.hs={p:new THREE.Vector3(),k:'hero',ph:0};this.act=new Set();this.col=new THREE.Color()}
 // reparte una altura en una caja de texels [x0,x1]×[z0,z1] (unidades de mundo = tiles) con el máximo
 box(ch,x0,z0,x1,z1,top){const o=this.ox,oz=this.oz,i0=Math.max(0,Math.floor((x0-o)*RES)),i1=Math.min(N_-1,Math.floor((x1-o)*RES)),j0=Math.max(0,Math.floor((z0-oz)*RES)),j1=Math.min(N_-1,Math.floor((z1-oz)*RES)),v=enc(top);
  for(let j=j0;j<=j1;j++){let k=(j*N_+i0)*2+ch;for(let i=i0;i<=i1;i++,k+=2)if(this.data[k]<v)this.data[k]=v}}
 rebuild(cx,cz,props,N,ST){const T0=performance.now(),W3=this.W3,d=this.data;d.fill(0);this.cx=cx;this.cz=cz;this.ox=cx-WT/2;this.oz=cz-WT/2;
  // terreno: altura de cada tile (canal G)
  for(let tz=0;tz<WT;tz++)for(let tx=0;tx<WT;tx++){const wx=(this.ox+tx+.5)*32,wy=(this.oz+tz+.5)*32,y=W3(wx,wy,TER.standZ(wx,wy)).y;this.box(1,this.ox+tx,this.oz+tz,this.ox+tx+.999,this.oz+tz+.999,y)}
  const cxp=cx*32,czp=cz*32,Rp=WT/2*32*1.2;
  // props: huella real de la malla (props3d guarda x,y,cx,cz,sx,sz,h,n); se encoge un poco para que el muro NO se sombree a sí mismo
  if(props&&props.fp){if(this._fv!==props.fpVer||this._fl!==props.fp.length){this._fv=props.fpVer;this._fl=props.fp.length;this.gP=new Grid(1024);for(const f of props.fp)if(f.h>.9&&!THIN.test(f.n||''))this.gP.add(f.x,f.y,f)}
   this.gP.each(cxp,czp,Rp,f=>{const p=W3(f.x,f.y,TER.standZ(f.x,f.y)),sx=Math.max(.12,f.sx/1.35*.9),sz=Math.max(.12,f.sz/1.35*.9),x=p.x+f.cx,z=p.z+f.cz;this.box(0,x-sx,z-sz,x+sx,z+sz,p.y+f.h)})}
  // árboles (tronco + copa baja) y estaciones grandes
  if(N){if(this._nn!==N.length){this._nn=N.length;this.gN=new Grid(1024);for(const e of N)if(e.t==='wc')this.gN.add(e.x,e.y,e)}
   this.gN.each(cxp,czp,Rp,e=>{const p=W3(e.x,e.y,TER.standZ(e.x,e.y));this.box(0,p.x-.34,p.z-.34,p.x+.34,p.z+.34,p.y+2.7)})}
  if(typeof ST!=='undefined')for(const e of ST){if(e.id==='ru'||e.id==='door'||e.exit||e.inroom||e.id==='fire'||e.id==='furnace')continue;if(Math.abs(e.x-cxp)>Rp||Math.abs(e.y-czp)>Rp)continue;const p=W3(e.x,e.y,TER.standZ(e.x,e.y));this.box(0,p.x-.55,p.z-.55,p.x+.55,p.z+.55,p.y+1.2)}
  this.tex.needsUpdate=true;G.uLW.value.set(this.ox,this.oz,1/WT,1);this.ms=performance.now()-T0;this.nrb++}
 ensure(tx,tz,props,N,ST){const sg=(props?props.fpVer:0)+'|'+(props&&props.fp?props.fp.length:0)+'|'+(N?N.length:0)+'|'+(typeof ST!=='undefined'?ST.length:0),cx=Math.round(tx/CS)*CS,cz=Math.round(tz/CS)*CS;
  if(sg!==this.sig||Math.abs(tx-this.cx)>CS*.9||Math.abs(tz-this.cz)>CS*.9){this.sig=sg;this.rebuild(cx,cz,props,N,ST)}}
 // srcs: fuentes de r3d.js ({p,k,ph}); LK: tabla de tipos; p: fila TOD; hero: {x,y,z,i} (linterna del héroe) o null; off: true en interiores
 update(t,dt,tgt,srcs,LK,p,hero,off,props,N,ST){const U=G;if(!this.on||off){U.uLN.value=0;this.act.clear();return}
  this.ensure(tgt.x,tgt.z,props,N,ST);const half=WT/2-3,ox=this.cx,oz=this.cz,cand=[];
  for(const s of srcs){const dx=s.p.x-ox,dz=s.p.z-oz;if(Math.abs(dx)>half||Math.abs(dz)>half)continue;cand.push([s,Math.hypot(s.p.x-tgt.x,s.p.z-tgt.z)])}
  cand.sort((a,b)=>a[1]-b[1]);const top=cand.slice(0,LMAX-1).map(c=>c[0]);
  if(hero&&hero.i>.02){this.hs.p.set(hero.x,hero.y,hero.z);this.hs.hi=hero.i;top.unshift(this.hs)}
  const sl=this.slots;sl.forEach(o=>{o.out=o.s&&!top.includes(o.s)?1:0});
  top.forEach(s=>{if(sl.some(o=>o.s===s&&!o.out))return;const f=sl.find(o=>!o.s);if(f){f.s=s;f.v=0;f.out=0}});
  const a=Math.min(1,dt*7),LP=U.uLP.value,LC=U.uLC.value,c=this.col;let n=0;this.act.clear();
  for(const o of sl){if(!o.s)continue;o.v+=((o.out?0:1)-o.v)*a;if(o.out&&o.v<.01){o.s=null;continue}
   const s=o.s,hero_=s===this.hs,d=hero_?HERO_K:LK[s.k],fire=d[4]==='fire',lvl=hero_?s.hi:(fire?p.fire:p.win);if(lvl*o.v<.01)continue;
   const fl=hero_?1+Math.sin(t*9)*.03:fire?1+.05*Math.sin(t*1.7+s.ph)+.035*Math.sin(t*3.1+s.ph*1.9):1+.015*Math.sin(t*.9+s.ph);
   c.set(d[0]);const I=d[1]*o.v*lvl*fl*this.k;LP[n].set(s.p.x,s.p.y,s.p.z,d[2]*1.3*this.r);LC[n].set(c.r*I,c.g*I,c.b*I,0);n++;if(!hero_)this.act.add(s)}
  U.uLN.value=n;this.n=n}
 // LUCES DE UNA SALA (28 oct 2026): mismo shader con oclusión por ALTURA, pero con las cajas de los muebles y las paredes de la sala (`room.dyn = {srcs:[{p,d,ph}], boxes:[[x0,z0,x1,z1,top]], cx, cz}`) en vez del mapa del exterior. Cada fuente lleva su descriptor `d` = [color, intensidad, radio, _, 'fire'|'win'].
 updateRoom(t,dt,R,p,hero){const U=G;if(!this.on||!R){U.uLN.value=0;return false}
  if(this.rsig!==R.boxes.sig||this.rcx!==R.cx||this.rcz!==R.cz){this.rsig=R.boxes.sig;this.rcx=R.cx;this.rcz=R.cz;this.cx=R.cx;this.cz=R.cz;this.ox=R.cx-WT/2;this.oz=R.cz-WT/2;this.data.fill(0);for(const b of R.boxes)this.box(0,b[0],b[1],b[2],b[3],b[4]);this.tex.needsUpdate=true;U.uLW.value.set(this.ox,this.oz,1/WT,1);this.sig='room'}
  const LP=U.uLP.value,LC=U.uLC.value,c=this.col;let n=0;this.act.clear();
  for(const s of R.srcs){if(n>=LMAX)break;const d=s.d,fire=d[4]==='fire',lvl=fire?p.fire:p.win,fl=fire?1+.07*Math.sin(t*9+s.ph)+.05*Math.sin(t*23+s.ph*1.9):1+.02*Math.sin(t*.9+s.ph);c.set(d[0]);const I=d[1]*lvl*fl*this.k;LP[n].set(s.p.x,s.p.y,s.p.z,d[2]*this.r);LC[n].set(c.r*I,c.g*I,c.b*I,0);n++}
  if(hero&&hero.i>.02&&n<LMAX){const I=HERO_K[1]*hero.i*(1+Math.sin(t*9)*.03)*this.k;c.set(HERO_K[0]);LP[n].set(hero.x,hero.y,hero.z,HERO_K[2]*1.3*this.r);LC[n].set(c.r*I,c.g*I,c.b*I,0);n++}   // el farol del héroe (el de la noche) también alumbra cuevas y salas
  U.uLN.value=n;this.n=n;return true}
 stats(){return{luces:this.n,reconstrucciones:this.nrb,msUltima:+this.ms.toFixed(2),centro:[this.cx,this.cz]}}
}
