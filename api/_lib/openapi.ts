/**
 * OpenAPI description of the public yield API, served at /api/v1/openapi.json.
 *
 * Targets 3.0.3 because that is the version most widely accepted by API
 * tooling and by AI agent action loaders.
 */

import {
  DEFAULT_HISTORY_DAYS,
  DEFAULT_LIMIT,
  MAX_HISTORY_DAYS,
  MAX_LIMIT,
} from '../../src/lib/yields/service.js';
import { YIELD_OPPORTUNITIES } from '../../src/lib/yields/registry.js';
import { SNAPSHOT_RETENTION_DAYS } from './datasource.js';
import { DEFAULT_RATE_LIMIT } from './ratelimit.js';

const PUBLIC_BASE_URL = 'https://www.eurooo.xyz';

const KNOWN_IDS = YIELD_OPPORTUNITIES.map((o) => o.id);
const KNOWN_PROTOCOLS = [...new Set(YIELD_OPPORTUNITIES.map((o) => o.protocol))];
const KNOWN_CHAINS = [...new Set(YIELD_OPPORTUNITIES.map((o) => o.chain))];
const KNOWN_ASSETS = [...new Set(YIELD_OPPORTUNITIES.map((o) => o.asset))];

const META_SCHEMA = {
  type: 'object',
  required: ['source', 'as_of', 'api_version'],
  properties: {
    source: { type: 'string', enum: ['Eurooo'], description: 'Always "Eurooo".' },
    as_of: {
      type: 'string',
      format: 'date-time',
      description:
        'Timestamp of the underlying data, not of the response. Equals the newest snapshot time.',
    },
    api_version: { type: 'string', enum: ['v1'] },
    last_updated_at: {
      type: 'string',
      format: 'date-time',
      nullable: true,
      description: 'Newest snapshot timestamp, or null when no snapshot exists yet.',
    },
    total_tracked: {
      type: 'integer',
      description: 'Total opportunities Eurooo tracks, before filtering.',
    },
  },
} as const;

const PAGINATION_SCHEMA = {
  type: 'object',
  required: ['limit', 'offset', 'total'],
  properties: {
    limit: { type: 'integer' },
    offset: { type: 'integer' },
    total: {
      type: 'integer',
      description: 'Total records matching the filters, ignoring limit/offset.',
    },
  },
} as const;

const OPPORTUNITY_SCHEMA = {
  type: 'object',
  description:
    'A single EUR stablecoin yield opportunity. Every property is always present; a property is null when Eurooo has no value for it.',
  required: [
    'id',
    'source',
    'protocol',
    'name',
    'description',
    'asset',
    'asset_symbol',
    'chain',
    'chain_id',
    'strategy',
    'apy',
    'apy_7d',
    'apy_30d',
    'apy_change_pp',
    'tvl_usd',
    'tvl_change_pct',
    'url',
    'eurooo_url',
    'contract_address',
    'asset_address',
    'audit_url',
    'audit_provider',
    'data_origin',
    'updated_at',
    'previous_snapshot_at',
  ],
  properties: {
    id: {
      type: 'string',
      description: 'Stable identifier. Does not change while the opportunity exists.',
      example: 'aave-base',
      enum: KNOWN_IDS,
    },
    source: { type: 'string', enum: ['Eurooo'] },
    protocol: { type: 'string', example: 'Aave', enum: KNOWN_PROTOCOLS },
    name: {
      type: 'string',
      description: 'Name of the specific market or vault.',
      example: 'Aave V3 EURC',
    },
    description: { type: 'string', example: 'Leading lending protocol' },
    asset: { type: 'string', example: 'EURC', enum: KNOWN_ASSETS },
    asset_symbol: { type: 'string', description: 'Same value as asset.', example: 'EURC' },
    chain: { type: 'string', example: 'Base', enum: KNOWN_CHAINS },
    chain_id: {
      type: 'integer',
      nullable: true,
      description: 'EVM chain id, or null for non-EVM chains such as Solana.',
      example: 8453,
    },
    strategy: {
      type: 'string',
      enum: ['lending', 'vault'],
      description: 'lending = direct lending market; vault = curated or managed vault.',
    },
    apy: {
      type: 'number',
      description: 'Current annual percentage yield as a percentage. 4.82 means 4.82%.',
      example: 4.82,
    },
    apy_7d: {
      type: 'number',
      nullable: true,
      description:
        'Mean APY across snapshots from the trailing 7 days. Null when fewer than two snapshots exist in that window.',
      example: 4.61,
    },
    apy_30d: {
      type: 'number',
      nullable: true,
      description:
        'Mean APY across snapshots from the trailing 30 days. Null when fewer than two snapshots exist in that window.',
      example: 4.35,
    },
    apy_change_pp: {
      type: 'number',
      nullable: true,
      description:
        'Change in APY against the previous snapshot, in percentage points. Null when there is no previous snapshot.',
      example: -0.21,
    },
    tvl_usd: {
      type: 'integer',
      description:
        'Total value locked in USD, as reported by the upstream source. Not converted to EUR.',
      example: 12500000,
    },
    tvl_change_pct: {
      type: 'number',
      nullable: true,
      description: 'Percentage change in TVL against the previous snapshot.',
      example: 1.4,
    },
    url: {
      type: 'string',
      format: 'uri',
      description: 'The protocol page for this market or vault, where a deposit is made.',
    },
    eurooo_url: {
      type: 'string',
      format: 'uri',
      description: 'The Eurooo app page listing all tracked opportunities.',
    },
    contract_address: {
      type: 'string',
      nullable: true,
      description: 'Vault, market or receipt-token contract holding the deposit.',
    },
    asset_address: {
      type: 'string',
      nullable: true,
      description: 'Underlying stablecoin token contract on this chain.',
    },
    audit_url: { type: 'string', format: 'uri', nullable: true },
    audit_provider: { type: 'string', nullable: true },
    data_origin: {
      type: 'string',
      enum: ['snapshot', 'fallback'],
      description:
        'snapshot = from Eurooo\'s stored upstream snapshot. fallback = a value Eurooo maintains directly because the pool is not available upstream.',
    },
    updated_at: {
      type: 'string',
      format: 'date-time',
      description: 'When this record\'s APY and TVL were last refreshed.',
    },
    previous_snapshot_at: {
      type: 'string',
      format: 'date-time',
      nullable: true,
      description: 'Timestamp the change fields are measured against.',
    },
  },
} as const;

