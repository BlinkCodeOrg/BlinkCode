import type { ActivityBarItemDefinition } from './activityBarItems';

interface ActivityBarItemProps {
  item: ActivityBarItemDefinition;
  active: boolean;
  badge?: number;
  label: string;
  onClick: () => void;
  onContextMenu: (event: React.MouseEvent) => void;
  onDragStart: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
}

export function ActivityBarItem({
  item,
  active,
  badge,
  label,
  onClick,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDrop,
}: ActivityBarItemProps) {
  const Icon = item.icon;
  return (
    <button
      className={`activity-btn ${active ? 'active' : ''}`}
      data-testid={item.testId}
      draggable
      aria-label={label}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      title={label}
    >
      <Icon aria-hidden="true" size={21} strokeWidth={1.75} />
      {!!badge && <span className="activity-badge">{badge > 99 ? '99+' : badge}</span>}
    </button>
  );
}
