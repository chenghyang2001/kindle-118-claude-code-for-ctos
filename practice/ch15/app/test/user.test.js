'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateUser } = require('../src/models/user');
const { createUserService } = require('../src/services/user');
const { userRoutes } = require('../src/routes/user');

const VALID = { name: 'sample-0', email: 'sample-1', age: 3 };

test('user model：合法輸入沒有錯誤', () => {
  assert.deepEqual(validateUser(VALID), []);
});

test('user model：缺必填欄位 name', () => {
  const { name: _omit, ...rest } = VALID;
  assert.ok(validateUser(rest).length > 0);
});

test('user service：create/get/update/remove', () => {
  const svc = createUserService();
  const created = svc.create(VALID);
  assert.equal(svc.get(created.id).id, created.id);
  assert.equal(svc.list().length, 1);
  svc.update(created.id, {});
  assert.equal(svc.remove(created.id), true);
  assert.throws(() => svc.get(created.id), /not found/);
});

test('user route：POST 201、錯誤輸入 400、找不到 404', () => {
  const routes = userRoutes();
  assert.equal(routes['POST /users']({ body: VALID }).status, 201);
  assert.equal(routes['POST /users']({ body: {} }).status, 400);
  assert.equal(routes['GET /users/:id']({ params: { id: 'nope' } }).status, 404);
});
