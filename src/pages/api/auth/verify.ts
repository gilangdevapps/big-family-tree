import type { APIRoute } from 'astro';
import { getCurrentUser, getOrCreateUser, setCurrentUser } from '../../../lib/store';

export const GET: APIRoute = async ({ url }) => {
  // Auto-confirm for demo: just go to dashboard
  const user = getCurrentUser();
  if (user) {
    return new Response(null, { status: 302, headers: { Location: '/dashboard' } });
  }
  return new Response(null, { status: 302, headers: { Location: '/auth/magic-link' } });
};

export const POST: APIRoute = async ({ request }) => {
  const user = getCurrentUser();
  if (!user) {
    return new Response(null, { status: 302, headers: { Location: '/auth/magic-link' } });
  }
  return new Response(null, { status: 302, headers: { Location: '/dashboard' } });
};