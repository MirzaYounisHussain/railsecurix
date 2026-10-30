/**
 * RailSecurix - Comprehensive Local Test Suite for Vercel Serverless Handlers
 * 
 * Tests all 19 endpoints using controlled mock HTTP requests and responses.
 * Validates dependencies, HTTP methods, authentication & authorization,
 * error handling, response structures, and business logic.
 * Strictly uses local mocks; zero calls to live Supabase.
 */

import assert from 'node:assert/strict';

// Helper to construct mock req and res
function createMockReqRes({
  method = 'GET',
  url = '/',
  query = {},
  headers = {},
  body = null,
} = {}) {
  const req = {
    method,
    url,
    query,
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      ...headers,
    },
    body,
  };

  const res = {
    statusCode: 200,
    headers: {},
    bodyData: null,
    ended: false,
    setHeader(key, value) {
      this.headers[key.toLowerCase()] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.bodyData = data;
      this.ended = true;
      return this;
    },
    end(data) {
      if (data) this.bodyData = data;
      this.ended = true;
      return this;
    },
  };

  return { req, res };
}

// Test Runner
const testResults = [];
async function test(name, fn) {
  try {
    await fn();
    testResults.push({ name, passed: true });
    console.log(`  ✓ PASS: ${name}`);
  } catch (err) {
    testResults.push({ name, passed: false, error: err });
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
  }
}

