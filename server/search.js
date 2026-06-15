import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const DEFAULT_IGNORES = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.cache', '.turbo', '.svelte-kit',
  'coverage', 'out', 'release', '.blinkcode',
]);

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico', '.mp3', '.wav', '.ogg',
  '.mp4', '.webm', '.mov', '.zip', '.rar', '.7z', '.gz', '.tar', '.pdf', '.exe',
  '.dll', '.so', '.dylib', '.woff', '.woff2', '.ttf', '.eot', '.otf', '.sqlite', '.db',
]);

const MAX_FILE_SIZE = 1024 * 1024;
const MAX_MATCHES = 300;
const MAX_FILES = 3000;

function normalizeSlash(value) {
  return String(value || '').replace(/\\/g, '/');
}

function wildcardToRegExp(pattern) {
  const normalized = normalizeSlash(pattern).trim();
  if (!normalized) return null;
  const escaped = normalized.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp(`(^|/)${escaped}($|/)`, 'i');
}

function compilePatterns(value) {
  return String(value || '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean)
    .map(wildcardToRegExp)
    .filter(Boolean);
}

function matchesAny(relPath, patterns) {
  if (!patterns.length) return false;
  const normalized = normalizeSlash(relPath);
  return patterns.some(pattern => pattern.test(normalized));
}

function makeSearchRegex(query, { regex = false, matchCase = false, wholeWord = false } = {}) {
  if (!query) throw new Error('Search query is empty');
  const source = regex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wrapped = wholeWord ? `\\b(?:${source})\\b` : source;
  return new RegExp(wrapped, matchCase ? 'g' : 'gi');
}

function getLineRanges(text) {
  const ranges = [];
  let start = 0;
  let line = 1;
  for (let i = 0; i <= text.length; i += 1) {
    if (i === text.length || text[i] === '\n') {
      const end = i;
      const raw = text.slice(start, end);
      ranges.push({ line, start, end, text: raw.endsWith('\r') ? raw.slice(0, -1) : raw });
      start = i + 1;
      line += 1;
    }
  }
  return ranges;
}

function walkFiles(root, options = {}) {
  const includePatterns = compilePatterns(options.include);
  const excludePatterns = compilePatterns(options.exclude);
  const files = [];

  function walk(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }

    for (const entry of entries) {
      if (DEFAULT_IGNORES.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      const relPath = normalizeSlash(path.relative(root, fullPath));
      if (matchesAny(relPath, excludePatterns)) continue;

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (!entry.isFile()) continue;
      if (includePatterns.length && !matchesAny(relPath, includePatterns)) continue;
      if (BINARY_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;

      try {
        const stat = fs.statSync(fullPath);
        if (stat.size > MAX_FILE_SIZE) continue;
      } catch { continue; }

      files.push({ fullPath, relPath });
      if (files.length >= MAX_FILES) return;
    }
  }

  walk(root);
  return files;
}

export function searchWorkspace(root, options = {}) {
  const ripgrepResult = searchWorkspaceWithRipgrep(root, options);
  if (ripgrepResult) return ripgrepResult;
  const query = String(options.query || '');
  const searchRegex = makeSearchRegex(query, options);
  const results = [];
  let totalMatches = 0;
  let truncated = false;

  for (const file of walkFiles(root, options)) {
    if (totalMatches >= MAX_MATCHES) { truncated = true; break; }
    let text;
    try { text = fs.readFileSync(file.fullPath, 'utf-8'); } catch { continue; }

    const matches = [];
    searchRegex.lastIndex = 0;
    let match;
    while ((match = searchRegex.exec(text)) !== null) {
      if (match[0] === '') searchRegex.lastIndex += 1;
      const index = match.index;
      const lineStart = text.lastIndexOf('\n', index - 1) + 1;
      const lineEndRaw = text.indexOf('\n', index);
      const lineEnd = lineEndRaw === -1 ? text.length : lineEndRaw;
      const lineTextRaw = text.slice(lineStart, lineEnd);
      const lineText = lineTextRaw.endsWith('\r') ? lineTextRaw.slice(0, -1) : lineTextRaw;
      const line = text.slice(0, lineStart).split('\n').length;
      matches.push({
        line,
        column: index - lineStart + 1,
        length: match[0].length,
        preview: lineText,
      });
      totalMatches += 1;
      if (totalMatches >= MAX_MATCHES) { truncated = true; break; }
    }

    if (matches.length) results.push({ path: file.relPath, matches });
  }

  return { results, totalMatches, truncated, engine: 'node' };
}

function searchWorkspaceWithRipgrep(root, options) {
  const query = String(options.query || '');
  if (!query) return null;
  const args = ['--json', '--line-number', '--max-filesize', '1M', '--hidden'];
  if (!options.regex) args.push('--fixed-strings');
  if (!options.matchCase) args.push('--ignore-case');
  if (options.wholeWord) args.push('--word-regexp');
  for (const ignored of DEFAULT_IGNORES) args.push('--glob', `!${ignored}/**`);
  for (const pattern of String(options.include || '').split(',').map(value => value.trim()).filter(Boolean)) {
    args.push('--glob', pattern);
  }
  for (const pattern of String(options.exclude || '').split(',').map(value => value.trim()).filter(Boolean)) {
    args.push('--glob', `!${pattern}`);
  }
  args.push('--', query, '.');

  let output;
  try {
    output = execFileSync('rg', args, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  } catch (error) {
    if (error?.status === 1 && error?.stdout === '') return { results: [], totalMatches: 0, truncated: false, engine: 'ripgrep' };
    return null;
  }

  const grouped = new Map();
  let totalMatches = 0;
  let truncated = false;
  for (const line of output.split('\n')) {
    if (!line) continue;
    let event;
    try { event = JSON.parse(line); } catch { continue; }
    if (event.type !== 'match') continue;
    const data = event.data;
    const relPath = normalizeSlash(data.path?.text || '');
    const preview = String(data.lines?.text || '').replace(/\r?\n$/, '');
    const matches = grouped.get(relPath) || [];
    for (const submatch of data.submatches || []) {
      matches.push({
        line: Number(data.line_number || 1),
        column: Number(submatch.start || 0) + 1,
        length: Math.max(1, Number(submatch.end || 0) - Number(submatch.start || 0)),
        preview,
      });
      totalMatches += 1;
      if (totalMatches >= MAX_MATCHES) {
        truncated = true;
        break;
      }
    }
    grouped.set(relPath, matches);
    if (truncated) break;
  }
  return {
    results: [...grouped].map(([filePath, matches]) => ({ path: filePath, matches })),
    totalMatches,
    truncated,
    engine: 'ripgrep',
  };
}

export function replaceWorkspace(root, options = {}) {
  const replacement = String(options.replacement ?? '');
  const searchRegex = makeSearchRegex(String(options.query || ''), options);
  const changedFiles = [];
  let totalReplacements = 0;

  for (const file of walkFiles(root, options)) {
    let text;
    try { text = fs.readFileSync(file.fullPath, 'utf-8'); } catch { continue; }
    searchRegex.lastIndex = 0;
    let count = 0;
    const nextText = text.replace(searchRegex, () => {
      count += 1;
      return replacement;
    });
    if (count > 0 && nextText !== text) {
      fs.writeFileSync(file.fullPath, nextText, 'utf-8');
      changedFiles.push({ path: file.relPath, replacements: count });
      totalReplacements += count;
    }
  }

  return { changedFiles, totalReplacements };
}

export function replaceWorkspaceMatch(root, options = {}) {
  const fullPath = path.resolve(root, String(options.path || ''));
  const relative = path.relative(root, fullPath);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Invalid match path');
  const text = fs.readFileSync(fullPath, 'utf8');
  const lines = text.split('\n');
  const lineIndex = Number(options.line) - 1;
  const columnIndex = Number(options.column) - 1;
  const length = Number(options.length);
  if (!Number.isInteger(lineIndex) || !Number.isInteger(columnIndex) || !Number.isInteger(length) || !lines[lineIndex]) {
    throw new Error('Invalid match location');
  }
  const line = lines[lineIndex];
  const expected = String(options.expected || '');
  if (line.slice(columnIndex, columnIndex + length) !== expected) throw new Error('Search result is stale');
  lines[lineIndex] = `${line.slice(0, columnIndex)}${String(options.replacement ?? '')}${line.slice(columnIndex + length)}`;
  fs.writeFileSync(fullPath, lines.join('\n'), 'utf8');
  return { path: normalizeSlash(relative), replacements: 1 };
}
