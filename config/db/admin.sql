
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