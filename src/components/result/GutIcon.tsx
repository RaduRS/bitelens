interface Props {
  size?: number;
  strokeWidth?: number;
}

export function GutIcon({ size = 16, strokeWidth = 1.6 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 4v3" />
      <path d="M15 4v3" />
      <path d="M6 8a3 3 0 0 1 3-3" />
      <path d="M18 8a3 3 0 0 0-3-3" />
      <path d="M6 8v3a3 3 0 0 0 3 3 3 3 0 0 1 3 3v3" />
      <path d="M18 8v3a3 3 0 0 1-3 3 3 3 0 0 0-3 3v3" />
    </svg>
  );
}
