# BlinkCode Roadmap

BlinkCode is a desktop JavaScript/Web IDE focused on local React, Vite, TypeScript, Tailwind and Node-based development. The product centers the everyday web app loop: edit code, run package scripts, preview local servers, fix diagnostics, test REST requests, review Git changes and use AI assistance with explicit control. This roadmap describes what is implemented, what is planned, and why each feature matters.

The goal of this document is to be readable on GitHub. Detailed implementation notes should live in issues, pull requests, or dedicated technical documents.

## Product focus

BlinkCode should not position itself as a generic replacement for every editor. The sharpest product promise is a focused local IDE for modern JavaScript/Web projects, especially React, Vite, TypeScript and Tailwind workflows.

## Status legend

| Status | Meaning |
| --- | --- |
| [x] Done | Implemented and usable in the app. |
| [ ] In progress | Partially implemented or actively being improved. |
| [ ] Planned | Planned feature that has not been implemented yet. |
| [ ] Future | Long-term idea that needs product and technical validation. |

## Priority legend

| Priority | Meaning |
| --- | --- |
| P0 | Core IDE functionality. |
| P1 | Important feature for daily development. |
| P2 | Quality-of-life or customization improvement. |
| P3 | Long-term platform or ecosystem work. |

---

## 1. Core editor and workspace

These features define BlinkCode as an actual IDE rather than a simple text editor.

### 1.1 Language Server Protocol

- **Priority:** P0
- [x] **Status:** Done
- **Description:** BlinkCode should provide real editor intelligence through language servers instead of only Monaco's basic browser features.
- **Current state:** TypeScript, JavaScript, JSX, TSX, HTML, CSS, SCSS, LESS and JSON language tooling is wired through the backend and Monaco integration.
- **Why it matters:** Developers expect go to definition, references, rename, formatting, diagnostics, hover information and code actions to work consistently.
- **Completed:** Problems support quick fixes and keyboard navigation; Status Bar shows live LSP state and restart; documents recover automatically after reconnect.

### 1.2 Global search and replace

- **Priority:** P0
- [x] **Status:** Done
- **Description:** Add workspace-wide text search and replace with file filters, result previews and safe batch replacement.
- **Current state:** Implemented with a backend recursive search/replace service, `/api/search` and `/api/search/replace` endpoints, a dedicated Search panel, regex/case/whole-word options, include/exclude filters, grouped file results, preview highlighting, click-to-open matches, and replace-all flow.
- **Why it matters:** Local projects quickly become hard to navigate without fast search across all files.
- **Completed:** Added single-match replacement, streamed NDJSON results and automatic `ripgrep` acceleration with a built-in fallback.

### 1.3 Quick Open

- **Priority:** P0
- [x] **Status:** Done
- **Description:** Open files quickly with `Ctrl+P` using fuzzy matching and keyboard navigation.
- **Current state:** The app has a Quick Open UI with file search and Enter-to-open behavior.
- **Why it matters:** Keyboard-first navigation is essential for a productive IDE workflow.
- **Completed:** Recently opened files rank first and `@` searches symbols in the active document.

### 1.4 Command Palette

- **Priority:** P0
- [x] **Status:** Done
- **Description:** Provide a central command launcher with `Ctrl+Shift+P`.
- **Current state:** Commands are searchable and grouped into categories.
- **Why it matters:** A command palette keeps advanced features discoverable without adding too many visible buttons.
- **Completed:** Command history is persisted and recently used commands rank first.

### 1.5 Problems panel

- **Priority:** P0
- [x] **Status:** Done
- **Description:** Show all diagnostics from the current workspace in one panel.
- **Current state:** Reads Monaco/LSP markers every 2 seconds, groups by file, shows errors/warnings/info with severity icons. Filter by All/Errors/Warnings. Click to navigate to exact line. Error and warning counts shown in StatusBar with toggle button.
- **Why it matters:** Inline diagnostics are useful, but large projects need a dedicated list of errors and warnings.
- **Completed:** The panel is resizable and supports keyboard navigation and quick fixes.

### 1.6 File watcher

- **Priority:** P0
- [x] **Status:** Done
- **Description:** Watch workspace file changes and update the UI when files are created, renamed, changed or deleted outside the app.
- **Current state:** Backend file watching is implemented with `chokidar` and frontend updates are delivered over a websocket channel.
- **Why it matters:** The editor must stay in sync with external tools like Git, package managers and terminals.
- **Completed:** Watcher events are batched and dirty external changes show an explicit reload-or-keep-local choice.

### 1.7 Split editor and tab workflow

- **Priority:** P0
- [x] **Status:** Done
- **Description:** Support multiple editor panes and a stronger tab workflow.
- **Current state:** BlinkCode has a split editor mode and tab management features.
- **Why it matters:** Developers often compare files, edit related files side by side, or keep tests and source open together.
- **Completed:** Tabs can be dropped into either pane and split state is restored with the workspace.

### 1.8 SQLite persistence

- **Priority:** P0
- [x] **Status:** Done
- **Description:** Persist IDE state in SQLite instead of relying on a JSON state file.
- **Current state:** `better-sqlite3` stores editor state, settings, recent projects, histories, Monaco view state and crash-recovery buffers. Explicit transactional schema migrations currently advance databases through version 3.
- **Why it matters:** SQLite gives safer writes, structured storage and room for future state like request history, AI context indexes and workspace metadata.
- **Completed:** A pre-migration backup is created and restored automatically when migration fails.

### 1.9 Status bar

- **Priority:** P1
- [x] **Status:** Done
- **Description:** Show useful editor and workspace metadata at the bottom of the app.
- **Current state:** The status bar displays editor-related information such as cursor details, indentation, language and Git branch.
- **Why it matters:** A status bar gives important context without interrupting the workflow.
- **Completed:** Status Bar shows workspace, formatting mode and live LSP state with restart.

---

## 2. Git and source control

Git integration should make BlinkCode useful as a daily development environment without constantly switching to a terminal.

### 2.1 Source Control panel

- **Priority:** P0
- [x] **Status:** Done
- **Description:** Add a dedicated Git panel for changed files, staged files and commits.
- **Why it matters:** Source control is a core IDE feature. Users should be able to review and commit changes visually.
- **Current state:** Source Control panel is implemented end-to-end with backend Git API (`/api/git/status`, `/api/git/stage`, `/api/git/unstage`, `/api/git/discard`, `/api/git/commit`, `/api/git/file-diff`, `/api/git/pull`, `/api/git/push`), staged/unstaged/untracked sections, stage/unstage/discard actions, custom discard confirmation modal, commit input with `Ctrl+Enter`, pull/push actions in header, branch display, auto-refresh, and shared resizable sidebar width.
- **Completed in this cycle:** Added diff preview on file click with reliable side-by-side view, hidden virtual diff nodes from Explorer and Breadcrumb, improved Git error reporting with actionable messages, and pull/push fallback handling for missing upstream/tracking branches.
- **Completed:** Gutter decorations, merge-conflict actions and amend commit are implemented.

