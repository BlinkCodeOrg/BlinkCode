import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { EditorProvider } from './store/EditorContext';
import TopHeader from './components/TopHeader/TopHeader';
import ActivityBar from './components/ActivityBar/ActivityBar';
import TabsHeader from './components/TabsHeader/TabsHeader';
import CodeEditor from './components/CodeEditor/CodeEditor';
import Toast from './components/Toast/Toast';
import Breadcrumb from './components/Breadcrumb/Breadcrumb';
import StatusBar from './components/StatusBar/StatusBar';
import ProjectTemplatesModal from './components/ProjectTemplates/ProjectTemplatesModal';
import { useT } from './hooks/useT';
import { useEditor } from './store/EditorContext';
import { ConfirmDialogHost } from './components/ui/ConfirmDialogHost';
import { ExtensionProvider } from './features/extensions/ExtensionContext';
import { AppUpdatesProvider } from './components/providers/AppUpdatesProvider';
import { ConditionalUpdateEffect } from './components/UpdateEffect';
import type { RecoverableDiagnostic } from './shared/diagnostics/reportRecoverableError';
import './App.css';

const AIPanel = lazy(() => import('./components/AIPanel/AIPanel'));
const BrowserPreview = lazy(
  () => import('./components/BrowserPreview/BrowserPreview'),
);
const CommandPalette = lazy(
  () => import('./components/CommandPalette/CommandPalette'),
);
const NpmScriptsPanel = lazy(
  () => import('./components/NpmScriptsPanel/NpmScriptsPanel'),
);
const DebugPanel = lazy(() => import('./components/DebugPanel/DebugPanel'));
const QuickOpen = lazy(() => import('./components/QuickOpen/QuickOpen'));
const SearchPanel = lazy(() => import('./components/SearchPanel/SearchPanel'));
// prettier-ignore
const SettingsPanel = lazy(() => import('./components/SettingsPanel/SettingsPanel'));
const Sidebar = lazy(() => import('./components/Sidebar/Sidebar'));
const SourceControl = lazy(
  () => import('./components/SourceControl/SourceControl'),
);
const DirtyCloseDialog = lazy(
  () => import('./components/DirtyCloseDialog/DirtyCloseDialog'),
);
const BottomPanel = lazy(() => import('./components/BottomPanel/BottomPanel'));

