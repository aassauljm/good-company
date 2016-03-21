
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

CREATE OR REPLACE FUNCTION insert_entity()
RETURNS INTEGER AS $$
INSERT INTO entity DEFAULT VALUES returning id;
$$ LANGUAGE sql;


CREATE OR REPLACE FUNCTION insert_person_entity()
RETURNS trigger AS $$
BEGIN
  IF NEW."personId" IS NULL THEN
    NEW."personId" := (SELECT insert_entity());
  END IF;
  RETURN NEW;
END $$ LANGUAGE 'plpgsql';

CREATE OR REPLACE FUNCTION insert_holding_entity()
RETURNS trigger AS $$
BEGIN
  IF NEW."holdingId" IS NULL THEN
    NEW."holdingId" := (SELECT insert_entity());
  END IF;
  RETURN NEW;
END $$ LANGUAGE 'plpgsql';

CREATE OR REPLACE FUNCTION insert_director_entity()
RETURNS trigger AS $$
BEGIN
  IF NEW."directorId" IS NULL THEN
    NEW."directorId" := (SELECT insert_entity());
  END IF;
  RETURN NEW;
END $$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS person_entity ON person;
CREATE TRIGGER person_entity BEFORE INSERT ON person
FOR EACH ROW
EXECUTE PROCEDURE insert_person_entity();

DROP TRIGGER IF EXISTS holding_entity ON holding;
CREATE TRIGGER holding_entity BEFORE INSERT ON holding
FOR EACH ROW
EXECUTE PROCEDURE insert_holding_entity();

DROP TRIGGER IF EXISTS director_entity ON director;
CREATE TRIGGER director_entity BEFORE INSERT ON director
FOR EACH ROW
EXECUTE PROCEDURE insert_director_entity();


-- Recurse throw x generations of companyState and return that id
CREATE OR REPLACE FUNCTION previous_company_state(companyStateId integer, generation integer)
    RETURNS INTEGER
    AS $$
    WITH RECURSIVE find_state(id, "previousCompanyStateId", generation) as (
        SELECT t.id, t."previousCompanyStateId", 0 FROM company_state as t where t.id = $1
        UNION ALL
        SELECT t.id, t."previousCompanyStateId", generation + 1
        FROM company_state t, find_state tt
        WHERE t.id = tt."previousCompanyStateId"
    )
    SELECT id from find_state where generation = $2;
$$ LANGUAGE SQL;

