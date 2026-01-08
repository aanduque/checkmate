/**
 * Mock data for development until Stream B provides real API
 */

import { TagDTO, TaskDTO, SprintDTO, FocusTaskDTO, DailyStatsDTO, WeeklyStatsDTO } from '../services/rpcClient';
import { RoutineDTO } from '../store';

// Helper to generate dates
const today = new Date();
const getSprintStart = (weeksFromNow: number): string => {
  const d = new Date(today);
  // Find Sunday of this week
  d.setDate(d.getDate() - d.getDay() + (weeksFromNow * 7));
  return d.toISOString().split('T')[0];
};

const getSprintEnd = (weeksFromNow: number): string => {
  const d = new Date(today);
  d.setDate(d.getDate() - d.getDay() + 6 + (weeksFromNow * 7));
  return d.toISOString().split('T')[0];
};

// Mock Tags
export const mockTags: TagDTO[] = [
  { id: 'tag-work', name: 'Work', icon: '💼', color: '#3b82f6', defaultCapacity: 21 },
  { id: 'tag-personal', name: 'Personal', icon: '🏠', color: '#22c55e', defaultCapacity: 13 },
  { id: 'tag-health', name: 'Health', icon: '💪', color: '#ef4444', defaultCapacity: 8 },
  { id: 'tag-learning', name: 'Learning', icon: '📚', color: '#a855f7', defaultCapacity: 8 },
  { id: 'untagged', name: 'Untagged', icon: '📌', color: '#6b7280', defaultCapacity: 5 }
];

// Mock Sprints (rolling 3-sprint window)
export const mockSprints: SprintDTO[] = [
  { id: 'sprint-0', startDate: getSprintStart(0), endDate: getSprintEnd(0) },
  { id: 'sprint-1', startDate: getSprintStart(1), endDate: getSprintEnd(1) },
  { id: 'sprint-2', startDate: getSprintStart(2), endDate: getSprintEnd(2) }
];

// Mock Tasks
export const mockTasks: TaskDTO[] = [
  // Sprint 0 (This Week)
  {
    id: 'task-1',
    title: 'Review pull requests',
    status: 'active',
    tagPoints: { 'tag-work': 3 },
    totalPoints: 3,
    tags: [{ id: 'tag-work', name: 'Work', color: '#3b82f6' }]
  },
  {
    id: 'task-2',
    title: 'Write unit tests for auth module',
    status: 'active',
    tagPoints: { 'tag-work': 5 },
    totalPoints: 5,
    tags: [{ id: 'tag-work', name: 'Work', color: '#3b82f6' }]
  },
  {
    id: 'task-3',
    title: 'Morning workout routine',
    status: 'active',
    tagPoints: { 'tag-health': 2 },
    totalPoints: 2,
    tags: [{ id: 'tag-health', name: 'Health', color: '#ef4444' }]
  },
  {
    id: 'task-4',
    title: 'Read chapter 5 of Clean Code',
    status: 'active',
    tagPoints: { 'tag-learning': 3 },
    totalPoints: 3,
    tags: [{ id: 'tag-learning', name: 'Learning', color: '#a855f7' }]
  },
  // Backlog
  {
    id: 'task-5',
    title: 'Plan weekend trip',
    status: 'active',
    tagPoints: { 'tag-personal': 2 },
    totalPoints: 2,
    tags: [{ id: 'tag-personal', name: 'Personal', color: '#22c55e' }]
  },
  {
    id: 'task-6',
    title: 'Set up CI/CD pipeline',
    status: 'active',
    tagPoints: { 'tag-work': 8 },
    totalPoints: 8,
    tags: [{ id: 'tag-work', name: 'Work', color: '#3b82f6' }]
  },
  {
    id: 'task-7',
    title: 'Learn TypeScript generics',
    status: 'active',
    tagPoints: { 'tag-learning': 5 },
    totalPoints: 5,
    tags: [{ id: 'tag-learning', name: 'Learning', color: '#a855f7' }]
  },
  // Sprint 1 (Next Week)
  {
    id: 'task-8',
    title: 'Quarterly planning meeting',
    status: 'active',
    tagPoints: { 'tag-work': 3 },
    totalPoints: 3,
    tags: [{ id: 'tag-work', name: 'Work', color: '#3b82f6' }]
  },
  {
    id: 'task-9',
    title: 'Schedule dental checkup',
    status: 'active',
    tagPoints: { 'tag-health': 1 },
    totalPoints: 1,
    tags: [{ id: 'tag-health', name: 'Health', color: '#ef4444' }]
  }
];

// Extended task data with location info (for kanban)
export interface ExtendedTaskDTO extends TaskDTO {
  location: { type: 'backlog' } | { type: 'sprint'; sprintId: string };
  skipState?: { type: 'for_now' | 'for_day'; skippedAt: string };
  description?: string;
  sessions?: Array<{
    id: string;
    startedAt: string;
    endedAt?: string;
    durationMinutes: number;
    focusLevel?: 'distracted' | 'neutral' | 'focused';
    status: 'in_progress' | 'completed' | 'abandoned';
  }>;
}

