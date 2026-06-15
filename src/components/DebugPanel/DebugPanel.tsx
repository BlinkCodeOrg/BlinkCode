import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { BugPlay, FileJson2, Link, Play } from 'lucide-react';
import { useEditor } from '../../store/EditorContext';
import {
  attachDebugSession,
  createDebugConfiguration,
  fetchDebugConfigurations,
  fetchDebugStatus,
  sendDebugCommand,
  startDebugSession,
  type DebugBreakpoint,
  type DebugCommand,
  type DebugConfiguration,
  type DebugSessionState,
} from '../../utils/api';
import {
  getAllDebugBreakpoints,
  removeDebugBreakpoint,
  setDebugBreakpointCondition,
  setDebugBreakpointEnabled,
} from '../../features/debugger/debugBreakpoints';
import { debugIdleState } from '../../features/debugger/debugIdleState';
import { findDebugFileByPath } from '../../features/debugger/findDebugFileByPath';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { DebugBreakpoints } from './DebugBreakpoints';
import { DebugConsole } from './DebugConsole';
import { DebugSection } from './DebugSection';
import { DebugToolbar } from './DebugToolbar';
import { DebugVariables } from './DebugVariables';
import { DebugWatch } from './DebugWatch';
import { SidebarPanel } from '../ui/SidebarPanel';
import { useHorizontalResize } from '../../hooks/useHorizontalResize';
import { useT } from '../../hooks/useT';
import './DebugPanel.css';
export default function DebugPanel() {
  const { state, getActiveFile, openFile, addToast, updateSettings } = useEditor();
  const tt = useT();
  const [session, setSession] = useState<DebugSessionState>(debugIdleState);
  const [configurations, setConfigurations] = useState<DebugConfiguration[]>([]);
  const [selectedConfiguration, setSelectedConfiguration] = useState('');
  const [attachEndpoint, setAttachEndpoint] = useState('');
  const [selectedFrameId, setSelectedFrameId] = useState('');
  const [breakpoints, setBreakpoints] = useState<DebugBreakpoint[]>(() => getAllDebugBreakpoints());
  const panelWidth = state.settings.panelWidths.debug;
  const resizerRef = useHorizontalResize(panelWidth, width => updateSettings({ panelWidths: { ...state.settings.panelWidths, debug: width } }));
  const activeFile = getActiveFile();
  const activePath = activeFile?.serverPath || '';
  const selectedFrame = session.callFrames.find(frame => frame.id === selectedFrameId) || session.callFrames[0], selectedConfig = configurations.find(configuration => configuration.name === selectedConfiguration);
  const canDebugActiveFile = Boolean(activePath && /\.(c?js|mjs)$/i.test(activeFile?.name || ''));
  const canStart = Boolean(selectedConfig || canDebugActiveFile);
  const refresh = useCallback(() => {
    fetchDebugStatus().then(setSession).catch(() => {});
  }, []);

  const refreshConfigurations = useCallback(() => {
    fetchDebugConfigurations()
      .then(response => {
        setConfigurations(response.configurations);
        setSelectedConfiguration(current => (
          response.configurations.some(configuration => configuration.name === current)
            ? current
            : (response.configurations[0]?.name || '')
        ));
      })
      .catch(error => addToast(error instanceof Error ? error.message : tt('debug.loadConfigFailed'), 'error'));
  }, [addToast, tt]);

  useEffect(() => {
    refresh();
    refreshConfigurations();
  }, [refresh, refreshConfigurations]);

  useEffect(() => {
    const timer = window.setInterval(refresh, session.status === 'running' || session.status === 'starting' ? 300 : 800);
    return () => window.clearInterval(timer);
  }, [refresh, session.status]);

  useEffect(() => {
    const changed = () => setBreakpoints(getAllDebugBreakpoints());
    window.addEventListener('blinkcode:debugBreakpointsChanged', changed);
    return () => window.removeEventListener('blinkcode:debugBreakpointsChanged', changed);
  }, []);

  useEffect(() => {
    if (session.callFrames[0]) setSelectedFrameId(current => (
      session.callFrames.some(frame => frame.id === current) ? current : session.callFrames[0].id
    ));
  }, [session.callFrames]);

  const displayedBreakpoints = useMemo(() => {
    const runtime = new Map((session.breakpointDetails || []).map(item => [item.id, item]));
    return breakpoints.map(item => ({ ...item, ...(runtime.get(item.id) || {}) }));
  }, [breakpoints, session.breakpointDetails]);

  const start = async () => {
    if (!canStart) {
      addToast(tt('debug.openFileOrConfig'), 'info');
      return;
    }
    try {
      setSession(await startDebugSession(activePath, breakpoints, selectedConfig));
    } catch (error) {
      addToast(error instanceof Error ? error.message : tt('debug.startFailed'), 'error');
    }
  };

  const command = async (value: DebugCommand) => {
    try {
      setSession(await sendDebugCommand(value));
      window.setTimeout(refresh, 80);
    } catch (error) {
      addToast(error instanceof Error ? error.message : tt('debug.commandFailed'), 'error');
    }
  };

  const attach = async () => {
    try {
      const next = await attachDebugSession(attachEndpoint, breakpoints);
      setSession(next);
      if (next.status === 'failed') addToast(next.error || tt('debug.attachFailed'), 'error');
    } catch (error) {
      addToast(error instanceof Error ? error.message : tt('debug.attachFailed'), 'error');
    }
  };

  const createBlinkCodeConfiguration = async () => {
    try {
      const response = await createDebugConfiguration(activePath);
      setConfigurations(response.configurations);
      setSelectedConfiguration(response.configurations[0]?.name || '');
      addToast(tt('debug.createdConfig', { path: response.path }), 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : tt('debug.createConfigFailed'), 'error');
    }
  };

  const openLocation = (filePath: string, line: number, column = 1) => {
    const file = findDebugFileByPath(state.files, filePath);
    if (!file) {
      addToast(tt('debug.fileUnavailable', { path: filePath }), 'info');
      return;
    }
    openFile(file);
    window.setTimeout(() => {
      const editor = (window as any).__blinkcodeEditor;
      editor?.setPosition({ lineNumber: line, column });
      editor?.revealLineInCenter(line);
      editor?.focus();
    }, 100);
  };

  const configOptions = configurations.length
    ? configurations.map(configuration => ({ value: configuration.name, label: configuration.name }))
    : [{ value: '', label: canDebugActiveFile ? tt('debug.currentFile') : tt('debug.noConfigurations') }];

  return (
    <SidebarPanel
      className="debug-panel"
      data-testid="debug-panel"
      width={panelWidth}
      style={{ '--debug-width': `${panelWidth}px` } as CSSProperties}
    >
      <header className="debug-panel-head ui-sidebar-panel-header">
        <span><BugPlay size={15} /> {tt('debug.title')}</span>
        <button type="button" onClick={createBlinkCodeConfiguration} title={tt('debug.createConfig')}><FileJson2 size={14} /></button>
      </header>
      <div className="debug-config-row">
        <button
          type="button"
          className="debug-start-button"
          data-testid="debug-start"
          onClick={start}
          disabled={!canStart || ['starting', 'running', 'paused'].includes(session.status)}
          title={tt('debug.start')}
        >
          <Play size={14} />
        </button>
        <Select
          ariaLabel={tt('debug.configuration')}
          className="debug-config-select"
          options={configOptions}
          testId="debug-configuration"
          value={selectedConfiguration}
          onChange={value => setSelectedConfiguration(String(value))}
        />
      </div>
      <DebugToolbar status={session.status} connected={Boolean(session.connected)} onCommand={command} />
      <div className={`debug-status debug-status-${session.status}`}>
        {session.sessionName ? `${session.sessionName} - ` : ''}{session.status}
        {session.pauseReason ? `: ${session.pauseReason}` : ''}
      </div>
      {session.error && <div className="debug-error" role="alert">{session.error}</div>}
      <div className="debug-sections-scroll">
        <DebugSection sectionId="variables" title={tt('debug.variables')}>
          {selectedFrame
            ? selectedFrame.scopes.map(scope => <DebugVariables key={`${scope.type}:${scope.objectId}`} scope={scope} />)
            : <div className="debug-empty">{tt('debug.pauseHint')}</div>}
        </DebugSection>
        <DebugSection sectionId="watch" title={tt('debug.watch')}>
          <DebugWatch callFrameId={selectedFrame?.id} paused={session.status === 'paused'} />
        </DebugSection>

        <DebugSection sectionId="call-stack" title={tt('debug.callStack')}>
          {session.callFrames.map(frame => (
            <button
              key={frame.id}
              type="button"
              className={`debug-frame ${selectedFrame?.id === frame.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedFrameId(frame.id);
                openLocation(frame.path, frame.line, frame.column);
              }}
            >
              <strong>{frame.functionName}</strong>
              <span>{frame.path}:{frame.line}</span>
            </button>
          ))}
          {session.callFrames.length === 0 && <div className="debug-empty">{tt('debug.noCallStack')}</div>}
        </DebugSection>

        <DebugSection sectionId="breakpoints" title={tt('debug.breakpoints')}>
          <DebugBreakpoints
            breakpoints={displayedBreakpoints}
            onConditionChange={(id, condition) => setDebugBreakpointCondition(id, condition)}
            onOpen={openLocation}
            onRemove={id => removeDebugBreakpoint(id)}
            onToggle={(id, enabled) => setDebugBreakpointEnabled(id, enabled)}
          />
        </DebugSection>

        <DebugSection sectionId="attach" title={tt('debug.attach')} defaultOpen={false}>
          <div className="debug-attach">
            <Input
              aria-label={tt('debug.endpoint')}
              value={attachEndpoint}
              onChange={event => setAttachEndpoint(event.target.value)}
              placeholder={tt('debug.endpointPlaceholder')}
            />
            <button type="button" onClick={attach} disabled={!attachEndpoint.trim() || ['starting', 'running', 'paused'].includes(session.status)}>
              <Link size={13} /> {tt('debug.attach')}
            </button>
          </div>
          <div className="debug-help">{tt('debug.attachHelpBefore')} <code>--inspect</code> {tt('debug.attachHelpMiddle')} <code>--remote-debugging-port</code>.</div>
        </DebugSection>

        <DebugSection sectionId="console" title={tt('debug.console')}>
          <DebugConsole
            callFrameId={selectedFrame?.id}
            connected={Boolean(session.connected)}
            output={session.output}
            onEvaluated={refresh}
          />
        </DebugSection>
      </div>
      <div className="ui-sidebar-resizer" ref={resizerRef} />
    </SidebarPanel>
  );
}
