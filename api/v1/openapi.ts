import { buildOpenApiDocument } from '../_lib/openapi';
import { CACHE_POLICY, jsonResult } from '../_lib/http';
import { createApiRoute } from '../_lib/vercel';

export default createApiRoute(async () =>
  jsonResult(buildOpenApiDocument(), CACHE_POLICY.static)
);
