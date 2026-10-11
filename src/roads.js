/* NotScape — CAMINOS (Fase 2, paso 1). Ver AGENTS.md.
   Sustituye la función `road()` de la IIFE de `bgc` en game.js. En vez de rectángulos planos con líneas de borde, une TODOS los
   rectángulos del bioma en una máscara, le da bordes irregulares (±1 px), y pinta por píxel: contorno oscuro, borde con luz arriba-izquierda,
   interior moteado con guijarros y roderas, y un halo suave de tierra sobre el pasto. Las uniones y cruces quedan limpios (sin líneas cruzadas).
   La geometría sigue siendo la misma (±1 px), así que las colisiones y las zonas no cambian. Con ?old, RD es null y se usa `road()`. */
const RD=GR?(()=>{
 const{hash,vnoise,mix,hex}=GR.H,C=(a,b,t)=>hex(mix(a,b,t));
 const vn=(t,s)=>{const a=Math.floor(t),f=t-a,m=f*f*(3-2*f);return hash(a,0,s)*(1-m)+hash(a+1,0,s)*m};
 const off=(v,s)=>Math.round((vn(v/10,s)-.5)*2.4); // -1, 0 o +1 según ruido de baja frecuencia
 return{
  /* g = contexto 2D de bgc (coordenadas de mundo, sin OX/OY). rects = [[x,y,w,h],...]. rc/ed = color base y de borde del bioma. gr = BI[k].g */
  draw(g,k,rects,rc,ed,gr){
   const M=5;let X0=1e9,Y0=1e9,X1=-1e9,Y1=-1e9;
   rects.forEach(([x,y,w,h])=>{X0=Math.min(X0,x-M);Y0=Math.min(Y0,y-M);X1=Math.max(X1,x+w+M);Y1=Math.max(Y1,y+h+M)});
   const bw=X1-X0,bh=Y1-Y0,m=new Uint8Array(bw*bh),I=(x,y)=>(y-Y0)*bw+(x-X0);
   rects.forEach(([x,y,w,h],n)=>{const s=k*13+n*3;
    if(w>h)for(let i=x;i<x+w;i++){const a=y+off(i,s+1),b=y+h-1+off(i,s+2);for(let j=a;j<=b;j++)m[I(i,j)]=1}
    else for(let j=y;j<y+h;j++){const a=x+off(j,s+1),b=x+w-1+off(j,s+2);for(let i=a;i<=b;i++)m[I(i,j)]=1}});
   const base=hex(rc),E=hex(ed),O=C(ed,'#14100a',.55),LT=C(rc,'#ffffff',.22),DK=C(rc,ed,.45),LG=C(rc,'#ffffff',.16),MID=C(rc,ed,.5),SOFT=C(rc,ed,.22),PB=C(ed,'#ffffff',.25),G2=hex(gr[2]);
   const img=g.createImageData(bw,bh),D=img.data,put=(i,c,a)=>{const p=i*4;D[p]=c[0];D[p+1]=c[1];D[p+2]=c[2];D[p+3]=a},r0=rects[0];
   const pass=(xa,ya,xb,yb)=>{for(let y=ya;y<yb;y++)for(let x=xa;x<xb;x++){const i=I(x,y);
    if(!m[i]){if(m[i-1]||m[i+1]||m[i-bw]||m[i+bw])put(i,O,hash(x,y,k+77)<.7?70:40);else if(hash(x,y,k+55)<.05&&(m[i-2]||m[i+2]||m[i-2*bw]||m[i+2*bw]))put(i,G2,230);continue}
    if(!m[i-1]||!m[i+1]||!m[i-bw]||!m[i+bw]||!m[i-bw-1]||!m[i-bw+1]||!m[i+bw-1]||!m[i+bw+1]){put(i,O,255);continue} // contorno
    const t2=!m[i-2*bw],l2=!m[i-2],b2=!m[i+2*bw],r2=!m[i+2];
    if(t2||l2||b2||r2){put(i,(t2||l2)&&!(b2||r2)?LT:(b2||r2)&&!(t2||l2)?E:MID,255);continue} // borde: claro arriba-izq, oscuro abajo-der
    const h=hash(x,y,k+9),ry=y-r0[1];let c=vnoise(x,y,k+3,6)>.62?SOFT:base;
    if(h<.09)c=DK;else if(h<.15)c=LG;else if(h<.17)c=PB;
    if(r0[3]>=30&&ry>=0&&ry<r0[3]&&(ry==10||ry==22)&&hash(x,y,k+21)<.6)c=DK; // roderas de la calle principal
    put(i,c,255)}};
   rects.forEach(([x,y,w,h])=>pass(Math.max(X0+2,x-3),Math.max(Y0+2,y-3),Math.min(X1-2,x+w+3),Math.min(Y1-2,y+h+3)));
   const cv=document.createElement('canvas');cv.width=bw;cv.height=bh;cv.getContext('2d').putImageData(img,0,0);g.drawImage(cv,X0,Y0)}}
})():null;
