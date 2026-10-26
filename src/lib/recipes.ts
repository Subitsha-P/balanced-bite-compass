/**
 * NutriGuide recipe intelligence (pure, framework-free).
 *
 * 1. Health-condition rules (obesity, diabetes, heart, high BP, senior) — hard
 *    exclusions plus a graded "health fit" score.
 * 2. Basic recommendations: rank recipes using the health profile only.
 * 3. Custom recommendations: content-based filtering. Every recipe becomes a
 *    sparse feature vector (region, course, flavours, key ingredients, macro
 *    profile). The user's taste vector is the centroid of the dishes they liked;
 *    cosine similarity gives a 0–100 preference score which is blended with the
 *    health score.
 * 4. Baby Corner: WHO/IAP-style age stages, texture matching and ranking by
 *    the foods the child already likes.
 */
import type { DietType, Goal } from "./nutrition";
import { isAllergySafe, isDietCompatible } from "./nutrition";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type Condition = "obesity" | "diabetes" | "heart" | "hypertension" | "senior";
export type Texture = "puree" | "mashed" | "soft" | "finger_food" | "regular";

export interface Recipe {
  id: string;
  slug: string;
  name: string;
  description: string;
  region: string;
  course: string;
  diet_type: DietType;
  meal_types: string[];
  audience: "adult" | "baby";
  min_age_months: number | null;
  max_age_months: number | null;
  prep_minutes: number;
  cook_minutes: number;
  servings: number;
  serving_size: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  allergens: string[];
  suitable_for: string[];
  texture: Texture;
  flavors: string[];
  key_ingredients: string[];
  ingredients: string[];
  steps: string[];
  tips: string;
  image: string;
}

export const CONDITIONS: { value: Condition; label: string; who: string; tag: string }[] = [
  { value: "obesity", label: "Obesity / weight management", who: "Lower calorie, high fibre, filling dishes", tag: "weight_loss" },
  { value: "diabetes", label: "Diabetes (blood sugar)", who: "Low sugar, slow carbs, more fibre", tag: "diabetes" },
  { value: "heart", label: "Heart condition", who: "Less fat and salt, more fibre and omega-3", tag: "heart" },
  { value: "hypertension", label: "High blood pressure", who: "Low salt dishes", tag: "hypertension" },
  { value: "senior", label: "Senior / grandparent (60+)", who: "Soft, easy to chew, protein-rich", tag: "senior" },
];

export const SUITABLE_LABELS: Record<string, string> = {
  weight_loss: "Weight loss",
  diabetes: "Diabetes friendly",
  heart: "Heart healthy",
  hypertension: "Low salt",
  senior: "Senior friendly",
  high_protein: "High protein",
};

export const conditionLabel = (c: string) => CONDITIONS.find((x) => x.value === c)?.label ?? c;

export const REGIONS = ["South Indian", "North Indian", "West Indian", "East Indian", "North-East Indian", "Pan-Indian"];
export const COURSES = ["Breakfast", "Main Course", "Rice & Grains", "Breads", "Dal & Curry", "Snack", "Soup & Salad", "Dessert", "Beverage"];

/** Thresholds used by the rules — exported so the UI and tests share them. */
export const LIMITS = {
  diabetesMaxSugar: 15, // g per serving
  heartMaxSodium: 800, // mg per serving
  heartMaxFatShare: 0.45, // fraction of energy from fat
  hypertensionMaxSodium: 700,
  obesityMaxCalories: 500,
};

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const r1 = (v: number) => Math.round(v * 10) / 10;

export function normalizeRecipe(row: Record<string, unknown>): Recipe {
  const n = (k: string) => Number(row[k] ?? 0);
  return {
    ...(row as unknown as Recipe),
    calories: n("calories"),
    protein: n("protein"),
    carbohydrates: n("carbohydrates"),
    fat: n("fat"),
    fiber: n("fiber"),
    sugar: n("sugar"),
    sodium: n("sodium"),
    min_age_months: row["min_age_months"] == null ? null : Number(row["min_age_months"]),
    max_age_months: row["max_age_months"] == null ? null : Number(row["max_age_months"]),
  };
}

