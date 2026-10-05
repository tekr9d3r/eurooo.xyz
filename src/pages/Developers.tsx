import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SEO } from '@/components/SEO';
import { YIELD_OPPORTUNITIES } from '@/lib/yields/registry';

const BASE_URL = 'https://www.eurooo.xyz';

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border bg-secondary/40 p-4 text-xs leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

function Endpoint({
  method,
  path,
  children,
}: {
  method: string;
  path: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          {method}
        </span>
        <code className="break-all text-sm font-medium">{path}</code>
      </div>
      <div className="mt-3 space-y-3 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

function ParamList({ params }: { params: [string, string][] }) {
  return (
    <dl className="space-y-1.5">
      {params.map(([name, description]) => (
        <div key={name} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
          <dt className="shrink-0 sm:w-40">
            <code className="text-xs text-foreground">{name}</code>
          </dt>
          <dd className="text-xs">{description}</dd>
        </div>
      ))}
    </dl>
  );
}

const Developers = () => {
  const exampleIds = ['aave-base', 'morpho-gauntlet', 'etherfi'];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Yields API for Developers"
        description="Public, read-only JSON API for EUR stablecoin yield data from Eurooo. OpenAPI spec, endpoints, filters and rate limits."
        path="/developers"
      />
      <div className="container max-w-3xl py-12">
        <Button variant="ghost" asChild className="mb-8">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>

        <h1 className="text-3xl font-bold mb-2">Eurooo Yields API</h1>
        <p className="text-muted-foreground mb-6">
          A public, read-only JSON API for EUR stablecoin yield data. It serves the same
          normalized data shown in the{' '}
          <Link to="/app" className="underline hover:text-foreground">
            Eurooo app
          </Link>
          , so you never need to scrape the site.
        </p>

        <div className="flex flex-wrap gap-3 mb-10">
          <Button variant="outline" size="sm" asChild>
            <a href={`${BASE_URL}/api/v1/openapi.json`} target="_blank" rel="noopener noreferrer">
              OpenAPI 3.0 spec
              <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={`${BASE_URL}/api/v1/yields`} target="_blank" rel="noopener noreferrer">
              Try /yields
              <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
        </div>

        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-semibold mb-3">Basics</h2>
            <ParamList
              params={[
                ['Base URL', BASE_URL],
                ['Version', 'v1, carried in the path and in every response as meta.api_version'],
                ['Auth', 'None. All endpoints are public.'],
                ['Methods', 'GET only. The API is read-only.'],
                ['CORS', 'Cross-origin GET is allowed from any origin.'],
                ['Format', 'JSON only. All numbers are JSON numbers, never formatted strings.'],
                ['Timestamps', 'ISO 8601 in UTC, e.g. 2026-10-03T11:20:00Z'],
              ]}
            />
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-4">Endpoints</h2>
            <div className="space-y-4">
              <Endpoint method="GET" path="/api/v1/yields">
                <p>All current yield opportunities, highest APY first.</p>
                <ParamList
                  params={[
                    ['asset', 'Stablecoin symbol: EURC, EURe, EURCV. Case-insensitive.'],
                    ['chain', 'Blockchain name, e.g. Base, Ethereum, Gnosis, Optimism, Solana.'],
                    ['protocol', 'Protocol name, e.g. Aave, Morpho, Fluid.'],
                    ['strategy', 'lending or vault.'],
                    ['min_apy / max_apy', 'APY bounds as percentages, e.g. 3.5.'],
                    ['min_tvl_usd', 'Minimum TVL in USD.'],
                    ['limit', 'Default 50, maximum 200.'],
                    ['offset', 'Pagination offset. Sort order is stable.'],
                  ]}
                />
              </Endpoint>

              <Endpoint method="GET" path="/api/v1/yields/{id}">
                <p>
                  The complete current record for one opportunity. Ids are stable — for example{' '}
                  {exampleIds.map((id, i) => (
                    <span key={id}>
                      <code className="text-xs text-foreground">{id}</code>
                      {i < exampleIds.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                  . Returns 404 for an unknown id.
                </p>
              </Endpoint>

              <Endpoint method="GET" path="/api/v1/yields/{id}/history">
                <p>Stored APY and TVL snapshots for one opportunity, oldest first.</p>
                <ParamList
                  params={[
                    ['days', 'Days back from now. Default 30, maximum 365.'],
                    ['from', 'ISO 8601 start timestamp. Overrides days.'],
                    ['to', 'ISO 8601 end timestamp. Defaults to now.'],
                  ]}
                />
                <p>
                  Snapshots are retained for 30 days, so longer ranges return only what is
                  retained. Opportunities whose <code className="text-xs">data_origin</code> is{' '}
                  <code className="text-xs">fallback</code> have no stored history and return an
                  empty array.
                </p>
              </Endpoint>

              <Endpoint method="GET" path="/api/v1/assets">
                <p>The EUR stablecoins Eurooo currently tracks, with their chains and counts.</p>
              </Endpoint>

              <Endpoint method="GET" path="/api/v1/status">
                <p>
                  API version, current data timestamp, last successful data update, and the number
                  of tracked opportunities.
                </p>
              </Endpoint>

              <Endpoint method="GET" path="/api/v1/openapi.json">
                <p>The machine-readable OpenAPI 3.0 description of everything above.</p>
              </Endpoint>
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-3">Example request</h2>
            <Code>{`curl -s "${BASE_URL}/api/v1/yields?asset=EURC&chain=Base&limit=2"`}</Code>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Example response</h2>
            <Code>{`{
  "data": [
    {
      "id": "fluid",
      "source": "Eurooo",
      "protocol": "Fluid",
      "name": "Fluid EURC",
      "description": "Lending protocol by Instadapp",
      "asset": "EURC",
      "asset_symbol": "EURC",
      "chain": "Base",
      "chain_id": 8453,
      "strategy": "lending",
      "apy": 2.77,
      "apy_7d": 2.74,
      "apy_30d": 2.69,
      "apy_change_pp": 0.03,
      "tvl_usd": 2768000,
      "tvl_change_pct": 1.4,
      "url": "https://fluid.io/lending/8453/EURC",
      "eurooo_url": "${BASE_URL}/app",
      "contract_address": "0x1943FA26360f038230442525Cf1B9125b5DCB401",
      "asset_address": "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42",
      "audit_url": "https://fluid.guides.instadapp.io/liquidity-layer/risks",
      "audit_provider": "Instadapp Docs",
      "data_origin": "snapshot",
      "updated_at": "2026-10-03T11:00:00.000Z",
      "previous_snapshot_at": "2026-10-03T10:00:00.000Z"
    }
  ],
  "pagination": { "limit": 2, "offset": 0, "total": 9 },
  "meta": {
    "source": "Eurooo",
    "as_of": "2026-10-03T11:00:00.000Z",
    "api_version": "v1",
    "last_updated_at": "2026-10-03T11:00:00.000Z",
    "total_tracked": ${YIELD_OPPORTUNITIES.length}
  }
}`}</Code>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-3">Data freshness</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              APY and TVL come from periodic snapshots rather than a live read on every request.
              Every response carries <code className="text-xs">meta.as_of</code>, the timestamp of
              the underlying data — not of the response. Individual records also carry{' '}
              <code className="text-xs">updated_at</code>. Responses are cached at the edge for a
              few minutes, which never affects those timestamps.
            </p>
            <ParamList
              params={[
                [
                  'data_origin: snapshot',
                  'The value came from a stored snapshot of the upstream source.',
                ],
                [
                  'data_origin: fallback',
                  'The pool is not available upstream, so Eurooo maintains the value directly. Currently Jupiter and Ether.fi.',
                ],
                [
                  'tvl_usd',
                  'TVL is reported in USD by the upstream source and passed through unconverted.',
                ],
              ]}
            />
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-3">Rate limits</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              120 requests per minute per client IP. Every response includes{' '}
              <code className="text-xs">X-RateLimit-Limit</code>,{' '}
              <code className="text-xs">X-RateLimit-Remaining</code> and{' '}
              <code className="text-xs">X-RateLimit-Reset</code>. Exceeding the limit returns{' '}
              <code className="text-xs">429</code> with a{' '}
              <code className="text-xs">Retry-After</code> header. If you need a higher limit, get
              in touch.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-3">Errors</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Errors use standard status codes and a consistent body.
            </p>
            <Code>{`{
  "error": {
    "code": "NOT_FOUND",
    "message": "Yield opportunity not found"
  }
}`}</Code>
            <div className="mt-3">
              <ParamList
                params={[
                  ['400 INVALID_PARAMETER', 'A query parameter was malformed or out of range.'],
                  ['404 NOT_FOUND', 'Unknown opportunity id or endpoint.'],
                  ['405 METHOD_NOT_ALLOWED', 'The API is read-only; use GET.'],
                  ['429 RATE_LIMIT_EXCEEDED', 'Slow down and retry after Retry-After seconds.'],
                  ['500 INTERNAL_ERROR', 'Something failed on our side. Retry shortly.'],
                  ['500 CONFIGURATION_ERROR', 'The API is misconfigured. Not caused by your request.'],
                  [
                    '502 UPSTREAM_ERROR',
                    'Our yield database was unreachable. Includes upstream_status.',
                  ],
                ]}
              />
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-3">Terms of use</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The data is provided as-is for information only and is not financial advice. Please
              attribute Eurooo as the source when you redisplay it. Yields and TVL come from
              third-party protocols and upstream data providers; Eurooo does not operate those
              protocols. See our{' '}
              <Link to="/terms" className="underline hover:text-foreground">
                Terms of Service
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Developers;
