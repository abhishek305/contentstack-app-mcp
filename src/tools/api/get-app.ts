import { z } from "zod";
import { callDevHub } from "./apiClient.js";

export const getAppSchema = z.object({ app_uid: z.string() });

export const getAppTool = {
  name: "cs_get_app",
  description: "Fetches app details from Developer Hub. Requires CONTENTSTACK_MANAGEMENT_TOKEN.\nInput: { app_uid: string }\nOutput: { success, data }",
  schema: getAppSchema,
  handler: async (input: z.infer<typeof getAppSchema>) => {
    try {
      return await callDevHub("GET", `/manifests/${input.app_uid}`);
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};
