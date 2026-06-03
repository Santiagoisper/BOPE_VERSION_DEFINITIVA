"""Servidor local de desarrollo — war room + API."""
from http.server import HTTPServer, BaseHTTPRequestHandler
from api.index import handler as WarRoomHandler
from api.run   import handler as RunHandler

PORT = 8000


class Router(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith("/api/run"):
            RunHandler(self.request, self.client_address, self.server)
        else:
            WarRoomHandler(self.request, self.client_address, self.server)

    def log_message(self, format, *args):
        print(f"  {self.path}  →  {args[1]}")


if __name__ == "__main__":
    httpd = HTTPServer(("0.0.0.0", PORT), Router)
    print(f"\n  🪖  BOPE SALA DE GUERRA → http://localhost:{PORT}")
    print(f"  ⚡  API JOHN            → http://localhost:{PORT}/api/run\n")
    httpd.serve_forever()