### 2.2 Inline diff and gutter indicators

- **Priority:** P0
- [x] **Status:** Done
- **Description:** Display changed lines directly in the editor gutter and provide file diff views.
- **Why it matters:** Developers need to see what changed without opening an external Git tool.
- **Expected behavior:** Added, modified and deleted lines should be highlighted. Users should be able to open a diff against `HEAD`.
- **Current state:** Inline Git decorations are rendered directly in Monaco for added/modified/deleted hunks, including gutter stripes and whole-line highlighting. Untracked files receive immediate local "added" highlighting on open, with cache-assisted re-render when switching between files.
- **Completed in this cycle:** Added backend inline diff API integration, client-side hunk mapping, stable side-by-side diff preview, extracted diff UI into a dedicated component (`DiffPreview`), synchronized pane scrolling, syntax highlighting in diff preview, and improved visual gutter placement.
- **Notes:** Diff preview is opened from Source Control file entries and uses virtual diff tabs with cleaned display paths.

### 2.3 Git blame inline

- **Priority:** P1
- [x] **Status:** Done
- **Description:** Show who last changed a line and when.
- **Why it matters:** Blame information helps understand ownership and history while reading code.
- **Expected behavior:** Show blame details for the current line by default, with optional expanded information on hover.
- **Current state:** Backend endpoint `/api/git/blame-line` is implemented with short-lived cache keyed by workspace + `HEAD` + file + line. Frontend API client is integrated and editor-side inline blame renders author, summary, short SHA, and relative time for the active line.
- **Completed in this cycle:** Added debounce + lazy-load fetching strategy for cursor movement, client-side caching for repeated lookups, hover details with full commit metadata, and a user setting to enable/disable inline blame.
- **Completed:** Clicking inline blame expands full commit, timestamp and summary details.

### 2.4 GitHub and GitLab integration

- **Priority:** P2
- [ ] **Status:** Cancelled
- **Description:** Connect repository hosting features directly into BlinkCode.
- **Why it matters:** Pull requests, issues and reviews are part of modern development workflows.
- **Expected behavior:** Users could create pull requests, checkout branches, view review comments and open remote repository links.
- **Implementation direction:** Start with GitHub device authentication and read-only repository metadata before adding write actions.
- **Current state:** Cancelled and removed from the product for now. The dedicated activity panel, provider authentication, Electron IPC, backend routes and related tests have been deleted. Local Git and the Source Control panel remain available.

---

## 3. Web development workflow

BlinkCode is focused on web and app projects, so common frontend tooling should feel native.

### 3.1 Web App Center

- **Priority:** P1
- [x] **Status:** Done
- **Description:** Provide one focused control center for local JavaScript/Web app work.
- **Why it matters:** React, Vite and Tailwind developers need scripts, dev-server preview, problems, Git, REST helpers, dependencies and templates in one daily workflow.
- **Current state:** The activity-bar panel is now Web App Center. It detects React/Vite/Tailwind/TypeScript/Router/Next/Vue/Svelte, npm/pnpm/Yarn/Bun, test tools, env files, REST files and backend dependencies. It keeps script run/stop/rerun/status flows, adds guided/compact behavior, shows dev-server candidates, preview state, top problems, Git summary with changed files, REST shortcuts/recent requests, template entry points and dependency management.
- **Completed in this cycle:** Added `/api/web-workflow`, Web Workflow settings, app-stack detection, first-run checklist, preview controls, REST/env helpers, Git/problem summaries and unit coverage for web workflow analysis.

### 3.2 Dependency manager

- **Priority:** P1
- [x] **Status:** Done
- **Description:** Show project dependencies and common package actions.
- **Why it matters:** Dependency updates and package inspection are common in web projects.
- **Current state:** The package workflow panel discovers root and nested manifests, groups production/development/optional/peer dependencies, shows declared and installed versions, filters by name/type/version and checks outdated packages with the detected package manager.
- **Completed:** Install, update and remove actions run in dedicated integrated terminals with the correct package directory and package manager; update/remove require explicit confirmation.

### 3.3 Smart Browser Preview

- **Priority:** P1
- [x] **Status:** Done
- **Description:** Improve the embedded browser preview for local web apps.
- **Current state:** Back/Forward, reload, external open, responsive/tablet/mobile sizes, local dev-server detection and automatic attachment are implemented. Web App Center surfaces detected dev scripts, preview state and the configured preview behavior (`auto-open`, `ask`, `never`).
- **Why it matters:** Web developers need to run and preview applications without leaving the IDE.

### 3.4 JavaScript and Node debugger

- **Priority:** P1
- [x] **Status:** Done
- **Description:** Add debugging for Node and browser JavaScript workflows.
- **Why it matters:** Breakpoints, step debugging and variable inspection are expected in serious development tools.
- **Expected behavior:** Users should be able to start debug sessions, attach to running processes and inspect call stacks.
- **Implementation direction:** Use Chrome DevTools Protocol or a debug adapter integration.
- **Current state:** BlinkCode Debug uses its own JSONC `.blinkcode/launch.json`, custom configuration picker, Node launch and Node/Chrome Inspector attach, persisted multi-file breakpoints with enable/disable/remove/conditions, pause/continue/step/restart/stop controls, selectable call frames, recursively expandable variables, persisted watch expressions and an interactive Debug Console with history and output clearing.
- **Completed:** Workspace and environment variable substitution, runtime arguments, launch environment, clear failed-attach states and JSON-only API errors are implemented. Real Inspector launch/attach/restart/evaluation paths are covered by unit tests, and configuration selection, breakpoint pause, Debug Console evaluation and failed attach are covered by Chromium E2E tests.

### 3.5 Tailwind and CSS tooling

- **Priority:** P1
- [x] **Status:** Done
- **Description:** Improve Tailwind and CSS developer experience.
- **Why it matters:** Tailwind is common in modern web projects and needs class suggestions, diagnostics and formatting support.
- **Expected behavior:** Tailwind class autocomplete, hover previews, invalid class warnings and optional class sorting.
- **Implementation direction:** Integrate Tailwind language tooling and expose settings for project-specific configuration.
- **Current state:** Monaco provides Tailwind class completion in HTML/JSX, CSS hover previews, typo diagnostics, an editor sorting action and immediate settings toggles.
- **Completed:** Tailwind parsing, previews and deterministic class sorting have unit coverage and remain integrated with the production Monaco build.

