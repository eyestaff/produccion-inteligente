export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`skeleton-pulse ${className || ''}`} style={style} />
  );
}

export function SkeletonRow() {
  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid var(--border)' }}>
      <Skeleton style={{ height: '20px', width: '20%' }} />
      <Skeleton style={{ height: '20px', width: '30%' }} />
      <Skeleton style={{ height: '20px', width: '15%' }} />
      <Skeleton style={{ height: '20px', width: '20%' }} />
    </div>
  );
}
