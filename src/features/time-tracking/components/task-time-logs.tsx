import { useState } from "react";
import { Clock, Trash2, Plus } from "lucide-react";

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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import { useGetTimeLogs } from "../api/use-get-time-logs";
import { useDeleteTimeLog } from "../api/use-delete-time-log";
import { CreateTimeLogModal } from "./create-time-log-modal";
import { format, parseISO } from "date-fns";

interface TaskTimeLogsProps {
  taskId: string;
  taskName: string;
  workspaceId: string;
}

export const TaskTimeLogs = ({ taskId, taskName, workspaceId }: TaskTimeLogsProps) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: timeLogs, isLoading } = useGetTimeLogs({
    workspaceId,
    taskId,
  });

  const { mutate: deleteTimeLog } = useDeleteTimeLog();

  const handleDeleteTimeLog = (timeLogId: string) => {
    if (confirm("Are you sure you want to delete this time log?")) {
      deleteTimeLog({ param: { timeLogId } });
    }
  };

  const totalHours = timeLogs?.documents.reduce((sum, log) => sum + log.hours, 0) || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time Logs
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                Total: {totalHours.toFixed(2)} hours
              </Badge>
              <Button
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Log Time
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!timeLogs?.documents || timeLogs.documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No time logs found for this task.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Log Your First Entry
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Time Period</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeLogs.documents.map((log) => (
                    <TableRow key={log.$id}>
                      <TableCell className="font-medium">
                        {format(parseISO(log.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>{log.hours}</TableCell>
                      <TableCell>
                        {log.startTime && log.endTime 
                          ? `${log.startTime} - ${log.endTime}`
                          : "Not specified"
                        }
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.description}
                      </TableCell>
                      <TableCell>
                        {(log as { user?: { name: string } }).user?.name || "Unknown User"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTimeLog(log.$id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateTimeLogModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        taskId={taskId}
        taskName={taskName}
      />
    </>
  );
};
