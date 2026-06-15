# Quality Gates

Run these checks before committing larger changes:

```bash
npm run quality
```

Run the complete CI-equivalent gate, including Chromium E2E:

```bash
npm run quality:full
```

The quality gate runs:

- `typecheck`: TypeScript project references.
- `lint`: ESLint for source health and React hooks basics.
- `test`: Node test runner checks for security and regression-prone helpers.
- `quality:architecture`: local architecture guard for file size and layering.
- `build`: production build smoke test.

Additional browser checks:

- `e2e`: isolated headless Playwright scenarios.
- `e2e:headed`: the same scenarios with a visible Chromium window.

E2E uses `e2e/fixtures/workspace` and temporary `e2e/.storage` state, so it does not modify the developer's real workspace or BlinkCode database.

Architecture rules are intentionally practical:

- Runtime code in `src/features` must not import UI components.
- `src/shared` and `src/utils` must stay component-free.
- Regular source files should stay under 260 lines.
- Data-heavy files are exempt when that shape is clearer, such as `1 language = 1 i18n file`, `1 theme = 1 theme definition file`, and icon/template maps.
