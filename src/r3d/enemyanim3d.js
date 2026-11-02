// NotScape · R3D · ANIMACIÓN DE ENEMIGOS HUMANOIDES (Lote N0-ESQUELETOS, 2 nov 2026; el dueño: «cada enemigo con su propio esqueleto y mejores animaciones, apenas se mueven y los ataques no se sienten»).
// ESQUELETO (mini3d.js `Mini.rig2`, solo enemigos): root → pelvis → chest (cintura) → ribs (torso alto) → body → [neck → head] [clavR/L → armR/L → elbR/L → wrR/L → gripR/L];
//   pelvis → legR/L → kneeR/L → ankR/L → toeR/L. 25 huesos (el rig clásico de héroe y PNJ tiene 17 y sigue con `animHuman` de actors3d.js).
// CÓMO SE ANIMA: cada enemigo tiene un ARQUETIPO (tabla ARCH) con tres cosas, todas por DATOS: (1) MARCHA/REPOSO (zancada, rebote, torsión, balanceo, brazos, pisotón),
//   (2) POSTURA DE COMBATE (cuando persigue: guardia, rodillas, rebote), (3) ATAQUE por fotogramas clave (`keys`: poses absolutas en u = .17 anticipación · golpe · seguimiento).
//   `u` es la fase de ataque del juego: el daño cae en u=.18, la anticipación (aviso) se queda congelada en u=.17 y el golpe dura hasta ≈ .30 (≈ 80 ms). Encima, daño recibido,
//   aturdimiento y muerte se suman como reacciones corporales (articulaciones, no solo el giro del modelo entero).
// CÓMO AÑADIR UN ENEMIGO: en su `unit(...)` pon `ani:'brute'` (o el arquetipo que toque) o añade su id a ARC_OF; para algo único, crea un arquetipo nuevo en ARCH (copia uno y cambia poses).
//   Una pose lista solo las articulaciones que controla (JNT); lo demás sigue con la marcha/guardia. Ángulos en radianes; x+ = adelante/abajo en pitch de tronco y cabeza, x− = adelante en brazos y piernas;
//   y+ = giro a la IZQUIERDA del personaje (el arma va en la mano DERECHA = armR); el codo se da como flexión positiva (`eR`: 1.6 = muy doblado).
import * as THREE from 'three';

const cl=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,u)=>a+(b-a)*u,ss=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t)};
export const JNT=['hipY','hipZ','drop','lunge','chX','chY','chZ','rbX','rbY','rbZ','nkX','nkY','hdX','hdY',
 'cRz','cRy','aRx','aRy','aRz','eR','wRx','wRz','cLz','cLy','aLx','aLy','aLz','eL','wLx','wLz',
 'lRx','kR','anR','tR','lLx','kL','anL','tL'];
const NJ=JNT.length,IX={};JNT.forEach((n,i)=>IX[n]=i);
const vec=o=>{const v=new Float32Array(NJ),m=new Uint8Array(NJ);for(const k in o){if(!(k in IX))throw new Error('articulación desconocida: '+k);v[IX[k]]=o[k];m[IX[k]]=1}return{v,m}};

