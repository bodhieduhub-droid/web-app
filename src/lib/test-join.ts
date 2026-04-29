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

async function testJoin() {
  loadEnv();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  console.log("Testing Enquiry Join Syntax...");
  
  const { data, error } = await supabase
    .from("enquiries")
    .select("id, name, profiles:assigned_to(full_name)")
    .limit(1);

  if (error) {
    console.error("Syntax 1 Failed:", error.message);
    
    const { data: data2, error: error2 } = await supabase
      .from("enquiries")
      .select("id, name, assigned_to:profiles(full_name)")
      .limit(1);
      
    if (error2) {
      console.error("Syntax 2 Failed:", error2.message);
      
      const { data: data3, error: error3 } = await supabase
        .from("enquiries")
        .select("id, name, profiles!assigned_to(full_name)")
        .limit(1);
        
      if (error3) {
        console.error("Syntax 3 Failed:", error3.message);
      } else {
        console.log("Syntax 3 Success:", data3);
      }
    } else {
      console.log("Syntax 2 Success:", data2);
    }
  } else {
    console.log("Syntax 1 Success:", data);
  }
}

testJoin().catch(console.error);
