-- Create your owner account in Supabase Authentication > Users first.
-- Replace the UUID below with that user's ID. Do not use the GitHub or ChatGPT ID.
-- Run using the Supabase SQL Editor (administrator only).
insert into public.vault_settings(singleton,owner_id)
values(true,'REPLACE_WITH_SUPABASE_AUTH_USER_UUID'::uuid)
on conflict(singleton) do update set owner_id=excluded.owner_id;
