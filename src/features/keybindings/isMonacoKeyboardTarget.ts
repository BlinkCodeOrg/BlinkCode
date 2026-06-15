export function isMonacoKeyboardTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('.monaco-editor'));
}
