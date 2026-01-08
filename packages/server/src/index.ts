import { serve } from 'bun';
import { join } from 'path';
import { RpcServer } from './rpc/RpcServer';
import { RpcRequest, RpcErrorCodes } from './rpc/types';
import { handleError } from './middleware/errorHandler';
import { createTaskMethods } from './rpc/methods/taskMethods';
import { createTagMethods } from './rpc/methods/tagMethods';
import { createSprintMethods } from './rpc/methods/sprintMethods';
import { createRoutineMethods } from './rpc/methods/routineMethods';
import { createStatsMethods } from './rpc/methods/statsMethods';
import {
  InMemoryTaskRepository,
  InMemoryTagRepository,
  InMemorySprintRepository,
  InMemoryRoutineRepository,
  FilterExpressionEvaluator,
  JsonExporter,
  JsonImporter,
  FilePersistence,
} from '@checkmate/infrastructure';
import { Tag, Sprint, Routine, SprintService } from '@checkmate/domain';

// Initialize repositories
const taskRepository = new InMemoryTaskRepository();
const tagRepository = new InMemoryTagRepository();
const sprintRepository = new InMemorySprintRepository();
const routineRepository = new InMemoryRoutineRepository();

// Initialize file persistence
const DATA_FILE = process.env.DATA_FILE || join(process.cwd(), 'data', 'checkmate.json');
const persistence = new FilePersistence(DATA_FILE);

// Initialize services
const filterEvaluator = new FilterExpressionEvaluator();
const sprintService = new SprintService();

// Auto-save function (debounced)
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
function scheduleSave() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(async () => {
    const exporter = new JsonExporter(
      taskRepository,
      tagRepository,
      sprintRepository,
      routineRepository
    );
    const data = await exporter.export();
    persistence.save(data);
    console.log('Data auto-saved');
  }, 1000); // Save after 1 second of inactivity
}

// Load persisted data on startup
async function loadPersistedData(): Promise<boolean> {
  const data = persistence.load();
  if (data) {
    const importer = new JsonImporter(
      taskRepository,
      tagRepository,
      sprintRepository,
      routineRepository
    );
    const result = await importer.import(data);
    if (result.success) {
      console.log(`Loaded persisted data: ${result.tasksImported} tasks, ${result.tagsImported} tags, ${result.sprintsImported} sprints, ${result.routinesImported} routines`);
      return true;
    }
  }
  return false;
}

// Initialize default data
async function initializeDefaults() {
  // Create default tags
  const existingTags = await tagRepository.findAll();
  if (existingTags.length === 0) {
    const untagged = Tag.createUntagged();
    await tagRepository.save(untagged);

    const defaultTags = [
      { name: 'Work', icon: '💼', color: '#3b82f6', defaultCapacity: 25 },
      { name: 'Personal', icon: '🏠', color: '#22c55e', defaultCapacity: 15 },
      { name: 'Health', icon: '❤️', color: '#ef4444', defaultCapacity: 10 },
      { name: 'Learning', icon: '📚', color: '#8b5cf6', defaultCapacity: 10 },
    ];

    for (const tagData of defaultTags) {
      const tag = Tag.create(tagData);
      await tagRepository.save(tag);
    }
  }

  // Create default routines
  const existingRoutines = await routineRepository.findAll();
  if (existingRoutines.length === 0) {
    const defaultRoutines = [
      {
        name: 'Work Hours',
        icon: '💼',
        color: '#3b82f6',
        priority: 8,
        taskFilterExpression: 'hasTag("Work")',
        activationExpression: 'isWeekday and hour >= 9 and hour < 18',
      },
      {
        name: 'Evening',
        icon: '🌙',
        color: '#8b5cf6',
        priority: 5,
        taskFilterExpression: 'hasAnyTag("Personal", "Health")',
        activationExpression: 'hour >= 18 or hour < 9',
      },
      {
        name: 'Weekend',
        icon: '☀️',
        color: '#f59e0b',
        priority: 7,
        taskFilterExpression: 'hasAnyTag("Personal", "Health", "Learning")',
        activationExpression: 'isWeekend',
      },
    ];

    for (const routineData of defaultRoutines) {
      const routine = Routine.create(routineData);
      await routineRepository.save(routine);
    }
  }

  // Ensure sprints exist
  const existingSprints = await sprintRepository.findAll();
  const newSprints = sprintService.ensureSprintsExist(existingSprints);
  for (const sprint of newSprints) {
    await sprintRepository.save(sprint);
  }
}

