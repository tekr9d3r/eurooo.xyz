/**
 * Catches unmatched /api/* paths via the rewrite in vercel.json, so a mistyped
 * endpoint returns JSON instead of the single-page app's HTML shell.
 */

import { errorResult } from '../_lib/http.js';
import { createApiRoute } from '../_lib/vercel.js';

export default createApiRoute(async () =>
  errorResult(
    404,
    'NOT_FOUND',
    'Unknown endpoint. See https://www.eurooo.xyz/api/v1/openapi.json for the available endpoints.'
  )
);
