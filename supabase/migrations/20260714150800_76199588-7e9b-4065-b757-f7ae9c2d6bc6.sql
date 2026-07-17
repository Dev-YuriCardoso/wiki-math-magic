
CREATE TABLE public.lan_clientes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  cpf TEXT,
  phone TEXT,
  address TEXT,
  age INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lan_clientes TO anon, authenticated;
GRANT ALL ON public.lan_clientes TO service_role;
ALTER TABLE public.lan_clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lan_clientes public read" ON public.lan_clientes FOR SELECT USING (true);
CREATE POLICY "lan_clientes public insert" ON public.lan_clientes FOR INSERT WITH CHECK (true);
CREATE POLICY "lan_clientes public update" ON public.lan_clientes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "lan_clientes public delete" ON public.lan_clientes FOR DELETE USING (true);

CREATE TABLE public.lan_time_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  seller_id TEXT,
  minutes INTEGER NOT NULL,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  note TEXT,
  computer_id TEXT,
  payment_method TEXT,
  operation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lan_time_transactions TO anon, authenticated;
GRANT ALL ON public.lan_time_transactions TO service_role;
ALTER TABLE public.lan_time_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lan_tx public read" ON public.lan_time_transactions FOR SELECT USING (true);
CREATE POLICY "lan_tx public insert" ON public.lan_time_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "lan_tx public update" ON public.lan_time_transactions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "lan_tx public delete" ON public.lan_time_transactions FOR DELETE USING (true);