const HISTORY_POINT_SCHEMA = {
  type: 'object',
  required: ['timestamp', 'apy', 'tvl_usd'],
  properties: {
    timestamp: { type: 'string', format: 'date-time' },
    apy: { type: 'number', example: 4.21 },
    tvl_usd: { type: 'integer', example: 11200000 },
  },
} as const;

const ERROR_SCHEMA = {
  type: 'object',
  required: ['error'],
  properties: {
    error: {
      type: 'object',
      required: ['code', 'message'],
      properties: {
        code: {
          type: 'string',
          enum: [
            'INVALID_PARAMETER',
            'NOT_FOUND',
            'METHOD_NOT_ALLOWED',
            'RATE_LIMIT_EXCEEDED',
            'CONFIGURATION_ERROR',
            'UPSTREAM_ERROR',
            'INTERNAL_ERROR',
          ],
        },
        message: { type: 'string' },
        parameter: {
          type: 'string',
          description: 'The offending query parameter, on INVALID_PARAMETER only.',
        },
        id: { type: 'string', description: 'The requested id, on NOT_FOUND only.' },
        retry_after_seconds: {
          type: 'integer',
          description: 'On RATE_LIMIT_EXCEEDED only.',
        },
        upstream_status: {
          type: 'integer',
          description:
            'The status the yield database returned, on UPSTREAM_ERROR only. 0 means the request could not be sent at all.',
        },
        variables: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Names (never values) of the misconfigured environment variables, on CONFIGURATION_ERROR only.',
        },
      },
    },
  },
} as const;

const ERROR_RESPONSE = (description: string) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
});

const COMMON_ERRORS = {
  '429': ERROR_RESPONSE(`Rate limit exceeded (${DEFAULT_RATE_LIMIT} requests per minute per IP).`),
  '500': ERROR_RESPONSE('Internal error, or CONFIGURATION_ERROR if the API is misconfigured.'),
  '502': ERROR_RESPONSE('The yield database rejected the request or was unreachable.'),
};

