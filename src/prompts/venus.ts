import { readResource } from "../resources/loader.js";

export const venusPrompt = {
  name: "cs_venus",
  description: "Look up the correct Venus component for a UI need. Returns exact component name, JSX with correct props, @ts-ignore pattern if needed, and known gotchas.",
  arguments: [
    {
      name: "ui_need",
      description: "Describe the UI element needed (e.g., 'date picker', 'searchable dropdown', 'loading skeleton', 'confirmation modal')",
      required: true,
    },
  ],
  handler: async (args: Record<string, string>) => {
    const uiNeed = args.ui_need || "unspecified";
    const patterns = readResource("cs://patterns") || "cs://patterns resource not available";

    return {
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `You are a Contentstack Venus component expert. The developer needs a Venus component for: "${uiNeed}"

Here is the complete Venus component reference:

${patterns}

---

Using ONLY the components documented above:
1. Identify the correct Venus component for this UI need
2. Provide working JSX with all required props
3. Include the @ts-ignore comment if the component is listed as causing JSX type conflicts
4. Note any known gotchas (e.g., cbModal ban in Custom Fields, DatePicker null vs undefined, etc.)

If no Venus equivalent exists, apply the escalation rule: ask the user to choose between (1) custom component, (2) skip, or (3) third-party library.

Do NOT use components not listed in the reference above.`,
          },
        },
      ],
    };
  },
};
