// orders 基本測試（已遷移模組，確認 JSend 格式）
const request = require("supertest");
const app = require("../src/app");
const repo = require("../src/db/ordersRepo");

beforeEach(() => repo.reset());

test("GET /api/orders/1 → JSend success", async () => {
  const res = await request(app).get("/api/orders/1");
  expect(res.status).toBe(200);
  expect(res.body.status).toBe("success");
  expect(res.body.data.total).toBe(600);
});

test("GET /api/orders/abc → 400 JSend fail", async () => {
  const res = await request(app).get("/api/orders/abc");
  expect(res.status).toBe(400);
  expect(res.body.status).toBe("fail");
});

test("POST /api/orders 缺 items → 400 JSend fail", async () => {
  const res = await request(app).post("/api/orders").send({ userId: 1 });
  expect(res.status).toBe(400);
  expect(res.body).toEqual({
    status: "fail",
    data: { body: "userId and items are required" },
  });
});
