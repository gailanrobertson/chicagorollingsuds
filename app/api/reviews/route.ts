import { NextResponse } from 'next/server';

const PLACE_ID = 'ChIJQUStiW2IAYQRuZZ9Ep1m3EQ';
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export async function GET() {
  if (!API_KEY) return NextResponse.json({ reviews: [] });
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=reviews,rating,user_ratings_total&key=${API_KEY}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();
    const result = data?.result;
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
