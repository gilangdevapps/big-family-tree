import type { APIRoute } from 'astro';
import { getCurrentUser, getGraph, userHasAccess } from '../../lib/store';

export const GET: APIRoute = async ({ params }) => {
  const user = getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const { treeId } = params;
  if (!treeId) {
    return new Response(JSON.stringify({ error: 'Tree ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (!userHasAccess(treeId, user.id)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify(getGraph(treeId)), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};