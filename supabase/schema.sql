-- Run once in a new Supabase project's SQL Editor.
-- The owner is assigned separately by an administrator; visitors cannot claim ownership.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to anon, authenticated;
create table public.vault_settings (
  singleton boolean primary key default true check (singleton),
  owner_id uuid not null references auth.users(id)
);
alter table public.vault_settings enable row level security;
revoke all on public.vault_settings from public, anon, authenticated;
create table public.skin_selections (
  skin_id uuid primary key,
  owned boolean not null default false,
  wished boolean not null default false,
  price_override integer check (price_override between 0 and 100000)
);
alter table public.skin_selections enable row level security;
create function private.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.vault_settings where singleton and owner_id = (select auth.uid()));
$$;
revoke all on function private.is_owner() from public, anon, authenticated;
grant execute on function private.is_owner() to anon, authenticated;
create policy "Public collection and owner records" on public.skin_selections for select to anon, authenticated
using (owned or wished or (select private.is_owner()));
revoke all on public.skin_selections from public, anon, authenticated;
grant select on public.skin_selections to anon, authenticated;
-- Mutations use narrow RPC functions and an explicit server-side owner check.
create function public.is_vault_owner() returns boolean
language sql stable security definer set search_path = '' as $$ select private.is_owner(); $$;
create function public.set_skin_selection(p_skin_id uuid,p_owned boolean,p_wished boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
 if not private.is_owner() then raise exception 'Owner access required' using errcode='42501'; end if;
 if p_owned is null or p_wished is null then raise exception 'Invalid selection'; end if;
 insert into public.skin_selections(skin_id,owned,wished) values(p_skin_id,p_owned,p_wished)
 on conflict(skin_id) do update set owned=excluded.owned,wished=excluded.wished;
end;
$$;
create function public.set_skin_price(p_skin_id uuid,p_price integer) returns void
language plpgsql security definer set search_path = '' as $$
begin
 if not private.is_owner() then raise exception 'Owner access required' using errcode='42501'; end if;
 if p_price is not null and (p_price<0 or p_price>100000) then raise exception 'Invalid price'; end if;
 insert into public.skin_selections(skin_id,price_override) values(p_skin_id,p_price)
 on conflict(skin_id) do update set price_override=excluded.price_override;
end;
$$;
revoke all on function public.is_vault_owner() from public, anon, authenticated;
revoke all on function public.set_skin_selection(uuid,boolean,boolean) from public, anon, authenticated;
revoke all on function public.set_skin_price(uuid,integer) from public, anon, authenticated;
grant execute on function public.is_vault_owner() to authenticated;
grant execute on function public.set_skin_selection(uuid,boolean,boolean) to authenticated;
grant execute on function public.set_skin_price(uuid,integer) to authenticated;
commit;
