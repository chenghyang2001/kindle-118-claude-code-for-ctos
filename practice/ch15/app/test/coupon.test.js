'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateCoupon } = require('../src/models/coupon');
const { createCouponService } = require('../src/services/coupon');
const { couponRoutes } = require('../src/routes/coupon');

const VALID = { code: 'sample-0', discount: 2, active: true };

test('coupon model：合法輸入沒有錯誤', () => {
  assert.deepEqual(validateCoupon(VALID), []);
});

test('coupon model：缺必填欄位 code', () => {
  const { code: _omit, ...rest } = VALID;
  assert.ok(validateCoupon(rest).length > 0);
});

test('coupon service：create/get/update/remove', () => {
  const svc = createCouponService();
  const created = svc.create(VALID);
  assert.equal(svc.get(created.id).id, created.id);
  assert.equal(svc.list().length, 1);
  svc.update(created.id, {});
  assert.equal(svc.remove(created.id), true);
  assert.throws(() => svc.get(created.id), /not found/);
});

test('coupon route：POST 201、錯誤輸入 400、找不到 404', () => {
  const routes = couponRoutes();
  assert.equal(routes['POST /coupons']({ body: VALID }).status, 201);
  assert.equal(routes['POST /coupons']({ body: {} }).status, 400);
  assert.equal(routes['GET /coupons/:id']({ params: { id: 'nope' } }).status, 404);
});
