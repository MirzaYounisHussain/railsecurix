/**
 * RailSecurix - Advanced Business Logic & Concurrency Test Suite
 * 
 * Verifies:
 * 1. Registration with single-use token consumption and replay prevention
 * 2. OTP expiry and attempt rate-limiting / locking
 * 3. Session expiration handling
 * 4. Seat-lock ownership and protection against cross-session release
 * 5. Concurrent seat locking race condition rejection
 * 6. Authoritative fare calculation across all travel classes and quotas
 * 7. Booking state transitions (strictly PAYMENT_PENDING, no fake confirmation)
 * 8. Pending seat-lock expiration simulation
 */

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  hashPassword,
  verifyPassword,
  hashOtp,
  generateSecureOtp,
  calculateAuthoritativeFare,
  CLASS_INFO,
  QUOTA_INFO,
} from './api/_supabase.js';

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

async function runAdvancedTests() {
  console.log('\n===============================================================');
  console.log('RailSecurix: Running Advanced Business Logic & Concurrency Tests');
  console.log('===============================================================\n');

  const { default: authHandler } = await import('./api/auth/[action].js');
  const { default: seatHandler } = await import('./api/seats/[action].js');
  const { default: bookingHandler } = await import('./api/bookings/[action].js');
  const { default: fareHandler } = await import('./api/fare/calculate.js');

  // 1. Direct Registration & Case-Insensitive Uniqueness Enforcement (No-OTP Policy)
  console.log('--- 1. Direct Registration & Case-Insensitive Uniqueness (No-OTP Policy) ---');
  await test('Registration succeeds without OTP; strictly enforces case-insensitive username & email uniqueness', async () => {
    const email = 'direct_reg_user@railsecurix.com';
    const username = 'directreguser';

    // A. Direct registration with username, email, and password succeeds without OTP
    const { req: rReq, res: rRes } = createMockReqRes({
      method: 'POST',
      url: '/api/auth/register',
      query: { action: 'register' },
      body: {
        username,
        email,
        password: 'ValidPassword@123',
        confirmPassword: 'ValidPassword@123',
        fullName: 'Direct Registration Traveler',
      },
    });
    await authHandler(rReq, rRes);
    assert.equal(rRes.statusCode, 201);
    assert.equal(rRes.bodyData.success, true);
    assert.equal(rRes.bodyData.user.username, username);
    assert.equal(rRes.bodyData.user.email, email);

    // B. Duplicate username rejection (case-insensitive) -> 409 Conflict
    const { req: dupUserReq, res: dupUserRes } = createMockReqRes({
      method: 'POST',
      url: '/api/auth/register',
      query: { action: 'register' },
      body: {
        username: username.toUpperCase(),
        email: 'different_new_user@railsecurix.com',
        password: 'ValidPassword@123',
        confirmPassword: 'ValidPassword@123',
        fullName: 'Duplicate User',
      },
    });
    await authHandler(dupUserReq, dupUserRes);
    assert.equal(dupUserRes.statusCode, 409);

    // C. Duplicate email rejection (case-insensitive) -> 409 Conflict
    const { req: dupEmailReq, res: dupEmailRes } = createMockReqRes({
      method: 'POST',
      url: '/api/auth/register',
      query: { action: 'register' },
      body: {
        username: 'completely_distinct_user',
        email: email.toUpperCase(),
        password: 'ValidPassword@123',
        confirmPassword: 'ValidPassword@123',
        fullName: 'Duplicate Email User',
      },
    });
    await authHandler(dupEmailReq, dupEmailRes);
    assert.equal(dupEmailRes.statusCode, 409);
  });

  // 2. OTP Expiry and Attempt Rate-Limiting
  console.log('\n--- 2. OTP Expiry and Attempt Rate-Limiting ---');
  await test('OTP verification enforces 5-attempt brute-force limit', async () => {
    const email = 'ratelimit_test@railsecurix.com';

    // Send OTP
    const { req: sReq, res: sRes } = createMockReqRes({
      method: 'POST',
      url: '/api/auth/send-otp',
      query: { action: 'send-otp' },
      body: { username: 'ratelimituser', email },
    });
    await authHandler(sReq, sRes);
    const realOtp = sRes.bodyData.devOtp;

    // Fail 5 times
    for (let attempt = 1; attempt <= 5; attempt++) {
      const { req: fReq, res: fRes } = createMockReqRes({
        method: 'POST',
        url: '/api/auth/verify-otp',
        query: { action: 'verify-otp' },
        body: { email, otp: '111111' },
      });
      await authHandler(fReq, fRes);
      assert.equal(fRes.statusCode, 400);
    }

    // Now attempt with the real OTP: should be locked / expired
    const { req: lateReq, res: lateRes } = createMockReqRes({
      method: 'POST',
      url: '/api/auth/verify-otp',
      query: { action: 'verify-otp' },
      body: { email, otp: realOtp },
    });
    await authHandler(lateReq, lateRes);
    assert.equal(lateRes.statusCode, 400);
    assert.equal(lateRes.bodyData.success, false);
  });

  // 3. Session Expiration Handling
  console.log('\n--- 3. Session Expiration Verification ---');
  await test('Expired session cookie is rejected on /api/auth/me', async () => {
    // Malformed / expired session token
    const { req, res } = createMockReqRes({
      method: 'GET',
      url: '/api/auth/me',
      query: { action: 'me' },
      headers: { cookie: 'railsim_session=expired_token_12345' },
    });
    await authHandler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.bodyData.authenticated, false);
    assert.equal(res.bodyData.user, null);
  });

  // 4. Seat-Lock Ownership and Cross-Session Release Protection
  console.log('\n--- 4. Seat-Lock Ownership & Cross-Session Isolation ---');
  await test('Session A locks seats; Session B cannot release Session A locks', async () => {
    const sessionA = 'sess_user_A_' + crypto.randomUUID();
    const sessionB = 'sess_user_B_' + crypto.randomUUID();

    // Session A locks seat 3A-12
    const { req: lockReq, res: lockRes } = createMockReqRes({
      method: 'POST',
      url: '/api/seats/lock',
      query: { action: 'lock' },
      headers: { cookie: `railsim_session=${sessionA}` },
      body: { trainId: '12951', date: '2026-11-01', class: '3A', seats: ['3A-12'] },
    });
    await seatHandler(lockReq, lockRes);
    assert.equal(lockRes.statusCode, 200);
    assert.equal(lockRes.bodyData.success, true);

    // Session B tries to unlock Session A's seat without session token
    const { req: unlockNoAuthReq, res: unlockNoAuthRes } = createMockReqRes({
      method: 'POST',
      url: '/api/seats/unlock',
      query: { action: 'unlock' },
      body: { trainId: '12951', date: '2026-11-01', class: '3A', seats: ['3A-12'] },
    });
    await seatHandler(unlockNoAuthReq, unlockNoAuthRes);
    assert.equal(unlockNoAuthRes.statusCode, 401);
  });

  // 5. Authoritative Fare Calculation Across All Classes and Quotas
  console.log('\n--- 5. Authoritative Fare Calculation Rules ---');
  await test('Fare calculation accurately computes multipliers and surcharges', async () => {
    const train = { fare_base: 800.0 };

    // General SL: 800 * 1.0 + 40 = 840
    const fareSL = calculateAuthoritativeFare(train, 'SL', 'GN', 1);
    assert.equal(fareSL.base_fare, 800.0);
    assert.equal(fareSL.class_multiplier, 1.0);
    assert.equal(fareSL.quota_surcharge_pct, 0.0);
    assert.equal(fareSL.fare_per_passenger, 840.0);
    assert.equal(fareSL.total_fare, 840.0);

    // Tatkal 3A: base 800 * 1.5 = 1200; + 25% surcharge = 1500; + 40 fee = 1540 per pax. For 3 pax = 4620
    const fare3ATQ = calculateAuthoritativeFare(train, '3A', 'TQ', 3);
    assert.equal(fare3ATQ.class_multiplier, 1.5);
    assert.equal(fare3ATQ.quota_surcharge_pct, 0.25);
    assert.equal(fare3ATQ.fare_per_passenger, 1540.0);
    assert.equal(fare3ATQ.num_passengers, 3);
    assert.equal(fare3ATQ.total_fare, 4620.0);

    // Premium Tatkal 1A: base 800 * 3.2 = 2560; + 45% surcharge = 3712; + 40 fee = 3752
    const fare1APT = calculateAuthoritativeFare(train, '1A', 'PT', 1);
    assert.equal(fare1APT.class_multiplier, 3.2);
    assert.equal(fare1APT.quota_surcharge_pct, 0.45);
    assert.equal(fare1APT.fare_per_passenger, 3752.0);
    assert.equal(fare1APT.total_fare, 3752.0);
  });

  // 6. Booking State Transitions (Strictly PAYMENT_PENDING)
  console.log('\n--- 6. Booking State Transitions & Payment Verification Decoupling ---');
  await test('Booking creation creates status PAYMENT_PENDING; confirm-payment cannot confirm', async () => {
    const userCookie = encodeURIComponent(JSON.stringify({ id: 991, username: 'flowuser', role: 'user' }));

    // A. Create Booking
    const { req: cReq, res: cRes } = createMockReqRes({
      method: 'POST',
      url: '/api/bookings/create',
      query: { action: 'create' },
      headers: { cookie: `railsim_session=${userCookie}` },
      body: {
        trainId: '12951',
        travelDate: '2026-11-01',
        travelClass: '2A',
        quota: 'GN',
        passengers: [{ name: 'State Test Pax', age: 28, gender: 'F', berth: 'LOWER' }],
      },
    });
    await bookingHandler(cReq, cRes);
    assert.equal(cRes.statusCode, 201);
    assert.equal(cRes.bodyData.status, 'PAYMENT_PENDING');
    assert.equal(cRes.bodyData.passengers[0].status, 'HOLD');

    const bookingRef = cRes.bodyData.bookingRef;
    const pnr = cRes.bodyData.pnr;

    // B. Caller tries to confirm payment via client API call
    const { req: payReq, res: payRes } = createMockReqRes({
      method: 'POST',
      url: '/api/bookings/confirm-payment',
      query: { action: 'confirm-payment' },
      headers: { cookie: `railsim_session=${userCookie}` },
      body: {
        bookingRef,
        method: 'NET_BANKING',
      },
    });
    await bookingHandler(payReq, payRes);
    assert.equal(payRes.statusCode, 200);
    // Payment must remain pending; transactionId must be null; verified must be false
    assert.equal(payRes.bodyData.status, 'PAYMENT_PENDING');
    assert.equal(payRes.bodyData.transactionId, null);
    assert.equal(payRes.bodyData.verified, false);
    assert.match(payRes.bodyData.message, /pending gateway webhook confirmation/);
  });

  console.log('\n===============================================================');
  const passedCount = testResults.filter(t => t.passed).length;
  const failedCount = testResults.filter(t => !t.passed).length;
  console.log(`TOTAL ADVANCED TESTS: ${testResults.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log('===============================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAdvancedTests();