const fatShare = (r: Pick<Recipe, "fat" | "calories">) => (r.fat * 9) / Math.max(r.calories, 1);
const proteinShare = (r: Pick<Recipe, "protein" | "calories">) => (r.protein * 4) / Math.max(r.calories, 1);

/* ------------------------------------------------------------------ */
/* Health-condition rules                                              */
/* ------------------------------------------------------------------ */

type RuleRecipe = Pick<Recipe, "calories" | "fat" | "sugar" | "sodium">;

/** Reasons a recipe must be excluded for the given conditions (empty = allowed). */
export function conditionConflicts(r: RuleRecipe, conditions: string[]): string[] {
  const out: string[] = [];
  if (conditions.includes("diabetes") && r.sugar > LIMITS.diabetesMaxSugar) out.push(`Too much sugar for diabetes (${r.sugar} g)`);
  if (conditions.includes("heart") && (r.sodium > LIMITS.heartMaxSodium || fatShare(r) > LIMITS.heartMaxFatShare))
    out.push("Too much fat or salt for a heart condition");
  if (conditions.includes("hypertension") && r.sodium > LIMITS.hypertensionMaxSodium) out.push(`Too salty for high blood pressure (${r.sodium} mg sodium)`);
  if (conditions.includes("obesity") && r.calories > LIMITS.obesityMaxCalories) out.push(`Too calorie-dense for weight management (${r.calories} kcal)`);
  return out;
}

/** 0–1 fit of a recipe for one condition. */
export function conditionFit(r: Recipe, c: Condition): number {
  const tag = CONDITIONS.find((x) => x.value === c)!.tag;
  const bonus = r.suitable_for.includes(tag) ? 0.15 : 0;
  const fiber = clamp(r.fiber / 6);
  let v: number;
  switch (c) {
    case "diabetes":
      v = clamp(1 - Math.max(0, r.sugar - 5) / 10) * 0.4 + fiber * 0.3 + clamp(1 - Math.max(0, r.carbohydrates - 45) / 40) * 0.3;
      break;
    case "heart":
      v = clamp(1 - Math.max(0, fatShare(r) - 0.3) / 0.3) * 0.4 + clamp(1 - Math.max(0, r.sodium - 500) / 500) * 0.3 + fiber * 0.3;
      break;
    case "hypertension":
      v = clamp(1 - Math.max(0, r.sodium - 400) / 500) * 0.7 + fiber * 0.3;
      break;
    case "obesity":
      v = clamp(1 - Math.max(0, r.calories - 300) / 300) * 0.5 + fiber * 0.25 + clamp(proteinShare(r) / 0.25) * 0.25;
      break;
    case "senior": {
      const soft = ["soft", "mashed", "puree"].includes(r.texture) ? 1 : 0.4;
      v = soft * 0.4 + clamp(r.protein / 10) * 0.3 + clamp(1 - Math.max(0, r.sodium - 600) / 500) * 0.3;
      break;
    }
  }
  return clamp(v + bonus);
}

/* ------------------------------------------------------------------ */
/* Basic recipe scoring                                                */
/* ------------------------------------------------------------------ */

export interface RecipeProfile {
  goal: Goal;
  diet_type: DietType;
  allergies: string[];
  conditions: string[];
  target: number; // daily kcal target
}

export interface RecipeBreakdown {
  goal: number; // 0-25
  health: number; // 0-30
  calorie: number; // 0-20
  nutrition: number; // 0-25
}

export interface ScoredRecipe {
  recipe: Recipe;
  score: number;
  healthScore: number;
  preference?: number;
  breakdown: RecipeBreakdown;
  reason: string;
  because?: string;
}

export interface Exclusion {
  recipe: Recipe;
  reasons: string[];
}

