
const BI=BIOMES.list; // datos por bioma de src/biomes.js (F3-B): n, lv, ic, g, w, sh + pal/dec, village, routes, res, mobs, music, rvc, bossResp, bossRunes
const $=s=>document.querySelector(s),R=(a,b)=>a+Math.floor(Math.random()*(b-a+1)),fmt=n=>Math.floor(n).toLocaleString('es');
const SK={wc:['Tala','🪓'],mi:['Minería','⛏️'],fi:['Pesca','🎣'],co:['Cocina','🔥'],sm:['Herrería','🔨'],cr:['Artesanía','🧵'],es:['Escultor','🪚'],ins:['Inscripción','📜'],mg:['Magia','✨'],ag:['Agilidad','👟'],cb:['Combate','⚔️'],ra:['Arquería','🏹']},SKL=Object.keys(SK);
// [nombre, emoji, valor, curación]
const I={logs:['Troncos','🪵',3],roble:['Troncos de roble','🪵',8],sauce:['Troncos de sauce','🌿',20],arce:['Troncos de arce','🍁',45],
cobre:['Mena de cobre','🟤',4],estano:['Mena de estaño','⚪',4],hierro:['Mena de hierro','🔩',15],carbon:['Carbón','⚫',30],mitril:['Mena de mitril','🔷',90],
camaron:['Camarones crudos','🦐',3],trucha:['Trucha cruda','🐟',15],salmon:['Salmón crudo','🍣',30],atun:['Atún crudo','🐠',55],
c_camaron:['Camarones','🍤',9,4],c_trucha:['Trucha','🍖',32,7],c_salmon:['Salmón','🥩',70,10],c_atun:['Atún','🍱',130,14],pan:['Pan','🍞',2,3],quemado:['Pescado quemado','💀',0],
b_bronce:['Barra de bronce','🟧',20],b_hierro:['Barra de hierro','⬜',45],b_acero:['Barra de acero','⬛',100],b_mitril:['Barra de mitril','🟦',280],
sw_bronce:['Espada de bronce','🗡️',90],sw_hierro:['Espada de hierro','🗡️',200],sw_acero:['Espada de acero','⚔️',450],sw_mitril:['Espada de mitril','⚔️',1000],
cuero:['Cuero','🟫',8],hueso:['Hueso','🦴',5],
nido:['Nido de pájaro','🪺',500],gema:['Gema sin cortar','💎',400],perla:['Perla gigante','🫧',600],
corona:['Corona de goblin','👑',900],antifaz:['Antifaz de bandido','🎭',1400],sombrero:['Sombrero de bruja','🎩',4000],maza_hielo:['Maza de hielo','🔨',7000],shuriken:['Shuriken dorado','⭐',12000],nucleo:['Núcleo de magma','🔥',30000],colmillo:['Colmillo de lobo','🦷',700],calavera:['Calavera antigua','☠️',1500],garrote:['Garrote de ogro','🏏',3000]};
Object.assign(I,{tejo:['Troncos de tejo','🌲',90],adam:['Adamantita','🟢',160],pmagma:['Pez magma crudo','🐡',110],c_magma:['Pez magma','🍲',260,20],b_adam:['Barra de adamantita','🟩',520],sw_adam:['Espada de adamantita','🔱',2400],
ar_cuero:['Armadura de cuero','🦺',60],ar_bronce:['Peto de bronce','🛡️',140],ar_hierro:['Peto de hierro','🛡️',320],ar_acero:['Peto de acero','🛡️',720],ar_mitril:['Peto de mitril','🛡️',1600],ar_adam:['Peto de adamantita','🛡️',4200],gema_p:['Gema pulida','💠',1200],cuerno:['Cuerno de demonio','😈',6000]});
Object.assign(I,{pot_xp:['Poción de sabiduría','🧪',60],pot_dmg:['Poción de fuerza','⚗️',50],pot_spd:['Poción de rapidez','💨',40]});
Object.assign(I,{carne:['Carne cruda','🥩',6],pollo:['Pollo crudo','🍗',5],huevo:['Huevo','🥚',3],pluma:['Pluma','🪶',2],grasa:['Manteca','🧈',8],carne_jab:['Carne de jabalí','🐗',18],ancas:['Ancas de rana','🐸',30],carne_yak:['Carne de yak','🦬',45],carne_lag:['Carne de lagarto de lava','🦎',80],
c_carne:['Carne asada','🍖',12,5],c_pollo:['Pollo asado','🍗',12,6],f_camaron:['Camarones fritos','🍤',24,8],f_hamb:['Hamburguesa','🍔',30,11],f_trucha:['Trucha frita','🍳',60,14],f_estofado:['Estofado de jabalí','🍲',90,20],f_salmon:['Salmón gourmet','🍱',130,22,10],f_guiso:['Guiso de ancas','🥘',150,26,14],f_yak:['Filete de yak','🥓',200,34,18],f_lagarto:['Parrilla de lagarto','🍛',380,48,30]});
const POT={pot_xp:'xp',pot_dmg:'dmg',pot_spd:'spd'},cap=()=>28+(S.bagU||0)*4;
const SHOP=[['pan',10,'Cura 3 PV'],['pot_xp',200,'+50% de XP durante 3 min'],['pot_dmg',150,'Fuerza +3 (más 10% de tu nivel) durante 3 min'],['pot_spd',100,'+35% de velocidad durante 3 min'],['pot_mana',90,'Restaura 8 de maná'],['pot_mana2',300,'Restaura 25 de maná']];
const UP=[['bagU','🎒 Mochila','+4 espacios de inventario',[300,800,2000,5000,12000,28000]],['merc','💰 Contrato mercantil','+10% al vender objetos a Ru',[600,1800,5000,13000,32000]],['wis','📖 Libro de sabiduría','+5% de XP en todas las skills',[500,1500,4000,10000,25000,60000]],
['luck','🍀 Amuleto de suerte','+25% de drops raros y de botín',[1000,3000,8000,20000,50000]],['crf','🔨 Mano de maestro','+12% de probabilidad de calidad superior al fabricar',[1000,3500,10000,28000,70000]],['hv','🌾 Cosecha abundante','+4% de recolectar doble',[900,3000,9000,25000,60000]],
['trv','👢 Botas de viajero','+5% de velocidad de movimiento',[400,1200,3500,9000,22000]],['vig','❤️ Vigor','+5 de vida máxima',[500,1500,4000,10000,25000,60000]],['dfs','🛡️ Piel curtida','+1 de defensa',[1200,4000,11000,28000,70000]],
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
const MANAP={pot_mana:8,pot_mana2:25};
const RAR=[['Común','#ffffff'],['Poco común','#3fd04a'],['Raro','#4a90ff'],['Épico','#b04aff'],['Legendario','#ff8000']],LS={w:['Arma','⚔️'],c:['Capa','🧣'],s:['Escudo','🛡️'],l:['Pantalones','👖'],g:['Guantes','🧤'],m:['Munición','🏹'],h:['Casco','🪖'],f:['Botas','👢'],r:['Anillo','💍'],n:['Amuleto','📿']},LK=['h','f','r','n','c','s','l','g','m'];
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
LK.forEach(sl=>{for(let k=0;k<BIOMES.N;k++)for(let q=1;q<=3;q++){const m=[0,1,1.6,2.6][q],id='lt_'+k+sl+q,st={};
 if(sl==='h')st.def=Math.max(1,Math.round((1+1.2*k)*m));else if(sl==='f')st.def=Math.max(1,Math.round((.8+k)*m));
 else if(sl==='r'){st.str=Math.max(1,sf((6+8*k)*m));st.acc=Math.max(1,Math.round((1+k)*m))}else if(sl==='c'){st.def=Math.max(1,Math.round((.5+.6*k)*m));st.hp=Math.max(1,Math.round((1+k)*m))}else if(sl==='s')st.def=Math.max(1,Math.round((1.4+1.5*k)*m));else if(sl==='l')st.def=Math.max(1,Math.round((1.1+1.2*k)*m));else if(sl==='g'){st.acc=Math.max(1,Math.round((1+k)*m));st.str=Math.max(1,sf((3+4*k)*m))}else if(sl==='m')st.str=Math.max(1,sf((4+6*k)*m));else{st.mana=Math.max(1,Math.round((1+1.5*k)*m));st.mreg=Math.max(1,Math.round(.004*(1+k)*m/MRU));st.hp=Math.max(1,Math.round((1+k)*m))}
 const pa=q>=2?[{id:PM[sl][k],v:PS[PM[sl][k]].b*(1+.25*k)*(q===3?1.8:1)}]:null;if(q===3)pa.push({id:'savant',v:5*(1+.25*k)});
 LOOT[id]={s:sl,r:q,k,st,pa};I[id]=[LN[sl][k][q-1],LS[sl][1],[0,60,300,2500][q]*(k+1)]}});
Object.assign(LOOT,{lg_ring:{s:'r',r:4,k:5,st:{str:5,acc:10},pa:[{id:'exec',v:70},{id:'life',v:12},{id:'double',v:8}]},lg_helm:{s:'h',r:4,k:5,st:{def:10,hp:15},pa:[{id:'last',v:50},{id:'stone',v:3},{id:'savant',v:12}]},
 lg_boots:{s:'f',r:4,k:5,st:{def:8,hp:10},pa:[{id:'swift',v:20},{id:'thorns',v:40}]},lg_amulet:{s:'n',r:4,k:5,st:{mana:30,mreg:10,hp:20},pa:[{id:'echo',v:25},{id:'siph',v:3}]}});
Object.assign(I,{lg_ring:['Sello del Cazademonios','💍',20000],lg_helm:['Corona del Rey Caído','🪖',20000],lg_boots:['Botas del Caminante del Alba','👢',20000],lg_amulet:['Corazón del Titán','📿',20000]});
// [id, nombre, receta de barra, nv barra, nv equipo, fuerza espada, precisión espada, fuerza arco, precisión arco, defensa peto, XP barra, ms barra]
const TI=[['cobre','cobre',{cobre:1},1,1,33,1,26,1,1,13,2200],['estano','estaño',{estano:1},4,5,40,2,31,2,2,18,2300],['bronce','bronce',{cobre:1,estano:1},8,10,45,3,35,3,3,26,2400],['hierro','hierro',{hierro:1},13,16,58,4,46,4,4,45,2600],
['acero','acero',{hierro:1,carbon:1},22,26,72,6,58,6,6,70,3000],['plata','plata',{plata:1},32,36,86,7,69,7,8,95,3200],['mitril','mitril',{mitril:1,carbon:2},44,48,100,9,80,8,10,115,3400],['adam','adamantita',{adam:1,carbon:2},58,62,120,13,96,10,14,165,3800],
['runita','runita',{runita:1,carbon:2},70,74,140,16,108,12,18,215,4000],['oricalco','oricalco',{oricalco:1,carbon:3},79,84,162,20,122,14,23,270,4200],['celestita','celestita',{celestita:1,carbon:3},88,94,188,25,138,17,29,340,4400]],TNM=TI.map(t=>t[0]);TI.forEach(t=>{t[7]=Math.round(.92*(64+t[5])-64)}); // arco ≈ 92 % de la fuerza de la espada del mismo tier (la ventaja del arco es el alcance)
// [id, nombre, objeto de tronco, nivel]: el taller de Escultor se rige por la madera
const WO=[['pino','pino','logs',1],['abedul','abedul','abedul',5],['roble','roble','roble',10],['fresno','fresno','fresno',16],['sauce','sauce','sauce',26],['arce','arce','arce',36],['tejo','tejo','tejo',48],['ebano','ébano','ebano',62],['caoba','caoba','caoba',74],['baobab','baobab','baobab',84],['mundo','Árbol del Mundo','mundo',94]],WON=WO.map(w=>w[0]),TOOLT={};
for(const o of [SW,BOW,STF,AR,SB,WB])for(const k in o)delete o[k];AR.ar_cuero=1;
{const SV=[40,60,90,200,450,700,1000,2400,4600,8200,14000],AV=[70,100,140,320,720,1100,1600,4200,8000,14500,25000],BV=[8,10,20,45,100,190,280,520,900,1500,2400],STV8=[1,2,3,4,5,6,7,8,9,10,11],TV=[30,45,70,150,330,520,760,1800,3400,6000,10000];
 TI.forEach((t,i)=>{const id=t[0],nm=t[1],wn=WON[i],wnm=WO[i][1];SW['sw_'+id]=t[6];SB['sw_'+id]=sf(t[5]);BOW['bw_'+wn]=t[8];SB['bw_'+wn]=sf(t[7]);STF['st_'+wn]=STV8[i];AR['ar_'+id]=t[9];SHL['sh_'+id]=Math.max(1,Math.round(t[9]*.55));LGL['lg_'+id]=Math.max(1,Math.round(t[9]*.7));GLL['gl_'+id]=Math.max(1,Math.round(t[9]*.3));
  I['b_'+id]=['Barra de '+nm,'🟧',BV[i]];I['sw_'+id]=['Espada de '+nm,'🗡️',SV[i]];I['ar_'+id]=['Peto de '+nm,'🛡️',AV[i]];I['sh_'+id]=['Escudo de '+nm,'🛡️',Math.round(AV[i]*.5)];I['lg_'+id]=['Pantalones de '+nm,'👖',Math.round(AV[i]*.6)];I['gl_'+id]=['Guantes de '+nm,'🧤',Math.round(AV[i]*.25)];I['bw_'+wn]=['Arco de '+wnm,'🏹',Math.round(SV[i]*1.6)];I['st_'+wn]=['Bastón de '+wnm,'🪄',Math.round(SV[i]*1.8)];
  I['ax_'+id]=['Hacha de '+nm,'🪓',TV[i]];I['pk_'+id]=['Pico de '+nm,'⛏️',TV[i]];I['rd_'+wn]=['Caña de '+wnm,'🎣',Math.round(TV[i]*.8)];
  TOOLT['ax_'+id]={k:'wc',t:i+1};TOOLT['pk_'+id]={k:'mi',t:i+1};TOOLT['rd_'+wn]={k:'fi',t:i+1}});
 Object.assign(WB,SW,BOW,STF);I.plata=['Mena de plata','⚪',60];
 Object.assign(I,{caoba:['Troncos de caoba','🪵',260],baobab:['Troncos de baobab','🌳',420],mundo:['Troncos del Árbol del Mundo','🌳',700],runita:['Mena de runita','🔹',240],oricalco:['Mena de oricalco','🔸',380],celestita:['Mena de celestita','💠',600],pezespada:['Pez espada crudo','🐟',150],manta:['Mantarraya cruda','🐟',210],kraken:['Kraken joven crudo','🦑',300],c_pezespada:['Pez espada asado','🍲',330,56],c_manta:['Mantarraya asada','🍲',420,70],c_kraken:['Kraken asado','🍲',560,90],carne_oso:['Carne de oso','🥩',40],hongo:['Hongos del pantano','🍄',30],carne_gig:['Costillar de gigante','🍖',90],arroz:['Arroz','🍚',60],sal_vol:['Sal volcánica','🧂',120],f_oso:['Estofado de oso','🍲',110,24],f_sopa:['Sopa de la bruja','🍵',150,32,6],f_gig:['Costillar asado','🍖',230,42],f_sushi:['Sushi de atún','🍣',300,52,8],f_pespsal:['Pez espada con sal','🐟',420,64,10],f_festin:['Festín de mantarraya','🍱',640,82,15],f_banquete:['Banquete del Kraken','🍽️',900,105,25],logs:['Troncos de pino','🪵',3],abedul:['Troncos de abedul','🪵',5],fresno:['Troncos de fresno','🪵',13],ebano:['Troncos de ébano','🪵',160],sardina:['Sardinas crudas','🐟',5],arenque:['Arenques crudos','🐟',9],lucio:['Lucio crudo','🐟',40],c_sardina:['Sardinas','🐟',14,5],c_arenque:['Arenque','🐟',22,6],c_lucio:['Lucio','🐟',80,12]})}
// pergaminos de Inscripción: un hechizo de un solo uso sin maná ni runas
const SCI={};[['spark','Chispa'],['heal','Curación'],['stone','Piedra'],['haste','Prisa'],['skin','Piel de piedra'],['wave','Ola'],['recall','Regreso'],['wis','Sabiduría'],['fire','Llamarada'],['arcane','Explosión arcana'],['storm','Tormenta'],['gheal','Curación mayor'],['vortex','Vórtice'],['cata','Cataclismo']].forEach(([id,n],i)=>{SCI['sc_'+id]=i;I['sc_'+id]=['Pergamino de '+n,'📜',[15,40,50,60,80,110,160,220,320,500,800,1000,1500,2500][i]]});
RVC.forEach((c,k)=>{I['rv_'+k]=['Runa de viaje a '+['la Pradera','el Bosque','el Pantano','las Cumbres','el Oriental','el Volcán'][k],'🌀',150]});
const WSP={},EQK=['h','f','r','r2','n','w','c','s','l','g','m'],rr=id=>LOOT[id]?LOOT[id].r:(id&&id.includes('~')?+id.split('~')[1]:0);
Object.keys(SW).forEach(k=>WSP[k]=4);Object.keys(BOW).forEach(k=>WSP[k]=4);Object.keys(STF).forEach(k=>WSP[k]=5);
{const SSB=[58,78,100,125,152,190],BSB=[48,67,91,115,140,175],SAC=[4,7,10,14,19,26],BAC=[3,6,9,12,15,18],STV=[2,4,6,8,10,12],PW={d:['bleed','double'],m:['crit','exec'],b:['stun','life'],c:['echo','siph']},
 LE=[['de cobre','de hierro','de hueso','de escarcha','de laca','de obsidiana'],['del Vigía','del Lobo Gris','del Sepulturero','del Yeti','del Kitsune','del Dragón Menor'],['de la Pradera Dorada','del Rey Verde','del Señor del Pantano','de Hielo Eterno','del Oni Rojo','del Abismo Ardiente']];
 [['d','Daga','m',3,.92,2],['m','Mandoble','m',6,.92,-2],['b','Ballesta','r',5,.92,1],['c','Cetro','g',4,0,0]].forEach(([a,nm,ty,tk,tg,ac])=>{for(let k=0;k<BIOMES.N;k++)for(let q=1;q<=3;q++){const id='lw_'+k+a+q,m=[0,1.03,1.08,1.15][q],st={};let pa=null;
  if(ty==='m'){SB[id]=sf(Math.max(0,Math.round(tg*(64+SSB[k])*(tk/4)*m-64)));SW[id]=Math.max(1,SAC[k]+ac);WB[id]=SW[id]}
  else if(ty==='r'){SB[id]=sf(Math.max(0,Math.round(tg*(64+BSB[k])*(tk/4)*m-64)));BOW[id]=Math.max(1,BAC[k]+ac);WB[id]=BOW[id]}
  else{STF[id]=Math.max(1,Math.round(STV[k]*.7+q*.5));WB[id]=STF[id];st.mana=Math.round((1+k)*q*1.5);st.mreg=Math.max(1,Math.round(.003*(1+k)*q/MRU))}
  WSP[id]=tk;if(q>=2){const p1=PW[a][0],p2=PW[a][1];pa=[{id:p1,v:PS[p1].b*(1+.25*k)*(q===3?1.8:1)}];if(q===3)pa.push({id:p2,v:PS[p2].b*(1+.25*k)})}
  LOOT[id]={s:'w',r:q,k,st,pa};I[id]=[nm+' '+LE[q-1][k],{d:'🗡️',m:'⚔️',b:'🏹',c:'🪄'}[a],[0,80,400,3000][q]*(k+1)]}})}
{const FR=[0,.3,.55,.85],TL=pre=>/^(bw_|st_|rd_)$/.test(pre)?WON:TNM,
 bump=(tbl,pre,id,q,d)=>{const L2=TL(pre),i=L2.indexOf(id.slice(pre.length)),v=tbl[id],nx=id==='ar_cuero'?tbl.ar_cobre:(i>=0&&i+1<L2.length?tbl[pre+L2[i+1]]:v*1.15);return +(v+(nx-v)*FR[q]).toFixed(d)};
 [...Object.keys(SW),...Object.keys(BOW),...Object.keys(STF),...Object.keys(AR),...Object.keys(TOOLT)].concat(Object.keys(SHL),Object.keys(LGL),Object.keys(GLL)).filter(k=>!k.includes('~')&&!LOOT[k]).forEach(id=>{for(let q=1;q<=3;q++){const v=id+'~'+q;I[v]=[I[id][0],I[id][1],Math.round(I[id][2]*[1,1.4,2.2,4][q])];
  if(SW[id]){SW[v]=bump(SW,'sw_',id,q,1);SB[v]=bump(SB,'sw_',id,q,1);WSP[v]=4;WB[v]=SW[v]}else if(BOW[id]){BOW[v]=bump(BOW,'bw_',id,q,1);SB[v]=bump(SB,'bw_',id,q,1);WSP[v]=4;WB[v]=BOW[v]}
  else if(STF[id]){STF[v]=bump(STF,'st_',id,q,1);WSP[v]=5;WB[v]=STF[v]}else if(AR[id])AR[v]=bump(AR,'ar_',id,q,1);else if(SHL[id])SHL[v]=bump(SHL,'sh_',id,q,1);else if(LGL[id])LGL[v]=bump(LGL,'lg_',id,q,1);else if(GLL[id])GLL[v]=bump(GLL,'gl_',id,q,1);
  else if(TOOLT[id]){const T=TOOLT[id],P2={wc:['frenzy','gsage'],mi:['precise','lucky'],fi:['lucky','frenzy']}[T.k],pa=q>=2?[{id:P2[0],v:PS[P2[0]].b*(1+.1*T.t)*(q===3?1.5:1)}]:null;if(q===3)pa.push({id:P2[1],v:PS[P2[1]].b*(1+.1*T.t)*.8});TOOLT[v]={k:T.k,t:T.t,bq:FR[q],pa}}}})}
function qv(id,sk){if(LOOT[id]||!(SW[id]||BOW[id]||STF[id]||AR[id]||SHL[id]||LGL[id]||GLL[id]||TOOLT[id]))return id;const l=L(sk),g=Math.min(.25,.04+l*.0035),b=l<20?0:Math.min(.07,.01+(l-20)*.0015),e=l<40?0:Math.min(.01,.0015+(l-40)*.00015),r=Math.random()/(1+.12*S.crf),q=r<e?3:r<e+b?2:r<e+b+g?1:0;return q?id+'~'+q:id}
function gs(k){let t=0;for(const sl of EQK){const it=LOOT[S.eq[sl]];if(it&&it.st[k])t+=it.st[k]}return t}
function pv(id){let t=0;for(const sl of EQK){const it=LOOT[S.eq[sl]];if(it&&it.pa)it.pa.forEach(p=>{if(p.id===id)t+=p.v})}return t}
// equipo visible en el sprite: escudo, piernas, guantes, peto (hombreras), yelmo (tier→cimera) y arma a la espalda
function gearOpts(){const q=S.eq,w=q.w,t=w?wtype():null,k=id=>id?ARC(id):null;return{sh:k(q.s),lg:k(q.l),gl:k(q.g),pl:q.a?1:0,cp:k(q.c),ht:q.h?(LOOT[q.h]?(LOOT[q.h].r>=3?'mitril':LOOT[q.h].r===2?'acero':''):tierOf(q.h)):'',wp:w?{t:t==='r'?'bow':t==='g'?'staff':'sword',wk:wKind(),col:t==='g'?(ORB[tierOf(w)]||'#9cf'):wColor()}:null,two:wKind()==='great'?1:0}}
function wtype(){const w=S.eq.w;return !w||SW[w]?'m':BOW[w]?'r':'g'}
// forma del arma para la animación (lote G1, oct 2026): 'sword' (sw_*, una mano), 'dagger' (lw_*d), 'great' (lw_*m mandoble, DOS manos), 'xbow' (lw_*b ballesta), 'scepter' (lw_*c cetro), 'bow', 'staff'
function wKind(){const w=S.eq.w;if(!w)return null;const m=/^lw_\d+([dmbc])/.exec(w);if(m)return{d:'dagger',m:'great',b:'xbow',c:'scepter'}[m[1]];const t=wtype();return t==='r'?'bow':t==='g'?'staff':'sword'}
function accFor(sk,b,m){return Math.max(.08,Math.min(.95,.6+.03*(L(sk)-m.lv)+.004*b))}
// estilos de combate (oct 2026): espada/puños → Combate · arco → Arquería · bastón → Magia. Vida, defensa y agresividad usan el MEJOR de los tres (CBL)
const WSK=()=>wtype()==='g'?'mg':wtype()==='r'?'ra':'cb',CBL=()=>Math.max(L('cb'),L('ra'),L('mg'));
function monAcc(m){return Math.max(.12,Math.min(.9,.5+.03*(m.lv-CBL())-ab()*.006))}
function hitChance(m){return accFor(WSK(),wb()+gs('acc'),m)}
function spAcc(m){return Math.max(.25,Math.min(.97,.8+.03*(L('mg')-m.lv)))}
function atkMs(){return Math.max(900,Math.round((WSP[S.eq.w]||(wtype()==='g'?5:4))*600*(1-Math.min(.5,pv('haste')/100))))}
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
const TOOLS={wc:['Hacha','🪓'],mi:['Pico','⛏️'],fi:['Caña','🎣']},TN=['de madera','de bronce','de hierro','de acero','de mitril','de adamantita'],TM=[1.3,1,.8,.62,.48,.36];
const TNF=['de bambú','de pino','de roble','de sauce','de arce','de tejo'],tn=(k,t)=>(k==='fi'?TNF:TN)[t];
{const BR=['','b_bronce','b_hierro','b_acero','b_mitril','b_adam'],WD=['','logs','roble','sauce','arce','tejo'],LV=[0,1,17,32,47,62];
 for(const k of['wc','mi'])for(let t=1;t<6;t++)ACT.sm.push([TOOLS[k][0]+' '+TN[t],{[BR[t]]:2,[WD[t]]:1},'tl:'+k+':'+t,LV[t],40+t*40,2800+t*500]);
 const SL=[5,20,35,50,62],BN=['pino','roble','sauce','arce','tejo'];ACT.es=[];
 for(let t=1;t<6;t++)ACT.es.push(['Caña '+TNF[t],{[WD[t]]:3,cuero:Math.ceil(t/2)},'tl:fi:'+t,LV[t],35+t*35,2600+t*400]);
 for(let t=0;t<5;t++){ACT.es.push(['Arco de '+BN[t],{[WD[t+1]]:3,cuero:2+t},'bw_'+BN[t],SL[t],60+t*60,3200+t*500]);ACT.es.push(['Bastón de '+BN[t],{[WD[t+1]]:2,[BR[t+1]]:1},'st_'+BN[t],SL[t]+3,70+t*70,3400+t*500])}}
TN.length=0;TN.push('de madera',...TI.map(t=>'de '+t[1]));TNF.length=0;TNF.push('de bambú',...WO.map(w=>'de '+w[1]));TM.length=0;for(let i=0;i<9;i++)TM.push(1);
// ── XP v2 (oct 2026): TODAS las skills llegan a 99. XPR(l) = XP/s objetivo al entrenar a nivel l; gxp/pxp derivan el XP por acción de la duración real (dur/hitAmt) para que el ritmo no dependa del número de golpes.
//   Horas objetivo (solo esa skill, mejor acción disponible): nv30 ≈0,4 h · 50 ≈1,8 · 60 ≈3,2 · 70 ≈8 · 80 ≈17 · 90 ≈33 · 99 ≈60. Se mide con /home/claude/work/meas2.py (ver AGENTS.md).
const XPA=[[1,8],[15,9],[30,13],[40,16],[50,24],[60,30],[70,32],[80,48],[90,70],[99,90]],XPR=l=>{if(l<=1)return XPA[0][1];for(let i=1;i<XPA.length;i++)if(l<=XPA[i][0]){const a=XPA[i-1],b=XPA[i];return a[1]+(b[1]-a[1])*(l-a[0])/(b[0]-a[0])}return XPA[XPA.length-1][1]};
const TLV=lv=>TI.filter(t=>t[4]<=lv).length,GPER=[3,3,3,2,2,2,1,1,1,1,1,1];
const gxp=lv=>{const tl=TLV(lv),L1=lv+6,amt=Math.min(1,(1+L1*.01)/3);return Math.max(4,Math.round(XPR(lv)*GPER[tl]*600*Math.ceil(1/amt)/1000))},
 pxp=(lv,ms)=>{const amt=Math.min(1,(900/ms)*(1+(lv+6)*.006));return Math.max(4,Math.round(1.1*XPR(lv)*900*Math.ceil(1/amt)/1000))};
ACT.wc=[['Pino','logs',1],['Abedul','abedul',5],['Roble','roble',10],['Fresno','fresno',16],['Sauce','sauce',26],['Arce','arce',36],['Tejo','tejo',48],['Ébano','ebano',62],['Caoba','caoba',74],['Baobab','baobab',84],['Árbol del Mundo','mundo',94]].map(a=>[a[0],a[1],a[2],gxp(a[2]),3000+a[2]*25]);
ACT.fi=[['Camarones','camaron',1],['Sardinas','sardina',5],['Arenques','arenque',10],['Truchas','trucha',15],['Salmones','salmon',30],['Lucios','lucio',38],['Atunes','atun',45],['Pez magma','pmagma',60],['Pez espada','pezespada',72],['Mantarraya','manta',82],['Kraken joven','kraken',92]].map(a=>[a[0],a[1],a[2],gxp(a[2]),3000+a[2]*25]);
ACT.mi=[['Cobre','cobre',1],['Estaño','estano',1],['Hierro','hierro',12],['Carbón','carbon',22],['Plata','plata',32],['Mitril','mitril',44],['Adamantita','adam',58],['Runita','runita',70],['Oricalco','oricalco',79],['Celestita','celestita',88]].map(a=>[a[0],a[1],a[2],Math.round(gxp(a[2])*(a[1]==='carbon'?.7:1)),3000+a[2]*30]);
{const HW=['logs','logs','logs','roble','roble','sauce','arce','tejo','ebano','caoba','baobab'],CL=[1,1,1,2,2,2,3,3,3,4,4],AL=[1,7,12,18,28,38,50,64,76,86,95],SLV=[1,8,10,15,20,25,30,40,45,60,70,75,85,99];ACT.sm=[];ACT.cr=[];ACT.es=[];ACT.ins=[];
 TI.forEach((t,i)=>{const id=t[0],nm=t[1],b='b_'+id,il=t[4],wd=WO[i][2],wn=WON[i],wc=3+Math.floor(i/3),E=(lv,ms)=>pxp(lv,ms);
  ACT.sm.push(['Barra de '+nm,t[2],b,t[3],E(t[3],t[11]),t[11]],['Espada de '+nm,{[b]:2},'sw_'+id,il,E(il,3000+il*45),3000+il*45],['Hacha de '+nm,{[b]:2,[HW[i]]:1},'ax_'+id,il,E(il,2800+il*40),2800+il*40],['Pico de '+nm,{[b]:2,[HW[i]]:1},'pk_'+id,il,E(il,2800+il*40),2800+il*40]);
  ACT.cr.push(['Peto de '+nm,{[b]:3,cuero:CL[i]},'ar_'+id,AL[i],E(AL[i],2800+AL[i]*35),2800+AL[i]*35],['Pantalones de '+nm,{[b]:2,cuero:CL[i]},'lg_'+id,AL[i],E(AL[i],2600+AL[i]*32),2600+AL[i]*32],['Guantes de '+nm,{[b]:1,cuero:CL[i]},'gl_'+id,AL[i],E(AL[i],2200+AL[i]*28),2200+AL[i]*28]);ACT.sm.push(['Escudo de '+nm,{[b]:3},'sh_'+id,il,E(il,3000+il*45),3000+il*45]);
  ACT.es.push(['Arco de '+WO[i][1],{[wd]:wc,cuero:1+Math.ceil((i+1)/3)},'bw_'+wn,il,E(il,3200+il*45),3200+il*45],['Bastón de '+WO[i][1],{[wd]:wc,hueso:2},'st_'+wn,il,E(il,3400+il*45),3400+il*45],['Caña de '+WO[i][1],{[wd]:wc,cuero:Math.ceil((i+1)/2)},'rd_'+wn,il,E(il,2600+il*35),2600+il*35])});
 ACT.cr.unshift(['Armadura de cuero',{cuero:4},'ar_cuero',1,pxp(1,2600),2600]);ACT.cr.push(['Pulir gema',{gema:1},'gema_p',20,pxp(20,2400),2400]);
 const SR=[{pluma:1,huevo:1},{pluma:1,grasa:1},{hueso:2,huevo:1},{pluma:2,huevo:1},{hueso:3,cuero:1},{ancas:2,pluma:1},{cuero:1,grasa:1,pluma:2},{cuero:2,huevo:2,pluma:2},{carne_yak:1,pluma:2},{hueso:4,cuero:2,pluma:3},{hongo:2,pluma:3,cuero:2},{hongo:3,carne_gig:1,pluma:2},{arroz:2,pluma:4,hueso:4},{sal_vol:3,pluma:6,hueso:6,cuero:3}];
 ['spark','heal','stone','haste','skin','wave','recall','wis','fire','arcane','storm','gheal','vortex','cata'].forEach((id,i)=>ACT.ins.push([I['sc_'+id][0],SR[i],'sc_'+id,SLV[i],pxp(SLV[i],2400+SLV[i]*20),2400+SLV[i]*20]));
 // cocina v2: platos hasta nv. 96 (curan hasta ~100 PV: la vida máxima llega a ~210). [nombre, ingredientes, id, nivel, ms]
 ACT.co=[['Carne asada',{carne:1},'c_carne',1,2000],['Camarones',{camaron:1},'c_camaron',1,2000],['Camarones fritos',{camaron:1,grasa:1},'f_camaron',2,2200],['Pollo asado',{pollo:1},'c_pollo',5,2000],['Sardinas',{sardina:1},'c_sardina',5,2100],['Tortilla de huevo',{huevo:2},'f_tortilla',6,2200],
  ['Hamburguesa',{carne:1,huevo:1},'f_hamb',10,2400],['Arenques',{arenque:1},'c_arenque',10,2200],['Trucha',{trucha:1},'c_trucha',15,2200],['Trucha frita',{trucha:1,grasa:1},'f_trucha',18,2400],['Estofado de jabalí',{carne_jab:1,grasa:1},'f_estofado',22,2600],['Estofado de oso',{carne_oso:1,grasa:1},'f_oso',27,2600],
  ['Salmón',{salmon:1},'c_salmon',30,2400],['Salmón gourmet',{salmon:1,grasa:1,huevo:1},'f_salmon',33,2600],['Guiso de ancas',{ancas:2,grasa:1},'f_guiso',35,2800],['Lucio',{lucio:1},'c_lucio',38,2500],['Sopa de la bruja',{hongo:2,ancas:1},'f_sopa',41,2800],['Atún',{atun:1},'c_atun',45,2600],
  ['Filete de yak',{carne_yak:1,grasa:1},'f_yak',48,2800],['Costillar de gigante',{carne_gig:1,grasa:1},'f_gig',54,3000],['Pez magma',{pmagma:1},'c_magma',60,2800],['Parrilla de lagarto',{carne_lag:1,pmagma:1},'f_lagarto',62,3000],['Sushi de atún',{atun:1,arroz:1},'f_sushi',67,3000],
  ['Pez espada',{pezespada:1},'c_pezespada',72,3000],['Pez espada con sal',{pezespada:1,sal_vol:1},'f_pespsal',77,3200],['Mantarraya',{manta:1},'c_manta',82,3200],['Festín de mantarraya',{manta:1,sal_vol:1,arroz:1},'f_festin',88,3400],['Kraken asado',{kraken:1},'c_kraken',92,3400],['Banquete del Kraken',{kraken:1,sal_vol:2,grasa:1},'f_banquete',96,3600]].map(a=>[a[0],a[1],a[2],a[3],pxp(a[3],a[4]),a[4]]);
 [ACT.sm,ACT.cr,ACT.es,ACT.co].forEach(a=>a.sort((x,y)=>rq(x)-rq(y)))}
const MD={goblin:{n:'Goblin',lv:4,hp:10,dmg:3,ag:1,as:2400,c:'#5ab04a',w:12,h:14,co:[2,10],dr:[['cuero',.16],['hueso',.75]],rare:['corona',64]},
lobo:{n:'Lobo',lv:12,hp:24,dmg:5,ag:1,as:1800,c:'#8a8a9a',w:18,h:12,co:[8,30],dr:[['cuero',.3],['hueso',.75]],rare:['colmillo',80]},
esqueleto:{n:'Esqueleto',lv:28,hp:42,dmg:8,ag:1,as:2400,c:'#e8e8d8',w:12,h:20,co:[30,90],dr:[['hueso',.75]],rare:['calavera',96]},
ogro:{n:'Ogro',lv:44,hp:78,dmg:13,ag:1,as:3000,c:'#a0703a',w:22,h:28,co:[100,300],dr:[['cuero',.4],['hueso',.75]],rare:['garrote',112]},
oni:{n:'Oni',lv:58,hp:100,dmg:15,ag:1,as:2400,c:'#b8403a',w:22,h:30,co:[200,500],dr:[['cuero',.4],['hueso',.75]],rare:['cuerno',120]},
zorro:{n:'Zorro espíritu',lv:50,hp:58,dmg:9,as:2400,c:'#e8a05a',w:16,h:12,co:[60,160],dr:[['carne',.75],['pluma',.3],['cuero',.3]]},
demonio:{n:'Demonio',lv:70,hp:125,dmg:19,ag:1,as:2400,c:'#c02a2a',w:22,h:30,co:[300,800],dr:[['cuero',.4],['hueso',.75]],rare:['cuerno',120]},
vaca:{n:'Vaca',lv:2,hp:8,dmg:1,as:3000,c:'#f0f0f0',w:20,h:14,co:[1,4],dr:[['carne',.75],['cuero',.3],['grasa',.22]]},
gallina:{n:'Gallina',lv:1,hp:3,dmg:0,as:2400,c:'#e8d8a8',w:10,h:10,co:[0,2],dr:[['pollo',.75],['huevo',.3],['pluma',.22]]},
jabali:{n:'Jabalí',lv:8,hp:18,dmg:3,as:2400,c:'#6a4a3a',w:18,h:13,co:[5,15],dr:[['carne_jab',.75],['cuero',.22],['grasa',.16]]},
rana:{n:'Rana gigante',lv:20,hp:30,dmg:5,as:2400,c:'#6aaa3a',w:16,h:12,co:[15,40],dr:[['ancas',.75],['grasa',.22]]},
yak:{n:'Yak',lv:34,hp:50,dmg:8,as:3000,c:'#4a3a2a',w:24,h:18,co:[40,100],dr:[['carne_yak',.75],['cuero',.4],['grasa',.3]]},
lagarto:{n:'Lagarto de lava',lv:62,hp:70,dmg:11,as:2400,c:'#d8702a',w:22,h:12,co:[100,250],dr:[['carne_lag',.75],['grasa',.3],['hueso',.22]]},
orco:{n:'Orco',lv:10,hp:26,dmg:5,ag:1,as:2400,c:'#4a7a3a',w:20,h:28,co:[10,40],dr:[['cuero',.3],['hueso',.75]],rare:['dientorco',64]},
b0:{n:'Gruk, Jefe Orco',lv:14,hp:80,dmg:8,ag:1,boss:1,as:3000,c:'#2f5a2a',w:30,h:40,co:[150,300],dr:[['cuero',.75],['hueso',.75]]},
b1:{n:'Fenrir, Lobo Alfa',lv:26,hp:140,dmg:11,ag:1,boss:1,as:2000,c:'#3a3a4a',w:34,h:22,co:[300,600],dr:[['cuero',.75],['hueso',.75]]},
b2:{n:'Rey Cienaga',lv:40,hp:210,dmg:15,ag:1,boss:1,as:2400,c:'#cfcfb8',w:18,h:34,co:[500,1000],dr:[['hueso',.75]]},
b3:{n:'Yeti Milenario',lv:54,hp:300,dmg:19,ag:1,boss:1,as:3000,c:'#e8f2ff',w:32,h:40,co:[800,1600],dr:[['cuero',.75],['hueso',.75]]},
b4:{n:'Oni Gigante',lv:66,hp:360,dmg:22,ag:1,boss:1,as:2600,c:'#a82a2a',w:34,h:46,co:[1100,2200],dr:[['cuero',.75],['hueso',.75]]},
b5:{n:'Señor del Fuego',lv:80,hp:440,dmg:26,ag:1,boss:1,as:2400,c:'#e03a1a',w:32,h:44,co:[1500,3000],dr:[['cuero',.75],['hueso',.75]]},
// ── progresión v2: 6 familias nuevas (una por bioma) + 6 capitanes (custodian el Sello del jefe). hp/dmg/lv se recalculan abajo por nivel (MS) ──
bandido:{n:'Bandido',lv:10,hp:1,dmg:1,ag:1,as:2200,c:'#6a5238',w:14,h:26,co:[12,50],dr:[['cuero',.3],['hueso',.75],['grasa',.1]],rare:['antifaz',72]},
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

// [nombre, descripción, estadística, meta, recompensa]
const Q=[['Leñador novato','Consigue 10 troncos','got:logs',10,60],['Minero aprendiz','Consigue 10 menas de cobre','got:cobre',10,60],['Pescador','Pesca 10 camarones','got:camaron',10,60],
['Cocinero','Cocina 5 camarones','make:c_camaron',5,80],['Herrero','Forja 5 barras de bronce','make:b_bronce',5,100],['Armado','Forja una espada de bronce','make:sw_bronce',1,150],
['Caza goblins','Mata 5 goblins','kill:goblin',5,120],['Lobo solitario','Mata 8 lobos','kill:lobo',8,400],['Maestro minero','Llega a nivel 20 de Minería','lvl:mi',20,500],
['Huesos duros','Mata 10 esqueletos','kill:esqueleto',10,1200],['Aventurero','Nivel total 150','tot',150,800],['Suertudo','Consigue un drop raro','rare',1,1000],
['Acaudalado','Gana 5.000 de oro','coins',5000,1500],['Cazaogros','Mata 5 ogros','kill:ogro',5,3000],
['Explorador','Llega al Bosque','bio',2,200],['Montañista','Llega a las Cumbres','bio',4,800],['Viajero del Oriente','Llega al Oriental','bio',5,1800],['Fuego del volcán','Llega al Volcán','bio',6,2500],['Aprendiz de mago','Lanza 10 hechizos','cast',10,200],
['Artesano','Crea una armadura de cuero','make:ar_cuero',1,150],['Corredor','Llega a nivel 20 de Agilidad','lvl:ag',20,400],['Matademonios','Mata 5 demonios','kill:demonio',5,8000],['Manitas','Fabrica un hacha de hierro','make:ax_hierro',1,200],['Pico de acero','Fabrica un pico de acero','make:pk_acero',1,500],['Caña de tejo','Fabrica una caña de tejo','make:rd_tejo',1,1500],['Herramientas','Fabrica un hacha de cobre','make:ax_cobre',1,100],['Primera receta','Cocina camarones fritos','make:f_camaron',1,150],['Ganadero','Mata 10 vacas','kill:vaca',10,200],['Gran chef','Cocina 10 platos perfectos','perfect',10,600],['Coleccionista','Descubre 25 objetos','disc',25,500],['Gran colección','Descubre 50 objetos','disc',50,2000],['Enciclopedia','Descubre 60 objetos','disc',60,6000],['Escriba','Inscribe 3 pergaminos de Chispa','make:sc_spark',3,150],['Primer botín','Consigue un objeto poco común (verde)','loot:1',1,200],['Afortunado','Consigue un objeto raro (azul)','loot:2',1,1500],['Leyenda viva','Consigue un objeto épico (morado)','loot:3',1,10000],['Hechicero','Lanza 50 hechizos','cast',50,800],
['Bandido de la Pradera','Mata 15 bandidos','kill:bandido',15,500],['Cazaosos','Mata 15 osos pardos','kill:oso',15,2000],['Quema brujas','Mata 15 brujas','kill:bruja',15,4000],['Rompehielos','Mata 10 gigantes','kill:gigante',10,8000],['Sombra vencida','Mata 10 shinobis','kill:shinobi',10,15000],['Corazón de piedra','Mata 10 golems','kill:golem',10,30000],
['Rompe-sellos','Derrota a los 6 capitanes','caps',6,20000],['Maestría en tala','Llega a nivel 75 de Tala','lvl:wc',75,20000],['Maestría en minería','Llega a nivel 75 de Minería','lvl:mi',75,20000],['Maestría en pesca','Llega a nivel 75 de Pesca','lvl:fi',75,20000],
['Veterano','Nivel total 500','tot',500,10000],['Élite','Nivel total 800','tot',800,40000],['Maestro absoluto','Nivel total 1089 (99 en todo)','tot',1089,500000],['Gran chef 99','Llega a nivel 99 de Cocina','lvl:co',99,100000],['Herrero legendario','Llega a nivel 99 de Herrería','lvl:sm',99,100000],['Archimago','Llega a nivel 99 de Magia','lvl:mg',99,100000]];


const TCOL={abedul:'#d8d0b0',fresno:'#b09a6a',ebano:'#3a3a3a',cobre:'#b8623a',estano:'#cfd4dc',plata:'#e8e8f0',bronce:'#c8742a',hierro:'#9a9aa8',acero:'#cfd8e0',mitril:'#4a7aff',adam:'#3adf6a',madera:'#8a6a3a',cuero:'#8a5a2a',pino:'#a0703a',roble:'#7a4a22',sauce:'#7a9a4a',arce:'#c8652a',tejo:'#8a4aaa',caoba:'#8a3a2a',baobab:'#b08a52',mundo:'#6ad08a',runita:'#3ad0d8',oricalco:'#e89a3a',celestita:'#c8a0ff'},ORB={pino:'#8cf',abedul:'#cfe',roble:'#9f9',fresno:'#7fd',sauce:'#6fd',arce:'#fa6',tejo:'#e6f',ebano:'#f6a',cobre:'#fa8',estano:'#cde',bronce:'#fb6',hierro:'#9cf',acero:'#8ef',plata:'#eef',mitril:'#6af',adam:'#6f9',caoba:'#f88',baobab:'#fc8',mundo:'#8fe',runita:'#6ef',oricalco:'#fb6',celestita:'#caf'},TT=['madera','cobre','estano','bronce','hierro','acero','plata','mitril','adam','runita','oricalco','celestita'],tierOf=id=>id.split('_')[1]?id.split('_')[1].split('~')[0]:'',LTC=['#c8742a','#9a9aa8','#cfd8e0','#4a7aff','#d83a3a','#3adf6a'],ARC=id=>TCOL[tierOf(id)]||(LOOT[id]?LTC[LOOT[id].k]||'#9a9aa8':'#c0392b');
const OREC={plata:'#e8e8f0',cobre:'#c8742a',estano:'#e8e8f8',hierro:'#a0502a',carbon:'#222',mitril:'#4a7aff',adam:'#3adf6a',runita:'#3ad0d8',oricalco:'#e89a3a',celestita:'#c8a0ff'},LOGC={abedul:'#d8d0b0',fresno:'#b09a6a',ebano:'#2a2a2a',logs:'#8a5a2a',roble:'#7a4a22',sauce:'#6a8a3a',arce:'#c8652a',tejo:'#7a3a8a',caoba:'#8a3a2a',baobab:'#b08a52',mundo:'#6ad08a'},ICM={};
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
const ic=id=>I[id]?'<img class="ic" src="'+ITEMICON.url(id)+'">':'';ITEMICON.tier=tierOf;   // iconos pintados (src/item-icons.js) para TODOS los objetos
// [título, estadística, meta, recompensa, diálogo de Ru, objetivo en el mapa]
const GOALS=[['Habla con Ru, el tendero de la plaza','talk',1,0,'','S:ru'],
['Tala 5 troncos','got:logs',5,30,'¡Bienvenido, viajero! Soy Ru, el tendero.|Tala 5 troncos en el bosque del norte. ¡Sigue la flecha amarilla!','N:wc:0'],
['Mina 4 menas de cobre','got:cobre',4,30,'Ahora, cobre en las minas del noreste.','N:mi:0'],
['Mina 4 menas de estaño','got:estano',4,30,'Ahora estaño, de las rocas claras.','N:mi:1'],
['Funde una barra de cobre','make:b_cobre',1,40,'Funde el cobre en el horno de la Herrería (entra por su puerta).','S:furnace'],
['Fabrica un hacha de cobre','make:ax_cobre',1,60,'Las herramientas se hacen en el yunque. Funde otra barra primero.','S:anvil'],
['Pesca 6 camarones','got:camaron',6,40,'Pesca 6 camarones en el estanque del sur.','N:fi:0'],
['Cocina 4 camarones','make:c_camaron',4,50,'Cocínalos en el hogar de la taberna: la comida cocinada te cura.','S:fire'],
['Mata una vaca','kill:vaca',1,60,'Ve al rancho, al este, y mata una vaca.','M:vaca'],
['Consigue manteca de vaca','got:grasa',1,40,'Las vacas a veces sueltan manteca. Sigue cazando.','M:vaca'],
['Cocina camarones fritos','make:f_camaron',1,80,'Un camarón y una manteca, en el hogar de la taberna.','S:fire'],
['Forja una espada de cobre','make:sw_cobre',1,80,'Tu primera arma: 2 barras de cobre en el yunque.','S:anvil'],
['Fabrica una armadura de cuero','make:ar_cuero',1,100,'Reúne 4 cueros y hazla en el taller.','S:bench'],
['Derrota a 5 goblins','kill:goblin',5,150,'Los goblins (⚔) atacan al verte. Lleva comida.','M:goblin'],
['Fabrica una espada de estaño','make:sw_estano',1,120,'Funde estaño y forja una espada de estaño.','S:anvil'],
['Esculpe una caña de pino','make:rd_pino',1,100,'El taller también esculpe: 3 troncos de pino y 1 cuero.','S:bench'],
['Derrota 3 gallinas','kill:gallina',3,40,'Los monstruos sueltan runas. Derrota 3 gallinas.','M:gallina'],
['Inscribe un pergamino de Chispa','make:sc_spark',1,80,'Se inscribe en el escritorio: una pluma y un huevo.','S:altar'],
['Lanza tu primer hechizo','cast',1,80,'Haz clic en el pergamino de tu mochila y lanza Chispa a un monstruo.',''],
['Funde una barra de bronce','make:b_bronce',1,100,'Cobre + estaño = bronce (Herrería nivel 8). Es el tercer escalón de equipo.','S:furnace'],
['Fabrica una espada de bronce','make:sw_bronce',1,160,'Herrería nivel 10: forja una espada de bronce con 2 barras.','S:anvil'],
['Fabrica un peto de bronce','make:ar_bronce',1,160,'Artesanía nivel 12: un peto de bronce (3 barras y cuero) te protege bastante más. Antes puedes hacer petos de cobre y estaño para subir Artesanía.','S:bench'],
['Mina 4 menas de hierro','got:hierro',4,120,'El hierro (Minería nivel 12) es el gran salto antes del jefe orco. Busca las rocas rojizas al final de la franja de minas.','N:mi:2'],
['Funde una barra de hierro','make:b_hierro',1,150,'Herrería nivel 13: funde barras de hierro.','S:furnace'],
['Fabrica una espada de hierro','make:sw_hierro',1,300,'Herrería nivel 16: con una espada de hierro y buena armadura ya puedes pensar en el jefe orco.','S:anvil'],
['Derrota a 3 bandidos','kill:bandido',3,200,'Los bandidos (nv 8-12) acampan en la Pradera: en el campamento del este y, al sur, en su guarida. Lleva hierro o bronce y comida.','M:bandido'],
['Derrota a un orco','kill:orco',1,250,'Los orcos del campamento, al final del camino, pegan más fuerte que los goblins. Prepárate con hierro y mucha comida.','M:orco'],
['Derrota a Rufo, el Cabecilla Bandido','kill:k0',1,450,'Rufo vive en la Guarida de bandidos, al sur de la Pradera (mírala en el mapa, tecla M). Va con 4 bandidos y guarda el 🗝️ Sello que mantiene a Gruk protegido. Combate 13 o más y mucha comida.','M:k0'],
['Derrota a Gruk, el Jefe Orco','kill:b0',1,600,'Con el Sello de Rufo, Gruk ya no está protegido. Es duro: Combate 15 o más, espada y peto de hierro y mucha comida. ¡Suelta runas y botín raro!','M:b0'],
['Llega al Bosque','bio',2,200,'La puerta del campamento orco está abierta. Sigue el camino hacia el este: el Bosque tiene mejores recursos.','B:1'],
['Mina 4 menas de carbón','got:carbon',4,250,'El carbón (Minería nivel 22) se encuentra en el Bosque y convierte el hierro en acero.','N:mi:3'],
['Funde una barra de acero','make:b_acero',1,350,'Hierro + carbón, Herrería nivel 22: el acero es el siguiente escalón.','S:furnace'],
['Fabrica un hacha de acero','make:ax_acero',1,400,'Herrería nivel 26: 2 barras de acero y 1 tronco de roble. Tala mucho más rápido.','S:anvil'],
['Derrota a 5 osos pardos','kill:oso',5,600,'La Cueva del oso (al sur del Bosque) esconde osos nv 22-28 y a su capitán. Ve con acero y comida.','M:oso'],
['Derrota a Garra Parda','kill:k1',1,900,'Garra Parda guarda el 🗝️ Sello de Fenrir. Combate 26 o más.','M:k1'],
['Derrota a Fenrir, el Lobo Alfa','kill:b1',1,1400,'Con el Sello, Fenrir ya puede ser retado. Guarda la salida del Bosque: es rápido y peligroso. Combate 31 o más.','M:b1'],
['Llega al Pantano','bio',3,400,'El Pantano esconde plata, ancas de rana, esqueletos y brujas. Cuidado.','B:2'],
['Mina 4 menas de plata','got:plata',4,500,'La plata (Minería nivel 32) crece en el Pantano.','N:mi:4'],
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
['Fabrica una espada de celestita','make:sw_celestita',1,20000,'Herrería nivel 94: la mejor espada del mundo.','S:anvil'],
['Alcanza el nivel 99 de Combate','lvl:cb',99,100000,'Lo difícil empieza ahora: el nivel 99 en cada skill. Entrena donde más XP te den y no olvides la cocina.','']];
const XT=[0,0];{let p=0;for(let l=1;l<99;l++){p+=Math.floor(l+300*Math.pow(2,l/7));XT[l+1]=Math.floor(p/4)}}
const lvlOf=x=>{let l=1;while(l<99&&x>=XT[l+1])l++;return l};
let S={xp:{wc:0,mi:0,fi:0,co:0,sm:0,cr:0,es:0,ins:0,ra:0,mg:0,ag:0,cb:0},inv:[],bank:{},coins:0,tool:{wc:0,mi:0,fi:0},st:{},done:{},buf:{},bagU:0,luck:0,wis:0,goal:0,gseen:-1,auto:1,boss:{},merc:0,trv:0,vig:0,fzr:0,dfs:0,mana2:0,mreg2:0,crf:0,hv:0,cfg:0,rvt:0,poi:{},map:{},key:{},rest:0,tq:{wc:0,mi:0,fi:0},pity:0,legR:0,runes:{},mv:40,sv:100,disc:{},eq:{w:null,a:null},t:Date.now(),cur:null,qs:[],qb:null,rep:{},qn:0,qstreak:0};
try{let r=JSON.parse(localStorage.getItem('tdo2'));if(r&&(r.ver||0)<12)r=null; /* progresión v2 (oct 2026): 99 en todas las skills, 6 familias nuevas, sellos de capitán: partidas anteriores descartadas */ /* F3-C2: se añadió el bioma Oriental (índices de bioma, botín y jefes cambian): las partidas anteriores se descartan (decisión del dueño) */if(r)S={...S,...r,xp:{...S.xp,...r.xp},tool:{...S.tool,...r.tool}};if(r&&!r.ver){for(const k in S.tool)S.tool[k]++}if(r&&!r.eq){const bs=M=>S.inv.filter(x=>M[x]).sort((a,b)=>M[b]-M[a])[0],w=bs(SW),a=bs(AR);if(w){S.eq.w=w;S.inv.splice(S.inv.indexOf(w),1)}if(a){S.eq.a=a;S.inv.splice(S.inv.indexOf(a),1)}}if(r&&(r.ver||0)<10)migOld();S.ver=13}catch(e){}
let WIPE=0,rtm;
function migOld(){const ver=S.ver||0,mp={cobre:'pino',estano:'abedul',bronce:'roble',hierro:'fresno',acero:'sauce',plata:'arce',mitril:'tejo',adam:'ebano'},fx=id=>typeof id==='string'?id.replace(/^(bw|st)_(cobre|estano|bronce|hierro|acero|plata|mitril|adam)/,(m,a,b)=>a+'_'+mp[b]):id;
 S.inv=S.inv.map(fx);for(const k of Object.keys(S.bank)){const n=fx(k);if(n!==k){S.bank[n]=(S.bank[n]||0)+S.bank[k];delete S.bank[k]}}for(const k of Object.keys(S.eq))S.eq[k]=fx(S.eq[k]);for(const k of Object.keys(S.disc)){const n=fx(k);if(n!==k){S.disc[n]=1;delete S.disc[k]}}
 if(ver<9)for(const k in S.tool)S.tool[k]=[0,3,4,5,7,8][S.tool[k]]??S.tool[k];
 for(const k of ['wc','mi','fi']){const t=S.tool[k]||0;if(!S.eq[k]&&t>0)S.eq[k]=(k==='wc'?'ax_':k==='mi'?'pk_':'rd_')+(k==='fi'?WON[t-1]:TNM[t-1])}}
const save=()=>{if(WIPE)return;S.t=Date.now();try{localStorage.setItem('tdo2',JSON.stringify(S))}catch(e){}};
function resetGame(){const b=$('#rstb');if(b.dataset.arm!=='1'){b.dataset.arm='1';b.textContent='¿Seguro? Clic otra vez para borrar';clearTimeout(rtm);rtm=setTimeout(()=>{b.dataset.arm='0';b.textContent='Reiniciar'},4000);return}WIPE=1;try{localStorage.removeItem('tdo2')}catch(e){}location.reload()}
const L=sk=>lvlOf(S.xp[sk]),count=id=>S.inv.filter(x=>x===id).length,maxHp=()=>10+CBL()*2+gs('hp')+5*S.vig,wb=()=>WB[S.eq.w]||0,ab=()=>(AR[S.eq.a]||0)+(SHL[S.eq.s]||0)+(LGL[S.eq.l]||0)+(GLL[S.eq.g]||0)+gs('def')+S.dfs+(S.buf.def>Date.now()?5:0),maxHit=()=>{if(wtype()==='g')return Math.max(1,...SPL.filter(s=>s.atk&&L('mg')>=s.lv).map(spMax));const w=S.eq.w,l=L(wtype()==='r'?'ra':'cb'),ef=l+8+S.fzr+(S.buf.dmg>Date.now()?3+Math.floor(l*.1):0);return Math.floor(.5+ef*(FZ+(w?SB[w]||0:0)+gs('str'))/(FZ*10))};
// lote D6: mochila APILABLE (S.inv sigue siendo una lista plana, una entrada por unidad; lo que cambia es cuántos HUECOS ocupa). Materiales/comida/pociones apilan hasta STK por hueco; el equipo (armas, armaduras, herramientas, objetos con '~' de calidad) ocupa siempre 1 hueco por pieza.
const STKN=5,stk=id=>!(WB[id]||AR[id]||SHL[id]||LGL[id]||GLL[id]||LOOT[id]||TOOLT[id]||String(id).includes('~')),
 slotsUsed=()=>{const c={};let n=0;for(const x of S.inv){if(stk(x))c[x]=(c[x]||0)+1;else n++}for(const k in c)n+=Math.ceil(c[k]/STKN);return n},
 room=id=>{if(id&&stk(id)){const n=count(id);if(n%STKN!==0)return true}return slotsUsed()<cap()},
 have=k=>count(k)+(S.bank[k]||0),
 invSlots=()=>{const out=[],pos={};S.inv.forEach((x,j)=>{if(!stk(x)){out.push({id:x,n:1,i:j});return}const g=pos[x]||(pos[x]=[]);let c=g[g.length-1];if(!c||c.n>=STKN){c={id:x,n:0,i:j};g.push(c);out.push(c)}c.n++;c.i=j});return out};   // las instalaciones también gastan lo guardado en el banco
const hasIn=o=>Object.entries(o).every(([k,v])=>have(k)>=v);
const take=o=>{for(const[k,v]of Object.entries(o))for(let n=0;n<v;n++){const j=S.inv.indexOf(k);if(j>=0)S.inv.splice(j,1);else if(S.bank[k]>0)S.bank[k]--}};
// RECURSOS CON VIDA (oct 2026): cada nodo tiene HP = 3·TR^(tier que lo desbloquea); cada golpe de la herramienta hace daño TR^(tier de herramienta)·(1+0,01·nivel)·(1+0,18·calidad). Un tier de herramienta por encima del nodo = 1 golpe (con nivel alto, antes).
const NODER=1.7,nodeHp=a=>3*Math.pow(NODER,TLV(rq(a))),toolDmg=sk=>(Math.pow(NODER,S.tool[sk]||0)+(S.tool[sk]?0:1))*(1+L(sk)*.01)*(1+.18*(S.tq[sk]||0));
const hitPeriod=sk=>TOOLS[sk]?[3,3,3,2,2,2,1,1,1,1,1,1][S.tool[sk]]*600:900,hitAmt=(sk,a)=>Math.min(1,TOOLS[sk]?toolDmg(sk)/nodeHp(a):(900/a[a.length-1])*(1+L(sk)*.006)),dur=(sk,a)=>hitPeriod(sk)*Math.ceil(1/hitAmt(sk,a));

// ---------- mundo ----------
const WW=BIOMES.WW,WH=BIOMES.WH,spawnOf=BIOMES.spawnOf; // datos por bioma en src/biomes.js (F3-B). Cada bioma es un rectángulo {ox,oy,w,h} del mundo; sus datos van en coordenadas locales (F9-L0)
const biomeAt=(x,y)=>BIOMES.at(x,y);
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const N=[],M=[],ST=[],PD=[],PO=[],GD=[],GA=[];   // GD = objetos en el suelo (drops de enemigos), GA = animaciones de recogida   // PO = puntos de interés (cofres, santuarios)
// punto de pesca válido: agua abierta (el tile y sus vecinos), a ≤84 px de tierra pisable (se pesca desde la orilla con el alcance de la caña) y lejos de otros puntos de pesca
const fishOk=(x,y)=>{const hw=(a,b)=>TER.heightAt(x+a,y+b)===.75;if(!hw(0,0)||!hw(14,0)||!hw(-14,0)||!hw(0,12)||!hw(0,-12))return false;
 for(const r of[36,60,84])for(let k=0;k<12;k++){const a=k*Math.PI/6;if(TER.isLand(TER.heightAt(x+Math.cos(a)*r,y+Math.sin(a)*r)))return true}return false};
const relocate=e=>{if(e.fix){e.g=Math.random()<.04;return}   // fix = árbol fijo (decorativo convertido en recurso): reaparece donde estaba
 if(e.t==='fi'){let bx=null;for(let a=0;a<110&&!bx;a++){const x=e.z[0]+Math.random()*(e.z[1]-e.z[0]),y=e.z[2]+Math.random()*(e.z[3]-e.z[2]),sp=a<70?64:34;if(fishOk(x,y)&&!N.some(o=>o!==e&&o.t==='fi'&&Math.hypot(o.x-x,o.y-y)<sp))bx=[x,y]}if(bx){e.x=bx[0];e.y=bx[1]}
  // punto de orilla desde el que se pesca: el suelo pisable más cercano (la ruta del jugador va hacia él, no en línea recta por encima del agua)
  e.st=[];for(let r=24;r<=96;r+=12)for(let k=0;k<24;k++){const an=k*Math.PI/12,x=e.x+Math.cos(an)*r,y=e.y+Math.sin(an)*r;if(TER.isLand(TER.heightAt(x,y))&&!TER.cliffNear(x,y,10)&&!PROPS.solid(x,y)&&TER.isLand(TER.heightAt(x+8,y))&&TER.isLand(TER.heightAt(x-8,y))&&TER.isLand(TER.heightAt(x,y+8))&&TER.isLand(TER.heightAt(x,y-8)))e.st.push([x,y])}
  e.g=Math.random()<.04;return}
 for(let a=0;a<10;a++){e.x=e.z[0]+Math.random()*(e.z[1]-e.z[0]);e.y=e.z[2]+Math.random()*(e.z[3]-e.z[2]);if(!N.some(o=>o!==e&&Math.hypot(o.x-e.x,o.y-e.y)<34))break}e.g=Math.random()<.04};
const sp0=(t,i,n,x0,x1,y0,y1)=>{for(let k=0;k<n;k++){const e={t,i,x:0,y:0,rt:0,z:[x0,x1,y0,y1]};relocate(e);N.push(e)}};
Object.keys(MD).forEach(id=>{MD[id].id=id;if(CRE.H[id])MD[id].h=Math.round(CRE.H[id]/1.5)}); // altura de etiqueta/barra = altura del sprite (px de modelo) / SPR (1.5)
// ── v2: bandas de nivel por criatura (el nivel de cada individuo se sortea en la banda al reaparecer) y estadísticas POR NIVEL (HP/golpe máx del monstruo = f(nivel) × multiplicador de familia) ──
const LVR={gallina:[1,2],vaca:[2,4],goblin:[3,8],bandido:[8,12],orco:[11,15],k0:[14,14],b0:[16,16],jabali:[14,18],lobo:[18,24],oso:[22,28],k1:[27,27],b1:[32,32],rana:[30,34],esqueleto:[34,40],bruja:[38,44],k2:[44,44],b2:[48,48],
 yak:[46,50],ogro:[50,56],gigante:[54,60],k3:[60,60],b3:[64,64],zorro:[62,66],oni:[66,72],shinobi:[70,76],k4:[76,76],b4:[80,80],lagarto:[78,84],demonio:[84,92],golem:[90,97],k5:[97,97],b5:[99,99]};
// [multiplicador de HP, multiplicador de daño]: 0 de daño = inofensivo (gallina)
const MSF={gallina:[.5,0],vaca:[1,.35],goblin:[1,.8],bandido:[1,1],orco:[1.3,1.1],k0:[1.2,1],b0:[1.9,0.8],jabali:[1,.9],lobo:[1,1],oso:[1.5,1.1],k1:[1.35,1],b1:[1.55,0.8],rana:[.9,.9],esqueleto:[1,1],bruja:[.8,1.25],k2:[1.55,1],b2:[1.9,0.8],
 yak:[1.4,1],ogro:[1.3,1.2],gigante:[1.6,1.3],k3:[1.95,1],b3:[2.6,0.8],zorro:[1,1],oni:[1.3,1.2],shinobi:[1,1.4],k4:[1.4,1],b4:[2.55,0.8],lagarto:[1,1],demonio:[1.2,1.2],golem:[2,1.3],k5:[1.7,1],b5:[2.4,0.8]};
const HPF=lv=>3+.6*lv,DMF=lv=>2+.45*lv*(1+.6*(lv/99)*(lv/99));
Object.keys(LVR).forEach(id=>{const d=MD[id],r=LVR[id],f=MSF[id];d.lv=Math.round((r[0]+r[1])/2);d.hp=Math.max(3,Math.round(HPF(d.lv)*f[0]));d.dmg=f[1]?Math.max(1,Math.round(DMF(d.lv)*f[1])):0});
function rollLv(m){const d=m.d,r=LVR[d.id],f=MSF[d.id];m.lv=R(r[0],r[1]);m.mh=Math.max(3,Math.round(HPF(m.lv)*f[0]));m.dm=f[1]?Math.max(1,Math.round(DMF(m.lv)*f[1])):0;m.hp=m.mh;m.hunt=0;m.ag0=0;m.bleed=null;m.lx=null;m.tel=null}
const mob=(id,x,y)=>{const m={d:MD[id],hx:x,hy:y,x,y,rt:0,tx:x,ty:y,wt:0,fl:0};rollLv(m);M.push(m)};
const ZS=[];PROPS.build();
BI.forEach((b,k)=>{const x0=b.ox,y0=b.oy,L=b.lay;
 b.village.stations.forEach(([id,n,dx,dy,sks])=>{const e={id,n:id==='shop'?'Tienda':n,x:x0+dx,y:y0+dy};if(sks)e.sks=sks;ST.push(e);if(id==='shop'){ST.push({id:'ru',n:'Ru',x:e.x+30,y:e.y-26});ST.push({id:'board',n:'Tablón de encargos',x:e.x-112,y:e.y+30})}}); // Ru es un NPC aparte del puesto de la tienda (clic en Ru = diálogo, clic en el puesto = tienda)
 {const put=(kind,list,rs)=>list.forEach(([i,n])=>{for(let j=0;j<n;j++){const r=rs[R(0,rs.length-1)];sp0(kind,i,1,x0+r[0],x0+r[1],y0+r[2],y0+r[3])}}),ZN=(r,t)=>ZS.push({k,r:[x0+r[0],x0+r[1],y0+r[2],y0+r[3]],t}),nm=(sk,i)=>ACT[sk][i][0];
  b.res.wc.forEach((l,z)=>{put('wc',l,L.wc[z].r);ZN(L.wc[z].z,'🌲 Zona de '+nm('wc',l[0][0]).toLowerCase())});
  b.res.mi.forEach((l,v)=>{put('mi',l,L.mi[v].r);ZN(L.mi[v].z,'⛏️ Veta de '+nm('mi',l[0][0]).toLowerCase())});
  b.res.fi.forEach((l,z)=>{const f=L.fi[z];if(!f)return;put('fi',l,[f.z]);ZN(f.z,'🎣 '+f.t+': '+nm('fi',l[0][0]).toLowerCase())})}
 ['ing','pack','camp','orc','cap'].forEach(key=>{const sp=b.spots&&b.spots[key];if(!sp)return;sp.mobs.forEach(([id,dx,dy])=>mob(id,x0+dx,y0+dy));ZS.push({k,r:[x0+sp.z[0],x0+sp.z[1],y0+sp.z[2],y0+sp.z[3]],t:sp.t})}); // guaridas decoradas (src/biome-spots.js / layouts.js)
 (b.pois||[]).forEach(p=>{const id=k+'_'+p.id,x=x0+p.x,y=y0+p.y,pk=p.k==='camp'?'cofre':p.k,sant=pk==='santuario',done=!!S.poi[id];
  PO.push({po:1,id,pk,n:sant?'santuario':done?'cofreAbierto':'cofre',o:sant?{col:p.col,used:done}:null,nm:p.n,x,y,k,_oa:1,tier:p.tier,stat:p.stat,col:p.col});
  if(p.mobs)p.mobs.forEach(([mid,dx,dy])=>{mob(mid,x+dx,y+dy);M[M.length-1].poi=id});
  ZS.push({k,r:[x-p.r,x+p.r,y-p.r,y+p.r],t:(p.k==='camp'?'🏕️ ':sant?'⛩️ ':'🧰 ')+p.n,poi:id})});
 mob('b'+k,x0+b.bossPos[0],y0+b.bossPos[1])});
// árboles decorativos (cualquier prop con el sprite de un árbol de TREES) = recursos talables: misma especie, mismo tier. Fijos (fix) y con colisión de tronco.
PROPS.trees.forEach(t=>{N.push({t:'wc',i:t.i,x:t.x,y:t.y,rt:0,z:[t.x,t.x,t.y,t.y],fix:1,g:Math.random()<.04})});
PROPS.scatter({ST,ZS,N,M});if(!/nodoors/.test(location.search))intDoorsInit();

const FISHR=104;   // alcance de la caña (px de mundo): se pesca desde la orilla sin pisar el agua
const alive=(e,now)=>!e.rt||e.rt<=now,nearS=id=>ST.find(s=>s.id===id&&Math.hypot(P.x-s.x,P.y-s.y)<80);
const P={x:spawnOf(0).x,y:spawnOf(0).y,f:1,w:0,hp:0,g:null,mv:null,mvg:0},K={};let A=null,parts=[],logs=['Bienvenido a Villa Pradera.'],dirty=1,pd=0,lr=0,lreg=0,lfx=0,DT=0,TB='inv',cx=0,cy=0,curB=0,swc=0;
P.hp=maxHp();S.tq=S.tq||{wc:0,mi:0,fi:0};syncTools();S.st.bio=S.st.bio||1;for(let k=0;k<(S.st.bio||1)-1;k++)S.boss[k]=1;S.inv.forEach(x=>S.disc[x]=1);Object.keys(S.bank).forEach(x=>S.disc[x]=1);[S.eq.w,S.eq.a].forEach(x=>{if(x)S.disc[x]=1});S.st.disc=Object.keys(S.disc).length;

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
function inVil(r){const b=BI[curB],c=b.cen;return Math.abs(P.x-(b.ox+c[0]))<r&&Math.abs(P.y-(b.oy+c[1]))<r-30}
let bossAt=-1e9,NGT=0;
function bgm(now,dt){if(A&&A.ty==='f'){fightAt=now;if(A.e&&A.e.d&&A.e.d.boss)bossAt=now}const fight=now-fightAt<2500,off=S.mute||!UNL;if(!INV&&inVil(235))INV=1;else if(INV&&!inVil(280))INV=0;
 const sn=sunS(now/1000);if(!NGT&&sn<-.12)NGT=1;else if(NGT&&sn>-.02)NGT=0;
 // F6-música: si el bioma tiene pistas propias (MUSIC.DEF) suenan ellas; si no, la música antigua (síntesis / amber-tavern-dragon)
 const inI=!!INT,tav=inI&&INT.id==='taberna';   // dentro de un interior suena la música de la aldea más baja (×0,4); en la TABERNA, su canción única (assets/music/taberna.mp3, tools/tavern_song.py)
 const mus=MUSIC.update(now,dt,{k:inI?INT.k:curB,vil:inI?true:!!INV,fight:inI?false:fight,boss:inI?false:fight&&now-bossAt<2500,night:inI?false:!!NGT,off:off||tav,mv:inI?S.mv*.4:S.mv});
 vT=ramp('amber',vT,(!mus&&!off&&!fight&&curB===0&&!INV&&!inI)?1:0,dt);vV=ramp('tavern',vV,tav&&!off?.9:((!mus&&!off&&!fight&&INV&&!inI)?1:0),dt);vB=ramp('dragon',vB,(!mus&&!off&&fight)?1:0,dt);if(!mus&&!fight&&curB>0&&!INV)music(now)}
// ---------- sonido ----------
let AC=null,nm=0;
function ac(){if(!AC)try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}if(AC&&AC.state==='suspended')AC.resume();return AC}
['pointerdown','keydown'].forEach(e=>addEventListener(e,()=>ac()));
function tone(f,d,ty,v,sl,dl){const a=ac();if(!a||S.mute)return;const t=a.currentTime+(dl||0),o=a.createOscillator(),g=a.createGain();o.type=ty||'square';o.frequency.setValueAtTime(f,t);if(sl)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+sl),t+d);g.gain.setValueAtTime(Math.max(.0001,(v||.05)*S.sv/100),t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d)}
function noise(d,v,fr,ty){const a=ac();if(!a||S.mute)return;const n=a.sampleRate*d|0,b=a.createBuffer(1,n,a.sampleRate),c=b.getChannelData(0);for(let i=0;i<n;i++)c[i]=Math.random()*2-1;const s=a.createBufferSource(),fl=a.createBiquadFilter(),g=a.createGain(),t=a.currentTime;s.buffer=b;fl.type=ty;fl.frequency.value=fr;g.gain.setValueAtTime(Math.max(.0001,v*S.sv/100),t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(fl);fl.connect(g);g.connect(a.destination);s.start(t)}
const SND={wc:()=>{noise(.1,.14,700,'lowpass');tone(110,.1,'triangle',.1,-50)},mi:()=>{tone(1500,.07,'square',.035,-400);noise(.05,.06,5000,'highpass')},fi:()=>noise(.3,.06,1600,'bandpass'),co:()=>noise(.35,.04,6000,'highpass'),es:()=>{noise(.08,.1,3000,'bandpass');tone(500,.06,'square',.04,-150)},ins:()=>{tone(1100,.18,'sine',.05,200);tone(1650,.2,'sine',.03,0,.06)},bow:()=>{tone(700,.08,'triangle',.05,-350);noise(.06,.05,3500,'highpass')},magic:()=>{tone(500,.25,'sine',.06,600);tone(900,.2,'sine',.04,0,.05)},
sm:()=>{tone(880,.18,'square',.04,-150);tone(1320,.25,'triangle',.03)},cr:()=>{tone(300,.06,'square',.05,-80);tone(450,.05,'square',.03,0,.06)},hit:()=>{noise(.1,.12,900,'lowpass');tone(200,.1,'sawtooth',.06,-120)},miss:()=>noise(.12,.04,2500,'bandpass'),hurt:()=>tone(160,.25,'sawtooth',.08,-80),
kill:()=>{tone(300,.2,'square',.06,200);tone(500,.25,'square',.06,0,.12)},die:()=>tone(300,.6,'sawtooth',.08,-250),lvl:()=>[523,659,784,1047].forEach((f,i)=>tone(f,.25,'square',.06,0,i*.1)),
coin:()=>{tone(988,.08,'square',.05);tone(1319,.15,'square',.05,0,.07)},xp:()=>{tone(1175,.05,'sine',.04);tone(1568,.09,'sine',.035,0,.05)},quest:()=>[392,523,659].forEach((f,i)=>tone(f,.3,'triangle',.08,0,i*.12)),epic:()=>[523,659,784,1047,1319,1568].forEach((f,i)=>tone(f,.4,'square',.06,0,i*.12)),rare:()=>[659,784,988,1319,1568].forEach((f,i)=>tone(f,.3,'square',.06,0,i*.09))};
const snd=k=>{try{SND[k]&&SND[k]()}catch(e){}},mut=()=>{S.mute=!S.mute;save();panel()};
const PEN=BI.map(b=>b.music.pen);
function music(now){if(!AC||S.mute||now<nm)return;nm=now+R(1400,3000);const f=PEN[curB][R(0,4)]*(Math.random()<.3?2:1);tone(f,1.8,BI[curB].music.wave,BI[curB].music.gain)}
// ---------- lógica ----------
function log(m){logs.unshift(m);logs=logs.slice(0,5);$('#log').innerHTML=logs.map(x=>'<div>'+x+'</div>').join('')}
let tt;function toast(h,ms=2400){const t=$('#toast');t.innerHTML=h;t.style.display='block';clearTimeout(tt);tt=setTimeout(()=>t.style.display='none',ms)}
let chkg=0;function chk(){if(chkg)return;chkg=1;Q.forEach((q,i)=>{if(!S.done[i]&&(S.st[q[2]]||0)>=q[3]){S.done[i]=1;snd('quest');S.coins+=q[4];S.st.coins=(S.st.coins||0)+q[4];toast('📜 Misión completada: <b>'+q[0]+'</b><br>+'+q[4]+' oro');log('Misión completada: '+q[0]);dirty=1}});let adv=0,rw=0;while(S.goal<GOALS.length&&(S.st[GOALS[S.goal][1]]||0)>=GOALS[S.goal][2]){rw+=GOALS[S.goal][3];S.goal++;adv++}if(adv){S.coins+=rw;S.st.coins=(S.st.coins||0)+rw;snd('quest');const g=GOALS[S.goal];toast('🎯 ¡Objetivo cumplido!'+(rw?'<br>+'+rw+' oro':'')+(g?'<br>Siguiente: <b>'+g[0]+'</b>':'<br>¡Completaste todos los objetivos!'));log('Objetivo cumplido'+(g?'. Siguiente: '+g[0]:'.'));dirty=1}if(S.goal>=GOALS.length&&!S.legR){S.legR=1;addLoot('lg_ring')}if(typeof qChk==='function')qChk();chkg=0}
function inc(k,n=1){S.st[k]=(S.st[k]||0)+n;chk()}
const earn=n=>{S.coins+=n;inc('coins',n)};
const add=id=>{S.inv.push(id);inc('got:'+id);disc(id)};
function disc(id){if(!S.disc[id]&&!id.includes('~')){S.disc[id]=1;S.st.disc=Object.keys(S.disc).length;log('📖 ¡Nuevo objeto! '+I[id][0]);snd('xp');chk()}}
function sp(x,y,c,n,vx,vy,g){for(let k=0;k<n;k++)parts.push({x,y,vx:(Math.random()-.5)*vx,vy:-Math.random()*vy,g,l:1,c})}
function gain(sk,xp,sil){xp*=(1+.05*S.wis)*(S.buf.xp>Date.now()?1.5:1)*(sk==='cb'||sk==='mg'||sk==='ra'?1+pv('savant')/100:TOOLS[sk]?1+tpv(sk,'gsage')/100:1);const o=L(sk);S.xp[sk]+=xp;if(!sil&&sk!=='ag')snd('xp');if(TB==='sk')skLive(sk); /* actualiza solo la barra y el texto de esa skill; subir de nivel marca dirty (rebuild) más abajo */if(!sil)LASTX=[sk,performance.now()];const n=L(sk);
 if(!sil){XD.push({t:'+'+Math.round(xp),i:SK[sk][1],t0:performance.now(),n:XN++});if(XD.length>10)XD.shift()}
 if(n>o){S.st['lvl:'+sk]=n;S.st.tot=SKL.reduce((s,k)=>s+L(k),0);banner('¡Nivel '+n+'!',SK[sk][1]+' '+SK[sk][0],'#ffe629',3200);log('¡Nivel '+n+' en '+SK[sk][0]+'!');sp(P.x,P.y-20,'#ffe629',24,160,120,200);snd('lvl');if(sk==='cb'||sk==='ra'||sk==='mg')P.hp=maxHp();chk();dirty=1}}
function stepAct(sk,i,sil){const a=ACT[sk][i],cr=a.length===6;
 if(L(sk)<rq(a))return 0;
 if(cr){if(!hasIn(a[1])){if(!sil)log('Te faltan materiales.');return 0}
  if(ownT(a)){if(!sil)log('Ya tienes esa herramienta o una mejor.');return 0}take(a[1]);
  if(sk==='co'&&Math.random()<Math.max(0,.45-(L(sk)-a[3])*.02)){add('quemado');if(!sil)log('Quemaste la comida.')}
  else{if(a[2]&&a[2].startsWith('rn_')){const[rid,n]=a[2].split(':'),rk=rid.slice(3);S.runes[rk]=(S.runes[rk]||0)+ +n;disc(rid);inc('make:'+rid)}else if(a[2]){const vid=qv(a[2],sk);add(vid);autoEq(vid);inc('make:'+a[2]);if(vid!==a[2]){const q=+vid.split('~')[1];log('<span style="color:'+RAR[q][1]+'">✨ ¡Calidad '+RAR[q][0].toLowerCase()+'!</span>');if(q>=2){toast('🔨 <span style="color:'+RAR[q][1]+'">¡Calidad '+RAR[q][0].toLowerCase()+'!</span><br>'+I[a[2]][0]);snd('rare')}}}else inc('fm');gain(sk,a[4],sil);if(!sil)log(!a[2]?'Quemas '+a[0].slice(7):a[2].startsWith('tl:')||a[2].startsWith('rn_')?'Fabricas: '+a[0]:'Obtienes: '+I[a[2]][0])}
  return 1}
 if(!room(a[1])){if(!sil)log('Inventario lleno. Vende o usa el banco.');return 0}
 add(a[1]);if(!sil&&room(a[1])&&Math.random()*100<pv('harvest')+4*S.hv){add(a[1]);log('✨ ¡Cosecha doble!')}gain(sk,a[3],sil);if(!sil)log('Obtienes: '+I[a[1]][0]);
 const r=RARE[sk];if(r&&room(r[0])&&Math.random()<(1+.25*S.luck+tpv(sk,'lucky')/100)/r[1]){add(r[0]);inc('rare');snd('rare');toast(ic(r[0])+' ¡Drop raro: <b>'+I[r[0]][0]+'</b>!',3000);log('¡Drop raro! '+I[r[0]][0])}
 return 1}
function stopA(m){A=null;S.cur=null;if(m)log(m);dirty=1}
function startG(e,now){if(!alive(e,now))return;const a=ACT[e.t][e.i];
 if(L(e.t)<rq(a))return log('Necesitas nivel '+rq(a)+' en '+SK[e.t][0]+'.');
 if(!room(ACT[e.t][e.i][1]))return log('Inventario lleno. Vende o usa el banco.');
 A={ty:'g',e,sk:e.t,i:e.i,t0:now,d:dur(e.t,a),pr:0,amt:hitAmt(e.t,a),per:hitPeriod(e.t),base:hitPeriod(e.t)};S.cur={sk:e.t,i:e.i};dirty=1}
// F5-C · el siguiente golpe se TIRA al empezar cada ciclo (no al final) para que la animación sepa si será máximo (daño amarillo) y use la versión especial del arma.
// rollAtk devuelve {m,wt,hit,d1,sp,heavy}; act() lo usa al final del ciclo si sigue valiendo (mismo objetivo y mismo tipo de arma), si no lo vuelve a tirar. `exec` se aplica al final (depende de la vida de entonces).
function rollAtk(m){const wt=wtype(),hit=Math.random()<hitChance(m),d0=hit?R(1,maxHit()):0,d1=d0&&Math.random()*100<pv('crit')?Math.round(d0*1.75):d0;let sp=null;
 if(wt==='g'){const si=autoSpell();if(si>=0){const sl=SPL[si],mx=spMax(sl),h=Math.random()<spAcc(m);sp={si,hit:h,d:h?R(Math.ceil(mx*.5),mx):0,mx}}}
 return{m,wt,hit,d1,sp,heavy:wt==='g'?!!(sp&&sp.d>=2&&sp.d>=sp.mx):d1>=2&&d1>=maxHit()}}
function startF(e,now){if(!alive(e,now))return;if(sealed(e)){const k=MB[e.d.id];toast('🔒 <b>'+e.d.n+'</b> está protegido por un sello. Derrota a <b>'+MD['k'+k].n+'</b> en la '+CAPN[k]+'.',4200);snd('miss');return}A={ty:'f',e,t0:now,ph:Math.max(now+700,ATKT),sk:'cb',ms:atkMs()};A.nx=rollAtk(e);e.hunt=1;e.nt=Math.max(e.nt||0,now+1400);dirty=1}
function startC(sk,i){const a=ACT[sk][i];if(ownT(a))return log('Ya tienes esa herramienta.');if(L(sk)<rq(a)||!hasIn(a[1]))return log('Te faltan materiales o nivel.');
 A={ty:'c',e:S.stn,sk,i,t0:performance.now(),d:dur(sk,a),pr:0,amt:hitAmt(sk,a),per:hitPeriod(sk),left:QTY||1e9};S.cur={sk,i};dirty=1}
function reseek(e,now){if(e.d&&(!S.auto||(e.d.ag&&(P.hp<maxHp()*.6||M.some(o=>o!==e&&o.hunt&&alive(o,now))))))return stopA();let b=null,bd=1e9;(e.d?M:N).forEach(o=>{if(o===e||!alive(o,now)||(e.d?o.d!==e.d:(o.t!==e.t||o.i!==e.i))||(e.d&&e.d.ag&&M.some(q=>q!==o&&q!==e&&alive(q,now)&&q.d.ag&&Math.hypot(q.x-o.x,q.y-o.y)<100)))return;const d=Math.hypot(o.x-e.x,o.y-e.y);if(d<bd){bd=d;b=o}});
 if(b){A=null;P.g={e:b}}else stopA('No quedan más cerca. Espera a que reaparezcan.')}
// ---- puntos de interés: cofres (oro + XP + a veces un drop raro; los de campamento están custodiados) y santuarios (bendición permanente de una sola vez)
function openPO(e,now){if(S.poi[e.id])return log('Ya lo has saqueado.');
 if(e.pk==='cofre'&&M.some(m=>m.poi===e.id&&alive(m,now))){toast('⚔️ Derrota a los guardias del campamento primero');return}
 S.poi[e.id]=1;snd('rare');
 if(e.pk==='santuario'){S[e.stat]=(S[e.stat]||0)+1;e.o={col:e.col,used:1};const tx={vig:'Vigor: +5 PV máximos',wis:'Sabiduría: +5 % de experiencia',luck:'Fortuna: +25 % de suerte',trv:'Viajero: +5 % de velocidad'}[e.stat];toast('⛩️ <b>'+e.nm+'</b><br>Bendición permanente — '+tx,4200);log('⛩️ '+e.nm+': '+tx);dirty=1;save();return}
 const t=e.tier||1,c=R(50,110)*t,sk=['wc','mi','fi','co','sm','cr'][R(0,5)],xp=Math.round((40+L(sk)*7)*t);let tx='+'+c+' oro · +'+xp+' XP '+SK[sk][0];
 earn(c);gain(sk,xp,true);if(Math.random()<.55){const r=['gema','nido','perla'][R(0,2)];if(room(r)){add(r);tx+='<br>'+ic(r)+' '+I[r][0]}}
 e.n='cofreAbierto';toast('🧰 <b>'+e.nm+'</b><br>'+tx,3800);log('🧰 '+e.nm+': '+tx.replace('<br>',' · '));dirty=1;save()}
function engage(e,now){if(e.dropG){pickG(e,now);return}if(e.po)return openPO(e,now);P.f=e.x-e.y>=P.x-P.y?1:-1;
 if(e.t)startG(e,now);else if(e.d)startF(e,now);else if(!(IW&&IW.e===e))openIW(e)}
// ---- F5-B · números de daño estilo OSRS (hitsplats): salpicadura en píxeles + dígitos de fuente 3×5 con sombra, centrados sobre el objetivo.
// Se hornea a resolución de «píxel lógico» (1 celda = 1 px) y se estampa ampliado por un entero sin suavizado → pixelado nítido. Se dibuja en coordenadas de PANTALLA
// (no dentro de spr(): allí la altura se sumaba a y del mundo y los números salían desplazados a la derecha). splat(x,y,d,c,hgt): x,y = pies del objetivo, hgt = altura sobre ellos en unidades de spr.
const HSD={0:'111101101101111',1:'010110010010111',2:'111001111100111',3:'111001111001111',4:'101101111001001',5:'111100111001111',6:'111100111101111',7:'111001010010010',8:'111101111101111',9:'111101111001111','+':'000010111010000'},HSC=new Map();
// Números de daño (oct 2026): mismo diseño de hitsplat (mancha de 17×15 con dígitos 3×5), pero horneado a F× de resolución con bordes suaves, contorno de tinta y degradado, para que no desentone con el arte pintado. Los dígitos siguen siendo píxeles.
function hsBake(col,txt){const key=col+'|'+txt;let b=HSC.get(key);if(b)return b;
 const F=5,tw=txt.length*4-1,W=tw>9?23:17,H=15,k=W/17,cx=W/2,cy=7.5,c=document.createElement('canvas');c.width=W*F;c.height=H*F;const g=c.getContext('2d');g.lineJoin='round';
 const line=PAINT.mix(col,'#1c0a06',.78),lo=PAINT.mix(col,'#2a0a08',.34),hi=PAINT.mix(col,'#ffffff',.42);
 g.beginPath();for(let n=0;n<=96;n++){const a=n/96*Math.PI*2,r=5.5+1.9*Math.pow(Math.max(0,Math.cos(5*a+.6)),3),x=cx+Math.cos(a)*r*1.15*k,y=cy+Math.sin(a)*r;n?g.lineTo(x*F,y*F):g.moveTo(x*F,y*F)}g.closePath();
 const gr=g.createLinearGradient(0,1.5*F,0,(H-1.5)*F);gr.addColorStop(0,hi);gr.addColorStop(.38,col);gr.addColorStop(1,lo);
 g.fillStyle=gr;g.fill();g.save();g.clip();g.strokeStyle=hi;g.globalAlpha=.55;g.lineWidth=F*.7;g.translate(F*.55,F*.7);g.stroke();g.restore();g.strokeStyle=line;g.lineWidth=F*.95;g.stroke();
 const x0=(W-tw)/2,y0=5;
 for(const [ox,oy,cc] of [[.7,.8,'#1a0806'],[0,0,'#fffbe6']])for(let n=0;n<txt.length;n++){const gl=HSD[txt[n]];if(!gl)continue;g.fillStyle=cc;for(let r=0;r<5;r++)for(let q=0;q<3;q++)if(gl[r*3+q]==='1')g.fillRect((x0+n*4+q+ox)*F,(y0+r+oy)*F,F,F)}
 b={c,W,H};if(HSC.size>120)HSC.delete(HSC.keys().next().value);HSC.set(key,b);return b}
function hsDraw(p){const b=hsBake(p.hs,p.tx),q=ISO.toCanvas(p.x,p.y,TER.standZ(p.x,p.y)),s=ISO.scale(),px=Math.max(2,Math.round(s*1.1)),age=1.2-p.l,al=Math.min(1,p.l/.3),
  rise=Math.min(age*40,6)*px*.5,x=Math.round(q.x-b.W*px/2+p.jx*px),y=Math.round(q.y-p.h*SPR*s-b.H*px/2-rise);
 ctx.setTransform(1,0,0,1,0,0);ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.globalAlpha=al;ctx.drawImage(b.c,x,y,b.W*px,b.H*px);ctx.restore()}
// ---- F5-C · efectos del golpe máximo (daño amarillo), en coordenadas de pantalla y pixelados como los hitsplats: 'star' (estallido de 8 rayos en el objetivo), 'thrust' (estocada: estela dorada de la mano al objetivo),
// 'punch' (puñetazo: estela + onda circular). Los proyectiles (flecha/orbe) se dibujan en drawPJ con la variante hv. Todo vive ≤0,4 s; no se guarda.
let HFX=[];
function drawHFX(now){if(!HFX.length)return;HFX=HFX.filter(f=>now-f.t0<f.d);const s=ISO.scale(),k=SPR*s,px=Math.max(2,Math.round(s));ctx.setTransform(1,0,0,1,0,0);ctx.save();ctx.imageSmoothingEnabled=false;
 const sq=(x,y,c,a)=>{ctx.globalAlpha=Math.max(0,a);ctx.fillStyle=c;ctx.fillRect(Math.round(x/px)*px,Math.round(y/px)*px,px,px)};
 HFX.forEach(f=>{const u=(now-f.t0)/f.d,B=ISO.toCanvas(f.tx,f.ty,TER.standZ(f.tx,f.ty)),bx=B.x,by=B.y-f.th*k;
  if(f.k==='star'||f.k==='punch'){for(let r=0;r<8;r++){const an=r*Math.PI/4+(f.k==='punch'?.39:0),r0=(2+u*5)*px,r1=r0+(4+(r%2?0:3))*px*(1-u*.5);for(let d=r0;d<=r1;d+=px)sq(bx+Math.cos(an)*d,by+Math.sin(an)*d,d>r1-px*1.5?'#ffe629':'#fff6b0',1-u)}}
  if(f.k==='punch'&&u<.9){const R0=(3+u*12)*px;for(let i=0;i<20;i++){const an=i*Math.PI/10;sq(bx+Math.cos(an)*R0,by+Math.sin(an)*R0*.8,'#ffd23a',.9-u)}}
  if(f.k==='thrust'||f.k==='punch'){const A0=ISO.toCanvas(f.x,f.y,TER.standZ(f.x,f.y)),ax=A0.x,ay=A0.y-20*k,dx=bx-ax,dy=by-ay,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,head=Math.min(1,u*3.2),tail=Math.max(0,head-.55);
   for(let t=tail;t<=head;t+=px/L){const w=(t-tail)/(head-tail||1),a=(1-u)*(.25+.75*w);for(let o=-1;o<=1;o++){if(o&&w<.5)continue;sq(ax+dx*t+nx*o*px,ay+dy*t+ny*o*px,o?'#ffd23a':'#fffbe0',a)}}}});
 ctx.restore()}
// proyectil en pantalla: arma normal = flecha fina / orbe; hv (golpe máximo) = flecha dorada gruesa con estela, u orbe grande con aro y chispas
function drawPJ(p,now){const s=ISO.scale(),k=SPR*s,px=Math.max(2,Math.round(s)),u=Math.min(1,(now-p.t0)/(p.t1-p.t0)),A0=ISO.toCanvas(p.x,p.y,TER.standZ(p.x,p.y)),B0=ISO.toCanvas(p.tx,p.ty,TER.standZ(p.tx,p.ty)),
  ax=A0.x,ay=A0.y-p.sh*k,bx=B0.x,by=B0.y-p.th*k,pos=v=>[ax+(bx-ax)*v,ay+(by-ay)*v-Math.sin(v*Math.PI)*8*k],[x,y]=pos(u),an=Math.atan2(by-ay,bx-ax),ca=Math.cos(an),sa=Math.sin(an);
 ctx.setTransform(1,0,0,1,0,0);ctx.save();
 const sq=(X,Y,c,a)=>{ctx.globalAlpha=Math.max(0,a);ctx.fillStyle=c;ctx.fillRect(Math.round(X/px)*px,Math.round(Y/px)*px,px,px)};
 if(p.wt==='r'){if(p.hv){ctx.imageSmoothingEnabled=false;for(let i=0;i<22;i++){const v=Math.max(0,u-i*.012),[X,Y]=pos(v);sq(X,Y,i<9?'#fffbe0':'#ffd23a',(1-i/22)*.9)}
    for(let i=0;i<7;i++)sq(x-ca*i*px*1.6,y-sa*i*px*1.6,i<2?'#fff':'#ffb830',1);sq(x+ca*px,y+sa*px,'#fff',1);sq(x+ca*px*2,y+sa*px*2,'#ffd23a',1)}
  else{ctx.strokeStyle='#d8c9a3';ctx.lineWidth=2*s*.7;ctx.beginPath();ctx.moveTo(x-ca*8*s,y-sa*8*s);ctx.lineTo(x+ca*4*s,y+sa*4*s);ctx.stroke()}}
 else if(p.hv){ctx.imageSmoothingEnabled=false;const col=p.col||ORB[tierOf(S.eq.w||'st_pino')]||'#9cf';for(let i=0;i<14;i++){const [X,Y]=pos(Math.max(0,u-i*.014));ctx.globalAlpha=(1-i/14)*.5;ctx.fillStyle=col;const r=Math.max(px,Math.round((7-i*.35)*s/px)*px);ctx.fillRect(Math.round((X-r/2)/px)*px,Math.round((Y-r/2)/px)*px,r,r)}
  ctx.globalAlpha=.95;ctx.fillStyle=col;const R1=Math.round(9*s/px)*px;ctx.fillRect(Math.round((x-R1/2)/px)*px,Math.round((y-R1/2)/px)*px,R1,R1);ctx.fillStyle='#fff';const R2=Math.round(4.5*s/px)*px;ctx.fillRect(Math.round((x-R2/2)/px)*px,Math.round((y-R2/2)/px)*px,R2,R2);
  for(let i=0;i<8;i++){const a2=i*Math.PI/4+u*9;sq(x+Math.cos(a2)*8*s,y+Math.sin(a2)*8*s,'#ffe629',.9)}}
 else{ctx.globalAlpha=.8;ctx.fillStyle=p.col||ORB[tierOf(S.eq.w||'st_pino')]||'#9cf';ctx.beginPath();ctx.arc(x,y,6*s,0,7);ctx.fill()}
 ctx.restore()}
function splat(x,y,d,c,hgt){parts.push({x,y,vx:0,vy:0,g:0,l:1.2,tx:String(d),hs:(d>0||c)?(c||'#d4261c'):'#2f6fdc',h:hgt||0,jx:Math.round((Math.random()-.5)*3)})}
// Comer es manual: clic en la comida del inventario. La cura es PROGRESIVA: cada bocado añade a la cola HOT y cada ~0,6 s se aplica un paso con un «+N» verde.
let HOT=[],EATCD=0;
const hotLeft=()=>HOT.reduce((a,h)=>a+h.left,0);
function hotTick(now){if(!HOT.length)return;if(P.hp<=0){HOT=[];return}
 for(const h of HOT)if(now>=h.t){h.t=now+600;const d=Math.min(h.step,h.left,Math.max(0,maxHp()-P.hp));h.left-=h.step;if(d>0){P.hp+=d;splat(P.x,P.y,'+'+d,'#2f9a3a',30);sp(P.x,P.y+2,'#6fe07a',3,26,24,-30);dirty=1}else h.left=0}
 HOT=HOT.filter(h=>h.left>0);if(HOT.length&&Math.random()<.25)sp(P.x+(Math.random()-.5)*14,P.y+3,'#8ff09a',1,6,26,-30)}
function die(){if(INT)leaveRoom(1);snd('die');HOT=[];P.pjM=null;M.forEach(m=>m.hunt=0);P.hp=maxHp();{const q=spawnOf(curB);P.x=q.x;P.y=q.y}FD=performance.now();P.g=P.mv=null;stopA();toast('☠️ Moriste. Despiertas en el campamento.');log('Moriste. Come comida cocinada para sobrevivir.')}
const MB={};BI.forEach((b,k)=>{[...b.mobs.ing,b.mobs.pack,'b'+k,...(b.camp?['orco']:[])].forEach(id=>MB[id]=k)}); // monstruo → bioma al que pertenece (jefe que lo cierra)
Object.assign(MB,{bandido:0,k0:0,oso:1,k1:1,bruja:2,k2:2,gigante:3,k3:3,shinobi:4,k4:4,golem:5,k5:5});
const CAPN=['Guarida de bandidos','Cueva del oso','Aquelarre','Fortaleza del gigante','Dojo de sombras','Forja del coloso'];
function addLoot(id,gx,gy){const it=LOOT[id],c=RAR[it.r][1];if(gx!=null)dropGround(id,gx,gy);else if(room(id))S.inv.push(id);else{S.bank[id]=(S.bank[id]||0)+1;log('Tu mochila está llena: '+I[id][0]+' fue al banco.')}
 disc(id);inc('loot:'+it.r);log('<span style="color:'+c+'">¡Botín '+RAR[it.r][0].toLowerCase()+': '+I[id][0]+'!'+(gx!=null?' (en el suelo)':'')+'</span>');
 if(it.r>=2)toast('<span style="color:'+c+'">'+RAR[it.r][0]+'</span><br><b style="color:'+c+'">'+ic(id)+' '+I[id][0]+'</b>',it.r>=3?5500:3500);
 if(gx==null)sp(P.x,P.y-20,c,it.r*12,150,130,170);else sp(gx,gy-10,c,it.r*8,120,100,150);snd(it.r>=3?'epic':it.r===2?'rare':'coin');dirty=1}
function rollLoot(m,bm){const k=MB[m.d.id],dl=Math.max(0,m.lv-m.d.lv),mu=(1+.25*S.luck+.015*dl+pv('prosp')/100)*(1+Math.min(1,S.pity/400)),r=Math.random(),pE=.00015*mu*(bm||1),pB=.0011*mu*(bm||1),pG=.011*mu*(bm||1);   // lote D4: verde 3,4 %→1,1 %, azul 0,45 %→0,11 %, épico 0,018 %→0,015 % (pedido: que un raro se sienta)
 let q=0;if(r<pE)q=3;else if(r<pE+pB)q=2;else if(r<pE+pB+pG)q=1;if(!q){S.pity++;return}S.pity=0;const sl=['h','f','r','n','w','c','s','l','g','m'][R(0,9)];addLoot(sl==='w'?'lw_'+k+'dmbc'[R(0,3)]+q:'lt_'+k+sl+q,m.x,m.y)}
const BRESP=BI.map(b=>b.bossResp),BRN=BI.map(b=>b.bossRunes),RNN={air:'aire',earth:'tierra',life:'vida',water:'agua',fire:'fuego',arc:'arcana'};
function bossKill(m,now){const bk=MB[m.d.id],first=!S.boss[bk];S.boss[bk]=1;const got=BRN[bk].map(([k,a,b])=>{const n=R(a,b);S.runes[k]=(S.runes[k]||0)+n;disc('rn_'+k);return n+' de '+RNN[k]});log('👑 Runas del jefe: '+got.join(', '));
 banner('👑 ¡'+m.d.n+' ha caído!',(first?(bk<BIOMES.N-1?'El camino a '+BI[bk+1].n+' se abre':'¡Has derrotado al último jefe!'):'Runas: '+got.join(', '))+' · reaparece en '+BRESP[bk]+' s','#ff9a3a',5200);snd('epic');sp(m.x,m.y-20,'#ffd100',30,160,140,180);dirty=1}
// Sello del capitán (progresión v2): el jefe de cada bioma está SELLADO hasta derrotar al capitán de su guarida (S.key[bioma]); es lo que obliga a visitar el campamento extra
const sealed=m=>m.d.boss===1&&!S.key[MB[m.d.id]];
function capKill(m,now){const k=MB[m.d.id],first=!S.key[k];S.key[k]=1;if(first){S.st.caps=(S.st.caps||0)+1;banner('🗝️ ¡Sello conseguido!','Ya puedes desafiar a '+MD['b'+k].n,'#6ad0ff',4800);snd('epic');sp(m.x,m.y-20,'#6ad0ff',26,140,120,160);log('<span style="color:#6ad0ff">🗝️ Sello de '+BI[k].n+': el jefe '+MD['b'+k].n+' ya no está protegido.</span>')}else log('Capitán derrotado (ya tenías el sello).');dirty=1;save()}
function bossHTML(){const now=performance.now();return '<div style="margin-top:12px;border-top:2px dashed var(--hi);padding-top:6px">👑 Jefes (abren el camino)<div class="hint" style="margin:0">'+BI.map((_,k)=>k).map(k=>{const m=M.find(x=>x.d.id==='b'+k),dead=m&&!alive(m,now);return (S.boss[k]?'✔ ':'🔒 ')+MD['b'+k].n+(S.boss[k]?'':S.key[k]?' · 🗝️ sello obtenido':' · sellado: derrota a '+MD['k'+k].n+' ('+CAPN[k]+')')+(dead?' · reaparece en '+Math.ceil((m.rt-now)/1000)+' s':'')}).join('<br>')+'</div></div>'}
const RUD={gallina:[['air',1,3,.7]],vaca:[['earth',1,3,.4]],goblin:[['air',2,6,.6],['earth',1,4,.4]],orco:[['earth',2,6,.5],['life',1,3,.3]],jabali:[['life',1,3,.4]],lobo:[['air',3,8,.5],['earth',3,6,.4]],rana:[['water',2,6,.6]],esqueleto:[['earth',3,8,.5],['life',2,5,.4]],yak:[['water',2,5,.4]],ogro:[['fire',2,5,.4],['earth',4,8,.4]],lagarto:[['fire',2,6,.6]],demonio:[['fire',3,8,.5],['arc',1,2,.25]],bandido:[['air',2,5,.5],['earth',1,3,.3]],oso:[['earth',2,5,.5],['life',1,4,.4]],bruja:[['water',3,8,.6],['arc',1,3,.4],['life',2,5,.4]],gigante:[['water',3,8,.5],['fire',2,6,.4]],shinobi:[['air',4,10,.6],['arc',2,4,.4]],golem:[['earth',4,10,.6],['fire',3,8,.5],['arc',2,5,.4]],
 k0:[['air',4,8,1],['earth',3,6,1]],k1:[['earth',5,10,1],['life',4,8,1]],k2:[['water',6,12,1],['life',4,8,1],['arc',2,4,1]],k3:[['water',6,12,1],['fire',4,8,1],['arc',2,4,1]],k4:[['air',8,16,1],['arc',4,8,1]],k5:[['earth',8,16,1],['fire',6,12,1],['arc',4,8,1]]};
const DRMAX=.75;   // lote D4: ningún drop supera el 75 % (antes casi todo era 100 %); bajan según rareza (ver MD[].dr). Las runas de los monstruos ×0.6.
function kill(m,now){const d=m.d;snd('kill');m.rt=now+(d.boss===1?BRESP[MB[d.id]]*1000:d.boss===2?120000:12000);const dl=Math.max(0,m.lv-d.lv);earn(Math.round(R(d.co[0],d.co[1])*(1+.05*dl)*(1+pv('prosp')/100)));MN=Math.min(mnMax(),MN+Math.round(pv('siph')));d.dr.forEach(([id,p])=>{if(Math.random()<Math.min(DRMAX,p*(1+.03*dl)))dropGround(id,m.x,m.y)});(RUD[d.id]||[]).forEach(([k,a,b,p])=>{if(Math.random()<Math.min(DRMAX,p*.6*(1+.03*dl))){const n=R(a,b);S.runes[k]=(S.runes[k]||0)+n;disc('rn_'+k);log('<span style="color:#c8a0ff">+'+n+' runa'+(n>1?'s':'')+' de '+RNN[k]+'</span>')}});
 if(d.rare&&Math.random()<(1+.25*S.luck+.02*dl)/d.rare[1]){add(d.rare[0]);inc('rare');snd('rare');toast(ic(d.rare[0])+' ¡Drop raro: <b>'+I[d.rare[0]][0]+'</b>!',3000)}
 inc('kill:'+d.id);log('Mataste a '+d.n+' (nv. '+m.lv+').');if(d.boss===1)bossKill(m,now);else if(d.boss===2)capKill(m,now);rollLoot(m,d.boss===1?3:d.boss===2?2:1);if(m.tmp){qMobDead(m);dirty=1;return}rollLv(m);dirty=1}
function fin(now){const{ty,sk,i,e}=A,a=ACT[sk][i],cb=sk==='co'?count(a[2]):0;if(!stepAct(sk,i)){stopA();return}
 if(ty==='c'){A.left--;if(sk==='co'&&count(a[2])>cb&&Math.random()<BONUSP+.04*S.cfg){BL=A.left;dirty=1;save();stopA();startBonus(i);return}
  if(!hasIn(a[1])){dirty=1;save();stopA('Te quedaste sin materiales.');return}if(A.left<=0){dirty=1;save();stopA('Listo: terminaste la tanda.');return}}
 if(ty==='g'&&e.g){gain(sk,xv(ACT[sk][i])*4);earn(20+L(sk)*2);toast('✨ ¡Recurso dorado! Bonus de XP y oro');snd('rare')}if(ty==='g'){e.rt=now+{wc:9000,mi:6000,fi:5000}[sk];reseek(e,now);relocate(e)}
 dirty=1;save()}
function hitM(m,d,now,sk,mxv){if(!alive(m,now))return;m.lx=m.x;m.ly=m.y;m.hp-=d;m.fl=now+120;snd(d?'hit':'miss');const mx=d>=2&&d>=(mxv||maxHit());splat(m.x,m.y,d,mx?'#d8a020':null,m.d.h+6);if(mx){sp(m.x,m.y-m.d.h/2,'#ffe629',10,90,70,160);SHK=now+160;HFX.push({k:'star',tx:m.x,ty:m.y,th:m.d.h/2,t0:now,d:380})}if(d)gain(sk||WSK(),d*xpMul(m));if(m.hp<=0){kill(m,now);if(A&&A.e===m)reseek(m,now)}}
const inVilla=(x,y)=>{const k=biomeAt(x,y);if(k<0)return false;const b=BI[k],v=b.village.safe||[210,770,245,225];return Math.abs(x-(b.ox+v[0]))<v[2]&&Math.abs(y-(b.oy+v[1]))<v[3]}; // zona segura de la aldea (BIOMES.list[k].village.safe = [cx,cy,semiancho,semialto])
function monHit(m,now){m.at0=now;P.pjM=m;P.pj=now+4800;const d0=Math.random()<monAcc(m)?R(0,m.dm):0,d=d0?Math.max(0,d0-Math.round(pv('stone'))):0;P.hp-=d;splat(P.x,P.y,d,null,26);
 if(d){snd('hurt');HURT=now;if(d>=maxHp()*.25)SHK=now+200;if(Math.random()*100<pv('thorns'))hitM(m,2,now,WSK(),99)}
 if(P.hp>0&&P.hp<maxHp()*.3&&pv('last')>0&&now>LSCD){P.hp=Math.min(maxHp(),P.hp+Math.ceil(maxHp()*pv('last')/100));LSCD=now+60000;toast('💖 ¡Segundo aliento!');snd('magic')}
 if(P.hp<=0)die()}
function procs(m,d,hit,now){if(d>0){if(Math.random()*100<pv('life')){P.hp=Math.min(maxHp(),P.hp+1);splat(P.x,P.y,1,'#2f9a3a',26)}if(Math.random()*100<pv('bleed'))m.bleed={n:3,t:now+600};if(Math.random()*100<pv('stun'))m.nt=Math.max(m.nt||0,now)+1200}
 if(Math.random()*100<pv('double'))hitM(m,hit?R(1,maxHit()):0,now)}
function act(now){if(!A)return;
 if(A.ty==='f'){const m=A.e,dd=Math.hypot(P.x-m.x,P.y-m.y);if(dd>(wtype()==='m'?75:210)){if(!m.hunt)stopA();return}
  if(now>=A.ph&&now>=ATKT){A.lh=now;A.ph=now+A.ms;ATKT=now+A.ms;if(!(P.pjM&&P.pjM!==m&&now<P.pj&&alive(P.pjM,now)&&P.pjM.hunt)){P.pjM=m;P.pj=now+4800}const wt=wtype(),N0=A.nx&&A.nx.m===m&&A.nx.wt===wt?A.nx:rollAtk(m),hit=N0.hit,d1=N0.d1,d=d1&&m.hp<=m.mh*.25?Math.round(d1*(1+pv('exec')/100)):d1,hv=!!N0.heavy;A.nx=null;
   if(specTry(m,now,wt)){}else if(wt==='m'){if(hv)HFX.push({k:wColor()?'thrust':'punch',x:P.x,y:P.y,tx:m.x,ty:m.y,th:m.d.h/2,t0:now,d:300});hitM(m,d,now);procs(m,d,hit,now)}else if(wt==='g'){const si=autoSpell();if(si>=0)fireSpell(si,m,now,N0.sp&&N0.sp.si===si?N0.sp:null);else hitM(m,hit?1:0,now,'mg',1)}else{PJ.push({x:P.x,y:P.y,sh:14,tx:m.x,ty:m.y,th:m.d.h/2,t0:now,t1:now+(hv?260:150),m,d,wt,hv});snd('bow');procs(m,d,hit,now)}
   if(!A||A.e!==m)return;A.nx=rollAtk(m)}}
 else if(A.ty==='c'&&Math.hypot(P.x-A.e.x,P.y-A.e.y)>80)stopA();
}
function offline(el,sk,i){const a=ACT[sk][i],n=Math.min(4000,Math.floor(Math.min(el,2.88e7)/dur(sk,a)));let k=0;const x0=S.xp[sk];while(k<n&&stepAct(sk,i,1))k++;
 if(k){const m=k+'x '+a[0]+', +'+fmt(S.xp[sk]-x0)+' XP';log('Mientras no estabas ('+Math.round(el/60000)+' min): '+m);toast('💤 Progreso offline<br>'+SK[sk][1]+' '+m,4000)}}
const CM=10, // margen (px de mundo) antes de la pared: el jugador se detiene un poco antes de pisarla (F1-C4b)
cliff=(x,y)=>TER.cliffNear(x,y,CM),lockedAt=(x,y)=>{const k=biomeAt(x,y);return k<0||(k>0&&!S.boss[k-1])},   // vacío o bioma aún cerrado (jefe anterior vivo)
blk=(x,y)=>INT?intBlk(x,y):x<8||x>WW-8||y<30||y>WH-28||lockedAt(x,y)||cliff(x,y)||PROPS.solid(x,y)||TER.heightAt(x,y)<1;   // agua (altura .75) o vacío (0): el agua sale de TER (BIOMES.geo), ya no hay rectángulos BLK
// Movimiento en sub-pasos de <=3 px: ningún dt grande ni buff de velocidad puede «saltar» por encima de una pared (los tiles de pared miden 32 px, el margen CM=10).
function step(ax,ay){const n=Math.max(1,Math.ceil(Math.max(Math.abs(ax),Math.abs(ay))/3)),sx=ax/n,sy=ay/n;for(let i=0;i<n;i++){const nx=P.x+sx,ny=P.y+sy;if(blk(nx,ny))break;P.x=nx;P.y=ny}}
// TOPE DURO (requisito del dueño: el borde del mapa es infranqueable). Se ejecuta al final del movimiento de cada frame y NO depende de blk()/BLK/cliff():
// (1) rectángulo jugable derivado de los tiles de borde (dibujados por TER), (2) si el jugador acabó sobre un tile de acantilado o tras una compuerta cerrada,
// vuelve a la última posición válida (o al campamento si no hay). Cubre teletransporte, reaparición, partida guardada con coordenadas malas, lag, etc.
let GOOD=null;
const spawnK=()=>{let k=Math.min(BIOMES.N-1,Math.max(0,curB));while(k>0&&!S.boss[k-1])k--;return k}; // bioma más lejano alcanzable (≤ curB) con las compuertas actuales
function guard(){const T=ISO.TILE,xm=T+CM,xM=(TER.NX-1)*T-CM,ym=T+CM,yM=Math.floor((WH-28)/T)*T-CM;
 if(!isFinite(P.x)||!isFinite(P.y)){const q=spawnOf(spawnK());P.x=q.x;P.y=q.y}
 P.x=Math.min(xM,Math.max(xm,P.x));P.y=Math.min(yM,Math.max(ym,P.y));
 const th=TER.tileH(Math.floor(P.x/T),Math.floor(P.y/T)),bad=th>=2||th===0||lockedAt(P.x,P.y);
 if(!bad){GOOD={x:P.x,y:P.y};return}
 if(GOOD){P.x=GOOD.x;P.y=GOOD.y}else{const q=spawnOf(spawnK());P.x=q.x;P.y=q.y;GOOD={x:P.x,y:P.y}}}
// fase del golpe (0..1): el impacto ocurre cuando llega a 1, justo al aplicar el daño o completar la acción
let ATKT=0,CK=null,RUN=0,EN=100,MN=4,MNl=0,LSCD=0,PJ=[],STK=0,LASTX=null,BT=0,FREEC=0,MM=1,LD=0;   // MM: 0 oculto · 1 minimapa · 2 mapa grande (tecla M)
const mnMax=()=>3+L('mg')+gs('mana')+2*S.mana2+(STF[S.eq.w]||0)*2,mreg=()=>.025+L('mg')*.0004+gs('mreg')*MRU+.006*S.mreg2+(STF[S.eq.w]||0)*.002+(S.buf.mreg>Date.now()?.12:0);const enMax=()=>100,ENREG=.5; // ENERGÍA = barra de ESPECIAL del arma (como OSRS): 100 máx., +10 % cada 20 s; correr ya no gasta

const autoBtn=()=>{const b=$('#autob');if(b)b.textContent='🎯 Auto-objetivo: '+(S.auto?'SÍ':'NO')},tgAuto=()=>{S.auto=S.auto?0:1;autoBtn();save()},runBtn=()=>{const b=$('#runb');if(b)b.textContent='🏃 Correr: '+(RUN?'SÍ':'NO')+' (R)'},tgRun=()=>{RUN=RUN?0:1;runBtn()};
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
 PJ.push({x:P.x,y:P.y,sh:14,tx:m.x,ty:m.y,th:m.d.h/2,t0:now,t1:now+(hv?260:180),m,d,wt:'g',sk:'mg',mxv:mx,col:s.col,hv});snd('magic');inc('cast');gain('mg',s.xp);dirty=1}
