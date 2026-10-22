'use strict';
// Product 服務層：記憶體儲存的 CRUD
const { validateProduct, buildProduct } = require('../models/product');
const { createStore } = require('../lib/store');
const { ValidationError, NotFoundError } = require('../lib/errors');

function createProductService(store = createStore('product')) {
  return {
    create(input) {
      const errors = validateProduct(input);
      if (errors.length) throw new ValidationError(errors);
      return store.insert((id) => buildProduct(id, input));
    },
    get(id) {
      const item = store.find(id);
      if (!item) throw new NotFoundError('product', id);
      return item;
    },
    list() {
      return store.all();
    },
    update(id, patch) {
      const current = this.get(id);
      const merged = { ...current, ...patch };
      const errors = validateProduct(merged);
      if (errors.length) throw new ValidationError(errors);
      return store.replace(id, buildProduct(id, merged));
    },
    remove(id) {
      this.get(id);
      store.delete(id);
      return true;
    },
  };
}

module.exports = { createProductService };
