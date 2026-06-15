import { LspClient } from './client';
import { createLspInitializeParams } from './createLspInitializeParams';
import type { Monaco } from './monacoTypes';
import { pathToUri } from './pathToUri';
import { registerLspCodeActionProvider } from './registerLspCodeActionProvider';
import { registerLspCompletionProvider } from './registerLspCompletionProvider';
import { registerLspDefinitionProvider } from './registerLspDefinitionProvider';
import { registerLspDiagnostics } from './registerLspDiagnostics';
import { registerLspDocumentSymbolProvider } from './registerLspDocumentSymbolProvider';
import { registerLspFormattingProviders } from './registerLspFormattingProviders';
import { registerLspHoverProvider } from './registerLspHoverProvider';
import { registerLspReferenceProvider } from './registerLspReferenceProvider';
import { registerLspRenameProvider } from './registerLspRenameProvider';
import { registerLspSignatureHelpProvider } from './registerLspSignatureHelpProvider';

export interface LspSessionConfig {
  /** Monaco language id(s) to register for (e.g. 'typescript','javascript','typescriptreact'). */
  languages: string[];
  /** LSP URL, e.g. ws://localhost:3001/ws/lsp/typescript */
  url: string;
  /** Absolute workspace path on server (used as rootUri / rootPath). */
  workspacePath: string;
  /** Resolves a Monaco model to the file URI used with the LSP. */
  resolveUri: (model: any) => string;
}

export interface LspSession {
  client: LspClient;
  dispose: () => void;
  /** Notify the LSP that a file has been opened (once per unique URI). */
  openDocument: (uri: string, languageId: string, text: string, version: number) => void;
  updateDocument: (uri: string, text: string, version: number) => void;
  closeDocument: (uri: string) => void;
}

export function createLspSession(monaco: Monaco, cfg: LspSessionConfig): LspSession {
  const rootUri = pathToUri(cfg.workspacePath);
  const initializeParams = createLspInitializeParams(rootUri, cfg.workspacePath);

  const client = new LspClient(cfg.url, initializeParams);

  const openedDocs = new Map<string, { languageId: string; text: string; version: number }>();
  const disposables: Array<() => void> = [];

  disposables.push(registerLspDiagnostics(client, monaco, cfg.resolveUri));

  for (const lang of cfg.languages) {
    disposables.push(registerLspCompletionProvider(client, monaco, lang, cfg.resolveUri));

    disposables.push(registerLspHoverProvider(client, monaco, lang, cfg.resolveUri));
    disposables.push(registerLspDefinitionProvider(client, monaco, lang, cfg.resolveUri));
    disposables.push(registerLspSignatureHelpProvider(client, monaco, lang, cfg.resolveUri));
    disposables.push(registerLspRenameProvider(client, monaco, lang, cfg.resolveUri));
    disposables.push(registerLspReferenceProvider(client, monaco, lang, cfg.resolveUri));
    disposables.push(registerLspDocumentSymbolProvider(client, monaco, lang, cfg.resolveUri));
    disposables.push(...registerLspFormattingProviders(client, monaco, lang, cfg.resolveUri));
    disposables.push(registerLspCodeActionProvider(client, monaco, lang, cfg.resolveUri));
  }

  let readyCount = 0;
  client.connect().catch(() => {});
  disposables.push(client.onReady(() => {
    readyCount += 1;
    if (readyCount === 1) return;
    for (const [uri, document] of openedDocs) {
      client.notify('textDocument/didOpen', {
        textDocument: { uri, ...document },
      });
    }
  }));

  function openDocument(uri: string, languageId: string, text: string, version: number) {
    if (openedDocs.has(uri)) return;
    openedDocs.set(uri, { languageId, text, version });
    const send = () => client.notify('textDocument/didOpen', {
      textDocument: { uri, languageId, version, text },
    });
    client.whenReady(send);
  }

  function updateDocument(uri: string, text: string, version: number) {
    if (!openedDocs.has(uri)) return;
    const current = openedDocs.get(uri)!;
    openedDocs.set(uri, { ...current, text, version });
    client.whenReady(() => client.notify('textDocument/didChange', {
      textDocument: { uri, version },
      contentChanges: [{ text }],
    }));
  }

  function closeDocument(uri: string) {
    if (!openedDocs.has(uri)) return;
    openedDocs.delete(uri);
    client.whenReady(() => client.notify('textDocument/didClose', {
      textDocument: { uri },
    }));
  }

  const dispose = () => {
    for (const d of disposables) { try { d(); } catch {} }
    disposables.length = 0;
    client.shutdown().catch(() => {});
  };

  return { client, dispose, openDocument, updateDocument, closeDocument };
}
