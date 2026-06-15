import { useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import type { EditorSettings } from '../../types';
import { buildUserSnippet } from '../../features/snippets/buildUserSnippet';
import { createEmptySnippetDraft } from '../../features/snippets/createEmptySnippetDraft';
import { createSnippetDraft } from '../../features/snippets/createSnippetDraft';
import type { SnippetDraftError } from '../../features/snippets/snippetDraftTypes';
import { validateSnippetDraft } from '../../features/snippets/validateSnippetDraft';
import { useT } from '../../hooks/useT';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export default function SettingsSnippetsTab({ settings, updateSettings }: {
  settings: EditorSettings;
  updateSettings: (settings: Partial<EditorSettings>) => void;
}) {
  const tt = useT();
  const [draft, setDraft] = useState(createEmptySnippetDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<SnippetDraftError | null>(null);

  const resetForm = () => {
    setDraft(createEmptySnippetDraft());
    setEditingId(null);
    setError(null);
  };

  const save = () => {
    const nextError = validateSnippetDraft(draft, settings.snippets, editingId);
    if (nextError) {
      setError(nextError);
      return;
    }
    const snippet = buildUserSnippet(editingId || uuid(), draft);
    updateSettings({
      snippets: editingId
        ? settings.snippets.map(item => item.id === editingId ? snippet : item)
        : [...settings.snippets, snippet],
    });
    resetForm();
  };

  const edit = (id: string) => {
    const snippet = settings.snippets.find(item => item.id === id);
    if (!snippet) return;
    setEditingId(id);
    setDraft(createSnippetDraft(snippet));
    setError(null);
  };

  return (
    <div className="settings-section">
      <div className="settings-section-title">{tt('settings.snippets')}</div>
      <div className="settings-section-desc">{tt('settings.snippets.desc')}</div>
      <div className="settings-snippet-form" data-testid="snippet-form">
        <Input aria-label={tt('settings.snippetName')} placeholder={tt('settings.snippetNamePlaceholder')} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} />
        <Input aria-label={tt('settings.snippetPrefix')} placeholder={tt('settings.snippetPrefixPlaceholder')} value={draft.prefix} onChange={event => setDraft({ ...draft, prefix: event.target.value })} />
        <Input aria-label={tt('settings.snippetLanguages')} placeholder="javascript,typescript" value={draft.languages} onChange={event => setDraft({ ...draft, languages: event.target.value })} />
        <Input aria-label={tt('settings.snippetDescription')} placeholder={tt('settings.snippetDescriptionPlaceholder')} value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} />
        <textarea aria-label={tt('settings.snippetBody')} placeholder={'console.log(${1:value});'} value={draft.body} onChange={event => setDraft({ ...draft, body: event.target.value })} />
        {error && <div className="settings-snippet-error" role="alert">{tt(`settings.snippetError.${error}`)}</div>}
        <div className="settings-snippet-form-actions">
          <Button variant="primary" onClick={save} data-testid="snippet-save">
            {editingId ? <Check size={12} /> : <Plus size={12} />}
            {tt(editingId ? 'settings.saveSnippet' : 'settings.addSnippet')}
          </Button>
          {editingId && <Button variant="ghost" onClick={resetForm}><X size={12} /> {tt('common.cancel')}</Button>}
        </div>
      </div>
      {settings.snippets.map(snippet => (
        <div className="settings-snippet-row" data-testid="snippet-row" key={snippet.id}>
          <div>
            <strong>{snippet.name}</strong>
            <span>{snippet.prefix} · {snippet.languages.join(', ')}</span>
            {snippet.description && <small>{snippet.description}</small>}
          </div>
          <div className="settings-snippet-actions">
            <Button variant="ghost" aria-label={tt('settings.editSnippet')} onClick={() => edit(snippet.id)}><Pencil size={12} /></Button>
            <Button variant="ghost" aria-label={tt('settings.deleteSnippet')} onClick={() => {
              updateSettings({ snippets: settings.snippets.filter(item => item.id !== snippet.id) });
              if (editingId === snippet.id) resetForm();
            }}><Trash2 size={12} /></Button>
          </div>
        </div>
      ))}
    </div>
  );
}
