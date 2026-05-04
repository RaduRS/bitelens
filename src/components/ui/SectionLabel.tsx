import type { ReactNode } from 'react';

export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <div
        className="font-mono text-text-dim uppercase"
        style={{ fontSize: 11, letterSpacing: '0.16em' }}
      >{children}</div>
      {action}
    </div>
  );
}
