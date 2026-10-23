# NotScape · servidor local SIN CACHÉ (los módulos ES de three.js se quedan en la caché del navegador y Ctrl+Shift+R no los revalida).
# Uso (desde la raíz del repo):  python3 tools/serve_nocache.py 8000   →  http://localhost:8000/
# OPT-RENDIMIENTO (22 oct 2026): escucha en IPv6 E IPv4 a la vez y mantiene la conexión abierta (HTTP/1.1). Antes, en Windows, el navegador
# probaba primero `::1` (localhost en IPv6), fallaba y reintentaba en IPv4: ~300 ms POR ARCHIVO × 126 archivos ≈ 6 s de carga perdidos.
import sys,socket,http.server
class H(http.server.SimpleHTTPRequestHandler):
    protocol_version='HTTP/1.1'
    def end_headers(self):
        self.send_header('Cache-Control','no-store, no-cache, must-revalidate, max-age=0');self.send_header('Pragma','no-cache');self.send_header('Expires','0');super().end_headers()
    def log_message(self,*a):pass   # sin una línea por petición (con 126 archivos ralentiza la consola)
H.extensions_map.update({'.js':'text/javascript','.mjs':'text/javascript'})
class S(http.server.ThreadingHTTPServer):
    daemon_threads=True
    def server_bind(self):
        if self.address_family==socket.AF_INET6:
            try:self.socket.setsockopt(socket.IPPROTO_IPV6,socket.IPV6_V6ONLY,0)
            except Exception:pass
        super().server_bind()
port=int(sys.argv[1]) if len(sys.argv)>1 else 8000
try:
    S.address_family=socket.AF_INET6;srv=S(('::',port),H)
except Exception:
    S.address_family=socket.AF_INET;srv=S(('',port),H)
print(f'Sirviendo sin caché en http://localhost:{port}/');srv.serve_forever()
