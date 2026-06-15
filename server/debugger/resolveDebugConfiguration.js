import path from 'path';

export function resolveDebugConfiguration(configuration, workspaceRoot, activeFile = '') {
  const source = configuration && typeof configuration === 'object' ? configuration : {};
  const replaceVariables = value => {
    if (typeof value !== 'string') return value;
    return value
      .replaceAll('${workspaceFolder}', workspaceRoot)
      .replaceAll('${workspaceRoot}', workspaceRoot)
      .replaceAll('${file}', activeFile ? path.resolve(workspaceRoot, activeFile) : '')
      .replaceAll('${relativeFile}', activeFile)
      .replace(/\$\{env:([^}]+)\}/g, (_match, name) => process.env[name] || '');
  };
  const resolvePath = value => {
    const replaced = replaceVariables(value);
    if (!replaced) return replaced;
    return path.normalize(path.isAbsolute(replaced) ? replaced : path.resolve(workspaceRoot, replaced));
  };

  return {
    ...source,
    name: String(source.name || 'Current File'),
    type: String(source.type || 'node').replace(/^pwa-/, ''),
    request: source.request === 'attach' ? 'attach' : 'launch',
    program: resolvePath(source.program || activeFile),
    cwd: resolvePath(source.cwd || workspaceRoot),
    runtimeExecutable: replaceVariables(source.runtimeExecutable || process.execPath),
    runtimeArgs: Array.isArray(source.runtimeArgs) ? source.runtimeArgs.map(replaceVariables) : [],
    args: Array.isArray(source.args) ? source.args.map(replaceVariables) : [],
    env: Object.fromEntries(Object.entries(source.env || {}).map(([key, value]) => [key, replaceVariables(String(value))])),
    address: replaceVariables(source.address || '127.0.0.1'),
    port: Number(source.port || 9229),
    webSocketUrl: replaceVariables(source.webSocketUrl || ''),
    stopOnEntry: Boolean(source.stopOnEntry),
  };
}
