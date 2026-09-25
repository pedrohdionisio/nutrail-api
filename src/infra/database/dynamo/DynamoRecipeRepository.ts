import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import type { RecipeRepository } from '@/application/ports/RecipeRepository';
import type { Recipe } from '@/domain/entities/Recipe';
import { Injectable } from '@/kernel/decorators/Injectable';
import { AppConfig } from '@/shared/config/AppConfig';

@Injectable()
export class DynamoRecipeRepository implements RecipeRepository {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly config: AppConfig,
  ) {}

  async create(recipe: Recipe): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.config.tableName,
        Item: {
          PK: `USER#${recipe.userId}`,
          SK: `RECIPE#${recipe.id}`,
          id: recipe.id,
          name: recipe.name,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          calories: recipe.calories,
          protein: recipe.protein,
          carbohydrate: recipe.carbohydrate,
          fat: recipe.fat,
          createdAt: recipe.createdAt,
        },
        ConditionExpression: 'attribute_not_exists(PK)',
      }),
    );
  }

  async delete(userId: string, recipeId: string): Promise<boolean> {
    const { Attributes } = await this.client.send(
      new DeleteCommand({
        TableName: this.config.tableName,
        Key: { PK: `USER#${userId}`, SK: `RECIPE#${recipeId}` },
        ReturnValues: 'ALL_OLD',
      }),
    );

    return Attributes !== undefined;
  }
}
