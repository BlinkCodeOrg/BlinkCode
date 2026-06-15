import { useState } from 'react';
import type { GitBlameLineInfo } from '../../utils/api';
import { createGitBlameTitle } from '../../features/gitBlame/createGitBlameTitle';
import { formatRelativeTime } from '../../shared/time/formatRelativeTime';

type EditorBlameProps = {
  blameInfo: GitBlameLineInfo;
};

export function EditorBlame({ blameInfo }: EditorBlameProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <button className={`editor-blame ${expanded ? 'editor-blame-expanded' : ''}`} role="note" title={createGitBlameTitle(blameInfo)} onClick={() => setExpanded(value => !value)}>
      <span className="editor-blame-author">{blameInfo.author}</span>
      <span className="editor-blame-sep">.</span>
      <span className="editor-blame-time">{formatRelativeTime(blameInfo.authorTime)}</span>
      <span className="editor-blame-sep">.</span>
      <span className="editor-blame-summary">{blameInfo.summary}</span>
      <span className="editor-blame-sha">{blameInfo.shortCommit}</span>
      {expanded && (
        <span className="editor-blame-details">
          <strong>{blameInfo.commit}</strong>
          <span>{new Date(blameInfo.authorTime * 1000).toLocaleString()}</span>
          <span>{blameInfo.summary}</span>
        </span>
      )}
    </button>
  );
}
