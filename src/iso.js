// NotScape · núcleo isométrico 2:1 (F1-A). Solo matemáticas: no dibuja ni toca la lógica del juego.
// Mundo plano en px (como siempre); la isometría vive solo aquí. Ver docs/GUIA_ESTILO_ISOMETRICO.md §2.
const ISO=(()=>{
 const TILE=32,            // px de mundo por tile (decidido con el dueño)
  HW=28,HH=14,             // semi-ancho y semi-alto del rombo en px lógicos (tile 56×28)
  LV=22,                   // px lógicos que sube cada nivel de altura
  ZOOM=1.6;                // escala visual (el dueño la quiere mayor que el cenital); un solo número para ajustarla
 const V={w:640,h:400,zoom:ZOOM,dpr:1,cw:640,ch:400}; // vista: w,h = tamaño lógico; cw,ch = px reales del canvas
 const cam={x:0,y:0,init:false};                       // cámara en px lógicos isométricos (centro de la vista)

 // mundo (px) + altura z (niveles) -> pantalla lógica (sin cámara)
 const proj=(wx,wy,z=0)=>({x:(wx-wy)/TILE*HW,y:(wx+wy)/TILE*HH-z*LV});
 // pantalla lógica -> mundo, dada la altura z del suelo en ese punto
 const unproj=(sx,sy,z=0)=>{const u=sx/HW,v=(sy+z*LV)/HH;return{x:(u+v)/2*TILE,y:(v-u)/2*TILE}};

 // vista y canvas: tamaño lógico = tamaño CSS / zoom; px reales = tamaño CSS * dpr (máx. 2)
 function resize(cssW,cssH,dpr){V.dpr=Math.min(2,Math.max(.5,dpr||1));V.w=cssW/V.zoom;V.h=cssH/V.zoom;V.cw=Math.round(cssW*V.dpr);V.ch=Math.round(cssH*V.dpr);return V}
 const scale=()=>V.zoom*V.dpr;                          // px reales por px lógico
 // cámara: sigue al objetivo con suavizado y se redondea al píxel real (sin vibraciones)
 function follow(wx,wy,z,dt){const p=proj(wx,wy,z),k=cam.init?1-Math.exp(-(dt||1/60)*9):1;cam.init=true;cam.x+=(p.x-cam.x)*k;cam.y+=(p.y-cam.y)*k;const s=scale();cam.x=Math.round(cam.x*s)/s;cam.y=Math.round(cam.y*s)/s}
 function snap(wx,wy,z){cam.init=false;follow(wx,wy,z,1)}
 // mundo -> píxel real del canvas
 function toCanvas(wx,wy,z=0){const p=proj(wx,wy,z),s=scale();return{x:Math.round((p.x-cam.x)*s+V.cw/2),y:Math.round((p.y-cam.y)*s+V.ch/2)}}
 // píxel real del canvas -> mundo. hz(wx,wy) = altura del suelo (niveles). Un LMB puede caer en varias alturas posibles
// (junto a un acantilado): se prueba cada nivel y gana el candidato más cercano a la cámara (el que se ve encima).
function toWorld(px,py,hz,levels){const s=scale(),sx=(px-V.cw/2)/s+cam.x,sy=(py-V.ch/2)/s+cam.y;if(!hz){const w=unproj(sx,sy,0);return{x:w.x,y:w.y,z:0}}
 let best=null;for(const z of levels||[0,.75,1,2]){const w=unproj(sx,sy,z);if(Math.abs((hz(w.x,w.y)||0)-z)<1e-6&&(!best||w.x+w.y>best.x+best.y))best={x:w.x,y:w.y,z}}
 if(best)return best;let z=0,w=unproj(sx,sy,0);for(let i=0;i<4;i++){z=hz(w.x,w.y)||0;w=unproj(sx,sy,z)}return{x:w.x,y:w.y,z}}
// tile bajo el puntero (para el rombo de cursor)
 const tileAt=(wx,wy)=>({tx:Math.floor(wx/TILE),ty:Math.floor(wy/TILE)});

 // orden de dibujo: menor primero. Entidad por sus pies; objeto de huella w×h (px) por su esquina más cercana a la cámara.
 const depth=(wx,wy,w=0,h=0)=>(wx+w)+(wy+h);
 const tileOrder=(a,b)=>(a.tx+a.ty)-(b.tx+b.ty)||a.tx-b.tx;
 const sortDepth=list=>list.sort((a,b)=>a.d-b.d||a.x-b.x);

 // 8 direcciones en ejes de PANTALLA -> vector de mundo normalizado (arriba de pantalla = (-1,-1) de mundo)
 function keyDir(l,r,u,d){const h=(r|0)-(l|0),v=(d|0)-(u|0),dx=h+v,dy=v-h,n=Math.hypot(dx,dy);return n?{x:dx/n,y:dy/n}:{x:0,y:0}}

 // ¿el objeto (rect en px reales del canvas, profundidad dObj) tapa al jugador (punto en px reales, profundidad dP)?
 const occludes=(r,dObj,pt,dP)=>dObj>dP&&pt.x>=r.x&&pt.x<=r.x+r.w&&pt.y>=r.y&&pt.y<=r.y+r.h;
 // rombo de un tile en px reales (para cursor y depuración): [arriba,derecha,abajo,izquierda]
 const diamond=(tx,ty,z=0)=>[[tx,ty],[tx+1,ty],[tx+1,ty+1],[tx,ty+1]].map(([a,b])=>toCanvas(a*TILE,b*TILE,z));

 return{TILE,HW,HH,LV,V,cam,proj,unproj,resize,scale,follow,snap,toCanvas,toWorld,tileAt,depth,tileOrder,sortDepth,keyDir,occludes,diamond}
})();
if(typeof module!=='undefined')module.exports=ISO;
