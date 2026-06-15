export type SettingsClickSound = 'none' | 'select' | 'soft';

export function getSettingsClickSound(target: HTMLElement | null): SettingsClickSound {
  if (!target) return 'none';
  if (target.closest('input, textarea, [contenteditable="true"]')) return 'none';
  if (target.closest('.ui-select-trigger, .ui-select-option')) return 'select';

  const clickable = target.closest('button, [role="button"], a, .ui-select-option, .ui-select-trigger');
  if (!clickable) return 'none';
  if ((clickable as HTMLButtonElement).disabled) return 'none';

  return 'soft';
}
