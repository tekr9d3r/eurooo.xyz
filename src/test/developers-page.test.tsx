import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';

import Developers from '@/pages/Developers';
import { YIELD_OPPORTUNITIES } from '@/lib/yields/registry';

function renderPage() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <Developers />
      </MemoryRouter>
    </HelmetProvider>
  );
}

describe('API documentation page', () => {
  it('renders without errors', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: 'Eurooo Yields API' })).toBeInTheDocument();
  });

  it('documents every endpoint', () => {
    renderPage();

    for (const path of [
      '/api/v1/yields',
      '/api/v1/yields/{id}',
      '/api/v1/yields/{id}/history',
      '/api/v1/assets',
      '/api/v1/status',
      '/api/v1/openapi.json',
    ]) {
      expect(screen.getByText(path), `${path} should be documented`).toBeInTheDocument();
    }
  });

  it('states the rate limit, freshness semantics and error codes', () => {
    renderPage();

    expect(screen.getByText(/120 requests per minute/)).toBeInTheDocument();
    expect(screen.getByText(/Snapshots are retained for 30 days/)).toBeInTheDocument();
    expect(screen.getByText(/429 RATE_LIMIT_EXCEEDED/)).toBeInTheDocument();
    expect(screen.getByText(/404 NOT_FOUND/)).toBeInTheDocument();
  });

  it('links to the live spec', () => {
    renderPage();

    const specLink = screen.getByRole('link', { name: /OpenAPI 3.0 spec/ });
    expect(specLink).toHaveAttribute('href', 'https://www.eurooo.xyz/api/v1/openapi.json');
  });

  it('reports the tracked opportunity count from the shared registry', () => {
    renderPage();

    expect(
      screen.getByText(new RegExp(`"total_tracked": ${YIELD_OPPORTUNITIES.length}`))
    ).toBeInTheDocument();
  });
});
