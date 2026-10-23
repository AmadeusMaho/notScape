// WK — núcleo de la «Hoja de trabajo» (crafteo estilo FF14). Solo lógica, sin DOM ni dibujo (L0a, 22 oct 2026).
// Plan y tablas: docs/PLAN_OFICIOS_FF14.md. Sin Math.random: PRNG con semilla (regla online). Una acción nueva = una fila en A.
const WK=(()=>{
  const MAXIQ=10, DUR_STEP=10;
  const PROG0=3.6,PROG1=.035,QUAL0=6.5,QUAL1=.14;   // dificultad de receta (unidades de «100 %»), a calibrar
  // Condiciones: m = multiplicador de Calidad. Las avanzadas (sólida, pliante…) salen con nivel de oficio >= ADV.
  const ADV=40;
  const CONDS={
    normal:{n:'Normal'}, buena:{n:'Buena',q:1.5}, excelente:{n:'Excelente',q:4}, mala:{n:'Mala',q:.5},
    centrada:{n:'Centrada'}, solida:{n:'Sólida'}, pliante:{n:'Pliante'}, eficiente:{n:'Eficiente'}, expectante:{n:'Expectante'}, estelar:{n:'Estelar'}
  };
  // t: p avance · q calidad · b estado · r reparación · u utilidad. e = eficiencia %. d = coste de Resistencia (x10). ok(s) = requisitos extra.
  const first=s=>s.step===1, good=s=>s.cond==='buena'||s.cond==='excelente'||s.hs;
  const noWaste=s=>!(s.b.wn||s.b.wn2);
  const A={
    sb:{n:'Síntesis básica',lv:1,po:0,t:'p',e:120},
    tb:{n:'Toque básico',lv:5,po:18,t:'q',e:100},
    mm_:{n:'Reparación del maestro',lv:7,po:88,t:'r',fn:s=>{s.dur=Math.min(s.durMax,s.dur+30)}},
    ht:{n:'Toque apresurado',lv:9,po:0,t:'q',e:100,pr:.6},
    rs:{n:'Síntesis rápida',lv:9,po:0,t:'p',e:500,pr:.5},
    ob:{n:'Observar',lv:13,po:7,t:'u',fn:s=>{s.obs=true}},
    tt:{n:'Trucos del oficio',lv:13,po:0,t:'u',ok:good,fn:s=>{s.po=Math.min(s.poMax,s.po+20)}},
    wn:{n:'Sin desperdicio',lv:15,po:56,t:'b',fn:s=>{s.b.wn=4;s.b.wn2=0}},
    ve:{n:'Veneración',lv:15,po:18,t:'b',fn:s=>{s.b.ve=4}},
    ts:{n:'Toque estándar',lv:18,po:32,t:'q',e:125,combo:['tb'],cpo:18},
    gs:{n:'Gran avance',lv:21,po:32,t:'b',fn:s=>{s.b.gs=3}},
    inn:{n:'Innovación',lv:26,po:18,t:'b',fn:s=>{s.b.inn=4}},
    fa:{n:'Tasación final',lv:42,po:1,t:'b',fn:s=>{s.b.fa=5}},
    wn2:{n:'Sin desperdicio II',lv:47,po:98,t:'b',fn:s=>{s.b.wn2=8;s.b.wn=0}},
    by:{n:'Bendición de Byregot',lv:50,po:24,t:'q',ok:s=>s.iq>0,eFn:s=>100+20*s.iq,after:s=>{s.iq=0}},
    pt:{n:'Toque preciso',lv:53,po:18,t:'q',e:150,ok:good,iq:2},
    mu:{n:'Memoria muscular',lv:54,po:6,t:'p',e:300,ok:first,fn:s=>{s.b.mu=5}},
    co:{n:'Observación atenta',lv:55,po:0,t:'u',spec:true,max:3,fn:s=>{rollCond(s)}},
    cs:{n:'Síntesis cuidadosa',lv:62,po:7,t:'p',e:180},
    ma:{n:'Manipulación',lv:65,po:96,t:'b',fn:s=>{s.b.ma=8}},
    pdt:{n:'Toque prudente',lv:66,po:25,t:'q',e:100,d:.5,ok:noWaste},
    rf:{n:'Reflejo',lv:69,po:6,t:'q',e:100,ok:first,iq:2},
    pp:{n:'Toque preparatorio',lv:71,po:40,t:'q',e:200,d:2,iq:2},
    gw:{n:'Cimientos',lv:72,po:18,t:'p',e:360,d:2,low:true},
    de:{n:'Síntesis delicada',lv:76,po:32,t:'pq',e:100},
    is:{n:'Síntesis intensiva',lv:78,po:6,t:'p',e:400,ok:good},
    at:{n:'Toque avanzado',lv:84,po:46,t:'q',e:150,combo:['ts'],cpo:18},
    ps:{n:'Síntesis prudente',lv:88,po:18,t:'p',e:180,d:.5,ok:noWaste},
    te:{n:'Ojo entrenado',lv:90,po:250,t:'q',ok:(s,c)=>first(s)&&s.recLvl+10<=c.lvl,fn:s=>{s.qual=s.qualMax}},
    tf:{n:'Maestría entrenada',lv:90,po:32,t:'q',e:100,d:0,ok:s=>s.iq>=MAXIQ},
    rt:{n:'Toque refinado',lv:92,po:24,t:'q',e:100,combo:['tb'],iq:2},
    qi:{n:'Innovación rápida',lv:96,po:0,t:'b',max:1,fn:s=>{s.b.inn=1}},
    im:{n:'Reparación inmaculada',lv:98,po:112,t:'r',max:1,fn:s=>{s.dur=s.durMax}},
    tp_:{n:'Perfección entrenada',lv:99,po:0,t:'b',max:1,fn:s=>{s.b.tp=1}},
    hs:{n:'Corazón y alma',lv:86,po:0,t:'u',spec:true,max:1,fn:s=>{s.hs=true}},
    // ---- exclusivas de HERRERÍA (of:'sm'): relleno de la cadencia de desbloqueos (hueco 26→42 de las comunes) ----
    gd:{of:'sm',n:'Golpe doble',lv:11,po:24,t:'p',e:220,d:2},
    es_:{of:'sm',n:'Estirar',lv:23,po:20,t:'p',e:150,fn:s=>{s.iq=Math.min(MAXIQ,s.iq+1)}},
    fc:{of:'sm',n:'Forja en caliente',lv:30,po:36,t:'b',fn:s=>{s.b.ve=4;s.iq=Math.min(MAXIQ,s.iq+1)}},
    tm:{of:'sm',n:'Templar',lv:36,po:60,t:'r',fn:s=>{s.dur=Math.min(s.durMax,s.dur+20);s.b.wn=3;s.b.wn2=0}},
    rm:{of:'sm',n:'Remachar',lv:45,po:32,t:'q',e:160,ok:s=>s.iq>=3}
  };
  const IDS=Object.keys(A);
  // PRNG mulberry32 (sin Math.random).
  function rnd(s){let t=s.seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);s.rn=((t^t>>>14)>>>0)/4294967296;return s.rn}
  function rollCond(s){
    const adv=s.lvl>=ADV,r=rnd(s),prev=s.cond;
    if(prev==='excelente'){s.cond='mala';return}
    if(prev==='mala'||prev==='estelar'||prev==='expectante'&&false){s.cond='normal';return}
    let c='normal';
    if(r<.04)c='excelente';
    else if(r<.22)c='buena';
    else if(adv&&r<.30)c=['centrada','solida','pliante','eficiente','expectante','estelar'][Math.floor(rnd(s)*6)];
    s.cond=c;
  }
  /** receta: {prog, qual, dur, lvl} · stats: {lvl, mana, pulso, po, seed} */
  function start(rec,st){
    const s={prog:0,progMax:rec.prog,qual:0,qualMax:rec.qual,dur:rec.dur||60,durMax:rec.dur||60,
      po:st.po,poMax:st.po,iq:0,step:1,cond:'normal',b:{},seed:(st.seed|0)||((Math.random()*4294967296)|0)||1,   // sin semilla = azar normal (el dueño lo permite para tiradas de crafteo); con semilla = pruebas repetibles
      rn:0,hs:false,obs:false,last:null,
      of:st.of||'sm',lvl:st.lvl,mana:st.mana,pulso:st.pulso,recLvl:rec.lvl||1,uses:{},over:false,ok:false,hist:[]};
    return s;
  }
  const avail=(id,lvl)=>!!A[id]&&A[id].lv<=lvl;
  function cost(s,id){
    const a=A[id];let c=a.po;
    if(a.combo&&a.combo.includes(s.last))c=a.cpo!=null?a.cpo:c;
    if(s.cond==='pliante')c=Math.ceil(c/2);
    return c;
  }
  /** ¿se puede usar? devuelve '' o el motivo (texto corto). */
  function can(s,id){
    const a=A[id];
    if(s.over)return 'La pieza ya terminó';
    if(!a)return 'Acción desconocida';
    if(a.of&&a.of!==s.of)return 'Otro oficio';
    if(!avail(id,s.lvl))return 'Nivel '+a.lv;
    if(s.po<cost(s,id))return 'Faltan puntos de oficio';
    if(a.max&&(s.uses[id]||0)>=a.max)return 'Sin usos';
    if(a.ok&&!a.ok(s,s))return 'Requisitos no cumplidos';
    return '';
  }
  const dmod=(s,a)=>{
    if(s.b.tp)return 0;
    let d=DUR_STEP*(a.d!=null?a.d:1);
    if(s.b.wn||s.b.wn2)d*=.5;
    if(s.cond==='solida')d*=.5;
    return Math.ceil(d);
  };
  function use(s,id){
    const why=can(s,id);if(why)return {ok:false,why};
    const a=A[id];
    s.po-=cost(s,id);s.uses[id]=(s.uses[id]||0)+1;
    const wasFirstBuff=s.b;let hit=true;
    if(a.pr){let p=a.pr+(s.cond==='centrada'?.25:0);if(id==='ht'&&s.cond==='estelar')p=1;hit=rnd(s)<p}
    const hadHS=s.hs&&(a.ok===good);
    if(a.e||a.eFn){
      const e=a.eFn?a.eFn(s):a.e;
      if(hit&&(a.t==='p'||a.t==='pq')){
        let m=1+(s.b.ve?.5:0)+(s.b.mu&&a.t!=='pq'?1:0);
        if(s.cond==='eficiente')m*=1.5;
        if(a.low&&s.dur<dmod(s,a))m*=.5;
        let gain=Math.max(1,Math.floor((10+s.mana*.1)*e/100*m));
        if(s.b.mu&&a.t==='p'){s.b.mu=0}
        s.prog+=gain;
        if(s.b.fa&&s.prog>=s.progMax){s.prog=s.progMax-1;s.b.fa=0}
      }
      if(hit&&(a.t==='q'||a.t==='pq')){
        let m=1+(s.b.inn?.5:0)+(s.b.gs?1:0);
        m*= (CONDS[s.cond].q||1);
        if(s.b.gs)s.b.gs=0;
        m*=1+s.iq*.1;
        s.qual+=Math.max(1,Math.floor((8+s.pulso*.1)*e/100*m));
        if(a.iq)s.iq=Math.min(MAXIQ,s.iq+a.iq);else if(!a.after)s.iq=Math.min(MAXIQ,s.iq+1);
      }
    }
    if(a.fn)a.fn(s);
    if(a.after)a.after(s);
    if(hadHS)s.hs=false;
    // Resistencia (las acciones de estado y utilidad no gastan)
    if(a.t==='p'||a.t==='q'||a.t==='pq'){const d=dmod(s,a);if(d&&s.b.tp&&id!=='tp_')s.b.tp=0;s.dur-=d}
    // Manipulación cura al final de cada acción posterior a la que la lanzó
    const castMa=(id==='ma');
    if(s.b.ma>0&&!castMa)s.dur=Math.min(s.durMax,s.dur+5);
    // Los estados bajan al final del turno (los recién lanzados no pierden turno)
    const fresh={ve:id==='ve'||id==='fc',inn:id==='inn'||id==='qi',wn:id==='wn'||id==='tm',wn2:id==='wn2',fa:id==='fa',ma:castMa,mu:id==='mu',gs:id==='gs',tp:id==='tp_'};
    for(const k of Object.keys(s.b)){if(s.b[k]>0&&!fresh[k]&&k!=='gs'&&k!=='tp'&&!(k==='mu'&&a.t!=='p'&&false))s.b[k]--}
    s.last=id;s.hist.push(id);s.step++;
    if(s.prog>=s.progMax){s.over=true;s.ok=true}
    else if(s.dur<=0){s.over=true;s.ok=false}
    else if(id!=='co'&&id!=='hs')rollCond(s);
    return {ok:true,hit,state:s};
  }
  /** Calidad superior en %, 0..100. */
  const hq=s=>Math.max(0,Math.min(100,Math.round(100*s.qual/s.qualMax)));
  /** Síntesis rápida: recetas muy por debajo del nivel; calidad normal, sin rotación. */
  function quick(rec,lvl){return lvl-rec.lvl>=10?{ok:true,hq:0}:{ok:false,why:'Receta demasiado alta'}}
  /** Siguiente acción recomendada: calidad primero mientras sobre Resistencia, progreso al final (botón «Sugerir» y bot de tools/work_sim.js). */
  function suggest(s){
    if(s.over)return null;
    const ok=id=>!can(s,id),unit=10+s.mana*.1,qu=8+s.pulso*.1;
    const stepCost=a=>dmod(s,a)/DUR_STEP;            // pasos de Resistencia que gasta (0,5 con Sin desperdicio…)
    const gP=a=>Math.floor(unit*a.e/100*(1+(s.b.ve?.5:0)+(s.b.mu?1:0)));
    // mejor acción de avance por Resistencia
    let bp=null,bg=0;
    for(const id of list(s.of,s.lvl)){const a=A[id];if((a.t==='p'||a.t==='pq')&&a.e&&!a.pr&&ok(id)&&a.po<=s.po){const g=gP(a)/Math.max(.5,stepCost(a));if(g>bg){bg=g;bp=id}}}
    if(!bp)bp='sb';
    const pa=A[bp],g1=Math.max(1,gP(pa)),need=Math.ceil((s.progMax-s.prog)/g1)*Math.max(.5,stepCost(pa));
    const left=s.dur/DUR_STEP*(s.b.wn||s.b.wn2?2:1);   // pasos disponibles (aprox.)
    const spare=Math.floor(s.dur/DUR_STEP-need)-1;     // pasos de calidad que aún caben, con margen
    const cast=(id)=>ok(id)?id:null;
    if(s.step===1){const m=cast('mu')||cast('rf');if(m&&(m==='mu'||spare>0))return m}
    // reparar si no llega
    if(spare<0&&s.dur<=20){const r=cast('tm')||cast('mm_')||cast('im');if(r)return r}
    const needQ=s.qual<s.qualMax*.97;
    if(needQ&&spare>0){
      if(!s.b.inn&&spare>=3&&ok('inn'))return 'inn';
      if(s.iq>=4&&ok('by')&&s.qual+qu*(1+.2*s.iq)*1.2<s.qualMax*1.5){if(!s.b.gs&&ok('gs')&&spare>=2)return 'gs';return 'by'}
      for(const id of ['tf','rt','at','ts','rm','pp','pt','tb']){if(ok(id)&&A[id].po<=s.po){if(id==='pp'&&spare<2)continue;if(id==='pt'&&s.cond!=='buena'&&s.cond!=='excelente')continue;return id}}
    }
    if(!s.b.ve&&need>=2&&s.po>=A.ve.po+10&&ok('fc')&&A.fc.po<=s.po)return 'fc';
    if(!s.b.ve&&need>=2&&ok('ve'))return 've';
    if(s.b.fa===0&&s.prog+g1>=s.progMax&&needQ&&ok('fa'))return 'fa';
    return bp;
  }
  /** Acciones de un oficio (comunes + exclusivas suyas) ordenadas por nivel. */
  const list=(of,lvl)=>IDS.filter(id=>{const a=A[id];return (!a.of||a.of===of)&&(lvl==null||a.lv<=lvl)}).sort((x,y)=>A[x].lv-A[y].lv);
  /** Siguiente acción por aprender: {id,lv} o null. */
  const nextUnlock=(of,lvl)=>{const l=list(of).filter(id=>A[id].lv>lvl&&!A[id].spec);return l.length?{id:l[0],lv:A[l[0]].lv}:null};
  /** Atributos del jugador y parámetros de receta (a calibrar con tools/work_sim.js). gear = bonos {mana,pulso,po}. */
  const mkStats=(lvl,gear)=>{gear=gear||{};return {lvl,mana:60+lvl*2.2+(gear.mana||0),pulso:50+lvl*2+(gear.pulso||0),po:Math.round(100+lvl*2+(gear.po||0))}};
  const mkRecipe=(rl,name)=>{const mana=60+rl*2.2,pulso=50+rl*2,unit=10+mana*.1,qu=8+pulso*.1;
    return {name:name||'',lvl:rl,prog:Math.round(unit*(PROG0+rl*PROG1)),qual:Math.round(qu*(QUAL0+rl*QUAL1)),dur:rl<30?60:rl<60?70:80}};
  return {A,IDS,CONDS,start,use,can,cost,avail,hq,quick,suggest,list,nextUnlock,mkStats,mkRecipe,MAXIQ};
})();
if(typeof module!=='undefined')module.exports=WK;
