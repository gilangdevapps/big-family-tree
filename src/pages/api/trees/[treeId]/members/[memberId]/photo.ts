import type { APIRoute } from 'astro';
import { getCurrentUser, getMember, updateMember, userIsAdmin } from '../../../../lib/store';

export const POST: APIRoute = async ({ params, request }) => {
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

  const member = getMember(memberId);
  if (!member || member.tree_id !== treeId) {
    return new Response(JSON.stringify({ error: 'Member not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  const contentType = request.headers.get('content-type') || '';

  let photoData: string | null = null;

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const file = formData.get('photo') as File | null;
    if (!file) {
      return new Response(JSON.stringify({ error: 'No photo file provided' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(JSON.stringify({ error: 'Invalid file type. Please upload an image (JPEG, PNG, GIF, WebP, or AVIF)' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      return new Response(JSON.stringify({ error: 'File too large. Maximum size is 5MB' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const buffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    photoData = `data:${file.type};base64,${base64}`;

  } else if (contentType.includes('application/json')) {
    try {
      const body = await request.json();
      if (!body.photo_data || !body.content_type) {
        return new Response(JSON.stringify({ error: 'photo_data and content_type are required for JSON upload' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      photoData = `data:${body.content_type};base64,${body.photo_data}`;
    } catch {
      return new Response(JSON.stringify({ error: 'Failed to parse JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
  } else {
    return new Response(JSON.stringify({ error: 'Content-Type must be multipart/form-data or application/json' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const updated = updateMember(memberId, { photo_data: photoData, profile_photo_url: photoData });
  return new Response(JSON.stringify({ url: photoData }), {
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

  const member = getMember(memberId);
  if (!member || member.tree_id !== treeId) {
    return new Response(JSON.stringify({ error: 'Member not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  updateMember(memberId, { photo_data: null, profile_photo_url: null });
  return new Response(null, { status: 204 });
};
