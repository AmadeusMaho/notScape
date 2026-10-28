// NotScape · R3D · materiales compartidos (copiados de docs/style-reference/r3d/referencia-3d.html; si un número no cuadra, manda la referencia).
// toon(color, opciones) = MeshToonMaterial + onBeforeCompile con bandas suaves, musgo, rim, viento de pradera… (guía §4.2).
// hull(geo, t, mat) = contorno de casco invertido irregular (guía §4.3). inkFor(color) = contorno de escenario (color del objeto hacia #140c14).
// NUEVO en F0 (R3D-F0/F1): opción `flat` (sombreado facetado para el héroe low-poly), `inkMat(t)` (casco por shader para mallas que se deforman: tela),
// `G.uInkK` no existe: el factor de contorno por hora se aplica en setInk(). Todo determinista (hash), nunca Math.random.
import * as THREE from 'three';

export const hash=(a,b,c)=>{const h=Math.sin(a*127.1+b*311.7+c*74.7)*43758.5453;return h-Math.floor(h)};
export const vn2=(x,z)=>{const i=Math.floor(x),j=Math.floor(z),fx=x-i,fz=z-j,u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz),h=(a,b)=>hash(a,b,13);return h(i,j)*(1-u)*(1-v)+h(i+1,j)*u*(1-v)+h(i,j+1)*(1-u)*v+h(i+1,j+1)*u*v};
export const fb2=(x,z)=>vn2(x,z)*.6+vn2(x*2.1+5,z*2.1+3)*.28+vn2(x*4.3+9,z*4.3+1)*.12;

// uniformes globales compartidos por todos los materiales (guía §4.2). uTrail = rastro de 4 puntos del jugador en el pasto (x, z, fuerza).
// R3D-ESTETICA-2 (P6, 20 oct 2026): VIENTO visible en pasto y copas (`?wind=0..3`, defecto 1,6; 1 = como antes). Multiplica la ráfaga del pasto (GV_PROJECT) y el vaivén del follaje.
const WIND_K=(()=>{try{const v=new URLSearchParams(location.search).get('wind');return v==null?1.6:Math.max(0,Math.min(3,+v||0))}catch(e){return 1.6}})();
export const G={uWindK:{value:WIND_K},uTrail:{value:[0,1,2,3].map(()=>new THREE.Vector3(99,99,0))},uTime:{value:0},uNight:{value:0},uCloud:{value:1},uLive:{value:1},uSat:{value:1.1},
 uRimCol:{value:new THREE.Color('#fff4dc')},uInk:{value:new THREE.Color('#2a1c1a')},uFireP:{value:new THREE.Vector3(0,-99,0)},uFireI:{value:1},uShrK:{value:1},uWinI:{value:0},uCobH:{value:.05},
 uChrB:{value:new THREE.Vector2(0,0)},uChrFill:{value:.16},uBurn:{value:0}};   // uBurn: «Escapa» (ISLA-7) = el suelo del Cielo se vuelve naranja (0..1, lo fija r3d.js desde `burn`)
// (uChrB/uChrFill: ver abajo)   // Lote R3D-HEROE-NR: uChrB = (y de los pies, altura) del personaje que se va a pintar (lo fija Hero.update); uChrFill = luz de relleno desde la cámara

const GV_COMMON='\nuniform vec3 uTrail[4];float gh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float gn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(gh(i),gh(i+vec2(1,0)),f.x),mix(gh(i+vec2(0,1)),gh(i+vec2(1,1)),f.x),f.y);}';
const GV_PROJECT=v=>`vec4 wp=instanceMatrix*vec4(transformed,1.);vec2 ip=(modelMatrix*vec4(instanceMatrix[3].xyz,1.)).xz;float H=length(instanceMatrix[1].xyz);float b=clamp(position.y,0.,1.4);b*=b;
    float gust=(gn(ip*.7+vec2(uTime*.45,uTime*.18))-.45)*1.6+sin(uTime*1.4+ip.x*1.3+ip.y*.8)*.35+sin(uTime*2.6+ip.x*3.7)*.12;
    vec2 push=vec2(0.);float fl=0.;for(int i=0;i<4;i++){vec2 dv=ip-uTrail[i].xy;float dd=length(dv);float k=smoothstep(.4,.06,dd)*uTrail[i].z;push+=dv/(dd+.02)*k;fl=max(fl,k);}
    wp.xz+=(vec2(.9,.4)*(gust*.13*uWindK+.32)+push*.55)*b*H;wp.y-=(fl*.5+.04)*b*H;
    vec4 mvPosition=viewMatrix*modelMatrix*wp;gl_Position=projectionMatrix*mvPosition;`+(v?'vWP=(modelMatrix*wp).xyz;vLY=position.y;vGust=gust;':'');

