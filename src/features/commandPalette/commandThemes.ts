import type { EditorSettings } from '../../types';

export const commandThemes: Array<{ id: EditorSettings['theme']; label: string }> = [
  { id: 'tokyonight', label: 'Tokyo Night' },
  { id: 'everforest', label: 'Everforest' },
  { id: 'ayu', label: 'Ayu' },
  { id: 'catppuccin', label: 'Catppuccin' },
  { id: 'catppuccin-macchiato', label: 'Catppuccin Macchiato' },
  { id: 'gruvbox', label: 'Gruvbox' },
  { id: 'kanagawa', label: 'Kanagawa' },
  { id: 'nord', label: 'Nord' },
  { id: 'matrix', label: 'Matrix' },
  { id: 'one-dark', label: 'One Dark' },
  { id: 'amoled', label: 'AMOLED' },
];
