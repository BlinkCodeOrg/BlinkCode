import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page, request }) => {
  await request.post('/api/debug/command', { data: { command: 'stop' } }).catch(() => {});
  await page.addInitScript(() => {
    localStorage.setItem('blinkcode-onboarding-dismissed', 'true');
    localStorage.setItem('blinkcode-settings', JSON.stringify({ language: 'en' }));
    localStorage.setItem('blinkcode-debug-breakpoints', JSON.stringify({ 'debug.js': [3] }));
  });
  await page.goto('/');
  await page.locator('[data-testid="explorer-tree-row"][data-node-name="debug.js"]').click();
  await page.getByTestId('activity-debug').click();
});

test('uses the BlinkCode debug configuration path and custom picker', async ({ page }) => {
  const response = await page.request.get('/api/debug/configurations');
  expect(response.ok()).toBe(true);
  expect(await response.json()).toMatchObject({
    exists: true,
    path: '.blinkcode/launch.json',
    configurations: [{ name: 'Launch debug.js' }],
  });
  await expect(page.getByTestId('debug-configuration')).toContainText('Launch debug.js');
  await expect(page.getByTestId('debug-panel').locator('select')).toHaveCount(0);
  await page.getByTitle('Create BlinkCode debug configuration').click();
  await expect(page.getByText('Created .blinkcode/launch.json', { exact: true })).toBeVisible();
});

test('evaluates primitives and objects in the paused stack frame', async ({ page }) => {
  await page.getByTestId('debug-start').click();
  await expect(page.locator('.debug-status')).toContainText('paused', { timeout: 15_000 });

  const input = page.getByLabel('Debug console expression');
  await input.fill('value + 5');
  await input.press('Enter');
  await expect(page.locator('.debug-console pre')).toContainText('> value + 5');
  await expect(page.locator('.debug-console pre')).toContainText('7');

  await input.fill('nested');
  await input.press('Enter');
  await expect(page.locator('.debug-console pre')).toContainText('> nested');
  await expect(page.locator('.debug-console pre')).toContainText('Object');

  await input.press('ArrowUp');
  await expect(input).toHaveValue('nested');
  await input.press('ArrowUp');
  await expect(input).toHaveValue('value + 5');
  await input.press('ArrowDown');
  await expect(input).toHaveValue('nested');
  await input.fill('');

  await page.getByTitle('Clear Debug Console').click();
  await expect(page.locator('.debug-console pre')).toBeEmpty();

  await page.getByTitle('Stop').click();
  await expect(input).toBeDisabled();
});

test('shows evaluation errors and recovers on the next expression', async ({ page }) => {
  await page.getByTestId('debug-start').click();
  await expect(page.locator('.debug-status')).toContainText('paused', { timeout: 15_000 });

  const input = page.getByLabel('Debug console expression');
  await input.fill('missingBlinkCodeValue');
  await input.press('Enter');
  await expect(page.locator('.debug-console-error')).toContainText('missingBlinkCodeValue is not defined');

  await input.fill('nested.answer');
  await input.press('Enter');
  await expect(page.locator('.debug-console-error')).toHaveCount(0);
  await expect(page.locator('.debug-console pre')).toContainText('42');
  await page.getByTitle('Stop').click();
});
