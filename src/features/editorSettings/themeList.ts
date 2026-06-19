import type { EditorSettings } from '../../types';

export type ThemeName = EditorSettings['theme'];

export const THEME_LIST: { id: ThemeName; desc: string; url: string }[] = [
  { id: 'tokyonight', desc: 'Based on the tokyonight theme', url: 'https://github.com/folke/tokyonight.nvim' },
  { id: 'everforest', desc: 'Based on the Everforest theme', url: 'https://github.com/sainnhe/everforest' },
  { id: 'ayu', desc: 'Based on the Ayu dark theme', url: 'https://github.com/ayu-theme' },
  { id: 'catppuccin', desc: 'Based on the Catppuccin theme', url: 'https://github.com/catppuccin' },
  { id: 'catppuccin-macchiato', desc: 'Based on the Catppuccin theme', url: 'https://github.com/catppuccin' },
  { id: 'gruvbox', desc: 'Based on the Gruvbox theme', url: 'https://github.com/morhetz/gruvbox' },
  { id: 'kanagawa', desc: 'Based on the Kanagawa theme', url: 'https://github.com/rebelot/kanagawa.nvim' },
  { id: 'nord', desc: 'Based on the Nord theme', url: 'https://github.com/nordtheme/nord' },
  { id: 'matrix', desc: 'Green-on-black terminal style theme', url: '' },
  { id: 'one-dark', desc: 'Based on the Atom One Dark theme', url: 'https://github.com/Th3Whit3Wolf/one-nvim' },
  { id: 'amoled', desc: 'Pure black AMOLED theme', url: '' },
  { id: 'imported', desc: 'Imported VS Code theme', url: '' },
];
