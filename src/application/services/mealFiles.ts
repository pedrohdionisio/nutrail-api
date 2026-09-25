export const MAX_MEAL_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const MEAL_FILES = {
  PICTURE: { folder: 'pictures', extension: 'jpg', contentType: 'image/jpeg' },
  AUDIO: { folder: 'inputs', extension: 'm4a', contentType: 'audio/m4a' },
};

export type MealFileType = keyof typeof MEAL_FILES;

export function mealFileKey(
  type: MealFileType,
  userId: string,
  mealId: string,
): string {
  const { folder, extension } = MEAL_FILES[type];

  return `${folder}/${userId}/${mealId}.${extension}`;
}
