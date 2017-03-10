--no-transaction
--split-statements
alter type enum_permission_relation add value 'organisation';

alter table permission add column "entityId" integer;

alter table permission add column "allow" boolean default true;