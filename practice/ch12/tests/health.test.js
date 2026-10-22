const request = require('supertest');
const { createApp } = require('../src/app');

describe('/api/health', () => {
  const app = createApp();

  test('GET /api/health 回 200 與 status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
    expect(typeof res.body.data.uptime).toBe('number');
    expect(typeof res.body.data.timestamp).toBe('string');
  });

  test('POST /api/health 不支援回 404', async () => {
    const res = await request(app).post('/api/health');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not found');
  });
});
