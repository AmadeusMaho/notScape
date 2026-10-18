// NotScape · R3D · Lote R3D-HEROE-NR · GRADO «ÓLEO OSCURO» PARA EL HÉROE (y la vista previa del editor).
// El héroe se pinta en un renderer propio con fondo transparente y se copia a la capa 2D (r3d.js drawHero), así que el pase `grade` del mundo
// NO le llegaba: se veía más saturado y limpio que el escenario («pegado»). Esto le aplica la MISMA receta (materials3d.js OIL_GLSL):
//  1) los pases del héroe se pintan en un render target con MSAA y stencil (los rayos X lo necesitan);
//  2) un pase de pantalla completa lo copia al canvas del héroe con: Kuwahara (pincel) CON ALFA, levantado de sombras, grado de color y viñeta.
//     Las manchas de pigmento y la viñeta se calculan en coordenadas de la PANTALLA DEL JUEGO (uOff/uScr), así casan al píxel con el mundo.
//  · Kuwahara con alfa: un sector fuera de la silueta (transparente) tiene varianza 0 y «ganaría», borrando 2 px del borde del héroe; se penaliza
//    la diferencia de alfa con el píxel central, así la silueta se conserva (y el contorno negro sigue nítido).
//  · Trabaja en LINEAL y premultiplicado (lo que sale del render target); al final codifica a sRGB y vuelve a premultiplicar para el canvas alfa.
// Uso: const hg=new HeroGrade(); const rt=hg.begin(renderer,w,h); …renderer.render(...) en rt…; hg.end(renderer,{K,brush,lift,vig,off:[x,y],scr:[w,h]}).
import * as THREE from 'three';
import {OIL_GLSL} from './materials3d.js';

const FRAG=`uniform sampler2D tDiffuse;uniform vec2 uRes,uScr,uOff;uniform float uVig,uK,uBrush,uSc,uThick,uHs;uniform vec3 uLift;varying vec2 vUv;
 ${OIL_GLSL}
 vec4 kuwA(vec2 uv,float s,float ac){vec2 px=s/uRes;vec4 bm=vec4(0.);float bv=1e9;
  for(int q=0;q<4;q++){vec2 sg=vec2(q==0||q==2?-1.:1.,q<2?-1.:1.);vec4 m=vec4(0.);float l2=0.;
   for(int i=0;i<3;i++)for(int j=0;j<3;j++){vec4 c=texture2D(tDiffuse,uv+px*sg*vec2(float(i),float(j)));m+=c;float l=olum(c.rgb);l2+=l*l;}
   m/=9.;float l=olum(m.rgb);float v=l2/9.-l*l+(m.a-ac)*(m.a-ac)*6.;if(v<bv){bv=v;bm=m;}}
  return bm;}
 vec3 srgb(vec3 c){c=max(c,0.);return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(vec3(.0031308),c));}
 // CONTORNO MÍNIMO (calidad Media/Baja/Mínima: el lienzo baja de resolución y el trazo de ~1 px del héroe se desvanece): se ENGROSA el contorno oscuro
 // y el borde de la silueta 1 px del render del héroe, en proporción a lo que se ha perdido de resolución (uThick 0 = sin cambio).
 vec4 thick(vec4 c,vec2 px){vec4 b=c;float bl=c.a>.5?olum(c.rgb/c.a):1e9;
  for(int i=0;i<8;i++){float an=float(i)*.7853982;vec4 n=texture2D(tDiffuse,vUv+px*vec2(cos(an),sin(an)));
   if(n.a>.4){float l=olum(n.rgb/n.a);if(l<bl-.02){bl=l;b=n;}}}
  return mix(c,vec4(b.rgb,max(c.a,b.a)),uThick);}
 void main(){vec4 c=texture2D(tDiffuse,vUv);
  if(uThick>.01)c=thick(c,1./uRes);
  if(c.a<.002){gl_FragColor=vec4(0.);return;}
  if(uBrush>.01){vec4 k=kuwA(vUv,uSc*uHs,c.a);c=mix(c,k,uBrush);}
  float a=clamp(c.a,0.,1.);vec3 col=c.rgb/max(a,1e-3);
  vec2 rs=uRes/uHs,lp=vUv*rs;vec2 sp=vec2(uOff.x+lp.x,uScr.y-uOff.y-rs.y+lp.y);                  // px de la pantalla del juego (origen abajo-izquierda, como vUv del pase del mundo)
  col=oilGrade(col,sp/uSc,uLift,uK);col*=oilVig(sp/uScr,uScr,uVig);
  gl_FragColor=vec4(srgb(col)*a,a);}`;

export class HeroGrade{
 constructor(){this.rt=null;
  this.mat=new THREE.ShaderMaterial({uniforms:{tDiffuse:{value:null},uRes:{value:new THREE.Vector2(1,1)},uScr:{value:new THREE.Vector2(1,1)},uOff:{value:new THREE.Vector2(0,0)},
   uVig:{value:0},uThick:{value:0},uHs:{value:1},uK:{value:0},uBrush:{value:0},uSc:{value:1},uLift:{value:new THREE.Color(0,0,0)}},
   vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:FRAG,depthTest:false,depthWrite:false,blending:THREE.NoBlending,transparent:false});
  this.quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),this.mat);this.quad.frustumCulled=false;this.scene=new THREE.Scene();this.scene.add(this.quad);this.cam=new THREE.OrthographicCamera(-1,1,1,-1,0,1)}
 // prepara el render target (tamaño en px de dispositivo) y lo deja activo
 begin(r,w,h,samples=4){w=Math.max(1,w|0);h=Math.max(1,h|0);
  if(!this.rt||this.rt.width!==w||this.rt.height!==h){if(this.rt)this.rt.dispose();this.rt=new THREE.WebGLRenderTarget(w,h,{samples,depthBuffer:true,stencilBuffer:true,type:THREE.HalfFloatType})}
  r.setRenderTarget(this.rt);r.setClearColor(0,0);r.clear(true,true,true);return this.rt}
 // copia el render target al canvas con el grado. o = {K, brush, lift:Color|hex, vig, sc, off:[x,y] (px, arriba-izquierda), scr:[w,h] (px de la pantalla)}
 end(r,o={}){const u=this.mat.uniforms,rt=this.rt;r.setRenderTarget(null);u.tDiffuse.value=rt.texture;u.uRes.value.set(rt.width,rt.height);
  u.uK.value=o.K||0;u.uThick.value=o.thick||0;u.uHs.value=o.hs||1;u.uBrush.value=o.brush||0;u.uVig.value=o.vig||0;u.uSc.value=o.sc||1;if(o.lift!=null)u.uLift.value.set(o.lift);else u.uLift.value.setRGB(0,0,0);
  const off=o.off||[0,0],scr=o.scr||[rt.width,rt.height];u.uOff.value.set(off[0],off[1]);u.uScr.value.set(scr[0],scr[1]);
  const ac=r.autoClear;r.autoClear=false;r.clear(true,true,true);r.render(this.scene,this.cam);r.autoClear=ac}
 dispose(){if(this.rt)this.rt.dispose();this.mat.dispose();this.quad.geometry.dispose()}
}
