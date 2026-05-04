import type { ReactElement } from 'react';

const ACCENT = '#a3e635';
const BG = '#0a0a0b';

export function LogoMark({ size }: { size: number }): ReactElement {
  const ringWidth = Math.max(2, Math.round(size / 24));
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: BG,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '78%',
          height: '78%',
          borderRadius: '50%',
          border: `${ringWidth}px solid ${ACCENT}`,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '55%',
            height: '55%',
            borderRadius: '50%',
            border: `${ringWidth}px solid ${ACCENT}`,
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              width: '38%',
              height: '38%',
              borderRadius: '50%',
              background: ACCENT,
            }}
          />
        </div>
      </div>
    </div>
  );
}
