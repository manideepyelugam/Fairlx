import { Hono } from "hono";
import programsRoute from "./route";
import membersRoute from "./members-route";
import projectsRoute from "./projects-route";
import milestonesRoute from "./milestones-route";
import analyticsRoute from "./analytics-route";

/**
 * Programs API Routes
 * 
 * Base: /api/programs
 * 
 * Program CRUD:
 * - GET    /                          - List all programs
 * - GET    /:programId                - Get single program
 * - POST   /                          - Create program
 * - PATCH  /:programId                - Update program
 * - DELETE /:programId                - Delete program
 * 
 * Program Members:
 * - GET    /:programId/members        - List program members
 * - POST   /:programId/members        - Add member to program
 * - PATCH  /:programId/members/:memberId - Update member role
 * - DELETE /:programId/members/:memberId - Remove member
 * 
 * Program Projects:
 * - GET    /:programId/projects           - List linked projects
 * - POST   /:programId/projects           - Link project to program
 * - DELETE /:programId/projects/:projectId - Unlink project
 * - GET    /:programId/projects/available - Get available projects to link
 * 
 * Program Milestones:
 * - GET    /:programId/milestones              - List milestones
 * - POST   /:programId/milestones              - Create milestone
 * - GET    /:programId/milestones/:milestoneId - Get single milestone
 * - PATCH  /:programId/milestones/:milestoneId - Update milestone
 * - DELETE /:programId/milestones/:milestoneId - Delete milestone
 * - PATCH  /:programId/milestones/reorder      - Reorder milestones
 * 
 * Program Analytics:
 * - GET    /:programId/analytics           - Get full analytics
 * - GET    /:programId/analytics/summary   - Get quick summary
 * - GET    /:programId/analytics/milestones - Get milestone analytics
 */
const app = new Hono()
  // Base program routes (CRUD)
  .route("/", programsRoute)
  // Program members routes
  .route("/:programId/members", membersRoute)
  // Program projects routes  
  .route("/:programId/projects", projectsRoute)
  // Program milestones routes
  .route("/:programId/milestones", milestonesRoute)
  // Program analytics routes
  .route("/:programId/analytics", analyticsRoute);

export default app;
