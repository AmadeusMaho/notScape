// NotScape · R3D · ESCALA DEL HÉROE Y LAS CRIATURAS (Lote R3D-ESCALA, 19 oct 2026). UNA sola perilla: HK = tamaño del héroe y de TODAS las criaturas respecto al que tenían
// (1 = el de antes: héroe de 1 unidad = 1 tile de alto, que se veía más grande que la iglesia). Bajarlo equivale a agrandar el mundo SIN tocar los layouts, las huellas `fp`
// ni la colisión (todo eso va en tiles/px y no cambia). game.js compensa el zoom (ZF ÷ HK) para que el héroe se siga viendo igual de grande en pantalla.
// Cambiar el valor: DEFAULT aquí Y el mismo número en `HK_DEF` de game.js (los scripts clásicos no importan módulos). Para probar sin tocar nada: `?r3d=1&hs=0.6`.
export const HK_DEF=1;
export const HK=(()=>{try{const m=/[?&]hs=([\d.]+)/.exec(location.search);return m?Math.max(.3,Math.min(1.2,+m[1]||HK_DEF)):HK_DEF}catch(e){return HK_DEF}})();
