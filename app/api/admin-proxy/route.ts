import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { url, method, headers, body } = await req.json();

    const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // Construct new headers
    const newHeaders = new Headers(headers);
    if (serviceRoleKey) {
      newHeaders.set('apikey', serviceRoleKey);
      newHeaders.set('Authorization', `Bearer ${serviceRoleKey}`);
    }

    // Forward the request to Supabase
    const res = await fetch(url, {
      method,
      headers: newHeaders,
      body: body ? body : undefined
    });

    // We must remove content-encoding because Node's fetch automatically decompresses the body
    // but keeps the original headers, causing the client to try to decompress it again.
    const responseHeaders = new Headers(res.headers);
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');

    // Return the transparent response from Supabase
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
