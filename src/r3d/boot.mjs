// NotScape · R3D · F0 · puente módulo → juego (scripts clásicos). Se carga siempre (ver index.html).
// Pone window.THREE y window.R3D, y resuelve window.R3D_READY, que bootRun() de game.js espera antes de arrancar.
// Si algo falla (sin WebGL, error), deja window.R3D=null: game.js (go()) muestra un aviso en la pantalla de carga (Fase 18: el 2D ya no existe).
// Verificado: los const globales de los scripts clásicos (ISO, TER, HERO…) se ven desde los módulos (entorno léxico global compartido).
import * as THREE from 'three';
window.THREE=THREE;
try{const {createR3D}=await import('./r3d.js');window.R3D=createR3D();console.info('[R3D] listo · three r'+THREE.REVISION);
 try{await import('./icons3d.js')}catch(e){console.warn('[ICON3D] no cargó, siguen los iconos 2D:',e)}}   // H3: iconos 3D de objetos (opcional: si falla, 2D)
catch(e){console.warn('[R3D] no pudo arrancar:',e);window.R3D=null;window.R3D_ERR=String(e&&e.message||e);const c=document.getElementById('c');if(c)c.style.background='';const g=document.getElementById('r3d');if(g)g.remove()}
finally{window.__r3dOk&&window.__r3dOk()}