function LazyBoundary({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

function EditorLayout() {
  const {
    state,
    getActiveFile,
    setActiveTab,
    setSplitActiveTab,
    toggleZenMode,
    toggleSettings,
    addToast,
  } = useEditor();
  const tt = useT();
  const lastDiagnosticToast = useRef({ key: '', at: 0 });
  const isExtensionDetail = Boolean(getActiveFile()?.extensionDetail);
  const splitTab = state.openTabs.find(
    (tab) => tab.id === state.splitActiveTabId,
  );
  const splitFile = splitTab
    ? state.files.find((node) => node.id === splitTab.fileId)
    : null;
  const isSplit =
    !!state.splitActiveTabId &&
    !state.browserOpen &&
    !isExtensionDetail &&
    !splitFile?.extensionDetail;
  const densityScale =
    state.settings.uiDensity === 'compact'
      ? 0.88
      : state.settings.uiDensity === 'comfortable'
        ? 1.12
        : 1;
  const appStyle = {
    '--ui-density-scale': densityScale,
    '--explorer-row-height': `${state.settings.explorerRowHeight}px`,
    '--tab-height': `${Math.round(36 * densityScale)}px`,
    '--panel-header-height': `${Math.round(32 * densityScale)}px`,
    '--activity-item-height': `${Math.round(40 * densityScale)}px`,
    '--activity-bar-width': `${Math.round(50 * densityScale)}px`,
    zoom: state.settings.uiScale / 100,
    width: `${10000 / state.settings.uiScale}%`,
    height: `${10000 / state.settings.uiScale}%`,
  } as CSSProperties;
  useEffect(() => {
    const openSettings = () => {
      if (!state.showSettings) toggleSettings();
    };
    const showMessage = (event: Event) =>
      addToast(String((event as CustomEvent).detail || ''), 'info');
    const showDiagnostic = (event: Event) => {
      const detail = (event as CustomEvent<RecoverableDiagnostic>).detail;
      if (!detail?.area || !detail.message) return;
      const key = `${detail.area}:${detail.message}`;
      const now = Date.now();
      if (
        lastDiagnosticToast.current.key === key &&
        now - lastDiagnosticToast.current.at < 5000
      )
        return;
      lastDiagnosticToast.current = { key, at: now };
      addToast(
        tt('diagnostics.recoverable', {
          area: detail.area,
          message: detail.message,
        }),
        'error',
      );
    };
    window.addEventListener('blinkcode:openSettings', openSettings);
    window.addEventListener('blinkcode:extensionMessage', showMessage);
    window.addEventListener('blinkcode:diagnostic', showDiagnostic);
    return () => {
      window.removeEventListener('blinkcode:openSettings', openSettings);
      window.removeEventListener('blinkcode:extensionMessage', showMessage);
      window.removeEventListener('blinkcode:diagnostic', showDiagnostic);
    };
  }, [addToast, state.showSettings, toggleSettings, tt]);
  const acceptTabDrop = (
    event: React.DragEvent<HTMLDivElement>,
    group: 'primary' | 'secondary',
  ) => {
    const tabId = event.dataTransfer.getData('application/x-blinkcode-tab');
    const tab = state.openTabs.find((item) => item.id === tabId);
    const file = tab
      ? state.files.find((node) => node.id === tab.fileId)
      : null;
    if (!tab || file?.extensionDetail) return;
    event.preventDefault();
    if (group === 'secondary') setSplitActiveTab(tabId);
    else setActiveTab(tabId);
  };

  return (
    <div
      className={`app density-${state.settings.uiDensity}${state.settings.animations ? '' : ' reduce-motion'}${state.zenMode ? ' zen-mode' : ''}`}
      style={appStyle}
    >
      {!state.zenMode && <TopHeader />}
      <div className="main-area">
        {!state.zenMode && <ActivityBar />}
        <LazyBoundary>
          {!state.zenMode &&
            state.sidebarVisible &&
            !state.showSearchPanel &&
            !state.showSourceControl &&
            !state.showNpmScripts &&
            !state.showDebugPanel && <Sidebar />}
          {!state.zenMode && state.showSearchPanel && <SearchPanel />}
          {!state.zenMode && state.showSourceControl && <SourceControl />}
          {!state.zenMode && state.showNpmScripts && <NpmScriptsPanel />}
          {!state.zenMode && state.showDebugPanel && <DebugPanel />}
        </LazyBoundary>
        <div className="editor-area">
          {!state.zenMode && !state.browserOpen && (
            <>
              <TabsHeader />
              <Breadcrumb />
            </>
          )}
          <div className={`editor-content${isSplit ? ' editor-split' : ''}`}>
            {state.browserOpen ? (
              <LazyBoundary>
                <BrowserPreview />
              </LazyBoundary>
            ) : isSplit ? (
              <>
                <div
                  className="editor-pane editor-pane-primary"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => acceptTabDrop(event, 'primary')}
                >
                  <CodeEditor group="primary" />
                </div>
                <div className="editor-split-divider" />
                <div
                  className="editor-pane editor-pane-secondary"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => acceptTabDrop(event, 'secondary')}
                >
                  <CodeEditor group="secondary" />
                </div>
              </>
            ) : (
              <CodeEditor group="primary" />
            )}
          </div>
          <LazyBoundary>{!state.zenMode && <BottomPanel />}</LazyBoundary>
          {!state.zenMode && <StatusBar />}
        </div>
        <LazyBoundary>
          {!state.zenMode && state.showAIPanel && <AIPanel />}
        </LazyBoundary>
      </div>
      {state.zenMode && (
        <button className="zen-exit" type="button" onClick={toggleZenMode}>
          {tt('zen.exit')}
        </button>
      )}
      <Toast />
      <ConfirmDialogHost />
      <LazyBoundary>
        {state.showSettings && <SettingsPanel />}
        <CommandPalette />
        <QuickOpen />
        <DirtyCloseDialog />
      </LazyBoundary>
      <ProjectTemplatesModal />
      <ConditionalUpdateEffect />
    </div>
  );
}

export default function App() {
  return (
    <ExtensionProvider>
      <EditorProvider>
        <AppUpdatesProvider>
          <EditorLayout />
        </AppUpdatesProvider>
      </EditorProvider>
    </ExtensionProvider>
  );
}
