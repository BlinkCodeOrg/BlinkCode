function normalizeModelPath(value: string) {
  let normalized = value;
  try {
    normalized = decodeURIComponent(normalized);
  } catch {}
  return normalized
    .replace(/\\/g, '/')
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
    .replace(/^\/+/, '');
}

export function doesEditorModelMatchFile(editor: any, fileKey: string) {
  const uri = editor?.getModel?.()?.uri;
  const rawModelPath =
    typeof uri?.path === 'string' ? uri.path : uri?.toString?.();
  if (!rawModelPath) return false;

  const modelPath = normalizeModelPath(rawModelPath);
  const expectedPath = normalizeModelPath(fileKey);
  return modelPath === expectedPath || modelPath.endsWith(`/${expectedPath}`);
}
