
-- So that fixtures don't collide ids, push sequences higher
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


-- Recurse throw x generations of companyState and return that id
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

-- Get the root in the companyState recursion
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

-- So that we get dates in the same format as sequelize
CREATE OR REPLACE FUNCTION format_iso_date(d timestamp with time zone)
    RETURNS text
    AS $$
    SELECT to_char($1 at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
$$ LANGUAGE SQL;

-- Summary of all transactions in json, used for client tables
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
SELECT row_to_json(q) from (SELECT "transactionId", type, format_iso_date(t."effectiveDate") as "effectiveDate", t.data,
    (select array_to_json(array_agg(row_to_json(d))) from (
    select *,  format_iso_date(tt."effectiveDate") as "effectiveDate"
    from transaction tt where t.id = tt."parentTransactionId"
    ) as d) as "subTransactions" from prev_transactions pt
    inner join transaction t on pt."transactionId" = t.id
    ORDER BY t."effectiveDate" DESC) as q;
$$ LANGUAGE SQL;


-- Like company_state_history_json but filters on transaction type, ie ISSUE
-- Note, 2nd param is text, rather than enum_transaction_type because of dependencies and default drop table behaviour.
-- need to add a pre migrate/sync hook  sigh.
CREATE OR REPLACE FUNCTION company_state_type_filter_history_json(companyStateId integer, types text[])
    RETURNS SETOF JSON
    AS $$
WITH RECURSIVE prev_transactions(id, "previousCompanyStateId", "transactionId") as (
    SELECT t.id, t."previousCompanyStateId", t."transactionId" FROM companystate as t where t.id = $1
    UNION ALL
    SELECT t.id, t."previousCompanyStateId", t."transactionId"
    FROM companystate t, prev_transactions tt
    WHERE t.id = tt."previousCompanyStateId"
)
SELECT row_to_json(q) from (SELECT "transactionId", type, format_iso_date(t."effectiveDate") as "effectiveDate", t.data,
    (select array_to_json(array_agg(row_to_json(d))) from (
    select *,  format_iso_date(tt."effectiveDate") as "effectiveDate"
    from transaction tt where t.id = tt."parentTransactionId"
    ) as d) as "subTransactions" from prev_transactions pt
    inner join transaction t on pt."transactionId" = t.id
    WHERE t.type = any($2::enum_transaction_type[])
    ORDER BY t."effectiveDate" DESC) as q;
$$ LANGUAGE SQL;


-- A brief(er) summary of transactions, part of standard companyState info
CREATE OR REPLACE FUNCTION transaction_summary(companyStateId integer)
    RETURNS JSON
    AS $$
WITH RECURSIVE prev_transactions(id, "previousCompanyStateId", "transactionId") as (
    SELECT t.id, t."previousCompanyStateId", t."transactionId" FROM companystate as t where t.id = $1
    UNION ALL
    SELECT t.id, t."previousCompanyStateId", t."transactionId"
    FROM companystate t, prev_transactions tt
    WHERE t.id = tt."previousCompanyStateId"
)
SELECT array_to_json(array_agg(row_to_json(q))) from (SELECT "transactionId", type, format_iso_date(t."effectiveDate") as "effectiveDate",
    (select count(*) from transaction tt where t.id = tt."parentTransactionId") as "actionCount"
    from prev_transactions pt
    inner join transaction t on pt."transactionId" = t.id
    ORDER BY t."effectiveDate" DESC) as q;
$$ LANGUAGE SQL;


-- for every person who has been a holder, get their latest details,
-- where latest is defined as being in the most recent companyState generation.
-- TODO: get the personIds from each join will ALL persons, in case they have
--       updated outside of the context of this company
CREATE OR REPLACE FUNCTION historical_holders(companyStateId integer)
    RETURNS SETOF JSON
    AS $$
WITH RECURSIVE prev_transactions(id, "previousCompanyStateId",  generation) as (
    SELECT t.id, t."previousCompanyStateId", 0 FROM companystate as t where t.id =  $1
    UNION ALL
    SELECT t.id, t."previousCompanyStateId", generation + 1
    FROM companystate t, prev_transactions tt
    WHERE t.id = tt."previousCompanyStateId"
)
SELECT array_to_json(array_agg(row_to_json(q) ORDER BY q.name)) from

    (SELECT DISTINCT ON ("personId") "personId",
    first_value(p.name) OVER wnd as name,
    first_value(p."companyNumber") OVER wnd as "companyNumber",
    first_value(p.address) OVER wnd as address,
    first_value(p.id) OVER wnd as id,
    first_value(h."holdingId") OVER wnd as "lastHoldingId",
    first_value(h."companyStateId") OVER wnd as "lastCompanyStateId",
    format_iso_date(t."effectiveDate") as "lastEffectiveDate",
    generation = 0 as current
    from prev_transactions pt
    join companystate cs on pt.id = cs.id
    join transaction t on cs."transactionId" = t.id
    left outer join holding h on h."companyStateId" = pt.id
    left outer join "holderJ" hj on h.id = hj."holdingId"
    left outer join person p on hj."holderId" = p.id
     WINDOW wnd AS (
       PARTITION BY "personId" ORDER BY generation asc
       ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
     )) as q;
$$ LANGUAGE SQL;



CREATE OR REPLACE FUNCTION share_register(companyStateId integer)
RETURNS SETOF JSON
AS $$
    WITH RECURSIVE prev_transactions(id, "previousCompanyStateId",  generation) as (
        SELECT t.id, t."previousCompanyStateId", 0 FROM companystate as t where t.id =  $1
        UNION ALL
        SELECT t.id, t."previousCompanyStateId", generation + 1
        FROM companystate t, prev_transactions tt
        WHERE t.id = tt."previousCompanyStateId"
    ), parcels as (
        SELECT pj."holdingId", sum(p.amount) as amount, p."shareClass"
        FROM "parcelJ" pj
        LEFT OUTER JOIN parcel p on p.id = pj."parcelId"
        GROUP BY p."shareClass", pj."holdingId"
    ), issues as (
        SELECT * FROM transaction t
        WHERE t.type = ANY(ARRAY['ISSUE']::enum_transaction_type[])
        UNION ALL
        SELECT t.* FROM transaction t
        JOIN transaction tt on t."parentTransactionId" = tt.id
        WHERE tt.type = ANY(ARRAY['ISSUE']::enum_transaction_type[]) and t.type = ANY(ARRAY['AMEND']::enum_transaction_type[])
    ), redemptions as (
        SELECT * FROM transaction t
        WHERE t.type = ANY(ARRAY['REDEMPTION', 'REPURCHASE']::enum_transaction_type[])
        UNION ALL
        SELECT t.* FROM transaction t
        JOIN transaction tt on t."parentTransactionId" = tt.id
        WHERE tt.type = ANY(ARRAY['REDEMPTION', 'REPURCHASE']::enum_transaction_type[]) and t.type = ANY(ARRAY['AMEND']::enum_transaction_type[])
    ), transfer_to as (
        SELECT * FROM transaction t
        WHERE t.type = ANY(ARRAY['TRANSFER_TO']::enum_transaction_type[])
        UNION ALL
        SELECT t.* FROM transaction t
        JOIN transaction tt on t."parentTransactionId" = tt.id
        WHERE tt.type = ANY(ARRAY['TRANSFER_TO']::enum_transaction_type[])
    ), transfer_from as (
        SELECT * FROM transaction t
        WHERE t.type = ANY(ARRAY['TRANSFER_FROM']::enum_transaction_type[])
        UNION ALL
        SELECT t.* FROM transaction t
        JOIN transaction tt on t."parentTransactionId" = tt.id
        WHERE tt.type = ANY(ARRAY['TRANSFER_FROM']::enum_transaction_type[])
    )
    SELECT array_to_json(array_agg(row_to_json(q) ORDER BY q.name))
        FROM
        (SELECT DISTINCT ON ("personId") "personId",

        first_value(p.name) OVER wnd as name,
        first_value(p."companyNumber") OVER wnd as "companyNumber",
        first_value(p.address) OVER wnd as address,
        first_value(pp.amount) OVER wnd as amount,
         first_value(pp."shareClass") OVER wnd as "shareClass",
        --first_value(p.id) OVER wnd as id,
        first_value(h."holdingId") OVER wnd as "lastHoldingId",
        first_value(h."companyStateId") OVER wnd as "lastCompanyStateId",
        format_iso_date(t."effectiveDate") as "lastEffectiveDate",
        generation = 0 as current,
        (SELECT row_to_json(i) FROM issues i WHERE i.id = h."transactionId")  as "issues",
        (SELECT row_to_json(i) FROM redemptions i WHERE i.id = h."transactionId")  as "redemptions",
        (SELECT row_to_json(i) FROM transfer_to i WHERE i.id = h."transactionId")  as "transfer_to",
        (SELECT row_to_json(i) FROM transfer_from i WHERE i.id = h."transactionId")  as "transfer_from"
        from prev_transactions pt
        join companystate cs on pt.id = cs.id
        join transaction t on cs."transactionId" = t.id
        left outer join holding h on h."companyStateId" = pt.id
        join parcels pp on pp."holdingId" = h.id
        left outer join "holderJ" hj on h.id = hj."holdingId"
        left outer join person p on hj."holderId" = p.id
         WINDOW wnd AS (
           PARTITION BY "personId" ORDER BY generation asc
           ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
         )) as q
$$ LANGUAGE SQL;

