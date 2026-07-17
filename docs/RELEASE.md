# Release Process

1. Move completed entries from `Unreleased` in `CHANGELOG.md` into a versioned section.
2. Update the version in `package.json` and `package-lock.json`.
3. Run:

```bash
npm run release:check
```

4. Build platform artifacts:

```bash
npm run dist:win
npm run dist:mac
npm run dist:linux
```

5. Verify the platform files in `release/`:

- `BlinkCode-Setup-<version>-x64.exe`
- `BlinkCode-Portable-<version>-x64.exe`
- `BlinkCode-<version>-<arch>.dmg`
- `BlinkCode-<version>-<arch>.zip`
- `BlinkCode-<version>-<arch>.AppImage`
- `BlinkCode-<version>-<arch>.deb`
- `latest.yml`, `latest-mac.yml` and `latest-linux.yml`

6. Test a clean launch on Windows, macOS and Linux, workspace opening, file save, terminal startup, NPM Scripts, updater check and update-safe SQLite migration.
7. Push a `v*` tag. The release workflow creates the GitHub Release when needed and uploads every installer, archive, updater YAML and blockmap with overwrite-safe semantics.

## Signing and notarization secrets

The workflow works unsigned without repository secrets. Configure these GitHub Actions secrets for signed production releases:

- `WIN_CSC_LINK`: base64 certificate data or a secure URL accepted by electron-builder.
- `WIN_CSC_KEY_PASSWORD`: password for the Windows code-signing certificate.
- `MAC_CSC_LINK`: base64 `.p12` certificate data or a secure URL accepted by electron-builder.
- `MAC_CSC_KEY_PASSWORD`: password for the macOS signing certificate.
- `APPLE_API_KEY_DATA`: base64-encoded App Store Connect API `.p8` key.
- `APPLE_API_KEY_ID`: App Store Connect API key ID.
- `APPLE_API_ISSUER`: App Store Connect issuer UUID.

`GITHUB_TOKEN` is supplied by Actions and must not be added manually. The workflow grants only `contents: write` so it can create a release and upload assets.

## Updater assets

Before publishing, verify `latest.yml`, `latest-mac.yml`, `latest-linux.yml`, every generated `.blockmap`, Windows setup/portable executables, macOS DMG/ZIP, and Linux AppImage/DEB/RPM files in both the Release and Actions artifacts.

The built-in updater is intentionally disabled for development, portable or unpacked Windows builds, Flatpak, DEB and RPM installs. Linux automatic installation is available to AppImage builds; the other Linux formats remain release assets for manual/package-manager installation. Use `npm run electron:mock-updates` for local UI testing; its mock bridge is enabled only when the app is unpackaged and `BLINKCODE_UPDATE_MOCK=1`.

Do not publish a release when `npm run quality:full` or `npm run release:check` fails.
