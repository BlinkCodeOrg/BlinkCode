export function attachEnvSecretMasking(monaco: any, editor: any, enabled: () => boolean) {
  let decorationIds: string[] = [];
  const collection = editor.createDecorationsCollection?.([]);
  const applyDecorations = (decorations: any[]) => {
    if (collection) {
      collection.set(decorations);
      return;
    }
    decorationIds = editor.deltaDecorations(decorationIds, decorations);
  };
  const render = () => {
    const model = editor.getModel?.();
    if (!model || model.getLanguageId() !== 'dotenv' || !enabled()) {
      applyDecorations([]);
      return;
    }
    const decorations: any[] = [];
    for (let line = 1; line <= model.getLineCount(); line += 1) {
      const content = model.getLineContent(line);
      const separator = content.indexOf('=');
      if (separator < 0 || !content.slice(separator + 1).trim()) continue;
      decorations.push({
        range: new monaco.Range(line, separator + 2, line, content.length + 1),
        options: { inlineClassName: 'env-secret-value' },
      });
    }
    applyDecorations(decorations);
  };
  const contentDisposable = editor.onDidChangeModelContent(render);
  const modelDisposable = editor.onDidChangeModel(render);
  render();
  return {
    render,
    dispose() {
      contentDisposable.dispose();
      modelDisposable.dispose();
      collection?.clear();
      if (!collection) decorationIds = editor.deltaDecorations(decorationIds, []);
    },
  };
}
