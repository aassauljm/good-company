ALTER TABLE company_state ADD COLUMN extensive BOOLEAN ;
UPDATE company_state SET warnings = get_warnings(id);