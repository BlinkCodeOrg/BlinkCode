import type { EditorSettings } from '../../types';

export function createEditorLiveOptions(settings: EditorSettings): Record<string, unknown> {
  return {
    fontSize: settings.fontSize,
    tabSize: settings.tabSize,
    wordWrap: settings.wordWrap ? 'on' : 'off',
    minimap: { enabled: settings.minimap, showSlider: 'mouseover', renderCharacters: false, maxColumn: 100 },
    stickyScroll: { enabled: settings.stickyScroll, maxLineCount: 6, scrollWithEditor: true },
    fontLigatures: settings.fontLigatures,
    lineNumbers: settings.lineNumbers ? 'on' : 'off',
    cursorBlinking: settings.cursorBlinking,
    fontFamily: `'${settings.fontFamily}', 'JetBrains Mono', Consolas, monospace`,
    cursorStyle: settings.cursorStyle,
    renderWhitespace: settings.renderWhitespace,
    bracketPairColorization: { enabled: settings.bracketPairColorization },
    autoClosingBrackets: settings.autoClosingBrackets ? 'always' : 'never',
    smoothScrolling: settings.smoothScrolling,
    cursorSmoothCaretAnimation: settings.smoothScrolling ? 'on' : 'off',
    insertSpaces: settings.insertSpaces,
    guides: {
      bracketPairs: settings.bracketPairColorization,
      bracketPairsHorizontal: 'active',
      highlightActiveBracketPair: true,
      indentation: true,
      highlightActiveIndentation: true,
    },
    renderLineHighlight: 'line',
    renderLineHighlightOnlyWhenFocus: true,
    matchBrackets: 'always',
    occurrencesHighlight: 'singleFile',
    selectionHighlight: true,
  };
}
