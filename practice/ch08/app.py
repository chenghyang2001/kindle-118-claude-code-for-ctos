"""K118 第 8 章：Flask 留言板原型（已修掉稽核的 5 個 critical 項）。

已修：S1 SQL injection、S2 debug 對外、S3 刪除無授權、S4 寫死密鑰、T1 無測試。
其餘 high/medium 項見 AUDIT.md 與 PROMOTION_CHECKLIST.md。
"""
import hmac
import os
import sqlite3
import sys

from flask import Flask, jsonify, request

REQUIRED_ENV = ("SECRET_KEY", "ADMIN_TOKEN")


class ConfigError(RuntimeError):
    """必要的環境變數缺少時拋出，讓程式在啟動時就失敗，而不是上線後才爆。"""


def load_config(env=os.environ):
    missing = [k for k in REQUIRED_ENV if not env.get(k)]
    if missing:
        raise ConfigError(f"缺少環境變數：{', '.join(missing)}")
    return {
        "SECRET_KEY": env["SECRET_KEY"],
        "ADMIN_TOKEN": env["ADMIN_TOKEN"],
        "DATABASE_PATH": env.get("DATABASE_PATH") or "app.db",
    }


def init_db(path):
    # 仍是 CREATE TABLE IF NOT EXISTS（M2 未修：沒有 migration）
    with sqlite3.connect(path) as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, email TEXT);
            CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY, user_id INTEGER, title TEXT, body TEXT);
            """
        )


def is_admin(req, admin_token):
    header = req.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return False
    # 用固定時間比對，避免從回應時間猜出 token
    return hmac.compare_digest(header[len("Bearer "):], admin_token)


def create_app(env=os.environ):
    cfg = load_config(env)
    app = Flask(__name__)
    app.config.update(cfg)
    init_db(cfg["DATABASE_PATH"])

    def db():
        return sqlite3.connect(app.config["DATABASE_PATH"])

    @app.route("/users", methods=["POST"])
    def create_user():
        d = request.json
        with db() as conn:
            conn.execute("INSERT INTO users (name, email) VALUES (?, ?)", (d["name"], d["email"]))
        return jsonify({"ok": True})

    @app.route("/posts", methods=["POST"])
    def create_post():
        d = request.json
        with db() as conn:
            conn.execute(
                "INSERT INTO posts (user_id, title, body) VALUES (?, ?, ?)",
                (d["user_id"], d["title"], d["body"]),
            )
        return jsonify({"ok": True})

    @app.route("/posts")
    def list_posts():
        conn = db()
        posts = conn.execute("SELECT id, user_id, title, body FROM posts").fetchall()
        out = []
        for p in posts:
            # P1 未修：N+1 查詢（非 critical，保留給後續晉升階段）
            u = conn.execute("SELECT name FROM users WHERE id = ?", (p[1],)).fetchone()
            out.append({"id": p[0], "title": p[2], "body": p[3], "author": u[0]})
        return jsonify(out)

    @app.route("/search")
    def search():
        q = request.args.get("q", "")
        conn = db()
        rows = conn.execute(
            "SELECT id, title FROM posts WHERE title LIKE ?", (f"%{q}%",)
        ).fetchall()
        return jsonify(rows)

    @app.route("/posts/<int:pid>", methods=["DELETE"])
    def delete_post(pid):
        if not is_admin(request, app.config["ADMIN_TOKEN"]):
            return jsonify({"error": "unauthorized"}), 401
        with db() as conn:
            conn.execute("DELETE FROM posts WHERE id = ?", (pid,))
        return jsonify({"deleted": pid})

    return app


def main():
    try:
        app = create_app()
    except ConfigError as e:
        print(f"錯誤：{e}（請參考 .env.example）", file=sys.stderr)
        sys.exit(1)
    # 正式啟動走 waitress（WSGI server），不再用 Flask 內建 debug server
    from waitress import serve

    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "5000"))
    print(f"server start on {host}:{port}")
    serve(app, host=host, port=port)


if __name__ == "__main__":
    main()