-- Get the root in the companyState recursion
CREATE OR REPLACE FUNCTION root_company_state(companyStateId integer)
    RETURNS INTEGER
    AS $$
    WITH RECURSIVE find_state(id, "previousCompanyStateId") as (
        SELECT t.id, t."previousCompanyStateId" FROM company_state as t where t.id = $1
        UNION ALL
        SELECT t.id, t."previousCompanyStateId"
        FROM company_state t, find_state tt
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
WITH RECURSIVE prev_company_states(id, "previousCompanyStateId", "transactionId") as (
    SELECT t.id, t."previousCompanyStateId", t."transactionId" FROM company_state as t where t.id = $1
    UNION ALL
    SELECT t.id, t."previousCompanyStateId", t."transactionId"
    FROM company_state t, prev_company_states tt
    WHERE t.id = tt."previousCompanyStateId"
)
SELECT row_to_json(q) from (SELECT "transactionId", type, format_iso_date(t."effectiveDate") as "effectiveDate", t.data,
    (select array_to_json(array_agg(row_to_json(d))) from (
    select *,  format_iso_date(tt."effectiveDate") as "effectiveDate"
    from transaction tt where t.id = tt."parentTransactionId"
    ) as d) as "subTransactions" from prev_company_states pt
    inner join transaction t on pt."transactionId" = t.id
    ORDER BY t."effectiveDate" DESC) as q;
$$ LANGUAGE SQL;


-- Like company_state_history_json but filters on transaction type, ie ISSUE
-- Note, 2nd param is text, rather than enum_transaction_type because of dependencies and default drop table behaviour.
-- need to add a pre migrate/sync hook  sigh.
CREATE OR REPLACE FUNCTION company_state_type_filter_history_json(companyStateId integer, types text[])
    RETURNS SETOF JSON
    AS $$
WITH RECURSIVE prev_company_states(id, "previousCompanyStateId", "transactionId") as (
    SELECT t.id, t."previousCompanyStateId", t."transactionId" FROM company_state as t where t.id = $1
    UNION ALL
    SELECT t.id, t."previousCompanyStateId", t."transactionId"
    FROM company_state t, prev_company_states tt
    WHERE t.id = tt."previousCompanyStateId"
)
SELECT row_to_json(q) from (SELECT "transactionId", type, format_iso_date(t."effectiveDate") as "effectiveDate", t.data,
    (select array_to_json(array_agg(row_to_json(d))) from (
    select *,  format_iso_date(tt."effectiveDate") as "effectiveDate"
    from transaction tt where t.id = tt."parentTransactionId"
    ) as d) as "subTransactions" from prev_company_states pt
    inner join transaction t on pt."transactionId" = t.id
    WHERE t.type = any($2::enum_transaction_type[])
    ORDER BY t."effectiveDate" DESC) as q;
$$ LANGUAGE SQL;


-- A brief(er) summary of transactions, part of standard companyState info
CREATE OR REPLACE FUNCTION transaction_summary(companyStateId integer)
    RETURNS JSON
    AS $$
WITH RECURSIVE prev_company_states(id, "previousCompanyStateId", "transactionId") as (
    SELECT t.id, t."previousCompanyStateId", t."transactionId" FROM company_state as t where t.id = $1
    UNION ALL
    SELECT t.id, t."previousCompanyStateId", t."transactionId"
    FROM company_state t, prev_company_states tt
    WHERE t.id = tt."previousCompanyStateId"
)
SELECT array_to_json(array_agg(row_to_json(q))) from (
    SELECT "transactionId", type, format_iso_date(t."effectiveDate") as "effectiveDate",
    (select count(*) from transaction tt where t.id = tt."parentTransactionId") as "actionCount"
    from prev_company_states pt
    inner join transaction t on pt."transactionId" = t.id
    ORDER BY t."effectiveDate" DESC) as q;
$$ LANGUAGE SQL;


-- for every person who has been a holder, get their latest details,
-- where latest is defined as being in the most recent companyState generation.
-- TODO: get the personIds from each join will ALL persons, in case they have
--       updated (after they were no longer holders) outside of the context of this company
CREATE OR REPLACE FUNCTION historical_holders(companyStateId integer)
RETURNS SETOF JSON
AS $$
    WITH RECURSIVE prev_company_states(id, "previousCompanyStateId",  generation) as (
        SELECT t.id, t."previousCompanyStateId", 0 FROM company_state as t where t.id =  $1
        UNION ALL
        SELECT t.id, t."previousCompanyStateId", generation + 1
        FROM company_state t, prev_company_states tt
        WHERE t.id = tt."previousCompanyStateId"
    ), parcels as (
        SELECT pj."holdingId", sum(p.amount) as amount, p."shareClass"
        FROM "parcelJ" pj
        LEFT OUTER JOIN parcel p on p.id = pj."parcelId"
        GROUP BY p."shareClass", pj."holdingId"
    )
    SELECT array_to_json(array_agg(row_to_json(qq) ORDER BY qq.name))
    FROM
        (SELECT
            "personId",
            "name",
            "address",
            "companyNumber",
            bool_or("current") as "current",
            (SELECT array_to_json(array_agg(row_to_json(s))) from parcels s where "holdingId" = ANY(ARRAY_AGG(q."lastHoldingId"))) as parcels,
            format_iso_date(max("lastEffectiveDate")) as "lastEffectiveDate",
        (SELECT format_iso_date(COALESCE(min("effectiveDate"), min("firstEffectiveDate")))
            from transaction t join holding h on t.id = h."transactionId" where h.id = ANY(ARRAY_AGG(q."firstHoldingId"))) as "firstEffectiveDate"
            FROM (
                 SELECT DISTINCT ON ("personId","holdingId")
                "personId",
                first_value(p.name) OVER wnd as name,
                first_value(p."companyNumber") OVER wnd as "companyNumber",
                first_value(p.address) OVER wnd as address,
                first_value(h."holdingId") OVER wnd as "holdingId",
                first_value(h."name") OVER wnd as "holdingName",
                first_value(h."id") OVER wnd as "lastHoldingId",
                last_value(h."id") OVER wnd as "firstHoldingId",
                last_value(t."effectiveDate") OVER wnd as "firstEffectiveDate",
                --first_value(h."companyStateId") OVER wnd as "lastCompanyStateId",
                first_value(t."effectiveDate") OVER wnd as "lastEffectiveDate",
                generation = 0 as current
                from prev_company_states pt
                join company_state cs on pt.id = cs.id
                join transaction t on cs."transactionId" = t.id
                left outer join h_list_j hlj on hlj.holdings_id = cs."h_list_id"
                left outer join holding h on h.id = hlj.h_j_id
                left outer join "holderJ" hj on h.id = hj."holdingId"
                left outer join person p on hj."holderId" = p.id
                 WINDOW wnd AS (
                   PARTITION BY "personId", h."holdingId" ORDER BY generation asc RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
                 )
            ) as q
            GROUP BY "personId", q.name, q."companyNumber", q.address
        ) as qq
$$ LANGUAGE SQL STABLE;


CREATE OR REPLACE FUNCTION holding_history(id integer)
-- TODO, needs deduplication
    RETURNS SETOF transaction
    AS $$
WITH RECURSIVE prev_holdings(id, "previousCompanyStateId", "h_list_id", "holdingId", "transactionId", "hId") as (
    SELECT t.id, t."previousCompanyStateId", t."h_list_id", h."holdingId", h."transactionId", h.id as "hId"
    FROM company_state as t
    left outer join h_list_j hlj on hlj.holdings_id = t.h_list_id
    left outer JOIN holding h on h.id = hlj.h_j_id
    where t.id = $1
    UNION ALL
    SELECT t.id, t."previousCompanyStateId", tt."h_list_id", tt."holdingId", h."transactionId", h.id as "hId"
    FROM company_state t, prev_holdings tt
    left outer join h_list_j hlj on hlj.holdings_id = tt.h_list_id
    left outer JOIN holding h on h."holdingId" = tt."holdingId"
    WHERE t.id = tt."previousCompanyStateId"
   )
SELECT t.* from transaction t join prev_holdings pt on t.id = pt."transactionId";
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION holding_history_json(integer, text[])
    RETURNS JSON
    AS $$
    SELECT array_to_json(array_agg(row_to_json(qq)))
    FROM (SELECT *, format_iso_date("effectiveDate") as "effectiveDate" from holding_history($1)  where $2 is null or type = ANY($2::enum_transaction_type[]))  qq;
$$ LANGUAGE SQL STABLE;



CREATE OR REPLACE FUNCTION share_register(companyStateId integer)
RETURNS SETOF JSON
AS $$
WITH RECURSIVE
    _holding(id, "holdingId", "transactionId", name, "companyStateId") as (
        SELECT h.id, "holdingId", h."transactionId", name, cs.id
        from holding h
        join h_list_j hlj on h.id = hlj.h_j_id
        join company_state cs on cs.h_list_id = hlj.holdings_id
    ),
prev_company_states(id, "previousCompanyStateId",  generation) as (
    SELECT t.id, t."previousCompanyStateId", 0 FROM company_state as t where t.id =  $1
    UNION ALL
    SELECT t.id, t."previousCompanyStateId", generation + 1
    FROM company_state t, prev_company_states tt
    WHERE t.id = tt."previousCompanyStateId"
), prev_holdings("startId", id, "previousCompanyStateId", "holdingId", "transactionId", "hId") as (
    SELECT h.id as "startId", t.id, t."previousCompanyStateId", h."holdingId", h."transactionId", h.id as "hId"
    FROM company_state as t
    left outer JOIN _holding h on h."companyStateId" = t.id
    where t.id =  $1
    UNION ALL
    SELECT "startId", t.id, t."previousCompanyStateId", tt."holdingId", h."transactionId", h.id as "hId"
    FROM company_state t, prev_holdings tt
    left outer JOIN _holding h on h."companyStateId" = tt."previousCompanyStateId" and h."holdingId" = tt."holdingId"
    WHERE t.id = tt."previousCompanyStateId"
 ), prev_holding_transactions as (
    SELECT * FROM (SELECT DISTINCT t.id, "startId"
    FROM transaction t join prev_holdings pt on t.id = pt."transactionId") t
    JOIN transaction tt on tt.id = t.id
 ), parcels as (
    SELECT pj."holdingId", sum(p.amount) as amount, p."shareClass"
    FROM "parcelJ" pj
    LEFT OUTER JOIN parcel p on p.id = pj."parcelId"
    GROUP BY p."shareClass", pj."holdingId"
)
SELECT array_to_json(array_agg(row_to_json(q) ORDER BY q."shareClass", q.name))

FROM (
SELECT *,
    ( SELECT array_to_json(array_agg(row_to_json(qq)))
     FROM (SELECT *, format_iso_date("effectiveDate") as "effectiveDate" from prev_holding_transactions pht
        where pht."startId" = "lastHoldingId" and type = ANY(ARRAY['ISSUE_TO']::enum_transaction_type[]))  qq)
        as "issueHistory",
    ( SELECT array_to_json(array_agg(row_to_json(qq)))
     FROM (SELECT *, format_iso_date("effectiveDate") as "effectiveDate" from prev_holding_transactions pht
        where pht."startId" = "lastHoldingId" and type = ANY(ARRAY['REDEMPTION_FROM', 'PURCHASE_FROM']::enum_transaction_type[]))  qq)
         as "repurchaseHistory",
    ( SELECT array_to_json(array_agg(row_to_json(qq)))
     FROM (SELECT *, format_iso_date("effectiveDate") as "effectiveDate" from prev_holding_transactions pht
        where pht."startId" = "lastHoldingId" and type = ANY(ARRAY['TRANSFER_TO']::enum_transaction_type[]))  qq)
        as "transferHistoryTo",
    ( SELECT array_to_json(array_agg(row_to_json(qq)))
     FROM (SELECT *, format_iso_date("effectiveDate") as "effectiveDate" from prev_holding_transactions pht
        where pht."startId" = "lastHoldingId" and type = ANY(ARRAY['TRANSFER_FROM']::enum_transaction_type[]))  qq)
        as "transferHistoryFrom",
    ( SELECT COALESCE(sum((data->'amount')::text::int), 0)
     FROM (SELECT *, format_iso_date("effectiveDate") as "effectiveDate" from prev_holding_transactions pht
        where pht."startId" = "lastHoldingId" and type = ANY(ARRAY['ISSUE_TO', 'TRANSFER_TO']::enum_transaction_type[]))  qq)
        as "sum"
FROM

    (SELECT DISTINCT ON ("personId", "lastHoldingId", "shareClass")
    "personId",
    first_value(p.name) OVER wnd as name,
    first_value(p."companyNumber") OVER wnd as "companyNumber",
    first_value(p.address) OVER wnd as address,
    first_value(pp.amount) OVER wnd as amount,
    pp."shareClass" as  "shareClass",
    first_value(h."holdingId") OVER wnd as "holdingId",
    first_value(h."name") OVER wnd as "holdingName",
    first_value(h."id") OVER wnd as "lastHoldingId",
    first_value(h."companyStateId") OVER wnd as "lastCompanyStateId",
    format_iso_date(t."effectiveDate") as "lastEffectiveDate",
    first_value(h."companyStateId") OVER wnd = $1 as current
    from prev_company_states pt
    join company_state cs on pt.id = cs.id
    join transaction t on cs."transactionId" = t.id
    left outer join _holding h on h."companyStateId" = pt.id
    left outer join parcels pp on pp."holdingId" = h.id
    left outer join "holderJ" hj on h.id = hj."holdingId"
    left outer join person p on hj."holderId" = p.id
     WINDOW wnd AS (
       PARTITION BY "personId", h."holdingId", pp."shareClass" ORDER BY generation asc
     )) as q
    ) as q

$$ LANGUAGE SQL STABLE;




