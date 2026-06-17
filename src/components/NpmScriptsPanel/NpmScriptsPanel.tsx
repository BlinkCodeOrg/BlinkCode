import { Boxes, LayoutTemplate, MonitorPlay, PackageSearch, RefreshCw, TerminalSquare } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { loader as monacoLoader } from '@monaco-editor/react';
import type { FileNode } from '../../types';
import { buildProblemGroups } from '../../features/problems/buildProblemGroups';
import type { DiagnosticItem, ProblemCounts } from '../../features/problems/problemTypes';
import { createNpmRunCommand } from '../../features/npmScripts/createNpmRunCommand';
import { findNodeByPath } from '../../features/workspaceTree/findNodeByPath';
import { getMonacoLanguage } from '../../utils/supportedWebFiles';
import { createFileOnServer, fetchGitFileDiff, fetchGitInlineDiff, fetchGitStatus, fetchNpmScripts, fetchRestClientHistory, fetchWebWorkflow, saveFile, type GitFileEntry, type GitStatusResponse, type NpmScriptPackage, type RestClientHistoryEntry, type WebWorkflowAnalysis } from '../../utils/api';
import { useT } from '../../hooks/useT';
import { useEditor } from '../../store/EditorContext';
import { joinWorkspacePath } from '../../shared/path/joinWorkspacePath';
import { SidebarPanel } from '../ui/SidebarPanel';
import { DependencyManager } from './DependencyManager';
import { OverviewSection, TemplatesSection } from './WebAppCenterSections';
import { PreviewSection } from './WebAppCenterPreviewSection';
import { RestActions } from './WebAppCenterRestActions';
import { ScriptsTab } from './WebAppCenterScriptsTab';
import { useWebAppFirstRunChecklist } from './useWebAppFirstRunChecklist';
import './NpmScriptsPanel.css';
import { useHorizontalResize } from '../../hooks/useHorizontalResize';

type CenterTab = 'overview' | 'scripts' | 'preview' | 'templates' | 'dependencies';