### 3.6 REST Client

- **Priority:** P1
- [x] **Status:** Done
- **Description:** Run HTTP requests from `.http` files inside the editor.
- **Why it matters:** API testing is part of web development and should not require a separate app for simple workflows.
- **Expected behavior:** Send requests, show responses, support variables and keep request history.
- **Implementation direction:** Parse `.http` files and store request history in SQLite.
- **Current state:** `.http` files support variables, multiple requests, headers and bodies; requests run with timeout/response-size guards, responses render in-editor and the latest 100 requests are stored in SQLite.
- **Completed:** Parser, live HTTP execution and the full in-editor request/response workflow are covered by unit and Chromium E2E tests.

### 3.7 Markdown preview

- **Priority:** P2
- [x] **Status:** Done
- **Description:** Add live preview for Markdown and MDX files.
- **Why it matters:** Documentation is part of most repositories, and previewing docs improves writing flow.
- **Current state:** Markdown, MDX and `.markdown` files open with a side-by-side editor and safe live preview. Raw HTML is escaped by default and common headings, lists, code blocks, inline code, emphasis and links are rendered.
- **Completed:** Added bidirectional synchronized scrolling, tables, task lists, strikethrough and fenced language classes.

### 3.8 Schema-aware JSON and YAML

- **Priority:** P2
- [x] **Status:** Done
- **Description:** Validate common configuration files using schemas.
- **Why it matters:** Many project files are JSON or YAML and benefit from completion and validation.
- **Expected behavior:** Provide schemas for `package.json`, `tsconfig.json`, ESLint configs, deployment configs and other common files.
- **Implementation direction:** Configure Monaco JSON defaults and add YAML language tooling later.
- **Current state:** Monaco adds path-aware completion, hover documentation and validation for package, TypeScript, ESLint, Vercel/Netlify, GitHub Actions and Docker Compose configuration files. YAML checks duplicate keys, required top-level keys, tabs and inconsistent indentation.
- **Completed:** Schema selection and JSON/YAML validation are covered by unit tests and the tooling is included in the production Monaco bundle.

### 3.9 `.env` editor

- **Priority:** P2
- [x] **Status:** Done
- **Description:** Provide safer editing for environment files.
- **Why it matters:** `.env` files often contain secrets and should be handled carefully.
- **Expected behavior:** Syntax highlighting, duplicate key detection, optional masking and warnings before accidental exposure.
- **Implementation direction:** Add a lightweight parser and secret-aware UI behavior.
- **Current state:** Implemented a dedicated Monaco language, syntax highlighting, duplicate/invalid key diagnostics and optional secret-value masking controlled from Settings.
- **Completed:** Unit coverage validates parsing and diagnostics; Chromium E2E opens a real `.env` fixture, verifies the `dotenv` language, duplicate-key warning and live Settings-controlled secret masking. The complete `quality:full` gate passes.

### 3.10 Project templates

- **Priority:** P2
- [x] **Status:** Done
- **Description:** Create new projects from common templates.
- **Why it matters:** A good first-run experience helps users start quickly.
- **Expected behavior:** Choose a template, target folder and package manager, then scaffold the project.
- **Implementation direction:** Start with local templates and later support framework CLIs with confirmation.
- **Current state:** A custom modal scaffolds React + Vite + TypeScript, React + Tailwind, React + Router, Landing Page, API Client, React + Express API and Component Playground projects. It requires an explicit external save location, supports npm/pnpm/yarn metadata and rolls back partially created projects after errors. Package names are derived from the user-entered project folder instead of template-specific BlinkCode names.
- **Completed:** Desktop creation is restricted to a folder selected through the native picker; browser creation uses a writable directory handle. Unit and Chromium E2E coverage verify external placement, safe paths, package naming and package-manager metadata.

---

## 4. AI features

AI should be useful, transparent and safe. The user must remain in control of file changes and commands.

### 4.1 AI inline completions

- **Priority:** P1
- [x] **Status:** Done
- **Description:** Show AI suggestions as ghost text inside the editor.
- **Why it matters:** Inline completions speed up repetitive code writing without interrupting flow.
- **Expected behavior:** Suggestions should be cancellable, accepted with a shortcut and aware of the current file context.
- **Implementation direction:** Use Monaco inline completions provider and keep requests debounced.
- **Current state:** A debounced Monaco inline completion provider sends bounded prefix/suffix context to a configurable OpenAI-compatible endpoint, renders ghost text, respects cancellation and can be disabled immediately in Settings.
- **Completed:** Provider availability is cached before requests so an offline model server does not generate repeated gateway errors while typing.

### 4.2 Context-aware AI chat

- **Priority:** P1
- [x] **Status:** Done
- **Description:** Improve the AI panel with better project context.
- **Current state:** The AI panel uses a configurable OpenAI-compatible provider and includes selected code, the active file, open files, workspace tree and bounded search matches. Provider credentials remain session-only.
- **Why it matters:** AI is more useful when it understands the current file, selected code and project structure.
- **Completed:** Provider discovery and clear disconnected states prevent chat requests until the configured model server is reachable; connected and disconnected workflows are covered by Chromium E2E tests.

### 4.3 AI agent with tools

- **Priority:** P1
- [x] **Status:** Done
- **Description:** Let AI perform multi-step coding tasks with controlled tools.
- **Why it matters:** This is a major differentiator for a modern IDE.
- **Expected behavior:** The agent should propose file edits, run safe checks and ask for confirmation before destructive actions.
- **Implementation direction:** Build a tool layer for file reads, edits, terminal commands and project search with strict permission handling.
- **Current state:** The agent produces a visible structured tool plan for workspace search, file reads, confirmed writes/replacements and an allowlisted command runner. Mutating tools require an explicit `Confirm & run` action and all paths stay inside the workspace.
- **Completed:** Tool parsing, provider calls, workspace path confinement, confirmation requirements and the agent UI flow are covered by unit and Chromium E2E tests.

### 4.4 AI quick actions

- **Priority:** P2
- [x] **Status:** Done
- **Description:** Add one-click actions for selected code.
- **Why it matters:** Common AI tasks should be available without writing prompts every time.
- **Expected behavior:** Explain, refactor, fix, document, generate tests and optimize selected code.
- **Implementation direction:** Add command palette actions and context menu entries that pass structured prompts to the AI panel.
- **Current state:** Explain, refactor, fix, document, generate-tests and optimize actions are available in the AI panel, Monaco editor actions and the command palette. Actions reuse the bounded editor/project context and localized structured prompts.
- **Completed:** Chromium E2E verifies all six actions and command-palette discovery.

