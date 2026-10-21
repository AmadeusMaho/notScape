# NotScape · R3D · Fase 44a · capturas de las FRONTERAS entre biomas (envoltorio de world_shot.py, que ya espera a que se construyan los chunks lejanos).
# Uso (raíz del repo, con `python3 -m http.server 8811 &`):  python3 -I tools/r3d/border_shot.py <prefijo> [dia|atardecer|noche] [union|barreras|todo] [K_oleo=70]
#   union    → Pradera|Bosque (x=9216): 12 tiles al oeste, la línea, 12 tiles al este, el camino y la franja de bosquetes. Debe verse SIN pared, SIN valla y SIN corte de color.
#   barreras → Pradera|Volcán (mar + cordillera) y Bosque|Oriental (cordillera) desde el lado de arriba y desde el de abajo. Debe verse relieve natural, sin pared recta de tile.
# Las coordenadas son del mundo K=2 (`?wk=2`, el valor por defecto). Devuelve el mismo «RESULTADO: OK/FALLO» que world_shot.py. Cada captura cuesta ~10 s en SwiftShader; cuatro por sesión es lo razonable
# (en una sesión con muchas tomas se vio UNA vez un fotograma roto —polígonos rojos y negros— no reproducible: repetir esa toma sola).
import subprocess,sys,os
pre=sys.argv[1] if len(sys.argv)>1 else 'borde';hora=sys.argv[2] if len(sys.argv)>2 else 'dia';que=sys.argv[3] if len(sys.argv)>3 else 'union';K=sys.argv[4] if len(sys.argv)>4 else '70'
P={'union':'8830,3000,3;9216,3000,3;9600,3000,3;9216,1800,1','barreras':'13800,5560,0;13800,6420,0;4600,5400,0;12000,5500,1'}
sel=P['union'] if que=='union' else P['barreras'] if que=='barreras' else P['union']+';'+P['barreras']
env=dict(os.environ,NOHUD=os.environ.get('NOHUD','1'))
sys.exit(subprocess.call([sys.executable,'-I',os.path.join(os.path.dirname(os.path.abspath(__file__)),'world_shot.py'),pre,hora,sel,K],env=env))
