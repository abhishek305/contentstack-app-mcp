import { z } from "zod";
import { callDevHub } from "./apiClient.js";

export const getStackSchema = z.object({ stack_api_key: z.string() });

export const getStackTool = {
  name: "cs_get_stack",
  description: "Fetches stack details. Requires CONTENTSTACK_MANAGEMENT_TOKEN.\nInput: { stack_api_key: string }\nOutput: { success, data }",
  schema: getStackSchema,
  handler: async (input: z.infer<typeof getStackSchema>) => {
    try {
      return await callDevHub("GET", `/stacks/${input.stack_api_key}`);
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};
