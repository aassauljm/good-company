
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


-- So that we get dates in the same format as sequelize
CREATE OR REPLACE FUNCTION format_iso_date(d timestamp with time zone)
    RETURNS text
    AS $$
    SELECT to_char($1 at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION last_login(userId integer)
    RETURNS  text
    AS $$
    SELECT format_iso_date("createdAt") from login_history where "userId" = $1 order by "createdAt" DESC limit 1 offset 1
$$ LANGUAGE SQL;


-- TODO, these recursive functions should card against infinite recursion


-- Recurse through x generations of companyState and return that id
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

CREATE OR REPLACE FUNCTION company_from_company_state(companyStateId integer)
    RETURNS INTEGER
    AS $$
     WITH RECURSIVE future_company_states(id, "previousCompanyStateId",  generation) as (
        SELECT t.id, t."previousCompanyStateId", 0 FROM company_state as t where t.id = $1
        UNION ALL
        SELECT t.id, t."previousCompanyStateId", generation + 1
        FROM company_state t, future_company_states tt
        WHERE tt.id = t."previousCompanyStateId")

        SELECT c.id from future_company_states fcs
        JOIN company c on c."currentCompanyStateId" = fcs.id
    LIMIT 1;
$$ LANGUAGE SQL;


-- get the companyState for right now
CREATE OR REPLACE FUNCTION company_state_at(companyStateId integer, timestamp with time zone)
    RETURNS integer
    AS $$
    WITH RECURSIVE prev_company_states(id, "previousCompanyStateId", "transactionId", generation) as (
        SELECT t.id, t."previousCompanyStateId", t."transactionId", 0 as generation FROM company_state as t where t.id = $1
        UNION ALL
        SELECT t.id, t."previousCompanyStateId", t."transactionId", generation + 1
        FROM company_state t, prev_company_states tt
        WHERE t.id = tt."previousCompanyStateId"
    )
    SELECT id FROM
        (SELECT pvs.id, generation, "effectiveDate" FROM prev_company_states pvs
         LEFT OUTER JOIN transaction t on t.id = pvs."transactionId"
         ORDER BY generation ASC) q
    WHERE q."effectiveDate" < $2 OR q."effectiveDate" is NULL LIMIT 1
$$ LANGUAGE SQL;

-- get the companyState for right now
CREATE OR REPLACE FUNCTION company_state_now(companyStateId integer)
    RETURNS integer
    AS $$
    select company_state_at($1, now())
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION company_now(company integer)
    RETURNS integer
    AS $$
    SELECT company_state_now("currentCompanyStateId") id FROM company where company.id = $1
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION company_at(company integer, timestamp with time zone)
    RETURNS integer
    AS $$
    SELECT company_state_at("currentCompanyStateId", $2) id FROM company where company.id = $1
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION user_companies_now("userId" integer)
    RETURNS SETOF json
    AS $$
    WITH basic_company_state as (
        SELECT id, "companyName", "companyNumber", "nzbn", "entityType", "incorporationDate"  from company_state
    )
    SELECT row_to_json(q) FROM (
        SELECT q.id, "currentCompanyStateId", row_to_json(cs.*) as "currentCompanyState" FROM (
        SELECT *, company_now(c.id) FROM company c
        WHERE c."ownerId" = $1 and c.deleted != true
        ) q
        JOIN basic_company_state cs on cs.id = q.company_now
        ORDER BY cs."companyName"
    ) q
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION user_favourites_now("userId" integer)
    RETURNS SETOF json
    AS $$
    WITH basic_company_state as (
        SELECT id, "companyName", "companyNumber", "nzbn", "entityType", "incorporationDate"  from company_state
    )
    SELECT row_to_json(q) FROM (
        SELECT q.id, "currentCompanyStateId", row_to_json(cs.*) as "currentCompanyState", TRUE as "favourite" FROM (
        SELECT c.*, company_now(c.id)
    FROM favourite f
        JOIN company c on f."companyId" = c.id

        WHERE c."ownerId" = $1 and f."userId" = $1 and c.deleted != true
        ) q
        JOIN basic_company_state cs on cs.id = q.company_now
        ORDER BY cs."companyName"
    ) q
$$ LANGUAGE SQL;

--CREATE OR REPLACE FUNCTION future_transactions(companyId integer)
--    RETURNS SETOF json
--    AS $$
--    SELECT row_to_json(t.*) from transaction t
--    JOIN
--    (SELECT future_transactions_from_company_state("currentCompanyStateId") id FROM company
--    WHERE company.id = $1) q on q.id = t.id
--$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION future_transaction_range(startId integer, endId integer)
    RETURNS SETOF json
    AS $$
    WITH RECURSIVE prev_company_states(id, "previousCompanyStateId", "transactionId", generation) as (
        SELECT t.id, t."previousCompanyStateId", t."transactionId", 0 as generation FROM company_state as t where t.id = $2
        UNION ALL
        SELECT t.id, t."previousCompanyStateId", t."transactionId", generation + 1
        FROM company_state t, prev_company_states tt
        WHERE t.id = tt."previousCompanyStateId"
    ),
    selected_generation AS (
        SELECT generation from prev_company_states where id = $1
    )
    SELECT row_to_json(q.*)

    FROM (
    SELECT t.id, type, format_iso_date(t."effectiveDate") as "effectiveDate", t.data,
        (select array_to_json(array_agg(row_to_json(d))) from (
        select t.id, type, data, format_iso_date(tt."effectiveDate") as "effectiveDate"
        from transaction tt where t.id = tt."parentTransactionId"
        ) as d) as "subTransactions"
    FROM transaction t
    JOIN
        (SELECT * FROM prev_company_states WHERE generation >= 0 and generation < (SELECT generation from selected_generation)) q
    ON t.id = q."transactionId"
    WHERE $1 != $2
    order by generation desc ) as q
$$ LANGUAGE SQL;



-- Summary of all transactions in json, used for client tables
CREATE OR REPLACE FUNCTION company_state_history_json(companyStateId integer)
    RETURNS SETOF JSON
    AS $$
WITH RECURSIVE prev_company_states(id, "previousCompanyStateId", "transactionId", "generation") as (
    SELECT t.id, t."previousCompanyStateId", t."transactionId", 0 as "generation" FROM company_state as t where t.id = $1
    UNION ALL
    SELECT t.id, t."previousCompanyStateId", t."transactionId", "generation" + 1
    FROM company_state t, prev_company_states tt
    WHERE t.id = tt."previousCompanyStateId"
)
SELECT row_to_json(q) from (
            SELECT t.id, type, format_iso_date(t."effectiveDate") as "effectiveDate", t.data,
        (select array_to_json(array_agg(row_to_json(d))) from (
        select t.id, type, data,  format_iso_date(tt."effectiveDate") as "effectiveDate"
        from transaction tt where t.id = tt."parentTransactionId"
        ) as d) as "subTransactions",
        (SELECT array_to_json(array_agg(row_to_json(d.*))) from t_d_j j left outer join document d on j.document_id = d.id where t.id = j.transaction_id) as "documents"
        from prev_company_states pt
    inner join transaction t on pt."transactionId" = t.id
    ORDER BY pt.generation ASC) as q;
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
    ) as d) as "subTransactions" ,
    (SELECT array_to_json(array_agg(row_to_json(d.*))) from t_d_j j left outer join document d on j.document_id = d.id where t.id = j.transaction_id) as "documents"
    from prev_company_states pt
    inner join transaction t on pt."transactionId" = t.id

    WHERE t.type = any($2::enum_transaction_type[])
    ORDER BY t."effectiveDate" DESC) as q;
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION top_user_companies(userId integer, count integer default 10)
    RETURNS SETOF integer
    AS $$
    SELECT id from company c where c."ownerId" = $1 limit $2;
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION recent_transactions(companyStateId integer, count integer default 10)
    RETURNS SETOF transaction
    AS $$
