import { NextResponse } from 'next/server';

const SEARCH_NAME = 'Rolling Suds of Schaumburg Rosemont';
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

async function getPlaceId(): Promise<string | null> {
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(SEARCH_NAME)}&inputtype=textquery&fields=place_id&key=${API_KEY}`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  const data = await res.json();
  return data?.candidates?.[0]?.place_id ?? null;
}

async function getReviews(placeId: string) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${API_KEY}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  const data = await res.json();
  return data?.result ?? null;
}

export async function GET() {
  if (!API_KEY) return NextResponse.json({ reviews: [] });
  try {
    const placeId = await getPlaceId();
    if (!placeId) return NextResponse.json({ reviews: [] });
    const result = await getReviews(placeId);
    const reviews = (result?.reviews ?? [])
      .filter((r: any) => r.rating >= 4)
      .map((r: any) => ({
        author: r.author_name,
        rating: r.rating,
        text: r.text,
        time: r.relative_time_description,
      }));
    return NextResponse.json({ reviews, rating: result?.rating, total: result?.user_ratings_total });
  } catch {
    return NextResponse.json({ reviews: [] });
  }
}
