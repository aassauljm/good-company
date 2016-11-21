ALTER TABLE company_state ADD COLUMN warnings JSONB;
ALTER TABLE company_state ADD COLUMN alert_settings JSONB;

UPDATE company_state SET warnings = get_warnings(id);