// NotScape · R3D · Lote R3D-ANIM · ESCENARIOS de animación del héroe (los comparten el visor anim-diorama.html y tools/r3d/anim_lint.mjs).
// Cada escenario: {id, n (nombre), g (gear del look), st(t) → estado como el de game.js (heroState3D/actState), T (s a simular), win [t0,t1] (ventana de la tira)}.
// Los tiempos imitan game.js: animPh (la animación DURA D ms y TERMINA en el impacto, luego rc 260 ms y rd), golpe cada `per` ms.
const q4=v=>Math.floor(Math.max(0,Math.min(.999,v))*4)/4;
export function animPh(per,tau,sg,Dk){const D=Math.min(Dk,per),R=Math.min(260,per-D);if(tau<=D)return{ph:Math.max(0,Math.min(1,1-tau/D))};if(sg<R)return{ph:0,rc:q4(sg/R)};return{ph:0,rd:1}}
export const DUR={sword:560,dagger:400,great:740,fist:440,bow:900,xbow:900,staff:750,scepter:750};
export const DURH={sword:760,dagger:760,great:880,fist:760,bow:1150,xbow:1150,staff:900,scepter:900};
const WT={sword:'m',dagger:'m',great:'m',fist:'m',bow:'r',xbow:'r',staff:'g',scepter:'g'};
const FOL={fist:.3,sword:.4,dagger:.26,great:.7,scepter:.45,staff:.5,bow:.6,xbow:.85,wc:.45,mi:.5,sm:.35};
const PER=2400;
export const attack=(k,hv,per=PER)=>tm=>{const ms=tm*1000,n=Math.floor(ms/per),tau=per-(ms-n*per),sg=ms-n*per;return Object.assign({k:'f',wt:WT[k],wk:k==='fist'?'':k,wcol:'#ccc',hv:hv?1:0},animPh(per,tau,n?sg:1e9,(hv?DURH:DUR)[k]))};
export const work=(k,per=1800,D=k==='wc'?720:680)=>tm=>{const ms=tm*1000,n=Math.floor(ms/per),tau=per-(ms-n*per),sg=ms-n*per;return Object.assign({k,col:'#aaa',id:k==='sm'?'anvil':undefined},animPh(per,tau,n?sg:1e9,D))};
const loop=(k,id)=>tm=>({k,ph:(tm*.9)%1,id});
const once=(k,dur)=>tm=>({k,ph:Math.min(.999,(tm%(dur+.6))/dur)});
export const gear=k=>{if(k==='fist')return{};const t=k==='bow'||k==='xbow'?'bow':k==='staff'||k==='scepter'?'staff':'sword';return{wp:{t,wk:k,col:k==='staff'||k==='scepter'?'#9cf':'#cfd4dc'}}};
export const KINDS=['fist','sword','dagger','great','bow','xbow','staff','scepter'];
export const SC=[];
for(const k of KINDS){const shs=['sword','dagger','scepter','fist'].includes(k)?[0,1]:[0];
 for(const s of shs){const g=Object.assign(gear(k),s?{sh:'#7a5a3a'}:{}),n=k+(s?'+escudo':''),id=k+(s?'+sh':''),D=DUR[k]/1000,DH=DURH[k]/1000,F=FOL[k];
  SC.push({id:id+'.reposo',n:n+' · reposo',g,st:tm=>({}),win:[1,4.5]},{id:id+'.guardia',n:n+' · guardia',g,st:tm=>({cb:1}),win:[1,4.5]},
   {id:id+'.ataque',n:n+' · ataque',g,st:tm=>({act:attack(k,0)(tm),cb:1}),T:7.3,win:[2.4-D-.12,2.4+F*1.05+.1]},
   {id:id+'.ataqueB',n:n+' · ataque (2.º golpe)',g,st:tm=>({act:attack(k,0)(tm),cb:1}),T:7.3,win:[4.8-D-.12,4.8+F*1.05+.1]},
   {id:id+'.maximo',n:n+' · golpe máximo',g,st:tm=>({act:attack(k,1)(tm),cb:1}),T:5,win:[2.4-DH-.12,2.4+F*1.25+.1]},
   {id:id+'.especial',n:n+' · especial',g,st:tm=>({act:{k:'sp',ph:Math.min(.999,(tm%2.2)/1.6),wt:WT[k],wk:k},cb:1}),T:3.2,win:[2.2,3.8]},
   {id:id+'.andar',n:n+' · andar',g,st:tm=>({mv:1,speed:2.97}),win:[2,2.45]},{id:id+'.correr',n:n+' · correr',g,st:tm=>({mv:1,run:1,speed:3.4}),win:[2,2.42]},
   {id:id+'.andarc',n:n+' · andar en combate',g,st:tm=>({mv:1,speed:2.97,cb:1}),win:[2,2.45]},
   // fuera de combate el arma va enfundada (cadera/espalda): se DESENFUNDA al entrar (cb 1 s) y se ENFUNDA al salir (cb 3.6 s)
   {id:id+'.desenf',n:n+' · desenfundar',g,st:tm=>({cb:tm>1&&tm<3.6?1:0}),T:5.5,win:[.95,1.75]},
   {id:id+'.enf',n:n+' · enfundar',g,st:tm=>({cb:tm>1&&tm<3.6?1:0}),T:5.5,win:[3.55,4.45]},
   {id:id+'.andar_enf',n:n+' · andar enfundado',g,st:tm=>({mv:1,speed:2.97}),win:[2,2.45]})}}
