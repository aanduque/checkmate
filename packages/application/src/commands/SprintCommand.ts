import {
  Sprint,
  SprintId,
  TagId,
  ISprintRepository,
} from '@checkmate/domain';

export interface SetCapacityOverrideInput {
  sprintId: string;
  tagId: string;
  capacity: number;
}

export interface ClearCapacityOverrideInput {
  sprintId: string;
  tagId: string;
}

export interface SprintOutput {
  sprint: ReturnType<Sprint['toData']>;
}

export class SetSprintCapacityOverrideCommand {
  constructor(private readonly sprintRepository: ISprintRepository) {}

  async execute(input: SetCapacityOverrideInput): Promise<SprintOutput> {
    const sprintId = SprintId.fromString(input.sprintId);
    const sprint = await this.sprintRepository.findById(sprintId);

    if (!sprint) {
      throw new Error('Sprint not found');
    }

    const tagId = TagId.fromString(input.tagId);
    sprint.setCapacityOverride(tagId, input.capacity);
    await this.sprintRepository.save(sprint);

    return { sprint: sprint.toData() };
  }
}

export class ClearSprintCapacityOverrideCommand {
  constructor(private readonly sprintRepository: ISprintRepository) {}

  async execute(input: ClearCapacityOverrideInput): Promise<SprintOutput> {
    const sprintId = SprintId.fromString(input.sprintId);
    const sprint = await this.sprintRepository.findById(sprintId);

    if (!sprint) {
      throw new Error('Sprint not found');
    }

    const tagId = TagId.fromString(input.tagId);
    sprint.clearCapacityOverride(tagId);
    await this.sprintRepository.save(sprint);

    return { sprint: sprint.toData() };
  }
}
