import fs from 'fs';
import path from 'path';
import { resolveWorkspacePath } from './pathSafety.js';

function globToRegExp(pattern) {
  const escaped = pattern.replace(/[.+^$()|[\]\\]/g, '\\$&');
  const source = escaped
    .replace(/\*\*/g, '\u0000')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]')
    .replace(/\u0000/g, '.*')
    .replace(/\{([^}]+)\}/g, (_match, alternatives) => `(${alternatives.replace(/,/g, '|')})`);
  return new RegExp(`^${source}$`, 'i');
}

export function parseEditorConfig(content) {
  const result = { root: false, sections: [] };
  let current = null;
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith(';')) continue;
    const section = line.match(/^\[(.+)]$/);
    if (section) {
      current = { pattern: section[1].replace(/\\/g, '/'), properties: {} };
      result.sections.push(current);
      continue;
    }
    const separator = line.indexOf('=');
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim().toLowerCase();
    if (!current && key === 'root') result.root = value === 'true';
    else if (current) current.properties[key] = value;
  }
  return result;
}

function matchesSection(pattern, relativePath) {
  const normalized = relativePath.replace(/\\/g, '/');
  const target = pattern.includes('/') ? normalized : path.posix.basename(normalized);
  return globToRegExp(pattern).test(target);
}

export function resolveEditorConfig(root, requestedPath) {
  const filePath = resolveWorkspacePath(root, requestedPath);
  if (!filePath) throw new Error('INVALID_PATH');
  const configs = [];
  let directory = path.dirname(filePath);
  while (directory === root || directory.startsWith(`${root}${path.sep}`)) {
    const configPath = path.join(directory, '.editorconfig');
    if (fs.existsSync(configPath)) {
      const parsed = parseEditorConfig(fs.readFileSync(configPath, 'utf8'));
      configs.unshift({ directory, parsed });
      if (parsed.root) break;
    }
    if (directory === root) break;
    directory = path.dirname(directory);
  }

  const properties = {};
  for (const config of configs) {
    const relative = path.relative(config.directory, filePath).replace(/\\/g, '/');
    for (const section of config.parsed.sections) {
      if (matchesSection(section.pattern, relative)) Object.assign(properties, section.properties);
    }
  }
  return properties;
}
