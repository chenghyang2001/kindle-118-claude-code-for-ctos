"""最少的 pytest：涵蓋 5 個 critical 修正的回歸測試 + 主要流程。"""
import pathlib

import pytest

import app as app_module

ROOT = pathlib.Path(__file__).resolve().parent.parent
TOKEN = "test-admin-token"


@pytest.fixture
def client(tmp_path):
    env = {
        "SECRET_KEY": "test-secret",
        "ADMIN_TOKEN": TOKEN,
        "DATABASE_PATH": str(tmp_path / "test.db"),
    }
    c = app_module.create_app(env).test_client()
    c.post("/users", json={"name": "amy", "email": "a@x"})
    c.post("/posts", json={"user_id": 1, "title": "hello", "body": "b"})
    c.post("/posts", json={"user_id": 1, "title": "secret", "body": "b"})
    return c


def auth(token=TOKEN):
    return {"Authorization": f"Bearer {token}"}


# --- 正常流程 ---
def test_list_posts(client):
    data = client.get("/posts").get_json()
    assert [p["title"] for p in data] == ["hello", "secret"]
    assert data[0]["author"] == "amy"


def test_search(client):
    assert client.get("/search?q=hel").get_json() == [[1, "hello"]]


# --- S1：SQL injection 回歸 ---
def test_search_injection_returns_nothing(client):
    assert client.get("/search?q=' OR 1=1 --").get_json() == []


def test_insert_with_quote_is_stored_literally(client):
    client.post("/users", json={"name": "O'Brien", "email": "o@x"})
    client.post("/posts", json={"user_id": 2, "title": "it's; DROP TABLE posts;--", "body": "b"})
    titles = [p["title"] for p in client.get("/posts").get_json()]
    assert "it's; DROP TABLE posts;--" in titles


def test_delete_injection_path_rejected(client):
    r = client.delete("/posts/1 OR 1=1", headers=auth())
    assert r.status_code == 404
    assert len(client.get("/posts").get_json()) == 2


# --- S3：刪除需要授權 ---
def test_delete_without_token_401(client):
    assert client.delete("/posts/1").status_code == 401
    assert len(client.get("/posts").get_json()) == 2


def test_delete_with_wrong_token_401(client):
    assert client.delete("/posts/1", headers=auth("wrong")).status_code == 401


def test_delete_with_token_ok(client):
    r = client.delete("/posts/1", headers=auth())
    assert r.status_code == 200
    assert [p["id"] for p in client.get("/posts").get_json()] == [2]


# --- S4：密鑰不可寫死，缺少就拒絕啟動 ---
@pytest.mark.parametrize("missing", ["SECRET_KEY", "ADMIN_TOKEN"])
def test_missing_env_refuses_start(tmp_path, missing):
    env = {"SECRET_KEY": "s", "ADMIN_TOKEN": "t", "DATABASE_PATH": str(tmp_path / "x.db")}
    env.pop(missing)
    with pytest.raises(app_module.ConfigError):
        app_module.create_app(env)


def test_no_hardcoded_secrets_in_source():
    src = (ROOT / "app.py").read_text(encoding="utf-8")
    for leaked in ("super-secret-key-123", "admin-token-abc", "sk_live_"):
        assert leaked not in src


# --- S2：不可用 debug 模式啟動 ---
def test_debug_disabled_and_no_dev_server():
    src = (ROOT / "app.py").read_text(encoding="utf-8")
    assert "debug=True" not in src
    assert "app.run(" not in src
