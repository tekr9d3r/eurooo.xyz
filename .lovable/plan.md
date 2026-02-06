

# Separate Static Blog on blog.eurooo.xyz

## Overview

Create a dedicated static blog site at `blog.eurooo.xyz` using **Astro** - a modern static site generator specifically designed for content-heavy sites with excellent SEO out of the box.

## Why a Separate Blog?

| Current Setup | New Setup |
|---------------|-----------|
| Blog is part of React SPA | Blog is a standalone static site |
| JavaScript required to render | Pure HTML, zero JavaScript |
| SEO depends on pre-rendering scripts | SEO built-in from the start |
| Heavy bundle (wagmi, viem, wallet code) | Ultra-lightweight (~50KB total) |
| Complex hydration | No hydration needed |

## Why Astro?

Based on research, Astro is the best choice for this use case:

- **Zero JavaScript by default** - Pages are pure HTML unless you explicitly add interactivity
- **Built for content** - Native Markdown support with frontmatter
- **Perfect Lighthouse scores** - Typically 95-100 on all metrics
- **Native SEO features** - Sitemap, RSS, meta tags, JSON-LD all built-in
- **Easy migration** - Your existing Markdown files work with minimal changes

```text
Performance comparison:
+----------------+------------------+-------------------+
| Framework      | Build Time       | Runtime JS        |
+----------------+------------------+-------------------+
| Hugo           | Fastest (2s/10k) | Zero              |
| Astro          | Fast             | Zero (by default) |
| React SPA      | Slow             | 200KB+ bundle     |
+----------------+------------------+-------------------+
```

## New Project Structure

```text
blog.eurooo.xyz/
├── src/
│   ├── content/
│   │   └── blog/                    <- Your existing .md files
│   │       ├── what-are-eur-stablecoins.md
│   │       ├── eurc-vs-eurs-comparison.md
│   │       └── ...
│   ├── layouts/
│   │   ├── BaseLayout.astro         <- HTML shell, meta tags
│   │   └── BlogPost.astro           <- Article template
│   ├── pages/
│   │   ├── index.astro              <- Blog home (list all posts)
│   │   └── [slug].astro             <- Dynamic article pages
│   └── components/
│       ├── Header.astro
│       ├── Footer.astro
│       └── SEO.astro                <- Meta tags component
├── public/
│   ├── favicon.png
│   ├── og-image.png
│   └── robots.txt
├── astro.config.mjs
└── package.json
```

## SEO Features (Built-in)

### 1. Static HTML Output

Every page is pre-rendered at build time:

```text
dist/
├── index.html                           <- Blog listing
├── what-are-eur-stablecoins/
│   └── index.html                       <- Full article HTML
├── eurc-vs-eurs-comparison/
│   └── index.html
├── sitemap.xml                          <- Auto-generated
├── rss.xml                              <- Auto-generated
└── robots.txt
```

### 2. Per-Page Meta Tags

Each article gets its own complete `<head>` section baked into the HTML:

```text
<head>
  <title>What Are EUR Stablecoins? - eurooo.xyz</title>
  <meta name="description" content="Learn what Euro stablecoins are..." />
  <link rel="canonical" href="https://blog.eurooo.xyz/what-are-eur-stablecoins" />
  
  <!-- Open Graph -->
  <meta property="og:title" content="What Are EUR Stablecoins?" />
  <meta property="og:type" content="article" />
  ...
  
  <!-- JSON-LD -->
  <script type="application/ld+json">
    {"@context":"https://schema.org","@type":"Article",...}
  </script>
</head>
```

### 3. Auto-Generated Sitemap & RSS

Astro plugins automatically create:
- `/sitemap.xml` - for search engines
- `/rss.xml` - for feed readers

### 4. Optimized Images

Astro's built-in image component automatically:
- Converts to WebP/AVIF
- Generates responsive sizes
- Adds proper alt text
- Lazy loads below-the-fold images

## Migration Steps