function cast(i,free){const s=SPL[i],now=performance.now();if(L('mg')<s.lv){log('Necesitas Magia nivel '+s.lv+'.');return false}if(!free&&MN<s.mp){log('Te falta maná.');return false}if(!free&&!hasRunes(s.r)){log('Te faltan runas: las sueltan los monstruos.');return false}
 FREEC=free?1:0;
 if(s.atk){if(now<ATKT){FREEC=0;return false}const m=spellTarget();if(!m){FREEC=0;log('No hay ningún enemigo cerca para lanzar el hechizo.');return false}ATKT=now+atkMs();if(!A||A.e!==m){stopA();P.g=null;startF(m,now)}P.f=m.x-m.y>=P.x-P.y?1:-1;fireSpell(i,m,now);FREEC=0;log('Lanzas '+s.n+(free?' (pergamino)':'')+'.');save();return true}
 pay(s);FREEC=0;const t=Date.now()+60000;
 if(s.id==='heal')P.hp=Math.min(maxHp(),P.hp+8+Math.floor(L('mg')/2));else if(s.id==='gheal')P.hp=Math.min(maxHp(),P.hp+40+L('mg'));else if(s.id==='haste')S.buf.spd=Math.max(S.buf.spd||0,t);else if(s.id==='skin')S.buf.def=t;else if(s.id==='recall'){stopA();P.g=P.mv=null;{const q=spawnOf(curB);P.x=q.x;P.y=q.y}FD=performance.now()}else if(s.id==='wis')S.buf.xp=Math.max(S.buf.xp||0,t);
 sp(P.x,P.y-16,'#c8a0ff',14,80,70,120);snd('magic');inc('cast');gain('mg',s.xp);log('Lanzas '+s.n+(free?' (pergamino)':'')+'.');dirty=1;save();return true}
