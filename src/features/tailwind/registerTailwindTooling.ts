import { findTailwindClassRanges } from './findTailwindClassRanges';
import { getTailwindClassPreview } from './getTailwindClassPreview';
import { sortTailwindClasses } from './sortTailwindClasses';
import { tailwindClasses, tailwindPrefixes } from './tailwindClasses';
import { isRuntimeEditorSettingEnabled } from '../editorSettings/isRuntimeEditorSettingEnabled';
import { t } from '../../utils/i18n';

const languages = ['html', 'javascript', 'typescript', 'javascriptreact', 'typescriptreact'];
let registered = false;
const markerRefreshers = new Set<() => void>();
const getLanguage = () => (window as any).__blinkcodeSettings?.language || 'en';

export function refreshTailwindMarkers() {
  markerRefreshers.forEach(refresh => refresh());
}

export function registerTailwindTooling(monaco: any) {
  if (registered) return;
  registered = true;

  for (const language of languages) {
    monaco.languages.registerCompletionItemProvider(language, {
      triggerCharacters: ['"', "'", '`', ' ', '-'],
      provideCompletionItems(model: any, position: any) {
        if (!isRuntimeEditorSettingEnabled('tailwindTooling')) return { suggestions: [] };
        const line = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
        if (!/(?:class|className)\s*=\s*(?:{?\s*)?["'`][^"'`]*$/.test(line)) return { suggestions: [] };
        const word = model.getWordUntilPosition(position);
        const range = new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);
        return {
          suggestions: tailwindClasses.map(className => ({
            label: className,
            kind: monaco.languages.CompletionItemKind.Value,
            insertText: className,
            detail: t('tailwind.utility', getLanguage()),
            documentation: { value: `\`\`\`css\n${getTailwindClassPreview(className) || className}\n\`\`\`` },
            range,
          })),
        };
      },
    });

    monaco.languages.registerHoverProvider(language, {
      provideHover(model: any, position: any) {
        if (!isRuntimeEditorSettingEnabled('tailwindTooling')) return null;
        const offset = model.getOffsetAt(position);
        const item = findTailwindClassRanges(model.getValue()).find(range => offset >= range.start && offset <= range.end);
        const preview = item && getTailwindClassPreview(item.className);
        if (!item || !preview) return null;
        return { contents: [{ value: `**.${item.className}**` }, { value: `\`\`\`css\n${preview}\n\`\`\`` }] };
      },
    });
  }

  monaco.editor.onDidCreateModel((model: any) => updateMarkers(monaco, model));
  monaco.editor.getModels().forEach((model: any) => updateMarkers(monaco, model));

  function updateMarkers(runtime: any, model: any) {
    const language = model.getLanguageId();
    if (!languages.includes(language)) return;
    const refresh = () => {
      if (!isRuntimeEditorSettingEnabled('tailwindTooling')) {
        runtime.editor.setModelMarkers(model, 'blinkcode-tailwind', []);
        return;
      }
      const markers = findTailwindClassRanges(model.getValue())
        .filter(item => {
          const base = item.className.split(':').at(-1) || item.className;
          const prefix = base.replace(/^-/, '').split('-')[0];
          return tailwindPrefixes.has(prefix) && !tailwindClasses.includes(base as any);
        })
        .map(item => {
          const start = model.getPositionAt(item.start);
          const end = model.getPositionAt(item.end);
          return {
            severity: runtime.MarkerSeverity.Warning,
            message: t('tailwind.unknownUtility', getLanguage(), { name: item.className }),
            startLineNumber: start.lineNumber,
            startColumn: start.column,
            endLineNumber: end.lineNumber,
            endColumn: end.column,
          };
        });
      runtime.editor.setModelMarkers(model, 'blinkcode-tailwind', markers);
    };
    markerRefreshers.add(refresh);
    refresh();
    const contentDisposable = model.onDidChangeContent(refresh);
    model.onWillDispose?.(() => {
      contentDisposable.dispose();
      markerRefreshers.delete(refresh);
    });
  }
}

export function attachTailwindSortAction(monaco: any, editor: any) {
  return editor.addAction({
    id: 'blinkcode.tailwind.sortClasses',
    label: t('tailwind.sortClasses', getLanguage()),
    contextMenuGroupId: 'modification',
    run() {
      const model = editor.getModel();
      if (!model) return;
      const edits = findTailwindClassRanges(model.getValue());
      const groups = new Map<string, { start: number; end: number; values: string[] }>();
      for (const item of edits) {
        const line = model.getPositionAt(item.start).lineNumber;
        const key = String(line);
        const group = groups.get(key) || { start: item.start, end: item.end, values: [] };
        group.end = item.end;
        group.values.push(item.className);
        groups.set(key, group);
      }
      editor.executeEdits('tailwind-sort', [...groups.values()].map(group => ({
        range: monaco.Range.fromPositions(model.getPositionAt(group.start), model.getPositionAt(group.end)),
        text: sortTailwindClasses(group.values.join(' ')),
      })));
    },
  });
}
