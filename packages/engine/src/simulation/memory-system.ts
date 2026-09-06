import { Memory, MemoryType } from '@life/schema';

export class MemorySystem {
  public static findByTag(memories: readonly Memory[], tag: string): Memory[] {
    return memories.filter((m) => m.tags.includes(tag));
  }

  public static findByParticipant(memories: readonly Memory[], npcId: string): Memory[] {
    return memories.filter((m) => m.participants.includes(npcId));
  }

  public static findByType(memories: readonly Memory[], type: MemoryType): Memory[] {
    return memories.filter((m) => m.type === type);
  }

  public static compressIfExceedsLimit(memories: readonly Memory[], limit: number = 500): Memory[] {
    if (memories.length <= limit) return [...memories];

    const copy = [...memories];
    copy.sort((a, b) => b.importance - a.importance); // Highest importance first

    // Keep top `limit - 1` memories, compress the rest into a summary
    const kept = copy.slice(0, limit - 1);
    const pruned = copy.slice(limit - 1);

    const allPrunedTags = Array.from(new Set(pruned.flatMap((m) => m.tags)));
    const summaryMemory: Memory = {
      id: `mem_summary_archive_${Date.now()}`,
      timestamp: { year: 2000, month: 1, day: 1 },
      age: kept[kept.length - 1]?.age ?? 0,
      type: 'misc',
      participants: [],
      emotionalWeight: 0,
      importance: 20,
      tags: allPrunedTags,
      sourceEventId: 'evt_system_archive',
      description: 'Faded memories from earlier in life.',
    };

    kept.push(summaryMemory);
    return kept;
  }
}
