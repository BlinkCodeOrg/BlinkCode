# Реальная карта проекта BlinkCode

Этот документ составлен по коду проекта, а не только по старой документации. Здесь перечислено то, что реально есть в репозитории на момент проверки.

## Позиционирование

BlinkCode - desktop JavaScript/Web IDE для React, Vite, TypeScript, Tailwind и локального web-app workflow: код, scripts, terminal, preview, Git, REST, AI, templates и настройки в одном рабочем пространстве.

## Главные зоны интерфейса

- Верхняя панель с быстрым открытием проекта/файлов, кнопкой открытия папки, терминалом, AI и кастомными window controls.
- Activity Bar: Explorer, Search, Source Control, Debug, Web App Center.
- Explorer с деревом файлов, recent projects, create/rename/delete, drag-and-drop, file icons, Git decorations и multi-root workspace.
- Monaco editor с tabs, breadcrumbs, empty state, image preview, markdown preview, diff preview и large-file preview.
- Bottom panel с Terminal, Problems, Output и Debug Console.
- Status bar с Git branch, Problems counters, LSP status, formatting/indentation, cursor position, encoding и language.

## Редактор и language tooling

- Monaco editor как основа редактирования.
- Реальный LSP через WebSocket для TypeScript, JavaScript, TSX, JSX, HTML, CSS, SCSS, LESS, JSON и JSONC.
- Completion, hover, go to definition, references, rename, signature help, document symbols, formatting, code actions и diagnostics.
- Отключены встроенные Monaco-сервисы там, где работает настоящий LSP.
- Tailwind tooling: completion, hover preview, diagnostics неизвестных классов и сортировка классов.
- Schema tooling для launch config, package.json, tsconfig, ESLint, deploy config, GitHub workflows и Docker Compose.
- `.env` tooling: подсветка dotenv, diagnostics неправильных/дублирующихся переменных и маскировка секретов.
- User snippets из Settings как Monaco completion providers.
- AI inline completions.
- Spell checker tooling с code actions, сейчас за настройкой.

## Web App Center

- Центр React/Vite workflow на базе `NpmScriptsPanel`.
- Определяет stack/workspace через `server/webWorkflow.js`.
- Показывает overview, first-run checklist, scripts, dev servers, preview, Problems summary, Git mini-dashboard, REST summary, templates и dependencies.
- Есть guided и compact режимы.
- Настройка preview behavior: ask, auto-open, never.
- First-run checklist хранится по workspace.
- Package manager detection: npm, pnpm, Yarn, Bun.
- Scripts запускаются в integrated terminal с run/stop/status.
- Dependency manager умеет install/update/remove, фильтры и outdated checks.
- Templates открываются из Web App Center.

## Scripts и зависимости

- Чтение scripts из package.json.
- Генерация команд для npm, pnpm, Yarn и Bun.
- Определение package manager: сначала `packageManager` в package.json, потом lockfiles.
- Запуск scripts в отдельных terminal instances.
- Dependency manager читает dependencies, фильтрует по package/type, проверяет outdated и запускает package-manager операции.

## Preview workflow

- Embedded preview реализован через sandboxed iframe.
- Toolbar: address input, back/forward, reload, open external, close, responsive modes.
- Режимы: responsive, tablet, mobile.
- Preview открывает localhost URLs из terminal output.
- Preview console показывает navigation/reload/load/error events и сообщения из preview app через `postMessage` с `source: "blinkcode-preview-console"`.

## Terminal

- xterm UI.
- Backend PTY sessions через WebSocket.
- Несколько terminal instances с tabs, close actions, active status, cwd tracking и startup command.
- Terminal links умеют находить localhost/http URLs и открывать их в Browser Preview.
- Тема terminal берется из CSS theme variables BlinkCode, padding стал компактнее.

## Git и Source Control

- Git status API: staged, unstaged, untracked, conflicts, branch, roots.
- Source Control panel: stage, unstage, discard, commit, pull, push.
- Diff preview для changed files.
- Inline Git decorations в editor для измененных строк.
- Git blame line API и inline blame support.
- В Web App Center есть Git mini-dashboard с branch и счетчиками изменений.

## REST client

