
const $=s=>document.querySelector(s),R=(a,b)=>a+Math.floor(Math.random()*(b-a+1)),fmt=n=>Math.floor(n).toLocaleString('es');
const SK={wc:['Tala','🪓'],mi:['Minería','⛏️'],fi:['Pesca','🎣'],co:['Cocina','🔥'],sm:['Herrería','🔨'],cr:['Artesanía','🧵'],es:['Escultor','🪚'],ins:['Inscripción','📜'],mg:['Magia','✨'],ag:['Agilidad','👟'],cb:['Combate','⚔️']},SKL=Object.keys(SK);
// [nombre, emoji, valor, curación]
const I={logs:['Troncos','🪵',3],roble:['Troncos de roble','🪵',8],sauce:['Troncos de sauce','🌿',20],arce:['Troncos de arce','🍁',45],
cobre:['Mena de cobre','🟤',4],estano:['Mena de estaño','⚪',4],hierro:['Mena de hierro','🔩',15],carbon:['Carbón','⚫',30],mitril:['Mena de mitril','🔷',90],
camaron:['Camarones crudos','🦐',3],trucha:['Trucha cruda','🐟',15],salmon:['Salmón crudo','🍣',30],atun:['Atún crudo','🐠',55],
c_camaron:['Camarones','🍤',9,4],c_trucha:['Trucha','🍖',32,7],c_salmon:['Salmón','🥩',70,10],c_atun:['Atún','🍱',130,14],pan:['Pan','🍞',2,3],quemado:['Pescado quemado','💀',0],
b_bronce:['Barra de bronce','🟧',20],b_hierro:['Barra de hierro','⬜',45],b_acero:['Barra de acero','⬛',100],b_mitril:['Barra de mitril','🟦',280],
sw_bronce:['Espada de bronce','🗡️',90],sw_hierro:['Espada de hierro','🗡️',200],sw_acero:['Espada de acero','⚔️',450],sw_mitril:['Espada de mitril','⚔️',1000],
cuero:['Cuero','🟫',8],hueso:['Hueso','🦴',5],
nido:['Nido de pájaro','🪺',500],gema:['Gema sin cortar','💎',400],perla:['Perla gigante','🫧',600],
corona:['Corona de goblin','👑',900],colmillo:['Colmillo de lobo','🦷',700],calavera:['Calavera antigua','☠️',1500],garrote:['Garrote de ogro','🏏',3000]};
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
const RVC=[500,1200,2500,5000,9000];
const SW={sw_bronce:2,sw_hierro:4,sw_acero:6,sw_mitril:9,sw_adam:13},AR={ar_cuero:1,ar_bronce:2,ar_hierro:4,ar_acero:6,ar_mitril:9,ar_adam:13};
const BOW={bw_pino:1,bw_roble:3,bw_sauce:5,bw_arce:7,bw_tejo:10},STF={st_pino:1,st_roble:2,st_sauce:3,st_arce:4,st_tejo:6},WB=Object.assign({},SW,BOW,STF);
Object.assign(I,{bw_pino:['Arco de pino','🏹',150],bw_roble:['Arco de roble','🏹',320],bw_sauce:['Arco de sauce','🏹',700],bw_arce:['Arco de arce','🏹',1500],bw_tejo:['Arco de tejo','🏹',3600],
st_pino:['Bastón de pino','🪄',180],st_roble:['Bastón de roble','🪄',380],st_sauce:['Bastón de sauce','🪄',820],st_arce:['Bastón de arce','🪄',1800],st_tejo:['Bastón de tejo','🪄',4400]});
Object.assign(I,{rn_air:['Runa de aire','🌀',0],rn_earth:['Runa de tierra','🪨',0],rn_life:['Runa de vida','💚',0],rn_water:['Runa de agua','💧',0],rn_fire:['Runa de fuego','🔥',0],rn_arc:['Runa arcana','🔮',0]});
const SB={sw_bronce:45,sw_hierro:65,sw_acero:85,sw_mitril:100,sw_adam:120,bw_pino:35,bw_roble:52,bw_sauce:68,bw_arce:80,bw_tejo:96};
Object.assign(I,{dientorco:['Colmillo de orco','🦷',500],f_tortilla:['Tortilla de huevo','🥞',40,6,6],pot_mana:['Poción de maná menor','🔵',40],pot_mana2:['Poción de maná mayor','🟣',150]});
const MANAP={pot_mana:8,pot_mana2:25};
const RAR=[['Común','#ffffff'],['Poco común','#3fd04a'],['Raro','#4a90ff'],['Épico','#b04aff'],['Legendario','#ff8000']],LS={h:['Casco','🪖'],f:['Botas','👢'],r:['Anillo','💍'],n:['Amuleto','📿']},LK=['h','f','r','n'];
const LN={h:[['Gorro de cuero curtido','Capucha del Vigía','Corona de la Pradera Dorada'],['Casco de roble tallado','Yelmo del Guardabosques','Cornamenta del Rey Verde'],['Casco musgoso','Máscara del Cenagal','Cráneo del Señor del Pantano'],['Casco de escarcha','Yelmo del Ventisquero','Corona de Hielo Eterno'],['Casco de obsidiana','Yelmo del Magma','Corona del Abismo Ardiente']],
f:[['Botas de cuero gastado','Botas del Explorador','Botas del Viento de Prado'],['Botas de corteza','Botas del Cazador Silente','Pisadas del Gran Ciervo'],['Botas de pantano','Botas del Cenagal','Zancos del Rey Rana'],['Botas de nieve','Botas del Montañés','Botas de la Ventisca'],['Botas ígneas','Botas del Cráter','Pasos del Demonio']],
r:[['Anillo de cobre','Anillo del Granjero Astuto','Sello del Rancho Dorado'],['Anillo de hierro','Anillo del Lobo Gris','Sello de la Manada Alfa'],['Anillo de hueso','Anillo del Sepulturero','Sello del Rey Muerto'],['Anillo de escarcha','Anillo del Yeti','Sello del Coloso Helado'],['Anillo de ceniza','Anillo del Dragón Menor','Sello del Señor del Fuego']],
n:[['Amuleto de plumas','Talismán del Amanecer','Amuleto del Sol de Pradera'],['Amuleto de madera','Talismán del Espíritu Verde','Corazón del Bosque Antiguo'],['Amuleto de ranas','Talismán del Fuego Fatuo','Ojo del Pantano Ancestral'],['Amuleto de hielo','Talismán de la Aurora','Lágrima de la Montaña'],['Amuleto de brasas','Talismán del Volcán','Corazón de Magma']]};
const PS={stone:{b:1,d:v=>'Piel de piedra: reduces en '+Math.max(1,Math.round(v))+' el daño de cada golpe que recibes.'},savant:{b:6,d:v=>'Sabiduría de batalla: +'+Math.round(v)+'% de XP de combate y magia.'},
last:{b:25,d:v=>'Segundo aliento: al bajar del 30% de vida te curas un '+Math.round(v)+'% (1 vez cada 60 s).'},swift:{b:6,d:v=>'Pies ligeros: +'+Math.round(v)+'% de velocidad de movimiento.'},
harvest:{b:8,d:v=>'Cosecha doble: '+Math.round(v)+'% de duplicar lo que recolectas.'},thorns:{b:20,d:v=>'Espinas: '+Math.round(v)+'% de reflejar 2 de daño al enemigo que te golpea.'},
life:{b:8,d:v=>'Sed de sangre: '+Math.round(v)+'% de tus golpes te curan 1 PV.'},double:{b:5,d:v=>'Furia gemela: '+Math.round(v)+'% de golpear dos veces.'},
exec:{b:40,d:v=>'Ejecutor: +'+Math.round(v)+'% de daño contra enemigos con menos del 25% de vida.'},prosp:{b:15,d:v=>'Buscatesoros: +'+Math.round(v)+'% de oro y de probabilidad de botín.'},
echo:{b:10,d:v=>'Eco arcano: '+Math.round(v)+'% de que un hechizo no gaste maná ni runas.'},siph:{b:1,d:v=>'Robaalmas: al matar un enemigo recuperas '+Math.max(1,Math.round(v))+' de maná.'}};
Object.assign(PS,{bleed:{b:12,d:v=>'Hemorragia: '+Math.round(v)+'% de provocar sangrado (3 golpes de 1 de daño).'},crit:{b:10,d:v=>'Golpe devastador: '+Math.round(v)+'% de infligir un 75% más de daño.'},stun:{b:10,d:v=>'Aturdir: '+Math.round(v)+'% de retrasar 1,2 s el próximo ataque del enemigo.'},haste:{b:5,d:v=>'Premura: ataques un '+Math.round(v)+'% más rápidos.'},frenzy:{b:8,d:v=>'Frenesí: '+Math.round(v)+'% de activar velocidad x2 durante 5 s al golpear.'},precise:{b:14,d:v=>'Golpe certero: '+Math.round(v)+'% de que un golpe cuente doble.'},lucky:{b:25,d:v=>'Hallazgo afortunado: +'+Math.round(v)+'% de probabilidad de encontrar objetos raros al recolectar.'},gsage:{b:7,d:v=>'Aprendiz veloz: +'+Math.round(v)+'% de XP de recolección.'}});
const PM={h:['stone','savant','last','stone','last'],f:['swift','harvest','swift','harvest','thorns'],r:['life','haste','exec','haste','double'],n:['prosp','echo','siph','echo','siph']},LOOT={};
LK.forEach(sl=>{for(let k=0;k<5;k++)for(let q=1;q<=3;q++){const m=[0,1,1.6,2.6][q],id='lt_'+k+sl+q,st={};
 if(sl==='h')st.def=Math.max(1,Math.round((1+1.2*k)*m));else if(sl==='f')st.def=Math.max(1,Math.round((.8+k)*m));
 else if(sl==='r'){st.str=Math.round((6+8*k)*m);st.acc=Math.max(1,Math.round((1+k)*m))}else{st.mana=Math.max(1,Math.round((1+1.5*k)*m));st.mreg=+(.004*(1+k)*m).toFixed(4);st.hp=Math.max(1,Math.round((1+k)*m))}
 const pa=q>=2?[{id:PM[sl][k],v:PS[PM[sl][k]].b*(1+.25*k)*(q===3?1.8:1)}]:null;if(q===3)pa.push({id:'savant',v:5*(1+.25*k)});
 LOOT[id]={s:sl,r:q,k,st,pa};I[id]=[LN[sl][k][q-1],LS[sl][1],[0,60,300,2500][q]*(k+1)]}});
Object.assign(LOOT,{lg_ring:{s:'r',r:4,k:4,st:{str:40,acc:10},pa:[{id:'exec',v:70},{id:'life',v:12},{id:'double',v:8}]},lg_helm:{s:'h',r:4,k:4,st:{def:10,hp:15},pa:[{id:'last',v:50},{id:'stone',v:3},{id:'savant',v:12}]},
 lg_boots:{s:'f',r:4,k:4,st:{def:8,hp:10},pa:[{id:'swift',v:20},{id:'thorns',v:40}]},lg_amulet:{s:'n',r:4,k:4,st:{mana:30,mreg:.05,hp:20},pa:[{id:'echo',v:25},{id:'siph',v:3}]}});
Object.assign(I,{lg_ring:['Sello del Cazademonios','💍',20000],lg_helm:['Corona del Rey Caído','🪖',20000],lg_boots:['Botas del Caminante del Alba','👢',20000],lg_amulet:['Corazón del Titán','📿',20000]});
// [id, nombre, receta de barra, nv barra, nv equipo, fuerza espada, precisión espada, fuerza arco, precisión arco, defensa peto, XP barra, ms barra]
const TI=[['cobre','cobre',{cobre:1},1,1,33,1,26,1,1,13,2200],['estano','estaño',{estano:1},4,5,40,2,31,2,2,18,2300],['bronce','bronce',{cobre:1,estano:1},8,10,45,3,35,3,3,26,2400],['hierro','hierro',{hierro:1},13,16,58,4,46,4,4,45,2600],
['acero','acero',{hierro:1,carbon:1},22,26,72,6,58,6,6,70,3000],['plata','plata',{plata:1},32,36,86,7,69,7,8,95,3200],['mitril','mitril',{mitril:1,carbon:2},44,48,100,9,80,8,10,115,3400],['adam','adamantita',{adam:1,carbon:3},58,62,120,13,96,10,14,165,3800]],TNM=TI.map(t=>t[0]);
// [id, nombre, objeto de tronco, nivel]: el taller de Escultor se rige por la madera
const WO=[['pino','pino','logs',1],['abedul','abedul','abedul',5],['roble','roble','roble',10],['fresno','fresno','fresno',16],['sauce','sauce','sauce',26],['arce','arce','arce',36],['tejo','tejo','tejo',48],['ebano','ébano','ebano',62]],WON=WO.map(w=>w[0]),TOOLT={};
for(const o of [SW,BOW,STF,AR,SB,WB])for(const k in o)delete o[k];AR.ar_cuero=1;
{const SV=[40,60,90,200,450,700,1000,2400],AV=[70,100,140,320,720,1100,1600,4200],BV=[8,10,20,45,100,190,280,520],STV8=[1,2,3,4,5,6,7,8],TV=[30,45,70,150,330,520,760,1800];
 TI.forEach((t,i)=>{const id=t[0],nm=t[1],wn=WON[i],wnm=WO[i][1];SW['sw_'+id]=t[6];SB['sw_'+id]=t[5];BOW['bw_'+wn]=t[8];SB['bw_'+wn]=t[7];STF['st_'+wn]=STV8[i];AR['ar_'+id]=t[9];
  I['b_'+id]=['Barra de '+nm,'🟧',BV[i]];I['sw_'+id]=['Espada de '+nm,'🗡️',SV[i]];I['ar_'+id]=['Peto de '+nm,'🛡️',AV[i]];I['bw_'+wn]=['Arco de '+wnm,'🏹',Math.round(SV[i]*1.6)];I['st_'+wn]=['Bastón de '+wnm,'🪄',Math.round(SV[i]*1.8)];
  I['ax_'+id]=['Hacha de '+nm,'🪓',TV[i]];I['pk_'+id]=['Pico de '+nm,'⛏️',TV[i]];I['rd_'+wn]=['Caña de '+wnm,'🎣',Math.round(TV[i]*.8)];
  TOOLT['ax_'+id]={k:'wc',t:i+1};TOOLT['pk_'+id]={k:'mi',t:i+1};TOOLT['rd_'+wn]={k:'fi',t:i+1}});
 Object.assign(WB,SW,BOW,STF);I.plata=['Mena de plata','⚪',60];
 Object.assign(I,{logs:['Troncos de pino','🪵',3],abedul:['Troncos de abedul','🪵',5],fresno:['Troncos de fresno','🪵',13],ebano:['Troncos de ébano','🪵',160],sardina:['Sardinas crudas','🐟',5],arenque:['Arenques crudos','🐟',9],lucio:['Lucio crudo','🐟',40],c_sardina:['Sardinas','🐟',14,5],c_arenque:['Arenque','🐟',22,6],c_lucio:['Lucio','🐟',80,12]})}
// pergaminos de Inscripción: un hechizo de un solo uso sin maná ni runas
const SCI={};[['spark','Chispa'],['heal','Curación'],['stone','Piedra'],['haste','Prisa'],['skin','Piel de piedra'],['wave','Ola'],['recall','Regreso'],['wis','Sabiduría'],['fire','Llamarada'],['arcane','Explosión arcana']].forEach(([id,n],i)=>{SCI['sc_'+id]=i;I['sc_'+id]=['Pergamino de '+n,'📜',[15,40,50,60,80,110,160,220,320,500][i]]});
RVC.forEach((c,k)=>{I['rv_'+k]=['Runa de viaje a '+['la Pradera','el Bosque','el Pantano','las Cumbres','el Volcán'][k],'🌀',150]});
const WSP={},EQK=['h','f','r','r2','n','w'],rr=id=>LOOT[id]?LOOT[id].r:(id&&id.includes('~')?+id.split('~')[1]:0);
Object.keys(SW).forEach(k=>WSP[k]=4);Object.keys(BOW).forEach(k=>WSP[k]=4);Object.keys(STF).forEach(k=>WSP[k]=5);
{const SSB=[52,72,86,100,120],BSB=[41,58,69,80,96],SAC=[3,6,7,9,13],BAC=[2,4,6,8,10],STV=[1,3,4,5,6],PW={d:['bleed','double'],m:['crit','exec'],b:['stun','life'],c:['echo','siph']},
 LE=[['de cobre','de hierro','de hueso','de escarcha','de obsidiana'],['del Vigía','del Lobo Gris','del Sepulturero','del Yeti','del Dragón Menor'],['de la Pradera Dorada','del Rey Verde','del Señor del Pantano','de Hielo Eterno','del Abismo Ardiente']];
 [['d','Daga','m',3,.92,2],['m','Mandoble','m',6,.92,-2],['b','Ballesta','r',5,.92,1],['c','Cetro','g',4,0,0]].forEach(([a,nm,ty,tk,tg,ac])=>{for(let k=0;k<5;k++)for(let q=1;q<=3;q++){const id='lw_'+k+a+q,m=[0,1.03,1.08,1.15][q],st={};let pa=null;
  if(ty==='m'){SB[id]=Math.max(0,Math.round(tg*(64+SSB[k])*(tk/4)*m-64));SW[id]=Math.max(1,SAC[k]+ac);WB[id]=SW[id]}
  else if(ty==='r'){SB[id]=Math.max(0,Math.round(tg*(64+BSB[k])*(tk/4)*m-64));BOW[id]=Math.max(1,BAC[k]+ac);WB[id]=BOW[id]}
  else{STF[id]=Math.max(1,Math.round(STV[k]*.7+q*.5));WB[id]=STF[id];st.mana=Math.round((1+k)*q*1.5);st.mreg=+(.003*(1+k)*q).toFixed(4)}
  WSP[id]=tk;if(q>=2){const p1=PW[a][0],p2=PW[a][1];pa=[{id:p1,v:PS[p1].b*(1+.25*k)*(q===3?1.8:1)}];if(q===3)pa.push({id:p2,v:PS[p2].b*(1+.25*k)})}
  LOOT[id]={s:'w',r:q,k,st,pa};I[id]=[nm+' '+LE[q-1][k],{d:'🗡️',m:'⚔️',b:'🏹',c:'🪄'}[a],[0,80,400,3000][q]*(k+1)]}})}
{const FR=[0,.3,.55,.85],TL=pre=>/^(bw_|st_|rd_)$/.test(pre)?WON:TNM,
 bump=(tbl,pre,id,q,d)=>{const L2=TL(pre),i=L2.indexOf(id.slice(pre.length)),v=tbl[id],nx=id==='ar_cuero'?tbl.ar_cobre:(i>=0&&i+1<L2.length?tbl[pre+L2[i+1]]:v*1.15);return +(v+(nx-v)*FR[q]).toFixed(d)};
 [...Object.keys(SW),...Object.keys(BOW),...Object.keys(STF),...Object.keys(AR),...Object.keys(TOOLT)].filter(k=>!k.includes('~')&&!LOOT[k]).forEach(id=>{for(let q=1;q<=3;q++){const v=id+'~'+q;I[v]=[I[id][0],I[id][1],Math.round(I[id][2]*[1,1.4,2.2,4][q])];
  if(SW[id]){SW[v]=bump(SW,'sw_',id,q,1);SB[v]=bump(SB,'sw_',id,q,0);WSP[v]=4;WB[v]=SW[v]}else if(BOW[id]){BOW[v]=bump(BOW,'bw_',id,q,1);SB[v]=bump(SB,'bw_',id,q,0);WSP[v]=4;WB[v]=BOW[v]}
  else if(STF[id]){STF[v]=bump(STF,'st_',id,q,1);WSP[v]=5;WB[v]=STF[v]}else if(AR[id])AR[v]=bump(AR,'ar_',id,q,1);
  else if(TOOLT[id]){const T=TOOLT[id],P2={wc:['frenzy','gsage'],mi:['precise','lucky'],fi:['lucky','frenzy']}[T.k],pa=q>=2?[{id:P2[0],v:PS[P2[0]].b*(1+.1*T.t)*(q===3?1.5:1)}]:null;if(q===3)pa.push({id:P2[1],v:PS[P2[1]].b*(1+.1*T.t)*.8});TOOLT[v]={k:T.k,t:T.t,bq:FR[q],pa}}}})}
