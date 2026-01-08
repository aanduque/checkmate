/**
 * Tag - Category for organizing tasks
 * Entity: Has identity, mutable state
 *
 * Special "Untagged" tag (id='untagged') cannot be modified or deleted
 */

export interface TagObject {
  id: string;
  name: string;
  icon: string;
  color: string;
  defaultCapacity: number;
}

export class Tag {
  private constructor(
    private readonly _id: string,
    private readonly _name: string,
    private readonly _icon: string,
    private readonly _color: string,
    private readonly _defaultCapacity: number
  ) {}

  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get icon(): string { return this._icon; }
  get color(): string { return this._color; }
  get defaultCapacity(): number { return this._defaultCapacity; }

  /**
   * Create a new tag
   */
  static create(props: {
    name: string;
    icon: string;
    color: string;
    defaultCapacity: number;
  }): Tag {
    const trimmedName = props.name.trim();
    if (!trimmedName) {
      throw new Error('Tag name cannot be empty');
    }

    if (props.defaultCapacity <= 0) {
      throw new Error('Default capacity must be greater than 0');
    }

    return new Tag(
      Tag.generateId(),
      trimmedName,
      props.icon,
      props.color,
      props.defaultCapacity
    );
  }

  /**
   * Create the special Untagged tag
   */
  static createUntagged(): Tag {
    return new Tag(
      'untagged',
      'Untagged',
      '📦',
      '#6b7280',
      10
    );
  }

  /**
   * Check if this is the special Untagged tag
   */
  isUntagged(): boolean {
    return this._id === 'untagged';
  }

  /**
   * Update the tag name
   */
  updateName(name: string): Tag {
    this.ensureModifiable();
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Tag name cannot be empty');
    }

    return new Tag(this._id, trimmed, this._icon, this._color, this._defaultCapacity);
  }

  /**
   * Update the tag icon
   */
  updateIcon(icon: string): Tag {
    this.ensureModifiable();
    return new Tag(this._id, this._name, icon, this._color, this._defaultCapacity);
  }

  /**
   * Update the tag color
   */
  updateColor(color: string): Tag {
    this.ensureModifiable();
    return new Tag(this._id, this._name, this._icon, color, this._defaultCapacity);
  }

  /**
   * Update the default capacity
   */
  updateDefaultCapacity(capacity: number): Tag {
    this.ensureModifiable();
    if (capacity <= 0) {
      throw new Error('Default capacity must be greater than 0');
    }

    return new Tag(this._id, this._name, this._icon, this._color, capacity);
  }

  private ensureModifiable(): void {
    if (this.isUntagged()) {
      throw new Error('Cannot modify the Untagged tag');
    }
  }

  /**
   * Recreate from a plain object
   */
  static fromObject(obj: TagObject): Tag {
    return new Tag(
      obj.id,
      obj.name,
      obj.icon,
      obj.color,
      obj.defaultCapacity
    );
  }

  /**
   * Serialize to a plain object
   */
  toObject(): TagObject {
    return {
      id: this._id,
      name: this._name,
      icon: this._icon,
      color: this._color,
      defaultCapacity: this._defaultCapacity
    };
  }

  private static generateId(): string {
    return `tag_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}_${Date.now()}`;
  }
}
