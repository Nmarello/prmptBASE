-- Require authentication for feedback and support_conversations inserts.
-- Previously allowed anon inserts (with check (true)) — no spam protection.
-- Pre-login support widget must prompt sign-in before submitting.

drop policy if exists "anon_insert_feedback" on public.feedback;
create policy "auth_insert_feedback"
  on public.feedback for insert
  to authenticated
  with check (true);

drop policy if exists "anon_insert_conv" on public.support_conversations;
create policy "auth_insert_conv"
  on public.support_conversations for insert
  to authenticated
  with check (true);
