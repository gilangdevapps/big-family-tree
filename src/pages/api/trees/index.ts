import type { APIRoute } from 'astro';
import { getCurrentUser, getTreesForUser, getMembers, createTree, getMembersForTree, addMembership, userHasAccess } from '../../../lib/store';

export const GET: APIRoute = async () => {
  const user = getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const trees = getTreesForUser(user.id).map(t => ({
    id: t.id,
    name: t.name,
    updated_at: t.updated_at,
    owner_id: t.owner_id,
    root_person_id: t.root_person_id,
    member_count: getMembersForTree(t.id).length,
  }));

  return new Response(JSON.stringify(trees), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const user = getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { name?: string; mode?: string } = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { name } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Tree name is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const trimmedName = name.trim();

  // Check for duplicate tree name for this user
  const existing = getTreesForUser(user.id).find(
    t => t.name.toLowerCase() === trimmedName.toLowerCase()
  );

  if (existing) {
    return new Response(
      JSON.stringify({ error: 'DUPLICATE_NAME', tree: existing }),
      { status: 409, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const tree = createTree(trimmedName, user.id);
  addMembership(tree.id, user.id, 'admin');

  return new Response(JSON.stringify(tree), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};