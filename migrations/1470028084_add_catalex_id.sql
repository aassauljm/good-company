ALTER TABLE public.user ADD COLUMN catalex_id INTEGER;
ALTER TABLE public.user ADD CONSTRAINT catalex_id_constraint UNIQUE (catalex_id);