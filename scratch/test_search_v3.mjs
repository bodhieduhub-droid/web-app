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

  // 1. Find matched readers
  const { data: matchedReaders, error: readerError } = await supabase
    .from('readers')
    .select('id')
    .or(`name.ilike.%${query}%,phone.ilike.%${query}%`);

  if (readerError) {
    console.error('Reader search error:', readerError);
    return;
  }

  const readerIds = (matchedReaders ?? []).map(r => r.id);
  console.log('Matched Reader IDs:', readerIds);

  // 2. Search bills
  let orFilter = `title.ilike.%${query}%,id.ilike.%${query}%`;
  if (readerIds.length > 0) {
    orFilter += `,reader_id.in.(${readerIds.join(',')})`;
  }

  const { data, error, count } = await supabase
    .from('bills')
    .select('id, title, readers!inner(name, phone)', { count: 'exact' })
    .or(orFilter);

  if (error) {
    console.error('Bills search error:', error);
  } else {
    console.log(`Found ${count} results.`);
    console.log(JSON.stringify(data, null, 2));
  }
}

async function run() {
  await testSearch('Adhila');
}

run();
