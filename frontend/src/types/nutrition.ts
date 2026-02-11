export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface NutritionRecord {
  nutritionId: string;
  userId: string;
  memberId?: string;
  recordDate: string;
  mealType: MealType;
  foodItems: FoodItem[];
  totalCalories: number;
  notes?: string;
  createdAt: string;
}
