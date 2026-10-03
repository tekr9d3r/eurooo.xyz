import { handleAssets } from '../_lib/handlers.js';
import { createApiRoute } from '../_lib/vercel.js';

export default createApiRoute((_query, ctx) => handleAssets(ctx));
