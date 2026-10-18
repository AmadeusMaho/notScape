// NotScape · R3D · F0 · puente módulo → juego (scripts clásicos). Solo se carga con ?r3d=1 (ver index.html).
// Pone window.THREE y window.R3D, y resuelve window.R3D_READY, que bootRun() de game.js espera antes de arrancar.
// Si algo falla (sin WebGL, error), deja R3D_ON=false: el juego sigue en 2D como siempre (plan B).
// Verificado: los const globales de los scripts clásicos (ISO, TER, HERO…) se ven desde los módulos (entorno léxico global compartido).
import * as THREE from 'three';
window.THREE=THREE;
try{const {createR3D}=await import('./r3d.js');window.R3D=createR3D();console.info('[R3D] listo · three r'+THREE.REVISION)}
catch(e){console.warn('[R3D] desactivado, sigue el 2D:',e);window.R3D_ON=false;window.R3D=null;const c=document.getElementById('c');if(c)c.style.background='';const g=document.getElementById('r3d');if(g)g.remove()}
finally{window.__r3dOk&&window.__r3dOk()}
