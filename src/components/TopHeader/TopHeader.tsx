import { useEditor } from '../../store/EditorContext';
import {
  Bot, PanelLeftClose, PanelLeft,
  Terminal,
  FolderOpen, Undo2, Redo2, Minus, Square, X
} from 'lucide-react';
import { closeWindow } from '../../features/topHeader/closeWindow';
import { isWindowMaximized } from '../../features/topHeader/isWindowMaximized';
import { minimizeWindow } from '../../features/topHeader/minimizeWindow';
import { openWorkspaceFolder } from '../../features/topHeader/openWorkspaceFolder';
import { toggleMaximizeWindow } from '../../features/topHeader/toggleMaximizeWindow';
import { useT } from '../../hooks/useT';
import { useEffect, useState } from 'react';
import BlinkLogoIcon from '../common/BlinkLogoIcon';
import CommandCenter from '../CommandCenter/CommandCenter';
import { HeaderClock } from './HeaderClock';
import { UpdateBanner } from './UpdateBanner';
import './TopHeader.css';

export default function TopHeader() {
  const { state, dispatch, toggleAIPanel, toggleSidebar, toggleTerminal, addToast, triggerEditorAction, openFolderFromServer } = useEditor();
  const tt = useT();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const sync = async () => {
      const maximized = await isWindowMaximized();
      if (maximized !== null) setIsMaximized(maximized);
    };

    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  const handleOpenFolder = async () => {
    try {
      await openWorkspaceFolder({ addToast, dispatch, openFolderFromServer, tt });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Open folder error:', err);
        addToast(tt('toast.openFail') + (err.message || ''), 'error');
      }
    }
  };

  const electronApi = (window as any).electronAPI;

  const handleMinimize = async () => {
    await minimizeWindow();
  };

  const handleMaximize = async () => {
    const next = await toggleMaximizeWindow();
    if (next !== null) setIsMaximized(next);
  };

  const handleClose = async () => {
    await closeWindow();
  };

  return (
    <header className="top-header">
      <div className="top-left">
        <div className="top-logo-wrap">
          <BlinkLogoIcon className="top-logo" />
        </div>
        <button className="icon-btn" onClick={toggleSidebar} title={tt('header.toggleSidebar')}>
          {state.sidebarVisible ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
        </button>
        <button className="icon-btn" onClick={() => triggerEditorAction('undo')} title={tt('header.undo')}>
          <Undo2 size={15} />
        </button>
        <button className="icon-btn" onClick={() => triggerEditorAction('redo')} title={tt('header.redo')}>
          <Redo2 size={15} />
        </button>
      </div>

      <div className="top-center"><CommandCenter /></div>

      <div className="top-right">
        <UpdateBanner />
        <HeaderClock />
        <button className="header-btn folder-btn" onClick={handleOpenFolder} title={tt('openFolder')}>
          <FolderOpen size={14} />
          <span>{tt('top.open')}</span>
        </button>
        <div className="header-divider" />
        <button className={`header-btn terminal-btn ${state.terminalOpen ? 'active' : ''}`} onClick={toggleTerminal} title={tt('top.terminal')}>
          <Terminal size={14} />
          <span>{tt('top.terminal')}</span>
        </button>
        <button className="header-btn ai-btn" onClick={toggleAIPanel} title={tt('top.ai')}>
          <Bot size={14} />
          <span>{tt('top.ai')}</span>
        </button>
        {electronApi && (
          <div className="window-controls">
            <button className="window-control-btn" onClick={handleMinimize} title={tt('window.minimize')}>
              <Minus size={14} />
            </button>
            <button className="window-control-btn" onClick={handleMaximize} title={tt(isMaximized ? 'window.restore' : 'window.maximize')}>
              <Square size={12} />
            </button>
            <button className="window-control-btn window-control-close" onClick={handleClose} title={tt('window.close')}>
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
