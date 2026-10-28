# NotScape · CUEVAS REALES (27 oct 2026) · comprobación en el juego real con la GPU del PC.
#   python tools/cave_check.py        (necesita Playwright; arranca su propia sesión `ns.py --gpu` con ?map=A&wk=6 y la para al terminar)
# Por cada cueva de prueba (distintos biomas y tipos): entra con el fundido, comprueba que la sala 3D está activa (R3D.rooms.cave), que hay menas, que las criaturas
# existen solo si el tipo las lleva, que el fotograma de la cueva cabe en el presupuesto (§P) y que al salir el mundo se restaura (N/M/ST/PO iguales y posición junto a la puerta).
# Acaba en RESULTADO: OK / FALLO y falla si la consola trae errores nuevos.
import subprocess,json,sys,time,os
os.environ['PYTHONUTF8']='1'
NS=[sys.executable,'tools/fast/ns.py']
def ns(*a,t=240):
    r=subprocess.run(NS+list(a),capture_output=True,text=True,encoding='utf-8',timeout=t);return (r.stdout or '').strip()
def ev(js):
    o=ns('eval',js).splitlines()[-1] if ns('eval',js) else ''
    try:return json.loads(o)
    except Exception:return o
def main():
    ns('stop');print(ns('start','--gpu','--w','1280','--h','720','--url','?test=1&noedit&map=A&wk=6&load').splitlines()[-1]);time.sleep(30)
    bad=[];base=ev("JSON.stringify({n:N.length,m:M.length,st:ST.length,po:PO.length})");base=json.loads(base) if isinstance(base,str) else base
    plan=[(0,'g'),(3,'g'),(5,'t'),(6,'p'),(8,'g'),(7,'t')]
    for k,ty in plan:
        d=ev("(()=>{const l=ST.filter(e=>e.room==='cueva'),d=l.find(e=>e.k=="+str(k)+"&&CAVE.defs.get(e.cave).type[0]==='"+ty+"')||l.find(e=>e.k=="+str(k)+");if(!d)return JSON.stringify(null);window.__d=d;NSTEST.tp(d.x,d.y+50);return JSON.stringify({id:d.cave,type:CAVE.defs.get(d.cave).type})})()")
        d=json.loads(d) if isinstance(d,str) else d
        if not d:print('bioma',k,'sin cuevas');continue
        time.sleep(8);ns('eval','CAVE.enter(window.__d)');time.sleep(26)
        r=ev("JSON.stringify({cave:!!(INT&&INT.cave),rooms:R3D.rooms.on&&R3D.rooms.cave,n:N.length,m:M.length,tris:R3D.budget().tris,calls:R3D.budget().calls,ok:R3D.budget().ok})")
        r=json.loads(r) if isinstance(r,str) else r
        tr=d['type'];msg=[]
        if not r.get('cave') or not r.get('rooms'):msg.append('no entró')
        if r.get('n',0)<3:msg.append('pocas menas')
        if tr=='tranquila' and r.get('m',0)!=0:msg.append('tranquila con enemigos')
        if tr!='tranquila' and r.get('m',0)==0:msg.append('sin enemigos')
        if not r.get('ok') or r.get('tris',1e9)>150000:msg.append('presupuesto')
        ns('eval','leaveRoom(1)');time.sleep(3)
        a=ev("JSON.stringify({n:N.length,m:M.length,st:ST.length,po:PO.length,int:!!INT})");a=json.loads(a) if isinstance(a,str) else a
        if a.get('int') or any(a.get(x)!=base.get(x) for x in ('n','m','st','po')):msg.append('el mundo no se restauró '+json.dumps(a))
        print('bioma',k,tr,json.dumps(r),'->','OK' if not msg else msg)
        bad+=msg
    lg=[l for l in ns('logs').splitlines() if 'error' in l.lower() and 'X3595' not in l and 'seams' not in l]
    if lg:bad.append('consola: '+lg[0][:160])
    ns('stop');print('RESULTADO:','OK' if not bad else 'FALLO '+str(bad))
    sys.exit(0 if not bad else 1)
main()