async function runTests() {
  console.log('\n===============================================================');
  console.log('RailSecurix: Running Serverless Function Verification Tests');
  console.log('===============================================================\n');

  // 1. Dependency & Module Import Verification
  console.log('--- 1. Module Import Checks ---');
  await test('Import _supabase.js core utilities', async () => {
    const mod = await import('./api/_supabase.js');
    assert.equal(typeof mod.getSupabaseClient, 'function');
    assert.equal(typeof mod.hashPassword, 'function');
    assert.equal(typeof mod.verifyPassword, 'function');
    assert.equal(typeof mod.calculateAuthoritativeFare, 'function');
  });

  // 2. Password Hashing & Verification
  console.log('\n--- 2. Two-Way Scrypt Password Hashing Checks ---');
  await test('Scrypt password generation and verification', async () => {
    const { hashPassword, verifyPassword } = await import('./api/_supabase.js');
    const pwd = 'TestPassword@2026!';
    const hash = hashPassword(pwd);
    assert.match(hash, /^scrypt:32768:8:1\$[a-f0-9]+\$[a-f0-9]+$/);
    assert.equal(verifyPassword(pwd, hash), true);
    assert.equal(verifyPassword('WrongPassword', hash), false);
  });

  // 3. /api/health
  console.log('\n--- 3. /api/health Endpoint Checks ---');
  await test('GET /api/health returns 200 with service metadata', async () => {
    const { default: handler } = await import('./api/health.js');
    const { req, res } = createMockReqRes({ method: 'GET', url: '/api/health' });
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.bodyData.status, 'healthy');
    assert.ok(res.bodyData.timestamp);
  });

  await test('OPTIONS /api/health returns 200 CORS preflight', async () => {
    const { default: handler } = await import('./api/health.js');
    const { req, res } = createMockReqRes({ method: 'OPTIONS', url: '/api/health' });
    await handler(req, res);
    assert.equal(res.statusCode, 200);
  });

  // 4. /api/system/supabase-status
  console.log('\n--- 4. /api/system/supabase-status Endpoint Checks ---');
  await test('GET /api/system/supabase-status responds with diagnostic structure', async () => {
    const { default: handler } = await import('./api/system/supabase-status.js');
    const { req, res } = createMockReqRes({ method: 'GET', url: '/api/system/supabase-status' });
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(typeof res.bodyData.success, 'boolean');
    assert.ok(res.bodyData.projectUrl);
  });

  // 5. /api/stations
  console.log('\n--- 5. /api/stations Endpoint Checks ---');
  await test('GET /api/stations returns station array', async () => {
    const { default: handler } = await import('./api/stations.js');
    const { req, res } = createMockReqRes({ method: 'GET', url: '/api/stations' });
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    assert.ok(Array.isArray(res.bodyData));
    assert.ok(res.bodyData.length >= 7);
    assert.ok(res.bodyData.some(s => s.stationCode === 'NDLS'));
  });

  await test('POST /api/stations rejects unauthenticated / non-admin requests with 403', async () => {
    const { default: handler } = await import('./api/stations.js');
    const { req, res } = createMockReqRes({
      method: 'POST',
      url: '/api/stations',
      body: { stationCode: 'TEST', stationName: 'Test Station' },
    });
    await handler(req, res);
    assert.equal(res.statusCode, 403);
    assert.match(res.bodyData.error, /Administrator/);
  });

  await test('DELETE /api/stations/:id rejects unauthenticated requests with 403', async () => {
    const { default: handler } = await import('./api/stations/[id].js');
    const { req, res } = createMockReqRes({
      method: 'DELETE',
      url: '/api/stations/1',
      query: { id: '1' },
    });
    await handler(req, res);
    assert.equal(res.statusCode, 403);
    assert.match(res.bodyData.error, /Administrator/);
  });

  // 6. /api/trains/search
  console.log('\n--- 6. /api/trains/search Endpoint Checks ---');
  await test('GET /api/trains/search returns trains for valid route', async () => {
    const { default: handler } = await import('./api/trains/search.js');
    const { req, res } = createMockReqRes({
      method: 'GET',
      url: '/api/trains/search',
      query: { source: 'NDLS', destination: 'BCT', date: '2026-11-01', quota: 'GN' },
    });
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    assert.ok(Array.isArray(res.bodyData));
    assert.ok(res.bodyData.length > 0);
    assert.ok(res.bodyData[0].trainNumber);
    assert.ok(res.bodyData[0].availabilityMatrix);
  });

  await test('GET /api/trains/search rejects identical source and destination with 400', async () => {
    const { default: handler } = await import('./api/trains/search.js');
    const { req, res } = createMockReqRes({
      method: 'GET',
      url: '/api/trains/search',
      query: { source: 'NDLS', destination: 'NDLS' },
    });
    await handler(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.bodyData.error, /cannot be the same/);
  });

  // 7. /api/trains/:id and /api/trains/:id/seats
  console.log('\n--- 7. /api/trains/[id] Details and Seats Layout Checks ---');
  await test('GET /api/trains/:id returns valid train details', async () => {
    const { default: handler } = await import('./api/trains/[id]/index.js');
    const { req, res } = createMockReqRes({
      method: 'GET',
      url: '/api/trains/12951',
      query: { id: '12951' },
    });
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.bodyData.trainNumber, '12951');
    assert.ok(res.bodyData.trainName);
  });

  await test('GET /api/trains/:id/seats returns 36-seat coach layout', async () => {
    const { default: handler } = await import('./api/trains/[id]/seats.js');
    const { req, res } = createMockReqRes({
      method: 'GET',
      url: '/api/trains/12951/seats',
      query: { id: '12951', date: '2026-11-01', class: '3A' },
    });
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.bodyData.classCode, '3A');
    assert.ok(Array.isArray(res.bodyData.seats));
    assert.ok(res.bodyData.seats.length > 0);
  });

  await test('GET /api/trains/status/:trainNumber validates 5-digit number', async () => {
    const { default: handler } = await import('./api/trains/status/[trainNumber].js');
    const { req: badReq, res: badRes } = createMockReqRes({
      method: 'GET',
      url: '/api/trains/status/abc',
      query: { trainNumber: 'abc' },
    });
    await handler(badReq, badRes);
    assert.equal(badRes.statusCode, 400);

    const { req: goodReq, res: goodRes } = createMockReqRes({
      method: 'GET',
      url: '/api/trains/status/12951',
      query: { trainNumber: '12951' },
    });
    await handler(goodReq, goodRes);
    assert.equal(goodRes.statusCode, 200);
    assert.equal(goodRes.bodyData.trainNumber, '12951');
    assert.ok(goodRes.bodyData.status);
  });

  // 8. /api/fare/calculate
  console.log('\n--- 8. Authoritative Fare Calculation Checks ---');
  await test('POST /api/fare/calculate computes authoritative fare matching schema', async () => {
    const { default: handler } = await import('./api/fare/calculate.js');
    const { req, res } = createMockReqRes({
      method: 'POST',
      url: '/api/fare/calculate',
      body: { trainId: '12951', travelClass: '3A', quota: 'GN', numPassengers: 2 },
    });
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.bodyData.travel_class, '3A');
    assert.equal(res.bodyData.class_multiplier, 1.5);
    assert.equal(res.bodyData.num_passengers, 2);
    assert.equal(res.bodyData.reservation_fee_per_pax, 40);
    assert.ok(res.bodyData.total_fare > 0);
  });

  // 9. /api/seats/lock and /api/seats/unlock
  console.log('\n--- 9. Seat Locking & Release Authorization Checks ---');
  await test('POST /api/seats/lock validates required fields', async () => {
    const { default: handler } = await import('./api/seats/[action].js');
    const { req, res } = createMockReqRes({
      method: 'POST',
      url: '/api/seats/lock',
      query: { action: 'lock' },
      body: { trainId: '12951' }, // Missing date and seats
    });
    await handler(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.bodyData.error, /Missing required fields/);
  });

  await test('POST /api/seats/lock issues session cookie for new visitor', async () => {
    const { default: handler } = await import('./api/seats/[action].js');
    const { req, res } = createMockReqRes({
      method: 'POST',
      url: '/api/seats/lock',
      query: { action: 'lock' },
      body: { trainId: '12951', date: '2026-11-01', class: '3A', seats: ['3A-1', '3A-2'] },
    });
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.bodyData.success, true);
    assert.deepEqual(res.bodyData.lockedSeats, ['3A-1', '3A-2']);
    assert.ok(res.headers['set-cookie']);
    assert.match(res.headers['set-cookie'], /railsim_session=sess_/);
  });

  await test('POST /api/seats/unlock requires session token', async () => {
    const { default: handler } = await import('./api/seats/[action].js');
    const { req, res } = createMockReqRes({
      method: 'POST',
      url: '/api/seats/unlock',
      query: { action: 'unlock' },
      body: { trainId: '12951', date: '2026-11-01', class: '3A', seats: ['3A-1'] },
      // No session cookie or token provided
    });
    await handler(req, res);
    assert.equal(res.statusCode, 401);
    assert.match(res.bodyData.error, /Session token required/);
  });

  // 10. /api/auth/* (Availability, OTP, Registration, Login, Logout, Me)
  console.log('\n--- 10. Complete Authentication Flow Checks ---');
  const { default: authHandler } = await import('./api/auth/[action].js');

  await test('POST /api/auth/check-availability reports username and email status', async () => {
    const { req, res } = createMockReqRes({
      method: 'POST',
      url: '/api/auth/check-availability',
      query: { action: 'check-availability' },
      body: { username: 'testuser', email: 'unique_user_991@example.com' },
    });
    await authHandler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.bodyData.usernameAvailable, false); // testuser already taken
    assert.equal(res.bodyData.emailAvailable, true);
  });

  await test('POST /api/auth/send-otp validates inputs and generates OTP', async () => {
    const { req, res } = createMockReqRes({
      method: 'POST',
      url: '/api/auth/send-otp',
      query: { action: 'send-otp' },
      body: { username: 'newuser123', email: 'newuser123@example.com' },
    });
    await authHandler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.bodyData.success, true);
    assert.ok(res.bodyData.devOtp); // Dev mode returns devOtp
    assert.equal(res.bodyData.devOtp.length, 6);
  });

  let savedVerificationToken = '';
  await test('POST /api/auth/verify-otp validates 6-digit code and issues single-use token', async () => {
    // 1. Send OTP to generate entry
    const email = 'flowtest@example.com';
    const { req: sReq, res: sRes } = createMockReqRes({
      method: 'POST',
      url: '/api/auth/send-otp',
      query: { action: 'send-otp' },
      body: { username: 'flowuser', email },
    });
    await authHandler(sReq, sRes);
    const otp = sRes.bodyData.devOtp;
    assert.ok(otp);

    // 2. Bad OTP rejection
    const { req: badReq, res: badRes } = createMockReqRes({
      method: 'POST',
      url: '/api/auth/verify-otp',
      query: { action: 'verify-otp' },
      body: { email, otp: '000000' },
    });
    await authHandler(badReq, badRes);
    assert.equal(badRes.statusCode, 400);

    // 3. Valid OTP verification
    const { req: goodReq, res: goodRes } = createMockReqRes({
      method: 'POST',
      url: '/api/auth/verify-otp',
      query: { action: 'verify-otp' },
      body: { email, otp },
    });
    await authHandler(goodReq, goodRes);
    assert.equal(goodRes.statusCode, 200);
    assert.equal(goodRes.bodyData.success, true);
    assert.ok(goodRes.bodyData.verificationToken);
    savedVerificationToken = goodRes.bodyData.verificationToken;
  });

  await test('POST /api/auth/login succeeds for valid test user and issues session cookie', async () => {
    const { req, res } = createMockReqRes({
      method: 'POST',
      url: '/api/auth/login',
      query: { action: 'login' },
      body: { username: 'testuser', password: 'TestUser@123' },
    });
    await authHandler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.bodyData.success, true);
    assert.equal(res.bodyData.user.username, 'testuser');
    assert.ok(res.headers['set-cookie']);
  });

  await test('POST /api/auth/login returns 401 on invalid credentials', async () => {
    const { req, res } = createMockReqRes({
      method: 'POST',
      url: '/api/auth/login',
      query: { action: 'login' },
      body: { username: 'testuser', password: 'WrongPassword!' },
    });
    await authHandler(req, res);
    assert.equal(res.statusCode, 401);
    assert.equal(res.bodyData.success, false);
  });

  await test('GET /api/auth/me returns null when unauthenticated, user when session present', async () => {
    // Unauthenticated
    const { req: unauthReq, res: unauthRes } = createMockReqRes({
      method: 'GET',
      url: '/api/auth/me',
      query: { action: 'me' },
    });
    await authHandler(unauthReq, unauthRes);
    assert.equal(unauthRes.statusCode, 200);
    assert.equal(unauthRes.bodyData.authenticated, false);

    // Authenticated via cookie
    const userCookie = encodeURIComponent(JSON.stringify({ id: 1, username: 'testuser', role: 'user' }));
    const { req: authReq, res: authRes } = createMockReqRes({
      method: 'GET',
      url: '/api/auth/me',
      query: { action: 'me' },
      headers: { cookie: `railsim_session=${userCookie}` },
    });
    await authHandler(authReq, authRes);
    assert.equal(authRes.statusCode, 200);
    assert.equal(authRes.bodyData.authenticated, true);
    assert.equal(authRes.bodyData.user.username, 'testuser');
  });

  await test('POST /api/auth/logout clears session cookie', async () => {
    const { req, res } = createMockReqRes({
      method: 'POST',
      url: '/api/auth/logout',
      query: { action: 'logout' },
    });
    await authHandler(req, res);
    assert.equal(res.statusCode, 200);
    assert.match(res.headers['set-cookie'], /Max-Age=0/);
  });

  // 11. /api/bookings/* (Create, Confirm-Payment, My-Bookings, PNR)
  console.log('\n--- 11. Bookings & Payment Architecture Checks ---');
  const { default: bookingHandler } = await import('./api/bookings/[action].js');

  await test('POST /api/bookings/create rejects unauthenticated request with 401', async () => {
    const { req, res } = createMockReqRes({
      method: 'POST',
      url: '/api/bookings/create',
      query: { action: 'create' },
      body: { trainId: '12951', travelDate: '2026-11-01', travelClass: '3A' },
    });
    await bookingHandler(req, res);
    assert.equal(res.statusCode, 401);
    assert.match(res.bodyData.error, /Authentication required/);
  });

  await test('POST /api/bookings/create sets status strictly to PAYMENT_PENDING', async () => {
    const userCookie = encodeURIComponent(JSON.stringify({ id: 1, username: 'testuser', role: 'user' }));
    const { req, res } = createMockReqRes({
      method: 'POST',
      url: '/api/bookings/create',
      query: { action: 'create' },
      headers: { cookie: `railsim_session=${userCookie}` },
      body: {
        trainId: '12951',
        travelDate: '2026-11-01',
        travelClass: '3A',
        quota: 'GN',
        passengers: [{ name: 'Test Traveler', age: 32, gender: 'M', berth: 'LOWER' }],
      },
    });
    await bookingHandler(req, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.bodyData.success, true);
    assert.equal(res.bodyData.status, 'PAYMENT_PENDING'); // MUST BE PAYMENT_PENDING
    assert.ok(res.bodyData.pnr);
    assert.match(res.bodyData.pnr, /^24\d{8}$/);
    assert.equal(res.bodyData.passengers[0].status, 'HOLD');
  });

  await test('POST /api/bookings/confirm-payment never generates fake transaction ID or confirms ticket', async () => {
    const { req, res } = createMockReqRes({
      method: 'POST',
      url: '/api/bookings/confirm-payment',
      query: { action: 'confirm-payment' },
      body: { method: 'UPI', bookingRef: 'REF-TEST1234' },
    });
    await bookingHandler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.bodyData.status, 'PAYMENT_PENDING'); // CANNOT BE CONFIRMED
    assert.equal(res.bodyData.transactionId, null);       // CANNOT GENERATE FAKE TXN ID
    assert.equal(res.bodyData.verified, false);
    assert.match(res.bodyData.message, /pending gateway webhook confirmation/);
  });

  await test('POST /api/bookings/webhook rejects request without signature or secret with 401', async () => {
    const { req, res } = createMockReqRes({
      method: 'POST',
      url: '/api/bookings/webhook',
      query: { action: 'webhook' },
      body: { bookingRef: 'REF-TEST1234' },
    });
    await bookingHandler(req, res);
    assert.equal(res.statusCode, 401);
    assert.match(res.bodyData.error, /Cryptographically verified gateway signature required/);
  });

  await test('POST /api/bookings/webhook rejects parsed-body re-serialization fallback with 400', async () => {
    const testSecret = 'whsec_test_secret_key_12345';
    process.env.PAYMENT_WEBHOOK_SECRET = testSecret;
    const { req, res } = createMockReqRes({
      method: 'POST',
      url: '/api/bookings/webhook',
      query: { action: 'webhook' },
      headers: { 'x-gateway-signature': 'dummy_sig' },
      body: { bookingRef: 'REF-TEST1234' }, // Object body without rawBody/string
    });
    await bookingHandler(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.bodyData.error, /Unparsed raw request body is required/);
  });

  await test('POST /api/bookings/webhook rejects invalid HMAC signature with 401', async () => {
    const testSecret = 'whsec_test_secret_key_12345';
    process.env.PAYMENT_WEBHOOK_SECRET = testSecret;
    const rawPayload = JSON.stringify({ bookingRef: 'REF-TEST1234', amount: 1210 });
    const { req, res } = createMockReqRes({
      method: 'POST',
      url: '/api/bookings/webhook',
      query: { action: 'webhook' },
      headers: { 'x-gateway-signature': '0000000000000000000000000000000000000000000000000000000000000000' },
      body: rawPayload,
    });
    await bookingHandler(req, res);
    assert.equal(res.statusCode, 401);
    assert.match(res.bodyData.error, /Invalid gateway webhook signature/);
  });

  await test('GET /api/bookings/my-bookings rejects unauthenticated requests with 401', async () => {
    const { req, res } = createMockReqRes({
      method: 'GET',
      url: '/api/bookings/my-bookings',
      query: { action: 'my-bookings' },
    });
    await bookingHandler(req, res);
    assert.equal(res.statusCode, 401);
  });

  await test('POST /api/bookings/cancel rejects unauthenticated requests with 401', async () => {
    const { req, res } = createMockReqRes({
      method: 'POST',
      url: '/api/bookings/cancel',
      query: { action: 'cancel' },
      body: { pnr: '2412345678' },
    });
    await bookingHandler(req, res);
    assert.equal(res.statusCode, 401);
  });

  await test('POST /api/bookings/cancel requires valid PNR and returns CANCELLED status', async () => {
    const userCookie = encodeURIComponent(JSON.stringify({ id: 1, username: 'testuser', role: 'user' }));
    const { req: badReq, res: badRes } = createMockReqRes({
      method: 'POST',
      url: '/api/bookings/cancel',
      query: { action: 'cancel' },
      headers: { cookie: `railsim_session=${userCookie}` },
      body: {},
    });
    await bookingHandler(badReq, badRes);
    assert.equal(badRes.statusCode, 400);

    const { req: goodReq, res: goodRes } = createMockReqRes({
      method: 'POST',
      url: '/api/bookings/cancel',
      query: { action: 'cancel' },
      headers: { cookie: `railsim_session=${userCookie}` },
      body: { pnr: '2412345678' },
    });
    await bookingHandler(goodReq, goodRes);
    assert.equal(goodRes.statusCode, 200);
    assert.equal(goodRes.bodyData.success, true);
    assert.equal(goodRes.bodyData.status, 'CANCELLED');
  });

  await test('GET /api/bookings/pnr/:pnr validates 10-digit format', async () => {
    const { default: pnrHandler } = await import('./api/bookings/pnr/[pnr].js');
    const { req: badReq, res: badRes } = createMockReqRes({
      method: 'GET',
      url: '/api/bookings/pnr/12345',
      query: { pnr: '12345' },
    });
    await pnrHandler(badReq, badRes);
    assert.equal(badRes.statusCode, 400);

    const { req: goodReq, res: goodRes } = createMockReqRes({
      method: 'GET',
      url: '/api/bookings/pnr/2412345678',
      query: { pnr: '2412345678' },
    });
    await pnrHandler(goodReq, goodRes);
    assert.equal(goodRes.statusCode, 200);
    assert.equal(goodRes.bodyData.pnr, '2412345678');
  });

  // 12. Security & Telemetry Endpoints
  console.log('\n--- 12. Behavioral Telemetry & Security Endpoints ---');
  await test('POST /api/telemetry/event accepts keystroke/mouse telemetry', async () => {
    const { default: handler } = await import('./api/telemetry/event.js');
    const { req, res } = createMockReqRes({
      method: 'POST',
      url: '/api/telemetry/event',
      body: { keystrokes: [1, 2, 3], mouse: [10, 20] },
    });
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.bodyData.status, 'received');
  });

  await test('GET /api/security/risk-score returns session risk profile', async () => {
    const { default: handler } = await import('./api/security/risk-score.js');
    const { req, res } = createMockReqRes({ method: 'GET', url: '/api/security/risk-score' });
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(typeof res.bodyData.riskScore, 'number');
    assert.ok(Array.isArray(res.bodyData.explainability));
  });

  await test('POST /api/security/verify-challenge validates pattern answer', async () => {
    const { default: handler } = await import('./api/security/verify-challenge.js');
    // Wrong answer
    const { req: badReq, res: badRes } = createMockReqRes({
      method: 'POST',
      url: '/api/security/verify-challenge',
      body: { answer: 'BUS' },
    });
    await handler(badReq, badRes);
    assert.equal(badRes.statusCode, 400);

    // Correct answer
    const { req: goodReq, res: goodRes } = createMockReqRes({
      method: 'POST',
      url: '/api/security/verify-challenge',
      body: { answer: 'TRAIN' },
    });
    await handler(goodReq, goodRes);
    assert.equal(goodRes.statusCode, 200);
    assert.equal(goodRes.bodyData.success, true);
    assert.equal(goodRes.bodyData.riskScore, 14);
  });

  // 13. Admin Endpoints
  console.log('\n--- 13. Admin Role Authorization Checks ---');
  const { default: adminHandler } = await import('./api/admin/[...slug].js');

  await test('Admin routes reject unauthenticated requests with 403', async () => {
    const { req, res } = createMockReqRes({
      method: 'GET',
      url: '/api/admin/dashboard',
      query: { slug: ['dashboard'] },
    });
    await adminHandler(req, res);
    assert.equal(res.statusCode, 403);
    assert.match(res.bodyData.error, /Administrator/);
  });

  await test('Admin routes reject normal users (role=user) with 403', async () => {
    const userCookie = encodeURIComponent(JSON.stringify({ id: 1, username: 'testuser', role: 'user' }));
    const { req, res } = createMockReqRes({
      method: 'GET',
      url: '/api/admin/dashboard',
      query: { slug: ['dashboard'] },
      headers: { cookie: `railsim_session=${userCookie}` },
    });
    await adminHandler(req, res);
    assert.equal(res.statusCode, 403);
    assert.match(res.bodyData.error, /Administrator/);
  });

  await test('Admin routes accept administrator (role=admin) with 200', async () => {
    const adminCookie = encodeURIComponent(JSON.stringify({ id: 99, username: 'admin', role: 'admin' }));
    const { req, res } = createMockReqRes({
      method: 'GET',
      url: '/api/admin/dashboard',
      query: { slug: ['dashboard'] },
      headers: { cookie: `railsim_session=${adminCookie}` },
    });
    await adminHandler(req, res);
    assert.equal(res.statusCode, 200);
    assert.ok(res.bodyData.totalUsers !== undefined);
    assert.ok(res.bodyData.activeSessionsCount !== undefined);
  });

  console.log('\n===============================================================');
  const passedCount = testResults.filter(t => t.passed).length;
  const failedCount = testResults.filter(t => !t.passed).length;
  console.log(`TOTAL TESTS: ${testResults.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log('===============================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests();
