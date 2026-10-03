import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

import {
  FALLBACK_POOL_DATA,
  getTrackedAssets,
  YIELD_OPPORTUNITIES,
} from '../../../src/lib/yields/registry';
import { buildOpenApiDocument } from '../openapi';

/** Reads a project file by its repo-relative path; vitest runs from the root. */
const readSource = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), 'utf8');

describe('yield registry', () => {
  it('exposes stable, unique ids', () => {
    // Ids are part of the public API contract: changing one breaks consumers.
    expect(YIELD_OPPORTUNITIES.map((o) => o.id)).toEqual([
      'aave-ethereum',
      'aave-base',
      'aave-gnosis',
      'aave-avalanche',
      'summer',
      'yo',
      'morpho-gauntlet',
      'morpho-prime',
      'morpho-kpk',
      'morpho-steakhouse-eurcv',
      'morpho-steakhouse-prime-instant',
      'morpho-moonwell',
      'morpho-steakhouse',
      'morpho-steakhouse-prime',
      'fluid',
      'moonwell',
      'etherfi',
      'jupiter',
    ]);
  });

  it('maps each opportunity to exactly one snapshot pool key', () => {
    const poolKeys = YIELD_OPPORTUNITIES.map((o) => o.poolKey);
    expect(new Set(poolKeys).size).toBe(poolKeys.length);
    expect(Object.keys(FALLBACK_POOL_DATA).sort()).toEqual([...poolKeys].sort());
  });

  it('carries complete, well-formed metadata', () => {
    for (const o of YIELD_OPPORTUNITIES) {
      expect(o.id, 'id is kebab-case').toMatch(/^[a-z0-9-]+$/);
      expect(o.protocol.length).toBeGreaterThan(0);
      expect(o.name.length).toBeGreaterThan(0);
      expect(o.chain.length).toBeGreaterThan(0);
      expect(o.url, `${o.id} url`).toMatch(/^https:\/\//);
      expect(['lending', 'vault']).toContain(o.strategy);
      expect(Number.isFinite(o.fallback.apy)).toBe(true);
      expect(o.fallback.apy).toBeGreaterThanOrEqual(0);
      expect(o.fallback.tvl).toBeGreaterThan(0);

      if (o.auditUrl) expect(o.auditUrl).toMatch(/^https:\/\//);
      // Solana is the only non-EVM chain tracked, so it is the only null chain id.
      if (o.chainId === null) expect(o.chain).toBe('Solana');
      else expect(Number.isInteger(o.chainId)).toBe(true);
      // EVM entries address a contract; the Solana entry has none recorded.
      if (o.contractAddress) expect(o.contractAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
      if (o.assetAddress) expect(o.assetAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
    }
  });

  it('derives tracked assets from the opportunity list', () => {
    const assets = getTrackedAssets();
    expect(assets.map((a) => a.symbol)).toEqual(['EURC', 'EURCV', 'EURe']);

    for (const asset of assets) {
      expect(asset.name.length).toBeGreaterThan(0);
      expect(asset.chains.length).toBeGreaterThan(0);
      expect(new Set(asset.chains).size).toBe(asset.chains.length);
    }
  });
});

describe('the API and the app share one source of truth', () => {
  it('has the app read its fallback values from the registry', () => {
    const hook = readSource('src/hooks/useDefiLlamaData.ts');

    expect(hook).toContain('FALLBACK_POOL_DATA');
    expect(hook).toContain('@/lib/yields/registry');
    // A reintroduced literal table here would let the app and API drift apart.
    expect(hook).not.toMatch(/aaveEthereum:\s*\{\s*apy:/);
  });

  it('covers every yield opportunity the app renders', () => {
    const source = readSource('src/hooks/useProtocolData.ts');

    const ids = [...source.matchAll(/^\s*id: '([a-z0-9-]+)',$/gm)].map((m) => m[1]);
    // 'aave' and 'morpho' are display-only groupings of the entries below them,
    // not opportunities in their own right, so the API does not expose them.
    const leafIds = ids.filter((id) => id !== 'aave' && id !== 'morpho');

    expect(leafIds.length).toBeGreaterThan(0);
    expect([...leafIds].sort()).toEqual([...YIELD_OPPORTUNITIES.map((o) => o.id)].sort());
  });

  it('points at the same protocol URLs the app links to', () => {
    const source = readSource('src/hooks/useProtocolData.ts');

    for (const o of YIELD_OPPORTUNITIES) {
      expect(source, `${o.id} url should match the app`).toContain(o.url);
    }
  });
});

describe('OpenAPI document', () => {
  const doc = buildOpenApiDocument() as {
    openapi: string;
    info: Record<string, unknown>;
    servers: Array<{ url: string }>;
    paths: Record<string, Record<string, { operationId: string; responses: Record<string, unknown> }>>;
    components: { schemas: Record<string, unknown> };
  };

  it('describes every published endpoint', () => {
    expect(doc.openapi).toBe('3.0.3');
    expect(Object.keys(doc.paths).sort()).toEqual([
      '/api/v1/assets',
      '/api/v1/openapi.json',
      '/api/v1/status',
      '/api/v1/yields',
      '/api/v1/yields/{id}',
      '/api/v1/yields/{id}/history',
    ]);
    expect(doc.servers[0].url).toBe('https://www.eurooo.xyz');
  });

  it('exposes only GET operations with unique operation ids', () => {
    const operationIds: string[] = [];

    for (const [path, methods] of Object.entries(doc.paths)) {
      expect(Object.keys(methods), `${path} should be read-only`).toEqual(['get']);
      operationIds.push(methods.get.operationId);
    }

    expect(new Set(operationIds).size).toBe(operationIds.length);
  });

  it('documents the error codes and rate limit', () => {
    const description = String(doc.info.description);
    expect(description).toContain('120 requests per minute');
    expect(description).toContain('meta.as_of');

    expect(doc.paths['/api/v1/yields'].get.responses['400']).toBeDefined();
    expect(doc.paths['/api/v1/yields'].get.responses['429']).toBeDefined();
    expect(doc.paths['/api/v1/yields/{id}'].get.responses['404']).toBeDefined();
  });

  it('resolves every internal $ref', () => {
    const refs = new Set<string>();
    const walk = (node: unknown) => {
      if (Array.isArray(node)) {
        node.forEach(walk);
        return;
      }
      if (node && typeof node === 'object') {
        for (const [key, value] of Object.entries(node)) {
          if (key === '$ref' && typeof value === 'string') refs.add(value);
          else walk(value);
        }
      }
    };
    walk(doc);

    expect(refs.size).toBeGreaterThan(0);
    for (const ref of refs) {
      const name = ref.replace('#/components/schemas/', '');
      expect(doc.components.schemas[name], `${ref} should exist`).toBeDefined();
    }
  });

  it('keeps the documented id enum in step with the registry', () => {
    const idParam = (
      doc.paths['/api/v1/yields/{id}'].get as unknown as {
        parameters: Array<{ name: string; schema: { enum?: string[] } }>;
      }
    ).parameters.find((p) => p.name === 'id');

    expect(idParam?.schema.enum).toEqual(YIELD_OPPORTUNITIES.map((o) => o.id));
  });

  it('serializes to JSON without losing anything', () => {
    expect(() => JSON.parse(JSON.stringify(doc))).not.toThrow();
    expect(JSON.parse(JSON.stringify(doc))).toEqual(doc);
  });
});
