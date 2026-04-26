import type { APIRoute } from 'astro';
import { getCurrentUser, getInviteByToken, acceptInvite, addMembership, getTree } from '../../lib/store';

export const POST: APIRoute = async ({ params }) => {
  const user = getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const { token } = params;
  if (!token) {
    return new Response(JSON.stringify({ error: 'Token is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const invite = getInviteByToken(token);
  if (!invite) {
    return new Response(JSON.stringify({ error: 'Invalid or expired invite link' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  if (invite.used_at) {
    return new Response(JSON.stringify({ error: 'This invite has already been used' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return new Response(JSON.stringify({
      error: `This invite was sent to ${invite.email}. Sign in with that address to join.`,
      invite_email: invite.email,
    }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  // Accept invite — mark as used
  acceptInvite(token);

  // Add membership
  addMembership(invite.tree_id, user.id, invite.role);

  const tree = getTree(invite.tree_id);

  return new Response(JSON.stringify({
    success: true,
    tree_id: invite.tree_id,
    tree_name: tree?.name ?? 'the tree',
    role: invite.role,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};