export interface SchemaDefinition {
  match: (path: string) => boolean;
  keys: string[];
  required?: string[];
  descriptionKeys: Record<string, string>;
}

export const schemaDefinitions: SchemaDefinition[] = [
  {
    match: path => /(^|\/)\.blinkcode\/launch\.json$/i.test(path),
    keys: ['version', 'configurations', 'compounds'],
    required: ['version', 'configurations'],
    descriptionKeys: {
      version: 'schema.launch.version',
      configurations: 'schema.launch.configurations',
      compounds: 'schema.launch.compounds',
    },
  },
  {
    match: path => /(^|\/)package\.json$/i.test(path),
    keys: ['name', 'version', 'private', 'type', 'scripts', 'dependencies', 'devDependencies', 'peerDependencies', 'engines'],
    required: ['name'],
    descriptionKeys: {
      name: 'schema.package.name',
      scripts: 'schema.package.scripts',
      dependencies: 'schema.package.dependencies',
      devDependencies: 'schema.package.devDependencies',
      engines: 'schema.package.engines',
    },
  },
  {
    match: path => /(^|\/)tsconfig(?:\.[^/]+)?\.json$/i.test(path),
    keys: ['extends', 'compilerOptions', 'include', 'exclude', 'files', 'references'],
    descriptionKeys: {
      extends: 'schema.tsconfig.extends',
      compilerOptions: 'schema.tsconfig.compilerOptions',
      include: 'schema.tsconfig.include',
      references: 'schema.tsconfig.references',
    },
  },
  {
    match: path => /(^|\/)(?:\.eslintrc|eslint\.config)\.json$/i.test(path),
    keys: ['root', 'extends', 'plugins', 'parser', 'parserOptions', 'env', 'globals', 'rules', 'overrides'],
    descriptionKeys: {
      extends: 'schema.eslint.extends',
      rules: 'schema.eslint.rules',
      overrides: 'schema.eslint.overrides',
    },
  },
  {
    match: path => /(^|\/)(vercel|netlify)\.json$/i.test(path),
    keys: ['buildCommand', 'devCommand', 'installCommand', 'outputDirectory', 'functions', 'redirects', 'rewrites', 'headers'],
    descriptionKeys: {
      buildCommand: 'schema.deploy.buildCommand',
      outputDirectory: 'schema.deploy.outputDirectory',
      redirects: 'schema.deploy.redirects',
      rewrites: 'schema.deploy.rewrites',
    },
  },
  {
    match: path => /(^|\/)\.github\/workflows\/.+\.ya?ml$/i.test(path),
    keys: ['name', 'run-name', 'on', 'permissions', 'env', 'defaults', 'concurrency', 'jobs'],
    required: ['on', 'jobs'],
    descriptionKeys: {
      on: 'schema.workflow.on',
      permissions: 'schema.workflow.permissions',
      jobs: 'schema.workflow.jobs',
    },
  },
  {
    match: path => /(^|\/)(docker-)?compose(?:\.[^/]+)?\.ya?ml$/i.test(path),
    keys: ['name', 'services', 'networks', 'volumes', 'configs', 'secrets'],
    required: ['services'],
    descriptionKeys: {
      services: 'schema.compose.services',
      networks: 'schema.compose.networks',
      volumes: 'schema.compose.volumes',
    },
  },
];

export function getSchemaDefinition(path: string): SchemaDefinition | null {
  return schemaDefinitions.find(schema => schema.match(path.replace(/\\/g, '/'))) || null;
}
