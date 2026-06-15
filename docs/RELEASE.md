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
7. Create release notes from the matching `CHANGELOG.md` section and attach the generated artifacts.

Do not publish a release when `npm run quality:full` or `npm run release:check` fails.
