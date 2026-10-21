# Herramienta de la Fase 18: para cada nombre dado, dice si se define en src/game.js y quien mas lo usa (fuera de su propio cuerpo).
# Uso (raiz del repo): python tools/f18_refs.py nombre1 nombre2 ...
#       python tools/f18_refs.py --cut nombre1 nombre2 ...   -> ELIMINA esas definiciones de src/game.js (function X(...){...} o const X=...;)
import re,sys,glob,io
sys.stdout=io.TextIOWrapper(sys.stdout.buffer,encoding='utf-8')
BS=chr(92)
files=glob.glob('src/*.js')+glob.glob('src/r3d/*.js')+glob.glob('src/r3d/*.mjs')
txt={f.replace(chr(92),'/'):open(f,encoding='utf-8').read() for f in files}

def body_span(s,start):
    """Desde `start` (inicio de 'function name(' o 'const name=') hasta el final de la definicion."""
    isf=s.startswith('function',start)
    i=start;depth=0;seen=False;q=None;n=len(s);brace=False
    while i<n:
        c=s[i]
        if q:
            if c==BS:
                i+=2;continue
            if c==q:q=None
        elif c in '"'+"'"+'`':
            q=c
        elif c=='/' and s[i:i+2]=='//':
            j=s.find('\n',i);i=j if j>0 else n;continue
        elif c in '{([':
            depth+=1;seen=True
            if c=='{':brace=True
        elif c in '})]':
            depth-=1
            if seen and depth==0 and (brace or not isf):
                j=i+1
                if isf:
                    return start,j
                k=j
                while k<n and s[k] not in ';\n':k+=1
                return start,k+1
        elif depth==0 and c=='\n' and not seen and not isf:
            return start,i
        elif depth==0 and c==';' and not isf:
            return start,i+1
        i+=1
    return start,n

def find_def(s,name):
    pat=re.compile(r'(^|\n)([ \t]*)(function\s+'+re.escape(name)+r'\s*\(|(?:const|let|var)\s+'+re.escape(name)+r'\s*=)')
    m=pat.search(s)
    if not m:return None
    st=m.start(3)
    return body_span(s,st)

args=sys.argv[1:]
cut=False
if args and args[0]=='--cut':
    cut=True;args=args[1:]
f='src/game.js'
for name in args:
    s=txt[f];defn=find_def(s,name)
    ext=[]
    for fn,t in txt.items():
        for mm in re.finditer(r'(?<![A-Za-z0-9_$.])'+re.escape(name)+r'(?![A-Za-z0-9_$])',t):
            if fn==f and defn and defn[0]<=mm.start()<defn[1]:continue
            line=t.count('\n',0,mm.start())+1
            ext.append((fn.replace(BS,'/'),line))
    print(name+': def='+(('si ('+str(defn[1]-defn[0])+' car)') if defn else 'NO')+' externos='+str(len(ext)),[a+':'+str(b) for a,b in ext[:8]])
    if cut and defn:
        s=s[:defn[0]]+s[defn[1]:]
        txt[f]=s
if cut:
    open(f,'w',encoding='utf-8').write(txt[f])
    print('game.js reescrito')
