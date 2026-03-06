import { z } from "zod";

export const manifestSchema = z.object({
  spec: z.record(z.unknown()).describe("Structured app specification (same object passed to cs_plan)."),
  base_url: z.string().optional().describe("App base URL (default: http://localhost:3000)"),
});

const ROUTE_MAP: Record<string, string> = {
  "cs.cm.stack.custom_field": "/custom-field",
  "cs.cm.stack.sidebar": "/entry-sidebar",
  "cs.cm.stack.dashboard": "/stack-dashboard",
  "cs.cm.stack.asset_sidebar": "/asset-sidebar",
  "cs.cm.stack.full_page": "/full-page",
  "cs.cm.stack.field_modifier": "/field-modifier",
  "cs.cm.stack.content_type_sidebar": "/content-type-sidebar",
  "cs.cm.stack.rte": "/json-rte",
  "cs.cm.stack.config": "/app-configuration",
  "cs.cm.organization.full_page": "/global-full-page",
};

const LOCATION_NAMES: Record<string, string> = {
  "cs.cm.stack.custom_field": "Custom Field",
  "cs.cm.stack.sidebar": "Sidebar Widget",
  "cs.cm.stack.dashboard": "Dashboard Widget",
  "cs.cm.stack.asset_sidebar": "Asset Sidebar",
  "cs.cm.stack.full_page": "Full Page",
  "cs.cm.stack.field_modifier": "Field Modifier",
  "cs.cm.stack.content_type_sidebar": "Content Type Sidebar",
  "cs.cm.stack.rte": "RTE Plugin",
  "cs.cm.stack.config": "App Configuration",
  "cs.cm.organization.full_page": "Global Full Page",
};

function buildLocationMeta(loc: Record<string, unknown>): Record<string, unknown> {
  const locType = loc.type as string;
  const meta: Record<string, unknown> = {
    path: ROUTE_MAP[locType] || `/${locType.split(".").pop()}`,
    signed: false,
    enabled: true,
  };

  if (locType !== "cs.cm.stack.config") {
    meta.name = (loc.label as string) || LOCATION_NAMES[locType] || locType;
  }

  if (locType === "cs.cm.stack.custom_field") {
    meta.data_type = loc.data_type || "json";
    meta.multiple = false;
  }

  if (locType === "cs.cm.stack.field_modifier") {
    meta.allowed_types = loc.allowed_types || [];
  }

  if (locType === "cs.cm.stack.dashboard" && loc.default_width) {
    meta.default_width = loc.default_width;
  }

  if (locType === "cs.cm.stack.asset_sidebar" && loc.width) {
    meta.width = loc.width;
  }

  return meta;
}

function buildAdvancedSettings(spec: Record<string, unknown>): Record<string, unknown> | null {
  const variables = spec.variables as Record<string, string> | undefined;
  const mappings = spec.mappings as Record<string, string> | undefined;
  const rewrites = spec.rewrites as Array<{ source: string; destination: string }> | undefined;

  const hasVariables = variables && Object.keys(variables).length > 0;
  const hasMappings = mappings && Object.keys(mappings).length > 0;
  const hasRewrites = rewrites && rewrites.length > 0;

  if (!hasVariables && !hasMappings && !hasRewrites) return null;

  const advanced: Record<string, unknown> = {};

  if (hasVariables) {
    advanced.variables = Object.entries(variables!).map(([uid]) => ({ uid, value: "" }));
  }

  if (hasMappings) {
    advanced.mappings = Object.entries(mappings!).map(([uid, path]) => ({ uid, path }));
  }

  if (hasRewrites) {
    advanced.rewrites = rewrites;
  }

  return advanced;
}

export function generateManifest(spec: Record<string, unknown>, baseUrl: string): object {
  const locations = (spec.ui_locations as Array<Record<string, unknown>>) || [];

  const manifest: Record<string, unknown> = {
    name: spec.app_name,
    description: spec.description || "",
    target_type: spec.target_type || "stack",
    visibility: "private",
    ui_location: {
      signed: false,
      base_url: baseUrl,
      locations: locations.map((loc) => ({
        type: loc.type,
        meta: [buildLocationMeta(loc)],
      })),
    },
    hosting: {
      provider: "external",
      deployment_url: baseUrl,
    },
  };

  if (Array.isArray(spec.permissions) && (spec.permissions as string[]).length > 0) {
    manifest.permissions = spec.permissions;
  }

  const advancedSettings = buildAdvancedSettings(spec);
  if (advancedSettings) {
    manifest.advanced_settings = advancedSettings;
  }

  if (Array.isArray(spec.webhooks) && (spec.webhooks as unknown[]).length > 0) {
    manifest.webhook = (spec.webhooks as Array<Record<string, unknown>>)[0];
  }

  if (spec.oauth) {
    manifest.oauth = spec.oauth;
  }

  return manifest;
}

export const manifestTool = {
  name: "cs_manifest",
  description:
    "Generates manifest.json in Developer Hub format from a spec. Read cs://manifest for format reference.\nInput: { spec: object, base_url?: string }\nOutput: { manifest: object } — write as manifest.json",
  schema: manifestSchema,
  handler: async (input: z.infer<typeof manifestSchema>) => {
    try {
      const spec = input.spec as Record<string, unknown>;

      if (!spec || Object.keys(spec).length === 0) {
        return {
          success: false,
          error: "spec is required and must be a non-empty object. Pass the same spec used in cs_plan.",
        };
      }

      const baseUrl = input.base_url || "http://localhost:3000";
      const manifest = generateManifest(spec, baseUrl);

      return {
        success: true,
        manifest,
        note: "Write this object as manifest.json at the root of your project.",
      };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  },
};
