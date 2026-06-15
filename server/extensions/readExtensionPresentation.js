import fs from 'node:fs';
import path from 'node:path';

const MIME_BY_EXTENSION = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function directorySize(directory) {
  let bytes = 0;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const entryPath = path.join(directory, entry.name);
    bytes += entry.isDirectory() ? directorySize(entryPath) : fs.statSync(entryPath).size;
  }
  return bytes;
}

function resolvePackageFile(directory, fileName) {
  const filePath = path.resolve(directory, fileName);
  const relative = path.relative(path.resolve(directory), filePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Extension asset escapes its package');
  return filePath;
}

export function readExtensionPresentation(directory, manifest) {
  const readmePath = resolvePackageFile(directory, manifest.readme);
  const iconPath = resolvePackageFile(directory, manifest.icon);
  const readme = fs.readFileSync(readmePath, 'utf8');
  if (Buffer.byteLength(readme) > 512 * 1024) throw new Error('Extension README is too large');
  const icon = fs.readFileSync(iconPath);
  if (icon.byteLength > 256 * 1024) throw new Error('Extension icon is too large');
  if (path.extname(iconPath).toLowerCase() === '.svg') {
    const source = icon.toString('utf8');
    if (/<script|<foreignObject|\son\w+=|javascript:|(?:href|src)\s*=\s*["']https?:\/\//i.test(source)) {
      throw new Error('Extension SVG icon contains unsafe content');
    }
  }
  const mime = MIME_BY_EXTENSION[path.extname(iconPath).toLowerCase()];
  return {
    cacheSizeBytes: Buffer.byteLength(readme) + icon.byteLength,
    iconDataUrl: `data:${mime};base64,${icon.toString('base64')}`,
    packageSizeBytes: directorySize(directory),
    readme,
  };
}
