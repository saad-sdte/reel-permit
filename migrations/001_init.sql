-- ============================================================================
-- 001_init.sql — Castline core data model
-- ----------------------------------------------------------------------------
-- Applied by scripts/migrate.mjs (node scripts/migrate.mjs), which records
-- applied migrations in schema_migrations and runs each file in a transaction.
--
-- PII POLICY (do not weaken):
--   * form_data holds the MASKED submission only — SSNs are stored as
--     ***-**-1234 (last 4). The full SSN is never persisted anywhere.
--   * Card data NEVER appears in this database in any form. Payments store
--     only NMI transaction ids, brand, last4, and gateway response metadata.
--   * email_log stores metadata (type/recipient/subject/message id), never
--     full rendered bodies.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- applications — one row per submitted license application
-- status lifecycle:
--   pending_payment -> received -> processing -> delivered
--        |                \-> missing_info -> processing/delivered
--        |                \-> future_pending -> processing/delivered
--        \-> payment_failed -> received (retry success) | cancelled (day 8)
--   received/processing/delivered -> refunded (manual, admin)
-- ---------------------------------------------------------------------------
create table if not exists applications (
  id               uuid primary key default gen_random_uuid(),
  reference        text not null unique,
  state_slug       text not null,
  residency        text not null default '',
  license_id       text not null,
  addon_ids        jsonb not null default '[]',
  email            text,
  first_name       text,
  last_name        text,
  phone            text,
  form_data        jsonb not null default '{}',   -- MASKED submission data only
  consents         jsonb not null default '{}',
  amount_cents     integer not null check (amount_cents >= 0),
  currency         text not null default 'USD',
  status           text not null default 'pending_payment'
                   check (status in ('pending_payment','payment_failed','received',
                                     'processing','missing_info','future_pending',
                                     'delivered','cancelled','refunded')),
  status_reason    text,
  existing_license_expires_on date,               -- set when status = future_pending
  nmi_customer_vault_id text,                     -- set only when vaulting enabled
  submitted_at     timestamptz not null default now(),
  paid_at          timestamptz,
  payment_failed_at timestamptz,                  -- anchors the dunning schedule
  delivered_at     timestamptz,
  cancelled_at     timestamptz,
  refunded_at      timestamptz,
  updated_at       timestamptz not null default now()
);

create index if not exists applications_email_idx  on applications (lower(email));
create index if not exists applications_status_idx on applications (status);
create index if not exists applications_dunning_idx on applications (status, payment_failed_at)
  where status = 'payment_failed';

-- ---------------------------------------------------------------------------
-- payments — one row per gateway attempt (sale, retry sale, refund, void)
-- ---------------------------------------------------------------------------
create table if not exists payments (
  id               uuid primary key default gen_random_uuid(),
  application_id   uuid not null references applications(id) on delete cascade,
  kind             text not null default 'sale'
                   check (kind in ('sale','retry_sale','refund','void','validate')),
  source           text not null default 'checkout'
                   check (source in ('checkout','retry_page','admin','cron','webhook')),
  transaction_id   text,                          -- NMI transactionid (approved+declined both get one)
  amount_cents     integer not null,
  status           text not null
                   check (status in ('approved','declined','error','refunded','voided')),
  decline_code     text,                          -- normalized enum from lib/nmi declineInfo()
  decline_message  text,                          -- customer-safe message actually shown
  gateway_code     text,                          -- raw NMI response_code (e.g. '202')
  card_brand       text,
  card_last4       text,
  billing_zip      text,
  descriptor       text,
  dev_mode         boolean not null default false,
  raw_response     jsonb,                         -- sanitized gateway response (never card data)
  idempotency_key  text unique,                   -- ours: guards double-charges on retries
  created_at       timestamptz not null default now()
);

create index if not exists payments_application_idx on payments (application_id, created_at desc);
create unique index if not exists payments_txn_idx on payments (transaction_id) where transaction_id is not null;

-- ---------------------------------------------------------------------------
-- payment_events — append-only audit trail (charges, webhooks, status moves)
-- ---------------------------------------------------------------------------
create table if not exists payment_events (
  id               bigint generated always as identity primary key,
  application_id   uuid references applications(id) on delete cascade,
  payment_id       uuid references payments(id) on delete set null,
  source           text not null,                 -- checkout | retry_page | webhook | admin | cron | system
  event_type       text not null,                 -- charge_attempt | approved | declined | error |
                                                  -- status_change | webhook_received | refund | token_issued | ...
  detail           jsonb,
  created_at       timestamptz not null default now()
);

create index if not exists payment_events_app_idx on payment_events (application_id, created_at desc);

-- ---------------------------------------------------------------------------
-- email_log — idempotency ledger for every outbound email
-- Reserve-then-send: INSERT (status='sending') ... ON CONFLICT DO NOTHING;
-- only the winner sends, then flips to sent/failed. The partial unique index
-- is the hard guarantee that (application, type, step) goes out at most once.
-- ---------------------------------------------------------------------------
create table if not exists email_log (
  id                  bigint generated always as identity primary key,
  application_id      uuid references applications(id) on delete cascade,
  email_type          text not null,              -- application_received | payment_receipt | license_delivered |
                                                  -- payment_declined | payment_reminder | final_notice |
                                                  -- application_cancelled | missing_info | refund_confirmation |
                                                  -- renewal_reminder | ops_alert | contact_* ...
  sequence_step       integer not null default 0, -- dunning step (2/4/7) or 0
  recipient           text not null,
  subject             text,
  provider_message_id text,
  status              text not null default 'sending'
                      check (status in ('sending','sent','failed','skipped')),
  error               text,
  meta                jsonb,                      -- small props reference — never full bodies
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create unique index if not exists email_log_once_idx
  on email_log (application_id, email_type, sequence_step)
  where status in ('sending','sent') and application_id is not null;

create index if not exists email_log_app_idx on email_log (application_id, created_at desc);

-- ---------------------------------------------------------------------------
-- retry_tokens — no-login payment retry links (/pay/{token})
-- The raw token is random 256-bit, sent only in email; we store its sha256.
-- Single-active policy: issuing a new token supersedes prior active ones.
-- ---------------------------------------------------------------------------
create table if not exists retry_tokens (
  id               uuid primary key default gen_random_uuid(),
  application_id   uuid not null references applications(id) on delete cascade,
  token_hash       text not null unique,          -- sha256 hex of the raw token
  expires_at       timestamptz not null,
  used_at          timestamptz,
  superseded_at    timestamptz,
  created_at       timestamptz not null default now()
);

create index if not exists retry_tokens_app_idx on retry_tokens (application_id);

-- ---------------------------------------------------------------------------
-- webhook_events — every received gateway webhook, verified or not
-- ---------------------------------------------------------------------------
create table if not exists webhook_events (
  id               bigint generated always as identity primary key,
  provider         text not null default 'nmi',
  event_id         text,
  event_type       text,
  signature_valid  boolean not null default false,
  payload          jsonb not null,
  processed        boolean not null default false,
  process_error    text,
  received_at      timestamptz not null default now()
);

create unique index if not exists webhook_events_dedupe_idx
  on webhook_events (provider, event_id) where event_id is not null;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists applications_updated_at on applications;
create trigger applications_updated_at
  before update on applications
  for each row execute function set_updated_at();

drop trigger if exists email_log_updated_at on email_log;
create trigger email_log_updated_at
  before update on email_log
  for each row execute function set_updated_at();
