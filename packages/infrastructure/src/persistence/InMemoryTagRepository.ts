import { Tag, TagId, ITagRepository, TagProps } from '@checkmate/domain';

interface TagData {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  defaultCapacity: number;
}

/**
 * In-memory implementation of Tag repository
 */
export class InMemoryTagRepository implements ITagRepository {
  private tags: Map<string, TagData> = new Map();

  constructor(initialData?: TagData[]) {
    if (initialData) {
      for (const data of initialData) {
        this.tags.set(data.id, data);
      }
    }
  }

  async save(tag: Tag): Promise<void> {
    this.tags.set(tag.id.toString(), tag.toData());
  }

  async findById(id: TagId): Promise<Tag | null> {
    const data = this.tags.get(id.toString());
    if (!data) return null;
    return this.hydrate(data);
  }

  async findByName(name: string): Promise<Tag | null> {
    const data = Array.from(this.tags.values()).find(
      (t) => t.name.toLowerCase() === name.toLowerCase()
    );
    if (!data) return null;
    return this.hydrate(data);
  }

  async findAll(): Promise<Tag[]> {
    return Array.from(this.tags.values()).map((d) => this.hydrate(d));
  }

  async delete(id: TagId): Promise<void> {
    this.tags.delete(id.toString());
  }

  getAllData(): TagData[] {
    return Array.from(this.tags.values());
  }

  loadData(data: TagData[]): void {
    this.tags.clear();
    for (const d of data) {
      this.tags.set(d.id, d);
    }
  }

  private hydrate(data: TagData): Tag {
    const props: TagProps = {
      id: TagId.fromString(data.id),
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
      defaultCapacity: data.defaultCapacity,
    };

    return Tag.fromProps(props);
  }
}
