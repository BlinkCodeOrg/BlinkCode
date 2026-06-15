export function getPackageManagerInvocation(packageManager, platform = process.platform) {
  if (platform !== 'win32') {
    return { command: packageManager, prefixArgs: [] };
  }

  return {
    command: process.env.ComSpec || 'cmd.exe',
    prefixArgs: ['/d', '/s', '/c', `${packageManager}.cmd`],
  };
}
