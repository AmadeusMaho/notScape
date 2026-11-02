# NotScape · N0-ESQUELETOS · une varios PNG en una tira (recorte central): python tools/r3d/montage.py salida.png x0 y0 x1 y1 a.png b.png ...
import sys
from PIL import Image
out=sys.argv[1];box=tuple(int(v) for v in sys.argv[2:6]);ims=[Image.open(p).convert('RGB').crop(box) for p in sys.argv[6:]]
w,h=ims[0].size;m=Image.new('RGB',(w*len(ims),h))
for i,im in enumerate(ims):m.paste(im,(i*w,0))
m.save(out)
