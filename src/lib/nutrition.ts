/**
 * NutriGuide nutrition engine (pure, framework-free).
 *
 * - Calorie calculations: BMI, Mifflin-St Jeor BMR, TDEE, goal calories.
 * - Rule-based recommendation engine with transparent scoring.
 * - Meal plan generator that respects diet type, allergies, goal and calorie target.
 *
 * Kept as an isolated module so the rule-based scorer can later be swapped
 * for (or blended with) a machine-learning model without touching the UI.
 */

export type Gender = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "very" | "extreme";
export type Goal = "lose" | "maintain" | "gain";
export type DietType = "vegetarian" | "non_vegetarian" | "vegan" | "eggetarian";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface Food {
  id: string;
  name: string;
  category: string;
  serving_size: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  diet_type: DietType;
  allergens: string[];
  meal_types: string[];
  image: string;
}

export interface HealthProfile {
  age: number;
  gender: Gender;
  height: number;
  weight: number;
  activity_level: ActivityLevel;
  goal: Goal;
  diet_type: DietType;
  allergies: string[];
}

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extreme: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary",
  light: "Lightly Active",
  moderate: "Moderately Active",
  very: "Very Active",
  extreme: "Extremely Active",
};

export const GOAL_LABELS: Record<Goal, string> = {
  lose: "Lose Weight",
  maintain: "Maintain Weight",
  gain: "Gain Weight",
};

export const DIET_LABELS: Record<DietType, string> = {
  vegetarian: "Vegetarian",
  non_vegetarian: "Non-Vegetarian",
  vegan: "Vegan",
  eggetarian: "Eggetarian",
};

export const ALLERGENS: { value: string; label: string }[] = [
  { value: "dairy", label: "Milk/Dairy" },
  { value: "egg", label: "Egg" },
  { value: "peanut", label: "Peanut" },
  { value: "tree_nuts", label: "Tree Nuts" },
  { value: "soy", label: "Soy" },
  { value: "gluten", label: "Gluten" },
  { value: "fish", label: "Fish" },
  { value: "shellfish", label: "Shellfish" },
  { value: "sesame", label: "Sesame" },
];

export const allergenLabel = (v: string) => ALLERGENS.find((a) => a.value === v)?.label ?? v;

export const MEAL_SPLIT: Record<MealType, number> = {
  breakfast: 0.25,
  lunch: 0.35,
  snack: 0.1,
  dinner: 0.3,
};

/* ------------------------------------------------------------------ */
/* Calorie calculations                                                */
/* ------------------------------------------------------------------ */

