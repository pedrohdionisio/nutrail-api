import type { RecipeContent } from '@/domain/entities/Recipe';
import type { Goal } from '@/domain/entities/User';
import type { Language } from '@/domain/value-objects/Language';
import type { Macros } from '@/domain/value-objects/Macros';

export abstract class RecipeGenerator {
  abstract generate(input: {
    text: string;
    goal: Goal;
    remaining: Macros;
    language: Language;
  }): Promise<RecipeContent>;
}
