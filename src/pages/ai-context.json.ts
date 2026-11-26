import { buildAiContextPayload } from '../utils/catalogIndex';

export async function GET() {
  const payload = await buildAiContextPayload();

  return new Response(JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
