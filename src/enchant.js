// NotScape · ENCANTAMIENTO (`en`, 28 oct 2026; sustituye a Inscripción). DATOS + lógica de las armas encantadas. Cargado ANTES de game.js; solo usa globales de game.js en tiempo de llamada.
// Un arma encantada es un OBJETO NUEVO con id `<base>~<calidad>@<efecto>` (p. ej. `sw_hierro~0@fuego`): el `~` hace que todo el código existente la trate como una variante fabricada
// (no apila, no se descubre, `tierOf/cultOfId/qv…` leen la base con split('~')[0]) y `ENCH.ensure(id)` le clona las tablas del arma base (I, SW, SB, BOW, STF, WSP, WB, LOOT).
// Efectos (tabla `D`, todo son DATOS; un efecto nuevo = una fila + su esencia): al GOLPEAR con un arma encantada hay una probabilidad (`p` %) de aplicar un estado de `STS` al enemigo (con
// enfriamiento por enemigo) y un efecto extra (`heal`). El ASPECTO en la hoja lo dibuja `src/r3d/enchfx3d.js` (shader de la hoja + partículas, por efecto: `FX` de ese archivo).
// Ingrediente: «Esencia …» (`es_<efecto>`), que suelta con poca probabilidad una criatura temática (`DROP`). Receta dinámica en la Mesa de encantamiento (estación `altar`): `ENCH.rebuild()`
// regenera `ACT.en` con TODAS las armas base de tu mochila/equipo × los efectos (se llama al abrir la mesa).
const ENCH=(()=>{
 // p = % BASE de aplicar el efecto por golpe con un arma de tier 0 (bajo a propósito); sube un 18 % del base por escalón de tier del arma (`chance()`): ~3–5 % al inicio, ~9–15 % con el mejor arma.
 // `pop` = texto grande que sale sobre el enemigo al aplicarse. El ASPECTO de la hoja de cada efecto está en src/r3d/enchfx3d.js (`FX[efecto]`).
 const D={
  sangre:  {n:'Sangrienta',  adj:'sangrienta',  col:'#e0302a',col2:'#ffb0a0',ic:'🩸',lv:30,p:3,cd:1500,sts:'bleed',dur:6000,heal:2,pop:'¡Sangrado!',ess:'Esencia sangrienta',   d:'Sangrado y roba vida: cura 2 PV al sangrar al enemigo.'},
  fuego:   {n:'Ígnea',       adj:'ígnea',       col:'#ff7a1a',col2:'#fff0a0',ic:'🔥',lv:12,p:4,cd:1500,sts:'burn',dur:4000,pop:'¡Quemadura!',ess:'Esencia de fuego',     d:'Quema al enemigo.'},
  escarcha:{n:'Gélida',      adj:'gélida',      col:'#7fd0ff',col2:'#f0fbff',ic:'❄️',lv:22,p:4,cd:1500,sts:'chill',dur:5000,pop:'¡Escarcha!',ess:'Esencia de escarcha',  d:'Escarcha al enemigo: cada carga lo frena y a 5 se congela.'},
  veneno:  {n:'Venenosa',    adj:'venenosa',    col:'#74e04a',col2:'#d6ff8a',ic:'☠️',lv:4,p:5,cd:1500,sts:'poison',dur:8000,pop:'¡Envenenado!',ess:'Esencia venenosa',     d:'Envenena al enemigo.'},
  fisico:  {n:'Afilada',     adj:'afilada',     col:'#f2e6c4',col2:'#ffffff',ic:'✨',lv:44,p:0,dmg:8,ess:'Esencia afilada',      d:'Aumenta el daño físico del arma.'},   // PASIVO (sustituye a «tierra», 28 oct): +dmg % del daño físico, ×(1+0,18/escalón de tier); sin estado
  rayo:    {n:'Tormentosa',  adj:'tormentosa',  col:'#ffe85a',col2:'#ffffff',ic:'⚡',lv:58,p:2,cd:2000,sts:'shock',dur:6000,stun:400,pop:'¡Electrizado!',ess:'Esencia de tormenta', d:'Electriza al enemigo: tu siguiente golpe puede saltar a otro cercano.'},
  // ── VERSIONES SUPERIORES (lote ESTADOS-FINALES, 28 oct 2026; aprobadas por el dueño): `sup:1`, `from` = efecto base del que se ASCIENDE (arma con él a nivel III + esencia pura),
  //    `fx` = aspecto del que parten (enchfx3d.js / item-icons.js, con potencia ENCH.vk 1,4–2 y extras propios). Su esencia es la PURA del base (`esp_<from>`).
  infernal:   {n:'Infernal',   adj:'infernal',   col:'#ffb020',col2:'#fff4c0',ic:'🔥',lv:64,p:5,cd:1500,sts:'incinerate',dur:5000,pop:'¡Incinerar!',sup:1,from:'fuego',fx:'fuego',d:'Incinera al enemigo: si muere ardiendo, el fuego salta a los cercanos.'},
  glacial:    {n:'Glacial',    adj:'glacial',    col:'#9ad8ff',col2:'#ffffff',ic:'❄️',lv:70,p:5,cd:1400,sts:'chill',n2:2,dur:5500,pop:'¡Escarcha!',sup:1,from:'escarcha',fx:'escarcha',d:'Escarcha doble: congela al enemigo en pocos golpes.'},
  toxica:     {n:'Tóxica',     adj:'tóxica',     col:'#3aff6a',col2:'#e8ff9a',ic:'🧪',lv:52,p:6,cd:1400,sts:'toxin',dur:9000,pop:'¡Toxina!',sup:1,from:'veneno',fx:'veneno',d:'Toxina: veneno más fuerte (hasta ×5) que reduce la curación.'},
  hemorragica:{n:'Hemorrágica',adj:'hemorrágica',col:'#ff1a10',col2:'#ffc0b0',ic:'🩸',lv:66,p:4,cd:1400,sts:'hemorrhage',dur:7000,heal:4,pop:'¡Hemorragia!',sup:1,from:'sangre',fx:'sangre',d:'Hemorragia (peor si el enemigo se mueve) y roba vida.'},
  tempestad:  {n:'de Tempestad',adj:'de tempestad',col:'#fff07a',col2:'#ffffff',ic:'⚡',lv:86,p:4,cd:1800,sts:'overload',dur:6000,stun:500,pop:'¡Sobrecarga!',sup:1,from:'rayo',fx:'rayo',d:'Sobrecarga: tu siguiente golpe salta a 3 enemigos y los aturde.'},
  abisal:     {n:'Abisal',     adj:'abisal',     col:'#c070ff',col2:'#ffd0ff',ic:'💀',lv:90,p:4,cd:2000,sts:'doom',sts2:'exhaust',dur:6000,pop:'¡Condena!',sup:1,from:'vacio',fx:'vacio',d:'Condena y agota al enemigo: al terminar, estalla con parte del daño recibido.'},
  implacable: {n:'Implacable', adj:'implacable', col:'#ffffff',col2:'#ffffff',ic:'✨',lv:78,p:6,cd:1200,sts:'rend',dur:8000,dmg:15,pop:'¡Desgarro!',sup:1,from:'fisico',fx:'fisico',d:'+15 % de daño físico y desgarra la armadura (hasta ×5).'},
  vacio:   {n:'del Vacío',   adj:'del Vacío',   col:'#b07aff',col2:'#e8d0ff',ic:'🌑',lv:72,p:3,cd:1800,sts:'weak',dur:6000,pop:'¡Debilitado!',ess:'Esencia del vacío',    d:'Debilita al enemigo: hace menos daño.'},
  // ── ARMAS NUEVAS (lote ENCANT-T2, 28 oct 2026; recorte aprobado por el dueño: 5 con identidad propia). `only` = clase de arma ('m' cuerpo a cuerpo, 'r' arco/ballesta, 'g' bastón/cetro).
  vampirica: {n:'Vampírica', adj:'vampírica', col:'#a0101e',col2:'#ff6a7a',ic:'🦇',lv:36,p:0,ls:4,ess:'Esencia vampírica',d:'Roba vida: cura el 4 % del daño que haces.'},
  sagrada:   {n:'Sagrada',   adj:'sagrada',   col:'#ffd860',col2:'#fffbe0',ic:'☀️',lv:48,p:6,cd:2000,sts:'judgement',dur:8000,und:25,pop:'¡Juicio!',ess:'Esencia sagrada',d:'+25 % de daño a no-muertos y demonios; a veces aplica Juicio (el próximo golpe es crítico).'},
  cazadora:  {n:'Cazadora',  adj:'cazadora',  col:'#7ad04a',col2:'#e8ffb0',ic:'🏹',lv:20,p:8,cd:2500,sts:'mark',dur:10000,dmgR:5,only:'r',pop:'¡Marcado!',ess:'Esencia cazadora',d:'Solo arcos y ballestas: +5 % de daño a distancia y marca a la presa (+20 % de daño a distancia contra ella).'},
  arcana:    {n:'Arcana',    adj:'arcana',    col:'#6a8aff',col2:'#e0e8ff',ic:'🔮',lv:28,p:6,cd:2000,sts:'manaburn',dur:6000,dmgM:8,mana:2,only:'g',pop:'¡Maná quemado!',ess:'Esencia arcana',d:'Solo bastones y cetros: +8 % de daño mágico; a veces quema el maná del enemigo y te devuelve 2 de maná.'},
  aplastante:{n:'Aplastante',adj:'aplastante',col:'#d8a060',col2:'#fff0d0',ic:'🔨',lv:40,p:6,cd:2500,stun:600,push:24,only:'m',pop:'¡Aplastado!',ess:'Esencia aplastante',d:'Cuerpo a cuerpo: a veces aturde y empuja al enemigo.'},
  // ── ARMADURA (`cat:'a'`, `slots` donde se puede poner; PASIVOS que se SUMAN por pieza ×LVB del nivel). Usan esencias elementales que ya existen (`essId`).
  espinas:     {cat:'a',n:'de Espinas',      adj:'de espinas',      col:'#a8c87a',col2:'#e8ffc8',ic:'🌵',lv:24,essId:'es_fisico',  slots:'as',      d:'Devuelve el 6 % del daño cuerpo a cuerpo que recibes (por pieza).'},
  vitalidad:   {cat:'a',n:'de Vitalidad',    adj:'de vitalidad',    col:'#e85a6a',col2:'#ffd0d8',ic:'❤️',lv:16,essId:'es_sangre',  slots:'ahlgfc',  d:'+3 PV máximos por pieza.'},
  regeneracion:{cat:'a',n:'de Regeneración', adj:'de regeneración', col:'#5ad06a',col2:'#d8ffd8',ic:'💚',lv:32,essId:'es_veneno',  slots:'ahc',     d:'Cura 1 PV cada 6 s (más rápido con más piezas).'},
  celeridad:   {cat:'a',n:'de Celeridad',    adj:'de celeridad',    col:'#7ae8ff',col2:'#ffffff',ic:'💨',lv:40,essId:'es_rayo',    slots:'f',       d:'Solo botas: +4 % de velocidad al andar y correr.'},
  resguardo:   {cat:'a',n:'de Resguardo',    adj:'de resguardo',    col:'#7ab0ff',col2:'#e0f0ff',ic:'🛡️',lv:28,essId:'es_escarcha',slots:'ahlgfsc', d:'−12 % de daño de quemaduras, venenos, sangrados y demás daño por tiempo (por pieza; tope 60 %).'},
  purificacion:{cat:'a',n:'de Purificación', adj:'de purificación', col:'#ffe9a8',col2:'#ffffff',ic:'✨',lv:52,essId:'es_fuego',   slots:'hc',      d:'−15 % de duración de todos los estados malos (por pieza; tope 60 %).'},
  // ── HERRAMIENTAS de oficio (`cat:'t'`, `tools` = habilidades: wc tala · mi minería · fi pesca · he herbolaria)
  eficiencia: {cat:'t',n:'Eficiente',  adj:'eficiente',  col:'#7ae8ff',col2:'#ffffff',ic:'⚡',lv:12,essId:'es_rayo',    tools:'wc,mi,fi,he',d:'La rueda de recolección necesita menos golpes (−17 % por nivel).'},
  fortuna:    {cat:'t',n:'Afortunada', adj:'afortunada', col:'#ffd860',col2:'#fff4c0',ic:'🍀',lv:30,essId:'es_fisico',  tools:'wc,mi,fi,he',d:'10 % de conseguir el doble (×nivel).'},
  hallazgo:   {cat:'t',n:'Buscadora',  adj:'buscadora',  col:'#c070ff',col2:'#ffd0ff',ic:'💎',lv:44,essId:'es_vacio',   tools:'mi,he,wc',   d:'+50 % de probabilidad de objetos raros y gemas (×nivel).'},
  precision:  {cat:'t',n:'Precisa',    adj:'precisa',    col:'#9ad8ff',col2:'#ffffff',ic:'🎯',lv:20,essId:'es_escarcha',tools:'wc,mi,fi,he',d:'La zona perfecta de la rueda es más ancha (+25 % por nivel).'},
  autofundido:{cat:'t',n:'Fundidora',  adj:'fundidora',  col:'#ff7a1a',col2:'#fff0a0',ic:'🔥',lv:38,essId:'es_fuego',   tools:'mi',         d:'Solo picos: 10 % (×nivel) de sacar la barra en vez de la mena.'},
  brasa:      {cat:'t',n:'de Brasa',   adj:'de brasa',   col:'#ff9a3a',col2:'#ffe0a0',ic:'🍖',lv:30,essId:'es_fuego',   tools:'fi',         d:'Solo cañas: 10 % (×nivel) de sacar el pescado ya asado.'}};
 const IDS=Object.keys(D),CAT=k=>D[k].cat||'w',WPN=IDS.filter(k=>CAT(k)==='w'),BASE=WPN.filter(k=>!D[k].sup),SUP=WPN.filter(k=>D[k].sup),ARM=IDS.filter(k=>CAT(k)==='a'),TOOL=IDS.filter(k=>CAT(k)==='t'),SUPOF={};SUP.forEach(k=>SUPOF[D[k].from]=k);
 const essOf=e=>D[e].essId||(D[e].sup?'esp_'+D[e].from:'es_'+e);   // esencia que gasta (y devuelve al desarmar) ese efecto
 // criaturas temáticas → esencia que pueden soltar (probabilidad base ~4 % + 0,15 %/nivel; élites y jefes ×3)
 const DROP={lobo:'sangre',jabali:'sangre',oso:'sangre',bandido:'sangre',banasesino:'sangre',orco:'sangre',orcocampeon:'sangre',toro:'sangre',k0:'sangre',b0:'sangre',
  lagarto:'fuego',demonio:'fuego',k5:'fuego',b5:'fuego',zorrorojo:'fuego',
  yak:'escarcha',gigante:'escarcha',k3:'escarcha',b3:'escarcha',
  rana:'veneno',bruja:'veneno',slime:'veneno',k2:'veneno',b2:'veneno',goblinsha:'veneno',
  golem:'fisico',ogro:'fisico',cabra:'fisico',b1:'fisico',k1:'fisico',
  shinobi:'rayo',oni:'rayo',k4:'rayo',b4:'rayo',goblinarq:'rayo',
  esqueleto:'sagrada',espantapajaros:'vacio',goblin:'vacio',zorro:'vacio'};
 Object.assign(DROP,{oso:'vampirica',banasesino:'vampirica',zorrorojo:'cazadora',goblinarq:'cazadora',goblinsha:'arcana',bruja:'arcana',orcocampeon:'aplastante',toro:'aplastante',b4:'sagrada'});   /* esencias de las armas nuevas */
 // NIVEL del encantamiento (Lote ENCANT-NIVELES, 28 oct 2026): el id lleva el nivel tras el efecto: `@fuego` = I, `@fuego2` = II, `@fuego3` = III (los ids antiguos sin número son nivel I).
 // El nivel sube la fuerza (`LVP` probabilidad, `LVD` duración, `LVB` pasivos/curación) y el ASPECTO (`vk`: potencia del VFX en la hoja y en el icono).
 // Las versiones SUPERIORES (Hemorragia, Toxina…, docs/PLAN_ENCANTAMIENTOS.md) serán filas propias de `D` con `sup:1`: su VFX va mucho más allá (vk 1,35–2).
 const RN=['','I','II','III'],LVP=[0,1,1.35,1.7],LVD=[0,1,1.2,1.4],LVB=[0,1,1.5,2],VK=[0,.35,.65,1],VKS=[0,1.4,1.7,2];
 const split=id=>{const s=String(id||''),i=s.indexOf('@');if(i<0)return{base:s,e:null,lv:0};const m=/^([a-z_]+?)([1-3]?)$/.exec(s.slice(i+1));return{base:s.slice(0,i),e:m?m[1]:s.slice(i+1),lv:m&&m[2]?+m[2]:1}};
 const of=id=>{const e=split(id).e;return e&&D[e]?e:null};
 const lvOf=id=>of(id)?split(id).lv:0;
 const idOf=(base,e,lv)=>base+'@'+e+(lv>1?lv:'');
 let vkOver=null;   // solo PRUEBAS: fuerza la potencia del VFX (p. ej. 1,8 para ver una versión superior)
 const vk=id=>{if(vkOver!=null)return vkOver;const e=of(id);if(!e)return 0;const l=lvOf(id);return (D[e].sup?VKS:VK)[l]};
 const ok=id=>!!(id&&typeof SW!=='undefined'&&(SW[id]||BOW[id]||STF[id]));   // arma base válida
 const isWeapon=id=>{const b=split(id).base.replace(/~0$/,'');return !!(SW[b]||BOW[b]||STF[b])};
 // clase de un objeto encantable: 'w' arma · 'a' armadura (con su ranura) · 't' herramienta (con su habilidad) · null
 const ARMS='ahlgfsc',wcls=b=>BOW[b]?'r':STF[b]?'g':'m';
 const slotOf=b=>{const L=typeof LOOT!=='undefined'&&LOOT[b];if(L)return L.s;return WB[b]?'w':SHL[b]?'s':LGL[b]?'l':GLL[b]?'g':(typeof AR!=='undefined'&&AR[b])?'a':null};
 const kindOf=id=>{const b=split(id).base.replace(/~0$/,'');if(typeof TOOLT!=='undefined'&&TOOLT[b])return{c:'t',k:TOOLT[b].k};const s=slotOf(b);if(s==='w'&&isWeapon(b))return{c:'w',k:wcls(b)};if(s&&ARMS.includes(s))return{c:'a',k:s};return null};
 const fits=(e,kd)=>{const d=D[e];if(!kd||CAT(e)!==kd.c)return false;if(kd.c==='w')return !d.only||d.only===kd.k;if(kd.c==='a')return d.slots.includes(kd.k);return d.tools.split(',').includes(kd.k)};
 // ids de las esencias y su objeto (nombre, emoji, precio)
 const init=()=>{BASE.forEach(k=>{I['es_'+k]=[D[k].ess,D[k].ic,60+D[k].lv*4];I['esp_'+k]=[D[k].ess.replace('Esencia','Esencia pura'),'💠',400+D[k].lv*12]})};   // pura: élites/jefes o refinando 5   // lo llama game.js cuando `I` ya existe
 // registra el arma encantada clonando las tablas del arma base (idempotente)
 function ensure(id){const{base,e}=split(id);if(!e||!D[e]||typeof I==='undefined')return false;if(I[id])return true;const src=base.endsWith('~0')?base.slice(0,-2):base;if(!I[src]||!fits(e,kindOf(src)))return false;
  const q=parseInt(src.split('~')[1])||0,lv=split(id).lv,sfx=' '+D[e].adj+' '+RN[lv],base0=src;
  I[id]=[I[base0][0]+sfx,I[base0][1],Math.round((I[base0][2]*2.6+180)*(1+.7*(lv-1)))];
  [SW,SB,BOW,STF,WSP,WB,SHL,LGL,GLL,typeof AR!=='undefined'?AR:null,typeof TOOLT!=='undefined'?TOOLT:null].forEach(T=>{if(T&&T[base0]!==undefined)T[id]=T[base0]});
  const L=LOOT[base0];if(L)LOOT[id]=Object.assign({},L,{r:Math.max(1+lv,L.r)});else if(CAT(e)==='w')LOOT[id]={s:'w',r:Math.max(1+lv,q),k:0,st:{}};   // armaduras y herramientas fabricadas siguen con sus tablas (sin LOOT)   // la rareza sube con el nivel: I raro, II épico, III legendario
  return true}
 // tras cargar partida: registra todo lo encantado que lleves, tengas en el banco o llevas puesto
 function sweep(){try{const mg=x=>typeof x==='string'?x.replace('@tierra','@fisico').replace(/^es_tierra$/,'es_fisico'):x;   // 28 oct: «tierra» pasó a «fisico»
  if(S.inv)S.inv=S.inv.map(mg);if(S.bank)for(const k of Object.keys(S.bank))if(mg(k)!==k){S.bank[mg(k)]=(S.bank[mg(k)]||0)+S.bank[k];delete S.bank[k]}if(S.eq)for(const k in S.eq)S.eq[k]=mg(S.eq[k])}catch(e){}
 try{const seen=new Set([...(S.inv||[]),...Object.keys(S.bank||{}),...Object.values(S.eq||{})].filter(x=>typeof x==='string'&&x.includes('@')));seen.forEach(ensure)}catch(e){}}
 const cur=()=>{try{return of(S.eq&&S.eq.w)}catch(e){return null}};
 // nivel mínimo de Encantamiento para encantar ESA arma con ese efecto: el del efecto + 2 por escalón de tier del arma
 const tierIdx=b=>{try{const t=tierOf(b.split('~')[0]),i=(TNM||[]).indexOf(t),j=(WON||[]).indexOf(t);return Math.max(0,i,j)}catch(e){return 0}};
 const needLv=(base,e)=>Math.min(97,D[e].lv+Math.round(tierIdx(base)*2.5));
 // recetas dinámicas: arma base (de la mochila, el banco y puesta) × efecto
 function rebuild(){if(typeof ACT==='undefined')return;const have=new Set();try{(S.inv||[]).forEach(x=>have.add(x));Object.keys(S.bank||{}).forEach(x=>have.add(x));if(S.eq&&S.eq.w)have.add(S.eq.w)}catch(e){}
  try{Object.values(S.eq||{}).forEach(x=>x&&have.add(x))}catch(e){}
  const out=[];have.forEach(id=>{if(!id||typeof id!=='string'||id.includes('@')||(typeof LOOT!=='undefined'&&LOOT[id]&&LOOT[id].r>=4))return;const kd=kindOf(id);if(!kd)return;
   IDS.forEach(e=>{if(D[e].sup||!fits(e,kd))return;const oid=idOf(id.includes('~')?id:id+'~0',e,1);if(!ensure(oid))return;const L=needLv(id,e),ms=3600+L*30;out.push(['Encantar '+I[id][0]+' · '+D[e].n+' I',{[id]:1,[essOf(e)]:2},oid,L,pxp(L,ms),ms])})});
  // POTENCIAR: un arma encantada de nivel I/II sube al siguiente con más esencias (nivel de Encantamiento +15 / +30)
  have.forEach(id=>{const e=of(id),l=lvOf(id);if(!e||l>=3)return;const b=split(id).base,nid=idOf(b,e,l+1);if(!ensure(nid))return;const L=Math.min(99,needLv(b,e)+15*l),ms=4200+L*35;
   out.push(['Potenciar '+I[id][0]+' → '+RN[l+1],{[id]:1,[essOf(e)]:2+l},nid,L,pxp(L,ms),ms])});
  // ASCENDER: arma con el efecto base a nivel III + 2 esencias puras → versión SUPERIOR nivel I
  have.forEach(id=>{const e=of(id);if(!e||D[e].sup||lvOf(id)<3||!SUPOF[e])return;const s=SUPOF[e],b=split(id).base,nid=idOf(b,s,1);if(!ensure(nid))return;const L=Math.min(99,needLv(b,s)),ms=6000+L*40;
   out.push(['Ascender '+I[id][0]+' → '+D[s].n,{[id]:1,['esp_'+e]:2},nid,L,pxp(L,ms)*2,ms])});
  // REFINAR: 5 esencias → 1 esencia pura (nivel del efecto superior − 10)
  BASE.forEach(e=>{if(!SUPOF[e])return;const L=Math.max(1,D[SUPOF[e]].lv-10),ms=5000;out.push(['Refinar '+D[e].ess.toLowerCase()+' pura',{['es_'+e]:5},'esp_'+e,L,pxp(L,ms),ms])});
  // DESARMAR: el arma encantada se deshace y devuelve parte de la esencia invertida (I 1 · II 2 · III 4; superiores 1/2/3 puras); pide el nivel de encantar ESA arma
  have.forEach(id=>{const e=of(id);if(!e)return;const l=lvOf(id),b=split(id).base,L=needLv(b,e),ms=3000;const r=['Desarmar '+I[id][0],{[id]:1},essOf(e),L,Math.round(pxp(L,ms)*.4),ms];r.n=D[e].sup?l:[0,1,2,4][l];out.push(r)});
  out.sort((a,b)=>a[3]-b[3]||a[0].localeCompare(b[0]));ACT.en=out}
 // arma de BOTÍN que cae ya encantada (rollLoot de game.js): efecto base al azar, nivel I (II si el botín es épico)
 function lootRoll(id,q){if(Math.random()>=[0,.15,.25,.35][q||1])return id;const e=BASE[Math.floor(Math.random()*BASE.length)],nid=idOf(id.includes('~')?id:id+'~0',e,q>=3?2:1);return ensure(nid)?nid:id}
 // ── combate: se llama desde procs() de game.js tras cada golpe del jugador que hace daño ──
 // % real por golpe del arma equipada: base × (1 + 0,18 por escalón de tier) (en armas `lw_` de botín, por su bioma)
 const tiOf=id=>{const b=split(id).base.split('~')[0],l=typeof LOOT!=='undefined'&&LOOT[b];return l?l.k*2:tierIdx(b)};
 // PASIVO del efecto `fisico`: multiplicador del daño físico (cuerpo a cuerpo y a distancia, nunca magia) = 1 + dmg % × (1 + 0,18 por escalón de tier)
 const bonus=id=>{const e=of(id);return e&&D[e].dmg?+(D[e].dmg*(1+.18*tiOf(id))*LVB[lvOf(id)]).toFixed(1):0};
 const mul=(sk,m)=>{try{const id=S.eq.w,e=of(id);if(!e)return 1;const d=D[e],b=LVB[lvOf(id)];let k=1;
  if(sk!=='mg')k*=1+bonus(id)/100;if(d.und&&m&&m.d&&typeof STS!=='undefined'&&STS.UNDEAD.has(m.d.id))k*=1+d.und*b/100;if(d.dmgR&&sk==='ra')k*=1+d.dmgR*b/100;if(d.dmgM&&sk==='mg')k*=1+d.dmgM*b/100;return k}catch(x){return 1}};
 // PASIVOS DE ARMADURA: suma de LVB[nivel] de las piezas puestas con ese encantamiento
 const arm=e=>{let t=0;try{for(const k of ARMS){const id=S.eq[k];if(id&&of(id)===e)t+=LVB[lvOf(id)]}}catch(x){}return t};
 // HERRAMIENTA de la habilidad `sk` → {e,b} (b = LVB del nivel) o null
 const tool=sk=>{try{const id=S.eq[sk],e=of(id);return e?{e,b:LVB[lvOf(id)]}:null}catch(x){return null}};
 // barra que sale de una mena (receta de Herrería que la funde sola) y plato asado de un pescado (Cocina, un ingrediente)
 const smeltOf=o=>{try{const a=(ACT.sm||[]).find(r=>r.length===6&&typeof r[2]==='string'&&r[2].startsWith('b_')&&r[1][o]&&Object.keys(r[1]).every(k=>k===o||k==='carbon'));return a&&a[2]}catch(x){return null}};
 const cookOf=f=>{try{const a=(ACT.co||[]).find(r=>r.length===6&&typeof r[2]==='string'&&r[1][f]&&Object.keys(r[1]).length===1);return a&&a[2]}catch(x){return null}};
 let lsAcc=0,rgT=0;
 // cada fotograma (swingTick): Regeneración de la armadura
 function tick(now){const r=arm('regeneracion');if(!r||typeof P==='undefined'||P.hp<=0||P.hp>=maxHp()){rgT=now;return}if(now-rgT>=6000/r){rgT=now;P.hp=Math.min(maxHp(),P.hp+1);try{splat(P.x,P.y,'+1','#2f9a3a',30)}catch(x){}}}
 const chance=id=>{const e=of(id);if(!e||!D[e].p)return 0;const b=split(id).base.split('~')[0],l=LOOT&&LOOT[b],ti=l?l.k*2:tierIdx(b);return +(D[e].p*(1+.18*ti)*LVP[lvOf(id)]).toFixed(1)};
 function proc(m,dmg,now){const e=cur();if(!e||!m)return;const d=D[e],l=lvOf(S.eq.w);
  if(d.ls&&dmg>0&&typeof P!=='undefined'){lsAcc+=dmg*d.ls*LVB[l]/100;if(lsAcc>=1){const h=Math.floor(lsAcc);lsAcc-=h;P.hp=Math.min(maxHp(),P.hp+h);try{splat(P.x,P.y,'+'+h,'#c0303a',26)}catch(x){}try{if(window.R3D&&R3D.impact)R3D.impact.drain(m)}catch(x){}}}   /* VAMPÍRICA: robo de vida acumulado */
  try{if(window.R3D&&R3D.impact)R3D.impact.touch(m,e,vk(S.eq.w))}catch(x){}   /* chispa del elemento en CADA golpe */
  if(!d.p)return;if((m.ecd||0)>now)return;if(Math.random()*100>=chance(S.eq.w))return;m.ecd=now+d.cd;
  if(d.sts&&typeof STS!=='undefined')STS.add(m,d.sts,{dur:d.dur*LVD[l],n:(d.n2||1)});if(d.mana&&typeof MN!=='undefined')MN=Math.min(mnMax(),MN+d.mana*LVB[l]);if(d.push&&typeof P!=='undefined'){const dx=m.x-P.x,dy=m.y-P.y,dl=Math.hypot(dx,dy)||1,nx=m.x+dx/dl*d.push,ny=m.y+dy/dl*d.push;if(typeof inVilla!=='function'||!inVilla(nx,ny)){m.x=nx;m.y=ny}}if(d.sts2&&typeof STS!=='undefined')STS.add(m,d.sts2,{dur:d.dur*LVD[l]});if(d.stun)m.nt=Math.max(m.nt||0,now)+d.stun*LVD[l];
  if(d.heal&&typeof P!=='undefined'){P.hp=Math.min(maxHp(),P.hp+d.heal*LVB[l]);try{splat(P.x,P.y,d.heal*LVB[l],'#2f9a3a',26)}catch(x){}}
  try{if(window.R3D&&R3D.impact)R3D.impact.burst(m,e,vk(S.eq.w));else{sp(m.x,m.y-10,d.col,16,90,70,0);sp(m.x,m.y-10,d.col2,8,50,50,0)}fText(d.ic+' '+d.pop,d.col,m.x,m.y,(m.d&&m.d.h||30)+30,'ench')}catch(x){}}   /* IMPACTO 3D (src/r3d/impact3d.js) */
 // drop de esencia al morir la criatura (lo llama kill())
 function drop(m){const d=m&&m.d,key=d&&d.id,e=key&&DROP[key];if(!e)return;const lv=(d.lv||1),p=(.04+.0015*lv)*(m.elite||/^[bk]\d/.test(String(key))?3:1);
  if(Math.random()<p&&room('es_'+e)){dropGround('es_'+e,m.x,m.y,{rare:1});toast(ic('es_'+e)+' <b>'+I['es_'+e][0]+'</b>',2500)}
  const pp=/^b\d/.test(String(key))?.25:(m.elite||/^k\d/.test(String(key)))?.08:0;if(pp&&Math.random()<pp){dropGround('esp_'+e,m.x,m.y,{rare:1});toast(ic('esp_'+e)+' <b>'+I['esp_'+e][0]+'</b>',3200)}}
 const desc=id=>{const e=of(id),rn=' '+RN[lvOf(id)];if(e&&CAT(e)!=='w')return D[e].ic+' <b>Encantamiento '+D[e].n.toLowerCase()+rn+'</b>: '+D[e].d+(lvOf(id)>1?' (×'+LVB[lvOf(id)]+' por el nivel)':'');if(e&&D[e].ls)return D[e].ic+' <b>Encantamiento '+D[e].n.toLowerCase()+rn+'</b>: cura el '+(D[e].ls*LVB[lvOf(id)])+' % del daño que haces.';if(e&&D[e].dmg)return D[e].ic+' <b>Encantamiento '+D[e].n.toLowerCase()+rn+'</b>: +'+bonus(id)+'% de daño físico.';return e?D[e].ic+' <b>Encantamiento '+D[e].n.toLowerCase()+rn+'</b>: '+D[e].d+' ('+chance(id)+'% por golpe).':null};
 return{init,smeltOf,cookOf,D,IDS,BASE,SUP,ARM,TOOL,CAT,kindOf,fits,arm,tool,tick,essOf,lootRoll,chance,bonus,mul,DROP,split,of,lvOf,idOf,vk,RN,set vkOver(v){vkOver=v},ensure,sweep,cur,rebuild,proc,drop,desc,needLv}})();
