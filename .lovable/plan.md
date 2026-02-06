

# Knowledge Hub Implementation Plan

## Overview

Add a lightweight, GEO-optimized blog/knowledge hub to eurooo.xyz using **static Markdown files**. This approach keeps the site fast, makes content easily crawlable by search engines and AI systems, and enables AI agents to publish posts via GitHub Pull Requests.

---

## Architecture

```text
How Content Flows from Markdown to Browser

[Markdown Files] --> [Vite Build] --> [Static HTML] --> [User Browser]
      |                    |                                    |
   src/content/       Build-time            Pre-rendered,
   blog/*.md          transformation        SEO-ready pages
```

**Key Benefits:**
- Zero runtime overhead (content baked into JavaScript bundle)
- Perfect for bots and AI crawlers (content in HTML, not fetched dynamically)
- No database needed
- Version controlled via Git
- AI agents can add posts via GitHub PRs

---

## File Structure

```text
src/
  content/
    blog/
      index.ts                 # Blog post registry + metadata
      what-are-eur-stablecoins.md
      eurc-vs-eurs-comparison.md
      defi-yield-strategies-europe.md
  components/
    blog/
      BlogCard.tsx             # Post preview card
      BlogList.tsx             # Grid of post cards
      BlogPost.tsx             # Full article renderer
      TableOfContents.tsx      # Auto-generated from headings
  pages/
    Blog.tsx                   # /blog listing page
    BlogArticle.tsx            # /blog/:slug article page
public/
  sitemap.xml                  # Add blog URLs
```

---

## Implementation Steps

### 1. Install Markdown Plugin

Add `vite-plugin-markdown` to enable importing `.md` files:

```json
// package.json (new dev dependency)
"vite-plugin-markdown": "^2.2.0"
```

Update Vite config to process Markdown:

```typescript
// vite.config.ts
import { Mode, plugin as mdPlugin } from 'vite-plugin-markdown';

export default defineConfig({
  plugins: [
    react(),
    mdPlugin({ mode: [Mode.HTML, Mode.TOC] }),
  ],
});
```

### 2. Create Blog Post Registry

A TypeScript file that lists all posts with metadata (used for listing page and SEO):

```typescript
// src/content/blog/index.ts
export interface BlogPost {
  slug: string;
  title: string;
  description: string;  // ~160 chars for meta description
  publishedAt: string;  // ISO date
  updatedAt?: string;
  author: string;
  tags: string[];
  readingTime: string;  // "5 min read"
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'what-are-eur-stablecoins',
    title: 'What Are EUR Stablecoins? A Complete Guide',
    description: 'Learn what Euro stablecoins are, how they work, and why they matter for European DeFi users.',
    publishedAt: '2026-02-06',
    author: 'eurooo.xyz',
    tags: ['education', 'stablecoins', 'EUR'],
    readingTime: '6 min read',
  },
  // More posts...
];
```

### 3. Sample Markdown Post Structure

Each post is a standalone `.md` file with frontmatter-style header comment:

```markdown
<!-- src/content/blog/what-are-eur-stablecoins.md -->

# What Are EUR Stablecoins? A Complete Guide

Euro stablecoins are cryptocurrencies designed to maintain a 1:1 peg with the Euro...

## Why EUR Stablecoins Matter

For European users, EUR stablecoins eliminate currency conversion fees...

## Top EUR Stablecoins by Market Cap

| Stablecoin | Issuer | Market Cap |
|------------|--------|------------|
| EURC | Circle | Largest |
| EURS | Stasis | Second |

## How to Earn Yield on EUR Stablecoins

You can deposit EUR stablecoins into DeFi protocols to earn yield...

## Key Takeaways

- EUR stablecoins are pegged 1:1 to the Euro
- They enable low-cost transfers and DeFi access
- eurooo.xyz helps you compare yield opportunities
```

### 4. Blog Listing Page

```typescript
// src/pages/Blog.tsx
import { blogPosts } from '@/content/blog';
import { BlogCard } from '@/components/blog/BlogCard';
import { SEO } from '@/components/SEO';

const blogListSchema = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'eurooo.xyz Knowledge Hub',
  description: 'Educational content about EUR stablecoins and DeFi',
  url: 'https://eurooo.xyz/blog',
};

export default function Blog() {
  return (
    <>
      <SEO
        title="Knowledge Hub"
        description="Learn about EUR stablecoins, DeFi yields, and European crypto."
        path="/blog"
        jsonLd={blogListSchema}
      />
      <Header />
      <main className="container py-12">
        <h1>Knowledge Hub</h1>
        <p>Educational content about EUR stablecoins and DeFi.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map(post => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
```

### 5. Article Page with JSON-LD Schema

