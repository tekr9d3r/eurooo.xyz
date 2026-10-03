import { handleYieldsList } from '../_lib/handlers';
import { createApiRoute } from '../_lib/vercel';

export default createApiRoute((query, ctx) => handleYieldsList(query, ctx));
