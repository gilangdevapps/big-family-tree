import type { APIRoute } from 'astro';
import { setCurrentUser } from '../../../lib/store';

export const POST: APIRoute = async () => {
  setCurrentUser(null);
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};