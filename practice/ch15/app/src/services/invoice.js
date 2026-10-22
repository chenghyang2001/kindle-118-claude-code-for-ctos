'use strict';
// Invoice 服務層：記憶體儲存的 CRUD
const { validateInvoice, buildInvoice } = require('../models/invoice');
const { createStore } = require('../lib/store');
const { ValidationError, NotFoundError } = require('../lib/errors');

function createInvoiceService(store = createStore('invoice')) {
  return {
    create(input) {
      const errors = validateInvoice(input);
      if (errors.length) throw new ValidationError(errors);
      return store.insert((id) => buildInvoice(id, input));
    },
    get(id) {
      const item = store.find(id);
      if (!item) throw new NotFoundError('invoice', id);
      return item;
    },
    list() {
      return store.all();
    },
    update(id, patch) {
      const current = this.get(id);
      const merged = { ...current, ...patch };
      const errors = validateInvoice(merged);
      if (errors.length) throw new ValidationError(errors);
      return store.replace(id, buildInvoice(id, merged));
    },
    remove(id) {
      this.get(id);
      store.delete(id);
      return true;
    },
  };
}

module.exports = { createInvoiceService };
