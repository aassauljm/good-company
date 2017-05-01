CREATE SEQUENCE public."COAuthorities_id_seq"
  INCREMENT 1
  MINVALUE 1
  MAXVALUE 9223372036854775807
  START 10000
  CACHE 1;

CREATE TABLE co_authority
(
  id integer NOT NULL DEFAULT nextval('co_authority_id_seq'::regclass),
  allowed boolean DEFAULT true,
  "createdAt" timestamp with time zone NOT NULL,
  "updatedAt" timestamp with time zone NOT NULL,
  "APICredentialId" integer,
  "companyId" integer,
  CONSTRAINT co_authority_pkey PRIMARY KEY (id),
  CONSTRAINT "co_authority_APICredentialId_fkey" FOREIGN KEY ("APICredentialId")
      REFERENCES public.api_credential (id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "co_authority_companyId_fkey" FOREIGN KEY ("companyId")
      REFERENCES public.company (id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL
)


CREATE UNIQUE INDEX co_authority_idx
  ON public.co_authority
  USING btree
  ("APICredentialId", "companyId");