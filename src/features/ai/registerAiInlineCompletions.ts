import { loadAiConfig } from './aiConfig';
import { requestAiCompletion } from '../apiClient/requestAiCompletion';
import { isRuntimeEditorSettingEnabled } from '../editorSettings/isRuntimeEditorSettingEnabled';
import { isAiProviderAvailable } from './isAiProviderAvailable';

const languages = ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'html', 'css', 'json'];
let registered = false;

export function registerAiInlineCompletions(monaco: any) {
  if (registered) return;
  registered = true;
  for (const language of languages) {
    monaco.languages.registerInlineCompletionsProvider(language, {
      async provideInlineCompletions(model: any, position: any, _context: any, token: any) {
        if (!isRuntimeEditorSettingEnabled('aiInlineCompletions')) return { items: [] };
        const linePrefix = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
        if (linePrefix.trim().length < 3) return { items: [] };
        await new Promise(resolve => setTimeout(resolve, 350));
        if (token.isCancellationRequested) return { items: [] };
        const config = loadAiConfig();
        if (!(await isAiProviderAvailable(config)) || token.isCancellationRequested) return { items: [] };
        const offset = model.getOffsetAt(position);
        const controller = new AbortController();
        const cancellation = token.onCancellationRequested?.(() => controller.abort());
        try {
          const completion = await requestAiCompletion(config, {
            prefix: model.getValue().slice(0, offset),
            suffix: model.getValue().slice(offset),
            filePath: model.uri.path.replace(/^\//, ''),
            language,
          }, controller.signal);
          if (!completion || token.isCancellationRequested) return { items: [] };
          return { items: [{ insertText: completion, range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column) }] };
        } catch {
          return { items: [] };
        } finally {
          cancellation?.dispose?.();
        }
      },
      freeInlineCompletions() {},
    });
  }
}
