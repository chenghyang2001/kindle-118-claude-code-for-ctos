'use strict';
// Coupon 服務層：記憶體儲存的 CRUD
const { validateCoupon, buildCoupon } = require('../models/coupon');
const { createStore } = require('../lib/store');
const { ValidationError, NotFoundError } = require('../lib/errors');

function createCouponService(store = createStore('coupon')) {
  return {
    create(input) {
      const errors = validateCoupon(input);
      if (errors.length) throw new ValidationError(errors);
      return store.insert((id) => buildCoupon(id, input));
    },
    get(id) {
      const item = store.find(id);
      if (!item) throw new NotFoundError('coupon', id);
      return item;
    },
    list() {
      return store.all();
    },
    update(id, patch) {
      const current = this.get(id);
      const merged = { ...current, ...patch };
      const errors = validateCoupon(merged);
      if (errors.length) throw new ValidationError(errors);
      return store.replace(id, buildCoupon(id, merged));
    },
    remove(id) {
      this.get(id);
      store.delete(id);
      return true;
    },
  };
}

module.exports = { createCouponService };
