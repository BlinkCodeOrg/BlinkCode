export function runMonacoAction(actionId: string): void {
  const editor = (window as any).__blinkcodeEditor;
  if (!editor) return;

  editor.focus();
  editor.trigger('command-palette', actionId, null);
}
