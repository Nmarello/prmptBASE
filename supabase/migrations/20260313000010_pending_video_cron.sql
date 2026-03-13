-- Enable extensions (no-op if already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any existing job with this name before recreating
SELECT cron.unschedule('process-pending-videos') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'process-pending-videos'
);

-- Run background video processor every 2 minutes
SELECT cron.schedule(
  'process-pending-videos',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://knlelqirhlvgvmmwiske.supabase.co/functions/v1/process-pending-videos',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubGVscWlyaGx2Z3ZtbXdpc2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzkzNDEsImV4cCI6MjA4ODIxNTM0MX0.o7xSpuOl-1-6C9MZcFDm-XIwMhJdvIiZNlL6ZSwKTsc',
      'apikey',        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubGVscWlyaGx2Z3ZtbXdpc2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzkzNDEsImV4cCI6MjA4ODIxNTM0MX0.o7xSpuOl-1-6C9MZcFDm-XIwMhJdvIiZNlL6ZSwKTsc'
    ),
    body    := '{}'::jsonb
  );
  $$
);
