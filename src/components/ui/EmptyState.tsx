import type { ReactNode } from 'react';

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-start gap-3 p-6">
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      {children && <div className="max-w-prose text-[15px] text-muted">{children}</div>}
      {action}
    </div>
  );
}
