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

interface WorkspacePriorityDistributionChartProps {
    data: {
        name: string;
        count: number;
        fill: string;
    }[];
}

export const WorkspacePriorityDistributionChart = ({ data }: WorkspacePriorityDistributionChartProps) => {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-slate-700" />
                <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                />
                <RechartsTooltip
                    contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                    }}
                />
                <Bar
                    dataKey="count"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                />
            </RechartsBarChart>
        </ResponsiveContainer>
    );
};