// ── ATAQUES: lista de [u, pose]; entre dos claves se suaviza (smoothstep). La mano principal es la DERECHA (aR/eR/wR). ──
const ATK={
 // golpe vertical a dos manos: se echa hacia atrás, sube el arma por encima de la cabeza y se deja caer con todo el cuerpo (ogros, gigantes, Gruk)
 overhead:{dur:1,keys:[
  [.17,{hipY:-.25,drop:.03,lunge:-.05,chX:-.2,rbX:-.5,rbY:-.25,nkX:-.2,hdX:-.3,cRz:.3,cLz:-.3,aRx:-3.0,aRy:-.15,eR:.5,wRx:-.5,aLx:-2.7,aLy:.2,eL:.6,wLx:-.4,lRx:.3,kR:.35,lLx:-.2,kL:.15}],
  [.27,{hipY:.2,drop:.11,lunge:.2,chX:.4,rbX:.55,rbY:.2,nkX:.25,hdX:.35,cRz:-.1,cLz:.1,aRx:.15,eR:.3,wRx:.5,aLx:.1,eL:.35,wLx:.5,lRx:.35,kR:.5,lLx:-.75,kL:.6,anL:.2}],
  [.5,{hipY:.12,drop:.1,lunge:.18,chX:.35,rbX:.45,nkX:.2,hdX:.3,aRx:.3,eR:.3,aLx:.25,eL:.35,lRx:.3,kR:.45,lLx:-.7,kL:.55}]]},
 // tajo en arco horizontal (de derecha a izquierda): gira el torso hacia el brazo, lo trae cruzando el cuerpo y deja que el peso lo arrastre (bandidos, esqueletos, orcos)
 slash:{dur:1,keys:[
  [.17,{hipY:-.45,hipZ:.05,drop:.04,lunge:-.04,chX:.05,chY:-.5,rbY:-.55,rbX:-.1,nkY:.3,hdY:.3,cRz:.2,cRy:-.3,aRx:-1.45,aRy:-1.15,aRz:.3,eR:1.0,wRz:-.5,aLx:-.5,aLz:.3,eL:.9,lRx:.35,kR:.4,lLx:-.3,kL:.2}],
  [.29,{hipY:.5,hipZ:-.04,drop:.08,lunge:.16,chX:.2,chY:.55,rbY:.7,rbX:.25,nkY:-.3,hdY:-.35,cRz:-.15,cRy:.5,aRx:-1.35,aRy:.95,aRz:0,eR:.15,wRz:.6,aLx:.3,aLz:.5,eL:.5,lRx:.1,kR:.2,lLx:-.55,kL:.45}],
  [.55,{hipY:.4,drop:.06,lunge:.14,chY:.35,rbY:.5,rbX:.2,aRx:-.9,aRy:.5,eR:.4,aLx:.2,lLx:-.45,kL:.35}]]},
 // estocada: retrae el brazo con el hombro atrás y se lanza hacia delante con la pierna adelantada (espadachines, lanceros)
 thrust:{dur:1,keys:[
  [.17,{hipY:-.3,drop:.05,lunge:-.07,chX:.05,chY:-.3,rbY:-.4,rbX:-.05,cRy:-.4,aRx:-1.15,aRy:-.2,eR:1.9,wRx:.2,aLx:-.4,aLz:.5,eL:.7,lRx:.5,kR:.45,lLx:-.2,kL:.3}],
  [.27,{hipY:.25,drop:.12,lunge:.3,chX:.3,chY:.3,rbY:.4,rbX:.2,nkX:.1,cRy:.6,aRx:-1.55,aRy:.1,eR:.05,wRx:-.1,aLx:.5,aLz:.6,eL:.3,lRx:.55,kR:.35,lLx:-.95,kL:.5}],
  [.5,{hipY:.18,drop:.1,lunge:.26,chX:.25,chY:.2,rbY:.3,aRx:-1.45,eR:.15,aLx:.4,lRx:.45,lLx:-.85,kL:.45}]]},
 // ráfaga: dos golpes rápidos, uno con cada mano (dagas, cuchillos, garras pequeñas)
 flurry:{dur:1,keys:[
  [.17,{hipY:-.3,drop:.09,lunge:-.03,chX:.2,chY:-.4,rbY:-.45,rbX:.1,cRz:.2,aRx:-1.7,aRy:-.7,eR:1.3,wRz:-.4,aLx:-.9,aLy:.4,eL:1.0,lRx:.3,kR:.5,lLx:-.35,kL:.4}],
  [.24,{hipY:.45,drop:.12,lunge:.17,chX:.3,chY:.55,rbY:.6,rbX:.2,cRz:-.1,aRx:-1.2,aRy:.8,eR:.25,aLx:-1.8,aLy:-.5,eL:1.4,lRx:.2,kR:.4,lLx:-.5,kL:.55}],
  [.33,{hipY:-.35,drop:.1,lunge:.2,chX:.3,chY:-.45,rbY:-.5,rbX:.2,aRx:-1.5,aRy:-.4,eR:1.0,aLx:-1.25,aLy:.9,eL:.2,wLz:.5,lRx:.35,kR:.5,lLx:-.5,kL:.4}],
  [.55,{hipY:.1,drop:.08,lunge:.12,chX:.2,rbY:.1,aRx:-.8,eR:.8,aLx:-.8,eL:.8}]]},
 // hechizo: recoge energía con los brazos abiertos y echa el cuerpo atrás, luego lanza las dos manos hacia el objetivo (chamanes, brujas, ángeles)
 cast:{dur:1,keys:[
  [.17,{drop:.02,lunge:-.04,chX:-.2,rbX:-.35,nkX:-.35,hdX:-.35,cRz:.4,cLz:-.4,aRx:-1.7,aRz:-.9,eR:.9,wRx:-.6,aLx:-1.7,aLz:.9,eL:.9,wLx:-.6,lRx:.15,kR:.25,lLx:-.15,kL:.15}],
  [.27,{drop:.08,lunge:.12,chX:.3,rbX:.3,nkX:.25,hdX:.2,cRz:-.15,cLz:.15,aRx:-1.55,aRz:.1,eR:.1,wRx:.5,aLx:-1.5,aLz:-.1,eL:.15,wLx:.5,lRx:.2,kR:.35,lLx:-.55,kL:.35}],
  [.55,{drop:.06,lunge:.1,chX:.2,rbX:.2,aRx:-1.4,eR:.3,aLx:-1.4,eL:.3}]]},
 // disparo: brazo del arco adelante (izquierdo), cuerda tensada hasta la mejilla y suelta; el cuerpo de lado
 shoot:{dur:1,keys:[
  [.17,{hipY:-.5,drop:.05,chY:-.55,rbY:-.6,rbX:-.05,nkY:.5,hdY:.55,cRz:.1,cLy:.2,aRx:-1.45,aRy:.15,eR:2.0,wRz:.2,aLx:-1.55,aLy:.05,eL:.05,lRx:.2,kR:.3,lLx:-.2,kL:.2}],
  [.24,{hipY:-.5,drop:.05,chY:-.55,rbY:-.6,rbX:-.1,nkY:.5,hdY:.55,aRx:-1.35,aRy:.1,eR:1.6,wRz:.5,aLx:-1.6,eL:.05,wLx:-.2,lRx:.2,kR:.3,lLx:-.2,kL:.2}],
  [.5,{hipY:-.4,chY:-.4,rbY:-.45,nkY:.35,hdY:.4,aRx:-.9,eR:1.0,aLx:-1.4,eL:.15}]]},
 // zarpazo: ambas garras barren de fuera hacia dentro, el torso se arroja hacia delante (demonios, oni, bestias erguidas)
 claw:{dur:1,keys:[
  [.17,{hipY:-.2,drop:.08,lunge:-.05,chX:-.1,chY:-.35,rbX:-.25,rbY:-.4,nkX:-.2,hdX:-.25,cRz:.35,cLz:-.35,aRx:-1.6,aRy:-1.0,aRz:-.6,eR:.8,wRz:-.6,aLx:-1.2,aLy:.9,aLz:.6,eL:.9,wLz:.6,lRx:.35,kR:.5,lLx:-.3,kL:.4}],
  [.28,{hipY:.25,drop:.13,lunge:.22,chX:.4,chY:.3,rbX:.4,rbY:.3,nkX:.25,hdX:.3,cRz:-.15,cLz:.15,aRx:-1.3,aRy:.8,aRz:0,eR:.2,wRz:.5,aLx:-1.5,aLy:-.7,aLz:0,eL:.25,wLz:-.5,lRx:.2,kR:.35,lLx:-.7,kL:.55}],
  [.5,{hipY:.15,drop:.1,lunge:.2,chX:.3,rbX:.3,aRx:-1.0,aRy:.4,eR:.4,aLx:-1.1,aLy:-.3,eL:.4}]]}};
