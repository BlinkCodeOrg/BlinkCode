import { normalizeProjectPackageName } from './normalizeProjectPackageName';
import type { ProjectTemplate } from './projectTemplates';

export function buildProjectTemplateFiles(
  template: ProjectTemplate,
  projectName: string,
  packageManager: 'npm' | 'pnpm' | 'yarn',
): Record<string, string> {
  return Object.fromEntries(Object.entries(template.files).map(([relativePath, source]) => {
    if (relativePath !== 'package.json') return [relativePath, source];

    const sourceManifest = JSON.parse(source);
    const manifest = {
      name: normalizeProjectPackageName(projectName),
      ...sourceManifest,
      packageManager: `${packageManager}@latest`,
    };
    return [relativePath, `${JSON.stringify(manifest, null, 2)}\n`];
  }));
}
