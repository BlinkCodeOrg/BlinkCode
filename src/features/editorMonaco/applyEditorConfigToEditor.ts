import type { EditorSettings } from '../../types';
import { fetchEditorConfigCached } from '../../utils/api';

export async function applyEditorConfigToEditor(
  editor: any,
  serverPath: string,
  settings: Pick<EditorSettings, 'insertSpaces' | 'tabSize'>,
) {
  if (!serverPath || serverPath.startsWith('__')) return;
  const config = await fetchEditorConfigCached(serverPath);
  const model = editor.getModel?.();
  if (!model) return;

  const tabSize = Number(config.indent_size === 'tab' ? config.tab_width : config.indent_size);
  const insertSpaces = config.indent_style ? config.indent_style === 'space' : settings.insertSpaces;
  const resolvedTabSize = Number.isFinite(tabSize) && tabSize > 0 ? tabSize : settings.tabSize;
  editor.updateOptions({ insertSpaces, tabSize: resolvedTabSize });
  model.updateOptions?.({ insertSpaces, tabSize: resolvedTabSize });
  if (config.end_of_line === 'lf') model.pushEOL?.(0);
  if (config.end_of_line === 'crlf') model.pushEOL?.(1);
}
