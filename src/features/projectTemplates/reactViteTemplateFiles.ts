export function manifest(value: Record<string, unknown>) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

const gitignore = 'node_modules/\ndist/\n.env\n.env.local\n';

const viteIndex = '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>BlinkCode Web App</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/App.tsx"></script>\n  </body>\n</html>\n';

const baseApp = `import './styles.css';

export default function App() {
  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">React + Vite</p>
        <h1>Build from BlinkCode.</h1>
        <p>Run the dev server, open preview, edit this component, and ship your next web app.</p>
      </section>
    </main>
  );
}
`;

const baseMain = `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`;

const baseCss = `:root {
  color: #f5f7fb;
  background: #0b0f17;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* { box-sizing: border-box; }
body { margin: 0; min-width: 320px; min-height: 100vh; }

.app-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 48px;
}

.hero {
  width: min(720px, 100%);
  display: grid;
  gap: 18px;
}

.eyebrow {
  margin: 0;
  color: #8fb5ff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1 { margin: 0; font-size: clamp(40px, 8vw, 86px); line-height: 0.95; }
p { margin: 0; color: #aab4c5; font-size: 18px; line-height: 1.7; }
`;

export function reactViteFiles(extra?: Record<string, string>) {
  return {
    'index.html': viteIndex,
    'src/App.tsx': baseApp,
    'src/main.tsx': baseMain,
    'src/styles.css': baseCss,
    'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`,
    'tsconfig.json': manifest({
      compilerOptions: {
        target: 'ES2022',
        useDefineForClassFields: true,
        lib: ['DOM', 'DOM.Iterable', 'ES2022'],
        allowJs: false,
        skipLibCheck: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
        forceConsistentCasingInFileNames: true,
        module: 'ESNext',
        moduleResolution: 'Node',
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'react-jsx',
      },
      include: ['src'],
      references: [],
    }),
    'package.json': manifest({
      private: true,
      type: 'module',
      scripts: { dev: 'vite', build: 'tsc && vite build', preview: 'vite preview' },
      dependencies: { '@vitejs/plugin-react': '^5.0.0', react: '^19.0.0', 'react-dom': '^19.0.0', vite: '^8.0.0', typescript: '^6.0.0' },
      devDependencies: {},
    }),
    '.gitignore': gitignore,
    ...extra,
  };
}

const tailwindFiles = {
  'tailwind.config.js': `export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
`,
  'postcss.config.js': `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`,
  'src/styles.css': '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nbody { margin: 0; }\n',
};

export function withTailwind(files: Record<string, string>) {
  const pkg = JSON.parse(files['package.json']);
  pkg.devDependencies = { ...pkg.devDependencies, autoprefixer: '^10.4.0', postcss: '^8.4.0', tailwindcss: '^3.4.0' };
  return { ...files, ...tailwindFiles, 'package.json': manifest(pkg) };
}

export function withRouter(files: Record<string, string>) {
  const pkg = JSON.parse(files['package.json']);
  pkg.dependencies = { ...pkg.dependencies, 'react-router-dom': '^7.0.0' };
  return {
    ...files,
    'package.json': manifest(pkg),
    'src/App.tsx': `import { Link, Route, Routes } from 'react-router-dom';
import './styles.css';

function Home() {
  return <section><h1>Home</h1><p>Start editing routes in src/App.tsx.</p></section>;
}

function Dashboard() {
  return <section><h1>Dashboard</h1><p>A second route is already wired.</p></section>;
}

export default function App() {
  return (
    <main className="app-shell">
      <nav className="hero">
        <p className="eyebrow">React Router</p>
        <Link to="/">Home</Link>
        <Link to="/dashboard">Dashboard</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </main>
  );
}
`,
    'src/main.tsx': `import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
`,
  };
}
