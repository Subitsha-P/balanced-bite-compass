import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  calculateAll,
  generateMealPlan,
  isCompleteProfile,
  recommend,
  type Food,
  type HealthProfile,
} from "./nutrition";
import { ageInMonths, normalizeRecipe, recommendBabyRecipes, recommendRecipes, type Recipe } from "./recipes";

/* Helpers ------------------------------------------------------------ */

type Ctx = { supabase: any; userId: string };

async function loadProfileAndFoods({ supabase, userId }: Ctx) {
  const [{ data: profile, error: pErr }, { data: foods, error: fErr }] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("foods").select("*"),
  ]);
  if (pErr || fErr) throw new Error("Could not load data from the database. Please try again.");
  if (!isCompleteProfile(profile)) {
    throw new Error("PROFILE_INCOMPLETE: Please complete your health profile first.");
  }
  const p: HealthProfile = {
    age: Number(profile.age),
    gender: profile.gender,
    height: Number(profile.height),
    weight: Number(profile.weight),
    activity_level: profile.activity_level,
    goal: profile.goal,
    diet_type: profile.diet_type,
    allergies: profile.allergies ?? [],
    conditions: profile.health_conditions ?? [],
  };
  const list: Food[] = (foods ?? []).map((f: any) => ({
    ...f,
    calories: Number(f.calories),
    protein: Number(f.protein),
    carbohydrates: Number(f.carbohydrates),
    fat: Number(f.fat),
    fiber: Number(f.fiber),
    sugar: Number(f.sugar),
  }));
  return { profile: p, foods: list, calc: calculateAll(p), likedRecipeIds: (profile.liked_recipe_ids ?? []) as string[] };
}

async function loadRecipes(supabase: any, audience?: "adult" | "baby"): Promise<Recipe[]> {
  let q = supabase.from("recipes").select("*");
  if (audience) q = q.eq("audience", audience);
  const { data, error } = await q;
  if (error) throw new Error("Could not load recipes. Please try again.");
  return (data ?? []).map(normalizeRecipe);
}

/* Recommendations ---------------------------------------------------- */

export const getRecommendations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { limit?: number } | undefined) =>
    z.object({ limit: z.number().int().min(1).max(200).optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { profile, foods, calc } = await loadProfileAndFoods(context as Ctx);
    const recs = recommend(foods, profile, calc.target);
    return {
      calc,
      profile,
      excludedCount: foods.length - recs.length,
      totalFoods: foods.length,
      recommendations: recs.slice(0, data.limit ?? 200),
    };
  });

/* Meal plans --------------------------------------------------------- */

export const generatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { profile, foods, calc } = await loadProfileAndFoods(context as Ctx);
    const plan = generateMealPlan(foods, profile, calc.target);
    const empty = [plan.breakfast, plan.lunch, plan.snack, plan.dinner].every((m) => m.items.length === 0);
    if (empty) throw new Error("NO_PLAN: No foods match your current dietary restrictions.");
    return { plan, calc, profile };
  });

const itemSchema = z.object({
  foodId: z.string().uuid(),
  name: z.string().max(120),
  category: z.string().max(40),
  image: z.string().max(40),
  servingSize: z.string().max(60),
  servings: z.number().min(0.5).max(5),
  calories: z.number().min(0).max(5000),
  protein: z.number().min(0).max(500),
  carbohydrates: z.number().min(0).max(1000),
  fat: z.number().min(0).max(500),
});
const mealSchema = z.object({
  target: z.number().min(0).max(10000),
  items: z.array(itemSchema).max(12),
  calories: z.number(),
  protein: z.number(),
  carbohydrates: z.number(),
  fat: z.number(),
});
const planSchema = z.object({
  targetCalories: z.number().int().min(800).max(6000),
  breakfast: mealSchema,
  lunch: mealSchema,
  snack: mealSchema,
  dinner: mealSchema,
});

export const saveMealPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => planSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as Ctx;
    // Totals are recomputed on the server rather than trusted from the client.
    const meals = [data.breakfast, data.lunch, data.snack, data.dinner];
    const items = meals.flatMap((m) => m.items);
    const sum = (k: "calories" | "protein" | "carbohydrates" | "fat") =>
      Math.round(items.reduce((s, i) => s + i[k], 0) * 10) / 10;
    const { data: row, error } = await supabase
      .from("meal_plans")
      .insert({
        user_id: userId,
        target_calories: data.targetCalories,
        breakfast: data.breakfast,
        lunch: data.lunch,
        snack: data.snack,
        dinner: data.dinner,
        total_calories: Math.round(sum("calories")),
        total_protein: sum("protein"),
        total_carbohydrates: sum("carbohydrates"),
        total_fat: sum("fat"),
      })
      .select("id")
      .single();
    if (error) throw new Error("Could not save the meal plan. Please try again.");
    return { id: row.id as string };
  });

/* Recipe recommendations (basic / custom) ---------------------------- */

export const getRecipeRecommendations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { mode: "basic" | "custom" }) =>
    z.object({ mode: z.enum(["basic", "custom"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as Ctx;
    const [{ profile, calc, likedRecipeIds }, recipes] = await Promise.all([
      loadProfileAndFoods(ctx),
      loadRecipes(ctx.supabase, "adult"),
    ]);
    const res = recommendRecipes(
      recipes,
      { goal: profile.goal, diet_type: profile.diet_type, allergies: profile.allergies, conditions: profile.conditions ?? [], target: calc.target },
      data.mode,
      likedRecipeIds,
    );
    return {
      mode: data.mode,
      calc,
      profile,
      totalRecipes: recipes.length,
      needsLikes: res.needsLikes,
      liked: res.liked.map((r) => ({ id: r.id, slug: r.slug, name: r.name })),
      items: res.items.slice(0, 60),
      excluded: res.excluded.map((e) => ({ id: e.recipe.id, slug: e.recipe.slug, name: e.recipe.name, reasons: e.reasons })),
    };
  });

/* Baby Corner -------------------------------------------------------- */

export const getBabyRecommendations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { childId: string }) => z.object({ childId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context as Ctx;
    const { data: child, error } = await supabase.from("children").select("*").eq("id", data.childId).maybeSingle();
    if (error) throw new Error("Could not load the child profile.");
    if (!child) throw new Error("Child profile not found.");
    const recipes = await loadRecipes(supabase);
    const months = ageInMonths(child.birth_date);
    const res = recommendBabyRecipes(
      recipes,
      { diet_type: child.diet_type, allergies: child.allergies ?? [], likes: child.likes ?? [], dislikes: child.dislikes ?? [] },
      months,
    );
    return {
      months,
      stage: res.stage,
      picks: res.picks.slice(0, 30),
      excluded: res.excluded.map((e) => ({ id: e.recipe.id, slug: e.recipe.slug, name: e.recipe.name, reasons: e.reasons })),
    };
  });
