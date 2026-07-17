CREATE TABLE IF NOT EXISTS public.lan_computers (
  id text PRIMARY KEY,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'livre' CHECK (status IN ('livre', 'ativo', 'pausado')),
  user_id text,
  tempo_comprado_minutos integer NOT NULL DEFAULT 0 CHECK (tempo_comprado_minutos >= 0),
  tempo_usado_minutos integer NOT NULL DEFAULT 0 CHECK (tempo_usado_minutos >= 0),
  timestamp_ultimo_inicio timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CHECK (tempo_usado_minutos <= tempo_comprado_minutos),
  CHECK ((status = 'ativo' AND timestamp_ultimo_inicio IS NOT NULL AND user_id IS NOT NULL) OR status <> 'ativo')
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lan_computers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lan_computers TO authenticated;
GRANT ALL ON public.lan_computers TO service_role;

ALTER TABLE public.lan_computers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lan_computers public read" ON public.lan_computers;
DROP POLICY IF EXISTS "lan_computers public insert" ON public.lan_computers;
DROP POLICY IF EXISTS "lan_computers public update" ON public.lan_computers;
DROP POLICY IF EXISTS "lan_computers public delete" ON public.lan_computers;

CREATE POLICY "lan_computers public read"
ON public.lan_computers
FOR SELECT
TO public
USING (true);

CREATE POLICY "lan_computers public insert"
ON public.lan_computers
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "lan_computers public update"
ON public.lan_computers
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "lan_computers public delete"
ON public.lan_computers
FOR DELETE
TO public
USING (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_lan_computers_updated_at ON public.lan_computers;
CREATE TRIGGER set_lan_computers_updated_at
BEFORE UPDATE ON public.lan_computers
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.lan_elapsed_minutes(_last_started timestamp with time zone)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (now() - _last_started)) / 60))::integer;
$$;

CREATE OR REPLACE FUNCTION public.lan_computer_start(_computer_id text)
RETURNS public.lan_computers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.lan_computers;
BEGIN
  SELECT * INTO _row
  FROM public.lan_computers
  WHERE id = _computer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'computer_not_found';
  END IF;

  IF _row.user_id IS NULL THEN
    RAISE EXCEPTION 'computer_without_player';
  END IF;

  IF _row.tempo_comprado_minutos <= _row.tempo_usado_minutos THEN
    UPDATE public.lan_computers
    SET status = 'pausado', timestamp_ultimo_inicio = NULL
    WHERE id = _computer_id
    RETURNING * INTO _row;
    RETURN _row;
  END IF;

  UPDATE public.lan_computers
  SET status = 'ativo',
      timestamp_ultimo_inicio = now()
  WHERE id = _computer_id
  RETURNING * INTO _row;

  RETURN _row;
END;
$$;

CREATE OR REPLACE FUNCTION public.lan_computer_pause(_computer_id text)
RETURNS public.lan_computers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.lan_computers;
  _elapsed integer;
BEGIN
  SELECT * INTO _row
  FROM public.lan_computers
  WHERE id = _computer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'computer_not_found';
  END IF;

  _elapsed := CASE
    WHEN _row.status = 'ativo' AND _row.timestamp_ultimo_inicio IS NOT NULL
      THEN public.lan_elapsed_minutes(_row.timestamp_ultimo_inicio)
    ELSE 0
  END;

  UPDATE public.lan_computers
  SET tempo_usado_minutos = LEAST(tempo_comprado_minutos, tempo_usado_minutos + _elapsed),
      status = 'pausado',
      timestamp_ultimo_inicio = NULL
  WHERE id = _computer_id
  RETURNING * INTO _row;

  RETURN _row;
END;
$$;

CREATE OR REPLACE FUNCTION public.lan_computer_disconnect(_computer_id text)
RETURNS public.lan_computers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.lan_computers;
  _elapsed integer;
