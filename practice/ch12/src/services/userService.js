// 使用者資料的商業邏輯層；路由層只負責 HTTP，不直接碰資料
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.status = 404;
  }
}

// 記憶體內資料（demo 用，重啟即重置）
let users = [];
let nextId = 1;

function reset() {
  users = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
  ];
  nextId = 3;
}
reset();

function listUsers() {
  return users;
}

function getUser(id) {
  const user = users.find((u) => u.id === id);
  if (!user) throw new NotFoundError(`User ${id} not found`);
  return user;
}

function createUser({ name, email } = {}) {
  if (typeof name !== 'string' || name.trim() === '') {
    throw new ValidationError('name is required');
  }
  if (typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new ValidationError('valid email is required');
  }
  const user = { id: nextId++, name: name.trim(), email };
  users.push(user);
  return user;
}

module.exports = { listUsers, getUser, createUser, reset, ValidationError, NotFoundError };