function qv(id,sk){if(LOOT[id]||!(SW[id]||BOW[id]||STF[id]||AR[id]||TOOLT[id]))return id;const l=L(sk),g=Math.min(.25,.04+l*.0035),b=l<20?0:Math.min(.07,.01+(l-20)*.0015),e=l<40?0:Math.min(.01,.0015+(l-40)*.00015),r=Math.random()/(1+.12*S.crf),q=r<e?3:r<e+b?2:r<e+b+g?1:0;return q?id+'~'+q:id}
function gs(k){let t=0;for(const sl of EQK){const it=LOOT[S.eq[sl]];if(it&&it.st[k])t+=it.st[k]}return t}
function pv(id){let t=0;for(const sl of EQK){const it=LOOT[S.eq[sl]];if(it&&it.pa)it.pa.forEach(p=>{if(p.id===id)t+=p.v})}return t}
function wtype(){const w=S.eq.w;return !w||SW[w]?'m':BOW[w]?'r':'g'}
function accFor(sk,b,m){return Math.max(.08,Math.min(.92,.62-.055*(m.lv-L(sk)*.8)+.01*b))}
function monAcc(m){return Math.max(.15,Math.min(.9,.45+.05*(m.lv-L('cb')*.8)-ab()*.02))}
function hitChance(m){return accFor(wtype()==='g'?'mg':'cb',wb()+gs('acc'),m)}
function spAcc(m){return Math.max(.25,Math.min(.97,.82-.04*(m.lv-L('mg')*.9)))}
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
ACT.wc=[['Pino','logs',1,25,3000],['Abedul','abedul',5,33,3200],['Roble','roble',10,45,3400],['Fresno','fresno',16,58,3600],['Sauce','sauce',26,75,3900],['Arce','arce',36,100,4200],['Tejo','tejo',48,140,4500],['Ébano','ebano',62,190,4800]];
ACT.fi=[['Camarones','camaron',1,10,3000],['Sardinas','sardina',5,18,3200],['Arenques','arenque',10,32,3400],['Truchas','trucha',15,50,3500],['Salmones','salmon',30,70,4000],['Lucios','lucio',38,80,4200],['Atunes','atun',45,90,4400],['Pez magma','pmagma',60,140,4800]];
ACT.mi=[['Cobre','cobre',1,17,3000],['Estaño','estano',1,17,3000],['Hierro','hierro',12,35,3500],['Carbón','carbon',22,50,4000],['Plata','plata',32,65,4200],['Mitril','mitril',44,80,4800],['Adamantita','adam',58,120,5200]];
{const HW=['logs','logs','logs','roble','roble','sauce','arce','tejo'],CL=[1,1,1,2,2,2,3,3],AL=[1,7,12,18,28,38,50,64],SLV=[1,8,10,15,20,25,30,40,45,60];ACT.sm=[];ACT.cr=[];ACT.es=[];ACT.ins=[];
 TI.forEach((t,i)=>{const id=t[0],nm=t[1],b='b_'+id,il=t[4],wd=WO[i][2],wn=WON[i],wc=3+Math.floor(i/3);
  ACT.sm.push(['Barra de '+nm,t[2],b,t[3],t[10],t[11]],['Espada de '+nm,{[b]:2},'sw_'+id,il,Math.round(20+il*4.5),3000+il*45],['Hacha de '+nm,{[b]:2,[HW[i]]:1},'ax_'+id,il,30+il*3,2800+il*40],['Pico de '+nm,{[b]:2,[HW[i]]:1},'pk_'+id,il,30+il*3,2800+il*40]);
  ACT.cr.push(['Peto de '+nm,{[b]:3,cuero:CL[i]},'ar_'+id,AL[i],Math.round(25+AL[i]*6),2800+AL[i]*35]);
  ACT.es.push(['Arco de '+WO[i][1],{[wd]:wc,cuero:1+Math.ceil((i+1)/3)},'bw_'+wn,il,Math.round(25+il*5),3200+il*45],['Bastón de '+WO[i][1],{[wd]:wc,hueso:2},'st_'+wn,il,Math.round(30+il*5.5),3400+il*45],['Caña de '+WO[i][1],{[wd]:wc,cuero:Math.ceil((i+1)/2)},'rd_'+wn,il,Math.round(25+il*3.5),2600+il*35])});
 ACT.cr.unshift(['Armadura de cuero',{cuero:4},'ar_cuero',1,30,2600]);ACT.cr.push(['Pulir gema',{gema:1},'gema_p',20,80,2400]);
 const SR=[{pluma:1,huevo:1},{pluma:1,grasa:1},{hueso:2,huevo:1},{pluma:2,huevo:1},{hueso:3,cuero:1},{ancas:2,pluma:1},{cuero:1,grasa:1,pluma:2},{cuero:2,huevo:2,pluma:2},{carne_yak:1,pluma:2},{hueso:4,cuero:2,pluma:3}];
 ['spark','heal','stone','haste','skin','wave','recall','wis','fire','arcane'].forEach((id,i)=>ACT.ins.push([I['sc_'+id][0],SR[i],'sc_'+id,SLV[i],15+SLV[i]*3,2400+SLV[i]*20]));
 ACT.co.push(['Sardinas',{sardina:1},'c_sardina',5,38,2100],['Arenques',{arenque:1},'c_arenque',10,52,2200],['Lucio',{lucio:1},'c_lucio',38,105,2500]);
 [ACT.sm,ACT.cr,ACT.es,ACT.co].forEach(a=>a.sort((x,y)=>rq(x)-rq(y)))}
const MD={goblin:{n:'Goblin',lv:4,hp:10,dmg:3,ag:1,as:2400,c:'#5ab04a',w:12,h:14,co:[2,10],dr:[['cuero',.4],['hueso',1]],rare:['corona',64]},
lobo:{n:'Lobo',lv:12,hp:24,dmg:5,ag:1,as:1800,c:'#8a8a9a',w:18,h:12,co:[8,30],dr:[['cuero',.6],['hueso',1]],rare:['colmillo',80]},
esqueleto:{n:'Esqueleto',lv:28,hp:42,dmg:8,ag:1,as:2400,c:'#e8e8d8',w:12,h:20,co:[30,90],dr:[['hueso',1]],rare:['calavera',96]},
ogro:{n:'Ogro',lv:44,hp:78,dmg:13,ag:1,as:3000,c:'#a0703a',w:22,h:28,co:[100,300],dr:[['cuero',.8],['hueso',1]],rare:['garrote',112]},
demonio:{n:'Demonio',lv:66,hp:125,dmg:19,ag:1,as:2400,c:'#c02a2a',w:22,h:30,co:[300,800],dr:[['cuero',.9],['hueso',1]],rare:['cuerno',120]},
vaca:{n:'Vaca',lv:2,hp:8,dmg:1,as:3000,c:'#f0f0f0',w:20,h:14,co:[1,4],dr:[['carne',1],['cuero',.7],['grasa',.5]]},
gallina:{n:'Gallina',lv:1,hp:3,dmg:0,as:2400,c:'#e8d8a8',w:10,h:10,co:[0,2],dr:[['pollo',1],['huevo',.6],['pluma',.5]]},
jabali:{n:'Jabalí',lv:8,hp:18,dmg:3,as:2400,c:'#6a4a3a',w:18,h:13,co:[5,15],dr:[['carne_jab',1],['cuero',.5],['grasa',.4]]},
rana:{n:'Rana gigante',lv:20,hp:30,dmg:5,as:2400,c:'#6aaa3a',w:16,h:12,co:[15,40],dr:[['ancas',1],['grasa',.5]]},
yak:{n:'Yak',lv:34,hp:50,dmg:8,as:3000,c:'#4a3a2a',w:24,h:18,co:[40,100],dr:[['carne_yak',1],['cuero',.8],['grasa',.6]]},
lagarto:{n:'Lagarto de lava',lv:50,hp:70,dmg:11,as:2400,c:'#d8702a',w:22,h:12,co:[100,250],dr:[['carne_lag',1],['grasa',.6],['hueso',.5]]},
orco:{n:'Orco',lv:10,hp:26,dmg:5,ag:1,as:2400,c:'#4a7a3a',w:20,h:28,co:[10,40],dr:[['cuero',.7],['hueso',1]],rare:['dientorco',64]},
b0:{n:'Gruk, Jefe Orco',lv:14,hp:80,dmg:8,ag:1,boss:1,as:3000,c:'#2f5a2a',w:30,h:40,co:[150,300],dr:[['cuero',1],['hueso',1]]},
b1:{n:'Fenrir, Lobo Alfa',lv:26,hp:140,dmg:11,ag:1,boss:1,as:2000,c:'#3a3a4a',w:34,h:22,co:[300,600],dr:[['cuero',1],['hueso',1]]},
b2:{n:'Rey Cienaga',lv:40,hp:210,dmg:15,ag:1,boss:1,as:2400,c:'#cfcfb8',w:18,h:34,co:[500,1000],dr:[['hueso',1]]},
b3:{n:'Yeti Milenario',lv:54,hp:300,dmg:19,ag:1,boss:1,as:3000,c:'#e8f2ff',w:32,h:40,co:[800,1600],dr:[['cuero',1],['hueso',1]]},
b4:{n:'Señor del Fuego',lv:74,hp:440,dmg:26,ag:1,boss:1,as:2400,c:'#e03a1a',w:32,h:44,co:[1500,3000],dr:[['cuero',1],['hueso',1]]}};
// [nombre, descripción, estadística, meta, recompensa]
const Q=[['Leñador novato','Consigue 10 troncos','got:logs',10,60],['Minero aprendiz','Consigue 10 menas de cobre','got:cobre',10,60],['Pescador','Pesca 10 camarones','got:camaron',10,60],
['Cocinero','Cocina 5 camarones','make:c_camaron',5,80],['Herrero','Forja 5 barras de bronce','make:b_bronce',5,100],['Armado','Forja una espada de bronce','make:sw_bronce',1,150],
['Caza goblins','Mata 5 goblins','kill:goblin',5,120],['Lobo solitario','Mata 8 lobos','kill:lobo',8,400],['Maestro minero','Llega a nivel 20 de Minería','lvl:mi',20,500],
['Huesos duros','Mata 10 esqueletos','kill:esqueleto',10,1200],['Aventurero','Nivel total 150','tot',150,800],['Suertudo','Consigue un drop raro','rare',1,1000],
['Acaudalado','Gana 5.000 de oro','coins',5000,1500],['Cazaogros','Mata 5 ogros','kill:ogro',5,3000],
['Explorador','Llega al Bosque','bio',2,200],['Montañista','Llega a las Cumbres','bio',4,800],['Fuego del volcán','Llega al Volcán','bio',5,2500],['Aprendiz de mago','Lanza 10 hechizos','cast',10,200],
['Artesano','Crea una armadura de cuero','make:ar_cuero',1,150],['Corredor','Llega a nivel 20 de Agilidad','lvl:ag',20,400],['Matademonios','Mata 5 demonios','kill:demonio',5,8000],['Manitas','Fabrica un hacha de hierro','make:ax_hierro',1,200],['Pico de acero','Fabrica un pico de acero','make:pk_acero',1,500],['Caña de tejo','Fabrica una caña de tejo','make:rd_tejo',1,1500],['Herramientas','Fabrica un hacha de cobre','make:ax_cobre',1,100],['Primera receta','Cocina camarones fritos','make:f_camaron',1,150],['Ganadero','Mata 10 vacas','kill:vaca',10,200],['Gran chef','Cocina 10 platos perfectos','perfect',10,600],['Coleccionista','Descubre 25 objetos','disc',25,500],['Gran colección','Descubre 50 objetos','disc',50,2000],['Enciclopedia','Descubre 60 objetos','disc',60,6000],['Escriba','Inscribe 3 pergaminos de Chispa','make:sc_spark',3,150],['Primer botín','Consigue un objeto poco común (verde)','loot:1',1,200],['Afortunado','Consigue un objeto raro (azul)','loot:2',1,1500],['Leyenda viva','Consigue un objeto épico (morado)','loot:3',1,10000],['Hechicero','Lanza 50 hechizos','cast',50,800]];

const TCOL={abedul:'#d8d0b0',fresno:'#b09a6a',ebano:'#3a3a3a',cobre:'#b8623a',estano:'#cfd4dc',plata:'#e8e8f0',bronce:'#c8742a',hierro:'#9a9aa8',acero:'#cfd8e0',mitril:'#4a7aff',adam:'#3adf6a',madera:'#8a6a3a',cuero:'#8a5a2a',pino:'#a0703a',roble:'#7a4a22',sauce:'#7a9a4a',arce:'#c8652a',tejo:'#8a4aaa'},ORB={pino:'#8cf',abedul:'#cfe',roble:'#9f9',fresno:'#7fd',sauce:'#6fd',arce:'#fa6',tejo:'#e6f',ebano:'#f6a',cobre:'#fa8',estano:'#cde',bronce:'#fb6',hierro:'#9cf',acero:'#8ef',plata:'#eef',mitril:'#6af',adam:'#6f9'},TT=['madera','cobre','estano','bronce','hierro','acero','plata','mitril','adam'],tierOf=id=>id.split('_')[1]?id.split('_')[1].split('~')[0]:'',ARC=id=>TCOL[tierOf(id)]||'#c0392b';
const OREC={plata:'#e8e8f0',cobre:'#c8742a',estano:'#e8e8f8',hierro:'#a0502a',carbon:'#222',mitril:'#4a7aff',adam:'#3adf6a'},LOGC={abedul:'#d8d0b0',fresno:'#b09a6a',ebano:'#2a2a2a',logs:'#8a5a2a',roble:'#7a4a22',sauce:'#6a8a3a',arce:'#c8652a',tejo:'#7a3a8a'},ICM={};
function mkIcon(id){const c=document.createElement('canvas');c.width=c.height=16;const g=c.getContext('2d'),r=(col,x,y,w,h)=>{g.fillStyle=col;g.fillRect(x,y,w||1,h||1)},col=TCOL[tierOf(id)]||'#aaa';
 if(id.startsWith('sw_')){for(let i=0;i<9;i++){r(col,5+i,11-i,2,2);r('#ffffff88',6+i,11-i,1,1)}r('#d8c070',3,9,5,2);r('#6b4a2a',2,12,2,3)}
 else if(id.startsWith('ar_')){r(col,4,4,8,9);r(col,2,4,3,4);r(col,11,4,3,4);r('#00000055',7,4,2,2);r('#00000044',4,11,8,1);r('#ffffff55',5,5,2,5)}
 else if(/^(ax_|pk_|rd_)/.test(id)){const kk=id.slice(0,2),c2=TCOL[tierOf(id)]||'#aaa';for(let i=0;i<10;i++)r('#8a5a2a',3+i,13-i,1,1);
  if(kk==='ax'){r(c2,9,2,5,5);r('#ffffff88',13,3,1,3)}else if(kk==='pk'){r(c2,6,2,8,2);r(c2,6,2,2,4);r(c2,12,2,2,4)}else{r('#cfe8ff',12,5,1,8);r('#e33',11,13,3,2)}}
 else if(id.startsWith('bw_')){for(let i=0;i<12;i++)r(col,5+Math.round(4*Math.sin(i/11*Math.PI)),2+i,2,1);r('#ddd',5,2,1,12)}else if(id.startsWith('st_')){for(let i=0;i<11;i++)r('#8a5a2a',3+i,14-i,1,1);r(ORB[tierOf(id)]||'#9cf',10,1,4,4);r('#ffffff88',11,2,1,1)}else if(id.startsWith('b_')){r('#00000055',2,11,12,2);r(col,2,6,12,5);r('#ffffff66',3,6,10,2);r('#00000033',2,10,12,1)}
 else if(OREC[id]){r('#777',3,6,10,7);r('#999',4,4,8,3);r(OREC[id],5,7,2,2);r(OREC[id],9,6,2,2);r(OREC[id],7,10,2,2)}
 else if(LOGC[id]){r(LOGC[id],2,6,12,6);r('#00000033',2,10,12,2);r('#e0c090',2,6,2,6);r('#e0c090',12,6,2,6)}
 return c.toDataURL()}
const ic=id=>{if(!(/^(sw_|ar_|ax_|pk_|rd_|b_|bw_|st_)/.test(id)||OREC[id]||LOGC[id]))return I[id]?I[id][1]:'';return '<img class="ic" src="'+(ICM[id]||(ICM[id]=mkIcon(id)))+'">'};
// [título, estadística, meta, recompensa, diálogo de Ru, objetivo en el mapa]
const GOALS=[['Habla con Ru, el tendero de la plaza','talk',1,0,'','S:shop'],
['Tala 5 troncos','got:logs',5,30,'¡Bienvenido a Villa Pradera, viajero! Soy Ru, el tendero.|Este pueblo es tu base: guarda cosas en el banco, funde menas en el horno, forja en el yunque, cocina en la fogata y, en el taller, fabricas armaduras y esculpes cañas, arcos y bastones.|Para empezar, ve al bosque del norte y tala 5 troncos con tu hacha de madera: toca un árbol. ¡Sigue la flecha amarilla!','N:wc:0'],
['Mina 4 menas de cobre','got:cobre',4,30,'¡Buen trabajo! Ahora ve a las minas, al noreste, y saca cobre tocando las rocas anaranjadas.','N:mi:0'],
['Mina 4 menas de estaño','got:estano',4,30,'Ahora estaño, de las rocas claras. Servirá para tu segundo set de equipo y, junto al cobre, para el bronce.','N:mi:1'],
['Funde una barra de cobre','make:b_cobre',1,40,'Lleva el cobre al horno, en la herrería al sur de la plaza, y funde una barra. Cada metal es un escalón: cobre, estaño, bronce, hierro... El panel de la izquierda te muestra siempre tu siguiente mejora.','S:furnace'],
['Fabrica un hacha de cobre','make:ax_cobre',1,60,'Con 2 barras de cobre y 1 tronco, el yunque te hace un hacha de cobre: se equipa sola y tala más rápido. Cada tier de herramienta mejora la velocidad y reduce los golpes. Si fabricas más, pueden salir de mayor calidad. ¡Funde otra barra primero!','S:anvil'],
['Pesca 6 camarones','got:camaron',6,40,'En el estanque al sur hay peces. Pesca 6 camarones: toca las ondas del agua. Los necesitarás para curarte y para cocinar.','N:fi:0'],
['Cocina 4 camarones','make:c_camaron',4,50,'Las vacas del rancho pegan más fuerte de lo que parece, así que primero prepárate. Ve a la fogata y cocina 4 camarones normales: comida cocinada es lo que te cura (el juego la come solo cuando bajas de la mitad de vida).','S:fire'],
['Mata una vaca','kill:vaca',1,60,'Ahora sí: ve al rancho, al este del pueblo, y mata una vaca. Si te hacen daño, descansa o come tus camarones.','M:vaca'],
['Consigue manteca de vaca','got:grasa',1,40,'Las vacas a veces sueltan manteca, el ingrediente para platos mejores. Sigue cazándolas hasta que caiga una.','M:vaca'],
['Cocina camarones fritos','make:f_camaron',1,80,'Con un camarón y una manteca, ve a la fogata y cocina camarones fritos. A veces aparecerá un minijuego bonus: acierta para ganar XP extra y un plato adicional.','S:fire'],
['Forja una espada de cobre','make:sw_cobre',1,80,'Tu primera arma: en el yunque, con 2 barras de cobre. Luego equípala desde la mochila. Sin arma casi no haces daño, y cada tier de espada pega y acierta más.','S:anvil'],
['Fabrica una armadura de cuero','make:ar_cuero',1,100,'El cuero de vacas y goblins sirve para armaduras. Reúne 4 y hazla en el taller; luego equípala.','S:bench'],
['Derrota a 5 goblins','kill:goblin',5,150,'Los goblins son agresivos (⚔ sobre su cabeza): te atacan en cuanto te ven y pegan fuerte. Vacas y gallinas son pacíficas. Mira el nivel de cada goblin: los verdes o blancos son seguros, los naranjas y rojos te superan. Lleva comida cocinada.','M:goblin'],
['Fabrica una espada de estaño','make:sw_estano',1,120,'Siguiente escalón: Herrería nivel 5. Funde barras de estaño y forja una espada de estaño, más precisa y fuerte. Cada barra que fundes da XP: sigue subiendo Herrería.','S:anvil'],
['Esculpe una caña de pino','make:rd_pino',1,100,'El taller también esculpe, y se rige por los tipos de madera: pino, abedul, roble... 3 troncos de pino y 1 cuero hacen una caña de pino. Fíjate: el arco y el bastón básicos también están ya disponibles.','S:bench'],
['Derrota 3 gallinas','kill:gallina',3,40,'Los monstruos sueltan runas, la munición de la magia. Las gallinas sueltan plumas y huevos (tinta) y a veces runas de aire. Derrota 3.','M:gallina'],
['Inscribe un pergamino de Chispa','make:sc_spark',1,80,'La Inscripción se hace en el escritorio del pueblo: una pluma y un huevo hacen un pergamino de Chispa, un hechizo de un solo uso que no gasta maná ni runas. Si te falta algo, sigue cazando gallinas.','S:altar'],
['Lanza tu primer hechizo','cast',1,80,'Haz clic en el pergamino de tu mochila (o abre ✨ Magia), acércate a un monstruo y lanza Chispa. Con runas de aire (las sueltan los monstruos) y maná también puedes lanzarla sin pergamino.',''],
['Funde una barra de bronce','make:b_bronce',1,100,'Cobre + estaño = bronce (Herrería nivel 8). Es el tercer escalón de equipo.','S:furnace'],
['Fabrica una espada de bronce','make:sw_bronce',1,160,'Herrería nivel 10: forja una espada de bronce con 2 barras.','S:anvil'],
['Fabrica un peto de bronce','make:ar_bronce',1,160,'Artesanía nivel 12: un peto de bronce (3 barras y cuero) te protege bastante más. Antes puedes hacer petos de cobre y estaño para subir Artesanía.','S:bench'],
['Mina 4 menas de hierro','got:hierro',4,120,'El hierro (Minería nivel 12) es el gran salto antes del jefe orco. Busca las rocas rojizas al final de la franja de minas.','N:mi:2'],
['Funde una barra de hierro','make:b_hierro',1,150,'Herrería nivel 13: funde barras de hierro.','S:furnace'],
['Fabrica una espada de hierro','make:sw_hierro',1,300,'Herrería nivel 16: con una espada de hierro y buena armadura ya puedes pensar en el jefe orco.','S:anvil'],
['Derrota a un orco','kill:orco',1,250,'Los orcos del campamento, al final del camino, pegan más fuerte que los goblins. Prepárate con hierro y mucha comida.','M:orco'],
['Derrota a Gruk, el Jefe Orco','kill:b0',1,500,'Gruk no deja pasar a nadie al Bosque. Es duro: ve con espada de hierro o mejor, armadura, mucha comida y Combate 15 o más. ¡Suelta runas y botín raro!','M:b0'],
['Llega al Bosque','bio',2,200,'La puerta del campamento orco está abierta. Sigue el camino hacia el este: el Bosque tiene mejores recursos.','B:1'],
['Mina 4 menas de carbón','got:carbon',4,250,'El carbón (Minería nivel 22) se encuentra en el Bosque y convierte el hierro en acero.','N:mi:3'],
['Funde una barra de acero','make:b_acero',1,350,'Hierro + carbón, Herrería nivel 22: el acero es el siguiente escalón.','S:furnace'],
['Fabrica un hacha de acero','make:ax_acero',1,400,'Herrería nivel 26: 2 barras de acero y 1 tronco de roble. Tala mucho más rápido.','S:anvil'],
['Derrota a Fenrir, el Lobo Alfa','kill:b1',1,900,'Fenrir guarda la salida del Bosque. Es rápido y muy peligroso: Combate 28 o más recomendado.','M:b1'],
['Llega al Pantano','bio',3,400,'El Pantano esconde plata, ancas de rana y esqueletos. Cuidado.','B:2'],
['Mina 4 menas de plata','got:plata',4,500,'La plata (Minería nivel 32) crece en el Pantano.','N:mi:4'],
['Fabrica una espada de plata','make:sw_plata',1,800,'Herrería nivel 36: barras de plata para una espada mucho mejor.','S:anvil'],
['Derrota al Rey Cienaga','kill:b2',1,1500,'El Rey Cienaga custodia el paso a las Cumbres. Lleva armadura de plata o mitril y mucha comida.','M:b2'],
['Llega a las Cumbres','bio',4,800,'Las Cumbres nevadas guardan mitril y yaks. Lleva buena armadura.','B:3'],
['Fabrica un pico de mitril','make:pk_mitril',1,1500,'Herrería nivel 48: mitril y carbón para la barra, y un pico que casi vuela por la roca.','S:anvil'],
['Derrota al Yeti Milenario','kill:b3',1,3000,'El Yeti Milenario cierra el camino al Volcán. Prepárate bien.','M:b3'],
['Llega al Volcán','bio',5,2500,'El Volcán es el último bioma: adamantita, pez magma y demonios.','B:4'],
['Fabrica una espada de adamantita','make:sw_adam',1,4000,'Herrería nivel 62: la mejor espada fabricable.','S:anvil'],
['Derrota al Señor del Fuego','kill:b4',1,8000,'El último jefe vive en el corazón del Volcán. ¡Equípate al máximo!','M:b4']];
const XT=[0,0];{let p=0;for(let l=1;l<99;l++){p+=Math.floor(l+300*Math.pow(2,l/7));XT[l+1]=Math.floor(p/4)}}
const lvlOf=x=>{let l=1;while(l<99&&x>=XT[l+1])l++;return l};
let S={xp:{wc:0,mi:0,fi:0,co:0,sm:0,cr:0,es:0,ins:0,mg:0,ag:0,cb:0},inv:[],bank:{},coins:0,tool:{wc:0,mi:0,fi:0},st:{},done:{},buf:{},bagU:0,luck:0,wis:0,goal:0,gseen:-1,auto:1,boss:{},merc:0,trv:0,vig:0,fzr:0,dfs:0,mana2:0,mreg2:0,crf:0,hv:0,cfg:0,rvt:0,tq:{wc:0,mi:0,fi:0},pity:0,legR:0,runes:{},mv:40,sv:100,disc:{},eq:{w:null,a:null},t:Date.now(),cur:null};
try{const r=JSON.parse(localStorage.getItem('tdo2'));if(r)S={...S,...r,xp:{...S.xp,...r.xp},tool:{...S.tool,...r.tool}};if(r&&!r.ver){for(const k in S.tool)S.tool[k]++}if(r&&!r.eq){const bs=M=>S.inv.filter(x=>M[x]).sort((a,b)=>M[b]-M[a])[0],w=bs(SW),a=bs(AR);if(w){S.eq.w=w;S.inv.splice(S.inv.indexOf(w),1)}if(a){S.eq.a=a;S.inv.splice(S.inv.indexOf(a),1)}}if(r&&(r.ver||0)<10)migOld();S.ver=10}catch(e){}
let WIPE=0,rtm;
function migOld(){const ver=S.ver||0,mp={cobre:'pino',estano:'abedul',bronce:'roble',hierro:'fresno',acero:'sauce',plata:'arce',mitril:'tejo',adam:'ebano'},fx=id=>typeof id==='string'?id.replace(/^(bw|st)_(cobre|estano|bronce|hierro|acero|plata|mitril|adam)/,(m,a,b)=>a+'_'+mp[b]):id;
 S.inv=S.inv.map(fx);for(const k of Object.keys(S.bank)){const n=fx(k);if(n!==k){S.bank[n]=(S.bank[n]||0)+S.bank[k];delete S.bank[k]}}for(const k of Object.keys(S.eq))S.eq[k]=fx(S.eq[k]);for(const k of Object.keys(S.disc)){const n=fx(k);if(n!==k){S.disc[n]=1;delete S.disc[k]}}
 if(ver<9)for(const k in S.tool)S.tool[k]=[0,3,4,5,7,8][S.tool[k]]??S.tool[k];
 for(const k of ['wc','mi','fi']){const t=S.tool[k]||0;if(!S.eq[k]&&t>0)S.eq[k]=(k==='wc'?'ax_':k==='mi'?'pk_':'rd_')+(k==='fi'?WON[t-1]:TNM[t-1])}}
