-- ============================================================================
-- 002_dunning_pause.sql — one-click "pause payment reminders" support
-- ----------------------------------------------------------------------------
-- Reminder emails #5–#7 carry a pause link (CAN-SPAM gray-zone courtesy +
-- RFC 8058 one-click List-Unsubscribe). When set, the dunning cron skips the
-- application entirely (it still auto-cancels at Day 8 — pausing stops
-- REMINDERS, not the already-communicated expiry).
-- ============================================================================

alter table applications add column if not exists dunning_paused_at timestamptz;
