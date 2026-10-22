// NotScape · criaturas (datos). Fase 18 (20 oct 2026): los modelos 2D «galleta» (CRE.M, kit, biped, quad…) se RETIRARON: los enemigos, animales y jefes son 3D (src/r3d/actors3d.js).
// Quedan solo los DATOS que aun se usan: CRE.H = altura de la etiqueta (px de modelo; game.js la convierte en MD[id].h y actors3d.js la usa para el tamano 3D) y CRE.box(id) = caja de horneado (retrato 2D de reserva).
// Una criatura nueva = una fila en CRE.H (aqui), su fila en MD (game.js) y su plantilla en actors3d.js.
const CRE=(()=>{
 const BOX={w:96,h:104,ax:48,ay:84},BIG={w:150,h:160,ax:75,ay:132};
 const H={gallina:23,cordero:22,vaca:26,oveja:26,jabali:29,lobo:31,yak:30,zorro:31,lagarto:20,rana:19,slime:22,orco:46,ogro:54,esqueleto:48,oni:66,demonio:64,goblin:34,b0:77,b1:52,b2:70,b3:77,b4:89,b5:94,bandido:52,oso:36,bruja:76,gigante:80,shinobi:52,golem:72,k0:62,k1:52,k2:96,k3:98,k4:62,k5:108,gabriel:64}; // altura medida (px de modelo) = donde cuelga la etiqueta; MD[id].h = H/SPR (ver game.js)
 const MID_BOX={w:110,h:122,ax:55,ay:100},BX={bruja:MID_BOX,gigante:{w:120,h:132,ax:60,ay:108},golem:{w:120,h:128,ax:60,ay:104},k0:MID_BOX,k4:MID_BOX,k1:{w:128,h:110,ax:64,ay:88},k2:BIG,k3:BIG,k5:{w:160,h:176,ax:80,ay:146},oso:{w:104,h:104,ax:52,ay:84},b0:BIG,b1:BIG,b2:BIG,b3:BIG,b4:BIG,b5:BIG,yak:{w:110,h:104,ax:55,ay:84},lobo:{w:104,h:104,ax:52,ay:84},zorro:{w:104,h:104,ax:52,ay:84},lagarto:{w:112,h:90,ax:56,ay:72},ogro:{w:110,h:120,ax:55,ay:98},oni:{w:110,h:122,ax:55,ay:100},demonio:{w:120,h:122,ax:60,ay:100}};
 return{M:{},H,box:n=>BX[n]||BOX}})();
if(typeof module!=='undefined')module.exports={CRE};
