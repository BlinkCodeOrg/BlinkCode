import { Braces, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BreadcrumbSymbolsProps {
  path: string;
}

export function BreadcrumbSymbols({ path }: BreadcrumbSymbolsProps) {
  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const editor = (window as any).__blinkcodeEditor;
    const disposable = editor?.onDidChangeModelContent?.(() => setVersion(value => value + 1));
    return () => disposable?.dispose?.();
  }, [path]);

  void version;
  const symbols = (() => {
    const editor = (window as any).__blinkcodeEditor;
    const value = editor?.getModel?.()?.getValue?.() || '';
    return value.split('\n').map((line: string, index: number) => {
      const match = line.match(/^\s*(?:export\s+)?(?:async\s+)?(?:function|class|interface|type|enum|const|let|var)\s+([A-Za-z_$][\w$]*)/);
      return match ? { name: match[1], line: index + 1 } : null;
    }).filter(Boolean).slice(0, 100) as Array<{ name: string; line: number }>;
  })();

  if (!symbols.length) return null;
  const goTo = (line: number) => {
    const editor = (window as any).__blinkcodeEditor;
    editor?.setPosition?.({ lineNumber: line, column: 1 });
    editor?.revealLineInCenter?.(line);
    editor?.focus?.();
    setOpen(false);
  };

  return (
    <div className="breadcrumb-symbols">
      <button type="button" onClick={() => setOpen(value => !value)}>
        <Braces size={12} />
        {symbols.length}
        <ChevronDown size={11} />
      </button>
      {open && (
        <div className="breadcrumb-symbol-menu">
          {symbols.map(symbol => (
            <button key={`${symbol.name}:${symbol.line}`} type="button" onClick={() => goTo(symbol.line)}>
              <Braces size={12} />
              <span>{symbol.name}</span>
              <small>{symbol.line}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
