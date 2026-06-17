import { manifest, reactViteFiles, withRouter, withTailwind } from './reactViteTemplateFiles';

export interface ProjectTemplate {
  id: string;
  name: string;
  descriptionKey: string;
  files: Record<string, string>;
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'react-vite-ts',
    name: 'React + Vite + TypeScript',
    descriptionKey: 'project.template.reactVite',
    files: reactViteFiles(),
  },
  {
    id: 'react-vite-tailwind',
    name: 'React + Vite + Tailwind',
    descriptionKey: 'project.template.reactTailwind',
    files: withTailwind(reactViteFiles()),
  },
  {
    id: 'react-vite-tailwind-router',
    name: 'React + Tailwind + Router',
    descriptionKey: 'project.template.reactRouter',
    files: withRouter(withTailwind(reactViteFiles())),
  },
  {
    id: 'landing',
    name: 'Landing Page',
    descriptionKey: 'project.template.landing',
    files: withTailwind(reactViteFiles({
      'src/App.tsx': `import './styles.css';

const features = ['Fast Vite dev server', 'Responsive sections', 'Ready for real copy'];

export default function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto grid min-h-screen max-w-5xl content-center gap-8 px-6">
        <p className="text-sm font-bold uppercase tracking-widest text-sky-300">Launch faster</p>
        <h1 className="max-w-3xl text-6xl font-bold leading-none">A landing page starter for your next product.</h1>
        <p className="max-w-2xl text-lg leading-8 text-slate-300">Edit the copy, run the preview, and ship a polished first page.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {features.map(feature => <div key={feature} className="rounded-lg border border-white/10 p-4">{feature}</div>)}
        </div>
      </section>
    </main>
  );
}
`,
    })),
  },
  {
    id: 'api-client',
    name: 'API Client App',
    descriptionKey: 'project.template.apiClient',
    files: reactViteFiles({
      '.env.example': 'VITE_API_URL=http://localhost:3000\n',
      'requests.http': 'GET {{VITE_API_URL}}/health\n\n###\nPOST {{VITE_API_URL}}/items\nContent-Type: application/json\n\n{ "name": "BlinkCode" }\n',
      'src/api.ts': `const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function getHealth() {
  const response = await fetch(\`\${API_URL}/health\`);
  if (!response.ok) throw new Error(\`Request failed: \${response.status}\`);
  return response.json();
}
`,
    }),
  },
  {
    id: 'full-stack-react-express',
    name: 'React + Express API',
    descriptionKey: 'project.template.fullStack',
    files: (() => {
      const files = reactViteFiles({
        'server/index.js': `import express from 'express';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'BlinkCode API' });
});

app.listen(3000, () => {
  console.log('API running on http://localhost:3000');
});
`,
        'requests.http': 'GET http://localhost:3000/health\n',
      });
      const pkg = JSON.parse(files['package.json']);
      pkg.scripts = { ...pkg.scripts, api: 'node server/index.js' };
      pkg.dependencies = { ...pkg.dependencies, express: '^5.0.0' };
      return { ...files, 'package.json': manifest(pkg) };
    })(),
  },
  {
    id: 'component-playground',
    name: 'Component Playground',
    descriptionKey: 'project.template.playground',
    files: withTailwind(reactViteFiles({
      'src/App.tsx': `import './styles.css';

const states = ['Default', 'Hover', 'Loading', 'Disabled'];

export default function App() {
  return (
    <main className="min-h-screen bg-zinc-950 p-8 text-white">
      <section className="mx-auto grid max-w-4xl gap-6">
        <p className="text-sm font-bold uppercase tracking-widest text-emerald-300">Component playground</p>
        <h1 className="text-5xl font-bold">Design and test UI states quickly.</h1>
        <div className="grid gap-4 sm:grid-cols-2">
          {states.map(state => (
            <article key={state} className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-xl font-semibold">{state}</h2>
              <button className="mt-4 rounded-md bg-emerald-400 px-4 py-2 font-semibold text-zinc-950">{state}</button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
`,
    })),
  },
];
