create or replace function public.get_user_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select case
    when role = 'reader' then 'student'
    else role
  end
  from public.profiles
  where id = auth.uid();
$$;
