// FORGE — interfaces ÚNICAS de oficio (D8, 26 oct 2026). «Skins» de la hoja de trabajo: un lienzo 2D (SIN WebGL) por oficio con SU taller (fragua, banco de carpintero,
// bastidor de curtidor, mesa de costura), el HÉROE REAL del mundo con la animación del oficio (se copia su sprite en el mismo fotograma, sin otro contexto WebGL),
// la PIEZA que se está haciendo (se revela con el Avance, se calienta/brilla con Condición y Calidad), herramientas y efectos por acción, reacciones, cámara de cine y
// un remate en el que el héroe alza el objeto (la pieza sigue su mano). La lógica NO cambia: lee A.wk.s (WK) y lo pinta.
// Registro: WKUI.reg('sm',{skin:'forge'}) · 'cr'→'carp' · 'pe'→'tan' · 'sa'→'sew'. Un oficio nuevo = una entrada en THEMES (bake de fondo y estación, formas de pieza, herramientas, partículas).
// Reglas (REGLAS_CREACION §P): solo canvas 2D, un rAF mientras la hoja está abierta, ≤ 220 partículas, sin filtros ni backdrop-filter. OJO: `P` es el jugador; las partículas son `PA`.
const FORGE=(()=>{
  const TIERC={oro:'#e8c24a',cobre:'#c8742a',bronce:'#c8842a',hierro:'#8d8f9c',acero:'#c8d4de',plata:'#e8e8f2',alba:'#f1e6c4',mitril:'#6a8aff',adam:'#5fd98a',runita:'#3ad0d8',oricalco:'#e89a3a',infernita:'#b8301c',celestita:'#c8a0ff'};
  const WOODC={pino:'#c79a5a',abedul:'#d8c9a0',roble:'#a07040',fresno:'#b99a64',sauce:'#9aa070',arce:'#c0763a',tejo:'#7a4a32',ebano:'#3a3030',caoba:'#8a3a28',baobab:'#b08a58',ceniza:'#5a4a44',mundo:'#7aa86a'};
  const WOOD='#7a5230',VW=640,VH=240,MAXP=220,FLOOR=207;
  const USE_HERO=false;   // decisión del dueño (26 oct): sin héroe 3D dentro de la interfaz (desentonaba con el 2D); queda el martillo 2D. El código del héroe se conserva: pon true para reactivarlo.
  const HX=122,HY=128,HSZ=420,DX=USE_HERO?-30:0;   // héroe (centro del sprite y tamaño) y desplazamiento de la estación (el yunque/banco queda al alcance de sus manos)
  const EYE='<circle cx="12" cy="12" r="3"/><path d="M3 12c4-6 14-6 18 0-4 6-14 6-18 0z"/>',DROP='<path d="M12 4c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z"/>',HAM='<path d="M4 20l7-7"/><path d="M10 6l6-2 4 4-2 6-4-1z"/>',NEE='<path d="M5 19L19 5"/><circle cx="17.5" cy="6.5" r="1.4"/>';
  // ---------- temas por oficio ----------
  const T_FORGE={id:'forge',n:'Fragua',var:{p:'h',pq:'h',q:'t',b:'c',r:'m',u:'o'},
    tools:{p:{n:'Martillo',s:'Avance',i:HAM},q:{n:'Tenazas',s:'Calidad',i:'<path d="M5 20l7-9M19 20l-7-9"/><path d="M12 11V4"/><path d="M9 5l3-1 3 1"/>'},b:{n:'Fuelle',s:'Estados',i:'<path d="M5 8c4-4 10-4 14 0l-3 8H8z"/><path d="M12 16v4"/>'},r:{n:'Agua y temple',s:'Reparación',i:DROP},u:{n:'Banco',s:'Utilidad',i:EYE}},
    fx:{p:{spr:'hammer',c:['#fff1b0','#ffb347','#ff6a1a'],k:0},q:{spr:'tongs',c:['#bfe0ff','#ffffff','#8fc4ff'],k:1},b:{spr:'bellows',c:['#ffb347'],k:1},r:{spr:'bucket',c:['#9fd8ff'],k:3},u:{spr:'eye',c:['#9fd8ff'],k:1}},hot:1};
  const T_CARP={id:'carp',n:'Carpintería',var:{p:'h',pq:'h',q:'o',b:'c',r:'m',u:'o'},
    tools:{p:{n:'Sierra y mazo',s:'Avance',i:HAM},q:{n:'Lija y cepillo',s:'Calidad',i:'<path d="M4 15h16v4H4z"/><path d="M7 15V9h6v6"/>'},b:{n:'Cola',s:'Estados',i:'<path d="M7 9h10l-1 10H8z"/><path d="M9 9V6h6v3"/>'},r:{n:'Aceite y barniz',s:'Reparación',i:DROP},u:{n:'Banco',s:'Utilidad',i:EYE}},
    fx:{p:{spr:'saw',c:['#e8d0a0','#c79a5a','#a07040'],k:4},q:{spr:'sand',c:['#f0e0c0','#e8d0a0'],k:4},b:{spr:'pot',c:['#f0e6c8'],k:3},r:{spr:'bucket',c:['#c0763a'],k:3},u:{spr:'eye',c:['#e8d0a0'],k:1}},hot:0};
  const T_TAN={id:'tan',n:'Curtiduría',var:{p:'h',pq:'h',q:'t',b:'c',r:'m',u:'o'},
    tools:{p:{n:'Cuchillo y mazo',s:'Avance',i:HAM},q:{n:'Aguja y lezna',s:'Calidad',i:NEE},b:{n:'Tinte',s:'Estados',i:'<path d="M5 9h14l-2 10H7z"/><path d="M8 9c0-3 8-3 8 0"/>'},r:{n:'Remojo',s:'Reparación',i:DROP},u:{n:'Banco',s:'Utilidad',i:EYE}},
    fx:{p:{spr:'knife',c:['#e8c89a','#b98560','#8a5a2a'],k:4},q:{spr:'needle',c:['#f0e6c8','#e8cf94'],k:1},b:{spr:'pot',c:['#b04a3a','#8a5a2a'],k:3},r:{spr:'bucket',c:['#7fb4d8'],k:3},u:{spr:'eye',c:['#e8c89a'],k:1}},hot:0};
  const T_SEW={id:'sew',n:'Sastrería',var:{p:'t',pq:'t',q:'t',b:'c',r:'m',u:'o'},
    tools:{p:{n:'Aguja e hilo',s:'Avance',i:NEE},q:{n:'Tijeras',s:'Calidad',i:'<circle cx="7" cy="17" r="2.5"/><circle cx="17" cy="17" r="2.5"/><path d="M8.5 15L18 5M15.5 15L6 5"/>'},b:{n:'Carretes',s:'Estados',i:'<path d="M7 5h10M7 19h10M9 5v14M15 5v14"/>'},r:{n:'Plancha',s:'Reparación',i:'<path d="M4 17h16c0-5-4-8-9-8H4z"/>'},u:{n:'Mesa',s:'Utilidad',i:EYE}},
    fx:{p:{spr:'needle',c:['#ffffff','#e8cf94'],k:1},q:{spr:'scissors',c:['#e8dfc8','#c8b8d8'],k:4},b:{spr:'pot',c:['#c8a0ff'],k:1},r:{spr:'iron',c:['#d8e4ea'],k:2},u:{spr:'eye',c:['#c8a0ff'],k:1}},hot:0};
  const T_STONE={id:'stone',n:'Cantería',var:{p:'h',pq:'h',q:'o',b:'c',r:'m',u:'o'},   // ESC-JOY (27 oct 2026): Escultor
    tools:{p:{n:'Cincel y maza',s:'Avance',i:HAM},q:{n:'Escofina y pulidor',s:'Calidad',i:'<path d="M4 15h16v4H4z"/><path d="M8 15l2-8h4l2 8"/>'},b:{n:'Agua',s:'Estados',i:DROP},r:{n:'Escuadra',s:'Reparación',i:'<path d="M5 4v15h15"/><path d="M5 9h4M5 14h4"/>'},u:{n:'Banco',s:'Utilidad',i:EYE}},
    fx:{p:{spr:'hammer',c:['#f0ece2','#c8c0b0','#8a8478'],k:4},q:{spr:'sand',c:['#f0ece2','#d8d0c0'],k:4},b:{spr:'bucket',c:['#9fd8ff'],k:3},r:{spr:'eye',c:['#d8d0c0'],k:1},u:{spr:'eye',c:['#d8d0c0'],k:1}},hot:0};
  const T_JEWEL={id:'jewel',n:'Joyería',var:{p:'t',pq:'t',q:'t',b:'c',r:'m',u:'o'},   // ESC-JOY (27 oct 2026): Joyería
    tools:{p:{n:'Martillito y soldador',s:'Avance',i:HAM},q:{n:'Pinzas y engaste',s:'Calidad',i:'<path d="M5 20l7-9M19 20l-7-9"/><path d="M12 11V4"/>'},b:{n:'Lupa',s:'Estados',i:'<circle cx="10" cy="10" r="5"/><path d="M14 14l6 6"/>'},r:{n:'Recocido',s:'Reparación',i:'<path d="M12 4c3 4 5 6 5 9a5 5 0 0 1-10 0c0-3 2-5 5-9z"/>'},u:{n:'Mesa',s:'Utilidad',i:EYE}},
    fx:{p:{spr:'hammer',c:['#fff6d8','#e8cf94','#c8a050'],k:1},q:{spr:'tongs',c:['#ffffff','#bfe0ff','#e8cf94'],k:1},b:{spr:'eye',c:['#bfe0ff'],k:1},r:{spr:'bellows',c:['#ffb347'],k:1},u:{spr:'eye',c:['#e8cf94'],k:1}},hot:1};
  const T_ARCANE={id:'arcane',n:'Encantamiento',var:{p:'t',pq:'t',q:'t',b:'c',r:'m',u:'o'},   // 28 oct 2026: Encantamiento (mesa rúnica)
    tools:{p:{n:'Pluma y runas',s:'Avance',i:'<path d="M5 20L15 10"/><path d="M13 4l7 3-2 4-3-1-2 2-3-3 2-2-1-3z"/>'},q:{n:'Canalizar',s:'Calidad',i:'<circle cx="12" cy="12" r="7"/><path d="M12 5v14M5 12h14"/>'},b:{n:'Invocar',s:'Estados',i:'<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>'},r:{n:'Sellar',s:'Reparación',i:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>'},u:{n:'Mesa',s:'Utilidad',i:EYE}},
    fx:{p:{spr:'hammer',c:['#e8d0ff','#b07aff','#7a4ad0'],k:1},q:{spr:'eye',c:['#ffffff','#d0b0ff'],k:1},b:{spr:'eye',c:['#b07aff'],k:1},r:{spr:'eye',c:['#e8cf94'],k:1},u:{spr:'eye',c:['#b07aff'],k:1}},hot:1};
  const THEMES={forge:T_FORGE,carp:T_CARP,tan:T_TAN,sew:T_SEW,stone:T_STONE,jewel:T_JEWEL,arcane:T_ARCANE};
  const OFSKIN={sm:'forge',cr:'carp',pe:'tan',sa:'sew',es:'stone',jo:'jewel',en:'arcane'};
  const STONEC={caliza:'#d8d0b8',granito:'#8a8a92',arenisca:'#d4a468',basalto:'#55525a',marmol:'#ece6dc',obsidiana:'#3a2a4a',astral:'#9aaaf0'},GEMC={cuarzo:'#e6e2f2',ambar:'#e8a030',jade:'#3aa86a',zafiro:'#3a6aff',opalo:'#d8eef0',rubi:'#e02a3a',amatista:'#9a5ae0',topacio:'#f0b040',coral:'#ff7a6a',diamante:'#e8f8ff'};
  let TH=T_FORGE,HS=null,hsx=null,hsT=-1e9,hand=null,el=null,cv=null,g=null,raf=0,last=0,on=false,bg=null,stn=null,ro=null,kind='bar',tcol='#8d8f9c',pname='',SC=null,SC2=null;const PC={};
  const PA=[],F=[];
  const st={prog:0,pg:0,q:0,qg:0,dur:1,heat:0,cond:'normal',exc:false,streak:0,lastAct:0,shake:0,flash:0,flashC:'#fff',squash:0,lift:0,ring:[],tool:null,glow:0,end:null,fire:0,zp:0,kick:0,mood:0,moodT:0,pendText:null};
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t*t*(3-2*t);
  const mix=(a,b,t)=>{const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),A=p(a),B=p(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')};
  const hash=n=>{let x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)};
  let seed=1;const rnd=()=>hash(seed++);
  const tierOf=id=>{const m=/_(cobre|bronce|hierro|acero|plata|alba|mitril|adam|runita|oricalco|infernita|celestita)$/.exec(String(id||''));return m?m[1]:'hierro'};
  const woodOf=id=>{const m=/_(pino|abedul|roble|fresno|sauce|arce|tejo|ebano|caoba|baobab|ceniza|mundo)$/.exec(String(id||''));return m?m[1]:'pino'};
  function kindOf(id){id=String(id||'');return /^sw_|^lw_/.test(id)?'sword':/^ax_/.test(id)?'axe':/^pk_/.test(id)?'pick':/^(ar|sh|lg|gl)_(cu|tu)_/.test(id)?(id[0]==='a'?'chest':id[0]==='s'?'shield':id[0]==='l'?'legs':'glove'):/^ar_/.test(id)?'chest':/^sh_/.test(id)?'shield':/^lg_/.test(id)?'legs':/^gl_/.test(id)?'glove':/^og_/.test(id)?'hammer':
    /^(ls|bl)_/.test(id)?'block':/^ta_columna_/.test(id)?'column':/^ta_/.test(id)?'statue':/^(eg|an)_/.test(id)?'ring':/^cl_/.test(id)?'amulet':/^(gm|gb)_/.test(id)?'gem':/^tb_/.test(id)?'plank':/^mn_/.test(id)?'handle':/^bw_/.test(id)?'bow':/^st_/.test(id)?'staff':/^rd_/.test(id)?'rod':/^(fl|vi)_/.test(id)?'arrows':/^qv_/.test(id)?'quiver':/^cu_/.test(id)?'leather':/^mj_/.test(id)?'thread':/^(tela|te_)/.test(id)?'cloth':'bar'}
  function colOf(id){id=String(id||'');{const m=/_(caliza|granito|arenisca|basalto|marmol|obsidiana|astral)$/.exec(id);if(m)return STONEC[m[1]]}{const m=/_(cuarzo|ambar|jade|zafiro|opalo|rubi|amatista|topacio|coral|diamante)$/.exec(id);if(m)return GEMC[m[1]]}if(id==='b_oro'||/_oro$/.test(id))return TIERC.oro;if(/^(tb|mn|bw|st|rd)_/.test(id))return WOODC[woodOf(id)];if(/_cu_|^cu_|^qv_/.test(id))return mix('#8a5a2a',TIERC[tierOf(id)]||'#8d8f9c',.28);if(/_tu_|^tela|^te_|^mj_/.test(id))return mix('#d8d0e8',TIERC[tierOf(id)]||'#c8c0d8',.35);return TIERC[tierOf(id)]||'#8d8f9c'}
  function mk(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}

  // ---------- escenas horneadas (fondo + estación; la estación se dibuja desplazada DX) ----------
  function wallBricks(x,c0,c1,bw,bh){for(let r=0;r<Math.ceil(210/bh);r++)for(let c=-1;c<VW/bw+1;c++){const bx=c*bw+(r%2?bw/2:0),by=r*bh,sh=.5+hash(r*31+c)*.5;x.fillStyle='rgb('+Math.round(c0[0]*sh+c1[0])+','+Math.round(c0[1]*sh+c1[1])+','+Math.round(c0[2]*sh+c1[2])+')';x.fillRect(bx+1,by+1,bw-2,bh-2);x.fillStyle='rgba(0,0,0,.35)';x.fillRect(bx+1,by+bh-4,bw-2,3);x.fillStyle='rgba(255,220,170,.05)';x.fillRect(bx+1,by+1,bw-2,2)}}
  function floor(x,a,b){const gr=x.createLinearGradient(0,196,0,VH);gr.addColorStop(0,a);gr.addColorStop(1,b);x.fillStyle=gr;x.fillRect(0,196,VW,VH-196);for(let i=0;i<14;i++){x.fillStyle='rgba(0,0,0,.28)';x.fillRect(i*48+(i%2)*10,198+(i%3)*14,46,2)}}
  const glowDot=(x,cx,cy,r)=>{const gr=x.createRadialGradient(cx,cy,2,cx,cy,r);gr.addColorStop(0,'rgba(255,200,110,.55)');gr.addColorStop(1,'rgba(255,170,70,0)');x.fillStyle=gr;x.fillRect(cx-r,cy-r,r*2,r*2);x.fillStyle='#ffd88a';x.beginPath();x.arc(cx,cy,6,0,7);x.fill()};
  const base=(x2,s)=>{x2.save();x2.translate(300,FLOOR);x2.scale(s,s);x2.translate(-300,-227)};
  function bakeForge(x,x2){
    wallBricks(x,[34,27,22],[8,6,5],52,26);
    x.save();x.strokeStyle='#050403';x.lineWidth=1.5;x.fillStyle=WOOD;x.fillRect(46,30,5,64);x.fillStyle='#6a6a74';x.fillRect(36,24,26,13);x.strokeRect(36,24,26,13);x.fillStyle='#55555e';x.beginPath();x.moveTo(90,24);x.lineTo(98,24);x.lineTo(118,92);x.lineTo(112,94);x.closePath();x.fill();x.beginPath();x.moveTo(130,24);x.lineTo(122,24);x.lineTo(102,92);x.lineTo(108,94);x.closePath();x.fill();x.fillStyle='#4a4a52';x.fillRect(150,28,40,6);x.fillRect(148,38,44,5);x.restore();
    floor(x,'#2a2018','#0e0a07');
    x.fillStyle='#2c231c';x.fillRect(470,40,150,160);x.fillStyle='#120d09';x.beginPath();x.moveTo(486,196);x.lineTo(486,104);x.quadraticCurveTo(545,60,604,104);x.lineTo(604,196);x.closePath();x.fill();x.strokeStyle='#4a3a2c';x.lineWidth=3;x.stroke();x.fillStyle='#3a2e24';x.fillRect(462,196,166,10);x.fillRect(470,30,150,12);
    x.fillStyle='#4a3220';x.fillRect(396,160,46,48);x.strokeStyle='#050403';x.lineWidth=1.3;x.strokeRect(396,160,46,48);x.fillStyle='#2a2a30';x.fillRect(396,170,46,3);x.fillRect(396,194,46,3);x.fillStyle='#3a7fb0';x.fillRect(399,160,40,6);x.fillStyle='rgba(255,255,255,.2)';x.fillRect(402,161,16,2);   // barril de temple
    base(x2,.785);
    const wg=x2.createLinearGradient(240,0,360,0);wg.addColorStop(0,'#3a2616');wg.addColorStop(.5,'#5a3b22');wg.addColorStop(1,'#2e1e12');x2.fillStyle=wg;x2.beginPath();x2.moveTo(242,186);x2.lineTo(358,186);x2.lineTo(366,226);x2.lineTo(234,226);x2.closePath();x2.fill();x2.strokeStyle='rgba(0,0,0,.45)';x2.lineWidth=1.2;for(let i=0;i<6;i++){x2.beginPath();x2.moveTo(248+i*20,188);x2.lineTo(244+i*21,224);x2.stroke()}x2.fillStyle='#2a2a30';x2.fillRect(232,222,136,5);
    x2.fillStyle='#2c2c33';x2.beginPath();x2.moveTo(250,186);x2.lineTo(350,186);x2.lineTo(338,172);x2.lineTo(262,172);x2.closePath();x2.fill();x2.fillStyle='#34343c';x2.beginPath();x2.moveTo(266,172);x2.lineTo(334,172);x2.lineTo(326,152);x2.lineTo(274,152);x2.closePath();x2.fill();
    const ag=x2.createLinearGradient(0,132,0,156);ag.addColorStop(0,'#5b5b66');ag.addColorStop(1,'#34343c');x2.fillStyle=ag;x2.beginPath();x2.moveTo(190,142);x2.quadraticCurveTo(212,140,224,134);x2.lineTo(392,134);x2.lineTo(386,142);x2.quadraticCurveTo(372,152,354,152);x2.lineTo(246,152);x2.quadraticCurveTo(212,150,190,142);x2.closePath();x2.fill();x2.strokeStyle='#0a0908';x2.lineWidth=1.4;x2.stroke();
    x2.fillStyle='#8a8a96';x2.beginPath();x2.moveTo(224,134);x2.lineTo(392,134);x2.lineTo(390,138);x2.lineTo(226,138);x2.closePath();x2.fill();x2.fillStyle='rgba(255,255,255,.35)';x2.fillRect(232,134.4,150,1.2);x2.fillStyle='#1c1c22';x2.fillRect(372,128,5,6);x2.restore()}
  function bakeCarp(x,x2){
    x.fillStyle='#2a1c12';x.fillRect(0,0,VW,VH);for(let c=0;c<26;c++){const sh=.55+hash(c*7)*.45;x.fillStyle='rgb('+Math.round(70*sh)+','+Math.round(46*sh)+','+Math.round(28*sh)+')';x.fillRect(c*25,0,24,200);x.fillStyle='rgba(0,0,0,.35)';x.fillRect(c*25+23,0,2,200);for(let k=0;k<3;k++){x.fillStyle='rgba(0,0,0,.12)';x.fillRect(c*25+4+k*6,hash(c*3+k)*160,1.2,26+hash(c+k)*30)}}
    floor(x,'#3a2a1c','#150e08');x.fillStyle='rgba(232,208,160,.22)';for(let i=0;i<40;i++)x.fillRect(hash(i)*VW,200+hash(i*3)*34,6+hash(i*5)*10,1.4);
    x.save();x.strokeStyle='#050403';x.lineWidth=1.4;x.fillStyle='#8a8a94';x.fillRect(40,34,64,6);x.strokeRect(40,34,64,6);x.fillStyle='#6a6a74';for(let i=0;i<9;i++){x.beginPath();x.moveTo(42+i*7,40);x.lineTo(45+i*7,48);x.lineTo(48+i*7,40);x.fill()}x.fillStyle=WOOD;x.fillRect(100,30,14,16);x.strokeRect(100,30,14,16);
    x.fillStyle='#c79a5a';x.fillRect(150,34,50,14);x.strokeRect(150,34,50,14);x.fillStyle='#6a6a74';x.fillRect(160,30,28,5);x.restore();
    x.fillStyle='#1a120c';x.fillRect(440,34,130,100);x.fillStyle='rgba(255,214,140,.5)';x.fillRect(446,40,56,88);x.fillRect(508,40,56,88);x.strokeStyle='#050403';x.lineWidth=2;x.strokeRect(440,34,130,100);
    for(let i=0;i<5;i++){x.fillStyle=mix('#c79a5a','#8a5a2a',hash(i)*.6);x.fillRect(470,158+i*10,110,9);x.strokeRect(470,158+i*10,110,9)}
    base(x2,.8);x2.strokeStyle='#050403';x2.lineWidth=1.5;x2.fillStyle='#5a3b22';x2.fillRect(230,140,12,87);x2.fillRect(358,140,12,87);x2.strokeRect(230,140,12,87);x2.strokeRect(358,140,12,87);x2.fillStyle='#4a3020';x2.fillRect(242,196,116,8);
    const tg=x2.createLinearGradient(0,128,0,142);tg.addColorStop(0,'#c79a5a');tg.addColorStop(1,'#8a5a2a');x2.fillStyle=tg;x2.fillRect(204,128,192,16);x2.strokeRect(204,128,192,16);x2.fillStyle='rgba(255,255,255,.25)';x2.fillRect(208,129,184,2);x2.fillStyle='#4a3a2c';x2.fillRect(204,144,192,5);
    x2.fillStyle='#6a6a74';x2.fillRect(206,118,12,14);x2.strokeRect(206,118,12,14);x2.fillStyle='#8a8a94';x2.fillRect(206,112,26,4);x2.restore()}
  function bakeTan(x,x2){
    wallBricks(x,[40,32,26],[16,12,9],58,30);floor(x,'#2c2218','#100b07');
    x.save();x.strokeStyle='#050403';x.lineWidth=1.3;for(let i=0;i<3;i++){x.fillStyle=mix('#b98560','#6a4028',hash(i)*.7);x.beginPath();x.moveTo(40+i*56,28);x.lineTo(84+i*56,28);x.lineTo(80+i*56,92+i*8);x.lineTo(60+i*56,104);x.lineTo(44+i*56,90);x.closePath();x.fill();x.stroke()}
    x.fillStyle=WOOD;x.fillRect(34,22,170,6);x.strokeRect(34,22,170,6);
    const tub=(tx,col)=>{x.fillStyle='#4a3220';x.beginPath();x.moveTo(tx,170);x.lineTo(tx+70,170);x.lineTo(tx+64,208);x.lineTo(tx+6,208);x.closePath();x.fill();x.stroke();x.fillStyle=col;x.beginPath();x.ellipse(tx+35,170,35,7,0,0,7);x.fill();x.stroke()};tub(440,'#a8452a');tub(520,'#3a6a8a');
    glowDot(x,610,40,70);x.restore();
    base(x2,.8);x2.strokeStyle='#050403';x2.lineWidth=1.5;x2.fillStyle='#5a3b22';[[222,140],[366,140]].forEach(([a,b])=>{x2.fillRect(a,b,12,87);x2.strokeRect(a,b,12,87)});x2.fillRect(222,134,156,10);x2.strokeRect(222,134,156,10);x2.fillStyle='#8a5a2a';x2.fillRect(234,150,132,60);x2.strokeRect(234,150,132,60);
    x2.fillStyle='#4a3a2c';for(let i=0;i<6;i++)x2.fillRect(238+i*22,146,3,8);x2.fillStyle='rgba(255,255,255,.18)';x2.fillRect(236,152,128,2);x2.fillStyle=mix('#b98560','#6a4028',.3);x2.fillRect(204,128,192,10);x2.strokeRect(204,128,192,10);x2.restore()}
  function bakeSew(x,x2){
    x.fillStyle='#2a2230';x.fillRect(0,0,VW,VH);for(let c=0;c<16;c++){x.fillStyle=c%2?'rgba(255,255,255,.035)':'rgba(0,0,0,.12)';x.fillRect(c*40,0,40,200)}floor(x,'#33283a','#120d16');
    x.save();x.strokeStyle='#050403';x.lineWidth=1.3;x.fillStyle=WOOD;x.fillRect(30,60,170,6);x.strokeRect(30,60,170,6);x.fillRect(30,120,170,6);x.strokeRect(30,120,170,6);
    ['#c8a0ff','#e8a0a0','#a0c8e8','#e8d890','#a0e8b8','#e8a0d0','#d0b890','#90b0e8'].forEach((c,i)=>{x.fillStyle=c;x.beginPath();x.arc(46+i*20,52,7,0,7);x.fill();x.stroke();x.fillStyle=mix(c,'#000000',.4);x.fillRect(44+i*20,40,4,24)});
    ['#8a6ab8','#b86a6a','#6a98b8','#b8a85a'].forEach((c,i)=>{x.fillStyle=c;x.fillRect(40+i*40,92,34,28);x.strokeRect(40+i*40,92,34,28);x.fillStyle='rgba(255,255,255,.25)';x.fillRect(42+i*40,94,30,3)});
    x.fillStyle='#8a7a68';x.beginPath();x.moveTo(500,60);x.quadraticCurveTo(540,56,570,66);x.lineTo(564,150);x.lineTo(506,150);x.closePath();x.fill();x.stroke();x.fillStyle='#6a5a48';x.fillRect(532,150,6,48);x.fillRect(512,196,46,6);x.beginPath();x.arc(534,48,10,0,7);x.fill();x.stroke();
    glowDot(x,450,40,70);x.restore();
    base(x2,.8);x2.strokeStyle='#050403';x2.lineWidth=1.5;x2.fillStyle='#5a3b22';[[228,140],[360,140]].forEach(([a,b])=>{x2.fillRect(a,b,12,87);x2.strokeRect(a,b,12,87)});x2.fillStyle='#8a5a32';x2.fillRect(204,128,192,16);x2.strokeRect(204,128,192,16);x2.fillStyle='rgba(255,255,255,.2)';x2.fillRect(208,129,184,2);
    x2.fillStyle='#d8d0e8';x2.fillRect(214,120,60,8);x2.strokeRect(214,120,60,8);x2.fillStyle='#e8cf94';x2.beginPath();x2.arc(372,122,6,0,7);x2.fill();x2.stroke();x2.restore()}
  function bakeStone(x,x2){   // taller de cantero: piedra vista, bloques apilados, columna a medio labrar, polvo en el suelo
    wallBricks(x,[52,48,42],[18,16,14],70,34);floor(x,'#3a3630','#141210');x.fillStyle='rgba(230,224,210,.18)';for(let i=0;i<46;i++)x.fillRect(hash(i)*VW,200+hash(i*3)*34,3+hash(i*5)*8,1.5);
    x.save();x.strokeStyle='#050403';x.lineWidth=1.3;for(let i=0;i<3;i++){x.fillStyle=mix('#a8a090','#6a665e',hash(i+3)*.6);x.fillRect(470+i*12,196-(i+1)*30,110-i*18,30);x.strokeRect(470+i*12,196-(i+1)*30,110-i*18,30)}
    x.fillStyle='#d8d0c0';x.fillRect(70,74,20,110);x.strokeRect(70,74,20,110);x.fillRect(62,66,36,10);x.strokeRect(62,66,36,10);x.fillRect(62,182,36,10);x.strokeRect(62,182,36,10);glowDot(x,600,40,70);x.restore();
    base(x2,.8);x2.strokeStyle='#050403';x2.lineWidth=1.5;x2.fillStyle='#6a6a70';x2.fillRect(214,150,172,77);x2.strokeRect(214,150,172,77);x2.fillStyle='#8a8a92';x2.fillRect(204,128,192,22);x2.strokeRect(204,128,192,22);x2.fillStyle='rgba(255,255,255,.22)';x2.fillRect(208,130,184,3);
    x2.fillStyle='#4a4a50';for(let i=0;i<5;i++)x2.fillRect(222+i*34,170,26,4);x2.restore()}
  function bakeJewel(x,x2){   // mesa de joyero: madera oscura, cajoncitos, lámpara cálida y estuche de terciopelo con gemas
    x.fillStyle='#22180f';x.fillRect(0,0,VW,VH);for(let c=0;c<20;c++){const sh=.55+hash(c*5)*.45;x.fillStyle='rgb('+Math.round(56*sh)+','+Math.round(38*sh)+','+Math.round(24*sh)+')';x.fillRect(c*32,0,31,200)}floor(x,'#2a1e14','#0e0905');
    x.save();x.strokeStyle='#050403';x.lineWidth=1.3;for(let r=0;r<3;r++)for(let c=0;c<4;c++){x.fillStyle='#4a3220';x.fillRect(470+c*36,60+r*34,32,30);x.strokeRect(470+c*36,60+r*34,32,30);x.fillStyle='#e8cf94';x.fillRect(484+c*36,74+r*34,5,3)}
    x.fillStyle='#5a1e2a';x.fillRect(40,150,150,40);x.strokeRect(40,150,150,40);['#e02a3a','#3a6aff','#3aa86a','#f0b040','#9a5ae0','#e6e2f2'].forEach((cl,i)=>{x.fillStyle=cl;x.beginPath();x.arc(58+i*22,170,5,0,7);x.fill();x.stroke()});glowDot(x,120,46,90);x.restore();
    base(x2,.8);x2.strokeStyle='#050403';x2.lineWidth=1.5;x2.fillStyle='#4a3020';[[228,140],[360,140]].forEach(([a,b])=>{x2.fillRect(a,b,12,87);x2.strokeRect(a,b,12,87)});x2.fillStyle='#6a4a2c';x2.fillRect(204,128,192,16);x2.strokeRect(204,128,192,16);x2.fillStyle='rgba(255,255,255,.2)';x2.fillRect(208,129,184,2);
    x2.fillStyle='#8a6a40';x2.beginPath();x2.moveTo(286,128);x2.lineTo(314,128);x2.lineTo(304,112);x2.lineTo(296,112);x2.closePath();x2.fill();x2.stroke();x2.fillStyle='#6a6a74';x2.fillRect(214,118,22,10);x2.strokeRect(214,118,22,10);x2.restore()}
  function bakeArcane(x,x2){   // mesa de encantamiento: piedra azul oscura, estantes de pergaminos y frascos, velas y un círculo rúnico en la mesa
    x.fillStyle='#14101e';x.fillRect(0,0,VW,VH);for(let c=0;c<20;c++){const sh=.55+hash(c*7)*.45;x.fillStyle='rgb('+Math.round(34*sh)+','+Math.round(28*sh)+','+Math.round(52*sh)+')';x.fillRect(c*32,0,31,200)}floor(x,'#1e1830','#0a0710');
    x.save();x.strokeStyle='#050408';x.lineWidth=1.3;x.fillStyle='#3a2c24';x.fillRect(420,40,190,10);x.strokeRect(420,40,190,10);x.fillRect(420,90,190,10);x.strokeRect(420,90,190,10);
    ['#b07aff','#6ad04a','#ff8a2a','#8fd8ff','#d4261c','#ffe85a'].forEach((cl,i)=>{x.fillStyle=cl;x.beginPath();x.arc(436+i*30,34,6,0,7);x.fill();x.stroke();x.fillStyle='#d8c8a0';x.fillRect(430+i*30,76,12,14);x.strokeRect(430+i*30,76,12,14)});glowDot(x,120,50,110);glowDot(x,520,70,70);x.restore();
    base(x2,.8);x2.strokeStyle='#050408';x2.lineWidth=1.5;x2.fillStyle='#3a2c3e';x2.fillRect(190,140,220,16);x2.strokeRect(190,140,220,16);x2.fillStyle='#2a2030';[[210,156],[380,156]].forEach(([a,b])=>{x2.fillRect(a,b,14,70);x2.strokeRect(a,b,14,70)});
    x2.strokeStyle='#b07aff';x2.lineWidth=2;x2.beginPath();x2.ellipse(300,148,70,10,0,0,7);x2.stroke();x2.beginPath();x2.ellipse(300,148,44,6,0,0,7);x2.stroke();for(let i=0;i<8;i++){const a=i/8*6.283;x2.beginPath();x2.moveTo(300+Math.cos(a)*44,148+Math.sin(a)*6);x2.lineTo(300+Math.cos(a)*70,148+Math.sin(a)*10);x2.stroke()}x2.restore()}
  const BAKE={arcane:bakeArcane,forge:bakeForge,carp:bakeCarp,tan:bakeTan,sew:bakeSew,stone:bakeStone,jewel:bakeJewel};
  function texture(){if(TEXC)return TEXC;TEXC=mk(256,256);const x=TEXC.getContext('2d');x.fillStyle='#808080';x.fillRect(0,0,256,256);for(let i=0;i<900;i++){const v=hash(i*3)>.5?255:0;x.strokeStyle='rgba('+v+','+v+','+v+','+(.03+hash(i*7)*.07)+')';x.lineWidth=1+hash(i*5)*2.5;x.beginPath();const px=hash(i)*256,py=hash(i*11)*256,a=.5+hash(i*13)*.6;x.moveTo(px,py);x.lineTo(px+Math.cos(a)*(10+hash(i*17)*22),py+Math.sin(a)*(10+hash(i*17)*22));x.stroke()}return TEXC}
  let TEXC=null;
  function bake(skin){const s=2;const raw=mk(VW*s,VH*s);stn=mk(VW*s,VH*s);const x=raw.getContext('2d'),x2=stn.getContext('2d');x.scale(s,s);x2.scale(s,s);BAKE[skin](x,x2);
    // el FONDO se desenfoca un poco (profundidad de campo, estilo pintado) para que el héroe 3D y la estación destaquen y casen con el óleo del mundo
    bg=mk(VW*s,VH*s);const b=bg.getContext('2d');try{b.filter='blur(2.2px)'}catch(e){}b.drawImage(raw,0,0);b.filter='none';b.globalAlpha=.35;b.drawImage(raw,0,0);b.globalAlpha=1}

  // ---------- la PIEZA (coordenadas locales; origen = centro, eje X a lo largo) ----------
  function shape(x,k,tc,o){
    const hot=o.hot,body=mix(tc,'#ff7a22',clamp(hot*1.15,0,1)*.9),hi=mix(body,'#fff2c8',.35+hot*.4),dk=mix(body,'#201814',.45);
    x.lineWidth=1.4;x.strokeStyle='rgba(8,6,5,.9)';x.lineJoin='round';
    const poly=(pts,f)=>{x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.fillStyle=f;x.fill();x.stroke()};
    const wood=()=>{x.fillStyle=WOOD;x.fillRect(-120,-4,150,8);x.strokeRect(-120,-4,150,8);x.fillStyle='rgba(255,255,255,.12)';x.fillRect(-118,-3,146,2)};
    if(k==='sword'){const gr=mix('#4a2f1a','#ff7a22',hot*.35),gh=mix('#8a5a34','#ffd08a',hot*.4);poly([[-124,-7],[-98,-8],[-98,8],[-124,7]],gr);x.fillStyle=gh;for(let i=0;i<4;i++)x.fillRect(-120+i*6.5,-7,2.2,14);x.fillStyle='rgba(255,255,255,.18)';x.fillRect(-122,-6,24,2);
      const pm=mix('#7a7a86','#ffb060',hot*.5);x.fillStyle=pm;x.beginPath();x.arc(-128,0,8.5,0,7);x.fill();x.stroke();x.fillStyle='rgba(255,255,255,.4)';x.beginPath();x.arc(-130,-3,2.6,0,7);x.fill();
      poly([[-74,-26],[-60,-26],[-60,26],[-74,26]],mix(body,'#2a2a30',.15));x.fillStyle=hi;x.fillRect(-72,-24,3,48);poly([[-60,-8],[100,-8],[134,0],[100,8],[-60,8]],body);x.fillStyle=dk;x.fillRect(-56,-1.5,150,3);x.fillStyle=hi;x.fillRect(-56,-6.5,150,1.6);return}
    if(k==='axe'){wood();poly([[18,-44],[44,-34],[70,-46],[70,46],[44,34],[18,44],[26,0]],body);x.fillStyle=hi;x.fillRect(44,-33,2,66);poly([[8,-10],[26,-10],[26,10],[8,10]],dk);return}
    if(k==='pick'){wood();x.beginPath();x.moveTo(8,0);x.quadraticCurveTo(26,-50,92,-14);x.lineTo(92,-8);x.quadraticCurveTo(34,-34,18,-8);x.quadraticCurveTo(34,34,92,8);x.lineTo(92,14);x.quadraticCurveTo(26,50,8,0);x.closePath();x.fillStyle=body;x.fill();x.stroke();x.fillStyle=hi;x.fillRect(14,-4,6,8);return}
    if(k==='chest'){poly([[-62,-46],[-30,-52],[0,-40],[30,-52],[62,-46],[70,-10],[50,10],[40,46],[-40,46],[-50,10],[-70,-10]],body);x.fillStyle=dk;x.fillRect(-4,-40,8,84);x.fillStyle=hi;x.fillRect(-50,-20,24,3);x.fillRect(26,-20,24,3);return}
    if(k==='shield'){x.beginPath();x.moveTo(-48,-44);x.lineTo(48,-44);x.quadraticCurveTo(54,10,0,54);x.quadraticCurveTo(-54,10,-48,-44);x.closePath();x.fillStyle=body;x.fill();x.stroke();x.strokeStyle=hi;x.lineWidth=2;x.stroke();x.beginPath();x.arc(0,-6,12,0,7);x.fillStyle=dk;x.fill();x.stroke();return}
    if(k==='legs'){poly([[-50,-44],[50,-44],[56,44],[8,44],[0,-6],[-8,44],[-56,44]],body);x.fillStyle=hi;x.fillRect(-46,-40,92,4);return}
    if(k==='glove'){poly([[-40,-18],[20,-18],[24,-40],[34,-40],[36,-14],[56,-12],[56,14],[34,16],[-40,22]],body);x.fillStyle=hi;x.fillRect(-36,-14,50,3);return}
    if(k==='hammer'){x.fillStyle=WOOD;x.fillRect(-110,-4,170,8);x.strokeRect(-110,-4,170,8);poly([[34,-24],[74,-24],[74,24],[34,24]],body);x.fillStyle=hi;x.fillRect(36,-22,36,3);return}
    if(k==='plank'){poly([[-112,-13],[112,-13],[112,13],[-112,13]],body);x.strokeStyle=dk;x.lineWidth=1;for(let i=0;i<7;i++){x.beginPath();x.moveTo(-104+i*8,-8+(i%3)*5);x.bezierCurveTo(-40,-12+i*2,40,10-i,104,-6+(i%4)*4);x.stroke()}x.fillStyle=hi;x.fillRect(-108,-12,216,2);return}
    if(k==='handle'){poly([[-100,-7],[84,-10],[100,-6],[100,6],[84,10],[-100,7]],body);x.fillStyle=hi;x.fillRect(-96,-6,176,2);x.fillStyle=dk;x.fillRect(-96,3,176,2);return}
    if(k==='bow'){x.beginPath();x.moveTo(-8,-70);x.quadraticCurveTo(46,0,-8,70);x.lineTo(-14,70);x.quadraticCurveTo(34,0,-14,-70);x.closePath();x.fillStyle=body;x.fill();x.stroke();x.strokeStyle='#e8dfc8';x.lineWidth=1.2;x.beginPath();x.moveTo(-12,-70);x.lineTo(-12,70);x.stroke();x.fillStyle=dk;x.fillRect(26,-8,8,16);return}
    if(k==='staff'){poly([[-110,-5],[96,-5],[96,5],[-110,5]],body);x.fillStyle=hi;x.beginPath();x.arc(108,0,12,0,7);x.fill();x.stroke();x.fillStyle=dk;x.fillRect(-20,-6,10,12);return}
    if(k==='rod'){poly([[-112,-3],[104,-1.5],[104,1.5],[-112,3]],body);x.fillStyle=dk;x.beginPath();x.arc(-70,8,9,0,7);x.fill();x.stroke();x.strokeStyle='#e8dfc8';x.lineWidth=1;x.beginPath();x.moveTo(104,0);x.quadraticCurveTo(110,30,100,44);x.stroke();return}
    if(k==='arrows'){for(let i=-1;i<=1;i++){const y=i*12;x.fillStyle=body;x.fillRect(-96,y-2,176,4);x.strokeRect(-96,y-2,176,4);poly([[80,y-6],[104,y],[80,y+6]],mix('#8d8f9c','#ffffff',.2));poly([[-104,y-6],[-90,y-2],[-90,y+2],[-104,y+6]],'#e8dfc8')}return}
    if(k==='quiver'){poly([[-30,-52],[30,-52],[22,56],[-22,56]],body);x.fillStyle=dk;x.fillRect(-26,-40,52,6);x.fillStyle='#e8dfc8';[[-12,-70],[0,-76],[12,-68]].forEach(([a,b])=>x.fillRect(a,b,4,24));return}
    if(k==='leather'){x.beginPath();x.moveTo(-96,-30);x.quadraticCurveTo(-60,-52,-20,-36);x.quadraticCurveTo(30,-50,70,-34);x.quadraticCurveTo(100,-10,84,20);x.quadraticCurveTo(70,46,20,38);x.quadraticCurveTo(-30,52,-70,34);x.quadraticCurveTo(-110,10,-96,-30);x.closePath();x.fillStyle=body;x.fill();x.stroke();x.strokeStyle=dk;x.lineWidth=1;x.setLineDash([3,3]);x.beginPath();x.moveTo(-84,-20);x.quadraticCurveTo(0,-34,74,-22);x.moveTo(-84,22);x.quadraticCurveTo(0,38,72,28);x.stroke();x.setLineDash([]);return}
    if(k==='thread'){for(let i=0;i<5;i++){x.beginPath();x.ellipse(0,-14+i*7,38,10,0,0,7);x.fillStyle=i%2?body:hi;x.fill();x.stroke()}return}
    if(k==='block'){poly([[-70,-34],[70,-34],[70,34],[-70,34]],body);x.strokeStyle=dk;x.lineWidth=1.2;x.beginPath();x.moveTo(-70,0);x.lineTo(70,0);x.moveTo(-20,-34);x.lineTo(-20,0);x.moveTo(30,0);x.lineTo(30,34);x.stroke();x.fillStyle=hi;x.fillRect(-68,-32,136,3);return}
    if(k==='column'){poly([[-34,-60],[34,-60],[30,-50],[-30,-50]],hi);poly([[-24,-50],[24,-50],[22,50],[-22,50]],body);x.strokeStyle=dk;x.lineWidth=1;for(let i=-2;i<=2;i++){x.beginPath();x.moveTo(i*9,-48);x.lineTo(i*8.5,48);x.stroke()}poly([[-30,50],[30,50],[34,60],[-34,60]],dk);return}
    if(k==='statue'){poly([[-34,46],[34,46],[38,60],[-38,60]],dk);x.beginPath();x.moveTo(-18,46);x.quadraticCurveTo(-26,6,-14,-12);x.quadraticCurveTo(-22,-30,-8,-44);x.quadraticCurveTo(0,-58,8,-44);x.quadraticCurveTo(22,-30,14,-12);x.quadraticCurveTo(26,6,18,46);x.closePath();x.fillStyle=body;x.fill();x.stroke();x.fillStyle=hi;x.beginPath();x.arc(-3,-44,7,0,7);x.fill();return}
    if(k==='ring'){x.scale(.66,.66);x.lineWidth=11;x.strokeStyle='rgba(8,6,5,.9)';x.beginPath();x.ellipse(0,8,44,40,0,0,7);x.stroke();x.lineWidth=8;x.strokeStyle=body;x.stroke();x.lineWidth=2;x.strokeStyle=hi;x.beginPath();x.ellipse(0,8,44,40,0,3.6,5.6);x.stroke();x.lineWidth=1.4;x.strokeStyle='rgba(8,6,5,.9)';poly([[-12,-34],[12,-34],[8,-22],[-8,-22]],hi);return}
    if(k==='amulet'){x.lineWidth=2;x.strokeStyle=hi;x.beginPath();x.arc(0,-34,46,.2,Math.PI-.2,true);x.stroke();x.lineWidth=1.4;x.strokeStyle='rgba(8,6,5,.9)';poly([[0,-22],[24,4],[0,40],[-24,4]],body);poly([[0,-8],[10,4],[0,22],[-10,4]],hi);return}
    if(k==='gem'){x.scale(.8,.8);poly([[-30,-14],[-14,-30],[14,-30],[30,-14],[0,34]],body);x.strokeStyle=dk;x.lineWidth=1;x.beginPath();x.moveTo(-30,-14);x.lineTo(30,-14);x.moveTo(-14,-30);x.lineTo(-6,-14);x.lineTo(0,34);x.moveTo(14,-30);x.lineTo(6,-14);x.lineTo(0,34);x.stroke();poly([[-12,-26],[0,-28],[-4,-18]],'rgba(255,255,255,.7)');return}
    if(k==='cloth'){poly([[-90,-34],[90,-30],[96,34],[-86,38]],body);x.strokeStyle=dk;x.lineWidth=1;for(let i=0;i<5;i++){x.beginPath();x.moveTo(-80+i*38,-32);x.quadraticCurveTo(-70+i*38,0,-80+i*38,36);x.stroke()}x.fillStyle=hi;x.fillRect(-88,-32,176,3);return}
    poly([[-96,-14],[96,-14],[78,14],[-78,14]],body);x.fillStyle=hi;x.fillRect(-90,-12,176,3);x.fillStyle=dk;x.fillRect(-70,6,140,3)}

  // ---------- partículas y textos ----------
  function spark(x,y,n,c,sp,o){o=o||{};for(let i=0;i<n&&PA.length<MAXP;i++){const a=(o.a==null?-Math.PI/2:o.a)+(rnd()-.5)*(o.spread||Math.PI),v=(o.v||160)*(.4+rnd()*.8);PA.push({x,y,vx:Math.cos(a)*v*(sp||1),vy:Math.sin(a)*v*(sp||1),g:o.g==null?420:o.g,life:(o.life||.7)*(.6+rnd()*.7),t:0,c:Array.isArray(c)?c[(rnd()*c.length)|0]:c,r:(o.r||2.6)*(.6+rnd()*.8),k:o.k||0})}}   // k: 0 chispa · 1 mota · 2 humo · 3 gota · 4 viruta/serrín
  function text(s,x,y,c,sz,o){if(st.end&&st.end.ok)return;if(F.length>5)F.shift();F.push({s,x,y,c,sz:sz||15,t:0,life:(o&&o.life)||1.1,vy:-38,pop:(o&&o.pop)||1})}
  function ring(x,y,c,r1,life){st.ring.push({x,y,c,r:4,r1:r1||70,t:0,life:life||.45})}
  const STR=['Bien','¡Bien!','¡Genial!','¡Magnífico!','¡INCREÍBLE!'];
  const heroOn=()=>USE_HERO&&!!HS&&performance.now()-hsT<500;
  const handPt=()=>hand?[HX-HSZ/2+hand[0]*HSZ,HY-HSZ/2+hand[1]*HSZ]:[HX+52,HY+8];   // mano derecha del héroe en la escena (sin traslación de estación)
  const heroFeet=()=>HY+.196*HSZ;

  // ---------- efectos por acción ----------
  function act(id,exc,r,snap,s){
    if(!on)return;const a=WK.A[id],t=a.t==='pq'?'p':a.t,miss=r&&r.hit===false,now=performance.now(),fx=TH.fx[t]||TH.fx.u;
    const dp=Math.round((s.prog-snap.prog)/Math.max(1,s.progMax)*100),dq=Math.round(WK.hq(s)-snap.hq),dd=Math.round(s.dur-snap.dur);
    if(miss){st.streak=0;st.mood=-1;st.moodT=1.2;spark(300,138,10,'#8a867e',.6,{k:2,g:-60,life:1,spread:Math.PI*.8});text('Falló',300,110,'#c0867a',15);st.shake=3;return}
    st.streak=(now-st.lastAct<6500)?st.streak+1:1;st.lastAct=now;const sc=clamp(st.streak,1,5),big=exc||sc>=4;
    st.heat=clamp(st.heat+(t==='p'?.2:t==='b'?.35:.07)*(TH.hot?1:.4),0,1);
    if(exc||sc>=4){st.mood=1;st.moodT=1.4}
    st.tool={spr:fx.spr,t:0,fx,hit:false,dbl:(a.d||1)>=2||id==='gd'||id==='gw',pow:clamp(.5+(a.e||100)/400+(exc?.4:0),.5,1.4),exc};
    st.pendText=t==='p'?(dp>0?{s:'+'+dp+' %',c:exc?'#fff1b0':'#ffb347',sz:15+Math.min(10,dp/3)}:null):t==='q'?(dq>0?{s:'+'+dq+' % calidad',c:exc?'#ffe9a0':'#8fc4ff',sz:15+Math.min(8,dq/2)}:null):{s:t==='r'&&dd>0?'+'+dd+' resistencia':a.n,c:t==='r'?'#9fe1a8':'#e8cf94',sz:15};
    if(t==='b'){st.fire=Math.min(1.6,st.fire+.9);ring(300,140,fx.c[0],90,.6)}
    if(sc>=3&&(t==='p'||t==='q'))text('x'+sc+' '+STR[sc-1],470,40,sc>=4?'#ffd36b':'#e8dfc8',12+sc*2.2,{pop:1.4});
    if(big){st.flash=Math.max(st.flash,.28);st.flashC=exc?'#ffe9a0':'#ffd8a0'}}
  function impact(w){
    const fx=w.fx,p=w.pow,ex=w.exc,c=fx.c;st.kick=1;st.zp=Math.max(st.zp,.04*p);
    if(fx.spr==='hammer'||fx.spr==='saw'||fx.spr==='knife'||fx.spr==='needle'){st.shake=Math.max(st.shake,(fx.spr==='hammer'?5:2)*p);st.squash=fx.spr==='hammer'?.1*p:.03}
    if(fx.spr==='hammer'){st.flash=Math.max(st.flash,.18*p);st.flashC='#fff3d8';spark(300,134,Math.round(16*p)+(ex?16:0),ex?'#fff1b0':c,1.1,{a:-Math.PI/2,spread:Math.PI*.95,v:230,life:.8});spark(300,134,Math.round(8*p),'#ff6a1a',.8,{spread:Math.PI,v:150,life:1,r:3.2});ring(300,136,ex?'#ffe9a0':'#ffb347',50+40*p,.4)}
    else if(fx.k===4){spark(300,132,Math.round(12*p)+(ex?10:0),c,.8,{a:-Math.PI/2,spread:Math.PI*.9,v:130,g:380,life:.8,k:4,r:2.2})}
    else spark(300,132,Math.round(8*p),c,.7,{a:-Math.PI/2,spread:Math.PI,v:110,g:200,life:.9,k:fx.k===3?3:1,r:2});
    st.heat=clamp(st.heat+.05,0,1);
    if(typeof tone==='function'){const f=1+Math.min(4,st.streak)*.06;try{if(fx.spr==='hammer'){tone(1500*f,.09,'triangle',.05,-500);tone(190*f,.12,'square',.06,-60)}else if(fx.spr==='saw'||fx.spr==='sand'){noise(.12,.06,2600,'bandpass')}else if(fx.spr==='tongs'||fx.spr==='scissors'||fx.spr==='needle'){tone(1400*f,.08,'sine',.04,500);tone(2100*f,.1,'sine',.03,300,.05)}else if(fx.spr==='bucket'||fx.spr==='pot'||fx.spr==='iron'){noise(.2,.05,1800,'highpass')}else noise(.08,.07,900,'lowpass')}catch(e){}}
    if(st.pendText&&!w.shown){w.shown=true;text(st.pendText.s,300,100,st.pendText.c,st.pendText.sz,{pop:1.3});if(fx.spr!=='hammer')ring(300,134,c[0],60,.4)}}

  // ---------- bucle ----------
  function frame(now){if(!on)return;raf=requestAnimationFrame(frame);if(document.hidden||!cv||!cv.isConnected||!cv.offsetParent)return;const dt=Math.min(.05,(now-last)/1000||.016);last=now;update(dt);draw(now/1000)}
  function update(dt){
    st.pg=lerp(st.pg,st.prog,1-Math.exp(-dt*7));st.qg=lerp(st.qg,st.q,1-Math.exp(-dt*7));
    st.heat=Math.max(0,st.heat-dt*.28);st.fire=Math.max(0,st.fire-dt*.5);st.glow=lerp(st.glow,st.cond==='excelente'?1:st.cond==='buena'?.55:0,1-Math.exp(-dt*5));
    st.shake=Math.max(0,st.shake-dt*28);st.flash=Math.max(0,st.flash-dt*1.6);st.squash=Math.max(0,st.squash-dt*.9);st.lift=Math.max(0,st.lift-dt*.6);st.zp=Math.max(0,st.zp-dt*.5);st.kick=Math.max(0,st.kick-dt*5);st.moodT=Math.max(0,st.moodT-dt);if(st.moodT<=0)st.mood=0;
    const w=st.tool;if(w){w.t+=dt;const fx=w.fx,T=fx.spr==='hammer'?(heroOn()?.06:.2):fx.spr==='tongs'?.22:fx.spr==='saw'?.12:fx.spr==='needle'?.16:.2;
      if(!w.hit&&w.t>=T){w.hit=true;impact(w)}
      if(w.dbl&&!w.hit2&&w.t>=T+.2){w.hit2=true;impact(w)}
      if((fx.spr==='saw'||fx.spr==='sand')&&w.t>.12&&w.t<.5&&hash(w.t*99)>.4)spark(300+Math.sin(w.t*30)*50,132,1,fx.c,.5,{spread:.9,v:70,g:200,life:.7,k:4,r:1.8});
      if(fx.spr==='tongs'&&!w.lf){w.lf=1;st.lift=.5}
      if(fx.spr==='bucket'&&w.t>.15&&w.t<.7&&hash(w.t*77)>.3)spark(250,100,1,fx.c,.4,{a:Math.PI/2,spread:.3,v:60,g:500,life:.45,r:1.6,k:3});
      if(fx.spr==='bucket'&&w.t>.4&&!w.st){w.st=1;st.heat=Math.max(0,st.heat-.35);spark(280,140,6,'#d8e4ea',.3,{spread:.9,v:30,g:-70,life:1.3,r:5,k:2})}
      if(w.t>(w.dbl?.8:.75))st.tool=null}
    if(PA.length<MAXP-30&&TH.id==='forge'&&hash((performance.now()|0)*3)>.88)spark(540+hash(performance.now()|0)*40,176,1,'#ff9a3a',.5,{a:-Math.PI/2,spread:.5,v:60,g:-70,life:1.6,r:1.6,k:1});
    if(st.glow>.3&&hash((performance.now()|0)*5)>.8)spark(300+(hash(performance.now()|0)-.5)*180,128,1,st.cond==='excelente'?'#fff1b0':'#ffb347',.4,{a:-Math.PI/2,spread:.4,v:50,g:-40,life:1.2,r:1.6,k:1});
    for(let i=PA.length-1;i>=0;i--){const p=PA[i];p.t+=dt;if(p.t>p.life){PA.splice(i,1);continue}p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if((p.k===0||p.k===4)&&p.y>134&&p.vy>0&&p.x>210&&p.x<390){p.y=134;p.vy*=-.35;p.vx*=.7}}
    for(let i=F.length-1;i>=0;i--){const f=F[i];f.t+=dt;f.y+=f.vy*dt;f.vy*=.96;if(f.t>f.life)F.splice(i,1)}
    for(let i=st.ring.length-1;i>=0;i--){const r=st.ring[i];r.t+=dt;r.r=lerp(4,r.r1,ease(clamp(r.t/r.life,0,1)));if(r.t>r.life)st.ring.splice(i,1)}
    if(st.end){st.end.t+=dt;if(st.end.t>3.4)st.end=null}
    if(performance.now()-st.lastAct>6500)st.streak=0}
  function star(x,y,r){g.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,q=i%2?r*.4:r;g.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q)}g.closePath();g.fill()}
  function gradedHero(){   // el sprite 3D se entona con la luz de la escena: oscurecido/desaturado hacia el óleo, luz cálida por el lado de la fuente y borde de luz
    const W=HS.width;if(!SC3)SC3=mk(448,448);const c=SC3.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,448,448);c.globalCompositeOperation='source-over';c.drawImage(HS,0,0,W,W);c.globalCompositeOperation='source-atop';
    c.fillStyle='rgba(46,30,22,.30)';c.fillRect(0,0,W,W);   // base oscura cálida (como el grado del mundo)
    const gr=c.createLinearGradient(0,0,W,0);gr.addColorStop(0,'rgba(20,16,30,.22)');gr.addColorStop(.5,'rgba(0,0,0,0)');gr.addColorStop(1,TH.hot?'rgba(255,150,60,.42)':'rgba(255,200,120,.30)');c.fillStyle=gr;c.fillRect(0,0,W,W);   // frío por la izquierda, cálido por el lado de la luz
    c.globalCompositeOperation='source-over';return SC3}
  let SC3=null;
  function drawHero(t){
    if(!heroOn())return;const kk=st.kick,fc=heroFeet();g.save();g.translate(HX,fc);   // reacciones 2D: rebote al golpear, hundirse al fallar, brillo al acertar
    g.scale(1+.03*kk,1-.045*kk+(st.mood<0?-.04:0));g.translate(-HX,-fc);g.drawImage(gradedHero(),0,0,HS.width,HS.height,HX-HSZ/2,HY-HSZ/2,HSZ,HSZ);
    if(st.mood!==0||st.glow>.3){const m=st.mood>0?1:st.glow>.3?st.glow*.5:0;if(!SC2)SC2=mk(448,448);const c2=SC2.getContext('2d');c2.setTransform(1,0,0,1,0,0);c2.clearRect(0,0,448,448);c2.globalCompositeOperation='source-over';c2.drawImage(HS,0,0,HS.width,HS.height);c2.globalCompositeOperation='source-atop';c2.fillStyle=st.mood<0?'#703030':(TH.hot?'#ff9a3a':'#ffe9a0');c2.globalAlpha=.4;c2.fillRect(0,0,448,448);c2.globalAlpha=1;
      g.globalAlpha=st.mood<0?.35*clamp(st.moodT,0,1):.3*m*(.7+.3*Math.sin(t*8));g.globalCompositeOperation='lighter';g.drawImage(SC2,0,0,HS.width,HS.height,HX-HSZ/2,HY-HSZ/2,HSZ,HSZ);g.globalCompositeOperation='source-over';g.globalAlpha=1}
    g.restore();
    const hy=fc-HSZ*.52;if(st.mood>0&&st.moodT>0){g.globalAlpha=clamp(st.moodT,0,1);g.fillStyle='#ffe9a0';for(let i=0;i<3;i++){const a=t*4+i*2.1;star(HX+22+Math.cos(a)*18,hy+Math.sin(a)*8,3.5)}g.globalAlpha=1}
    if(st.mood<0&&st.moodT>0){g.globalAlpha=clamp(st.moodT,0,1);g.fillStyle='#9fd8ff';g.beginPath();g.ellipse(HX+34,hy+8+(1.2-st.moodT)*14,2.6,4,0,0,7);g.fill();g.globalAlpha=1}}
  function draw(t){
    const w=cv.width,k=w/VW;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,w,cv.height);
    const sx=(hash(t*60)-.5)*st.shake,sy=(hash(t*60+5)-.5)*st.shake;
    // CÁMARA DE CINE: pulso de zoom en los golpes grandes y acercamiento lento al héroe durante el remate
    const en=st.end&&st.end.ok?st.end:null,em=en?ease(clamp(en.t/.7,0,1))*(1-ease(clamp((en.t-2.7)/.7,0,1))):0,zz=1+st.zp+em*.14,fcx=lerp(320,HX+90,em),fcy=lerp(120,100,em);
    g.setTransform(k,0,0,k,sx*k,sy*k);g.translate(fcx,fcy);g.scale(zz,zz);g.translate(-fcx,-fcy);
    g.drawImage(bg,0,0,VW,VH);
    if(TH.id==='forge'){const fi=.55+st.heat*.35+st.fire*.5+Math.sin(t*9)*.05+Math.sin(t*23)*.04;g.globalCompositeOperation='lighter';const rg=g.createRadialGradient(545,170,4,545,150,150*fi);rg.addColorStop(0,'rgba(255,190,90,'+clamp(.7*fi,0,1)+')');rg.addColorStop(.4,'rgba(255,110,30,'+.28*fi+')');rg.addColorStop(1,'rgba(255,80,10,0)');g.fillStyle=rg;g.fillRect(380,40,260,200);
      for(let i=0;i<5;i++){const fx=510+i*20,fh=(26+hash(i*9+Math.floor(t*8))*26)*(.7+st.fire*.5+st.heat*.4);g.fillStyle='rgba(255,'+(130+i*18)+',40,.55)';g.beginPath();g.moveTo(fx-9,196);g.quadraticCurveTo(fx-6,196-fh*.6,fx+Math.sin(t*10+i)*5,196-fh);g.quadraticCurveTo(fx+7,196-fh*.5,fx+9,196);g.fill()}g.globalCompositeOperation='source-over'}
    g.globalCompositeOperation='lighter';const lg=g.createRadialGradient(300+DX,134,10,300+DX,134,200);lg.addColorStop(0,'rgba(255,150,60,'+((TH.hot?.12:.05)+st.heat*(TH.hot?.28:.1)+st.glow*.12)+')');lg.addColorStop(1,'rgba(255,100,30,0)');g.fillStyle=lg;g.fillRect(0,0,520,240);g.globalCompositeOperation='source-over';
    if(heroOn()){g.fillStyle='rgba(0,0,0,.4)';g.beginPath();g.ellipse(HX,FLOOR+3,34,6,0,0,7);g.fill()}
    g.save();g.translate(DX,0);g.drawImage(stn,0,0,VW,VH);g.restore();
    drawHero(t);
    g.save();g.translate(DX,0);drawPiece(t);drawTools(t);
    g.globalCompositeOperation='lighter';
    for(const p of PA){const a=1-p.t/p.life;if(p.k===2){g.globalCompositeOperation='source-over';g.fillStyle='rgba(200,205,210,'+a*.28+')';g.beginPath();g.arc(p.x,p.y,p.r*(1+p.t*2.5),0,7);g.fill();g.globalCompositeOperation='lighter';continue}
      if(p.k===4){g.globalCompositeOperation='source-over';g.globalAlpha=clamp(a*1.4,0,1);g.fillStyle=p.c;g.fillRect(p.x,p.y,p.r,p.r*.5);g.globalCompositeOperation='lighter';continue}
      g.fillStyle=p.c;g.globalAlpha=clamp(a*1.4,0,1);if(p.k===0){g.fillRect(p.x-p.r/2,p.y-p.r/2,p.r*1.6,p.r*.8)}else{g.beginPath();g.arc(p.x,p.y,p.r,0,7);g.fill()}
      if(p.k===0){g.globalAlpha=a*.5;g.fillRect(p.x-p.vx*.02,p.y-p.vy*.02,p.r,p.r*.6)}}
    g.globalAlpha=1;
    for(const r of st.ring){g.strokeStyle=r.c;g.globalAlpha=1-r.t/r.life;g.lineWidth=3*(1-r.t/r.life)+1;g.beginPath();g.ellipse(r.x,r.y,r.r,r.r*.38,0,0,7);g.stroke()}
    g.globalAlpha=1;g.globalCompositeOperation='source-over';
    for(const f of F){const u=f.t/f.life,pop=u<.18?1+(f.pop-1)*(1-u/.18)+.35*Math.sin(u/.18*Math.PI):1;g.globalAlpha=clamp(1.6-u*1.6,0,1);g.font='500 '+Math.round(f.sz*pop)+'px Cinzel,Georgia,serif';g.textAlign='center';g.lineWidth=3;g.strokeStyle='rgba(10,6,3,.9)';g.strokeText(f.s,f.x,f.y);g.fillStyle=f.c;g.fillText(f.s,f.x,f.y)}
    g.globalAlpha=1;g.restore();
    g.setTransform(k,0,0,k,0,0);
    if(st.flash>0){g.fillStyle=st.flashC;g.globalAlpha=st.flash;g.fillRect(0,0,VW,VH);g.globalAlpha=1}
    const vg=g.createRadialGradient(320,120,110,320,120,380);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.62)');g.fillStyle=vg;g.fillRect(0,0,VW,VH);
    {const tx=texture();g.globalCompositeOperation='soft-light';g.globalAlpha=.55;for(let yy=0;yy<VH;yy+=256)for(let xx=0;xx<VW;xx+=256)g.drawImage(tx,xx,yy);g.globalAlpha=1;g.globalCompositeOperation='source-over'}   // trazo de pincel común a todo el cuadro (une el 3D y el 2D)
    if(st.end){const e=st.end,u=clamp(e.t/3.2,0,1);g.globalAlpha=clamp(Math.min(e.t*3,(1-u)*3),0,1);g.textAlign='center';g.font='500 21px Cinzel,Georgia,serif';g.lineWidth=4;g.strokeStyle='#120c07';const tx=e.ok?e.msg:'La pieza se agota';const pop=1+Math.max(0,.5-e.t*2)*.5;g.save();g.translate(320,40);g.scale(pop,pop);g.strokeText(tx,0,0);g.fillStyle=e.ok?'#ffd36b':'#c0867a';g.fillText(tx,0,0);g.restore();
      if(e.ok){g.font='500 20px Georgia,serif';const stars='★'.repeat(1+Math.round(e.q*3));g.strokeText(stars,320,64);g.fillStyle='#ffe9a0';g.fillText(stars,320,64)}g.globalAlpha=1}
    if(st.streak>=2){g.textAlign='left';g.font='500 '+(14+st.streak*1.5)+'px Cinzel,Georgia,serif';g.lineWidth=3;g.strokeStyle='#120c07';g.strokeText('Combo x'+st.streak,14,226);g.fillStyle=st.streak>=4?'#ffd36b':'#e8dfc8';g.fillText('Combo x'+st.streak,14,226)}}
  function pieceCanvas(hot){const hq=Math.round(hot*12),key=kind+tcol+hq+TH.id;if(PC.k===key)return PC.c;const c=PC.c||mk(560,240);c.width=560;c.height=240;const x=c.getContext('2d');x.translate(280,120);x.scale(2,2);shape(x,kind,tcol,{hot:TH.hot?hq/12:0});PC.k=key;PC.c=c;return c}
  let GE=null,GEk='';   // contorno punteado de lo que FALTA por forjar (más claro que un relleno transparente)
  function ghostEdge(tmp,x,y,w,h){const key=kind+TH.id+tcol;if(!GE||GEk!==key){GEk=key;GE=mk(560,240);const c=GE.getContext('2d');c.drawImage(tmp,0,0);c.globalCompositeOperation='source-in';c.fillStyle='#e8cf94';c.fillRect(0,0,560,240);const o=mk(560,240),oc=o.getContext('2d');for(const[dx,dy]of[[2,0],[-2,0],[0,2],[0,-2]])oc.drawImage(GE,dx,dy);oc.globalCompositeOperation='destination-out';oc.drawImage(GE,0,0);GE=o}
    g.globalAlpha=.55;g.drawImage(GE,x,y,w,h);g.globalAlpha=1}
  function drawPiece(t){
    const sq=st.squash,lift=st.lift,hot=clamp(st.heat*.85+(st.cond==='excelente'?.15:0)+(st.end&&st.end.ok?.25:0),0,1);
    const en=st.end&&st.end.ok?st.end:null,hr=heroOn(),eu=en?ease(clamp(en.t/.6,0,1)):0,lf=en&&!hr?ease(clamp(en.t/.8,0,1))*26:lift*16,SCL=.92;
    g.save();
    if(en&&hr){const hp=handPt(),hx=hp[0]-DX,hy=hp[1]-16;g.translate(lerp(300,hx+28,eu),lerp(130,hy-26,eu)+Math.sin(t*3)*eu*2);g.rotate(lerp(0,-.55,eu)+Math.sin(t*2.2)*eu*.04);const sc=lerp(SCL,.52,eu);g.scale(sc,sc)}   // el objeto sube a SU MANO y la sigue
    else{g.translate(300,130-lf);g.scale((1+sq*.35)*SCL,(1-sq)*SCL)}
    if(!(en&&hr)){g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(0,lf+7,92,5,0,0,7);g.fill()}
    const tmp=pieceCanvas(hot),pw=tmp.width/2,ph=tmp.height/2,u=clamp(st.pg,0,1),span=pw,x0=-span/2,done=en?1:u;
    g.globalAlpha=.10;g.drawImage(tmp,x0,-ph/2,span,ph);g.globalAlpha=1;ghostEdge(tmp,x0,-ph/2,span,ph);
    const sc=SC||(SC=mk(560,240)),sg=sc.getContext('2d');sg.setTransform(1,0,0,1,0,0);sg.clearRect(0,0,560,240);sg.globalCompositeOperation='source-over';
    const rw=Math.max(0,Math.round(span*done*2));if(rw>0)sg.drawImage(tmp,0,0,Math.min(560,rw),240,0,0,Math.min(560,rw),240);
    sg.globalCompositeOperation='source-atop';
    if(st.glow>.05){sg.globalAlpha=st.glow*(.3+.12*Math.sin(t*6));sg.fillStyle=st.cond==='excelente'?'#ffe28a':'#ffb347';sg.fillRect(0,0,560,240);sg.globalAlpha=1}
    const q=clamp(st.qg,0,1);if(q>.05){const sx=((t*.45)%1.6-.3)*560,sh=sg.createLinearGradient(sx-30,0,sx+30,0);sh.addColorStop(0,'rgba(255,255,255,0)');sh.addColorStop(.5,'rgba(230,240,255,'+(.2+q*.55)+')');sh.addColorStop(1,'rgba(255,255,255,0)');sg.fillStyle=sh;sg.fillRect(0,0,560,240)}
    sg.globalCompositeOperation='source-over';g.drawImage(sc,x0,-ph/2,span,ph);
    if(st.glow>.1||en){g.globalCompositeOperation='lighter';const hg=g.createRadialGradient(0,0,6,0,0,130);hg.addColorStop(0,'rgba(255,200,100,'+(en?.35:st.glow*.25)+')');hg.addColorStop(1,'rgba(255,150,50,0)');g.fillStyle=hg;g.fillRect(-150,-70,300,140);g.globalCompositeOperation='source-over'}
    if(done>0&&done<.995){const ex=x0+span*done;g.globalCompositeOperation='lighter';const eg=g.createLinearGradient(ex-18,0,ex+4,0);eg.addColorStop(0,'rgba(255,170,60,0)');eg.addColorStop(1,TH.hot?'rgba(255,220,130,.8)':'rgba(255,235,190,.5)');g.fillStyle=eg;g.fillRect(ex-18,-32,22,64);g.globalCompositeOperation='source-over'}
    g.restore()}
  function drawTools(t){
    const w=st.tool;if(!w)return;const u=w.t;g.save();g.strokeStyle='#080605';g.lineWidth=1.3;g.lineCap='round';
    const hp=handPt(),hx=hp[0]-DX,hy=hp[1]+4;   // las herramientas «sostenidas» parten de la mano del héroe
    switch(w.spr){
      case'hammer':if(!heroOn()){const T=.2,uu=u<T?ease(u/T):1;let a;if(u<T)a=lerp(1.25,.05,uu);else if(!w.dbl||u<T+.2)a=.05+Math.min(.32,(u-T)*1.6);else a=lerp(.37,.05,ease(clamp((u-T-.2)/.07,0,1)))+(u>T+.27?Math.min(.5,(u-T-.27)*1.6):0);
        const px=296,py=58,L=96,x=px+L*Math.sin(a),y=py+L*Math.cos(a);g.strokeStyle='#2c1f16';g.lineWidth=11;g.beginPath();g.moveTo(px,py);g.lineTo(px+46,py-52);g.stroke();g.strokeStyle='#4a3424';g.lineWidth=7;g.stroke();g.translate(x,y);g.rotate(-a);g.fillStyle=WOOD;g.fillRect(-4,-72,8,72);g.strokeStyle='#080605';g.lineWidth=1.3;g.strokeRect(-4,-72,8,72);g.fillStyle='#8a8a96';g.fillRect(-18,-12,36,24);g.strokeRect(-18,-12,36,24)}break;
      case'tongs':{const uu=ease(clamp(u/.22,0,1)),out=u>.5?ease((u-.5)/.2):0,bx=heroOn()?hx:70,by=heroOn()?hy:104,ex=lerp(bx,262,uu)-out*(262-bx);g.strokeStyle='#8a8a94';g.lineWidth=4.5;g.beginPath();g.moveTo(bx,by);g.lineTo(ex,128);g.moveTo(bx,by+6);g.lineTo(ex,134);g.stroke();break}
      case'bellows':{const sq=Math.sin(clamp(u/.7,0,1)*Math.PI);g.translate(430,212);g.fillStyle='#5a3b22';g.beginPath();g.moveTo(-34,0);g.lineTo(-34+sq*8,-26+sq*6);g.lineTo(34-sq*8,-26+sq*6);g.lineTo(34,0);g.closePath();g.fill();g.stroke();break}
      case'bucket':{const tl=Math.min(1,u*4)*-.9;g.translate(250,86);g.rotate(tl);g.fillStyle='#6a6a74';g.beginPath();g.moveTo(-14,-16);g.lineTo(14,-16);g.lineTo(11,16);g.lineTo(-11,16);g.closePath();g.fill();g.stroke();g.fillStyle=w.fx.c[0];g.fillRect(-12,-12,24,5);break}
      case'pot':{const tl=Math.min(1,u*4)*-.8;g.translate(250,92);g.rotate(tl);g.fillStyle='#8a6a48';g.beginPath();g.moveTo(-13,-14);g.lineTo(13,-14);g.lineTo(15,14);g.lineTo(-15,14);g.closePath();g.fill();g.stroke();g.fillStyle=w.fx.c[0];g.fillRect(-11,-12,22,4);if(u>.12&&u<.6&&hash(u*88)>.3)spark(262,106,1,w.fx.c,.4,{a:Math.PI/2,spread:.3,v:50,g:420,life:.5,r:1.8,k:3});break}
      case'saw':{const sx=Math.sin(u*34)*26;g.translate(300+sx,110);g.rotate(-.12);g.fillStyle='#9a9aa4';g.fillRect(-46,-4,92,8);g.strokeRect(-46,-4,92,8);g.fillStyle='#6a6a74';for(let i=0;i<10;i++){g.beginPath();g.moveTo(-44+i*9,4);g.lineTo(-40+i*9,9);g.lineTo(-36+i*9,4);g.fill()}g.fillStyle=WOOD;g.fillRect(36,-10,16,20);g.strokeRect(36,-10,16,20);break}
      case'sand':{const sx=Math.sin(u*22)*40;g.translate(300+sx,114);g.fillStyle='#c79a5a';g.fillRect(-22,-9,44,16);g.strokeRect(-22,-9,44,16);g.fillStyle='#8a5a2a';g.fillRect(-22,5,44,3);break}
      case'knife':{const uu=ease(clamp(u/.25,0,1)),kx=lerp(220,380,uu),ky=lerp(80,134,uu);g.translate(kx,ky);g.rotate(.9);g.fillStyle='#c8d0d8';g.beginPath();g.moveTo(-3,-30);g.lineTo(5,-30);g.lineTo(2,14);g.lineTo(-3,14);g.closePath();g.fill();g.stroke();g.fillStyle=WOOD;g.fillRect(-4,14,8,18);g.strokeRect(-4,14,8,18);break}
      case'needle':{const k=Math.floor(u*18),dn=Math.abs(Math.sin(u*Math.PI*3)),nx=262+(k%5)*18;g.strokeStyle='#f0e6c8';g.lineWidth=1.1;g.beginPath();g.moveTo(nx,70);g.lineTo(nx,118+dn*14);g.stroke();g.strokeStyle='#e8e8f0';g.lineWidth=2.4;g.beginPath();g.moveTo(nx,100-dn*26);g.lineTo(nx,128+dn*14);g.stroke();break}
      case'scissors':{const o=Math.abs(Math.sin(u*Math.PI*3))*.5,sx=lerp(240,350,clamp(u/.7,0,1));g.translate(sx,116);g.strokeStyle='#c8d0d8';g.lineWidth=3;g.beginPath();g.moveTo(-26,-12*(1+o));g.lineTo(18,0);g.moveTo(-26,12*(1+o));g.lineTo(18,0);g.stroke();g.strokeStyle='#e8cf94';g.beginPath();g.arc(-34,-14*(1+o),5,0,7);g.arc(-34,14*(1+o),5,0,7);g.stroke();break}
      case'iron':{const sx=Math.sin(u*18)*34;g.translate(300+sx,112);g.fillStyle='#6a6a74';g.beginPath();g.moveTo(-26,6);g.lineTo(22,6);g.quadraticCurveTo(30,-8,10,-14);g.lineTo(-26,-14);g.closePath();g.fill();g.stroke();if(hash(u*50)>.5)spark(300+sx,112,1,'#d8e4ea',.3,{spread:.8,v:30,g:-70,life:1.2,r:5,k:2});break}
      case'eye':{g.globalAlpha=clamp(1-u*1.3,0,1);g.strokeStyle=w.fx.c[0];g.lineWidth=2;g.beginPath();g.arc(300,86,16+u*14,0,7);g.stroke();break}}
    g.restore()}

  // ---------- API ----------
  function fit(){if(!cv)return;const d=Math.min(2,window.devicePixelRatio||1),w=Math.max(320,Math.round(cv.clientWidth*d));if(cv.width!==w){cv.width=w;cv.height=Math.round(w*VH/VW)}}
  function tap(c,hs){const w=Math.min(448,c.width||0);if(!w)return;if(!HS){HS=mk(w,w);hsx=HS.getContext('2d')}if(HS.width!==w)HS.width=HS.height=w;hsx.clearRect(0,0,w,w);hsx.drawImage(c,0,0,w,w);hsT=performance.now();
    if(hs&&hs.hand&&hs.w)hand=[clamp((hs.hand.x-hs.x)/hs.w,-.2,1.2),clamp((hs.hand.y-hs.y)/hs.h,-.2,1.2)]}
  function faceDir(){if(!USE_HERO)return null;try{const z=TER.standZ(P.x,P.y),c0=ISO.toCanvas(P.x,P.y,z),c1=ISO.toCanvas(P.x+100,P.y,z),c2=ISO.toCanvas(P.x,P.y+100,z),ax=c1.x-c0.x,ay=c1.y-c0.y,bx=c2.x-c0.x,by=c2.y-c0.y,det=ax*by-ay*bx;if(!det)return null;const tx=1,ty=.25,a=(tx*by-ty*bx)/det,b=(ax*ty-ay*tx)/det,l=Math.hypot(a,b)||1;return[a/l,b/l]}catch(e){return null}}
  function mount(root){if(cv)return;el=root;cv=el.querySelector('#wk-cv');if(!cv)return;g=cv.getContext('2d');fit();if(window.ResizeObserver){ro=new ResizeObserver(fit);ro.observe(cv)}}
  function open(rec,outId,skin){
    TH=THEMES[skin]||T_FORGE;kind=kindOf(outId);tcol=colOf(outId);pname=rec&&rec.name||'';PC.k='';bake(TH.id);
    st.heat=TH.hot?.5:.15;st.streak=0;st.end=null;st.prog=st.pg=0;st.q=st.qg=0;st.tool=null;st.mood=0;PA.length=0;F.length=0;st.ring.length=0;
    on=true;hsT=-1e9;hand=null;if(window.R3D&&USE_HERO)R3D.heroTap=tap;last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(frame)}
  function close(){on=false;cancelAnimationFrame(raf);raf=0;if(window.R3D)R3D.heroTap=null}
  function sync(s){st.prog=s.progMax?clamp(s.prog/s.progMax,0,1):0;st.q=clamp(WK.hq(s)/100,0,1);st.dur=s.dur;st.cond=s.cond;st.exc=s.cond==='excelente'}
  function end(ok,q,msg){if(!on)return;st.end={ok,q:q||0,t:0,msg:msg||pname};if(ok){st.flash=.45;st.flashC='#ffe9a0';st.shake=7;st.mood=1;st.moodT=3;ring(300,130,'#ffd36b',150,.8);ring(300,130,'#fff1b0',100,.6);for(let i=0;i<4;i++)spark(300,110,24,i%2?'#ffd36b':'#fff1b0',1.3,{a:-Math.PI/2,spread:Math.PI*1.6,v:260,g:260,life:1.3,r:2.8});try{tone(660,.2,'triangle',.06,330);tone(990,.3,'triangle',.05,440,.12)}catch(e){}}else{st.mood=-1;st.moodT=1.6;spark(300,126,30,'#8a867e',.5,{k:2,g:-50,life:1.6,spread:Math.PI*1.2})}}
  const toolsOf=sk=>(THEMES[sk]||T_FORGE).tools;
  return{mount,open,close,sync,act,end,faceDir,toolsOf,OFSKIN,var:sk=>(THEMES[sk]||T_FORGE).var,get on(){return on},st,tick:(dt,t)=>{update(dt);draw(t||1)}}   // st/tick: solo para pruebas (tools/fast)
})();