WITH RECURSIVE prev_company_states(id, "previousCompanyStateId", "transactionId") as (
    SELECT t.id, t."previousCompanyStateId", t."transactionId" FROM company_state as t where t.id = $1
    UNION ALL
    SELECT t.id, t."previousCompanyStateId", t."transactionId"
    FROM company_state t, prev_company_states tt
    WHERE t.id = tt."previousCompanyStateId"
)
    SELECT t.*
    FROM prev_company_states pt
    inner join transaction t on pt."transactionId" = t.id
    ORDER BY t."effectiveDate" DESC limit $2;
$$ LANGUAGE SQL;


-- A list of pendingActions for a company state
CREATE OR REPLACE FUNCTION all_pending_actions(companyStateId integer)
    RETURNS SETOF action
    AS $$
    WITH RECURSIVE root as (
        SELECT root_company_state($1) as id
    ),  historic as (
        SELECT pending_historic_action_id as id
        FROM company_state cs
        JOIN root r on r.id = cs.id
    ),  prev_actions(start_id, id, "previous_id", index) as (
            SELECT t.id as start_id, t.id, t."previous_id", 0 as index
            FROM action t
            JOIN historic s on s.id = t.id

            UNION ALL

            SELECT pa.start_id, t.id, t."previous_id", index+1
            FROM action t, prev_actions pa
            WHERE t.id = pa."previous_id"
        )
    SELECT p.* from
    prev_actions pa
    JOIN action p on p.id = pa.id
    order by index asc
