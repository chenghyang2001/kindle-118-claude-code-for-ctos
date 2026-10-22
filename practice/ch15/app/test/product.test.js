'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateProduct } = require('../src/models/product');
const { createProductService } = require('../src/services/product');
const { productRoutes } = require('../src/routes/product');

const VALID = { title: 'sample-0', price: 2, stock: 3 };

test('product model：合法輸入沒有錯誤', () => {
  assert.deepEqual(validateProduct(VALID), []);
});

test('product model：缺必填欄位 title', () => {
  const { title: _omit, ...rest } = VALID;
  assert.ok(validateProduct(rest).length > 0);
});

test('product service：create/get/update/remove', () => {
  const svc = createProductService();
  const created = svc.create(VALID);
  assert.equal(svc.get(created.id).id, created.id);
  assert.equal(svc.list().length, 1);
  svc.update(created.id, {});
  assert.equal(svc.remove(created.id), true);
  assert.throws(() => svc.get(created.id), /not found/);
});

test('product route：POST 201、錯誤輸入 400、找不到 404', () => {
  const routes = productRoutes();
  assert.equal(routes['POST /products']({ body: VALID }).status, 201);
  assert.equal(routes['POST /products']({ body: {} }).status, 400);
  assert.equal(routes['GET /products/:id']({ params: { id: 'nope' } }).status, 404);
});
