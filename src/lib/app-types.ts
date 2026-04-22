import type { AppRole, PlanType } from "./billing-utils";

export interface ProfileRecord {
  id: string;
  full_name: string | null;
  role: string;
  onboarding_required?: boolean | null;
}

export interface StudentRecord {
  id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string;
  reader_type: PlanType;
  status: string;
  join_date: string;
  fixed_seat_id: string | null;
  address: string | null;
  purpose: string | null;
  preparing_for_exam: boolean;
  exam_details: string | null;
  onboarding_completed: boolean;
  id_proof_url: string | null;
  id_proof_public_id?: string | null;
  monthly_fee: number;
  registration_paid: boolean;
  caution_paid: boolean;
  caution_refunded: boolean;
  credentials_sent_at?: string | null;
}

export interface EnquiryRecord {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  assigned_to: string | null;
  converted_reader_id: string | null;
}

export interface SeatRecord {
  id: string;
  seat_number: number;
  status: "available" | "occupied" | "blocked";
  assigned_reader_id: string | null;
  blocked_by_profile_id: string | null;
  block_reason: string | null;
  linked_enquiry_id: string | null;
}

export interface BillRecord {
  id: string;
  reader_id: string;
  invoice_kind: "admission" | "monthly_renewal" | "manual";
  title: string | null;
  month: number | null;
  year: number | null;
  due_date: string | null;
  base_amount: number;
  registration_amount: number;
  caution_amount: number;
  prorated_days: number | null;
  amount_due: number;
  amount_paid: number;
  status: "pending" | "proof_submitted" | "partial" | "paid" | "rejected_proof" | "overdue";
  created_at: string;
}

export interface TransactionRecord {
  id: string;
  reader_id: string;
  bill_id: string;
  type: string;
  amount: number;
  payment_mode: string;
  payment_proof_url: string | null;
  payment_proof_public_id: string | null;
  reference_number: string | null;
  verification_status: "pending" | "verified" | "rejected" | "closed";
  verification_notes: string | null;
  submitted_at: string;
  verified_at: string | null;
  verified_by_profile_id: string | null;
}

export interface NotificationRecord {
  id: string;
  audience_type: "profile" | "reader" | "broadcast_role";
  audience_id: string | null;
  category: string;
  title: string;
  body: string;
  link: string | null;
  created_at: string;
  read_at: string | null;
}

export interface PostRecord {
  id: string;
  type: "blog" | "note" | "job" | "exam_alert";
  audience: "public" | "student";
  exam_category?: string | null;
  title: string;
  summary: string | null;
  content: string;
  link_url?: string | null;
  cover_image_url?: string | null;
  cover_image_public_id?: string | null;
  status: "draft" | "published" | "archived";
  published_at: string | null;
}

export interface CalendarEventRecord {
  id: string;
  title: string;
  summary: string | null;
  description: string;
  event_type:
    | "exam_deadline"
    | "exam_date"
    | "admit_card"
    | "result"
    | "hub_event"
    | "holiday"
    | "other";
  audience: "student" | "public";
  exam_category?: string | null;
  starts_at: string;
  ends_at: string | null;
  is_all_day: boolean;
  location: string | null;
  link_url: string | null;
  source_post_id: string | null;
  status: "draft" | "published" | "archived";
  author_profile_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TodoItemRecord {
  id: string;
  reader_id: string;
  title: string;
  is_completed: boolean;
  due_date: string | null;
  created_at: string;
}

export interface ExitRequestRecord {
  id: string;
  reader_id: string;
  request_date: string;
  exit_date: string;
  refund_eligible: boolean;
  status: "pending" | "processed" | "rejected";
  admin_notes: string | null;
  created_at: string;
}

export interface NightLogRecord {
  id: string;
  reader_id: string;
  seat_id: string | null;
  entry_time: string;
  planned_exit_time: string;
  actual_exit_time: string | null;
  status: "active" | "completed" | "late";
  created_at: string;
}

export interface StudentPostActivityRecord {
  id: string;
  reader_id: string;
  post_id: string;
  is_saved: boolean;
  is_revised: boolean;
  revision_due_on: string | null;
  last_opened_at: string | null;
  revised_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudySessionRecord {
  id: string;
  reader_id: string;
  preset_name: string;
  focus_minutes: number;
  break_minutes: number;
  completed_focus_blocks: number;
  started_at: string;
  ended_at: string | null;
  source: string;
  created_at: string;
}

export interface StudentCalendarEntryRecord {
  id: string;
  reader_id: string;
  title: string;
  notes: string;
  entry_type: "goal" | "personal_event" | "reminder";
  status: "planned" | "completed" | "cancelled";
  starts_at: string;
  ends_at: string | null;
  is_all_day: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentSupportTicketRecord {
  id: string;
  reader_id: string;
  subject: string;
  message: string;
  status: "open" | "in_review" | "resolved" | "closed";
  category: string;
  last_reply_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SeatChangeRequestRecord {
  id: string;
  reader_id: string;
  current_seat_id: string | null;
  requested_seat_id: string;
  status: "pending" | "approved" | "declined" | "cancelled";
  admin_notes: string | null;
  resolved_at: string | null;
  resolved_by_profile_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  reader_id: string;
  date: string;
  check_in_at: string;
  check_out_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface StudentBadgeRecord {
  id: string;
  reader_id: string;
  badge_type: string;
  awarded_at: string;
  metadata: Record<string, any>;
}

export interface DashboardContext {
  profile: ProfileRecord;
  normalizedRole: AppRole;
  student: StudentRecord | null;
}
