"use client";

import { LocalStorageCache } from "@/components/ui/local-storage-cache";
import { TrendChart } from "./trend-chart";
import { RecentActivityLog } from "./recent-activity-log";

interface ActivityLog {
  id: string;
  type: "enquiry" | "student" | "invoice" | "payment";
  title: string;
  description: string;
  timestamp: string;
}

interface AnalyticsData {
  trendData: { date: string; revenue: number }[];
  activities: ActivityLog[];
}

export function AnalyticsDisplay({ data: serverData }: { data: AnalyticsData }) {
  return (
    <LocalStorageCache cacheKey="super-admin-analytics" data={serverData}>
      {(data) => {
        const d = data || serverData || { trendData: [], activities: [] };
        return (
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="premium-card relative overflow-hidden p-1">
              <div className="premium-card-inner"></div>
              <TrendChart data={d.trendData} />
            </div>
            <div className="premium-card relative overflow-hidden p-6">
              <div className="premium-card-inner"></div>
              <RecentActivityLog activities={d.activities} />
            </div>
          </section>
        );
      }}
    </LocalStorageCache>
  );
}
