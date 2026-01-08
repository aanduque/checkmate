/**
 * Dev Tools RPC Methods
 *
 * Provides methods for loading demo data, resetting data, and backup/restore.
 */

import type { RpcServer } from '../rpc/RpcServer';
import type { ITaskRepository, ITagRepository, ISprintRepository, IRoutineRepository } from '@checkmate/domain';
import { Task, Tag, Sprint, Routine, TaskLocation, TagPoints, TagId } from '@checkmate/domain';

export interface DevToolsMethodHandlers {
  taskRepository: ITaskRepository;
  tagRepository: ITagRepository;
  sprintRepository: ISprintRepository;
  routineRepository: IRoutineRepository;
  storage: Storage;
}

// Generate unique IDs
const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Get current week's sprint dates
const getSprintDates = (weeksFromNow: number) => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek + (weeksFromNow * 7));
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return {
    startDate: startOfWeek,
    endDate: endOfWeek
  };
};

export function registerDevToolsMethods(
  server: RpcServer,
  handlers: DevToolsMethodHandlers
): void {
  const { taskRepository, tagRepository, sprintRepository, routineRepository, storage } = handlers;

  // Load demo data
  server.register('devtools.loadDemoData', async () => {
    // First clear existing data
    storage.clear();

    // Create tags
    const untaggedTag = Tag.create({ name: 'Untagged', icon: '📦', color: '#6b7280', defaultCapacity: 10 }, 'untagged');
    const workTag = Tag.create({ name: 'Work', icon: '💼', color: '#3b82f6', defaultCapacity: 25 });
    const personalTag = Tag.create({ name: 'Personal', icon: '🏠', color: '#22c55e', defaultCapacity: 15 });
    const healthTag = Tag.create({ name: 'Health', icon: '❤️', color: '#ef4444', defaultCapacity: 10 });
    const learningTag = Tag.create({ name: 'Learning', icon: '📚', color: '#8b5cf6', defaultCapacity: 10 });

    await Promise.all([
      tagRepository.save(untaggedTag),
      tagRepository.save(workTag),
      tagRepository.save(personalTag),
      tagRepository.save(healthTag),
      tagRepository.save(learningTag)
    ]);

    // Create routines
    const workRoutine = Routine.create({
      name: 'Work Hours',
      icon: '💼',
      color: '#3b82f6',
      priority: 8,
      taskFilterExpression: 'hasTag("Work")',
      activationExpression: 'isWeekday and hour >= 9 and hour < 18'
    });

    const eveningRoutine = Routine.create({
      name: 'Evening',
      icon: '🌙',
      color: '#8b5cf6',
      priority: 5,
      taskFilterExpression: 'hasAnyTag("Personal", "Health")',
      activationExpression: 'hour >= 18 or hour < 9'
    });

    const weekendRoutine = Routine.create({
      name: 'Weekend',
      icon: '☀️',
      color: '#f59e0b',
      priority: 7,
      taskFilterExpression: 'hasAnyTag("Personal", "Health", "Learning")',
      activationExpression: 'isWeekend'
    });

    await Promise.all([
      routineRepository.save(workRoutine),
      routineRepository.save(eveningRoutine),
      routineRepository.save(weekendRoutine)
    ]);

    // Create sprints
    const currentSprintDates = getSprintDates(0);
    const nextSprintDates = getSprintDates(1);
    const followingSprintDates = getSprintDates(2);

    const currentSprint = Sprint.create(currentSprintDates.startDate, currentSprintDates.endDate);
    const nextSprint = Sprint.create(nextSprintDates.startDate, nextSprintDates.endDate);
    const followingSprint = Sprint.create(followingSprintDates.startDate, followingSprintDates.endDate);

    await Promise.all([
      sprintRepository.save(currentSprint),
      sprintRepository.save(nextSprint),
      sprintRepository.save(followingSprint)
    ]);

    // Create tasks
    const createTagPoints = (tagId: string, points: number): TagPoints => {
      return TagPoints.create({ [tagId]: points });
    };

    // Tutorial tasks (current sprint)
    const tutorialTask1 = Task.create({
      title: 'Welcome to Check Mate! Tap here to see task details',
      description: `This is a tutorial task. Check Mate helps you manage tasks with an ADHD-friendly approach:

- Focus on ONE task at a time
- Organize by weekly sprints
- Filter tasks by routine (work/personal)
- Track time with focus sessions

Tap "Done" when you've read this!`,
      tagPoints: createTagPoints(personalTag.id, 1),
      location: TaskLocation.inSprint(currentSprint.id)
    });

    const tutorialTask2 = Task.create({
      title: 'Try starting a Focus session (tap the play button)',
      description: `Focus sessions help you track time spent on tasks.

1. Tap the play button on any task
2. Work on the task
3. When done, tap Complete to log your time

Sessions are saved and help you understand where your time goes.`,
      tagPoints: createTagPoints(personalTag.id, 1),
      location: TaskLocation.inSprint(currentSprint.id)
    });

    const tutorialTask3 = Task.create({
      title: 'Switch to Tasks view to see the Kanban board',
      description: `The Tasks view shows all your tasks organized in columns:

- **Backlog**: Tasks not yet scheduled
- **This Week**: Current sprint tasks
- **Next Week**: Upcoming sprint tasks

Drag tasks between columns to schedule them!`,
      tagPoints: createTagPoints(personalTag.id, 1),
      location: TaskLocation.inSprint(currentSprint.id)
    });

    const tutorialTask4 = Task.create({
      title: 'Open the menu (hamburger icon) to explore settings',
      description: `The menu contains:

- **Routine selector**: Switch between Work/Personal/etc.
- **Manage Tags**: Create custom categories
- **Manage Routines**: Set up time-based filters
- **Dev Tools**: Reset data or reload demo`,
      tagPoints: createTagPoints(personalTag.id, 1),
      location: TaskLocation.inSprint(currentSprint.id)
    });

    // Sample work tasks
    const workTask1 = Task.create({
      title: 'Review quarterly report',
      description: 'Go through the Q4 numbers and prepare summary.',
      tagPoints: createTagPoints(workTag.id, 3),
      location: TaskLocation.inSprint(currentSprint.id)
    });

    const workTask2 = Task.create({
      title: 'Prepare presentation slides',
      description: 'Create slides for the team meeting.',
      tagPoints: createTagPoints(workTag.id, 2),
      location: TaskLocation.inSprint(currentSprint.id)
    });

    const workTask3 = Task.create({
      title: 'Reply to client emails',
      description: 'Catch up on pending email threads.',
      tagPoints: createTagPoints(workTag.id, 1),
      location: TaskLocation.inSprint(nextSprint.id)
    });

    // Sample personal/health tasks
    const healthTask = Task.create({
      title: 'Morning workout',
      description: '30 min cardio + stretching',
      tagPoints: createTagPoints(healthTag.id, 2),
      location: TaskLocation.inSprint(currentSprint.id)
    });

    const personalTask = Task.create({
      title: 'Grocery shopping',
      description: 'Weekly groceries - check the list in the fridge.',
      tagPoints: createTagPoints(personalTag.id, 1),
      location: TaskLocation.inSprint(currentSprint.id)
    });

    const learningTask = Task.create({
      title: 'Read a chapter of current book',
      description: 'Continue reading "Atomic Habits"',
      tagPoints: createTagPoints(learningTag.id, 1),
      location: TaskLocation.inSprint(nextSprint.id)
    });

    // Backlog tasks
    const backlogTask1 = Task.create({
      title: 'Plan vacation itinerary',
      description: 'Research destinations and book accommodations.',
      tagPoints: createTagPoints(personalTag.id, 2),
      location: TaskLocation.backlog()
    });

    const backlogTask2 = Task.create({
      title: 'Learn a new programming language',
      description: 'Start with Rust or Go tutorials.',
      tagPoints: createTagPoints(learningTag.id, 5),
      location: TaskLocation.backlog()
    });

    await Promise.all([
      taskRepository.save(tutorialTask1),
      taskRepository.save(tutorialTask2),
      taskRepository.save(tutorialTask3),
      taskRepository.save(tutorialTask4),
      taskRepository.save(workTask1),
      taskRepository.save(workTask2),
      taskRepository.save(workTask3),
      taskRepository.save(healthTask),
      taskRepository.save(personalTask),
      taskRepository.save(learningTask),
      taskRepository.save(backlogTask1),
      taskRepository.save(backlogTask2)
    ]);

    return {
      success: true,
      message: 'Demo data loaded successfully',
      counts: {
        tags: 5,
        routines: 3,
        sprints: 3,
        tasks: 12
      }
    };
  });

  // Reset all data
  server.register('devtools.resetAllData', async () => {
    storage.clear();
    return {
      success: true,
      message: 'All data has been reset'
    };
  });

  // Export backup
  server.register('devtools.exportBackup', async () => {
    const [tasks, tags, sprints, routines] = await Promise.all([
      taskRepository.findAll(),
      tagRepository.findAll(),
      sprintRepository.findAll(),
      routineRepository.findAll()
    ]);

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks: tasks.map(t => t.toObject()),
      tags: tags.map(t => t.toObject()),
      sprints: sprints.map(s => s.toObject()),
      routines: routines.map(r => r.toObject())
    };
  });

  // Import backup
  server.register('devtools.importBackup', async (params: {
    version: number;
    tasks: any[];
    tags: any[];
    sprints: any[];
    routines: any[];
  }) => {
    if (params.version !== 1) {
      throw new Error('Unsupported backup version');
    }

    // Clear existing data
    storage.clear();

    // Import tags
    for (const tagData of params.tags) {
      const tag = Tag.fromObject(tagData);
      await tagRepository.save(tag);
    }

    // Import sprints
    for (const sprintData of params.sprints) {
      const sprint = Sprint.fromObject(sprintData);
      await sprintRepository.save(sprint);
    }

    // Import routines
    for (const routineData of params.routines) {
      const routine = Routine.fromObject(routineData);
      await routineRepository.save(routine);
    }

    // Import tasks
    for (const taskData of params.tasks) {
      const task = Task.fromObject(taskData);
      await taskRepository.save(task);
    }

    return {
      success: true,
      message: 'Backup imported successfully',
      counts: {
        tags: params.tags.length,
        routines: params.routines.length,
        sprints: params.sprints.length,
        tasks: params.tasks.length
      }
    };
  });
}
