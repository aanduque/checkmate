import React from 'react';
import { TaskDTO } from '../../services/rpcClient';
import { TaskCard } from './TaskCard';

interface KanbanColumnProps {
  title: string;
  tasks: TaskDTO[];
  onTaskAction: (taskId: string, action: 'complete' | 'cancel') => void;
  variant: 'backlog' | 'sprint' | 'completed';
}

export function KanbanColumn({ title, tasks, onTaskAction, variant }: KanbanColumnProps) {
  const totalPoints = tasks.reduce((sum, task) => sum + task.totalPoints, 0);

  const headerColors = {
    backlog: 'bg-base-300',
    sprint: 'bg-primary/20',
    completed: 'bg-success/20'
  };

  return (
    <div className="flex-1 min-w-0 md:min-w-[280px]">
      <div className={`rounded-box p-3 ${headerColors[variant]}`}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">{title}</h3>
          <span className="badge badge-ghost">
            {tasks.length} | {totalPoints} pts
          </span>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {tasks.length === 0 ? (
            <div className="text-center py-4 text-base-content/50 text-sm">
              No tasks
            </div>
          ) : (
            tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onAction={(action) => onTaskAction(task.id, action)}
                showActions={variant !== 'completed'}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
