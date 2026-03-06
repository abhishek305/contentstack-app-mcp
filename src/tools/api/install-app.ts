import { z } from "zod";
import { callDevHub } from "./apiClient.js";

export const installAppSchema = z.object({
  app_uid: z.string(),
  stack_api_key: z.string().describe("Stack API key to install the app into"),
});

export const installAppTool = {
  name: "cs_install_app",
  description: "Installs an app to a stack. Requires CONTENTSTACK_MANAGEMENT_TOKEN.\nInput: { app_uid: string, stack_api_key: string }\nOutput: { success, data }",
  schema: installAppSchema,
  handler: async (input: z.infer<typeof installAppSchema>) => {
    try {
      return await callDevHub("POST", `/manifests/${input.app_uid}/install`, { stack_api_key: input.stack_api_key });
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};
