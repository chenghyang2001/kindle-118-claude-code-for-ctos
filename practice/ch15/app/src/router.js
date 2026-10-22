'use strict';
// 匯總所有路由
const { userRoutes } = require('./routes/user');
const { customerRoutes } = require('./routes/customer');
const { productRoutes } = require('./routes/product');
const { orderRoutes } = require('./routes/order');
const { invoiceRoutes } = require('./routes/invoice');
const { shipmentRoutes } = require('./routes/shipment');
const { reviewRoutes } = require('./routes/review');
const { couponRoutes } = require('./routes/coupon');

function buildRouter() {
  return { ...userRoutes(), ...customerRoutes(), ...productRoutes(), ...orderRoutes(), ...invoiceRoutes(), ...shipmentRoutes(), ...reviewRoutes(), ...couponRoutes() };
}
module.exports = { buildRouter };
