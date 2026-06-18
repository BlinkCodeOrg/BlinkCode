# BlinkCode Project Inventory

This document records features that are present in the codebase, including areas that were not fully reflected in the existing feature documentation when this inventory was created.

## Product Positioning

BlinkCode is a desktop JavaScript/Web IDE focused on React, Vite, TypeScript, Tailwind, local web-app workflows, embedded preview, Git, REST requests, AI assistance, and package scripts.

## Main UI Areas

- Top header with project search/quick-open command center, open-folder action, terminal toggle, AI toggle, and custom window controls.
- Activity bar with Explorer, Search, Source Control, Debug, and Web App Center entries.
- Explorer sidebar with workspace tree, recent projects, create/rename/delete, drag-and-drop, file icons, Git decorations, and multi-root workspace support.
- Editor shell based on Monaco with tabs, breadcrumbs, empty state, image preview, markdown preview, diff preview, and large-file preview.
- Bottom panel with Terminal, Problems, Output, and Debug Console tabs.
- Status bar with Git branch, diagnostic counts, LSP status, formatting/indentation, cursor position, encoding, and language.

## Editor And Language Features

- Monaco-based editor for supported source and config files.
- Real LSP bridge over WebSocket for TypeScript, JavaScript, TSX, JSX, HTML, CSS, SCSS, LESS, JSON, and JSONC.
- LSP-backed completion, hover, definition, references, rename, signature help, document symbols, formatting, code actions, and diagnostics.
- Built-in Monaco TS/JS/HTML/CSS/JSON services are disabled where real LSP is used.
- Tailwind tooling: class completion, hover previews, unknown-class diagnostics, and class sorting action.
- Schema tooling for common config files including launch config, package.json, tsconfig, ESLint config, deploy config, GitHub workflows, and Docker Compose.
- `.env` tooling with dotenv language mode, diagnostics for invalid/duplicate variables, and optional secret masking.
- User snippets managed from Settings and registered as Monaco completion providers.
- Optional AI inline completions for code.
- Spell checker tooling with code actions, available behind settings.

## Web App Center

- Detects web-project metadata from package files and workspace analysis.
- Shows project overview, scripts, preview, templates, dependencies, problems, Git summary, REST shortcuts, and onboarding checklist.
- Supports guided and compact modes.
- Supports preview behavior settings: ask, auto-open, never.
- Tracks first-run checklist by workspace.
- Detects local preview URLs from terminal/server output and keeps last detected preview URL.
- Shows package manager, dev-server scripts, running state, and script actions.
- Includes dependency manager for package install/update/remove flows.
- Includes project template entry points and REST helper shortcuts.

## Package Scripts And Dependency Workflow

- Reads npm scripts from package.json files.
- Supports npm, pnpm, Yarn, and Bun command generation.
- Package-manager detection uses explicit `packageManager` first, then lockfiles.
- Runs scripts in integrated terminal instances with run/stop/status UX.
- Dependency manager reads dependencies, filters by package/type, checks outdated packages, and launches package-manager operations.

## Preview Workflow

- Embedded browser preview is implemented with a sandboxed iframe.
- Toolbar supports address input, back/forward, reload, external open, close, and responsive device modes.
- Device modes include responsive, tablet, and mobile.
- Preview can open terminal-detected localhost URLs.
- Preview console panel shows navigation, reload, load/error events, and messages sent from preview apps via `postMessage` with `source: "blinkcode-preview-console"`.

## Terminal

- xterm-based terminal UI.
- Backend PTY sessions over WebSocket.
- Multiple terminal instances with tabs, close actions, active status, cwd tracking, and startup command support.
- Terminal links detect localhost/http URLs and can open them in Browser Preview.
- Terminal theme reads BlinkCode CSS theme variables and uses compact edge padding.

## Git And Source Control

- Git status API with staged, unstaged, untracked, conflicts, branch, and roots.
- Source Control panel with stage, unstage, discard, commit, pull, push, and contextual errors.
- Diff preview for changed files.
- Inline Git decorations in the editor for changed lines.
- Git blame line API and inline blame support.
- Web App Center Git mini-dashboard with branch and change counters.

## REST Client

- `.http` request parsing.
- REST bar inside `.http` files with request selector and send action.
- Backend request execution with status, headers, body, duration, size, and truncation metadata.
- Local REST history.
- Web App Center REST summary and helper actions for creating `.http` and env examples.

