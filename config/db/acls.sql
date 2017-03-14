--create types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ace') THEN
        CREATE TYPE ace AS (
            permission TEXT,
            principal TEXT,
            allow BOOLEAN
        );
    END IF;
END$$;

CREATE OR REPLACE FUNCTION get_owner(_tbl regclass, id integer, OUT result integer) AS
$func$
BEGIN
EXECUTE format('SELECT "ownerId" FROM %s WHERE id = %s', $1, $2)
INTO result;
END
$func$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION get_owner(_tbl regclass, id integer, OUT result integer) AS
$func$
BEGIN
EXECUTE format('SELECT "ownerId" FROM %s WHERE id = %s', $1, $2)
INTO result;
END
$func$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION get_company_owner(_tbl regclass, id integer)
RETURNS INTEGER
    AS $$
    SELECT "ownerId" from company where id = $2;
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION get_org(_tbl regclass, id integer, OUT result integer) AS
$func$
BEGIN
EXECUTE format('SELECT 10')
INTO result;
END
$func$ LANGUAGE plpgsql;

DROP FUNCTION generate_aces(text,integer);
CREATE OR REPLACE FUNCTION generate_aces(modelName text,  entityId integer default NULL)
    RETURNS SETOF ace
        AS $$
            SELECT * FROM (
            SELECT action::text as permission,
             CASE
        WHEN p."relation" = 'role' AND $2 IS NULL THEN 'role:' || p."roleId"
        WHEN  p."relation" = 'organisation' and $2 IS NOT NULL THEN 'org:' || get_org(m.identity, $2)
        WHEN  p."relation" = 'user' and $2 IS NOT NULL   THEN 'id:' || get_user(m.identity, $2)
        WHEN  p."relation" = 'owner' and $2 IS NOT NULL  THEN 'id:' || get_owner(m.identity, $2)
        ELSE null
         END as principal,
         allow
            FROM model m
            LEFT OUTER JOIN permission p on m.id = p."modelId"

            WHERE $1 = m.name
            ORDER BY p."userId" is not null
            ) q WHERE principal IS NOT NULL
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION generate_principals(userId integer)
    RETURNS SETOF text
    AS $$
        SELECT 'id:' || $1

        UNION

        SELECT 'role:' || r.id
            FROM user_roles ur
            LEFT OUTER JOIN role r on ur."roleId" = r.id
            WHERE ur."userId" = $1

        UNION

        SELECT 'org:' || 10

$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION get_permissions(userId integer, action text, modelName text, entityId integer default NULL)
    RETURNS SETOF TEXT
        AS $$

        WITH principals as (
            SELECT generate_principals($1) as principal
        ),
        aces as (
            SELECT (a).permission, (a).principal, (a).allow, row_number() OVER () as index FROM generate_aces($3, $4) a
        )
        SELECT permission FROM aces a
        JOIN principals p on a.principal = p.principal
        WHERE allow = TRUE
        ORDER BY index
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION check_permission(userId integer, permission text, modelName text, entityId integer default NULL)
    RETURNS BOOLEAN
        AS $$

        WITH principals as (
            SELECT generate_principals($1) as principal
        ),
        aces as (
            SELECT (a).permission, (a).principal, (a).allow, row_number() OVER () as index FROM generate_aces($3, $4) a
        )
        SELECT COALESCE((SELECT a.allow
        FROM aces a
        JOIN principals p on a.principal = p.principal
        WHERE permission = $2
        ORDER BY index
        LIMIT 1), FALSE)
$$ LANGUAGE SQL;

