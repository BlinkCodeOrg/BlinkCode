import { CalendarDays } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useEditor } from '../../store/EditorContext';
import { useT } from '../../hooks/useT';

export function HeaderClock() {
  const { state } = useEditor();
  const tt = useT();
  const [now, setNow] = useState(() => new Date());
  const locale = state.settings.language === 'ru' ? 'ru-RU' : 'en-US';
  const formatted = useMemo(() => ({
    time: new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(now),
    date: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(now),
    full: new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeStyle: 'short' }).format(now),
  }), [locale, now]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="header-clock" aria-label={tt('header.clock')} title={formatted.full}>
      <CalendarDays size={13} />
      <span className="header-clock-time">{formatted.time}</span>
      <span className="header-clock-date">{formatted.date}</span>
    </div>
  );
}
