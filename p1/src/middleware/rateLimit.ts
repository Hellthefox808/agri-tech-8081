import { NextResponse } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

export function checkRateLimit(ip: string, limitKey: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const cacheKey = `${ip}:${limitKey}`;

  let record = rateLimitMap.get(cacheKey);
  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + windowMs };
    rateLimitMap.set(cacheKey, record);
    return false;
  }

  if (record.count >= maxRequests) {
    return true;
  }

  record.count += 1;
  return false;
}

export function handleRateLimitResponse() {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { 
      status: 429,
      headers: {
        'Retry-After': '60',
        'X-RateLimit-Limit': '10'
      }
    }
  );
}
