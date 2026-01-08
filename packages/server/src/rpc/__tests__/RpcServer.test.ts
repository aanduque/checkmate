/**
 * RpcServer - Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RpcServer, RpcRequest, RpcResponse } from '../RpcServer';

describe('RpcServer', () => {
  let server: RpcServer;

  beforeEach(() => {
    server = new RpcServer();
  });

  describe('register', () => {
    it('should register a method handler', () => {
      const handler = async () => 'result';
      server.register('test.method', handler);

      // Method should be callable
      expect(server.hasMethod('test.method')).toBe(true);
    });

    it('should not have unregistered methods', () => {
      expect(server.hasMethod('nonexistent')).toBe(false);
    });
  });

  describe('handle', () => {
    it('should handle valid request and return result', async () => {
      server.register('math.add', async (params) => {
        const { a, b } = params as { a: number; b: number };
        return a + b;
      });

      const request: RpcRequest = {
        jsonrpc: '2.0',
        method: 'math.add',
        params: { a: 2, b: 3 },
        id: 1
      };

      const response = await server.handle(request);

      expect(response).toEqual({
        jsonrpc: '2.0',
        result: 5,
        id: 1
      });
    });

    it('should return method not found error for unknown method', async () => {
      const request: RpcRequest = {
        jsonrpc: '2.0',
        method: 'unknown.method',
        params: {},
        id: 'abc'
      };

      const response = await server.handle(request);

      expect(response).toEqual({
        jsonrpc: '2.0',
        error: { code: -32601, message: 'Method not found' },
        id: 'abc'
      });
    });

    it('should return error when handler throws', async () => {
      server.register('error.method', async () => {
        throw new Error('Something went wrong');
      });

      const request: RpcRequest = {
        jsonrpc: '2.0',
        method: 'error.method',
        params: {},
        id: 2
      };

      const response = await server.handle(request);

      expect(response).toEqual({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Something went wrong' },
        id: 2
      });
    });

    it('should handle request without params', async () => {
      server.register('no.params', async () => 'no params needed');

      const request: RpcRequest = {
        jsonrpc: '2.0',
        method: 'no.params',
        id: 3
      };

      const response = await server.handle(request);

      expect(response).toEqual({
        jsonrpc: '2.0',
        result: 'no params needed',
        id: 3
      });
    });

    it('should preserve id type (string)', async () => {
      server.register('test', async () => 'ok');

      const request: RpcRequest = {
        jsonrpc: '2.0',
        method: 'test',
        id: 'string-id-123'
      };

      const response = await server.handle(request);

      expect(response.id).toBe('string-id-123');
    });

    it('should preserve id type (number)', async () => {
      server.register('test', async () => 'ok');

      const request: RpcRequest = {
        jsonrpc: '2.0',
        method: 'test',
        id: 42
      };

      const response = await server.handle(request);

      expect(response.id).toBe(42);
    });
  });

  describe('handleBatch', () => {
    it('should handle batch requests', async () => {
      server.register('echo', async (params) => params);

      const requests: RpcRequest[] = [
        { jsonrpc: '2.0', method: 'echo', params: 'first', id: 1 },
        { jsonrpc: '2.0', method: 'echo', params: 'second', id: 2 }
      ];

      const responses = await server.handleBatch(requests);

      expect(responses).toHaveLength(2);
      expect(responses[0]).toEqual({ jsonrpc: '2.0', result: 'first', id: 1 });
      expect(responses[1]).toEqual({ jsonrpc: '2.0', result: 'second', id: 2 });
    });

    it('should handle mixed success and failure in batch', async () => {
      server.register('success', async () => 'ok');

      const requests: RpcRequest[] = [
        { jsonrpc: '2.0', method: 'success', id: 1 },
        { jsonrpc: '2.0', method: 'nonexistent', id: 2 }
      ];

      const responses = await server.handleBatch(requests);

      expect(responses).toHaveLength(2);
      expect(responses[0].result).toBe('ok');
      expect(responses[1].error).toBeDefined();
    });
  });

  describe('parseRequest', () => {
    it('should return invalid request error for invalid JSON', () => {
      const response = RpcServer.parseRequest('not json');

      expect(response).toEqual({
        jsonrpc: '2.0',
        error: { code: -32700, message: 'Parse error' },
        id: null
      });
    });

    it('should return invalid request error for missing jsonrpc', () => {
      const response = RpcServer.parseRequest(JSON.stringify({ method: 'test', id: 1 }));

      expect(response).toEqual({
        jsonrpc: '2.0',
        error: { code: -32600, message: 'Invalid Request' },
        id: null
      });
    });

    it('should return invalid request error for missing method', () => {
      const response = RpcServer.parseRequest(JSON.stringify({ jsonrpc: '2.0', id: 1 }));

      expect(response).toEqual({
        jsonrpc: '2.0',
        error: { code: -32600, message: 'Invalid Request' },
        id: 1
      });
    });

    it('should return valid request for correct format', () => {
      const result = RpcServer.parseRequest(JSON.stringify({
        jsonrpc: '2.0',
        method: 'test',
        id: 1
      }));

      expect('request' in result).toBe(true);
      if ('request' in result) {
        expect(result.request.method).toBe('test');
      }
    });
  });
});
