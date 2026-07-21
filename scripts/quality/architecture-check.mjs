import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = process.cwd();
const srcRoot = join(root, 'src');
const maxLines = 260;
const lineLimitExemptions = [
  'src/features/i18n/',
  'src/features/editorTheme/themeDefinitions/',
  'src/features/fileIcons/fileIconMaps.tsx',
  'src/features/initialFiles/initialFileTemplates.ts',
];

const errors = [];

function toPosix(path) {
  return path.split(sep).join('/');
}

function walk(dir) {
  const entries = readdirSync(dir);
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) files.push(...walk(path));
    else if (/\.(ts|tsx)$/.test(entry)) files.push(path);
  }
  return files;
}

function isExempt(relativePath) {
  return lineLimitExemptions.some(exemption => relativePath.startsWith(exemption) || relativePath === exemption);
}

for (const file of walk(srcRoot)) {
  const relativePath = toPosix(relative(root, file));
  const content = readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/).length;

  if (!isExempt(relativePath) && lines > maxLines) {
    errors.push(`${relativePath}: ${lines} lines exceeds ${maxLines}. Split component/hook/data responsibilities.`);
  }

  if (relativePath.startsWith('src/features/')) {
    const imports = content.matchAll(/import\s+(type\s+)?[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g);
    for (const match of imports) {
      const isTypeOnly = Boolean(match[1]);
      const target = match[2];
      if (!isTypeOnly && target.includes('/components/')) {
        errors.push(`${relativePath}: feature modules must not runtime-import components (${target}).`);
      }
    }
  }

  if (relativePath.startsWith('src/shared/') || relativePath.startsWith('src/utils/')) {
    const imports = content.matchAll(/import\s+(type\s+)?[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g);
    for (const match of imports) {
      const target = match[2];
      if (target.includes('/components/')) {
        errors.push(`${relativePath}: shared/utils modules must not import components (${target}).`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error('Architecture check failed:\n');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Architecture check passed.');
