'use strict';
// Shipment 服務層：記憶體儲存的 CRUD
const { validateShipment, buildShipment } = require('../models/shipment');
const { createStore } = require('../lib/store');
const { ValidationError, NotFoundError } = require('../lib/errors');

function createShipmentService(store = createStore('shipment')) {
  return {
    create(input) {
      const errors = validateShipment(input);
      if (errors.length) throw new ValidationError(errors);
      return store.insert((id) => buildShipment(id, input));
    },
    get(id) {
      const item = store.find(id);
      if (!item) throw new NotFoundError('shipment', id);
      return item;
    },
    list() {
      return store.all();
    },
    update(id, patch) {
      const current = this.get(id);
      const merged = { ...current, ...patch };
      const errors = validateShipment(merged);
      if (errors.length) throw new ValidationError(errors);
      return store.replace(id, buildShipment(id, merged));
    },
    remove(id) {
      this.get(id);
      store.delete(id);
      return true;
    },
  };
}

module.exports = { createShipmentService };
