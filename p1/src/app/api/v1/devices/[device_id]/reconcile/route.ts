import { NextResponse } from 'next/server';
import { checkRateLimit, handleRateLimitResponse } from '@/middleware/rateLimit';
import { validateReconcile } from '@/middleware/validate';
import { reconcileTelemetry } from '@/controllers/deviceController';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ device_id: string }> }
) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  
  // Rate limit: 60 requests per minute
  if (checkRateLimit(ip, 'reconcile_post', 60, 60 * 1000)) {
    return handleRateLimitResponse();
  }

  try {
    const { device_id } = await params;
    
    // Validate device_id parameter (alphanumeric and dashes/underscores allowed, max 50 chars)
    const deviceIdRegex = /^[a-zA-Z0-9-_]+$/;
    if (!device_id || device_id.length > 50 || !deviceIdRegex.test(device_id)) {
      return NextResponse.json({ error: "Invalid device_id format" }, { status: 400 });
    }

    const payload = await req.json();
    
    // Strict input validation (LDoS protection)
    const validation = validateReconcile(payload);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    return await reconcileTelemetry(device_id, validation.data);
  } catch (err: any) {
    console.error("Reconcile error:", err);
    return NextResponse.json({ error: err.message || "Failed to reconcile telemetry" }, { status: 500 });
  }
}
