import type { LucideIcon } from 'lucide-react';

type OnboardingSectionProps = {
  icon: LucideIcon;
  items: string[];
  title: string;
};

export function OnboardingSection({ icon: Icon, items, title }: OnboardingSectionProps) {
  return (
    <section className="onboarding-section">
      <div className="onboarding-section-heading">
        <span className="onboarding-section-icon"><Icon size={17} /></span>
        <h3>{title}</h3>
      </div>
      <ul>
        {items.map(item => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}
