/**
 * sessionMethods - Register session-related RPC methods
 */

import { RpcServer } from '../rpc/RpcServer';
import {
  StartSessionHandler,
  EndSessionHandler,
  AbandonSessionHandler,
  AddManualSessionHandler
} from '@checkmate/application';

export interface SessionMethodHandlers {
  startSessionHandler: StartSessionHandler;
  endSessionHandler: EndSessionHandler;
  abandonSessionHandler: AbandonSessionHandler;
  addManualSessionHandler: AddManualSessionHandler;
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

interface AbandonSessionParams {
  taskId: string;
  sessionId: string;
}

interface AddManualSessionParams {
  taskId: string;
  startedAt: string;
  endedAt: string;
  focusLevel: 'distracted' | 'neutral' | 'focused';
  note?: string;
}

export function registerSessionMethods(
  server: RpcServer,
  handlers: SessionMethodHandlers
): void {
  const {
    startSessionHandler,
    endSessionHandler,
    abandonSessionHandler,
    addManualSessionHandler
  } = handlers;

  // session.start - Start a new session
  server.register('session.start', async (params) => {
    const { taskId, durationMinutes } = params as StartSessionParams;
    return startSessionHandler.execute({ taskId, durationMinutes });
  });

  // session.end - End an active session
  server.register('session.end', async (params) => {
    const { taskId, sessionId, focusLevel } = params as EndSessionParams;
    return endSessionHandler.execute({ taskId, sessionId, focusLevel });
  });

  // session.abandon - Abandon an active session
  server.register('session.abandon', async (params) => {
    const { taskId, sessionId } = params as AbandonSessionParams;
    return abandonSessionHandler.execute({ taskId, sessionId });
  });

  // session.addManual - Add a backdated manual session
  server.register('session.addManual', async (params) => {
    const { taskId, startedAt, endedAt, focusLevel, note } = params as AddManualSessionParams;
    return addManualSessionHandler.execute({
      taskId,
      startedAt,
      endedAt,
      focusLevel,
      note
    });
  });
}