export function recipeExclusions(r: Recipe, p: Pick<RecipeProfile, "diet_type" | "allergies" | "conditions">): string[] {
  const out: string[] = [];
  if (!isDietCompatible(r, p.diet_type)) out.push("Not suitable for your diet type");
  if (!isAllergySafe(r, p.allergies)) out.push("Contains one of your allergens");
  return out.concat(conditionConflicts(r, p.conditions));
}

export function scoreRecipe(r: Recipe, p: RecipeProfile): ScoredRecipe {
  const kcal = Math.max(r.calories, 1);
  const reasons: string[] = [];

  // Goal (0-25)
  let goal: number;
  if (p.goal === "lose") {
    goal = clamp(1 - kcal / 450) * 12 + clamp(r.fiber / 6) * 7 + clamp(proteinShare(r) / 0.25) * 6;
    if (kcal <= 250) reasons.push("light on calories");
  } else if (p.goal === "gain") {
    goal = clamp(kcal / 400) * 14 + clamp(r.protein / 20) * 11;
    if (kcal >= 300) reasons.push("energy-dense for healthy weight gain");
  } else {
    const c = (r.carbohydrates * 4) / kcal;
    const dev = Math.abs(c - 0.5) + Math.abs(proteinShare(r) - 0.2) + Math.abs(fatShare(r) - 0.3);
    goal = clamp(1 - dev / 1.2) * 25;
    if (dev < 0.45) reasons.push("well balanced in carbs, protein and fat");
  }

  // Health conditions (0-30)
  const conds = p.conditions.filter((c): c is Condition => CONDITIONS.some((x) => x.value === c));
  let healthFit: number;
  if (conds.length) {
    healthFit = conds.reduce((s, c) => s + conditionFit(r, c), 0) / conds.length;
    const good = conds.filter((c) => conditionFit(r, c) >= 0.75).map((c) => SUITABLE_LABELS[CONDITIONS.find((x) => x.value === c)!.tag]!.toLowerCase());
    if (good.length) reasons.push(good.join(", "));
  } else {
    healthFit = clamp(1 - Math.max(0, r.sodium - 600) / 600) * 0.4 + clamp(1 - Math.max(0, r.sugar - 10) / 15) * 0.3 + clamp(r.fiber / 5) * 0.3;
  }
  const health = healthFit * 30;

  // Calorie fit (0-20): one dish ≈ 10–30 % of the day; drinks/snacks smaller.
  const share = kcal / Math.max(p.target, 1);
  const small = ["Beverage", "Snack", "Soup & Salad", "Dessert"].includes(r.course);
  const [lo, hi] = small ? [0.02, 0.12] : [0.1, 0.3];
  const calorie = share < lo ? 20 * (share / lo) : share > hi ? Math.max(0, 20 - (share - hi) * 120) : 20;

  // Nutrient quality (0-25)
  const nutrition = clamp(proteinShare(r) / 0.25) * 12 + clamp(r.fiber / 6) * 8 + clamp(1 - r.sugar / 20) * 5;
  if (r.protein >= 12) reasons.unshift("high in protein");
  if (r.fiber >= 6) reasons.push("rich in fibre");

  const breakdown = { goal: r1(goal), health: r1(health), calorie: r1(calorie), nutrition: r1(nutrition) };
  const score = Math.round(breakdown.goal + breakdown.health + breakdown.calorie + breakdown.nutrition);
  const head = reasons.length ? reasons.slice(0, 3).join(", ") : "a sensible fit for your daily target";
  return { recipe: r, score, healthScore: score, breakdown, reason: `Recommended because it is ${head}.` };
}

/* ------------------------------------------------------------------ */
/* Content-based similarity (custom mode)                              */
/* ------------------------------------------------------------------ */

type Vec = Map<string, number>;

