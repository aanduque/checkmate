/**
 * Stats RPC Methods
 */

import { RpcServer } from '../rpc/RpcServer';
import { GetStatsHandler } from '@checkmate/application';

export interface StatsMethodHandlers {
  getStatsHandler: GetStatsHandler;
}

interface GetStatsParams {
  date?: string;
}

export function registerStatsMethods(
  server: RpcServer,
  handlers: StatsMethodHandlers
): void {
  const { getStatsHandler } = handlers;

  // stats.getDaily - Get daily statistics
  server.register('stats.getDaily', async (params) => {
    const { date } = (params || {}) as GetStatsParams;
    return getStatsHandler.execute({
      type: 'daily',
      date: date ? new Date(date) : undefined
    });
  });

  // stats.getWeekly - Get weekly statistics
  server.register('stats.getWeekly', async (params) => {
    const { date } = (params || {}) as GetStatsParams;
    return getStatsHandler.execute({
      type: 'weekly',
      date: date ? new Date(date) : undefined
    });
  });
}
