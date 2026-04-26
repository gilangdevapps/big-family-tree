import type { APIRoute } from 'astro';
import { getCurrentUser, revokeInvite, userIsAdmin } from '../../../../../lib/store';

export const DELETE: APIRoute = async ({ params }) => {
  const user = getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const { treeId, inviteId } = params;
  if (!treeId || !inviteId) {
    return new Response(JSON.stringify({ error: 'Tree ID and Invite ID are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (!userIsAdmin(treeId, user.id)) {
    return new Response(JSON.stringify({ error: 'Forbidden: must be tree admin' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  revokeInvite(inviteId);
  return new Response(null, { status: 204 });
};
