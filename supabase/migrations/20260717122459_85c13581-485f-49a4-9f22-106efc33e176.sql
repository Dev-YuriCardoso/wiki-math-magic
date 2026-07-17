
-- Atomic disconnect: save remaining minutes to client saldo, then free the PC
CREATE OR REPLACE FUNCTION public.lan_computer_disconnect_save_saldo(_computer_id text)
RETURNS public.lan_computers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.lan_computers;
  _elapsed integer;
  _used integer;
  _remaining integer;
  _user text;
BEGIN
  SELECT * INTO _row FROM public.lan_computers WHERE id = _computer_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'computer_not_found'; END IF;

  _user := _row.user_id;
  _elapsed := CASE
    WHEN _row.status = 'ativo' AND _row.timestamp_ultimo_inicio IS NOT NULL
      THEN public.lan_elapsed_minutes(_row.timestamp_ultimo_inicio)
    ELSE 0
  END;
  _used := LEAST(_row.tempo_comprado_minutos, _row.tempo_usado_minutos + _elapsed);
  _remaining := GREATEST(0, _row.tempo_comprado_minutos - _used);

  IF _user IS NOT NULL THEN
    UPDATE public.lan_clientes
       SET saldo_minutos = _remaining, updated_at = now()
     WHERE id = _user;
  END IF;

  UPDATE public.lan_computers
     SET tempo_usado_minutos = _used,
         status = 'livre',
         user_id = NULL,
         timestamp_ultimo_inicio = NULL
   WHERE id = _computer_id
   RETURNING * INTO _row;

  RETURN _row;
END;
$$;

-- Enable realtime for clients and time transactions so any device stays in sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.lan_clientes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lan_time_transactions;

-- Include full row data in DELETE realtime events so the UI can drop rows
ALTER TABLE public.lan_time_transactions REPLICA IDENTITY FULL;
ALTER TABLE public.lan_clientes REPLICA IDENTITY FULL;
