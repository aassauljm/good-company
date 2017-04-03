CREATE SEQUENCE public.organisation_id_seq
  INCREMENT 1
  MINVALUE 1
  MAXVALUE 9223372036854775807
  START 10000
  CACHE 1;

CREATE TABLE public.organisation
(
  id integer NOT NULL DEFAULT nextval('organisation_id_seq'::regclass),
  "organisationId" integer,
  "catalexId" text,
  name text,
  email text,
  CONSTRAINT organisation_pkey PRIMARY KEY (id)
);


CREATE INDEX "organisation_idx_catalexId"
  ON public.organisation
  USING btree
  ("catalexId");


CREATE INDEX "organisation_idx_organisationId"
  ON public.organisation
  USING btree
  ("organisationId");
