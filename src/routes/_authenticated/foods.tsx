import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useFoods, useProfile } from "@/hooks/use-profile";
import { PageHeader } from "@/components/app-shell";
import { Loading, ErrorBox, MacroBar } from "@/components/nutri-ui";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, foodImage } from "@/lib/food-images";
import { DIET_LABELS, allergenLabel, isAllergySafe, isDietCompatible, isHighProtein, isLowCalorie, isHighFiber, type DietType, type Food } from "@/lib/nutrition";

export const Route = createFileRoute("/_authenticated/foods")({
  head: () => ({ meta: [{ title: "Food database – NutriGuide" }, { name: "description", content: "Search and filter 130+ foods with full nutrition data." }] }),
  component: FoodsPage,
});

function FoodsPage() {
  const foods = useFoods();
  const { data: profile } = useProfile();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [diet, setDiet] = useState("all");
  const [tag, setTag] = useState("all");
  const [safeOnly, setSafeOnly] = useState(false);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return ((foods.data ?? []) as Food[]).filter((f) => {
      if (term && !f.name.toLowerCase().includes(term) && !f.category.toLowerCase().includes(term)) return false;
      if (cat !== "all" && f.category !== cat) return false;
      if (diet !== "all" && !isDietCompatible(f, diet as DietType)) return false;
      if (tag === "protein" && !isHighProtein(f)) return false;
      if (tag === "lowcal" && !isLowCalorie(f)) return false;
      if (tag === "fiber" && !isHighFiber(f)) return false;
      if (safeOnly && !isAllergySafe(f, profile?.allergies ?? [])) return false;
      return true;
    });
  }, [foods.data, q, cat, diet, tag, safeOnly, profile]);

  return (
    <>
      <PageHeader title="Food database" subtitle={`${foods.data?.length ?? "…"} foods with calories, macros, fiber, sugar and allergen data.`} />
      <div className="mb-6 grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search foods…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search foods" />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger aria-label="Category"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All categories</SelectItem>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={diet} onValueChange={setDiet}>
          <SelectTrigger aria-label="Diet"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Any diet</SelectItem>{Object.entries(DIET_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={tag} onValueChange={setTag}>
          <SelectTrigger aria-label="Nutrition filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any nutrition</SelectItem>
            <SelectItem value="protein">High protein</SelectItem>
            <SelectItem value="lowcal">Low calorie</SelectItem>
            <SelectItem value="fiber">High fiber</SelectItem>
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm md:col-span-4">
          <Switch checked={safeOnly} onCheckedChange={setSafeOnly} /> Hide foods containing my allergens
        </label>
      </div>
      {foods.isLoading ? <Loading label="Loading foods…" /> : foods.error ? (
        <ErrorBox message={(foods.error as Error).message} onRetry={() => foods.refetch()} />
      ) : list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">No foods match your search.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((f) => <FoodCard key={f.id} food={f} />)}
        </div>
      )}
    </>
  );
}

function FoodCard({ food: f }: { food: Food }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <img src={foodImage(f.image)} alt="" className="h-32 w-full object-cover" loading="lazy" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold leading-tight">{f.name}</h3>
            <p className="text-xs text-muted-foreground">{f.category} · {f.serving_size}</p>
          </div>
          <span className="whitespace-nowrap font-display text-xl font-semibold">{f.calories}<span className="text-xs font-normal text-muted-foreground"> kcal</span></span>
        </div>
        <div className="mt-3"><MacroBar protein={f.protein} carbs={f.carbohydrates} fat={f.fat} /></div>
        <div className="mt-2 grid grid-cols-5 text-center text-xs">
          {[["Protein", f.protein], ["Carbs", f.carbohydrates], ["Fat", f.fat], ["Fiber", f.fiber], ["Sugar", f.sugar]].map(([l, v]) => (
            <div key={l as string}><p className="font-semibold">{v}g</p><p className="text-muted-foreground">{l}</p></div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          <Badge variant="secondary">{DIET_LABELS[f.diet_type]}</Badge>
          {f.allergens.map((a) => <Badge key={a} variant="outline" className="border-destructive/40 text-destructive">{allergenLabel(a)}</Badge>)}
        </div>
      </div>
    </article>
  );
}
