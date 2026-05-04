import { ImageResponse } from 'next/og';
import { LogoMark } from '@/lib/icons/logo-mark';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(<LogoMark size={size.width} />, { ...size });
}
