// @ts-check
// orders 路由（已遷移：async handler + JSend 回應格式）
const express = require("express");
const service = require("./orders.service");

const router = express.Router();

/**
 * 把 async handler 的例外轉給 Express 錯誤處理（Express 4 不會自己接 rejected promise）
 * @param {(req: import('express').Request, res: import('express').Response) => Promise<void>} fn
 * @returns {import('express').RequestHandler}
 */
const asyncHandler = (fn) => (req, res, next) => {
  fn(req, res).catch(next);
};

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const orders = await service.listOrders();
    res.json({ status: "success", data: orders });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res
        .status(400)
        .json({ status: "fail", data: { id: "must be an integer" } });
      return;
    }
    const order = await service.getOrder(id);
    if (!order) {
      res.status(404).json({ status: "fail", data: { id: "order not found" } });
      return;
    }
    res.json({ status: "success", data: order });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    try {
      const order = await service.createOrder(req.body);
      res.status(201).json({ status: "success", data: order });
    } catch (err) {
      if (err instanceof service.ValidationError) {
        res.status(400).json({ status: "fail", data: { body: err.message } });
        return;
      }
      throw err;
    }
  }),
);

/** @type {import('express').ErrorRequestHandler} */
const errorHandler = (_err, _req, res, _next) => {
  res.status(500).json({ status: "error", message: "Internal error" });
};
router.use(errorHandler);

module.exports = router;
