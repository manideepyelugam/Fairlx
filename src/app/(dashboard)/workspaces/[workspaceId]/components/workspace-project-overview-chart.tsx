"use client";

import {
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";

interface WorkspaceProjectOverviewChartProps {
    data: {
        name: string;
        total: number;
        completed: number;
    }[];
}

export const WorkspaceProjectOverviewChart = ({ data }: WorkspaceProjectOverviewChartProps) => {
    if (!data || data.length === 0 || !data.some(m => m.total > 0)) {
        return (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No task data available yet
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart
                data={data}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-slate-700" />
                <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                />
                <RechartsTooltip
                    contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar
                    dataKey="total"
                    fill="#c7d2fe"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                    name="Total"
                />
                <Bar
                    dataKey="completed"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                    name="Completed"
                />
            </RechartsBarChart>
        </ResponsiveContainer>
    );
};
