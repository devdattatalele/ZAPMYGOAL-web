-- Enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the reminders function to run every 15 minutes
SELECT cron.schedule(
  'send_reminders',
  '*/15 * * * *',
  'https://azuslvofwpnqoxdvvpqg.functions.supabase.co/reminders'
); 