const DEVELOPER_HUB_BASE = "https://developerhub-api.contentstack.com/v1";

function getAuthToken(): string {
  const token = process.env.CONTENTSTACK_MANAGEMENT_TOKEN;
  if (!token) {
    throw new Error(
      "CONTENTSTACK_MANAGEMENT_TOKEN environment variable is not set. " +
      "Set it in your Cursor MCP config to enable Developer Hub API tools."
    );
  }
  return token;
}

export interface DevHubResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  status?: number;
}

export async function callDevHub(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown
): Promise<DevHubResponse> {
  const token = getAuthToken();
  const url = `${DEVELOPER_HUB_BASE}${path}`;

  const headers: Record<string, string> = {
    "authtoken": token,
    "Content-Type": "application/json",
  };

  const options: RequestInit = { method, headers };
  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        error: (data as any)?.error_message || `HTTP ${res.status}`,
        data,
      };
    }

    return { success: true, status: res.status, data };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
