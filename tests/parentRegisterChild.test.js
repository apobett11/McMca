/**
 * Playwright End-to-End Test: Parent Registering Child
 *
 * Verifies:
 * 1. Date input behavior: user can complete date input without modal interrupting during entry.
 * 2. 18-year check with 1-year grace period:
 *    - 18 years old (e.g. 18 years and 11 months, age < 19) is ALLOWED without error.
 *    - Age 19 or above triggers restriction modal: "You cannot add a child above the age of 18."
 * 3. Education level in Personal Information:
 *    - University / College -> sets studentClass to 'delegated' (student_type: 'DEL').
 *    - Secondary or Primary School -> sets studentClass to 'custody' (student_type: 'CUS').
 * 4. Actual Registration (not just table insert):
 *    - Student account registered in auth.users with UID.
 *    - Role assigned in user_roles as 'student'.
 *    - Student profile created in student_profiles with matching auth_user_id, student_type, and account_class.
 *    - Parent linked to student in parent_student_links.
 */

import { chromium } from 'playwright';
import { createServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
const env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [k, ...v] = trimmed.split('=');
    if (k && v) {
      env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
}

const supabaseUrl = env.SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('[TEST FATAL] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const TEST_PORT = 5189;
const BASE_URL = `http://localhost:${TEST_PORT}`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function runParentRegisterChildTest() {
  console.log('======================================================================');
  console.log('  PLAYWRIGHT TEST: PARENT REGISTER CHILD WORKFLOW & VERIFICATION      ');
  console.log('======================================================================\n');

  // 1. Launch Vite Server
  console.log(`[1/8] Starting Vite test server on port ${TEST_PORT}...`);
  const viteServer = await createServer({
    configFile: path.resolve(process.cwd(), 'vite.config.js'),
    server: { port: TEST_PORT, strictPort: true }
  });
  await viteServer.listen();
  console.log(`  ✓ Vite server running at ${BASE_URL}`);

  // 2. Prepare Verified Parent Account
  console.log('[2/8] Creating / preparing test parent in database...');
  const testParentId = String(Math.floor(10000000 + Math.random() * 90000000));
  const testParentEmail = `parent.test.${Date.now()}@mcmca.local`;
  const testParentPassword = 'ParentTest@2026!';

  const { data: parentAuth, error: pAuthErr } = await admin.auth.admin.createUser({
    email: testParentEmail,
    password: testParentPassword,
    email_confirm: true,
    user_metadata: {
      role: 'parent',
      first_name: 'Grace',
      last_name: 'Chepkoech',
      national_id: testParentId
    }
  });

  if (pAuthErr) {
    throw new Error('Failed to create test parent auth user: ' + pAuthErr.message);
  }

  const parentAuthUserId = parentAuth.user.id;

  await admin.from('user_roles').upsert({
    auth_user_id: parentAuthUserId,
    role: 'parent',
    is_active: true
  }, { onConflict: 'auth_user_id' });

  const { data: parentProfile, error: pProfErr } = await admin
    .from('parent_profiles')
    .insert({
      auth_user_id: parentAuthUserId,
      first_name: 'Grace',
      middle_name: 'Jepngetich',
      last_name: 'Chepkoech',
      gender: 'Female',
      date_of_birth: '1985-05-12',
      national_id: testParentId,
      email: testParentEmail,
      phone_number: '0712345678',
      account_status: 'active',
      is_active: true,
      national_id_verified: true,
      wizard_completed: {
        household: {
          ward: 'Tendeno',
          constituency: 'Kipkelion West',
          county: 'Kericho',
          childrenInFamily: 3
        }
      }
    })
    .select()
    .single();

  if (pProfErr) {
    throw new Error('Failed to create test parent profile: ' + pProfErr.message);
  }

  // Mark all parent onboarding wizard steps complete so parent dashboard can add children directly
  const parentSteps = ['personal_information', 'family_details', 'home_details'];
  for (const sk of parentSteps) {
    await admin.from('wizard_steps').upsert({
      auth_user_id: parentAuthUserId,
      owner_type: 'parent',
      owner_id: parentProfile.id,
      flow_id: 'dashboard_parent',
      step_key: sk,
      payload: { completed: true },
      completed: true,
      completed_at: new Date().toISOString()
    }, { onConflict: 'owner_type,owner_id,flow_id,step_key' });
  }

  console.log(`  ✓ Test parent created: ${testParentEmail} (Auth UID: ${parentAuthUserId})`);

  // 3. Launch Playwright Browser
  console.log('[3/8] Launching Playwright browser...');
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-sandbox'] });
  } catch {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  }

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', (msg) => console.log('  [Browser]', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.log('  [Browser Uncaught Error]', err.message));

  try {
    // 4. Log in as Parent
    console.log('[4/8] Logging in through Parent portal...');
    await page.goto(`${BASE_URL}/#/login`);
    await page.waitForLoadState('networkidle');

    // Ensure we are on Sign In tab
    const signInTab = page.locator('button:has-text("Sign In")').first();
    if (await signInTab.isVisible()) {
      await signInTab.click();
      await sleep(200);
    }

    await page.fill('input[placeholder*="40112233"], input[placeholder*="email"], input[type="text"]', testParentEmail);
    await page.fill('input[type="password"]', testParentPassword);
    await page.click('form button[type="submit"]');

    // Check for login errors
    await sleep(2000);
    const errorBox = page.locator('div[style*="F87171"], div[style*="239, 68, 68"]').first();
    if (await errorBox.isVisible()) {
      const errText = await errorBox.textContent();
      console.error('  [Login Error Box on Page]:', errText);
      throw new Error('Login failed with error: ' + errText);
    }
    console.log('  Current page URL:', page.url());

    // Wait for redirect to /parent/dashboard in HashRouter
    await page.waitForFunction(() => window.location.hash.includes('parent/dashboard'), null, { timeout: 15000 });
    console.log('  ✓ Parent logged in and arrived on Parent Dashboard');

    // Ensure parent dashboard treats onboarding steps as complete so AddChildModal opens directly
    await page.evaluate(() => {
      sessionStorage.setItem(
        'wizard_completed_dashboard_parent',
        JSON.stringify(['personal_information', 'family_details', 'home_details'])
      );
    });
    await sleep(400);

    // 5. Open "Add a child" Modal
    console.log('[5/8] Opening "Add a child" modal...');
    const addChildBtn = page.locator('button:has-text("Add a child"), a:has-text("Add a child")').first();
    await addChildBtn.waitFor({ state: 'visible', timeout: 8000 });
    await addChildBtn.click();

    const modalTitle = page.locator('#add-child-title, h2:has-text("Add a child")').first();
    await modalTitle.waitFor({ state: 'visible', timeout: 5000 });
    console.log('  ✓ Add a child modal is visible');

    // 6. Test Date Input and 18-Year Grace Period Check
    console.log('[6/8] Testing Date Input and 18-Year Grace Period Check...');

    // Fill Names and Gender
    await page.fill('#child-personal-firstName', 'Brian');
    await page.fill('#child-personal-lastName', 'Kipkemoi');
    await page.selectOption('#child-personal-gender', 'Male');

    // Verify Education Level is in Personal Information
    const levelSelect = page.locator('#child-personal-schoolLevel');
    const isLevelVisible = await levelSelect.isVisible();
    if (!isLevelVisible) {
      throw new Error('Education Level is NOT present in Personal Information step!');
    }
    console.log('  ✓ Education Level field confirmed in Personal Information step');

    // TEST A: Age 19 (Over 18 grace period limit: must trigger age popup)
    const today = new Date();
    const date19 = new Date(today.getFullYear() - 19, today.getMonth(), today.getDate() - 10);
    const date19Str = formatDate(date19);
    console.log(`  -> Testing input with age 19 (${date19Str}) - user enters date...`);

    const dobInput = page.locator('#child-personal-dateOfBirth');
    await dobInput.fill(date19Str);

    // Moving to next input (trigger blur)
    console.log('  -> Moving to next input (blur)...');
    await page.locator('#child-personal-birthCertificateNumber').focus();
    await sleep(400);

    // Verify Age Restriction Modal appeared with frontend copy saying 18 years
    const ageModalTitle = page.locator('#age-restriction-title, h3:has-text("cannot add a child above the age of 18")');
    const isAgeModalShown = await ageModalTitle.isVisible();
    if (!isAgeModalShown) {
      throw new Error('Expected age restriction popup for 19-year-old, but modal did not appear!');
    }
    console.log('  ✓ Age restriction popup correctly triggered for 19-year-old: "You cannot add a child above the age of 18."');

    // Dismiss Age Modal
    await page.locator('button:has-text("Okay")').click();
    await sleep(300);

    // TEST B: Age 18 and 6 months (Within 1-year grace period: MUST BE ALLOWED!)
    const date18AndHalf = new Date(today.getFullYear() - 18, today.getMonth() - 6, 15);
    const date18Str = formatDate(date18AndHalf);
    console.log(`  -> Testing input with age 18 and 6 months (${date18Str}) - user enters date...`);

    await dobInput.fill(date18Str);
    // Move to next input (blur)
    await page.locator('#child-personal-birthCertificateNumber').focus();
    await sleep(400);

    const isAgeModalShownFor18 = await ageModalTitle.isVisible();
    if (isAgeModalShownFor18) {
      throw new Error('Age restriction modal incorrectly blocked an 18-year-old learner within grace period!');
    }
    console.log('  ✓ Age 18 within grace period successfully allowed without error popup!');

    // Fill Birth Certificate Number
    const testBirthCertSecondary = `BC-SEC-${Date.now().toString().slice(-6)}`;
    await page.fill('#child-personal-birthCertificateNumber', testBirthCertSecondary);

    // Select Secondary School (test custody allocation)
    await levelSelect.selectOption('secondary');
    console.log('  -> Selected Education Level: Secondary School');

    // Click Continue to Institution step
    await page.click('button:has-text("Continue")');
    await sleep(500);

    // 7. Step 2: Institution
    console.log('[7/8] Step 2: Institution Details & Account Confirmation...');
    await page.waitForSelector('#child-inst-schoolName, input[name="schoolName"]', { timeout: 5000 });

    await page.fill('#child-inst-schoolName', 'Tendeno Secondary School');
    await page.fill('#child-inst-admissionNumber', 'ADM-2026-001');
    await page.fill('#child-inst-bankBranch', 'Molo Branch');
    await page.fill('#child-inst-bankName', 'Kenya Commercial Bank (KCB)');
    await page.fill('#child-inst-accountNumber', '1138495029');

    await page.click('button:has-text("Continue")');
    await sleep(400);

    // Account confirm popup
    const confirmModal = page.locator('button:has-text("Proceed"), button:has-text("Confirm & proceed")').first();
    if (await confirmModal.isVisible()) {
      await confirmModal.click();
      await sleep(400);
    }

    // 8. Step 3: Documents Upload & Final Registration Submit
    console.log('[8/8] Step 3: Document Upload & Final Child Registration...');
    await page.waitForSelector('#child-birth-cert-upload, input[type="file"]', { timeout: 5000 });

    // Upload dummy birth certificate (PDF)
    const dummyFilePath = path.resolve(process.cwd(), 'tests', 'dummy_birth_cert.pdf');
    fs.writeFileSync(dummyFilePath, '%PDF-1.4 DUMMY OFFICIAL BIRTH CERTIFICATE DATA FOR VERIFICATION');
    await page.setInputFiles('#child-birth-cert-upload', dummyFilePath);
    await sleep(400);

    // Click Save & submit student
    const submitStudentBtn = page.locator('button:has-text("Save & submit student")').first();
    await submitStudentBtn.click();

    // Check for any error or notice
    await sleep(2000);
    const noticeEl = page.locator('.notice, div.notice p, .field__error-msg');
    if (await noticeEl.count() > 0) {
      for (let i = 0; i < await noticeEl.count(); i++) {
        console.log(`  [Notice #${i} on Step 3]:`, await noticeEl.nth(i).textContent());
      }
    }

    // Wait for submission completion: either modal closes onSaved or notice is shown
    await Promise.race([
      page.waitForSelector('#add-child-title', { state: 'hidden', timeout: 15000 }),
      page.waitForSelector('p.field__help:has-text("Student record created")', { timeout: 15000 })
    ]).catch(() => {});
    console.log('  ✓ Child registration submitted successfully via Parent portal UI!');

    // =================================================================
    // DATABASE REGISTRATION INTEGRITY VERIFICATION
    // =================================================================
    console.log('\n>>> VERIFYING ACTUAL REGISTRATION IN SUPABASE (NOT JUST TABLE INSERT)');

    // 1. Verify student_profiles
    const { data: studentRecord, error: sErr } = await admin
      .from('student_profiles')
      .select('*')
      .eq('birth_certificate_number', testBirthCertSecondary)
      .single();

    if (sErr || !studentRecord) {
      throw new Error('student_profiles record not found for: ' + testBirthCertSecondary + ' error: ' + sErr?.message);
    }

    console.log(`  ✓ student_profiles created: id=${studentRecord.id}, name="${studentRecord.first_name} ${studentRecord.last_name}"`);
    console.log(`    - auth_user_id (UID): ${studentRecord.auth_user_id}`);
    console.log(`    - account_class:      ${studentRecord.account_class}`);
    console.log(`    - student_type:       ${studentRecord.student_type}`);
    console.log(`    - parent_created:     ${studentRecord.parent_created}`);

    if (!studentRecord.auth_user_id) {
      throw new Error('Registration failed: student_profiles.auth_user_id is NULL! Child was not registered in users.');
    }
    if (studentRecord.account_class !== 'custody' || studentRecord.student_type !== 'CUS') {
      throw new Error(`Expected Secondary School to be custody / CUS, got account_class=${studentRecord.account_class}, student_type=${studentRecord.student_type}`);
    }

    // 2. Verify auth.users
    const { data: userList } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const authUser = userList?.users?.find(u => u.id === studentRecord.auth_user_id);
    if (!authUser) {
      throw new Error(`Child UID ${studentRecord.auth_user_id} was NOT found in auth.users!`);
    }
    console.log(`  ✓ auth.users record verified: UID=${authUser.id}, email=${authUser.email}, role=${authUser.user_metadata?.role}`);

    // 3. Verify user_roles
    const { data: roleRecord, error: rErr } = await admin
      .from('user_roles')
      .select('*')
      .eq('auth_user_id', studentRecord.auth_user_id)
      .single();

    if (rErr || !roleRecord) {
      throw new Error(`user_roles record not found for student UID: ${studentRecord.auth_user_id}`);
    }
    if (roleRecord.role !== 'student') {
      throw new Error(`Expected user_roles.role to be 'student', got: ${roleRecord.role}`);
    }
    console.log(`  ✓ user_roles record verified: role=${roleRecord.role}, active=${roleRecord.is_active}`);

    // 4. Verify parent_student_links
    const { data: linkRecord, error: lErr } = await admin
      .from('parent_student_links')
      .select('*')
      .eq('student_profile_id', studentRecord.id)
      .eq('parent_auth_user_id', parentAuthUserId)
      .single();

    if (lErr || !linkRecord) {
      throw new Error(`parent_student_links record missing between parent ${parentAuthUserId} and student ${studentRecord.id}`);
    }
    console.log(`  ✓ parent_student_links verified: can_view=${linkRecord.can_view}, can_manage=${linkRecord.can_manage}`);

    // =================================================================
    // VERIFY UNIVERSITY / DELEGATED LEVEL MAPPING
    // =================================================================
    console.log('\n>>> VERIFYING UNIVERSITY LEVEL -> DELEGATED ALLOCATION');
    const testBirthCertUni = `BC-UNI-${Date.now().toString().slice(-6)}`;
    const uniAddRes = await fetch(`${BASE_URL}/api/add-child`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentProfile,
        authUserId: parentAuthUserId,
        personal: {
          firstName: 'Mercy',
          lastName: 'Chebet',
          gender: 'Female',
          dateOfBirth: '2008-01-15',
          schoolLevel: 'university_college',
          birthCertificateNumber: testBirthCertUni
        },
        institution: {
          schoolName: 'Egerton University',
          schoolLevel: 'university_college',
          admissionNumber: 'EG-2026-99',
          bankName: 'Kenya Commercial Bank (KCB)',
          bankBranch: 'Egerton Branch',
          accountNumber: '1102345678'
        },
        household: parentProfile.wizard_completed?.household || {}
      })
    });

    const uniData = await uniAddRes.json();
    if (!uniAddRes.ok || !uniData.ok) {
      throw new Error('Failed to register University child: ' + (uniData.error || uniAddRes.statusText));
    }

    const { data: uniStudent } = await admin
      .from('student_profiles')
      .select('*')
      .eq('birth_certificate_number', testBirthCertUni)
      .single();

    console.log(`  ✓ University student registered: UID=${uniStudent.auth_user_id}`);
    console.log(`    - account_class: ${uniStudent.account_class}`);
    console.log(`    - student_type:  ${uniStudent.student_type}`);
    console.log(`    - delegated_access: ${uniStudent.delegated_access}`);

    if (uniStudent.account_class !== 'delegated' || uniStudent.student_type !== 'DEL' || !uniStudent.delegated_access) {
      throw new Error(`Expected University student to be delegated / DEL, got account_class=${uniStudent.account_class}, student_type=${uniStudent.student_type}`);
    }

    // Clean up temporary dummy file
    try { fs.unlinkSync(dummyFilePath); } catch {}

    console.log('\n======================================================================');
    console.log('  TEST SUCCESS: ALL PARENT REGISTER CHILD CHECKS PASSED 100%          ');
    console.log('======================================================================\n');
  } finally {
    if (browser) await browser.close();
    if (viteServer) await viteServer.close();
  }
}

runParentRegisterChildTest()
  .then(() => {
    console.log('[COMPLETE] Test run finished with code 0.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n[TEST FAILED]', err);
    process.exit(1);
  });
