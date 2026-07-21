import { expect, test } from '@playwright/test';
import { resolve } from 'node:path';

let apiHeaders: Record<string, string>;

test.beforeEach(async ({ page, request }) => {
  const session = await request.post('/api/session', {
    headers: { Origin: 'http://127.0.0.1:5178' },
  });
  const { token } = await session.json();
  apiHeaders = {
    Authorization: `Bearer ${token}`,
    Origin: 'http://127.0.0.1:5178',
  };
  await request.put('/api/state', {
    data: { terminalOpen: false },
    headers: apiHeaders,
  });
  await page.addInitScript(() => {
    localStorage.setItem('blinkcode-onboarding-dismissed', 'true');
    localStorage.setItem(
      'blinkcode-settings',
      JSON.stringify({ language: 'en' }),
    );
  });
  await page.goto('/');
});

async function openIndexFile(page: import('@playwright/test').Page) {
  const indexFile = page.locator(
    '[data-testid="explorer-tree-row"][data-node-name="index.js"]',
  );
  if (!(await indexFile.isVisible())) {
    await page
      .locator('[data-testid="explorer-tree-row"][data-node-name="src"]')
      .click();
  }
  await indexFile.click();
}

test('opens a workspace file from Explorer', async ({ page }) => {
  await expect(page.getByTestId('activity-explorer')).toBeVisible();

  await page
    .locator('[data-testid="explorer-tree-row"][data-node-name="src"]')
    .click();
  await page
    .locator('[data-testid="explorer-tree-row"][data-node-name="index.js"]')
    .click();

  await expect(
    page.getByText('index.js', { exact: true }).first(),
  ).toBeVisible();
  await expect(page.locator('.monaco-editor')).toBeVisible();
});

test('opens workspace images through the authenticated preview', async ({ page }) => {
  await page
    .locator('[data-testid="explorer-tree-row"][data-node-name="pixel.png"]')
    .click();

  const image = page.locator('.preview-image');
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute('src', /^blob:/);
  await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBe(1);
  await expect(page.locator('.preview-error')).toHaveCount(0);
});

test('loads local images inside Markdown preview', async ({ page }) => {
  await page
    .locator('[data-testid="explorer-tree-row"][data-node-name="spellcheck.md"]')
    .click();
  const tab = page.locator('.tab', { hasText: 'spellcheck.md' });
  await tab.click({ button: 'right' });
  await page.getByRole('button', { name: 'Preview' }).click();

  const image = page.locator('.markdown-preview-body img');
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute('src', /^blob:/);
  await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBe(1);
});

test('keeps an empty folder open and offers project creation actions', async ({ page, request }) => {
  const emptyWorkspace = resolve('e2e/fixtures/empty-workspace');
  const defaultWorkspace = resolve('e2e/fixtures/workspace');
  const context = page.context();

  await page.close();
  let emptyPage: import('@playwright/test').Page | undefined;

  try {
    await request.post('/api/open-folder', {
      data: { dirPath: emptyWorkspace },
      headers: apiHeaders,
    });
    await request.put('/api/state', {
      data: { folderClosed: false, workspaceDir: emptyWorkspace },
      headers: apiHeaders,
    });

    emptyPage = await context.newPage();
    await emptyPage.goto('/');

    await expect(emptyPage.getByText('This folder is empty.')).toBeVisible();
    const createFileButton = emptyPage.locator('.sidebar-empty-open-btn', {
      hasText: 'New File',
    });
    await expect(createFileButton).toBeVisible();
    await expect(emptyPage.locator('.sidebar-recent-projects')).toHaveCount(0);
    await createFileButton.click();
    await expect(emptyPage.getByPlaceholder('filename.js')).toBeVisible();
  } finally {
    await emptyPage?.close();
    await request.post('/api/open-folder', {
      data: { dirPath: defaultWorkspace },
      headers: apiHeaders,
    });
    await request.put('/api/state', {
      data: { folderClosed: false, workspaceDir: defaultWorkspace },
      headers: apiHeaders,
    });
  }
});

test('keeps activity bar tools in the expected order', async ({ page }) => {
  const tools = await page
    .locator('.activity-bar-top .activity-btn')
    .evaluateAll((buttons) =>
      buttons.map((button) => button.getAttribute('data-testid')),
    );

  expect(tools).toEqual([
    'activity-explorer',
    'activity-search',
    'activity-source-control',
    'activity-debug',
    'activity-npm-scripts',
  ]);
  await expect(page.getByTestId('activity-extensions')).toHaveCount(0);
  await expect(page.getByTestId('activity-git-hosting')).toHaveCount(0);
});

