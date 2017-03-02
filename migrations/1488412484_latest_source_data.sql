ALTER TABLE company ADD COLUMN latest_source_data_id integer;

ALTER TABLE company ADD CONSTRAINT company_latest_source_data_id_fkey FOREIGN KEY (latest_source_data_id)
      REFERENCES public.source_data (id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL