import { execFile } from 'child_process';
import { getPackageManagerInvocation } from './getPackageManagerInvocation.js';
import { isMissingRegistryPackageError } from './isMissingRegistryPackageError.js';
import { parseOutdatedOutput } from './parseOutdatedOutput.js';

function getOutdatedArgs(packageManager) {
  if (packageManager === 'pnpm') return ['outdated', '--format', 'json'];
  if (packageManager === 'npm') {
    return ['outdated', '--json', '--fetch-timeout=15000', '--fetch-retries=0'];
  }
  return ['outdated', '--json'];
}

export function getOutdatedDependencies(directory, packageManager) {
  return new Promise((resolve, reject) => {
    const invocation = getPackageManagerInvocation(packageManager);
    execFile(
      invocation.command,
      [...invocation.prefixArgs, ...getOutdatedArgs(packageManager)],
      { cwd: directory, timeout: 25_000, maxBuffer: 5 * 1024 * 1024 },
      (error, stdout, stderr) => {
        const outdated = parseOutdatedOutput(stdout);
        if (outdated.length || !error) {
          resolve({ outdated, warnings: [] });
          return;
        }

        const message = String(stderr || error.message || 'Outdated check failed').trim();
        if (isMissingRegistryPackageError(message)) {
          resolve({
            outdated: [],
            warnings: ['One or more declared packages were not found in the configured registry.'],
          });
          return;
        }
        const wrappedError = new Error(message);
        wrappedError.code = error?.killed || error?.code === 'ETIMEDOUT'
          ? 'PACKAGE_MANAGER_TIMEOUT'
          : error?.code === 'ENOENT'
            ? 'PACKAGE_MANAGER_NOT_FOUND'
            : /network|registry|fetch|enotfound|econn|timeout/i.test(message)
              ? 'PACKAGE_REGISTRY_UNAVAILABLE'
              : 'PACKAGE_MANAGER_FAILED';
        reject(wrappedError);
      },
    );
  });
}
