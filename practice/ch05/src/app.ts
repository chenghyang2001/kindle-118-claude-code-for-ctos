/** Express 應用：路由＋集中錯誤處理 */
import express, { NextFunction, Request, Response } from "express";
import { HttpError } from "./errors";
import { authenticate, authorize, hasPermission } from "./middleware/auth";
import { UserService } from "./services/user";

function parseId(raw: string): number {
  const id = Number(raw);
  // 非正整數一律當作找不到，不洩漏解析細節
  if (!Number.isInteger(id) || id <= 0)
    throw new HttpError(404, "user not found");
  return id;
}

export function createApp(service: UserService) {
  const app = express();
  app.disable("x-powered-by");
  // 先認證再解析 body：未登入者一律 401，也不必替他們解析 body
  app.use(authenticate(service));
  app.use(express.json({ limit: "10kb" }));

  app.get("/users", authorize("users:read"), (_req, res) => {
    res.json(service.list());
  });

  app.get("/users/:id", authorize("users:read"), (req, res) => {
    res.json(service.get(parseId(req.params.id)));
  });

  app.post("/users", authorize("users:create"), (req, res) => {
    const body = req.body ?? {};
    // 只有能改角色的人才能在建立時指定角色，否則一律 viewer
    if (
      body.role !== undefined &&
      !hasPermission(req.user!.role, "users:change-role")
    ) {
      throw new HttpError(403, "forbidden: cannot assign role");
    }
    res.status(201).json(service.create(body));
  });

  app.patch("/users/:id", authorize("users:update"), (req, res) => {
    const body = req.body ?? {};
    if (
      body.role !== undefined &&
      !hasPermission(req.user!.role, "users:change-role")
    ) {
      throw new HttpError(403, "forbidden: cannot change role");
    }
    res.json(service.update(parseId(req.params.id), body));
  });

  app.delete("/users/:id", authorize("users:delete"), (req, res) => {
    const id = parseId(req.params.id);
    if (id === req.user!.id) throw new HttpError(400, "cannot delete yourself");
    service.remove(id);
    res.status(204).end();
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    // body-parser 的用戶端錯誤（壞 JSON、過大 body）帶 type 欄位，照原狀態碼回應
    const parserErrorType = (err as { type?: string } | null)?.type;
    if (parserErrorType === "entity.parse.failed") {
      res.status(400).json({ error: "invalid JSON body" });
      return;
    }
    if (parserErrorType === "entity.too.large") {
      res.status(413).json({ error: "payload too large" });
      return;
    }
    console.error("未預期錯誤：", err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
