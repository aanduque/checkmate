import { RoutineId } from '../value-objects/RoutineId';

export interface RoutineProps {
  id: RoutineId;
  name: string;
  description: string;
  icon: string;
  color: string;
  priority: number;
  taskFilterExpression: string;
  activationExpression: string;
}

export interface CreateRoutineProps {
  name: string;
  description?: string;
  icon: string;
  color: string;
  priority?: number;
  taskFilterExpression: string;
  activationExpression: string;
}

/**
 * Routine aggregate root - filter configuration with activation rules
 */
export class Routine {
  private constructor(
    private readonly _id: RoutineId,
    private _name: string,
    private _description: string,
    private _icon: string,
    private _color: string,
    private _priority: number,
    private _taskFilterExpression: string,
    private _activationExpression: string
  ) {}

  static create(props: CreateRoutineProps): Routine {
    if (!props.name || props.name.trim() === '') {
      throw new Error('Routine name cannot be empty');
    }

    const priority = props.priority ?? 5;
    if (priority < 1 || priority > 10) {
      throw new Error('Priority must be between 1 and 10');
    }

    return new Routine(
      RoutineId.create(),
      props.name.trim(),
      props.description?.trim() ?? '',
      props.icon,
      props.color,
      priority,
      props.taskFilterExpression,
      props.activationExpression
    );
  }

  static fromProps(props: RoutineProps): Routine {
    return new Routine(
      props.id,
      props.name,
      props.description,
      props.icon,
      props.color,
      props.priority,
      props.taskFilterExpression,
      props.activationExpression
    );
  }

  get id(): RoutineId {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get icon(): string {
    return this._icon;
  }

  get color(): string {
    return this._color;
  }

  get priority(): number {
    return this._priority;
  }

  get taskFilterExpression(): string {
    return this._taskFilterExpression;
  }

  get activationExpression(): string {
    return this._activationExpression;
  }

  updateName(name: string): void {
    if (!name || name.trim() === '') {
      throw new Error('Routine name cannot be empty');
    }
    this._name = name.trim();
  }

  updateDescription(description: string): void {
    this._description = description?.trim() ?? '';
  }

  updateIcon(icon: string): void {
    this._icon = icon;
  }

  updateColor(color: string): void {
    this._color = color;
  }

  updatePriority(priority: number): void {
    if (priority < 1 || priority > 10) {
      throw new Error('Priority must be between 1 and 10');
    }
    this._priority = priority;
  }

  updateTaskFilterExpression(expression: string): void {
    this._taskFilterExpression = expression;
  }

  updateActivationExpression(expression: string): void {
    this._activationExpression = expression;
  }

  toData(): {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    priority: number;
    taskFilterExpression: string;
    activationExpression: string;
  } {
    return {
      id: this._id.toString(),
      name: this._name,
      description: this._description,
      icon: this._icon,
      color: this._color,
      priority: this._priority,
      taskFilterExpression: this._taskFilterExpression,
      activationExpression: this._activationExpression,
    };
  }
}
