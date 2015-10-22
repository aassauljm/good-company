
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



CREATE OR REPLACE FUNCTION previous_company_state(companyStateId integer, generation integer)
    RETURNS INTEGER
    AS $$
    WITH RECURSIVE find_state(id, "previousCompanyStateId", generation) as (
        SELECT t.id, t."previousCompanyStateId", 0 FROM companystate as t where t.id = $1
        UNION ALL
        SELECT t.id, t."previousCompanyStateId", generation + 1
        FROM companystate t, find_state tt
        WHERE t.id = tt."previousCompanyStateId"
    )
    SELECT id from find_state where generation = $2;
$$ LANGUAGE SQL;