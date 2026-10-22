'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateCustomer } = require('../src/models/customer');
const { createCustomerService } = require('../src/services/customer');
const { customerRoutes } = require('../src/routes/customer');

const VALID = { name: 'sample-0', company: 'sample-1', tier: 'sample-2' };

test('customer model：合法輸入沒有錯誤', () => {
  assert.deepEqual(validateCustomer(VALID), []);
});

test('customer model：缺必填欄位 name', () => {
  const { name: _omit, ...rest } = VALID;
  assert.ok(validateCustomer(rest).length > 0);
});

test('customer service：create/get/update/remove', () => {
  const svc = createCustomerService();
  const created = svc.create(VALID);
  assert.equal(svc.get(created.id).id, created.id);
  assert.equal(svc.list().length, 1);
  svc.update(created.id, {});
  assert.equal(svc.remove(created.id), true);
  assert.throws(() => svc.get(created.id), /not found/);
});

test('customer route：POST 201、錯誤輸入 400、找不到 404', () => {
  const routes = customerRoutes();
  assert.equal(routes['POST /customers']({ body: VALID }).status, 201);
  assert.equal(routes['POST /customers']({ body: {} }).status, 400);
  assert.equal(routes['GET /customers/:id']({ params: { id: 'nope' } }).status, 404);
});
