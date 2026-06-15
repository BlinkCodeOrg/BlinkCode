import type { Monaco } from './monacoTypes';

export function lspRangeToMonaco(range: { start: any; end: any }, monaco: Monaco) {
  return new monaco.Range(
    range.start.line + 1,
    range.start.character + 1,
    range.end.line + 1,
    range.end.character + 1,
  );
}
