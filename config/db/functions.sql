
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



CREATE OR REPLACE FUNCTION previous_transaction(transactionId integer, generation integer)
    RETURNS INTEGER
    AS $$
    WITH RECURSIVE find_transaction(id, "previousTransactionId", generation) as (
        SELECT t.id, t."previousTransactionId", 0 FROM transaction as t where t.id = $1
        UNION ALL
        SELECT t.id, t."previousTransactionId", generation + 1
        FROM transaction t, find_transaction tt
        WHERE t.id = tt."previousTransactionId"
    )
    SELECT id from find_transaction t where generation = $2;
$$ LANGUAGE SQL;