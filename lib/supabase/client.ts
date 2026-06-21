import { createBrowserClient } from '@supabase/ssr'

// Browser client. It MUST only ever use the public anon key.
// All privileged (service-role) operations are performed exclusively on the
// server via Server Actions / Route Handlers using SUPABASE_SERVICE_ROLE_KEY,
// so the service role key is never shipped to the browser. Row Level Security
// enforces per-user access for anon-key requests.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
