import { useEffect, useState } from 'react';
import { useEditor } from '../../store/EditorContext';
import { AlertTriangle, CircleAlert, GitBranch, RotateCcw, Server, FolderOpen } from 'lucide-react';
import { restartAllLspSessions } from '../../lsp/session';
import { useT } from '../../hooks/useT';
import { request } from '../../features/apiClient/request';
import './StatusBar.css';

export default function StatusBar() {
  const { state, getActiveFile, toggleProblemsPanel, addToast } = useEditor();
  const tt = useT();
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const [branch, setBranch] = useState<string | null>(null);
  const [problemCounts, setProblemCounts] = useState({ errors: 0, warnings: 0 });
  const [lspStatus, setLspStatus] = useState<'connecting' | 'ready' | 'reconnecting' | 'offline'>('offline');

  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d?.line && d?.column) setCursor({ line: d.line, column: d.column });
    };
    window.addEventListener('blinkcode:cursorPosition', handler);
    return () => window.removeEventListener('blinkcode:cursorPosition', handler);
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const status = (event as CustomEvent).detail?.status;
      if (status) setLspStatus(status);
    };
    window.addEventListener('blinkcode:lspStatus', handler);
    return () => window.removeEventListener('blinkcode:lspStatus', handler);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d) setProblemCounts({ errors: d.errors || 0, warnings: d.warnings || 0 });
    };
    window.addEventListener('blinkcode:problemCounts', handler);
    return () => window.removeEventListener('blinkcode:problemCounts', handler);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchBranch = async () => {
      try {
        const data = await request('/api/git-branch');
        if (!cancelled) setBranch(data.branch || null);
      } catch {
        if (!cancelled) setBranch(null);
      }
    };
    fetchBranch();
    const refreshVisibleBranch = () => {
      if (document.visibilityState === 'visible') fetchBranch();
    };
    const id = setInterval(refreshVisibleBranch, 30_000);
    window.addEventListener('focus', refreshVisibleBranch);
    document.addEventListener('visibilitychange', refreshVisibleBranch);
    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener('focus', refreshVisibleBranch);
      document.removeEventListener('visibilitychange', refreshVisibleBranch);
    };
  }, [state.workspaceDir]);

  const activeFile = getActiveFile();
  const language = activeFile?.language || 'plaintext';
  const indent = state.settings.insertSpaces
    ? tt('status.spacesCount', { count: state.settings.tabSize })
    : tt('status.tabs');
  const workspace = state.workspaceDir.replace(/\\/g, '/').split('/').filter(Boolean).pop() || tt('status.noWorkspace');
  const restartLsp = async () => {
    setLspStatus('reconnecting');
    await restartAllLspSessions();
    addToast(tt('status.languageServersRestarted'), 'success');
  };

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        {branch && (
          <span className="status-item status-branch">
            <GitBranch size={12} />
            {branch}
          </span>
        )}
        <button className="status-item status-problems-btn" onClick={toggleProblemsPanel} title={tt('status.toggleProblems')}>
          <CircleAlert size={12} /> {problemCounts.errors}
          <AlertTriangle size={12} /> {problemCounts.warnings}
        </button>
        <span className="status-item" title={state.workspaceDir || workspace}>
          <FolderOpen size={12} /> {workspace}
        </span>
      </div>
      <div className="status-bar-right">
        <button className={`status-item status-lsp status-lsp-${lspStatus}`} onClick={restartLsp} title={tt('status.restartLanguageServers')}>
          <Server size={12} /> {tt('status.lsp', { status: tt(`status.lsp.${lspStatus}`) })}
          <RotateCcw size={11} className={lspStatus === 'connecting' || lspStatus === 'reconnecting' ? 'status-spin' : ''} />
        </button>
        <span className="status-item">{tt('status.format', { format: tt(state.settings.insertSpaces ? 'status.spaces' : 'status.tabs') })}</span>
        <span className="status-item">{tt('status.lineColumn', { line: cursor.line, column: cursor.column })}</span>
        <span className="status-item">{indent}</span>
        <span className="status-item">UTF-8</span>
        <span className="status-item status-lang">{language}</span>
      </div>
    </div>
  );
}
