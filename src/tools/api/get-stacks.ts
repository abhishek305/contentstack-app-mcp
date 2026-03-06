import { z } from "zod";
import { callDevHub } from "./apiClient.js";

export const getStacksSchema = z.object({ org_uid: z.string() });

export const getStacksTool = {
  name: "cs_get_stacks",
  description: "Lists all stacks in an organization. Requires CONTENTSTACK_MANAGEMENT_TOKEN.\nInput: { org_uid: string }\nOutput: { success, data }",
  schema: getStacksSchema,
  handler: async (input: z.infer<typeof getStacksSchema>) => {
    try {
      return await callDevHub("GET", `/organizations/${input.org_uid}/stacks`);
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};
