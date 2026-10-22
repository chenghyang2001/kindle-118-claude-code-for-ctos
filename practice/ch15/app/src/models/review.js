'use strict';
// Review 資料模型：欄位定義與驗證
/**
 * @typedef {Object} Review
 * @property {string} id
 * @property {string} productId
 * @property {number} rating
 * @property {string} [comment]
 */

const FIELDS = ["productId","rating","comment"];

/** @returns {string[]} 錯誤訊息，空陣列代表合法 */
function validateReview(input) {
  const errors = [];
  if (input === null || typeof input !== 'object') return ['輸入必須是物件'];
  if (input.productId === undefined) errors.push('productId 為必填');
  if (input.productId !== undefined && typeof input.productId !== 'string') errors.push('productId 必須是 string');
  if (input.rating === undefined) errors.push('rating 為必填');
  if (input.rating !== undefined && typeof input.rating !== 'number') errors.push('rating 必須是 number');
  if (input.comment !== undefined && typeof input.comment !== 'string') errors.push('comment 必須是 string');
  return errors;
}

/** @returns {Review} */
function buildReview(id, input) {
  return {
    id,
    productId: input.productId,
    rating: input.rating,
    comment: input.comment,
  };
}

module.exports = { FIELDS, validateReview, buildReview };
