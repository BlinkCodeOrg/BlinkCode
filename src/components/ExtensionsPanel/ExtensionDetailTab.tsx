import { BadgeCheck, Box, Play, ShieldCheck } from 'lucide-react';
import type { FileNode } from '../../types';
import { renderMarkdown } from '../../features/markdownPreview/renderMarkdown';
import { useExtensions } from '../../features/extensions/ExtensionContext';
import { useEditor } from '../../store/EditorContext';
import { useT } from '../../hooks/useT';
import { Button } from '../ui/Button';
import { ExtensionDetailSidebar } from './ExtensionDetailSidebar';

export function ExtensionDetailTab({ file }: { file: FileNode }) {
  const detail = file.extensionDetail!;
  const { extensions, commands, busyId, runCommand, update } = useExtensions();
  const { addToast } = useEditor();
  const tt = useT();
  const extension = extensions.find(item => item.id === detail.id);
  if (!extension) return null;
  const installed = extension?.installed ?? false;
  const enabled = extension?.enabled ?? false;

  const change = async (operation: 'install' | 'update' | 'uninstall' | 'enable' | 'disable') => {
    try {
      await update(detail.id, operation);
      addToast(tt(`extensions.${operation}Success`), 'success');
    } catch {
      addToast(tt('extensions.operationFailed'), 'error');
    }
  };

  return (
    <div className="extension-detail">
      <header className="extension-detail-hero">
        <img src={extension.iconDataUrl} alt="" />
        <div className="extension-detail-summary">
          <div className="extension-detail-title">
            <h1>{extension.displayName}</h1>
            <span>v{extension.version}</span>
          </div>
          <p>{extension.description}</p>
          <div className="extension-detail-publisher">
            <BadgeCheck size={14} />
            {tt('extensions.publishedBy')} <strong>{extension.publisher}</strong>
          </div>
          <div className="extension-detail-actions">
            {!installed && <Button disabled={busyId === detail.id} onClick={() => void change('install')}>{tt('extensions.install')}</Button>}
            {installed && extension.updateAvailable && <Button disabled={busyId === detail.id} onClick={() => void change('update')}>{tt('extensions.update')}</Button>}
            {installed && <Button disabled={busyId === detail.id} onClick={() => void change(enabled ? 'disable' : 'enable')}>{tt(enabled ? 'extensions.disable' : 'extensions.enable')}</Button>}
            {installed && <Button variant="ghost" disabled={busyId === detail.id} onClick={() => void change('uninstall')}>{tt('extensions.uninstall')}</Button>}
          </div>
        </div>
      </header>
      <div className="extension-detail-meta">
        <span><Box size={13} />{extension.categories.join(', ')}</span>
        <span><ShieldCheck size={13} />{tt('extensions.permissions', { count: extension.permissions.length })}</span>
      </div>
      <div className="extension-detail-body">
        <div className="extension-detail-main" data-testid="extension-readme-scroll">
          <main className="extension-detail-readme" dangerouslySetInnerHTML={{ __html: renderMarkdown(detail.readme) }} />
          {commands.some(command => command.extensionId === detail.id) && (
            <section className="extension-detail-commands">
              <h2>{tt('extensions.commands')}</h2>
              {commands.filter(command => command.extensionId === detail.id).map(command => (
                <button key={command.command} onClick={() => runCommand(command)}>
                  <Play size={13} />
                  <span>{command.title}<small>{command.command}</small></span>
                </button>
              ))}
            </section>
          )}
        </div>
        <ExtensionDetailSidebar extension={extension} />
      </div>
    </div>
  );
}
