-- 1. Consolidated Metrics RPC
create or replace function public.get_super_admin_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
  v_today_iso timestamptz := timezone('utc', now()::date);
begin
  select jsonb_build_object(
    'enquiryCount', (select count(*) from enquiries where status in ('new', 'contacted', 'seat_blocked')),
    'studentCount', (select count(*) from readers where status = 'active'),
    'availableSeats', (select count(*) from seats where status = 'available'),
    'openBills', (select count(*) from bills where status in ('pending', 'proof_submitted', 'partial', 'rejected_proof', 'overdue')),
    'overdueBills', (select count(*) from bills where status = 'overdue'),
    'openSupportTickets', (select count(*) from student_support_tickets where status in ('open', 'in_review')),
    'totalSeats', (select count(*) from seats),
    'occupiedSeats', (select count(*) from seats where status = 'occupied'),
    'pendingExits', (select count(*) from exit_requests where status = 'pending'),
    'pendingProofs', (select count(*) from transactions where verification_status = 'pending'),
    'collectionToday', (
      select coalesce(sum(amount), 0) 
      from transactions 
      where verification_status = 'verified' 
        and verified_at >= v_today_iso
    )
  ) into result;
  
  return result;
end;
$$;

-- 2. Finance Summary RPC (Aggregated on DB side)
create or replace function public.get_finance_summary(p_start_iso timestamptz, p_end_iso timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_revenue numeric;
  v_expense numeric;
begin
  -- Calculate Revenue (Verified Transactions)
  select coalesce(sum(amount), 0)
  into v_revenue
  from transactions
  where verification_status in ('verified', 'closed')
    and verified_at >= p_start_iso
    and verified_at < p_end_iso;

  -- Calculate Expenses
  select coalesce(sum(amount), 0)
  into v_expense
  from expenses
  where date >= p_start_iso::date
    and date < p_end_iso::date;

  return jsonb_build_object(
    'revenue', v_revenue,
    'expense', v_expense,
    'net', v_revenue - v_expense
  );
end;
$$;

-- 3. Consolidated Finance Summary (Daily, Weekly, Monthly in ONE trip)
create or replace function public.get_consolidated_finance_summary(
  p_daily_start timestamptz, p_daily_end timestamptz,
  p_weekly_start timestamptz, p_weekly_end timestamptz,
  p_monthly_start timestamptz, p_monthly_end timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return jsonb_build_object(
    'daily', get_finance_summary(p_daily_start, p_daily_end),
    'weekly', get_finance_summary(p_weekly_start, p_weekly_end),
    'monthly', get_finance_summary(p_monthly_start, p_monthly_end)
  );
end;
$$;

-- 4. 30-Day Revenue Trend RPC
create or replace function public.get_revenue_trend_30d()
returns table (trend_date date, revenue numeric)
language sql
security definer
set search_path = public
stable
as $$
  with date_series as (
    select generate_series(
      (now() at time zone 'Asia/Kolkata')::date - interval '29 days',
      (now() at time zone 'Asia/Kolkata')::date,
      '1 day'::interval
    )::date as d
  )
  select 
    ds.d as trend_date,
    coalesce(sum(t.amount), 0) as revenue
  from date_series ds
  left join transactions t on 
    (t.verified_at at time zone 'Asia/Kolkata')::date = ds.d
    and t.verification_status = 'verified'
  group by ds.d
  order by ds.d asc;
$$;
