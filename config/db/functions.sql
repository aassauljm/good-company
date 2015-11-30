
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


CREATE OR REPLACE FUNCTION root_company_state(companyStateId integer)
    RETURNS INTEGER
    AS $$
    WITH RECURSIVE find_state(id, "previousCompanyStateId") as (
        SELECT t.id, t."previousCompanyStateId" FROM companystate as t where t.id = $1
        UNION ALL
        SELECT t.id, t."previousCompanyStateId"
        FROM companystate t, find_state tt
        WHERE t.id = tt."previousCompanyStateId"
    )
    SELECT id from find_state where "previousCompanyStateId" is null;
$$ LANGUAGE SQL;



CREATE OR REPLACE FUNCTION company_state_history_json(companyStateId integer)
    RETURNS SETOF JSON
    AS $$
WITH RECURSIVE prev_transactions(id, "previousCompanyStateId", "transactionId") as (
    SELECT t.id, t."previousCompanyStateId", t."transactionId" FROM companystate as t where t.id = $1
    UNION ALL
    SELECT t.id, t."previousCompanyStateId", t."transactionId"
    FROM companystate t, prev_transactions tt
    WHERE t.id = tt."previousCompanyStateId"
)
SELECT row_to_json(q) from (SELECT "transactionId", type, to_char(t."effectiveDate" at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as "effectiveDate", t.data,
    (select array_to_json(array_agg(row_to_json(d))) from (
    select *,  to_char(tt."effectiveDate" at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as "effectiveDate"
    from transaction tt where t.id = tt."parentTransactionId"
    ) as d) as "subTransactions" from prev_transactions pt
    inner join transaction t on pt."transactionId" = t.id
    ORDER BY t."effectiveDate" DESC) as q;
$$ LANGUAGE SQL;