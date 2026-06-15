import fs from 'node:fs';
import path from 'node:path';
import { activateExtension } from './activateExtension.js';
import { readExtensionState } from './readExtensionState.js';
import { writeExtensionState } from './writeExtensionState.js';
import { readExtensionPresentation } from './readExtensionPresentation.js';
import { readExtensionManifest } from './readExtensionManifest.js';

export function createExtensionService({ marketplaceRoots, statePath }) {
  function readCatalog() {
    const byId = new Map();
    for (const marketplaceRoot of marketplaceRoots) {
      const registryPath = path.join(marketplaceRoot, 'marketplace.json');
      if (!fs.existsSync(registryPath)) continue;
      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      if (registry.schemaVersion !== 1 || !Array.isArray(registry.extensions)) {
        throw new Error('Invalid extension marketplace registry');
      }
      for (const entry of registry.extensions) {
        const directory = path.resolve(marketplaceRoot, entry.directory);
        const relative = path.relative(path.resolve(marketplaceRoot), directory);
        if (relative.startsWith('..') || path.isAbsolute(relative)) {
          throw new Error('Extension directory escapes the marketplace');
        }
        const manifest = readExtensionManifest(directory);
        if (manifest.id !== entry.id) throw new Error(`Registry id mismatch for ${entry.id}`);
        byId.set(manifest.id, { directory, entry, manifest });
      }
    }
    return [...byId.values()];
  }

  function defaultState(catalog) {
    return {
      schemaVersion: 1,
      installed: Object.fromEntries(
        catalog
          .filter(item => item.entry.defaultInstalled)
          .map(item => [item.manifest.id, {
            enabled: true,
            installedAt: item.manifest.publishedAt,
            version: item.manifest.version,
          }]),
      ),
    };
  }

  function snapshot() {
    const catalog = readCatalog();
    const state = readExtensionState(statePath, defaultState(catalog));
    const activeFeatures = new Set();
    const commands = [];
    const extensions = catalog.map(item => {
      const installed = state.installed?.[item.manifest.id];
      let error = null;
      if (installed?.enabled) {
        try {
          const activation = activateExtension(item.directory, item.manifest);
          activation.features.forEach(feature => activeFeatures.add(feature));
          for (const [command, action] of activation.commands) {
            const declaration = item.manifest.contributes?.commands?.find(value => value.command === command);
            if (declaration) commands.push({ ...declaration, command, extensionId: item.manifest.id, action });
          }
        } catch (activationError) {
          error = activationError?.message || 'Extension activation failed';
        }
      }
      return {
        ...item.manifest,
        ...readExtensionPresentation(item.directory, item.manifest),
        featured: Boolean(item.entry.featured),
        installed: Boolean(installed),
        installedAt: installed?.installedAt || null,
        enabled: Boolean(installed?.enabled),
        activationError: error,
      };
    });
    return { activeFeatures: [...activeFeatures].sort(), commands, extensions };
  }

  function update(id, operation) {
    const catalog = readCatalog();
    const item = catalog.find(extension => extension.manifest.id === id);
    if (!item) throw new Error('Extension not found');
    const state = readExtensionState(statePath, defaultState(catalog));
    state.installed ||= {};
    if (operation === 'install') {
      state.installed[id] = { enabled: true, installedAt: new Date().toISOString(), version: item.manifest.version };
    } else if (operation === 'uninstall') {
      delete state.installed[id];
    } else {
      if (!state.installed[id]) throw new Error('Extension is not installed');
      state.installed[id].enabled = operation === 'enable';
    }
    writeExtensionState(statePath, state);
    return snapshot();
  }

  return {
    disable: id => update(id, 'disable'),
    enable: id => update(id, 'enable'),
    install: id => update(id, 'install'),
    list: snapshot,
    uninstall: id => update(id, 'uninstall'),
  };
}
