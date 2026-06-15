import { useEffect } from 'react';
import type { TabMenu } from './TabContextMenu';

export function useTabsMenuDismiss(menu: TabMenu | null, closeMenu: () => void) {
  useEffect(() => {
    if (!menu) return;

    const handleGlobalPointerDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('.save-prompt')) return;
      if (target?.closest('.tab')) return;
      closeMenu();
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };

    window.addEventListener('mousedown', handleGlobalPointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handleGlobalPointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [closeMenu, menu]);
}
