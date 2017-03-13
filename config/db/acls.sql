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


CREATE OR REPLACE FUNCTION get_user(_tbl regclass, id integer, OUT result integer) AS
$func$
BEGIN
EXECUTE format('SELECT "userId" FROM %s WHERE id = %s', $1, $2)
INTO result;
END
$func$ LANGUAGE plpgsql;

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
        WHEN  p."relation" = 'organisation' and $2 IS NOT NULL   THEN 'org:' || get_org(m.identity, $2)
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
