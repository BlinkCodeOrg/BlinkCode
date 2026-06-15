import { FilePlus, FolderOpen, FolderPlus, FolderX, Save, X } from 'lucide-react';
import type { Command } from './commandTypes';
import type { CommandPaletteCommandContext } from './commandPaletteCommandContext';

export function createFileCommands({
  activeTab,
  addToast,
  closeTab,
  dispatch,
  openFolderFromServer,
  state,
  tt,
}: CommandPaletteCommandContext): Command[] {
  return [
    {
      id: 'file.newFile',
      title: tt('command.fileNew'),
      category: 'File',
      icon: <FilePlus size={14} />,
      shortcut: 'Ctrl+N',
      run: () => {
        dispatch({ type: 'SHOW_NEW_FILE', payload: { type: 'file' } });
        if (!state.sidebarVisible) dispatch({ type: 'TOGGLE_SIDEBAR' });
      },
    },
    {
      id: 'file.newFolder',
      title: tt('command.folderNew'),
      category: 'File',
      icon: <FolderPlus size={14} />,
      run: () => {
        dispatch({ type: 'SHOW_NEW_FILE', payload: { type: 'folder' } });
        if (!state.sidebarVisible) dispatch({ type: 'TOGGLE_SIDEBAR' });
      },
    },
    {
      id: 'file.save',
      title: tt('command.fileSave'),
      category: 'File',
      icon: <Save size={14} />,
      shortcut: 'Ctrl+S',
      when: () => Boolean(activeTab),
      run: () => {
        window.dispatchEvent(
          new KeyboardEvent('keydown', { key: 's', code: 'KeyS', ctrlKey: true, bubbles: true })
        );
      },
    },
    {
      id: 'file.closeTab',
      title: tt('command.fileClose'),
      category: 'File',
      icon: <X size={14} />,
      shortcut: 'Ctrl+W',
      when: () => Boolean(activeTab),
      run: () => {
        if (activeTab) closeTab(activeTab.id);
      },
    },
    {
      id: 'workspace.openFolder',
      title: tt('command.workspaceOpen'),
      category: 'Workspace',
      icon: <FolderOpen size={14} />,
      run: async () => {
        const api = (window as any).electronAPI;
        if (!api?.openFolder) {
          addToast(tt('workspace.desktopOnly'), 'info');
          return;
        }

        try {
          const folder = await api.openFolder();
          if (folder) {
            addToast(tt('workspace.loading'), 'info');
            await openFolderFromServer(folder);
          }
        } catch (err: any) {
          addToast(tt('workspace.openFailed', { error: err?.message || tt('common.unknownError') }), 'error');
        }
      },
    },
    {
      id: 'workspace.createFromTemplate',
      title: tt('command.workspaceCreate'),
      category: 'Workspace',
      icon: <FolderPlus size={14} />,
      run: () => {
        window.dispatchEvent(new CustomEvent('blinkcode:openProjectTemplates'));
      },
    },
    {
      id: 'workspace.closeFolder',
      title: tt('command.workspaceClose'),
      category: 'Workspace',
      icon: <FolderX size={14} />,
      when: () => state.files.length > 0,
      run: () => {
        dispatch({ type: 'CLOSE_FOLDER' });
        fetch('/api/close-workspace', { method: 'POST' }).catch(() => {});
      },
    },
  ];
}
