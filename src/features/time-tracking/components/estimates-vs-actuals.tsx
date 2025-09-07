import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useGetEstimatesVsActuals } from "../api/use-get-estimates-vs-actuals";
import { EstimateVsActual } from "../types";

interface EstimatesVsActualsProps {
  workspaceId: string;
  projects?: Array<{ $id: string; name: string }>;
}

export const EstimatesVsActuals = ({ workspaceId, projects }: EstimatesVsActualsProps) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");

  const { data: estimates, isLoading } = useGetEstimatesVsActuals({
    workspaceId,
    projectId: selectedProjectId === "all" ? undefined : selectedProjectId,
  });

  const getVarianceIcon = (variancePercent: number) => {
    if (variancePercent > 0) {
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    } else if (variancePercent < 0) {
      return <TrendingDown className="h-4 w-4 text-green-500" />;
    }
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getVarianceBadge = (variancePercent: number) => {
    if (Math.abs(variancePercent) < 10) {
      return <Badge variant="default">On Track</Badge>;
    } else if (variancePercent > 0) {
      return <Badge variant="destructive">Over Estimate</Badge>;
    } else {
      return <Badge variant="secondary">Under Estimate</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estimates vs Actuals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalEstimated = estimates?.reduce((sum, item) => sum + item.estimatedHours, 0) || 0;
  const totalActual = estimates?.reduce((sum, item) => sum + item.actualHours, 0) || 0;
  const totalVariance = totalActual - totalEstimated;
  const totalVariancePercent = totalEstimated > 0 ? (totalVariance / totalEstimated) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Estimates vs Actuals</span>
          <div className="flex items-center gap-2">
            {projects && projects.length > 0 && (
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.$id} value={project.$id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!estimates || estimates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No estimation data found. Start by adding estimated hours to your tasks.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-muted-foreground">Total Estimated</div>
                  <div className="text-2xl font-bold">{totalEstimated.toFixed(1)}h</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-muted-foreground">Total Actual</div>
                  <div className="text-2xl font-bold">{totalActual.toFixed(1)}h</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-muted-foreground">Variance</div>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    {getVarianceIcon(totalVariancePercent)}
                    {totalVariance > 0 ? '+' : ''}{totalVariance.toFixed(1)}h
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-muted-foreground">Accuracy</div>
                  <div className="text-2xl font-bold">
                    {getVarianceBadge(totalVariancePercent)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Estimated</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead className="text-right">% Variance</TableHead>
                    <TableHead>Accuracy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estimates.map((estimate: EstimateVsActual) => (
                    <TableRow key={estimate.taskId}>
                      <TableCell className="font-medium max-w-xs truncate">
                        {estimate.taskName}
                      </TableCell>
                      <TableCell>{estimate.projectName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {estimate.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {estimate.estimatedHours.toFixed(1)}h
                      </TableCell>
                      <TableCell className="text-right">
                        {estimate.actualHours.toFixed(1)}h
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {getVarianceIcon(estimate.variancePercent)}
                          <span className={
                            estimate.variance > 0 
                              ? "text-red-600" 
                              : estimate.variance < 0 
                              ? "text-green-600" 
                              : "text-gray-600"
                          }>
                            {estimate.variance > 0 ? '+' : ''}{estimate.variance.toFixed(1)}h
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={
                          estimate.variancePercent > 0 
                            ? "text-red-600" 
                            : estimate.variancePercent < 0 
                            ? "text-green-600" 
                            : "text-gray-600"
                        }>
                          {estimate.variancePercent > 0 ? '+' : ''}{estimate.variancePercent.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {getVarianceBadge(estimate.variancePercent)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
