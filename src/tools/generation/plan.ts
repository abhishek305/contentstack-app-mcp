import { z } from "zod";
import { runPreflight } from "./preflight.js";

export const planSchema = z.object({
  spec: z.record(z.unknown()).describe("Structured app specification. LLM must read cs://locations and cs://security first to draft this."),
});

function buildConfirmationPrompt(spec: Record<string, unknown>): string {
  const appName = (spec.app_name as string) || "Unnamed App";
  const targetType = (spec.target_type as string) || "stack";
  const locations = (spec.ui_locations as Array<Record<string, unknown>>) || [];
  const locationTypes = locations.map((l) => l.type as string);
  const hasVariables = spec.variables && Object.keys(spec.variables as object).length > 0;
  const hasMappings = spec.mappings && Object.keys(spec.mappings as object).length > 0;
  const hasPermissions = spec.permissions && (spec.permissions as unknown[]).length > 0;

  let securityDesc = "Tier 1 (no external calls, no permissions)";
  if (hasMappings) securityDesc = "Tier 3b (per-installation API key via App Config)";
  else if (hasVariables) securityDesc = "Tier 3a (shared API key in advanced_settings.variables)";
  else if (hasPermissions) securityDesc = "Tier 2 (Contentstack App Permissions)";

  const locDesc = locationTypes
    .map((t) => `  • ${t}`)
    .join("\n");

  const permDesc = hasPermissions
    ? `\nPermissions: ${(spec.permissions as string[]).join(", ")}`
    : "";

  const externalDesc =
    hasVariables || hasMappings
      ? `\nExternal API: ${Array.isArray(spec.rewrites) && (spec.rewrites as unknown[]).length > 0 ? "proxied via advanced_settings.rewrites" : "configured"}`
      : "";

  return `App: ${appName}
Target: ${targetType}
Security: ${securityDesc}${permDesc}${externalDesc}

UI Locations:
${locDesc}

Show this to the user and ask: "Does this look right? Shall I proceed to generate the manifest and scaffold?"
Only proceed to cs_manifest and cs_scaffold after explicit user approval.
Pass the same spec object to cs_manifest({ spec }) and cs_scaffold({ spec, category }) — no plan_id needed.`;
}

export const planTool = {
  name: "cs_plan",
  description:
    "Step 4 of the create workflow. Stateless confirmation gate — validates spec and returns a confirmation_prompt. Call after cs_preflight. Show confirmation_prompt to user and WAIT for approval before proceeding to cs_manifest.\nInput: { spec: object }\nOutput: { success, confirmation_prompt, security_tier, warnings }",
  schema: planSchema,
  handler: async (input: z.infer<typeof planSchema>) => {
    try {
      const spec = input.spec as Record<string, unknown>;

      if (!spec || Object.keys(spec).length === 0) {
        return {
          success: false,
          error: "spec is required and must be a non-empty object",
        };
      }

      const validation = runPreflight(spec);
      if (!validation.valid) {
        return {
          success: false,
          error: "Spec validation failed. Fix errors before calling cs_plan.",
          errors: validation.errors,
          warnings: validation.warnings,
        };
      }

      const confirmationPrompt = buildConfirmationPrompt(spec);

      return {
        success: true,
        confirmation_prompt: confirmationPrompt,
        security_tier: validation.security_tier,
        warnings: validation.warnings,
      };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  },
};
