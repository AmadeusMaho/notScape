# NotScape · SERVIDOR DEL EDITOR DE DIÁLOGOS (22 oct 2026)
# Sirve el juego (sin caché, como tools/serve_nocache.py) y guarda los cambios del editor en `data/dialogos.json`.
# Uso (desde la raíz del repo):   python tools/dialogos/server.py [puerto]      (por defecto 8820)
#   · Editor:  http://localhost:8820/tools/dialogos/editor.html
#   · Juego:   http://localhost:8820/index.html   (lee data/dialogos.json al arrancar: recarga la página para ver los cambios)
# API (solo local, 127.0.0.1):  GET /api/dialogos → el JSON guardado · POST /api/dialogos → lo valida y lo guarda (con copia de seguridad en data/dialogos.backup/, últimas 30).
import sys, os, json, time, http.server, shutil
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
os.chdir(ROOT)
FILE = os.path.join(ROOT, 'data', 'dialogos.json')
BACK = os.path.join(ROOT, 'data', 'dialogos.backup')
MAXB = 2_000_000

def clean(j):
    """Valida y normaliza: {npcs:{id:{conv:[[str]]}}, quests:{id:{campo:str}}}. Descarta lo vacío."""
    if not isinstance(j, dict):
        raise ValueError('el JSON debe ser un objeto')
    out = {'npcs': {}, 'quests': {}}
    for k, v in (j.get('npcs') or {}).items():
        conv = []
        for c in (v.get('conv') or []):
            pages = [str(p) for p in c if str(p).strip()]
            if pages:
                conv.append(pages)
        if conv:
            out['npcs'][str(k)] = {'conv': conv}
    for k, v in (j.get('quests') or {}).items():
        d = {f: str(x) for f, x in v.items() if f in ('name', 'hi', 'desc', 'rem', 'turn', 'done') and str(x).strip()}
        if d:
            out['quests'][str(k)] = d
    return out

class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        super().end_headers()

    def log_message(self, fmt, *a):
        if '/api/' in (a[0] if a else ''):
            sys.stderr.write('[dialogos] ' + (fmt % a) + '\n')

    def _json(self, code, obj):
        b = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def do_GET(self):
        if self.path.split('?')[0] == '/api/dialogos':
            try:
                with open(FILE, encoding='utf-8') as f:
                    return self._json(200, json.load(f))
            except Exception:
                return self._json(200, {'npcs': {}, 'quests': {}})
        return super().do_GET()

    def do_POST(self):
        if self.path.split('?')[0] != '/api/dialogos':
            return self._json(404, {'error': 'ruta desconocida'})
        try:
            n = int(self.headers.get('Content-Length') or 0)
            if n <= 0 or n > MAXB:
                return self._json(400, {'error': 'tamaño inválido'})
            data = clean(json.loads(self.rfile.read(n).decode('utf-8')))
            os.makedirs(os.path.dirname(FILE), exist_ok=True)
            if os.path.exists(FILE):
                os.makedirs(BACK, exist_ok=True)
                shutil.copyfile(FILE, os.path.join(BACK, time.strftime('%Y%m%d-%H%M%S') + '.json'))
                old = sorted(os.listdir(BACK))
                for f in old[:-30]:
                    os.remove(os.path.join(BACK, f))
            tmp = FILE + '.tmp'
            with open(tmp, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.write('\n')
            os.replace(tmp, FILE)
            return self._json(200, {'ok': True, 'npcs': len(data['npcs']), 'quests': len(data['quests']), 'at': time.strftime('%H:%M:%S')})
        except Exception as e:
            return self._json(400, {'error': str(e)})

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8820
    print('Editor de diálogos:  http://localhost:%d/tools/dialogos/editor.html' % port)
    print('Juego:               http://localhost:%d/index.html' % port)
    print('Guarda en:           ' + FILE)
    http.server.ThreadingHTTPServer(('127.0.0.1', port), H).serve_forever()
