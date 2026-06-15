import type { DependencyPackage, DependencyType } from '../apiClient/dependencyTypes';

function quoteShellArgument(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

export function createDependencyCommand(
  packageManager: DependencyPackage['packageManager'],
  action: 'install' | 'update' | 'remove',
  dependencyName: string,
  dependencyType: DependencyType = 'production',
): string {
  const name = quoteShellArgument(dependencyName);
  if (action === 'remove') {
    if (packageManager === 'npm') return `npm uninstall ${name}`;
    return `${packageManager} remove ${name}`;
  }

  const target = action === 'update' ? quoteShellArgument(`${dependencyName}@latest`) : name;
  const developmentFlag = dependencyType === 'development'
    ? packageManager === 'npm' ? ' --save-dev' : ' --dev'
    : '';
  if (packageManager === 'npm') return `npm install ${target}${developmentFlag}`;
  return `${packageManager} add ${target}${developmentFlag}`;
}
