import { CharacterState } from '@life/schema';

export type LifeStage =
  | 'early_childhood' // 0-5
  | 'childhood'       // 6-11
  | 'adolescence'     // 12-17
  | 'young_adult'     // 18-25
  | 'adult'           // 26-40
  | 'middle_age'      // 41-60
  | 'old_age';        // 61+

export interface AdvanceResult {
  nextState: CharacterState;
  monthsAdvanced: number;
  celebratedBirthday: boolean;
  newAge: number;
  lifeStage: LifeStage;
  stageChanged: boolean;
}

export class GameClock {
  public static getLifeStage(age: number): LifeStage {
    if (age <= 5) return 'early_childhood';
    if (age <= 11) return 'childhood';
    if (age <= 17) return 'adolescence';
    if (age <= 25) return 'young_adult';
    if (age <= 40) return 'adult';
    if (age <= 60) return 'middle_age';
    return 'old_age';
  }

  /**
   * Advances the game clock by a given number of months (default 3 to 6 months per decision turn)
   */
  public static advance(state: CharacterState, months: number = 3): AdvanceResult {
    const prevAge = state.age;
    const prevStage = this.getLifeStage(prevAge);

    const totalMonths = state.age * 12 + state.ageMonths + months;
    const newAge = Math.floor(totalMonths / 12);
    const newAgeMonths = totalMonths % 12;

    const celebratedBirthday = newAge > prevAge;
    const newStage = this.getLifeStage(newAge);
    const stageChanged = newStage !== prevStage;

    const nextState: CharacterState = {
      ...state,
      age: newAge,
      ageMonths: newAgeMonths,
    };

    return {
      nextState,
      monthsAdvanced: months,
      celebratedBirthday,
      newAge,
      lifeStage: newStage,
      stageChanged,
    };
  }
}
