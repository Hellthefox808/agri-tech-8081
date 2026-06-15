import { NextResponse } from 'next/server';
import { checkRateLimit, handleRateLimitResponse } from '@/middleware/rateLimit';
import { validateBatchOnboard } from '@/middleware/validate';
import { getBatches, createBatch } from '@/controllers/batchController';

export async function GET(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  
  // Rate limit: 30 requests per minute
  if (checkRateLimit(ip, 'batches_get', 30, 60 * 1000)) {
    return handleRateLimitResponse();
  }

  try {
    return await getBatches();
  } catch (err) {
    console.error("GET batches error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  
  // Rate limit: 10 requests per minute (strict for creation)
  if (checkRateLimit(ip, 'batches_post', 10, 60 * 1000)) {
    return handleRateLimitResponse();
  }

  try {
    const payload = await req.json();
    
    // Strict input validation
    const validation = validateBatchOnboard(payload);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    return await createBatch(validation.data);
  } catch (err: any) {
    console.error("POST batches error:", err);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
