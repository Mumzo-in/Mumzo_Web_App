export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  body: string;
  verified: boolean;
  helpful: number;
}

export const seedReviews: Review[] = [
  {
    id: "r1",
    author: "Ananya R.",
    rating: 5,
    date: "12 Jul 2026",
    title: "Gentle and reliable",
    body: "Super soft on my newborn's skin and no rashes at all. Delivery was genuinely under 15 minutes!",
    verified: true,
    helpful: 24,
  },
  {
    id: "r2",
    author: "Sneha K.",
    rating: 4,
    date: "8 Jul 2026",
    title: "Good value",
    body: "Does the job well and the pack size is generous. Wish it came in a bigger box option.",
    verified: true,
    helpful: 11,
  },
  {
    id: "r3",
    author: "Priya M.",
    rating: 5,
    date: "2 Jul 2026",
    title: "My go-to now",
    body: "Have reordered three times. Quality is consistent and prices are fair.",
    verified: true,
    helpful: 7,
  },
  {
    id: "r4",
    author: "Divya S.",
    rating: 3,
    date: "28 Jun 2026",
    title: "Decent",
    body: "It's fine for everyday use but nothing extraordinary. Packaging could be sturdier.",
    verified: false,
    helpful: 2,
  },
];

export interface ReviewSummary {
  average: number;
  total: number;
  distribution: Record<number, number>;
}

export function reviewSummary(reviews: Review[]): ReviewSummary {
  const total = reviews.length;
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const r of reviews) {
    distribution[r.rating] += 1;
    sum += r.rating;
  }
  return {
    total,
    average: total > 0 ? Math.round((sum / total) * 10) / 10 : 0,
    distribution,
  };
}
