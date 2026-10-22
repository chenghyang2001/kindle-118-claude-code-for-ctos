// @ts-check
// orders 商業邏輯（已遷移：async/await + JSDoc 型別）
const repo = require("../../db/ordersRepo");

/** @typedef {import('./orders.types').Order} Order */
/** @typedef {import('./orders.types').CreateOrderBody} CreateOrderBody */

class ValidationError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

/** @returns {Promise<Order[]>} */
async function listOrders() {
  return repo.findAll();
}

/**
 * @param {number} id
 * @returns {Promise<Order | null>}
 */
async function getOrder(id) {
  return repo.findById(id);
}

/**
 * @param {CreateOrderBody | undefined} body
 * @returns {Promise<Order>}
 */
async function createOrder(body) {
  if (
    !body ||
    typeof body.userId !== "number" ||
    !Array.isArray(body.items) ||
    body.items.length === 0
  ) {
    throw new ValidationError("userId and items are required");
  }
  const total = body.items.reduce((sum, i) => sum + i.qty * i.price, 0);
  return repo.insert({ userId: body.userId, items: body.items, total });
}

module.exports = { listOrders, getOrder, createOrder, ValidationError };