$$ LANGUAGE SQL;



CREATE OR REPLACE FUNCTION has_pending_historic_actions(companyStateId integer)
    RETURNS BOOLEAN
    AS $$
    SELECT pending_historic_action_id is not null from  company_state cs
      INNER JOIN
      (SELECT root_company_state($1)) s on s.root_company_state = cs.id
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION has_pending_future_actions(companyStateId integer)
    RETURNS BOOLEAN
    AS $$
    SELECT latest_source_data_id is not null from  company c
      INNER JOIN
      (SELECT company_from_company_state($1)) s on s.company_from_company_state = c.id
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION has_missing_voting_shareholders(companyStateId integer)
    RETURNS BOOLEAN
    AS $$
    SELECT bool_or(missing)
    FROM (
        SELECT (count(h.id) != 1 and bool_and((hh.data->'votingShareholder') IS NULL)) as missing
        FROM company_state cs
        JOIN h_list_j hlj ON cs.h_list_id = hlj.holdings_id
        LEFT OUTER JOIN holding h ON h.id = hlj.h_j_id
        LEFT OUTER JOIN holder hh on h.id = hh."holdingId"
        where cs.id = $1
        GROUP BY h.id
        ) q
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION has_no_share_classes(companyStateId integer)
    RETURNS BOOLEAN
    AS $$
    SELECT NOT EXISTS(SELECT 1
    FROM company_state cs
    JOIN s_c_j scj on cs.s_classes_id = scj.s_classes_id
    JOIN share_class s on scj.s_class_id = s.id
    WHERE cs.id = $1)
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION has_no_applied_share_classes(companyStateId integer)
    RETURNS BOOLEAN
    AS $$
    SELECT bool_or(missing)
    FROM (
        SELECT p."shareClass" is NULL as missing
        FROM company_state cs
        JOIN h_list_j hlj ON cs.h_list_id = hlj.holdings_id
        LEFT OUTER JOIN holding h ON h.id = hlj.h_j_id
        LEFT OUTER JOIN parcel_j pj on pj."holdingId" =  h.id
        JOIN parcel p on p.id = pj."parcelId"
        where cs.id = $1
        ) q
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION has_extensive_shareholding(companyStateId integer)
    RETURNS BOOLEAN
    AS $$
    SELECT extensive from company_state cs where cs.id = $1
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION get_warnings(companyStateId integer)
    RETURNS JSONB
    AS $$
    SELECT jsonb_build_object(
        'pendingHistory', has_pending_historic_actions($1),
        'pendingFuture', has_pending_future_actions($1),
        'missingVotingShareholders', has_missing_voting_shareholders($1),
        'shareClassWarning', has_no_share_classes($1),
        'applyShareClassWarning', has_no_applied_share_classes($1),
        'extensiveWarning', has_extensive_shareholding($1),
        'treasuryStockOverAllocated', FALSE
        )
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION apply_warnings()
RETURNS trigger AS $$
BEGIN
    UPDATE company_state set warnings = get_warnings(NEW.id) where id = NEW.id;

    -- TODO, save result of pendingHistory and propagate
     WITH RECURSIVE future_company_states(id, "previousCompanyStateId",  generation) as (
        SELECT t.id, t."previousCompanyStateId", 0 FROM company_state as t where t.id =  NEW.id
        UNION ALL
        SELECT t.id, t."previousCompanyStateId", generation + 1
        FROM company_state t, future_company_states tt
        WHERE tt.id = t."previousCompanyStateId")

     UPDATE company_state cs set warnings = get_warnings(cs.id)
     FROM (SELECT id from future_company_states) subquery


    WHERE subquery.id = cs.id and cs.id != NEW.id;
  RETURN NEW;
