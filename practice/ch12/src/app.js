// 建立 Express app（與 server.js 分開，方便 supertest 直接測試不必開 port）
const express = require('express');
const usersRouter = require('./api/users');
const healthRouter = require('./api/health');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/users', usersRouter);
  app.use('/api/health', healthRouter);

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // 統一錯誤處理：不洩漏內部細節給呼叫端
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status ?? 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: status >= 500 ? 'Internal server error' : err.message });
  });

  return app;
}

module.exports = { createApp };
