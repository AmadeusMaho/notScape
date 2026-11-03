/* NotScape · BARRA DE XP DE COMBATE + PARTÍCULAS (lote MAESTRIA-ARMAS, 2 nov 2026; el dueño: «una barra de XP bonita abajo y un pequeño efecto al conseguir la XP que vaya como
   partículas ligeras a la barra, que no invada mucho la pantalla»). Global `XPB` (script clásico antes de game.js; usa sus globales S, L, XT, ML, CSK, ISO, TER, cv, cvRect, fText SOLO al llamar).
   · Barra fina de cristal bajo el marco del jugador (dentro de `#hs-col`, así sigue al panel lateral): 20 segmentos estilo WoW, relleno violeta = Combate, hilo dorado debajo = maestría
     del arma equipada; el número del nivel a la izquierda y el % a la derecha. Solo toca el DOM cuando cambia la XP (comparación barata por fotograma).
   · `XPB.burst(m,xp)` al matar: «+N XP» morado sobre el enemigo y 4–9 motas de luz que vuelan en curva a la punta del relleno (lienzo 2D, tope 48 motas); al llegar, la barra late.
   · Sin `backdrop-filter` (regla del HUD Susurro). `?xpbar=0` la apaga. */
const XPB=(()=>{
 const on=!/[?&]xpbar=0\b/.test(location.search);let el=null,fl=null,ms=null,lv=null,pc=null,lx=-1,lm=-1,lf='',rect=null,rT=0,pulse=0;const PT=[];
 function mount(){if(el||!on)return!!el;const col=document.getElementById('hs-col');if(!col)return false;
  el=document.createElement('div');el.id='xpb';el.innerHTML='<b class="xb-l"></b><div class="xb-t"><i class="xb-f"></i><i class="xb-s"></i><i class="xb-m"></i></div><span class="xb-p"></span>';col.appendChild(el);
  fl=el.querySelector('.xb-f');ms=el.querySelector('.xb-m');lv=el.querySelector('.xb-l');pc=el.querySelector('.xb-p');addEventListener('resize',()=>{rect=null});return true}
 const frac=(x,l)=>l>=99?1:Math.max(0,Math.min(1,(x-XT[l])/(XT[l+1]-XT[l])));
 // cada fotograma (desde draw): sincroniza la barra si cambió la XP o el arma
 function sync(now){if(!mount())return;const x=S.xp.cb||0,f=typeof CSK!=='undefined'?CSK.fam():'fist',mx=(S.ms||{})[f]||0;
  if(x!==lx){lx=x;const l=L('cb'),p=frac(x,l);fl.style.width=(p*100).toFixed(2)+'%';lv.textContent=l;pc.textContent=Math.floor(p*100)+' %';el.title='Combate '+l+' · '+Math.floor(x).toLocaleString('es')+' XP'}
  if(mx!==lm||f!==lf){lm=mx;lf=f;const l=typeof ML==='function'?ML(f):1;ms.style.width=(frac(mx,l)*100).toFixed(2)+'%';ms.title='Maestría '+((CSK.FAM[f]||{}).n||'')+' '+l}
  if(pulse&&now>pulse){pulse=0;el.classList.remove('hit')}}
 // punta del relleno en píxeles del lienzo (caché de 1 s: nada de getBoundingClientRect por fotograma)
 function tip(now){if(!el)return null;if(!rect||now-rT>1000){rT=now;const r=el.querySelector('.xb-t').getBoundingClientRect(),c=cvRect(),k=cv.width/(c.width||cv.width);rect={x:(r.left-c.left)*k,y:(r.top-c.top+r.height/2)*k,w:r.width*k}}
  return{x:rect.x+rect.w*frac(S.xp.cb||0,L('cb')),y:rect.y}}
 function burst(m,xp){if(!on)return;try{fText('+'+xp+' XP','#b48cff',m.x,m.y,44)}catch(e){}
  const c=ISO.toCanvas(m.x,m.y,TER.standZ(m.x,m.y)),h=(m.d&&m.d.h||20)*.5,now=performance.now(),n=Math.min(9,4+Math.round(Math.log2(1+xp)));
  for(let i=0;i<n&&PT.length<48;i++){const a=Math.random()*6.283,r=6+Math.random()*14;PT.push({x0:c.x+Math.cos(a)*r,y0:c.y-h*(cv.height/400)+Math.sin(a)*r*.6,t0:now+i*45+Math.random()*60,d:620+Math.random()*320,s:(Math.random()<.5?-1:1)*(60+Math.random()*120),z:1.4+Math.random()*1.6,w:Math.random()<.3})}}
 // lienzo 2D (desde draw, tras las placas): motas con estela corta y mezcla aditiva
 function draw(x,now){sync(now);if(!PT.length)return;const t=tip(now);if(!t){PT.length=0;return}const k=cv.height/900;x.save();x.setTransform(1,0,0,1,0,0);x.globalCompositeOperation='lighter';
  for(let i=PT.length-1;i>=0;i--){const p=PT[i],u=(now-p.t0)/p.d;if(u<0)continue;if(u>=1){PT.splice(i,1);pulse=now+260;if(el)el.classList.add('hit');continue}
   for(let j=0;j<3;j++){const v=Math.max(0,u-j*.035),e=v*v*(3-2*v),mx=(p.x0+t.x)/2+p.s*k*3,my=Math.min(p.y0,t.y)-160*k,bx=(1-e)*(1-e)*p.x0+2*(1-e)*e*mx+e*e*t.x,by=(1-e)*(1-e)*p.y0+2*(1-e)*e*my+e*e*t.y,r=p.z*k*2.2*(1-j*.28)*(1-.35*e);
    x.globalAlpha=(1-j*.4)*(u<.12?u/.12:1)*.9;x.fillStyle=p.w&&!j?'#ffffff':'#b48cff';x.beginPath();x.arc(bx,by,Math.max(.6,r),0,6.283);x.fill()}}
  x.restore()}
 return{burst,draw,sync,on}})();
