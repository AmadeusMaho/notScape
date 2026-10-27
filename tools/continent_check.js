// Comprueba src/continent.js (silueta del mapa antiguo A como datos): estadísticas por bioma y PNG de la máscara.
// Uso: node tools/continent_check.js [salida.png] [tpp] [cell]
const fs=require('fs'),zlib=require('zlib'),C=require('../src/continent.js');
const out=process.argv[2]||'continent_mask.png',tpp=+process.argv[3]||4.34,cell=+process.argv[4]||8;
const r=C.build({tpp,cell});
const COL=[[150,176,176],[159,196,106],[79,143,74],[106,148,127],[211,221,224],[154,127,176],[223,189,114],[207,132,132],[185,183,143],[185,90,60],[185,183,143]];
const raw=Buffer.alloc((r.w*3+1)*r.h);
for(let j=0;j<r.h;j++){raw[j*(r.w*3+1)]=0;for(let i=0;i<r.w;i++){const id=r.bio[j*r.w+i],c=COL[id],o=j*(r.w*3+1)+1+i*3;
 let edge=0;if(id){const a=i>0?r.land[j*r.w+i-1]:0,b=j>0?r.land[(j-1)*r.w+i]:0;if(!a||!b)edge=1}
 raw[o]=edge?59:c[0];raw[o+1]=edge?42:c[1];raw[o+2]=edge?26:c[2]}}
const crcT=new Int32Array(256).map((_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c});
const crc=b=>{let c=-1;for(const x of b)c=crcT[(c^x)&255]^(c>>>8);return(c^-1)>>>0};
const ch=(t,d)=>{const l=Buffer.alloc(4);l.writeUInt32BE(d.length);const td=Buffer.concat([Buffer.from(t),d]),cr=Buffer.alloc(4);cr.writeUInt32BE(crc(td));return Buffer.concat([l,td,cr])};
const ih=Buffer.alloc(13);ih.writeUInt32BE(r.w,0);ih.writeUInt32BE(r.h,4);ih[8]=8;ih[9]=2;
fs.writeFileSync(out,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),ch('IHDR',ih),ch('IDAT',zlib.deflateSync(raw)),ch('IEND',Buffer.alloc(0))]));
console.log('mundo',r.tiles.w+'x'+r.tiles.h,'tiles · rejilla',r.w+'x'+r.h,'· ms',r.stats.ms);
console.log('tierra firme',(r.stats.mainLandTiles/1e6).toFixed(2),'M tiles · islas',(r.stats.islandTiles/1e6).toFixed(2),'M');
for(const k in r.stats.byBiome){const b=r.stats.byBiome[k];console.log(k.padEnd(24),String(Math.round(b.tiles)).padStart(9),b.pct+'%')}
const t=r.stats.mainLandTiles,ok=t>3.5e6&&t<5.5e6;console.log(ok?'RESULTADO: OK':'RESULTADO: FALLO (tierra firme fuera de 3,5–5,5 M tiles)');process.exit(ok?0:1);
