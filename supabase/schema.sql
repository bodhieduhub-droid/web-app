create extension if not exists "uuid-ossp";

create or replace function public.get_normalized_role(raw_role text)
returns text
language sql
immutable
as $$
  select case
    when raw_role = 'reader' then 'student'
    else raw_role
  end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'student',
  onboarding_required boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('super_admin', 'staff', 'student', 'reader'));

create table if not exists public.hub_settings (
  id int primary key default 1,
  hub_name text not null default 'Bodhi Edu Hub',
  active_vertical text not null default 'Reading Hub',
  seat_capacity int not null default 69,
  daily_price numeric not null default 150,
  weekly_price numeric not null default 650,
  default_monthly_price numeric not null default 1650,
  registration_fee numeric not null default 400,
  caution_deposit numeric not null default 300,
  per_day_prorata numeric not null default 55,
  static_upi_id text,
  static_upi_name text,
  static_upi_qr_url text,
  enquiry_notification_emails text[] not null default '{}'::text[],
  billing_notification_emails text[] not null default '{}'::text[],
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.hub_settings (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.enquiries (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text not null,
  email text,
  source text not null default 'landing_page',
  status text not null default 'new',
  notes text,
  assigned_to uuid references public.profiles(id) on delete set null,
  converted_reader_id uuid,
  converted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.enquiries drop constraint if exists enquiries_status_check;
alter table public.enquiries
  add constraint enquiries_status_check
  check (status in ('new', 'contacted', 'seat_blocked', 'converted', 'closed'));

create table if not exists public.seats (
  id uuid primary key default uuid_generate_v4(),
  seat_number int unique not null,
  status text not null default 'available',
  assigned_reader_id uuid,
  blocked_by_profile_id uuid references public.profiles(id) on delete set null,
  block_reason text,
  blocked_until timestamptz,
  linked_enquiry_id uuid references public.enquiries(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.seats drop constraint if exists seats_status_check;
alter table public.seats
  add constraint seats_status_check
  check (status in ('available', 'occupied', 'blocked'));

insert into public.seats (seat_number)
select gs
from generate_series(1, 69) as gs
where not exists (select 1 from public.seats where seat_number = gs);

create table if not exists public.readers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  email text,
  phone text not null,
  reader_type text not null default 'monthly',
  status text not null default 'inactive',
  join_date timestamptz not null default timezone('utc', now()),
  fixed_seat_id uuid references public.seats(id) on delete set null,
  address text,
  purpose text,
  preparing_for_exam boolean not null default false,
  exam_details text,
  onboarding_completed boolean not null default false,
  onboarding_completed_at timestamptz,
  id_proof_url text,
  id_proof_public_id text,
  monthly_fee numeric not null default 1650,
  registration_paid boolean not null default false,
  caution_paid boolean not null default false,
  caution_refunded boolean not null default false,
  converted_from_enquiry_id uuid references public.enquiries(id) on delete set null,
  credentials_sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.readers drop constraint if exists readers_reader_type_check;
alter table public.readers
  add constraint readers_reader_type_check
  check (reader_type in ('monthly', 'weekly', 'daily'));

alter table public.readers drop constraint if exists readers_status_check;
alter table public.readers
  add constraint readers_status_check
  check (status in ('pending_payment', 'pending_onboarding', 'active', 'inactive', 'waitlist', 'rejected', 'archived'));

alter table public.readers add constraint monthly_requires_user_id
  check (
    (reader_type = 'monthly' and user_id is not null)
    or reader_type <> 'monthly'
    or status in ('waitlist', 'rejected')
  ) not valid;

alter table public.seats drop constraint if exists seats_assigned_reader_id_fkey;
alter table public.seats
  add constraint seats_assigned_reader_id_fkey
  foreign key (assigned_reader_id) references public.readers(id) on delete set null;

alter table public.enquiries drop constraint if exists enquiries_converted_reader_id_fkey;
alter table public.enquiries
  add constraint enquiries_converted_reader_id_fkey
  foreign key (converted_reader_id) references public.readers(id) on delete set null;

create table if not exists public.student_exam_interests (
  id uuid primary key default uuid_generate_v4(),
  reader_id uuid not null references public.readers(id) on delete cascade,
  category text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (reader_id, category)
);

create table if not exists public.bills (
  id uuid primary key default uuid_generate_v4(),
  reader_id uuid not null references public.readers(id) on delete cascade,
  month int,
  year int,
  due_date date,
  invoice_kind text not null default 'monthly_renewal',
  title text,
  base_amount numeric not null default 0,
  registration_amount numeric not null default 0,
  caution_amount numeric not null default 0,
  prorated_days int,
  amount_due numeric not null default 0,
  amount_paid numeric not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.bills drop constraint if exists unique_monthly_bill;
alter table public.bills
  add constraint unique_monthly_bill unique (reader_id, month, year, invoice_kind);

alter table public.bills drop constraint if exists bills_invoice_kind_check;
alter table public.bills
  add constraint bills_invoice_kind_check
  check (invoice_kind in ('admission', 'monthly_renewal', 'manual'));

alter table public.bills drop constraint if exists bills_status_check;
alter table public.bills
  add constraint bills_status_check
  check (status in ('pending', 'proof_submitted', 'partial', 'paid', 'rejected_proof', 'overdue'));

create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  reader_id uuid not null references public.readers(id) on delete cascade,
  bill_id uuid not null references public.bills(id) on delete cascade,
  type text not null default 'upi',
  amount numeric not null,
  payment_mode text not null default 'upi',
  payment_proof_url text,
  payment_proof_public_id text,
  reference_number text,
  verification_status text not null default 'pending',
  verification_notes text,
  submitted_at timestamptz not null default timezone('utc', now()),
  verified_at timestamptz,
  verified_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.transactions drop constraint if exists transactions_type_check;
alter table public.transactions
  add constraint transactions_type_check
  check (type in ('upi', 'refund', 'manual_adjustment', 'offline'));

alter table public.transactions drop constraint if exists transactions_payment_mode_check;
alter table public.transactions
  add constraint transactions_payment_mode_check
  check (payment_mode in ('upi', 'cash', 'offline'));

alter table public.transactions drop constraint if exists transactions_verification_status_check;
alter table public.transactions
  add constraint transactions_verification_status_check
  check (verification_status in ('pending', 'verified', 'rejected', 'closed'));

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  audience_type text not null,
  audience_id uuid,
  category text not null,
  title text not null,
  body text not null,
  link text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.notifications drop constraint if exists notifications_audience_type_check;
alter table public.notifications
  add constraint notifications_audience_type_check
  check (audience_type in ('profile', 'reader', 'broadcast_role'));

create table if not exists public.notification_reads (
  notification_id uuid not null references public.notifications(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (notification_id, profile_id)
);

create table if not exists public.posts (
  id uuid primary key default uuid_generate_v4(),
  type text not null,
  audience text not null,
  exam_category text,
  title text not null,
  summary text,
  content text not null,
  link_url text,
  cover_image_url text,
  cover_image_public_id text,
  status text not null default 'draft',
  author_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  published_at timestamptz
);

alter table public.posts drop constraint if exists posts_type_check;
alter table public.posts
  add constraint posts_type_check
  check (type in ('blog', 'note', 'job', 'exam_alert'));

alter table public.posts drop constraint if exists posts_audience_check;
alter table public.posts
  add constraint posts_audience_check
  check (audience in ('public', 'student'));

alter table public.posts drop constraint if exists posts_status_check;
alter table public.posts
  add constraint posts_status_check
  check (status in ('draft', 'published', 'archived'));

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

alter table public.calendar_events drop constraint if exists calendar_events_type_check;
alter table public.calendar_events
  add constraint calendar_events_type_check
  check (event_type in ('exam_deadline', 'exam_date', 'admit_card', 'result', 'hub_event', 'holiday', 'other'));

alter table public.calendar_events drop constraint if exists calendar_events_audience_check;
alter table public.calendar_events
  add constraint calendar_events_audience_check
  check (audience in ('student', 'public'));

alter table public.calendar_events drop constraint if exists calendar_events_status_check;
alter table public.calendar_events
  add constraint calendar_events_status_check
  check (status in ('draft', 'published', 'archived'));

alter table public.calendar_events drop constraint if exists calendar_events_range_check;
alter table public.calendar_events
  add constraint calendar_events_range_check
  check (ends_at is null or ends_at >= starts_at);

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

alter table public.student_calendar_entries drop constraint if exists student_calendar_entries_type_check;
alter table public.student_calendar_entries
  add constraint student_calendar_entries_type_check
  check (entry_type in ('goal', 'personal_event', 'reminder'));

alter table public.student_calendar_entries drop constraint if exists student_calendar_entries_status_check;
alter table public.student_calendar_entries
  add constraint student_calendar_entries_status_check
  check (status in ('planned', 'completed', 'cancelled'));

alter table public.student_calendar_entries drop constraint if exists student_calendar_entries_range_check;
alter table public.student_calendar_entries
  add constraint student_calendar_entries_range_check
  check (ends_at is null or ends_at >= starts_at);

create table if not exists public.exit_requests (
  id uuid primary key default uuid_generate_v4(),
  reader_id uuid references public.readers(id) on delete cascade,
  request_date timestamptz not null default timezone('utc', now()),
  exit_date timestamptz not null,
  refund_eligible boolean not null default false,
  status text not null default 'pending',
  admin_notes text,
  created_at timestamptz not null default timezone('utc', now())
);

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

alter table public.seat_change_requests drop constraint if exists seat_change_requests_status_check;
alter table public.seat_change_requests
  add constraint seat_change_requests_status_check
  check (status in ('pending', 'approved', 'declined', 'cancelled'));

create table if not exists public.night_logs (
  id uuid primary key default uuid_generate_v4(),
  reader_id uuid references public.readers(id) on delete cascade,
  seat_id uuid references public.seats(id) on delete cascade,
  entry_time timestamptz not null,
  planned_exit_time timestamptz not null,
  actual_exit_time timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.seat_shift_logs (
  id uuid primary key default uuid_generate_v4(),
  reader_id uuid references public.readers(id) on delete set null,
  old_seat_id uuid references public.seats(id) on delete set null,
  new_seat_id uuid references public.seats(id) on delete set null,
  reason text,
  shifted_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.bill_audit_logs (
  id uuid primary key default uuid_generate_v4(),
  bill_id uuid not null references public.bills(id) on delete cascade,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  notes text,
  before_state jsonb not null default '{}'::jsonb,
  after_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.todo_items (
  id uuid primary key default uuid_generate_v4(),
  reader_id uuid not null references public.readers(id) on delete cascade,
  title text not null,
  is_completed boolean not null default false,
  due_date date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

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

alter table public.study_sessions drop constraint if exists study_sessions_focus_minutes_check;
alter table public.study_sessions
  add constraint study_sessions_focus_minutes_check
  check (focus_minutes > 0 and break_minutes > 0 and completed_focus_blocks >= 0);

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

alter table public.student_support_tickets drop constraint if exists student_support_tickets_status_check;
alter table public.student_support_tickets
  add constraint student_support_tickets_status_check
  check (status in ('open', 'in_review', 'resolved', 'closed'));

create index if not exists idx_readers_phone on public.readers(phone);
create index if not exists idx_readers_status on public.readers(status);
create index if not exists idx_readers_user_id on public.readers(user_id);
create index if not exists idx_enquiries_status on public.enquiries(status);
create index if not exists idx_bills_reader_id on public.bills(reader_id);
create index if not exists idx_transactions_reader_id on public.transactions(reader_id);
create index if not exists idx_transactions_bill_id on public.transactions(bill_id);
create index if not exists idx_notifications_audience on public.notifications(audience_type, audience_id);
create index if not exists idx_notification_reads_profile_id on public.notification_reads(profile_id);
create index if not exists idx_bill_audit_logs_bill_id on public.bill_audit_logs(bill_id);
create index if not exists idx_calendar_events_status_start on public.calendar_events(status, starts_at);
create index if not exists idx_calendar_events_category_start on public.calendar_events(exam_category, starts_at);
create index if not exists idx_student_calendar_entries_reader_id_start on public.student_calendar_entries(reader_id, starts_at desc);
create index if not exists idx_seat_change_requests_reader_id_status on public.seat_change_requests(reader_id, status);
create index if not exists idx_seat_change_requests_status_created_at on public.seat_change_requests(status, created_at desc);
create unique index if not exists idx_seat_change_requests_one_pending_per_reader
on public.seat_change_requests(reader_id)
where status = 'pending';
create index if not exists idx_student_post_activity_reader_id on public.student_post_activity(reader_id);
create index if not exists idx_study_sessions_reader_id_started_at on public.study_sessions(reader_id, started_at desc);
create index if not exists idx_student_support_tickets_reader_id on public.student_support_tickets(reader_id);
create index if not exists idx_student_support_tickets_status on public.student_support_tickets(status);

drop view if exists public.seat_availability_view;
create or replace view public.seat_availability_view as
select
  count(*) filter (where status = 'occupied') as occupied_seats,
  count(*) filter (where status = 'available') as available_seats,
  count(*) filter (where status = 'blocked') as blocked_seats,
  count(*) as total_seats
from public.seats;

drop view if exists public.caution_liability_view;
create or replace view public.caution_liability_view as
select
  count(*) filter (where reader_type = 'monthly' and status = 'active') as active_monthly_students,
  coalesce(sum(case when caution_paid = true and caution_refunded = false then 300 else 0 end), 0) as total_caution_liability
from public.readers;

create or replace function public.get_user_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select public.get_normalized_role(role)
  from public.profiles
  where id = auth.uid();
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.refresh_bill_after_transaction()
returns trigger
language plpgsql
as $$
declare
  paid_total numeric;
begin
  if new.bill_id is null then
    return new;
  end if;

  select coalesce(sum(amount), 0)
  into paid_total
  from public.transactions
  where bill_id = new.bill_id
    and verification_status = 'verified';

  update public.bills
  set
    amount_paid = paid_total,
    status = case
      when paid_total >= amount_due then 'paid'
      when paid_total > 0 then 'partial'
      when exists (
        select 1 from public.transactions t
        where t.bill_id = new.bill_id and t.verification_status = 'pending'
      ) then 'proof_submitted'
      when exists (
        select 1 from public.transactions t
        where t.bill_id = new.bill_id and t.verification_status = 'rejected'
      ) then 'rejected_proof'
      else status
    end,
    updated_at = timezone('utc', now())
  where id = new.bill_id;

  return new;
end;
$$;

drop trigger if exists trigger_touch_profiles on public.profiles;
create trigger trigger_touch_profiles
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists trigger_touch_hub_settings on public.hub_settings;
create trigger trigger_touch_hub_settings
before update on public.hub_settings
for each row execute function public.touch_updated_at();

drop trigger if exists trigger_touch_enquiries on public.enquiries;
create trigger trigger_touch_enquiries
before update on public.enquiries
for each row execute function public.touch_updated_at();

drop trigger if exists trigger_touch_seats on public.seats;
create trigger trigger_touch_seats
before update on public.seats
for each row execute function public.touch_updated_at();

drop trigger if exists trigger_touch_readers on public.readers;
create trigger trigger_touch_readers
before update on public.readers
for each row execute function public.touch_updated_at();

drop trigger if exists trigger_touch_bills on public.bills;
create trigger trigger_touch_bills
before update on public.bills
for each row execute function public.touch_updated_at();

drop trigger if exists trigger_touch_transactions on public.transactions;
create trigger trigger_touch_transactions
before update on public.transactions
for each row execute function public.touch_updated_at();

drop trigger if exists trigger_touch_posts on public.posts;
create trigger trigger_touch_posts
before update on public.posts
for each row execute function public.touch_updated_at();

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

drop trigger if exists trigger_touch_todo_items on public.todo_items;
create trigger trigger_touch_todo_items
before update on public.todo_items
for each row execute function public.touch_updated_at();

drop trigger if exists trigger_touch_student_post_activity on public.student_post_activity;
create trigger trigger_touch_student_post_activity
before update on public.student_post_activity
for each row execute function public.touch_updated_at();

drop trigger if exists trigger_touch_student_support_tickets on public.student_support_tickets;
create trigger trigger_touch_student_support_tickets
before update on public.student_support_tickets
for each row execute function public.touch_updated_at();

drop trigger if exists trigger_refresh_bill_insert on public.transactions;
create trigger trigger_refresh_bill_insert
after insert on public.transactions
for each row execute function public.refresh_bill_after_transaction();

drop trigger if exists trigger_refresh_bill_update on public.transactions;
create trigger trigger_refresh_bill_update
after update on public.transactions
for each row execute function public.refresh_bill_after_transaction();


create table if not exists public.expenses (
  id uuid primary key default uuid_generate_v4(),
  amount numeric not null,
  category text not null,
  description text,
  date date not null default (now() at time zone 'Asia/Kolkata')::date,
  recorded_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.expenses enable row level security;

create policy "staff_and_admin_manage_expenses"
on public.expenses
for all
using (public.get_user_role() in ('super_admin', 'staff'))
with check (public.get_user_role() in ('super_admin', 'staff'));

create trigger trigger_touch_expenses
before update on public.expenses
for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.hub_settings enable row level security;
alter table public.enquiries enable row level security;
alter table public.seats enable row level security;
alter table public.readers enable row level security;
alter table public.student_exam_interests enable row level security;
alter table public.bills enable row level security;
alter table public.transactions enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_reads enable row level security;
alter table public.posts enable row level security;
alter table public.calendar_events enable row level security;
alter table public.student_calendar_entries enable row level security;
alter table public.exit_requests enable row level security;
alter table public.night_logs enable row level security;
alter table public.seat_shift_logs enable row level security;
alter table public.bill_audit_logs enable row level security;
alter table public.todo_items enable row level security;
alter table public.student_post_activity enable row level security;
alter table public.study_sessions enable row level security;
alter table public.student_support_tickets enable row level security;

drop policy if exists "users_view_own_profile" on public.profiles;
create policy "users_view_own_profile"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "super_admin_manage_profiles" on public.profiles;
create policy "super_admin_manage_profiles"
on public.profiles
for all
using (public.get_user_role() = 'super_admin')
with check (public.get_user_role() = 'super_admin');

drop policy if exists "staff_and_admin_manage_enquiries" on public.enquiries;
create policy "staff_and_admin_manage_enquiries"
on public.enquiries
for all
using (public.get_user_role() in ('super_admin', 'staff'))
with check (public.get_user_role() in ('super_admin', 'staff'));

drop policy if exists "staff_and_admin_manage_seats" on public.seats;
create policy "staff_and_admin_manage_seats"
on public.seats
for all
using (public.get_user_role() in ('super_admin', 'staff'))
with check (public.get_user_role() in ('super_admin', 'staff'));

drop policy if exists "staff_and_admin_manage_readers" on public.readers;
create policy "staff_and_admin_manage_readers"
on public.readers
for all
using (public.get_user_role() in ('super_admin', 'staff'))
with check (public.get_user_role() in ('super_admin', 'staff'));

drop policy if exists "student_view_self_reader" on public.readers;
create policy "student_view_self_reader"
on public.readers
for select
using (public.get_user_role() = 'student' and user_id = auth.uid());

drop policy if exists "student_update_self_reader" on public.readers;
create policy "student_update_self_reader"
on public.readers
for update
using (public.get_user_role() = 'student' and user_id = auth.uid())
with check (public.get_user_role() = 'student' and user_id = auth.uid());

drop policy if exists "staff_and_admin_manage_bills" on public.bills;
create policy "staff_and_admin_manage_bills"
on public.bills
for all
using (public.get_user_role() in ('super_admin', 'staff'))
with check (public.get_user_role() in ('super_admin', 'staff'));

drop policy if exists "student_view_own_bills" on public.bills;
create policy "student_view_own_bills"
on public.bills
for select
using (
  public.get_user_role() = 'student'
  and reader_id in (select id from public.readers where user_id = auth.uid())
);

drop policy if exists "staff_and_admin_manage_transactions" on public.transactions;
create policy "staff_and_admin_manage_transactions"
on public.transactions
for all
using (public.get_user_role() in ('super_admin', 'staff'))
with check (public.get_user_role() in ('super_admin', 'staff'));

drop policy if exists "student_manage_own_transactions" on public.transactions;
create policy "student_manage_own_transactions"
on public.transactions
for all
using (
  public.get_user_role() = 'student'
  and reader_id in (select id from public.readers where user_id = auth.uid())
)
with check (
  public.get_user_role() = 'student'
  and reader_id in (select id from public.readers where user_id = auth.uid())
);

drop policy if exists "staff_and_admin_manage_notifications" on public.notifications;
create policy "staff_and_admin_manage_notifications"
on public.notifications
for all
using (public.get_user_role() in ('super_admin', 'staff'))
with check (public.get_user_role() in ('super_admin', 'staff'));

drop policy if exists "student_view_notifications" on public.notifications;
create policy "student_view_notifications"
on public.notifications
for select
using (
  (
    audience_type = 'reader'
    and audience_id in (select id from public.readers where user_id = auth.uid())
  ) or (
    audience_type = 'profile' and audience_id = auth.uid()
  ) or (
    audience_type = 'broadcast_role' and coalesce(metadata ->> 'role', '') = public.get_user_role()
  )
);

drop policy if exists "student_update_notifications" on public.notifications;
create policy "student_update_notifications"
on public.notifications
for update
using (
  (
    audience_type = 'reader'
    and audience_id in (select id from public.readers where user_id = auth.uid())
  ) or (
    audience_type = 'profile' and audience_id = auth.uid()
  )
)
with check (
  (
    audience_type = 'reader'
    and audience_id in (select id from public.readers where user_id = auth.uid())
  ) or (
    audience_type = 'profile' and audience_id = auth.uid()
  )
	);

drop policy if exists "staff_and_admin_manage_notification_reads" on public.notification_reads;
create policy "staff_and_admin_manage_notification_reads"
on public.notification_reads
for all
using (public.get_user_role() in ('super_admin', 'staff'))
with check (public.get_user_role() in ('super_admin', 'staff'));

drop policy if exists "student_manage_own_notification_reads" on public.notification_reads;
create policy "student_manage_own_notification_reads"
on public.notification_reads
for all
using (
  public.get_user_role() = 'student'
  and profile_id = auth.uid()
)
with check (
  public.get_user_role() = 'student'
  and profile_id = auth.uid()
);

drop policy if exists "public_read_published_posts" on public.posts;
create policy "public_read_published_posts"
on public.posts
for select
using (status = 'published');

drop policy if exists "staff_and_admin_manage_posts" on public.posts;
create policy "staff_and_admin_manage_posts"
on public.posts
for all
using (public.get_user_role() in ('super_admin', 'staff'))
with check (public.get_user_role() in ('super_admin', 'staff'));

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

drop policy if exists "student_manage_own_todo_items" on public.todo_items;
create policy "student_manage_own_todo_items"
on public.todo_items
for all
using (
  public.get_user_role() = 'student'
  and reader_id in (select id from public.readers where user_id = auth.uid())
)
with check (
  public.get_user_role() = 'student'
  and reader_id in (select id from public.readers where user_id = auth.uid())
);

drop policy if exists "staff_and_admin_view_todo_items" on public.todo_items;
create policy "staff_and_admin_view_todo_items"
on public.todo_items
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

drop policy if exists "staff_and_admin_manage_bill_audit_logs" on public.bill_audit_logs;
create policy "staff_and_admin_manage_bill_audit_logs"
on public.bill_audit_logs
for all
using (public.get_user_role() in ('super_admin', 'staff'))
with check (public.get_user_role() in ('super_admin', 'staff'));
