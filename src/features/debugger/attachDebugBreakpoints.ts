import { getDebugBreakpoints, toggleDebugBreakpoint } from './debugBreakpoints';

export function attachDebugBreakpoints(monaco: any, editor: any, getFilePath: () => string | undefined) {
  let decorationIds: string[] = [];

  const render = () => {
    const filePath = getFilePath();
    const breakpoints = filePath ? getDebugBreakpoints(filePath) : [];
    decorationIds = editor.deltaDecorations(decorationIds, breakpoints.map(line => ({
      range: new monaco.Range(line, 1, line, 1),
      options: {
        glyphMarginClassName: 'debug-breakpoint-glyph',
        glyphMarginHoverMessage: { value: `Breakpoint at line ${line}` },
        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
      },
    })));
  };

  const mouseDisposable = editor.onMouseDown((event: any) => {
    const filePath = getFilePath();
    const line = event.target?.position?.lineNumber;
    if (event.target?.type !== monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN || !filePath || !line) return;
    toggleDebugBreakpoint(filePath, line);
    render();
  });

  const changed = (event: Event) => {
    if ((event as CustomEvent).detail?.filePath === getFilePath()) render();
  };
  window.addEventListener('blinkcode:debugBreakpointsChanged', changed);
  render();

  return {
    render,
    dispose() {
      mouseDisposable.dispose();
      window.removeEventListener('blinkcode:debugBreakpointsChanged', changed);
      decorationIds = editor.deltaDecorations(decorationIds, []);
    },
  };
}
