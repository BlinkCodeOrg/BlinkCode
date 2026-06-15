export interface ProjectTemplate {
  id: string;
  name: string;
  descriptionKey: string;
  files: Record<string, string>;
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'vanilla',
    name: 'Vanilla Web',
    descriptionKey: 'project.template.web',
    files: {
      'index.html': '<!doctype html>\n<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="src/style.css"><title>BlinkCode App</title></head><body><main id="app"></main><script type="module" src="src/main.js"></script></body></html>\n',
      'src/main.js': "document.querySelector('#app').innerHTML = '<h1>Hello from BlinkCode</h1>';\n",
      'src/style.css': 'body { margin: 0; font-family: system-ui, sans-serif; padding: 3rem; }\n',
      'package.json': '{\n  "private": true,\n  "scripts": { "dev": "vite", "build": "vite build" },\n  "devDependencies": { "vite": "^8.0.0" }\n}\n',
    },
  },
  {
    id: 'node',
    name: 'Node CLI',
    descriptionKey: 'project.template.node',
    files: {
      'src/index.js': "#!/usr/bin/env node\nconsole.log('Hello from BlinkCode');\n",
      'package.json': '{\n  "private": true,\n  "type": "module",\n  "scripts": { "start": "node src/index.js" }\n}\n',
      '.gitignore': 'node_modules/\n.env\n',
    },
  },
  {
    id: 'library',
    name: 'TypeScript Library',
    descriptionKey: 'project.template.typescript',
    files: {
      'src/index.ts': 'export function greet(name: string): string {\n  return `Hello, ${name}!`;\n}\n',
      'tsconfig.json': '{\n  "compilerOptions": { "target": "ES2022", "module": "NodeNext", "moduleResolution": "NodeNext", "declaration": true, "outDir": "dist", "strict": true },\n  "include": ["src"]\n}\n',
      'package.json': '{\n  "private": true,\n  "type": "module",\n  "scripts": { "build": "tsc" },\n  "devDependencies": { "typescript": "^6.0.0" }\n}\n',
    },
  },
];
