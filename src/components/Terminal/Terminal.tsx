import { useCallback, useEffect, useRef } from 'react';
import { useEditor } from '../../store/EditorContext';
import { v4 as uuid } from 'uuid';
import 'xterm/css/xterm.css';
import type { TerminalInstance } from '../../types';
import { useTerminalXterm } from '../../features/terminal/useTerminalXterm';
import { useT } from '../../hooks/useT';
import { useResizable } from '../../hooks/useResizable';
import { TerminalHeader } from './TerminalHeader';
import { TerminalInstancesBody } from './TerminalInstancesBody';
import './Terminal.css';

export default function TerminalPanel() {
  const {
    state, toggleTerminal, setTerminalHeight,
    addTerminalInstance, removeTerminalInstance, setActiveTerminal,
    updateTerminalCwd, setTerminalStatus, openBrowserPreview, addToast
  } = useEditor();
  const tt = useT();
  const resizeRef = useRef<HTMLDivElement>(null);
  const autoOpenedUrls = useRef(new Set<string>());
  const creatingDefaultTerminal = useRef(false);
  const activeInst = state.terminalInstances.find(inst => inst.id === state.activeTerminalId) || null;
  const terminalXterm = useTerminalXterm({
    activeInstance: activeInst,
    instances: state.terminalInstances,
    onOpenPreview: openBrowserPreview,
    open: state.terminalOpen,
    panelHeight: state.terminalHeight,
    updateTerminalCwd,
    setTerminalStatus,
    workspaceDir: state.workspaceDir,
  });

  const addNewTerminal = useCallback(() => {
    const id = uuid();
    const num = state.terminalInstances.length + 1;
    const inst: TerminalInstance = { id, name: `${tt('terminal.shell')} ${num}`, cwd: '' };
    addTerminalInstance(inst);
  }, [addTerminalInstance, state.terminalInstances.length, tt]);

  useEffect(() => {
    if (state.terminalOpen && state.terminalInstances.length === 0) {
      if (creatingDefaultTerminal.current) return;
      creatingDefaultTerminal.current = true;
      addNewTerminal();
    } else if (
      state.terminalOpen
      && state.terminalInstances.length > 0
      && !state.terminalInstances.some(instance => instance.id === state.activeTerminalId)
    ) {
      creatingDefaultTerminal.current = false;
      setActiveTerminal(state.terminalInstances[state.terminalInstances.length - 1].id);
    } else if (state.terminalInstances.length > 0 || !state.terminalOpen) {
      creatingDefaultTerminal.current = false;
    }
  }, [addNewTerminal, setActiveTerminal, state.activeTerminalId, state.terminalInstances, state.terminalOpen]);

  const handleResize = useCallback((e: MouseEvent) => {
    const parent = resizeRef.current?.parentElement?.getBoundingClientRect();
    if (parent) setTerminalHeight(parent.bottom - e.clientY);
  }, [setTerminalHeight]);

  useResizable(resizeRef, handleResize, 'row');

  useEffect(() => {
    const urls = Object.values(terminalXterm.detectedLinks)
      .flat()
      .filter(link => /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?/i.test(link));
    (window as any).__blinkcodeTerminalLocalUrls = urls;
    (window as any).__blinkcodeTerminalLocalUrlState = { urls, workspaceDir: state.workspaceDir, updatedAt: Date.now() };
    window.dispatchEvent(new CustomEvent('blinkcode:terminalLocalUrls', { detail: { urls, workspaceDir: state.workspaceDir } }));
    return () => {
      (window as any).__blinkcodeTerminalLocalUrls = [];
      (window as any).__blinkcodeTerminalLocalUrlState = { urls: [], workspaceDir: state.workspaceDir, updatedAt: Date.now() };
      window.dispatchEvent(new CustomEvent('blinkcode:terminalLocalUrls', { detail: { urls: [], workspaceDir: state.workspaceDir } }));
    };
  }, [state.workspaceDir, terminalXterm.detectedLinks]);

  useEffect(() => {
    if (state.browserOpen) return;
    const url = Object.values(terminalXterm.detectedLinks)
      .flat()
      .find(link => /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?/i.test(link));
    if (!url || autoOpenedUrls.current.has(url)) return;
    autoOpenedUrls.current.add(url);
    if (state.settings.webWorkflowPreviewBehavior === 'never') return;
    if (state.settings.webWorkflowPreviewBehavior === 'ask') {
      addToast(`${tt('webCenter.detectedLocalUrl')}: ${url}`, 'info');
      return;
    }
    openBrowserPreview(url);
  }, [addToast, openBrowserPreview, state.browserOpen, state.settings.webWorkflowPreviewBehavior, terminalXterm.detectedLinks, tt]);

  const closeTerminal = (id: string) => {
    terminalXterm.closeTerminalShell(id, 'stopped');
    removeTerminalInstance(id);
  };

  if (!state.terminalOpen) return null;

  return (
    <div className="terminal-panel">
      <div className="terminal-resizer" ref={resizeRef} />
      <TerminalHeader
        activeId={state.activeTerminalId}
        activeInstance={activeInst}
        instances={state.terminalInstances}
        onActivate={setActiveTerminal}
        onAdd={addNewTerminal}
        onClosePanel={toggleTerminal}
        onCloseTab={closeTerminal}
        onReconnect={() => activeInst && terminalXterm.connectShell(
          activeInst.id,
          activeInst.cwd || state.workspaceDir,
          activeInst.startupCommand,
        )}
      />
      {state.terminalInstances.length > 0 && (
        <TerminalInstancesBody
          activeId={state.activeTerminalId}
          detectedLinks={terminalXterm.detectedLinks}
          instances={state.terminalInstances}
          onOpenPreview={openBrowserPreview}
          placeholder={tt('term.placeholder')}
          setHost={terminalXterm.setTerminalHost}
        />
      )}
    </div>
  );
}
