'use strict';
// User 路由：把 {method, params, body} 轉成服務呼叫並回傳 {status, body}
const { createUserService } = require('../services/user');
const { toResponse } = require('../lib/http');

function userRoutes(service = createUserService()) {
  return {
    'GET /users': () => toResponse(() => ({ status: 200, body: service.list() })),
    'GET /users/:id': (req) => toResponse(() => ({ status: 200, body: service.get(req.params.id) })),
    'POST /users': (req) => toResponse(() => ({ status: 201, body: service.create(req.body) })),
    'PUT /users/:id': (req) => toResponse(() => ({ status: 200, body: service.update(req.params.id, req.body) })),
    'DELETE /users/:id': (req) => toResponse(() => { service.remove(req.params.id); return { status: 204, body: null }; }),
  };
}

module.exports = { userRoutes };
