/**
 * HttpRpcServer - HTTP wrapper for JSON-RPC server
 *
 * Provides HTTP transport for the RpcServer with CORS support.
 */

import { serve, type Server } from 'bun';
import { RpcServer, type RpcRequest, type RpcResponse } from './RpcServer';

export class HttpRpcServer {
  private server: Server | null = null;

  constructor(private readonly rpcServer: RpcServer) {}

  /**
   * Start the HTTP server
   */
  start(port: number): void {
    this.server = serve({
      port,
      fetch: async (req) => this.handleRequest(req)
    });
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

  private async handleRequest(req: Request): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // Only allow POST
    if (req.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders
      });
    }

    // Parse request body
    const body = await req.text();
    const parsed = RpcServer.parseRequest(body);

    let responseData: RpcResponse | RpcResponse[];

    if ('error' in parsed) {
      // Parse error
      responseData = parsed;
    } else if ('batch' in parsed) {
      // Batch request
      responseData = await this.rpcServer.handleBatch(parsed.batch);
    } else {
      // Single request
      responseData = await this.rpcServer.handle(parsed.request);
    }

    return new Response(JSON.stringify(responseData), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}
