import type { APIRoute } from 'astro';
import { getCurrentUser, getTree, userIsAdmin, transferOwnership, getUsers, getMembershipsForTree } from '../../lib/store';

export const POST: APIRoute = async ({ params, request }) => {
  const user = getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { treeId } = params;
  if (!treeId) {
    return new Response(JSON.stringify({ error: 'Tree ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const tree = getTree(treeId);
  if (!tree) {
    return new Response(JSON.stringify({ error: 'Tree not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Only owner can transfer
  if (tree.owner_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Only the owner can transfer ownership' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { new_owner_id?: string } = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { new_owner_id } = body;

  if (!new_owner_id || typeof new_owner_id !== 'string') {
    return new Response(JSON.stringify({ error: 'new_owner_id is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify new owner exists
  const newOwner = getUsers().find(u => u.id === new_owner_id);
  if (!newOwner) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify new owner is a member of the tree
  const memberships = getMembershipsForTree(treeId);
  const newOwnerMembership = memberships.find(m => m.user_id === new_owner_id);
  if (!newOwnerMembership) {
    return new Response(JSON.stringify({ error: 'User must be a member of this tree first' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Cannot transfer to yourself
  if (new_owner_id === user.id) {
    return new Response(JSON.stringify({ error: 'Cannot transfer to yourself' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  transferOwnership(treeId, new_owner_id);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
