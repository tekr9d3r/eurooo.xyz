import { handleAssets } from '../_lib/handlers';
import { createApiRoute } from '../_lib/vercel';

export default createApiRoute((_query, ctx) => handleAssets(ctx));
