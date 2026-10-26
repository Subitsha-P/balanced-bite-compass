import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Clock, Users, AlertTriangle, CheckCircle2, Lightbulb, Baby } from "lucide-react";
import { useRecipes, useLikes } from "@/hooks/use-recipes";
import { useProfile } from "@/hooks/use-profile";
import { Loading, MacroBar, MacroLegend, StatCard } from "@/components/nutri-ui";
import { DietDot, LikeButton } from "@/components/recipe-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { foodImage } from "@/lib/food-images";
import { DIET_LABELS, allergenLabel, isAllergySafe } from "@/lib/nutrition";
import { CONDITIONS, SUITABLE_LABELS, conditionConflicts, conditionFit, type Condition } from "@/lib/recipes";

export const Route = createFileRoute("/_authenticated/recipes/$slug")({
  head: () => ({ meta: [{ title: "Recipe – NutriGuide" }, { name: "description", content: "Ingredients, step-by-step method and nutrition for this Indian dish." }] }),
  component: RecipeDetail,
});

function RecipeDetail() {
  const { slug } = Route.useParams();
  const recipes = useRecipes();
  const { data: profile } = useProfile();
  const { liked, toggle } = useLikes();

  if (recipes.isLoading) return <Loading label="Loading recipe…" />;
  const r = recipes.data?.find((x) => x.slug === slug);
  if (!r) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-medium">Recipe not found.</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/recipes">Back to recipes</Link></Button>
      </div>
    );
  }

  const conditions = (profile?.health_conditions ?? []) as Condition[];
  const conflicts = r.audience === "adult" ? conditionConflicts(r, conditions) : [];
  const allergyOk = isAllergySafe(r, profile?.allergies ?? []);
  const isBaby = r.audience === "baby";

  return (
    <>
      <Link to={isBaby ? "/baby" : "/recipes"} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {isBaby ? "Baby Corner" : "All recipes"}
      </Link>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="overflow-hidden rounded-3xl border border-border shadow-soft">
          <img src={foodImage(r.image)} alt={r.name} width={1024} height={768} className="h-full max-h-96 w-full object-cover" />
        </div>
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DietDot diet={r.diet_type} /> {DIET_LABELS[r.diet_type]} · {r.region} · {r.course}
          </div>
          <div className="mt-2 flex items-start justify-between gap-4">
            <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{r.name}</h1>
            {!isBaby && <LikeButton liked={liked.includes(r.id)} onClick={() => toggle(r.id)} />}
          </div>
          <p className="mt-2 text-muted-foreground">{r.description}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" /> Prep {r.prep_minutes} min · Cook {r.cook_minutes} min</span>
            {isBaby ? (
              <span className="flex items-center gap-1.5"><Baby className="h-4 w-4 text-primary" /> Age {r.min_age_months}–{r.max_age_months} months · {r.texture.replace("_", " ")}</span>
            ) : (
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-primary" /> Serves {r.servings}</span>
            )}
          </div>
          {r.suitable_for.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {r.suitable_for.map((t) => <Badge key={t} variant="secondary">{SUITABLE_LABELS[t] ?? t}</Badge>)}
            </div>
          )}
          {r.allergens.length > 0 && <p className="mt-3 text-sm text-muted-foreground">Contains: {r.allergens.map(allergenLabel).join(", ")}</p>}

          {!isBaby && (conflicts.length > 0 || !allergyOk) && (
            <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <p className="flex items-center gap-2 font-medium text-destructive"><AlertTriangle className="h-4 w-4" /> Not recommended for you</p>
              <ul className="mt-1 list-disc pl-6 text-muted-foreground">
                {!allergyOk && <li>Contains one of your allergens</li>}
                {conflicts.map((c) => <li key={c}>{c}</li>)}
              </ul>
            </div>
          )}
          {!isBaby && conditions.length > 0 && conflicts.length === 0 && allergyOk && (
            <div className="mt-4 rounded-2xl border border-primary/30 bg-primary-soft p-4 text-sm">
              <p className="flex items-center gap-2 font-medium text-primary"><CheckCircle2 className="h-4 w-4" /> Fits your health profile</p>
              <ul className="mt-2 space-y-1">
                {conditions.map((c) => (
                  <li key={c} className="flex justify-between gap-4"><span>{CONDITIONS.find((x) => x.value === c)?.label}</span><span className="font-semibold">{Math.round(conditionFit(r, c) * 100)}% fit</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <StatCard label="Calories" value={r.calories} unit="kcal" hint={r.serving_size} />
        <StatCard label="Protein" value={r.protein} unit="g" />
        <StatCard label="Fibre" value={r.fiber} unit="g" />
        <StatCard label="Sugar · Sodium" value={`${r.sugar}g`} hint={`${r.sodium} mg sodium`} />
      </div>
      <div className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
        <MacroBar protein={r.protein} carbs={r.carbohydrates} fat={r.fat} />
        <div className="mt-3"><MacroLegend protein={r.protein} carbs={r.carbohydrates} fat={r.fat} /></div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="font-display text-xl font-semibold">Ingredients</h2>
          <ul className="mt-4 space-y-2.5">
            {r.ingredients.map((i) => (
              <li key={i} className="flex gap-3 text-sm"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{i}</li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="font-display text-xl font-semibold">Method</h2>
          <ol className="mt-4 space-y-4">
            {r.steps.map((s, i) => (
              <li key={i} className="flex gap-4 text-sm">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                <span className="pt-1">{s}</span>
              </li>
            ))}
          </ol>
          {r.tips && (
            <p className="mt-6 flex gap-2 rounded-xl bg-accent-soft p-4 text-sm"><Lightbulb className="h-4 w-4 shrink-0 text-accent" />{r.tips}</p>
          )}
        </section>
      </div>
    </>
  );
}
