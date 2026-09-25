export type MealProcessingMessage = {
  userId: string;
  mealId: string;
};

export abstract class MealProcessingQueue {
  abstract publish(message: MealProcessingMessage): Promise<void>;
}
