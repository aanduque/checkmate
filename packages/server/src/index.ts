/**
 * Check Mate Server - JSON-RPC API
 *
 * Wires up all handlers and starts the HTTP server.
 */

import { RpcServer } from './rpc/RpcServer';
import { HttpRpcServer } from './rpc/HttpRpcServer';
import { registerTaskMethods } from './methods/taskMethods';
import { registerSessionMethods } from './methods/sessionMethods';
import { registerTagMethods } from './methods/tagMethods';
import { registerSprintMethods } from './methods/sprintMethods';

// Application handlers
import {
  CreateTaskHandler,
  CompleteTaskHandler,
  CancelTaskHandler,
  SkipTaskHandler,
  StartSessionHandler,
  EndSessionHandler,
  GetKanbanBoardHandler,
  GetFocusTaskHandler,
  CreateTagHandler,
  GetAllTagsHandler,
  CreateSprintHandler,
  GetCurrentSprintHandler,
  GetUpcomingSprintsHandler
} from '@checkmate/application';

// Infrastructure repositories
import {
  LocalStorageTaskRepository,
  LocalStorageTagRepository,
  LocalStorageSprintRepository
} from '@checkmate/infrastructure';

// Domain services
import { TaskOrderingService } from '@checkmate/domain';

// In-memory storage for server-side (simulating localStorage)
class MemoryStorage implements Storage {
  private data: Map<string, string> = new Map();

  get length(): number {
    return this.data.size;
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }
}

// Create storage
const storage = new MemoryStorage();

// Create repositories
const taskRepository = new LocalStorageTaskRepository(storage);
const tagRepository = new LocalStorageTagRepository(storage);
const sprintRepository = new LocalStorageSprintRepository(storage);

// Create domain services
const orderingService = new TaskOrderingService();

// Create handlers
const handlers = {
  createTaskHandler: new CreateTaskHandler(taskRepository),
  completeTaskHandler: new CompleteTaskHandler(taskRepository),
  cancelTaskHandler: new CancelTaskHandler(taskRepository),
  skipTaskHandler: new SkipTaskHandler(taskRepository),
  startSessionHandler: new StartSessionHandler(taskRepository),
  endSessionHandler: new EndSessionHandler(taskRepository),
  getKanbanBoardHandler: new GetKanbanBoardHandler(taskRepository, sprintRepository, tagRepository),
  getFocusTaskHandler: new GetFocusTaskHandler(taskRepository, orderingService),
  createTagHandler: new CreateTagHandler(tagRepository),
  getAllTagsHandler: new GetAllTagsHandler(tagRepository),
  createSprintHandler: new CreateSprintHandler(sprintRepository),
  getCurrentSprintHandler: new GetCurrentSprintHandler(sprintRepository),
  getUpcomingSprintsHandler: new GetUpcomingSprintsHandler(sprintRepository)
};

// Create RPC server
const rpcServer = new RpcServer();

// Register methods
registerTaskMethods(rpcServer, handlers);
registerSessionMethods(rpcServer, handlers);
registerTagMethods(rpcServer, handlers);
registerSprintMethods(rpcServer, handlers);

// Start HTTP server
const PORT = parseInt(process.env.PORT || '3001', 10);
const httpServer = new HttpRpcServer(rpcServer);
httpServer.start(PORT);

console.log(`Check Mate JSON-RPC server running on http://localhost:${PORT}`);

// Export for testing
export { rpcServer, httpServer };
