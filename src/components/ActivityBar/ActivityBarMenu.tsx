import { Check } from 'lucide-react';
import type { ActivityBarItemId } from '../../types';
import { ACTIVITY_BAR_ITEMS } from './activityBarItems';

interface ActivityBarMenuProps {
  hidden: ActivityBarItemId[];
  labels: Record<ActivityBarItemId, string>;
  x: number;
  y: number;
  onToggle: (id: ActivityBarItemId) => void;
}

export function ActivityBarMenu({ hidden, labels, onToggle, x, y }: ActivityBarMenuProps) {
  return (
    <div
      className="activity-menu"
      style={{ left: x, top: y }}
      role="menu"
      onPointerDown={event => event.stopPropagation()}
    >
      {ACTIVITY_BAR_ITEMS.map(item => (
        <button key={item.id} type="button" role="menuitemcheckbox" aria-checked={!hidden.includes(item.id)} onClick={() => onToggle(item.id)}>
          <span className="activity-menu-check">{!hidden.includes(item.id) && <Check size={13} />}</span>
          {labels[item.id]}
        </button>
      ))}
    </div>
  );
}
