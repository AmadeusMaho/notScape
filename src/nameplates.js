// NotScape · PLACAS DE NOMBRE DIBUJADAS EN EL LIENZO 2D (lote N0-PLACAS-LIENZO, 2 nov 2026; el dueño: «con muchos enemigos bajan mucho los fps al moverme o girar la cámara; quieto vuelven a 100+»).
// POR QUÉ: las placas eran elementos HTML (#nps .np). Quietas no cuestan, pero al moverse la cámara o el héroe TODAS cambian de posición cada fotograma y el navegador vuelve a
// pintar y componer decenas de elementos con texto a 2× de resolución: la GPU pasaba de ~5 a 27–48 ms y el juego de 87 a 9–16 fps con 40 criaturas (medido con
// tools/r3d/crowd_profile.py; ocultar #nps lo devolvía a 112–125 fps; quitar sombras o promocionar capas NO ayudaba). Ahora se dibujan en el lienzo 2D que ya se pinta cada fotograma.
// CÓMO: `dMo` (game.js) llama `NPL.push(m,x,y,now)` (x,y = punto inferior central en px del lienzo); tras los actores, `NPL.flush(ctx,now)` las dibuja todas con la transformación identidad,
// ANTES de los números de daño. Mismo aspecto que la versión HTML (medidas en «em» de la unidad del HUD `--hu`, leída una vez del contenedor #nps vacío): barra de vida con estela que
// se vacía con retardo, % y nombre (con «…»), insignia de nivel con color por dificultad, colores de jefe/capitán/sellado/afijo, barrita de aturdimiento, iconos de estado con anillo de
// tiempo, ×n y segundos (glifos SVG de STS convertidos a Path2D), línea de afijos y barra de preparación «interrumpible». Los textos se hornean en lienzos pequeños con caché (TC).
// `?npdom` vuelve a las placas HTML antiguas (siguen en game.js). Fija `m._nph` (alto en px CSS, lo usan los números de daño).
const NPL=(()=>{
 const on=!/[?&]npdom(&|$)/.test(location.search),Q=[],ST=new Map(),TC=new Map(),GP=new Map();let unitPx=0,frame=0;
 let FN0=null;const fnt=()=>FN0||(FN0=typeof UI!=='undefined'&&UI.FONT?UI.FONT:'"Cinzel",Georgia,serif');
 try{document.fonts&&document.fonts.addEventListener('loadingdone',()=>TC.clear())}catch(e){}
 addEventListener('resize',()=>{unitPx=0});
 function hu(){if(unitPx)return unitPx;let r=document.getElementById('nps');if(!r){r=document.createElement('div');r.id='nps';document.body.appendChild(r)}unitPx=parseFloat(getComputedStyle(r).fontSize)||16;return unitPx}
 // texto horneado (relleno + contorno oscuro difuso, como el text-shadow de las placas HTML)
 function txt(s,px,col,fam,wt,ital){px=Math.max(6,Math.round(px*2)/2);const key=s+'|'+px+'|'+col+'|'+fam+'|'+wt+'|'+(ital?1:0);let c=TC.get(key);if(c){TC.delete(key);TC.set(key,c);return c}
  c=document.createElement('canvas');const x=c.getContext('2d'),f=(ital?'italic ':'')+wt+' '+px+'px '+fam;x.font=f;const w=Math.ceil(x.measureText(s).width),pad=Math.ceil(px*.35);c.width=w+pad*2;c.height=Math.ceil(px*1.45)+pad;
  x.font=f;x.textBaseline='middle';x.lineJoin='round';x.shadowColor='rgba(0,0,0,.95)';x.shadowBlur=px*.28;x.strokeStyle='rgba(0,0,0,.8)';x.lineWidth=Math.max(1.2,px*.16);x.strokeText(s,pad,c.height/2);x.shadowBlur=0;x.fillStyle=col;x.fillText(s,pad,c.height/2);c.pad=pad;c.tw=w;
  TC.set(key,c);if(TC.size>400)TC.delete(TC.keys().next().value);return c}
 function rr(x,a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()}
 function glyph(k){if(GP.has(k))return GP.get(k);let L=[];try{const s=STS.svg(k);const re=/<(path|circle)\s([^>]*)\/?>/g;let m;while((m=re.exec(s))){const at={};m[2].replace(/(\w+)="([^"]*)"/g,(_,a,v)=>{at[a]=v});if(m[1]==='path'&&at.d)L.push(new Path2D(at.d));else if(m[1]==='circle'){const p=new Path2D();p.arc(+at.cx,+at.cy,+at.r,0,6.2832);L.push(p)}}}catch(e){}GP.set(k,L);return L}
 function push(m,x,y,now){Q.push(m,x,y)}
 function flush(x,now){if(!Q.length){frame++;prune();return}const u=hu()*(cv.width/(cvRect().width||cv.width)),kc=cvRect().width/cv.width;x.save();x.setTransform(1,0,0,1,0,0);
  for(let i=0;i<Q.length;i+=3)try{one(x,Q[i],Q[i+1],Q[i+2],u,kc,now)}catch(e){}x.restore();Q.length=0;frame++;prune()}
 function prune(){if(frame%60)return;for(const [m,s] of ST)if(frame-s.f>120)ST.delete(m)}
 function one(x,m,cx,by,u,kc,now){const d=m.d,boss=d.boss,s=ST.get(m)||(ST.set(m,{g:1,gt:0,hp:1,f:frame}),ST.get(m));s.f=frame;
  const pct=Math.max(0,Math.min(1,m.hp/m.mh));if(pct!==s.hp){if(pct>s.hp)s.g=pct;else s.gt=now+320;s.hp=pct}if(now>s.gt&&s.g>pct)s.g=Math.max(pct,s.g-(now-(s.lt||now))/500);s.lt=now;
  const gap=m.lv-CBL(),lc=typeof lvTier==='function'?lvTier(m).c:gap>10?'#ff7a66':gap>4?'#f0b45a':gap<-6?'#8fd48a':'#f1e7d2',ac=boss===1?'#d9a441':boss===2?'#b9a5e8':'#e8cf94',seal=typeof sealed==='function'&&sealed(m);
  const bw=(boss===1?8.4:boss===2?7.4:6.2)*u,bh=(boss===1?1.3:boss===2?1.22:1.08)*u,lvT=txt(String(m.lv),.58*u,lc,fnt(),700),lw=Math.max(.754*u,lvT.tw+.32*u),gp=.28*u;
  const q=m.sgM?Math.max(0,m.sg/m.sgM):1,stn=m.stun>now,sgOn=q<.999||stn,sgH=.22*u,sgM=.18*u;
  const W=bw+gp+lw,H=bh+sgM+sgH+2,X=Math.round(cx-W/2),Y=Math.round(by-H);
  if(seal)x.globalAlpha=.65;
  // barra
  rr(x,X,Y,bw,bh,.3*u);x.fillStyle='rgba(14,12,10,.84)';x.fill();x.save();x.clip();
  if(s.g>pct){x.fillStyle='rgba(240,225,190,.5)';x.fillRect(X,Y,bw*s.g,bh)}
  const gr=x.createLinearGradient(0,Y,0,Y+bh);if(boss===1){gr.addColorStop(0,'#f0b84a');gr.addColorStop(1,'#a8691a')}else if(boss===2){gr.addColorStop(0,'#b58cf0');gr.addColorStop(1,'#5b2f98')}else{gr.addColorStop(0,'#d8493e');gr.addColorStop(1,'#8e1f1a')}
  x.fillStyle=gr;x.fillRect(X,Y,bw*pct,bh);x.fillStyle='rgba(255,255,255,.12)';x.fillRect(X,Y,bw*pct,bh*.22);x.restore();
  rr(x,X+.5,Y+.5,bw-1,bh-1,.3*u);x.lineWidth=Math.max(1,u*.06);x.strokeStyle=ac;x.stroke();if(m.afx){x.lineWidth=Math.max(1,u*.05);x.strokeStyle='rgba(232,207,148,.55)';rr(x,X-1.5,Y-1.5,bw+3,bh+3,.32*u);x.stroke()}
  // nombre y %
  const nm=(boss===1?'◆ ':boss===2?'◇ ':m.afx?'★ ':d.ag?'⚔ ':'')+d.n,ncol=boss===1?'#ffe7a8':boss===2?'#dccdf7':m.afx?'#e8cf94':'#f6ecd2',npx=(boss===1?.64:.58)*u;
  const pT=txt(Math.ceil(pct*100)+'%',.52*u*.58/.58,'#f6ecd2',fnt(),700),pad=.55*u,maxN=bw-pad*2-pT.tw-.5*u;
  let nT=txt(nm,npx,ncol,fnt(),700);if(nT.tw>maxN){let t=nm;while(t.length>2&&txt(t+'…',npx,ncol,fnt(),700).tw>maxN)t=t.slice(0,-1);nT=txt(t+'…',npx,ncol,fnt(),700)}
  x.drawImage(nT,Math.round(X+pad-nT.pad),Math.round(Y+bh/2-nT.height/2));x.drawImage(pT,Math.round(X+bw-pad-pT.tw-pT.pad),Math.round(Y+bh/2-pT.height/2));
  // nivel
  const LX=X+bw+gp;rr(x,LX,Y,lw,bh,.3*u);x.fillStyle='rgba(14,12,10,.84)';x.fill();x.lineWidth=Math.max(1,u*.06);x.strokeStyle=ac;x.stroke();x.drawImage(lvT,Math.round(LX+lw/2-lvT.tw/2-lvT.pad),Math.round(Y+bh/2-lvT.height/2));
  // aturdimiento
  if(sgOn){const sy=Y+bh+sgM;x.fillStyle='rgba(10,8,7,.75)';x.fillRect(X,sy,W,sgH);if(stn)x.fillStyle='#ffe08a';else{const g2=x.createLinearGradient(0,sy,0,sy+sgH);g2.addColorStop(0,'#9fd0ff');g2.addColorStop(1,'#4a7fc0');x.fillStyle=g2}x.fillRect(X,sy,W*(stn?1:q),sgH);x.lineWidth=1;x.strokeStyle=stn?'#ffe08a':'rgba(160,190,230,.4)';x.strokeRect(X+.5,sy+.5,W-1,sgH-1)}
  x.globalAlpha=1;
  // preparación (interrumpible) y afijos, debajo
  let below=Y+H;const c=typeof castOf==='function'?castOf(m,now):null;
  if(c){const cy=below+.2*u,ch=.95*u,pulse=.5+.5*Math.sin(now/80);x.save();x.shadowColor='rgba(255,190,90,'+(.35+.55*pulse)+')';x.shadowBlur=.55*u*pulse;rr(x,X,cy,W,ch,.15*u);x.fillStyle='rgba(14,10,8,.88)';x.fill();x.restore();
   x.save();rr(x,X,cy,W,ch,.15*u);x.clip();const g3=x.createLinearGradient(X,0,X+W,0);g3.addColorStop(0,'#c9621a');g3.addColorStop(1,'#ffb347');x.fillStyle=g3;x.fillRect(X,cy,W*c.p,ch);x.restore();
   rr(x,X+.5,cy+.5,W-1,ch-1,.15*u);x.lineWidth=1;x.strokeStyle='rgba(232,207,148,.7)';x.stroke();const cT=txt('⚡ '+c.n,.68*u,'#fff4dc','Spectral,Georgia,serif',600);x.drawImage(cT,Math.round(X+W/2-cT.tw/2-cT.pad),Math.round(cy+ch/2-cT.height/2));below=cy+ch}
  if(m.afx&&typeof afxNames==='function'){const aT=txt(afxNames(m),.78*u,'#e8cf94','Spectral,Georgia,serif',600,1);x.drawImage(aT,Math.round(cx-aT.tw/2-aT.pad),Math.round(below+.1*u))}
  // estados (encima)
  let dh=0;const L=(typeof STS!=='undefined'&&m.sts)?STS.list(m).filter(z=>z.d&&z.d.ic):[];
  if(L.length){const R=.85*u,gp2=.2*u,tot=L.length*2*R+(L.length-1)*gp2;let ix=cx-tot/2+R;const iy=Y-.25*u-R;dh=2*R+.25*u;
   for(const z of L){const p=Math.max(0,Math.min(1,z.rem/z.tot)),col=z.d.col||'#fff';x.beginPath();x.arc(ix,iy,R,0,6.2832);x.fillStyle='rgba(0,0,0,.65)';x.fill();
    x.beginPath();x.moveTo(ix,iy);x.arc(ix,iy,R,-1.5708,-1.5708+6.2832*p);x.closePath();x.fillStyle=col;x.fill();x.beginPath();x.arc(ix,iy,R-.18*u,0,6.2832);x.fillStyle='rgba(16,13,10,.92)';x.fill();
    const gl=glyph(z.k);if(gl.length){const sc=(R*1.25)/24;x.save();x.translate(ix-12*sc,iy-12*sc);x.scale(sc,sc);x.strokeStyle=col;x.lineWidth=1.9;x.lineCap='round';x.lineJoin='round';gl.forEach(g=>x.stroke(g));x.restore()}
    if(z.n>1){const t2=txt(String(z.n),.6*u*.95,'#ffffff',fnt(),700);x.drawImage(t2,Math.round(ix+R*.55-t2.pad),Math.round(iy-R-t2.height*.3))}
    const sec=Math.ceil(z.rem/1000);if(sec<100){const t3=txt(String(sec),.62*u*.95,'#ffffff',fnt(),700);x.drawImage(t3,Math.round(ix-t3.tw/2-t3.pad),Math.round(iy+R*.55-t3.height*.15))}ix+=2*R+gp2}}
  m._nph=(H+dh)*kc}
 return{on,push,flush,get n(){return ST.size},clear:()=>{TC.clear();ST.clear()}}})();
