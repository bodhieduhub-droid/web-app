import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf-8");
  content.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join("=").trim();
    }
  });
}

async function introspectDB() {
  loadEnv();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  console.log("--- TABLE STATS ---");
  const tables = [
    "profiles", "hub_settings", "enquiries", "seats", "readers", 
    "bills", "transactions", "notifications", "posts", "attendance", 
    "expenses", "exit_requests", "seat_change_requests", "night_logs"
  ];

  for (const table of tables) {
    try {
      const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
      if (error) {
        console.log(`${table}: Error - ${error.message}`);
      } else {
        console.log(`${table}: ${count} rows`);
      }
    } catch (e: any) {
      console.log(`${table}: Exception - ${e.message}`);
    }
  }

  console.log("\n--- RECENT DATA SAMPLES ---");
  const { data: recentReaders } = await supabase.from("readers").select("id, name, status").order("created_at", { ascending: false }).limit(3);
  console.log("Recent Readers:", JSON.stringify(recentReaders, null, 2));

  const { data: recentBills } = await supabase.from("bills").select("id, reader_id, status, amount_due").order("created_at", { ascending: false }).limit(3);
  console.log("Recent Bills:", JSON.stringify(recentBills, null, 2));
}

introspectDB().catch(console.error);