function tpv(sk,id){const it=TOOLT[S.eq[sk]];let t=0;if(it&&it.pa)it.pa.forEach(p=>{if(p.id===id)t+=p.v});return t}
function setPer(np){const now=performance.now(),ph=swPh(now);A.per=np;A.t0=now-ph*np;A.lp=ph}
function hitMul(now){if(A.ty!=='g')return 1;const sk=A.sk;let m=1;
 if(A.fr&&now>A.fr){A.fr=0;setPer(A.base)}
 if(!A.fr&&Math.random()*100<tpv(sk,'frenzy')){A.fr=now+5000;setPer(A.base/2);sp(A.e.x,A.e.y-16,'#ffd100',14,80,70,160);snd('rare');log('<span style="color:#ffd100">⚡ ¡Frenesí! Velocidad x2 durante 5 s.</span>')}
 if(Math.random()*100<tpv(sk,'precise')){m=2;sp(A.e.x,A.e.y-12,'#ffffff',8,60,50,120)}return m}
function actLabel(){const sk=A.sk,a=ACT[sk][A.i],v=sk==='sm'?(String(a[2]).startsWith('b_')?'Fundir':'Forjar'):({wc:'Talar',mi:'Minar',fi:'Pescar',co:'Cocinar',cr:'Fabricar',es:'Esculpir',ins:'Inscribir'}[sk]||'Trabajar');return (TOOLS[sk]?v+', '+TOOLS[sk][0].toLowerCase()+' '+tn(sk,S.tool[sk]):v+': '+a[0])+(A.fr?' ⚡':'')}
function swPh(now){if(A.ty==='f')return Math.max(0,Math.min(1,1-(A.ph-now)/(A.ms||1800)));const p=A.per||900;return(((now-A.t0)%p)+p)%p/p}
let ZC=-1,ZB=null;const ZT={};
// descubrimiento (minimapa): una zona/guarida/punto de interés se marca al acercarse (borde + 90 px); la aldea a <420 px de su centro; el jefe a <650 px. Se guarda en S.map.
function discover(){const R=BI[curB],mk=(key,msg)=>{if(S.map[key])return;S.map[key]=1;if(msg)log('🗺️ Descubierto: '+msg);dirty=1};
 ZS.forEach((z,i)=>{if(z.k===curB&&!S.map['z'+i]&&P.x>z.r[0]-90&&P.x<z.r[1]+90&&P.y>z.r[2]-90&&P.y<z.r[3]+90)mk('z'+i,z.t)});
 if(Math.hypot(P.x-(R.ox+R.cen[0]),P.y-(R.oy+R.cen[1]))<420)mk('v'+curB);if(Math.hypot(P.x-(R.ox+R.bossPos[0]),P.y-(R.oy+R.bossPos[1]))<650)mk('b'+curB)}