// ── HABILIDADES DE ENEMIGO (lote N0-ESQUELETOS-3): cada una calza con lo que describe ──
 // embestida: se agazapa y echa el arma atrás (aviso), luego se lanza con el arma por delante
ATK.lunge={keys:[
  [.17,{drop:.2,lunge:-.1,chX:.4,chY:-.35,rbX:.3,rbY:-.4,hdX:.15,cRz:.2,aRx:-1.0,aRy:-.6,eR:1.3,wRx:-.3,aLx:-.5,aLz:.3,eL:1.0,lRx:.5,kR:.9,lLx:-.4,kL:.5}],
  [.23,{drop:.12,lunge:.3,chX:.45,chY:.2,rbX:.4,rbY:.25,nkX:.1,aRx:-1.55,aRy:0,eR:.1,wRx:-.1,aLx:.6,aLz:.5,eL:.5,lRx:.6,kR:.4,lLx:-1.0,kL:.6}],
  [.5,{drop:.08,lunge:.22,chX:.35,rbX:.3,aRx:-1.4,eR:.2,lLx:-.8,kL:.5}]]};
 // lanzar (cuchillo): brazo atrás por encima del hombro, el otro apuntando; al soltar el brazo late hacia delante y la muñeca restalla
ATK.throw={keys:[
  [.17,{drop:.05,lunge:-.04,hipY:-.35,chY:-.4,rbY:-.5,rbX:-.2,cRz:.2,aRx:-2.4,aRy:-.3,eR:1.6,wRx:-.6,aLx:-1.2,aLz:.5,eL:.3,lRx:.35,kR:.35,lLx:-.3,kL:.15}],
  [.22,{drop:.1,lunge:.1,hipY:.4,chY:.4,rbY:.55,rbX:.35,chX:.3,cRz:-.15,aRx:-.5,aRy:.3,eR:.15,wRx:.8,aLx:.3,aLz:.3,eL:.5,lRx:.1,kR:.2,lLx:-.7,kL:.4}],
  [.5,{drop:.06,lunge:.08,rbY:.3,rbX:.2,aRx:-.3,eR:.3,aLx:.2}]]};
 // meteoro: ambos brazos al cielo (invoca), luego los baja señalando el suelo del objetivo
