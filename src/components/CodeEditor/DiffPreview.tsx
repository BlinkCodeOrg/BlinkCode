import { useMemo, useRef, useCallback } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { alignByHunks } from '../../features/diffPreview/alignByHunks';
import type { DiffHunk } from '../../features/diffPreview/diffPreviewTypes';
import { getDiffDisplayPath } from '../../features/diffPreview/getDiffDisplayPath';
import { renderDiffText } from '../../features/diffPreview/renderDiffText';
import { getMonacoLanguage } from '../../utils/supportedWebFiles';
import { useT } from '../../hooks/useT';
import './DiffPreview.css';

export default function DiffPreview({
  title,
  serverPath,
  fallbackName,
  original,
  modified,
  hunks,
  fontSize,
  fontFamily,
  theme,
}: {
  title: string;
  serverPath?: string;
  fallbackName: string;
  original: string;
  modified: string;
  hunks?: DiffHunk[];
  fontSize: number;
  fontFamily: string;
  theme: string;
}) {
  const tt = useT();
  const leftEditorRef = useRef<any>(null);
  const rightEditorRef = useRef<any>(null);
  const leftDecoRef = useRef<string[]>([]);
  const rightDecoRef = useRef<string[]>([]);
  const syncingRef = useRef(false);

  const originalLines = useMemo(() => renderDiffText(original), [original]);
  const modifiedLines = useMemo(() => renderDiffText(modified), [modified]);
  const aligned = useMemo(() => alignByHunks(originalLines, modifiedLines, hunks), [originalLines, modifiedLines, hunks]);

  const syncScroll = useCallback((source: 'left' | 'right') => {
    if (syncingRef.current) return;
    const fromEditor = source === 'left' ? leftEditorRef.current : rightEditorRef.current;
    const toEditor = source === 'left' ? rightEditorRef.current : leftEditorRef.current;
    if (!fromEditor || !toEditor) return;
    const from = fromEditor.getScrollTop();
    const fromLeft = fromEditor.getScrollLeft();
    syncingRef.current = true;
    toEditor.setScrollTop(from);
    toEditor.setScrollLeft(fromLeft);
    requestAnimationFrame(() => {
      syncingRef.current = false;
    });
  }, []);

  const applyLineDecorations = useCallback((editor: any, monaco: any, side: 'left' | 'right') => {
    const next: any[] = [];
    aligned.forEach((line, i) => {
      const lineNo = i + 1;
      if (side === 'left') {
        if (line.kind === 'removed' || line.kind === 'modified') {
          next.push({
            range: new monaco.Range(lineNo, 1, lineNo, 1),
            options: { isWholeLine: true, className: line.kind === 'removed' ? 'simple-diff-line-removed-bg' : 'simple-diff-line-modified-bg' },
          });
        }
      } else if (line.kind === 'added' || line.kind === 'modified') {
        next.push({
          range: new monaco.Range(lineNo, 1, lineNo, 1),
          options: { isWholeLine: true, className: line.kind === 'added' ? 'simple-diff-line-added-bg' : 'simple-diff-line-modified-bg' },
        });
      }
    });

    if (side === 'left') {
      leftDecoRef.current = editor.deltaDecorations(leftDecoRef.current, next);
    } else {
      rightDecoRef.current = editor.deltaDecorations(rightDecoRef.current, next);
    }
  }, [aligned]);

  const onLeftMount: OnMount = useCallback((editor, monaco) => {
    leftEditorRef.current = editor;
    editor.onDidScrollChange(() => syncScroll('left'));
    applyLineDecorations(editor, monaco, 'left');
  }, [applyLineDecorations, syncScroll]);

  const onRightMount: OnMount = useCallback((editor, monaco) => {
    rightEditorRef.current = editor;
    editor.onDidScrollChange(() => syncScroll('right'));
    applyLineDecorations(editor, monaco, 'right');
  }, [applyLineDecorations, syncScroll]);

  const leftText = useMemo(() => aligned.map(line => line.left || ' ').join('\n'), [aligned]);
  const rightText = useMemo(() => aligned.map(line => line.right || ' ').join('\n'), [aligned]);
  const displayPath = getDiffDisplayPath(serverPath, fallbackName);
  const fileNameForLanguage = displayPath.split('/').pop() || fallbackName;
  const language = getMonacoLanguage(fileNameForLanguage) || 'plaintext';

  return (
    <div className="code-editor">
      <div className="diff-notice" role="note">
        <span className="diff-notice-title">{title}</span>
        <span className="diff-notice-path">{displayPath}</span>
      </div>
      <div className="simple-diff" style={{ fontSize, fontFamily: `'${fontFamily}', 'JetBrains Mono', Consolas, monospace` }}>
        <div className="simple-diff-pane">
          <div className="simple-diff-pane-title">{tt('diff.original')}</div>
          <div className="simple-diff-code monaco-host">
            <Editor
              height="100%"
              language={language}
              theme={theme}
              value={leftText}
              onMount={onLeftMount}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                folding: false,
                renderLineHighlight: 'none',
              }}
            />
          </div>
        </div>
        <div className="simple-diff-pane">
          <div className="simple-diff-pane-title">{tt('diff.current')}</div>
          <div className="simple-diff-code monaco-host">
            <Editor
              height="100%"
              language={language}
              theme={theme}
              value={rightText}
              onMount={onRightMount}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                folding: false,
                renderLineHighlight: 'none',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
