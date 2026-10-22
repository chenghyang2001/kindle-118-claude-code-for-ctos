'use strict';
// Coupon 資料模型：欄位定義與驗證
/**
 * @typedef {Object} Coupon
 * @property {string} id
 * @property {string} code
 * @property {number} discount
 * @property {boolean} [active]
 */

const FIELDS = ["code","discount","active"];

/** @returns {string[]} 錯誤訊息，空陣列代表合法 */
function validateCoupon(input) {
  const errors = [];
  if (input === null || typeof input !== 'object') return ['輸入必須是物件'];
  if (input.code === undefined) errors.push('code 為必填');
  if (input.code !== undefined && typeof input.code !== 'string') errors.push('code 必須是 string');
  if (input.discount === undefined) errors.push('discount 為必填');
  if (input.discount !== undefined && typeof input.discount !== 'number') errors.push('discount 必須是 number');
  if (input.active !== undefined && typeof input.active !== 'boolean') errors.push('active 必須是 boolean');
  return errors;
}

/** @returns {Coupon} */
function buildCoupon(id, input) {
  return {
    id,
    code: input.code,
    discount: input.discount,
    active: input.active,
  };
}

module.exports = { FIELDS, validateCoupon, buildCoupon };
