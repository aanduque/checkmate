/**
 * @checkmate/shared - Shared types and API schema for Check Mate
 *
 * This package provides:
 * - TypeScript types generated from the OpenRPC schema
 * - OpenRPC schema in JSON format (importable via /openrpc.json)
 */

// Export all generated types
export * from './types';

// Re-export the OpenRPC schema for runtime access
// Usage: import schema from '@checkmate/shared/openrpc.json'
