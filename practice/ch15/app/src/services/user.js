'use strict';
// User 服務層：記憶體儲存的 CRUD
const { validateUser, buildUser } = require('../models/user');
const { createStore } = require('../lib/store');
const { ValidationError, NotFoundError } = require('../lib/errors');

function createUserService(store = createStore('user')) {
  return {
    create(input) {
      const errors = validateUser(input);
      if (errors.length) throw new ValidationError(errors);
      return store.insert((id) => buildUser(id, input));
    },
    get(id) {
      const item = store.find(id);
      if (!item) throw new NotFoundError('user', id);
      return item;
    },
    list() {
      return store.all();
    },
    update(id, patch) {
      const current = this.get(id);
      const merged = { ...current, ...patch };
      const errors = validateUser(merged);
      if (errors.length) throw new ValidationError(errors);
      return store.replace(id, buildUser(id, merged));
    },
    remove(id) {
      this.get(id);
      store.delete(id);
      return true;
    },
  };
}

module.exports = { createUserService };
