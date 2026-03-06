import { z } from "zod";
import { callDevHub } from "./apiClient.js";

export const createAppSchema = z.object({
  manifest: z.record(z.unknown()).describe("Manifest object (output of cs_manifest)"),
  org_uid: z.string().describe("Organization UID"),
});

export const createAppTool = {
  name: "cs_create_app",
  description: "Creates a new app in Developer Hub from a manifest object. Requires CONTENTSTACK_MANAGEMENT_TOKEN.\nInput: { manifest: object, org_uid: string }\nOutput: { app_uid, name }",
  schema: createAppSchema,
  handler: async (input: z.infer<typeof createAppSchema>) => {
    try {
      const result = await callDevHub("POST", `/manifests?org_uid=${input.org_uid}`, input.manifest);
      return result;
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};
