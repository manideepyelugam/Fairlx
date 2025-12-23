"use client";

import { useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsageEvent, ResourceType } from "../types";

interface UsageChartsProps {
    events: UsageEvent[];
    isLoading: boolean;
}

const COLORS = {
    traffic: "#3b82f6",
    storage: "#f59e0b",
    compute: "#8b5cf6",
    api: "#06b6d4",
    file: "#10b981",
    job: "#f97316",
    ai: "#ec4899",
};

export function UsageCharts({ events, isLoading }: UsageChartsProps) {
    // Aggregate events by date for line chart
    const timeSeriesData = useMemo(() => {
        if (!events.length) return [];

        const byDate: Record<string, { date: string; traffic: number; storage: number; compute: number }> = {};

        for (const event of events) {
            const date = event.timestamp.split("T")[0];
            if (!byDate[date]) {
                byDate[date] = { date, traffic: 0, storage: 0, compute: 0 };
            }

            const gbValue = event.units / (1024 * 1024 * 1024);
            switch (event.resourceType) {
                case ResourceType.TRAFFIC:
                    byDate[date].traffic += gbValue;
                    break;
                case ResourceType.STORAGE:
                    byDate[date].storage += gbValue;
                    break;
                case ResourceType.COMPUTE:
                    byDate[date].compute += event.units;
                    break;
            }
        }

        return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
    }, [events]);

    // Aggregate by resource type for pie chart
    const resourceBreakdown = useMemo(() => {
        if (!events.length) return [];

        const totals: Record<string, number> = { traffic: 0, storage: 0, compute: 0 };

        for (const event of events) {
            totals[event.resourceType] += event.units;
        }

        const total = Object.values(totals).reduce((a, b) => a + b, 0);

        return Object.entries(totals)
            .filter(([, value]) => value > 0)
            .map(([name, value]) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1),
                value,
                percentage: ((value / total) * 100).toFixed(1),
            }));
    }, [events]);

    // Aggregate by source for bar chart
    const sourceBreakdown = useMemo(() => {
        if (!events.length) return [];

        const totals: Record<string, { total: number; ai: number; nonAi: number }> = {};

        for (const event of events) {
            if (!totals[event.source]) {
                totals[event.source] = { total: 0, ai: 0, nonAi: 0 };
            }
            totals[event.source].total += event.units;

            // Parse metadata to check if AI
            if (event.metadata) {
                try {
                    const meta = JSON.parse(event.metadata);
                    if (meta.isAI) {
                        totals[event.source].ai += event.units;
                    } else {
                        totals[event.source].nonAi += event.units;
                    }
                } catch {
                    totals[event.source].nonAi += event.units;
                }
            } else {
                totals[event.source].nonAi += event.units;
            }
        }

        return Object.entries(totals).map(([source, data]) => ({
            source: source.toUpperCase(),
            ai: data.ai,
            nonAi: data.nonAi,
            total: data.total,
        }));
    }, [events]);

    if (isLoading) {
        return (
            <Card className="animate-pulse">
                <CardHeader>
                    <div className="h-6 w-48 bg-muted rounded" />
                </CardHeader>
                <CardContent>
                    <div className="h-80 bg-muted rounded" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Usage Analytics</CardTitle>
                <CardDescription>
                    Visual breakdown of your resource usage over time
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="timeline" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="timeline">Usage Over Time</TabsTrigger>
                        <TabsTrigger value="breakdown">Resource Breakdown</TabsTrigger>
                        <TabsTrigger value="sources">By Source</TabsTrigger>
                    </TabsList>

                    <TabsContent value="timeline" className="h-80">
                        {timeSeriesData.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                No usage data available for this period
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={timeSeriesData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="date" className="text-xs" />
                                    <YAxis className="text-xs" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--background))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px",
                                        }}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="traffic"
                                        name="Traffic (GB)"
                                        stroke={COLORS.traffic}
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="storage"
                                        name="Storage (GB)"
                                        stroke={COLORS.storage}
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="compute"
                                        name="Compute (Units)"
                                        stroke={COLORS.compute}
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </TabsContent>

                    <TabsContent value="breakdown" className="h-80">
                        {resourceBreakdown.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                No usage data available
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={resourceBreakdown}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percentage }) => `${name} (${percentage}%)`}
                                        outerRadius={120}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {resourceBreakdown.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => value.toLocaleString()}
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--background))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px",
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </TabsContent>

                    <TabsContent value="sources" className="h-80">
                        {sourceBreakdown.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                No usage data available
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={sourceBreakdown}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="source" className="text-xs" />
                                    <YAxis className="text-xs" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--background))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px",
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="nonAi" name="Non-AI" stackId="a" fill={COLORS.job} />
                                    <Bar dataKey="ai" name="AI" stackId="a" fill={COLORS.ai} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
