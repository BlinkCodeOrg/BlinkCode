import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import './ui.css';

type SidebarPanelProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  width: number;
};

export function SidebarPanel({ children, className = '', style, width, ...props }: SidebarPanelProps) {
  return (
    <aside
      className={`ui-sidebar-panel ${className}`.trim()}
      style={{ '--ui-sidebar-width': `${width}px`, width, ...style } as CSSProperties}
      {...props}
    >
      {children}
    </aside>
  );
}
