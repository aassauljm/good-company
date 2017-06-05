
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
    CASE WHEN tt.method = 'NEW_ALLOCATION' THEN (tt.parcels->>'amount')::int ELSE (tt.parcels->>'afterAmount')::int END as "afterAmount",

    (SELECT array_to_json(array_agg(row_to_json(qq))) FROM (SELECT *, holding_persons(h.id) from transaction_siblings(t.id) t join holding h on h."transactionId" = t.id ) qq) as siblings,
    "holdingId",
    generation
    FROM person_holdings ph
    INNER JOIN transaction t on t.id = ph."transactionId"
    LEFT OUTER JOIN (
    select q.id,   data->>'transactionMethod' as method, jsonb_array_elements(data->'parcels') as parcels from (
    select id, data from transaction
    ) q) tt on t.id = tt.id
    WHERE (tt.parcels->>'amount')::int  > 0
    ORDER BY generation
)

SELECT *,
    format_iso_date(now()) as "endDate",
    format_iso_date(now() - $2) as "startDate",
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
    hj.data as "holderData",
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