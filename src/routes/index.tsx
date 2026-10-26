import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ShieldCheck, Sparkles, CalendarDays, Calculator, Database, ArrowRight, ChefHat, HeartPulse, Baby } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/app-shell";
import { useAuth } from "@/hooks/use-auth";
import hero from "@/assets/foods/dishes.jpg";
import fruits from "@/assets/foods/fruits.jpg";
import legumes from "@/assets/foods/legumes.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NutriGuide – AI-Powered Diet Recommendation System" },
      { name: "description", content: "Calculate BMI, BMR and daily calories, then get allergy-safe food recommendations and full-day meal plans." },
      { property: "og:title", content: "NutriGuide – AI-Powered Diet Recommendation System" },
      { property: "og:description", content: "Personalised, explainable diet recommendations for every body and every goal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Calculator, title: "Calorie science", text: "BMI, Mifflin-St Jeor BMR and TDEE calculated from your profile, adjusted for your goal." },
  { icon: ShieldCheck, title: "Allergy-safe filtering", text: "Foods containing any of your allergens are removed before anything is ranked." },
  { icon: Sparkles, title: "Explainable scoring", text: "Every food gets a 0–100 score with a transparent breakdown and a plain-language reason." },
  { icon: CalendarDays, title: "Meal planning", text: "Balanced breakfast, lunch, snack and dinner built to hit your daily calorie target." },
  { icon: Database, title: "130+ foods", text: "Indian dishes, grains, produce, proteins and snacks with full macro data." },
  { icon: Activity, title: "Progress history", text: "Save plans and look back at your targets and macros over time." },
  { icon: ChefHat, title: "Indian recipe library", text: "Regional dishes from every corner of India with ingredients, step-by-step method and nutrition. Basic or Custom picks learned from dishes you like." },
  { icon: HeartPulse, title: "For every health need", text: "Rules for obesity, diabetes, heart disease, high blood pressure and senior-friendly soft food for grandparents." },
  { icon: Baby, title: "Baby Corner", text: "Age-staged baby food from 6 months to 5 years, ranked by what your child likes, with safety guidance." },
];

function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <div className="flex gap-2">
          {user ? (
            <Button asChild><Link to="/dashboard">Open dashboard</Link></Button>
          ) : (
            <>
              <Button asChild variant="ghost"><Link to="/auth" search={{}}>Log in</Link></Button>
              <Button asChild><Link to="/auth" search={{ mode: "signup" }}>Get started</Link></Button>
            </>
          )}
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> AI-powered diet recommendations
          </span>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Eat for <em className="text-primary">your</em> body, not someone else's.
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            NutriGuide turns your age, body, activity, goal, diet and allergies into a daily calorie target,
            ranked food recommendations and a ready-to-follow meal plan.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              {user ? (
                <Link to="/dashboard">Build my plan <ArrowRight className="ml-2 h-4 w-4" /></Link>
              ) : (
                <Link to="/auth" search={{ mode: "signup" }}>Build my plan <ArrowRight className="ml-2 h-4 w-4" /></Link>
              )}
            </Button>
            <Button asChild size="lg" variant="outline"><a href="#how">How it works</a></Button>
          </div>
        </div>
        <div className="relative">
          <img src={hero} alt="A colourful spread of Indian dishes" className="aspect-[4/5] w-full rounded-[2rem] object-cover shadow-lift" />
          <div className="absolute -bottom-6 -left-6 hidden w-56 rounded-2xl border border-border bg-card p-4 shadow-lift sm:block">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Daily target</p>
            <p className="font-display text-3xl font-semibold">1,940 <span className="text-sm font-normal text-muted-foreground">kcal</span></p>
            <div className="mt-2 flex h-2 overflow-hidden rounded-full">
              <div className="w-1/4 bg-macro-protein" /><div className="w-1/2 bg-macro-carbs" /><div className="w-1/4 bg-macro-fat" />
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="border-y border-border bg-card py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-4xl font-semibold tracking-tight">A complete recommendation pipeline</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">Profile → calorie model → safety filters → scoring engine → meal optimiser.</p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-border bg-background p-6">
                <Icon className="h-6 w-6 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2">
        <div className="grid grid-cols-2 gap-4">
          <img src={fruits} alt="Fresh fruit" className="aspect-square rounded-3xl object-cover" loading="lazy" />
          <img src={legumes} alt="Lentils and legumes" className="mt-10 aspect-square rounded-3xl object-cover" loading="lazy" />
        </div>
        <div>
          <h2 className="font-display text-4xl font-semibold tracking-tight">Scored out of 100, explained in one sentence.</h2>
          <p className="mt-4 text-muted-foreground">
            Diet compatibility (20) + allergy safety (20) + goal fit (25) + protein (20) + calorie fit (15).
            The rule-based engine is modular, so it can be swapped for a trained ML model later.
          </p>
          <Button asChild className="mt-6"><Link to="/auth" search={{ mode: "signup" }}>Create a free account</Link></Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        NutriGuide · MTech AI & Data Science project · Not medical advice.
      </footer>
    </div>
  );
}
