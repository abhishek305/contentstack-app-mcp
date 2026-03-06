import { preflightTool } from "./preflight.js";
import { planTool } from "./plan.js";
import { manifestTool } from "./manifest.js";
import { scaffoldTool } from "./scaffold.js";
import { analyzeTool } from "./analyze.js";
import { migrateTool } from "./migrate.js";

export const generationTools = [
  preflightTool,
  planTool,
  manifestTool,
  scaffoldTool,
  analyzeTool,
  migrateTool,
];
