'use strict';
// Order 路由：把 {method, params, body} 轉成服務呼叫並回傳 {status, body}
const { createOrderService } = require('../services/order');
const { toResponse } = require('../lib/http');

function orderRoutes(service = createOrderService()) {
  return {
    'GET /orders': () => toResponse(() => ({ status: 200, body: service.list() })),
    'GET /orders/:id': (req) => toResponse(() => ({ status: 200, body: service.get(req.params.id) })),
    'POST /orders': (req) => toResponse(() => ({ status: 201, body: service.create(req.body) })),
    'PUT /orders/:id': (req) => toResponse(() => ({ status: 200, body: service.update(req.params.id, req.body) })),
    'DELETE /orders/:id': (req) => toResponse(() => { service.remove(req.params.id); return { status: 204, body: null }; }),
  };
}

module.exports = { orderRoutes };
