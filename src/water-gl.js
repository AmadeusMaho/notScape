// NotScape · agua con WebGL (F2-C4). El dueño levantó la regla «nada de 3D» para esto (13 oct 2026): el agua se dibuja con un shader en un canvas WebGL
// que va DEBAJO del canvas 2D del juego. El terreno 2D deja huecos transparentes donde hay agua, y todo lo demás (paredes, árboles, jugador, HUD)
// se dibuja encima en 2D, así que la oclusión sale sola, sin recomponer nada. Estilo: pintado/«toon» (bandas planas de color, cáusticas, espuma, chispas),
// no fotorrealista, para que calce con el resto. Si WebGL no existe, `WGL.ok` es false y world-iso.js pinta el agua en 2D como antes.
// También crea la capa de grano de papel (un div con mix-blend-mode:multiply sobre los dos canvas): así el grano afecta a todo, agua incluida, sin coste por frame.
const WGL=(()=>{
 const S={res:.5,ok:false,gl:null,cv:null,host:null,ref:null,grain:null,prog:null,buf:null,loc:{},paper:[.992,.976,.89],lost:false};
 const VS='attribute vec2 aP;attribute vec3 aW;uniform vec2 uR;varying vec2 vW;varying float vD;void main(){vW=aW.xy;vD=aW.z;gl_Position=vec4(aP.x/uR.x*2.-1.,1.-aP.y/uR.y*2.,0.,1.);}';
 // Fragmento: base por profundidad, manchas profundas, cáusticas (red de líneas brillantes), crestas de ola, espuma en la orilla y chispas. Todo en coordenadas de MUNDO (no se desliza con la cámara).
 const FS=`precision highp float;varying vec2 vW;varying float vD;uniform float uT,uLava;uniform vec3 uBase,uLight,uDark,uFoam,uSpark,uSky;uniform float uSkyA;uniform vec3 uRip[8];
float hs(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float nz(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hs(i),hs(i+vec2(1.,0.)),f.x),mix(hs(i+vec2(0.,1.)),hs(i+vec2(1.,1.)),f.x),f.y);}
float caus(vec2 uv,float t){vec2 p=mod(uv*6.28318,6.28318)-250.;vec2 i=p;float c=1.;float it=.005;
 for(int n=0;n<4;n++){float tt=t*(1.-(3.5/float(n+1)));i=p+vec2(cos(tt-i.x)+sin(tt+i.y),sin(tt-i.y)+cos(tt+i.x));c+=1./length(vec2(p.x/(sin(i.x+tt)/it),p.y/(cos(i.y+tt)/it)));}
 c/=4.;c=1.17-pow(c,1.4);return pow(abs(c),8.);}
void main(){
 float t=uT;vec2 w=mod(vW,128.);
 // oleaje: deforma el espacio suavemente para que todo ondule
 vec2 q=w+vec2(sin(w.y*1.3+t*.8),cos(w.x*1.1+t*.7))*.12;
 vec3 col=mix(uBase,uDark,.55*nz(q*.35+vec2(t*.04,-t*.03)));
 // orilla: más clara y menos profunda cerca de la tierra
 float sh=1.-smoothstep(0.,.75,vD);col=mix(col,mix(uBase,uLight,.55),sh*.8);
 // manchas profundas que se desplazan lento (tono plano, como pincelada)
 float d=nz(q*.55+vec2(-t*.07,t*.03));col=mix(col,uDark,smoothstep(.55,.62,d)*.35*(1.-sh));
 // cáusticas: red brillante, recortada a bandas planas (estilo pintado)
 float c=caus(q*.2,t*.35);col=mix(col,uLight,smoothstep(.35,.6,c)*(.55+.2*uLava));
 // crestas de ola: franjas claras que viajan en diagonal
 float wv=sin((q.x*.9+q.y*.55)*2.6-t*1.5+nz(q*.5)*3.);col=mix(col,uLight,smoothstep(.93,.99,wv)*.5);
 // espuma: borde ondulante en la orilla
 float fo=nz(q*3.+vec2(t*.5,0.))+.22*sin(vD*22.-t*2.2);float foam=(1.-smoothstep(0.,.3,vD))*smoothstep(.5,.72,fo);col=mix(col,uFoam,foam*.9);
 // chispas
 float sp=hs(floor(w*15.));float tw=step(.988,sp)*pow(.5+.5*sin(t*3.+sp*80.),5.);col+=uSpark*tw*.9;
 // lava: costra oscura que se agrieta y brillo que pulsa
 if(uLava>.5){float cr=smoothstep(.5,.62,nz(q*.7+vec2(t*.05,t*.02)));col=mix(col,uDark*.6,cr*.5);col+=uLight*(.08+.06*sin(t*1.7))*(1.-cr);}
 // reflejo del cielo: tinte suave + vetas horizontales planas (como pinceladas) que cambian con la hora
 {float sk=nz(vec2(w.x*.3,w.y*2.4+t*.12));float st=smoothstep(.55,.66,sk);float a=uSkyA*(1.-.8*uLava);col=mix(col,uSky,a*(.1+.32*st*(.4+.6*sh+.0)));}
 // peces: anillos pequeños que aparecen aquí y allá (celdas de 7 tiles, cada una con su ritmo)
 {vec2 cl=floor(vW/7.);float h=hs(cl+.5);if(h>.5&&uLava<.5){float ph=fract(t/10.+h*3.);float ag=ph*10.;if(ag<2.4){vec2 ce=(cl+.15+vec2(hs(cl+3.1),hs(cl+7.7))*.7)*7.;float dd=length(vW-ce);float rr=ag*.28;float rg=(1.-smoothstep(0.,.05,abs(dd-rr)))+(1.-smoothstep(0.,.04,abs(dd-rr*.55)))*.6;col=mix(col,uFoam,clamp(rg,0.,1.)*(1.-ag/2.4)*.75);}}}
 // ondas del jugador y de la pesca: dos anillos que se abren y se desvanecen
 for(int i=0;i<8;i++){vec3 r=uRip[i];if(r.z>=0.){float dd=length(vW-r.xy);float rr=r.z*1.5;float f=1.-r.z/2.;float rg=(1.-smoothstep(0.,.07,abs(dd-rr)))+(1.-smoothstep(0.,.05,abs(dd-rr*.6)))*.6;col=mix(col,uFoam,clamp(rg,0.,1.)*f*.85);}}
 gl_FragColor=vec4(col,1.);}`;
 const NORIP=new Float32Array(24).fill(-1);
 const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
 function sh(gl,type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s}
 function build(){const gl=S.gl,p=gl.createProgram();gl.attachShader(p,sh(gl,gl.VERTEX_SHADER,VS));gl.attachShader(p,sh(gl,gl.FRAGMENT_SHADER,FS));gl.bindAttribLocation(p,0,'aP');gl.bindAttribLocation(p,1,'aW');gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));S.prog=p;['uR','uT','uLava','uBase','uLight','uDark','uFoam','uSpark','uSky','uSkyA','uRip'].forEach(n=>S.loc[n]=gl.getUniformLocation(p,n));S.buf=gl.createBuffer()}
 // grano de papel: patrón 128×128 determinista a un data URL; el div lo repite con multiply
 function grainURL(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),d=x.createImageData(128,128);let a=7;const r=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
  for(let i=0;i<d.data.length;i+=4){const v=r()<.04?185:228+r()*27;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255}x.putImageData(d,0,0);return c.toDataURL()}
 // plan B: si algo falla, se QUITA el canvas GL (si no, taparía el juego con su fondo de papel), se restaura el fondo del canvas 2D y se rehacen los chunks con agua 2D
 function fail(e){S.ok=false;S.err=String(e&&e.message||e);try{if(S.cv&&S.cv.parentNode)S.cv.parentNode.removeChild(S.cv)}catch(x){}S.cv=null;S.gl=null;if(S.ref){S.ref.style.background='';S.ref.style.position='';S.ref.style.zIndex=''}if(typeof TER!=='undefined'&&TER.reset)TER.reset();if(window.console)console.warn('[WGL] agua 2D (plan B):',S.err)}
 function init(ref,opt){opt=opt||{};S.ref=ref;S.host=ref.parentNode;const st='position:absolute;pointer-events:none;';
  try{if(opt.noGL)throw new Error('desactivado');const cv=document.createElement('canvas');cv.style.cssText=st+'z-index:0;background:#fdf9e3';
   const gl=cv.getContext('webgl',{alpha:false,antialias:false,premultipliedAlpha:false,preserveDrawingBuffer:false});if(!gl)throw new Error('sin WebGL');
   S.cv=cv;S.gl=gl;S.host.insertBefore(cv,ref);build();if(gl.getError()!==0)throw new Error('error GL al compilar');if(/[?&]glfail\b/.test(location.search))throw new Error('glfail (prueba)');
   cv.addEventListener('webglcontextlost',e=>{e.preventDefault();S.lost=true});cv.addEventListener('webglcontextrestored',()=>{try{build();S.lost=false}catch(e){fail(e)}});
   ref.style.position='relative';ref.style.zIndex=1;ref.style.background='transparent';S.ok=true}catch(e){fail(e)}
  if(opt.grain!==false){try{const g=document.createElement('div');g.style.cssText=st+'z-index:2;mix-blend-mode:multiply;opacity:.55;background-image:url('+grainURL()+');background-size:128px 128px;image-rendering:pixelated';S.host.insertBefore(g,ref.nextSibling);S.grain=g}catch(e){}}
  fit();return S.ok}
 // alinea el canvas GL y el grano con el área de dibujo (sin borde) del canvas 2D, y fija el tamaño de píxeles del GL
 function fit(){const r=S.ref;if(!r)return;const box='left:'+(r.offsetLeft+r.clientLeft)+'px;top:'+(r.offsetTop+r.clientTop)+'px;width:'+r.clientWidth+'px;height:'+r.clientHeight+'px;';
  [S.cv,S.grain].forEach(e=>{if(!e)return;e.style.left=(r.offsetLeft+r.clientLeft)+'px';e.style.top=(r.offsetTop+r.clientTop)+'px';e.style.width=r.clientWidth+'px';e.style.height=r.clientHeight+'px'});
  const gw=Math.max(2,Math.round(r.width*S.res)),gh=Math.max(2,Math.round(r.height*S.res));if(S.cv&&(S.cv.width!==gw||S.cv.height!==gh)){S.cv.width=gw;S.cv.height=gh}}
 // dibuja los grupos de agua. groups = [{v:Float32Array (x,y,wx,wy,depth por vértice, triángulos sueltos), n:vértices, pal:{base,light,dark,foam,spark}, lava:0|1}]
 function render(groups,t,env){env=env||{};if(!S.ok||S.lost)return false;const gl=S.gl,w=S.ref.width,h=S.ref.height;gl.viewport(0,0,S.cv.width,S.cv.height);gl.clearColor(S.paper[0],S.paper[1],S.paper[2],1);gl.clear(gl.COLOR_BUFFER_BIT);
  if(!groups.length)return true;gl.useProgram(S.prog);gl.uniform2f(S.loc.uR,w,h);gl.uniform1f(S.loc.uT,t);gl.uniform3fv(S.loc.uRip,env.rip||NORIP);gl.uniform3fv(S.loc.uSky,env.sky||[.8,.9,1]);gl.uniform1f(S.loc.uSkyA,env.skyA==null?.5:env.skyA);gl.bindBuffer(gl.ARRAY_BUFFER,S.buf);
  gl.enableVertexAttribArray(0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(0,2,gl.FLOAT,false,20,0);gl.vertexAttribPointer(1,3,gl.FLOAT,false,20,8);
  for(const g of groups){const P=g.pal;gl.uniform1f(S.loc.uLava,g.lava?1:0);gl.uniform3fv(S.loc.uBase,P.base);gl.uniform3fv(S.loc.uLight,P.light);gl.uniform3fv(S.loc.uDark,P.dark);gl.uniform3fv(S.loc.uFoam,P.foam);gl.uniform3fv(S.loc.uSpark,P.spark);
   gl.bufferData(gl.ARRAY_BUFFER,g.v.subarray(0,g.n*5),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,g.n)}
  if(!S.checked){S.checked=1;const er=gl.getError();if(er!==0){fail('error GL '+er);return false}}
  return true}
 // precalentado (pantalla de carga): dibuja un triángulo mínimo con el programa y lee 1 píxel, así el controlador compila/enlaza el shader y lo sube a la GPU ahora y no al ver agua por primera vez
 function warm(){if(!S.ok||S.lost||!S.prog)return false;try{const P={base:[.3,.8,.9],light:[.8,1,1],dark:[.2,.6,.8],foam:[1,1,1],spark:[1,1,1]};
  const ok=render([{v:new Float32Array([0,0,0,0,0,8,0,1,0,0,0,8,0,1,0]),n:3,pal:P,lava:0}],0,{});const px=new Uint8Array(4);S.gl.readPixels(0,0,1,1,S.gl.RGBA,S.gl.UNSIGNED_BYTE,px);return ok}catch(e){return false}}
 return Object.assign(S,{init,fit,render,hex,warm})
})();
if(typeof module!=='undefined')module.exports=WGL;