// Create RPC server
const rpcServer = new RpcServer();

// Register all methods
rpcServer.registerAll(createTaskMethods(taskRepository, sprintRepository));
rpcServer.registerAll(createTagMethods(tagRepository));
rpcServer.registerAll(createSprintMethods(sprintRepository, taskRepository, tagRepository));
rpcServer.registerAll(createRoutineMethods(routineRepository, filterEvaluator));
rpcServer.registerAll(createStatsMethods(taskRepository, tagRepository, sprintRepository));

// Additional utility methods
rpcServer.register('system.listMethods', async () => {
  return { methods: rpcServer.getMethods() };
});

rpcServer.register('data.export', async () => {
  const exporter = new JsonExporter(
    taskRepository,
    tagRepository,
    sprintRepository,
    routineRepository
  );
  return exporter.export();
});

rpcServer.register('data.import', async (params: any) => {
  const importer = new JsonImporter(
    taskRepository,
    tagRepository,
    sprintRepository,
    routineRepository
  );
  return importer.import(params.data, params.merge);
});

rpcServer.register('data.reset', async () => {
  taskRepository.loadData([]);
  tagRepository.loadData([]);
  sprintRepository.loadData([]);
  routineRepository.loadData([]);
  await initializeDefaults();
  return { success: true };
});

// Start server
const PORT = parseInt(process.env.PORT || '3000');

// Try to load persisted data, otherwise initialize defaults
const hasPersistedData = await loadPersistedData();
if (!hasPersistedData) {
  await initializeDefaults();
  scheduleSave(); // Save initial data
} else {
  // Ensure sprints exist even with persisted data
  const existingSprints = await sprintRepository.findAll();
  const newSprints = sprintService.ensureSprintsExist(existingSprints);
  if (newSprints.length > 0) {
    for (const sprint of newSprints) {
      await sprintRepository.save(sprint);
    }
    scheduleSave();
  }
}

// Methods that trigger auto-save
const MUTATION_METHODS = new Set([
  'task.create', 'task.complete', 'task.cancel', 'task.update',
  'task.moveToSprint', 'task.moveToBacklog', 'task.skipForNow',
  'task.skipForDay', 'task.clearSkipState', 'task.startSession',
  'task.completeSession', 'task.abandonSession', 'task.addManualSession',
  'task.addComment', 'task.deleteComment', 'task.spawnInstance',
  'tag.create', 'tag.update', 'tag.delete',
  'sprint.setCapacityOverride', 'sprint.clearCapacityOverride',
  'routine.create', 'routine.update', 'routine.delete',
  'data.import', 'data.reset',
]);

serve({
  port: PORT,
  fetch: async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Only accept POST to /rpc
    const url = new URL(req.url);
    if (url.pathname !== '/rpc' || req.method !== 'POST') {
      return new Response('Not Found', { status: 404 });
    }

    try {
      const body = await req.json();

      // Handle batch requests
      if (Array.isArray(body)) {
        const responses = await rpcServer.handleBatch(body as RpcRequest[]);
        // Check if any mutation methods were called
        const hasMutation = body.some((req: RpcRequest) => MUTATION_METHODS.has(req.method));
        if (hasMutation) {
          scheduleSave();
        }
        return new Response(JSON.stringify(responses), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Validate request
      if (!body.jsonrpc || body.jsonrpc !== '2.0' || !body.method) {
        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            error: {
              code: RpcErrorCodes.INVALID_REQUEST,
              message: 'Invalid Request',
            },
            id: body.id ?? null,
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      const response = await rpcServer.handle(body as RpcRequest);
      // Trigger auto-save for mutation methods
      if (MUTATION_METHODS.has(body.method) && !response.error) {
        scheduleSave();
      }
      return new Response(JSON.stringify(response), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      const response = handleError(error, null);
      return new Response(JSON.stringify(response), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
});

console.log(`🚀 Check Mate JSON-RPC server running on port ${PORT}`);
console.log(`Available methods: ${rpcServer.getMethods().length}`);
