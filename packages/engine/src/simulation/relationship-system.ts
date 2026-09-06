import { RelationshipState } from '@life/schema';

export class RelationshipSystem {
  /**
   * Applies natural drift to relationships over time (§7, §E7)
   * Relationships with low interactionFrequency gently drift toward neutrality.
   */
  public static updateDrift(relationships: readonly RelationshipState[]): RelationshipState[] {
    return relationships.map((rel) => {
      // Tier 4 does not drift (ephemeral)
      if (rel.tier === 4) return rel;

      let { closeness, trust, respect, conflict, dependence, interactionFrequency } = rel;

      // Interaction frequency decays over turns if not actively engaged
      interactionFrequency = Math.max(0, interactionFrequency - 5);

      if (interactionFrequency < 30) {
        // Drift closeness slowly toward 30
        if (closeness > 30) closeness = Math.max(30, closeness - 2);
        else if (closeness < 30) closeness = Math.min(30, closeness + 1);

        // Conflict slowly cools down toward 0
        if (conflict > 0) conflict = Math.max(0, conflict - 3);

        // Dependence slowly decreases
        if (dependence > 20) dependence = Math.max(20, dependence - 2);
      }

      return {
        ...rel,
        closeness,
        trust,
        respect,
        conflict,
        dependence,
        interactionFrequency,
      };
    });
  }

  /**
   * Enforces quota constraints (§43, §44)
   * - closeFriends <= 8
   * - activeRelationships <= 100
   */
  public static enforceQuotas(relationships: readonly RelationshipState[]): RelationshipState[] {
    const list = [...relationships];

    // Filter tier 1 & 2 for close friends count
    const closeFriends = list.filter((r) => r.relationshipType === 'friend' && r.closeness >= 75);
    if (closeFriends.length > 8) {
      // Demote lowest closeness friend to regular tier 3
      closeFriends.sort((a, b) => a.closeness - b.closeness);
      const toDemote = closeFriends[0];
      if (toDemote) {
        const idx = list.findIndex((r) => r.npcId === toDemote.npcId);
        if (idx >= 0) {
          list[idx] = { ...toDemote, tier: 3 };
        }
      }
    }

    // Active relationships cap at 100
    const active = list.filter((r) => r.tier <= 3);
    if (active.length > 100) {
      active.sort((a, b) => a.closeness + a.trust - (b.closeness + b.trust));
      const demoted = active[0];
      if (demoted) {
        const idx = list.findIndex((r) => r.npcId === demoted.npcId);
        if (idx >= 0) {
          list[idx] = { ...demoted, tier: 4 }; // Demote to tier 4
        }
      }
    }

    return list;
  }
}
