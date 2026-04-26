import { createServerClient as createSupabaseServerClient, parseCookieHeader } from '@supabase/ssr';
import type { AstroCookies } from '@astrojs/core/runtime';

export function createServerClient(context: { headers: Headers; cookies: AstroCookies }) {
  return createSupabaseServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(context.headers.get('cookie') ?? '');
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            context.cookies.set(name, value, options);
          });
        },
      },
    }
  );
}