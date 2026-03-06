"use client";

import {
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from "recharts";

interface PriorityDataItem {
  name: string;
  count: number;
  fill?: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#eab308",
  LOW: "#6b7280",
};

interface WorkspacePriorityDistributionChartProps {
  data: PriorityDataItem[];
}

export const WorkspacePriorityDistributionChart = ({
  data,
}: WorkspacePriorityDistributionChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-[260px] flex flex-col items-center justify-center text-sm text-muted-foreground">
        <div className="h-10 w-24 rounded bg-muted mb-3" />
        <p>No priority data available</p>
      </div>
    );
  }

  return (
    <div>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border))"
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={
                    entry.fill || PRIORITY_COLORS[entry.name] || "#6b7280"
                  }
                />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{
                backgroundColor:
                  item.fill || PRIORITY_COLORS[item.name] || "#6b7280",
              }}
            />
            <span className="text-xs text-muted-foreground">
              {item.name}{" "}
              <span className="font-medium text-foreground">{item.count}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
