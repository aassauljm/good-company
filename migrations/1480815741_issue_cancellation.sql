--no-transaction
--split-statements
alter type enum_activity_log_type add value 'CANCELLATION';
alter type enum_activity_log_type add value 'CANCELLATION_FROM';
alter type enum_activity_log_type add value 'REISSUE';
alter type enum_activity_log_type add value 'REISSUE_TO';

alter type enum_transaction_type add value 'CANCELLATION';
alter type enum_transaction_type add value 'CANCELLATION_FROM';
alter type enum_transaction_type add value 'REISSUE';
alter type enum_transaction_type add value 'REISSUE_TO';