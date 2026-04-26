import type { APIRoute } from 'astro';
import { getOrCreateUser, setCurrentUser } from '../../../lib/store';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const email = (formData.get('email') as string || '').trim().toLowerCase();

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Please enter a valid email address.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = getOrCreateUser(email);
    setCurrentUser(user);

    return new Response(JSON.stringify({ success: true, email }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Something went wrong.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};