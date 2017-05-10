
DROP INDEX co_authority_idx;


ALTER TABLE co_authority DROP CONSTRAINT  IF EXISTS "co_authority_APICredentialId_fkey";

ALTER TABLE co_authority DROP COLUMN  IF EXISTS "APICredentialId";

ALTER TABLE co_authority ADD COLUMN  "userId" INTEGER;


ALTER TABLE co_authority ADD   CONSTRAINT "co_authority_userId_fkey" FOREIGN KEY ("userId")
      REFERENCES public."user" (id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL;




  CREATE UNIQUE INDEX co_authority_idx
  ON public.co_authority
  USING btree
  ("userId", "companyId");