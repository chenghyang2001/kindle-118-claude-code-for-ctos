'use strict';
// Review 路由：把 {method, params, body} 轉成服務呼叫並回傳 {status, body}
const { createReviewService } = require('../services/review');
const { toResponse } = require('../lib/http');

function reviewRoutes(service = createReviewService()) {
  return {
    'GET /reviews': () => toResponse(() => ({ status: 200, body: service.list() })),
    'GET /reviews/:id': (req) => toResponse(() => ({ status: 200, body: service.get(req.params.id) })),
    'POST /reviews': (req) => toResponse(() => ({ status: 201, body: service.create(req.body) })),
    'PUT /reviews/:id': (req) => toResponse(() => ({ status: 200, body: service.update(req.params.id, req.body) })),
    'DELETE /reviews/:id': (req) => toResponse(() => { service.remove(req.params.id); return { status: 204, body: null }; }),
  };
}

module.exports = { reviewRoutes };
