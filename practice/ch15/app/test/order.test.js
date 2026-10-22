'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateOrder } = require('../src/models/order');
const { createOrderService } = require('../src/services/order');
const { orderRoutes } = require('../src/routes/order');

const VALID = { customerId: 'sample-0', productId: 'sample-1', quantity: 3 };

test('order model：合法輸入沒有錯誤', () => {
  assert.deepEqual(validateOrder(VALID), []);
});

test('order model：缺必填欄位 customerId', () => {
  const { customerId: _omit, ...rest } = VALID;
  assert.ok(validateOrder(rest).length > 0);
});

test('order service：create/get/update/remove', () => {
  const svc = createOrderService();
  const created = svc.create(VALID);
  assert.equal(svc.get(created.id).id, created.id);
  assert.equal(svc.list().length, 1);
  svc.update(created.id, {});
  assert.equal(svc.remove(created.id), true);
  assert.throws(() => svc.get(created.id), /not found/);
});

test('order route：POST 201、錯誤輸入 400、找不到 404', () => {
  const routes = orderRoutes();
  assert.equal(routes['POST /orders']({ body: VALID }).status, 201);
  assert.equal(routes['POST /orders']({ body: {} }).status, 400);
  assert.equal(routes['GET /orders/:id']({ params: { id: 'nope' } }).status, 404);
});
