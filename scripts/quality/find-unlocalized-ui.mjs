import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve('src');
const attributeNames = new Set(['aria-label', 'alt', 'placeholder', 'title']);
const objectPropertyNames = new Set([
  'cancelLabel',
  'confirmLabel',
  'description',
  'details',
  'label',
  'message',
  'subtitle',
  'title',
]);
const uiCallNames = new Set([
  'addToast',
  'alert',
  'confirm',
  'setError',
  'setStatus',
]);
const ignoredExact = new Set([
  '+',
  '-',
  '.',
  '...',
  'Aa',
  'ab',
  'Blink',
  'BlinkCode',
  'Blink AI',
  'Code',
  'EN',
  'English',
  'Esc',
  '&gt;',
  'GitHub',
  'RU',
  'Русский',
  'UTF-8',
  '>',
  'ms',
]);
const ignoredPatterns = [
  /^https?:\/\//,
  /^(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+https?:\/\//,
  /^--[\w-]+$/,
  /^\.[\w.-]+$/,
  /^\d+(?:ms|s)$/,
  /^[A-Z\d_./:+-]+$/,
  /^(?:javascript|typescript)(?:,(?:javascript|typescript))*$/,
  /^console\./,
  /^kb\.$/,
  /^[\w.-]+\.(?:css|html|js|json|jsx|md|ts|tsx|yaml|yml)$/,
  /^v\d+\.\d+\.\d+$/,
];

function collectFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectFiles(fullPath);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [fullPath] : [];
  });
}

function normalize(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function isCandidate(value) {
  const text = normalize(value);
  if (!text || ignoredExact.has(text)) return false;
  if (ignoredPatterns.some(pattern => pattern.test(text))) return false;
  return /[A-Za-zА-Яа-яЁё]{2}/.test(text);
}

function getLiteralText(node) {
  if (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) return [node.head.text, ...node.templateSpans.map(span => span.literal.text)].join('');
  return null;
}

const findings = [];

for (const filePath of collectFiles(root)) {
  const sourceText = fs.readFileSync(filePath, 'utf8');
  const source = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const add = (node, kind, value) => {
    if (!isCandidate(value)) return;
    const position = source.getLineAndCharacterOfPosition(node.getStart(source));
    findings.push({
      file: path.relative(process.cwd(), filePath).replace(/\\/g, '/'),
      kind,
      line: position.line + 1,
      text: normalize(value),
    });
  };

  const visit = node => {
    if (ts.isJsxText(node)) add(node, 'jsx-text', node.text);

    if (ts.isJsxAttribute(node) && attributeNames.has(node.name.text)) {
      if (node.initializer && ts.isStringLiteral(node.initializer)) {
        add(node, `attribute:${node.name.text}`, node.initializer.text);
      }
    }

    if (ts.isJsxExpression(node) && node.expression && !ts.isJsxAttribute(node.parent)) {
      const value = getLiteralText(node.expression);
      if (value !== null) add(node, 'jsx-expression', value);
    }

    if (ts.isPropertyAssignment(node)) {
      const name = ts.isIdentifier(node.name) || ts.isStringLiteral(node.name) ? node.name.text : '';
      const isThemeName = filePath.endsWith(path.join('commandPalette', 'commandThemes.ts')) && name === 'label';
      if (objectPropertyNames.has(name) && !isThemeName) {
        const value = getLiteralText(node.initializer);
        if (value !== null) add(node, `property:${name}`, value);
      }
    }

    if (ts.isCallExpression(node)) {
      const expression = node.expression;
      const name = ts.isIdentifier(expression)
        ? expression.text
        : ts.isPropertyAccessExpression(expression)
          ? expression.name.text
          : '';
      if (uiCallNames.has(name)) {
        const argument = node.arguments[0];
        const value = argument ? getLiteralText(argument) : null;
        if (value !== null) add(argument, `call:${name}`, value);
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(source);
}

findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
for (const finding of findings) {
  console.log(`${finding.file}:${finding.line} [${finding.kind}] ${finding.text}`);
}
console.log(`\nFound ${findings.length} potential unlocalized UI strings.`);

if (process.argv.includes('--check') && findings.length > 0) process.exitCode = 1;
