#!/usr/bin/env python3
"""Progresión v2 · medición: horas (idealizadas, sin comida/mejoras) para llegar a 30/50/60/70/80/90/99 en cada oficio, nivel de Combate necesario para vencer a cada capitán y jefe
(pérdida de vida ≤ 80 % sin comer, con el equipo fabricable a ese nivel) y horas de combate hasta 15/30/46/62/78/94/98. Usa las funciones reales del juego (dur, hitChance, maxHit, monAcc, xpMul, HPF/DMF/MSF).
Uso: python3 -I tools/meas_progresion.py   ·  Objetivos: oficios 99 en ~50-70 h; needBoss ≈ 14/30/46/62/78/95; needCap ≈ 12/25/42/58/74/92; combate 99 en ~55 h. Ver AGENTS.md «Progresión v2»."""
import sys, os, subprocess, time, json
from playwright.sync_api import sync_playwright
srv=subprocess.Popen([sys.executable,'-m','http.server','8803','--bind','127.0.0.1'],cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
JS=r"""()=>{const out={};const save=JSON.stringify(S);
 // D7: tiempos y pasos del modelo vivo (work.js: stepsEst/pieceSec/QUICK_XP); síntesis rápida = 0,9 s y XP×QUICK_XP
 const marks=[30,50,60,70,80,90,99];out.skills={};
 const sks=['wc','mi','fi','ds','co','sm','pe','sa','cr','es','ins'];
 for(const sk of sks){let t=0;const res={};let l=1;
  const SH=typeof WKUI!=='undefined'&&WKUI.REG[sk];   // D7 (26 oct 2026): los oficios con hoja de trabajo se miden con el modelo NUEVO (pasos del planificador + síntesis rápida + XP extra), no con dur()
  while(l<99){S.xp[sk]=XT[l];S.tool[sk]=TOOLS[sk]?TLV(l):0;S.tq[sk]=0;let best=0;for(const a of ACT[sk]){if(l<rq(a))continue;let d,x=xv(a);
    if(SH&&a.length===6){const rl=rq(a);if(l-rl>=15&&WK.quick(WK.mkRecipe(rl,a[0]),l).ok){d=0.9;x=a[4]*WK.QUICK_XP}   // síntesis rápida: 1 pulsación + reabrir
     else{d=WK.pieceSec(rl);x=a[4]*Math.max(1,Math.min(4.5,d/(a[5]/1000)))}}   // finish() de workui.js: XP extra para sostener la XP/s
    else d=dur(sk,a)/1000;const r=x/d;if(r>best)best=r}
   if(!best)best=.5;t+=(XT[l+1]-XT[l])/best;l++;if(marks.includes(l))res[l]=+(t/3600).toFixed(1)}
  out.skills[sk]=res}
 const IL=TI.map(t=>t[4]),AL=[1,12,19,30,40,48,56,66,76,85,91,98];
 const gear=l=>{let wi=-1;IL.forEach((v,i)=>{if(l>=v)wi=i});let ai=-1;AL.forEach((v,i)=>{if(l>=v)ai=i});return['sw_'+(wi>=0?TI[wi][0]:'cobre'),ai>=0?'ar_'+TI[ai][0]:'ar_cuero']};
 const fight=(l,id,mlv)=>{S.xp.cb=XT[l];const g=gear(l);S.eq.w=g[0];S.eq.a=g[1];S.eq.h=S.eq.f=S.eq.r=S.eq.r2=S.eq.n=null;S.vig=0;S.fzr=0;S.dfs=0;S.buf={};
  const d=MD[id],f=MSF[id],hp=Math.max(3,Math.round(HPF(mlv)*f[0])),dm=f[1]?Math.max(1,Math.round(DMF(mlv)*f[1])):0,m={d,lv:mlv,hp,mh:hp,dm};
  const mhit=maxHit(),hc=hitChance(m),ms=atkMs(),avg=(1+mhit)/2,dps=Math.max(.001,hc*avg*(1000/ms));
  const kt=hp/dps,ma=monAcc(m),mdps=ma*(dm/2)*(1000/(d.as||2400)),loss=kt*mdps/maxHp();
  return{dps,kt,loss,hc,mhit,xps:dps*xpMul(m),mdps,hp,dm,maxhp:maxHp()}};
 const ids=Object.keys(LVR);
 out.boss=[];
 for(let k=0;k<6;k++){const id='b'+k,mlv=LVR[id][0];let need=null;for(let l=1;l<=99;l++){const f=fight(l,id,mlv);if(f.loss<=.8){need=l;break}}
  const cid='k'+k,cl=LVR[cid][0];let nc=null;for(let l=1;l<=99;l++){const f=fight(l,cid,cl);if(f.loss<=.8){nc=l;break}}
  out.boss.push({k,bossLv:mlv,needBoss:need,capLv:cl,needCap:nc})}
 // horas de combate: mejor mob por XP/s con pérdida<.6 por pelea, nivel mob ≤ l+8; 12 s reaparición, 4 bichos
 const hrsTo=L2=>{let t=0;const best={};for(let l=1;l<L2;l++){let b=0,bid=null;for(const id of ids){const r=LVR[id];if(MD[id].boss)continue;const ml=Math.round((r[0]+r[1])/2);if(ml>l+8)continue;const f=fight(l,id,ml);if(f.loss>.6)continue;const cyc=Math.max(f.kt+3,(12+f.kt)/4)/.7,xp=f.xps*f.kt,rate=xp/cyc;if(rate>b){b=rate;bid=id}}
   if(!b){b=.5;bid='-'}t+=(XT[l+1]-XT[l])/b;if([15,30,46,62,78,94,98].includes(l+1))best[l+1]=[+(t/3600).toFixed(1),bid,+b.toFixed(1)]}return best};
 out.combat=hrsTo(99);
 S=JSON.parse(save);return out}"""
try:
  with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader']);pg=b.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('http://127.0.0.1:8803/index.html?noedit');pg.wait_for_timeout(1500)
    r=pg.evaluate(JS)
    print('SKILLS (h)');[print(' ',k,v) for k,v in r['skills'].items()]
    print('BOSS');[print(' ',x) for x in r['boss']]
    print('COMBAT (lvl: horas acum, mejor mob, XP/s)');[print(' ',k,v) for k,v in r['combat'].items()]
    print(errs);b.close()
finally: srv.kill()
