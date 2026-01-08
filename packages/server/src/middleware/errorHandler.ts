import { RpcResponse, RpcErrorCodes } from '../rpc/types';

export function handleError(error: unknown, requestId: string | number | null): RpcResponse {
  console.error('RPC Error:', error);

  if (error instanceof SyntaxError) {
    return {
      jsonrpc: '2.0',
      error: {
        code: RpcErrorCodes.PARSE_ERROR,
        message: 'Parse error: Invalid JSON',
      },
      id: null,
    };
  }

  if (error && typeof error === 'object' && 'code' in error) {
    return {
      jsonrpc: '2.0',
      error: error as any,
      id: requestId,
    };
  }

  return {
    jsonrpc: '2.0',
    error: {
      code: RpcErrorCodes.INTERNAL_ERROR,
      message: error instanceof Error ? error.message : 'Internal error',
    },
    id: requestId,
  };
}
