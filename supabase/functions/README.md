# Supabase Edge Functions for BetTask

This directory contains Supabase Edge Functions for the BetTask application.

## Reminders Function

The `reminders` function is a scheduled function that checks for pending reminders and sends notifications to users with upcoming challenge deadlines.

### Local Development

1. Install the Supabase CLI if you haven't already:
   ```bash
   npm install -g supabase
   ```

2. Update environment variables in `supabase/functions/.env`:
   ```
   SUPABASE_URL=https://<your-project-ref>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<your-secret-service-role-key>
   ```

3. Start the function locally:
   ```bash
   supabase functions serve reminders
   ```

4. Test the function with a local request:
   ```bash
   curl -i --location --request POST 'http://localhost:54321/functions/v1/reminders'
   ```

### Deployment

1. Deploy the function to your Supabase project:
   ```bash
   supabase functions deploy reminders
   ```

2. Set environment variables for the deployed function:
   ```bash
   supabase secrets set --env-file ./functions/.env
   ```

3. Run the SQL in `supabase/migrations/20240601_schedule_reminders.sql` to schedule the function:
   ```bash
   supabase db execute --file supabase/migrations/20240601_schedule_reminders.sql
   ```

### Monitoring and Logs

View function logs:
```bash
supabase functions logs reminders
```

## Function Details

### Reminders Function

- Scheduled to run every 15 minutes via pg_cron
- Fetches pending reminders from the database
- Sends notifications to users via WhatsApp (simulated in development)
- Updates reminder status after sending

## Troubleshooting

- **Function not running**: Check logs and ensure the cron job is properly scheduled
- **Environment variables not available**: Verify they are set correctly using `supabase secrets list`
- **Database connection issues**: Verify the service role key has the necessary permissions 