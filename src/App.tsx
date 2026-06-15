import { lazy, Suspense, useEffect, type CSSProperties, type ReactNode } from 'react';
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
import './App.css';

const AIPanel = lazy(() => import('./components/AIPanel/AIPanel'));
const BrowserPreview = lazy(() => import('./components/BrowserPreview/BrowserPreview'));
const CommandPalette = lazy(() => import('./components/CommandPalette/CommandPalette'));
const NpmScriptsPanel = lazy(() => import('./components/NpmScriptsPanel/NpmScriptsPanel'));
const DebugPanel = lazy(() => import('./components/DebugPanel/DebugPanel'));
const QuickOpen = lazy(() => import('./components/QuickOpen/QuickOpen'));
const SearchPanel = lazy(() => import('./components/SearchPanel/SearchPanel'));
const SettingsPanel = lazy(() => import('./components/SettingsPanel/SettingsPanel'));
const Sidebar = lazy(() => import('./components/Sidebar/Sidebar'));
const SourceControl = lazy(() => import('./components/SourceControl/SourceControl'));
const ExtensionsPanel = lazy(() => import('./components/ExtensionsPanel/ExtensionsPanel'));
const DirtyCloseDialog = lazy(() => import('./components/DirtyCloseDialog/DirtyCloseDialog'));
const BottomPanel = lazy(() => import('./components/BottomPanel/BottomPanel'));

function LazyBoundary({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

function EditorLayout() {
  const { state, getActiveFile, setActiveTab, setSplitActiveTab, toggleZenMode, toggleSettings, addToast } = useEditor();
  const tt = useT();
  const isExtensionDetail = Boolean(getActiveFile()?.extensionDetail);
  const splitTab = state.openTabs.find(tab => tab.id === state.splitActiveTabId);
  const splitFile = splitTab ? state.files.find(node => node.id === splitTab.fileId) : null;
  const isSplit = !!state.splitActiveTabId && !state.browserOpen && !isExtensionDetail && !splitFile?.extensionDetail;
  const densityScale = state.settings.uiDensity === 'compact' ? 0.88 : state.settings.uiDensity === 'comfortable' ? 1.12 : 1;
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
    const showMessage = (event: Event) => addToast(String((event as CustomEvent).detail || ''), 'info');
    window.addEventListener('blinkcode:openSettings', openSettings);
    window.addEventListener('blinkcode:extensionMessage', showMessage);
    return () => {
      window.removeEventListener('blinkcode:openSettings', openSettings);
      window.removeEventListener('blinkcode:extensionMessage', showMessage);
    };
  }, [addToast, state.showSettings, toggleSettings]);
  const acceptTabDrop = (event: React.DragEvent<HTMLDivElement>, group: 'primary' | 'secondary') => {
    const tabId = event.dataTransfer.getData('application/x-blinkcode-tab');
    const tab = state.openTabs.find(item => item.id === tabId);
    const file = tab ? state.files.find(node => node.id === tab.fileId) : null;
    if (!tab || file?.extensionDetail) return;
    event.preventDefault();
    if (group === 'secondary') setSplitActiveTab(tabId);
    else setActiveTab(tabId);
  };

  return (
    <div className={`app density-${state.settings.uiDensity}${state.settings.animations ? '' : ' reduce-motion'}${state.zenMode ? ' zen-mode' : ''}`} style={appStyle}>
      {!state.zenMode && <TopHeader />}
      <div className="main-area">
        {!state.zenMode && <ActivityBar />}
        <LazyBoundary>
          {!state.zenMode && state.sidebarVisible && !state.showSearchPanel && !state.showSourceControl && !state.showExtensions && !state.showNpmScripts && !state.showDebugPanel && <Sidebar />}
          {!state.zenMode && state.showSearchPanel && <SearchPanel />}
          {!state.zenMode && state.showSourceControl && <SourceControl />}
          {!state.zenMode && state.showExtensions && <ExtensionsPanel />}
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
              <LazyBoundary><BrowserPreview /></LazyBoundary>
            ) : isSplit ? (
              <>
                <div className="editor-pane editor-pane-primary" onDragOver={event => event.preventDefault()} onDrop={event => acceptTabDrop(event, 'primary')}>
                  <CodeEditor group="primary" />
                </div>
                <div className="editor-split-divider" />
                <div className="editor-pane editor-pane-secondary" onDragOver={event => event.preventDefault()} onDrop={event => acceptTabDrop(event, 'secondary')}>
                  <CodeEditor group="secondary" />
                </div>
              </>
            ) : (
              <CodeEditor group="primary" />
            )}
          </div>
          <LazyBoundary>
            {!state.zenMode && <BottomPanel />}
          </LazyBoundary>
          {!state.zenMode && <StatusBar />}
        </div>
        <LazyBoundary>{!state.zenMode && state.showAIPanel && <AIPanel />}</LazyBoundary>
      </div>
      {state.zenMode && <button className="zen-exit" type="button" onClick={toggleZenMode}>{tt('zen.exit')}</button>}
      <Toast />
      <ConfirmDialogHost />
      <LazyBoundary>
        {state.showSettings && <SettingsPanel />}
        <CommandPalette />
        <QuickOpen />
        <DirtyCloseDialog />
      </LazyBoundary>
      <ProjectTemplatesModal />
    </div>
  );
}

export default function App() {
  return (
    <ExtensionProvider>
      <EditorProvider>
        <EditorLayout />
      </EditorProvider>
    </ExtensionProvider>
  );
}
