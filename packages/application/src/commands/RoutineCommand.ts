import { Routine, RoutineId, IRoutineRepository } from '@checkmate/domain';

export interface CreateRoutineInput {
  name: string;
  description?: string;
  icon: string;
  color: string;
  priority?: number;
  taskFilterExpression: string;
  activationExpression: string;
}

export interface UpdateRoutineInput {
  routineId: string;
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  priority?: number;
  taskFilterExpression?: string;
  activationExpression?: string;
}

export interface DeleteRoutineInput {
  routineId: string;
}

export interface RoutineOutput {
  routine: ReturnType<Routine['toData']>;
}

export class CreateRoutineCommand {
  constructor(private readonly routineRepository: IRoutineRepository) {}

  async execute(input: CreateRoutineInput): Promise<RoutineOutput> {
    // Check for duplicate name
    const existing = await this.routineRepository.findByName(input.name);
    if (existing) {
      throw new Error('Routine with this name already exists');
    }

    const routine = Routine.create({
      name: input.name,
      description: input.description,
      icon: input.icon,
      color: input.color,
      priority: input.priority,
      taskFilterExpression: input.taskFilterExpression,
      activationExpression: input.activationExpression,
    });

    await this.routineRepository.save(routine);

    return { routine: routine.toData() };
  }
}

export class UpdateRoutineCommand {
  constructor(private readonly routineRepository: IRoutineRepository) {}

  async execute(input: UpdateRoutineInput): Promise<RoutineOutput> {
    const routineId = RoutineId.fromString(input.routineId);
    const routine = await this.routineRepository.findById(routineId);

    if (!routine) {
      throw new Error('Routine not found');
    }

    if (input.name !== undefined) {
      routine.updateName(input.name);
    }
    if (input.description !== undefined) {
      routine.updateDescription(input.description);
    }
    if (input.icon !== undefined) {
      routine.updateIcon(input.icon);
    }
    if (input.color !== undefined) {
      routine.updateColor(input.color);
    }
    if (input.priority !== undefined) {
      routine.updatePriority(input.priority);
    }
    if (input.taskFilterExpression !== undefined) {
      routine.updateTaskFilterExpression(input.taskFilterExpression);
    }
    if (input.activationExpression !== undefined) {
      routine.updateActivationExpression(input.activationExpression);
    }

    await this.routineRepository.save(routine);

    return { routine: routine.toData() };
  }
}

export class DeleteRoutineCommand {
  constructor(private readonly routineRepository: IRoutineRepository) {}

  async execute(input: DeleteRoutineInput): Promise<void> {
    const routineId = RoutineId.fromString(input.routineId);
    const routine = await this.routineRepository.findById(routineId);

    if (!routine) {
      throw new Error('Routine not found');
    }

    await this.routineRepository.delete(routineId);
  }
}
