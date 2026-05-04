'use client';
import { IconButton } from './IconButton';

export function FavoriteButton({
  active, onToggle,
}: {
  active: boolean; onToggle: () => void;
}) {
  return (
    <IconButton
      onClick={onToggle}
      aria-label={active ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={active}
    >
      <svg width="14" height="14" viewBox="0 0 14 14">
        <path
          d="M7 1.5L8.7 5.1L12.5 5.6L9.7 8.3L10.4 12L7 10.2L3.6 12L4.3 8.3L1.5 5.6L5.3 5.1L7 1.5Z"
          fill={active ? 'var(--color-accent)' : 'none'}
          stroke={active ? 'var(--color-accent)' : 'currentColor'}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    </IconButton>
  );
}
