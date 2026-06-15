import { Search } from 'lucide-react';
import { Input } from '../ui/Input';

interface SidebarFilterProps {
  filterRef: React.RefObject<HTMLInputElement | null>;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

export function SidebarFilter({
  filterRef,
  onChange,
  onClear,
  placeholder,
  value,
}: SidebarFilterProps) {
  return (
    <div className="sidebar-filter">
      <Search size={12} className="filter-icon" />
      <Input
        ref={filterRef}
        className="filter-input"
        placeholder={placeholder}
        value={value}
        onChange={event => onChange(event.target.value)}
      />
      {value && <button className="filter-clear" onClick={onClear}>x</button>}
    </div>
  );
}
