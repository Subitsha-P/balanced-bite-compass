import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles, CalendarDays, UserRound, ChefHat, Baby } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { PageHeader } from "@/components/app-shell";
import { StatCard, Loading } from "@/components/nutri-ui";
import { Button } from "@/components/ui/button";
import { calculateAll, isCompleteProfile, GOAL_LABELS, DIET_LABELS, type HealthProfile } from "@/lib/nutrition";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard – NutriGuide" }, { name: "description", content: "Your calorie targets and nutrition overview." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: profile, isLoading } = useProfile();
  const plans = useQuery({
    queryKey: ["plans", "recent"],
    queryFn: async () => {
      const { data, error } = await supabase.from("meal_plans").select("id,created_at,total_calories,target_calories").order("created_at", { ascending: false }).limit(3);
      if (error) throw error;
      return data;
    },
  });
  if (isLoading) return <Loading />;
  const name = profile?.full_name?.split(" ")[0] || "there";

  if (!isCompleteProfile(profile as Partial<HealthProfile>)) {
    return (
      <>
        <PageHeader title={`Hello, ${name}`} subtitle="Let's set up your health profile so we can calculate your needs." />
        <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-soft">
          <UserRound className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 font-display text-2xl font-semibold">Complete your health profile</h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">Age, height, weight, activity, goal, diet type and allergies — it takes under a minute.</p>
          <Button asChild className="mt-6"><Link to="/profile">Set up profile <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
      </>
    );
  }

  const p = profile as unknown as HealthProfile;
  const c = calculateAll({ ...p, weight: Number(p.weight), height: Number(p.height), age: Number(p.age) });
  const macros = [
    { name: "Protein", g: Math.round((c.target * 0.25) / 4), color: "var(--macro-protein)" },
    { name: "Carbs", g: Math.round((c.target * 0.5) / 4), color: "var(--macro-carbs)" },
    { name: "Fat", g: Math.round((c.target * 0.25) / 9), color: "var(--macro-fat)" },
  ];

  return (
    <>
      <PageHeader title={`Hello, ${name}`} subtitle={`${GOAL_LABELS[p.goal]} · ${DIET_LABELS[p.diet_type]}`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="BMI" value={c.bmi} hint={c.bmiCategory} />
        <StatCard label="BMR" value={c.bmr.toLocaleString()} unit="kcal" hint="Energy at rest" />
        <StatCard label="TDEE" value={c.tdee.toLocaleString()} unit="kcal" hint="Maintenance calories" />
        <StatCard label="Daily target" value={c.target.toLocaleString()} unit="kcal" hint={GOAL_LABELS[p.goal]} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="font-semibold">Suggested daily macros</h2>
          <div className="h-44">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={macros} dataKey="g" innerRadius={50} outerRadius={75} paddingAngle={3}>
                  {macros.map((m) => <Cell key={m.name} fill={m.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 text-center text-sm">
            {macros.map((m) => (
              <div key={m.name}><p className="font-semibold">{m.g}g</p><p className="text-muted-foreground">{m.name}</p></div>
            ))}
          </div>
        </div>
        <div className="grid gap-4 lg:col-span-2 sm:grid-cols-2">
          <Link to="/recommendations" className="group rounded-2xl bg-primary p-6 text-primary-foreground shadow-soft transition hover:-translate-y-0.5">
            <Sparkles className="h-6 w-6" />
            <h3 className="mt-6 font-display text-2xl font-semibold">Your recommendations</h3>
            <p className="mt-1 text-sm opacity-80">Basic or custom picks for your goal, diet and health.</p>
          </Link>
          <Link to="/meal-plan" className="group rounded-2xl bg-accent p-6 text-accent-foreground shadow-soft transition hover:-translate-y-0.5">
            <CalendarDays className="h-6 w-6" />
            <h3 className="mt-6 font-display text-2xl font-semibold">Generate a meal plan</h3>
            <p className="mt-1 text-sm opacity-80">A full day built around {c.target} kcal.</p>
          </Link>
          <Link to="/recipes" className="group rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-0.5">
            <ChefHat className="h-6 w-6 text-primary" />
            <h3 className="mt-6 font-display text-2xl font-semibold">Indian recipes</h3>
            <p className="mt-1 text-sm text-muted-foreground">Recipes for diabetes, heart, BP, weight loss and grandparents.</p>
          </Link>
          <Link to="/baby" className="group rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-0.5">
            <Baby className="h-6 w-6 text-accent" />
            <h3 className="mt-6 font-display text-2xl font-semibold">Baby Corner</h3>
            <p className="mt-1 text-sm text-muted-foreground">Baby food by age and what your child likes.</p>
          </Link>
          <div className="rounded-2xl border border-border bg-card p-6 sm:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Recent saved plans</h3>
              <Link to="/history" className="text-sm text-primary hover:underline">View all</Link>
            </div>
            {plans.data?.length ? (
              <ul className="mt-3 divide-y divide-border">
                {plans.data.map((pl) => (
                  <li key={pl.id} className="flex justify-between py-2 text-sm">
                    <span>{new Date(pl.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
                    <span className="font-medium">{pl.total_calories} / {pl.target_calories} kcal</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No saved plans yet.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
