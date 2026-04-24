import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address');
  if (!address) return NextResponse.json({ found: false });

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
