import { describe, expect, it } from "vitest";
import {
  ageInMonths,
  babyAgeConflicts,
  babyStage,
  conditionConflicts,
  recommendBabyRecipes,
  recommendRecipes,
  type Recipe,
} from "@/lib/recipes";
import { isConditionSafe } from "@/lib/nutrition";

let n = 0;
function recipe(over: Partial<Recipe>): Recipe {
  n += 1;
  return {
    id: `id-${n}`, slug: `r-${n}`, name: `Recipe ${n}`, description: "", region: "South Indian", course: "Dal & Curry",
    diet_type: "vegan", meal_types: ["lunch"], audience: "adult", min_age_months: null, max_age_months: null,
    prep_minutes: 10, cook_minutes: 10, servings: 2, serving_size: "1 cup", calories: 250, protein: 10, carbohydrates: 30,
    fat: 8, fiber: 5, sugar: 3, sodium: 300, allergens: [], suitable_for: [], texture: "regular", flavors: ["mild"],
    key_ingredients: ["rice"], ingredients: [], steps: [], tips: "", image: "dishes",
    ...over,
  };
}

const profile = { goal: "maintain" as const, diet_type: "non_vegetarian" as const, allergies: [], conditions: [] as string[], target: 2000 };

describe("health condition rules", () => {
  it("excludes dishes over 15 g sugar for diabetes", () => {
    expect(conditionConflicts({ calories: 200, fat: 5, sugar: 22, sodium: 100 }, ["diabetes"])).toHaveLength(1);
    expect(conditionConflicts({ calories: 200, fat: 5, sugar: 15, sodium: 100 }, ["diabetes"])).toHaveLength(0);
  });
  it("excludes dishes over 700 mg sodium for high blood pressure", () => {
    expect(conditionConflicts({ calories: 300, fat: 5, sugar: 2, sodium: 780 }, ["hypertension"])).toHaveLength(1);
  });
  it("excludes dishes over 800 mg sodium for heart patients", () => {
    expect(conditionConflicts({ calories: 300, fat: 5, sugar: 2, sodium: 850 }, ["heart"])).toHaveLength(1);
  });
  it("excludes dishes over 500 kcal for obesity", () => {
    expect(conditionConflicts({ calories: 520, fat: 10, sugar: 2, sodium: 300 }, ["obesity"])).toHaveLength(1);
  });
  it("removes single foods over 15 g sugar for diabetics", () => {
    expect(isConditionSafe({ sugar: 28, calories: 180 }, ["diabetes"])).toBe(false);
    expect(isConditionSafe({ sugar: 28, calories: 180 }, [])).toBe(true);
  });
});

describe("basic vs custom recommendations", () => {
  it("never recommends a sweet to a diabetic", () => {
    const sweet = recipe({ name: "Halwa", sugar: 22 });
    const dal = recipe({ name: "Dal" });
    const res = recommendRecipes([sweet, dal], { ...profile, conditions: ["diabetes"] }, "basic");
    expect(res.items.map((i) => i.recipe.name)).toEqual(["Dal"]);
    expect(res.excluded[0]!.recipe.name).toBe("Halwa");
  });

  it("asks for liked dishes before custom mode can rank", () => {
    const res = recommendRecipes([recipe({})], profile, "custom", []);
    expect(res.needsLikes).toBe(true);
  });

  it("ranks a dish similar to the liked one above an unrelated dish", () => {
    const liked = recipe({ name: "Masala Dosa", key_ingredients: ["rice", "urad dal"], flavors: ["spicy"], course: "Breakfast" });
    const similar = recipe({ name: "Idli", key_ingredients: ["rice", "urad dal"], flavors: ["spicy"], course: "Breakfast" });
    const other = recipe({ name: "Fish Curry", region: "East Indian", key_ingredients: ["fish"], flavors: ["tangy"], diet_type: "non_vegetarian" });
    const res = recommendRecipes([liked, similar, other], profile, "custom", [liked.id]);
    expect(res.items[0]!.recipe.name).toBe("Idli");
    expect(res.items.some((i) => i.recipe.id === liked.id)).toBe(false);
    expect(res.items[0]!.preference!).toBeGreaterThan(res.items[1]!.preference!);
  });
});

describe("baby corner", () => {
  it("computes age in completed months", () => {
    expect(ageInMonths("2026-01-15", new Date("2026-10-14T00:00:00Z"))).toBe(8);
    expect(ageInMonths("2026-01-15", new Date("2026-10-15T00:00:00Z"))).toBe(9);
  });
  it("maps ages to feeding stages", () => {
    expect(babyStage(4).key).toBe("milk");
    expect(babyStage(7).key).toBe("first");
    expect(babyStage(10).key).toBe("mashed");
    expect(babyStage(18).key).toBe("toddler");
    expect(babyStage(36).key).toBe("kid");
  });
  it("gives no solid food recipes under 6 months", () => {
    const r = recipe({ audience: "baby", min_age_months: 6, max_age_months: 8, texture: "puree" });
    expect(recommendBabyRecipes([r], { diet_type: "vegan", allergies: [], likes: [], dislikes: [] }, 5).picks).toHaveLength(0);
  });
  it("blocks recipes before their minimum age and honey before 12 months", () => {
    expect(babyAgeConflicts(recipe({ audience: "baby", min_age_months: 12, max_age_months: 60 }), 9)).toContain("Suitable from 12 months");
    expect(babyAgeConflicts(recipe({ audience: "baby", min_age_months: 6, max_age_months: 60, ingredients: ["1 tsp honey"] }), 10)).toContain("Honey is unsafe before 12 months");
  });
  it("keeps spicy family dishes away from toddlers", () => {
    expect(babyAgeConflicts(recipe({ flavors: ["spicy"] }), 30)).toContain("Too spicy for a young child");
    expect(babyAgeConflicts(recipe({ flavors: ["mild"] }), 18)).toContain("Family dish - suitable from 2 years");
  });
  it("ranks recipes with foods the child likes first and drops disliked foods", () => {
    const base = { audience: "baby" as const, min_age_months: 6, max_age_months: 12, texture: "puree" as const };
    const banana = recipe({ ...base, name: "Banana Mash", key_ingredients: ["banana"] });
    const carrot = recipe({ ...base, name: "Carrot Puree", key_ingredients: ["carrot"] });
    const spinach = recipe({ ...base, name: "Spinach Puree", key_ingredients: ["spinach"] });
    const res = recommendBabyRecipes([carrot, banana, spinach], { diet_type: "vegan", allergies: [], likes: ["banana"], dislikes: ["spinach"] }, 7);
    expect(res.picks[0]!.recipe.name).toBe("Banana Mash");
    expect(res.picks.some((p) => p.recipe.name === "Spinach Puree")).toBe(false);
  });
});