---

## 5. Productivity and customization

These features make BlinkCode more comfortable for long daily sessions.

### 5.1 Snippets

- **Priority:** P2
- [x] **Status:** Done
- **Description:** Support reusable code snippets.
- **Why it matters:** Snippets reduce repetitive typing and help teams standardize patterns.
- **Expected behavior:** User-defined snippets, language-specific snippets and tab stops.
- **Implementation direction:** Store snippets in user settings and connect them to Monaco completion providers.
- **Current state:** Settings supports creating, editing, deleting and persisting snippets with names, descriptions, normalized language lists, prefixes and Monaco tab-stop bodies.
- **Completed:** Validation prevents incomplete snippets and overlapping language/prefix combinations. Completion providers update immediately without restarting the editor; unit tests cover provider refresh and tab stops, while Chromium E2E covers the complete settings workflow.

### 5.2 Keybindings editor

- **Priority:** P2
- [x] **Status:** Done
- **Description:** Add a UI for viewing and customizing shortcuts.
- **Why it matters:** Keyboard-first users need control over their workflow.
- **Current state:** Recording, reset, search, conflict detection and a shared command registry are implemented.

### 5.3 Settings JSON and UI

- **Priority:** P2
- [x] **Status:** Done
- **Description:** Support both visual settings and JSON-based configuration.
- **Current state:** Fully implemented. Global settings are stored in `%APPDATA%/BlinkCode/settings.json`, workspace overrides in `<project>/.blinkcode/settings.json`. Settings merge with priority: defaults → global → workspace. The SettingsPanel includes "User JSON" and "Workspace JSON" buttons that open the respective files as editable tabs in Monaco. Auto-save and Ctrl+S apply changes immediately. REST API endpoints expose settings for external tooling.
- **Why it matters:** Beginners prefer UI controls, while advanced users expect precise JSON configuration.
- **Commit:** `3bc882d` — feat: add JSON-based settings with global/workspace support

### 5.4 VS Code theme import

- **Priority:** P2
- [x] **Status:** Done
- **Description:** Import VS Code theme files and apply them to BlinkCode.
- **Why it matters:** Themes are personal, and VS Code has a large theme ecosystem.
- **Expected behavior:** Import a theme JSON file and map editor colors, token colors and UI colors where possible.
- **Implementation direction:** Start with token colors and gradually map workbench colors to BlinkCode CSS variables.
- **Current state:** VS Code theme JSON imports into Monaco token/editor colors and maps common workbench colors to BlinkCode CSS variables with dark/light theme support.
- **Completed:** Settings keeps a stable file input, shows the imported theme name, reports invalid files through localized toasts, applies colors immediately and persists the import across reloads. Conversion has unit coverage and the complete UI flow is covered by Chromium E2E.

### 5.5 Multi-root workspace

- **Priority:** P2
- [x] **Status:** Done
- **Description:** Support multiple folders in a single workspace.
- **Why it matters:** Many projects are monorepos or depend on multiple local folders.
- **Expected behavior:** Show multiple roots in the explorer and keep per-root search, Git and settings behavior clear.
- **Implementation direction:** Introduce a workspace model instead of a single workspace path.
- **Current state:** Additional folders can be selected from Explorer and are persisted as stable virtual workspace roots. Explorer, file operations, project search and file watching resolve each virtual path against its owning root.
- **Completed:** Source Control exposes a shared custom root picker and routes status, staging, diffs, commits, conflict resolution and remote operations to the selected repository. Unit tests cover root persistence/path resolution and Chromium E2E covers adding, opening and selecting an additional root.

### 5.6 Zen / Focus mode

- **Priority:** P2
- [x] **Status:** Done
- **Description:** Hide non-essential UI for focused editing.
- **Why it matters:** Some tasks benefit from a distraction-free interface.
- **Expected behavior:** Toggle sidebars, panels and extra UI while keeping the editor centered.
- **Implementation direction:** Add a command and persist the preference in settings.
- **Current state:** `Ctrl+K Ctrl+Z` hides headers, sidebars, panels and status UI, exposes an exit control and persists/restores Zen state.
- **Completed:** Chord dispatch now prioritizes complete two-step shortcuts over conflicting single-key commands; Chromium E2E verifies keyboard entry, persistence after reload and the exit control.

### 5.7 Minimap, sticky scroll and breadcrumbs

- **Priority:** P2
- [x] **Status:** Done
- **Description:** Improve navigation inside large files.
- **Current state:** Breadcrumbs exist, and Settings now exposes toggles for Monaco minimap and sticky scroll.
- **Why it matters:** Large files are easier to navigate with structural context.
- **Next improvements:** Add per-language defaults if needed.

### 5.8 Bracket colorization and indent guides

- **Priority:** P2
- [x] **Status:** Done
- **Description:** Improve code readability with bracket pair colorization and indentation guides.
- **Current state:** Monaco options are wired through the editor settings.
- **Why it matters:** These small visual aids reduce mistakes in nested code.
- **Next improvements:** Add per-language defaults if needed.

### 5.9 Spell checker

- **Priority:** P2
- [x] **Status:** Done
- **Description:** Add spell checking for Markdown, comments and documentation.
- **Why it matters:** Developers write documentation and user-facing text inside the editor.
- **Expected behavior:** Highlight spelling issues and provide suggestions.
- **Implementation direction:** Keep it optional and avoid checking code identifiers by default.
- **Current state:** Optional Monaco diagnostics check Markdown/plain text and comments in common code languages, skip identifiers/code spans and provide quick-fix replacement suggestions.
- **Completed:** Provider registration is safe across Monaco recreation; unit tests cover detection/suggestions and Chromium E2E verifies live enable/disable marker behavior.

### 5.10 Trash / soft delete

- **Priority:** P2
- [x] **Status:** Done
- **Description:** Move deleted files to the system trash instead of permanently deleting them.
- **Why it matters:** Permanent deletion is risky in a file explorer.
- **Expected behavior:** Deleting a file should be reversible through OS trash where possible.
- **Implementation direction:** Use Electron shell trash APIs or platform-specific safe delete behavior.
- **Current state:** Electron validates paths against the active workspace and uses the OS trash; browser mode moves entries to BlinkCode's recoverable Trash storage. Explorer state changes only after a successful move.
- **Completed:** Browser Trash respects the configured application storage directory; unit tests cover safe movement and Chromium E2E covers cancel/confirm behavior and verifies the source file is removed only after confirmation.

---

## 6. Platform and distribution

These features expand BlinkCode from a local Windows-focused app into a broader development platform.

### 6.1 Plugin system

