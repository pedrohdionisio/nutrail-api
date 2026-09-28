export type Macros = {
  calories: number;
  protein: number;
  carbohydrate: number;
  fat: number;
};

export function sumMacros(items: readonly Macros[]): Macros {
  const sum = (key: keyof Macros) =>
    Math.round(items.reduce((total, item) => total + item[key], 0) * 10) / 10;

  return {
    calories: Math.round(sum('calories')),
    protein: sum('protein'),
    carbohydrate: sum('carbohydrate'),
    fat: sum('fat'),
  };
}
