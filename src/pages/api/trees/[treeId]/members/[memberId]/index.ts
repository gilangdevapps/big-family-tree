import type { APIRoute } from 'astro';
import { getCurrentUser, getMember, updateMember, deleteMember, userHasAccess, userIsAdmin, getUsers } from '../../../../lib/store';

export const GET: APIRoute = async ({ params }) => {
  const user = getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const { treeId, memberId } = params;
  if (!treeId || !memberId) {
    return new Response(JSON.stringify({ error: 'Tree ID and Member ID are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (!userHasAccess(treeId, user.id)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  const member = getMember(memberId);
  if (!member || member.tree_id !== treeId) {
    return new Response(JSON.stringify({ error: 'Member not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  // Include last_editor_email
  const lastEditor = member.last_edited_by ? getUsers().find(u => u.id === member.last_edited_by) : null;
  return new Response(JSON.stringify({ ...member, last_editor_email: lastEditor?.email || null }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PATCH: APIRoute = async ({ params, request }) => {
  const user = getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const { treeId, memberId } = params;
  if (!treeId || !memberId) {
    return new Response(JSON.stringify({ error: 'Tree ID and Member ID are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
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

  const allowedFields = [
    'first_name', 'last_name', 'birth_date', 'death_date', 'gender',
    'birth_place', 'location', 'occupation', 'bio', 'email', 'phone',
    'is_adopted', 'is_root', 'photo_data', 'profile_photo_url',
  ];

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  if (updates.first_name !== undefined && (typeof updates.first_name !== 'string' || updates.first_name.trim().length === 0)) {
    return new Response(JSON.stringify({ error: 'First name cannot be empty' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  if (updates.last_name !== undefined && (typeof updates.last_name !== 'string' || updates.last_name.trim().length === 0)) {
    return new Response(JSON.stringify({ error: 'Last name cannot be empty' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (typeof updates.first_name === 'string') updates.first_name = updates.first_name.trim();
  if (typeof updates.last_name === 'string') updates.last_name = updates.last_name.trim();

  const updated = updateMember(memberId, updates);
  if (!updated) {
    return new Response(JSON.stringify({ error: 'Member not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
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

  const { treeId, memberId } = params;
  if (!treeId || !memberId) {
    return new Response(JSON.stringify({ error: 'Tree ID and Member ID are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (!userIsAdmin(treeId, user.id)) {
    return new Response(JSON.stringify({ error: 'Forbidden: must be tree admin' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  deleteMember(memberId);
  return new Response(null, { status: 204 });
};