END $$ LANGUAGE 'plpgsql';



DROP TRIGGER IF EXISTS company_state_warnings_trigger ON company_state;
CREATE TRIGGER company_state_warnings_trigger AFTER INSERT OR UPDATE ON company_state
    FOR EACH ROW
    WHEN (pg_trigger_depth() = 0)
    EXECUTE PROCEDURE apply_warnings();


CREATE OR REPLACE FUNCTION company_apply_warnings()
RETURNS trigger AS $$
BEGIN
    UPDATE company_state set warnings = get_warnings(NEW.id) where id = NEW."currentCompanyStateId";

    -- TODO, save result of pendingHistory and propagate
    WITH RECURSIVE prev_company_states(id, "previousCompanyStateId", "transactionId") as (
        SELECT t.id, t."previousCompanyStateId", t."transactionId" FROM company_state as t where t.id = NEW."currentCompanyStateId"
        UNION ALL
        SELECT t.id, t."previousCompanyStateId", t."transactionId"
        FROM company_state t, prev_company_states tt
        WHERE t.id = tt."previousCompanyStateId"
    )

     UPDATE company_state cs set warnings = get_warnings(cs.id)
     FROM (SELECT id from prev_company_states) subquery


    WHERE subquery.id = cs.id and cs.id != NEW.id;
  RETURN NEW;
END $$ LANGUAGE 'plpgsql';




DROP TRIGGER IF EXISTS company_company_state_warnings_trigger ON company;
CREATE TRIGGER company_company_state_warnings_trigger AFTER INSERT OR UPDATE OF latest_source_data_id ON company
    FOR EACH ROW
    WHEN (pg_trigger_depth() = 0)
    EXECUTE PROCEDURE company_apply_warnings();



CREATE OR REPLACE FUNCTION ar_deadline(companyStateId integer, tz text default 'Pacific/Auckland')
    RETURNS JSON
    AS $$
    SELECT row_to_json(q)
        FROM (
        SELECT "arFilingMonth",
        format_iso_date(date) as "lastFiling",
        "filedThisYear",
        EXTRACT(EPOCH FROM now() AT TIME ZONE $2 - due) as "seconds",
        not "filedThisYear" and due < now() and not "incorporatedThisYear" as "overdue",
        format_iso_date(due) as "dueDate"
        FROM (
            SELECT "arFilingMonth", date,
         EXTRACT(YEAR FROM "incorporationDate") = EXTRACT(YEAR FROM now() AT TIME ZONE 'Pacific/Auckland') as "incorporatedThisYear",
                EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM now()) as "filedThisYear",
                make_timestamptz(
                    EXTRACT(YEAR FROM now() AT TIME ZONE 'Pacific/Auckland')::integer,
                    EXTRACT(MONTH FROM TO_TIMESTAMP("arFilingMonth"::text, 'Month'))::integer,
                    1,
                    0,0,0.0, $2) + INTERVAL '1 month - 1 second' as "due"
            FROM company_state cs
            LEFT OUTER JOIN doc_list_j dlj on cs.doc_list_id = dlj.doc_list_id
            LEFT OUTER JOIN document d on d.id = dlj.document_id

            WHERE cs.id = $1 and type = 'Companies Office' and (filename = 'File Annual Return' or filename = 'Online Annual Return' or filename = 'Annual Return Filed')

            ORDER BY d.date DESC LIMIT 1
        ) qq
    ) q
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION get_deadlines(companyStateId integer)
    RETURNS JSON
    AS $$
    SELECT json_build_object(
        'annualReturn', ar_deadline($1)
        )
