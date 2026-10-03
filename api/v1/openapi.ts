import { buildOpenApiDocument } from '../_lib/openapi.js';
import { CACHE_POLICY, jsonResult } from '../_lib/http.js';
import { createApiRoute } from '../_lib/vercel.js';

export default createApiRoute(async () =>
  jsonResult(buildOpenApiDocument(), CACHE_POLICY.static)
);
