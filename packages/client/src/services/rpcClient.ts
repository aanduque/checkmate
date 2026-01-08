interface RpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: unknown;
  id: string | number;
}

interface RpcResponse<T = unknown> {
  jsonrpc: '2.0';
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  id: string | number | null;
}

let requestId = 0;

const RPC_URL = '/rpc';

/**
 * JSON-RPC client for communicating with the server
 */
export async function rpcCall<T = unknown>(
  method: string,
  params?: unknown
): Promise<T> {
  const request: RpcRequest = {
    jsonrpc: '2.0',
    method,
    params,
    id: ++requestId,
  };

  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const data: RpcResponse<T> = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.result as T;
}

/**
 * Batch multiple RPC calls
 */
export async function rpcBatch<T extends unknown[]>(
  calls: Array<{ method: string; params?: unknown }>
): Promise<T> {
  const requests: RpcRequest[] = calls.map((call) => ({
    jsonrpc: '2.0',
    method: call.method,
    params: call.params,
    id: ++requestId,
  }));

  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requests),
  });

  const data: RpcResponse[] = await response.json();

  return data.map((d) => {
    if (d.error) {
      throw new Error(d.error.message);
    }
    return d.result;
  }) as T;
}

// Typed API methods
export const api = {
  // Tasks
  tasks: {
    create: (params: {
      title: string;
      description?: string;
      tagPoints: Record<string, number>;
      sprintId?: string;
      recurrence?: string;
    }) => rpcCall<{ task: any }>('task.create', params),

    update: (taskId: string, params: { title?: string; tagPoints?: Record<string, number> }) =>
      rpcCall<{ task: any }>('task.update', { taskId, ...params }),

    addComment: (taskId: string, text: string) =>
      rpcCall<{ task: any }>('task.addComment', { taskId, text }),

    complete: (taskId: string) =>
      rpcCall<{ task: any }>('task.complete', { taskId }),

    cancel: (taskId: string) =>
      rpcCall<{ task: any }>('task.cancel', { taskId }),

    moveToSprint: (taskId: string, sprintId: string) =>
      rpcCall<{ task: any }>('task.moveToSprint', { taskId, sprintId }),

    moveToBacklog: (taskId: string) =>
      rpcCall<{ task: any }>('task.moveToBacklog', { taskId }),

    skipForNow: (taskId: string) =>
      rpcCall<{ task: any }>('task.skipForNow', { taskId }),

    skipForDay: (taskId: string, justification: string) =>
      rpcCall<{ task: any }>('task.skipForDay', { taskId, justification }),

    clearSkipState: (taskId: string) =>
      rpcCall<{ task: any }>('task.clearSkipState', { taskId }),

    startSession: (taskId: string) =>
      rpcCall<{ task: any; sessionId: string }>('task.startSession', { taskId }),

    completeSession: (taskId: string, sessionId: string, focusLevel: string, note?: string) =>
      rpcCall<{ task: any }>('task.completeSession', {
        taskId,
        sessionId,
        focusLevel,
        note,
      }),

    abandonSession: (taskId: string, sessionId: string) =>
      rpcCall<{ task: any }>('task.abandonSession', { taskId, sessionId }),

    spawnInstance: (templateId: string) =>
      rpcCall<{ task: any }>('task.spawnInstance', { templateId }),

    get: (taskId: string) => rpcCall<{ task: any }>('task.get', { taskId }),

    getAll: (params?: { sprintId?: string; tagIds?: string[] }) =>
      rpcCall<{ tasks: any[] }>('task.getAll', params),

    getBacklog: () => rpcCall<{ tasks: any[] }>('task.getBacklog'),

    getTemplates: () => rpcCall<{ tasks: any[] }>('task.getTemplates'),

    getCompleted: () => rpcCall<{ tasks: any[] }>('task.getCompleted'),
  },

  // Tags
  tags: {
    create: (params: {
      name: string;
      icon: string;
      color: string;
      defaultCapacity: number;
    }) => rpcCall<{ tag: any }>('tag.create', params),

    update: (params: {
      tagId: string;
      name?: string;
      icon?: string;
      color?: string;
      defaultCapacity?: number;
    }) => rpcCall<{ tag: any }>('tag.update', params),

    delete: (tagId: string) => rpcCall<void>('tag.delete', { tagId }),

    getAll: () => rpcCall<{ tags: any[] }>('tag.getAll'),
  },

  // Sprints
  sprints: {
    setCapacityOverride: (sprintId: string, tagId: string, capacity: number) =>
      rpcCall<{ sprint: any }>('sprint.setCapacityOverride', {
        sprintId,
        tagId,
        capacity,
      }),

    clearCapacityOverride: (sprintId: string, tagId: string) =>
      rpcCall<{ sprint: any }>('sprint.clearCapacityOverride', {
        sprintId,
        tagId,
      }),

    getAll: () => rpcCall<{ sprints: any[] }>('sprint.getAll'),

    getCurrent: () => rpcCall<{ sprint: any } | null>('sprint.getCurrent'),

    getHealth: (sprintId: string) =>
      rpcCall<{ sprint: any; health: any; label: string; icon: string }>(
        'sprint.getHealth',
        { sprintId }
      ),
  },

  // Routines
  routines: {
    create: (params: {
      name: string;
      icon: string;
      color: string;
      priority?: number;
      taskFilterExpression: string;
      activationExpression: string;
    }) => rpcCall<{ routine: any }>('routine.create', params),

    update: (params: {
      routineId: string;
      name?: string;
      icon?: string;
      color?: string;
      priority?: number;
      taskFilterExpression?: string;
      activationExpression?: string;
    }) => rpcCall<{ routine: any }>('routine.update', params),

    delete: (routineId: string) =>
      rpcCall<void>('routine.delete', { routineId }),

    getAll: () => rpcCall<{ routines: any[] }>('routine.getAll'),

    getActive: (manualRoutineId?: string) =>
      rpcCall<{ routine: any } | null>('routine.getActive', { manualRoutineId }),
  },

  // Stats
  stats: {
    get: (params?: { sprintId?: string; period?: 'week' | 'month' | 'all' }) =>
      rpcCall<{
        stats: {
          totalCompleted: number;
          totalCancelled: number;
          totalPoints: number;
          tagBreakdown: any[];
          weeklyActivity: any[];
          focusQuality: any;
        };
      }>('stats.get', params),
  },

  // Data
  data: {
    export: () => rpcCall<any>('data.export'),
    import: (data: any, merge?: boolean) =>
      rpcCall<{ success: boolean }>('data.import', { data, merge }),
    reset: () => rpcCall<{ success: boolean }>('data.reset'),
  },
};
