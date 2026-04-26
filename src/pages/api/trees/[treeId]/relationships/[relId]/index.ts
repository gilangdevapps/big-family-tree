import type { APIRoute } from 'astro';
import { getCurrentUser, updateRelationship, removeRelationship, userIsAdmin } from '../../../../../lib/store';

export const PATCH: APIRoute = async ({ params, request }) => {
  const user = getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const { treeId, relId } = params;
  if (!treeId || !relId) {
    return new Response(JSON.stringify({ error: 'Tree ID and Relationship ID are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (!userIsAdmin(treeId, user.id)) {
    return new Response(JSON.stringify({ error: 'Forbidden: must be tree admin' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const allowedFields = ['is_primary', 'marriage_date', 'divorce_date', 'ended_reason'];
  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  if (Object.keys(updates).length === 0) {
    return new Response(JSON.stringify({ error: 'No valid fields to update' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (updates.ended_reason !== undefined) {
    const valid = ['divorce', 'death', null, 'null'];
    if (!valid.includes(updates.ended_reason as string)) {
      return new Response(JSON.stringify({ error: 'ended_reason must be divorce, death, or null' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
  }

  const rel = updateRelationship(relId, updates as Record<string, string>);
  if (!rel) {
    return new Response(JSON.stringify({ error: 'Relationship not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify(rel), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const user = getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const { treeId, relId } = params;
  if (!treeId || !relId) {
    return new Response(JSON.stringify({ error: 'Tree ID and Relationship ID are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (!userIsAdmin(treeId, user.id)) {
    return new Response(JSON.stringify({ error: 'Forbidden: must be tree admin' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  removeRelationship(relId);
  return new Response(null, { status: 204 });
};
