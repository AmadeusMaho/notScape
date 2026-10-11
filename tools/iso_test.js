// Prueba sin navegador del núcleo isométrico: node tools/iso_test.js
const ISO=require('../src/iso.js');let fail=0;const ok=(c,m)=>{if(!c){fail++;console.log('FALLO:',m)}};const near=(a,b,e=1e-6)=>Math.abs(a-b)<e;
// 1) proyección: un tile mide 56×28 y un nivel sube 22
const p0=ISO.proj(0,0),p1=ISO.proj(ISO.TILE,0),p2=ISO.proj(0,ISO.TILE);
ok(near(p1.x-p0.x,28)&&near(p1.y-p0.y,14),'tile +x = (+28,+14)');ok(near(p2.x-p0.x,-28)&&near(p2.y-p0.y,14),'tile +y = (-28,+14)');
ok(near(ISO.proj(0,0,2).y-p0.y,-44),'2 niveles suben 44');
// 2) ida y vuelta a varias alturas
for(const z of [0,.75,1,2])for(let i=0;i<200;i++){const x=Math.random()*11500,y=Math.random()*1500,s=ISO.proj(x,y,z),w=ISO.unproj(s.x,s.y,z);ok(near(w.x,x,1e-6)&&near(w.y,y,1e-6),'ida y vuelta z='+z)}
// 3) vista y clic con alturas: terreno con acantilado (z=2 si x>=640)
ISO.resize(1280,800,2);ISO.snap(320,320,1);const hz=(x,y)=>x>=640?2:1;
let bad=0,tested=0;for(let i=0;i<2000;i++){const x=Math.random()*1200,y=Math.random()*600,z=hz(x,y),c=ISO.toCanvas(x,y,z),w=ISO.toWorld(c.x,c.y,hz);
 if(Math.abs(x-640)<1)continue; // franja de 1 px de mundo sobre el borde exacto del escalón: el redondeo a píxel real puede cruzarla
 // si otro nivel tapa este punto, el clic legítimamente cae en el de encima: solo exigimos los puntos visibles
 const s=ISO.proj(x,y,z),alt=[0,.75,1,2].map(q=>ISO.unproj(s.x,s.y,q)).filter((u,k)=>hz(u.x,u.y)===[0,.75,1,2][k]);if(alt.some(u=>u.x+u.y>x+y+1e-6))continue;
 tested++;if(Math.abs(w.x-x)>1.5||Math.abs(w.y-y)>1.5||w.z!==z)bad++}
ok(bad===0&&tested>500,'clic cae en el punto correcto a cualquier altura (fallos '+bad+' de '+tested+' puntos visibles)');
// 4) tamaño de vista: lógico = css/zoom, real = css*dpr (máx. 2)
ISO.resize(1000,625,3);ok(ISO.V.dpr===2&&ISO.V.cw===2000&&near(ISO.V.w,1000/ISO.V.zoom),'dpr máx 2 y tamaño lógico');
// 5) cámara: tras snap el objetivo queda en el centro del canvas y se redondea al píxel real
ISO.snap(500,300,1);const cc=ISO.toCanvas(500,300,1);ok(Math.abs(cc.x-ISO.V.cw/2)<=1&&Math.abs(cc.y-ISO.V.ch/2)<=1,'cámara centrada');
for(let i=0;i<30;i++)ISO.follow(900,500,1,1/60);const s=ISO.scale();ok(near(ISO.cam.x*s,Math.round(ISO.cam.x*s))&&near(ISO.cam.y*s,Math.round(ISO.cam.y*s)),'cámara redondeada al píxel real');
// 6) orden de dibujo: lo que está más cerca de la cámara (x+y mayor) se dibuja después
ok(ISO.depth(100,100)<ISO.depth(101,100),'orden por pies');ok(ISO.depth(90,90,64,64)>ISO.depth(100,100),'huella grande por su esquina cercana');
const l=[{d:5,x:2},{d:3,x:9},{d:5,x:1}];ISO.sortDepth(l);ok(l.map(e=>e.d+':'+e.x).join()==='3:9,5:1,5:2','sortDepth con desempate por x');
ok(ISO.tileOrder({tx:1,ty:2},{tx:2,ty:2})<0&&ISO.tileOrder({tx:3,ty:0},{tx:1,ty:2})>0,'tileOrder desempata por x');
// 7) teclas: 8 direcciones de pantalla -> mundo, normalizadas, y la pantalla ve el sentido correcto
const dirs={u:[0,0,1,0],d:[0,0,0,1],l:[1,0,0,0],r:[0,1,0,0],ur:[0,1,1,0],ul:[1,0,1,0],dr:[0,1,0,1],dl:[1,0,0,1]},seen={};
for(const k in dirs){const v=ISO.keyDir(...dirs[k]);ok(near(Math.hypot(v.x,v.y),1),'dir '+k+' normalizada');const a=ISO.proj(0,0),b=ISO.proj(v.x*10,v.y*10);seen[k]=[Math.sign(Math.round((b.x-a.x)*1e6)/1e6),Math.sign(Math.round((b.y-a.y)*1e6)/1e6)]}
const exp={u:[0,-1],d:[0,1],l:[-1,0],r:[1,0],ur:[1,-1],ul:[-1,-1],dr:[1,1],dl:[-1,1]};for(const k in exp)ok(seen[k][0]===exp[k][0]&&seen[k][1]===exp[k][1],'dir '+k+' se ve '+exp[k]+' y salió '+seen[k]);
ok(ISO.keyDir(0,0,0,0).x===0&&ISO.keyDir(1,1,0,0).x===0,'sin tecla o teclas opuestas = quieto');
// 8) oclusión
ok(ISO.occludes({x:0,y:0,w:50,h:50},10,{x:20,y:20},5)&&!ISO.occludes({x:0,y:0,w:50,h:50},4,{x:20,y:20},5),'oclusión solo si el objeto está delante');
console.log(fail?'RESULTADO: FALLÓ ('+fail+')':'RESULTADO: OK');process.exit(fail?1:0)
