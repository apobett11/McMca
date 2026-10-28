import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadDotenv(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
  }
  return env;
}

const env = { ...loadDotenv('.env'), ...loadDotenv('.env.local') };
const url = env.SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const baseUrl = process.env.BASE_URL || 'https://mc-mca.vercel.app';

// Create a dummy image for testing ID upload
const dummyImgPath = path.resolve('scratch_test_id.png');
// 1x1 transparent PNG buffer
const dummyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
fs.writeFileSync(dummyImgPath, dummyPng);

async function cleanupUser(email, nationalId) {
  try {
    const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const u = users?.users?.find(x => x.email?.toLowerCase() === email.toLowerCase());
    if (u) {
      await admin.from('student_profiles').delete().eq('auth_user_id', u.id);
      await admin.from('parent_profiles').delete().eq('auth_user_id', u.id);
      await admin.from('user_roles').delete().eq('auth_user_id', u.id);
      await admin.auth.admin.deleteUser(u.id);
    }
    if (nationalId) {
      await admin.from('student_profiles').delete().eq('national_id', nationalId);
      await admin.from('parent_profiles').delete().eq('national_id', nationalId);
    }
  } catch (err) {
    console.warn('Cleanup warning:', err.message);
  }
}

async function runTest() {
  console.log(`Starting Playwright Registration Test against: ${baseUrl}`);
  
  const testStudentEmail = `pw_student_${Date.now()}@testmcmca.com`;
  const testStudentId = String(Math.floor(10000000 + Math.random() * 89999999));
  
  console.log(`Test student ID: ${testStudentId}, Email: ${testStudentEmail}`);
  await cleanupUser(testStudentEmail, testStudentId);

  const launchOptions = { headless: true };
  const browser = await chromium.launch(launchOptions).catch(async () => {
    return chromium.launch({ ...launchOptions, channel: 'msedge' });
  }).catch(async () => {
    return chromium.launch({ ...launchOptions, channel: 'chrome' });
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER CONSOLE ERROR:', msg.text());
    }
  });

  try {
    await page.goto(`${baseUrl}/#/register?role=student`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('Opened student register page');

    // Wait for the form to be ready
    await page.waitForSelector('#reg-nationalId', { state: 'visible', timeout: 15000 });

    // Fill in Personal Information
    await page.fill('#reg-nationalId', testStudentId);
    await page.fill('#reg-firstName', 'Playwright');
    await page.fill('#reg-middleName', 'Automated');
    await page.fill('#reg-lastName', 'Tester');
    await page.selectOption('#reg-gender', 'Male');
    await page.fill('#reg-dateOfBirth', '2000-01-15');
    await page.selectOption('#reg-parentStatus', 'both');
    await page.fill('#reg-phone', '0712345678');
    await page.fill('#reg-email', testStudentEmail);
    await page.fill('#reg-password', 'TestPassword123');
    await page.fill('#reg-confirmPassword', 'TestPassword123');
    console.log('Filled form fields');

    // Upload ID front and back
    await page.setInputFiles('#idPhoto', dummyImgPath);
    await page.setInputFiles('#idBack', dummyImgPath);
    console.log('Uploaded ID front and back photos');

    // Click "Create account"
    const createBtn = page.locator('button', { hasText: /Create account/i });
    await createBtn.click();
    console.log('Clicked Create account');

    // Wait for popup modal (either success or error)
    const popupModal = page.locator('[role="dialog"]');
    await popupModal.waitFor({ state: 'visible', timeout: 25000 });

    const modalText = await popupModal.innerText();
    console.log('\n--- POPUP MODAL CONTENT ---');
    console.log(modalText);
    console.log('---------------------------\n');

    if (modalText.includes('Account Created Successfully')) {
      console.log('SUCCESS: Browser registration completed successfully!');
    } else {
      throw new Error(`Registration failed with modal message: ${modalText}`);
    }

    // Dismiss the success modal
    const signInBtn = page.locator('button', { hasText: /Sign In Now/i });
    if (await signInBtn.isVisible()) {
      await signInBtn.click();
      await page.waitForTimeout(500);
    }

    // Verify in database
    const { data: dbUser } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const createdUser = dbUser?.users?.find(u => u.email?.toLowerCase() === testStudentEmail.toLowerCase());
    if (!createdUser) {
      throw new Error('User not found in Supabase auth.users table!');
    }
    console.log(`Database Auth User Verified: UUID = ${createdUser.id}`);

    const { data: roleRow } = await admin.from('user_roles').select('*').eq('auth_user_id', createdUser.id).single();
    if (!roleRow || roleRow.role !== 'student') {
      throw new Error('User role record in user_roles missing or incorrect!');
    }
    console.log(`Database Role Verified: role = ${roleRow.role}, is_active = ${roleRow.is_active}`);

    const { data: profRow } = await admin.from('student_profiles').select('*').eq('auth_user_id', createdUser.id).single();
    if (!profRow || profRow.national_id !== testStudentId) {
      throw new Error('Student profile record missing or incorrect!');
    }
    console.log(`Database Student Profile Verified: id = ${profRow.id}, national_id = ${profRow.national_id}`);
    console.log('>>> Student Registration PASSED! <<<\n');

    // TEST 2: PARENT REGISTRATION
    console.log('Starting Test 2: Parent Registration...');
    const testParentEmail = `pw_parent_${Date.now()}@testmcmca.com`;
    const testParentId = String(Math.floor(10000000 + Math.random() * 89999999));
    await cleanupUser(testParentEmail, testParentId);

    await page.goto(`${baseUrl}/#/register?role=parent`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('Opened parent register page');

    await page.waitForSelector('#reg-nationalId', { state: 'visible', timeout: 15000 });
    await page.fill('#reg-nationalId', testParentId);
    await page.fill('#reg-firstName', 'PlaywrightParent');
    await page.fill('#reg-middleName', 'Guardian');
    await page.fill('#reg-lastName', 'Tester');
    await page.selectOption('#reg-gender', 'Female');
    await page.fill('#reg-dateOfBirth', '1985-06-20');
    await page.fill('#reg-phone', '0722334455');
    await page.fill('#reg-email', testParentEmail);
    await page.fill('#reg-password', 'ParentPassword123');
    await page.fill('#reg-confirmPassword', 'ParentPassword123');
    console.log('Filled parent form fields');

    await page.setInputFiles('#idPhoto', dummyImgPath);
    await page.setInputFiles('#idBack', dummyImgPath);
    console.log('Uploaded parent ID photos');

    const createParentBtn = page.locator('button', { hasText: /Create account/i });
    await createParentBtn.click();
    console.log('Clicked Create account (Parent)');

    const parentModal = page.locator('[role="dialog"]');
    await parentModal.waitFor({ state: 'visible', timeout: 25000 });

    const parentModalText = await parentModal.innerText();
    console.log('\n--- PARENT MODAL CONTENT ---');
    console.log(parentModalText);
    console.log('----------------------------\n');

    if (!parentModalText.includes('Account Created Successfully')) {
      throw new Error(`Parent registration failed: ${parentModalText}`);
    }

    // Verify parent in database
    const { data: dbParentUser } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const createdParentUser = dbParentUser?.users?.find(u => u.email?.toLowerCase() === testParentEmail.toLowerCase());
    if (!createdParentUser) throw new Error('Parent user not found in auth.users!');
    console.log(`Database Auth User Verified (Parent): UUID = ${createdParentUser.id}`);

    const { data: parentRoleRow } = await admin.from('user_roles').select('*').eq('auth_user_id', createdParentUser.id).single();
    if (!parentRoleRow || parentRoleRow.role !== 'parent') throw new Error('Parent role record missing or incorrect!');
    console.log(`Database Role Verified (Parent): role = ${parentRoleRow.role}`);

    const { data: parentProfRow } = await admin.from('parent_profiles').select('*').eq('auth_user_id', createdParentUser.id).single();
    if (!parentProfRow || parentProfRow.national_id !== testParentId) throw new Error('Parent profile missing or incorrect!');
    console.log(`Database Parent Profile Verified: id = ${parentProfRow.id}, national_id = ${parentProfRow.national_id}`);

    console.log('>>> Parent Registration PASSED! <<<\n');
    await cleanupUser(testParentEmail, testParentId);

    console.log('\n>>> ALL PLAYWRIGHT TESTS PASSED! FULL END-TO-END REGISTRATION FOR STUDENT & PARENT IS WORKING! <<<\n');
  } finally {
    await browser.close();
    // Clean up created test user
    console.log('Cleaning up test user from database...');
    await cleanupUser(testStudentEmail, testStudentId);
    if (fs.existsSync(dummyImgPath)) fs.unlinkSync(dummyImgPath);
    console.log('Cleanup done.');
  }
}

runTest().catch(err => {
  console.error('\nFAILED TEST:', err);
  if (fs.existsSync(dummyImgPath)) fs.unlinkSync(dummyImgPath);
  process.exit(1);
});
