import { BRACKET_COLORS_DARK } from './bracketColorsDark';
import { BRACKET_COLORS_LIGHT } from './bracketColorsLight';

export function defineBlinkTheme(monaco: any, name: string, theme: { base: string; inherit: boolean; rules: any[]; colors: Record<string, string> }): void {
  monaco.editor.defineTheme(name, {
    ...theme,
    colors: {
      ...theme.colors,
      ...(theme.base === 'vs-dark' ? BRACKET_COLORS_DARK : BRACKET_COLORS_LIGHT),
    },
  });
}
