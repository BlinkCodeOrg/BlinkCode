import { escapeHtml } from '../../shared/html/escapeHtml';
import { isTableDivider } from './isTableDivider';
import { renderInlineMarkdown } from './renderInlineMarkdown';
import { sanitizeLimitedHtml } from './sanitizeLimitedHtml';
import { splitTableRow } from './splitTableRow';

export function renderMarkdown(value: string, sourcePath?: string): string {
  const lines = value.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let inCode = false;
  let listOpen: 'ul' | 'ol' | null = null;
  let blockquoteOpen = false;
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      html.push(`<p>${renderInlineMarkdown(paragraph.join(' '), sourcePath)}</p>`);
      paragraph = [];
    }
  };

  const closeList = () => {
    if (listOpen) {
      html.push(`</${listOpen}>`);
      listOpen = null;
    }
  };

  const closeBlockquote = () => {
    if (blockquoteOpen) {
      html.push('</blockquote>');
      blockquoteOpen = false;
    }
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      flushParagraph();
      closeList();
      closeBlockquote();
      const language = line.trim().slice(3).trim().replace(/[^a-z0-9_-]/gi, '');
      html.push(inCode ? '</code></pre>' : `<pre><code${language ? ` class="language-${language}"` : ''}>`);
      inCode = !inCode;
      continue;
    }

    if (inCode) {
      html.push(`${escapeHtml(line)}\n`);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      closeList();
      closeBlockquote();
      continue;
    }

    if (/^\s*---+\s*$/.test(line)) {
      flushParagraph();
      closeList();
      closeBlockquote();
      html.push('<hr>');
      continue;
    }

    if (/^\s*</.test(line)) {
      flushParagraph();
      closeList();
      closeBlockquote();
      const block: string[] = [line];
      while (i + 1 < lines.length && lines[i + 1].trim() && !/^(#{1,6})\s+/.test(lines[i + 1])) {
        if (!/^\s*</.test(lines[i + 1]) && !lines[i + 1].includes('</')) break;
        i += 1;
        block.push(lines[i]);
      }
      html.push(sanitizeLimitedHtml(block.join('\n'), sourcePath));
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      closeList();
      closeBlockquote();
      const level = heading[1].length;
      html.push(`<h${level}>${renderInlineMarkdown(heading[2].replace(/\s+\{#[^}]+\}\s*$/, ''), sourcePath)}</h${level}>`);
      continue;
    }

    if (i + 1 < lines.length && line.includes('|') && isTableDivider(lines[i + 1])) {
      flushParagraph();
      closeList();
      closeBlockquote();
      const headers = splitTableRow(line);
      const rows: string[][] = [];
      i += 1;
      while (i + 1 < lines.length && lines[i + 1].includes('|') && lines[i + 1].trim()) {
        i += 1;
        rows.push(splitTableRow(lines[i]));
      }
      html.push('<table><thead><tr>');
      headers.forEach(cell => html.push(`<th>${renderInlineMarkdown(cell, sourcePath)}</th>`));
      html.push('</tr></thead><tbody>');
      rows.forEach(row => {
        html.push('<tr>');
        row.forEach(cell => html.push(`<td>${renderInlineMarkdown(cell, sourcePath)}</td>`));
        html.push('</tr>');
      });
      html.push('</tbody></table>');
      continue;
    }

    const quote = line.match(/^\s*>\s?(.+)$/);
    if (quote) {
      flushParagraph();
      closeList();
      if (!blockquoteOpen) {
        html.push('<blockquote>');
        blockquoteOpen = true;
      }
      html.push(`<p>${renderInlineMarkdown(quote[1], sourcePath)}</p>`);
      continue;
    }

    const orderedItem = line.match(/^\s*\d+[.)]\s+(.+)$/);
    const unorderedItem = line.match(/^\s*[-*+]\s+(.+)$/);
    const listItem = orderedItem || unorderedItem;
    if (listItem) {
      flushParagraph();
      closeBlockquote();
      const listType = orderedItem ? 'ol' : 'ul';
      if (listOpen !== listType) {
        closeList();
        html.push(`<${listType}>`);
        listOpen = listType;
      }
      const task = listItem[1].match(/^\[([ xX])\]\s+(.+)$/);
      if (task) {
        const checked = task[1].toLowerCase() === 'x';
        html.push(`<li class="task-list-item"><input type="checkbox" disabled${checked ? ' checked' : ''}>${renderInlineMarkdown(task[2], sourcePath)}</li>`);
      } else {
        html.push(`<li>${renderInlineMarkdown(listItem[1], sourcePath)}</li>`);
      }
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  closeList();
  closeBlockquote();
  if (inCode) html.push('</code></pre>');
  return html.join('\n');
}
