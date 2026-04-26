import type { APIRoute } from 'astro';
import { getCurrentUser, getTree, updateTree, deleteTree, userHasAccess, userIsAdmin } from '../../lib/store';

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

  const tree = getTree(treeId);
  if (!tree) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify(tree), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PATCH: APIRoute = async ({ params, request }) => {
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

  let body: { name?: string; root_person_id?: string | null } = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Tree name cannot be empty' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    updates.name = body.name.trim();
  }

  if (body.root_person_id !== undefined) {
    updates.root_person_id = body.root_person_id;
  }

  const updated = updateTree(treeId, updates);
  if (!updated) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

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

  const { treeId } = params;
  if (!treeId) {
    return new Response(JSON.stringify({ error: 'Tree ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const tree = getTree(treeId);
  if (!tree) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  if (tree.owner_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Only the owner can delete this tree' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  deleteTree(treeId);
  return new Response(null, { status: 204 });
};