function zoneCheck(now){discover();let b=-1,ba=1e12;ZS.forEach((z,i)=>{if(z.k!==curB||P.x<z.r[0]||P.x>z.r[1]||P.y<z.r[2]||P.y>z.r[3])return;const a=(z.r[1]-z.r[0])*(z.r[3]-z.r[2]);if(a<ba){ba=a;b=i}});
 if(b!==ZC){ZC=b;if(b>=0&&now-(ZT[b]||-1e9)>8000){ZT[b]=now;ZB={t:ZS[b].t,t0:now}}}}
// ===== v29: clima, efectos de pantalla, decoración animada, sprites =====
let WX={t:'',end:0,next:0,nl:0},WXD=0,FL=0,THU=0,FD=0,XD=[],XN=0,BAN=null;const MMC=[];
SND.eat=()=>{[0,170,340].forEach(d=>setTimeout(()=>{noise(.07,.11,2200+d,'bandpass');tone(180,.05,'triangle',.05,-60)},d));setTimeout(()=>tone(300,.12,'sine',.05,-120),620)};
SND.thunder=()=>{noise(1.1,.3,160,'lowpass');noise(.6,.18,420,'lowpass')};
// mapa base de un bioma (F9-L2): se pinta una vez desde TER (agua, arena, montículos, riscos) + caminos; el minimapa lo escala y encima dibuja iconos de lo descubierto
const MMW=196,MMH=128,MBW=588,MBH=384;
function mmk(k){const c=document.createElement('canvas');c.width=MBW;c.height=MBH;const q=c.getContext('2d'),R0=BI[k],T=ISO.TILE,Pk=TER.PAL[k],nx=Math.round(R0.w/T),ny=Math.round(R0.h/T),tx0=Math.round(R0.ox/T),ty0=Math.round(R0.oy/T),sc=MBW/nx,sy=MBH/ny,mx=PAINT.mix;
 q.fillStyle=Pk.g;q.fillRect(0,0,MBW,MBH);
 for(let ty=0;ty<ny;ty++)for(let tx=0;tx<nx;tx++){const h=TER.tileH(tx0+tx,ty0+ty);let col;
  if(h===0)col='#1a1a1a';else if(h<1)col=Pk.w;else if(h>=2)col='#8f8a80';else if(TER.rk(tx0+tx,ty0+ty))col=mx('#a8a398','#ece8dc',(h-1)*.8);else{const sd=TER.sandAt(tx0+tx,ty0+ty);col=sd>.45?'#e3d199':h>1?mx(Pk.g,'#f2f6c8',Math.min(.6,(h-1)*.9)):Pk.g}
  if(col!==Pk.g){q.fillStyle=col;q.fillRect(tx*sc,ty*sy,sc+.7,sy+.7)}}
 q.fillStyle=mx(Pk.g,'#1e4a1e',.45);N.forEach(e=>{if(e.fix&&biomeAt(e.x,e.y)===k)q.fillRect((e.x-R0.ox)*MBW/R0.w-1.2,(e.y-R0.oy)*MBH/R0.h-1.2,2.6,2.6)});   // bosques (árboles fijos)
 q.strokeStyle='#c9a46a';q.lineWidth=2.6;q.lineJoin='round';q.lineCap='round';for(const r of R0.routes){q.beginPath();r.forEach((p,i)=>i?q.lineTo(p[0]*MBW/R0.w,p[1]*MBH/R0.h):q.moveTo(p[0]*MBW/R0.w,p[1]*MBH/R0.h));q.stroke()}
 return c}
const BDC={},BDS=2;function stBadge(id,em,r){const k=id+Math.round(r*10);let c=BDC[k];if(c)return c;c=BDC[k]=document.createElement('canvas');const n=Math.ceil((r+2)*2*BDS);c.width=c.height=n;const q=c.getContext('2d');q.scale(BDS,BDS);const h=n/BDS/2;q.fillStyle='#3a2a1c';q.beginPath();q.arc(h,h,r,0,7);q.fill();q.strokeStyle='#e8b84a';q.lineWidth=r>7?1.8:1.2;q.stroke();const mk=ITEMICON.marker(em);if(mk)q.drawImage(mk,h-r*.8,h-r*.8,r*1.6,r*1.6);else{q.font=Math.round(r*1.25)+'px sans-serif';q.textAlign='center';q.textBaseline='middle';q.fillStyle='#fff';q.fillText(em,h,h+.5)}return c} // insignias de instalaciones del mapa, pintadas una vez (el emoji por frame era caro)
function drawMap(now){const big=MM===2,mw=big?MBW:MMW,mh=big?MBH:MMH,mx=big?Math.round((W-mw)/2):W-mw-6,my=big?Math.max(44,Math.round((H-mh)/2)):44,R0=BI[curB],x0=R0.ox,y0=R0.oy,sx=mw/R0.w,sy=mh/R0.h,sz=big?17:11;
 ctx.save();ctx.imageSmoothingEnabled=true;UI.plate(ctx,mx-5,my-5,mw+10,mh+10,{r:6});ctx.drawImage(MMC[curB]||(MMC[curB]=mmk(curB)),mx,my,mw,mh);
 ctx.strokeStyle='#ffffff99';ctx.lineWidth=1;ctx.strokeRect(mx+(cx-x0)*sx,my+(cy-y0)*sy,W*sx,H*sy);
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
 const ic=(e,x,y,lb)=>{const px=mx+(x-x0)*sx,py=my+(y-y0)*sy,mk=ITEMICON.marker(e);if(mk)ctx.drawImage(mk,px-sz*.65,py-sz*.65,sz*1.3,sz*1.3);else{ctx.font=sz+'px sans-serif';ctx.fillStyle='#fff';ctx.fillText(e,px,py)}if(big&&lb){ctx.font='13px VT323, monospace';ctx.lineWidth=3;ctx.strokeStyle='#000';ctx.strokeText(lb,px,py+sz*.9);ctx.fillStyle='#fff';ctx.fillText(lb,px,py+sz*.9)}};
 if(!(S.map['v'+curB]||curB===0))ic('❓',x0+R0.cen[0],y0+R0.cen[1],'Aldea desconocida');
 if(S.map['v'+curB]||curB===0){const SM={ru:['💬','Ru'],herreria:['⚒️','Herrería'],banco:['🏦','Banco'],tienda:['🛒','Tienda'],taberna:['🍺','Taberna'],taller:['🪚','Taller']},r=sz*(big?.62:.5);   // las instalaciones viven en las casas: se marcan las puertas
  ST.forEach(e=>{const key=e.id==='door'?e.room:e.id,m=SM[key];if(!m||biomeAt(e.x,e.y)!==curB)return;const x=e.x,y=e.y;
   const px=mx+(x-x0)*sx,py=my+(y-y0)*sy,bd=stBadge(key,m[0],r);ctx.drawImage(bd,px-bd.width/2/BDS,py-bd.height/2/BDS,bd.width/BDS,bd.height/BDS);
   if(big){const L={banco:['right',-r-4,0],tienda:['left',r+4,0],taller:['center',0,-r-8],herreria:['center',0,-r-8]}[key]||['center',0,r+8];ctx.textAlign=L[0];ctx.font='13px VT323, monospace';ctx.lineWidth=3;ctx.strokeStyle='#000';ctx.strokeText(m[1],px+L[1],py+L[2]);ctx.fillStyle='#fff';ctx.fillText(m[1],px+L[1],py+L[2]);ctx.textAlign='center'}})}
 ZS.forEach((z,i)=>{if(z.k!==curB||!S.map['z'+i])return;const t=z.t,sp=t.indexOf(' ');ic(t.slice(0,sp),(z.r[0]+z.r[1])/2,(z.r[2]+z.r[3])/2,t.slice(sp+1))});
 M.forEach(m=>{if(m.d.boss&&alive(m,now)&&biomeAt(m.x,m.y)===curB&&S.map['b'+curB])ic('💀',m.x,m.y,m.d.boss===2?'Capitán':'Jefe')});
 ctx.fillStyle=Math.floor(now/400)%2?'#ffffff':'#ffe629';ctx.fillRect(mx+(P.x-x0)*sx-2,my+(P.y-y0)*sy-2,4,4);ctx.restore()}
function banner(t,sub,c,dur){BAN={t,sub,c,t0:performance.now(),dur}}
function weather(now,dt){const k=curB;
 if(k>=3&&WX.t){WX.t='';WX.end=0}
 if(!WX.next)WX.next=now+R(40000,90000);
 if(now>WX.next){WX.next=now+R(60000,130000);if(!WX.t){const p=[.3,.35,.55,0,0,0][k];if(Math.random()<p){WX.t=(k===2&&Math.random()<.6)?'storm':'rain';WX.end=now+R(45000,90000);WX.nl=now+R(3000,8000);log(WX.t==='storm'?'⛈️ Se acerca una tormenta.':'🌧️ Empieza a llover.')}}}
 if(WX.t&&now>WX.end){log('☀️ Deja de llover.');WX.t=''}
 const tg=WX.t==='storm'?.36:WX.t==='rain'?.18:0;WXD+=(tg-WXD)*Math.min(1,dt*.7);
 if(WX.t==='storm'&&now>WX.nl){WX.nl=now+R(6000,15000);FL=.6;THU=now+R(350,900)}
 if(THU&&now>THU){THU=0;snd('thunder')}
 FL=Math.max(0,FL-dt*2.2);
 ST.forEach(e=>{if(e.id==='furnace'&&Math.abs(e.x-P.x)<420&&Math.abs(e.y-P.y)<320&&Math.random()<dt*2.5)sp(e.x+(SX?11:10),e.y-(SX?52:42),'#9a9a9a',1,8,16,-8);if(SX&&e.id==='fire'&&Math.abs(e.x-P.x)<420&&Math.abs(e.y-P.y)<320&&Math.random()<dt*(A&&A.e===e?5:2))sp(e.x+R(-5,5),e.y-24,'#ffb040',1,14,34,-6)})}
function hudFx(now){
 if(FL>.02){ctx.save();ctx.globalAlpha=Math.min(1,FL);ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);ctx.restore()}
 if(FD){const e=now-FD;if(e<900){ctx.save();ctx.globalAlpha=1-e/900;ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);ctx.restore()}else FD=0}
 XD=XD.filter(d=>now-d.t0<1500);XD.forEach(d=>{const a=(now-d.t0)/1500;ctx.save();ctx.globalAlpha=1-a*a;T(d.t+' '+d.i,84+((d.n%3)-1)*34,H-46-a*40,'#ffe629');ctx.restore()});
 if(BAN){const el=now-BAN.t0;if(el>BAN.dur)BAN=null;else{const u=Math.min(1,el/250),a=el>BAN.dur-700?(BAN.dur-el)/700:Math.min(1,u*1.5),sc=.6+.4*u+Math.sin(u*Math.PI)*.12;
  ctx.save();ctx.translate(W/2,H*.3);ctx.scale(sc,sc);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a*.3;ctx.fillStyle=BAN.c;
  for(let i=0;i<12;i++){const an=i*Math.PI/6+el/2500;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(an-.07)*200,Math.sin(an-.07)*75);ctx.lineTo(Math.cos(an+.07)*200,Math.sin(an+.07)*75);ctx.fill()}
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=a;ctx.textAlign='center';ctx.lineJoin='round';ctx.font='40px "Pixelify Sans", VT323, monospace';ctx.lineWidth=6;ctx.strokeStyle='#000';ctx.strokeText(BAN.t,0,0);ctx.fillStyle=BAN.c;ctx.fillText(BAN.t,0,0);
  if(BAN.sub){ctx.font='22px VT323, monospace';ctx.lineWidth=4;ctx.strokeText(BAN.sub,0,28);ctx.fillStyle='#fff';ctx.fillText(BAN.sub,0,28)}ctx.restore()}}}
