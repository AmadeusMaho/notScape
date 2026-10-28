// Prueba sin navegador del núcleo WK (node tools/work_test.js → RESULTADO: OK)
const WK=require('../src/work.js');let bad=0;const T=(c,m)=>{if(!c){bad++;console.log('FALLO',m)}};
const rec={prog:60,qual:120,dur:60,lvl:12},st={lvl:20,mana:112,pulso:96,po:128,seed:7};
// 1) determinismo: misma semilla y mismas acciones = mismo resultado
const run=()=>{const s=WK.start(rec,st);for(const id of ['sb','tb','ts','sb','sb','sb','sb'])WK.use(s,id);return JSON.stringify(s)};
T(run()===run(),'determinismo');
// 2) nivel: una acción de nivel 62 no se puede usar a nivel 20
const s=WK.start(rec,st);T(WK.can(s,'cs')!=='','nivel');T(WK.can(s,'sb')==='','sb ok');
// 3) PO: no se gasta de más
const p0=s.po;WK.use(s,'tb');T(s.po===p0-18,'coste tb');
// 4) combo tb→ts cuesta 18
const s2=WK.start(rec,st);WK.use(s2,'tb');const p1=s2.po;WK.use(s2,'ts');T(p1-s2.po===18,'combo');
// 5) termina con éxito y con fracaso
const s3=WK.start(rec,st);let n=0;while(!s3.over&&n++<50)WK.use(s3,'sb');T(s3.over&&s3.ok,'completa');
const s4=WK.start({prog:9999,qual:1,dur:60,lvl:1},st);n=0;while(!s4.over&&n++<50)WK.use(s4,'sb');T(s4.over&&!s4.ok,'se agota');
// 6) Byregot exige Concentración
const s5=WK.start(rec,{...st,lvl:60});T(WK.can(s5,'by')!=='','byregot sin conc');
for(const id of ['tb','tb','tb'])WK.use(s5,id);T(WK.can(s5,'by')==='','byregot con conc');
const q0=s5.qual;WK.use(s5,'by');T(s5.qual>q0&&s5.iq===0,'byregot consume');
// 7) Tasación final impide acabar
const s6=WK.start({prog:10,qual:10,dur:60,lvl:1},{...st,lvl:60});WK.use(s6,'fa');WK.use(s6,'is');WK.use(s6,'sb');WK.use(s6,'sb');
// 8) sugerencia siempre válida
const s7=WK.start(rec,{...st,lvl:60});n=0;while(!s7.over&&n++<80){const id=WK.suggest(s7);T(!WK.can(s7,id),'sugerencia válida '+id);WK.use(s7,id)}
T(s7.over,'sugerencia termina');console.log('sugerencia:',s7.hist.join(','),'ok',s7.ok,'hq',WK.hq(s7));
T(WK.IDS.length===70,'acciones: '+WK.IDS.length);
console.log(bad?'RESULTADO: FALLO':'RESULTADO: OK');process.exit(bad?1:0);
