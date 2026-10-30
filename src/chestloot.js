// NotScape · BOTÍN DE COFRES (30 oct 2026; el dueño: «los cofres no dan XP, dan objetos de una lista de drops, balanceado como en WoW»). Global `CLOOT`. Se carga ANTES de game.js; usa globales de game.js SOLO al llamar.
// Un cofre (POI `cofre`: campamentos, ruinas, minas, fortín, granja quemada, cementerio de caravana…) tira `1 + tier·1` TIRADAS sobre una tabla ponderada del bioma + UNA tirada aparte de EQUIPO (como el «bonus roll» de un cofre de mundo en WoW):
//   · tirada normal: materiales de oficio de SU bioma (peso ≈ 52 %) · consumibles (≈ 26 %) · bolsa de monedas (≈ 8 %) · y, solo en tier 2, materiales de la gama superior (`hi`, ≈ 14 %);
//   · tirada de equipo: calidad verde / azul / épica con probabilidad creciente con el tier y la suerte (`S.luck`): tier 1 → 16 % / 2,5 % / 0,2 % · tier 2 → 34 % / 8 % / 0,8 %. La pieza es del bioma (`lt_<k><ranura><q>` o arma `lw_<k>…`) como el botín de los enemigos;
//   · SIN experiencia (decisión del dueño). Lo que no cabe en la mochila cae al suelo junto al cofre.
// Valor esperado por cofre (tier 1 / tier 2): objetos 2,0 / 3,2 por cofre (materiales, consumibles y equipo) · bolsas de monedas 0,16 / 0,22 · equipo verde 16 % / 34 % · azul 2,5 % / 7,8 % · épico 0,24 % / 0,7 % (medido con 20 000 tiradas).
// Un bioma nuevo = una entrada en `T[k]` (ids de `I`; `ids_check.py` los comprueba). Cantidades [min,max], peso entero.
const CLOOT=(()=>{
 const T={
  0:{mat:[['b_cobre',1,3,12],['cu_cobre',1,2,9],['mj_lana',2,4,9],['tb_pino',1,3,8],['mn_pino',1,2,6],['bl_caliza',1,3,6],['h_manzanilla',2,4,8],['h_ortiga',1,3,5],['h_trebol',1,2,4],['b_bronce',1,2,5],['eng_engranaje_cobre',1,2,3],['pv_polvora',1,3,3],['gb_cuarzo',1,1,2],['gema',1,1,2],['perla',1,1,1],['nido',1,1,2]],
   use:[['pan',2,4,12],['pot_mana',1,2,5],['pot_spd',1,1,4],['pot_dmg',1,1,4],['pot_pr',1,1,3],['frasco',1,3,5]],
   hi:[['b_hierro',1,2,6],['cu_bronce',1,2,5],['eng_resorte_cobre',1,2,4],['gb_ambar',1,1,2],['h_lavanda',1,2,3]],coin:[25,60]}};
 const GQ={1:[.16,.025,.002],2:[.34,.08,.008]},SL=['h','f','r','n','w','c','s','l','g','m'];
 const rnd=(a,b)=>Math.floor(a+Math.random()*(b-a+1));
 const pickW=(L)=>{let s=0;for(const q of L)s+=q[3];let r=Math.random()*s;for(const q of L){r-=q[3];if(r<=0)return q}return L[0]};
 // devuelve [{id,n}] (+ {coins} si toca bolsa)
 function roll(k,tier,opt){const t=T[k]||T[0],tr=Math.max(1,Math.min(2,tier|0||1)),out=[],o=opt||{};let coins=0;
  const rolls=1+tr;for(let i=0;i<rolls;i++){const r=Math.random();
   if(r<.08){coins+=rnd(t.coin[0],t.coin[1])*tr}
   else if(r<.34){const q=pickW(t.use);out.push({id:q[0],n:rnd(q[1],q[2])})}
   else if(tr>1&&r<.48){const q=pickW(t.hi);out.push({id:q[0],n:rnd(q[1],q[2])})}
   else{const q=pickW(t.mat);out.push({id:q[0],n:rnd(q[1],q[2])})}}
  if(o.gear!==false){const g=GQ[tr],lk=1+.25*(S.luck||0),x=Math.random();let q=0;if(x<g[2]*lk)q=3;else if(x<(g[2]+g[1])*lk)q=2;else if(x<(g[2]+g[1]+g[0])*lk)q=1;
   if(q){const sl=SL[rnd(0,SL.length-1)],id=sl==='w'?(typeof ENCH!=='undefined'?ENCH.lootRoll('lw_'+k+'dmbc'[rnd(0,3)]+q,q):'lw_'+k+'dmbc'[rnd(0,3)]+q):'lt_'+k+sl+q;if(I[id])out.push({id,n:1,q})}}
  if(coins)out.push({coins});return out}
 // entrega al jugador (o al suelo si no cabe); devuelve el HTML del aviso
 function grant(list,x,y){const tx=[];for(const it of list){
   if(it.coins){earn(it.coins);tx.push('+'+money(it.coins));continue}
   let got=0;for(let i=0;i<it.n;i++){if(room(it.id)){add(it.id);got++}else dropGround(it.id,x+rnd(-24,24),y+rnd(-24,24))}
   const q=it.q||0,col=q?RAR[q][1]:'#e8dcc0';tx.push(ic(it.id)+' <span style="color:'+col+'">'+(it.n>1?it.n+'× ':'')+I[it.id][0]+'</span>'+(got<it.n?' <i>(al suelo)</i>':''))}
  return tx.join('<br>')}
 // abrir un cofre de POI: marca, aviso y guardado (sin XP)
 function open(e){const k=e.k!=null?e.k:0,list=roll(k,e.tier||1),tx=grant(list,e.x,e.y);e.n='cofreAbierto';toast('🧰 <b>'+e.nm+'</b><br>'+(tx||'Vacío…'),4600);log('🧰 '+e.nm+': '+tx.replace(/<br>/g,' · ').replace(/<[^>]+>/g,''));if(list.some(i=>i.q>=2))snd('epic');dirty=1;save();return list}
 return{T,roll,grant,open,GQ}})();
