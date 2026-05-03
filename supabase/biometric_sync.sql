-- Biometric Device Logs: stores raw punches from the K90 Pro machine.
-- If biometric_id matches a reader, reader_id will be populated automatically.
-- Otherwise, an admin can manually assign via the dashboard.

create table if not exists public.biometric_device_logs (
  id uuid primary key default uuid_generate_v4(),
  biometric_id text not null,               -- The User ID from the machine
  punch_time timestamptz not null,           -- The exact time of the punch (IST->UTC)
  punch_date date not null,                  -- The IST date of the punch
  reader_id uuid references public.readers(id) on delete set null, -- Null if unmatched
  status text not null default 'unmatched', -- 'matched' | 'unmatched' | 'ignored'
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.biometric_device_logs enable row level security;

-- Only admins can view the raw device logs
create policy "staff_and_admin_view_biometric_logs"
on public.biometric_device_logs
for select
using (public.get_user_role() in ('super_admin', 'staff'));

create policy "staff_and_admin_manage_biometric_logs"
on public.biometric_device_logs
for all
using (public.get_user_role() in ('super_admin', 'staff'))
with check (public.get_user_role() in ('super_admin', 'staff'));

-- Index for fast lookups by biometric_id and date
create index if not exists idx_biometric_device_logs_biometric_id on public.biometric_device_logs(biometric_id);
create index if not exists idx_biometric_device_logs_status on public.biometric_device_logs(status);
create index if not exists idx_biometric_device_logs_punch_date on public.biometric_device_logs(punch_date desc);
