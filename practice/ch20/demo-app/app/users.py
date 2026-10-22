"""使用者資料存取：示範「規範良好」的寫法，作為審查前的基準版本。"""
import logging
import os
import sqlite3

logger = logging.getLogger(__name__)


def get_connection(db_path: str) -> sqlite3.Connection:
    """開啟 SQLite 連線；路徑由呼叫端提供，不寫死。"""
    return sqlite3.connect(db_path)


def init_schema(conn: sqlite3.Connection) -> None:
    conn.execute(
        "CREATE TABLE IF NOT EXISTS users ("
        "id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL)"
    )
    conn.commit()


def find_user_by_email(conn: sqlite3.Connection, email: str):
    """以參數化查詢避免 SQL 注入。"""
    if not email:
        raise ValueError("email 不可為空")
    row = conn.execute(
        "SELECT id, name, email FROM users WHERE email = ?", (email,)
    ).fetchone()
    return row


def get_admin_password() -> str:
    """管理密碼一律從環境變數讀取。"""
    password = os.environ.get("ADMIN_PASSWORD")
    if not password:
        raise RuntimeError("缺少環境變數 ADMIN_PASSWORD")
    return password
