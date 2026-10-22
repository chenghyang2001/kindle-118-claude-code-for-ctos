'use strict';
// Review 服務層：記憶體儲存的 CRUD
const { validateReview, buildReview } = require('../models/review');
const { createStore } = require('../lib/store');
const { ValidationError, NotFoundError } = require('../lib/errors');

function createReviewService(store = createStore('review')) {
  return {
    create(input) {
      const errors = validateReview(input);
      if (errors.length) throw new ValidationError(errors);
      return store.insert((id) => buildReview(id, input));
    },
    get(id) {
      const item = store.find(id);
      if (!item) throw new NotFoundError('review', id);
      return item;
    },
    list() {
      return store.all();
    },
    update(id, patch) {
      const current = this.get(id);
      const merged = { ...current, ...patch };
      const errors = validateReview(merged);
      if (errors.length) throw new ValidationError(errors);
      return store.replace(id, buildReview(id, merged));
    },
    remove(id) {
      this.get(id);
      store.delete(id);
      return true;
    },
  };
}

module.exports = { createReviewService };
