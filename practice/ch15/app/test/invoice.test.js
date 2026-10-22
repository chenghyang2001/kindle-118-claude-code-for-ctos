'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateInvoice } = require('../src/models/invoice');
const { createInvoiceService } = require('../src/services/invoice');
const { invoiceRoutes } = require('../src/routes/invoice');

const VALID = { orderId: 'sample-0', amount: 2, paid: true };

test('invoice model：合法輸入沒有錯誤', () => {
  assert.deepEqual(validateInvoice(VALID), []);
});

test('invoice model：缺必填欄位 orderId', () => {
  const { orderId: _omit, ...rest } = VALID;
  assert.ok(validateInvoice(rest).length > 0);
});

test('invoice service：create/get/update/remove', () => {
  const svc = createInvoiceService();
  const created = svc.create(VALID);
  assert.equal(svc.get(created.id).id, created.id);
  assert.equal(svc.list().length, 1);
  svc.update(created.id, {});
  assert.equal(svc.remove(created.id), true);
  assert.throws(() => svc.get(created.id), /not found/);
});

test('invoice route：POST 201、錯誤輸入 400、找不到 404', () => {
  const routes = invoiceRoutes();
  assert.equal(routes['POST /invoices']({ body: VALID }).status, 201);
  assert.equal(routes['POST /invoices']({ body: {} }).status, 400);
  assert.equal(routes['GET /invoices/:id']({ params: { id: 'nope' } }).status, 404);
});
