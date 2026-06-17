export function createLspInitializeParams(rootUri: string, workspacePath: string) {
  return {
    processId: null,
    clientInfo: { name: 'BlinkCode', version: '1.2.0' },
    rootUri,
    rootPath: workspacePath,
    workspaceFolders: [{ uri: rootUri, name: 'workspace' }],
    capabilities: {
      textDocument: {
        synchronization: { didSave: true, willSave: false, willSaveWaitUntil: false, dynamicRegistration: false },
        completion: {
          completionItem: {
            snippetSupport: true,
            insertReplaceSupport: true,
            resolveSupport: { properties: ['documentation', 'detail'] },
          },
          contextSupport: true,
        },
        hover: { contentFormat: ['markdown', 'plaintext'] },
        signatureHelp: { signatureInformation: { documentationFormat: ['markdown', 'plaintext'], parameterInformation: { labelOffsetSupport: true } } },
        definition: { linkSupport: true },
        references: {},
        rename: { prepareSupport: true },
        formatting: {},
        rangeFormatting: {},
        documentSymbol: { hierarchicalDocumentSymbolSupport: true },
        codeAction: {
          codeActionLiteralSupport: {
            codeActionKind: {
              valueSet: ['', 'quickfix', 'refactor', 'refactor.extract', 'refactor.inline', 'refactor.rewrite', 'source', 'source.organizeImports', 'source.fixAll'],
            },
          },
          resolveSupport: { properties: ['edit'] },
          dataSupport: true,
        },
        publishDiagnostics: { relatedInformation: true },
      },
      workspace: {
        workspaceFolders: true,
        configuration: true,
      },
    },
    initializationOptions: {
      preferences: {
        includeCompletionsForModuleExports: true,
        includeCompletionsForImportStatements: true,
        includeCompletionsWithSnippetText: true,
        includeAutomaticOptionalChainCompletions: true,
        importModuleSpecifierPreference: 'shortest',
        allowIncompleteCompletions: true,
      },
    },
  };
}
