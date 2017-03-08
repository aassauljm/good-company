ALTER TABLE company ADD COLUMN doc_list_id integer;


ALTER TABLE company add CONSTRAINT company_doc_list_id_fkey FOREIGN KEY (doc_list_id)
      REFERENCES public.doc_list (id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL;