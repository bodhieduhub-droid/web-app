import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function updateBills() {
  console.log('Updating May 2026 bills to have due_date = 2026-05-05...');
  
  const { data, error, count } = await supabase
    .from('bills')
    .update({ due_date: '2026-05-05' })
    .eq('month', 5)
    .eq('year', 2026)
    .eq('invoice_kind', 'monthly_renewal')
    .select('id');

  if (error) {
    console.error('Update error:', error);
  } else {
    console.log(`Successfully updated ${data.length} bills.`);
  }
}

updateBills();
