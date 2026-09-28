import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import type { RecipeRepository } from '@/application/ports/RecipeRepository';
import { Recipe } from '@/domain/entities/Recipe';
import { Injectable } from '@/kernel/decorators/Injectable';
import { AppConfig } from '@/shared/config/AppConfig';

@Injectable()
export class DynamoRecipeRepository implements RecipeRepository {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly config: AppConfig,
  ) {}

  async findById(userId: string, recipeId: string): Promise<Recipe | null> {
    const { Item } = await this.client.send(
      new GetCommand({
        TableName: this.config.tableName,
        Key: { PK: `USER#${userId}`, SK: `RECIPE#${recipeId}` },
      }),
    );

    if (!Item) return null;

    return new Recipe({
      id: Item.id,
      userId,
      name: Item.name,
      ingredients: Item.ingredients,
      instructions: Item.instructions,
      calories: Item.calories,
      protein: Item.protein,
      carbohydrate: Item.carbohydrate,
      fat: Item.fat,
      createdAt: Item.createdAt,
    });
  }

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
