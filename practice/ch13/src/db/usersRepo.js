// @ts-check
// users 的 repository：把 fakeDb 的 callback 介面包成 Promise（fakeDb 本身維持原樣）
const db = require("./fakeDb");

/** @typedef {import('../api/users/users.types').User} User */
/** @typedef {import('../api/users/users.types').NewUser} NewUser */

/** @returns {Promise<User[]>} */
function findAll() {
  return new Promise((resolve, reject) => {
    db.findAllUsers((err, users) => {
      if (err) return reject(err);
      resolve(users);
    });
  });
}

/**
 * @param {number} id
 * @returns {Promise<User | null>}
 */
function findById(id) {
  return new Promise((resolve, reject) => {
    db.findUserById(id, (err, user) => {
      if (err) return reject(err);
      resolve(user);
    });
  });
}

/**
 * @param {NewUser} data
 * @returns {Promise<User>}
 */
function insert(data) {
  return new Promise((resolve, reject) => {
    db.insertUser(data, (err, user) => {
      if (err) return reject(err);
      resolve(user);
    });
  });
}

module.exports = { findAll, findById, insert };
