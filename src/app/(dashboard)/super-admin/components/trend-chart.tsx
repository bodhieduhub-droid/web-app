"use client";
// Force turbopack invalidation

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDateToIST } from "@/lib/utils";

type TrendData = {
  date: string;
  revenue: number;
};

export function TrendChart({ data }: { data: TrendData[] }) {
  // Format dates for display
  const chartData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      displayDate: formatDateToIST(d.date, "date"),
    }));
  }, [data]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <p className="text-sm font-medium text-[#6d7c6c]">No trend data available for this period.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Business Trends</p>
          <h2 className="mt-1 text-xl font-bold text-[#1b3022]">30-Day Revenue Analysis</h2>
        </div>
      </div>
      <div className="h-[300px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1b3022" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1b3022" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis 
              dataKey="displayDate" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "#6d7c6c" }} 
              dy={10} 
              minTickGap={30}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "#6d7c6c" }} 
              tickFormatter={(value) => `₹${value}`}
              dx={-10}
            />
            <Tooltip
              contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
              labelStyle={{ fontWeight: "bold", color: "#1b3022", marginBottom: "4px" }}
              formatter={(value: any) => [`₹${value}`, "Revenue"]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#1b3022"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
