import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({ description, icon: Icon, title }: EmptyStateProps) {
  return (
    <div className="ui-empty-state">
      {Icon && <span className="ui-empty-icon"><Icon size={22} /></span>}
      <strong>{title}</strong>
      {description && <span>{description}</span>}
    </div>
  );
}
