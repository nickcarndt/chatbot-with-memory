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

function normalizeMcpUrl(baseUrl: string | undefined): string {
  if (!baseUrl) {
    throw { code: 'CONFIG_ERROR', message: 'MCP_SERVER_URL is not set' };
  }
  const trimmed = baseUrl.replace(/\/+$/, '');
  if (trimmed.endsWith('/mcp')) {
    return trimmed;
  }
  return `${trimmed}/mcp`;
}

async function rpcRequest(method: string, params: Record<string, unknown>, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = normalizeMcpUrl(process.env.MCP_SERVER_URL);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: randomUUID(),
        method,
        params,
      }),
      signal: controller.signal,
    });

    const safeStatus = response.status;
    let json: RpcResponse;
    try {
      json = (await response.json()) as RpcResponse;
    } catch (error) {
      throw { code: 'RPC_PARSE_ERROR', message: 'Invalid JSON-RPC response', data: { status: safeStatus } };
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

