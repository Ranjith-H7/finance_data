import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import User from '../src/models/users.js';
import FinanceRecord from '../src/models/financeRecord.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.LOGIN_RATE_LIMIT_MAX = '1000';
process.env.RATE_LIMIT_MAX = '5000';

let mongoServer: MongoMemoryServer;
const app = createApp();

const createToken = async (email: string, password: string) => {
  const response = await request(app).post('/api/users/login').send({ email, password });
  if (response.status !== 200) {
    throw new Error(`Login failed for ${email}: ${response.status} ${JSON.stringify(response.body)}`);
  }
  return response.body.token as string;
};

describe('Backend access control and analytics', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    const hashed = await bcrypt.hash('pass1234', 10);
    await User.create([
      { name: 'Admin', email: 'admin@test.com', password: hashed, role: 'admin', status: 'active' },
      { name: 'Analyst', email: 'analyst@test.com', password: hashed, role: 'analyst', status: 'active' },
      { name: 'Viewer', email: 'viewer@test.com', password: hashed, role: 'viewer', status: 'active' },
      { name: 'Target', email: 'target@test.com', password: hashed, role: 'viewer', status: 'active' },
    ]);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  test('viewer cannot create finance record', async () => {
    const viewerToken = await createToken('viewer@test.com', 'pass1234');
    const target = await User.findOne({ email: 'target@test.com' }).select('_id');

    const response = await request(app)
      .post('/api/users/finance/create')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        userId: String(target?._id),
        amount: 1500,
        type: 'income',
        category: 'Salary',
        date: new Date().toISOString(),
        paymentMethod: 'UPI',
        merchant: 'Company',
      });

    expect(response.status).toBe(403);
  });

  test('analyst permission flow allows scoped analytics', async () => {
    const adminToken = await createToken('admin@test.com', 'pass1234');
    const analystToken = await createToken('analyst@test.com', 'pass1234');
    const target = await User.findOne({ email: 'target@test.com' }).select('_id');

    await request(app)
      .post('/api/users/finance/create')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: String(target?._id),
        amount: 1000,
        type: 'income',
        category: 'Salary',
        date: new Date().toISOString(),
        paymentMethod: 'CARD',
        merchant: 'Corp',
      });

    const requestAccess = await request(app)
      .post('/api/users/permissions/request')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({
        scope: 'single_user',
        userId: String(target?._id),
        reason: 'Monthly analysis',
      });

    expect(requestAccess.status).toBe(201);

    const review = await request(app)
      .patch(`/api/users/permissions/requests/${requestAccess.body._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });

    expect(review.status).toBe(200);

    const analytics = await request(app)
      .get(`/api/users/finance/analytics?userId=${target?._id}`)
      .set('Authorization', `Bearer ${analystToken}`);

    expect(analytics.status).toBe(200);
    expect(analytics.body.summary.totalIncome).toBeGreaterThan(0);
  });

  test('pagination returns page metadata', async () => {
    const adminToken = await createToken('admin@test.com', 'pass1234');

    const response = await request(app)
      .get('/api/users/finance?page=1&limit=1&sortBy=amount&sortOrder=desc')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('totalPages');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('analytics returns avg/min/max summary fields', async () => {
    const adminToken = await createToken('admin@test.com', 'pass1234');
    const analytics = await request(app)
      .get('/api/users/finance/analytics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(analytics.status).toBe(200);
    expect(analytics.body.summary).toHaveProperty('averageAmount');
    expect(analytics.body.summary).toHaveProperty('minAmount');
    expect(analytics.body.summary).toHaveProperty('maxAmount');
  });

  test('critical operations generate audit logs', async () => {
    const count = await mongoose.connection.collection('auditlogs').countDocuments();
    expect(count).toBeGreaterThan(0);
  });

  test('global validation rejects invalid login payload', async () => {
    const response = await request(app).post('/api/users/login').send({ email: 'bad' });
    expect(response.status).toBe(400);
  });

  test('security headers are present', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  test('error handling returns consistent format for unknown route', async () => {
    const response = await request(app).get('/missing-route');
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error.code');
  });

  test('sort order works for finance list', async () => {
    const adminToken = await createToken('admin@test.com', 'pass1234');
    await FinanceRecord.create({
      userId: (await User.findOne({ email: 'target@test.com' }))!._id,
      amount: 10,
      type: 'expense',
      category: 'Food',
      date: new Date(),
      paymentMethod: 'CASH',
      merchant: 'Cafe',
    });

    const response = await request(app)
      .get('/api/users/finance?page=1&limit=10&sortBy=amount&sortOrder=asc')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    const amounts = response.body.data.map((item: { amount: number }) => item.amount);
    const sorted = [...amounts].sort((a: number, b: number) => a - b);
    expect(amounts).toEqual(sorted);
  });
});