const save=()=>{if(WIPE)return;S.t=Date.now();try{localStorage.setItem('tdo2',JSON.stringify(S))}catch(e){}};
function resetGame(){const b=$('#rstb');if(b.dataset.arm!=='1'){b.dataset.arm='1';b.textContent='¿Seguro? Clic otra vez para borrar';clearTimeout(rtm);rtm=setTimeout(()=>{b.dataset.arm='0';b.textContent='Reiniciar'},4000);return}WIPE=1;try{localStorage.removeItem('tdo2')}catch(e){}location.reload()}
const L=sk=>lvlOf(S.xp[sk]),count=id=>S.inv.filter(x=>x===id).length,maxHp=()=>10+L('cb')*2+gs('hp')+5*S.vig,wb=()=>WB[S.eq.w]||0,ab=()=>(AR[S.eq.a]||0)+gs('def')+S.dfs+(S.buf.def>Date.now()?5:0),maxHit=()=>{if(wtype()==='g')return Math.max(1,...SPL.filter(s=>s.atk&&L('mg')>=s.lv).map(spMax));const w=S.eq.w,l=L('cb'),ef=l+8+S.fzr+(S.buf.dmg>Date.now()?3+Math.floor(l*.1):0);return Math.floor(.5+ef*(64+(w?SB[w]||0:0)+gs('str'))/640)};
const hasIn=o=>Object.entries(o).every(([k,v])=>count(k)>=v);
const take=o=>{for(const[k,v]of Object.entries(o))for(let n=0;n<v;n++)S.inv.splice(S.inv.indexOf(k),1)};
const hitPeriod=sk=>TOOLS[sk]?[3,3,3,2,2,2,1,1,1][S.tool[sk]]*600:900,hitAmt=(sk,a)=>Math.min(1,(TOOLS[sk]?(1+L(sk)*.01)*(1+.18*(S.tool[sk]+(S.tq[sk]||0)))/(3+rq(a)/7.5):(900/a[a.length-1])*(1+L(sk)*.006))),dur=(sk,a)=>hitPeriod(sk)*Math.ceil(1/hitAmt(sk,a));

// ---------- mundo ----------
const BW=2300,WW=11500,WH=1500;
const BI=[{n:'Pradera',lv:1,ic:'🌱',g:['#4a8a3e','#3f7a36','#58994a'],w:'#2f6fb5',sh:'#9fd0ff'},{n:'Bosque',lv:15,ic:'🌲',g:['#2f6a3a','#285a30','#3a7a44'],w:'#2a5f9a',sh:'#8ab8ee'},
{n:'Pantano',lv:30,ic:'🐸',g:['#55623a','#4a5632','#66744a'],w:'#3a5a3a',sh:'#8fbf8a'},{n:'Cumbres',lv:45,ic:'❄️',g:['#d6e2ea','#c4d2dc','#eaf2f7'],w:'#7ab4d8',sh:'#e8f6ff'},{n:'Volcán',lv:60,ic:'🌋',g:['#3a2a2a','#2e2020','#4a3434'],w:'#d8501a',sh:'#ffc060'}];
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const N=[],M=[],ST=[],PD=[],BLK=[],MID=['goblin','lobo','esqueleto','ogro','demonio'];
const relocate=e=>{for(let a=0;a<10;a++){e.x=e.z[0]+Math.random()*(e.z[1]-e.z[0]);e.y=e.z[2]+Math.random()*(e.z[3]-e.z[2]);if(!N.some(o=>o!==e&&Math.hypot(o.x-e.x,o.y-e.y)<34))break}e.g=Math.random()<.04};
const sp0=(t,i,n,x0,x1,y0,y1)=>{for(let k=0;k<n;k++){const e={t,i,x:0,y:0,rt:0,z:[x0,x1,y0,y1]};relocate(e);N.push(e)}};
Object.keys(MD).forEach(id=>MD[id].id=id);
const LVR={goblin:[2,7],lobo:[9,15],esqueleto:[24,32],ogro:[40,48],demonio:[60,72],vaca:[1,3],gallina:[1,2],jabali:[6,10],rana:[17,23],yak:[30,38],lagarto:[46,54],orco:[8,13],b0:[14,14],b1:[26,26],b2:[40,40],b3:[54,54],b4:[74,74]};
function rollLv(m){const d=m.d,r=LVR[d.id],df=(m.lv=R(r[0],r[1]))-d.lv;const r2=.12*Math.min(1,6/d.lv);m.mh=Math.max(1,Math.round(d.hp*(1+r2*df)));m.dm=d.dmg?Math.max(1,Math.round(d.dmg*(1+r2*df))):0;m.hp=m.mh;m.hunt=0;m.ag0=0;m.bleed=null;m.lx=null}
const mob=(id,x,y)=>{const m={d:MD[id],hx:x,hy:y,x,y,rt:0,tx:x,ty:y,wt:0,fl:0};rollLv(m);M.push(m)},ING=[['vaca','gallina'],['jabali'],['rana'],['yak'],['lagarto']];
const ZS=[];
BI.forEach((b,k)=>{const x0=k*BW;
 ST.push({id:'bank',n:'Banco',x:x0+90,y:710},{id:'shop',n:'Ru · Tienda',x:x0+300,y:710},{id:'fire',n:'Fogata',x:x0+195,y:795,sks:['co']},{id:'furnace',n:'Horno',x:x0+90,y:875,sks:['sm']},{id:'anvil',n:'Yunque',x:x0+170,y:878,sks:['sm']},{id:'bench',n:'Taller',x:x0+300,y:875,sks:['cr','es']},{id:'altar',n:'Escritorio',x:x0+340,y:778,sks:['ins']});
 {const put=(kind,list,rs)=>list.forEach(([i,n])=>{for(let j=0;j<n;j++){const r=rs[R(0,rs.length-1)];sp0(kind,i,1,x0+r[0],x0+r[1],r[2],r[3])}}),ZN=(r,t)=>ZS.push({k,r:[x0+r[0],x0+r[1],r[2],r[3]],t}),nm=(sk,i)=>ACT[sk][i][0];
 const WZ=[[[[0,7],[1,1]],[[1,7],[0,1],[2,1]],[[2,6],[1,1]]],[[[3,7],[2,1]],[[4,7],[3,1]],[[2,6],[3,1]]],[[[5,7],[4,1]],[[4,7],[5,1]]],[[[6,7],[5,1]],[[5,7],[6,1]]],[[[7,7],[6,1]],[[6,7],[7,1]]]][k],
  WR=[[[60,360,90,270]],[[60,440,1140,1222],[60,440,1318,1372]],[[620,1000,850,1000]]];
 WZ.forEach((l,z)=>{put('wc',l,WR[z]);ZN([[50,370,80,280],[40,476,1130,1380],[610,1010,840,1010]][z],'🌲 Zona de '+nm('wc',l[0][0]).toLowerCase())});
 const MZ=[[[[0,7],[1,1]],[[1,7],[0,1]],[[2,6],[1,1]]],[[[2,7],[3,1]],[[3,7],[2,1]]],[[[3,7],[4,1]],[[4,7],[3,1]]],[[[5,8],[4,1]]],[[[6,8],[5,1]]]][k],MR=[[430,640],[910,1110],[1390,1600]];
 MZ.forEach((l,v)=>{put('mi',l,[[MR[v][0],MR[v][1],60,190]]);ZN([MR[v][0]-10,MR[v][1]+10,40,215],'⛏️ Veta de '+nm('mi',l[0][0]).toLowerCase())});
 const FZ=[[[[0,7],[1,1]],[[1,7],[0,1]],[[2,6],[1,1]]],[[[3,7],[2,1]],[[4,7],[3,1]]],[[[5,7],[4,1]],[[4,5],[5,1]]],[[[6,7],[5,1]],[[5,5],[6,1]]],[[[7,7],[6,1]],[[6,5],[7,1]]]][k];
 put('fi',FZ[0],[[520,940,1184,1192]]);ZN([480,980,1168,1380],'🎣 Estanque: '+nm('fi',FZ[0][0][0]).toLowerCase());
 put('fi',FZ[1],[[60,220,1242,1250],[312,440,1242,1250],[60,220,1290,1298],[312,440,1290,1298]]);ZN([40,476,1230,1312],'🎣 Río: '+nm('fi',FZ[1][0][0]).toLowerCase());
 if(FZ[2]){put('fi',FZ[2],[[1330,1600,1124,1132]]);ZN([1300,1634,1108,1306],'🎣 Lago: '+nm('fi',FZ[2][0][0]).toLowerCase())}}
 PD.push({x:x0+480,y:1180,w:500,h:190,sh:b.sh},{x:x0+40,y:1238,w:436,h:64,sh:b.sh});BLK.push([x0+476,x0+984,1178,1378],[x0-40,x0+236,1236,1304],[x0+304,x0+476,1236,1304]);if(k===0){PD.push({x:x0+1304,y:1122,w:326,h:176,sh:b.sh});BLK.push([x0+1300,x0+1634,1118,1302])}
 ING[k].forEach((id,j)=>{for(let i=0;i<4;i++)mob(id,(ING[k].length>1?x0+470+j*150+(i%2)*(j?40:60)+R(0,10):x0+500+(i%2)*70+R(0,10))+250,(ING[k].length>1&&j?350:340)+(i/2|0)*(j?45:55)+R(0,8)+300)});
 if(k===0){[[870,280],[990,300],[1110,290],[900,400],[1030,420],[1130,410],[950,520]].forEach(([dx,dy])=>mob('goblin',x0+dx+500+R(-14,14),dy+300+R(-14,14)));for(const [dx,dy] of [[1200,330],[1290,320],[1200,540],[1290,550]])mob('orco',x0+dx+800+R(-10,10),dy+300+R(-10,10))}
 else for(let i=0;i<6;i++)mob(MID[k],x0+1430+(i%3)*105+R(-8,8),610+(i/3|0)*105+R(-8,8));
 mob('b'+k,x0+2130,740)});

const alive=(e,now)=>!e.rt||e.rt<=now,nearS=id=>ST.find(s=>s.id===id&&Math.hypot(P.x-s.x,P.y-s.y)<80);
const P={x:200,y:750,f:1,w:0,hp:0,g:null,mv:null,mvg:0},K={};let A=null,parts=[],logs=['Bienvenido a Villa Pradera. Habla con Ru, el tendero de la plaza, para empezar.'],dirty=1,pd=0,lr=0,lreg=0,lfx=0,DT=0,TB='inv',cx=0,cy=0,curB=0,swc=0;
P.hp=maxHp();S.tq=S.tq||{wc:0,mi:0,fi:0};syncTools();S.st.bio=S.st.bio||1;for(let k=0;k<(S.st.bio||1)-1;k++)S.boss[k]=1;S.inv.forEach(x=>S.disc[x]=1);Object.keys(S.bank).forEach(x=>S.disc[x]=1);[S.eq.w,S.eq.a].forEach(x=>{if(x)S.disc[x]=1});S.st.disc=Object.keys(S.disc).length;

// ---------- música (Amber Ale = Pradera, Dragon Smasher = combate) ----------
const MUS={amber:'assets/music/amber.mp3',dragon:'assets/music/dragon.mp3',tavern:'assets/music/tavern.mp3'},MVOL=.55,TR={};
let UNL=0,vT=0,vB=0,fightAt=-1e9;
['pointerdown','keydown'].forEach(e=>addEventListener(e,()=>{UNL=1}));
document.addEventListener('visibilitychange',()=>{if(document.hidden)Object.values(TR).forEach(a=>a.pause())});
function trk(k){if(!TR[k]){const a=new Audio(MUS[k]);a.loop=true;a.volume=0;a.onerror=()=>{if(a.dataset&&a.dataset.b)return;a.dataset=a.dataset||{};a.dataset.b=1;try{const bin=atob(MUS[k].split(',')[1]),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);a.src=URL.createObjectURL(new Blob([u],{type:'audio/mpeg'}))}catch(e){}};TR[k]=a}return TR[k]}
// sube/baja el volumen poco a poco; al llegar a 0 pausa SIN reiniciar, así la canción sigue donde quedó
function ramp(k,v,tgt,dt){if(tgt===0&&v<=.001&&!TR[k])return 0;const a=trk(k);v+=Math.max(-dt/2.2,Math.min(dt/2.2,tgt-v));a.volume=Math.max(0,Math.min(1,v*S.mv/100));
 if(v>.001&&a.paused){const p=a.play();if(p&&p.catch)p.catch(()=>{})}else if(v<=.001&&tgt===0&&!a.paused)a.pause();return v}
let vV=0,INV=0;
function inVil(r){const x0=curB*BW;return Math.abs(P.x-(x0+210))<r&&Math.abs(P.y-770)<r-30}
function bgm(now,dt){if(A&&A.ty==='f')fightAt=now;const fight=now-fightAt<2500,off=S.mute||!UNL;if(!INV&&inVil(235))INV=1;else if(INV&&!inVil(280))INV=0;
 vT=ramp('amber',vT,(!off&&!fight&&curB===0&&!INV)?1:0,dt);vV=ramp('tavern',vV,(!off&&!fight&&INV)?1:0,dt);vB=ramp('dragon',vB,(!off&&fight)?1:0,dt);if(!fight&&curB>0&&!INV)music(now)}
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
const PEN=[[262,294,330,392,440],[220,247,294,330,370],[196,233,262,311,349],[294,349,392,440,523],[165,175,208,247,262]];
function music(now){if(!AC||S.mute||now<nm)return;nm=now+R(1400,3000);const f=PEN[curB][R(0,4)]*(Math.random()<.3?2:1);tone(f,1.8,curB===4?'sawtooth':'triangle',curB===4?.012:.03)}
// ---------- lógica ----------
function log(m){logs.unshift(m);logs=logs.slice(0,5);$('#log').innerHTML=logs.map(x=>'<div>'+x+'</div>').join('')}
let tt;function toast(h,ms=2400){const t=$('#toast');t.innerHTML=h;t.style.display='block';clearTimeout(tt);tt=setTimeout(()=>t.style.display='none',ms)}
let chkg=0;function chk(){if(chkg)return;chkg=1;Q.forEach((q,i)=>{if(!S.done[i]&&(S.st[q[2]]||0)>=q[3]){S.done[i]=1;snd('quest');S.coins+=q[4];S.st.coins=(S.st.coins||0)+q[4];toast('📜 Misión completada: <b>'+q[0]+'</b><br>+'+q[4]+' oro');log('Misión completada: '+q[0]);dirty=1}});let adv=0,rw=0;while(S.goal<GOALS.length&&(S.st[GOALS[S.goal][1]]||0)>=GOALS[S.goal][2]){rw+=GOALS[S.goal][3];S.goal++;adv++}if(adv){S.coins+=rw;S.st.coins=(S.st.coins||0)+rw;snd('quest');const g=GOALS[S.goal];toast('🎯 ¡Objetivo cumplido!'+(rw?'<br>+'+rw+' oro':'')+(g?'<br>Siguiente: <b>'+g[0]+'</b>':'<br>¡Completaste todos los objetivos!'));log('Objetivo cumplido'+(g?'. Siguiente: '+g[0]:'.'));dirty=1}if(S.goal>=GOALS.length&&!S.legR){S.legR=1;addLoot('lg_ring')}chkg=0}
function inc(k,n=1){S.st[k]=(S.st[k]||0)+n;chk()}
const earn=n=>{S.coins+=n;inc('coins',n)};
const add=id=>{S.inv.push(id);inc('got:'+id);disc(id)};
function disc(id){if(!S.disc[id]&&!id.includes('~')){S.disc[id]=1;S.st.disc=Object.keys(S.disc).length;log('📖 ¡Nuevo objeto! '+I[id][0]);snd('xp');chk()}}
function sp(x,y,c,n,vx,vy,g){for(let k=0;k<n;k++)parts.push({x,y,vx:(Math.random()-.5)*vx,vy:-Math.random()*vy,g,l:1,c})}
function gain(sk,xp,sil){xp*=(1+.05*S.wis)*(S.buf.xp>Date.now()?1.5:1)*(sk==='cb'||sk==='mg'?1+pv('savant')/100:TOOLS[sk]?1+tpv(sk,'gsage')/100:1);const o=L(sk);S.xp[sk]+=xp;if(!sil&&sk!=='ag')snd('xp');if(TB==='sk')skLive(sk); /* actualiza solo la barra y el texto de esa skill; subir de nivel marca dirty (rebuild) más abajo */if(!sil)LASTX=[sk,performance.now()];const n=L(sk);
 if(!sil){XD.push({t:'+'+Math.round(xp),i:SK[sk][1],t0:performance.now(),n:XN++});if(XD.length>10)XD.shift()}
 if(n>o){S.st['lvl:'+sk]=n;S.st.tot=SKL.reduce((s,k)=>s+L(k),0);banner('¡Nivel '+n+'!',SK[sk][1]+' '+SK[sk][0],'#ffe629',3200);log('¡Nivel '+n+' en '+SK[sk][0]+'!');sp(P.x,P.y-20,'#ffe629',24,160,120,200);snd('lvl');if(sk==='cb')P.hp=maxHp();chk();dirty=1}}
function stepAct(sk,i,sil){const a=ACT[sk][i],cr=a.length===6;
 if(L(sk)<rq(a))return 0;
 if(cr){if(!hasIn(a[1])){if(!sil)log('Te faltan materiales.');return 0}
  if(ownT(a)){if(!sil)log('Ya tienes esa herramienta o una mejor.');return 0}take(a[1]);
  if(sk==='co'&&Math.random()<Math.max(0,.45-(L(sk)-a[3])*.02)){add('quemado');if(!sil)log('Quemaste la comida.')}
  else{if(a[2]&&a[2].startsWith('rn_')){const[rid,n]=a[2].split(':'),rk=rid.slice(3);S.runes[rk]=(S.runes[rk]||0)+ +n;disc(rid);inc('make:'+rid)}else if(a[2]){const vid=qv(a[2],sk);add(vid);autoEq(vid);inc('make:'+a[2]);if(vid!==a[2]){const q=+vid.split('~')[1];log('<span style="color:'+RAR[q][1]+'">✨ ¡Calidad '+RAR[q][0].toLowerCase()+'!</span>');if(q>=2){toast('🔨 <span style="color:'+RAR[q][1]+'">¡Calidad '+RAR[q][0].toLowerCase()+'!</span><br>'+I[a[2]][0]);snd('rare')}}}else inc('fm');gain(sk,a[4],sil);if(!sil)log(!a[2]?'Quemas '+a[0].slice(7):a[2].startsWith('tl:')||a[2].startsWith('rn_')?'Fabricas: '+a[0]:'Obtienes: '+I[a[2]][0])}
  return 1}
 if(S.inv.length>=cap()){if(!sil)log('Inventario lleno. Vende o usa el banco.');return 0}
 add(a[1]);if(!sil&&S.inv.length<cap()&&Math.random()*100<pv('harvest')+4*S.hv){add(a[1]);log('✨ ¡Cosecha doble!')}gain(sk,a[3],sil);if(!sil)log('Obtienes: '+I[a[1]][0]);
 const r=RARE[sk];if(r&&S.inv.length<cap()&&Math.random()<(1+.25*S.luck+tpv(sk,'lucky')/100)/r[1]){add(r[0]);inc('rare');snd('rare');toast(I[r[0]][1]+' ¡Drop raro: <b>'+I[r[0]][0]+'</b>!',3000);log('¡Drop raro! '+I[r[0]][0])}
 return 1}
function stopA(m){A=null;S.cur=null;if(m)log(m);dirty=1}
function startG(e,now){if(!alive(e,now))return;const a=ACT[e.t][e.i];
 if(L(e.t)<rq(a))return log('Necesitas nivel '+rq(a)+' en '+SK[e.t][0]+'.');
 if(S.inv.length>=cap())return log('Inventario lleno. Vende o usa el banco.');
 A={ty:'g',e,sk:e.t,i:e.i,t0:now,d:dur(e.t,a),pr:0,amt:hitAmt(e.t,a),per:hitPeriod(e.t),base:hitPeriod(e.t)};S.cur={sk:e.t,i:e.i};dirty=1}
function startF(e,now){if(!alive(e,now))return;A={ty:'f',e,t0:now,ph:now+700,sk:'cb',ms:atkMs()};e.hunt=1;e.nt=Math.max(e.nt||0,now+1400);dirty=1}
function startC(sk,i){const a=ACT[sk][i];if(ownT(a))return log('Ya tienes esa herramienta.');if(L(sk)<rq(a)||!hasIn(a[1]))return log('Te faltan materiales o nivel.');
 A={ty:'c',e:S.stn,sk,i,t0:performance.now(),d:dur(sk,a),pr:0,amt:hitAmt(sk,a),per:hitPeriod(sk),left:QTY||1e9};S.cur={sk,i};dirty=1}