test('customizes activity tools and pins editor tabs', async ({ page }) => {
  await expect(page.locator('.command-center-main')).toContainText(
    'Quick Open',
  );
  await expect(page.locator('.command-nav, .command-branch')).toHaveCount(0);
  await expect(page.getByLabel('System date and time')).toBeVisible();
  const commandCenter = await page
    .locator('.command-center-main')
    .boundingBox();
  expect(
    Math.abs(
      commandCenter!.x +
        commandCenter!.width / 2 -
        page.viewportSize()!.width / 2,
    ),
  ).toBeLessThan(2);
  await page.getByTestId('activity-npm-scripts').click({ button: 'right' });
  await page.getByRole('menuitemcheckbox', { name: 'Web App Center' }).click();
  await expect(page.getByTestId('activity-npm-scripts')).toHaveCount(0);

  await openIndexFile(page);
  const tab = page.locator('.tab', { hasText: 'index.js' });
  await tab.click({ button: 'right' });
  await page.getByRole('button', { name: 'Pin tab' }).click();
  await expect(tab).toHaveClass(/tab-pinned/);
  await expect(tab.locator('.tab-name')).toBeHidden();

  await page.getByTestId('activity-explorer').click({ button: 'right' });
  await page.getByRole('menuitemcheckbox', { name: 'Web App Center' }).click();
  await expect(page.getByTestId('activity-npm-scripts')).toBeVisible();
});

test('detects root and nested package scripts, filters and runs them', async ({
  page,
}) => {
  await page.getByTestId('activity-npm-scripts').click();
  await expect(page.getByTestId('npm-scripts-panel')).toBeVisible();
  await expect(page.getByTestId('npm-scripts-panel')).toContainText(
    'Web App Center',
  );
  await page.getByRole('button', { name: /Scripts/ }).click();

  const rootPackage = page.locator(
    '[data-testid="npm-package-group"][data-package-directory="."]',
  );
  const nestedPackage = page.locator(
    '[data-testid="npm-package-group"][data-package-directory="packages/client"]',
  );
  await expect(rootPackage).toContainText('verify:panel');
  await expect(nestedPackage).toContainText('nested:check');

  await page.getByTestId('npm-scripts-search').fill('verify:panel');
  await expect(rootPackage).toContainText('verify:panel');
  await expect(nestedPackage).toBeHidden();

  const scriptRow = rootPackage.locator(
    '[data-testid="npm-script-row"][data-script-name="verify:panel"]',
  );
  await scriptRow.getByTestId('npm-script-run').click();

  const terminal = page.locator(
    '[data-testid="terminal-instance"][data-script-key=".:verify:panel"]',
  );
  await expect(terminal).toBeVisible();
  await expect(terminal.locator('.xterm-rows')).toContainText(
    'BLINKCODE_E2E_SCRIPT_OK',
  );
  await expect(terminal).toHaveAttribute('data-terminal-status', 'exited');
});

test('uses the shared shell and animation for left sidebar panels', async ({
  page,
}) => {
  const panels = [
    { trigger: null, selector: '.sidebar' },
    {
      trigger: page.getByRole('button', { name: 'Search' }),
      selector: '.search-panel',
    },
    {
      trigger: page.getByRole('button', { name: 'Source Control' }),
      selector: '.source-control-panel',
    },
    {
      trigger: page.getByTestId('activity-npm-scripts'),
      selector: '.npm-scripts-panel',
    },
    { trigger: page.getByTestId('activity-debug'), selector: '.debug-panel' },
  ];

  for (const item of panels) {
    await item.trigger?.click();
    const panel = page.locator(item.selector);
    await expect(panel).toHaveClass(/ui-sidebar-panel/);
    await expect(panel.locator('.ui-sidebar-panel-header')).toHaveCount(1);
    await expect(panel.locator('.ui-sidebar-resizer')).toHaveCount(1);
    expect(
      await panel.evaluate(
        (element) => getComputedStyle(element).animationName,
      ),
    ).toBe('uiSidebarIn');
  }
});

test('lists and filters project dependencies', async ({ page }) => {
  await page.getByTestId('activity-npm-scripts').click();
  await page.getByTestId('dependencies-tab').click();

  const rootPackage = page.locator(
    '[data-testid="dependency-package"][data-package-directory="."]',
  );
  const nestedPackage = page.locator(
    '[data-testid="dependency-package"][data-package-directory="packages/client"]',
  );
  await expect(rootPackage).toContainText('fixture-runtime');
  await expect(rootPackage).toContainText('fixture-tooling');
  await expect(rootPackage).toContainText('not installed');
  await expect(nestedPackage).toContainText('fixture-client-runtime');
  await expect(
    page.getByTestId('npm-scripts-panel').locator('select'),
  ).toHaveCount(0);

  await page.getByTestId('dependency-search').fill('fixture-tooling');
  await expect(rootPackage.getByTestId('dependency-row')).toHaveCount(1);
  await expect(rootPackage).toContainText('development');

  await page.getByTestId('dependency-search').fill('');
  await page.getByTestId('dependency-type-filter').click();
  await page
    .locator('[role="option"][data-option-value="development"]')
    .click();
  await expect(rootPackage).toContainText('fixture-tooling');
  await expect(rootPackage).not.toContainText('fixture-runtime');
  await expect(nestedPackage).toBeHidden();

  await page.getByTestId('dependency-type-filter').click();
  await page.locator('[role="option"][data-option-value="all"]').click();
  await page.getByTestId('dependency-package-filter').click();
  await page
    .locator('[role="option"][data-option-value="packages/client"]')
    .click();
  await expect(rootPackage).toBeHidden();
  await expect(nestedPackage).toContainText('fixture-client-runtime');
});

