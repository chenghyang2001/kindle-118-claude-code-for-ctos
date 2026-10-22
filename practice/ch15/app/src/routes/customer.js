'use strict';
// Customer 路由：把 {method, params, body} 轉成服務呼叫並回傳 {status, body}
const { createCustomerService } = require('../services/customer');
const { toResponse } = require('../lib/http');

function customerRoutes(service = createCustomerService()) {
  return {
    'GET /customers': () => toResponse(() => ({ status: 200, body: service.list() })),
    'GET /customers/:id': (req) => toResponse(() => ({ status: 200, body: service.get(req.params.id) })),
    'POST /customers': (req) => toResponse(() => ({ status: 201, body: service.create(req.body) })),
    'PUT /customers/:id': (req) => toResponse(() => ({ status: 200, body: service.update(req.params.id, req.body) })),
    'DELETE /customers/:id': (req) => toResponse(() => { service.remove(req.params.id); return { status: 204, body: null }; }),
  };
}

module.exports = { customerRoutes };