const WN=t=>sunS(t)<-.05?'#ffd070':'#6a8ab0';
function upd(dt,now){if(!INT){zoneCheck(now);weather(now,dt);AMBI.update(now,dt,{k:curB,sun:sunS(now/1000),wx:WX.t});if(now-BT>1000){BT=now;if(M.some(m=>m.d.boss&&!alive(m,now)))dirty=1}const bi=biomeAt(P.x,P.y);if(bi>=0&&bi!==curB){curB=bi;if(bi+1>(S.st.bio||0)){S.st.bio=bi+1;chk()}toast(BI[bi].ic+' <b>'+BI[bi].n+'</b><br>Nivel recomendado: '+BI[bi].lv+'+')}}
 const kd=ISO.keyDir(K.l,K.r,K.u,K.d);let dx=kd.x,dy=kd.y;
 if(dx||dy){if(P.g||P.mv||A||CK){P.g=P.mv=null;stopA();CK=null}}
 else{const tg=P.g?P.g.e:P.mv;if(tg){const ex=tg.x-P.x,ey=tg.y-P.y,d=Math.hypot(ex,ey);
  if(d>(P.g?(P.g.e.d?(wtype()!=='m'?120:24):P.g.e.t==='fi'?FISHR:24):3)){const mt=P.g&&tg.st&&tg.st.length&&d>FISHR?(q=>({x:q[0],y:q[1]}))(tg.st.reduce((b,c)=>Math.hypot(c[0]-P.x,c[1]-P.y)<Math.hypot(b[0]-P.x,b[1]-P.y)?c:b)):tg,wp=bridgeWp(mt),wx=wp?wp.x-P.x:mt.x-P.x,wy=wp?wp.y-P.y:mt.y-P.y,wd=Math.hypot(wx,wy)||1;dx=wx/wd;dy=wy/wd}else if(P.g){const e=P.g.e;P.g=null;engage(e,now)}else P.mv=null}}
 P.mvg=0;if(dx||dy){const l=Math.hypot(dx,dy);dx/=l;dy/=l;const run=RUN,sv=95*(1+pv('swift')/100)*(1+.05*S.trv)*(S.buf.spd>Date.now()?1.35:1)*(run?1.15:1);const ox=P.x,oy=P.y;step(dx*sv*dt,0);step(0,dy*sv*dt);P.mvg=1;if(P.g&&Math.hypot(P.x-ox,P.y-oy)<.02)STK+=dt;else STK=0;if(STK>.4&&P.g){const e=P.g.e;if(Math.hypot(e.x-P.x,e.y-P.y)<(e.t==='fi'?FISHR+20:90)){P.g=null;STK=0;engage(e,now)}}if(run){S.agd=(S.agd||0)+sv*dt;if(S.agd>130){S.agd=0;gain('ag',1.5*XPR(L('ag')))}}if(Math.abs(dx-dy)>.01)P.f=dx-dy>0?1:-1;P.dir=HERO.dirOf(dx,dy);P.wr=sv*2*Math.PI/(RUN?STRR:STRW);P.w+=dt*P.wr;P.anm=1;P.wt=null}
 else if(P.anm)settle(dt)
 if(P.mvg&&now-LD>(RUN?90:260)){LD=now;sp(P.x-P.f*3,P.y-1,['#c8b890','#a89870','#7a8a6a','#e8f0f8','#6a5050'][curB],RUN?3:1,14,12,20)}
 EN=Math.min(enMax(),EN+dt*ENREG);MN=Math.min(mnMax(),MN+dt*mreg());if(TB==='mg'&&Math.floor(MN)!==MNl){MNl=Math.floor(MN);dirty=1}PJ=PJ.filter(p=>{if(now>=p.t1){hitM(p.m,p.d,now,p.sk,p.mxv);return false}return true});if(CK)cookUpd(dt,now);
 if(!INT)guard();act(now);dropUpd(now);hotTick(now);specTick(now);if(!INT)qTick(now);
 if(!(A&&A.ty==='f')&&now-lreg>12000){lreg=now;if(P.hp<maxHp()){P.hp++;dirty=1}}
 M.forEach(m=>{if(!alive(m,now))return;
  if(m.bleed&&now>=m.bleed.t){hitM(m,1,now,WSK(),99);if(!alive(m,now))return;m.bleed.t=now+600;if(--m.bleed.n<=0)m.bleed=null}
  const dx=P.x-m.x,dy=P.y-m.y,dp=Math.hypot(dx,dy),inV=inVilla(P.x,P.y),busy=P.pjM&&P.pjM!==m&&now<P.pj&&alive(P.pjM,now)&&P.pjM.hunt;
  if(m.d.ag&&!m.hunt&&!sealed(m)&&now>m.ag0&&dp<85&&!inV&&!busy&&P.hp>0&&CBL()*.8<m.lv*2){m.hunt=1;m.lx=null;m.nt=now+900;m.ag0=now+10000;log('<span style="color:#ff6a5a">¡'+m.d.n+' nv.'+m.lv+' te ataca!</span>');if(A&&A.ty!=='f')stopA()}
  if(m.hunt){const lx=m.lx==null?m.hx:m.lx,ly=m.lx==null?m.hy:m.ly;
   if(P.hp<=0||inV||Math.hypot(m.x-lx,m.y-ly)>(m.d.boss?260:m.d.ag?190:140)||dp>420){m.hunt=0;m.lx=null;m.ag0=now+6000;m.tel=null;return}
   if(telOn(m)&&telUpd(m,now))return;
   if(dp>40){const sp2=(m.d.ag?58:45)*dt,nx=m.x+dx/dp*sp2,ny=m.y+dy/dp*sp2;if(!inVilla(nx,ny)){m.x=nx;m.y=ny;m.mv=now;m.f=dx-dy>=0?1:-1}}else if(!busy){m.f=dx-dy>=0?1:-1;if(now>=m.nt){if(telOn(m)&&now>=(m.tn||(m.tn=now+4000)))telStart(m,now);else{m.nt=now+(m.d.as||2400);monHit(m,now)}}if(!A&&!P.g&&!P.mv&&!(K.l||K.r||K.u||K.d))startF(m,now)}return}
  if(now>m.wt){m.wt=now+R(2000,5000);m.tx=m.hx+R(-16,16);m.ty=m.hy+R(-12,12)}
  const ex=m.tx-m.x,ey=m.ty-m.y,d=Math.hypot(ex,ey);if(d>2){const sp3=d>60?55:18,nx=m.x+ex/d*sp3*dt,ny=m.y+ey/d*sp3*dt;if(!inVilla(nx,ny)){m.x=nx;m.y=ny;m.mv=now;m.f=ex-ey>=0?1:-1}}});
 if(A){const ph=swPh(now),imp=A.lp!=null&&ph<A.lp-.4;A.lp=ph;if(imp&&A.ty!=='f'){const e=A.e,k=A.sk;snd(k);
  if(k==='wc')sp(e.x,e.y-26,'#5ab04a',2,30,10,60);else if(k==='mi')sp(e.x,e.y-10,'#ffd27a',4,60,40,160);else if(k==='sm')sp(e.x,e.y-8,'#ff9a2a',5,70,50,200);
  else if(k==='fi'){sp(e.x,e.y,'#cfe8ff',3,30,30,100);TER.ripple(e.x,e.y)}else if(k==='co')sp(e.x,e.y-14,'#aaa',2,10,25,-10);else if(k==='cr'||k==='es')sp(e.x,e.y-10,'#d8c9a3',2,30,20,80);else if(k==='ins')sp(e.x,e.y-18,'#ffe8a0',4,60,60,-20);A.pr+=A.amt*hitMul(now);if(A.pr>=1){A.pr=Math.min(A.pr-1,.99);fin(now)}}}
 parts.forEach(p=>{p.x+=p.vx*DT;p.y+=p.vy*DT;p.vy+=p.g*DT;p.l-=DT*1.1});parts=parts.filter(p=>p.l>0)}

// ---------- dibujo ----------
const cv=$('#c');let ctx=cv.getContext('2d');if(typeof WGL!=='undefined')WGL.init(cv,{noGL:/[?&]nogl\b/.test(location.search)}); // F2-C4: canvas WebGL del agua bajo el 2D + capa de grano (?nogl fuerza el agua 2D)
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
const T=(s,x,y,c)=>{if(SIL)return;ctx.font='600 '+(15*TXS)+'px '+UI.FONT;ctx.textAlign='center';ctx.lineJoin='round';ctx.lineWidth=3.4*TXS;ctx.strokeStyle='#5b3a29';ctx.strokeText(s,x,y);ctx.fillStyle=c;ctx.fillText(s,x,y)}; // rótulos del mundo: texto claro con contorno de tinta (como el resto del arte)
// T con caché para etiquetas que casi nunca cambian (nombre de estación, nivel de monstruo). NO usar con texto que cambia cada frame (se llenaría la caché).
const TC=(s,x,y,c)=>{if(!SP)return T(s,x,y,c);const w=Math.max(24,s.length*10+8);bk('t|'+c+'|'+s,x,y,w,20,w>>1,15,(X,Y)=>T(s,X,Y,c))};
const QW=Math.PI/8; // la fase de paso se cuantiza a 16 fotogramas por ciclo (≈30 ms cada uno a 12 rad/s): indistinguible a ojo y deja la caché en 16+2 sprites por equipo
function dPerson(x,y,sh,ha,f,w,mv,ar){if(SP&&mv)w=Math.round(w/QW)*QW;const b=(mv?Math.abs(Math.sin(w))*2:0)+(!mv&&Math.sin(performance.now()/450+x*.1)>.85?1:0),lg=mv?Math.sin(w)*2:0;
 if(SP&&!BAKE)bk((CH?'p2|':'p|')+sh+'|'+ha+'|'+f+'|'+ar+'|'+(mv?((Math.round(w/QW)%16)+16)%16:'i'+b),x,y,CH?28:20,CH?40:34,CH?14:10,CH?34:30,(ax,ay)=>pBody(ax,ay,sh,ha,f,w,mv,ar,b,lg));else pBody(x,y,sh,ha,f,w,mv,ar,b,lg);return b}
function pBody(x,y,sh,ha,f,w,mv,ar,b,lg){if(CH)return CH.person(x,y,sh,ha,f,w,mv,ar,b,lg); // Fase 3 paso 3 (src/characters.js); con ?old CH es null y sigue el cuerpo antiguo
 Sd(x-7,y-1,14,3);Rc('#2a3a5a',x-4,y-7,3,7-Math.max(0,lg));Rc('#2a3a5a',x+1,y-7,3,7+Math.min(0,lg));
 Rc(sh,x-5,y-16-b,10,9);{const sw=mv?Math.round(Math.sin(w)*2):0;Rc(sh,x-7,y-15-b+sw,2,6);Rc('#f1c27d',x-7,y-9-b+sw,2,2);Rc(sh,x+5,y-15-b-sw,2,6);Rc('#f1c27d',x+5,y-9-b-sw,2,2)}Rc('#f1c27d',x-4,y-23-b,8,7);Rc(ha,x-4,y-24-b,8,3);Rc('#000',x+(f>0?1:-3),y-20-b,2,2);if(ar){Rc(ar,x-7,y-17-b,3,4);Rc(ar,x+4,y-17-b,3,4);Rc('#00000044',x-5,y-10-b,10,1);Rc('#ffffff44',x-3,y-15-b,2,5);if(ar!==TCOL.cuero)Rc(ar,x-4,y-25-b,8,3)}}
const TCl=['#3a8a3a','#2f7a4a','#4aa86a','#c8652a','#7a3a8a'],OC=['#c8742a','#e8e8f8','#a0502a','#222','#4a7aff','#3adf6a'];
// Recurso dorado: halo radial aditivo que respira, estrella de 4 puntas que gira y chispas que orbitan (fase determinista por posición). De noche además emite luz real ('gold' en light.js).
const GLD=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const q=c.getContext('2d'),r=q.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,244,170,.95)');r.addColorStop(.3,'rgba(255,205,70,.55)');r.addColorStop(.7,'rgba(255,170,30,.14)');r.addColorStop(1,'rgba(255,170,30,0)');q.fillStyle=r;q.fillRect(0,0,64,64);return c})();
function goldFx(x,y,t,front){if(SIL)return;const h=x*.37+y*.11,p=.5+.5*Math.sin(t*3+h),GR=30+7*p,cy=y-14,nt=sunS(t)<.05;ctx.save();
 if(!front){ctx.globalCompositeOperation=nt?'lighter':'source-over';ctx.globalAlpha=(nt?.6:.75)+.25*p;ctx.drawImage(GLD,x-GR,cy-GR,GR*2,GR*2);
  ctx.globalCompositeOperation='source-over';for(let i=0;i<2;i++){const u=(t*.7+i*.5+h)%1;ctx.globalAlpha=.85*(1-u);ctx.lineWidth=1.4;ctx.strokeStyle='#ffd23a';ctx.beginPath();ctx.ellipse(x,y,6+u*24,(6+u*24)*.5,0,0,7);ctx.stroke()}}
 else{ctx.globalCompositeOperation=nt?'lighter':'source-over';const a=t*1.1+h,s=10+6*p,sy=y-30;ctx.globalAlpha=.7+.3*p;ctx.fillStyle='#fff3b0';ctx.strokeStyle='#c98a10';ctx.lineWidth=.8;
  for(let k=0;k<2;k++){const b=a*(k?-1:1)+k*Math.PI/4,L=k?s*.6:s;ctx.beginPath();for(let i=0;i<4;i++){const an=b+i*Math.PI/2,bn=an+Math.PI/4;ctx.lineTo(x+Math.cos(an)*L,sy+Math.sin(an)*L*.85);ctx.lineTo(x+Math.cos(bn)*L*.18,sy+Math.sin(bn)*L*.18)}ctx.closePath();ctx.fill();if(!k&&!nt)ctx.stroke()}
  for(let i=0;i<5;i++){const an=t*1.5+i*1.2566+h,tw=.5+.5*Math.sin(t*7+i*1.9+h);ctx.globalAlpha=.4+.6*tw;ctx.fillStyle=i%2?'#ffe08a':'#fffbd0';const sx=x+Math.cos(an)*20,sy2=y-14+Math.sin(an)*10;ctx.fillRect(sx-1.2,sy2-1.2,2.4,2.4)}
  if(Math.random()<.07)sp(x+R(-10,10),y-R(5,30),'#ffe629',1,10,20,-20)}
 ctx.restore()}
function dN(e,t,now){const gl=e.g&&alive(e,now);if(gl)goldFx(e.x,e.y,t,0);try{dN0(e,t,now)}finally{if(gl)goldFx(e.x,e.y,t,1)}}
function dN0(e,t,now){const dead=!alive(e,now),on=A&&A.e===e,x=e.x,y=e.y;
  if(e.t==='wc'||e.t==='mi'){PROPS.resource(ctx,e,{dead,on,t,sh:on&&e.t==='wc'?Math.sin(t*40)*1.6*Math.max(0,1-swPh(now)*4):0,ox:SPX,oy:SPY,sil:SIL});return}
 if(SP&&!BAKE&&!on&&(e.t==='wc'?dead||e.i<7:e.t==='mi'?dead||e.i<4:false)){const wc=e.t==='wc'; // árboles 0–6 y rocas 0–3 (y sus restos): sin animación por t; el resto (árbol 7, rocas 4–6, pesca) sigue en vivo
  bk('n|'+e.t+e.i+(dead?'d':''),x,y,wc?40:32,wc?56:24,wc?20:16,wc?52:18,(ax,ay)=>dN({t:e.t,i:e.i,x:ax,y:ay,rt:dead?1e18:0},0,0));return}
 if(e.t==='wc'){const i=e.i,sh=on?Math.sin(t*40)*1.6*Math.max(0,1-swPh(now)*4):0,TR=['#6b4a2a','#e8e6dc','#6a4a2a','#9a8a6a','#7a6a4a','#6a3a1a','#3a2a1a','#1a1a1a'][i];
  if(dead){Rc(TR,x-4,y-4,8,5);Rc('#e0c090',x-3,y-5,6,2);return}
  Sd(x-10,y-1,20,3);
  if(i===0){Rc(TR,x-2,y-10,4,10);for(let r=0;r<4;r++)Rc(r%2?'#2f7a3a':'#2a6a34',x-13+r*3+sh,y-14-r*8,26-r*6,9)}
  else if(i===1){Rc(TR,x-2,y-14,4,14);for(let k=0;k<4;k++)Rc('#2a2a2a',x-2,y-12+k*3,4,1);Rc('#8ac85a',x-11+sh,y-30,22,12);Rc('#a8dc72',x-8+sh,y-36,16,8);Rc('#8ac85a',x-13+sh,y-24,4,6)}
  else if(i===2){Rc(TR,x-4,y-14,8,14);Rc('#2f7a3a',x-15+sh,y-30,30,16);Rc('#3a8a44',x-11+sh,y-37,22,9);Rc('#00000022',x-15+sh,y-20,30,4)}
  else if(i===3){Rc(TR,x-2,y-18,4,18);Rc('#b0c850',x-6+sh,y-44,12,28);Rc('#c8d870',x-4+sh,y-48,8,6)}
  else if(i===4){Rc(TR,x-3,y-14,6,14);Rc('#6aa890',x-13+sh,y-30,26,12);for(let k=0;k<7;k++)Rc('#58907a',x-12+k*4+sh,y-20,2,10+(k%3)*3)}
  else if(i===5){Rc(TR,x-3,y-12,6,12);Rc('#d8602a',x-13+sh,y-30,26,16);Rc('#f0b030',x-9+sh,y-36,18,8);Rc('#c04820',x-13+sh,y-22,6,5)}
  else if(i===6){Rc(TR,x-4,y-14,8,14);Rc('#4a3a6a',x-14+sh,y-32,28,18);Rc('#3a2a5a',x-10+sh,y-40,20,10);Rc('#6a5a8a',x-12+sh,y-28,5,4)}
  else{Rc(TR,x-3,y-16,6,16);Rc('#6a2a8a',x-12+sh,y-34,24,18);Rc('#8a3aaa',x-8+sh,y-42,16,10);for(let k=0;k<4;k++)Rc('#2a0a3a',x-12+k*7,y-36-(k%2)*4,3,6);ctx.globalAlpha=.25+.2*Math.sin(t*3+x);Rc('#c060ff',x-14,y-34,28,20);ctx.globalAlpha=1}
  return}
 if(e.t==='mi'){const i=e.i,BA=['#8a5a3a','#9a9aa8','#6a4a3a','#2a2a2e','#8a9aa8','#2a3a5a','#1a3a2a'][i],OCN=['#c8742a','#e8e8f8','#c0603a','#555','#e8e8f0','#4a7aff','#3adf6a'][i];
  if(dead){Rc('#555',x-8,y-4,16,5);return}
  Sd(x-12,y-1,24,3);
  if(i>=5){const c1=i===5?'#4a7aff':'#3adf6a',c2=i===5?'#9ac0ff':'#a0ffc0';Rc(BA,x-11,y-8,22,8);for(let k=0;k<4;k++){const h=10+(k%2)*8;Rc(c1,x-9+k*5,y-8-h,4,h);Rc(c2,x-8+k*5,y-8-h,1,h)}ctx.globalAlpha=.18+.12*Math.sin(t*3+x);Rc(c2,x-12,y-26,24,20);ctx.globalAlpha=1}
  else{Rc(BA,x-11,y-10,22,11);Rc(BA,x-8,y-15,16,6);Rc('#ffffff22',x-8,y-15,16,3);Rc(OCN,x-7,y-9,4,3);Rc(OCN,x+2,y-12,4,3);Rc(OCN,x-1,y-5,4,3);if(i===4){ctx.globalAlpha=.4+.4*Math.sin(t*5+x);Rc('#fff',x+3,y-13,2,2);ctx.globalAlpha=1}}
  return}
 if(dead)return;const i=e.i,RCL=['#cfe8ff','#e0f0ff','#aad0ff','#b8e8c0','#ffb888','#9ad8a0','#80b0ff','#ffa040','#d0f0ff','#e0c0ff','#ffa0a0','#a0ffd0'][i]||'#fff',FCL=['#ff9a8a','#d8e0e8','#8ab0d8','#8ac88a','#ff8a4a','#4a8a5a','#4a6ac8','#ff6a1a','#6a8aff','#a06aff','#ff4a6a','#2ac89a'][i]||'#fff';
 ctx.strokeStyle=RCL;ctx.globalAlpha=.8-(t*2%1)*.6;ctx.beginPath();ctx.ellipse(x,y,5+(t*8%8),2+(t*4%4),0,0,7);ctx.stroke();ctx.globalAlpha=1;Rc(FCL,x+Math.sin(t*2+x)*4,y-2,4+Math.floor(i/3),2);
 if(i===7){ctx.globalAlpha=.3+.2*Math.sin(t*4);ctx.fillStyle='#ff9040';ctx.beginPath();ctx.arc(x,y,9,0,7);ctx.fill();ctx.globalAlpha=1}}
function dS(e,t){const x=e.x,y=e.y,id=e.id,now=performance.now(),mine=A&&A.e===e,on=!!(mine||(CK&&S.stn===e&&id==='fire'));let ty;if(e.nodraw)return;if(id==='door'||id==='exit')return dDoor(e,t);
 if(PROPS.ST[id]){const lh=e.lh=PROPS.station(ctx,e,{on:id==='furnace'?!!mine:on,night:id==='bank'&&sunS(t)<-.05,t,ox:SPX,oy:SPY,sil:SIL});TC(e.n,x,y-lh/SPR,'#fff');if(id==='ru'&&S.gseen!==S.goal)T('!',x,y-(lh+16)/SPR+Math.sin(t*5)*2,'#ffe629');return}
 if(SX){ // Fase 3 paso 2 (src/stations.js): fotograma entero 0..7; con una acción en la estación se sincroniza con la fase del golpe (swPh) y el golpe cae en fr 6–7/0
  const fr=mine&&id!=='fire'?Math.floor(swPh(now)*8)&7:Math.floor(t*8)&7,o={fr,on,near:Math.hypot(P.x-x,P.y-y)<80,wave:id==='shop'&&t%7<1,night:id==='bank'||id==='shop'?WN(t):''};
  if(SP&&!BAKE)ty=bk('s2|'+id+'|'+(on?1:0)+'|'+fr+'|'+(o.near?1:0)+'|'+(o.wave?1:0)+'|'+o.night,x,y,96,80,48,66,(ax,ay)=>dSb(e,t,ax,ay,on,o));else ty=dSb(e,t,x,y,on,o);
  if(id==='shop'&&S.gseen!==S.goal)T('!',x,y-74+Math.sin(t*5)*2,'#ffe629')}
 else{
 if(SP&&!BAKE&&id!=='shop'&&id!=='fire'&&id!=='altar')ty=bk('s|'+id+'|'+(on?1:0)+'|'+(id==='bank'?WN(t):''),x,y,64,60,32,52,(ax,ay)=>dSb(e,t,ax,ay,on)); // banco (día/noche), yunque, taller, horno (on/off) → caché. Tienda (dPerson con guiño), fogata y escritorio (llamas) siguen en vivo
 else ty=dSb(e,t,x,y,on)}
 TC(e.n,x,y-ty,'#fff')}
function dSb(e,t,x,y,on,o){if(SX)return SX.draw(e.id,x,y,o);let ty=22;
 if(e.id==='bank'){Sd(x-26,y-1,52,4);Rc('#9a9a9a',x-24,y-36,48,36);Rc('#8a8a8a',x-24,y-36,48,4);Rc('#b0a090',x-28,y-44,56,9);Rc('#7a5a3a',x-5,y-18,10,18);Rc('#ffd23a',x+2,y-9,2,2);Rc(WN(t),x-19,y-28,9,9);Rc(WN(t),x+10,y-28,9,9);Rc('#ffd23a',x-3,y-42,6,4);ty=50}
 else if(e.id==='shop'){Sd(x-26,y-1,52,4);Rc('#7a5a3a',x-23,y-24,3,24);Rc('#7a5a3a',x+20,y-24,3,24);dPerson(x,y-5,'#6a3aa8','#ddd',-1,0,0);if(t%7<1)Rc('#f1c27d',x+6,y-30+Math.round(Math.sin(t*12)*2),2,6);Rc('#8a6a3a',x-24,y-10,48,7);Rc('#a0805a',x-24,y-10,48,2);for(let i=0;i<8;i++)Rc(i%2?'#fff':'#c0392b',x-24+i*6,y-36,6,11);Sd(x-24,y-26,48,2);ty=58;if(S.gseen!==S.goal)T('!',x,y-74+Math.sin(t*5)*2,'#ffe629')}
 else if(e.id==='fire'){ctx.globalAlpha=.18;ctx.fillStyle='#ff9a2a';ctx.beginPath();ctx.arc(x,y-6,on?36:26,0,7);ctx.fill();ctx.globalAlpha=1;Rc('#6b4a2a',x-28,y-5,13,5);Rc('#6b4a2a',x+15,y-5,13,5);for(let i=0;i<8;i++)Rc('#888',x+Math.cos(i*.785)*12-1,y-3+Math.sin(i*.785)*5,3,3);Rc('#5a3a1a',x-8,y-5,16,4);
  for(let k=0;k<3;k++){const h=(on?14:9)+Math.sin(t*14+k*2)*4;Rc('#ff7a1a',x-6+k*5,y-5-h,4,h);Rc('#ffd23a',x-5+k*5,y-5-h/2,2,h/2)}ty=28}
 else if(e.id==='anvil'){Sd(x-14,y-1,28,3);Rc('#6b4a2a',x-8,y-7,16,7);Rc('#3a3a3a',x-12,y-15,24,8);Rc('#555',x-15,y-17,9,3);Rc('#222',x-5,y-9,10,3)}
 else if(e.id==='altar'){Sd(x-18,y-1,36,4);Rc('#8a6a3a',x-16,y-14,32,7);Rc('#5a3a1a',x-14,y-7,4,7);Rc('#5a3a1a',x+10,y-7,4,7);Rc('#f0e6c8',x-10,y-17,14,5);Rc('#2a6ac8',x+8,y-20,3,6);Rc('#f0f0f0',x+10,y-27,2,9);Rc('#e8e0c0',x-13,y-22,3,8);ctx.globalAlpha=.6+.3*Math.sin(t*9);Rc('#ffcc40',x-13,y-27,3,5);ctx.globalAlpha=1;ty=36}
 else if(e.id==='bench'){Sd(x-18,y-1,36,3);Rc('#8a6a3a',x-16,y-14,32,6);Rc('#5a3a1a',x-14,y-8,4,8);Rc('#5a3a1a',x+10,y-8,4,8);Rc('#c0c0c0',x-8,y-18,12,3);Rc('#b08a5a',x+6,y-20,8,6);ty=26}
 else{Sd(x-18,y-1,36,3);Rc('#777',x-14,y-26,28,26);Rc('#555',x-14,y-26,28,4);Rc('#666',x+6,y-40,8,16);Rc('#222',x-8,y-14,16,12);Rc(on?'#ffb030':'#c8501a',x-6,y-12+(on?0:3),12,on?10:7);ty=44}
 return ty}
function dM(m,t,now){if(!alive(m,now))return;const d=m.d,x=m.x,y=m.y,h=d.h,w=d.w;if(d.boss){ctx.globalAlpha=.16+.1*Math.sin(t*3);ctx.fillStyle=d.boss===2?'#40b0ff':'#ff3030';ctx.beginPath();ctx.ellipse(x,m.y-h/2,w*.9,h*.8,0,0,7);ctx.fill();ctx.globalAlpha=1}
 PROPS.mob(ctx,m,{now,ox:SPX,oy:SPY,sil:SIL}); // F5: sprite «galleta» de src/creatures.js (horneado por pose); la respiración/paso/golpe ya van dentro
 if(m.hp<m.mh){Rc('#400',x-12,y-h-9,24,4);Rc('#3c3',x-12,y-h-9,24*m.hp/m.mh,4)}
 TC((d.boss===1?'👑 '+(sealed(m)?'🔒 ':'')+d.n+' ':d.boss===2?'🗝️ '+d.n+' ':m.d.ag?'⚔ ':'')+'Lv'+m.lv,x,y-h-12,(g=>g>10?'#f55':g>4?'#fa5':g<-6?'#7e7':'#fff')(m.lv-CBL()))}
function swordAt(hx,hy,a,f,col,len){const dx=f*Math.cos(a),dy=Math.sin(a),p=[hx+dx*3,hy+dy*3],q=[hx+dx*(3+len),hy+dy*(3+len)];ctx.lineWidth=2;ctx.strokeStyle='#6b4a2a';ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(p[0],p[1]);ctx.stroke();
 ctx.strokeStyle='#d8c070';ctx.beginPath();ctx.moveTo(p[0]-dy*3,p[1]+dx*3);ctx.lineTo(p[0]+dy*3,p[1]-dx*3);ctx.stroke();ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.stroke();ctx.strokeStyle='#ffffff99';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.stroke()}
function bowAt(hx,hy,f,ph,col){const pull=Math.min(1,ph/.8),px=hx+f*(7-pull*6);ctx.lineWidth=2;ctx.strokeStyle=col;ctx.beginPath();ctx.moveTo(hx+f*7,hy-10);ctx.quadraticCurveTo(hx+f*15,hy,hx+f*7,hy+10);ctx.stroke();
 ctx.lineWidth=1;ctx.strokeStyle='#ffffffcc';ctx.beginPath();ctx.moveTo(hx+f*7,hy-10);ctx.lineTo(px,hy);ctx.lineTo(hx+f*7,hy+10);ctx.stroke();
 if(ph>.05&&ph<.97){ctx.strokeStyle='#d8c9a3';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px,hy);ctx.lineTo(px+f*14,hy);ctx.stroke()}}
function staffAt(hx,hy,f,ph,col,id){const orb=ORB[tierOf(id)]||'#9cf',g=ph>.8;ctx.lineWidth=2;ctx.strokeStyle=col;ctx.beginPath();ctx.moveTo(hx+f*2,hy+8);ctx.lineTo(hx+f*5,hy-16);ctx.stroke();
 ctx.globalAlpha=g?.7:.35;ctx.fillStyle=orb;ctx.beginPath();ctx.arc(hx+f*5,hy-18,g?7:4.5,0,7);ctx.fill();ctx.globalAlpha=1;Rc(orb,hx+f*5-2,hy-20,4,4)}
