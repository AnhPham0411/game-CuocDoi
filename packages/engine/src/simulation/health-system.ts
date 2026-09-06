import { CharacterState } from '@life/schema';

export interface HealthUpdateResult {
  nextHealth: number;
  nextStress: number;
  isAlive: boolean;
  causeOfDeath?: string | undefined;
}

export class HealthSystem {
  public static updateTurn(state: CharacterState, months: number = 3): HealthUpdateResult {
    let health = state.health;
    let stress = state.stress;

    // High stress degrades physical health over time
    if (stress > 80) {
      health -= 2;
    } else if (stress > 60) {
      health -= 1;
    } else if (stress < 30 && health < 90) {
      health += 1; // Good rest aids recovery
    }

    // Age-related health decay (§25)
    if (state.age > 50) {
      const agePenalty = (state.age - 50) * 0.05 * (months / 12);
      health -= agePenalty;
    }

    // Stress decay / equilibrium
    if (stress > 20) {
      stress = Math.max(10, stress - 2);
    }

    health = Math.max(0, Math.min(100, Math.round(health)));
    stress = Math.max(0, Math.min(100, Math.round(stress)));

    // Death check
    const isAlive = health > 0 && state.age < Math.round(85 * state.lifeExpectancyFactor);
    let causeOfDeath: string | undefined;

    if (!isAlive) {
      if (health <= 0) {
        causeOfDeath = stress > 80 ? 'Heart failure from severe chronic stress' : 'Severe illness';
      } else {
        causeOfDeath = 'Old age, passed away peacefully';
      }
    }

    return {
      nextHealth: health,
      nextStress: stress,
      isAlive,
      causeOfDeath,
    };
  }
}
