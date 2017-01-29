ALTER TABLE transaction
  ALTER COLUMN data
  SET DATA TYPE jsonb
  USING data::jsonb;