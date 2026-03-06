import { z } from "zod";
import { callDevHub } from "./apiClient.js";

export const updateAppSchema = z.object({
  app_uid: z.string().describe("App UID from Developer Hub"),
  manifest: z.record(z.unknown()).describe("Updated manifest object"),
});

export const updateAppTool = {
  name: "cs_update_app",
  description: "Updates an existing app manifest in Developer Hub. Requires CONTENTSTACK_MANAGEMENT_TOKEN.\nInput: { app_uid: string, manifest: object }\nOutput: { success, data }",
  schema: updateAppSchema,
  handler: async (input: z.infer<typeof updateAppSchema>) => {
    try {
      return await callDevHub("PUT", `/manifests/${input.app_uid}`, input.manifest);
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};
