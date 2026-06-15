import { useEditor } from '../../store/EditorContext';
import { ChevronRight } from 'lucide-react';
import './Breadcrumb.css';
import { BreadcrumbSymbols } from './BreadcrumbSymbols';

export default function Breadcrumb() {
  const { getActiveFile } = useEditor();
  const file = getActiveFile();

  if (!file?.serverPath || file.serverPath.startsWith('__')) return null;
  if (file.serverPath.startsWith('__git_diff__/')) return null;

  const displayPath = file.serverPath.startsWith('__git_diff__/')
    ? file.serverPath.replace(/^__git_diff__\/(staged|unstaged)\//, '')
    : file.serverPath;
  const parts = displayPath.split('/');

  return (
    <div className="breadcrumb">
      {parts.map((part, i) => (
        <span key={i} className="breadcrumb-part">
          {i > 0 && <ChevronRight size={11} className="breadcrumb-sep" />}
          <span className={i === parts.length - 1 ? 'breadcrumb-active' : ''}>{part}</span>
        </span>
      ))}
      <BreadcrumbSymbols path={displayPath} />
    </div>
  );
}
