import { z } from "zod";
import { readResource } from "../../resources/loader.js";

export const preflightSchema = z.object({
  spec: z.record(z.unknown()).describe("Structured app specification object"),
});

const VALID_LOCATION_TYPES = new Set([
  "cs.cm.stack.custom_field",
  "cs.cm.stack.sidebar",
  "cs.cm.stack.dashboard",
  "cs.cm.stack.asset_sidebar",
  "cs.cm.stack.full_page",
  "cs.cm.stack.field_modifier",
  "cs.cm.stack.content_type_sidebar",
  "cs.cm.stack.rte",
  "cs.cm.stack.config",
  "cs.cm.organization.full_page",
]);

const VALID_DATA_TYPES = new Set(["text", "json", "number", "boolean", "date"]);
const VALID_ALLOWED_TYPES = new Set(["text", "json", "number", "file", "reference"]);

type PreflightResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  security_tier: 1 | 2 | 3;
  security_sub_tier: "3a" | "3b" | null;
  inferred_permissions: string[];
  needs_app_config: boolean;
}

export function runPreflight(spec: Record<string, unknown>): PreflightResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required top-level fields
  if (!spec.app_name || typeof spec.app_name !== "string" || spec.app_name.trim() === "") {
    errors.push("app_name is required and must be a non-empty string");
  }
  if (!spec.target_type || !["stack", "organization"].includes(spec.target_type as string)) {
    errors.push("target_type is required and must be 'stack' or 'organization'");
  }
  if (!Array.isArray(spec.ui_locations) || spec.ui_locations.length === 0) {
    errors.push("ui_locations is required and must be a non-empty array");
  }

  const locations: Array<Record<string, unknown>> = Array.isArray(spec.ui_locations)
    ? (spec.ui_locations as Array<Record<string, unknown>>)
    : [];

  const locationTypes = new Set<string>();

  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i];
    const locType = loc.type as string;

    if (!locType || !VALID_LOCATION_TYPES.has(locType)) {
      errors.push(`ui_locations[${i}].type "${locType}" is not a valid location type`);
      continue;
    }

    locationTypes.add(locType);

    if (locType === "cs.cm.stack.custom_field") {
      if (!loc.data_type || !VALID_DATA_TYPES.has(loc.data_type as string)) {
        errors.push(`ui_locations[${i}]: custom_field requires data_type (one of: text, json, number, boolean, date)`);
      }
    }

    if (locType === "cs.cm.stack.field_modifier") {
      if (!Array.isArray(loc.allowed_types) || (loc.allowed_types as unknown[]).length === 0) {
        errors.push(`ui_locations[${i}]: field_modifier requires allowed_types (non-empty array)`);
      } else {
        for (const t of loc.allowed_types as unknown[]) {
          if (!VALID_ALLOWED_TYPES.has(t as string)) {
            errors.push(`ui_locations[${i}]: allowed_types contains invalid value "${t}"`);
          }
        }
      }
    }
  }

  // Cross-field rules
  const hasMappings =
    typeof spec.mappings === "object" &&
    spec.mappings !== null &&
    Object.keys(spec.mappings as object).length > 0;

  if (hasMappings && !locationTypes.has("cs.cm.stack.config")) {
    errors.push("advanced_settings.mappings requires a cs.cm.stack.config location for user key input");
  }

  // Webhook validation
  if (Array.isArray(spec.webhooks)) {
    for (let i = 0; i < (spec.webhooks as Array<Record<string, unknown>>).length; i++) {
      const wh = (spec.webhooks as Array<Record<string, unknown>>)[i];
      if (typeof wh.target_url === "string" && !wh.target_url.startsWith("https://")) {
        errors.push(`webhooks[${i}].target_url must start with https://`);
      }
    }
  }

  // Security tier inference
  const hasVariables =
    typeof spec.variables === "object" &&
    spec.variables !== null &&
    Object.keys(spec.variables as object).length > 0;
  const hasRewrites = Array.isArray(spec.rewrites) && (spec.rewrites as unknown[]).length > 0;
  const hasPermissions = Array.isArray(spec.permissions) && (spec.permissions as unknown[]).length > 0;

  let security_tier: 1 | 2 | 3 = 1;
  let security_sub_tier: "3a" | "3b" | null = null;

  if (hasMappings) {
    security_tier = 3;
    security_sub_tier = "3b";
  } else if (hasVariables || hasRewrites) {
    security_tier = 3;
    security_sub_tier = "3a";
  } else if (hasPermissions) {
    security_tier = 2;
  }

  const inferred_permissions = Array.isArray(spec.permissions)
    ? (spec.permissions as string[])
    : [];

  if (hasMappings) {
    warnings.push("Tier 3b: User provides API key via App Config page. Ensure cs.cm.stack.config location is present and configured.");
  }
  if (security_tier === 3 && security_sub_tier === "3a") {
    warnings.push("Tier 3a: Developer-owned API key stored in advanced_settings.variables. Set the actual key value in Developer Hub.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    security_tier,
    security_sub_tier,
    inferred_permissions,
    needs_app_config: hasMappings || locationTypes.has("cs.cm.stack.config"),
  };
}

export const preflightTool = {
  name: "cs_preflight",
  description:
    "Step 3 of the create workflow. Validates a structured app spec and infers security tier + permissions. Call after drafting spec, before cs_plan. Read cs://spec-schema before calling.\nInput: { spec: object }\nOutput: { valid, errors, warnings, security_tier, inferred_permissions, needs_app_config }",
  schema: preflightSchema,
  handler: async (input: z.infer<typeof preflightSchema>) => {
    try {
      const result = runPreflight(input.spec as Record<string, unknown>);
      return result;
    } catch (e) {
      return {
        valid: false,
        errors: [e instanceof Error ? e.message : String(e)],
        warnings: [],
        security_tier: 1 as const,
        security_sub_tier: null,
        inferred_permissions: [],
        needs_app_config: false,
      };
    }
  },
};
