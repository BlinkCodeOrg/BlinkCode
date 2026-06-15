import { Minus, Plus, RotateCcw } from 'lucide-react';
import type { GitFileEntry, GitStatusResponse } from '../../utils/api';
import { SourceControlSection } from './SourceControlSection';

interface SourceControlChangesListProps {
  collapsedSections: Set<string>;
  status: GitStatusResponse;
  totalChanges: number;
  tt: (key: string) => string;
  onDiscard: (paths: string[]) => void;
  onFileClick: (item: GitFileEntry, staged: boolean) => void;
  onStage: (paths?: string[]) => void;
  onToggleSection: (key: string) => void;
  onUnstage: (paths?: string[]) => void;
  onResolveConflict: (path: string, strategy: 'ours' | 'theirs' | 'resolved') => void;
}

export function SourceControlChangesList({
  collapsedSections,
  onDiscard,
  onFileClick,
  onStage,
  onToggleSection,
  onUnstage,
  onResolveConflict,
  status,
  totalChanges,
  tt,
}: SourceControlChangesListProps) {
  return (
    <div className="sc-body">
      <SourceControlSection
        sectionKey="conflicts"
        title={tt('sc.mergeConflicts')}
        items={status.conflicts || []}
        actions={(item) => (
          <div className="sc-conflict-actions">
            <button className="sc-text-btn" onClick={event => { event.stopPropagation(); onResolveConflict(item.path, 'ours'); }}>{tt('sc.ours')}</button>
            <button className="sc-text-btn" onClick={event => { event.stopPropagation(); onResolveConflict(item.path, 'theirs'); }}>{tt('sc.theirs')}</button>
            <button className="sc-text-btn" onClick={event => { event.stopPropagation(); onResolveConflict(item.path, 'resolved'); }}>{tt('sc.resolved')}</button>
          </div>
        )}
        staged={false}
        collapsed={collapsedSections.has('conflicts')}
        onToggle={onToggleSection}
        onFileClick={onFileClick}
        tt={tt}
      />
      <SourceControlSection
        sectionKey="staged"
        title={tt('sc.stagedChanges')}
        items={status.staged}
        actions={(item) => (
          <button className="sc-icon-btn" title={tt('sc.unstage')} onClick={(e) => { e.stopPropagation(); onUnstage([item.path]); }}>
            <Minus size={14} />
          </button>
        )}
        staged
        collapsed={collapsedSections.has('staged')}
        onToggle={onToggleSection}
        onFileClick={onFileClick}
        tt={tt}
        bulkAction={() => onUnstage()}
        bulkIcon={<Minus size={14} />}
      />
      <SourceControlSection
        sectionKey="unstaged"
        title={tt('sc.changes')}
        items={status.unstaged}
        actions={(item) => (
          <>
            <button className="sc-icon-btn" title={tt('sc.discard')} onClick={(e) => { e.stopPropagation(); onDiscard([item.path]); }}>
              <RotateCcw size={14} />
            </button>
            <button className="sc-icon-btn" title={tt('sc.stage')} onClick={(e) => { e.stopPropagation(); onStage([item.path]); }}>
              <Plus size={14} />
            </button>
          </>
        )}
        staged={false}
        collapsed={collapsedSections.has('unstaged')}
        onToggle={onToggleSection}
        onFileClick={onFileClick}
        tt={tt}
        bulkAction={() => onStage(status.unstaged.map(item => item.path))}
        bulkIcon={<Plus size={14} />}
      />
      <SourceControlSection
        sectionKey="untracked"
        title={tt('sc.untracked')}
        items={status.untracked}
        actions={(item) => (
          <button className="sc-icon-btn" title={tt('sc.stage')} onClick={(e) => { e.stopPropagation(); onStage([item.path]); }}>
            <Plus size={14} />
          </button>
        )}
        staged={false}
        collapsed={collapsedSections.has('untracked')}
        onToggle={onToggleSection}
        onFileClick={onFileClick}
        tt={tt}
        bulkAction={() => onStage(status.untracked.map(item => item.path))}
        bulkIcon={<Plus size={14} />}
      />
      {totalChanges === 0 && (
        <div className="sc-empty">{tt('sc.noChanges')}</div>
      )}
    </div>
  );
}
