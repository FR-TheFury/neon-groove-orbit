-- Ensure a safe user initialization path without touching auth triggers
create or replace function public.initialize_user_if_needed(_user_id uuid default auth.uid())
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_display_name text;
begin
  if _user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Read minimal info from auth.users (allowed in SECURITY DEFINER)
  select u.email,
         coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1))
    into v_email, v_display_name
  from auth.users u
  where u.id = _user_id;

  -- Create profile if missing
  insert into public.profiles (user_id, display_name)
  select _user_id, v_display_name
  where not exists (select 1 from public.profiles where user_id = _user_id);

  -- Create account request if missing
  insert into public.account_requests (user_id, email, display_name)
  select _user_id, v_email, v_display_name
  where not exists (select 1 from public.account_requests where user_id = _user_id);

  -- Ensure the user has at least a 'pending' role
  if not exists (select 1 from public.user_roles where user_id = _user_id) then
    insert into public.user_roles (user_id, role)
    values (_user_id, 'pending');
  end if;
end;
$$;

-- Allow authenticated users to execute this helper
grant execute on function public.initialize_user_if_needed(uuid) to authenticated;