import { TagId } from '../value-objects/TagId';

export interface TagProps {
  id: TagId;
  name: string;
  description: string;
  icon: string;
  color: string;
  defaultCapacity: number;
}

export interface CreateTagProps {
  name: string;
  description?: string;
  icon: string;
  color: string;
  defaultCapacity: number;
}

/**
 * Tag aggregate root - categorization with visual properties
 */
export class Tag {
  private constructor(
    private readonly _id: TagId,
    private _name: string,
    private _description: string,
    private _icon: string,
    private _color: string,
    private _defaultCapacity: number
  ) {}

  static create(props: CreateTagProps): Tag {
    if (!props.name || props.name.trim() === '') {
      throw new Error('Tag name cannot be empty');
    }
    if (props.defaultCapacity <= 0) {
      throw new Error('Default capacity must be positive');
    }

    return new Tag(
      TagId.create(),
      props.name.trim(),
      props.description?.trim() ?? '',
      props.icon,
      props.color,
      props.defaultCapacity
    );
  }

  static createUntagged(): Tag {
    return new Tag(
      TagId.untagged(),
      'Untagged',
      'Default tag for uncategorized tasks',
      '📦',
      '#6b7280',
      10
    );
  }

  static fromProps(props: TagProps): Tag {
    return new Tag(
      props.id,
      props.name,
      props.description,
      props.icon,
      props.color,
      props.defaultCapacity
    );
  }

  get id(): TagId {
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

  get defaultCapacity(): number {
    return this._defaultCapacity;
  }

  isSystemTag(): boolean {
    return this._id.isUntagged();
  }

  updateName(name: string): void {
    if (this.isSystemTag()) {
      throw new Error('Cannot modify system tag');
    }
    if (!name || name.trim() === '') {
      throw new Error('Tag name cannot be empty');
    }
    this._name = name.trim();
  }

  updateDescription(description: string): void {
    if (this.isSystemTag()) {
      throw new Error('Cannot modify system tag');
    }
    this._description = description?.trim() ?? '';
  }

  updateIcon(icon: string): void {
    if (this.isSystemTag()) {
      throw new Error('Cannot modify system tag');
    }
    this._icon = icon;
  }

  updateColor(color: string): void {
    if (this.isSystemTag()) {
      throw new Error('Cannot modify system tag');
    }
    this._color = color;
  }

  updateDefaultCapacity(capacity: number): void {
    if (capacity <= 0) {
      throw new Error('Default capacity must be positive');
    }
    this._defaultCapacity = capacity;
  }

  toData(): {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    defaultCapacity: number;
  } {
    return {
      id: this._id.toString(),
      name: this._name,
      description: this._description,
      icon: this._icon,
      color: this._color,
      defaultCapacity: this._defaultCapacity,
    };
  }
}
