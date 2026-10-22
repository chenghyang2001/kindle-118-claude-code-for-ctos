'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateReview } = require('../src/models/review');
const { createReviewService } = require('../src/services/review');
const { reviewRoutes } = require('../src/routes/review');

const VALID = { productId: 'sample-0', rating: 2, comment: 'sample-2' };

test('review model：合法輸入沒有錯誤', () => {
  assert.deepEqual(validateReview(VALID), []);
});

test('review model：缺必填欄位 productId', () => {
  const { productId: _omit, ...rest } = VALID;
  assert.ok(validateReview(rest).length > 0);
});

test('review service：create/get/update/remove', () => {
  const svc = createReviewService();
  const created = svc.create(VALID);
  assert.equal(svc.get(created.id).id, created.id);
  assert.equal(svc.list().length, 1);
  svc.update(created.id, {});
  assert.equal(svc.remove(created.id), true);
  assert.throws(() => svc.get(created.id), /not found/);
});

test('review route：POST 201、錯誤輸入 400、找不到 404', () => {
  const routes = reviewRoutes();
  assert.equal(routes['POST /reviews']({ body: VALID }).status, 201);
  assert.equal(routes['POST /reviews']({ body: {} }).status, 400);
  assert.equal(routes['GET /reviews/:id']({ params: { id: 'nope' } }).status, 404);
});