- **Priority:** P3
- [x] **Status:** Done
- **Description:** Allow external extensions to contribute commands, UI and language features.
- **Why it matters:** A plugin ecosystem can grow BlinkCode beyond built-in features.
- **Expected behavior:** Plugins should be sandboxed and have explicit permissions.
- **Implementation direction:** Start with command and menu contributions before exposing deeper APIs.
- **Current state:** The public extension marketplace is paused in the IDE. BlinkCode no longer shows the Extensions activity panel or connects to the GitHub extension catalog, while built-in feature flags keep Markdown Preview, Spell Checker and Theme Import available as first-party IDE features.
- **Completed:** Extension authoring and CLI work remain in the repository for later use, but the desktop IDE no longer depends on a remote extension registry or user-installed extension lifecycle.

### 6.2 Remote development

- **Priority:** P3
- [ ] **Status:** Future
- **Description:** Support WSL, SSH and Dev Containers workflows.
- **Why it matters:** Many developers work in remote or containerized environments.
- **Expected behavior:** Open remote folders, run terminals remotely and keep editor operations consistent.
- **Implementation direction:** Start with WSL detection and remote filesystem abstraction.

### 6.3 Live Share

- **Priority:** P3
- [ ] **Status:** Future
- **Description:** Add collaborative editing sessions.
- **Why it matters:** Pair programming and live debugging are valuable for teams.
- **Expected behavior:** Share workspace, editor location and selected files with collaborators.
- **Implementation direction:** Requires networking, identity and security design before implementation.

### 6.4 One-click deploy

- **Priority:** P3
- [ ] **Status:** Future
- **Description:** Deploy common web projects directly from BlinkCode.
- **Why it matters:** Deployment is part of the web development lifecycle.
- **Expected behavior:** Detect supported frameworks and provide guided deployment actions.
- **Implementation direction:** Start with generated terminal commands and later integrate provider APIs.

### 6.5 macOS and Linux builds

- **Priority:** P3
- [x] **Status:** Done
- **Description:** Publish BlinkCode builds for macOS and Linux.
- **Why it matters:** Cross-platform support makes the project usable by more developers.
- **Current state:** Electron Builder scripts produce macOS DMG/ZIP and Linux AppImage/DEB artifacts alongside the existing Windows installers.
- **Implementation direction:** Validate native dependencies, packaging scripts, icons and update flow per platform.
- **Completed:** The tag release workflow uses Windows, macOS and Ubuntu runners, publishes platform artifacts to one GitHub Release and is guarded by release configuration tests and `release:check`.

### 6.6 Auto-update

- **Priority:** P3
- [x] **Status:** Done
- **Description:** Add automatic updates for packaged desktop releases.
- **Why it matters:** Users should receive fixes and improvements without manually downloading every release.
- **Expected behavior:** Check for updates, show release notes and install safely.
- **Implementation direction:** Integrate Electron updater flow with GitHub Releases.
- **Current state:** Packaged Electron builds use `electron-updater` with GitHub Releases, explicit check/download controls, progress and release notes in Settings, and restart-to-install after an update is ready. Development builds report that updates are only available in packaged releases.
- **Completed:** Update IPC is isolated through preload, release metadata is configured for all desktop targets and quality tests verify the updater/release wiring.

### 6.7 Opt-in telemetry

- **Priority:** P3
- [ ] **Status:** Future
- **Description:** Collect privacy-first usage metrics only if the user explicitly enables it.
- **Why it matters:** Anonymous product insights can help prioritize work, but user trust is more important.
- **Expected behavior:** Disabled by default, transparent data list and one-click opt out.
- **Implementation direction:** Define policy before writing any telemetry code.

### 6.8 Isolated Extension Host 2.0

- **Priority:** P1
- [ ] **Status:** Planned
- **Description:** Move extension execution from the server process into supervised worker processes with stable, versioned APIs.
- **Why it matters:** A large extension ecosystem needs crash isolation, cancellation, resource budgets and compatibility guarantees.
- **Expected behavior:** Activation events, per-extension CPU/memory limits, automatic restart, diagnostics, API version negotiation and workspace trust controls.
- **Implementation direction:** Build a message-based host first, then add commands, settings, views, languages, formatters, diagnostics, debuggers and test adapters as independent contribution points.

### 6.9 Signed marketplace, updates and rollback

- **Priority:** P2
- [ ] **Status:** Planned
- **Description:** Evolve the offline registry into signed local and remote catalogs without requiring a public website.
- **Why it matters:** Users need safe discovery, dependency resolution, updates and recovery from broken releases.
- **Expected behavior:** Signed archives, publisher keys, checksums, permission diffs, update channels, dependency locking, malicious-package revocation and one-click rollback.
- **Implementation direction:** Keep the repository-backed catalog as the trusted default and add optional Git/GitHub release catalogs plus private organization registries.

### 6.10 Extension SDK and development workbench

- **Priority:** P2
- [ ] **Status:** Planned
- **Description:** Provide typed APIs and a dedicated extension development workflow inside BlinkCode.
- **Why it matters:** Extension authors should be able to create, test, profile and publish packages without learning internal source code.
- **Expected behavior:** Type definitions, generators, manifest completion, extension tests, sandbox logs, contribution inspection, hot reload, packaging and compatibility reports.
- **Implementation direction:** Expand the standalone `@lovlydev/blinkcode-cli` package from `BlinkCodeOrg/blinkcode-cli` into an SDK and add an Extension Development Host window.

### 6.11 Profiles, sync and private extension sets

- **Priority:** P3
- [ ] **Status:** Planned
- **Description:** Save named IDE profiles containing settings, keybindings, snippets and extension sets.
- **Why it matters:** Developers often need different environments for frontend, backend, embedded or company projects.
- **Expected behavior:** Local profiles first, encrypted export/import, workspace recommendations, team policy files and optional end-to-end encrypted sync.
- **Implementation direction:** Store portable profile manifests locally, then add user-selected storage providers without requiring a BlinkCode account or central server.

---

## 7. Reliability and polish

These tasks reduce friction and make the editor feel stable.

### 7.1 Trim whitespace and final newline

- **Priority:** P2
- [x] **Status:** Done
- **Description:** Automatically clean trailing whitespace and ensure final newlines based on settings.
- **Why it matters:** Keeps files clean and avoids noisy diffs.
- **Current state:** Separate save settings trim trailing whitespace and ensure a final newline.

### 7.2 EditorConfig support

