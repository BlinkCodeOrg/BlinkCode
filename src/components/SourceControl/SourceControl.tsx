import { GitBranch } from 'lucide-react';
import { useEditor } from '../../store/EditorContext';
import { useSourceControlState } from '../../features/sourceControl/useSourceControlState';
import { useT } from '../../hooks/useT';
import { useHorizontalResize } from '../../hooks/useHorizontalResize';
import { DiscardConfirmModal } from './DiscardConfirmModal';
import { SourceControlChangesList } from './SourceControlChangesList';
import { SourceControlCommitBox } from './SourceControlCommitBox';
import { SourceControlHeader } from './SourceControlHeader';
import { SidebarPanel } from '../ui/SidebarPanel';
import { Select } from '../ui/Select';
import './SourceControl.css';

export default function SourceControl() {
  const { state, openDiffPreview, toggleSourceControl, addToast, updateSettings } = useEditor();
  const tt = useT();
  const panelWidth = state.settings.panelWidths.sourceControl;
  const resizerRef = useHorizontalResize(panelWidth, width => updateSettings({ panelWidths: { ...state.settings.panelWidths, sourceControl: width } }));
  const sourceControl = useSourceControlState({
    addToast,
    openDiffPreview,
    tt,
    workspaceDir: state.workspaceDir,
  });

  if (!state.showSourceControl) return null;

  const status = sourceControl.status;
  const totalChanges = (status?.staged.length || 0) + (status?.unstaged.length || 0) + (status?.untracked.length || 0) + (status?.conflicts?.length || 0);

  return (
    <SidebarPanel className="source-control-panel" width={panelWidth}>
      {sourceControl.discardPaths && (
        <DiscardConfirmModal paths={sourceControl.discardPaths} tt={tt} onCancel={() => sourceControl.setDiscardPaths(null)} onConfirm={sourceControl.confirmDiscard} />
      )}
      <SourceControlHeader
        title={tt('sc.title')}
        totalChanges={totalChanges}
        loading={sourceControl.loading}
        remoteAction={sourceControl.remoteAction}
        tt={tt}
        onPull={sourceControl.pull}
        onPush={sourceControl.push}
        onRefresh={sourceControl.refresh}
        onClose={toggleSourceControl}
      />
      {(status?.roots.length || 0) > 1 && (
        <div className="sc-root-picker">
          <Select
            ariaLabel={tt('sc.repositoryRoot')}
            options={status!.roots.map(root => ({ value: root.ref, label: root.name }))}
            value={sourceControl.selectedRoot}
            onChange={value => sourceControl.setSelectedRoot(String(value))}
          />
        </div>
      )}

      {!status?.isRepo ? (
        <div className="sc-no-repo">{tt('sc.noRepo')}</div>
      ) : (
        <>
          {status.branch && (
            <div className="sc-branch-label">
              <GitBranch size={12} />
              {status.branch}
            </div>
          )}
          <SourceControlCommitBox
            value={sourceControl.commitMsg}
            committing={sourceControl.committing}
            stagedCount={status.staged.length}
            amend={sourceControl.amend}
            tt={tt}
            onChange={sourceControl.setCommitMsg}
            onCommit={sourceControl.commit}
            onAmendChange={sourceControl.setAmend}
          />
          <SourceControlChangesList
            collapsedSections={sourceControl.collapsedSections}
            onDiscard={sourceControl.discard}
            onFileClick={sourceControl.openFileDiff}
            onStage={sourceControl.stage}
            onToggleSection={sourceControl.toggleSection}
            onUnstage={sourceControl.unstage}
            status={status}
            totalChanges={totalChanges}
            tt={tt}
            onResolveConflict={sourceControl.resolveConflict}
          />
        </>
      )}
      <div className="source-control-resizer ui-sidebar-resizer" ref={resizerRef} />
    </SidebarPanel>
  );
}
