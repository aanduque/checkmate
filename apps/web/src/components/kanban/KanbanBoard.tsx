import React from 'react';
import { TaskDTO } from '../../services/rpcClient';
import { KanbanColumn } from './KanbanColumn';

interface KanbanBoardProps {
  backlog: TaskDTO[];
  sprint: TaskDTO[];
  completed: TaskDTO[];
  onTaskAction: (taskId: string, action: 'complete' | 'cancel') => void;
}

export function KanbanBoard({
  backlog,
  sprint,
  completed,
  onTaskAction
}: KanbanBoardProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:gap-4">
      <KanbanColumn
        title="Backlog"
        tasks={backlog}
        onTaskAction={onTaskAction}
        variant="backlog"
      />
      <KanbanColumn
        title="Sprint"
        tasks={sprint}
        onTaskAction={onTaskAction}
        variant="sprint"
      />
      <KanbanColumn
        title="Completed"
        tasks={completed}
        onTaskAction={onTaskAction}
        variant="completed"
      />
    </div>
  );
}
