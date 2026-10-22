// 假資料層（callback 風格）：模擬舊的 MySQL driver 介面
const seedUsers = [
  { id: 1, name: 'Alice', email: 'alice@example.com', password: 'hash-a1' },
  { id: 2, name: 'Bob', email: 'bob@example.com', password: 'hash-b2' },
];

let users = [];
let nextId = 1;
let failNext = false;

function reset() {
  users = seedUsers.map((u) => ({ ...u }));
  nextId = users.length + 1;
  failNext = false;
}

// 測試用：讓下一次查詢回傳錯誤，模擬 DB 斷線
function __failNextQuery() {
  failNext = true;
}

function takeFailure() {
  if (!failNext) return null;
  failNext = false;
  return new Error('connection lost');
}

function findAllUsers(cb) {
  setImmediate(() => {
    const err = takeFailure();
    if (err) return cb(err);
    cb(null, users.map((u) => ({ ...u })));
  });
}

function findUserById(id, cb) {
  setImmediate(() => {
    const err = takeFailure();
    if (err) return cb(err);
    const user = users.find((u) => u.id === id);
    cb(null, user ? { ...user } : null);
  });
}

function insertUser(data, cb) {
  setImmediate(() => {
    const err = takeFailure();
    if (err) return cb(err);
    const user = { id: nextId++, ...data };
    users.push(user);
    cb(null, { ...user });
  });
}

reset();

module.exports = { findAllUsers, findUserById, insertUser, reset, __failNextQuery };
