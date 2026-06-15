export function Skeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="ui-skeleton" aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => <span key={index} style={{ width: `${92 - (index % 3) * 13}%` }} />)}
    </div>
  );
}
