
const BI=BIOMES.list; // datos por bioma de src/biomes.js (F3-B): n, lv, ic, g, w, sh + pal/dec, village, routes, res, mobs, music, rvc, bossResp, bossRunes
const $=s=>document.querySelector(s),R=(a,b)=>a+Math.floor(Math.random()*(b-a+1)),fmt=n=>Math.floor(n).toLocaleString('es');
// ── MONEDA (Fase 28 · P0a, 20 oct 2026): S.coins = entero en COBRE; 100 cobre = 1 plata; 100 plata = 1 oro (10 000 cobre). Los precios y recompensas NO se repreciaron: el mismo numero que antes se llamaba «oro» ahora son cobre. ──
const COIN_P=100,COIN_O=10000,coinParts=n=>{n=Math.max(0,Math.floor(+n||0));return[Math.floor(n/COIN_O),Math.floor(n%COIN_O/COIN_P),n%COIN_P]};
const money=n=>{const[o,p,c]=coinParts(n),a=[];if(o)a.push(fmt(o)+' oro');if(p)a.push(p+' plata');if(c||!a.length)a.push(c+' cobre');return a.join(' ')};   // texto largo: toasts, descripciones
const moneyH=n=>{const[o,p,c]=coinParts(n);let h='';if(o)h+='<span class="mn mo">'+fmt(o)+'<i></i></span>';if(p)h+='<span class="mn mp">'+p+'<i></i></span>';if(c||!h)h+='<span class="mn mc">'+c+'<i></i></span>';return '<span class="mny">'+h+'</span>'};   // HTML con monedas de color: botones y mochila
const COINLOG=[],coinsPerHour=()=>{const t=Date.now(),W=600000;while(COINLOG.length&&t-COINLOG[0][0]>W)COINLOG.shift();return COINLOG.reduce((a,x)=>a+x[1],0)*6};   // cobre ganado en los ultimos 10 min × 6 (panel F4)
const SK={wc:['Tala','🪓'],mi:['Minería','⛏️'],fi:['Pesca','🎣'],co:['Cocina','🔥'],sm:['Herrería','🔨'],cr:['Artesanía','🪵'],pe:['Peletería','🧵'],he:['Herbolaria','🌿'],al:['Alquimia','⚗️'],sa:['Sastrería','🪡'],ds:['Desollar','🔪'],es:['Escultor','🪚'],jo:['Joyería','💍'],ing:['Ingeniería','⚙️'],dm:['Domar','🐴'],en:['Encantamiento','✨'],mg:['Magia','✨'],cb:['Combate','⚔️'],ra:['Arquería','🏹'],pr:['Oración','🙏']},SKL=Object.keys(SK);
// [nombre, emoji, valor, curación]
const I={logs:['Troncos','🪵',3],roble:['Troncos de roble','🪵',8],sauce:['Troncos de sauce','🌿',20],arce:['Troncos de arce','🍁',45],
cobre:['Mena de cobre','🟤',4],estano:['Mena de estaño','⚪',4],hierro:['Mena de hierro','🔩',15],carbon:['Carbón','⚫',30],mitril:['Mena de mitril','🔷',90],
camaron:['Camarones crudos','🦐',3],trucha:['Trucha cruda','🐟',15],salmon:['Salmón crudo','🍣',30],atun:['Atún crudo','🐠',55],
c_camaron:['Camarones asados','🍤',9,4],c_trucha:['Trucha','🍖',32,7],c_salmon:['Salmón','🥩',70,10],c_atun:['Atún','🍱',130,14],pan:['Pan','🍞',2,3],quemado:['Pescado quemado','💀',0],
b_bronce:['Barra de bronce','🟧',20],b_hierro:['Barra de hierro','⬜',45],b_acero:['Barra de acero','⬛',100],b_mitril:['Barra de mitril','🟦',280],
sw_bronce:['Espada de bronce','🗡️',90],sw_hierro:['Espada de hierro','🗡️',200],sw_acero:['Espada de acero','⚔️',450],sw_mitril:['Espada de mitril','⚔️',1000],
cuero:['Cuero','🟫',8],hueso:['Hueso','🦴',5],hueso_g:['Hueso grande','🦴',25],hueso_a:['Hueso antiguo','🦴',90],hueso_r:['Hueso rúnico','🦴',250],
nido:['Nido de pájaro','🪺',500],pendiente:['Pendiente de plata','💍',0],ropa_viajero:['Ropa de viajero','👕',0],of_tronco:['Ofrenda: leño sagrado','🪵',0],of_estano:['Ofrenda: lingote de estaño','🔘',0],of_espada:['Ofrenda: espada votiva','🗡️',0],of_camaron:['Ofrenda: camarón votivo','🍤',0],gema:['Gema sin cortar','💎',400],perla:['Perla gigante','🫧',600],
corona:['Corona de goblin','👑',900],antifaz:['Antifaz de bandido','🎭',1400],sombrero:['Sombrero de bruja','🎩',4000],maza_hielo:['Maza de hielo','🔨',7000],shuriken:['Shuriken dorado','⭐',12000],nucleo:['Núcleo de magma','🔥',30000],colmillo:['Colmillo de lobo','🦷',700],calavera:['Calavera antigua','☠️',1500],garrote:['Garrote de ogro','🏏',3000]};
Object.assign(I,{gelatina:['Gelatina de slime','🟢',14],paja_emb:['Paja embrujada','🌾',20],amuleto_hueso:['Amuleto de hueso','🦴',160],panuelo_carmesi:['Pañuelo carmesí','🧣',210],colmillo_campeon:['Colmillo de campeón','🦷',260]});
Object.assign(I,{cuerno_cabra:['Cuerno de cabra','🐐',60],cuerno_toro:['Cuerno de toro','🐂',420],jamon:['Jamón crudo','🍖',90],pata_conejo:['Pata de conejo','🐇',70],cola_zorro:['Cola de zorro','🦊',110]});   // botín único de la fauna de la Pradera (28 oct 2026)
Object.assign(I,{tejo:['Troncos de tejo','🌲',90],adam:['Adamantita','🟢',160],pmagma:['Pez magma crudo','🐡',110],c_magma:['Pez magma','🍲',260,20],b_adam:['Barra de adamantita','🟩',520],sw_adam:['Espada de adamantita','🔱',2400],
ar_cuero:['Armadura de cuero','🦺',60],ar_bronce:['Peto de bronce','🛡️',140],ar_hierro:['Peto de hierro','🛡️',320],ar_acero:['Peto de acero','🛡️',720],ar_mitril:['Peto de mitril','🛡️',1600],ar_adam:['Peto de adamantita','🛡️',4200],gema_p:['Gema pulida','💠',1200],cuerno:['Cuerno de demonio','😈',6000]});
Object.assign(I,{pot_xp:['Poción de sabiduría','🧪',60],pot_dmg:['Poción de fuerza','⚗️',50],pot_spd:['Poción de rapidez','💨',40]});
Object.assign(I,{carne:['Carne cruda','🥩',6],pollo:['Pollo crudo','🍗',5],huevo:['Huevo','🥚',3],pluma:['Pluma','🪶',2],grasa:['Manteca','🧈',8],carne_jab:['Carne de jabalí','🐗',18],ancas:['Ancas de rana','🐸',30],carne_yak:['Carne de yak','🦬',45],carne_lag:['Carne de lagarto de lava','🦎',80],
c_carne:['Carne asada','🍖',12,5],c_pollo:['Pollo asado','🍗',12,6],f_camaron:['Camarones fritos','🍤',24,8],f_hamb:['Hamburguesa','🍔',30,11],f_trucha:['Trucha frita','🍳',60,14],f_estofado:['Estofado de jabalí','🍲',90,20],f_salmon:['Salmón gourmet','🍱',130,22,10],f_guiso:['Guiso de ancas','🥘',150,26,14],f_yak:['Filete de yak','🥓',200,34,18],f_lagarto:['Parrilla de lagarto','🍛',380,48,30]});
const BAGS={bag_lino:6,bag_cuero:8,bag_lona:10,bag_viajero:14};   /* 22 oct 2026 · BOLSAS: el inventario sigue unificado (S.inv); base 12 ranuras + las de hasta 4 mochilas equipadas (S.bags). Las fabricará la Sastrería (Fase 7); hasta entonces se obtienen con CHEAT.give('bag_cuero'). Añadir una mochila = una fila aquí. */
Object.assign(I,{bag_lino:['Morral de lino','🎒',40],bag_cuero:['Mochila de cuero','🎒',120],bag_lona:['Mochila reforzada','🎒',320],bag_viajero:['Alforja de viajero','🎒',800]});
const bagsA=()=>{if(!Array.isArray(S.bags))S.bags=[null,null,null,null];return S.bags},bagCap=()=>bagsA().reduce((n,b)=>n+(BAGS[b]||0),0);
const POT={pot_xp:'xp',pot_dmg:'dmg',pot_spd:'spd'},cap=()=>16+bagCap()+(S.bagU||0)*4+(typeof MOUNT!=='undefined'?MOUNT.bag():0);   /* base 16 (el tutorial de la isla se queda corto con 12) */
const QITEM=new (class extends Set{has(x){return super.has(x)||/^mt_/.test(x)}})(['pendiente','ropa_viajero','of_tronco','of_estano','of_espada','of_camaron']);   /* las monturas (animales individuales, src/stable.js) tampoco se venden ni se tiran: se SUELTAN en el Establo */   /* OBJETOS DE MISIÓN: no se pueden tirar ni vender (ni arrastrar fuera). Añade aquí el id de cualquier objeto nuevo de misión. */
const eqKey=id=>{if(LOOT[id])return LOOT[id].s;if(WB[id])return'w';if(SHL[id])return's';if(LGL[id])return'l';if(GLL[id])return'g';if(AR[id])return'a';if(QVS[id])return'm';if(AMS[id]!==undefined)return'u';return null};   // en qué ranura de equipo va un objeto (null = no se equipa)
const SHOP=[['pan',10,'Cura 3 PV'],['frasco',8,'Frasco de cristal vacío (Alquimia)'],['pot_xp',200,'+50% de XP durante 3 min'],['pot_dmg',150,'Fuerza +3 (más 10% de tu nivel) durante 3 min'],['pot_spd',100,'+35% de velocidad durante 3 min'],['pot_mana',90,'Restaura 8 de maná'],['pot_mana2',300,'Restaura 25 de maná'],['pot_pr',250,'Restaura puntos de oración']];
const UP=[['merc','💰 Contrato mercantil','+10% al vender objetos a Ru',[600,1800,5000,13000,32000]],['wis','📖 Libro de sabiduría','+5% de XP en todas las skills',[500,1500,4000,10000,25000,60000]],
['luck','🍀 Amuleto de suerte','+25% de drops raros y de botín',[1000,3000,8000,20000,50000]],['crf','🔨 Mano de maestro','+12% de probabilidad de calidad superior al fabricar',[1000,3500,10000,28000,70000]],['hv','🌾 Cosecha abundante','+4% de recolectar doble',[900,3000,9000,25000,60000]],
['trv','👢 Botas de viajero','+5% de velocidad de movimiento',[400,1200,3500,9000,22000]],['vig','❤️ Vitalidad','+1 de vida máxima',[500,1500,4000,10000,25000,60000]],['dfs','🛡️ Piel curtida','+1 de defensa',[1200,4000,11000,28000,70000]],
['fzr','💪 Entrenamiento de fuerza','+1 nivel efectivo de fuerza (golpe máximo)',[1500,5000,14000,36000,90000]],['mana2','🔷 Cristal de maná','+2 de maná máximo',[800,2500,7000,18000,45000]],['mreg2','💧 Fuente de maná','+0,36 de regeneración de maná por minuto',[1500,5000,15000]],['cfg','🍳 Fogón afortunado','+4% de probabilidad del minijuego bonus de cocina',[500,1800,5500,15000]]];
const RVC=BI.map(b=>b.rvc);
const SW={sw_bronce:2,sw_hierro:4,sw_acero:6,sw_mitril:9,sw_adam:13},AR={ar_cuero:1,ar_bronce:2,ar_hierro:4,ar_acero:6,ar_mitril:9,ar_adam:13};
const SHL={},LGL={},GLL={}; // oct 2026: escudos, pantalones y guantes por tier (defensa); se rellenan en el bucle de TI
const BOW={bw_pino:1,bw_roble:3,bw_sauce:5,bw_arce:7,bw_tejo:10},STF={st_pino:1,st_roble:2,st_sauce:3,st_arce:4,st_tejo:6},WB=Object.assign({},SW,BOW,STF);
Object.assign(I,{bw_pino:['Arco de pino','🏹',150],bw_roble:['Arco de roble','🏹',320],bw_sauce:['Arco de sauce','🏹',700],bw_arce:['Arco de arce','🏹',1500],bw_tejo:['Arco de tejo','🏹',3600],
st_pino:['Bastón de pino','🪄',180],st_roble:['Bastón de roble','🪄',380],st_sauce:['Bastón de sauce','🪄',820],st_arce:['Bastón de arce','🪄',1800],st_tejo:['Bastón de tejo','🪄',4400]});
Object.assign(I,{rn_air:['Runa de aire','🌀',0],rn_earth:['Runa de tierra','🪨',0],rn_life:['Runa de vida','💚',0],rn_water:['Runa de agua','💧',0],rn_fire:['Runa de fuego','🔥',0],rn_arc:['Runa arcana','🔮',0]});
// ESTANDARIZACIÓN DE STATS (F0, 13 oct 2026): Fuerza en puntos pequeños. 1 F = FZ puntos de la escala vieja (OSRS-grande). maxHit = floor(.5+ef·(FZ+F)/(FZ·10)) (idéntico a la fórmula vieja ef·(64+SB)/640 con F=SB/8). sf() reescala un valor viejo; fs() lo muestra (entero, o 1 decimal si es una variante de calidad).
const FZ=8,sf=v=>Math.max(0,Math.round(v/FZ)),fs=v=>String(Math.round(v*10)/10).replace('.',','),MRU=.005; // MRU: 1 punto de Regen. de maná = .005 de maná/s
const SB={sw_bronce:45,sw_hierro:65,sw_acero:85,sw_mitril:100,sw_adam:120,bw_pino:35,bw_roble:52,bw_sauce:68,bw_arce:80,bw_tejo:96};
Object.assign(I,{dientorco:['Colmillo de orco','🦷',500],f_tortilla:['Tortilla de huevo','🥞',40,6,6],pot_mana:['Poción de maná menor','🔵',40],pot_mana2:['Poción de maná mayor','🟣',150]});
const MANAP={pot_mana:8,pot_mana2:25};Object.assign(I,{pot_pr:['Poción de oración','🙏',120]}); // lote B2: restaura 7 + nivel/4 puntos de oración (la tienda la vende; Alquimia, fase C, la fabricará)

const RAR=[['Común','#ffffff'],['Poco común','#3fd04a'],['Raro','#4a90ff'],['Épico','#b04aff'],['Legendario','#ff8000']],LS={w:['Arma','⚔️'],c:['Capa','🧣'],s:['Escudo','🛡️'],l:['Pantalones','👖'],g:['Guantes','🧤'],m:['Carcaj','🏹'],h:['Casco','🪖'],f:['Botas','👢'],r:['Anillo','💍'],n:['Amuleto','📿']},LK=['h','f','r','n','c','s','l','g','m'];
const LN={h:[['Gorro de cuero curtido','Capucha del Vigía','Corona de la Pradera Dorada'],['Casco de roble tallado','Yelmo del Guardabosques','Cornamenta del Rey Verde'],['Casco musgoso','Máscara del Cenagal','Cráneo del Señor del Pantano'],['Casco de escarcha','Yelmo del Ventisquero','Corona de Hielo Eterno'],['Kabuto de laca','Yelmo del Ronin','Corona del Oni Rojo'],['Casco de obsidiana','Yelmo del Magma','Corona del Abismo Ardiente']],
f:[['Botas de cuero gastado','Botas del Explorador','Botas del Viento de Prado'],['Botas de corteza','Botas del Cazador Silente','Pisadas del Gran Ciervo'],['Botas de pantano','Botas del Cenagal','Zancos del Rey Rana'],['Botas de nieve','Botas del Montañés','Botas de la Ventisca'],['Geta de madera','Tabi del Sombra','Sandalias del Viento Carmesí'],['Botas ígneas','Botas del Cráter','Pasos del Demonio']],
r:[['Anillo de cobre','Anillo del Granjero Astuto','Sello del Rancho Dorado'],['Anillo de hierro','Anillo del Lobo Gris','Sello de la Manada Alfa'],['Anillo de hueso','Anillo del Sepulturero','Sello del Rey Muerto'],['Anillo de escarcha','Anillo del Yeti','Sello del Coloso Helado'],['Anillo de jade','Anillo del Kitsune','Sello del Oni Gigante'],['Anillo de ceniza','Anillo del Dragón Menor','Sello del Señor del Fuego']],
n:[['Amuleto de plumas','Talismán del Amanecer','Amuleto del Sol de Pradera'],['Amuleto de madera','Talismán del Espíritu Verde','Corazón del Bosque Antiguo'],['Amuleto de ranas','Talismán del Fuego Fatuo','Ojo del Pantano Ancestral'],['Amuleto de hielo','Talismán de la Aurora','Lágrima de la Montaña'],['Amuleto de papel','Omamori del Templo','Perla del Dragón Dormido'],['Amuleto de brasas','Talismán del Volcán','Corazón de Magma']]};
Object.assign(LN,{c:[['Capa de viajero','Capa del Amanecer','Manto de la Pradera Dorada'],['Capa de hojas','Manto del Guardabosques','Capa del Rey Verde'],['Capa de juncos','Capa del Cenagal','Manto del Señor del Pantano'],['Capa de piel','Capa del Ventisquero','Manto de Hielo Eterno'],['Haori de lino','Haori del Ronin','Manto del Oni Rojo'],['Capa chamuscada','Capa del Cráter','Manto del Abismo Ardiente']],
s:[['Escudo de tablas','Escudo del Vigía','Égida de la Pradera Dorada'],['Escudo de corteza','Escudo del Guardabosques','Broquel del Rey Verde'],['Escudo de lodo seco','Escudo del Cenagal','Caparazón del Señor del Pantano'],['Escudo de hueso de oso','Escudo del Ventisquero','Muralla de Hielo Eterno'],['Escudo de bambú','Escudo del Ronin','Égida del Oni Rojo'],['Escudo de basalto','Escudo del Cráter','Égida del Abismo Ardiente']],
l:[['Pantalones de lana','Calzas del Vigía','Calzas de la Pradera Dorada'],['Calzas de corteza','Calzas del Guardabosques','Grebas del Rey Verde'],['Pantalones de juncos','Calzas del Cenagal','Grebas del Señor del Pantano'],['Calzas de piel','Calzas del Ventisquero','Grebas de Hielo Eterno'],['Hakama de lino','Hakama del Ronin','Hakama del Oni Rojo'],['Calzas de ceniza','Calzas del Cráter','Grebas del Abismo Ardiente']],
g:[['Guantes de lana','Guantes del Vigía','Guanteletes de la Pradera Dorada'],['Guantes de corteza','Guantes del Guardabosques','Garras del Rey Verde'],['Guantes de juncos','Guantes del Cenagal','Manoplas del Señor del Pantano'],['Mitones de piel','Guantes del Ventisquero','Guanteletes de Hielo Eterno'],['Tekko de lino','Tekko del Ronin','Garras del Oni Rojo'],['Guantes de ceniza','Guantes del Cráter','Garras del Abismo Ardiente']],
m:[['Carcaj de cuero','Carcaj del Vigía','Carcaj de la Pradera Dorada'],['Carcaj de corteza','Carcaj del Guardabosques','Carcaj del Rey Verde'],['Carcaj de juncos','Carcaj del Cenagal','Carcaj del Señor del Pantano'],['Carcaj de piel','Carcaj del Ventisquero','Carcaj de Hielo Eterno'],['Yebira de bambú','Yebira del Ronin','Yebira del Oni Rojo'],['Carcaj de ceniza','Carcaj del Cráter','Carcaj del Abismo Ardiente']]});
const PS={stone:{b:1,d:v=>'Piel de piedra: reduces en '+Math.max(1,Math.round(v))+' el daño de cada golpe que recibes.'},savant:{b:6,d:v=>'Sabiduría de batalla: +'+Math.round(v)+'% de XP de combate y magia.'},
last:{b:25,d:v=>'Segundo aliento: al bajar del 30% de vida te curas un '+Math.round(v)+'% (1 vez cada 60 s).'},swift:{b:6,d:v=>'Pies ligeros: +'+Math.round(v)+'% de velocidad de movimiento.'},
harvest:{b:8,d:v=>'Cosecha doble: '+Math.round(v)+'% de duplicar lo que recolectas.'},thorns:{b:20,d:v=>'Espinas: '+Math.round(v)+'% de reflejar 2 de daño al enemigo que te golpea.'},
life:{b:8,d:v=>'Sed de sangre: '+Math.round(v)+'% de tus golpes te curan 1 PV.'},double:{b:5,d:v=>'Furia gemela: '+Math.round(v)+'% de golpear dos veces.'},
exec:{b:40,d:v=>'Ejecutor: +'+Math.round(v)+'% de daño contra enemigos con menos del 25% de vida.'},prosp:{b:15,d:v=>'Buscatesoros: +'+Math.round(v)+'% de oro y de probabilidad de botín.'},
echo:{b:10,d:v=>'Eco arcano: '+Math.round(v)+'% de que un hechizo no gaste maná ni runas.'},siph:{b:1,d:v=>'Robaalmas: al matar un enemigo recuperas '+Math.max(1,Math.round(v))+' de maná.'}};
Object.assign(PS,{bleed:{b:12,d:v=>'Hemorragia: '+Math.round(v)+'% de provocar sangrado (3 golpes de 1 de daño).'},crit:{b:10,d:v=>'Golpe devastador: '+Math.round(v)+'% de infligir un 75% más de daño.'},stun:{b:10,d:v=>'Aturdir: '+Math.round(v)+'% de retrasar 1,2 s el próximo ataque del enemigo.'},haste:{b:5,d:v=>'Premura: ataques un '+Math.round(v)+'% más rápidos.'},frenzy:{b:8,d:v=>'Frenesí: '+Math.round(v)+'% de activar velocidad x2 durante 5 s al golpear.'},precise:{b:14,d:v=>'Golpe certero: '+Math.round(v)+'% de que un golpe cuente doble.'},lucky:{b:25,d:v=>'Hallazgo afortunado: +'+Math.round(v)+'% de probabilidad de encontrar objetos raros al recolectar.'},gsage:{b:7,d:v=>'Aprendiz veloz: +'+Math.round(v)+'% de XP de recolección.'}});
const PM={h:['stone','savant','last','stone','savant','last'],f:['swift','harvest','swift','harvest','swift','thorns'],r:['life','haste','exec','haste','crit','double'],n:['prosp','echo','siph','echo','prosp','siph'],c:['swift','savant','thorns','harvest','swift','last'],s:['stone','thorns','stone','stun','thorns','stone'],l:['stone','swift','last','stone','swift','thorns'],g:['haste','crit','double','haste','crit','double'],m:['crit','bleed','exec','double','crit','exec']},LOOT={};
LK.forEach(sl=>{for(let k=0;k<BIOMES.L;k++)for(let q=1;q<=3;q++){const m=[0,1,1.6,2.6][q],id='lt_'+k+sl+q,st={};
 if(sl==='h')st.def=Math.max(1,Math.round((1+1.2*k)*m));else if(sl==='f')st.def=Math.max(1,Math.round((.8+k)*m));
 else if(sl==='r'){st.str=Math.max(1,sf((6+8*k)*m));st.acc=Math.max(1,Math.round((1+k)*m))}else if(sl==='c'){st.def=Math.max(1,Math.round((.5+.6*k)*m));st.hp=Math.max(1,Math.round((1+k)*m))}else if(sl==='s')st.def=Math.max(1,Math.round((1.4+1.5*k)*m));else if(sl==='l')st.def=Math.max(1,Math.round((1.1+1.2*k)*m));else if(sl==='g'){st.acc=Math.max(1,Math.round((1+k)*m));st.str=Math.max(1,sf((3+4*k)*m))}else if(sl==='m')st.str=Math.max(1,sf((4+6*k)*m));else{st.mana=Math.max(1,Math.round((1+1.5*k)*m));st.mreg=Math.max(1,Math.round(.004*(1+k)*m/MRU));st.hp=Math.max(1,Math.round((1+k)*m))}
 const pa=q>=2?[{id:PM[sl][k],v:PS[PM[sl][k]].b*(1+.25*k)*(q===3?1.8:1)}]:null;if(q===3)pa.push({id:'savant',v:5*(1+.25*k)});
 LOOT[id]={s:sl,r:q,k,st,pa};I[id]=[LN[sl][k][q-1],LS[sl][1],[0,60,300,2500][q]*(k+1)]}});
Object.assign(LOOT,{lg_ring:{s:'r',r:4,k:5,st:{str:5,acc:10},pa:[{id:'exec',v:70},{id:'life',v:12},{id:'double',v:8}]},lg_helm:{s:'h',r:4,k:5,st:{def:10,hp:15},pa:[{id:'last',v:50},{id:'stone',v:3},{id:'savant',v:12}]},
 lg_boots:{s:'f',r:4,k:5,st:{def:8,hp:10},pa:[{id:'swift',v:20},{id:'thorns',v:40}]},lg_amulet:{s:'n',r:4,k:5,st:{mana:30,mreg:10,hp:20},pa:[{id:'echo',v:25},{id:'siph',v:3}]}});
Object.assign(I,{lg_ring:['Sello del Cazademonios','💍',20000],lg_helm:['Corona del Rey Caído','🪖',20000],lg_boots:['Botas del Caminante del Alba','👢',20000],lg_amulet:['Corazón del Titán','📿',20000]});
// [id, nombre, receta de barra, nv barra, nv equipo, fuerza espada, precisión espada, fuerza arco, precisión arco, defensa peto, XP barra, ms barra]
// REWORK DE TIERS (26 oct 2026, docs/MATRIZ_OFICIOS_MUNDO.md §2): 12 tiers. El estaño ya NO es tier (solo mena: ingrediente del bronce); ALBA = plata + oro (aleación nueva); INFERNITA = tier del Infierno; celestita = Cielo.
const TI=[['cobre','cobre',{cobre:1},1,1,33,1,26,1,1,13,2200],['bronce','bronce',{cobre:1,estano:1},8,10,45,3,35,3,3,26,2400],['hierro','hierro',{hierro:1},14,17,58,4,46,4,4,45,2600],
['acero','acero',{hierro:1,carbon:1},24,28,72,6,58,6,6,70,3000],['plata','plata',{plata:1},34,38,86,7,69,7,8,95,3200],['alba','alba',{plata:1,oro:1},42,46,93,8,74,8,9,105,3300],['mitril','mitril',{mitril:1,carbon:2},50,54,100,9,80,8,10,115,3400],['adam','adamantita',{adam:1,carbon:2},60,64,120,13,96,10,14,165,3800],
['runita','runita',{runita:1,carbon:2},70,74,140,16,108,12,18,215,4000],['oricalco','oricalco',{oricalco:1,carbon:3},78,83,162,20,122,14,23,270,4200],['infernita','infernita',{infernita:1,carbon:3},85,89,175,22,130,16,26,305,4300],['celestita','celestita',{celestita:1,carbon:3},92,96,188,25,138,17,29,340,4400]],TNM=TI.map(t=>t[0]);TI.forEach(t=>{t[7]=Math.round(.92*(64+t[5])-64)}); // arco ≈ 92 % de la fuerza de la espada del mismo tier (la ventaja del arco es el alcance)
const T12=a=>[a[0],a[2],a[3],a[4],a[5],Math.round((a[5]+a[6])/2),a[6],a[7],a[8],a[9],Math.round((a[9]+a[10])/2),a[10]];   // tablas numéricas de los 11 tiers antiguos (sin estaño; con alba e infernita interpolados) → 12
// [id, nombre, objeto de tronco, nivel]: el taller de Escultor se rige por la madera
const WO=[['pino','pino','logs',1],['abedul','abedul','abedul',5],['roble','roble','roble',10],['fresno','fresno','fresno',16],['sauce','sauce','sauce',26],['arce','arce','arce',36],['tejo','tejo','tejo',48],['ebano','ébano','ebano',62],['caoba','caoba','caoba',74],['baobab','baobab','baobab',84],['ceniza','ceniza infernal','ceniza',89],['mundo','Árbol del Mundo','mundo',94]],WON=WO.map(w=>w[0]),TOOLT={};
for(const o of [SW,BOW,STF,AR,SB,WB])for(const k in o)delete o[k];AR.ar_cuero=1;
{const SV=T12([40,60,90,200,450,700,1000,2400,4600,8200,14000]),AV=T12([70,100,140,320,720,1100,1600,4200,8000,14500,25000]),BV=T12([8,10,20,45,100,190,280,520,900,1500,2400]),STV8=[1,2,3,4,5,6,7,8,9,10,11,12],TV=T12([30,45,70,150,330,520,760,1800,3400,6000,10000]);
 TI.forEach((t,i)=>{const id=t[0],nm=t[1],wn=WON[i],wnm=WO[i][1];SW['sw_'+id]=t[6];SB['sw_'+id]=sf(t[5]);BOW['bw_'+wn]=t[8];SB['bw_'+wn]=sf(t[7]);STF['st_'+wn]=STV8[i];AR['ar_'+id]=t[9];SHL['sh_'+id]=Math.max(1,Math.round(t[9]*.55));LGL['lg_'+id]=Math.max(1,Math.round(t[9]*.7));GLL['gl_'+id]=Math.max(1,Math.round(t[9]*.3));
  I['b_'+id]=['Barra de '+nm,'🟧',BV[i]];I['sw_'+id]=['Espada de '+nm,'🗡️',SV[i]];I['ar_'+id]=['Peto de '+nm,'🛡️',AV[i]];I['sh_'+id]=['Escudo de '+nm,'🛡️',Math.round(AV[i]*.5)];I['lg_'+id]=['Pantalones de '+nm,'👖',Math.round(AV[i]*.6)];I['gl_'+id]=['Guantes de '+nm,'🧤',Math.round(AV[i]*.25)];I['bw_'+wn]=['Arco de '+wnm,'🏹',Math.round(SV[i]*1.6)];I['st_'+wn]=['Bastón de '+wnm,'🪄',Math.round(SV[i]*1.8)];
  I['ax_'+id]=['Hacha de '+nm,'🪓',TV[i]];I['pk_'+id]=['Pico de '+nm,'⛏️',TV[i]];I['rd_'+wn]=['Caña de '+wnm,'🎣',Math.round(TV[i]*.8)];I['sc_'+id]=['Tijeras de '+nm,'✂️',Math.round(TV[i]*.9)];
  TOOLT['ax_'+id]={k:'wc',t:i+1};TOOLT['pk_'+id]={k:'mi',t:i+1};TOOLT['rd_'+wn]={k:'fi',t:i+1};TOOLT['sc_'+id]={k:'he',t:i+1}});
 Object.assign(WB,SW,BOW,STF);I.plata=['Mena de plata','⚪',60];
 Object.assign(I,{oro:['Mena de oro','🟡',75],infernita:['Mena de infernita','🔻',470],ceniza:['Troncos de ceniza infernal','🪵',520],caoba:['Troncos de caoba','🪵',260],baobab:['Troncos de baobab','🌳',420],mundo:['Troncos del Árbol del Mundo','🌳',700],runita:['Mena de runita','🔹',240],oricalco:['Mena de oricalco','🔸',380],celestita:['Mena de celestita','💠',600],pezespada:['Pez espada crudo','🐟',150],manta:['Mantarraya cruda','🐟',210],kraken:['Kraken joven crudo','🦑',300],c_pezespada:['Pez espada asado','🍲',330,56],c_manta:['Mantarraya asada','🍲',420,70],c_kraken:['Kraken asado','🍲',560,90],carne_oso:['Carne de oso','🥩',40],hongo:['Hongos del pantano','🍄',30],carne_gig:['Costillar de gigante','🍖',90],arroz:['Arroz','🍚',60],sal_vol:['Sal volcánica','🧂',120],f_oso:['Estofado de oso','🍲',110,24],f_sopa:['Sopa de la bruja','🍵',150,32,6],f_gig:['Costillar asado','🍖',230,42],f_sushi:['Sushi de atún','🍣',300,52,8],f_pespsal:['Pez espada con sal','🐟',420,64,10],f_festin:['Festín de mantarraya','🍱',640,82,15],f_banquete:['Banquete del Kraken','🍽️',900,105,25],logs:['Troncos de pino','🪵',3],abedul:['Troncos de abedul','🪵',5],fresno:['Troncos de fresno','🪵',13],ebano:['Troncos de ébano','🪵',160],sardina:['Sardinas crudas','🐟',5],arenque:['Arenques crudos','🐟',9],lucio:['Lucio crudo','🐟',40],c_sardina:['Sardinas','🐟',14,5],c_arenque:['Arenque','🐟',22,6],c_lucio:['Lucio','🐟',80,12]})}
// ── lote C1 (13 oct 2026): sets de CUERO (ágil, clase 'r') y TÚNICA (mágica, clase 'g') por los 11 tiers ──
// Ids: ar_cu_<tier> sh_cu_ lg_cu_ gl_cu_ (cuero tachonado: cuero + 1 barra del tier como remaches) y ar_tu_<tier> sh_tu_ (orbe) lg_tu_ (faldón) gl_tu_ (guantes de hilo): tela + 1 barra del tier como hilo metálico.
// Entran en AR/SHL/LGL/GLL con el prefijo de siempre (equipar, calidades `~q`, venta y apilado funcionan solos). Defensa = la del set de malla del mismo tier × CLSF (cuero .8, túnica .6);
// a cambio llevan bonus propios en CST (cuero: Precisión; túnica: Maná y Regen. de maná), que suma `gs()`. La clase (resistencias del triángulo) sale de armCls() en prayer.js por el infijo cu_/tu_.
const CLSF={cu:.8,tu:.6},CST={};
Object.assign(I,{lana:['Lana','🧶',6],tela:['Tela','🧵',14]});
// ── lote C1b-1 (13 oct 2026): cuero y tela SIN metal. 11 cueros (uno por tier; el tier 1 sigue siendo el id `cuero` para no romper partidas) y nombres propios por clase.
// HID[i] = id del cuero del tier i · HIDN = su nombre · CUN/TEN = sufijo del nombre de las piezas de cuero / de tela. Quién suelta cada cuero: tabla HIDEOF (junto a MD). La tela sigue siendo UNA (`tela`, de lana) hasta Herbolaria/Sastrería.
const HID=TI.map((t,i)=>i?'piel_'+t[0]:'cuero'),HIDN=['Cuero curtido','Cuero tachonado','Cuero de jabalí','Cuero de lobo','Cuero de oso','Cuero de cabra montés','Cuero de yak','Cuero de lagarto','Cuero de oni','Cuero de demonio','Cuero infernal','Cuero de kraken'],
 CUN=['curtido','tachonado','de jabalí','de lobo','de oso','de cabra montés','de yak','de lagarto','de oni','de demonio','infernal','de kraken'],
 TEN=['de lino','de algodón','de fieltro','de seda','de seda lunar','de seda dorada','de terciopelo','de brocado','de seda astral','de tejido rúnico','de tejido infernal','de tejido celestial'];
// D6 (26 oct 2026): `HID[i]` pasa a ser la PIEL CRUDA (lo que sueltan las criaturas; los ids no cambian) y Peletería la CURTE en `cu_<tier>` (cuero, HIDN), que es el que usan los demás oficios.
const RAWN=['Piel cruda','Piel gruesa','Piel de jabalí','Piel de lobo','Piel de oso','Piel de cabra montés','Piel de yak','Piel de lagarto','Piel de oni','Piel de demonio','Piel infernal','Piel de kraken'];
HID.forEach((id,i)=>{const pr=T12([8,12,18,30,50,80,130,200,320,500,800])[i];I[id]=[RAWN[i],'🟫',pr];I['cu_'+TI[i][0]]=[HIDN[i],'🟫',Math.round(pr*1.8)]});
I.mj_lana=['Madeja de lana','🧶',10];   // Sastrería nv 1: lana → madeja → tela
WO.forEach(w=>{const p=Math.max(2,Math.round(((I[w[2]]||[0,0,3])[2]||3)*2.2));I['tb_'+w[0]]=['Tablón de '+w[1],'🪵',p];I['mn_'+w[0]]=['Mango de '+w[1],'🪵',Math.round(p*1.4)]});   // D6: madera lisa y mangos por madera (Artesanía)
{const AV2=T12([70,100,140,320,720,1100,1600,4200,8000,14500,25000]),NC={ar:['Jubón de cuero ','Túnica '],sh:['Rodela de cuero ','Orbe '],lg:['Calzas de cuero ','Faldón '],gl:['Guantes de cuero ','Guantes de hilo ']},EM={ar:['🦺','👘'],sh:['🛡️','🔮'],lg:['👖','👖'],gl:['🧤','🧤']},TB={ar:AR,sh:SHL,lg:LGL,gl:GLL},FM={ar:1,sh:.55,lg:.7,gl:.3},PV={ar:1,sh:.5,lg:.6,gl:.25};
 TI.forEach((t,i)=>{for(const c of ['cu','tu'])for(const p of ['ar','sh','lg','gl']){const id=p+'_'+c+'_'+t[0],j=c==='cu'?0:1;
  TB[p][id]=Math.max(1,Math.round(t[9]*FM[p]*CLSF[c]));I[id]=[NC[p][j]+(j?TEN[i]:CUN[i]),EM[p][j],Math.round(AV2[i]*PV[p]*(j?.95:.85))];
  CST[id]=c==='cu'?{acc:Math.max(1,Math.round(t[9]*FM[p]*.35))}:{mana:Math.max(1,Math.round((1+i*1.3)*FM[p])),mreg:Math.round(i*.35*FM[p])};if(!CST[id].mreg)delete CST[id].mreg}});}
// ── lote C5 (13 oct 2026, pedido del dueño): MUNICIÓN. Flechas (`fl_<tier>`, para arcos) y virotes (`vi_<tier>`, para la ballesta) por los 11 tiers, en una RANURA PROPIA de munición (`S.eq.u` = id, `S.amn` = cantidad).
// Sin munición equipada (o de otro tipo que el arma) se disparan flechas ESTÁNDAR: infinitas y sin bonus. Con munición equipada cada disparo normal gasta 1 y suma su bonus de fuerza a distancia (AMS) al golpe máximo.
// Se fabrican en el Taller (Artesanía) de 30 en 30 (OUTN) y los tiers se desbloquean con ARQUERÍA (GATE). Apilan de AMN en AMN. El carcaj (`qv_<tier>`, ranura `m`) se cose con cuero en el Banco de curtidor y da fuerza (CST).
const AMN=100,AMS={},AMK={},OUTN={},GATE={},QVS={};
TI.forEach((t,i)=>{const sbw=8+(SB['bw_'+WON[i]]||0),pw=Math.max(1,Math.round(sbw*.2)),pr=T12([1,1,2,2,3,4,5,7,9,12,16])[i];
 for(const [p,nm,k] of [['fl','Flechas','fl'],['vi','Virotes','vi']]){const id=p+'_'+t[0];I[id]=[nm+' de '+t[1],'🏹',pr];AMS[id]=pw;AMK[id]=k;OUTN[id]=30;GATE[id]=['ra',t[4]]}
 const q='qv_'+t[0];I[q]=['Carcaj de cuero '+CUN[i],'🏹',Math.round(T12([14,22,34,60,100,160,260,400,640,1000,1600])[i])];QVS[q]=1;CST[q]={str:Math.max(1,Math.round(sbw*.1))}});
// pergaminos de Inscripción: un hechizo de un solo uso sin maná ni runas
const SCI={};[['spark','Chispa'],['heal','Curación'],['stone','Piedra'],['haste','Prisa'],['skin','Piel de piedra'],['wave','Ola'],['recall','Regreso'],['wis','Sabiduría'],['fire','Llamarada'],['arcane','Explosión arcana'],['storm','Tormenta'],['gheal','Curación mayor'],['vortex','Vórtice'],['cata','Cataclismo']].forEach(([id,n],i)=>{SCI['sc_'+id]=i;I['sc_'+id]=['Pergamino de '+n,'📜',[15,40,50,60,80,110,160,220,320,500,800,1000,1500,2500][i]]});
RVC.forEach((c,k)=>{I['rv_'+k]=['Runa de viaje a '+(['la Pradera','el Bosque','el Pantano','las Cumbres','el Oriental','el Volcán'][k]||BI[k].n),'🌀',150]});
const WSP={},EQK=['h','f','r','r2','n','w','c','s','l','g','m','x','z','mt'],rr=id=>LOOT[id]?LOOT[id].r:(id&&id.includes('~')?(parseInt(id.split('~')[1])||0):0);
Object.keys(SW).forEach(k=>WSP[k]=4);Object.keys(BOW).forEach(k=>WSP[k]=4);Object.keys(STF).forEach(k=>WSP[k]=5);
{const SSB=[58,78,100,125,152,190],BSB=[48,67,91,115,140,175],SAC=[4,7,10,14,19,26],BAC=[3,6,9,12,15,18],STV=[2,4,6,8,10,12],PW={d:['bleed','double'],m:['crit','exec'],b:['stun','life'],c:['echo','siph']},
 LE=[['de cobre','de hierro','de hueso','de escarcha','de laca','de obsidiana'],['del Vigía','del Lobo Gris','del Sepulturero','del Yeti','del Kitsune','del Dragón Menor'],['de la Pradera Dorada','del Rey Verde','del Señor del Pantano','de Hielo Eterno','del Oni Rojo','del Abismo Ardiente']];
 [['d','Daga','m',3,.92,2],['m','Mandoble','m',6,.92,-2],['b','Ballesta','r',5,.92,1],['c','Cetro','g',4,0,0]].forEach(([a,nm,ty,tk,tg,ac])=>{for(let k=0;k<BIOMES.L;k++)for(let q=1;q<=3;q++){const id='lw_'+k+a+q,m=[0,1.03,1.08,1.15][q],st={};let pa=null;
  if(ty==='m'){SB[id]=sf(Math.max(0,Math.round(tg*(64+SSB[k])*(tk/4)*m-64)));SW[id]=Math.max(1,SAC[k]+ac);WB[id]=SW[id]}
  else if(ty==='r'){SB[id]=sf(Math.max(0,Math.round(tg*(64+BSB[k])*(tk/4)*m-64)));BOW[id]=Math.max(1,BAC[k]+ac);WB[id]=BOW[id]}
  else{STF[id]=Math.max(1,Math.round(STV[k]*.7+q*.5));WB[id]=STF[id];st.mana=Math.round((1+k)*q*1.5);st.mreg=Math.max(1,Math.round(.003*(1+k)*q/MRU))}
  WSP[id]=tk;if(q>=2){const p1=PW[a][0],p2=PW[a][1];pa=[{id:p1,v:PS[p1].b*(1+.25*k)*(q===3?1.8:1)}];if(q===3)pa.push({id:p2,v:PS[p2].b*(1+.25*k)})}
  LOOT[id]={s:'w',r:q,k,st,pa};I[id]=[nm+' '+LE[q-1][k],{d:'🗡️',m:'⚔️',b:'🏹',c:'🪄'}[a],[0,80,400,3000][q]*(k+1)]}})}
{const FR=[0,.3,.55,.85],TL=pre=>/^(bw_|st_|rd_)$/.test(pre)?WON:TNM,
 bump=(tbl,pre,id,q,d)=>{const L2=TL(pre),sf0=id.slice(pre.length),cm=/^(cu|tu)_/.exec(sf0),cx=cm?cm[0]:'',i=L2.indexOf(sf0.slice(cx.length)),v=tbl[id],nx=id==='ar_cuero'?tbl.ar_cobre:(i>=0&&i+1<L2.length?tbl[pre+cx+L2[i+1]]:v*1.15);return +(v+(nx-v)*FR[q]).toFixed(d)};
 [...Object.keys(SW),...Object.keys(BOW),...Object.keys(STF),...Object.keys(AR),...Object.keys(TOOLT)].concat(Object.keys(SHL),Object.keys(LGL),Object.keys(GLL)).filter(k=>!k.includes('~')&&!LOOT[k]).forEach(id=>{for(let q=1;q<=3;q++){const v=id+'~'+q;I[v]=[I[id][0],I[id][1],Math.round(I[id][2]*[1,1.4,2.2,4][q])];
  if(SW[id]){SW[v]=bump(SW,'sw_',id,q,1);SB[v]=bump(SB,'sw_',id,q,1);WSP[v]=4;WB[v]=SW[v]}else if(BOW[id]){BOW[v]=bump(BOW,'bw_',id,q,1);SB[v]=bump(SB,'bw_',id,q,1);WSP[v]=4;WB[v]=BOW[v]}
  else if(STF[id]){STF[v]=bump(STF,'st_',id,q,1);WSP[v]=5;WB[v]=STF[v]}else if(AR[id])AR[v]=bump(AR,'ar_',id,q,1);else if(SHL[id])SHL[v]=bump(SHL,'sh_',id,q,1);else if(LGL[id])LGL[v]=bump(LGL,'lg_',id,q,1);else if(GLL[id])GLL[v]=bump(GLL,'gl_',id,q,1);
  else if(TOOLT[id]){const T=TOOLT[id],P2={wc:['frenzy','gsage'],mi:['precise','lucky'],fi:['lucky','frenzy'],he:['lucky','gsage']}[T.k],pa=q>=2?[{id:P2[0],v:PS[P2[0]].b*(1+.1*T.t)*(q===3?1.5:1)}]:null;if(q===3)pa.push({id:P2[1],v:PS[P2[1]].b*(1+.1*T.t)*.8});TOOLT[v]={k:T.k,t:T.t,bq:FR[q],pa}}}})}
// lote D8: calidad de lo FABRICADO bajada (antes verde hasta 25 %, azul 7 %, épico 1 %): ahora techo verde 8 %, azul 1,2 %, épico 0,15 % (con la mejora `crf` sube un poco)
function qv(id,sk){if(LOOT[id]||!(SW[id]||BOW[id]||STF[id]||AR[id]||SHL[id]||LGL[id]||GLL[id]||TOOLT[id]||(typeof OFGEAR!=='undefined'&&OFGEAR.is(id))))return id;const l=L(sk),g=Math.min(.08,.015+l*.001),b=l<20?0:Math.min(.012,.002+(l-20)*.0002),e=l<40?0:Math.min(.0015,.0002+(l-40)*.00002),r=Math.random()/(1+.12*S.crf)/QBON,q=r<e?3:r<e+b?2:r<e+b+g?1:0;return q?id+'~'+q:id}
function gs(k){let t=0;for(const sl of EQK){const it=LOOT[S.eq[sl]];if(it&&it.st[k])t+=it.st[k]}for(const sl of['a','s','l','g','m']){const id=S.eq[sl],c=id&&CST[String(id).split('~')[0]];if(c&&c[k])t+=c[k]} // lote C1: bonus de clase de las piezas de cuero (Precisión) y túnica (Maná, Regen.)
 return t}
function pv(id){let t=0;for(const sl of EQK){const it=LOOT[S.eq[sl]];if(it&&it.pa)it.pa.forEach(p=>{if(p.id===id)t+=p.v})}return t}
// equipo visible en el sprite: escudo, piernas, guantes, peto (hombreras), yelmo (tier→cimera) y arma a la espalda
// Lote R3D-ANIM-2 · DOBLE EMPUÑE (solo visual en 3D): si en la ranura del escudo (S.eq.s) hay un arma de UNA mano (espada sw_* o daga lw_*d), sale como gear.wp2 y el
// héroe 3D pelea con un arma en cada mano. Las reglas de juego (¿se puede equipar un arma en esa ranura?, daño, velocidad) están POR DECIDIR con el dueño.
const offW=id=>id&&(SW[id]&&!/^lw_\d+[mbc]/.test(id)||/^lw_\d+d/.test(id))?id:null;
// R3D-ARMADURAS: descripción estructurada del equipo para el héroe 3D ({a:{f,t},l,g,s,h:{k,q,leg},f,c}); ar_cuero→cuero/bronce; lt_<k><slot><q> → bioma+calidad; lg_helm/lg_boots/legendarios → q4
// R3D-CULTURAS: cultura (0 Pradera · 1 Bosque · 2 Pantano · 3 Cumbres · 4 Oriental · 5 Volcán) de un objeto: tier/madera → bioma donde se mina/tala; botín lt_/lw_ = su bioma. Misma tabla que CULT_OF (src/r3d/armorcult3d.js).
const CULT_OF={cobre:0,bronce:0,hierro:1,acero:1,plata:2,alba:3,mitril:3,adam:4,runita:4,oricalco:5,infernita:10,celestita:9,ceniza:10,madera:0,cuero:0,pino:0,abedul:0,roble:0,fresno:1,sauce:1,arce:2,tejo:3,ebano:4,caoba:4,baobab:5,mundo:9},
 cultOfId=id=>{if(!id)return 0;const b=id.split('~')[0],m=/^l[tw]_(\d)/.exec(b);if(m)return +m[1];if(b==='lg_helm'||b==='lg_boots')return 5;return CULT_OF[tierOf(b)]??0};
function armorInfo(){const q=S.eq,TI=['cobre','bronce','hierro','acero','plata','alba','mitril','adam','runita','oricalco','infernita','celestita'],cl=t=>TI.includes(t)?t:t==='cuero'?'bronce':t==='madera'?'cobre':'hierro',
 fam=id=>{const m=/^(?:ar|sh|lg|gl)_(cu|tu)_/.exec(id);return m?m[1]:id==='ar_cuero'?'cu':'m'},
 piece=id=>id?{f:fam(id),t:cl(tierOf(id)),cu:cultOfId(id)}:null,
 lt=id=>{const m=/^lt_(\d)([a-z])(\d)/.exec((id||'').split('~')[0]);return m?{k:+m[1],q:+m[3]}:null};
 const o={a:piece(q.a),l:piece(q.l),g:piece(q.g),s:piece(q.s)};
 ['h','f','c'].forEach(sl=>{const id=q[sl];if(!id)return;const b=id.split('~')[0];if(b==='lg_helm'||b==='lg_boots')o[sl]={k:5,q:4,leg:1};else{const l=lt(b);o[sl]=l||{k:0,q:1}}});
 // piezas de loot en torso/piernas/guantes/escudo: tomar el bioma como familia (k%3: 0 metal · 1 cuero · 2 túnica) y tier por bioma
 [['a','a'],['l','l'],['g','g'],['s','s']].forEach(([sl])=>{const id=q[sl];const l=lt(id);if(l)o[sl]={f:['m','cu','tu'][l.k%3],t:TI[Math.min(11,l.k*2+l.q-1)],cu:l.k}});
 return o}
function gearOpts(){const q=S.eq,w=q.w,t=w?wtype():null,k=id=>id?ARC(id):null,w2=w&&t==='m'&&wKind()!=='great'?offW(q.s):null;return{wp2:w2?{t:'sword',wk:/^lw_\d+d/.test(w2)?'dagger':'sword',col:TCOL[tierOf(w2)]||'#cfd8e0',cu:cultOfId(w2)}:null,sh:w2?null:k(q.s),lg:k(q.l),gl:k(q.g),pl:q.a?1:0,cp:k(q.c),ht:q.h?(LOOT[q.h]?(LOOT[q.h].r>=3?'mitril':LOOT[q.h].r===2?'acero':''):tierOf(q.h)):'',wp:w?{t:t==='r'?'bow':t==='g'?'staff':'sword',wk:wKind(),col:t==='g'?(ORB[tierOf(w)]||'#9cf'):wColor(),cu:cultOfId(w)}:null,two:wKind()==='great'?1:0}}
/* MAGIA DESACTIVADA (21 oct 2026; decisión del dueño): la magia se REDISEÑA entera (pestaña Magia = escuelas, hechizos que aprender y árboles de habilidad; los puntos de magia desbloquean nodos, se pueden combinar escuelas).
   Con MAGIC_ON=false NO hay hechizos de ataque ni de utilidad (cast() avisa), los bastones se usan como arma CUERPO A CUERPO (wtype 'm': sube Combate, no Magia) y la pestaña Magia es un aviso. El código antiguo (SPL, autoSpell, fireSpell…) queda INERTE
   y se reescribirá; no lo reactives sin acordar el diseño nuevo con el dueño. */
const MAGIC_ON=false;
function wtype(){const w=S.eq.w;return !w||SW[w]?'m':BOW[w]?'r':MAGIC_ON?'g':'m'}
/* VELOCIDAD DE ARMA ESTILO WoW (21 oct 2026; decisión del dueño): segundos por golpe según el tipo de arma, no por «ticks». Puños y dagas 1,2 s · espadas y cetros 1,5 s · arcos y bastones 2,4 s · pesadas (mandoble, ballesta) 3,0 s.
   El daño por golpe escala con la velocidad (×seg/2,4: lo rápido pega menos) para que el DPS siga parecido al de antes. Las tablas WSP (ticks) quedan solo para compatibilidad. */
/* TIEMPO ENTRE GOLPES (22 oct 2026, decisión del dueño: bajarlo; el combate es activo, un LMB por golpe): SWSEC = segundos por ataque (daga .7, espada/cetro 1, puños 1,1, arco/bastón 1,4, mandoble/ballesta 2; antes 1,2/1,5/2/2,4/3).
   SWDMG = los valores ANTIGUOS: solo escalan el DAÑO por golpe (`spdK`), así el daño por segundo NO cambia (golpes más rápidos y más pequeños). La bola de fuego pasó de 1,5 a 1,2 s sin tocar su daño (+25 % de DPS). */
const SWSEC={fist:1.1,dagger:.7,sword:1,scepter:1,bow:1.4,staff:1.4,great:2,xbow:2},SWDMG={fist:2,dagger:1.2,sword:1.5,scepter:1.5,bow:2.4,staff:2.4,great:3,xbow:3};
const secOf=(w,T)=>{if(!w)return T.fist;const m=/^lw_\d+([dmbc])/.exec(w);if(m)return T[{d:'dagger',m:'great',b:'xbow',c:'scepter'}[m[1]]];return SW[w]?T.sword:BOW[w]?T.bow:T.staff},swingSecOf=w=>secOf(w,SWSEC),swingSec=()=>swingSecOf(S.eq.w),spdK=()=>S.eq.w?secOf(S.eq.w,SWDMG)/2.4:.4,mxs=()=>Math.max(1,Math.round(maxHit()*spdK()))
// forma del arma para la animación (lote G1, oct 2026): 'sword' (sw_*, una mano), 'dagger' (lw_*d), 'great' (lw_*m mandoble, DOS manos), 'xbow' (lw_*b ballesta), 'scepter' (lw_*c cetro), 'bow', 'staff'
function wKind(){const w=S.eq.w;if(!w)return null;const m=/^lw_\d+([dmbc])/.exec(w);if(m)return{d:'dagger',m:'great',b:'xbow',c:'scepter'}[m[1]];if(STF[w])return 'staff';const t=wtype();return t==='r'?'bow':t==='g'?'staff':'sword'}
function accFor(sk,b,m){return Math.max(.08,Math.min(.95,.6+.03*(L(sk)-m.lv)+.004*b))}
// estilos de combate (oct 2026): espada/puños → Combate · arco → Arquería · bastón → Magia. Vida, defensa y agresividad usan el MEJOR de los tres (CBL)
const WSK=()=>wtype()==='g'?'mg':wtype()==='r'?'ra':'cb',CBL=()=>Math.max(L('cb'),L('ra'),L('mg'));
function monAcc(m){return Math.max(.12,Math.min(.9,.5+.03*(m.lv-CBL())-ab()*.006))}
function hitChance(m){return Math.max(.05,Math.min(.95,(accFor(WSK(),wb()+gs('acc')+ING.scope().acc,m)+pry('acc'))*dfp(m)))}
function spAcc(m){return Math.max(.25,Math.min(.97,.8+.03*(L('mg')-m.lv)))}
function atkMs(){const k=typeof FEEL!=='undefined'?FEEL.swing:1;return Math.max(500,Math.round(swingSec()*1000*(1-Math.min(.5,pv('haste')/100))*k))}   // WoW: el tiempo de golpe sale del tipo de arma (swingSec); FEEL.swing = multiplicador de pruebas (combatlab.js)
// recolectar: [nombre,item,nivel,xp,ms] · fabricar: [nombre,{entradas},salida,nivel,xp,ms]
const ACT={
wc:[['Árbol','logs',1,25,3000],['Roble','roble',15,38,3400],['Sauce','sauce',30,68,3800],['Arce','arce',45,100,4200],['Tejo','tejo',60,150,4600]],
mi:[['Cobre','cobre',1,17,3000],['Estaño','estano',1,17,3000],['Hierro','hierro',15,35,3500],['Carbón','carbon',30,50,4000],['Mitril','mitril',45,80,4800],['Adamantita','adam',60,120,5200]],
fi:[['Camarones','camaron',1,10,3000],['Trucha','trucha',15,50,3500],['Salmón','salmon',30,70,4000],['Atún','atun',45,90,4400],['Pez magma','pmagma',60,140,4800]],
co:[['Carne asada',{carne:1},'c_carne',1,25,2000],['Camarones',{camaron:1},'c_camaron',1,30,2000],['Camarones fritos',{camaron:1,grasa:1},'f_camaron',2,55,2200],['Pollo asado',{pollo:1},'c_pollo',5,40,2000],['Tortilla de huevo',{huevo:2},'f_tortilla',6,45,2200],['Hamburguesa',{carne:1,huevo:1},'f_hamb',10,70,2400],
['Trucha',{trucha:1},'c_trucha',15,70,2200],['Trucha frita',{trucha:1,grasa:1},'f_trucha',18,95,2400],['Estofado de jabalí',{carne_jab:1,grasa:1},'f_estofado',22,130,2600],['Salmón',{salmon:1},'c_salmon',30,90,2400],['Salmón gourmet',{salmon:1,grasa:1,huevo:1},'f_salmon',33,150,2600],
['Guiso de ancas',{ancas:2,grasa:1},'f_guiso',35,180,2800],['Atún',{atun:1},'c_atun',45,120,2600],['Filete de yak',{carne_yak:1,grasa:1},'f_yak',48,230,2800],['Pez magma',{pmagma:1},'c_magma',60,160,2800],['Parrilla de lagarto',{carne_lag:1,pmagma:1},'f_lagarto',62,320,3000]],
sm:[['Barra de bronce',{cobre:1,estano:1},'b_bronce',1,20,2400],['Barra de hierro',{hierro:1},'b_hierro',15,35,2600],['Barra de acero',{hierro:1,carbon:1},'b_acero',30,55,3000],['Barra de mitril',{mitril:1,carbon:2},'b_mitril',45,90,3400],['Barra de adamantita',{adam:1,carbon:3},'b_adam',60,130,3800],
['Espada de bronce',{b_bronce:2},'sw_bronce',3,40,3200],['Espada de hierro',{b_hierro:2},'sw_hierro',20,70,3600],['Espada de acero',{b_acero:2},'sw_acero',35,120,4200],['Espada de mitril',{b_mitril:2},'sw_mitril',50,200,5000],['Espada de adamantita',{b_adam:2},'sw_adam',62,300,5600]],
cr:[['Armadura de cuero',{cuero:4},'ar_cuero',1,30,2600],['Peto de bronce',{b_bronce:3,cuero:1},'ar_bronce',8,55,3000],['Pulir gema',{gema:1},'gema_p',20,80,2400],['Peto de hierro',{b_hierro:3,cuero:2},'ar_hierro',22,95,3400],['Peto de acero',{b_acero:3,cuero:2},'ar_acero',38,150,3800],['Peto de mitril',{b_mitril:3,cuero:3},'ar_mitril',50,240,4200],['Peto de adamantita',{b_adam:3,cuero:3},'ar_adam',64,380,4800]]};
const rq=a=>a.length===5?a[2]:a[3],xv=a=>a.length===5?a[3]:a[4];
const RARE={wc:['nido',150],mi:['gema',120],fi:['perla',200]};
const TOOLS={wc:['Hacha','🪓'],mi:['Pico','⛏️'],fi:['Caña','🎣'],he:['Tijeras','✂️']},TN=['de madera','de bronce','de hierro','de acero','de mitril','de adamantita'],TM=[1.3,1,.8,.62,.48,.36];
const TNF=['de bambú','de pino','de roble','de sauce','de arce','de tejo'],tn=(k,t)=>k==='he'&&!t?'oxidadas':(k==='fi'?TNF:TN)[t];
{const BR=['','b_bronce','b_hierro','b_acero','b_mitril','b_adam'],WD=['','logs','roble','sauce','arce','tejo'],LV=[0,1,17,32,47,62];
 for(const k of['wc','mi'])for(let t=1;t<6;t++)ACT.sm.push([TOOLS[k][0]+' '+TN[t],{[BR[t]]:2,[WD[t]]:1},'tl:'+k+':'+t,LV[t],40+t*40,2800+t*500]);
 const SL=[5,20,35,50,62],BN=['pino','roble','sauce','arce','tejo'];ACT.en=[];ACT.es=[];
 for(let t=1;t<6;t++)ACT.es.push(['Caña '+TNF[t],{[WD[t]]:3,cuero:Math.ceil(t/2)},'tl:fi:'+t,LV[t],35+t*35,2600+t*400]);
 for(let t=0;t<5;t++){ACT.es.push(['Arco de '+BN[t],{[WD[t+1]]:3,cuero:2+t},'bw_'+BN[t],SL[t],60+t*60,3200+t*500]);ACT.es.push(['Bastón de '+BN[t],{[WD[t+1]]:2,[BR[t+1]]:1},'st_'+BN[t],SL[t]+3,70+t*70,3400+t*500])}}
TN.length=0;TN.push('de madera',...TI.map(t=>'de '+t[1]));TNF.length=0;TNF.push('de bambú',...WO.map(w=>'de '+w[1]));TM.length=0;for(let i=0;i<9;i++)TM.push(1);
// ── XP v2 (oct 2026): TODAS las skills llegan a 99. XPR(l) = XP/s objetivo al entrenar a nivel l; gxp/pxp derivan el XP por acción de la duración real (dur/hitAmt) para que el ritmo no dependa del número de golpes.
//   Horas objetivo (solo esa skill, mejor acción disponible): nv30 ≈0,4 h · 50 ≈1,8 · 60 ≈3,2 · 70 ≈8 · 80 ≈17 · 90 ≈33 · 99 ≈60. Se mide con /home/claude/work/meas2.py (ver AGENTS.md).
const XPA=[[1,8],[15,9],[30,13],[40,16],[50,24],[60,30],[70,32],[80,48],[90,70],[99,90]],XPR=l=>{if(l<=1)return XPA[0][1];for(let i=1;i<XPA.length;i++)if(l<=XPA[i][0]){const a=XPA[i-1],b=XPA[i];return a[1]+(b[1]-a[1])*(l-a[0])/(b[0]-a[0])}return XPA[XPA.length-1][1]};
const TLV=lv=>TI.filter(t=>t[4]<=lv).length,GPER=[3,3,3,2,2,2,1,1,1,1,1,1,1];
const gxp=lv=>{const tl=TLV(lv),L1=lv+6,amt=Math.min(1,(1+L1*.01)/3);return Math.max(4,Math.round(XPR(lv)*GPER[tl]*600*Math.ceil(1/amt)/1000))},
 pxp=(lv,ms)=>{const amt=Math.min(1,(900/ms)*(1+(lv+6)*.006));return Math.max(4,Math.round(1.1*XPR(lv)*900*Math.ceil(1/amt)/1000))};
ACT.wc=[['Pino','logs',1],['Abedul','abedul',5],['Roble','roble',10],['Fresno','fresno',16],['Sauce','sauce',26],['Arce','arce',36],['Tejo','tejo',48],['Ébano','ebano',62],['Caoba','caoba',74],['Baobab','baobab',84],['Ceniza infernal','ceniza',89],['Árbol del Mundo','mundo',94]].map(a=>[a[0],a[1],a[2],gxp(a[2]),3000+a[2]*25]);
ACT.fi=[['Camarones','camaron',1],['Sardinas','sardina',5],['Arenques','arenque',10],['Truchas','trucha',15],['Salmones','salmon',30],['Lucios','lucio',38],['Atunes','atun',45],['Pez magma','pmagma',60],['Pez espada','pezespada',72],['Mantarraya','manta',82],['Kraken joven','kraken',92]].map(a=>[a[0],a[1],a[2],gxp(a[2]),3000+a[2]*25]);
ACT.mi=[['Cobre','cobre',1],['Estaño','estano',1],['Hierro','hierro',14],['Carbón','carbon',24],['Plata','plata',34],['Mitril','mitril',50],['Adamantita','adam',60],['Runita','runita',70],['Oricalco','oricalco',78],['Celestita','celestita',92],['Oro','oro',40],['Infernita','infernita',85]].map(a=>[a[0],a[1],a[2],Math.round(gxp(a[2])*(a[1]==='carbon'?.7:1)),3000+a[2]*30]);
{const HW=['logs','logs','roble','roble','sauce','arce','arce','tejo','ebano','caoba','ceniza','mundo'],CL=[1,1,1,2,2,2,3,3,3,4,4,4],AL=[1,12,19,30,40,48,56,66,76,85,91,98],SLV=[1,8,10,15,20,25,30,40,45,60,70,75,85,99];ACT.sm=[];ACT.cr=[];ACT.pe=[];ACT.sa=[];ACT.es=[];ACT.ins=[];
 TI.forEach((t,i)=>{const id=t[0],nm=t[1],b='b_'+id,il=t[4],wd=WO[i][2],wn=WON[i],wc=3+Math.floor(i/3),E=(lv,ms)=>pxp(lv,ms);
  ACT.sm.push(['Barra de '+nm,t[2],b,t[3],E(t[3],t[11]),t[11]],['Espada de '+nm,{[b]:2},'sw_'+id,il,E(il,3000+il*45),3000+il*45],['Hacha de '+nm,{[b]:2,[HW[i]]:1},'ax_'+id,il,E(il,2800+il*40),2800+il*40],['Pico de '+nm,{[b]:2,[HW[i]]:1},'pk_'+id,il,E(il,2800+il*40),2800+il*40],['Tijeras de '+nm,{[b]:2},'sc_'+id,il,E(il,2600+il*36),2600+il*36]);
  ACT.sm.push(['Peto de '+nm,{[b]:3},'ar_'+id,AL[i],E(AL[i],2800+AL[i]*35),2800+AL[i]*35],['Pantalones de '+nm,{[b]:2},'lg_'+id,AL[i],E(AL[i],2600+AL[i]*32),2600+AL[i]*32],['Guantes de '+nm,{[b]:1},'gl_'+id,AL[i],E(AL[i],2200+AL[i]*28),2200+AL[i]*28]);ACT.sm.push(['Escudo de '+nm,{[b]:3},'sh_'+id,il,E(il,3000+il*45),3000+il*45]);
  {const n1=3+i,n2=2+i,n3=1+Math.ceil(i*.7),n4=2+Math.ceil(i*.8),tl=n=>Math.max(2,Math.ceil(n*.75)),W=(pre,ms0,k)=>[AL[i],E(AL[i],ms0+AL[i]*k),ms0+AL[i]*k]; // lote C1: sets de cuero (cuero + 1 barra de remaches) y de túnica (tela + 1 barra de hilo metálico) en Artesanía, al mismo nivel que el set de malla del tier
   [['cu','cu_'+id,x=>x],['tu','tela',tl]].forEach(([c,mat,f])=>[['ar',n1,2900,35],['lg',n2,2700,32],['gl',n3,2300,28],['sh',n4,2800,34]].forEach(([p,n,ms0,k])=>{const rid=p+'_'+c+'_'+id;(c==='cu'?ACT.pe:ACT.sa).push([I[rid][0],{[mat]:f(n)},rid].concat(W(p,ms0,k)))}))}
  {const il2=t[4],ms=2600+il2*30; // lote C5: munición (30 por crafteo: 1 barra + 1 tronco + 1 pluma; se desbloquea con Arquería) y carcaj de cuero (Banco de curtidor)
   ACT.cr.push(['Flechas de '+nm,{[b]:1,[HW[i]]:1,pluma:1},'fl_'+id,1,E(il2,ms),ms],['Virotes de '+nm,{[b]:1,[HW[i]]:1,pluma:1},'vi_'+id,1,E(il2,ms),ms]);ACT.pe.push(['Carcaj de cuero '+CUN[i],{['cu_'+id]:3+Math.ceil(i*.8)},'qv_'+id,AL[i],E(AL[i],2700+AL[i]*30),2700+AL[i]*30]);ACT.pe.push(['Curtir '+RAWN[i].toLowerCase(),{[HID[i]]:1},'cu_'+id,AL[i],E(AL[i],2200+AL[i]*25),2200+AL[i]*25])}
  {const tb='tb_'+wn,wl=WO[i][3],tms=2000+wl*20;   // D6: Artesanía = MADERA. Tablón (madera lisa) y mango por madera; arcos, bastones y cañas se hacen con tablón + cuero curtido
   ACT.cr.push(['Tablón de '+WO[i][1],{[wd]:2},tb,wl,E(wl,tms),tms],['Mango de '+WO[i][1],{[tb]:1},'mn_'+wn,wl,E(wl,tms+300),tms+300],
    ['Arco de '+WO[i][1],{[tb]:wc,['cu_'+id]:1+Math.ceil((i+1)/3)},'bw_'+wn,il,E(il,3200+il*45),3200+il*45],['Bastón de '+WO[i][1],{[tb]:wc,hueso:2},'st_'+wn,il,E(il,3400+il*45),3400+il*45],['Caña de '+WO[i][1],{[tb]:wc,['cu_'+id]:Math.ceil((i+1)/2)},'rd_'+wn,il,E(il,2600+il*35),2600+il*35])}});
 ACT.pe.unshift(['Armadura de cuero',{cu_cobre:4},'ar_cuero',1,pxp(1,2600),2600]);ACT.cr.push(['Pulir gema',{gema:1},'gema_p',20,pxp(20,2400),2400]);ACT.sa.push(['Hilar madeja de lana',{lana:2},'mj_lana',1,pxp(1,2200),2200],['Tejer tela',{mj_lana:1},'tela',1,pxp(1,2400),2400]);
 const SR=[{pluma:1,huevo:1},{pluma:1,grasa:1},{hueso:2,huevo:1},{pluma:2,huevo:1},{hueso:3,cuero:1},{ancas:2,pluma:1},{cuero:1,grasa:1,pluma:2},{cuero:2,huevo:2,pluma:2},{carne_yak:1,pluma:2},{hueso:4,cuero:2,pluma:3},{hongo:2,pluma:3,cuero:2},{hongo:3,carne_gig:1,pluma:2},{arroz:2,pluma:4,hueso:4},{sal_vol:3,pluma:6,hueso:6,cuero:3}];
 ['spark','heal','stone','haste','skin','wave','recall','wis','fire','arcane','storm','gheal','vortex','cata'].forEach((id,i)=>ACT.ins.push([I['sc_'+id][0],SR[i],'sc_'+id,SLV[i],pxp(SLV[i],2400+SLV[i]*20),2400+SLV[i]*20]));
 // cocina v2: platos hasta nv. 96 (curan hasta ~100 PV: la vida máxima llega a ~210). [nombre, ingredientes, id, nivel, ms]
 ACT.co=[['Carne asada',{carne:1},'c_carne',1,2000],['Camarones',{camaron:1},'c_camaron',1,2000],['Camarones fritos',{camaron:1,grasa:1},'f_camaron',2,2200],['Pollo asado',{pollo:1},'c_pollo',5,2000],['Sardinas',{sardina:1},'c_sardina',5,2100],['Tortilla de huevo',{huevo:2},'f_tortilla',6,2200],
  ['Hamburguesa',{carne:1,huevo:1},'f_hamb',10,2400],['Arenques',{arenque:1},'c_arenque',10,2200],['Trucha',{trucha:1},'c_trucha',15,2200],['Trucha frita',{trucha:1,grasa:1},'f_trucha',18,2400],['Estofado de jabalí',{carne_jab:1,grasa:1},'f_estofado',22,2600],['Estofado de oso',{carne_oso:1,grasa:1},'f_oso',27,2600],
  ['Salmón',{salmon:1},'c_salmon',30,2400],['Salmón gourmet',{salmon:1,grasa:1,huevo:1},'f_salmon',33,2600],['Guiso de ancas',{ancas:2,grasa:1},'f_guiso',35,2800],['Lucio',{lucio:1},'c_lucio',38,2500],['Sopa de la bruja',{hongo:2,ancas:1},'f_sopa',41,2800],['Atún',{atun:1},'c_atun',45,2600],
  ['Filete de yak',{carne_yak:1,grasa:1},'f_yak',48,2800],['Costillar de gigante',{carne_gig:1,grasa:1},'f_gig',54,3000],['Pez magma',{pmagma:1},'c_magma',60,2800],['Parrilla de lagarto',{carne_lag:1,pmagma:1},'f_lagarto',62,3000],['Sushi de atún',{atun:1,arroz:1},'f_sushi',67,3000],
  ['Pez espada',{pezespada:1},'c_pezespada',72,3000],['Pez espada con sal',{pezespada:1,sal_vol:1},'f_pespsal',77,3200],['Mantarraya',{manta:1},'c_manta',82,3200],['Festín de mantarraya',{manta:1,sal_vol:1,arroz:1},'f_festin',88,3400],['Kraken asado',{kraken:1},'c_kraken',92,3400],['Banquete del Kraken',{kraken:1,sal_vol:2,grasa:1},'f_banquete',96,3600]].map(a=>[a[0],a[1],a[2],a[3],pxp(a[3],a[4]),a[4]]);
 // ═══ ESCULTOR (es) y JOYERÍA (jo) · lote ESC-JOY (27 oct 2026; docs/MATRIZ_OFICIOS_MUNDO.md §3.4 y §3.6) ═══
 // PIEDRAS = nodos de MINERÍA (`bl_<piedra>`, índices 12–18 de ACT.mi, repartidos por bioma en biomes.js `STONE_ADD`) → Escultor (Banco de cantero, Taller): sillar `ls_`, columna/estatuilla/ídolo `ta_`.
 // GEMAS = una por bioma (índice = bioma): caen al picar (piedra 1/14, menas 1/40; `EJ.gemDrop`) en bruto `gb_` → Joyería (Banco de joyero, Herrería) las talla `gm_`; aros `eg_`, anillos `an_` (ranura r) y colgantes/amuletos `cl_` (ranura n) por METAL y por GEMA (con la pasiva de la gema). Fila nueva = una fila en la tabla.
 {const STONES=[['caliza','Caliza',1,'#d8d0b8'],['granito','Granito',14,'#8a8a92'],['arenisca','Arenisca',28,'#d4a468'],['basalto','Basalto',42,'#3c3a40'],['marmol','Mármol',56,'#ece6dc'],['obsidiana','Obsidiana',70,'#2a1e34'],['astral','Piedra astral',84,'#8a9ae0']],
   GEMS=[['cuarzo','Cuarzo','tallado',1,'#e6e2f2','savant'],['ambar','Ámbar','tallado',10,'#e8a030','harvest'],['jade','Jade','tallado',20,'#3aa86a','life'],['zafiro','Zafiro','tallado',30,'#3a6aff','echo'],['opalo','Ópalo','tallado',40,'#d8eef0','prosp'],
    ['rubi','Rubí','tallado',50,'#e02a3a','crit'],['amatista','Amatista','tallada',60,'#9a5ae0','siph'],['topacio','Topacio','tallado',70,'#f0b040','swift'],['coral','Coral','pulido',80,'#ff7a6a','thorns'],['diamante','Diamante','tallado',90,'#e8f8ff','double']],
   METALS=[['cobre','cobre',1],['bronce','bronce',10],['plata','plata',26],['oro','oro',35],['alba','alba',45],['mitril','mitril',55],['adam','adamantita',65],['runita','runita',75],['oricalco','oricalco',83],['celestita','celestita',92]],
   GM=[0,1,1,2,3,4,5,6,7,8],   // metal del aro de cada gema (el de nivel ≤ el de la gema)
   SG=[0,1,2,3,4,5,9],         // gema del ídolo de cada piedra
   lw=s=>s[0].toLowerCase()+s.slice(1),E=(lv,ms)=>pxp(Math.min(99,lv),ms),cap=l=>Math.min(97,l);ACT.jo=[];
  I.b_oro=['Barra de oro','🟨',140];ACT.jo.push(['Fundir oro',{oro:1},'b_oro',33,E(33,2600),2600]);
  STONES.forEach(([id,nm,L],si)=>{const n=lw(nm),v=Math.round(4+L*1.6);I['bl_'+id]=['Bloque de '+n,'🪨',v];I['ls_'+id]=['Sillar de '+n,'🧱',v*2+L];I['ta_columna_'+id]=['Columna de '+n,'🏛️',Math.round((v*2+L)*4)];
   I['ta_estatuilla_'+id]=['Estatuilla de '+n,'🗿',Math.round((v*2+L)*3.4)];const g=GEMS[SG[si]];I['ta_idolo_'+id]=['Ídolo de '+n+' con '+lw(g[1]),'🗿',Math.round((v*2+L)*5+g[3]*20)];
   ACT.mi.push([nm,'bl_'+id,L,Math.round(gxp(L)*.8),3000+L*30]);
   ACT.es.push(['Sillar de '+n,{['bl_'+id]:2},'ls_'+id,L,E(L,2400+L*30),2400+L*30],['Columna de '+n,{['ls_'+id]:3},'ta_columna_'+id,cap(L+4),E(L+4,3000+L*35),3000+L*35],
    ['Estatuilla de '+n,{['ls_'+id]:2},'ta_estatuilla_'+id,cap(L+8),E(L+8,3400+L*40),3400+L*40],['Ídolo de '+n,{['ls_'+id]:2,['gm_'+g[0]]:1},'ta_idolo_'+id,cap(Math.max(L,g[3])+10),E(Math.max(L,g[3])+10,3800+L*40),3800+L*40])});
  METALS.forEach(([id,nm,L],i)=>{const b='b_'+id;I['eg_'+id]=['Aro de '+nm,'⭕',Math.round(12+L*4)];I['an_'+id]=['Anillo de '+nm,'💍',Math.round(30+L*9)];I['cl_'+id]=['Colgante de '+nm,'📿',Math.round(40+L*11)];
   LOOT['an_'+id]={s:'r',r:i<5?1:2,k:0,st:{str:Math.round(1+i*1.4),acc:1+i}};LOOT['cl_'+id]={s:'n',r:i<5?1:2,k:0,st:{hp:2+i*2,mana:1+i}};
   ACT.jo.push(['Aro de '+nm,{[b]:1},'eg_'+id,L,E(L,2200+L*25),2200+L*25],['Anillo de '+nm,{['eg_'+id]:1,[b]:1},'an_'+id,cap(L+2),E(L+2,2800+L*30),2800+L*30],['Colgante de '+nm,{['eg_'+id]:2},'cl_'+id,cap(L+4),E(L+4,3000+L*30),3000+L*30])});
  GEMS.forEach(([id,nm,tl,L,c,pa],i)=>{const m=METALS[GM[i]][0],pb=PS[pa]?PS[pa].b:5,rr=i<4?2:i<8?3:4;I['gb_'+id]=[nm+' en bruto','💎',Math.round(20+L*6)];I['gm_'+id]=[nm+' '+tl,'💎',Math.round(50+L*14)];
   I['an_'+id]=['Anillo de '+lw(nm),'💍',Math.round(120+L*30)];I['cl_'+id]=['Amuleto de '+lw(nm),'📿',Math.round(160+L*38)];
   LOOT['an_'+id]={s:'r',r:rr,k:0,st:{str:Math.round(2+i*1.6),acc:2+i},pa:[{id:pa,v:+(pb*(1+.25*i)).toFixed(1)}]};LOOT['cl_'+id]={s:'n',r:rr,k:0,st:{hp:4+i*3,mana:2+i*2,mreg:Math.ceil(i/2)},pa:[{id:pa,v:+(pb*(1.2+.3*i)).toFixed(1)}]};
   ACT.jo.push(['Tallar '+lw(nm),{['gb_'+id]:1},'gm_'+id,L,E(L,2400+L*30),2400+L*30],['Anillo de '+lw(nm),{['eg_'+m]:1,['gm_'+id]:1},'an_'+id,cap(L+3),E(L+3,3200+L*35),3200+L*35],['Amuleto de '+lw(nm),{['eg_'+m]:1,['gm_'+id]:2},'cl_'+id,cap(L+6),E(L+6,3600+L*38),3600+L*38])});
  // gema del bioma al picar: piedra 1/14, mena 1/40 (la suerte y «lucky» suben la probabilidad igual que el drop raro)
  window.EJ={STONES,GEMS,METALS,gemOf:(x,y)=>{let k=0;try{k=BIOMES.at(x,y)}catch(e){}return GEMS[k]||null},
   gemDrop(i,at){const a=ACT.mi[i];if(!a||!at)return;const g=EJ.gemOf(at.x,at.y);if(!g)return;const ch=(a[1].startsWith('bl_')?1/14:1/40)*(1+.25*S.luck+tpv('mi','lucky')/100);if(Math.random()>=ch||!room('gb_'+g[0]))return;
    dropGround('gb_'+g[0],at.x,at.y,{au:1});inc('gem');log('💎 Encuentras: '+I['gb_'+g[0]][0])}}}
 [ACT.sm,ACT.cr,ACT.pe,ACT.sa,ACT.es,ACT.jo,ACT.co].forEach(a=>a.sort((x,y)=>rq(x)-rq(y)))}
const MD={goblin:{n:'Goblin',lv:4,hp:10,dmg:3,ag:1,as:2400,c:'#5ab04a',w:12,h:14,co:[2,10],dr:[['cuero',.16],['hueso',.75]],rare:['corona',64]},
lobo:{n:'Lobo',lv:12,hp:24,dmg:5,ag:1,as:1800,c:'#8a8a9a',w:18,h:12,co:[8,30],dr:[['cuero',.3],['hueso',.75]],rare:['colmillo',80]},
esqueleto:{n:'Esqueleto',lv:28,hp:42,dmg:8,ag:1,as:2400,c:'#e8e8d8',w:12,h:20,co:[30,90],dr:[['hueso',.75]],rare:['calavera',96]},
ogro:{n:'Ogro',lv:44,hp:78,dmg:13,ag:1,as:3000,c:'#a0703a',w:22,h:28,co:[100,300],dr:[['cuero',.4],['hueso',.75]],rare:['garrote',112]},
oni:{n:'Oni',lv:58,hp:100,dmg:15,ag:1,as:2400,c:'#b8403a',w:22,h:30,co:[200,500],dr:[['cuero',.4],['hueso',.75]],rare:['cuerno',120]},
zorro:{n:'Zorro espíritu',lv:50,hp:58,dmg:9,as:2400,c:'#e8a05a',w:16,h:12,co:[60,160],dr:[['carne',.75],['pluma',.3],['cuero',.3]]},
demonio:{n:'Demonio',lv:70,hp:125,dmg:19,ag:1,as:2400,c:'#c02a2a',w:22,h:30,co:[300,800],dr:[['cuero',.4],['hueso',.75]],rare:['cuerno',120]},
vaca:{n:'Vaca',lv:2,hp:8,dmg:1,as:3000,c:'#f0f0f0',w:20,h:14,co:[1,4],dr:[['carne',.75],['cuero',.3],['grasa',.22]]},
oveja:{n:'Oveja',lv:3,hp:10,dmg:1,as:3000,c:'#f1ede2',w:20,h:14,co:[1,5],dr:[['lana',.9],['lana',.45],['carne',.5],['grasa',.12]]}, // lote C1: la lana se hila en tela (Artesanía) para las túnicas
gallina:{n:'Gallina',lv:1,hp:3,dmg:0,as:2400,c:'#e8d8a8',w:10,h:10,co:[0,2],dr:[['pollo',.75],['huevo',.3],['pluma',.22]]},
// ENEMIGOS REHECHOS DE LA PRADERA (28 oct 2026; cada uno con modelo ÚNICO): goblinarq lanza flechas · goblinsha lanza orbes · espantapajaros y slime = comunes · orcocampeon y banasesino = ÉLITES
goblinarq:{n:'Goblin arquero',lv:5,hp:1,dmg:1,ag:1,as:2200,c:'#5a8a46',w:12,h:14,lh:240,co:[3,12],sk:{knife:{min:150,max:340,cd:3000,wind:700,sp:340,life:1100,f:.6,k:'arrow'}},dr:[['cuero',.2],['hueso',.7],['pluma',.45]],rare:['amuleto_hueso',60]},
goblinsha:{n:'Goblin chamán',lv:7,hp:1,dmg:1,ag:1,as:2400,c:'#6a9a40',w:12,h:16,lh:240,co:[5,20],sk:{knife:{min:120,max:300,cd:3600,wind:800,sp:230,life:1400,f:.9,k:'orb'}},dr:[['hueso',.8],['pluma',.3],['hongo',.3]],rare:['amuleto_hueso',28]},
espantapajaros:{n:'Espantapájaros embrujado',lv:8,hp:1,dmg:1,ag:1,as:2600,c:'#c8b070',w:14,h:22,lh:220,co:[4,16],dr:[['paja_emb',.8],['cuero',.2],['hueso',.2]],rare:['paja_emb',12]},
slime:{n:'Slime',lv:2,hp:1,dmg:1,ag:1,as:2600,c:'#6fd86a',w:14,h:10,co:[1,6],dr:[['gelatina',.8],['gelatina',.35]],rare:['gelatina',20]},
banasesino:{n:'Bandido asesino',lv:12,hp:1,dmg:1,ag:1,as:2000,c:'#26262e',w:13,h:26,el:1,lh:320,co:[40,140],sk:{lunge:{min:100,max:280,cd:3800,wind:380,dur:360,sp:470,f:1.2},knife:{min:140,max:330,cd:3000,wind:450,sp:360,life:1000,f:.65}},dr:[['cuero',.6],['hueso',.5],['grasa',.2]],rare:['panuelo_carmesi',8]},
orcocampeon:{n:'Orco campeón',lv:15,hp:1,dmg:1,ag:1,as:2800,c:'#566a3a',w:22,h:30,el:1,lh:320,co:[60,220],sk:{lunge:{min:130,max:300,cd:6000,wind:850,dur:520,sp:420,f:1.6}},dr:[['hueso',.9],['cuero',.7],['dientorco',.4]],rare:['colmillo_campeon',8]},
// FAUNA DE LA PRADERA (28 oct 2026; cada una con modelo ÚNICO en actors3d.js): an = animal (no cuenta como guardia de POI) · fl = HUYE del jugador (presa) · el = élite · sk = habilidades (combat.js) · lh = radio de persecución
cabra:{n:'Cabra',lv:3,hp:9,dmg:1,as:3000,c:'#cdbfa6',w:16,h:14,an:1,co:[1,5],dr:[['carne',.7],['cuero',.3],['hueso',.45],['grasa',.18]],rare:['cuerno_cabra',30]},
cerdo:{n:'Cerdo',lv:3,hp:12,dmg:1,as:3000,c:'#e9a8a0',w:20,h:12,an:1,co:[1,5],dr:[['carne',.85],['cuero',.3],['grasa',.4]],rare:['jamon',22]},
conejo:{n:'Conejo',lv:1,hp:3,dmg:0,as:2400,c:'#b59a7a',w:10,h:10,an:1,fl:1,co:[0,2],dr:[['carne',.6],['cuero',.25],['hueso',.2]],rare:['pata_conejo',34]},
caballo:{n:'Caballo salvaje',lv:5,hp:1,dmg:0,as:3000,c:'#a2623a',w:24,h:62,an:1,tm:{lv:1,xp:110},co:[1,6],dr:[['carne',.6],['cuero',.5],['hueso',.3]]},   /* DOMAR-D2: DOMABLE (`tm`): nivel de Domar necesario y XP al domarlo; huye si lo atacas */
zorrorojo:{n:'Zorro rojo',lv:7,hp:1,dmg:1,ag:1,as:2000,c:'#d8622a',w:14,h:14,an:1,lh:260,co:[2,9],sk:{lunge:{min:70,max:180,cd:4200,wind:380,dur:260,sp:390,f:1}},dr:[['carne',.45],['cuero',.5],['hueso',.4]],rare:['cola_zorro',36]},
toro:{n:'Toro bravo',lv:15,hp:1,dmg:1,ag:1,as:2600,c:'#5a3a2a',w:24,h:18,an:1,el:1,lh:300,co:[40,160],sk:{lunge:{min:150,max:360,cd:6500,wind:900,dur:600,sp:440,f:1.7}},dr:[['carne',1],['carne',.6],['cuero',.8],['hueso',.6],['grasa',.5]],rare:['cuerno_toro',10]},
cordero:{n:'Cordero de nube',lv:1,hp:4,dmg:0,as:2400,c:'#e6f1fb',w:16,h:12,co:[0,2],dr:[['lana',.6],['carne',.5]]},   // tutorial del Cielo (22 oct 2026): NEUTRAL (dmg 0, sin aggro) como la gallina
jabali:{n:'Jabalí',lv:8,hp:18,dmg:3,as:2400,c:'#6a4a3a',w:18,h:13,co:[5,15],dr:[['carne_jab',.75],['cuero',.22],['grasa',.16]]},
rana:{n:'Rana gigante',lv:20,hp:30,dmg:5,as:2400,c:'#6aaa3a',w:16,h:12,co:[15,40],dr:[['ancas',.75],['grasa',.22]]},
yak:{n:'Yak',lv:34,hp:50,dmg:8,as:3000,c:'#4a3a2a',w:24,h:18,co:[40,100],dr:[['carne_yak',.75],['cuero',.4],['grasa',.3],['lana',.55]]},
lagarto:{n:'Lagarto de lava',lv:62,hp:70,dmg:11,as:2400,c:'#d8702a',w:22,h:12,co:[100,250],dr:[['carne_lag',.75],['grasa',.3],['hueso',.22]]},
orco:{n:'Orco',lv:10,hp:26,dmg:5,ag:1,as:2400,c:'#4a7a3a',w:20,h:28,co:[10,40],dr:[['cuero',.3],['hueso',.75]],rare:['dientorco',64]},
b0:{n:'Gruk, Jefe Orco',lv:14,hp:80,dmg:8,ag:1,boss:1,as:3000,c:'#2f5a2a',w:30,h:40,co:[150,300],dr:[['cuero',.75],['hueso',.75]]},
b1:{n:'Fenrir, Lobo Alfa',lv:26,hp:140,dmg:11,ag:1,boss:1,as:2000,c:'#3a3a4a',w:34,h:22,co:[300,600],dr:[['cuero',.75],['hueso',.75]]},
b2:{n:'Rey Cienaga',lv:40,hp:210,dmg:15,ag:1,boss:1,as:2400,c:'#cfcfb8',w:18,h:34,co:[500,1000],dr:[['hueso',.75]]},
b3:{n:'Yeti Milenario',lv:54,hp:300,dmg:19,ag:1,boss:1,as:3000,c:'#e8f2ff',w:32,h:40,co:[800,1600],dr:[['cuero',.75],['hueso',.75]]},
b4:{n:'Oni Gigante',lv:66,hp:360,dmg:22,ag:1,boss:1,as:2600,c:'#a82a2a',w:34,h:46,co:[1100,2200],dr:[['cuero',.75],['hueso',.75]]},
b5:{n:'Señor del Fuego',lv:80,hp:440,dmg:26,ag:1,boss:1,as:2400,c:'#e03a1a',w:32,h:44,co:[1500,3000],dr:[['cuero',.75],['hueso',.75]]},
// ── progresión v2: 6 familias nuevas (una por bioma) + 6 capitanes (custodian el Sello del jefe). hp/dmg/lv se recalculan abajo por nivel (MS) ──
bandido:{n:'Bandido',lv:10,hp:1,dmg:1,ag:1,as:2200,lh:300,sk:{lunge:{min:90,max:240,cd:5200,wind:520,dur:420,sp:380,f:1.15},knife:{min:130,max:330,cd:3800,wind:650,sp:300,life:1150,f:.55}},c:'#6a5238',w:14,h:26,co:[12,50],dr:[['cuero',.3],['hueso',.75],['grasa',.1]],rare:['antifaz',72]},
oso:{n:'Oso pardo',lv:25,hp:1,dmg:1,as:2800,c:'#6b4a32',w:24,h:18,co:[30,90],dr:[['carne_oso',.75],['cuero',.4],['grasa',.22]]},
bruja:{n:'Bruja del pantano',lv:41,hp:1,dmg:1,ag:1,as:2600,c:'#4a2a6a',w:16,h:34,co:[80,200],dr:[['hongo',.75],['pluma',.22],['hueso',.3]],rare:['sombrero',88]},
gigante:{n:'Gigante de escarcha',lv:57,hp:1,dmg:1,ag:1,as:3200,c:'#a9c4e6',w:26,h:34,co:[200,500],dr:[['carne_gig',.75],['cuero',.4],['hueso',.75]],rare:['maza_hielo',120]},
shinobi:{n:'Shinobi',lv:73,hp:1,dmg:1,ag:1,as:1800,c:'#24242e',w:14,h:26,co:[300,700],dr:[['arroz',.4],['pluma',.4],['cuero',.3],['sal_vol',.1]],rare:['shuriken',112]},
golem:{n:'Golem de obsidiana',lv:93,hp:1,dmg:1,ag:1,as:3200,c:'#5a4e52',w:28,h:42,co:[600,1400],dr:[['sal_vol',.4],['hueso',.16],['gema',.05]],rare:['nucleo',140]},
k0:{n:'Rufo, Cabecilla Bandido',lv:14,hp:1,dmg:1,ag:1,boss:2,as:2400,c:'#8a2e2a',w:20,h:40,co:[150,320],dr:[['cuero',.75],['hueso',.75]]},
k1:{n:'Garra Parda',lv:27,hp:1,dmg:1,ag:1,boss:2,as:2600,c:'#3f2c1e',w:34,h:30,co:[350,700],dr:[['carne_oso',.75],['cuero',.75]]},
k2:{n:'Morgana, Reina Bruja',lv:44,hp:1,dmg:1,ag:1,boss:2,as:2400,c:'#2e1a48',w:22,h:56,co:[600,1100],dr:[['hongo',.75],['hueso',.75]]},
k3:{n:'Thrud, Gigante de Hielo',lv:60,hp:1,dmg:1,ag:1,boss:2,as:3000,c:'#8ab0dc',w:34,h:58,co:[900,1700],dr:[['carne_gig',.75],['cuero',.75]]},
k4:{n:'Kage, Maestro Shinobi',lv:76,hp:1,dmg:1,ag:1,boss:2,as:1800,c:'#3a1a24',w:20,h:40,co:[1300,2300],dr:[['arroz',.75],['cuero',.75]]},
k5:{n:'Coloso de Magma',lv:97,hp:1,dmg:1,ag:1,boss:2,as:3000,c:'#4a3e42',w:40,h:64,co:[1800,3200],dr:[['sal_vol',.75],['gema',.75]]}};
MD.gabriel={n:'Gabriel, el Vigía',lv:6,hp:30,dmg:3,ag:1,as:1900,c:'#d9d6cc',w:20,h:44,co:[0,0],dr:[]};   // ISLA-6: jefe del tutorial de la isla del Cielo (src/isla.js lo crea con ISLA.fight(); NO es un jefe de bioma: sin sello, runas ni respawn)
// ── lote C1b-1: CADA criatura suelta el cuero de SU tier (HID[t]); sustituye al `cuero` genérico de sus drops. Tabla editable: criatura → tier (0 = Cuero curtido … 10 = Cuero de kraken).
// Reparto por bioma (como las menas): Pradera 0-2 · Bosque 3-5 · Cumbres 6 · Oriental 7-8 · Volcán 7-10. Pantano (rana, esqueleto, bruja) y la fauna sin cuero no sueltan. Si una criatura no tenía `cuero` en su drop, se añade (.4; jefes/capitanes .75).
const HIDEOF={caballo:0,cabra:0,cerdo:0,conejo:0,zorrorojo:1,toro:1,goblin:0,vaca:0,orco:1,b0:1,bandido:1,k0:1,jabali:2,lobo:3,b1:3,oso:4,k1:4,yak:6,ogro:5,gigante:6,b3:6,k3:6,zorro:7,lagarto:7,oni:8,shinobi:8,b4:8,k4:8,demonio:10,b5:9,golem:11,k5:11};
for(const id in HIDEOF){const m=MD[id];if(!m)continue;const h=HID[HIDEOF[id]],f=m.dr.find(d=>d[0]==='cuero');if(f)f[0]=h;else m.dr.push([h,m.boss?.75:.4])}
// ── DESOLLAR (`ds`, 26 oct 2026): habilidad aparte, sin pasivas. Los ANIMALES (no humanoides) ya no sueltan su piel: dejan un CADÁVER (hasta 40 s) y con F se desuella (3 s de casteo, se interrumpe al moverte) → piel cruda del tier del animal (+1 con probabilidad ≈ nivel) y XP de `ds`. El nivel de `ds` limita qué animales (nivel del tier). Pendiente: cuchillo de desollar por tier (hoja Herrería + mango + agarre) y grasa/hueso extra.
const SKINNABLE=['caballo','vaca','cabra','cerdo','conejo','zorrorojo','toro','jabali','lobo','oso','yak','zorro','lagarto'],ALV=[1,12,19,30,40,48,56,66,76,85,91,98];
// HERBOLARIA (`he`): ACT.he sale de HERB.D (src/herbalism.js); cada hierba es el objeto `h_<id>` («Hierba cruda»; la limpia/seca llegará con Alquimia)
ACT.he=HERB.D.map(d=>[d[0],'h_'+d[1],d[2],gxp(d[2]),3000]);Object.assign(I,Object.fromEntries(HERB.D.map(d=>['h_'+d[1],[d[0],'🌿',4+Math.round(d[2]*1.1)]])));
ACT.al=[];ALQ.reg();COC.reg();ING.reg();MOUNT.reg();   // ALQUIMIA (src/alchemy.js): sin recetas fijas (se elige la mezcla); registra frasco, brebaje y las pociones pz_*
ACT.ds=SKINNABLE.filter(id=>MD[id]).map(id=>{const t=HIDEOF[id],lv=ALV[t];return[MD[id].n,HID[t],lv,gxp(lv),3000]});
function skinNear(){const now=performance.now();let b=null,bd=1e9;for(const m of M){if(!m.skin||m.skin.done||alive(m,now))continue;const d=Math.hypot(P.x-m.x,P.y-m.y);if(d<90&&d<bd){bd=d;b=m}}return b}
function skinStart(m){const now=performance.now(),a=ACT.ds.find(x=>x[0]===m.d.n);if(!a||!m.skin||m.skin.done||alive(m,now)||CAST)return false;
 if(L('ds')<a[2]){toast('🔪 Necesitas Desollar nv '+a[2]+' para este animal');return true}
 castStart('Desollando…',3000,()=>{if(!m.skin||m.skin.done)return;m.skin.done=1;const n=1+(Math.random()<.12+L('ds')*.004?1:0);for(let i=0;i<n;i++)dropGround(a[1],m.x,m.y);gain('ds',a[3]);inc('skin');m.rt=Math.min(m.rt,performance.now()+1800);log('🔪 Desuellas: '+I[a[1]][0]+(n>1?' ×'+n:''))},{e:m});return true}

// [nombre, descripción, estadística, meta, recompensa]
const Q=[['Leñador novato','Consigue 10 troncos','got:logs',10,60],['Minero aprendiz','Consigue 10 menas de cobre','got:cobre',10,60],['Pescador','Pesca 10 camarones','got:camaron',10,60],
['Cocinero','Cocina 5 camarones','make:c_camaron',5,80],['Herrero','Forja 5 barras de bronce','make:b_bronce',5,100],['Armado','Forja una espada de bronce','make:sw_bronce',1,150],
['Caza goblins','Mata 5 goblins','kill:goblin',5,120],['Lobo solitario','Mata 8 lobos','kill:lobo',8,400],['Maestro minero','Llega a nivel 20 de Minería','lvl:mi',20,500],
['Huesos duros','Mata 10 esqueletos','kill:esqueleto',10,1200],['Aventurero','Nivel total 150','tot',150,800],['Suertudo','Consigue un drop raro','rare',1,1000],
['Acaudalado','Gana 50 de plata','coins',5000,1500],['Cazaogros','Mata 5 ogros','kill:ogro',5,3000],
['Explorador','Llega al Bosque','bio',2,200],['Montañista','Llega a las Cumbres','bio',4,800],['Viajero del Oriente','Llega al Oriental','bio',5,1800],['Fuego del volcán','Llega al Volcán','bio',6,2500],['Aprendiz de mago','Lanza 10 hechizos','cast',10,200],
['Artesano','Crea una armadura de cuero','make:ar_cuero',1,150],['Corredor','Corre 1.000 casillas','run',1000,400],['Matademonios','Mata 5 demonios','kill:demonio',5,8000],['Manitas','Fabrica un hacha de hierro','make:ax_hierro',1,200],['Pico de acero','Fabrica un pico de acero','make:pk_acero',1,500],['Caña de tejo','Fabrica una caña de tejo','make:rd_tejo',1,1500],['Herramientas','Fabrica un hacha de cobre','make:ax_cobre',1,100],['Primera receta','Cocina camarones fritos','make:f_camaron',1,150],['Ganadero','Mata 10 vacas','kill:vaca',10,200],['Gran chef','Cocina 10 platos perfectos','perfect',10,600],['Coleccionista','Descubre 25 objetos','disc',25,500],['Gran colección','Descubre 50 objetos','disc',50,2000],['Enciclopedia','Descubre 60 objetos','disc',60,6000],['Escriba','Inscribe 3 pergaminos de Chispa','make:sc_spark',3,150],['Primer botín','Consigue un objeto poco común (verde)','loot:1',1,200],['Afortunado','Consigue un objeto raro (azul)','loot:2',1,1500],['Leyenda viva','Consigue un objeto épico (morado)','loot:3',1,10000],['Hechicero','Lanza 50 hechizos','cast',50,800],
['Bandido de la Pradera','Mata 15 bandidos','kill:bandido',15,500],['Cazaosos','Mata 15 osos pardos','kill:oso',15,2000],['Quema brujas','Mata 15 brujas','kill:bruja',15,4000],['Rompehielos','Mata 10 gigantes','kill:gigante',10,8000],['Sombra vencida','Mata 10 shinobis','kill:shinobi',10,15000],['Corazón de piedra','Mata 10 golems','kill:golem',10,30000],
['Rompe-sellos','Derrota a los 6 capitanes','caps',6,20000],['Maestría en tala','Llega a nivel 75 de Tala','lvl:wc',75,20000],['Maestría en minería','Llega a nivel 75 de Minería','lvl:mi',75,20000],['Maestría en pesca','Llega a nivel 75 de Pesca','lvl:fi',75,20000],
['Veterano','Nivel total 500','tot',500,10000],['Élite','Nivel total 800','tot',800,40000],['Maestro absoluto','Nivel total 1188 (99 en todo)','tot',1188,500000],['Gran chef 99','Llega a nivel 99 de Cocina','lvl:co',99,100000],['Herrero legendario','Llega a nivel 99 de Herrería','lvl:sm',99,100000],['Archimago','Llega a nivel 99 de Magia','lvl:mg',99,100000]];


const TCOL={abedul:'#d8d0b0',fresno:'#b09a6a',ebano:'#3a3a3a',cobre:'#b8623a',estano:'#cfd4dc',alba:'#f1e6c4',infernita:'#b8301c',oro:'#e8c24a',ceniza:'#5a4a44',plata:'#e8e8f0',bronce:'#c8742a',hierro:'#9a9aa8',acero:'#cfd8e0',mitril:'#4a7aff',adam:'#3adf6a',madera:'#8a6a3a',cuero:'#8a5a2a',pino:'#a0703a',roble:'#7a4a22',sauce:'#7a9a4a',arce:'#c8652a',tejo:'#8a4aaa',caoba:'#8a3a2a',baobab:'#b08a52',mundo:'#6ad08a',runita:'#3ad0d8',oricalco:'#e89a3a',celestita:'#c8a0ff'},ORB={alba:'#fe9',infernita:'#f55',ceniza:'#f95',pino:'#8cf',abedul:'#cfe',roble:'#9f9',fresno:'#7fd',sauce:'#6fd',arce:'#fa6',tejo:'#e6f',ebano:'#f6a',cobre:'#fa8',estano:'#cde',bronce:'#fb6',hierro:'#9cf',acero:'#8ef',plata:'#eef',mitril:'#6af',adam:'#6f9',caoba:'#f88',baobab:'#fc8',mundo:'#8fe',runita:'#6ef',oricalco:'#fb6',celestita:'#caf'},TT=['madera','cobre','bronce','hierro','acero','plata','alba','mitril','adam','runita','oricalco','infernita','celestita'],tierOf=id=>{const p=id.split('_');let t=p[1]||'';if((t==='cu'||t==='tu')&&p[2])t=p[2];return t.split('~')[0]},HMX=(a,b,t)=>{const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),A=p(a),B=p(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')},
 CCOL=id=>{const m=/^(?:ar|sh|lg|gl)_(cu|tu)_/.exec(id||'');if(!m)return null;const t=TCOL[tierOf(id)];return t&&t.length===7?(m[1]==='cu'?HMX('#8a5a2a',t,.3):HMX('#cfc8e8',t,.5)):null}, // lote C1: cuero = marrón teñido por el tier; túnica = tela clara teñida por el tier
 LTC=['#c8742a','#9a9aa8','#cfd8e0','#4a7aff','#d83a3a','#3adf6a'],ARC=id=>CCOL(id)||TCOL[tierOf(id)]||(LOOT[id]?LTC[LOOT[id].k]||'#9a9aa8':'#c0392b');
const OREC={oro:'#e8c24a',infernita:'#b8301c',plata:'#e8e8f0',cobre:'#c8742a',estano:'#e8e8f8',hierro:'#a0502a',carbon:'#222',mitril:'#4a7aff',adam:'#3adf6a',runita:'#3ad0d8',oricalco:'#e89a3a',celestita:'#c8a0ff'},LOGC={ceniza:'#5a4a44',abedul:'#d8d0b0',fresno:'#b09a6a',ebano:'#2a2a2a',logs:'#8a5a2a',roble:'#7a4a22',sauce:'#6a8a3a',arce:'#c8652a',tejo:'#7a3a8a',caoba:'#8a3a2a',baobab:'#b08a52',mundo:'#6ad08a'},ICM={};
function mkIcon(id){const c=document.createElement('canvas');c.width=c.height=16;const g=c.getContext('2d'),r=(col,x,y,w,h)=>{g.fillStyle=col;g.fillRect(x,y,w||1,h||1)},col=TCOL[tierOf(id)]||'#aaa';
 if(id.startsWith('sw_')){for(let i=0;i<9;i++){r(col,5+i,11-i,2,2);r('#ffffff88',6+i,11-i,1,1)}r('#d8c070',3,9,5,2);r('#6b4a2a',2,12,2,3)}
 else if(id.startsWith('sh_')){r(col,4,3,8,8);r(col,5,11,6,2);r(col,6,13,4,1);r('#ffffff55',5,4,2,6);r('#d8c070',7,6,2,2)}
 else if(id.startsWith('lg_')){r(col,4,3,8,4);r(col,4,7,3,7);r(col,9,7,3,7);r('#00000044',7,7,2,6);r('#ffffff55',5,4,2,2)}
 else if(id.startsWith('gl_')){r(col,4,6,7,7);r(col,4,3,2,4);r(col,7,3,2,3);r(col,10,4,2,3);r(col,2,8,3,3);r('#ffffff55',5,7,2,3)}
 else if(id.startsWith('ar_')){r(col,4,4,8,9);r(col,2,4,3,4);r(col,11,4,3,4);r('#00000055',7,4,2,2);r('#00000044',4,11,8,1);r('#ffffff55',5,5,2,5)}
 else if(/^(ax_|pk_|rd_)/.test(id)){const kk=id.slice(0,2),c2=TCOL[tierOf(id)]||'#aaa';for(let i=0;i<10;i++)r('#8a5a2a',3+i,13-i,1,1);
  if(kk==='ax'){r(c2,9,2,5,5);r('#ffffff88',13,3,1,3)}else if(kk==='pk'){r(c2,6,2,8,2);r(c2,6,2,2,4);r(c2,12,2,2,4)}else{r('#cfe8ff',12,5,1,8);r('#e33',11,13,3,2)}}
 else if(id.startsWith('bw_')){for(let i=0;i<12;i++)r(col,5+Math.round(4*Math.sin(i/11*Math.PI)),2+i,2,1);r('#ddd',5,2,1,12)}else if(id.startsWith('st_')){for(let i=0;i<11;i++)r('#8a5a2a',3+i,14-i,1,1);r(ORB[tierOf(id)]||'#9cf',10,1,4,4);r('#ffffff88',11,2,1,1)}else if(id.startsWith('b_')){r('#00000055',2,11,12,2);r(col,2,6,12,5);r('#ffffff66',3,6,10,2);r('#00000033',2,10,12,1)}
 else if(OREC[id]){r('#777',3,6,10,7);r('#999',4,4,8,3);r(OREC[id],5,7,2,2);r(OREC[id],9,6,2,2);r(OREC[id],7,10,2,2)}
 else if(LOGC[id]){r(LOGC[id],2,6,12,6);r('#00000033',2,10,12,2);r('#e0c090',2,6,2,6);r('#e0c090',12,6,2,6)}
 return c.toDataURL()}
const ic=id=>I[id]?'<img class="ic" data-i3="'+id+'" src="'+ITEMICON.url(id)+'">':'';ITEMICON.tier=tierOf;   // iconos pintados (src/item-icons.js) para TODOS los objetos
// Atributos de casilla estilo WoW (oct 2026): color = el de la ESCALA DE RAREZA (`RAR`) según el grado = máx(rareza, grado del tier: plata/mitril azul, adamantita/runita púrpura, oricalco/celestita naranja); NUNCA el color del metal; aura = color del propio icono (pociones, gemas, runas…); grado 0–4 = intensidad del marco/halo (CSS `[data-g]` en hud-susurro.css).
const sfx=id=>{if(!id)return'';const r=rr(id),ee=typeof ENCH!=='undefined'&&ENCH.of(id),au=ee?ENCH.D[ee].col:ITEMICON.aura(id),g=Math.min(4,ITEMICON.grade(id)),col=g>=1?RAR[g][1]:au;if(!col)return'';return` data-g="${g}" data-r="${r||0}"${ee?` data-en="${ee}"`:''} style="--rc:${col};--ac:${au||col}"`};   /* arma encantada: data-en + aura del color del efecto (CSS ENCANT-ICONO) */
// [título, estadística, meta, recompensa, diálogo de Ru, objetivo en el mapa]
const GOALS=[['Habla con Ru, el tendero de la plaza','talk',1,0,'','S:ru'],
['Tala 5 troncos','got:logs',5,30,'¡Bienvenido, viajero! Soy Ru, el tendero.|Tala 5 troncos en el bosque del norte. ¡Sigue la flecha amarilla!','N:wc:0'],
['Mina 4 menas de cobre','got:cobre',4,30,'Ahora, cobre en las minas del noreste.','N:mi:0'],
['Mina 4 menas de estaño','got:estano',4,30,'Ahora estaño, de las rocas claras.','N:mi:1'],
['Funde una barra de cobre','make:b_cobre',1,40,'Funde el cobre en el horno de la Herrería (entra por su puerta).','S:furnace'],
['Forja una espada de cobre','make:sw_cobre',1,60,'Las armas se forjan en el yunque: necesitas 2 barras de cobre, así que funde otra.','S:anvil'],
['Pesca 4 camarones','got:camaron',4,40,'Pesca 4 camarones en el estanque del sur.','N:fi:0'],
['Cocina un camarón','make:c_camaron',1,50,'En la cocina de la taberna: elige «Asado» (parrilla), pon un camarón y sírvelo cuando esté dorado. La comida cocinada sirve para curarte.','S:cocina'],
['Vuelve con Ru','talk',2,30,'¡Buenos camarones! La comida cocinada te cura: llévala siempre en la mochila y cómela con LMB cuando te hieran. Ahora ve al rancho, al este, a cazar.','S:ru'],
['Mata una vaca','kill:vaca',1,60,'Ve al rancho, al este, y mata una vaca.','M:vaca'],
['Consigue manteca de vaca','got:grasa',1,40,'Las vacas a veces sueltan manteca. Sigue cazando.','M:vaca'],
['Cocina camarones fritos','make:f_camaron',1,80,'Un camarón y una manteca, en la cocina de la taberna: elige «Frito» (sartén).','S:cocina'],
['Guarda algo en el banco','dep',1,40,'El banco guarda lo que no quieres cargar. Arrastra objetos a la ventana del banco, o Mayús+LMB.','S:bank'],
['Vende algo al padre de Ru','sell',1,40,'Mi padre atiende la tienda: entra y véndele lo que te sobre. También puedes vender lo que tengas guardado en el banco.','S:shop'],
['Elige tu camino','path',1,0,'Habla conmigo y elige: guerrero, arquero o mago. Puedes cambiar cuando quieras.','S:ru'],
...PATHS.m.steps,
['Corre 60 casillas','run',60,60,'Mantén Mayús para correr: es más rápido y te hace ir de un sitio a otro sin perder tiempo.',''],
['Esculpe una caña de pino','make:rd_pino',1,100,'El taller también esculpe: 3 troncos de pino y 1 cuero.','S:bench'],
['Derrota 3 gallinas','kill:gallina',3,40,'Los monstruos sueltan runas. Derrota 3 gallinas.','M:gallina'],
['Funde una barra de bronce','make:b_bronce',1,100,'Cobre + estaño = bronce (Herrería nivel 8). Es el tercer escalón de equipo.','S:furnace'],
['Fabrica una espada de bronce','make:sw_bronce',1,160,'Herrería nivel 10: forja una espada de bronce con 2 barras.','S:anvil'],
['Fabrica un peto de bronce','make:ar_bronce',1,160,'Herrería nivel 12: un peto de bronce (3 barras) se forja en el armero de la Herrería y te protege bastante más. Antes puedes hacer petos de cobre y estaño.','S:armero'],
['Mina 4 menas de hierro','got:hierro',4,120,'El hierro (Minería nivel 14) es el gran salto antes del jefe orco. Busca las rocas rojizas al final de la franja de minas.','N:mi:2'],
['Funde una barra de hierro','make:b_hierro',1,150,'Herrería nivel 13: funde barras de hierro.','S:furnace'],
['Fabrica una espada de hierro','make:sw_hierro',1,300,'Herrería nivel 16: con una espada de hierro y buena armadura ya puedes pensar en el jefe orco.','S:anvil'],
['Derrota a 3 bandidos','kill:bandido',3,200,'Los bandidos (nv 8-12) acampan en la Pradera: en el campamento del este y, al sur, en su guarida. Lleva hierro o bronce y comida.','M:bandido'],
['Derrota a un orco','kill:orco',1,250,'Los orcos del campamento, al final del camino, pegan más fuerte que los goblins. Prepárate con hierro y mucha comida.','M:orco'],
['Derrota a Rufo, el Cabecilla Bandido','kill:k0',1,450,'Rufo vive en la Guarida de bandidos, al sur de la Pradera (mírala en el mapa, tecla M). Va con 4 bandidos y guarda el 🗝️ Sello que mantiene a Gruk protegido. Combate 13 o más y mucha comida.','M:k0'],
['Derrota a Gruk, el Jefe Orco','kill:b0',1,600,'Con el Sello de Rufo, Gruk ya no está protegido. Es duro: Combate 15 o más, espada y peto de hierro y mucha comida. ¡Suelta runas y botín raro!','M:b0'],
['Llega al Bosque','bio',2,200,'La puerta del campamento orco está abierta. Sigue el camino hacia el este: el Bosque tiene mejores recursos.','B:1'],
['Mina 4 menas de carbón','got:carbon',4,250,'El carbón (Minería nivel 24) se encuentra en el Bosque y convierte el hierro en acero.','N:mi:3'],
['Funde una barra de acero','make:b_acero',1,350,'Hierro + carbón, Herrería nivel 22: el acero es el siguiente escalón.','S:furnace'],
['Fabrica un hacha de acero','make:ax_acero',1,400,'Herrería nivel 26: 2 barras de acero y 1 tronco de roble. Tala mucho más rápido.','S:anvil'],
['Derrota a 5 osos pardos','kill:oso',5,600,'La Cueva del oso (al sur del Bosque) esconde osos nv 22-28 y a su capitán. Ve con acero y comida.','M:oso'],
['Derrota a Garra Parda','kill:k1',1,900,'Garra Parda guarda el 🗝️ Sello de Fenrir. Combate 26 o más.','M:k1'],
['Derrota a Fenrir, el Lobo Alfa','kill:b1',1,1400,'Con el Sello, Fenrir ya puede ser retado. Guarda la salida del Bosque: es rápido y peligroso. Combate 31 o más.','M:b1'],
['Llega al Pantano','bio',3,400,'El Pantano esconde plata, ancas de rana, esqueletos y brujas. Cuidado.','B:2'],
['Mina 4 menas de plata','got:plata',4,500,'La plata (Minería nivel 34) crece en el Pantano.','N:mi:4'],
['Fabrica una espada de plata','make:sw_plata',1,800,'Herrería nivel 36: barras de plata para una espada mucho mejor.','S:anvil'],
['Derrota a 5 brujas del pantano','kill:bruja',5,1200,'El Aquelarre (al sur del Pantano): brujas nv 38-44. Pegan fuerte pero aguantan poco.','M:bruja'],
['Derrota a Morgana, Reina Bruja','kill:k2',1,1800,'Morgana guarda el 🗝️ Sello del Rey Cienaga. Combate 43 o más; lleva armadura de plata o mitril.','M:k2'],
['Derrota al Rey Cienaga','kill:b2',1,2500,'El Rey Cienaga custodia el paso a las Cumbres. Combate 46 o más y mucha comida.','M:b2'],
['Llega a las Cumbres','bio',4,800,'Las Cumbres nevadas guardan mitril, yaks y gigantes. Lleva buena armadura.','B:3'],
['Fabrica un pico de mitril','make:pk_mitril',1,1500,'Herrería nivel 48: mitril y carbón para la barra, y un pico que casi vuela por la roca.','S:anvil'],
['Derrota a 5 gigantes de escarcha','kill:gigante',5,2400,'La Fortaleza del gigante (al sur de las Cumbres): gigantes nv 54-60. Pegan lento pero muy fuerte.','M:gigante'],
['Derrota a Thrud, Gigante de Hielo','kill:k3',1,3200,'Thrud guarda el 🗝️ Sello del Yeti. Combate 59 o más.','M:k3'],
['Derrota al Yeti Milenario','kill:b3',1,4500,'El Yeti Milenario cierra el camino al Oriente. Combate 62 o más, armadura de mitril o mejor.','M:b3'],
['Fabrica una espada de adamantita','make:sw_adam',1,3000,'Herrería nivel 62: la espada que necesitas para el Oriental.','S:anvil'],
['Llega al Oriental','bio',5,1800,'El Oriental: pagodas, bambú y espíritus. Lleva armadura de adamantita si puedes.','B:4'],
['Derrota a 5 shinobis','kill:shinobi',5,4200,'El Dojo de sombras (al sur del Oriental): shinobis nv 70-76, golpean muy rápido.','M:shinobi'],
['Derrota a Kage, Maestro Shinobi','kill:k4',1,5500,'Kage guarda el 🗝️ Sello del Oni Gigante. Combate 75 o más.','M:k4'],
['Derrota al Oni Gigante','kill:b4',1,7500,'El Oni Gigante custodia el paso al Volcán. Combate 79 o más. Nada de lo de aquí es contenido final.','M:b4'],
['Llega al Volcán','bio',6,2500,'El Volcán es el último bioma: runita, oricalco, celestita, pez magma, demonios y golems.','B:5'],
['Fabrica una espada de runita','make:sw_runita',1,6000,'Herrería nivel 74: runita y carbón en el horno, y a forjar.','S:anvil'],
['Derrota a 5 golems de obsidiana','kill:golem',5,7000,'La Forja del coloso (al sur del Volcán): golems nv 90-97, lentos y muy resistentes.','M:golem'],
['Derrota al Coloso de Magma','kill:k5',1,9000,'El Coloso guarda el 🗝️ Sello del Señor del Fuego. Combate 93 o más.','M:k5'],
['Derrota al Señor del Fuego','kill:b5',1,15000,'El último jefe vive en el corazón del Volcán. Combate 96 o más: ¡equípate al máximo!','M:b5'],
['Fabrica una espada de celestita','make:sw_celestita',1,20000,'Herrería nivel 96: la mejor espada del mundo.','S:anvil'],
['Alcanza el nivel 99 de Combate','lvl:cb',99,100000,'Lo difícil empieza ahora: el nivel 99 en cada skill. Entrena donde más XP te den y no olvides la cocina.','']];
const XT=[0,0];{let p=0;for(let l=1;l<99;l++){p+=Math.floor(l+300*Math.pow(2,l/7));XT[l+1]=Math.floor(p/4)}}
const lvlOf=x=>{let l=1;while(l<99&&x>=XT[l+1])l++;return l};
let S={xp:{al:0,he:0,wc:0,mi:0,fi:0,co:0,sm:0,cr:0,pe:0,sa:0,ds:0,es:0,jo:0,ing:0,dm:0,ins:0,en:0,ra:0,mg:0,cb:0,pr:0},inv:[],bank:{},coins:0,tool:{wc:0,mi:0,fi:0,he:0},st:{},done:{},buf:{},sta:100,exh:0,bagU:0,luck:0,wis:0,goal:0,gseen:-1,auto:1,boss:{},merc:0,trv:0,vig:0,fzr:0,dfs:0,mana2:0,mreg2:0,crf:0,hv:0,cfg:0,rvt:0,poi:{},map:{},key:{},rest:0,tq:{wc:0,mi:0,fi:0},pity:0,legR:0,runes:{},mv:40,sv:100,disc:{},eq:{w:null,a:null},t:Date.now(),cur:null,qs:[],qb:null,rep:{},qn:0,qstreak:0};
try{let r=JSON.parse(localStorage.getItem('tdo2'));if(r&&(r.ver||0)<16)r=null; /* REWORK DE TIERS (26 oct 2026): 12 tiers (sin estaño, con alba e infernita) y madera/piel nuevas: ids de equipo cambian → partidas anteriores descartadas (decisión del dueño: no se mantienen partidas) */ /* progresión v2 (oct 2026): 99 en todas las skills, 6 familias nuevas, sellos de capitán: partidas anteriores descartadas */ /* F3-C2: se añadió el bioma Oriental (índices de bioma, botín y jefes cambian): las partidas anteriores se descartan (decisión del dueño) */if(r)S={...S,...r,xp:{...S.xp,...r.xp},tool:{...S.tool,...r.tool}};if(r&&!r.ver){for(const k in S.tool)S.tool[k]++}if(r&&!r.eq){const bs=M=>S.inv.filter(x=>M[x]).sort((a,b)=>M[b]-M[a])[0],w=bs(SW),a=bs(AR);if(w){S.eq.w=w;S.inv.splice(S.inv.indexOf(w),1)}if(a){S.eq.a=a;S.inv.splice(S.inv.indexOf(a),1)}}if(r&&(r.ver||0)<10)migOld();delete S.xp.ag;delete S.st['lvl:ag'];S.pdone=S.pdone||{};S.gp=S.gp||{};if(r&&(r.gv||0)<2){const o=r.goal||0;if(o>=19)S.goal=o+3;else{S.goal=0;while(S.goal<PCH&&(S.st[GOALS[S.goal][1]]||0)>=GOALS[S.goal][2])S.goal++}S.gseen=-1}S.gv=2;if(S.path)pathSeg();S.ver=16}catch(e){}
let WIPE=0,rtm;try{COC.sweep()}catch(e){}try{STAB.sweep()}catch(e){}try{ENCH.init();ENCH.sweep()}catch(e){}
function migOld(){const ver=S.ver||0,mp={cobre:'pino',estano:'abedul',bronce:'roble',hierro:'fresno',acero:'sauce',plata:'arce',mitril:'tejo',adam:'ebano'},fx=id=>typeof id==='string'?id.replace(/^(bw|st)_(cobre|estano|bronce|hierro|acero|plata|mitril|adam)/,(m,a,b)=>a+'_'+mp[b]):id;
 S.inv=S.inv.map(fx);for(const k of Object.keys(S.bank)){const n=fx(k);if(n!==k){S.bank[n]=(S.bank[n]||0)+S.bank[k];delete S.bank[k]}}for(const k of Object.keys(S.eq))S.eq[k]=fx(S.eq[k]);for(const k of Object.keys(S.disc)){const n=fx(k);if(n!==k){S.disc[n]=1;delete S.disc[k]}}
 if(ver<9)for(const k in S.tool)S.tool[k]=[0,3,4,5,7,8][S.tool[k]]??S.tool[k];
 for(const k of ['wc','mi','fi','he']){const t=S.tool[k]||0;if(!S.eq[k]&&t>0)S.eq[k]=(k==='wc'?'ax_':k==='mi'?'pk_':k==='he'?'sc_':'rd_')+(k==='fi'?WON[t-1]:TNM[t-1])}}
let SAVEWARN=0;
// Guardado: se comprueba que lo escrito se lee de vuelta (navegadores en modo privado, vistas previas o carpetas sin permiso descartan el guardado en silencio) y se avisa UNA vez.
const save=()=>{if(WIPE)return;S.t=Date.now();try{if(!INT&&isFinite(P.x)&&isFinite(P.y))S.pos=[Math.round(P.x),Math.round(P.y)]}catch(e){}prSync();let ok=0;try{const j=JSON.stringify(S);localStorage.setItem('tdo2',j);ok=localStorage.getItem('tdo2')===j}catch(e){}
 if(!ok&&!SAVEWARN){SAVEWARN=1;try{log('⚠ Este navegador NO deja guardar la partida (modo privado, vista previa o almacenamiento bloqueado). Usa «Guardar en archivo» en el panel para no perder el progreso.')}catch(e){}}};
// guardar también al cerrar/ocultar la pestaña (antes solo cada 5 s) y pedir almacenamiento persistente (el navegador no lo borra por falta de espacio)
addEventListener('pagehide',()=>save());addEventListener('beforeunload',()=>save());document.addEventListener('visibilitychange',()=>{if(document.hidden)save()});
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
function exportSave(){save();const j=JSON.stringify(S),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([j],{type:'application/json'}));a.download='notscape-partida-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
function importSave(){const i=document.createElement('input');i.type='file';i.accept='.json,application/json';i.onchange=()=>{const f=i.files[0];if(!f)return;f.text().then(t=>{const r=JSON.parse(t);if(!r||typeof r!=='object'||!r.xp||!r.inv)throw 0;WIPE=1;localStorage.setItem('tdo2',JSON.stringify(r));location.reload()}).catch(()=>alert('Ese archivo no es una partida de NotScape.'))};i.click()}
function resetGame(){const b=$('#rstb');if(b.dataset.arm!=='1'){b.dataset.arm='1';b.textContent='¿Seguro? LMB otra vez para borrar';clearTimeout(rtm);rtm=setTimeout(()=>{b.dataset.arm='0';b.textContent='Reiniciar'},4000);return}WIPE=1;try{localStorage.removeItem('tdo2')}catch(e){}location.reload()}
const L=sk=>lvlOf(S.xp[sk]),count=id=>S.inv.filter(x=>x===id).length,maxHp=()=>10+Math.floor(CBL()/2)+gs('hp')+S.vig+(typeof ENCH!=='undefined'?Math.round(ENCH.arm('vitalidad')*3):0)+(typeof COC!=='undefined'?COC.hpBonus():0),wb=()=>WB[S.eq.w]||0,ab=()=>(AR[S.eq.a]||0)+(SHL[S.eq.s]||0)+(LGL[S.eq.l]||0)+(GLL[S.eq.g]||0)+gs('def')+S.dfs+(S.buf.def>Date.now()?5:0),maxHit=()=>{if(wtype()==='g')return Math.max(1,Math.round(Math.max(1,...SPL.filter(s=>s.atk&&L('mg')>=s.lv).map(spMax))*(1+pry('str'))));const w=S.eq.w,l=L(wtype()==='r'?'ra':'cb'),ef=l+8+S.fzr+(S.buf.dmg>Date.now()?3+Math.floor(l*.1):0);return Math.floor(.5+ef*(FZ+(w?SB[w]||0:0)+gs('str')+(wtype()==='r'?ammoStr():0))*(1+pry('str'))/(FZ*10))};
// lote C5: munición activa. La ballesta (`lw_<bioma>b<q>`) usa virotes; el resto de armas a distancia, flechas. Sin la adecuada equipada: flechas estándar (sin bonus ni gasto).
const isXbow=()=>/^lw_\d+b\d/.test(S.eq.w||''),ammoOk=()=>{const id=S.eq.u;return !!id&&S.amn>0&&AMK[id]===(isXbow()?'vi':'fl')},ammoStr=()=>ammoOk()?AMS[S.eq.u]:0;
function useAmmo(){if(!ammoOk())return;if(--S.amn<=0){const n=I[S.eq.u][0];S.eq.u=null;S.amn=0;log('🏹 Te quedaste sin '+n.toLowerCase()+': ahora usas '+(isXbow()?'virotes':'flechas')+' estándar.');toast('🏹 Sin munición<br>Usas '+(isXbow()?'virotes':'flechas')+' estándar',2600)}dirty=1}
function eqAmmo(id){const n=count(id),o=S.eq.u,on=S.amn||0;if(o&&o!==id&&slotsUsed()-Math.ceil(n/AMN)+Math.ceil(on/AMN)>cap())return log('Inventario lleno: no cabe la munición que llevas puesta.');S.inv=S.inv.filter(x=>x!==id);if(o&&o!==id)for(let k=0;k<on;k++)S.inv.push(o);S.eq.u=id;S.amn=(o===id?on:0)+n;snd('coin');inc('eqammo');dirty=1;save()}
function unqAmmo(){const id=S.eq.u,n=S.amn||0;if(!id)return;if(slotsUsed()+Math.ceil(n/AMN)>cap())return log('Inventario lleno.');for(let k=0;k<n;k++)S.inv.push(id);S.eq.u=null;S.amn=0;dirty=1;save()}
// lote D6: mochila APILABLE (S.inv sigue siendo una lista plana, una entrada por unidad; lo que cambia es cuántos HUECOS ocupa). Materiales/comida/pociones apilan hasta STK por hueco; el equipo (armas, armaduras, herramientas, objetos con '~' de calidad) ocupa siempre 1 hueco por pieza.
const STKN=5,stn=id=>AMS[id]!==undefined?AMN:STKN,stk=id=>!(BAGS[id]||WB[id]||AR[id]||SHL[id]||LGL[id]||GLL[id]||LOOT[id]||TOOLT[id]||QVS[id]||(typeof OFGEAR!=='undefined'&&OFGEAR.is(id))||String(id).includes('~')),
 slotsUsed=()=>{const c={};let n=0;for(const x of S.inv){if(stk(x))c[x]=(c[x]||0)+1;else n++}for(const k in c)n+=Math.ceil(c[k]/stn(k));return n},
 room=id=>{if(id&&stk(id)){const n=count(id);if(n%stn(id)!==0)return true}return slotsUsed()<cap()},
 have=k=>count(k)+(S.bank[k]||0),
 invSlots=()=>{const out=[],pos={};S.inv.forEach((x,j)=>{if(!stk(x)){out.push({id:x,n:1,i:j});return}const g=pos[x]||(pos[x]=[]);let c=g[g.length-1];if(!c||c.n>=stn(x)){c={id:x,n:0,i:j};g.push(c);out.push(c)}c.n++;c.i=j});return out};   // las instalaciones también gastan lo guardado en el banco
const hasIn=o=>Object.entries(o).every(([k,v])=>have(k)>=v);
const take=o=>{for(const[k,v]of Object.entries(o))for(let n=0;n<v;n++){const j=S.inv.indexOf(k);if(j>=0)S.inv.splice(j,1);else if(S.bank[k]>0)S.bank[k]--}};
// RECURSOS CON VIDA (oct 2026): cada nodo tiene HP = 3·TR^(tier que lo desbloquea); cada golpe de la herramienta hace daño TR^(tier de herramienta)·(1+0,01·nivel)·(1+0,18·calidad). Un tier de herramienta por encima del nodo = 1 golpe (con nivel alto, antes).
const NODER=1.7,nodeHp=a=>3*Math.pow(NODER,TLV(rq(a))),toolDmg=sk=>(Math.pow(NODER,S.tool[sk]||0)+(S.tool[sk]?0:1))*(1+L(sk)*.01)*(1+.18*(S.tq[sk]||0));
const hitPeriod=sk=>TOOLS[sk]?[3,3,3,2,2,2,1,1,1,1,1,1,1][S.tool[sk]]*600:900,hitAmt=(sk,a)=>Math.min(1,TOOLS[sk]?toolDmg(sk)/nodeHp(a):(900/a[a.length-1])*(1+L(sk)*.006)),dur=(sk,a)=>hitPeriod(sk)*Math.ceil(1/hitAmt(sk,a));

// ---------- mundo ----------
const WW=BIOMES.WW,WH=BIOMES.WH,spawnOf=BIOMES.spawnOf; // datos por bioma en src/biomes.js (F3-B). Cada bioma es un rectángulo {ox,oy,w,h} del mundo; sus datos van en coordenadas locales (F9-L0)
const biomeAt=(x,y)=>BIOMES.at(x,y),ownAt=(x,y)=>BIOMES.own(x,y);   // Fase 49a: biomeAt = REGIÓN deformada (paleta, luz, música, curB, mapa) · ownAt = bioma DUEÑO de la casilla rectangular (aldea, datos locales, misiones, puentes)
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const N=[],M=[],ST=[],PD=[],PO=[],GD=[],GA=[];   // GD = objetos en el suelo (drops de enemigos), GA = animaciones de recogida   // PO = puntos de interés (cofres, santuarios)
// punto de pesca válido: agua abierta (el tile y sus vecinos), a ≤84 px de tierra pisable (se pesca desde la orilla con el alcance de la caña) y lejos de otros puntos de pesca
const fishOk=(x,y)=>{const hw=(a,b)=>TER.heightAt(x+a,y+b)===.75;if(!hw(0,0)||!hw(14,0)||!hw(-14,0)||!hw(0,12)||!hw(0,-12))return false;
 for(const r of[36,60,84])for(let k=0;k<12;k++){const a=k*Math.PI/6;if(TER.isLand(TER.heightAt(x+Math.cos(a)*r,y+Math.sin(a)*r)))return true}return false};
const relocate=e=>{if(e.fix){e.g=Math.random()<.004;return}   // fix = árbol fijo (decorativo convertido en recurso): reaparece donde estaba
 if(e.t==='fi'){let bx=null;for(let a=0;a<110&&!bx;a++){const x=e.z[0]+Math.random()*(e.z[1]-e.z[0]),y=e.z[2]+Math.random()*(e.z[3]-e.z[2]),sp=a<70?64:34;if(fishOk(x,y)&&!N.some(o=>o!==e&&o.t==='fi'&&Math.hypot(o.x-x,o.y-y)<sp))bx=[x,y]}if(bx){e.x=bx[0];e.y=bx[1]}
  // punto de orilla desde el que se pesca: el suelo pisable más cercano (la ruta del jugador va hacia él, no en línea recta por encima del agua)
  e.st=[];for(let r=24;r<=96;r+=12)for(let k=0;k<24;k++){const an=k*Math.PI/12,x=e.x+Math.cos(an)*r,y=e.y+Math.sin(an)*r;if(TER.isLand(TER.heightAt(x,y))&&!TER.cliffNear(x,y,10)&&!PROPS.solid(x,y)&&TER.isLand(TER.heightAt(x+8,y))&&TER.isLand(TER.heightAt(x-8,y))&&TER.isLand(TER.heightAt(x,y+8))&&TER.isLand(TER.heightAt(x,y-8)))e.st.push([x,y])}
  e.g=Math.random()<.004;return}
 // Fase 49b: la costa del continente (src/coast.js) puede dejar parte de una zona de recurso en el MAR: el nodo solo cae en TIERRA pisable (≥ 36 intentos); si la zona entera es mar, `e.bad` (sp0 no lo crea)
 e.bad=0;let ok=0;const ox0=e.x,oy0=e.y;for(let a=0;a<(BIOMES.coast&&BIOMES.coast.on?36:10);a++){e.x=e.z[0]+Math.random()*(e.z[1]-e.z[0]);e.y=e.z[2]+Math.random()*(e.z[3]-e.z[2]);if(BIOMES.coast&&BIOMES.coast.on&&!TER.isLand(TER.heightAt(e.x,e.y)))continue;ok=1;if(!N.some(o=>o!==e&&Math.hypot(o.x-e.x,o.y-e.y)<34))break}if(!ok&&BIOMES.coast&&BIOMES.coast.on){e.bad=1;e.x=ox0;e.y=oy0}e.g=Math.random()<.004};
/* reaparecer en OTRO punto SIN mover la hitbox antes de tiempo: el nuevo sitio se guarda en `e.pend` y `alive()` lo aplica al revivir (antes la hitbox saltaba al agotarse y la malla seguía en el sitio viejo) */
const relocDefer=e=>{const o={x:e.x,y:e.y,st:e.st,g:e.g};relocate(e);if(e.bad)return;e.pend={x:e.x,y:e.y,st:e.st,g:e.g};e.x=o.x;e.y=o.y;e.st=o.st;e.g=o.g};
const sp0=(t,i,n,x0,x1,y0,y1)=>{for(let k=0;k<n;k++){const e={t,i,x:0,y:0,rt:0,z:[x0,x1,y0,y1]};relocate(e);if(!e.bad)N.push(e)}};
Object.keys(MD).forEach(id=>{MD[id].id=id;if(CRE.H[id])MD[id].h=Math.round(CRE.H[id]/1.5)});
// fase B (Oración): los enemigos fuertes sueltan además huesos mejores (más XP de Oración): ≥lv25 grande · ≥50 antiguo · ≥75 rúnico; jefes y capitanes también aunque no soltaran hueso
Object.values(MD).forEach(d=>{const b=d.lv>=75?'hueso_r':d.lv>=50?'hueso_a':d.lv>=25?'hueso_g':null;if(b&&(d.boss||d.dr.some(x=>x[0]==='hueso')))d.dr.push([b,d.boss?.75:.4])}); // altura de etiqueta/barra = altura del sprite (px de modelo) / SPR (1.5)
// ── v2: bandas de nivel por criatura (el nivel de cada individuo se sortea en la banda al reaparecer) y estadísticas POR NIVEL (HP/golpe máx del monstruo = f(nivel) × multiplicador de familia) ──
const LVR={goblinarq:[4,8],goblinsha:[6,10],espantapajaros:[7,11],slime:[1,3],banasesino:[11,14],orcocampeon:[15,18],cabra:[3,6],cerdo:[3,6],conejo:[1,2],caballo:[3,6],zorrorojo:[6,9],toro:[14,17],gallina:[1,2],cordero:[1,2],vaca:[2,4],oveja:[2,5],goblin:[3,8],bandido:[8,12],orco:[11,15],k0:[14,14],b0:[16,16],jabali:[14,18],lobo:[18,24],oso:[22,28],k1:[27,27],b1:[32,32],rana:[30,34],esqueleto:[34,40],bruja:[38,44],k2:[44,44],b2:[48,48],
 yak:[46,50],ogro:[50,56],gigante:[54,60],k3:[60,60],b3:[64,64],zorro:[62,66],oni:[66,72],shinobi:[70,76],k4:[76,76],b4:[80,80],lagarto:[78,84],demonio:[84,92],golem:[90,97],k5:[97,97],b5:[99,99]};
// [multiplicador de HP, multiplicador de daño]: 0 de daño = inofensivo (gallina)
const MSF={goblinarq:[.8,.7],goblinsha:[.8,1.1],espantapajaros:[1.3,.9],slime:[.6,.5],banasesino:[3,1.1],orcocampeon:[4.5,1.3],cabra:[1,.35],cerdo:[1.1,.35],conejo:[.4,0],caballo:[1.4,0],zorrorojo:[.8,.9],toro:[4.5,1.3],gallina:[.5,0],cordero:[.6,0],vaca:[1,.35],oveja:[1,.35],goblin:[1,.8],bandido:[1,1],orco:[1.3,1.1],k0:[1.2,1],b0:[1.9,0.8],jabali:[1,.9],lobo:[1,1],oso:[1.5,1.1],k1:[1.35,1],b1:[1.55,0.8],rana:[.9,.9],esqueleto:[1,1],bruja:[.8,1.25],k2:[1.55,1],b2:[1.9,0.8],
 yak:[1.4,1],ogro:[1.3,1.2],gigante:[1.6,1.3],k3:[1.95,1],b3:[2.6,0.8],zorro:[1,1],oni:[1.3,1.2],shinobi:[1,1.4],k4:[1.4,1],b4:[2.55,0.8],lagarto:[1,1],demonio:[1.2,1.2],golem:[2,1.3],k5:[1.7,1],b5:[2.4,0.8]};
const HPF=lv=>3+.6*lv,DMF=lv=>2+.45*lv*(1+.6*(lv/99)*(lv/99));
LVR.gabriel=[6,6];MSF.gabriel=[1,.6];MTD.regMobs();   // DOMAR-D3: 39 animales domables (src/mountdata.js)
Object.keys(LVR).forEach(id=>{const d=MD[id],r=LVR[id],f=MSF[id];d.lv=Math.round((r[0]+r[1])/2);d.hp=Math.max(3,Math.round(HPF(d.lv)*f[0]));d.dmg=f[1]?Math.max(1,Math.round(DMF(d.lv)*f[1])):0});
function rollLv(m){const d=m.d,r=LVR[d.id],f=MSF[d.id];m.lv=R(r[0],r[1]);m.mh=Math.max(3,Math.round(HPF(m.lv)*f[0]));m.dm=f[1]?Math.max(1,Math.round(DMF(m.lv)*f[1])):0;m.hp=m.mh;m.hunt=0;m.ag0=0;m.bleed=null;m.bi=0;m.en=0;m.bph=0;m.asx=1;m.tc=0;m.lx=null;m.tel=null}
const mob=(id,x,y)=>{const m={d:MD[id],hx:x,hy:y,x,y,rt:0,tx:x,ty:y,wt:0,fl:0};rollLv(m);if(m.d.el)m.elite=1;M.push(m)};
const ZS=[];PROPS.build();if(window.R3D_ON&&TER.setElev)TER.setElev(PROPS.elevAt);   // elevación de props (props.js ELEV): standZ incluye zócalos/gradas/suelos
BI.forEach((b,k)=>{const x0=b.ox,y0=b.oy,L=b.lay;
const BOARD_WELL={0:[84,26]};   // Pradera (pedido del dueño, 20 oct 2026): el tablón de encargos junto al pozo de la plaza (desplazamiento en px respecto al pozo); el resto de aldeas lo siguen poniendo junto a la tienda
const RUDX=100,RUDY=74;   // Ru respecto al puesto de la tienda (14 oct 2026: antes (+30,−26) y tapaba la puerta de la tienda; este punto está libre de colisiones y de adornos en las 6 aldeas)
 b.village.stations.forEach(([id,n,dx,dy,sks])=>{const e={id,n:id==='shop'?'Tienda':n,x:x0+dx,y:y0+dy};if(sks)e.sks=sks;ST.push(e);if(id==='shop'){ST.push({id:'ru',n:'Ru',x:e.x+RUDX,y:e.y+RUDY});{let bx=e.x-112,by=e.y+30;const w=BOARD_WELL[k]&&b.village.props.find(p=>p.n==='pozo');if(w){bx=x0+w.x+BOARD_WELL[k][0];by=y0+w.y+BOARD_WELL[k][1]}ST.push({id:'board',n:'Tablón de encargos',x:bx,y:by})}}});   // BOARD_WELL: biomas cuyo tablón va junto al pozo // Ru es un NPC aparte del puesto de la tienda (LMB en Ru = diálogo, LMB en el puesto = tienda)
 {const put=(kind,list,rs)=>list.forEach(([i,n])=>{for(let j=0;j<n;j++){const r=rs[R(0,rs.length-1)];sp0(kind,i,1,x0+r[0],x0+r[1],y0+r[2],y0+r[3])}}),ZN=(r,t)=>ZS.push({k,r:[x0+r[0],x0+r[1],y0+r[2],y0+r[3]],t}),nm=(sk,i)=>ACT[sk][i][0];
  b.res.wc.forEach((l,z)=>{put('wc',l,L.wc[z].r);ZN(L.wc[z].z,'🌲 Zona de '+nm('wc',l[0][0]).toLowerCase())});
  b.res.mi.forEach((l,v)=>{put('mi',l,L.mi[v].r);ZN(L.mi[v].z,'⛏️ Veta de '+nm('mi',l[0][0]).toLowerCase())});
  HERB.place(b,k,x0,y0);   // Herbolaria: claros de hierbas (src/herbalism.js)
  MTD.place(b,k,x0,y0);   // DOMAR-D3: pastos salvajes con monturas domables (src/mountdata.js)
  b.res.fi.forEach((l,z)=>{const f=L.fi[z];if(!f)return;put('fi',l,[f.z]);ZN(f.z,'🎣 '+f.t+': '+nm('fi',l[0][0]).toLowerCase())})}
 ['ing','pack','camp','orc','cap'].forEach(key=>{const sp=b.spots&&b.spots[key];if(!sp)return;spreadSpot(b,k,key,sp);sp.mobs.forEach(([id,dx,dy])=>mob(id,x0+dx,y0+dy));ZS.push({k,r:[x0+sp.z[0],x0+sp.z[1],y0+sp.z[2],y0+sp.z[3]],t:sp.t})}); // guaridas decoradas (src/biome-spots.js / layouts.js)
 (b.fauna||[]).forEach(f=>{f.mobs.forEach(([id,dx,dy])=>mob(id,x0+dx,y0+dy));ZS.push({k,r:[x0+f.z[0],x0+f.z[1],y0+f.z[2],y0+f.z[3]],t:f.t})});   // ?map=A (src/mapa-a-fill.js): fauna repartida por la región
 (b.pois||[]).forEach(p=>{const id=k+'_'+p.id,x=x0+p.x,y=y0+p.y,pk=p.k==='camp'?'cofre':p.k,sant=pk==='santuario',done=!!S.poi[id];
  if(pk==='cueva'){CAVE.reg(id,{...p.cave,nm:p.n,tier:p.tier});ST.push({id:'door',n:p.n,x,y:y+8,k,room:'cueva',cave:id,lh:44,hn:'cueva'});ZS.push({k,r:[x-p.r,x+p.r,y-p.r,y+p.r],t:'🕳️ '+p.n,poi:id});return}   // CUEVAS REALES: la boca es una puerta; dentro hay una cueva generada (src/caves.js)
  if(pk==='hito'){ZS.push({k,r:[x-p.r,x+p.r,y-p.r,y+p.r],t:'🗼 '+p.n,hito:{x,y}});return}   // E3: atalaya = solo zona de descubrimiento (revela el mapa; ver discover)
  PO.push({po:1,id,pk,n:sant?'santuario':done?'cofreAbierto':'cofre',o:sant?{col:p.col,used:done}:null,nm:p.n,x,y,k,_oa:1,tier:p.tier,stat:p.stat,col:p.col});
  if(p.mobs){const hp=[...new Set(Object.values(b.spots||{}).flatMap(s=>s.mobs.map(m=>m[0])))].filter(q=>MD[q]&&(MD[q].ag||MD[q].dmg>=3)&&!MD[q].an&&!/^[kb]\d/.test(q));   // E3: los guardias de un POI generado SIEMPRE son hostiles (la guarida `ing` de la Pradera trae vacas y ovejas; hostil = `ag` o dmg ≥ 3): si salió uno pacífico se cambia por un hostil del bioma
   p.mobs.forEach(([mid,dx,dy],qi)=>{if(!(MD[mid]&&(MD[mid].ag||MD[mid].dmg>=3))&&hp.length)mid=hp[Math.abs(qi*7+Math.round(x+y))%hp.length];mob(mid,x+dx,y+dy);M[M.length-1].poi=id})}
  ZS.push({k,r:[x-p.r,x+p.r,y-p.r,y+p.r],t:(p.k==='camp'?'🏕️ ':sant?'⛩️ ':'🧰 ')+p.n,poi:id})});
 if(!b.noBoss)mob('b'+k,x0+b.bossPos[0],y0+b.bossPos[1])});   // Fase 49a: los biomas esqueleto (Páramo, Desierto, Costa) aún no tienen jefe
// árboles decorativos (cualquier prop con el sprite de un árbol de TREES) = recursos talables: misma especie, mismo tier. Fijos (fix) y con colisión de tronco.
PROPS.trees.forEach(t=>{N.push({t:'wc',i:t.i,x:t.x,y:t.y,rt:0,z:[t.x,t.x,t.y,t.y],fix:1,g:Math.random()<.004})});
PROPS.scatter({ST,ZS,N,M});if(!/nodoors/.test(location.search))intDoorsInit();npcInit();   // Fase 6: Guardia, Herrera y Anciano (src/npcs.js), tras las puertas

const FISHR=104;   // alcance de la caña (px de mundo): se pesca desde la orilla sin pisar el agua
const alive=(e,now)=>{if(e.rt&&e.rt>now)return false;if(e.pend){Object.assign(e,e.pend);e.pend=null}return true},   /* un nodo que reaparece en OTRO punto lo estrena aquí (relocDefer): hitbox, malla y respawn coinciden */
nearS=id=>ST.find(s=>s.id===id&&Math.hypot(P.x-s.x,P.y-s.y)<80);
const P={x:spawnOf(0).x,y:spawnOf(0).y,f:1,w:0,hp:0,g:null,mv:null,mvg:0},K={};let A=null,parts=[],logs=['Bienvenido a Villa Pradera.'],dirty=1,pd=0,lr=0,lreg=0,lfx=0,DT=0,TB='inv',cx=0,cy=0,curB=0,swc=0;
P.hp=maxHp();{const m=/[?&]at=(-?[\d.]+),(-?[\d.]+)/.exec(location.search);if(m){P.x=+m[1];P.y=+m[2];if(ISO.snap)ISO.snap(P.x,P.y,TER.standZ(P.x,P.y))}   // ?at=x,y (px de mundo) = aparecer ahí (pruebas y capturas; no se guarda)
 else if(Array.isArray(S.pos)&&isFinite(S.pos[0])&&isFinite(S.pos[1])){P.x=S.pos[0];P.y=S.pos[1];if(ISO.snap)ISO.snap(P.x,P.y,TER.standZ(P.x,P.y))}}   // F5: volver donde se quedó (guard() lo corrige si cae en sitio no válido)
S.tq=S.tq||{wc:0,mi:0,fi:0};syncTools();S.st.bio=S.st.bio||1;if(!S.st.b44){S.st.b44=1;for(let k=0;k<(S.st.bio||1)-1;k++)S.boss[k]=1}   /* Fase 44a: los jefes ya no abren el camino; esta migración de partidas antiguas (bioma alcanzado ⇒ jefes anteriores vencidos) solo se hace UNA vez */
if(S.home==null){S.home=0;for(let k=BIOMES.N-1;k>0;k--)if(S.map&&S.map['v'+k]){S.home=k;break}}   /* Fase 44a: S.home = última aldea visitada (donde reapareces al morir) */
S.inv.forEach(x=>S.disc[x]=1);Object.keys(S.bank).forEach(x=>S.disc[x]=1);[S.eq.w,S.eq.a].forEach(x=>{if(x)S.disc[x]=1});S.st.disc=Object.keys(S.disc).length;

// ---------- música (Amber Ale = Pradera, Dragon Smasher = combate) ----------
const MUS={amber:'assets/music/amber.mp3',dragon:'assets/music/dragon.mp3',tavern:'assets/music/taberna.mp3'},MVOL=.55,TR={};
let UNL=0,vT=0,vB=0,fightAt=-1e9;
['pointerdown','keydown'].forEach(e=>addEventListener(e,()=>{UNL=1}));
document.addEventListener('visibilitychange',()=>{if(document.hidden)Object.values(TR).forEach(a=>a.pause())});
function trk(k){if(!TR[k]){const a=new Audio(MUS[k]);a.loop=true;a.volume=0;a.onerror=()=>{if(a.dataset&&a.dataset.b)return;a.dataset=a.dataset||{};a.dataset.b=1;try{const bin=atob(MUS[k].split(',')[1]),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);a.src=URL.createObjectURL(new Blob([u],{type:'audio/mpeg'}))}catch(e){}};TR[k]=a}return TR[k]}
// sube/baja el volumen poco a poco; al llegar a 0 pausa SIN reiniciar, así la canción sigue donde quedó
function ramp(k,v,tgt,dt){if(tgt===0&&v<=.001&&!TR[k])return 0;const a=trk(k);v+=Math.max(-dt/2.2,Math.min(dt/2.2,tgt-v));a.volume=Math.max(0,Math.min(1,v*S.mv/100));
 if(v>.001&&a.paused){const p=a.play();if(p&&p.catch)p.catch(()=>{})}else if(v<=.001&&tgt===0&&!a.paused)a.pause();return v}
let vV=0,INV=0;
// 14 oct 2026: guaridas sin muros/vallas: los bichos se dispersan (factor F) alrededor de su centro y la zona crece igual. Las que tienen cercado (rancho ya agrandado, cementerio, corral, ruinas, campamentos, capitanes) no se tocan.
function spreadSpot(b,k,key,sp){const F=({'1:ing':2,'1:pack':1.8,'2:ing':2,'3:pack':1.8,'4:ing':1.9,'4:pack':1.6,'5:ing':2.2,'5:pack':1.6})[k+':'+key];if(!F||sp._sp)return;sp._sp=1;const m=sp.mobs,cx=m.reduce((a,q)=>a+q[1],0)/m.length,cy=m.reduce((a,q)=>a+q[2],0)/m.length,G=BIOMES.geo;
 sp.mobs=m.map(([id,x,y])=>{const nx=Math.round(cx+(x-cx)*F),ny=Math.round(cy+(y-cy)*F);return(nx<120||ny<120||nx>b.w-120||ny>b.h-120||G.water(b,nx,ny))?[id,x,y]:[id,nx,ny]});
 const zx=(sp.z[0]+sp.z[1])/2,zy=(sp.z[2]+sp.z[3])/2,hw=(sp.z[1]-sp.z[0])/2*F,hh=(sp.z[3]-sp.z[2])/2*F;sp.z=[Math.round(zx-hw),Math.round(zx+hw),Math.round(zy-hh),Math.round(zy+hh)]}
function inVil(r){const b=BI[curB],c=b.cen;return Math.abs(P.x-(b.ox+c[0]))<r&&Math.abs(P.y-(b.oy+c[1]))<r-30}
let bossAt=-1e9,NGT=0;
/* MÚSICA DE JEFE GENERAL (22 oct 2026): `bossMusic(ms)` pone la pista de jefe del bioma YA y la mantiene `ms` (úsala al EMPEZAR la cinemática de intro de cualquier jefe); además todo jefe `boss:1` que te persigue activa su pista solo. */
function bossMusic(ms){const n=performance.now()+(ms||0);fightAt=Math.max(fightAt,n);bossAt=Math.max(bossAt,n)}
function bgm(now,dt){if(!inRoom())for(const m of M){if(m.hunt&&alive(m,now)&&!sealed(m)&&Math.abs(m.x-P.x)<300&&Math.abs(m.y-P.y)<300&&Math.hypot(m.x-P.x,m.y-P.y)<300){fightAt=now;if(m.d.boss===1)bossAt=now;break}}   /* COMBATE REAL: un golpe al aire ya no pone la música de combate; solo daño a/de un enemigo, atacar a uno, o un enemigo que te persigue de cerca */
 if(A&&A.ty==='f'){fightAt=now;if(A.e&&A.e.d&&A.e.d.boss)bossAt=now}const fight=now-fightAt<2500,off=S.mute||!UNL;if(!INV&&inVil(410))INV=1;else if(INV&&!inVil(460))INV=0;
 const sn=sunS(now/1000);if(!NGT&&sn<-.12)NGT=1;else if(NGT&&sn>-.02)NGT=0;
 // F6-música: si el bioma tiene pistas propias (MUSIC.DEF) suenan ellas; si no, la música antigua (síntesis / amber-tavern-dragon)
 const inI=inRoom(),tav=inI&&INT.id==='taberna';   // dentro de un interior suena la música de la aldea más baja (×0,4); en la TABERNA, su canción única (assets/music/taberna.mp3, tools/tavern_song.py)
 const mus=MUSIC.update(now,dt,{k:inI?INT.k:curB,vil:inI?true:!!INV,fight:inI?false:fight,boss:inI?false:fight&&now-bossAt<2500,night:inI?false:!!NGT,off:off||tav,mv:inI?S.mv*.4:S.mv});
 vT=ramp('amber',vT,(!mus&&!off&&!fight&&curB===0&&!INV&&!inI)?1:0,dt);vV=ramp('tavern',vV,tav&&!off?.9:((!mus&&!off&&!fight&&INV&&!inI)?1:0),dt);vB=ramp('dragon',vB,(!mus&&!off&&fight)?1:0,dt);if(!mus&&!fight&&curB>0&&!INV)music(now)}
// ---------- sonido ----------
let AC=null,nm=0;
let AMASTER=null;   // volumen maestro (BR.snd: los eventos de bioma lo bajan sin castigar)
function ac(){if(!AC)try{AC=new(window.AudioContext||window.webkitAudioContext)();AMASTER=AC.createGain();AMASTER.connect(AC.destination)}catch(e){}if(AC&&AC.state==='suspended')AC.resume();return AC}
['pointerdown','keydown'].forEach(e=>addEventListener(e,()=>ac()));
function tone(f,d,ty,v,sl,dl){const a=ac();if(!a||S.mute)return;const t=a.currentTime+(dl||0),o=a.createOscillator(),g=a.createGain();o.type=ty||'square';o.frequency.setValueAtTime(f,t);if(sl)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+sl),t+d);g.gain.setValueAtTime(Math.max(.0001,(v||.05)*S.sv/100),t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(AMASTER||a.destination);o.start(t);o.stop(t+d)}
function noise(d,v,fr,ty){const a=ac();if(!a||S.mute)return;const n=a.sampleRate*d|0,b=a.createBuffer(1,n,a.sampleRate),c=b.getChannelData(0);for(let i=0;i<n;i++)c[i]=Math.random()*2-1;const s=a.createBufferSource(),fl=a.createBiquadFilter(),g=a.createGain(),t=a.currentTime;s.buffer=b;fl.type=ty;fl.frequency.value=fr;g.gain.setValueAtTime(Math.max(.0001,v*S.sv/100),t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(fl);fl.connect(g);g.connect(AMASTER||a.destination);s.start(t)}
const SND={wc:()=>{noise(.1,.14,700,'lowpass');tone(110,.1,'triangle',.1,-50)},mi:()=>{tone(1500,.07,'square',.035,-400);noise(.05,.06,5000,'highpass')},fi:()=>noise(.3,.06,1600,'bandpass'),co:()=>noise(.35,.04,6000,'highpass'),es:()=>{noise(.08,.1,3000,'bandpass');tone(500,.06,'square',.04,-150)},ins:()=>{tone(1100,.18,'sine',.05,200);tone(1650,.2,'sine',.03,0,.06)},bow:()=>{tone(700,.08,'triangle',.05,-350);noise(.06,.05,3500,'highpass')},magic:()=>{tone(500,.25,'sine',.06,600);tone(900,.2,'sine',.04,0,.05)},
sm:()=>{tone(880,.18,'square',.04,-150);tone(1320,.25,'triangle',.03)},cr:()=>{tone(300,.06,'square',.05,-80);tone(450,.05,'square',.03,0,.06)},hit:()=>{noise(.1,.12,900,'lowpass');tone(200,.1,'sawtooth',.06,-120)},miss:()=>noise(.12,.04,2500,'bandpass'),hurt:()=>tone(160,.25,'sawtooth',.08,-80),
kill:()=>{tone(300,.2,'square',.06,200);tone(500,.25,'square',.06,0,.12)},die:()=>tone(300,.6,'sawtooth',.08,-250),lvl:()=>[523,659,784,1047].forEach((f,i)=>tone(f,.25,'square',.06,0,i*.1)),
coin:()=>{tone(988,.08,'square',.05);tone(1319,.15,'square',.05,0,.07)},xp:()=>{tone(1175,.05,'sine',.04);tone(1568,.09,'sine',.035,0,.05)},quest:()=>[392,523,659].forEach((f,i)=>tone(f,.3,'triangle',.08,0,i*.12)),epic:()=>[523,659,784,1047,1319,1568].forEach((f,i)=>tone(f,.4,'square',.06,0,i*.12)),rare:()=>[659,784,988,1319,1568].forEach((f,i)=>tone(f,.3,'square',.06,0,i*.09))};
SND.react=()=>{tone(392,.07,'triangle',.05,300);setTimeout(()=>tone(784,.16,'sine',.045,260),55);noise(.14,.045,2600,'highpass')};SND.sts=()=>{tone(620,.06,'triangle',.03,160)};
/* SONIDO POR ELEMENTO del encantamiento al aplicarse el efecto (lote ENCANT-CIERRE; síntesis con tone/noise, tope 140 ms) */
let ENT=0;SND.en=e=>{const n=performance.now();if(n-ENT<140)return;ENT=n;
 switch(e){case'fuego':case'infernal':noise(.22,.06,700,'lowpass');tone(180,.18,'sawtooth',.03,-80);break;
  case'escarcha':case'glacial':tone(1480,.09,'sine',.04,-300);setTimeout(()=>tone(1960,.12,'sine',.03,-500),50);noise(.1,.03,5000,'highpass');break;
  case'veneno':case'toxica':tone(300,.16,'sine',.04,260);setTimeout(()=>tone(420,.1,'sine',.03,-200),90);break;
  case'sangre':case'hemorragica':tone(130,.14,'triangle',.05,-60);noise(.1,.04,900,'lowpass');break;
  case'rayo':case'tempestad':noise(.12,.06,3200,'highpass');tone(900,.07,'square',.025,-600);break;
  case'vacio':case'abisal':tone(90,.3,'sine',.06,-30);setTimeout(()=>tone(135,.25,'triangle',.03,-40),60);break;
  case'fisico':case'implacable':case'aplastante':noise(.07,.05,1800,'bandpass');tone(220,.08,'triangle',.04,-100);break;
  default:tone(660,.1,'triangle',.04,240);setTimeout(()=>tone(990,.12,'sine',.03,0),60)}};   // letreros de REACCIÓN y de ESTADO aplicado (lote DAÑO-LEGIBLE)
const snd=k=>{try{SND[k]&&SND[k]()}catch(e){}},mut=()=>{S.mute=!S.mute;save();panel()};
const PEN=BI.map(b=>b.music.pen);
function music(now){if(!AC||S.mute||now<nm)return;nm=now+R(1400,3000);const f=PEN[curB][R(0,4)]*(Math.random()<.3?2:1);tone(f,1.8,BI[curB].music.wave,BI[curB].music.gain)}
// ---------- lógica ----------
function log(m){logs.unshift(m);logs=logs.slice(0,5);$('#log').innerHTML=logs.map(x=>'<div>'+x+'</div>').join('')}
let tt;function toast(h,ms=2400){const t=$('#toast');t.innerHTML=h;t.style.display='block';clearTimeout(tt);tt=setTimeout(()=>t.style.display='none',ms)}
let chkg=0;function chk(){if(chkg)return;chkg=1;Q.forEach((q,i)=>{if(!S.done[i]&&(S.st[q[2]]||0)>=q[3]){S.done[i]=1;snd('quest');S.coins+=q[4];S.st.coins=(S.st.coins||0)+q[4];toast('📜 Misión completada: <b>'+q[0]+'</b><br>+'+money(q[4]));log('Misión completada: '+q[0]);dirty=1}});let adv=0,rw=0;while(S.goal<GOALS.length&&(S.st[GOALS[S.goal][1]]||0)>=GOALS[S.goal][2]){rw+=gpay();S.goal++;adv++}if(adv){S.coins+=rw;S.st.coins=(S.st.coins||0)+rw;snd('quest');const g=GOALS[S.goal];toast('🎯 ¡Objetivo cumplido!'+(rw?'<br>+'+money(rw):'')+(g?'<br>Siguiente: <b>'+g[0]+'</b>':'<br>¡Completaste todos los objetivos!'));log('Objetivo cumplido'+(g?'. Siguiente: '+g[0]:'.'));dirty=1}if(typeof pathChk==='function')pathChk();if(S.goal>=GOALS.length&&!S.legR){S.legR=1;addLoot('lg_ring')}if(typeof qChk==='function')qChk();chkg=0}
function inc(k,n=1){S.st[k]=(S.st[k]||0)+n;chk()}
const earn=n=>{S.coins+=n;inc('coins',n);if(n>0)COINLOG.push([Date.now(),n])};
const add=id=>{if(typeof STAB!=='undefined'&&/^mt_[a-z]+$/.test(id))id=STAB.adopt(id);S.inv.push(id);inc('got:'+id);disc(id)};
function disc(id){if(!S.disc[id]&&!id.includes('~')){S.disc[id]=1;S.st.disc=Object.keys(S.disc).length;log('📖 ¡Nuevo objeto! '+I[id][0]);snd('xp');chk()}}
/* partículas: ahora 3D y suaves (src/r3d/fx3d.js, `R3D.fx.sp` clasifica por color/gravedad); el sistema 2D de píxeles solo queda como plan B */
function sp(x,y,c,n,vx,vy,g){if(window.R3D&&R3D.fx){R3D.fx.sp(x,y,c,n,vx,vy,g);return}for(let k=0;k<n;k++)parts.push({x,y,vx:(Math.random()-.5)*vx,vy:-Math.random()*vy,g,l:1,c})}
function gain(sk,xp,sil){xp*=(1+.05*S.wis)*(S.buf.xp>Date.now()?1.5:1)*(sk==='cb'||sk==='mg'||sk==='ra'?1+pv('savant')/100:TOOLS[sk]?1+tpv(sk,'gsage')/100:1);const o=L(sk);S.xp[sk]+=xp;if(typeof ISLA!=='undefined'&&ISLA.lock()){S.xp[sk]=Math.min(S.xp[sk],XT[2]-1);if(!S.awk)S.awk={};if(!S.awk[sk]){S.awk[sk]=1;try{banner('Despiertas',SK[sk][1]+' '+SK[sk][0],'#e8cf94',3000);log('✨ <b>'+SK[sk][0]+'</b> despierta: nivel 1.');snd('lvl');dirty=1}catch(e){}}}   /* NIVELES DESPIERTOS (isla del Cielo): todo empieza dormido (nivel 0); el primer éxito de cada oficio lo despierta (nivel 1) y la XP se recorta justo bajo el nivel 2 hasta terminar el tutorial */
 if(!sil)snd('xp');if(TB==='sk')skLive(sk); /* actualiza solo la barra y el texto de esa skill; subir de nivel marca dirty (rebuild) más abajo */const n=L(sk);
 if(!sil){if(typeof HUDSU!=='undefined'&&HUDSU.ok)HUDSU.xp(sk,xp,n>o,n)}
 if(n>o){S.st['lvl:'+sk]=n;S.st.tot=SKL.reduce((s,k)=>s+L(k),0);banner('¡Nivel '+n+'!',SK[sk][1]+' '+SK[sk][0],'#e8cf94',3200);log('¡Nivel '+n+' en '+SK[sk][0]+'!');sp(P.x,P.y-20,'#e8cf94',24,160,120,200);snd('lvl');if(sk==='cb'||sk==='ra'||sk==='mg')P.hp=maxHp();if(typeof WKUI!=='undefined')WKUI.onLevel(sk,o,n);chk();dirty=1}}
const gOk=a=>{const g=GATE[a[2]];return !g||L(g[0])>=g[1]};   // lote C5: requisito extra de otra skill (munición: Arquería)
function stepAct(sk,i,sil,at){const a=ACT[sk][i],cr=a.length===6;
 if(L(sk)<rq(a)||!gOk(a))return 0;
 if(cr){if(!hasIn(a[1])){if(!sil)log('Te faltan materiales.');return 0}
  if(ownT(a)){if(!sil)log('Ya tienes esa herramienta o una mejor.');return 0}take(a[1]);
  if(sk==='co'&&!(GOALS[S.goal]&&GOALS[S.goal][1]==='make:'+a[2])&&Math.random()<Math.max(0,.45-(L(sk)-a[3])*.02)){   /* el paso de cocina del tutorial nunca se quema */add('quemado');if(!sil)log('Quemaste la comida.')}
  else{if(a[2]&&a[2].startsWith('rn_')){const[rid,n]=a[2].split(':'),rk=rid.slice(3);S.runes[rk]=(S.runes[rk]||0)+ +n;disc(rid);inc('make:'+rid)}else if(a[2]){const vid=qv(a[2],sk);add(vid);for(let q=1;q<(a.n||OUTN[a[2]]||1);q++)add(vid);autoEq(vid);inc('make:'+a[2]);if(vid!==a[2]){const q=+vid.split('~')[1];log('<span style="color:'+RAR[q][1]+'">✨ ¡Calidad '+RAR[q][0].toLowerCase()+'!</span>');if(q>=2){toast('🔨 <span style="color:'+RAR[q][1]+'">¡Calidad '+RAR[q][0].toLowerCase()+'!</span><br>'+I[a[2]][0]);snd('rare')}}}else inc('fm');gain(sk,a[4]*XPM,sil);if(!sil)log(!a[2]?'Quemas '+a[0].slice(7):a[2].startsWith('tl:')||a[2].startsWith('rn_')?'Fabricas: '+a[0]:'Obtienes: '+(OUTN[a[2]]?OUTN[a[2]]+'× ':'')+I[a[2]][0])}
  return 1}
 if(!room(a[1])){if(!sil)log('Inventario lleno. Vende o usa el banco.');return 0}
 const D=at?(id=>dropGround(id,at.x,at.y,{au:1})):add;   // con la rueda el botín sale como objeto 3D que vuela a tu mano (recogida magnética)
 const te=typeof ENCH!=='undefined'&&ENCH.tool(sk);let got=a[1];   /* ENCANTAMIENTO de la herramienta (lote ENCANT-T2) */
 if(te&&(te.e==='autofundido'||te.e==='brasa')&&Math.random()<.1*te.b){const alt=te.e==='autofundido'?ENCH.smeltOf(a[1]):ENCH.cookOf(a[1]);if(alt&&I[alt]){got=alt;if(!sil)log(te.e==='autofundido'?'🔥 ¡Sale ya fundido!':'🍖 ¡Sale ya asado!')}}
 D(got);if(!sil&&room(got)&&Math.random()*100<pv('harvest')+4*S.hv+(te&&te.e==='fortuna'?10*te.b:0)){D(got);log('✨ ¡Cosecha doble!')}gain(sk,a[3],sil);if(!sil)log('Obtienes: '+I[got][0]);
 const r=RARE[sk];if(r&&room(r[0])&&Math.random()<(1+.25*S.luck+tpv(sk,'lucky')/100)*(te&&te.e==='hallazgo'?1+.5*te.b:1)/r[1]){if(at)dropGround(r[0],at.x,at.y,{au:1,rare:1});else add(r[0]);inc('rare');snd('rare');toast(ic(r[0])+' ¡Drop raro: <b>'+I[r[0]][0]+'</b>!',3000);log('¡Drop raro! '+I[r[0]][0])}
 if(sk==='mi'&&at&&window.EJ)EJ.gemDrop(i,at);   // ESC-JOY: gema del bioma al picar (piedra o mena)
 return 1}
function stopA(m){if(A&&A.wk&&typeof WKUI!=='undefined')WKUI.close();A=null;S.cur=null;if(m)log(m);dirty=1}
/* RUEDA DE RECOLECCIÓN Y CRAFTEO (v2, 21 oct 2026; decisión del dueño: «como New World: una rueda, satisfactorio»): Tala, Minería, Pesca y los oficios de crafteo de estación (Herrería, Artesanía, Escultor, Inscripción). La Cocina conserva su minijuego `CK`.
   Ya NO se pica solo: un anillo con un marcador que gira y un ARCO de acierto (con núcleo «perfecto»); cada pulsación (LMB o E) es un golpe: arco = bueno, núcleo = perfecto (×1,3), fuera = flojo (×0,55). Sin racha. Acertar solo ACELERA un poco.
   · Recolección: golpes por recurso `whHits`; el botín sale como OBJETO 3D que vuela a tu mano (`dropGround{au:1}` con recogida magnética tras 650 ms); el recurso cae/se rompe (`Resources.fell`) con grietas progresivas en la mena; recursos DORADOS (`e.g`, ultra raros, 0,4 %) = arco más estrecho y botín ×4.
   · Crafteo: cada pieza pide `whHitsC` golpes; la precisión sube la probabilidad de CALIDAD (`QBON` en `qv`); al terminar una pieza sigue la tanda (QTY) pidiendo golpes otra vez.
   · Feedback: sonido sintético por material (`whSnd`), partículas 3D (`whFx`), muescas de golpes en el anillo interior, y al PERFECTO un hit-stop de 45 ms + un destello dorado SUAVE en los bordes (`PLS`; sin zoom ni movimiento de cámara; se apaga en Opciones → «Pulso de impacto»).
   Sin Math.random en la lógica (PRNG `whR`, por si hay online). Pendiente: sonidos con grabaciones, balance de XP (meas_progresion.py), cocina con rueda. */
const WHEEL_SK={wc:1,mi:1};   // la rueda es SOLO para extraer recursos de golpe (tala, minería); pesca y crafteo tendrán minijuegos distintos (decisión del dueño, 21 oct)
let whSeed=7;const whR=()=>(whSeed=(whSeed*16807)%2147483647)/2147483647,TAU2=Math.PI*2;
const WH_IMP=24,whImp=()=>A&&A.sk==='mi'?20:24,whArm=()=>A&&A.sk==='mi'?.86:.82;   /* minería (21 oct 2026): el pico espera ya casi al final del arco (ph .8 = k2 del clip) y el impacto cae a 50 ms: el arco completo desde arriba tardaba y se notaba retraso */   /* ms entre pulsar y el impacto visible (preparación corta: el golpe cae casi a la vez que el LMB) */
const whAng=now=>(((now-A.wm0)/A.wrev)%1+1)%1*TAU2,whDiff=(a,b)=>{let d=Math.abs(a-b)%TAU2;return d>Math.PI?TAU2-d:d};
/* Golpes por recurso: `2 × vida del recurso ÷ daño de la herramienta SIN el bono del tier 0`, entre 3 y 12 (herramienta del tier del recurso ≈ 6; mejor = menos; peor = más). */
const whHits=(sk,a)=>Math.max(2,Math.min(8,Math.round(1.2*nodeHp(a)/(Math.pow(NODER,S.tool[sk]||0)*(1+L(sk)*.01)*(1+.18*(S.tq[sk]||0))))));
const whHitsC=a=>Math.max(3,Math.min(8,Math.round(a[a.length-1]/650)));   // crafteo: más tiempo de receta = más golpes
let QBON=1,XPM=1;   // XPM = multiplicador de la XP de una receta (síntesis rápida)   // bono de calidad por precisión (lo usa qv durante el crafteo)
/* REESCALADO FSR (22 oct 2026, pedido del dueño: interruptor APAGADO por defecto): el mundo 3D se pinta al 75 % y se amplía con nitidez (pasada `fsr` de r3d.js). Más fps en GPU débiles; algo menos nítido de cerca. `?fsr=1|0` lo fuerza para probar. */
let FSR_ON=false;try{const q=(location.search.match(/[?&]fsr=(\d)/)||[])[1];FSR_ON=q!=null?q==='1':localStorage.getItem('ns_fsr')==='1'}catch(e){}
function fsrTxt(){const b=document.getElementById('fsrb');if(b)b.textContent='Reescalado FSR: '+(FSR_ON?'SÍ':'NO')}
function tgFsr(){FSR_ON=!FSR_ON;try{localStorage.setItem('ns_fsr',FSR_ON?'1':'0')}catch(e){}fsrTxt()}
/* CRISTAL DEL HUD (Lote ANTI-TIRONES, 25 oct 2026): `backdrop-filter: blur()` sobre el lienzo 3D obliga al navegador a volver a desenfocar el fondo de CADA barra, botón, panel y aviso de XP
   en CADA fotograma (el mundo cambia siempre); en combate hay más (barra del objetivo, avisos de XP por golpe). Medido: ~10 % de fps en combate con la mochila abierta. Apagado por defecto
   (css/hud-susurro.css, bloque «Cristal del HUD»: más opacidad en su lugar); Opciones → Gráficos → «Cristal del HUD» lo vuelve a encender (clase body.hs-glass). */
let GLASS=false;try{GLASS=localStorage.getItem('ns_glass')==='1'}catch(e){}
function glassTxt(){document.body.classList.toggle('hs-glass',GLASS);const b=document.getElementById('glb');if(b)b.textContent='Cristal del HUD: '+(GLASS?'SÍ':'NO')}
function tgGlass(){GLASS=!GLASS;try{localStorage.setItem('ns_glass',GLASS?'1':'0')}catch(e){}glassTxt()}
glassTxt();
// Frondosidad del pasto (opción del jugador, 23 oct 2026): multiplica la densidad de briznas SIN tocar el resto de la calidad (r3d.js la lee cada fotograma; 125 % solo en Máxima/Alta; 0 = sin pasto)
let GRASSK=1;try{const v=localStorage.getItem('ns_grass');if(v!=null&&!isNaN(+v))GRASSK=Math.max(0,Math.min(1.25,+v))}catch(e){}
{const r=document.getElementById('grk'),t=document.getElementById('grt');if(r){r.value=Math.round(GRASSK*100);r.oninput=()=>{if(t)t.textContent='Pasto: '+r.value+' %'};r.onchange=()=>{GRASSK=+r.value/100;try{localStorage.setItem('ns_grass',String(GRASSK))}catch(e){}}}if(t)t.textContent='Pasto: '+Math.round(GRASSK*100)+' %'}
/* SUAVIZADO DE BORDES (24 oct 2026): 'fxaa' (por defecto) · 'smaa' · 'msaa2' · 'msaa4'. r3d.js lo lee cada fotograma (pases fxaa/smaa o `samples` del composer). `?aa=fxaa|smaa|msaa2|msaa4` lo fuerza para probar. */
const AA_LIST=[['fxaa','FXAA'],['smaa','SMAA'],['msaa2','MSAA x2'],['msaa4','MSAA x4']];
let AA_MODE='fxaa';try{const q=(location.search.match(/[?&]aa=(\w+)/)||[])[1],v=q||localStorage.getItem('ns_aa');if(AA_LIST.some(a=>a[0]===v))AA_MODE=v}catch(e){}
function aaTxt(){const b=document.getElementById('aab');if(b)b.textContent='Suavizado: '+AA_LIST.find(a=>a[0]===AA_MODE)[1]}
function tgAa(){AA_MODE=AA_LIST[(AA_LIST.findIndex(a=>a[0]===AA_MODE)+1)%AA_LIST.length][0];try{localStorage.setItem('ns_aa',AA_MODE)}catch(e){}aaTxt()}
setTimeout(aaTxt,0);
setTimeout(fsrTxt,0);
let PULSE_ON=true;try{PULSE_ON=localStorage.getItem('ns_pulse')!=='0'}catch(e){}let PLS=0;
function tgPulse(){PULSE_ON=!PULSE_ON;try{localStorage.setItem('ns_pulse',PULSE_ON?1:0)}catch(e){}const b=document.getElementById('pulb');if(b)b.textContent='Parada de impacto: '+(PULSE_ON?'SÍ':'NO')}
setTimeout(()=>{const b=document.getElementById('pulb');if(b)b.textContent='Parada de impacto: '+(PULSE_ON?'SÍ':'NO')},0);
function whPulse(now){if(!PULSE_ON)return;if(window.R3D&&!(typeof CINE!=='undefined'&&CINE.on)){R3D.tscale=.06;clearTimeout(window.__hs);window.__hs=setTimeout(()=>{if(!(typeof CINE!=='undefined'&&CINE.on))R3D.tscale=1},45)}SHK=Math.max(SHK,now+70)}
function whInit(now){const c=A.ty==='c',t=c?0:(S.tool[A.sk]||0),lv=L(A.sk),a=ACT[A.sk][A.i],gold=!c&&!!(A.e&&A.e.g);
 Object.assign(A,{wh:1,wrev:c?1650:Math.max(1300,2200-t*55),whalf:Math.min(.8,.4+lv*.003+t*.008)*(gold?.7:1),wm0:now,h0:-1e9,hq:0,wc:now+whImp(),wl:now,fl:null,hit:0,gold,perf:0,tot:0,amt:1/(c?whHitsC(a):whHits(A.sk,a))});A.wper=A.whalf*.34;{const te=typeof ENCH!=='undefined'&&ENCH.tool(A.sk);if(te){if(te.e==='precision')A.wper*=1+.25*te.b;if(te.e==='eficiencia')A.amt*=1+.2*te.b}}   /* ENCANTAMIENTO de la herramienta */A.wa=(whAng(now)+Math.PI)%TAU2;
 mgBegin('wh')}
/* POSE DEL ARMA EN LA RUEDA (tala/minería), siempre CONTINUA: espera «armada» (whArm) → al pulsar sube de `p0` (la fase en que estaba) a 1 en whImp ms → impacto → recuperación (`rc`) → vuelta suave a la espera (420 ms). Pulsar de nuevo en cualquier momento CORTA la vuelta y arranca desde la fase actual (sin saltos), y el impacto siempre cae a whImp() del LMB (sincronía con el recurso). */
const whEase=u=>u*u*(3-2*u);
/* PATRÓN DE ANIMACIÓN POR INPUT (21 oct 2026): `armPose(sg,imp,fw,arm,p0)` = fase `ph` de una acción disparada por el jugador, SIEMPRE continua: espera «armada» (arm) → al pulsar sube de p0 a 1 en `imp` ms (el efecto/daño cae en ese instante) → recuperación (`rc`, hasta `fw`) → vuelta suave a la espera (420 ms). `armP0(sg,imp,fw,arm)` = fase de partida de la PRÓXIMA pulsación (donde esté la vuelta): un LMB nuevo corta la vuelta sin saltos. Lo usan la rueda (whPose) y la forja; el combate usa la variante sin espera (ph .5→1 en SWG.wind). */
const WH_REC=170,WH_RET=300;   // recuperación (retroceso del golpe) y subida de vuelta a la espera, en ms
function armPose(sg,imp,fw,arm,p0){if(sg<0)return{ph:arm};if(sg<imp){const q=p0==null?arm:p0;return{ph:q+(1-q)*sg/imp}}if(sg<fw)return{ph:0,rc:q4((sg-imp)/WH_REC)};return{ph:Math.max(.001,arm*whEase(Math.min(1,(sg-fw)/WH_RET))),ret:1}}
const armP0=(sg,imp,fw,arm)=>sg>=imp?Math.max(arm*.9,sg>=fw?arm*whEase(Math.min(1,(sg-fw)/WH_RET)):0):null;   // un LMB nuevo SIEMPRE arranca cerca de la pose armada (≥ 90 %): si arrancaba de la fase baja de la vuelta, el brazo tenía que subir y bajar de nuevo y el impacto visual llegaba tarde (se desincronizaba a partir del 2.º golpe)
/* POSE DEL ARMA EN LA RUEDA (tala/minería): ver armPose; el impacto siempre cae a whImp() del LMB (sincronía con el recurso). */
function whPose(now){const imp=whImp();return Object.assign(armPose(now-A.h0,imp,imp+WH_REC,whArm(),A.p0),{n:A.hn||0})}
function whPress(now){if(!A||!A.wh||now<A.wc)return;A.hn=(A.hn||0)+1;{const imp=whImp();A.p0=armP0(now-A.h0,imp,imp+WH_REC,whArm())}   // fase de partida del nuevo golpe
 const th=whAng(now),d=whDiff(th,A.wa),q=d<=A.wper?2:d<=A.whalf?1:0;
 A.hq=q+1;A.h0=now;A.wc=now+220;A.wl=now;A.fl={t:now,q};A.tot++;whSnd(A.sk,q);   // el SONIDO sale al pulsar (instantáneo); el impacto visual lo retrasa WH_IMP
 if(q===2)A.perf++;A.wa=(th+Math.PI*(.55+.9*whR()))%TAU2;   // el arco salta lejos del marcador tras cada golpe
 if(q===2)tone(700,.11,'triangle',.07);else if(q===1)tone(470,.08,'triangle',.05);else tone(170,.07,'sawtooth',.03)}
/* sonido sintético por material (no hay grabaciones de hacha/pico en los packs): madera = golpe sordo con cuerpo, piedra = chasquido seco y metálico, pesca = salpicadura, forja = yunque */
function whSnd(k,q){const r=whR(),v=q===2?1.2:q===1?1:.7;
 if(k==='wc'){noise(.06,.17*v,760+r*340,'bandpass');tone(130+r*40,.1,'sine',.2*v,-70);if(q===2)tone(900,.07,'triangle',.05)}
 else if(k==='mi'){noise(.045,.15*v,3800+r*1500,'highpass');tone(1350+r*500,.08,'square',.035*v,-500);tone(95,.08,'sine',.12*v,-40)}
 else if(k==='fi'){noise(.2,.1*v,1800,'bandpass');tone(500+r*200,.06,'sine',.05*v,300)}
 else if(k==='sm'){tone(1900+r*400,.12,'triangle',.06*v,-300);tone(220,.1,'square',.07*v,-60);noise(.05,.08,4200,'highpass')}
 else if(k==='cr'){noise(.05,.12*v,2600+r*600,'bandpass');tone(300+r*60,.07,'triangle',.09*v,-120)}   // madera: raspado + golpe seco
 else if(k==='sa'){noise(.09,.08*v,1500+r*400,'highpass');tone(520+r*80,.06,'sine',.05*v,-60)}   // tela: frote suave
 else if(k==='pe'){noise(.07,.1*v,900+r*300,'lowpass');tone(150+r*30,.09,'sine',.1*v,-50)}   // cuero: golpe sordo
 else snd(k)}
function whFx(k,e,q){const f=window.R3D&&R3D.fx;if(!f)return;const n=q===2?1:q===1?.6:.3;
 if(k==='wc'){const LEAF=['#79b043','#3f8a52','#8a9a3a','#4a6a58','#e49aae','#c8542c','#7a5ab0','#c8a640','#3ab0a0','#4585e0'][curB]||'#79b043';f.chips('wood',e.x,e.y,22,Math.round(6*n)+1,'#b08a5a',{spread:1.6});f.chips('leaf',e.x,e.y,52,Math.round(9*n)+1,LEAF,{spread:1.2});f.smoke(e.x+8,e.y,4,'#b8a888',1,{size:.12,grow:2.2,life:.5,up:.12,alpha:.2,spread:.5});if(q===2)f.spark(e.x,e.y,30,'#fff0b8',7,{up:1.3,g:2.5,size:.09,life:.7})}
 else if(k==='mi'){const ORE=['#c8742a','#e8e8f8','#c0603a','#9a9aa2','#f0f0f8','#4a7aff','#3adf6a','#3ad0d8','#e89a3a','#c8a0ff','#e8c24a','#ff4a2a','#d8d0b8','#9a9aa2','#d4a468','#55525a','#f2ece2','#4a3a5a','#9aaaf0'][e.i]||'#ffd27a';f.chips('rock',e.x,e.y,12,Math.round(8*n)+1,'#8a8478');f.chips('rock',e.x,e.y,12,Math.round(5*n)+1,ORE,{size:.9});f.spark(e.x,e.y,12,ORE,Math.round(7*n)+2,{spread:1.5,g:6,size:.09});f.smoke(e.x+6,e.y,4,'#a89a80',q?2:1,{size:.13,grow:2.4,life:.55,up:.15,alpha:.22,spread:.5});if(q===2)f.spark(e.x,e.y,14,'#ffffff',6,{spread:1,up:1.8,g:5,size:.08})}
 else if(k==='fi'){f.spark(e.x,e.y,4,'#cfe8ff',q?12:4,{spread:.9,up:2.2,g:7,size:.07,life:.5});try{TER.ripple(e.x,e.y);if(R3D.water)R3D.water.event('tug',e)}catch(x){}}
 else if(k==='sm'){f.spark(e.x,e.y,22,'#ff9a2a',q===2?16:8,{spread:1.9,up:2,g:6.5,size:.09});f.smoke(e.x,e.y,26,'#8a867e',1,{size:.15,grow:2.8,life:.7,up:.5,alpha:.28})}
 else if(k==='sa'){f.smoke(e.x,e.y,12,'#e8dfc8',1,{size:.12,life:.7,up:.3,alpha:.28});f.spark(e.x,e.y,6,'#cfc6ac',3,{spread:.7,up:1.2,g:.2,size:.05,life:.9})}
 else if(k==='pe'){f.chips('wood',e.x,e.y,14,q?5:2,'#9a6a3a',{spread:1});f.smoke(e.x,e.y,10,'#b89a74',1,{size:.13,life:.6,up:.25,alpha:.3})}
 else if(k==='ins'||k==='en'){f.spark(e.x,e.y,22,'#ffe8a0',q?10:4,{spread:.6,up:1.4,g:-.3,size:.09,life:.9})}
 else{f.chips('wood',e.x,e.y,18,q?6:3,'#c9b48a',{spread:1.2});f.smoke(e.x,e.y,16,'#d8c9a3',1,{size:.14,life:.6,up:.3,alpha:.32})}
 if(q===2)SHK=Math.max(SHK,performance.now()+60)}
function whTick(now){if(now-A.wl>15000)return stopA();
 if(A.hq&&now>=A.h0+whImp()){const q=A.hq-1,e=A.e,k=A.sk;A.hq=0;whFx(k,e,q);if(q===2)whPulse(now);
  A.pr+=A.amt*(q===2?1.3:q===1?1:.55);if(A.pr>=1){A.pr=.99;fin(now)}}}
const whEl=(()=>{const c=document.createElement('canvas');c.id='whl';c.width=c.height=192;c.style.display='none';document.body.appendChild(c);return c})(),whX=whEl.getContext('2d');
function whDraw(now){if(!(A&&A.wh)||inRoom()||CK){whEl.style.display='none';return}const e=A.e,c0=ISO.toCanvas(e.x,e.y,TER.standZ(e.x,e.y)),r=cvRect(),k=r.width/cv.width,hh={wc:16,mi:10,fi:8}[A.sk]||14;
 whEl.style.display='block';whEl.style.transform='translate('+(r.left+c0.x*k).toFixed(1)+'px,'+(r.top+(c0.y-hh*SPR*ISO.scale())*k).toFixed(1)+'px) translate(-50%,-50%)';
 const g=whX,C=96,R=70,o=-Math.PI/2,th=whAng(now),GC=A.gold?'255,216,97':'232,207,148';g.clearRect(0,0,192,192);g.lineCap='butt';
 g.lineWidth=15;g.strokeStyle='rgba(14,12,10,.72)';g.beginPath();g.arc(C,C,R,0,TAU2);g.stroke();g.lineWidth=1.2;g.strokeStyle='rgba('+GC+',.6)';[R-7.5,R+7.5].forEach(rr=>{g.beginPath();g.arc(C,C,rr,0,TAU2);g.stroke()});
 // muescas: un segmento por golpe necesario; se iluminan con el progreso (así se ve cuánto falta sin texto)
 const pr=Math.min(1,A.pr||0),H=Math.max(2,Math.min(12,Math.round(1/A.amt))),seg=TAU2/H,gp=.09;g.lineWidth=5;
 for(let j=0;j<H;j++){const a0=o+j*seg+gp/2,a1=o+(j+1)*seg-gp/2,f=Math.max(0,Math.min(1,pr*H-j));g.strokeStyle='rgba(14,12,10,.65)';g.beginPath();g.arc(C,C,R-18,a0,a1);g.stroke();if(f>0){g.strokeStyle=A.gold?'#ffd861':'#9bd04f';g.beginPath();g.arc(C,C,R-18,a0,a0+(a1-a0)*f);g.stroke()}}
 g.lineWidth=12;g.strokeStyle='rgba('+GC+',.92)';g.beginPath();g.arc(C,C,R,o+A.wa-A.whalf,o+A.wa+A.whalf);g.stroke();   // arco de acierto
 g.save();g.shadowColor='#fff0b8';g.shadowBlur=10;g.lineWidth=12;g.strokeStyle='#fff6d8';g.beginPath();g.arc(C,C,R,o+A.wa-A.wper,o+A.wa+A.wper);g.stroke();g.restore();   // núcleo perfecto
 for(let i=1;i<=7;i++){g.lineWidth=7;g.strokeStyle='rgba(255,255,255,'+(.3*(1-i/8))+')';g.beginPath();g.arc(C,C,R,o+th-i*.07,o+th-(i-1)*.07);g.stroke()}   // estela del marcador
 const mx=C+Math.cos(o+th)*R,my=C+Math.sin(o+th)*R;g.save();g.shadowColor='#fff';g.shadowBlur=12;g.fillStyle='#fff';g.beginPath();g.arc(mx,my,7.5,0,TAU2);g.fill();g.restore();
 if(A.fl){const u=(now-A.fl.t)/320;if(u>=1)A.fl=null;else{const q=A.fl.q;g.lineWidth=5*(1-u)+1;g.strokeStyle=q===2?'rgba(255,242,192,'+(1-u)+')':q===1?'rgba('+GC+','+(.9*(1-u))+')':'rgba(190,80,64,'+(.8*(1-u))+')';g.beginPath();g.arc(C,C,R+8+u*(q===2?26:14),0,TAU2);g.stroke()}}}
/* AYUDA DE CONTROLES + ENFOQUE DE CÁMARA DE LOS MINIJUEGOS (21 oct 2026; pedido del dueño). Patrón COMÚN para todo minijuego nuevo:
   · `mgBegin(key)` al empezar (cuenta las veces en `S.mgh[key]`); `mgHintRows(key)` devuelve las filas [[teclas…],'verbo'] según el estado; `mgUi(now)` (cada fotograma, tras los draw de los minijuegos) coloca/funde el aviso junto a la estación.
   · El aviso sale las primeras `MG_HINTS` veces de cada minijuego y se funde suave (sin bloque ni toast). Para uno nuevo: añade su clave en `mgKey()` y sus filas en `mgHintRows`.
   · Enfoque: mientras hay minijuego `mgK`→1 y la cámara se acerca ×`MG_ZOOM` hacia la estación (suave, sin cine; no actúa dentro de interiores ni durante una escena). */
const WKSIDE=.27;   // fracción del ancho de pantalla que se desplaza la cámara con la hoja de oficio al lado (la hoja ocupa ~54 % a la derecha)
const MG_HINTS=5,MG_ZOOM=.42,MG_ZOOM_WK=.85,MG_PULL=.4;let mgK=0,mgT=0,mgZf=MG_ZOOM;   // MG_ZOOM_WK: más cerca al craftear para ver al personaje (Hoja de trabajo)
const mgEl=(()=>{const d=document.createElement('div');d.id='mgh';document.body.appendChild(d);return d})();let mgTx='';
const mgKey=()=>A?(A.wh?'wh':A.fg?'fg':A.wk?'wk':null):null;
/* AYUDAS CONTEXTUALES (21 oct 2026; el dueño: «no pongas todos los controles en la cara al jugador, muéstralos a medida que avanza»): `ctxHint(id, filas, ms)` muestra UNA vez por partida (`S.ctxh[id]`, se guarda) un aviso suave con teclas (`<kbd>`) sobre el marco del jugador;
   si ya hay uno visible, espera en cola. Filas = [[teclas],'texto']. Las dispara el motor del tutorial (isla.js `hintsTick`) en el momento en que cada control importa; úsalo también para enseñar cualquier mecánica nueva. `?hints=0` los apaga. */
const ctxEl=(()=>{const d=document.createElement('div');d.id='ctxh';document.body.appendChild(d);return d})(),ctxQ=[];let ctxT=0,ctxBusy=0;
function ctxHint(id,rows,ms){S.ctxh=S.ctxh||{};if(S.ctxh[id]||/[?&]hints=0/.test(location.search))return false;S.ctxh[id]=1;ctxQ.push({rows,ms:ms||8000});return true}
/* ANTI-SOLAPE (22 oct 2026; el dueño: «los mensajes del tutorial nunca deben taparse; que suban si algo los tapa»): mientras `#ctxh` está visible, cada ~150 ms se mide contra los elementos que pueden ocupar la misma zona y, si choca, se sube (`--ctxup`) justo encima del obstáculo. Para añadir otro obstáculo: su selector en `CTX_OBS`. */
const CTX_OBS=['#cast','#bbar','#qpn','#dlg','#mgh','#aiml','.hs-xp','#fsh'];let ctxUp=0,ctxAv=0;
function ctxAvoid(now){if(now<ctxAv)return;ctxAv=now+150;const r=ctxEl.getBoundingClientRect();if(!r.height)return;const nat={l:r.left,r:r.right,t:r.top+ctxUp,b:r.bottom+ctxUp};let up=0;
 for(let i=0;i<4;i++){let hit=0;for(const q of CTX_OBS){for(const o of document.querySelectorAll(q)){const cs=getComputedStyle(o);if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity<.05)continue;const b=o.getBoundingClientRect();if(b.width<2||b.height<2)continue;
  if(b.right>nat.l&&b.left<nat.r&&b.bottom>nat.t-up&&b.top<nat.b-up){up=nat.b-b.top+8;hit=1}}}if(!hit)break}
 if(Math.abs(up-ctxUp)>1){ctxUp=up;ctxEl.style.setProperty('--ctxup',up+'px')}}
function ctxTick(now){if(ctxBusy)ctxAvoid(now);if(ctxBusy){if(now>ctxT){ctxBusy=0;ctxEl.classList.remove('on');ctxT=now+900;ctxUp=0;ctxEl.style.setProperty('--ctxup','0px')}return}
 if(ctxQ.length&&now>ctxT&&!INT&&!(typeof CINE!=='undefined'&&CINE.on)){const h=ctxQ.shift();ctxEl.innerHTML=h.rows.map(r=>'<div>'+r[0].map(k=>'<kbd>'+k+'</kbd>').join('')+'<span>'+r[1]+'</span></div>').join('');ctxEl.classList.add('on');ctxBusy=1;ctxT=now+h.ms;save()}}
/* BARRA DE CASTEO (21 oct 2026; la usa «buscar» de la misión de Raguel; reutilízala para cualquier acción con tiempo): `castStart(etiqueta, ms, fn, {e:entidad que se mira})` agacha al héroe buscando (pose `se`) y muestra una barra (DOM `#cast`, UI «Susurro»); al acabar llama `fn`. Se interrumpe si te mueves, te hieren o entras en un interior. */
let CAST=null;const castEl=(()=>{const d=document.createElement('div');d.id='cast';d.innerHTML='<div class="cs-t"></div><div class="cs-b"><i></i></div>';document.body.appendChild(d);return d})();
function castStart(label,ms,fn,o){if(CAST||inRoom()||P.hp<=0)return false;CAST={t0:performance.now(),ms,label,fn,e:o&&o.e,px:P.x,py:P.y};P.g=P.mv=null;stopA();castEl.firstChild.textContent=label;castEl.classList.add('on');return true}
function castCancel(msg){if(!CAST)return;CAST=null;castEl.classList.remove('on');if(msg)try{toast(msg,1600)}catch(e){}}
function castTick(now){if(!CAST)return;if(P.mvg||Math.hypot(P.x-CAST.px,P.y-CAST.py)>10||P.hp<=0||inRoom()||now-HURT<500){castCancel('Interrumpido');return}
 const u=(now-CAST.t0)/CAST.ms;castEl.querySelector('i').style.width=Math.min(100,u*100).toFixed(1)+'%';if(u>=1){const f=CAST.fn;CAST=null;castEl.classList.remove('on');try{f()}catch(e){console.warn('[CAST]',e)}}}
/* MARCA DE MISIÓN de un PNJ (para el icono sobre su cabeza y para el minimapa): hoy la da el motor del tutorial (ISLA.mark); las misiones futuras añaden su fuente aquí. null = sin marca. */
const questMark=e=>{if(!e||!e.npc)return null;try{if(typeof ISLA!=='undefined')return ISLA.mark(e.id)}catch(x){}return null};
/* MARCADORES DE MISIÓN (21 oct 2026): iconos DOM de la UI «Susurro» (círculo de cristal + trazo dorado, Cinzel) sobre el PNJ con misión: «!» disponible · «?» gris en curso · «?» dorado para entregar (ISLA.mark). Un div por PNJ en #qms; los que no tocan se ocultan. CSS al final de hud-susurro.css. */
const qmBox=(()=>{const d=document.createElement('div');d.id='qms';document.body.appendChild(d);return d})(),qmEl=new Map();
function castDraw(now){if(CAST&&(typeof CINE!=='undefined'&&CINE.on))castCancel()}
function qmUi(now){if(typeof ISLA==='undefined'||INT||(typeof CINE!=='undefined'&&CINE.on)||!ISLA.on()){if(qmEl.size){qmEl.forEach(e=>e.style.display='none')}return}
 const r=cvRect(),k=r.width/cv.width,seen=new Set();
 for(let i=0;i<ST.length;i++){const e=ST[i];if(!e.npc||e.k!==9)continue;const m=questMark(e);if(!m||!(window.R3D&&R3D.actors.has(e)))continue;seen.add(e.id);
  let d=qmEl.get(e.id);if(!d){d=document.createElement('div');d.className='qm';d.innerHTML='<b></b>';qmBox.appendChild(d);qmEl.set(e.id,d)}
  if(d.dataset.k!==m.k){d.dataset.k=m.k;d.firstChild.textContent=m.c}
  const c0=ISO.toCanvas(e.x,e.y,TER.standZ(e.x,e.y)),lh=R3D.actors.labelH(e);
  d.style.display='grid';d.style.transform='translate('+(r.left+c0.x*k).toFixed(1)+'px,'+(r.top+(c0.y-(lh/SPR+42)*ISO.scale())*k).toFixed(1)+'px) translate(-50%,-100%)'}
 qmEl.forEach((d,id)=>{if(!seen.has(id))d.style.display='none'})}
function mgBegin(key){S.mgh=S.mgh||{};S.mgh[key]=(S.mgh[key]||0)+1}
const K_=(...k)=>k;
function mgHintRows(key){const g=A&&A.fg;
 if(key==='wh')return[[K_('LMB','E'),'golpear con el marcador en el arco dorado']];
 if(key==='fg'){if(!g||g.st==='wait')return[[[],'espera la picada…']];if(g.st==='bite')return[[K_('LMB','E'),'¡ahora, clava el anzuelo!']];
  if(g.st==='fight')return[[K_('W','A','S','D'),'muévete en dirección contraria al pez']];if(g.st==='reel')return[[K_('LMB'),'repetido para recogerlo']]}
 return[]}
function mgUi(now){const key=mgKey(),on=!!key&&!inRoom()&&!CK&&!(typeof CINE!=='undefined'&&CINE.on);if(on)mgZf=key==='wk'?MG_ZOOM_WK:MG_ZOOM;
 const dt=Math.min(.1,OCDT||.016),k0=mgK;mgT=Math.max(0,Math.min(1,mgT+(on?dt:-dt)/.8));mgK=mgT*mgT*(3-2*mgT);   // D8: zoom por TIEMPO con suavizado (termina exacto; antes la cola exponencial dejaba la cámara vibrando ~1 s)
 if(mgT===0&&k0>0){mgK=0;if(window.R3D_ON)ISO.V.zoom=zoom3(ZMI)}
 const show=on&&key!=='wk'&&((S.mgh&&S.mgh[key])||0)<=MG_HINTS;
 if(!show){mgEl.classList.remove('on');return}
 const rows=mgHintRows(key),tx=rows.map(r=>r[0].join('+')+'|'+r[1]).join('/');
 if(tx!==mgTx){mgTx=tx;mgEl.innerHTML=rows.map(r=>'<div>'+r[0].map(k=>'<kbd>'+k+'</kbd>').join('')+'<span>'+r[1]+'</span></div>').join('')}
 const e=A.e,r=cvRect(),k=r.width/cv.width,c0=ISO.toCanvas(e.x,e.y,TER.standZ(e.x,e.y));
 mgEl.style.transform='translate('+(r.left+c0.x*k).toFixed(1)+'px,'+(r.top+(c0.y+8*SPR*ISO.scale())*k).toFixed(1)+'px) translate(-50%,0)';mgEl.classList.add('on')}
const FM_IMP=30;   // ms entre pulsar y el impacto del martillo (lo usa la Hoja de trabajo, workui.js). El minijuego de calor `fm*` se RETIRÓ el 23 oct 2026 (D1).
/* MINIJUEGO DE PESCA v2 (21 oct 2026; el dueño: «que se vea visualmente, sin ruedas ni tan gráfico: el pez que se mueva y el jugador va en la dirección contraria con la caña, como Sea of Thieves»). TODO SE LEE EN EL MUNDO:
   · wait  — la caña echada; tras 2,5–6 s el pez pica: el flotador se hunde, salpica y suena; sale un «!» pequeño.
   · bite  — 1,3 s para pulsar LMB (o E) y clavar el anzuelo; si no, se escapa (a la 3.ª se recoge la caña).
   · fight — se ve el PEZ (3D, `R3D.water.hook`) nadando y tirando de la línea: el flotador lo sigue y deja estela. Antes de cada arrancada GIRA hacia donde va a tirar (chapoteo + cola). Para cansarlo hay que
             IR EN LA DIRECCIÓN CONTRARIA con el personaje (teclas de movimiento: el héroe retrocede de verdad, con correa de 70 px; o, sin teclado, apuntando con el ratón al lado contrario). Bien: el pez se acerca y se cansa;
             mal: se aleja y la línea se tensa (la caña se dobla más) hasta que SE ROMPE (se pierde el pez, sin más castigo). Entre arrancadas hay pausas.
   · reel  — cuando se rinde queda de costado en la superficie: pulsa LMB repetidamente y lo arrastras hasta tus pies (cada LMB lo acerca); si paras, se recupera y vuelve a luchar.
   Dificultad por tier del pez (`rq`), caña (`S.tool.fi`) y nivel de Pesca. Al terminar: `fin()` (captura 3D + XP + item); ya no se encadena otro punto de pesca. Interfaz mínima: solo el «!» de la picada. Sin Math.random (PRNG `whR`). */
/* MODO DE PESCA (21 oct 2026, decisión del dueño: «el minijuego no funciona bien: guárdalo y lo mejoramos después; por ahora solo LMB cuando pique»): `FISH_MG=false` = pesca SIMPLE (picada → LMB en 1,3 s → captura). `FISH_MG=true` (o `localStorage ns_fishmg=1`, o `?fishmg` en la URL) reactiva el minijuego de lucha completo, que se CONSERVA intacto abajo (fight/reel, pez 3D, retroceso). */
let FISH_MG=false;try{FISH_MG=localStorage.getItem('ns_fishmg')==='1'||/[?&]fishmg/.test(location.search)}catch(e){}
const FISHC=['#d9772e','#7f9a86','#b9a46a','#c9553a','#5f8a78'];
const fishWait=()=>1500+whR()*13500;   // la picada tarda entre 1,5 y 15 s (decisión del dueño)
function fishInit(now){const a=ACT.fi[A.i],tier=rq(a),t=S.tool.fi||0;A.fg={st:'wait',bt:now+fishWait(),b2:0,E:100,T:0,R:0,dir:0,hd:0,pull:0,tell:0,nd:0,s:.8+tier*.012,tk:1/(1+.15*t),tol:Math.min(1.25,.85+L('fi')*.004+t*.03),miss:0,fd:0,fx:A.e.x,fy:A.e.y,fx0:0,fy0:0,fl:null,al:false,rs:0,hx:P.x,hy:P.y,col:FISHC[tier%FISHC.length],len:.5+Math.min(.12,tier*.003),dirty:0};
 mgBegin('fg')}
function fishPress(now){const g=A&&A.fg;if(!g)return;
 if(g.st==='bite'){if(!FISH_MG){g.st='done';tone(620,.1,'triangle',.08);fin(now);return}   // pesca simple: el LMB a tiempo captura
  g.st='fight';g.nd=now+700;g.fl=now;tone(620,.1,'triangle',.08);try{R3D.water.event('tug',A.e)}catch(e){}}
 else if(g.st==='reel'){g.R=Math.min(100,g.R+13);tone(460+g.R*3,.05,'triangle',.05);const f=window.R3D&&R3D.fx;if(f)f.spark(g.fx,g.fy,3,'#cfe8ff',4,{spread:.8,up:1.8,g:7,size:.07,life:.4})}
 else if(g.st==='wait'){g.bt=now+fishWait()}}   // recoger un poco la línea reinicia la espera
function fishInput(){const kd=ISO.keyDir(K.l,K.r,K.u,K.d);if(kd.x||kd.y){const l=Math.hypot(kd.x,kd.y)||1;return{x:kd.x/l,y:kd.y/l}}
 if(CUR.on){const w=ISO.toWorld(CUR.px,CUR.py,TER.heightAt),vx=w.x-P.x,vy=w.y-P.y,l=Math.hypot(vx,vy);if(l>24)return{x:vx/l,y:vy/l}}return null}
function fishTick(now,dt){const g=A.fg,e=A.e,f=window.R3D&&R3D.fx;dt=Math.min(dt,.1);
 if(g.st==='wait'){if(now>=g.bt){g.st='bite';g.b2=now+1300;g.fl=now;noise(.25,.14,1600,'bandpass');tone(300,.12,'sine',.1,-120);try{R3D.water.event('tug',e);TER.ripple(e.x,e.y)}catch(x){}if(f)f.spark(e.x,e.y,4,'#cfe8ff',8,{spread:1,up:2.2,g:7,size:.07,life:.5})}return}
 if(g.st==='bite'){if(now>g.b2){g.miss++;if(g.miss>=3)return stopA('Se escapó. Vuelve a lanzar la caña.');g.st='wait';g.bt=now+fishWait();log('El pez se soltó…')}return}
 // correa del héroe: puede retroceder hasta 70 px del sitio donde echó la caña
 {const dx=P.x-g.hx,dy=P.y-g.hy,d=Math.hypot(dx,dy);if(d>70){P.x=g.hx+dx*70/d;P.y=g.hy+dy*70/d}}
 const hd0=Math.atan2(e.y-P.y,e.x-P.x);   // dirección héroe → punto de pesca
 if(g.st==='fight'){
  if(!g.pull&&!g.tell&&now>=g.nd){g.tell=now+450;g.dir=hd0+[-1.25,-.65,0,.65,1.25][Math.floor(whR()*5)]}   // la arrancada va hacia un lado o hacia dentro del agua, nunca hacia ti
  if(g.tell&&now>=g.tell){g.tell=0;g.pull=now+1300+whR()*1100;try{R3D.water.event('tug',e)}catch(x){}noise(.18,.1,1400,'bandpass');if(f)f.spark(g.fx,g.fy,3,'#cfe8ff',6,{spread:1,up:1.8,g:7,size:.07,life:.45})}
  if(g.pull&&now>=g.pull){g.pull=0;g.nd=now+500+whR()*600}
  const pulling=!!g.pull;let al=false;if(pulling){const iv=fishInput();if(iv){const dot=iv.x*-Math.cos(g.dir)+iv.y*-Math.sin(g.dir);al=Math.acos(Math.max(-1,Math.min(1,dot)))<=g.tol}}
  if(pulling){if(al){g.E-=26*dt/g.s;g.T=Math.max(0,g.T-30*dt);g.fd=Math.max(0,g.fd-26*dt)}else{g.T+=38*dt*g.s*g.tk;g.E=Math.min(100,g.E+5*dt);g.fd=Math.min(90,g.fd+40*dt*g.s)}}else{g.T=Math.max(0,g.T-34*dt);g.E=Math.min(100,g.E+3*dt);g.fd=Math.max(0,g.fd-12*dt)}
  g.al=al;
  // posición del pez: el punto de pesca + arrancada en su dirección (sin salir del agua)
  let px=e.x+Math.cos(g.dir)*g.fd,py=e.y+Math.sin(g.dir)*g.fd;if(TER.heightAt(px,py)!==.75){g.fd=Math.max(0,g.fd-70*dt);px=e.x+Math.cos(g.dir)*g.fd;py=e.y+Math.sin(g.dir)*g.fd}g.fx=px;g.fy=py;
  const hw=g.pull||g.tell?g.dir:hd0+Math.sin(now/700)*.9;let d=hw-g.hd;d=Math.atan2(Math.sin(d),Math.cos(d));g.hd+=d*Math.min(1,dt*(g.tell?9:5));   // el pez gira hacia donde va a tirar
  if(g.T>=100){tone(180,.3,'sawtooth',.08,-80);return stopA('¡La línea se rompió! Inténtalo de nuevo.')}
  if(g.E<=0){g.st='reel';g.R=20;g.rs=now+1500;g.pull=0;g.tell=0;g.fx0=g.fx;g.fy0=g.fy;g.fl=now;snd('rare')}
  return}
 if(g.st==='reel'){if(g.R>=100){g.st='done';fin(now);return}g.R=Math.max(0,g.R-14*dt);
  const k=g.R/100,tx=P.x+Math.cos(hd0)*22,ty=P.y+Math.sin(hd0)*22;g.fx=g.fx0+(tx-g.fx0)*k;g.fy=g.fy0+(ty-g.fy0)*k;   // cada LMB lo acerca a tus pies
  g.hd+=((hd0+Math.PI)-g.hd)*Math.min(1,dt*4);
  if(g.R<=0&&now>g.rs){g.st='fight';g.E=40;g.nd=now+600;g.fd=Math.hypot(g.fx-e.x,g.fy-e.y)}}}
const fsEl=(()=>{const d=document.createElement('div');d.id='fsh';d.innerHTML='<b>!</b>';d.style.display='none';document.body.appendChild(d);return d})();   // icono de picada: DOM de la UI «Susurro» (css/hud-susurro.css, #fsh)
function fishDraw(now,dt){const g=A&&A.fg;
 if(!g||INT||CK){fsEl.style.display='none';try{R3D.water.hook(false)}catch(e){}return}
 // pez 3D enganchado (solo en lucha y recogida)
 try{if(g.st==='fight'||g.st==='reel'){const tired=g.st==='reel'?1:Math.max(0,1-g.E/60)*.6;R3D.water.hook(true,g.fx/ISO.TILE,g.fy/ISO.TILE,g.hd,tired,g.len,g.col,now/1000,dt||.016)}else R3D.water.hook(false)}catch(e){}
 // icono de picada: cristal con trazo dorado, «!» en Cinzel y un anillo que se vacía con el tiempo para clavar el anzuelo
 if(g.st==='bite'){const e=A.e,c0=ISO.toCanvas(e.x,e.y,TER.standZ(e.x,e.y)),r=cvRect(),k=r.width/cv.width,u=Math.max(0,Math.min(1,(g.b2-now)/1300));fsEl.style.display='grid';fsEl.style.transform='translate('+(r.left+c0.x*k).toFixed(1)+'px,'+(r.top+(c0.y-30*SPR*ISO.scale())*k).toFixed(1)+'px) translate(-50%,-50%)';fsEl.style.setProperty('--u',(u*360).toFixed(0)+'deg')}
 else fsEl.style.display='none'}
function startG(e,now){if(!alive(e,now))return;MOUNT.off('recolectar');const a=ACT[e.t][e.i];
 if(e.t==='he'){HERB.start(e,now);return}
 if(L(e.t)<rq(a))return log('Necesitas nivel '+rq(a)+' en '+SK[e.t][0]+'.');
 if(!room(ACT[e.t][e.i][1]))return log('Inventario lleno. Vende o usa el banco.');
 A={ty:'g',e,sk:e.t,i:e.i,t0:now,d:dur(e.t,a),pr:0,amt:hitAmt(e.t,a),per:hitPeriod(e.t),base:hitPeriod(e.t)};S.cur={sk:e.t,i:e.i};if(WHEEL_SK[e.t])whInit(now);if(e.t==='fi')fishInit(now);dirty=1}
// F5-C · el siguiente golpe se TIRA al empezar cada ciclo (no al final) para que la animación sepa si será máximo (daño amarillo) y use la versión especial del arma.
// rollAtk devuelve {m,wt,hit,d1,sp,heavy}; act() lo usa al final del ciclo si sigue valiendo (mismo objetivo y mismo tipo de arma), si no lo vuelve a tirar. `exec` se aplica al final (depende de la vida de entonces).
function rollAtk(m){const wt=wtype(),hit=sureHit(m)||Math.random()<hitChance(m),d0=hit?R(1,mxs()):0,d1=d0&&Math.random()*100<pv('crit')+(wt==='r'?ING.scope().crit:0)?Math.round(d0*1.75):d0;let sp=null;
 if(wt==='g'){const si=autoSpell();if(si>=0){const sl=SPL[si],mx=spMax(sl),h=Math.random()<spAcc(m);sp={si,hit:h,d:h?R(Math.ceil(mx*.5),mx):0,mx}}}
 return{m,wt,hit,d1,sp,heavy:wt==='g'?!!(sp&&sp.d>=2&&sp.d>=sp.mx):d1>=2&&d1>=mxs()}}
function startF(e,now){if(!alive(e,now))return;if(aimOn()&&e.d){if(e.d.ag||e.hunt)e.hunt=1;return}   /* PASIVOS (sin `ag`): llegar a ellos o pisarlos ya no los enfurece; solo aggro() al golpearles (lote FIXES-29OCT) */   // con el combate dirigido no hay «combate fijado»: se golpea apuntando (swing())
 dfpHint(e);if(manual()&&!S.hintAtk&&!e.lab){S.hintAtk=1;toast('⚔️ Mantén LMB sobre el enemigo (o la tecla <b>E</b>) para golpear. <b>Espacio</b> esquiva.',5200)}if(sealed(e)){const k=MB[e.d.id];toast('🔒 <b>'+e.d.n+'</b> está protegido por un sello. Derrota a <b>'+MD['k'+k].n+'</b> en la '+CAPN[k]+'.',4200);snd('miss');return}A={ty:'f',e,t0:now,ph:Math.max(now+(manual()?0:700),ATKT),sk:'cb',ms:manual()?manMs():atkMs()};A.nx=rollAtk(e);e.hunt=1;e.nt=Math.max(e.nt||0,now+1400);dirty=1}
function startC(sk,i){const a=ACT[sk][i];if(ownT(a))return log('Ya tienes esa herramienta.');if(L(sk)<rq(a)||!gOk(a)||!hasIn(a[1]))return log('Te faltan materiales o nivel.');
 A={ty:'c',e:S.stn,sk,i,t0:performance.now(),d:dur(sk,a),pr:0,amt:hitAmt(sk,a),per:hitPeriod(sk),left:QTY||1e9};S.cur={sk,i};if(WHEEL_SK[sk])whInit(performance.now());if(WKUI.on(sk,S.stn)){closeIW();WKUI.start(performance.now())}dirty=1}   // herrería en yunque/armero: Hoja de trabajo estilo FF14 (workui.js); el minijuego de calor fm* queda sin uso
function reseek(e,now){if(e.d&&(!S.auto||(e.d.ag&&(P.hp<maxHp()*.6||M.some(o=>o!==e&&o.hunt&&alive(o,now))))))return stopA();let b=null,bd=1e9;(e.d?M:N).forEach(o=>{if(o===e||!alive(o,now)||(e.d?o.d!==e.d:(o.t!==e.t||o.i!==e.i))||(e.d&&e.d.ag&&M.some(q=>q!==o&&q!==e&&alive(q,now)&&q.d.ag&&Math.hypot(q.x-o.x,q.y-o.y)<100)))return;const d=Math.hypot(o.x-e.x,o.y-e.y);if(d<bd){bd=d;b=o}});
 if(b){A=null;P.g={e:b}}else stopA('No quedan más cerca. Espera a que reaparezcan.')}
// ---- puntos de interés: cofres (oro + XP + a veces un drop raro; los de campamento están custodiados) y santuarios (bendición permanente de una sola vez)
function openPO(e,now){if(e.pk==='cajaIsla'){if(typeof ISLA!=='undefined')ISLA.search(e);return}if(e.pk==='cofreNaufrago'){if(typeof PLAYA!=='undefined')PLAYA.chest(e);return}if(S.poi[e.id])return log('Ya lo has saqueado.');
 if(e.pk==='cofre'&&M.some(m=>m.poi===e.id&&alive(m,now))){toast('⚔️ Derrota a los guardias del campamento primero');return}
 if(e.pk==='cofre'&&!e._ok&&typeof castStart==='function'){castStart('Abriendo el cofre…',5000,()=>{e._ok=1;try{openPO(e,performance.now())}finally{e._ok=0}},{e});return}   // 22 oct 2026: abrir un cofre de campamento = CASTEO de 5 s (animación de buscar; se interrumpe si te mueves o te hieren)

 S.poi[e.id]=1;snd('rare');
 if(e.pk==='santuario'){S[e.stat]=(S[e.stat]||0)+1;e.o={col:e.col,used:1};const tx={vig:'Vitalidad: +1 de vida máxima',wis:'Sabiduría: +5 % de experiencia',luck:'Fortuna: +25 % de suerte',trv:'Viajero: +5 % de velocidad'}[e.stat];toast('⛩️ <b>'+e.nm+'</b><br>Bendición permanente — '+tx,4200);log('⛩️ '+e.nm+': '+tx);dirty=1;save();return}
 const t=e.tier||1,c=R(50,110)*t,sk=['wc','mi','fi','co','sm','cr'][R(0,5)],xp=Math.round((40+L(sk)*7)*t);let tx='+'+money(c)+' · +'+xp+' XP '+SK[sk][0];
 earn(c);gain(sk,xp,true);if(Math.random()<.55){const r=['gema','nido','perla'][R(0,2)];if(room(r)){add(r);tx+='<br>'+ic(r)+' '+I[r][0]}}
 e.n='cofreAbierto';toast('🧰 <b>'+e.nm+'</b><br>'+tx,3800);log('🧰 '+e.nm+': '+tx.replace('<br>',' · '));dirty=1;save()}
function engage(e,now){if(e.dropG){pickG(e,now);return}if(e.po)return openPO(e,now);P.f=e.x-e.y>=P.x-P.y?1:-1;
 if(e.t)startG(e,now);else if(e.d)startF(e,now);else if(!(IW&&IW.e===e))openIW(e)}
// ---- F5-B · números de daño estilo OSRS (hitsplats): salpicadura en píxeles + dígitos de fuente 3×5 con sombra, centrados sobre el objetivo.
// Se hornea a resolución de «píxel lógico» (1 celda = 1 px) y se estampa ampliado por un entero sin suavizado → pixelado nítido. Se dibuja en coordenadas de PANTALLA
// (no dentro de spr(): allí la altura se sumaba a y del mundo y los números salían desplazados a la derecha). splat(x,y,d,c,hgt): x,y = pies del objetivo, hgt = altura sobre ellos en unidades de spr.
const HSD={0:'111101101101111',1:'010110010010111',2:'111001111100111',3:'111001111001111',4:'101101111001001',5:'111100111001111',6:'111100111101111',7:'111001010010010',8:'111101111101111',9:'111101111001111','+':'000010111010000'},HSC=new Map();
// Números de daño (oct 2026): mismo diseño de hitsplat (mancha de 17×15 con dígitos 3×5), pero horneado a F× de resolución con bordes suaves, contorno de tinta y degradado, para que no desentone con el arte pintado. Los dígitos siguen siendo píxeles.
function hsBakeCrit(txt){const key='crit|'+txt;let b=HSC.get(key);if(b)return b;
 // Golpe CRÍTICO (estilo WoW): estrella de 8 puntas de cristal dorado con halo luminoso, filo claro grueso y el número MÁS GRANDE, con degradado cálido.
 const F=6,tl=txt.length,W=(tl<=2?17:tl===3?21:25)+8,H=23,k=(W-8)/17,cx=W/2,cy=H/2,c=document.createElement('canvas');c.width=W*F;c.height=H*F;const g=c.getContext('2d');g.lineJoin='round';
 const path=sc=>{g.beginPath();for(let n=0;n<=160;n++){const a=n/160*Math.PI*2,r=(5.2+3.1*Math.pow(Math.max(0,Math.cos(4*a)),4)+.6*Math.pow(Math.max(0,Math.cos(8*a)),2))*sc,x=cx+Math.cos(a)*r*1.12*k,y=cy+Math.sin(a)*r;n?g.lineTo(x*F,y*F):g.moveTo(x*F,y*F)}g.closePath()};
 g.save();g.shadowColor='rgba(255,205,90,.95)';g.shadowBlur=F*3.2;path(1);g.fillStyle='#5a3a0c';g.fill();g.restore();                       // halo
 path(1);const gr=g.createRadialGradient(cx*F,(cy-2)*F,0,cx*F,cy*F,9*F*k);gr.addColorStop(0,'#e8b650');gr.addColorStop(.55,'#9a6a1c');gr.addColorStop(1,'#4a2c08');g.fillStyle=gr;g.fill();
 g.save();path(1);g.clip();const hl=g.createLinearGradient(0,2*F,0,cy*F);hl.addColorStop(0,'rgba(255,248,214,.45)');hl.addColorStop(1,'rgba(255,248,214,0)');g.fillStyle=hl;g.fillRect(0,0,W*F,cy*F);g.restore();
 path(1);g.strokeStyle='#fff1c8';g.lineWidth=F*.5;g.stroke();path(.82);g.strokeStyle='rgba(255,226,150,.55)';g.lineWidth=F*.22;g.stroke();
 g.textAlign='center';g.textBaseline='middle';g.font='700 '+(tl>3?6.4:tl>2?7.8:9.4)*F+'px Cinzel,Spectral,Georgia,serif';
 g.shadowColor='rgba(40,16,0,.95)';g.shadowBlur=F*1.1;g.shadowOffsetY=F*.4;const tg=g.createLinearGradient(0,(cy-4)*F,0,(cy+4)*F);tg.addColorStop(0,'#fffbe8');tg.addColorStop(1,'#ffe39a');g.fillStyle=tg;g.fillText(txt,cx*F,(cy+.6)*F);
 b={c,W,H};if(HSC.size>120)HSC.delete(HSC.keys().next().value);HSC.set(key,b);return b}
function hsBake(col,txt){const key=col+'|'+txt;let b=HSC.get(key);if(b)return b;
 // Hitsplat estilo OSRS con el lenguaje «cristal» de la interfaz nueva (oct 2026, 2.ª versión, menos «cartoon»): mancha de borde apenas festoneado, relleno de cristal teñido
 // (oscuro, translúcido) con velo de color, filo FINO claro (dorado en el golpe máximo), brillo suave arriba y el número en Cinzel crema con sombra suave (sin contorno grueso).
 const F=6,W=txt.length<=2?17:txt.length===3?21:25,H=15,k=W/17,cx=W/2,cy=7.5,c=document.createElement('canvas');c.width=W*F;c.height=H*F;const g=c.getContext('2d');g.lineJoin='round';
 const gold=col==='#c9a24a',deep=PAINT.mix(col,'#0e0806',.62),tint=PAINT.mix(col,'#0e0806',.3),ring=gold?'#e8cf94':PAINT.mix(col,'#ffffff',.5);
 const path=sc=>{g.beginPath();for(let n=0;n<=120;n++){const a=n/120*Math.PI*2,r=(5.6+.75*Math.pow(Math.max(0,Math.cos(5*a+.6)),2))*sc,x=cx+Math.cos(a)*r*1.12*k,y=cy+Math.sin(a)*r;n?g.lineTo(x*F,y*F):g.moveTo(x*F,y*F)}g.closePath()};
 g.save();g.shadowColor='rgba(0,0,0,.55)';g.shadowBlur=F*1.1;g.shadowOffsetY=F*.35;path(1);g.fillStyle=deep;g.globalAlpha=.9;g.fill();g.restore();   // cuerpo de cristal oscuro con sombra suave
 path(1);const gr=g.createRadialGradient(cx*F,(cy-2.2)*F,0,cx*F,cy*F,7.2*F*k);gr.addColorStop(0,tint);gr.addColorStop(1,deep);g.globalAlpha=.92;g.fillStyle=gr;g.fill();g.globalAlpha=1;
 g.save();path(1);g.clip();const hl=g.createLinearGradient(0,1.5*F,0,8*F);hl.addColorStop(0,'rgba(255,255,255,.2)');hl.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=hl;g.fillRect(0,0,W*F,8*F);
 const tv=g.createRadialGradient(cx*F,cy*F,2*F,cx*F,cy*F,7.4*F*k);tv.addColorStop(0,'rgba(0,0,0,0)');tv.addColorStop(1,PAINT.mix(col,'#000000',.2)+'99');g.fillStyle=tv;g.fillRect(0,0,W*F,H*F);g.restore();   // velo de color hacia el borde
 path(1);g.strokeStyle=ring;g.globalAlpha=.9;g.lineWidth=F*.34;g.stroke();g.globalAlpha=1;                                                                           // filo fino
 g.textAlign='center';g.textBaseline='middle';g.font='700 '+(txt.length>3?5.2:txt.length>2?6.2:7.4)*F+'px Cinzel,Spectral,Georgia,serif';
 g.shadowColor='rgba(0,0,0,.9)';g.shadowBlur=F*.9;g.shadowOffsetY=F*.3;g.fillStyle=gold?'#fff1c8':'#f6eddb';g.fillText(txt,cx*F,(cy+.5)*F);
 b={c,W,H};if(HSC.size>120)HSC.delete(HSC.keys().next().value);HSC.set(key,b);return b}
function hsDraw(p){const cr=!!p.cr,b=cr?hsBakeCrit(p.tx):hsBake(p.hs,p.tx),q=ISO.toCanvas(p.x,p.y,TER.standZ(p.x,p.y)),s=ISO.scale(),px=Math.max(2,Math.round(s*1.1)),age=(p.L0||1.2)-p.l;
 /* CÓMO «POPEAN» (lote DAÑO-PAUSA, 28 oct 2026; sustituye al movimiento de DAÑO-WOW): el número nace sobre la placa con el POP de siempre (×.55 → ×1,18 → ×1),
    SE QUEDA QUIETO en su sitio ~0,55 s (la «dopamina») y luego sube despacio y se desvanece. CRÍTICO: nace grande (×2,6), se asienta en ×1,75 y se queda quieto 0,8 s.
    DAÑO POR TIEMPO ×0,72 (`sk`). Los números de un mismo enemigo no se pisan: cada uno va a un CARRIL (`p.ln`: centro, derecha, izquierda…) elegido al nacer en `splat`. */
 const ezo=t=>1-Math.pow(1-Math.max(0,Math.min(1,t)),3),L0=p.L0||1.2,u=Math.min(1,age/L0),bs=p.sk||1,hold=cr?.8:.55;let sc,rise,al;
 if(!cr)sc=(age<.13?.55+.63*ezo(age/.13):1.18-.18*ezo((age-.13)/.12))*bs;
 else sc=age<.15?2.6-.85*ezo(age/.15):1.75;
 rise=ezo((age-hold)/(L0-hold))*b.H*px*(cr?.7:.9);al=u<.7?1:1-(u-.7)/.3;al=Math.max(0,Math.min(1,al));
 const row=Math.ceil((p.ln||0)/2),side=p.ln?((p.ln%2)?1:-1):0,lw=19*px*.62,lh=15*px*.95;   // CARRIL: 0 centro · impares a la derecha · pares a la izquierda, cada pareja una fila más arriba (racimo compacto junto al enemigo)
 const dw=b.W*px*sc,dh=b.H*px*sc,cx=q.x+p.jx*px+side*lw;let cy=q.y-p.h*SPR*s-rise;
 if(p.m){const top=(window.R3D&&R3D.actors&&R3D.actors.topPx(p.m))||(p.m.d&&p.m.d.h)||p.h,r=cvRect(),kk=r.width/cv.width||1,nb=q.y-(top+4)*SPR*s,base=nb-(p.m._nph||26)/kk+b.H*px*.45;   /* un poco más abajo (dueño, 28 oct): el borde inferior del número roza el borde superior de la placa */
  cy=base-b.H*px*bs*.5-rise-row*lh-(cr?dh*.3:0)}   /* sobre la placa y los iconos de estado (son DOM y van encima del lienzo: debajo los taparían) */
 const x=Math.round(cx-dw/2),y=Math.round(cy-dh/2);
 ctx.setTransform(1,0,0,1,0,0);ctx.save();
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.globalAlpha=al;
 ctx.drawImage(b.c,x,y,dw,dh);
 ctx.restore()}
// ---- F5-C · efectos del golpe máximo (daño amarillo), en coordenadas de pantalla y pixelados como los hitsplats: 'star' (estallido de 8 rayos en el objetivo), 'thrust' (estocada: estela dorada de la mano al objetivo),
// 'punch' (puñetazo: estela + onda circular). Los proyectiles (flecha/orbe) se dibujan en drawPJ con la variante hv. Todo vive ≤0,4 s; no se guarda.
let HFX=[];
function drawHFX(now){if(!HFX.length)return;HFX=HFX.filter(f=>now-f.t0<f.d);const s=ISO.scale(),k=SPR*s,px=Math.max(2,Math.round(s));ctx.setTransform(1,0,0,1,0,0);ctx.save();ctx.imageSmoothingEnabled=false;
 const sq=(x,y,c,a)=>{ctx.globalAlpha=Math.max(0,a);ctx.fillStyle=c;ctx.fillRect(Math.round(x/px)*px,Math.round(y/px)*px,px,px)};
 HFX.forEach(f=>{const u=(now-f.t0)/f.d,B=ISO.toCanvas(f.tx,f.ty,TER.standZ(f.tx,f.ty)),bx=B.x,by=B.y-f.th*k;
  if(f.k==='star'||f.k==='punch'){for(let r=0;r<8;r++){const an=r*Math.PI/4+(f.k==='punch'?.39:0),r0=(2+u*5)*px,r1=r0+(4+(r%2?0:3))*px*(1-u*.5);for(let d=r0;d<=r1;d+=px)sq(bx+Math.cos(an)*d,by+Math.sin(an)*d,d>r1-px*1.5?'#e8cf94':'#fff6b0',1-u)}}
  if(f.k==='punch'&&u<.9){const R0=(3+u*12)*px;for(let i=0;i<20;i++){const an=i*Math.PI/10;sq(bx+Math.cos(an)*R0,by+Math.sin(an)*R0*.8,'#ffd23a',.9-u)}}
  if(f.k==='thrust'||f.k==='punch'){const A0=ISO.toCanvas(f.x,f.y,TER.standZ(f.x,f.y)),ax=A0.x,ay=A0.y-20*k,dx=bx-ax,dy=by-ay,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,head=Math.min(1,u*3.2),tail=Math.max(0,head-.55);
   for(let t=tail;t<=head;t+=px/L){const w=(t-tail)/(head-tail||1),a=(1-u)*(.25+.75*w);for(let o=-1;o<=1;o++){if(o&&w<.5)continue;sq(ax+dx*t+nx*o*px,ay+dy*t+ny*o*px,o?'#ffd23a':'#fffbe0',a)}}}});
 ctx.restore()}
// proyectil en pantalla: arma normal = flecha fina / orbe; hv (golpe máximo) = flecha dorada gruesa con estela, u orbe grande con aro y chispas
function drawPJ(p,now){if(p.fb)return;   // la bola de fuego se dibuja en 3D (R3D.spell)
 const s=ISO.scale(),k=SPR*s,px=Math.max(2,Math.round(s)),u=Math.min(1,(now-p.t0)/(p.t1-p.t0)),A0=ISO.toCanvas(p.x,p.y,TER.standZ(p.x,p.y)),B0=ISO.toCanvas(p.tx,p.ty,TER.standZ(p.tx,p.ty)),
  ax=A0.x,ay=A0.y-p.sh*k,bx=B0.x,by=B0.y-p.th*k,pos=v=>[ax+(bx-ax)*v,ay+(by-ay)*v-Math.sin(v*Math.PI)*8*k],[x,y]=pos(u),an=Math.atan2(by-ay,bx-ax),ca=Math.cos(an),sa=Math.sin(an);
 ctx.setTransform(1,0,0,1,0,0);ctx.save();
 const sq=(X,Y,c,a)=>{ctx.globalAlpha=Math.max(0,a);ctx.fillStyle=c;ctx.fillRect(Math.round(X/px)*px,Math.round(Y/px)*px,px,px)};
 if(p.wt==='r'){if(p.hv){ctx.imageSmoothingEnabled=false;for(let i=0;i<22;i++){const v=Math.max(0,u-i*.012),[X,Y]=pos(v);sq(X,Y,i<9?'#fffbe0':'#ffd23a',(1-i/22)*.9)}
    for(let i=0;i<7;i++)sq(x-ca*i*px*1.6,y-sa*i*px*1.6,i<2?'#fff':'#ffb830',1);sq(x+ca*px,y+sa*px,'#fff',1);sq(x+ca*px*2,y+sa*px*2,'#ffd23a',1)}
  else{ctx.strokeStyle='#d8c9a3';ctx.lineWidth=2*s*.7;ctx.beginPath();ctx.moveTo(x-ca*8*s,y-sa*8*s);ctx.lineTo(x+ca*4*s,y+sa*4*s);ctx.stroke()}}
 else if(p.hv){ctx.imageSmoothingEnabled=false;const col=p.col||ORB[tierOf(S.eq.w||'st_pino')]||'#9cf';for(let i=0;i<14;i++){const [X,Y]=pos(Math.max(0,u-i*.014));ctx.globalAlpha=(1-i/14)*.5;ctx.fillStyle=col;const r=Math.max(px,Math.round((7-i*.35)*s/px)*px);ctx.fillRect(Math.round((X-r/2)/px)*px,Math.round((Y-r/2)/px)*px,r,r)}
  ctx.globalAlpha=.95;ctx.fillStyle=col;const R1=Math.round(9*s/px)*px;ctx.fillRect(Math.round((x-R1/2)/px)*px,Math.round((y-R1/2)/px)*px,R1,R1);ctx.fillStyle='#fff';const R2=Math.round(4.5*s/px)*px;ctx.fillRect(Math.round((x-R2/2)/px)*px,Math.round((y-R2/2)/px)*px,R2,R2);
  for(let i=0;i<8;i++){const a2=i*Math.PI/4+u*9;sq(x+Math.cos(a2)*8*s,y+Math.sin(a2)*8*s,'#e8cf94',.9)}}
 else{ctx.globalAlpha=.8;ctx.fillStyle=p.col||ORB[tierOf(S.eq.w||'st_pino')]||'#9cf';ctx.beginPath();ctx.arc(x,y,6*s,0,7);ctx.fill()}
 ctx.restore()}
function splat(x,y,d,c,hgt,crit,sk,m){const L0=m?(crit?1.95:1.4):crit?1.75:1.2;let ln=0;if(m){const used=new Set();for(const q of parts)if(q.m===m&&q.tx&&(q.L0-q.l)<.9)used.add(q.ln);while(used.has(ln))ln++}parts.push({ln,x,y,vx:0,vy:0,g:0,l:L0,L0,cr:crit?1:0,sk:sk||1,tx:String(d),hs:(d>0||c)?(c||'#d4261c'):'#2f6fdc',h:hgt||0,m:m||null,jx:Math.round((Math.random()-.5)*(crit?2:5))})}   // m = enemigo: el número nace en su cuerpo y nunca lo tapa su placa de vida ni los iconos de estado (lote DAÑO-LEGIBLE, 28 oct 2026)   // crit=1: golpe crítico (máximo) → estallido grande, estilo WoW (ver hsBake/hsDraw)
// Comer es manual: LMB en la comida del inventario. La cura es PROGRESIVA: cada bocado añade a la cola HOT y cada ~0,6 s se aplica un paso con un «+N» verde.
let HOT=[],EATCD=0,QCD=0;const QUICKH=8; // lote B2: comer retrasa el SIGUIENTE ataque (comida normal 1,8 s · bocado rápido de ≤8 PV y pociones 0,6 s). Un bocado rápido se puede comer a la vez que una comida normal (COMBO) y sus retrasos no se suman.
function eatDelay(now,ms){ATKT=Math.max(ATKT,now+ms);if(A&&A.ty==='f')A.ph=Math.max(A.ph,now+ms)}
const hotLeft=()=>HOT.reduce((a,h)=>a+h.left,0);
function hotTick(now){if(!HOT.length)return;if(P.hp<=0){HOT=[];return}
 for(const h of HOT)if(now>=h.t){h.t=now+600;const d=Math.min(Math.max(1,Math.round(h.step*STS.healM(P))),h.left,Math.max(0,maxHp()-P.hp));   /* Toxina/Maldición reducen la curación */h.left-=h.step;if(d>0){P.hp+=d;splat(P.x,P.y,'+'+d,'#2f9a3a',30);sp(P.x,P.y+2,'#6fe07a',3,26,24,-30);dirty=1}else h.left=0}
 HOT=HOT.filter(h=>h.left>0);if(HOT.length&&Math.random()<.25)sp(P.x+(Math.random()-.5)*14,P.y+3,'#8ff09a',1,6,26,-30)}
function die(){if(typeof ISLA!=='undefined'&&ISLA.noDie())return;MOUNT.off();P.dot=null;KNV.length=0;STS.clear(P);if(INT)leaveRoom(1);snd('die');HOT=[];P.pjM=null;M.forEach(m=>m.hunt=0);P.hp=maxHp();{const q=spawnOf(spawnK());P.x=q.x;P.y=q.y}FD=performance.now();P.g=P.mv=null;stopA();toast('☠️ Moriste. Despiertas en '+(BI[spawnK()].village&&BI[spawnK()].n?'la aldea de '+BI[spawnK()].n:'el campamento')+'.');}
const MB={};BI.forEach((b,k)=>{[...b.mobs.ing,b.mobs.pack,'b'+k,...(b.camp?['orco']:[])].forEach(id=>{if(MB[id]==null)MB[id]=k})});   /* Fase 49a: el primer bioma que lo usa lo conserva (los esqueletos toman mobs prestados) */ // monstruo → bioma al que pertenece (jefe que lo cierra)
Object.assign(MB,{bandido:0,k0:0,oso:1,k1:1,bruja:2,k2:2,gigante:3,k3:3,shinobi:4,k4:4,golem:5,k5:5});
const CAPN=['Guarida de bandidos','Cueva del oso','Aquelarre','Fortaleza del gigante','Dojo de sombras','Forja del coloso'];
function addLoot(id,gx,gy){const it=LOOT[id],c=RAR[it.r][1];if(gx!=null)dropGround(id,gx,gy);else if(room(id))S.inv.push(id);else{S.bank[id]=(S.bank[id]||0)+1;log('Tu mochila está llena: '+I[id][0]+' fue al banco.')}
 disc(id);inc('loot:'+it.r);log('<span style="color:'+c+'">¡Botín '+RAR[it.r][0].toLowerCase()+': '+I[id][0]+'!'+(gx!=null?' (en el suelo)':'')+'</span>');
 if(it.r>=2)toast('<span style="color:'+c+'">'+RAR[it.r][0]+'</span><br><b style="color:'+c+'">'+ic(id)+' '+I[id][0]+'</b>',it.r>=3?5500:3500);
 if(gx==null)sp(P.x,P.y-20,c,it.r*12,150,130,170);else sp(gx,gy-10,c,it.r*8,120,100,150);snd(it.r>=3?'epic':it.r===2?'rare':'coin');dirty=1}
function rollLoot(m,bm){const k=MB[m.d.id],dl=Math.max(0,m.lv-m.d.lv),mu=(1+.25*S.luck+.015*dl+pv('prosp')/100)*(1+Math.min(1,S.pity/400)),r=Math.random(),pE=.00015*mu*(bm||1),pB=.0011*mu*(bm||1),pG=.011*mu*(bm||1);   // lote D4: verde 3,4 %→1,1 %, azul 0,45 %→0,11 %, épico 0,018 %→0,015 % (pedido: que un raro se sienta)
 let q=0;if(r<pE)q=3;else if(r<pE+pB)q=2;else if(r<pE+pB+pG)q=1;if(!q){S.pity++;return}S.pity=0;const sl=['h','f','r','n','w','c','s','l','g','m'][R(0,9)];addLoot(sl==='w'?(typeof ENCH!=='undefined'?ENCH.lootRoll('lw_'+k+'dmbc'[R(0,3)]+q,q):'lw_'+k+'dmbc'[R(0,3)]+q):'lt_'+k+sl+q,m.x,m.y)}
const BRESP=BI.map(b=>b.bossResp),BRN=BI.map(b=>b.bossRunes),RNN={air:'aire',earth:'tierra',life:'vida',water:'agua',fire:'fuego',arc:'arcana'};
function bossKill(m,now){const bk=MB[m.d.id],first=!S.boss[bk];S.boss[bk]=1;const got=BRN[bk].map(([k,a,b])=>{const n=R(a,b);S.runes[k]=(S.runes[k]||0)+n;disc('rn_'+k);return n+' de '+RNN[k]});log('👑 Runas del jefe: '+got.join(', '));
 banner('👑 ¡'+m.d.n+' ha caído!',(first?(bk<BIOMES.N-1?'Hito del '+BI[bk].n+' superado':'¡Has derrotado al último jefe!'):'Runas: '+got.join(', '))+' · reaparece en '+BRESP[bk]+' s','#ff9a3a',5200);snd('epic');sp(m.x,m.y-20,'#e8cf94',30,160,140,180);dirty=1}
// Sello del capitán (progresión v2): el jefe de cada bioma está SELLADO hasta derrotar al capitán de su guarida (S.key[bioma]); es lo que obliga a visitar el campamento extra
const sealed=m=>m.d.boss===1&&!S.key[MB[m.d.id]];
function capKill(m,now){const k=MB[m.d.id],first=!S.key[k];S.key[k]=1;if(first){S.st.caps=(S.st.caps||0)+1;banner('🗝️ ¡Sello conseguido!','Ya puedes desafiar a '+MD['b'+k].n,'#6ad0ff',4800);snd('epic');sp(m.x,m.y-20,'#6ad0ff',26,140,120,160);log('<span style="color:#6ad0ff">🗝️ Sello de '+BI[k].n+': el jefe '+MD['b'+k].n+' ya no está protegido.</span>')}else log('Capitán derrotado (ya tenías el sello).');dirty=1;save()}
function bossHTML(){const now=performance.now();return '<div style="margin-top:12px;border-top:2px dashed var(--hi);padding-top:6px">👑 Jefes (hitos: runas y logros; el camino ya está abierto)<div class="hint" style="margin:0">'+BI.map((_,k)=>k).filter(k=>!BI[k].noBoss).map(k=>{const m=M.find(x=>x.d.id==='b'+k),dead=m&&!alive(m,now);return (S.boss[k]?'✔ ':S.key[k]?'⚔ ':'🔒 ')+MD['b'+k].n+(S.boss[k]?'':S.key[k]?' · 🗝️ sello obtenido':' · sellado: derrota a '+MD['k'+k].n+' ('+CAPN[k]+')')+(dead?' · reaparece en '+Math.ceil((m.rt-now)/1000)+' s':'')}).join('<br>')+'</div></div>'}
const RUD={goblinarq:[['air',2,5,.5]],goblinsha:[['arc',1,3,.4],['air',2,5,.4]],espantapajaros:[['earth',2,5,.5],['life',1,3,.3]],slime:[['water',1,3,.5]],banasesino:[['air',3,7,.6]],orcocampeon:[['earth',3,8,.6],['fire',1,3,.3]],cabra:[['earth',1,3,.4]],cerdo:[['earth',1,3,.4],['life',1,2,.3]],conejo:[['air',1,3,.6]],zorrorojo:[['air',2,5,.5],['fire',1,3,.3]],toro:[['earth',3,8,.7],['life',2,5,.5]],gallina:[['air',1,3,.7]],cordero:[['air',1,3,.7]],vaca:[['earth',1,3,.4]],oveja:[['earth',1,3,.4]],goblin:[['air',2,6,.6],['earth',1,4,.4]],orco:[['earth',2,6,.5],['life',1,3,.3]],jabali:[['life',1,3,.4]],lobo:[['air',3,8,.5],['earth',3,6,.4]],rana:[['water',2,6,.6]],esqueleto:[['earth',3,8,.5],['life',2,5,.4]],yak:[['water',2,5,.4]],ogro:[['fire',2,5,.4],['earth',4,8,.4]],lagarto:[['fire',2,6,.6]],demonio:[['fire',3,8,.5],['arc',1,2,.25]],bandido:[['air',2,5,.5],['earth',1,3,.3]],oso:[['earth',2,5,.5],['life',1,4,.4]],bruja:[['water',3,8,.6],['arc',1,3,.4],['life',2,5,.4]],gigante:[['water',3,8,.5],['fire',2,6,.4]],shinobi:[['air',4,10,.6],['arc',2,4,.4]],golem:[['earth',4,10,.6],['fire',3,8,.5],['arc',2,5,.4]],
 k0:[['air',4,8,1],['earth',3,6,1]],k1:[['earth',5,10,1],['life',4,8,1]],k2:[['water',6,12,1],['life',4,8,1],['arc',2,4,1]],k3:[['water',6,12,1],['fire',4,8,1],['arc',2,4,1]],k4:[['air',8,16,1],['arc',4,8,1]],k5:[['earth',8,16,1],['fire',6,12,1],['arc',4,8,1]]};
const DRMAX=.75;   // lote D4: ningún drop supera el 75 % (antes casi todo era 100 %); bajan según rareza (ver MD[].dr). Las runas de los monstruos ×0.6.
function kill(m,now){if(m.sm){snd('kill');m.rt=now+1;return}const d=m.d;try{STS.onKill(m,now)}catch(x){}   /* ESTADOS: Incinerar salta a los cercanos */
 if(window.R3D&&R3D.blood){try{R3D.blood.death(m,now)}catch(e){}}   /* Lote R3D-SANGRE: charco bajo el cuerpo */
 try{ENCH.drop(m)}catch(x){}snd('kill');m.rt=now+(d.boss===1?BRESP[MB[d.id]]*1000:d.boss===2?120000:12000);if(SKINNABLE.includes(d.id)&&!m.poi){m.skin={done:0};m.rt=Math.max(m.rt,now+40000)}if(m.poi)m.rt=Math.max(m.rt,now+POI_RESP);   /* CAMPAMENTOS (22 oct 2026): sus guardias y el capitán tardan 4 min en reaparecer (antes 12 s/2 min: no se podía limpiar el campamento para abrir el cofre ni pelear contra el capitán sin que reaparecieran) */
 const dl=Math.max(0,m.lv-d.lv);earn(Math.round(R(d.co[0],d.co[1])*(1+.05*dl)*(1+pv('prosp')/100)));MN=Math.min(mnMax(),MN+Math.round(pv('siph')));d.dr.forEach(([id,p])=>{if(m.skin&&HID.includes(id))return;if(Math.random()<Math.min(DRMAX,p*(1+.03*dl)))dropGround(id,m.x,m.y)});(RUD[d.id]||[]).forEach(([k,a,b,p])=>{if(Math.random()<Math.min(DRMAX,p*.6*(1+.03*dl))){const n=R(a,b);S.runes[k]=(S.runes[k]||0)+n;disc('rn_'+k);log('<span style="color:#c8a0ff">+'+n+' runa'+(n>1?'s':'')+' de '+RNN[k]+'</span>')}});
 if(d.rare&&Math.random()<(1+.25*S.luck+.02*dl)/d.rare[1]){dropGround(d.rare[0],m.x,m.y,{rare:1});inc('rare');toast(ic(d.rare[0])+' ¡Drop raro: <b>'+I[d.rare[0]][0]+'</b>!',3000)}
 inc('kill:'+d.id);log('Mataste a '+d.n+' (nv. '+m.lv+').');if(d.boss===1)bossKill(m,now);else if(d.boss===2)capKill(m,now);rollLoot(m,d.boss===1?3:d.boss===2?2:1);if(m.tmp){qMobDead(m);dirty=1;return}rollLv(m);dirty=1}
function fin(now){const{ty,sk,i,e}=A,a=ACT[sk][i],cb=sk==='co'?count(a[2]):0;if(ty==='c'&&A.wh)QBON=1+1.4*(A.tot?A.perf/A.tot:0);const okA=stepAct(sk,i,false,(A.wh&&ty==='g'&&sk!=='fi')?e:null);QBON=1;if(!okA){stopA();return}if(sk==='fi'&&window.R3D&&R3D.water)R3D.water.event('catch',e);   // R3D-AGUA-IMPL: captura = chapuzón + el pez vuela a la mano
 if(ty==='c'){if(A.wh){A.pr=0;A.perf=0;A.tot=0;A.wl=now}A.left--;if(sk==='co'&&count(a[2])>cb&&Math.random()<BONUSP+.04*S.cfg){BL=A.left;dirty=1;save();stopA();startBonus(i);return}
  if(!hasIn(a[1])){dirty=1;save();stopA('Te quedaste sin materiales.');return}if(A.left<=0){dirty=1;save();stopA('Listo: terminaste la tanda.');return}}
 if(ty==='g'&&e.g){gain(sk,xv(ACT[sk][i])*4);earn(20+L(sk)*2);toast('✨ ¡Recurso dorado! Bonus de XP y oro');snd('rare');if(A.wh&&sk!=='fi')for(let n=0;n<3;n++)dropGround(a[1],e.x,e.y,{au:1,rare:1})}if(ty==='g'){if((sk==='wc'||sk==='mi')&&window.R3D&&R3D.res){try{R3D.res.fell(e,P.x,P.y)}catch(x){}
   if(sk==='wc'){noise(.5,.1,320,'bandpass');tone(95,.55,'sawtooth',.05,-35);setTimeout(()=>{noise(.35,.2,140,'lowpass');tone(60,.3,'sine',.25,-20);noise(.5,.08,2500,'highpass')},1750)}
   else{noise(.25,.2,500,'lowpass');noise(.12,.12,3200,'highpass');tone(110,.2,'sine',.2,-60);setTimeout(()=>noise(.15,.1,1800,'bandpass'),320)}}   /* el árbol cae / la mena se rompe (nature3d.js `fell`) + su sonido */
  e.rt=now+{wc:9000,mi:6000,fi:5000}[sk];if(A&&(A.wh||A.fg))stopA();else reseek(e,now);relocDefer(e)}
 dirty=1;save()}
/* EFECTOS DE ESTADO (21 oct 2026; decisión del dueño): cada efecto tiene SU COLOR (`STC`) en los números de daño y el daño por estado NO da XP (ni de Magia ni de nada: subían la magia demasiado rápido). `dotHit()` es el golpe de un efecto
   sobre un enemigo (quemadura, sangrado…); los efectos que sufre el jugador usan los mismos colores (`DOTN` en combat.js). Se reorganizará con el motor de estados alterados (Fase 23). */
const STC={burn:'#ff8a2a',incinerate:'#e8202e',bleed:'#d4261c',hemorrhage:'#e8306e',poison:'#6ad04a',toxin:'#1ee0a0',curse:'#9a48ff',doom:'#e050ff',void:'#b060ff',manaburn:'#4a8cff',arcane:'#4a8cff',shock:'#4ab4ff',overload:'#8ae8ff',frost:'#cfeeff',holy:'#ffe9a0',thorns:'#c8a070',stun:'#e8d36a'};   // lote DAÑO-LEGIBLE (28 oct 2026): un color por elemento y otro para su versión fuerte (Quemadura naranja · Incinerar carmesí · Toxina turquesa…). '#c9a24a' queda reservado al golpe máximo
function dotHit(m,d,now,kind){if(!alive(m,now)||!(d>0))return;m.hp-=d;m.fl=now+80;splat(m.x,m.y,d,STC[kind]||'#ffffff',m.d.h+6,0,.72,m);if(m.hp<=0){kill(m,now);if(A&&A.e===m)reseek(m,now)}}
/* ═══ STAGGER (22 oct 2026; pedido del dueño) ═══ Cada enemigo con daño (y todo jefe/élite) tiene una barra de STAGGER (`m.sg` de `m.sgM`): cada golpe que recibes la baja (el pesado/cargado más), tarda `SG.wait` ms en regenerarse. A 0 queda ATURDIDO `SG.stunMs` ms
   (jefes `SG.bossMs`): no actúa, recibe ×1,5 de daño y el PRIMER golpe que le des siempre acierta; luego tiene `SG.imm` ms de inmunidad al stagger. La barra se ve en la barra de jefe (`.bb-s`) y en el nameplate (`.nps`). PARADA PERFECTA = contraataque (`m.rip`): quita el 60 % del stagger y abre una ventana de 1,6 s con ×2 de daño y golpe seguro.
   Neutrales sin daño (gallinas, corderos) no tienen stagger. DoT/quemadura (mxv 99) no lo tocan. Constantes en `SG`. */
const SG={wait:3500,regen:.25,stunMs:3000,bossMs:3200,imm:7000,mulStun:1.5,mulRip:2,ripMs:1600};let RIP=null,FTI=0;
function sgInit(m){const d=m.d;if(m.sm||(d.dmg===0&&!d.boss&&!m.elite))return 0;m.sgM=Math.max(4,Math.round(m.mh*(d.boss===2?.4:(d.boss===1||m.elite)?.45:.5)));m.sg=m.sgM;return m.sgM}
function stagger(m,amt,now){if(m.hp<=0||m.stun>now||(m.sgIm||0)>now)return;if(m.sgM==null&&!sgInit(m))return;if(!m.sgM)return;m.sg=Math.max(0,(m.sg==null?m.sgM:m.sg)-amt);m.sgT=now+SG.wait;if(m.sg<=0)stunStart(m,now,(m.d.boss===1||m.elite)?SG.bossMs:SG.stunMs)}
function stunStart(m,now,ms){m.stun=now+ms;m.sg=0;m.stSure=0;m.sgIm=now+ms+SG.imm;m.wind=null;m.tel=null;m.nt=Math.max(m.nt||0,m.stun+500);m.fl=now+220;
 sp(m.x,m.y-m.d.h*.6,'#ffe9a8',16,110,80,130);sp(m.x,m.y-m.d.h*.6,'#ffffff',8,70,60,110);SHK=Math.max(SHK,now+180);try{tone(190,.3,'sawtooth',.06,80);tone(1320,.18,'triangle',.05,1800)}catch(e){}
 fText('¡ATURDIDO!','#ffe08a',m.x,m.y,m.d.h+16);log('💫 <b>'+m.d.n+'</b> queda aturdido: recibe más daño y tu primer golpe acierta.')}
function sgTick(dt,now){for(const m of M){if(!m.sgM)continue;if(m.stun&&now>=m.stun){m.stun=0;m.sg=m.sgM;m.nt=Math.max(m.nt||0,now+700);continue}
  if(m.stun>now){const q=(now/120)|0;if(q!==m._sgf){m._sgf=q;const a=now/160;sp(m.x+Math.cos(a)*11,m.y-m.d.h*1.02,'#ffe9a8',1,8,16,-20)}continue}
  if(now>(m.sgT||0)&&m.sg<m.sgM)m.sg=Math.min(m.sgM,m.sg+m.sgM*SG.regen*dt)}}
const sureHit=m=>{const n=performance.now();if(m.stun>n&&!m.stSure){m.stSure=1;return true}if(m.rip>n&&!m.ripSure){m.ripSure=1;return true}return false};
// TEXTO FLOTANTE de feedback (parada, esquiva, mitigado, aturdido…): DOM sobre un punto del mundo, sube y se desvanece (≈ 1 s)
function fText(tx,c,wx,wy,hpx,cls){if(!npRoot){npRoot=document.createElement('div');npRoot.id='nps';document.body.appendChild(npRoot)}
 const el=document.createElement('div');el.className='ftx'+(cls?' '+cls:'');el.textContent=tx;el.style.color=c;const cc=ISO.toCanvas(wx,wy,TER.standZ(wx,wy)),r=cvRect(),k=r.width/cv.width;FTI=(FTI+1)%3;
 el.style.left=(r.left+cc.x*k)+'px';el.style.top=(r.top+(cc.y-(hpx||40)*SPR*ISO.scale())*k-FTI*15)+'px';npRoot.appendChild(el);if(cls==='react'||cls==='sts')el.style.setProperty('--gc',c);setTimeout(()=>el.remove(),cls==='react'?1750:cls==='ench'?1500:cls==='sts'?1350:1150)}
// IMÁN de dirección del golpe cuerpo a cuerpo (22 oct 2026): el swing se corrige hasta ≈ 17° hacia el enemigo más cercano a donde apuntas (el fijado con Tab pesa el doble); con un CONTRAATAQUE activo apunta solo al enemigo parado. Solo cuerpo a cuerpo.
function magnetAng(a,now){if(wtype()!=='m'||(wKind()==='staff'&&skl().sel))return a;const reach=(wKind()==='dagger'?66:wKind()==='great'?92:80)+10;
 if(RIP&&RIP.rip>now&&alive(RIP,now)&&Math.hypot(RIP.x-P.x,RIP.y-P.y)<160)return Math.atan2(RIP.y-P.y,RIP.x-P.x);
 let best=null,bd=.3;for(const m of M){if(!alive(m,now)||sealed(m))continue;const vx=m.x-P.x,vy=m.y-P.y,d=Math.hypot(vx,vy);if(d>reach+(m.d.w||16)*.3)continue;let df=Math.abs(Math.atan2(vy,vx)-a);df=df>Math.PI?2*Math.PI-df:df;if(m===LOCK)df*=.5;if(df<bd){bd=df;best=m}}
 return best?Math.atan2(best.y-P.y,best.x-P.x):a}
/* ═══ SENSACIÓN DE GOLPE (22 oct 2026; referencia Valheim: «los hits se sienten pesados») ═══ `hitFeel` se llama en cada golpe del jugador: deja `m.hit` (el actor 3D se empuja/inclina: actors3d.js), suena por CAPAS según material y fuerza, lanza partículas por MATERIAL
   (hueso, piedra, hielo, baba, fuego; la carne ya sangra por `R3D.blood`), da un pequeño «puñetazo» de cámara hacia el golpe (`CPUNCH`) y retroceso visual del héroe (`P.rc`). La fuerza `k` (0..1) sube con el daño relativo, el golpe pesado, el crítico y el aturdimiento. NO estela de arma (el dueño la descartó). */
const HITMAT={esqueleto:'bone',golem:'stone',k5:'stone',b3:'ice',k3:'ice',yak:'ice',slime:'goo',b5:'fire',demonio:'fire'},CPUNCH={t:-1e9,x:0,y:0,k:0};
function hitFeel(m,d,now,mx,heavy,sk,wt){
 const dx=m.x-P.x,dy=m.y-P.y,l=Math.hypot(dx,dy)||1,ux=dx/l,uy=dy/l,k=Math.min(1,(d>0?.28:.1)+(heavy?.35:0)+(mx?.4:0)+Math.min(.3,d/Math.max(4,m.mh)*1.2)+(m.stun>now?.15:0));
 m.hit={t:now,ux,uy,k};if(d<=0)return;const mat=HITMAT[m.d.id]||'flesh',melee=sk!=='mg'&&wt!=='r',hy=m.d.h*.5;
 try{ // sonido por capas: golpe seco + timbre del material + capa grave en pesados/críticos
  const v=.05+.06*k;tone(150-40*k,.09+.05*k,'sine',v*1.6,60);
  if(mat==='flesh')tone(300,.05,'triangle',v*.5,160);else if(mat==='bone'){tone(540,.06,'square',v*.7,300);tone(190,.08,'sine',v)}else if(mat==='stone'){tone(1150,.04,'square',v*.6,600);tone(130,.1,'sine',v*1.2,60)}
  else if(mat==='ice'){tone(1600,.12,'triangle',v*.7,900)}else if(mat==='goo'){tone(120,.14,'sine',v*1.1,55);tone(280,.05,'triangle',v*.5,120)}else if(mat==='fire')tone(210,.1,'sawtooth',v*.6,90);
  if(heavy||mx)tone(58,.24,'sine',.13,28)}catch(e){}
 try{const F=R3D.fx;if(F){const n=Math.round(4+k*8);
  if(mat==='bone'){F.chips('wood',m.x,m.y,hy,n,'#efe6cc')}else if(mat==='stone'){F.chips('rock',m.x,m.y,hy,n,'#b8b4ac');F.spark(m.x,m.y,hy,'#ffd27a',Math.round(3+k*6))}
  else if(mat==='ice'){F.chips('rock',m.x,m.y,hy,n,'#cfe8ff');F.spark(m.x,m.y,hy,'#e8fbff',Math.round(2+k*4))}else if(mat==='goo'){F.spark(m.x,m.y,hy,'#6ad04a',Math.round(4+k*8),{g:3})}
  else if(mat==='fire'){F.spark(m.x,m.y,hy,'#ff9a2a',Math.round(4+k*8))}}}catch(e){}
 if(melee){CPUNCH.t=now;CPUNCH.x=ux;CPUNCH.y=uy;CPUNCH.k=k;P.rc={t:now,x:-ux,y:-uy,k}}}
function hitM(m,d,now,sk,mxv,wt){if(!alive(m,now))return;fightAt=now;
 if(d>0&&mxv!==99){const mul=m.stun>now?SG.mulStun:(m.rip>now?SG.mulRip:1);if(mul>1){d=Math.max(d+1,Math.round(d*mul));if(m.rip>now&&!(m.stun>now)){m.rip=0;fText('¡CONTRAATAQUE!','#ffe08a',m.x,m.y,m.d.h+14)}}}   // aturdido ×1,5 · contraataque ×2
 let frc=0;if(d>0&&mxv!==99){d=Math.max(1,Math.round(d*STS.out(P)*(typeof ENCH!=='undefined'?ENCH.mul(sk,m):1)));const r=STS.inM(m,d,now,{sk,heavy:sk!=='mg'&&wt!=='r'&&!!SWG.hv&&now-SWG.t0<500});d=r.d;frc=r.crit}   // ESTADOS (status.js): furia/debilitar del jugador, vulnerable/escudo del enemigo y congelación (el golpe la rompe y es crítico)
 m.lx=m.x;m.ly=m.y;m.hp-=d;if(d>0&&mxv!==99)stagger(m,d*((SWG.hv&&sk!=='mg'&&now-SWG.t0<500)?1.7:1),now);m.fl=now+120;snd(d?'hit':'miss');
 const mx=frc||(d>=2&&d>=(mxv||maxHit())),heavy=d>0&&sk!=='mg'&&mxv!==99&&wt!=='r'&&!!SWG.hv&&now-SWG.t0<500;   // IMPACTOS DISTINTOS (21 oct 2026): normal · PESADO (3.er golpe del combo o carga ≥ 55 %) · CRÍTICO (golpe máximo)
 if(d>0&&heavy){try{tone(92,.2,'sine',.24,-45);noise(.1,.15,240,'lowpass')}catch(e){}}
 if(d>0&&mx){try{tone(1480,.1,'triangle',.07);tone(2300,.18,'sine',.04,-320)}catch(e){}}
 if(typeof LAB!=='undefined')LAB.hit(m,d,now);
 if(d>0&&typeof FEEL!=='undefined'){const F=FEEL.v;   // «sensación» del golpe (combatlab.js): hit-stop, temblor y empujón; todo a 0 = como antes
  if(F.stop>0&&window.R3D&&!(typeof CINE!=='undefined'&&CINE.on)){R3D.tscale=.05;clearTimeout(window.__hs);window.__hs=setTimeout(()=>{if(!(typeof CINE!=='undefined'&&CINE.on))R3D.tscale=1},F.stop*(mx?1.9:heavy?1.5:1))}
  if(F.shake>0)SHK=Math.max(SHK,now+60+F.shake*140*(mx?1.6:heavy?1.8:1));
  if(F.knock>0){const dx=m.x-P.x,dy=m.y-P.y,l=Math.hypot(dx,dy)||1,nx=m.x+dx/l*F.knock,ny=m.y+dy/l*F.knock;if(!blk(nx,ny)){m.x=nx;m.y=ny}}}
 if(d>0&&heavy)sp(m.x,m.y-m.d.h/2,'#ff9a3a',11,110,70,150);
 if(d>0&&sk!=='mg'&&window.R3D&&R3D.spell){try{R3D.spell.hit(m.x,m.y,Math.atan2(m.y-P.y,m.x-P.x),mx?1:heavy?.6:0)}catch(e){}}   // impacto 3D: destello + chispas en la dirección del golpe
 if(d>0&&sk!=='mg'&&mxv!==99&&window.R3D&&R3D.blood){try{R3D.blood.hit(m,d,now,{wt:wt==='r'?'r':'m',mx})}catch(e){}}   // Lote R3D-SANGRE (solo ?r3d=1): golpes físicos directos sangran; hechizos (sk='mg'), espinas y sangrado por turnos (mxv=99) no. wt='r' = flecha/virote
 if(mxv!==99)hitFeel(m,d,now,mx,heavy,sk,wt);
 if(d>0)splat(m.x,m.y,d,mx?'#c9a24a':null,m.d.h+6,mx,Math.min(1.4,1+Math.min(.3,d/Math.max(4,m.mh)*1.5)+(heavy?.1:0)),m);else fText('Fallo','#d8dde8',m.x,m.y,m.d.h+10);   /* estilo WoW (22 oct 2026): sin «0»: palabras Fallo / Esquiva / Parada / Absorbido con nuestra UI (fText) */
 if(mx){sp(m.x,m.y-m.d.h/2,'#e8cf94',16,120,80,170);sp(m.x,m.y-m.d.h/2,'#fff1c8',8,70,60,190);SHK=now+160;HFX.push({k:'star',tx:m.x,ty:m.y,th:m.d.h/2,t0:now,d:380})}if(d)gain(sk||WSK(),d*xpMul(m));if(m.hp<=0){kill(m,now);if(A&&A.e===m)reseek(m,now)}}
const inVilla=(x,y)=>{if(INT&&INT.cave)return CAVE.blk(x,y);   /* CUEVA: «zona segura» = roca; las criaturas no atraviesan las paredes */
 const k=ownAt(x,y);if(k<0)return false;if(typeof ISLA!=='undefined'&&ISLA.fightOn())return false;   // la Arena del Vigía queda dentro de la zona segura del Agora: durante el combate de Gabriel NO hay zona segura
 const b=BI[k],v=b.village.safe||[210,770,245,225];return Math.abs(x-(b.ox+v[0]))<v[2]&&Math.abs(y-(b.oy+v[1]))<v[3]}; // zona segura de la aldea (BIOMES.list[k].village.safe = [cx,cy,semiancho,semialto])
/* AVISO DE GOLPE de los enemigos (21 oct 2026; pedido del dueño: «avisos de golpe»): ya no pegan al instante. Se paran ~0,42–0,72 s (≈ 22 % de su cadencia) con una pose de preparación y un CONO ROJO en el suelo que se va llenando; al terminar,
   el golpe solo cuenta si sigues dentro del cono (±52°) y del alcance → se esquiva con un paso al lado o con el DASH (i-frames). Los jefes y capitanes conservan además su golpe pesado telegrafado (combat.js). */
function windHit(m,w,now,dx,dy,dp){if(m.d.id==='gabriel'&&window.R3D&&R3D.spell&&R3D.spell.slash)try{R3D.spell.slash(m.x,m.y,w.ang,70,(m.gc&1)?1:-1,'#ffe9a8',!!w.second,0,300)}catch(e){}   // tajo de luz de la espada celestial
 const reach=46+(m.d.w||16)*.3+18;if(dashInv()&&dp<=reach*1.8)pdCheck(m,now);let df=Math.abs(Math.atan2(dy,dx)-w.ang);df=df>Math.PI?2*Math.PI-df:df;const hit=P.hp>0&&dp<=reach&&df<=.9;
 m.flare=now;   // fogonazo de ojos al soltar el golpe (actors3d.js)
 if(hit)monHit(m,now);else{m.at0=now;if(P.hp>0&&dp<reach*1.8){fText('Esquiva','#9fe0ff',P.x,P.y,46);inc('dodge')}}m.at0=now-.18*(m.d.boss?760:640);
 if(w.kind==='dbl'&&!w.second&&P.hp>0){const a2=Math.atan2(P.y-m.y,P.x-m.x);m.wind={t0:now+330,t1:now+330+680,d:680,ang:a2,big:false,slow:1,kind:'dbl',second:1}}}   // el combo encadena un 2.o aviso (brazo de nuevo arriba) que apunta a donde estes AHORA   // la animación del golpe arranca en el tajo
/* 21 oct 2026 (pedido del dueño): los enemigos NORMALES ya no dibujan cono en el suelo: avisan 0,8 s encendiendo los ojos (actors3d.js `eyeFx`) y el fogonazo marca el tajo. El arco en el suelo (decal 3D de spellfx3d.js `tele`)
   queda solo para los "grandes": jefes, élites (m.elite) y enemigos de nivel ≥ 40 (`bigFoe`). */
const bigFoe=m=>!!(m.d.boss||m.elite||(m.lv||0)>=40);
function drawWind(now){if(!window.R3D||!R3D.spell)return;for(const m of M){const w=m.wind;if(!w||!w.big||now>=w.t1||!alive(m,now))continue;
  const u=Math.max(0,Math.min(1,(now-w.t0)/(w.t1-w.t0))),reach=46+(m.d.w||16)*.3+18;R3D.spell.tele(m,m.x,m.y,w.ang,reach,.9,u)}}
function monHit(m,now){m.at0=now;fightAt=now;if(S.ar!==0&&P.hp>0&&!inRoom()&&(!A||A.ty!=='f')&&alive(m,now)&&!sealed(m)){stopA();startF(m,now);log('⚔️ Te defiendes de <b>'+m.d.n+'</b>.')}P.pjM=m;P.pj=now+4800;if(dashInv())pdCheck(m,now);const d00=!dashInv()&&Math.random()<monAcc(m)*STS.acc(m)?Math.round(R(0,m.dm)*STS.out(m)):0,gh=guardHit(m,d00,now,0),d0=gh.d,pm=d0?prMod(m,d0,0):null,d=d0?STS.inP(Math.max(0,pm.d-Math.round(pv('stone'))),now,m):0;P.hp-=d;if(d>0)splat(P.x,P.y,d,pm&&pm.blocked&&d<d0?'#6ab0ff':null,26);else if(!gh.kind){if(pm&&pm.blocked)fText('Absorbido','#6ab0ff',P.x,P.y,46);else if(dashInv())fText('Esquiva','#9fe0ff',P.x,P.y,46);else fText('Fallo','#d8dde8',P.x,P.y,46)}
 if(d){bossHit(m,d,now);snd('hurt');HURT=now;if(d>=maxHp()*.25)SHK=now+200;if(Math.random()*100<pv('thorns'))hitM(m,2,now,WSK(),99)}
 if(P.hp>0&&P.hp<maxHp()*.3&&pv('last')>0&&now>LSCD){P.hp=Math.min(maxHp(),P.hp+Math.ceil(maxHp()*pv('last')/100));LSCD=now+60000;toast('💖 ¡Segundo aliento!');snd('magic')}
 if(P.hp<=0)die()}
function procs(m,d,hit,now){if(d>0){if(typeof ENCH!=='undefined')ENCH.proc(m,d,now);if(Math.random()*100<pv('life')){P.hp=Math.min(maxHp(),P.hp+1);splat(P.x,P.y,1,'#2f9a3a',26)}if(Math.random()*100<pv('bleed'))STS.add(m,'bleed',{dur:2400,v:1});if(Math.random()*100<pv('stun'))m.nt=Math.max(m.nt||0,now)+1200}
 if(Math.random()*100<pv('double'))hitM(m,hit?R(1,maxHit()):0,now)}
/* COMBATE ACTIVO (21 oct 2026; decisión del dueño: «no me gusta que sean autoataques, hay que hacerlo más activo»): con `FEEL.manual` (por defecto 1) el héroe YA NO golpea solo. Cada golpe necesita una entrada:
   LMB sobre el enemigo (mantener el botón = golpes seguidos), o la tecla E (mantener = seguidos; sin objetivo ataca al más cercano). Un LMB queda en espera 1,5 s (por si el héroe aún se acerca). La cadencia manual es
   `atkMs() × FEEL.mk` (por defecto la mitad, mín. 550 ms) y los golpes encadenados forman un COMBO de 3: el tercero pega un 60 % más fuerte y se anima como golpe pesado. FEEL.manual=0 vuelve al auto-ataque de siempre. */
const ATKIN={t:0,held:0},manual=()=>typeof FEEL==='undefined'||FEEL.manual!==0,manMs=()=>Math.max(500,Math.round(atkMs()*(typeof FEEL!=='undefined'?FEEL.mk:1)));
/* COMBATE DIRIGIDO POR EL RATÓN (21 oct 2026; propuesta del dueño: «el mouse dirige la vista del jugador; al hacer LMB hace un swing hacia esa dirección»). Con `FEEL.aim` (def. 1; requiere el modo manual):
   · el héroe MIRA al cursor (al estar quieto y en combate, y siempre durante un golpe); un arco dorado tenue marca hacia dónde apuntas;
   · LMB sobre el suelo o un enemigo = SWING en esa dirección (mantener = golpes seguidos; tecla E = hacia el cursor); LMB sobre un recurso/PNJ/estación = interactuar como siempre; RMB = ir a ese punto;
   · el golpe tiene PREPARACIÓN (~150 ms) → IMPACTO → recuperación; el daño cae en el impacto, a TODO enemigo dentro del arco (melé: alcance ~80 px, ±57°; también sin objetivo: falla en el aire). Arco/báculo: proyectil/hechizo al enemigo más cercano al rayo (±18°/±29°);
   · el 3.er golpe del combo pega +60 %; táctil: el toque sobre un enemigo apunta a él y se golpea, el toque en el suelo mueve; sin enemigo en el cursor apunta al más cercano.
   Estado: `SWG` (golpe en curso), `SLASH` (arcos de destello). El modo manual SIN apuntado (LMB mantenido sobre el objetivo) sigue existiendo con FEEL.aim=0; FEEL.manual=0 = auto-ataque antiguo. */
const SWG={t0:0,ms:0,wind:0,dx:1,dy:0,ang:0,done:1,c:0,wt:'m',cd:0,last:0,tg:null,hv:0},SLASH=[];
/* CARGA (21 oct 2026; propuesta del dueño): MANTENER el LMB (o E) carga el golpe y SOLTAR lo lanza: un toque corto (< 0,22 s) es el golpe normal; cargando 0,22→1,1 s el golpe gana hasta +100 % de daño con arco, +80 % cuerpo a cuerpo
   y, con el báculo, la BOLA DE FUEGO crece (+120 %), cuesta más maná y a partir de media carga deja al enemigo ARDIENDO. Mientras cargas el héroe aguanta la pose y mira al cursor; la barra de swing se llena de naranja. Un golpe cargado no avanza el combo. */
/* CONTROLES DEL RATÓN (23 oct 2026; pedido del dueño): MANTENER el LMB = golpes seguidos hacia el cursor (`MSB.atk`, repetidos desde `swingTick`); MANTENER LMB + RMB a la vez = CARGAR el golpe (se lanza al soltar cualquiera de los dos); el RMB solo sigue siendo bloquear. Táctil: sin cambios (toque = carga/suelta). */
const MSB={l:0,r:0,atk:0};
const CHG={on:0,t0:0},chgK=now=>Math.max(0,Math.min(1,(now-CHG.t0-220)/880));
function chargeStart(now){MOUNT.off('combate');if(STS.frozen(P)||BLK.on||inRoom()||CK||P.hp<=0||(typeof CINE!=='undefined'&&CINE.on)||CHG.on)return;if(now<SWG.cd||now<ATKT)return;   /* 22 oct 2026: si el ataque NO está listo el LMB se IGNORA del todo (antes empezaba una «carga» que frenaba al héroe al 30 % y le cancelaba la ruta al spamear LMB): solo pega cuando toca */
 CHG.on=1;CHG.t0=now;ATKIN.held=1;P.g=P.mv=null;if(A)stopA()}   // atacar CANCELA la ruta pendiente (antes el héroe seguía andando hacia el último RMB mientras golpeaba)
/* COMPROMISO DEL GOLPE (21 oct 2026): mientras cargas o dura la preparación/recuperación del swing el héroe se mueve al 30 %; y un golpe cuerpo a cuerpo hacia un enemigo cercano pero fuera de alcance da una pequeña EMBESTIDA (`SWG.lg` px) en vez de caminar. */
const swSlow=now=>CHG.on||BLK.on||(now>=SWG.t0&&now<SWG.t0+SWG.wind+280);
/* ATAQUE CARGADO GASTA RESISTENCIA (22 oct 2026; decisión del dueño): soltar una carga ≥ 55 % cuesta 12 + 18·carga (12–30; el mandoble ×1,5) y pausa la regeneración. Sin resistencia suficiente el golpe sale SIN carga (normal) y no cobra nada. Solo el mandoble cargado barre hasta 3 objetivos (`swingResolve`). */
const CHG_MIN=.55,chgCost=k=>Math.round((12+18*k)*(wKind()==='great'?1.5:1));
function chargeEnd(){if(!CHG.on)return;const now=performance.now();let k=chgK(now);CHG.on=0;
 if(k>CHG_MIN){if(S.sta==null)S.sta=100;const c=chgCost(k);if(S.sta>=c){S.sta-=c;STP=Math.max(STP,2)}else{k=0;if(now-BLK.warn>1500){BLK.warn=now;log('Sin aliento para un golpe cargado.')}}}ATKIN.held=0;try{R3D.spell.charge(0,0,-1)}catch(e){}swing(now,undefined,k)}
const fbCost=k=>1+Math.round(k);
const aimOn=()=>manual()&&(typeof FEEL==='undefined'||FEEL.aim!==0);
function aimAng(){const now=performance.now();if(!CUR.touch&&CUR.on){const w=ISO.toWorld(CUR.px,CUR.py,TER.heightAt);return Math.atan2(w.y-P.y,w.x-P.x)}
 let b=null,bd=260;M.forEach(m=>{if(!alive(m,now)||sealed(m))return;const d=Math.hypot(m.x-P.x,m.y-P.y);if(d<bd){bd=d;b=m}});return b?Math.atan2(b.y-P.y,b.x-P.x):(SWG.ang||0)}
const aggro=(m,now)=>{m.hunt=1;m.nt=Math.max(m.nt||0,now+900)};
function swing(now,ang,k=0){MOUNT.off('combate');if(STS.frozen(P)||inRoom()||CK||P.hp<=0||(typeof CINE!=='undefined'&&CINE.on)||now<SWG.cd||now<ATKT)return false;
 /* (22 oct 2026) el toast grande «Apunta con el ratón y haz LMB…» se QUITÓ: tapaba la pantalla; los controles se enseñan con las pistas cortas del tutorial (isla.js `hintsTick`) */
 inc('swing');if(k>=.3)inc('charged');
 const fb=wKind()==='staff'&&skl().cel&&skl().sel==='cel'&&MN>=fbCost(k),chg=k>.04,ms=fb?1200:manMs(),c=chg?SWG.c:(now-SWG.last<ms*1.9)?(SWG.c+1)%3:0;if(ang==null)ang=aimAng();ang=magnetAng(ang,now);
 /* PUNTERÍA DE RANGO (22 oct 2026; el dueño: «que la flecha vaya hacia donde el cursor; si está claramente sobre el enemigo, hacia él»): con arco o bola de fuego, si el cursor está SOBRE un enemigo (selección en pantalla, no en el suelo: el cuerpo del enemigo está elevado y el punto del suelo bajo el cursor queda más allá), el tiro apunta a ese enemigo y le da; si no, va hacia el cursor (con el imán de `rayHit`). */
 let tg=null;if((wtype()==='r'||fb)&&CUR.on&&!CUR.touch){const e=pickEnt(CUR.px,CUR.py,now);if(e&&M.includes(e)&&alive(e,now)&&!sealed(e)){tg=e;ang=Math.atan2(e.y-P.y,e.x-P.x)}}
 Object.assign(SWG,{tg,t0:now,ms,wind:Math.min(chg?60:55,Math.round(ms*.2)),ang,dx:Math.cos(ang),dy:Math.sin(ang),done:0,c,k,fb,wt:wtype(),cd:now+ms,last:now,hv:(c===2||k>.55)?1:0,lg:0});ATKT=now+ms;P.g=P.mv=null;if(A)stopA();
 if(SWG.wt==='m'&&!fb){   // melé: embestida corta hacia un enemigo cercano en el arco y estela 3D del golpe
  const rch=(wKind()==='dagger'?66:wKind()==='great'?92:80);let bd=1e9;M.forEach(m=>{if(!alive(m,now)||sealed(m))return;const vx=m.x-P.x,vy=m.y-P.y,d=Math.hypot(vx,vy);let df=Math.abs(Math.atan2(vy,vx)-ang);df=df>Math.PI?2*Math.PI-df:df;if(df<.6&&d>rch*.7&&d<150&&d<bd){bd=d;SWG.lg=Math.min(18,d-rch*.7)}});}/* estela 3D R3D.spell.slash quitada a petición del dueño */P.cbT=now;P.dir=HERO.dirOf(SWG.dx,SWG.dy);return true}
/* IMÁN DE PROYECTILES (22 oct 2026; el dueño: «las flechas pasan muy cerca de la hitbox y no les da»): el rayo de apuntado se ENSANCHA con la distancia (`AIMASSIST.k` px por px de recorrido, hasta `max` px) y, si hay un enemigo dentro, el proyectil vuela hacia su centro (ya no pasa de largo). Vale para flechas, bola de fuego y hechizos del báculo. */
const AIMASSIST={k:.12,max:26};
const tgHit=range=>{const t=SWG.tg;if(!t||!alive(t,performance.now())||sealed(t))return null;const d=Math.hypot(t.x-P.x,t.y-P.y);return d<=range?{m:t,t:d}:null};   // el enemigo bajo el cursor (si está al alcance)
function rayHit(a0,range,pad){const now=performance.now(),dx=Math.cos(a0),dy=Math.sin(a0);let best=null,bt=range;
 M.forEach(m=>{if(!alive(m,now)||sealed(m))return;const vx=m.x-P.x,vy=m.y-P.y,t=vx*dx+vy*dy;if(t<8||t>range)return;const perp=Math.abs(vx*dy-vy*dx),rad=(m.d.w||16)*.55+pad+Math.min(AIMASSIST.max,t*AIMASSIST.k);if(perp<=rad&&t<bt){bt=t;best=m}});return{m:best,t:bt}}
// hechizo ELEGIDO para el báculo (S.selSp; por defecto el de ataque más alto desbloqueado); -1 si no hay ninguno
function curSpell(){const i=S.selSp;if(i!=null&&SPL[i]&&SPL[i].atk&&L('mg')>=SPL[i].lv)return i;let b=-1,c=-1;SPL.forEach((s,k)=>{if(s.atk&&L('mg')>=s.lv){b=k;if(MN>=s.mp&&hasRunes(s.r))c=k}});return c>=0?c:b}   // sin elección: el más alto que puedas lanzar ahora (si no, el más alto desbloqueado)
function selSpell(i){const s=SPL[i];if(!s||!s.atk||L('mg')<s.lv)return;S.selSp=i;log('✨ Hechizo elegido: <b>'+s.n+'</b>. Con el báculo, LMB lo lanza hacia donde apuntas.');dirty=1;save()}
function swingResolve(now){const wt=SWG.wt,c=SWG.c,kc=SWG.k||0;SWG.done=1;let hit=0,primary=null,pb=9;const a0=SWG.ang,cand=[];
 M.forEach(m=>{if(!alive(m,now)||sealed(m))return;const vx=m.x-P.x,vy=m.y-P.y;let df=Math.abs(Math.atan2(vy,vx)-a0);df=df>Math.PI?2*Math.PI-df:df;cand.push({m,d:Math.hypot(vx,vy),df})});
 if(SWG.fb){const cost=fbCost(kc),sh=tgHit(330)||rayHit(a0,330,6),mx=Math.max(2,2+Math.floor(L('mg')/6))*(1+kc*1.2),m=sh.m,ex=sh.m?sh.m.x:P.x+Math.cos(a0)*sh.t,ey=sh.m?sh.m.y:P.y+Math.sin(a0)*sh.t;   // BOLA DE FUEGO (báculo + maná): proyectil apuntado; la precisión decide si daña; con carga ≥ ½ deja ardiendo
  MN=Math.max(0,MN-cost);let d=0,acc=false;if(m){acc=sureHit(m)||Math.random()<spAcc(m);d=acc?R(Math.ceil(mx*.5),Math.round(mx)):0;aggro(m,now);primary=m;hit=1}
  const ms=Math.max(120,sh.t/.62);PJ.push({x:P.x,y:P.y,sh:14,tx:ex,ty:ey,th:m?m.d.h/2:12,t0:now,t1:now+ms,m,d,wt:'g',sk:'mg',mxv:mx,fb:1,k:kc});
  try{R3D.spell.fireball(P.x,P.y,ex,ey,ms,kc)}catch(e){}snd('magic');inc('cast');if(m&&acc&&kc>=.5){const bn=4+Math.round(kc*4),bd=1+Math.floor(L('mg')/15);setTimeout(()=>{if(alive(m,performance.now()))STS.add(m,'burn',{dur:bn*800,v:bd})},ms+700)}dirty=1}
 else if(wt==='m'){const reach=(wKind()==='dagger'?66:wKind()==='great'?92:80)+kc*14;
  /* OBJETIVO ÚNICO (22 oct 2026; decisión del dueño): solo las armas a DOS MANOS (mandoble, `wKind()==='great'`) atacan en área: barren el arco hasta 3 objetivos (los secundarios al 60 % de daño). Una mano, daga y puños golpean SOLO al objetivo principal (el fijado con Tab si está al alcance; si no, el más alineado con el cursor) y solo ese hace aggro. Las magias de área futuras irán por `s.area`. */
  const inR=cand.filter(q=>q.d<=reach+(q.m.d.w||0)*.3&&(q.df<=1||q.d<26)).sort((a,b)=>((LOCK&&b.m===LOCK)-(LOCK&&a.m===LOCK))||a.df-b.df||a.d-b.d);
  (wKind()==='great'&&kc>CHG_MIN?inR.slice(0,3):inR.slice(0,1)).forEach((q,ix)=>{const m=q.m,N0=rollAtk(m);let d=N0.d1;if(ix>0&&d>0)d=Math.max(1,Math.round(d*.6));if(d&&m.hp<=m.mh*.25)d=Math.round(d*(1+pv('exec')/100));if(c===2&&d>0)d=Math.round(d*1.6)||2;if(kc>0&&d>0)d=Math.round(d*(1+kc*.8))||2;
   if((c===2||kc>.55)&&N0.hit)HFX.push({k:wColor()?'thrust':'punch',x:P.x,y:P.y,tx:m.x,ty:m.y,th:m.d.h/2,t0:now,d:300});hitM(m,d,now);procs(m,d,N0.hit,now);aggro(m,now);hit++;if(q.df<pb){pb=q.df;primary=m}})}
 else if(wt==='r'){const RR0=300+ING.scope().rng,sh=tgHit(RR0)||rayHit(a0,RR0,4),N1=sh.m?rollAtk(sh.m):{d1:0,hit:false},dd=N1.d1,d2=Math.round((c===2&&dd>0?Math.round(dd*1.6)||2:dd)*(dd>0?1+kc:1)),ex=sh.m?sh.m.x:P.x+Math.cos(a0)*sh.t,ey=sh.m?sh.m.y:P.y+Math.sin(a0)*sh.t;   // ARCO: la flecha vuela en línea recta hacia donde apuntas y pega al PRIMER enemigo del camino; si no hay nadie, se pierde
  PJ.push({x:P.x,y:P.y,sh:14,tx:ex,ty:ey,th:sh.m?sh.m.d.h/2:12,t0:now,t1:now+Math.max(90,sh.t/.9),m:sh.m,d:d2,wt,hv:c===2});snd('bow');useAmmo();inc('shot');if(sh.m){primary=sh.m;hit=1;aggro(sh.m,now);procs(sh.m,d2,N1.hit,now)}}   // apuntar solo decide a QUIÉN le das; que acierte o falle lo decide la precisión (rollAtk), igual que el cuerpo a cuerpo
 else{const si=curSpell(),s=si>=0?SPL[si]:null;
  if(s&&MN>=s.mp&&hasRunes(s.r)){const sh=rayHit(a0,s.max>40?340:300,6),mx=spMax(s),d2=R(Math.ceil(mx*.5),mx),ex=sh.m?sh.m.x:P.x+Math.cos(a0)*sh.t,ey=sh.m?sh.m.y:P.y+Math.sin(a0)*sh.t;   // BÁCULO + hechizo elegido: proyectil mágico apuntado (gasta maná y runas, sube Magia); se puede fallar
   FREEC=0;pay(s);PJ.push({x:P.x,y:P.y,sh:14,tx:ex,ty:ey,th:sh.m?sh.m.d.h/2:12,t0:now,t1:now+Math.max(120,sh.t/.7),m:sh.m,d:d2,wt:'g',sk:'mg',mxv:mx,col:s.col,hv:d2>=mx});snd('magic');inc('cast');dirty=1;if(sh.m){primary=sh.m;hit=1;aggro(sh.m,now)}}
  else{cand.filter(q=>q.d<=72+(q.m.d.w||0)*.3&&(q.df<=1||q.d<24)).sort((a,b)=>a.df-b.df||a.d-b.d).slice(0,1).forEach(q=>{const m=q.m,d2=Math.max(1,R(1,Math.max(1,Math.round(maxHit()*.5))));hitM(m,d2,now,'cb',1);aggro(m,now);hit++;if(q.df<pb){pb=q.df;primary=m}})}}   // sin maná, runas o hechizo: golpe de BÁCULO cuerpo a cuerpo (sube Combate, no Magia)
 if(!hit)snd('miss');if(primary){SWG.tg=primary;P.pjM=primary;P.pj=now+4800}SLASH.push({a:a0,t0:now,c,hit});if(SLASH.length>6)SLASH.shift()}
function burnTick(now){for(const m of M){const b=m.burn;if(!b)continue;if(!alive(m,now)){m.burn=null;continue}try{if(Math.random()<.5)R3D.spell.ember(m.x,m.y,m.d.h/28)}catch(e){}
  if(now>=b.t){b.t=now+800;b.n--;dotHit(m,b.d,now,'burn');if(b.n<=0)m.burn=null}}}   // QUEMADURA de la bola de fuego cargada: 1 golpe cada 0,8 s mientras dura
const POI_RESP=240000;
// los guardias de un campamento NUNCA reaparecen delante de ti: si vas a estar a menos de ~22 tiles de su sitio cuando les toque, se retrasa 20 s más
function campTick(now){for(const m of M){if(!m.poi||!m.rt||m.rt<=0)continue;if(m.rt-now<20000&&Math.hypot((m.hx!=null?m.hx:m.x)-P.x,(m.hy!=null?m.hy:m.y)-P.y)<700)m.rt=now+20000}}
function swingTick(now,dt){HERB.tick(now,dt||.016);if(typeof ENCH!=='undefined')ENCH.tick(now);ING.tick(now,dt||.016);MOUNT.tick(now,dt||.016);TAME.tick(performance.now(),dt||.016);ALQ.tick(now,dt||.016);STAB.tick();COC.tick(now,dt||.016);campTick(now);STS.tick(now,dt||.016);blkTick(dt||.016,now);sgTick(dt||.016,now);burnTick(now);if(!aimOn())return;
 if(MSB.atk&&MSB.l&&!CHG.on){if(MSB.r){if(BLK.on)blockEnd();chargeStart(now)}else if(!BLK.on&&swing(now)){ATKIN.held=1;P.g=P.mv=null;if(A)stopA()}}   // LMB mantenido = golpes seguidos; LMB+RMB = carga
if(SWG.lg>0&&dt){const s=Math.min(SWG.lg,230*dt);SWG.lg-=s;step(SWG.dx*s,0);step(0,SWG.dy*s)}   // embestida del golpe
 if(!SWG.done&&now>=SWG.t0+SWG.wind)swingResolve(now)}
const aimTarget=now=>SWG.tg&&SWG.tg.hp>0&&now-SWG.last<5000?SWG.tg:null;
function drawAim(now){}   // (21 oct 2026: se quitaron el arco guía y el destello circular a petición del dueño; solo queda la barra de swing del HUD)
function swingHud(now){const col=document.getElementById('hs-col');if(!col)return;let el=document.getElementById('hs-sw');if(!el){el=document.createElement('div');el.id='hs-sw';el.innerHTML='<i></i><b></b><b></b><b></b>';const a=document.getElementById('hs-act');if(a&&a.nextSibling)col.insertBefore(el,a.nextSibling);else col.appendChild(el)}
 const on=aimOn()&&!inRoom()&&(now-SWG.last<3000||now-(P.cbT||-1e9)<2000||CHG.on);el.classList.toggle('on',on&&!(CUR.on&&!CUR.touch));try{if(CHG.on&&wKind()==='staff'&&now-CHG.t0>220)R3D.spell.charge(P.x,P.y,chgK(now));else if(!CHG.on)R3D.spell.charge(0,0,-1)}catch(e){}
 el.classList.toggle('chg',!!CHG.on);el.classList.toggle('cf',!!CHG.on&&chgK(now)>=1);
 /* RUEDITA DE ENFRIAMIENTO ALREDEDOR DEL CURSOR (22 oct 2026; pedido del dueño: en el cursor normal, sin mirilla): el recuperar el golpe se muestra como un anillo que se llena alrededor del cursor (`#aimr .rg`, `--u` 0..1), para TODAS las armas; al cargar se llena de naranja; al estar listo destella (`rdy`); 3 puntos = combo. La barra fina del marco queda como respaldo cuando no hay mira. */
 {const CDR=cdrEl(),rk=1-Math.max(0,Math.min(1,(Math.max(SWG.cd,ATKT)-now)/Math.max(1,SWG.ms))),uu=CHG.on?chgK(now):rk;CDR.style.setProperty('--u',uu.toFixed(3));CDR.style.transform='translate('+CUR.cx+'px,'+CUR.cy+'px)';CDR.style.display=(on&&CUR.on&&!CUR.touch)?'block':'none';if(CUR.on&&!CUR.touch)aimRange(ISO.toWorld(CUR.px,CUR.py,TER.heightAt));CDR.classList.toggle('cdon',on&&CUR.on&&!CUR.touch);
  const rdy=!CHG.on&&rk>=1;if(rdy&&CDR._rk<1){CDR.classList.remove('rdy');void CDR.offsetWidth;CDR.classList.add('rdy')}CDR._rk=CHG.on?0:rk;CDR.classList.toggle('chg',!!CHG.on);CDR.classList.toggle('cf',!!CHG.on&&chgK(now)>=1);CDR.classList.toggle('full',rdy);
  const nn=now-SWG.last<SWG.ms*1.9?SWG.c+1:0;CDR.querySelectorAll('b').forEach((b,i)=>b.classList.toggle('lit',i<nn))}
 if(!on)return;const u=CHG.on?chgK(now):Math.min(1,(now-SWG.t0)/Math.max(1,SWG.ms));el.firstChild.style.width=(u*100).toFixed(0)+'%';el.classList.toggle('rd',u>=1);
 const n=now-SWG.last<SWG.ms*1.9?SWG.c+1:0,ps=el.querySelectorAll('b');ps.forEach((b,i)=>b.classList.toggle('lit',i<n))}   // barra de swing: relleno = enfriamiento del golpe, 3 puntos = combo
function atkKey(down){const now=performance.now();if(BLK.on&&down)return;if(A&&A.wk)return;if(A&&A.wh){if(down)whPress(now);return}if(A&&A.fg){if(down)fishPress(now);return}if(!down){if(aimOn())chargeEnd();ATKIN.held=0;return}ATKIN.t=now;ATKIN.held=1;if(aimOn()){chargeStart(now);return}if(A&&A.ty==='f')return;
 let b=null,bd=150;M.forEach(m=>{if(!alive(m,now)||sealed(m))return;const d=Math.hypot(m.x-P.x,m.y-P.y);if(d<bd){bd=d;b=m}});if(b){if(A)stopA();P.g=null;P.mv=null;engage(b,now)}}
function act(now){if(!A)return;
 if(A.ty==='f'){const m=A.e,dd=Math.hypot(P.x-m.x,P.y-m.y);if(dd>(wtype()==='m'?75:210)){if(!m.hunt)stopA();return}
  const man=manual();if(man&&!(ATKIN.held||now-ATKIN.t<1500))return;   // combate activo: sin entrada no hay golpe
  if(now>=A.ph&&now>=ATKT){if(man)A.ms=manMs();A.lh=now;A.ph=now+A.ms;ATKT=now+A.ms;if(man&&!ATKIN.held)ATKIN.t=0;if(!(P.pjM&&P.pjM!==m&&now<P.pj&&alive(P.pjM,now)&&P.pjM.hunt)){P.pjM=m;P.pj=now+4800}let wt=wtype(),N0=A.nx&&A.nx.m===m&&A.nx.wt===wt?A.nx:rollAtk(m),hit=N0.hit,d1=N0.d1,d=d1&&m.hp<=m.mh*.25?Math.round(d1*(1+pv('exec')/100)):d1,hv=!!N0.heavy;A.nx=null;
   if(man){const c=(now-(A.lh0||0)<A.ms*1.9)?((A.cmb||0)+1)%3:0;A.cmb=c;A.lh0=now;if(c===2){if(d>0){d=Math.round(d*1.6)||2;hv=true}else hv=false}else if(c===1&&d>0)hv=false}   // combo de 3: el último golpe pesa un 60 % más
   
   if(specTry(m,now,wt)){}else if(wt==='m'){if(hv)HFX.push({k:wColor()?'thrust':'punch',x:P.x,y:P.y,tx:m.x,ty:m.y,th:m.d.h/2,t0:now,d:300});hitM(m,d,now);procs(m,d,hit,now)}else if(wt==='g'){const si=autoSpell();if(si>=0)fireSpell(si,m,now,N0.sp&&N0.sp.si===si?N0.sp:null);else hitM(m,hit?1:0,now,'mg',1)}else{PJ.push({x:P.x,y:P.y,sh:14,tx:m.x,ty:m.y,th:m.d.h/2,t0:now,t1:now+(hv?260:150),m,d,wt,hv});snd('bow');useAmmo();procs(m,d,hit,now)}
   if(!A||A.e!==m)return;A.nx=rollAtk(m)}}
 else if(A.ty==='c'&&Math.hypot(P.x-A.e.x,P.y-A.e.y)>80)stopA();
}
const CM=10, // margen (px de mundo) antes de la pared: el jugador se detiene un poco antes de pisarla (F1-C4b)
cliff=(x,y)=>TER.cliffNear(x,y,CM),lockedAt=(x,y)=>biomeAt(x,y)<0,   // Fase 44a: solo el vacío. Los jefes son HITO, ya no llave: ningún bioma está cerrado por un jefe vivo (el freno es el peligro: aviso de zona)
blk=(x,y)=>INT?intBlk(x,y):x<8||x>WW-8||y<30||y>WH-28||lockedAt(x,y)||cliff(x,y)||PROPS.solid(x,y)||TER.heightAt(x,y)<1;   // agua (altura .75) o vacío (0): el agua sale de TER (BIOMES.geo), ya no hay rectángulos BLK
// Movimiento en sub-pasos de <=3 px: ningún dt grande ni buff de velocidad puede «saltar» por encima de una pared (los tiles de pared miden 32 px, el margen CM=10).
function step(ax,ay){const n=Math.max(1,Math.ceil(Math.max(Math.abs(ax),Math.abs(ay))/3)),sx=ax/n,sy=ay/n;for(let i=0;i<n;i++){const nx=P.x+sx,ny=P.y+sy;if(blk(nx,ny))break;P.x=nx;P.y=ny}}
// TOPE DURO (requisito del dueño: el borde del mapa es infranqueable). Se ejecuta al final del movimiento de cada frame y NO depende de blk()/BLK/cliff():
// (1) rectángulo jugable derivado de los tiles de borde (dibujados por TER), (2) si el jugador acabó sobre un tile de acantilado o tras una compuerta cerrada,
// vuelve a la última posición válida (o al campamento si no hay). Cubre teletransporte, reaparición, partida guardada con coordenadas malas, lag, etc.
let GOOD=null;
const spawnK=()=>Math.max(0,Math.min(BIOMES.N-1,S.home||0)); // Fase 44a: última aldea visitada (S.home), ya no «el bioma más lejano alcanzable»
function guard(){const T=ISO.TILE,xm=T+CM,xM=(TER.NX-1)*T-CM,ym=T+CM,yM=Math.floor((WH-28)/T)*T-CM;
 if(!isFinite(P.x)||!isFinite(P.y)){const q=spawnOf(spawnK());P.x=q.x;P.y=q.y}
 P.x=Math.min(xM,Math.max(xm,P.x));P.y=Math.min(yM,Math.max(ym,P.y));
 const th=TER.tileH(Math.floor(P.x/T),Math.floor(P.y/T)),bad=th>=2||th===0||lockedAt(P.x,P.y);
 if(!bad){GOOD={x:P.x,y:P.y};return}
 if(GOOD){P.x=GOOD.x;P.y=GOOD.y}else{const q=spawnOf(spawnK());P.x=q.x;P.y=q.y;GOOD={x:P.x,y:P.y}}}
// fase del golpe (0..1): el impacto ocurre cuando llega a 1, justo al aplicar el daño o completar la acción
/* H7 · RESISTENCIA al correr (decisión D1 del dueño, 20 oct 2026). Estado S.sta (0–100) y S.exh (agotado). OJO: S.st ya existe (contadores de logros); por eso se llama S.sta. Valores ajustables en STA. */
const STA={drain:8,reg:22,pause:.9,exReg:11,rec:40};let STP=0;
/* DASH / ESQUIVA (ISLA-7, 21 oct 2026; primer paso del rework de combate, Fase 31 del plan): tecla ESPACIO. Impulso corto (~3,7 casillas en .19 s) en la dirección de las teclas (o la última de marcha), con
   INVULNERABILIDAD (i-frames) durante el impulso y un instante después: sirve para atravesar los golpes pesados telegrafados. Cuesta resistencia (S.sta, DSH.cost) y tiene enfriamiento. Sin botón táctil todavía. */
let SHRUN=0;
const DSH={on:0,cd:0,t0:0,t1:0,an:0,dx:0,dy:1,inv:0,sp:520,len:.30,ifr:.28,cost:45,cdt:800,warn:0};   // QUICKSTEP estilo Bloodborne (21 oct 2026): arranque rápido y frenada suave (v = sp·(1−u)^1,5 → ≈ 62 px en 0,30 s), animación ≈ 0,42 s (`an`), i-frames 0,28 s, 16 de resistencia   // 21 oct 2026 (ajuste del dueño): VOLTERETA lenta: 120 px/s × 0,52 s ≈ 62 px; animación de ≈ 0,62 s (`an`), invulnerable los primeros 0,4 s (`ifr`), 16 de resistencia   // 21 oct 2026: MÁS LENTO y CORTO (220 px/s × 0,32 s ≈ 70 px ≈ 2,2 casillas; antes 118 px en 0,19 s); i-frames = impulso + 130 ms; enfriamiento 1,1 s
const dashInv=()=>performance.now()<DSH.inv;

/* ═══ BLOQUEO + PERFECT DODGE (21 oct 2026; pedido del dueño: «la última mejora del combate») ═══
   BLOQUEO: mantén Q. Solo con armas cuerpo a cuerpo (y puños); arco y magia NO bloquean (`wtype()!=='m'`). Mientras bloqueas: te mueves al 30 %, no atacas y no recuperas resistencia. Cada golpe BLOQUEADO mitiga daño y cuesta resistencia (más cuanto más daño):
   · ESCUDO equipado: mitiga 80 % y cuesta ≈ 2,2 de resistencia por punto de daño (+2) · arma sola: 50 % y 4,5 por punto (+5) · puños: 30 % y 4,5 por punto (+5); los golpes PESADOS telegrafados cuestan ×1,4. Si no alcanza la resistencia, se rompe la guardia: el golpe entra ENTERO y quedas sin aliento.
   · PARADA PERFECTA: si el golpe cae dentro de los primeros 200 ms (260 con escudo) desde que empezaste a bloquear, NO recibes daño y NO gastas resistencia, el enemigo queda aturdido ≈ 0,9 s; tiene ENFRIAMIENTO de 2,5 s (`BLK.pcd`; durante él, bloquear funciona como un bloqueo normal).
   PERFECT DODGE: si un golpe te alcanza (o casi) durante los primeros 170 ms de la esquiva, se devuelve el 80 % de su coste de resistencia (cuesta ≈ 9 en vez de 45), el enfriamiento casi desaparece, queda una IMAGEN FANTASMA azulada (`R3D.ghost`) y el tiempo se frena un instante.
   Ajustables en BLK/DSH. El golpe de los jefes `dot` (veneno…) no se bloquea. */
/* BARRA DE HABILIDADES (22 oct 2026; pedido del dueño): barra pequeña bajo la vida (hud.js `#hs-sk`). Hoy una habilidad aprendida en el tutorial del Cielo: BOLA DE FUEGO CELESTIAL (tecla 1 o LMB en la casilla; necesita un BÁCULO equipado y maná;
   con la habilidad SELECCIONADA (tecla 1 / LMB en la casilla) el LMB del bastón la lanza). `S.skl` = {id:1} aprendidas (se guarda); `skl()` lo crea. Para añadir una: fila en ABIL + `learnSkill(id)`; la barra admite hasta 6 casillas (teclas 1–6; hoy solo la 1 está conectada a `castSkill`). */
const skl=()=>S.skl||(S.skl={}),ABIL=[{id:'cel',n:'Bola de fuego celestial',key:'1',cost:1,cd:1400,t:0,col:'#7fd0ff',d:'Pulsa para seleccionarla; con un bastón equipado y maná, el LMB la lanza hacia el cursor. Mantén LMB+RMB para cargarla.'}];
function learnSkill(id){const d=ABIL.find(x=>x.id===id);if(!d||skl()[id])return;skl()[id]=1;dirty=1;try{snd('rare');toast('✨ Aprendes <b>'+d.n+'</b> (tecla <b>'+d.key+'</b>)',3600)}catch(e){}save()}
// SELECCIONAR (no lanzar): la tecla 1 o un LMB en la casilla marca/desmarca la habilidad (`skl().sel`); con el bastón equipado y la bola seleccionada, el LMB la lanza (22 oct 2026, pedido del dueño: más claro). Sin seleccionar, el bastón golpea cuerpo a cuerpo.
function selSkill(i){const d=ABIL[i];if(!d||!skl()[d.id])return false;const on=skl().sel===d.id;skl().sel=on?null:d.id;dirty=1;try{tone(on?300:700,.06,'triangle',.05)}catch(e){}
 log(on?'Habilidad desmarcada: '+d.n+'.':'✨ <b>'+d.n+'</b> seleccionada: '+(wKind()==='staff'?'pulsa LMB para lanzarla.':'equipa un bastón para lanzarla.'));return true}
// APUNTADO LIBRE (22 oct 2026): con arco o con un hechizo seleccionado el héroe mira SIEMPRE al cursor en combate (no se encara solo al enemigo más cercano ni al fijado con Tab): el tiro va exactamente a donde apuntas.
const freeAim=()=>wtype()==='r'||(wKind()==='staff'&&!!skl().cel&&skl().sel==='cel');
const BLK={on:0,t0:0,pcd:0,hit:-1e9,k:0,warn:0,pw:200,pws:260,mit:.8,mitW:.5,mitF:.3};
const hasSh=()=>!!S.eq.s&&(SHL[S.eq.s]!=null||/^sh_/.test(String(S.eq.s)));
const blkCan=()=>!(inRoom()||CK||P.hp<=0||CHG.on||DSH.on||(typeof CINE!=='undefined'&&CINE.on)||wtype()!=='m');
function blockStart(){const now=performance.now();if(BLK.on)return false;const ok=blockStart0(now);if(ok)inc('bstart');return ok}
function blockStart0(now){
 if(wtype()!=='m'){if(now-BLK.warn>1500){BLK.warn=now;log('Con arco o magia no puedes bloquear.')}return false}
 if(!blkCan()||swSlow(now))return false;if(S.sta==null)S.sta=100;
 if(S.sta<6){if(now-BLK.warn>1500){BLK.warn=now;log('Sin aliento para bloquear.')}return false}
 BLK.on=1;BLK.t0=now;P.g=P.mv=null;stopA();try{tone(280,.05,'triangle',.04,190)}catch(e){}return true}
function blockEnd(){BLK.on=0}
function blkTick(dt,now){if(BLK.on&&(!blkCan()||S.sta<=0))BLK.on=0;if(BLK.on)STP=Math.max(STP,.9);const t=BLK.on?1:0;BLK.k+=(t-BLK.k)*(1-Math.exp(-dt*(t?16:10)));if(BLK.k<.005)BLK.k=0}
// un golpe de `m` de daño `d0` llega al jugador: devuelve {d: daño que pasa, kind: null|'block'|'perfect'|'broke'}. `heavy` = golpe pesado telegrafado.
function guardHit(m,d0,now,heavy){if(!BLK.on)return{d:d0,kind:null};const sh=hasSh();
 if(now-BLK.t0<=(sh?BLK.pws:BLK.pw)&&now>=BLK.pcd){BLK.pcd=now+2500;BLK.hit=now;m.nt=Math.max(m.nt||0,now+900);m.wind=null;m.tel=null;m.rip=now+SG.ripMs;m.ripSure=0;RIP=m;stagger(m,(m.sgM||sgInit(m)||4)*.6,now);   // CONTRAATAQUE: ventana x2 + golpe seguro
  {const mx=(m.x+P.x)/2,my=(m.y+P.y)/2;try{R3D.spell.parry(mx,my,Math.atan2(m.y-P.y,m.x-P.x))}catch(e){}HFX.push({k:'star',tx:mx,ty:my,th:16,t0:now,d:420});fText('¡PARADA PERFECTA!','#ffe08a',P.x,P.y,52);try{tone(1180,.38,'triangle',.07,1100);tone(1790,.3,'sine',.05,1700);tone(2650,.22,'sine',.035,2500);tone(210,.2,'square',.05,70)}catch(e){}}
  
  sp(P.x,P.y-12,'#fff1c8',12,120,80,130);sp(P.x,P.y-10,'#ffd27a',10,90,60,110);SHK=now+160;snd('rare');try{tone(1480,.14,'triangle',.07,1000);tone(740,.2,'sine',.05,400)}catch(e){}
  if(window.R3D){R3D.tscale=.05;clearTimeout(window.__hs);window.__hs=setTimeout(()=>{if(!(typeof CINE!=='undefined'&&CINE.on))R3D.tscale=1},85)}
  log('✦ <b>¡Parada perfecta!</b> '+m.d.n+' queda aturdido.');inc('pblock');return{d:0,kind:'perfect'}}
 if(d0<=0)return{d:0,kind:null};
 const mit=sh?BLK.mit:S.eq.w?BLK.mitW:BLK.mitF,cost=Math.ceil((sh?2.2:4.5)*d0*(heavy?1.4:1)+(sh?2:5));
 if(S.sta<cost){S.sta=0;STP=3;BLK.on=0;sp(P.x,P.y-8,'#ff6a5a',9,90,60,110);try{tone(150,.2,'sawtooth',.07,70)}catch(e){}log('¡Guardia rota! Sin resistencia para aguantar el golpe.');return{d:d0,kind:'broke'}}
 S.sta-=cost;STP=2;BLK.hit=now;sp(P.x,P.y-10,'#cfe3ff',sh?10:6,90,50,110);sp(P.x,P.y-8,'#ffffff',4,60,40,90);SHK=Math.max(SHK,now+(sh?90:60));snd('hit');try{tone(sh?820:620,.08,'square',.05,sh?520:380)}catch(e){}
 {const dd=Math.max(0,Math.round(d0*(1-mit)));fText(dd<d0?'MITIGADO −'+(d0-dd):'BLOQUEADO',sh?'#9fd0ff':'#cfe3ff',P.x,P.y,46);return{d:dd,kind:'block'}}}
// PERFECT DODGE: el golpe de `m` cae en los primeros 170 ms de la esquiva → reembolso de resistencia, fantasma y un instante de cámara lenta (una vez por esquiva)
function pdCheck(m,now){if(DSH.pd===DSH.t0)return;const t=now-DSH.t0;if(t<0||t>170)return;DSH.pd=DSH.t0;
 S.sta=Math.min(100,(S.sta||0)+Math.round(DSH.cost*.8));DSH.cd=now+120;STP=.4;inc('pdodge');
 try{const z=TER.standZ(P.x,P.y),sx=DSH.sx==null?P.x:DSH.sx,sy=DSH.sy==null?P.y:DSH.sy;R3D.ghost([[sx,sy,TER.standZ(sx,sy)],[(sx*2+P.x)/3,(sy*2+P.y)/3,z],[(sx+P.x*2)/3,(sy+P.y*2)/3,z]],'#bfe6ff')}catch(e){}
 sp(P.x,P.y-6,'#bfe6ff',12,100,60,110);try{tone(1180,.16,'sine',.06,1760);tone(1760,.2,'sine',.04,2200)}catch(e){}
 if(window.R3D&&!(typeof CINE!=='undefined'&&CINE.on)){R3D.tscale=.3;clearTimeout(window.__hs);window.__hs=setTimeout(()=>{R3D.tscale=1},170)}
 fText('¡ESQUIVA PERFECTA!','#9fe0ff',P.x,P.y,52);try{HUDSU.refund(Math.round(DSH.cost*.8))}catch(e){}
 log('✦ <b>¡Esquiva perfecta!</b>')}
/* SALTO (21 oct 2026; pedido del dueño): saltito de ≈ .55 niveles (≈ 35 cm de mundo) que NO gasta resistencia ni da invulnerabilidad; solo es visual (la colisión es 2D y no cambia). Botón `#jmpb` (HUD) o tecla V.
   `JMP.u` = fase 0..1 (heroState3D → `jmp` para la animación y `z` + `jh`); no se puede encadenar en el aire. */
const JMP={t0:-1e9,ms:480,h:.55,cd:0};
const jmpU=now=>{const u=(now-JMP.t0)/JMP.ms;return u>0&&u<1?u:0},jmpH=u=>{const w=Math.max(0,Math.min(1,(u-.12)/.76));return JMP.h*4*w*(1-w)};
function jump(){const now=performance.now();if(STS.frozen(P)||STS.has(P,'root')||inRoom()||CK||P.hp<=0||now<JMP.t0+JMP.ms+60||(typeof CINE!=='undefined'&&CINE.on))return false;JMP.t0=now;try{tone(260,.09,'sine',.04,180)}catch(e){}return true}
/* (el botón físico `#jmpb` se QUITÓ el 21 oct 2026: habrá una UI única en modo móvil; el salto queda en la tecla V y en `jump()`) */
function dash(){const now=performance.now();if(TAME.on){TAME.press(now);return false}   /* DOMAR-D2: ESPACIO durante la doma es la reacción a la sacudida, no una esquiva */if(STS.frozen(P)||STS.has(P,'root')||inRoom()||CK||P.hp<=0||now<DSH.cd||(typeof CINE!=='undefined'&&CINE.on))return false;if(S.sta==null)S.sta=100;
 if(S.sta<DSH.cost){if(now-DSH.warn>1500){DSH.warn=now;log('Sin aliento para esquivar.')}return false}
 const kd=ISO.keyDir(K.l,K.r,K.u,K.d);let dx=kd.x,dy=kd.y;if(!dx&&!dy){   /* sin teclas en combate: PASO ATRÁS (lejos del cursor o del enemigo encarado) */
  let ax=0,ay=0;if(nowCombat()&&CUR.on&&!CUR.touch&&aimOn()){const w=ISO.toWorld(CUR.px,CUR.py,TER.heightAt);ax=P.x-w.x;ay=P.y-w.y}else if(nowCombat()){const f=combatFoe(now);if(f){ax=P.x-f.x;ay=P.y-f.y}}
  if(Math.hypot(ax,ay)>4){dx=ax;dy=ay}else{dx=P.ldx||0;dy=P.ldy||0}}if(!dx&&!dy){dx=0;dy=1}const l=Math.hypot(dx,dy);dx/=l;dy/=l;
 if(now<SWG.t0+SWG.ms){if(!SWG.done)swingResolve(now);SWG.t0=-1e9;SWG.cd=Math.min(SWG.cd,now+DSH.len*1000+200);ATKT=Math.min(ATKT,SWG.cd);SWG.lg=0}   // ESQUIVA CANCELA EL RETROCESO del golpe (21 oct 2026): el golpe pendiente se resuelve al instante, la animación de recuperación se corta y puedes volver a atacar justo al acabar la esquiva (ventana de combo)
 S.sta-=DSH.cost;STP=nowCombat()?3.5:1.5;BLK.on=0;Object.assign(DSH,{sx:P.x,sy:P.y,on:1,t0:now,t1:now+DSH.len*1000,an:now+DSH.len*1000+320,dx,dy,inv:now+DSH.ifr*1000,cd:now+DSH.cdt});P.g=P.mv=null;stopA();CK=null;inc('dash');
 sp(P.x,P.y-4,'#e8cf94',9,70,40,90);sp(P.x,P.y-2,'#ffffff',5,50,30,70);try{if(typeof FOOT!=='undefined')FOOT.sfx('dash',.9)}catch(e){}return true}
function dashStep(dt,now){if(!DSH.on)return false;if(now>=DSH.t1){DSH.on=0;return false}const u=(now-DSH.t0)/Math.max(1,DSH.t1-DSH.t0),v=DSH.sp*Math.pow(Math.max(0,1-u),1.5);step(DSH.dx*v*dt,0);step(0,DSH.dy*v*dt);P.mvg=1;P.anm=1;P.wt=null;P.dir=HERO.dirOf(DSH.dx,DSH.dy);if(Math.abs(DSH.dx-DSH.dy)>.01)P.f=DSH.dx-DSH.dy>0?1:-1;if(Math.random()<.5)sp(P.x,P.y-2,'#e8cf94',1,30,20,60);return true}
/* ENCARAR AL ENEMIGO (21 oct 2026; pedido del dueño: «en combate el personaje siempre mira al enemigo salvo que corra con Mayús»): `combatFoe(now)` = el enemigo VIVO más cercano que te persigue (`m.hunt`, <330 px) o el que acabas de golpear (<260 px y `P.cbT` en los últimos 4 s). Mientras exista y no corras (Mayús), `heroState3D` mira SIEMPRE hacia él (también al andar: la marcha es de lado/de espaldas, `back`), y la guardia de combate no se pierde. Correr = mira a donde corres. Los jefes sellados no cuentan. */
let foK=0,foE=null,LOCK=null;   // OBJETIVO FIJADO con Tab (21 oct 2026): el héroe lo encara aunque no te persiga; se suelta al morir, alejarte >480 px o con Tab sobre «ninguno»
function lockCycle(){const now=performance.now(),L=M.filter(m=>alive(m,now)&&!sealed(m)&&Math.hypot(m.x-P.x,m.y-P.y)<420).sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y));
 if(!L.length){LOCK=null;try{R3D.actors.lock(null)}catch(e){}return}const i=L.indexOf(LOCK);LOCK=i<0?L[0]:(i+1<L.length?L[i+1]:null);try{R3D.actors.lock(LOCK)}catch(e){}try{tone(LOCK?640:420,.05,'triangle',.05)}catch(e){}}
function combatFoe(now){if(inRoom()||P.hp<=0)return null;if(LOCK){if(alive(LOCK,now)&&!sealed(LOCK)&&Math.hypot(LOCK.x-P.x,LOCK.y-P.y)<480)return LOCK;LOCK=null;try{R3D.actors.lock(null)}catch(e){}}let b=null,bd=1e9;const hit=now-(P.cbT||-1e9)<4000;
 for(const m of M){if(!alive(m,now)||sealed(m))continue;const d=Math.hypot(m.x-P.x,m.y-P.y);if(((m.hunt&&d<330)||(hit&&d<260))&&d<bd){bd=d;b=m}}return b}
function nowCombat(){const nw=performance.now();return nw-(P.cbT||-1e9)<3000||nw-fightAt<3000||M.some(m=>m.hunt&&alive(m,nw)&&Math.hypot(m.x-P.x,m.y-P.y)<380)}   // en combate la resistencia se regenera al 30 % (el dash no se puede spamear)
function staTick(dt){if(S.sta==null)S.sta=100;const run=RUN&&P.mvg&&!S.exh&&!MOUNT.on;if(run){const nw=performance.now(),cb=nw-(P.cbT||-1e9)<3000||M.some(m=>m.hunt&&alive(m,nw)&&Math.hypot(m.x-P.x,m.y-P.y)<380);S.sta=Math.max(0,S.sta-STA.drain*(cb?2.4:1)*(typeof COC!=='undefined'&&COC.has('sta')?.7:1)*dt);   // EN COMBATE correr gasta ×2,4 (≈ 5 s de carrera; ajustado a la baja a petición del dueño: era ×4,5)
 STP=STA.pause;if(S.sta<=0){S.exh=1;RUN=0;runBtn();log('Estás agotado: recupera el aliento para volver a correr.')}}else if(STP>0)STP-=dt;else if(S.sta<100){S.sta=Math.min(100,S.sta+(S.exh?STA.exReg:STA.reg)*(nowCombat()?.3:1)*(typeof COC!=='undefined'&&COC.has('sta')?1.5:1)*dt);if(S.exh&&S.sta>=STA.rec)S.exh=0}}
let PPL=0,ATKT=0,CK=null,RUN=0,EN=100,MN=4,MNl=0,LSCD=0,PJ=[],STK=0,BT=0,FREEC=0,MM=1,LD=0;   // MM: 0 oculto · 1 minimapa · 2 mapa grande (tecla M)
const mnMax=()=>3+L('mg')+gs('mana')+2*S.mana2+(STF[S.eq.w]||0)*2,mreg=()=>.025+(typeof MAGIC_ON!=='undefined'&&!MAGIC_ON?.1:0)+L('mg')*.0004+gs('mreg')*MRU+.006*S.mreg2+(STF[S.eq.w]||0)*.002+(S.buf.mreg>Date.now()?.12:0);const enMax=()=>100,ENREG=.5; // ENERGÍA = barra de ESPECIAL del arma (como OSRS): 100 máx., +10 % cada 20 s; correr ya no gasta

const autoBtn=()=>{const b=$('#autob');if(b)b.textContent='Auto-objetivo: '+(S.auto?'SÍ':'NO')},tgAuto=()=>{S.auto=S.auto?0:1;autoBtn();save()},runBtn=()=>{const b=$('#runb');if(b)b.textContent='🏃 Correr: '+(RUN?'SÍ':'NO')+' (Mayús)'},tgRun=()=>{if(!RUN&&S.exh){log('Estás agotado: recupera el aliento para volver a correr.');return}RUN=RUN?0:1;runBtn();S.hintR=1;if(typeof rhHide==='function')rhHide()};
const BONUSP=.22;let QTY=1,BL=0;const setQty=n=>{QTY=n;dirty=1},qtyBar=()=>'<div style="margin-top:10px;border-top:2px dashed var(--hi);padding-top:6px"><div class="hint" style="margin:0 0 4px">Cantidad a fabricar'+(A&&A.ty==='c'&&A.left<1e8?' (te quedan '+A.left+')':'')+'</div>'+[[1,'x1'],[2,'x2'],[5,'x5'],[10,'x10'],[25,'x25'],[0,'Todo']].map(([n,l])=>`<button class="bt" style="${QTY===n?'background:#8a7a56;color:#fff':''}" onclick="setQty(${n})">${l}</button>`).join(' ')+'</div>';
function startBonus(i){CK={i,streak:0,bonus:1,exp:performance.now()+7000};cookRound();log('🎲 ¡Aparece un minijuego bonus de cocina!')}
function startCook(i){const a=ACT.co[i];if(!S.stn||!near(S.stn)||L('co')<a[3]||!hasIn(a[1]))return log('Te faltan ingredientes o nivel.');stopA();CK={i,streak:0};cookRound()}
function cookRound(){const a=ACT.co[CK.i],hw=Math.min(.22,.07+L('co')*.0018);CK.hw=hw;CK.c=hw+.05+Math.random()*(.9-2*hw);CK.pos=0;CK.dir=1;CK.spd=.8+a[3]*.012;CK.res=null}
function cookUpd(dt,now){if(!S.stn||!near(S.stn)){CK=null;return}
 if(CK.res===null){CK.pos+=CK.dir*CK.spd*dt;if(CK.pos>=1){CK.pos=1;CK.dir=-1}if(CK.pos<=0){CK.pos=0;CK.dir=1}if(CK.bonus&&now>CK.exp){CK.res=0;CK.rt=now+700}}
 else if(now>=CK.rt){if(CK.bonus){const i=CK.i;CK=null;if(BL>0&&hasIn(ACT.co[i][1])&&L('co')>=ACT.co[i][3]){startC('co',i);if(A)A.left=BL}dirty=1;return}if(hasIn(ACT.co[CK.i][1]))cookRound();else{CK=null;log('Te quedaste sin ingredientes.')}dirty=1}}
function cookHit(){if(!CK||CK.res!==null)return;const a=ACT.co[CK.i];
 if(CK.bonus){const d=Math.abs(CK.pos-CK.c),q=d<=CK.hw*.35?2:d<=CK.hw?1:0;CK.res=q;CK.rt=performance.now()+900;
  if(q>0){add(a[2]);inc('make:'+a[2]);if(q===2)inc('perfect');gain('co',a[4]*(q===2?2:1));snd('coin');toast('🎲 ¡Bonus de cocina!<br>+1 '+I[a[2]][0]+' extra'+(q===2?' y XP doble':''))}else snd('miss');
  dirty=1;save();return}
 if(!hasIn(a[1])){CK=null;return}
 const d=Math.abs(CK.pos-CK.c),q=d<=CK.hw*.35?2:d<=CK.hw?1:0;CK.res=q;CK.rt=performance.now()+800;take(a[1]);
 if(q===0){add('quemado');CK.streak=0;snd('hurt')}
 else{add(a[2]);inc('make:'+a[2]);if(q===2){inc('perfect');CK.streak++;if(Math.random()<.25)add(a[2])}else CK.streak=0;gain('co',a[4]*(q===2?1.5:1)*(1+Math.min(CK.streak,5)*.1));snd('coin')}
 dirty=1;save()}
const SPL=[{id:'spark',n:'Chispa',e:'💫',lv:1,mp:3,xp:10,atk:1,max:4,r:{air:1},col:'#cfe8ff'},{id:'heal',n:'Curación',e:'💚',lv:8,mp:10,xp:15,r:{life:1},d:'Cura 8 PV + 0,5 por nivel de Magia'},
{id:'stone',n:'Piedra',e:'🪨',lv:10,mp:6,xp:20,atk:1,max:8,r:{earth:1,air:1},col:'#b09070'},{id:'haste',n:'Prisa',e:'💨',lv:15,mp:15,xp:30,r:{air:2},d:'+35% de velocidad durante 60 s'},
{id:'skin',n:'Piel de piedra',e:'🛡️',lv:20,mp:20,xp:45,r:{earth:2},d:'+5 de defensa durante 60 s'},{id:'wave',n:'Ola',e:'🌊',lv:25,mp:9,xp:40,atk:1,max:15,r:{water:1,air:1},col:'#4aa0ff'},
{id:'recall',n:'Regreso',e:'🏠',lv:30,mp:25,xp:60,r:{air:1,earth:1,life:1},d:'Te lleva al pueblo del bioma actual'},{id:'wis',n:'Sabiduría',e:'🧠',lv:40,mp:35,xp:90,r:{arc:1},d:'+50% de XP durante 60 s'},
{id:'fire',n:'Llamarada',e:'🔥',lv:45,mp:12,xp:70,atk:1,max:22,r:{fire:1,air:1},col:'#ff8a3a'},{id:'arcane',n:'Explosión arcana',e:'🔮',lv:60,mp:20,xp:120,atk:1,max:32,r:{arc:1,fire:1},col:'#c8a0ff'},
{id:'storm',n:'Tormenta',e:'⛈️',lv:70,mp:24,xp:170,atk:1,max:44,r:{air:2,water:1},col:'#7ab0ff'},{id:'gheal',n:'Curación mayor',e:'💖',lv:75,mp:30,xp:200,r:{life:3,water:1},d:'Cura 40 PV + 1 por nivel de Magia'},
{id:'vortex',n:'Vórtice',e:'🌀',lv:85,mp:32,xp:260,atk:1,max:60,r:{air:3,earth:2,arc:1},col:'#9a7aff'},{id:'cata',n:'Cataclismo',e:'☄️',lv:99,mp:48,xp:380,atk:1,max:82,r:{fire:3,arc:3,earth:2},col:'#ff6a3a'}];
const hasRunes=r=>Object.entries(r).every(([k,v])=>(S.runes[k]||0)>=v),spMax=s=>s.max+Math.floor(L('mg')/15)+(wtype()==='g'?STF[S.eq.w]:0),xpMul=m=>(5+.0026*m.lv*m.lv)*Math.max(.7,1+.08*(m.lv-m.d.lv));
function autoSpell(){let b=-1;SPL.forEach((s,i)=>{if(s.atk&&L('mg')>=s.lv&&MN>=s.mp&&hasRunes(s.r))b=i});return b}
function spellTarget(){if(A&&A.ty==='f')return A.e;let b=null,bd=240;const now=performance.now();M.forEach(m=>{if(!alive(m,now))return;const d=Math.hypot(m.x-P.x,m.y-P.y);if(d<bd){bd=d;b=m}});return b}
function pay(s){if(FREEC)return;if(Math.random()*100<pv('echo')){log('✨ ¡Eco arcano! El hechizo no gastó nada.');return}MN-=s.mp;Object.entries(s.r).forEach(([k,v])=>S.runes[k]-=v)}
function fireSpell(i,m,now,pre){const s=SPL[i];pay(s);const mx=pre?pre.mx:spMax(s),hit=pre?pre.hit:Math.random()<spAcc(m),d=pre?pre.d:hit?R(Math.ceil(mx*.5),mx):0,hv=d>=2&&d>=mx;
 PJ.push({x:P.x,y:P.y,sh:14,tx:m.x,ty:m.y,th:m.d.h/2,t0:now,t1:now+(hv?260:180),m,d,wt:'g',sk:'mg',mxv:mx,col:s.col,hv});snd('magic');inc('cast');dirty=1}
function cast(i,free){if(!MAGIC_ON){toast('✨ La magia está en rediseño: pronto escuelas y árboles de habilidad.',2600);return false}const s=SPL[i],now=performance.now();if(typeof STS!=='undefined'&&STS.has(P,'silence')){toast('🤐 Estás silenciado.',1400);return false}if(L('mg')<s.lv){log('Necesitas Magia nivel '+s.lv+'.');return false}if(!free&&MN<s.mp){log('Te falta maná.');return false}if(!free&&!hasRunes(s.r)){log('Te faltan runas: las sueltan los monstruos.');return false}
 FREEC=free?1:0;
 if(s.atk&&aimOn()&&!free){FREEC=0;selSpell(i);return true}   // combate dirigido: el hechizo de ataque se ELIGE aquí y se lanza con el LMB
 if(s.atk){if(now<ATKT){FREEC=0;return false}const m=spellTarget();if(!m){FREEC=0;log('No hay ningún enemigo cerca para lanzar el hechizo.');return false}ATKT=now+atkMs();if(!A||A.e!==m){stopA();P.g=null;startF(m,now)}P.f=m.x-m.y>=P.x-P.y?1:-1;fireSpell(i,m,now);FREEC=0;log('Lanzas '+s.n+(free?' (pergamino)':'')+'.');save();return true}
 pay(s);FREEC=0;const t=Date.now()+60000;
 if(s.id==='heal')P.hp=Math.min(maxHp(),P.hp+8+Math.floor(L('mg')/2));else if(s.id==='gheal')P.hp=Math.min(maxHp(),P.hp+40+L('mg'));else if(s.id==='haste')S.buf.spd=Math.max(S.buf.spd||0,t);else if(s.id==='skin')S.buf.def=t;else if(s.id==='recall'){stopA();P.g=P.mv=null;{const q=spawnOf(curB);P.x=q.x;P.y=q.y}FD=performance.now()}else if(s.id==='wis')S.buf.xp=Math.max(S.buf.xp||0,t);
 sp(P.x,P.y-16,'#c8a0ff',14,80,70,120);snd('magic');inc('cast');gain('mg',s.xp);log('Lanzas '+s.n+(free?' (pergamino)':'')+'.');dirty=1;save();return true}
function tpv(sk,id){const it=TOOLT[S.eq[sk]];let t=0;if(it&&it.pa)it.pa.forEach(p=>{if(p.id===id)t+=p.v});return t}
function setPer(np){const now=performance.now(),ph=swPh(now);A.per=np;A.t0=now-ph*np;A.lp=ph}
function hitMul(now){if(A.ty!=='g')return 1;const sk=A.sk;let m=1;
 if(A.fr&&now>A.fr){A.fr=0;setPer(A.base)}
 if(!A.fr&&Math.random()*100<tpv(sk,'frenzy')){A.fr=now+5000;setPer(A.base/2);sp(A.e.x,A.e.y-16,'#e8cf94',14,80,70,160);snd('rare');log('<span style="color:#e8cf94">⚡ ¡Frenesí! Velocidad x2 durante 5 s.</span>')}
 if(Math.random()*100<tpv(sk,'precise')){m=2;sp(A.e.x,A.e.y-12,'#ffffff',8,60,50,120)}return m}
function actLabel(){const sk=A.sk,a=ACT[sk][A.i],v=sk==='sm'?(String(a[2]).startsWith('b_')?'Fundir':'Forjar'):({wc:'Talar',mi:'Minar',fi:'Pescar',co:'Cocinar',cr:'Fabricar',es:'Esculpir',ins:'Inscribir',en:'Encantar'}[sk]||'Trabajar');return (TOOLS[sk]?v+', '+TOOLS[sk][0].toLowerCase()+' '+tn(sk,S.tool[sk]):v+': '+a[0])+(A.fr?' ⚡':'')}
function swPh(now){if(A.ty==='f')return Math.max(0,Math.min(1,1-(A.ph-now)/(A.ms||1800)));const p=A.per||900;return(((now-A.t0)%p)+p)%p/p}
let ZC=-1,ZB=null;const ZT={};
// descubrimiento (minimapa): una zona/guarida/punto de interés se marca al acercarse (borde + 90 px); la aldea a <420 px de su centro; el jefe a <650 px. Se guarda en S.map.
function discover(){const R=BI[curB],mk=(key,msg)=>{if(S.map[key])return;S.map[key]=1;if(msg)log('🗺️ Descubierto: '+msg);dirty=1};
 ZS.forEach((z,i)=>{if(z.k===curB&&!S.map['z'+i]&&P.x>z.r[0]-90&&P.x<z.r[1]+90&&P.y>z.r[2]-90&&P.y<z.r[3]+90){mk('z'+i,z.t);if(z.hito&&WMAP.ready)WMAP.revealAt(z.hito.x,z.hito.y,22)}});
 if(Math.hypot(P.x-(R.ox+R.cen[0]),P.y-(R.oy+R.cen[1]))<420)mk('v'+curB);if(Math.hypot(P.x-(R.ox+R.bossPos[0]),P.y-(R.oy+R.bossPos[1]))<650)mk('b'+curB)}
function zoneCheck(now){discover();if(S.wp&&Math.hypot(S.wp.x-P.x,S.wp.y-P.y)<96)delete S.wp;if(!WMAP.ready)WMAP.init(WENV);WMAP.tick(P.x,P.y);WMAP.paint(MM===2?8:1.5);   /* FLUIDEZ (26 oct 2026): con el minimapa (MM=1, lo normal) eran 8 ms POR FOTOGRAMA mientras se revelaban celdas (= tirones al explorar); el mapa grande sigue con 8 */let b=-1,ba=1e12;ZS.forEach((z,i)=>{if(z.k!==curB||P.x<z.r[0]||P.x>z.r[1]||P.y<z.r[2]||P.y>z.r[3])return;const a=(z.r[1]-z.r[0])*(z.r[3]-z.r[2]);if(a<ba){ba=a;b=i}});
 if(b!==ZC){ZC=b;if(b>=0&&now-(ZT[b]||-1e9)>8000){ZT[b]=now;ZB={t:ZS[b].t,t0:now}}}}
// ===== v29: clima, efectos de pantalla, decoración animada, sprites =====
let WX={t:'',end:0,next:0,nl:0},WXD=0,FL=0,THU=0,FD=0,BAN=null;const MMC=[];
SND.eat=()=>{[0,170,340].forEach(d=>setTimeout(()=>{noise(.07,.11,2200+d,'bandpass');tone(180,.05,'triangle',.05,-60)},d));setTimeout(()=>tone(300,.12,'sine',.05,-120),620)};
SND.thunder=()=>{if(typeof AMB!=='undefined'&&AMB.thunder())return;noise(1.1,.3,160,'lowpass');noise(.6,.18,420,'lowpass')};   // el pack matmos (src/ambience.js) pone las grabaciones de trueno; sin ellas, el sintetizado de siempre
// Fase 47 (19 oct 2026): el lienzo del mundo, la niebla (S.fog) y el pintado por celdas viven en src/worldmap.js; aquí solo se colocan los iconos descubiertos.
const WENV={TER,BI,biomeAt,mix:PAINT.mix,N:()=>N,ZS:()=>ZS,S:()=>S,dirty:()=>{dirty=1}};
const BDC={},BDS=2;function stBadge(id,em,r){const k=id+Math.round(r*10);let c=BDC[k];if(c)return c;c=BDC[k]=document.createElement('canvas');const n=Math.ceil((r+2)*2*BDS);c.width=c.height=n;const q=c.getContext('2d');q.scale(BDS,BDS);const h=n/BDS/2;q.fillStyle='#3a2a1c';q.beginPath();q.arc(h,h,r,0,7);q.fill();q.strokeStyle='#e8b84a';q.lineWidth=r>7?1.8:1.2;q.stroke();const mk=ITEMICON.marker(em);if(mk)q.drawImage(mk,h-r*.8,h-r*.8,r*1.6,r*1.6);else{q.font=Math.round(r*1.25)+'px sans-serif';q.textAlign='center';q.textBaseline='middle';q.fillStyle='#fff';q.fillText(em,h,h+.5)}return c} // insignias de instalaciones del mapa, pintadas una vez (el emoji por frame era caro)
// MM=1: minimapa LOCAL (círculo girado con la cámara: arriba del mapa = arriba de la pantalla; con marca N) · MM=2: mapa del MUNDO con niebla (norte arriba, bioma actual resaltado)
let MAPPJ=null;function drawMap(now){if(!WMAP.ready)return;if(MM!==2)MAPPJ=null;const big=MM===2,az=(window.R3D&&typeof R3D.az==='number')?R3D.az:Math.PI/4,sz=big?15:11,gold='#e8cf94';let pj,L=null;
 ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
 if(big){const pw=W-40,ph=H-150;pj=WMAP.big(ctx,20,88,pw,ph,(x,y,w,h)=>UI.plate(ctx,x-6,y-6,w+12,h+12,{r:6}));
  {const st=WMAP.stats(),tt='Mapa del mundo · explorado '+Math.round(100*st.revealed/st.cells)+' %  ·  M: cerrar',tx=pj.ox+pj.w/2;
   if(WMAP.painted){WMAP.cartouche(ctx,tx,Math.max(16,pj.oy-WMAP.FB-16),tt,15);WMAP.cartouche(ctx,tx,pj.oy+pj.h+WMAP.FB+16,'🏘 Aldea  ·  ! Misión  ·  ▭ Bioma actual  ·  LMB: marcar destino',13)}
   else{ctx.font='600 16px Cinzel, Georgia, serif';ctx.lineWidth=3;ctx.strokeStyle='#000';ctx.fillStyle='#f2e6c0';ctx.strokeText(tt,tx,pj.oy-17);ctx.fillText(tt,tx,pj.oy-17)}}
  MAPPJ=pj;  const R0=BI[curB],a=pj.proj(R0.ox,R0.oy),b=pj.proj(R0.ox+R0.w,R0.oy+R0.h);ctx.save();ctx.strokeStyle=gold;ctx.lineWidth=2;ctx.setLineDash([8,5]);ctx.strokeRect(a[0],a[1],b[0]-a[0],b[1]-a[1]);ctx.restore();
  BI.forEach((B,k)=>{if(k!==curB&&!WMAP.revealed(B.ox+B.cen[0],B.oy+B.cen[1]))return;const an=BIOMES.mapA&&BIOMES.mapA.anchor[k],c=an?pj.proj(an[0],an[1]-700):pj.proj(B.ox+B.w/2,B.oy+B.h*.2);ctx.font='600 17px Cinzel, Georgia, serif';ctx.lineWidth=4;ctx.strokeStyle='#000';ctx.strokeText(B.n.toUpperCase(),c[0],c[1]);ctx.fillStyle=k===curB?gold:'#d9ccaa';ctx.fillText(B.n.toUpperCase(),c[0],c[1])});
  if(!WMAP.painted){ctx.font='600 16px Cinzel, Georgia, serif';ctx.fillStyle=gold;ctx.strokeStyle='#000';ctx.lineWidth=3;ctx.strokeText('N ↑',pj.ox+pj.w-26,pj.oy+16);ctx.fillText('N ↑',pj.ox+pj.w-26,pj.oy+16)}}   // con el marco dibujado la rosa de los vientos ya marca el norte
 else{const D=Math.min(150,Math.round(Math.min(W,H)*.3)),cx0=W-D/2-14,cy0=44+D/2+6;
  pj=WMAP.local(ctx,cx0,cy0,D,P.x,P.y,az);L={cx:cx0,cy:cy0,r:D/2};
  const nx=cx0+Math.sin(az)*(D/2-9),ny=cy0-Math.cos(az)*(D/2-9);ctx.font='600 12px Cinzel, Georgia, serif';ctx.lineWidth=3;ctx.strokeStyle='#000';ctx.strokeText('N',nx,ny);ctx.fillStyle=gold;ctx.fillText('N',nx,ny);
  ctx.font='600 12px Cinzel, Georgia, serif';ctx.lineWidth=3;ctx.strokeStyle='#000';const nm=BI[curB].n+' · '+clkTxt();{const mw=2*Math.min(cx0,W-cx0)-8,tw=ctx.measureText(nm).width;if(tw>mw)ctx.font='600 '+Math.max(8,12*mw/tw).toFixed(1)+'px Cinzel, Georgia, serif'}ctx.strokeText(nm,cx0,cy0+D/2+16);ctx.fillStyle='#f2e6c0';ctx.fillText(nm,cx0,cy0+D/2+16)}
 const inside=(x,y,m)=>!L||Math.hypot(x-L.cx,y-L.cy)<=L.r-m;
 const ic=(e,x,y,lb,s2)=>{const[px,py]=pj.proj(x,y);if(!inside(px,py,3))return;const z=s2||sz,mk=ITEMICON.marker(e);if(mk)ctx.drawImage(mk,px-z*.65,py-z*.65,z*1.3,z*1.3);else{ctx.font=z+'px sans-serif';ctx.fillStyle='#fff';ctx.fillText(e,px,py)}
  if(big&&lb){ctx.font='600 12px Cinzel, Georgia, serif';ctx.lineWidth=3;ctx.strokeStyle='#000';ctx.strokeText(lb,px,py+z*.95);ctx.fillStyle='#fff';ctx.fillText(lb,px,py+z*.95)}};
 const SM={ru:['💬','Ru'],herreria:['⚒️','Herrería'],banco:['🏦','Banco'],tienda:['🛒','Tienda'],taberna:['🍺','Taberna'],taller:['🪚','Taller'],shrine:['🙏','Altar']};
 BI.forEach((B,k)=>{const known=S.map['v'+k]||k===0;if(!known)return;
  if(big)ic('🏘️',B.ox+B.cen[0],B.oy+B.cen[1],'Aldea de '+B.n,17);
  else{const r=sz*.5;ST.forEach(e=>{const key=e.id==='door'?e.room:e.id,m=SM[key];if(!m||ownAt(e.x,e.y)!==k)return;const[px,py]=pj.proj(e.x,e.y);if(!inside(px,py,r+1))return;const bd=stBadge(key,m[0],r);ctx.drawImage(bd,px-bd.width/2/BDS,py-bd.height/2/BDS,bd.width/BDS,bd.height/BDS)})}});   // las instalaciones viven en las casas: se marcan las puertas (solo en el minimapa local; en el mapa grande basta el icono de la aldea)
 // E4: MARCADOR DE DESTINO (S.wp): bandera roja con distancia; en el minimapa local se pega al borde del círculo para indicar la dirección
 if(S.wp){let[px,py]=pj.proj(S.wp.x,S.wp.y);const d=Math.hypot(S.wp.x-P.x,S.wp.y-P.y)/32;if(L){const dx=px-L.cx,dy=py-L.cy,dd=Math.hypot(dx,dy),R=L.r-7;if(dd>R){px=L.cx+dx/dd*R;py=L.cy+dy/dd*R}}ctx.fillStyle='#b8321f';ctx.strokeStyle='#1a1208';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px,py-(big?16:12));ctx.lineTo(px+(big?11:8),py-(big?12:9));ctx.lineTo(px,py-(big?8:6));ctx.stroke();ctx.fill();if(big||(!L||Math.hypot(px-L.cx,py-L.cy)>L.r-9)){ctx.font='600 11px Cinzel, Georgia, serif';ctx.fillStyle='#f2e6c0';ctx.lineWidth=3;ctx.strokeText(Math.round(d)+' m',px,py+9);ctx.fillText(Math.round(d)+' m',px,py+9)}}
 // ICONOS DE MISIÓN en el minimapa (21 oct 2026): «!» dorado (disponible), «?» gris (en curso), «?» dorado (entregar) sobre el PNJ de cada misión, en el minimapa local y en el mapa grande; al borde del círculo se pegan para indicar la dirección
 {const sq=big?16:13;ctx.font='700 '+sq+'px Cinzel, Georgia, serif';ctx.lineWidth=3;ctx.strokeStyle='#1a1208';ST.forEach(e=>{const m=questMark(e);if(!m)return;let[px,py]=pj.proj(e.x,e.y);if(L){const dx=px-L.cx,dy=py-L.cy,d=Math.hypot(dx,dy),R=L.r-8;if(d>R){px=L.cx+dx/d*R;py=L.cy+dy/d*R}}
   const pul=m.k==='wait'?0:.5+.5*Math.sin(now/260);ctx.save();if(m.k!=='wait'){ctx.shadowColor='rgba(255,214,110,'+(.35+.4*pul)+')';ctx.shadowBlur=6+4*pul}ctx.strokeText(m.c,px,py);ctx.fillStyle=m.k==='wait'?'#a8a396':'#f0d98c';ctx.fillText(m.c,px,py);ctx.restore()})}
 ZS.forEach((z,i)=>{if(!S.map['z'+i])return;const t=z.t,sp=t.indexOf(' ');ic(t.slice(0,sp),(z.r[0]+z.r[1])/2,(z.r[2]+z.r[3])/2,t.slice(sp+1),big?13:sz)});
 M.forEach(m=>{const k=ownAt(m.x,m.y);if(m.d.boss&&alive(m,now)&&k>=0&&S.map['b'+k])ic('💀',m.x,m.y,m.d.boss===2?'Capitán':'Jefe')});
 {const ti=qTrackInfo();if(ti){const pu=.5+.5*Math.sin(now/260),zx=ti.zone?(ti.zone[0]+ti.zone[1])/2:ti.x,zy=ti.zone?(ti.zone[2]+ti.zone[3])/2:ti.y;let[px,py]=pj.proj(zx,zy);
   if(L){const dx=px-L.cx,dy=py-L.cy,d=Math.hypot(dx,dy),lim=L.r-8;if(d>lim){px=L.cx+dx/d*lim;py=L.cy+dy/d*lim}}   // fuera de la ventana: el 📍 se queda en el borde apuntando hacia la misión
   ctx.save();ctx.fillStyle='rgba(232,207,148,'+(.14+.1*pu)+')';ctx.strokeStyle='#e8cf94';ctx.lineWidth=2;ctx.setLineDash([5,4]);
   if(ti.ring&&inside(px,py,2)){ctx.beginPath();ctx.arc(px,py,Math.max(6,ti.ring[2]*pj.s),0,7);ctx.fill();ctx.stroke()}
   else if(ti.zone&&!big&&inside(px,py,2)){const a=pj.proj(ti.zone[0],ti.zone[2]),b=pj.proj(ti.zone[1],ti.zone[3]);ctx.beginPath();ctx.arc(px,py,Math.max(8,Math.hypot(ti.zone[1]-ti.zone[0],ti.zone[3]-ti.zone[2])*pj.s/2),0,7);ctx.fill();ctx.stroke()}
   ctx.restore();const mk=ITEMICON.marker('📍'),z=big?18:13;if(mk)ctx.drawImage(mk,px-z*.65,py-z*.65,z*1.3,z*1.3);else{ctx.font=z+'px sans-serif';ctx.fillStyle='#fff';ctx.fillText('📍',px,py)}}}
 {const[px,py]=pj.proj(P.x,P.y);ctx.fillStyle='#000';ctx.beginPath();ctx.arc(px,py,big?4.5:4,0,7);ctx.fill();ctx.fillStyle=Math.floor(now/400)%2?'#ffffff':'#e8cf94';ctx.beginPath();ctx.arc(px,py,big?3:2.6,0,7);ctx.fill()}
 ctx.restore()}
function banner(t,sub,c,dur){if(typeof HUDSU!=='undefined'&&HUDSU.ok){HUDSU.banner(t,sub,c,dur);return}BAN={t,sub,c,t0:performance.now(),dur}}
function weather(now,dt){BR.update(now,dt,curB);   // Fase B3: el clima sale de BIOME_RULES (src/biome-rules.js); aquí solo se copia al estado que lee el código antiguo (ambient.js, 3D)
 WX.t=BR.kind==='storm'?'storm':BR.kind==='rain'?'rain':'';WXD=BR.wet;FL=Math.max(FL,BR.flash);if(BR.thunder)snd('thunder');if(AMASTER)AMASTER.gain.value=BR.snd;
 FL=Math.max(0,FL-dt*2.2);
 ST.forEach(e=>{if(e.id==='furnace'&&Math.abs(e.x-P.x)<420&&Math.abs(e.y-P.y)<320&&Math.random()<dt*2.5)(window.R3D&&R3D.fx?R3D.fx.smoke(e.x+10,e.y,40,'#8a867e',1,{size:.2,grow:3.2,life:1.5,up:.6,alpha:.36}):sp(e.x+10,e.y-42,'#9a9a9a',1,8,16,-8));if(SX&&e.id==='fire'&&Math.abs(e.x-P.x)<420&&Math.abs(e.y-P.y)<320&&Math.random()<dt*(A&&A.e===e?5:2))sp(e.x+R(-5,5),e.y-24,'#ffb040',1,14,34,-6)})}
const hsOn=()=>typeof HUDSU!=='undefined'&&HUDSU.ok;
function hudFx(now){
 if(FL>.02){ctx.save();ctx.globalAlpha=Math.min(1,FL);ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);ctx.restore()}
 if(FD){const e=now-FD;if(e<900){ctx.save();ctx.globalAlpha=1-e/900;ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);ctx.restore()}else FD=0}

 if(BAN){const el=now-BAN.t0;if(el>BAN.dur)BAN=null;else{const u=Math.min(1,el/250),a=el>BAN.dur-700?(BAN.dur-el)/700:Math.min(1,u*1.5),sc=.6+.4*u+Math.sin(u*Math.PI)*.12;
  ctx.save();ctx.translate(W/2,H*.3);ctx.scale(sc,sc);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a*.3;ctx.fillStyle=BAN.c;
  for(let i=0;i<12;i++){const an=i*Math.PI/6+el/2500;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(an-.07)*200,Math.sin(an-.07)*75);ctx.lineTo(Math.cos(an+.07)*200,Math.sin(an+.07)*75);ctx.fill()}
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=a;ctx.textAlign='center';ctx.lineJoin='round';ctx.font='40px "Pixelify Sans", VT323, monospace';ctx.lineWidth=6;ctx.strokeStyle='#000';ctx.strokeText(BAN.t,0,0);ctx.fillStyle=BAN.c;ctx.fillText(BAN.t,0,0);
  if(BAN.sub){ctx.font='22px VT323, monospace';ctx.lineWidth=4;ctx.strokeText(BAN.sub,0,28);ctx.fillStyle='#fff';ctx.fillText(BAN.sub,0,28)}ctx.restore()}}}
const WN=t=>sunS(t)<-.05?'#ffd070':'#6a8ab0';
// Fase 44a · frontera abierta: al cruzar a otro bioma se anuncia su nombre y, si tu nivel de combate queda muy por debajo del recomendado, un AVISO DE ZONA PELIGROSA (no bloquea nada: el freno es el peligro).
// Pausa de 60 s por bioma para que ir y venir sobre la línea de unión no repita el aviso.
const DZT={};
function zoneAnnounce(bi,now){const b=BI[bi],lvl=CBL();if(now-(DZT[bi]||-1e9)<60000)return;DZT[bi]=now;
 if(!b.zone&&lvl<b.lv*.75){banner('⚠️ Zona peligrosa: '+b.n,'Nivel recomendado '+b.lv+'+ · tu nivel de combate es '+lvl+'. Puedes volver atrás.','#ff5a3a',4800);snd('miss')}
 toast(b.ic+' <b>'+b.n+'</b><br>Nivel recomendado: '+b.lv+'+')}
function upd(dt,now){swingTick(now,dt);if(INT&&INT.cave)CAVE.tick(now,dt);if(typeof AMB!=='undefined')AMB.tick(now,dt);if(!INT){zoneCheck(now);weather(now,dt);AMBI.update(now,dt,{k:curB,sun:sunS(now/1000),wx:WX.t});if(typeof VILL!=='undefined')VILL.tick(dt);if(typeof ISLA!=='undefined')ISLA.tick(dt);if(typeof PLAYA!=='undefined')PLAYA.tick(dt);if(now-BT>1000){BT=now;if(M.some(m=>m.d.boss&&!alive(m,now)))dirty=1}const bi=biomeAt(P.x,P.y);if(bi>=0&&bi!==curB){curB=bi;if(bi<BIOMES.L&&bi+1>(S.st.bio||0)){S.st.bio=bi+1;chk()}   /* Fase 49a: `bio` (logros, runas de viaje) sigue contando los 6 biomas originales; los esqueletos aún no puntúan */zoneAnnounce(bi,now)}
 if(bi>=0&&S.home!==bi&&inVilla(P.x,P.y)){S.home=bi;log('🏘️ Reaparecerás en la aldea de <b>'+BI[bi].n+'</b>.');dirty=1}}   // Fase 44a: S.home = última aldea visitada
 const kd=ISO.keyDir(K.l,K.r,K.u,K.d);let dx=kd.x,dy=kd.y;
 if(dx||dy){if(P.g||P.mv||A||CK){if(!(A&&A.fg&&(A.fg.st==='fight'||A.fg.st==='reel'))||P.g||P.mv||CK){P.g=P.mv=null;stopA();CK=null}}}   // pesca: durante la lucha el personaje PUEDE retroceder (el pez tira; ver fishTick)
 else{const tg=P.g?P.g.e:P.mv;if(tg){const ex=tg.x-P.x,ey=tg.y-P.y,d=Math.hypot(ex,ey);
  if(d>(P.g?(P.g.e.d?(wtype()!=='m'?120:24):P.g.e.t==='fi'?FISHR:24):3)){const mt=P.g&&tg.st&&tg.st.length&&d>FISHR?(q=>({x:q[0],y:q[1]}))(tg.st.reduce((b,c)=>Math.hypot(c[0]-P.x,c[1]-P.y)<Math.hypot(b[0]-P.x,b[1]-P.y)?c:b)):tg,wp=bridgeWp(mt),wx=wp?wp.x-P.x:mt.x-P.x,wy=wp?wp.y-P.y:mt.y-P.y,wd=Math.hypot(wx,wy)||1;dx=wx/wd;dy=wy/wd}else if(P.g){const e=P.g.e;P.g=null;engage(e,now)}else P.mv=null}}
 if(dashStep(dt,now)){dx=dy=0}   // ISLA-7: durante el impulso del dash no se aplica el movimiento normal
 P.mvg=0;if(dx||dy){if(!S.hintR&&typeof runHintTick==='function')runHintTick(dt);const l=Math.hypot(dx,dy);dx/=l;dy/=l;const run=MOUNT.on?MOUNT.gal(RUN):RUN&&!S.exh,sv=WALK_V*(1+pv('swift')/100)*(1+.04*(typeof ENCH!=='undefined'?ENCH.arm('celeridad'):0))*(1+.05*S.trv)*(S.buf.spd>Date.now()?1.35:1)*(MOUNT.on?MOUNT.mul(run):run?RUN_MUL:1)*(swSlow(now)?.3:1)*(A&&A.fg?.45:1)*STS.spd(P);const ox=P.x,oy=P.y;step(dx*sv*dt,0);step(0,dy*sv*dt);P.mvg=1;if(P.g&&Math.hypot(P.x-ox,P.y-oy)<.02)STK+=dt;else STK=0;if(STK>.4&&P.g){const e=P.g.e;if(Math.hypot(e.x-P.x,e.y-P.y)<(e.t==='fi'?FISHR+20:90)){P.g=null;STK=0;engage(e,now)}}if(run&&!MOUNT.on){S.agd=(S.agd||0)+sv*dt;if(S.agd>=32){S.st.run=(S.st.run||0)+(S.agd/32|0);S.agd%=32;chk()}}if(Math.abs(dx-dy)>.01)P.f=dx-dy>0?1:-1;P.dir=HERO.dirOf(dx,dy);P.ldx=dx;P.ldy=dy;P.wr=sv*2*Math.PI/(RUN?STRR:STRW);P.w+=dt*P.wr;P.anm=1;P.wt=null;if(typeof FOOT!=='undefined'&&!MOUNT.on)FOOT.tick(P,run)}   /* pasos: src/footsteps.js */
 else if(P.anm)settle(dt)
 if(P.mvg&&now-LD>(RUN?90:260)){LD=now;{if(window.R3D&&R3D.fx)R3D.fx.dust(P.x-(P.ldx||0)*6,P.y-(P.ldy||0)*6,['#b8a888','#8a7e60','#6a6a50','#dfe6ec','#5a4a46','#6a5a52','#8a7a9a','#c8b080','#a8a89a','#e8f0ff'][curB]||'#b8a888',RUN?2:1,RUN?1:0)}}
 staTick(dt);EN=Math.min(enMax(),EN+dt*ENREG);MN=Math.min(mnMax(),MN+(STS.noMana()?0:dt*mreg()));prTick(dt);if(TB==='pr'&&Math.floor(PP*2)!==PPL){PPL=Math.floor(PP*2);dirty=1}if(TB==='mg'&&Math.floor(MN)!==MNl){MNl=Math.floor(MN);dirty=1}knTick(dt,now);PJ=PJ.filter(p=>{if(now>=p.t1){if(p.m)hitM(p.m,p.d,now,p.sk,p.mxv,p.wt);return false}return true});if(CK)cookUpd(dt,now);
 if(!INT)guard();act(now);dropUpd(now);hotTick(now);specTick(now);if(!INT)qTick(now);
 if(!(A&&A.ty==='f')&&now-SWG.last>4000&&now-lreg>12000){lreg=now;if(P.hp<maxHp()){P.hp++;dirty=1}}
 bossClean(now);dotTick(now);
 M.forEach(m=>{if(!alive(m,now))return;
  if(m.bleed&&now>=m.bleed.t){dotHit(m,1,now,'bleed');if(!alive(m,now))return;m.bleed.t=now+600;if(--m.bleed.n<=0)m.bleed=null}
  if(!m.hunt&&(Math.abs(P.x-m.x)>2600||Math.abs(P.y-m.y)>2600))return;   /* E2 (26 oct 2026): criatura DORMIDA = lejos del jugador (>2600 px, fuera del radio del actor 3D) y sin perseguir: no vagabundea ni comprueba aldea; cuesta 2 comparaciones aunque haya cientos de miles de tiles de fauna */
  const dx=P.x-m.x,dy=P.y-m.y,dp=Math.hypot(dx,dy),inV=inVilla(P.x,P.y),busy=P.pjM&&P.pjM!==m&&now<P.pj&&alive(P.pjM,now)&&P.pjM.hunt;
  if(m.d.tm&&TAME.mobTick(m,now,dt,dp,dx,dy))return;   /* DOMAR-D2: alerta/huida del animal domable */
  if(m.d.ag&&!m.hunt&&!sealed(m)&&now>m.ag0&&dp<85&&!inV&&!busy&&P.hp>0&&CBL()*.8<m.lv*2){m.hunt=1;m.lx=null;m.nt=now+900;m.ag0=now+10000;log('<span style="color:#ff6a5a">¡'+m.d.n+' nv.'+m.lv+' te ataca!</span>');if(A&&A.ty!=='f')stopA()}
  if(m.d.fl&&(m.hunt||dp<130)&&P.hp>0){m.hunt=0;const k=dp||1,sp4=(dp<130?92:0)*dt,nx=m.x-dx/k*sp4,ny=m.y-dy/k*sp4;if(sp4&&!inVilla(nx,ny)){m.x=nx;m.y=ny;m.mv=now;m.f=-(dx-dy)>=0?1:-1}return}   // PRESAS (conejo): huyen del jugador en vez de pelear; mueve la criatura solo mientras estés a menos de 130 px
  if(m.hunt){const lx=m.lx==null?m.hx:m.lx,ly=m.lx==null?m.hy:m.ly;
   if(P.hp<=0||inV||Math.hypot(m.x-lx,m.y-ly)>(m.d.boss?260:m.d.lh||(m.d.ag?190:140))||dp>420){m.hunt=0;m.lx=null;m.ag0=now+6000;m.tel=null;return}
   if(m.d.boss)bossTick(m,now);
   if(m.stun>now||STS.frozen(m)){m.wind=null;m.dash=null;m.tel=null;m.f=dx-dy>=0?1:-1;return}
   if(STS.has(m,'fear')){m.wind=null;m.dash=null;m.tel=null;const k=dp||1,sf=50*dt*STS.spd(m),nx=m.x-dx/k*sf,ny=m.y-dy/k*sf;if(!inVilla(nx,ny)){m.x=nx;m.y=ny;m.mv=now;m.f=-(dx-dy)>=0?1:-1}return}   // MIEDO: huye y no ataca
   if(m.dash){skDash(m,now,dt,dx,dy,dp);return}   // ATURDIDO / CONGELADO: no se mueve ni ataca
   if(telOn(m)&&telUpd(m,now))return;
   if(m.wind){const w=m.wind;if(now<w.t1){m.f=dx-dy>=0?1:-1;if(w.slow&&now>w.t0+w.d*.35)sp(m.x+(dx/(dp||1))*14,m.y-m.d.h*.95,'#ffe9a8',1,26,40,-30);return}m.wind=null;if(w.kind==='sk')skFire(m,w,now,dx,dy,dp);else windHit(m,w,now,dx,dy,dp);return}   // AVISO DE GOLPE: el enemigo se queda quieto con el cono rojo y golpea al terminar
   if(m.d.sk&&skPick(m,now,dx,dy,dp))return;
   if(dp>40){const sp2=(m.d.ag?58:45)*dt*STS.spd(m),nx=m.x+dx/dp*sp2,ny=m.y+dy/dp*sp2;if(!inVilla(nx,ny)){m.x=nx;m.y=ny;m.mv=now;m.f=dx-dy>=0?1:-1}else if(INT&&INT.cave){if(!inVilla(nx,m.y)){m.x=nx;m.mv=now}else if(!inVilla(m.x,ny)){m.y=ny;m.mv=now}}}else if(!busy){m.f=dx-dy>=0?1:-1;if(now>=m.nt){if(telOn(m)&&now>=(m.tn||(m.tn=now+4000)))telStart(m,now);else if(!m.wind){const big=bigFoe(m),gb=m.d.id==='gabriel',wd=gb?Math.round(950*Math.max(.8,m.asx||1)):big?Math.max(420,Math.min(720,(m.d.as||2400)*.22*(m.asx||1))):800,kind=gb?((m.gc=(m.gc||0)+1)%3===0?'dbl':'one'):null;   /* GABRIEL (21 oct 2026): ataque BASICO con anticipacion larga del BRAZO (se alza despacio ~1 s, sin cono en el suelo; actors3d.js `wind.slow`) y cada 3.er es un COMBO de dos golpes */
    m.wind={t0:now,t1:now+wd,d:wd,ang:Math.atan2(dy,dx),big:big&&!gb,slow:gb?1:0,kind};m.nt=now+(m.d.as||2400)*(m.asx||1)+wd+(kind==='dbl'?1000:0)}}if(!A&&!P.g&&!P.mv&&!(K.l||K.r||K.u||K.d))startF(m,now)}return}
  if(now>m.wt){m.wt=now+R(2000,5000);m.tx=m.hx+R(-16,16);m.ty=m.hy+R(-12,12)}
  const ex=m.tx-m.x,ey=m.ty-m.y,d=Math.hypot(ex,ey);if(d>2){const sp3=d>60?55:18,nx=m.x+ex/d*sp3*dt,ny=m.y+ey/d*sp3*dt;if(!inVilla(nx,ny)){m.x=nx;m.y=ny;m.mv=now;m.f=ex-ey>=0?1:-1}}});
 if(A&&A.wh)whTick(now);
 if(A&&A.wk)WKUI.tick(now);castTick(now);if(!inRoom()&&skinNear())ctxHint('skin',[[['F'],'desollar el cadáver (3 s; no te muevas)']],8000);
 if(A&&A.fg)fishTick(now,dt);
 if(A&&!A.wh&&!A.fg&&!A.wk){const ph=swPh(now),imp=A.lp!=null&&ph<A.lp-.4;A.lp=ph;if(imp&&A.ty!=='f'){const e=A.e,k=A.sk;snd(k);
  if(k==='wc')sp(e.x,e.y-26,'#5ab04a',2,30,10,60);else if(k==='mi')sp(e.x,e.y-10,'#ffd27a',4,60,40,160);else if(k==='sm')sp(e.x,e.y-8,'#ff9a2a',5,70,50,200);
  else if(k==='fi'){sp(e.x,e.y,'#cfe8ff',3,30,30,100);TER.ripple(e.x,e.y);if(window.R3D&&R3D.water)R3D.water.event('tug',e)}else if(k==='co')sp(e.x,e.y-14,'#aaa',2,10,25,-10);else if(k==='cr'||k==='pe'||k==='sa'||k==='es')sp(e.x,e.y-10,'#d8c9a3',2,30,20,80);else if(k==='ins')sp(e.x,e.y-18,'#ffe8a0',4,60,60,-20);A.pr+=A.amt*hitMul(now);if(A.pr>=1){A.pr=Math.min(A.pr-1,.99);fin(now)}}}
 parts.forEach(p=>{p.x+=p.vx*DT;p.y+=p.vy*DT;p.vy+=p.g*DT;p.l-=DT*1.1});parts=parts.filter(p=>p.l>0)}

// ---------- dibujo ----------
const cv=$('#c');let ctx=cv.getContext('2d');
// RECTÁNGULO DEL LIENZO EN CACHÉ (Lote ANTI-TIRONES, 25 oct 2026): leer getBoundingClientRect() DESPUÉS de escribir estilos fuerza un reflow; las etiquetas de enemigos (dMo), la mira, los textos flotantes… lo hacían una vez POR ENEMIGO y fotograma (medido: 0,5–4,7 ms en combate). El lienzo solo cambia al redimensionar: usa SIEMPRE cvRect() en código que corre cada fotograma.
let CVR=null;const cvRect=()=>CVR||(CVR=cv.getBoundingClientRect());addEventListener('resize',()=>{CVR=null});try{new ResizeObserver(()=>{CVR=null}).observe(cv)}catch(e){}setInterval(()=>{CVR=null},2000); // F2-C4: canvas WebGL del agua bajo el 2D + capa de grano (?nogl fuerza el agua 2D)
let W=640,H=400; // unidades del HUD (1 unidad = hs px CSS, ver fitCv): W y H salen del tamaño de la ventana (pantalla completa)
const GR=null,RD=null,WT=null,VG=null,SX=null,CH=null,SP=null; // TEMPORAL: módulos cenitales borrados; las ramas antiguas de sprites siguen vivas hasta F3–F5 (ver AGENTS.md)
const lc=document.createElement('canvas');lc.width=W;lc.height=H;const lx=lc.getContext('2d'),DAYLEN=360,dayP=t=>(t/DAYLEN+.33)%1,sunS=t=>Math.sin(2*Math.PI*(dayP(t)-.25));
let SHD={dx:0,dy:2,a:.26};
function Sd(x,y,w,h){if(SIL)return;if(BAKE){BAKE.sh.push([x-BAKE.ax,y-BAKE.ay,w,h]);return}const q=SHD;if(q.a<.02)return;ctx.save();ctx.globalAlpha=q.a;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(Math.round(x+w/2+q.dx/2),Math.round(y+h/2+q.dy/2),w/2+Math.abs(q.dx)/2,h/2+Math.abs(q.dy)/2+1,0,0,7);ctx.fill();ctx.restore()}
const Rc=(c,x,y,w,h)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)};
// ---- Fase 3: panadería de sprites (ver src/sprites.js y AGENTS.md). BAKE = {ax,ay,sh} mientras fn() se ejecuta contra un canvas de caché:
// Sd NO pinta (la sombra depende del sol y se dibuja en vivo cada frame con las posiciones que Sd anotó en BAKE.sh).
let BAKE=null;
// Dibuja en (x,y) el sprite cacheado `key`; si no existe, lo hornea llamando a fn(ax,ay) con `ctx` redirigido. Devuelve lo que devuelva fn (p. ej. `ty` de dS).
// REQUISITO: fn debe depender SOLO de lo que va en `key` (nada de performance.now, t o Math.random sin cuantizar). w,h,ax,ay = tamaño y ancla del canvas.
function bk(key,x,y,w,h,ax,ay,fn){const s=SP.get(key,w,h,ax,ay,g=>{const r=ctx,b=BAKE;ctx=g;BAKE={ax,ay,sh:[]};try{return{v:fn(ax,ay),sh:BAKE.sh}}finally{ctx=r;BAKE=b}}),rx=Math.round(x),ry=Math.round(y);
 for(const q of s.r.sh)Sd(rx+q[0],ry+q[1],q[2],q[3]);ctx.drawImage(s.c,rx-s.ax,ry-s.ay);return s.r.v}

let TXS=1; // corrección del tamaño del texto dentro de spr() (los sprites se escalan SPR veces)
const T=(s,x,y,c)=>{if(SIL)return;ctx.font='600 '+(13.5*TXS)+'px '+UI.FONT;ctx.textAlign='center';ctx.lineJoin='round';ctx.lineWidth=3*TXS;ctx.strokeStyle='rgba(26,15,10,.8)';ctx.strokeText(s,x,y);ctx.fillStyle=c==='#fff'?'#ecdfc6':c==='#e8cf94'?'#e8cf94':c;ctx.fillText(s,x,y)}; // rótulos del mundo: texto claro con contorno de tinta (como el resto del arte)
// T con caché para etiquetas que casi nunca cambian (nombre de estación, nivel de monstruo). NO usar con texto que cambia cada frame (se llenaría la caché).
const TC=(s,x,y,c)=>{if(!SP)return T(s,x,y,c);const w=Math.max(24,s.length*10+8);bk('t|'+c+'|'+s,x,y,w,20,w>>1,15,(X,Y)=>T(s,X,Y,c))};
const QW=Math.PI/8; // la fase de paso se cuantiza a 16 fotogramas por ciclo (≈30 ms cada uno a 12 rad/s): indistinguible a ojo y deja la caché en 16+2 sprites por equipo


const TCl=['#3a8a3a','#2f7a4a','#4aa86a','#c8652a','#7a3a8a'],OC=['#c8742a','#e8e8f8','#a0502a','#222','#4a7aff','#3adf6a'];
// Recurso dorado: halo radial aditivo que respira, estrella de 4 puntas que gira y chispas que orbitan (fase determinista por posición). De noche además emite luz real ('gold' en light.js).
const GLD=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const q=c.getContext('2d'),r=q.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,244,170,.95)');r.addColorStop(.3,'rgba(255,205,70,.55)');r.addColorStop(.7,'rgba(255,170,30,.14)');r.addColorStop(1,'rgba(255,170,30,0)');q.fillStyle=r;q.fillRect(0,0,64,64);return c})();



function dS(e,t){const x=e.x,y=e.y,id=e.id;if(e.nodraw)return;if(id==='door'||id==='exit')return id==='door'&&R3D.facOn?undefined:dDoor(e,t);   // Fase 18: SOLO la etiqueta (y el «!» de Ru): el cuerpo de la estacion/PNJ es 3D (stations3d.js, actors3d.js)
  if(e.npc){const lh=e.lh=R3D.actors.has(e)?R3D.actors.labelH(e):70;TC(e.n,x,y-lh/SPR,'#fff');return}
  if(PROPS.ST[id]){const lh=e.lh=(id==='ru'&&R3D.actors.has(e))?R3D.actors.labelH(e):PROPS.ST[id].lh;TC(e.n,x,y-lh/SPR,'#fff');if(id==='ru'&&S.gseen!==S.goal)T('!',x,y-(lh+16)/SPR+Math.sin(t*5)*2,'#e8cf94')}}


// Lote R3D-ACTORES: SOLO la barra de vida y la etiqueta del enemigo (con ?r3d=1 el cuerpo ya lo dibuja src/r3d/actors3d.js en el mundo 3D y se omite el sprite)
/* NAMEPLATE DE ENEMIGOS (21 oct 2026; pedido del dueño: «más estético, nombre del bicho y nivel, basado en nuestra UI»): ya no se dibuja en el lienzo 2D; es DOM de cristal con trazo dorado (css/hud-susurro.css, bloque «Nameplates»).
   Muestra nombre (Cinzel), nivel en una insignia de color según la dificultad frente a tu nivel de combate y, solo si está herido, la barra de vida. Jefes = marco ámbar con «◆»; agresivos = «⚔». Se pide cada fotograma desde dMo y `npSweep()` oculta los no pedidos. */
const NPS=new Map();let npRoot=null;
function npGet(m){let e=NPS.get(m);if(e)return e;if(!npRoot){npRoot=document.createElement('div');npRoot.id='nps';document.body.appendChild(npRoot)}
 const el=document.createElement('div');el.className='np';el.innerHTML='<div class="npb"><u></u><i></i><span class="npt"></span><em class="npp"></em></div><b class="npl"></b><s class="nps"><i></i></s><div class="npd"></div>';npRoot.appendChild(el);
 e={el,l:el.querySelector('.npl'),t:el.querySelector('.npt'),p:el.querySelector('.npp'),f:el.querySelector('.npb i'),sg:el.querySelector('.nps'),sgi:el.querySelector('.nps i'),g:el.querySelector('.npb u'),d:el.querySelector('.npd'),dk:'',hp:1,seen:0,key:''};NPS.set(m,e);return e}
/* BARRA DE JEFE (21 oct 2026; decision del dueño: TODOS los jefes siguen el formato Dark Souls = cinematica de inicio + titulo + esta barra; los MINI-JEFES (capitanes boss:2) no llevan cinematica pero su nameplate es distinto, ver CSS `.np.b2`).
   Barra ancha abajo-centro con el nombre del jefe, relleno dorado-rojo, estela clara que baja tras cada golpe y marcas de fase. La muestra: jefe `boss:1` que te persigue (<620 px) o el combatiente de la isla (`ISLA.bossOn()`); mientras sale, su nameplate flotante se oculta (`BBM`). Al caer un jefe normal sale «DERROTADO». */
let BBE=null,BBM=null,BBG=1,BBGT=0,BBL=0;
function bbTick(now){
 let m=null;if(typeof ISLA!=='undefined'&&ISLA.boss&&ISLA.bossOn()&&alive(ISLA.boss,now))m=ISLA.boss;
 else{for(const e of M)if(e.d.boss===1&&e.hunt&&!e.sm&&alive(e,now)&&Math.hypot(e.x-P.x,e.y-P.y)<620){m=e;break}}
 if(!BBE){BBE=document.createElement('div');BBE.id='bbar';BBE.innerHTML='<div class="bb-n"></div><div class="bb-b"><u></u><i></i><b></b><b></b></div><div class="bb-s"><i></i></div>';document.body.appendChild(BBE)}
 if(BBM&&!m&&BBM!==ISLA_B()&&!alive(BBM,now)&&BBM.d.boss===1&&now-BBL<4000)try{banner(BBM.d.n,'Derrotado','#e8cf94',3200)}catch(e){}
 if(m!==BBM){BBM=m;if(m){BBE.querySelector('.bb-n').textContent=m.d.n;BBG=m.hp/m.mh;BBE.querySelector('u').style.width=(BBG*100)+'%';BBE.querySelector('i').style.width=(BBG*100)+'%'}}
 if(m)BBL=now;
 if(m){const sf=BBE.querySelector('.bb-s i'),sg=m.sgM?Math.max(0,m.sg/m.sgM):1;sf.style.width=(m.stun>now?100:sg*100)+'%';BBE.classList.toggle('stn',m.stun>now)}   // barra de STAGGER bajo la de vida
 BBE.classList.toggle('on',!!m&&!(typeof CINE!=='undefined'&&CINE.on)&&!inRoom());if(!m)return;
 const p=Math.max(0,Math.min(1,m.hp/m.mh)),f=BBE.querySelector('i'),g=BBE.querySelector('u');
 if(p<BBG-.0005){BBGT=now+450;BBG=p;f.style.width=(p*100)+'%'}else if(p>BBG+.0005){BBG=p;f.style.width=(p*100)+'%';g.style.width=(p*100)+'%'}
 if(BBGT&&now>BBGT){g.style.width=(p*100)+'%';BBGT=0}}
const ISLA_B=()=>typeof ISLA!=='undefined'?ISLA.boss:null;
function npSweep(){for(const [m,e] of NPS)if(!e.seen){e.el.remove();NPS.delete(m)}else e.seen=0}
/* ESTADOS SOBRE EL NAMEPLATE (estilo WoW): un iconito por estado alterado del enemigo (STS.list) con anillo de tiempo restante y los segundos; ×n si se apila. Solo toca el DOM si cambia el conjunto o el segundo. */
function npDeb(e,m){const L=(typeof STS!=='undefined'&&m.sts)?STS.list(m).filter(s=>s.d&&s.d.ic):[],key=L.map(s=>s.k+(s.n||1)).join(',');
 if(key!==e.dk){e.dk=key;e.nphD=1;e.d.innerHTML=L.map(s=>'<span class="npd1" data-k="'+s.k+'" style="--c:'+s.d.col+'"><i>'+STS.svg(s.k)+'</i>'+(s.n>1?'<sup>'+s.n+'</sup>':'')+'<b></b></span>').join('')}
 const ch=e.d.children;for(let i=0;i<L.length&&i<ch.length;i++){const s=L[i],p=Math.max(0,Math.min(1,s.rem/s.tot)),pp=Math.round(p*40)/40,sec=Math.ceil(s.rem/1000),q=ch[i];if(q._p!==pp){q._p=pp;q.style.setProperty('--p',pp)}if(q._s!==sec){q._s=sec;q.lastChild.textContent=sec}}}
function dMo(m,t,now){if(!alive(m,now)||m===BBM)return;const d=m.d,h=(window.R3D&&R3D.actors.topPx(m))||d.h;
 const dmg=m.hp<m.mh;if(!d.boss&&!d.ag&&!dmg&&Math.hypot(m.x-P.x,m.y-P.y)>300)return;   // «Lv» solo cerca (<300 px), en combate o si el enemigo es jefe/agresivo
 const c=ISO.toCanvas(m.x,m.y,TER.standZ(m.x,m.y)),r=cvRect(),k=r.width/cv.width,sy=c.y-(h+4)*SPR*ISO.scale();
 const e=npGet(m);e.seen=1;const gap=m.lv-CBL(),dif=gap>10?'hard':gap>4?'mid':gap<-6?'easy':'';
 const key=d.n+'|'+m.lv+'|'+(d.boss||0)+'|'+(d.ag?1:0)+'|'+(sealed(m)?1:0)+'|'+dif;
 if(e.key!==key){e.key=key;e.el.className='np'+(d.boss?' boss b'+d.boss:'')+(sealed(m)?' seal':'')+(d.ag?' ag':'')+(dif?' '+dif:'');e.l.textContent=m.lv;e.t.textContent=(d.boss===1?'◆ ':d.boss===2?'◇ ':d.ag?'⚔ ':'')+d.n}
 e.el.classList.toggle('dmg',dmg);if(!e.p.textContent)e.p.textContent=Math.ceil(m.hp/m.mh*100)+'%';const pct=Math.max(0,Math.min(1,m.hp/m.mh));
 if(pct!==e.hp){if(pct<e.hp)e.g.style.width=(e.hp*100)+'%';e.hp=pct;e.f.style.width=(pct*100)+'%';e.p.textContent=Math.ceil(pct*100)+'%';clearTimeout(e.gt);e.gt=setTimeout(()=>{e.g.style.width=(pct*100)+'%'},320)}
 {const q=m.sgM?Math.max(0,m.sg/m.sgM):1,st=m.stun>now;e.sg.classList.toggle('full',q>=.999&&!st);e.sg.classList.toggle('stn',st);e.sgi.style.width=(st?100:q*100)+'%'}   // barrita de stagger bajo la vida (solo si has empezado a bajarla)
 npDeb(e,m);
 if(e.nphD||e.key!==e.nphK){e.nphD=0;e.nphK=e.key;const fz=parseFloat(getComputedStyle(e.el).fontSize)||12;m._nph=e.el.offsetHeight+(e.d.children.length?e.d.offsetHeight+fz*.25:0)}   // alto de placa + iconos (para los números de daño), solo al cambiar
 {const tf='translate('+(r.left+c.x*k).toFixed(1)+'px,'+(r.top+sy*k).toFixed(1)+'px) translate(-50%,-100%)';if(tf!==e.tf){e.tf=tf;e.el.style.transform=tf}}}



// F4b: el héroe se dibuja con PROPS.player (modelo 2D + animaciones de src/hero.js). Dirección de 8 vías: al moverse sale del vector de movimiento (P.dir); al trabajar o pelear mira al objetivo.
const wColor=()=>S.eq.w?TCOL[tierOf(S.eq.w)]||(LOOT[S.eq.w]?['#c8742a','#9a9aa8','#cfd8e0','#4a7aff','#d83a3a','#3adf6a'][LOOT[S.eq.w].k]:'#ddd'):null;
function actState(now){if(CAST&&!inRoom())return{k:'se',ph:0};
 if(CK&&S.stn)return{k:'co',ph:0,id:S.stn.id};
 if(aimOn()&&CHG.on&&now-CHG.t0>220&&!CK)return{k:'f',wt:wtype(),wk:wKind(),wcol:wColor(),orb:ORB[tierOf(S.eq.w||'')],hv:1,ph:Math.min(.9,.3+chgK(now)*.6)};   // cargando: pose de preparación sostenida
 if(aimOn()&&now<SWG.t0+Math.min(SWG.ms,SWG.wind+900)&&!CK){const imp=SWG.t0+SWG.wind,b={k:'f',wt:SWG.wt,wk:wKind(),wcol:wColor(),orb:ORB[tierOf(S.eq.w||'')],hv:SWG.hv};return now<imp?Object.assign(b,{ph:.5+.5*Math.max(0,Math.min(1,(now-SWG.t0)/Math.max(1,SWG.wind)))}):Object.assign(b,{ph:0,rc:q4((now-imp)/260)})}   // combate dirigido: preparación → impacto → recuperación
 if(P.sp&&now-P.sp.t0<P.sp.d&&!CK)return{k:'sp',ph:(now-P.sp.t0)/P.sp.d,wt:P.sp.wt,wk:wKind(),wcol:wColor(),orb:ORB[tierOf(S.eq.w||'')]};
 if(P.eat&&now-P.eat<1000&&!CK)return{k:'eat',ph:(now-P.eat)/1000};
 if((ALQ.brewing||COC.cooking)&&!A)return{k:'co',ph:0};   // Alquimia: remueve con el cucharón (animación de cocinar)
 if(HERB.active&&!A)return{k:'he',ph:HERB.phase(now)};
 if(!A){if(P.pk&&now-P.pk<420)return{k:'pk',ph:(now-P.pk)/420};return null}const ph=swPh(now);
 if(A.ty==='f'){const wt=wtype(),hv=A.nx&&A.nx.wt===wt&&A.nx.heavy?1:0,armed=!!wColor(),wk=wKind();return Object.assign({k:'f',wt,wk,wcol:wColor(),orb:ORB[tierOf(S.eq.w||'')],hv},animPh(A.ms,A.ph-now,A.lh!=null?now-A.lh:1e9,wt==='r'?(hv?1150:900):wt==='g'?(hv?900:750):hv?(wk==='great'?880:760):wk==='great'?740:wk==='dagger'?400:armed?560:440))} // hv: el golpe que viene es máximo → animación especial del arma (hero.js)
 if(A.fg){const g=A.fg,tg=g.st==='bite'?.5+.5*Math.sin(now/55):g.st==='fight'?(g.pull?.35+.65*Math.min(1,g.T/80):.1):g.st==='reel'?.7:0;return{k:'fi',ph:Math.min(.99,(now-A.t0)/2400),tug:tg}}   // pesca: la caña tironea con el pez
 if(A.wk)return WKUI.pose(now);
 if(A.wh&&A.ty==='g'){const an=whPose(now);return Object.assign({k:A.sk,col:TCOL[TT[S.tool[A.sk]]]||'#aaa'},an)}   // rueda: el héroe solo golpea cuando pulsas; la pose sale de whPose (continua, ver más arriba)
 if(A.ty==='g'){const per=A.per||900;if(A.sk==='fi'){const sg=ph*per;return{k:'fi',ph:Math.min(.99,(now-A.t0)/2400),tug:sg<320&&now-A.t0>per?q4(1-sg/320):0}} // pesca: lanza UNA vez al empezar y espera; en cada «picada» (vuelta del ciclo) la caña da un tirón
  return Object.assign({k:A.sk,col:TCOL[TT[S.tool[A.sk]]]||'#aaa'},animPh(per,per*(1-ph),per*ph,A.sk==='wc'?720:680))}
 return{k:A.sk,ph,id:A.e&&A.e.id,...(A.sk==='sm'&&A.e&&A.e.id!=='furnace'?animPh(A.per||900,(A.per||900)*(1-ph),(A.per||900)*ph,650):{})}}
// Acciones con golpe (lote M4, oct 2026): antes la animación se estiraba sobre TODO el intervalo entre golpes (1,8-2,4 s → ~1,3 s subiendo el hacha o la espada, a cámara lenta).
// Ahora dura Dk ms y TERMINA justo en el impacto del juego; antes, el personaje espera en guardia (ph=0, respira: rd=1) y tras el golpe vuelve a la guardia en R ms
// (rc 0→1: HERO.pose funde la pose final con la de guardia). per = intervalo entre golpes, tau = ms hasta el siguiente, sg = ms desde el anterior.
function animPh(per,tau,sg,Dk){const D=Math.min(Dk,per),R=Math.min(260,per-D);if(tau<=D)return{ph:Math.max(0,Math.min(1,1-tau/D))};if(sg<R)return{ph:0,rc:q4(sg/R)};return{ph:0,rd:1}}
const q4=v=>Math.floor(Math.max(0,Math.min(.999,v))*4)/4;
// Ritmo de pasos ligado a la velocidad (oct 2026): un ciclo (dos pasos) cada STRW px de mundo andando y STRR corriendo. Antes la fase avanzaba por tiempo
// (12 rad/s ×1.5 al correr) aunque correr solo es ×1.15 más rápido → los pies «patinaban» y la carrera parecía acelerada. Con buffs de velocidad la cadencia sube sola.
// F4 · VELOCIDAD (decisión del dueño, 17 oct 2026; hecha el 18 oct): andar = WALK_V px/s (antes 95: con el héroe 3D a escala equivalía a un trote y el pie patinaba); correr = ×RUN_MUL (antes ×1,15; ahora ≈ el doble que andar, como OSRS).
// Correr sigue siendo GRATIS (la Energía es la barra del especial). Los ciclos de paso 2D (STRW/STRR) se recalcularon para conservar la cadencia (~1,8 ciclos/s andando, ~2,7 corriendo); el héroe 3D ajusta zancada y cadencia solo por la velocidad medida (heroanim3d.js).
const WALK_V=70,RUN_MUL=1.9,STRW=39,STRR=49;
// Asentado al parar: en vez de saltar del medio paso al reposo, la fase sigue hasta el siguiente APOYO (seno = ±1: ambos pies en el suelo, w = π/2 + kπ) y entonces pasa a reposo.
// Como mucho un cuarto de ciclo (~120 ms andando). Usa fotogramas ya horneados (no añade horneados). Si empieza una acción, se corta.
function settle(dt){if(P.wt==null){const k=Math.ceil((P.w-Math.PI/2)/Math.PI-1e-3);P.wt=Math.PI/2+k*Math.PI}P.w=Math.min(P.wt,P.w+dt*(P.wr||12));if(typeof FOOT!=='undefined')FOOT.tick(P,0);if(P.w>=P.wt){P.anm=0;P.wt=null}}
// Giro suave: la dirección visual avanza UN paso de 45° cada 55 ms hacia la real (antes saltaba de golpe, p. ej. 180° en un fotograma)
function visDir(now){const tg=P.dir==null?2:P.dir;if(P.vd==null)P.vd=tg;if(P.vd!==tg&&now-(P.vt||0)>55){P.vt=now;const df=((tg-P.vd)%8+8)%8;P.vd=(P.vd+(df<=4?1:7))%8}return P.vd}

// R3D (?r3d=1): estado del héroe para src/r3d/hero3d.js. Misma lógica que dP (mirar al objetivo, acción, asentado al parar) pero sin dibujar.
// look = apariencia + equipo (S.app, gearOpts()). ?capa=1 fuerza una capa para probar la tela (las capas serán objetos raros; por defecto lleva bufanda).
function heroState3D(now){now=performance.now();   /* CLAVE (21 oct 2026): r3d.js llama con el reloj VIRTUAL (`now-vlag`); cada golpe crítico (parada de impacto, `R3D.tscale`) lo atrasaba ≈ 75 ms para SIEMPRE y la pose del golpe (sg=now-A.h0, con h0 en reloj real) llegaba cada vez más tarde = desync progresivo. Todo lo que compara con campos escritos con performance.now() (A.h0, SWG.t0, DSH, JMP…) debe usar el reloj REAL */
 const t=now/1000,tg=A&&A.e?A.e:(HERB.active?HERB.target:(ALQ.active&&ALQ.stn?ALQ.stn:(CAST&&CAST.e?CAST.e:(CK&&S.stn?S.stn:null))));let fx=null,fy=null;
 const cbNow=!!(A&&A.ty==='f');if(cbNow)P.cbT=now;   // Lote R3D-ANIM: guardia de combate (se mantiene 2,5 s tras el último combate o golpe recibido)
 if(tg&&!P.mvg&&tg.x!=null){fx=tg.x-P.x;fy=tg.y-P.y;P.dir=HERO.dirOf(fx,fy)}
 if(typeof FORGE!=='undefined'&&FORGE.on&&A&&A.wk&&!P.mvg){const fd=FORGE.faceDir();if(fd){fx=fd[0];fy=fd[1];P.dir=HERO.dirOf(fx,fy)}}   // D8: dentro de la interfaz de la fragua el héroe mira hacia el yunque dibujado (derecha de la pantalla)
 if(A&&A.fg&&A.fg.st!=='wait'){fx=(A.fg.fx||A.e.x)-P.x;fy=(A.fg.fy||A.e.y)-P.y;P.dir=HERO.dirOf(fx,fy)}   // pesca: el héroe siempre mira al pez, también al retroceder
 const cn=typeof CINE!=="undefined"&&CINE.on?CINE:null;if(cn&&cn.look){fx=cn.look[0];fy=cn.look[1];P.dir=HERO.dirOf(fx,fy)}   // CINE-4: el héroe mira hacia donde dice la escena
 if(aimOn()&&!(cn&&cn.look)){if(now-SWG.last<650&&!CHG.on){fx=SWG.dx;fy=SWG.dy;P.dir=HERO.dirOf(fx,fy)}else if((CHG.on||curHid()&&!P.mvg||!P.mvg&&now-(P.cbT||-1e9)<2500)&&CUR.on&&!CUR.touch){const w=ISO.toWorld(CUR.px,CUR.py,TER.heightAt);fx=w.x-P.x;fy=w.y-P.y;P.dir=HERO.dirOf(fx,fy)}}   // el héroe mira al cursor
 const dsU=now<DSH.an?(now-DSH.t0)/Math.max(1,DSH.an-DSH.t0):0;if(dsU>0&&!(cn&&cn.look)){fx=DSH.dx;fy=DSH.dy;P.dir=HERO.dirOf(fx,fy)}   // el dash: el personaje mira hacia donde se lanza
 // ENCARAR AL ENEMIGO en combate (salvo correr con Mayús, esquivar o un golpe en curso): ver combatFoe
 const foe=freeAim()?null:combatFoe(now);let back=0;if(foe&&!(cn&&cn.look)&&dsU<=0&&!(RUN&&P.mvg)&&!(now-SWG.last<650&&!CHG.on)&&!(A&&A.fg)){fx=foe.x-P.x;fy=foe.y-P.y;P.dir=HERO.dirOf(fx,fy);
  if(P.mvg){const mx=P.ldx||0,my=P.ldy||0,fl=Math.hypot(fx,fy)||1,ml=Math.hypot(mx,my)||1;back=(fx*mx+fy*my)/(fl*ml)<-.35?1:0}}
 if(freeAim()&&!(cn&&cn.look)&&dsU<=0&&!(RUN&&P.mvg)&&!(A&&A.fg)&&CUR.on&&!CUR.touch&&(CHG.on||ATKIN.held||now-SWG.last<2500||now-(P.cbT||-1e9)<2500)){const w=ISO.toWorld(CUR.px,CUR.py,TER.heightAt);fx=w.x-P.x;fy=w.y-P.y;P.dir=HERO.dirOf(fx,fy);   // apuntado libre: el cuerpo mira al cursor aunque te muevas (marcha de lado/de espaldas)
  if(P.mvg){const mx=P.ldx||0,my=P.ldy||0,fl=Math.hypot(fx,fy)||1,ml=Math.hypot(mx,my)||1;back=(fx*mx+fy*my)/(fl*ml)<-.35?1:0}}
 const act=P.mvg&&!(aimOn()&&(CHG.on||now<SWG.t0+SWG.ms*.8))?null:actState(now);if(act&&P.mvg&&act.k==='f')act.mv=1;if(act&&P.anm){P.anm=0;P.wt=null}const gear=gearOpts();if(/[?&]capa=1/.test(location.search)&&!gear.cp)gear.cp='#5a2230';
 const rcu=P.rc?Math.max(0,1-(now-P.rc.t)/170):0,rcx=rcu?P.rc.x*3.5*P.rc.k*rcu*rcu:0,rcy=rcu?P.rc.y*3.5*P.rc.k*rcu*rcu:0;   // retroceso VISUAL del héroe al conectar un golpe (la posición lógica no cambia)
 return{recv:cn?cn.recv:0,x:P.x+rcx,y:P.y+rcy,z:TER.standZ(P.x,P.y)+jmpH(jmpU(now)),jmp:jmpU(now),ride:MOUNT.k,gait:MOUNT.g,msp:MOUNT.sp,mv:!!(P.mvg||P.anm),run:!!RUN,w:P.w||0,act,dash:dsU>0&&dsU<1?dsU:0,sleep:(typeof PLAYA!=='undefined'?PLAYA.sl:0),blk:BLK.k,bhit:Math.max(0,1-(now-BLK.hit)/240),hurt:Math.max(0,1-(now-HURT)/320),fx,fy,cb:cbNow||now-(P.cbT||-1e9)<2500||now-HURT<2500||!!foe,back,
  aim:act&&act.k==='fi'&&A&&A.e?{x:(A.fg&&(A.fg.st==='fight'||A.fg.st==='reel'))?A.fg.fx:A.e.x,y:(A.fg&&(A.fg.st==='fight'||A.fg.st==='reel'))?A.fg.fy:A.e.y,ph:act.ph}:null,
  look:{app:S.app,ar:S.eq.a?ARC(S.eq.a):null,helm:S.eq.h?ARC(S.eq.h):null,boot:S.eq.f?ARC(S.eq.f):null,gear,hood:'down',arm:armorInfo()}}}
const bl=document.createElement('canvas');bl.width=W>>2;bl.height=H>>2;const bx=bl.getContext('2d'),gr=document.createElement('canvas');gr.width=gr.height=96;let GP=null,SHK=0,HURT=-1e9;
try{const g=gr.getContext('2d'),im=g.createImageData(96,96);for(let i=0;i<im.data.length;i+=4){const v=Math.random()*255;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255}g.putImageData(im,0,0)}catch(e){}
let PFON=0;
function post(now){const t=now/1000,d=Math.max(0,Math.min(1,(.15-sunS(t))/.55));
 const hu=Math.max(0,1-(now-HURT)/450)*.5,low=P.hp<maxHp()*.3?(.5+.5*Math.sin(t*6))*.3:0,rv=Math.max(hu,low);
 if(rv>.01){const g=ctx.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.85);g.addColorStop(0,'rgba(200,20,20,0)');g.addColorStop(1,'rgba(200,20,20,'+rv+')');ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}}
const clkTxt=()=>{const h=dayP(performance.now()/1000)*24;return String(Math.floor(h)).padStart(2,'0')+':'+String(Math.floor(h%1*60)).padStart(2,'0')};   // hora del juego sin emoji (minimapa Susurro)
const clk=()=>{const t=performance.now()/1000,h=dayP(t)*24,s=sunS(t);return (s>.15?'☀️ ':s>-.1?'🌅 ':'🌙 ')+String(Math.floor(h)).padStart(2,'0')+':'+String(Math.floor(h%1*60)).padStart(2,'0')};

let LFT=0;
const SPR=1.5; // px lógicos por px de sprite cenital antiguo (marcadores provisionales hasta F4/F5)
// Dibuja un sprite cenital antiguo con los pies en la posición isométrica de (x,y); lift = px de sprite hacia arriba
let SIL=0,SPX=0,SPY=0; // SIL: dibujando la silueta del contorno (sin texto ni sombra); SPX/SPY: desplazamiento de spr() hacia el lienzo pequeño
function spr(x,y,lift,fn){const p=ISO.toCanvas(x,y,TER.standZ(x,y)),k=SPR*ISO.scale();ctx.setTransform(k,0,0,k,p.x-SPX-x*k,p.y-SPY-(y+lift)*k);TXS=.5;try{fn()}finally{TXS=1}}
const onScr=(x,y)=>{const p=ISO.toCanvas(x,y,1);return p.x>-140&&p.x<ISO.V.cw+140&&p.y>-200&&p.y<ISO.V.ch+140};
// Calidad (oct 2026): tope de píxeles REALES del lienzo. En pantalla completa la GPU se ahoga si el lienzo es enorme; 'Auto' empieza en Media y baja sola si el juego va lento.
/* FLUIDEZ F11 (26 oct 2026): además del nombre de la GPU, un equipo con ≤ 4 núcleos o ≤ 4 GB declarados arranca en Media (el modo Auto sube solo si va sobrado: F10) */
const LOWDEV=(()=>{try{return (navigator.hardwareConcurrency||8)<=4||(navigator.deviceMemory||8)<=4}catch(e){return false}})();
const QCAPS=[4.5e6,4.5e6,2.4e6,1.6e6,.95e6],QNAM=['Máxima','Alta','Media','Baja','Mínima'];let QA=1,QL=1;   /* R3D-OPT-1: el modo auto ARRANCA en Alta y baja solo (qmon) si no sostiene ~40 fps; Media = 3,2 MP */const MOBQ=!!(window.matchMedia&&matchMedia('(pointer:coarse)').matches);   /* 22 oct 2026 (el dueño: «en móvil va terrible»): táctil arranca en BAJA (sin postproceso/óleo/bloom: la mayor parte del coste) con la resolución recortada ×.55; el modo auto sigue pudiendo bajar a Mínima o subir si se elige a mano */
/* OPT-RENDIMIENTO (22 oct 2026): GPU INTEGRADA (Intel UHD/Iris, Radeon de APU, móviles, software) → el modo auto arranca en MEDIA en vez de Alta. `?gpu=int|dis` fuerza la detección para probar. QCAPS: Media 2,4 MP (1080p entero), Baja 1,6 MP (≈ ×0,88 a 1080p) y Mínima 0,95 MP (≈ ×0,68): antes Media/Baja a 1080p NO bajaban la resolución. */
const IGPU=(()=>{try{const f=(location.search.match(/[?&]gpu=(\w+)/)||[])[1];if(f)return f==='int';const c=document.createElement('canvas').getContext('webgl2')||document.createElement('canvas').getContext('webgl');if(!c)return true;const x=c.getExtension('WEBGL_debug_renderer_info'),n=String(x?c.getParameter(x.UNMASKED_RENDERER_WEBGL):c.getParameter(c.RENDERER));const lc=c.getExtension('WEBGL_lose_context');if(lc)lc.loseContext();window.GPUNAME=n;return /Intel|UHD|Iris|Radeon\(TM\) Graphics|Radeon Graphics|Vega|Mali|Adreno|PowerVR|Apple GPU|SwiftShader|llvmpipe|Basic Render|Microsoft/i.test(n)&&!/RTX|GTX|Arc\(TM\) A|Arc A|RX \d/i.test(n)}catch(e){return false}})();
try{const q=localStorage.getItem('ns_q');if(q!=null&&q!=='a'){QA=0;QL=Math.max(0,Math.min(4,+q||0))}else if(MOBQ)QL=3;else if(IGPU||LOWDEV)QL=2}catch(e){if(MOBQ)QL=3}
/* ══ OPCIONES GRÁFICAS POR ASPECTO (Lote FLUIDEZ, 26 oct 2026; pedido del dueño: «personalizar cada uno de los aspectos») ══
   La «Calidad» (Máxima…Mínima, o Auto) sigue siendo el PRESET. Cada fila de GFX_DEF se puede dejar en «Auto» (= lo que diga la calidad, igual que antes) o fijarla; lo fijado
   se guarda en localStorage `ns_gfx` (ajuste del cliente, no de la partida) y el modo Auto de calidad (qmon) solo baja lo que esté en «Auto».
   r3d.js / hud.js leen `gfx(clave)` CADA fotograma (barato: una búsqueda en un objeto). Para un efecto NUEVO con coste de GPU: añade su fila aquí (auto por QL) y léelo con gfx().
   Fila = [clave, etiqueta, [[valor,texto],…], auto(QL)→valor, ayuda]. `?gfx=reset` borra lo guardado (para probar). */
const GFX_DEF=[
 ['fps','Límite de fps',[[0,'Sin límite'],[120,'120'],[60,'60'],[30,'30']],q=>0,'Limitar los fps da fotogramas más REGULARES (menos tirones percibidos) y menos calor/batería en portátiles. 60 o 30 en gráficas integradas.'],
 ['res','Resolución',[['dyn','Dinámica'],[1,'100 %'],[.85,'85 %'],[.75,'75 %'],[.67,'67 %'],[.5,'50 %']],q=>0,'Resolución del dibujo respecto a la pantalla. Auto = según la calidad. Es lo que más fps da en gráficas integradas.'],
 ['shadow','Sombras',[[2,'Altas'],[1.5,'Medias'],[1,'Bajas'],[0,'No']],q=>q>=3||COARSE_?1:2,'Sombras del sol. Medias = mapa grande redibujado a medio ritmo; Bajas = mapa pequeño a medio ritmo; No = sin sombras (gran ahorro de GPU).'],
 ['shcache','Sombra en caché',[[1,'Sí'],[0,'No']],q=>1,'La sombra de lo que no se mueve (suelo, casas, árboles) se reutiliza y solo se redibuja lo que se mueve: mucho menos trabajo de GPU con el mismo aspecto. «No» = la sombra entera cada fotograma (para comparar).'],
 ['ink','Contornos',[[1,'Sí'],[0,'No']],q=>1,'Contorno oscuro de casas, props y personajes: casi la mitad de las llamadas de dibujo. Sin él, más fps en gráficas débiles (cambia el estilo).'],
 ['post','Óleo (color)',[[1,'Sí'],[0,'No']],q=>q<=2?1:0,'Grado de color «óleo oscuro» a pantalla completa.'],
 ['brush','Pincelada',[[1,'Sí'],[0,'No']],q=>q<=1?1:0,'Filtro de pincel del óleo (Kuwahara): caro a pantalla completa.'],
 ['bloom','Resplandor',[[1,'Sí'],[0,'No']],q=>q<=2?1:0,'Brillo de luces y fuego (bloom).'],
 ['tilt','Desenfoque maqueta',[[1,'Sí'],[0,'No']],q=>q<=1?1:0,'Desenfoque arriba/abajo con el zoom cercano.'],
 ['refl','Reflejos del agua',[[1,'Sí'],[0,'No']],q=>q<=1?1:0,'Redibuja la escena reflejada en el agua: caro.'],
 ['water','Agua animada',[[1,'Sí'],[0,'No']],q=>q<=2?1:0,'Ondas con física y peces en el agua.'],
 ['grass','Pasto',[[1,'Alto'],[.5,'Medio'],[.25,'Bajo'],[0,'No']],q=>GRASS_Q_[q],'Cantidad de matas de pasto (junto con el deslizador de frondosidad).'],
 ['view','Detalle a distancia',[[12,'Lejos'],[9,'Medio'],[6,'Cerca'],[4,'Mínimo']],q=>[12,9,7,5,4][q],'Distancia hasta la que el suelo se dibuja con todo su detalle.'],
 ['parts','Partículas y clima',[[0,'Altas'],[2,'Medias'],[3,'Bajas'],[4,'No']],q=>q,'Luciérnagas, polvo, hojas, nieve, ceniza y lluvia.'],
 ['clouds','Sombras de nubes',[[1,'Sí'],[0,'No']],q=>q<4?1:0,'Sombras de nubes que pasan por el suelo.'],
 ['rays','Rayos de sol',[[1,'Sí'],[0,'No']],q=>q<4?1:0,'Haces de luz en el bosque.'],
 ['lights','Halos de luz',[[1,'Sí'],[0,'No']],q=>q<4?1:0,'Halos y charcos de luz de faroles y hogueras de noche.'],
 ['contact','Sombras de contacto',[[1,'Sí'],[0,'No']],q=>q<4?1:0,'Sombra suave bajo los pies de personajes y objetos.'],
 ['hero','Héroe nítido',[[1,'Sí'],[0,'No']],q=>q<=2?1:0,'Dibuja al héroe a más resolución que el mundo (supermuestreo).'],
 ['prt','Retratos 3D',[[42,'Fluidos'],[83,'Lentos']],q=>q>=3?83:42,'Ritmo de los retratos 3D vivos del HUD (otro contexto WebGL).'],
];
const COARSE_=MOBQ,GRASS_Q_=[1.15,1,.5,.25,0];   // copia de GRASS_Q de r3d.js (Máxima 1,15 solo en Auto: el jugador elige como mucho «Alto» = 1)
let GFXO={};try{if(/[?&]gfx=reset\b/.test(location.search))localStorage.removeItem('ns_gfx');const o=JSON.parse(localStorage.getItem('ns_gfx')||'{}');for(const d of GFX_DEF)if(o[d[0]]!=null&&d[2].some(v=>v[0]===o[d[0]]))GFXO[d[0]]=o[d[0]]}catch(e){}
let DYS=1;   // escala de la resolución dinámica (F12; declarada aquí porque fitCv puede correr antes que dynRes)
const GFXM=Object.fromEntries(GFX_DEF.map(d=>[d[0],d]));
function gfx(k){const v=GFXO[k];return v!=null?v:GFXM[k][3](QL)}
function gfxN(){return Object.keys(GFXO).length}
function gfxSave(){try{localStorage.setItem('ns_gfx',JSON.stringify(GFXO))}catch(e){}}
function gfxTxt(k){const d=GFXM[k],v=GFXO[k],a=v==null;const val=a?d[3](QL):v,o=d[2].find(x=>x[0]===val);return d[1]+': '+(a?'Auto ('+(o?o[1]:(k==='res'?'calidad':String(val)))+')':o[1]+(k==='res'&&v==='dyn'?' ('+Math.round(DYS*100)+' %)':''))}
function gfxTg(k){const d=GFXM[k],L=d[2],v=GFXO[k];if(v==null)GFXO[k]=L[0][0];else{const i=L.findIndex(x=>x[0]===v);if(i<L.length-1)GFXO[k]=L[i+1][0];else delete GFXO[k]}gfxSave();if(k==='res')fitCv();gfxUI()}
function gfxReset(){GFXO={};gfxSave();fitCv();gfxUI()}
/* FLUIDEZ F13/F14: PRESETS con nombre (fijan la Calidad y varias filas a la vez; luego se puede retocar fila a fila). */
const GFX_PRE={equilibrado:['Equilibrado',null,{}],portatil:['Portátil / integrada',2,{fps:60,shadow:1,refl:0,res:'dyn'}],calidad:['Máxima calidad',0,{}],bateria:['Ahorro de batería',4,{fps:30,prt:83,res:.75,parts:4}]};
function gfxPreset(k){const p=GFX_PRE[k];if(!p)return;GFXO=Object.assign({},p[2]);if(p[1]==null){QA=1;QL=IGPU||LOWDEV?2:1}else{QA=0;QL=p[1]}try{localStorage.setItem('ns_q',QA?'a':QL)}catch(e){}gfxSave();DYS=1;fitCv();qBtn()}
function gfxUI(){const box=document.getElementById('gfxadv');if(!box)return;if(!box.dataset.b){box.dataset.b=1;box.innerHTML='<div class="gfxpre">'+Object.entries(GFX_PRE).map(([k,p])=>`<button class="bt" data-gp="${k}" title="Preset: fija la Calidad y varias opciones">${p[0]}</button>`).join('')+'</div>'+GFX_DEF.map(d=>`<button class="bt gfx" data-gk="${d[0]}" title="${d[4]}"></button>`).join('')+'<button class="bt" id="gfxrst" title="Vuelve a dejar todo en «Auto» (lo decide la Calidad)">Restablecer (todo Auto)</button>';box.onclick=e=>{const pb=e.target.closest('[data-gp]');if(pb){gfxPreset(pb.dataset.gp);return}const b=e.target.closest('[data-gk]');if(b)gfxTg(b.dataset.gk);else if(e.target.id==='gfxrst')gfxReset()}}
 box.querySelectorAll('[data-gk]').forEach(b=>{const k=b.dataset.gk;b.textContent=gfxTxt(k);b.classList.toggle('on',GFXO[k]!=null)});const t=document.getElementById('gfxtg');if(t)t.textContent='Ajustes avanzados'+(gfxN()?' ('+gfxN()+' fijados)':'')+(box.hidden?' ▸':' ▾')}
function gfxOpen(){const box=document.getElementById('gfxadv');if(!box)return;box.hidden=!box.hidden;gfxUI()}
setTimeout(gfxUI,0);
let HUDS=1;
function fitCv(){const cw=Math.max(320,innerWidth),ch=Math.max(240,innerHeight);if(window.R3D_ON&&typeof zoom3==='function')ISO.V.zoom=zoom3(ZMI);let dpr=window.devicePixelRatio||1;dpr=GFXO.res==='dyn'?Math.max(.5,Math.min(2,dpr*DYS)):GFXO.res!=null?Math.max(.5,Math.min(2,dpr*GFXO.res)):Math.max(.5,Math.min(dpr,Math.sqrt(QCAPS[QL]*(MOBQ?.55:1)/(cw*ch))));   // FLUIDEZ: «Resolución» fijada por el jugador (× la de la pantalla) manda sobre QCAPS
 ISO.resize(cw,ch,dpr);if(cv.width!==ISO.V.cw||cv.height!==ISO.V.ch){cv.width=ISO.V.cw;cv.height=ISO.V.ch}
 const hs=HUDS=Math.min(1.75,Math.max(1,ch/520)); // escala del HUD dibujado en el lienzo (1 unidad = hs px CSS): crece con la pantalla pero no tanto como la ventana
 W=cw/hs;H=ch/hs;document.documentElement.style.setProperty('--hs',hs.toFixed(3));
 const lw=Math.ceil(W),lh=Math.ceil(H);if(lc.width!==lw||lc.height!==lh){lc.width=lw;lc.height=lh}const bw=Math.max(1,lw>>2),bh=Math.max(1,lh>>2);if(bl.width!==bw||bl.height!==bh){bl.width=bw;bl.height=bh}
 }
// Zoom (oct 2026): pasos fijos (cada paso reconstruye chunks y sprites a esa escala, un tirón puntual). Rueda, +/-, pellizco. Se guarda en ns_zoom.
// R3D (Lote R3D-F2a): el zoom 3D se define por el TAMAÑO DEL HÉROE EN PANTALLA (fracción del alto de la ventana), no por un factor fijo: así se lee igual
// en un portátil que en un monitor grande (como en Diablo/PoE). ZF = fracciones; el héroe mide ≈ 43 px lógicos (1,25 unidades × 34,3).
const HK_DEF=1,HK=(()=>{const m=/[?&]hs=([\d.]+)/.exec(location.search);return m?Math.max(.3,Math.min(1.2,+m[1]||HK_DEF)):HK_DEF})();   // R3D-ESCALA: mismo valor que src/r3d/scale3d.js (héroe y criaturas a HK del tamaño anterior; el zoom lo compensa)
const ZF=[.07,.09,.11,.135,.165,.2].map(v=>v*(/[?&]hero=old/.test(location.search)?1:1.25/HK)),zoom3=i=>Math.max(1,Math.min(8,ZF[i]*Math.max(240,innerHeight)/43));
// 20 oct 2026: zoom inicial 3D = el mínimo (índice 0) salvo que el jugador haya guardado otro (ns_zoom3d3); antes: un paso más lejos (índice 2) y clave nueva para descartar el zoom guardado anterior.
const ZK=window.R3D_ON?'ns_zoom3d3':'ns_zoom',ZMS=window.R3D_ON?ZF:[1,1.25,1.6,2,2.5];let ZMI=window.R3D_ON?0:2,ZMT=0;try{const z=+localStorage.getItem(ZK);if(localStorage.getItem(ZK)!==null&&z>=0&&z<ZMS.length)ZMI=z|0}catch(e){}ISO.V.zoom=window.R3D_ON?zoom3(ZMI):ZMS[ZMI];
function setZoom(i){i=Math.max(0,Math.min(ZMS.length-1,i));if(i===ZMI)return;ZMI=i;ISO.V.zoom=window.R3D_ON?zoom3(i):ZMS[i];try{localStorage.setItem(ZK,i)}catch(e){}fitCv()}
cv.addEventListener('wheel',e=>{e.preventDefault();const n=performance.now();if(n-ZMT<140)return;ZMT=n;setZoom(ZMI+(e.deltaY<0?1:-1))},{passive:false});
let ZMP=0,ZMD=0;cv.addEventListener('touchstart',e=>{if(e.touches.length===2){ZMP=1;ZMD=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);P.mv=null}},{passive:true});
cv.addEventListener('touchmove',e=>{if(e.touches.length===2&&ZMD){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);if(d>ZMD*1.3){setZoom(ZMI+1);ZMD=d}else if(d<ZMD*.77){setZoom(ZMI-1);ZMD=d}e.preventDefault()}},{passive:false});
cv.addEventListener('touchend',e=>{if(e.touches.length<2){ZMD=0;setTimeout(()=>{ZMP=0},250)}},{passive:true});
fitCv();addEventListener('resize',fitCv);if(window.ResizeObserver)new ResizeObserver(fitCv).observe($('#cw'));
// ---- F1-C1 · cursor de tile: rombo suave bajo el puntero (solo ratón). No toca lógica ni colisiones. ----
const CUR={px:0,py:0,on:0,tx:-1,ty:-1};
/* MODO DE CURSOR (21 oct 2026; pedido del dueño, para el combate activo): por defecto el cursor está OCULTO sobre el mundo y mover el ratón solo orienta al personaje (LMB = golpe, derecho = moverse; para
   interactuar con recursos/PNJ/estaciones están la tecla F y ALT). Mantener ALT muestra el cursor y devuelve el comportamiento normal (resaltado, LMB para interactuar). Se muestra solo en interiores, con paneles/ventanas/tablón/cocina abiertos y en táctil. Opciones → «Cursor del mundo» lo desactiva (siempre visible). */
let ALTK=0,CURHIDE=0;try{CURHIDE=localStorage.getItem('ns_curhide2')==='1'?1:0}catch(e){}   // por defecto el cursor es VISIBLE (el modo oculto es opcional)
const curHid=()=>CURHIDE&&!ALTK&&aimOn()&&!CUR.touch&&!inRoom()&&!CK&&!IW&&!QOPEN&&!panelOpen();
const curHideBtn=()=>{const b=$('#chb');if(b)b.textContent='Cursor del mundo: '+(CURHIDE?'oculto (ALT lo muestra)':'visible')},tgCurHide=()=>{CURHIDE=CURHIDE?0:1;try{localStorage.setItem('ns_curhide2',CURHIDE)}catch(e){}curHideBtn()};
let CURON=0;try{CURON=+localStorage.getItem('ns_cursor')||0}catch(e){} // preferencia propia, fuera del guardado (tdo2)
const qBtn=()=>{const b=$('#qb');if(b)b.textContent='Calidad: '+(QA?'Auto ('+QNAM[QL]+')':QNAM[QL]);gfxUI()},tgQ=()=>{if(QA){QA=0;QL=0}else if(QL<4)QL++;else{QA=1;QL=2}try{localStorage.setItem('ns_q',QA?'a':QL)}catch(e){}fitCv();qBtn()};
let QFW=[],QC=0,QUP=0,QDN={};   /* FLUIDEZ F10 (26 oct 2026): el modo Auto también SUBE: 12 ventanas seguidas (≈ 15–20 s) con mediana < 9 ms → un nivel más, nunca por encima de un nivel del que ya bajó por lento en los últimos 3 min (QDN = hora de la bajada) */
function qmon(now,fdt){dynRes(now,fdt);if(!QA||document.hidden)return;if(fdt<250)QFW.push(fdt);if(QFW.length<150)return;const s=QFW.slice().sort((x,y)=>x-y),med=s[75];QFW.length=0;if(now<QC||now<6000)return;
 if(med>25&&QL<4){QDN[QL]=now;QL=Math.min(4,QL+(med>45?2:1));QC=now+10000;QUP=0;fitCv();qBtn();return}
 const capd=gfx('fps')>0;if(!capd&&med<9&&QL>0&&!(QDN[QL-1]&&now-QDN[QL-1]<180000)){if(++QUP>=12){QL--;QUP=0;QC=now+20000;fitCv();qBtn()}}else if(med>=11)QUP=0}
/* FLUIDEZ F12: «Resolución: Dinámica» (opción res = 'dyn'): cada ~2 s mira el percentil 75 del tiempo de fotograma y sube/baja la escala en pasos de 0,1 (entre 0,5 y 1) para sostener el objetivo
   (el límite de fps elegido, o 60). Mínimo 4 s entre cambios: cambiar el tamaño del lienzo rehace los render targets (un tirón pequeño), así que no se hace a cada momento. */
let DYW=[],DYT=0;function dynRes(now,fdt){if(GFXO.res!=='dyn')return;if(fdt<250)DYW.push(fdt);if(DYW.length<120||now<DYT)return;const s=DYW.slice().sort((x,y)=>x-y),p75=s[90];DYW.length=0;const cap=gfx('fps'),tgt=1000/(cap||60);
 let n=DYS;if(p75>tgt*1.12)n=Math.max(.5,DYS-.1);else if(p75<tgt*.72)n=Math.min(1,DYS+.1);n=Math.round(n*10)/10;if(n!==DYS){DYS=n;DYT=now+4000;fitCv();gfxUI()}} // mediana de 150 frames > 25 ms (menos de 40 fps sostenidos): baja un nivel. La mediana ignora los tirones sueltos (esos no se arreglan bajando resolución)
const curBtn=()=>{const b=$('#curb');if(b)b.textContent='▱ Cursor: '+(CURON?'SÍ':'NO')+' (G)'},tgCur=()=>{CURON=CURON?0:1;try{localStorage.setItem('ns_cursor',CURON)}catch(e){}curBtn()};curBtn();qBtn();curHideBtn();
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('pointermove',ev=>{if(ev.pointerType==='touch')return;CUR.touch=false;const r=cvRect();CUR.cx=ev.clientX;CUR.cy=ev.clientY;CUR.px=(ev.clientX-r.left)*cv.width/r.width;CUR.py=(ev.clientY-r.top)*cv.height/r.height;CUR.on=1});
cv.addEventListener('pointerleave',()=>{CUR.on=0;cv.style.cursor=''});
// Forma del rombo del cursor de tile (provisional, opcional). NO es el helper de formas de F2 (que será `facet`, ver AGENTS.md): no lo reutilices para sprites.
function cursorPoly(pts,k){const n=pts.length;ctx.beginPath();for(let i=0;i<n;i++){const a=pts[(i+n-1)%n],b=pts[i],c=pts[(i+1)%n],p1={x:b.x+(a.x-b.x)*k,y:b.y+(a.y-b.y)*k},p2={x:b.x+(c.x-b.x)*k,y:b.y+(c.y-b.y)*k};if(i)ctx.lineTo(p1.x,p1.y);else ctx.moveTo(p1.x,p1.y);ctx.quadraticCurveTo(b.x,b.y,p2.x,p2.y)}ctx.closePath()}
// Entidad bajo el puntero (px reales del canvas). La usan el LMB y el resaltado, así que lo que se ilumina es lo que se clica.
function pickEnt(px,py,now){const sc=ISO.scale(),k=SPR*sc;let b=null,bd=34;const pf=e=>{if(!alive(e,now)||e.deco)return;const q=ISO.toCanvas(e.x,e.y,TER.standZ(e.x,e.y)),d=Math.hypot(px-q.x,py-(q.y-(e.d?Math.max(10,e.d.h*.5):10)*k))/sc-(e.id?18:0);if(d<bd){bd=d;b=e}};
 // E2 (26 oct): `N` llega a 125 000 con K=6; solo se prueban los recursos a ≤ 2600 px del jugador (los lejanos ni tienen malla: streaming por sector) y sin crear un array con todo
 for(let i=0;i<N.length;i++){const e=N[i];if(Math.abs(e.x-P.x)<2600&&Math.abs(e.y-P.y)<2600)pf(e)}ST.forEach(pf);M.forEach(pf);PO.forEach(pf);if(!b)GD.forEach(pf);return b}   /* lote FIXES-29OCT: el botín del suelo tiene la prioridad MÁS BAJA (si hay un enemigo o recurso al alcance del puntero se elige ese): antes un objeto bajo o sobre un enemigo impedía atacarle */
// Contorno de la entidad bajo el puntero (F1-C3): se dibuja la entidad UNA vez en un lienzo pequeño, se tiñe como silueta y se estampa
// desplazada en 8 direcciones (borde oscuro + borde claro) justo antes de su sprite. Solo cuesta algo mientras hay una entidad resaltada.
// Funciona con cualquier sprite (rectángulos, arcos…), también con los definitivos de F3–F5. No usa ctx.filter ni copia el canvas principal.
let HOV=null;
// Tooltip pequeño de recurso (nivel + herramienta recomendada): DOM, sigue al puntero. Rojo = te falta nivel o herramienta.
let RTD=null,RTK='';
function resTip(){const e=HOV;if(!RTD){RTD=document.createElement('div');RTD.className='rtip';document.body.appendChild(RTD)}   // estilo UI «Susurro» (css/hud-susurro.css `.rtip`; 21 oct 2026: antes un recuadro 2D de papel con borde grueso de tinta)
 if(e&&e.dropG&&I[e.it]){const k='d'+e.it,rc=RAR[e.q][1];if(k!==RTK){RTK=k;RTD.innerHTML='<b class="rt-n" style="color:'+rc+'">'+I[e.it][0]+'</b>'+(e.q>=1?'<span class="rt-s" style="color:'+rc+'">'+RAR[e.q][0]+'</span>':'')}
  const r=cvRect();RTD.style.left=Math.round(r.left+CUR.px*r.width/cv.width+16)+'px';RTD.style.top=Math.round(r.top+CUR.py*r.height/cv.height+14)+'px';RTD.style.display='block';return}
 if(!e||!e.t||!ACT[e.t]||!ACT[e.t][e.i]){RTD.style.display='none';return}
 const a=ACT[e.t][e.i],lv=rq(a),tl=TLV(lv),tk=TOOLS[e.t],badL=L(e.t)<lv,badT=tk&&(S.tool[e.t]||0)<tl-1,R='#d86a5a',k=e.t+e.i+'|'+badL+badT+'|'+S.tool[e.t]+'|'+L(e.t);
 if(k!==RTK){RTK=k;RTD.innerHTML='<b class="rt-n">'+a[0]+'</b><span class="rt-s"><i style="'+(badL?'color:'+R:'')+'">Nivel '+lv+'</i>'+(tk?' <u>·</u> <i style="'+(badT?'color:'+R:'')+'">'+tk[0]+' '+tn(e.t,tl)+'</i>':'')+'</span>'}
 const r=cvRect();RTD.style.left=Math.round(r.left+CUR.px*r.width/cv.width+16)+'px';RTD.style.top=Math.round(r.top+CUR.py*r.height/cv.height+14)+'px';RTD.style.display='block'}
const AIMR=(()=>{const e=document.createElement('div');e.id='aimr';e.innerHTML='<i></i>';document.body.appendChild(e);return e})();let aimShow=0,aimEn=0;
// RETÍCULA DE DISTANCIA (arco y hechizo seleccionado, 22 oct 2026): línea desde el héroe hasta donde LLEGA el tiro (alcance máx. 330 px), marca de fin de alcance y la distancia en metros junto a la mira; roja y tenue si el cursor queda fuera de alcance.
let AIML=null,AIME=null,CDRE=null;
function cdrEl(){if(!CDRE){CDRE=document.createElement('div');CDRE.id='cdr';CDRE.innerHTML='<s class="rg"></s><b></b><b></b><b></b>';document.body.appendChild(CDRE)}return CDRE}
function aimRange(w){if(!AIML){AIML=document.createElement('div');AIML.id='aiml';AIME=document.createElement('div');AIME.id='aime';document.body.append(AIML,AIME)}
 const CD=cdrEl();if(!freeAim()||!(nowCombat()||CHG.on||ATKIN.held)){AIML.style.display=AIME.style.display='none';CD.classList.remove('far');CD.removeAttribute('data-d');return}
 const RG=330+(wtype()==='r'?ING.scope().rng:0),dx=w.x-P.x,dy=w.y-P.y,d=Math.hypot(dx,dy),L=Math.min(d,RG),ux=dx/(d||1),uy=dy/(d||1),ex=P.x+ux*L,ey=P.y+uy*L,r=cvRect(),k=r.width/cv.width,
  a=ISO.toCanvas(P.x,P.y,TER.standZ(P.x,P.y)+.5),b=ISO.toCanvas(ex,ey,TER.standZ(ex,ey)),ax=r.left+a.x*k,ay=r.top+a.y*k,bx=r.left+b.x*k,by=r.top+b.y*k,len=Math.hypot(bx-ax,by-ay);
 AIML.style.display='block';AIML.style.width=len+'px';AIML.style.transform='translate('+ax+'px,'+ay+'px) rotate('+Math.atan2(by-ay,bx-ax)+'rad)';
 const far=d>RG;AIME.style.display=far?'block':'none';AIME.style.transform='translate('+bx+'px,'+by+'px)';CD.classList.toggle('far',far);AIML.classList.toggle('far',far);CD.dataset.d=Math.round(d/32*1.75)+' m'}
function aimReticle(on){   // MIRA del modo de cursor oculto (reemplaza al cursor): anillo dorado fino con punto; se pone rojizo sobre un enemigo y se achica al cargar el golpe
 if(on!==aimShow){aimShow=on;AIMR.style.display=on?'block':'none'}if(!on)return;
 const w=ISO.toWorld(CUR.px,CUR.py,TER.heightAt),now=performance.now();let en=0;for(const m of M){if(alive(m,now)&&!sealed(m)&&Math.hypot(m.x-w.x,m.y-w.y)<(m.d.w||16)*.7+10){en=1;break}}
 if(en!==aimEn){aimEn=en;AIMR.classList.toggle('en',!!en)}AIMR.classList.toggle('chg',!!CHG.on);AIMR.style.transform='translate('+CUR.cx+'px,'+CUR.cy+'px)'}
function hovUpdate(){HOV=null;CUR.hov=null;if(curHid()){cv.style.cursor='none';aimReticle(CUR.on?1:0);resTip();return}aimReticle(0);if(!CUR.on||CK){cv.style.cursor='';resTip();return}const nw=performance.now();HOV=pickEnt(CUR.px,CUR.py,nw);CUR.hov=HOV;const atk=aimOn()&&(CHG.on||ATKIN.held||nw-SWG.last<700);   // cursor: espada al pasar sobre un enemigo, espada «en tajo» al atacar, mano sobre lo interactuable
 cv.style.cursor=atk?(UI.cursor('slash')||'crosshair'):HOV?(HOV.d?(UI.cursor('sword')||'crosshair'):(UI.cursor('hand')||'pointer')):'';resTip()}


// ---- Drops en el suelo (13 oct 2026): los objetos que sueltan los enemigos caen al suelo (ya no se pierden con la mochila llena). LMB = ir a recogerlo; también se recogen al pasar por encima (si hay sitio).
// Calidad (rr(id): 0 común … 4 legendario) = color del brillo (RAR) + luz real de noche (DEFS g1..g4 en light.js) + haz de luz desde rara. TTL: 3 min (rara o mejor: 10 min). No se guardan en la partida.
function dropGround(id,x,y,o){if(GD.length>=80)GD.shift();const a=Math.random()*6.283,r=12+Math.random()*18;let tx=x+Math.cos(a)*r,ty=y+Math.sin(a)*r*.7;if(!TER.isLand(TER.heightAt(tx,ty))||PROPS.solid(tx,ty)||TER.cliffNear(tx,ty,6)){tx=x;ty=y}
 const now=performance.now(),q=Math.max(rr(id),o&&o.rare?2:0);GD.push({dropG:1,id:'drop',it:id,x:tx,y:ty,ox:x,oy:y,t0:now,q,ph:Math.random()*6,au:o&&o.au?1:0,exp:now+(q>=2?600000:180000)})}   // o.rare = «drop raro» de criatura (MD[].rare): mínimo Raro (estela de luz + sonido)
function pickG(g,now){const i=GD.indexOf(g);if(i<0)return false;if(!room(g.it)){if(now-(pickG.w||0)>2500){pickG.w=now;toast('🎒 Mochila llena: vende o usa el banco',1800)}return false}
 GD.splice(i,1);add(g.it);GA.push({it:g.it,x:g.x,y:g.y,t0:now,q:g.q,ph:g.ph});P.pk=now;snd(g.q>=2?'rare':'coin');dirty=1;return true}
function dropUpd(now){for(let i=GD.length-1;i>=0;i--)if(now>GD[i].exp)GD.splice(i,1);for(let i=GA.length-1;i>=0;i--)if(now-GA[i].t0>420)GA.splice(i,1);
 // Lote R3D-DROPS-3D: YA NO se recogen solos al pasar por encima: hay que hacer LMB (pickEnt → engage → pickG). Al caer, los raros suenan (poco común: campanilla suave; raro: «rare»; épico+: «epic»).
 for(const g of [...GD])if(g.au&&!inRoom()&&now>=g.t0+180&&Math.hypot(g.x-P.x,g.y-P.y)<130)pickG(g,now);   // botín de la rueda: tras el salto vuela solo a tu mano
 for(const g of GD)if(!g.sd&&now-g.t0>480){g.sd=1;if(g.q>=3)snd('epic');else if(g.q===2)snd('rare');else if(g.q===1)snd('xp')}}
const GIC={},GCL={};




let OCDT=1/60;   // dt del fotograma (lo usa intScene3)

function dCur(t){CUR.tx=CUR.ty=-1;if(!CURON||!CUR.on||CK)return;
 const w=ISO.toWorld(CUR.px,CUR.py,TER.heightAt),q=ISO.tileAt(w.x,w.y);if(q.tx<0||q.ty<0||q.tx>=TER.NX||q.ty>=TER.NY)return;
 CUR.tx=q.tx;CUR.ty=q.ty;const h=TER.tileH(q.tx,q.ty),d=ISO.diamond(q.tx,q.ty,h),no=blk((q.tx+.5)*ISO.TILE,(q.ty+.5)*ISO.TILE),s=ISO.scale(),pul=.5+.5*Math.sin(t*5),cxx=(d[0].x+d[2].x)/2,cyy=(d[0].y+d[2].y)/2,
  sh=d.map(p=>({x:cxx+(p.x-cxx)*.92,y:cyy+(p.y-cyy)*.92})); // un poco más pequeño que el tile
 ctx.setTransform(1,0,0,1,0,0);ctx.save();ctx.lineJoin='round';cursorPoly(sh,.22);
 ctx.fillStyle=no?'rgba(229,83,61,'+(.22+.08*pul)+')':'rgba(255,255,255,'+(.2+.08*pul)+')';ctx.fill();
 ctx.lineWidth=Math.max(1,1.6*s);ctx.strokeStyle=no?'rgba(91,58,41,.85)':'rgba(253,249,227,.95)';ctx.stroke();ctx.restore()}
function draw(now){const t=now/1000;cx=Math.max(0,Math.min(WW-W,P.x-W/2))|0;cy=Math.max(0,Math.min(WH-H,P.y-H/2))|0;
 {const s0=sunS(t),ph0=2*Math.PI*(dayP(t)-.25),d0=Math.max(0,s0);SHD.dx=-Math.cos(ph0)*(8+20*(1-d0));SHD.dy=2+3*(1-d0);SHD.a=Math.max(0,Math.min(.28,(s0+.15)*.5))}
 const dt=LFT?Math.min(.1,(now-LFT)/1000):1/60,sk=now<SHK?(SHK-now)/200*3:0;if(typeof CINE!=="undefined"&&CINE.on)CINE.cam();else{
  // CÁMARA: sigue al héroe y se inclina un poco hacia el enemigo encarado (`foK` suave 0..1, `FO_PULL` 28 % de la distancia, máx. 120 px); en minijuegos además acerca el zoom hacia la estación
  const fe=window.R3D_ON?combatFoe(now):null;foK+=((fe&&!mgKey()?1:0)-foK)*Math.min(1,dt*2.2);if(fe)foE={x:fe.x,y:fe.y};
  let fx=P.x,fy=P.y;{const u=(now-CPUNCH.t)/150;if(u>=0&&u<1){const e2=(1-u)*(1-u)*(u<.15?u/.15:1);fx+=CPUNCH.x*CPUNCH.k*8*e2;fy+=CPUNCH.y*CPUNCH.k*8*e2}}   // «puñetazo» de cámara hacia el golpe
 if(foK>.003&&foE){const dx=foE.x-P.x,dy=foE.y-P.y,l=Math.hypot(dx,dy)||1,k=Math.min(.28,120/l)*foK;fx+=dx*k;fy+=dy*k}
  if(window.R3D_ON&&(mgK>0||mgKey())){const me=mgKey()&&A.e&&!inRoom()?A.e:null;ISO.V.zoom=Math.min(8,zoom3(ZMI)*(1+mgZf*mgK));   // enfoque de minijuego: acerca la cámara y la inclina hacia la estación
   if(me){fx=P.x+(me.x-P.x)*MG_PULL*mgK;fy=P.y+(me.y-P.y)*MG_PULL*mgK}
   // D8: con la hoja de oficio a la derecha, la cámara se desplaza para dejar al héroe centrado en la parte LIBRE de la pantalla (así se ve trabajando en la estación)
   if(mgK>0&&typeof WKUI!=='undefined'&&WKUI.side()&&!INT){const z=TER.standZ(P.x,P.y),c0=ISO.toCanvas(P.x,P.y,z),c1=ISO.toCanvas(P.x+100,P.y,z),c2=ISO.toCanvas(P.x,P.y+100,z),ax=c1.x-c0.x,ay=c1.y-c0.y,bx=c2.x-c0.x,by=c2.y-c0.y,dt2=ax*by-ay*bx;
    if(dt2){const D=WKSIDE*cv.width*mgK;fx+=(by/dt2)*100*D;fy+=(-ay/dt2)*100*D}}}
  ISO.cam.ns=mgK>0&&mgK<1;if(LFT)ISO.follow(fx,fy,TER.standZ(P.x,P.y),dt);else ISO.snap(fx,fy,TER.standZ(P.x,P.y))}LFT=now;OCDT=dt;
 if(typeof FOOT!=='undefined'&&window.R3D&&R3D.gait&&!(typeof CINE!=='undefined'&&CINE.on))FOOT.tick3(R3D.gait,P);   // PASOS por fase del pie (src/footsteps.js): suena en cada apoyo, a cualquier velocidad
 ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='low';if(window.R3D&&(!INT||R3D.intOn))ctx.clearRect(0,0,cv.width,cv.height);else{ctx.fillStyle=TER.PAPER;ctx.fillRect(0,0,cv.width,cv.height)}
 if(INT&&!INT.cave){R3D.show(1);intScene3(now,t);ctx.setTransform(cv.width/W,0,0,cv.height/H,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'}else{
 if(sk)ISO.cam.x+=(Math.random()-.5)*2*sk,ISO.cam.y+=(Math.random()-.5)*2*sk;
 if(!INT)TER.env(P.x,P.y,t,sunS(t));R3D.show(1);R3D.frame(now);dCur(t);hovUpdate();
 const cin=(typeof CINE!=="undefined"&&CINE.on);const ents=[...(cin?[]:ST).filter(e=>onScr(e.x,e.y)).map(e=>[ISO.depth(e.x,e.y),()=>spr(e.x,e.y,0,()=>dS(e,t))]),   // Fase 18: el 2D del mundo se retiro; aqui solo quedan las ETIQUETAS (estaciones y criaturas) y el heroe 3D en su hueco de profundidad
  ...(cin?[]:M).filter(e=>onScr(e.x,e.y)&&R3D.actors.has(e)).map(e=>[ISO.depth(e.x,e.y),()=>spr(e.x,e.y,0,()=>dMo(e,t,now))]),[ISO.depth(P.x,P.y),()=>R3D.drawHero(ctx)]];
 if(!INT)AMBI.draw(ctx,'ground');
 ents.sort((a,b)=>a[0]-b[0]).forEach(o=>o[1]());
 PJ.forEach(p=>{if(now>=p.t0)drawPJ(p,now)});npSweep();bbTick(now);whDraw(now);fishDraw(now,OCDT);mgUi(now);qmUi(now);castDraw(now);ctxTick(now);drawTel(now);drawWind(now);drawKnives(now);ING.draw(now);TAME.draw(performance.now());drawHFX(now);drawAim(now);swingHud(now);
 parts.forEach(p=>p.hs?hsDraw(p):spr(p.x,p.y,12,()=>{ctx.globalAlpha=Math.min(1,p.l);if(p.sp){ctx.beginPath();ctx.arc(p.x,p.y,7,0,7);ctx.fillStyle=p.sp;ctx.fill();T(p.tx,p.x,p.y+4,'#fff')}else if(p.tx)T(p.tx,p.x,p.y,p.c);else Rc(p.c,p.x,p.y,2,2);ctx.globalAlpha=1}));
 if(!INT)AMBI.draw(ctx,'over');
 if(!window.R3D)PAINT.grain(ctx,cv.width,cv.height,ISO.V.dpr,.55); // grano de papel: con WGL lo pone un div con multiply (sin coste por frame); este es el plan B
 ctx.setTransform(cv.width/W,0,0,cv.height/H,0,0);ctx.globalAlpha=1;if(!INT)AMBI.draw(ctx,'late');ctx.setTransform(cv.width/W,0,0,cv.height/H,0,0);post(now);}
 if(CK){const a=ACT.co[CK.i],bx=W/2-150,by=H/2-40;Rc('#000000bb',bx-14,by-34,328,110);Rc('#000',bx-2,by-2,304,24);Rc('#3a3226',bx,by,300,20);Rc('#2a7a2a',bx+300*(CK.c-CK.hw),by,300*CK.hw*2,20);Rc('#e8cf94',bx+300*(CK.c-CK.hw*.35),by,300*CK.hw*.7,20);Rc('#fff',bx+300*CK.pos-2,by-4,4,28);
 T((CK.bonus?'🎲 ¡Bonus de cocina! ':'')+a[0],W/2,by-12,'#ff981f');T(CK.res===null?'Espacio / LMB: detén la barra en la zona verde':(CK.bonus?['Sin bonus esta vez','¡Plato extra!','¡PERFECTO! XP doble + plato extra']:['¡Quemado!','¡Bien!','¡PERFECTO!'])[CK.res],W/2,by+44,CK.res===2?'#e8cf94':CK.res===0?'#e5533d':'#fff');T(CK.bonus?'Acierta: más XP y un plato extra (Esc: saltar)':'Racha: '+CK.streak+' · Esc para salir',W/2,by+62,'#aaa')}
if(!(typeof CINE!=="undefined"&&CINE.on)){const g=GOALS[S.goal],tg=qTrackInfo()||(typeof ISLA!=='undefined'&&ISLA.on()?ISLA.target():(typeof PLAYA!=='undefined'&&PLAYA.on()?PLAYA.target():goalTgt(g)));if(tg){const dx=tg.x-P.x,dy=tg.y-P.y,d=Math.hypot(dx,dy);if(d>70){const ta=ISO.toCanvas(tg.x,tg.y,TER.standZ(tg.x,tg.y)),pa=ISO.toCanvas(P.x,P.y,TER.standZ(P.x,P.y)),an=Math.atan2(ta.y-pa.y,ta.x-pa.x),px=W/2+Math.cos(an)*42,py=H/2-12+Math.sin(an)*42+Math.sin(performance.now()/200)*2;ctx.fillStyle='#e8cf94';ctx.beginPath();ctx.moveTo(px+Math.cos(an)*8,py+Math.sin(an)*8);ctx.lineTo(px+Math.cos(an+2.4)*7,py+Math.sin(an+2.4)*7);ctx.lineTo(px+Math.cos(an-2.4)*7,py+Math.sin(an-2.4)*7);ctx.fill();T(Math.round(d/10)+' m',px,py-12,'#e8cf94')}}}
if(!(typeof CINE!=="undefined"&&CINE.on)){hudFx(now);if(MM&&!INT)drawMap(now);
if(hsOn())HUDSU.frame(now);;hudPlate(now)}if(!(typeof CINE!=="undefined"&&CINE.on)&&ZB){const el=now-ZB.t0;if(el>3600)ZB=null;else{ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,(3600-el)/1400));ctx.font='16px VT323, monospace';const tw=ctx.measureText(ZB.t).width+28;UI.plate(ctx,W/2-tw/2,8,tw,24);ctx.fillStyle=UI.TXT;ctx.textAlign='center';ctx.fillText(ZB.t,W/2,25);ctx.restore()}}if(!hsOn()){let by=H-118;const chip=(tx)=>{ctx.save();ctx.font='600 11px '+UI.FONT;const tw=ctx.measureText(tx).width+14,bx=W/2-tw/2;UI.plate(ctx,bx,by,tw,17,{r:8});ctx.fillStyle=UI.TXT;ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(tx,bx+7,by+9.5);ctx.restore();by-=21};[['xp','Sabiduría'],['dmg','Fuerza'],['spd','Rapidez'],['def','Piel de piedra']].forEach(([k,n])=>{const r=S.buf[k]-Date.now();if(r>0)chip(n+' '+Math.ceil(r/1000)+'s')});}
}
let RPEND=null;   // RMB: «ir a» se decide al SOLTAR (si arrastraste, era un giro de cámara); la rueda solo gira la cámara y no mueve al personaje
cv.addEventListener('pointerup',ev=>{if(ev.button===2){blockEnd();return}if(ev.button!==2||!RPEND)return;const q=RPEND;RPEND=null;if(Math.abs(ev.clientX-q.cx)>6)return;/* arrastraste con el RMB: fue un giro de cámara (r3d.js) */if(CK||ZMP)return;const now=performance.now(),b=curHid()?null:pickEnt(q.px,q.py,now);if(A)stopA();if(b){P.g={e:b};P.mv=null}else{const w=ISO.toWorld(q.px,q.py,TER.heightAt);P.mv={x:w.x,y:w.y};P.g=null}});
cv.addEventListener('pointerdown',ev=>{if(ev.button===1)return;if(ev.button===0&&TAME.on){TAME.press(performance.now());return}if(ev.button===2){MSB.r=1;if(!CK&&!ZMP&&!(MSB.l&&MSB.atk&&aimOn()))blockStart();return}   /* 22 oct 2026: RMB mantenido = BLOQUEAR (ya no «ir a ese punto»); la cámara gira SOLO con el botón del medio (r3d.js); el medio no mueve al personaje */
 if(ev.button===2&&!CK&&!ZMP){const r=cvRect();RPEND={px:(ev.clientX-r.left)*cv.width/r.width,py:(ev.clientY-r.top)*cv.height/r.height,cx:ev.clientX};return}if(CK){cookHit();return}if(ZMP)return;const r=cvRect(),px=(ev.clientX-r.left)*cv.width/r.width,py=(ev.clientY-r.top)*cv.height/r.height,now=performance.now(),sc=ISO.scale(),k=SPR*sc;
 if(MM===2&&MAPPJ&&ev.button===0){const lx=px*W/cv.width,ly=py*H/cv.height,wx=(lx-MAPPJ.ox)/MAPPJ.s,wy=(ly-MAPPJ.oy)/MAPPJ.s;if(lx>=MAPPJ.ox&&ly>=MAPPJ.oy&&lx<=MAPPJ.ox+MAPPJ.w&&ly<=MAPPJ.oy+MAPPJ.h){if(S.wp&&Math.hypot(S.wp.x-wx,S.wp.y-wy)<60/MAPPJ.s*.5)delete S.wp;else S.wp={x:Math.round(wx),y:Math.round(wy)};snd&&snd('click');return}}   // E4: LMB sobre el mapa grande = marcador de destino (otro LMB cerca lo quita)
 const b=curHid()?null:pickEnt(px,py,now);if(b&&b.d&&b.d.tm&&ev.button===0&&TAME.start(b))return;   /* DOMAR-D2: LMB sobre un animal domable abre el lazo (si no se puede, sigue el comportamiento normal) */   // cursor oculto: el LMB nunca elige entidades (golpe / moverse)
 if(A&&A.wh&&ev.button!==2&&(!b||b===A.e)){whPress(now);return}   // rueda de recolección: el LMB es el golpe
 if(A&&A.fg&&ev.button!==2&&(!b||b===A.e)){fishPress(now);return}   // pesca: el LMB clava el anzuelo / recoge
 if(aimOn()&&ev.button!==2){CUR.touch=ev.pointerType==='touch';if(CUR.touch){if(b&&b.d){chargeStart(now);return}}else if(b&&b.d||!b){MSB.l=1;MSB.atk=1;MSB.t0=now;ATKIN.held=1;if(MSB.r)blockEnd();return}}   // combate dirigido: LMB = swing hacia el cursor; RMB / táctil sobre el suelo = moverse
 if(!aimOn()&&b&&b.d&&manual()){ATKIN.t=now;ATKIN.held=1;if(A&&A.ty==='f'&&A.e===b)return}   // combate activo: el LMB es el golpe (mantener = seguidos); sobre el mismo objetivo no reinicia el combate
 if(A)stopA();if(b){P.g={e:b};P.mv=null}else{const w=ISO.toWorld(px,py,TER.heightAt);P.mv={x:w.x,y:w.y};P.g=null}});
const KM={ArrowLeft:'l',a:'l',ArrowRight:'r',d:'r',ArrowUp:'u',w:'u',ArrowDown:'d',s:'d'};
addEventListener('keydown',e=>{if(e.key==='Alt'){ALTK=1;e.preventDefault()}const k=KM[e.key]||KM[String(e.key).toLowerCase()];   // con Mayús pulsada (correr) las letras llegan en MAYÚSCULA: sin normalizar, W/A/S/D dejaban de dirigir al correr
 if(k){K[k]=1;e.preventDefault()}if(e.key==='Shift'&&!e.repeat&&!RUN){if(S.exh)log('Estás agotado: recupera el aliento para volver a correr.');else{RUN=1;SHRUN=1;S.hintR=1;if(typeof rhHide==='function')rhHide();runBtn()}}   // MAYÚS = CORRER (mantener); R quedó LIBRE (21 oct 2026)
if(e.key==='1'&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/INPUT|TEXTAREA|SELECT/.test((e.target||{}).tagName||''))selSkill(0);if((e.key==='q'||e.key==='Q')&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/INPUT|TEXTAREA|SELECT/.test((e.target||{}).tagName||''))blockStart();if(e.key==='Tab'&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/INPUT|TEXTAREA|SELECT/.test((e.target||{}).tagName||'')&&!INT&&!CK){e.preventDefault();lockCycle()}if((e.key==='h'||e.key==='H')&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/INPUT|TEXTAREA|SELECT/.test((e.target||{}).tagName||''))MOUNT.toggle();if((e.key==='v'||e.key==='V')&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/INPUT|TEXTAREA|SELECT/.test((e.target||{}).tagName||''))jump();if((e.key==='t'||e.key==='T')&&!/INPUT|TEXTAREA/.test((e.target||{}).tagName||''))arTog();if(e.key==='m'||e.key==='M')MM=(MM+1)%3;if(e.key==='g'||e.key==='G')tgCur();if(e.key==='F4'){perfTog();e.preventDefault()}if((e.key==='+'||e.key==='=')&&!/INPUT|TEXTAREA/.test((e.target||{}).tagName||''))setZoom(ZMI+1);if((e.key==='-'||e.key==='_')&&!/INPUT|TEXTAREA/.test((e.target||{}).tagName||''))setZoom(ZMI-1);if((e.key==='e'||e.key==='E')&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/INPUT|TEXTAREA|SELECT/.test((e.target||{}).tagName||'')&&!CK&&!INT)atkKey(true);if((e.key===' '||e.key==='Enter')&&CK){cookHit();e.preventDefault()}else if(e.key===' '&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/INPUT|TEXTAREA|SELECT|BUTTON/.test((e.target||{}).tagName||'')){if(dash())e.preventDefault()}if((e.key==='f'||e.key==='F')&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/INPUT|TEXTAREA/.test((e.target||{}).tagName||'')&&!CK){useNear();e.preventDefault()}if(e.key==='Escape'){if(QOPEN)qCloseBoard();else if(CK)CK=null;else if(IW)closeIW();else if(panelOpen()){setPanel(false,1);document.querySelectorAll('#tabs button').forEach(b=>b.classList.remove('on'))}}if(!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/INPUT|TEXTAREA/.test((e.target||{}).tagName||'')){const TK={i:'inv',p:'ch',k:'sk',q:'qm',l:'q',c:'col',z:'mg',o:'pr'}[(e.key||'').toLowerCase()];if(TK&&!CK)tabClick(TK);if(e.key==='v'||e.key==='V')specTog()}});addEventListener('blur',()=>blockEnd());addEventListener('keyup',e=>{if(e.key==='q'||e.key==='Q')blockEnd();if(e.key==='Alt'){ALTK=0;e.preventDefault()}const k=KM[e.key]||KM[String(e.key).toLowerCase()];if(k)K[k]=0;if(e.key==='e'||e.key==='E')atkKey(false);if(e.key==='Shift'&&SHRUN){SHRUN=0;RUN=0;runBtn()}});addEventListener('blur',()=>{ALTK=0;if(SHRUN){SHRUN=0;RUN=0;runBtn()}K.l=K.r=K.u=K.d=0;ATKIN.held=0;MSB.l=MSB.r=MSB.atk=0});
/* 26 oct 2026 · ARREGLO LMB+RMB (bug del dueño: «no funciona mantener LMB + RMB para el ataque fuerte»): con Pointer Events, pulsar o soltar un SEGUNDO botón mientras otro sigue
   pulsado NO lanza pointerdown/pointerup sino un pointermove con otros `buttons` («botones en acorde»), así que MSB.r/MSB.l nunca cambiaban y la carga no empezaba ni se lanzaba.
   btnChord compara `buttons` con el valor anterior y aplica las mismas reglas: RMB con LMB de ataque ya pulsado = CARGA (swingTick la arranca), LMB con RMB (bloqueando) = deja de
   bloquear y CARGA, soltar uno de los dos = lanza la carga. Solo ratón (táctil sin cambios). */
let PBT=0;function btnChord(ev){if(ev.pointerType&&ev.pointerType!=='mouse')return;const b=ev.buttons|0,ch=b^PBT;PBT=b;if(!ch)return;const l=b&1?1:0,r=b&2?1:0;
 if((ch&2)&&r&&!MSB.r&&MSB.l){MSB.r=1;{const n=performance.now();if(MSB.atk&&n-(MSB.t0||0)<250){SWG.cd=Math.min(SWG.cd,n);ATKT=Math.min(ATKT,n)}}   /* LMB→RMB casi a la vez (< 250 ms): el golpe ligero que acaba de salir no retrasa la carga */
  if(!(MSB.atk&&aimOn())&&!CK&&!ZMP)blockStart()}
 if((ch&1)&&l&&!MSB.l&&MSB.r&&aimOn()&&!CK&&!ZMP){MSB.l=1;MSB.atk=1;ATKIN.held=1;blockEnd()}
 if(b&&((!l&&MSB.l)||(!r&&MSB.r))){MSB.l=l;MSB.r=r;if(!l)MSB.atk=0;if(aimOn())chargeEnd();ATKIN.held=MSB.atk}}
addEventListener('pointermove',btnChord,true);addEventListener('pointerdown',btnChord,true);addEventListener('pointerup',btnChord,true);
addEventListener('pointerdown',()=>pd=1);addEventListener('pointerup',ev=>{MSB.l=ev.buttons&1;MSB.r=ev.buttons&2?1:0;if(!MSB.l)MSB.atk=0;if(aimOn())chargeEnd();ATKIN.held=MSB.atk;setTimeout(()=>pd=0,60)});
/* progreso offline retirado (21 oct 2026): al volver a la pestaña no se simulan acciones */

// ---------- paneles ----------
const PDS={xp:'+50% de XP durante 3 min.',dmg:'Fuerza +3 (más 10% de tu nivel) durante 3 min.',spd:'+35% de velocidad durante 3 min.'};
function desc(id){const d=I[id],o=[(rr(id)?'<b style="color:'+RAR[rr(id)][1]+'">'+d[0]+'</b>':d[0])+' · vale '+money(d[2])],ing=[];if(QITEM.has(id))o.push('<span style="color:#e8cf94">Objeto de misión · no se puede tirar ni vender</span>');
 {const ed=ENCH.desc(id);if(ed)o.push(ed)}{const ig=ING.desc(id);if(ig)o.push(ig)}{const mdd=MOUNT.desc(id);if(mdd)o.push(mdd)}if(id.includes('~')&&!id.includes('@')&&!(TOOLT[id]&&TOOLT[id].pa))o.push('<span style="color:'+RAR[rr(id)][1]+'">'+RAR[rr(id)][0]+'</span> · fabricado: mejores estadísticas base, sin habilidades especiales');{const ac=armCls(id);if(ac)o.push('🧥 Armadura de '+ACLS[ac].toLowerCase()+': resiste '+SNAME[ac]+', débil a '+SNAME[AWEAK[ac]])}if(LOOT[id]){const it=LOOT[id],TX={def:'Defensa',str:'Fuerza',acc:'Precisión',mana:'Maná',mreg:'Regen. de maná',hp:'Vitalidad'};o.push('<span style="color:'+RAR[it.r][1]+'">'+RAR[it.r][0]+'</span> · '+LS[it.s][0]+'');for(const k in it.st)o.push('+'+it.st[k]+' '+TX[k]);(it.pa||[]).forEach(p=>o.push('<span style="color:#e8cf94">'+PS[p.id].d(p.v)+'</span>'))}
 if(typeof OFGEAR!=='undefined'&&OFGEAR.is(id))o.push(OFGEAR.desc(id));
 if(TOOLT[id]){const T=TOOLT[id];o.push('Herramienta de '+({wc:'tala',mi:'minería',fi:'pesca',he:'herbolaria'})[T.k]+' · tier '+T.t+(T.bq?' (+'+Math.round(T.bq*100)+'% hacia el siguiente tier, nunca lo supera)':'')+'');(T.pa||[]).forEach(p=>o.push('<span style="color:#e8cf94">'+PS[p.id].d(p.v)+'</span>'))}
 if(/^rv_/.test(id))o.push('Runa reutilizable: te teletransporta a la plaza de ese bioma. Enfriamiento de 45 s y no se puede usar en combate.');
 if(SCI[id]!==undefined)o.push('Pergamino de un solo uso: lanza '+SPL[SCI[id]].n+' sin gastar maná ni runas. Requiere Magia nv. '+SPL[SCI[id]].lv+'.');
 if(MANAP[id])o.push('Poción: restaura '+MANAP[id]+' de maná.');if(d[4])o.push('Restaura '+d[4]+' de maná y acelera su regeneración 90 s.');
 if(d[3])o.push('Comida: cura '+d[3]+' PV.');
 {const q=wReq(id);if(q)o.push('<span style="color:'+(L(q.sk)>=q.lv?'#9ad08a':'#ff7a6a')+'">Requiere '+SK[q.sk][0]+' '+q.lv+'</span>')}
 if(SW[id])o.push('Arma cuerpo a cuerpo · precisión +'+fs(SW[id])+' · fuerza +'+fs(SB[id]||0)+' · '+swingSecOf(id).toFixed(1)+' s por ataque.');
 if(BOW[id])o.push('Arma a distancia · precisión +'+fs(BOW[id])+' · fuerza +'+fs(SB[id]||0)+' · '+swingSecOf(id).toFixed(1)+' s por ataque. A dos manos: sin escudo.');if(STF[id])o.push('Arma mágica a dos manos (sin escudo): +'+STF[id]+' de daño a hechizos, +'+STF[id]*2+' de maná máximo · lanza solo tu mejor hechizo cada '+((WSP[id]||5)*.6).toFixed(1)+' s (gasta maná y runas).');if(AR[id])o.push('Armadura: +'+AR[id]+' de defensa.');if(SHL[id])o.push('Escudo: +'+SHL[id]+' de defensa.');if(LGL[id])o.push('Pantalones: +'+LGL[id]+' de defensa.');if(GLL[id])o.push('Guantes: +'+GLL[id]+' de defensa.');{const cs=CST[String(id).split('~')[0]];if(cs)o.push((QVS[id]?'Carcaj: ':'Bonus de clase: ')+Object.keys(cs).map(k=>'+'+cs[k]+' '+({acc:'Precisión',mana:'Maná',mreg:'Regen. de maná',str:'Fuerza'}[k]||k)).join(' · ')+(QVS[id]?'.':''))}if(AMS[id]!==undefined)o.push((AMK[id]==='fl'?'Munición de arco':'Munición de ballesta')+': +'+AMS[id]+' de fuerza por disparo. Gasta 1 por disparo normal; equípala en la ranura de munición (apila de '+AMN+'). Sin munición disparas '+(AMK[id]==='fl'?'flechas':'virotes')+' estándar, sin bonus.');
 if(POT[id])o.push(PDS[POT[id]]);if(id==='quemado')o.push('Inservible. Véndelo.');
 for(const sk in ACT)ACT[sk].forEach(a=>{if(a.length===5&&a[1]===id)o.push('Se obtiene con '+SK[sk][0]+' (nv. '+a[2]+')');if(a.length===6){if(a[2]===id)o.push('Se fabrica: '+(OUTN[id]?OUTN[id]+'× ':'')+a[0]+' ('+SK[sk][0]+' nv. '+a[3]+(GATE[id]?' · '+SK[GATE[id][0]][0]+' nv. '+GATE[id][1]:'')+')');if(a[1][id])ing.push(a[0])}});
 if(ing.length)o.push('Sirve para: '+ing.slice(0,3).join(', ')+(ing.length>3?'…':''));
 for(const k in RARE)if(RARE[k][0]===id)o.push('Drop raro de '+SK[k][0]+' (1/'+RARE[k][1]+')');
 for(const m in MD){if(MD[m].dr.some(x=>x[0]===id))o.push('Lo suelta: '+MD[m].n);if(MD[m].rare&&MD[m].rare[0]===id)o.push('Drop raro de: '+MD[m].n)}
 return o.join('\n')}
const tip=document.createElement('div');tip.id='tip';document.body.appendChild(tip);
document.addEventListener('mouseover',e=>{const t=e.target.closest&&e.target.closest('[data-i],[data-x]');if(!t){tip.style.display='none';return}tip.innerHTML=t.dataset.x||desc(t.dataset.i);tip.style.display='block'});
document.addEventListener('mousemove',e=>{if(tip.style.display==='block'){tip.style.left=Math.max(4,Math.min(innerWidth-300,e.clientX+14))+'px';tip.style.top=Math.min(innerHeight-120,e.clientY+14)+'px'}});
const near=e=>e&&!e.deco&&Math.hypot(P.x-e.x,P.y-e.y)<80;
const sideEl=()=>$('#side'),panelOpen=()=>!sideEl().classList.contains('closed'),setPanel=(o,keep)=>{sideEl().classList.toggle('closed',!o);if(!o){const b=document.getElementById('bw');if(b)b.hidden=true}else if(typeof TB!=='undefined'&&TB==='ch')setTimeout(()=>{try{bwSync()}catch(e){}},0);if(keep)try{localStorage.setItem('ns_pn',o?1:0)}catch(e){}};
// ---- Instalaciones: cada una abre SU ventana anclada en el mundo (tecla F, o un toque en el aviso). Reutiliza el HTML de panelHTML() ('bank' | 'shop' | 'st'). ----
let IW=null;
const IWI={establo:['bench','Establo','#c8a070'],isla_caja:['bench','Buscar','#e8cf94'],playa_cofre:['bench','Abrir','#e8cf94'],door:['door','Entrar','#d9a35a'],exit:['door','Salir','#d9a35a'],bank:['bank','Abrir','#e8b84a'],shop:['shop','Comerciar','#e58aa8'],market:['bank','Mercado','#d9a35a'],fire:['fire','Cocinar','#ff9a3a'],cocina:['fire','Cocinar','#e5784a'],furnace:['furnace','Fundir','#e5784a'],anvil:['anvil','Forjar','#8f9aa6'],armero:['armero','Armar','#aab4c0'],curtidor:['curtidor','Curtir','#a8743c'],cantero:['bench','Esculpir','#c8c0b0'],joyero:['anvil','Engastar','#e8cf94'],ingeniero:['bench','Ensamblar','#e8cf94'],alambique:['bench','Destilar','#9ad07a'],bench:['bench','Fabricar','#bd7a45'],altar:['altar','Encantar','#b07aff'],shrine:['door','Rezar','#f1d27a'],ru:['shop','Hablar','#e8c48a'],guardia:['shop','Hablar','#d8b050'],herrera:['shop','Hablar','#c8704a'],anciano:['shop','Hablar','#9cc4ff']};   // Fase 6: verbos de los PNJ (el aviso «F · Hablar»; el resto de PNJ nuevos usa «Usar» hasta tener fila)
const iwTab=e=>e.id==='bank'?'bank':e.id==='shop'?'shop':'st',iwInfo=e=>IWI[e.id]||(e.npc?['shop','Hablar',e.col||'#e8c48a']:['bench','Usar','#9b6a3f']);
// Filtro de la ventana (oct 2026): buscador + «Puedo» (solo lo que se puede hacer ahora). La lista crece con el nivel, así que el filtro vive FUERA de #swb (no pierde el foco al repintar).
let IWQ='',IWC=1;try{IWC=localStorage.getItem('ns_iwc')==='0'?0:1}catch(e){}
const nrm=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''),
 iwFilt=()=>{const f=$('#swf');if(!IW){f.innerHTML='';return}f.innerHTML='<input id="swq" type="search" placeholder="Buscar…" autocomplete="off" value="'+IWQ.replace(/"/g,'')+'">'+(IW.tab==='st'?'<button class="bt'+(IWC?' on':'')+'" id="swc" title="Mostrar solo lo que puedes hacer ahora">Puedo</button>':'');const q=$('#swq');q.oninput=()=>{IWQ=nrm(q.value.trim());dirty=1;panel()};q.onkeydown=ev=>{ev.stopPropagation();if(ev.key==='Escape'){q.blur();closeIW()}};const c=$('#swc');if(c)c.onclick=()=>{IWC=IWC?0:1;try{localStorage.setItem('ns_iwc',IWC)}catch(e){}c.classList.toggle('on',!!IWC);panel()}};
function openIW(e){if(!e)return;if(e.id==='altar'){try{ENCH.rebuild()}catch(x){console.warn('[ENCH]',x)}}if(e.id==='alambique'){closeIW();ALQ.open(e);return}if(e.id==='cocina'&&!COC.skipOnce()){closeIW();COC.open(e);return}if(e.id==='establo'){closeIW();STAB.open(e);return}if(e.id==='door'){enterRoom(e);return}if(e.id==='exit'){leaveRoom();return}if(e.id==='shop'){closeIW();TRADE.open('ru',e);return}if(e.id==='market'){closeIW();TRADE.openMkt(e);return}if(e.id==='ru'){closeIW();talk();return}if(e.npc){closeIW();npcTalk(e);return}if(e.id==='board'){closeIW();qOpenBoard();return}if(e.id==='shrine'){closeIW();prAltar();return}const m=iwInfo(e),w=$('#sw');IW={e,tab:iwTab(e)};IWQ='';IWSEL=null;IWCAT='';IWLK=0;iwFilt();if(IW.tab==='st')S.stn=e;w.hidden=false;w.dataset.k=e.id;w.style.setProperty('--acc',m[2]);$('#swi').style.backgroundImage='url('+UI.icon(m[0])+')';$('#swt').textContent=e.n;panel();iwFrame();if(IW.tab==='bank'&&!(TB==='inv'&&panelOpen()))tab('inv')}
function closeIW(){IW=null;iwFilt();$('#sw').hidden=true}
const boxNear=()=>PO.find(p=>(p.pk==='cajaIsla'||p.pk==='cofreNaufrago')&&p.n==='cofre'&&near(p));
function useNear(){if(TAME.on)return;if(IW){closeIW();return}{let bm=null,bd=300;M.forEach(m=>{if(m.d&&m.d.tm&&alive(m,performance.now())&&!m.gone){const d=Math.hypot(m.x-P.x,m.y-P.y);if(d<bd){bd=d;bm=m}}});if(bm&&!boxNear()){let st=null,sd=1e9;ST.forEach(s=>{const d=Math.hypot(P.x-s.x,P.y-s.y);if(near(s)&&d<sd){sd=d;st=s}});if(!st&&TAME.start(bm))return}}{const sm=skinNear();if(sm&&skinStart(sm))return}let b=null,bd=1e9;ST.forEach(s=>{const d=Math.hypot(P.x-s.x,P.y-s.y);if(near(s)&&d<bd){bd=d;b=s}});if(b)return openIW(b);const bx=boxNear();if(bx)openPO(bx,performance.now())}
const stPos=e=>{const q=ISO.toCanvas(e.x,e.y,TER.standZ(e.x,e.y)),k=innerWidth/cv.width;return{x:q.x*k,y:q.y*k,h:(e.lh||60)*ISO.scale()*k}};
const COARSE=window.matchMedia&&matchMedia('(pointer:coarse)').matches;
function iwFrame(){const fp=$('#fp'),sw=$('#sw');
 if(IW&&Math.hypot(P.x-IW.e.x,P.y-IW.e.y)>110)closeIW();
 let e=null;if(!IW&&!CK){let bd=1e9;ST.forEach(s=>{const d=Math.hypot(P.x-s.x,P.y-s.y);if(near(s)&&d<bd){bd=d;e=s}});if(!e&&!CAST)e=boxNear()||null}
 if(e){const q=stPos(e),m=iwInfo(e);if(fp.dataset.id!==e.id){fp.dataset.id=e.id;fp.innerHTML=(COARSE?'<i class="tap"></i>':'<kbd>F</kbd>')+'<span>'+m[1]+'</span>';fp.style.setProperty('--acc',m[2])}
  fp.hidden=false;fp.style.left=Math.round(Math.max(60,Math.min(innerWidth-60,q.x)))+'px';fp.style.top=Math.round(Math.max(44,q.y-q.h-30))+'px'}else{fp.hidden=true;fp.dataset.id=''}
 sw.style.visibility=CK?'hidden':'';if(IW){const q=stPos(IW.e),w=sw.offsetWidth,vw=innerWidth,vh=innerHeight,bot=vh-(84*HUDS)-8,sa=q.y-q.h-34-8,sb=bot-(q.y+16),below=sa<Math.min(300,sb)&&sb>sa; // bot: deja libres los vitales de abajo
  const mh=Math.max(180,Math.min(vh*.72,below?sb:sa));sw.style.maxHeight=Math.round(mh)+'px';const h=sw.offsetHeight;let left=Math.max(8,Math.min(vw-w-8,q.x-w/2)),top=below?q.y+16:q.y-q.h-34-h;top=Math.max(8,Math.min(bot-h,top));
  if(IW.tab==='bank'&&panelOpen()){const pr=$('#pw').getBoundingClientRect();if(pr.width>40){sw.style.maxHeight=Math.round(Math.min(vh*.8,bot-12))+'px';const h2=sw.offsetHeight;left=Math.max(8,pr.left-w-14);top=Math.max(8,Math.min(bot-h2,pr.bottom-h2))}}   // banco: la ventana se coloca AL LADO de la mochila para poder arrastrar entre ambas
  sw.style.left=Math.round(left)+'px';sw.style.top=Math.round(top)+'px';sw.style.setProperty('--tx',Math.round(Math.max(18,Math.min(w-18,q.x-left)))+'px');sw.classList.toggle('below',below)}}
function hudPlate(now){ctx.save();const x=W-202,w=196;ctx.font='400 14px Spectral, Georgia, serif';ctx.fillStyle='#c7bba2';ctx.shadowColor='rgba(0,0,0,.95)';ctx.shadowBlur=6;ctx.textBaseline='middle';ctx.textAlign='left';const pl=INT?(INT.cave?'🕳️ ':'🏠 ')+INT.R.nm+' · '+BI[INT.k].n:BI[curB].ic+' '+BI[curB].n+' · nv '+BI[curB].lv+'+',pw=w-18-ctx.measureText(clk()).width-8,pt=ctx.measureText(pl).width;if(pt>pw)ctx.font='400 '+Math.max(8,14*pw/pt).toFixed(1)+'px Spectral, Georgia, serif';ctx.fillText(pl,x+9,21.5);ctx.font='400 14px Spectral, Georgia, serif';ctx.textAlign='right';ctx.fillStyle=UI.GOLD;ctx.fillText(clk(),x+w-9,21.5);ctx.restore()}
UI.initDom();if(/[?&]perf\b/.test(location.search))setTimeout(perfTog,0);
function tabClick(t){if(TB===t&&panelOpen()){setPanel(false,1);document.querySelectorAll('#tabs button').forEach(b=>b.classList.remove('on'));return}tab(t);setPanel(true,1)}
function tgGoal(){$('#goalp').classList.toggle('min');try{localStorage.setItem('ns_goal',$('#goalp').classList.contains('min')?1:0)}catch(e){}}
function tab(t){TB=t;setPanel(true);document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));panel()}
const ownT0=a=>typeof a[2]==='string'&&a[2].startsWith('tl:')&&S.tool[a[2].split(':')[1]]>=+a[2].split(':')[2];
const buyI=(id,c)=>{if(S.coins<c||!room(id))return;S.coins-=c;S.inv.push(id);snd('coin');dirty=1;save()};
const buyU=(k,i)=>{const c=UP[i][3][S[k]];if(c==null||S.coins<c)return;S.coins-=c;S[k]++;snd('quest');log('Mejora comprada: '+UP[i][1]);dirty=1;save()};
const travel=(k,c)=>{if(S.coins<c)return;if(INT)leaveRoom(1);S.coins-=c;stopA();P.g=P.mv=null;{const q=spawnOf(k);P.x=q.x;P.y=q.y}FD=performance.now();snd('coin');dirty=1;save()};
let td,DL=null;
function talk(){if(typeof PLAYA!=='undefined'&&PLAYA.ruTalk())return;inc('talk');S.gseen=S.goal;if(S.goal===PCH&&!S.path){pathUI();return}const g=GOALS[S.goal];DL={n:'Ru · Tendero',id:'ru',p:(g?(g[4]||'¡Hola de nuevo, viajero!'):'¡Lo lograste todo, viajero! Ahora ve por el nivel 99 en cada skill y completa la colección.').split('|'),i:0};dlgShow();dirty=1;save()}
function dlgShow(){if(hsOn()){HUDSU.dlg(DL);return}const d=$('#dlg');d.innerHTML='<b style="color:'+(DL.c||'var(--or)')+'">'+(DL.n||'Ru')+'</b><br>'+DL.p[DL.i]+(DL.i<DL.p.length-1?' <span style="color:var(--yl)">▸ LMB</span>':'');d.style.display='block';clearTimeout(td);td=setTimeout(()=>d.style.display='none',20000)}
function dlgNext(){if(hsOn()&&HUDSU.dlgSkip())return;if(hsOn()&&DL&&DL.opts&&DL.i>=DL.p.length-1&&HUDSU.hasOpts())return;   // con opciones (misiones) el diálogo solo se cierra eligiendo una (o Esc)
if(!DL||DL.i>=DL.p.length-1){if(hsOn())HUDSU.dlgHide();else $('#dlg').style.display='none';if(DL&&DL.then){const f=DL.then;DL.then=null;try{f()}catch(e){}}return}DL.i++;dlgShow()}
const ROOMOF={cocina:'taberna',alambique:'botica',furnace:'herreria',anvil:'herreria',armero:'herreria',curtidor:'taller',bench:'taller',cantero:'taller',joyero:'herreria',ingeniero:'taller',altar:'taller',fire:'taberna',bank:'banco',shop:'tienda',market:'tienda',shrine:'templo'};
function goTarget(s){if(!s)return null;const now=performance.now(),[k,a,b]=s.split(':');let l2=k==='S'?(()=>{let l=ST.filter(e=>e.id===a&&!e.deco);if(!l.length&&ROOMOF[a])l=INT?ST.filter(e=>e.id==='exit'):ST.filter(e=>e.id==='door'&&e.room===ROOMOF[a]);if(!l.length&&a==='alambique'&&!INT)l=ST.filter(e=>e.id==='door'&&e.room==='taller');return l})()/* Alquimia: la Botica donde exista (BOTICA_K en interiors.js) y, si no, el Taller */:k==='N'?N.filter(e=>e.t===a&&e.i===+b&&alive(e,now)):k==='M'?M.filter(e=>e.d.id===a&&alive(e,now)):k==='B'?[spawnOf(+a)]:[],best=null,bd=1e9;l2.forEach(e=>{const d=Math.hypot(e.x-P.x,e.y-P.y);if(d<bd){bd=d;best=e}});return best}
function recipeOf(id){for(const sk in ACT){const a=ACT[sk].find(a=>a.length===6&&(a[2]===id||(id.startsWith('rn_')&&String(a[2]).startsWith(id+':'))));if(a)return[sk,a]}return null}
// 14 oct 2026 (solo tutorial, pasos <22): si a la receta del objetivo le falta algo, la flecha lleva a conseguirlo (recursos, drops o el horno para fundir barras)
const TSRC={logs:'N:wc:0',cobre:'N:mi:0',estano:'N:mi:1',camaron:'N:fi:0',cuero:'M:vaca',grasa:'M:vaca',carne:'M:vaca',pluma:'M:gallina',huevo:'M:gallina',hueso:'M:goblin',lana:'M:oveja'};
function needOf(inp,mult,dep){for(const[k,v]of Object.entries(inp)){const d=v*mult-have(k);if(d<=0)continue;if(TSRC[k])return{id:k,t:TSRC[k]};const r=recipeOf(k);if(r&&dep<3&&k.startsWith('b_')){const n=needOf(r[1][1],d,dep+1);return n||{id:k,t:'S:furnace'}}return null}return null}
function goalNeed(g){if(!g||S.goal>=22||!g[1].startsWith('make:'))return null;const r=recipeOf(g[1].slice(5));if(!r||L(r[0])<rq(r[1])||hasIn(r[1][1]))return null;return needOf(r[1][1],1,0)}
function goalTgt(g){if(!g)return null;const n=goalNeed(g);if(!n)return goalReady(g)?goTarget(g[5]):null;return goTarget(INT&&/^[NM]/.test(n.t)?'S:furnace':n.t)}
function goalReady(g){if(!g[1].startsWith('make:'))return true;const r=recipeOf(g[1].slice(5));return !r||(L(r[0])>=rq(r[1])&&hasIn(r[1][1]))}
const chips=o=>Object.entries(o).map(([k,v])=>{const n=have(k);return `<span class="chip ${n>=v?'ok':'no'}" data-i="${k}">${ic(k)} ${I[k][0]} ${n}/${v}</span>`}).join(''),STN={cocina:'la Cocina',alambique:'el Alambique',furnace:'el Horno',anvil:'el Yunque',armero:'el Armero',curtidor:'el Banco de curtidor',cantero:'el Banco de cantero',joyero:'el Banco de joyero',ingeniero:'el Banco de ingeniero',fire:'la Fogata',bench:'el Taller',altar:'la Mesa de encantamiento'},
 // qué hace cada instalación: se muestra al abrir su menú (en vez de explicarlo en las skills)
 STD={cocina:'Cocina con fogón, sartén, parrilla y horno: prepara, cocina y emplata platos con efectos.',furnace:'Funde menas en barras.',anvil:'Forja armas y herramientas.',armero:'Forja armaduras de malla y placa.',curtidor:'Curte pieles y cose armaduras de cuero.',cantero:'Labra piedra: sillares, columnas y estatuillas.',joyero:'Talla gemas y engarza anillos y amuletos.',ingeniero:'Monta engranajes, bombas, trampas, aparejos, lentes y miras.',alambique:'Destila pociones y antídotos con hierbas y restos de monstruos.',fire:'Cocina comida que te cura.',bench:'Corta madera lisa y mangos; arma arcos, bastones y cañas; hila lana y teje tela; pule gemas.',altar:'Inscribe pergaminos de hechizo: no gastan maná ni runas.'};
function goalsHTML(){if(typeof ISLA!=='undefined'&&ISLA.on())return ISLA.html();if(typeof PLAYA!=='undefined'&&PLAYA.on())return PLAYA.html();const g=GOALS[S.goal];let h='';
 if(g){const v=Math.min(g[2],S.st[g[1]]||0),r=g[1].startsWith('make:')&&recipeOf(g[1].slice(5)),rd=goalReady(g),nd=goalNeed(g);
  h=(S.trk&&S.trk!=='main'&&(S.qs||[]).some(q=>q.id===S.trk)?`<div class="pchip" onclick="qTrack('main')">📍 ${(S.qs.find(q=>q.id===S.trk)||{}).t} ✕</div> `:'')+(S.path&&pathOpen()?`<div class="pchip" onclick="pathUI()">⇄ ${PATHS[S.path].e} ${PATHS[S.path].n}</div>`:'')+`<div style="color:var(--yl);font-size:25px">${g[0]}</div><div class="hint" style="margin:2px 0">${g[2]>1?fmt(v)+'/'+fmt(g[2]):''}${g[3]?' · Recompensa: '+money(g[3]):''}</div>${g[2]>1?`<div class="bar"><i style="width:${v/g[2]*100}%"></i></div>`:''}`
  +(r?`<div style="margin-top:6px">${chips(r[1][1])}</div>${L(r[0])<rq(r[1])?`<div class="hint" style="margin:4px 0;color:var(--yl)">📈 Sube a nivel ${rq(r[1])} de ${SK[r[0]][0]} para continuar</div>`:''}`:'')
  +(nd?`<div class="hint" style="color:var(--yl);margin:4px 0">🧭 Te falta ${ic(nd.id)} ${I[nd.id][0]}: la flecha te lleva a conseguirlo.</div>`:'')+`<div class="hint" style="color:#d8c9a3;margin-top:8px">💬 ${(g[4]||'Habla con Ru, en la plaza.').split('|').pop()}</div>`;
  }
 else h='<div style="color:var(--yl)">¡Completaste todos los objetivos!</div><div class="hint">Sube tus skills a 99.</div>';
 return h}   // HUD Susurro: solo el objetivo principal (sin «Después», sin «¡Casi!», sin jefes)
// el río del sudoeste solo se cruza por el puente: la ruta automática pasa por él
function bridgeWp(tg){const k=ownAt(P.x,P.y);if(k<0||ownAt(tg.x,tg.y)!==k)return null;const B=BI[k],br=B.village.bridge;if(!br)return null;const x0=B.ox,y0=B.oy,bx=x0+270,py=P.y-y0,ty0=tg.y-y0;
 if(P.x>x0+490||tg.x>x0+490)return null;const pn=py<1236,ps=py>1304,tn=ty0<1236,ts=ty0>1304;
 if((pn&&ts)||(ps&&tn))return Math.abs(P.x-bx)>12?{x:bx,y:y0+(pn?1224:1316)}:{x:bx,y:y0+(pn?1318:1222)};
 if(!pn&&!ps&&Math.abs(P.x-bx)<=14){if(ts)return{x:bx,y:y0+1318};if(tn)return{x:bx,y:y0+1222}}return null}
function useRV(k){if(INT)leaveRoom(1);const now=Date.now();if(k>=(S.st.bio||1)){log('Aún no has llegado a ese bioma.');return}if(performance.now()<(P.pj||0)||(A&&A.ty==='f')){log('No puedes usar la runa en combate.');return}if(now<(S.rvt||0)){log('La runa se está recargando: '+Math.ceil((S.rvt-now)/1000)+' s.');return}
 stopA();P.g=P.mv=null;sp(P.x,P.y-16,'#8ad8ff',20,100,90,140);{const q=spawnOf(k);P.x=q.x;P.y=q.y}FD=performance.now();sp(P.x,P.y-16,'#8ad8ff',20,100,90,140);S.rvt=now+45000;snd('magic');log('🌀 Te teletransportas a '+BI[k].n+'.');dirty=1;save()}
function buyRV(k){const id='rv_'+k,c=RVC[k];if(S.coins<c||count(id)>0||S.bank[id]>0)return;S.coins-=c;if(room(id))S.inv.push(id);else S.bank[id]=1;disc(id);snd('coin');log('Compraste: '+I[id][0]);dirty=1;save()}
function syncTools(){for(const k of ['wc','mi','fi','he']){const id=S.eq[k],T=id&&TOOLT[id];S.tool[k]=T?T.t:0;S.tq[k]=T?T.bq||0:0}}
function autoEq(id){const T=TOOLT[id];if(T&&!S.eq[T.k]){S.eq[T.k]=id;const j=S.inv.lastIndexOf(id);if(j>=0)S.inv.splice(j,1);syncTools();toast('🔧 ¡Herramienta equipada!<br>'+I[id][0])}}
const ownT=a=>false,unq=k=>{if(k==='u')return unqAmmo();const id=S.eq[k];if(!id||!room(id))return;if(k==='mt'&&!STAB.canLose())return;S.inv.push(id);S.eq[k]=null;syncTools();dirty=1;save()};
const twoH=id=>!!id&&!!(BOW[id]||STF[id]||/^lw_\d+[mb]/.test(String(id)));   // arma a dos manos
// REQUISITO DE NIVEL de las ARMAS (lote ESTADOS-FINALES, 28 oct 2026; decisión del dueño): la habilidad de combate que usa el arma (cuerpo a cuerpo → Combate, arco/ballesta → Arquería,
// bastón/cetro → Magia) al nivel de su TIER (nivel de la barra de metal en TI / de la madera en WO) o, si es botín `lw_<bioma>`, al nivel recomendado de ese bioma. Encantar no cambia el requisito.
function wReq(id){if(!id||!WB[id])return null;const b=String(id).split('@')[0].split('~')[0],sk=BOW[b]?'ra':STF[b]?'mg':'cb';let lv=1;const lw=/^lw_(\d+)/.exec(b);
 if(lw)lv=(BI[+lw[1]]&&BI[+lw[1]].lv)||1;else{const t=tierOf(b),i=TI.findIndex(r=>r[0]===t);if(i>=0)lv=TI[i][3];else{const w=WO.findIndex(r=>r[0]===t);if(w>=0)lv=WO[w][3]}}
 return{sk,lv:Math.max(1,lv|0)}}
const wOk=id=>{const q=wReq(id);return !q||L(q.sk)>=q.lv};
function use(i){const id=S.inv[i];if(ING.use(id,i))return;   /* Ingeniería (bombas, trampas, aparejos y el requisito de nivel de lentes y miras) va antes del equipar genérico */if(typeof OFGEAR!=='undefined'&&OFGEAR.is(id)){OFGEAR.equipFrom(i);return}if(BAGS[id]){const e=bagsA().findIndex(b=>!b);if(e<0)log('Tus 4 ranuras de mochila están ocupadas: arrastra la nueva sobre una para reemplazarla.');else bagEquip(e,id);return}if(id==='ropa_viajero'){S.inv.splice(i,1);S.app=S.app||{};S.app.under=0;dirty=1;snd('coin');toast('Te vistes con la ropa del baúl.',2200);save();return}   // PLAYA: quita la ropa interior
 if(BONEXP[id]){bury(i);return}if(AMS[id]!==undefined){eqAmmo(id);return}if(QVS[id]){const o=S.eq.m;S.eq.m=id;S.inv.splice(i,1);if(o)S.inv.push(o);snd('coin');dirty=1;save();return}if(/^rv_/.test(id)){useRV(+id.slice(3));return}
 if(TOOLT[id]){const k=TOOLT[id].k,o=S.eq[k];S.eq[k]=id;S.inv.splice(i,1);if(o)S.inv.push(o);syncTools();snd('coin');dirty=1;save();return}
 if(SCI[id]!==undefined){if(cast(SCI[id],1)){S.inv.splice(S.inv.indexOf(id),1);dirty=1;save()}return}
 if(WB[id]||AR[id]||SHL[id]||LGL[id]||GLL[id]||LOOT[id]){let k=LOOT[id]?LOOT[id].s:WB[id]?'w':SHL[id]?'s':LGL[id]?'l':GLL[id]?'g':'a';if(k==='r'&&S.eq.r&&!S.eq.r2)k='r2';
  /* DOS MANOS (22 oct 2026, decisión del dueño): ARCOS, BASTONES (y mandobles/ballestas) ocupan las dos manos: no se pueden llevar con ESCUDO. Equipar uno guarda el escudo en la mochila; equipar un escudo con uno puesto se rechaza. */
  if(k==='w'&&!wOk(id)){const q=wReq(id);toast('Necesitas nivel '+q.lv+' de '+SK[q.sk][0]+' para usar '+I[id][0]+'.',2800);snd('miss');return}
  if(k==='w'&&twoH(id)&&S.eq.s){if(!room(S.eq.s)){toast('Libera un hueco en la mochila: un arma a dos manos guarda el escudo.',2600);return}S.inv.push(S.eq.s);S.eq.s=null;toast('Arma a dos manos: el escudo vuelve a la mochila.',2400)}
  if(k==='s'&&twoH(S.eq.w)){toast('Con un arco, bastón o arma a dos manos no puedes llevar escudo.',2600);return}
  const o=S.eq[k];S.eq[k]=id;if(typeof AMB!=='undefined')AMB.take(id);S.inv.splice(i,1);if(o)S.inv.push(o);snd('coin');dirty=1;save();return}if(id==='pot_pr'){prInit();if(PP>=prMax()-.01)return log('Tus puntos de oración ya están completos.');const now=performance.now();if(now<QCD)return;QCD=now+600;eatDelay(now,600);S.inv.splice(i,1);PP=Math.min(prMax(),PP+7+Math.floor(L('pr')/4));prSync();P.eat=now;snd('magic');log('🙏 Bebes una poción de oración: '+Math.floor(PP)+'/'+prMax()+' puntos.');dirty=1;return}if(MANAP[id]){if(MN>=mnMax())return log('Ya tienes el maná al máximo.');S.inv.splice(i,1);MN=Math.min(mnMax(),MN+MANAP[id]);snd('magic');log('Recuperas maná.');dirty=1;return}
 if(ALQ.use(id,i)||COC.use(id,i))return;if(POT[id]){S.inv.splice(i,1);S.buf[POT[id]]=Date.now()+180000;snd('quest');log('Efecto activo 3 min: '+I[id][0]);dirty=1;return}if(id&&I[id][3]){const now=performance.now(),qk=I[id][3]<=QUICKH;if(qk?now<QCD:now<EATCD)return;if(P.hp+hotLeft()>=maxHp()&&!(I[id][4]&&MN<mnMax()))return log('Ya estás en plena forma.');
  S.inv.splice(i,1);inc('eat');if(qk)QCD=now+600;else EATCD=now+1100;eatDelay(now,qk?600:1800);P.eat=now;snd('eat');if(typeof AMB!=='undefined')AMB.food();const h=I[id][3],st=Math.max(1,Math.round(h/6));HOT.push({left:h,step:st,t:now+450});log('Comes '+I[id][0]+': recuperas '+h+' PV poco a poco.');
  if(I[id][4]){MN=Math.min(mnMax(),MN+I[id][4]);S.buf.mreg=Date.now()+90000;log('Tu maná se regenera más rápido durante 90 s.')}dirty=1}}
const sell=id=>{if(QITEM.has(id))return;const n=have(id);if(!n)return;inc('sell');S.inv=S.inv.filter(x=>x!==id);delete S.bank[id];earn(Math.round(n*I[id][2]*(1+.1*S.merc)));snd('coin');log('Vendiste '+n+'x '+I[id][0]);dirty=1;save()};
const sellAll=()=>{let g=0;if(S.inv.length)inc('sell');S.inv.forEach(x=>{if(!QITEM.has(x))g+=I[x][2]});g=Math.round(g*(1+.1*S.merc));S.inv=S.inv.filter(x=>QITEM.has(x));earn(g);snd('coin');log('Vendiste todo por '+money(g)+'.');dirty=1;save()};
const buy=(sk,t)=>{if(S.coins<TC[t]||L(sk)<TL[t])return;S.coins-=TC[t];S.tool[sk]=t;log('Compraste: '+TOOLS[sk][0]+' '+TN[t]);dirty=1;save()};
const buyPan=()=>{if(S.coins>=10&&room('pan')){S.coins-=10;S.inv.push('pan');dirty=1}};
/* BANCO ESTILO WOW (22 oct 2026): sin «Depositar todo». Se mueve arrastrando (src/dragdrop.js) o con Mayús+LMB: `bankPut(id,n)` / `bankTake(id,n)`; soltar un objeto FUERA de los paneles lo tira al suelo (`dropItem`); las mochilas se equipan arrastrándolas a una ranura (`bagEquip`) o con LMB. */
const bankOK=()=>!!(IW&&IW.tab==='bank'&&nearS('bank')),stackN=i=>{const z=invSlots().find(q=>q.i===i);return z?z.n:1};
function bankPut(id,n){let c=0;while(c<n){const j=S.inv.indexOf(id);if(j<0)break;S.inv.splice(j,1);c++}if(c){S.bank[id]=(S.bank[id]||0)+c;inc('dep');snd('coin');dirty=1;save()}return c}
function bankTake(id,n){let c=0;while(c<n&&S.bank[id]>0&&room(id)){S.inv.push(id);S.bank[id]--;c++}if(c){snd('coin');dirty=1;save()}else if(S.bank[id]>0)log('Mochila llena.');return c}
function dropItem(i,n){const id=S.inv[i];if(!id)return 0;if(QITEM.has(id)){log('Es un objeto de misión: no puedes tirarlo.');return 0}let c=0;while(c<n){const j=S.inv.indexOf(id);if(j<0)break;S.inv.splice(j,1);dropGround(id,P.x,P.y);c++}if(c){snd('miss');log('Tiras <b>'+I[id][0]+'</b>'+(c>1?' ×'+c:'')+'.');dirty=1;save()}return c}
function bagEquip(i,id){if(!BAGS[id]||i<0||i>3)return false;const b=bagsA(),old=b[i],j=S.inv.indexOf(id);if(j<0)return false;S.inv.splice(j,1);const nc=cap()-(BAGS[old]||0)+BAGS[id];if(old)S.inv.push(old);
 if(slotsUsed()>nc){if(old)S.inv.pop();S.inv.splice(j,0,id);log('No cabe lo que llevas en la mochila nueva: libera espacio.');return false}b[i]=id;snd('coin');dirty=1;save();return true}
function bagOut(i){const b=bagsA(),id=b[i];if(!id)return;b[i]=null;if(slotsUsed()+1>cap()){b[i]=id;log('Libera espacio antes de quitar esta mochila.');return}S.inv.push(id);snd('coin');dirty=1;save()}
function invClick(ev,i){const id=S.inv[i];if(ev&&ev.shiftKey&&bankOK()){bankPut(id,stackN(i));return}use(i)}
function bkClick(ev,k){bankTake(k,ev&&ev.shiftKey?99999:1)}
const wd=(k,n)=>{bankTake(k,n)};
const SKI={dm:'<path d="M4 17c0-5 3-8 6-9l2-3 1 3c3 1 5 3 5 7"/><path d="M6 17v3M9 17v3M15 17v3M18 17v3"/>',ing:'<circle cx="12" cy="12" r="3.2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2 2M16.4 16.4l2 2M5.6 18.4l2-2M16.4 7.6l2-2"/>',en:'<path d="M5 20L15 10"/><path d="M16 3l1.2 2.8L20 7l-2.8 1.2L16 11l-1.2-2.8L12 7l2.8-1.2z"/><path d="M6 6l.7 1.5L8.2 8l-1.5.7L6 10l-.7-1.3L3.8 8l1.5-.5z"/>',wc:'<path d="M5 20L15 10"/><path d="M13 4l7 3-2 4-3-1-2 2-3-3 2-2-1-3z"/>',mi:'<path d="M5 20L16 9"/><path d="M4 9c3-5 12-6 16-2-5-1-9 1-11 4z"/>',fi:'<path d="M4 20L19 4"/><path d="M19 4c0 5 1 8-2 11a2.2 2.2 0 1 1-3-1"/>',co:'<path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>',sm:'<path d="M4 19h16"/><path d="M6 19v-3h12v3"/><path d="M8 16c0-3 2-5 5-5h6"/><path d="M10 11V8"/>',cr:'<path d="M5 19L18 6"/><circle cx="17.6" cy="6.4" r="1.6"/><path d="M6 17c-2 1-3 3-1 4s4-1 4-3"/>',al:'<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7 15h10"/>',he:'<circle cx="6" cy="18" r="2.4"/><circle cx="12" cy="19" r="2.4"/><path d="M7.4 16.4L19 5M11 17L5 5"/>',ds:'<path d="M5 19L16 8"/><path d="M14 5l5 5-3 4-6-6z"/>',sa:'<path d="M4 20L20 4"/><circle cx="6.5" cy="17.5" r="1.6"/><path d="M10 14l-3 3M14 10l3-3"/>',pe:'<path d="M5 5h14v4l-3 2 3 2v6H5v-6l3-2-3-2z"/><path d="M9 9h6"/>',es:'<path d="M4 20l6-6"/><path d="M9 11l4 4 7-7-4-4z"/>',jo:'<circle cx="12" cy="15" r="5.5"/><path d="M9 7l3-3 3 3-3 3z"/>',ins:'<path d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 0 2 2H9a2 2 0 0 1-2-2z"/><path d="M10 9h6M10 13h6"/>',mg:'<path d="M12 3l2.2 6.3L21 10l-5.2 4.2L17.4 21 12 17.3 6.6 21l1.6-6.8L3 10l6.8-.7z"/>',cb:'<path d="M20 4l-9 9"/><path d="M17 4h3v3"/><path d="M8 12l4 4"/><path d="M6 18l-2 2"/>',ra:'<path d="M6 4c8 2 8 14 0 16"/><path d="M6 4v16"/><path d="M6 12h13"/><path d="M16 9l3 3-3 3"/>',pr:'<path d="M12 3v6"/><path d="M9 6h6"/><path d="M5 21c0-4 3-6 7-6s7 2 7 6"/>'};   // iconos de línea de las habilidades (panel Skills, sin emojis)
const far=m=>'<div class="hint">'+m+'</div>';
function skLive(k){const d=document.querySelector('#pn [data-sk="'+k+'"]');if(!d||L(k)!==+d.querySelector('.gold').textContent.split('/')[0])return;const l=L(k),x=S.xp[k],pc=l>=99?100:(x-XT[l])/(XT[l+1]-XT[l])*100,t=fmt(x)+' XP',h=d.querySelector('.hint');if(h.textContent!==t)h.textContent=t;d.querySelector('.bar i').style.width=pc+'%'}
function panelHTML(TB,win){let h='';
 if(TB==='ch'){
  // Hoja de personaje (rework oct 2026, referencia: WoW/Diablo/OSRS): columnas de ranuras a los lados del modelo 3D, armas abajo, estadísticas y herramientas en una columna aparte.
  // Las ranuras vacías muestran una silueta del tipo de pieza (SVG, sin emojis); las llenas, el icono pintado con contorno de rareza. `data-x` = tooltip del juego.
  const SIL={h:'<path d="M5 15a7 7 0 0 1 14 0v4h-3.5v-3.5h-7V19H5z"/><path d="M12 8v3"/>',c:'<path d="M8 4h8l3.5 16h-15z"/><path d="M8 4c1 2 7 2 8 0"/>',a:'<path d="M8.5 4L4 7l2 4.5 2.5-1V20h7V10.5l2.5 1L20 7l-4.5-3c-.5 1.6-1.8 2.5-3.5 2.5S9 5.6 8.5 4z"/>',l:'<path d="M7 3.5h10l1.2 17h-4.4L12 11.5l-1.8 9H5.8z"/>',f:'<path d="M8.5 3.5h5V12l6 2.8V19.5H5.5v-4.2z"/>',g:'<path d="M7 20.5v-6.2L4.8 10.5l1.9-1 1.8 2.5V5.2h2v6V4h2v7V5.2h2V11V7h2v8l-1.6 5.5z"/>',n:'<path d="M5.5 4c0 9 13 9 13 0"/><circle cx="12" cy="16" r="3.4"/><path d="M12 13.2v-1.6"/>',r:'<circle cx="12" cy="15" r="5.2"/><path d="M9.2 7.6L12 4l2.8 3.6L12 10.2z"/>',w:'<path d="M18.5 3.5l2 2-9 9-2.2-2.2z"/><path d="M9.3 12.3l-4.6 4.6M6.2 19.8l-2-2M11.6 14.6L8 18.2"/>',s:'<path d="M12 3.5l7 2.7v5.5c0 4.8-3 7.9-7 9-4-1.1-7-4.2-7-9V6.2z"/><path d="M12 3.8v16.5"/>',m:'<path d="M9 3.5l7.5 7.5-3 3L6 6.5z"/><path d="M12.4 14.2L16 20.5M9.4 11.4L4.5 17.5"/>',u:'<path d="M4.5 19.5L19 5M19 5h-5.6M19 5v5.6M5 17l-1.5 3.5"/>'};
  SIL.r2=SIL.r;SIL.mt='<path d="M4 17c0-5 3-8 6-9l2-3 1 3c3 1 5 3 5 7"/><path d="M6 17v3M9 17v3M15 17v3M18 17v3"/>';SIL.x='<circle cx="8" cy="13" r="3.4"/><circle cx="16" cy="13" r="3.4"/><path d="M11.4 13h1.2M4.6 13L3 11.5M19.4 13l1.6-1.5"/>';SIL.z='<path d="M4 12h13"/><rect x="6" y="9" width="8" height="6" rx="1.5"/><path d="M17 10v4M20 11v2"/>';SIL.wc='<path d="M5 20L15 10"/><path d="M13 4l7 3-2 4-3-1-2 2-3-3 2-2-1-3z"/>';SIL.mi='<path d="M5 20L16 9"/><path d="M4 9c3-5 12-6 16-2-5-1-9 1-11 4z"/>';SIL.fi='<path d="M4 20L19 4"/><path d="M19 4c0 5 1 8-2 11a2.2 2.2 0 1 1-3-1"/>';const sil=k=>'<svg class="sil" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+SIL[k]+'</svg>';
  const cell=(k,l,cap)=>{const id=S.eq[k],r=id&&rr(id);return `<div class="eqc"><button class="slot eq${id?'':' empty'}" data-eq="${k}" ${id?`data-i="${id}" data-dg="eq" data-dk="${k}" data-dn="1" onclick="unq('${k}')"`:`data-x="${l}: vacío"`}${id?sfx(id):''}>${id?ic(id):sil(k)}${k==='u'&&id&&S.amn>1?'<span class="cnt">'+S.amn+'</span>':''}</button>${cap?'<span class="cap">'+l+'</span>':''}</div>`},
  tcell=k=>`<div class="eqc"><div class="slot eq tool" data-x="${TOOLS[k][0]} ${tn(k,S.tool[k])}. ${k==='he'?'Corta hierbas con el minijuego del nudo: más tier = zona de corte más ancha y acceso a hierbas mejores.':'Golpea cada '+(hitPeriod(k)/1000).toFixed(1)+' s con '+toolDmg(k).toFixed(1)+' de daño; los recursos tienen vida (más tier = más vida), así que una herramienta mejor los rompe en menos golpes.'} Se mejora fabricando.">${ic('tl:'+k+':'+S.tool[k])||sil(k)}</div><span class="cap">${TOOLS[k][0]}</span></div>`,
  st=(l,v,x)=>`<div class="st"${x?` data-x="${x}"`:''}><span>${l}</span><b>${v}</b></div>`,tot=SKL.reduce((t,k)=>t+L(k),0);
  h='<div class="char"><div class="ch-l"><div class="ch-top"><b>'+((S.app&&S.app.name)||'Aventurero')+'</b><span>Nivel total '+tot+'</span></div>'
   +'<div class="ch-grid"><div class="ch-col">'+cell('h','Casco')+cell('c','Capa')+cell('a','Armadura')+cell('l','Pantalones')+'</div><div class="ch-mid"><canvas id="doll" width="300" height="420"></canvas></div><div class="ch-col">'+cell('n','Amuleto')+cell('g','Guantes')+cell('r','Anillo')+cell('r2','Anillo 2')+cell('x','Lentes')+cell('f','Botas')+'</div></div>'
   +'<div class="ch-arms">'+cell('w','Arma',1)+cell('s','Escudo',1)+cell('m','Carcaj',1)+cell('u','Munición',1)+cell('z','Mira',1)+cell('mt','Montura',1)+'</div></div>'
   +'<div class="ch-r"><h3>Atributos</h3><div class="ch-stats">'+st('Vida',Math.ceil(Math.max(0,P.hp))+' / '+maxHp())+st('Maná',Math.floor(MN)+' / '+mnMax())+st('Golpe máx.',maxHit())+st('Defensa','+'+ab())
   +st('Resistencia',armInfo(),'Daño que te evitas (o sufres de más) por tu armadura contra cada estilo: malla resiste cuerpo a cuerpo, cuero distancia, túnica magia; cada clase es débil a otra.')+st('Ataque',(atkMs()/1000).toFixed(1)+' s')+'</div>'
   +'<h3>Herramientas</h3><div class="ch-tools">'+tcell('wc')+tcell('mi')+tcell('fi')+tcell('he')+'</div>'+'<button class="bt ch-out" onclick="OFGEAR.toggle()" data-x="Herramientas y ropa de tus oficios de fabricación: dan Maña, Pulso y puntos de oficio en la Hoja de trabajo.">Equipo de oficio</button>'
   +(window.R3D_ON&&window.R3D&&window.R3D.outfits?'<button class="bt ch-out" onclick="openOutfit()" data-x="Cambia las prendas de tu personaje. El equipo que llevas puesto se superpone.">Atuendo · '+window.R3D.outfits.of(S.app&&S.app.outfit).name+'</button>':'')+'</div></div>'}
 else if(TB==='inv'){h=bagGridHTML(1)}
 else if(TB==='sk'){const dmK=k=>typeof ISLA!=='undefined'&&ISLA.lock()&&!(S.awk&&S.awk[k]),G=[['Combate',['cb','ra','mg','pr']],['Recolección',['wc','mi','fi','he','ds']],['Oficios',['co','sm','pe','sa','cr','es','jo','ing','dm','al','en']]],card=k=>{const dm=dmK(k),l=L(k),x=S.xp[k],pc=dm?0:l>=99?100:(x-XT[l])/(XT[l+1]-XT[l])*100;return `<div class="skc${dm?' lk':''}" data-sk="${k}"><span class="ski"><svg viewBox="0 0 24 24">${SKI[k]||''}</svg></span><div class="skm"><div class="skt"><b>${SK[k][0]}</b><span class="gold">${dm?0:l}/99</span></div><div class="bar"><i style="width:${pc}%"></i></div><span class="hint">${fmt(x)} XP</span></div></div>`},tot=SKL.reduce((n,k)=>n+(dmK(k)?0:L(k)),0);
  h='<h2>Habilidades <small>nivel total '+tot+'</small></h2><div class="skhd"><span>Combate<b>'+(dmK('cb')?0:CBL())+'</b></span><span>Total<b>'+tot+'</b></span><span>XP total<b>'+fmt(SKL.reduce((n,k)=>n+(dmK(k)?0:S.xp[k]||0),0))+'</b></span></div>'+G.map(g=>'<div class="sks">'+g[0]+'</div><div class="skg">'+g[1].filter(k=>SK[k]).map(card).join('')+'</div>').join('')}
 else if(TB==='qm')h=qmHTML();else if(TB==='q'){h='<h2>Logros <small>'+Q.filter((q,i)=>S.done[i]).length+'/'+Q.length+'</small></h2>'+Q.map((q,i)=>{const v=Math.min(q[3],S.st[q[2]]||0),d=S.done[i];return `<div class="ach${d?' done':''}"><div class="ah"><b>${q[0]}</b><span class="rw">${d?'<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.2 3L13 4.5"/></svg>':money(q[4])}</span></div><div class="hint">${q[1]} · ${fmt(v)}/${fmt(q[3])}</div><div class="bar"><i style="width:${v/q[3]*100}%"></i></div></div>`}).join('')}
 else if(TB==='pr')h=prHTML();
 else if(TB==='mg'&&!MAGIC_ON){h='<h2>Magia <small>en rediseño</small></h2><div class="hint" style="margin:6px 0">Aquí irán las ESCUELAS de magia, los hechizos que puedes aprender y sus árboles de habilidad. Los puntos de magia desbloquean nodos y se podrán combinar escuelas.</div><div class="hint">Por ahora no hay hechizos: los bastones golpean cuerpo a cuerpo y suben Combate.</div>'}
 else if(TB==='mg'){const lv=L('mg'),all=SPL.map((s,i)=>[s,i]),open=all.filter(x=>lv>=x[0].lv),nx=all.find(x=>lv<x[0].lv),RI={air:'Aire',earth:'Tierra',life:'Vida',water:'Agua',fire:'Fuego',arc:'Arcana'};
  h=`<h2>Magia <small>nivel ${lv}</small></h2><div class="hint" style="margin:0 0 4px">Maná ${Math.floor(MN)}/${mnMax()} · +${(mreg()*60).toFixed(1)}/min</div><div style="margin-bottom:6px">${Object.keys(RI).map(k=>`<span class="chip ${(S.runes[k]||0)>0?'ok':'no'}" data-x="Runa de ${RI[k].toLowerCase()}: cae de los monstruos.">${ic('rn_'+k)} ${RI[k]} ${S.runes[k]||0}</span>`).join('')}</div>`+open.map(([s,i])=>{const can=MN>=s.mp&&hasRunes(s.r);return `<div class="row${can?'':' cant'}"><div style="min-width:0"><div>${s.e} <span class="nm">${s.n}</span></div><div class="hint" style="margin:0">${s.atk?'Proyectil: hasta '+spMax(s)+' de daño':s.d} · ${s.mp} maná · ${s.xp} XP</div><div>${Object.entries(s.r).map(([k,v])=>`<span class="chip ${(S.runes[k]||0)>=v?'ok':'no'}">${ic('rn_'+k)} ${RI[k]} ${S.runes[k]||0}/${v}</span>`).join('')}</div></div><button class="bt" ${can?'':'disabled'} onclick="cast(${i})">${s.atk&&aimOn()?(S.selSp===i||(S.selSp==null&&curSpell()===i)?'✔ Elegido':'Elegir'):'Lanzar'}</button></div>`}).join('')+(nx?far('Próximo hechizo: '+nx[0].n+' (nv. '+nx[0].lv+')'):'')}
 else if(TB==='col'){const ids=Object.keys(I).filter(k=>k!=='quemado'&&!k.includes('~')),n=ids.filter(k=>S.disc[k]).length;h=`<h2>Colección <small>${n}/${ids.length}</small></h2><div class="inv">`+ids.map(k=>S.disc[k]?`<div class="slot" data-i="${k}"${sfx(k)}>${ic(k)}</div>`:'<div class="slot" style="opacity:.35" data-x="Aún no descubierto">❔</div>').join('')+'</div>'}
 else if(TB==='bank'){if(!nearS('bank'))h=far('Acércate al banco.');else{const en=Object.entries(S.bank).filter(e=>e[1]>0&&!(win&&IWQ&&!nrm(I[e[0]][0]).includes(IWQ))),cells=en.map(([k,v])=>`<button class="slot" data-i="${k}" data-dg="bank" data-dn="${v}"${sfx(k)} onclick="bkClick(event,'${k}')">${ic(k)}${v>1?'<span class="cnt">'+(v>9999?Math.floor(v/1000)+'k':v)+'</span>':''}</button>`);for(let q=cells.length;q<Math.max(35,Math.ceil(cells.length/7)*7);q++)cells.push('<div class="slot"></div>');h='<h2>Banco <small>'+en.length+' tipos</small></h2><div class="hint bkh">Arrastra aquí desde la mochila · Mayús+LMB mueve todo</div><div class="inv bkg">'+cells.join('')+'</div>'}}
 else if(TB==='shop')h='';   // Fase 28b: la tienda es ahora la ventana de vendedor (src/shop.js)
 else h=stHTML(win);
 return h}
// ---- Ventana de instalaciones (rehecha 13 oct 2026, punto 6): filtro de categoría + «✔ Puedo» + búsqueda; filas compactas (icono, nombre, nivel, estado); al pulsar una fila se abre la ficha con la RECETA completa
// (cada ingrediente con lo que tienes/necesitas y dónde conseguirlo, resultado y estadísticas, XP, tiempo, cuántas puedes hacer, cantidad y botón). Los desbloqueos futuros se pueden consultar (grupo «Próximos») aunque no puedas fabricarlos.
let IWSEL=null,IWCAT='',IWLK=0;
let IWSCR=0;const iwSel=(sk,i)=>{IWSEL=IWSEL&&IWSEL.sk===sk&&IWSEL.i===i?null:{sk,i};IWSCR=1;dirty=1;panel()},iwCat=c=>{IWCAT=c;dirty=1;panel()},iwLk=()=>{IWLK=IWLK?0:1;dirty=1;panel()};
const catOf=(sk,a)=>{const o=String(a[2]||'');if(sk==='ing'){return /^bm_/.test(o)?'💣 Bombas':/^tr_/.test(o)?'🪤 Trampas':/^mk_/.test(o)?'⚙️ Aparejos':/^(ln_|mr_)/.test(o)?'🥽 Lentes y miras':'🔩 Piezas'}if(sk==='en'){const n=String(a[0]);return /^Encantar/.test(n)?'✨ Encantar':/^(Potenciar|Ascender)/.test(n)?'⬆️ Mejorar':/^Refinar/.test(n)?'💠 Esencias':/^Desarmar/.test(n)?'🔧 Desarmar':'✨ Encantar'}   /* Mesa de encantamiento (lote ENCANT-CIERRE): pestañas por tipo; antes las armas caían en «Armas» por su id */if(/^(sw_|bw_|st_)/.test(o))return'⚔️ Armas';if(/^(ar_|sh_|lg_|gl_)/.test(o))return'🛡️ Armadura';if(/^(ax_|pk_|rd_|og_|tl:)/.test(o))return'🛠️ Herramientas';if(/^(fl_|vi_|qv_)/.test(o))return'🏹 Munición';if(/^b_/.test(o))return'🟧 Barras';if(/^rn_/.test(o))return'🔮 Runas';
 if(sk==='co')return'🍖 Platos';if(sk==='es')return'🪵 Esculpido';if(sk==='ins')return'📜 Pergaminos';if(sk==='en')return'✨ Encantamientos';return'📦 Otros'};
const whereOf=k=>desc(k).split('\n').filter(l=>/^(Se obtiene|Se fabrica|Lo suelta|Drop raro)/.test(l)).slice(0,2).join(' · ');
// lote C1b-1: qué estación muestra cada receta. Herrería (sm): Horno = barras · Armero = armadura de malla/placa (ar_/sh_/lg_/gl_ de barra) · Yunque = armas y herramientas. Artesanía (cr): Banco de curtidor = piezas de cuero (`_cu_`, ar_cuero) · Taller = el resto (hilar, gemas, túnicas hasta que llegue la Sastrería). Una estación de otro tipo (p. ej. un horno suelto antiguo) muestra lo que le tocaba antes.
const recKind=(sk,a)=>{const o=typeof a[2]==='string'?a[2]:'';if(sk==='sm')return o.startsWith('b_')?'furnace':/^(ar|sh|lg|gl)_[a-z]+$/.test(o)?'armero':'anvil';if(sk==='pe')return'curtidor';if(sk==='cr'||sk==='sa')return'bench';if(sk==='es')return'cantero';if(sk==='jo')return'joyero';if(sk==='ing')return'ingeniero';if(sk==='en')return'altar';return null};
const recStn=(sk,a,id)=>{const k=recKind(sk,a);if(!k)return true;if(sk==='sm')return id==='furnace'||id==='armero'||id==='anvil'?k===id:k!=='furnace';return id==='curtidor'||id==='bench'||id==='cantero'||id==='joyero'||id==='ingeniero'||id==='altar'?k===id:true};
function stHTML(win){const s=S.stn;if(!s||!near(s))return far('Acércate a una estación.');
 const q=win?IWQ:'',items=[];
 s.sks.forEach(sk=>{const fl=a=>recStn(sk,a,s.id),lv=L(sk);ACT[sk].forEach((a,i)=>{if(!fl(a))return;const o=a[2]&&a[2].startsWith('rn_')?a[2].split(':')[0]:a[2],on=!!(A&&A.ty==='c'&&A.i===i&&A.sk===sk),own=ownT(a),can=!own&&hasIn(a[1]);
  const gt=GATE[a[2]],gl=gt&&L(gt[0])<gt[1]?gt:null;items.push({sk,i,a,o,lv:gt?gt[1]:rq(a),gl,open:lv>=rq(a)&&!gl,on,own,can,ok:can||on,cat:catOf(sk,a)})})});
 const nameOk=x=>!q||nrm(x.a[0]).includes(q),base=items.filter(nameOk),vis=base.filter(x=>x.open&&(!win||!IWC||x.ok)),locked=base.filter(x=>!x.open);
 const cats=[];vis.concat(IWC?[]:locked).forEach(x=>{if(!cats.includes(x.cat))cats.push(x.cat)});if(IWCAT&&!cats.includes(IWCAT))IWCAT='';
 const inCat=x=>!IWCAT||x.cat===IWCAT,V=vis.filter(inCat).sort((p,q2)=>(q2.ok-p.ok)||(p.sk==='en'&&q2.sk==='en'?String(p.a[0]).localeCompare(String(q2.a[0]))||p.lv-q2.lv:p.lv-q2.lv)),LK=locked.filter(inCat).sort((p,q2)=>p.lv-q2.lv);
 const row=x=>{const sel=IWSEL&&IWSEL.sk===x.sk&&IWSEL.i===x.i,st=x.on?'on':x.own?'own':!x.open?'lock':x.can?'can':'miss',dot={on:'▸',own:'✓',lock:'◌',can:'●',miss:'○'}[st],
   ico=x.o?ic(x.o):ic(Object.keys(x.a[1])[0]),tag=x.own?'equipada':x.o&&!String(x.o).startsWith('tl:')&&!String(x.o).startsWith('rn_')&&count(x.o)?'×'+count(x.o):'';
  let d='';if(sel){const mx=Math.min(...Object.entries(x.a[1]).map(([k,v])=>Math.floor(have(k)/v))),isT=String(x.o||'').startsWith('tl:'),miss=Object.entries(x.a[1]).filter(([k,v])=>have(k)<v),tip=x.o&&!isT&&!String(x.o).startsWith('rn_')&&I[x.o]?desc(x.o).split('\n').slice(1).filter(l=>!/^(Se obtiene|Se fabrica|Lo suelta|Drop raro|Sirve para)/.test(l)).join('<br>'):isT?'Se equipa sola. Cada tier acorta el tiempo entre golpes y reduce los golpes necesarios por recurso.':'';
   const bt=x.own?'<button class="bt" disabled>Equipada</button>':!x.open?`<button class="bt" disabled>${x.gl?SK[x.gl[0]][0]+' nv. ':'Nivel '}${x.gl?x.gl[1]:x.lv}</button>`:`<button class="bt ${x.on?'stop':''}" ${x.ok?'':'disabled'} onclick="${x.on?'stopA()':`startC('${x.sk}',${x.i})`}">${x.on?'Parar':x.sk==='co'?'Cocinar':'Hacer'}</button>`;
   d=`<div class="idet"><div class="hint" style="margin:0 0 3px">Receta</div><div>${chips(x.a[1])}</div>`+(miss.length?`<div class="hint" style="margin:3px 0 0">Te falta: ${miss.map(([k,v])=>`${I[k][0]} <b>${v-have(k)}</b>`+(whereOf(k)?' <span style="opacity:.75">('+whereOf(k).replace(/Se obtiene con /g,'').replace(/Lo suelta: /g,'suelta ').replace(/Se fabrica: /g,'fabricar ')+')</span>':'')).join('; ')}</div>`:'')
    +(tip?`<div class="hint" style="margin:5px 0 0">${tip}</div>`:'')+`<div class="hint" style="margin:5px 0 0">${xv(x.a)} XP · ${(dur(x.sk,x.a)/1000).toFixed(1)} s${x.o&&I[x.o]&&I[x.o][3]?' · cura '+I[x.o][3]+' PV':''}${x.o&&I[x.o]&&I[x.o][4]?' · +'+I[x.o][4]+' maná':''}${x.o&&String(x.o).startsWith('rn_')?' · da '+x.a[2].split(':')[1]+' runas':''}${x.open&&!x.own?' · puedes hacer <b>'+mx+'</b>':''}</div>`
    +`<div style="display:flex;gap:6px;align-items:center;justify-content:space-between;margin-top:6px;flex-wrap:wrap">${x.open&&!x.own&&!isT?qtyMini():'<span></span>'}${bt}</div></div>`}
  return `<div class="ir ${st}${sel?' sel':''}" onclick="iwSel('${x.sk}',${x.i})"><span class="id">${dot}</span><span class="ii">${ico}</span><span class="nm">${x.a[0]}</span><span class="hint" style="margin:0 0 0 auto;white-space:nowrap">${tag?tag+' · ':''}nv ${x.lv}</span></div>${d}`};
 const chip=(c,n)=>`<button class="bt cat${IWCAT===c?' on':''}" onclick="iwCat('${c}')">${c||'Todo'}${n!=null?' <span class="hint" style="margin:0">'+n+'</span>':''}</button>`;
 let h='';
 if(cats.length>1)h+=`<div class="cats">${chip('',vis.length+(IWC?0:locked.length))}${cats.map(c=>chip(c,vis.filter(x=>x.cat===c).length+(IWC?0:locked.filter(x=>x.cat===c).length))).join('')}</div>`;
 h+=`<div class="hint" style="margin:0 0 3px">${cats.length>1?'':(STD[s.id]||'')+' · '}${s.sks.map(sk=>SK[sk][1]+' '+SK[sk][0]+' nv '+L(sk)).join(' · ')}</div>`;
 h+=V.length?V.map(row).join(''):far(q?'Nada con ese nombre.':IWC?'Ahora mismo no puedes hacer nada aquí.':'Nada en esta categoría.');
 if(IWC){const hid=base.filter(x=>x.open&&!x.ok&&inCat(x)).length;if(hid)h+=far(`${hid} receta${hid>1?'s':''} más con materiales que te faltan: desactiva «Puedo» para verlas.`)}
 if(LK.length&&!IWC||(q&&LK.length)){h+=`<div class="ir lkh" onclick="iwLk()">Próximos desbloqueos (${LK.length}) <span class="hint" style="margin:0 0 0 auto">${IWLK||q?'▾':'▸'}</span></div>`+(IWLK||q?LK.map(row).join(''):'')}
 return h}
const qtyMini=()=>'<span style="display:flex;gap:3px;align-items:center"><span class="hint" style="margin:0">Cant.</span>'+[[1,'1'],[5,'5'],[10,'10'],[25,'25'],[0,'∞']].map(([n,l])=>`<button class="bt qm${QTY===n?' on':''}" onclick="setQty(${n})">${l}</button>`).join('')+(A&&A.ty==='c'&&A.left<1e8?`<span class="hint" style="margin:0">(quedan ${A.left})</span>`:'')+'</span>';
function paintDoll(){try{if(typeof HUDSU!=='undefined'&&HUDSU.doll)HUDSU.doll()}catch(e){console.warn('[doll]',e)}}   // el muñeco 3D de la pestaña Personaje (hud.js `doll`): re-inserta el canvas persistente que dibuja `dollFrame` (21 oct 2026: la función estaba vacía y la pestaña salía sin personaje)
function bagGridHTML(withTitle){const sl=invSlots();return (withTitle?'<h2>Mochila <small>'+sl.length+'/'+cap()+'</small></h2>':'<h3>Mochila <small>'+sl.length+'/'+cap()+'</small></h3>')+'<div class="bagbar"><span class="bagslot base" data-x="Mochila base · 16 ranuras"><svg viewBox="0 0 24 24"><path d="M8 6a4 4 0 0 1 8 0"/><rect x="5" y="7" width="14" height="14" rx="3"/><path d="M9 14h6"/></svg></span>'+bagsA().map((b,i)=>b?`<button class="bagslot full" data-bag="${i}" data-i="${b}" onclick="bagOut(${i})">${ic(b)}<em>+${BAGS[b]}</em></button>`:`<button class="bagslot" data-bag="${i}" data-x="Ranura de mochila: arrastra o usa una mochila"></button>`).join('')+'</div><div class="inv">'+Array.from({length:Math.max(cap(),sl.length)},(_,i)=>{const z=sl[i];if(!z)return '<div class="slot"></div>';const d=z.id;return `<button class="slot" data-i="${d}" data-dg="inv" data-di="${z.i}" data-dn="${z.n}"${sfx(d)} onclick="invClick(event,${z.i})">${ic(d)}${z.n>1?'<span class="cnt">'+z.n+'</span>':''}</button>`}).join('')+'</div>'+(withTitle?'<div class="purse" title="Monedas">'+moneyH(S.coins)+'</div>':'')}
/* MOCHILA JUNTO AL PERSONAJE (22 oct 2026): con la pestaña Personaje abierta aparece un panel flotante `#bw` con la mochila a su izquierda, para arrastrar objetos entre ella y las casillas de equipo (src/dragdrop.js). */
function bwSync(){let b=document.getElementById('bw');const pw=$('#pw');if(TB!=='ch'||!panelOpen()){if(b)b.hidden=true;return}
 if(!b){b=document.createElement('div');b.id='bw';document.body.appendChild(b)}b.hidden=false;b.style.fontSize=getComputedStyle(pw).fontSize;b.innerHTML=bagGridHTML(1);
 const r=pw.getBoundingClientRect(),w=b.offsetWidth,h=b.offsetHeight;b.style.left=Math.max(8,Math.round(r.left-w-12))+'px';b.style.top=Math.max(8,Math.round(r.bottom-h))+'px'}
function panel(){const pn=$('#pn'),sb=$('#swb'),s1=pn.scrollTop,s2=sb.scrollTop;$('#pw').classList.toggle('wide',TB==='inv'||TB==='ch');$('#pw').classList.toggle('xwide',TB==='ch');pn.innerHTML=panelHTML(TB);if(TB==='ch')paintDoll();bwSync();if(IW){sb.innerHTML=panelHTML(IW.tab,1);sb.scrollTop=s2;if(IWSCR){IWSCR=0;const d=sb.querySelector('.idet');if(d){const r=d.getBoundingClientRect(),b=sb.getBoundingClientRect();if(r.bottom>b.bottom)sb.scrollTop+=r.bottom-b.bottom+12;const s=sb.querySelector('.ir.sel').getBoundingClientRect();if(s.top<b.top)sb.scrollTop-=b.top-s.top+2}}}pn.scrollTop=s1;$('#goals').innerHTML=goalsHTML();$('#hd').innerHTML=`${S.app&&S.app.name?'<b>'+S.app.name+'</b> · ':''}Oro <b>${fmt(S.coins)}</b> · Nivel total <b>${SKL.reduce((s,k)=>s+L(k),0)}</b> <button class="bt" onclick="mut()">${S.mute?'🔇':'🔊'}</button>`;{const m=$('#mutb');if(m)m.textContent=(S.mute?'🔇':'🔊')+' Sonido: '+(S.mute?'NO':'SÍ')}}

// ---------- inicio ----------
SKL.forEach(k=>S.st['lvl:'+k]=L(k));S.st.tot=SKL.reduce((s,k)=>s+L(k),0);
S.rest=0; // el «descanso» (+50 % XP tras estar fuera) se quitó en oct 2026: era demasiado fuerte
S.cur=null;   /* progreso OFFLINE retirado (21 oct 2026, decisión del dueño: ya no es un idle) */
setInterval(save,5000);$('#mv').value=S.mv;$('#sv').value=S.sv;$('#mv').oninput=e=>{S.mv=+e.target.value;save()};$('#sv').oninput=e=>{S.sv=+e.target.value;save()};autoBtn();$('#log').innerHTML='<div>'+logs[0]+'</div>';{let pv=null,gv=null;try{pv=localStorage.getItem('ns_pn');gv=localStorage.getItem('ns_goal')}catch(e){}const open=pv===null?innerWidth>=900&&innerHeight>=500:pv==='1';tab('inv');if(!open){setPanel(false);document.querySelectorAll('#tabs button').forEach(b=>b.classList.remove('on'))}if(gv==='1'||(gv===null&&innerHeight<500))$('#goalp').classList.add('min')}
let last=performance.now();
// Panel de rendimiento (tecla F4 o ?perf): fps, mediana/p95/máx de frame, ms de JS del dibujo, chunks síncronos, calidad. Sirve para decir QUÉ tirones hay.
let PF=null,PFT=[],PFJ=0,PFU=0;const pfEl=()=>PF||(PF=Object.assign(document.createElement('pre'),{id:'perf',hidden:true}),document.body.appendChild(PF),PF);
function perfTog(){const e=pfEl();e.hidden=!e.hidden}
function perfUpd(now){if(!PF||PF.hidden||now-PFU<500)return;PFU=now;const a=PFT.slice().sort((x,y)=>x-y),n=a.length;if(!n)return;const st=TER.stats?TER.stats():{};PF.textContent='fps '+(1000/(a.reduce((x,y)=>x+y,0)/n)).toFixed(0)+'  frame med '+a[n>>1].toFixed(1)+' p95 '+a[Math.floor(n*.95)].toFixed(1)+' máx '+a[n-1].toFixed(0)+' ms\n>33ms: '+a.filter(x=>x>33).length+'/'+n+'  JS dibujo '+(PFJ/Math.max(1,n)).toFixed(1)+' ms\ncalidad '+(QA?'auto ':'')+QNAM[QL]+' · lienzo '+cv.width+'×'+cv.height+(window.R3D&&R3D.gpu&&R3D.gpu.mundo!=null?'\nGPU mundo '+R3D.gpu.mundo.toFixed(1)+' ms · héroe '+(R3D.gpu.heroe||0).toFixed(1)+' ms':(window.R3D?'\n(sin medidor de GPU en este navegador)':''))+'\nzoom '+ZS_()+(window.R3D&&R3D.stats?'\nmonedas/h '+money(coinsPerHour())+'\ndibujos '+R3D.stats().calls+' · tris '+(R3D.stats().tris/1000|0)+'k'+(R3D.lm?' · luces '+R3D.lm.n:''):'')+'\n(F4 oculta)';PFT=[];PFJ=0}
const ZS_=()=>ISO.V.zoom;
let FPNX=0;   // FLUIDEZ (26 oct 2026): límite de fps (Opciones → Gráficos → Ajustes avanzados → «Límite de fps»). Se dibuja cuando toca según un reloj OBJETIVO (no «han pasado ≥ X ms»), así el ritmo medio es exacto; si el juego se retrasa más de 2 fotogramas, el reloj se reengancha.
function loop(now){{const cap=gfx('fps');if(cap){const iv=1000/cap;if(now<FPNX-1.5){requestAnimationFrame(loop);return}FPNX=now-FPNX>iv*2?now+iv:FPNX+iv}}const fdt=now-last;DT=Math.min(.05,fdt/1000);last=now;if(fdt<400)PFT.push(fdt);if(typeof CINE!=="undefined"){CINE.tick(now);if(!CINE.on)upd(DT,now)}else upd(DT,now);bgm(now,DT);const j0=performance.now();draw(now);PFJ+=performance.now()-j0;perfUpd(now);iwFrame();qmon(now,fdt);;if(dirty&&!pd&&now-lr>250){dirty=0;lr=now;panel()}requestAnimationFrame(loop)}
// ---------- pantalla de carga y precalentado (oct 2026) ----------
// Antes el juego arrancaba «en frío»: el shader del agua, los chunks del terreno, el horneado de sprites (props, recursos, jugador, monstruos) y los lienzos de la luz se creaban
// durante las primeras vueltas del bucle → tirones al empezar a caminar. Ahora, mientras se muestra #boot (div del index.html con barra), se precalienta TODO en tandas cortas
// (≤14 ms entre fotogramas, así la barra se anima) y solo entonces arranca loop(). Pasos y peso de la barra: tipografías 6 % · terreno (vista + anillo de precarga) 34 % · agua y primer fotograma 8 % ·
// sprites del entorno 30 % · jugador 8 % · monstruos 6 % · luz nocturna 4 % · fotograma final 4 %.
// Se omite con `?noload` y, por defecto, en navegadores automatizados (navigator.webdriver: las herramientas de tools/ miden desde el primer segundo); `?load` la fuerza también ahí.
// Seguridad: pase lo que pase (error, pestaña oculta, equipo muy lento) el juego arranca como mucho a los 20 s; nunca se queda en la pantalla de carga.

/* OFICIOS ENTRELAZADOS (Fase 3·c, 21 oct 2026; regla del dueño: «a más tier, más ítems de OTROS oficios; tope 4–5 componentes distintos»): se aplica UNA vez al arrancar, sobre las recetas ya construidas.
   Las recetas de nivel ≤ 3 (las del tutorial de la isla) NO se tocan. Reglas:
   · Herrería: toda barra pide COMBUSTIBLE (Tala: `logs`, más cuanto mayor el nivel); las espadas piden empuñadura de MADERA del tier (Tala) + correa de CUERO (Caza) y, desde nivel 45, pomo de HUESO.
   · Artesanía: los petos piden acolchado de LANA (Ganadería), más cuanto mayor el nivel.
   · Cocina: los platos «f_» (fritos/guisos) piden leña (fuego lento). · Escultor: los arcos piden PLUMAS (emplumado).
   Comprobación: `python tools/craft_balance.py` (componentes ≤ 5, ingredientes obtenibles, esfuerzo por pieza). Un oficio/receta nueva = una línea aquí. */
let IL_DONE=false;function applyInterlock(){if(IL_DONE)return;IL_DONE=true;
 const WDI=lv=>lv<15?'logs':lv<30?'roble':lv<45?'sauce':lv<60?'arce':'tejo',add=(a,id,n)=>{if(n>0&&!(id in a[1])&&Object.keys(a[1]).length<5)a[1][id]=n};
 for(const a of ACT.sm||[]){if(a.length!==6||a[3]<=3)continue;const o=String(a[2]),lv=a[3];if(/^b_/.test(o))add(a,'logs',Math.ceil(lv/30));else if(/^(sw_|lw_)/.test(o)){add(a,'mn_'+WON[WO.findIndex(w=>w[2]===WDI(lv))],1);add(a,'cu_'+(TI.find(t=>o.endsWith(t[0]))||TI[0])[0],1);if(lv>=45)add(a,'hueso',1)}
  else if(/^(ax_|pk_)/.test(o)){const wk=Object.keys(a[1]).find(k=>WO.some(w=>w[2]===k));if(wk){delete a[1][wk];a[1]['mn_'+WON[WO.findIndex(w=>w[2]===wk)]]=1}add(a,'cu_'+(TI.find(t=>o.endsWith(t[0]))||TI[0])[0],1)}}   // D-resto (26 oct): mango (Artesanía) y agarre de cuero curtido (Peletería); el tutorial (lv ≤ 3) queda intacto
 for(const a of ACT.pe||[]){if(a.length===6&&a[3]>3&&/^ar_/.test(String(a[2])))add(a,'lana',Math.ceil(a[3]/25))}
 for(const a of ACT.co||[]){if(a.length===6&&a[3]>3&&/^f_/.test(String(a[2])))add(a,'logs',1)}
 for(const a of ACT.cr||[]){if(a.length===6&&a[3]>3&&/^bw_/.test(String(a[2])))add(a,'pluma',1+Math.floor(a[3]/40))}}
let LOOPGO=false;const startLoop=()=>{if(LOOPGO)return;LOOPGO=true;last=performance.now();requestAnimationFrame(loop)};
async function bootRun(){
 applyInterlock();
 const el=$('#boot'),fill=$('#bt-fill'),msg=$('#bt-msg'),T0=performance.now(),late=()=>performance.now()-T0>20000;
 const pct=(p,m)=>{fill.style.width=Math.round(Math.max(0,Math.min(1,p))*100)+'%';if(m)msg.textContent=m};
 const frame=()=>new Promise(r=>{let d=0;const f=()=>{if(!d){d=1;r()}};requestAnimationFrame(f);setTimeout(f,80)});   // un fotograma real (deja pintar la barra); en pestaña oculta cae al temporizador
 try{
  pct(.01,'Cargando tipografías…');
  try{await Promise.race([Promise.all(['16px VT323','700 16px "Pixelify Sans"','500 16px Fredoka'].map(q=>document.fonts.load(q))),new Promise(r=>setTimeout(r,2500))])}catch(e){}
  pct(.06,'Preparando el terreno…');fitCv();ISO.snap(P.x,P.y,TER.standZ(P.x,P.y));await frame();
  if(window.R3D)R3D.dry=true;   /* FLUIDEZ F15: los dibujos de la carga son «en seco» hasta precompilar (ver r3d.js `dry`) */
  pct(.4,'Preparando el agua…');await frame();draw(performance.now());pct(.48);await frame();
  if(window.R3D&&R3D.props){pct(.48,'Levantando los edificios…');const PR=R3D.props;for(let i=0;i<600&&!late();i++){const f=PR.warm(45);pct(.48+.1*f);if(f>=1)break;await frame()}}   // R3D-FIX-CARGA: los props 3D se construyen por tramos entre fotogramas (antes: ~1 s de bloqueo)
  if(window.R3D&&R3D.warmShaders&&!/[?&]nowarm/.test(location.search)){pct(.6,'Preparando los shaders…');await R3D.warmShaders()}   // FREEZE-SHADERS
  if(window.R3D)R3D.dry=false;
  pct(.97,'¡Listo!');draw(performance.now());await frame();
 }catch(e){if(window.console)console.warn('[BOOT]',e)}
 if(window.R3D)R3D.dry=false;
 if(window.R3D&&R3D.props)R3D.props.constructor.DEFER=false;
 try{if(typeof HUDSU!=='undefined'&&HUDSU.warm)HUDSU.warm()}catch(e){}
 try{if(typeof ITEMICON!=='undefined'&&ITEMICON.url)['sw_bronce','ar_bronce','sh_bronce','lg_bronce','gl_bronce','ar_cu_bronce','ar_tu_bronce','ax_bronce','pk_bronce','b_bronce','fl_bronce','qv_bronce','cobre','pot_xp','carne','hueso'].forEach(i=>{if(I[i])ITEMICON.url(i)})}catch(e){}   // Lote ANTI-TIRONES (25 oct 2026): el renderer de ICONOS 3D (icons3d.js) se crea y compila sus shaders con el 1.er icono de cada tipo (armadura = un Mini entero): 215 ms medidos al abrir la mochila; ahora durante la carga
 if(window.R3D&&R3D.warmShaders&&!/[?&]nowarm/.test(location.search)){try{pct(.98,'Preparando los shaders…');if(R3D.gate)R3D.gate.on=true;R3D.dry=true;startLoop();const t0=performance.now();await new Promise(r=>setTimeout(r,700));while(performance.now()-t0<10000&&R3D.gate&&(R3D.gate.q.size||R3D.gate.wait.length))await new Promise(r=>setTimeout(r,100));R3D.gate.on=true;if(QA&&QL===2)R3D.gate.background(0,[{key:'scr',rt:null}])}catch(e){}R3D.dry=false}   /* FLUIDEZ F15: la 2.ª pasada de warmShaders (4,6 s medidos, 0 programas nuevos) ya no hace falta: lo que crea el bucle lo compila la compuerta; se espera a que acabe (máx. 10 s: en un PC sin caché de shaders una tanda tarda 3–5 s) */   /* FLUIDEZ F15: compuerta encendida y fotogramas en seco detrás de la pantalla de carga (el bucle crea actores/bosque; sus shaders se compilan en paralelo, sin esperas síncronas) */   // 21 oct 2026: lo que crea el bucle en los primeros segundos (actores, bosque cercano: ≈200 programas) se compilaba a los 2,5 s DE JUEGO y congelaba el primer movimiento: ahora el juego corre ya DETRÁS de la pantalla de carga y se compila antes de mostrarlo
 if(window.R3D&&R3D.warmShaders&&!/[?&]nowarm/.test(location.search)){const PI=R3D.renderer.info,base=PI.programs.length;let warned=0;const g0=R3D.gate?R3D.gate.stats.hechos:0;setInterval(()=>{const gm=R3D.gate?R3D.gate.stats.hechos-g0:0;if(PI.programs.length-gm>base+warned){warned=PI.programs.length-gm-base;console.info('[R3D] shaders compilados EN JUEGO (+'+warned+'): falta un material en warmShaders/warmObjs',PI.programs.slice(base).map(p=>p.name))}},4000)}   /* 21 oct 2026: las 3 pasadas tardías de warmShaders (2,5/9/20 s) NO añadían ningún programa (medido: nuevos 0) pero cada una recorría 4 veces los 17k objetos y congelaba ≈3 fotogramas de 115–220 ms: eliminadas; ahora solo se VIGILA si algo se compila en juego */   // FREEZE-SHADERS: lo que se crea tras la carga (recursos, actores…) también se compila de antemano, sin forzar visibilidad
 pct(1);startLoop();
 el.classList.add('out');setTimeout(()=>el.classList.add('off'),520)}
{const el=$('#boot'),skip=/[?&]noload\b/.test(location.search)||(navigator.webdriver&&!/[?&]load\b/.test(location.search));
 const go=()=>{if(!window.R3D){const b=$('#boot');if(b){b.innerHTML='<div style=\"margin:auto;max-width:28em;padding:2em;text-align:center;color:#e8cf94;font:16px Spectral,Georgia,serif\"><b>NotScape necesita WebGL 2</b><br><br>Activa la aceleración por hardware del navegador o prueba con otro (Chrome, Edge o Firefox actualizados).</div>';b.style.display='flex'}return}if(window.R3D){fitCv();ISO.snap(P.x,P.y,TER.standZ(P.x,P.y));for(let i=0;i<40&&R3D.preload()>0;i++);} if(skip||!el){if(el)el.classList.add('off');requestAnimationFrame(loop)}else{if(window.R3D&&R3D.props)R3D.props.constructor.DEFER=true;bootRun()}};
 if(window.R3D_READY)window.R3D_READY.then(go,go);else go()}   // R3D: espera al módulo de three (?r3d=1) y precarga los chunks a la vista

