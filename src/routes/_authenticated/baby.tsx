import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Baby, Plus, Pencil, Trash2, Loader2, Milk, Ban, Utensils, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { friendlyError } from "@/hooks/use-profile";
import { getBabyRecommendations } from "@/lib/api.functions";
import { PageHeader } from "@/components/app-shell";
import { Loading, ErrorBox } from "@/components/nutri-ui";
import { RecipeCard } from "@/components/recipe-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import babyImg from "@/assets/foods/baby.jpg";
import { ALLERGENS, DIET_LABELS, type DietType } from "@/lib/nutrition";
import { BABY_FOODS, ageInMonths, babyStage, formatAge } from "@/lib/recipes";

export const Route = createFileRoute("/_authenticated/baby")({
  head: () => ({ meta: [{ title: "Baby Corner – NutriGuide" }, { name: "description", content: "Age-appropriate Indian baby food recommendations and recipes based on what your child likes." }] }),
  component: BabyPage,
});

interface Child {
  id: string;
  name: string;
  birth_date: string;
  diet_type: DietType;
  allergies: string[];
  likes: string[];
  dislikes: string[];
}

const today = () => new Date().toISOString().slice(0, 10);
const sixYearsAgo = () => { const d = new Date(); d.setFullYear(d.getFullYear() - 6); return d.toISOString().slice(0, 10); };

const schema = z.object({
  name: z.string().trim().min(1, "Enter your child's name.").max(60),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter the date of birth.")
    .refine((d) => d <= today(), "Date of birth cannot be in the future.")
    .refine((d) => d >= sixYearsAgo(), "Baby Corner supports children up to 6 years."),
  diet_type: z.enum(["vegetarian", "non_vegetarian", "vegan", "eggetarian"]),
  allergies: z.array(z.string()),
  likes: z.array(z.string()),
  dislikes: z.array(z.string()),
});

const empty = { name: "", birth_date: "", diet_type: "vegetarian" as DietType, allergies: [] as string[], likes: [] as string[], dislikes: [] as string[] };

function BabyPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const children = useQuery({
    queryKey: ["children"],
    queryFn: async () => {
      const { data, error } = await supabase.from("children").select("*").order("created_at");
      if (error) throw new Error("Could not load your children.");
      return (data ?? []) as Child[];
    },
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<Child | "new" | null>(null);

  useEffect(() => {
    if (!children.data) return;
    if (!children.data.length) { setEditing((e) => e ?? "new"); setSelected(null); return; }
    if (!selected || !children.data.some((c) => c.id === selected)) setSelected(children.data[0]!.id);
  }, [children.data, selected]);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("children").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["children"] }); toast.success("Child profile removed."); },
    onError: () => toast.error("Could not remove the profile."),
  });

  if (children.isLoading) return <Loading />;
  if (children.error) return <ErrorBox message={friendlyError(children.error)} onRetry={() => children.refetch()} />;
  const list = children.data ?? [];
  const child = list.find((c) => c.id === selected);

  return (
    <>
      <PageHeader
        title="Baby Corner"
        subtitle="Healthy Indian baby and toddler food matched to your child's age, stage and favourite foods — with simple home recipes."
        action={list.length > 0 && !editing && <Button onClick={() => setEditing("new")}><Plus className="mr-2 h-4 w-4" />Add child</Button>}
      />

      {list.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-3">
          {list.map((c) => {
            const m = ageInMonths(c.birth_date);
            return (
              <button
                key={c.id}
                onClick={() => { setSelected(c.id); setEditing(null); }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition",
                  c.id === selected ? "border-primary bg-primary-soft" : "border-border bg-card hover:border-primary/40",
                )}
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft"><Baby className="h-5 w-5 text-accent" /></span>
                <span>
                  <span className="block font-semibold">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{formatAge(m)} · {babyStage(m).label}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {editing ? (
        <ChildForm
          initial={editing === "new" ? null : editing}
          userId={user!.id}
          canCancel={list.length > 0}
          onDone={(id) => { setEditing(null); if (id) setSelected(id); }}
        />
      ) : child ? (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(child)}><Pencil className="mr-2 h-4 w-4" />Edit {child.name}</Button>
            <Button variant="ghost" size="sm" onClick={() => { if (confirm(`Remove ${child.name}'s profile?`)) del.mutate(child.id); }}><Trash2 className="mr-2 h-4 w-4" />Remove</Button>
          </div>
          <ChildPlan child={child} />
        </>
      ) : null}
    </>
  );
}

function Chips({ value, onChange, label, tone = "primary" }: { value: string[]; onChange: (v: string[]) => void; label: string; tone?: "primary" | "destructive" }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2 flex flex-wrap gap-2">
        {BABY_FOODS.map((f) => {
          const on = value.includes(f.value);
          return (
            <button
              type="button"
              key={f.value}
              aria-pressed={on}
              onClick={() => onChange(on ? value.filter((x) => x !== f.value) : [...value, f.value])}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition",
                on ? (tone === "primary" ? "border-primary bg-primary text-primary-foreground" : "border-destructive bg-destructive text-destructive-foreground") : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChildForm({ initial, userId, onDone, canCancel }: { initial: Child | null; userId: string; onDone: (id?: string) => void; canCancel: boolean }) {
  const qc = useQueryClient();
  const [f, setF] = useState(initial ? { ...empty, ...initial } : empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(f);
    if (!parsed.success) { setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message]))); return; }
    setErrors({});
    setBusy(true);
    const payload = { ...parsed.data, dislikes: parsed.data.dislikes.filter((d) => !parsed.data.likes.includes(d)) };
    const res = initial
      ? await supabase.from("children").update(payload).eq("id", initial.id).select("id").single()
      : await supabase.from("children").insert({ ...payload, user_id: userId }).select("id").single();
    setBusy(false);
    if (res.error) { toast.error("Could not save the child profile. Please check the details."); return; }
    await qc.invalidateQueries({ queryKey: ["children"] });
    qc.invalidateQueries({ queryKey: ["baby-recs"] });
    toast.success(initial ? "Profile updated." : `${parsed.data.name} added.`);
    onDone(res.data.id);
  }

  return (
    <form onSubmit={save} noValidate className="grid gap-6 rounded-3xl border border-border bg-card p-6 shadow-soft lg:grid-cols-[1fr_280px]">
      <div className="space-y-5">
        <h2 className="font-display text-2xl font-semibold">{initial ? `Edit ${initial.name}` : "Add your child"}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="child-name">Name</Label>
            <Input id="child-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            {errors["name"] && <p className="text-sm text-destructive">{errors["name"]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="child-dob">Date of birth</Label>
            <Input id="child-dob" type="date" max={today()} min={sixYearsAgo()} value={f.birth_date} onChange={(e) => setF({ ...f, birth_date: e.target.value })} />
            {errors["birth_date"] && <p className="text-sm text-destructive">{errors["birth_date"]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Family diet</Label>
            <Select value={f.diet_type} onValueChange={(v) => setF({ ...f, diet_type: v as DietType })}>
              <SelectTrigger aria-label="Family diet"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(DIET_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <Chips label="Foods your child enjoys" value={f.likes} onChange={(likes) => setF({ ...f, likes, dislikes: f.dislikes.filter((d) => !likes.includes(d)) })} />
        <Chips label="Foods your child refuses (optional)" tone="destructive" value={f.dislikes} onChange={(dislikes) => setF({ ...f, dislikes, likes: f.likes.filter((l) => !dislikes.includes(l)) })} />
        <div>
          <Label>Known allergies</Label>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ALLERGENS.map((a) => (
              <label key={a.value} className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
                <Checkbox checked={f.allergies.includes(a.value)} onCheckedChange={(c) => setF({ ...f, allergies: c ? [...f.allergies, a.value] : f.allergies.filter((x) => x !== a.value) })} />
                {a.label}
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save & see recommendations</Button>
          {canCancel && <Button type="button" variant="ghost" onClick={() => onDone()}>Cancel</Button>}
        </div>
      </div>
      <div className="hidden overflow-hidden rounded-2xl lg:block">
        <img src={babyImg} alt="Homemade Indian baby foods" width={1024} height={768} loading="lazy" className="h-full w-full object-cover" />
      </div>
    </form>
  );
}

function ChildPlan({ child }: { child: Child }) {
  const fn = useServerFn(getBabyRecommendations);
  const q = useQuery({ queryKey: ["baby-recs", child.id, child], queryFn: () => fn({ data: { childId: child.id } }), retry: false });

  if (q.isLoading) return <Loading label={`Finding foods for ${child.name}…`} />;
  if (q.error) return <ErrorBox message={friendlyError(q.error)} onRetry={() => q.refetch()} />;
  const d = q.data!;

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-primary p-6 text-primary-foreground shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{child.name} is</p>
          <p className="mt-2 font-display text-3xl font-semibold">{formatAge(d.months)}</p>
          <p className="mt-1 text-sm opacity-90">Stage: {d.stage.label} ({d.stage.range})</p>
          <p className="mt-4 flex items-start gap-2 text-sm"><Utensils className="mt-0.5 h-4 w-4 shrink-0" />{d.stage.meals}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4 text-primary" /> What to do now</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">{d.stage.guidance.map((g) => <li key={g}>• {g}</li>)}</ul>
        </div>
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
          <p className="flex items-center gap-2 font-semibold"><Ban className="h-4 w-4 text-destructive" /> Avoid at this age</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">{d.stage.avoid.map((a) => <li key={a}>• {a}</li>)}</ul>
        </div>
      </div>

      {d.months < 6 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center">
          <Milk className="mx-auto h-10 w-10 text-primary" />
          <p className="mt-3 font-medium">Breast milk or formula is all {child.name} needs right now.</p>
          <p className="mt-1 text-sm text-muted-foreground">Recipes will unlock automatically when {child.name} turns 6 months.</p>
        </div>
      ) : d.picks.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">No recipes match the current allergies and dislikes. Try removing a refused food.</p>
      ) : (
        <>
          <h2 className="mt-10 font-display text-2xl font-semibold">Recommended for {child.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {child.likes.length ? "Ranked by the foods your child enjoys, the right texture for their stage, and nutrition." : "Add foods your child enjoys to personalise this list."}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {d.picks.map((p, i) => (
              <RecipeCard
                key={p.recipe.id}
                recipe={p.recipe}
                top={<span className="rounded-full bg-foreground px-2.5 py-1 text-xs font-bold text-background">#{i + 1}</span>}
                footer={
                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">
                        {p.recipe.audience === "baby" ? `${p.recipe.min_age_months}–${p.recipe.max_age_months} months` : "Family dish"}
                      </span>
                      <span className="font-display text-xl font-semibold text-primary">{p.score}</span>
                    </div>
                    <Progress value={p.score} className="mt-1 h-1.5" />
                    <p className="mt-2 text-xs text-muted-foreground">{p.reason}</p>
                  </div>
                }
              />
            ))}
          </div>
        </>
      )}

      {d.excluded.length > 0 && (
        <details className="mt-8 rounded-2xl border border-border bg-card p-5 text-sm">
          <summary className="cursor-pointer font-medium">{d.excluded.length} baby recipes not suitable right now</summary>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {d.excluded.map((e) => (
              <li key={e.id}><Link to="/recipes/$slug" params={{ slug: e.slug }} className="font-medium hover:underline">{e.name}</Link> <span className="text-muted-foreground">— {e.reasons.join("; ")}</span></li>
            ))}
          </ul>
        </details>
      )}
      <p className="mt-6 text-xs text-muted-foreground">Guidance follows common infant feeding recommendations. Always check with your paediatrician, especially for allergies or premature babies.</p>
    </>
  );
}
