// @ts-check
// orders 模組的 JSDoc 型別（已遷移模組的範本）

/**
 * @typedef {Object} OrderItem
 * @property {string} sku
 * @property {number} qty
 * @property {number} price
 */

/**
 * @typedef {Object} Order
 * @property {number} id
 * @property {number} userId
 * @property {OrderItem[]} items
 * @property {number} total
 */

/**
 * @typedef {Object} CreateOrderBody
 * @property {number} [userId]
 * @property {OrderItem[]} [items]
 */

module.exports = {};
