create policy "assets_update_own" on public.assets for update using (auth.uid() = user_id);
