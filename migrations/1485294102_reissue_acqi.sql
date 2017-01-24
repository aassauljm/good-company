--no-transaction
--split-statements
alter type enum_activity_log_type add value 'TRANSFER_TO_ACQUISITION';
alter type enum_activity_log_type add value 'TRANSFER_FROM_ACQUISITION';
alter type enum_activity_log_type add value 'TRANSFER_FROM_REISSUE';
alter type enum_activity_log_type add value 'TRANSFER_TO_REISSUE';

