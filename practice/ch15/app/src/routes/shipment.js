'use strict';
// Shipment 路由：把 {method, params, body} 轉成服務呼叫並回傳 {status, body}
const { createShipmentService } = require('../services/shipment');
const { toResponse } = require('../lib/http');

function shipmentRoutes(service = createShipmentService()) {
  return {
    'GET /shipments': () => toResponse(() => ({ status: 200, body: service.list() })),
    'GET /shipments/:id': (req) => toResponse(() => ({ status: 200, body: service.get(req.params.id) })),
    'POST /shipments': (req) => toResponse(() => ({ status: 201, body: service.create(req.body) })),
    'PUT /shipments/:id': (req) => toResponse(() => ({ status: 200, body: service.update(req.params.id, req.body) })),
    'DELETE /shipments/:id': (req) => toResponse(() => { service.remove(req.params.id); return { status: 204, body: null }; }),
  };
}

module.exports = { shipmentRoutes };
