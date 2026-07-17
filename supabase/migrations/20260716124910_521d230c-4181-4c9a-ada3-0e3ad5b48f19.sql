
ALTER TABLE public.lan_clientes
  ADD COLUMN IF NOT EXISTS saldo_minutos integer NOT NULL DEFAULT 0;

-- Heartbeat: flush accumulated elapsed time of an active PC into tempo_usado
-- and reset timestamp_ultimo_inicio to now(). Called periodically by the client
-- so nothing is lost if the browser/PC dies.
CREATE OR REPLACE FUNCTION public.lan_computer_heartbeat(_computer_id text)
RETURNS public.lan_computers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.lan_computers;
  _elapsed integer;
BEGIN
  SELECT * INTO _row FROM public.lan_computers WHERE id = _computer_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'computer_not_found'; END IF;

  IF _row.status <> 'ativo' OR _row.timestamp_ultimo_inicio IS NULL THEN
    RETURN _row;
  END IF;

  _elapsed := public.lan_elapsed_minutes(_row.timestamp_ultimo_inicio);
  IF _elapsed <= 0 THEN RETURN _row; END IF;

  UPDATE public.lan_computers
     SET tempo_usado_minutos = LEAST(tempo_comprado_minutos, tempo_usado_minutos + _elapsed),
         timestamp_ultimo_inicio = now(),
         status = CASE
           WHEN LEAST(tempo_comprado_minutos, tempo_usado_minutos + _elapsed) >= tempo_comprado_minutos
             THEN 'pausado'
           ELSE 'ativo'
         END,
         timestamp_ultimo_inicio = CASE
           WHEN LEAST(tempo_comprado_minutos, tempo_usado_minutos + _elapsed) >= tempo_comprado_minutos
             THEN NULL
           ELSE now()
         END
   WHERE id = _computer_id
   RETURNING * INTO _row;

  RETURN _row;
END;
$$;

-- Extend assign so it can restore a previously saved saldo (in minutes) when
-- the same client sits down at any PC again.
CREATE OR REPLACE FUNCTION public.lan_computer_assign(
  _computer_id text,
  _user_id text,
  _initial_minutes integer DEFAULT 0
)
RETURNS public.lan_computers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.lan_computers;
  _minutes integer := GREATEST(0, COALESCE(_initial_minutes, 0));
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
         tempo_comprado_minutos = _minutes,
         tempo_usado_minutos = 0,
         timestamp_ultimo_inicio = NULL
   WHERE id = _computer_id
   RETURNING * INTO _row;

  IF NOT FOUND THEN RAISE EXCEPTION 'computer_not_found'; END IF;
  RETURN _row;
END;
$$;
