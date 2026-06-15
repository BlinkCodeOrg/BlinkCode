import { useCallback, useEffect, useState } from 'react';
import { Bot, ChevronDown, ChevronUp, Play, RefreshCw, Send, Settings2, Sparkles, X } from 'lucide-react';
import { useEditor } from '../../store/EditorContext';
import {
  executeAiTool,
  fetchAiProviderStatus,
  requestAiAgentPlan,
  requestAiToolApproval,
  requestAiChat,
  searchWorkspace,
  type AiMessage,
  type AiProviderStatus,
  type AiToolCall,
} from '../../utils/api';
import { buildEditorAiContext } from '../../features/ai/buildEditorAiContext';
import { loadAiConfig, loadSecureAiApiKey, saveAiConfig, type AiConfig } from '../../features/ai/aiConfig';
import { invalidateAiProviderAvailability } from '../../features/ai/isAiProviderAvailable';
import { AI_QUICK_ACTIONS, type AiQuickActionId } from '../../features/ai/aiQuickActions';
import { requestConfirmation } from '../../shared/ui/requestConfirmation';
import { Input } from '../ui/Input';
import { useT } from '../../hooks/useT';
import './AIPanel.css';

interface DisplayMessage extends AiMessage {
  id: string;
}

export default function AIPanel() {
  const { state, toggleAIPanel, getActiveFile, addToast, loadFromServer } = useEditor();
  const tt = useT();
  const [config, setConfig] = useState<AiConfig>(loadAiConfig);
  const [showConfig, setShowConfig] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [tools, setTools] = useState<AiToolCall[]>([]);
  const [toolResults, setToolResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<'chat' | 'agent' | null>(null);
  const [providerStatus, setProviderStatus] = useState<AiProviderStatus>({ connected: false });
  const [checkingProvider, setCheckingProvider] = useState(true);

  useEffect(() => {
    loadSecureAiApiKey().then(apiKey => {
      if (apiKey) setConfig(current => ({ ...current, apiKey }));
    }).catch(() => {});
  }, []);

  const checkProvider = useCallback(async (currentConfig: AiConfig) => {
    setCheckingProvider(true);
    try {
      const next = await fetchAiProviderStatus(currentConfig);
      setProviderStatus(next);
      if (!next.connected) setShowConfig(true);
    } catch (error) {
      setProviderStatus({ connected: false, error: error instanceof Error ? error.message : tt('ai.providerCheckFailed') });
    } finally {
      setCheckingProvider(false);
    }
  }, [tt]);

  useEffect(() => {
    const timer = window.setTimeout(() => checkProvider(config), 500);
    return () => window.clearTimeout(timer);
  }, [checkProvider, config]);

  const updateConfig = (patch: Partial<AiConfig>) => {
    const next = { ...config, ...patch };
    setConfig(next);
    saveAiConfig(next);
    invalidateAiProviderAvailability();
  };

  const buildContext = useCallback(async (text: string) => {
    const context = buildEditorAiContext(state.files, state.openTabs, getActiveFile());
    const query = [...text.matchAll(/[A-Za-z_$][\w$.-]{3,}/g)].map(match => match[0]).at(-1);
    if (query) {
      try {
        const found = await searchWorkspace({ query });
        context.searchResults = found.results.slice(0, 12).flatMap(file =>
          file.matches.slice(0, 3).map(match => `${file.path}:${match.line}: ${match.preview.trim()}`),
        );
      } catch {}
    }
    return context;
  }, [getActiveFile, state.files, state.openTabs]);

  const sendChat = useCallback(async (override?: string) => {
    const text = (override ?? prompt).trim();
    if (!text || loading) return;
    if (!providerStatus.connected) {
      setShowConfig(true);
      addToast(providerStatus.error || tt('ai.connectProvider'), 'info');
      return;
    }
    const userMessage: DisplayMessage = { id: crypto.randomUUID(), role: 'user', content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setPrompt('');
    setLoading('chat');
    try {
      const content = await requestAiChat(config, nextMessages.map(({ role, content }) => ({ role, content })), await buildContext(text));
      setMessages(current => [...current, { id: crypto.randomUUID(), role: 'assistant', content }]);
    } catch (error) {
      addToast(error instanceof Error ? error.message : tt('ai.chatFailed'), 'error');
    } finally {
      setLoading(null);
    }
  }, [addToast, buildContext, config, loading, messages, prompt, providerStatus, tt]);

  const runQuickAction = useCallback((actionId: AiQuickActionId) => {
    const action = AI_QUICK_ACTIONS.find(item => item.id === actionId);
    if (action) void sendChat(tt(action.promptKey));
  }, [sendChat, tt]);

  useEffect(() => {
    const handler = (event: Event) => {
      const action = (event as CustomEvent).detail?.action as AiQuickActionId;
      if (!AI_QUICK_ACTIONS.some(item => item.id === action)) return;
      if (!state.showAIPanel) toggleAIPanel();
      runQuickAction(action);
    };
    window.addEventListener('blinkcode:aiQuickAction', handler);
    return () => window.removeEventListener('blinkcode:aiQuickAction', handler);
  }, [runQuickAction, state.showAIPanel, toggleAIPanel]);

  const planAgent = async () => {
    const text = prompt.trim();
    if (!text || loading) return;
    if (!providerStatus.connected) {
      setShowConfig(true);
      addToast(providerStatus.error || tt('ai.connectProvider'), 'info');
      return;
    }
    setLoading('agent');
    setTools([]);
    setToolResults({});
    try {
      setTools(await requestAiAgentPlan(config, text, await buildContext(text)));
      setMessages(current => [...current, { id: crypto.randomUUID(), role: 'user', content: tt('ai.agentTask', { task: text }) }]);
      setPrompt('');
    } catch (error) {
      addToast(error instanceof Error ? error.message : tt('ai.planFailed'), 'error');
    } finally {
      setLoading(null);
    }
  };

  const runTool = async (tool: AiToolCall) => {
    const mutating = ['write_file', 'replace_in_file', 'run_command'].includes(tool.name);
    let approvalToken = '';
    if (mutating) {
      approvalToken = await requestAiToolApproval(tool);
      const confirmed = await requestConfirmation({
        cancelLabel: tt('common.cancel'),
        confirmLabel: tt('ai.confirmRun'),
        danger: tool.name === 'run_command',
        details: JSON.stringify(tool.arguments, null, 2),
        message: tt('ai.confirmToolMessage', { tool: tool.name }),
        title: tt('ai.confirmToolTitle'),
      });
      if (!confirmed) return;
    }
    setToolResults(current => ({ ...current, [tool.id]: tt('ai.running') }));
    try {
      const result = await executeAiTool(tool, approvalToken);
      setToolResults(current => ({ ...current, [tool.id]: JSON.stringify(result, null, 2) }));
      if (['write_file', 'replace_in_file'].includes(tool.name)) await loadFromServer();
    } catch (error) {
      setToolResults(current => ({ ...current, [tool.id]: error instanceof Error ? error.message : tt('ai.toolFailed') }));
    }
  };

  return (
    <aside className="ai-panel" data-testid="ai-panel">
      <header className="ai-head">
        <div className="ai-head-left"><Bot size={15} className="ai-icon" /><span className="ai-title">Blink AI</span></div>
        <div className="ai-head-actions">
          <button type="button" className="ai-close" title={tt('ai.settings')} onClick={() => setShowConfig(value => !value)}><Settings2 size={14} /></button>
          <button type="button" className="ai-close" title={tt('common.close')} onClick={toggleAIPanel}><X size={14} /></button>
        </div>
      </header>

      {showConfig && (
        <div className="ai-config">
          <label>{tt('ai.compatibleUrl')}<Input value={config.baseUrl} onChange={event => updateConfig({ baseUrl: event.target.value })} /></label>
          <label>{tt('common.model')}<Input value={config.model} onChange={event => updateConfig({ model: event.target.value })} /></label>
          <label>{tt('ai.apiKeySession')}<Input type="password" value={config.apiKey} onChange={event => updateConfig({ apiKey: event.target.value })} /></label>
          <div className={`ai-provider-status ${providerStatus.connected ? 'connected' : 'disconnected'}`} data-testid="ai-provider-status">
            <span>{checkingProvider
              ? tt('ai.checkingProvider')
              : providerStatus.connected
                ? tt('ai.connectedModels', { count: providerStatus.models?.length || 0 })
                : providerStatus.error || tt('ai.providerUnavailable')}</span>
            <button type="button" onClick={() => checkProvider(config)} disabled={checkingProvider}><RefreshCw size={12} /> {tt('common.check')}</button>
          </div>
        </div>
      )}

      <div className="ai-quick-actions">
        {AI_QUICK_ACTIONS.map(action => (
          <button key={action.id} type="button" disabled={!providerStatus.connected} onClick={() => runQuickAction(action.id)}>
            <Sparkles size={13} /> {tt(action.labelKey)}
          </button>
        ))}
      </div>

      <div className="ai-conversation">
        {messages.length === 0 && (
          <div className="ai-hint">
            {providerStatus.connected
              ? tt('ai.contextHint')
              : tt('ai.connectHint')}
          </div>
        )}
        {messages.map(message => (
          <article key={message.id} className={`ai-message ai-message-${message.role}`}>
            <strong>{message.role === 'user' ? tt('ai.you') : 'Blink AI'}</strong>
            <pre>{message.content}</pre>
          </article>
        ))}
        {tools.length > 0 && (
          <section className="ai-tool-plan">
            <h3>{tt('ai.agentToolPlan')}</h3>
            {tools.map(tool => {
              const mutating = ['write_file', 'replace_in_file', 'run_command'].includes(tool.name);
              return (
                <div className="ai-tool" key={tool.id}>
                  <div><strong>{tool.name}</strong><code>{JSON.stringify(tool.arguments)}</code></div>
                  {tool.name === 'replace_in_file' && (
                    <pre className="ai-tool-diff">{`- ${String(tool.arguments.search || '')}\n+ ${String(tool.arguments.replacement || '')}`}</pre>
                  )}
                  <button type="button" onClick={() => runTool(tool)}><Play size={12} /> {mutating ? tt('ai.confirmRun') : tt('common.run')}</button>
                  {toolResults[tool.id] && <pre>{toolResults[tool.id]}</pre>}
                </div>
              );
            })}
          </section>
        )}
      </div>

      <footer className="ai-composer">
        <textarea data-testid="ai-prompt" value={prompt} onChange={event => setPrompt(event.target.value)} placeholder={tt('ai.promptPlaceholder')} />
        <div>
          <button type="button" onClick={() => setShowConfig(value => !value)}>{showConfig ? <ChevronUp size={13} /> : <ChevronDown size={13} />} {tt('common.provider')}</button>
          <button type="button" data-testid="ai-agent-plan" onClick={planAgent} disabled={!prompt.trim() || Boolean(loading) || !providerStatus.connected}><Bot size={13} /> {tt('ai.agent')}</button>
          <button type="button" data-testid="ai-send" onClick={() => sendChat()} disabled={!prompt.trim() || Boolean(loading) || !providerStatus.connected}><Send size={13} /> {tt(loading === 'chat' ? 'ai.sending' : 'ai.send')}</button>
        </div>
      </footer>
    </aside>
  );
}
