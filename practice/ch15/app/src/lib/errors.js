'use strict';
class ValidationError extends Error {
  constructor(errors) { super(errors.join('; ')); this.errors = errors; this.status = 400; }
}
class NotFoundError extends Error {
  constructor(kind, id) { super(`${kind} ${id} not found`); this.status = 404; }
}
module.exports = { ValidationError, NotFoundError };
