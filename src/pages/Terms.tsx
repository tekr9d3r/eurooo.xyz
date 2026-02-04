import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SEO } from '@/components/SEO';

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Terms of Service"
        description="Terms and conditions for using eurooo.xyz DeFi aggregator."
        path="/terms"
      />
      <div className="container max-w-3xl py-12">
        <Button variant="ghost" asChild className="mb-8">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>

        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 2025</p>

        <div className="space-y-8">
          {/* Section 1 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Nature of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              eurooo.xyz ("Eurooo", "we", "our", or "us") provides a user interface that aggregates 
              and displays information from third-party decentralized finance (DeFi) protocols. 
              Eurooo is an <strong>interface only</strong> — we do not operate, control, or manage 
              any of the underlying protocols or smart contracts.
            </p>
          </section>

          <Separator />

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">2. Third-Party Protocols</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              When you deposit funds through our interface, you are depositing <strong>directly to 
              the selected third-party protocol</strong>. These protocols include, but are not limited to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
              <li>Aave</li>
              <li>Morpho</li>
              <li>Summer.fi</li>
              <li>YO</li>
              <li>Fluid</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Eurooo <strong>never takes custody</strong> of your assets. Your funds are held by the 
              respective protocol's smart contracts, not by Eurooo. Each protocol operates independently 
              and has its own terms of service, risks, and governance.
            </p>
          </section>

          <Separator />

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">3. Risk Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Using DeFi protocols involves significant risks. By using Eurooo, you acknowledge and 
              accept the following risks:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>
                <strong>Smart Contract Risk:</strong> Protocols may contain bugs, vulnerabilities, 
                or exploits that could result in partial or total loss of funds.
              </li>
              <li>
                <strong>Market Risk:</strong> The value of your deposits may fluctuate due to market 
                conditions, including but not limited to price volatility and liquidity constraints.
              </li>
              <li>
                <strong>Regulatory Risk:</strong> DeFi protocols may be subject to regulatory actions 
                in various jurisdictions that could affect your ability to access or withdraw funds.
              </li>
              <li>
                <strong>Protocol Risk:</strong> Third-party protocols may change their terms, 
                parameters, or operations without notice.
              </li>
              <li>
                <strong>No Guarantee of Returns:</strong> Past performance is not indicative of 
                future results. Displayed APY rates are estimates and may change at any time.
              </li>
            </ul>
          </section>

          <Separator />

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">4. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To the maximum extent permitted by applicable law:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>
                Eurooo is <strong>not responsible</strong> for any losses, damages, or claims arising 
                from your use of third-party protocols, including but not limited to protocol failures, 
                hacks, exploits, or smart contract vulnerabilities.
              </li>
              <li>
                We provide <strong>no warranty</strong> regarding the accuracy, completeness, or 
                timeliness of data displayed on our interface, including APY rates, balances, or 
                protocol information.
              </li>
              <li>
                You <strong>assume all risks</strong> associated with using DeFi protocols and 
                interacting with blockchain networks.
              </li>
              <li>
                Eurooo shall not be liable for any indirect, incidental, special, consequential, 
                or punitive damages.
              </li>
            </ul>
          </section>

          <Separator />

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">5. User Acknowledgment</h2>
            <p className="text-muted-foreground leading-relaxed">
              By using Eurooo, you represent and warrant that:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-4">
              <li>
                You are solely responsible for conducting your own research and due diligence 
                before interacting with any DeFi protocol.
              </li>
              <li>
                You understand the risks of DeFi, including the potential for total loss of funds.
              </li>
              <li>
                You are not relying on Eurooo for investment, financial, legal, or tax advice.
              </li>
              <li>
                You are of legal age and have the legal capacity to enter into these terms in 
                your jurisdiction.
              </li>
              <li>
                You are not located in, or a citizen or resident of, any jurisdiction where 
                use of DeFi protocols is prohibited.
              </li>
            </ul>
          </section>

          <Separator />

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold mb-3">6. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about these terms, you can reach us on{' '}
              <a 
                href="https://x.com/tekr0x" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors"
              >
                X (Twitter)
              </a>{' '}
              or{' '}
              <a 
                href="https://t.me/+wxIKk-lsEy5kMGQ0" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors"
              >
                Telegram
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <Button variant="outline" asChild>
            <Link to="/app">Go to App</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Terms;
