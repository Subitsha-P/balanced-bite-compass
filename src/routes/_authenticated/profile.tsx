import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { PageHeader } from "@/components/app-shell";
import { Loading, StatCard } from "@/components/nutri-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACTIVITY_LABELS, ALLERGENS, DIET_LABELS, GOAL_LABELS, calculateAll, type ActivityLevel, type Goal, type Gender } from "@/lib/nutrition";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Health profile – NutriGuide" }, { name: "description", content: "Your body metrics, goal, diet and allergies." }] }),
  component: ProfilePage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your name.").max(80),
  age: z.coerce.number().int().min(10, "Age must be 10–100.").max(100, "Age must be 10–100."),
  gender: z.enum(["male", "female"], { message: "Select a gender." }),
  height: z.coerce.number().min(100, "Height must be 100–250 cm.").max(250, "Height must be 100–250 cm."),
  weight: z.coerce.number().min(25, "Weight must be 25–300 kg.").max(300, "Weight must be 25–300 kg."),
  activity_level: z.enum(["sedentary", "light", "moderate", "very", "extreme"], { message: "Select an activity level." }),
  goal: z.enum(["lose", "maintain", "gain"], { message: "Select a goal." }),
  diet_type: z.enum(["vegetarian", "non_vegetarian", "vegan", "eggetarian"], { message: "Select a diet type." }),
  allergies: z.array(z.string()),
});

function ProfilePage() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [f, setF] = useState({ full_name: "", age: "", gender: "", height: "", weight: "", activity_level: "", goal: "", diet_type: "", allergies: [] as string[] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile)
      setF({
        full_name: profile.full_name ?? "",
        age: profile.age?.toString() ?? "",
        gender: profile.gender ?? "",
        height: profile.height?.toString() ?? "",
        weight: profile.weight?.toString() ?? "",
        activity_level: profile.activity_level ?? "",
        goal: profile.goal ?? "",
        diet_type: profile.diet_type ?? "",
        allergies: profile.allergies ?? [],
      });
  }, [profile]);

  if (isLoading) return <Loading />;
  const parsed = schema.safeParse(f);
  const preview = parsed.success ? calculateAll(parsed.data as never) : null;

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    setErrors({});
    setBusy(true);
    const { error } = await supabase.from("profiles").upsert({ user_id: user!.id, ...parsed.data, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) return toast.error("Could not save your profile. Please try again.");
    await qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Profile saved — your targets are updated.");
    navigate({ to: "/dashboard" });
  }

  const sel = (k: "gender" | "activity_level" | "goal" | "diet_type", label: string, opts: Record<string, string>) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={f[k]} onValueChange={(v) => setF({ ...f, [k]: v })}>
        <SelectTrigger aria-label={label}><SelectValue placeholder={`Select ${label.toLowerCase()}`} /></SelectTrigger>
        <SelectContent>{Object.entries(opts).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
      </Select>
      {errors[k] && <p className="text-sm text-destructive">{errors[k]}</p>}
    </div>
  );
  const num = (k: "age" | "height" | "weight", label: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} type="number" inputMode="decimal" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
      {errors[k] && <p className="text-sm text-destructive">{errors[k]}</p>}
    </div>
  );

  return (
    <>
      <PageHeader title="Health profile" subtitle="These details drive your calorie target and every recommendation." />
      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={save} className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
              {errors.full_name && <p className="text-sm text-destructive">{errors.full_name}</p>}
            </div>
            {num("age", "Age (years)")}
            {sel("gender", "Gender", { male: "Male", female: "Female" } satisfies Record<Gender, string>)}
            {num("height", "Height (cm)")}
            {num("weight", "Weight (kg)")}
            {sel("activity_level", "Activity level", ACTIVITY_LABELS satisfies Record<ActivityLevel, string>)}
            {sel("goal", "Goal", GOAL_LABELS satisfies Record<Goal, string>)}
            {sel("diet_type", "Diet type", DIET_LABELS)}
          </div>
          <div>
            <Label>Allergies</Label>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {ALLERGENS.map((a) => (
                <label key={a.value} className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
                  <Checkbox
                    checked={f.allergies.includes(a.value)}
                    onCheckedChange={(c) => setF({ ...f, allergies: c ? [...f.allergies, a.value] : f.allergies.filter((x) => x !== a.value) })}
                  />
                  {a.label}
                </label>
              ))}
            </div>
          </div>
          <Button type="submit" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save profile</Button>
        </form>
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Live calculation</p>
          {preview ? (
            <>
              <StatCard label="BMI" value={preview.bmi} hint={preview.bmiCategory} />
              <StatCard label="BMR (Mifflin-St Jeor)" value={preview.bmr} unit="kcal" />
              <StatCard label="TDEE" value={preview.tdee} unit="kcal" />
              <StatCard label="Daily target" value={preview.target} unit="kcal" />
            </>
          ) : (
            <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">Fill in all fields to see your BMI, BMR, TDEE and daily calorie target.</p>
          )}
        </div>
      </div>
    </>
  );
}