```typescript
// src/pages/BlogArticle.tsx
import { useParams } from 'react-router-dom';
import { blogPosts } from '@/content/blog';
import { SEO } from '@/components/SEO';

export default function BlogArticle() {
  const { slug } = useParams();
  const post = blogPosts.find(p => p.slug === slug);
  
  // Dynamic import of markdown content
  const [content, setContent] = useState('');
  useEffect(() => {
    import(`@/content/blog/${slug}.md`).then(module => {
      setContent(module.html);
    });
  }, [slug]);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: {
      '@type': 'Organization',
      name: 'eurooo.xyz',
    },
    publisher: {
      '@type': 'Organization',
      name: 'eurooo.xyz',
      url: 'https://eurooo.xyz',
    },
    mainEntityOfPage: `https://eurooo.xyz/blog/${slug}`,
  };

  return (
    <>
      <SEO
        title={post.title}
        description={post.description}
        path={`/blog/${slug}`}
        type="article"
        jsonLd={articleSchema}
      />
      <article 
        className="prose prose-lg dark:prose-invert max-w-3xl mx-auto"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </>
  );
}
```

### 6. Enable Typography Plugin

Already installed (`@tailwindcss/typography`). Add prose classes for article styling:

```typescript
// tailwind.config.ts - add to plugins
plugins: [
  require("tailwindcss-animate"),
  require("@tailwindcss/typography"),
]
```

### 7. Add Routes

```typescript
// src/App.tsx - add new routes
const Blog = lazy(() => import('./pages/Blog'));
const BlogArticle = lazy(() => import('./pages/BlogArticle'));

<Route path="/blog" element={<Blog />} />
<Route path="/blog/:slug" element={<BlogArticle />} />
```

### 8. Update Header Navigation

Add "Learn" or "Knowledge Hub" link to the header alongside Market Stats.

### 9. Update Sitemap

Add blog index and individual article URLs:

```xml
<!-- public/sitemap.xml -->
<url>
  <loc>https://eurooo.xyz/blog</loc>
  <changefreq>weekly</changefreq>
  <priority>0.8</priority>
</url>
<url>
  <loc>https://eurooo.xyz/blog/what-are-eur-stablecoins</loc>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
```

---

## AI Agent Publishing Workflow

```text
How AI Agents Publish via GitHub

[AI Agent] --> [Create .md file] --> [Open PR] --> [You Review] --> [Merge] --> [Auto Deploy]
     |              |                    |              |               |
  Generates     Adds to           GitHub PR        Approve/Edit     Vercel/Lovable
  content     src/content/blog/    created          changes        rebuilds site
```

**Steps for AI Agent:**
1. Create a new `.md` file in `src/content/blog/`
2. Add entry to `src/content/blog/index.ts` registry
3. Open a Pull Request to your repository
4. You review and merge
5. Site automatically rebuilds with new content

This workflow ensures:
- Human review before publishing
- Full version history
- Easy rollback if needed
- No database or CMS required

---

## GEO Optimization Features

| Feature | Implementation | Benefit |
|---------|----------------|---------|
| Article Schema | JSON-LD on each post | AI systems can identify author, date, topic |
| Clean HTML | Markdown to HTML at build time | Bots see content immediately |
| Meta descriptions | Per-post SEO component | Accurate snippets in search/AI |
| Semantic headings | H1/H2/H3 in markdown | Clear content hierarchy |
| Internal linking | Links to /stats and /app | Shows site authority |
| Last updated dates | In article schema | Freshness signals |
| FAQ sections | Can add to posts | Rich snippet eligibility |

---

## File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `package.json` | Update | Add vite-plugin-markdown |
| `vite.config.ts` | Update | Configure markdown plugin |
| `tailwind.config.ts` | Update | Add typography plugin |
| `src/content/blog/index.ts` | Create | Post registry with metadata |
| `src/content/blog/*.md` | Create | Markdown content files (3 starter posts) |
| `src/components/blog/BlogCard.tsx` | Create | Post preview card component |
| `src/components/blog/BlogList.tsx` | Create | Grid layout for cards |
| `src/components/blog/BlogPost.tsx` | Create | Article content renderer |
| `src/pages/Blog.tsx` | Create | /blog listing page |
| `src/pages/BlogArticle.tsx` | Create | /blog/:slug article page |
| `src/App.tsx` | Update | Add blog routes |
| `src/components/Header.tsx` | Update | Add Knowledge Hub link |
| `public/sitemap.xml` | Update | Add blog URLs |

---

## Starter Content (3 Posts)

1. **What Are EUR Stablecoins?** - Beginner guide explaining Euro stablecoins
2. **EURC vs EURS: Which Should You Choose?** - Comparison of top EUR stablecoins
3. **How to Earn Yield on EUR Stablecoins** - Guide to DeFi yields for Europeans

Each post will include:
- Clear, quotable key facts
- Links to the /stats and /app pages
- FAQ section where relevant
- Proper semantic headings

