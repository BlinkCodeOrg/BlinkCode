# BlinkCode Extensions

BlinkCode ships a local extension marketplace. It does not require a marketplace website or a user account. The catalog is bundled with the application and can be opened from the Extensions icon in the Activity Bar.

The first bundled extensions are:

- `blinkcode.spell-checker`
- `blinkcode.markdown-preview`
- `blinkcode.theme-import`

They live in separate package folders under `extensions/marketplace`. The sidebar intentionally stays compact; selecting a package opens a full editor tab with its icon, publisher, version, permissions, commands and rendered README.

## Install the CLI

The extension CLI is a standalone npm package and works from any terminal, project or editor:

```bash
npm install -g @lovlydev/blinkcode-cli
bcode --help
```

When developing BlinkCode before the CLI package is published to npm:

```bash
npm install -g @lovlydev/blinkcode-cli
```

That installs the local CLI package globally on the current machine; afterward `bcode` works from any directory.

During repository development it can also be run without a global install:

```bash
npm run bcode -- --help
```

## Package layout

```text
my-extension/
  bcode.json
  extension.js
  README.md
  icon.svg
```

Create a package:

```bash
bcode create my-name.my-extension
cd my-name-my-extension
```

Validate it:

```bash
bcode validate
```

Publish it into the repository-backed local marketplace:

```bash
bcode publish
```

Publishing validates and activates the package in the sandbox, then copies it into the current user's BlinkCode marketplace. The IDE combines this catalog with its bundled extensions, so publishing works even when the command is launched outside BlinkCode.

Use a private catalog:

```bash
bcode publish --marketplace D:\team\blinkcode-marketplace
```

The `BCODE_MARKETPLACE` environment variable provides the same override.

## Manifest

`bcode.json` is the package contract. The legacy `blinkcode-extension.json` name is still accepted:

```json
{
  "schemaVersion": 1,
  "id": "my-name.my-extension",
  "name": "my-extension",
  "displayName": "My Extension",
  "publisher": "my-name",
  "version": "0.1.0",
  "description": "A focused BlinkCode extension.",
  "main": "extension.js",
  "readme": "README.md",
  "icon": "icon.svg",
  "license": "MIT",
  "publishedAt": "2026-06-14T00:00:00.000Z",
  "lastUpdatedAt": "2026-06-14T00:00:00.000Z",
  "lastReleasedAt": "2026-06-14T00:00:00.000Z",
  "categories": ["Other"],
  "permissions": ["commands"],
  "resources": {
    "repository": "https://github.com/my-name/my-extension",
    "issues": "https://github.com/my-name/my-extension/issues",
    "license": "https://github.com/my-name/my-extension/blob/main/LICENSE",
    "publisher": "https://github.com/my-name",
    "marketplace": "https://github.com/my-name/my-extension"
  },
  "contributes": {
    "commands": [
      {
        "command": "my-name.my-extension.hello",
        "title": "Hello from My Extension"
      }
    ]
  }
}
```

The manifest follows the useful parts of the VS Code model: identity, version, entry point, declared permissions, release dates, license, resources and contribution metadata are known before activation. BlinkCode calculates package and cache sizes itself. BlinkCode uses its own API and package format; a VSIX is not executed directly.

## Runtime API

Extension code runs in a restricted `node:vm` context. It does not receive `process`, `require`, filesystem APIs, network APIs or Electron APIs.

```js
blinkcode.registerCommand('my-name.my-extension.hello', {
  type: 'showMessage',
  message: 'Hello from my extension!',
});
```

Available APIs in schema version 1:

- `blinkcode.registerCommand(command, action)`
- `blinkcode.registerFeature(feature)`

Available command actions:

- `showMessage`
- `openSettings`

Available feature contributions:

- `spell-checker`
- `markdown-preview`
- `theme-import`

Every contribution requires a matching permission in the manifest. Activation is time-limited, package paths cannot escape their package directory, source size is bounded, and one failed extension does not stop the rest of the catalog.

## Review and publishing policy

1. Use a globally unique `publisher.extension` id.
2. Request only permissions used by the entry file.
3. Run `bcode validate`.
4. Add unit tests for parsing or non-trivial behavior.
5. Run `npm run quality:full`.
6. Publish with `bcode publish`.
7. Review the generated marketplace diff and submit it to the BlinkCode repository.

Future remote catalogs will use signed archives, but the repository-backed catalog remains supported for private and offline installations.

## Architecture

- `server/extensions` validates, activates and manages packages.
- `extensions/marketplace` is the built-in offline registry.
- `extensions-state.json` stores install and enable state outside the workspace.
- `src/features/extensions` owns client state and feature availability.
- `src/components/ExtensionsPanel` renders the marketplace UI.
- `@lovlydev/blinkcode-cli` is maintained in the separate `BlinkCodeOrg/blinkcode-cli` repository.

Design references:

- [VS Code extension manifest](https://code.visualstudio.com/api/references/extension-manifest)
- [VS Code contribution points](https://code.visualstudio.com/api/references/contribution-points)
- [VS Code extension host](https://code.visualstudio.com/api/advanced-topics/extension-host)
