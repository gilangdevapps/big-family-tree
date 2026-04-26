import type { APIRoute } from 'astro';
import { getCurrentUser, searchMembers, getTree } from '../../../lib/store';

export const GET: APIRoute = async ({ url }) => {
  const user = getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const query = url.searchParams.get('q')?.trim() || '';
  if (!query || query.length < 2) {
    return new Response(JSON.stringify({ error: 'Query must be at least 2 characters' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (query.length > 100) {
    return new Response(JSON.stringify({ error: 'Query too long' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const results = searchMembers(query, user.id).map((m) => {
    const tree = getTree(m.tree_id);
    return { ...m, tree_name: tree?.name || 'Unknown tree' };
  });

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};