// NotScape · R3D · Fase 44a · ÍNDICE ESPACIAL por celdas (PLAN_MUNDO_ABIERTO §10.2-1). El mundo ×2 tiene ≈ 13 000 props y ≈ 8 500 árboles/menas: recorrer las listas enteras para
// «lo que hay cerca del héroe» no escala (y los topes de instancias, como el de las sombras de contacto, dejaban sin sombra a todo lo que quedaba al final de la lista).
// `Grid` guarda elementos con posición (x,y en px de MUNDO) en celdas de `cell` px y los devuelve por radio. Solo datos: no toca la escena ni el estado del juego.
//   const g=new Grid(1024); g.add(x,y,item); g.each(cx,cy,r,(item,x,y)=>{…});  g.size
export class Grid{
 constructor(cell=1024){this.c=cell;this.m=new Map();this.size=0}
 key(i,j){return i*100003+j}
 add(x,y,v){const k=this.key(Math.floor(x/this.c),Math.floor(y/this.c));let a=this.m.get(k);if(!a)this.m.set(k,a=[]);a.push(v,x,y);this.size++}   // aplanado: [item,x,y,item,x,y…] (sin objetos intermedios)
 // llama cb(item,x,y) para cada elemento a distancia ≤ r (círculo) de (cx,cy)
 each(cx,cy,r,cb){const c=this.c,i0=Math.floor((cx-r)/c),i1=Math.floor((cx+r)/c),j0=Math.floor((cy-r)/c),j1=Math.floor((cy+r)/c),r2=r*r;
  for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const a=this.m.get(this.key(i,j));if(!a)continue;for(let n=0;n<a.length;n+=3){const dx=a[n+1]-cx,dy=a[n+2]-cy;if(dx*dx+dy*dy<=r2)cb(a[n],a[n+1],a[n+2])}}}
}
