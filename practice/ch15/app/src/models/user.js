'use strict';
// User 資料模型：欄位定義與驗證
/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {number} [age]
 */

const FIELDS = ["name","email","age"];

/** @returns {string[]} 錯誤訊息，空陣列代表合法 */
function validateUser(input) {
  const errors = [];
  if (input === null || typeof input !== 'object') return ['輸入必須是物件'];
  if (input.name === undefined) errors.push('name 為必填');
  if (input.name !== undefined && typeof input.name !== 'string') errors.push('name 必須是 string');
  if (input.email === undefined) errors.push('email 為必填');
  if (input.email !== undefined && typeof input.email !== 'string') errors.push('email 必須是 string');
  if (input.age !== undefined && typeof input.age !== 'number') errors.push('age 必須是 number');
  return errors;
}

/** @returns {User} */
function buildUser(id, input) {
  return {
    id,
    name: input.name,
    email: input.email,
    age: input.age,
  };
}

module.exports = { FIELDS, validateUser, buildUser };
