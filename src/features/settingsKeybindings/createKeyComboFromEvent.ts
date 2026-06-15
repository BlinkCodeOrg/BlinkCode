export function createKeyComboFromEvent(event: Pick<KeyboardEvent, 'altKey' | 'ctrlKey' | 'key' | 'metaKey' | 'shiftKey'>): string | null {
  const parts: string[] = [];
  if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
  if (event.shiftKey) parts.push('Shift');
  if (event.altKey) parts.push('Alt');

  const key = event.key;
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(key)) return null;

  let normalizedKey = key;
  if (normalizedKey === ' ') normalizedKey = 'Space';
  else normalizedKey = key.length === 1 ? key.toUpperCase() : key;
  parts.push(normalizedKey);

  if (parts.length === 0) return null;
  return parts.join('+');
}
