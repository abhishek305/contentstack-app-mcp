import { z } from "zod";
import { callDevHub } from "./apiClient.js";

export const deleteAppSchema = z.object({ app_uid: z.string() });

export const deleteAppTool = {
  name: "cs_delete_app",
  description: "Deletes an app from Developer Hub. Requires CONTENTSTACK_MANAGEMENT_TOKEN. IRREVERSIBLE.\nInput: { app_uid: string }\nOutput: { success }",
  schema: deleteAppSchema,
  handler: async (input: z.infer<typeof deleteAppSchema>) => {
    try {
      return await callDevHub("DELETE", `/manifests/${input.app_uid}`);
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};
