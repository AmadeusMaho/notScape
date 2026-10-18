// NotScape · R3D · exporta las mallas 3D del catálogo ORG.U (style-organic.js + spots.js + interior-art.js) a JSON, sin navegador.
// Usa ORG.capture (gancho en style-organic.js): drawMesh no dibuja, apunta cada malla con su color ya tematizado.
// Uso:  node tools/r3d/org_capture.js salida.json [modelo1,modelo2,...] [--compact] [--theme=k]
//   sin lista = todos. --compact = formato de la demo ({nombre:[[color,rig,ink,Vplano,Tplano,centro],...]}, ×KSC aplicado, 1 decimal).
//   Unidades: modelo ORG (px de pantalla a zoom 1). En three: dividir por ORG_PX=39.6 → tiles; ejes ORG (x,y,z↑) → three (x, z, y).
// Los modelos «galleta» 2D (heroe, aldeano, personaje, goblin y todo creatures.js) no tienen malla: se listan como «2D».
const fs=require('fs'),vm=require('vm'),path=require('path');
const SRC=path.join(__dirname,'..','..','src');
const args=process.argv.slice(2),OUT=args[0];if(!OUT){console.error('uso: node tools/r3d/org_capture.js salida.json [ids] [--compact]');process.exit(1)}
const compact=args.includes('--compact'),list=(args[1]&&!args[1].startsWith('--'))?args[1].split(','):null;
const ctx=new Proxy({},{get:(t,k)=>k in t?t[k]:(/^create(Linear|Radial)Gradient$/.test(k)?()=>({addColorStop(){}}):k==='measureText'?()=>({width:10}):k==='getImageData'?()=>({data:new Uint8ClampedArray(4)}):()=>{}),set:(t,k,v)=>{t[k]=v;return true}});
const sb={console,Math,JSON,Object,Array,Map,Set,Float32Array,Uint8Array,Uint8ClampedArray,performance:{now:()=>0},location:{search:''},navigator:{userAgent:''},
 document:{createElement:()=>({width:1,height:1,getContext:()=>ctx,style:{}}),getElementById:()=>null,body:{}}};
sb.window=sb;sb.globalThis=sb;vm.createContext(sb);
const expose='\n;for(const n of ["ORG","STY","STYLE","PAINT"])try{globalThis[n]=eval(n)}catch(e){}';
for(const f of ['paint.js','style.js','style-organic.js','spots.js','interior-art.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8')+expose,sb,{filename:f});
const ORG=sb.ORG;if(!ORG.capture)throw Error('style-organic.js sin ORG.capture');
const names=list||Object.keys(ORG.U),res={},flat=[];
for(const n of names){if(!ORG.U[n]){flat.push(n+': no existe');continue}let parts;
 try{parts=ORG.capture(()=>ORG.U[n](ctx,0,0,0,{}))}catch(e){flat.push(n+': error '+e.message);continue}
 if(!parts.length){flat.push(n+': 2D');continue}
 const r1=q=>Math.round(q*10)/10,r2=q=>Math.round(q*100)/100;
 res[n]=compact?parts.map(p=>[p.col,p.rig?1:0,p.ink?1:0,[].concat(...p.V.map(v=>v.map(q=>r1(q*p.k)))),[].concat(...p.T),p.c?p.c.map(q=>r1(q*p.k)):null])
  :{ksc:ORG.KSC[n]||1,parts:parts.map(p=>({col:p.col,rig:p.rig,ink:p.ink,V:p.V.map(v=>v.map(q=>r2(q*p.k))),T:p.T,c:p.c&&p.c.map(q=>r2(q*p.k))}))}}
fs.writeFileSync(OUT,JSON.stringify(res));
const nanCol=Object.entries(res).filter(([k,v])=>JSON.stringify(v).includes('NaN')).map(([k])=>k);if(nanCol.length)console.log('aviso: colores NaN (el modelo necesita sus opciones reales, p. ej. interiores):',nanCol.join(', '));
console.log('con malla 3D:',Object.keys(res).length,'| sin malla:',flat.length);if(flat.length)console.log('  '+flat.join('\n  '));
console.log(Object.keys(res).length&&flat.every(s=>/: 2D$/.test(s))?'RESULTADO: OK':'RESULTADO: revisar la lista de arriba');
