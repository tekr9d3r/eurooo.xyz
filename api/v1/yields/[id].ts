import { handleYieldById } from '../../_lib/handlers';
import { createApiRoute } from '../../_lib/vercel';

export default createApiRoute((query, ctx) => handleYieldById(query.id ?? '', ctx));
