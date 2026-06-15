export function matchKeyCombo(e: KeyboardEvent, combo: string): boolean {
  const parts = combo.split('+');
  const keyPart = parts[parts.length - 1];
  const hasCtrl = parts.includes('Ctrl');
  const hasShift = parts.includes('Shift');
  const hasAlt = parts.includes('Alt');
  if (e.ctrlKey !== hasCtrl || e.shiftKey !== hasShift || e.altKey !== hasAlt) return false;
  const codeMap: Record<string, string> = {
    a: 'KeyA', b: 'KeyB', c: 'KeyC', d: 'KeyD', e: 'KeyE', f: 'KeyF',
    g: 'KeyG', h: 'KeyH', i: 'KeyI', j: 'KeyJ', k: 'KeyK', l: 'KeyL',
    m: 'KeyM', n: 'KeyN', o: 'KeyO', p: 'KeyP', q: 'KeyQ', r: 'KeyR',
    s: 'KeyS', t: 'KeyT', u: 'KeyU', v: 'KeyV', w: 'KeyW', x: 'KeyX',
    y: 'KeyY', z: 'KeyZ',
    '0': 'Digit0', '1': 'Digit1', '2': 'Digit2', '3': 'Digit3', '4': 'Digit4',
    '5': 'Digit5', '6': 'Digit6', '7': 'Digit7', '8': 'Digit8', '9': 'Digit9',
    ',': 'Comma', '.': 'Period', '/': 'Slash', '\\': 'Backslash',
    ';': 'Semicolon', "'": 'Quote', '[': 'BracketLeft', ']': 'BracketRight',
    '=': 'Equal', '-': 'Minus', '`': 'Backquote',
  };
  const code = codeMap[keyPart.toLowerCase()];
  if (code && e.code === code) return true;
  if (!code && e.key.toLowerCase() === keyPart.toLowerCase()) return true;
  return false;
}
