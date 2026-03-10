import { lazy, Suspense, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { useTheme } from 'next-themes';
import type { WidgetConfig } from '@lifi/widget';

const LiFiWidget = lazy(() =>
  import('@lifi/widget').then((module) => ({ default: module.LiFiWidget }))
);

const SwapPage = () => {
  const { resolvedTheme } = useTheme();

  const widgetConfig: WidgetConfig = useMemo(() => ({
    fee: 0.01,
    appearance: resolvedTheme === 'dark' ? 'dark' as const : 'light' as const,
    variant: 'wide' as const,
    theme: {
      container: {
        borderRadius: '12px',
      },
      palette: {
        primary: {
          main: resolvedTheme === 'dark' ? '#3366ff' : '#003399',
        },
        secondary: {
          main: '#FFCC00',
        },
      },
      shape: {
        borderRadius: 12,
        borderRadiusSecondary: 8,
      },
    },
  }), [resolvedTheme]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Swap & Bridge | eurooo.xyz"
        description="Swap and bridge tokens across chains with the best rates. Powered by Li.Fi."
        path="/swap"
      />
      <Header />
      <main className="container py-8 flex justify-center">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          }
        >
          <LiFiWidget integrator="eurooo" config={widgetConfig} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export default SwapPage;
