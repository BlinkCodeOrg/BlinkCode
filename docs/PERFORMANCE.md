# BlinkCode Performance Notes

## Current decision

BlinkCode remains on Electron for now.

Tauri would reduce the desktop shell and installer size, but it would not directly
remove editor input latency:

- Monaco, React, xterm and the frontend still execute inside a webview.
- On Windows, Tauri uses Chromium-based WebView2.
- BlinkCode currently depends on Node.js for PTY, language servers, debugging,
  Express/WebSocket services and native `better-sqlite3`.
- A near-term Tauri build would therefore require a bundled Node sidecar. Rewriting
  those services in Rust is a separate platform project, not a packaging change.

The current Windows artifacts are approximately:

- NSIS installer: 123 MB.
- Portable executable: 101 MB.
- Electron runtime executable in the unpacked build: 195 MB.

Tauri should be reconsidered when installer size and idle shell memory become a
higher priority than development velocity, or when the backend is ready to move
from Node services to native Rust commands.

## Optimizations applied

- Git inline decorations no longer run `git status` and diff on a fixed interval.
  Updates are cached and debounced after editor changes.
- Problems uses Monaco and LSP events instead of polling every second.
- Recovery buffers are persisted after an idle delay instead of scanning every
  two seconds.
- Editor content state updates run in a non-blocking React transition.
- Monaco receives a stable options object instead of a new object every render.
- Unchanged editor state is no longer written to SQLite on every persistence tick.
- Git branch refresh is throttled and paused while the window is hidden.
- Electron development mode no longer opens detached DevTools automatically.
  DevTools remain available through `F12` and `Ctrl+Shift+I`.

## Remaining large assets

The production frontend is dominated by Monaco:

- TypeScript worker: approximately 5.9 MB.
- Monaco editor API: approximately 2.3 MB.
- Main application chunk: approximately 1.3 MB.
- CSS worker: approximately 1 MB.

Future size work should lazy-load language contributions and workers by active
file type. That improves startup and memory, but it must preserve offline language
support and should be benchmarked separately from interaction latency.
