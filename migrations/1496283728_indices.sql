DROP TYPE ace CASCADE;
DROP FUNCTION IF EXISTS get_permissions(integer,text,integer) CASCADE;
DROP FUNCTION IF EXISTS  get_permissions_array(integer,text,integer) CASCADE ;
DROP FUNCTION IF EXISTS  get_permissions_catalex_user(text,text,integer) CASCADE ;


CREATE INDEX IF NOT EXISTS permission_allow_relation_idx
  ON public.permission
  USING btree
  (allow, relation);

CREATE INDEX IF NOT EXISTS permission_allow_relation_user_idx
  ON public.permission
  USING btree
  (allow, relation, "userId");

CREATE INDEX IF NOT EXISTS passport_provider_user_idx
  ON public.passport
  USING btree
  (provider, "userId");
