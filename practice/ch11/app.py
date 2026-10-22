"""最小 Python 服務：GET /health 回傳 ok（演練用的被管理專案）"""
from http.server import BaseHTTPRequestHandler, HTTPServer


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            body, code = b'{"status":"ok"}', 200
        else:
            body, code = b'{"error":"not found"}', 404
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    try:
        HTTPServer(("127.0.0.1", 8000), Handler).serve_forever()
    except OSError as e:
        print(f"錯誤：無法啟動服務：{e}")