function reseek(e,now){if(e.d&&(!S.auto||(e.d.ag&&(P.hp<maxHp()*.6||M.some(o=>o!==e&&o.hunt&&alive(o,now))))))return stopA();let b=null,bd=1e9;(e.d?M:N).forEach(o=>{if(o===e||!alive(o,now)||(e.d?o.d!==e.d:(o.t!==e.t||o.i!==e.i))||(e.d&&e.d.ag&&M.some(q=>q!==o&&q!==e&&alive(q,now)&&q.d.ag&&Math.hypot(q.x-o.x,q.y-o.y)<100)))return;const d=Math.hypot(o.x-e.x,o.y-e.y);if(d<bd){bd=d;b=o}});
 if(b){A=null;P.g={e:b}}else stopA('No quedan más cerca. Espera a que reaparezcan.')}
function engage(e,now){P.f=e.x>=P.x?1:-1;
 if(e.t)startG(e,now);else if(e.d)startF(e,now);else if(e.id==='bank')tab('bank');else if(e.id==='shop'){tab('shop');talk()}else{S.stn=e;tab('st')}}
function splat(x,y,d,c){parts.push({x,y,vx:0,vy:-10,g:0,l:1.2,tx:String(d),sp:d>0?(c||'#c22'):'#27c'})}
function eat(){if(P.hp>maxHp()*.45||P.hp<=0)return;const id=S.inv.filter(x=>I[x][3]).sort((a,b)=>(I[a][4]?1:0)-(I[b][4]?1:0)||I[b][3]-I[a][3])[0];if(id){S.inv.splice(S.inv.indexOf(id),1);P.hp=Math.min(maxHp(),P.hp+I[id][3]);log('Comes '+I[id][0]+' (+'+I[id][3]+' PV).');dirty=1}}
function die(){snd('die');P.pjM=null;M.forEach(m=>m.hunt=0);P.hp=maxHp();P.x=curB*BW+200;P.y=750,FD=performance.now();P.g=P.mv=null;stopA();toast('☠️ Moriste. Despiertas en el campamento.');log('Moriste. Come comida cocinada para sobrevivir.')}
const MB={goblin:0,vaca:0,gallina:0,lobo:1,jabali:1,esqueleto:2,rana:2,ogro:3,yak:3,demonio:4,lagarto:4,orco:0,b0:0,b1:1,b2:2,b3:3,b4:4};
function addLoot(id){const it=LOOT[id],c=RAR[it.r][1];if(S.inv.length<cap())S.inv.push(id);else{S.bank[id]=(S.bank[id]||0)+1;log('Tu mochila está llena: '+I[id][0]+' fue al banco.')}
 disc(id);inc('loot:'+it.r);log('<span style="color:'+c+'">¡Botín '+RAR[it.r][0].toLowerCase()+': '+I[id][0]+'!</span>');
 if(it.r>=2)toast('<span style="color:'+c+'">'+RAR[it.r][0]+'</span><br><b style="color:'+c+'">'+I[id][1]+' '+I[id][0]+'</b>',it.r>=3?5500:3500);
 sp(P.x,P.y-20,c,it.r*12,150,130,170);snd(it.r>=3?'epic':it.r===2?'rare':'coin');dirty=1}
function rollLoot(m,bm){const k=MB[m.d.id],dl=Math.max(0,m.lv-m.d.lv),mu=(1+.25*S.luck+.015*dl+pv('prosp')/100)*(1+Math.min(1,S.pity/120)),r=Math.random(),pE=.00018*mu*(bm||1),pB=.0045*mu*(bm||1),pG=.034*mu*(bm||1);
 let q=0;if(r<pE)q=3;else if(r<pE+pB)q=2;else if(r<pE+pB+pG)q=1;if(!q){S.pity++;return}S.pity=0;const sl=['h','f','r','n','w'][R(0,4)];addLoot(sl==='w'?'lw_'+k+'dmbc'[R(0,3)]+q:'lt_'+k+sl+q)}
const BRESP=[60,90,120,150,180],BRN=[[['air',12,24],['earth',8,16],['life',4,8]],[['earth',10,20],['life',6,12],['water',4,8]],[['water',8,16],['life',6,12],['arc',2,4]],[['fire',6,12],['water',8,14],['arc',3,6]],[['fire',8,16],['arc',6,12],['earth',10,20]]],RNN={air:'aire',earth:'tierra',life:'vida',water:'agua',fire:'fuego',arc:'arcana'};
function bossKill(m,now){const bk=MB[m.d.id],first=!S.boss[bk];S.boss[bk]=1;const got=BRN[bk].map(([k,a,b])=>{const n=R(a,b);S.runes[k]=(S.runes[k]||0)+n;disc('rn_'+k);return n+' de '+RNN[k]});log('👑 Runas del jefe: '+got.join(', '));
 banner('👑 ¡'+m.d.n+' ha caído!',(first?(bk<4?'El camino a '+BI[bk+1].n+' se abre':'¡Has derrotado al último jefe!'):'Runas: '+got.join(', '))+' · reaparece en '+BRESP[bk]+' s','#ff9a3a',5200);snd('epic');sp(m.x,m.y-20,'#ffd100',30,160,140,180);dirty=1}
function bossHTML(){const now=performance.now();return '<div style="margin-top:12px;border-top:2px dashed var(--hi);padding-top:6px">👑 Jefes (abren el camino)<div class="hint" style="margin:0">'+[0,1,2,3,4].map(k=>{const m=M.find(x=>x.d.id==='b'+k),dead=m&&!alive(m,now);return (S.boss[k]?'✔ ':'🔒 ')+MD['b'+k].n+(dead?' · reaparece en '+Math.ceil((m.rt-now)/1000)+' s':'')}).join('<br>')+'</div></div>'}
const RUD={gallina:[['air',1,3,.7]],vaca:[['earth',1,3,.4]],goblin:[['air',2,6,.6],['earth',1,4,.4]],orco:[['earth',2,6,.5],['life',1,3,.3]],jabali:[['life',1,3,.4]],lobo:[['air',3,8,.5],['earth',3,6,.4]],rana:[['water',2,6,.6]],esqueleto:[['earth',3,8,.5],['life',2,5,.4]],yak:[['water',2,5,.4]],ogro:[['fire',2,5,.4],['earth',4,8,.4]],lagarto:[['fire',2,6,.6]],demonio:[['fire',3,8,.5],['arc',1,2,.25]]};
function kill(m,now){const d=m.d;snd('kill');m.rt=now+(d.boss?BRESP[MB[d.id]]*1000:12000);const dl=Math.max(0,m.lv-d.lv);earn(Math.round(R(d.co[0],d.co[1])*(1+.05*dl)*(1+pv('prosp')/100)));MN=Math.min(mnMax(),MN+Math.round(pv('siph')));d.dr.forEach(([id,p])=>{if(Math.random()<Math.min(1,p*(1+.03*dl))&&S.inv.length<cap())add(id)});(RUD[d.id]||[]).forEach(([k,a,b,p])=>{if(Math.random()<Math.min(1,p*(1+.03*dl))){const n=R(a,b);S.runes[k]=(S.runes[k]||0)+n;disc('rn_'+k);log('<span style="color:#c8a0ff">+'+n+' runa'+(n>1?'s':'')+' de '+RNN[k]+'</span>')}});
 if(d.rare&&Math.random()<(1+.25*S.luck+.02*dl)/d.rare[1]){add(d.rare[0]);inc('rare');snd('rare');toast(I[d.rare[0]][1]+' ¡Drop raro: <b>'+I[d.rare[0]][0]+'</b>!',3000)}
 inc('kill:'+d.id);log('Mataste a '+d.n+' (nv. '+m.lv+').');if(d.boss)bossKill(m,now);rollLoot(m,d.boss?3:1);rollLv(m);dirty=1}
function fin(now){const{ty,sk,i,e}=A,a=ACT[sk][i],cb=sk==='co'?count(a[2]):0;if(!stepAct(sk,i)){stopA();return}
 if(ty==='c'){A.left--;if(sk==='co'&&count(a[2])>cb&&Math.random()<BONUSP+.04*S.cfg){BL=A.left;dirty=1;save();stopA();startBonus(i);return}
  if(!hasIn(a[1])){dirty=1;save();stopA('Te quedaste sin materiales.');return}if(A.left<=0){dirty=1;save();stopA('Listo: terminaste la tanda.');return}}
 if(ty==='g'&&e.g){gain(sk,xv(ACT[sk][i])*4);earn(20+L(sk)*2);toast('✨ ¡Recurso dorado! Bonus de XP y oro');snd('rare')}if(ty==='g'){e.rt=now+{wc:9000,mi:6000,fi:5000}[sk];reseek(e,now);relocate(e)}
 dirty=1;save()}
function hitM(m,d,now,sk,mxv){if(!alive(m,now))return;m.lx=m.x;m.ly=m.y;m.hp-=d;m.fl=now+120;snd(d?'hit':'miss');const mx=d>=2&&d>=(mxv||maxHit());splat(m.x,m.y-m.d.h-6,d,mx?'#d8a020':null);if(mx){sp(m.x,m.y-m.d.h/2,'#ffe629',10,90,70,160);SHK=now+160}if(d)gain(sk||(wtype()==='g'?'mg':'cb'),d*xpMul(m));if(m.hp<=0){kill(m,now);if(A&&A.e===m)reseek(m,now)}}
const inVilla=(x,y)=>{const x0=Math.floor(x/BW)*BW;return Math.abs(x-(x0+210))<245&&Math.abs(y-770)<225};
function monHit(m,now){P.pjM=m;P.pj=now+4800;const d0=Math.random()<monAcc(m)?R(0,m.dm):0,d=d0?Math.max(0,d0-Math.round(pv('stone'))):0;P.hp-=d;splat(P.x,P.y-26,d);
 if(d){snd('hurt');HURT=now;if(d>=maxHp()*.25)SHK=now+200;if(Math.random()*100<pv('thorns'))hitM(m,2,now,'cb',99)}
 if(P.hp>0&&P.hp<maxHp()*.3&&pv('last')>0&&now>LSCD){P.hp=Math.min(maxHp(),P.hp+Math.ceil(maxHp()*pv('last')/100));LSCD=now+60000;toast('💖 ¡Segundo aliento!');snd('magic')}
 eat();if(P.hp<=0)die()}
function procs(m,d,hit,now){if(d>0){if(Math.random()*100<pv('life')){P.hp=Math.min(maxHp(),P.hp+1);splat(P.x,P.y-26,1,'#2a8a2a')}if(Math.random()*100<pv('bleed'))m.bleed={n:3,t:now+600};if(Math.random()*100<pv('stun'))m.nt=Math.max(m.nt||0,now)+1200}
 if(Math.random()*100<pv('double'))hitM(m,hit?R(1,maxHit()):0,now)}
function act(now){if(!A)return;
 if(A.ty==='f'){const m=A.e,dd=Math.hypot(P.x-m.x,P.y-m.y);if(dd>(wtype()==='m'?75:210)){if(!m.hunt)stopA();return}
  if(now>=A.ph){A.ph=now+A.ms;if(!(P.pjM&&P.pjM!==m&&now<P.pj&&alive(P.pjM,now)&&P.pjM.hunt)){P.pjM=m;P.pj=now+4800}const hit=Math.random()<hitChance(m),d0=hit?R(1,maxHit()):0,wt=wtype(),d1=d0&&Math.random()*100<pv('crit')?Math.round(d0*1.75):d0,d=d1&&m.hp<=m.mh*.25?Math.round(d1*(1+pv('exec')/100)):d1;
   if(wt==='m'){hitM(m,d,now);procs(m,d,hit,now)}else if(wt==='g'){const si=autoSpell();if(si>=0)fireSpell(si,m,now);else hitM(m,hit?1:0,now,'cb',1)}else{PJ.push({x:P.x+P.f*8,y:P.y-14,tx:m.x,ty:m.y-m.d.h/2,t0:now,t1:now+150,m,d,wt});snd('bow');procs(m,d,hit,now)}
   if(!A||A.e!==m)return}}
 else if(A.ty==='c'&&Math.hypot(P.x-A.e.x,P.y-A.e.y)>80)stopA();
}
function offline(el,sk,i){const a=ACT[sk][i],n=Math.min(600,Math.floor(Math.min(el,1.08e7)/dur(sk,a)));let k=0;const x0=S.xp[sk];while(k<n&&stepAct(sk,i,1))k++;
 if(k){const m=k+'x '+a[0]+', +'+fmt(S.xp[sk]-x0)+' XP';log('Mientras no estabas ('+Math.round(el/60000)+' min): '+m);toast('💤 Progreso offline<br>'+SK[sk][1]+' '+m,4000)}}
const cliff=(x,y)=>{const kb=Math.round(x/BW);return kb>=1&&kb<=4&&Math.abs(x-kb*BW)<14&&(y<712||y>826)},blk=(x,y)=>x<8||x>WW-8||y<30||y>WH-28||(x>=BW&&!S.boss[Math.floor(x/BW)-1])||cliff(x,y)||BLK.some(b=>x>b[0]&&x<b[1]&&y>b[2]&&y<b[3]);
function step(ax,ay){const nx=P.x+ax,ny=P.y+ay;if(!blk(nx,ny)){P.x=nx;P.y=ny}}
// fase del golpe (0..1): el impacto ocurre cuando llega a 1, justo al aplicar el daño o completar la acción
let CK=null,RUN=0,EN=60,MN=4,MNl=0,LSCD=0,PJ=[],STK=0,LASTX=null,BT=0,FREEC=0,MM=true,LD=0;const mnMax=()=>3+L('mg')+gs('mana')+2*S.mana2+(STF[S.eq.w]||0)*2,mreg=()=>.025+L('mg')*.0004+gs('mreg')+.006*S.mreg2+(STF[S.eq.w]||0)*.002+(S.buf.mreg>Date.now()?.12:0);const enMax=()=>60+L('ag')*1.6;
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
{id:'fire',n:'Llamarada',e:'🔥',lv:45,mp:12,xp:70,atk:1,max:22,r:{fire:1,air:1},col:'#ff8a3a'},{id:'arcane',n:'Explosión arcana',e:'🔮',lv:60,mp:20,xp:120,atk:1,max:32,r:{arc:1,fire:1},col:'#c8a0ff'}];
const hasRunes=r=>Object.entries(r).every(([k,v])=>(S.runes[k]||0)>=v),spMax=s=>s.max+Math.floor(L('mg')/15)+(wtype()==='g'?STF[S.eq.w]:0),xpMul=m=>5*Math.max(.7,1+.08*(m.lv-m.d.lv));
function autoSpell(){let b=-1;SPL.forEach((s,i)=>{if(s.atk&&L('mg')>=s.lv&&MN>=s.mp&&hasRunes(s.r))b=i});return b}
function spellTarget(){if(A&&A.ty==='f')return A.e;let b=null,bd=240;const now=performance.now();M.forEach(m=>{if(!alive(m,now))return;const d=Math.hypot(m.x-P.x,m.y-P.y);if(d<bd){bd=d;b=m}});return b}
function pay(s){if(FREEC)return;if(Math.random()*100<pv('echo')){log('✨ ¡Eco arcano! El hechizo no gastó nada.');return}MN-=s.mp;Object.entries(s.r).forEach(([k,v])=>S.runes[k]-=v)}
function fireSpell(i,m,now){const s=SPL[i];pay(s);const hit=Math.random()<spAcc(m),mx=spMax(s),d=hit?R(Math.ceil(mx*.5),mx):0;
 PJ.push({x:P.x+P.f*8,y:P.y-14,tx:m.x,ty:m.y-m.d.h/2,t0:now,t1:now+180,m,d,wt:'g',sk:'mg',mxv:mx,col:s.col});snd('magic');inc('cast');gain('mg',s.xp);dirty=1}
function cast(i,free){const s=SPL[i],now=performance.now();if(L('mg')<s.lv){log('Necesitas Magia nivel '+s.lv+'.');return false}if(!free&&MN<s.mp){log('Te falta maná.');return false}if(!free&&!hasRunes(s.r)){log('Te faltan runas: las sueltan los monstruos.');return false}
 FREEC=free?1:0;
 if(s.atk){const m=spellTarget();if(!m){FREEC=0;log('No hay ningún enemigo cerca para lanzar el hechizo.');return false}if(!A||A.e!==m){stopA();P.g=null;startF(m,now)}P.f=m.x>=P.x?1:-1;fireSpell(i,m,now);FREEC=0;log('Lanzas '+s.n+(free?' (pergamino)':'')+'.');save();return true}
 pay(s);FREEC=0;const t=Date.now()+60000;
 if(s.id==='heal')P.hp=Math.min(maxHp(),P.hp+8+Math.floor(L('mg')/2));else if(s.id==='haste')S.buf.spd=Math.max(S.buf.spd||0,t);else if(s.id==='skin')S.buf.def=t;else if(s.id==='recall'){stopA();P.g=P.mv=null;P.x=curB*BW+200;P.y=750,FD=performance.now()}else if(s.id==='wis')S.buf.xp=Math.max(S.buf.xp||0,t);
 sp(P.x,P.y-16,'#c8a0ff',14,80,70,120);snd('magic');inc('cast');gain('mg',s.xp);log('Lanzas '+s.n+(free?' (pergamino)':'')+'.');dirty=1;save();return true}
function tpv(sk,id){const it=TOOLT[S.eq[sk]];let t=0;if(it&&it.pa)it.pa.forEach(p=>{if(p.id===id)t+=p.v});return t}
function setPer(np){const now=performance.now(),ph=swPh(now);A.per=np;A.t0=now-ph*np;A.lp=ph}
function hitMul(now){if(A.ty!=='g')return 1;const sk=A.sk;let m=1;
 if(A.fr&&now>A.fr){A.fr=0;setPer(A.base)}
 if(!A.fr&&Math.random()*100<tpv(sk,'frenzy')){A.fr=now+5000;setPer(A.base/2);sp(A.e.x,A.e.y-16,'#ffd100',14,80,70,160);snd('rare');log('<span style="color:#ffd100">⚡ ¡Frenesí! Velocidad x2 durante 5 s.</span>')}
 if(Math.random()*100<tpv(sk,'precise')){m=2;sp(A.e.x,A.e.y-12,'#ffffff',8,60,50,120)}return m}