- **Priority:** P2
- [x] **Status:** Done
- **Description:** Respect `.editorconfig` files in workspaces.
- **Why it matters:** Many teams define indentation, line endings and newline behavior through EditorConfig.
- **Expected behavior:** Apply settings per file based on the closest matching `.editorconfig`.
- **Current state:** Server-side cascading parsing supports root files, glob sections and closest-file overrides for indentation, line endings, trailing whitespace and final newlines; Monaco and save behavior apply the result per file.
- **Completed:** EditorConfig is reapplied when Monaco mounts or switches models; unit tests cover cascading/globs and Chromium E2E verifies indentation plus save-time whitespace, newline and line-ending behavior.

### 7.3 Auto-save on focus change

- **Priority:** P2
- [x] **Status:** Done
- **Description:** Add focus-change autosave mode in addition to timer-based autosave.
- **Why it matters:** Users expect flexible autosave modes similar to other editors.
- **Current state:** Timer-based autosave exists, and Settings now includes an opt-in focus-change mode that saves dirty files when the editor window loses focus or the document is hidden.
- **Completed:** Focus-change save failures are reported through visible error toasts.

### 7.4 Recent files

- **Priority:** P2
- [x] **Status:** Done
- **Description:** Add fast switching between recently used files.
- **Why it matters:** Developers often jump between a small set of files repeatedly.
- **Expected behavior:** `Ctrl+Tab` should cycle through recent files and show a quick picker.
- **Current state:** File opens update a bounded recent list; `Ctrl+Tab` opens the shared custom Quick Open picker filtered to recent files.
- **Completed:** Files are recorded immediately when opening starts, avoiding async read races; Chromium E2E verifies ordering, top placement, keyboard activation and persistence after reload.

### 7.5 Go to line

- **Priority:** P2
- [x] **Status:** Done
- **Description:** Jump to a specific line with `Ctrl+G`.
- **Current state:** Monaco provides this action.
- **Why it matters:** Useful for stack traces, logs and diagnostics.

### 7.6 Multi-cursor and column selection

- **Priority:** P2
- [x] **Status:** Done
- **Description:** Support advanced editing with multiple cursors and column selection.
- **Current state:** Monaco provides these capabilities.
- **Why it matters:** Multi-cursor editing is essential for fast repetitive changes.

### 7.7 OS drag and drop

- **Priority:** P2
- [x] **Status:** Done
- **Description:** Allow users to drag files or folders from the operating system into BlinkCode.
- **Why it matters:** Drag-and-drop is a natural desktop workflow.
- **Expected behavior:** Dropping a folder opens it; dropping files opens them as tabs.
- **Current state:** Electron folder drops open the native directory, while file drops import content, refresh the tree and open successful imports as tabs.
- **Completed:** File drops report complete, partial and failed imports accurately instead of showing false success; Chromium E2E verifies imported content, tree refresh and automatic tab opening, while Electron folder drops use the validated native path bridge.

### 7.8 Reveal in Explorer

- **Priority:** P2
- [x] **Status:** Done
- **Description:** Reveal the selected file in the system file manager.
- **Why it matters:** Users often need to interact with files outside the IDE.
- **Current state:** Files and folders can be revealed from Explorer context menus, and opened tabs include a reveal action in the tab context menu when running in Electron.

### 7.9 Copy path

- **Priority:** P2
- [x] **Status:** Done
- **Description:** Copy absolute or relative file paths from the explorer and tabs.
- **Why it matters:** File paths are often needed in terminals, docs and issue reports.
- **Current state:** Explorer and tab context menus can copy absolute paths, relative paths and file names.

### 7.10 Last cursor position

- **Priority:** P2
- [x] **Status:** Done
- **Description:** Restore cursor and scroll position when reopening files.
- **Why it matters:** Returning to the exact editing location saves time.
- **Current state:** Monaco view state is persisted per file in SQLite and restored when a file is reopened, with line/column fallback for older records.

---

## 8. Security and data handling

Security work should be explicit because BlinkCode runs local commands and reads local files.

### 8.1 Path traversal tests

- **Priority:** P1
- [x] **Status:** Done
- **Description:** Test path validation for file APIs.
- **Current state:** Backend path safety is centralized in `server/pathSafety.js` and covered by Node tests for normal paths, traversal attempts and sibling-prefix escapes.
- **Why it matters:** File APIs must not allow access outside the intended workspace.
- **Completed:** Tests cover symlink escapes and single/double encoded traversal attempts.

### 8.2 Content Security Policy

- **Priority:** P1
- [x] **Status:** Done
- **Description:** Add a strict CSP for the Electron and web entry points.
- **Current state:** The server sends CSP, referrer and content-type security headers. Electron denies permission requests, blocks cross-origin main-window navigation and keeps webviews sandboxed with Node integration disabled.
- **Why it matters:** CSP reduces the risk of script injection and unsafe resource loading.

### 8.3 Secret storage

- **Priority:** P2
- [x] **Status:** Done
- **Description:** Store tokens and sensitive credentials through OS-backed secure storage.
- **Why it matters:** API keys and auth tokens must not be stored in plain text project files.
- **Implementation direction:** Evaluate keytar or Electron-safe alternatives.
- **Current state:** Desktop AI credentials are encrypted and decrypted only in the Electron main process through `safeStorage`; the renderer accesses them through a narrow preload IPC bridge. Browser development keeps credentials session-only.
- **Completed:** Desktop configuration no longer persists API keys to local storage, the encrypted store uses restricted file permissions and a quality contract prevents plaintext renderer persistence regressions.

### 8.4 AI sandbox and confirmations

- **Priority:** P2
- [x] **Status:** Done
- **Description:** Guard AI actions that modify files or run commands.
- **Why it matters:** AI automation must be safe and reviewable.
- **Expected behavior:** The user approves destructive actions and can inspect diffs before applying edits.
- **Current state:** Read-only tools run inside the workspace boundary. File writes, replacements and allowlisted commands require a visible review, a one-time short-lived approval token bound to the exact tool payload and explicit confirmation; replacements show a before/after diff.
- **Completed:** Unit tests verify token binding, expiry behavior and single use. Chromium E2E verifies missing-token rejection, approved execution and replay rejection.

### 8.5 Large file limits

- **Priority:** P2
- [x] **Status:** Done
- **Description:** Protect the editor from loading huge or binary files accidentally.
- **Current state:** Binary detection exists, file sizes are included in the workspace tree, and files over the configured text limit are blocked from editable text loading.
- **Why it matters:** Large files can freeze the UI or consume too much memory.
- **Completed:** Large text files use a chunked read-only viewer with explicit load-more controls.

### 8.6 Recovery storage

- **Priority:** P2
- [x] **Status:** Done
- **Description:** Recover unsaved edits after crashes or forced exits.
- **Current state:** Dirty real-file buffers are periodically snapshotted to SQLite, written again during unload, restored as dirty tabs on startup and removed after a successful file save.
- **Why it matters:** Data loss is one of the worst editor experiences.

