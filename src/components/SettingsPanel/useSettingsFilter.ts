import { useEffect, useState } from 'react';

export function useSettingsFilter(
  container: React.RefObject<HTMLDivElement | null>,
  query: string,
  activeTab: string,
) {
  const [matchCount, setMatchCount] = useState(0);

  useEffect(() => {
    const root = container.current;
    if (!root) return;
    const normalized = query.trim().toLocaleLowerCase();
    const rows = Array.from(root.querySelectorAll<HTMLElement>('.settings-main .settings-row'));
    const sections = Array.from(root.querySelectorAll<HTMLElement>('.settings-main .settings-section'));
    let visibleRows = 0;

    rows.forEach(row => {
      row.hidden = Boolean(normalized) && !row.textContent?.toLocaleLowerCase().includes(normalized);
      if (!row.hidden) visibleRows += 1;
      const divider = row.nextElementSibling as HTMLElement | null;
      if (divider?.classList.contains('settings-divider')) divider.hidden = row.hidden;
    });
    sections.forEach(section => {
      const sectionTitle = section.querySelector('.settings-section-title')?.textContent?.toLocaleLowerCase() || '';
      const matchesTitle = Boolean(normalized) && sectionTitle.includes(normalized);
      if (matchesTitle) {
        section.querySelectorAll<HTMLElement>('.settings-row, .settings-divider').forEach(element => { element.hidden = false; });
      }
      section.hidden = Boolean(normalized) && !matchesTitle && !section.querySelector('.settings-row:not([hidden])');
    });
    setMatchCount(visibleRows);
  }, [activeTab, container, query]);

  return matchCount;
}
