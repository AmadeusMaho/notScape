// MSET — SETS DE MONSTRUO (estilo Dofus), lotes N0.9-SETS-S1S2 y N0.9-SETS-S3S6 (3 nov 2026). Plan: docs/PLAN_SETS_MONSTRUO.md.
// Se carga DESPUÉS de oficios.js (usa I, LOOT, AR, LGL, GLL, SW, BOW, WB, WSP, SB, CST, ACT, MD, S, STS, pxp, RECN…). Cada set es de UN tier, con piezas propias (modelo en src/r3d/monstersets3d.js)
// y bonus por piezas equipadas: los tramos son ACUMULADOS (el 6 incluye el 5) y el tramo completo trae una pasiva única hecha con estados que ya existen.
// CÓMO AÑADIR UN SET: una entrada en SETS (piezas, mats, tramos, pasiva) + su generador 3D en monstersets3d.js (SET3D[id]) + su pasiva en onHit/mul/val/chargeEnd si hace falta.
// Integración con lo existente (equipar, vender, guardar funcionan solos): h/f/n/c = LOOT[id] (st suma en gs()) · a = AR[id] · l = LGL[id] · g = GLL[id] (+ extra por CST[id]) · w = copia de un arma de botín/fabricada
// (SW/BOW/SB/WB/WSP) con su familia en `wk` (dagger/great/bow: wKind() la lee con MSET.wk). ids: ms_<set>_<ranura>_<tier>. Ranuras: h casco · a peto · l pantalón · g guantes · f botas · c capa · n amuleto · w arma.
const MSET=(()=>{
  const SLN={h:'Casco',a:'Peto',l:'Pantalón',g:'Guantes',f:'Botas',c:'Capa',n:'Amuleto',w:'Arma'};
  const ORD=['h','a','l','g','f','c','w','n'];
  // materiales nuevos (los suelta un monstruo concreto, ver DROPS)
  const MAT={nucleo_gel:['Núcleo de gelatina','🟢',60],boton_hueso:['Botón de hueso','🦴',45],arpillera_emb:['Arpillera embrujada','🧵',55],sello_cabecilla:['Sello del Cabecilla','🔴',400],colmillo_gruk:['Colmillo de Gruk','🦷',900]};
  const DROPS={goblin:[['boton_hueso',.14]],goblinarq:[['boton_hueso',.12]],goblinsha:[['boton_hueso',.12]],espantapajaros:[['arpillera_emb',.15]]};   // [id, prob] se AÑADEN a MD[id].dr
  const RARE={k0:['sello_cabecilla',1],b0:['colmillo_gruk',1]};                                                                              // trofeos de Rufo (capitán) y Gruk (jefe): 1 por muerte
  const SETS={
    gel:{n:'Gelatinoso',r:1,tier:'cobre',mobs:['slime'],em:'🟢',col:'#5fd06a',
      pz:{
        h:{nm:'Capucha de gelatina',em:'🪖',of:'sa',lv:2,ing:{tela:2,gelatina:4},st:{def:1,hp:1}},
        f:{nm:'Botas de gelatina',em:'🥾',of:'sa',lv:3,ing:{tela:2,gelatina:4},st:{hp:1}},
        a:{nm:'Peto de gelatina',em:'🦺',of:'sa',lv:4,ing:{tela:4,gelatina:8,nucleo_gel:2},st:{},def:1},
        n:{nm:'Amuleto de gelatina',em:'📿',of:'jo',lv:5,ing:{gelatina:3,b_cobre:1,nucleo_gel:3},st:{hp:2,mana:1}}},
      tr:{2:{mana:1,esp:1},3:{hp:1,con:1},4:{def:1,con:1}},
      pasiva:{n:'Pegajoso',d:'Quien te golpea queda pegajoso: 35 % de ralentizarlo 2,5 s.'}},
    caz:{n:'Cazador de la Pradera',r:1,tier:'cobre',mobs:['conejo','cabra','zorrorojo','jabali','toro'],em:'🏹',col:'#9a6a34',
      pz:{
        h:{nm:'Gorro de cazador',em:'🧢',of:'pe',lv:2,ing:{cu_cobre:2,pata_conejo:2},st:{def:1,acc:1}},
        g:{nm:'Guantes de cazador',em:'🧤',of:'pe',lv:3,ing:{cu_cobre:2,hueso:2,cuerno_toro:1},st:{},def:.7},
        f:{nm:'Botas de cazador',em:'🥾',of:'pe',lv:3,ing:{cu_cobre:3,hueso:2,cola_zorro:1},st:{hp:1}},
        a:{nm:'Chaleco de cazador',em:'🦺',of:'pe',lv:5,ing:{cu_cobre:4,cuerno_cabra:2,grasa:1},st:{},def:1}},
      tr:{2:{acc:1,agi:1},3:{hp:1,con:1},4:{def:1,agi:1}},
      pasiva:{n:'Rastreador',d:'+12 % de daño a la fauna y +15 % de probabilidad de piel extra al desollar.'}},
    gob:{n:'Goblin',r:1,tier:'bronce',mobs:['goblin','goblinarq','goblinsha'],em:'🏴',col:'#6f8a3a',
      pz:{
        h:{nm:'Casco goblin',em:'🪖',of:'pe',lv:9,ing:{cu_bronce:2,hueso:3,boton_hueso:2,corona:1},st:{def:1,acc:1}},
        g:{nm:'Guantes goblin',em:'🧤',of:'pe',lv:9,ing:{cu_bronce:2,boton_hueso:2},st:{acc:1},def:.7},
        l:{nm:'Pantalón goblin',em:'👖',of:'pe',lv:10,ing:{cu_bronce:3,hueso:3},st:{},def:1},
        f:{nm:'Botas goblin',em:'🥾',of:'pe',lv:10,ing:{cu_bronce:3,hueso:2},st:{def:1,acc:1}},
        a:{nm:'Peto goblin',em:'🦺',of:'pe',lv:11,ing:{cu_bronce:4,hueso:4,boton_hueso:3},st:{hp:1},def:1},
        w:{nm:'Arco goblin',em:'🏹',of:'cr',lv:11,ing:{tb_roble:3,boton_hueso:3,amuleto_hueso:1,pluma:2},wk:'bow',src:'bw_roble'}},
      tr:{2:{acc:1,agi:1},3:{hp:1},4:{def:1,agi:1},5:{str:1,fue:1},6:{acc:1,agi:2}},
      pasiva:{n:'Flechas venenosas',d:'Tus flechas envenenan (25 %) y aciertan mejor a distancia.'}},
    esp:{n:'Espantapájaros',r:1,tier:'bronce',mobs:['espantapajaros'],em:'🌾',col:'#c8a850',
      pz:{
        h:{nm:'Sombrero de espantapájaros',em:'🎩',of:'sa',lv:9,ing:{tela:3,paja_emb:3,arpillera_emb:2},st:{def:1,mana:1}},
        g:{nm:'Guantes de arpillera',em:'🧤',of:'sa',lv:9,ing:{tela:2,paja_emb:2,arpillera_emb:2},st:{mana:1},def:.7},
        l:{nm:'Pantalón remendado',em:'👖',of:'sa',lv:10,ing:{tela:4,paja_emb:3},st:{},def:1},
        f:{nm:'Botas de paja',em:'🥾',of:'sa',lv:10,ing:{tela:3,paja_emb:2,arpillera_emb:2},st:{def:1,hp:1}},
        a:{nm:'Túnica de arpillera',em:'🦺',of:'sa',lv:11,ing:{tela:5,paja_emb:5,arpillera_emb:4},st:{hp:1},def:1},
        w:{nm:'Hoz del espantapájaros',em:'🗡️',of:'sm',lv:11,ing:{b_bronce:2,paja_emb:2,arpillera_emb:3},wk:'dagger',src:'lw_0d2'}},
      tr:{2:{mana:1,esp:1},3:{hp:1,int:1},4:{def:1,esp:1},5:{mana:1,int:1},6:{hp:1,esp:2}},
      pasiva:{n:'Pavor de cosecha',d:'15 % de causar Miedo al golpear (1,8 s).'}},
    ban:{n:'Bandido',r:2,tier:'bronce',mobs:['bandido','banasesino','k0'],em:'🥷',col:'#8a1c22',
      pz:{
        h:{nm:'Pañuelo de bandido',em:'🧣',of:'pe',lv:11,ing:{cu_bronce:2,panuelo_carmesi:2,antifaz:1},st:{acc:1,str:1}},
        g:{nm:'Guantes de bandido',em:'🧤',of:'pe',lv:11,ing:{cu_bronce:2,hueso:2},st:{},def:.7},
        l:{nm:'Pantalón de bandido',em:'👖',of:'pe',lv:12,ing:{cu_bronce:3,grasa:1},st:{},def:1},
        f:{nm:'Botas de bandido',em:'🥾',of:'pe',lv:12,ing:{cu_bronce:3,hueso:2},st:{def:1}},
        a:{nm:'Jubón de bandido',em:'🦺',of:'pe',lv:13,ing:{cu_bronce:4,grasa:2,sello_cabecilla:1},st:{},def:1},
        w:{nm:'Daga del cabecilla',em:'🗡️',of:'sm',lv:13,ing:{b_hierro:2,panuelo_carmesi:3},wk:'dagger',src:'lw_0d3'}},
      tr:{2:{acc:1,agi:1},3:{str:1,fue:1},4:{hp:1,agi:1},5:{str:1,agi:1},6:{acc:1,agi:2}},
      pasiva:{n:'Filo sucio',d:'Con daga, 30 % de causar sangrado.'}},
    orc:{n:'Orco',r:2,tier:'hierro',mobs:['orco','orcocampeon'],em:'👹',col:'#6a7a4a',
      pz:{
        h:{nm:'Yelmo orco',em:'🪖',of:'sm',lv:15,ing:{b_hierro:3,dientorco:2,hueso:2},st:{def:2,hp:1}},
        g:{nm:'Guanteletes orcos',em:'🧤',of:'sm',lv:15,ing:{b_hierro:2,hueso:2,colmillo_campeon:1},st:{str:1},def:1},
        l:{nm:'Grebas orcas',em:'👖',of:'sm',lv:16,ing:{b_hierro:4,piel_bronce:1},st:{},def:1},
        f:{nm:'Botas orcas',em:'🥾',of:'sm',lv:16,ing:{b_hierro:3,piel_bronce:2,colmillo_campeon:1},st:{def:1,hp:1}},
        a:{nm:'Peto orco',em:'🦺',of:'sm',lv:17,ing:{b_hierro:5,piel_bronce:2,dientorco:3},st:{hp:1},def:1},
        w:{nm:'Mandoble orco',em:'⚔️',of:'sm',lv:17,ing:{b_hierro:5,dientorco:3,colmillo_campeon:2},wk:'great',src:'lw_1m2'}},
      tr:{2:{hp:1,con:1},3:{def:1,fue:1},4:{str:1,fue:1},5:{hp:1,con:1},6:{def:1,fue:2}},
      pasiva:{n:'Brazo de hierro',d:'El mandoble gasta un 40 % menos de aguante y tu golpe cargado aturde 1,2 s.'}},
    gru:{n:'Gruk',r:3,tier:'hierro',mobs:['b0'],em:'👑',col:'#5a6a3a',
      pz:{
        h:{nm:'Yelmo de Gruk',em:'🪖',of:'sm',lv:16,ing:{b_hierro:4,colmillo_gruk:2},st:{def:2,hp:1},pide:'orc:h'},
        g:{nm:'Guanteletes de Gruk',em:'🧤',of:'sm',lv:16,ing:{b_hierro:3,piel_bronce:1},st:{str:1},def:1,pide:'orc:g'},
        l:{nm:'Grebas de Gruk',em:'👖',of:'sm',lv:17,ing:{b_hierro:5,piel_bronce:2},st:{hp:1},def:1,pide:'orc:l'},
        f:{nm:'Botas de Gruk',em:'🥾',of:'sm',lv:17,ing:{b_hierro:3,piel_bronce:2,hueso:3},st:{def:1,hp:2}},
        a:{nm:'Peto de Gruk',em:'🦺',of:'sm',lv:18,ing:{b_hierro:7,piel_bronce:3},st:{hp:2,str:1},def:1,pide:'orc:a'},
        c:{nm:'Capa de Gruk',em:'🧥',of:'sa',lv:18,ing:{tela:6,piel_bronce:3,colmillo_gruk:2},st:{def:1,hp:2}},
        w:{nm:'Maza de guerra de Gruk',em:'🔨',of:'sm',lv:19,ing:{b_hierro:6,colmillo_gruk:3,hueso:4},wk:'great',src:'lw_1m3'},
        n:{nm:'Amuleto de Gruk',em:'📿',of:'jo',lv:19,ing:{b_hierro:1,colmillo_gruk:2,nucleo_gel:2},st:{hp:3,str:1}}},
      tr:{2:{hp:1,con:1},3:{def:1,fue:1},4:{str:1,fue:1},5:{hp:1,con:1},6:{def:1,fue:2},7:{hp:1,con:2},8:{str:1,hp:1,fue:2,con:2}},
      pasiva:{n:'Onda de choque',d:'Tu golpe cargado lanza una onda que daña y aturde a los enemigos cercanos.'}}
  };
  const idOf=(s,sl)=>'ms_'+s+'_'+sl+'_'+SETS[s].tier;
  const parse=id=>{const m=/^ms_([a-z0-9]+)_([halgfncw])_/.exec(String(id||'').split('~')[0]);return m&&SETS[m[1]]?{set:m[1],slot:m[2]}:null};
  const is=id=>!!parse(id)||!!baseTier(id)||!!uq(id);
  const ofName=o=>({sa:'Sastrería',pe:'Peletería',sm:'Herrería',jo:'Joyería',cr:'Artesanía'})[o]||o;
  /** Copia las estadísticas de un arma existente (`src`) a un arma nueva: así el equilibrio de combate (SB/SW/BOW/WSP) lo sigue decidiendo la tabla original. */
  function regWeapon(id,src){if(BOW[src]!==undefined){BOW[id]=BOW[src];SB[id]=SB[src];WB[id]=BOW[src]}else{SW[id]=SW[src];SB[id]=SB[src];WB[id]=SW[src]}WSP[id]=WSP[src]||4}
  function gen(){
    for(const k in MAT)I[k]=MAT[k].slice();
    for(const m in DROPS)if(MD[m])DROPS[m].forEach(d=>{if(!MD[m].dr.some(x=>x[0]===d[0]))MD[m].dr.push(d.slice())});
    for(const m in RARE)if(MD[m]&&!MD[m].rare)MD[m].rare=RARE[m].slice();
    for(const s in SETS){const D=SETS[s],ti=TI.findIndex(t=>t[0]===D.tier);
      for(const sl in D.pz){const z=D.pz[sl],id=idOf(s,sl),st=Object.assign({},z.st);
        I[id]=[z.nm,z.em,40+ti*70+(sl==='w'?60:0)];
        if(sl==='a'||sl==='l'||sl==='g'){const T=sl==='a'?AR:sl==='l'?LGL:GLL,ex=()=>{for(let q=1;q<=3;q++){const v=id+'~'+q;I[v]=[I[id][0]+' ('+['','superior','excelente','maestra'][q]+')',I[id][1],Math.round(I[id][2]*[1,1.4,2.2,4][q])];T[v]=+(T[id]*(1+.1*q)).toFixed(1);CST[v]=CST[id]}};T[id]=Math.max(1,Math.round((sl==='a'?AR['ar_'+D.tier]||2:sl==='l'?LGL['lg_'+D.tier]||1:GLL['gl_'+D.tier]||1)*(z.def||1)));CST[id]=st;ex()}   /* variantes de calidad (superior/excelente/maestra) como el equipo normal: sin ellas qv() devolvía ids inexistentes */
        else if(sl==='w'){regWeapon(id,z.src);LOOT[id]={s:'w',r:D.r,k:0,st:{},ms:s}}
        else LOOT[id]={s:sl,r:D.r,k:0,st,ms:s};
        if(ACT[z.of]&&!ACT[z.of].some(a=>a[2]===id)){const ms=2900+z.lv*38,ing=Object.assign({},z.ing);if(z.pide){const[ps,psl]=z.pide.split(':');ing[idOf(ps,psl)]=1}
          ACT[z.of].push([z.nm,ing,id,z.lv,pxp(z.lv,ms),ms])}}}}
  // ═══ CAPAS FABRICABLES (una por tier, Sastrería) y SETS BASE por cultura (N0.9-SETS-S1) ═══
  /** TABLA DE RAREZA POR TIER: ya NO hay (todo común); se deja la tabla por si algún día se quiere un tier especial. */
  const TIERRAR=[0,0,0,0,0,0,0,0,0,0,0,0];   // decisión del dueño (3 nov): los TIERS no tienen rareza, todo blanco; las rarezas altas son exclusivas de sets, únicos y botín
  const TIERS=TI.map(t=>t[0]),ALV=[1,12,19,30,40,48,56,66,76,85,91,98];
  const capeQ=i=>i<4?1:i<8?2:3;                                  // calidad del modelo de capa (armor3d.js cape): sencilla · con ribete · completa
  function genCapes(){TI.forEach((t,i)=>{const id='cp_'+t[0],lv=ALV[i],k=Math.min(5,OFGEAR.CULT[i]);
    I[id]=['Capa de '+t[1],'🧥',50+i*60];
    LOOT[id]={s:'c',r:TIERRAR[i],k,st:{def:Math.round(1+i*.6),hp:Math.round(1+i*.8)},cp:i};
    if(ACT.sa&&!ACT.sa.some(a=>a[2]===id)){const ms=2900+lv*34;ACT.sa.push(['Capa de '+t[1],{tela:3+Math.ceil(i*.7),['b_'+t[0]]:1},id,lv,pxp(lv,ms),ms])}})}
  // set base: piezas de ARMADURA/ESCUDO/CAPA del MISMO tier (ar_, lg_, gl_, sh_, cp_, cualquier familia); 2–5 piezas dan un bonus pequeño ligado a la cultura del tier (misma tabla que OFGEAR.CULT)
  const BASE={0:{n:'Disciplina',st:['def','hp'],at:['con','fue']},1:{n:'Puntería',st:['acc','def'],at:['agi','con']},2:{n:'Resistencia',st:['hp','def'],at:['con','esp']},3:{n:'Escarcha',st:['hp','def'],at:['int','con']},4:{n:'Filo certero',st:['str','acc'],at:['agi','fue']},5:{n:'Brasas',st:['str','hp'],at:['fue','int']},9:{n:'Gracia celeste',st:['mana','hp'],at:['esp','int']},10:{n:'Espinas infernales',st:['str','def'],at:['fue','agi']}};
  const baseTier=id=>{const b=String(id||'').split('~')[0],m=/^(?:ar|lg|gl|sh)_(?:(?:cu|tu)_)?([a-z]+)$/.exec(b)||/^cp_([a-z]+)$/.exec(b);return m&&TIERS.includes(m[1])?m[1]:null};
  function baseCounts(){const c={};if(!S.eq)return c;['a','l','g','s','c'].forEach(sl=>{const t=baseTier(S.eq[sl]);if(t)c[t]=(c[t]||0)+1});return c}
  const baseDef=tier=>{const i=TIERS.indexOf(tier),B=BASE[OFGEAR.CULT[i]]||BASE[0],v=1+Math.floor(i/4);return{B,v,i,tr:{2:{[B.st[0]]:v,[B.at[0]]:1},3:{[B.st[1]]:v,[B.at[1]]:1},4:{[B.st[0]]:v,[B.at[0]]:1},5:{[B.st[1]]:v+1,[B.at[1]]:1}}}};   /* N0.9-ATRIBUTOS: cada tramo suma también atributos de su cultura */
  function baseStat(k){let t=0;const c=baseCounts();for(const tier in c){const n=c[tier];if(n<2)continue;const d=baseDef(tier);for(let q=2;q<=Math.min(5,n);q++)if(d.tr[q][k])t+=d.tr[q][k]}return t}
  function baseDesc(id){const tier=baseTier(id);if(!tier)return'';const n=baseCounts()[tier]||0,d=baseDef(tier);
    const rows=Object.keys(d.tr).map(q=>'<span style="color:'+(n>=+q?'#e8cf94':'#8a8274')+'">('+q+') '+fmt(d.tr[q])+'</span>').join('<br>');
    return '<span style="color:#9fe08a">Equipo de '+TI[d.i][1]+' · '+n+'/5 piezas</span> · '+d.B.n+'<br>'+rows}
  // ═══ OBJETOS ÚNICOS (un raro por monstruo, NO forma parte de ningún set; N0.9-UNICOS) ═══
  // Guiños (homenajes con nombre y diseño propios) a mitología y sagas conocidas. Cada uno: mob que lo suelta, 1/n por muerte, ranura, estadísticas, pasivas (PS), calidad (r 3 épico · 4 legendario),
  // arma con su modelo propio en monstersets3d.js (SETW['ms:un_<clave>']) o estadísticas copiadas de `src`; helm/capa: modelo de cultura k y calidad q 3 (armorInfo).
  const UQ={
    slime:{id:'un_rey_gel',nm:'Corona del Rey Gelatina',em:'👑',sl:'r',n:90,r:2,st:{hp:3},pa:{life:2},col:'#5fd06a',ic:['ring','#5fd06a'],tx:'Dicen que todo slime sueña con llevarla.'},
    conejo:{id:'un_reloj_conejo',nm:'Reloj del Conejo Blanco',em:'⏱️',sl:'n',n:110,r:2,st:{mana:2},pa:{haste:2.4},col:'#e8e0c0',ic:['amulet','#e8e0c0'],tx:'«¡Llego tarde, llego tarde!»'},
    cabra:{id:'un_cencerro',nm:'Cencerro del Pastor Alpino',em:'🔔',sl:'n',n:110,r:2,st:{hp:2,def:1},pa:{swift:2},col:'#d8b050',ic:['amulet','#d8b050'],tx:'Se oye desde la montaña más lejana.'},
    zorrorojo:{id:'un_cola_lunas',nm:'Cola de las Nueve Lunas',em:'🦊',sl:'c',n:140,r:2,st:{def:1,hp:2},pa:{swift:2,lucky:1.2},k:1,q:3,col:'#e8803a',ic:['cape','#e8803a'],tx:'Un kitsune joven perdió esta cola… y no la echa de menos.'},
    jabali:{id:'un_colmillo_bosque',nm:'Colmillo del Espíritu del Bosque',em:'🐗',sl:'r',n:140,r:2,st:{str:3},pa:{thorns:2,bleed:1.2},col:'#9ab05a',ic:['ring','#9ab05a'],tx:'El bosque recuerda a quien lo respeta… y a quien no.'},
    toro:{id:'un_espada_heroe',nm:'Espada del Héroe Dormido',em:'🗡️',sl:'w',n:260,r:4,pa:{crit:1.6,precise:1.2},wk:'sword',src:'sw_acero',col:'#9fd0ff',ic:['sword','#9fd0ff'],tx:'Espera en silencio a quien despierte de verdad.'},
    goblin:{id:'un_gorro_aventurero',nm:'Gorro del Aventurero Silvestre',em:'🧢',sl:'h',n:100,r:2,st:{def:1,acc:2},pa:{lucky:1.6,gsage:1.4},k:1,q:2,col:'#5a8a3a',ic:['helm','#5a8a3a'],tx:'Verde, puntiagudo y sospechosamente heroico.'},
    goblinarq:{id:'un_arco_hada',nm:'Arco de la Hada Cazadora',em:'🏹',sl:'w',n:200,r:3,pa:{precise:1.6,double:1.4},wk:'bow',src:'bw_roble',col:'#cfe8ff',ic:['bow','#cfe8ff'],tx:'Una luz diminuta revolotea alrededor de la cuerda.'},
    goblinsha:{id:'un_ocarina_hueso',nm:'Ocarina de Hueso',em:'🎶',sl:'n',n:110,r:2,st:{mana:3},pa:{echo:1.6,savant:1.2},col:'#e8e0c0',ic:['amulet','#e8e0c0'],tx:'Su melodía abre puertas que nadie sabía que existían.'},
    espantapajaros:{id:'un_sombrero_cuervo',nm:'Sombrero del Cuervo Sabio',em:'🎩',sl:'h',n:100,r:2,st:{mana:2,def:1},pa:{savant:1.8,echo:1.2},k:0,q:3,col:'#6a5a8a',ic:['helm','#6a5a8a'],tx:'Los cuervos le piden consejo; él pide un cerebro.'},
    bandido:{id:'un_anillo_susurrante',nm:'Anillo Susurrante',em:'💍',sl:'r',n:140,r:2,st:{acc:2},pa:{lucky:2,prosp:1.6},col:'#d8b050',ic:['ring','#d8b050'],tx:'Un anillo para encontrarlos a todos… y no devolverlos.'},
    banasesino:{id:'un_hoja_oculta',nm:'Hoja Oculta',em:'🗡️',sl:'w',n:110,r:3,pa:{exec:1.6,bleed:1.4},wk:'dagger',src:'lw_0d3',col:'#b8bcc4',ic:['dagger','#b8bcc4'],tx:'«Nada es verdad; todo está permitido.»'},
    orco:{id:'un_escudo_olvidado',nm:'Escudo del Reino Olvidado',em:'🛡️',sl:'s',n:140,r:3,st:{def:3},pa:{stone:1.4,thorns:1.2},col:'#4a6aaa',ic:['shield','#4a6aaa'],tx:'Perteneció a un reino cuyo nombre se perdió con la última canción.'},
    orcocampeon:{id:'un_hoja_escarcha',nm:'Hoja Huérfana de Escarcha',em:'❄️',sl:'w',n:110,r:3,pa:{stun:1.6,siph:1.6},wk:'great',src:'lw_1m3',col:'#9fd8ff',ic:['greatsword','#9fd8ff'],tx:'Su antiguo portador aún la busca entre la ventisca.'},
    k0:{id:'un_capa_carmesi',nm:'Capa del Cabecilla Carmesí',em:'🧥',sl:'c',n:4,r:3,st:{def:2,hp:3},pa:{haste:2,crit:1.4},k:4,q:3,col:'#8a1c22',ic:['cape','#8a1c22'],tx:'Roja como la deuda que jamás pagó.'},
    b0:{id:'un_cuerno_rey',nm:'Cuerno del Rey Orco',em:'📯',sl:'n',n:3,r:3,st:{hp:4,str:2},pa:{thorns:2,stone:1.6,frenzy:1.6},col:'#c8a24a',ic:['amulet','#c8a24a'],tx:'Su eco hace temblar hasta a los que lo tocan.'}};
  const UQID={};for(const m in UQ){UQ[m].mob=m;UQID[UQ[m].id]=UQ[m]}
  const uq=id=>UQID[String(id||'').split('~')[0]]||null;
  /* N0.9-ATRIBUTOS: atributos de los únicos (presupuesto ≈ 5 azul · 6 épico · 7 legendario) */
  const UQA={un_rey_gel:{con:3,esp:2},un_reloj_conejo:{agi:3,int:2},un_cencerro:{con:3,agi:2},un_cola_lunas:{agi:4,esp:2},un_colmillo_bosque:{fue:3,con:2},un_espada_heroe:{fue:4,con:3},un_gorro_aventurero:{agi:3,con:2},un_arco_hada:{agi:4,esp:2},un_ocarina_hueso:{esp:3,int:2},un_sombrero_cuervo:{int:3,esp:2},un_anillo_susurrante:{agi:3,int:2},un_hoja_oculta:{agi:4,fue:2},un_escudo_olvidado:{con:4,fue:2},un_hoja_escarcha:{agi:3,int:3},un_capa_carmesi:{agi:4,fue:2},un_cuerno_rey:{fue:4,con:2}};
  function genUniq(){for(const m in UQ){const u=UQ[m],id=u.id;I[id]=[u.nm,u.em,400+u.r*300];
    const pa=Object.keys(u.pa).map(k=>({id:k,v:+((PS[k]?PS[k].b:5)*u.pa[k]).toFixed(1)}));
    if(u.sl==='w')regWeapon(id,u.src);LOOT[id]={s:u.sl,r:u.r,k:u.k||0,st:Object.assign({},u.st||{},UQA[id]||{}),pa,uq:1,tx:u.tx}}}
  /** Se llama desde rollLoot: ¿suelta este monstruo su objeto único? (1/n, la suerte ayuda) */
  function rollUniq(m){const u=m&&m.d&&UQ[m.d.id];if(!u)return;if(Math.random()<(1+.25*(S.luck||0))/u.n){dropGround(u.id,m.x,m.y,{rare:1});try{inc('uniq');toast('<span style="color:'+RAR[u.r][1]+'">'+RAR[u.r][0]+' · único</span><br><b style="color:'+RAR[u.r][1]+'">'+u.em+' '+u.nm+'</b>',5500);snd('epic')}catch(e){}}}
  // ---- contador y bonus ----
  function eqPieces(s){const n=[];for(const sl in SETS[s].pz){const e=S.eq[sl];if(e&&String(e).split('~')[0]===idOf(s,sl))n.push(sl)}return n}
  const count=s=>eqPieces(s).length;
  const total=s=>Object.keys(SETS[s].pz).length;
  /** Suma de la estadística k de los tramos activos de todos los sets (la lee gs() de game.js). */
  function stat(k){let t=baseStat(k);for(const s in SETS){const c=count(s);if(c<2)continue;const tr=SETS[s].tr;for(const n in tr)if(c>=+n&&tr[n][k])t+=tr[n][k]}return t}
  const full=s=>count(s)>=total(s);
  const fk=()=>typeof wKind==='function'?wKind():null;
  // ---- armas: familia de combate ----
  /** Rareza FIJA de una pieza de set (la del set) o undefined si no lo es; la llama rr() de game.js. */
  const rarOf=id=>{const p=parse(id);return p?SETS[p.set].r:undefined};
  const wk=id=>{const p=parse(id);if(p)return p.slot==='w'?SETS[p.set].pz.w.wk:null;const u=uq(id);return u&&u.sl==='w'?u.wk:null};
  const twoH=id=>{const k=wk(id);return k==='great'||k==='bow'};
  /** Clave del modelo 3D propio de un arma de set (BUILD['ms:<clave>']) o undefined. */
  const wmodel=id=>{const p=parse(id);if(p)return p.slot==='w'?p.set:undefined;const u=uq(id);return u&&u.sl==='w'?u.id:undefined};
  const wcol=id=>{const p=parse(id);if(p)return p.slot==='w'?SETS[p.set].col:null;const u=uq(id);return u&&u.sl==='w'?u.col:null};
  // ---- pasivas únicas ----
  function onHurt(m,now){try{if(full('gel')&&m&&Math.random()<.35&&typeof STS!=='undefined'){STS.add(m,'slow',{dur:2500});if(typeof fText==='function'&&Math.random()<.5)fText('Pegajoso','#7ae07a',m.x,m.y,(m.d&&m.d.h||20)+8)}}catch(e){}}
  /** Cada golpe que das (procs de game.js). */
  function onHit(m,d,now){try{if(!m||!(d>0)||typeof STS==='undefined')return;
    if(full('gob')&&typeof wtype==='function'&&wtype()==='r'&&Math.random()<.25)STS.add(m,'poison',{dur:5000,v:1});
    if(full('esp')&&Math.random()<.15)STS.add(m,'fear',{dur:1800});
    if(full('ban')&&fk()==='dagger'&&Math.random()<.3)STS.add(m,'bleed',{dur:3000,v:1})}catch(e){}}
  /** Multiplicador de daño del jugador contra m (Rastreador: fauna). */
  function mul(m,sk,wt){try{if(full('caz')&&m&&m.d&&typeof SKINNABLE!=='undefined'&&SKINNABLE.includes(m.d.id))return 1.12}catch(e){}return 1}
  /** Bonus numérico de la pasiva (piel extra al desollar). */
  function val(k){return k==='skin'&&full('caz')?.15:0}
  /** Coste de aguante del mandoble (Brazo de hierro). */
  const grt=c=>full('orc')?Math.round(c*.6*10)/10:c;
  /** Al soltar un golpe cargado (k > mínimo): aturdimiento del orco y onda de choque de Gruk. */
  function chargeEnd(now){try{const orc=full('orc')&&fk()==='great',gru=full('gru')&&fk()==='great';if(!orc&&!gru)return;
    const R=gru?78:96;let n=0;for(const m of M){if(!alive(m,now)||sealed(m))continue;const dx=m.x-P.x,dy=m.y-P.y,dd=Math.hypot(dx,dy);if(dd>R+(m.d.w||16)*.3)continue;
      if(!gru){const a=Math.atan2(dy,dx),da=Math.abs(Math.atan2(Math.sin(a-(SWG.ang||0)),Math.cos(a-(SWG.ang||0))));if(da>1)continue}
      m.stun=Math.max(m.stun||0,now+1200);m.nt=Math.max(m.nt||0,now)+1200;n++;
      if(gru)hitM(m,Math.max(1,Math.round(maxHit()*.5)),now,'cb',99)}
    if(gru&&n){fText('Onda de choque','#c8b060',P.x,P.y,52);try{R3D.skill.play('grietas',{x:P.x,y:P.y,r:R,col:'#c8b060',col2:'#6a4a2a',life:.5})}catch(e){}try{sp(P.x,P.y,'#c8b060',14,120,70,150)}catch(e){}}
    else if(orc&&n)fText('¡Aturdido!','#e8cf94',P.x,P.y,52)}catch(e){}}
  // ---- texto de la descripción ----
  const T={hp:'Vida',def:'Defensa',mana:'Maná',acc:'Precisión',str:'Fuerza',mreg:'Reg. de maná',fue:'Fuerza',con:'Constitución',agi:'Agilidad',int:'Inteligencia',esp:'Espíritu'};
  const fmt=o=>Object.keys(o).map(k=>'+'+o[k]+' '+(T[k]||k)).join(' · ');
  function desc(id){const p=parse(id);if(!p){const u=uq(id);return u?'<span style="color:'+RAR[u.r][1]+'">Objeto único de '+(MD[u.mob]?MD[u.mob].n:u.mob)+' · 1 de cada '+u.n+'</span><br><i style="color:#8a8274">'+u.tx+'</i>':baseDesc(id)}const D=SETS[p.set],c=count(p.set),tt=total(p.set),z=D.pz[p.slot],have=eqPieces(p.set);
    const rows=Object.keys(D.tr).map(n=>{const on=c>=+n;return '<span style="color:'+(on?'#e8cf94':'#8a8274')+'">('+n+') '+fmt(D.tr[n])+'</span>'}).join('<br>');
    const pas='<span style="color:'+(c>=tt?'#9fe08a':'#8a8274')+'">('+tt+') '+D.pasiva.n+': '+D.pasiva.d+'</span>';
    const piezas=ORD.filter(sl=>D.pz[sl]).map(sl=>{const on=have.includes(sl);return '<span style="color:'+(on?'#e8cf94':'#8a8274')+'">'+(on?'✔ ':'· ')+D.pz[sl].nm+'</span>'}).join('<br>');
    const pide=z.pide?'<br><span style="color:#d8a24a">Pide: '+SETS[z.pide.split(':')[0]].pz[z.pide.split(':')[1]].nm+'</span>':'';
    const src=D.mobs.map(m=>MD[m]?MD[m].n:m).join(', ');
    return '<span style="color:#9fe08a">Set '+D.n+' · '+c+'/'+tt+' piezas</span> · '+SLN[p.slot]+'<br>'+piezas+'<br>'+rows+'<br>'+pas+pide+'<br><span style="color:#8a8274">Lo sueltan: '+src+' · se fabrica en '+ofName(z.of)+' (nivel '+z.lv+')</span>'}
  /** Avisa una vez al completar un set. */
  function check(){if(typeof S==='undefined'||!S.eq)return;S.msets=S.msets||{};for(const s in SETS)if(full(s)&&!S.msets[s]){S.msets[s]=1;try{if(typeof RECN!=='undefined')RECN.unlock({title:'Set completo',sub:'Set '+SETS[s].n,items:[{em:SETS[s].em,name:SETS[s].pasiva.n+': '+SETS[s].pasiva.d}]});if(typeof snd==='function')snd('lvl')}catch(e){}}}
  gen();genCapes();genUniq();
  /* POLÍTICA DE RAREZA (decisión del dueño, 3 nov): lo FABRICABLE no tiene rareza (blanco): ni el tier, ni la gema de una joya (an_/cl_), ni el nivel de una lente/mira de Ingeniería (ln_/mr_). Las rarezas altas son exclusivas de botín, sets, únicos y monturas. */
  for(const id in LOOT)if(/^(an|cl|ln|mr)_/.test(id)&&!LOOT[id].uq)LOOT[id].r=0;
  return{SETS,MAT,is,parse,count,total,stat,full,onHurt,onHit,mul,val,grt,chargeEnd,wk,twoH,wcol,wmodel,rarOf,TIERRAR,UQ,uq,rollUniq,desc,check,idOf,SLN,ORD}
})();