test('starts a Node debug session and pauses at a breakpoint', async ({
  page,
}) => {
  await page.evaluate(() => {
    localStorage.setItem(
      'blinkcode-debug-breakpoints',
      JSON.stringify({ 'debug.js': [3] }),
    );
  });
  await page
    .locator('[data-testid="explorer-tree-row"][data-node-name="debug.js"]')
    .click();
  await page.getByTestId('activity-debug').click();
  await expect(page.getByTestId('debug-configuration')).toContainText(
    'Launch debug.js',
  );
  await page.getByTestId('debug-start').click();
  await expect(page.locator('.debug-status')).toContainText('paused', {
    timeout: 15_000,
  });
  await expect(page.locator('.debug-frame').first()).toContainText(
    'debug.js:3',
  );
  await page.getByLabel('Debug console expression').fill('value + 1');
  await page.getByTitle('Evaluate').click();
  await expect(page.locator('.debug-console pre')).toContainText('3');
  await expect(
    page.locator('.debug-toolbar button[title="Restart"]'),
  ).toBeEnabled();
  await page.getByTitle('Stop').click();
});

test('handles an unavailable debugger attach target without command conflicts', async ({
  page,
}) => {
  await page.getByTestId('activity-debug').click();
  const pinToggle = page.getByTestId('debug-pin-toggle').first();
  await expect(pinToggle).toHaveAttribute('aria-label', 'Pin section');
  await pinToggle.click();
  await expect(pinToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(pinToggle).toHaveAttribute('aria-label', 'Unpin section');
  await page
    .locator('.debug-section-head')
    .getByRole('button', { name: 'Attach', exact: true })
    .click();
  await page.getByLabel('Inspector endpoint').fill('127.0.0.1:9');
  await page
    .locator('.debug-attach')
    .getByRole('button', { name: 'Attach' })
    .click();
  await expect(page.locator('.debug-status')).toContainText('failed');
  await expect(page.locator('.debug-error')).toContainText(
    'Cannot reach Inspector',
  );
  await expect(page.getByTitle('Pause')).toBeDisabled();
  await expect(page.getByTitle('Step Over')).toBeDisabled();
});

test('unknown debugger API routes return JSON instead of the app HTML', async ({
  page,
}) => {
  const unauthorized = await page.request.post('/api/debug/not-a-route');
  expect(unauthorized.status()).toBe(401);
  const session = await page.request.post('/api/session', {
    headers: { Origin: 'http://127.0.0.1:5178' },
  });
  const { token } = await session.json();
  const response = await page.request.post('/api/debug/not-a-route', {
    headers: {
      Authorization: `Bearer ${token}`,
      Origin: 'http://127.0.0.1:5178',
    },
  });
  expect(response.status()).toBe(404);
  expect(response.headers()['content-type']).toContain('application/json');
  expect(await response.json()).toMatchObject({
    error: expect.stringContaining('API endpoint not found'),
  });
});

test('sends a request from an HTTP file and shows the response', async ({
  page,
}) => {
  await page
    .locator('[data-testid="explorer-tree-row"][data-node-name="api.http"]')
    .click();
  await page.getByTestId('rest-client-send').click();
  const response = page.getByTestId('rest-client-response');
  await expect(response).toContainText('200 OK');
  await expect(response.locator('pre')).toContainText('"tree"');
});

test('validates and masks secrets in environment files', async ({ page }) => {
  await page
    .locator('[data-testid="explorer-tree-row"][data-node-name=".env"]')
    .click();
  await page.waitForFunction(() =>
    Boolean((window as any).__blinkcodeEditor?.getModel()),
  );

  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as any).__blinkcodeEditor.getModel().getLanguageId(),
      ),
    )
    .toBe('dotenv');
  await expect(page.locator('.env-secret-value')).toHaveCount(3);
  await expect(page.locator('.squiggly-warning')).not.toHaveCount(0);

  await page.getByTestId('activity-settings').click();
  const maskRow = page
    .locator('.settings-row')
    .filter({ hasText: 'Mask .env values' });
  const maskToggle = maskRow.getByRole('switch');
  await expect(maskToggle).toHaveAttribute('aria-checked', 'true');
  await maskToggle.click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.env-secret-value')).toHaveCount(0);

  await page.getByTestId('activity-settings').click();
  await page
    .locator('.settings-row')
    .filter({ hasText: 'Mask .env values' })
    .getByRole('switch')
    .click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.env-secret-value')).toHaveCount(3);
});

test('keeps AI actions disabled while the provider is unavailable', async ({
  page,
}) => {
  let chatRequests = 0;
  await page.route('**/api/ai/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        connected: false,
        error: 'Local provider is not running.',
      }),
    });
  });
  await page.route('**/api/ai/chat', async (route) => {
    chatRequests += 1;
    await route.abort();
  });
  await page.locator('.ai-btn').click();
  await expect(page.getByTestId('ai-provider-status')).toContainText(
    'Local provider is not running.',
  );
  await page.getByTestId('ai-prompt').fill('Hello');
  await expect(page.getByTestId('ai-send')).toBeDisabled();
  expect(chatRequests).toBe(0);
});

