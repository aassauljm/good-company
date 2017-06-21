--no-transaction
--split-statements
alter type enum_activity_log_type add value 'UPDATE_SOURCE_DOCUMENTS';
alter type enum_transaction_type add value 'UPDATE_SOURCE_DOCUMENTS';

