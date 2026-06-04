"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type DashboardChartsProps = {
  data: Array<{ month: string; total: number }>;
};

export function DashboardCharts({ data }: DashboardChartsProps) {
  if (!data.length) {
    return <p className="text-secondary mb-0">Belum ada data untuk grafik.</p>;
  }

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(148, 163, 184, 0.18)" strokeDasharray="3 3" />
          <XAxis
            axisLine={{ stroke: "rgba(148, 163, 184, 0.35)" }}
            dataKey="month"
            tick={{ fill: "#9aa4b2", fontSize: 12 }}
            tickLine={{ stroke: "rgba(148, 163, 184, 0.28)" }}
          />
          <YAxis
            allowDecimals={false}
            axisLine={{ stroke: "rgba(148, 163, 184, 0.35)" }}
            tick={{ fill: "#9aa4b2", fontSize: 12 }}
            tickLine={{ stroke: "rgba(148, 163, 184, 0.28)" }}
          />
          <Tooltip
            contentStyle={{
              background: "#11151d",
              border: "1px solid #3b465a",
              borderRadius: 8,
              color: "#f4f7fb"
            }}
            cursor={{ fill: "rgba(20, 184, 166, 0.08)" }}
            labelStyle={{ color: "#f4f7fb", fontWeight: 700 }}
          />
          <Bar dataKey="total" fill="#14b8a6" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