ATK.meteor={keys:[
  [.17,{lunge:-.05,chX:-.25,rbX:-.5,nkX:-.3,hdX:-.5,cRz:.45,cLz:-.45,aRx:-3.0,aRz:-.5,eR:.2,wRx:-.6,aLx:-3.0,aLz:.5,eL:.2,wLx:-.6,lRx:.2,kR:.2,lLx:-.2,kL:.2}],
  [.24,{drop:.08,lunge:.1,chX:.4,rbX:.6,nkX:.4,hdX:.35,cRz:-.2,cLz:.2,aRx:-.9,aRz:-.1,eR:.1,wRx:.8,aLx:-1.0,aLz:.1,eL:.1,wLx:.8,lRx:.3,kR:.3,lLx:-.5,kL:.4}],
  [.5,{drop:.06,lunge:.08,chX:.3,rbX:.4,aRx:-.7,aLx:-.8}]]};
 // onda expansiva: se encoge con los puños en las caderas acumulando fuerza y estalla abriendo los brazos y echando el pecho
ATK.nova={keys:[
  [.17,{drop:.17,chX:.32,rbX:.28,nkX:.15,hdX:.1,cRz:-.3,cLz:.3,aRx:.3,aRz:.2,eR:1.2,aLx:.3,aLz:-.2,eL:1.2,lRx:-.35,kR:.85,lLx:-.35,kL:.85,anR:.15,anL:.15}],
  [.22,{drop:-.05,lunge:.05,chX:-.3,rbX:-.45,nkX:-.4,hdX:-.5,cRz:.35,cLz:-.35,aRx:-1.2,aRz:-1.5,eR:.1,wRx:-.4,aLx:-1.2,aLz:1.5,eL:.1,wLx:-.4,lRx:-.2,kR:.15,lLx:-.2,kL:.15}],
  [.5,{drop:.02,chX:-.1,rbX:-.2,hdX:-.2,aRx:-.8,aRz:-1.0,aLx:-.8,aLz:1.0}]]};
 // llamada a refuerzos (arma al cielo y grito) y rugido de furia (pecho fuera, puños abiertos, temblor): se miden sobre un segundo, no sobre el golpe
ATK.call={raw:1,keys:[
  [.28,{drop:.02,chX:-.2,rbX:-.45,nkX:-.3,hdX:-.5,cRz:.3,aRx:-2.9,eR:.4,wRx:-.5,aLx:-2.5,aLz:.4,eL:.5,lRx:.15,kR:.2,lLx:-.15,kL:.2}],
  [.6,{drop:.04,chX:-.25,rbX:-.5,nkX:-.35,hdX:-.55,cRz:.3,aRx:-3.0,eR:.35,aLx:-2.6,aLz:.4,eL:.5,lRx:.15,kR:.25,lLx:-.15,kL:.25}],
  [.8,{drop:.1,chX:.3,rbX:.35,nkX:.2,hdX:.3,aRx:-.6,eR:.5,aLx:-.4,eL:.6}]]};
ATK.roar={raw:1,keys:[
  [.3,{drop:.06,chX:-.3,rbX:-.55,nkX:-.4,hdX:-.6,cRz:.4,cLz:-.4,aRx:-.6,aRz:-.8,eR:1.3,wRz:-.3,aLx:-.6,aLz:.8,eL:1.3,wLz:.3,kR:.3,kL:.3,lRx:.15,lLx:-.15}],
  [.7,{drop:.08,chX:-.28,rbX:-.5,nkX:-.35,hdX:-.55,cRz:.35,cLz:-.35,aRx:-.7,aRz:-.9,eR:1.2,aLx:-.7,aLz:.9,eL:1.2,kR:.3,kL:.3,lRx:.15,lLx:-.15}]]};
for(const k in ATK)ATK[k].keys=ATK[k].keys.map(([u,p])=>[u,vec(p)]);
ATK.slam=ATK.overhead;