// ── SUELO PINTADO (Lote R3D-F1b): adoquines y caminos de tierra dibujados en el shader en coordenadas de MUNDO (nítidos a cualquier zoom). ──
// Adoquines: Voronoi con poco desorden (piedras entre redondas y cuadradas, ~0,2 unidades), tono propio por piedra, junta oscura con musgo,
// bisel (la normal se inclina hacia el borde de cada piedra → las bandas toon le dan volumen) y borde de calle IRREGULAR por piedra (sueltas en la orilla).
// Tierra: manchas de tono, guijarros, gastado más claro en el centro, borde con ruido (no difuminado). vPath/vCob = cuánto camino/adoquín (0–1) en el vértice.
const GROUND_GLSL=`
 vec2 gh2(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return fract(sin(p)*43758.5453);}
 float gn1(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=gh2(i).x,b=gh2(i+vec2(1,0)).x,c=gh2(i+vec2(0,1)).x,d=gh2(i+vec2(1,1)).x;return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
 float gfb(vec2 p){return gn1(p)*.55+gn1(p*2.13+7.)*.3+gn1(p*4.7+3.)*.15;}
 // Voronoi con distancia al borde (iq): x = distancia al borde, yz = centro de la celda, w = id
 vec4 gvor(vec2 x,float J){vec2 n=floor(x),f=fract(x),mg,mr;float md=8.;
  for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 g=vec2(i,j),o=.5+(gh2(n+g)-.5)*J,r=g+o-f;float d=dot(r,r);if(d<md){md=d;mr=r;mg=g;}}
  md=8.;for(int j=-2;j<=2;j++)for(int i=-2;i<=2;i++){vec2 g=mg+vec2(i,j),o=.5+(gh2(n+g)-.5)*J,r=g+o-f;if(dot(mr-r,mr-r)>1e-5)md=min(md,dot(.5*(mr+r),normalize(r-mr)));}
  return vec4(md,x+mr,gh2(n+mg).x);}
 // LAJAS (Q02b-2, 18 oct 2026): el adoquín deja de ser «almohadillas» redondas (referencia al cartoon) y pasa a LAJAS de piedra irregulares, más grandes (~0,32 u),
 // de cara plana y esquinas angulosas: Voronoi con mucho desorden y borde deformado por ruido. Color (fragment) y relieve (vertex) usan estas dos funciones.
 vec2 gwarp(vec2 P){vec2 Q=P*1.75;return Q+(vec2(gn1(Q*.8+3.),gn1(Q*.8+17.))-.5)*.42;}
 vec4 gslab(vec2 P){return gvor(gwarp(P),.95);}
 float gkeep(float c,float id,vec2 P){return c+(fract(id*3.7)-.5)*.5+(gfb(P*1.7)-.5)*.2;}
`;
const GROUND_COLOR=`
 vec3 gN=vec3(0.);float gB=0.;{vec2 P=vWP.xz;
  // ARENA, ORILLA, LECHO y RODERAS (Fase 3, 19 oct 2026). vSh.z = distancia al eje del camino (tiles); vSh.x = arena (0..1, campo continuo, ya NO por tiles); vSh.y = humedad (>0, justo sobre la línea de agua) o profundidad del LECHO (<0, bajo el agua).
  // La arena MODULA el color de vértice (que lleva el material de cada bioma: tabla BEACH en terrain3d.js): grano, bandas de marea paralelas a la orilla, zona mojada oscura y fría, guijarros y restos secos. Borde con ruido (no sigue la rejilla).
  float sa=vSh.x;
  if(sa>.02){float sn=sa+(gfb(P*2.6+4.)-.5)*.46+(gn1(P*11.)-.5)*.1,sm=smoothstep(.3,.46,sn);
   if(sm>.01){float wet=clamp(vSh.y,0.,1.);vec3 sc=diffuseColor.rgb;
    sc*=(.9+.2*gfb(P*1.6+9.))*(.95+.1*gn1(P*58.));
    float rp=sin((sa*30.+gfb(P*1.3)*3.)*6.2831)*.5+.5;sc*=1.-.07*smoothstep(.55,.9,rp);
    sc=mix(sc,sc*vec3(.5,.46,.42),wet*.8);
    vec4 pb=gvor(P*10.,1.);float ph=fract(pb.w*9.7),pr=length(P*10.-pb.yz);
    if(ph>.84-.1*wet&&pr<.2+.07*ph){float pk=smoothstep(.27,.12,pr);vec3 pcol=sc*mix(.5,1.45,fract(pb.w*31.))+.008;sc=mix(sc,pcol*(1.-.35*wet),pk*.9);gN.xz+=(P*10.-pb.yz)*.9*pk;}
    float dr=smoothstep(.72,.9,gfb(P*4.+21.))*smoothstep(.1,.5,sa)*(1.-wet);sc=mix(sc,sc*vec3(.62,.6,.4),dr*.5);
    diffuseColor.rgb=mix(diffuseColor.rgb,sc,sm);}}
  float bd=-vSh.y;
  if(bd>.03){vec3 bc=diffuseColor.rgb*(.8+.35*gfb(P*2.2+5.));
   vec4 pb2=gvor(P*7.,1.);float ph2=fract(pb2.w*5.3),pr2=length(P*7.-pb2.yz);
   if(ph2>.62&&pr2<.26+.1*ph2){float pk2=smoothstep(.34,.14,pr2);bc=mix(bc,bc*mix(.55,1.5,fract(pb2.w*17.))+.006,pk2*.85);}
   float al=smoothstep(.6,.78,gfb(P*1.8+13.));bc=mix(bc,vec3(.03,.075,.04),al*.5*smoothstep(.2,.7,bd));
   diffuseColor.rgb=mix(diffuseColor.rgb,bc,smoothstep(.03,.2,bd));}
  // SUELO DEL BOSQUE (Fase 7, 20 oct 2026; vBio==1): humus oscuro en manchas anchas y HOJARASCA (hojas sueltas ocre, óxido y oliva) sobre el pasto; lo tapan el camino de tierra y el empedrado (van después).
  // Solo color (sin relieve), manchas grandes y suaves, sin grano; colores en LINEAL. Se ve sobre todo donde el pasto no cubre (junto a casas, caminos y troncos).
  if(int(vBio+.5)==1&&vSh.x<.05){float lt=smoothstep(.42,.78,gfb(P*.62+41.)),hu=smoothstep(.5,.85,gfb(P*.35+7.));
   diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.62,.58,.5),hu*.45);
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.05,.036,.02),lt*.4);
   vec4 pl=gvor(P*6.5,1.);float pf=fract(pl.w*7.3),lr=length(P*6.5-pl.yz);
   if(lt>.12&&pf>.42&&lr<.22+.06*pf){float k=fract(pl.w*31.);vec3 lc=k<.4?vec3(.17,.085,.026):k<.75?vec3(.11,.042,.02):vec3(.07,.075,.026);diffuseColor.rgb=mix(diffuseColor.rgb,lc*(.75+.5*fract(pl.w*17.)),smoothstep(.22,.12,lr)*smoothstep(.12,.4,lt)*.85);}}
  // TIERRA (Q02b, 18 oct 2026): oscura y apelmazada, con barro en las zonas húmedas, guijarros grises y el borde comido por la hierba. Colores en LINEAL (#54402c → #6e5238).
  float pe=vPath+(gfb(P*2.2)-.5)*.42+(gn1(P*11.)-.5)*.09;   // R3D-ESTETICA-2: + ruido fino (briznas) sobre el campo ya suavizado (terrain3d.js pfS)
  if(pe>.42){int bi=int(vBio+.5);   // Fase 4c: tierra POR BIOMA (vBio = índice del bioma del tile, de terrain3d.js)
   vec3 d0=vec3(.085,.052,.026),d1=vec3(.15,.09,.045);   // 0 pradera: tierra parda
   if(bi==1){d0=vec3(.07,.04,.022);d1=vec3(.12,.066,.036);}          // bosque: arcilla compacta rojiza, con hojarasca
   else if(bi==2){d0=vec3(.04,.036,.026);d1=vec3(.075,.062,.04);}    // pantano: barro negruzco con paja
   else if(bi==3){d0=vec3(.075,.07,.066);d1=vec3(.12,.112,.105);}    // cumbres: grava gris fría
   else if(bi==4){d0=vec3(.13,.115,.09);d1=vec3(.2,.18,.145);}       // oriental: grava clara RASTRILLADA
   else if(bi==5){d0=vec3(.026,.024,.026);d1=vec3(.05,.045,.045);}   // volcán: ceniza
   else if(bi==6){d0=vec3(.06,.052,.078);d1=vec3(.1,.088,.125);}     // páramo: polvo violáceo
   else if(bi==7){d0=vec3(.2,.14,.075);d1=vec3(.29,.21,.115);}       // desierto: arena compactada
   else if(bi==8){d0=vec3(.17,.14,.1);d1=vec3(.24,.2,.15);}          // costa: arena húmeda
   vec3 dc=mix(d0,d1,gfb(P*1.3+9.));
   dc*=mix(1.08,.92,smoothstep(.5,1.,vPath));
   dc=mix(dc,dc*.86,smoothstep(.3,.8,gfb(P*1.5+2.)));   // 20 oct: tonos en manchas ANCHAS y suaves (antes P*5: moteado fino)
   float mud=smoothstep(.5,.8,gfb(P*1.2+11.));dc=mix(dc,dc*vec3(.62,.58,.55),mud*(bi==2?.75:bi>=7?.12:.5));
   if(bi==1){vec4 pl=gvor(P*6.,1.);if(fract(pl.w*9.7)>.8){float lr=length(P*6.-pl.yz);dc=mix(dc,vec3(.16,.075,.02)*(.7+.6*fract(pl.w*31.)),smoothstep(.3,.16,lr)*.55);}}   // hojarasca: 1 de cada 5 celdas
   if(bi==2)dc=mix(dc,vec3(.2,.16,.07),smoothstep(.74,.9,gfb(vec2(P.x*1.2+P.y*.5,P.y*9.-P.x*3.)+31.))*.35);   // paja: vetas largas
   if(bi==4)dc*=1.-.12*smoothstep(.35,.0,abs(sin(vSh.z*52.)))*step(vSh.z,2.);   // rastrillado: surcos paralelos al camino
   if(bi>=7)dc*=1.+.07*sin(P.x*7.+P.y*3.+gfb(P*2.)*4.);   // ondas de arena
   {float rd=vSh.z+(gfb(P*1.3+5.)-.5)*.09,rl=1.-smoothstep(.0,.07,abs(rd-.3)),rm=smoothstep(.15,.4,gfb(P*.5+17.))*(1.-smoothstep(.5,.75,rd));   // RODERAS (Fase 3): dos surcos a ±.3 tile del EJE del camino (vSh.z = distancia al eje en tiles, de terrain3d.js routeD), a tramos y con meandro
    dc=mix(dc,dc*vec3(.6,.58,.58),rl*rm*.65);dc=mix(dc,dc*vec3(1.06,1.05,1.02),smoothstep(.2,.0,rd)*rm*.4);}
   vec4 pb=gvor(P*9.,1.);float ph=fract(pb.w*7.13);if(ph>(bi==3?.76:bi==4?.84:.9)){float r=length(P*9.-pb.yz);if(r<.24){dc=mix(dc,dc*1.28,smoothstep(.24,.12,r)*.6);gN.xz+=(P*9.-pb.yz)*.5*smoothstep(.24,.08,r);}}   // guijarros: solo 1 de cada 10 celdas, del mismo tono (antes puntos claros por todas partes)
   float ge=1.-smoothstep(.42,.62,pe);dc=mix(dc,dc*vec3(.9,1.15,.7),ge*.35*gfb(P*8.));
   float e=smoothstep(.42,.5,pe);diffuseColor.rgb=mix(diffuseColor.rgb,dc,e*.97);}
  // LAJAS (Q02b-2): piedra tosca entre stoneD #4c4942 y stone #6a665c (propsdark3d.js). Cada laja es un plano propio (inclinación distinta → las bandas toon la separan de la vecina),
  // con veta de sedimento, esquinas astilladas, grietas en algunas, mugre en el borde y poco musgo (solo en las juntas).
  if(vCob>.05){vec4 v=gslab(P);float id=v.w,keep=gkeep(vCob,id,P);
   if(keep>.5){vec3 g0=diffuseColor.rgb;vec2 Qw=gwarp(P);float ed=v.x+(gfb(P*17.)-.5)*.07;float r1=fract(id*13.3),r2=fract(id*5.1),r3=fract(id*8.7);
    vec3 st=mix(vec3(.072,.067,.056),vec3(.126,.116,.096),r1*r1*.55+r1*.45);
    st=mix(st,st*vec3(.9,.98,1.08),step(.6,r2));
    st=mix(st,st*vec3(1.12,1.,.84),step(.84,r3));
    st*=(.93+.14*gn1(Qw*1.4+id*9.));   // F5-limpieza (20 oct): sin vetas de sedimento ni granulado fino (se veía «quebrajado» y demasiado detallado)
    st*=1.+.05*smoothstep(.12,.5,v.x);
    float gr=1.-smoothstep(.04,.24,ed);st*=1.-.16*gr;
    float wt=smoothstep(.58,.78,gfb(P*.9+3.));st=mix(st,st*vec3(.62,.68,.75),wt*.6);
    vec3 mc=mix(vec3(.03,.04,.014),vec3(.05,.066,.02),gn1(P*9.));
    float mg=smoothstep(.55,.82,gfb(P*3.+5.))*(1.-smoothstep(.04,.2,ed))*.5+0.;
    st=mix(st,mc,clamp(mg,0.,.5));
    if(int(vBio+.5)==1){st*=vec3(.93,1.04,.82);st=mix(st,mc*1.5,.24*smoothstep(.5,.8,gfb(P*2.3+27.)));vec4 pl2=gvor(P*8.,1.);if(fract(pl2.w*5.7)>.84&&length(P*8.-pl2.yz)<.2)st=mix(st,vec3(.15,.075,.025)*(.7+.6*fract(pl2.w*29.)),.7);}   // Bosque (Fase 7): lajas con más musgo, tinte verdoso-cálido y alguna hoja caída
    if(int(vBio+.5)==9){st=mix(vec3(.5,.48,.42),vec3(.78,.75,.66),r1*.7+.3*r3)*(.95+.1*gn1(Qw*1.4+id*9.))*(1.-.22*gr);}   // El Cielo (ISLA-4): LAJAS DE MÁRMOL cálido (sin musgo ni piedra oscura)
    vec3 mo=mix(vec3(.03,.025,.018),vec3(.032,.036,.016),smoothstep(.4,.75,gfb(P*3.)));
    float jw=.04+.035*gn1(Qw*2.1);float m=smoothstep(jw,jw+.035,ed);
    float eg=smoothstep(.5,.9,keep);st=mix(mix(st,mc*1.5,.5),st,eg);   // R3D-ESTETICA: las lajas del borde se funden con el pasto (musgo + hierba) en vez de cortarse en dientes
    diffuseColor.rgb=mix(g0*.78,mix(mo,st,m),eg);
    gB=1.-smoothstep(.0,.16,ed);vec2 dd=Qw-v.yz;vec2 tl=(gh2(vec2(id*91.,id*37.))-.5);
    gN.xz+=(dd/(length(dd)+1e-3)*gB*.5-tl*.24)*m*eg;}
   else{diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.62,.56,.42)+vec3(.006,.004,.002),smoothstep(.12,.5,keep)*.65);}}   // franja de tierra pisada junto al empedrado
 }
 if(int(vBio+.5)==9&&uBurn>.001){float bl=dot(diffuseColor.rgb,vec3(.3,.5,.2));vec3 bf=mix(vec3(.5,.1,.012),vec3(1.1,.42,.07),clamp(bl*2.4,0.,1.));diffuseColor.rgb=mix(diffuseColor.rgb,bf,uBurn*.88);}   // ISLA-7: el pasto del Cielo arde (naranja)
`;
// RELIEVE REAL de los adoquines (Lote R3D-F3b, «teselado»): los tiles con adoquín llevan malla densa (terrain3d.js SUBC) y cada vértice sube según el MISMO
// Voronoi que pinta el color (centro de la piedra alto y redondeado, junta abajo), así la silueta y las sombras de cada piedra son geometría de verdad.
const COB_DISP=`
 if(aCob>.05&&uCobH>0.){vec2 P=(modelMatrix*vec4(transformed,1.)).xz;vec4 v=gslab(P);float keep=gkeep(aCob,v.w,P);
  if(keep>.5){float e=smoothstep(.02,.2,v.x);vec2 tl=gh2(vec2(v.w*91.,v.w*37.))-.5;vec2 rel=gwarp(P)-v.yz;
   transformed.y+=uCobH*e*(.5+.9*fract(v.w*11.7)+dot(rel,tl)*.7)*smoothstep(.5,.6,keep);}}
`;
const GROUND_NORMAL=` if(length(gN)>0.){vec3 nw=normalize(vec3(gN.x,1.,gN.z));normal=normalize(mix(normal,(viewMatrix*vec4(nw,0.)).xyz,.85));}
`;
// ── DETALLE DE SUPERFICIE (Lote R3D-F3b, pedido del dueño: «texturizado a las cosas en general») ──
// Procedural (sin imágenes), en ESPACIO DE OBJETO (no «nada» al moverse) con proyección triplanar. Clase: opción tex (nombre/número) o tex:'auto' (por el color:
// madera = marrón saturado, piedra = gris poco saturado, teja = rojo saturado, resto = yeso/moteado). Clases: 1 tela, 2 cuero, 3 metal, 4 pelo, 5 madera,
// 6 piedra, 7 teja, 8 yeso. Modula el color y la NORMAL (bump por derivadas) → las bandas toon dibujan el relieve. texS = frecuencia (1/unidad del objeto).
const DET_GLSL=`
 float dh(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
 float dn(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(dh(i),dh(i+vec3(1,0,0)),f.x),mix(dh(i+vec3(0,1,0)),dh(i+vec3(1,1,0)),f.x),f.y),mix(mix(dh(i+vec3(0,0,1)),dh(i+vec3(1,0,1)),f.x),mix(dh(i+vec3(0,1,1)),dh(i+vec3(1,1,1)),f.x),f.y),f.z);}
 float dfb(vec3 p){return dn(p)*.55+dn(p*2.11+3.1)*.3+dn(p*4.37+7.)*.15;}
 float dcell(vec2 p){vec2 i=floor(p),f=fract(p);float m=1.,m2=1.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(x,y),o=vec2(dh(vec3(i+g,1.)),dh(vec3(i+g,2.)));float d=length(g+o-f);if(d<m){m2=m;m=d;}else if(d<m2)m2=d;}return m2-m;}
 vec2 dPlane(vec2 uv,float k){
  if(k<1.5){float w=sin(uv.x*6.283)*sin(uv.y*6.283)*.5+.5,fo=dfb(vec3(uv*.09,1.));return vec2(w*.3+fo*.7,.92+.13*fo);}
  if(k<2.5){float po=dn(vec3(uv*.9,1.)),sc=smoothstep(.72,.8,dn(vec3(uv*.18,4.)))*.5;return vec2(po*.6-sc,.9+.14*po-sc*.2);}
  if(k<3.5){float br=dn(vec3(uv.x*.15,uv.y*3.,2.)),sc=smoothstep(.97,1.,dn(vec3(uv*.9,5.)));return vec2(br*.5-sc*.6,.9+.14*br+sc*.3);}
  if(k<4.5){float st=dn(vec3(uv.x*4.,uv.y*.35,3.));return vec2(st,.82+.26*st);}
  if(k<5.5){float pl=fract(uv.x*.3),gap=smoothstep(.0,.06,pl)*smoothstep(1.,.95,pl),gr=sin(uv.x*1.6+dfb(vec3(uv.x*.2,uv.y*.05,6.))*7.)*.5+.5;return vec2(gr*.35*gap+gap*.65,(.86+.14*gr)*mix(.62,1.,gap));}
  if(k<6.5){float c=dcell(uv*.16),cr=smoothstep(.0,.07,c),sp=dn(vec3(uv*.8,9.));return vec2(cr*.7+sp*.3,(.9+.12*sp)*mix(.7,1.,cr));}
  if(k<7.5){float row=fract(uv.y*.16),off=floor(uv.y*.16)*.5,col=fract(uv.x*.16+off),ed=smoothstep(.0,.14,row)*smoothstep(0.,.07,col)*smoothstep(1.,.93,col);return vec2(ed*(.5+.5*row),mix(.66,1.,ed)*(.92+.1*dn(vec3(uv*.5,8.))));}
  if(k<9.5){   // 9 MONTAÑA (Fase 49c): roca PINTADA de las cordilleras, sin grietas de celdas: estratos suaves y ondulados + manchas anchas claras/oscuras + vetas finas; escala en unidades de mundo (texS≈1)
   float w=dfb(vec3(uv*.16,3.)),st=dfb(vec3(uv.x*.3,uv.y*1.5+w*2.4,4.)),bd=smoothstep(.35,.65,st),sp=dfb(vec3(uv*.55,7.)),vt=smoothstep(.62,.72,dn(vec3(uv.x*.9,uv.y*3.2+w*3.,8.)));
   return vec2(bd*.5+sp*.35+(1.-vt)*.15,(.8+.3*sp+.12*bd)*(1.-.22*vt));}
  float m=dfb(vec3(uv*.2,1.));return vec2(m,.93+.1*m);}
`;
const DET_COLOR=`
 float dH=0.;{vec3 P=vOP*uTexS,N=abs(vON);N=pow(N,vec3(4.));N/=N.x+N.y+N.z+1e-4;float k=uTexK;
  if(k<.5){vec3 c=dBase;float mx=max(c.r,max(c.g,c.b)),mn=min(c.r,min(c.g,c.b)),sa=mx>0.?(mx-mn)/mx:0.,hu=0.;
   if(mx-mn>1e-4){if(mx==c.r)hu=mod((c.g-c.b)/(mx-mn),6.);else if(mx==c.g)hu=(c.b-c.r)/(mx-mn)+2.;else hu=(c.r-c.g)/(mx-mn)+4.;hu/=6.;}
   k=8.;if(sa<.18&&mx<.6)k=6.;else if(sa>.3&&hu>.03&&hu<.16)k=5.;else if(sa>.45&&(hu<.03||hu>.95))k=7.;}
   #ifdef SOFT
   if(k==6.)k=8.;   // R3D-PROPS-SUAVES: con geometría de bloques achaflanados la piedra NO lleva celdas/grietas procedurales (hierro oscuro de faroles y herrajes tampoco: se leía como piedra antigua)
   #endif
  vec2 r;
  if(k>8.5){   // MONTAÑA (Fase 49c cierre): estratos que siguen la ALTURA (P.y) con ondulación 3D: en laderas son bandas horizontales y en la cima curvas de nivel suaves (la proyección plana de antes dibujaba elipses sueltas en la tapa)
   float w=dfb(P*.18+vec3(0.,0.,3.)),st=dfb(vec3(P.x*.28,P.y*1.35+w*2.2,P.z*.28)),bdn=smoothstep(.34,.66,st),sp=dfb(P*.5+vec3(7.,0.,0.)),vt=smoothstep(.6,.7,dn(vec3(P.x*.5,P.y*3.4+w*3.,P.z*.5)));
   r=vec2(bdn*.45+sp*.3+(1.-vt)*.12+dn(P*2.3)*.1,(.7+.45*sp+.2*bdn)*(1.-.28*vt));}
  else r=dPlane(P.zy,k)*N.x+dPlane(P.xz,k)*N.y+dPlane(P.xy,k)*N.z;float aa=1.-smoothstep(.25,.7,length(fwidth(P)));dH=r.x*aa;diffuseColor.rgb*=mix(1.,r.y,uTexA*aa);}   // aa: se apaga cuando el patrón es más fino que ~3 px (evita el pixelado)
`;
const DET_NORMAL=` {vec3 dpx=dFdx(-vViewPosition),dpy=dFdy(-vViewPosition);float hx=dFdx(dH),hy=dFdy(dH);vec3 r1=cross(dpy,normal),r2=cross(normal,dpx);float det=dot(dpx,r1);
  vec3 grd=sign(det)*(hx*r1+hy*r2);normal=normalize(abs(det)*normal-grd*uTexB);}
`;
// ── LUCES DINÁMICAS CON OCLUSIÓN POR ALTURA (Lote R3D-LUZ-DIN; datos y mapa en dynlight3d.js) ──
// uLP[i] = (x,y,z de la lámpara, radio), uLC[i] = color·intensidad; uLM = RG8: R = altura superior de props/árboles, G = altura del terreno ((y+3)/24); uLW = (x0,z0,1/ancho,_).
const DUMMY_LM=new THREE.DataTexture(new Uint8Array(2),1,1,THREE.RGFormat,THREE.UnsignedByteType);DUMMY_LM.needsUpdate=true;
Object.assign(G,{uLP:{value:Array.from({length:16},()=>new THREE.Vector4())},uLC:{value:Array.from({length:16},()=>new THREE.Vector4())},uLN:{value:0},uLM:{value:DUMMY_LM},uLW:{value:new THREE.Vector4(0,0,1,0)}});
const LM_PARS=`
 uniform vec4 uLP[16],uLC[16];uniform int uLN;uniform sampler2D uLM;uniform vec4 uLW;
 vec2 lmH(vec2 xz){vec2 uv=(xz-uLW.xy)*uLW.z;if(uv.x<0.||uv.y<0.||uv.x>1.||uv.y>1.)return vec2(-9.);return texture2D(uLM,uv).rg*24.-3.;}
 vec3 lampL(vec3 wp,vec3 nw){vec3 acc=vec3(0.);
  for(int i=0;i<16;i++){if(i>=uLN)break;vec4 P=uLP[i];vec3 d=P.xyz-wp;float r=P.w,d2=dot(d,d);if(d2>=r*r)continue;
   float dist=sqrt(d2);vec3 L=d/max(dist,1e-3);float nl=dot(nw,L);
   float a=1.-dist/r;a*=a;float df=.3+.7*smoothstep(-.25,.75,nl);
   vec3 o0=wp+nw*.24+vec3(0.,.05,0.);float sh=1.;
   for(int s=1;s<=8;s++){float u=float(s)/9.;vec3 q=mix(o0,P.xyz,u);vec2 hh=lmH(q.xz);sh*=smoothstep(-.12,.1,q.y-hh.x)*smoothstep(-.1,.2,q.y-hh.y);}
   acc+=uLC[i].rgb*(a*df*sh);}
  return acc;}
`;
const MC=new Map();
export function toon(c,o={}){const k=c+JSON.stringify(o);if(MC.has(k))return MC.get(k);
 const m=new THREE.MeshToonMaterial({color:c,side:o.side||THREE.FrontSide,vertexColors:!!o.vc});m.userData.ns={tex:o.tex==null?null:String(o.tex),soft:!!o.soft,chr:!!o.chr,ground:!!o.ground,fol:!!o.fol,texB:o.texB==null?null:o.texB};   /* etiqueta para tools/r3d/smooth_check.py: qué materiales llevan textura de clase SIN `soft` (la textura rugosa de la forma antigua) */
 if(o.flat)m.defines={FLAT_SHADED:''};if(o.chr)m.defines=Object.assign(m.defines||{},{CHR:''},o.skin?{SKIN:''}:{});if(o.soft)m.defines=Object.assign(m.defines||{},{SOFT:''});   // soft = sombreado CONTINUO (sin bandas toon) para props de piedra/teja: la forma «Tiny Glade» (Lote R3D-TG-SUAVE)
     // chr = personaje estilo NRftW (ver CHR_* abajo); skin = piel (relleno cálido para que la CARA se lea)
 const U={uMoss:{value:o.moss||0},uMossUp:{value:o.mossUp||0},uFol:{value:o.fol||0},uMossC:{value:new THREE.Color('#3f5a2c')},uMeadow:{value:o.meadow||0},uTrail:G.uTrail,uRim:{value:o.rim||0},uAO:{value:o.ao??0},uWet:{value:o.wet||0}};
 m.onBeforeCompile=s=>{Object.assign(s.uniforms,G,U);
  if(o.gv)s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>'+GV_COMMON).replace('#include <project_vertex>',GV_PROJECT(1));
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;varying float vLY;varying float vGust;uniform float uTime,uWindK;')
   .replace('#include <project_vertex>',`#include <project_vertex>
    vec4 w4=vec4(transformed,1.);
    #ifdef USE_INSTANCING
     w4=instanceMatrix*w4;
    #endif
    w4=modelMatrix*w4;vWP=w4.xyz;vLY=position.y;vGust=0.;`);
  if(o.ground){s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute float aPath,aCob,aBio;attribute vec3 aSh;varying float vPath,vCob,vBio;varying vec3 vSh;uniform float uCobH;'+GROUND_GLSL).replace('#include <begin_vertex>','#include <begin_vertex>\nvPath=aPath;vCob=aCob;vBio=aBio;vSh=aSh;'+COB_DISP);s.uniforms.uCobH=G.uCobH;s.uniforms.uBurn=G.uBurn;
   s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying float vPath,vCob,vBio;varying vec3 vSh;uniform float uBurn;'+GROUND_GLSL).replace('#include <color_fragment>','#include <color_fragment>\n'+GROUND_COLOR).replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n'+GROUND_NORMAL)}
  if(o.emit){s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute float aEmit;varying float vEmit;').replace('#include <begin_vertex>','#include <begin_vertex>\nvEmit=aEmit;');
   s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying float vEmit;uniform float uWinI,uFireI,uShrK;').replace('#include <opaque_fragment>','{float wk=clamp(uWinI,0.,1.);\nif(vEmit>.5&&vEmit<1.5)outgoingLight=mix(vec3(.04,.06,.07)*(1.+dot(outgoingLight,vec3(.33))*1.2),outgoingLight,wk);\nelse if(vEmit>3.5&&vEmit<5.5)outgoingLight=mix(vec3(.03,.024,.022),outgoingLight,.2+.8*wk);\noutgoingLight+=vEmit>5.5?diffuseColor.rgb*vec3(.62,1.,.86)*wk*1.35:vEmit>3.5?diffuseColor.rgb*uFireI*2.2*(.06+.94*wk):vEmit>2.5?diffuseColor.rgb*uFireI*2.2*uShrK:vEmit>1.5?diffuseColor.rgb*uFireI*2.2:vEmit>.5?mix(diffuseColor.rgb,vec3(1.,.6,.26),.75)*uWinI*.8:vec3(0.);}   // ventanas: ámbar cálido (no el azul del cristal). aEmit 6 (Fase 4c) = BIOLUMINISCENCIA: color propio de día, de noche suma un verde-blanco pálido (setas del Bosque y el Pantano)\n#include <opaque_fragment>');
   s.uniforms.uWinI=G.uWinI}   // ventanas/faroles (aEmit=1) se encienden con la noche; fuego/lava (2) brilla siempre con parpadeo
  if(o.tex!=null){const K=typeof o.tex==='number'?o.tex:({auto:0,tela:1,cuero:2,metal:3,pelo:4,madera:5,piedra:6,teja:7,yeso:8,montana:9})[o.tex]||0;
   s.uniforms.uTexK={value:K};s.uniforms.uTexS={value:o.texS||14};s.uniforms.uTexA={value:o.texA??1};s.uniforms.uTexB={value:o.texB??.6};
   s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vOP,vON;').replace('#include <begin_vertex>','#include <begin_vertex>\nvOP=position;vON=normal;');
   s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vOP,vON;uniform float uTexK,uTexS,uTexA,uTexB;'+DET_GLSL).replace('#include <color_fragment>','#include <color_fragment>\n'+DET_COLOR).replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n'+DET_NORMAL)}
  if(o.fol)s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n{vec3 wq=(modelMatrix*vec4(position,1.)).xyz;\n#ifdef USE_INSTANCING\nwq+=instanceMatrix[3].xyz;\n#endif\ntransformed.x+=sin(uTime*1.3+wq.x*1.7+wq.z)*.018*uWindK*position.y;transformed.z+=cos(uTime*1.1+wq.z*1.9)*.012*uWindK*position.y;}');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;varying float vLY;uniform float uSat,uNight,uRim,uAO,uLive,uWet,uMeadow,uMoss,uMossUp,uFol,uCloud,uTime;uniform vec3 uMossC;varying float vGust;uniform vec3 uRimCol;'+LM_PARS+'\n#ifdef CHR\nuniform vec2 uChrB;uniform float uChrFill;\n#endif')
   .replace('#include <gradientmap_pars_fragment>',`
    float h3(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
    float vn(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}
    vec3 getGradientIrradiance(vec3 normal,vec3 L){
     #ifdef SOFT
      {float ls=dot(normal,L)*.5+.5;return vec3(.27+.73*smoothstep(.1,.97,ls));}
     #endif
     float l=dot(normal,L)*.5+.5+(vn(vWP*6.)-.5)*.07;
     #ifdef CHR
      l+=(vn(vec3(vWP.x*19.,vWP.y*5.5,vWP.z*19.))-.5)*.11;   // borde de banda con TRAZOS verticales de pincel (pintado a mano, NRftW)
     #endif
     return vec3(.24+.4*smoothstep(.3,.52,l)+.36*smoothstep(.56,.82,l));}`)
   .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n if(uMeadow>0.)normal=normalize((viewMatrix*vec4(0.,1.,0.,0.)).xyz);\n {float upd=dot(normal,normalize((viewMatrix*vec4(0.,1.,0.,0.)).xyz));float mn=.55+.45*vn(vWP*9.);float mb=uMoss*smoothstep(.24,.02,vWP.y-uMossBase)*mn+uMossUp*smoothstep(.45,.85,upd)*mn;diffuseColor.rgb=mix(diffuseColor.rgb,uMossC*mix(.8,1.15,vn(vWP*23.)),clamp(mb,0.,.9));}')
   .replace('#include <color_fragment>',`#include <color_fragment>
    vec3 dBase=diffuseColor.rgb;   // color de la malla ANTES de saturar/«vivificar» (dependen de la hora): la clase de textura (tex auto) se decide con ESTE color, si no los tejados cambiaban de textura de día y de noche (bug del 20 oct)
    float lum=dot(diffuseColor.rgb,vec3(.299,.587,.114));diffuseColor.rgb=mix(vec3(lum),diffuseColor.rgb,uSat);
    diffuseColor.rgb*=mix(1.,mix(.6,1.,smoothstep(0.,.3,vLY)),uAO);
    diffuseColor.rgb*=mix(1.,mix(1.,.5,smoothstep(-.03,-.095,vWP.y-uMossBase)),uWet);
    if(uMeadow>0.){float t=clamp(vLY/1.1,0.,1.);diffuseColor.rgb*=mix(.84,1.1,t*t*(3.-2.*t));diffuseColor.rgb*=1.+clamp(vGust,0.,1.5)*.16*t;
     diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.08,1.06,.8),smoothstep(.55,.95,t)*.5);}
    float gd=clamp((diffuseColor.g-max(diffuseColor.r,diffuseColor.b))*14.,0.,1.);diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.8,1.38,.6),gd*uLive*(1.-uMeadow*.75-uFol*.6));
    #ifdef CHR
     if(uChrB.y>0.){float hy=clamp((vWP.y-uChrB.x)/uChrB.y,0.,1.);diffuseColor.rgb*=mix(vec3(.6,.68,.72),vec3(1.04,1.02,.98),smoothstep(.04,.82,hy));}   // NRftW: los pies se hunden en sombra fría, la luz se concentra arriba (la cara)
    #endif`)
   .replace('#include <opaque_fragment>',`
    vec3 vdir=isOrthographic?vec3(0.,0.,1.):normalize(vViewPosition);
    outgoingLight+=uRimCol*smoothstep(.55,.8,1.-max(dot(normal,vdir),0.))*uRim*(.3+.7*uNight)*.6;
    if(uLN>0)outgoingLight+=(diffuseColor.rgb*.85+vec3(.045,.03,.018))*lampL(vWP,normalize((vec4(normal,0.)*viewMatrix).xyz));   // Lote R3D-LUZ-DIN
    #ifdef CHR
     {float fv=max(dot(normal,vdir),0.);outgoingLight+=diffuseColor.rgb*uChrFill*(.3+.7*fv);   // luz de relleno desde la cámara: lo que mira al jugador (la cara) nunca cae en la banda oscura
     #ifdef SKIN
      outgoingLight+=diffuseColor.rgb*vec3(.14,.06,.02)*(.35+.65*fv);   // piel: rebote cálido (subsurface falso)
     #endif
     }
    #endif
    #ifndef CHR
     if(uCloud>0.){   // F3f·P2: sombras de nubes sobre el mundo (solo de día, no en personajes para no restar legibilidad). Ruido de mundo de 2 octavas que deriva con el viento (.9,.4); NO es niebla.
      vec2 cq=vWP.xz*.052-vec2(.9,.4)*uTime*.016;float cn=vn(vec3(cq,3.7))*.62+vn(vec3(cq*2.3+7.,1.3))*.38;
      float cs=smoothstep(.5,.66,cn)*uCloud*(1.-uNight);
      outgoingLight*=vec3(1.-cs*.2,1.-cs*.17,1.-cs*.11);}
    #endif
    #include <opaque_fragment>`);
  // uMossBase: altura del suelo bajo el objeto (en el juego el suelo no está siempre en y=0; la referencia sí lo tenía en 0)
  s.fragmentShader=s.fragmentShader.replace('uniform vec3 uMossC;','uniform vec3 uMossC;uniform float uMossBase;');s.uniforms.uMossBase=G.uMossBase||(G.uMossBase={value:0})};
 // Lote ANTI-TIRONES (25 oct 2026): la clave de programa ya NO lleva el color ni los valores de las opciones (antes 't'+color+JSON = UN PROGRAMA DE SHADER POR COLOR: ~150 al cargar y uno
 // nuevo, con congelón, por cada objeto/enemigo de un color no visto). El color y uMoss/uRim/uAO/uWet/uTex* son UNIFORMS: el código GLSL solo cambia con gv/ground/emit/tex/fol
 // (los defines, la cara y vertexColors ya entran solos en la clave de three). onBeforeCompile se sigue llamando por material, así que cada uno conserva sus uniforms.
 // REGLA: si añades una opción que cambia el CÓDIGO del shader (no solo un valor), añádela a esta clave.
 const pk='t'+(o.gv?'g':'')+(o.ground?'G':'')+(o.emit?'e':'')+(o.tex!=null?'x':'')+(o.fol?'f':'');m.customProgramCacheKey=()=>pk;MC.set(k,m);return m}

// contorno irregular (casco invertido), color por hora del día
export const INK=new THREE.MeshBasicMaterial({color:0x2a1c1a,side:THREE.BackSide});
// FLUIDEZ F4 (26 oct 2026): copias del contorno global para los cascos CON HUESOS (actores) y para el HÉROE: así INK no alterna entre mallas normales/instanciadas/con huesos
// ni entre la escena del mundo y la del héroe en el mismo renderer (cada cambio = three re-evalúa el programa). setInk y la opción «Contornos» las mantienen iguales a INK.
export const INK_SK=INK.clone(),INK_H=INK.clone(),INKX=[INK_SK,INK_H];
// clave numérica de posición (cuantizada a 1/500): una Map de números es ~5× más rápida que las claves de texto de antes (el casco de ~585 modelos era la mitad del coste de construir los props al cargar)
const key=(a,i)=>(Math.round(a.getX(i)*500)+4096)*67108864+(Math.round(a.getY(i)*500)+4096)*8192+(Math.round(a.getZ(i)*500)+4096);
export function hull(geo,t,mat){const g=(geo.index?geo.toNonIndexed():geo).clone();g.computeVertexNormals();const p=g.attributes.position,n=g.attributes.normal,s=new Map(),N=p.count,ks=new Array(N);
 for(let i=0;i<N;i++){const k=key(p,i);ks[i]=k;let a=s.get(k);if(!a){a=[0,0,0];s.set(k,a)}a[0]+=n.getX(i);a[1]+=n.getY(i);a[2]+=n.getZ(i)}
 for(let i=0;i<N;i++){const a=s.get(ks[i]),l=Math.hypot(a[0],a[1],a[2])||1,w=t*(.55+.9*hash(p.getX(i)*3,p.getY(i)*3,p.getZ(i)*3));p.setXYZ(i,p.getX(i)+a[0]/l*w,p.getY(i)+a[1]/l*w,p.getZ(i)+a[2]/l*w)}
 g.deleteAttribute('normal');if(g.attributes.uv)g.deleteAttribute('uv');if(g.attributes.color)g.deleteAttribute('color');const m=new THREE.Mesh(g,mat||INK);m.userData.hull=1;return m}
export const INKS=new Map();
export const inkFor=c=>{const k=Array.isArray(c)?c[2]||c[0]:c;if(INKS.has(k))return INKS.get(k);const base=new THREE.Color(k).lerp(new THREE.Color('#140c14'),.62);const m=new THREE.MeshBasicMaterial({color:base.clone(),side:THREE.BackSide});m.userData.base=base;INKS.set(k,m);return m};
// casco por shader (para mallas que cambian cada fotograma, como la tela): empuja cada vértice por su normal en el vértice. La malla debe ser cerrada (con grosor).
const INKD=new Map();
export function inkMat(t){if(INKD.has(t))return INKD.get(t);const m=new THREE.MeshBasicMaterial({color:INK.color,side:THREE.BackSide});
 m.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\ntransformed+=normalize(normal)*${t.toFixed(4)};`)};m.customProgramCacheKey=()=>'ink'+t;m.color=INK.color;INKD.set(t,m);return m}
// FLUIDEZ (26 oct 2026) · twin(m): copia de un material para mallas NORMALES cuando el original lo usan InstancedMesh. three r170 decide «otro programa» cada vez que el MISMO
// material pasa de una malla instanciada a una normal (y vuelve): re-evalúa getParameters (CPU + basura) por cada cambio, en cada pase. La copia comparte onBeforeCompile,
// clave de programa (mismo shader compilado: 0 programas nuevos) y userData; si el original es una tinta de `INKS`, la copia se registra también (noche y reflejo la tratan igual).
// FLUIDEZ F6: material de PROFUNDIDAD propio para las sombras de los InstancedMesh (three usa uno compartido para todo y re-evalúa su programa al alternar instanciado/normal/
// con huesos). Solo para materiales sin textura con recorte (el follaje con alphaTest usa la variante que three cachea por material).
export const DEPTH_I=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking});
export function depthI(m){const mt=m.material;if(mt&&!mt.map&&!(mt.alphaTest>0)&&!mt.alphaMap)m.customDepthMaterial=DEPTH_I;return m}
export function twin(m){const c=m.clone();c.onBeforeCompile=m.onBeforeCompile;c.customProgramCacheKey=m.customProgramCacheKey;c.userData=m.userData;for(const [k,v] of INKS)if(v===m){INKS.set(k+'#twin'+c.id,c);break}return c}
export function setInk(ink,k){INK.color.set(ink);INKX.forEach(m=>m.color.copy(INK.color));INKS.forEach(m=>m.color.copy(m.userData.base).multiplyScalar(k))}

export function mk(geo,c,ink,o){o=o||{};const m=new THREE.Mesh(geo,Array.isArray(c)?c.map(x=>toon(x,o)):toon(c,o));m.castShadow=m.receiveShadow=true;
 if(ink!==0)m.add(o.hero?hull(geo,ink||.045):hull(geo,(ink||.045)*.55,inkFor(c)));return m}
export const jit=(g,a)=>{g=g.index?g.toNonIndexed():g.clone();const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);p.setXYZ(i,x+(hash(x,y,1)-.5)*a,y+(hash(y,z,2)-.5)*a,z+(hash(z,x,3)-.5)*a)}g.computeVertexNormals();return g};
export const glow=(c,k=2.2)=>new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(k)});

// horas del día como datos (guía §4.8). En F1 el 3D usa la fila «dia» y la noche la sigue poniendo la capa 2D (lighting() de game.js) para que sprites 2D y 3D casen.
const TOD_BASE={
 noche:{sky:'#14111b',hemS:'#6a5a8a',hemG:'#2a1f2a',hemI:1.55,sun:'#8aa0ff',sunI:2.5,sunP:[-5,9,3],sat:.9,night:1,live:0,inkK:.55,ink:'#0b0910',rim:'#7a6aff',wDeep:'#08262a',wShal:'#1a4a48',
  bloom:.85,lift:'#06030c',vig:.8,fire:1,win:1},
 atardecer:{sky:'#6a3048',hemS:'#9a7090',hemG:'#3a2428',hemI:2.4,sun:'#ffa070',sunI:3.4,sunP:[-8,4,-2],sat:.95,night:.6,live:.45,inkK:.75,ink:'#1a0e14',rim:'#ff8a6a',wDeep:'#1a3a40',wShal:'#4a7a70',
  bloom:.6,lift:'#160a14',vig:.65,fire:.8,win:.8},
 dia:{sky:'#93cbe8',hemS:'#d4e4ff',hemG:'#6a5a3a',hemI:3.4,sun:'#fff2d4',sunI:4.8,sunP:[-5,10,3],sat:1.1,night:0,live:1,inkK:1,ink:'#2a1c1a',rim:'#fff4dc',wDeep:'#0a6670',wShal:'#48c8b4',
  bloom:.35,lift:'#000000',vig:.28,fire:.35,win:0}};
// mezcla de filas (números se interpolan, colores en RGB). La hora del juego decide los pesos (ver r3d.js todAt).
const _c1=new THREE.Color(),_c2=new THREE.Color();
export function mixTod(a,b,t){const o={};for(const k in a){const x=a[k],y=b[k];o[k]=typeof x==='number'?x+(y-x)*t:Array.isArray(x)?x.map((v,i)=>v+(y[i]-v)*t):'#'+_c1.set(x).lerp(_c2.set(y),t).getHexString()}return o}

// ═══ F3d · ESTILO «ÓLEO OSCURO» No Rest for the Wicked (guía 3D §4.9; demo docs/style-reference/r3d/demo-nrftw.html) ═══
// Las filas de TOD_BASE (arriba) son los DATOS BASE; la variante óleo se DERIVA con nr() (nunca se duplica a mano) y TOD (lo que lee r3d.js)
// = mezcla base→óleo según la perilla K (0 = «NotScape» pastel, 1 = demo al 100 %). K se fija con setOil(K) (ajuste «Óleo» en el HUD, guardado en localStorage).
const _lc=(a,b,t)=>'#'+new THREE.Color(a).lerp(new THREE.Color(b),t).getHexString();
const NR_SKY1='#1b2a2a';
export function nr(p,name){const o=Object.assign({},p),mx=_lc,dim=(c,k,g)=>mx(mx(c,g,.55),'#000000',k);
 o.sky=name==='dia'?mx(mx(p.sky,'#8a9a96',.62),NR_SKY1,.25):dim(p.sky,.1,NR_SKY1);
 o.hemS=mx(p.hemS,name==='noche'?'#5f7a86':'#9aa6a0',.5);o.hemG=mx(p.hemG,'#2a1d14',.6);o.hemI=p.hemI*(name==='dia'?.8:1.0);
 o.sun=mx(p.sun,name==='noche'?'#8fb0b8':'#ffbe78',.55);o.sunI=p.sunI*(name==='dia'?.8:.95);
 o.sat=p.sat*.58;o.inkK=p.inkK*.8;o.ink=mx(p.ink,'#050707',.6);
 o.bloom=p.bloom*.75;o.lift=name==='dia'?'#04080a':'#02080b';o.vig=Math.min(.95,p.vig+.3);
 o.rim=mx(p.rim,'#d8a46a',.55);o.fire=Math.min(1.2,p.fire*1.1+.05);o.win=Math.min(1.2,p.win*1.2);
 o.wDeep=mx(p.wDeep,'#0a1c1a',.5);o.wShal=mx(p.wShal,'#2c4a42',.5);
 return o}
export const TOD={};          // filas VIGENTES para el mundo 3D (se rellenan en setOil; r3d.js las lee cada fotograma)
export const TODH={};         // fila «dia» para el HÉROE (renderer aparte, compuesto en la capa 2D): solo recibe una parte del óleo para no perder legibilidad
export const OIL={K:.7,H:.55};   // F3f·P1 (18 oct 2026): H = fracción de la perilla K que se aplica de DÍA (0 = día sin óleo, 1 = igual que de noche); la noche siempre usa K entera      // perilla de intensidad del óleo, 0..1. Por defecto .7 (PROPUESTA: a confirmar con el dueño viendo el juego real)
// F3f·P1: intensidad efectiva del óleo según la hora. night = 0 (día) … 1 (noche): K·mix(H,1,night). Día ≈ 40 % con K=.7 y H=.55; noche 70 %.
export const hourK=night=>OIL.H+(1-OIL.H)*Math.max(0,Math.min(1,night||0));
export const oilK=night=>OIL.K*hourK(night);
export function setOil(k){k=Math.max(0,Math.min(1,+k||0));OIL.K=k;
 for(const n in TOD_BASE){const b=TOD_BASE[n],t=mixTod(b,nr(b,n),k*hourK(b.night));for(const key in t)TOD[n]=Object.assign(TOD[n]||{},{[key]:t[key]})}
 {const b=TOD_BASE.dia;TODH.dia=mixTod(b,nr(b,'dia'),k*.35*hourK(b.night))}
 if(OIL.G!=null){TOD.dia=goldDay(TOD.dia,OIL.G,true);TODH.dia=goldDay(TODH.dia,OIL.G*.8,false)}return k}
// ═══ R3D-ESTETICA · DÍA DORADO (20 oct 2026) ═══ perilla OIL.G (0..1; `?gold=0` lo apaga). Solo toca la fila «dia» (y el color del sol/hemisférica del héroe).
// Sol más cálido y bajo (sombras más largas y frías), hemisférica fría en sombra, pasto menos «vivo» (live ×.35: era el verde lima que no casaba con la piedra), rim dorado y viñeta algo mayor.
export function goldDay(row,G,full){if(!G)return row;const t=Object.assign({},row);
 t.sun=_lc(row.sun,'#ffc07a',.65);t.hemS=_lc(row.hemS,'#9fb4c4',.5);t.hemG=_lc(row.hemG,'#5a4228',.4);
 if(full){t.live=row.live*.35;t.sat=row.sat*.95;t.vig=Math.min(.95,row.vig+.07);t.rim=_lc(row.rim,'#f0c48a',.5);t.sunP=[-6.5,8.2,3]}
 return mixTod(row,t,G)}
OIL.G=(()=>{try{const v=new URLSearchParams(location.search).get('gold');return v==null?.65:Math.max(0,Math.min(1,+v||0))}catch(e){return .65}})();
export function setGold(g){OIL.G=Math.max(0,Math.min(1,+g||0));setOil(OIL.K);return OIL.G}
setOil(OIL.K);


// ═══ Lote R3D-HEROE-NR · GRADO ÓLEO COMPARTIDO (mundo + héroe + vista previa del editor) ═══
// Antes vivía solo en el shader `grade` de r3d.js; el héroe (renderer aparte, compuesto en la capa 2D) NO lo recibía y se veía saturado y «pegado».
// Ahora el MISMO código lo usan el pase del mundo (r3d.js) y el pase del héroe (herograde3d.js). Colores en LINEAL (antes de OutputPass).
//  oilGrade(c, px, lift, K): levantar sombras + (K) desaturar .86, tono dividido frío/ámbar, contraste ×1.32, manchas de pigmento en px de PANTALLA/escala.
//  oilVig(uvPantalla, resolución, vig): viñeta. Si cambias un número aquí cambia el mundo y el héroe a la vez (es la idea).
export const OIL_GLSL=`
 float oh_(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
 float ovn_(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(oh_(i),oh_(i+vec2(1,0)),f.x),mix(oh_(i+vec2(0,1)),oh_(i+vec2(1,1)),f.x),f.y);}
 float olum(vec3 c){return dot(c,vec3(.299,.587,.114));}
 vec3 oilGrade(vec3 c,vec2 px,vec3 lift,float K){float l=olum(c);c+=lift*(1.-smoothstep(0.,.45,l));
  if(K>.001){vec3 g=c;
   g=mix(vec3(l),g,.86);                                                              // 1 desaturar
   g=mix(g*vec3(.84,1.,1.04),g*vec3(1.14,1.,.8),smoothstep(.08,.9,l));                 // 2 sombras frías, luces ámbar
   g=pow(max(g,0.),vec3(1.06))*1.32;                                                  // 4 contraste y exposición
   float blot=ovn_(px*.012)*.6+ovn_(px*.05)*.4;g*=1.+(blot-.5)*.12;                   // 6 manchas de pigmento grandes y suaves
   c=mix(c,g,K);}
  return c;}
 float oilVig(vec2 uv,vec2 res,float vig){vec2 q=uv-vec2(.5,.45);q.x*=res.x/res.y*.75;return 1.-vig*smoothstep(.42,.95,length(q));}
`;
