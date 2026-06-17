import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { parseEnvDocument } from '../../src/features/envEditor/parseEnvDocument';
import {
  findSpellingIssues,
  findSpellingSuggestions,
} from '../../src/features/spellChecker/findSpellingIssues';
import { convertVsCodeTheme } from '../../src/features/editorTheme/convertVsCodeTheme';
import { parseEditorConfig, resolveEditorConfig } from '../../server/editorConfig.js';
import { trashWorkspaceEntry } from '../../server/trashWorkspaceEntry.js';
import { analyzeWebWorkflow } from '../../server/webWorkflow.js';
import { buildProjectTemplateFiles } from '../../src/features/projectTemplates/buildProjectTemplateFiles';
import { PROJECT_TEMPLATES } from '../../src/features/projectTemplates/projectTemplates';
import { buildUserSnippet } from '../../src/features/snippets/buildUserSnippet';
import { normalizeSnippetLanguages } from '../../src/features/snippets/normalizeSnippetLanguages';
import { registerSnippetTooling } from '../../src/features/snippets/registerSnippetTooling';
import { validateSnippetDraft } from '../../src/features/snippets/validateSnippetDraft';

test('env parser accepts exports and reports duplicate or malformed keys', () => {
  const parsed = parseEnvDocument('export API_KEY=one\nAPI_KEY=two\nBAD KEY=value\nMISSING');
  assert.equal(parsed.values.get('API_KEY'), 'two');
  assert.deepEqual(parsed.diagnostics.map(item => item.message), [
    'Duplicate environment variable: API_KEY',
    'Invalid environment variable name: BAD KEY',
    'Expected KEY=value',
  ]);
});

test('spell checker ignores code spans and offers close corrections', () => {
  const issues = findSpellingIssues('This is a projct. `misspeledIdentifier`');
  assert.equal(issues.some(item => item.word === 'projct'), true);
  assert.equal(issues.some(item => item.word.includes('Identifier')), false);
  assert.equal(findSpellingSuggestions('projct').includes('project'), true);
  const comments = findSpellingIssues('const projct = 1; // update misspeled project', true);
  assert.equal(comments.some(item => item.word === 'projct'), false);
  assert.equal(comments.some(item => item.word === 'misspeled'), true);
});

test('VS Code themes are validated and normalized', () => {
  const theme = convertVsCodeTheme({
    name: 'Ocean',
    type: 'light',
    colors: { 'editor.background': '#ffffff' },
    tokenColors: [{ scope: 'keyword', settings: { foreground: '#ff0000' } }],
  });
  assert.equal(theme.name, 'Ocean');
  assert.equal(theme.type, 'light');
  assert.throws(() => convertVsCodeTheme({ name: 'Empty' }), /does not contain/);
});

