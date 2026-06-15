import { X } from 'lucide-react';
import { getFileIcon } from '../../utils/fileIcons';
import type { Tab } from '../../types';

interface TabItemProps {
  active: boolean;
  dirty: boolean;
  tab: Tab;
  onActivate: () => void;
  onClose: (event: React.MouseEvent) => void;
  onContextMenu: (event: React.MouseEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragStart: (event: React.DragEvent<HTMLDivElement>) => void;
  draggable?: boolean;
  iconDataUrl?: string;
  pinned?: boolean;
  dragging?: boolean;
}

export function TabItem({
  active,
  dirty,
  onActivate,
  onClose,
  onContextMenu,
  onDragEnd,
  onDragOver,
  onDragStart,
  tab,
  draggable = true,
  iconDataUrl,
  pinned = false,
  dragging = false,
}: TabItemProps) {
  const icon = getFileIcon(tab.name);

  return (
    <div
      className={`tab ${active ? 'tab-active' : ''} ${pinned ? 'tab-pinned' : ''} ${dragging ? 'tab-dragging' : ''}`}
      onClick={onActivate}
      onContextMenu={onContextMenu}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <span className="tab-icon" style={{ color: icon.color }}>
        {iconDataUrl ? <img className="tab-extension-icon" src={iconDataUrl} alt="" /> : icon.icon}
      </span>
      <span className="tab-name">{tab.name}</span>
      {!pinned && <button
        className={`tab-close ${dirty ? 'tab-dirty' : ''}`}
        onClick={onClose}
        title={dirty ? 'Save or discard changes before closing' : 'Close'}
      >
        {dirty ? <span className="tab-dot" /> : <X size={12} />}
      </button>}
    </div>
  );
}
