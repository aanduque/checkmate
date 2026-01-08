import { RpcRequest, RpcResponse, RpcMethod, RpcErrorCodes } from './types';

export class RpcServer {
  private methods: Map<string, RpcMethod> = new Map();

  register(name: string, handler: RpcMethod): void {
    this.methods.set(name, handler);
  }

  registerAll(methods: Record<string, RpcMethod>): void {
    for (const [name, handler] of Object.entries(methods)) {
      this.register(name, handler);
    }
  }

  async handle(request: RpcRequest): Promise<RpcResponse> {
    const method = this.methods.get(request.method);

    if (!method) {
      return {
        jsonrpc: '2.0',
        error: {
          code: RpcErrorCodes.METHOD_NOT_FOUND,
          message: `Method not found: ${request.method}`,
        },
        id: request.id,
      };
    }

    try {
      const result = await method(request.params);
      return { jsonrpc: '2.0', result, id: request.id };
    } catch (error: any) {
      return {
        jsonrpc: '2.0',
        error: {
          code: error.code || RpcErrorCodes.INTERNAL_ERROR,
          message: error.message || 'Internal error',
          data: error.data,
        },
        id: request.id,
      };
    }
  }

  async handleBatch(requests: RpcRequest[]): Promise<RpcResponse[]> {
    return Promise.all(requests.map((req) => this.handle(req)));
  }

  getMethods(): string[] {
    return Array.from(this.methods.keys());
  }
}
