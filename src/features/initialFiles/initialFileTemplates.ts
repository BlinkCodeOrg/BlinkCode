import type { InitialFileTemplate } from './initialFileTemplate';

export const initialFileTemplates: InitialFileTemplate[] = [
  {
    name: 'src',
    type: 'folder',
    isExpanded: true,
    children: [
      {
        name: 'index.js',
        type: 'file',
        language: 'javascript',
        content: `// Welcome to BlinkCode!
// Press Run to execute your code

function greet(name) {
  return "Hello, " + name + "! Welcome to BlinkCode.";
}

console.log(greet("Developer"));

const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((a, b) => a + b, 0);
console.log("Sum of [1,2,3,4,5] = " + sum);
`,
      },
      {
        name: 'app.js',
        type: 'file',
        language: 'javascript',
        content: `class App {
  constructor() {
    this.version = "0.4.0";
    this.name = "BlinkCode";
  }
  start() {
    console.log(this.name + " v" + this.version + " started!");
  }
}

const app = new App();
app.start();
`,
      },
      {
        name: 'utils.js',
        type: 'file',
        language: 'javascript',
        content: `export function debounce(fn, ms) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US').format(date);
}
`,
      },
    ],
  },
  {
    name: 'styles',
    type: 'folder',
    isExpanded: false,
    children: [
      {
        name: 'main.css',
        type: 'file',
        language: 'css',
        content: `:root {
  --bg: #0f1115;
  --fg: #e6e6e6;
  --accent: #4f8cff;
}

body {
  margin: 0;
  font-family: 'JetBrains Mono', monospace;
  background: var(--bg);
  color: var(--fg);
}
`,
      },
    ],
  },
  {
    name: 'index.html',
    type: 'file',
    language: 'html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>BlinkCode</title>
  <link rel="stylesheet" href="styles/main.css">
</head>
<body>
  <div id="app"></div>
  <script src="src/index.js"></script>
</body>
</html>
`,
  },
  {
    name: 'package.json',
    type: 'file',
    language: 'json',
    content: `{
  "name": "blinkcode-project",
  "version": "0.4.0",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js"
  }
}
`,
  },
  {
    name: 'README.md',
    type: 'file',
    language: 'markdown',
    content: `# BlinkCode Project

Start coding! Press Run to see output.
`,
  },
];