BEGIN
  SELECT * INTO _row
  FROM public.lan_computers
  WHERE id = _computer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'computer_not_found';
  END IF;

  _elapsed := CASE
    WHEN _row.status = 'ativo' AND _row.timestamp_ultimo_inicio IS NOT NULL
      THEN public.lan_elapsed_minutes(_row.timestamp_ultimo_inicio)
    ELSE 0
  END;

  UPDATE public.lan_computers
  SET tempo_usado_minutos = LEAST(tempo_comprado_minutos, tempo_usado_minutos + _elapsed),
      status = 'livre',
      user_id = NULL,
      timestamp_ultimo_inicio = NULL
  WHERE id = _computer_id
  RETURNING * INTO _row;

  RETURN _row;
END;
$$;

CREATE OR REPLACE FUNCTION public.lan_computer_add_time(_computer_id text, _minutes integer)
RETURNS public.lan_computers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.lan_computers;
BEGIN
  IF _minutes <= 0 THEN
    RAISE EXCEPTION 'invalid_minutes';
  END IF;

  UPDATE public.lan_computers
  SET tempo_comprado_minutos = tempo_comprado_minutos + _minutes,
      status = CASE WHEN user_id IS NULL THEN 'livre' ELSE status END
  WHERE id = _computer_id
  RETURNING * INTO _row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'computer_not_found';
  END IF;

  RETURN _row;
END;
$$;

CREATE OR REPLACE FUNCTION public.lan_computer_remove_time(_computer_id text, _minutes integer)
RETURNS public.lan_computers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.lan_computers;
  _elapsed integer;
BEGIN
  IF _minutes <= 0 THEN
    RAISE EXCEPTION 'invalid_minutes';
  END IF;

  SELECT * INTO _row
  FROM public.lan_computers
  WHERE id = _computer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'computer_not_found';
  END IF;

  _elapsed := CASE
    WHEN _row.status = 'ativo' AND _row.timestamp_ultimo_inicio IS NOT NULL
      THEN public.lan_elapsed_minutes(_row.timestamp_ultimo_inicio)
    ELSE 0
  END;

  UPDATE public.lan_computers
  SET tempo_usado_minutos = LEAST(GREATEST(0, tempo_comprado_minutos - _minutes), tempo_usado_minutos + _elapsed),
      tempo_comprado_minutos = GREATEST(0, tempo_comprado_minutos - _minutes),
      timestamp_ultimo_inicio = CASE WHEN status = 'ativo' THEN now() ELSE NULL END,
      status = CASE
        WHEN GREATEST(0, tempo_comprado_minutos - _minutes) <= LEAST(GREATEST(0, tempo_comprado_minutos - _minutes), tempo_usado_minutos + _elapsed) THEN 'pausado'
        ELSE status
      END
  WHERE id = _computer_id
  RETURNING * INTO _row;

  RETURN _row;
END;
$$;

CREATE OR REPLACE FUNCTION public.lan_computer_assign(_computer_id text, _user_id text)
RETURNS public.lan_computers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.lan_computers;
BEGIN
  UPDATE public.lan_computers
  SET status = 'livre', user_id = NULL, timestamp_ultimo_inicio = NULL
  WHERE user_id = _user_id AND id <> _computer_id;

  UPDATE public.lan_computers
  SET status = 'livre', user_id = NULL, timestamp_ultimo_inicio = NULL
  WHERE id = _computer_id AND user_id IS NOT NULL AND user_id <> _user_id;

  UPDATE public.lan_computers
  SET user_id = _user_id,
      status = 'pausado',
      tempo_comprado_minutos = 0,
      tempo_usado_minutos = 0,
      timestamp_ultimo_inicio = NULL
  WHERE id = _computer_id
  RETURNING * INTO _row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'computer_not_found';
  END IF;

  RETURN _row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.lan_computer_start(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.lan_computer_pause(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.lan_computer_disconnect(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.lan_computer_add_time(text, integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.lan_computer_remove_time(text, integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.lan_computer_assign(text, text) TO anon, authenticated, service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'lan_computers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.lan_computers;
  END IF;
END $$;