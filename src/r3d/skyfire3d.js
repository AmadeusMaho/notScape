// NotScape · R3D · CIELO EN LLAMAS (22 oct 2026; pedido del dueño: «que haya fuego en general por alrededor del cielo»).
// Un anillo de LLAMARADAS alrededor de la isla del Cielo (más allá de su costa, sobre el mar de nubes) mientras `R3D.skyBurn` > 0 (la caída de Gabriel y la huida): ≈ 64 láminas que SIEMPRE miran a la cámara (billboards, 1 sola
// malla instanciada = 1 draw call), con una llama procedural (ruido fbm que sube, núcleo amarillo, bordes rojos, aditiva). Intensidad = `burn`; desaparece sola al apagarse (sin coste cuando burn≈0: no se dibuja).
// Posiciones deterministas (hash) sobre una elipse alrededor del centro de la zona (BIOMES.zone), en 2 anillos y con alturas/anchos variados. Verificar con `?` el aspecto en la escena de la huida.
import * as THREE from 'three';

const N=64;
const hh=(a,b)=>{const s=Math.sin(a*127.1+b*311.7)*43758.5453;return s-Math.floor(s)};
const VS=`attribute float aSeed;varying vec2 vUv;varying float vSeed;
void main(){vUv=uv;vSeed=aSeed;vec3 c=(modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xyz;float sx=length(instanceMatrix[0].xyz),sy=length(instanceMatrix[1].xyz);
 vec4 mv=viewMatrix*vec4(c,1.);mv.xy+=position.xy*vec2(sx,sy);gl_Position=projectionMatrix*mv;}`;
const FS=`uniform float uT,uK;varying vec2 vUv;varying float vSeed;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){return .5*n(p)+.25*n(p*2.1)+.125*n(p*4.3);}
void main(){vec2 uv=vUv;float y=uv.y,w=abs(uv.x-.5)*2.,t=uT*(.8+vSeed*.5)+vSeed*10.;
 float nz=fbm(vec2(uv.x*3.2+vSeed*7.,y*2.6-t*1.2)),nz2=fbm(vec2(uv.x*6.+vSeed*3.,y*5.-t*2.1));
 float sh=smoothstep(1.,0.,w+(nz-.42)*.95+y*.8);
 float body=sh*(1.-smoothstep(.5,1.,y+(nz2-.5)*.4))*smoothstep(0.,.08,y);
 vec3 col=mix(vec3(1.,.14,.02),vec3(1.,.6,.1),smoothstep(0.,.55,body));col=mix(col,vec3(1.,.86,.4),smoothstep(.7,1.,body)*(1.-y*.8)*.6);
 float a=body*uK;gl_FragColor=vec4(min(col*(.42+body*.6),vec3(1.))*uK,a);}`;

export class SkyFire{
 constructor(scene,W3){this.scene=scene;this.W3=W3;this.t=0;this.on=false;
  const g=new THREE.PlaneGeometry(1,1),seed=new Float32Array(N);for(let i=0;i<N;i++)seed[i]=hh(i,7);g.setAttribute('aSeed',new THREE.InstancedBufferAttribute(seed,1));
  this.U={uT:{value:0},uK:{value:0}};
  const m=new THREE.ShaderMaterial({vertexShader:VS,fragmentShader:FS,uniforms:this.U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
  this.mesh=new THREE.InstancedMesh(g,m,N);this.mesh.frustumCulled=false;this.mesh.renderOrder=7;this.mesh.visible=false;scene.add(this.mesh);this.built=false}
 // coloca las llamaradas (se llama una vez que BIOMES.zone existe)
 build(){const Z=typeof BIOMES!=='undefined'&&BIOMES.zone;if(!Z)return false;const c=this.W3(Z.cx,Z.cy,1),rx=Z.rx*1.1+3,rz=Z.ry*1.12+3,M=new THREE.Matrix4(),q=new THREE.Quaternion(),p=new THREE.Vector3(),s=new THREE.Vector3();
  for(let i=0;i<N;i++){const ring=i%2,a=i/N*Math.PI*2+hh(i,1)*.12,k=1+ring*.16+hh(i,2)*.08,w=4.5+hh(i,3)*5,hgt=8.5+hh(i,4)*10+ring*3;
   p.set(c.x+Math.cos(a)*rx*k,-.6+hh(i,5)*1.8-ring*1.2,c.z+Math.sin(a)*rz*k);s.set(w,hgt,1);M.compose(p.clone().add(new THREE.Vector3(0,hgt*.42,0)),q,s);this.mesh.setMatrixAt(i,M)}
  this.mesh.instanceMatrix.needsUpdate=true;this.built=true;return true}
 update(t,dt,burn){this.t+=dt;const k=Math.max(0,Math.min(1,burn));this.U.uT.value=this.t;this.U.uK.value=k*.95;const vis=k>.02;if(vis&&!this.built)this.build();this.mesh.visible=vis&&this.built}
 dispose(){this.scene.remove(this.mesh);this.mesh.geometry.dispose();this.mesh.material.dispose()}
}
