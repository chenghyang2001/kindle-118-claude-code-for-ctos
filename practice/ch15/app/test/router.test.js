'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildRouter } = require('../src/router');

test('router 包含所有領域的 5 條路由', () => {
  assert.equal(Object.keys(buildRouter()).length, 40);
});
