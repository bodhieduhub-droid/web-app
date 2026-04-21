-- Student portal features update
-- Adds calendar events, saved resource activity, study session history, and support tickets.

create extension if not exists "uuid-ossp";

create table if not exists public.calendar_events (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  summary text,
  description text not null default '',
  event_type text not null,
  audience text not null default 'student',
  exam_category text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  is_all_day boolean not null default true,
  location text,
  link_url text,
  source_post_id uuid references public.posts(id) on delete set null,
  status text not null default 'draft',
  author_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.calendar_events drop constraint if exists calendar_events_type_check;
alter table if exists public.calendar_events
  add constraint calendar_events_type_check
  check (event_type in ('exam_deadline', 'exam_date', 'admit_card', 'result', 'hub_event', 'holiday', 'other'));

alter table if exists public.calendar_events drop constraint if exists calendar_events_audience_check;
alter table if exists public.calendar_events
  add constraint calendar_events_audience_check
  check (audience in ('student', 'public'));

alter table if exists public.calendar_events drop constraint if exists calendar_events_status_check;
alter table if exists public.calendar_events
  add constraint calendar_events_status_check
  check (status in ('draft', 'published', 'archived'));

alter table if exists public.calendar_events drop constraint if exists calendar_events_range_check;
alter table if exists public.calendar_events
  add constraint calendar_events_range_check
  check (ends_at is null or ends_at >= starts_at);

create index if not exists idx_calendar_events_status_start on public.calendar_events(status, starts_at);
create index if not exists idx_calendar_events_category_start on public.calendar_events(exam_category, starts_at);

create table if not exists public.student_calendar_entries (
  id uuid primary key default uuid_generate_v4(),
  reader_id uuid not null references public.readers(id) on delete cascade,
  title text not null,
  notes text not null default '',
  entry_type text not null default 'goal',
  status text not null default 'planned',
  starts_at timestamptz not null,
  ends_at timestamptz,
  is_all_day boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.student_calendar_entries drop constraint if exists student_calendar_entries_type_check;
alter table if exists public.student_calendar_entries
  add constraint student_calendar_entries_type_check
  check (entry_type in ('goal', 'personal_event', 'reminder'));

alter table if exists public.student_calendar_entries drop constraint if exists student_calendar_entries_status_check;
alter table if exists public.student_calendar_entries
  add constraint student_calendar_entries_status_check
  check (status in ('planned', 'completed', 'cancelled'));

alter table if exists public.student_calendar_entries drop constraint if exists student_calendar_entries_range_check;
alter table if exists public.student_calendar_entries
  add constraint student_calendar_entries_range_check
  check (ends_at is null or ends_at >= starts_at);

create index if not exists idx_student_calendar_entries_reader_id_start on public.student_calendar_entries(reader_id, starts_at desc);

create table if not exists public.seat_change_requests (
  id uuid primary key default uuid_generate_v4(),
  reader_id uuid not null references public.readers(id) on delete cascade,
  current_seat_id uuid references public.seats(id) on delete set null,
  requested_seat_id uuid not null references public.seats(id) on delete cascade,
  status text not null default 'pending',
  admin_notes text,
  resolved_at timestamptz,
  resolved_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.seat_change_requests drop constraint if exists seat_change_requests_status_check;
alter table if exists public.seat_change_requests
  add constraint seat_change_requests_status_check
  check (status in ('pending', 'approved', 'declined', 'cancelled'));

create index if not exists idx_seat_change_requests_reader_id_status on public.seat_change_requests(reader_id, status);
create index if not exists idx_seat_change_requests_status_created_at on public.seat_change_requests(status, created_at desc);
create unique index if not exists idx_seat_change_requests_one_pending_per_reader
on public.seat_change_requests(reader_id)
where status = 'pending';

create table if not exists public.student_post_activity (
  id uuid primary key default uuid_generate_v4(),
  reader_id uuid not null references public.readers(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  is_saved boolean not null default true,
  is_revised boolean not null default false,
  revision_due_on date,
  last_opened_at timestamptz,
  revised_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (reader_id, post_id)
);

create index if not exists idx_student_post_activity_reader_id on public.student_post_activity(reader_id);

create table if not exists public.study_sessions (
  id uuid primary key default uuid_generate_v4(),
  reader_id uuid not null references public.readers(id) on delete cascade,
  preset_name text not null,
  focus_minutes int not null,
  break_minutes int not null,
  completed_focus_blocks int not null default 1,
  started_at timestamptz not null,
  ended_at timestamptz,
  source text not null default 'portal_timer',
  created_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.study_sessions drop constraint if exists study_sessions_focus_minutes_check;
alter table if exists public.study_sessions
  add constraint study_sessions_focus_minutes_check
  check (focus_minutes > 0 and break_minutes > 0 and completed_focus_blocks >= 0);

create index if not exists idx_study_sessions_reader_id_started_at on public.study_sessions(reader_id, started_at desc);

create table if not exists public.student_support_tickets (
  id uuid primary key default uuid_generate_v4(),
  reader_id uuid not null references public.readers(id) on delete cascade,
  subject text not null,
  message text not null,
  status text not null default 'open',
  category text not null default 'general',
  last_reply_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.student_support_tickets drop constraint if exists student_support_tickets_status_check;
alter table if exists public.student_support_tickets
  add constraint student_support_tickets_status_check
  check (status in ('open', 'in_review', 'resolved', 'closed'));

create index if not exists idx_student_support_tickets_reader_id on public.student_support_tickets(reader_id);
create index if not exists idx_student_support_tickets_status on public.student_support_tickets(status);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trigger_touch_calendar_events on public.calendar_events;
create trigger trigger_touch_calendar_events
before update on public.calendar_events
for each row execute function public.touch_updated_at();

drop trigger if exists trigger_touch_student_calendar_entries on public.student_calendar_entries;
create trigger trigger_touch_student_calendar_entries
before update on public.student_calendar_entries
for each row execute function public.touch_updated_at();

drop trigger if exists trigger_touch_seat_change_requests on public.seat_change_requests;
create trigger trigger_touch_seat_change_requests
before update on public.seat_change_requests
for each row execute function public.touch_updated_at();

drop trigger if exists trigger_touch_student_post_activity on public.student_post_activity;
create trigger trigger_touch_student_post_activity
before update on public.student_post_activity
for each row execute function public.touch_updated_at();

drop trigger if exists trigger_touch_student_support_tickets on public.student_support_tickets;
create trigger trigger_touch_student_support_tickets
before update on public.student_support_tickets
for each row execute function public.touch_updated_at();

alter table public.calendar_events enable row level security;
alter table public.student_calendar_entries enable row level security;
alter table public.student_post_activity enable row level security;
alter table public.study_sessions enable row level security;
alter table public.student_support_tickets enable row level security;

drop policy if exists "public_read_published_calendar_events" on public.calendar_events;
create policy "public_read_published_calendar_events"
on public.calendar_events
for select
using (status = 'published');

drop policy if exists "staff_and_admin_manage_calendar_events" on public.calendar_events;
create policy "staff_and_admin_manage_calendar_events"
on public.calendar_events
for all
using (public.get_user_role() in ('super_admin', 'staff'))
with check (public.get_user_role() in ('super_admin', 'staff'));

drop policy if exists "student_manage_own_calendar_entries" on public.student_calendar_entries;
create policy "student_manage_own_calendar_entries"
on public.student_calendar_entries
for all
using (
  public.get_user_role() = 'student'
  and reader_id in (select id from public.readers where user_id = auth.uid())
)
with check (
  public.get_user_role() = 'student'
  and reader_id in (select id from public.readers where user_id = auth.uid())
);

drop policy if exists "staff_and_admin_view_calendar_entries" on public.student_calendar_entries;
create policy "staff_and_admin_view_calendar_entries"
on public.student_calendar_entries
for select
using (public.get_user_role() in ('super_admin', 'staff'));

drop policy if exists "student_manage_own_post_activity" on public.student_post_activity;
create policy "student_manage_own_post_activity"
on public.student_post_activity
for all
using (
  public.get_user_role() = 'student'
  and reader_id in (select id from public.readers where user_id = auth.uid())
)
with check (
  public.get_user_role() = 'student'
  and reader_id in (select id from public.readers where user_id = auth.uid())
);

drop policy if exists "staff_and_admin_view_post_activity" on public.student_post_activity;
create policy "staff_and_admin_view_post_activity"
on public.student_post_activity
for select
using (public.get_user_role() in ('super_admin', 'staff'));

drop policy if exists "student_manage_own_study_sessions" on public.study_sessions;
create policy "student_manage_own_study_sessions"
on public.study_sessions
for all
using (
  public.get_user_role() = 'student'
  and reader_id in (select id from public.readers where user_id = auth.uid())
)
with check (
  public.get_user_role() = 'student'
  and reader_id in (select id from public.readers where user_id = auth.uid())
);

drop policy if exists "staff_and_admin_view_study_sessions" on public.study_sessions;
create policy "staff_and_admin_view_study_sessions"
on public.study_sessions
for select
using (public.get_user_role() in ('super_admin', 'staff'));

drop policy if exists "student_manage_own_support_tickets" on public.student_support_tickets;
create policy "student_manage_own_support_tickets"
on public.student_support_tickets
for all
using (
  public.get_user_role() = 'student'
  and reader_id in (select id from public.readers where user_id = auth.uid())
)
with check (
  public.get_user_role() = 'student'
  and reader_id in (select id from public.readers where user_id = auth.uid())
);

drop policy if exists "staff_and_admin_manage_support_tickets" on public.student_support_tickets;
create policy "staff_and_admin_manage_support_tickets"
on public.student_support_tickets
for all
using (public.get_user_role() in ('super_admin', 'staff'))
with check (public.get_user_role() in ('super_admin', 'staff'));
