import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Clock3, Send } from 'lucide-react';
import { fetchRestClientHistory, sendRestClientRequest, type RestClientHistoryEntry, type RestClientResponse } from '../../utils/api';
import { listHttpRequests } from '../../features/restClient/listHttpRequests';
import { Select } from '../ui/Select';
import './RestClient.css';
import { useT } from '../../hooks/useT';

export default function RestClientBar({ content, onError }: { content: string; onError: (message: string) => void }) {
  const tt = useT();
  const requests = useMemo(() => listHttpRequests(content), [content]);
  const [selected, setSelected] = useState(0);
  const [response, setResponse] = useState<RestClientResponse | null>(null);
  const [history, setHistory] = useState<RestClientHistoryEntry[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRestClientHistory().then(setHistory).catch(() => {});
  }, []);

  const send = async () => {
    setLoading(true);
    try {
      const result = await sendRestClientRequest(content, selected);
      setResponse(result.response);
      setExpanded(true);
      setHistory(await fetchRestClientHistory());
    } catch (error) {
      onError(error instanceof Error ? error.message : tt('rest.requestFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (requests.length === 0) {
    return <div className="rest-client-empty">{tt('rest.addRequest')} <code>GET https://example.com</code></div>;
  }

  return (
    <section className="rest-client">
      <div className="rest-client-toolbar">
        <Select
          value={selected}
          options={requests.map((item, index) => ({ value: index, label: `${item.method} ${item.url}` }))}
          onChange={value => setSelected(Number(value))}
        />
        <button type="button" data-testid="rest-client-send" onClick={send} disabled={loading}>
          <Send size={13} /> {tt(loading ? 'rest.sending' : 'rest.send')}
        </button>
        <button type="button" title={tt('rest.toggleResponse')} onClick={() => setExpanded(value => !value)} disabled={!response}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      {expanded && response && (
        <div className="rest-client-response" data-testid="rest-client-response">
          <div className="rest-client-response-meta">
            <strong>{response.status} {response.statusText}</strong>
            <span>{response.durationMs} ms</span>
            <span>{response.size} {tt('common.bytes')}{response.truncated ? ` (${tt('rest.truncated')})` : ''}</span>
          </div>
          <pre>{response.body}</pre>
        </div>
      )}
      {expanded && history.length > 0 && (
        <div className="rest-client-history">
          <Clock3 size={12} />
          {history.slice(0, 5).map(item => (
            <span key={item.id}>{item.method} {item.url} · {item.status}</span>
          ))}
        </div>
      )}
    </section>
  );
}
