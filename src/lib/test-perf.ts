import { createAdminClient } from "./supabase/admin";

async function testPerformance() {
  const supabase = createAdminClient();
  const start = Date.now();
  
  console.log("Testing students query...");
  const t1 = Date.now();
  await supabase.from("readers").select("id, name").limit(100);
  console.log(`Readers query took: ${Date.now() - t1}ms`);

  console.log("Testing bills query...");
  const t2 = Date.now();
  await supabase.from("bills").select("id, status").limit(100);
  console.log(`Bills query took: ${Date.now() - t2}ms`);

  console.log("Testing transactions query...");
  const t3 = Date.now();
  await supabase.from("transactions").select("id, amount").limit(100);
  console.log(`Transactions query took: ${Date.now() - t3}ms`);

  console.log(`Total test took: ${Date.now() - start}ms`);
}

testPerformance().catch(console.error);
