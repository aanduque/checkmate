/**
 * Routine - Time-based task filter configuration
 * Entity: Has identity, expression-based filtering
 *
 * Per DEC-008: Routines filter tasks based on time (activation) and task properties (filter)
 */

export interface RoutineObject {
  id: string;
  name: string;
  icon: string;
  color: string;
  priority: number;
  taskFilterExpression: string;
  activationExpression: string;
}

export class Routine {
  private constructor(
    private readonly _id: string,
    private readonly _name: string,
    private readonly _icon: string,
    private readonly _color: string,
    private readonly _priority: number,
    private readonly _taskFilterExpression: string,
    private readonly _activationExpression: string
  ) {}

  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get icon(): string { return this._icon; }
  get color(): string { return this._color; }
  get priority(): number { return this._priority; }
  get taskFilterExpression(): string { return this._taskFilterExpression; }
  get activationExpression(): string { return this._activationExpression; }

  /**
   * Create a new routine
   */
  static create(props: {
    name: string;
    icon: string;
    color: string;
    priority: number;
    taskFilterExpression: string;
    activationExpression: string;
  }): Routine {
    const trimmedName = props.name.trim();
    if (!trimmedName) {
      throw new Error('Routine name cannot be empty');
    }

    if (props.priority < 1 || props.priority > 10) {
      throw new Error('Priority must be between 1 and 10');
    }

    return new Routine(
      Routine.generateId(),
      trimmedName,
      props.icon,
      props.color,
      props.priority,
      props.taskFilterExpression,
      props.activationExpression
    );
  }

  /**
   * Update the routine name
   */
  updateName(name: string): Routine {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Routine name cannot be empty');
    }

    return new Routine(
      this._id,
      trimmed,
      this._icon,
      this._color,
      this._priority,
      this._taskFilterExpression,
      this._activationExpression
    );
  }

  /**
   * Update the routine icon
   */
  updateIcon(icon: string): Routine {
    return new Routine(
      this._id,
      this._name,
      icon,
      this._color,
      this._priority,
      this._taskFilterExpression,
      this._activationExpression
    );
  }

  /**
   * Update the routine color
   */
  updateColor(color: string): Routine {
    return new Routine(
      this._id,
      this._name,
      this._icon,
      color,
      this._priority,
      this._taskFilterExpression,
      this._activationExpression
    );
  }

  /**
   * Update the priority
   */
  updatePriority(priority: number): Routine {
    if (priority < 1 || priority > 10) {
      throw new Error('Priority must be between 1 and 10');
    }

    return new Routine(
      this._id,
      this._name,
      this._icon,
      this._color,
      priority,
      this._taskFilterExpression,
      this._activationExpression
    );
  }

  /**
   * Update the task filter expression
   */
  updateTaskFilterExpression(expression: string): Routine {
    return new Routine(
      this._id,
      this._name,
      this._icon,
      this._color,
      this._priority,
      expression,
      this._activationExpression
    );
  }

  /**
   * Update the activation expression
   */
  updateActivationExpression(expression: string): Routine {
    return new Routine(
      this._id,
      this._name,
      this._icon,
      this._color,
      this._priority,
      this._taskFilterExpression,
      expression
    );
  }

  /**
   * Compare priority with another routine
   * Returns positive if this has higher priority, negative if lower, 0 if equal
   */
  comparePriority(other: Routine): number {
    return this._priority - other._priority;
  }

  /**
   * Recreate from a plain object
   */
  static fromObject(obj: RoutineObject): Routine {
    return new Routine(
      obj.id,
      obj.name,
      obj.icon,
      obj.color,
      obj.priority,
      obj.taskFilterExpression,
      obj.activationExpression
    );
  }

  /**
   * Serialize to a plain object
   */
  toObject(): RoutineObject {
    return {
      id: this._id,
      name: this._name,
      icon: this._icon,
      color: this._color,
      priority: this._priority,
      taskFilterExpression: this._taskFilterExpression,
      activationExpression: this._activationExpression
    };
  }

  private static generateId(): string {
    return `routine_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}_${Date.now()}`;
  }
}