function actLabel(){const sk=A.sk,a=ACT[sk][A.i],v=sk==='sm'?(String(a[2]).startsWith('b_')?'Fundir':'Forjar'):({wc:'Talar',mi:'Minar',fi:'Pescar',co:'Cocinar',cr:'Fabricar',es:'Esculpir',ins:'Inscribir'}[sk]||'Trabajar');return (TOOLS[sk]?v+', '+TOOLS[sk][0].toLowerCase()+' '+tn(sk,S.tool[sk]):v+': '+a[0])+(A.fr?' ⚡':'')}
function swPh(now){if(A.ty==='f')return Math.max(0,Math.min(1,1-(A.ph-now)/(A.ms||1800)));const p=A.per||900;return(((now-A.t0)%p)+p)%p/p}
const AMB=[];let AT=0;
function ambient(now,dt){const t=now/1000,day=Math.max(0,sunS(t)),k=curB,sp1=o=>{if(AMB.length<90)AMB.push(o)};
 if(now-AT>130){AT=now;const x=cx+R(-20,W+20),y=cy+R(-20,H+20);
  if(k===0){if(day>.3&&Math.random()<.45)sp1({k:'bf',x,y,vx:R(-8,8),vy:R(-6,6),l:7,c:['#ffd24a','#ff8ac8','#8ad8ff'][R(0,2)],ph:Math.random()*6});if(Math.random()<.3)sp1({k:'lf',x,y:cy-8,vx:R(8,22),vy:R(10,22),l:7,c:'#8ac85a'});if(day<.15&&Math.random()<.6)sp1({k:'ff',x,y,vx:R(-6,6),vy:R(-6,6),l:7,ph:Math.random()*6})}
  else if(k===1){if(Math.random()<.5)sp1({k:'lf',x,y:cy-8,vx:R(6,20),vy:R(12,26),l:8,c:['#d8802a','#8ac85a','#c8b030'][R(0,2)]});if(day<.2&&Math.random()<.6)sp1({k:'ff',x,y,vx:R(-6,6),vy:R(-6,6),l:7,ph:Math.random()*6})}
  else if(k===2){if(Math.random()<.18)sp1({k:'fog',x:cx-60,y:cy+R(0,H),vx:R(10,22),vy:R(-2,2),l:14,r:R(50,95)});if(day<.3&&Math.random()<.6)sp1({k:'ff',x,y,vx:R(-5,5),vy:R(-5,5),l:7,ph:Math.random()*6})}
  else if(k===3){for(let i=0;i<3;i++)sp1({k:'sn',x:cx+R(-30,W+60),y:cy-8,vx:R(-8,4),vy:R(28,50),l:H/30})}
  else{if(Math.random()<.7)sp1({k:'em',x,y:cy+H+6,vx:R(-8,8),vy:-R(22,50),l:5,c:Math.random()<.5?'#ff8a2a':'#ffd070'});if(Math.random()<.3)sp1({k:'as',x,y:cy-6,vx:R(-6,6),vy:R(14,26),l:7})}}
 for(let i=AMB.length-1;i>=0;i--){const p=AMB[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt;if(p.k==='bf'||p.k==='ff'){p.vx+=Math.sin(t*3+p.ph)*20*dt;p.vy+=Math.cos(t*2.3+p.ph)*20*dt}if(p.l<=0||p.x<cx-120||p.x>cx+W+120||p.y<cy-120||p.y>cy+H+120)AMB.splice(i,1)}}
function dAmb(now,late){const t=now/1000;if(late)dRain();ctx.save();AMB.forEach(p=>{if(late!==(p.k==='ff'))return;const a=Math.min(1,p.l/1.2);
 if(p.k==='bf'){const fl=Math.sin(t*14+p.ph)>0?3:1;ctx.globalAlpha=.9*a;Rc(p.c,p.x-fl,p.y,fl,2);Rc(p.c,p.x+1,p.y,fl,2)}
 else if(p.k==='lf'){ctx.globalAlpha=.85*a;Rc(p.c,p.x,p.y,2,2);Rc(p.c,p.x+1,p.y+1,2,1)}
 else if(p.k==='ff'){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=(.4+.4*Math.sin(t*3+p.ph))*a;ctx.fillStyle='#ffe870';ctx.beginPath();ctx.arc(p.x,p.y,3,0,7);ctx.fill();ctx.globalCompositeOperation='source-over';ctx.globalAlpha=a;Rc('#fff8c0',p.x,p.y,1,1)}
 else if(p.k==='fog'){ctx.globalAlpha=.07*a;ctx.fillStyle='#cfe0d0';ctx.beginPath();ctx.ellipse(p.x,p.y,p.r,p.r*.35,0,0,7);ctx.fill()}
 else if(p.k==='sn'){ctx.globalAlpha=.85*a;Rc('#fff',p.x,p.y,2,2)}
 else if(p.k==='em'){ctx.globalAlpha=a;Rc(p.c,p.x,p.y,2,2);ctx.globalAlpha=.25*a;Rc('#ff8a2a',p.x-1,p.y-1,4,4)}
 else if(p.k==='as'){ctx.globalAlpha=.6*a;Rc('#9a8a8a',p.x,p.y,1,2)}});ctx.restore()}
let ZC=-1,ZB=null;const ZT={};
function zoneCheck(now){let b=-1,ba=1e12;ZS.forEach((z,i)=>{if(z.k!==curB||P.x<z.r[0]||P.x>z.r[1]||P.y<z.r[2]||P.y>z.r[3])return;const a=(z.r[1]-z.r[0])*(z.r[3]-z.r[2]);if(a<ba){ba=a;b=i}});
 if(b!==ZC){ZC=b;if(b>=0&&now-(ZT[b]||-1e9)>8000){ZT[b]=now;ZB={t:ZS[b].t,t0:now}}}}
// ===== v29: clima, efectos de pantalla, decoración animada, sprites =====
let WX={t:'',end:0,next:0,nl:0},WXD=0,FL=0,THU=0,FD=0,XD=[],XN=0,BAN=null;const RN=[],RP=[],MMC=[];
SND.thunder=()=>{noise(1.1,.3,160,'lowpass');noise(.6,.18,420,'lowpass')};
function mmk(k){const c=document.createElement('canvas');c.width=140;c.height=90;const q=c.getContext('2d');q.imageSmoothingEnabled=true;q.drawImage(bgc,k*BW,0,BW,WH,0,0,140,90);return c}
function banner(t,sub,c,dur){BAN={t,sub,c,t0:performance.now(),dur}}
function weather(now,dt){const k=curB;
 if(k>=3&&WX.t){WX.t='';WX.end=0}
 if(!WX.next)WX.next=now+R(40000,90000);
 if(now>WX.next){WX.next=now+R(60000,130000);if(!WX.t){const p=[.3,.35,.55,0,0][k];if(Math.random()<p){WX.t=(k===2&&Math.random()<.6)?'storm':'rain';WX.end=now+R(45000,90000);WX.nl=now+R(3000,8000);log(WX.t==='storm'?'⛈️ Se acerca una tormenta.':'🌧️ Empieza a llover.')}}}
 if(WX.t&&now>WX.end){log('☀️ Deja de llover.');WX.t=''}
 const tg=WX.t==='storm'?.36:WX.t==='rain'?.18:0;WXD+=(tg-WXD)*Math.min(1,dt*.7);
 if(WX.t){const n=Math.max(1,Math.round((WX.t==='storm'?5:3)*dt*60));for(let i=0;i<n;i++)if(RN.length<200)RN.push({x:cx+R(-60,W+60),y:cy-10,vx:-70,vy:R(420,520),l:1.2});if(Math.random()<.6&&RP.length<36)RP.push({x:cx+R(0,W),y:cy+R(0,H),l:.7})}
 for(let i=RN.length-1;i>=0;i--){const r=RN[i];r.x+=r.vx*dt;r.y+=r.vy*dt;r.l-=dt;if(r.l<=0)RN.splice(i,1)}
 for(let i=RP.length-1;i>=0;i--){RP[i].l-=dt;if(RP[i].l<=0)RP.splice(i,1)}
 if(WX.t==='storm'&&now>WX.nl){WX.nl=now+R(6000,15000);FL=.6;THU=now+R(350,900)}
 if(THU&&now>THU){THU=0;snd('thunder')}
 FL=Math.max(0,FL-dt*2.2);
 ST.forEach(e=>{if(e.id==='furnace'&&Math.abs(e.x-P.x)<420&&Math.abs(e.y-P.y)<320&&Math.random()<dt*2.5)sp(e.x+10,e.y-42,'#9a9a9a',1,8,16,-8)})}
function dRain(){if(!RN.length&&!RP.length)return;ctx.save();ctx.globalAlpha=.5;ctx.strokeStyle='#bcd8ff';ctx.lineWidth=1;ctx.beginPath();RN.forEach(r=>{ctx.moveTo(r.x,r.y);ctx.lineTo(r.x+r.vx*.025,r.y+r.vy*.025)});ctx.stroke();ctx.strokeStyle='#d8ecff';RP.forEach(p=>{const a=p.l/.7;ctx.globalAlpha=.55*a;ctx.beginPath();ctx.ellipse(p.x,p.y,(1-a)*7+1,(1-a)*3+.5,0,0,7);ctx.stroke()});ctx.restore()}
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
function dDecor(t,now){const nd=sunS(t)<-.05;for(let k=0;k<5;k++){const x0=k*BW;if(Math.abs(x0+200-cx-W/2)>W/2+330)continue;
 const fx=x0+258;Rc('#5a3a1a',fx,556,2,26);for(let i=0;i<10;i++)Rc(['#c03030','#2a6aa0','#4a8a3a','#8a3aaa','#c03030'][k],fx+2+i,558+Math.round(Math.sin(t*5+i*.6)*1.5),1,7);
 if(nd){ctx.save();ctx.globalAlpha=.9;[[221,604],[288,604],[327,614],[346,614],[65,608],[108,608]].forEach(([wx,wy])=>Rc('#ffd070',x0+wx,wy,7,7));ctx.restore()}}}
function dSpr(m,d,x,y,c,w,h,lk,t,now){const f=m.f||1,mvn=now-(m.mv||0)<250,lg=mvn?Math.round(Math.sin(t*12+m.hx)*1.5):0;Sd(x-w/2,m.y-1,w,3);
 if(d.id==='vaca'){Rc(c,x-10,y-12,20,9);Rc('#2a2a2a',x-6,y-11,4,3);Rc('#2a2a2a',x+2,y-9,5,3);Rc('#f0a0a0',x-3,y-4,4,2);
  for(let i=0;i<4;i++)Rc('#d8d8d8',x-9+i*6,y-4,2,4+(i%2?lg:-lg));
  Rc(c,x+f*9-3,y-14,7,7);Rc('#2a2a2a',x+f*11-1,y-12,2,2);Rc('#f0a0a0',x+f*9+(f>0?1:-5),y-9,5,3);Rc('#e8e0c0',x+f*9-3,y-15,2,2);Rc('#e8e0c0',x+f*9+2,y-15,2,2);
  const tw=Math.round(Math.sin(t*4+m.hx)*2);Rc('#d0d0d0',x-f*11,y-11+tw,2,5);Rc('#2a2a2a',x-f*11,y-7+tw,2,2)}
 else if(d.id==='gallina'){const pk=Math.sin(t*3+m.hx)>.65?3:0;Rc(c,x-4,y-8,8,6);Rc('#e8d098',x-f*5,y-9,3,4);Rc(c,x+f*4-1,y-11+pk,4,4);Rc('#d22',x+f*4,y-12+pk,2,2);Rc('#f0a020',x+f*7-1,y-9+pk,2,1);Rc('#111',x+f*5,y-10+pk,1,1);Rc('#f0a020',x-2,y-2,1,2+lg);Rc('#f0a020',x+1,y-2,1,2-lg)}
 else{Rc('#00000044',x-w/3,y-h*.3+lg,w/4,h*.3);Rc('#00000044',x+w/12,y-h*.3-lg,w/4,h*.3);Rc(c,x-w/2,y-h,w,h*.75);Rc('#d22',x-w/4+lk,y-h*.8,2,2);Rc('#d22',x+w/4-2+lk,y-h*.8,2,2)}}
function upd(dt,now){zoneCheck(now);ambient(now,dt);weather(now,dt);if(now-BT>1000){BT=now;if(M.some(m=>m.d.boss&&!alive(m,now)))dirty=1}const bi=Math.min(4,Math.max(0,P.x/BW|0));if(bi!==curB){curB=bi;if(bi+1>(S.st.bio||0)){S.st.bio=bi+1;chk()}toast(BI[bi].ic+' <b>'+BI[bi].n+'</b><br>Nivel recomendado: '+BI[bi].lv+'+')}
 let dx=(K.r|0)-(K.l|0),dy=(K.d|0)-(K.u|0);
 if(dx||dy){if(P.g||P.mv||A||CK){P.g=P.mv=null;stopA();CK=null}}
 else{const tg=P.g?P.g.e:P.mv;if(tg){const ex=tg.x-P.x,ey=tg.y-P.y,d=Math.hypot(ex,ey);
  if(d>(P.g?(P.g.e.d?(wtype()!=='m'?120:24):P.g.e.t==='fi'?38:24):3)){const wp=bridgeWp(tg),wx=wp?wp.x-P.x:ex,wy=wp?wp.y-P.y:ey,wd=Math.hypot(wx,wy)||1;dx=wx/wd;dy=wy/wd}else if(P.g){const e=P.g.e;P.g=null;engage(e,now)}else P.mv=null}}
 P.mvg=0;if(dx||dy){const l=Math.hypot(dx,dy);dx/=l;dy/=l;const run=RUN&&EN>0,sv=95*(1+pv('swift')/100)*(1+.05*S.trv)*(S.buf.spd>Date.now()?1.35:1)*(run?1.3+L('ag')*.003:1);const ox=P.x,oy=P.y;step(dx*sv*dt,0);step(0,dy*sv*dt);P.mvg=1;if(P.g&&Math.hypot(P.x-ox,P.y-oy)<.02)STK+=dt;else STK=0;if(STK>.4&&P.g){const e=P.g.e;if(Math.hypot(e.x-P.x,e.y-P.y)<90){P.g=null;STK=0;engage(e,now)}}if(run){S.agd=(S.agd||0)+sv*dt;if(S.agd>130){S.agd=0;gain('ag',5+L('ag')*.35)}}if(dx)P.f=dx>0?1:-1;P.w+=dt*12*(RUN&&EN>0?1.5:1)}
 if(P.mvg&&now-LD>(RUN&&EN>0?90:260)){LD=now;sp(P.x-P.f*3,P.y-1,['#c8b890','#a89870','#7a8a6a','#e8f0f8','#6a5050'][curB],RUN&&EN>0?3:1,14,12,20)}
 if(P.mvg&&RUN&&EN>0){EN-=dt*6;if(EN<=0){EN=0;RUN=0;runBtn()}}else EN=Math.min(enMax(),EN+dt*(2+L('ag')*.05));MN=Math.min(mnMax(),MN+dt*mreg());if(TB==='mg'&&Math.floor(MN)!==MNl){MNl=Math.floor(MN);dirty=1}PJ=PJ.filter(p=>{if(now>=p.t1){hitM(p.m,p.d,now,p.sk,p.mxv);return false}return true});if(CK)cookUpd(dt,now);
 act(now);
 if(!(A&&A.ty==='f')&&now-lreg>12000){lreg=now;if(P.hp<maxHp()){P.hp++;dirty=1}}
 M.forEach(m=>{if(!alive(m,now))return;
  if(m.bleed&&now>=m.bleed.t){hitM(m,1,now,'cb',99);if(!alive(m,now))return;m.bleed.t=now+600;if(--m.bleed.n<=0)m.bleed=null}
  const dx=P.x-m.x,dy=P.y-m.y,dp=Math.hypot(dx,dy),inV=inVilla(P.x,P.y),busy=P.pjM&&P.pjM!==m&&now<P.pj&&alive(P.pjM,now)&&P.pjM.hunt;
  if(m.d.ag&&!m.hunt&&now>m.ag0&&dp<85&&!inV&&!busy&&P.hp>0&&L('cb')*.8<m.lv*2){m.hunt=1;m.lx=null;m.nt=now+900;m.ag0=now+10000;log('<span style="color:#ff6a5a">¡'+m.d.n+' nv.'+m.lv+' te ataca!</span>');if(A&&A.ty!=='f')stopA()}
  if(m.hunt){const lx=m.lx==null?m.hx:m.lx,ly=m.lx==null?m.hy:m.ly;
   if(P.hp<=0||inV||Math.hypot(m.x-lx,m.y-ly)>(m.d.boss?260:m.d.ag?190:140)||dp>420){m.hunt=0;m.lx=null;m.ag0=now+6000;return}
   if(dp>40){const sp2=(m.d.ag?58:45)*dt,nx=m.x+dx/dp*sp2,ny=m.y+dy/dp*sp2;if(!inVilla(nx,ny)){m.x=nx;m.y=ny;m.mv=now;m.f=dx>=0?1:-1}}else if(!busy){if(now>=m.nt){m.nt=now+(m.d.as||2400);monHit(m,now)}if(!A&&!P.g&&!P.mv&&!(K.l||K.r||K.u||K.d))startF(m,now)}return}
  if(now>m.wt){m.wt=now+R(2000,5000);m.tx=m.hx+R(-16,16);m.ty=m.hy+R(-12,12)}
  const ex=m.tx-m.x,ey=m.ty-m.y,d=Math.hypot(ex,ey);if(d>2){const sp3=d>60?55:18,nx=m.x+ex/d*sp3*dt,ny=m.y+ey/d*sp3*dt;if(!inVilla(nx,ny)){m.x=nx;m.y=ny;m.mv=now;m.f=ex>=0?1:-1}}});
 if(A){const ph=swPh(now),imp=A.lp!=null&&ph<A.lp-.4;A.lp=ph;if(imp&&A.ty!=='f'){const e=A.e,k=A.sk;snd(k);
  if(k==='wc')sp(e.x,e.y-26,'#5ab04a',2,30,10,60);else if(k==='mi')sp(e.x,e.y-10,'#ffd27a',4,60,40,160);else if(k==='sm')sp(e.x,e.y-8,'#ff9a2a',5,70,50,200);
  else if(k==='fi')sp(e.x,e.y,'#cfe8ff',3,30,30,100);else if(k==='co')sp(e.x,e.y-14,'#aaa',2,10,25,-10);else if(k==='cr'||k==='es')sp(e.x,e.y-10,'#d8c9a3',2,30,20,80);else if(k==='ins')sp(e.x,e.y-18,'#ffe8a0',4,60,60,-20);A.pr+=A.amt*hitMul(now);if(A.pr>=1){A.pr=Math.min(A.pr-1,.99);fin(now)}}}
 parts.forEach(p=>{p.x+=p.vx*DT;p.y+=p.vy*DT;p.vy+=p.g*DT;p.l-=DT*1.1});parts=parts.filter(p=>p.l>0)}

// ---------- dibujo ----------
const cv=$('#c'),ctx=cv.getContext('2d'),W=640,H=400,bgc=document.createElement('canvas');bgc.width=WW;bgc.height=WH;
const lc=document.createElement('canvas');lc.width=W;lc.height=H;const lx=lc.getContext('2d'),DAYLEN=360,dayP=t=>(t/DAYLEN+.33)%1,sunS=t=>Math.sin(2*Math.PI*(dayP(t)-.25));
let SHD={dx:0,dy:2,a:.26};
function Sd(x,y,w,h){const q=SHD;if(q.a<.02)return;ctx.save();ctx.globalAlpha=q.a;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(Math.round(x+w/2+q.dx/2),Math.round(y+h/2+q.dy/2),w/2+Math.abs(q.dx)/2,h/2+Math.abs(q.dy)/2+1,0,0,7);ctx.fill();ctx.restore()}
const Rc=(c,x,y,w,h)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)};
const T=(s,x,y,c)=>{ctx.font='16px VT323, monospace';ctx.textAlign='center';ctx.fillStyle='#000';ctx.fillText(s,x+1,y+1);ctx.fillStyle=c;ctx.fillText(s,x,y)};
(function(){const g=bgc.getContext('2d');let OX=0,OY=0;const f=(c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(x+OX,y+OY,w,h)},
 el=(c,x,y,rx,ry,a)=>{g.globalAlpha=a;g.fillStyle=c;g.beginPath();g.ellipse(x+OX,y+OY,rx,ry,0,0,7);g.fill();g.globalAlpha=1};
 BI.forEach((b,k)=>{const x0=k*BW;OX=0;OY=0;
  const nsp=Math.round(BW*WH/840);if(!GR){f(b.g[0],x0,0,BW,WH);for(let i=0;i<nsp;i++)f(b.g[1+i%2],x0+R(0,BW-2),R(0,WH-2),2,2)} // GR: el pasto base lo pinta src/ground.js
  const patch=(cx,cy,rx,ry,c,n,a)=>{for(let i=0;i<n;i++)el(c,x0+cx+R(-rx*.5,rx*.5),cy+R(-ry*.5,ry*.5),rx*(.45+Math.random()*.55),ry*(.45+Math.random()*.55),a||.07)};
  patch(210,180,180,110,'#06260f',7);patch(240,1260,230,130,'#f0f8d0',7,.06);patch(810,925,240,90,'#5a3a1a',7);patch(1520,730,260,170,'#000000',7,.06);patch(2090,750,130,160,'#000000',5,.07);patch(820,690,150,100,'#b8f090',5,.05);
  [[430,640],[910,1110],[1390,1600]].slice(0,[3,2,2,1,1][k]).forEach(([a,c])=>patch((a+c)/2,125,(c-a)/2+30,60,'#000000',4,.07));
  const gt=b.g[2],FLW=[['#e8d84a','#fff','#ff8ab0'],['#a8d8ff','#fff','#d8a0ff'],['#c8d86a','#9ad89a'],['#aee4ff','#fff'],['#ff7a2a','#ffb040']][k];
  if(!GR)for(let i=0;i<nsp/7;i++){const x=x0+R(4,BW-4),y=R(34,WH-30);f(gt,x,y,1,3);f(gt,x+2,y+1,1,2);f(gt,x-2,y+1,1,2)}
  if(!GR)for(let i=0;i<BW*WH/16000;i++){const cx=x0+R(20,BW-20),cy=R(40,WH-40);for(let j=R(3,6);j>0;j--)f(FLW[R(0,FLW.length-1)],cx+R(-12,12),cy+R(-8,8),2,2)}
  const fence=(x,y,w,h,c)=>{f(c,x,y,w,3);f(c,x,y+h,w,3);f(c,x,y,3,h);f(c,x+w,y,3,h);for(let i=0;i<=w;i+=18){f('#5a3a1a',x+i,y-4,3,9);f('#5a3a1a',x+i,y+h-4,3,9)}for(let i=0;i<=h;i+=18){f('#5a3a1a',x-1,y+i,3,3);f('#5a3a1a',x+w-1,y+i,3,3)}},
   rock=(x,y,w,h,c)=>{f('#00000033',x,y+h-2,w,3);f(c,x,y,w,h);f('#ffffff33',x+1,y+1,w-2,2)},pil=(x,y,h)=>{f('#00000033',x-2,y+h-1,14,3);f('#8a8a8a',x,y,10,h);f('#a0a0a0',x-2,y,14,3);f('#6a6a6a',x+7,y+3,3,h-3)},
   tomb=(x,y)=>{f('#00000033',x,y+14,12,3);f('#9a9aa8',x,y,12,15);f('#b0b0bc',x+1,y-3,10,4);f('#6a6a78',x+5,y+3,2,7);f('#6a6a78',x+3,y+5,6,2)},
   tent=(x,y,c)=>{for(let i=0;i<16;i++)f(c,x+16-i,y-16+i,2*i+1,1);f('#2a1a10',x+13,y-6,6,6)},bush=(x,y)=>{f('#1f5a2a',x,y,22,12);f('#2f7a3a',x+3,y-4,16,8)},
   pit=(x,y)=>{f('#333',x,y,22,8);f('#5a3a1a',x+2,y-2,18,4);f('#ff8a2a',x+8,y-6,6,6)};
  const px=x0+436,hx=x0+940,lx=x0+1190;
  // ---- pasto / rancho (desplazado al este y al sur)
  OX=250;OY=300;
  if(k===0){fence(px,292,270,184,'#b08a5a');f('#a03a2a',px+280,282,66,46);f('#00000033',px+280,326,66,3);f('#6a2a1a',px+274,268,78,16);f('#7a2a1a',px+286,256,54,14);f('#5a2a1a',px+302,300,22,28);f('#e8e8e8',px+302,300,22,2);f('#e8e8e8',px+312,300,2,28);
   f('#d8b84a',px+8,300,18,12);f('#b89a3a',px+8,308,18,4);f('#d8b84a',px+30,304,14,10);f('#6b4a2a',px+110,300,40,9);f('#4a7aff',px+112,302,36,4);f('#c8a070',px+190,420,40,26);f('#8a5a3a',px+184,412,52,10);f('#3a2a1a',px+204,432,10,14)}
  else if(k===1){f('#5a3a1a',px+10,310,70,10);f('#7a5a3a',px+10,310,70,3);f('#5a3a1a',px+120,430,60,10);for(let i=0;i<14;i++){const mx=px+R(0,260),my=300+R(0,170);f('#fff',mx+1,my+3,2,4);f('#d03030',mx-1,my,6,4)}bush(px+4,440);bush(px+210,300);bush(px+240,450)}
  else if(k===2){f('#2f5a3a',px+20,320,170,100);f('#3a6a4a',px+28,326,154,88);for(let i=0;i<9;i++)f('#6ab04a',px+30+R(0,140),330+R(0,70),8,5);for(let i=0;i<14;i++){const rx=px+15+R(0,180),ry=315+R(0,110);f('#8aa04a',rx,ry,2,14);f('#6a5a2a',rx-1,ry-2,4,4)}}
  else if(k===3){fence(px,292,270,184,'#8a8a98');for(let i=0;i<5;i++)f('#fff',px+R(0,240),300+R(0,160),R(30,50),6);f('#aee4ff',px+240,310,6,16);f('#d8f4ff',px+244,306,3,10)}
  else{f('#ff5a1a',px+10,330,150,70);f('#ffb040',px+20,338,130,4);for(let i=0;i<6;i++)f('#ffd070',px+R(10,150),345+R(0,50),R(4,10),2);for(let i=0;i<8;i++)rock(px+R(0,220),300+R(0,160),R(10,18),R(8,12),'#2a1a1a')}
  // ---- zona hostil (más lejos)
  OX=500;OY=300;
  if(k===0){const ruins=(bx,by)=>{pil(bx+10,by+6,32);pil(bx+60,by-2,48);pil(bx+140,by+12,26);rock(bx+8,by+146,76,12,'#7a7a7a');rock(bx+130,by+146,64,12,'#7a7a7a');rock(bx+84,by+152,26,8,'#6a6a6a');for(let i=0;i<7;i++)f('#8a8a8a',bx+R(0,200),by+R(0,150),R(3,6),R(3,5));pit(bx+96,by+158);f('#6b4a2a',bx+30,by+36,6,28);f('#5ab04a',bx+26,by+28,14,10);f('#d22',bx+29,by+31,2,2);f('#d22',bx+35,by+31,2,2)};
   ruins(x0+850,250);ruins(x0+1000,270);ruins(x0+900,430)}
  else if(k===1){rock(hx,300,150,46,'#5a5a6a');f('#10101a',hx+50,320,46,26);rock(hx+130,330,40,30,'#6a6a7a');for(let i=0;i<8;i++)f('#e8e0d0',hx+R(0,190),400+R(0,60),6,2)}
  else if(k===2){fence(hx-6,296,206,178,'#4a4a52');for(let i=0;i<7;i++)tomb(hx+14+i*26+R(0,6),i%2?330:395);f('#3a2a1a',hx+170,320,5,34)}
  else if(k===3){tent(hx+20,350,'#8a6a4a');tent(hx+120,400,'#7a5a3a');for(let i=0;i<6;i++)f('#e8e0d0',hx+R(0,200),430+R(0,40),7,2);pit(hx+100,455)}
  else{f('#3a1a4a',hx+30,360,120,80);f('#9a4aca',hx+36,366,108,2);f('#9a4aca',hx+36,436,108,2);f('#c8a0ff',hx+84,396,10,10);for(let i=0;i<6;i++){const sx=hx+R(0,190),sh=R(30,56);f('#1a1020',sx,300+R(0,40),8,sh);f('#3a2a4a',sx+2,300,2,sh)}}
  // ---- guarida del jefe (aún más lejos)
  OX=800;OY=300;
  if(k===0){fence(lx,290,200,300,'#6b4a2a');tent(lx+20,380,'#6a5a3a');tent(lx+120,350,'#5a4a2a');tent(lx+30,560,'#6a4a2a');tent(lx+130,540,'#5a3a1a');pit(lx+95,470);pit(lx+40,455);for(let i=0;i<8;i++)f('#e8e0d0',lx+R(10,190),300+R(0,280),7,2);f('#a02a2a',lx+150,300,3,26);f('#c03030',lx+153,302,16,12);f('#6b4a2a',lx+60,420,70,8);f('#4a3a2a',lx+84,402,22,20)}
  else if(k===1){rock(lx+10,310,150,60,'#4a4a5a');f('#10101a',lx+60,340,60,30);rock(lx+120,430,60,40,'#5a5a6a');for(let i=0;i<10;i++)f('#e8e0d0',lx+R(0,190),400+R(0,160),6,2);f('#5a3a1a',lx+20,470,70,10);f('#5a3a1a',lx+100,520,60,10)}
  else if(k===2){for(let i=0;i<6;i++)tomb(lx+14+(i%3)*58+R(0,8),330+(i/3|0)*90);f('#cfcfc0',lx+84,440,26,40);f('#e8e8d8',lx+88,432,18,10);f('#8a8a80',lx+80,478,34,6)}
  else if(k===3){for(let i=0;i<7;i++){const sx=lx+R(10,180),sh=R(24,50);f('#aee4ff',sx,330+R(0,200),7,sh);f('#e8f8ff',sx+2,330,2,sh)}rock(lx+40,420,110,50,'#7a8a9a');for(let i=0;i<6;i++)f('#fff',lx+R(0,180),320+R(0,250),R(30,50),6)}
  else{f('#ff5a1a',lx+20,330,150,60);f('#ffb040',lx+30,338,130,4);for(let i=0;i<8;i++){const sx=lx+R(0,190),sh=R(30,56);f('#1a1020',sx,320+R(0,40),8,sh);f('#3a2a4a',sx+2,320,2,sh)}f('#3a1a4a',lx+50,440,100,70);f('#9a4aca',lx+56,446,88,2);f('#c8a0ff',lx+94,470,10,10)}
  OX=0;OY=0;
  if(k===4)for(let i=0;i<90;i++)f('#ff7a2a',x0+R(400,2200),R(100,1300),R(6,18),2);
  // ---- caminos con bordes y guijarros
  const rc=['#b59a66','#9a8a5a','#8a8a6a','#cfcfcf','#6a5050'][k],sc=['#a89f8f','#9a9484','#8c8c84','#b8b4aa','#5a4a4a'][k],rf=['#b03a2a','#2a6aa0','#4a7a3a','#7a3a8a','#a03030'][k],ed=['#8a7a50','#7a6a40','#6a6a50','#a0a0a0','#4a3a3a'][k];
  const road=(x,y,w,h)=>{f(rc,x,y,w,h);if(w>h){f(ed,x,y,w,2);f(ed,x,y+h-2,w,2);for(let i=0;i<w/12;i++)f(ed,x+R(0,w),y+R(3,Math.max(4,h-4)),2,1)}else{f(ed,x,y,2,h);f(ed,x+w-2,y,2,h);for(let i=0;i<h/12;i++)f(ed,x+R(3,Math.max(4,w-4)),y+R(0,h),2,1)}};
  {const RR=[[x0,752,BW,34],[x0+186,60,22,700],[x0+196,214,1420,10],[x0+186,912,22,230],[x0+700,786,22,396],[x0+1450,786,22,334]];if(RD)RD.draw(g,k,RR,rc,ed,b.g);else RR.forEach(r=>road(...r))} // RD: caminos por píxel (src/roads.js)
  // ---- aldea
  OY=300;
  f(sc,x0+40,350,340,262);f('#00000022',x0+40,350,340,3);f('#00000022',x0+40,609,340,3);for(let i=0;i<50;i++)f('#00000018',x0+44+R(0,330),354+R(0,250),6,4);
  const H=(x,y,w,h)=>{f('#d8c9a3',x,y,w,h);f('#00000022',x,y+h-4,w,4);f(rf,x-6,y-12,w+12,12);f('#00000033',x-6,y-2,w+12,2);f(rf,x+6,y-18,w-12,6);f('#6b4a2a',x+w/2-4,y+h-14,8,14);f('#6a8ab0',x+5,y+8,7,7);f('#6a8ab0',x+w-12,y+8,7,7)};
  H(x0+216,296,84,40);H(x0+322,306,36,30);H(x0+60,300,60,36);
  f('#888',x0+52,484,16,12);f('#2a5a9a',x0+55,486,10,6);f('#6b4a2a',x0+50,472,2,13);f('#6b4a2a',x0+66,472,2,13);f('#a05a3a',x0+48,468,22,4);
  f('#8a6a3a',x0+322,490,14,12);f('#6b4a2a',x0+338,494,12,10);f('#333',x0+120,432,2,16);f('#ffe629',x0+119,428,4,4);f('#333',x0+270,432,2,16);f('#ffe629',x0+269,428,4,4);
  f('#7a4a2a',x0+50,528,172,14);f('#5a3a1a',x0+50,540,172,3);f('#5a3a1a',x0+54,542,4,34);f('#5a3a1a',x0+218,542,4,34);f('#7a4a2a',x0+262,540,76,10);f('#5a3a1a',x0+264,550,4,26);f('#5a3a1a',x0+332,550,4,26);
  // ---- agua: estanque, río, lago y puente
  if(WT)WT.draw(g,k,x0,b,PD.filter(p=>p.x>=x0&&p.x<x0+BW)); // WT: agua por píxel (src/water.js); con ?old se usa el código antiguo de abajo
  else{
  OY=500;
  f('#d8c68a',x0+472,672,516,206);f(b.w,x0+480,680,500,190);for(let i=0;i<36;i++)f(i%2?'#8a8a80':'#a8a090',x0+R(474,986),(i%2?672:874)+R(-2,3),R(2,4),2);for(let i=0;i<8;i++)f('#3a8a4a',x0+R(500,950),700+R(0,150),5,3);
  f('#d8c68a',x0+32,732,448,76);f(b.w,x0+40,738,436,64);
  OX=300;if(k===0){f('#d8c68a',x0+996,616,342,194);f(b.w,x0+1004,622,326,176);f('#8a6a3a',x0+1100,606,8,26);f('#8a6a3a',x0+1100,606,40,5)}OX=0;
  f('#8a6a3a',x0+232,728,76,80);for(let i=0;i<8;i++)f(i%2?'#7a5a2a':'#9a7a4a',x0+236+i*9,730,8,76);f('#5a3a1a',x0+232,727,76,3);f('#5a3a1a',x0+232,806,76,3);
  for(let i=0;i<46;i++)f(i%3?'#8aa04a':'#6a8a3a',x0+R(40,470),(i%2?730:802)+R(-2,6),2,R(6,10));
  for(let i=0;i<26;i++)f('#e8e8e0',x0+R(50,440),632+R(0,240),3,2);
  }
  OY=0;
  // ---- decoración de zonas
  for(let i=0;i<12;i++){const mx=x0+R(70,350),my=100+R(0,160);f('#fff',mx+1,my+3,2,3);f('#d03030',mx-1,my,6,3)}
  OX=100;OY=350;for(let i=0;i<10;i++){const sx=x0+R(530,880),sy=510+R(0,130);f('#00000033',sx-6,sy+6,14,3);f('#6a4a2a',sx-5,sy,10,7);f('#e0c090',sx-4,sy-1,8,3)}
  OX=0;OY=0;
  [[430,640,0],[760,960,150],[1050,1260,340]].slice(0,[3,2,2,1,1][k]).forEach(([a,c,sh])=>{OX=sh;f('#1a1410',x0+a+12,38,28,24);f('#3a2a1a',x0+a+8,34,36,5);const mx=x0+a+(c-a)/2;f('#6b4a2a',mx,170,26,12);f('#444',mx+2,182,6,4);f('#444',mx+16,182,6,4);for(let j=0;j<9;j++)f('#5a3a1a',x0+a+8+j*22,206,14,2)});
  OX=0;OY=0;
  // ---- cartel de la aldea
  f('#6b4a2a',x0+14,744,4,8);f('#8a6a3a',x0+8,730,130,14);g.font='15px VT323, monospace';g.textAlign='left';g.fillStyle='#fff';g.fillText(b.n+' · nv '+b.lv+'+',x0+12,741);
  // ---- acantilados en los límites del bioma (con hueco en el camino)
  const rk=(x,y)=>{f('#6a6a72',x,y,R(18,28),R(10,16));f('#4a4a52',x+R(2,10),y+3,R(6,10),6);f('#8a8a92',x+2,y,8,2)};
  const wall=bx=>{for(let y=30;y<WH-28;y+=9){if(y>702&&y<826&&bx>2)continue;f('#55555d',bx,y,28,10);rk(bx+R(-2,4),y)}};
  wall(k?x0-14:0);if(k===4)wall(x0+BW-24)});
 f('#666',0,0,WW,28);f('#555',0,22,WW,6);for(let x=0;x<WW;x+=14)f('#5c5c64',x,22+R(-2,6),R(10,22),R(8,14));
 f('#555',0,WH-26,WW,26);for(let x=0;x<WW;x+=14)f('#4c4c54',x,WH-30+R(0,6),R(10,22),R(8,14))})();
