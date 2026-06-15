interface DebugPinToggleProps {
  pinned: boolean;
  title: string;
  onClick: () => void;
}

export function DebugPinToggle({ onClick, pinned, title }: DebugPinToggleProps) {
  return (
    <button
      type="button"
      className={`debug-pin-toggle ${pinned ? 'active' : ''}`}
      data-testid="debug-pin-toggle"
      aria-label={title}
      aria-pressed={pinned}
      onClick={onClick}
      title={title}
    >
      <span className="debug-pin-icon" aria-hidden="true">
        <span className="debug-pin-head" />
        <span className="debug-pin-stem" />
      </span>
    </button>
  );
}
