import type { APIRoute } from 'astro';
import { getCurrentUser, getRelationshipsForTree, addRelationship, userHasAccess, userIsAdmin, checkRelationshipExists } from '../../../lib/store';

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

  return new Response(JSON.stringify(getRelationshipsForTree(treeId)), {
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
    return new Response(JSON.stringify({ error: 'Forbidden: must be tree admin' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { person_a_id, person_b_id, relationship_type } = body;
  if (!person_a_id || typeof person_a_id !== 'string') {
    return new Response(JSON.stringify({ error: 'person_a_id is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  if (!person_b_id || typeof person_b_id !== 'string') {
    return new Response(JSON.stringify({ error: 'person_b_id is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  if (!relationship_type || !['spouse', 'parent_child', 'step_sibling'].includes(relationship_type as string)) {
    return new Response(JSON.stringify({ error: 'relationship_type must be spouse, parent_child, or step_sibling' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  if (person_a_id === person_b_id) {
    return new Response(JSON.stringify({ error: 'Cannot create a relationship with the same person' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // Check duplicate
  if (checkRelationshipExists(treeId, relationship_type as string, person_a_id, person_b_id)) {
    return new Response(JSON.stringify({ error: 'This relationship already exists' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const rel = addRelationship({
    tree_id: treeId,
    person_a_id,
    person_b_id,
    relationship_type: relationship_type as 'spouse' | 'parent_child' | 'step_sibling',
    is_primary: (body.is_primary as boolean) || false,
    marriage_date: (body.marriage_date as string) || null,
    divorce_date: (body.divorce_date as string) || null,
    ended_reason: (body.ended_reason as string) || null,
    is_adopted: (body.is_adopted as boolean) || false,
  });

  return new Response(JSON.stringify(rel), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
