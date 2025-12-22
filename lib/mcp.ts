import { randomUUID } from 'crypto';

const DEFAULT_TIMEOUT_MS = 12_000;

type RpcResult = unknown;

type RpcError = {
  code: number | string;
  message: string;
  data?: unknown;
};

type RpcResponse =
  | { result: RpcResult; error?: undefined }
  | { result?: undefined; error: RpcError };

export function normalizeMcpUrl(baseUrl: string | undefined): string {
  if (!baseUrl) {
    throw { code: 'CONFIG_ERROR', message: 'MCP_SERVER_URL is not set' };
  }
  // Trim whitespace and remove trailing slashes
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  // Check if it already ends with /mcp (case-sensitive)
  if (trimmed.endsWith('/mcp')) {
    return trimmed;
  }
  // If it ends with /api/server, return as-is (do NOT append /mcp)
  if (trimmed.endsWith('/api/server')) {
    return trimmed;
  }
  // Append /mcp if missing
  return `${trimmed}/mcp`;
}

function parseSseResponse(text: string): RpcResponse {
  const lines = text.split('\n');
  let lastDataLine = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('data: ')) {
      lastDataLine = trimmed.substring(6); // Remove 'data: ' prefix
    } else if (trimmed.startsWith('data:')) {
      lastDataLine = trimmed.substring(5); // Remove 'data:' prefix (no space)
    }
  }
  
  if (!lastDataLine) {
    throw new Error('No data: line found in SSE response');
  }
  
  return JSON.parse(lastDataLine) as RpcResponse;
}

async function rpcRequest(method: string, params: Record<string, unknown>, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = normalizeMcpUrl(process.env.MCP_SERVER_URL);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: randomUUID(),
        method,
        params,
      }),
      signal: controller.signal,
    });

    const safeStatus = response.status;
    const contentType = response.headers.get('content-type') || '';
    let json: RpcResponse;
    let bodyPreview = '';
    
    try {
      if (contentType.includes('text/event-stream')) {
        // Parse SSE format
        const bodyText = await response.text();
        bodyPreview = bodyText.substring(0, 200);
        json = parseSseResponse(bodyText);
      } else if (contentType.includes('application/json')) {
        // Parse JSON directly
        json = (await response.json()) as RpcResponse;
        bodyPreview = JSON.stringify(json).substring(0, 200);
      } else {
        // Try to parse as JSON first, fallback to SSE
        const bodyText = await response.text();
        bodyPreview = bodyText.substring(0, 200);
        try {
          json = JSON.parse(bodyText) as RpcResponse;
        } catch {
          json = parseSseResponse(bodyText);
        }
      }
    } catch (error) {
      throw {
        code: 'RPC_PARSE_ERROR',
        message: 'Invalid JSON-RPC response',
        data: { status: safeStatus, contentType, url, bodyPreview },
      };
    }

    if ('error' in json && json.error) {
      throw { code: json.error.code, message: json.error.message || 'RPC error' };
    }

    return json.result;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw { code: 'TIMEOUT', message: 'MCP request timed out' };
    }
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      throw error;
    }
    throw { code: 'NETWORK_ERROR', message: 'Failed to reach MCP server' };
  } finally {
    clearTimeout(timeout);
  }
}

export async function mcpToolsList() {
  return rpcRequest('tools/list', {});
}

export async function mcpCallTool(toolName: string, args: Record<string, unknown>) {
  return rpcRequest('tools/call', { name: toolName, arguments: args });
}

