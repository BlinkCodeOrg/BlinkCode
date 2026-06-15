import { buildLspUrl } from './buildLspUrl';
import { createLspSession } from './monacoAdapter';
import type { LspSession } from './monacoAdapter';
import { disableMonacoBuiltin } from './disableMonacoBuiltin';
import { getLspLanguageForModel } from './getLspLanguageForModel';
import { modelToFileUri } from './modelToFileUri';
import { MONACO_LANG_TO_SERVER_KEY } from './monacoLangToServerKey';
import { SERVER_KEY_TO_LANGS } from './serverKeyToLangs';
import type { CachedSession, Monaco, MonacoModel, ServerKey } from './sessionTypes';
import { workspaceBase } from './workspaceBase';

const cache = new Map<string, CachedSession>();
const wiredModels = new WeakSet<object>();

function getSession(monaco: Monaco, workspacePath: string, serverKey: ServerKey): LspSession {
  const key = `${workspacePath}::${serverKey}`;
  const hit = cache.get(key);
  if (hit) return hit.session;

  disableMonacoBuiltin(monaco, serverKey);
  const session = createLspSession(monaco, {
    url: buildLspUrl(serverKey),
    workspacePath: workspacePath || workspaceBase(),
    languages: SERVER_KEY_TO_LANGS[serverKey],
    resolveUri: (model: MonacoModel) => modelToFileUri(model, workspacePath),
  });
  cache.set(key, { session, serverKey, workspacePath });
  return session;
}

export function attachLspToEditor(monaco: Monaco, editor: any, workspacePath: string) {
  const hook = (model: MonacoModel) => {
    if (!model || wiredModels.has(model)) return;
    const lang: string = model.getLanguageId?.() || '';
    const serverKey = MONACO_LANG_TO_SERVER_KEY[lang];
    if (!serverKey) return;
    if (!workspacePath) return;

    const lspLang = getLspLanguageForModel(model, lang);
    const session = getSession(monaco, workspacePath, serverKey);
    const uri = modelToFileUri(model, workspacePath);
    wiredModels.add(model);
    let version = 1;

    session.openDocument(uri, lspLang, model.getValue(), version);

    const sub = model.onDidChangeContent(() => {
      version += 1;
      session.updateDocument(uri, model.getValue(), version);
    });

    const disposeSub = model.onWillDispose(() => {
      try { sub.dispose(); } catch {}
      try { disposeSub.dispose(); } catch {}
      session.closeDocument(uri);
    });
  };

  const model = editor.getModel?.();
  if (model) hook(model);

  editor.onDidChangeModel?.((event: any) => {
    if (!event?.newModelUrl) return;
    const next = monaco.editor.getModel(event.newModelUrl);
    if (next) hook(next);
  });
}

export function shutdownAllLspSessions() {
  for (const { session } of cache.values()) {
    try { session.dispose(); } catch {}
  }
  cache.clear();
}

export async function restartAllLspSessions() {
  await Promise.allSettled(
    [...cache.values()].map(({ session }) => session.client.restart()),
  );
}
