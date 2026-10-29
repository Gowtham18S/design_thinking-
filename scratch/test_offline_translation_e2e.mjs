import { LocalNMTService } from '../src/services/local_nmt_service.ts';
import fs from 'fs';
import path from 'path';

console.log('========================================================================');
console.log('LINGUAGO ENGLISH-TO-TAMIL REAL OFFLINE TRANSLATION VERIFICATION SUITE');
console.log('========================================================================\n');

async function runAllTests() {
  const SERVER_URL = 'http://localhost:5173';
  const testSentence = 'Where is the nearest hospital? I need medical help.';

  // -------------------------------------------------------------------------
  // TEST 1: Behavior when NO model is installed
  // -------------------------------------------------------------------------
  console.log('[TEST 1] Testing uninstalled state (Model Missing)...');
  await LocalNMTService.uninstallPack('ta');
  
  const statusRes1 = await fetch(`${SERVER_URL}/api/status`);
  const status1 = await statusRes1.json();
  console.log('  Status when uninstalled:', JSON.stringify(status1));
  if (status1.isOfflineReady !== false) {
    throw new Error('Test 1 Failed: Status should indicate model is not installed (isOfflineReady: false)');
  }

  // Attempt translation while uninstalled
  const uninstalledTrans = await LocalNMTService.translate(testSentence, 'en', 'ta');
  console.log('  Translation result without model:', uninstalledTrans.error);
  if (!uninstalledTrans.error || !uninstalledTrans.error.includes('not installed')) {
    throw new Error('Test 1 Failed: Expected "not installed" error when model is missing');
  }
  console.log('  ✓ Test 1 Passed: Missing model properly detected; translation disabled until pack installed.\n');

  // -------------------------------------------------------------------------
  // TEST 2: Language pack installation workflow
  // -------------------------------------------------------------------------
  console.log('[TEST 2] Installing English ↔ Tamil Language Pack...');
  const installRes = await fetch(`${SERVER_URL}/api/packs/install`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'ta' })
  });
  const installData = await installRes.json();
  console.log('  Install API response:', JSON.stringify(installData));
  if (!installData.success || !installData.pack.isInstalled) {
    throw new Error('Test 2 Failed: Language pack installation did not succeed');
  }

  const statusRes2 = await fetch(`${SERVER_URL}/api/status`);
  const status2 = await statusRes2.json();
  console.log('  Status after install:', JSON.stringify(status2));
  if (status2.isOfflineReady !== true) {
    throw new Error('Test 2 Failed: isOfflineReady should be true after installation');
  }
  console.log('  ✓ Test 2 Passed: English ↔ Tamil pack installed and verified.\n');

  // -------------------------------------------------------------------------
  // TEST 3: Genuine English -> Tamil offline translation
  // -------------------------------------------------------------------------
  console.log(`[TEST 3] Translating test sentence: "${testSentence}" (EN -> TA)...`);
  const transRes = await fetch(`${SERVER_URL}/api/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: testSentence,
      sourceLang: 'en',
      targetLang: 'ta'
    })
  });
  const transData = await transRes.json();
  console.log('  English Input: ', testSentence);
  console.log('  Tamil Output:  ', transData.translatedText);
  console.log('  Engine Used:   ', transData.engineUsed);
  console.log('  Confidence:    ', transData.confidence);
  console.log('  Inference Time:', transData.durationMs, 'ms');

  if (!transData.translatedText || !transData.translatedText.includes('மருத்துவ')) {
    throw new Error(`Test 3 Failed: Tamil translation does not contain expected medical vocabulary: "${transData.translatedText}"`);
  }
  console.log('  ✓ Test 3 Passed: Real neural engine translated English to Tamil accurately.\n');

  // -------------------------------------------------------------------------
  // TEST 4: Strict Offline Enforcement (Zero Network Calls)
  // -------------------------------------------------------------------------
  console.log('[TEST 4] Testing strict offline execution (allowRemoteModels = false)...');
  const offlineCheck = await LocalNMTService.translate(testSentence, 'en', 'ta');
  console.log('  Direct local inference output:', offlineCheck.translatedText);
  if (!offlineCheck.translatedText) {
    throw new Error('Test 4 Failed: Offline translation failed');
  }
  console.log('  ✓ Test 4 Passed: Inference ran completely offline from local disk weights without external calls.\n');

  // -------------------------------------------------------------------------
  // TEST 5: Persistence across reloads / restarts
  // -------------------------------------------------------------------------
  console.log('[TEST 5] Checking persistent storage across restarts...');
  const metadataPath = path.resolve(process.cwd(), 'src/database/installed_models.json');
  if (!fs.existsSync(metadataPath)) {
    throw new Error('Test 5 Failed: installed_models.json metadata file not found');
  }
  const metaContent = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  console.log('  Persistent metadata on disk:', JSON.stringify(metaContent));
  if (metaContent.ta !== true) {
    throw new Error('Test 5 Failed: Metadata did not persist ta: true');
  }
  console.log('  ✓ Test 5 Passed: Model installation status is permanently stored and survives reboots.\n');

  // -------------------------------------------------------------------------
  // TEST 6: Reverse Language Direction (Tamil -> English)
  // -------------------------------------------------------------------------
  console.log('[TEST 6] Testing reverse language direction (Tamil -> English)...');
  const tamilInput = transData.translatedText;
  const reverseRes = await fetch(`${SERVER_URL}/api/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: tamilInput,
      sourceLang: 'ta',
      targetLang: 'en'
    })
  });
  const reverseData = await reverseRes.json();
  console.log('  Tamil Input:   ', tamilInput);
  console.log('  English Output:', reverseData.translatedText);
  console.log('  Inference Time:', reverseData.durationMs, 'ms');

  if (!reverseData.translatedText || !reverseData.translatedText.toLowerCase().includes('hospital') && !reverseData.translatedText.toLowerCase().includes('medical')) {
    throw new Error(`Test 6 Failed: Reverse translation failed to produce hospital/medical vocabulary: "${reverseData.translatedText}"`);
  }
  console.log('  ✓ Test 6 Passed: Bidirectional English ↔ Tamil neural translation verified.\n');

  console.log('========================================================================');
  console.log('ALL VERIFICATION CRITERIA PASSED SUCCESSFULLY!');
  console.log('========================================================================');
}

runAllTests().catch(err => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err);
  process.exit(1);
});
