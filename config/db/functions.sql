
CREATE OR REPLACE FUNCTION reset_sequences()
RETURNS VOID
AS $$
DECLARE r record;
BEGIN
    FOR r IN SELECT c.relname FROM pg_class c WHERE c.relkind = 'S'
    LOOP
        PERFORM SETVAL(quote_ident(r.relname), 10000);
    END LOOP;
END
$$ LANGUAGE plpgsql;
