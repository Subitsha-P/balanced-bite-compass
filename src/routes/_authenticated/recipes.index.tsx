import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Heart } from "lucide-react";
import { useRecipes, useLikes } from "@/hooks/use-recipes";
import { useProfile } from "@/hooks/use-profile";
import { PageHeader } from "@/components/app-shell";
import { Loading, ErrorBox } from "@/components/nutri-ui";
import { RecipeCard } from "@/components/recipe-card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { isAllergySafe } from "@/lib/nutrition";
import { COURSES, REGIONS, conditionConflicts } from "@/lib/recipes";

export const Route = createFileRoute("/_authenticated/recipes/")({
  head: () => ({ meta: [{ title: "Indian recipes – NutriGuide" }, { name: "description", content: "Healthy Indian recipes from every region with ingredients, steps and nutrition." }] }),
  component: RecipesPage,
});

const AUDIENCES = [
  { value: "all", label: "Everyone" },
  { value: "weight_loss", label: "Obesity / weight loss" },
  { value: "heart", label: "Heart patients" },
  { value: "diabetes", label: "Diabetes" },
  { value: "hypertension", label: "High BP" },
  { value: "senior", label: "Grandparents" },
  { value: "high_protein", label: "High protein" },
  { value: "veg", label: "Veg" },
  { value: "nonveg", label: "Non-veg" },
  { value: "baby", label: "Baby food" },
];

function RecipesPage() {
  const recipes = useRecipes();
  const { data: profile } = useProfile();
  const { liked, toggle } = useLikes();
  const [q, setQ] = useState("");
  const [who, setWho] = useState("all");
  const [region, setRegion] = useState("all");
  const [course, setCourse] = useState("all");
  const [likedOnly, setLikedOnly] = useState(false);
  const [safeOnly, setSafeOnly] = useState(false);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (recipes.data ?? []).filter((r) => {
      if (who === "baby" ? r.audience !== "baby" : r.audience === "baby") return false;
      if (term && ![r.name, r.region, r.course, ...r.key_ingredients].some((x) => x.toLowerCase().includes(term))) return false;
      if (who === "veg" && !(r.diet_type === "vegan" || r.diet_type === "vegetarian")) return false;
      if (who === "nonveg" && !(r.diet_type === "non_vegetarian" || r.diet_type === "eggetarian")) return false;
      if (!["all", "veg", "nonveg", "baby"].includes(who) && !r.suitable_for.includes(who)) return false;
      if (region !== "all" && r.region !== region) return false;
      if (course !== "all" && r.course !== course) return false;
      if (likedOnly && !liked.includes(r.id)) return false;
      if (safeOnly && (!isAllergySafe(r, profile?.allergies ?? []) || conditionConflicts(r, profile?.health_conditions ?? []).length)) return false;
      return true;
    });
  }, [recipes.data, q, who, region, course, likedOnly, safeOnly, liked, profile]);

  const adultCount = recipes.data?.filter((r) => r.audience === "adult").length ?? 0;

  return (
    <>
      <PageHeader
        title="Indian recipes"
        subtitle={`${adultCount || "…"} dishes from North, South, East, West and North-East India — each with ingredients, step-by-step method and full nutrition. Tap the heart on dishes you enjoy to power your Custom recommendations.`}
      />
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Suitable for">
        {AUDIENCES.map((a) => (
          <button
            key={a.value}
            role="tab"
            aria-selected={who === a.value}
            onClick={() => setWho(a.value)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
              who === a.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {a.label}
          </button>
        ))}
      </div>
      <div className="mb-6 grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft md:grid-cols-[2fr_1fr_1fr]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search dishes or ingredients (e.g. ragi, paneer)…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={region} onValueChange={setRegion}>
          <SelectTrigger aria-label="Region"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All regions</SelectItem>
            {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={course} onValueChange={setCourse}>
          <SelectTrigger aria-label="Course"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All courses</SelectItem>
            {COURSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex flex-wrap gap-6 md:col-span-3">
          <label className="flex items-center gap-2 text-sm"><Switch checked={likedOnly} onCheckedChange={setLikedOnly} /> <Heart className="h-4 w-4" /> Dishes I like ({liked.length})</label>
          <label className="flex items-center gap-2 text-sm"><Switch checked={safeOnly} onCheckedChange={setSafeOnly} /> Safe for my allergies and health conditions</label>
        </div>
      </div>

      {recipes.isLoading ? <Loading label="Loading recipes…" /> : recipes.error ? (
        <ErrorBox message="Could not load recipes." onRetry={() => recipes.refetch()} />
      ) : list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">No recipes match these filters.</p>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted-foreground">{list.length} recipes</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((r) => (
              <RecipeCard key={r.id} recipe={r} liked={liked.includes(r.id)} onLike={r.audience === "adult" ? () => toggle(r.id) : undefined} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