for(const [k,id,f,win] of [['tala','wc',work('wc'),[1.8-.72-.1,1.8+.55]],['minería','mi',work('mi'),[1.8-.68-.1,1.8+.6]],['yunque','sm',work('sm'),[1.8-.68-.1,1.8+.45]],
 ['pesca','fi',tm=>({k:'fi',ph:Math.min(.99,(tm%5)/2.4),tug:(tm%5)>3.2&&(tm%5)<3.5?1:0}),[0,3.6]],
 ['cocinar','co',loop('co'),[1,2.3]],['horno','fu',loop('sm','furnace'),[1,3.9]],['artesanía','cr',loop('cr'),[1,2.1]],['inscripción','ins',loop('ins'),[1,2]],
 ['comer','eat',once('eat',1),[0,1.1]],['recoger','pk',once('pk',.42),[0,.5]]])
 for(const k2 of ['fist','sword','great','bow'])SC.push({id:id+'.'+k2,n:k+' ('+k2+')',g:gear(k2),st:tm=>({act:f(tm)}),T:6,win});
// HERRERÍA · variantes de la Hoja de trabajo (smithV de heroanim3d.js): golpes H/B/t con el protocolo del golpe; gestos c/m/o con línea de tiempo propia
for(const [v,nm] of [['H','golpe fuerte'],['B','remate Byregot'],['t','toque fino']])SC.push({id:'smv.'+v,n:'yunque · '+nm,g:gear('fist'),st:tm=>({act:Object.assign(work('sm')(tm),{v})}),T:6,win:[1.8-.68-.1,1.8+.6]});
for(const [v,nm,d] of [['c','concentración',.9],['m','reparación',1],['o','observar',.7],['f','remate: alza la pieza',1.3]])SC.push({id:'smv.'+v,n:'yunque · '+nm,g:gear('fist'),st:tm=>({act:{k:'sm',id:'anvil',n:1,v,ph:tm>=.2&&tm<.2+d?Math.min(.999,(tm-.2)/d):0}}),T:6,win:[.1,.2+d+.7]});
// DOBLE EMPUÑE (gear.wp2) y ARMAS RECICLADAS (heroanim3d.js WEAPON): mismas animaciones, otro mesh
for(const dk of ['sword','dagger']){const g={wp:{t:'sword',wk:dk,col:'#cfd4dc'},wp2:{t:'sword',wk:dk,col:'#b8c0c8'}},id='dual'+dk,n='doble '+dk,D=DUR[dk]/1000,DH=DURH[dk]/1000,F=.36,a=hv=>tm=>Object.assign(attack(dk,hv)(tm),{wk:dk});
 SC.push({id:id+'.reposo',n:n+' · reposo',g,st:tm=>({}),win:[1,4.5]},{id:id+'.guardia',n:n+' · guardia',g,st:tm=>({cb:1}),win:[1,4.5]},
  {id:id+'.ataque',n:n+' · ataque (derecha)',g,st:tm=>({act:a(0)(tm),cb:1}),T:7.3,win:[2.4-D-.12,2.4+F+.1]},{id:id+'.ataqueB',n:n+' · ataque (izquierda)',g,st:tm=>({act:a(0)(tm),cb:1}),T:7.3,win:[4.8-D-.12,4.8+F+.1]},
  {id:id+'.maximo',n:n+' · golpe máximo',g,st:tm=>({act:a(1)(tm),cb:1}),T:5,win:[2.4-DH-.12,2.4+F*1.2+.1]},{id:id+'.especial',n:n+' · especial',g,st:tm=>({act:{k:'sp',ph:Math.min(.999,(tm%2.2)/1.6),wt:'m',wk:dk},cb:1}),T:3.2,win:[2.2,3.8]},
  {id:id+'.andar',n:n+' · andar',g,st:tm=>({mv:1,speed:2.97}),win:[2,2.45]},{id:id+'.andarc',n:n+' · andar en combate',g,st:tm=>({mv:1,speed:2.97,cb:1}),win:[2,2.45]},
  {id:id+'.comer',n:n+' · comer',g,st:tm=>({act:once('eat',1)(tm)}),win:[0,1.1]},{id:id+'.tala',n:n+' · tala (envaina)',g,st:tm=>({act:work('wc')(tm)}),T:6,win:[1.8-.72-.1,1.8+.55]})}
for(const [wk,anim] of [['mace','sword'],['hatchet','sword'],['greataxe','great'],['katana','sword']])SC.push({id:wk+'.ataque',n:wk+' (reciclada de '+anim+') · ataque',g:{wp:{t:'sword',wk,col:'#9aa2b0'}},st:tm=>({act:Object.assign(attack(anim,0)(tm),{wk}),cb:1}),T:5,win:[2.4-DUR[anim]/1000-.12,2.4+FOL[anim]+.1]});
SC.push({id:'dano',n:'daño (espada, guardia)',g:gear('sword'),st:tm=>({cb:1,hurt:Math.max(0,1-(tm%1.2)/.32)}),win:[1.2,1.75]});
SC.push({id:'parar',n:'parar tras correr (espada)',g:gear('sword'),st:tm=>tm<1.5?{mv:1,run:1,speed:3.4}:{},win:[1.3,2]});
SC.push({id:'cb2idle',n:'combate→reposo (mandoble)',g:gear('great'),st:tm=>tm<1.5?{cb:1}:{},win:[1.3,2.1]});
SC.push({id:'idle2cb',n:'reposo→combate (espada+escudo)',g:Object.assign(gear('sword'),{sh:'#7a5a3a'}),st:tm=>tm>1.5?{cb:1}:{},win:[1.4,2.1]});
export const byId=id=>SC.find(s=>s.id===id);
// estado completo en el instante tm (como lo pasa r3d.js a MiniHero.update)
export function stateAt(sc,tm){const s=Object.assign({x:0,y:0,z:0,t:tm,mv:0,run:0,act:null,hurt:0,face:[0,1]},sc.st(tm));if(s.mv&&s.speed)s.z=s.speed*tm;return s}
