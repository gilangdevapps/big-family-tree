import type { APIRoute } from 'astro';
import { getCurrentUser, getInvitesForTree, createInvite, revokeInvite, getTree, userIsAdmin, getMembershipsForTree } from '../../../../lib/store';

export const GET: APIRoute = async ({ params }) => {
  const user = getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const { treeId } = params;
  if (!treeId) {
    return new Response(JSON.stringify({ error: 'Tree ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (!userIsAdmin(treeId, user.id)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify(getInvitesForTree(treeId)), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ params, request }) => {
  const user = getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const { treeId } = params;
  if (!treeId) {
    return new Response(JSON.stringify({ error: 'Tree ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (!userIsAdmin(treeId, user.id)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { email, role } = body;
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return new Response(JSON.stringify({ error: 'A valid email address is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const assignedRole = role === 'admin' ? 'admin' : 'family_member';

  // Check for existing unused invite
  const existingInvites = getInvitesForTree(treeId);
  const existingInvite = existingInvites.find(i => i.email.toLowerCase() === normalizedEmail && !i.used_at);
  if (existingInvite) {
    return new Response(JSON.stringify({
      invite: existingInvite,
      url: `/invite/${existingInvite.token}`,
      message: 'An unused invite already exists for this email',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  const invite = createInvite(treeId, normalizedEmail, assignedRole);

  return new Response(JSON.stringify({
    invite,
    url: `/invite/${invite.token}`,
  }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
