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

  update: (id: string, updates: { title?: string; description?: string; tagPoints?: Record<string, number> }) =>
    rpc.call('task.update', { id, ...updates }),

  move: (id: string, sprintId?: string) =>
    rpc.call('task.move', { id, sprintId }),

  addComment: (taskId: string, content: string) =>
    rpc.call('task.addComment', { taskId, content }),

  deleteComment: (taskId: string, commentId: string) =>
    rpc.call('task.deleteComment', { taskId, commentId }),

  getKanban: (sprintId?: string) =>
    rpc.call<{
      backlog: TaskDTO[];
      sprint: TaskDTO[];
      completed: TaskDTO[];
    }>('task.getKanban', { sprintId }),

  getFocus: (sprintId?: string) =>
    rpc.call<{
      focusTask: FocusTaskDTO | null;
      upNext: FocusTaskDTO[];
      hiddenCount: number;
    }>('task.getFocus', { sprintId }),

  getRecurringTemplates: () =>
    rpc.call<{ templates: TaskDTO[] }>('task.getRecurringTemplates', {})
};

// Session methods
export const sessionApi = {
  start: (taskId: string, durationMinutes?: number) =>
    rpc.call<{ sessionId: string; taskId: string }>('session.start', {
      taskId,
      durationMinutes
    }),

  end: (taskId: string, sessionId: string, focusLevel: 'distracted' | 'neutral' | 'focused') =>
    rpc.call('session.end', { taskId, sessionId, focusLevel }),

  abandon: (taskId: string, sessionId: string) =>
    rpc.call('session.abandon', { taskId, sessionId }),

  addManual: (params: {
    taskId: string;
    startedAt: string;
    endedAt: string;
    focusLevel: 'distracted' | 'neutral' | 'focused';
    note?: string;
  }) => rpc.call('session.addManual', params)
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

// Sprint methods
export const sprintApi = {
  create: (startDate: string) =>
    rpc.call<SprintDTO>('sprint.create', { startDate }),

  getCurrent: () =>
    rpc.call<SprintDTO | null>('sprint.getCurrent', {}),

  getUpcoming: (limit?: number) =>
    rpc.call<SprintDTO[]>('sprint.getUpcoming', { limit }),

  setCapacity: (sprintId: string, tagId: string, capacity: number) =>
    rpc.call('sprint.setCapacity', { sprintId, tagId, capacity }),

  getHealth: (sprintId: string) =>
    rpc.call<SprintHealthDTO>('sprint.getHealth', { sprintId })
};

// Stats methods
export const statsApi = {
  getDaily: (date?: string) =>
    rpc.call<DailyStatsDTO>('stats.getDaily', { date }),

  getWeekly: (date?: string) =>
    rpc.call<WeeklyStatsDTO>('stats.getWeekly', { date })
};

// Routine methods
export const routineApi = {
  create: (params: {
    name: string;
    icon: string;
    color: string;
    priority: number;
    taskFilterExpression: string;
    activationExpression: string;
  }) => rpc.call<RoutineDTO>('routine.create', params),

  update: (id: string, updates: {
    name?: string;
    icon?: string;
    color?: string;
    priority?: number;
    taskFilterExpression?: string;
    activationExpression?: string;
  }) => rpc.call<RoutineDTO>('routine.update', { id, ...updates }),

  delete: (id: string) =>
    rpc.call('routine.delete', { id }),

  getAll: () =>
    rpc.call<{ routines: RoutineDTO[] }>('routine.getAll', {}),

  getActive: () =>
    rpc.call<{ routine: RoutineDTO | null }>('routine.getActive', {})
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

export interface SprintDTO {
  id: string;
  startDate: string;
  endDate: string;
}

export interface DailyStatsDTO {
  tasksCompleted: number;
  pointsCompleted: number;
  focusTimeSeconds: number;
  sessionsCount: number;
  currentStreak: number;
  focusQuality?: {
    distractedCount: number;
    neutralCount: number;
    focusedCount: number;
    averageScore: number;
  };
}

export interface WeeklyStatsDTO {
  tasksCompleted: number;
  pointsCompleted: number;
  focusTimeSeconds: number;
  sessionsCount: number;
  currentStreak: number;
  dailyActivity?: Array<{
    date: string;
    tasksCompleted: number;
    pointsCompleted: number;
    focusTimeSeconds: number;
    sessionsCount: number;
  }>;
  pointsByTag?: Record<string, number>;
}

export interface RoutineDTO {
  id: string;
  name: string;
  icon: string;
  color: string;
  priority: number;
  taskFilterExpression: string;
  activationExpression: string;
}

export interface SprintHealthDTO {
  overallStatus: 'on_track' | 'at_risk' | 'off_track';
  totalPoints: number;
  totalCapacity: number;
  percentUsed: number;
  daysRemaining: number;
  tagHealth: Array<{
    tagId: string;
    tagName: string;
    points: number;
    capacity: number;
    percentUsed: number;
    status: 'on_track' | 'at_risk' | 'off_track';
  }>;
}
