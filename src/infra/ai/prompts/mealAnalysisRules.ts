export const nutritionRules = `
# Nutrition
- Identify every food and drink as a separate item.
- Express quantity as a number plus a unit: "g" for solids, "ml" for liquids, or a countable unit such as "unit", "slice" or "tablespoon" when that is how the food is naturally measured (translated to the output language).
- Calories and macronutrients must correspond to the stated quantity of that item, not to 100 g. Base them on standard food composition data (TACO/USDA), considering the preparation (fried, grilled, with sugar, etc.).
- Calories are whole numbers. Protein, carbohydrate and fat are grams with at most one decimal place.
`.trim();

export const mealNameRules = `
# Meal name
The meal name is the type of meal, never a list of foods.
1. If the user explicitly says which meal it was (for example "almocei", "no jantar", "for breakfast", "de lanche"), use that meal type, even if it does not match the local time.
2. Otherwise, choose the meal type from the local time:
   - 05:00–10:29: breakfast ("Café da manhã")
   - 10:30–11:29: morning snack ("Lanche da manhã")
   - 11:30–14:59: lunch ("Almoço")
   - 15:00–18:29: afternoon snack ("Lanche da tarde")
   - 18:30–21:59: dinner ("Jantar")
   - 22:00–04:59: late-night snack ("Ceia")
`.trim();
