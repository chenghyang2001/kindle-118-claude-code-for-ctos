'use strict';
// Order 服務層：記憶體儲存的 CRUD
const { validateOrder, buildOrder } = require('../models/order');
const { createStore } = require('../lib/store');
const { ValidationError, NotFoundError } = require('../lib/errors');

function createOrderService(store = createStore('order')) {
  return {
    create(input) {
      const errors = validateOrder(input);
      if (errors.length) throw new ValidationError(errors);
      return store.insert((id) => buildOrder(id, input));
    },
    get(id) {
      const item = store.find(id);
      if (!item) throw new NotFoundError('order', id);
      return item;
    },
    list() {
      return store.all();
    },
    update(id, patch) {
      const current = this.get(id);
      const merged = { ...current, ...patch };
      const errors = validateOrder(merged);
      if (errors.length) throw new ValidationError(errors);
      return store.replace(id, buildOrder(id, merged));
    },
    remove(id) {
      this.get(id);
      store.delete(id);
      return true;
    },
  };
}

module.exports = { createOrderService };