test('sends editor context to AI chat and executes a proposed read tool', async ({
  page,
}) => {
  await openIndexFile(page);
  let chatPayload: any = null;
  await page.route('**/api/ai/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ connected: true, models: ['test-model'] }),
    });
  });
  await page.route('**/api/ai/chat', async (route) => {
    chatPayload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: 'Context received.' }),
    });
  });
  await page.route('**/api/ai/agent/plan', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        tools: [
          {
            id: 'read-1',
            name: 'read_file',
            arguments: { path: 'src/index.js' },
          },
        ],
      }),
    });
  });

  await page.locator('.ai-btn').click();
  await page.getByTitle('AI settings').click();
  await expect(page.getByTestId('ai-provider-status')).toContainText(
    'Connected',
  );
  await page.getByTestId('ai-prompt').fill('Explain greet');
  await page.getByTestId('ai-send').click();
  await expect(page.getByTestId('ai-panel')).toContainText('Context received.');
  expect(chatPayload.context.activeFile.path).toBe('src/index.js');
  expect(chatPayload.context.workspaceFiles).toContain('src/index.js');

  await page.getByTestId('ai-prompt').fill('Read the active file');
  await page.getByTestId('ai-agent-plan').click();
  const tool = page.locator('.ai-tool').filter({ hasText: 'read_file' });
  await expect(tool).toBeVisible();
  await tool.getByRole('button', { name: 'Run' }).click();
  await expect(tool).toContainText('export function greet');
});

test('stops a running script and allows rerun', async ({ page }) => {
  await page.getByTestId('activity-npm-scripts').click();
  await page.getByRole('button', { name: /Scripts/ }).click();
  const scriptRow = page.locator(
    '[data-testid="npm-script-row"][data-script-name="long:running"]',
  );

  await scriptRow.getByTestId('npm-script-run').click();
  await expect(scriptRow.getByTestId('npm-script-stop')).toBeVisible();
  const terminal = page.locator(
    '[data-testid="terminal-instance"][data-script-key=".:long:running"]',
  );
  await expect(terminal.locator('.xterm-rows')).toContainText(
    'BLINKCODE_E2E_TICK',
  );

  await scriptRow.getByTestId('npm-script-stop').click();
  await expect(scriptRow.getByTestId('npm-script-run')).toBeVisible();
  await expect(
    page.locator(
      '[data-testid="terminal-instance"][data-script-key=".:long:running"]',
    ),
  ).toHaveAttribute('data-terminal-status', 'stopped');
});

test('records a keybinding without triggering the bound global action', async ({
  page,
}) => {
  await page.getByTestId('activity-settings').click();
  await page.getByTestId('settings-keybindings-tab').click();

  const recorder = page.locator('[data-testid="keybinding-recorder"]').first();
  await recorder.click();
  await expect(recorder).toContainText('Press');
  await recorder.press('Control+Alt+KeyK');

  await expect(page.locator('.settings-panel')).toBeVisible();
  await expect(recorder.locator('kbd')).toContainText('Ctrl+Alt+K');
});

test('opens recent files at the top from the keyboard shortcut', async ({
  page,
}) => {
  await openIndexFile(page);
  await page
    .locator('[data-testid="explorer-tree-row"][data-node-name="package.json"]')
    .click();
  await expect(page.locator('.tab.tab-active')).toContainText('package.json');

  await page.keyboard.press('Control+Tab');
  await expect(page.locator('.quickopen-modal')).toBeVisible();
  const quickOpenBox = await page.locator('.quickopen-modal').boundingBox();
  expect(quickOpenBox?.y).toBeLessThan(100);
  await expect(page.locator('.quickopen-list')).toContainText('package.json');
  await expect(page.locator('.quickopen-list')).toContainText('index.js');
  await expect(page.locator('.quickopen-list')).toContainText('src');
  await page.keyboard.press('Escape');

  await page.reload();
  await expect(page.getByTestId('activity-explorer')).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(localStorage.getItem('blinkcode-recent-files') || '[]'),
      ),
    )
    .toEqual(expect.arrayContaining(['package.json', 'src/index.js']));
});

test('toggles and persists Zen mode with its keyboard chord', async ({
  page,
}) => {
  await openIndexFile(page);
  await page.evaluate(() => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        bubbles: true,
        code: 'KeyK',
        ctrlKey: true,
        key: 'k',
      }),
    );
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        bubbles: true,
        code: 'KeyZ',
        ctrlKey: true,
        key: 'z',
      }),
    );
  });
  await expect(page.locator('.app')).toHaveClass(/zen-mode/);
  await expect(page.locator('.top-header')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Exit Zen Mode' }),
  ).toBeVisible();

  await page.reload();
  await expect(page.locator('.app')).toHaveClass(/zen-mode/);
  await page.getByRole('button', { name: 'Exit Zen Mode' }).click();
  await expect(page.locator('.app')).not.toHaveClass(/zen-mode/);
});

