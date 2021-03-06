CREATE SEQUENCE public.ar_confirmation_id_seq
  INCREMENT 1
  MINVALUE 1
  MAXVALUE 9223372036854775807
  START 10001
  CACHE 1;
CREATE SEQUENCE public.ar_confirmation_request_id_seq
  INCREMENT 1
  MINVALUE 1
  MAXVALUE 9223372036854775807
  START 10002
  CACHE 1;

CREATE TABLE public.ar_confirmation
(
  id integer NOT NULL DEFAULT nextval('ar_confirmation_id_seq'::regclass),
  year integer,
  "arData" json,
  "createdAt" timestamp with time zone NOT NULL,
  "updatedAt" timestamp with time zone NOT NULL,
  "userId" integer,
  "companyId" integer,
  CONSTRAINT ar_confirmation_pkey PRIMARY KEY (id),
  CONSTRAINT "ar_confirmation_companyId_fkey" FOREIGN KEY ("companyId")
      REFERENCES public.company (id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "ar_confirmation_userId_fkey" FOREIGN KEY ("userId")
      REFERENCES public."user" (id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL
);


CREATE TABLE public.ar_confirmation_request
(
  id integer NOT NULL DEFAULT nextval('ar_confirmation_request_id_seq'::regclass),
  code text,
  feedback text,
  email text,
  "requestBy" text,
  name text,
  confirmed boolean DEFAULT false,
  deleted boolean DEFAULT false,
  "createdAt" timestamp with time zone NOT NULL,
  "updatedAt" timestamp with time zone NOT NULL,
  "arConfirmationId" integer,
  "personId" integer,
  CONSTRAINT ar_confirmation_request_pkey PRIMARY KEY (id),
  CONSTRAINT "ar_confirmation_request_arConfirmationId_fkey" FOREIGN KEY ("arConfirmationId")
      REFERENCES public.ar_confirmation (id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "ar_confirmation_request_personId_fkey" FOREIGN KEY ("personId")
      REFERENCES public.person (id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL
)