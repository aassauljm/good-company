CREATE TABLE public.event
(
  id integer NOT NULL DEFAULT nextval('event_id_seq'::regclass),
  date timestamp with time zone,
  data json,
  "createdAt" timestamp with time zone NOT NULL,
  "updatedAt" timestamp with time zone NOT NULL,
  "userId" integer,
  "companyId" integer,
  CONSTRAINT event_pkey PRIMARY KEY (id),
  CONSTRAINT "event_companyId_fkey" FOREIGN KEY ("companyId")
      REFERENCES public.company (id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "event_userId_fkey" FOREIGN KEY ("userId")
      REFERENCES public."user" (id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL
)