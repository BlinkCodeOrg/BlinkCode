interface StoredEditorPosition {
  line: number;
  column: number;
  viewState?: unknown;
}

export function restoreEditorViewState(
  editor: any,
  storedPosition: StoredEditorPosition,
) {
  const model = editor.getModel?.();
  const lineNumber = Math.min(
    Math.max(1, storedPosition.line),
    Math.max(1, model?.getLineCount?.() || storedPosition.line),
  );
  const maxColumn =
    model?.getLineMaxColumn?.(lineNumber) || storedPosition.column;
  const position = {
    lineNumber,
    column: Math.min(
      Math.max(1, storedPosition.column),
      Math.max(1, maxColumn),
    ),
  };

  if (storedPosition.viewState) {
    try {
      editor.restoreViewState(storedPosition.viewState);
    } catch {}
  }

  editor.setPosition(position);
  editor.revealPositionInCenterIfOutsideViewport?.(position, 0);
  editor.focus();
}
