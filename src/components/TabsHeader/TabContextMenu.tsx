import { Pin, PinOff, Split } from 'lucide-react';
import type { FileNode } from '../../types';
import { isMarkdownSourceFile } from '../../features/markdownPreview/isMarkdownSourceFile';

export type TabMenu = {
  tabId: string;
  rect: DOMRect;
};

type TabContextMenuProps = {
  menu: TabMenu;
  file: FileNode | null;
  tt: (key: string) => string;
  onSave: () => void;
  onDontSave: () => void;
  onCopyPath: (kind: 'absolute' | 'relative' | 'name') => void;
  onRevealInExplorer: () => void;
  onMarkdownPreview: () => void;
  onSplit: () => void;
  onCloseOnly: () => void;
  onCloseAll: () => void;
  markdownPreviewEnabled: boolean;
  pinned: boolean;
  onTogglePin: () => void;
};

export function TabContextMenu({
  menu,
  file,
  tt,
  onSave,
  onDontSave,
  onCopyPath,
  onRevealInExplorer,
  onMarkdownPreview,
  onSplit,
  onCloseOnly,
  onCloseAll,
  markdownPreviewEnabled,
  pinned,
  onTogglePin,
}: TabContextMenuProps) {
  const isExtensionDetail = Boolean(file?.extensionDetail);
  return (
    <div
      className="save-prompt save-prompt-floating"
      style={{ left: menu.rect.left + menu.rect.width / 2, top: menu.rect.bottom + 6, transform: 'translateX(-50%)' }}
      onClick={e => e.stopPropagation()}
    >
      <div className="save-prompt-actions save-prompt-actions-vertical">
        {!isExtensionDetail && <button className="save-prompt-btn save-prompt-plain" onClick={onTogglePin}>
          {pinned ? <PinOff size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} /> : <Pin size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />}
          {tt(pinned ? 'tab.unpin' : 'tab.pin')}
        </button>}
        {!isExtensionDetail && <button className="save-prompt-btn save-prompt-plain" onClick={onSave}>{tt('tab.save')}</button>}
        {!isExtensionDetail && <button className="save-prompt-btn save-prompt-plain" onClick={onDontSave}>{tt('tab.dontSave')}</button>}
        {!isExtensionDetail && <button className="save-prompt-btn save-prompt-plain" onClick={() => onCopyPath('absolute')}>{tt('tab.copyPath')}</button>}
        {!isExtensionDetail && <button className="save-prompt-btn save-prompt-plain" onClick={() => onCopyPath('relative')}>{tt('tab.copyRelativePath')}</button>}
        {!isExtensionDetail && <button className="save-prompt-btn save-prompt-plain" onClick={() => onCopyPath('name')}>{tt('tab.copyFileName')}</button>}
        {!isExtensionDetail && <button className="save-prompt-btn save-prompt-plain" onClick={onRevealInExplorer}>{tt('tab.revealInExplorer')}</button>}
        {markdownPreviewEnabled && isMarkdownSourceFile(file) && (
          <button className="save-prompt-btn save-prompt-plain" onClick={onMarkdownPreview}>{tt('tab.preview')}</button>
        )}
        {!isExtensionDetail && <button className="save-prompt-btn save-prompt-plain" onClick={onSplit}>
          <Split size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          {tt('tab.splitRight')}
        </button>}
        <button className="save-prompt-btn save-prompt-plain" onClick={onCloseOnly}>{tt('tab.close')}</button>
        <button className="save-prompt-btn save-prompt-plain" onClick={onCloseAll}>{tt('tab.closeAll')}</button>
      </div>
    </div>
  );
}
