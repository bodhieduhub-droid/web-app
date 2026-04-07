import { createAdminClient } from "@/lib/supabase/admin";

export interface HubSettings {
  id: number;
  hub_name: string;
  active_vertical: string;
  seat_capacity: number;
  daily_price: number;
  weekly_price: number;
  default_monthly_price: number;
  registration_fee: number;
  caution_deposit: number;
  per_day_prorata: number;
  static_upi_id: string | null;
  static_upi_name: string | null;
  static_upi_qr_url: string | null;
  enquiry_notification_emails: string[];
  billing_notification_emails: string[];
}

export const DEFAULT_SETTINGS: HubSettings = {
  id: 1,
  hub_name: "Bodhi Edu Hub",
  active_vertical: "Reading Hub",
  seat_capacity: 69,
  daily_price: 150,
  weekly_price: 650,
  default_monthly_price: 1650,
  registration_fee: 400,
  caution_deposit: 300,
  per_day_prorata: 55,
  static_upi_id: null,
  static_upi_name: null,
  static_upi_qr_url: null,
  enquiry_notification_emails: [],
  billing_notification_emails: [],
};

export async function getHubSettings(): Promise<HubSettings> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("hub_settings").select("*").eq("id", 1).maybeSingle();
  if (!data) return DEFAULT_SETTINGS;
  return {
    ...DEFAULT_SETTINGS,
    ...data,
  };
}
