import { Task, TaskId, ITaskRepository } from '@checkmate/domain';

export interface UpdateTaskInput {
  taskId: string;
  title?: string;
  description?: string;
  tagPoints?: Record<string, number>;
}

export interface AddCommentInput {
  taskId: string;
  content: string;
}

export interface DeleteCommentInput {
  taskId: string;
  commentId: string;
}

export interface UpdateTaskOutput {
  task: ReturnType<Task['toData']>;
}

export class UpdateTaskCommand {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(input: UpdateTaskInput): Promise<UpdateTaskOutput> {
    const taskId = TaskId.fromString(input.taskId);
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new Error('Task not found');
    }

    if (input.title !== undefined) {
      task.updateTitle(input.title);
    }

    if (input.description !== undefined) {
      task.updateDescription(input.description);
    }

    if (input.tagPoints !== undefined) {
      task.updateTagPoints(input.tagPoints);
    }

    await this.taskRepository.save(task);

    return {
      task: task.toData(),
    };
  }
}

export class AddCommentCommand {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(input: AddCommentInput): Promise<UpdateTaskOutput> {
    const taskId = TaskId.fromString(input.taskId);
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new Error('Task not found');
    }

    task.addComment(input.content);
    await this.taskRepository.save(task);

    return {
      task: task.toData(),
    };
  }
}

export class DeleteCommentCommand {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(input: DeleteCommentInput): Promise<UpdateTaskOutput> {
    const taskId = TaskId.fromString(input.taskId);
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new Error('Task not found');
    }

    const { CommentId } = await import('@checkmate/domain');
    const commentId = CommentId.fromString(input.commentId);
    task.deleteComment(commentId);
    await this.taskRepository.save(task);

    return {
      task: task.toData(),
    };
  }
}
