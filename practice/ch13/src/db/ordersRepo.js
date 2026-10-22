// @ts-check
// orders 的 repository（已改成 Promise 介面）

/** @typedef {import('../api/orders/orders.types').Order} Order */

/** @type {Order[]} */
const seedOrders = [
  { id: 1, userId: 1, items: [{ sku: 'BOOK-01', qty: 2, price: 300 }], total: 600 },
];

/** @type {Order[]} */
let orders = [];
let nextId = 1;

function reset() {
  orders = seedOrders.map((o) => ({ ...o, items: o.items.map((i) => ({ ...i })) }));
  nextId = orders.length + 1;
}

/** @returns {Promise<Order[]>} */
async function findAll() {
  return orders.map((o) => ({ ...o }));
}

/**
 * @param {number} id
 * @returns {Promise<Order | null>}
 */
async function findById(id) {
  return orders.find((o) => o.id === id) ?? null;
}

/**
 * @param {Omit<Order, 'id'>} data
 * @returns {Promise<Order>}
 */
async function insert(data) {
  const order = { id: nextId++, ...data };
  orders.push(order);
  return order;
}

reset();

module.exports = { findAll, findById, insert, reset };
