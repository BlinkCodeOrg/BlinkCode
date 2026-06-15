import type { RefObject } from 'react';
import { File, Folder } from 'lucide-react';
import { Input } from '../ui/Input';

type SidebarInlineInputProps = {
  inputRef: RefObject<HTMLInputElement | null>;
  type: 'file' | 'folder';
  value: string;
  paddingLeft: number;
  tt: (key: string) => string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function SidebarInlineInput({
  inputRef,
  type,
  value,
  paddingLeft,
  tt,
  onChange,
  onSubmit,
  onCancel,
}: SidebarInlineInputProps) {
  return (
    <div className="tree-row inline-row" style={{ paddingLeft }}>
      <span className="tree-twistie" />
      <span className="tree-icon">
        {type === 'folder' ? <Folder size={15} className="icon-folder" /> : <File size={15} style={{ color: '#6b7280' }} />}
      </span>
      <Input ref={inputRef} className="tree-rename-input" value={value}
        placeholder={type === 'folder' ? tt('inline.folder') : tt('inline.file')}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onSubmit(); if (e.key === 'Escape') onCancel(); }}
        onBlur={onSubmit}
        onDragStart={e => e.preventDefault()} onMouseDown={e => e.stopPropagation()} />
    </div>
  );
}
