import { LayoutTemplate } from 'lucide-react';
import { PROJECT_TEMPLATES } from '../../features/projectTemplates/projectTemplates';

export function TemplatesSection({ tt, onOpenTemplates }: {
  tt: (key: string) => string;
  onOpenTemplates: (templateId?: string) => void;
}) {
  return (
    <div className="web-center-scroll">
      <section className="web-center-section">
        <div className="web-center-section-head">
          <h4>{tt('webCenter.templates')}</h4>
          <button onClick={() => onOpenTemplates()}><LayoutTemplate size={13} />{tt('common.create')}</button>
        </div>
        <div className="web-center-template-grid">
          {PROJECT_TEMPLATES.map(template => (
            <button key={template.id} className="web-center-template-card" onClick={() => onOpenTemplates(template.id)}>
              <LayoutTemplate size={16} />
              <strong>{template.name}</strong>
              <span>{tt(template.descriptionKey)}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
