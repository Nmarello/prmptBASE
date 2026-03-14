-- Replace trigger function with correct pg_net call
CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url     := 'https://knlelqirhlvgvmmwiske.supabase.co/functions/v1/send-welcome-email',
    body    := jsonb_build_object('record', row_to_json(NEW)),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubGVscWlyaGx2Z3ZtbXdpc2tlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYzOTM0MSwiZXhwIjoyMDg4MjE1MzQxfQ.jRGOTTMKXZnJG7DKWDAVVk6Fus_nTwalDMCMsdcYdD8'
    )
  );
  RETURN NEW;
END;
$$;
