CREATE SEQUENCE h_person_list_id_seq
  INCREMENT 1
  MINVALUE 1
  MAXVALUE 9223372036854775807
  START 1
  CACHE 1;

CREATE TABLE h_person_list
(
  id integer NOT NULL DEFAULT nextval('h_person_list_id_seq'::regclass),
  "createdAt" timestamp with time zone NOT NULL,
  "updatedAt" timestamp with time zone NOT NULL,
  CONSTRAINT h_person_list_pkey PRIMARY KEY (id)
);




CREATE TABLE h_person_list_j
(
  "createdAt" timestamp with time zone NOT NULL,
  "updatedAt" timestamp with time zone NOT NULL,
  person_id integer NOT NULL,
  h_person_list_id integer NOT NULL,
  CONSTRAINT h_person_list_j_pkey PRIMARY KEY (person_id, h_person_list_id),
  CONSTRAINT h_person_list_j_person_list_id_fkey FOREIGN KEY (h_person_list_id)
      REFERENCES h_person_list (id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT h_person_list_j_person_id_fkey FOREIGN KEY (person_id)
      REFERENCES person (id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE CASCADE
);





ALTER TABLE company_state ADD COLUMN h_person_list_id integer;

ALTER TABLE company_state
ADD CONSTRAINT company_state_h_person_list_id_fkey
FOREIGN KEY (h_person_list_id)
REFERENCES h_person_list;