export const mockExtendedTasks: ExtendedTaskDTO[] = [
  { ...mockTasks[0], location: { type: 'sprint', sprintId: 'sprint-0' } },
  { ...mockTasks[1], location: { type: 'sprint', sprintId: 'sprint-0' } },
  { ...mockTasks[2], location: { type: 'sprint', sprintId: 'sprint-0' } },
  { ...mockTasks[3], location: { type: 'sprint', sprintId: 'sprint-0' } },
  { ...mockTasks[4], location: { type: 'backlog' } },
  { ...mockTasks[5], location: { type: 'backlog' } },
  { ...mockTasks[6], location: { type: 'backlog' } },
  { ...mockTasks[7], location: { type: 'sprint', sprintId: 'sprint-1' } },
  { ...mockTasks[8], location: { type: 'sprint', sprintId: 'sprint-1' } }
];

// Mock Routines
export const mockRoutines: RoutineDTO[] = [
  {
    id: 'routine-work',
    name: 'Work',
    icon: '💼',
    color: '#3b82f6',
    priority: 10,
    taskFilterExpression: 'hasTag("Work")',
    activationExpression: 'isWeekday and hour >= 9 and hour < 18'
  },
  {
    id: 'routine-personal',
    name: 'Personal',
    icon: '🏠',
    color: '#22c55e',
    priority: 5,
    taskFilterExpression: 'hasTag("Personal") or hasTag("Health")',
    activationExpression: 'isWeekend or hour >= 18 or hour < 9'
  }
];

// Mock Focus Task (first non-skipped task in current sprint)
export const mockFocusTask: FocusTaskDTO = {
  id: 'task-1',
  title: 'Review pull requests',
  tagPoints: { 'tag-work': 3 },
  totalPoints: 3
};

// Mock Up Next tasks
export const mockUpNext: FocusTaskDTO[] = [
  { id: 'task-2', title: 'Write unit tests for auth module', tagPoints: { 'tag-work': 5 }, totalPoints: 5 },
  { id: 'task-3', title: 'Morning workout routine', tagPoints: { 'tag-health': 2 }, totalPoints: 2 },
  { id: 'task-4', title: 'Read chapter 5 of Clean Code', tagPoints: { 'tag-learning': 3 }, totalPoints: 3 }
];

// Mock Daily Stats
export const mockDailyStats: DailyStatsDTO = {
  tasksCompleted: 3,
  pointsCompleted: 8,
  focusTimeSeconds: 5400, // 1.5 hours
  sessionsCount: 3,
  currentStreak: 5,
  focusQuality: {
    distractedCount: 1,
    neutralCount: 1,
    focusedCount: 1,
    averageScore: 0.66
  }
};

// Mock Weekly Stats
export const mockWeeklyStats: WeeklyStatsDTO = {
  tasksCompleted: 12,
  pointsCompleted: 34,
  focusTimeSeconds: 25200, // 7 hours
  sessionsCount: 14,
  currentStreak: 5,
  dailyActivity: [
    { date: '2025-01-05', tasksCompleted: 2, pointsCompleted: 5, focusTimeSeconds: 3600, sessionsCount: 2 },
    { date: '2025-01-06', tasksCompleted: 3, pointsCompleted: 8, focusTimeSeconds: 5400, sessionsCount: 3 },
    { date: '2025-01-07', tasksCompleted: 2, pointsCompleted: 6, focusTimeSeconds: 4500, sessionsCount: 2 },
    { date: '2025-01-08', tasksCompleted: 3, pointsCompleted: 7, focusTimeSeconds: 5400, sessionsCount: 3 },
    { date: '2025-01-09', tasksCompleted: 2, pointsCompleted: 8, focusTimeSeconds: 6300, sessionsCount: 4 }
  ],
  pointsByTag: {
    'tag-work': 18,
    'tag-personal': 6,
    'tag-health': 4,
    'tag-learning': 6
  }
};

// Kanban board data
export interface KanbanData {
  backlog: ExtendedTaskDTO[];
  thisWeek: ExtendedTaskDTO[];
  nextWeek: ExtendedTaskDTO[];
  recurringTemplates: ExtendedTaskDTO[];
}

export const mockKanbanData: KanbanData = {
  backlog: mockExtendedTasks.filter(t => t.location.type === 'backlog'),
  thisWeek: mockExtendedTasks.filter(t => t.location.type === 'sprint' && t.location.sprintId === 'sprint-0'),
  nextWeek: mockExtendedTasks.filter(t => t.location.type === 'sprint' && t.location.sprintId === 'sprint-1'),
  recurringTemplates: [] // Empty for now
};