function dPerson(x,y,sh,ha,f,w,mv,ar){const b=(mv?Math.abs(Math.sin(w))*2:0)+(!mv&&Math.sin(performance.now()/450+x*.1)>.85?1:0),lg=mv?Math.sin(w)*2:0;
 Sd(x-7,y-1,14,3);Rc('#2a3a5a',x-4,y-7,3,7-Math.max(0,lg));Rc('#2a3a5a',x+1,y-7,3,7+Math.min(0,lg));
 Rc(sh,x-5,y-16-b,10,9);{const sw=mv?Math.round(Math.sin(w)*2):0;Rc(sh,x-7,y-15-b+sw,2,6);Rc('#f1c27d',x-7,y-9-b+sw,2,2);Rc(sh,x+5,y-15-b-sw,2,6);Rc('#f1c27d',x+5,y-9-b-sw,2,2)}Rc('#f1c27d',x-4,y-23-b,8,7);Rc(ha,x-4,y-24-b,8,3);Rc('#000',x+(f>0?1:-3),y-20-b,2,2);if(ar){Rc(ar,x-7,y-17-b,3,4);Rc(ar,x+4,y-17-b,3,4);Rc('#00000044',x-5,y-10-b,10,1);Rc('#ffffff44',x-3,y-15-b,2,5);if(ar!==TCOL.cuero)Rc(ar,x-4,y-25-b,8,3)}return b}
const TCl=['#3a8a3a','#2f7a4a','#4aa86a','#c8652a','#7a3a8a'],OC=['#c8742a','#e8e8f8','#a0502a','#222','#4a7aff','#3adf6a'];
function dN(e,t,now){const dead=!alive(e,now),on=A&&A.e===e,x=e.x,y=e.y;
 if(e.g&&!dead){ctx.globalAlpha=.35+.25*Math.sin(t*6);ctx.fillStyle='#ffe629';ctx.beginPath();ctx.arc(x,y-12,20,0,7);ctx.fill();ctx.globalAlpha=1;if(Math.random()<.1)sp(x+R(-10,10),y-R(5,30),'#ffe629',1,10,20,-20)}
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
 if(dead)return;const i=e.i,RCL=['#cfe8ff','#e0f0ff','#aad0ff','#b8e8c0','#ffb888','#9ad8a0','#80b0ff','#ffa040'][i],FCL=['#ff9a8a','#d8e0e8','#8ab0d8','#8ac88a','#ff8a4a','#4a8a5a','#4a6ac8','#ff6a1a'][i];
 ctx.strokeStyle=RCL;ctx.globalAlpha=.8-(t*2%1)*.6;ctx.beginPath();ctx.ellipse(x,y,5+(t*8%8),2+(t*4%4),0,0,7);ctx.stroke();ctx.globalAlpha=1;Rc(FCL,x+Math.sin(t*2+x)*4,y-2,4+Math.floor(i/3),2);
 if(i===7){ctx.globalAlpha=.3+.2*Math.sin(t*4);ctx.fillStyle='#ff9040';ctx.beginPath();ctx.arc(x,y,9,0,7);ctx.fill();ctx.globalAlpha=1}}
function dS(e,t){const x=e.x,y=e.y,on=A&&A.e===e;let ty=22;
 if(e.id==='bank'){Sd(x-26,y-1,52,4);Rc('#9a9a9a',x-24,y-36,48,36);Rc('#8a8a8a',x-24,y-36,48,4);Rc('#b0a090',x-28,y-44,56,9);Rc('#7a5a3a',x-5,y-18,10,18);Rc('#ffd23a',x+2,y-9,2,2);Rc(WN(t),x-19,y-28,9,9);Rc(WN(t),x+10,y-28,9,9);Rc('#ffd23a',x-3,y-42,6,4);ty=50}
 else if(e.id==='shop'){Sd(x-26,y-1,52,4);Rc('#7a5a3a',x-23,y-24,3,24);Rc('#7a5a3a',x+20,y-24,3,24);dPerson(x,y-5,'#6a3aa8','#ddd',-1,0,0);if(t%7<1)Rc('#f1c27d',x+6,y-30+Math.round(Math.sin(t*12)*2),2,6);Rc('#8a6a3a',x-24,y-10,48,7);Rc('#a0805a',x-24,y-10,48,2);for(let i=0;i<8;i++)Rc(i%2?'#fff':'#c0392b',x-24+i*6,y-36,6,11);Sd(x-24,y-26,48,2);ty=58;if(S.gseen!==S.goal)T('!',x,y-74+Math.sin(t*5)*2,'#ffe629')}
 else if(e.id==='fire'){ctx.globalAlpha=.18;ctx.fillStyle='#ff9a2a';ctx.beginPath();ctx.arc(x,y-6,on?36:26,0,7);ctx.fill();ctx.globalAlpha=1;Rc('#6b4a2a',x-28,y-5,13,5);Rc('#6b4a2a',x+15,y-5,13,5);for(let i=0;i<8;i++)Rc('#888',x+Math.cos(i*.785)*12-1,y-3+Math.sin(i*.785)*5,3,3);Rc('#5a3a1a',x-8,y-5,16,4);
  for(let k=0;k<3;k++){const h=(on?14:9)+Math.sin(t*14+k*2)*4;Rc('#ff7a1a',x-6+k*5,y-5-h,4,h);Rc('#ffd23a',x-5+k*5,y-5-h/2,2,h/2)}ty=28}
 else if(e.id==='anvil'){Sd(x-14,y-1,28,3);Rc('#6b4a2a',x-8,y-7,16,7);Rc('#3a3a3a',x-12,y-15,24,8);Rc('#555',x-15,y-17,9,3);Rc('#222',x-5,y-9,10,3)}
 else if(e.id==='altar'){Sd(x-18,y-1,36,4);Rc('#8a6a3a',x-16,y-14,32,7);Rc('#5a3a1a',x-14,y-7,4,7);Rc('#5a3a1a',x+10,y-7,4,7);Rc('#f0e6c8',x-10,y-17,14,5);Rc('#2a6ac8',x+8,y-20,3,6);Rc('#f0f0f0',x+10,y-27,2,9);Rc('#e8e0c0',x-13,y-22,3,8);ctx.globalAlpha=.6+.3*Math.sin(t*9);Rc('#ffcc40',x-13,y-27,3,5);ctx.globalAlpha=1;ty=36}
 else if(e.id==='bench'){Sd(x-18,y-1,36,3);Rc('#8a6a3a',x-16,y-14,32,6);Rc('#5a3a1a',x-14,y-8,4,8);Rc('#5a3a1a',x+10,y-8,4,8);Rc('#c0c0c0',x-8,y-18,12,3);Rc('#b08a5a',x+6,y-20,8,6);ty=26}
 else{Sd(x-18,y-1,36,3);Rc('#777',x-14,y-26,28,26);Rc('#555',x-14,y-26,28,4);Rc('#666',x+6,y-40,8,16);Rc('#222',x-8,y-14,16,12);Rc(on?'#ffb030':'#c8501a',x-6,y-12+(on?0:3),12,on?10:7);ty=44}
 T(e.n,x,y-ty,'#fff')}
function dM(m,t,now){if(!alive(m,now))return;const d=m.d,x=m.x,y=m.y+Math.sin(t*4+m.hx),c=now<m.fl?'#fff':d.c,w=d.w,h=d.h,lk=Math.abs(P.x-m.x)<220?Math.sign(P.x-m.x):0;if(d.boss){ctx.globalAlpha=.16+.1*Math.sin(t*3);ctx.fillStyle='#ff3030';ctx.beginPath();ctx.ellipse(x,m.y-h/2,w*.9,h*.8,0,0,7);ctx.fill();ctx.globalAlpha=1}
 dSpr(m,d,x,y,c,w,h,lk,t,now);
 if(m.hp<m.mh){Rc('#400',x-12,y-h-9,24,4);Rc('#3c3',x-12,y-h-9,24*m.hp/m.mh,4)}
 T((m.d.boss?'👑 '+m.d.n+' ':m.d.ag?'⚔ ':'')+'Lv'+m.lv,x,y-h-12,(g=>g>6?'#f55':g>3?'#fa5':g<-3?'#7e7':'#fff')(m.lv-L('cb')*.8))}
function swordAt(hx,hy,a,f,col,len){const dx=f*Math.cos(a),dy=Math.sin(a),p=[hx+dx*3,hy+dy*3],q=[hx+dx*(3+len),hy+dy*(3+len)];ctx.lineWidth=2;ctx.strokeStyle='#6b4a2a';ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(p[0],p[1]);ctx.stroke();
 ctx.strokeStyle='#d8c070';ctx.beginPath();ctx.moveTo(p[0]-dy*3,p[1]+dx*3);ctx.lineTo(p[0]+dy*3,p[1]-dx*3);ctx.stroke();ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.stroke();ctx.strokeStyle='#ffffff99';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.stroke()}
function bowAt(hx,hy,f,ph,col){const pull=Math.min(1,ph/.8),px=hx+f*(7-pull*6);ctx.lineWidth=2;ctx.strokeStyle=col;ctx.beginPath();ctx.moveTo(hx+f*7,hy-10);ctx.quadraticCurveTo(hx+f*15,hy,hx+f*7,hy+10);ctx.stroke();
 ctx.lineWidth=1;ctx.strokeStyle='#ffffffcc';ctx.beginPath();ctx.moveTo(hx+f*7,hy-10);ctx.lineTo(px,hy);ctx.lineTo(hx+f*7,hy+10);ctx.stroke();
 if(ph>.05&&ph<.97){ctx.strokeStyle='#d8c9a3';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px,hy);ctx.lineTo(px+f*14,hy);ctx.stroke()}}
function staffAt(hx,hy,f,ph,col,id){const orb=ORB[tierOf(id)]||'#9cf',g=ph>.8;ctx.lineWidth=2;ctx.strokeStyle=col;ctx.beginPath();ctx.moveTo(hx+f*2,hy+8);ctx.lineTo(hx+f*5,hy-16);ctx.stroke();
 ctx.globalAlpha=g?.7:.35;ctx.fillStyle=orb;ctx.beginPath();ctx.arc(hx+f*5,hy-18,g?7:4.5,0,7);ctx.fill();ctx.globalAlpha=1;Rc(orb,hx+f*5-2,hy-20,4,4)}
function dP(t,now){const x=P.x,y=P.y,ac=S.eq.a?ARC(S.eq.a):null,b=dPerson(x,y,ac||'#c0392b','#5a3a1a',P.f,P.w,P.mvg,ac),hx=x+P.f*5,hy=y-12-b,wc=S.eq.w?TCOL[tierOf(S.eq.w)]||(LOOT[S.eq.w]?['#c8742a','#9a9aa8','#cfd8e0','#4a7aff','#3adf6a'][LOOT[S.eq.w].k]:'#ddd'):null,wt=wtype();ctx.lineWidth=2;
 if(A&&!P.mvg){const k=A.ty==='f'?'f':A.sk;
  if(k==='fi'){const tx=hx+P.f*14,ty=hy-14;ctx.strokeStyle='#8a5a2a';ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(tx,ty);ctx.stroke();ctx.lineWidth=1;ctx.strokeStyle='#fff';ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(A.e.x,A.e.y);ctx.stroke();Rc('#e33',A.e.x-1,A.e.y-1+Math.sin(t*5)*1.5,3,3)}
  else if(k==='co')Rc('#aaa',hx+P.f*(2+Math.sin(t*8)*3),hy-3,3,3);
  else{const ph=swPh(now),a=ph<.75?-.5-1.7*ph/.75:-2.2+2.7*Math.pow((ph-.75)/.25,2),ex=hx+P.f*Math.cos(a)*14,ey=hy+Math.sin(a)*14;
   if(k==='f'){if(wc&&wt==='r')bowAt(hx,hy,P.f,ph,wc);else if(wc&&wt==='g')staffAt(hx,hy,P.f,ph,wc,S.eq.w);else if(wc)swordAt(hx,hy,a,P.f,wc,13);else Rc('#f1c27d',hx+P.f*Math.cos(a)*7-1,hy+Math.sin(a)*7-1,4,4)}
   else{ctx.strokeStyle='#8a5a2a';ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(ex,ey);ctx.stroke();const tc=TCOL[TT[S.tool[k]]]||'#aaa';
    if(k==='wc'){Rc(tc,ex-(P.f>0?1:3),ey-3,4,6);Rc('#ffffffaa',ex+(P.f>0?2:-3),ey-3,1,6)}
    else if(k==='mi'){Rc(tc,ex-4,ey-1,8,2);Rc(tc,ex-4,ey-1,2,4);Rc(tc,ex+2,ey-1,2,4)}
    else Rc('#777',ex-3,ey-2,6,5)}}}
 else if(wc){if(wt==='r')bowAt(hx,hy,P.f,0,wc);else if(wt==='g')staffAt(hx,hy,P.f,0,wc,S.eq.w);else swordAt(hx,hy,-1.3+Math.sin(t*2)*.05,P.f,wc,9)}}
