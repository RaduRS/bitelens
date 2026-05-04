import type { ReactNode } from 'react';
import { Wordmark } from './Wordmark';
import { IconButton } from '@/components/ui/IconButton';

interface Props {
  onBack?: () => void;
  title?: string;
  right?: ReactNode;
  leading?: 'wordmark' | 'spacer' | 'back';
}

export function TopBar({ onBack, title, right, leading }: Props) {
  const showBack = !!onBack;
  const showWordmark = !showBack && !title && leading !== 'spacer';
  const showSpacer = !showBack && (!!title || leading === 'spacer');
  return (
    <div className="flex items-center justify-between gap-3" style={{ padding: '60px 20px 12px' }}>
      {showBack && (
        <IconButton onClick={onBack} aria-label="Back">
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M9 2L3 7L9 12" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </IconButton>
      )}
      {showWordmark && <Wordmark />}
      {showSpacer && <div style={{ width: 36, height: 36 }} />}
      {title && <div className="font-semibold text-text" style={{ fontSize: 15 }}>{title}</div>}
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}