// ── ARQUETIPOS: marcha (w), reposo (id), postura de combate (g) y ataque ──
// w: str zancada · kn rodilla · bob rebote vertical · stomp pisotón · tw torsión de cintura · sw balanceo lateral · ar balanceo de brazos · lean inclinación · hd cabeceo · spd frecuencia extra
// id: br respiración · sh cambio de peso · sc barrido de cabeza · ar brazos (codo en reposo) · dr caída de hombros
// g: arm brazo en guardia · el codo · kn rodillas · ln inclinación · bn rebote · wd separación
const ARCH={
 brute:{w:{str:.5,kn:.8,bob:.045,stomp:.035,tw:.2,sw:.09,ar:.38,lean:.12,hd:.04},id:{br:1.3,sh:.05,sc:.25,ar:.4,dr:.04},g:{arm:.35,el:.9,kn:.2,ln:.14,bn:.012,wd:.1},atk:'overhead',kt:.75,rc:[.6,1],amp:1.1,hop:0,trem:.012},
 colossus:{w:{str:.42,kn:.7,bob:.06,stomp:.07,tw:.14,sw:.12,ar:.3,lean:.06,hd:.05},id:{br:1.6,sh:.06,sc:.2,ar:.3,dr:.05},g:{arm:.25,el:.7,kn:.12,ln:.08,bn:.008,wd:.14},atk:'overhead',kt:.85,rc:[.68,1],amp:1.3,hop:0,trem:.022},
 slasher:{w:{str:.66,kn:.95,bob:.03,stomp:.01,tw:.2,sw:.05,ar:.5,lean:.07,hd:.03},id:{br:1,sh:.04,sc:.3,ar:.3,dr:.02},g:{arm:.6,el:1.2,kn:.26,ln:.14,bn:.018,wd:.08},atk:'slash',kt:.4,rc:[.4,.75],amp:1,hop:.015,trem:0},
 duelist:{w:{str:.7,kn:1,bob:.028,stomp:0,tw:.16,sw:.04,ar:.42,lean:.05,hd:.03},id:{br:.9,sh:.05,sc:.35,ar:.3,dr:.01},g:{arm:.8,el:1.5,kn:.3,ln:.1,bn:.02,wd:.12},atk:'thrust',kt:.5,rc:[.45,.8],amp:1,hop:.02,trem:0},
 skirmisher:{w:{str:.8,kn:1.15,bob:.04,stomp:0,tw:.26,sw:.07,ar:.6,lean:.28,hd:.06,spd:1.25},id:{br:1.5,sh:.07,sc:.7,ar:.6,dr:.05},g:{arm:.8,el:1.6,kn:.45,ln:.22,bn:.03,wd:.14},atk:'flurry',kt:.55,rc:[.36,.68],amp:1,hop:.035,trem:0},
 archer:{w:{str:.72,kn:1,bob:.032,stomp:0,tw:.14,sw:.04,ar:.45,lean:.2,hd:.04,spd:1.1},id:{br:1.2,sh:.05,sc:.6,ar:.4,dr:.03},g:{arm:.9,el:.6,kn:.22,ln:.1,bn:.012,wd:.1},atk:'shoot',kt:.6,rc:[.42,.8],amp:1,hop:0,trem:0},
 caster:{w:{str:.4,kn:.5,bob:.02,stomp:0,tw:.08,sw:.03,ar:.2,lean:.02,hd:.02},id:{br:.9,sh:.03,sc:.5,ar:.7,dr:.0},g:{arm:.7,el:.9,kn:.1,ln:-.04,bn:.006,wd:.05},atk:'cast',kt:.8,rc:[.55,1],amp:1.1,hop:0,trem:0,chan:1,float:1},
 shambler:{w:{str:.38,kn:.45,bob:.03,stomp:.012,tw:.1,sw:.14,ar:.15,lean:.2,hd:.09},id:{br:.7,sh:.08,sc:.5,ar:.2,dr:.1,reach:1},g:{arm:1.3,el:.25,kn:.1,ln:.2,bn:.01,wd:.05},atk:'claw',kt:.8,rc:[.55,1],amp:1.1,hop:0,trem:.01,stiff:1},
 brawler:{w:{str:.6,kn:.9,bob:.04,stomp:.02,tw:.22,sw:.06,ar:.5,lean:.15,hd:.04},id:{br:1.1,sh:.05,sc:.3,ar:.35,dr:.03},g:{arm:.7,el:1.3,kn:.3,ln:.16,bn:.02,wd:.1},atk:'claw',kt:.6,rc:[.45,.85],amp:1.1,hop:.02,trem:0},
 angel:{w:{str:.36,kn:.5,bob:.015,stomp:0,tw:.06,sw:.02,ar:.16,lean:.0,hd:.02},id:{br:.7,sh:.02,sc:.2,ar:.5,dr:0},g:{arm:.5,el:.6,kn:.08,ln:.0,bn:.004,wd:.06},atk:'slash',kt:.9,rc:[.6,1],amp:1.1,hop:0,trem:0,chan:1,float:1}};
/* kt: cuánto tarda en llegar el golpe tras el aviso (.4 = latigazo ágil, .85 = golpe de peso) · rc: tramo en que vuelve a la guardia (ágiles pronto, pesados se quedan clavados) · amp: exageración · hop: saltito al golpear · trem: temblor del cuerpo durante el aviso · chan: canaliza magia con las manos */
// qué arquetipo usa cada enemigo (los no listados usan `ani:` de su unit() o 'slasher')
export const ARC_OF={goblin:'skirmisher',goblinarq:'archer',goblinsha:'caster',espantapajaros:'shambler',slime:'shambler',orco:'brute',orcocampeon:'brute',ogro:'colossus',gigante:'colossus',golem:'colossus',b0:'colossus',
 banasesino:'skirmisher',shinobi:'skirmisher',k0:'duelist',bandido:'slasher',esqueleto:'slasher',bruja:'caster',b2:'caster',k2:'caster',oni:'brawler',demonio:'brawler',gabriel:'angel',b3:'colossus',b4:'brute',b5:'brawler',k3:'slasher',k4:'duelist',k5:'brawler'};
const arch=A=>{const t=A.tpl;return t._ar||(t._ar=ARCH[t.ani||ARC_OF[t.id]||'slasher']||ARCH.slasher)};

