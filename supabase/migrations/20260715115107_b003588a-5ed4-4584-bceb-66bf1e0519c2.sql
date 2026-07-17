CREATE OR REPLACE FUNCTION public.lan_elapsed_minutes(_last_started timestamp with time zone)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT GREATEST(0, CEIL(EXTRACT(EPOCH FROM (now() - _last_started)) / 60))::integer;
$$;