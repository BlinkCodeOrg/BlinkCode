# BlinkCode Extensions

BlinkCode combines a bundled offline catalog with a public GitHub-backed
marketplace. It does not require a marketplace website, BlinkCode account or
custom marketplace server. The IDE reads the official registry from
`BlinkCodeOrg/blinkcode-extensions` through `raw.githubusercontent.com`.

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

Install it into the current user's local marketplace while developing:

```bash
bcode install
```

Installation validates and activates the package in the sandbox, then copies
it into the current user's BlinkCode marketplace. The IDE combines this local
catalog with bundled and remote extensions.

Use a private catalog:

```bash
bcode install --marketplace D:\team\blinkcode-marketplace
```

The `BCODE_MARKETPLACE` environment variable provides the same override.

To publish for every BlinkCode user, fork and clone the official catalog, then
prepare a reviewed submission:

```bash
git clone https://github.com/YOUR_NAME/blinkcode-extensions.git
bcode publish . --catalog ../blinkcode-extensions
```

Commit the generated `marketplace/` changes, push the branch and open a pull
request to `BlinkCodeOrg/blinkcode-extensions`. After CI and review pass, the
merged package becomes visible in the IDE. Installing it downloads the four
declared package files over HTTPS, validates file sizes, manifest paths, icon
safety, permissions and sandbox activation, then atomically stores the package
under the user's BlinkCode data directory. Installed packages remain available
offline.

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
6. Clone your fork of `BlinkCodeOrg/blinkcode-extensions`.
7. Run `bcode publish . --catalog <catalog checkout>`.
8. Review the generated marketplace diff and open a pull request.

The IDE reads the merged official catalog from GitHub Raw. Packages are
downloaded over HTTPS, validated and cached locally for offline use.

## Architecture

- `server/extensions` validates, activates and manages packages.
- `extensions/marketplace` is the built-in offline registry.
- `BlinkCodeOrg/blinkcode-extensions` is the public remote registry and package source.
- `extensions-state.json` stores install and enable state outside the workspace.
- `src/features/extensions` owns client state and feature availability.
- `src/components/ExtensionsPanel` renders the marketplace UI.
- `@lovlydev/blinkcode-cli` is maintained in the separate `BlinkCodeOrg/blinkcode-cli` repository.

Design references:

- [VS Code extension manifest](https://code.visualstudio.com/api/references/extension-manifest)
- [VS Code contribution points](https://code.visualstudio.com/api/references/contribution-points)
- [VS Code extension host](https://code.visualstudio.com/api/advanced-topics/extension-host)
