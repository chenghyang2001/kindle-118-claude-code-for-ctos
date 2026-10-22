-- 建立 users 資料表（IF NOT EXISTS 讓 migration 可重跑）
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at TEXT
);
