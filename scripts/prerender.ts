/**
 * Pre-render script for SEO optimization
 * 
 * This script runs after `vite build` and generates static HTML files
 * for each route with proper meta tags baked in for SEO.
 * 
 * Usage: node --loader ts-node/esm scripts/prerender.ts
 * Or with tsx: npx tsx scripts/prerender.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');

// SEO configuration
const SITE_URL = 'https://eurooo.xyz';
const SITE_NAME = 'eurooo.xyz';
const OG_IMAGE = 'https://eurooo.lovable.app/og-image.png';
const TWITTER_HANDLE = '@tekr0x';

// Blog posts data (mirrored from src/content/blog/index.ts)
interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  tags: string[];
  readingTime: string;
}

const blogPosts: BlogPost[] = [
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
    description: "Compare Circle's EURC and Stasis EURS—the two largest Euro stablecoins—by market cap, DeFi availability, and regulatory backing.",
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
  {
    slug: 'eur-stablecoin-vs-digital-euro',
    title: "EUR Stablecoin vs Digital Euro (CBDC): What's the Difference?",
    description: "Understand the key differences between private Euro stablecoins like EURC and the European Central Bank's upcoming digital euro.",
    publishedAt: '2026-02-06',
    author: 'eurooo.xyz',
    tags: ['comparison', 'CBDC', 'digital euro', 'regulation'],
    readingTime: '6 min read',
  },
  {
    slug: 'eurc-vs-eurs-vs-eurcv-comparison',
    title: 'EURC vs EURS vs EURCV: Which Euro Stablecoin is Best?',
    description: "Compare the top three Euro stablecoins—Circle's EURC, Stasis EURS, and SG Forge's EURCV—by liquidity, regulation, and DeFi integration.",
    publishedAt: '2026-02-06',
    author: 'eurooo.xyz',
    tags: ['comparison', 'EURC', 'EURS', 'EURCV', 'stablecoins'],
    readingTime: '7 min read',
  },
  {
    slug: 'is-eurc-mica-compliant',
    title: 'Is EURC MiCA Compliant? A Guide for EU Users',
    description: "Understand Circle's EURC regulatory status under MiCA, what it means for European users, and why compliance matters for stablecoin safety.",
    publishedAt: '2026-02-06',
    author: 'eurooo.xyz',
    tags: ['regulation', 'MiCA', 'EURC', 'compliance'],
    readingTime: '5 min read',
  },
];

// Static pages configuration
interface PageSEO {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
}

const staticPages: PageSEO[] = [
  {
    title: 'eurooo.xyz - Grow Your Euros in DeFi',
    description: 'Compare and deposit EURC stablecoins across trusted DeFi protocols. Simple, transparent yield for Europeans.',
    path: '/',
  },
  {
    title: 'DeFi Yields Dashboard',
    description: 'Compare live APY rates and deposit EUR stablecoins across Aave, Morpho, Summer.fi, and more.',
    path: '/app',
  },
  {
    title: 'EUR Stablecoin Stats',
    description: 'Track market cap, chain distribution, and trading data for Euro stablecoins like EURC, EURS, and EURCV.',
    path: '/stats',
  },
  {
    title: 'Knowledge Hub',
    description: 'Learn about EUR stablecoins, DeFi yield strategies, and the European crypto landscape.',
    path: '/blog',
  },
  {
    title: 'Terms of Service',
    description: 'Terms and conditions for using eurooo.xyz DeFi yield aggregator.',
    path: '/terms',
  },
];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateMetaTags(seo: PageSEO): string {
  const canonicalUrl = `${SITE_URL}${seo.path}`;
  const fullTitle = seo.path === '/' ? seo.title : `${seo.title} - ${SITE_NAME}`;

  return `<title>${escapeHtml(fullTitle)}</title>
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
}

function generateArticleJsonLd(post: BlogPost): string {
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

function generateWebsiteJsonLd(): string {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: 'Compare and deposit EURC stablecoins across trusted DeFi protocols. Simple, transparent yield for Europeans.',
  };

  return `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
}

function injectMetaIntoHtml(html: string, metaTags: string, jsonLd?: string): string {
  // Find the end of the existing meta tags section (before </head>)
  // Replace existing title, description, og, and twitter meta tags
  
  // Remove existing title tag
  let modifiedHtml = html.replace(/<title>.*?<\/title>/s, '');
  
  // Remove existing meta description
  modifiedHtml = modifiedHtml.replace(/<meta name="description"[^>]*>/g, '');
  
  // Remove existing og: tags
  modifiedHtml = modifiedHtml.replace(/<meta property="og:[^"]*"[^>]*>/g, '');
  
  // Remove existing twitter: tags
  modifiedHtml = modifiedHtml.replace(/<meta name="twitter:[^"]*"[^>]*>/g, '');
  
  // Remove existing canonical
  modifiedHtml = modifiedHtml.replace(/<link rel="canonical"[^>]*>/g, '');
  
  // Remove existing JSON-LD
  modifiedHtml = modifiedHtml.replace(/<script type="application\/ld\+json">.*?<\/script>/gs, '');
  
  // Insert new meta tags before </head>
  const headEndIndex = modifiedHtml.indexOf('</head>');
  if (headEndIndex === -1) {
    console.error('Could not find </head> tag');
    return html;
  }
  
  const newContent = `
    ${metaTags}
    ${jsonLd || ''}
  `;
  
  modifiedHtml = modifiedHtml.slice(0, headEndIndex) + newContent + modifiedHtml.slice(headEndIndex);
  
  // Clean up extra whitespace
  modifiedHtml = modifiedHtml.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return modifiedHtml;
}

function getOutputPath(routePath: string): string {
  if (routePath === '/') {
    return path.join(DIST_DIR, 'index.html');
  }
  
  // For routes like /blog/slug, create blog/slug.html
  const cleanPath = routePath.replace(/^\//, '');
  return path.join(DIST_DIR, `${cleanPath}.html`);
}

async function prerender() {
  console.log('🚀 Starting pre-rendering...\n');
  
  // Read the built index.html as template
  const indexHtmlPath = path.join(DIST_DIR, 'index.html');
  
  if (!fs.existsSync(indexHtmlPath)) {
    console.error('❌ dist/index.html not found. Run `vite build` first.');
    process.exit(1);
  }
  
  const templateHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
  let generatedCount = 0;
  
  // Generate static pages
  console.log('📄 Generating static pages...');
  for (const page of staticPages) {
    const metaTags = generateMetaTags(page);
    const jsonLd = page.path === '/' ? generateWebsiteJsonLd() : undefined;
    const html = injectMetaIntoHtml(templateHtml, metaTags, jsonLd);
    
    const outputPath = getOutputPath(page.path);
    const outputDir = path.dirname(outputPath);
    
    // Create directory if needed
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, html);
    console.log(`  ✓ ${page.path} → ${path.relative(DIST_DIR, outputPath)}`);
    generatedCount++;
  }
  
  // Generate blog article pages
  console.log('\n📚 Generating blog articles...');
  const blogDir = path.join(DIST_DIR, 'blog');
  if (!fs.existsSync(blogDir)) {
    fs.mkdirSync(blogDir, { recursive: true });
  }
  
  for (const post of blogPosts) {
    const pageSeo: PageSEO = {
      title: post.title,
      description: post.description,
      path: `/blog/${post.slug}`,
      type: 'article',
    };
    
    const metaTags = generateMetaTags(pageSeo);
    const jsonLd = generateArticleJsonLd(post);
    const html = injectMetaIntoHtml(templateHtml, metaTags, jsonLd);
    
    const outputPath = path.join(blogDir, `${post.slug}.html`);
    fs.writeFileSync(outputPath, html);
    console.log(`  ✓ /blog/${post.slug} → blog/${post.slug}.html`);
    generatedCount++;
  }
  
  console.log(`\n✅ Pre-rendering complete! Generated ${generatedCount} pages.`);
}

// Run the script
prerender().catch((error) => {
  console.error('❌ Pre-rendering failed:', error);
  process.exit(1);
});
