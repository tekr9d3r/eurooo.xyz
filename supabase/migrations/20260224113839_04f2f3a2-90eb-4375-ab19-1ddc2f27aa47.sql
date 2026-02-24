
-- Table to store protocol APY/TVL snapshots from DeFi Llama
CREATE TABLE public.protocol_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pool_key TEXT NOT NULL, -- our internal key e.g. 'aaveEthereum', 'morphoGauntlet'
  apy NUMERIC NOT NULL,
  tvl NUMERIC NOT NULL,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookups by pool_key + time
CREATE INDEX idx_protocol_snapshots_pool_key_fetched ON public.protocol_snapshots (pool_key, fetched_at DESC);

-- Enable RLS (public read, no public write)
ALTER TABLE public.protocol_snapshots ENABLE ROW LEVEL SECURITY;

-- Anyone can read snapshots (public data)
CREATE POLICY "Anyone can read protocol snapshots"
  ON public.protocol_snapshots
  FOR SELECT
  USING (true);

-- Only service role can insert (edge function uses service role)
-- No insert policy needed for anon - edge function uses service_role key

-- Clean up old data: keep only last 30 days
-- We'll handle cleanup in the edge function
