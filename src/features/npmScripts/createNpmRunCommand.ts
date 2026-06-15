import type { NpmScriptPackage } from '../apiClient/npmScriptTypes';

function quoteShellArgument(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

export function createNpmRunCommand(packageManager: NpmScriptPackage['packageManager'], scriptName: string): string {
  const quotedName = quoteShellArgument(scriptName);
  if (packageManager === 'yarn') return `yarn run ${quotedName}`;
  if (packageManager === 'bun') return `bun run ${quotedName}`;
  if (packageManager === 'pnpm') return `pnpm run ${quotedName}`;
  return `npm run ${quotedName}`;
}
