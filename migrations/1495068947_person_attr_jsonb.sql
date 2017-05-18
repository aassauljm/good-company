ALTER TABLE person
  ALTER COLUMN attr
  SET DATA TYPE jsonb
  USING attr::jsonb;