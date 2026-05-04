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
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/manifest+json' },
  });
}
