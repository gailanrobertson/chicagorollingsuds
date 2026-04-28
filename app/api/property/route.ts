import { NextRequest, NextResponse } from 'next/server';

// Best-effort server-side rate limit (complements client-side sessionStorage check)
const ipAddressCounts = new Map<string, number>();
const ADDRESS_LIMIT = 2;

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address');
  if (!address) return NextResponse.json({ found: false });

  const ip = getClientIp(req);
  const count = ipAddressCounts.get(ip) || 0;
  if (count >= ADDRESS_LIMIT) {
    return NextResponse.json({ found: false, limitReached: true });
  }
  ipAddressCounts.set(ip, count + 1);

  try {
    const res = await fetch(
      `https://api.rentcast.io/v1/properties?address=${encodeURIComponent(address)}&limit=1`,
      { headers: { 'X-Api-Key': process.env.RENTCAST_API_KEY || '' } }
    );
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0 && data[0].squareFootage) {
      return NextResponse.json({ found: true, squareFootage: data[0].squareFootage });
    }
  } catch {
    // fall through to default
  }
  return NextResponse.json({ found: false });
}
