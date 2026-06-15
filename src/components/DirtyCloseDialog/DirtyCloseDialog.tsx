import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useEditor } from '../../store/EditorContext';
import { deleteRecoveryBuffer } from '../../utils/api';
import { getDirtyFiles } from '../../features/dirtyFiles/getDirtyFiles';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useT } from '../../hooks/useT';
import './DirtyCloseDialog.css';

export default function DirtyCloseDialog() {
  const { state, saveAllFiles } = useEditor();
  const tt = useT();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const dirtyFiles = getDirtyFiles(state.files);

  useEffect(() => {
    const requestClose = () => {
      if (getDirtyFiles(state.files).length === 0) {
        void window.electronAPI?.forceCloseWindow?.();
        return;
      }
      setOpen(true);
    };
    window.addEventListener('blinkcode:requestCloseWindow', requestClose);
    const unsubscribe = window.electronAPI?.onCloseRequested?.(requestClose);
    return () => {
      window.removeEventListener('blinkcode:requestCloseWindow', requestClose);
      unsubscribe?.();
    };
  }, [state.files]);

  if (!open) return null;

  const saveAndClose = async () => {
    setBusy(true);
    const saved = await saveAllFiles();
    setBusy(false);
    if (saved) await window.electronAPI?.forceCloseWindow?.();
  };

  const discardAndClose = async () => {
    setBusy(true);
    await Promise.all(dirtyFiles.map(file => (
      file.serverPath ? deleteRecoveryBuffer(file.serverPath).catch(() => {}) : Promise.resolve()
    )));
    await window.electronAPI?.forceCloseWindow?.();
  };

  return (
    <Modal ariaLabel={tt('dirty.title')} className="dirty-close-dialog" onClose={() => !busy && setOpen(false)}>
      <div className="dirty-close-title"><AlertTriangle size={18} /><strong>{tt('dirty.title')}</strong></div>
      <p>{tt('dirty.message')}</p>
      <div className="dirty-close-files">
        {dirtyFiles.slice(0, 6).map(file => <span key={file.id}>{file.serverPath || file.name}</span>)}
        {dirtyFiles.length > 6 && <span>{tt('dirty.andMore', { count: dirtyFiles.length - 6 })}</span>}
      </div>
      <div className="dirty-close-actions">
        <Button disabled={busy} onClick={() => setOpen(false)}>{tt('common.cancel')}</Button>
        <Button disabled={busy} variant="danger" onClick={discardAndClose}>{tt('dirty.closeWithoutSaving')}</Button>
        <Button disabled={busy} variant="primary" onClick={saveAndClose}>{busy ? tt('common.saving') : tt('dirty.saveAllClose')}</Button>
      </div>
    </Modal>
  );
}
