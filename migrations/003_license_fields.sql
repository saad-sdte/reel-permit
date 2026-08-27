-- ============================================================================
-- 003_license_fields.sql — issued-license details + renewal reminders
-- ----------------------------------------------------------------------------
-- Populated by the admin "Upload License & Send" action. license_valid_to
-- drives the renewal-reminder email (sent 14 days before expiry by the daily
-- cron, once, unless the customer opted out via the signed link).
-- ============================================================================

alter table applications add column if not exists license_number    text;
alter table applications add column if not exists license_valid_from date;
alter table applications add column if not exists license_valid_to   date;
alter table applications add column if not exists renewal_opt_out_at timestamptz;

create index if not exists applications_renewal_idx
  on applications (license_valid_to)
  where status = 'delivered' and license_valid_to is not null;
