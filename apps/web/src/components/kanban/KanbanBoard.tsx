import React, { useEffect, useRef } from 'react';
import { useSelector } from 'statux';
import type { TaskDTO, TagDTO, SprintDTO } from '../../services/rpcClient';
import type { KanbanData, ExtendedTaskDTO } from '../../mocks/mockData';
import { KanbanColumn } from './KanbanColumn';
import type { AppState } from '../../store';

interface KanbanBoardProps {
  kanbanData: KanbanData;
  onMoveTask: (taskId: string, targetColumn: string) => void;
  onOpenTaskDetail: (task: ExtendedTaskDTO) => void;
  onCompleteTask: (taskId: string) => void;
  onCancelTask: (task: TaskDTO) => void;
  onStartSession: (taskId: string) => void;
}

export function KanbanBoard({
  kanbanData,
  onMoveTask,
  onOpenTaskDetail,
  onCompleteTask,
  onCancelTask,
  onStartSession
}: KanbanBoardProps) {
  const tags = useSelector<TagDTO[]>('tags');
  const sprints = useSelector<SprintDTO[]>('sprints');
  const activeSession = useSelector<AppState['ui']['activeSession']>('ui.activeSession');

  const backlogRef = useRef<HTMLDivElement>(null);
  const thisWeekRef = useRef<HTMLDivElement>(null);
  const nextWeekRef = useRef<HTMLDivElement>(null);

  // Initialize SortableJS for drag and drop
  useEffect(() => {
    const initSortable = async () => {
      try {
        const Sortable = (await import('sortablejs')).default;

        const group = { name: 'kanban', pull: true, put: true };
        const options = {
          group,
          animation: 150,
          ghostClass: 'opacity-50',
          dragClass: 'cursor-grabbing',
          onEnd: (evt: { item: HTMLElement; to: HTMLElement }) => {
            const taskId = evt.item.dataset.id;
            const targetColumn = evt.to.dataset.column;
            if (taskId && targetColumn) {
              onMoveTask(taskId, targetColumn);
            }
          }
        };

        if (backlogRef.current) {
          Sortable.create(backlogRef.current, options);
        }
        if (thisWeekRef.current) {
          Sortable.create(thisWeekRef.current, options);
        }
        if (nextWeekRef.current) {
          Sortable.create(nextWeekRef.current, options);
        }
      } catch {
        // SortableJS not available, drag and drop disabled
        console.warn('SortableJS not loaded, drag-drop disabled');
      }
    };

    initSortable();
  }, [onMoveTask]);

  const getTagById = (tagId: string) => tags.find(t => t.id === tagId);

  const getTaskPrimaryTag = (task: ExtendedTaskDTO): TagDTO | undefined => {
    const tagIds = Object.keys(task.tagPoints);
    if (tagIds.length === 0) return undefined;
    return getTagById(tagIds[0]);
  };

  // Calculate sprint health
  const getSprintHealth = (sprintIndex: number): 'on_track' | 'at_risk' | 'off_track' => {
    const sprintTasks = sprintIndex === 0 ? kanbanData.thisWeek : kanbanData.nextWeek;
    const totalPoints = sprintTasks.reduce((sum, t) => sum + t.totalPoints, 0);
    const totalCapacity = tags.reduce((sum, t) => sum + t.defaultCapacity, 0);

    if (totalCapacity === 0) return 'on_track';
    const ratio = totalPoints / totalCapacity;

    if (ratio <= 0.8) return 'on_track';
    if (ratio <= 1.0) return 'at_risk';
    return 'off_track';
  };

  // Calculate days remaining in sprint
  const getDaysRemaining = (sprint: SprintDTO): number => {
    const now = new Date();
    const end = new Date(sprint.endDate);
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const currentSprint = sprints[0];
  const nextSprint = sprints[1];

  return (
    <div className="kanban-container flex flex-col gap-4 md:flex-row md:gap-4">
      {/* Backlog Column */}
      <KanbanColumn
        title="Backlog"
        icon="file-tray-stacked-outline"
        iconClass="text-accent"
        tasks={kanbanData.backlog}
        recurringTemplates={kanbanData.recurringTemplates}
        columnRef={backlogRef}
        columnId="backlog"
        variant="backlog"
        onOpenTaskDetail={onOpenTaskDetail}
        getTaskPrimaryTag={getTaskPrimaryTag}
        getTagById={getTagById}
      />

      {/* This Week Column */}
      <KanbanColumn
        title="This Week"
        icon="calendar-outline"
        iconClass="text-primary"
        tasks={kanbanData.thisWeek}
        columnRef={thisWeekRef}
        columnId={currentSprint?.id || 'sprint-0'}
        variant="sprint"
        sprintHealth={getSprintHealth(0)}
        daysRemaining={currentSprint ? getDaysRemaining(currentSprint) : undefined}
        onOpenTaskDetail={onOpenTaskDetail}
        onCompleteTask={onCompleteTask}
        onStartSession={onStartSession}
        activeSessionTaskId={activeSession?.taskId}
        getTaskPrimaryTag={getTaskPrimaryTag}
        getTagById={getTagById}
        defaultOpen
      />

      {/* Next Week Column */}
      <KanbanColumn
        title="Next Week"
        icon="calendar-outline"
        iconClass="text-secondary"
        tasks={kanbanData.nextWeek}
        columnRef={nextWeekRef}
        columnId={nextSprint?.id || 'sprint-1'}
        variant="sprint"
        sprintHealth={getSprintHealth(1)}
        daysRemaining={nextSprint ? getDaysRemaining(nextSprint) : undefined}
        onOpenTaskDetail={onOpenTaskDetail}
        onCompleteTask={onCompleteTask}
        onStartSession={onStartSession}
        activeSessionTaskId={activeSession?.taskId}
        getTaskPrimaryTag={getTaskPrimaryTag}
        getTagById={getTagById}
      />
    </div>
  );
}
