import { NextResponse } from "next/server";

import { deleteFromCloudinary } from "@/lib/cloudinary";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const providedSecret = request.headers.get("x-cron-secret") ?? new URL(request.url).searchParams.get("secret");

  if (cronSecret && providedSecret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Calculate date 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoffDate = thirtyDaysAgo.toISOString();

  // Find transactions with payment proofs older than 30 days that are verified, rejected, or closed
  const { data: oldTransactions } = await supabase
    .from("transactions")
    .select("id, payment_proof_public_id, submitted_at")
    .not("payment_proof_public_id", "is", null)
    .lt("submitted_at", cutoffDate)
    .in("verification_status", ["verified", "rejected", "closed"]);

  let deletedCount = 0;
  let errorCount = 0;

  for (const transaction of oldTransactions ?? []) {
    try {
      // Delete from Cloudinary
      if (transaction.payment_proof_public_id) {
        await deleteFromCloudinary(transaction.payment_proof_public_id);
      }

      // Clear the proof fields in database
      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          payment_proof_url: null,
          payment_proof_public_id: null,
        })
        .eq("id", transaction.id);

      if (updateError) {
        console.error(`Failed to clear proof fields for transaction ${transaction.id}:`, updateError);
        errorCount += 1;
      } else {
        deletedCount += 1;
      }
    } catch (error) {
      console.error(`Error cleaning up screenshot for transaction ${transaction.id}:`, error);
      errorCount += 1;
    }
  }

  return NextResponse.json({
    success: true,
    deletedCount,
    errorCount,
    totalProcessed: (oldTransactions ?? []).length,
    cutoffDate,
  });
}
