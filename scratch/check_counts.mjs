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

async function check() {
  const { count: billsCount } = await supabase.from('bills').select('*', { count: 'exact', head: true });
  const { count: readersCount } = await supabase.from('readers').select('*', { count: 'exact', head: true });
  const { data: sampleBills } = await supabase.from('bills').select('*, readers(name)').limit(5);

  console.log({ billsCount, readersCount, sampleBills });
}

check();
