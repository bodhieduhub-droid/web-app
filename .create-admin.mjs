import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const email = 'admin@bodhieduhub.com';
  const password = 'adminpassword123';
  
  console.log('Checking/Creating admin user...');
  let { data: user, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  
  if (createError && createError.message.includes('already exists')) {
     const { data } = await supabase.auth.admin.listUsers();
     user = { user: data.users.find(u => u.email === email) };
     console.log('User already exists, updating role...');
  } else if (createError) {
     console.error('Error creating user:', createError);
     return;
  }
  
  // ensure role=super_admin in profiles table
  const { error: profileError } = await supabase.from('profiles').update({ role: 'super_admin' }).eq('id', user.user.id);
  if (profileError) {
     console.log('Error updating profile:', profileError);
  } else {
     console.log(`\n✅ Successfully configured super_admin credentials:\nEmail: ${email}\nPassword: ${password}\n`);
  }
}
main();
