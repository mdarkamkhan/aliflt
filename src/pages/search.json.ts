import { buildSearchItems } from '../utils/catalogIndex';

export async function GET() {
  const items = await buildSearchItems();

  return new Response(JSON.stringify(items), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
