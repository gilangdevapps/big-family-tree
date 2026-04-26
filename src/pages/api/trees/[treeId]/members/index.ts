import type { APIRoute } from 'astro';
import { getCurrentUser, getMembersForTree, addMember, userHasAccess, userIsAdmin } from '../../../lib/store';

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

  return new Response(JSON.stringify(getMembersForTree(treeId)), {
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

  const { first_name, last_name } = body;
  if (!first_name || typeof first_name !== 'string' || first_name.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'First name is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  if (!last_name || typeof last_name !== 'string' || last_name.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Last name is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const member = addMember(treeId, {
    first_name: first_name.trim(),
    last_name: last_name.trim(),
    birth_date: (body.birth_date as string) || null,
    death_date: (body.death_date as string) || null,
    gender: (body.gender as 'male' | 'female' | 'other') || null,
    birth_place: (body.birth_place as string) || null,
    location: (body.location as string) || null,
    occupation: (body.occupation as string) || null,
    bio: (body.bio as string) || null,
    email: (body.email as string) || null,
    phone: (body.phone as string) || null,
    is_adopted: (body.is_adopted as boolean) || false,
    is_root: (body.is_root as boolean) || false,
  });

  return new Response(JSON.stringify(member), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};