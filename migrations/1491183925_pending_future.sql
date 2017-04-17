
ALTER TABLE company_state ADD column pending_future_action_id UUID;

ALTER TABLE company_state ADD CONSTRAINT company_state_pending_future_action_id_fkey FOREIGN KEY (pending_future_action_id)
      REFERENCES public.action (id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL;