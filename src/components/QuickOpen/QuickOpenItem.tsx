import { getFileIcon } from '../../utils/fileIcons';

type QuickOpenItemProps = {
  path: string;
  active: boolean;
  onOpen: (path: string) => void;
  onSelect: () => void;
};

export function QuickOpenItem({ path, active, onOpen, onSelect }: QuickOpenItemProps) {
  const parts = path.split('/');
  const name = parts[parts.length - 1];
  const dir = parts.slice(0, -1).join('/');
  const icon = getFileIcon(name);

  return (
    <div
      className={`quickopen-item${active ? ' quickopen-item-active' : ''}`}
      onClick={() => onOpen(path)}
      onMouseEnter={onSelect}
    >
      <span className="quickopen-icon" style={{ color: icon.color }}>{icon.icon}</span>
      <span className="quickopen-name">{name}</span>
      {dir && <span className="quickopen-dir">{dir}</span>}
    </div>
  );
}
