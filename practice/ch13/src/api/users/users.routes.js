// @ts-check
// users 路由（已遷移：async handler；回應格式維持舊式裸 JSON／{error}，不是 JSend）
const express = require("express");
const service = require("./users.service");
const config = require("../../config");

/** @typedef {import('./users.types').ListUsersRequest} ListUsersRequest */
/** @typedef {import('./users.types').ListUsersResponse} ListUsersResponse */
/** @typedef {import('./users.types').GetUserRequest} GetUserRequest */
/** @typedef {import('./users.types').GetUserResponse} GetUserResponse */
/** @typedef {import('./users.types').CreateUserRequest} CreateUserRequest */
/** @typedef {import('./users.types').CreateUserResponse} CreateUserResponse */

const router = express.Router();

/**
 * 把 async handler 的例外轉給 Express 錯誤處理（Express 4 不會自己接 rejected promise）
 * @template P, ResBody, ReqBody
 * @param {(req: import('express').Request<P, ResBody, ReqBody>, res: import('express').Response<ResBody>) => Promise<void>} fn
 * @returns {import('express').RequestHandler<P, ResBody, ReqBody>}
 */
const asyncHandler = (fn) => (req, res, next) => {
  fn(req, res).catch(next);
};

router.get(
  "/",
  asyncHandler(
    async (/** @type {ListUsersRequest} */ _req, /** @type {ListUsersResponse} */ res) => {
      const users = await service.listUsers();
      res.json(users);
    },
  ),
);

router.get(
  "/:id",
  asyncHandler(
    async (/** @type {GetUserRequest} */ req, /** @type {GetUserResponse} */ res) => {
      // FIXME(2024-02-08): 非數字 id 會變成 NaN，回 404 而不是 400
      const id = parseInt(req.params.id, 10);
      const user = await service.getUser(id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json(user);
    },
  ),
);

router.post(
  "/",
  asyncHandler(
    async (/** @type {CreateUserRequest} */ req, /** @type {CreateUserResponse} */ res) => {
      try {
        const user = await service.createUser(req.body);
        res.status(201).json(user);
      } catch (err) {
        if (err instanceof service.ValidationError) {
          res.status(400).json({ error: err.message });
          return;
        }
        throw err;
      }
    },
  ),
);

// 死碼：enableLegacyCsvExport 在所有環境都是 false（見 AUDIT_REPORT P12，另開票移除）
if (config.enableLegacyCsvExport) {
  router.get(
    "/export.csv",
    asyncHandler(async (_req, res) => {
      const users = await service.listUsers();
      res.type("text/csv").send(service.legacyExportCsv(users));
    }),
  );
}

/** @type {import('express').ErrorRequestHandler} */
const errorHandler = (_err, _req, res, _next) => {
  res.status(500).json({ error: "Internal error" });
};
router.use(errorHandler);

module.exports = router;
