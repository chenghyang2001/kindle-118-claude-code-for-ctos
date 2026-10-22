/** auth 中介層單元測試 */
import { NextFunction, Request, Response } from "express";
import { HttpError } from "../src/errors";
import { authenticate, authorize, hasPermission } from "../src/middleware/auth";
import { bearer, newService, TOKENS } from "./fixtures";

function run(
  mw: (req: Request, res: Response, next: NextFunction) => void,
  req: Partial<Request>,
) {
  let captured: unknown = "not-called";
  mw(req as Request, {} as Response, (err?: unknown) => {
    captured = err;
  });
  return captured;
}

describe("hasPermission", () => {
  it("依權限表判斷", () => {
    expect(hasPermission("viewer", "users:read")).toBe(true);
    expect(hasPermission("viewer", "users:create")).toBe(false);
    expect(hasPermission("editor", "users:update")).toBe(true);
    expect(hasPermission("editor", "users:delete")).toBe(false);
    expect(hasPermission("editor", "users:change-role")).toBe(false);
    expect(hasPermission("admin", "users:change-role")).toBe(true);
  });
});

describe("authenticate", () => {
  const mw = authenticate(newService());

  it.each([undefined, "", "Basic abc", "Bearer", "Bearer a b"])(
    "格式錯誤 %p → 401",
    (header) => {
      const err = run(mw, { headers: { authorization: header } });
      expect(err).toBeInstanceOf(HttpError);
      expect((err as HttpError).status).toBe(401);
    },
  );

  it("未知 token → 401", () => {
    const err = run(mw, { headers: { authorization: bearer("nope") } });
    expect((err as HttpError).status).toBe(401);
  });

  it("有效 token → 掛上 req.user", () => {
    const req: Partial<Request> = {
      headers: { authorization: bearer(TOKENS.editor) },
    };
    expect(run(mw, req)).toBeUndefined();
    expect(req.user?.role).toBe("editor");
  });
});

describe("authorize", () => {
  it("沒有 req.user → 401", () => {
    expect((run(authorize("users:read"), {}) as HttpError).status).toBe(401);
  });

  it("角色不足 → 403", () => {
    const req = {
      user: { id: 3, name: "V", email: "v@x.io", role: "viewer" as const },
    };
    expect((run(authorize("users:delete"), req) as HttpError).status).toBe(403);
  });

  it("角色足夠 → 放行", () => {
    const req = {
      user: { id: 1, name: "A", email: "a@x.io", role: "admin" as const },
    };
    expect(run(authorize("users:delete"), req)).toBeUndefined();
  });
});