test('EditorConfig parses sections and applies closest matching values', () => {
  const workspace = mkdtempSync(resolve(tmpdir(), 'blinkcode-editorconfig-'));
  try {
    writeFileSync(resolve(workspace, '.editorconfig'), 'root=true\n[*]\nindent_style=space\nindent_size=2\n[*.{ts,tsx}]\ninsert_final_newline=true\n');
    mkdirSync(resolve(workspace, 'src'), { recursive: true });
    writeFileSync(resolve(workspace, 'src/.editorconfig'), '[*.ts]\nindent_size=4\n');
    writeFileSync(resolve(workspace, 'src/index.ts'), '');
    assert.equal(parseEditorConfig('root = true\n[*.js]\nindent_size=2').root, true);
    assert.deepEqual(resolveEditorConfig(workspace, 'src/index.ts'), {
      indent_style: 'space',
      indent_size: '4',
      insert_final_newline: 'true',
    });
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test('soft delete moves a workspace item outside the workspace', () => {
  const workspace = mkdtempSync(resolve(tmpdir(), 'blinkcode-trash-'));
  const trash = mkdtempSync(resolve(tmpdir(), 'blinkcode-trash-target-'));
  writeFileSync(resolve(workspace, 'note.txt'), 'recoverable');
  const destination = trashWorkspaceEntry(workspace, 'note.txt', trash);
  try {
    assert.equal(existsSync(resolve(workspace, 'note.txt')), false);
    assert.equal(existsSync(destination), true);
  } finally {
    rmSync(dirname(destination), { recursive: true, force: true });
    rmSync(trash, { recursive: true, force: true });
    rmSync(workspace, { recursive: true, force: true });
  }
});

test('project templates derive the package name from the chosen folder', () => {
  const reactTemplate = PROJECT_TEMPLATES.find(template => template.id === 'react-vite-ts')!;
  const files = buildProjectTemplateFiles(reactTemplate, 'My BlinkCode Project', 'pnpm');
  const manifest = JSON.parse(files['package.json']);

  assert.equal(manifest.name, 'my-blinkcode-project');
  assert.equal(manifest.packageManager, 'pnpm@latest');
  assert.equal(files['package.json'].includes('blinkcode-node-app'), false);
  assert.equal(files['src/App.tsx'].includes('React + Vite'), true);
});

test('web workflow analysis detects modern web app capabilities', () => {
  const workspace = mkdtempSync(resolve(tmpdir(), 'blinkcode-web-workflow-'));
  try {
    writeFileSync(resolve(workspace, 'package.json'), JSON.stringify({
      scripts: { dev: 'vite --host 127.0.0.1', test: 'vitest' },
      dependencies: { react: '^19.0.0', 'react-router-dom': '^7.0.0', express: '^5.0.0' },
      devDependencies: { vite: '^8.0.0', typescript: '^6.0.0', tailwindcss: '^3.4.0', vitest: '^4.0.0' },
    }));
    writeFileSync(resolve(workspace, 'vite.config.ts'), '');
    writeFileSync(resolve(workspace, 'tailwind.config.js'), '');
    writeFileSync(resolve(workspace, '.env.local'), 'VITE_API_URL=http://localhost:3000\n');
    writeFileSync(resolve(workspace, 'requests.http'), 'GET http://localhost:3000/health\n');

    const analysis = analyzeWebWorkflow(workspace);
    assert.equal(analysis.frameworks.react, true);
    assert.equal(analysis.frameworks.vite, true);
    assert.equal(analysis.frameworks.tailwind, true);
    assert.equal(analysis.frameworks.reactRouter, true);
    assert.equal(analysis.testing.vitest, true);
    assert.equal(analysis.backend.express, true);
    assert.deepEqual(analysis.envFiles, ['.env.local']);
    assert.deepEqual(analysis.restFiles, ['requests.http']);
    assert.equal(analysis.devServerScripts[0].scriptName, 'dev');
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test('snippets normalize languages and reject overlapping prefixes', () => {
  const draft = {
    name: 'Log value',
    prefix: 'logv',
    languages: ' JavaScript, typescript, javascript ',
    body: 'console.log(${1:value});',
    description: 'Log a value',
  };
  assert.deepEqual(normalizeSnippetLanguages(draft.languages), ['javascript', 'typescript']);
  assert.equal(validateSnippetDraft(draft, [], null), null);

  const snippet = buildUserSnippet('snippet-1', draft);
  assert.deepEqual(snippet.languages, ['javascript', 'typescript']);
  assert.equal(snippet.description, 'Log a value');
  assert.equal(validateSnippetDraft(draft, [snippet], null), 'duplicatePrefix');
  assert.equal(validateSnippetDraft(draft, [snippet], snippet.id), null);
});

test('snippet completion providers update live and preserve tab stops', () => {
  const providers = new Map<string, any>();
  const disposed: string[] = [];
  const monaco = {
    languages: {
      CompletionItemKind: { Snippet: 27 },
      CompletionItemInsertTextRule: { InsertAsSnippet: 4 },
      registerCompletionItemProvider(language: string, provider: any) {
        providers.set(language, provider);
        return { dispose: () => disposed.push(language) };
      },
    },
  };
  const first = buildUserSnippet('snippet-1', {
    name: 'Log value',
    prefix: 'logv',
    languages: 'javascript',
    body: 'console.log(${1:value});',
    description: '',
  });
  registerSnippetTooling(monaco, [first]);
  const provider = providers.get('javascript');
  assert.ok(provider);
  const model = { getWordUntilPosition: () => ({ startColumn: 1, endColumn: 5 }) };
  const position = { lineNumber: 1, column: 5 };
  assert.equal(provider.provideCompletionItems(model, position).suggestions[0].insertText, first.body);

  registerSnippetTooling(monaco, [{ ...first, body: 'console.info(${1:value});' }]);
  assert.equal(provider.provideCompletionItems(model, position).suggestions[0].insertText, 'console.info(${1:value});');
  registerSnippetTooling(monaco, []);
  assert.deepEqual(disposed, ['javascript']);
});