### Step 1: Migrate Markdown Files

Your existing files need minimal changes. Add frontmatter:

**Before** (current):
```markdown
# What Are EUR Stablecoins?

Euro stablecoins are cryptocurrencies...
```

**After** (Astro format):
```markdown
---
title: "What Are EUR Stablecoins? A Complete Guide"
description: "Learn what Euro stablecoins are, how they work..."
publishedAt: 2026-02-06
author: "eurooo.xyz"
tags: ["education", "stablecoins", "EUR"]
---

# What Are EUR Stablecoins?

Euro stablecoins are cryptocurrencies...
```

### Step 2: Update Internal Links

Change links from `/app` to `https://eurooo.xyz/app`:

```markdown
<!-- Before -->
[Compare yields](/app)

<!-- After -->
[Compare yields](https://eurooo.xyz/app)
```

### Step 3: Connect Domain

Set up `blog.eurooo.xyz` subdomain:
- In your DNS: Add CNAME record for `blog` pointing to your Vercel deployment
- In Vercel: Add `blog.eurooo.xyz` as a custom domain for the new project

## Design Approach

### Lightweight & Fast

```text
Target metrics:
- Total page weight: < 50KB
- Time to First Byte: < 100ms
- Largest Contentful Paint: < 1s
- Zero layout shifts (CLS = 0)
```

### Minimal Styling

Use CSS only (no Tailwind if we want maximum lightness), or Tailwind with purge:

```text
Option A: Pure CSS (~5KB)
Option B: Tailwind (purged) (~10KB)
```

### Cross-Site Navigation

Header includes link back to main app:

```text
+----------------------------------------------------------+
|  📚 eurooo.xyz/blog              [Earn Yields →]  [🌙]  |
+----------------------------------------------------------+
```

## Integration with Main Site

### From Main Site (eurooo.xyz)

Update "Knowledge Hub" links to point to the new subdomain:
- Header nav: `/blog` → `https://blog.eurooo.xyz`
- Home page preview section: Links to `https://blog.eurooo.xyz/[slug]`
- Footer: Update blog link

### From Blog Site (blog.eurooo.xyz)

- "Earn Yields" CTA buttons link to `https://eurooo.xyz/app`
- Internal article links like `/app` become `https://eurooo.xyz/app`

## Hosting Options

Since this is a separate project, you have flexibility:

| Platform | Pros | Setup Effort |
|----------|------|--------------|
| Vercel | Same as main site, easy subdomain | Low |
| Cloudflare Pages | Fastest CDN, free tier | Medium |
| GitHub Pages | Free, reliable | Medium |
| Netlify | Easy, good free tier | Low |

## Implementation Timeline

1. **Create new Astro project** - Set up basic structure
2. **Build layouts** - Header, Footer, SEO component
3. **Migrate content** - Copy .md files, add frontmatter
4. **Style pages** - Minimal CSS for reading experience
5. **Configure SEO** - Sitemap, RSS, meta tags
6. **Deploy** - Set up subdomain routing
7. **Update main site** - Point blog links to new subdomain

## What Happens to Current Blog?

After migration:
- Remove `/blog` routes from main React app
- Remove blog components and pages
- Remove markdown files from main repo
- Redirect `/blog/*` to `blog.eurooo.xyz/*` (via Vercel)

## Summary

```text
+------------------+        +--------------------+
|  eurooo.xyz      |        |  blog.eurooo.xyz   |
|  (React SPA)     |  <-->  |  (Astro Static)    |
+------------------+        +--------------------+
| - /              |        | - / (article list) |
| - /app           |        | - /[slug] articles |
| - /stats         |        | - /sitemap.xml     |
| - /terms         |        | - /rss.xml         |
+------------------+        +--------------------+
     Heavy bundle               Ultra-light
     Wallet interactions        Pure reading
     Dynamic data               Static content
```

**Result**: Blog articles will be pure HTML, instantly readable by any crawler, with perfect SEO scores and sub-second load times.