$$ LANGUAGE SQL;



CREATE OR REPLACE FUNCTION all_company_notifications("userId" integer)
    RETURNS JSON
    AS $$
    SELECT array_to_json(array_agg(row_to_json(q)))
    FROM (
        SELECT c.id, cs."companyName", cs.warnings, cs."constitutionFiled" as "constitutionFiled", get_deadlines(cs.id) as deadlines,
        ( SELECT array_to_json(array_agg(qq)) FROM future_transaction_range(company_now, "currentCompanyStateId") qq)
            AS "futureTransactions"

        FROM (
        SELECT *, company_now(c.id) FROM company c
        WHERE c."ownerId" = $1 and c.deleted != true
        ) c
        JOIN company_state cs on cs.id = c.company_now
    ) q;
$$ LANGUAGE SQL;



-- A brief(er) summary of transactions, part of standard companyState info
CREATE OR REPLACE FUNCTION transaction_summary(companyStateId integer)
    RETURNS JSON
    AS $$
WITH RECURSIVE prev_company_states(id, "previousCompanyStateId", "transactionId", "generation") as (
    SELECT t.id, t."previousCompanyStateId", t."transactionId", 0 as generation FROM company_state as t where t.id = $1
    UNION ALL
    SELECT t.id, t."previousCompanyStateId", t."transactionId", generation + 1
    FROM company_state t, prev_company_states tt
    WHERE t.id = tt."previousCompanyStateId"
)
SELECT array_to_json(array_agg(row_to_json(q))) from (
    SELECT "transactionId", type, format_iso_date(t."effectiveDate") as "effectiveDate",
    (select count(*) from transaction tt where t.id = tt."parentTransactionId") as "actionCount"
    from prev_company_states pt
    inner join transaction t on pt."transactionId" = t.id
    ORDER BY pt.generation ASC) as q;
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
        FROM "parcel_j" pj
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
                left outer join "holder" hj on h.id = hj."holdingId"
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


CREATE OR REPLACE FUNCTION transaction_siblings(integer)
RETURNS SETOF transaction
AS $$
SELECT ttt.* FROM transaction t
LEFT OUTER JOIN transaction tt on tt.id = t."parentTransactionId"
LEFT OUTER JOIN transaction ttt on tt.id = ttt."parentTransactionId"
WHERE t.id = $1 and ttt.id != $1
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION holding_persons(id integer)
RETURNS SETOF JSON
AS $$
SELECT array_to_json(array_agg(row_to_json(qq))) FROM
    ( SELECT * FROM holding h
    left outer join "holder" hj on h.id = hj."holdingId"
    left outer join person p on hj."holderId" = p.id
    WHERE h.id = $1) qq;
$$ LANGUAGE SQL STABLE;


DROP FUNCTION IF EXISTS company_persons("companyStateId" integer);
CREATE OR REPLACE FUNCTION company_persons("companyStateId" integer)
RETURNS TABLE("id" integer, "personId" integer, "name" text, "address" text, "companyNumber" text, "attr" json, "lastEffectiveDate" timestamp with time zone, "current" boolean)
AS $$

    WITH RECURSIVE prev_company_states(id, "previousCompanyStateId",  generation) as (
        SELECT t.id, t."previousCompanyStateId", 0 FROM company_state as t where t.id =  $1
        UNION ALL
        SELECT t.id, t."previousCompanyStateId", generation + 1
        FROM company_state t, prev_company_states tt
        WHERE t.id = tt."previousCompanyStateId"
    ),
    historic_persons(id, "personId", "effectiveDate") as (
    SELECT p.id, "personId", t."effectiveDate"
    FROM company_State cs
    JOIN h_person_list pl on pl.id = cs.h_person_list_id
    LEFT OUTER JOIN h_person_list_j plj on plj.h_person_list_id = pl.id
    LEFT OUTER JOIN person p on p.id = plj.person_id
    LEFT OUTER JOIN transaction t on t.id = p."transactionId"
    WHERE cs.id = $1
    )
