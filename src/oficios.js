// OFGEAR — Equipo de OFICIO por tier (estilo FF14), L1c, 22 oct 2026. Plan: docs/PLAN_OFICIOS_FF14.md §5c, §5d, §5g, §5i.
// Hoy: Herrería (sm) con 5 ranuras (martillo, tenazas, gorro, delantal, guantes) × 11 tiers; Maña/Pulso/PO alimentan la Hoja de trabajo (workui.js → gear()).
// Los demás oficios entran añadiendo una fila a OFD. Se carga DESPUÉS de game.js (usa I, ACT, TI, WO, L, S, add, cap, log, snd, dirty, sfx…).
// Las herramientas de recolección (hacha, pico, caña) siguen en S.tool/TOOLT hasta el rework de recolección (Puntos de Recolección).
const OFGEAR=(()=>{
  // Un tier cada 9 niveles de oficio (X = 9, decidido 22 oct). Aspecto por cultura (solo estético): CULT[i] = cultura del bioma del tier (0 Pradera … ; el resto se rellena con cada bioma).
  const TLV=[1,10,19,28,37,46,55,64,73,82,91],CULT=[0,0,0,1,1,2,3,3,4,5,5];
  const OFD={
    sm:{n:'Herrería',slots:{m:'Martillo',s:'Tenazas',h:'Gorro de fragua',d:'Delantal de herrero',g:'Guantes de herrero'},mk:{m:'sm',s:'sm',h:'pe',d:'pe',g:'pe'}}
  };
  const SLOT_ORD=['m','s','h','d','g'];
  // reparto de atributos por ranura (× unidad del tier): mana = Maña (avance), pulso = Pulso (calidad), po = Puntos de oficio
  const W={m:{mana:1,po:.3},s:{pulso:1,po:.3},h:{po:1.2},d:{mana:.6,pulso:.6},g:{pulso:.5,po:.6}};
  const QB=[0,.06,.12,.20];   // bono de calidad (Normal, Superior, Excelente, Maestra): ver plan §5g-B; el techo (+20 %) queda por debajo del salto de tier
  const unit=t=>10+8*t;       // unidad base del tier (provisional, a calibrar con tools/work_sim.js)
  const G={};                  // id base → {of,slot,t,lv}
  const parse=id=>{const b=String(id||'').split('~')[0];return G[b]||null};
  const is=id=>!!parse(id);
  const q=id=>{const m=String(id).split('~')[1];return m?+m:0};
  function stats(id){const g=parse(id);if(!g)return null;const u=unit(g.t)*(1+QB[q(id)]),w=W[g.slot],o={};for(const k in w)o[k]=Math.round(u*w[k]);return o}
  // ---- generación por datos (items, recetas) ----
  function gen(){
    TI.forEach((t,i)=>{
      const tn=t[1],b='b_'+t[0],lv=TLV[i];
      for(const of in OFD){const d=OFD[of];
        for(const sl of SLOT_ORD){
          const id='og_'+of+'_'+sl+'_'+t[0],name=d.slots[sl]+' de '+tn;   // el sufijo es el ID DEL TIER (cobre, estano…), como sw_/ar_/ax_ (REGLAS_CREACION §13)
          G[id]={of,slot:sl,t:i,lv};
          I[id]=[name,sl==='m'?'🔨':sl==='s'?'🥢':sl==='h'?'🎩':sl==='d'?'🧥':'🧤',30+i*60];
          const mk=d.mk[sl],ing=(sl==='m'||sl==='s')?{[b]:2,[WO[i][2]]:1}:{['cu_'+t[0]]:2+Math.ceil(i/2),[b]:1};
          if(ACT[mk]&&!ACT[mk].some(a=>a[2]===id)){const ms=2800+lv*40;ACT[mk].push([name,ing,id,lv,pxp(lv,ms),ms])}
        }}
    });
  }
  // ---- equipar / desequipar ----
  const eq=of=>{S.eqt=S.eqt||{};return S.eqt[of]=S.eqt[of]||{}};
  function equipFrom(i){
    const id=S.inv[i],g=parse(id);if(!g)return false;
    if(L(g.of)<g.lv){log('Necesitas '+SK[g.of][0]+' nivel '+g.lv+' para equipar '+I[id.split('~')[0]][0]+'.');return true}
    const e=eq(g.of),prev=e[g.slot];S.inv.splice(i,1);if(prev)S.inv.push(prev);e[g.slot]=id;
    snd('equip');dirty=1;log('Equipas: '+nm(id));render();return true}
  function unequip(of,sl){const e=eq(of),id=e[sl];if(!id)return;if(S.inv.length>=cap()){log('Inventario lleno.');return}S.inv.push(id);e[sl]=null;dirty=1;render()}
  const nm=id=>{const b=id.split('~')[0],qq=q(id);return I[b][0]+(qq?' ('+['','superior','excelente','maestra'][qq]+')':'')};
  /** Suma de Maña/Pulso/PO del equipo de un oficio (lo lee workui.js). */
  function bonus(of){const e=(S.eqt&&S.eqt[of])||{},o={mana:0,pulso:0,po:0};for(const sl in e){const s=e[sl]&&stats(e[sl]);if(s)for(const k in s)o[k]+=s[k]}return o}
  function desc(id){const g=parse(id),s=stats(id),T={mana:'Maña',pulso:'Pulso',po:'Puntos de oficio'};
    return '<span style="color:#e8cf94">Equipo de '+SK[g.of][0]+' · nivel '+g.lv+'</span><br>'+Object.keys(s).map(k=>'+'+s[k]+' '+T[k]).join(' · ')+(q(id)?'':'')}
  // ---- ventana «Equipo de oficio» (#ofw, arrastrable con winmove) ----
  let el=null,cur='sm';
  function render(){
    if(!el||el.style.display==='none')return;
    const d=OFD[cur],e=eq(cur),b=bonus(cur),T={mana:'Maña',pulso:'Pulso',po:'PO'};
    el.querySelector('#ofw-tabs').innerHTML=Object.keys(OFD).map(k=>'<button class="'+(k===cur?'on':'')+'" data-o="'+k+'">'+OFD[k].n+'<small>nv '+L(k)+'</small></button>').join('')+'<span class="mu">Más oficios pronto</span>';
    el.querySelector('#ofw-sl').innerHTML=SLOT_ORD.map(sl=>{const id=e[sl],s=id&&stats(id);
      return '<button class="ofs'+(id?' f':'')+'" data-s="'+sl+'"'+(id?' data-x="'+String(desc(id)).replace(/"/g,'&quot;')+'"':'')+'><span class="k">'+d.slots[sl]+'</span><b>'+(id?nm(id):'vacío')+'</b><small>'+(s?Object.keys(s).map(k=>'+'+s[k]+' '+T[k]).join(' · '):'Equípalo desde la mochila (clic)')+'</small></button>'}).join('');
    const ms=WK.mkStats(L(cur),b);el.querySelector('#ofw-st').innerHTML='<div><small>Maña</small><b>'+Math.round(ms.mana)+'</b><span>+'+b.mana+'</span></div><div><small>Pulso</small><b>'+Math.round(ms.pulso)+'</b><span>+'+b.pulso+'</span></div><div><small>Puntos de oficio</small><b>'+ms.po+'</b><span>+'+b.po+'</span></div>'}
  function open(of){
    if(of)cur=of;
    if(!el){el=document.createElement('div');el.id='ofw';
      el.innerHTML='<div class="ofh"><b>Equipo de oficio</b><button class="x" aria-label="Cerrar">✕</button></div><div id="ofw-tabs" class="oft"></div><div id="ofw-sl" class="ofl"></div><div id="ofw-st" class="ofst"></div><div class="mu ofn">Fabrica tus herramientas y ropa de oficio (Herrería y Artesanía). Un tier nuevo cada 9 niveles: el equipo sube Maña, Pulso y puntos de oficio.</div>';
      document.body.appendChild(el);
      el.addEventListener('mousedown',ev=>ev.stopPropagation());
      el.addEventListener('click',ev=>{const t=ev.target.closest('[data-o]'),s=ev.target.closest('[data-s]'),x=ev.target.closest('.x');if(x){close();return}if(t){cur=t.dataset.o;render();return}if(s)unequip(cur,s.dataset.s)});
    }
    el.style.display='block';render()}
  function close(){if(el)el.style.display='none'}
  const toggle=()=>{if(el&&el.style.display!=='none')close();else open()};
  gen();
  return {is,stats,bonus,equipFrom,unequip,open,close,toggle,desc,render,OFD,TLV,CULT,G,parse}
})();
