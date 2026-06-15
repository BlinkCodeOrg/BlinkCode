import type { ILink, ILinkProvider, Terminal } from 'xterm';
import { openExternalUrl } from './openExternalUrl';
import { stripAnsi } from './stripAnsi';
import { TERMINAL_URL_REGEX } from './terminalUrlRegex';

export function createTerminalLinkProvider(
  term: Terminal,
  openBrowserPreview: (url: string) => void,
): ILinkProvider {
  return {
    provideLinks(bufferLineNumber, callback) {
      const line = stripAnsi(term.buffer.active.getLine(bufferLineNumber - 1)?.translateToString(true) || '');
      const links: ILink[] = [];

      TERMINAL_URL_REGEX.lastIndex = 0;
      for (const match of line.matchAll(TERMINAL_URL_REGEX)) {
        const url = match[0];
        const startIndex = match.index ?? -1;
        if (startIndex < 0) continue;

        const endIndex = startIndex + url.length;
        links.push({
          range: {
            start: { x: startIndex + 1, y: bufferLineNumber },
            end: { x: endIndex, y: bufferLineNumber },
          },
          text: url,
          decorations: {
            underline: true,
            pointerCursor: true,
          },
          activate(event) {
            if (event.ctrlKey || event.metaKey) {
              openExternalUrl(url);
              return;
            }

            openBrowserPreview(url);
          },
        });
      }

      callback(links.length > 0 ? links : undefined);
    },
  };
}
