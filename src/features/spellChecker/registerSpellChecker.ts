import { findSpellingIssues, findSpellingSuggestions } from './findSpellingIssues';
import { t } from '../../utils/i18n';

const DOCUMENT_LANGUAGES = new Set(['markdown', 'plaintext']);
const CODE_LANGUAGES = new Set(['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'css', 'scss', 'python', 'shell']);
let registeredMonaco: any = null;
let registrations: Array<{ dispose?: () => void }> = [];
const refreshers = new Set<() => void>();
const getLanguage = () => (window as any).__blinkcodeSettings?.language || 'en';

export function refreshSpellMarkers() {
  refreshers.forEach(refresh => refresh());
}

export function registerSpellChecker(monaco: any) {
  if (registeredMonaco === monaco) return;
  registrations.forEach(registration => registration.dispose?.());
  registrations = [];
  refreshers.clear();
  registeredMonaco = monaco;
  const attach = (model: any) => {
    const language = model.getLanguageId();
    if (!DOCUMENT_LANGUAGES.has(language) && !CODE_LANGUAGES.has(language)) return;
    const refresh = () => {
      const enabled = Boolean(
        (window as any).__blinkcodeSettings?.spellChecker
        && (window as any).__blinkcodeExtensionFeatures?.has('spell-checker'),
      );
      const issues = enabled ? findSpellingIssues(model.getValue(), CODE_LANGUAGES.has(language)) : [];
      monaco.editor.setModelMarkers(model, 'blinkcode-spelling', issues.map(issue => ({
        severity: monaco.MarkerSeverity.Info,
        message: t('spell.possibleIssue', getLanguage(), { word: issue.word }),
        startLineNumber: issue.line,
        endLineNumber: issue.line,
        startColumn: issue.startColumn,
        endColumn: issue.endColumn,
      })));
    };
    refreshers.add(refresh);
    refresh();
    model.onDidChangeContent(refresh);
    model.onWillDispose?.(() => refreshers.delete(refresh));
  };
  monaco.editor.getModels().forEach(attach);
  registrations.push(monaco.editor.onDidCreateModel(attach));
  for (const language of [...DOCUMENT_LANGUAGES, ...CODE_LANGUAGES]) {
    registrations.push(monaco.languages.registerCodeActionProvider(language, {
      provideCodeActions(model: any, _range: any, context: any) {
        const marker = context.markers?.find((item: any) => item.owner === 'blinkcode-spelling');
        if (!marker) return { actions: [], dispose() {} };
        const word = model.getValueInRange(marker);
        const actions = findSpellingSuggestions(word).map(suggestion => ({
          title: t('spell.replaceWith', getLanguage(), { suggestion }),
          kind: 'quickfix',
          diagnostics: [marker],
          edit: { edits: [{ resource: model.uri, textEdit: { range: marker, text: suggestion }, versionId: model.getVersionId() }] },
          isPreferred: true,
        }));
        return { actions, dispose() {} };
      },
    }));
  }
}
