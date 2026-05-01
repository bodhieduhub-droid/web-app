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

async function testSearch(query) {
  console.log(`Testing search for: "${query}"`);
  // Try using filter('or', ...)
  const { data, error, count } = await supabase
    .from('bills')
    .select('id, title, readers!inner(name, phone)', { count: 'exact' })
    .filter('or', `(title.ilike.%${query}%,id.ilike.%${query}%,readers.name.ilike.%${query}%,readers.phone.ilike.%${query}%)`);

  if (error) {
    console.error('Search error:', error);
  } else {
    console.log(`Found ${count} results.`);
    console.log(JSON.stringify(data, null, 2));
  }
}

async function run() {
  await testSearch('Adhila');
}

run();
