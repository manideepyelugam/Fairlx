import { Hono } from "hono";

import auditLogsRoute from "../server/route";

const app = new Hono().route("/", auditLogsRoute);

export default app;
