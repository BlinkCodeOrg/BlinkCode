export function monacoPositionToLsp(pos: { lineNumber: number; column: number }) {
  return { line: pos.lineNumber - 1, character: pos.column - 1 };
}
