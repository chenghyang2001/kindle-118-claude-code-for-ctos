'use strict';
// Product 資料模型：欄位定義與驗證
/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} title
 * @property {number} price
 * @property {number} [stock]
 */

const FIELDS = ["title","price","stock"];

/** @returns {string[]} 錯誤訊息，空陣列代表合法 */
function validateProduct(input) {
  const errors = [];
  if (input === null || typeof input !== 'object') return ['輸入必須是物件'];
  if (input.title === undefined) errors.push('title 為必填');
  if (input.title !== undefined && typeof input.title !== 'string') errors.push('title 必須是 string');
  if (input.price === undefined) errors.push('price 為必填');
  if (input.price !== undefined && typeof input.price !== 'number') errors.push('price 必須是 number');
  if (input.stock !== undefined && typeof input.stock !== 'number') errors.push('stock 必須是 number');
  return errors;
}

/** @returns {Product} */
function buildProduct(id, input) {
  return {
    id,
    title: input.title,
    price: input.price,
    stock: input.stock,
  };
}

module.exports = { FIELDS, validateProduct, buildProduct };
