import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const email = 'admin@bodhieduhub.com';
  
  // Find the user
  const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers();
  if (usersErr) {
    console.error('Failed to list users:', usersErr.message);
    return;
  }
  
  const user = usersData.users.find(u => u.email === email);
  if (!user) {
    console.log('User not found in auth.users! Run create-admin.mjs first.');
    return;
  }

  // UPSERT the profile
  console.log(`Ensuring profile exists for user id: ${user.id}...`);
  const { error: upsertError } = await supabase.from('profiles').upsert({
    id: user.id,
    full_name: 'Super Admin',
    role: 'super_admin',
    onboarding_required: false
  });

  if (upsertError) {
    console.error('Failed to create profile:', upsertError.message);
  } else {
    console.log('\n✅ Successfully added super_admin to the public.profiles table!');
    console.log('You can now log in successfully on the frontend.');
  }
}
main();
