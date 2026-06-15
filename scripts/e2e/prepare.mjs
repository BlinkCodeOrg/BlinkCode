import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const storageDirectory = resolve('e2e/.storage');
rmSync(storageDirectory, { recursive: true, force: true });
mkdirSync(storageDirectory, { recursive: true });

const workspace = resolve('e2e/fixtures/workspace');
const secondaryWorkspace = resolve('e2e/fixtures/secondary-workspace');
rmSync(workspace, { recursive: true, force: true });
mkdirSync(resolve(workspace, 'src'), { recursive: true });
mkdirSync(resolve(workspace, 'packages/client'), { recursive: true });
rmSync(secondaryWorkspace, { recursive: true, force: true });
mkdirSync(secondaryWorkspace, { recursive: true });
writeFileSync(resolve(secondaryWorkspace, 'secondary.ts'), 'export const secondaryRoot = true;\n');
mkdirSync(resolve(workspace, '.blinkcode'), { recursive: true });
writeFileSync(resolve(workspace, 'src/index.js'), "export function greet(name) {\n  return `Hello, ${name}!`;\n}\n");
writeFileSync(resolve(workspace, 'src/editorconfig.js'), 'const value = true;   ');
writeFileSync(resolve(workspace, 'spellcheck.md'), '# Documentation\n\nThis projct has a seperate guide.\n');
writeFileSync(resolve(workspace, 'trash-me.txt'), 'Move this file to Trash.\n');
writeFileSync(resolve(workspace, '.editorconfig'), [
  'root = true',
  '',
  '[src/editorconfig.js]',
  'indent_style = space',
  'indent_size = 4',
  'trim_trailing_whitespace = true',
  'insert_final_newline = true',
  'end_of_line = lf',
  '',
].join('\n'));
writeFileSync(resolve(workspace, 'debug.js'), [
  'const value = 2;',
  "const nested = { answer: 42, label: 'BlinkCode' };",
  'const doubled = value * 2;',
  'console.log(nested.label, doubled);',
  '',
].join('\n'));
writeFileSync(resolve(workspace, '.blinkcode/launch.json'), JSON.stringify({
  version: '1.0',
  configurations: [{
    name: 'Launch debug.js',
    type: 'node',
    request: 'launch',
    program: '${workspaceRoot}/debug.js',
    cwd: '${workspaceRoot}',
  }],
}, null, 2));
writeFileSync(resolve(workspace, 'api.http'), [
  '@host = http://127.0.0.1:3311',
  'GET {{host}}/api/tree',
  'Accept: application/json',
  '',
].join('\n'));
writeFileSync(resolve(workspace, '.env'), [
  'API_KEY=blinkcode-secret',
  'PORT=3001',
  'API_KEY=duplicate-secret',
  '',
].join('\n'));
writeFileSync(resolve(workspace, 'package.json'), JSON.stringify({
  name: 'blinkcode-e2e-workspace',
  private: true,
  dependencies: {
    'fixture-runtime': '^1.2.3',
  },
  devDependencies: {
    'fixture-tooling': '~4.5.6',
  },
  scripts: {
    'verify:panel': 'node -e "console.log(\'BLINKCODE_E2E_SCRIPT_OK\')"',
    'long:running': 'node -e "setInterval(() => console.log(\'BLINKCODE_E2E_TICK\'), 250)"',
  },
}, null, 2));
writeFileSync(resolve(workspace, 'packages/client/package.json'), JSON.stringify({
  name: 'fixture-client',
  private: true,
  dependencies: {
    'fixture-client-runtime': '^2.0.0',
  },
  scripts: {
    'nested:check': 'node -e "console.log(\'BLINKCODE_E2E_NESTED_OK\')"',
  },
}, null, 2));
rmSync(resolve(workspace, 'package-lock.json'), { force: true });
rmSync(resolve(workspace, 'packages/client/package-lock.json'), { force: true });
rmSync(resolve(workspace, '.git'), { recursive: true, force: true });
rmSync(resolve(workspace, '.git_disabled'), { recursive: true, force: true });
rmSync(resolve(workspace, 'e2e-template-app'), { recursive: true, force: true });
rmSync(resolve(workspace, 'dropped-e2e.js'), { force: true });
try {
  execFileSync('git', ['init', workspace]);
  const gitArgs = ['-c', `safe.directory=${workspace}`, '-C', workspace];
  execFileSync('git', [...gitArgs, 'config', 'user.email', 'e2e@blinkcode.local']);
  execFileSync('git', [...gitArgs, 'config', 'user.name', 'BlinkCode E2E']);
  execFileSync('git', [...gitArgs, 'add', '.']);
  execFileSync('git', [...gitArgs, 'commit', '-m', 'E2E fixture']);
  execFileSync('git', [...gitArgs, 'branch', 'feature/demo']);
  execFileSync('git', [...gitArgs, 'remote', 'add', 'origin', 'https://github.com/blinkcode/e2e-fixture.git']);
} catch {
  // Git-specific E2E assertions gracefully skip when Git is unavailable.
}
