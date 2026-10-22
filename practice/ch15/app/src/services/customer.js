'use strict';
// Customer 服務層：記憶體儲存的 CRUD
const { validateCustomer, buildCustomer } = require('../models/customer');
const { createStore } = require('../lib/store');
const { ValidationError, NotFoundError } = require('../lib/errors');

function createCustomerService(store = createStore('customer')) {
  return {
    create(input) {
      const errors = validateCustomer(input);
      if (errors.length) throw new ValidationError(errors);
      return store.insert((id) => buildCustomer(id, input));
    },
    get(id) {
      const item = store.find(id);
      if (!item) throw new NotFoundError('customer', id);
      return item;
    },
    list() {
      return store.all();
    },
    update(id, patch) {
      const current = this.get(id);
      const merged = { ...current, ...patch };
      const errors = validateCustomer(merged);
      if (errors.length) throw new ValidationError(errors);
      return store.replace(id, buildCustomer(id, merged));
    },
    remove(id) {
      this.get(id);
      store.delete(id);
      return true;
    },
  };
}

module.exports = { createCustomerService };
