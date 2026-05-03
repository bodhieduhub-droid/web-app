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

async function cleanupDuplicates() {
  const studentId = 'ee5fda69-aafa-4d3e-a8f9-82aa45dfb702';
  console.log(`Cleaning up duplicates for student: ${studentId}`);
  
  const { data: sessions, error } = await supabase
    .from('study_sessions')
    .select('id, started_at')
    .eq('reader_id', studentId)
    .gte('started_at', '2026-05-01T00:00:00');

  if (error) {
    console.error('Error fetching sessions:', error);
    return;
  }

  const seen = new Set();
  const toDelete = [];

  for (const session of sessions) {
    if (seen.has(session.started_at)) {
      toDelete.push(session.id);
    } else {
      seen.add(session.started_at);
    }
  }

  if (toDelete.length === 0) {
    console.log('No duplicates found.');
    return;
  }

  console.log(`Found ${toDelete.length} duplicates. Deleting...`);

  // Delete in batches of 50
  for (let i = 0; i < toDelete.length; i += 50) {
    const batch = toDelete.slice(i, i + 50);
    const { error: deleteError } = await supabase
      .from('study_sessions')
      .delete()
      .in('id', batch);

    if (deleteError) {
      console.error('Error deleting batch:', deleteError);
    } else {
      console.log(`Deleted ${i + batch.length} / ${toDelete.length}`);
    }
  }

  console.log('Cleanup complete.');
}

cleanupDuplicates();
