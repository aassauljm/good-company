ALTER TABLE action
  ALTER COLUMN data
  SET DATA TYPE jsonb
  USING data::jsonb;