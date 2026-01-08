/**
 * Demo Data Service
 * Handles loading sample data, reset, export/import functionality
 */

import { TagDTO, TaskDTO, SprintDTO, RoutineDTO } from './rpcClient';

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
    startDate: startOfWeek.toISOString().split('T')[0],
    endDate: endOfWeek.toISOString().split('T')[0]
  };
};

export interface DemoData {
  tags: TagDTO[];
  routines: RoutineDTO[];
  sprints: SprintDTO[];
  tasks: ExtendedTask[];
}

interface ExtendedTask extends TaskDTO {
  description?: string;
  location: { type: 'backlog' } | { type: 'sprint'; sprintId: string };
  order: number;
  createdAt: string;
  recurrence?: string;
}

export function generateDemoData(): DemoData {
  // Generate tag IDs
  const workTagId = generateId();
  const personalTagId = generateId();
  const healthTagId = generateId();
  const learningTagId = generateId();

  const tags: TagDTO[] = [
    { id: 'untagged', name: 'Untagged', icon: '📦', color: '#6b7280', defaultCapacity: 10 },
    { id: workTagId, name: 'Work', icon: '💼', color: '#3b82f6', defaultCapacity: 25 },
    { id: personalTagId, name: 'Personal', icon: '🏠', color: '#22c55e', defaultCapacity: 15 },
    { id: healthTagId, name: 'Health', icon: '❤️', color: '#ef4444', defaultCapacity: 10 },
    { id: learningTagId, name: 'Learning', icon: '📚', color: '#8b5cf6', defaultCapacity: 10 }
  ];

  const routines: RoutineDTO[] = [
    {
      id: generateId(),
      name: 'Work Hours',
      icon: '💼',
      color: '#3b82f6',
      priority: 8,
      taskFilterExpression: 'hasTag("Work")',
      activationExpression: 'isWeekday and hour >= 9 and hour < 18'
    },
    {
      id: generateId(),
      name: 'Evening',
      icon: '🌙',
      color: '#8b5cf6',
      priority: 5,
      taskFilterExpression: 'hasAnyTag("Personal", "Health")',
      activationExpression: 'hour >= 18 or hour < 9'
    },
    {
      id: generateId(),
      name: 'Weekend',
      icon: '☀️',
      color: '#f59e0b',
      priority: 7,
      taskFilterExpression: 'hasAnyTag("Personal", "Health", "Learning")',
      activationExpression: 'isWeekend'
    }
  ];

  // Generate sprints
  const currentSprintDates = getSprintDates(0);
  const nextSprintDates = getSprintDates(1);
  const followingSprintDates = getSprintDates(2);

  const currentSprintId = generateId();
  const nextSprintId = generateId();

  const sprints: SprintDTO[] = [
    { id: currentSprintId, ...currentSprintDates },
    { id: nextSprintId, ...nextSprintDates },
    { id: generateId(), ...followingSprintDates }
  ];

  const now = new Date().toISOString();

  const tasks: ExtendedTask[] = [
    // === TUTORIAL TASKS (in current sprint) ===
    {
      id: generateId(),
      title: 'Welcome to Check Mate! Tap here to see task details',
      description: `This is a tutorial task. Check Mate helps you manage tasks with an ADHD-friendly approach:

- Focus on ONE task at a time
- Organize by weekly sprints
- Filter tasks by routine (work/personal)
- Track time with focus sessions

Tap "Done" when you've read this!`,
      tagPoints: { [personalTagId]: 1 },
      totalPoints: 1,
      tags: [{ id: personalTagId, name: 'Personal', color: '#22c55e' }],
      status: 'active',
      location: { type: 'sprint', sprintId: currentSprintId },
      order: 0,
      createdAt: now
    },
    {
      id: generateId(),
      title: 'Try starting a Focus session (tap the play button)',
      description: `Focus sessions help you track time spent on tasks.

1. Tap the play button on any task
2. Work on the task
3. When done, tap Complete to log your time

Sessions are saved and help you understand where your time goes.`,
      tagPoints: { [personalTagId]: 1 },
      totalPoints: 1,
      tags: [{ id: personalTagId, name: 'Personal', color: '#22c55e' }],
      status: 'active',
      location: { type: 'sprint', sprintId: currentSprintId },
      order: 1,
      createdAt: now
    },
    {
      id: generateId(),
      title: 'Switch to Tasks view to see the Kanban board',
      description: `The Tasks view shows all your tasks organized in columns:

- **Backlog**: Tasks not yet scheduled
- **This Week**: Current sprint tasks
- **Next Week**: Upcoming sprint tasks

Drag tasks between columns to schedule them!`,
      tagPoints: { [personalTagId]: 1 },
      totalPoints: 1,
      tags: [{ id: personalTagId, name: 'Personal', color: '#22c55e' }],
      status: 'active',
      location: { type: 'sprint', sprintId: currentSprintId },
      order: 2,
      createdAt: now
    },
    {
      id: generateId(),
      title: 'Open the menu (hamburger icon) to explore settings',
      description: `The menu contains:

- **Routine selector**: Switch between Work/Personal/etc.
- **Manage Tags**: Create custom categories
- **Manage Routines**: Set up time-based filters
- **Dev Tools**: Reset data or reload demo`,
      tagPoints: { [personalTagId]: 1 },
      totalPoints: 1,
      tags: [{ id: personalTagId, name: 'Personal', color: '#22c55e' }],
      status: 'active',
      location: { type: 'sprint', sprintId: currentSprintId },
      order: 3,
      createdAt: now
    },

    // === SAMPLE WORK TASKS ===
    {
      id: generateId(),
      title: 'Review quarterly report',
      description: 'Go through the Q4 numbers and prepare summary.',
      tagPoints: { [workTagId]: 3 },
      totalPoints: 3,
      tags: [{ id: workTagId, name: 'Work', color: '#3b82f6' }],
      status: 'active',
      location: { type: 'sprint', sprintId: currentSprintId },
      order: 10,
      createdAt: now
    },
    {
      id: generateId(),
      title: 'Prepare presentation slides',
      description: 'Create slides for the team meeting.',
      tagPoints: { [workTagId]: 2 },
      totalPoints: 2,
      tags: [{ id: workTagId, name: 'Work', color: '#3b82f6' }],
      status: 'active',
      location: { type: 'sprint', sprintId: currentSprintId },
      order: 11,
      createdAt: now
    },
    {
      id: generateId(),
      title: 'Reply to client emails',
      description: 'Catch up on pending email threads.',
      tagPoints: { [workTagId]: 1 },
      totalPoints: 1,
      tags: [{ id: workTagId, name: 'Work', color: '#3b82f6' }],
      status: 'active',
      location: { type: 'sprint', sprintId: nextSprintId },
      order: 0,
      createdAt: now
    },

    // === SAMPLE PERSONAL/HEALTH TASKS ===
    {
      id: generateId(),
      title: 'Morning workout',
      description: '30 min cardio + stretching',
      tagPoints: { [healthTagId]: 2 },
      totalPoints: 2,
      tags: [{ id: healthTagId, name: 'Health', color: '#ef4444' }],
      status: 'active',
      location: { type: 'sprint', sprintId: currentSprintId },
      order: 20,
      createdAt: now
    },
    {
      id: generateId(),
      title: 'Grocery shopping',
      description: 'Weekly groceries - check the list in the fridge.',
      tagPoints: { [personalTagId]: 1 },
      totalPoints: 1,
      tags: [{ id: personalTagId, name: 'Personal', color: '#22c55e' }],
      status: 'active',
      location: { type: 'sprint', sprintId: currentSprintId },
      order: 21,
      createdAt: now
    },
    {
      id: generateId(),
      title: 'Read a chapter of current book',
      description: 'Continue reading "Atomic Habits"',
      tagPoints: { [learningTagId]: 1 },
      totalPoints: 1,
      tags: [{ id: learningTagId, name: 'Learning', color: '#8b5cf6' }],
      status: 'active',
      location: { type: 'sprint', sprintId: nextSprintId },
      order: 1,
      createdAt: now
    },

    // === BACKLOG TASKS ===
    {
      id: generateId(),
      title: 'Plan vacation itinerary',
      description: 'Research destinations and book accommodations.',
      tagPoints: { [personalTagId]: 2 },
      totalPoints: 2,
      tags: [{ id: personalTagId, name: 'Personal', color: '#22c55e' }],
      status: 'active',
      location: { type: 'backlog' },
      order: 0,
      createdAt: now
    },
    {
      id: generateId(),
      title: 'Learn a new programming language',
      description: 'Start with Rust or Go tutorials.',
      tagPoints: { [learningTagId]: 5 },
      totalPoints: 5,
      tags: [{ id: learningTagId, name: 'Learning', color: '#8b5cf6' }],
      status: 'active',
      location: { type: 'backlog' },
      order: 1,
      createdAt: now
    },

    // === RECURRING TASK TEMPLATE ===
    {
      id: generateId(),
      title: 'Weekly review',
      description: 'Review completed tasks and plan next week.',
      tagPoints: { [personalTagId]: 1 },
      totalPoints: 1,
      tags: [{ id: personalTagId, name: 'Personal', color: '#22c55e' }],
      status: 'active',
      location: { type: 'backlog' },
      recurrence: 'FREQ=WEEKLY;BYDAY=SU',
      order: 100,
      createdAt: now
    }
  ];

  return { tags, routines, sprints, tasks };
}

