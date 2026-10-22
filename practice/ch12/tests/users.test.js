const request = require('supertest');
const { createApp } = require('../src/app');
const userService = require('../src/services/userService');

describe('/api/users', () => {
  const app = createApp();
  beforeEach(() => userService.reset());

  test('GET /api/users 回傳清單', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  test('GET /api/users/:id 找不到回 404', async () => {
    const res = await request(app).get('/api/users/999');
    expect(res.status).toBe(404);
  });

  test('GET /api/users/:id 非法 id 回 400', async () => {
    const res = await request(app).get('/api/users/abc');
    expect(res.status).toBe(400);
  });

  test('POST /api/users 建立成功回 201', async () => {
    const res = await request(app).post('/api/users').send({ name: 'Carol', email: 'carol@example.com' });
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe(3);
  });

  test('POST /api/users 缺 email 回 400', async () => {
    const res = await request(app).post('/api/users').send({ name: 'Dan' });
    expect(res.status).toBe(400);
  });
});
