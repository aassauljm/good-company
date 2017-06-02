--create types


-- THIS MEANS WE CANT SAVE THEM FOR NOW
DROP TYPE IF EXISTS ace CASCADE;

CREATE TYPE ace AS (
            permission enum_permission_action,
            principal TEXT,
            allow BOOLEAN
        );

CREATE OR REPLACE FUNCTION get_owner(_tbl regclass, id integer, OUT result integer) AS
    $func$
    BEGIN
    EXECUTE format('SELECT "ownerId" FROM %s WHERE id = %s', $1, $2)
    INTO result;
    END
$func$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION get_user(_tbl regclass, id integer, OUT result integer) AS
    $func$
    BEGIN
    EXECUTE format('SELECT "userId" FROM %s WHERE id = %s', $1, $2)
    INTO result;
    END
$func$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION get_user_organisation(userId integer)
    RETURNS INTEGER
    STABLE AS $$
      SELECT o."organisationId"
      FROM passport p
      JOIN organisation o on p.identifier = o."catalexId"
      WHERE  p."userId" = $1 and provider = 'catalex'
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION get_org(_tbl regclass, id integer, OUT result integer) AS
    $func$
    BEGIN
    EXECUTE format('SELECT get_user_organisation("ownerId") FROM %s WHERE id = %s', $1, $2)
    INTO result;
    END
$func$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_company_owner(_tbl regclass, id integer)
RETURNS INTEGER
    AS $$
    SELECT "ownerId" from company where id = $2;
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION generate_aces(modelName text, entityId integer default NULL)
    RETURNS SETOF ace
       STABLE  AS $$
            SELECT * FROM (
            SELECT action as permission,
             CASE
        WHEN p."relation" = 'role' THEN 'role:' || p."roleId"
        WHEN p."relation" = 'organisation' and $2 IS NOT NULL THEN 'org:' || get_org(m.identity, $2)
        WHEN p."relation" = 'organisation_admin' and $2 IS NOT NULL THEN 'orgAdmin:' || get_org(m.identity, $2)
        WHEN p."relation" = 'user' and (($2 IS NOT NULL  AND "entityId" = $2) OR ($2 IS NULL AND entityId is NULL))   THEN 'id:' || p."userId"
        WHEN p."relation" = 'owner' and $2 IS NOT NULL  THEN 'id:' || get_owner(m.identity, $2)
        WHEN p."relation" = 'catalex' and (($2 IS NOT NULL  AND "entityId" = $2) OR ($2 IS NULL AND entityId is NULL)) THEN 'catalexId:' || p."catalexId"
         END as principal,
         allow
            FROM model m
            LEFT OUTER JOIN permission p on m.id = p."modelId"

            WHERE $1 = m.name

            ORDER BY(p."relation"='user', p."relation"='catalex', p."relation"='owner', p."relation"='organisation',p."relation"='organisation_admin', p."relation"='role') DESC
            ) q WHERE principal IS NOT NULL
$$ LANGUAGE SQL;




CREATE OR REPLACE FUNCTION generate_principals(userId integer)
    RETURNS SETOF text
    STABLE AS $$
        SELECT 'id:' || $1

        UNION

        SELECT 'role:' || r.id
            FROM user_roles ur
            LEFT OUTER JOIN role r on ur."roleId" = r.id
            WHERE ur."userId" = $1

        UNION

        SELECT 'org:' || get_user_organisation($1)

        UNION

        SELECT 'role:' || (SELECT id::text FROM role where name = 'organisationMember' LIMIT 1)
            WHERE get_user_organisation($1) IS NOT NULL

        UNION

        SELECT 'catalexId:' || identifier
            FROM passport
            WHERE "userId" = $1 AND provider = 'catalex'

        UNION

        SELECT 'orgAdmin:' || o."organisationId"
        FROM passport p
        JOIN organisation o on p.identifier = o."catalexId" AND 'organisation_admin' = ANY(o.roles)
        WHERE  p."userId" = $1 and provider = 'catalex'

$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION generate_principals_catalex_user( catalexId text)
    RETURNS SETOF text
    STABLE AS $$
        SELECT generate_principals(p."userId")
        FROM passport p
        WHERE p.identifier = $1 and provider = 'catalex'

        UNION

        SELECT 'org:' || o."organisationId"
        FROM organisation o
        WHERE o."catalexId" = $1

        UNION

        SELECT 'role:' || (SELECT id::text FROM role where name = 'organisationMember' LIMIT 1)
        FROM organisation o
        WHERE o."catalexId" = $1

        UNION

        SELECT 'orgAdmin:' || o."organisationId"
        FROM organisation o
        WHERE o."catalexId" = $1 AND 'organisation_admin' = ANY(o.roles)

        UNION

        SELECT 'catalexId:' || $1

$$ LANGUAGE SQL;



CREATE OR REPLACE FUNCTION get_permissions(userId integer, modelName text, entityId integer default NULL)
    RETURNS SETOF enum_permission_action
        STABLE AS $$

        WITH principals as (
            SELECT generate_principals($1) as principal
        ),
        aces as (
            SELECT (a).permission, (a).principal, (a).allow, row_number() OVER () as index FROM generate_aces($2, $3) a
        ),
        first_permissions as (
        SELECT permission, allow, ROW_NUMBER() OVER(PARTITION BY permission  ORDER BY index ASC) AS index
        FROM aces a
        JOIN principals p on a.principal = p.principal
    )
    SELECT permission
    FROM first_permissions
    WHERE index = 1 and allow = TRUE

$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION get_permissions_array(userId integer, modelName text, entityId integer default NULL)
    RETURNS enum_permission_action[] AS $$
    SELECT ARRAY_AGG(p) from get_permissions($1, $2, $3) p
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION get_permissions_catalex_user(catalexId text, modelName text, entityId integer default NULL)
    RETURNS SETOF enum_permission_action
        STABLE AS $$

        WITH principals as (
            SELECT generate_principals_catalex_user($1) as principal
        ),
        aces as (
            SELECT (a).permission, (a).principal, (a).allow, row_number() OVER () as index FROM generate_aces($2, $3) a
        ),
        first_permissions as (
        SELECT permission, allow, ROW_NUMBER() OVER(PARTITION BY permission  ORDER BY index ASC) AS index
        FROM aces a
        JOIN principals p on a.principal = p.principal
    )
    SELECT permission
    FROM first_permissions
    WHERE index = 1 and allow = TRUE
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION check_permission(userId integer, permission text, modelName text, entityId integer default NULL)
    RETURNS BOOLEAN
        STABLE AS $$

        WITH principals as (
            SELECT generate_principals($1) as principal
        ),
        aces as (
            SELECT (a).permission, (a).principal, (a).allow, row_number() OVER () as index FROM generate_aces($3, $4) a
        )
        SELECT COALESCE((SELECT a.allow
        FROM aces a
        JOIN principals p on a.principal = p.principal
        WHERE permission = $2::enum_permission_action
        ORDER BY index
        LIMIT 1), FALSE)
$$ LANGUAGE SQL;