// F4b: el héroe se dibuja con PROPS.player (modelo 2D + animaciones de src/hero.js). Dirección de 8 vías: al moverse sale del vector de movimiento (P.dir); al trabajar o pelear mira al objetivo.
const wColor=()=>S.eq.w?TCOL[tierOf(S.eq.w)]||(LOOT[S.eq.w]?['#c8742a','#9a9aa8','#cfd8e0','#4a7aff','#d83a3a','#3adf6a'][LOOT[S.eq.w].k]:'#ddd'):null;
function actState(now){
 if(CK&&S.stn)return{k:'co',ph:0,id:S.stn.id};
 if(P.sp&&now-P.sp.t0<P.sp.d&&!CK)return{k:'sp',ph:(now-P.sp.t0)/P.sp.d,wt:P.sp.wt,wk:wKind(),wcol:wColor(),orb:ORB[tierOf(S.eq.w||'')]};
 if(P.eat&&now-P.eat<1000&&!CK)return{k:'eat',ph:(now-P.eat)/1000};
 if(!A){if(P.pk&&now-P.pk<420)return{k:'pk',ph:(now-P.pk)/420};return null}const ph=swPh(now);
 if(A.ty==='f'){const wt=wtype(),hv=A.nx&&A.nx.wt===wt&&A.nx.heavy?1:0,armed=!!wColor(),wk=wKind();return Object.assign({k:'f',wt,wk,wcol:wColor(),orb:ORB[tierOf(S.eq.w||'')],hv},animPh(A.ms,A.ph-now,A.lh!=null?now-A.lh:1e9,wt==='r'?(hv?1150:900):wt==='g'?(hv?900:750):hv?(wk==='great'?880:760):wk==='great'?740:wk==='dagger'?400:armed?560:440))} // hv: el golpe que viene es máximo → animación especial del arma (hero.js)
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
const STRW=47,STRR=40;
// Asentado al parar: en vez de saltar del medio paso al reposo, la fase sigue hasta el siguiente APOYO (seno = ±1: ambos pies en el suelo, w = π/2 + kπ) y entonces pasa a reposo.
// Como mucho un cuarto de ciclo (~120 ms andando). Usa fotogramas ya horneados (no añade horneados). Si empieza una acción, se corta.
function settle(dt){if(P.wt==null){const k=Math.ceil((P.w-Math.PI/2)/Math.PI-1e-3);P.wt=Math.PI/2+k*Math.PI}P.w=Math.min(P.wt,P.w+dt*(P.wr||12));if(P.w>=P.wt){P.anm=0;P.wt=null}}
// Giro suave: la dirección visual avanza UN paso de 45° cada 55 ms hacia la real (antes saltaba de golpe, p. ej. 180° en un fotograma)
function visDir(now){const tg=P.dir==null?2:P.dir;if(P.vd==null)P.vd=tg;if(P.vd!==tg&&now-(P.vt||0)>55){P.vt=now;const df=((tg-P.vd)%8+8)%8;P.vd=(P.vd+(df<=4?1:7))%8}return P.vd}
function dP(t,now){const ac=S.eq.a?ARC(S.eq.a):null,tg=A&&A.e?A.e:(CK&&S.stn?S.stn:null);
 if(tg&&!P.mvg&&tg.x!=null)P.dir=HERO.dirOf(tg.x-P.x,tg.y-P.y);
 const act=P.mvg?null:actState(now),lamp=sunS(t)<.12?1+(Math.floor(t*5+P.x*.01)&1):0;if(act&&P.anm){P.anm=0;P.wt=null}
 const mvA=P.mvg||P.anm,akey=mvA?(RUN?'r':'w'):act?act.k:'i';P.ab=P.ab||{};   // akey: estado de animación; al cambiar, HERO.blend funde la pose (lote M3)
 const r=PROPS.player(ctx,P,{post:R=>HERO.blend(P.ab,R,akey,now),lamp,dir:visDir(now),mv:mvA,run:!!RUN,t,act,hurt:Math.max(0,1-(now-HURT)/320),ar:ac,app:S.app,helm:S.eq.h?ARC(S.eq.h):null,boot:S.eq.f?ARC(S.eq.f):null,gear:gearOpts(),ox:SPX,oy:SPY,sil:SIL});
 if(act&&act.k==='fi'&&r.tip&&A&&A.e&&!SIL){ // el lienzo local de spr() es cartesiano (no isométrico): el destino se proyecta con ISO y se pasa a coordenadas locales, si no el sedal apuntaba a cualquier sitio
  const k=SPR*ISO.scale(),p0=ISO.toCanvas(P.x,P.y,TER.standZ(P.x,P.y)),q=ISO.toCanvas(A.e.x,A.e.y,TER.standZ(A.e.x,A.e.y)),ex=P.x+(q.x-p0.x)/k,ey=P.y+(q.y-p0.y)/k,tx=P.x+r.tip[0]/SPR,ty=P.y+r.tip[1]/SPR,
   u=Math.min(1,Math.max(0,(act.ph||0)/.26)),fl=u<1?u*(2-u):1,bx=tx+(ex-tx)*fl,by=ty+(ey-ty)*fl-(u<1?Math.sin(u*Math.PI)*22:0);   // el flotador vuela en arco hasta el punto de pesca durante el lanzamiento
  ctx.lineWidth=1;ctx.strokeStyle='#fff';ctx.globalAlpha=.8;ctx.beginPath();ctx.moveTo(tx,ty);ctx.quadraticCurveTo((tx+bx)/2,Math.max(ty,by)-(u<1?2:6),bx,by);ctx.stroke();ctx.globalAlpha=1;Rc('#e33',bx-1,by-1+(u<1?0:Math.sin(t*5)*1.5),3,3)}}
const bl=document.createElement('canvas');bl.width=W>>2;bl.height=H>>2;const bx=bl.getContext('2d'),gr=document.createElement('canvas');gr.width=gr.height=96;let GP=null,SHK=0,HURT=-1e9;
try{const g=gr.getContext('2d'),im=g.createImageData(96,96);for(let i=0;i<im.data.length;i+=4){const v=Math.random()*255;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255}g.putImageData(im,0,0)}catch(e){}
let PFON=0;
function post(now){const t=now/1000,d=Math.max(0,Math.min(1,(.15-sunS(t))/.55));
 const hu=Math.max(0,1-(now-HURT)/450)*.5,low=P.hp<maxHp()*.3?(.5+.5*Math.sin(t*6))*.3:0,rv=Math.max(hu,low);
 if(rv>.01){const g=ctx.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.85);g.addColorStop(0,'rgba(200,20,20,0)');g.addColorStop(1,'rgba(200,20,20,'+rv+')');ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}}
const clk=()=>{const t=performance.now()/1000,h=dayP(t)*24,s=sunS(t);return (s>.15?'☀️ ':s>-.1?'🌅 ':'🌙 ')+String(Math.floor(h)).padStart(2,'0')+':'+String(Math.floor(h%1*60)).padStart(2,'0')};
// Fase 4: disco de luz cacheado (en vez de createRadialGradient por luz y frame). add=0: hueco en la oscuridad (destination-out, alfa k); add=1: brillo cálido (se pinta con globalAlpha=.22*d). Radio entero → ≤ unos 15 discos distintos por fogata parpadeante.
const LDISC=(r,k,add)=>SP.get('l|'+add+'|'+r+'|'+k,r*2,r*2,r,r,g=>{const q=g.createRadialGradient(r,r,add?0:r*.1,r,r,r);q.addColorStop(0,add?'rgba(255,170,70,1)':'rgba(0,0,0,'+k+')');q.addColorStop(1,add?'rgba(255,170,70,0)':'rgba(0,0,0,0)');g.fillStyle=q;g.fillRect(0,0,r*2,r*2)}).c;
// F6: gradación de luz por bioma (se mezcla con el vecino cerca de la frontera). dia: [r,g,b,alfa] velo diurno; noche: [r,g,b] color de la noche; nf: factor de oscuridad nocturna.
const LG=[{dia:[255,214,120,.045],noche:[8,14,46],nf:1},{dia:[20,80,50,.11],noche:[5,22,40],nf:1.05},{dia:[80,100,40,.13],noche:[14,26,34],nf:1.05},{dia:[150,185,240,.10],noche:[14,22,70],nf:.95},{dia:[255,150,175,.07],noche:[26,12,52],nf:1},{dia:[255,80,30,.13],noche:[44,10,24],nf:.8}];
function lgAt(x,y){const k0=biomeAt(x,y),k=k0<0?curB:k0,m=(a,b,t)=>a+(b-a)*t;let k2=k,t=0;
 for(const g of BIOMES.gates){if(g.a!==k&&g.b!==k)continue;const dx=g.vert?Math.abs(x-g.x):Math.max(0,g.x0-x,x-g.x1),dy=g.vert?Math.max(0,g.y0-y,y-g.y1):Math.abs(y-g.y),d=Math.hypot(dx,dy),E=280;if(d<E&&.5*(1-d/E)>t){t=.5*(1-d/E);k2=g.a===k?g.b:g.a}} // cerca de una compuerta se mezcla con la luz del bioma vecino
 const A=LG[k],B=LG[k2];return{dia:A.dia.map((v,i)=>m(v,B.dia[i],t)),noche:A.noche.map((v,i)=>m(v,B.noche[i],t)),nf:m(A.nf,B.nf,t)}}
function lighting(now){const t=now/1000,s=sunS(t),d=Math.max(WXD,Math.max(0,Math.min(1,(.15-s)/.55))),w=Math.max(0,1-Math.abs(s)*4)*.16,vis=()=>true,lp=(x,y)=>{const q=ISO.toCanvas(x,y,1),f=cv.width/W;return[q.x/f,q.y/f]},LR=.9*ISO.scale()/(cv.width/W);
 const LGc=lgAt(P.x,P.y),dv=Math.max(0,Math.min(1,(s+.1)/.5))*(1-WXD*1.5>0?1-WXD*1.5:0);
 if(dv>.01&&LGc.dia[3]>0){ctx.fillStyle='rgba('+LGc.dia.slice(0,3).map(Math.round).join(',')+','+LGc.dia[3]*dv+')';ctx.fillRect(0,0,W,H)}
 if(d>.01){ // luz dinámica (src/light.js): mapa de luz con sombras de los objetos; las luces se recogen en LIGHT.update() al inicio de draw()
  const LMp=LIGHT.render();lx.globalCompositeOperation='source-over';lx.clearRect(0,0,W,H);lx.fillStyle='rgba('+LGc.noche.map(Math.round).join(',')+','+d*.72*LGc.nf+')';lx.fillRect(0,0,W,H);
  if(LMp){lx.globalCompositeOperation='destination-out';lx.imageSmoothingEnabled=true;lx.imageSmoothingQuality='high';lx.drawImage(LMp.map,0,0,LMp.map.width*LMp.sc,LMp.map.height*LMp.sc);lx.globalCompositeOperation='source-over'}
  ctx.drawImage(lc,0,0);
  if(LMp){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.min(1,.3*d);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(LMp.col,0,0,LMp.col.width*LMp.sc,LMp.col.height*LMp.sc);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'}}
 if(w>.01){ctx.fillStyle='rgba(255,130,50,'+w+')';ctx.fillRect(0,0,W,H)}
 const g=ctx.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,H*.9);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,'+(.26+d*.2)+')');ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
// Luz dinámica: recoge luces y oclusores del fotograma (LIGHT.update) con la oscuridad actual; se llama antes de dibujar entidades para que cada sprite reciba su luz (LIGHT.at/tint).
function lightUpd(now){const t=now/1000,d=Math.max(WXD,Math.max(0,Math.min(1,(.15-sunS(t))/.55))),f=cv.width/W;
 const LR=.9*ISO.scale()/f;   // near = radio (px de mundo) en el que se recogen luces y oclusores: sigue al tamaño de la vista (con zoom bajo y pantalla grande se veían farolas sin luz)
 LIGHT.update({t,d,W,H,dev:f,near:Math.max(640,.62*Math.hypot(W,H)/LR+120),proj:(x,y)=>{const q=ISO.toCanvas(x,y,1);return[q.x/f,q.y/f]},LR,P,ST,N,GD,props:PROPS.list,now,active:A})}
let LFT=0;
const SPR=1.5; // px lógicos por px de sprite cenital antiguo (marcadores provisionales hasta F4/F5)
// Dibuja un sprite cenital antiguo con los pies en la posición isométrica de (x,y); lift = px de sprite hacia arriba
let SIL=0,SPX=0,SPY=0; // SIL: dibujando la silueta del contorno (sin texto ni sombra); SPX/SPY: desplazamiento de spr() hacia el lienzo pequeño
function spr(x,y,lift,fn){const p=ISO.toCanvas(x,y,TER.standZ(x,y)),k=SPR*ISO.scale();ctx.setTransform(k,0,0,k,p.x-SPX-x*k,p.y-SPY-(y+lift)*k);TXS=.5;try{fn()}finally{TXS=1}}
const onScr=(x,y)=>{const p=ISO.toCanvas(x,y,1);return p.x>-140&&p.x<ISO.V.cw+140&&p.y>-200&&p.y<ISO.V.ch+140};
// Calidad (oct 2026): tope de píxeles REALES del lienzo. En pantalla completa la GPU se ahoga si el lienzo es enorme; 'Auto' empieza en Media y baja sola si el juego va lento.
const QCAPS=[4.5e6,3e6,2.2e6,1.5e6,1e6],QNAM=['Máxima','Alta','Media','Baja','Mínima'];let QA=1,QL=2;try{const q=localStorage.getItem('ns_q');if(q!=null&&q!=='a'){QA=0;QL=Math.max(0,Math.min(4,+q||0))}}catch(e){}
let HUDS=1;
function fitCv(){const cw=Math.max(320,innerWidth),ch=Math.max(240,innerHeight);let dpr=window.devicePixelRatio||1;dpr=Math.max(.5,Math.min(dpr,Math.sqrt(QCAPS[QL]/(cw*ch))));
 ISO.resize(cw,ch,dpr);if(cv.width!==ISO.V.cw||cv.height!==ISO.V.ch){cv.width=ISO.V.cw;cv.height=ISO.V.ch}
 const hs=HUDS=Math.min(1.75,Math.max(1,ch/520)); // escala del HUD dibujado en el lienzo (1 unidad = hs px CSS): crece con la pantalla pero no tanto como la ventana
 W=cw/hs;H=ch/hs;document.documentElement.style.setProperty('--hs',hs.toFixed(3));
 const lw=Math.ceil(W),lh=Math.ceil(H);if(lc.width!==lw||lc.height!==lh){lc.width=lw;lc.height=lh}const bw=Math.max(1,lw>>2),bh=Math.max(1,lh>>2);if(bl.width!==bw||bl.height!==bh){bl.width=bw;bl.height=bh}
 if(typeof WGL!=='undefined'){WGL.res=[.75,.6,.5,.4,.33][QL];WGL.fit()}}
// Zoom (oct 2026): pasos fijos (cada paso reconstruye chunks y sprites a esa escala, un tirón puntual). Rueda, +/-, pellizco. Se guarda en ns_zoom.
const ZMS=[1,1.25,1.6,2,2.5];let ZMI=2,ZMT=0;try{const z=+localStorage.getItem('ns_zoom');if(localStorage.getItem('ns_zoom')!==null&&z>=0&&z<ZMS.length)ZMI=z|0}catch(e){}ISO.V.zoom=ZMS[ZMI];
function setZoom(i){i=Math.max(0,Math.min(ZMS.length-1,i));if(i===ZMI)return;ZMI=i;ISO.V.zoom=ZMS[i];try{localStorage.setItem('ns_zoom',i)}catch(e){}fitCv()}
cv.addEventListener('wheel',e=>{e.preventDefault();const n=performance.now();if(n-ZMT<140)return;ZMT=n;setZoom(ZMI+(e.deltaY<0?1:-1))},{passive:false});
let ZMP=0,ZMD=0;cv.addEventListener('touchstart',e=>{if(e.touches.length===2){ZMP=1;ZMD=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);P.mv=null}},{passive:true});
cv.addEventListener('touchmove',e=>{if(e.touches.length===2&&ZMD){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);if(d>ZMD*1.3){setZoom(ZMI+1);ZMD=d}else if(d<ZMD*.77){setZoom(ZMI-1);ZMD=d}e.preventDefault()}},{passive:false});
cv.addEventListener('touchend',e=>{if(e.touches.length<2){ZMD=0;setTimeout(()=>{ZMP=0},250)}},{passive:true});
fitCv();addEventListener('resize',fitCv);if(window.ResizeObserver)new ResizeObserver(fitCv).observe($('#cw'));
// ---- F1-C1 · cursor de tile: rombo suave bajo el puntero (solo ratón). No toca lógica ni colisiones. ----
const CUR={px:0,py:0,on:0,tx:-1,ty:-1};
let CURON=0;try{CURON=+localStorage.getItem('ns_cursor')||0}catch(e){} // preferencia propia, fuera del guardado (tdo2)
const qBtn=()=>{const b=$('#qb');if(b)b.textContent='🖼 Calidad: '+(QA?'Auto ('+QNAM[QL]+')':QNAM[QL])},tgQ=()=>{if(QA){QA=0;QL=0}else if(QL<4)QL++;else{QA=1;QL=2}try{localStorage.setItem('ns_q',QA?'a':QL)}catch(e){}fitCv();qBtn()};
let QFW=[],QC=0;function qmon(now,fdt){if(!QA||document.hidden||QL>=4)return;if(fdt<250)QFW.push(fdt);if(QFW.length<150)return;const s=QFW.slice().sort((x,y)=>x-y),med=s[75];QFW=[];if(now<QC||now<6000)return;if(med>25){QL++;QC=now+10000;fitCv();qBtn()}} // mediana de 150 frames > 25 ms (menos de 40 fps sostenidos): baja un nivel. La mediana ignora los tirones sueltos (esos no se arreglan bajando resolución)
const curBtn=()=>{const b=$('#curb');if(b)b.textContent='▱ Cursor: '+(CURON?'SÍ':'NO')+' (G)'},tgCur=()=>{CURON=CURON?0:1;try{localStorage.setItem('ns_cursor',CURON)}catch(e){}curBtn()};curBtn();qBtn();
cv.addEventListener('pointermove',ev=>{if(ev.pointerType==='touch')return;const r=cv.getBoundingClientRect();CUR.px=(ev.clientX-r.left)*cv.width/r.width;CUR.py=(ev.clientY-r.top)*cv.height/r.height;CUR.on=1});
cv.addEventListener('pointerleave',()=>{CUR.on=0;cv.style.cursor=''});
// Forma del rombo del cursor de tile (provisional, opcional). NO es el helper de formas de F2 (que será `facet`, ver AGENTS.md): no lo reutilices para sprites.
function cursorPoly(pts,k){const n=pts.length;ctx.beginPath();for(let i=0;i<n;i++){const a=pts[(i+n-1)%n],b=pts[i],c=pts[(i+1)%n],p1={x:b.x+(a.x-b.x)*k,y:b.y+(a.y-b.y)*k},p2={x:b.x+(c.x-b.x)*k,y:b.y+(c.y-b.y)*k};if(i)ctx.lineTo(p1.x,p1.y);else ctx.moveTo(p1.x,p1.y);ctx.quadraticCurveTo(b.x,b.y,p2.x,p2.y)}ctx.closePath()}
// Entidad bajo el puntero (px reales del canvas). La usan el clic y el resaltado, así que lo que se ilumina es lo que se clica.
function pickEnt(px,py,now){const sc=ISO.scale(),k=SPR*sc;let b=null,bd=34;[...N,...ST,...M,...PO,...GD].forEach(e=>{if(!alive(e,now)||e.deco)return;const q=ISO.toCanvas(e.x,e.y,TER.standZ(e.x,e.y)),d=Math.hypot(px-q.x,py-(q.y-(e.d?Math.max(10,e.d.h*.5):10)*k))/sc-(e.id?18:0);if(d<bd){bd=d;b=e}});return b}
// Contorno de la entidad bajo el puntero (F1-C3): se dibuja la entidad UNA vez en un lienzo pequeño, se tiñe como silueta y se estampa
// desplazada en 8 direcciones (borde oscuro + borde claro) justo antes de su sprite. Solo cuesta algo mientras hay una entidad resaltada.
// Funciona con cualquier sprite (rectángulos, arcos…), también con los definitivos de F3–F5. No usa ctx.filter ni copia el canvas principal.
const HLC=document.createElement('canvas'),HLX=HLC.getContext('2d'),HLD=document.createElement('canvas'),HLY=HLD.getContext('2d');let HOV=null;
const HL8=[[1,0],[-1,0],[0,1],[0,-1],[.7,.7],[-.7,.7],[.7,-.7],[-.7,-.7]];
// Tooltip pequeño de recurso (nivel + herramienta recomendada): DOM, sigue al puntero. Rojo = te falta nivel o herramienta.
let RTD=null,RTK='';
function resTip(){const e=HOV;if(!RTD){RTD=document.createElement('div');RTD.style.cssText='position:fixed;z-index:30;pointer-events:none;display:none;padding:4px 10px;background:var(--paper);border:2.5px solid var(--ink);border-radius:9px 8px 10px 7px;font:600 12px/1.4 '+UI.FONT+';color:var(--tx);box-shadow:2px 3px 0 var(--sh);white-space:nowrap';document.body.appendChild(RTD)}
 if(!e||!e.t||!ACT[e.t]||!ACT[e.t][e.i]){RTD.style.display='none';return}
 const a=ACT[e.t][e.i],lv=rq(a),tl=TLV(lv),tk=TOOLS[e.t],badL=L(e.t)<lv,badT=tk&&(S.tool[e.t]||0)<tl-1,R='var(--rd)',k=e.t+e.i+'|'+badL+badT+'|'+S.tool[e.t]+'|'+L(e.t);
 if(k!==RTK){RTK=k;RTD.innerHTML='<span style="font-weight:700;color:var(--or)">'+a[0]+'</span><br><span style="'+(badL?'color:'+R:'')+'">Nivel '+lv+'</span>'+(tk?' · <span style="'+(badT?'color:'+R:'')+'">'+tk[1]+' '+tk[0]+' '+tn(e.t,tl)+'</span>':'')}
 const r=cv.getBoundingClientRect();RTD.style.left=Math.round(r.left+CUR.px*r.width/cv.width+16)+'px';RTD.style.top=Math.round(r.top+CUR.py*r.height/cv.height+14)+'px';RTD.style.display='block'}
function hovUpdate(){HOV=null;CUR.hov=null;if(!CUR.on||CK){cv.style.cursor='';resTip();return}HOV=pickEnt(CUR.px,CUR.py,performance.now());CUR.hov=HOV;cv.style.cursor=HOV?(UI.cursor('hand')||'pointer'):'';resTip()}
function hl(e,fn,t){if(e!==HOV)return;const sv=ctx,s=ISO.scale(),w=Math.ceil(300*s),h=Math.ceil(340*s),ax=Math.round(w/2),ay=Math.round(h-50*s),p=ISO.toCanvas(e.x,e.y,TER.standZ(e.x,e.y));
 if(HLC.width!==w||HLC.height!==h){HLC.width=HLD.width=w;HLC.height=HLD.height=h}
 HLX.setTransform(1,0,0,1,0,0);HLX.globalCompositeOperation='source-over';HLX.globalAlpha=1;HLX.clearRect(0,0,w,h);
 ctx=HLX;SIL=1;SPX=p.x-ax;SPY=p.y-ay;try{spr(e.x,e.y,0,fn)}finally{ctx=sv;SIL=0;SPX=SPY=0}
 HLX.setTransform(1,0,0,1,0,0);HLX.globalAlpha=1;HLY.setTransform(1,0,0,1,0,0);HLY.globalCompositeOperation='source-over';HLY.clearRect(0,0,w,h);HLY.drawImage(HLC,0,0);
 HLY.globalCompositeOperation='source-in';HLY.fillStyle='#5b3a29';HLY.fillRect(0,0,w,h);HLX.globalCompositeOperation='source-in';HLX.fillStyle='#fdf9e3';HLX.fillRect(0,0,w,h);HLX.globalCompositeOperation='source-over';
 const r1=Math.max(2,1.7*s),r2=r1+Math.max(1.5,1.1*s),pul=.88+.12*Math.sin(t*6);
 ctx.setTransform(1,0,0,1,0,0);ctx.save();ctx.imageSmoothingEnabled=false;
 for(const o of HL8)ctx.drawImage(HLD,Math.round(p.x-ax+o[0]*r2),Math.round(p.y-ay+o[1]*r2));
 ctx.globalAlpha=pul;for(const o of HL8)ctx.drawImage(HLC,Math.round(p.x-ax+o[0]*r1),Math.round(p.y-ay+o[1]*r1));ctx.restore()}
function hlImg(e,t){if(e!==HOV)return;const s=ISO.scale(),b=PROPS.sprite(e,s),p=ISO.toCanvas(e.x,e.y,TER.standZ(e.x,e.y)),w=b.c.width,h=b.c.height; // contorno de props con sprite horneado (cofres, santuarios): mismo estilo que hl()
 if(HLC.width!==w||HLC.height!==h){HLC.width=HLD.width=w;HLC.height=HLD.height=h}
 HLX.setTransform(1,0,0,1,0,0);HLX.globalCompositeOperation='source-over';HLX.globalAlpha=1;HLX.clearRect(0,0,w,h);HLX.drawImage(b.c,0,0);
 HLY.setTransform(1,0,0,1,0,0);HLY.globalCompositeOperation='source-over';HLY.clearRect(0,0,w,h);HLY.drawImage(HLC,0,0);
 HLY.globalCompositeOperation='source-in';HLY.fillStyle='#5b3a29';HLY.fillRect(0,0,w,h);HLX.globalCompositeOperation='source-in';HLX.fillStyle='#fdf9e3';HLX.fillRect(0,0,w,h);HLX.globalCompositeOperation='source-over';
 const r1=Math.max(2,1.7*s),r2=r1+Math.max(1.5,1.1*s),pul=.88+.12*Math.sin(t*6),x0=Math.round(p.x-b.ax),y0=Math.round(p.y-b.ay);
 ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;for(const o of HL8)ctx.drawImage(HLD,Math.round(x0+o[0]*r2),Math.round(y0+o[1]*r2));
 ctx.globalAlpha=pul;for(const o of HL8)ctx.drawImage(HLC,Math.round(x0+o[0]*r1),Math.round(y0+o[1]*r1));ctx.restore()}
// ---- Drops en el suelo (13 oct 2026): los objetos que sueltan los enemigos caen al suelo (ya no se pierden con la mochila llena). Clic = ir a recogerlo; también se recogen al pasar por encima (si hay sitio).
// Calidad (rr(id): 0 común … 4 legendario) = color del brillo (RAR) + luz real de noche (DEFS g1..g4 en light.js) + haz de luz desde rara. TTL: 3 min (rara o mejor: 10 min). No se guardan en la partida.
function dropGround(id,x,y){if(GD.length>=80)GD.shift();const a=Math.random()*6.283,r=12+Math.random()*18;let tx=x+Math.cos(a)*r,ty=y+Math.sin(a)*r*.7;if(!TER.isLand(TER.heightAt(tx,ty))||PROPS.solid(tx,ty)||TER.cliffNear(tx,ty,6)){tx=x;ty=y}
 const now=performance.now(),q=rr(id);GD.push({dropG:1,id:'drop',it:id,x:tx,y:ty,ox:x,oy:y,t0:now,q,ph:Math.random()*6,exp:now+(q>=2?600000:180000)})}
function pickG(g,now){const i=GD.indexOf(g);if(i<0)return false;if(!room(g.it)){if(now-(pickG.w||0)>2500){pickG.w=now;toast('🎒 Mochila llena: vende o usa el banco',1800)}return false}
 GD.splice(i,1);add(g.it);GA.push({it:g.it,x:g.x,y:g.y,t0:now,q:g.q,ph:g.ph});P.pk=now;snd(g.q>=2?'rare':'coin');dirty=1;return true}
function dropUpd(now){for(let i=GD.length-1;i>=0;i--)if(now>GD[i].exp)GD.splice(i,1);for(let i=GA.length-1;i>=0;i--)if(now-GA[i].t0>420)GA.splice(i,1);
 if(P.hp>0&&GD.length&&now-(dropUpd.l||0)>120){dropUpd.l=now;for(const g of GD.slice())if(now-g.t0>520&&Math.hypot(g.x-P.x,g.y-P.y)<26)pickG(g,now)}}
const GIC={},GCL={};
function dropIcon(id){let c=GIC[id];if(c)return c;c=GIC[id]=document.createElement('canvas');c.width=c.height=28;const bake=src=>{const g=c.getContext('2d');g.clearRect(0,0,28,28);const t=document.createElement('canvas');t.width=t.height=28;const x=t.getContext('2d');x.imageSmoothingEnabled=false;src(x);
  // contorno de tinta alrededor del icono (mismo #5b3a29 del resto del arte)
  const o=document.createElement('canvas');o.width=o.height=28;const y=o.getContext('2d');for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]])y.drawImage(t,dx,dy);y.globalCompositeOperation='source-in';y.fillStyle='#5b3a29';y.fillRect(0,0,28,28);g.drawImage(o,0,0);g.drawImage(t,0,0)};
 bake(x=>{x.imageSmoothingEnabled=true;x.drawImage(ITEMICON.canvas(id),2,2,24,24)});return c}
function glowCol(col){let c=GCL[col];if(c)return c;c=GCL[col]=document.createElement('canvas');c.width=c.height=48;const g=c.getContext('2d'),r=g.createRadialGradient(24,24,0,24,24,24);r.addColorStop(0,col+'ee');r.addColorStop(.35,col+'88');r.addColorStop(1,col+'00');g.fillStyle=r;g.fillRect(0,0,48,48);return c}
const lofs=(ax,ay,bx,by)=>{const k=SPR*ISO.scale(),p=ISO.toCanvas(ax,ay,TER.standZ(ax,ay)),q=ISO.toCanvas(bx,by,TER.standZ(bx,by));return[(q.x-p.x)/k,(q.y-p.y)/k]};
function dDrop(e,t,now){if(SIL)return;const age=now-e.t0,u=Math.min(1,age/520),col=RAR[e.q][1],nt=sunS(t)<.05,x=e.x,y=e.y,hv=e===HOV;let ox=0,oy=0,z=0;
 if(u<1){const o=lofs(x,y,e.ox,e.oy);ox=o[0]*(1-u);oy=o[1]*(1-u);z=Math.sin(u*Math.PI)*20+(u>.85?0:0)}else z=1.5+Math.sin(t*3+e.ph)*1.2;
 ctx.save();ctx.fillStyle='rgba(60,40,20,.28)';ctx.beginPath();ctx.ellipse(x+ox,y+oy,6-z*.06,3,0,0,7);ctx.fill();
 if(e.q>=1){const pu=.5+.5*Math.sin(t*3+e.ph),R2=(12+e.q*4)*(.9+.2*pu);ctx.globalCompositeOperation=nt?'lighter':'source-over';ctx.globalAlpha=(nt?.55:.7)+.2*pu;ctx.drawImage(glowCol(col),x+ox-R2,y+oy-6-z-R2,R2*2,R2*2);
  if(e.q>=2&&u>=1){ctx.globalCompositeOperation='lighter';const bh=14+e.q*10,gr=ctx.createLinearGradient(0,y-4,0,y-4-bh);gr.addColorStop(0,col+'aa');gr.addColorStop(1,col+'00');ctx.globalAlpha=.55+.25*pu;ctx.fillStyle=gr;ctx.fillRect(x-2.2,y-4-bh,4.4,bh)}
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=.9;ctx.fillStyle=col;for(let i=0;i<e.q+1;i++){const ph=(t*.6+i/(e.q+1)+e.ph)%1;ctx.globalAlpha=Math.sin(ph*Math.PI)*.9;ctx.fillRect(x+Math.sin(e.ph*7+i*2.4)*8-.8,y-6-ph*(16+e.q*5),1.6,1.6)}}
 ctx.globalAlpha=1;if(hv){ctx.shadowColor='#fdf9e3';ctx.shadowBlur=4}
 ctx.drawImage(dropIcon(e.it),x+ox-8,y+oy-6-z-9,16,16);ctx.restore()}
function dPick(a,t,now){if(SIL)return;const u=Math.min(1,(now-a.t0)/380),eu=u*u*(3-2*u),k=SPR*ISO.scale(),p=ISO.toCanvas(a.x,a.y,TER.standZ(a.x,a.y)),pp=ISO.toCanvas(P.x,P.y,TER.standZ(P.x,P.y)),dx=(pp.x-p.x)/k,dy=(pp.y-p.y)/k-14,col=RAR[a.q][1];
 const x=a.x+dx*eu,y=a.y+dy*eu-Math.sin(u*Math.PI)*8-4*(1-eu),s=1-.45*eu;ctx.save();ctx.globalAlpha=1-.35*u*u;
 ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.7*(1-u);ctx.drawImage(glowCol(a.q?col:'#fff3b0'),x-12,y-12,24,24);ctx.globalCompositeOperation='source-over';
 ctx.globalAlpha=1-.4*u*u;ctx.drawImage(dropIcon(a.it),x-8*s,y-8*s,16*s,16*s);
 if(u>.8){const w=(u-.8)/.2;ctx.globalAlpha=1-w;ctx.strokeStyle=col;ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(x,y,4+w*10,0,7);ctx.stroke()}ctx.restore()}
// ---- F1-C3 · oclusión: un objeto alto (recurso o estación) que está DELANTE del jugador y le tapa se dibuja al 50 % con transición suave. ----
// Cómo: si el objeto es candidato (delante en profundidad y cerca en pantalla) se renderiza en un lienzo pequeño (OCC), se mira cuántos píxeles
// opacos caen sobre el rectángulo del jugador (4 % o más = tapa) y se estampa con alpha animado (e._oa, 0.5–1). Los demás objetos se dibujan
// directos con spr() como siempre. Es por píxeles, no por cajas: la copa de un árbol tapa, el hueco entre ramas no. No usa ctx.filter.
// Los monstruos NO se atenúan. Si algún día hace falta, basta llamar a occ() también para ellos en draw().
const OCC=document.createElement('canvas'),OCX=OCC.getContext('2d',{willReadFrequently:true});let OCDT=1/60; // OCL: lienzo en GPU para la luz (sin lecturas de píxeles)
// Luz sobre un sprite (src/light.js): pinta en el lienzo pequeño un degradado cálido en el lado que mira a la luz y uno oscuro en el opuesto, y lo estampa. self = el objeto (no se tapa a sí mismo).
function litSpr(x,y,fn,self,ext){const li=LIGHT.on?LIGHT.at(x,y,self):null;if(!li||li.w<.04){spr(x,y,0,fn);return}
 const s=ISO.scale(),p=ISO.toCanvas(x,y,TER.standZ(x,y)),w=Math.ceil(300*s),h=Math.ceil(340*s),ax=Math.round(w/2),ay=Math.round(h-50*s),sv=ctx;
 const L=LIGHT.sprite(w,h),OLX=L.g;ctx=OLX;SPX=p.x-ax;SPY=p.y-ay;try{spr(x,y,0,fn)}finally{ctx=sv;SPX=SPY=0}
 LIGHT.tint(OLX,w,h,ax,ay-(ext?ext*.9:34*s),ext||36*s,li);
 ctx.setTransform(1,0,0,1,0,0);ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(L.c,p.x-ax,p.y-ay);ctx.restore()}
