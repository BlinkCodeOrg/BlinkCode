export interface TailwindClassRange {
  className: string;
  start: number;
  end: number;
}

export function findTailwindClassRanges(text: string): TailwindClassRange[] {
  const ranges: TailwindClassRange[] = [];
  const attributes = /(?:class|className)\s*=\s*(?:["'`]([^"'`]*)["'`]|{\s*["'`]([^"'`]*)["'`]\s*})/g;
  for (const match of text.matchAll(attributes)) {
    const content = match[1] ?? match[2] ?? '';
    const contentOffset = (match.index || 0) + match[0].indexOf(content);
    for (const token of content.matchAll(/\S+/g)) {
      ranges.push({
        className: token[0],
        start: contentOffset + (token.index || 0),
        end: contentOffset + (token.index || 0) + token[0].length,
      });
    }
  }
  return ranges;
}