SELECT p."id", p."personId", "name", "address", "companyNumber", "attr", "lastEffectiveDate", "current" FROM
(
SELECT *, rank() OVER wnd
    FROM (
    SELECT
        "id",
        "personId",
        "lastEffectiveDate",
        "generation",
        "generation" = 0 as "current"
        FROM (
             SELECT DISTINCT ON ("personId")
            "personId",
            first_value(p.id) OVER wnd as "id",
            first_value(t."effectiveDate") OVER wnd as "lastEffectiveDate",
            generation,
            generation = 0 as current
            from prev_company_states pt
            join company_state cs on pt.id = cs.id
            join transaction t on cs."transactionId" = t.id
            left outer join h_list_j hlj on hlj.holdings_id = cs."h_list_id"
            left outer join holding h on h.id = hlj.h_j_id
            left outer join "holder" hj on h.id = hj."holdingId"
            left outer join person p on hj."holderId" = p.id
             WINDOW wnd AS (
               PARTITION BY "personId", h."holdingId" ORDER BY generation asc RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
             )
        ) as q
        GROUP BY "personId", generation, "id", "lastEffectiveDate"
    UNION
    SELECT "id", "personId", "effectiveDate" as "lastEffectiveDate", -1 as "generation", false as "current" FROM
    historic_persons hp

        ) as qq

WINDOW wnd AS (
    PARTITION BY "personId" ORDER BY generation asc
)) q
 LEFT OUTER JOIN person p on q.id = p.id
 WHERE rank = 1;

$$ LANGUAGE SQL;


DROP FUNCTION IF EXISTS historic_user_persons("userId" integer);
DROP FUNCTION IF EXISTS historic_company_persons("companyStateId" integer);


CREATE OR REPLACE FUNCTION historic_company_persons("companyStateId" integer)
RETURNS TABLE("id" integer, "personId" integer, "name" text, "address" text, "companyNumber" text)
AS $$
    WITH RECURSIVE prev_company_states(id, "previousCompanyStateId",  generation) as (
        SELECT t.id, t."previousCompanyStateId", 0 FROM company_state as t where t.id =  $1
        UNION ALL
        SELECT t.id, t."previousCompanyStateId", generation + 1
        FROM company_state t, prev_company_states tt
        WHERE t.id = tt."previousCompanyStateId"
    )
 SELECT
        "id",
        "personId",
        "name",
        "address",
        "companyNumber"
        FROM (
             SELECT
            "personId",
            p.name as name,
            p."companyNumber" as "companyNumber",
            p.address as address,
            p.id as id
            from prev_company_states pt
            join company_state cs on pt.id = cs.id
            join h_list_j hlj on hlj.holdings_id = cs."h_list_id"
            left outer join holding h on h.id = hlj.h_j_id
            left outer join "holder" hj on h.id = hj."holdingId"
            left outer join person p on hj."holderId" = p.id

         UNION

             SELECT
            p."personId",
            p.name as name,
            p."companyNumber" as "companyNumber",
            p.address as address,
            p.id as id
            from prev_company_states pt
            join company_state cs on pt.id = cs.id
            join director_list dl on dl.id = cs.director_list_id
            left outer join d_d_j ddj on ddj.directors_id = dl.id
            left outer join director d on d.id = ddj.director_id
            left outer join person p on d."personId" = p.id


        ) as q
        GROUP BY "personId", q.name, q."companyNumber", q.address, "id"  ORDER BY "personId"
$$ LANGUAGE SQL;

DROP FUNCTION IF EXISTS latest_user_persons("userId" integer);
CREATE OR REPLACE FUNCTION latest_user_persons("userId" integer)
RETURNS TABLE("id" integer, "personId" integer, "name" text, "address" text, "companyNumber" text, "attr" json, "lastEffectiveDate" timestamp with time zone, "current" boolean)
AS $$
    SELECT f.*
    FROM   company c, company_persons(c."currentCompanyStateId") f
    where c."ownerId" = $1 and deleted = FALSE
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION historic_user_persons("userId" integer)
RETURNS TABLE("id" integer, "personId" integer, "name" text, "address" text, "companyNumber" text)
AS $$
    SELECT f.*
    FROM   company c, historic_company_persons(c."currentCompanyStateId") f
    WHERE  c."ownerId" = $1 and deleted = FALSE;
