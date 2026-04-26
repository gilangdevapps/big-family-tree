import type { APIRoute } from 'astro';
import { getCurrentUser, updateMembership, removeMembership, getMemberships, userIsAdmin } from '../../../../lib/store';

export const PATCH: APIRoute = async ({ params, request }) => {
  const user = getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const { treeId, membershipId } = params;
  if (!treeId || !membershipId) {
    return new Response(JSON.stringify({ error: 'Tree ID and Membership ID are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (!userIsAdmin(treeId, user.id)) {
    return new Response(JSON.stringify({ error: 'Forbidden: must be tree admin' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  const targetMembership = getMemberships().find(m => m.id === membershipId && m.tree_id === treeId);
  if (!targetMembership) {
    return new Response(JSON.stringify({ error: 'Membership not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  // Self-demote prevention
  if (targetMembership.user_id === user.id) {
    return new Response(JSON.stringify({
      error: 'You cannot change your own role. Transfer ownership first.',
      code: 'SELF_DEMOTE_NOT_ALLOWED',
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { role } = body;
  if (!role || !['admin', 'family_member'].includes(role as string)) {
    return new Response(JSON.stringify({ error: 'Role must be admin or family_member' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const updated = updateMembership(membershipId, { role: role as 'admin' | 'family_member' });
  return new Response(JSON.stringify(updated), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const user = getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const { treeId, membershipId } = params;
  if (!treeId || !membershipId) {
    return new Response(JSON.stringify({ error: 'Tree ID and Membership ID are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (!userIsAdmin(treeId, user.id)) {
    return new Response(JSON.stringify({ error: 'Forbidden: must be tree admin' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  const targetMembership = getMemberships().find(m => m.id === membershipId && m.tree_id === treeId);
  if (!targetMembership) {
    return new Response(JSON.stringify({ error: 'Membership not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  // Self-removal prevention
  if (targetMembership.user_id === user.id) {
    return new Response(JSON.stringify({ error: 'You cannot remove yourself from the tree' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  removeMembership(membershipId);
  return new Response(null, { status: 204 });
};
