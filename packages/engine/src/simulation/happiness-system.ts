import { CharacterState } from '@life/schema';

export class HappinessSystem {
  /**
   * Calculates next happiness using the inertia smoothing formula from blueprint §26:
   * happiness[t+1] = happiness[t] * 0.8 + recentEvents * 0.1 + relationships * 0.05 + financialSecurity * 0.05
   */
  public static calculateNextHappiness(
    state: CharacterState,
    recentEventDelta: number = 0
  ): number {
    const currentHappiness = state.happiness;

    // Calculate relationship factor: average closeness & trust of active relationships
    let relScore = 50;
    if (state.relationships.length > 0) {
      const topRels = state.relationships.slice(0, 5);
      const total = topRels.reduce((sum, r) => sum + (r.closeness + r.trust) / 2, 0);
      relScore = total / topRels.length;
    }

    // Calculate financial security factor
    let financeScore = 50;
    if (state.money < 0) financeScore = 15;
    else if (state.money < 1000) financeScore = 40;
    else if (state.money < 10000) financeScore = 65;
    else financeScore = 85;

    // Stress dampener
    const stressPenalty = (state.stress / 100) * 15;

    const rawNext =
      currentHappiness * 0.8 +
      (50 + recentEventDelta) * 0.1 +
      relScore * 0.05 +
      financeScore * 0.05 -
      stressPenalty;

    return Math.max(0, Math.min(100, Math.round(rawNext)));
  }
}
