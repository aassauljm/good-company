CREATE SEQUENCE public.annual_return_id_seq
  INCREMENT 1
  MINVALUE 1
  MAXVALUE 9223372036854775807
  START 10587
  CACHE 1;


CREATE TABLE annual_return
(
  id integer NOT NULL DEFAULT nextval('annual_return_id_seq'::regclass),
  "effectiveDate" timestamp with time zone,
  "createdAt" timestamp with time zone NOT NULL,
  "updatedAt" timestamp with time zone NOT NULL,
  "companyId" integer,
  "documentId" integer,
  CONSTRAINT annual_return_pkey PRIMARY KEY (id),
  CONSTRAINT "annual_return_companyId_fkey" FOREIGN KEY ("companyId")
      REFERENCES public.company (id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "annual_return_documentId_fkey" FOREIGN KEY ("documentId")
      REFERENCES public.document (id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL
)
WITH (
  OIDS=FALSE
);


-- Index: public.annual_return_company_id_idx

-- DROP INDEX public.annual_return_company_id_idx;

CREATE INDEX annual_return_company_id_idx
  ON public.annual_return
  USING btree
  ("companyId");


INSERT INTO annual_return ("companyId", "documentId", "effectiveDate", "createdAt", "updatedAt") ((
SELECT c.id, d.id, date, now(), now()
    FROM company c
    JOIN company_state cs ON cs.id = c."currentCompanyStateId"
        LEFT OUTER JOIN doc_list_j dlj on cs.doc_list_id = dlj.doc_list_id
        LEFT OUTER JOIN document d on d.id = dlj.document_id
    WHERE type = 'Companies Office' and (filename = 'File Annual Return' or filename = 'Online Annual Return' or filename = 'Annual Return Filed')
));
