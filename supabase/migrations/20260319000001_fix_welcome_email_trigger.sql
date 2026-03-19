-- Fix welcome email trigger: use net.http_post (pg_net) with correct auth header
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://knlelqirhlvgvmmwiske.supabase.co/functions/v1/send-welcome-email',
    body := row_to_json(NEW)::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubGVscWlyaGx2Z3ZtbXdpc2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzkzNDEsImV4cCI6MjA4ODIxNTM0MX0.o7xSpuOl-1-6C9MZcFDm-XIwMhJdvIiZNlL6ZSwKTsc'
    )
  );
  RETURN NEW;
END;
$$;

-- Re-create trigger (drop first to ensure clean state)
DROP TRIGGER IF EXISTS on_new_user_welcome_email ON auth.users;
CREATE TRIGGER on_new_user_welcome_email
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_welcome_email();
