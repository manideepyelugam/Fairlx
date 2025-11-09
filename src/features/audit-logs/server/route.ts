import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { sessionMiddleware } from "@/lib/session-middleware";
import { getMember } from "@/features/members/utils";

import { getActivityLogsSchema, getActivityStatsSchema } from "../schemas";
import { getActivityLogs, getActivityStats, formatActivityDescription } from "../utils";

const app = new Hono()
  // Get activity logs (audit trail)
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", getActivityLogsSchema),
    async (c) => {
      const user = c.get("user");
      const databases = c.get("databases");
      const {
        workspaceId,
        projectId,
        userId,
        type,
        action,
        startDate,
        endDate,
        limit,
        cursor,
      } = c.req.valid("query");

      // Verify user is a member of the workspace
      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Get activities from existing collections with pagination
      const result = await getActivityLogs({
        workspaceId,
        projectId,
        userId,
        type,
        action,
        startDate,
        endDate,
        limit,
        cursor,
      });

      // Add formatted descriptions
      const enrichedActivities = result.activities.map((activity) => ({
        ...activity,
        description: formatActivityDescription(activity),
      }));

      return c.json({
        data: enrichedActivities,
        total: enrichedActivities.length,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      });
    }
  )

  // Get activity statistics
  .get(
    "/stats",
    sessionMiddleware,
    zValidator("query", getActivityStatsSchema),
    async (c) => {
      const user = c.get("user");
      const databases = c.get("databases");
      const { workspaceId, startDate, endDate } = c.req.valid("query");

      // Verify user is a member of the workspace
      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Get statistics
      const stats = await getActivityStats({
        workspaceId,
        startDate,
        endDate,
      });

      return c.json({ data: stats });
    }
  );

export default app;
