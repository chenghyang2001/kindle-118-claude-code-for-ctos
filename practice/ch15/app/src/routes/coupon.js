'use strict';
// Coupon 路由：把 {method, params, body} 轉成服務呼叫並回傳 {status, body}
const { createCouponService } = require('../services/coupon');
const { toResponse } = require('../lib/http');

function couponRoutes(service = createCouponService()) {
  return {
    'GET /coupons': () => toResponse(() => ({ status: 200, body: service.list() })),
    'GET /coupons/:id': (req) => toResponse(() => ({ status: 200, body: service.get(req.params.id) })),
    'POST /coupons': (req) => toResponse(() => ({ status: 201, body: service.create(req.body) })),
    'PUT /coupons/:id': (req) => toResponse(() => ({ status: 200, body: service.update(req.params.id, req.body) })),
    'DELETE /coupons/:id': (req) => toResponse(() => { service.remove(req.params.id); return { status: 204, body: null }; }),
  };
}

module.exports = { couponRoutes };
