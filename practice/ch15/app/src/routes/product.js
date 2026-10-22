'use strict';
// Product 路由：把 {method, params, body} 轉成服務呼叫並回傳 {status, body}
const { createProductService } = require('../services/product');
const { toResponse } = require('../lib/http');

function productRoutes(service = createProductService()) {
  return {
    'GET /products': () => toResponse(() => ({ status: 200, body: service.list() })),
    'GET /products/:id': (req) => toResponse(() => ({ status: 200, body: service.get(req.params.id) })),
    'POST /products': (req) => toResponse(() => ({ status: 201, body: service.create(req.body) })),
    'PUT /products/:id': (req) => toResponse(() => ({ status: 200, body: service.update(req.params.id, req.body) })),
    'DELETE /products/:id': (req) => toResponse(() => { service.remove(req.params.id); return { status: 204, body: null }; }),
  };
}

module.exports = { productRoutes };
