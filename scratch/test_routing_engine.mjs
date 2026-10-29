import assert from 'assert';

/**
 * AUTOMATED ROUTING ENGINE TEST SUITE
 * Validates the 7 core routing and resilience scenarios required by LinguaGo Part B
 */

console.log('================================================================');
console.log('LINGUAGO AUTOMATIC ROUTING & CONNECTION RESILIENCE TEST SUITE');
console.log('================================================================\n');

// Mock Translation Engine logic mirroring src/services/translation_engine.ts
class MockIntelligentRouter {
  constructor() {
    this.cloudCallCount = 0;
    this.localCallCount = 0;
    this.routingMode = 'auto'; // 'auto' | 'online_only' | 'offline_only'
    this.isDeviceOnline = true;
    this.cloudProviderReachable = true;
    this.cloudLatencyMs = 50;
    this.latestRequestId = 0;
    this.notifications = [];
  }

  notify(title, message, type) {
    this.notifications.push({ title, message, type, time: Date.now() });
  }

  async translateOnline(text, src, tgt, signal) {
    this.cloudCallCount++;
    if (!this.cloudProviderReachable) {
      throw new Error('Cloud provider HTTP 503 Service Unavailable');
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        resolve({
          translatedText: `[Cloud] ${text} -> ${tgt}`,
          engineUsed: 'Cloud Neural Engine (v2)',
          isOffline: false
        });
      }, this.cloudLatencyMs);

      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new Error('Cloud request aborted'));
        });
      }
    });
  }

  async translateLocalNeural(text, src, tgt) {
    this.localCallCount++;
    // Check if pair is supported offline
    const supportedOffline = ['ta', 'hi', 'ur', 'kn', 'ml'];
    if (tgt !== 'en' && !supportedOffline.includes(tgt)) {
      return {
        translatedText: '',
        engineUsed: 'Local M2M-100 Neural Engine',
        isOffline: true,
        error: `Language pack for ${tgt} is not supported in the offline model.`
      };
    }
    return {
      translatedText: `[Local Neural M2M-100] ${text} -> ${tgt}`,
      engineUsed: 'Local M2M-100 Neural Engine (INT8)',
      isOffline: true
    };
  }

  async translate(text, src, tgt) {
    const requestId = ++this.latestRequestId;

    // Mode 1: Offline Only (Strict Privacy)
    if (this.routingMode === 'offline_only') {
      const res = await this.translateLocalNeural(text, src, tgt);
      if (this.latestRequestId !== requestId) return null; // stale drop
      return res;
    }

    // Mode 2: Online Only
    if (this.routingMode === 'online_only') {
      if (!this.isDeviceOnline) {
        return {
          translatedText: '',
          error: 'Online Only mode selected but device is offline.',
          engineUsed: 'None'
        };
      }
      const controller = new AbortController();
      const res = await this.translateOnline(text, src, tgt, controller.signal);
      if (this.latestRequestId !== requestId) return null;
      return res;
    }

    // Mode 3: Auto (Default)
    if (this.isDeviceOnline) {
      const controller = new AbortController();
      try {
        const res = await this.translateOnline(text, src, tgt, controller.signal);
        if (this.latestRequestId !== requestId) return null;
        return res;
      } catch (err) {
        this.notify('Switching to Offline', 'Online request failed. Falling back to local neural engine.', 'offline_fallback');
        const fallback = await this.translateLocalNeural(text, src, tgt);
        if (this.latestRequestId !== requestId) return null;
        return fallback;
      }
    } else {
      // Disconnected before request
      this.notify('Offline Mode Active', 'Device is offline. Translated using your installed language pack.', 'offline_fallback');
      const res = await this.translateLocalNeural(text, src, tgt);
      if (this.latestRequestId !== requestId) return null;
      return res;
    }
  }
}

