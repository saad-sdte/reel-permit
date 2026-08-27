-- ============================================================================
-- 004_future_pending.sql — park paid apps until an existing annual license expires
-- ----------------------------------------------------------------------------
-- Ops marks applications future_pending when the customer already holds an
-- active annual license. existing_license_expires_on is the date the team
-- waits for before re-processing / applying for the new license.
-- ============================================================================

alter table applications
  add column if not exists existing_license_expires_on date;

alter table applications drop constraint if exists applications_status_check;

alter table applications
  add constraint applications_status_check
  check (status in (
    'pending_payment',
    'payment_failed',
    'received',
    'processing',
    'missing_info',
    'future_pending',
    'delivered',
    'cancelled',
    'refunded'
  ));

create index if not exists applications_future_pending_idx
  on applications (existing_license_expires_on)
  where status = 'future_pending' and existing_license_expires_on is not null;