test('enables spell diagnostics and clears them when disabled', async ({
  page,
}) => {
  await page
    .locator(
      '[data-testid="explorer-tree-row"][data-node-name="spellcheck.md"]',
    )
    .click();
  await page.waitForFunction(() => Boolean((window as any).monaco));
  await page.getByTestId('activity-settings').click();
  const spellToggle = page
    .locator('.settings-row')
    .filter({ hasText: 'Spell checker' })
    .getByRole('switch');
  await spellToggle.click();
  await page.keyboard.press('Escape');

  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as any).monaco.editor
          .getModelMarkers({ owner: 'blinkcode-spelling' })
          .map((marker: any) => marker.message),
      ),
    )
    .toEqual(
      expect.arrayContaining([
        expect.stringContaining('projct'),
        expect.stringContaining('seperate'),
      ]),
    );

  await page.getByTestId('activity-settings').click();
  await page
    .locator('.settings-row')
    .filter({ hasText: 'Spell checker' })
    .getByRole('switch')
    .click();
  await page.keyboard.press('Escape');
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as any).monaco.editor.getModelMarkers({
            owner: 'blinkcode-spelling',
          }).length,
      ),
    )
    .toBe(0);
});

test('applies EditorConfig options and save transformations per file', async ({
  page,
}) => {
  await page
    .locator('[data-testid="explorer-tree-row"][data-node-name="src"]')
    .click();
  await page
    .locator(
      '[data-testid="explorer-tree-row"][data-node-name="editorconfig.js"]',
    )
    .click();
  await page.waitForFunction(() => Boolean((window as any).__blinkcodeEditor));

  await expect
    .poll(() =>
      page.evaluate(() => {
        const editor = (window as any).__blinkcodeEditor;
        return editor.getModel().getOptions().tabSize;
      }),
    )
    .toBe(4);
  await page.evaluate(() =>
    (window as any).__blinkcodeEditor.setValue('const configured = true;   '),
  );
  await page.keyboard.press('Control+S');

  await expect
    .poll(async () => {
      const response = await page.request.get(
        '/api/file?path=src%2Feditorconfig.js',
        { headers: apiHeaders },
      );
      return (await response.json()).content;
    })
    .toBe('const configured = true;\n');
});

test('moves an Explorer file to Trash only after confirmation', async ({
  page,
}) => {
  const row = page.locator(
    '[data-testid="explorer-tree-row"][data-node-name="trash-me.txt"]',
  );
  await row.click({ button: 'right' });
  await page.getByRole('button', { name: 'Delete' }).click();
  const dialog = page.getByRole('dialog', { name: 'Move item to Trash' });
  await expect(dialog).toContainText('trash-me.txt');
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(row).toBeVisible();

  await row.click({ button: 'right' });
  await page.getByRole('button', { name: 'Delete' }).click();
  await page
    .getByRole('dialog', { name: 'Move item to Trash' })
    .getByRole('button', { name: 'Move to Trash' })
    .click();
  await expect(row).toHaveCount(0);
  expect(
    (
      await page.request.get('/api/file?path=trash-me.txt', {
        headers: apiHeaders,
      })
    ).status(),
  ).toBe(404);
});

test('imports an operating-system file drop and opens it', async ({ page }) => {
  await page.locator('.sidebar').evaluate((sidebar) => {
    const transfer = new DataTransfer();
    transfer.items.add(
      new File(['export const dropped = true;\n'], 'dropped-e2e.js', {
        type: 'text/javascript',
      }),
    );
    sidebar.dispatchEvent(
      new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: transfer,
      }),
    );
  });

  await expect(
    page.locator(
      '[data-testid="explorer-tree-row"][data-node-name="dropped-e2e.js"]',
    ),
  ).toBeVisible();
  await expect(page.locator('.tab.tab-active')).toContainText('dropped-e2e.js');
  const response = await page.request.get('/api/file?path=dropped-e2e.js', {
    headers: apiHeaders,
  });
  expect((await response.json()).content).toContain('dropped = true');
});

test('shows and opens files from an additional workspace root', async ({
  page,
}) => {
  const response = await page.request.post('/api/workspace/roots', {
    data: { dirPath: resolve('e2e/fixtures/secondary-workspace') },
    headers: apiHeaders,
  });
  expect(response.ok()).toBe(true);
  const roots = (await response.json()).roots;
  const secondaryRoot = roots.find((item: any) => !item.primary);
  try {
    await page.getByTitle('Refresh').click();
    const root = page.locator(
      '[data-testid="explorer-tree-row"][data-node-name="secondary-workspace"]',
    );
    await expect(root).toBeVisible();
    await root.click();
    await page
      .locator(
        '[data-testid="explorer-tree-row"][data-node-name="secondary.ts"]',
      )
      .click();
    await expect(page.locator('.tab.tab-active')).toContainText('secondary.ts');
    await expect
      .poll(() =>
        page.evaluate(() => (window as any).__blinkcodeEditor?.getValue()),
      )
      .toContain('secondaryRoot');
    await page.getByRole('button', { name: 'Source Control' }).click();
    await expect(page.getByLabel('Repository root')).toBeVisible();
    await page.getByLabel('Repository root').click();
    await page.getByRole('option', { name: 'secondary-workspace' }).click();
    await expect(page.getByLabel('Repository root')).toContainText(
      'secondary-workspace',
    );
  } finally {
    await page.request.delete(`/api/workspace/roots/${secondaryRoot.id}`, {
      headers: apiHeaders,
    });
  }
});

