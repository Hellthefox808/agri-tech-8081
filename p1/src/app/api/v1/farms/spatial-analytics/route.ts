import { NextResponse } from 'next/server';
import { checkRateLimit, handleRateLimitResponse } from '@/middleware/rateLimit';
import { validateSpatialAnalyticsQuery } from '@/middleware/validate';
import { getSpatialAnalytics } from '@/controllers/farmController';

export async function GET(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';

  // Rate limit: 30 requests per minute
  if (checkRateLimit(ip, 'spatial_analytics_get', 30, 60 * 1000)) {
    return handleRateLimitResponse();
  }

  try {
    const { searchParams } = new URL(req.url);
    const validation = validateSpatialAnalyticsQuery(searchParams);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    return await getSpatialAnalytics(validation.data.fpo_id);
  } catch (err: any) {
    console.error("Spatial analytics endpoint failed:", err);
    return NextResponse.json({ error: "Failed to load spatial analytics" }, { status: 500 });
  }
}
