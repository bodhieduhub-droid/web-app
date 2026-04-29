"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function RealtimeTableListener({ 
  table, 
  filter, 
  schema = "public" 
}: { 
  table: string; 
  filter?: string; 
  schema?: string 
}) {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: schema,
          table: table,
          filter: filter,
        },
        () => {
          // Trigger a server-side data refresh without a full page reload
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, schema, router, supabase]);

  return null; // Invisible listener
}