test('offers all AI quick actions and requires a reviewed approval token', async ({
  page,
}) => {
  await page.route('**/api/ai/status', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ connected: true, models: ['test-model'] }),
    }),
  );
  await page.locator('.ai-btn').click();
  for (const label of [
    'Explain',
    'Refactor',
    'Fix',
    'Document',
    'Generate tests',
    'Optimize',
  ]) {
    await expect(
      page.getByRole('button', { name: label, exact: true }),
    ).toBeVisible();
  }
  await page.keyboard.press('Control+Shift+P');
  await page.locator('.cmdp-input').fill('AI: Explain');
  await expect(
    page.locator('.cmdp-item').filter({ hasText: 'AI: Explain' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');

  const tool = {
    id: 'write-1',
    name: 'write_file',
    arguments: { path: 'approved.txt', content: 'approved' },
  };
  const preview = await page.request.post('/api/ai/tools/preview', {
    data: { tool },
    headers: apiHeaders,
  });
  const { approvalToken } = await preview.json();
  const rejected = await page.request.post('/api/ai/tools/execute', {
    data: { tool, approvalToken: '' },
    headers: apiHeaders,
  });
  expect(rejected.status()).toBe(409);
  const accepted = await page.request.post('/api/ai/tools/execute', {
    data: { tool, approvalToken },
    headers: apiHeaders,
  });
  expect(accepted.ok()).toBe(true);
  const reused = await page.request.post('/api/ai/tools/execute', {
    data: { tool, approvalToken },
    headers: apiHeaders,
  });
  expect(reused.status()).toBe(409);
  await page.request.delete('/api/delete?path=approved.txt', {
    headers: apiHeaders,
  });
});

test('keeps custom settings pickers inside the viewport', async ({ page }) => {
  await page.getByTestId('activity-settings').click();
  await expect(page.getByTestId('settings-search')).toHaveCount(0);
  await page.getByTestId('settings-search-toggle').click();
  const settingsSearch = page.getByTestId('settings-search');
  await expect(settingsSearch).toBeVisible();
  await settingsSearch.getByRole('textbox').fill('Language');
  await expect(
    page.locator('.settings-row').filter({ hasText: 'Language' }),
  ).toBeVisible();
  await expect(
    page.locator('.settings-row').filter({ hasText: 'Font size' }),
  ).toBeHidden();
  await settingsSearch.getByRole('textbox').press('Escape');
  await expect(settingsSearch).toHaveCount(0);

  const languagePicker = page.getByLabel('Language');
  await languagePicker.click();
  const triggerBox = await languagePicker.boundingBox();
  const menuBox = await page.locator('.ui-select-menu-portal').boundingBox();
  const viewport = page.viewportSize()!;
  expect(menuBox!.x).toBeGreaterThanOrEqual(8);
  expect(menuBox!.x + menuBox!.width).toBeLessThanOrEqual(viewport.width - 8);
  expect(
    Math.abs(
      menuBox!.x + menuBox!.width / 2 - (triggerBox!.x + triggerBox!.width / 2),
    ),
  ).toBeLessThan(80);
});

test('imports and persists a VS Code theme with visible errors', async ({
  page,
}) => {
  await page.getByTestId('activity-settings').click();
  const fileInput = page.getByTestId('theme-file-input');
  await fileInput.setInputFiles({
    name: 'broken-theme.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{broken'),
  });
  await expect(page.locator('.toast-error')).toContainText(
    'Theme import failed',
  );

  await fileInput.setInputFiles({
    name: 'ocean-theme.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        name: 'Ocean Test',
        type: 'dark',
        colors: {
          'editor.background': '#101820',
          'sideBar.background': '#17232d',
          'activityBar.background': '#0c1319',
          'editor.foreground': '#f2f7fa',
        },
        tokenColors: [
          {
            scope: ['keyword'],
            settings: { foreground: '#66ccff', fontStyle: 'bold' },
          },
        ],
      }),
    ),
  });
  await expect(page.getByTestId('imported-theme-name')).toHaveText(
    'Ocean Test',
  );
  await expect(page.getByLabel('Theme')).toContainText(
    'Imported VS Code theme',
  );
  await expect
    .poll(() =>
      page.evaluate(() =>
        document.documentElement.style.getPropertyValue('--bg-editor'),
      ),
    )
    .toBe('#101820');

  await page.reload();
  await page.getByTestId('activity-settings').click();
  await expect(page.getByTestId('imported-theme-name')).toHaveText(
    'Ocean Test',
  );
  await expect(page.getByLabel('Theme')).toContainText(
    'Imported VS Code theme',
  );
});

test('keeps a custom editor background and visible code after reload', async ({
  page,
}) => {
  test.slow();
  await page.getByTestId('activity-settings').click();
  const backgroundInput = page.locator('input[type="file"][accept="image/*"]');
  await backgroundInput.setInputFiles({
    name: 'editor-background.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    ),
  });
  await expect(page.getByLabel('Editor Backdrop')).toContainText('Custom');
  await page.keyboard.press('Escape');

  await openIndexFile(page);
  const editor = page.locator('.code-editor-with-background');
  await expect(editor).toBeVisible();
  await expect
    .poll(() =>
      editor.evaluate((element) =>
        element.style.getPropertyValue('--editor-bg-image'),
      ),
    )
    .toContain('data:image/png;base64');
  await expect(page.locator('.monaco-editor .view-lines')).toContainText(
    'export function greet',
  );

  await page.reload();
  await expect(page.locator('.code-editor-with-background')).toBeVisible();
  await expect(page.locator('.monaco-editor .view-lines')).toContainText(
    'export function greet',
  );
});

