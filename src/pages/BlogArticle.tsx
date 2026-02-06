import { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { getPostBySlug, blogPosts } from '@/content/blog';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPostBySlug(slug) : undefined;
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug || !post) return;

    setIsLoading(true);
    
    // Dynamic import of markdown content
    const loadContent = async () => {
      try {
        // Use a switch statement for static imports to work with Vite
        let module;
        switch (slug) {
          case 'what-are-eur-stablecoins':
            module = await import('@/content/blog/what-are-eur-stablecoins.md');
            break;
          case 'eurc-vs-eurs-comparison':
            module = await import('@/content/blog/eurc-vs-eurs-comparison.md');
            break;
          case 'defi-yield-strategies-europe':
            module = await import('@/content/blog/defi-yield-strategies-europe.md');
            break;
          default:
            throw new Error('Post not found');
        }
        setContent(module.html);
      } catch (error) {
        console.error('Failed to load blog post:', error);
        setContent('<p>Failed to load article content.</p>');
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [slug, post]);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

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
      url: 'https://eurooo.xyz',
    },
    publisher: {
      '@type': 'Organization',
      name: 'eurooo.xyz',
      url: 'https://eurooo.xyz',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://eurooo.xyz/blog/${slug}`,
    },
    image: 'https://eurooo.lovable.app/og-image.png',
  };

  // Find related posts (same tags, excluding current)
  const relatedPosts = blogPosts
    .filter((p) => p.slug !== slug && p.tags.some((tag) => post.tags.includes(tag)))
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={post.title}
        description={post.description}
        path={`/blog/${slug}`}
        type="article"
        jsonLd={articleSchema}
      />
      <Header />
      <main className="container py-8 px-4">
        {/* Back link */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Knowledge Hub
        </Link>

        {/* Article Header */}
        <header className="max-w-3xl mx-auto mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
            {post.title}
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            {post.description}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-b border-border pb-6">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {post.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {new Date(post.publishedAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {post.readingTime}
            </span>
          </div>
        </header>

        {/* Article Content */}
        {isLoading ? (
          <div className="max-w-3xl mx-auto flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <article
            className="prose prose-lg dark:prose-invert max-w-3xl mx-auto
              prose-headings:font-semibold prose-headings:tracking-tight
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-foreground
              prose-blockquote:border-primary prose-blockquote:bg-muted/50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
              prose-table:text-sm
              prose-th:bg-muted prose-th:px-4 prose-th:py-2
              prose-td:px-4 prose-td:py-2 prose-td:border-border
              prose-li:text-muted-foreground
              prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="max-w-3xl mx-auto mt-16 pt-8 border-t border-border">
            <h2 className="text-xl font-semibold mb-6">Related Articles</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.slug}
                  to={`/blog/${relatedPost.slug}`}
                  className="group p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <h3 className="font-medium group-hover:text-primary transition-colors mb-2">
                    {relatedPost.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {relatedPost.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="max-w-3xl mx-auto mt-12 p-6 rounded-lg bg-muted/50 text-center">
          <p className="text-muted-foreground mb-4">
            Ready to start earning yield on your EUR stablecoins?
          </p>
          <Link
            to="/app"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Compare Live Yields
            <span>→</span>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