function occ(e,fn){const s=ISO.scale(),k=SPR*s,p=ISO.toCanvas(e.x,e.y,TER.standZ(e.x,e.y)),pf=ISO.toCanvas(P.x,P.y,TER.standZ(P.x,P.y)),dy=p.y-pf.y,
  cand=ISO.depth(e.x,e.y)>ISO.depth(P.x,P.y)&&dy>-8*k&&dy<70*k&&Math.abs(p.x-pf.x)<40*k;let cur=e._oa==null?1:e._oa;
 const li=LIGHT.on?LIGHT.at(e.x,e.y,e):null,lit=!!li&&li.w>.04;
 if(!cand&&cur>=1&&!lit){spr(e.x,e.y,0,fn);return}
 const w=Math.ceil(300*s),h=Math.ceil(340*s),ax=Math.round(w/2),ay=Math.round(h-50*s),sv=ctx;let CV,CX;
 if(cand){CV=OCC;CX=OCX;if(CV.width!==w||CV.height!==h){CV.width=w;CV.height=h}}else{const L=LIGHT.sprite(w,h);CV=L.c;CX=L.g}
 CX.setTransform(1,0,0,1,0,0);CX.globalAlpha=1;CX.clearRect(0,0,w,h);ctx=CX;SPX=p.x-ax;SPY=p.y-ay;try{spr(e.x,e.y,0,fn)}finally{ctx=sv;SPX=SPY=0}
 let tgt=1;
 if(cand){const px=ax+(pf.x-p.x),py=ay+(pf.y-p.y),x0=Math.max(0,Math.floor(px-8*k)),x1=Math.min(w,Math.ceil(px+8*k)),y0=Math.max(0,Math.floor(py-34*k)),y1=Math.min(h,Math.ceil(py-3*k));
  if(x1>x0&&y1>y0){const d=OCX.getImageData(x0,y0,x1-x0,y1-y0).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>100)n++;tgt=n>(x1-x0)*(y1-y0)*.04?.5:1}}
 cur+=(tgt-cur)*(1-Math.exp(-OCDT*14));if(Math.abs(cur-tgt)<.02)cur=tgt;e._oa=cur;
 if(lit)LIGHT.tint(CX,w,h,ax,ay-40*s,46*s,li);
 ctx.setTransform(1,0,0,1,0,0);ctx.save();ctx.globalAlpha=cur;ctx.imageSmoothingEnabled=false;ctx.drawImage(CV,p.x-ax,p.y-ay);ctx.restore()}
function dCur(t){CUR.tx=CUR.ty=-1;if(!CURON||!CUR.on||CK)return;
 const w=ISO.toWorld(CUR.px,CUR.py,TER.heightAt),q=ISO.tileAt(w.x,w.y);if(q.tx<0||q.ty<0||q.tx>=TER.NX||q.ty>=TER.NY)return;
 CUR.tx=q.tx;CUR.ty=q.ty;const h=TER.tileH(q.tx,q.ty),d=ISO.diamond(q.tx,q.ty,h),no=blk((q.tx+.5)*ISO.TILE,(q.ty+.5)*ISO.TILE),s=ISO.scale(),pul=.5+.5*Math.sin(t*5),cxx=(d[0].x+d[2].x)/2,cyy=(d[0].y+d[2].y)/2,
  sh=d.map(p=>({x:cxx+(p.x-cxx)*.92,y:cyy+(p.y-cyy)*.92})); // un poco más pequeño que el tile
 ctx.setTransform(1,0,0,1,0,0);ctx.save();ctx.lineJoin='round';cursorPoly(sh,.22);
 ctx.fillStyle=no?'rgba(229,83,61,'+(.22+.08*pul)+')':'rgba(255,255,255,'+(.2+.08*pul)+')';ctx.fill();
 ctx.lineWidth=Math.max(1,1.6*s);ctx.strokeStyle=no?'rgba(91,58,41,.85)':'rgba(253,249,227,.95)';ctx.stroke();ctx.restore()}
function draw(now){const t=now/1000;cx=Math.max(0,Math.min(WW-W,P.x-W/2))|0;cy=Math.max(0,Math.min(WH-H,P.y-H/2))|0;
 {const s0=sunS(t),ph0=2*Math.PI*(dayP(t)-.25),d0=Math.max(0,s0);SHD.dx=-Math.cos(ph0)*(8+20*(1-d0));SHD.dy=2+3*(1-d0);SHD.a=Math.max(0,Math.min(.28,(s0+.15)*.5))}
 const dt=LFT?Math.min(.1,(now-LFT)/1000):1/60,sk=now<SHK?(SHK-now)/200*3:0;if(LFT)ISO.follow(P.x,P.y,TER.standZ(P.x,P.y),dt);else ISO.snap(P.x,P.y,TER.standZ(P.x,P.y));LFT=now;OCDT=dt;
 ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=true;if(typeof WGL!=='undefined'&&WGL.ok)ctx.clearRect(0,0,cv.width,cv.height);else{ctx.fillStyle=TER.PAPER;ctx.fillRect(0,0,cv.width,cv.height)}
 if(INT){intScene(now,t);ctx.setTransform(cv.width/W,0,0,cv.height/H,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'}else{
 if(sk)ISO.cam.x+=(Math.random()-.5)*2*sk,ISO.cam.y+=(Math.random()-.5)*2*sk;
 TER.env(P.x,P.y,t,sunS(t));TER.draw(ctx,t);dCur(t);hovUpdate();lightUpd(now);
 const ents=[...N.filter(e=>onScr(e.x,e.y)).map(e=>[ISO.depth(e.x,e.y),()=>{hl(e,()=>dN(e,t,now),t);occ(e,()=>dN(e,t,now))}]),...ST.filter(e=>onScr(e.x,e.y)).map(e=>[ISO.depth(e.x,e.y),()=>{hl(e,()=>dS(e,t),t);occ(e,()=>dS(e,t))}]),...M.filter(e=>onScr(e.x,e.y)).map(e=>[ISO.depth(e.x,e.y),()=>{hl(e,()=>dM(e,t,now),t);litSpr(e.x,e.y,()=>dM(e,t,now),e)}]),...PO.filter(e=>onScr(e.x,e.y)).map(e=>[ISO.depth(e.x,e.y),()=>{hlImg(e,t);PROPS.draw(ctx,e,P,OCDT)}]),...PROPS.list.filter(e=>onScr(e.x,e.y)).map(e=>[ISO.depth(e.x,e.y),()=>PROPS.draw(ctx,e,P,OCDT)]),...GD.filter(e=>onScr(e.x,e.y)).map(e=>[ISO.depth(e.x,e.y),()=>spr(e.x,e.y,0,()=>dDrop(e,t,now))]),[ISO.depth(P.x,P.y),()=>litSpr(P.x,P.y,()=>dP(t,now),P)],...GA.map(a=>[ISO.depth(P.x,P.y)+.5,()=>spr(a.x,a.y,0,()=>dPick(a,t,now))])];
 BIOMES.gates.forEach(g=>{const gx=g.vert?g.x:(g.x0+g.x1)/2,gy=g.vert?(g.y0+g.y1)/2:g.y;if(onScr(gx,gy))ents.push([ISO.depth(g.vert?g.x:g.x1,g.vert?g.y1:g.y),()=>{ctx.setTransform(1,0,0,1,0,0);TER.gate(ctx,g.b,!!S.boss[g.b-1],t)}])});
 AMBI.draw(ctx,'ground');
 ents.sort((a,b)=>a[0]-b[0]).forEach(o=>o[1]());
 PJ.forEach(p=>{if(now>=p.t0)drawPJ(p,now)});drawTel(now);drawHFX(now);
 parts.forEach(p=>p.hs?hsDraw(p):spr(p.x,p.y,12,()=>{ctx.globalAlpha=Math.min(1,p.l);if(p.sp){ctx.beginPath();ctx.arc(p.x,p.y,7,0,7);ctx.fillStyle=p.sp;ctx.fill();T(p.tx,p.x,p.y+4,'#fff')}else if(p.tx)T(p.tx,p.x,p.y,p.c);else Rc(p.c,p.x,p.y,2,2);ctx.globalAlpha=1}));
 AMBI.draw(ctx,'over');
 if(!(typeof WGL!=='undefined'&&WGL.grain))PAINT.grain(ctx,cv.width,cv.height,ISO.V.dpr,.55); // grano de papel: con WGL lo pone un div con multiply (sin coste por frame); este es el plan B
 ctx.setTransform(cv.width/W,0,0,cv.height/H,0,0);ctx.globalAlpha=1;lighting(now);AMBI.draw(ctx,'late');ctx.setTransform(cv.width/W,0,0,cv.height/H,0,0);post(now);}
 if(CK){const a=ACT.co[CK.i],bx=W/2-150,by=H/2-40;Rc('#000000bb',bx-14,by-34,328,110);Rc('#000',bx-2,by-2,304,24);Rc('#3a3226',bx,by,300,20);Rc('#2a7a2a',bx+300*(CK.c-CK.hw),by,300*CK.hw*2,20);Rc('#ffe629',bx+300*(CK.c-CK.hw*.35),by,300*CK.hw*.7,20);Rc('#fff',bx+300*CK.pos-2,by-4,4,28);
 T((CK.bonus?'🎲 ¡Bonus de cocina! ':'')+a[0],W/2,by-12,'#ff981f');T(CK.res===null?'Espacio / clic: detén la barra en la zona verde':(CK.bonus?['Sin bonus esta vez','¡Plato extra!','¡PERFECTO! XP doble + plato extra']:['¡Quemado!','¡Bien!','¡PERFECTO!'])[CK.res],W/2,by+44,CK.res===2?'#ffe629':CK.res===0?'#e5533d':'#fff');T(CK.bonus?'Acierta: más XP y un plato extra (Esc: saltar)':'Racha: '+CK.streak+' · Esc para salir',W/2,by+62,'#aaa')}
{const g=GOALS[S.goal],tg=g&&goalReady(g)&&goTarget(g[5]);if(tg){const dx=tg.x-P.x,dy=tg.y-P.y,d=Math.hypot(dx,dy);if(d>70){const ta=ISO.proj(tg.x,tg.y),pa=ISO.proj(P.x,P.y),an=Math.atan2(ta.y-pa.y,ta.x-pa.x),px=W/2+Math.cos(an)*42,py=H/2-12+Math.sin(an)*42+Math.sin(performance.now()/200)*2;ctx.fillStyle='#ffe629';ctx.beginPath();ctx.moveTo(px+Math.cos(an)*8,py+Math.sin(an)*8);ctx.lineTo(px+Math.cos(an+2.4)*7,py+Math.sin(an+2.4)*7);ctx.lineTo(px+Math.cos(an-2.4)*7,py+Math.sin(an-2.4)*7);ctx.fill();T(Math.round(d/10)+' m',px,py-12,'#ffe629')}}}
if(LASTX&&performance.now()-LASTX[1]<7000){const k=LASTX[0],l=L(k),x=S.xp[k],pc=l>=99?1:(x-XT[l])/(XT[l+1]-XT[l]);UI.plate(ctx,6,H-40,160,32,{r:6});ctx.save();ctx.font='600 12px '+UI.FONT;ctx.fillStyle=UI.TXT;ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(SK[k][1]+' '+SK[k][0]+' nv.'+l,14,H-30);ctx.restore();UI.trough(ctx,14,H-20,144,7,pc,'#8fc443')}
hudFx(now);if(MM&&!INT)drawMap(now);
UI.vitals(ctx,now/1000,{cx:W/2,by:H-4,hp:P.hp,mhp:maxHp(),en:EN,men:enMax(),mn:MN,mmn:mnMax()});hudPlate(now);if(ZB){const el=now-ZB.t0;if(el>3600)ZB=null;else{ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,(3600-el)/1400));ctx.font='16px VT323, monospace';const tw=ctx.measureText(ZB.t).width+28;UI.plate(ctx,W/2-tw/2,8,tw,24);ctx.fillStyle=UI.TXT;ctx.textAlign='center';ctx.fillText(ZB.t,W/2,25);ctx.restore()}}{let by=H-118;const chip=(tx)=>{ctx.save();ctx.font='600 11px '+UI.FONT;const tw=ctx.measureText(tx).width+14,bx=W/2-tw/2;UI.plate(ctx,bx,by,tw,17,{r:8});ctx.fillStyle=UI.TXT;ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(tx,bx+7,by+9.5);ctx.restore();by-=21};[['xp','Sabiduría'],['dmg','Fuerza'],['spd','Rapidez'],['def','Piel de piedra']].forEach(([k,n])=>{const r=S.buf[k]-Date.now();if(r>0)chip(n+' '+Math.ceil(r/1000)+'s')});}
 if(A){let p,lb;if(A.ty==='f'){const m=A.e;p=m.hp/m.mh;lb=m.d.n+' nv.'+m.lv+' '+Math.max(0,m.hp)+'/'+m.mh}else{p=Math.min(1,A.pr||0);lb=actLabel()}
  ctx.save();ctx.font='600 12px '+UI.FONT;ctx.textAlign='center';ctx.lineJoin='round';ctx.lineWidth=3;ctx.strokeStyle=UI.INK;ctx.strokeText(lb,W/2,H-90);ctx.fillStyle=UI.TXT;ctx.fillText(lb,W/2,H-90);ctx.restore();UI.trough(ctx,W/2-100,H-84,200,12,p,A.ty==='f'?'#e5484d':'#f0a63a')}}
cv.addEventListener('pointerdown',ev=>{if(CK){cookHit();return}if(ZMP)return;const r=cv.getBoundingClientRect(),px=(ev.clientX-r.left)*cv.width/r.width,py=(ev.clientY-r.top)*cv.height/r.height,now=performance.now(),sc=ISO.scale(),k=SPR*sc;
 const b=pickEnt(px,py,now);
 if(A)stopA();if(b){P.g={e:b};P.mv=null}else{const w=ISO.toWorld(px,py,TER.heightAt);P.mv={x:w.x,y:w.y};P.g=null}});
const KM={ArrowLeft:'l',a:'l',ArrowRight:'r',d:'r',ArrowUp:'u',w:'u',ArrowDown:'d',s:'d'};
addEventListener('keydown',e=>{const k=KM[e.key];if(k){K[k]=1;e.preventDefault()}if(e.key==='r'||e.key==='R')tgRun();if(e.key==='m'||e.key==='M')MM=(MM+1)%3;if(e.key==='g'||e.key==='G')tgCur();if(e.key==='F3'){perfTog();e.preventDefault()}if((e.key==='+'||e.key==='=')&&!/INPUT|TEXTAREA/.test((e.target||{}).tagName||''))setZoom(ZMI+1);if((e.key==='-'||e.key==='_')&&!/INPUT|TEXTAREA/.test((e.target||{}).tagName||''))setZoom(ZMI-1);if((e.key===' '||e.key==='Enter')&&CK){cookHit();e.preventDefault()}if((e.key==='f'||e.key==='F')&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/INPUT|TEXTAREA/.test((e.target||{}).tagName||'')&&!CK){useNear();e.preventDefault()}if(e.key==='Escape'){if(QOPEN)qCloseBoard();else if(CK)CK=null;else if(IW)closeIW();else if(panelOpen()){setPanel(false,1);document.querySelectorAll('#tabs button').forEach(b=>b.classList.remove('on'))}}if(!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/INPUT|TEXTAREA/.test((e.target||{}).tagName||'')){const TK={i:'inv',p:'ch',k:'sk',q:'qm',l:'q',c:'col',z:'mg'}[(e.key||'').toLowerCase()];if(TK&&!CK)tabClick(TK);if(e.key==='v'||e.key==='V')specTog()}});addEventListener('keyup',e=>{const k=KM[e.key];if(k)K[k]=0});
addEventListener('pointerdown',()=>pd=1);addEventListener('pointerup',()=>setTimeout(()=>pd=0,60));
let hid=0;document.addEventListener('visibilitychange',()=>{if(document.hidden)hid=Date.now();else if(A&&A.ty!=='f'&&Date.now()-hid>5000){offline(Date.now()-hid,A.sk,A.i);A.t0=performance.now()}});

// ---------- paneles ----------
const PDS={xp:'+50% de XP durante 3 min. Clic para usar.',dmg:'Fuerza +3 (más 10% de tu nivel) durante 3 min. Clic para usar.',spd:'+35% de velocidad durante 3 min. Clic para usar.'};
function desc(id){const d=I[id],o=[(rr(id)?'<b style="color:'+RAR[rr(id)][1]+'">'+d[0]+'</b>':d[0])+' · vale '+d[2]+' oro'],ing=[];
 if(id.includes('~')&&!(TOOLT[id]&&TOOLT[id].pa))o.push('<span style="color:'+RAR[rr(id)][1]+'">'+RAR[rr(id)][0]+'</span> · fabricado: mejores estadísticas base, sin habilidades especiales');if(LOOT[id]){const it=LOOT[id],TX={def:'Defensa',str:'Fuerza',acc:'Precisión',mana:'Maná',mreg:'Regen. de maná',hp:'PV'};o.push('<span style="color:'+RAR[it.r][1]+'">'+RAR[it.r][0]+'</span> · '+LS[it.s][0]+' · Clic para equipar');for(const k in it.st)o.push('+'+it.st[k]+' '+TX[k]);(it.pa||[]).forEach(p=>o.push('<span style="color:#ffd100">'+PS[p.id].d(p.v)+'</span>'))}
 if(TOOLT[id]){const T=TOOLT[id];o.push('Herramienta de '+({wc:'tala',mi:'minería',fi:'pesca'})[T.k]+' · tier '+T.t+(T.bq?' (+'+Math.round(T.bq*100)+'% hacia el siguiente tier, nunca lo supera)':'')+' · Clic para equipar');(T.pa||[]).forEach(p=>o.push('<span style="color:#ffd100">'+PS[p.id].d(p.v)+'</span>'))}
 if(/^rv_/.test(id))o.push('Runa reutilizable: te teletransporta a la plaza de ese bioma. Enfriamiento de 45 s y no se puede usar en combate. Clic para usar.');
 if(SCI[id]!==undefined)o.push('Pergamino de un solo uso: lanza '+SPL[SCI[id]].n+' sin gastar maná ni runas. Requiere Magia nv. '+SPL[SCI[id]].lv+'. Clic para usar.');
 if(MANAP[id])o.push('Poción: restaura '+MANAP[id]+' de maná. Clic para usar.');if(d[4])o.push('Restaura '+d[4]+' de maná y acelera su regeneración 90 s.');
 if(d[3])o.push('Comida: cura '+d[3]+' PV. Clic para comer: la cura es progresiva (unos segundos).');
 if(SW[id])o.push('Arma cuerpo a cuerpo · precisión +'+fs(SW[id])+' · fuerza +'+fs(SB[id]||0)+' · '+((WSP[id]||4)*.6).toFixed(1)+' s por ataque. Clic para equipar.');
 if(BOW[id])o.push('Arma a distancia · precisión +'+fs(BOW[id])+' · fuerza +'+fs(SB[id]||0)+' · '+((WSP[id]||4)*.6).toFixed(1)+' s por ataque. Usa Combate. Clic para equipar.');if(STF[id])o.push('Arma mágica: +'+STF[id]+' de daño a hechizos, +'+STF[id]*2+' de maná máximo · lanza solo tu mejor hechizo cada '+((WSP[id]||5)*.6).toFixed(1)+' s (gasta maná y runas). Clic para equipar.');if(AR[id])o.push('Armadura: +'+AR[id]+' de defensa. Clic para equipar.');if(SHL[id])o.push('Escudo: +'+SHL[id]+' de defensa. Clic para equipar.');if(LGL[id])o.push('Pantalones: +'+LGL[id]+' de defensa. Clic para equipar.');if(GLL[id])o.push('Guantes: +'+GLL[id]+' de defensa. Clic para equipar.');
 if(POT[id])o.push(PDS[POT[id]]);if(id==='quemado')o.push('Inservible. Véndelo.');
 for(const sk in ACT)ACT[sk].forEach(a=>{if(a.length===5&&a[1]===id)o.push('Se obtiene con '+SK[sk][0]+' (nv. '+a[2]+')');if(a.length===6){if(a[2]===id)o.push('Se fabrica: '+a[0]+' ('+SK[sk][0]+' nv. '+a[3]+')');if(a[1][id])ing.push(a[0])}});
 if(ing.length)o.push('Sirve para: '+ing.slice(0,3).join(', ')+(ing.length>3?'…':''));
 for(const k in RARE)if(RARE[k][0]===id)o.push('Drop raro de '+SK[k][0]+' (1/'+RARE[k][1]+')');
 for(const m in MD){if(MD[m].dr.some(x=>x[0]===id))o.push('Lo suelta: '+MD[m].n);if(MD[m].rare&&MD[m].rare[0]===id)o.push('Drop raro de: '+MD[m].n)}
 return o.join('\n')}
const tip=document.createElement('div');tip.id='tip';document.body.appendChild(tip);
document.addEventListener('mouseover',e=>{const t=e.target.closest&&e.target.closest('[data-i],[data-x]');if(!t){tip.style.display='none';return}tip.innerHTML=t.dataset.x||desc(t.dataset.i);tip.style.display='block'});
document.addEventListener('mousemove',e=>{if(tip.style.display==='block'){tip.style.left=Math.max(4,Math.min(innerWidth-300,e.clientX+14))+'px';tip.style.top=Math.min(innerHeight-120,e.clientY+14)+'px'}});
const near=e=>e&&!e.deco&&Math.hypot(P.x-e.x,P.y-e.y)<80;
const sideEl=()=>$('#side'),panelOpen=()=>!sideEl().classList.contains('closed'),setPanel=(o,keep)=>{sideEl().classList.toggle('closed',!o);if(keep)try{localStorage.setItem('ns_pn',o?1:0)}catch(e){}};
// ---- Instalaciones: cada una abre SU ventana anclada en el mundo (tecla F, o un toque en el aviso). Reutiliza el HTML de panelHTML() ('bank' | 'shop' | 'st'). ----
let IW=null;
const IWI={door:['door','Entrar','#d9a35a'],exit:['door','Salir','#d9a35a'],bank:['bank','Abrir','#e8b84a'],shop:['shop','Comerciar','#e58aa8'],fire:['fire','Cocinar','#ff9a3a'],furnace:['furnace','Fundir','#e5784a'],anvil:['anvil','Forjar','#8f9aa6'],bench:['bench','Fabricar','#bd7a45'],altar:['altar','Inscribir','#7cc0e8']};
const iwTab=e=>e.id==='bank'?'bank':e.id==='shop'?'shop':'st',iwInfo=e=>IWI[e.id]||['bench','Usar','#9b6a3f'];
// Filtro de la ventana (oct 2026): buscador + «Puedo» (solo lo que se puede hacer ahora). La lista crece con el nivel, así que el filtro vive FUERA de #swb (no pierde el foco al repintar).
let IWQ='',IWC=1;try{IWC=localStorage.getItem('ns_iwc')==='0'?0:1}catch(e){}
const nrm=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''),
 iwFilt=()=>{const f=$('#swf');if(!IW){f.innerHTML='';return}f.innerHTML='<input id="swq" type="search" placeholder="🔍 Buscar" autocomplete="off" value="'+IWQ.replace(/"/g,'')+'">'+(IW.tab==='st'?'<button class="bt'+(IWC?' on':'')+'" id="swc" title="Mostrar solo lo que puedes hacer ahora">✔ Puedo</button>':'');const q=$('#swq');q.oninput=()=>{IWQ=nrm(q.value.trim());dirty=1;panel()};q.onkeydown=ev=>{ev.stopPropagation();if(ev.key==='Escape'){q.blur();closeIW()}};const c=$('#swc');if(c)c.onclick=()=>{IWC=IWC?0:1;try{localStorage.setItem('ns_iwc',IWC)}catch(e){}c.classList.toggle('on',!!IWC);panel()}};
function openIW(e){if(!e)return;if(e.id==='door'){enterRoom(e);return}if(e.id==='exit'){leaveRoom();return}if(e.id==='ru'){closeIW();talk();return}if(e.id==='board'){closeIW();qOpenBoard();return}const m=iwInfo(e),w=$('#sw');IW={e,tab:iwTab(e)};IWQ='';IWSEL=null;IWCAT='';IWLK=0;iwFilt();if(IW.tab==='st')S.stn=e;w.hidden=false;w.dataset.k=e.id;w.style.setProperty('--acc',m[2]);$('#swi').style.backgroundImage='url('+UI.icon(m[0])+')';$('#swt').textContent=e.n;panel();iwFrame()}
function closeIW(){IW=null;iwFilt();$('#sw').hidden=true}
function useNear(){if(IW){closeIW();return}let b=null,bd=1e9;ST.forEach(s=>{const d=Math.hypot(P.x-s.x,P.y-s.y);if(near(s)&&d<bd){bd=d;b=s}});if(b)openIW(b)}
const stPos=e=>{const q=ISO.toCanvas(e.x,e.y,TER.standZ(e.x,e.y)),k=innerWidth/cv.width;return{x:q.x*k,y:q.y*k,h:(e.lh||60)*ISO.scale()*k}};
const COARSE=window.matchMedia&&matchMedia('(pointer:coarse)').matches;
function iwFrame(){const fp=$('#fp'),sw=$('#sw');
 if(IW&&Math.hypot(P.x-IW.e.x,P.y-IW.e.y)>110)closeIW();
 let e=null;if(!IW&&!CK){let bd=1e9;ST.forEach(s=>{const d=Math.hypot(P.x-s.x,P.y-s.y);if(near(s)&&d<bd){bd=d;e=s}})}
 if(e){const q=stPos(e),m=iwInfo(e);if(fp.dataset.id!==e.id){fp.dataset.id=e.id;fp.innerHTML=(COARSE?'<i class="tap"></i>':'<kbd>F</kbd>')+'<span>'+m[1]+'</span>';fp.style.setProperty('--acc',m[2])}
  fp.hidden=false;fp.style.left=Math.round(Math.max(60,Math.min(innerWidth-60,q.x)))+'px';fp.style.top=Math.round(Math.max(44,q.y-q.h-30))+'px'}else{fp.hidden=true;fp.dataset.id=''}
 sw.style.visibility=CK?'hidden':'';if(IW){const q=stPos(IW.e),w=sw.offsetWidth,vw=innerWidth,vh=innerHeight,bot=vh-(84*HUDS)-8,sa=q.y-q.h-34-8,sb=bot-(q.y+16),below=sa<Math.min(300,sb)&&sb>sa; // bot: deja libres los vitales de abajo
  const mh=Math.max(180,Math.min(vh*.72,below?sb:sa));sw.style.maxHeight=Math.round(mh)+'px';const h=sw.offsetHeight;let left=Math.max(8,Math.min(vw-w-8,q.x-w/2)),top=below?q.y+16:q.y-q.h-34-h;top=Math.max(8,Math.min(bot-h,top));
  sw.style.left=Math.round(left)+'px';sw.style.top=Math.round(top)+'px';sw.style.setProperty('--tx',Math.round(Math.max(18,Math.min(w-18,q.x-left)))+'px');sw.classList.toggle('below',below)}}
function hudPlate(now){ctx.save();const x=W-202,w=196;UI.plate(ctx,x,6,w,30,{r:7});ctx.font='600 13px '+UI.FONT;ctx.fillStyle=UI.TXT;ctx.textBaseline='middle';ctx.textAlign='left';ctx.fillText(INT?'🏠 '+INT.R.nm+' · '+BI[INT.k].n:BI[curB].ic+' '+BI[curB].n+' · nv '+BI[curB].lv+'+',x+9,21.5);ctx.textAlign='right';ctx.fillStyle=UI.GOLD;ctx.fillText(clk(),x+w-9,21.5);ctx.restore()}
UI.initDom();if(/[?&]perf\b/.test(location.search))perfTog();
function tabClick(t){if(TB===t&&panelOpen()){setPanel(false,1);document.querySelectorAll('#tabs button').forEach(b=>b.classList.remove('on'));return}tab(t);setPanel(true,1)}
function tgGoal(){$('#goalp').classList.toggle('min');try{localStorage.setItem('ns_goal',$('#goalp').classList.contains('min')?1:0)}catch(e){}}
function tab(t){TB=t;setPanel(true);document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));panel()}
const ownT0=a=>typeof a[2]==='string'&&a[2].startsWith('tl:')&&S.tool[a[2].split(':')[1]]>=+a[2].split(':')[2];
const buyI=(id,c)=>{if(S.coins<c||!room(id))return;S.coins-=c;S.inv.push(id);snd('coin');dirty=1;save()};
const buyU=(k,i)=>{const c=UP[i][3][S[k]];if(c==null||S.coins<c)return;S.coins-=c;S[k]++;snd('quest');log('Mejora comprada: '+UP[i][1]);dirty=1;save()};
const travel=(k,c)=>{if(S.coins<c)return;if(INT)leaveRoom(1);S.coins-=c;stopA();P.g=P.mv=null;{const q=spawnOf(k);P.x=q.x;P.y=q.y}FD=performance.now();snd('coin');dirty=1;save()};
let td,DL=null;
function talk(){inc('talk');S.gseen=S.goal;const g=GOALS[S.goal];DL={p:(g?(g[4]||'¡Hola de nuevo, viajero!'):'¡Lo lograste todo, viajero! Ahora ve por el nivel 99 en cada skill y completa la colección.').split('|'),i:0};dlgShow();dirty=1;save()}
function dlgShow(){const d=$('#dlg');d.innerHTML='<b style="color:var(--or)">Ru</b><br>'+DL.p[DL.i]+(DL.i<DL.p.length-1?' <span style="color:var(--yl)">▸ clic</span>':'');d.style.display='block';clearTimeout(td);td=setTimeout(()=>d.style.display='none',20000)}
function dlgNext(){if(!DL||DL.i>=DL.p.length-1){$('#dlg').style.display='none';return}DL.i++;dlgShow()}
const ROOMOF={furnace:'herreria',anvil:'herreria',bench:'taller',altar:'taller',fire:'taberna',bank:'banco',shop:'tienda'};
function goTarget(s){if(!s)return null;const now=performance.now(),[k,a,b]=s.split(':');let l2=k==='S'?(()=>{let l=ST.filter(e=>e.id===a&&!e.deco);if(!l.length&&ROOMOF[a])l=INT?ST.filter(e=>e.id==='exit'):ST.filter(e=>e.id==='door'&&e.room===ROOMOF[a]);return l})():k==='N'?N.filter(e=>e.t===a&&e.i===+b&&alive(e,now)):k==='M'?M.filter(e=>e.d.id===a&&alive(e,now)):k==='B'?[spawnOf(+a)]:[],best=null,bd=1e9;l2.forEach(e=>{const d=Math.hypot(e.x-P.x,e.y-P.y);if(d<bd){bd=d;best=e}});return best}
function recipeOf(id){for(const sk in ACT){const a=ACT[sk].find(a=>a.length===6&&(a[2]===id||(id.startsWith('rn_')&&String(a[2]).startsWith(id+':'))));if(a)return[sk,a]}return null}
function goalReady(g){if(!g[1].startsWith('make:'))return true;const r=recipeOf(g[1].slice(5));return !r||(L(r[0])>=rq(r[1])&&hasIn(r[1][1]))}
const chips=o=>Object.entries(o).map(([k,v])=>{const n=have(k);return `<span class="chip ${n>=v?'ok':'no'}" data-i="${k}">${ic(k)} ${I[k][0]} ${n}/${v}</span>`}).join(''),STN={furnace:'el Horno',anvil:'el Yunque',fire:'la Fogata',bench:'el Taller',altar:'el Escritorio'},
 // qué hace cada instalación: se muestra al abrir su menú (en vez de explicarlo en las skills)
 STD={furnace:'Funde menas en barras.',anvil:'Forja armas y herramientas.',fire:'Cocina comida que te cura.',bench:'Fabrica armaduras y esculpe cañas, arcos y bastones.',altar:'Inscribe pergaminos de hechizo: no gastan maná ni runas.'};
function goalsHTML(){const g=GOALS[S.goal];let h='';
 if(g){const v=Math.min(g[2],S.st[g[1]]||0),r=g[1].startsWith('make:')&&recipeOf(g[1].slice(5)),rd=goalReady(g);
  h=`<div style="color:var(--yl);font-size:25px">${g[0]}</div><div class="hint" style="margin:2px 0">${g[2]>1?fmt(v)+'/'+fmt(g[2]):''}${g[3]?' · Recompensa: '+g[3]+' oro':''}</div>${g[2]>1?`<div class="bar"><i style="width:${v/g[2]*100}%"></i></div>`:''}`
  +(r?`<div style="margin-top:6px">${chips(r[1][1])}</div>${L(r[0])<rq(r[1])?`<div class="hint" style="margin:2px 0">Requiere ${SK[r[0]][0]} nv. ${rq(r[1])}</div>`:''}<div class="hint" style="margin:2px 0">📍 Se hace en ${STN[g[5].slice(2)]||'la estación'}${rd?'':' · la flecha aparecerá cuando tengas todo'}</div>`:'')
  +`<div class="hint" style="color:#d8c9a3;margin-top:8px">💬 ${(g[4]||'Habla con Ru, en la plaza.').split('|').pop()}</div>`;
  h+='<div class="hint" style="margin-top:12px">Después:</div>'+GOALS.slice(S.goal+1,S.goal+2).map(x=>'<div class="hint" style="margin:2px 0;opacity:.7">• '+x[0]+'</div>').join('')}
 else h='<div style="color:var(--yl)">¡Completaste todos los objetivos!</div><div class="hint">Sube tus skills a 99.</div>';
 let best=null;SKL.forEach(k=>{const l=L(k);if(l>=99)return;const p=(S.xp[k]-XT[l])/(XT[l+1]-XT[l]);if(!best||p>best[1])best=[k,p,l,XT[l+1]-S.xp[k]]});
 if(best&&best[1]>.5)h+=`<div style="margin-top:14px;border-top:2px dashed var(--hi);padding-top:8px">⚡ ¡Casi! ${SK[best[0]][1]} ${SK[best[0]][0]} nv.${best[2]+1} al ${Math.floor(best[1]*100)}%<div class="hint" style="margin:0">Faltan ${fmt(best[3])} XP</div></div>`;
 return h+bossHTML()}
// el río del sudoeste solo se cruza por el puente: la ruta automática pasa por él
function bridgeWp(tg){const k=biomeAt(P.x,P.y);if(k<0||biomeAt(tg.x,tg.y)!==k)return null;const B=BI[k],br=B.village.bridge;if(!br)return null;const x0=B.ox,y0=B.oy,bx=x0+270,py=P.y-y0,ty0=tg.y-y0;
 if(P.x>x0+490||tg.x>x0+490)return null;const pn=py<1236,ps=py>1304,tn=ty0<1236,ts=ty0>1304;
 if((pn&&ts)||(ps&&tn))return Math.abs(P.x-bx)>12?{x:bx,y:y0+(pn?1224:1316)}:{x:bx,y:y0+(pn?1318:1222)};
 if(!pn&&!ps&&Math.abs(P.x-bx)<=14){if(ts)return{x:bx,y:y0+1318};if(tn)return{x:bx,y:y0+1222}}return null}
