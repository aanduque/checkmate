/**
 * HttpRpcServer - HTTP wrapper for JSON-RPC server
 *
 * Provides HTTP transport for the RpcServer with CORS support.
 * Uses Hono for runtime-agnostic HTTP handling.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { RpcServer, type RpcResponse } from './RpcServer';

interface ServerHandle {
  stop: () => void;
}

export class HttpRpcServer {
  private app: Hono;
  private server: ServerHandle | null = null;

  constructor(private readonly rpcServer: RpcServer) {
    this.app = new Hono();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // CORS middleware
    this.app.use('*', cors({
      origin: '*',
      allowMethods: ['POST', 'OPTIONS'],
      allowHeaders: ['Content-Type']
    }));

    // JSON-RPC endpoint
    this.app.post('/', async (c) => {
      const body = await c.req.text();
      const parsed = RpcServer.parseRequest(body);

      let responseData: RpcResponse | RpcResponse[];

      if ('error' in parsed) {
        responseData = parsed;
      } else if ('batch' in parsed) {
        responseData = await this.rpcServer.handleBatch(parsed.batch);
      } else {
        responseData = await this.rpcServer.handle(parsed.request);
      }

      return c.json(responseData);
    });

    // Reject non-POST requests to root
    this.app.all('/', (c) => {
      return c.text('Method not allowed', 405);
    });
  }

  /**
   * Get the Hono app instance (for testing)
   */
  getApp(): Hono {
    return this.app;
  }

  /**
   * Start the HTTP server
   */
  start(port: number): void {
    // Use Bun.serve if available, otherwise fall back to node adapter
    if (typeof Bun !== 'undefined') {
      const server = Bun.serve({
        port,
        fetch: this.app.fetch
      });
      this.server = {
        stop: () => server.stop()
      };
    } else {
      // For Node.js environments, use the serve helper
      const { serve } = require('@hono/node-server');
      const server = serve({
        fetch: this.app.fetch,
        port
      });
      this.server = {
        stop: () => server.close()
      };
    }
  }

  /**
   * Stop the HTTP server
   */
  stop(): void {
    if (this.server) {
      this.server.stop();
      this.server = null;
    }
  }

  /**
   * Check if server is running
   */
  isRunning(): boolean {
    return this.server !== null;
  }
}
