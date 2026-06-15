import { useEffect, useMemo, useState } from 'react';
import { FolderOpen, FolderPlus } from 'lucide-react';
import { useEditor } from '../../store/EditorContext';
import { createProjectFromTemplate } from '../../features/projectTemplates/createProjectFromTemplate';
import { PROJECT_TEMPLATES } from '../../features/projectTemplates/projectTemplates';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { useT } from '../../hooks/useT';

type Destination = {
  directoryHandle?: FileSystemDirectoryHandle;
  label: string;
  nativePath?: string;
};

export default function ProjectTemplatesModal() {
  const { addToast } = useEditor();
  const tt = useT();
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState(PROJECT_TEMPLATES[0].id);
  const [projectName, setProjectName] = useState('new-project');
  const [destination, setDestination] = useState<Destination | null>(null);
  const [packageManager, setPackageManager] = useState<'npm' | 'pnpm' | 'yarn'>('npm');
  const [creating, setCreating] = useState(false);
  const template = useMemo(() => PROJECT_TEMPLATES.find(item => item.id === templateId)!, [templateId]);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener('blinkcode:openProjectTemplates', show);
    return () => window.removeEventListener('blinkcode:openProjectTemplates', show);
  }, []);

  if (!open) return null;

  const chooseDestination = async () => {
    try {
      if (window.electronAPI?.openFolder) {
        const nativePath = await window.electronAPI.openFolder();
        if (nativePath) setDestination({ nativePath, label: nativePath });
        return;
      }
      if ('showDirectoryPicker' in window) {
        const directoryHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
        setDestination({ directoryHandle, label: directoryHandle.name });
        return;
      }
      addToast(tt('project.locationUnavailable'), 'error');
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') {
        addToast(error instanceof Error ? error.message : tt('project.locationUnavailable'), 'error');
      }
    }
  };

  const create = async () => {
    if (!destination) {
      addToast(tt('project.chooseLocation'), 'error');
      return;
    }
    setCreating(true);
    try {
      const folder = await createProjectFromTemplate(template, projectName, packageManager, destination);
      addToast(tt('project.createdIn', { name: template.name, folder }), 'success');
      setOpen(false);
    } catch (error) {
      addToast(error instanceof Error ? error.message : tt('project.createFailed'), 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal ariaLabel={tt('project.create')} className="project-template-modal" onClose={() => setOpen(false)}>
      <div className="ui-confirm-heading"><FolderPlus size={16} /><strong>{tt('project.create')}</strong></div>
      <Select ariaLabel={tt('project.template')} options={PROJECT_TEMPLATES.map(item => ({ value: item.id, label: item.name }))} value={templateId} onChange={value => setTemplateId(String(value))} />
      <p>{tt(template.descriptionKey)}</p>
      <Select
        ariaLabel={tt('project.packageManager')}
        options={['npm', 'pnpm', 'yarn'].map(value => ({ value, label: value }))}
        value={packageManager}
        onChange={value => setPackageManager(value as typeof packageManager)}
      />
      <Input aria-label={tt('project.folder')} value={projectName} onChange={event => setProjectName(event.target.value)} placeholder={tt('project.folderPlaceholder')} />
      <div className="project-template-location">
        <div>
          <strong>{tt('project.location')}</strong>
          <span title={destination?.label}>{destination?.label || tt('project.locationNotSelected')}</span>
        </div>
        <Button onClick={chooseDestination}><FolderOpen size={14} />{tt('project.browse')}</Button>
      </div>
      <div className="ui-confirm-actions">
        <Button onClick={() => setOpen(false)}>{tt('common.cancel')}</Button>
        <Button variant="primary" disabled={creating || !projectName.trim() || !destination} onClick={create}>{creating ? tt('common.creating') : tt('common.create')}</Button>
      </div>
    </Modal>
  );
}
