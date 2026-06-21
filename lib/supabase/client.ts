import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  const isAdmin = typeof window !== 'undefined' && localStorage.getItem("admin_secret_token") === "authorized";
  const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (isAdmin && serviceRoleKey) {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey,
      {
        global: {
          fetch: async (url, options) => {
            const proxyUrl = '/api/admin-proxy';
            
            // Safely extract headers whether it's a Headers object or a plain object
            const rawHeaders: Record<string, string> = {};
            if (options?.headers) {
              if (options.headers instanceof Headers) {
                options.headers.forEach((value, key) => { rawHeaders[key] = value; });
              } else if (Array.isArray(options.headers)) {
                options.headers.forEach(([key, value]) => { rawHeaders[key] = value; });
              } else {
                Object.assign(rawHeaders, options.headers);
              }
            }

            return fetch(proxyUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                url: url.toString(),
                method: options?.method || 'GET',
                headers: rawHeaders,
                body: options?.body
              })
            });
          }
        }
      }
    );
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey
  );
}

// A dedicated client for admin actions to bypass createBrowserClient caching.
export function createAdminClient() {
  const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (serviceRoleKey) {
    if (typeof window !== 'undefined') {
      // In the browser, we must use our proxy because Supabase API blocks 
      // requests with the service_role key coming from a browser Origin.
      return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        anonKey,
        {
          global: {
            fetch: async (url, options) => {
              const proxyUrl = '/api/admin-proxy';
              
              const rawHeaders: Record<string, string> = {};
              if (options?.headers) {
                if (options.headers instanceof Headers) {
                  options.headers.forEach((value, key) => { rawHeaders[key] = value; });
                } else if (Array.isArray(options.headers)) {
                  options.headers.forEach(([key, value]) => { rawHeaders[key] = value; });
                } else {
                  Object.assign(rawHeaders, options.headers);
                }
              }

              return fetch(proxyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  url: url.toString(),
                  method: options?.method || 'GET',
                  headers: rawHeaders,
                  body: options?.body
                })
              });
            }
          }
        }
      );
    } else {
      // On the server, we can securely use the service role key directly.
      return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
      );
    }
  }

  // Fallback
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey
  );
}

