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
import { registerStatsMethods } from './methods/statsMethods';
import { registerRoutineMethods } from './methods/routineMethods';
import { registerDevToolsMethods } from './methods/devtoolsMethods';

// Application handlers
import {
  // Task handlers
  CreateTaskHandler,
  CompleteTaskHandler,
  CancelTaskHandler,
  SkipTaskHandler,
  UpdateTaskHandler,
  MoveTaskToSprintHandler,
  MoveTaskToBacklogHandler,
  AddTaskCommentHandler,
  DeleteTaskCommentHandler,
  GetRecurringTemplatesHandler,
  // Session handlers
  StartSessionHandler,
  EndSessionHandler,
  AbandonSessionHandler,
  AddManualSessionHandler,
  // Query handlers
  GetKanbanBoardHandler,
  GetFocusTaskHandler,
  GetStatsHandler,
  // Tag handlers
  CreateTagHandler,
  GetAllTagsHandler,
  // Sprint handlers
  CreateSprintHandler,
  GetCurrentSprintHandler,
  GetUpcomingSprintsHandler,
  SetSprintCapacityOverrideHandler,
  GetSprintHealthHandler,
  // Routine handlers
  CreateRoutineHandler,
  UpdateRoutineHandler,
  DeleteRoutineHandler,
  GetAllRoutinesHandler,
  GetActiveRoutineHandler
} from '@checkmate/application';

// Infrastructure repositories & adapters
import {
  LocalStorageTaskRepository,
  LocalStorageTagRepository,
  LocalStorageSprintRepository,
  LocalStorageRoutineRepository,
  FiltrexExpressionEvaluator
} from '@checkmate/infrastructure';

// Domain services
import { TaskOrderingService, StatsCalculator } from '@checkmate/domain';

// File-based storage for persistence
import { FileStorage } from './storage/FileStorage';
import { join } from 'path';

// Create storage - persists to .data/storage.json in the server directory
const dataDir = process.env.DATA_DIR || join(process.cwd(), '.data');
const storage = new FileStorage(join(dataDir, 'storage.json'));

console.log(`Data storage: ${join(dataDir, 'storage.json')}`);

// Create repositories
const taskRepository = new LocalStorageTaskRepository(storage);
const tagRepository = new LocalStorageTagRepository(storage);
const sprintRepository = new LocalStorageSprintRepository(storage);
const routineRepository = new LocalStorageRoutineRepository(storage);

// Create infrastructure adapters
const expressionEvaluator = new FiltrexExpressionEvaluator();

// Create domain services
const orderingService = new TaskOrderingService();
const statsCalculator = new StatsCalculator();

// Create handlers
const handlers = {
  // Task handlers
  createTaskHandler: new CreateTaskHandler(taskRepository),
  completeTaskHandler: new CompleteTaskHandler(taskRepository),
  cancelTaskHandler: new CancelTaskHandler(taskRepository),
  skipTaskHandler: new SkipTaskHandler(taskRepository),
  updateTaskHandler: new UpdateTaskHandler(taskRepository),
  moveTaskToSprintHandler: new MoveTaskToSprintHandler(taskRepository, sprintRepository),
  moveTaskToBacklogHandler: new MoveTaskToBacklogHandler(taskRepository),
  addTaskCommentHandler: new AddTaskCommentHandler(taskRepository),
  deleteTaskCommentHandler: new DeleteTaskCommentHandler(taskRepository),
  getRecurringTemplatesHandler: new GetRecurringTemplatesHandler(taskRepository),

  // Session handlers
  startSessionHandler: new StartSessionHandler(taskRepository),
  endSessionHandler: new EndSessionHandler(taskRepository),
  abandonSessionHandler: new AbandonSessionHandler(taskRepository),
  addManualSessionHandler: new AddManualSessionHandler(taskRepository),

  // Query handlers
  getKanbanBoardHandler: new GetKanbanBoardHandler(taskRepository, sprintRepository, tagRepository),
  getFocusTaskHandler: new GetFocusTaskHandler(taskRepository, orderingService),
  getStatsHandler: new GetStatsHandler(taskRepository, statsCalculator),

  // Tag handlers
  createTagHandler: new CreateTagHandler(tagRepository),
  getAllTagsHandler: new GetAllTagsHandler(tagRepository),

  // Sprint handlers
  createSprintHandler: new CreateSprintHandler(sprintRepository),
  getCurrentSprintHandler: new GetCurrentSprintHandler(sprintRepository),
  getUpcomingSprintsHandler: new GetUpcomingSprintsHandler(sprintRepository),
  setSprintCapacityOverrideHandler: new SetSprintCapacityOverrideHandler(sprintRepository),
  getSprintHealthHandler: new GetSprintHealthHandler(sprintRepository, taskRepository, tagRepository),

  // Routine handlers
  createRoutineHandler: new CreateRoutineHandler(routineRepository),
  updateRoutineHandler: new UpdateRoutineHandler(routineRepository),
  deleteRoutineHandler: new DeleteRoutineHandler(routineRepository),
  getAllRoutinesHandler: new GetAllRoutinesHandler(routineRepository),
  getActiveRoutineHandler: new GetActiveRoutineHandler(routineRepository, expressionEvaluator)
};

// Create RPC server
const rpcServer = new RpcServer();

// Register methods
registerTaskMethods(rpcServer, handlers);
registerSessionMethods(rpcServer, handlers);
registerTagMethods(rpcServer, handlers);
registerSprintMethods(rpcServer, handlers);
registerStatsMethods(rpcServer, handlers);
registerRoutineMethods(rpcServer, handlers);
registerDevToolsMethods(rpcServer, {
  taskRepository,
  tagRepository,
  sprintRepository,
  routineRepository,
  storage
});

// Start HTTP server
const PORT = parseInt(process.env.PORT || '3001', 10);
const httpServer = new HttpRpcServer(rpcServer);
httpServer.start(PORT);

console.log(`Check Mate JSON-RPC server running on http://localhost:${PORT}`);

// Export for testing
export { rpcServer, httpServer };
