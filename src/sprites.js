/* NotScape — PANADERÍA DE SPRITES (Fase 3 de la migración). Ver AGENTS.md → "Cómo funcionan los sprites (Fase 3)".
   Las entidades (jugador, árboles, rocas, estaciones, monstruos, etiquetas) se siguen dibujando con las funciones procedurales de
   game.js (dPerson/dN/dS/dSpr/T), pero cada combinación (tipo + dirección + fotograma + equipo) se ejecuta UNA vez contra un canvas
   pequeño y después se copia con drawImage. Este módulo solo guarda la caché; la redirección de `ctx` y las sombras viven en `bk()` (game.js).
   Con ?old en la URL, SP es null y todo se dibuja como antes (fallback y punto de comparación). Sin Phaser a propósito (ver AGENTS.md). */
const SP=/[?&]old\b/.test(location.search)?null:(()=>{
 const MAX=700,C=new Map();let hit=0,miss=0,flush=0;
 // key: identifica la combinación; w,h: tamaño del canvas; ax,ay: ancla (punto del sprite que coincide con x,y de la entidad);
 // fn(g): dibuja en el contexto g y devuelve lo que game.js quiera guardar junto al sprite (sombras, altura de la etiqueta…) → s.r
 function get(key,w,h,ax,ay,fn){let s=C.get(key);if(s){hit++;return s}
  miss++;if(C.size>=MAX){C.clear();flush++} // tope de seguridad: si algún día las claves se disparan, se vacía y se vuelve a hornear a demanda
  const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  s={c,ax,ay,r:fn(g)};C.set(key,s);return s}
 function clear(prefix){if(!prefix){C.clear();return}for(const k of [...C.keys()])if(k.startsWith(prefix))C.delete(k)}
 // las etiquetas ('t|…') se hornean con la fuente VT323; si la fuente termina de cargar después, hay que rehacerlas
 if(typeof document!=='undefined'&&document.fonts&&document.fonts.addEventListener)document.fonts.addEventListener('loadingdone',()=>clear('t|'));
 return{get,clear,stats:()=>({n:C.size,hit,miss,flush})}
})();
