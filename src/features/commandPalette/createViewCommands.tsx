import {
  Bot,
  ChevronsDownUp,
  ChevronsLeftRight,
  PanelLeftClose,
  Settings as SettingsIcon,
  Sidebar as SidebarIcon,
  Split,
  Terminal,
  WrapText,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { Command } from './commandTypes';
import type { CommandPaletteCommandContext } from './commandPaletteCommandContext';

export function createViewCommands({
  activeTab,
  closeSplitTab,
  collapseAll,
  settings,
  splitTab,
  state,
  toggleAIPanel,
  toggleSettings,
  toggleSidebar,
  toggleTerminal,
  tt,
  updateSettings,
}: CommandPaletteCommandContext): Command[] {
  return [
    {
      id: 'view.toggleSidebar',
      title: tt('command.viewSidebar'),
      category: 'View',
      icon: <SidebarIcon size={14} />,
      shortcut: 'Ctrl+B',
      run: () => toggleSidebar(),
    },
    {
      id: 'view.toggleTerminal',
      title: tt('command.viewTerminal'),
      category: 'View',
      icon: <Terminal size={14} />,
      shortcut: 'Ctrl+`',
      run: () => toggleTerminal(),
    },
    {
      id: 'view.toggleAI',
      title: tt('command.viewAI'),
      category: 'View',
      icon: <Bot size={14} />,
      shortcut: 'Ctrl+I',
      run: () => toggleAIPanel(),
    },
    {
      id: 'view.toggleSettings',
      title: tt('command.viewSettings'),
      category: 'View',
      icon: <SettingsIcon size={14} />,
      shortcut: 'Ctrl+,',
      run: () => toggleSettings(),
    },
    {
      id: 'view.toggleWordWrap',
      title: tt(settings.wordWrap ? 'command.wordWrapDisable' : 'command.wordWrapEnable'),
      category: 'View',
      icon: <WrapText size={14} />,
      run: () => updateSettings({ wordWrap: !settings.wordWrap }),
    },
    {
      id: 'view.zoomIn',
      title: tt('command.zoomIn'),
      category: 'View',
      icon: <ZoomIn size={14} />,
      shortcut: 'Ctrl+=',
      run: () => updateSettings({ fontSize: Math.min(30, settings.fontSize + 1) }),
    },
    {
      id: 'view.zoomOut',
      title: tt('command.zoomOut'),
      category: 'View',
      icon: <ZoomOut size={14} />,
      shortcut: 'Ctrl+-',
      run: () => updateSettings({ fontSize: Math.max(8, settings.fontSize - 1) }),
    },
    {
      id: 'view.splitEditor',
      title: tt('command.splitRight'),
      category: 'View',
      icon: <Split size={14} />,
      shortcut: 'Ctrl+\\',
      when: () => {
        const file = activeTab ? state.files.find(node => node.id === activeTab.fileId) : null;
        return Boolean(activeTab && !file?.extensionDetail && !state.splitActiveTabId);
      },
      run: () => {
        if (activeTab) splitTab(activeTab.id);
      },
    },
    {
      id: 'view.closeSplit',
      title: tt('command.closeSplit'),
      category: 'View',
      icon: <PanelLeftClose size={14} />,
      when: () => !!state.splitActiveTabId,
      run: () => closeSplitTab(),
    },
    {
      id: 'view.collapseAllFolders',
      title: tt('command.collapseFolders'),
      category: 'View',
      icon: <ChevronsDownUp size={14} />,
      run: () => collapseAll(),
    },
    {
      id: 'view.toggleCompactMode',
      title: tt(settings.compactMode ? 'command.compactDisable' : 'command.compactEnable'),
      category: 'View',
      icon: <ChevronsLeftRight size={14} />,
      run: () => updateSettings({ compactMode: !settings.compactMode }),
    },
  ];
}
