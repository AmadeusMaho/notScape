// NotScape · REGLA DE ESCALA DE INTERFAZ POR TAMAÑO DE PANTALLA (27 oct 2026). Global `UIS`.
// Las ventanas grandes con lienzo (Alquimia y Cocina: `#alq`) se dibujan para un panel de BASE_W px de ancho; en pantallas mayores (1920×1080, ultrawide) se ampliarían muy poco, así que
// `--ui` (variable CSS en :root) = factor de escala que hace que el panel ocupe ~94 % del ancho O del alto disponible, el que se acabe antes, con suelo 1 (nunca más pequeño que el diseño) y techo MAX.
// REGLA: toda ventana nueva de gran tamaño usa `zoom:var(--ui,1)` y su ancho `min(<base>px, calc(94vw / var(--ui,1)))`; no hagas tamaños fijos en px sin pasar por aquí.
const UIS=(()=>{const BASE_W=760,BASE_H=640,MAX=2.4;
 const k=(w,h)=>Math.max(1,Math.min(MAX,Math.min((w||innerWidth)*.94/BASE_W,(h||innerHeight)*.94/BASE_H)));
 const apply=()=>{const v=k();document.documentElement.style.setProperty('--ui',v.toFixed(3));return v};
 addEventListener('resize',apply);apply();
 return{k,apply,BASE_W,BASE_H,MAX,get v(){return k()}}})();
