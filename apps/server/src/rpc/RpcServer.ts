/**
 * RpcServer - JSON-RPC 2.0 Server implementation
 *
 * Handles JSON-RPC 2.0 requests with method registration.
 * Supports both single requests and batch requests.
 */

export interface RpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: unknown;
  id: string | number;
}

export interface RpcResponse {
  jsonrpc: '2.0';
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
  id: string | number | null;
}

export type RpcHandler = (params: unknown) => Promise<unknown>;

type ParseResult =
  | { request: RpcRequest }
  | { batch: RpcRequest[] }
  | RpcResponse;

export class RpcServer {
  private methods: Map<string, RpcHandler> = new Map();

  /**
   * Register a method handler
   */
  register(name: string, handler: RpcHandler): void {
    this.methods.set(name, handler);
  }

  /**
   * Check if a method is registered
   */
  hasMethod(name: string): boolean {
    return this.methods.has(name);
  }

  /**
   * Handle a single RPC request
   */
  async handle(request: RpcRequest): Promise<RpcResponse> {
    const method = this.methods.get(request.method);

    if (!method) {
      return {
        jsonrpc: '2.0',
        error: { code: -32601, message: 'Method not found' },
        id: request.id
      };
    }

    try {
      const result = await method(request.params);
      return { jsonrpc: '2.0', result, id: request.id };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        jsonrpc: '2.0',
        error: { code: -32000, message },
        id: request.id
      };
    }
  }

  /**
   * Handle a batch of RPC requests
   */
  async handleBatch(requests: RpcRequest[]): Promise<RpcResponse[]> {
    return Promise.all(requests.map(request => this.handle(request)));
  }

  /**
   * Parse a JSON string into an RPC request
   * Returns error response if parsing fails or request is invalid
   */
  static parseRequest(json: string): ParseResult {
    let data: unknown;

    try {
      data = JSON.parse(json);
    } catch {
      return {
        jsonrpc: '2.0',
        error: { code: -32700, message: 'Parse error' },
        id: null
      };
    }

    // Handle batch requests
    if (Array.isArray(data)) {
      const requests: RpcRequest[] = [];
      for (const item of data) {
        const validated = RpcServer.validateRequest(item);
        if ('error' in validated) {
          return validated;
        }
        requests.push(validated.request);
      }
      return { batch: requests };
    }

    // Handle single request
    return RpcServer.validateRequest(data);
  }

  private static validateRequest(data: unknown): { request: RpcRequest } | RpcResponse {
    if (typeof data !== 'object' || data === null) {
      return {
        jsonrpc: '2.0',
        error: { code: -32600, message: 'Invalid Request' },
        id: null
      };
    }

    const obj = data as Record<string, unknown>;

    // Check jsonrpc version
    if (obj.jsonrpc !== '2.0') {
      return {
        jsonrpc: '2.0',
        error: { code: -32600, message: 'Invalid Request' },
        id: null
      };
    }

    // Check method exists
    if (typeof obj.method !== 'string') {
      return {
        jsonrpc: '2.0',
        error: { code: -32600, message: 'Invalid Request' },
        id: typeof obj.id === 'string' || typeof obj.id === 'number' ? obj.id : null
      };
    }

    // Valid request
    return {
      request: {
        jsonrpc: '2.0',
        method: obj.method,
        params: obj.params,
        id: obj.id as string | number
      }
    };
  }
}
