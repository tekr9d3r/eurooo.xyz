import { handleYieldHistory } from '../../../_lib/handlers';
import { createApiRoute } from '../../../_lib/vercel';

export default createApiRoute((query, ctx) => handleYieldHistory(query.id ?? '', query, ctx));