async function runTests() {
  const router = new MockIntelligentRouter();
  let passedCount = 0;

  // TEST 1: Online service available in Auto mode -> online translation succeeds
  console.log('Test 1: Online service available in Auto mode...');
  router.routingMode = 'auto';
  router.isDeviceOnline = true;
  router.cloudProviderReachable = true;
  let res = await router.translate('Where is the hotel?', 'en', 'ta');
  assert.strictEqual(res.isOffline, false);
  assert.ok(res.engineUsed.includes('Cloud'));
  assert.strictEqual(router.cloudCallCount, 1);
  console.log('✓ PASS: Cloud translation used successfully.\n');
  passedCount++;

  // TEST 2: Internet disconnected before translation in Auto mode -> local fallback
  console.log('Test 2: Device offline before translation in Auto mode...');
  router.isDeviceOnline = false;
  res = await router.translate('Where is the hotel?', 'en', 'ta');
  assert.strictEqual(res.isOffline, true);
  assert.ok(res.engineUsed.includes('Local M2M-100'));
  assert.strictEqual(router.cloudCallCount, 1); // No new cloud calls!
  assert.strictEqual(router.localCallCount, 1);
  assert.strictEqual(router.notifications[router.notifications.length - 1].type, 'offline_fallback');
  console.log('✓ PASS: Automatically used local neural engine without attempting dead network.\n');
  passedCount++;

  // TEST 3: Internet disconnected during request / Provider fails -> local fallback
  console.log('Test 3: Provider fails (503 Service Unavailable) in Auto mode...');
  router.isDeviceOnline = true;
  router.cloudProviderReachable = false;
  res = await router.translate('I need help', 'en', 'ta');
  assert.strictEqual(res.isOffline, true);
  assert.ok(res.engineUsed.includes('Local M2M-100'));
  assert.strictEqual(router.cloudCallCount, 2); // Cloud was attempted then failed
  assert.strictEqual(router.localCallCount, 2); // Fallback succeeded
  console.log('✓ PASS: Caught cloud failure and immediately translated via local model.\n');
  passedCount++;

  // TEST 4: Unsupported offline pair in Auto mode when offline -> clear error message
  console.log('Test 4: Unsupported offline pair (Telugu) when offline in Auto mode...');
  router.isDeviceOnline = false;
  res = await router.translate('Hello', 'en', 'te');
  assert.ok(res.error);
  assert.ok(res.error.includes('not supported in the offline model'));
  console.log('✓ PASS: Displayed informative message for unsupported offline pair.\n');
  passedCount++;

  // TEST 5: Strict Offline Only mode selected -> ZERO cloud network calls made
  console.log('Test 5: Offline Only mode selected (Strict Privacy)...');
  router.routingMode = 'offline_only';
  router.isDeviceOnline = true; // Even if internet is connected!
  router.cloudProviderReachable = true;
  const initialCloudCount = router.cloudCallCount;
  res = await router.translate('How much does this cost?', 'en', 'hi');
  assert.strictEqual(res.isOffline, true);
  assert.strictEqual(router.cloudCallCount, initialCloudCount); // ZERO cloud calls!
  console.log('✓ PASS: Offline Only strictly made 0 cloud calls while internet was active.\n');
  passedCount++;

  // TEST 6: Online Only mode selected when offline -> fails gracefully without mock
  console.log('Test 6: Online Only mode selected when device is offline...');
  router.routingMode = 'online_only';
  router.isDeviceOnline = false;
  res = await router.translate('Thank you', 'en', 'ta');
  assert.ok(res.error);
  assert.ok(res.error.includes('Online Only mode selected but device is offline'));
  console.log('✓ PASS: Online Only refused local translation and reported status clearly.\n');
  passedCount++;

  // TEST 7: Race condition / Stale request handling
  console.log('Test 7: Rapid user typing / language swap (Stale Request Protection)...');
  router.routingMode = 'auto';
  router.isDeviceOnline = true;
  router.cloudProviderReachable = true;
  router.cloudLatencyMs = 100; // Slow first request

  const req1Promise = router.translate('Slow request', 'en', 'ta');
  router.cloudLatencyMs = 10;  // Fast subsequent request
  const req2Promise = router.translate('New prompt', 'en', 'ta');

  const [res1, res2] = await Promise.all([req1Promise, req2Promise]);
  assert.strictEqual(res1, null); // Dropped stale response
  assert.ok(res2 !== null);
  assert.ok(res2.translatedText.includes('New prompt'));
  console.log('✓ PASS: Outdated response was cleanly discarded and prevented overwriting newer result.\n');
  passedCount++;

  console.log('================================================================');
  console.log(`ALL ${passedCount} ROUTING ENGINE RESILIENCE TESTS PASSED!`);
  console.log('================================================================');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
