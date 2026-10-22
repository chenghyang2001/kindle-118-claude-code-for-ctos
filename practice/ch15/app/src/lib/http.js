'use strict';
// 統一把例外轉成 HTTP 狀態碼，未知錯誤一律 500 不洩漏細節
function toResponse(fn) {
  try { return fn(); }
  catch (err) {
    if (err.status) return { status: err.status, body: { error: err.message } };
    return { status: 500, body: { error: 'Internal server error' } };
  }
}
module.exports = { toResponse };
