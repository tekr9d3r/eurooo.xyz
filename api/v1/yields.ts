import { handleYieldsList } from '../_lib/handlers.js';
import { createApiRoute } from '../_lib/vercel.js';

export default createApiRoute((query, ctx) => handleYieldsList(query, ctx));
