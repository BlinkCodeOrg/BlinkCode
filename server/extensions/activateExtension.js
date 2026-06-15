import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ACTION_TYPES = new Set(['showMessage', 'openSettings']);

export function activateExtension(extensionDirectory, manifest) {
  const mainPath = path.resolve(extensionDirectory, manifest.main);
  const relativeMain = path.relative(path.resolve(extensionDirectory), mainPath);
  if (relativeMain.startsWith('..') || path.isAbsolute(relativeMain)) {
    throw new Error('Extension main escapes its package');
  }
  const source = fs.readFileSync(mainPath, 'utf8');
  if (Buffer.byteLength(source) > 128 * 1024) throw new Error('Extension main is too large');

  const features = new Set();
  const commands = new Map();
  const api = Object.freeze({
    registerFeature(feature) {
      const permission = `feature:${feature}`;
      if (!manifest.permissions.includes(permission)) {
        throw new Error(`Missing permission: ${permission}`);
      }
      features.add(feature);
    },
    registerCommand(command, action) {
      if (!manifest.permissions.includes('commands')) throw new Error('Missing permission: commands');
      if (!command || typeof command !== 'string') throw new Error('Invalid command id');
      if (!action || !ACTION_TYPES.has(action.type)) throw new Error('Unsupported command action');
      commands.set(command, structuredClone(action));
    },
  });
  const context = vm.createContext(
    { blinkcode: api },
    { codeGeneration: { strings: false, wasm: false }, name: manifest.id },
  );
  const script = new vm.Script(`"use strict";\n${source}`, {
    filename: `${manifest.id}/${manifest.main}`,
  });
  script.runInContext(context, { timeout: 100 });
  return { commands, features };
}