$$ LANGUAGE SQL;



-- Bloated function to create the share register
CREATE OR REPLACE FUNCTION share_register(companyStateId integer, interval default '10 year')
RETURNS SETOF JSON
AS $$
-- flatten holdings, simpler to deal with (companyStateId, ...holding) than the joining tables
WITH RECURSIVE _holding(id, "holdingId", "transactionId", name, "companyStateId") as (
        SELECT h.id, "holdingId", h."transactionId", name, cs.id
        from holding h
        join h_list_j hlj on h.id = hlj.h_j_id
        join company_state cs on cs.h_list_id = hlj.holdings_id
),
--- run back until root, ignore interval because a never modified holding might not be included
prev_company_states(id, "previousCompanyStateId",  generation) as (
    SELECT t.id, t."previousCompanyStateId", 0 FROM company_state as t where t.id =  $1
    UNION ALL
    SELECT t.id, t."previousCompanyStateId", generation + 1
    FROM company_state t, prev_company_states tt
    WHERE t.id = tt."previousCompanyStateId"
),
-- previous holdings for every company_state, with the newestHoldingId  (the current id for each holding)
prev_holdings as (
    SELECT cs.id, cs."previousCompanyStateId", h."holdingId", h."transactionId", h.id as "hId", generation
    FROM prev_company_states as cs
    left outer JOIN _holding h on h."companyStateId" = cs.id
),
person_holdings as (
    SELECT DISTINCT ON (p."personId", ph."transactionId", "holdingId")
    ph."hId" "hId",
    p."personId",
    ph."transactionId",
    ph."holdingId",
    generation
    FROM prev_holdings ph
    LEFT OUTER JOIN "holder" hj on ph."hId" = hj."holdingId"
    LEFT OUTER JOIN person p on hj."holderId" = p.id
),

-- get parcels for a given holdingId
parcels as (
    SELECT pj."holdingId", sum(p.amount) as amount, p."shareClass"
    FROM "parcel_j" pj
    LEFT OUTER JOIN parcel p on p.id = pj."parcelId"
    where amount > 0
    GROUP BY p."shareClass", pj."holdingId"
)
SELECT array_to_json(array_agg(row_to_json(q) ORDER BY q."shareClass", q.name))

