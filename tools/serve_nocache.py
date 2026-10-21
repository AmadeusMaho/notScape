# NotScape · servidor local SIN CACHÉ (los módulos ES de three.js se quedan en la caché del navegador y Ctrl+Shift+R no los revalida).
# Uso (desde la raíz del repo):  python3 tools/serve_nocache.py 8000   →  http://localhost:8000/
import sys,http.server,functools
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control','no-store, no-cache, must-revalidate, max-age=0');self.send_header('Pragma','no-cache');self.send_header('Expires','0');super().end_headers()
port=int(sys.argv[1]) if len(sys.argv)>1 else 8000
print(f'Sirviendo sin caché en http://localhost:{port}/');http.server.ThreadingHTTPServer(('',port),H).serve_forever()