const LOCAL_URL_PATTERN = /https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/[^\s'"<>]*)?/gi;
const LAST_PREVIEW_URL_KEY = 'blinkcode-web-app-center-preview-url';

function workspaceKey(workspaceDir: string) {
  return workspaceDir || '__empty_workspace__';
}

function readStoredPreviewUrl(workspaceDir: string) {
  try {
    const store = JSON.parse(localStorage.getItem(LAST_PREVIEW_URL_KEY) || '{}');
    return typeof store[workspaceKey(workspaceDir)] === 'string' ? store[workspaceKey(workspaceDir)] : null;
  } catch {
    return null;
  }
}

function writeStoredPreviewUrl(workspaceDir: string, url: string) {
  try {
    const store = JSON.parse(localStorage.getItem(LAST_PREVIEW_URL_KEY) || '{}');
    store[workspaceKey(workspaceDir)] = url;
    localStorage.setItem(LAST_PREVIEW_URL_KEY, JSON.stringify(store));
  } catch {}
}

export default function NpmScriptsPanel() {
  const { state, addTerminalInstance, addToast, loadFromServer, openBrowserPreview, openDiffPreview, openFile, setActiveTerminal, toggleProblemsPanel, toggleSourceControl, toggleTerminal, updateSettings } = useEditor();
  const tt = useT();
  const [activeTab, setActiveTab] = useState<CenterTab>('overview');
  const [packages, setPackages] = useState<NpmScriptPackage[]>([]);
  const [workflow, setWorkflow] = useState<WebWorkflowAnalysis | null>(null);
  const [gitStatus, setGitStatus] = useState<GitStatusResponse | null>(null);
  const [restHistory, setRestHistory] = useState<RestClientHistoryEntry[]>([]);
  const [problems, setProblems] = useState<{ counts: ProblemCounts; items: DiagnosticItem[] }>({ counts: { errors: 0, warnings: 0, infos: 0 }, items: [] });
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [terminalLocalUrls, setTerminalLocalUrls] = useState<string[]>([]);
  const [lastPreviewUrl, setLastPreviewUrl] = useState<string | null>(null);
  const [suggestedUrl, setSuggestedUrl] = useState<string | null>(null);
  const monacoRef = useRef<any>(null);
  const diagnosticsRef = useRef<Map<string, any[]>>(new Map());
  const panelWidth = state.settings.panelWidths.npmScripts;
  const resizerRef = useHorizontalResize(panelWidth, width => updateSettings({ panelWidths: { ...state.settings.panelWidths, npmScripts: width } }));

  const refreshProblems = useCallback(() => {
    const allMarkers: any[] = monacoRef.current?.editor?.getModelMarkers?.({}) || [];
    for (const [uri, diagnostics] of diagnosticsRef.current) {
      for (const diagnostic of diagnostics) allMarkers.push({ ...diagnostic, resource: { toString: () => uri } });
    }
    const { groups, counts } = buildProblemGroups(allMarkers, state.workspaceDir);
    setProblems({ counts, items: groups.flatMap(group => group.items).slice(0, 5) });
  }, [state.workspaceDir]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [nextPackages, nextWorkflow, nextGit, nextRest] = await Promise.all([
        fetchNpmScripts(),
        fetchWebWorkflow(),
        fetchGitStatus().catch(() => null),
        fetchRestClientHistory().catch(() => []),
      ]);
      setPackages(nextPackages);
      setWorkflow(nextWorkflow);
      setGitStatus(nextGit);
      setRestHistory(nextRest);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : tt('npmScripts.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [tt]);

  useEffect(() => { refresh(); }, [refresh, state.workspaceDir]);

  useEffect(() => {
    let disposed = false;
    let disposable: any = null;
    monacoLoader.init().then(monaco => {
      if (disposed) return;
      monacoRef.current = monaco;
      refreshProblems();
      disposable = monaco.editor.onDidChangeMarkers(refreshProblems);
    });
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail?.uri) diagnosticsRef.current.set(detail.uri, detail.diagnostics || []);
      refreshProblems();
    };
    window.addEventListener('blinkcode:lspDiagnostics', handler);
    return () => {
      disposed = true;
      disposable?.dispose?.();
      window.removeEventListener('blinkcode:lspDiagnostics', handler);
    };
  }, [refreshProblems]);

  useEffect(() => {
    const links = [
      ...terminalLocalUrls,
      ...state.terminalInstances.flatMap(terminal => `${terminal.title || ''} ${terminal.name || ''}`.match(LOCAL_URL_PATTERN) || []),
    ];
    setSuggestedUrl(state.browserUrl || links[0] || lastPreviewUrl || null);
  }, [lastPreviewUrl, state.browserUrl, state.terminalInstances, terminalLocalUrls]);

  useEffect(() => {
    setLastPreviewUrl(readStoredPreviewUrl(state.workspaceDir));
  }, [state.workspaceDir]);

  useEffect(() => {
    const nextUrl = state.browserUrl || terminalLocalUrls[0] || null;
    if (!nextUrl) return;
    setLastPreviewUrl(nextUrl);
    writeStoredPreviewUrl(state.workspaceDir, nextUrl);
  }, [state.browserUrl, state.workspaceDir, terminalLocalUrls]);

  useEffect(() => {
    setTerminalLocalUrls((window as any).__blinkcodeTerminalLocalUrls || []);
    const handleTerminalUrls = (event: Event) => {
      const urls = (event as CustomEvent<{ urls?: string[] }>).detail?.urls || [];
      setTerminalLocalUrls(urls);
    };
    window.addEventListener('blinkcode:terminalLocalUrls', handleTerminalUrls);
    return () => window.removeEventListener('blinkcode:terminalLocalUrls', handleTerminalUrls);
  }, []);

  const totalGitChanges = (gitStatus?.staged.length || 0) + (gitStatus?.unstaged.length || 0) + (gitStatus?.untracked.length || 0) + (gitStatus?.conflicts.length || 0);
  const guidedMode = state.settings.webWorkflowMode === 'guided';
  const firstRun = useWebAppFirstRunChecklist({
    browserOpen: state.browserOpen,
    loading,
    suggestedUrl,
    workflow,
    workspaceDir: state.workspaceDir,
  });
  const filteredPackages = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return packages;
    return packages
      .map(npmPackage => ({ ...npmPackage, scripts: npmPackage.scripts.filter(script => script.name.toLowerCase().includes(normalized) || script.command.toLowerCase().includes(normalized) || npmPackage.name.toLowerCase().includes(normalized)) }))
      .filter(npmPackage => npmPackage.scripts.length > 0);
  }, [packages, query]);

  const focusTerminal = (terminalId: string) => {
    setActiveTerminal(terminalId);
    if (!state.terminalOpen) toggleTerminal();
  };

  const runScript = (npmPackage: NpmScriptPackage, scriptName: string) => {
    const cwd = npmPackage.directory === '.' ? state.workspaceDir : joinWorkspacePath(state.workspaceDir, npmPackage.directory);
    addTerminalInstance({ id: uuid(), name: `${npmPackage.name}: ${scriptName}`, cwd, scriptKey: `${npmPackage.directory}:${scriptName}`, startupCommand: createNpmRunCommand(npmPackage.packageManager, scriptName), status: 'starting' });
    addToast(`${tt('npmScripts.started')}: ${scriptName}`, 'info');
  };

  const stopScript = (terminalId: string) => window.dispatchEvent(new CustomEvent('blinkcode:stopTerminal', { detail: { terminalId } }));
  const openDevServer = (url: string | null = suggestedUrl) => {
    if (!url) return addToast(tt('webCenter.noLocalUrl'), 'info');
    openBrowserPreview(url);
  };

  const createHttpFile = async () => {
    const path = workflow?.restFiles[0] ? 'requests.generated.http' : 'requests.http';
    const content = 'GET http://localhost:3000/health\n\n###\nPOST http://localhost:3000/items\nContent-Type: application/json\n\n{ "name": "BlinkCode" }\n';
    await createWorkspaceFile(path, content, 'webCenter.httpCreateFailed');
  };

  const createEnvFile = async () => {
    const path = workflow?.envFiles.includes('.env.local') ? '.env.example' : '.env.local';
    await createWorkspaceFile(path, 'VITE_API_URL=http://localhost:3000\n', 'webCenter.envCreateFailed');
  };

  const createWorkspaceFile = async (path: string, content: string, fallbackKey: string) => {
    try {
      await createFileOnServer(path, 'file');
      await saveFile(path, content);
      await loadFromServer();
      addToast(`${tt('webCenter.created')} ${path}`, 'success');
    } catch (reason) {
      addToast(reason instanceof Error ? reason.message : tt(fallbackKey), 'error');
    }
  };

  const openRestClient = async () => {
    const existing = workflow?.restFiles[0];
    if (existing) {
      const node = findNodeByPath(state.files, existing);
      if (node) openFile(node);
      return;
    }
    await createHttpFile();
  };

  const goToProblem = (item: DiagnosticItem) => {
    const node = findNodeByPath(state.files, item.relPath);
    if (node) openFile(node);
    setTimeout(() => {
      const editor = (window as any).__blinkcodeEditor;
      editor?.focus?.();
      editor?.setPosition?.({ lineNumber: item.startLineNumber, column: item.startColumn });
      editor?.revealLineInCenter?.(item.startLineNumber);
    }, 150);
  };

  const openGitDiff = async (item: GitFileEntry, staged: boolean) => {
    try {
      const diff = await fetchGitFileDiff(item.path, staged, item.status);
      const inline = await fetchGitInlineDiff(item.path, staged, item.status);
      const name = item.path.split('/').pop() || item.path;
      const node: FileNode = { id: `web-center-diff:${staged ? 'staged' : 'unstaged'}:${item.path}`, name: `${name} (diff)`, type: 'file', serverPath: `__git_diff__/${staged ? 'staged' : 'unstaged'}/${item.path}`, language: getMonacoLanguage(name), content: diff.modified, dirty: false, diffOriginalContent: diff.original, diffModifiedContent: diff.modified, diffHunks: inline.hunks };
      openDiffPreview(node);
    } catch (reason) {
      addToast(reason instanceof Error ? reason.message : tt('sc.diffFailed'), 'error');
    }
  };

  return (
    <SidebarPanel className="npm-scripts-panel web-app-center" data-testid="npm-scripts-panel" width={panelWidth}>
      <div className="npm-scripts-panel-inner">
        <header className="npm-scripts-header ui-sidebar-panel-header">
          <div><h2>{tt('npmScripts.title')}</h2></div>
          <button type="button" className="npm-scripts-refresh" data-testid="npm-scripts-refresh" onClick={refresh} title={tt('npmScripts.refresh')}><RefreshCw size={15} className={loading ? 'npm-scripts-spin' : ''} /></button>
        </header>
        <div className="npm-panel-tabs web-center-tabs">
          <button type="button" className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}><Boxes size={14} /> {tt('webCenter.overview')}</button>
          <button type="button" className={activeTab === 'scripts' ? 'active' : ''} onClick={() => setActiveTab('scripts')}><TerminalSquare size={14} /> {tt('npmScripts.scriptsTab')}</button>
          <button type="button" className={activeTab === 'preview' ? 'active' : ''} onClick={() => setActiveTab('preview')}><MonitorPlay size={14} /> {tt('webCenter.preview')}</button>
          <button type="button" className={activeTab === 'templates' ? 'active' : ''} onClick={() => setActiveTab('templates')}><LayoutTemplate size={14} /> {tt('common.create')}</button>
          <button type="button" data-testid="dependencies-tab" className={activeTab === 'dependencies' ? 'active' : ''} onClick={() => setActiveTab('dependencies')}><PackageSearch size={14} /> {tt('webCenter.deps')}</button>
        </div>
        {activeTab === 'overview' && <OverviewSection tt={tt} workflow={workflow} packages={packages} problems={problems} totalGitChanges={totalGitChanges} gitStatus={gitStatus} restHistory={restHistory} previewBehavior={state.settings.webWorkflowPreviewBehavior} compact={!guidedMode} guided={guidedMode && !firstRun.completed} checklist={firstRun.checklist} terminalInstances={state.terminalInstances} suggestedUrl={suggestedUrl} onOpenPreview={() => openDevServer()} onRunScript={runScript} onStopScript={stopScript} onOpenProblems={toggleProblemsPanel} onOpenSourceControl={toggleSourceControl} onOpenProblem={goToProblem} onOpenDiff={openGitDiff} onOpenRest={openRestClient} />}
        {activeTab === 'scripts' && <ScriptsTab tt={tt} query={query} loading={loading} error={error} packages={filteredPackages} terminals={state.terminalInstances} collapsed={collapsed} onQuery={setQuery} onRetry={refresh} onFocus={focusTerminal} onRun={runScript} onStop={stopScript} onToggle={directory => setCollapsed(current => {
          const next = new Set(current);
          if (next.has(directory)) next.delete(directory);
          else next.add(directory);
          return next;
        })} />}
        {activeTab === 'preview' && <PreviewSection tt={tt} workflow={workflow} packages={packages} suggestedUrl={suggestedUrl} browserUrl={state.browserUrl} browserOpen={state.browserOpen} browserLoading={state.browserLoading} browserError={state.browserError} onOpenPreview={() => openDevServer()} onRefresh={refresh} onRunScript={runScript} />}
        {activeTab === 'templates' && <TemplatesSection tt={tt} onOpenTemplates={templateId => window.dispatchEvent(new CustomEvent('blinkcode:openProjectTemplates', { detail: { templateId } }))} />}
        {activeTab === 'dependencies' && <DependencyManager />}
        {activeTab === 'overview' && <RestActions tt={tt} workflow={workflow} onCreateHttp={createHttpFile} onOpenRest={openRestClient} onCreateEnv={createEnvFile} />}
      </div>
      <div className="ui-sidebar-resizer" ref={resizerRef} />
    </SidebarPanel>
  );

}
