// API tools — code written but NOT registered in server.ts (Phase 2)
// To activate: import apiTools and call registerApiTools(server) in server.ts
// Requires: CONTENTSTACK_MANAGEMENT_TOKEN environment variable

import { createAppTool } from "./create-app.js";
import { updateAppTool } from "./update-app.js";
import { getAppTool } from "./get-app.js";
import { installAppTool } from "./install-app.js";
import { deleteAppTool } from "./delete-app.js";
import { getOrgTool } from "./get-org.js";
import { getStacksTool } from "./get-stacks.js";
import { getStackTool } from "./get-stack.js";

export const apiTools = [
  createAppTool,
  updateAppTool,
  getAppTool,
  installAppTool,
  deleteAppTool,
  getOrgTool,
  getStacksTool,
  getStackTool,
];