test('creates, edits, persists and removes a user snippet', async ({
  page,
}) => {
  await page.getByTestId('activity-settings').click();
  await page.getByTestId('settings-snippets-tab').click();

  await page.getByTestId('snippet-save').click();
  await expect(page.locator('.settings-snippet-error')).toContainText(
    'Enter a snippet name',
  );
  await page.getByLabel('Snippet name').fill('Log value');
  await page.getByLabel('Snippet prefix').fill('logv');
  await page.getByLabel('Snippet languages').fill('JavaScript, javascript');
  await page.getByLabel('Snippet description').fill('Log the selected value');
  await page.getByLabel('Snippet body').fill('console.log(${1:value});');
  await page.getByTestId('snippet-save').click();

  const row = page.getByTestId('snippet-row').filter({ hasText: 'Log value' });
  await expect(row).toContainText('logv · javascript');
  await row.getByRole('button', { name: 'Edit snippet' }).click();
  await page.getByLabel('Snippet description').fill('Updated log snippet');
  await page.getByTestId('snippet-save').click();
  await expect(row).toContainText('Updated log snippet');

  await page.reload();
  await page.getByTestId('activity-settings').click();
  await page.getByTestId('settings-snippets-tab').click();
  const persistedRow = page
    .getByTestId('snippet-row')
    .filter({ hasText: 'Log value' });
  await expect(persistedRow).toContainText('Updated log snippet');
  await persistedRow.getByRole('button', { name: 'Delete snippet' }).click();
  await expect(persistedRow).toHaveCount(0);
});

test('blocks normal dirty-tab close and makes Dont Save restore disk content', async ({
  page,
}) => {
  await openIndexFile(page);
  await page.waitForFunction(() => Boolean((window as any).__blinkcodeEditor));
  await page.evaluate(() =>
    (window as any).__blinkcodeEditor.setValue(
      'export const shouldBeDiscarded = true;',
    ),
  );
  const tab = page.locator('.tab').filter({ hasText: 'index.js' });
  await tab.locator('.tab-close').click();
  await expect(tab).toBeVisible();
  await tab.click({ button: 'right' });
  await page.getByRole('button', { name: "Don't Save" }).click();
  await expect(tab).toHaveCount(0);
  const response = await page.request.get('/api/file?path=src%2Findex.js', {
    headers: apiHeaders,
  });
  expect((await response.json()).content).not.toContain('shouldBeDiscarded');
});

test('creates a project from a local template with a package manager choice', async ({
  page,
}) => {
  await page.evaluate(() => {
    window.electronAPI = {
      openFolder: async () => 'C:\\Projects',
      createProjectFromTemplate: async (request) => {
        (window as any).__projectTemplateRequest = request;
        return { projectPath: `${request.parentPath}\\${request.projectName}` };
      },
    };
  });
  await page.evaluate(() =>
    window.dispatchEvent(new CustomEvent('blinkcode:openProjectTemplates')),
  );
  await expect(page.locator('.project-template-modal')).toBeVisible();
  await page.getByLabel('Project folder').fill('My Template App');
  await page.getByLabel('Package manager').click();
  await page.locator('[role="option"][data-option-value="pnpm"]').click();
  await page.getByRole('button', { name: 'Browse' }).click();
  await expect(page.locator('.project-template-location')).toContainText(
    'C:\\Projects',
  );
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(page.locator('.project-template-modal')).toHaveCount(0);

  const request = await page.evaluate(
    () => (window as any).__projectTemplateRequest,
  );
  expect(request.parentPath).toBe('C:\\Projects');
  expect(request.projectName).toBe('My Template App');
  expect(JSON.parse(request.files['package.json'])).toMatchObject({
    name: 'my-template-app',
    packageManager: 'pnpm@latest',
  });
  expect(
    (
      await page.request.get(
        '/api/file?path=My%20Template%20App%2Fpackage.json',
        { headers: apiHeaders },
      )
    ).status(),
  ).toBe(404);
});

test('sidebar inputs keep typing when a command uses a single-letter keybinding', async ({
  page,
}) => {
  await page.getByTestId('activity-settings').click();
  await page.getByTestId('settings-keybindings-tab').click();

  const commandPaletteRecorder = page.locator(
    '[data-testid="keybinding-recorder"][data-keybinding-id="commandPalette"]',
  );
  await commandPaletteRecorder.click();
  await commandPaletteRecorder.press('KeyA');
  await page.keyboard.press('Escape');
  await expect(page.locator('.settings-panel')).toHaveCount(0);

  await page.getByRole('button', { name: 'Search' }).click();
  const searchInput = page.locator('.search-input').first();
  await searchInput.click();
  await page.keyboard.type('alpha');
  await expect(searchInput).toHaveValue('alpha');

  await page.getByTestId('activity-settings').click();
  await page.getByTestId('settings-keybindings-tab').click();
  await page.getByRole('button', { name: 'Reset' }).click();
  await page.keyboard.press('Escape');
});

