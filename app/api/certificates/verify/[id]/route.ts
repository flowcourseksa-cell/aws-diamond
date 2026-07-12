import { NextRequest, NextResponse } from "next/server";
import { fetchCertificateById } from "@/lib/supabase/services/certificates";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const cert = await fetchCertificateById(resolvedParams.id);
  if (!cert) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(cert);
}