const J=new Float32Array(NJ),B=new Float32Array(NJ),T=new Float32Array(NJ);   // J = pose final · B = base (marcha/guardia) · T = pose de ataque
export function animEnemy(A,s){
 const {t,dt,mv,at,look,hunt,hurt,stun,die}=s,a=mv,ph=A.ph,sn=Math.sin(ph),cs=Math.cos(ph),R=arch(A),w=R.w,id=R.id,g=R.g,seed=A.seed,tpl=A.tpl;
 // suavizado del estado de combate (0 = tranquilo, 1 = en guardia)
 A.hw=(A.hw||0)+(((hunt||at>=0)?1:0)-(A.hw||0))*Math.min(1,(dt||.016)*5);const hw=A.hw,hm=hw*(1-.45*Math.min(1,a));
 B.fill(0);const br=Math.sin(t*1.9+seed)*.5+.5,bs=Math.sin(t*1.9+seed);
 // ── MARCHA ──
 const sp=w.spd||1;
 B[IX.lRx]=-sn*w.str*a;B[IX.lLx]=sn*w.str*a;B[IX.kR]=Math.max(0,cs)*w.kn*a+.04;B[IX.kL]=Math.max(0,-cs)*w.kn*a+.04;
 B[IX.anR]=-.22*Math.max(0,-sn)*a;B[IX.anL]=-.22*Math.max(0,sn)*a;B[IX.tR]=Math.max(0,sn)*.55*a;B[IX.tL]=Math.max(0,-sn)*.55*a;   // dedos: se doblan al despegar el pie
 B[IX.drop]=Math.abs(cs)*w.bob*a+Math.max(0,-Math.abs(cs)+.15)*w.stomp*a*3;
 B[IX.hipY]=sn*w.tw*.55*a;B[IX.hipZ]=cs*w.sw*.45*a;
 B[IX.chY]=-sn*w.tw*.55*a;B[IX.rbY]=-sn*w.tw*.7*a;B[IX.rbZ]=-cs*w.sw*.35*a;B[IX.chZ]=cs*w.sw*.2*a;
 B[IX.chX]=w.lean*.55;B[IX.rbX]=w.lean*.5+br*.02*id.br;B[IX.nkX]=-w.lean*.4;B[IX.hdX]=-w.lean*.3+Math.abs(cs)*w.hd*a;
 // brazos en oposición a las piernas (el brazo derecho va con la pierna izquierda)
 const rc=id.reach?1:0,sw=w.ar*a;
 B[IX.aRx]=sn*sw-rc*(.9+Math.sin(t*1.3+seed)*.06);B[IX.aLx]=-sn*sw-rc*(.9+Math.sin(t*1.1+seed)*.06);
 B[IX.eR]=id.ar*(.5+.5*a)+Math.max(0,-sn)*.3*a+rc*.25;B[IX.eL]=id.ar*(.5+.5*a)+Math.max(0,sn)*.3*a+rc*.25;
 B[IX.aRz]=.04+(1-a)*id.dr;B[IX.aLz]=-(.04+(1-a)*id.dr);B[IX.cRz]=-id.dr*(1-a)*2+bs*.02;B[IX.cLz]=id.dr*(1-a)*2-bs*.02;
 // ── REPOSO: respiración, cambio de peso, barrido de cabeza ──
 const idl=1-Math.min(1,a*2.2),shf=Math.sin(t*.55+seed),sc=Math.sin(t*.4+seed)+Math.sin(t*.93+seed*1.7)*.4;
 B[IX.rbX]+=bs*.025*id.br*idl;B[IX.cRz]+=bs*.03*id.br*idl;B[IX.cLz]-=bs*.03*id.br*idl;
 B[IX.hipZ]+=shf*id.sh*idl;B[IX.rbZ]-=shf*id.sh*.8*idl;B[IX.drop]+=Math.max(0,shf)*.012*idl;B[IX.kR]+=Math.max(0,shf)*.08*idl;B[IX.kL]+=Math.max(0,-shf)*.08*idl;
 B[IX.hdY]=(look?0:sc*id.sc*.55*idl)+cl(look||0,-.9,.9)*.7;B[IX.nkY]=cl(look||0,-.9,.9)*.3+(look?0:sc*id.sc*.3*idl);
 B[IX.wRx]=Math.sin(t*1.7+seed)*.05*idl;B[IX.wLx]=Math.sin(t*1.5+seed)*.05*idl;
 // flotar (magos, ángeles): sin pisadas, suben y bajan suave
 if(R.float){B[IX.drop]=-Math.sin(t*1.6+seed)*.03-.01;B[IX.lRx]*=.4;B[IX.lLx]*=.4;B[IX.hdX]+=.05}
 // rígido (muertos, espantapájaros): sacudidas secas
 if(R.stiff){const q=Math.sin(ph*2)*.5;B[IX.hdY]+=q*.12*a;B[IX.rbZ]+=q*.1*a;B[IX.hdX]+=Math.abs(sn)*.1*a}
 // ── POSTURA DE COMBATE: guardia con rebote ──
 if(hm>.01){const bn=Math.sin(t*7+seed)*g.bn,k=hm;
  B[IX.aRx]=lerp(B[IX.aRx],-g.arm,k);B[IX.aLx]=lerp(B[IX.aLx],-g.arm*.85,k);B[IX.eR]=lerp(B[IX.eR],g.el,k);B[IX.eL]=lerp(B[IX.eL],g.el*.9,k);
  B[IX.aRz]+=.15*k;B[IX.aLz]-=.15*k;B[IX.cRz]+=.12*k;B[IX.cLz]-=.12*k;
  B[IX.chX]+=g.ln*k*.5;B[IX.rbX]+=g.ln*k*.5;B[IX.nkX]-=g.ln*k*.4;
  B[IX.kR]+=g.kn*k;B[IX.kL]+=g.kn*.8*k;B[IX.lRx]+=(-.2-g.wd)*k*(1-Math.min(1,a*1.4));B[IX.lLx]+=(.12+g.wd*.5)*k*(1-Math.min(1,a*1.4));
  B[IX.drop]+=(g.kn*.1+Math.abs(bn)*2)*k;B[IX.hipY]-=.12*k*(1-Math.min(1,a));B[IX.chY]+=.1*k*(1-Math.min(1,a));B[IX.hdY]=lerp(B[IX.hdY],cl(look||0,-.9,.9),k*.8)}
 if(R.chan&&hm>.05){const q=hm*(1-Math.min(1,a));B[IX.aRx]+=Math.sin(t*2.1+seed)*.35*q;B[IX.aLx]+=Math.sin(t*2.1+seed+2.2)*.35*q;B[IX.aRz]+=(Math.cos(t*2.1+seed)*.25+.15)*q;B[IX.aLz]-=(Math.cos(t*2.1+seed+2.2)*.25+.15)*q;B[IX.wRx]+=Math.sin(t*5)*.2*q;B[IX.wLx]+=Math.sin(t*5+1)*.2*q}   /* el lanzador gesticula con las manos mientras persigue */
 if(s.charge>0){const c=s.charge;B[IX.chX]+=.45*c;B[IX.rbX]+=.35*c;B[IX.nkX]-=.3*c;B[IX.drop]+=.07*c;B[IX.aRx]=lerp(B[IX.aRx],-1.45,c);B[IX.eR]=lerp(B[IX.eR],.25,c);B[IX.aLx]=lerp(B[IX.aLx],.7,c);B[IX.eL]=lerp(B[IX.eL],.6,c);B[IX.rbY]+=.2*c;B[IX.lRx]*=1.3;B[IX.lLx]*=1.3;B[IX.kR]+=.3*c;B[IX.kL]+=.3*c}   /* embestida: cuerpo adelantado, arma por delante y zancada larga */
 J.set(B);
 // ── ATAQUE: fotogramas clave (la mezcla con la base sube rápido y baja al final) ──
 let wa=0;
 if(at>=0){const ak=ATK[R.atk]||ATK.slash,ks=(ATK[s.ak]||ak).keys,u=at;
  const AK=ATK[s.ak]||ak,raw=!!AK.raw,kt=raw?1:(R.kt||1),rc=raw?[.75,1]:(R.rc||[.5,1]),tk=q=>raw||q<=.17?q:.17+(q-.17)*kt;   // tiempos de las claves escalados por el ritmo del arquetipo
  wa=ss(0,.15,u)*(1-ss(rc[0],rc[1],u));
  // pose objetivo: antes de la primera clave se va de la base a ella; entre claves, smoothstep
  let i=0;while(i<ks.length-1&&u>tk(ks[i+1][0]))i++;
  const k0=ks[i],k1=ks[Math.min(ks.length-1,i+1)],t0=tk(k0[0]),t1=tk(k1[0]),f=u<=tk(ks[0][0])?0:i>=ks.length-1?1:ss(t0,t1,u);
  const pa=u<=tk(ks[0][0])?ks[0][1]:k0[1],pb=u<=tk(ks[0][0])?ks[0][1]:k1[1],am=raw?1:(R.amp||1);
  for(let j=0;j<NJ;j++){const m=pa.m[j]|pb.m[j];if(!m)continue;const va=pa.m[j]?pa.v[j]:B[j],vb=pb.m[j]?pb.v[j]:B[j],tg=B[j]+(lerp(va,vb,f)-B[j])*am;J[j]=lerp(B[j],tg,wa)}
  // saltito al golpear (ágiles) · temblor de esfuerzo en la anticipación (pesados) · canalizado de magia con las manos
  if(R.hop)J[IX.drop]-=R.hop*Math.sin(Math.PI*cl((u-.17)/.3,0,1))*wa;
  if(u<.19&&u>.1){const wd=ss(.1,.17,u);if(R.atk==='shoot'||R.atk==='cast'||s.ak==='shoot'||s.ak==='cast'||s.ak==='throw'){const q=Math.sin(t*3.1+seed)*.03*wd;J[IX.aRx]+=q;J[IX.aLx]-=q*.7;J[IX.hdY]+=Math.sin(t*2.3+seed)*.03*wd;J[IX.rbX]+=Math.sin(t*4.7)*.012*wd;J[IX.wRz]+=Math.sin(t*6)*.05*wd}   /* apuntando: pulso vivo mientras mantiene la pose */
   if(R.trem){const q=Math.sin(t*42+seed)*R.trem*wd;J[IX.rbX]+=q;J[IX.drop]+=Math.abs(q)*1.5;J[IX.aRx]+=q*3}
   if(R.chan){J[IX.wRx]+=Math.sin(t*15)*.22*wd;J[IX.wLx]+=Math.sin(t*15+1.4)*.22*wd;J[IX.aRz]+=Math.sin(t*9)*.07*wd;J[IX.aLz]-=Math.sin(t*9)*.07*wd;J[IX.hdX]+=Math.sin(t*11)*.04*wd}}}
 // ── REACCIONES: golpe recibido (se dobla y se echa atrás), aturdimiento (cabeza gacha y tambaleo), muerte (rodillas ceden) ──
 if(hurt>0.01){const h=hurt*(1-wa*.55);J[IX.chX]-=.35*h;J[IX.rbX]-=.55*h;J[IX.nkX]-=.45*h;J[IX.hdX]-=.35*h;J[IX.cRz]+=.3*h;J[IX.cLz]-=.3*h;J[IX.aRx]-=.5*h;J[IX.aLx]-=.4*h;J[IX.aRz]-=.5*h;J[IX.aLz]+=.5*h;J[IX.eR]+=.4*h;J[IX.eL]+=.4*h;J[IX.kR]+=.25*h;J[IX.kL]+=.25*h;J[IX.drop]+=.05*h;J[IX.hipY]+=.18*h*Math.sin(seed);J[IX.rbY]-=.2*h}
 if(stun>0){const q=Math.sin(t*3.3+seed);J[IX.nkX]+=.45*stun;J[IX.hdX]+=.35*stun;J[IX.rbZ]+=q*.18*stun;J[IX.hdY]+=Math.sin(t*2.1)*.25*stun;J[IX.aRx]*=1-.6*stun;J[IX.aLx]*=1-.6*stun;J[IX.eR]+=.3*stun;J[IX.kR]+=.12*stun;J[IX.kL]+=.12*stun;J[IX.rbX]+=.2*stun}
 if(die>0){const d=die;J[IX.kR]=lerp(J[IX.kR],1.5,d);J[IX.kL]=lerp(J[IX.kL],1.2,d);J[IX.lRx]=lerp(J[IX.lRx],-.7,d);J[IX.lLx]=lerp(J[IX.lLx],-.3,d);J[IX.drop]+=.25*d;J[IX.nkX]+=.3*d;J[IX.hdX]+=.3*d;J[IX.aRx]=lerp(J[IX.aRx],.4,d);J[IX.aLx]=lerp(J[IX.aLx],.3,d);J[IX.aRz]-=.5*d;J[IX.aLz]+=.5*d;J[IX.eR]=lerp(J[IX.eR],.3,d);J[IX.eL]=lerp(J[IX.eL],.3,d)}
 // ── APLICAR A LOS HUESOS ──
 const b=A.b,rp=A.restP,j=IX;
 b.pelvis.position.y=rp.pelvis.y-J[j.drop];b.root.position.z=rp.root.z+J[j.lunge];
 A.rot('pelvis',0,J[j.hipY],J[j.hipZ]);A.rot('chest',J[j.chX],J[j.chY],J[j.chZ]);A.rot('ribs',J[j.rbX],J[j.rbY],J[j.rbZ]);A.rot('neck',J[j.nkX],J[j.nkY],0);A.rot('head',J[j.hdX]-(tpl.lean||0)*.7,J[j.hdY],0);
 A.rot('clavR',0,J[j.cRy],J[j.cRz]);A.rot('clavL',0,J[j.cLy],J[j.cLz]);
 A.rot('armR',J[j.aRx],J[j.aRy],J[j.aRz]);A.rot('elbR',-J[j.eR],0,0);A.rot('wrR',J[j.wRx],0,J[j.wRz]);
 A.rot('armL',J[j.aLx],J[j.aLy],J[j.aLz]);A.rot('elbL',-J[j.eL],0,0);A.rot('wrL',J[j.wLx],0,J[j.wLz]);
 A.rot('legR',J[j.lRx],0,0);A.rot('kneeR',J[j.kR],0,0);A.rot('ankR',J[j.anR],0,0);A.rot('toeR',J[j.tR],0,0);
 A.rot('legL',J[j.lLx],0,0);A.rot('kneeL',J[j.kL],0,0);A.rot('ankL',J[j.anL],0,0);A.rot('toeL',J[j.tL],0,0)}