const bl=document.createElement('canvas');bl.width=W>>2;bl.height=H>>2;const bx=bl.getContext('2d'),gr=document.createElement('canvas');gr.width=gr.height=96;let GP=null,SHK=0,HURT=-1e9;
try{const g=gr.getContext('2d'),im=g.createImageData(96,96);for(let i=0;i<im.data.length;i+=4){const v=Math.random()*255;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255}g.putImageData(im,0,0)}catch(e){}
function post(now){const t=now/1000,d=Math.max(0,Math.min(1,(.15-sunS(t))/.55));
 if('filter' in ctx){ctx.save();ctx.filter='contrast(1.07) saturate(1.2)';ctx.drawImage(cv,0,0);ctx.restore()}
 const hu=Math.max(0,1-(now-HURT)/450)*.5,low=P.hp<maxHp()*.3?(.5+.5*Math.sin(t*6))*.3:0,rv=Math.max(hu,low);
 if(rv>.01){const g=ctx.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.85);g.addColorStop(0,'rgba(200,20,20,0)');g.addColorStop(1,'rgba(200,20,20,'+rv+')');ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}}
const clk=()=>{const t=performance.now()/1000,h=dayP(t)*24,s=sunS(t);return (s>.15?'☀️ ':s>-.1?'🌅 ':'🌙 ')+String(Math.floor(h)).padStart(2,'0')+':'+String(Math.floor(h%1*60)).padStart(2,'0')};
function lighting(now){const t=now/1000,s=sunS(t),d=Math.max(WXD,Math.max(0,Math.min(1,(.15-s)/.55))),w=Math.max(0,1-Math.abs(s)*4)*.16,vis=(x,r)=>Math.abs(x-cx-W/2)<W/2+r;
 if(d>.01){const Ls=[];
  ST.forEach(e=>{if(!vis(e.x,130))return;if(e.id==='fire')Ls.push([e.x,e.y-6,(A&&A.e===e?125:105)*(1+.05*Math.sin(t*13+e.x)),1]);else if(e.id==='furnace')Ls.push([e.x,e.y-8,A&&A.e===e?95:72,1]);else if(e.id==='shop'||e.id==='bank'||e.id==='altar')Ls.push([e.x,e.y-18,52,.9])});
  BI.forEach((b,k)=>[120,270].forEach(dx=>{const x=k*BW+dx;if(vis(x,90))Ls.push([x,730,78,.95])}));BI.forEach((b,k)=>{if(k===0||k===3||k===4){const x=k*BW+1470;if(vis(x,90))Ls.push([x,730,95,.9])}if(k===4&&vis(k*BW+771,120))Ls.push([k*BW+771,665,110,.9]);if(k===0&&vis(k*BW+2060,100))Ls.push([k*BW+2060,765,100,.9])});
  N.forEach(e=>{if(e.g&&alive(e,now)&&vis(e.x,40))Ls.push([e.x,e.y-12,36,.8])});
  Ls.push([P.x,P.y-12,95,.95]);
  lx.globalCompositeOperation='source-over';lx.clearRect(0,0,W,H);lx.fillStyle='rgba(8,14,46,'+d*.72+')';lx.fillRect(0,0,W,H);lx.globalCompositeOperation='destination-out';
  Ls.forEach(([x,y,r,k])=>{x-=cx;y-=cy;const g=lx.createRadialGradient(x,y,r*.1,x,y,r);g.addColorStop(0,'rgba(0,0,0,'+k+')');g.addColorStop(1,'rgba(0,0,0,0)');lx.fillStyle=g;lx.fillRect(x-r,y-r,r*2,r*2)});
  ctx.drawImage(lc,0,0);ctx.globalCompositeOperation='lighter';
  Ls.forEach(([x,y,r])=>{if(r<60&&x===P.x)return;x-=cx;y-=cy;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(255,170,70,'+.22*d+')');g.addColorStop(1,'rgba(255,170,70,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2)});
  ctx.globalCompositeOperation='source-over'}
 if(w>.01){ctx.fillStyle='rgba(255,130,50,'+w+')';ctx.fillRect(0,0,W,H)}
 const g=ctx.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,H*.9);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,'+(.26+d*.2)+')');ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
function dGates(t){for(let k=1;k<5;k++){const x=k*BW;if(Math.abs(x-cx-W/2)>W/2+60)continue;const open=!!S.boss[k-1];
 if(!open){for(let y=712;y<826;y+=12){Rc('#5a3a1a',x-7,y,14,11);Rc('#7a5a2a',x-7,y,14,3);Rc('#3a2410',x-1,y,2,11)}Rc('#000000aa',x-70,676,140,36);T('🔒 Bloqueado',x,692,'#ff6a6a');T('Derrota al jefe anterior',x,706,'#ddd')}
 else{Rc('#6b4a2a',x-12,704,6,128);Rc('#6b4a2a',x+6,704,6,128);Rc('#8a6a3a',x-14,698,28,8);T('➜ '+BI[k].n,x,688,'#ffe629')}}}
function draw(now){const t=now/1000;cx=Math.max(0,Math.min(WW-W,P.x-W/2))|0;cy=Math.max(0,Math.min(WH-H,P.y-H/2))|0;
 {const s0=sunS(t),ph0=2*Math.PI*(dayP(t)-.25),d0=Math.max(0,s0);SHD.dx=-Math.cos(ph0)*(8+20*(1-d0));SHD.dy=2+3*(1-d0);SHD.a=Math.max(0,Math.min(.28,(s0+.15)*.5))}
const vis=e=>Math.abs(e.x-cx-W/2)<W/2+60;ctx.imageSmoothingEnabled=false;ctx.save();const shk=now<SHK?(SHK-now)/200*3:0;ctx.translate(-cx+(Math.random()-.5)*2*shk,-cy+(Math.random()-.5)*2*shk);{const sx=Math.max(0,cx-8),sy=Math.max(0,cy-8),sw=Math.min(W+16,WW-sx),sh=Math.min(H+16,WH-sy);if(GR)GR.draw(ctx,cx,cy);ctx.drawImage(bgc,sx,sy,sw,sh,sx,sy,sw,sh)}
 PD.forEach(p=>{if(Math.abs(p.x+p.w/2-cx-W/2)>=W/2+p.w/2||p.y>cy+H+10||p.y+p.h<cy-10)return;if(WT){WT.anim(ctx,p,t,cx,cy,W,H);return}const x1=Math.max(p.x,cx-12),x2=Math.min(p.x+p.w,cx+W+12);
 for(let r=0;r<Math.floor(p.h/14);r++){const yy=p.y+8+r*14;if(yy<cy-8||yy>cy+H+8)continue;const sp2=(r%2?1:-1)*(9+r*1.4);for(let x=x1-(x1%12);x<x2;x+=12){const ox=(((x+t*sp2)%24)+24)%24-12;ctx.globalAlpha=.14+.14*Math.sin(t*1.5+x*.07+r);Rc(p.sh,x+ox,yy+Math.sin(t*2+x*.12+r)*1.4,7,2)}}
 for(let x=x1-(x1%5);x<x2;x+=5){ctx.globalAlpha=.28+.24*Math.sin(t*2.2+x*.35);Rc('#ffffff',x,p.y+1+Math.sin(t*1.6+x*.2),3,1);Rc('#ffffff',x,p.y+p.h-3,3,1)}ctx.globalAlpha=1});ctx.globalAlpha=1;
 dGates(t);dDecor(t,now);[...N.filter(vis).map(e=>[e.y,()=>dN(e,t,now)]),...ST.filter(vis).map(e=>[e.y,()=>dS(e,t)]),...M.filter(vis).map(e=>[e.y,()=>dM(e,t,now)]),[P.y,()=>dP(t,now)]].sort((a,b)=>a[0]-b[0]).forEach(o=>o[1]());
 dAmb(now,false);PJ.forEach(p=>{const u=Math.min(1,(now-p.t0)/(p.t1-p.t0)),x=p.x+(p.tx-p.x)*u,y=p.y+(p.ty-p.y)*u-Math.sin(u*Math.PI)*8;if(p.wt==='r'){const an=Math.atan2(p.ty-p.y,p.tx-p.x);ctx.strokeStyle='#d8c9a3';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-Math.cos(an)*8,y-Math.sin(an)*8);ctx.lineTo(x+Math.cos(an)*4,y+Math.sin(an)*4);ctx.stroke()}else{ctx.globalAlpha=.8;ctx.fillStyle=p.col||ORB[tierOf(S.eq.w||'st_pino')]||'#9cf';ctx.beginPath();ctx.arc(x,y,4,0,7);ctx.fill();ctx.globalAlpha=1}});
 parts.forEach(p=>{ctx.globalAlpha=Math.min(1,p.l);if(p.sp){ctx.beginPath();ctx.arc(p.x,p.y,7,0,7);ctx.fillStyle=p.sp;ctx.fill();T(p.tx,p.x,p.y+4,'#fff')}else if(p.tx)T(p.tx,p.x,p.y,p.c);else Rc(p.c,p.x,p.y,2,2)});ctx.globalAlpha=1;
 ctx.restore();lighting(now);ctx.save();ctx.translate(-cx,-cy);dAmb(now,true);ctx.restore();post(now);
 if(CK){const a=ACT.co[CK.i],bx=W/2-150,by=H/2-40;Rc('#000000bb',bx-14,by-34,328,110);Rc('#000',bx-2,by-2,304,24);Rc('#3a3226',bx,by,300,20);Rc('#2a7a2a',bx+300*(CK.c-CK.hw),by,300*CK.hw*2,20);Rc('#ffe629',bx+300*(CK.c-CK.hw*.35),by,300*CK.hw*.7,20);Rc('#fff',bx+300*CK.pos-2,by-4,4,28);
 T((CK.bonus?'🎲 ¡Bonus de cocina! ':'')+a[0],W/2,by-12,'#ff981f');T(CK.res===null?'Espacio / clic: detén la barra en la zona verde':(CK.bonus?['Sin bonus esta vez','¡Plato extra!','¡PERFECTO! XP doble + plato extra']:['¡Quemado!','¡Bien!','¡PERFECTO!'])[CK.res],W/2,by+44,CK.res===2?'#ffe629':CK.res===0?'#e5533d':'#fff');T(CK.bonus?'Acierta: más XP y un plato extra (Esc: saltar)':'Racha: '+CK.streak+' · Esc para salir',W/2,by+62,'#aaa')}
{const g=GOALS[S.goal],tg=g&&goalReady(g)&&goTarget(g[5]);if(tg){const dx=tg.x-P.x,dy=tg.y-P.y,d=Math.hypot(dx,dy);if(d>70){const an=Math.atan2(dy,dx),px=P.x-cx+Math.cos(an)*42,py=P.y-cy-12+Math.sin(an)*42+Math.sin(performance.now()/200)*2;ctx.fillStyle='#ffe629';ctx.beginPath();ctx.moveTo(px+Math.cos(an)*8,py+Math.sin(an)*8);ctx.lineTo(px+Math.cos(an+2.4)*7,py+Math.sin(an+2.4)*7);ctx.lineTo(px+Math.cos(an-2.4)*7,py+Math.sin(an-2.4)*7);ctx.fill();T(Math.round(d/10)+' m',px,py-12,'#ffe629')}}}
if(LASTX&&performance.now()-LASTX[1]<7000){const k=LASTX[0],l=L(k),x=S.xp[k],pc=l>=99?1:(x-XT[l])/(XT[l+1]-XT[l]);Rc('#000000aa',6,H-36,150,28);Rc('#112',9,H-16,144,8);Rc('#3fd04a',10,H-15,142*pc,6);T(SK[k][1]+' '+SK[k][0]+' nv.'+l,81,H-22,'#fff')}
hudFx(now);if(MM){const mw=140,mh=90,mx=W-mw-6,my=44,x0=curB*BW,sx=mw/BW,sy=mh/WH;ctx.save();ctx.imageSmoothingEnabled=true;Rc('#000000aa',mx-3,my-3,mw+6,mh+6);ctx.drawImage(MMC[curB]||(MMC[curB]=mmk(curB)),mx,my);
 ctx.strokeStyle='#ffffff99';ctx.lineWidth=1;ctx.strokeRect(mx+(cx-x0)*sx,my+cy*sy,W*sx,H*sy);
 M.forEach(m=>{if(m.d.boss&&alive(m,now)&&Math.floor(m.x/BW)===curB){ctx.fillStyle='#ff3030';ctx.fillRect(mx+(m.x-x0)*sx-2,my+m.y*sy-2,4,4)}});
 ST.forEach(e=>{if(e.id==='bank'&&Math.floor(e.x/BW)===curB){ctx.fillStyle='#ffd23a';ctx.fillRect(mx+(e.x-x0)*sx-1,my+e.y*sy-1,3,3)}});
 ctx.fillStyle=Math.floor(now/400)%2?'#ffffff':'#ffe629';ctx.fillRect(mx+(P.x-x0)*sx-2,my+P.y*sy-2,4,4);ctx.restore()}
Rc('#400',6,6,92,14);Rc(P.hp/maxHp()>.3?'#3c3':'#e33',8,8,88*Math.max(0,P.hp)/maxHp(),10);T('PV '+Math.max(0,P.hp)+'/'+maxHp(),52,18,'#fff');T(BI[curB].ic+' '+BI[curB].n+' · nv '+BI[curB].lv+'+',W-80,18,'#fff');T(clk(),W-80,34,'#ffe629');if(ZB){const el=now-ZB.t0;if(el>3600)ZB=null;else{ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,(3600-el)/1400));ctx.font='16px VT323, monospace';const tw=ctx.measureText(ZB.t).width+28;Rc('#000000aa',W/2-tw/2,8,tw,24);T(ZB.t,W/2,25,'#ffe8a0');ctx.restore()}}Rc('#112',6,24,92,9);Rc('#4a9aff',7,25,90*EN/enMax(),7);Rc('#112',6,35,92,9);Rc('#a06aff',7,36,90*MN/mnMax(),7);let by=58;[['xp','Sabiduría'],['dmg','Fuerza'],['spd','Rapidez'],['def','Piel de piedra']].forEach(([k,n])=>{const r=S.buf[k]-Date.now();if(r>0){T(n+' '+Math.ceil(r/1000)+'s',52,by,'#9ff');by+=15}});
 if(A){let p,lb;if(A.ty==='f'){const m=A.e;p=m.hp/m.mh;lb=m.d.n+' nv.'+m.lv+' '+Math.max(0,m.hp)+'/'+m.mh}else{p=Math.min(1,A.pr||0);lb=actLabel()}
  Rc('#000',W/2-100,H-26,200,16);Rc(A.ty==='f'?'#a33':'#c8861a',W/2-98,H-24,196*p,12);T(lb,W/2,H-13,'#fff')}}
cv.addEventListener('pointerdown',ev=>{if(CK){cookHit();return}const r=cv.getBoundingClientRect(),wx=(ev.clientX-r.left)*W/r.width+cx,wy=(ev.clientY-r.top)*H/r.height+cy,now=performance.now();
 let b=null,bd=26;[...N,...ST,...M].forEach(e=>{if(!alive(e,now))return;const d=Math.hypot(wx-e.x,wy-(e.y-10))-(e.id?18:0);if(d<bd){bd=d;b=e}});
 if(A)stopA();if(b){P.g={e:b};P.mv=null}else{P.mv={x:wx,y:wy};P.g=null}});
const KM={ArrowLeft:'l',a:'l',ArrowRight:'r',d:'r',ArrowUp:'u',w:'u',ArrowDown:'d',s:'d'};
addEventListener('keydown',e=>{const k=KM[e.key];if(k){K[k]=1;e.preventDefault()}if(e.key==='r'||e.key==='R')tgRun();if(e.key==='m'||e.key==='M')MM=!MM;if((e.key===' '||e.key==='Enter')&&CK){cookHit();e.preventDefault()}if(e.key==='Escape')CK=null});addEventListener('keyup',e=>{const k=KM[e.key];if(k)K[k]=0});
addEventListener('pointerdown',()=>pd=1);addEventListener('pointerup',()=>setTimeout(()=>pd=0,60));
let hid=0;document.addEventListener('visibilitychange',()=>{if(document.hidden)hid=Date.now();else if(A&&A.ty!=='f'&&Date.now()-hid>5000){offline(Date.now()-hid,A.sk,A.i);A.t0=performance.now()}});

// ---------- paneles ----------
const PDS={xp:'+50% de XP durante 3 min. Clic para usar.',dmg:'Fuerza +3 (más 10% de tu nivel) durante 3 min. Clic para usar.',spd:'+35% de velocidad durante 3 min. Clic para usar.'};
function desc(id){const d=I[id],o=[(rr(id)?'<b style="color:'+RAR[rr(id)][1]+'">'+d[0]+'</b>':d[0])+' · vale '+d[2]+' oro'],ing=[];
 if(id.includes('~')&&!(TOOLT[id]&&TOOLT[id].pa))o.push('<span style="color:'+RAR[rr(id)][1]+'">'+RAR[rr(id)][0]+'</span> · fabricado: mejores estadísticas base, sin habilidades especiales');if(LOOT[id]){const it=LOOT[id],TX={def:'Defensa',str:'Fuerza',acc:'Precisión',mana:'Maná máximo',mreg:'Regeneración de maná por segundo',hp:'Vida máxima'};o.push('<span style="color:'+RAR[it.r][1]+'">'+RAR[it.r][0]+'</span> · '+LS[it.s][0]+' · Clic para equipar');for(const k in it.st)o.push('+'+(k==='mreg'?it.st[k].toFixed(3):it.st[k])+' '+TX[k]);(it.pa||[]).forEach(p=>o.push('<span style="color:#ffd100">'+PS[p.id].d(p.v)+'</span>'))}
 if(TOOLT[id]){const T=TOOLT[id];o.push('Herramienta de '+({wc:'tala',mi:'minería',fi:'pesca'})[T.k]+' · tier '+T.t+(T.bq?' (+'+Math.round(T.bq*100)+'% hacia el siguiente tier, nunca lo supera)':'')+' · Clic para equipar');(T.pa||[]).forEach(p=>o.push('<span style="color:#ffd100">'+PS[p.id].d(p.v)+'</span>'))}
 if(/^rv_/.test(id))o.push('Runa reutilizable: te teletransporta a la plaza de ese bioma. Enfriamiento de 45 s y no se puede usar en combate. Clic para usar.');
 if(SCI[id]!==undefined)o.push('Pergamino de un solo uso: lanza '+SPL[SCI[id]].n+' sin gastar maná ni runas. Requiere Magia nv. '+SPL[SCI[id]].lv+'. Clic para usar.');
 if(MANAP[id])o.push('Poción: restaura '+MANAP[id]+' de maná. Clic para usar.');if(d[4])o.push('Restaura '+d[4]+' de maná y acelera su regeneración 90 s.');
 if(d[3])o.push('Comida: cura '+d[3]+' PV. Se come sola al bajar de 45% PV.');
 if(SW[id])o.push('Arma cuerpo a cuerpo · precisión +'+SW[id]+' · fuerza +'+(SB[id]||0)+' · '+((WSP[id]||4)*.6).toFixed(1)+' s por ataque. Clic para equipar.');
 if(BOW[id])o.push('Arma a distancia · precisión +'+BOW[id]+' · fuerza +'+(SB[id]||0)+' · '+((WSP[id]||4)*.6).toFixed(1)+' s por ataque. Usa Combate. Clic para equipar.');if(STF[id])o.push('Arma mágica: +'+STF[id]+' de daño a hechizos, +'+STF[id]*2+' de maná máximo · lanza solo tu mejor hechizo cada '+((WSP[id]||5)*.6).toFixed(1)+' s (gasta maná y runas). Clic para equipar.');if(AR[id])o.push('Armadura: +'+AR[id]+' de defensa. Clic para equipar.');
 if(POT[id])o.push(PDS[POT[id]]);if(id==='quemado')o.push('Inservible. Véndelo.');
 for(const sk in ACT)ACT[sk].forEach(a=>{if(a.length===5&&a[1]===id)o.push('Se obtiene con '+SK[sk][0]+' (nv. '+a[2]+')');if(a.length===6){if(a[2]===id)o.push('Se fabrica: '+a[0]+' ('+SK[sk][0]+' nv. '+a[3]+')');if(a[1][id])ing.push(a[0])}});
 if(ing.length)o.push('Sirve para: '+ing.slice(0,3).join(', ')+(ing.length>3?'…':''));
 for(const k in RARE)if(RARE[k][0]===id)o.push('Drop raro de '+SK[k][0]+' (1/'+RARE[k][1]+')');
 for(const m in MD){if(MD[m].dr.some(x=>x[0]===id))o.push('Lo suelta: '+MD[m].n);if(MD[m].rare&&MD[m].rare[0]===id)o.push('Drop raro de: '+MD[m].n)}
 return o.join('\n')}