---

## 9. Tests and automation

Testing and CI are required before BlinkCode can grow safely.

### 9.1 Unit tests

- **Priority:** P1
- [x] **Status:** Done
- **Description:** Add unit tests for reducers, utilities and backend helpers.
- **Current state:** The Node test suite covers reducer transitions, file create/read/write/rename/move/delete operations, path safety, binary and large-file guards, cursor/view-state persistence, lazy loading, keybinding capture, SQLite migrations, recovery wiring, Electron/server security restrictions, root/nested NPM script discovery and dependency discovery/outdated parsing/package-manager commands.
- **Why it matters:** Core behavior should stay stable during refactors.
- **Expected coverage:** State restoration, safe path handling, file operations and settings logic.

### 9.2 End-to-end tests

- **Priority:** P1
- [x] **Status:** Done
- **Description:** Test the app as a user would use it.
- **Why it matters:** IDE features often break through integration issues rather than isolated functions.
- **Current state:** Playwright scenarios cover startup, Explorer, NPM scripts, dependency listing/filtering, keybindings, editing/saving, terminal, Browser Preview, recovery, settings persistence and Source Control.
- **Commands:** Use `npm run e2e` for headless execution or `npm run e2e:headed` for an interactive browser.

### 9.3 CI pipeline

- **Priority:** P1
- [x] **Status:** Done
- **Description:** Run checks automatically on pull requests.
- **Current state:** GitHub Actions installs Chromium and runs `npm run quality:full` on pushes and pull requests to `main`, covering typecheck, lint, unit/regression tests, architecture checks, production build and Playwright E2E.
- **Why it matters:** CI prevents broken builds from landing in `main`.
- **Expected behavior:** Lint, typecheck, build and selected tests should run on every pull request.

### 9.4 Release checklist

- **Priority:** P2
- [x] **Status:** Done
- **Description:** Document and automate release steps.
- **Current state:** `docs/RELEASE.md`, `CHANGELOG.md` and `npm run release:check` validate release metadata, required files and the full quality gate before Windows packaging.
- **Why it matters:** Releases should be repeatable and less error-prone.
- **Completed:** Tag pushes validate, package and publish installer, blockmap, portable build and update metadata to GitHub Releases.

---

## Roadmap status overview

This table is the quick checklist for tracking what is already implemented and what still needs work.

