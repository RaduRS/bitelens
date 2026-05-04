export function GET() {
  const body = {
    name: 'BiteLens',
    short_name: 'BiteLens',
    description: 'Scan packaged food, see what is in it, decide instantly.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0b',
    theme_color: '#0a0a0b',
    orientation: 'portrait',
    icons: [
      { src: '/icon1', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon2', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon2', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/manifest+json' },
  });
}
