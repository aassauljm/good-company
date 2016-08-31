

ALTER TABLE "company_state" DROP CONSTRAINT "company_state_original_historic_action_id_fkey";

ALTER TABLE "company_state" DROP COLUMN "original_historic_action_id";



ALTER TABLE "company" ADD COLUMN "historic_source_data_id" integer;


ALTER TABLE "company" ADD CONSTRAINT company_historic_source_data_id_fkey FOREIGN KEY (historic_source_data_id)
      REFERENCES public.source_data (id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL;