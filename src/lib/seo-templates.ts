import { BlogPost } from '@/content/blog';

const SITE_URL = 'https://eurooo.xyz';
const SITE_NAME = 'eurooo.xyz';
const OG_IMAGE = 'https://eurooo.lovable.app/og-image.png';
const TWITTER_HANDLE = '@tekr0x';

export interface PageSEO {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
  publishedAt?: string;
  updatedAt?: string;
}

export function generateMetaTags(seo: PageSEO): string {
  const canonicalUrl = `${SITE_URL}${seo.path}`;
  const fullTitle = seo.path === '/' ? seo.title : `${seo.title} - ${SITE_NAME}`;

  let tags = `
    <title>${fullTitle}</title>
    <meta name="description" content="${escapeHtml(seo.description)}" />
    <meta name="author" content="${SITE_NAME}" />
    <link rel="canonical" href="${canonicalUrl}" />

    <meta property="og:title" content="${escapeHtml(fullTitle)}" />
    <meta property="og:description" content="${escapeHtml(seo.description)}" />
    <meta property="og:type" content="${seo.type || 'website'}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${OG_IMAGE}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="${SITE_NAME}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="${TWITTER_HANDLE}" />
    <meta name="twitter:title" content="${escapeHtml(fullTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(seo.description)}" />
    <meta name="twitter:image" content="${OG_IMAGE}" />`;

  return tags.trim();
}

export function generateArticleJsonLd(post: BlogPost): string {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${post.slug}`,
    },
    image: OG_IMAGE,
  };

  return `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
}

export function generateWebsiteJsonLd(): string {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: 'Compare and deposit EURC stablecoins across trusted DeFi protocols. Simple, transparent yield for Europeans.',
  };

  return `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Static page SEO definitions
export const staticPagesSEO: Record<string, PageSEO> = {
  '/': {
    title: 'eurooo.xyz - Grow Your Euros in DeFi',
    description: 'Compare and deposit EURC stablecoins across trusted DeFi protocols. Simple, transparent yield for Europeans.',
    path: '/',
  },
  '/app': {
    title: 'DeFi Yields Dashboard',
    description: 'Compare live APY rates and deposit EUR stablecoins across Aave, Morpho, Summer.fi, and more.',
    path: '/app',
  },
  '/stats': {
    title: 'EUR Stablecoin Stats',
    description: 'Track market cap, chain distribution, and trading data for Euro stablecoins like EURC, EURS, and EURCV.',
    path: '/stats',
  },
  '/blog': {
    title: 'Knowledge Hub',
    description: 'Learn about EUR stablecoins, DeFi yield strategies, and the European crypto landscape.',
    path: '/blog',
  },
  '/terms': {
    title: 'Terms of Service',
    description: 'Terms and conditions for using eurooo.xyz DeFi yield aggregator.',
    path: '/terms',
  },
};

export function getBlogPostSEO(post: BlogPost): PageSEO {
  return {
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    type: 'article',
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
  };
}
