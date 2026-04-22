-- Add allowed_attendance_ips to hub_settings
alter table public.hub_settings add column if not exists allowed_attendance_ips text[] not null default '{}'::text[];

-- Create attendance table
create table if not exists public.attendance (
  id uuid primary key default uuid_generate_v4(),
  reader_id uuid not null references public.readers(id) on delete cascade,
  date date not null default current_date,
  check_in_at timestamptz not null default timezone('utc', now()),
  check_out_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (reader_id, date)
);

-- Create student_badges table
create table if not exists public.student_badges (
  id uuid primary key default uuid_generate_v4(),
  reader_id uuid not null references public.readers(id) on delete cascade,
  badge_type text not null,
  awarded_at timestamptz not null default timezone('utc', now()),
  metadata jsonb not null default '{}'::jsonb,
  unique (reader_id, badge_type)
);

-- Enable RLS
alter table public.attendance enable row level security;
alter table public.student_badges enable row level security;

-- Policies for attendance
drop policy if exists "staff_and_admin_view_attendance" on public.attendance;
create policy "staff_and_admin_view_attendance"
on public.attendance
for select
using (public.get_user_role() in ('super_admin', 'staff'));

drop policy if exists "student_view_own_attendance" on public.attendance;
create policy "student_view_own_attendance"
on public.attendance
for select
using (
  public.get_user_role() = 'student'
  and reader_id in (select id from public.readers where user_id = auth.uid())
);

drop policy if exists "student_manage_own_attendance" on public.attendance;
create policy "student_manage_own_attendance"
on public.attendance
for all
using (
  public.get_user_role() = 'student'
  and reader_id in (select id from public.readers where user_id = auth.uid())
)
with check (
  public.get_user_role() = 'student'
  and reader_id in (select id from public.readers where user_id = auth.uid())
);

-- Policies for badges
drop policy if exists "any_view_badges" on public.student_badges;
create policy "any_view_badges"
on public.student_badges
for select
using (true);

-- Indices
create index if not exists idx_attendance_reader_date on public.attendance(reader_id, date);
create index if not exists idx_attendance_date on public.attendance(date);
create index if not exists idx_badges_reader on public.student_badges(reader_id);
