import { NextResponse } from 'next/server';

const PLACE_ID = 'ChIJQUStiW2IAYQRuZZ9Ep1m3EQ';
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export const revalidate = 604800; // 1 week

export async function GET() {
  if (!API_KEY) return NextResponse.json({ reviews: [] });
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=reviews,rating,user_ratings_total&reviews_sort=newest&key=${API_KEY}`;
    const res = await fetch(url, { next: { revalidate: 604800, tags: ['google-reviews'] } });
    const data = await res.json();
    const result = data?.result;
    const reviews = (result?.reviews ?? [])
      .filter((r: any) => r.rating === 5 && r.text?.trim().split(/\s+/).length >= 10)
      .sort((a: any, b: any) => b.time - a.time)
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
