import { test, expect } from '@playwright/test';

test.describe('FIFA Pulse - End-to-End Operational Workflows', () => {

  test('Protected route access should redirect unauthenticated users to login', async ({ page }) => {
    // 1. Visit protected route directly
    await page.goto('/dashboard');

    // 2. Expect a redirect back to /login
    await expect(page).toHaveURL(/.*login/);
    
    // 3. Confirm login terminal branding is visible
    await expect(page.locator('h1')).toContainText('FIFA PULSE AI');
  });

  test('User signup workflow on Login screen', async ({ page }) => {
    await page.goto('/login');

    // 1. Click on the signup tab
    const signupTab = page.locator('#signup-tab');
    await expect(signupTab).toBeVisible();
    await signupTab.click();

    // 2. Verify signup fields are visible
    await expect(page.locator('#signup-name')).toBeVisible();
    await expect(page.locator('#signup-email')).toBeVisible();
    await expect(page.locator('#signup-password')).toBeVisible();
    await expect(page.locator('#signup-role')).toBeVisible();

    // 3. Fill in the signup details
    await page.fill('#signup-name', 'Elena Rostova');
    await page.fill('#signup-email', 'elena.rostova@fifapulse.ai');
    await page.fill('#signup-password', 'securepass123');
    await page.selectOption('#signup-role', 'admin');

    // 4. Submit the signup form
    const signupSubmit = page.locator('#signup-submit');
    await signupSubmit.click();

    // 5. Verify registration success message and auto-switch back to login
    const successMsg = page.locator('#signup-success-message');
    await expect(successMsg).toBeVisible();
    await expect(successMsg).toContainText('Registration successful');

    // 6. Confirm we are switched back to login mode and email is pre-filled
    await expect(page.locator('#login-tab')).toHaveClass(/border-sky-500/);
    await expect(page.locator('#login-email')).toHaveValue('elena.rostova@fifapulse.ai');
  });

  test('User login and session entry workflow', async ({ page }) => {
    await page.goto('/login');

    // 1. Use existing quick portal to login securely as admin/ops
    const quickPortalOpsButton = page.locator('button:has-text("operations")');
    await expect(quickPortalOpsButton).toBeVisible();
    await quickPortalOpsButton.click();

    // 2. Expect redirect to dashboard upon successful session assignment
    await expect(page).toHaveURL(/.*dashboard/);

    // 3. Confirm Command Center header is displayed
    await expect(page.locator('h2')).toContainText('TACTICAL CONTROL COMMAND CENTER');
  });

  test('AI Assistant page chat workflow & directive execution', async ({ page }) => {
    // Log in first
    await page.goto('/login');
    await page.locator('button:has-text("operations")').click();
    await expect(page).toHaveURL(/.*dashboard/);

    // 1. Navigate to AI Assistant page
    const aiTab = page.locator('Link:has-text("AI Assistant")');
    await expect(aiTab).toBeVisible();
    await aiTab.click();
    await expect(page).toHaveURL(/.*ai-assistant/);

    // 2. Verify AI Copilot is active and has initial greeting
    await expect(page.locator('h3:has-text("GenAI Command Copilot")')).toBeVisible();
    await expect(page.locator('text=FIFA Pulse Operations Intelligence Officer')).toBeVisible();

    // 3. Type a command in the operational copilot
    const chatInput = page.locator('#ai-chat-input');
    await expect(chatInput).toBeVisible();
    await page.fill('#ai-chat-input', 'Verify parking zone G congestion levels.');

    // 4. Send chat message
    const chatSubmit = page.locator('#ai-chat-submit');
    await chatSubmit.click();

    // 5. Check if user message is added to conversation feed
    await expect(page.locator('text=Verify parking zone G congestion levels.')).toBeVisible();

    // 6. Test applying active directives if they are visible
    const applyButton = page.locator('button:has-text("Apply Action Plan")').first();
    if (await applyButton.isVisible()) {
      await applyButton.click();
      await expect(page.locator('text=DEPLOYED')).toBeVisible();
    }
  });

  test('Match Day Simulator workflow execution', async ({ page }) => {
    // Log in first
    await page.goto('/login');
    await page.locator('button:has-text("operations")').click();
    await expect(page).toHaveURL(/.*dashboard/);

    // 1. Navigate to Match Simulator page
    const simulatorTab = page.locator('Link:has-text("Match Simulator")');
    await expect(simulatorTab).toBeVisible();
    await simulatorTab.click();
    await expect(page).toHaveURL(/.*simulator/);

    // 2. Verify the simulator workspace is active
    await expect(page.locator('h3:has-text("Simulation Controller")')).toBeVisible();

    // 3. Select a scenario
    await page.selectOption('#scenario-type', 'weather_disruption');

    // 4. Click Execute Intel Drill
    const executeBtn = page.locator('#execute-drill-btn');
    await expect(executeBtn).toBeVisible();
    await executeBtn.click();

    // 5. Verify the simulation running feedback is shown
    await expect(executeBtn).toBeDisabled();

    // 6. Wait for simulation to finish and display success findings board
    const boardTitle = page.locator('h3:has-text("Drill Operations Intelligence Board")');
    await expect(boardTitle).toBeVisible();
    await expect(page.locator('text=EXECUTION SUCCESS')).toBeVisible();
  });

  test('Logistics & Maps loading and fallback renderer verification', async ({ page }) => {
    // Log in first
    await page.goto('/login');
    await page.locator('button:has-text("operations")').click();
    await expect(page).toHaveURL(/.*dashboard/);

    // 1. Navigate to Logistics page
    const logisticsTab = page.locator('Link:has-text("Logistics & Navigation")');
    await expect(logisticsTab).toBeVisible();
    await logisticsTab.click();
    await expect(page).toHaveURL(/.*logistics/);

    // 2. Verify logistics page main headings are visible
    await expect(page.locator('h2:has-text("Logistics & Navigation Center")')).toBeVisible();

    // 3. Confirm map elements or fallbacks are rendering
    const fieldText = page.locator('text=FIFA FIELD');
    const secureZoneText = page.locator('text=SECURE ZONE');
    await expect(fieldText.first().or(secureZoneText.first())).toBeVisible();
  });

});