function useRV(k){if(INT)leaveRoom(1);const now=Date.now();if(k>=(S.st.bio||1)){log('Aún no has llegado a ese bioma.');return}if(performance.now()<(P.pj||0)||(A&&A.ty==='f')){log('No puedes usar la runa en combate.');return}if(now<(S.rvt||0)){log('La runa se está recargando: '+Math.ceil((S.rvt-now)/1000)+' s.');return}
 stopA();P.g=P.mv=null;sp(P.x,P.y-16,'#8ad8ff',20,100,90,140);{const q=spawnOf(k);P.x=q.x;P.y=q.y}FD=performance.now();sp(P.x,P.y-16,'#8ad8ff',20,100,90,140);S.rvt=now+45000;snd('magic');log('🌀 Te teletransportas a '+BI[k].n+'.');dirty=1;save()}
function buyRV(k){const id='rv_'+k,c=RVC[k];if(S.coins<c||count(id)>0||S.bank[id]>0)return;S.coins-=c;if(room(id))S.inv.push(id);else S.bank[id]=1;disc(id);snd('coin');log('Compraste: '+I[id][0]);dirty=1;save()}
function syncTools(){for(const k of ['wc','mi','fi']){const id=S.eq[k],T=id&&TOOLT[id];S.tool[k]=T?T.t:0;S.tq[k]=T?T.bq||0:0}}
function autoEq(id){const T=TOOLT[id];if(T&&!S.eq[T.k]){S.eq[T.k]=id;const j=S.inv.lastIndexOf(id);if(j>=0)S.inv.splice(j,1);syncTools();toast('🔧 ¡Herramienta equipada!<br>'+I[id][0])}}
const ownT=a=>false,unq=k=>{const id=S.eq[k];if(!id||!room(id))return;S.inv.push(id);S.eq[k]=null;syncTools();dirty=1;save()};
function use(i){const id=S.inv[i];if(/^rv_/.test(id)){useRV(+id.slice(3));return}
 if(TOOLT[id]){const k=TOOLT[id].k,o=S.eq[k];S.eq[k]=id;S.inv.splice(i,1);if(o)S.inv.push(o);syncTools();snd('coin');dirty=1;save();return}
 if(SCI[id]!==undefined){if(cast(SCI[id],1)){S.inv.splice(S.inv.indexOf(id),1);dirty=1;save()}return}
 if(WB[id]||AR[id]||SHL[id]||LGL[id]||GLL[id]||LOOT[id]){let k=LOOT[id]?LOOT[id].s:WB[id]?'w':SHL[id]?'s':LGL[id]?'l':GLL[id]?'g':'a';if(k==='r'&&S.eq.r&&!S.eq.r2)k='r2';const o=S.eq[k];S.eq[k]=id;S.inv.splice(i,1);if(o)S.inv.push(o);snd('coin');dirty=1;save();return}if(MANAP[id]){if(MN>=mnMax())return log('Ya tienes el maná al máximo.');S.inv.splice(i,1);MN=Math.min(mnMax(),MN+MANAP[id]);snd('magic');log('Recuperas maná.');dirty=1;return}
 if(POT[id]){S.inv.splice(i,1);S.buf[POT[id]]=Date.now()+180000;snd('quest');log('Efecto activo 3 min: '+I[id][0]);dirty=1;return}if(id&&I[id][3]){const now=performance.now();if(now<EATCD)return;if(P.hp+hotLeft()>=maxHp()&&!(I[id][4]&&MN<mnMax()))return log('Ya estás en plena forma.');
  S.inv.splice(i,1);EATCD=now+1100;P.eat=now;snd('eat');const h=I[id][3],st=Math.max(1,Math.round(h/6));HOT.push({left:h,step:st,t:now+450});log('Comes '+I[id][0]+': recuperas '+h+' PV poco a poco.');
  if(I[id][4]){MN=Math.min(mnMax(),MN+I[id][4]);S.buf.mreg=Date.now()+90000;log('Tu maná se regenera más rápido durante 90 s.')}dirty=1}}
const sell=id=>{const n=count(id);S.inv=S.inv.filter(x=>x!==id);earn(Math.round(n*I[id][2]*(1+.1*S.merc)));snd('coin');log('Vendiste '+n+'x '+I[id][0]);dirty=1;save()};
const sellAll=()=>{let g=0;S.inv.forEach(x=>g+=I[x][2]);g=Math.round(g*(1+.1*S.merc));S.inv=[];earn(g);snd('coin');log('Vendiste todo por '+g+' oro.');dirty=1;save()};
const buy=(sk,t)=>{if(S.coins<TC[t]||L(sk)<TL[t])return;S.coins-=TC[t];S.tool[sk]=t;log('Compraste: '+TOOLS[sk][0]+' '+TN[t]);dirty=1;save()};
const buyPan=()=>{if(S.coins>=10&&room('pan')){S.coins-=10;S.inv.push('pan');dirty=1}};
const depAll=()=>{S.inv.forEach(x=>S.bank[x]=(S.bank[x]||0)+1);S.inv=[];dirty=1;save()};
const wd=(k,n)=>{while(n-->0&&S.bank[k]>0&&room(k)){S.inv.push(k);S.bank[k]--}dirty=1;save()};
const far=m=>'<div class="hint">'+m+'</div>';
function skLive(k){const d=document.querySelector('#pn [data-sk="'+k+'"]');if(!d||L(k)!==+d.querySelector('.gold').textContent.split('/')[0])return;const l=L(k),x=S.xp[k],pc=l>=99?100:(x-XT[l])/(XT[l+1]-XT[l])*100,t=fmt(x)+' XP',h=d.querySelector('.hint');if(h.textContent!==t)h.textContent=t;d.querySelector('i').style.width=pc+'%'}
function panelHTML(TB,win){let h='';
 if(TB==='ch'){const cell=(k,l,ph,pos)=>`<div class="dc" style="grid-area:${pos}"><button class="slot" ${S.eq[k]?`data-i="${S.eq[k]}" onclick="unq('${k}')"`:`data-x="${l}: vacío"`} style="${S.eq[k]?'':'opacity:.5;'}${rr(S.eq[k])?'border:2px solid '+RAR[rr(S.eq[k])][1]:''}">${S.eq[k]?ic(S.eq[k]):ph}</button><div class="hint">${l}</div></div>`,
  tcell=k=>`<div class="dc"><div class="slot" data-x="${TOOLS[k][0]} ${tn(k,S.tool[k])}. Golpea cada ${(hitPeriod(k)/1000).toFixed(1)} s con ${toolDmg(k).toFixed(1)} de daño; los recursos tienen vida (más tier = más vida), así que una herramienta mejor los rompe en menos golpes. Se mejora fabricando.">${ic('tl:'+k+':'+S.tool[k])||TOOLS[k][1]}</div><div class="hint">${TOOLS[k][0]}</div></div>`;
  h='<div class="doll">'+cell('c','Capa','🧣','c')+cell('h','Casco','🪖','h')+cell('n','Amuleto','📿','n')+cell('w','Arma','⚔️','w')+cell('a','Armadura','🛡️','a')+cell('s','Escudo','🛡️','s')+cell('l','Pantalones','👖','l')+cell('g','Guantes','🧤','g')+cell('f','Botas','👢','f')+cell('r','Anillo','💍','r')+cell('m','Munición','🏹','m')+cell('r2','Anillo 2','💍','r2')+'<canvas id="doll" width="300" height="420"></canvas></div><div class="tools">'+tcell('wc')+tcell('mi')+tcell('fi')+'</div><div class="stats"><span>⚔️ Golpe máx. <b>'+maxHit()+'</b></span><span>🛡️ Defensa <b>+'+ab()+'</b></span><span>⏱ Ataque <b>'+(atkMs()/1000).toFixed(1)+' s</b></span></div><div class="hint">Clic en un objeto equipado para guardarlo en la mochila. Las armas y armaduras se equipan desde la Mochila (I).</div>'}
 else if(TB==='inv'){const sl=invSlots();h='<h2>Mochila '+sl.length+'/'+cap()+'</h2><div class="inv">'+Array.from({length:Math.max(cap(),sl.length)},(_,i)=>{const z=sl[i];if(!z)return '<div class="slot"></div>';const d=z.id;return `<button class="slot" data-i="${d}"${rr(d)?' style="border:2px solid '+RAR[rr(d)][1]+'"':''} onclick="use(${z.i})">${ic(d)}${z.n>1?'<span class="cnt">'+z.n+'</span>':''}</button>`}).join('')+'</div><div class="hint">Se apilan de 5 en 5 (el equipo ocupa un hueco por pieza). Clic para equipar, comer o usar.</div>'}
 else if(TB==='sk'){h=SKL.map(k=>{const l=L(k),x=S.xp[k],pc=l>=99?100:(x-XT[l])/(XT[l+1]-XT[l])*100;return `<div data-sk="${k}" style="margin-bottom:8px">${SK[k][1]} ${SK[k][0]} <span class="gold">${l}/99</span><span class="hint" style="float:right;margin:0">${fmt(x)} XP</span><div class="bar"><i style="width:${pc}%"></i></div></div>`}).join('')}
 else if(TB==='qm')h=qmHTML();else if(TB==='q'){h='<h2>🏆 Logros</h2>'+Q.map((q,i)=>{const v=Math.min(q[3],S.st[q[2]]||0),d=S.done[i];return `<div style="margin-bottom:7px;opacity:${d?.5:1}">${d?'✔ ':''}<b class="gold">${q[0]}</b> · ${q[4]} oro<div class="hint" style="margin:0">${q[1]} (${fmt(v)}/${fmt(q[3])})</div><div class="bar"><i style="width:${v/q[3]*100}%"></i></div></div>`}).join('')}
 else if(TB==='mg'){const lv=L('mg'),all=SPL.map((s,i)=>[s,i]),open=all.filter(x=>lv>=x[0].lv),nx=all.find(x=>lv<x[0].lv),RI={air:'Aire',earth:'Tierra',life:'Vida',water:'Agua',fire:'Fuego',arc:'Arcana'};
  h=`<h2>✨ Magia · nivel ${lv}</h2><div class="hint" style="margin:0 0 4px">Maná ${Math.floor(MN)}/${mnMax()} · +${(mreg()*60).toFixed(1)}/min</div><div style="margin-bottom:6px">${Object.keys(RI).map(k=>`<span class="chip ${(S.runes[k]||0)>0?'ok':'no'}" data-x="Runa de ${RI[k].toLowerCase()}: cae de los monstruos.">${ic('rn_'+k)} ${RI[k]} ${S.runes[k]||0}</span>`).join('')}</div>`+open.map(([s,i])=>{const can=MN>=s.mp&&hasRunes(s.r);return `<div class="row${can?'':' cant'}"><div style="min-width:0"><div>${s.e} <span class="nm">${s.n}</span></div><div class="hint" style="margin:0">${s.atk?'Proyectil: hasta '+spMax(s)+' de daño':s.d} · ${s.mp} maná · ${s.xp} XP</div><div>${Object.entries(s.r).map(([k,v])=>`<span class="chip ${(S.runes[k]||0)>=v?'ok':'no'}">${ic('rn_'+k)} ${RI[k]} ${S.runes[k]||0}/${v}</span>`).join('')}</div></div><button class="bt" ${can?'':'disabled'} onclick="cast(${i})">Lanzar</button></div>`}).join('')+(nx?far('Próximo hechizo: '+nx[0].n+' (nv. '+nx[0].lv+')'):'')+far('Con un bastón equipado, tus ataques lanzan solos tu mejor hechizo de ataque que puedas pagar.')}
 else if(TB==='col'){const ids=Object.keys(I).filter(k=>k!=='quemado'&&!k.includes('~')),n=ids.filter(k=>S.disc[k]).length;h=`<h2>📖 Colección ${n}/${ids.length}</h2><div class="inv">`+ids.map(k=>S.disc[k]?`<div class="slot" data-i="${k}"${rr(k)?' style="border:2px solid '+RAR[rr(k)][1]+'"':''}>${ic(k)}</div>`:'<div class="slot" style="opacity:.35" data-x="Aún no descubierto">❔</div>').join('')+'</div>'}
 else if(TB==='bank'){h=!nearS('bank')?far('Acércate al banco.'):`<button class="bt" onclick="depAll()">Depositar todo</button>`+Object.entries(S.bank).filter(e=>e[1]>0&&!(win&&IWQ&&!nrm(I[e[0]][0]).includes(IWQ))).map(([k,v])=>`<div class="row"><span data-i="${k}">${ic(k)} ${I[k][0]} x${v}</span><span><button class="bt" onclick="wd('${k}',1)">1</button> <button class="bt" onclick="wd('${k}',99)">Todo</button></span></div>`).join('')}
 else if(TB==='shop'){if(!nearS('shop'))h=far('Acércate a Ru.');else{const ids=[...new Set(S.inv)].filter(id=>!(win&&IWQ&&!nrm(I[id][0]).includes(IWQ))),mm=1+.1*S.merc;let tot=0;S.inv.forEach(x=>tot+=I[x][2]);const H2='<h2 style="margin-top:12px">';
  h='<div class="hint" style="margin:0 0 6px">Bonus de venta: +'+Math.round((mm-1)*100)+'%</div><h2>Vender</h2>'+(ids.length?ids.map(id=>`<div class="row"><span data-i="${id}">${ic(id)} ${I[id][0]} x${count(id)}</span><button class="bt" onclick="sell('${id}')">${Math.round(count(id)*I[id][2]*mm)}</button></div>`).join('')+`<div class="row"><b>Todo</b><button class="bt" onclick="sellAll()">${Math.round(tot*mm)}</button></div>`:far('Inventario vacío.'))
  +H2+'Mejoras permanentes</h2>'+UP.map((u,i)=>{if(win&&IWQ&&!nrm(u[1]).includes(IWQ))return'';const lv=S[u[0]]||0,c=u[3][lv],mx=u[3].length,no=c==null||S.coins<c;return `<div class="row${no?' cant':''}"><div style="min-width:0"><div><span class="nm">${u[1]}</span> <span class="hint">nv. ${lv}/${mx}</span></div><div class="hint" style="margin:0">${u[2]}</div></div><button class="bt" ${no?'disabled':''} onclick="buyU('${u[0]}',${i})">${c==null?'Máx':fmt(c)}</button></div>`}).join('')
  +H2+'Runas de viaje rápido</h2>'+BI.slice(0,S.st.bio).map((b,k)=>{const id='rv_'+k,own=count(id)>0||S.bank[id]>0,c=RVC[k],no=own||S.coins<c;return `<div class="row${no?' cant':''}"><div style="min-width:0"><div><span class="nm" data-i="${id}">${ic(id)} ${I[id][0]}</span></div><div class="hint" style="margin:0">Reutilizable · 45 s</div></div><button class="bt" ${no?'disabled':''} onclick="buyRV(${k})">${own?'Tienes':fmt(c)}</button></div>`}).join('')}}
 else h=stHTML(win);
 return h}
// ---- Ventana de instalaciones (rehecha 13 oct 2026, punto 6): filtro de categoría + «✔ Puedo» + búsqueda; filas compactas (icono, nombre, nivel, estado); al pulsar una fila se abre la ficha con la RECETA completa
// (cada ingrediente con lo que tienes/necesitas y dónde conseguirlo, resultado y estadísticas, XP, tiempo, cuántas puedes hacer, cantidad y botón). Los desbloqueos futuros se pueden consultar (grupo «Próximos») aunque no puedas fabricarlos.
let IWSEL=null,IWCAT='',IWLK=0;
let IWSCR=0;const iwSel=(sk,i)=>{IWSEL=IWSEL&&IWSEL.sk===sk&&IWSEL.i===i?null:{sk,i};IWSCR=1;dirty=1;panel()},iwCat=c=>{IWCAT=c;dirty=1;panel()},iwLk=()=>{IWLK=IWLK?0:1;dirty=1;panel()};
const catOf=(sk,a)=>{const o=String(a[2]||'');if(/^(sw_|bw_|st_)/.test(o))return'⚔️ Armas';if(/^(ar_|sh_|lg_|gl_)/.test(o))return'🛡️ Armadura';if(/^(ax_|pk_|rd_|tl:)/.test(o))return'🛠️ Herramientas';if(/^b_/.test(o))return'🟧 Barras';if(/^rn_/.test(o))return'🔮 Runas';
 if(sk==='co')return'🍖 Platos';if(sk==='es')return'🪵 Esculpido';if(sk==='ins')return'📜 Pergaminos';return'📦 Otros'};
const whereOf=k=>desc(k).split('\n').filter(l=>/^(Se obtiene|Se fabrica|Lo suelta|Drop raro)/.test(l)).slice(0,2).join(' · ');
function stHTML(win){const s=S.stn;if(!s||!near(s))return far('Acércate a una estación.');
 const q=win?IWQ:'',items=[];
 s.sks.forEach(sk=>{const fl=a=>!(sk==='sm'&&(s.id==='furnace')!==(typeof a[2]==='string'&&a[2].startsWith('b_'))),lv=L(sk);ACT[sk].forEach((a,i)=>{if(!fl(a))return;const o=a[2]&&a[2].startsWith('rn_')?a[2].split(':')[0]:a[2],on=!!(A&&A.ty==='c'&&A.i===i&&A.sk===sk),own=ownT(a),can=!own&&hasIn(a[1]);
  items.push({sk,i,a,o,lv:rq(a),open:lv>=rq(a),on,own,can,ok:can||on,cat:catOf(sk,a)})})});
 const nameOk=x=>!q||nrm(x.a[0]).includes(q),base=items.filter(nameOk),vis=base.filter(x=>x.open&&(!win||!IWC||x.ok)),locked=base.filter(x=>!x.open);
 const cats=[];vis.concat(IWC?[]:locked).forEach(x=>{if(!cats.includes(x.cat))cats.push(x.cat)});if(IWCAT&&!cats.includes(IWCAT))IWCAT='';
 const inCat=x=>!IWCAT||x.cat===IWCAT,V=vis.filter(inCat).sort((p,q2)=>(q2.ok-p.ok)||p.lv-q2.lv),LK=locked.filter(inCat).sort((p,q2)=>p.lv-q2.lv);
 const row=x=>{const sel=IWSEL&&IWSEL.sk===x.sk&&IWSEL.i===x.i,st=x.on?'on':x.own?'own':!x.open?'lock':x.can?'can':'miss',dot={on:'⏵',own:'✔',lock:'🔒',can:'●',miss:'○'}[st],
   ico=x.o?ic(x.o):ic(Object.keys(x.a[1])[0]),tag=x.own?'equipada':x.o&&!String(x.o).startsWith('tl:')&&!String(x.o).startsWith('rn_')&&count(x.o)?'×'+count(x.o):'';
  let d='';if(sel){const mx=Math.min(...Object.entries(x.a[1]).map(([k,v])=>Math.floor(have(k)/v))),isT=String(x.o||'').startsWith('tl:'),miss=Object.entries(x.a[1]).filter(([k,v])=>have(k)<v),tip=x.o&&!isT&&!String(x.o).startsWith('rn_')&&I[x.o]?desc(x.o).split('\n').slice(1).filter(l=>!/^(Se obtiene|Se fabrica|Lo suelta|Drop raro|Sirve para)/.test(l)).join('<br>'):isT?'Se equipa sola. Cada tier acorta el tiempo entre golpes y reduce los golpes necesarios por recurso.':'';
   const bt=x.own?'<button class="bt" disabled>Equipada</button>':!x.open?`<button class="bt" disabled>Nivel ${x.lv}</button>`:`<button class="bt ${x.on?'stop':''}" ${x.ok?'':'disabled'} onclick="${x.on?'stopA()':`startC('${x.sk}',${x.i})`}">${x.on?'Parar':x.sk==='co'?'Cocinar':'Hacer'}</button>`;
   d=`<div class="idet"><div class="hint" style="margin:0 0 3px">Receta</div><div>${chips(x.a[1])}</div>`+(miss.length?`<div class="hint" style="margin:3px 0 0">Te falta: ${miss.map(([k,v])=>`${I[k][0]} <b>${v-have(k)}</b>`+(whereOf(k)?' <span style="opacity:.75">('+whereOf(k).replace(/Se obtiene con /g,'').replace(/Lo suelta: /g,'suelta ').replace(/Se fabrica: /g,'fabricar ')+')</span>':'')).join('; ')}</div>`:'')
    +(tip?`<div class="hint" style="margin:5px 0 0">${tip}</div>`:'')+`<div class="hint" style="margin:5px 0 0">${xv(x.a)} XP · ${(dur(x.sk,x.a)/1000).toFixed(1)} s${x.o&&I[x.o]&&I[x.o][3]?' · cura '+I[x.o][3]+' PV':''}${x.o&&I[x.o]&&I[x.o][4]?' · +'+I[x.o][4]+' maná':''}${x.o&&String(x.o).startsWith('rn_')?' · da '+x.a[2].split(':')[1]+' runas':''}${x.open&&!x.own?' · puedes hacer <b>'+mx+'</b>':''}</div>`
    +(x.sk==='co'?'<div class="hint" style="margin:3px 0 0">🎲 Al cocinar puede salir un minijuego bonus.</div>':'')+`<div style="display:flex;gap:6px;align-items:center;justify-content:space-between;margin-top:6px;flex-wrap:wrap">${x.open&&!x.own&&!isT?qtyMini():'<span></span>'}${bt}</div></div>`}
  return `<div class="ir ${st}${sel?' sel':''}" onclick="iwSel('${x.sk}',${x.i})"><span class="id">${dot}</span><span class="ii">${ico}</span><span class="nm">${x.a[0]}</span><span class="hint" style="margin:0 0 0 auto;white-space:nowrap">${tag?tag+' · ':''}nv ${x.lv}</span></div>${d}`};
 const chip=(c,n)=>`<button class="bt cat${IWCAT===c?' on':''}" onclick="iwCat('${c}')">${c||'Todo'}${n!=null?' <span class="hint" style="margin:0">'+n+'</span>':''}</button>`;
 let h='';
 if(cats.length>1)h+=`<div class="cats">${chip('',vis.length+(IWC?0:locked.length))}${cats.map(c=>chip(c,vis.filter(x=>x.cat===c).length+(IWC?0:locked.filter(x=>x.cat===c).length))).join('')}</div>`;
 h+=`<div class="hint" style="margin:0 0 3px">${cats.length>1?'':(STD[s.id]||'')+' · '}${s.sks.map(sk=>SK[sk][1]+' '+SK[sk][0]+' nv '+L(sk)).join(' · ')}</div>`;
 h+=V.length?V.map(row).join(''):far(q?'Nada con ese nombre.':IWC?'Ahora mismo no puedes hacer nada aquí.':'Nada en esta categoría.');
 if(IWC){const hid=base.filter(x=>x.open&&!x.ok&&inCat(x)).length;if(hid)h+=far(`${hid} receta${hid>1?'s':''} más con materiales que te faltan: desactiva «✔ Puedo» para verlas.`)}
 if(LK.length&&!IWC||(q&&LK.length)){h+=`<div class="ir lkh" onclick="iwLk()">🔒 Próximos desbloqueos (${LK.length}) <span class="hint" style="margin:0 0 0 auto">${IWLK||q?'▾':'▸'}</span></div>`+(IWLK||q?LK.map(row).join(''):'')}
 return h}
const qtyMini=()=>'<span style="display:flex;gap:3px;align-items:center"><span class="hint" style="margin:0">Cant.</span>'+[[1,'1'],[5,'5'],[10,'10'],[25,'25'],[0,'∞']].map(([n,l])=>`<button class="bt qm${QTY===n?' on':''}" onclick="setQty(${n})">${l}</button>`).join('')+(A&&A.ty==='c'&&A.left<1e8?`<span class="hint" style="margin:0">(quedan ${A.left})</span>`:'')+'</span>';
function paintDoll(){const c=$('#doll');if(!c)return;try{PROPS.portrait(c,{gear:gearOpts(),app:S.app,ar:S.eq.a?ARC(S.eq.a):null,helm:S.eq.h?ARC(S.eq.h):null,boot:S.eq.f?ARC(S.eq.f):null})}catch(e){}}
function panel(){const pn=$('#pn'),sb=$('#swb'),s1=pn.scrollTop,s2=sb.scrollTop;$('#pw').classList.toggle('wide',TB==='inv'||TB==='ch');pn.innerHTML=panelHTML(TB);if(TB==='ch')paintDoll();if(IW){sb.innerHTML=panelHTML(IW.tab,1);sb.scrollTop=s2;if(IWSCR){IWSCR=0;const d=sb.querySelector('.idet');if(d){const r=d.getBoundingClientRect(),b=sb.getBoundingClientRect();if(r.bottom>b.bottom)sb.scrollTop+=r.bottom-b.bottom+12;const s=sb.querySelector('.ir.sel').getBoundingClientRect();if(s.top<b.top)sb.scrollTop-=b.top-s.top+2}}}pn.scrollTop=s1;$('#goals').innerHTML=goalsHTML();$('#hd').innerHTML=`${S.app&&S.app.name?'<b>'+S.app.name+'</b> · ':''}Oro <b>${fmt(S.coins)}</b> · Nivel total <b>${SKL.reduce((s,k)=>s+L(k),0)}</b> <button class="bt" onclick="mut()">${S.mute?'🔇':'🔊'}</button>`}

// ---------- inicio ----------
SKL.forEach(k=>S.st['lvl:'+k]=L(k));S.st.tot=SKL.reduce((s,k)=>s+L(k),0);
S.rest=0; // el «descanso» (+50 % XP tras estar fuera) se quitó en oct 2026: era demasiado fuerte
if(S.cur&&ACT[S.cur.sk]&&ACT[S.cur.sk][S.cur.i]&&Date.now()-S.t>15000)offline(Date.now()-S.t,S.cur.sk,S.cur.i);S.cur=null;
setInterval(save,5000);$('#mv').value=S.mv;$('#sv').value=S.sv;$('#mv').oninput=e=>{S.mv=+e.target.value;save()};$('#sv').oninput=e=>{S.sv=+e.target.value;save()};autoBtn();$('#log').innerHTML='<div>'+logs[0]+'</div>';{let pv=null,gv=null;try{pv=localStorage.getItem('ns_pn');gv=localStorage.getItem('ns_goal')}catch(e){}const open=pv===null?innerWidth>=900&&innerHeight>=500:pv==='1';tab('inv');if(!open){setPanel(false);document.querySelectorAll('#tabs button').forEach(b=>b.classList.remove('on'))}if(gv==='1'||(gv===null&&innerHeight<500))$('#goalp').classList.add('min')}
let last=performance.now();
// Panel de rendimiento (tecla F3 o ?perf): fps, mediana/p95/máx de frame, ms de JS del dibujo, chunks síncronos, calidad. Sirve para decir QUÉ tirones hay.
let PF=null,PFT=[],PFJ=0,PFU=0;const pfEl=()=>PF||(PF=Object.assign(document.createElement('pre'),{id:'perf',hidden:true}),document.body.appendChild(PF),PF);
function perfTog(){const e=pfEl();e.hidden=!e.hidden}
function perfUpd(now){if(!PF||PF.hidden||now-PFU<500)return;PFU=now;const a=PFT.slice().sort((x,y)=>x-y),n=a.length;if(!n)return;const st=TER.stats?TER.stats():{};PF.textContent='fps '+(1000/(a.reduce((x,y)=>x+y,0)/n)).toFixed(0)+'  frame med '+a[n>>1].toFixed(1)+' p95 '+a[Math.floor(n*.95)].toFixed(1)+' máx '+a[n-1].toFixed(0)+' ms\n>33ms: '+a.filter(x=>x>33).length+'/'+n+'  JS dibujo '+(PFJ/Math.max(1,n)).toFixed(1)+' ms\nchunks sync '+st.sync+' ('+(st.syncMs||0).toFixed(0)+' ms) · caché '+((st.bytes||0)/1e6).toFixed(0)+' MB ('+st.pintados+' chunks)\ncalidad '+(QA?'auto ':'')+QNAM[QL]+' · lienzo '+cv.width+'×'+cv.height+' · agua ×'+(WGL.res||1)+'\nsprites '+PROPS.cacheN+'/'+PROPS.mcaN+'/'+PROPS.plcN+' · zoom '+ZS_()+'\n(F3 oculta)';PFT=[];PFJ=0}
const ZS_=()=>ISO.V.zoom;
function loop(now){const fdt=now-last;DT=Math.min(.05,fdt/1000);last=now;if(fdt<400)PFT.push(fdt);upd(DT,now);bgm(now,DT);const j0=performance.now();draw(now);PFJ+=performance.now()-j0;perfUpd(now);iwFrame();qmon(now,fdt);if(fdt<26)PROPS.warm([N,ST,PO,PROPS.list],fdt<20?3:1.2);if(dirty&&!pd&&now-lr>250){dirty=0;lr=now;panel()}requestAnimationFrame(loop)}
// ---------- pantalla de carga y precalentado (oct 2026) ----------
// Antes el juego arrancaba «en frío»: el shader del agua, los chunks del terreno, el horneado de sprites (props, recursos, jugador, monstruos) y los lienzos de la luz se creaban
// durante las primeras vueltas del bucle → tirones al empezar a caminar. Ahora, mientras se muestra #boot (div del index.html con barra), se precalienta TODO en tandas cortas
// (≤14 ms entre fotogramas, así la barra se anima) y solo entonces arranca loop(). Pasos y peso de la barra: tipografías 6 % · terreno (vista + anillo de precarga) 34 % · agua y primer fotograma 8 % ·
// sprites del entorno 30 % · jugador 8 % · monstruos 6 % · luz nocturna 4 % · fotograma final 4 %.
// Se omite con `?noload` y, por defecto, en navegadores automatizados (navigator.webdriver: las herramientas de tools/ miden desde el primer segundo); `?load` la fuerza también ahí.
// Seguridad: pase lo que pase (error, pestaña oculta, equipo muy lento) el juego arranca como mucho a los 20 s; nunca se queda en la pantalla de carga.
function lightWarm(){const f=cv.width/W,LR=.9*ISO.scale()/f;try{LIGHT.update({t:0,d:1,W,H,dev:f,near:Math.max(640,.62*Math.hypot(W,H)/LR+120),proj:(x,y)=>{const q=ISO.toCanvas(x,y,1);return[q.x/f,q.y/f]},LR,P,ST,N,props:PROPS.list,now:performance.now(),active:null});LIGHT.render()}finally{LIGHT.update({t:0,d:0,W,H,proj:()=>[0,0],LR:1,P,ST,N,props:[],now:0,active:null})}}
async function bootRun(){
 const el=$('#boot'),fill=$('#bt-fill'),msg=$('#bt-msg'),T0=performance.now(),late=()=>performance.now()-T0>20000;
 const pct=(p,m)=>{fill.style.width=Math.round(Math.max(0,Math.min(1,p))*100)+'%';if(m)msg.textContent=m};
 const frame=()=>new Promise(r=>{let d=0;const f=()=>{if(!d){d=1;r()}};requestAnimationFrame(f);setTimeout(f,80)});   // un fotograma real (deja pintar la barra); en pestaña oculta cae al temporizador
 try{
  pct(.01,'Cargando tipografías…');
  try{await Promise.race([Promise.all(['16px VT323','700 16px "Pixelify Sans"','500 16px Fredoka'].map(q=>document.fonts.load(q))),new Promise(r=>setTimeout(r,2500))])}catch(e){}
  pct(.06,'Pintando el terreno…');fitCv();ISO.snap(P.x,P.y,TER.standZ(P.x,P.y));await frame();
  for(let i=0;i<600&&!late();i++){const[d,n]=TER.preload(14);pct(.06+.34*d/Math.max(1,n));if(d>=n)break;await frame()}
  pct(.4,'Preparando el agua…');await frame();if(typeof WGL!=='undefined')WGL.warm();draw(performance.now());pct(.48);await frame();
  pct(.48,'Colocando el pueblo…');{const st={};const L=()=>[N,ST,PO,PROPS.list];for(let i=0;i<400&&!late();i++){const f=PROPS.warmPass(L(),12,1.1,st);pct(.48+.3*f);if(f>=1)break;await frame()}}
  if(S.app&&S.app.name){pct(.78,'Vistiendo al personaje…');const st={},eq={dir:P.dir,ar:S.eq.a?ARC(S.eq.a):null,helm:S.eq.h?ARC(S.eq.h):null,boot:S.eq.f?ARC(S.eq.f):null,app:S.app};
   for(let i=0;i<300&&!late();i++){const f=PROPS.warmHero(st,12,eq);pct(.78+.08*f);if(f>=1)break;await frame()}}
  {pct(.86,'Despertando a las criaturas…');const m=.9*Math.max(ISO.V.cw,ISO.V.ch),ids=[...new Set(M.filter(e=>{const q=ISO.toCanvas(e.x,e.y,1);return q.x>-m&&q.x<ISO.V.cw+m&&q.y>-m&&q.y<ISO.V.ch+m}).map(e=>e.d.id))],st={};
   for(let i=0;i<300&&!late();i++){const f=PROPS.warmMob(st,12,ids);pct(.86+.06*f);if(f>=1)break;await frame()}}
  pct(.92,'Encendiendo las luces…');await frame();lightWarm();await frame();
  pct(.97,'¡Listo!');draw(performance.now());await frame();
 }catch(e){if(window.console)console.warn('[BOOT]',e)}
 pct(1);last=performance.now();requestAnimationFrame(loop);
 el.classList.add('out');setTimeout(()=>el.classList.add('off'),520)}
{const el=$('#boot'),skip=/[?&]noload\b/.test(location.search)||(navigator.webdriver&&!/[?&]load\b/.test(location.search));
 if(skip||!el){if(el)el.classList.add('off');requestAnimationFrame(loop)}else bootRun()}

