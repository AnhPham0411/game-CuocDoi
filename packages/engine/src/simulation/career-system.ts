import { Career, CharacterState, EducationLevel } from '@life/schema';

const EDUCATION_HIERARCHY: Record<EducationLevel, number> = {
  none: 0,
  primary: 1,
  middle_school: 2,
  high_school: 3,
  vocational: 4,
  bachelor: 5,
  master: 6,
  doctorate: 7,
};

export const INITIAL_CAREERS_POOL: Career[] = [
  // Entry / Service level
  {
    id: 'career_retail_worker',
    title: 'Retail Associate',
    description: 'Working in retail store, assisting customers.',
    category: 'service',
    requiredEducation: 'none',
    requiredSkills: [],
    salaryRange: [400, 700],
    stress: 25,
    prestige: 15,
    stability: 60,
    socialExposure: 70,
    promotions: ['career_store_manager'],
  },
  {
    id: 'career_food_service',
    title: 'Barista / Server',
    description: 'Serving food and coffee in local cafes.',
    category: 'service',
    requiredEducation: 'none',
    requiredSkills: [],
    salaryRange: [450, 750],
    stress: 30,
    prestige: 20,
    stability: 55,
    socialExposure: 80,
    promotions: ['career_restaurant_manager'],
  },
  {
    id: 'career_freelance_art',
    title: 'Freelance Illustrator',
    description: 'Creating artwork and commissions for clients online.',
    category: 'arts',
    requiredEducation: 'middle_school',
    requiredSkills: [{ skill: 'creativity', minValue: 30 }],
    salaryRange: [500, 1500],
    stress: 40,
    prestige: 40,
    stability: 30,
    socialExposure: 35,
    promotions: ['career_art_director'],
  },
  // Sales / Entrepreneurship branch (§16)
  {
    id: 'career_sales_rep',
    title: 'Sales Representative',
    description: 'Negotiating deals and closing contracts with clients.',
    category: 'sales',
    requiredEducation: 'high_school',
    requiredSkills: [{ skill: 'social', minValue: 40 }],
    salaryRange: [800, 2500],
    stress: 60,
    prestige: 45,
    stability: 50,
    socialExposure: 85,
    promotions: ['career_sales_director'],
  },
  {
    id: 'career_small_business',
    title: 'Small Business Owner',
    description: 'Founding and running your own startup or commercial shop.',
    category: 'business',
    requiredEducation: 'high_school',
    requiredSkills: [{ skill: 'social', minValue: 50 }],
    salaryRange: [1000, 4500],
    stress: 75,
    prestige: 60,
    stability: 40,
    socialExposure: 75,
    promotions: [],
  },
  // Engineering / Research / Medicine branch (§16)
  {
    id: 'career_software_engineer',
    title: 'Software Engineer',
    description: 'Designing, building, and maintaining software applications.',
    category: 'technology',
    requiredEducation: 'bachelor',
    requiredSkills: [{ skill: 'logic', minValue: 50 }],
    salaryRange: [1800, 4000],
    stress: 55,
    prestige: 75,
    stability: 80,
    socialExposure: 40,
    promotions: ['career_lead_architect'],
  },
  {
    id: 'career_academic_researcher',
    title: 'Scientific Researcher',
    description: 'Conducting academic research and publishing scientific papers.',
    category: 'science',
    requiredEducation: 'master',
    requiredSkills: [{ skill: 'logic', minValue: 60 }],
    salaryRange: [1500, 3200],
    stress: 65,
    prestige: 80,
    stability: 85,
    socialExposure: 45,
    promotions: ['career_university_professor'],
  },
  {
    id: 'career_medical_doctor',
    title: 'Resident Physician',
    description: 'Diagnosing patients and administering clinical medical treatments.',
    category: 'healthcare',
    requiredEducation: 'master',
    requiredSkills: [{ skill: 'empathy', minValue: 50 }],
    salaryRange: [2500, 6000],
    stress: 85,
    prestige: 95,
    stability: 95,
    socialExposure: 80,
    promotions: ['career_senior_surgeon'],
  },
  // Management
  {
    id: 'career_store_manager',
    title: 'Store Manager',
    description: 'Managing store daily operations, staff, and inventory.',
    category: 'management',
    requiredEducation: 'high_school',
    requiredSkills: [{ skill: 'social', minValue: 45 }],
    salaryRange: [1200, 2200],
    stress: 55,
    prestige: 50,
    stability: 70,
    socialExposure: 65,
    promotions: [],
  },
  {
    id: 'career_sales_director',
    title: 'Sales Director',
    description: 'Leading the regional sales organization and growth strategy.',
    category: 'sales',
    requiredEducation: 'high_school',
    requiredSkills: [{ skill: 'social', minValue: 65 }],
    salaryRange: [3000, 8000],
    stress: 70,
    prestige: 80,
    stability: 65,
    socialExposure: 90,
    promotions: [],
  },
];

export class CareerSystem {
  public static getAvailableCareers(
    state: CharacterState,
    pool: readonly Career[] = INITIAL_CAREERS_POOL
  ): Career[] {
    if (state.age < 16) return []; // Minimum working age

    const charEdRank = EDUCATION_HIERARCHY[state.education.level] ?? 0;

    return pool.filter((career) => {
      // 1. Check education requirement
      const reqEdRank = EDUCATION_HIERARCHY[career.requiredEducation] ?? 0;
      if (charEdRank < reqEdRank) return false;

      // 2. Check skill requirements
      for (const req of career.requiredSkills) {
        const charSkillVal = state.skills[req.skill] ?? 0;
        if (charSkillVal < req.minValue) return false;
      }

      return true;
    });
  }

  public static processTurnIncome(state: CharacterState, months: number = 3): {
    nextMoney: number;
    nextStress: number;
    incomeEarned: number;
  } {
    if (!state.career.currentJobId) {
      return {
        nextMoney: state.money,
        nextStress: state.stress,
        incomeEarned: 0,
      };
    }

    const monthlySalary = state.career.salary;
    const income = monthlySalary * months;
    const livingExpenses = Math.round(monthlySalary * 0.4 * months); // 40% living expenses
    const netSavings = income - livingExpenses;

    return {
      nextMoney: state.money + netSavings,
      nextStress: Math.min(100, state.stress + 1),
      incomeEarned: income,
    };
  }
}