## Debugging

- Debug panel for Node/JavaScript debugging.
- Launch configuration discovery and creation.
- Start current JS file or configured debug session.
- Attach to inspector endpoint.
- Continue/pause/step commands.
- Variables, watch expressions, call stack, breakpoints, conditional breakpoints, and debug console.
- Bottom panel includes a debug console entry point.

## AI Features

- AI provider status checks for OpenAI-compatible providers.
- AI chat panel with active-file/project context.
- AI quick actions exposed in editor context/actions and Command Palette.
- Agent planning and tool execution flow with approval/preview paths.
- Inline completion provider gated by runtime setting.

## Project Templates

- React + Vite + TypeScript.
- React + Vite + Tailwind.
- React + Tailwind + Router.
- Landing Page.
- API Client App with `.env.example`, `requests.http`, and `src/api.ts`.
- React + Express API full-stack starter.
- Component Playground.

## Extensions

- Extension panel and extension marketplace APIs.
- Extension state supports install, update, enable, disable, and uninstall operations.
- Local marketplace packages include Markdown Preview, Spell Checker, and Theme Import examples.
- Extension manifest validation and remote package install service exist on the backend.

## Settings And Appearance

- English/Russian language setting.
- Dark/light/system color scheme.
- Built-in themes: Tokyo Night, Everforest, Ayu, Catppuccin, Catppuccin Macchiato, Gruvbox, Kanagawa, Nord, Matrix, One Dark, AMOLED, plus imported VS Code theme support.
- Theme import button and VS Code theme conversion path.
- UI density, UI scale, Explorer row height, bottom panel position, panel widths, activity bar ordering/visibility.
- Editor settings: font size, font family, tab size, word wrap, minimap, sticky scroll, autosave, ligatures, cursor style, whitespace rendering, bracket pair colorization, auto-closing brackets, smooth scrolling, trim trailing whitespace, insert final newline, insert spaces.
- Web workflow settings: preview behavior and guided/compact mode.
- Snippets settings tab.
- Keybindings settings tab with custom key recording.

## File Handling And Safety

- Centralized supported file rules.
- Binary, archive, document, media, font, generated, and large-file handling.
- Large file preview endpoint.
- Image preview with zoom/pan state.
- Markdown preview virtual tab.
- Recovery buffers for unsaved/dirty file state.
- Trash endpoint for safer delete flow.
- Path-safety helpers on the backend.
- Upload-folder flow skips heavy/generated directories like `node_modules`, `.git`, `dist`, `.next`, `.nuxt`, caches, and virtualenv folders.

## Backend And Desktop Integration

- Express backend with REST APIs for tree, files, search, settings, state, Git, LSP, PTY, debugger, REST client, AI, extensions, dependencies, recovery buffers, and web workflow analysis.
- File-system watcher keeps workspace state updated.
- Electron main process starts/coordinates backend and renderer.
- Preload bridge for desktop-only APIs.
- Secret storage IPC writes to app userData.
- Auto-updater IPC exists for checking/installing updates.
- electron-builder packaging for Windows setup/portable, macOS dmg/zip, and Linux AppImage/deb.

## Quality And Tests

- Typecheck, lint, quality, unit, e2e, debugger unit/e2e, and release-check scripts.
- Unit tests cover workspace roots, Tailwind, sidebar filter, schema tooling, REST client, problem limits, file operations, extensions, Git decorations, editor state, dependency manager, debugger, API responses, and AI.
- Quality tests cover UI system, project templates, performance, localization scan, extension security, distribution security, and architecture.

## Documentation Gaps Found

- Debug panel functionality existed in code but was not described in the main feature list.
- Extension marketplace/service existed in code but was not described in the main feature list.
- Web App Center details were broader than the existing docs described.
- REST client history and `.http` execution details were only lightly described.
- Project templates list was not fully documented.
- Settings coverage was broader than documented, especially UI density/scale, panel layout, activity bar customization, snippets, keybindings, imported themes, and web workflow settings.
- Env tooling, schema tooling, snippets, spell checker, recovery buffers, markdown/image/large-file previews, and upload-folder safety were under-documented.
- Browser preview documentation referred to `<webview>`, while the current implementation uses a sandboxed iframe.
