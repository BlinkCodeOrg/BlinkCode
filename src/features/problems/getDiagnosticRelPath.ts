export function getDiagnosticRelPath(uri: string, workspacePath: string): string {
  try {
    let decoded = decodeURIComponent(uri.replace(/^file:\/\/\/?/, ''));
    decoded = decoded.replace(/\\/g, '/');
    const wsNorm = workspacePath.replace(/\\/g, '/');
    if (decoded.startsWith(wsNorm)) {
      let rel = decoded.slice(wsNorm.length);
      if (rel.startsWith('/')) rel = rel.slice(1);
      return rel;
    }

    const parts = decoded.split('/');
    return parts[parts.length - 1] || decoded;
  } catch {
    return uri;
  }
}
