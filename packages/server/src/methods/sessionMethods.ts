/**
 * sessionMethods - Register session-related RPC methods
 */

import { RpcServer } from '../rpc/RpcServer';
import {
  StartSessionHandler,
  EndSessionHandler
} from '@checkmate/application';

interface SessionMethodHandlers {
  startSessionHandler: StartSessionHandler;
  endSessionHandler: EndSessionHandler;
}

interface StartSessionParams {
  taskId: string;
  durationMinutes?: number;
}

interface EndSessionParams {
  taskId: string;
  sessionId: string;
  focusLevel: 'distracted' | 'neutral' | 'focused';
}

export function registerSessionMethods(
  server: RpcServer,
  handlers: SessionMethodHandlers
): void {
  const { startSessionHandler, endSessionHandler } = handlers;

  server.register('session.start', async (params) => {
    const { taskId, durationMinutes } = params as StartSessionParams;
    return startSessionHandler.execute({ taskId, durationMinutes });
  });

  server.register('session.end', async (params) => {
    const { taskId, sessionId, focusLevel } = params as EndSessionParams;
    return endSessionHandler.execute({ taskId, sessionId, focusLevel });
  });
}