export function featureVector(r: Recipe): Vec {
  const v: Vec = new Map();
  const add = (k: string, w: number) => v.set(k, (v.get(k) ?? 0) + w);
  add(`region:${r.region}`, 1);
  add(`course:${r.course}`, 0.8);
  r.flavors.forEach((f) => add(`flavor:${f}`, 1));
  r.key_ingredients.forEach((i) => add(`ing:${i.toLowerCase()}`, 1.5));
  add(`diet:${r.diet_type}`, 0.5);
  // Macro profile as continuous features.
  add("m:protein", proteinShare(r) * 2);
  add("m:fat", fatShare(r) * 2);
  add("m:carb", ((r.carbohydrates * 4) / Math.max(r.calories, 1)) * 2);
  return v;
}

export function cosine(a: Vec, b: Vec): number {
  let dot = 0, na = 0, nb = 0;
  a.forEach((x, k) => { na += x * x; const y = b.get(k); if (y) dot += x * y; });
  b.forEach((y) => { nb += y * y; });
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

function centroid(vs: Vec[]): Vec {
  const c: Vec = new Map();
  vs.forEach((v) => v.forEach((x, k) => c.set(k, (c.get(k) ?? 0) + x / vs.length)));
  return c;
}

export const PREFERENCE_WEIGHT = 0.45;

export function recommendRecipes(
  recipes: Recipe[],
  profile: RecipeProfile,
  mode: "basic" | "custom",
  likedIds: string[] = [],
) {
  const adult = recipes.filter((r) => r.audience === "adult");
  const excluded: Exclusion[] = [];
  const safe: Recipe[] = [];
  for (const r of adult) {
    const reasons = recipeExclusions(r, profile);
    if (reasons.length) excluded.push({ recipe: r, reasons });
    else safe.push(r);
  }
  let items = safe.map((r) => scoreRecipe(r, profile));

  if (mode === "custom") {
    const liked = adult.filter((r) => likedIds.includes(r.id));
    if (!liked.length) return { items: [], excluded, needsLikes: true, liked: [] as Recipe[] };
    const likedVecs = liked.map((r) => ({ r, v: featureVector(r) }));
    const taste = centroid(likedVecs.map((x) => x.v));
    items = items
      .filter((s) => !likedIds.includes(s.recipe.id))
      .map((s) => {
        const v = featureVector(s.recipe);
        const pref = Math.round(cosine(v, taste) * 100);
        const best = likedVecs.map((x) => ({ r: x.r, sim: cosine(v, x.v) })).sort((a, b) => b.sim - a.sim)[0]!;
        const shared = s.recipe.key_ingredients.filter((i) => best.r.key_ingredients.includes(i));
        const sameRegion = best.r.region === s.recipe.region;
        const why = shared.length
          ? `shares ${shared.slice(0, 2).join(" and ")}`
          : sameRegion ? `same ${s.recipe.region} style` : `similar flavours (${s.recipe.flavors.join(", ")})`;
        return {
          ...s,
          preference: pref,
          score: Math.round((1 - PREFERENCE_WEIGHT) * s.healthScore + PREFERENCE_WEIGHT * pref),
          because: `Because you liked ${best.r.name} — ${why}.`,
        };
      });
    return { items: sortScored(items), excluded, needsLikes: false, liked };
  }
  return { items: sortScored(items), excluded, needsLikes: false, liked: [] as Recipe[] };
}

const sortScored = (xs: ScoredRecipe[]) => xs.sort((a, b) => b.score - a.score || a.recipe.name.localeCompare(b.recipe.name));

/* ------------------------------------------------------------------ */
/* Baby Corner                                                         */
/* ------------------------------------------------------------------ */

export const BABY_FOODS: { value: string; label: string }[] = [
  { value: "rice", label: "Rice" },
  { value: "moong dal", label: "Moong dal" },
  { value: "ragi", label: "Ragi" },
  { value: "banana", label: "Banana" },
  { value: "apple", label: "Apple" },
  { value: "carrot", label: "Carrot" },
  { value: "sweet potato", label: "Sweet potato" },
  { value: "pumpkin", label: "Pumpkin" },
  { value: "potato", label: "Potato" },
  { value: "spinach", label: "Spinach" },
  { value: "beetroot", label: "Beetroot" },
  { value: "oats", label: "Oats" },
  { value: "broken wheat", label: "Daliya" },
  { value: "semolina", label: "Sooji" },
  { value: "wheat", label: "Roti / wheat" },
  { value: "curd", label: "Curd" },
  { value: "paneer", label: "Paneer" },
  { value: "ghee", label: "Ghee" },
  { value: "egg", label: "Egg" },
  { value: "chicken", label: "Chicken" },
  { value: "fish", label: "Fish" },
  { value: "vegetables", label: "Mixed vegetables" },
];

export interface BabyStage {
  key: string;
  label: string;
  range: string;
  textures: Texture[];
  meals: string;
  guidance: string[];
  avoid: string[];
}

const ALWAYS_AVOID = ["Whole nuts, whole grapes and popcorn (choking risk)", "Packaged juices, chips and sugary drinks"];

export const BABY_STAGES: (BabyStage & { from: number; to: number })[] = [
  {
    key: "milk", label: "Milk only", range: "0–5 months", from: 0, to: 5, textures: [],
    meals: "Breast milk or formula on demand (8–12 feeds a day)",
    guidance: ["Exclusive breastfeeding is recommended for the first 6 months.", "No water, honey, ghutti or other foods are needed yet.", "Solid food recommendations will appear here at 6 months."],
    avoid: ["Any solid food, water or honey"],
  },
  {
    key: "first", label: "First tastes", range: "6–8 months", from: 6, to: 8, textures: ["puree"],
    meals: "2–3 small meals of 2–3 tbsp, plus breast milk",
    guidance: ["Start with smooth, runny purees and porridges.", "Introduce one new food every 3 days to spot allergies.", "Offer iron-rich foods like ragi and dal daily."],
    avoid: ["Honey (risk of infant botulism)", "Added salt and sugar", "Cow milk as a drink", ...ALWAYS_AVOID],
  },
  {
    key: "mashed", label: "Mashed & finger foods", range: "9–11 months", from: 9, to: 11, textures: ["puree", "mashed", "finger_food"],
    meals: "3 meals + 1 snack of about 1/2 cup",
    guidance: ["Move to thicker, lumpier mashes.", "Offer soft finger foods to build chewing and self-feeding.", "Introduce well-cooked egg, fish and chicken if your family eats them."],
    avoid: ["Honey", "Added salt and sugar", "Cow milk as a drink", ...ALWAYS_AVOID],
  },
  {
    key: "toddler", label: "Toddler", range: "12–23 months", from: 12, to: 23, textures: ["mashed", "soft", "finger_food"],
    meals: "3 meals + 2 snacks of about 3/4 cup",
    guidance: ["Your child can share soft family food with less spice and salt.", "Whole cow milk can now be given (up to 2 cups a day).", "Keep offering vegetables even if refused — it can take 10+ tries."],
    avoid: ["Very spicy or salty food", ...ALWAYS_AVOID],
  },
  {
    key: "kid", label: "Little kid", range: "2–5 years", from: 24, to: 71, textures: ["soft", "finger_food", "regular"],
    meals: "3 meals + 2 healthy snacks, roughly half an adult portion",
    guidance: ["Family meals with mild spice are ideal.", "Make half the plate vegetables and fruit.", "Limit sweets to occasional treats."],
    avoid: ["Whole nuts until age 5", "Excess sugar, fried snacks and soft drinks"],
  },
];

export function ageInMonths(birthDate: string, today: Date = new Date()): number {
  const b = new Date(birthDate + "T00:00:00Z");
  let m = (today.getUTCFullYear() - b.getUTCFullYear()) * 12 + (today.getUTCMonth() - b.getUTCMonth());
  if (today.getUTCDate() < b.getUTCDate()) m -= 1;
  return Math.max(0, m);
}

export function babyStage(months: number) {
  return BABY_STAGES.find((s) => months >= s.from && months <= s.to) ?? BABY_STAGES[BABY_STAGES.length - 1]!;
}

export function formatAge(months: number) {
  if (months < 24) return `${months} month${months === 1 ? "" : "s"}`;
  const y = Math.floor(months / 12), m = months % 12;
  return `${y} year${y > 1 ? "s" : ""}${m ? ` ${m} month${m > 1 ? "s" : ""}` : ""}`;
}

export interface ChildInput {
  diet_type: DietType;
  allergies: string[];
  likes: string[];
  dislikes: string[];
}

export interface BabyPick {
  recipe: Recipe;
  score: number;
  liked: string[];
  reason: string;
}

const matches = (r: Recipe, food: string) => r.key_ingredients.some((i) => i.toLowerCase() === food || i.toLowerCase().includes(food));

/** Is this recipe safe for a child of this age (independent of preferences)? */
export function babyAgeConflicts(r: Recipe, months: number): string[] {
  const out: string[] = [];
  if (months < 6) out.push("Too young for solid food");
  if (r.audience === "baby") {
    if (r.min_age_months != null && months < r.min_age_months) out.push(`Suitable from ${r.min_age_months} months`);
    if (r.max_age_months != null && months > r.max_age_months) out.push("Your child has outgrown this texture");
  } else {
    // Family dishes only from 2 years, mild, not too sweet or salty.
    if (months < 24) out.push("Family dish - suitable from 2 years");
    if (r.flavors.includes("spicy")) out.push("Too spicy for a young child");
    if (r.sugar > 12 || r.sodium > 600) out.push("Too much sugar or salt for a child");
  }
  if (months < 12 && r.ingredients.some((i) => /honey/i.test(i))) out.push("Honey is unsafe before 12 months");
  return out;
}

export function recommendBabyRecipes(recipes: Recipe[], child: ChildInput, months: number) {
  const stage = babyStage(months);
  const picks: BabyPick[] = [];
  const excluded: Exclusion[] = [];
  if (months < 6) return { stage, picks, excluded };

  for (const r of recipes) {
    const reasons = babyAgeConflicts(r, months);
    if (r.audience === "adult" && reasons.length) continue; // don't list every adult dish as excluded
    if (!isDietCompatible(r, child.diet_type)) reasons.push("Not suitable for the chosen diet");
    if (!isAllergySafe(r, child.allergies)) reasons.push("Contains an allergen you listed");
    const disliked = child.dislikes.filter((d) => matches(r, d));
    if (disliked.length) reasons.push(`Contains ${disliked.join(", ")} (disliked)`);
    if (reasons.length) { if (r.audience === "baby") excluded.push({ recipe: r, reasons }); continue; }

    const liked = child.likes.filter((l) => matches(r, l));
    const likeScore = liked.length ? Math.min(50, 35 + (liked.length - 1) * 15) : 0;
    const stageScore = stage.textures.includes(r.texture) ? 25 : 12;
    const kcal = Math.max(r.calories, 1);
    const nutri = clamp(proteinShare(r) / 0.2) * 15 + clamp(r.fiber / 2.5) * 10;
    const familyPenalty = r.audience === "adult" ? 8 : 0;
    const score = Math.round(likeScore + stageScore + nutri - familyPenalty + (kcal > 0 ? 0 : 0));
    const why: string[] = [];
    if (liked.length) why.push(`your child likes ${liked.join(" and ")}`);
    why.push(`${r.texture.replace("_", " ")} texture suits the ${stage.label.toLowerCase()} stage`);
    if (r.protein / kcal >= 0.05) why.push("good protein");
    picks.push({ recipe: r, score, liked, reason: `Picked because ${why.join(", ")}.` });
  }
  picks.sort((a, b) => b.score - a.score || a.recipe.name.localeCompare(b.recipe.name));
  return { stage, picks, excluded };
}