export function buildOpenApiDocument(): Record<string, unknown> {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Eurooo Yields API',
      version: '1.0.0',
      description: [
        'Public, read-only API for EUR stablecoin yield opportunities tracked by Eurooo.',
        '',
        'Serves the same normalized data shown in the Eurooo app at https://www.eurooo.xyz/app.',
        'No authentication is required and no write operations exist.',
        '',
        `Freshness: APY and TVL come from periodic snapshots. Every response carries meta.as_of, the timestamp of the underlying data rather than of the response. Snapshot history is retained for ${SNAPSHOT_RETENTION_DAYS} days.`,
        '',
        `Rate limit: ${DEFAULT_RATE_LIMIT} requests per minute per client IP. Responses include X-RateLimit-Limit, X-RateLimit-Remaining and X-RateLimit-Reset; a 429 also includes Retry-After.`,
        '',
        'TVL is reported in USD by the upstream data source and is passed through unconverted, hence tvl_usd.',
      ].join('\n'),
      contact: { name: 'Eurooo', url: PUBLIC_BASE_URL },
      license: { name: 'Data provided by Eurooo', url: `${PUBLIC_BASE_URL}/terms` },
    },
    servers: [{ url: PUBLIC_BASE_URL, description: 'Production' }],
    tags: [
      { name: 'yields', description: 'Current and historical yield data' },
      { name: 'reference', description: 'Tracked assets and service status' },
    ],
    paths: {
      '/api/v1/yields': {
        get: {
          tags: ['yields'],
          operationId: 'listYields',
          summary: 'List current EUR stablecoin yield opportunities',
          description:
            'Returns all currently tracked opportunities, sorted by APY descending with id as a tiebreaker so pagination is stable.',
          parameters: [
            {
              name: 'asset',
              in: 'query',
              description: 'Filter by stablecoin symbol. Case-insensitive.',
              required: false,
              schema: { type: 'string', enum: KNOWN_ASSETS },
              example: 'EURC',
            },
            {
              name: 'chain',
              in: 'query',
              description: 'Filter by blockchain name. Case-insensitive.',
              required: false,
              schema: { type: 'string', enum: KNOWN_CHAINS },
              example: 'Base',
            },
            {
              name: 'protocol',
              in: 'query',
              description: 'Filter by protocol name. Case-insensitive.',
              required: false,
              schema: { type: 'string', enum: KNOWN_PROTOCOLS },
              example: 'Aave',
            },
            {
              name: 'strategy',
              in: 'query',
              description: 'Filter by strategy type.',
              required: false,
              schema: { type: 'string', enum: ['lending', 'vault'] },
            },
            {
              name: 'min_apy',
              in: 'query',
              description: 'Minimum APY as a percentage.',
              required: false,
              schema: { type: 'number' },
              example: 3,
            },
            {
              name: 'max_apy',
              in: 'query',
              description: 'Maximum APY as a percentage.',
              required: false,
              schema: { type: 'number' },
            },
            {
              name: 'min_tvl_usd',
              in: 'query',
              description: 'Minimum TVL in USD.',
              required: false,
              schema: { type: 'number' },
              example: 1000000,
            },
            {
              name: 'limit',
              in: 'query',
              description: `Maximum records to return. Default ${DEFAULT_LIMIT}.`,
              required: false,
              schema: { type: 'integer', minimum: 1, maximum: MAX_LIMIT, default: DEFAULT_LIMIT },
            },
            {
              name: 'offset',
              in: 'query',
              description: 'Records to skip, for pagination.',
              required: false,
              schema: { type: 'integer', minimum: 0, default: 0 },
            },
          ],
          responses: {
            '200': {
              description: 'Matching yield opportunities.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['data', 'pagination', 'meta'],
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/YieldOpportunity' },
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' },
                      meta: { $ref: '#/components/schemas/Meta' },
                    },
                  },
                },
              },
            },
            '400': ERROR_RESPONSE('Invalid query parameter.'),
            ...COMMON_ERRORS,
          },
        },
      },
      '/api/v1/yields/{id}': {
        get: {
          tags: ['yields'],
          operationId: 'getYield',
          summary: 'Get one yield opportunity',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Stable opportunity id.',
              schema: { type: 'string', enum: KNOWN_IDS },
              example: 'aave-base',
            },
          ],
          responses: {
            '200': {
              description: 'The complete current record.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['data', 'meta'],
                    properties: {
                      data: { $ref: '#/components/schemas/YieldOpportunity' },
                      meta: { $ref: '#/components/schemas/Meta' },
                    },
                  },
                },
              },
            },
            '404': ERROR_RESPONSE('No opportunity with that id.'),
            ...COMMON_ERRORS,
          },
        },
      },
      '/api/v1/yields/{id}/history': {
        get: {
          tags: ['yields'],
          operationId: 'getYieldHistory',
          summary: 'Get historical APY and TVL for one opportunity',
          description: [
            'Returns stored snapshots in ascending time order.',
            `Snapshots are retained for ${SNAPSHOT_RETENTION_DAYS} days, so longer ranges return only what is retained.`,
            'Opportunities whose data_origin is "fallback" have no stored history and return an empty array.',
          ].join(' '),
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', enum: KNOWN_IDS },
              example: 'aave-base',
            },
            {
              name: 'days',
              in: 'query',
              description: `Days of history, counting back from now. Default ${DEFAULT_HISTORY_DAYS}. Ignored when from or to is supplied.`,
              required: false,
              schema: {
                type: 'integer',
                minimum: 1,
                maximum: MAX_HISTORY_DAYS,
                default: DEFAULT_HISTORY_DAYS,
              },
            },
            {
              name: 'from',
              in: 'query',
              description: 'ISO 8601 start timestamp, inclusive.',
              required: false,
              schema: { type: 'string', format: 'date-time' },
            },
            {
              name: 'to',
              in: 'query',
              description: 'ISO 8601 end timestamp, inclusive. Defaults to now.',
              required: false,
              schema: { type: 'string', format: 'date-time' },
            },
          ],
          responses: {
            '200': {
              description: 'Historical data points.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['data', 'meta'],
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/HistoryPoint' },
                      },
                      meta: { $ref: '#/components/schemas/Meta' },
                    },
                  },
                },
              },
            },
            '400': ERROR_RESPONSE('Invalid range parameter.'),
            '404': ERROR_RESPONSE('No opportunity with that id.'),
            ...COMMON_ERRORS,
          },
        },
      },
      '/api/v1/assets': {
        get: {
          tags: ['reference'],
          operationId: 'listAssets',
          summary: 'List tracked EUR stablecoins',
          responses: {
            '200': {
              description: 'EUR stablecoins Eurooo currently tracks.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['data', 'pagination', 'meta'],
                    properties: {
                      data: { type: 'array', items: { $ref: '#/components/schemas/Asset' } },
                      pagination: { $ref: '#/components/schemas/Pagination' },
                      meta: { $ref: '#/components/schemas/Meta' },
                    },
                  },
                },
              },
            },
            ...COMMON_ERRORS,
          },
        },
      },
      '/api/v1/status': {
        get: {
          tags: ['reference'],
          operationId: 'getStatus',
          summary: 'Get API version and data freshness',
          responses: {
            '200': {
              description: 'Service and data freshness information.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['data', 'meta'],
                    properties: {
                      data: { $ref: '#/components/schemas/Status' },
                      meta: { $ref: '#/components/schemas/Meta' },
                    },
                  },
                },
              },
            },
            ...COMMON_ERRORS,
          },
        },
      },
      '/api/v1/openapi.json': {
        get: {
          tags: ['reference'],
          operationId: 'getOpenApiSpec',
          summary: 'This specification',
          responses: { '200': { description: 'The OpenAPI document.' } },
        },
      },
    },
    components: {
      schemas: {
        YieldOpportunity: OPPORTUNITY_SCHEMA,
        HistoryPoint: HISTORY_POINT_SCHEMA,
        Pagination: PAGINATION_SCHEMA,
        Meta: META_SCHEMA,
        Error: ERROR_SCHEMA,
        Asset: {
          type: 'object',
          required: ['symbol', 'asset_symbol', 'name', 'chains', 'opportunity_count'],
          properties: {
            symbol: { type: 'string', example: 'EURC', enum: KNOWN_ASSETS },
            asset_symbol: { type: 'string', description: 'Same value as symbol.' },
            name: { type: 'string', example: 'Circle Euro Coin' },
            chains: {
              type: 'array',
              items: { type: 'string' },
              description: 'Chains where Eurooo tracks at least one opportunity for this asset.',
            },
            opportunity_count: { type: 'integer' },
          },
        },
        Status: {
          type: 'object',
          required: [
            'source',
            'api_version',
            'status',
            'data_timestamp',
            'last_successful_update',
            'tracked_opportunities',
          ],
          properties: {
            source: { type: 'string', enum: ['Eurooo'] },
            api_version: { type: 'string', enum: ['v1'] },
            status: { type: 'string', enum: ['ok'] },
            data_timestamp: { type: 'string', format: 'date-time' },
            last_successful_update: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Null when no snapshot has been stored yet.',
            },
            previous_update: { type: 'string', format: 'date-time', nullable: true },
            tracked_opportunities: { type: 'integer' },
            pools_with_live_snapshots: { type: 'integer' },
            snapshot_retention_days: { type: 'integer' },
            rate_limit_per_minute: { type: 'integer' },
          },
        },
      },
    },
  };
}
