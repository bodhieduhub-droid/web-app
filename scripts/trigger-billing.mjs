import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function triggerBilling() {
  console.log("🚀 Triggering billing cron job...");
  
  try {
    const response = await fetch("http://localhost:3000/api/cron/billing");
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Success! Created ${data.createdCount} new bills for the missed students.`);
    } else {
      console.error("❌ Failed:", data.error || "Unknown error");
      console.log("Make sure your local server is running at http://localhost:3000 (npm run dev)");
    }
  } catch (error) {
    console.error("❌ Error connecting to server:", error.message);
    console.log("Please ensure your server is running with 'npm run dev' before running this script.");
  }
}

triggerBilling();
