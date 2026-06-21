import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Browser client. It MUST only ever use the public anon key.
// Row Level Security enforces per-user access for anon-key requests.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Privileged client that bypasses RLS using the service role key.
//
// SECURITY: This must only run on the server. The service role key is read from
// SUPABASE_SERVICE_ROLE_KEY (NO NEXT_PUBLIC_ prefix) so it is never bundled into
// client-side JavaScript. Callers must invoke this from Server Actions or Route
// Handlers (files marked "use server"). If it is ever reached in the browser we
// throw instead of leaking or proxying the key.
export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error(
      'createAdminClient() can only be used on the server. ' +
      'Call it from a Server Action or Route Handler, never from the browser.'
    );
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured on the server.');
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
