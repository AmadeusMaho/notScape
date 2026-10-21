// NotScape · R3D · PRENDAS DE LOS ATUENDOS BÁSICOS (Lote ATUENDOS-1, 21 oct 2026; pedido del dueño: «cambia un poco los skins básicos; el Penitente con una tela más fina hasta los pies y con una cruz; los otros, más estilizados»).
// Todo es DATOS + cintas CURVAS que abrazan el torso (regla de PNJ/héroe: nada de cajas rectas en diagonal ni vigas sueltas; `tools/r3d/body_lint.js` lo comprueba): cada prenda es una carcasa de revolución (lathe) algo mayor que el torso y
// cintas/costuras que siguen su superficie (`ribbon`). El radio del torso depende del vestido largo (Penitente) o de la camisa normal: `Rf(y)` lo da el llamador (herom3d.js).
import * as THREE from 'three';
const shade=(c,k)=>'#'+new THREE.Color(c).multiplyScalar(k).getHexString(),mixc=(a,b,t)=>'#'+new THREE.Color(a).lerp(new THREE.Color(b),t).getHexString();
// cinta de ancho `w` que recorre puntos [fi, y] (fi = ángulo alrededor del eje; 0 = frente +z) pegada a la superficie de radio Rf(y)+off
export function ribbon(pts,w,Rf,off=.01){const V=THREE.Vector3,pos=pts.map(([ph,y])=>{const R=Rf(y)+off;return new V(R*Math.sin(ph),y,R*Math.cos(ph))}),N=pts.length,P=[],I=[];
 for(let i=0;i<N;i++){const t=pos[Math.min(N-1,i+1)].clone().sub(pos[Math.max(0,i-1)]).normalize(),n=new V(Math.sin(pts[i][0]),0,Math.cos(pts[i][0])),u=new V().crossVectors(t,n).normalize();for(const s of[-1,1])P.push(pos[i].x+u.x*w/2*s,pos[i].y+u.y*w/2*s,pos[i].z+u.z*w/2*s)}
 for(let i=0;i<N-1;i++){const a=i*2;I.push(a,a+2,a+1,a+1,a+2,a+3)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setIndex(I);g.computeVertexNormals();return g}
const arc=(f0,f1,y0,y1,n=10)=>Array.from({length:n+1},(_,i)=>{const u=i/n;return[f0+(f1-f0)*u,y0+(y1-y0)*u]});
// carcasa de revolución (prenda de torso): de y0 a y1, radio = Rf(y)+off; phi0/phiL recortan la abertura (chaleco abierto por delante)
function shell(Rf,y0,y1,off,phi0=0,phiL=Math.PI*2){const pts=[];for(let i=0;i<=10;i++){const y=y0+(y1-y0)*i/10;pts.push(new THREE.Vector2(Rf(y)+off,y))}return new THREE.LatheGeometry(pts,28,phi0,phiL)}
const DS={t:{side:THREE.DoubleSide}};
// prendas de torso según O.top: gambesón acolchado (Errante) · brigantina de láminas (Mercenario) · chaleco abierto de cuero (Cazadora y Bandido)
export function torsoWear(O,part,g,Rf){const c=O.topC||'#7a6a4a';
 if(O.top==='gambeson'){part(shell(Rf,.5,.8,.011),c,0,0,0,{p:g,ink:.012,...DS});
  [-.95,-.5,0,.5,.95].forEach(f=>part(ribbon(arc(f,f,.53,.79,6),.012,Rf,.014),shade(c,.62),0,0,0,{p:g,ink:0,...DS}));   // costuras verticales del acolchado
  [.6,.68,.75].forEach(y=>part(ribbon(arc(-1.25,1.25,y,y,14),.011,Rf,.014),shade(c,.7),0,0,0,{p:g,ink:0,...DS}));
  part(new THREE.TorusGeometry(Rf(.8)+.016,.024,8,24).rotateX(Math.PI/2),shade(c,.85),0,.8,0,{p:g,ink:.012})}   // cuello alto
 else if(O.top==='brigantina'){const d=shade(c,.78),st='#8a8a92';part(shell(Rf,.5,.8,.016),d,0,0,0,{p:g,ink:.012,...DS});
  [.55,.61,.67,.73].forEach((y,i)=>part(ribbon(arc(-1.35,1.35,y,y,16),.042,Rf,.022),i%2?shade(st,.9):st,0,0,0,{p:g,ink:.008,...DS}));   // láminas de acero remachadas
  part(ribbon(arc(0,0,.52,.79,6),.018,Rf,.026),shade(d,.55),0,0,0,{p:g,ink:0,...DS})}
 else if(O.top==='chaleco'){part(shell(Rf,.5,.8,.03,.4,Math.PI*2-.8),c,0,0,0,{p:g,ink:.012,...DS});   // abierto por delante
  [-1,1].forEach(q=>part(ribbon(arc(.4*q,.36*q,.52,.8,8),.034,Rf,.034),shade(c,.6),0,0,0,{p:g,ink:0,...DS}));   // solapas
  [.58,.66].forEach(y=>part(ribbon(arc(-.38,.38,y,y,6),.012,Rf,.036),'#c8b080',0,0,0,{p:g,ink:0,...DS}))}   // cordón de cierre
}
// máscara de tela de la Cazadora/Bandido (mitad inferior de la cara): casquete esférico que rodea nariz y boca, con borde fino
export function maskWear(O,part,head){if(!O.mask)return;part(new THREE.SphereGeometry(.208,18,8,Math.PI/2-1.15,2.3,1.95,.9).scale(1,1.02,1.02),O.mask,0,0,.035,{p:head,ink:.012,...DS})}
// PENITENTE: túnica larga de TELA FINA hasta los pies (cuerpo lo hace Mini con `dress`) + CRUZ bordada en el pecho (dos cintas curvas que siguen el vestido) + cenefa del bajo
export function penitentCross(part,g,Rf,col){part(ribbon(arc(0,0,.3,.62,8),.034,Rf,.012),col,0,0,0,{p:g,ink:.006,...DS});part(ribbon(arc(-.4,.4,.54,.54,10),.03,Rf,.012),col,0,0,0,{p:g,ink:.006,...DS})}
// ERRANTE (atuendo normal): camisa simple + un par de correas de cuero (tirantes que cruzan los hombros, delante y detrás) + cinturón de cuero con hebilla
export function strapsWear(O,part,g,Rf){const c=O.straps;if(!c)return;
 [-1,1].forEach(q=>{part(ribbon(arc(.46*q,.4*q,.8,.52,8),.036,Rf,.012),c,0,0,0,{p:g,ink:.006,...DS});part(ribbon(arc(Math.PI-.46*q,Math.PI-.4*q,.8,.52,8),.036,Rf,.012),c,0,0,0,{p:g,ink:.006,...DS})});
 part(ribbon(arc(0,Math.PI*2,.515,.515,28),.058,Rf,.016),shade(c,.82),0,0,0,{p:g,ink:.008,...DS});   // cinturón
 part(ribbon(arc(-.07,.07,.515,.515,4),.07,Rf,.026),'#c8a050',0,0,0,{p:g,ink:.006,...DS})}   // hebilla
export {shade,mixc};
