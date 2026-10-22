'use strict';
// 記憶體儲存：每個 service 一份，id 用遞增流水號
function createStore(prefix) {
  const rows = new Map();
  let seq = 0;
  return {
    insert(factory) { const id = `${prefix}-${++seq}`; const row = factory(id); rows.set(id, row); return row; },
    find(id) { return rows.get(id) ?? null; },
    all() { return [...rows.values()]; },
    replace(id, row) { rows.set(id, row); return row; },
    delete(id) { rows.delete(id); },
  };
}
module.exports = { createStore };
