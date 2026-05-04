import { searchOFF } from '@/lib/off/search';
import { DiscoverClient } from './discover-client';

export default async function DiscoverPage() {
  const initialTopRated = await searchOFF({ topRated: true, limit: 12 }).catch(() => []);
  return <DiscoverClient initialTopRated={initialTopRated} />;
}
