import { BookOpen, ArrowRight } from 'lucide-react';
import { blogPosts } from '@/content/blog';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const BLOG_URL = 'https://blog.eurooo.xyz';

export function KnowledgeHubPreview() {
  // Get the 3 most recent articles
  const featuredPosts = blogPosts.slice(0, 3);

  return (
    <div className="mt-24 opacity-0 animate-fade-in-up animation-delay-500">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
          <BookOpen className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold sm:text-3xl mb-2">Knowledge Hub</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Learn about EUR stablecoins, DeFi yields, and European crypto
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 max-w-4xl mx-auto">
        {featuredPosts.map((post) => (
          <a key={post.slug} href={`${BLOG_URL}/${post.slug}`} className="group block">
            <Card className="h-full transition-all duration-300 hover:shadow-lg hover:border-primary/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {post.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <h3 className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h3>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {post.description}
                </p>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      <div className="text-center mt-6">
        <a
          href={BLOG_URL}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          View all articles
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
