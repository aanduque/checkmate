/**
 * HttpRpcServer - Tests
 *
 * Uses Hono's built-in test helper for runtime-agnostic testing.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HttpRpcServer } from '../HttpRpcServer';
import { RpcServer } from '../RpcServer';

describe('HttpRpcServer', () => {
  let rpcServer: RpcServer;
  let httpServer: HttpRpcServer;

  beforeEach(() => {
    rpcServer = new RpcServer();
    httpServer = new HttpRpcServer(rpcServer);
  });

  describe('HTTP handling', () => {
    beforeEach(() => {
      rpcServer.register('test.echo', async (params) => params);
    });

    it('should handle POST requests', async () => {
      const app = httpServer.getApp();
      const response = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'test.echo',
          params: { message: 'hello' },
          id: 1
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toEqual({
        jsonrpc: '2.0',
        result: { message: 'hello' },
        id: 1
      });
    });

    it('should reject non-POST requests', async () => {
      const app = httpServer.getApp();
      const response = await app.request('/', {
        method: 'GET'
      });

      expect(response.status).toBe(405);
    });

    it('should handle OPTIONS for CORS preflight', async () => {
      const app = httpServer.getApp();
      const response = await app.request('/', {
        method: 'OPTIONS'
      });

      expect(response.ok).toBe(true);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });

    it('should include CORS headers in response', async () => {
      const app = httpServer.getApp();
      const response = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'test.echo',
          params: 'test',
          id: 1
        })
      });

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('should return parse error for invalid JSON', async () => {
      const app = httpServer.getApp();
      const response = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not valid json'
      });

      const data = await response.json();
      expect(data.error.code).toBe(-32700);
      expect(data.error.message).toBe('Parse error');
    });

    it('should handle batch requests', async () => {
      const app = httpServer.getApp();
      const response = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([
          { jsonrpc: '2.0', method: 'test.echo', params: 'first', id: 1 },
          { jsonrpc: '2.0', method: 'test.echo', params: 'second', id: 2 }
        ])
      });

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
    });

    it('should return method not found for unknown methods', async () => {
      const app = httpServer.getApp();
      const response = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'unknown.method',
          params: {},
          id: 1
        })
      });

      const data = await response.json();
      expect(data.error.code).toBe(-32601);
      expect(data.error.message).toBe('Method not found');
    });
  });
});
