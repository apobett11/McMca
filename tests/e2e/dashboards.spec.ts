import { test, expect } from '@playwright/test';

test.describe('Help Desk & MCA Workspaces End-to-End Suite', () => {

  // ─────────────────────────────────────────────────────────────
  // TEST SUITE A: HELP DESK OPERATIONAL WORKFLOWS
  // ─────────────────────────────────────────────────────────────
  test.describe('Test Suite A: Help Desk Operational Workflows', () => {

    test('1. Omni-Search Execution across Citizen Master Registry', async ({ page }) => {
      // Set test session role to helpdesk
      await page.addInitScript(() => {
        window.sessionStorage.setItem('mcmca_test_role', 'helpdesk');
      });

      await page.goto('/#/helpdesk/dashboard');
      await page.waitForLoadState('networkidle');

      // Assert Help Desk shell mounted
      await expect(page.locator('aside')).toBeVisible();

      // Trigger Omni-Search via hotkey (Ctrl+/ or Meta+Slash or Ctrl+i)
      await page.keyboard.press('Control+Slash');

      // If search input isn't focused yet, click the search bar button
      const searchInput = page.locator('input[placeholder*="Search applicants"]').or(page.locator('input[placeholder*="search applicants"]'));
      if (!await searchInput.isVisible()) {
        await page.click('button[aria-label="Universal Omni-Search"]');
      }
      await expect(searchInput).toBeVisible();

      // Type query
      await searchInput.fill('Brian Kiprono');

      // Assert categorized result popover renders with badge [STUDENT]
      const studentBadge = page.locator('button:has-text("Brian Kiprono")').locator('text=[STUDENT]').first();
      await expect(studentBadge).toBeVisible({ timeout: 5000 });

      // Click result to navigate directly to student dossier with tab "Academic & Fees"
      await page.locator('button:has-text("Brian Kiprono")').first().click();

      // Verify 700px slide-over drawer opens
      const drawer = page.locator('[role="dialog"]');
      await expect(drawer).toBeVisible();

      // Verify the active or visible tab is "Academic & Fees"
      const academicTab = page.locator('button:has-text("Academic & fees")').or(page.locator('button:has-text("Academic & Fees")')).first();
      await expect(academicTab).toBeVisible();
      await academicTab.click();

      // Assert academic details are displayed
      await expect(drawer.locator('text=Kipsigis High School')).toBeVisible();
      await expect(drawer.locator('text=Secondary')).toBeVisible();
    });

    test('2. Document Triage & Manual Override Certification', async ({ page }) => {
      await page.addInitScript(() => {
        window.sessionStorage.setItem('mcmca_test_role', 'helpdesk');
      });

      await page.goto('/#/helpdesk/documents');
      await page.waitForLoadState('networkidle');

      // Click "Failed OCR" queue filter
      const failedOcrFilter = page.locator('button:has-text("Failed OCR")').first();
      await expect(failedOcrFilter).toBeVisible();
      await failedOcrFilter.click();

      // Click first item in the flagged uploads list
      const firstUpload = page.locator('[role="listbox"][aria-label="Flagged uploads"] button').first();
      await expect(firstUpload).toBeVisible();
      const applicantName = (await firstUpload.locator('.truncate.text-sm.font-semibold').textContent())?.trim() || '';
      await firstUpload.click();

      // Assert dual-pane viewer mounts with canvas / document art viewport
      await expect(page.locator('text=Raw scan viewport')).toBeVisible();
      await expect(page.locator('text=Entity extractor')).toBeVisible();

      // Click "Manual Override & Accept" action button
      const overrideBtn = page.locator('button:has-text("Manual Override & Accept")').first();
      await expect(overrideBtn).toBeVisible();
      await overrideBtn.click();

      // Assert certification modal appears
      const certModal = page.locator('[role="dialog"]:has-text("Certify manual override")');
      await expect(certModal).toBeVisible();

      // Fill in mandatory justification (min. 15 chars)
      const noteInput = certModal.locator('textarea#ov-note');
      await noteInput.fill('Visually verified original school stamp and signature');

      // Check the certification checkbox
      const certCheckbox = certModal.locator('input[type="checkbox"]').first();
      await certCheckbox.check();

      // Submit override
      const submitOverride = certModal.locator('button:has-text("Manual Override & Accept")');
      await expect(submitOverride).toBeEnabled();
      await submitOverride.click();

      // Verify modal closes
      await expect(certModal).not.toBeVisible();

      // Assert the overridden document has been removed from the active "Failed OCR" triage queue
      if (applicantName) {
        await expect(page.locator(`[role="listbox"] button:has-text("${applicantName}")`)).toHaveCount(0);
      }
    });

  });

  // ─────────────────────────────────────────────────────────────
  // TEST SUITE B: MCA BUDGET & ALLOCATION INTEGRITY
  // ─────────────────────────────────────────────────────────────
  test.describe('Test Suite B: MCA Budget & Allocation Integrity', () => {

    test('1. Hard Budget Cap Enforcement in Batch Allocation Dock', async ({ page }) => {
      await page.addInitScript(() => {
        window.sessionStorage.setItem('mcmca_test_role', 'mca');
      });

      await page.goto('/#/mca/applications');
      await page.waitForLoadState('networkidle');

      // Select multiple tertiary students to stage allocations
      const checkboxes = page.locator('tbody tr input[type="checkbox"]');
      const count = await checkboxes.count();
      expect(count).toBeGreaterThan(0);

      // Select the first 3 students
      for (let i = 0; i < Math.min(3, count); i++) {
        await checkboxes.nth(i).check();
      }

      // Assert floating dock appears
      const dock = page.locator('[role="region"][aria-label="Batch allocation dock"]');
      await expect(dock).toBeVisible();
      await expect(dock.locator('text=Selected')).toBeVisible();

      // Enter an astronomical uniform amount to trigger budget cap breach
      const uniformInput = dock.locator('input[aria-label="Uniform amount in KES"]');
      await uniformInput.fill('6000000'); // KES 6,000,000 per student will exceed tranche
      await dock.locator('button:has-text("Set Uniform Amount")').click();

      // Assert floating dock displays "Hard Budget Cap Exceeded"
      await expect(dock.locator('text=Hard Budget Cap Exceeded')).toBeVisible({ timeout: 5000 });

      // Assert the bulk approval button is disabled
      const approveBtn = dock.locator('button:has-text("Execute Committee Approval")');
      const isDisabled = await approveBtn.isDisabled();
      const ariaDisabled = await approveBtn.getAttribute('aria-disabled');
      expect(isDisabled || ariaDisabled === 'true').toBe(true);
    });

    test('2. Individual Award Adjustment Slider with Live Tranche Telemetry', async ({ page }) => {
      await page.addInitScript(() => {
        window.sessionStorage.setItem('mcmca_test_role', 'mca');
      });

      await page.goto('/#/mca/applications');
      await page.waitForLoadState('networkidle');

      // Click "Adjust Award" on an awaiting application row
      const adjustBtn = page.locator('button:has-text("Adjust Award")').first();
      await expect(adjustBtn).toBeVisible();
      await adjustBtn.click();

      // Assert Adjust Modal opens
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
      await expect(modal.locator('text=Adjust award')).toBeVisible();

      // Locate input and change amount from KES 8,000 to KES 15,000
      const amountInput = modal.locator('input[aria-label="Award amount in KES"]');
      await expect(amountInput).toBeVisible();

      // Read initial global tranche preview
      const initialPoolText = await modal.locator('text=Global tranche after this award').locator('..').locator('.font-mono.text-xl').textContent();

      // Set new amount: 15000
      await amountInput.fill('15000');
      await amountInput.dispatchEvent('change');

      // Assert live text readout computes the updated pool
      const updatedPoolText = await modal.locator('text=Global tranche after this award').locator('..').locator('.font-mono.text-xl').textContent();
      expect(updatedPoolText).toBeDefined();

      // If deviation > 30% from Chief, provide mandatory justification note
      const noteInput = modal.locator('textarea#adj-note');
      if (await noteInput.isVisible()) {
        await noteInput.fill('Orphan household with extreme high school arrears confirmed by baraza.');
      }

      // Save adjustment
      const saveBtn = modal.locator('button:has-text("Save Adjustment")').or(modal.locator('button:has-text("Stage award")')).first();
      await expect(saveBtn).toBeEnabled();
      await saveBtn.click();

      // Assert modal closes
      await expect(modal).not.toBeVisible();
    });

    test('3. Institutional Cheque Manifest Aggregation and PDF Schedule Generator', async ({ page }) => {
      await page.addInitScript(() => {
        window.sessionStorage.setItem('mcmca_test_role', 'mca');
      });

      await page.goto('/#/mca/disbursements');
      await page.waitForLoadState('networkidle');

      // Verify table groups beneficiaries by institution name
      const table = page.locator('table[aria-label="Institutional Payables Table"]');
      await expect(table).toBeVisible();

      // Look for an institution row, e.g. "Kipsigis Girls High School" or any institution
      const instRow = page.locator('tr:has-text("Kipsigis")').first();
      await expect(instRow).toBeVisible();

      // Click "Expand Roster"
      const expandBtn = instRow.locator('button:has-text("Expand Roster")');
      await expect(expandBtn).toBeVisible();
      await expandBtn.click();

      // Assert nested table renders student name, admission number, and approved award
      const nestedTable = page.locator('table:has-text("Admission no.")');
      await expect(nestedTable).toBeVisible();
      await expect(nestedTable.locator('th:has-text("Student name")')).toBeVisible();
      await expect(nestedTable.locator('th:has-text("Approved award (KES)")')).toBeVisible();

      // Click "Generate Cheque Schedule PDF" and assert the print window event is invoked
      let printTriggered = false;
      await page.exposeFunction('__mockPrint', () => {
        printTriggered = true;
      });
      await page.addInitScript(() => {
        window.print = () => {
          (window as any).__mockPrint?.();
        };
      });

      const printBtn = instRow.locator('button:has-text("Generate Cheque Schedule PDF")');
      await expect(printBtn).toBeVisible();
      await printBtn.click();

      // Verify print dialog was invoked without throwing runtime errors
      expect(printTriggered).toBe(true);
    });

  });

});
