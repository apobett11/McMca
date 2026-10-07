import { chromium } from 'playwright';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

async function runTest() {
  console.log(`Starting Help Desk Normal Day Playwright Test on ${BASE_URL}...`);

  const launchOptions = { headless: true };
  const browser = await chromium.launch(launchOptions).catch(async () => {
    return chromium.launch({ ...launchOptions, channel: 'msedge' });
  }).catch(async () => {
    return chromium.launch({ ...launchOptions, channel: 'chrome' });
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();
  const consoleErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    console.error('PAGE ERROR ENCOUNTERED:', err.message);
    consoleErrors.push(err.message);
  });

  async function navigateMenu(targetHash) {
    await page.click('.header-icon-btn--hamburger');
    await page.waitForTimeout(300);
    await page.click(`.slide-menu a[href="${targetHash}"]`);
    await page.waitForTimeout(800);
  }

  try {
    // -------------------------------------------------------------
    // STEP 1: HOMEPAGE (Landing page)
    // -------------------------------------------------------------
    console.log('1. Testing Help Desk Homepage...');
    await page.goto(`${BASE_URL}/#/helpdesk/dashboard`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1000);

    // Verify header branding
    const headerTitle = await page.locator('.site-header__page-title').innerText();
    console.log(`   Header Page Title: "${headerTitle}"`);
    if (!headerTitle.includes('Help Desk Home')) {
      throw new Error(`Expected header title to include "Help Desk Home", got "${headerTitle}"`);
    }

    // Verify Officer Identity Hero
    const heroTitle = await page.locator('.student-hero__title').innerText();
    console.log(`   Hero Title: "${heroTitle}"`);
    const readinessLabel = await page.locator('.student-hero__readiness-label').innerText();
    console.log(`   Readiness Label: "${readinessLabel}"`);

    // Verify 3 Progress Ranges
    const rangeLabels = await page.locator('.dash-strip-card__label').allInnerTexts();
    console.log(`   Range Labels found (${rangeLabels.length}):`, rangeLabels);
    if (rangeLabels.length < 3) {
      throw new Error(`Expected at least 3 analytics range strips, found ${rangeLabels.length}`);
    }

    // Check pass/fail ratio text
    const ratioFoot = await page.locator('.dash-strip-card__foot').first().innerText();
    console.log(`   Range 1 foot: "${ratioFoot}"`);

    // -------------------------------------------------------------
    // STEP 2: DOCUMENTS PAGE & SUBPAGES
    // -------------------------------------------------------------
    console.log('2. Testing Documents Page & Subpages...');
    await page.click('a[href="#/helpdesk/documents"]');
    await page.waitForTimeout(800);

    const docPageTitle = await page.locator('.site-header__page-title').innerText();
    console.log(`   Documents Page Header: "${docPageTitle}"`);

    // Check overview cards
    const overviewHead = await page.locator('.stitch-section-title').innerText();
    console.log(`   Overview Head: "${overviewHead}"`);

    // Test Subpage 1: Open Step Progress Table
    console.log('   Opening Step Progress Table sub-page...');
    await page.click('button:has-text("Open Step Progress Table (Sub-page)")');
    await page.waitForTimeout(600);

    // Verify subpage loaded with X cancel button
    const stepSubpageTitle = await page.locator('.table-subpage__header h2').innerText();
    console.log(`   Subpage Title: "${stepSubpageTitle}"`);
    if (!stepSubpageTitle.includes('Applicant Step Progress')) {
      throw new Error(`Expected subpage title "Applicant Step Progress Table", got "${stepSubpageTitle}"`);
    }

    const stepCloseBtn = page.locator('button[aria-label="Close sub-page table and return to overview"]');
    const hasStepCloseBtn = await stepCloseBtn.isVisible();
    console.log(`   Has prominent X Cancel / Close Button: ${hasStepCloseBtn}`);
    if (!hasStepCloseBtn) {
      throw new Error('Prominent X Close Sub-page button is missing!');
    }

    // Test location filter on Subpage: select "Tendeno"
    console.log('   Testing pre-determined location filter (Tendeno)...');
    await page.selectOption('#step-loc-sel', 'Tendeno');
    await page.waitForTimeout(400);
    const tendenoRows = await page.locator('.data-table tbody tr').count();
    console.log(`   Tendeno rows found: ${tendenoRows}`);

    // Test sorting by level reached
    await page.selectOption('#step-sort-sel', 'stepsCount');
    await page.waitForTimeout(400);

    // Remind applicant with hanging steps
    const remindBtn = page.locator('.data-table tbody button:has-text("Remind")').first();
    if (await remindBtn.isVisible()) {
      console.log('   Clicking Remind on applicant with hanging steps...');
      await remindBtn.click();
      await page.waitForTimeout(400);
      const noticeText = await page.locator('.notice').innerText();
      console.log(`   Feedback: "${noticeText}"`);
    }

    // Close Subpage using the prominent X button
    console.log('   Closing Step Progress sub-page with X Cancel button...');
    await stepCloseBtn.click();
    await page.waitForTimeout(500);

    // Verify we returned to overview
    const isStepTableClosed = await page.locator('.table-subpage').count() === 0;
    console.log(`   Sub-page closed successfully: ${isStepTableClosed}`);
    if (!isStepTableClosed) {
      throw new Error('Sub-page did not close when clicking X Cancel button!');
    }

    // Test Subpage 2: Open Failed Uploads Table
    console.log('   Opening Failed Uploads Table sub-page...');
    await page.click('button:has-text("Open Failed Uploads Table (Sub-page)")');
    await page.waitForTimeout(600);

    const uploadSubpageTitle = await page.locator('.table-subpage__header h2').innerText();
    console.log(`   Subpage Title: "${uploadSubpageTitle}"`);
    const uploadCloseBtn = page.locator('button[aria-label="Close sub-page table and return to overview"]');
    if (!(await uploadCloseBtn.isVisible())) {
      throw new Error('X Close button missing in Failed Uploads subpage!');
    }

    // Verify failure reasons exist in table
    const failureReasonSample = await page.locator('.data-table tbody tr td:nth-child(5)').first().innerText();
    console.log(`   Sample failure reason: "${failureReasonSample.slice(0, 60)}..."`);

    // Request re-upload action
    const reqBtn = page.locator('.data-table tbody button:has-text("Request Re-upload")').first();
    if (await reqBtn.isVisible()) {
      await reqBtn.click();
      await page.waitForTimeout(400);
      console.log('   Re-upload request dispatched successfully.');
    }

    // Close Failed Uploads subpage using X button
    await uploadCloseBtn.click();
    await page.waitForTimeout(500);

    // Test Mass Messaging
    console.log('   Testing Mass Messaging to Incomplete Applicants...');
    await page.click('button:has-text("Send Mass Messages")');
    await page.waitForTimeout(500);
    const modalVisible = await page.locator('.modal-panel').isVisible();
    console.log(`   Mass Message modal open: ${modalVisible}`);

    // Click template button "Hanging Steps" inside modal
    await page.locator('.modal-panel button:has-text("Hanging Steps")').click();
    await page.waitForTimeout(300);

    // Submit mass broadcast
    await page.locator('.modal-panel button:has-text("Dispatch Mass Message")').click();
    await page.waitForTimeout(800);
    const massFeedback = await page.locator('.notice').innerText();
    console.log(`   Mass broadcast result: "${massFeedback}"`);

    // -------------------------------------------------------------
    // STEP 3: APPLICATIONS PAGE & PRE-APPEAL ASSESSMENT
    // -------------------------------------------------------------
    console.log('3. Testing Applications Page & Pre-appeal Assessment...');
    await navigateMenu('#/helpdesk/applications');

    // Verify Pass vs Fail Overview and Location Distribution
    const appHeadTitle = await page.locator('.stitch-section-title').innerText();
    console.log(`   Applications Page Head: "${appHeadTitle}"`);

    // Check pre-determined location breakdown cards
    const locCards = await page.locator('.dash-apps-footer-note').isVisible();
    console.log(`   Location distribution verified: ${locCards}`);

    // Open Assessment Queue subpage
    console.log('   Opening Applications Assessment Queue sub-page...');
    await page.click('button:has-text("Open Assessment Queue")');
    await page.waitForTimeout(600);

    const appSubpageTitle = await page.locator('.table-subpage__header h2').innerText();
    console.log(`   Subpage Title: "${appSubpageTitle}"`);
    const appCloseBtn = page.locator('button[aria-label="Close sub-page table and return to overview"]');
    if (!(await appCloseBtn.isVisible())) {
      throw new Error('X Close button missing in Applications subpage!');
    }

    // Filter by Failed status
    console.log('   Filtering by Failed status...');
    await page.click('button:has-text("Filter Failed")');
    await page.waitForTimeout(400);

    // Verify Chief failure reasons are shown
    const chiefReasonText = await page.locator('.data-table tbody tr td:nth-child(6)').first().innerText();
    console.log(`   Sample Chief failure reason: "${chiefReasonText.slice(0, 70)}..."`);

    // Proceed a failed application directly to MCA
    console.log('   Testing "Proceed to MCA Direct"...');
    const proceedBtn = page.locator('button:has-text("Proceed to MCA Direct")').first();
    await proceedBtn.click();
    await page.waitForTimeout(500);

    const proceedModalVisible = await page.locator('.modal-panel').isVisible();
    console.log(`   Proceed modal open: ${proceedModalVisible}`);

    // Fill override note and confirm
    await page.fill('#proceed-notes', 'Verified tenancy lease proving Spring Valley residency. Granted pre-appeal override to MCA Direct.');
    await page.click('button:has-text("Confirm & Send to MCA Direct")');
    await page.waitForTimeout(600);

    const proceedFeedback = await page.locator('.notice').innerText();
    console.log(`   Proceed feedback: "${proceedFeedback}"`);

    // Verify updated status badge by switching to Proceeded to MCA Direct filter
    await page.selectOption('#app-status-sel', 'Proceeded to MCA Direct');
    await page.waitForTimeout(400);
    const mcaBadge = await page.locator('.badge:has-text("Forwarded to MCA")').first().isVisible();
    console.log(`   Forwarded to MCA badge confirmed: ${mcaBadge}`);

    // Switch to Rejected to test Contact
    await page.selectOption('#app-status-sel', 'Rejected');
    await page.waitForTimeout(400);

    // Test Contact Student / Parent
    console.log('   Testing "Contact Parent/Student"...');
    const contactBtn = page.locator('button:has-text("Contact Parent/Student")').first();
    await contactBtn.click();
    await page.waitForTimeout(500);
    await page.click('button:has-text("Send Notification")');
    await page.waitForTimeout(600);
    console.log('   Contact notification dispatched.');

    // Close Subpage with X button
    console.log('   Closing Applications sub-page with X Cancel button...');
    await appCloseBtn.click();
    await page.waitForTimeout(500);
    const isAppTableClosed = await page.locator('.table-subpage').count() === 0;
    console.log(`   Sub-page closed: ${isAppTableClosed}`);

    // -------------------------------------------------------------
    // STEP 4: MESSAGES PAGE & MANAGING TEXTS
    // -------------------------------------------------------------
    console.log('4. Testing Messages Page & Text Management...');
    await navigateMenu('#/helpdesk/messages');

    // Verify analytics by destination
    const msgHeadTitle = await page.locator('.stitch-section-title').innerText();
    console.log(`   Messages Page Head: "${msgHeadTitle}"`);
    const hasDeskBtn = await page.locator('button:has-text("Manage Desk Texts")').isVisible();
    console.log(`   Has Desk Manage Button: ${hasDeskBtn}`);

    // Open Messages Desk subpage
    console.log('   Opening Messages Management Desk sub-page...');
    await page.click('button:has-text("Open Messages Desk")');
    await page.waitForTimeout(600);

    const msgSubpageTitle = await page.locator('.table-subpage__header h2').innerText();
    console.log(`   Subpage Title: "${msgSubpageTitle}"`);
    const msgCloseBtn = page.locator('button[aria-label="Close sub-page table and return to overview"]');
    if (!(await msgCloseBtn.isVisible())) {
      throw new Error('X Close button missing in Messages Desk subpage!');
    }

    // Select first message and reply
    console.log('   Replying to applicant message...');
    await page.fill('#desk-reply-input', 'Thank you for reaching out to the Help Desk. Your documents have been re-verified.');
    await page.click('button:has-text("Send Official Reply")');
    await page.waitForTimeout(600);

    const msgReplyFeedback = await page.locator('.notice').innerText();
    console.log(`   Reply dispatched: "${msgReplyFeedback}"`);

    // Close Messages Desk with X button
    await msgCloseBtn.click();
    await page.waitForTimeout(500);

    // Open Messages Analytics Table subpage
    console.log('   Opening Messages Analytics Table sub-page...');
    await page.click('button:has-text("Open Full Analytics Table (Sub-page)")');
    await page.waitForTimeout(600);

    const analyticsSubpageTitle = await page.locator('.table-subpage__header h2').innerText();
    console.log(`   Subpage Title: "${analyticsSubpageTitle}"`);

    const analyticsCloseBtn = page.locator('button[aria-label="Close sub-page table and return to overview"]');
    await analyticsCloseBtn.click();
    await page.waitForTimeout(500);
    console.log('   Analytics Table sub-page closed.');

    // -------------------------------------------------------------
    // STEP 5: PROFILE PAGE & SETTINGS
    // -------------------------------------------------------------
    console.log('5. Testing Profile Page & Settings...');
    await navigateMenu('#/helpdesk/profile');

    // Verify profile identity card
    const profileHeading = await page.locator('.officer-identity-name').innerText();
    console.log(`   Profile Heading: "${profileHeading}"`);

    // Update settings
    console.log('   Updating staff name and phone...');
    await page.fill('#prof-name', 'Clara Chelangat Rotich');
    await page.fill('#prof-phone', '0711 998 877');

    // Submit form
    await page.click('button:has-text("Save Profile Settings")');
    await page.waitForTimeout(800);

    const profileFeedback = await page.locator('.notice').innerText();
    console.log(`   Save feedback: "${profileFeedback}"`);

    // Verify updated officer identity name
    const updatedHeading = await page.locator('.officer-identity-name').innerText();
    console.log(`   Updated Officer Name: "${updatedHeading}"`);
    if (!updatedHeading.includes('Clara Chelangat Rotich')) {
      throw new Error(`Profile name not updated, expected "Clara Chelangat Rotich", got "${updatedHeading}"`);
    }

    // -------------------------------------------------------------
    // STEP 6: UI / UX & STYLING AUDIT
    // -------------------------------------------------------------
    console.log('6. Auditing Mobile Responsiveness & Layout...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/#/helpdesk/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    // Open hamburger menu
    await page.click('button[aria-label="Open navigation menu"]');
    await page.waitForTimeout(400);
    const menuVisible = await page.locator('.slide-menu--open').isVisible();
    console.log(`   Mobile Slide Menu open: ${menuVisible}`);
    if (!menuVisible) {
      throw new Error('Mobile slide menu did not open!');
    }

    // Close slide menu
    await page.click('.slide-menu__close');
    await page.waitForTimeout(400);

    console.log('--------------------------------------------------');
    console.log(`Total Console Errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.warn('Console Errors encountered:', consoleErrors);
    }
    console.log('Help Desk Normal Day Playwright Test PASSED SUCCESSFUL!');
    console.log('--------------------------------------------------');

    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('TEST FAILED:', err);
    await browser.close();
    process.exit(1);
  }
}

runTest();
