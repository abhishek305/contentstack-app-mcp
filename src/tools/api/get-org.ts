import { z } from "zod";
import { callDevHub } from "./apiClient.js";

export const getOrgSchema = z.object({ org_uid: z.string() });

export const getOrgTool = {
  name: "cs_get_org",
  description: "Fetches organization details from Developer Hub. Requires CONTENTSTACK_MANAGEMENT_TOKEN.\nInput: { org_uid: string }\nOutput: { success, data }",
  schema: getOrgSchema,
  handler: async (input: z.infer<typeof getOrgSchema>) => {
    try {
      return await callDevHub("GET", `/organizations/${input.org_uid}`);
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};
