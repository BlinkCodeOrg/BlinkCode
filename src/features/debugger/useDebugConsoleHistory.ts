import { useState, type KeyboardEvent } from 'react';

const STORAGE_KEY = 'blinkcode-debug-console-history';
const HISTORY_LIMIT = 50;

function loadHistory(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value.filter(item => typeof item === 'string').slice(-HISTORY_LIMIT) : [];
  } catch {
    return [];
  }
}

export function useDebugConsoleHistory(setExpression: (value: string) => void) {
  const [history, setHistory] = useState<string[]>(loadHistory);
  const [index, setIndex] = useState(history.length);

  const record = (expression: string) => {
    const next = [...history.filter(item => item !== expression), expression].slice(-HISTORY_LIMIT);
    setHistory(next);
    setIndex(next.length);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    const nextIndex = event.key === 'ArrowUp'
      ? Math.max(0, index - 1)
      : Math.min(history.length, index + 1);
    setIndex(nextIndex);
    setExpression(nextIndex === history.length ? '' : history[nextIndex] || '');
  };

  return { handleKeyDown, record };
}
