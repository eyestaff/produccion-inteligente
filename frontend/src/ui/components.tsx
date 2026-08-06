interface PageCardProps {
  title: string;
  description: string;
  accent?: string;
}

export function PageCard({ title, description, accent = 'var(--accent)' }: PageCardProps) {
  return (
    <section className="card" style={{ ['--card-accent' as string]: accent }}>
      <h3>{title}</h3>
      <p>{description}</p>
    </section>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
