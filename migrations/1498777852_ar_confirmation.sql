--no-transaction
--split-statements
alter type enum_activity_log_type add value 'REQUEST_AR_CONFIRMATION';
alter type enum_activity_log_type add value 'AR_CONFIRMATION';
alter type enum_activity_log_type add value 'AR_CONFIRMATION_FEEDBACK';