FROM (

WITH transaction_history as (
    SELECT ph."personId", t.*, format_iso_date("effectiveDate") as "effectiveDate",  ph."hId",
    (tt.parcels->>'amount')::int as "amount",
    (tt.parcels->>'shareClass')::int as "shareClass",
    (tt.parcels->>'beforeAmount')::int as "beforeAmount",
    (tt.parcels->>'afterAmount')::int as "afterAmount",

    (SELECT array_to_json(array_agg(row_to_json(qq))) FROM (SELECT *, holding_persons(h.id) from transaction_siblings(t.id) t join holding h on h."transactionId" = t.id ) qq) as siblings,
    "holdingId",
    generation
    FROM person_holdings ph
    INNER JOIN transaction t on t.id = ph."transactionId"
    LEFT OUTER JOIN (
    select q.id,  jsonb_array_elements(data->'parcels') as parcels from (
    select id, data from transaction
    ) q) tt on t.id = tt.id

    ORDER BY generation
)

SELECT *,
    ( SELECT array_to_json(array_agg(row_to_json(qq)))
    FROM transaction_history qq
    WHERE qq."personId" = q."personId" AND  (qq."shareClass" = q."shareClass" or qq."shareClass" IS NULL and q."shareClass" IS NULL)
    AND qq."holdingId" = q."holdingId"
    AND  type = ANY(ARRAY['ISSUE_TO', 'SUBDIVISION_TO', 'CONVERSION_TO']::enum_transaction_type[]) )
    AS "issueHistory",

    ( SELECT array_to_json(array_agg(row_to_json(qq)))
    FROM transaction_history qq
    WHERE qq."personId" = q."personId" AND  (qq."shareClass" = q."shareClass" or qq."shareClass" IS NULL and q."shareClass" IS NULL)
    AND qq."holdingId" = q."holdingId"
    AND  type = ANY(ARRAY['REDEMPTION_FROM', 'PURCHASE_FROM', 'ACQUISITION_FROM', 'CONSOLIDATION_FROM']::enum_transaction_type[]) )
    AS "repurchaseHistory",

    ( SELECT array_to_json(array_agg(row_to_json(qq)))
    FROM transaction_history qq
    WHERE qq."personId" = q."personId" AND  (qq."shareClass" = q."shareClass" or qq."shareClass" IS NULL and q."shareClass" IS NULL)
    AND qq."holdingId" = q."holdingId"
    AND  type = ANY(ARRAY['TRANSFER_TO']::enum_transaction_type[]) )
    AS "transferHistoryTo",

    ( SELECT array_to_json(array_agg(row_to_json(qq)))
    FROM transaction_history qq
    WHERE qq."personId" = q."personId" AND  (qq."shareClass" = q."shareClass" or qq."shareClass" IS NULL and q."shareClass" IS NULL)
    AND qq."holdingId" = q."holdingId"
    AND  type = ANY(ARRAY['TRANSFER_FROM']::enum_transaction_type[]) )
    AS "transferHistoryFrom",

    ( SELECT array_to_json(array_agg(row_to_json(qq)))
    FROM transaction_history qq
    WHERE qq."personId" = q."personId" AND  (qq."shareClass" = "shareClass" or qq."shareClass" IS NULL and q."shareClass" IS NULL)
    AND qq."holdingId" = q."holdingId"
      AND (data->>amount::text)::int != 0
    AND  type = ANY(ARRAY['AMEND', 'REMOVE_ALLOCATION', 'NEW_ALLOCATION']::enum_transaction_type[]) )
    AS "ambiguousChanges"



FROM

    (SELECT DISTINCT ON ("personId", "holdingId", "shareClass")
    p."personId",
    first_value(p.name) OVER wnd as name,
    first_value(p."companyNumber") OVER wnd as "companyNumber",
    first_value(h."companyStateId") OVER wnd = $1 as current,
    first_value(p.address) OVER wnd as address,
    CASE WHEN first_value(h."companyStateId") OVER wnd = $1 THEN first_value(pp.amount) OVER wnd ELSE 0 END as amount,
    first_value(pp.amount) OVER wnd as last_amount,
    pp."shareClass" as  "shareClass",
    first_value(h."holdingId") OVER wnd as "holdingId",
    first_value(h."name") OVER wnd as "holdingName",
    first_value(h."id") OVER wnd as "newestHoldingId",
    first_value(h."companyStateId") OVER wnd as "lastCompanyStateId",
    format_iso_date(t."effectiveDate") as "lastEffectiveDate"
    from prev_company_states pt
    join company_state cs on pt.id = cs.id
    join transaction t on cs."transactionId" = t.id
    left outer join _holding h on h."companyStateId" = pt.id
    join parcels pp on pp."holdingId" = h.id
    left outer join "holder" hj on h.id = hj."holdingId"
    left outer join person ppp on hj."holderId" = ppp.id
    join company_persons($1) p on p."personId" = ppp."personId"
    WHERE t."effectiveDate" <= now() and t."effectiveDate" >= now() - $2  --and pp is not null
     WINDOW wnd AS (
       PARTITION BY p."personId", h."holdingId", pp."shareClass" ORDER BY generation asc
     )) as q
    ) as q

$$ LANGUAGE SQL STABLE;



CREATE OR REPLACE FUNCTION billing_info()
    RETURNS SETOF json
        AS $$
    SELECT row_to_json(qq)
    FROM (
    SELECT identifier::int as "userId", q.id as "companyId", not q.deleted as active, cs."companyName" FROM (
        SELECT identifier, "userId", c.deleted, c.id, company_now(c.id) as "companyStateId" FROM passport
        LEFT OUTER JOIN company c on c."ownerId" = "userId"
        WHERE provider = 'catalex'
    ) q
    JOIN company_state cs on cs.id = "companyStateId"
    ) qq
$$ LANGUAGE SQL;
