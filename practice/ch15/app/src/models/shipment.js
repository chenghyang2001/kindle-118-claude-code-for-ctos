'use strict';
// Shipment 資料模型：欄位定義與驗證
/**
 * @typedef {Object} Shipment
 * @property {string} id
 * @property {string} orderId
 * @property {string} carrier
 * @property {string} [tracking]
 */

const FIELDS = ["orderId","carrier","tracking"];

/** @returns {string[]} 錯誤訊息，空陣列代表合法 */
function validateShipment(input) {
  const errors = [];
  if (input === null || typeof input !== 'object') return ['輸入必須是物件'];
  if (input.orderId === undefined) errors.push('orderId 為必填');
  if (input.orderId !== undefined && typeof input.orderId !== 'string') errors.push('orderId 必須是 string');
  if (input.carrier === undefined) errors.push('carrier 為必填');
  if (input.carrier !== undefined && typeof input.carrier !== 'string') errors.push('carrier 必須是 string');
  if (input.tracking !== undefined && typeof input.tracking !== 'string') errors.push('tracking 必須是 string');
  return errors;
}

/** @returns {Shipment} */
function buildShipment(id, input) {
  return {
    id,
    orderId: input.orderId,
    carrier: input.carrier,
    tracking: input.tracking,
  };
}

module.exports = { FIELDS, validateShipment, buildShipment };
