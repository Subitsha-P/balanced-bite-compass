import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { foodImage } from "@/lib/food-images";
import type { MealItem } from "@/lib/nutrition";

export function StatCard({ label, value, unit, hint }: { label: string; value: ReactNode; unit?: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold">
        {value}
        {unit && <span className="ml-1 text-base font-normal text-muted-foreground">{unit}</span>}
      </p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" /> {label}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const incomplete = /profile/i.test(message);
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
        <div>
          <p className="font-medium">{message}</p>
          <div className="mt-3 flex gap-2">
            {incomplete && (
              <Button asChild size="sm">
                <Link to="/profile">Complete profile</Link>
              </Button>
            )}
            {onRetry && (
              <Button size="sm" variant="outline" onClick={onRetry}>
                Try again
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MacroBar({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const p = protein * 4, c = carbs * 4, f = fat * 9;
  const t = p + c + f || 1;
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="bg-macro-protein" style={{ width: `${(p / t) * 100}%` }} />
      <div className="bg-macro-carbs" style={{ width: `${(c / t) * 100}%` }} />
      <div className="bg-macro-fat" style={{ width: `${(f / t) * 100}%` }} />
    </div>
  );
}

export function MacroLegend({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  return (
    <div className="flex flex-wrap gap-4 text-sm">
      <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-macro-protein" />Protein {protein}g</span>
      <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-macro-carbs" />Carbs {carbs}g</span>
      <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-macro-fat" />Fat {fat}g</span>
    </div>
  );
}

export function MealItemRow({ item }: { item: MealItem }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <img src={foodImage(item.image)} alt="" className="h-11 w-11 rounded-xl object-cover" loading="lazy" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.name}</p>
        <p className="text-xs text-muted-foreground">
          {item.servings} × {item.servingSize}
        </p>
      </div>
      <div className="text-right text-sm">
        <p className="font-semibold">{Math.round(item.calories)} kcal</p>
        <p className="text-xs text-muted-foreground">P {Math.round(item.protein)}g</p>
      </div>
    </div>
  );
}
