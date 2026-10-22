/** supertest 整合測試：逐條對應 PRD 驗收條件 AC1–AC11 */
import request from "supertest";
import { Express } from "express";
import { createApp } from "../src/app";
import { bearer, newService, TOKENS } from "./fixtures";

let app: Express;
beforeEach(() => {
  app = createApp(newService());
});

describe("認證", () => {
  it("AC1 未帶 Authorization → 401", async () => {
    await request(app).get("/users").expect(401);
  });

  it("AC2 無效 token → 401", async () => {
    await request(app)
      .get("/users")
      .set("Authorization", bearer("bad"))
      .expect(401);
  });
});

describe("viewer", () => {
  it("AC3 可列出使用者", async () => {
    const res = await request(app)
      .get("/users")
      .set("Authorization", bearer(TOKENS.viewer))
      .expect(200);
    expect(res.body).toHaveLength(3);
  });

  it("AC4 不能建立使用者", async () => {
    await request(app)
      .post("/users")
      .set("Authorization", bearer(TOKENS.viewer))
      .send({ name: "X", email: "x@y.io" })
      .expect(403);
  });

  it("不能修改或刪除", async () => {
    await request(app)
      .patch("/users/2")
      .set("Authorization", bearer(TOKENS.viewer))
      .send({ name: "Z" })
      .expect(403);
    await request(app)
      .delete("/users/2")
      .set("Authorization", bearer(TOKENS.viewer))
      .expect(403);
  });
});

describe("editor", () => {
  it("AC5 可建立使用者，角色預設 viewer", async () => {
    const res = await request(app)
      .post("/users")
      .set("Authorization", bearer(TOKENS.editor))
      .send({ name: "Bob", email: "bob@example.com" })
      .expect(201);
    expect(res.body.role).toBe("viewer");
  });

  it("AC6 不能改 role（PATCH 或 POST 指定 role）", async () => {
    await request(app)
      .patch("/users/3")
      .set("Authorization", bearer(TOKENS.editor))
      .send({ role: "admin" })
      .expect(403);
    await request(app)
      .post("/users")
      .set("Authorization", bearer(TOKENS.editor))
      .send({ name: "Mal", email: "mal@example.com", role: "admin" })
      .expect(403);
  });

  it("可更新名稱", async () => {
    const res = await request(app)
      .patch("/users/3")
      .set("Authorization", bearer(TOKENS.editor))
      .send({ name: "Vera2" })
      .expect(200);
    expect(res.body.name).toBe("Vera2");
  });

  it("AC7 不能刪除", async () => {
    await request(app)
      .delete("/users/3")
      .set("Authorization", bearer(TOKENS.editor))
      .expect(403);
  });
});

describe("admin", () => {
  it("AC7 可刪除他人 → 204，之後查不到", async () => {
    await request(app)
      .delete("/users/3")
      .set("Authorization", bearer(TOKENS.admin))
      .expect(204);
    await request(app)
      .get("/users/3")
      .set("Authorization", bearer(TOKENS.admin))
      .expect(404);
  });

  it("AC8 可改合法 role；非法 role → 400", async () => {
    const res = await request(app)
      .patch("/users/3")
      .set("Authorization", bearer(TOKENS.admin))
      .send({ role: "editor" })
      .expect(200);
    expect(res.body.role).toBe("editor");
    await request(app)
      .patch("/users/3")
      .set("Authorization", bearer(TOKENS.admin))
      .send({ role: "Admin" })
      .expect(400);
  });

  it("預審 high：唯一的 admin 不能把自己降級", async () => {
    await request(app)
      .patch("/users/1")
      .set("Authorization", bearer(TOKENS.admin))
      .send({ role: "viewer" })
      .expect(400);
    const res = await request(app)
      .get("/users/1")
      .set("Authorization", bearer(TOKENS.admin))
      .expect(200);
    expect(res.body.role).toBe("admin");
  });

  it("預審 high：有兩位 admin 時可降級其中一位，但不能再降最後一位", async () => {
    const auth = bearer(TOKENS.admin);
    await request(app)
      .patch("/users/2")
      .set("Authorization", auth)
      .send({ role: "admin" })
      .expect(200);
    await request(app)
      .patch("/users/2")
      .set("Authorization", auth)
      .send({ role: "viewer" })
      .expect(200);
    await request(app)
      .patch("/users/1")
      .set("Authorization", auth)
      .send({ role: "editor" })
      .expect(400);
  });

  it("AC11 不能刪除自己", async () => {
    await request(app)
      .delete("/users/1")
      .set("Authorization", bearer(TOKENS.admin))
      .expect(400);
  });
});

describe("邊界", () => {
  it("AC9 不存在或非數字 id → 404", async () => {
    await request(app)
      .get("/users/99")
      .set("Authorization", bearer(TOKENS.viewer))
      .expect(404);
    await request(app)
      .get("/users/abc")
      .set("Authorization", bearer(TOKENS.viewer))
      .expect(404);
  });

  it("AC10 缺 name／email 格式錯 → 400；email 重複 → 409", async () => {
    const auth = bearer(TOKENS.admin);
    await request(app)
      .post("/users")
      .set("Authorization", auth)
      .send({ email: "a@b.io" })
      .expect(400);
    await request(app)
      .post("/users")
      .set("Authorization", auth)
      .send({ name: "A", email: "bad" })
      .expect(400);
    await request(app)
      .post("/users")
      .set("Authorization", auth)
      .send({ name: "A", email: "alice@example.com" })
      .expect(409);
  });

  it("壞掉的 JSON → 400，不洩漏堆疊", async () => {
    const res = await request(app)
      .post("/users")
      .set("Authorization", bearer(TOKENS.admin))
      .set("Content-Type", "application/json")
      .send("{bad json")
      .expect(400);
    expect(res.body).toEqual({ error: "invalid JSON body" });
  });

  it("預審 medium：未登入又送壞 JSON → 401（先認證）", async () => {
    await request(app)
      .post("/users")
      .set("Content-Type", "application/json")
      .send("{bad json")
      .expect(401);
  });

  it("預審 medium：body 超過 10kb → 413，不是 500", async () => {
    const res = await request(app)
      .post("/users")
      .set("Authorization", bearer(TOKENS.admin))
      .send({ name: "x".repeat(11 * 1024), email: "big@example.com" })
      .expect(413);
    expect(res.body).toEqual({ error: "payload too large" });
  });

  it("預審 medium：刪除後舊 token 失效 → 401；回應不帶 X-Powered-By", async () => {
    await request(app)
      .delete("/users/3")
      .set("Authorization", bearer(TOKENS.admin))
      .expect(204);
    const res = await request(app)
      .get("/users")
      .set("Authorization", bearer(TOKENS.viewer))
      .expect(401);
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});
