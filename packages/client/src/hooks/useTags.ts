import { useStore } from 'statux';
import { useCallback } from 'react';
import { api } from '../services/rpcClient';
import type { Tag } from '../store';

export function useTags() {
  const [tags, setTags] = useStore<Tag[]>('tags');

  const refreshTags = useCallback(async () => {
    const result = await api.tags.getAll();
    setTags(result.tags);
  }, [setTags]);

  const createTag = useCallback(
    async (params: {
      name: string;
      color: string;
      icon?: string;
      defaultCapacity?: number;
    }) => {
      const result = await api.tags.create({
        name: params.name,
        icon: params.icon || '🏷️',
        color: params.color,
        defaultCapacity: params.defaultCapacity || 21,
      });
      setTags((prev: Tag[]) => [...prev, result.tag]);
      return result.tag;
    },
    [setTags]
  );

  const updateTag = useCallback(
    async (
      tagId: string,
      params: {
        name?: string;
        color?: string;
        icon?: string;
        defaultCapacity?: number;
      }
    ) => {
      const result = await api.tags.update({
        tagId,
        ...params,
      });
      setTags((prev: Tag[]) =>
        prev.map((t) => (t.id === tagId ? result.tag : t))
      );
      return result.tag;
    },
    [setTags]
  );

  const deleteTag = useCallback(
    async (tagId: string) => {
      await api.tags.delete(tagId);
      setTags((prev: Tag[]) => prev.filter((t) => t.id !== tagId));
    },
    [setTags]
  );

  const getTagById = useCallback(
    (tagId: string) => tags.find((t) => t.id === tagId),
    [tags]
  );

  return {
    tags,
    refreshTags,
    createTag,
    updateTag,
    deleteTag,
    getTagById,
  };
}
