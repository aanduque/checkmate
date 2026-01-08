/**
 * SetSprintCapacityOverrideCommand - Sets a capacity override for a tag in a sprint
 */

import { ISprintRepository } from '@checkmate/domain';

export interface SetSprintCapacityOverrideCommand {
  sprintId: string;
  tagId: string;
  capacity: number;
}

export interface SetSprintCapacityOverrideResult {
  sprintId: string;
  tagId: string;
  capacity: number;
}

export class SetSprintCapacityOverrideHandler {
  constructor(private readonly sprintRepository: ISprintRepository) {}

  async execute(command: SetSprintCapacityOverrideCommand): Promise<SetSprintCapacityOverrideResult> {
    const sprint = await this.sprintRepository.findById(command.sprintId);
    if (!sprint) {
      throw new Error('Sprint not found');
    }

    const updatedSprint = sprint.setCapacityOverride(command.tagId, command.capacity);
    await this.sprintRepository.save(updatedSprint);

    return {
      sprintId: updatedSprint.id,
      tagId: command.tagId,
      capacity: command.capacity
    };
  }
}