- Парсинг `.http` файлов.
- REST bar внутри `.http` файла: request selector и send.
- Backend request execution со status, headers, body, duration, size и truncated state.
- Local REST history.
- Web App Center REST summary и shortcuts для создания `.http` и env examples.

## Debugging

- Debug panel для Node/JavaScript.
- Поиск и создание launch configurations.
- Запуск текущего JS файла или выбранной конфигурации.
- Attach к inspector endpoint.
- Continue/pause/step commands.
- Variables, watch expressions, call stack, breakpoints, conditional breakpoints и debug console.
- Debug Console есть и в bottom panel.

## AI

- Проверка OpenAI-compatible provider.
- AI chat panel с active-file/project context.
- AI quick actions в editor и Command Palette.
- Agent planning и tool execution с approval/preview flow.
- Inline completion provider включается настройкой.

## Templates

- React + Vite + TypeScript.
- React + Vite + Tailwind.
- React + Tailwind + Router.
- Landing Page.
- API Client App с `.env.example`, `requests.http` и `src/api.ts`.
- React + Express API.
- Component Playground.

## Extensions

- Extensions panel.
- Marketplace API и local marketplace examples.
- Backend service для install/update/enable/disable/uninstall.
- Manifest validation и remote package install flow.
- Примеры расширений: Markdown Preview, Spell Checker, Theme Import.

## Settings и внешний вид

- English/Russian language setting.
- Dark/light/system color scheme.
- Темы: Tokyo Night, Everforest, Ayu, Catppuccin, Catppuccin Macchiato, Gruvbox, Kanagawa, Nord, Matrix, One Dark, AMOLED и imported VS Code theme.
- Theme import и VS Code theme conversion.
- UI density, UI scale, Explorer row height, bottom panel position, panel widths, activity bar ordering/visibility.
- Editor settings: font size, font family, tab size, word wrap, minimap, sticky scroll, autosave, ligatures, cursor style, whitespace rendering, bracket pair colorization, auto-closing brackets, smooth scrolling, trim trailing whitespace, insert final newline, insert spaces.
- Web workflow settings: preview behavior и guided/compact mode.
- Snippets settings tab.
- Keybindings settings tab с custom key recording.

## File handling и безопасность

- Централизованные правила supported files.
- Отдельная логика для binary, archive, document, media, font, generated и large files.
- Large file preview endpoint.
- Image preview с zoom/pan.
- Markdown preview virtual tab.
- Recovery buffers для unsaved/dirty state.
- Trash endpoint для более безопасного удаления.
- Backend path-safety helpers.
- Upload-folder пропускает тяжелые/generated папки: `node_modules`, `.git`, `dist`, `.next`, `.nuxt`, caches, virtualenv.

## Backend и Electron

- Express backend с API для tree, files, search, settings, state, Git, LSP, PTY, debugger, REST client, AI, extensions, dependencies, recovery buffers и web workflow analysis.
- File-system watcher обновляет workspace state.
- Electron main process координирует backend и renderer.
- Preload bridge для desktop APIs.
- Secret storage IPC пишет в app userData.
- Auto-updater IPC есть для проверки/установки updates.
- electron-builder: Windows setup/portable, macOS dmg/zip, Linux AppImage/deb.

## Quality и tests

- Scripts: typecheck, lint, quality, unit, e2e, debugger unit/e2e, release-check.
- Unit tests покрывают workspace roots, Tailwind, sidebar filter, schema tooling, REST client, problem limits, file operations, extensions, Git decorations, editor state, dependency manager, debugger, API responses и AI.
- Quality tests покрывают UI system, project templates, performance, localization scan, extension security, distribution security и architecture.

## Найденные пробелы в старой документации

- Debug panel был в коде, но почти не был описан в feature docs.
- Extension marketplace/service был в коде, но не был нормально отражен в feature docs.
- Web App Center в коде шире, чем описано в docs.
- REST client history и `.http` execution были описаны слишком поверхностно.
- Полный список templates не был отражен.
- Settings шире, чем в docs: density/scale, panel layout, activity bar customization, snippets, keybindings, imported themes, web workflow settings.
- Env tooling, schema tooling, snippets, spell checker, recovery buffers, markdown/image/large-file previews и upload-folder safety были недоописаны.
- В старой документации Browser Preview был описан как `<webview>`, но сейчас в коде используется sandboxed iframe.
