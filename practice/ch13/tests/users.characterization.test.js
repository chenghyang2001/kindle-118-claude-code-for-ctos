// users 表徵測試（Characterization Tests）
// 目的：鎖住「現在的行為」，包含既有 bug，當作遷移 async/await 的安全網。
// 只打 HTTP 層，不測 service，因為遷移會改掉 service 的 callback 介面。
const request = require("supertest");
const app = require("../src/app");
const fakeDb = require("../src/db/fakeDb");

const ALICE = {
  id: 1,
  name: "Alice",
  email: "alice@example.com",
  password: "hash-a1",
};
const BOB = {
  id: 2,
  name: "Bob",
  email: "bob@example.com",
  password: "hash-b2",
};

beforeEach(() => fakeDb.reset());

describe("GET /api/users", () => {
  test("回傳全部使用者（裸陣列，非 JSend）", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([ALICE, BOB]);
  });

  test("既有 bug：回應帶 password 欄位", async () => {
    const res = await request(app).get("/api/users");
    expect(res.body[0]).toHaveProperty("password", "hash-a1");
  });

  test("DB 錯誤 → 500 {error}", async () => {
    fakeDb.__failNextQuery();
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal error" });
  });
});

describe("GET /api/users/:id", () => {
  test("存在的 id → 200 使用者物件", async () => {
    const res = await request(app).get("/api/users/1");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(ALICE);
  });

  test("不存在的 id → 404 {error}", async () => {
    const res = await request(app).get("/api/users/99");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "User not found" });
  });

  test("既有 bug：非數字 id 回 404 而不是 400", async () => {
    const res = await request(app).get("/api/users/abc");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "User not found" });
  });

  test('既有 bug：parseInt 容忍尾巴垃圾，"1abc" 當成 1', async () => {
    const res = await request(app).get("/api/users/1abc");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(ALICE);
  });

  test("DB 錯誤 → 500 {error}", async () => {
    fakeDb.__failNextQuery();
    const res = await request(app).get("/api/users/1");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal error" });
  });
});

describe("POST /api/users", () => {
  test("合法資料 → 201，回傳含新 id 的使用者", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ name: "Carol", email: "carol@example.com", password: "p" });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: 3,
      name: "Carol",
      email: "carol@example.com",
      password: "p",
    });
  });

  test("沒給 password → 回應不含 password 欄位", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ name: "Dan", email: "dan@example.com" });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 3, name: "Dan", email: "dan@example.com" });
  });

  test("只存 name/email/password，多餘欄位被丟掉", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ name: "Eve", email: "eve@example.com", role: "admin" });
    expect(res.body).toEqual({ id: 3, name: "Eve", email: "eve@example.com" });
  });

  test("新建的使用者出現在列表中", async () => {
    await request(app)
      .post("/api/users")
      .send({ name: "Carol", email: "carol@example.com" });
    const res = await request(app).get("/api/users");
    expect(res.body).toHaveLength(3);
    expect(res.body[2]).toEqual({
      id: 3,
      name: "Carol",
      email: "carol@example.com",
    });
  });

  test("缺 email → 400 {error}", async () => {
    const res = await request(app).post("/api/users").send({ name: "NoMail" });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "name and email are required" });
  });

  test("缺 name → 400 {error}", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ email: "x@example.com" });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "name and email are required" });
  });

  test("沒有 body（非 JSON content-type）→ 400", async () => {
    const res = await request(app)
      .post("/api/users")
      .type("text/plain")
      .send("hello");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "name and email are required" });
  });

  test("既有 bug：重複 email 照樣建立", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ name: "Alice2", email: "alice@example.com" });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(3);
  });

  test("DB 錯誤 → 500 {error}，且不會建立資料", async () => {
    fakeDb.__failNextQuery();
    const res = await request(app)
      .post("/api/users")
      .send({ name: "Carol", email: "carol@example.com" });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal error" });
    const list = await request(app).get("/api/users");
    expect(list.body).toHaveLength(2);
  });

  test("驗證失敗不會消耗 DB 失敗旗標（驗證在 DB 之前）", async () => {
    fakeDb.__failNextQuery();
    await request(app).post("/api/users").send({ name: "NoMail" });
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(500);
  });
});

describe("死碼", () => {
  test("/export.csv 沒有註冊（flag 為 false）→ 落到 /:id，回 404", async () => {
    const res = await request(app).get("/api/users/export.csv");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "User not found" });
  });
});
