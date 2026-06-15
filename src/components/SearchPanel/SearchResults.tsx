import { ChevronDown, ChevronRight, FileText, Replace } from 'lucide-react';
import type { WorkspaceSearchFileResult } from '../../utils/api';
import { highlightedPreview } from '../../features/search/highlightedPreview';
import { useT } from '../../hooks/useT';

type SearchResultsProps = {
  results: WorkspaceSearchFileResult[];
  expanded: Set<string>;
  onToggleExpanded: (path: string) => void;
  onOpenMatch: (path: string, line: number, column: number) => void;
  onReplaceMatch: (path: string, match: WorkspaceSearchFileResult['matches'][number]) => void;
};

export function SearchResults({ results, expanded, onToggleExpanded, onOpenMatch, onReplaceMatch }: SearchResultsProps) {
  const tt = useT();
  return (
    <div className="search-results">
      {results.map(file => {
        const isOpen = expanded.has(file.path);
        return (
          <div className="search-result-file" key={file.path}>
            <button className="search-result-file-head" onClick={() => onToggleExpanded(file.path)}>
              {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              <FileText size={13} />
              <span className="search-result-file-path">{file.path}</span>
              <span className="search-result-count">{file.matches.length}</span>
            </button>
            {isOpen && file.matches.map((match, index) => (
              <div
                className="search-result-match-row search-result-match"
                key={`${file.path}:${match.line}:${match.column}:${index}`}
              >
              <button className="search-result-match-main" onClick={() => onOpenMatch(file.path, match.line, match.column)}>
                <span className="search-result-line">{match.line}</span>
                <span className="search-result-preview" dangerouslySetInnerHTML={{ __html: highlightedPreview(match.preview, match.column, match.length) }} />
              </button>
              <button className="search-result-replace-one" onClick={() => onReplaceMatch(file.path, match)} title={tt('search.replaceMatch')}>
                <Replace size={12} />
              </button>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
