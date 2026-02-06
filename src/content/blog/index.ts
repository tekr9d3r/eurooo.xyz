export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  tags: string[];
  readingTime: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'what-are-eur-stablecoins',
    title: 'What Are EUR Stablecoins? A Complete Guide',
    description: 'Learn what Euro stablecoins are, how they work, and why they matter for European DeFi users seeking to avoid USD exposure.',
    publishedAt: '2026-02-06',
    author: 'eurooo.xyz',
    tags: ['education', 'stablecoins', 'EUR'],
    readingTime: '6 min read',
  },
  {
    slug: 'eurc-vs-eurs-comparison',
    title: 'EURC vs EURS: Which EUR Stablecoin Should You Choose?',
    description: 'Compare Circle\'s EURC and Stasis EURS—the two largest Euro stablecoins—by market cap, DeFi availability, and regulatory backing.',
    publishedAt: '2026-02-06',
    author: 'eurooo.xyz',
    tags: ['comparison', 'EURC', 'EURS', 'stablecoins'],
    readingTime: '5 min read',
  },
  {
    slug: 'defi-yield-strategies-europe',
    title: 'How to Earn Yield on EUR Stablecoins in DeFi',
    description: 'Discover the best DeFi protocols for earning yield on Euro stablecoins like EURC, including Aave, Morpho, and more.',
    publishedAt: '2026-02-06',
    author: 'eurooo.xyz',
    tags: ['DeFi', 'yield', 'strategies', 'EUR'],
    readingTime: '7 min read',
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  blogPosts.forEach((post) => post.tags.forEach((tag) => tags.add(tag)));
  return Array.from(tags).sort();
}
