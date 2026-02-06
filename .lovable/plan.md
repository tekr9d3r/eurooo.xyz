
# Pre-rendering Plan for Knowledge Hub SEO

## Problem Summary

Currently, your blog articles use client-side rendering with `react-helmet-async`. When crawlers (Google, social media, AI engines) request a blog URL like `/blog/what-are-eur-stablecoins`, they receive the generic `index.html` with default meta tags, not the article-specific SEO data.

## Solution: Build-Time Pre-rendering

Generate static HTML files for each blog route during `vite build`. Each file will contain:
- Article-specific `<title>`, `<meta description>`, Open Graph, and Twitter Card tags
- JSON-LD structured data embedded in the HTML
- Full article content pre-rendered (no JavaScript required to see it)

## What Will Change

```text
Before (current):
  dist/
    index.html          <-- serves ALL routes with generic meta tags
    assets/

After (with pre-rendering):
  dist/
    index.html                              <-- homepage with its own meta
    app.html                                <-- app page
    stats.html                              <-- stats page
    blog.html                               <-- blog listing
    blog/
      what-are-eur-stablecoins.html        <-- full SEO for this article
      eurc-vs-eurs-comparison.html         <-- full SEO for this article
      defi-yield-strategies-europe.html    <-- ...
      eur-stablecoin-vs-digital-euro.html
      eurc-vs-eurs-vs-eurcv-comparison.html
      is-eurc-mica-compliant.html
    terms.html
    assets/
```

## Implementation Steps

### Step 1: Add vite-plugin-ssr-ssg Package

Install `vite-plugin-ssg` or a similar pre-rendering solution compatible with React and Vite.

### Step 2: Create Pre-render Script

Build a Node.js script (`scripts/prerender.ts`) that:
1. Reads all blog posts from `src/content/blog/index.ts`
2. For each route (including `/`, `/app`, `/stats`, `/blog`, `/terms`, and each blog article)
3. Renders the React app to HTML string using `react-dom/server`
4. Injects the correct meta tags into the HTML `<head>`
5. Writes the output to `dist/` with proper folder structure

### Step 3: Create SEO Template Generator

Build a utility that generates complete HTML `<head>` content for each page:
- Title and description
- Canonical URL
- Open Graph tags (og:title, og:description, og:image, etc.)
- Twitter Card tags
- JSON-LD structured data

### Step 4: Update Vite Config

Configure Vite to:
- Support the pre-rendering build step
- Handle the multi-page output structure

### Step 5: Update Vercel Config

Modify `vercel.json` to serve the pre-rendered static HTML files instead of always falling back to `index.html`:

```text
/blog/what-are-eur-stablecoins  -->  /blog/what-are-eur-stablecoins.html
/blog/eurc-vs-eurs-comparison   -->  /blog/eurc-vs-eurs-comparison.html
(all other routes)              -->  /index.html (SPA fallback)
```

### Step 6: Update Build Script

Modify `package.json` to run pre-rendering after the main Vite build:

```
"build": "vite build && node scripts/prerender.js"
```

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `scripts/prerender.ts` | Create | Node script to generate static HTML for each route |
| `src/lib/seo-templates.ts` | Create | Generates complete HTML head content for each page |
| `vite.config.ts` | Modify | Add SSR build configuration |
| `package.json` | Modify | Update build script to include pre-rendering step |
| `vercel.json` | Modify | Add routing rules for pre-rendered HTML files |

## Result

After implementation:
- Social media previews will show correct article titles, descriptions, and images
- Search engines will index full article content immediately
- AI engines (ChatGPT, Perplexity) will see rich structured data
- No changes to user experience (React still hydrates and handles navigation)

---

## Technical Details

### Pre-render Script Logic

```text
1. Import blogPosts from content/blog/index.ts
2. Import markdown content for each post
3. Define all routes to pre-render:
   - Static pages: /, /app, /stats, /blog, /terms
   - Dynamic pages: /blog/[slug] for each blog post
4. For each route:
   a. Generate complete HTML document with:
      - Correct <title> and meta tags in <head>
      - JSON-LD script tag
      - <div id="root"> with pre-rendered React content
      - Script tags for hydration
   b. Write to dist/[route].html
```

### SEO Meta Template Structure

For each blog article, the generated HTML will include:

```text
<head>
  <title>Article Title - eurooo.xyz</title>
  <meta name="description" content="Article description..." />
  <link rel="canonical" href="https://eurooo.xyz/blog/slug" />
  
  <!-- Open Graph -->
  <meta property="og:title" content="Article Title - eurooo.xyz" />
  <meta property="og:description" content="Article description..." />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="https://eurooo.xyz/blog/slug" />
  <meta property="og:image" content="https://eurooo.lovable.app/og-image.png" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Article Title - eurooo.xyz" />
  <meta name="twitter:description" content="Article description..." />
  
  <!-- JSON-LD -->
  <script type="application/ld+json">
    { "@context": "https://schema.org", "@type": "Article", ... }
  </script>
</head>
```

### Vercel Routing Updates

```text
vercel.json changes:
- Add specific rewrites for each pre-rendered blog article
- Keep SPA fallback for dynamic routes (like /app with wallet interactions)
- Static files served directly without rewriting
```

## Benefits

- Zero runtime cost (all rendering happens at build time)
- Perfect SEO scores for blog content
- Social sharing works correctly
- AI engines can quote your content
- No server required (still fully static hosting)
- Existing React functionality unchanged
