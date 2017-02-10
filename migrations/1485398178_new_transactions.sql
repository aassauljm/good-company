--no-transaction
--split-statements
alter type enum_activity_log_type add value 'AMEND_CONSTITUION';
alter type enum_activity_log_type add value 'REVOKE_CONSTITUION';
alter type enum_activity_log_type add value 'REPLACE_CONSTITUION';
alter type enum_activity_log_type add value 'REPLACE_SHARE_CLASS';