'use strict';
// Invoice 路由：把 {method, params, body} 轉成服務呼叫並回傳 {status, body}
const { createInvoiceService } = require('../services/invoice');
const { toResponse } = require('../lib/http');

function invoiceRoutes(service = createInvoiceService()) {
  return {
    'GET /invoices': () => toResponse(() => ({ status: 200, body: service.list() })),
    'GET /invoices/:id': (req) => toResponse(() => ({ status: 200, body: service.get(req.params.id) })),
    'POST /invoices': (req) => toResponse(() => ({ status: 201, body: service.create(req.body) })),
    'PUT /invoices/:id': (req) => toResponse(() => ({ status: 200, body: service.update(req.params.id, req.body) })),
    'DELETE /invoices/:id': (req) => toResponse(() => { service.remove(req.params.id); return { status: 204, body: null }; }),
  };
}

module.exports = { invoiceRoutes };
