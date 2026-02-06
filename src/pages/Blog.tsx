import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { BlogCard } from '@/components/blog/BlogCard';
import { blogPosts } from '@/content/blog';
import { BookOpen } from 'lucide-react';

const blogListSchema = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'eurooo.xyz Knowledge Hub',
  description: 'Educational content about EUR stablecoins and DeFi yields for European crypto users.',
  url: 'https://eurooo.xyz/blog',
  publisher: {
    '@type': 'Organization',
    name: 'eurooo.xyz',
    url: 'https://eurooo.xyz',
  },
};

export default function Blog() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Knowledge Hub"
        description="Learn about EUR stablecoins, DeFi yields, and European crypto. Educational guides for earning yield on Euro stablecoins."
        path="/blog"
        jsonLd={blogListSchema}
      />
      <Header />
      <main className="container py-12 px-4">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Knowledge Hub
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Educational guides about EUR stablecoins, DeFi yields, and European crypto. 
            Learn how to maximize your Euro holdings in decentralized finance.
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {blogPosts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            Ready to start earning yield on your Euros?
          </p>
          <a
            href="/app"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Compare Live Yields
            <span>→</span>
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