const tip=document.createElement('div');tip.id='tip';document.body.appendChild(tip);
document.addEventListener('mouseover',e=>{const t=e.target.closest&&e.target.closest('[data-i],[data-x]');if(!t){tip.style.display='none';return}tip.innerHTML=t.dataset.x||desc(t.dataset.i);tip.style.display='block'});
document.addEventListener('mousemove',e=>{if(tip.style.display==='block'){tip.style.left=Math.max(4,Math.min(innerWidth-300,e.clientX+14))+'px';tip.style.top=Math.min(innerHeight-120,e.clientY+14)+'px'}});
const near=e=>e&&Math.hypot(P.x-e.x,P.y-e.y)<80;
function tab(t){TB=t;document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));panel()}
const ownT0=a=>typeof a[2]==='string'&&a[2].startsWith('tl:')&&S.tool[a[2].split(':')[1]]>=+a[2].split(':')[2];
const buyI=(id,c)=>{if(S.coins<c||S.inv.length>=cap())return;S.coins-=c;S.inv.push(id);snd('coin');dirty=1;save()};
const buyU=(k,i)=>{const c=UP[i][3][S[k]];if(c==null||S.coins<c)return;S.coins-=c;S[k]++;snd('quest');log('Mejora comprada: '+UP[i][1]);dirty=1;save()};
const travel=(k,c)=>{if(S.coins<c)return;S.coins-=c;stopA();P.g=P.mv=null;P.x=k*BW+200;P.y=750,FD=performance.now();snd('coin');dirty=1;save()};
let td,DL=null;
function talk(){inc('talk');S.gseen=S.goal;const g=GOALS[S.goal];DL={p:(g?(g[4]||'¡Hola de nuevo, viajero!'):'¡Lo lograste todo, viajero! Ahora ve por el nivel 99 en cada skill y completa la colección.').split('|'),i:0};dlgShow();dirty=1;save()}
function dlgShow(){const d=$('#dlg');d.innerHTML='<b style="color:var(--or)">Ru</b><br>'+DL.p[DL.i]+(DL.i<DL.p.length-1?' <span style="color:var(--yl)">▸ clic</span>':'');d.style.display='block';clearTimeout(td);td=setTimeout(()=>d.style.display='none',20000)}
function dlgNext(){if(!DL||DL.i>=DL.p.length-1){$('#dlg').style.display='none';return}DL.i++;dlgShow()}
function goTarget(s){if(!s)return null;const now=performance.now(),[k,a,b]=s.split(':');let l2=k==='S'?ST.filter(e=>e.id===a):k==='N'?N.filter(e=>e.t===a&&e.i===+b&&alive(e,now)):k==='M'?M.filter(e=>e.d.id===a&&alive(e,now)):k==='B'?[{x:+a*BW+90,y:750}]:[],best=null,bd=1e9;l2.forEach(e=>{const d=Math.hypot(e.x-P.x,e.y-P.y);if(d<bd){bd=d;best=e}});return best}
function recipeOf(id){for(const sk in ACT){const a=ACT[sk].find(a=>a.length===6&&(a[2]===id||(id.startsWith('rn_')&&String(a[2]).startsWith(id+':'))));if(a)return[sk,a]}return null}
function goalReady(g){if(!g[1].startsWith('make:'))return true;const r=recipeOf(g[1].slice(5));return !r||(L(r[0])>=rq(r[1])&&hasIn(r[1][1]))}
const chips=o=>Object.entries(o).map(([k,v])=>{const n=count(k);return `<span class="chip ${n>=v?'ok':'no'}" data-i="${k}">${ic(k)} ${I[k][0]} ${n}/${v}</span>`}).join(''),STN={furnace:'el Horno',anvil:'el Yunque',fire:'la Fogata',bench:'el Taller',altar:'el Escritorio'};
function goalsHTML(){const g=GOALS[S.goal];let h='';
 if(g){const v=Math.min(g[2],S.st[g[1]]||0),r=g[1].startsWith('make:')&&recipeOf(g[1].slice(5)),rd=goalReady(g);
  h=`<div style="color:var(--yl);font-size:25px">${g[0]}</div><div class="hint" style="margin:2px 0">${g[2]>1?fmt(v)+'/'+fmt(g[2]):''}${g[3]?' · Recompensa: '+g[3]+' oro':''}</div>${g[2]>1?`<div class="bar"><i style="width:${v/g[2]*100}%"></i></div>`:''}`
  +(r?`<div style="margin-top:6px">${chips(r[1][1])}</div>${L(r[0])<rq(r[1])?`<div class="hint" style="margin:2px 0">Requiere ${SK[r[0]][0]} nv. ${rq(r[1])}</div>`:''}<div class="hint" style="margin:2px 0">📍 Se hace en ${STN[g[5].slice(2)]||'la estación'}${rd?'':' · la flecha aparecerá cuando tengas todo'}</div>`:'')
  +`<div class="hint" style="color:#d8c9a3;margin-top:8px">💬 ${(g[4]||'Toca a Ru, el tendero, en la plaza del pueblo (sigue la flecha amarilla).').split('|').pop()}</div>`;
  h+='<div class="hint" style="margin-top:12px">Después:</div>'+GOALS.slice(S.goal+1,S.goal+4).map(x=>'<div class="hint" style="margin:2px 0;opacity:.7">• '+x[0]+'</div>').join('')}
 else h='<div style="color:var(--yl)">¡Completaste todos los objetivos!</div><div class="hint">Sube tus skills hasta 99 y completa la colección.</div>';
 let best=null;SKL.forEach(k=>{const l=L(k);if(l>=99)return;const p=(S.xp[k]-XT[l])/(XT[l+1]-XT[l]);if(!best||p>best[1])best=[k,p,l,XT[l+1]-S.xp[k]]});
 if(best&&best[1]>.5)h+=`<div style="margin-top:14px;border-top:2px dashed var(--hi);padding-top:8px">⚡ ¡Casi! ${SK[best[0]][1]} ${SK[best[0]][0]} nv.${best[2]+1} al ${Math.floor(best[1]*100)}%<div class="hint" style="margin:0">Faltan ${fmt(best[3])} XP</div></div>`;
 return h+bossHTML()+'<div class="hint" style="margin-top:14px">Pulsa R para correr: gasta stamina y entrena Agilidad. Los recursos dorados ✨ dan bonus.</div>'}
// el río del sudoeste solo se cruza por el puente: la ruta automática pasa por él
function bridgeWp(tg){const k=Math.floor(P.x/BW),x0=k*BW,bx=x0+270;if(Math.floor(tg.x/BW)!==k||P.x>x0+490||tg.x>x0+490)return null;const pn=P.y<1236,ps=P.y>1304,tn=tg.y<1236,ts=tg.y>1304;
 if((pn&&ts)||(ps&&tn))return Math.abs(P.x-bx)>12?{x:bx,y:pn?1224:1316}:{x:bx,y:pn?1318:1222};
 if(!pn&&!ps&&Math.abs(P.x-bx)<=14){if(ts)return{x:bx,y:1318};if(tn)return{x:bx,y:1222}}return null}
function useRV(k){const now=Date.now();if(k>=(S.st.bio||1)){log('Aún no has llegado a ese bioma.');return}if(performance.now()<(P.pj||0)||(A&&A.ty==='f')){log('No puedes usar la runa en combate.');return}if(now<(S.rvt||0)){log('La runa se está recargando: '+Math.ceil((S.rvt-now)/1000)+' s.');return}
 stopA();P.g=P.mv=null;sp(P.x,P.y-16,'#8ad8ff',20,100,90,140);P.x=k*BW+200;P.y=750,FD=performance.now();sp(P.x,P.y-16,'#8ad8ff',20,100,90,140);S.rvt=now+45000;snd('magic');log('🌀 Te teletransportas a '+BI[k].n+'.');dirty=1;save()}
function buyRV(k){const id='rv_'+k,c=RVC[k];if(S.coins<c||count(id)>0||S.bank[id]>0)return;S.coins-=c;if(S.inv.length<cap())S.inv.push(id);else S.bank[id]=1;disc(id);snd('coin');log('Compraste: '+I[id][0]);dirty=1;save()}
function syncTools(){for(const k of ['wc','mi','fi']){const id=S.eq[k],T=id&&TOOLT[id];S.tool[k]=T?T.t:0;S.tq[k]=T?T.bq||0:0}}
function autoEq(id){const T=TOOLT[id];if(T&&!S.eq[T.k]){S.eq[T.k]=id;const j=S.inv.lastIndexOf(id);if(j>=0)S.inv.splice(j,1);syncTools();toast('🔧 ¡Herramienta equipada!<br>'+I[id][0])}}
const ownT=a=>false,unq=k=>{const id=S.eq[k];if(!id||S.inv.length>=cap())return;S.inv.push(id);S.eq[k]=null;syncTools();dirty=1;save()};
function use(i){const id=S.inv[i];if(/^rv_/.test(id)){useRV(+id.slice(3));return}
 if(TOOLT[id]){const k=TOOLT[id].k,o=S.eq[k];S.eq[k]=id;S.inv.splice(i,1);if(o)S.inv.push(o);syncTools();snd('coin');dirty=1;save();return}
 if(SCI[id]!==undefined){if(cast(SCI[id],1)){S.inv.splice(S.inv.indexOf(id),1);dirty=1;save()}return}
 if(WB[id]||AR[id]||LOOT[id]){let k=LOOT[id]?LOOT[id].s:WB[id]?'w':'a';if(k==='r'&&S.eq.r&&!S.eq.r2)k='r2';const o=S.eq[k];S.eq[k]=id;S.inv.splice(i,1);if(o)S.inv.push(o);snd('coin');dirty=1;save();return}if(MANAP[id]){if(MN>=mnMax())return log('Ya tienes el maná al máximo.');S.inv.splice(i,1);MN=Math.min(mnMax(),MN+MANAP[id]);snd('magic');log('Recuperas maná.');dirty=1;return}
 if(POT[id]){S.inv.splice(i,1);S.buf[POT[id]]=Date.now()+180000;snd('quest');log('Efecto activo 3 min: '+I[id][0]);dirty=1;return}if(id&&I[id][3]&&(P.hp<maxHp()||(I[id][4]&&MN<mnMax()))){S.inv.splice(i,1);P.hp=Math.min(maxHp(),P.hp+I[id][3]);if(I[id][4]){MN=Math.min(mnMax(),MN+I[id][4]);S.buf.mreg=Date.now()+90000;log('Tu maná se regenera más rápido durante 90 s.')}dirty=1}}
const sell=id=>{const n=count(id);S.inv=S.inv.filter(x=>x!==id);earn(Math.round(n*I[id][2]*(1+.1*S.merc)));snd('coin');log('Vendiste '+n+'x '+I[id][0]);dirty=1;save()};
const sellAll=()=>{let g=0;S.inv.forEach(x=>g+=I[x][2]);g=Math.round(g*(1+.1*S.merc));S.inv=[];earn(g);snd('coin');log('Vendiste todo por '+g+' oro.');dirty=1;save()};
const buy=(sk,t)=>{if(S.coins<TC[t]||L(sk)<TL[t])return;S.coins-=TC[t];S.tool[sk]=t;log('Compraste: '+TOOLS[sk][0]+' '+TN[t]);dirty=1;save()};
const buyPan=()=>{if(S.coins>=10&&S.inv.length<cap()){S.coins-=10;S.inv.push('pan');dirty=1}};
const depAll=()=>{S.inv.forEach(x=>S.bank[x]=(S.bank[x]||0)+1);S.inv=[];dirty=1;save()};
const wd=(k,n)=>{while(n-->0&&S.bank[k]>0&&S.inv.length<cap()){S.inv.push(k);S.bank[k]--}dirty=1;save()};
const far=m=>'<div class="hint">'+m+'</div>';
function skLive(k){const d=document.querySelector('#pn [data-sk="'+k+'"]');if(!d||L(k)!==+d.querySelector('.gold').textContent.split('/')[0])return;const l=L(k),x=S.xp[k],pc=l>=99?100:(x-XT[l])/(XT[l+1]-XT[l])*100,t=fmt(x)+' XP',h=d.querySelector('.hint');if(h.textContent!==t)h.textContent=t;d.querySelector('i').style.width=pc+'%'}
function panel(){let h='';
 if(TB==='inv'){const eq=(k,l,ph)=>{const id=S.eq[k];return `<div style="text-align:center"><button class="slot" ${id?`data-i="${id}" onclick="unq('${k}')"`:''} style="width:54px;opacity:${id?1:.45};${rr(id)?'border:2px solid '+RAR[rr(id)][1]:''}">${id?ic(id):ph}</button><div class="hint" style="margin:0">${l}</div></div>`},
  tl=k=>`<div style="text-align:center"><div class="slot" style="width:54px" data-x="${TOOLS[k][0]} ${tn(k,S.tool[k])}. Golpea cada ${(hitPeriod(k)/1000).toFixed(1)} s y cada tier reduce los golpes que pide cada recurso. Se mejora fabricando.">${ic('tl:'+k+':'+S.tool[k])}</div><div class="hint" style="margin:0">${tn(k,S.tool[k]).slice(3)}</div></div>`;
  h='<h2>Equipo</h2><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">'+eq('w','Arma','⚔️')+eq('a','Armadura','🛡️')+eq('h','Casco','🪖')+eq('f','Botas','👢')+eq('r','Anillo','💍')+eq('r2','Anillo 2','💍')+eq('n','Amuleto','📿')+eq('wc','Hacha','🪓')+eq('mi','Pico','⛏️')+eq('fi','Caña','🎣')+'</div><div class="hint" style="margin:0 0 8px">Golpe máx. '+maxHit()+' · Defensa +'+ab()+' · Ataque cada '+(atkMs()/1000).toFixed(1)+' s</div><h2>Mochila '+S.inv.length+'/'+cap()+'</h2><div class="inv">'+Array.from({length:cap()},(_,i)=>{const d=S.inv[i];return d?`<button class="slot" data-i="${d}"${rr(d)?' style="border:2px solid '+RAR[rr(d)][1]+'"':''} onclick="use(${i})">${ic(d)}</button>`:'<div class="slot"></div>'}).join('')+'</div><div class="hint">Clic en armas y armaduras para equiparlas (se ven en tu personaje), en comida para comer y en pociones para usarlas.</div>'}
 else if(TB==='sk'){h=SKL.map(k=>{const l=L(k),x=S.xp[k],pc=l>=99?100:(x-XT[l])/(XT[l+1]-XT[l])*100;return `<div data-sk="${k}" style="margin-bottom:8px">${SK[k][1]} ${SK[k][0]} <span class="gold">${l}/99</span><span class="hint" style="float:right;margin:0">${fmt(x)} XP</span><div class="bar"><i style="width:${pc}%"></i></div></div>`}).join('')+far('Horno: fundes menas en barras. Yunque: forjas armas y herramientas. Taller: armaduras. Combate: PV y daño. Cocina: cura. Herrería: espadas. Artesanía: armaduras. Escultor: cañas, arcos y bastones. Magia: hechizos y bastones mágicos. Agilidad: solo sube corriendo (R) y aumenta tu stamina.')}
 else if(TB==='q'){h=Q.map((q,i)=>{const v=Math.min(q[3],S.st[q[2]]||0),d=S.done[i];return `<div style="margin-bottom:7px;opacity:${d?.5:1}">${d?'✔ ':''}<b class="gold">${q[0]}</b> · ${q[4]} oro<div class="hint" style="margin:0">${q[1]} (${fmt(v)}/${fmt(q[3])})</div><div class="bar"><i style="width:${v/q[3]*100}%"></i></div></div>`}).join('')}
 else if(TB==='mg'){const lv=L('mg'),all=SPL.map((s,i)=>[s,i]),open=all.filter(x=>lv>=x[0].lv),nx=all.find(x=>lv<x[0].lv),RI={air:'Aire',earth:'Tierra',life:'Vida',water:'Agua',fire:'Fuego',arc:'Arcana'};
  h=`<h2>✨ Magia · nivel ${lv}</h2><div class="hint" style="margin:0 0 4px">Maná ${Math.floor(MN)}/${mnMax()} (regenera ${(mreg()*60).toFixed(1)}/min: mucho más lento que la vida; usa pociones de maná, comida con maná, bastón o amuleto). Los hechizos gastan maná y runas: las sueltan los monstruos al morir. Los pergaminos de Inscripción no gastan maná ni runas.</div><div style="margin-bottom:6px">${Object.keys(RI).map(k=>`<span class="chip ${(S.runes[k]||0)>0?'ok':'no'}" data-x="Runa de ${RI[k].toLowerCase()}: cae de los monstruos.">${ic('rn_'+k)} ${RI[k]} ${S.runes[k]||0}</span>`).join('')}</div>`+open.map(([s,i])=>{const can=MN>=s.mp&&hasRunes(s.r);return `<div class="row${can?'':' cant'}"><div style="min-width:0"><div>${s.e} <span class="nm">${s.n}</span></div><div class="hint" style="margin:0">${s.atk?'Proyectil: hasta '+spMax(s)+' de daño':s.d} · ${s.mp} maná · ${s.xp} XP</div><div>${Object.entries(s.r).map(([k,v])=>`<span class="chip ${(S.runes[k]||0)>=v?'ok':'no'}">${ic('rn_'+k)} ${RI[k]} ${S.runes[k]||0}/${v}</span>`).join('')}</div></div><button class="bt" ${can?'':'disabled'} onclick="cast(${i})">Lanzar</button></div>`}).join('')+(nx?far('Próximo hechizo: '+nx[0].n+' (nv. '+nx[0].lv+')'):'')+far('Con un bastón equipado, tus ataques lanzan solos tu mejor hechizo de ataque que puedas pagar.')}
 else if(TB==='col'){const ids=Object.keys(I).filter(k=>k!=='quemado'&&!k.includes('~')),n=ids.filter(k=>S.disc[k]).length;h=`<h2>📖 Colección ${n}/${ids.length}</h2><div class="inv">`+ids.map(k=>S.disc[k]?`<div class="slot" data-i="${k}"${rr(k)?' style="border:2px solid '+RAR[rr(k)][1]+'"':''}>${ic(k)}</div>`:'<div class="slot" style="opacity:.35" data-x="Aún no descubierto">❔</div>').join('')+'</div>'+far('Cada objeto nuevo cuenta para misiones de colección.')}
 else if(TB==='bank'){h=!nearS('bank')?far('Acércate al banco (el cofre del campamento) y tócalo.'):`<button class="bt" onclick="depAll()">Depositar todo</button>`+Object.entries(S.bank).filter(e=>e[1]>0).map(([k,v])=>`<div class="row"><span data-i="${k}">${ic(k)} ${I[k][0]} x${v}</span><span><button class="bt" onclick="wd('${k}',1)">1</button> <button class="bt" onclick="wd('${k}',99)">Todo</button></span></div>`).join('')}
 else if(TB==='shop'){if(!nearS('shop'))h=far('Acércate al puesto de Ru, en la plaza, y tócalo.');else{const ids=[...new Set(S.inv)],mm=1+.1*S.merc;let tot=0;S.inv.forEach(x=>tot+=I[x][2]);const H2='<h2 style="margin-top:12px">';
  h='<h2>🏪 Ru · Tienda</h2><div class="hint" style="margin:0 0 6px">Vende lo que te sobra y mejora a tu personaje para siempre. Bonus de venta: +'+Math.round((mm-1)*100)+'%</div><h2>Vender</h2>'+(ids.length?ids.map(id=>`<div class="row"><span data-i="${id}">${ic(id)} ${I[id][0]} x${count(id)}</span><button class="bt" onclick="sell('${id}')">${Math.round(count(id)*I[id][2]*mm)}</button></div>`).join('')+`<div class="row"><b>Todo</b><button class="bt" onclick="sellAll()">${Math.round(tot*mm)}</button></div>`:far('Inventario vacío.'))
  +H2+'Mejoras permanentes</h2>'+UP.map((u,i)=>{const lv=S[u[0]]||0,c=u[3][lv],mx=u[3].length,no=c==null||S.coins<c;return `<div class="row${no?' cant':''}"><div style="min-width:0"><div><span class="nm">${u[1]}</span> <span class="hint">nv. ${lv}/${mx}</span></div><div class="hint" style="margin:0">${u[2]}</div></div><button class="bt" ${no?'disabled':''} onclick="buyU('${u[0]}',${i})">${c==null?'Máx':fmt(c)}</button></div>`}).join('')
  +H2+'Runas de viaje rápido</h2>'+BI.slice(0,S.st.bio).map((b,k)=>{const id='rv_'+k,own=count(id)>0||S.bank[id]>0,c=RVC[k],no=own||S.coins<c;return `<div class="row${no?' cant':''}"><div style="min-width:0"><div><span class="nm" data-i="${id}">${ic(id)} ${I[id][0]}</span></div><div class="hint" style="margin:0">Reutilizable · enfriamiento 45 s · no en combate</div></div><button class="bt" ${no?'disabled':''} onclick="buyRV(${k})">${own?'Tienes':fmt(c)}</button></div>`}).join('')}}
 else{const s=S.stn;h=!s||!near(s)?far('Acércate a una estación (fogata, horno, yunque o taller) y tócala.'):s.sks.map(sk=>{
  const fl=a=>!(sk==='sm'&&(s.id==='furnace')!==(typeof a[2]==='string'&&a[2].startsWith('b_'))),lv=L(sk),all=ACT[sk].map((a,i)=>[a,i]).filter(x=>fl(x[0])),open=all.filter(x=>lv>=rq(x[0])),nx=all.find(x=>lv<rq(x[0]));
  return `<h2>${SK[sk][1]} ${SK[sk][0]} · nivel ${lv}</h2>`+open.map(([a,i])=>{const on=A&&A.ty==='c'&&A.i===i&&A.sk===sk,own=ownT(a),o=a[2]&&a[2].startsWith('rn_')?a[2].split(':')[0]:a[2],isT=o&&o.startsWith('tl:'),can=!own&&hasIn(a[1]),
   ico=o?ic(o):ic(Object.keys(a[1])[0]),
   tt=isT?'data-x="Se equipa sola. Cada tier acorta el tiempo entre golpes y reduce los golpes necesarios por recurso."':o?'data-i="'+o+'"':'',
   have=own?'(ya la tienes)':o&&!isT?(o.startsWith('rn_')?'(en bolsa: '+(S.runes[o.slice(3)]||0)+')':'(tienes '+count(o)+')'):'',hl=(o&&I[o]&&I[o][3]?' · cura '+I[o][3]+' PV':'')+(o&&I[o]&&I[o][4]?' · +'+I[o][4]+' maná':''),
   bt=own?'<button class="bt" disabled>Equipada</button>':`<button class="bt ${on?'stop':''}" ${can||on?'':'disabled'} onclick="${on?'stopA()':`startC('${sk}',${i})`}">${on?'Parar':sk==='co'?'Cocinar':'Hacer'}</button>`;
   return `<div class="row${can||on?'':' cant'}"><div style="min-width:0"><div ${tt}>${ico} <span class="nm">${a[0]}</span> <span class="hint">${have}</span></div><div>${chips(a[1])}</div><div class="hint" style="margin:0">${xv(a)} XP${hl}${a[2]&&a[2].startsWith('rn_')?' · da '+a[2].split(':')[1]+' runas':''}</div></div><span>${bt}</span></div>`}).join('')+(sk==='co'?far('🎲 Al cocinar puede aparecer un minijuego bonus: acierta en la zona verde para ganar más XP y un plato extra.'):'')+(nx?far('Próximo desbloqueo: '+nx[0][0]+' (nv. '+rq(nx[0])+')'):'')}).join('')+qtyBar()}
 $('#pn').innerHTML=h;$('#goals').innerHTML=goalsHTML();$('#hd').innerHTML=`Oro <b>${fmt(S.coins)}</b> · Nivel total <b>${SKL.reduce((s,k)=>s+L(k),0)}</b> <button class="bt" onclick="mut()">${S.mute?'🔇':'🔊'}</button>`}

// ---------- inicio ----------
SKL.forEach(k=>S.st['lvl:'+k]=L(k));S.st.tot=SKL.reduce((s,k)=>s+L(k),0);
if(S.cur&&ACT[S.cur.sk]&&ACT[S.cur.sk][S.cur.i]&&Date.now()-S.t>15000)offline(Date.now()-S.t,S.cur.sk,S.cur.i);S.cur=null;
setInterval(save,5000);$('#mv').value=S.mv;$('#sv').value=S.sv;$('#mv').oninput=e=>{S.mv=+e.target.value;save()};$('#sv').oninput=e=>{S.sv=+e.target.value;save()};autoBtn();log(logs[0]);tab('inv');
let last=performance.now();
function loop(now){DT=Math.min(.05,(now-last)/1000);last=now;upd(DT,now);bgm(now,DT);draw(now);if(dirty&&!pd&&now-lr>250){dirty=0;lr=now;panel()}requestAnimationFrame(loop)}
requestAnimationFrame(loop);
