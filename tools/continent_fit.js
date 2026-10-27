// ¿Caben los rectángulos de bioma (datos locales, K=6: 864×564 tiles) sobre las regiones del mapa A? Centra un rectángulo en el centroide de cada región
// y mide: % del rectángulo que cae en SU región, en otra región, en mar; y % de la región que ningún rectángulo cubre. Uso: node tools/continent_fit.js [w] [h]
const C=require('../src/continent.js'),r=C.build({}),RW=+process.argv[2]||864,RH=+process.argv[3]||564,c=r.cell,g=C.GAME;
const ids=[1,2,3,4,5,6,7,8,9],S={};ids.forEach(i=>S[i]={n:0,sx:0,sy:0,x0:1e9,x1:-1e9,y0:1e9,y1:-1e9});
for(let j=0;j<r.h;j++)for(let i=0;i<r.w;i++){let id=r.bio[j*r.w+i];if(id===10)id=8;const s=S[id];if(!s||r.land[j*r.w+i]!==1&&id!==8)continue;s.n++;s.sx+=i;s.sy+=j;s.x0=Math.min(s.x0,i);s.x1=Math.max(s.x1,i);s.y0=Math.min(s.y0,j);s.y1=Math.max(s.y1,j)}
const rects=ids.map(id=>{const s=S[id],cx=s.sx/s.n,cy=s.sy/s.n,hw=RW/c/2,hh=RH/c/2;return{id,x0:Math.round(cx-hw),x1:Math.round(cx+hw),y0:Math.round(cy-hh),y1:Math.round(cy+hh)}});
const cover=new Uint8Array(r.w*r.h);let tot=0;
console.log('bioma'.padEnd(24),'rect en SU región','en OTRO','en MAR','región cubierta');
for(const R of rects){let own=0,oth=0,sea=0,n=0,cov=0;
 for(let j=Math.max(0,R.y0);j<Math.min(r.h,R.y1);j++)for(let i=Math.max(0,R.x0);i<Math.min(r.w,R.x1);i++){n++;const id=r.bio[j*r.w+i],k=id===10?8:id;if(!id)sea++;else if(k===R.id){own++;cov++}else oth++;cover[j*r.w+i]|=1}
 const reg=S[R.id].n;console.log(C.NAMES[R.id].padEnd(24),(100*own/n).toFixed(0).padStart(6)+'%',(100*oth/n).toFixed(0).padStart(8)+'%',(100*sea/n).toFixed(0).padStart(7)+'%',(100*cov/reg).toFixed(0).padStart(9)+'%')}
let land=0,unc=0;for(let k=0;k<r.w*r.h;k++)if(r.land[k]===1){land++;if(!cover[k])unc++}
console.log('tierra firme sin ningún rectángulo:',(100*unc/land).toFixed(0)+'%');