| ID | Feature | Priority | Status | Notes |
| --- | --- | --- | --- | --- |
| 1.1 | Language Server Protocol | P0 | [x] Done | TypeScript, JavaScript, HTML, CSS and JSON tooling is wired through Monaco/LSP. |
| 1.2 | Global search and replace | P0 | [x] Done | Search panel with filters, previews, click-to-open results and replace-all flow. |
| 1.3 | Quick Open | P0 | [x] Done | Fuzzy file picker is available through `Ctrl+P`. |
| 1.4 | Command Palette | P0 | [x] Done | Command launcher is available through `Ctrl+Shift+P`. |
| 1.5 | Problems panel | P0 | [x] Done | Diagnostics panel with severity filter, click-to-navigate and StatusBar counts. |
| 1.6 | File watcher | P0 | [x] Done | Workspace changes are watched through the backend and pushed to the UI. |
| 1.7 | Split editor and tab workflow | P0 | [x] Done | Split mode and tab management are implemented. |
| 1.8 | SQLite persistence | P0 | [x] Done | `better-sqlite3` stores editor state, settings, recent projects and histories. |
| 1.9 | Status bar | P1 | [x] Done | Shows editor and workspace metadata. |
| 2.1 | Source Control panel | P0 | [x] Done | Full panel with stage/unstage/discard/commit, pull/push, diff preview, error handling and resizable layout. |
| 2.2 | Inline diff and gutter indicators | P0 | [x] Done | Monaco gutter/line decorations, inline diff hunks, extracted diff preview component with synced panes and syntax coloring. |
| 2.3 | Git blame inline | P1 | [x] Done | Blame-line endpoint, cached lookups, inline blame with relative time + hover metadata, and Settings toggle implemented. |
| 2.4 | GitHub and GitLab integration | P2 | [ ] Cancelled | Removed from the product for now; local Git and Source Control remain available. |
| 3.1 | Web App Center | P1 | [x] Done | Stack detection, scripts, preview control, problems, Git, REST, templates and dependency management are unified for local web apps. |
| 3.2 | Dependency manager | P1 | [x] Done | Root/nested dependency discovery, installed/outdated versions and confirmed install/update/remove terminal actions are implemented. |
| 3.3 | Smart Browser Preview | P1 | [x] Done | Navigation, device sizes and terminal dev-server auto-attach are implemented. |
| 3.4 | JavaScript and Node debugger | P1 | [x] Done | BlinkCode launch configurations, launch/attach/restart, conditional breakpoints, watch, stacks, recursive variables and Debug Console are verified. |
| 3.5 | Tailwind and CSS tooling | P1 | [x] Done | Completion, hover, diagnostics, sorting and settings are implemented. |
| 3.6 | REST Client | P1 | [x] Done | `.http` parser, response UI, variables and SQLite history are implemented and verified. |
| 3.7 | Markdown preview | P2 | [x] Done | Safe GFM preview and bidirectional synchronized scrolling are implemented. |
| 3.8 | Schema-aware JSON and YAML | P2 | [x] Done | Common JSON/YAML schemas, completion, hover and diagnostics are implemented. |
| 3.9 | `.env` editor | P2 | [x] Done | Dedicated language tooling, diagnostics and Settings-controlled masking are covered by unit and Chromium E2E tests. |
| 3.10 | Project templates | P2 | [x] Done | React/Vite/Tailwind/API/full-stack/playground templates with explicit external save location and generated package names are implemented. |
| 4.1 | AI inline completions | P1 | [x] Done | Debounced cancellable Monaco ghost text is wired to a checked OpenAI-compatible provider. |
| 4.2 | Context-aware AI chat | P1 | [x] Done | Selected code, active/open files, tree and workspace search context are implemented and verified. |
| 4.3 | AI agent with tools | P1 | [x] Done | Visible tool plans and confirmed file/command operations are implemented and verified. |
| 4.4 | AI quick actions | P2 | [x] Done | Six localized editor, panel and command-palette actions are implemented and covered by E2E. |
| 5.1 | Snippets | P2 | [x] Done | CRUD, validation, persistence and live language-specific Monaco providers with tab stops are fully tested. |
| 5.2 | Keybindings editor | P2 | [x] Done | Search, recording, reset, conflict detection and command registry are implemented. |
| 5.3 | Settings JSON and UI | P2 | [x] Done | Global/workspace JSON settings with merge priority and editable virtual tabs. |
| 5.4 | VS Code theme import | P2 | [x] Done | Monaco/workbench mapping, visible errors, immediate application and persisted import are covered by unit and Chromium E2E tests. |
| 5.5 | Multi-root workspace | P2 | [x] Done | Persisted virtual roots support Explorer, search, watching and per-root Source Control operations. |
| 5.6 | Zen / Focus mode | P2 | [x] Done | Chord handling, focused layout, persistence and exit flow are covered by Chromium E2E. |
| 5.7 | Minimap, sticky scroll and breadcrumbs | P2 | [x] Done | Breadcrumbs plus Settings toggles for Monaco minimap and sticky scroll. |
| 5.8 | Bracket colorization and indent guides | P2 | [x] Done | Monaco options are wired through settings. |
| 5.9 | Spell checker | P2 | [x] Done | Optional diagnostics, quick fixes, Monaco recreation safety and live settings behavior are tested. |
| 5.10 | Trash / soft delete | P2 | [x] Done | OS trash and recoverable browser fallback use safe paths with confirmation and E2E coverage. |
| 6.1 | Plugin system | P3 | [ ] Paused | Public marketplace UI and GitHub catalog are hidden from the IDE; CLI/source work is kept for a later server-backed design. |
| 6.2 | Remote development | P3 | [ ] Future | Needs WSL, SSH or container filesystem abstraction. |
| 6.3 | Live Share | P3 | [ ] Future | Requires collaboration, identity and security design. |
| 6.4 | One-click deploy | P3 | [ ] Future | Needs framework detection and provider integrations. |
| 6.5 | macOS and Linux builds | P3 | [x] Done | DMG/ZIP and AppImage/DEB builds run in the cross-platform tag release matrix. |
| 6.6 | Auto-update | P3 | [x] Done | Packaged builds check, download, present notes/progress and restart to install GitHub releases. |
| 6.7 | Opt-in telemetry | P3 | [ ] Future | Must be disabled by default and privacy-first. |
| 6.8 | Isolated Extension Host 2.0 | P1 | [ ] Planned | Worker isolation, resource budgets, API versioning and deeper contribution points. |
| 6.9 | Signed marketplace, updates and rollback | P2 | [ ] Planned | Signed packages, permission diffs, dependency locking, private catalogs and rollback. |
| 6.10 | Extension SDK and development workbench | P2 | [ ] Planned | Typed APIs, hot reload, tests, profiling, packaging and compatibility reports. |
| 6.11 | Profiles, sync and private extension sets | P3 | [ ] Planned | Named local profiles, encrypted export/import and optional provider-based sync. |
| 7.1 | Trim whitespace and final newline | P2 | [x] Done | Formatting hygiene settings are available. |
| 7.2 | EditorConfig support | P2 | [x] Done | Cascading per-file editor and save behavior is covered by unit and Chromium E2E tests. |
| 7.3 | Auto-save on focus change | P2 | [x] Done | Optional focus-change autosave now saves dirty files when the window loses focus or document is hidden. |
| 7.4 | Recent files | P2 | [x] Done | Immediate bounded history, custom picker, keyboard flow and reload persistence are tested. |
| 7.5 | Go to line | P2 | [x] Done | Provided by Monaco. |
| 7.6 | Multi-cursor and column selection | P2 | [x] Done | Provided by Monaco. |
| 7.7 | OS drag and drop | P2 | [x] Done | Native folder opening and file import/open flows are implemented with accurate failure reporting. |
| 7.8 | Reveal in Explorer | P2 | [x] Done | Explorer and tab context menus can reveal files/folders in the system file manager. |
| 7.9 | Copy path | P2 | [x] Done | Explorer and tab context menus can copy absolute path, relative path and file name. |
| 7.10 | Last cursor position | P2 | [x] Done | Monaco view state is persisted per file in SQLite with line/column fallback for older records. |
| 8.1 | Path traversal tests | P1 | [x] Done | Includes traversal, sibling-prefix, encoded and symlink escape coverage. |
| 8.2 | Content Security Policy | P1 | [x] Done | Server CSP/security headers and Electron navigation, permission and webview restrictions are active. |
| 8.3 | Secret storage | P2 | [x] Done | Electron safeStorage protects desktop credentials behind preload IPC. |
| 8.4 | AI sandbox and confirmations | P2 | [x] Done | Mutations require reviewed, payload-bound, single-use approval tokens and visible diffs. |
| 8.5 | Large file limits | P2 | [x] Done | Oversized text files use a chunked read-only preview. |
| 8.6 | Recovery storage | P2 | [x] Done | Dirty buffers are stored in SQLite, restored on startup and removed after successful saves. |
| 9.1 | Unit tests | P1 | [x] Done | Node and TypeScript tests cover reducer transitions, file operations, security, migrations, recovery, NPM discovery and core regression guards. |
| 9.2 | End-to-end tests | P1 | [x] Done | Playwright covers editing, terminal, Git, Browser Preview, recovery, settings, Explorer, scripts and keybindings. |
| 9.3 | CI pipeline | P1 | [x] Done | GitHub Actions installs Chromium and runs the complete `npm run quality:full` gate. |
| 9.4 | Release checklist | P2 | [x] Done | Tag workflow validates, packages and publishes Windows release artifacts. |

---

## Suggested order of work

### Sprint 1 — finish core IDE foundation

- [x] Global search and replace.
- [x] Problems panel.
- [x] Last cursor/view-state persistence.
- [x] SQLite schema migration cleanup.

### Sprint 2 — Git workflow

- [x] Git status API
- [x] Source Control panel
- [x] Stage, unstage and commit actions
- [x] Inline diff and gutter indicators.

### Sprint 3 — web workflow

- [x] Web App Center.
- [x] Browser Preview auto-detection.
- [x] Tailwind and CSS tooling.
- [x] REST Client basics.
- [x] React/Vite local development workflow positioning.

### Sprint 4 — AI workflow

- [x] Selected-code context in AI chat.
- [x] Inline completions.
- [x] Quick actions.
- [x] Tool-using AI agent with confirmations.

### Sprint 5 — distribution and reliability

- [x] CI pipeline.
- [x] Auto-update.
- [x] macOS and Linux build validation.
- [x] Recovery storage.

---

## Maintenance rules

- Keep roadmap items clear and user-facing.
- Keep implementation details short; move deep technical notes into dedicated docs or issues.
- Update statuses after every completed feature.
- Prefer small, shippable milestones over broad vague goals.
- Do not include private notes, broken text, temporary experiments or duplicated lists in this file.