export function calcBMI(weightKg: number, heightCm: number) {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiCategory(bmi: number): "Underweight" | "Normal" | "Overweight" | "Obese" {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export function calcBMR(p: Pick<HealthProfile, "weight" | "height" | "age" | "gender">) {
  const base = 10 * p.weight + 6.25 * p.height - 5 * p.age;
  return p.gender === "male" ? base + 5 : base - 161;
}

export function calcTDEE(bmr: number, activity: ActivityLevel) {
  return bmr * ACTIVITY_FACTORS[activity];
}

export function goalCalories(tdee: number, goal: Goal) {
  if (goal === "lose") return tdee - 500;
  if (goal === "gain") return tdee + 300;
  return tdee;
}

export function calculateAll(
  p: Pick<HealthProfile, "weight" | "height" | "age" | "gender" | "activity_level" | "goal">,
) {
  const bmi = calcBMI(p.weight, p.height);
  const bmr = calcBMR(p);
  const tdee = calcTDEE(bmr, p.activity_level);
  // Never recommend an intake below a basic safety floor.
  const floor = p.gender === "male" ? 1500 : 1200;
  const target = Math.max(goalCalories(tdee, p.goal), floor);
  return {
    bmi: round(bmi, 1),
    bmiCategory: bmiCategory(bmi),
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    target: Math.round(target),
  };
}

export function isCompleteProfile(p: Partial<HealthProfile> | null | undefined): p is HealthProfile {
  return !!(
    p &&
    p.age &&
    p.gender &&
    p.height &&
    p.weight &&
    p.activity_level &&
    p.goal &&
    p.diet_type
  );
}

/* ------------------------------------------------------------------ */
/* Hard filters                                                        */
/* ------------------------------------------------------------------ */

const DIET_ALLOWED: Record<DietType, DietType[]> = {
  vegan: ["vegan"],
  vegetarian: ["vegan", "vegetarian"],
  eggetarian: ["vegan", "vegetarian", "eggetarian"],
  non_vegetarian: ["vegan", "vegetarian", "eggetarian", "non_vegetarian"],
};

export function isDietCompatible(food: Pick<Food, "diet_type">, diet: DietType) {
  return DIET_ALLOWED[diet].includes(food.diet_type);
}

/** Strict exclusion: any overlap between food allergens and user allergies removes the food. */
export function isAllergySafe(food: Pick<Food, "allergens">, allergies: string[]) {
  return !food.allergens.some((a) => allergies.includes(a));
}

export function safeFoods(foods: Food[], profile: Pick<HealthProfile, "diet_type" | "allergies">) {
  return foods.filter(
    (f) => isDietCompatible(f, profile.diet_type) && isAllergySafe(f, profile.allergies),
  );
}

/* ------------------------------------------------------------------ */
/* Recommendation scoring                                              */
/* ------------------------------------------------------------------ */

export interface ScoreBreakdown {
  diet: number; // 0-20
  allergy: number; // 0-20
  goal: number; // 0-25
  protein: number; // 0-20
  calorie: number; // 0-15
}

export interface Recommendation {
  food: Food;
  score: number;
  breakdown: ScoreBreakdown;
  reasons: string[];
  tags: string[];
}

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const round = (v: number, d = 0) => Math.round(v * 10 ** d) / 10 ** d;

export const isHighProtein = (f: Food) => f.protein >= 10 || (f.calories > 0 && (f.protein * 4) / f.calories >= 0.25);
export const isLowCalorie = (f: Food) => f.calories <= 120;
export const isHighFiber = (f: Food) => f.fiber >= 4;

export function scoreFood(food: Food, profile: HealthProfile, targetCalories: number): Recommendation {
  const kcal = Math.max(food.calories, 1);
  const proteinShare = (food.protein * 4) / kcal; // fraction of energy from protein
  const fiberPer100 = (food.fiber / kcal) * 100;
  const isProduce = food.category === "Fruits" || food.category === "Vegetables";
  const isHealthyFat = food.category === "Nuts" || food.category === "Seeds" || food.name === "Avocado";
  const reasons: string[] = [];

  // Goal suitability (0-25)
  let goal = 0;
  if (profile.goal === "lose") {
    goal = clamp(1 - kcal / 400) * 10 + clamp(fiberPer100 / 4) * 8 + (isProduce ? 7 : 0);
    if (kcal <= 150) reasons.push("low in calories");
    if (isHighFiber(food)) reasons.push("high in fiber, which helps you feel full");
    if (isProduce) reasons.push("a nutrient-rich fruit/vegetable choice");
  } else if (profile.goal === "gain") {
    goal = clamp(kcal / 350) * 12 + (isHealthyFat ? 6 : 0) + clamp(food.protein / 25) * 7;
    if (kcal >= 250) reasons.push("energy-dense to support weight gain");
    if (isHealthyFat) reasons.push("a source of healthy fats");
  } else {
    const c = (food.carbohydrates * 4) / kcal;
    const f = (food.fat * 9) / kcal;
    const dev = Math.abs(c - 0.5) + Math.abs(proteinShare - 0.2) + Math.abs(f - 0.3);
    goal = clamp(1 - dev / 1.2) * 18 + (isProduce || food.category === "Legumes" ? 7 : 0);
    if (dev < 0.5) reasons.push("well-balanced in carbs, protein and fat");
  }
  goal = Math.min(25, goal);

  // Protein suitability (0-20)
  const protein = clamp(proteinShare / 0.3) * 14 + clamp(food.protein / 20) * 6;
  if (isHighProtein(food)) reasons.unshift("high in protein");

  // Calorie suitability (0-15): portion share of daily target
  const share = kcal / targetCalories;
  let calorie: number;
  if (profile.goal === "gain") calorie = share >= 0.08 && share <= 0.3 ? 15 : share < 0.08 ? 15 * (share / 0.08) : 8;
  else if (profile.goal === "lose") calorie = share <= 0.15 ? 15 : Math.max(0, 15 - (share - 0.15) * 100);
  else calorie = share >= 0.04 && share <= 0.2 ? 15 : share < 0.04 ? 10 : Math.max(0, 15 - (share - 0.2) * 80);

  const breakdown: ScoreBreakdown = {
    diet: 20,
    allergy: 20,
    goal: round(goal, 1),
    protein: round(protein, 1),
    calorie: round(calorie, 1),
  };
  const score = Math.round(breakdown.diet + breakdown.allergy + breakdown.goal + breakdown.protein + breakdown.calorie);

  const dietWord = DIET_LABELS[profile.diet_type].toLowerCase();
  const head = reasons.length ? reasons.slice(0, 2).join(" and ") : "a sensible fit for your daily target";
  const allergyNote = profile.allergies.length ? " and free from your listed allergens" : "";
  const sentence = `Recommended because it is ${head}, suitable for your ${dietWord} diet${allergyNote}.`;

  const tags: string[] = [];
  if (isHighProtein(food)) tags.push("High Protein");
  if (isLowCalorie(food)) tags.push("Low Calorie");
  if (isHighFiber(food)) tags.push("High Fiber");

  return { food, score, breakdown, reasons: [sentence], tags };
}

export function recommend(foods: Food[], profile: HealthProfile, targetCalories: number) {
  return safeFoods(foods, profile)
    .map((f) => scoreFood(f, profile, targetCalories))
    .sort((a, b) => b.score - a.score || a.food.name.localeCompare(b.food.name));
}

/* ------------------------------------------------------------------ */
/* Meal plan generation                                                */
/* ------------------------------------------------------------------ */

export interface MealItem {
  foodId: string;
  name: string;
  category: string;
  image: string;
  servingSize: string;
  servings: number;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
}

export interface Meal {
  target: number;
  items: MealItem[];
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
}

export interface MealPlan {
  targetCalories: number;
  breakfast: Meal;
  lunch: Meal;
  snack: Meal;
  dinner: Meal;
  totalCalories: number;
  totalProtein: number;
  totalCarbohydrates: number;
  totalFat: number;
}

const PROTEIN_CATS = ["Legumes", "Meat", "Fish", "Eggs", "Dairy"];
const BASE_CATS = ["Grains", "Indian Dishes"];

/** Weighted random pick from the top-N highest scoring candidates. */
function pickWeighted(cands: Recommendation[], rand: () => number, topN = 8): Recommendation | undefined {
  const top = cands.slice(0, topN);
  if (!top.length) return undefined;
  const total = top.reduce((s, r) => s + r.score ** 2, 0);
  let x = rand() * total;
  for (const r of top) {
    x -= r.score ** 2;
    if (x <= 0) return r;
  }
  return top[top.length - 1];
}

function toItem(f: Food, servings: number): MealItem {
  return {
    foodId: f.id,
    name: f.name,
    category: f.category,
    image: f.image,
    servingSize: f.serving_size,
    servings,
    calories: round(f.calories * servings),
    protein: round(f.protein * servings, 1),
    carbohydrates: round(f.carbohydrates * servings, 1),
    fat: round(f.fat * servings, 1),
  };
}

function summarize(target: number, items: MealItem[]): Meal {
  const sum = (k: keyof Pick<MealItem, "calories" | "protein" | "carbohydrates" | "fat">) =>
    round(items.reduce((s, i) => s + i[k], 0), 1);
  return { target, items, calories: Math.round(sum("calories")), protein: sum("protein"), carbohydrates: sum("carbohydrates"), fat: sum("fat") };
}

function buildMeal(
  meal: MealType,
  budget: number,
  ranked: Recommendation[],
  used: Set<string>,
  rand: () => number,
): Meal {
  const pool = ranked.filter((r) => r.food.meal_types.includes(meal) && !used.has(r.food.id));
  const chosen: { food: Food; servings: number }[] = [];
  const total = () => chosen.reduce((s, c) => s + c.food.calories * c.servings, 0);
  const take = (filter: (r: Recommendation) => boolean, maxShare = 1) => {
    const remaining = budget - total();
    const c = pool.filter(
      (r) => filter(r) && !chosen.some((x) => x.food.id === r.food.id) && r.food.calories <= Math.max(remaining * maxShare, 60),
    );
    const pick = pickWeighted(c, rand);
    if (pick) chosen.push({ food: pick.food, servings: 1 });
    return pick;
  };

  if (meal === "lunch" || meal === "dinner") {
    take((r) => BASE_CATS.includes(r.food.category) && r.food.carbohydrates >= 15, 0.6);
    take((r) => PROTEIN_CATS.includes(r.food.category), 0.7);
    take((r) => r.food.category === "Vegetables");
  } else if (meal === "breakfast") {
    take((r) => !["Fruits", "Beverages", "Seeds", "Nuts"].includes(r.food.category), 0.8);
    take((r) => ["Fruits", "Dairy", "Eggs", "Beverages"].includes(r.food.category));
  } else {
    take(() => true, 1);
  }

  // Top up with extra items while we are clearly under budget.
  for (let i = 0; i < 3 && total() < budget * 0.8; i++) {
    if (!take(() => true, 1)) break;
  }

  // Fine-tune portions in half-serving steps to approach the budget (max 2.5x).
  for (let guard = 0; guard < 12 && chosen.length; guard++) {
    const gap = budget - total();
    if (Math.abs(gap) <= budget * 0.08) break;
    const candidates = chosen.filter((c) => (gap > 0 ? c.servings < 2.5 : c.servings > 0.5));
    if (!candidates.length) break;
    const target = candidates.reduce((a, b) => (b.food.calories > a.food.calories ? b : a));
    const delta = target.food.calories * 0.5;
    if (gap > 0 && delta > gap * 1.6) break;
    if (gap < 0 && delta > -gap * 1.6 && total() - delta < budget * 0.85) break;
    target.servings += gap > 0 ? 0.5 : -0.5;
  }

  chosen.forEach((c) => used.add(c.food.id));
  return summarize(Math.round(budget), chosen.map((c) => toItem(c.food, c.servings)));
}

export function generateMealPlan(
  foods: Food[],
  profile: HealthProfile,
  targetCalories: number,
  rand: () => number = Math.random,
): MealPlan {
  const ranked = recommend(foods, profile, targetCalories);
  const used = new Set<string>();
  const meals = {} as Record<MealType, Meal>;
  for (const m of ["breakfast", "lunch", "snack", "dinner"] as MealType[]) {
    meals[m] = buildMeal(m, targetCalories * MEAL_SPLIT[m], ranked, used, rand);
  }
  const all = Object.values(meals);
  return {
    targetCalories: Math.round(targetCalories),
    ...meals,
    totalCalories: Math.round(all.reduce((s, m) => s + m.calories, 0)),
    totalProtein: round(all.reduce((s, m) => s + m.protein, 0), 1),
    totalCarbohydrates: round(all.reduce((s, m) => s + m.carbohydrates, 0), 1),
    totalFat: round(all.reduce((s, m) => s + m.fat, 0), 1),
  };
}
