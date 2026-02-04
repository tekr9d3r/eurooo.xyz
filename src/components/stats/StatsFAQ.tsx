import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { EURStablecoin, ChainBreakdown } from '@/hooks/useStablecoinStats';

interface StatsFAQProps {
  totalSupply: number | null;
  stablecoins: EURStablecoin[];
  chains: ChainBreakdown[];
  isLoading: boolean;
}

function formatSupply(value: number): string {
  if (value >= 1_000_000_000) {
    return `€${(value / 1_000_000_000).toFixed(2)} billion`;
  }
  if (value >= 1_000_000) {
    return `€${(value / 1_000_000).toFixed(2)} million`;
  }
  return `€${value.toLocaleString()}`;
}

interface FAQItem {
  question: string;
  answer: string;
}

export function StatsFAQ({ totalSupply, stablecoins, chains, isLoading }: StatsFAQProps) {
  const leader = stablecoins[0];
  const topChains = chains.slice(0, 5).map(c => c.chain);

  const faqItems: FAQItem[] = [
    {
      question: 'What is the total EUR stablecoin market cap?',
      answer: totalSupply !== null
        ? `The total circulating supply of EUR-denominated stablecoins is ${formatSupply(totalSupply)}. This includes all Euro stablecoins tracked across multiple blockchains.`
        : 'Data is currently loading. Please check back shortly.',
    },
    {
      question: 'Which EUR stablecoin has the largest market share?',
      answer: leader
        ? `${leader.name} (${leader.symbol}) is the largest EUR stablecoin by market cap, with ${leader.marketShare.toFixed(1)}% market share and a circulating supply of ${formatSupply(leader.circulating)}.`
        : 'Data is currently loading. Please check back shortly.',
    },
    {
      question: 'What blockchains support EUR stablecoins?',
      answer: topChains.length > 0
        ? `EUR stablecoins are available on ${chains.length} blockchains. The most popular chains include ${topChains.join(', ')}.`
        : 'Data is currently loading. Please check back shortly.',
    },
    {
      question: 'How often is this data updated?',
      answer: 'This data is sourced from DefiLlama and updated in real-time. The page fetches the latest data every 30 minutes to ensure accuracy while maintaining performance.',
    },
  ];

  if (isLoading) {
    return (
      <section className="py-8">
        <div className="container px-4">
          <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <div className="container px-4">
        <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-4">
          {faqItems.map((item, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">{item.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.answer}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// Export FAQ schema generator for SEO
export function generateFAQSchema(
  totalSupply: number | null,
  stablecoins: EURStablecoin[],
  chains: ChainBreakdown[]
): object {
  const leader = stablecoins[0];
  const topChains = chains.slice(0, 5).map(c => c.chain);

  const formatSupplyText = (value: number): string => {
    if (value >= 1_000_000_000) {
      return `€${(value / 1_000_000_000).toFixed(2)} billion`;
    }
    if (value >= 1_000_000) {
      return `€${(value / 1_000_000).toFixed(2)} million`;
    }
    return `€${value.toLocaleString()}`;
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is the total EUR stablecoin market cap?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: totalSupply !== null
            ? `The total circulating supply of EUR-denominated stablecoins is ${formatSupplyText(totalSupply)}. This includes all Euro stablecoins tracked across multiple blockchains.`
            : 'Data is currently loading.',
        },
      },
      {
        '@type': 'Question',
        name: 'Which EUR stablecoin has the largest market share?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: leader
            ? `${leader.name} (${leader.symbol}) is the largest EUR stablecoin with ${leader.marketShare.toFixed(1)}% market share and a circulating supply of ${formatSupplyText(leader.circulating)}.`
            : 'Data is currently loading.',
        },
      },
      {
        '@type': 'Question',
        name: 'What blockchains support EUR stablecoins?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: topChains.length > 0
            ? `EUR stablecoins are available on ${chains.length} blockchains including ${topChains.join(', ')}.`
            : 'Data is currently loading.',
        },
      },
      {
        '@type': 'Question',
        name: 'How often is this data updated?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'This data is sourced from DefiLlama and updated in real-time. The page fetches the latest data every 30 minutes.',
        },
      },
    ],
  };
}
