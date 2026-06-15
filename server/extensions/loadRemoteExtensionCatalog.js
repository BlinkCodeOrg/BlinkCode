import { fetchRemoteFile } from './fetchRemoteFile.js';
import { resolveRemotePackageUrl } from './resolveRemotePackageUrl.js';
import { validateExtensionManifest } from './validateExtensionManifest.js';

const MIME_BY_EXTENSION = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  webp: 'image/webp',
};

function validateRegistry(value) {
  if (value?.schemaVersion !== 1 || !Array.isArray(value.extensions)) {
    throw new Error('Invalid remote extension marketplace registry');
  }
  return value;
}

function validateIcon(icon, fileName) {
  if (icon.byteLength > 256 * 1024) throw new Error('Extension icon is too large');
  if (/\.svg$/i.test(fileName)) {
    const source = icon.toString('utf8');
    if (/<script|<foreignObject|\son\w+=|javascript:|(?:href|src)\s*=\s*["']https?:\/\//i.test(source)) {
      throw new Error('Extension SVG icon contains unsafe content');
    }
  }
}

export async function loadRemoteExtensionCatalog(registryUrl, options = {}) {
  const fetchOptions = { fetchImpl: options.fetchImpl };
  const registry = validateRegistry(await fetchRemoteFile(registryUrl, {
    ...fetchOptions,
    limit: 256 * 1024,
    responseType: 'json',
  }));

  return Promise.all(registry.extensions.map(async entry => {
    if (typeof entry?.id !== 'string' || typeof entry?.directory !== 'string') {
      throw new Error('Invalid remote marketplace entry');
    }
    const manifestBuffer = await fetchRemoteFile(
      resolveRemotePackageUrl(registryUrl, entry.directory, 'bcode.json'),
      { ...fetchOptions, limit: 128 * 1024 },
    );
    const manifest = validateExtensionManifest(JSON.parse(manifestBuffer.toString('utf8')));
    if (manifest.id !== entry.id) throw new Error(`Registry id mismatch for ${entry.id}`);
    const [readmeBuffer, icon] = await Promise.all([
      fetchRemoteFile(resolveRemotePackageUrl(registryUrl, entry.directory, manifest.readme), {
        ...fetchOptions,
        limit: 512 * 1024,
      }),
      fetchRemoteFile(resolveRemotePackageUrl(registryUrl, entry.directory, manifest.icon), {
        ...fetchOptions,
        limit: 256 * 1024,
      }),
    ]);
    validateIcon(icon, manifest.icon);
    const extension = manifest.icon.split('.').at(-1).toLowerCase();
    const mime = MIME_BY_EXTENSION[extension];
    return {
      directory: null,
      entry,
      manifest,
      remote: {
        directory: entry.directory,
        registryUrl,
      },
      presentation: {
        cacheSizeBytes: readmeBuffer.byteLength + icon.byteLength,
        iconDataUrl: `data:${mime};base64,${icon.toString('base64')}`,
        packageSizeBytes: Number(entry.packageSizeBytes || 0),
        readme: readmeBuffer.toString('utf8'),
      },
    };
  }));
}
