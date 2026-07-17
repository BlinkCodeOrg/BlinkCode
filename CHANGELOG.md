# Changelog

All notable BlinkCode changes are documented in this file.

## [Unreleased]

## [1.4.0] - 2026-07-17

### Added

- Added a complete in-app update flow with automatic checks, download progress, retry handling, installation and a one-time post-update effect.
- Added an animated New Update Available banner to the sidebar and full update controls to General Settings.
- Added a persistent Auto Update preference that immediately controls background downloads.
- Added development-only updater mocks and automated coverage for every update state.

### Changed

- Rebuilt the GitHub Actions release pipeline to publish Windows, macOS and Linux packages, portable builds and updater metadata from `v*` tags.
- Expanded electron-builder packaging and GitHub publishing configuration for safe, repeatable cross-platform releases.
- Disabled the built-in updater for development, unpacked and portable Windows builds, Flatpak, DEB and RPM packages.

## [1.3.5] - 2026-06-22

### Changed

- Polished the IDE shell with stronger default contrast, quieter header behavior on narrow windows, clearer empty states, Browser Preview recent URL history, terminal status badges and extra Problems quick actions.

## [1.1.0] - 2026-06-17

### Added

- Added Web App Center as the main React/Vite workspace panel with scripts, preview, problems, Git, REST and template entry points.
- Added guided first-run progress for web projects with per-workspace persistence.
- Added local preview URL persistence so the preview action survives app restarts.
- Added settings for Web App Center preview behavior and guided or compact mode.
- Added React/Vite/Tailwind-focused project templates for MVP, landing, API and full-stack starts.

### Changed

- Polished Web App Center spacing, tabs, cards and buttons to match the existing sidebar style.
- Reduced noisy framework badges and internal wording from the daily Web App Center view.
- Improved local dev server detection from terminal output and preview handoff.
- Preferred npm when package-lock.json or package.json packageManager indicates npm.

## [1.0.1] - 2026-06-16

### Changed

- Paused the Extensions marketplace in the IDE to keep BlinkCode lighter and avoid requiring GitHub or server-backed extension distribution.
- Kept Markdown Preview, Spell Checker and Theme Import available as first-party IDE features.
- Removed the paused extension catalog from packaged desktop builds.

## [1.0.0] - 2026-06-15

### Added

- AI quick actions with reviewed, single-use approvals for mutating tools.
- Multi-root workspaces with persisted additional folders.
- OS-backed encrypted secret storage for desktop credentials.
- Automatic update checks through GitHub Releases.
- macOS and Linux packaging and release jobs.

## [0.4.0] - 2026-06-14

- Initial public BlinkCode desktop release workflow.
