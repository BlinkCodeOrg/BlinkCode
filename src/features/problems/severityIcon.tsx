import { AlertTriangle, CircleAlert, Info } from 'lucide-react';

export function severityIcon(severity: number) {
  switch (severity) {
    case 8:
      return <CircleAlert size={13} className="problem-icon-error" />;
    case 4:
      return <AlertTriangle size={13} className="problem-icon-warning" />;
    default:
      return <Info size={13} className="problem-icon-info" />;
  }
}
