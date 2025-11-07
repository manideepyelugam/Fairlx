import { Hono } from "hono";
import repository from "./route";
import documentation from "./documentation-route";
import commits from "./commits-route";
import qa from "./qa-route";

const app = new Hono()
  .route("/repository", repository)
  .route("/documentation", documentation)
  .route("/commits", commits)
  .route("/qa", qa);

export default app;
