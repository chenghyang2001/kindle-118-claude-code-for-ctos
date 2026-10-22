'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateShipment } = require('../src/models/shipment');
const { createShipmentService } = require('../src/services/shipment');
const { shipmentRoutes } = require('../src/routes/shipment');

const VALID = { orderId: 'sample-0', carrier: 'sample-1', tracking: 'sample-2' };

test('shipment model：合法輸入沒有錯誤', () => {
  assert.deepEqual(validateShipment(VALID), []);
});

test('shipment model：缺必填欄位 orderId', () => {
  const { orderId: _omit, ...rest } = VALID;
  assert.ok(validateShipment(rest).length > 0);
});

test('shipment service：create/get/update/remove', () => {
  const svc = createShipmentService();
  const created = svc.create(VALID);
  assert.equal(svc.get(created.id).id, created.id);
  assert.equal(svc.list().length, 1);
  svc.update(created.id, {});
  assert.equal(svc.remove(created.id), true);
  assert.throws(() => svc.get(created.id), /not found/);
});

test('shipment route：POST 201、錯誤輸入 400、找不到 404', () => {
  const routes = shipmentRoutes();
  assert.equal(routes['POST /shipments']({ body: VALID }).status, 201);
  assert.equal(routes['POST /shipments']({ body: {} }).status, 400);
  assert.equal(routes['GET /shipments/:id']({ params: { id: 'nope' } }).status, 404);
});