test('edits and saves a file through the editor', async ({ page }) => {
  await openIndexFile(page);
  await page.waitForFunction(() => Boolean((window as any).__blinkcodeEditor));
  await page.evaluate(() =>
    (window as any).__blinkcodeEditor.setValue(
      'export const savedByE2E = true;',
    ),
  );
  await page.keyboard.press('Control+S');
  await expect
    .poll(async () => {
      const response = await page.request.get('/api/file?path=src%2Findex.js', {
        headers: apiHeaders,
      });
      return (await response.json()).content;
    })
    .toContain('savedByE2E');
});

test('runs a normal terminal command and auto-attaches Browser Preview', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'blinkcode-settings',
      JSON.stringify({
        language: 'en',
        webWorkflowPreviewBehavior: 'auto-open',
        bottomPanelPosition: 'bottom',
      }),
    );
  });
  await page.reload();
  await page.getByRole('button', { name: 'Terminal' }).click();
  await expect(page.locator('.term-cwd')).toHaveCount(0);
  await page.getByTitle('New terminal').click();
  await expect(page.locator('.term-tab')).toHaveCount(2);

  if (await page.locator('.bottom-panel-resizer-bottom').count()) {
    const panelBefore = await page.locator('.bottom-panel-shell').boundingBox();
    const resizeHandle = await page
      .locator('.bottom-panel-resizer-bottom')
      .boundingBox();
    await page.mouse.move(
      resizeHandle!.x + resizeHandle!.width / 2,
      resizeHandle!.y + 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      resizeHandle!.x + resizeHandle!.width / 2,
      resizeHandle!.y - 60,
    );
    await page.mouse.up();
    const panelAfter = await page.locator('.bottom-panel-shell').boundingBox();
    expect(panelAfter!.height).toBeGreaterThan(panelBefore!.height + 40);
    await page.locator('.bottom-panel-actions button').first().click();
  }
  await expect(page.locator('.bottom-panel-shell')).toHaveClass(
    /bottom-panel-right/,
  );
  await expect(page.locator('.bottom-panel-resizer-right')).toBeVisible();

  const terminal = page.locator('.terminal-instance-active');
  await expect(terminal).toBeVisible();
  await terminal.locator('.xterm-helper-textarea').click();
  await page.keyboard.type('echo http://localhost:5178');
  await page.keyboard.press('Enter');
  await expect(terminal.locator('.xterm-rows')).toContainText(
    'http://localhost:5178',
  );
  await expect(page.locator('.browser-preview')).toBeVisible();
  await expect(page.locator('.browser-preview-devices')).toBeVisible();
});

test('restores an unsaved recovery buffer after reload', async ({ page }) => {
  await openIndexFile(page);
  await page.waitForFunction(() => Boolean((window as any).__blinkcodeEditor));
  await page.evaluate(() =>
    (window as any).__blinkcodeEditor.setValue(
      'export const recoveredByE2E = true;',
    ),
  );
  await page.waitForTimeout(2400);
  await page.reload();
  await page.waitForFunction(() => Boolean((window as any).__blinkcodeEditor));
  await expect
    .poll(() =>
      page.evaluate(() => (window as any).__blinkcodeEditor.getValue()),
    )
    .toContain('recoveredByE2E');
  await page.request.delete('/api/recovery?path=src%2Findex.js', {
    headers: apiHeaders,
  });
  await page.request.put('/api/file', {
    data: {
      filePath: 'src/index.js',
      content:
        'export function greet(name) {\n  return `Hello, ${name}!`;\n}\n',
    },
    headers: apiHeaders,
  });
});

test('persists the final-newline setting', async ({ page }) => {
  await page.getByTestId('activity-settings').click();
  const row = page
    .locator('.settings-row')
    .filter({ hasText: 'Insert Final Newline' });
  const toggle = row.getByRole('switch');
  const wasOn = (await toggle.getAttribute('aria-checked')) === 'true';
  await toggle.click();
  await page.reload();
  await page.getByTestId('activity-settings').click();
  const persisted =
    (await page
      .locator('.settings-row')
      .filter({ hasText: 'Insert Final Newline' })
      .getByRole('switch')
      .getAttribute('aria-checked')) === 'true';
  expect(persisted).toBe(!wasOn);
});

test('shows Git changes in Source Control when Git is available', async ({
  page,
}) => {
  const status = await page.request
    .get('/api/git/status', { headers: apiHeaders })
    .then((response) => response.json());
  test.skip(!status.isRepo, 'Git is unavailable in this environment');
  await page.request.put('/api/file', {
    data: {
      filePath: 'src/index.js',
      content: 'export const gitChange = true;\n',
    },
    headers: apiHeaders,
  });
  await page.getByRole('button', { name: 'Source Control' }).click();
  await expect(page.locator('.source-control-panel')).toContainText(
    'src/index.js',
  );
});

test('keeps first-party feature flags active without the Extensions marketplace UI', async ({
  page,
}) => {
  await expect(page.getByTestId('activity-extensions')).toHaveCount(0);
  await expect(page.getByTestId('extensions-panel')).toHaveCount(0);

  await expect
    .poll(async () =>
      page.evaluate(() => {
        const features = Array.from(
          (window as any).__blinkcodeExtensionFeatures || [],
        );
        return ['markdown-preview', 'spell-checker', 'theme-import'].every(
          (feature) => features.includes(feature),
        );
      }),
    )
    .toBe(true);
});
