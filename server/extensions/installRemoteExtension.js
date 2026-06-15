import fs from 'node:fs';
import path from 'node:path';
import { activateExtension } from './activateExtension.js';
import { fetchRemoteFile } from './fetchRemoteFile.js';
import { readExtensionManifest } from './readExtensionManifest.js';
import { readExtensionPresentation } from './readExtensionPresentation.js';
import { resolveRemotePackageUrl } from './resolveRemotePackageUrl.js';

const FILE_LIMITS = {
  icon: 256 * 1024,
  main: 128 * 1024,
  manifest: 128 * 1024,
  readme: 512 * 1024,
};

export async function installRemoteExtension(item, marketplaceRoot, options = {}) {
  const folderName = item.manifest.id.replace(/\./g, '-');
  const destination = path.resolve(marketplaceRoot, folderName);
  const root = path.resolve(marketplaceRoot);
  if (path.relative(root, destination).startsWith('..')) {
    throw new Error('Extension destination escapes the marketplace');
  }

  fs.mkdirSync(root, { recursive: true });
  const temporary = fs.mkdtempSync(path.join(root, '.install-'));
  try {
    const files = [
      ['bcode.json', 'manifest'],
      [item.manifest.main, 'main'],
      [item.manifest.readme, 'readme'],
      [item.manifest.icon, 'icon'],
    ];
    for (const [fileName, kind] of files) {
      const content = await fetchRemoteFile(
        resolveRemotePackageUrl(item.remote.registryUrl, item.remote.directory, fileName),
        { fetchImpl: options.fetchImpl, limit: FILE_LIMITS[kind] },
      );
      fs.writeFileSync(path.join(temporary, fileName), content);
    }

    const manifest = readExtensionManifest(temporary);
    if (manifest.id !== item.manifest.id || manifest.version !== item.manifest.version) {
      throw new Error('Downloaded extension does not match the marketplace entry');
    }
    readExtensionPresentation(temporary, manifest);
    activateExtension(temporary, manifest);

    fs.rmSync(destination, { recursive: true, force: true });
    fs.renameSync(temporary, destination);
    const registryPath = path.join(root, 'marketplace.json');
    const registry = fs.existsSync(registryPath)
      ? JSON.parse(fs.readFileSync(registryPath, 'utf8'))
      : { schemaVersion: 1, extensions: [] };
    if (registry.schemaVersion !== 1 || !Array.isArray(registry.extensions)) {
      throw new Error('Invalid local extension marketplace registry');
    }
    registry.extensions = [
      ...registry.extensions.filter(entry => entry.id !== manifest.id),
      {
        id: manifest.id,
        directory: folderName,
        featured: Boolean(item.entry.featured),
        defaultInstalled: false,
      },
    ].sort((left, right) => left.id.localeCompare(right.id));
    fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
    return destination;
  } catch (error) {
    fs.rmSync(temporary, { recursive: true, force: true });
    throw error;
  }
}
