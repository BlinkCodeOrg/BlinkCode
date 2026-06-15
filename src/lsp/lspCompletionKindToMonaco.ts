import type { Monaco } from './monacoTypes';

export function lspCompletionKindToMonaco(kind: number | undefined, monaco: Monaco) {
  const completionKind = monaco.languages.CompletionItemKind;
  switch (kind) {
    case 1: return completionKind.Text;
    case 2: return completionKind.Method;
    case 3: return completionKind.Function;
    case 4: return completionKind.Constructor;
    case 5: return completionKind.Field;
    case 6: return completionKind.Variable;
    case 7: return completionKind.Class;
    case 8: return completionKind.Interface;
    case 9: return completionKind.Module;
    case 10: return completionKind.Property;
    case 11: return completionKind.Unit;
    case 12: return completionKind.Value;
    case 13: return completionKind.Enum;
    case 14: return completionKind.Keyword;
    case 15: return completionKind.Snippet;
    case 16: return completionKind.Color;
    case 17: return completionKind.File;
    case 18: return completionKind.Reference;
    case 19: return completionKind.Folder;
    case 20: return completionKind.EnumMember;
    case 21: return completionKind.Constant;
    case 22: return completionKind.Struct;
    case 23: return completionKind.Event;
    case 24: return completionKind.Operator;
    case 25: return completionKind.TypeParameter;
    default: return completionKind.Text;
  }
}
