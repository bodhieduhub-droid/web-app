import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local variables
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE URL or SERVICE ROLE KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  const email = 'admin@bodhieduhub.com';
  const password = 'adminpassword123';
  
  console.log(`Checking/Creating admin user: ${email}...`);
  
  let { data: userRecord, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  
  if (createError && createError.message.includes('already exists')) {
     const { data } = await supabase.auth.admin.listUsers();
     userRecord = { user: data.users.find(u => u.email === email) };
     console.log('User already exists. Proceeding to update role...');
  } else if (createError) {
     console.error('Error creating user:', createError.message);
     process.exit(1);
  }
  
  // ensure role=super_admin in profiles table
  const { error: profileError } = await supabase.from('profiles').update({ role: 'super_admin' }).eq('id', userRecord.user.id);
  
  if (profileError) {
     console.log('Error updating profile role:', profileError.message);
     // Sometimes profile trigger takes a moment
     console.log('Ensure that you have a trigger that creates a profile on user signup, or manually insert it.');
  } else {
     console.log(`\n✅ Successfully configured super_admin credentials!`);
     console.log(`Email: ${email}`);
     console.log(`Password: ${password}\n`);
     console.log(`You can now go to http://localhost:3000/login and use these credentials.`);
  }
}

main();