// Local storage keys matching POC
const STORAGE_KEYS = {
  tasks: 'checkmate_tasks',
  tags: 'checkmate_tags',
  sprints: 'checkmate_sprints',
  routines: 'checkmate_routines',
  settings: 'checkmate_settings',
  theme: 'checkmate_theme'
};

export function loadDemoDataToStorage(): void {
  const demoData = generateDemoData();

  localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(demoData.tasks));
  localStorage.setItem(STORAGE_KEYS.tags, JSON.stringify(demoData.tags));
  localStorage.setItem(STORAGE_KEYS.sprints, JSON.stringify(demoData.sprints));
  localStorage.setItem(STORAGE_KEYS.routines, JSON.stringify(demoData.routines));

  console.log('Demo data loaded!');
}

export function resetAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  console.log('All data reset!');
}

export interface BackupData {
  version: 1;
  exportedAt: string;
  tasks: unknown[];
  tags: TagDTO[];
  sprints: SprintDTO[];
  routines: RoutineDTO[];
  settings: Record<string, unknown>;
}

export function exportBackup(): BackupData {
  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks: JSON.parse(localStorage.getItem(STORAGE_KEYS.tasks) || '[]'),
    tags: JSON.parse(localStorage.getItem(STORAGE_KEYS.tags) || '[]'),
    sprints: JSON.parse(localStorage.getItem(STORAGE_KEYS.sprints) || '[]'),
    routines: JSON.parse(localStorage.getItem(STORAGE_KEYS.routines) || '[]'),
    settings: JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || '{}')
  };

  return backup;
}

export function downloadBackup(): void {
  const backup = exportBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `checkmate-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importBackup(backup: BackupData): boolean {
  try {
    if (backup.version !== 1) {
      console.error('Unsupported backup version');
      return false;
    }

    if (backup.tasks) localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(backup.tasks));
    if (backup.tags) localStorage.setItem(STORAGE_KEYS.tags, JSON.stringify(backup.tags));
    if (backup.sprints) localStorage.setItem(STORAGE_KEYS.sprints, JSON.stringify(backup.sprints));
    if (backup.routines) localStorage.setItem(STORAGE_KEYS.routines, JSON.stringify(backup.routines));
    if (backup.settings) localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(backup.settings));

    console.log('Backup imported successfully!');
    return true;
  } catch (err) {
    console.error('Failed to import backup:', err);
    return false;
  }
}
