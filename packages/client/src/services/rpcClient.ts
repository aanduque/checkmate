/**
 * JSON-RPC 2.0 Client
 */

interface RpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: unknown;
  id: number;
}

interface RpcResponse<T> {
  jsonrpc: '2.0';
  result?: T;
  error?: { code: number; message: string };
  id: number;
}

class RpcClient {
  private id = 0;
  private baseUrl: string;

  constructor(baseUrl: string = '/rpc') {
    this.baseUrl = baseUrl;
  }

  async call<T>(method: string, params?: unknown): Promise<T> {
    const request: RpcRequest = {
      jsonrpc: '2.0',
      method,
      params,
      id: ++this.id
    };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    const data: RpcResponse<T> = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.result!;
  }
}

// Singleton client instance
export const rpc = new RpcClient();

// Task methods
export const taskApi = {
  create: (params: {
    title: string;
    description?: string;
    tagPoints: Record<string, number>;
    sprintId?: string;
  }) => rpc.call('task.create', params),

  complete: (id: string) => rpc.call('task.complete', { id }),

  cancel: (id: string, justification: string) =>
    rpc.call('task.cancel', { id, justification }),

  skip: (id: string, type: 'for_now' | 'for_day', justification?: string) =>
    rpc.call('task.skip', { id, type, justification }),

  getKanban: (sprintId?: string) =>
    rpc.call<{
      backlog: TaskDTO[];
      sprint: TaskDTO[];
      completed: TaskDTO[];
    }>('task.getKanban', { sprintId }),

  getFocus: (sprintId: string) =>
    rpc.call<{
      focusTask: FocusTaskDTO | null;
      upNext: FocusTaskDTO[];
      hiddenCount: number;
    }>('task.getFocus', { sprintId })
};

// Session methods
export const sessionApi = {
  start: (taskId: string, durationMinutes?: number) =>
    rpc.call<{ sessionId: string; taskId: string }>('session.start', {
      taskId,
      durationMinutes
    }),

  end: (taskId: string, sessionId: string, focusLevel: 'distracted' | 'neutral' | 'focused') =>
    rpc.call('session.end', { taskId, sessionId, focusLevel })
};

// Tag methods
export const tagApi = {
  create: (params: {
    name: string;
    icon?: string;
    color?: string;
    defaultCapacity?: number;
  }) => rpc.call<TagDTO>('tag.create', params),

  getAll: () => rpc.call<{ tags: TagDTO[] }>('tag.getAll', {})
};

// DTOs
export interface TagDTO {
  id: string;
  name: string;
  icon: string;
  color: string;
  defaultCapacity: number;
}
export interface TaskDTO {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'canceled';
  tagPoints: Record<string, number>;
  totalPoints: number;
  tags: Array<{ id: string; name: string; color: string }>;
}

export interface FocusTaskDTO {
  id: string;
  title: string;
  tagPoints: Record<string, number>;
  totalPoints: number;
  activeSession?: {
    id: string;
    startedAt: Date;
    durationMinutes: number;
  };
}
