import { LiFiWidget, WidgetConfig } from '@lifi/widget';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { useTheme } from 'next-themes';
import { useMemo } from 'react';

const SwapPage = () => {
  const { resolvedTheme } = useTheme();

  const widgetConfig: WidgetConfig = useMemo(() => ({
    integrator: 'eurooo',
    fee: 0.01,
    variant: 'wide',
    subvariant: 'default',
    appearance: resolvedTheme === 'dark' ? 'dark' : 'light',
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
    feeConfig: {
      fee: 0.01,
      referrer: {
        evm: '0x5FfD23B1B0350debB17A2cB668929aC5f76d0E18',
        svm: '6xtfyyZNKcTQsuC5bEURb68ySSpQvNggEB8v1CfEdcMW',
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
        <LiFiWidget config={widgetConfig} integrator="eurooo" />
      </main>
      <Footer />
    </div>
  );
};

export default SwapPage;
